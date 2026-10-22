// Node facade over the Identity mint door: the rule lives in the Rust crate fgos-identity
// (docs/platform/identity/spec.md, section 4a), read in process through the native door like the writer identity.
// It decides nothing about an id; no door means WriterIdentityError, never a guessed id.
import { nativeDoor } from '../native/door.mjs';
import { WriterIdentityError } from './session-identity.mjs';

/** A new work item id, `tsk-<10 base32>`. */
export function mintWorkId() {
  let door;
  try {
    door = nativeDoor().sessionIdentity;
  } catch (err) {
    throw new WriterIdentityError('host-missing', `${err.message}; run through the \`fgos\` command of an activated workspace, or from a checkout through \`npm run fgos:dev\``);
  }
  return door.mintRandom('work');
}
