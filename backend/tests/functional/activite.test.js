const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { remplacerModule, restaurerModule } = require('../fixtures/mock-db');

before(() => remplacerModule());
after(() => restaurerModule());

describe('ActivityLogService', () => {
  it('charge le module sans erreur', async () => {
    const activityLog = require('../../services/activityLogService');
    assert.ok(typeof activityLog.log === 'function');
    assert.ok(typeof activityLog.getIp === 'function');
  });

  it('la fonction log accepte un objet req minimal', async () => {
    const activityLog = require('../../services/activityLogService');
    const reqFake = {
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
      ip: '127.0.0.1',
      session: { user: { id: 1 } }
    };
    await assert.doesNotReject(
      activityLog.log(reqFake, 'TEST_ACTION', { details: 'test' }, 1)
    );
  });

  it('getIp extrait l\'IP du header x-forwarded-for', () => {
    const activityLog = require('../../services/activityLogService');
    const req = {
      headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
      ip: '10.0.0.1'
    };
    assert.strictEqual(activityLog.getIp(req), '192.168.1.1');
  });

  it('getIp utilise remoteAddress en fallback', () => {
    const activityLog = require('../../services/activityLogService');
    const req = {
      headers: {},
      socket: { remoteAddress: '10.0.0.2' },
      ip: '0.0.0.0'
    };
    assert.strictEqual(activityLog.getIp(req), '10.0.0.2');
  });
});
