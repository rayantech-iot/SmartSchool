// ============================================================
// controllers/messageController.js — Messagerie interne SmartSchool
// ============================================================
const { Message, Utilisateur, Eleve, Classe, Parent } = require('../models');
const { Op } = require('sequelize');
const { getProfesseurParUtilisateur, getClassesDuProfesseur } = require('../services/professeurHelper');

const vueMessages = (type) => `${type}/messages`;

function limiteHistorique() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d;
}

async function destinatairesPourProfesseur(professeur) {
  const classes = await getClassesDuProfesseur(professeur);
  const classeIds = classes.map((c) => c.id);
  if (!classeIds.length) return { classes, destinataires: [] };

  const eleves = await Eleve.findAll({
    where: { classe_id: { [Op.in]: classeIds } },
    attributes: ['id', 'utilisateur_id']
  });
  const eleveIds = eleves.map((e) => e.id);
  const idsUtilisateurs = new Set(eleves.map((e) => e.utilisateur_id));

  if (eleveIds.length) {
    const parents = await Parent.findAll({
      where: { eleve_id: { [Op.in]: eleveIds } },
      attributes: ['utilisateur_id']
    });
    parents.forEach((p) => idsUtilisateurs.add(p.utilisateur_id));
  }

  const destinataires = await Utilisateur.findAll({
    where: { id: { [Op.in]: [...idsUtilisateurs] }, statut: 'actif' },
    order: [['nom', 'ASC'], ['prenom', 'ASC']]
  });

  return { classes, destinataires };
}

exports.inbox = async (req, res) => {
  try {
    const depuis = limiteHistorique();
    const messages = await Message.findAll({
      where: {
        destinataire_id: req.session.user.id,
        createdAt: { [Op.gte]: depuis }
      },
      include: [{ model: Utilisateur, as: 'expediteur' }],
      order: [['createdAt', 'DESC']]
    });

    const nonLus = messages.filter((m) => !m.lu).length;

    res.render(vueMessages(req.session.user.type), {
      titre: 'Messagerie — SmartSchool',
      messages,
      nonLus,
      user: req.session.user,
      section: 'inbox'
    });
  } catch (err) {
    console.error('Erreur inbox:', err);
    req.flash('error', 'Erreur lors du chargement de la messagerie.');
    return res.redirect('back');
  }
};

exports.sent = async (req, res) => {
  try {
    const depuis = limiteHistorique();
    const messages = await Message.findAll({
      where: {
        expediteur_id: req.session.user.id,
        createdAt: { [Op.gte]: depuis }
      },
      include: [{ model: Utilisateur, as: 'destinataire' }],
      order: [['createdAt', 'DESC']]
    });

    res.render(vueMessages(req.session.user.type), {
      titre: 'Messages envoyés — SmartSchool',
      messages,
      user: req.session.user,
      section: 'sent'
    });
  } catch (err) {
    console.error('Erreur messages envoyés:', err);
    return res.redirect('back');
  }
};

exports.compose = async (req, res) => {
  try {
    let destinataires = [];
    let classes = [];

    if (req.session.user.type === 'professeur') {
      const professeur = await getProfesseurParUtilisateur(req.session.user.id);
      if (!professeur) {
        req.flash('error', 'Profil professeur introuvable.');
        return res.redirect('/professeur/dashboard');
      }
      ({ classes, destinataires } = await destinatairesPourProfesseur(professeur));
    } else if (req.session.user.type === 'parent') {
      destinataires = await Utilisateur.findAll({
        where: { type: 'professeur', statut: 'actif' },
        order: [['nom', 'ASC']]
      });
    }

    res.render(vueMessages(req.session.user.type), {
      titre: 'Nouveau message — SmartSchool',
      destinataires,
      classes,
      user: req.session.user,
      section: 'compose'
    });
  } catch (err) {
    console.error('Erreur compose:', err);
    return res.redirect('back');
  }
};

exports.send = async (req, res) => {
  try {
    const { sujet, contenu, destinataire_id, classe_id, type_envoi } = req.body;
    const { notifier } = require('../services/notificationService');

    if (type_envoi === 'classe' && classe_id) {
      const professeur = req.session.user.type === 'professeur'
        ? await getProfesseurParUtilisateur(req.session.user.id)
        : null;
      if (professeur) {
        const classesProf = await getClassesDuProfesseur(professeur);
        if (!classesProf.some((c) => String(c.id) === String(classe_id))) {
          req.flash('error', 'Cette classe ne vous est pas affectée.');
          return res.redirect('back');
        }
      }

      const classe = await Classe.findByPk(classe_id, {
        include: [{
          model: Eleve,
          as: 'eleves',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
        }]
      });

      const cibles = new Set();
      if (classe?.eleves) {
        for (const eleve of classe.eleves) {
          if (eleve.utilisateur_id) cibles.add(eleve.utilisateur_id);
          const parents = await Parent.findAll({ where: { eleve_id: eleve.id } });
          parents.forEach((p) => cibles.add(p.utilisateur_id));
        }
      }

      for (const uid of cibles) {
        await Message.create({
          sujet,
          contenu,
          expediteur_id: req.session.user.id,
          destinataire_id: uid,
          type_envoi: 'classe'
        });
        const dest = await Utilisateur.findByPk(uid);
        await notifier(uid, {
          titre: 'Message de classe',
          contenu: sujet,
          type: 'message',
          lien: dest ? `/${dest.type}/messages` : '/login'
        });
      }
      req.flash('success', `Message envoyé à la classe ${classe ? classe.nom : ''} (élèves et parents).`);
    } else {
      await Message.create({
        sujet,
        contenu,
        expediteur_id: req.session.user.id,
        destinataire_id,
        type_envoi: 'individuel'
      });
      const destinataire = await Utilisateur.findByPk(destinataire_id);
      await notifier(destinataire_id, {
        titre: 'Nouveau message',
        contenu: sujet,
        type: 'message',
        lien: destinataire ? `/${destinataire.type}/messages` : '/login'
      });
      req.flash('success', 'Message envoyé avec succès.');
    }

    return res.redirect(`/${req.session.user.type}/messages`);
  } catch (err) {
    console.error('Erreur envoi message:', err);
    req.flash('error', "Erreur lors de l'envoi du message.");
    return res.redirect('back');
  }
};

exports.show = async (req, res) => {
  try {
    const message = await Message.findOne({
      where: {
        id: req.params.id,
        [Op.or]: [
          { destinataire_id: req.session.user.id },
          { expediteur_id: req.session.user.id }
        ]
      },
      include: [
        { model: Utilisateur, as: 'expediteur' },
        { model: Utilisateur, as: 'destinataire' }
      ]
    });

    if (!message) {
      return res.status(404).json({ error: 'Message introuvable' });
    }

    if (message.destinataire_id === req.session.user.id && !message.lu) {
      await message.update({ lu: true, date_lecture: new Date() });
    }
    res.json(message);
  } catch (err) {
    console.error('Erreur lecture message:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getNonLus = async (req, res) => {
  try {
    const count = await Message.count({
      where: {
        destinataire_id: req.session.user.id,
        lu: false,
        createdAt: { [Op.gte]: limiteHistorique() }
      }
    });
    res.json({ nonLus: count });
  } catch (err) {
    res.json({ nonLus: 0 });
  }
};
