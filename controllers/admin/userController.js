// ============================================================
// controllers/admin/userController.js — Gestion utilisateurs admin
// ============================================================
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Utilisateur, Professeur, Eleve, Parent, Admin, Classe, Matiere } = require('../../models');
const activityLog = require('../../services/activityLogService');
const passwordResetService = require('../../services/passwordResetService');
const accountInvitationService = require('../../services/accountInvitationService');
const mailService = require('../../services/mailService');
const matriculeService = require('../../services/matriculeService');
const { genererMotDePasseTemporaire } = require('../../services/passwordGenerator');
const { getAnneeScolaireCourante } = require('../../services/schoolYearService');

const PAGE_SIZE = 20;

async function verifierCapaciteClasse(classeId, excludeEleveId = null) {
  if (!classeId) return null;
  const classe = await Classe.findByPk(classeId, {
    include: [{ model: Eleve, as: 'eleves', attributes: ['id'] }]
  });
  if (!classe) return 'Classe introuvable.';
  const count = classe.eleves.filter((e) => e.id !== excludeEleveId).length;
  if (count >= classe.capacite) {
    return `La classe est pleine (${count}/${classe.capacite} élèves).`;
  }
  return null;
}

async function chargerProfil(type, utilisateurId) {
  if (type === 'professeur') return Professeur.findOne({ where: { utilisateur_id: utilisateurId } });
  if (type === 'eleve') return Eleve.findOne({ where: { utilisateur_id: utilisateurId } });
  if (type === 'parent') return Parent.findOne({ where: { utilisateur_id: utilisateurId } });
  if (type === 'admin') return Admin.findOne({ where: { utilisateur_id: utilisateurId } });
  return null;
}

async function inviterParentsEleve(req, eleveId, nomEleve, body) {
  const parentsCrees = [];
  const emails = [
    { email: body.parent_email, lien: body.parent_lien || 'tuteur' },
    { email: body.parent_email_2, lien: body.parent_lien_2 || 'tuteur' }
  ].filter((p) => p.email && p.email.trim());

  for (const { email, lien } of emails) {
    try {
      const res = await accountInvitationService.creerParentPourEleve(req, {
        eleveId,
        email,
        lien,
        nomEleve
      });
      if (res) parentsCrees.push(email.toLowerCase().trim());
    } catch (err) {
      console.error('Parent invitation:', err.message);
      throw err;
    }
  }
  return parentsCrees;
}

