const { sequelize } = require('../config/database');
const Utilisateur = require('./Utilisateur');
const Professeur = require('./Professeur');
const Eleve = require('./Eleve');
const Parent = require('./Parent');
const Admin = require('./Admin');
const Classe = require('./Classe');
const Matiere = require('./Matiere');
const Devoir = require('./Devoir');
const Note = require('./Note');
const Bulletin = require('./Bulletin');
const Presence = require('./Presence');
const Absence = require('./Absence');
const Message = require('./Message');
const Document = require('./Document');
const EmploiDuTemps = require('./EmploiDuTemps');
const Seance = require('./Seance');
const Notification = require('./Notification');
const ClasseMatiere = require('./ClasseMatiere');
const PasswordResetToken = require('./PasswordResetToken');
const LogActivite = require('./LogActivite');
const DemandeLiaison = require('./DemandeLiaison');

Utilisateur.hasOne(Professeur, { foreignKey: 'utilisateur_id', as: 'profilProfesseur' });
Utilisateur.hasOne(Eleve, { foreignKey: 'utilisateur_id', as: 'profilEleve' });
Utilisateur.hasOne(Admin, { foreignKey: 'utilisateur_id', as: 'profilAdmin' });
Utilisateur.hasOne(Parent, { foreignKey: 'utilisateur_id', as: 'profilParent' });
Utilisateur.hasMany(Parent, { foreignKey: 'utilisateur_id', as: 'liaisonsParent' });
Professeur.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });
Eleve.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });
Admin.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });
Parent.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });

Parent.belongsTo(Eleve, { foreignKey: 'eleve_id', as: 'enfant' });
Eleve.hasMany(Parent, { foreignKey: 'eleve_id', as: 'parents' });

Classe.hasMany(Eleve, { foreignKey: 'classe_id', as: 'eleves' });
Eleve.belongsTo(Classe, { foreignKey: 'classe_id', as: 'classe' });

Professeur.belongsToMany(Classe, {
  through: 'professeur_classes',
  foreignKey: 'professeur_id',
  otherKey: 'classe_id',
  as: 'classes'
});
Classe.belongsToMany(Professeur, {
  through: 'professeur_classes',
  foreignKey: 'classe_id',
  otherKey: 'professeur_id',
  as: 'professeurs'
});

Professeur.belongsToMany(Matiere, {
  through: 'professeur_matieres',
  foreignKey: 'professeur_id',
  otherKey: 'matiere_id',
  as: 'matieres'
});
Matiere.belongsToMany(Professeur, {
  through: 'professeur_matieres',
  foreignKey: 'matiere_id',
  otherKey: 'professeur_id',
  as: 'professeurs'
});


Devoir.belongsTo(Professeur, { foreignKey: 'professeur_id', as: 'professeur' });
Devoir.belongsTo(Classe, { foreignKey: 'classe_id', as: 'classe' });
Devoir.belongsTo(Matiere, { foreignKey: 'matiere_id', as: 'matiere' });
Professeur.hasMany(Devoir, { foreignKey: 'professeur_id', as: 'devoirs' });
Classe.hasMany(Devoir, { foreignKey: 'classe_id', as: 'devoirs' });


Note.belongsTo(Eleve, { foreignKey: 'eleve_id', as: 'eleve' });
Note.belongsTo(Matiere, { foreignKey: 'matiere_id', as: 'matiere' });
Note.belongsTo(Professeur, { foreignKey: 'professeur_id', as: 'professeur' });
Eleve.hasMany(Note, { foreignKey: 'eleve_id', as: 'notes' });
Matiere.hasMany(Note, { foreignKey: 'matiere_id', as: 'notes' });


Bulletin.belongsTo(Eleve, { foreignKey: 'eleve_id', as: 'eleve' });
Bulletin.belongsTo(Classe, { foreignKey: 'classe_id', as: 'classe' });
Eleve.hasMany(Bulletin, { foreignKey: 'eleve_id', as: 'bulletins' });


