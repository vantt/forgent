// test/runner/work-path-case-admission.test.mjs — the Work paths carry the real admission port: a claim
// worktree no case owns answers `unbound` and the run goes on as before; one a case owns is refused.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { spawnWorker } from '../../src/runner/work-dispatch.mjs';
import { createPendingBinding, commitBinding } from '../../src/workflow/case-bindings.mjs';
import { confinedRunnerConfig, persistRunnerConfig } from './loop-worker-fixture.helper.mjs';
import { seedFileLocalBwrapRegistry } from './confinement-registry-fixture.helper.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { activateGitFixture } from '../helpers/git-fixture.mjs';

seedFileLocalBwrapRegistry();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function fixture() {
  const repoRoot = fs.realpathSync(makeFixtureDir('fgos-workpath-repo-'));
  git(repoRoot, 'init', '-q', '-b', 'main');
  git(repoRoot, 'config', 'user.email', 'test@example.com');
  git(repoRoot, 'config', 'user.name', 'Test');
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  git(repoRoot, 'add', 'seed.txt');
  git(repoRoot, 'commit', '-q', '-m', 'seed');
  activateGitFixture(repoRoot);
  const fgosDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  const worktree = path.join(fs.realpathSync(makeFixtureDir('fgos-workpath-wt-')), 'sample-work');
  git(repoRoot, 'worktree', 'add', '-q', '-b', 'fgw/sample-work', worktree);
  const script = path.join(fs.realpathSync(makeFixtureDir('fgos-workpath-exec-')), 'echo.mjs');
  fs.writeFileSync(script, "import fs from 'node:fs';\nfs.writeFileSync('echo.txt', 'echo\\n');\nprocess.stdout.write('echo');\n");
  const cfg = confinedRunnerConfig({
    executor: { command: process.execPath, args: [script, '{prompt}'], providerModel: 'node' },
    modelPolicies: { node: { nano: 'haiku', standard: 'sonnet', frontier: 'opus' } },
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
    timeoutMs: 20000,
  });
  persistRunnerConfig(repoRoot, cfg);
  const work = { id: 'sample-work', title: 'Add the widget', kind: 'feature', status: 'doing', deps: [], risk: 'light', refs: ['src/widget.mjs'], verify: 'npm test' };
  return { repoRoot, fgosDir, worktree, run: () => spawnWorker(work, cfg, worktree, { fgosDir }) };
}

test('a Work driver step with writes in an unbound claim worktree runs as before; the same worktree owned by a case is refused', async () => {
  const free = fixture();
  const result = await free.run();
  assert.equal(result.status, 0, 'the unbound claim worktree is not held up by the port');

  const owned = fixture();
  const made = createPendingBinding({ mainRoot: owned.repoRoot, caseId: 'wf-owner', generation: 1, worktree: owned.worktree });
  commitBinding({ mainRoot: owned.repoRoot, key: made.key, caseId: 'wf-owner', generation: 1 });
  await assert.rejects(() => owned.run(), (err) => err.code === 'bound-worktree-requires-case-authority' && /wf-owner/.test(err.message));
  const assignments = path.join(owned.repoRoot, '.fgos', 'assignments');
  assert.deepEqual(fs.existsSync(assignments) ? fs.readdirSync(assignments) : [], [], 'refused before a unit run exists');
});

// The text of the call whose `(` is at `open`: up to its matching `)`.
function callText(source, open) {
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '(') depth += 1;
    else if (source[i] === ')' && --depth === 0) return source.slice(open, i + 1);
  }
  return '';
}

test('every production call of a unit run injects the case admission port, so no writer is missed', () => {
  const files = [
    'bin/fgos.mjs',
    'src/workflow/runner.mjs',
    'src/runner/work-dispatch.mjs',
    'src/runner/operation-choice.mjs',
    'src/runner/fanout-batch.mjs',
  ];
  let calls = 0;
  for (const rel of files) {
    const source = fs.readFileSync(path.join(root, rel), 'utf8');
    // `runInHost` is the Workflow runner's one wrapper of runUnitInHost over its shared options.
    for (const match of source.matchAll(/(?<!function )\b(runUnitInHost|runInHost)\(/g)) {
      const call = callText(source, match.index + match[1].length);
      if (/^\(\{ caseAdmission, onUnitRunCreated, onCaseAdmitted, \.\.\.request \}\)/.test(call) || /^\(request, \{ caseAdmission/.test(call)) continue;
      calls += 1;
      if (/runOptions/.test(call)) {
        assert.match(source, /const runOptions = \{[\s\S]*?caseAdmission: run\.port,[\s\S]*?\n {2}\};/, `${rel}: the shared options carry the port`);
      } else {
        assert.match(call, /caseAdmission/, `${rel}: ${match[1]} call without caseAdmission`);
      }
    }
  }
  assert.equal(calls, 6, 'the five writing call sites of a unit run and the read-only session probe door are the ones checked');
  // The native `fgos run` builds its request, port included, in the host (fgos-execution run_request).
  // runUnitInHost (the host seam) is the only door to a unit run; nothing else names one.
  const core = ['src/native/execution-door.mjs'];
  const stray = ['src', 'bin'].flatMap((dir) => execFileSync('grep', ['-rlE', '--include=*.mjs', 'runUnit(InHost)?\\(', path.join(root, dir)], { encoding: 'utf8' }).split('\n').filter(Boolean))
    .map((f) => path.relative(root, f)).filter((f) => !files.includes(f) && !core.includes(f));
  assert.deepEqual(stray, []);
});
