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

module.exports = {
  Utilisateur, Professeur, Eleve, Parent, Admin,
  Classe, Matiere, ClasseMatiere, Devoir, Note, Bulletin,
  Presence, Absence, Message, Document,
  EmploiDuTemps, Seance, Notification, PasswordResetToken, LogActivite,
  DemandeLiaison
};
