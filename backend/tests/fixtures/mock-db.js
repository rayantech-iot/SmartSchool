const REAL_DB = '../../config/db';

function creerPoolFake() {
  const stock = {};

  function query(sql, params) {
    return Promise.resolve([]);
  }

  function getOne(sql, params) {
    return Promise.resolve(null);
  }

  function insert(table, data) {
    return Promise.resolve({ insertId: 1, affectedRows: 1 });
  }

  function update(table, data, where) {
    return Promise.resolve({ affectedRows: 1 });
  }

  function remove(table, where) {
    return Promise.resolve({ affectedRows: 1 });
  }

  function count(table, where) {
    const clauses = Object.keys(where || {});
    if (!clauses.length) return Promise.resolve(0);
    const params = Object.values(where);
    const whereClause = clauses.map(k => `\`${k}\` = ?`).join(' AND ');
    return Promise.resolve(0);
  }

  function testConnection() {
    console.log('  [FAKE DB] Connexion simulée — OK');
    return Promise.resolve();
  }

  return { query, getOne, insert, update, remove, count, testConnection };
}

function remplacerModule() {
  const fake = creerPoolFake();
  require.cache[require.resolve(REAL_DB)] = { exports: fake };
  return fake;
}

function restaurerModule() {
  delete require.cache[require.resolve(REAL_DB)];
}

module.exports = { creerPoolFake, remplacerModule, restaurerModule };
