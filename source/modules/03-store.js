(function defineStore(root) {
  'use strict';

  const { clone } = root.YC.utils;
  const STORAGE_KEY = 'yen-center-lms-fe-state-v4';
  const V3_STORAGE_KEY = 'yen-center-lms-fe-state-v3';
  const LEGACY_STORAGE_KEY = 'yen-center-lms-fe-state-v2';
  const SESSION_KEY = 'yen-center-lms-fe-session-v4';

  function migrateV3(previous, clock = () => new Date()) {
    const baseline = root.YC.seed.createSeed(clock);
    const next = clone(previous);
    next.schemaVersion = 4;
    next.permissionDefinitions = baseline.permissionDefinitions;
    next.rolePermissions = baseline.rolePermissions;
    next.userPermissionOverrides = Array.isArray(next.userPermissionOverrides) ? next.userPermissionOverrides : [];
    next.changeRequests = Array.isArray(next.changeRequests) ? next.changeRequests : [];
    next.settings = { ...baseline.settings, ...(next.settings || {}) };
    next.organizations = (next.organizations || baseline.organizations).map((item) => ({ version: 1, ...item }));
    next.courses = (next.courses || []).map((item) => ({ version: 1, ...item }));
    next.courseVersions = (next.courseVersions || []).map((item) => ({ recordVersion: 1, ...item }));
    next.classes = (next.classes || []).map((item) => ({ version: 1, ...item }));
    next.sessions = (next.sessions || []).map((item) => ({ version: 1, ...item }));
    next.migrationNotice = { code: 'V3_MIGRATED', message: 'Đã nâng dữ liệu v3 lên schema v4 và giữ nguyên hành trình học tập.' };
    return next;
  }

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
          const rawV4 = storage.getItem(STORAGE_KEY);
          if (rawV4) {
            const parsed = JSON.parse(rawV4);
            if (parsed.schemaVersion === 4) return parsed;
          }
          const rawV3 = storage.getItem(V3_STORAGE_KEY);
          if (rawV3) {
            const parsed = JSON.parse(rawV3);
            if (parsed.schemaVersion === 3) return migrateV3(parsed, clock);
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
        if (!next || next.schemaVersion !== 4) throw new Error('StateV4 required');
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
        draft.currentAt = new Date(clock()).toISOString();
        const result = mutator(draft);
        current = draft;
        persist();
        return result;
      },
      storage,
      clock,
    });
  }

  root.YC.define('store', Object.freeze({ create, LEGACY_STORAGE_KEY, SESSION_KEY, STORAGE_KEY, V3_STORAGE_KEY, migrateV3 }));
})(globalThis);
