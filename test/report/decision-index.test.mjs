// test/report/decision-index.test.mjs — tsk-1lv-2 (D4): docs/decisions/
// index.md is a generated projection of state.decisions' scope-carrying
// (platform/repo-wide) records -- never hand-edited, mirrors
// enduser-index-generate.mjs's own generate+drift shape. Split across the
// pure transform (buildDecisionIndexMarkdown), the compute-without-write
// half (computeDecisionIndex, shared by the write path and --check), and
// the CLI verb wiring (`fgos decision-index[--check]`).

import '../helpers/process-tmp-root.mjs';
import { initializeWorkRepository } from '../helpers/work-store-release.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildDecisionIndexMarkdown,
  computeDecisionIndex,
  computeDecisionRoleFields,
  decisionRoleFields,
  placeRoleFields,
  generateDecisionIndex,
  indexPathFor,
  narrativeHolderResolver,
} from '../../src/report/decision-index.mjs';
import { addDecision } from '../../src/state/store.mjs';
import { spawnFgos } from '../helpers/cli-entry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function tmpRepoRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-decision-index-'));
  initializeWorkRepository(dir);
  return dir;
}

function run(cwd, args) {
  return spawnFgos(FGOS, args, { cwd, encoding: 'utf8' });
}

function initCwd() {
  const cwd = tmpRepoRoot();
  assert.equal(run(cwd, ['init']).status, 0);
  return cwd;
}

// --- buildDecisionIndexMarkdown (pure) ---

test('buildDecisionIndexMarkdown: empty input renders the "no decisions yet" placeholder, never a bare empty table', () => {
  const md = buildDecisionIndexMarkdown([]);
  assert.match(md, /No platform\/repo-wide decisions recorded yet/);
  assert.doesNotMatch(md, /\| Scope \|/);
});

test('buildDecisionIndexMarkdown: excludes a record with no scope field (item-scoped D-IDs stay out)', () => {
  const md = buildDecisionIndexMarkdown([{ text: 'D1: item decision', rationale: 'r', id: 'item-a', ts: '2026-01-01T00:00:00.000Z' }]);
  assert.match(md, /No platform\/repo-wide decisions recorded yet/);
});

test('buildDecisionIndexMarkdown: excludes kind:engine bookkeeping even if it somehow carries a scope', () => {
  const md = buildDecisionIndexMarkdown([{ text: 'engine bookkeeping', rationale: 'r', kind: 'engine', scope: 'repo', ts: '2026-01-01T00:00:00.000Z' }]);
  assert.match(md, /No platform\/repo-wide decisions recorded yet/);
});

test('buildDecisionIndexMarkdown: includes a scope-carrying record as a table row', () => {
  const md = buildDecisionIndexMarkdown([
    { text: 'D1: repo-wide naming convention', rationale: 'because reasons', scope: 'repo', ts: '2026-01-01T00:00:00.000Z' },
  ]);
  assert.match(md, /\| repo \| D1: repo-wide naming convention \| because reasons \| 2026-01-01T00:00:00\.000Z \|/);
});

test('buildDecisionIndexMarkdown: sorted by scope then chronologically, deterministic across repeat calls', () => {
  const decisions = [
    { text: 'B second', rationale: 'r', scope: 'runner', ts: '2026-01-02T00:00:00.000Z' },
    { text: 'A first', rationale: 'r', scope: 'cli', ts: '2026-01-01T00:00:00.000Z' },
    { text: 'C same scope, earlier', rationale: 'r', scope: 'runner', ts: '2026-01-01T00:00:00.000Z' },
  ];
  const md1 = buildDecisionIndexMarkdown(decisions);
  const md2 = buildDecisionIndexMarkdown([...decisions].reverse());
  assert.equal(md1, md2, 'output must not depend on input order');
  const cliIdx = md1.indexOf('| cli |');
  const runnerCIdx = md1.indexOf('C same scope, earlier');
  const runnerBIdx = md1.indexOf('B second');
  assert.ok(cliIdx < runnerCIdx, 'cli scope sorts before runner scope');
  assert.ok(runnerCIdx < runnerBIdx, 'within the same scope, earlier ts sorts first');
});

test('buildDecisionIndexMarkdown: escapes a pipe and collapses embedded newlines in cell content', () => {
  const md = buildDecisionIndexMarkdown([
    { text: 'uses a | pipe', rationale: "line one\nline two", scope: 'repo', ts: '2026-01-01T00:00:00.000Z' },
  ]);
  assert.match(md, /uses a \\\| pipe/);
  assert.match(md, /line one line two/);
});

// --- computeDecisionIndex / generateDecisionIndex (I/O, in-process) ---

