// test/runner/execution/run-herdr.test.mjs -- what runUnit still decides about a herdr seat on its own:
// that the run path reads the transport bind() chose, and what a claude REPL in a pane may read. A seat
// itself -- the pane, the brief, the supervisor, the crash cases, the confined `fgos run` -- is tested in
// test/run-supervisor/terminal-*.test.mjs against a fake herdr that keeps a real pane.

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { withRunDirReadAccess } from '../../../src/runner/dispatch/cli.mjs';
import { makeFixtureDir } from '../../helpers/fixture-dir.mjs';

const fixtureDir = (prefix) => makeFixtureDir(prefix);

test('guards: the run path reads bound.transport and calls nextCandidate', () => {
  const runSource = fs.readFileSync(new URL('../../../src/runner/execution/run.mjs', import.meta.url), 'utf8');
  assert.match(runSource, /bound\.transport/);
  assert.match(runSource, /nextCandidate\(/);
});

test('Claude reads blind inputs without granting the assignment or store root, preserving operator directories', () => {
  const assignment = fixtureDir('fgos-blind-access-');
  const runDir = path.join(assignment, 'runs', '01');
  const inputsDir = path.join(assignment, 'inputs');
  fs.mkdirSync(runDir, { recursive: true });
  fs.mkdirSync(inputsDir);
  const args = ['--add-dir', '/operator-approved', '--model', 'fixture'];
  const options = { adapter: 'herdr-spawn', interactiveMode: { kind: 'claude' }, args, runDir };
  const granted = withRunDirReadAccess(options);
  assert.deepEqual(granted.slice(0, 4), ['--add-dir', runDir, inputsDir, '/operator-approved']);
  assert.ok(!granted.includes(assignment));
  assert.ok(!granted.includes(path.dirname(assignment)));
  assert.deepEqual(args, ['--add-dir', '/operator-approved', '--model', 'fixture']);
  assert.equal(withRunDirReadAccess({ ...options, adapter: 'cli-spawn' }), args);
  assert.equal(withRunDirReadAccess({ ...options, interactiveMode: { kind: 'codex' } }), args);
});

test('Claude cross-repo handoffs grant only referenced report parents, not sibling assignments or store roots', () => {
  const store = fixtureDir('fgos-cross-ref-access-');
  const assignment = path.join(store, 'current', 'producer', '1');
  const runDir = path.join(assignment, 'runs', '01');
  const reportDir = path.join(store, 'previous', 'producer', '1', 'runs', '01');
  const unrelated = path.join(store, 'unrelated', 'runs', '01');
  for (const dir of [runDir, reportDir, unrelated]) fs.mkdirSync(dir, { recursive: true });
  const report = path.join(reportDir, 'agent-report.md');
  fs.writeFileSync(report, '# Settled recommendation with attributed dissent\n');
  fs.writeFileSync(path.join(assignment, 'assignment.json'), JSON.stringify({
    contextRefs: [report, report, path.join(store, 'absent.md'), unrelated, 'unit-run:previous/producer', 'relative.md'],
  }));
  const args = ['--model', 'fixture'];
  const granted = withRunDirReadAccess({ adapter: 'herdr-spawn', interactiveMode: { kind: 'claude' }, args, runDir });
  assert.deepEqual(granted, [...args, '--add-dir', runDir, fs.realpathSync(reportDir)]);
  for (const dir of [store, assignment, path.dirname(reportDir), unrelated]) assert.ok(!granted.includes(dir));
  fs.writeFileSync(path.join(assignment, 'assignment.json'), '{broken');
  assert.throws(() => withRunDirReadAccess({ adapter: 'herdr-spawn', interactiveMode: { kind: 'claude' }, args, runDir }), SyntaxError);
});