exports.utilisateurs = async (req, res) => {
  try {
    res.render('admin/utilisateurs', {
      titre: 'Gestion des utilisateurs — SmartSchool',
      user: req.session.user,
      lienReset: req.flash('lienReset')[0] || null,
      utilisateurResetEmail: req.flash('utilisateurResetEmail')[0] || null
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/dashboard');
  }
};

exports.apiUtilisateurs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const role = req.query.role || '';
    const q = (req.query.q || '').trim();
    const sort = req.query.sort || 'nom';
    const order = req.query.order === 'desc' ? 'DESC' : 'ASC';

    const where = {};
    if (role && role !== 'tous') where.type = role;
    if (q) {
      where[Op.or] = [
        { nom: { [Op.like]: `%${q}%` } },
        { prenom: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } }
      ];
    }

    const sortMap = {
      nom: ['nom', order],
      date: ['created_at', order],
      role: ['type', order]
    };
    const orderBy = [sortMap[sort] || sortMap.nom];

    const { count, rows } = await Utilisateur.findAndCountAll({
      where,
      order: orderBy,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      attributes: ['id', 'nom', 'prenom', 'email', 'type', 'statut', 'created_at']
    });

    res.json({
      utilisateurs: rows,
      pagination: {
        page,
        totalPages: Math.max(1, Math.ceil(count / PAGE_SIZE)),
        total: count,
        pageSize: PAGE_SIZE
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

exports.nouveauUtilisateur = async (req, res) => {
  const classes = await Classe.findAll({
    where: { annee_scolaire: getAnneeScolaireCourante() },
    order: [['niveau', 'ASC'], ['nom', 'ASC']]
  });
  const eleves = await Eleve.findAll({
    include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom'] }]
  });
  const matieres = await Matiere.findAll({ order: [['nom', 'ASC']] });
  res.render('admin/utilisateurForm', {
    titre: 'Nouvel utilisateur — SmartSchool',
    mode: 'create',
    utilisateur: null,
    profil: null,
    classes,
    eleves,
    matieres,
    profMatieres: [],
    profClasses: [],
    user: req.session.user
  });
};

exports.createUtilisateur = async (req, res) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    req.flash('error', erreurs.array()[0].msg);
    return res.redirect('/admin/utilisateurs/nouveau');
  }

  try {
    const { nom, prenom, email, type, motDePasse, telephone, classe_id, eleve_id, lien,
      specialite, grade, date_naissance, profession, niveau_acces, matricule } = req.body;

    const emailNorm = email.toLowerCase().trim();
    const existe = await Utilisateur.findOne({ where: { email: emailNorm } });
    if (existe) {
      req.flash('error', 'Cet email est déjà utilisé dans le système.');
      return res.redirect('/admin/utilisateurs/nouveau');
    }

    if (type === 'eleve' && classe_id) {
      const errCap = await verifierCapaciteClasse(parseInt(classe_id, 10));
      if (errCap) {
        req.flash('error', errCap);
        return res.redirect('/admin/utilisateurs/nouveau');
      }
    }

    let utilisateur;
    let invitationUrl = null;

    const utiliserInvitation = ['eleve', 'parent'].includes(type) && !motDePasse;

    if (utiliserInvitation) {
      const result = await accountInvitationService.creerCompteAvecInvitation(req, {
        nom, prenom, email: emailNorm, type, telephone, statut: 'actif'
      });
      utilisateur = result.utilisateur;
      invitationUrl = result.url;
    } else {
      const mdp = motDePasse || genererMotDePasseTemporaire();
      const hash = await bcrypt.hash(mdp, 12);
      utilisateur = await Utilisateur.create({
        nom, prenom, email: emailNorm,
        mot_de_passe: hash, type, telephone,
        statut: 'actif',
        doit_changer_mot_de_passe: !motDePasse
      });
      if (!motDePasse && type !== 'eleve' && type !== 'parent') {
        invitationUrl = await accountInvitationService.envoyerInvitation(req, utilisateur, type);
      }
    }

    if (type === 'professeur') {
      const prof = await Professeur.create({
        utilisateur_id: utilisateur.id,
        specialite: specialite || null,
        grade: grade || null
      });
      const matiereIds = [].concat(req.body.matieres || []).map(Number).filter(Boolean);
      const classeIds = [].concat(req.body.classes || []).map(Number).filter(Boolean);
      if (matiereIds.length) await prof.setMatieres(matiereIds);
      if (classeIds.length) await prof.setClasses(classeIds);
      if (!motDePasse) {
        invitationUrl = await accountInvitationService.envoyerInvitation(req, utilisateur, 'professeur');
      }
    } else if (type === 'eleve') {
      const matriculeFinal = matricule?.trim().toUpperCase() || await matriculeService.genererMatricule();
      const eleve = await Eleve.create({
        utilisateur_id: utilisateur.id,
        classe_id: classe_id || null,
        date_naissance: date_naissance || null,
        matricule: matriculeFinal
      });

      const parentsInvites = await inviterParentsEleve(req, eleve.id, nom, req.body);

      await activityLog.log(req, 'CREATION_UTILISATEUR', {
        type, email: utilisateur.email, id: utilisateur.id, matricule: matriculeFinal, parentsInvites
      });

      let msg = `Élève ${prenom} ${nom} créé (matricule ${matriculeFinal}). Email d'activation envoyé à l'élève.`;
      if (parentsInvites.length) {
        msg += ` Parents invités : ${parentsInvites.join(', ')}.`;
      }
      if (!mailService.estConfigure()) {
        msg += ' (SMTP non configuré — voir la console serveur pour les liens.)';
      }
      req.flash('success', msg);
      return res.redirect('/admin/utilisateurs');
    } else if (type === 'parent') {
      if (!eleve_id) {
        req.flash('error', 'Sélectionnez l\'enfant à lier pour le compte parent.');
        return res.redirect('/admin/utilisateurs/nouveau');
      }
      await Parent.create({
        utilisateur_id: utilisateur.id,
        eleve_id: parseInt(eleve_id, 10),
        lien: lien || 'tuteur',
        profession: profession || null
      });
    } else if (type === 'admin') {
      const niveau = niveau_acces === '2' ? 'super_admin' : 'admin';
      await Admin.create({ utilisateur_id: utilisateur.id, niveau_acces: niveau });
    }

    await activityLog.log(req, 'CREATION_UTILISATEUR', { type, email: utilisateur.email, id: utilisateur.id });

    let msg = `Utilisateur ${prenom} ${nom} créé avec succès.`;
    if (invitationUrl && ['parent', 'professeur', 'admin'].includes(type)) {
      msg += ' Email d\'activation envoyé.';
    }
    if (!mailService.estConfigure() && invitationUrl) {
      msg += ' (Liens dans la console serveur.)';
    }
    req.flash('success', msg);
    return res.redirect('/admin/utilisateurs');
  } catch (err) {
    console.error(err);
    req.flash('error', err.message || 'Erreur lors de la création du compte.');
    return res.redirect('/admin/utilisateurs/nouveau');
  }
};

exports.editUtilisateur = async (req, res) => {
  const utilisateur = await Utilisateur.findByPk(req.params.id);
  if (!utilisateur) {
    req.flash('error', 'Utilisateur introuvable.');
    return res.redirect('/admin/utilisateurs');
  }
  const profil = await chargerProfil(utilisateur.type, utilisateur.id);
  const classes = await Classe.findAll({ order: [['niveau', 'ASC'], ['nom', 'ASC']] });
  const eleves = await Eleve.findAll({
    include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom'] }]
  });

  let profMatieres = [];
  let profClasses = [];
  const matieres = await Matiere.findAll({ order: [['nom', 'ASC']] });
  if (utilisateur.type === 'professeur' && profil) {
    profMatieres = (await profil.getMatieres()).map((m) => m.id);
    profClasses = (await profil.getClasses()).map((c) => c.id);
  }

  res.render('admin/utilisateurForm', {
    titre: 'Modifier utilisateur — SmartSchool',
    mode: 'edit',
    utilisateur,
    profil,
    classes,
    eleves,
    profMatieres,
    profClasses,
    matieres,
    user: req.session.user
  });
};

exports.updateUtilisateur = async (req, res) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    req.flash('error', erreurs.array()[0].msg);
    return res.redirect(`/admin/utilisateurs/${req.params.id}/edit`);
  }

  try {
    const utilisateur = await Utilisateur.findByPk(req.params.id);
    if (!utilisateur) {
      req.flash('error', 'Utilisateur introuvable.');
      return res.redirect('/admin/utilisateurs');
    }

    const { nom, prenom, email, telephone, nouveauMotDePasse, classe_id, eleve_id, lien,
      grade, date_naissance, profession, niveau_acces } = req.body;

    const emailExiste = await Utilisateur.findOne({
      where: { email: email.toLowerCase().trim(), id: { [Op.ne]: utilisateur.id } }
    });
    if (emailExiste) {
      req.flash('error', 'Cet email est déjà utilisé par un autre compte.');
      return res.redirect(`/admin/utilisateurs/${req.params.id}/edit`);
    }

    const updates = { nom, prenom, email: email.toLowerCase().trim(), telephone };
    if (nouveauMotDePasse && nouveauMotDePasse.length >= 8) {
      updates.mot_de_passe = await bcrypt.hash(nouveauMotDePasse, 12);
      updates.doit_changer_mot_de_passe = false;
    }
    await utilisateur.update(updates);

    const profil = await chargerProfil(utilisateur.type, utilisateur.id);
    if (utilisateur.type === 'professeur' && profil) {
      await profil.update({ grade: grade || profil.grade, specialite: req.body.specialite || profil.specialite });
      const matiereIds = [].concat(req.body.matieres || []).map(Number).filter(Boolean);
      const classeIds = [].concat(req.body.classes || []).map(Number).filter(Boolean);
      await profil.setMatieres(matiereIds);
      await profil.setClasses(classeIds);
    } else if (utilisateur.type === 'eleve' && profil) {
      if (classe_id && parseInt(classe_id, 10) !== profil.classe_id) {
        const errCap = await verifierCapaciteClasse(parseInt(classe_id, 10), profil.id);
        if (errCap) {
          req.flash('error', errCap);
          return res.redirect(`/admin/utilisateurs/${req.params.id}/edit`);
        }
      }
      await profil.update({
        classe_id: classe_id || null,
        date_naissance: date_naissance || profil.date_naissance,
        matricule: req.body.matricule?.trim().toUpperCase() || profil.matricule
      });
    } else if (utilisateur.type === 'parent' && profil) {
      await profil.update({ eleve_id: eleve_id || null, lien: lien || profil.lien, profession: profession || null });
    } else if (utilisateur.type === 'admin' && profil) {
      const niveau = niveau_acces === '2' ? 'super_admin' : 'admin';
      await profil.update({ niveau_acces: niveau });
    }

    await activityLog.log(req, 'MODIFICATION_UTILISATEUR', { id: utilisateur.id, email: utilisateur.email });
    req.flash('success', 'Utilisateur modifié avec succès.');
    return res.redirect('/admin/utilisateurs');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors de la modification.');
    return res.redirect(`/admin/utilisateurs/${req.params.id}/edit`);
  }
};