test('computeDecisionIndex: reports changed:true against a nonexistent index file, and returns the would-be content without writing it', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-decision-index-io-'));
  const fgosDir = initializeWorkRepository(repoRoot);
  addDecision(fgosDir, { text: 'D1: repo-wide thing', rationale: 'r', scope: 'repo' });

  const { changed, nextContent } = computeDecisionIndex(repoRoot, fgosDir);
  assert.equal(changed, true);
  assert.match(nextContent, /D1: repo-wide thing/);
  assert.equal(fs.existsSync(indexPathFor(repoRoot)), false, 'compute never writes');
});

test('generateDecisionIndex: writes the file on first call, then reports changed:false and does not rewrite on a second call with nothing new', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-decision-index-io-'));
  const fgosDir = initializeWorkRepository(repoRoot);
  addDecision(fgosDir, { text: 'D1: repo-wide thing', rationale: 'r', scope: 'repo' });

  const first = generateDecisionIndex(repoRoot, fgosDir);
  assert.equal(first.changed, true);
  assert.equal(fs.existsSync(indexPathFor(repoRoot)), true);
  const mtimeAfterFirst = fs.statSync(indexPathFor(repoRoot)).mtimeMs;

  const second = generateDecisionIndex(repoRoot, fgosDir);
  assert.equal(second.changed, false);
  assert.equal(fs.statSync(indexPathFor(repoRoot)).mtimeMs, mtimeAfterFirst, 'unchanged content must not rewrite the file');
});

test('generateDecisionIndex: preserves committed rows absent from local state and adds state rows idempotently', () => {
  const repoRoot = tmpRepoRoot();
  const fgosDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(path.dirname(indexPathFor(repoRoot)), { recursive: true });
  const committed = { scope: 'repo', text: 'D-ADR9998: committed | decision', rationale: 'from another machine', ts: '2026-01-01' };
  fs.writeFileSync(indexPathFor(repoRoot), buildDecisionIndexMarkdown([committed]));
  addDecision(fgosDir, { scope: 'repo', text: 'D-ADR9999: local decision', rationale: 'local' });
  const first = generateDecisionIndex(repoRoot, fgosDir);
  assert.ok(first.content.includes('D-ADR9998: committed \\| decision'));
  assert.match(first.content, /D-ADR9999: local decision/);
  assert.equal(generateDecisionIndex(repoRoot, fgosDir).changed, false);
  assert.equal(generateDecisionIndex(repoRoot, path.join(repoRoot, 'absent')).changed, false);
});

test('buildDecisionIndexMarkdown: state wins by ADR identity and fallback scope/timestamp', () => {
  const old = [
    { scope: 'repo', text: 'D-ADR9999: old', rationale: 'old', ts: '2026-01-01' },
    { scope: 'repo', text: 'old unnamed', rationale: 'old', ts: '2026-01-02' },
  ];
  const next = old.map((d) => ({ ...d, text: d.text.replace('old', 'new') }));
  const result = buildDecisionIndexMarkdown(next, buildDecisionIndexMarkdown(old));
  assert.doesNotMatch(result, /old unnamed|D-ADR9999: old/);
  assert.match(result, /new unnamed/);
  assert.equal(buildDecisionIndexMarkdown(next, result), result);
});

test('generateDecisionIndex: an empty-to-empty regenerate (nothing was ever recorded) is not a refusal -- there is no real content to lose', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-decision-index-io-'));
  const fgosDir = initializeWorkRepository(repoRoot);

  const first = generateDecisionIndex(repoRoot, fgosDir);
  assert.equal(first.changed, true);
  const second = generateDecisionIndex(repoRoot, fgosDir);
  assert.equal(second.changed, false);
});

// --- CLI: `fgos decision-index` / `--check` ---

test('CLI: decision-index generates docs/decisions/index.md from a scope-carrying decision', () => {
  const cwd = initCwd();
  assert.equal(
    run(cwd, ['decision', '--text', 'D1: repo-wide thing', '--rationale', 'r', '--relation', 'none', '--scope', 'repo']).status,
    0,
  );
  const result = run(cwd, ['decision-index']);
  assert.equal(result.status, 0);
  const content = fs.readFileSync(path.join(cwd, 'docs', 'decisions', 'index.md'), 'utf8');
  assert.match(content, /D1: repo-wide thing/);
});

