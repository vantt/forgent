import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RESPONSIBILITIES,
  scanRunInitSites,
  resolveCwdConstructor,
  classifyRunInitSite,
  inventoryRunInitSites,
  classifyProfiledTest,
  inventoryProfiledTests,
  inventoryProfiledFiles,
  checkAdmission,
  addedLinesFromGitDiff,
} from '../../scripts/test-proof-inventory.mjs';

test('RESPONSIBILITIES is the exact eight-category taxonomy from the plan, unknown last', () => {
  assert.deepEqual(RESPONSIBILITIES, [
    'direct-business-proof',
    'fixture-construction',
    'process-contract',
    'git-process-integration',
    'cross-language-packaging',
    'large-state-artifact-boundary',
    'concurrency-timing',
    'unknown',
  ]);
});

test('scanRunInitSites finds a bare run(cwd, [\'init\']) call and reports its line/cwdVar', () => {
  const content = "test('x', () => {\n  const cwd = tmpCwd();\n  run(cwd, ['init']);\n});\n";
  const sites = scanRunInitSites(content, 'test/example.test.mjs');
  assert.equal(sites.length, 1);
  assert.equal(sites[0].line, 3);
  assert.equal(sites[0].cwdVar, 'cwd');
  assert.equal(sites[0].resultUsed, false);
});

test('scanRunInitSites ignores run() calls for other verbs entirely', () => {
  const content = "run(cwd, ['take']);\nrun(cwd, ['return', 'id']);\n";
  assert.deepEqual(scanRunInitSites(content, 'f.mjs'), []);
});

test('scanRunInitSites marks a site resultUsed when the return value is assigned', () => {
  const content = "const result = run(cwd, ['init']);\nassert.equal(result.status, 0);\n";
  const sites = scanRunInitSites(content, 'f.mjs');
  assert.equal(sites[0].resultUsed, true);
});

test('scanRunInitSites marks a site resultUsed when the call is inlined into an assertion', () => {
  const content = "assert.equal(run(cwd, ['init']).status, 0);\n";
  const sites = scanRunInitSites(content, 'f.mjs');
  assert.equal(sites[0].resultUsed, true);
});

test('resolveCwdConstructor finds the nearest preceding plain-variable constructor call', () => {
  const lines = ['  const cwd = initGitCwd();', '  run(cwd, [\'init\']);'];
  assert.equal(resolveCwdConstructor(lines, 1, 'cwd'), 'initGitCwd');
});

test('resolveCwdConstructor finds the nearest preceding destructured constructor call', () => {
  const lines = ['  const { cwd } = initGitCwdInSubdir();', '  run(cwd, [\'init\']);'];
  assert.equal(resolveCwdConstructor(lines, 1, 'cwd'), 'initGitCwdInSubdir');
});

test('resolveCwdConstructor returns null rather than guessing when no constructor is found in-file', () => {
  const lines = ["run(cwd, ['init']);"];
  assert.equal(resolveCwdConstructor(lines, 0, 'cwd'), null);
});

test('classifyRunInitSite: discarded result + non-subdir constructor is fixture-construction, optimize-execution', () => {
  const cls = classifyRunInitSite({ resultUsed: false, cwdConstructor: 'initSessionSafeCwd' });
  assert.equal(cls.primaryResponsibility, 'fixture-construction');
  assert.equal(cls.disposition, 'optimize-execution');
});

test('classifyRunInitSite: discarded result + subdir constructor is process-contract, retain (P06 precedent)', () => {
  const cls = classifyRunInitSite({ resultUsed: false, cwdConstructor: 'initGitCwdInSubdir' });
  assert.equal(cls.primaryResponsibility, 'process-contract');
  assert.equal(cls.disposition, 'retain');
  assert.match(cls.reason, /subdir/);
});

test('classifyRunInitSite: consumed result is left unknown rather than guessed, regardless of constructor', () => {
  const cls = classifyRunInitSite({ resultUsed: true, cwdConstructor: 'initGitCwdInSubdir' });
  assert.equal(cls.primaryResponsibility, 'unknown');
  assert.equal(cls.disposition, 'retain');
});

