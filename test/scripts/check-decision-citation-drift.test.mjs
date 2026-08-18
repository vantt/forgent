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
  isGlossed,
  findCitationFormatFindings,
  findNewFindings,
  baselineFromFindings,
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
      'row citing ADR0002 (event log truth model), ' +
        'no ack here\n',
    );
    fs.writeFileSync(
      path.join(specsDir, 'a.md'),
      'unrelated ADR0010 (does not apply here) mention\n',
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
      'row citing ADR0002 (event log truth model) -> ' +
        'ADR0012 (typed edge model) (ack)\n',
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

// --- isGlossed: pure function --------------------------

test('a paren with real prose is a gloss', () => {
  assert.equal(
    isGlossed('(never write CONTEXT.md/plan.md directly)'),
    true,
  );
});

test('a paren with only other id tokens is not a gloss', () => {
  assert.equal(isGlossed('(D2, D4)'), false);
});

test('an empty paren is not a gloss', () => {
  assert.equal(isGlossed('()'), false);
});

test('no paren at all is not a gloss', () => {
  assert.equal(isGlossed(undefined), false);
});

// --- findCitationFormatFindings: pure function ---------

test(
  'a bare ADR citation with no gloss reports bare-citation',
  () => {
    const findings = findCitationFormatFindings([
      {
        file: 'docs/specs/a.md',
        lines: ['see ADR0002 for the model'],
      },
    ]);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].kind, 'bare-citation');
    assert.equal(findings[0].id, 'ADR0002');
  },
);

test(
  'an ADR citation with a real gloss reports nothing',
  () => {
    const findings = findCitationFormatFindings([
      {
        file: 'docs/specs/a.md',
        lines: [
          'see ADR0002 (event log is the truth) for the model',
        ],
      },
    ]);
    assert.deepEqual(findings, []);
  },
);

test(
  'a RUL citation with only the old area-suffix, no real gloss, still reports bare-citation',
  () => {
    // "(runner)" satisfies the OLDER, narrower area-suffix convention
    // (docs/id-systems-audit.md) but not this item's own stricter
    // self-contained-citation rule (CONTEXT.md's pinned term) -- a real
    // one-line gloss is required, an area name alone is not enough.
    const findings = findCitationFormatFindings([
      {
        file: '.agents/skills/x/SKILL.md',
        lines: ['untrusted input (RUL45 (runner))'],
      },
    ]);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].kind, 'bare-citation');
    assert.equal(findings[0].id, 'RUL45');
  },
);

test(
  'a D-local id cited outside its own CONTEXT.md reports d-local-outside-home, gloss or not',
  () => {
    const bare = findCitationFormatFindings([
      {
        file: '.agents/skills/x/SKILL.md',
        lines: ['(D2)'],
      },
    ]);
    assert.equal(bare.length, 1);
    assert.equal(bare[0].kind, 'd-local-outside-home');
    assert.equal(bare[0].id, 'D2');

    const glossed = findCitationFormatFindings([
      {
        file: '.agents/skills/x/SKILL.md',
        lines: ['(D2, a real explanation of the rule)'],
      },
    ]);
    assert.equal(glossed.length, 1);
    assert.equal(glossed[0].kind, 'd-local-outside-home');
  },
);

test(
  'a D-local id cited inside its OWN CONTEXT.md reports nothing',
  () => {
    const findings = findCitationFormatFindings([
      {
        file: 'docs/history/x/CONTEXT.md',
        lines: ['| D2 | never write plan.md directly |'],
      },
    ]);
    assert.deepEqual(findings, []);
  },
);

test(
  'a comma-list of D-local ids each report their own finding',
  () => {
    const findings = findCitationFormatFindings([
      {
        file: '.agents/skills/x/SKILL.md',
        lines: ['(locked decision D2, D4)'],
      },
    ]);
    assert.equal(findings.length, 2);
    assert.deepEqual(
      findings.map((f) => f.id).sort(),
      ['D2', 'D4'],
    );
  },
);

test(
  'a slash-separated D-local list reports each id separately',
  () => {
    const findings = findCitationFormatFindings([
      {
        file: '.agents/skills/x/SKILL.md',
        lines: ['D1/D2: the live session already knows'],
      },
    ]);
    assert.equal(findings.length, 2);
    assert.deepEqual(
      findings.map((f) => f.id).sort(),
      ['D1', 'D2'],
    );
  },
);

test(
  'a heading-parenthetical D-local citation still reports',
  () => {
    const findings = findCitationFormatFindings([
      {
        file: '.agents/skills/x/SKILL.md',
        lines: [
          '## Terminal handoff (D2 -- Native-First Dispatch)',
        ],
      },
    ]);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].id, 'D2');
  },
);

test(
  'a citation inside a fenced code block is skipped',
  () => {
    const findings = findCitationFormatFindings([
      {
        file: '.agents/skills/x/SKILL.md',
        lines: ['```', '(D2)', '```'],
      },
    ]);
    assert.deepEqual(findings, []);
  },
);

