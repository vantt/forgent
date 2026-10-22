/**
 * scripts/lib/codex-auth-guard.mjs
 *
 * The Codex login guard of scripts/record-mailbox-hook-fixtures.mjs. A
 * recording run's CODEX_HOME holds auth.json as a symlink to the account's
 * real file, so a token refresh during the run writes the real file. Whether
 * Codex refreshes by writing in place or by renaming a new file over the
 * path could not be observed (no refresh happened during the recordings),
 * so the guard is safe for both: when the link was replaced by a plain file,
 * that file may hold the only valid, just-rotated refresh token, and it is
 * set aside, never deleted, and the run directory is never cleaned while it
 * exists.
 */
import fs from 'node:fs';
import path from 'node:path';

/** The name a replaced auth.json is set aside under, next to the link. */
export const ROTATED_AUTH = 'auth.json.rotated';

/** Whether `link` is still a symlink to `target`. */
export function isAuthLink(link, target) {
  const stat = fs.lstatSync(link, { throwIfNoEntry: false });
  return Boolean(stat && stat.isSymbolicLink() && fs.readlinkSync(link) === target);
}

/**
 * When `link` is no longer a symlink but a plain file, move it aside as
 * `auth.json.rotated` (mode 0600) and return the new path; otherwise return
 * null. Never deletes anything.
 */
export function setAsideReplacedAuth(link) {
  const stat = fs.lstatSync(link, { throwIfNoEntry: false });
  if (!stat || stat.isSymbolicLink()) return null;
  const aside = path.join(path.dirname(link), ROTATED_AUTH);
  fs.renameSync(link, aside);
  fs.chmodSync(aside, 0o600);
  return aside;
}

/** Every set-aside auth file under `dir`; cleaning must refuse while any exists. */
export function setAsideAuthFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { recursive: true })
    .map(String)
    .filter((entry) => path.basename(entry) === ROTATED_AUTH)
    .map((entry) => path.join(dir, entry));
}