test('inventoryRunInitSites classifies every site in an injected multi-file corpus and skips a file absent from the tree', () => {
  const files = {
    'test/cli/fgos-a.test.mjs': "const cwd = initSessionSafeCwd();\nrun(cwd, ['init']);\n",
    'test/cli/fgos-b.test.mjs': "const { cwd } = initGitCwdInSubdir();\nrun(cwd, ['init']);\n",
  };
  const entries = inventoryRunInitSites(['test/cli/fgos-a.test.mjs', 'test/cli/fgos-b.test.mjs', 'test/cli/fgos-missing.test.mjs'], {
    readFile: (abs) => {
      const rel = Object.keys(files).find((f) => abs.endsWith(f));
      if (!rel) throw new Error('ENOENT');
      return files[rel];
    },
  });
  assert.equal(entries.length, 2);
  assert.equal(entries[0].primaryResponsibility, 'fixture-construction');
  assert.equal(entries[1].primaryResponsibility, 'process-contract');
  for (const e of entries) {
    assert.equal(e.evidenceLevel, 'static');
    assert.deepEqual(e.subprocesses, ['fgos init']);
  }
});

test('inventoryRunInitSites matches the real P02 nine-file lease: 3 process-contract (subdir) + 4 fixture-construction, zero unknown', () => {
  const nineFiles = [
    'test/cli/fgos-claim.test.mjs',
    'test/cli/fgos-claim-2.test.mjs',
    'test/cli/fgos-read-5.test.mjs',
    'test/cli/fgos-return-2.test.mjs',
    'test/cli/fgos-iron-law-gate.test.mjs',
    'test/cli/fgos-move.test.mjs',
    'test/cli/fgos-approve-5.test.mjs',
    'test/cli/fgos-return-3.test.mjs',
    'test/cli/fgos-return-4.test.mjs',
  ];
  const entries = inventoryRunInitSites(nineFiles);
  assert.equal(entries.length, 7, 'current-tree count differs from the reprofiled P00A baseline; re-verify before trusting P02 scope');
  const byResp = entries.reduce((acc, e) => {
    acc[e.primaryResponsibility] = (acc[e.primaryResponsibility] ?? 0) + 1;
    return acc;
  }, {});
  assert.equal(byResp['process-contract'], 3);
  assert.equal(byResp['fixture-construction'], 4);
  assert.equal(byResp.unknown ?? 0, 0);
});

test('classifyProfiledTest: rust-host directory is cross-language-packaging', () => {
  const cls = classifyProfiledTest({ name: 'some fgctl behavior', file: '/repo/test/rust-host/fgctl-init.test.mjs' }, { repoRoot: '/repo' });
  assert.equal(cls.primaryResponsibility, 'cross-language-packaging');
});

test('classifyProfiledTest: a name explicitly naming a race/concurrency is concurrency-timing even outside rust-host', () => {
  const cls = classifyProfiledTest({ name: 'two recommendations racing on the same starting state', file: '/repo/test/runner/apply.test.mjs' }, { repoRoot: '/repo' });
  assert.equal(cls.primaryResponsibility, 'concurrency-timing');
});

test('classifyProfiledTest: keyword rule wins over directory rule when both could apply', () => {
  const cls = classifyProfiledTest({ name: 'concurrent init races', file: '/repo/test/rust-host/fgctl-init.test.mjs' }, { repoRoot: '/repo' });
  assert.equal(cls.primaryResponsibility, 'concurrency-timing');
});

test('classifyProfiledTest: no signal at all is left unknown, never guessed', () => {
  const cls = classifyProfiledTest({ name: 'setup inside a linked worktree still succeeds', file: '/repo/test/cli/fgos-setup.test.mjs' }, { repoRoot: '/repo' });
  assert.equal(cls.primaryResponsibility, 'unknown');
});

