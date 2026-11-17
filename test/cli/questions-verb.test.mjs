// test/cli/questions-verb.test.mjs -- wiring proof: `fgos questions --open` reads the stage places through the CLI door

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';

const FGOS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../bin/fgos.mjs');

test('fgos questions --open lists an open discussion question as text and as JSON, and refuses to run without --open', (t) => {
  const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-questions-verb-')));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  execFileSync('git', ['init', '-b', 'main'], { cwd: tmp, stdio: 'ignore' });
  fs.mkdirSync(path.join(tmp, 'docs/discussions/topic-a'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'docs/discussions/topic-a/QUESTIONS.md'), '| id | status | question | answer |\n|---|---|---|---|\n| Q1 | open | Which door? | |\n');
  const run = (...args) => spawnSync(process.execPath, [FGOS, ...args, '--dir', tmp], { cwd: tmp, encoding: 'utf8' });

  const text = run('questions', '--open');
  assert.equal(text.status, 0, text.stderr);
  assert.match(text.stdout, /\[discussion\] docs\/discussions\/topic-a\/QUESTIONS.md#Q1\nWhich door\?/);

  const json = run('questions', '--open', '--json');
  assert.equal(json.status, 0, json.stderr);
  const items = JSON.parse(json.stdout).data.questions;
  assert.deepEqual(items.map((i) => [i.topic, i.stage]), [['topic-a', 'discussion']]);

  assert.notEqual(run('questions').status, 0);
});
