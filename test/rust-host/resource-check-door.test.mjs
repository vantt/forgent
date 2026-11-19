// The planner door through the built host binary: the single wiring proof of `fgos resource-check`. It runs the
// binary on a hand-built bad plan directory and a hand-built good one and checks the colliding pair, the shared
// path, the finding codes and the exit codes. The rule cases belong to the packages (write-scope, graph,
// resource-referee) and the input-refusal cases to apps/fgos/src/wiring/resource_check.rs.
import '../helpers/process-tmp-root.mjs';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BINARY_NAME = process.platform === 'win32' ? 'fgos.exe' : 'fgos';
const HOST = process.env.FGOS_HOST_BIN ?? path.join(path.resolve(REPO_ROOT, process.env.CARGO_TARGET_DIR ?? 'target'), 'debug', BINARY_NAME);

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-resource-check-'));
after(() => fs.rmSync(scratch, { recursive: true, force: true }));

function plan(name, rows) {
  const dir = path.join(scratch, name);
  fs.mkdirSync(dir);
  const table = ['| id | title | depends-on | footprint | wave | status |', '|---|---|---|---|---|---|', ...rows].join('\n');
  fs.writeFileSync(path.join(dir, 'plan.md'), `---\ncontract: plan-v1\ntitle: t\nstatus: ready\npriority: P2\ncreated: 2026-11-19\n---\n\n# t\n\n${table}\n`);
  return dir;
}

function door(args) {
  const result = spawnSync(HOST, ['resource-check', ...args], { cwd: scratch, encoding: 'utf8', timeout: 60000 });
  assert.equal(result.error, undefined, String(result.error));
  return result;
}

test('resource-check rejects a bad plan naming the pair, the shared path and the finding codes, and accepts a good one', () => {
  const bad = plan('bad', [
    '| a | one | - | `apps/fgos/tests/questions_*.rs` | 1 | draft |',
    '| b | two | - | apps/fgos/tests/questions_a.rs | 1 | draft |',
    '| c | three | - | | 1 | draft |',
    '| d | four | - | .. | 2 | draft |',
  ]);
  const rejected = door(['--plan', bad, '--json']);
  assert.notEqual(rejected.status, 0, rejected.stderr);
  const verdict = JSON.parse(rejected.stdout).data;
  assert.equal(verdict.verdict, 'reject');
  assert.deepEqual(verdict.collisions, [{ a: 'a', b: 'b', shared: ['apps/fgos/tests/questions_*.rs'] }]);
  const codes = verdict.findings.map((f) => f.code);
  for (const code of ['exclusion-in-one-layer', 'footprint-empty', 'footprint-entry-invalid']) assert.ok(codes.includes(code), `${code} in ${codes}`);
  assert.equal(verdict.policy.source, 'shipped-default');
  assert.equal(verdict.caveats.length, 2);

  const human = door(['--plan', bad]);
  assert.equal(human.status, rejected.status);
  assert.match(human.stdout, /^resource-check: reject/);
  assert.match(human.stdout, /collision: a x b share apps\/fgos\/tests\/questions_\*\.rs/);

  const good = plan('good', ['| a | one | - | src/a | 1 | draft |', '| b | two | a | src/b/ | 2 | draft |']);
  const accepted = door(['--plan', good, '--json']);
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.equal(JSON.parse(accepted.stdout).data.verdict, 'accept');
});
