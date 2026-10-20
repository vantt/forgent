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
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
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

// The block of braces that follows `runUnit(` at `start`.
function callBlock(source, start) {
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}' && --depth === 0) return source.slice(open, i + 1);
  }
  return '';
}

test('every production call of runUnit injects the case admission port, so no writer is missed', () => {
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
    for (const match of source.matchAll(/\brunUnit\((?:\{|runOptions\))/g)) {
      calls += 1;
      const block = callBlock(source, match.index);
      if (match[0].includes('runOptions') || block.includes('...runOptions')) {
        assert.match(source, /const runOptions = \{[\s\S]*?caseAdmission: port,[\s\S]*?\n {14}\};/, `${rel}: the shared options carry the port`);
      } else {
        assert.match(block, /caseAdmission/, `${rel}: runUnit call without caseAdmission`);
      }
    }
  }
  assert.equal(calls, 6, 'the six writing call sites of runUnit are the ones checked');
  // The only other place runUnit is defined or named is the Execution Core itself.
  const stray = ['src', 'bin'].flatMap((dir) => execFileSync('grep', ['-rl', '--include=*.mjs', 'runUnit(', path.join(root, dir)], { encoding: 'utf8' }).split('\n').filter(Boolean))
    .map((f) => path.relative(root, f)).filter((f) => !files.includes(f) && f !== 'src/runner/execution/run.mjs');
  assert.deepEqual(stray, []);
});
