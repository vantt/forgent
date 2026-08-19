import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  findDecisionCodeFindings,
  findNewFindings,
  baselineFromFindings,
} from '../../scripts/check-decision-codes.mjs';

const scriptPath = fileURLToPath(
  new URL('../../scripts/check-decision-codes.mjs', import.meta.url),
);

// --- findDecisionCodeFindings: pure function ------------

test('a lowercase str## code in a test name is flagged', () => {
  const findings = findDecisionCodeFindings([
    {
      file: 'test/a.test.mjs',
      lines: ["test('the widget resets (str42)', () => {})"],
    },
  ]);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].code, 'str42');
});

test('an uppercase STR## code in a describe name is flagged', () => {
  const findings = findDecisionCodeFindings([
    {
      file: 'test/a.test.mjs',
      lines: ["describe('handles retries (STR12)', () => {})"],
    },
  ]);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].code, 'STR12');
});

test('a D<n> decision id in an it name is flagged', () => {
  const findings = findDecisionCodeFindings([
    {
      file: 'test/a.test.mjs',
      lines: ["it('rejects stale claims (D3)', () => {})"],
    },
  ]);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].code, 'D3');
});

test('a RUL## rule id is flagged', () => {
  const findings = findDecisionCodeFindings([
    {
      file: 'test/a.test.mjs',
      lines: ["test('zero-migration replay (RUL11)', () => {})"],
    },
  ]);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].code, 'RUL11');
});

test('a work-item id embedded in a test name is flagged', () => {
  const findings = findDecisionCodeFindings([
    {
      file: 'test/a.test.mjs',
      lines: [
        "test('claimWork dedupes reads (tsk-3jh)', () => {})",
      ],
    },
  ]);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].code, 'tsk-3jh');
});

test('a plain-language test name is not flagged', () => {
  const findings = findDecisionCodeFindings([
    {
      file: 'test/a.test.mjs',
      lines: [
        "test('an empty cart cannot be checked out', () => {})",
      ],
    },
  ]);
  assert.deepEqual(findings, []);
});

test(
  'a digit that is not part of a decision-code prefix is not flagged',
  () => {
    const findings = findDecisionCodeFindings([
      {
        file: 'test/a.test.mjs',
        lines: [
          "test('processes 200 items without dropping any', () => {})",
        ],
      },
    ]);
    assert.deepEqual(findings, []);
  },
);

test('the matched line text is trimmed for ratchet identity', () => {
  const findings = findDecisionCodeFindings([
    {
      file: 'test/a.test.mjs',
      lines: ["  test('resets state (str90)', () => {})"],
    },
  ]);
  assert.equal(
    findings[0].text,
    "test('resets state (str90)', () => {})",
  );
});

// --- findNewFindings / baselineFromFindings: ratchet ----

test(
  'a finding whose exact text is already in the baseline for its ' +
    'file is not new',
  () => {
    const findings = [
      { file: 'test/a.test.mjs', text: "test('x (str1)')" },
    ];
    const baseline = { 'test/a.test.mjs': ["test('x (str1)')"] };
    assert.deepEqual(findNewFindings(findings, baseline), []);
  },
);

test('a finding in a file absent from the baseline is new', () => {
  const findings = [
    { file: 'test/b.test.mjs', text: "test('y (str2)')" },
  ];
  const baseline = { 'test/a.test.mjs': ["test('x (str1)')"] };
  assert.deepEqual(findNewFindings(findings, baseline), findings);
});

test(
  'a finding in an already-baselined file whose text is not in ' +
    "that file's baseline entry is new",
  () => {
    const findings = [
      { file: 'test/a.test.mjs', text: "test('x (str1)')" },
      { file: 'test/a.test.mjs', text: "test('z (str3)')" },
    ];
    const baseline = { 'test/a.test.mjs': ["test('x (str1)')"] };
    assert.deepEqual(findNewFindings(findings, baseline), [
      { file: 'test/a.test.mjs', text: "test('z (str3)')" },
    ]);
  },
);

