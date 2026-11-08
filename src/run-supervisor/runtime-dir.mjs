// Where per-attempt control sockets live: owner-only, outside any run directory, short enough that
// `<dir>/<attempt hash>.sock` fits a unix socket path.

import fs from 'node:fs';
import path from 'node:path';

/** sockaddr_un.sun_path holds 108 bytes on Linux (104 on macOS) including the NUL. */
export const SOCKET_PATH_MAX_BYTES = 100;

/** Name length of a hashed attempt socket: 16 hex chars plus `.sock`. */
export const SOCKET_NAME_BYTES = 21;

export class RuntimeDirError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'RuntimeDirError';
    this.code = code;
  }
}

/** The one reader of the user runtime directory: `$XDG_RUNTIME_DIR` when it is an absolute path, else null. */
export function userRuntimeDir({ env = process.env } = {}) {
  const xdg = env.XDG_RUNTIME_DIR;
  return typeof xdg === 'string' && path.isAbsolute(xdg) ? xdg : null;
}

/** `$XDG_RUNTIME_DIR/fgos`, else `/tmp/fgos-<uid>`; pure path resolution (`ensureRuntimeSocketDir` creates and checks it). */
export function resolveRuntimeSocketDir({ env = process.env, uid = process.getuid?.() ?? 0 } = {}) {
  const xdg = userRuntimeDir({ env });
  return xdg ? path.join(xdg, 'fgos') : path.join('/tmp', `fgos-${uid}`);
}

/**
 * Creates the directory 0700 when missing and refuses one that is not a real directory owned by
 * the user with no group/other access, or whose socket paths would not fit `sun_path`.
 */
export function ensureRuntimeSocketDir(options = {}) {
  const uid = options.uid ?? process.getuid?.() ?? 0;
  const dir = resolveRuntimeSocketDir({ ...options, uid });
  if (Buffer.byteLength(dir) + 1 + SOCKET_NAME_BYTES > SOCKET_PATH_MAX_BYTES) {
    throw new RuntimeDirError('runtime-dir-too-long', `${dir} leaves no room for a socket name within ${SOCKET_PATH_MAX_BYTES} bytes`);
  }
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const st = fs.lstatSync(dir);
  if (!st.isDirectory()) {
    throw new RuntimeDirError('runtime-dir-not-directory', `${dir} is not a directory`);
  }
  if (st.uid !== uid) {
    throw new RuntimeDirError('runtime-dir-wrong-owner', `${dir} is owned by uid ${st.uid}, not ${uid}`);
  }
  if ((st.mode & 0o077) !== 0) {
    throw new RuntimeDirError('runtime-dir-permissions', `${dir} mode ${(st.mode & 0o777).toString(8)} allows group or other access`);
  }
  return dir;
}

const ATTEMPT_SOCKET_NAME = /^[0-9a-f]{16}\.sock$/;
const PROC_NET_UNIX = '/proc/net/unix';

/**
 * Paths some process has bound a unix socket to, read from the kernel table (Linux). `null` where
 * the table does not exist: nothing can then be judged, and nothing is removed. Probing
 * by connecting is not an option: a live supervisor takes the first connection for its gate.
 */
function boundSocketPaths(procFile) {
  let text;
  try {
    text = fs.readFileSync(procFile, 'utf8');
  } catch {
    return null;
  }
  const bound = new Set();
  for (const line of text.split('\n').slice(1)) {
    const fields = line.trim().split(/\s+/);
    if (fields.length >= 8) bound.add(fields.slice(7).join(' '));
  }
  return bound;
}

/**
 * Unlinks the attempt sockets (`<hash>.sock`) in the runtime directory that no process holds any more: the
 * supervisor that listened on one was killed before it could remove the path. Only socket files of this user,
 * never another file or a directory; a missing directory or kernel table removes nothing. Returns the paths removed.
 */
export function removeOrphanAttemptSockets({ env = process.env, uid = process.getuid?.(), procFile = PROC_NET_UNIX } = {}) {
  if (uid === undefined) return [];
  const dir = resolveRuntimeSocketDir({ env, uid });
  // The directory is listed before the table is read: a socket bound in between is then not in the
  // listing at all, instead of being listed while missing from an older table.
  let names;
  try {
    names = fs.readdirSync(dir);
  } catch {
    return [];
  }
  const bound = boundSocketPaths(procFile);
  if (bound === null) return [];
  const removed = [];
  for (const name of names.filter((entry) => ATTEMPT_SOCKET_NAME.test(entry)).sort()) {
    const file = path.join(dir, name);
    try {
      const st = fs.lstatSync(file);
      if (!st.isSocket() || st.uid !== uid || bound.has(file)) continue;
      fs.unlinkSync(file);
      removed.push(file);
    } catch {
      // gone while looking, or not ours to remove
    }
  }
  return removed;
}