test('CLI: decision-index --check exits 0 and writes nothing when the on-disk index already matches', () => {
  const cwd = initCwd();
  assert.equal(
    run(cwd, ['decision', '--text', 'D1: repo-wide thing', '--rationale', 'r', '--relation', 'none', '--scope', 'repo']).status,
    0,
  );
  assert.equal(run(cwd, ['decision-index']).status, 0);
  const before = fs.readFileSync(path.join(cwd, 'docs', 'decisions', 'index.md'), 'utf8');

  const result = run(cwd, ['decision-index', '--check']);
  assert.equal(result.status, 0);
  const after = fs.readFileSync(path.join(cwd, 'docs', 'decisions', 'index.md'), 'utf8');
  assert.equal(before, after);
});

test('CLI: decision-index --check is refused (validation, exit 4) when the on-disk index is stale (a new scoped decision landed since the last generate)', () => {
  const cwd = initCwd();
  assert.equal(run(cwd, ['decision-index']).status, 0, 'generate once against an empty log -- the placeholder content');
  assert.equal(
    run(cwd, ['decision', '--text', 'D1: repo-wide thing', '--rationale', 'r', '--relation', 'none', '--scope', 'repo']).status,
    0,
  );
  const result = run(cwd, ['decision-index', '--check']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /stale/);
});

test('CLI: decision-index --check never writes even when it refuses', () => {
  const cwd = initCwd();
  assert.equal(run(cwd, ['decision-index']).status, 0);
  const beforeAll = fs.readFileSync(path.join(cwd, 'docs', 'decisions', 'index.md'), 'utf8');
  assert.equal(
    run(cwd, ['decision', '--text', 'D1: repo-wide thing', '--rationale', 'r', '--relation', 'none', '--scope', 'repo']).status,
    0,
  );
  run(cwd, ['decision-index', '--check']);
  const afterRefusal = fs.readFileSync(path.join(cwd, 'docs', 'decisions', 'index.md'), 'utf8');
  assert.equal(beforeAll, afterRefusal, '--check must never write, even when it detects and reports drift');
});

test('buildDecisionIndexMarkdown: historical ADR IDs reused across scopes retain both decisions', () => {
  const rows = [
    { scope: 'runner', text: 'D-ADR0032: Iron Law', rationale: 'a', ts: '2026-01-01' },
    { scope: 'work-state', text: 'D-ADR0032: Team Harness', rationale: 'b', ts: '2026-01-02' },
  ];
  const committed = buildDecisionIndexMarkdown(rows);
  assert.equal(buildDecisionIndexMarkdown([], committed), committed);
  const updated = buildDecisionIndexMarkdown([{ ...rows[0], text: 'D-ADR0032: updated Iron Law' }], committed);
  assert.match(updated, /updated Iron Law/);
  assert.match(updated, /Team Harness/);
  assert.equal((updated.match(/D-ADR0032/g) ?? []).length, 2);
});

test('buildDecisionIndexMarkdown: a retired docs/specs pointer carried by an event renders as the holder the resolver names, and an unresolved pointer is left as written', () => {
  const holders = { runner: 'docs/platform/runner/decisions/' };
  const md = buildDecisionIndexMarkdown(
    [{ scope: 'runner', text: 'D-ADR0001: x', rationale: 'narrative di dời sang docs/specs/runner.md; see docs/specs/ghost.md', ts: '2026-01-01' }],
    '',
    { holderFor: (name) => holders[name] ?? null },
  );
  assert.match(md, /narrative di dời sang docs\/platform\/runner\/decisions\/;/);
  assert.match(md, /docs\/specs\/ghost\.md/);
  assert.doesNotMatch(md, /docs\/specs\/runner\.md/);
});

test('narrativeHolderResolver: reads the governance scope-to-holder table by legacy alias or area name, falls back to the platform file carrying the scope name, and returns null otherwise', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-decision-holder-'));
  fs.mkdirSync(path.join(repoRoot, 'docs', 'platform', 'system-overview'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'docs', 'platform', 'system-overview', 'spec.md'), '# spec\n');
  fs.writeFileSync(path.join(repoRoot, 'docs', 'platform', 'governance.md'), [
    '## Decision scope to holder table',
    '',
    '| Scope (legacy alias retained) | Read first | Facts and RULs | Narrative home |',
    '|---|---|---|---|',
    '| distribution → packaging-distribution | `docs/platform/packaging-distribution/README.md` | `docs/platform/packaging-distribution/spec.md` | `docs/platform/packaging-distribution/decisions/` |',
    '',
    '## Next section',
  ].join('\n'));
  const holderFor = narrativeHolderResolver(repoRoot);
  assert.equal(holderFor('distribution'), 'docs/platform/packaging-distribution/decisions/');
  assert.equal(holderFor('packaging-distribution'), 'docs/platform/packaging-distribution/decisions/');
  assert.equal(holderFor('system-overview'), 'docs/platform/system-overview/spec.md');
  assert.equal(holderFor('nowhere'), null);
});

