const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { remplacerModule, restaurerModule } = require('../fixtures/mock-db');

before(() => remplacerModule());
after(() => restaurerModule());

describe('Modèles — CRUD de base', () => {
  const models = [
    'Utilisateur', 'Professeur', 'Eleve', 'Parent', 'Admin',
    'Classe', 'Matiere', 'Note', 'Devoir', 'Bulletin',
    'Presence', 'Absence', 'Message', 'Document',
    'EmploiDuTemps', 'Seance', 'Notification',
    'PasswordResetToken', 'LogActivite', 'DemandeLiaison'
  ];

  const modelsAvecCRUD = [
    'Utilisateur', 'Professeur', 'Eleve', 'Parent', 'Admin',
    'Classe', 'Matiere', 'Note', 'Devoir', 'Bulletin',
    'Presence', 'Absence', 'Message', 'Document',
    'EmploiDuTemps', 'Seance', 'Notification',
    'PasswordResetToken', 'DemandeLiaison'
  ];
  const modelsSimplifies = ['LogActivite', 'ClasseMatiere'];

  for (const name of modelsAvecCRUD) {
    it(`${name} exporte les méthodes CRUD`, () => {
      const Model = require(`../../models/${name}`);
      assert.ok(typeof Model.findByPk === 'function', `${name} n'a pas findByPk`);
      assert.ok(typeof Model.findOne === 'function', `${name} n'a pas findOne`);
      assert.ok(typeof Model.findAll === 'function', `${name} n'a pas findAll`);
      assert.ok(typeof Model.create === 'function', `${name} n'a pas create`);
      assert.ok(typeof Model.update === 'function', `${name} n'a pas update`);
      assert.ok(typeof Model.destroy === 'function', `${name} n'a pas destroy`);
      assert.ok(typeof Model.count === 'function', `${name} n'a pas count`);
    });

    it(`${name}.findByPk retourne null avec un faux DB`, async () => {
      const Model = require(`../../models/${name}`);
      const resultat = await Model.findByPk(999);
      assert.strictEqual(resultat, null);
    });

    it(`${name}.findAll retourne [] avec un faux DB`, async () => {
      const Model = require(`../../models/${name}`);
      const rows = await Model.findAll({ where: { id: 999 } });
      assert.ok(Array.isArray(rows));
    });
  }

  for (const name of modelsSimplifies) {
    it(`${name} exporte les méthodes spécifiques`, () => {
      const Model = require(`../../models/${name}`);
      assert.ok(typeof Model.findAll === 'function', `${name} n'a pas findAll`);
      assert.ok(typeof Model.create === 'function', `${name} n'a pas create`);
    });
  }
});
