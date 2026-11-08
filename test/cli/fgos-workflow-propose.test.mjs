// test/cli/fgos-workflow-propose.test.mjs — `fgos workflow propose` end to end on the real guide: the proposal writes
// nothing, and the lines it generates are the lines the real CLI accepts and the case admits

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

import { COMMAND_REGISTRY } from '../../src/cli/command-registry.mjs';
import { unknownFlagMessage } from '../../src/cli/flag-check.mjs';
import { parseArgs } from '../../src/cli/parse-args.mjs';
import { readWorkflowEvents } from '../../src/workflow/index.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { setupWorkflowFixtureRepo } from '../helpers/workflow-fixture-repo.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { readProjectConfig, writeProjectConfig } from '../helpers/config-fixture.mjs';

seedFileLocalBwrapRegistry();

const here = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(here, '../../bin/fgos.mjs');
const REPO = path.resolve(here, '../..');

const WORKER_BODY = `
  fs.writeFileSync(path.join(runDir, 'report-1.md'), '# Report\\nThe request is clear enough to plan from; no decision is open.\\n');
  fs.writeFileSync(path.join(runDir, 'result-1.json'), JSON.stringify({ status: 'done', summary: 'Clear' }));
`;

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function setup() {
  const tmp = setupWorkflowFixtureRepo({ prefix: 'fgos-propose-', readme: '# Propose', gitName: 'Propose Test', capabilities: ['advise', 'review', 'code:implement', 'docs:write'], workerBody: WORKER_BODY });
  fs.appendFileSync(path.join(tmp, '.gitignore'), '.fgos/\n*.mjs\n');
  // The project declares the command its final gate runs.
  const cfg = readProjectConfig(tmp);
  cfg.runner.capabilities['code:implement'].verify = 'node --version';
  writeProjectConfig(tmp, cfg);
  fs.cpSync(path.join(REPO, 'domains', 'coding'), path.join(tmp, 'domains', 'coding'), { recursive: true });
  for (const [file, text] of Object.entries({ 'src/a.mjs': 'export const a = 1;\n', 'docs/note.md': '# note\n', 'plans/p/plan.md': '# plan\n' })) {
    fs.mkdirSync(path.dirname(path.join(tmp, file)), { recursive: true });
    fs.writeFileSync(path.join(tmp, file), text);
  }
  git(tmp, 'add', '-A', '-f');
  git(tmp, 'commit', '-q', '-m', 'fixture files');
  return tmp;
}

// boundary: the generated lines are only proven usable by the CLI's own argument parser, start and admission, which no use-case test reaches.
const fgos = (tmp, args) => spawnSync(process.execPath, [FGOS, ...args, '--dir', tmp], { cwd: tmp, encoding: 'utf8' });
const entryOf = (verb) => COMMAND_REGISTRY.find((entry) => entry.name === verb);

