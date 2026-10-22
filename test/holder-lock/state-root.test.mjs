// The state-root vectors (packages/holder-lock/contracts/state-root.vectors.v1.json)
// that exercise the Node facade's one rule: a non-blank FGOS_STATE_ROOT is
// answered by Node alone (no addon needed); a blank one is no pin, so the
// in-process door is asked and its answer must match the vector. The formula
// behind every other vector lives only in Rust and is owned by
// packages/holder-lock/rust/tests/state_root_vectors.rs; this is the door's
// one wiring loop.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolveStateRoot } from '../../src/holder-lock/state-root.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const STATE_ROOT_URL = pathToFileURL(path.join(root, 'src', 'holder-lock', 'state-root.mjs')).href;
const vectors = JSON.parse(fs.readFileSync(path.join(root, 'packages', 'holder-lock', 'contracts', 'state-root.vectors.v1.json'), 'utf8'));
// The staged release the harness prepared: the door of a child finds its addon through these.
const DOOR_ENV = Object.fromEntries(['FGOS_HOST_BIN', 'FGOS_ACTIVE_RELEASE_PATH', 'FGOS_ACTIVE_MANIFEST_PATH'].filter((k) => process.env[k]).map((k) => [k, process.env[k]]));
const NEEDS_DOOR = DOOR_ENV.FGOS_ACTIVE_MANIFEST_PATH ? false : 'no staged release: run through the test harness (FGOS_ACTIVE_MANIFEST_PATH)';
const PLATFORM = process.platform === 'win32' ? 'windows' : process.platform;

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'holder-lock-state-root-'));
const script = path.join(scratch, 'resolve.mjs');
fs.writeFileSync(script, [
  `import { resolveStateRoot } from ${JSON.stringify(STATE_ROOT_URL)};`,
  'try {',
  '  process.stdout.write(JSON.stringify(resolveStateRoot()));',
  '} catch (err) {',
  '  process.stdout.write(JSON.stringify({ error: err.code ?? null, reason: err.reason ?? null, message: err.message }));',
  '}',
  '',
].join('\n'));

/** Run the resolver in a child whose environment is exactly `env`. */
function resolveIn(env) {
  const res = spawnSync(process.execPath, [script], { env, cwd: scratch, encoding: 'utf8', timeout: 20_000 });
  assert.equal(res.error, undefined, res.error?.message);
  assert.ok(res.stdout.trim(), `resolver printed nothing; stderr: ${res.stderr}`);
  return JSON.parse(res.stdout);
}

test.after(() => fs.rmSync(scratch, { recursive: true, force: true }));

for (const vector of vectors.vectors.filter((v) => 'FGOS_STATE_ROOT' in v.env)) {
  const platforms = vector.platforms ?? null;
  const offPlatform = platforms && !platforms.includes(PLATFORM) ? `vector is for ${platforms.join('/')}` : false;
  const pinned = vector.expect.source === 'pinned';
  test(`state-root vector: ${vector.name}`, { skip: offPlatform || (!pinned && NEEDS_DOOR) }, () => {
    const env = pinned ? { ...vector.env } : { ...vector.env, ...DOOR_ENV };
    const answer = resolveIn(env);
    assert.equal(answer.error, undefined, `resolver failed: ${answer.message}`);
    if (vector.expect.stateRootComponents) {
      assert.deepEqual(answer.stateRoot.split(path.sep), vector.expect.stateRootComponents);
    } else {
      assert.equal(answer.stateRoot, vector.expect.stateRoot);
      assert.equal(answer.lockRoot, vector.expect.lockRoot);
    }
    assert.equal(answer.source, vector.expect.source);
  });
}

test('a pinned root is read without any addon, fresh on every call', () => {
  const answer = resolveIn({ FGOS_STATE_ROOT: '/pinned/by/parent', HOME: '/sandbox/home' });
  assert.deepEqual(answer, { stateRoot: '/pinned/by/parent', lockRoot: '/pinned/by/parent/locks', source: 'pinned' });

  const saved = process.env.FGOS_STATE_ROOT;
  process.env.FGOS_STATE_ROOT = '/pinned/in/process';
  try {
    assert.equal(resolveStateRoot().stateRoot, '/pinned/in/process');
    assert.equal(resolveStateRoot({ env: { FGOS_STATE_ROOT: '/other' } }).stateRoot, '/other');
  } finally {
    if (saved === undefined) delete process.env.FGOS_STATE_ROOT;
    else process.env.FGOS_STATE_ROOT = saved;
  }
});

test('without a pin and without the addon the root is not guessed and the error names the dev door', () => {
  const answer = resolveIn({ HOME: '/sandbox/home' });
  assert.equal(answer.error, 'lock-driver-unavailable');
  assert.equal(answer.reason, 'addon-not-shipped');
  assert.match(answer.message, /npm run fgos:dev/);
});