test('inventoryProfiledTests preserves measured duration and marks evidenceLevel measured', () => {
  const entries = inventoryProfiledTests([{ name: 'a rust-host test', time: 12.5, file: '/repo/test/rust-host/x.test.mjs' }], { repoRoot: '/repo' });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].durationSeconds, 12.5);
  assert.equal(entries[0].evidenceLevel, 'measured');
  assert.equal(entries[0].file, 'test/rust-host/x.test.mjs');
  assert.equal(entries[0].primaryResponsibility, 'cross-language-packaging');
});

test('inventoryProfiledFiles rolls up per-file totals and leaves a mixed-directory file unknown, not guessed', () => {
  const entries = inventoryProfiledFiles(
    [
      { file: '/repo/test/rust-host/fgctl-init.test.mjs', totalSeconds: 218.42, count: 20 },
      { file: '/repo/test/cli/fgos-merge.test.mjs', totalSeconds: 119.85, count: 59 },
    ],
    { repoRoot: '/repo' },
  );
  assert.equal(entries[0].primaryResponsibility, 'cross-language-packaging');
  assert.equal(entries[0].testCount, 20);
  assert.equal(entries[1].primaryResponsibility, 'unknown');
});

test('checkAdmission flags a brand-new unmarked fgos init call and never flags a marked one', () => {
  const changed = [
    { file: 'test/cli/new.test.mjs', line: 10, text: "  run(cwd, ['init']);", prevText: null },
    { file: 'test/cli/new.test.mjs', line: 20, text: "  run(cwd2, ['init']); // boundary: process-contract, cwd/subdir", prevText: null },
  ];
  const violations = checkAdmission(changed);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].line, 10);
  assert.equal(violations[0].ruleId, 'new-fixture-only-init-without-reason');
});

test('checkAdmission is warning-only baseline-ratcheted: a previously accepted violation at the same file/line does not re-fire', () => {
  const changed = [{ file: 'test/cli/legacy.test.mjs', line: 5, text: "  run(cwd, ['init']);", prevText: null }];
  const baseline = [{ ruleId: 'new-fixture-only-init-without-reason', file: 'test/cli/legacy.test.mjs', line: 5 }];
  assert.deepEqual(checkAdmission(changed, baseline), []);
});

test('checkAdmission flags a new unmarked real network call', () => {
  const changed = [{ file: 'test/runner/x.test.mjs', line: 3, text: "  await fetch('https://example.com');", prevText: null }];
  const violations = checkAdmission(changed);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].ruleId, 'new-real-provider-network-without-marker');
});

test('checkAdmission does not flag a marker on the line immediately above the violation', () => {
  const changed = [
    { file: 'test/runner/x.test.mjs', line: 3, text: '  // provider-boundary: real health-check ping', prevText: null },
    { file: 'test/runner/x.test.mjs', line: 4, text: "  await fetch('https://example.com');", prevText: '  // provider-boundary: real health-check ping' },
  ];
  assert.deepEqual(checkAdmission(changed), []);
});

test('addedLinesFromGitDiff returns [] for an empty scope without touching git at all', () => {
  const rows = addedLinesFromGitDiff([], { exec: () => { throw new Error('must not be called'); } });
  assert.deepEqual(rows, []);
});

test('addedLinesFromGitDiff extracts only added lines with correct new-file line numbers, skipping deletions', () => {
  const diff = [
    'diff --git a/test/x.test.mjs b/test/x.test.mjs',
    '--- a/test/x.test.mjs',
    '+++ b/test/x.test.mjs',
    '@@ -5,2 +5,3 @@',
    ' unchanged line',
    "-old line removed",
    "+run(cwd, ['init']);",
    '+another added line',
    '',
  ].join('\n');
  const rows = addedLinesFromGitDiff(['test/x.test.mjs'], { exec: () => diff });
  assert.equal(rows.length, 2);
  assert.equal(rows[0].file, 'test/x.test.mjs');
  assert.equal(rows[0].line, 5);
  assert.equal(rows[0].text, "run(cwd, ['init']);");
  assert.equal(rows[1].line, 6);
});
