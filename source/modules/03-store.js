(function defineStore(root) {
  'use strict';

  const { clone } = root.YC.utils;
  const STORAGE_KEY = 'yen-center-lms-fe-state-v3';
  const LEGACY_STORAGE_KEY = 'yen-center-lms-fe-state-v2';
  const SESSION_KEY = 'yen-center-lms-fe-session-v3';

  function browserStorage() {
    try {
      return root.localStorage;
    } catch (_error) {
      return null;
    }
  }

  function create({ storage = browserStorage(), clock = () => new Date() } = {}) {
    let current;

    function persist() {
      if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(current));
    }

    function fresh(migrationNotice = null) {
      const seeded = root.YC.seed.createSeed(clock);
      seeded.migrationNotice = migrationNotice;
      return seeded;
    }

    function load() {
      if (storage) {
        try {
          const raw = storage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.schemaVersion === 3) return parsed;
          }
          if (storage.getItem(LEGACY_STORAGE_KEY)) {
            return fresh({ code: 'V2_RESET_REQUIRED', message: 'Dữ liệu v2 đã được thay bằng seed v3 để bảo toàn quan hệ nghiệp vụ.' });
          }
        } catch (_error) {
          return fresh({ code: 'CORRUPT_STATE_RESET', message: 'Dữ liệu local không hợp lệ đã được reset an toàn.' });
        }
      }
      return fresh();
    }

    current = load();
    persist();

    return Object.freeze({
      getState() { return current; },
      replace(next) {
        if (!next || next.schemaVersion !== 3) throw new Error('StateV3 required');
        current = clone(next);
        persist();
        return current;
      },
      reset() {
        current = fresh();
        persist();
        return current;
      },
      transact(mutator) {
        const draft = clone(current);
        const result = mutator(draft);
        current = draft;
        persist();
        return result;
      },
      storage,
      clock,
    });
  }

  root.YC.define('store', Object.freeze({ create, LEGACY_STORAGE_KEY, SESSION_KEY, STORAGE_KEY }));
})(globalThis);
