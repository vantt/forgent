import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  initGitCwd,
  initGitCwdWithWorktree,
  run,
} from './helpers/fgos-cli-harness.mjs';

function setupPreflightFixture(cwd) {
  // 1. package.json
  const pkgJson = {
    name: 'test-preflight-fixture',
    version: '0.1.0',
    type: 'module',
    scripts: {
      'build:skills': 'node scripts/build-skill-wrappers.mjs',
    },
  };
  fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify(pkgJson, null, 2));

  // 2. Skill wrapper source & mirrors
  const skillSrc = '---\nname: dummy\n---\nDummy skill content\n';
  fs.mkdirSync(path.join(cwd, '.agents/skills/dummy'), { recursive: true });
  fs.mkdirSync(path.join(cwd, '.claude/skills/dummy'), { recursive: true });
  fs.mkdirSync(path.join(cwd, 'plugins/fgOS/skills/dummy'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.agents/skills/dummy/SKILL.md'), skillSrc);
  fs.writeFileSync(path.join(cwd, '.claude/skills/dummy/SKILL.md'), skillSrc);
  fs.writeFileSync(path.join(cwd, 'plugins/fgOS/skills/dummy/SKILL.md'), skillSrc);

  // 3. Mock scripts
  fs.mkdirSync(path.join(cwd, 'scripts'), { recursive: true });
  const buildSkillWrappersScript = `import fs from 'node:fs';
import path from 'node:path';
const src = fs.readFileSync(path.join(process.cwd(), '.agents/skills/dummy/SKILL.md'), 'utf8');
fs.mkdirSync(path.join(process.cwd(), '.claude/skills/dummy'), { recursive: true });
fs.mkdirSync(path.join(process.cwd(), 'plugins/fgOS/skills/dummy'), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), '.claude/skills/dummy/SKILL.md'), src);
fs.writeFileSync(path.join(process.cwd(), 'plugins/fgOS/skills/dummy/SKILL.md'), src);
`;
  fs.writeFileSync(path.join(cwd, 'scripts/build-skill-wrappers.mjs'), buildSkillWrappersScript);

  const checkDriftScript = `import fs from 'node:fs';
if (fs.existsSync('drift.flag')) {
  console.log('check-decision-citation-drift: 1 finding(s):\\n  - drift detected in specs');
  process.exit(1);
} else {
  console.log('check-decision-citation-drift: no new findings (0 baselined).');
  process.exit(0);
}
`;
  fs.writeFileSync(path.join(cwd, 'scripts/check-decision-citation-drift.mjs'), checkDriftScript);

  const checkBacklogScript = `import fs from 'node:fs';
if (fs.existsSync('backlog.flag')) {
  console.error('FAIL: 1 problem(s) reconciling 1 proposed PBI rows:\\n  - tsk-dummy: proposed in docs/backlog.md but has no section in RECONCILIATION.md');
  process.exit(1);
} else {
  console.log('OK: all 0 proposed PBI rows reconciled with evidence.');
  process.exit(0);
}
`;
  fs.writeFileSync(path.join(cwd, 'scripts/check-backlog-reconciliation.mjs'), checkBacklogScript);

  // Commit all fixture files so git diff is initially clean
  execFileSync('git', ['add', '.'], { cwd });
  execFileSync('git', ['commit', '-m', 'fixture setup'], { cwd });
}

test('fgos preflight passes when all 3 checks pass (exit 0)', () => {
  const cwd = initGitCwd();
  setupPreflightFixture(cwd);

  const res = run(cwd, ['preflight']);
  assert.equal(res.status, 0, `expected status 0, got ${res.status}: ${res.stderr || res.stdout}`);

  const envelope = JSON.parse(res.stdout);
  assert.ok(Array.isArray(envelope.data.checks), 'envelope data should have checks array');
  assert.equal(envelope.data.checks.length, 3);
  for (const check of envelope.data.checks) {
    assert.equal(check.passed, true, `check ${check.id} should have passed`);
  }
});

test('fgos preflight fails when mirror-sync-diff detects uncommitted skill wrapper drift (exit 4)', () => {
  const cwd = initGitCwd();
  setupPreflightFixture(cwd);

  // Modify source skill wrapper so build:skills creates uncommitted diff in .claude/skills
  fs.writeFileSync(path.join(cwd, '.agents/skills/dummy/SKILL.md'), '---\nname: dummy\n---\nModified skill content\n');

  const res = run(cwd, ['preflight']);
  assert.equal(res.status, 4, `expected status 4, got ${res.status}: ${res.stderr || res.stdout}`);
  assert.ok(res.stderr.includes('mirror-sync-diff'), 'stderr should list mirror-sync-diff failure');
  assert.ok(res.stderr.includes('1 of 3 check(s) failed'), 'stderr should mention 1 of 3 checks failed');
});

test('fgos preflight fails when decision-citation-drift check fails (exit 4)', () => {
  const cwd = initGitCwd();
  setupPreflightFixture(cwd);

  // Trigger decision citation drift failure
  fs.writeFileSync(path.join(cwd, 'drift.flag'), 'fail');

  const res = run(cwd, ['preflight']);
  assert.equal(res.status, 4, `expected status 4, got ${res.status}: ${res.stderr || res.stdout}`);
  assert.ok(res.stderr.includes('decision-citation-drift'), 'stderr should list decision-citation-drift failure');
  assert.ok(res.stderr.includes('drift detected in specs'), 'stderr should include check failure message');
});

test('fgos preflight fails when backlog-reconciliation check fails (exit 4)', () => {
  const cwd = initGitCwd();
  setupPreflightFixture(cwd);

  // Trigger backlog reconciliation failure
  fs.writeFileSync(path.join(cwd, 'backlog.flag'), 'fail');

  const res = run(cwd, ['preflight']);
  assert.equal(res.status, 4, `expected status 4, got ${res.status}: ${res.stderr || res.stdout}`);
  assert.ok(res.stderr.includes('backlog-reconciliation'), 'stderr should list backlog-reconciliation failure');
  assert.ok(res.stderr.includes('proposed in docs/backlog.md'), 'stderr should include check failure message');
});

test('fgos preflight aggregates multiple failing checks in failure message', () => {
  const cwd = initGitCwd();
  setupPreflightFixture(cwd);

  // Trigger both decision citation drift and backlog reconciliation failures
  fs.writeFileSync(path.join(cwd, 'drift.flag'), 'fail');
  fs.writeFileSync(path.join(cwd, 'backlog.flag'), 'fail');

  const res = run(cwd, ['preflight']);
  assert.equal(res.status, 4, `expected status 4, got ${res.status}: ${res.stderr || res.stdout}`);
  assert.ok(res.stderr.includes('2 of 3 check(s) failed'), 'stderr should mention 2 of 3 checks failed');
  assert.ok(res.stderr.includes('decision-citation-drift'), 'stderr should list decision-citation-drift failure');
  assert.ok(res.stderr.includes('backlog-reconciliation'), 'stderr should list backlog-reconciliation failure');
});

test('fgos preflight works from inside a linked worktree', () => {
  const cwd = initGitCwd();
  setupPreflightFixture(cwd);

  const worktreePath = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-wt-'));
  fs.rmSync(worktreePath, { recursive: true, force: true });
  execFileSync('git', ['worktree', 'add', '-b', `wt-${path.basename(worktreePath)}`, worktreePath], { cwd });

  // Run preflight from inside the linked worktree
  const res = run(worktreePath, ['preflight']);
  assert.equal(res.status, 0, `expected status 0 in worktree, got ${res.status}: ${res.stderr || res.stdout}`);
  const envelope = JSON.parse(res.stdout);
  assert.equal(envelope.data.checks.length, 3);
});
