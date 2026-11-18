// The identity consumer of the Event Store: the shared directory of other
// machines' sessions. Its fold, signature check and cache belong to the Rust
// identity crate (packages/identity/rust/src/shared.rs), written when a verb
// resolves, lists or publishes; there is no second fold here. A rebuild drops
// that cache, so the next identity read folds the stream again and checks every
// signature again.
import fs from 'node:fs';
import { FGOS_FILE, resolveFgosFile } from '../util/fgos-file-registry.mjs';

/** The consumer registry's rebuild port: the view is empty until an identity read refolds it. */
export function rebuildFromStore({ fgosDir }) {
  // The caller hands over the main checkout's .fgos; a missing one must fail, never guess a tree to delete from.
  if (typeof fgosDir !== 'string' || fgosDir === '') throw new Error('identity-directory: rebuildFromStore needs fgosDir');
  fs.rmSync(resolveFgosFile(fgosDir, FGOS_FILE.IDENTITY_DIRECTORY), { force: true });
  return { entries: [], dropped: [] };
}
