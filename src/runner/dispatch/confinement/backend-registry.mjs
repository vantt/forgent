// backend-registry.mjs — machine backend registry loader and schema validator
// for confinement-backend-registry.v1 (Phase 01 R5, docs/specs/confinement-authority.md §6.2-§6.2.1).
//
// Machine backend instances represent deployment configurations on this machine.
// Project-local configs are forbidden from defining or overriding `confinementBackends`
// (trust boundary §6.2.1, error confinement-backend-registry-forbidden).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { bwrapDriver } from './drivers/bwrap.mjs';

export class ConfinementBackendRegistryError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfinementBackendRegistryError';
  }
}

export const ALLOWED_DRIVER_TYPES = Object.freeze(['bwrap', 'container', 'remote']);

const DRIVER_REGISTRY = new Map();
DRIVER_REGISTRY.set('bwrap', bwrapDriver);

export function getBackendDriver(type) {
  if (typeof type !== 'string' || !ALLOWED_DRIVER_TYPES.includes(type) || !DRIVER_REGISTRY.has(type)) {
    throw new ConfinementBackendRegistryError(
      `unknown confinement backend driver type "${type}" (confinement-backend-unknown). Known types: ${Array.from(DRIVER_REGISTRY.keys()).join(', ')}.`,
    );
  }
  return DRIVER_REGISTRY.get(type);
}

export function registerBackendDriver(driver) {
  if (!driver || typeof driver !== 'object') {
    throw new ConfinementBackendRegistryError('driver must be an object.');
  }
  if (!ALLOWED_DRIVER_TYPES.includes(driver.type)) {
    throw new ConfinementBackendRegistryError(
      `cannot register driver for disallowed type "${driver.type}". Allowed types: ${ALLOWED_DRIVER_TYPES.join(', ')}.`,
    );
  }
  DRIVER_REGISTRY.set(driver.type, driver);
}

/**
 * Default machine backend registry template (spec §6.2).
 */
export const DEFAULT_MACHINE_BACKEND_REGISTRY = Object.freeze({
  contract: 'confinement-backend-registry.v1',
  confinementBackends: Object.freeze({
    bwrap: Object.freeze({
      type: 'bwrap',
      enabled: true,
      executable: '/usr/bin/bwrap',
    }),
  }),
});

/**
 * Validate one backend instance config according to its driver type schema (spec §6.2).
 */
