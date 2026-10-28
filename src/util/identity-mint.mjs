// Node facade over the Identity mint door: the rule lives in the Rust crate fgos-identity
// (docs/platform/identity/spec.md, section 4a), read in process through the native door like the writer identity.
// It decides nothing about an id; no door means WriterIdentityError, never a guessed id.
import fs from 'node:fs';
import os from 'node:os';
import { identityDoor } from './session-identity.mjs';

/** A new work item id, `tsk-<10 base32>`. */
export function mintWorkId() {
  return identityDoor().mintRandom('work');
}

/**
 * Mints this machine's id once under `stateRoot` (`<hostname slug>-<6 base32>`; the directory is created private); an
 * existing id is never replaced. Returns `{ changed, machineId, message }`; a malformed existing id throws.
 */
export function mintMachineId(stateRoot) {
  fs.mkdirSync(stateRoot, { recursive: true, mode: 0o700 });
  return identityDoor().mintMachineId(fs.realpathSync(stateRoot), os.hostname());
}

/**
 * Mints this machine's signing key once under `stateRoot`; an existing key is never replaced.
 * Returns `{ changed, fingerprint, message }`; a refusal (`ssh-keygen-missing`, ...) throws with the reason first.
 */
export function mintMachineKey(stateRoot) {
  fs.mkdirSync(stateRoot, { recursive: true, mode: 0o700 });
  return identityDoor().mintMachineKey(fs.realpathSync(stateRoot));
}
