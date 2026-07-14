// Tests for repo-divorce.mjs. Lives outside test/ so it stays a workshop asset
// and is never swept into the product suite (npm test globs test/**). All tests
// operate on throwaway tmp dirs — none run the real --execute cut or touch the
// live workspace.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  classify,
  planWorkspace,
  isSplitParent,
  Journal,
  rollback,
  stepWholeTreeMove,
  stepUntrack,
  stepExtractWorkshop,
  stepPrecheck,
  resolveGitIdentity,
  STAGED_FILES,
  main,
} from './repo-divorce.mjs';

const SCRIPT = fileURLToPath(new URL('./repo-divorce.mjs', import.meta.url));
const REPO_ROOT = path.resolve(path.dirname(SCRIPT), '..');

function mkTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'repo-divorce-'));
}

function touch(root, rel, content = '') {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function initGitRepo(root, files) {
  execFileSync('git', ['-C', root, 'init', '--quiet']);
  execFileSync('git', ['-C', root, 'config', 'user.email', 'test@example.com']);
  execFileSync('git', ['-C', root, 'config', 'user.name', 'Test']);
  for (const [rel, content] of Object.entries(files)) touch(root, rel, content);
  execFileSync('git', ['-C', root, 'add', '-A']);
  execFileSync('git', ['-C', root, 'commit', '--quiet', '-m', 'init']);
}

// --- classify ---------------------------------------------------------------

test('classify: workshop deny-list entries', () => {
  for (const p of ['.bee', '.claude', '.agents', '.codex', 'plans', 'upstreams', 'scripts']) {
    assert.equal(classify(p), 'workshop', p);
  }
  assert.equal(classify('.bee/config.json'), 'workshop');
  assert.equal(classify('scripts/repo-divorce.mjs'), 'workshop');
});

test('classify: product enumerated set', () => {
  for (const p of ['src', 'test', 'bin', '.fgos', '.fgos-runner.json', 'package.json', 'README.md', 'LICENSE', '.gitignore', '.gitnexus']) {
    assert.equal(classify(p), 'product', p);
  }
  assert.equal(classify('src/index.mjs'), 'product');
});

test('classify: docs/ splits both ways', () => {
  assert.equal(classify('docs/history'), 'workshop');
  assert.equal(classify('docs/distillery'), 'workshop');
  assert.equal(classify('docs/reference-learning-system.md'), 'workshop');
  assert.equal(classify('docs/naming.md'), 'workshop');
  assert.equal(classify('docs/specs'), 'product');
  assert.equal(classify('docs/specs/system-overview.md'), 'product');
  assert.equal(classify('docs/platform-foundations.md'), 'product');
  assert.equal(classify('docs/backlog.md'), 'product');
  assert.equal(classify('docs/routing-handoff-contract.md'), 'product');
  assert.equal(classify('docs/decisions'), 'product');
});

test('classify: doctrine and git-meta are their own categories', () => {
  assert.equal(classify('AGENTS.md'), 'doctrine');
  assert.equal(classify('CLAUDE.md'), 'doctrine');
  assert.equal(classify('.git'), 'git-meta');
});

test('classify: unknown entry falls through', () => {
  assert.equal(classify('mystery-dir'), 'unknown');
  assert.equal(classify('docs/mystery.md'), 'unknown');
});

test('isSplitParent: docs is a split parent, an unknown dir is not', () => {
  assert.equal(isSplitParent('docs'), true);
  assert.equal(isSplitParent('mystery-dir'), false);
});

// --- planWorkspace: unknown -> STOP-ASK ------------------------------------

test('planWorkspace: an unknown top-level entry lands in unknown, known ones classify', () => {
  const root = mkTmp();
  touch(root, 'src/index.mjs');
  touch(root, '.bee/config.json');
  touch(root, 'AGENTS.md');
  touch(root, 'docs/specs/x.md');
  touch(root, 'docs/history/y.md');
  fs.mkdirSync(path.join(root, 'mystery-dir'));

  const { plan, unknown } = planWorkspace(root);
  assert.deepEqual(unknown, ['mystery-dir']);
  const byCat = (c) => plan.filter((i) => i.category === c).map((i) => i.path).sort();
  assert.deepEqual(byCat('product'), ['docs/specs', 'src']);
  assert.deepEqual(byCat('workshop'), ['.bee', 'docs/history']);
  assert.deepEqual(byCat('doctrine'), ['AGENTS.md']);
});

test('planWorkspace: an unknown docs/ child is caught by the split-parent safety net', () => {
  const root = mkTmp();
  touch(root, 'docs/specs/x.md');
  touch(root, 'docs/mystery.md');
  const { unknown } = planWorkspace(root);
  assert.deepEqual(unknown, ['docs/mystery.md']);
});

// --- dry-run on the real workspace: exit 0, zero mutation -------------------

test('dry-run on the real workspace: exit 0 and no mutation', () => {
  const before = fs.readdirSync(REPO_ROOT).sort();
  const sentinel = fs.readFileSync(path.join(REPO_ROOT, 'package.json'));

  const out = execFileSync('node', [SCRIPT, '--dry-run'], { cwd: REPO_ROOT, encoding: 'utf8' });
  assert.match(out, /repo-divorce migration plan/);
  assert.doesNotMatch(out, /UNKNOWN — STOP-ASK/);

  const after = fs.readdirSync(REPO_ROOT).sort();
  assert.deepEqual(after, before, 'top-level entries unchanged (no repo/ created, nothing moved)');
  assert.equal(fs.existsSync(path.join(REPO_ROOT, 'repo')), false);
  assert.deepEqual(fs.readFileSync(path.join(REPO_ROOT, 'package.json')), sentinel, 'sentinel file untouched');
});

test('dry-run: an unknown top-level entry makes the CLI exit non-zero with STOP-ASK', () => {
  const root = mkTmp();
  touch(root, 'src/index.mjs');
  fs.mkdirSync(path.join(root, 'mystery-dir'));

  let code = 0;
  let stdout = '';
  let stderr = '';
  try {
    stdout = execFileSync('node', [SCRIPT, '--dry-run', '--root', root], { encoding: 'utf8' });
  } catch (err) {
    code = err.status;
    stdout = err.stdout ? err.stdout.toString() : '';
    stderr = err.stderr ? err.stderr.toString() : '';
  }
  assert.equal(code, 2);
  assert.match(stdout + stderr, /STOP-ASK/);
  assert.match(stdout, /mystery-dir/);
});

// --- execute refuses at the untrack point of no return ----------------------

test('stepUntrack: refuses without confirmation and makes no commit', async () => {
  const root = mkTmp();
  const repoDir = path.join(root, 'repo');
  fs.mkdirSync(repoDir);
  initGitRepo(repoDir, { 'src/index.mjs': 'x', '.bee/config.json': '{}' });
  const before = execFileSync('git', ['-C', repoDir, 'rev-list', '--count', 'HEAD'], { encoding: 'utf8' }).trim();

  const journal = new Journal(path.join(root, '.repo-divorce-checkpoint.json'));
  await assert.rejects(
    () => stepUntrack(root, journal, { yes: false, confirm: async () => false }),
    /point of no return/,
  );

  const after = execFileSync('git', ['-C', repoDir, 'rev-list', '--count', 'HEAD'], { encoding: 'utf8' }).trim();
  assert.equal(after, before, 'no untrack commit was created');
  assert.equal(journal.pointOfNoReturn, false);
});

test('stepUntrack: a wholly-ignored workshop dir (0 tracked files) does not fatal (rehearsal B finding)', async () => {
  const root = mkTmp();
  const repoDir = path.join(root, 'repo');
  fs.mkdirSync(repoDir);
  // .gitignore must exist before `git add -A` runs so upstreams/ never gets
  // tracked at all — same shape as the real workspace (0 tracked files).
  touch(repoDir, '.gitignore', '/upstreams/\n');
  touch(repoDir, 'upstreams/some-lib/README.md', 'x');
  initGitRepo(repoDir, { 'src/index.mjs': 'x', '.bee/config.json': '{}' });

  const trackedUpstreams = execFileSync(
    'git', ['-C', repoDir, 'ls-files', '--', 'upstreams'], { encoding: 'utf8' },
  ).trim();
  assert.equal(trackedUpstreams, '', 'fixture matches rehearsal B: upstreams/ has 0 tracked files');

  const journal = new Journal(path.join(root, '.repo-divorce-checkpoint.json'));
  await stepUntrack(root, journal, { yes: true }); // must not throw "did not match any files"

  assert.equal(journal.pointOfNoReturn, true, 'untrack commit still ran for the tracked entries');
  assert.ok(fs.existsSync(path.join(repoDir, 'upstreams/some-lib/README.md')), 'ignored dir left untouched on disk');

  stepExtractWorkshop(root, journal);
  assert.ok(fs.existsSync(path.join(root, 'upstreams/some-lib/README.md')), 'ignored workshop dir still extracted to the workshop');
  assert.ok(fs.existsSync(path.join(root, '.bee/config.json')), 'tracked workshop dir also extracted');
});

// --- extract: filesystem-level, carries ignored workshop content ------------

test('stepExtractWorkshop: moves workshop dirs (incl. ignored content) up, leaves product ignored in repo/', () => {
  const root = mkTmp();
  const repoDir = path.join(root, 'repo');
  // Post-untrack shape: everything is under repo/.
  touch(repoDir, '.bee/config.json', '{}');
  touch(repoDir, '.bee/state.json', '{}'); // gitignored workshop content — must travel
  touch(repoDir, 'plans/x.md');
  touch(repoDir, 'docs/history/y.md');
  touch(repoDir, 'docs/specs/z.md'); // product — must stay
  touch(repoDir, '.gitnexus/index.db'); // gitignored product content — must stay
  touch(repoDir, 'src/index.mjs'); // product — must stay

  const journal = new Journal(path.join(root, '.repo-divorce-checkpoint.json'));
  stepExtractWorkshop(root, journal);

  // Workshop landed at root, ignored content included.
  assert.ok(fs.existsSync(path.join(root, '.bee/config.json')));
  assert.ok(fs.existsSync(path.join(root, '.bee/state.json')), 'ignored workshop file traveled with its dir');
  assert.ok(fs.existsSync(path.join(root, 'plans/x.md')));
  assert.ok(fs.existsSync(path.join(root, 'docs/history/y.md')));
  // Product stayed in repo/.
  assert.equal(fs.existsSync(path.join(root, '.bee')) && fs.existsSync(path.join(repoDir, '.bee')), false, 'workshop no longer under repo/');
  assert.ok(fs.existsSync(path.join(repoDir, 'docs/specs/z.md')), 'product docs stay in repo/');
  assert.ok(fs.existsSync(path.join(repoDir, '.gitnexus/index.db')), 'ignored product content stays in repo/');
  assert.ok(fs.existsSync(path.join(repoDir, 'src/index.mjs')));
});

// --- whole-tree move + rollback (run halfway, then reverse) -----------------

test('stepWholeTreeMove keeps git layout intact; rollback reverses it', () => {
  const root = mkTmp();
  initGitRepo(root, { 'src/index.mjs': 'x', 'package.json': '{}', '.bee/config.json': '{}' });
  const beforeTop = fs.readdirSync(root).sort();

  const journal = new Journal(path.join(root, '.repo-divorce-checkpoint.json'));
  stepWholeTreeMove(root, journal); // postcheck (layout intact) runs inside

  assert.ok(fs.existsSync(path.join(root, 'repo', '.git')), 'whole tree incl .git moved into repo/');
  assert.ok(fs.existsSync(path.join(root, 'repo', 'src/index.mjs')));
  assert.equal(fs.existsSync(path.join(root, 'src')), false, 'nothing left at root except repo/ + journal');

  rollback(root);
  const afterTop = fs.readdirSync(root).sort();
  assert.deepEqual(afterTop, beforeTop, 'rollback restored the original top-level tree');
  assert.equal(fs.existsSync(path.join(root, 'repo')), false, 'repo/ removed by rollback');
});

test('rollback refuses once the point of no return is recorded', () => {
  const root = mkTmp();
  const journalFile = path.join(root, '.repo-divorce-checkpoint.json');
  const journal = new Journal(journalFile);
  journal.record({ type: 'create', path: path.join(root, 'repo') });
  fs.mkdirSync(path.join(root, 'repo'));
  journal.markPointOfNoReturn();

  assert.throws(() => rollback(root), /point of no return/);
});

// --- Rehearsal round-2 fixture: a full --execute on a throwaway copy ---------

// Build a realistic workspace: git repo with product + workshop trees, doctrine
// carrying a BEE block, the six flat staged files cell 2 delivers, and an
// optional gitignored upstreams/ clone with its own nested .git.
function buildDivorceFixture(root, { withIdentity = true, withUpstreamsRepo = false } = {}) {
  execFileSync('git', ['-C', root, 'init', '--quiet']);
  if (withIdentity) {
    execFileSync('git', ['-C', root, 'config', 'user.email', 'test@example.com']);
    execFileSync('git', ['-C', root, 'config', 'user.name', 'Test']);
  }
  // Product tree.
  touch(root, 'src/index.mjs', 'export const x = 1;\n');
  touch(root, 'package.json', '{"name":"p"}\n');
  touch(root, 'README.md', '# p\n');
  touch(root, 'LICENSE', 'MIT\n');
  touch(root, 'bin/p.mjs', '#!/usr/bin/env node\n');
  touch(root, 'test/p.test.mjs', '');
  touch(root, 'docs/specs/s.md', '# spec\n');
  touch(root, '.gitignore', '/upstreams/\nnode_modules/\n');
  // Workshop tree.
  touch(root, '.bee/config.json', '{\n  "commands": {\n    "test": "npm test",\n    "verify": "npm test && node .claude/skills/distill/scripts/distill.mjs check"\n  }\n}\n');
  touch(root, '.bee/bin/hooks/h.mjs', '');
  touch(root, 'plans/p.md', '');
  touch(root, 'docs/history/h.md', '');
  // Doctrine: the original AGENTS.md carries the BEE block.
  touch(root, 'AGENTS.md', '# forgent\n\n# BEE:START\nbee doctrine block\n# BEE:END\n');
  touch(root, 'CLAUDE.md', '# CLAUDE original\n');
  // Six flat staged files (cell 2's layout). Content here is fixture-only.
  touch(root, 'scripts/repo-divorce-staged/AGENTS.repo.md', '# forgent (product only)\nno workshop block here\n');
  touch(root, 'scripts/repo-divorce-staged/CLAUDE.repo.md', '# CLAUDE product\n');
  touch(root, 'scripts/repo-divorce-staged/reading-map.repo.md', '# product reading map\n');
  touch(root, 'scripts/repo-divorce-staged/AGENTS.workshop.md', '# workshop\n\n# BEE:START\nbee doctrine block\n# BEE:END\n');
  touch(root, 'scripts/repo-divorce-staged/CLAUDE.workshop.md', '# CLAUDE workshop\n');
  touch(root, 'scripts/repo-divorce-staged/reading-map.workshop.md', '# workshop reading map\n');
  if (withUpstreamsRepo) {
    const up = path.join(root, 'upstreams', 'lib');
    fs.mkdirSync(up, { recursive: true });
    execFileSync('git', ['-C', up, 'init', '--quiet']);
    execFileSync('git', ['-C', up, 'config', 'user.email', 'u@example.com']);
    execFileSync('git', ['-C', up, 'config', 'user.name', 'U']);
    touch(up, 'readme.md', 'lib\n');
    execFileSync('git', ['-C', up, 'add', '-A']);
    execFileSync('git', ['-C', up, 'commit', '--quiet', '-m', 'lib init']);
  }
  if (withIdentity) {
    execFileSync('git', ['-C', root, 'add', '-A']);
    execFileSync('git', ['-C', root, 'commit', '--quiet', '-m', 'init']);
  }
}

// F1 — the swap consumes the flat staged files: the product's doctrine is
// stripped of the BEE block, the workshop keeps it.
test('F1: execute swaps flat staged doctrine — repo/AGENTS.md loses the BEE block, workshop root keeps it', async () => {
  const root = mkTmp();
  buildDivorceFixture(root);

  const code = await main(['--execute', '--yes', '--root', root]);
  assert.equal(code, 0);

  const repoAgents = fs.readFileSync(path.join(root, 'repo', 'AGENTS.md'), 'utf8');
  assert.doesNotMatch(repoAgents, /BEE:/, 'product doctrine no longer carries the BEE block');
  const workshopAgents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  assert.match(workshopAgents, /BEE:START/, 'workshop doctrine keeps the BEE block');
  // Reading-map lands at both mapped destinations.
  assert.ok(fs.existsSync(path.join(root, 'repo', 'docs/specs/reading-map.md')), 'product reading-map placed');
  assert.ok(fs.existsSync(path.join(root, 'docs/reading-map.md')), 'workshop reading-map placed at root');
});

// F1 — a missing staged file fails at the step-0 precheck, before any move.
test('F1: a missing staged file fatals at precheck, before any mutation', () => {
  const root = mkTmp();
  buildDivorceFixture(root);
  fs.rmSync(path.join(root, 'scripts/repo-divorce-staged', STAGED_FILES[0]));

  assert.throws(() => stepPrecheck(root), /staged doctrine file\(s\) missing/);
  assert.equal(fs.existsSync(path.join(root, 'repo')), false, 'no repo/ created — tree untouched');
});

// F2 — an unresolvable git identity fatals at step 0, before step 1, no mutation.
test('F2: no git identity fatals before step 1 with zero mutation', () => {
  const root = mkTmp();
  buildDivorceFixture(root, { withIdentity: false });
  const beforeTop = fs.readdirSync(root).sort();

  const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' };
  let code = 0;
  let stderr = '';
  try {
    execFileSync('node', [SCRIPT, '--execute', '--yes', '--root', root], { env, encoding: 'utf8' });
  } catch (err) {
    code = err.status;
    stderr = err.stderr ? err.stderr.toString() : '';
  }
  assert.notEqual(code, 0, 'execute refused');
  assert.match(stderr, /identity unresolvable/);
  assert.equal(fs.existsSync(path.join(root, 'repo')), false, 'no repo/ created before the fatal');
  assert.deepEqual(fs.readdirSync(root).sort(), beforeTop, 'top-level tree untouched');
});

test('resolveGitIdentity throws when neither repo-local nor global identity is set', () => {
  const root = mkTmp();
  execFileSync('git', ['-C', root, 'init', '--quiet']);
  const saved = { g: process.env.GIT_CONFIG_GLOBAL, s: process.env.GIT_CONFIG_SYSTEM };
  process.env.GIT_CONFIG_GLOBAL = '/dev/null';
  process.env.GIT_CONFIG_SYSTEM = '/dev/null';
  try {
    assert.throws(() => resolveGitIdentity(root), /identity unresolvable/);
  } finally {
    if (saved.g === undefined) delete process.env.GIT_CONFIG_GLOBAL;
    else process.env.GIT_CONFIG_GLOBAL = saved.g;
    if (saved.s === undefined) delete process.env.GIT_CONFIG_SYSTEM;
    else process.env.GIT_CONFIG_SYSTEM = saved.s;
  }
});

// F3 — a gitignored upstreams/ clone with its own nested .git never becomes a
// gitlink in the workshop repo.
test('F3: an ignored upstreams/ clone with a nested .git produces no gitlink in the workshop repo', async () => {
  const root = mkTmp();
  buildDivorceFixture(root, { withUpstreamsRepo: true });

  const code = await main(['--execute', '--yes', '--root', root]);
  assert.equal(code, 0);

  // upstreams was extracted to the workshop root, its nested repo intact...
  assert.ok(fs.existsSync(path.join(root, 'upstreams/lib/.git')), 'nested upstream repo present at workshop root');
  // ...but the workshop git repo tracks nothing under it (no gitlink, no files).
  const trackedUpstreams = execFileSync('git', ['-C', root, 'ls-files', '--', 'upstreams'], { encoding: 'utf8' }).trim();
  assert.equal(trackedUpstreams, '', 'upstreams/ is not tracked in the workshop repo');
  const gitlinks = execFileSync('git', ['-C', root, 'ls-files', '-s'], { encoding: 'utf8' })
    .split('\n')
    .filter((l) => l.startsWith('160000'));
  assert.deepEqual(gitlinks, [], 'no gitlink entries anywhere in the workshop index');
});