test('baselineFromFindings groups matched text by file', () => {
  const findings = [
    { file: 'test/a.test.mjs', text: "test('x (str1)')" },
    { file: 'test/a.test.mjs', text: "test('y (str2)')" },
    { file: 'test/b.test.mjs', text: "test('z (str3)')" },
  ];
  // Spread into a plain object first (tsk-1pf): baselineFromFindings now
  // returns an Object.create(null) result (the __proto__ hardening fix),
  // whose own enumerable properties are identical but whose prototype
  // itself would fail a strict deepEqual against a plain {} literal.
  assert.deepEqual({ ...baselineFromFindings(findings) }, {
    'test/a.test.mjs': ["test('x (str1)')", "test('y (str2)')"],
    'test/b.test.mjs': ["test('z (str3)')"],
  });
});

test(
  'a genuinely new Nth occurrence of an already-duplicated text is not ' +
    'silently absorbed (tsk-1pf: count consumption, not membership, ' +
    'ported from check-decision-citation-drift.mjs)',
  () => {
    const f1 = { file: 'test/a.test.mjs', text: "test('str12 dup')" };
    const f2 = { file: 'test/a.test.mjs', text: "test('str12 dup')" };
    const baseline = baselineFromFindings([f1, f2]);
    assert.deepEqual(baseline['test/a.test.mjs'], [
      "test('str12 dup')",
      "test('str12 dup')",
    ]);

    // Exactly the two already-baselined occurrences still report as known.
    assert.equal(findNewFindings([f1, f2], baseline).length, 0);

    // A genuine third occurrence, never baselined, must report as new.
    const f3 = { file: 'test/a.test.mjs', text: "test('str12 dup')" };
    const result = findNewFindings([f1, f2, f3], baseline);
    assert.equal(result.length, 1);
  },
);

test(
  'findNewFindings/baselineFromFindings do not throw on a "__proto__" ' +
    'file (tsk-1pf: Object.create(null) hardening)',
  () => {
    const finding = { file: '__proto__', text: "test('x (str1)')" };
    const baseline = baselineFromFindings([finding]);
    assert.deepEqual(baseline['__proto__'], ["test('x (str1)')"]);
    assert.equal(findNewFindings([finding], baseline).length, 0);

    // An empty baseline (no prior entry at all for "__proto__") must
    // also treat it as a genuinely new finding, not throw -- even when
    // the CALLER passes a bare {} literal rather than an
    // Object.create(null) baseline. findNewFindings' own safety never
    // depends on the caller's baseline shape.
    assert.equal(findNewFindings([finding], {}).length, 1);
  },
);

// --- CLI: real end-to-end run ----------------------------

function writeFixtureTree(dir, files) {
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
}

test(
  'CLI run with an empty baseline reports every violation as new ' +
    'and exits 1',
  () => {
    const dir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'decision-codes-'),
    );
    writeFixtureTree(dir, {
      'test/a.test.mjs':
        "test('resets on failure (tsk-abc)', () => {})\n",
    });

    const result = spawnSync(
      process.execPath,
      [scriptPath, '--test-dir', 'test', '--baseline', 'baseline.json'],
      { cwd: dir, encoding: 'utf8' },
    );

    assert.equal(result.status, 1);
    assert.match(result.stdout, /1 new finding/);
    assert.match(result.stdout, /tsk-abc/);
  },
);

test('CLI run with no violations exits 0', () => {
  const dir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'decision-codes-'),
  );
  writeFixtureTree(dir, {
    'test/a.test.mjs':
      "test('rejects an empty cart', () => {})\n",
  });

  const result = spawnSync(
    process.execPath,
    [scriptPath, '--test-dir', 'test', '--baseline', 'baseline.json'],
    { cwd: dir, encoding: 'utf8' },
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /no new findings/);
});

