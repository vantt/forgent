// test/state/decision-relation.test.mjs — tsk-1lv-1: `fgos decision`
// requires `--relation none|supersedes:<id>|touches:<id>` (D2/D8), refuses
// a write whose text narrates a supersession without declaring one (STR72's
// own root cause), and `supersedes` runs a write-time citation sweep across
// docs/**+src/**+plugins/** (widened from the pre-existing backlog.md+
// docs/specs/*.md-only scope) so a dangling old-id citation is surfaced,
// not silently lost.
//
// Split across the two layers the feature itself is split across
// (CONTEXT.md D2/D8's own posture, "CLI-surface requirement, not an
// addDecision one" — see store.mjs's own comment above
// `parseDecisionRelation`): pure unit tests against `src/state/store.mjs`'s
// new exports, then CLI-level (spawned `bin/fgos.mjs`) tests for the
// `decision` verb's own enforcement + sweep wiring, which live only in
// bin/fgos.mjs, never in `addDecision` itself.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  parseDecisionRelation,
  decisionTextLooksLikeSupersession,
  StoreError,
} from '../../src/state/store.mjs';
import {
  collectWideSourceFiles,
  findWideCitationFindings,
} from '../../scripts/check-decision-citation-drift.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function tmpRepoRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-decision-relation-'));
}

function run(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function envelopeData(stdout) {
  return JSON.parse(stdout).data;
}

function initCwd() {
  const cwd = tmpRepoRoot();
  assert.equal(run(cwd, ['init']).status, 0);
  return cwd;
}

// --- parseDecisionRelation (pure) ---

test('parseDecisionRelation: "none" parses to {kind: "none"}', () => {
  assert.deepEqual(parseDecisionRelation('none'), { kind: 'none' });
});

test('parseDecisionRelation: "supersedes:<id>" parses to {kind, id}', () => {
  assert.deepEqual(parseDecisionRelation('supersedes:0012'), { kind: 'supersedes', id: '0012' });
});

test('parseDecisionRelation: "touches:<id>" parses to {kind, id}', () => {
  assert.deepEqual(parseDecisionRelation('touches:tsk-1lv'), { kind: 'touches', id: 'tsk-1lv' });
});

test('parseDecisionRelation: undefined/empty throws StoreError validation', () => {
  assert.throws(
    () => parseDecisionRelation(undefined),
    (err) => err instanceof StoreError && err.category === 'validation' && /--relation/.test(err.message),
  );
  assert.throws(
    () => parseDecisionRelation('   '),
    (err) => err instanceof StoreError && err.category === 'validation',
  );
});

test('parseDecisionRelation: an unrecognized shape throws StoreError validation', () => {
  assert.throws(
    () => parseDecisionRelation('bogus'),
    (err) => err instanceof StoreError && err.category === 'validation' && /not one of none\|supersedes:<id>\|touches:<id>/.test(err.message),
  );
  assert.throws(() => parseDecisionRelation('supersedes:'), (err) => err instanceof StoreError);
});

// --- decisionTextLooksLikeSupersession (pure) ---

test('decisionTextLooksLikeSupersession: true for prose that narrates a supersession', () => {
  assert.equal(decisionTextLooksLikeSupersession('this decision supersedes the old rule'), true);
  assert.equal(decisionTextLooksLikeSupersession('D9: replaces the earlier approach'), true);
  assert.equal(decisionTextLooksLikeSupersession('no longer applies here'), true);
  assert.equal(decisionTextLooksLikeSupersession('D14: overrides D6 scope'), true);
  assert.equal(decisionTextLooksLikeSupersession('use this instead of the previous design'), true);
});

test('decisionTextLooksLikeSupersession: false for an ordinary new decision', () => {
  assert.equal(decisionTextLooksLikeSupersession('D5: retire docs/decisions corpus into docs/specs'), false);
  assert.equal(decisionTextLooksLikeSupersession('locked D3: event log is truth, view is rebuilt'), false);
});

// --- collectWideSourceFiles / findWideCitationFindings (pure) ---

test('collectWideSourceFiles: returns [] for roots that do not exist, never throws', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-wide-sweep-empty-'));
  assert.deepEqual(collectWideSourceFiles(cwd), []);
});

