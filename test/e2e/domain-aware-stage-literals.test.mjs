import { test } from 'node:test';
import { resolveFgosFile, FGOS_FILE } from '../../src/state/fgos-file-registry.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

// e2e regression for tsk-3xo: bin/fgos.mjs's `discover`/`decompose` CLI
// gates and discovery.mjs/decompose.mjs's internal `moveStage` calls used to
// hardcode the literal stage names 'clarify'/'decompose'/'executing'
// instead of resolving them via stageForStep(getDomain(work.domain), step).
// A domain whose registry entry maps a stage to Clarify/Divide under a
// non-coding-literal name (the 'triage' fixture domain,
// workflow-stage-graphs.mjs) could never cross those stages: the sync CLI
// gate rejected it outright, and the runner sweep's internal moveStage call
// threw FsmError('precondition') on the mismatched literal — caught by
// runOnce's outer catch and turned into a 'halted' outcome for the WHOLE
// TICK, not just the mismatched item, per
// plans/reports/internal-research-260804-1230-routing-coding-driving-domain-gap-plan-report.md
// section 3. This file proves both failure modes are gone: the sync CLI
// path (test 1) and the runner-sweep path with an unrelated coding item
// riding the same tick (test 2). Mirrors runner-loop.test.mjs's own harness
// style exactly (real mkdtemp git repo, real bin/fgos.mjs/bin/fgos-runner.mjs
// child processes) — nothing here imports src/runner or src/state directly.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');
const RUNNER = path.resolve(__dirname, '../../bin/fgos-runner.mjs');

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function initTempRepo() {
  const repoRoot = mkTempDir('fgos-domain-stage-literals-e2e-repo-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'root commit'], { cwd: repoRoot });
  return repoRoot;
}

function fgos(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function runner(cwd, args = ['--once']) {
  return spawnSync(process.execPath, [RUNNER, ...args], { cwd, encoding: 'utf8' });
}

function submit(cwd, text, extra = {}) {
  const flags = [];
  if (extra.domain) flags.push('--domain', extra.domain);
  if (extra.docsRef) flags.push('--docs-ref', extra.docsRef);
  const result = fgos(cwd, ['submit', text, ...flags]);
  assert.equal(result.status, 0, `fgos submit failed: ${result.stderr}`);
  return JSON.parse(result.stdout).data;
}

// tsk-1x3 D1/D9/D16 (docs/history/fanout-and-delegation-rubric/CONTEXT.md):
// the runner sweep's own clarify/decompose judge subprocess is retired — a
// role='runner' call on either stage now safely no-ops instead of
// consulting a scripted judge. The two tests below that used to dispatch a
// triage-domain item through the runner sweep ALONE (no explicit
// discover/decompose CLI call) now plant a real committed CONTEXT.md (+
// plan.md declaring `mode: tiny`) under the item's own `docsRef` first —
// the readLockedContext/tiny-mode TRUST SIGNAL, domain-agnostic and
// unaffected by D16 — so the sweep still legitimately crosses
// Clarify->Divide->Execute in one tick, same as before, just via the
// mechanism that is still real.
function mkLockedContextFixture(repoRoot, docsRef) {
  const featureDir = path.join(repoRoot, docsRef);
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(path.join(featureDir, 'CONTEXT.md'), '# CONTEXT\n\nD1: locked.\n');
  fs.writeFileSync(path.join(featureDir, 'plan.md'), '# plan\n\nmode = **tiny**.\n');
}

function viewPath(cwd) {
  return resolveFgosFile(path.join(cwd, '.fgos'), FGOS_FILE.STATE);
}

function stateView(cwd) {
  return JSON.parse(fs.readFileSync(viewPath(cwd), 'utf8'));
}

function envelopeData(stdout) {
  return JSON.parse(stdout).data;
}

function writeRunnerConfig(repoRoot, executorScript) {
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(repoRoot, '.fgos', 'config.json'),
    JSON.stringify({
      runner: {
        executor: { command: process.execPath, args: [executorScript, '{prompt}', '--model', '{model}'] },
        models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
        timeoutMs: 15000,
        parallel: { maxRoots: 4, maxLeavesPerRoot: 4 },
      },
    }),
  );
}

function branchExists(repoRoot, branch) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    return true;
  } catch {
    return false;
  }
}

