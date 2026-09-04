(function initializeNamespace(root) {
  'use strict';

  const registry = Object.create(null);
  const YC = root.YC || {};

  YC.define = function define(name, value) {
    if (Object.prototype.hasOwnProperty.call(registry, name)) {
      throw new Error(`Service already defined: ${name}`);
    }
    registry[name] = value;
    YC[name] = value;
    return value;
  };

  YC.require = function requireService(name) {
    if (!Object.prototype.hasOwnProperty.call(registry, name)) {
      throw new Error(`Unknown service: ${name}`);
    }
    return registry[name];
  };

  root.YC = YC;
})(globalThis);
