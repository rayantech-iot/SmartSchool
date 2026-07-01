const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  isValidEmail, isValidPassword, isValidName, isValidPhone,
  isValidMatricule, isValidNumeric, isValidDate, isNotEmpty,
  isValidLength, sanitizeInput
} = require('../../utils/validation');

describe('isValidEmail()', () => {
  it('accepte un email valide', () => assert.ok(isValidEmail('user@example.com')));
  it('accepte un email avec sous-domaines', () => assert.ok(isValidEmail('user@sub.domain.co')));
  it('rejette un email sans @', () => assert.ok(!isValidEmail('userexample.com')));
  it('rejette une chaîne vide', () => assert.ok(!isValidEmail('')));
  it('rejette null', () => assert.ok(!isValidEmail(null)));
});

describe('isValidPassword()', () => {
  it('accepte un mot de passe conforme', () => assert.ok(isValidPassword('Abcdef1!')));
  it('rejette sans majuscule', () => assert.ok(!isValidPassword('abcdef1!')));
  it('rejette sans chiffre', () => assert.ok(!isValidPassword('Abcdefgh!')));
  it('rejette trop court', () => assert.ok(!isValidPassword('Ab1!')));
});

describe('isValidName()', () => {
  it('accepte un prénom simple', () => assert.ok(isValidName('Jean')));
  it('accepte un nom composé', () => assert.ok(isValidName('Diop-Sarr')));
  it('accepte avec accents', () => assert.ok(isValidName('Élodie')));
  it('rejette trop court', () => assert.ok(!isValidName('A')));
  it('rejette avec chiffres', () => assert.ok(!isValidName('Jean2')));
});

describe('isValidPhone()', () => {
  it('accepte un numéro fixe', () => assert.ok(isValidPhone('0123456789')));
  it('accepte avec +', () => assert.ok(isValidPhone('+22890123456')));
  it('accepte avec espaces', () => assert.ok(isValidPhone('01 23 45 67 89')));
  it('rejette trop court', () => assert.ok(!isValidPhone('123')));
});

describe('isValidMatricule()', () => {
  it('accepte un matricule standard', () => assert.ok(isValidMatricule('STU-2024-001')));
  it('rejette trop court', () => assert.ok(!isValidMatricule('AB')));
});

describe('isValidNumeric()', () => {
  it('accepte un entier', () => assert.ok(isValidNumeric('42')));
  it('accepte un décimal', () => assert.ok(isValidNumeric('15.50')));
  it('rejette du texte', () => assert.ok(!isValidNumeric('abc')));
  it('respecte les bornes min/max', () => {
    assert.ok(isValidNumeric('5', 0, 20));
    assert.ok(!isValidNumeric('25', 0, 20));
  });
});

describe('isValidDate()', () => {
  it('accepte une date ISO', () => assert.ok(isValidDate('2024-09-01')));
  it('rejette un mauvais format', () => assert.ok(!isValidDate('01/09/2024')));
  it('rejette une date impossible', () => assert.ok(!isValidDate('2024-13-01')));
});

describe('isNotEmpty()', () => {
  it('accepte une chaîne non vide', () => assert.ok(isNotEmpty('texte')));
  it('rejette chaîne vide', () => assert.ok(!isNotEmpty('')));
  it('rejette null', () => assert.ok(!isNotEmpty(null)));
  it('rejette undefined', () => assert.ok(!isNotEmpty(undefined)));
});

describe('isValidLength()', () => {
  it('valide une chaîne dans les bornes', () => assert.ok(isValidLength('bonjour', 3, 10)));
  it('rejette trop courte', () => assert.ok(!isValidLength('ab', 3, 10)));
  it('rejette trop longue', () => assert.ok(!isValidLength('a'.repeat(11), 3, 10)));
});

describe('sanitizeInput()', () => {
  it('trim une chaîne', () => assert.strictEqual(sanitizeInput('  hello  '), 'hello'));
  it('retourne chaîne vide pour null', () => assert.strictEqual(sanitizeInput(null), ''));
});