export function validateBackendInstanceConfigShape(instanceId, config, label = 'confinement backend') {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new ConfinementBackendRegistryError(`runner config (${label}.${instanceId}) must be an object.`);
  }

  if (typeof config.type !== 'string' || !ALLOWED_DRIVER_TYPES.includes(config.type)) {
    throw new ConfinementBackendRegistryError(
      `runner config (${label}.${instanceId}) "type" must be one of ${ALLOWED_DRIVER_TYPES.join('/')}, got: ${JSON.stringify(config.type)}.`,
    );
  }

  if (config.enabled !== undefined && typeof config.enabled !== 'boolean') {
    throw new ConfinementBackendRegistryError(`runner config (${label}.${instanceId}) "enabled" must be a boolean when present.`);
  }

  if (config.type === 'bwrap') {
    const ALLOWED_BWRAP_KEYS = ['type', 'enabled', 'executable', 'tempRoot', 'privateHomeRoot'];
    for (const k of Object.keys(config)) {
      if (!ALLOWED_BWRAP_KEYS.includes(k)) {
        throw new ConfinementBackendRegistryError(
          `runner config (${label}.${instanceId}) contains unknown key "${k}" for type "bwrap". Allowed keys: ${ALLOWED_BWRAP_KEYS.join(', ')}.`,
        );
      }
    }
    if (config.executable !== undefined && (typeof config.executable !== 'string' || !config.executable.trim())) {
      throw new ConfinementBackendRegistryError(`runner config (${label}.${instanceId}) "executable" must be a non-empty string when present.`);
    }
    if (config.tempRoot !== undefined && (typeof config.tempRoot !== 'string' || !config.tempRoot.trim())) {
      throw new ConfinementBackendRegistryError(`runner config (${label}.${instanceId}) "tempRoot" must be a non-empty string when present.`);
    }
    if (config.privateHomeRoot !== undefined && (typeof config.privateHomeRoot !== 'string' || !config.privateHomeRoot.trim())) {
      throw new ConfinementBackendRegistryError(`runner config (${label}.${instanceId}) "privateHomeRoot" must be a non-empty string when present.`);
    }
  } else if (config.type === 'container') {
    const ALLOWED_CONTAINER_KEYS = ['type', 'enabled', 'runtime', 'image', 'pullPolicy'];
    for (const k of Object.keys(config)) {
      if (!ALLOWED_CONTAINER_KEYS.includes(k)) {
        throw new ConfinementBackendRegistryError(
          `runner config (${label}.${instanceId}) contains unknown key "${k}" for type "container". Allowed keys: ${ALLOWED_CONTAINER_KEYS.join(', ')}.`,
        );
      }
    }
    if (config.runtime !== 'docker' && config.runtime !== 'podman') {
      throw new ConfinementBackendRegistryError(
        `runner config (${label}.${instanceId}) "runtime" must be "docker" or "podman", got: ${JSON.stringify(config.runtime)}.`,
      );
    }
    if (typeof config.image !== 'string' || !config.image.trim()) {
      throw new ConfinementBackendRegistryError(`runner config (${label}.${instanceId}) "image" must be a non-empty string.`);
    }
    if (config.pullPolicy !== undefined && !['never', 'if-missing', 'always'].includes(config.pullPolicy)) {
      throw new ConfinementBackendRegistryError(
        `runner config (${label}.${instanceId}) "pullPolicy" must be one of never/if-missing/always, got: ${JSON.stringify(config.pullPolicy)}.`,
      );
    }
  } else if (config.type === 'remote') {
    const ALLOWED_REMOTE_KEYS = ['type', 'enabled', 'endpoint', 'credentialRef'];
    for (const k of Object.keys(config)) {
      if (!ALLOWED_REMOTE_KEYS.includes(k)) {
        throw new ConfinementBackendRegistryError(
          `runner config (${label}.${instanceId}) contains unknown key "${k}" for type "remote". Allowed keys: ${ALLOWED_REMOTE_KEYS.join(', ')}.`,
        );
      }
    }
    if (typeof config.endpoint !== 'string' || !config.endpoint.trim()) {
      throw new ConfinementBackendRegistryError(`runner config (${label}.${instanceId}) "endpoint" must be a non-empty string.`);
    }
    if (typeof config.credentialRef !== 'string' || !config.credentialRef.trim()) {
      throw new ConfinementBackendRegistryError(`runner config (${label}.${instanceId}) "credentialRef" must be a non-empty string.`);
    }
  }
}

/**
 * Validate full machine confinement backend registry document (spec §6.2).
 */
export function validateBackendRegistryShape(doc, label = 'machine confinement backend registry') {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new ConfinementBackendRegistryError(`runner config (${label}) must be an object.`);
  }

  const ALLOWED_DOC_KEYS = ['contract', 'confinementBackends'];
  for (const k of Object.keys(doc)) {
    if (!ALLOWED_DOC_KEYS.includes(k)) {
      throw new ConfinementBackendRegistryError(`runner config (${label}) contains unknown key "${k}". Allowed keys: ${ALLOWED_DOC_KEYS.join(', ')}.`);
    }
  }

  if (doc.contract !== 'confinement-backend-registry.v1') {
    throw new ConfinementBackendRegistryError(
      `runner config (${label}) "contract" must be "confinement-backend-registry.v1", got: ${JSON.stringify(doc.contract)}.`,
    );
  }

  if (!doc.confinementBackends || typeof doc.confinementBackends !== 'object' || Array.isArray(doc.confinementBackends)) {
    throw new ConfinementBackendRegistryError(`runner config (${label}) "confinementBackends" must be an object mapping instanceId to backend config.`);
  }

  for (const [instanceId, instanceConfig] of Object.entries(doc.confinementBackends)) {
    if (typeof instanceId !== 'string' || !instanceId.trim()) {
      throw new ConfinementBackendRegistryError(`runner config (${label}) backend instance key must be a non-empty string.`);
    }
    validateBackendInstanceConfigShape(instanceId, instanceConfig, `${label}.confinementBackends`);
  }
  return doc;
}

/**
 * Rejects project-local attempts to define or override machine backend instances (spec §6.2.1, §6.8).
 */
export function rejectProjectBackendOverride(projectConfig, label = 'project config') {
  if (!projectConfig || typeof projectConfig !== 'object') return;

  if (projectConfig.confinementBackends !== undefined || projectConfig.runner?.confinementBackends !== undefined) {
    throw new ConfinementBackendRegistryError(
      `runner config (${label}) cannot define or override "confinementBackends" — machine backend instance deployment config is managed at the machine level (confinement-backend-registry-forbidden).`,
    );
  }
}

/**
 * Resolve the on-disk location of the machine confinement backend registry.
 */