// --- findNewFindings / baselineFromFindings ------------

test(
  'a baselined finding does not report as new, a genuinely new one does',
  () => {
    const findings = [
      {
        kind: 'bare-citation',
        file: 'a.md',
        line: 1,
        id: 'ADR0002',
      },
      {
        kind: 'bare-citation',
        file: 'a.md',
        line: 2,
        id: 'ADR0010',
      },
    ];
    const baseline = baselineFromFindings([findings[0]]);
    const result = findNewFindings(findings, baseline);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'ADR0010');
  },
);

test(
  'a shifted line number alone does not make a baselined finding report ' +
    'as new (tsk-3x8 F1: content-keyed, not line-keyed)',
  () => {
    const original = {
      kind: 'bare-citation',
      file: 'a.md',
      line: 3,
      id: 'ADR0002',
      text: 'see ADR0002 here',
    };
    const baseline = baselineFromFindings([original]);
    const shifted = { ...original, line: original.line + 1 };
    const result = findNewFindings([shifted], baseline);
    assert.equal(result.length, 0);
  },
);

test(
  'two citations of the same id on different lines/text stay distinct',
  () => {
    const findings = [
      {
        kind: 'bare-citation',
        file: 'a.md',
        line: 1,
        id: 'ADR0002',
        text: 'see ADR0002 here',
      },
      {
        kind: 'bare-citation',
        file: 'a.md',
        line: 5,
        id: 'ADR0002',
        text: 'also see ADR0002 there',
      },
    ];
    const baseline = baselineFromFindings([findings[0]]);
    const result = findNewFindings(findings, baseline);
    assert.equal(result.length, 1);
    assert.equal(result[0].text, 'also see ADR0002 there');
  },
);

test(
  'a genuinely new Nth occurrence of an already-duplicated key is not ' +
    'silently absorbed (tsk-6at: count consumption, not membership)',
  () => {
    const f1 = {
      kind: 'bare-citation',
      file: 'a.md',
      line: 3,
      id: 'ADR0002',
      text: 'see ADR0002 here',
    };
    const f2 = {
      kind: 'bare-citation',
      file: 'a.md',
      line: 9,
      id: 'ADR0002',
      text: 'see ADR0002 here',
    };
    const baseline = baselineFromFindings([f1, f2]);
    assert.deepEqual(baseline['a.md'], [
      'bare-citation:ADR0002:see ADR0002 here',
      'bare-citation:ADR0002:see ADR0002 here',
    ]);

    // Exactly the two already-baselined occurrences still report as known.
    assert.equal(findNewFindings([f1, f2], baseline).length, 0);

    // A genuine third occurrence of the identical text+id, never
    // baselined, must report as new -- not silently absorbed because the
    // key already appears in the baseline array for the other two.
    const f3 = {
      kind: 'bare-citation',
      file: 'a.md',
      line: 15,
      id: 'ADR0002',
      text: 'see ADR0002 here',
    };
    const result = findNewFindings([f1, f2, f3], baseline);
    assert.equal(result.length, 1);
    assert.equal(result[0].line, 15);
  },
);

test(
  'findNewFindings/baselineFromFindings do not throw on a "__proto__" ' +
    'file (tsk-1pf: Object.create(null) hardening)',
  () => {
    const finding = {
      kind: 'bare-citation',
      file: '__proto__',
      line: 1,
      id: 'ADR0002',
      text: 'see ADR0002 here',
    };
    const baseline = baselineFromFindings([finding]);
    assert.deepEqual(baseline['__proto__'], [
      'bare-citation:ADR0002:see ADR0002 here',
    ]);
    assert.equal(findNewFindings([finding], baseline).length, 0);

    // An empty baseline (no prior entry at all for "__proto__") must
    // also treat it as a genuinely new finding, not throw -- even when
    // the CALLER passes a bare {} literal rather than an
    // Object.create(null) baseline. findNewFindings' own safety never
    // depends on the caller's baseline shape.
    assert.equal(findNewFindings([finding], {}).length, 1);
  },
);

// --- CLI: --write-baseline self-consistency ------------