exports.toggleStatut = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByPk(req.params.id);
    if (!utilisateur) {
      req.flash('error', 'Utilisateur introuvable.');
      return res.redirect('/admin/utilisateurs');
    }

    if (utilisateur.id === req.session.user.id) {
      req.flash('error', 'Vous ne pouvez pas désactiver votre propre compte.');
      return res.redirect('/admin/utilisateurs');
    }

    if (utilisateur.type === 'admin' && utilisateur.statut === 'actif') {
      const adminsActifs = await Utilisateur.count({ where: { type: 'admin', statut: 'actif' } });
      if (adminsActifs <= 1) {
        req.flash('error', 'Impossible de désactiver le dernier administrateur actif.');
        return res.redirect('/admin/utilisateurs');
      }
    }

    const ancien = utilisateur.statut;
    const nouveau = ancien === 'actif' ? 'inactif' : 'actif';
    await utilisateur.update({ statut: nouveau });

    await activityLog.log(req, nouveau === 'actif' ? 'REACTIVATION_COMPTE' : 'DESACTIVATION_COMPTE', {
      id: utilisateur.id, ancien, nouveau
    });

    req.flash('success', `Compte ${nouveau === 'actif' ? 'réactivé' : 'désactivé'} avec succès.`);
    return res.redirect('/admin/utilisateurs');
  } catch (err) {
    req.flash('error', 'Erreur lors de la modification du statut.');
    return res.redirect('/admin/utilisateurs');
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByPk(req.params.id);
    if (!utilisateur) {
      req.flash('error', 'Utilisateur introuvable.');
      return res.redirect('/admin/utilisateurs');
    }

    const { token } = await passwordResetService.creerLienActivation(utilisateur.id);
    const url = passwordResetService.construireUrl(req, token);

    await mailService.envoyerActivation({
      to: utilisateur.email,
      prenom: utilisateur.prenom,
      url,
      roleLabel: accountInvitationService.ROLE_LABELS[utilisateur.type] || utilisateur.type
    });

    await activityLog.log(req, 'REINITIALISATION_MOT_DE_PASSE', {
      id: utilisateur.id, email: utilisateur.email, type: 'email_48h'
    });

    const msg = mailService.estConfigure()
      ? `Email de réinitialisation envoyé à ${utilisateur.email} (lien valable 48 h).`
      : `Lien généré pour ${utilisateur.email} — SMTP non configuré, voir console serveur.`;
    req.flash('success', msg);

    if (!mailService.estConfigure()) {
      req.flash('lienReset', url);
      req.flash('utilisateurResetEmail', utilisateur.email);
    }
    return res.redirect('/admin/utilisateurs');
  } catch (err) {
    req.flash('error', 'Erreur lors de l\'envoi du lien.');
    return res.redirect('/admin/utilisateurs');
  }
};

exports.renvoyerInvitation = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByPk(req.params.id);
    if (!utilisateur) {
      req.flash('error', 'Utilisateur introuvable.');
      return res.redirect('/admin/utilisateurs');
    }
    await accountInvitationService.envoyerInvitation(req, utilisateur);
    req.flash('success', `Invitation renvoyée à ${utilisateur.email}.`);
    return res.redirect('/admin/utilisateurs');
  } catch (err) {
    req.flash('error', 'Erreur envoi invitation.');
    return res.redirect('/admin/utilisateurs');
  }
};
