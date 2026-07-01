const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { escapeHtml } = require('../../utils/sanitize');

describe('escapeHtml()', () => {
  it('laisse une chaîne simple inchangée', () => {
    assert.strictEqual(escapeHtml('Bonjour le monde'), 'Bonjour le monde');
  });

  it('échappe < et >', () => {
    assert.strictEqual(escapeHtml('<script>alert("xss")</script>'),
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('échappe &', () => {
    assert.strictEqual(escapeHtml('a & b'), 'a &amp; b');
  });

  it('échappe les guillemets doubles', () => {
    assert.strictEqual(escapeHtml('"test"'), '&quot;test&quot;');
  });

  it('échappe les guillemets simples', () => {
    assert.strictEqual(escapeHtml("l'école"), 'l&#39;école');
  });

  it('retourne chaîne vide pour null', () => {
    assert.strictEqual(escapeHtml(null), '');
  });

  it('retourne chaîne vide pour undefined', () => {
    assert.strictEqual(escapeHtml(undefined), '');
  });

  it('convertit un nombre', () => {
    assert.strictEqual(escapeHtml(42), '42');
  });

  it('échappe une chaîne avec tous les caractères dangereux', () => {
    const input = '<a href="test" onclick=\'alert(1)\'>&</a>';
    const expected = '&lt;a href=&quot;test&quot; onclick=&#39;alert(1)&#39;&gt;&amp;&lt;/a&gt;';
    assert.strictEqual(escapeHtml(input), expected);
  });
});