// --- role fields in the holder documents ---

test('decisionRoleFields: the latest event of an id decides its relation, ADR#### reads as D-ADR####, touches writes no field, and valid_from is the latest declared validFrom or else the first timestamp', () => {
  const ev = (text, relation, ts, extra = {}) => ({ scope: 'runner', text, rationale: 'r', relation, ts, ...extra });
  const { fields, warnings } = decisionRoleFields([
    ev('D-ADR0012: flat items', 'supersedes:ADR0002', '2026-08-17T00:00:00Z'),
    ev('D-ADR0012: flat items', 'amends:D-ADR0002', '2026-11-22T00:00:00Z', { validFrom: '2026-07-14' }),
    ev('D-ADR0062: better', 'supersedes:D-ADR0061', '2026-10-18T14:42:56Z'),
    ev('D-ADR0057: touch', 'touches:D-ADR0055', '2026-10-18T02:00:00Z'),
    ev('D-ADR0077: names', 'supersedes:docs/x.md:413', '2026-11-22T03:00:00Z'),
    { scope: 'work-state', text: 'D-ADR0062: same number, other scope', relation: 'none', ts: '2026-10-19T00:00:00Z' },
    { kind: 'engine', scope: 'runner', text: 'D-ADR0099: engine', relation: 'supersedes:D-ADR0001', ts: '2026-01-01' },
    { text: 'D-ADR0098: unscoped', relation: 'none', ts: '2026-01-01' },
  ]);
  assert.deepEqual(Object.fromEntries([...fields.values()].filter((f) => f.scope === 'runner').map((f) => [f.id, f.line])), {
    'D-ADR0012': '[valid_from:: 2026-07-14] [amends:: D-ADR0002]',
    'D-ADR0062': '[valid_from:: 2026-10-18T14:42:56Z] [replaces:: D-ADR0061]',
    'D-ADR0057': '[valid_from:: 2026-10-18T02:00:00Z]',
    'D-ADR0077': '[valid_from:: 2026-11-22T03:00:00Z]',
  });
  assert.deepEqual([...fields.values()].filter((f) => f.id === 'D-ADR0062').map((f) => [f.scope, f.line]), [
    ['runner', '[valid_from:: 2026-10-18T14:42:56Z] [replaces:: D-ADR0061]'],
    ['work-state', '[valid_from:: 2026-10-19T00:00:00Z]'],
  ], 'one number minted in two scopes stays two decisions');
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /^D-ADR0077: supersedes:docs\/x\.md:413 names no unit id/);
});