export function resolveMachineBackendRegistryPath() {
  return (
    process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH ||
    path.join(os.homedir(), '.fgos', 'confinement-backends.json')
  );
}

/**
 * Read and validate the machine backend registry document from disk (spec §6.2.1).
 * Returns empty registry document if file is missing.
 */
export function loadMachineBackendRegistry(registryPath = resolveMachineBackendRegistryPath()) {
  if (!fs.existsSync(registryPath)) {
    return { contract: 'confinement-backend-registry.v1', confinementBackends: {} };
  }

  let raw;
  try {
    raw = fs.readFileSync(registryPath, 'utf8');
  } catch (err) {
    throw new ConfinementBackendRegistryError(`cannot read machine backend registry at "${registryPath}": ${err.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new ConfinementBackendRegistryError(`machine backend registry at "${registryPath}" is not valid JSON: ${err.message}`);
  }

  validateBackendRegistryShape(parsed, registryPath);
  return parsed;
}

function deepFreeze(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    deepFreeze(obj[key]);
  }
  return obj;
}

/**
 * Creates an immutable snapshot for a dispatch with a `.resolve(instanceId)` method (spec §6.5).
 */
export function createBackendRegistrySnapshot(doc) {
  validateBackendRegistryShape(doc);
  const frozenDoc = deepFreeze(JSON.parse(JSON.stringify(doc)));

  return Object.freeze({
    contract: frozenDoc.contract,
    confinementBackends: frozenDoc.confinementBackends,
    resolve(instanceId) {
      if (typeof instanceId !== 'string' || !instanceId.trim()) return null;
      const instance = frozenDoc.confinementBackends?.[instanceId];
      if (!instance || instance.enabled === false) return null;
      return Object.freeze({
        id: instanceId,
        type: instance.type,
        config: Object.freeze({ ...instance }),
      });
    },
  });
}

/**
 * Bootstraps missing defaults in machine backend registry without overwriting existing custom configs (spec §11.5, R6).
 */
export function ensureMachineBackendRegistryDefaults(registryPath = resolveMachineBackendRegistryPath()) {
  if (!fs.existsSync(registryPath)) {
    validateBackendRegistryShape(DEFAULT_MACHINE_BACKEND_REGISTRY, registryPath);
    fs.mkdirSync(path.dirname(registryPath), { recursive: true });
    fs.writeFileSync(registryPath, `${JSON.stringify(DEFAULT_MACHINE_BACKEND_REGISTRY, null, 2)}\n`);
    return {
      created: true,
      changed: true,
      path: registryPath,
      message: `bootstrapped machine backend registry at ${registryPath} with default bwrap instance`,
    };
  }

  let existing;
  try {
    existing = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  } catch (err) {
    return {
      created: false,
      changed: false,
      path: registryPath,
      message: `skipped -- cannot parse machine backend registry at "${registryPath}": ${err.message}`,
    };
  }

  const existingBackends = existing.confinementBackends && typeof existing.confinementBackends === 'object' && !Array.isArray(existing.confinementBackends)
    ? existing.confinementBackends
    : {};

  let changed = false;
  const mergedBackends = { ...existingBackends };

  // L-b: do not inject a default bwrap instance into a machine registry whose operator declared only custom instances
  if (Object.keys(existingBackends).length === 0) {
    for (const [key, defaultCfg] of Object.entries(DEFAULT_MACHINE_BACKEND_REGISTRY.confinementBackends)) {
      if (mergedBackends[key] === undefined) {
        mergedBackends[key] = defaultCfg;
        changed = true;
      }
    }
  }

  if (existing.contract !== 'confinement-backend-registry.v1') {
    changed = true;
  }
  const knownKeys = ['contract', 'confinementBackends'];
  for (const k of Object.keys(existing)) {
    if (!knownKeys.includes(k)) {
      changed = true;
      break;
    }
  }

  const updated = {
    contract: 'confinement-backend-registry.v1',
    confinementBackends: mergedBackends,
  };

  try {
    validateBackendRegistryShape(updated, registryPath);
  } catch (err) {
    return {
      created: false,
      changed: false,
      path: registryPath,
      message: `skipped -- cannot repair machine backend registry at "${registryPath}": ${err.message}`,
    };
  }

  if (changed) {
    fs.writeFileSync(registryPath, `${JSON.stringify(updated, null, 2)}\n`);
    return {
      created: false,
      changed: true,
      path: registryPath,
      message: `added missing default backend instances to ${registryPath}`,
    };
  }

  return {
    created: false,
    changed: false,
    path: registryPath,
    message: `machine backend registry at ${registryPath} is already up to date`,
  };
}
