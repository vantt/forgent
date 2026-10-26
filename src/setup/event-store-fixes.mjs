// The Event Store setup fix, registered in src/setup/registrations.mjs. The machine id belongs to Identity (`identity-machine-id`)
// and the fetch mappings to Git (`git-publication-refspecs`).
import fs from 'node:fs';
import path from 'node:path';
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
export function fixEventStoreLockDirs(cwd, options = {}) {
  const { facts } = eventStoreSetupContext(cwd, options);
  const changed = privateDirectories(facts.openRoot);
  return { changed, message: 'Event Store locks directory and its parents up to the Git common dir are mode 0700' };
}
