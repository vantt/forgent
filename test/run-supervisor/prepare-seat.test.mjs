// The one door a worker attempt and a head session both prepare an interactive seat through: the binding
// comes back as the command, args and env the seat is started with, and the folder-trust entry it would
// stop at is written. (Trust-store details are owned by herdr-private-home-trust.test.mjs.)
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepareSeat } from '../../src/runner/dispatch/herdr-round.mjs';

const tmp = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));

test('preparing a seat returns its binding and seeds the trust entry the agent would stop at', async () => {
  const project = tmp('fgos-seat-project-');
  const realHome = tmp('fgos-seat-real-home-');
  const round = { workId: 'w', trustWritten: false, note: () => {} };
  // A person trusts the repository; the seat works in a directory under it, which is what gets an entry.
  const work = path.join(project, 'worktree');
  fs.mkdirSync(work);
  const config = path.join(realHome, 'config.toml');
  fs.writeFileSync(config, `[projects."${project}"]\ntrust_level = "trusted"\n`);
  const binding = {
    command: 'codex', args: ['--no-alt-screen'], env: { CODEX_HOME: realHome },
    trustStore: { kind: 'codex-toml' }, confinement: null, permissionMode: 'ask',
  };

  const seat = await prepareSeat({ binding, round, runDir: tmp('fgos-seat-run-'), cwd: work, repoRoot: project, fullEnv: { CODEX_HOME: realHome } });

  assert.deepEqual([seat.command, seat.args, seat.env], ['codex', ['--no-alt-screen'], { CODEX_HOME: realHome }]);
  assert.equal(seat.workerHomePath, null);
  assert.equal(seat.status, 'unconfined');
  assert.deepEqual(seat.trust, { seeded: true, store: { root: config, target: config } });
  assert.ok(fs.readFileSync(config, 'utf8').includes(`[projects."${work}"]`), 'the seat directory is trusted in the account store');

  const bare = await prepareSeat({ binding: { command: 'claude' }, round, runDir: tmp('fgos-seat-run-'), cwd: project, repoRoot: project, fullEnv: {} });
  assert.deepEqual([bare.args, bare.env, bare.trust], [[], {}, { seeded: false, store: null }], 'no trust store declared: nothing is seeded');
});
