const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '../..');
const MODULES = [
  path.join(ROOT, 'source/modules/00-namespace.js'),
  path.join(ROOT, 'source/modules/01-utils.js'),
];

function loadFoundation() {
  assert.ok(MODULES.every((file) => fs.existsSync(file)), 'foundation modules should exist');
  const context = vm.createContext({ console, structuredClone });
  for (const file of MODULES) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  }
  return context.YC;
}

test('namespace rejects accidental replacement of an existing service', () => {
  const YC = loadFoundation();
  YC.define('example', { value: 1 });

  assert.throws(() => YC.define('example', { value: 2 }), /already defined/);
  assert.equal(YC.require('example').value, 1);
});

test('escapeHtml neutralizes user-controlled markup', () => {
  const YC = loadFoundation();

  assert.equal(
    YC.utils.escapeHtml('<img src=x onerror="alert(1)"> & ok'),
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; ok'
  );
});

test('uid creates readable identifiers with distinct suffixes', () => {
  const YC = loadFoundation();

  const first = YC.utils.uid('event');
  const second = YC.utils.uid('event');

  assert.match(first, /^event-[a-z0-9]+-[a-z0-9]+$/);
  assert.notEqual(first, second);
});