test('collectWideSourceFiles: finds .md files under docs/, excludes node_modules and .git', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-wide-sweep-'));
  fs.mkdirSync(path.join(cwd, 'docs', 'specs'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'specs', 'example.md'), 'cites OLDID here\n');
  fs.mkdirSync(path.join(cwd, 'docs', 'node_modules'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'node_modules', 'skip-me.md'), 'cites OLDID here\n');
  const sources = collectWideSourceFiles(cwd);
  const files = sources.map((s) => s.file);
  assert.ok(files.includes(path.join('docs', 'specs', 'example.md')));
  assert.ok(!files.some((f) => f.includes('node_modules')));
});

test('findWideCitationFindings: flags a citation of the old id with no mention of the superseding label', () => {
  const sourceFiles = [{ file: 'docs/specs/example.md', lines: ['this cites OLDID directly'] }];
  const findings = findWideCitationFindings(sourceFiles, 'OLDID', 'tsk-new');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, 'docs/specs/example.md');
  assert.match(findings[0].message, /OLDID/);
  assert.match(findings[0].message, /tsk-new/);
});

test('findWideCitationFindings: does not flag a line that also names the superseding label', () => {
  const sourceFiles = [{ file: 'docs/specs/example.md', lines: ['OLDID, superseded by tsk-new, still referenced for history'] }];
  const findings = findWideCitationFindings(sourceFiles, 'OLDID', 'tsk-new');
  assert.equal(findings.length, 0);
});

test('findWideCitationFindings: whole-word match only -- does not flag a substring hit', () => {
  const sourceFiles = [{ file: 'docs/specs/example.md', lines: ['OLDIDENTIFIER is unrelated'] }];
  const findings = findWideCitationFindings(sourceFiles, 'OLDID', 'tsk-new');
  assert.equal(findings.length, 0);
});

test('findWideCitationFindings: D-local targetId with homeFile restricts findings to homeFile only', () => {
  const sourceFiles = [
    { file: 'docs/history/host-item/CONTEXT.md', lines: ['this cites D8 directly'] },
    { file: 'docs/specs/other.md', lines: ['unrelated doc also cites D8'] },
  ];
  const findings = findWideCitationFindings(sourceFiles, 'D8', 'host-item', 'docs/history/host-item/CONTEXT.md');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, 'docs/history/host-item/CONTEXT.md');
});

test('findWideCitationFindings: D-local targetId with homeFile omitted returns []', () => {
  const sourceFiles = [
    { file: 'docs/history/host-item/CONTEXT.md', lines: ['this cites D8 directly'] },
    { file: 'docs/specs/other.md', lines: ['unrelated doc also cites D8'] },
  ];
  const findings = findWideCitationFindings(sourceFiles, 'D8', 'host-item');
  assert.deepEqual(findings, []);
});

test(
  'collectWideSourceFiles: default roots reach .agents/skills, a stale ' +
    'citation there is no longer invisible (tsk-12v)',
  () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-wide-sweep-skills-'));
    fs.mkdirSync(path.join(cwd, '.agents', 'skills', 'sample-skill'), { recursive: true });
    fs.writeFileSync(
      path.join(cwd, '.agents', 'skills', 'sample-skill', 'SKILL.md'),
      '---\nname: sample-skill\n---\ncites OLDID directly\n',
    );
    const sources = collectWideSourceFiles(cwd);
    const skillFile = sources.find((s) => s.file.includes('sample-skill'));
    assert.ok(skillFile, 'default roots must reach .agents/skills');
    const findings = findWideCitationFindings([skillFile], 'OLDID', 'tsk-new');
    assert.equal(findings.length, 1);
  },
);

// --- CLI: `fgos decision` requires --relation ---

test('CLI: decision without --relation is refused, exit 4', () => {
  const cwd = initCwd();
  const result = run(cwd, ['decision', '--text', 'a normal new decision', '--rationale', 'because reasons']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--relation/);
});

test('CLI: decision with --relation none and ordinary text succeeds, exit 0', () => {
  const cwd = initCwd();
  const result = run(cwd, ['decision', '--text', 'a normal new decision', '--rationale', 'because reasons', '--relation', 'none']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.relation, 'none');
});

test('CLI: decision with a malformed --relation value is refused, exit 4', () => {
  const cwd = initCwd();
  const result = run(cwd, ['decision', '--text', 'a normal new decision', '--rationale', 'because reasons', '--relation', 'bogus']);
  assert.equal(result.status, 4);
});

// --- CLI: supersession-prose refusal (STR72's own root cause) ---

test('CLI: text that reads like a supersession without --relation supersedes:<id> is refused, exit 4', () => {
  const cwd = initCwd();
  const result = run(cwd, [
    'decision',
    '--text', 'this decision supersedes the earlier approach',
    '--rationale', 'because reasons',
    '--relation', 'none',
  ]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /supersession/);
});

