// Fetches the static ONNX Runtime archive that Linux x64 builds link pkm against, built and proved by
// .github/workflows/ort-static.yml on Ubuntu 22.04 (glibc 2.35, the release ceiling). The archive lands once per
// machine in $XDG_CACHE_HOME/fgos/ort-static/<version>/ (default ~/.cache), which the build entry points pass to
// ort-sys as ORT_LIB_LOCATION, and is accepted only when its sha256 equals the pin below. One copy serves every
// checkout and linked worktree, and the same path keeps a compiler cache hit across them. Other platforms link ONNX Runtime the way ort-sys does by default, so
// `ensure` does nothing there.
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ORT_VERSION = '1.31.1';
export const RELEASE_TAG = `ort-static-${ORT_VERSION}-linux-x64-glibc2.35`;
export const ARCHIVE_SHA256 = 'ad134d7ecbbabb487b8022f6ca31fbc001bd96c7fc898ef9bb6922cdd166ab72';
const ASSET_URL = `https://github.com/vantt/forgent/releases/download/${RELEASE_TAG}/libonnxruntime.a`;

/**
 * The machine folder of the archive. A relative XDG_CACHE_HOME is ignored, as the XDG base directory rule says. The
 * fallback is the account's home from the user database, not $HOME: a test or tool that points HOME at a scratch
 * folder must not make a build download the archive again.
 */
export function archiveDirectory(env = process.env) {
  const xdg = env.XDG_CACHE_HOME;
  const cache = xdg && path.isAbsolute(xdg) ? xdg : path.join(os.userInfo().homedir, '.cache');
  return path.join(cache, 'fgos', 'ort-static', ORT_VERSION);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

// A stamp beside the archive records the pin it was verified against with the file's size and mtime, so a build
// that finds it unchanged neither re-hashes 120 MB nor starts a child process.
function stampOf(file) {
  const stat = fs.statSync(file);
  return `${ARCHIVE_SHA256} ${stat.size} ${stat.mtimeMs}\n`;
}

function verified(file) {
  try { return fs.readFileSync(`${file}.verified`, 'utf8') === stampOf(file); } catch { return false; }
}

function stamp(file) {
  fs.writeFileSync(`${file}.verified`, stampOf(file));
}

export async function ensure({ env = process.env, platform = process.platform, arch = process.arch } = {}) {
  if (platform !== 'linux' || arch !== 'x64') return { skipped: `${platform}-${arch}` };
  const dir = archiveDirectory(env);
  const file = path.join(dir, 'libonnxruntime.a');
  if (verified(file)) return { file, fetched: false };
  if (fs.existsSync(file) && sha256(file) === ARCHIVE_SHA256) {
    stamp(file);
    return { file, fetched: false };
  }
  const response = await fetch(ASSET_URL);
  if (!response.ok) throw new Error(`ort-static: GET ${ASSET_URL} answered ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const digest = crypto.createHash('sha256').update(bytes).digest('hex');
  if (digest !== ARCHIVE_SHA256) throw new Error(`ort-static: ${RELEASE_TAG} has sha256 ${digest}, pinned ${ARCHIVE_SHA256}`);
  fs.mkdirSync(dir, { recursive: true });
  // Written beside the target and renamed, so a broken download never leaves a partial archive in place.
  const partial = `${file}.${process.pid}.partial`;
  fs.writeFileSync(partial, bytes);
  fs.renameSync(partial, file);
  stamp(file);
  return { file, fetched: true };
}

/**
 * The synchronous form the build scripts call before cargo, returning the environment cargo needs. A verified
 * archive returns at once; otherwise `ensure` runs in a child (the download is asynchronous) and a failure throws.
 * ort-sys reads only the unscoped ORT_LIB_LOCATION, with no per-target form, and a .cargo/config.toml [env] entry
 * cannot be removed for the macOS and Windows builds, so the Linux x64 entry points set it themselves.
 */
export function ensureOrtStatic(env = process.env) {
  if (process.platform !== 'linux' || process.arch !== 'x64') return {};
  const dir = archiveDirectory(env);
  if (!verified(path.join(dir, 'libonnxruntime.a'))) {
    // The child's report goes to stderr: a caller's stdout may be the answer of the script it builds for.
    execFileSync(process.execPath, [fileURLToPath(import.meta.url), 'ensure'], { stdio: ['ignore', process.stderr, 'inherit'], env });
  }
  return { ORT_LIB_LOCATION: dir };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [verb, ...rest] = process.argv.slice(2);
  if (verb !== 'ensure' || rest.length > 0) {
    console.error('usage: node scripts/ort-static.mjs ensure');
    process.exit(2);
  }
  try {
    const result = await ensure();
    console.log(result.skipped ? `ort-static: not needed on ${result.skipped}` : `ort-static: ${result.file}${result.fetched ? ' (fetched)' : ''}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
