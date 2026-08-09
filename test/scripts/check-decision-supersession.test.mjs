import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  classifySupersedes,
  findSupersessionFindings,
} from '../../scripts/check-decision-supersession.mjs';

const scriptPath = fileURLToPath(
  new URL('../../scripts/check-decision-supersession.mjs', import.meta.url),
);

// --- classifySupersedes: pure function -----------------------------------

test('a clean list of 4-digit ids classifies as "ids"', () => {
  assert.deepEqual(classifySupersedes(['0002']), { kind: 'ids', ids: ['0002'] });
});

test('an empty list classifies as "empty"', () => {
  assert.deepEqual(classifySupersedes([]), { kind: 'empty' });
});

test('free prose (a plain string) classifies as "prose"', () => {
  assert.deepEqual(classifySupersedes('Tập trạng thái FSM của Phase 1'), {
    kind: 'prose',
    raw: 'Tập trạng thái FSM của Phase 1',
  });
});

test('a list containing a non-id item classifies as "prose", not "ids"', () => {
  const raw = ['0002', 'some prose fragment'];
  assert.deepEqual(classifySupersedes(raw), { kind: 'prose', raw });
});

test('a missing key (undefined) classifies as "none"', () => {
  assert.deepEqual(classifySupersedes(undefined), { kind: 'none' });
});

// --- findSupersessionFindings: pure function ------------------------------

test('a superseded record missing both backward pointers reports two findings', () => {
  const records = [
    { id: '0002', meta: {} },
    { id: '0012', meta: { supersedes: ['0002'] } },
  ];
  const indexContent = '| [0002](0002-x.md) | ... |\n| [0012](0012-x.md) | ... |\n';

  const findings = findSupersessionFindings(records, indexContent);

  assert.equal(findings.length, 2);
  assert.ok(findings.some((f) => f.kind === 'missing-frontmatter-pointer' && f.id === '0002'));
  assert.ok(findings.some((f) => f.kind === 'missing-index-pointer' && f.id === '0002'));
});

test('a superseded record with both pointers present reports zero findings', () => {
  const records = [
    { id: '0002', meta: { superseded_by: '0012' } },
    { id: '0012', meta: { supersedes: ['0002'] } },
  ];
  const indexContent = '| [0002](0002-x.md) | ...supersede boi 0012... |\n| [0012](0012-x.md) | ... |\n';

  assert.deepEqual(findSupersessionFindings(records, indexContent), []);
});

test('a record superseded twice, with superseded_by as a list containing both, reports zero missing-frontmatter-pointer findings', () => {
  const records = [
    { id: '0026', meta: { superseded_by: ['0028', '0029'] } },
    { id: '0028', meta: { supersedes: ['0026'] } },
    { id: '0029', meta: { supersedes: ['0026'] } },
  ];
  const indexContent =
    '| [0026](0026-x.md) | superseded boi 0028, 0029 |\n' +
    '| [0028](0028-x.md) | ... |\n' +
    '| [0029](0029-x.md) | ... |\n';

  const findings = findSupersessionFindings(records, indexContent);

  assert.ok(!findings.some((f) => f.kind === 'missing-frontmatter-pointer'));
});

test('a record superseded once, with superseded_by as a list missing the required id, still reports missing-frontmatter-pointer', () => {
  const records = [
    { id: '0026', meta: { superseded_by: ['0028'] } },
    { id: '0029', meta: { supersedes: ['0026'] } },
  ];
  const indexContent = '| [0026](0026-x.md) | ... |\n| [0029](0029-x.md) | ... |\n';

  const findings = findSupersessionFindings(records, indexContent);

  assert.ok(
    findings.some((f) => f.kind === 'missing-frontmatter-pointer' && f.id === '0026'),
  );
});

test('supersedes naming an id with no matching record reports "unknown-target"', () => {
  const records = [{ id: '0012', meta: { supersedes: ['9999'] } }];
  const findings = findSupersessionFindings(records, '');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].kind, 'unknown-target');
});

test('a target with no row in the index at all reports "missing-index-row"', () => {
  const records = [
    { id: '0002', meta: { superseded_by: '0012' } },
    { id: '0012', meta: { supersedes: ['0002'] } },
  ];
  const findings = findSupersessionFindings(records, '| [0012](0012-x.md) | ... |\n');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].kind, 'missing-index-row');
});

test('free-prose supersedes reports "unparseable", never silently skipped', () => {
  const records = [{ id: '0006', meta: { supersedes: 'Tập trạng thái FSM của Phase 1' } }];
  const findings = findSupersessionFindings(records, '');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].kind, 'unparseable');
});

test('a record with no supersedes key at all contributes zero findings', () => {
  const records = [{ id: '0001', meta: {} }];
  assert.deepEqual(findSupersessionFindings(records, ''), []);
});

// --- CLI: real end-to-end run ---------------------------------------------

test('CLI run over a fixture directory prints findings and exits 1 when gaps exist', () => {
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'decision-supersession-'));
  fs.writeFileSync(
    path.join(fixtureDir, '0000-index.md'),
    '| [0002](0002-x.md) | ... |\n| [0012](0012-x.md) | ... |\n',
  );
  fs.writeFileSync(path.join(fixtureDir, '0002-x.md'), '---\nstatus: accepted\n---\n# 0002\n');
  fs.writeFileSync(
    path.join(fixtureDir, '0012-x.md'),
    '---\nsupersedes: [0002]\n---\n# 0012\n',
  );

  const result = spawnSync(process.execPath, [scriptPath, '--dir', fixtureDir], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /2 finding/);
  assert.match(result.stdout, /0002.*superseded by 0012/);
});

test('CLI run over a fixture directory with both pointers present exits 0', () => {
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'decision-supersession-'));
  fs.writeFileSync(
    path.join(fixtureDir, '0000-index.md'),
    '| [0002](0002-x.md) | superseded by 0012 |\n| [0012](0012-x.md) | ... |\n',
  );
  fs.writeFileSync(
    path.join(fixtureDir, '0002-x.md'),
    '---\nstatus: accepted\nsuperseded_by: 0012\n---\n# 0002\n',
  );
  fs.writeFileSync(
    path.join(fixtureDir, '0012-x.md'),
    '---\nsupersedes: [0002]\n---\n# 0012\n',
  );

  const result = spawnSync(process.execPath, [scriptPath, '--dir', fixtureDir], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /no findings/);
});