test(
  '--write-baseline snapshots current findings, and a bare re-run against the SAME tree exits 0',
  () => {
    const dir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'citation-drift-baseline-'),
    );
    const decisionsDir = path.join(dir, 'decisions');
    const specsDir = path.join(dir, 'specs');
    fs.mkdirSync(decisionsDir);
    fs.mkdirSync(specsDir);
    fs.writeFileSync(
      path.join(dir, 'backlog.md'),
      'nothing here\n',
    );
    fs.writeFileSync(
      path.join(specsDir, 'a.md'),
      'see ADR0002 for the model\n',
    );
    const baselinePath = path.join(dir, 'baseline.json');

    const write = spawnSync(
      process.execPath,
      [
        scriptPath,
        '--decisions-dir',
        decisionsDir,
        '--backlog',
        path.join(dir, 'backlog.md'),
        '--specs-dir',
        specsDir,
        '--baseline',
        baselinePath,
        '--write-baseline',
      ],
      { encoding: 'utf8' },
    );
    assert.equal(write.status, 0);
    assert.ok(fs.existsSync(baselinePath));

    const rerun = spawnSync(
      process.execPath,
      [
        scriptPath,
        '--decisions-dir',
        decisionsDir,
        '--backlog',
        path.join(dir, 'backlog.md'),
        '--specs-dir',
        specsDir,
        '--baseline',
        baselinePath,
      ],
      { encoding: 'utf8' },
    );
    assert.equal(rerun.status, 0);
    assert.match(rerun.stdout, /baselined/);
  },
);

test(
  'a NEW finding appended after --write-baseline still fails',
  () => {
    const dir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'citation-drift-baseline-'),
    );
    const decisionsDir = path.join(dir, 'decisions');
    const specsDir = path.join(dir, 'specs');
    fs.mkdirSync(decisionsDir);
    fs.mkdirSync(specsDir);
    fs.writeFileSync(
      path.join(dir, 'backlog.md'),
      'nothing here\n',
    );
    fs.writeFileSync(
      path.join(specsDir, 'a.md'),
      'see ADR0002 for the model\n',
    );
    const baselinePath = path.join(dir, 'baseline.json');

    spawnSync(
      process.execPath,
      [
        scriptPath,
        '--decisions-dir',
        decisionsDir,
        '--backlog',
        path.join(dir, 'backlog.md'),
        '--specs-dir',
        specsDir,
        '--baseline',
        baselinePath,
        '--write-baseline',
      ],
      { encoding: 'utf8' },
    );

    fs.appendFileSync(
      path.join(specsDir, 'a.md'),
      'also see RUL42 without a gloss\n',
    );

    const rerun = spawnSync(
      process.execPath,
      [
        scriptPath,
        '--decisions-dir',
        decisionsDir,
        '--backlog',
        path.join(dir, 'backlog.md'),
        '--specs-dir',
        specsDir,
        '--baseline',
        baselinePath,
      ],
      { encoding: 'utf8' },
    );
    assert.equal(rerun.status, 1);
    assert.match(rerun.stdout, /RUL42/);
  },
);

test(
  'a line inserted BEFORE a baselined finding does not make it report as ' +
    'new (tsk-3x8 F1: the exact hand-verified repro, CLI level)',
  () => {
    const dir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'citation-drift-baseline-'),
    );
    const decisionsDir = path.join(dir, 'decisions');
    const specsDir = path.join(dir, 'specs');
    fs.mkdirSync(decisionsDir);
    fs.mkdirSync(specsDir);
    fs.writeFileSync(
      path.join(dir, 'backlog.md'),
      'nothing here\n',
    );
    fs.writeFileSync(
      path.join(specsDir, 'a.md'),
      'see ADR0002 for the model\n',
    );
    const baselinePath = path.join(dir, 'baseline.json');

    spawnSync(
      process.execPath,
      [
        scriptPath,
        '--decisions-dir',
        decisionsDir,
        '--backlog',
        path.join(dir, 'backlog.md'),
        '--specs-dir',
        specsDir,
        '--baseline',
        baselinePath,
        '--write-baseline',
      ],
      { encoding: 'utf8' },
    );

    fs.writeFileSync(
      path.join(specsDir, 'a.md'),
      '<!-- an unrelated inserted line -->\n' +
        'see ADR0002 for the model\n',
    );

    const rerun = spawnSync(
      process.execPath,
      [
        scriptPath,
        '--decisions-dir',
        decisionsDir,
        '--backlog',
        path.join(dir, 'backlog.md'),
        '--specs-dir',
        specsDir,
        '--baseline',
        baselinePath,
      ],
      { encoding: 'utf8' },
    );
    assert.equal(
      rerun.status,
      0,
      `expected the shifted-but-unchanged finding to stay ` +
        `baselined, got:\n${rerun.stdout}`,
    );
    assert.match(rerun.stdout, /no new findings/);
  },
);

// --- CLI: real repo, real enforcement ------------------

test(
  'CLI run against the real repo root, with the checked-in baseline, exits 0',
  () => {
    const repoRoot = path.resolve(
      fileURLToPath(import.meta.url),
      '../../..',
    );
    const result = spawnSync(
      process.execPath,
      [scriptPath, '--skills-dir', '.agents/skills',
        '--skills-dir', 'plugins/fgOS/skills'],
      { cwd: repoRoot, encoding: 'utf8' },
    );
    assert.equal(
      result.status,
      0,
      `expected 0 new findings against the checked-in ` +
        `baseline, got:\n${result.stdout}`,
    );
  },
);
