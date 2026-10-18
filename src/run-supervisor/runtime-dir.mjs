// Runtime socket directory: where per-attempt control sockets live. Owner-only, outside any
// run directory, and short enough that `<dir>/<attempt hash>.sock` fits a unix socket path.

import fs from 'node:fs';
import path from 'node:path';

/** sockaddr_un.sun_path holds 108 bytes on Linux (104 on macOS) including the NUL. */
export const SOCKET_PATH_MAX_BYTES = 100;

/** Name length of a hashed attempt socket: 16 hex chars plus `.sock`. */
const SOCKET_NAME_BYTES = 21;

export class RuntimeDirError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'RuntimeDirError';
    this.code = code;
  }
}

/**
 * `$XDG_RUNTIME_DIR/fgos`, else `/tmp/fgos-<uid>`. Pure path resolution: `ensureRuntimeSocketDir`
 * creates and checks it.
 */
export function resolveRuntimeSocketDir({ env = process.env, uid = process.getuid?.() ?? 0 } = {}) {
  const xdg = env.XDG_RUNTIME_DIR;
  if (typeof xdg === 'string' && path.isAbsolute(xdg)) return path.join(xdg, 'fgos');
  return path.join('/tmp', `fgos-${uid}`);
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