test(
  '--write-baseline snapshots current findings, and a second run ' +
    'against the SAME tree with that baseline exits 0',
  () => {
    const dir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'decision-codes-'),
    );
    writeFixtureTree(dir, {
      'test/a.test.mjs':
        "test('resets on failure (tsk-abc)', () => {})\n",
    });

    const write = spawnSync(
      process.execPath,
      [
        scriptPath,
        '--test-dir',
        'test',
        '--baseline',
        'baseline.json',
        '--write-baseline',
      ],
      { cwd: dir, encoding: 'utf8' },
    );
    assert.equal(write.status, 0);

    const baseline = JSON.parse(
      fs.readFileSync(path.join(dir, 'baseline.json'), 'utf8'),
    );
    assert.deepEqual(baseline, {
      'test/a.test.mjs': [
        "test('resets on failure (tsk-abc)', () => {})",
      ],
    });

    const recheck = spawnSync(
      process.execPath,
      [scriptPath, '--test-dir', 'test', '--baseline', 'baseline.json'],
      { cwd: dir, encoding: 'utf8' },
    );
    assert.equal(recheck.status, 0);
    assert.match(recheck.stdout, /no new findings/);
  },
);

test(
  'a NEW violation appended to an already-baselined file still ' +
    'fails, even though the file already has baseline coverage',
  () => {
    const dir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'decision-codes-'),
    );
    writeFixtureTree(dir, {
      'test/a.test.mjs':
        "test('resets on failure (tsk-abc)', () => {})\n",
    });

    const write = spawnSync(
      process.execPath,
      [
        scriptPath,
        '--test-dir',
        'test',
        '--baseline',
        'baseline.json',
        '--write-baseline',
      ],
      { cwd: dir, encoding: 'utf8' },
    );
    assert.equal(write.status, 0);

    fs.appendFileSync(
      path.join(dir, 'test/a.test.mjs'),
      "test('handles retries (tsk-xyz)', () => {})\n",
    );

    const recheck = spawnSync(
      process.execPath,
      [scriptPath, '--test-dir', 'test', '--baseline', 'baseline.json'],
      { cwd: dir, encoding: 'utf8' },
    );
    assert.equal(recheck.status, 1);
    assert.match(recheck.stdout, /1 new finding/);
    assert.match(recheck.stdout, /tsk-xyz/);
    assert.doesNotMatch(recheck.stdout, /tsk-abc/);
  },
);

test(
  'a violation in a brand-new file not present in the baseline ' +
    'at all is reported as new',
  () => {
    const dir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'decision-codes-'),
    );
    writeFixtureTree(dir, {
      'test/a.test.mjs':
        "test('resets on failure (tsk-abc)', () => {})\n",
    });

    const write = spawnSync(
      process.execPath,
      [
        scriptPath,
        '--test-dir',
        'test',
        '--baseline',
        'baseline.json',
        '--write-baseline',
      ],
      { cwd: dir, encoding: 'utf8' },
    );
    assert.equal(write.status, 0);

    writeFixtureTree(dir, {
      'test/b.test.mjs':
        "test('rejects invalid input (D7)', () => {})\n",
    });

    const recheck = spawnSync(
      process.execPath,
      [scriptPath, '--test-dir', 'test', '--baseline', 'baseline.json'],
      { cwd: dir, encoding: 'utf8' },
    );
    assert.equal(recheck.status, 1);
    assert.match(recheck.stdout, /1 new finding/);
    assert.match(recheck.stdout, /D7/);
  },
);

test(
  'next-doc-id.test.mjs is excluded even when it embeds an ' +
    'ID-pattern literal as its own test fixture',
  () => {
    const dir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'decision-codes-'),
    );
    writeFixtureTree(dir, {
      'test/scripts/next-doc-id.test.mjs':
        "test('STR pattern against STR1..STR59 returns 60', () => {})\n",
    });

    const result = spawnSync(
      process.execPath,
      [scriptPath, '--test-dir', 'test', '--baseline', 'baseline.json'],
      { cwd: dir, encoding: 'utf8' },
    );

    assert.equal(result.status, 0);
    assert.match(result.stdout, /no new findings/);
  },
);
