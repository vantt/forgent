// The old (v1) lock code, taken from the commit the cutover started from.
//
// The cutover deletes the v1 lock code from the tree, so the fence tests
// cannot import it from `src/`. This fixture materializes `src/` as it was
// at the base commit (`git archive <base> src`, the same bytes `git show
// <base>:<path>` gives for each file) into a scratch directory, next to a
// `node_modules` link (plus `scripts/lib`, which old `src/` modules import) so the old modules resolve their one dependency, and
// lets a test import any old module from there.
//
// Old lock acquires can block synchronously (`Atomics.wait` loops), which no
// in-process timer can interrupt, so `probeV1` runs a snippet against the
// extracted tree in a child process with a hard timeout and reports what
// it observed: a thrown error, a returned value, or a hang.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
/** The commit the holder-lock cutover started from; its `src/` still carries every v1 lock. */
export const DEFAULT_V1_BASE = 'a9e48b67d';

const extracted = new Map();

/**
 * Materialize `src/` of `base` into a scratch directory (once per process
 * and base). Returns `{dir, sha, modulePath(rel), importV1(rel), cleanup}`.
 */
export function extractV1Source({ base = DEFAULT_V1_BASE, repoRoot = REPO_ROOT } = {}) {
  if (extracted.has(base)) return extracted.get(base);
  const sha = execFileSync('git', ['rev-parse', '--verify', `${base}^{commit}`], { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-holder-lock-v1-'));
  const tarball = execFileSync('git', ['archive', '--format=tar', sha, 'src', 'scripts/lib'], { cwd: repoRoot, maxBuffer: 256 * 1024 * 1024 });
  execFileSync('tar', ['-x', '-C', dir], { input: tarball });
  fs.symlinkSync(path.join(repoRoot, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"module"}\n');
  const handle = {
    dir,
    sha,
    base,
    modulePath: (rel) => path.join(dir, rel),
    importV1: (rel) => import(pathToFileURL(path.join(dir, rel)).href),
    cleanup() {
      fs.rmSync(dir, { recursive: true, force: true });
      extracted.delete(base);
    },
  };
  extracted.set(base, handle);
  return handle;
}

/**
 * Run `body` (an async arrow source string, receiving `v1(rel)` to import
 * an old module) in a child process rooted at `cwd`, with `timeoutMs` as a
 * hard ceiling. Returns `{outcome: 'returned', value}`, `{outcome: 'threw',
 * name, code, message}` or `{outcome: 'hung'}`, plus `stderr` and `status`.
 * `wrapper` prefixes the node command (e.g. `['bwrap', ...]`).
 */
export function probeV1(handle, body, { cwd = handle.dir, timeoutMs = 10_000, env = process.env, wrapper = [] } = {}) {
  // The report line is written synchronously and the process exits right
  // after it: an old module may leave timers or handles behind, which must
  // not read as a hang.
  const script = [
    'import { pathToFileURL } from "node:url";',
    'import path from "node:path";',
    'import fs from "node:fs";',
    `const root = ${JSON.stringify(handle.dir)};`,
    'const v1 = (rel) => import(pathToFileURL(path.join(root, rel)).href);',
    `const body = ${body};`,
    'let report;',
    'try {',
    '  const value = await body(v1);',
    '  report = { outcome: "returned", value: value === undefined ? null : value };',
    '} catch (err) {',
    '  report = { outcome: "threw", name: err?.name ?? null, code: err?.code ?? null, message: String(err?.message ?? err) };',
    '}',
    'fs.writeSync(1, "\\n@@probe " + JSON.stringify(report) + "\\n");',
    'process.exit(0);',
  ].join('\n');
  const argv = [...wrapper, process.execPath, '--input-type=module', '-e', script];
  const res = spawnSync(argv[0], argv.slice(1), { cwd, encoding: 'utf8', timeout: timeoutMs, env, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 });
  const marker = (res.stdout ?? '').split('\n').find((line) => line.startsWith('@@probe '));
  const report = marker ? JSON.parse(marker.slice('@@probe '.length)) : { outcome: res.error?.code === 'ETIMEDOUT' || res.signal === 'SIGTERM' ? 'hung' : 'no-report' };
  return { ...report, status: res.status, signal: res.signal, stdout: res.stdout, stderr: res.stderr, spawnError: res.error ?? null };
}
