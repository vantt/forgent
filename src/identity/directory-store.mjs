// The identity consumer of the Event Store: the shared directory of other
// machines' sessions. Its fold, signature check and cache belong to the Rust
// identity crate (packages/identity/rust/src/shared.rs), written when a verb
// resolves, lists or publishes; there is no second fold here. A rebuild drops
// that cache, so the next identity read folds the stream again and checks every
// signature again.
import fs from 'node:fs';
import path from 'node:path';
import { getMainFgosDir } from '../state/runtime-coordination.mjs';
import { FGOS_FILE, resolveFgosFile } from '../state/fgos-file-registry.mjs';

/** The consumer registry's rebuild port: the view is empty until an identity read refolds it. */
export function rebuildFromStore({ cwd, repoRoot }) {
  const dir = getMainFgosDir(path.join(cwd ?? repoRoot, '.fgos'));
  fs.rmSync(resolveFgosFile(dir, FGOS_FILE.IDENTITY_DIRECTORY), { force: true });
  return { entries: [], dropped: [] };
}
