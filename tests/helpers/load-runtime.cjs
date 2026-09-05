const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '../..');

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    snapshot() { return Object.fromEntries(values); },
  };
}

function loadYC(requiredServices = []) {
  const moduleDir = path.join(ROOT, 'source/modules');
  const files = fs.existsSync(moduleDir)
    ? fs.readdirSync(moduleDir).filter((name) => name.endsWith('.js')).sort()
    : [];
  const context = vm.createContext({
    console,
    structuredClone,
    Intl,
    URLSearchParams,
    setTimeout,
    clearTimeout,
  });
  for (const name of files) {
    vm.runInContext(fs.readFileSync(path.join(moduleDir, name), 'utf8'), context, { filename: name });
  }
  const YC = context.YC;
  assert.ok(YC, 'YC namespace should load');
  for (const service of requiredServices) {
    assert.ok(YC[service], `${service} service should exist`);
  }
  return YC;
}

module.exports = { ROOT, loadYC, memoryStorage };