Presence.belongsTo(Eleve, { foreignKey: 'eleve_id', as: 'eleve' });
Presence.belongsTo(Professeur, { foreignKey: 'professeur_id', as: 'professeur' });
Presence.belongsTo(Seance, { foreignKey: 'seance_id', as: 'seance' });
Eleve.hasMany(Presence, { foreignKey: 'eleve_id', as: 'presences' });


Absence.belongsTo(Eleve, { foreignKey: 'eleve_id', as: 'eleve' });
Absence.belongsTo(Presence, { foreignKey: 'presence_id', as: 'presence' });
Absence.belongsTo(Seance, { foreignKey: 'seance_id', as: 'seance' });
Eleve.hasMany(Absence, { foreignKey: 'eleve_id', as: 'absences' });


Message.belongsTo(Utilisateur, { foreignKey: 'expediteur_id', as: 'expediteur' });
Message.belongsTo(Utilisateur, { foreignKey: 'destinataire_id', as: 'destinataire' });
Utilisateur.hasMany(Message, { foreignKey: 'expediteur_id', as: 'messagesEnvoyes' });
Utilisateur.hasMany(Message, { foreignKey: 'destinataire_id', as: 'messagesRecus' });


Document.belongsTo(Eleve, { foreignKey: 'eleve_id', as: 'eleve' });
Eleve.hasMany(Document, { foreignKey: 'eleve_id', as: 'documents' });


EmploiDuTemps.belongsTo(Classe, { foreignKey: 'classe_id', as: 'classe' });
Classe.hasOne(EmploiDuTemps, { foreignKey: 'classe_id', as: 'emploiDuTemps' });


Seance.belongsTo(EmploiDuTemps, { foreignKey: 'emploi_du_temps_id', as: 'emploiDuTemps' });
Seance.belongsTo(Matiere, { foreignKey: 'matiere_id', as: 'matiere' });
Seance.belongsTo(Professeur, { foreignKey: 'professeur_id', as: 'professeur' });
EmploiDuTemps.hasMany(Seance, { foreignKey: 'emploi_du_temps_id', as: 'seances' });
Matiere.hasMany(Seance, { foreignKey: 'matiere_id', as: 'seances' });
Professeur.hasMany(Seance, { foreignKey: 'professeur_id', as: 'seances' });


Notification.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });
Utilisateur.hasMany(Notification, { foreignKey: 'utilisateur_id', as: 'notifications' });


Classe.belongsToMany(Matiere, {
  through: ClasseMatiere,
  foreignKey: 'classe_id',
  otherKey: 'matiere_id',
  as: 'matieres'
});
Matiere.belongsToMany(Classe, {
  through: ClasseMatiere,
  foreignKey: 'matiere_id',
  otherKey: 'classe_id',
  as: 'classes'
});
ClasseMatiere.belongsTo(Classe, { foreignKey: 'classe_id', as: 'classe' });
ClasseMatiere.belongsTo(Matiere, { foreignKey: 'matiere_id', as: 'matiere' });


PasswordResetToken.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });
Utilisateur.hasMany(PasswordResetToken, { foreignKey: 'utilisateur_id', as: 'resetTokens' });

LogActivite.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });
Utilisateur.hasMany(LogActivite, { foreignKey: 'utilisateur_id', as: 'logs' });

DemandeLiaison.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });
DemandeLiaison.belongsTo(Eleve, { foreignKey: 'eleve_id', as: 'eleve' });
Utilisateur.hasMany(DemandeLiaison, { foreignKey: 'utilisateur_id', as: 'demandesLiaison' });
Eleve.hasMany(DemandeLiaison, { foreignKey: 'eleve_id', as: 'demandesLiaison' });

module.exports = {
  sequelize,
  Utilisateur, Professeur, Eleve, Parent, Admin,
  Classe, Matiere, ClasseMatiere, Devoir, Note, Bulletin,
  Presence, Absence, Message, Document,
  EmploiDuTemps, Seance, Notification, PasswordResetToken, LogActivite,
  DemandeLiaison
};
