const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC, memoryStorage } = require('../helpers/load-runtime.cjs');

const FIXED_NOW = '2026-09-05T02:00:00.000Z';

function runtime() {
  const YC = loadYC(['seed', 'store', 'commands', 'router']);
  const store = YC.store.create({ storage: memoryStorage(), clock: () => FIXED_NOW });
  return { YC, store, state: () => store.getState() };
}

function frame(path = '/', actorId = null) {
  const { YC, state } = runtime();
  const current = state();
  const actor = actorId ? current.users.find((item) => item.id === actorId || item.role === actorId) : null;
  return YC.router.frame(path, { state: current, actor, learnerId: 'student-canonical', path });
}

test('brand uses the Cô Yến logo and Vietnamese name', () => {
  const html = frame('/');
  assert.match(html, /yen-logo-horizontal\.png/);
  assert.match(html, /Lớp Tiếng Anh Cô Yến/);
  assert.doesNotMatch(html, /Yen Center/);
});
