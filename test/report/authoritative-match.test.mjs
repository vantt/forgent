// test/report/authoritative-match.test.mjs — tsk-1lv-6 (D8/D12): skeleton
// match over docs' own `authoritative_for` frontmatter, so a growing skill
// finds the doc already authoritative for a topic instead of guessing a
// second path. Pure-function unit tests, plus (tsk-1lv review-fix F11) CLI
// tests for `fgos authoritative-match` — the real callable surface for the
// pure functions below, added because the doctrine in fgos-coding-
// compounding/SKILL.md had zero real callers without it.

import { test } from 'node:test';
import { resolveFgosFile, FGOS_FILE } from '../../src/state/fgos-file-registry.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { SKELETON_ADAPTERS, findAuthoritativeMatch, findDuplicateAuthoritativeClaims } from '../../src/report/authoritative-match.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function tmpRepoRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-authoritative-match-'));
}

function run(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function initCwd() {
  const cwd = tmpRepoRoot();
  assert.equal(run(cwd, ['init']).status, 0);
  return cwd;
}

function writeDoc(cwd, quadrantDir, fileName, authoritativeFor) {
  const dir = path.join(cwd, quadrantDir);
  fs.mkdirSync(dir, { recursive: true });
  const lines = ['---', 'type: how-to'];
  if (authoritativeFor !== undefined) lines.push(`authoritative_for: ${authoritativeFor}`);
  lines.push('---', '', 'body', '');
  fs.writeFileSync(path.join(dir, fileName), lines.join('\n'));
}

test('findAuthoritativeMatch: exact topic match returns the candidate', () => {
  const candidates = [
    { path: 'docs/how-to/pick.md', authoritativeFor: 'claiming a work item' },
    { path: 'docs/how-to/approve.md', authoritativeFor: 'landing a work item' },
  ];
  assert.equal(
    findAuthoritativeMatch('claiming a work item', candidates),
    candidates[0],
  );
});

test('findAuthoritativeMatch: case/diacritic/punctuation-insensitive skeleton match', () => {
  const candidates = [{ path: 'docs/how-to/quy-trinh.md', authoritativeFor: 'Quy trình pick, để sau' }];
  assert.equal(
    findAuthoritativeMatch('quy trinh PICK để SAU!!', candidates),
    candidates[0],
  );
});

test('findAuthoritativeMatch: Vietnamese "đ" folds the same as its ASCII "d" counterpart', () => {
  const candidates = [{ path: 'docs/explanation/doi-chieu.md', authoritativeFor: 'đối chiếu quyết định' }];
  assert.equal(
    findAuthoritativeMatch('doi chieu quyet dinh', candidates),
    candidates[0],
  );
});

test('findAuthoritativeMatch: no match returns null', () => {
  const candidates = [{ path: 'docs/how-to/pick.md', authoritativeFor: 'claiming a work item' }];
  assert.equal(findAuthoritativeMatch('an unrelated topic', candidates), null);
});

test('findAuthoritativeMatch: empty candidates returns null', () => {
  assert.equal(findAuthoritativeMatch('anything', []), null);
});

test('findAuthoritativeMatch: candidates missing/blank authoritativeFor never match', () => {
  const candidates = [
    { path: 'docs/how-to/no-field.md' },
    { path: 'docs/how-to/blank.md', authoritativeFor: '   ' },
    { path: 'docs/how-to/real.md', authoritativeFor: 'the real topic' },
  ];
  assert.equal(
    findAuthoritativeMatch('the real topic', candidates),
    candidates[2],
  );
});

test('findAuthoritativeMatch: empty topic never matches even against a candidate with a real authoritativeFor', () => {
  const candidates = [{ path: 'docs/how-to/real.md', authoritativeFor: 'the real topic' }];
  assert.equal(findAuthoritativeMatch('', candidates), null);
  assert.equal(findAuthoritativeMatch('   ', candidates), null);
});

test('findAuthoritativeMatch: returns the first match in candidate order when more than one would match', () => {
  const candidates = [
    { path: 'docs/how-to/first.md', authoritativeFor: 'shared topic' },
    { path: 'docs/how-to/second.md', authoritativeFor: 'shared topic' },
  ];
  assert.equal(
    findAuthoritativeMatch('shared topic', candidates),
    candidates[0],
  );
});

test('findAuthoritativeMatch: unknown adapter name throws, listing the known adapters', () => {
  const candidates = [{ path: 'docs/how-to/real.md', authoritativeFor: 'topic' }];
  assert.throws(
    () => findAuthoritativeMatch('topic', candidates, { adapter: 'semantic-v1' }),
    /unknown adapter "semantic-v1"/,
  );
});

test('SKELETON_ADAPTERS: exposes the default "skeleton-v1" adapter by name (port/adapter registry, D12)', () => {
  assert.ok(SKELETON_ADAPTERS['skeleton-v1']);
  assert.equal(typeof SKELETON_ADAPTERS['skeleton-v1'].matches, 'function');
});

test('SKELETON_ADAPTERS: also exposes "normalize" -- findDuplicateAuthoritativeClaims must group through the selected adapter, not a free-standing function (F11 tsk-1lv regression)', () => {
  assert.equal(typeof SKELETON_ADAPTERS['skeleton-v1'].normalize, 'function');
  assert.equal(SKELETON_ADAPTERS['skeleton-v1'].normalize('Claiming A Work Item!'), SKELETON_ADAPTERS['skeleton-v1'].normalize('claiming a work item'));
});

// --- findDuplicateAuthoritativeClaims (harness backstop, D8) ---

test('findDuplicateAuthoritativeClaims: flags two docs claiming the same subject, even paraphrased by case/diacritics/punctuation', () => {
  const candidates = [
    { path: 'docs/how-to/a.md', authoritativeFor: 'claiming a work item' },
    { path: 'docs/how-to/b.md', authoritativeFor: 'Claiming A Work Item!' },
    { path: 'docs/how-to/c.md', authoritativeFor: 'landing a work item' },
  ];
  const duplicates = findDuplicateAuthoritativeClaims(candidates);
  assert.equal(duplicates.length, 1);
  assert.deepEqual(duplicates[0], [candidates[0], candidates[1]]);
});

test('findDuplicateAuthoritativeClaims: returns [] when every claimed subject has exactly one owner', () => {
  const candidates = [
    { path: 'docs/how-to/a.md', authoritativeFor: 'topic one' },
    { path: 'docs/how-to/b.md', authoritativeFor: 'topic two' },
  ];
  assert.deepEqual(findDuplicateAuthoritativeClaims(candidates), []);
});

test('findDuplicateAuthoritativeClaims: ignores candidates with no/blank authoritativeFor', () => {
  const candidates = [
    { path: 'docs/how-to/a.md' },
    { path: 'docs/how-to/b.md', authoritativeFor: '  ' },
  ];
  assert.deepEqual(findDuplicateAuthoritativeClaims(candidates), []);
});

test('findDuplicateAuthoritativeClaims: empty input returns []', () => {
  assert.deepEqual(findDuplicateAuthoritativeClaims([]), []);
});

test('findDuplicateAuthoritativeClaims: unknown adapter name throws', () => {
  assert.throws(
    () => findDuplicateAuthoritativeClaims([{ path: 'a.md', authoritativeFor: 'x' }], { adapter: 'semantic-v1' }),
    /unknown adapter "semantic-v1"/,
  );
});

// --- CLI: fgos authoritative-match (F11) ---

test('CLI: authoritative-match finds the doc whose authoritative_for skeleton-matches the topic', () => {
  const cwd = initCwd();
  writeDoc(cwd, 'docs/how-to', 'pick.md', 'claiming a work item');
  writeDoc(cwd, 'docs/how-to', 'approve.md', 'landing a work item');

  const result = run(cwd, ['authoritative-match', '--quadrant', 'docs/how-to', '--topic', 'Claiming A Work Item!']);
  assert.equal(result.status, 0);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.match, 'docs/how-to/pick.md');
  assert.equal(data.candidateCount, 2);
});