function branchLog(repoRoot, branch) {
  return execFileSync('git', ['log', '--oneline', branch], { cwd: repoRoot, encoding: 'utf8' });
}

/** Same shape as runner-loop.test.mjs's own writeClearDiscoveryExecutor,
 * duplicated here per this repo's own per-file e2e harness convention (see
 * that file's and synthetic-domain.test.mjs's own header comments) — tells
 * the context-discovery call, the chia-việc call, and the worker dispatch
 * call apart by their fixed prompt prefixes, domain-agnostic (never reads
 * or assumes an item id or domain). */
function writeClearDiscoveryExecutor(scriptDir, { verify, produce = 'output.txt' }) {
  const scriptPath = path.join(scriptDir, 'clear-discovery-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const prompt = process.argv[2] ?? '';
if (prompt.includes('Kiểm tra độc lập một lệnh verify')) {
  process.stdout.write(JSON.stringify({ agrees: true }));
} else if (prompt.includes('# Context-discovery')) {
  process.stdout.write(JSON.stringify({ clear: true, verify: ${JSON.stringify(verify)} }));
} else if (prompt.includes('# Chia-việc (decompose)')) {
  process.stdout.write(JSON.stringify({ verdict: 'pass-through' }));
} else {
  const match = prompt.match(/test -f (\\S+)/);
  const file = match ? match[1] : ${JSON.stringify(produce)};
  fs.writeFileSync(file, 'produced by worker\\n');
  execFileSync('git', ['add', file]);
  execFileSync('git', ['commit', '-q', '-m', \`worker: \${file}\`]);
}
`,
  );
  return scriptPath;
}

// tsk-1x3 D1/D9/D16: the "runner sweep" test below now advances both items
// past clarify/decompose via the trust-signal fixture (mkLockedContextFixture
// above), never through a scripted judge — so the multi-item discovery/
// chia-việc prompt-answering executor this file used to configure for it has
// nothing left to answer. This one only needs the plain worker-dispatch
// branch, adaptive on the item's own `verify` (mirrors
// test/e2e/runner-loop.test.mjs's own writeAdaptiveWorkerExecutor).
function writeCommittingWorkerExecutor(scriptDir) {
  const scriptPath = path.join(scriptDir, 'committing-worker-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const prompt = process.argv[2] ?? '';
const match = prompt.match(/test -f (\\S+)/);
const file = match ? match[1] : 'output.txt';
fs.writeFileSync(file, 'produced by worker\\n');
execFileSync('git', ['add', file]);
execFileSync('git', ['commit', '-q', '-m', \`worker: \${file}\`]);
`,
  );
  return scriptPath;
}

test('sync CLI: fgos discover / fgos plan cross a "triage" fixture-domain item through its own Clarify/Divide-mapped stages (not coding\'s literal names), no throw', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-domain-stage-literals-e2e-exec-');

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  // Only needed for judgeVerifySemanticCorrectness's own second-pass check
  // on the caller-supplied --verify below (tsk-5q5-1) -- this test's own
  // discover/decompose verdicts are caller-supplied, never routed through
  // this executor's discovery/decompose branches.
  writeRunnerConfig(
    repoRoot,
    writeClearDiscoveryExecutor(scriptDir, { verify: 'test -f triage-output.txt && echo TRIAGE_OK' }),
  );

  const submitted = submit(repoRoot, 'Cross-domain regression fixture item', { domain: 'triage' });
  assert.equal(submitted.domain, 'triage');
  assert.equal(submitted.stage, 'triage', 'submit lands the item on its OWN domain\'s Clarify-mapped stage, not the coding literal "clarify"');

  const discoverResult = fgos(repoRoot, [
    'discover', submitted.id,
    '--verdict', 'clear',
    '--verify', 'test -f triage-output.txt && echo TRIAGE_OK',
  ]);
  assert.equal(discoverResult.status, 0, `fgos discover failed: ${discoverResult.stderr}`);
  assert.equal(envelopeData(discoverResult.stdout).outcome, 'clear');

  const afterDiscover = stateView(repoRoot).work[submitted.id];
  assert.equal(afterDiscover.stage, 'shaping', 'discover moved the item to triage\'s OWN Divide-mapped stage ("shaping"), not the coding literal "decompose"');

  const decomposeResult = fgos(repoRoot, [
    'plan', submitted.id,
    '--verdict', 'pass-through',
    '--reason', 'single fixture item, no split needed',
  ]);
  assert.equal(decomposeResult.status, 0, `fgos plan failed: ${decomposeResult.stderr}`);
  assert.equal(envelopeData(decomposeResult.stdout).outcome, 'pass-through');

  const afterDecompose = stateView(repoRoot).work[submitted.id];
  assert.equal(afterDecompose.stage, 'assembling', 'decompose moved the item to triage\'s OWN Execute-mapped stage ("assembling"), not the coding literal "executing"');
});

// tsk-4sz: decompose.mjs's child addWork and loop.mjs's discovered-from
// addWork both hardcoded a literal stage AND never threaded the parent
// item's own `domain` through, so a split/discovered child of a non-coding
// domain item landed with domain defaulting to 'coding' AND a stage literal
// that may not even be a real stage name in the item's OWN domain (a double
// failure the two tests above never exercised: both use `--verdict
// pass-through`/a single fixture item, so decompose.mjs's own child-`addWork`
// branch and loop.mjs's own discovered-from `addWork` branch never actually
// ran). These two tests exercise those exact branches for real.

test('domain-aware decompose child addWork inherits parent domain+stage', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-domain-stage-literals-e2e-exec-');

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  writeRunnerConfig(
    repoRoot,
    writeClearDiscoveryExecutor(scriptDir, { verify: 'test -f triage-output.txt && echo TRIAGE_OK' }),
  );

  const submitted = submit(repoRoot, 'Cross-domain regression fixture item for decompose split', { domain: 'triage' });
  assert.equal(submitted.domain, 'triage');

  const discoverResult = fgos(repoRoot, [
    'discover', submitted.id,
    '--verdict', 'clear',
    '--verify', 'test -f triage-output.txt && echo TRIAGE_OK',
  ]);
  assert.equal(discoverResult.status, 0, `fgos discover failed: ${discoverResult.stderr}`);
  assert.equal(stateView(repoRoot).work[submitted.id].stage, 'shaping');

  // A REAL split (--verdict decompose, not pass-through) so decompose.mjs's
  // own child-addWork branch (the exact code this item fixes) actually runs.
  const decomposeResult = fgos(repoRoot, [
    'plan', submitted.id,
    '--verdict', 'decompose',
    '--reason', 'tsk-4sz regression: prove split children inherit the parent triage domain + stage, not coding literals',
    '--children', JSON.stringify([
      {
        title: 'Triage child piece one',
        verify: 'test -f triage-child-1.txt && echo OK',
        action: 'tsk-3xd fixture: triage the child piece.',
        deps: [],
      },
    ]),
  ]);
  assert.equal(decomposeResult.status, 0, `fgos plan failed: ${decomposeResult.stderr}`);
  assert.equal(envelopeData(decomposeResult.stdout).outcome, 'decompose');

  const after = stateView(repoRoot).work;
  const child = after[`${submitted.id}-1`];
  assert.ok(child, 'child item was created');
  assert.equal(child.domain, 'triage', "child inherits the PARENT's domain, not the coding default");
  assert.equal(
    child.stage,
    'assembling',
    'child lands on triage\'s OWN Execute-mapped stage ("assembling"), not the coding literal "executing"',
  );
  assert.equal(child.parent, submitted.id);
});

/** Same three-way prompt split as writeClearDiscoveryExecutor, but the
 * worker-dispatch branch ALSO emits a fenced fgos-discovered block to its
 * own stdout (the worker->runner discovery-report channel, wgi-8) so
 * captureDiscoveredWork's own addWork call — the exact branch this item
 * fixes — actually runs. Fence markers are built via String.fromCharCode
 * rather than literal backticks, purely to avoid escaping a nested
 * triple-backtick fence inside this generator's own outer template
 * literal. */
function writeDiscoveringWorkerExecutor(scriptDir, { verify, produce, discoveredTitle }) {
  const scriptPath = path.join(scriptDir, 'discovering-worker-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const prompt = process.argv[2] ?? '';
const fence = String.fromCharCode(96, 96, 96);
if (prompt.includes('Kiểm tra độc lập một lệnh verify')) {
  process.stdout.write(JSON.stringify({ agrees: true }));
} else if (prompt.includes('# Context-discovery')) {
  process.stdout.write(JSON.stringify({ clear: true, verify: ${JSON.stringify(verify)} }));
} else if (prompt.includes('# Chia-việc (decompose)')) {
  process.stdout.write(JSON.stringify({ verdict: 'pass-through' }));
} else {
  const match = prompt.match(/test -f (\\S+)/);
  const file = match ? match[1] : ${JSON.stringify(produce)};
  fs.writeFileSync(file, 'produced by worker\\n');
  execFileSync('git', ['add', file]);
  execFileSync('git', ['commit', '-q', '-m', 'worker: ' + file]);
  process.stdout.write('\\n' + fence + 'fgos-discovered\\n' + JSON.stringify({ title: ${JSON.stringify(discoveredTitle)} }) + '\\n' + fence + '\\n');
}
`,
  );
  return scriptPath;
}

test('domain-aware discovered-from addWork inherits parent domain+stage', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-domain-stage-literals-e2e-exec-');
  const docsRef = 'docs/history/triage-discovered-from-item';

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  writeRunnerConfig(
    repoRoot,
    writeDiscoveringWorkerExecutor(scriptDir, {
      verify: 'test -f triage-output.txt && echo TRIAGE_OK',
      produce: 'triage-output.txt',
      discoveredTitle: 'Follow-up spotted while working the triage fixture item',
    }),
  );

  // tsk-5mj D1/D6/D7 finding (docs/history/fanout-and-delegation-rubric/
  // CONTEXT.md): this item's own verify (`! rg -q "resolveDiscovery"
  // src/runner/loop.mjs`) removed the runner's clarify-stage sweep
  // ENTIRELY — a cross-domain mechanism (it used `stageForStep(domain,
  // 'Clarify')` generically, serving every domain, not just coding's own
  // `discovery`/`exploring` stages this item adds). A real, plainly-stated
  // consequence: a triage-domain item at its own Clarify-mapped stage
  // ("triage") is no longer auto-advanced by any runner sweep either, same
  // as a plain coding item — only an explicit `fgos discover --verdict
  // ...` call moves it now. This test advances it that way instead of via
  // the (now-gone) trust-signal sweep.
  mkLockedContextFixture(repoRoot, docsRef);
  const triageItem = submit(repoRoot, 'Cross-domain regression fixture item for discovered-from', { domain: 'triage', docsRef });
  assert.equal(triageItem.domain, 'triage');

  const discovered1 = fgos(repoRoot, ['discover', triageItem.id, '--verdict', 'clear', '--verify', 'test -f triage-output.txt && echo TRIAGE_OK']);
  assert.equal(discovered1.status, 0, `discover failed: ${discovered1.stderr}`);
  const decomposed1 = fgos(repoRoot, ['plan', triageItem.id, '--verdict', 'pass-through', '--reason', 'single fixture item, no split needed']);
  assert.equal(decomposed1.status, 0, `decompose failed: ${decomposed1.stderr}`);

  const first = runner(repoRoot, ['--once']);
  assert.equal(first.status, 0, `--once failed: ${first.stderr}`);

  const after = stateView(repoRoot).work;
  assert.equal(after[triageItem.id].status, 'awaiting-approval', 'the triage item was actually dispatched by the real runner');

  const discovered = Object.values(after).find((w) => w.discoveredFrom === triageItem.id);
  assert.ok(discovered, 'runner captured the fgos-discovered block into a new work item');
  assert.equal(discovered.domain, 'triage', "discovered-from item inherits the PARENT's domain, not the coding default");
  assert.equal(
    discovered.stage,
    'triage',
    'discovered-from item lands on triage\'s OWN Clarify-mapped stage ("triage"), not the coding literal "clarify"',
  );
});

test('runner sweep: a "triage" fixture-domain item at its own Clarify-mapped stage no longer halts the whole tick — an unrelated coding item in the same sweep still dispatches', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-domain-stage-literals-e2e-exec-');
  const triageDocsRef = 'docs/history/triage-multi-item-sweep';
  const codingDocsRef = 'docs/history/coding-multi-item-sweep';

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  writeRunnerConfig(repoRoot, writeCommittingWorkerExecutor(scriptDir));

  // tsk-5mj D1/D6/D7 finding (see the discovered-from test above): both
  // items are advanced past their own domain's Clarify-mapped stage via an
  // explicit `fgos discover`/`fgos decompose` pair now — the trust-signal
  // runner sweep this test used to rely on is gone (this item's own verify
  // required removing every `resolveDiscovery` call from loop.mjs, and that
  // sweep was the cross-domain mechanism serving triage same as coding).
  // The real thing this test still proves — a triage-domain item crossing
  // its OWN stage names never wedges the sweep for an unrelated coding item
  // in the same tick — is unaffected: both still reach dispatch through the
  // SAME parallel drain-run below, unchanged code.
  mkLockedContextFixture(repoRoot, triageDocsRef);
  const triageItem = submit(repoRoot, 'Cross-domain regression fixture item', { domain: 'triage', docsRef: triageDocsRef });
  assert.equal(triageItem.stage, 'triage');
  assert.equal(fgos(repoRoot, ['discover', triageItem.id, '--verdict', 'clear', '--verify', 'test -f triage-output.txt && echo TRIAGE_OK']).status, 0);
  assert.equal(fgos(repoRoot, ['plan', triageItem.id, '--verdict', 'pass-through', '--reason', 'single fixture item, no split needed']).status, 0);

  mkLockedContextFixture(repoRoot, codingDocsRef);
  const codingItem = submit(repoRoot, 'An unrelated plain coding item, same sweep', { docsRef: codingDocsRef });
  assert.equal(codingItem.stage, 'discovery');
  // tsk-30v D2/D6: a clear verdict at `discovery` now skips `exploring` and
  // lands directly on `planning` in ONE discover call (triage above is
  // unaffected: it has no discovery/exploring stages registered, so its
  // own single discover call still lands straight on decompose, unchanged).
  assert.equal(fgos(repoRoot, ['discover', codingItem.id, '--verdict', 'clear', '--verify', 'test -f output.txt && echo CODE_OK']).status, 0);
  assert.equal(fgos(repoRoot, ['plan', codingItem.id, '--verdict', 'pass-through', '--reason', 'single fixture item, no split needed']).status, 0);

  // Before tsk-3xo's fix: a stage-move call for the triage item would throw
  // FsmError('precondition') (neither literal is a real stage name in the
  // triage domain's own transition table) -- this test's own real proof is
  // that the two `discover`/`decompose` calls above (and the dispatch
  // below) all succeed for triage's own stage names, never a coding
  // literal.
  const first = runner(repoRoot, ['--once']);
  assert.equal(first.status, 0, `--once failed (this is exactly the pre-fix whole-tick halt if non-zero): ${first.stderr}`);

  const afterFirst = stateView(repoRoot);
  const triage = afterFirst.work[triageItem.id];
  const coding = afterFirst.work[codingItem.id];

  assert.equal(triage.domain, 'triage');
  assert.equal(triage.stage, 'assembling', 'the triage item crossed Clarify->Divide->Execute via its OWN domain\'s stage names in one sweep, same pass-through chaining coding gets');
  assert.equal(triage.status, 'awaiting-approval', 'the triage item was actually dispatched by the real runner, not just stage-advanced');
  assert.equal(branchExists(repoRoot, `fgw/${triageItem.id}`), true);
  assert.match(branchLog(repoRoot, `fgw/${triageItem.id}`), /worker: triage-output\.txt/);

  // The regression proof: an ordinary coding item riding the SAME sweep
  // tick as the triage item is completely unaffected.
  assert.equal(coding.stage, 'executing');
  assert.equal(coding.status, 'awaiting-approval', 'the plain coding item was dispatched in the SAME tick -- the triage item never halted the sweep');
  assert.equal(branchExists(repoRoot, `fgw/${codingItem.id}`), true);
  assert.match(branchLog(repoRoot, `fgw/${codingItem.id}`), /worker: output\.txt/);
});
