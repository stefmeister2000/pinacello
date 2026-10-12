const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('homepage has one visible branded studio link in the static footer', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const footer = html.match(/<footer>[\s\S]*?<\/footer>/)[0];
  assert.match(footer, /<p class="f-studio">Ontdek <a href="https:\/\/verkoop\.studio\/">verkoop\.studio<\/a><\/p>/);
  assert.equal((html.match(/href="https:\/\/verkoop\.studio\/"/g) || []).length, 1);
  assert.match(html, /footer \.f-studio a\{color:inherit;text-underline-offset:3px\}/);
});