test('CLI: authoritative-match returns match:null when no doc claims the topic', () => {
  const cwd = initCwd();
  writeDoc(cwd, 'docs/how-to', 'pick.md', 'claiming a work item');

  const result = run(cwd, ['authoritative-match', '--quadrant', 'docs/how-to', '--topic', 'an unrelated subject']);
  assert.equal(result.status, 0);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.match, null);
});

test('CLI: authoritative-match on a quadrant dir that does not exist yet returns match:null, quadrantExists:false, never an error -- M1 tsk-1lv round-2: a caller must be able to tell a typo\'d path apart from a real scan with no match', () => {
  const cwd = initCwd();
  const result = run(cwd, ['authoritative-match', '--quadrant', 'docs/how-to', '--topic', 'anything']);
  assert.equal(result.status, 0);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.match, null);
  assert.equal(data.candidateCount, 0);
  assert.equal(data.quadrantExists, false);
});

test('CLI: authoritative-match reports quadrantExists:true when the quadrant dir is real, even with zero matching docs', () => {
  const cwd = initCwd();
  writeDoc(cwd, 'docs/how-to', 'pick.md', 'claiming a work item');
  const result = run(cwd, ['authoritative-match', '--quadrant', 'docs/how-to', '--topic', 'an unrelated subject']);
  assert.equal(result.status, 0);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.match, null);
  assert.equal(data.quadrantExists, true);
});