test('CLI: the same supersession text passes once --relation supersedes:<id> is declared', () => {
  const cwd = initCwd();
  const result = run(cwd, [
    'decision',
    '--text', 'this decision supersedes the earlier approach',
    '--rationale', 'because reasons',
    '--relation', 'supersedes:0012',
  ]);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.relation, 'supersedes:0012');
});

// --- CLI: write-time citation sweep (supersedes only) ---

test('CLI: supersedes surfaces a dangling citation of the old id that does not also name the new one', () => {
  const cwd = initCwd();
  assert.equal(
    run(cwd, ['add', '--id', 'host-item', '--title', 'Host item', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--description', 'fixture item']).status,
    0,
  );
  fs.mkdirSync(path.join(cwd, 'docs', 'specs'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, 'docs', 'specs', 'example.md'),
    'line one cites OLDID without acknowledgement\nline two cites OLDID, now superseded by host-item\n',
  );

  const result = run(cwd, [
    'decision', '--id', 'host-item',
    '--text', 'D2: revises OLDID scope',
    '--rationale', 'because reasons',
    '--relation', 'supersedes:OLDID',
  ]);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.ok(Array.isArray(data.danglingCitations));
  assert.equal(data.danglingCitations.length, 1);
  assert.match(data.danglingCitations[0], /example\.md:1/);
});

test('CLI: supersedes reports no dangling citations once every hit also names the new id', () => {
  const cwd = initCwd();
  assert.equal(
    run(cwd, ['add', '--id', 'host-item', '--title', 'Host item', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--description', 'fixture item']).status,
    0,
  );
  fs.mkdirSync(path.join(cwd, 'docs', 'specs'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'specs', 'example.md'), 'OLDID, superseded by host-item\n');

  const result = run(cwd, [
    'decision', '--id', 'host-item',
    '--text', 'D2: revises OLDID scope',
    '--rationale', 'because reasons',
    '--relation', 'supersedes:OLDID',
  ]);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.ok(!('danglingCitations' in data));
});

test('CLI: supersedes without --id (a platform/--scope decision) still surfaces dangling citations -- F3 tsk-1lv regression: supersedingLabel used to fall back to relation.id itself, making the suppression guard match every citation unconditionally', () => {
  const cwd = initCwd();
  fs.mkdirSync(path.join(cwd, 'docs', 'specs'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, 'docs', 'specs', 'example.md'),
    'line one cites OLDID without acknowledgement\n',
  );

  const result = run(cwd, [
    'decision',
    '--text', 'D-ADR0099: revises OLDID scope',
    '--rationale', 'because reasons',
    '--scope', 'example-area',
    '--relation', 'supersedes:OLDID',
  ]);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.ok(Array.isArray(data.danglingCitations));
  assert.equal(data.danglingCitations.length, 1);
  assert.match(data.danglingCitations[0], /example\.md:1/);
});

test('CLI: touches does not run the dangling-citation sweep', () => {
  const cwd = initCwd();
  fs.mkdirSync(path.join(cwd, 'docs', 'specs'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'specs', 'example.md'), 'cites OLDID with no other context\n');

  const result = run(cwd, [
    'decision',
    '--text', 'D2: touches OLDID for context only',
    '--rationale', 'because reasons',
    '--relation', 'touches:OLDID',
  ]);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.ok(!('danglingCitations' in data));
});

test('CLI: supersedes with D-local id scopes sweep to host item CONTEXT.md only (tsk-679 regression)', () => {
  const cwd = initCwd();
  assert.equal(
    run(cwd, ['add', '--id', 'host-item', '--title', 'Host item', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--description', 'fixture item']).status,
    0,
  );
  fs.mkdirSync(path.join(cwd, 'docs', 'history', 'host-item'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, 'docs', 'history', 'host-item', 'CONTEXT.md'),
    'line one cites D8 without acknowledgement\n',
  );
  fs.mkdirSync(path.join(cwd, 'docs', 'specs'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, 'docs', 'specs', 'other.md'),
    'unrelated line cites D8 elsewhere\n',
  );

  const result = run(cwd, [
    'decision', '--id', 'host-item',
    '--text', 'D9: supersedes local D8',
    '--rationale', 'because reasons',
    '--relation', 'supersedes:D8',
  ]);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.ok(Array.isArray(data.danglingCitations));
  assert.equal(data.danglingCitations.length, 1);
  assert.match(data.danglingCitations[0], /host-item\/CONTEXT\.md:1/);
});
