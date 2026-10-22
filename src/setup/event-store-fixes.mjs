// Event Store setup fixes, registered in src/setup/registrations.mjs. Git RepositoryConfig remains the sole Git config writer.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { resolveStateRoot } from '../holder-lock/state-root.mjs';
import { ensureEventStoreRefspecs, mintEventStoreMachineId } from '../event-store/index.mjs';
import { eventStoreSetupContext } from './event-store-checks.mjs';

function realDirectory(dir) {
  const absolute = path.resolve(dir);
  const parent = path.dirname(absolute);
  if (parent !== absolute) realDirectory(parent);
  try { fs.mkdirSync(absolute, { mode: 0o700 }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
  const meta = fs.lstatSync(absolute);
  if (!meta.isDirectory() || meta.isSymbolicLink()) throw new Error(`unsafe directory: ${absolute}`);
}
export function fixEventStoreMachineId(cwd, options = {}) {
  const stateRoot = options.stateRoot ?? resolveStateRoot().stateRoot;
  fs.mkdirSync(stateRoot, { recursive: true, mode: 0o700 });
  const canonicalRoot = fs.realpathSync(stateRoot);
  return mintEventStoreMachineId(canonicalRoot, os.hostname(), options.loaderOptions);
}
export function fixEventStoreRefspec(cwd, options = {}) {
  const { base, facts, config } = eventStoreSetupContext(cwd, options);
  if (!facts.remoteFact.configured) return { changed: false, message: 'no remote configured' };
  const current = facts.expectedFetchRefspecs.every(r => facts.fetchRefspecs.includes(r)) && facts.provenance?.url === facts.remoteFact.url && facts.expectedFetchRefspecs.every(r => facts.provenance.refspecs.includes(r));
  if (!current) ensureEventStoreRefspecs(cwd, { ...base, trustedMain: facts.trustedMain, remote: config.remote });
  return { changed: !current, message: current ? 'fetch mappings current' : 'installed fetch mappings through Git RepositoryConfig' };
}
export function fixEventStoreLockDirs(cwd, options = {}) {
  const { facts } = eventStoreSetupContext(cwd, options);
  const locks = path.join(facts.openRoot, 'locks');
  let changed = true;
  try { const m = fs.lstatSync(locks); changed = !m.isDirectory() || m.isSymbolicLink() || (m.mode & 0o777) !== 0o700; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  realDirectory(locks);
  fs.chmodSync(locks, 0o700);
  return { changed, message: 'Event Store locks directory is mode 0700' };
}
