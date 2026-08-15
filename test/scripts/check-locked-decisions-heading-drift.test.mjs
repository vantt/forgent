import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findLockedDecisionsHeadingDriftFindings } from '../../scripts/check-locked-decisions-heading-drift.mjs';

const scriptPath = fileURLToPath(
  new URL('../../scripts/check-locked-decisions-heading-drift.mjs', import.meta.url),
);

// --- findLockedDecisionsHeadingDriftFindings: pure function ----------

test('a real decisions table under a translated heading is reported', () => {
  const content = [
    '# feature — locked decisions',
    '',
    '## Quyết định đã khoá',
    '',
    '| ID | Decision |',
    '|----|----------|',
    '| D1 | something real |',
  ].join('\n');

  const findings = findLockedDecisionsHeadingDriftFindings([
    { file: 'docs/history/x/CONTEXT.md', content },
  ]);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, 'docs/history/x/CONTEXT.md');
  assert.equal(findings[0].heading, 'Quyết định đã khoá');
});

test('a real decisions table under a numbered variant of the exact heading is reported', () => {
  const content = [
    '# feature',
    '',
    '## 2. Locked decisions',
    '',
    '### D1 — something real',
    '',
    'body text',
  ].join('\n');

  const findings = findLockedDecisionsHeadingDriftFindings([
    { file: 'docs/history/y/CONTEXT.md', content },
  ]);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].heading, '2. Locked decisions');
});

test('a real decisions table under a wrong heading LEVEL (h1 instead of h2) is reported', () => {
  const content = ['# feature', '', '# Locked decisions', '', '| D1 | real |'].join('\n');

  const findings = findLockedDecisionsHeadingDriftFindings([
    { file: 'docs/history/z/CONTEXT.md', content },
  ]);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].heading, 'Locked decisions');
});

test('the exact canonical heading is never reported, even with a numbered/suffixed body', () => {
  const content = [
    '# feature',
    '',
    '## Locked decisions (D1-D6)',
    '',
    '| D1 | real |',
  ].join('\n');

  assert.deepEqual(
    findLockedDecisionsHeadingDriftFindings([{ file: 'docs/history/ok/CONTEXT.md', content }]),
    [],
  );
});

test(
  'a D-ID cited only in unrelated prose (e.g. quoting another feature) is not a false positive ' +
    'when this file\'s own canonical section — or lack of a decision-like heading — has none',
  () => {
    const content = [
      '# feature — locked decisions',
      '',
      'Real 2026-08-02 repro: tsk-4voj is status:delivered (decisions D1/D2 ' +
        'locked, only compound-learn left) and tsk-3bn depends on it.',
      '',
      '## Feature boundary',
      '',
      'more prose, no decisions here',
      '',
      '## Locked decisions',
      '',
      'No Socratic questions were asked — nothing was locked for this item.',
    ].join('\n');

    assert.deepEqual(
      findLockedDecisionsHeadingDriftFindings([{ file: 'docs/history/ref/CONTEXT.md', content }]),
      [],
    );
  },
);

test('a file with no decisions table at all (e.g. a short retro note) reports zero findings', () => {
  const content = ['# outcome note', '', '## Outcome', '', 'fixed by commit abc123'].join('\n');

  assert.deepEqual(
    findLockedDecisionsHeadingDriftFindings([{ file: 'docs/history/note/CONTEXT.md', content }]),
    [],
  );
});

// --- CLI: real end-to-end run ---------------------------

test('CLI run over a fixture reports the drifted heading and exits 1', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'locked-decisions-drift-'));
  const historyDir = path.join(dir, 'history');
  const featureDir = path.join(historyDir, 'drifted-feature');
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(
    path.join(featureDir, 'CONTEXT.md'),
    ['# drifted-feature', '', '## Quyết định đã khoá', '', '| D1 | real |'].join('\n'),
  );

  const result = spawnSync(process.execPath, [scriptPath, '--docs-history-dir', historyDir], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /1 finding/);
  assert.match(result.stdout, /Quyết định đã khoá/);
});

test('CLI run over a fixture with no drift exits 0', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'locked-decisions-drift-'));
  const historyDir = path.join(dir, 'history');
  const featureDir = path.join(historyDir, 'clean-feature');
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(
    path.join(featureDir, 'CONTEXT.md'),
    ['# clean-feature', '', '## Locked decisions', '', '| D1 | real |'].join('\n'),
  );

  const result = spawnSync(process.execPath, [scriptPath, '--docs-history-dir', historyDir], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /no findings/);
});

// --- Real corpus: proves the actual repo is clean -------

test('every real docs/history/*/CONTEXT.md in this repo is free of heading drift', () => {
  const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
  const result = spawnSync(process.execPath, [scriptPath], { encoding: 'utf8', cwd: repoRoot });

  assert.equal(result.status, 0, result.stdout);
});
