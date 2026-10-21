// test/workflow/confined-nested-write.test.mjs — a confined worker that calls `fgos run --writes` is refused by name,
// from inside the real bwrap confinement; it does not matter what it names or what its shell unset

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { runUnit } from '../../src/runner/execution/run.mjs';
import { resolveUnitInputs } from '../../src/runner/execution/handoff-refs.mjs';
import { createCaseAdmissionPort } from '../../src/workflow/case-admission-port.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { setupWorkflowFixtureRepo } from '../helpers/workflow-fixture-repo.mjs';
import { openCase } from '../helpers/workflow-case-fixture.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';

seedFileLocalBwrapRegistry();

const FGOS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'bin', 'fgos.mjs');

// The worker calls the door twice from inside its confinement, then reports what each answered.
// A worker never inherits its parent's FGOS_HOST_BIN, and this fixture repo has no activation, so the
// worker names the host itself, as any direct `node bin/fgos.mjs` caller outside an activated project must.
const workerBody = (repo) => `
  const { spawnSync } = await import('node:child_process');
  const door = (args) => {
    const r = spawnSync(process.execPath, [${JSON.stringify(FGOS)}, 'run', ...args, '--dir', ${JSON.stringify(repo)}], { cwd: process.cwd(), env: { ...process.env, FGOS_HOST_BIN: ${JSON.stringify(process.env.FGOS_HOST_BIN ?? '')} }, encoding: 'utf8', timeout: 60000 });
    return { status: r.status, text: (r.stderr || '') + (r.stdout || '') };
  };
  const writes = door(['try to write', '--writes', 'docs', '--worktree', process.cwd()]);
  const unsetAll = spawnSync(process.execPath, [${JSON.stringify(FGOS)}, 'run', 'try again', '--writes', 'docs', '--worktree', process.cwd(), '--case', 'wf-other', '--activity', 'x', '--dir', ${JSON.stringify(repo)}], { cwd: process.cwd(), env: { PATH: process.env.PATH, FGOS_DISPATCH_DEPTH: process.env.FGOS_DISPATCH_DEPTH, FGOS_HOST_BIN: ${JSON.stringify(process.env.FGOS_HOST_BIN ?? '')} }, encoding: 'utf8', timeout: 60000 });
  const named = { status: unsetAll.status, text: (unsetAll.stderr || '') + (unsetAll.stdout || '') };
  const readOnly = door(['just look']);
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nThe nested calls answered: ' + JSON.stringify({ writes: writes.text.slice(0, 600), named: named.text.slice(0, 600), readOnly: readOnly.text.slice(0, 600) }) + '. Nothing more was done.\\n');
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
`;

test('a nested `fgos run --writes` from a confined worker is refused as nested-write-from-confined-worker', async (t) => {
  const tmp = setupWorkflowFixtureRepo({ prefix: 'fgos-confined-nested-', readme: '# Nested', gitName: 'Nested Test', capabilities: ['docs:write'], workerBody: workerBody('REPO') });
  // The fixture inlines the body once; write the real repo path into the worker it generated.
  const script = path.join(tmp, 'echo-worker.mjs');
  fs.writeFileSync(script, fs.readFileSync(script, 'utf8').replaceAll('REPO', tmp.replaceAll('\\', '\\\\')));
  const caseRun = openCase({ repoRoot: tmp });
  // A writing dispatch needs a linked worktree; the worker runs in it, as every confined worker runs in its own.
  const wt = path.join(makeFixtureDir('fgos-confined-nested-wt-'), 'wt');
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'nested/wt', wt], { cwd: tmp });
  const port = createCaseAdmissionPort({ repoRoot: tmp, env: {} });
  const res = await runUnit({
    unitData: { id: 'u-nest', objective: 'Look around', capability: 'docs:write', writes: [] },
    caseAdmission: port,
    caseRef: { caseId: caseRun.caseId, activity: 'scout' },
    repoRoot: tmp, cwd: wt, worktree: wt,
  });
  assert.equal(res.outcome, 'pass');
  const [report] = resolveUnitInputs([`unit-run:${res.unitRunId}/producer`], tmp).refs;
  const text = fs.readFileSync(report, 'utf8');
  const answered = JSON.parse(/answered: (\{.*\})\. Nothing more/s.exec(text)[1]);
  t.diagnostic(JSON.stringify(answered));
  assert.match(answered.writes, /nested-write-from-confined-worker/);
  assert.match(answered.named, /nested-write-from-confined-worker|authority-context|binding-view|nested/, 'with every variable unset the call is still refused, never run');
  // A nested read-only dispatch is not the admission's business: whatever else it meets, it is never refused by it.
  assert.doesNotMatch(answered.readOnly, /case admission refused|nested-write-from-confined-worker|authority-context/);
  // Nothing was written by the refused calls, and no second unit run exists beside the worker's own.
  assert.equal(fs.readdirSync(path.join(tmp, '.fgos', 'assignments')).length, 1);
});
