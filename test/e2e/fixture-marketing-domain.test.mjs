// test/e2e/fixture-marketing-domain.test.mjs — tsk-38t-7, the capstone
// proof for decision record 0027 / tsk-38t's whole Phase 2 multi-domain
// schema (docs/history/phase-2-status-category-schema/DISCUSSION.md
// §"Test domain giả lập thứ 2 chứng minh thiết kế"). Mirrors
// test/e2e/synthetic-domain.test.mjs's own real mkdtemp-git-repo + real
// bin/fgos.mjs child-process harness style exactly — every assertion here
// reads on-disk `.fgos/` state (state.json, the raw events.jsonl log) or
// `fgos` CLI stdout, the same way an outside observer would, never a
// mocked store call.
//
// What this file closes that `synthetic-domain.test.mjs` and
// `test/state/workflow-stage-graphs.test.mjs`'s own `triage` coverage never
// did: neither `synthetic` nor `triage` ever declares a `statusLabels` or
// `skillMap.retrospective` entry (workflow-stage-graphs.mjs) — both exist
// purely to prove the STAGE axis (Clarify/Divide/Execute, base-workflow-
// model D1-D3) generalizes to a non-coding domain. 0027 (D1-D3) supersedes
// that model for the STATUS axis's own front segment (todo/doing/blocked/
// awaiting-human/awaiting-approval/wontfix -> statusCategory), and D5/D6
// added skillMap.retrospective and domainFields/fieldSchema on top — none
// of that machinery had ever been exercised for a domain other than
// coding, through the real store, before this item. `DOMAINS['fixture-
// marketing']` (workflow-stage-graphs.mjs) is the fixture this file drives.
//
// A note on the one deliberate judgment call this file's design rests on
// (documented in full on the DOMAINS entry itself): status-fsm.mjs's
// TRANSITIONS table is ONE shared flat table for every domain (confirmed by
// reading status-fsm.mjs and work.mjs's STATUSES directly — both are
// closed to the same 11 literal status names; 0027's own "Quyết định"
// section is explicit that this is the case, and DISCUSSION.md §1/§6
// explicitly REJECTS the broader "domain owns the whole transition table"
// framing an earlier report round proposed). So this fixture domain cannot
// introduce a genuinely new status literal (e.g. a hypothetical
// `declined`) — instead, its statusLabels maps the EXISTING `blocked`
// literal (not `wontfix`) into the `canceled` category, which is the
// strongest proof available within that real constraint: it forces
// `isResolvedStatus` (frontier.mjs) to read `item.statusCategory`
// generically rather than any hardcoded `'wontfix'` string, because this
// domain's own "declined" item never carries that literal at all.

