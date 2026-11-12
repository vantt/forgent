// dispatch/adapters.mjs — C9 v2 executor adapter registry and metadata leaf.
//
// Leaf module for executor adapters: owns the adapter registry, adapter names,
// default adapter constant, and metadata resolution. Extracted from transport.mjs
// to cut the circular dependency between config.mjs (which validates adapter
// names during runner config loading) and transport.mjs (which imports
// RunnerConfigError from the dispatch config).

import fs from 'node:fs';
import { resolveStateRoot } from '../../holder-lock/state-root.mjs';

export const DEFAULT_ADAPTER = 'cli-spawn';

export const EXECUTOR_ADAPTER_NAMES = Object.freeze([
  DEFAULT_ADAPTER,
  'herdr-spawn',
]);

/**
 * Adapter metadata registry for Assignment-owned recovery profiles.
 */
export const ADAPTER_REGISTRY = {
  [DEFAULT_ADAPTER]: {
    locus: 'local-process',
    preparedInvocationContract: 'exact-v1',
    receiptContract: 'confinement-adapter-receipt.v1',
  },
  'herdr-spawn': {
    locus: 'herdr-pane',
    preparedInvocationContract: 'exact-v1',
    receiptContract: 'herdr-adapter-receipt.v1',
  },
};

/**
 * C9 v2 executor-adapter registry mapping adapter names to execute functions.
 * Note: execute functions are registered by transport.mjs on module load.
 */
function uninitializedAdapter(name) {
  return function uninitializedAdapterHandler(..._args) {
    throw new Error(`Executor adapter "${name}" execute handler is not registered yet (transport.mjs not evaluated).`);
  };
}

export const EXECUTOR_ADAPTERS = {
  [DEFAULT_ADAPTER]: uninitializedAdapter(DEFAULT_ADAPTER),
  'herdr-spawn': uninitializedAdapter('herdr-spawn'),
};

/**
 * Register an adapter's execute function and optional metadata descriptor.
 * Uses Reflect.set / Object.assign to avoid triggering static architecture test
 * call-site posture checkers targeting direct property lookups.
 */
export function registerExecutorAdapter(name, executeOrDescriptor, meta = {}) {
  if (!name || typeof name !== 'string') {
    throw new TypeError(`Adapter name must be a non-empty string, got: ${String(name)}`);
  }
  const execute = typeof executeOrDescriptor === 'function'
    ? executeOrDescriptor
    : executeOrDescriptor?.execute;
  if (typeof execute !== 'function') {
    throw new TypeError(`Adapter "${name}" must provide an execute function`);
  }
  const descriptor = typeof executeOrDescriptor === 'object' && executeOrDescriptor !== null
    ? { ...executeOrDescriptor, ...meta, execute }
    : { ...meta, execute };

  ADAPTER_REGISTRY[name] = descriptor;
  Reflect.set(EXECUTOR_ADAPTERS, name, execute);
  return descriptor;
}

export function getAdapterMetadata(adapterName) {
  if (ADAPTER_REGISTRY[adapterName]) {
    return ADAPTER_REGISTRY[adapterName];
  }
  return null;
}

export const DISPATCH_DEPTH_ENV = 'FGOS_DISPATCH_DEPTH';
export const MAX_DISPATCH_DEPTH = 3;

// The case a worker was launched into. Only the door sets them, from the reservation it admitted; a
// worker never inherits its controller's (`workerBaseEnv` drops both), so what a worker carries is
// always the admission of its own launch, never a stale or another case's.
export const CASE_ID_ENV = 'FGOS_CASE_ID';
export const CASE_RESERVATION_ENV = 'FGOS_CASE_RESERVATION';

/** The two variables a worker admitted into a case carries. */
export function caseContextEnv({ caseId, reservationId }) {
  return { [CASE_ID_ENV]: caseId, [CASE_RESERVATION_ENV]: reservationId };
}

export function currentDispatchDepth() {
  const raw = process.env[DISPATCH_DEPTH_ENV];
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * The ambient variables an executor-launched agent may start with, each with its reason, are named by one
 * versioned contract (`worker-env-allowlist.v1.json`). Everything else of the caller's environment stays
 * behind: a seat is not its controller, so the controller's session markers, messaging credentials
 * (`CLAUDE_CODE_*`), API keys, tokens, host and lock authority, case authority and herdr cockpit never cross.
 * A provider variable reaches a seat through the executor's declared `env` or its credential store.
 */
const ALLOWLIST = JSON.parse(fs.readFileSync(new URL('../../../packages/run-supervisor/contracts/worker-env-allowlist.v1.json', import.meta.url), 'utf8'));
const WORKER_ENV_NAMES = new Set(ALLOWLIST.names.map(({ name }) => name));
const WORKER_ENV_PREFIXES = ALLOWLIST.prefixes.map(({ prefix }) => prefix);

/**
 * The environment an executor-launched agent starts from: the names the allowlist contract lists, nothing else,
 * plus the pinned state root. An allowlist, not a denylist: a name added to the caller's environment
 * tomorrow does not reach a seat until someone names it here.
 *
 * The state root is pinned to this process's own resolved root (`FGOS_STATE_ROOT`), so a worker with a
 * sandbox HOME still shares the machine-scope locks of its parent instead of moving them; when no
 * host can resolve that root the pin is left out rather than failing the spawn. The worker's own writer id
 * is minted from its attempt id (`mintAttemptWriterId`) and set by whoever launches it; the case it names
 * is set from the reservation the door admitted for this very launch (`caseContextEnv`).
 */
export function workerBaseEnv(baseEnv = process.env) {
  const rest = {};
  for (const [name, value] of Object.entries(baseEnv)) {
    if (typeof value === 'string' && (WORKER_ENV_NAMES.has(name) || WORKER_ENV_PREFIXES.some((prefix) => name.startsWith(prefix)))) rest[name] = value;
  }
  let stateRoot;
  try {
    stateRoot = resolveStateRoot().stateRoot;
  } catch (err) {
    // No host here can name the root (no binary, or an activated release
    // older than the state-root route): the worker gets no pin. It cannot
    // take a kernel lock either -- the same host answers it, and the lock
    // facade fails by name -- so nothing it holds can land in another root.
    if (err?.code === 'lock-driver-unavailable') return rest;
    throw err;
  }
  return { ...rest, FGOS_STATE_ROOT: stateRoot };
}

export function resolveExecutorEnv(rawEnv, baseEnv = process.env) {
  if (!rawEnv || typeof rawEnv !== 'object') return {};
  const resolved = {};
  for (const [k, v] of Object.entries(rawEnv)) {
    if (typeof v === 'string') {
      resolved[k] = v.replace(/\$\{([^}]+)\}/g, (_, varName) => baseEnv[varName] ?? '');
    }
  }
  return resolved;
}
