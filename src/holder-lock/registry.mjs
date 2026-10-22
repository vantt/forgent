// registry.mjs -- the one list of locks, read from the shared data file
// packages/holder-lock/contracts/lock-registry.v1.json (Rust reads the same
// file). Resolves a row's path templates for a concrete caller: `<fgosDir>`,
// `<lockRoot>`, `<runDir>`, `<workflowRunDir>`, `<ref>`, `<provider>`,
// `<account>`, `<NN>`, `<id>` and `<cwdDevIno>`. A missing parameter is an error, never a guessed path.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HolderLockError } from './protocol.mjs';

const REGISTRY_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..', '..', 'packages', 'holder-lock', 'contracts', 'lock-registry.v1.json',
);

let registry = null;

/** The parsed registry, read once per process. */
export function loadLockRegistry() {
  if (!registry) registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  return registry;
}

/** The registry row named `name`. */
export function lockEntry(name) {
  const entry = loadLockRegistry().locks.find((lock) => lock.name === name);
  if (!entry) throw new HolderLockError('unknown-lock', `no lock named ${JSON.stringify(name)} in the registry`, { lock: name });
  return entry;
}

const PLACEHOLDER = /<([^<>]+)>/g;

/** `<dev>-<ino>-<birthtimeNs>` of the directory `cwd` names after realpath: one key for
 * every spelling of the same directory, symlinked or not. A cwd that does
 * not exist has no key (resolution then names the missing param). */
export function cwdDevIno(cwd) {
  if (typeof cwd !== 'string' || !cwd) return undefined;
  let stat;
  try {
    stat = fs.statSync(fs.realpathSync(path.resolve(cwd)), { bigint: true });
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return undefined;
    throw err;
  }
  return `${stat.dev}-${stat.ino}-${stat.birthtimeNs}`;
}

function placeholderValue(key, params) {
  if (key === 'cwdDevIno') return cwdDevIno(params.cwd);
  const value = params[key];
  return typeof value === 'string' && value ? value : undefined;
}

/** `template` with every placeholder filled from `params`; a placeholder with no value throws. */
function fillTemplate(template, params, { lock }) {
  return template.replace(PLACEHOLDER, (whole, key) => {
    const value = placeholderValue(key, params);
    if (value !== undefined) return value;
    throw new HolderLockError('lock-path-param-missing', `lock ${lock} needs ${key} to resolve ${template}`, { lock, param: key, template });
  });
}

/**
 * resolveLock(name, params) -> { name, kind, scope, rank, v3Path, lockDir }
 *
 * `v3Path` is absolute and exact. A row whose `v3Path` is null is Rust-owned
 * and cannot be taken from Node.
 */
export function resolveLock(name, params = {}) {
  const entry = lockEntry(name);
  if (typeof entry.v3Path !== 'string') {
    throw new HolderLockError('lock-not-node-owned', `lock ${name} has no v3 path for Node (owner ${entry.owner})`, { lock: name, owner: entry.owner });
  }
  const v3Path = path.resolve(fillTemplate(entry.v3Path, params, { lock: name }));
  return {
    name: entry.name,
    kind: entry.kind,
    scope: entry.scope,
    rank: entry.rank,
    v3Path,
    lockDir: path.dirname(v3Path),
  };
}