test('placeRoleFields: the field line goes under its heading, replaces the line already there in place, and leaves other headings alone', () => {
  const doc = ['# Holder', '', '### D-ADR0061 — old', '', 'Body.', '', '#### D-ADR0062 — new', '', 'Body two.', ''].join('\n');
  const lines = new Map([['D-ADR0062', '[valid_from:: 2026-10-18] [replaces:: D-ADR0061]']]);
  const first = placeRoleFields(doc, lines);
  assert.deepEqual([...first.placed], ['D-ADR0062']);
  assert.equal(first.content, doc.replace('#### D-ADR0062 — new\n', '#### D-ADR0062 — new\n\n[valid_from:: 2026-10-18] [replaces:: D-ADR0061]\n'));
  assert.equal(placeRoleFields(first.content, lines).content, first.content, 'a second placement changes nothing');
  const cleared = placeRoleFields(first.content, new Map([['D-ADR0062', '[valid_from:: 2026-10-18]']]));
  assert.match(cleared.content, /#### D-ADR0062 — new\n\n\[valid_from:: 2026-10-18\]\n\nBody two\./);
  assert.doesNotMatch(cleared.content, /replaces::/);
});

test('computeDecisionRoleFields: a directory holder is searched file by file, a heading outside the holder is used only for a number one scope owns, and anything else is a warning, never inserted prose', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-decision-fields-'));
  const dir = path.join(repoRoot, 'docs', 'platform', 'runner', 'decisions');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'a.md'), '# A\n\n### D-ADR0030 — thirty\n\nText.\n');
  fs.writeFileSync(path.join(dir, 'b.md'), '# B\n\nNo decisions here.\n');
  fs.mkdirSync(path.join(repoRoot, 'docs', 'platform', 'event-store'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'docs', 'platform', 'event-store', 'spec.md'), '# ES\n\n### D-ADR0055 — sealed changesets\n\n### D-ADR0032 — iron law\n');
  fs.writeFileSync(path.join(repoRoot, 'docs', 'platform', 'laws.md'), '# Laws\n');
  const holders = { runner: 'docs/platform/runner/decisions/', laws: 'docs/platform/laws.md', 'work-state': 'docs/platform/laws.md' };
  const { holders: out, warnings } = computeDecisionRoleFields(repoRoot, [
    { scope: 'runner', text: 'D-ADR0030: thirty', relation: 'supersedes:ADR0025', ts: '2026-08-17T00:00:00Z' },
    { scope: 'runner', text: 'D-ADR0031: no heading', relation: 'none', ts: '2026-08-17T00:00:00Z' },
    { scope: 'ghost', text: 'D-ADR0040: no holder', relation: 'none', ts: '2026-08-17T00:00:00Z' },
    { scope: 'laws', text: 'D-ADR0055: recorded under laws, told in event-store', relation: 'amends:L3', ts: '2026-10-17T00:00:00Z' },
    { scope: 'runner', text: 'D-ADR0032: one number', relation: 'none', ts: '2026-08-17T00:00:00Z' },
    { scope: 'work-state', text: 'D-ADR0032: two scopes', relation: 'none', ts: '2026-08-17T00:00:00Z' },
  ], (name) => holders[name] ?? null);
  assert.deepEqual(out.map((h) => [h.path, h.changed]), [
    ['docs/platform/event-store/spec.md', true],
    ['docs/platform/runner/decisions/a.md', true],
  ], 'D-ADR0055 is found outside its holder; neither D-ADR0032 borrows the other scope\'s heading');
  assert.match(out[0].next, /### D-ADR0055 — sealed changesets\n\n\[valid_from:: 2026-10-17T00:00:00Z\] \[amends:: L3\]\n/);
  assert.doesNotMatch(out[0].next, /### D-ADR0032 — iron law\n\n\[/);
  out.reverse();
  assert.match(out[0].next, /### D-ADR0030 — thirty\n\n\[valid_from:: 2026-08-17T00:00:00Z\] \[replaces:: D-ADR0025\]\n\nText\./);
  assert.deepEqual(warnings.sort(), [
    'D-ADR0031: no "D-ADR0031" heading in docs/platform/runner/decisions/',
    'D-ADR0032: no "D-ADR0032" heading in docs/platform/laws.md',
    'D-ADR0032: no "D-ADR0032" heading in docs/platform/runner/decisions/',
    'D-ADR0040: scope "ghost" has no narrative holder',
  ]);
});

test('CLI: decision --valid-from is projected by decision-index into the holder, and --check refuses once a later event changes the relation', () => {
  const cwd = initCwd();
  fs.mkdirSync(path.join(cwd, 'docs', 'platform'), { recursive: true });
  const holder = path.join(cwd, 'docs', 'platform', 'repo.md');
  fs.writeFileSync(holder, '# Repo\n\n### D-ADR0012 — flat items\n\nText.\n');
  const decide = (relation, extra = []) => run(cwd, ['decision', '--text', 'D-ADR0012: flat items', '--rationale', 'r', '--relation', relation, '--scope', 'repo', ...extra]);
  assert.equal(decide('none', ['--valid-from', '2026-31-01']).status, 4, 'an impossible date is refused');
  assert.equal(decide('supersedes:ADR0002', ['--valid-from', '2026-07-14']).status, 0);
  assert.equal(run(cwd, ['decision-index']).status, 0);
  assert.match(fs.readFileSync(holder, 'utf8'), /### D-ADR0012 — flat items\n\n\[valid_from:: 2026-07-14\] \[replaces:: D-ADR0002\]\n/);
  assert.equal(run(cwd, ['decision-index', '--check']).status, 0);
  assert.equal(decide('amends:D-ADR0002').status, 0);
  const stale = run(cwd, ['decision-index', '--check']);
  assert.equal(stale.status, 4);
  assert.match(stale.stderr, /docs\/platform\/repo\.md/);
  assert.match(fs.readFileSync(holder, 'utf8'), /\[replaces:: D-ADR0002\]/, '--check never writes');
});

test('buildDecisionIndexMarkdown: a later event of the same decision restates its text and rationale, and Recorded keeps the first record', () => {
  const md = buildDecisionIndexMarkdown([
    { scope: 'runner', text: 'D-ADR0012: flat', rationale: 'first', ts: '2026-08-17T00:00:00Z' },
    { scope: 'runner', text: 'D-ADR0012: flat', rationale: 'restated', ts: '2026-11-22T00:00:00Z' },
  ]);
  assert.match(md, /\| runner \| D-ADR0012: flat \| restated \| 2026-08-17T00:00:00Z \|/);
  assert.doesNotMatch(md, /2026-11-22/);
});