test('CLI: authoritative-match requires --quadrant (validation, exit 4)', () => {
  const cwd = initCwd();
  const result = run(cwd, ['authoritative-match', '--topic', 'anything']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--quadrant/);
});

test('CLI: authoritative-match requires --topic unless --check-duplicates is set (validation, exit 4)', () => {
  const cwd = initCwd();
  const result = run(cwd, ['authoritative-match', '--quadrant', 'docs/how-to']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--topic/);
});

test('CLI: authoritative-match --check-duplicates reports every group of 2+ docs claiming the same subject', () => {
  const cwd = initCwd();
  writeDoc(cwd, 'docs/how-to', 'a.md', 'shared topic');
  writeDoc(cwd, 'docs/how-to', 'b.md', 'Shared Topic!');
  writeDoc(cwd, 'docs/how-to', 'c.md', 'a different topic');

  const result = run(cwd, ['authoritative-match', '--quadrant', 'docs/how-to', '--check-duplicates']);
  assert.equal(result.status, 0);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.duplicateGroups.length, 1);
  assert.deepEqual(data.duplicateGroups[0].sort(), ['docs/how-to/a.md', 'docs/how-to/b.md']);
});

test('CLI: authoritative-match --check-duplicates reports no groups when every claim is unique', () => {
  const cwd = initCwd();
  writeDoc(cwd, 'docs/how-to', 'a.md', 'topic one');
  writeDoc(cwd, 'docs/how-to', 'b.md', 'topic two');

  const result = run(cwd, ['authoritative-match', '--quadrant', 'docs/how-to', '--check-duplicates']);
  assert.equal(result.status, 0);
  const data = JSON.parse(result.stdout).data;
  assert.deepEqual(data.duplicateGroups, []);
});

test('CLI: authoritative-match ignores docs with no authoritative_for frontmatter', () => {
  const cwd = initCwd();
  writeDoc(cwd, 'docs/how-to', 'no-claim.md', undefined);
  writeDoc(cwd, 'docs/how-to', 'real.md', 'the real topic');

  const result = run(cwd, ['authoritative-match', '--quadrant', 'docs/how-to', '--topic', 'the real topic']);
  assert.equal(result.status, 0);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.match, 'docs/how-to/real.md');
  assert.equal(data.candidateCount, 2);
});

test('CLI: authoritative-match never mutates state: events.jsonl and state.json are byte-identical before/after', () => {
  const cwd = initCwd();
  writeDoc(cwd, 'docs/how-to', 'pick.md', 'claiming a work item');
  const logPath = path.join(cwd, '.fgos', 'events.jsonl');
  const viewPath = resolveFgosFile(path.join(cwd, '.fgos'), FGOS_FILE.STATE);
  const logBefore = fs.readFileSync(logPath, 'utf8');
  const viewBefore = fs.readFileSync(viewPath, 'utf8');

  const result = run(cwd, ['authoritative-match', '--quadrant', 'docs/how-to', '--topic', 'claiming a work item']);
  assert.equal(result.status, 0);
  assert.equal(fs.readFileSync(logPath, 'utf8'), logBefore, 'events.jsonl must be untouched');
  assert.equal(fs.readFileSync(viewPath, 'utf8'), viewBefore, 'state.json must be untouched');
});
