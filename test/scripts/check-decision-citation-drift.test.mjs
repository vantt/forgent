import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractCitedIds,
  findCitationDriftFindings,
} from
  '../../scripts/check-decision-citation-drift.mjs';

const scriptPath = fileURLToPath(
  new URL(
    '../../scripts/check-decision-citation-drift.mjs',
    import.meta.url,
  ),
);

// --- extractCitedIds: pure function --------------------

test('ADR<n> form is recognized', () => {
  const ids = extractCitedIds(
    'per record ADR0002 the model is flat',
    new Set(['0002']),
  );
  assert.deepEqual([...ids], ['0002']);
});

test(
  'bare NNNN form is recognized only when known',
  () => {
    const known = extractCitedIds(
      'per record 0002 the model is flat',
      new Set(['0002']),
    );
    assert.deepEqual([...known], ['0002']);

    const unknown = extractCitedIds(
      'shipped in 2026 with 4 reviewers',
      new Set(['0002']),
    );
    assert.deepEqual([...unknown], []);
  },
);

test(
  'a bare id inside an ADR<id> match is not ' +
    'double-counted',
  () => {
    const ids = extractCitedIds(
      'ADR0002 supersede ADR0012',
      new Set(['0002', '0012']),
    );
    assert.deepEqual(
      [...ids].sort(),
      ['0002', '0012'],
    );
  },
);

test('multiple distinct ids on one line', () => {
  const ids = extractCitedIds(
    'ADR0002 -> ADR0012 (work-graph-intelligence)',
    new Set(['0002', '0012']),
  );
  assert.deepEqual(
    [...ids].sort(),
    ['0002', '0012'],
  );
});

// --- findCitationDriftFindings: pure function ----------

test(
  'a superseded id cited with no acknowledgement ' +
    'reports a dead-framing finding',
  () => {
    const sourceFiles = [
      {
        file: 'docs/backlog.md',
        lines: ['line 0', 'cites ADR0002 here'],
      },
    ];
    const supersededById = new Map([['0002', '0012']]);

    const findings = findCitationDriftFindings(
      sourceFiles,
      supersededById,
    );

    assert.equal(findings.length, 1);
    assert.equal(findings[0].kind, 'dead-framing');
    assert.equal(findings[0].file, 'docs/backlog.md');
    assert.equal(findings[0].line, 2);
    assert.equal(findings[0].id, '0002');
    assert.equal(findings[0].supersededBy, '0012');
  },
);

test(
  'citing both the superseded id and its ' +
    'superseding id on the same line reports zero',
  () => {
    const sourceFiles = [
      {
        file: 'docs/specs/work-state.md',
        lines: ['ADR0012, supersede ADR0002'],
      },
    ];
    const supersededById = new Map([['0002', '0012']]);

    assert.deepEqual(
      findCitationDriftFindings(
        sourceFiles,
        supersededById,
      ),
      [],
    );
  },
);

test(
  'citing a decision that was never superseded ' +
    'reports zero findings',
  () => {
    const sourceFiles = [
      {
        file: 'docs/backlog.md',
        lines: ['per record ADR0010'],
      },
    ];
    const supersededById = new Map();

    assert.deepEqual(
      findCitationDriftFindings(
        sourceFiles,
        supersededById,
      ),
      [],
    );
  },
);

// --- CLI: real end-to-end run ---------------------------

test(
  'CLI run over a fixture reports the dead-framing ' +
    'finding and exits 1',
  () => {
    const dir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'citation-drift-'),
    );
    const decisionsDir = path.join(dir, 'decisions');
    const specsDir = path.join(dir, 'specs');
    fs.mkdirSync(decisionsDir);
    fs.mkdirSync(specsDir);

    fs.writeFileSync(
      path.join(decisionsDir, '0002-x.md'),
      '---\nsuperseded_by: 0012\n---\n# 0002\n',
    );
    fs.writeFileSync(
      path.join(decisionsDir, '0012-x.md'),
      '---\nsupersedes: [0002]\n---\n# 0012\n',
    );
    fs.writeFileSync(
      path.join(dir, 'backlog.md'),
      'row citing ADR0002, no ack here\n',
    );
    fs.writeFileSync(
      path.join(specsDir, 'a.md'),
      'unrelated ADR0010 mention\n',
    );

    const result = spawnSync(
      process.execPath,
      [
        scriptPath,
        '--decisions-dir',
        decisionsDir,
        '--backlog',
        path.join(dir, 'backlog.md'),
        '--specs-dir',
        specsDir,
      ],
      { encoding: 'utf8' },
    );

    assert.equal(result.status, 1);
    assert.match(result.stdout, /1 finding/);
    assert.match(
      result.stdout,
      /0002.*superseded by 0012/,
    );
  },
);

test(
  'CLI run over a fixture with no drift exits 0',
  () => {
    const dir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'citation-drift-'),
    );
    const decisionsDir = path.join(dir, 'decisions');
    const specsDir = path.join(dir, 'specs');
    fs.mkdirSync(decisionsDir);
    fs.mkdirSync(specsDir);

    fs.writeFileSync(
      path.join(decisionsDir, '0002-x.md'),
      '---\nsuperseded_by: 0012\n---\n# 0002\n',
    );
    fs.writeFileSync(
      path.join(decisionsDir, '0012-x.md'),
      '---\nsupersedes: [0002]\n---\n# 0012\n',
    );
    fs.writeFileSync(
      path.join(dir, 'backlog.md'),
      'row citing ADR0002 -> ADR0012 (ack)\n',
    );
    fs.writeFileSync(
      path.join(specsDir, 'a.md'),
      'nothing relevant here\n',
    );

    const result = spawnSync(
      process.execPath,
      [
        scriptPath,
        '--decisions-dir',
        decisionsDir,
        '--backlog',
        path.join(dir, 'backlog.md'),
        '--specs-dir',
        specsDir,
      ],
      { encoding: 'utf8' },
    );

    assert.equal(result.status, 0);
    assert.match(result.stdout, /no findings/);
  },
);
