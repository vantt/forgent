// Event Store setup fixes, registered in src/setup/registrations.mjs. Git RepositoryConfig remains the sole Git config writer.
import fs from 'node:fs';
import path from 'node:path';
import { resolveStateRoot } from '../holder-lock/state-root.mjs';
import { ensureEventStoreRefspecs } from '../event-store/index.mjs';
import { mintMachineId } from '../util/identity-mint.mjs';
import { eventStoreSetupContext } from './event-store-checks.mjs';

function realDirectory(dir) {
  const absolute = path.resolve(dir);
  const parent = path.dirname(absolute);
  if (parent !== absolute) realDirectory(parent);
  try { fs.mkdirSync(absolute, { mode: 0o700 }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
  const meta = fs.lstatSync(absolute);
  if (!meta.isDirectory() || meta.isSymbolicLink()) throw new Error(`unsafe directory: ${absolute}`);
}
/** Git's WAL refuses a group- or world-writable `fgos` directory in the Git common dir, so the open root
 * (`fgos/events` there), its parent and its locks directory are real 0700 directories. Returns whether any of them
 * was created or had another mode. */
function privateDirectories(openRoot) {
  const dirs = [path.dirname(openRoot), openRoot, path.join(openRoot, 'locks')];
  let changed = false;
  for (const dir of dirs) {
    try { const m = fs.lstatSync(dir); changed ||= !m.isDirectory() || m.isSymbolicLink() || (m.mode & 0o777) !== 0o700; }
    catch (error) { if (error.code !== 'ENOENT') throw error; changed = true; }
  }
  realDirectory(dirs.at(-1));
  for (const dir of dirs) fs.chmodSync(dir, 0o700);
  return changed;
}
/** `events migrate` repairs a missing machine id through the one Identity mint; never replaces an existing id. */
export function fixEventStoreMachineId(cwd, options = {}) {
  return mintMachineId(options.stateRoot ?? resolveStateRoot().stateRoot);
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
  const changed = privateDirectories(facts.openRoot);
  return { changed, message: 'Event Store locks directory and its parents up to the Git common dir are mode 0700' };
}