import { test } from 'node:test';
import { resolveFgosFile, FGOS_FILE } from '../../src/state/fgos-file-registry.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { getDomain, DOMAINS } from '../../src/state/workflow-stage-graphs.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');
const DOMAIN = 'fixture-marketing';

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// Pinned to "main" — same reason as synthetic-domain.test.mjs's own
// initTempRepo.
function initTempRepo() {
  const repoRoot = mkTempDir('fgos-fixture-marketing-e2e-repo-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'root commit'], { cwd: repoRoot });
  return repoRoot;
}

function fgos(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function ok(result, label) {
  assert.equal(result.status, 0, `${label} failed: ${result.stderr}`);
  return result.stdout ? JSON.parse(result.stdout).data : undefined;
}

function add(cwd, id, extra = {}) {
  const flags = [
    '--title', extra.title ?? `Title ${id}`,
    '--kind', extra.kind ?? 'task',
    '--risk', extra.risk ?? 'light',
    '--verify', extra.verify ?? 'true',
    // tsk-535: --description is required at add's CLI layer.
    '--description', extra.description ?? `Title ${id}`,
    // add-stage-default-gap D1/D2: add now defaults to stage 'clarify'
    // instead of the old implicit 'executing' -- every test in this file
    // needs its item immediately dispatchable/ready, and 'fixture-marketing'
    // reuses coding's literal stage names (workflow-stage-graphs.mjs), so
    // 'executing' is correct here the same way it is for the coding domain.
    '--stage', extra.stage ?? 'executing',
  ];
  if (extra.domain) flags.push('--domain', extra.domain);
  if (extra.deps) flags.push('--deps', extra.deps.join(','));
  if (extra.domainFields) flags.push('--domain-fields', JSON.stringify(extra.domainFields));
  return ok(fgos(cwd, ['add', id, ...flags]), `add ${id}`);
}

function move(cwd, id, to, extraFlags = []) {
  return ok(fgos(cwd, ['move', id, '--to', to, ...extraFlags]), `move ${id} -> ${to}`);
}

function envelopeData(stdout) {
  return JSON.parse(stdout).data;
}

function stateView(cwd) {
  return envelopeData(fgos(cwd, ['list', '--all', '--json']).stdout);
}

// Raw event log — used ONLY where the folded view cannot answer the
// question (status-category.test.mjs's own "stale category survives
// uncleared" finding means `view.work[id].statusCategory` keeps whatever a
// PRIOR front-segment move stamped, even across tail-segment moves that
// stamp nothing new — so proving a tail move itself carried no
// statusCategory needs the raw per-event payload, not the folded item).
// Tầng A/T2/T3 (TA-D2/TA-D7/TA-D12): new events land in a per-writer file
// under `.fgos/events/<writer-id>-<openTs>.jsonl` (one per CLI subprocess
// invocation here), not baseline-0's `.fgos/events.jsonl` alone (still read
// too — legacy content lives there, zero rewrite). This file's own
// "outside observer, never a mocked store call" discipline (top of file)
// means the TA-D7 total order `(ts, file, seq)` is re-derived here rather
// than delegating to replay.mjs.
function rawWorkMoveEvents(cwd, id) {
  const tagged = [];
  const logPath = path.join(cwd, '.fgos', 'events.jsonl');
  if (fs.existsSync(logPath)) {
    for (const line of fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean)) {
      tagged.push({ ev: JSON.parse(line), file: '' });
    }
  }
  const eventsDir = path.join(cwd, '.fgos', 'events');
  let names = [];
  try {
    names = fs
      .readdirSync(eventsDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.jsonl'))
      .map((entry) => entry.name);
  } catch {
    names = [];
  }
  for (const name of names) {
    for (const line of fs.readFileSync(path.join(eventsDir, name), 'utf8').split('\n').filter(Boolean)) {
      tagged.push({ ev: JSON.parse(line), file: name });
    }
  }
  tagged.sort((a, b) => {
    if (a.ev.ts !== b.ev.ts) return a.ev.ts < b.ev.ts ? -1 : 1;
    if (a.file !== b.file) return a.file < b.file ? -1 : 1;
    return (a.ev.seq ?? 0) - (b.ev.seq ?? 0);
  });
  return tagged.map(({ ev }) => ev).filter((e) => e.type === 'work.move' && e.payload?.id === id);
}

// --- Direct registry proof (no CLI needed): the DOMAINS entry itself ---

test("DOMAINS['fixture-marketing'] declares its OWN statusLabels/skillMap.retrospective/fieldSchema, none of them borrowed from coding", () => {
  const fixture = getDomain(DOMAIN);
  const coding = getDomain('coding');
  assert.notEqual(fixture, coding);

  // The canceled-equivalent slot genuinely differs (0027 D2: category
  // mapping is domain-owned) — coding's `blocked` is `in-progress`,
  // fixture-marketing's is `canceled`.
  assert.equal(fixture.statusLabels.blocked, 'canceled');
  assert.equal(coding.statusLabels.blocked, 'in-progress');
  assert.notEqual(fixture.statusLabels.blocked, coding.statusLabels.blocked);

  // skillMap.retrospective (0027 D5) resolves to a distinct value, not a
  // silent fallback to coding's 'fgos-coding-compounding'.
  assert.equal(fixture.skillMap.retrospective, 'fgos-fixture-retro');
  assert.notEqual(fixture.skillMap.retrospective, coding.skillMap.retrospective);

  // fieldSchema (0027 D6) exists and is a real, distinct declaration.
  assert.deepEqual(fixture.fieldSchema, { campaign: 'string', budget: 'number' });
});

test('adding "fixture-marketing" leaves DOMAINS.coding completely unchanged (RUL11 — purely additive)', () => {
  assert.deepEqual(DOMAINS.coding.stages, ['discovery', 'exploring', 'decompose', 'planning', 'executing']);
  assert.deepEqual(DOMAINS.coding.statusLabels, {
    // work-item-backlog-status D3 mapped the new `backlog` status into the
    // already-reserved `backlog` category; every other entry is untouched.
    backlog: 'backlog',
    todo: 'todo',
    doing: 'in-progress',
    blocked: 'in-progress',
    'awaiting-human': 'in-progress',
    'awaiting-approval': 'review',
    wontfix: 'canceled',
  });
  assert.equal(DOMAINS.coding.skillMap.retrospective, 'fgos-coding-compounding');
  assert.equal(DOMAINS.coding.fieldSchema, undefined);
  assert.equal(DOMAINS.coding.worktreeBacked, true);
});

// --- e2e: statusCategory stamped per fixture-marketing's OWN statusLabels ---

test('e2e: moving a fixture-marketing item into "blocked" stamps statusCategory "canceled" (its own declined-equivalent) while the same move for a plain coding item stamps "in-progress"', () => {
  const repoRoot = initTempRepo();
  assert.equal(fgos(repoRoot, ['init']).status, 0);

  add(repoRoot, 'fx-cat', { domain: DOMAIN });
  add(repoRoot, 'coding-cat', {});

  // add-time stamp: both start "todo" -> category "todo" for either domain
  // (the shared front-segment shape both declare identically).
  let view = stateView(repoRoot);
  assert.equal(view.work['fx-cat'].statusCategory, 'todo');
  assert.equal(view.work['coding-cat'].statusCategory, 'todo');

  // tsk-40m: todo -> doing is retired -- awaiting-human stands in as the
  // shared "in-progress" example both domains keep grouped the same way
  // (workflow-stage-graphs.mjs's own fixture-marketing comment: "doing/
  // awaiting-human keep coding's own in-progress grouping"). Entered via
  // the dedicated `ask` verb (the generic `move` verb has no --ask flag).
  const ASK = '## Context\n\nBackground needed to understand this question without opening another file.\n\n## Why this matters\n\nThis directly affects the outcome.';
  assert.equal(fgos(repoRoot, ['ask', 'fx-cat', '--text', ASK]).status, 0);
  assert.equal(fgos(repoRoot, ['ask', 'coding-cat', '--text', ASK]).status, 0);
  view = stateView(repoRoot);
  assert.equal(view.work['fx-cat'].statusCategory, 'in-progress');
  assert.equal(view.work['coding-cat'].statusCategory, 'in-progress');

  assert.equal(fgos(repoRoot, ['answer', 'fx-cat', '--text', 'resolved']).status, 0);
  assert.equal(fgos(repoRoot, ['answer', 'coding-cat', '--text', 'resolved']).status, 0);

  // The divergence: same literal edge (doing -> blocked), same shared FSM
  // table (status-fsm.mjs, untouched by this item) — different category,
  // because each domain's OWN statusLabels table is consulted.
  move(repoRoot, 'fx-cat', 'blocked');
  move(repoRoot, 'coding-cat', 'blocked');
  view = stateView(repoRoot);
  assert.equal(view.work['fx-cat'].status, 'blocked');
  assert.equal(view.work['coding-cat'].status, 'blocked');
  assert.equal(view.work['fx-cat'].statusCategory, 'canceled', 'fixture-marketing maps its own "blocked" to canceled');
  assert.equal(view.work['coding-cat'].statusCategory, 'in-progress', 'coding keeps its own "blocked" as in-progress, unaffected');
});

// --- e2e: isResolvedStatus/frontier's ready filter generalize past 'wontfix' ---

test('e2e: a dependent item unblocks when its fixture-marketing dep enters "blocked" (its OWN declined-equivalent, category "canceled") — proving isResolvedStatus reads statusCategory, not a hardcoded "wontfix" literal', () => {
  const repoRoot = initTempRepo();
  assert.equal(fgos(repoRoot, ['init']).status, 0);

  add(repoRoot, 'fx-dep', { domain: DOMAIN });
  add(repoRoot, 'dependent-item', { deps: ['fx-dep'] });

  const before = ok(fgos(repoRoot, ['ready']), 'ready (before)');
  const beforeIds = before.map((item) => item.id);
  assert.ok(!beforeIds.includes('dependent-item'), 'dependent-item is not ready yet — its dep is still unresolved todo');

  // fx-dep never carries the literal status 'wontfix' at any point — this
  // is the whole point: it is "declined" through 'blocked', a status
  // literal isResolvedStatus's own legacy fallback (item.status ===
  // 'wontfix') would NEVER recognize as resolved.
  move(repoRoot, 'fx-dep', 'blocked');
  const viewAfterBlock = stateView(repoRoot);
  assert.equal(viewAfterBlock.work['fx-dep'].status, 'blocked');
  assert.equal(viewAfterBlock.work['fx-dep'].statusCategory, 'canceled');

  const after = ok(fgos(repoRoot, ['ready']), 'ready (after)');
  const afterIds = after.map((item) => item.id);
  assert.ok(afterIds.includes('dependent-item'), 'dependent-item is ready now — its fixture-marketing dep resolved via category, not literal wontfix');
});

// --- e2e: domainFields round-trip + fieldSchema accept/reject ---

test('e2e: work.add/work.edit --domain-fields round-trips for a fixture-marketing item, whole-object-overwrite on edit, and fieldSchema accepts/rejects correctly', () => {
  const repoRoot = initTempRepo();
  assert.equal(fgos(repoRoot, ['init']).status, 0);

  add(repoRoot, 'fx-fields', {
    domain: DOMAIN,
    domainFields: { [DOMAIN]: { campaign: 'launch', budget: 500 } },
  });
  let view = stateView(repoRoot);
  assert.deepEqual(view.work['fx-fields'].domainFields, { [DOMAIN]: { campaign: 'launch', budget: 500 } });

  // Accepted shape via edit: whole-object overwrite (latest-wins, never a
  // deep merge) — omitting "budget" on this second write must NOT leave the
  // prior 500 surviving.
  const editOk = fgos(repoRoot, ['edit', 'fx-fields', '--domain-fields', JSON.stringify({ [DOMAIN]: { campaign: 'relaunch' } })]);
  assert.equal(editOk.status, 0, `edit (accepted shape) failed: ${editOk.stderr}`);
  view = stateView(repoRoot);
  assert.deepEqual(view.work['fx-fields'].domainFields, { [DOMAIN]: { campaign: 'relaunch' } });
  assert.equal(view.work['fx-fields'].domainFields[DOMAIN].budget, undefined, 'whole-object overwrite drops the prior budget value, no deep merge');

  // Rejected shape: fieldSchema declares campaign: 'string' — a number
  // violates it, validateDomainFields must refuse before any event is
  // appended.
  const editBad = fgos(repoRoot, ['edit', 'fx-fields', '--domain-fields', JSON.stringify({ [DOMAIN]: { campaign: 12345 } })]);
  assert.notEqual(editBad.status, 0, 'edit with a schema-violating domainFields shape must fail');
  view = stateView(repoRoot);
  assert.deepEqual(
    view.work['fx-fields'].domainFields,
    { [DOMAIN]: { campaign: 'relaunch' } },
    'the rejected edit appended no event — domainFields stays exactly what the last GOOD edit left it as',
  );
});

// --- e2e: full lifecycle through take/return/retrospective/compound/cleanup ---

test('e2e: a fixture-marketing item runs the real take -> return -> delivered -> retrospective -> compound -> cleanup chain, reaching done identically to coding — the four tail-segment moves stamp NO statusCategory, exactly like coding', () => {
  const repoRoot = initTempRepo();
  assert.equal(fgos(repoRoot, ['init']).status, 0);
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'config.json'), JSON.stringify({ cleanup: { ttlDays: 0 } }));

  add(repoRoot, 'fx-life', { domain: DOMAIN, verify: 'true' });

  // take: real claim-port.mjs code path (isolate:false, main checkout).
  ok(fgos(repoRoot, ['take', 'fx-life']), 'take fx-life');
  assert.equal(stateView(repoRoot).work['fx-life'].status, 'doing');
  assert.equal(stateView(repoRoot).work['fx-life'].statusCategory, 'in-progress');

  // return: real goal-check (verify: 'true') + doing -> awaiting-approval.
  // No new commits were made since take, so this exercises the same
  // documented escape hatch synthetic-domain.test.mjs's own second test
  // does not need but tsk-4on's own D1-D3 exist for.
  const returned = ok(fgos(repoRoot, ['return', 'fx-life', '--no-new-commits-ok']), 'return fx-life');
  assert.equal(returned.to, 'awaiting-approval');
  assert.equal(stateView(repoRoot).work['fx-life'].status, 'awaiting-approval');
  assert.equal(stateView(repoRoot).work['fx-life'].statusCategory, 'review');

  move(repoRoot, 'fx-life', 'delivered');

  // retrospective verb: the mechanical batch sweep (delivered -> retrospective).
  const swept = ok(fgos(repoRoot, ['retrospective']), 'retrospective sweep');
  assert.ok(swept.swept.some((s) => s.id === 'fx-life'));
  assert.equal(stateView(repoRoot).work['fx-life'].status, 'retrospective');

  // compound verb: tags the retrospective-status item with a Diataxis doc
  // type — exercised for real, per this item's own instruction to run
  // through take/return/compound/retrospective/cleanup.
  //
  // retrospective-doc-write-path D3: compound now refuses a --doc-path
  // whose file is not committed at the main checkout's HEAD, so the
  // document has to actually exist and be committed here first — the same
  // write-before-tag order fgos-compounding's own SKILL.md now documents.
  fs.mkdirSync(path.join(repoRoot, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'docs', 'how-to', 'fixture-marketing-example.md'), '# Fixture marketing example\n');
  execFileSync('git', ['add', 'docs/how-to/fixture-marketing-example.md'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'docs: fixture-marketing example'], { cwd: repoRoot });

  const compounded = ok(fgos(repoRoot, [
    'compound', 'fx-life',
    '--doc-type', 'how-to',
    '--doc-path', 'docs/how-to/fixture-marketing-example.md',
  ]), 'compound fx-life');
  assert.equal(compounded.docType, 'how-to');

  // checkRetrospectiveContent (cleanup-harness.mjs) needs an outcome.actual/
  // predicted OR a decision record — compound's own addOutcome call above
  // carries neither key (it only writes docType/docPath), so a real
  // decision record supplies genuine retrospective content, mirroring
  // synthetic-domain.test.mjs's own cleanup test exactly.
  assert.equal(
    fgos(repoRoot, ['decision', '--text', 'fixture-marketing retrospective note', '--rationale', 'proves real retrospective content exists', '--id', 'fx-life', '--relation', 'none']).status,
    0,
  );

  move(repoRoot, 'fx-life', 'cleanup');

  // cleanup verb: the dedicated harness (worktreeBacked:false, so the
  // merge-still-resolves check is skipped, same as synthetic).
  const cleaned = ok(fgos(repoRoot, ['cleanup', 'fx-life']), 'cleanup fx-life');
  assert.equal(cleaned.to, 'done');
  assert.equal(stateView(repoRoot).work['fx-life'].status, 'done');

  // The tail-segment proof (D1): none of the four delivered/retrospective/
  // cleanup/done moves carries a statusCategory on its RAW event payload —
  // identical to coding's own behavior (status-category.test.mjs's "moving
  // into the four tail-segment statuses never writes statusCategory" test),
  // now proven for a non-coding domain too, through the real CLI/store.
  const events = rawWorkMoveEvents(repoRoot, 'fx-life');
  const tailMoves = events.filter((e) => ['delivered', 'retrospective', 'cleanup', 'done'].includes(e.payload.to));
  assert.equal(tailMoves.length, 4, 'expected exactly the four tail-segment moves in the raw log');
  for (const event of tailMoves) {
    assert.equal('statusCategory' in event.payload, false, `tail move to "${event.payload.to}" must carry no statusCategory key, got: ${JSON.stringify(event.payload)}`);
  }

  // Contrast: the one front-segment move earlier in this SAME lifecycle
  // (awaiting-approval) DID carry one — the split is real, not an artifact
  // of a domain that never stamps anything. tsk-40m: `take`'s own claim
  // writes no durable work.move at all (doing is purely derived from the
  // active-claim overlay now), so there is no raw 'doing' move to check
  // here — this is the ONE front-segment move left in the raw log.
  const frontMoves = events.filter((e) => ['doing', 'awaiting-approval'].includes(e.payload.to));
  assert.equal(frontMoves.length, 1);
  for (const event of frontMoves) {
    assert.equal('statusCategory' in event.payload, true, `front-segment move to "${event.payload.to}" must carry statusCategory`);
  }
});