test('the proposal writes nothing, and the lines it generates are accepted by the real parser, the real start and the case', (t) => {
  const tmp = setup();
  const worktree = path.join(makeFixtureDir('fgos-propose-wt-'), 'case');
  const slices = path.join(tmp, 'slices.json');
  fs.writeFileSync(slices, JSON.stringify({
    request: 'Add the note and tweak the code',
    slices: [
      { id: 'note', objective: 'Write the note', writes: ['docs/note.md'], verify: 'node --version' },
      { id: 'code', objective: 'Change the code', writes: ['src/a.mjs'], verify: 'node --version', dependsOn: ['note'] },
    ],
  }));
  const before = fs.readdirSync(tmp).sort();

  const proposed = fgos(tmp, ['workflow', 'propose', '--slices', slices, '--plan', 'plans/p/plan.md', '--worktree', worktree, '--json']);
  assert.equal(proposed.status, 0, proposed.stderr || proposed.stdout);
  const proposal = JSON.parse(proposed.stdout).data;
  assert.equal(proposal.ok, true, JSON.stringify(proposal.refusals));
  assert.equal(fs.existsSync(path.join(tmp, '.fgos', 'workflow-runs')), false, 'proposing opened no case');
  assert.deepEqual(fs.readdirSync(tmp).sort(), before, 'proposing wrote nothing to the checkout');

  // The same answer as readable text, with the question first and the exit code saying it is fine.
  const text = fgos(tmp, ['workflow', 'propose', '--slices', slices, '--plan', 'plans/p/plan.md', '--worktree', worktree]);
  assert.equal(text.status, 0);
  assert.match(text.stdout, /1\. Việc đang xảy ra:/);
  assert.match(text.stdout, /fgos workflow start coding\/feature/);

  // Every line uses only flags the registry declares for its verb, read by the CLI's own parser.
  for (const c of proposal.commands) {
    const [verb, ...rest] = c.argv;
    const { flags, positional } = parseArgs(rest);
    assert.equal(unknownFlagMessage(entryOf(verb), flags, positional), null, `${c.id}: ${c.line}`);
  }

  // The worktree and the start lines run verbatim; the case opens with exactly the frame proposed.
  const run = (id) => {
    const c = proposal.commands.find((command) => command.id === id);
    const result = fgos(tmp, c.argv);
    assert.equal(result.status, 0, `${id}: ${result.stderr || result.stdout}`);
    return JSON.parse(result.stdout).data;
  };
  run('worktree');
  assert.ok(fs.existsSync(path.join(worktree, 'src', 'a.mjs')), 'the worktree line made the worktree');
  const started = run('start');
  const caseId = started.workflowRunId;
  const status = JSON.parse(fgos(tmp, ['workflow', 'status', caseId]).stdout).data.case;
  assert.equal(status.open, true);
  for (const key of ['dispatches', 'mutatingDispatches', 'seatLaunchesPerDispatch', 'rigorFloor']) assert.equal(status.frame[key], proposal.frame[key], key);

  // Every dispatch line runs verbatim, in order, against the case; each one the case admits leaves a reservation on its ledger,
  // so a line the case would refuse (a flag, a rigor under the floor, a launch ceiling, a route) shows up as a missing one. The fake worker
  // writes no file, so a writing slice may end in an execution failure; admission is what this test is about, not the outcome.
  const reservations = () => readWorkflowEvents({ repoRoot: tmp, workflowRunId: caseId }).filter((e) => e.type === 'reservation');
  const lines = proposal.commands.filter((c) => c.id !== 'worktree' && c.id !== 'start');
  for (const c of lines) {
    const before = reservations().length;
    const result = fgos(tmp, c.argv.map((a, i) => ((c.caseSlots ?? []).includes(i) ? caseId : a)));
    assert.equal(reservations().length - before, 1, `${c.id} was not admitted: ${result.stderr || result.stdout}`.slice(0, 1500));
  }
  t.after(() => { try { git(tmp, 'worktree', 'remove', '--force', worktree); } catch { /* the fixture directory is removed with the process root */ } });
});

test('propose refuses by name and exits non-zero, with the reason in the answer', () => {
  const tmp = setup();
  const slices = path.join(tmp, 'slices.json');
  fs.writeFileSync(slices, JSON.stringify({ slices: [{ id: 'all', objective: 'Everything', writes: ['.'], verify: 'node --version' }] }));
  const refused = fgos(tmp, ['workflow', 'propose', '--slices', slices, '--plan', 'plans/p/plan.md', '--json']);
  assert.notEqual(refused.status, 0);
  const proposal = JSON.parse(refused.stdout).data;
  assert.equal(proposal.ok, false);
  assert.ok(proposal.refusals.some((r) => /cả repo/.test(r.ownerNote ?? '')));
  assert.deepEqual(proposal.commands, []);
  const neither = fgos(tmp, ['workflow', 'propose']);
  assert.notEqual(neither.status, 0);
  assert.match(neither.stderr, /exactly one of --slices/);
});
