/**
 * scripts/lib/codex-auth-guard.mjs
 *
 * The Codex login guard of every live run that starts Codex: the hook-fixture
 * recorder (scripts/record-mailbox-hook-fixtures.mjs) and the live suite
 * (test/live/mailbox-claude.live.mjs). A run's CODEX_HOME holds auth.json as
 * a symlink to the account's real file, so a token refresh during the run
 * writes the real file. Whether
 * Codex refreshes by writing in place or by renaming a new file over the
 * path could not be observed (no refresh happened during the recordings),
 * so the guard is safe for both: when the link was replaced by a plain file,
 * that file may hold the only valid, just-rotated refresh token, and it is
 * set aside, never deleted, and the run directory is never cleaned while it
 * exists. The same rule covers a login copied into a confined run (the V6
 * behaviour suite, scripts/lib/mailbox-live-confined.mjs): a copy whose bytes
 * differ from its snapshot after the run may hold the only valid token, and
 * is set aside under the same name.
 */
import crypto from 'node:crypto';
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
 * null. Never deletes anything: it throws rather than replace a file already
 * set aside there.
 */
export function setAsideReplacedAuth(link) {
  const stat = fs.lstatSync(link, { throwIfNoEntry: false });
  if (!stat || stat.isSymbolicLink()) return null;
  const aside = path.join(path.dirname(link), ROTATED_AUTH);
  if (fs.existsSync(aside)) throw new Error(`${aside} exists already; ${link} is left in place`);
  fs.renameSync(link, aside);
  fs.chmodSync(aside, 0o600);
  return aside;
}

/** The sha256 of a login file's bytes, the snapshot a copy is compared with. */
export function loginDigest(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/**
 * After a run that held a copied login at `copy`: null when the copy still has the bytes of
 * `snapshot` (its sha256 at copy time). Otherwise, the copy (changed, or replaced by another
 * entry) is moved to `asideDir`/auth.json.rotated, mode 0600, and that path is returned; a
 * missing copy returns `missing`, which the caller treats as changed. Never deletes anything:
 * it throws rather than replace a file already set aside there.
 */
export function setAsideChangedCopy(copy, snapshot, asideDir) {
  const stat = fs.lstatSync(copy, { throwIfNoEntry: false });
  if (!stat) return 'missing';
  if (stat.isFile() && loginDigest(copy) === snapshot) return null;
  const aside = path.join(asideDir, ROTATED_AUTH);
  if (fs.existsSync(aside)) throw new Error(`${aside} exists already; ${copy} is left in place`);
  fs.renameSync(copy, aside);
  fs.chmodSync(aside, 0o600);
  return aside;
}

/**
 * Every path under `dir`, never entering a symlinked directory: a run home
 * links the account's real directories (a Claude case HOME's `.claude` is the
 * owner's real `~/.claude`), and nothing there is the run's.
 */
function runFiles(dir) {
  const found = [];
  const pending = [dir];
  while (pending.length) {
    const at = pending.pop();
    let entries;
    try {
      entries = fs.readdirSync(at, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const file = path.join(at, entry.name);
      found.push(file);
      if (entry.isDirectory()) pending.push(file);
    }
  }
  return found;
}

/** Every set-aside auth file under `dir`; cleaning must refuse while any exists. */
export function setAsideAuthFiles(dir) {
  return runFiles(dir).filter((file) => path.basename(file) === ROTATED_AUTH);
}

/**
 * The check after a Codex run: null when the run home's auth.json is still the link to the
 * account's file (`isLink`) and the login still works (`loggedIn`). Otherwise a replaced file at
 * `link` is set aside first, and the refusal the caller exits 3 with is returned; its last line
 * is the kept file's path, so it is the last thing the operator reads.
 */
export function authRefusalAfterRun({ link, isLink, loggedIn, account }) {
  if (isLink && loggedIn) return null;
  const aside = setAsideReplacedAuth(link);
  const head = `the ${account} codex login link broke or its status failed (link ${isLink}, logged in ${loggedIn}); stop and ask the owner`;
  return aside ? `${head}. The replaced auth.json may hold the only valid token; it was kept (mode 0600) at:\n${aside}` : head;
}

/**
 * The one way a run directory is removed: refused while a set-aside auth file exists under
 * `dir` (the refusal is returned; the caller exits 3), removed otherwise (null). Symlinks
 * under it are removed as links, never followed.
 */
export function removeRunDir(dir) {
  // A run that died before its after-run check leaves a replaced link as a
  // plain auth.json: it is set aside here too (every run auth.json is a link).
  for (const file of runFiles(dir)) if (path.basename(file) === 'auth.json') setAsideReplacedAuth(file);
  const kept = setAsideAuthFiles(dir);
  if (kept.length) return `refusing to remove ${dir}: ${kept.join(', ')} may hold the account's only valid token; hand it to the owner first`;
  fs.rmSync(dir, { recursive: true, force: true });
  return null;
}
