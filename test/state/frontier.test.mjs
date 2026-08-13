import { test } from 'node:test';
import assert from 'node:assert/strict';
import { frontier, frontierAcrossSteps, FRONTIER_ORDER_VERSION, isResolvedStatus } from '../../src/state/frontier.mjs';

// Pure lib — every view here is a literal or built via foldEvents in
// replay.test.mjs's style; no fs, no mkdtemp, no `.fgos/` writes anywhere in
// this file.
function item(id, status, deps = []) {
  return { id, title: id, kind: 'task', status, deps, risk: 'light', refs: [], verify: 'true' };
}

test('frontier on an empty view is empty', () => {
  assert.deepEqual(frontier({ work: {} }), []);
});

test('frontier on an empty view (missing work key) is empty', () => {
  assert.deepEqual(frontier({}), []);
});

test('an item with no deps is always in the frontier when todo', () => {
  const view = { work: { a: item('a', 'todo') } };
  assert.deepEqual(frontier(view).map((i) => i.id), ['a']);
});

test('an item is excluded from the frontier when its dep is only "awaiting-approval"', () => {
  const view = {
    work: {
      base: item('base', 'awaiting-approval'),
      dependent: item('dependent', 'todo', ['base']),
    },
  };
  assert.deepEqual(frontier(view), []);
});

test('an item is included once its dep reaches "done"', () => {
  const view = {
    work: {
      base: item('base', 'done'),
      dependent: item('dependent', 'todo', ['base']),
    },
  };
  assert.deepEqual(frontier(view).map((i) => i.id), ['dependent']);
});

// wontfix-terminal-status-filter-consistency D1: a dep at 'wontfix' unblocks
// its dependent the same as 'done' — abandoned, nothing further will ever
// land for it, so treating it as a permanent block would be a silent
// deadlock nobody notices.
test('an item is included once its dep reaches "wontfix" (D1: wontfix satisfies deps, same as done)', () => {
  const view = {
    work: {
      base: item('base', 'wontfix'),
      dependent: item('dependent', 'todo', ['base']),
    },
  };
  assert.deepEqual(frontier(view).map((i) => i.id), ['dependent']);
});

for (const status of ['blocked', 'doing', 'awaiting-approval', 'awaiting-human']) {
  test(`an item is still excluded from the frontier when its dep is only "${status}" (D1 does not over-broaden past done/wontfix)`, () => {
    const view = {
      work: {
        base: item('base', status),
        dependent: item('dependent', 'todo', ['base']),
      },
    };
    assert.deepEqual(frontier(view), []);
  });
}

test('multi-tier deps (A depends on B depends on C): only fully-done chains open', () => {
  // A <- B <- C : A is ready only once both B and C are done.
  const view = {
    work: {
      c: item('c', 'done'),
      b: item('b', 'done', ['c']),
      a: item('a', 'todo', ['b']),
    },
  };
  assert.deepEqual(frontier(view).map((i) => i.id), ['a']);
});

test('multi-tier deps: a mid-chain dep stuck at doing blocks the whole chain', () => {
  const view = {
    work: {
      c: item('c', 'done'),
      b: item('b', 'doing', ['c']),
      a: item('a', 'todo', ['b']),
    },
  };
  assert.deepEqual(frontier(view), []);
});

for (const status of ['blocked', 'doing', 'awaiting-approval', 'done', 'wontfix']) {
  test(`an item itself at status "${status}" (not todo) is excluded from the frontier`, () => {
    const view = { work: { a: item('a', status) } };
    assert.deepEqual(frontier(view), []);
  });
}

test('frontier follows FIFO seq/declaration order, not lexical id order (add-order test uses zeta before alpha)', () => {
  // Declaration order is deliberately non-lexical: "zeta" is added before
  // "alpha". If frontier ever sorted by id (alpha < zeta), this would flip
  // and the test would catch it — a plain lexical add order could not tell
  // insertion-order iteration apart from an accidental id sort.
  const view = {
    work: {
      zeta: item('zeta', 'todo'),
      alpha: item('alpha', 'todo'),
    },
  };
  assert.deepEqual(frontier(view).map((i) => i.id), ['zeta', 'alpha']);
});

// --- work-graph-intelligence S4: claim-order tie-break contract -----------
// The frontier's order is a NAMED, VERSIONED contract. v1's sole ordering key
// was FIFO by declaration order; str7-str8-priority-intent D2 bumps it to v2
// — priority ASC (absent-last), then intent DESC (absent-last), then
// declaration order. These tests pin the version and re-assert both the v1
// and v2 order as the contract, so an accidental reorder trips here.

test('S4 tie-break contract: FRONTIER_ORDER_VERSION is pinned at 2 — a reorder of the claim-order must bump it deliberately', () => {
  assert.equal(FRONTIER_ORDER_VERSION, 2);
});

test('S4 tie-break contract v1: a later-declared ready item orders AFTER an earlier-declared one (FIFO declaration order is the sole v1 key)', () => {
  const view = {
    work: {
      'later-declared': item('later-declared', 'todo'),
      'earlier-would-sort-first-by-id': item('earlier-would-sort-first-by-id', 'todo'),
    },
  };
  // Declaration order, not id order: the first-declared key comes first even
  // though its id sorts LAST lexically. This is the v1 contract P7 supersedes.
  assert.deepEqual(
    frontier(view).map((i) => i.id),
    ['later-declared', 'earlier-would-sort-first-by-id'],
  );
});

test('FIFO order survives status moves on unrelated items (moving does not reorder view.work keys)', () => {
  const view = {
    work: {
      zeta: item('zeta', 'todo'),
      middle: item('middle', 'doing'), // moved away from todo, still occupies its original slot
      alpha: item('alpha', 'todo'),
    },
  };
  assert.deepEqual(frontier(view).map((i) => i.id), ['zeta', 'alpha']);
  // Now "middle" becomes ready too (per D5, done unblocks) without changing
  // the relative order of the other two.
  view.work.middle.status = 'todo';
  assert.deepEqual(frontier(view).map((i) => i.id), ['zeta', 'middle', 'alpha']);
});

test('an item with an empty deps array is ready when todo', () => {
  const view = { work: { a: item('a', 'todo', []) } };
  assert.deepEqual(frontier(view).map((i) => i.id), ['a']);
});

test('a dangling dep id (defensive guard: dep not present in view) never crashes and never unlocks', () => {
  const view = { work: { a: item('a', 'todo', ['ghost']) } };
  assert.doesNotThrow(() => frontier(view));
  assert.deepEqual(frontier(view), []);
});

test('frontier does not mutate the view it is given', () => {
  const view = { work: { a: item('a', 'todo'), b: item('b', 'done') } };
  const before = JSON.parse(JSON.stringify(view));
  frontier(view);
  assert.deepEqual(view, before);
});

// --- D6 lock: `awaiting-human` never opens into the ready set (async-human-gate-3) ---

test('LOCK: an item at status "awaiting-human" is never in the frontier', () => {
  const view = { work: { a: item('a', 'awaiting-human') } };
  assert.deepEqual(frontier(view), []);
});

test('LOCK: a todo item whose dep is "awaiting-human" is NOT ready (an awaiting dep does not unblock, mirrors the proposed-dep case)', () => {
  const view = {
    work: {
      base: item('base', 'awaiting-human'),
      dependent: item('dependent', 'todo', ['base']),
    },
  };
  assert.deepEqual(frontier(view), []);
});

// --- stage-clarify D1: an item at stage "clarify" is never in the frontier ---

test('LOCK: a todo item with no dep-blockers but stage "clarify" is excluded from the frontier', () => {
  const view = { work: { a: { ...item('a', 'todo'), stage: 'clarify' } } };
  assert.deepEqual(frontier(view), []);
});

test('an item with stage "executing" (explicit) and status todo is ready, same as no stage at all', () => {
  const view = { work: { a: { ...item('a', 'todo'), stage: 'executing' } } };
  assert.deepEqual(frontier(view).map((i) => i.id), ['a']);
});

test('an item with no stage field at all defaults to "executing" (lazy default) and is ready', () => {
  const view = { work: { a: item('a', 'todo') } };
  assert.equal('stage' in view.work.a, false);
  assert.deepEqual(frontier(view).map((i) => i.id), ['a']);
});

test('a todo item at stage "clarify" whose deps are all done is still excluded (stage gates independently of deps)', () => {
  const view = {
    work: {
      base: item('base', 'done'),
      dependent: { ...item('dependent', 'todo', ['base']), stage: 'clarify' },
    },
  };
  assert.deepEqual(frontier(view), []);
});

// --- stage-decompose D4/D5: lineage-derived frontier filter (root blocked
// by open descendants, never by `deps`) ---

test('LOCK: a root item with an open (not-done) child is excluded from the frontier even though it has no deps of its own — the child itself is still dispatchable', () => {
  const view = {
    work: {
      root: item('root', 'todo'),
      child: { ...item('child', 'todo'), parent: 'root' },
    },
  };
  assert.deepEqual(frontier(view).map((i) => i.id), ['child']);
});

test('a root item is included once every child reaches "done"', () => {
  const view = {
    work: {
      root: item('root', 'todo'),
      child: { ...item('child', 'done'), parent: 'root' },
    },
  };
  assert.deepEqual(frontier(view).map((i) => i.id), ['root']);
});

test('a root with two children is blocked while either one is still open, then released once both are done', () => {
  const view = {
    work: {
      root: item('root', 'todo'),
      childA: { ...item('childA', 'done'), parent: 'root' },
      childB: { ...item('childB', 'doing'), parent: 'root' },
    },
  };
  assert.deepEqual(frontier(view), []);
  view.work.childB.status = 'done';
  assert.deepEqual(frontier(view).map((i) => i.id), ['root']);
});

// fsm-wontfix-terminal-status D1: wontfix is a second resolved status
// alongside done for lineage purposes — a permanently-wontfix child must
// not anchor its parent out of the frontier forever, the same structural
// bug wontfix exists to fix for blocked (per the item's own trigger case).
test('a root with two children is released once the open one reaches "wontfix" (not just "done") — wontfix counts as resolved for lineage', () => {
  const view = {
    work: {
      root: item('root', 'todo'),
      childA: { ...item('childA', 'done'), parent: 'root' },
      childB: { ...item('childB', 'wontfix'), parent: 'root' },
    },
  };
  assert.deepEqual(frontier(view).map((i) => i.id), ['root']);
});

test('a root with a genuinely blocked (not wontfix) child is still excluded — the lineage filter is not over-broadened by the wontfix fix', () => {
  const view = {
    work: {
      root: item('root', 'todo'),
      childA: { ...item('childA', 'done'), parent: 'root' },
      childB: { ...item('childB', 'blocked'), parent: 'root' },
    },
  };
  assert.deepEqual(frontier(view), []);
});

test('the lineage filter walks multiple generations: an open grandchild still blocks the root even though the direct child is already done', () => {
  const view = {
    work: {
      root: item('root', 'todo'),
      child: { ...item('child', 'done'), parent: 'root' },
      grandchild: { ...item('grandchild', 'todo'), parent: 'child' },
    },
  };
  // root: blocked by the still-open grandchild; child: done, excluded by
  // status; grandchild: itself dispatchable.
  assert.deepEqual(frontier(view).map((i) => i.id), ['grandchild']);
});

test('the lineage filter never touches deps: a root blocked by an open child is still excluded even if its own deps are all done, and children are never required in deps', () => {
  const view = {
    work: {
      unrelated: item('unrelated', 'done'),
      root: item('root', 'todo', ['unrelated']),
      child: { ...item('child', 'todo'), parent: 'root' },
    },
  };
  assert.equal(view.work.root.deps.includes('child'), false);
  // root is blocked purely by lineage (its own deps are satisfied); child
  // remains independently dispatchable.
  assert.deepEqual(frontier(view).map((i) => i.id), ['child']);
});

test('EXPLICIT (must_have): frontier on a view with no "parent" field anywhere is deep-equal to the same view evaluated before the lineage filter existed', () => {
  const view = {
    work: {
      base: item('base', 'done'),
      dependent: item('dependent', 'todo', ['base']),
      standalone: item('standalone', 'todo'),
    },
  };
  // No item carries `parent` — the lineage filter must be a complete no-op,
  // producing exactly the pre-existing deps+status+stage result.
  assert.deepEqual(frontier(view).map((i) => i.id), ['dependent', 'standalone']);
});

test('a dangling parent id (child points at a parent not present in the view) never crashes and never blocks anything', () => {
  const view = {
    work: {
      child: { ...item('child', 'todo'), parent: 'ghost-root' },
    },
  };
  assert.doesNotThrow(() => frontier(view));
  assert.deepEqual(frontier(view).map((i) => i.id), ['child']);
});

// --- domain-aware (per base-workflow-model D2/D3): frontier looks up the
// item's own domain to decide which stage counts as "ready", defaulting to
// 'coding' — zero behavior change for every item, which has no domain field ---

test('an item with an explicit domain "coding" and stage "executing" behaves identically to no domain at all', () => {
  const view = { work: { a: { ...item('a', 'todo'), domain: 'coding', stage: 'executing' } } };
  assert.deepEqual(frontier(view).map((i) => i.id), ['a']);
});

test('a todo item with an explicit domain "coding" and stage "clarify" is still excluded (matches the no-domain case)', () => {
  const view = { work: { a: { ...item('a', 'todo'), domain: 'coding', stage: 'clarify' } } };
  assert.deepEqual(frontier(view), []);
});

test('an item with an unrecognized domain never throws and folds to "coding" readiness rules', () => {
  const view = { work: { a: { ...item('a', 'todo'), domain: 'bogus-domain' } } };
  assert.doesNotThrow(() => frontier(view));
  // No stage field either -> reads as coding's Execute stage ("executing") -> ready.
  assert.deepEqual(frontier(view).map((i) => i.id), ['a']);
});

// --- str7-str8-priority-intent D2/D6: v2 comparator (priority ASC, intent
// DESC, both absent-last, declaration order as final tie-break) -----------

test('v2: an item with priority=1 orders before one with priority=5 (priority ASCENDING — lower value = higher priority)', () => {
  const view = {
    work: {
      low: { ...item('low', 'todo'), priority: 5 },
      high: { ...item('high', 'todo'), priority: 1 },
    },
  };
  assert.deepEqual(frontier(view).map((i) => i.id), ['high', 'low']);
});

test('v2: an item WITH a priority sorts before one with no priority at all, regardless of the set value (absent-last bucketing)', () => {
  const view = {
    work: {
      unset: item('unset', 'todo'),
      // A high (numerically large, i.e. "low urgency") priority value still
      // beats "no priority" — presence of the field always wins the bucket.
      setHigh: { ...item('setHigh', 'todo'), priority: 99 },
    },
  };
  assert.deepEqual(frontier(view).map((i) => i.id), ['setHigh', 'unset']);
});

test('v2: tied on priority (both absent), an item with a higher intent orders before one with a lower intent (intent DESCENDING)', () => {
  const view = {
    work: {
      lowIntent: { ...item('lowIntent', 'todo'), intent: 2 },
      highIntent: { ...item('highIntent', 'todo'), intent: 8 },
    },
  };
  assert.deepEqual(frontier(view).map((i) => i.id), ['highIntent', 'lowIntent']);
});

test('v2 REPLAY-COMPATIBILITY: a view where no item has priority or intent produces the EXACT SAME order as the pre-bump v1 contract (declaration order, not lexical id order)', () => {
  // Same fixture shape as the v1 FIFO test above (zeta declared before
  // alpha, whose id would sort first lexically) — neither item carries
  // priority or intent, so the v2 comparator must fall straight through to
  // declaration order exactly as v1 did, byte-identical.
  const view = {
    work: {
      zeta: item('zeta', 'todo'),
      alpha: item('alpha', 'todo'),
    },
  };
  assert.deepEqual(frontier(view).map((i) => i.id), ['zeta', 'alpha']);
});

// --- `step` param (tsk-19j D9, generalizes the Execute hardcode) ---------

test('frontier(view, {step}) omitted defaults to "Execute", byte-identical to every pre-existing caller', () => {
  const view = { work: { a: item('a', 'todo') } };
  assert.deepEqual(frontier(view), frontier(view, { step: 'Execute' }));
});

test('frontier(view, {step: "Divide"}) selects items at the planning stage instead of executing', () => {
  const view = {
    work: {
      atPlanning: { ...item('atPlanning', 'todo'), stage: 'planning' },
      atExecuting: { ...item('atExecuting', 'todo'), stage: 'executing' },
    },
  };
  assert.deepEqual(frontier(view, { step: 'Divide' }).map((i) => i.id), ['atPlanning']);
  // tsk-qod D1/D2: `clarify` is retired as a coding stage entirely --
  // stageForStep(domain, 'Clarify') is undefined for coding now, so no
  // item (whatever its own `stage` field reads) can ever match this step.
  assert.deepEqual(frontier(view, { step: 'Clarify' }).map((i) => i.id), []);
  assert.deepEqual(frontier(view).map((i) => i.id), ['atExecuting']);
});

test('frontier(view, {step}) for a step the item\'s domain never maps excludes every item, even one with no stage field at all (no false-tie admit)', () => {
  const view = {
    work: {
      synthetic: { ...item('synthetic', 'todo'), domain: 'synthetic' },
    },
  };
  // synthetic only maps 'assembling' to Execute -- it has no Clarify/Divide
  // step at all (stageForStep returns undefined for both).
  assert.deepEqual(frontier(view, { step: 'Clarify' }), []);
  assert.deepEqual(frontier(view, { step: 'Divide' }), []);
  // Execute (the mapped step) still works unchanged.
  assert.deepEqual(frontier(view).map((i) => i.id), ['synthetic']);
});

// --- `frontierAcrossSteps` (tsk-4so D1, docs/history/execution-fanout/
// CONTEXT-tsk-4so.md): union of `frontier(view, {step})` across steps,
// closing the gap where a single-step advisory is blind to two items at
// DIFFERENT steps sharing a footprint ------------------------------------

test('frontierAcrossSteps: items at different steps are all included (the real gap this exists to close)', () => {
  // tsk-qod D1/D2: coding's own Clarify step is retired -- no coding stage
  // maps to it anymore -- so this uses the two steps coding still maps
  // (Divide/Execute) rather than a third, now-impossible Clarify item.
  const view = {
    work: {
      atPlanning: { ...item('atPlanning', 'todo'), stage: 'planning' },
      atExecuting: { ...item('atExecuting', 'todo'), stage: 'executing' },
    },
  };
  assert.deepEqual(frontierAcrossSteps(view).map((i) => i.id).sort(), ['atExecuting', 'atPlanning']);
});

test('frontierAcrossSteps: an item is never duplicated even though a missing `stage` field matches every step', () => {
  const view = { work: { noStage: item('noStage', 'todo') } };
  const out = frontierAcrossSteps(view);
  assert.equal(out.length, 1);
  assert.equal(out[0].id, 'noStage');
});

test('frontierAcrossSteps: default steps are Clarify+Divide+Execute; a narrower explicit list only unions those', () => {
  const view = {
    work: {
      atClarify: { ...item('atClarify', 'todo'), stage: 'clarify' },
      atExecuting: { ...item('atExecuting', 'todo'), stage: 'executing' },
    },
  };
  assert.deepEqual(frontierAcrossSteps(view, ['Execute']).map((i) => i.id), ['atExecuting']);
});

test('frontierAcrossSteps: empty view yields an empty array, no error', () => {
  assert.deepEqual(frontierAcrossSteps({ work: {} }), []);
});

test('frontierAcrossSteps re-sorts the unioned set by FRONTIER_ORDER_VERSION\'s own tie-break, not by step-array concatenation order', () => {
  const view = {
    work: {
      // Declared executing first but with a WORSE priority than the
      // planning-stage item -- a naive concat of already-sorted per-step
      // arrays would keep 'atExecuting' first; a correct re-sort must not.
      atExecuting: { ...item('atExecuting', 'todo'), stage: 'executing', priority: 20 },
      atPlanning: { ...item('atPlanning', 'todo'), stage: 'planning', priority: 10 },
    },
  };
  assert.deepEqual(frontierAcrossSteps(view).map((i) => i.id), ['atPlanning', 'atExecuting']);
});

// --- tsk-38t-4 (decision record 0027, D1/D2/D3): isResolvedStatus ---------
// RESOLVED_STATUSES (a flat literal Set) is replaced by isResolvedStatus(item)
// -- a hybrid read: literal for the four tail-segment statuses (never
// relabeled by any domain, D1), statusCategory === 'canceled' for whatever
// wontfix-equivalent label a domain uses (D2). These tests lock both halves,
// the legacy-data fallback (an item written before this field existed), and
// prove zero regression for every existing coding-domain scenario.

test('isResolvedStatus: undefined/missing item is never resolved (matches RESOLVED_STATUSES.has(undefined) === false)', () => {
  assert.equal(isResolvedStatus(undefined), false);
});

for (const status of ['delivered', 'retrospective', 'cleanup', 'done']) {
  test(`isResolvedStatus: a tail-segment status "${status}" is always resolved, literal, with or without statusCategory (D1: never relabeled)`, () => {
    assert.equal(isResolvedStatus({ status }), true);
    // A tail-segment item's statusCategory is stale/absent per replay.mjs's
    // own fold rule (it is never actively cleared on a move into the tail) —
    // the literal check must win regardless of whatever category value (or
    // lack of one) happens to be sitting on the item.
    assert.equal(isResolvedStatus({ status, statusCategory: 'review' }), true);
    assert.equal(isResolvedStatus({ status, statusCategory: undefined }), true);
  });
}

for (const status of ['todo', 'doing', 'blocked', 'awaiting-human', 'awaiting-approval']) {
  test(`isResolvedStatus: a front-segment non-canceled status "${status}" with no statusCategory is NOT resolved (legacy-data fallback does not over-broaden)`, () => {
    assert.equal(isResolvedStatus({ status }), false);
  });
}

test("isResolvedStatus: literal 'wontfix' with NO statusCategory is resolved (legacy fallback -- an item written before tsk-38t-2 stamped this field, same as RESOLVED_STATUSES.has('wontfix') === true before this migration)", () => {
  assert.equal(isResolvedStatus({ status: 'wontfix' }), true);
});

test("isResolvedStatus: literal 'wontfix' WITH statusCategory 'canceled' (the real coding-domain write path, post tsk-38t-2) is resolved", () => {
  assert.equal(isResolvedStatus({ status: 'wontfix', statusCategory: 'canceled' }), true);
});

test("isResolvedStatus: statusCategory present but NOT 'canceled' overrides a literal 'wontfix'-shaped status that isn't actually wontfix -- category wins once it exists", () => {
  assert.equal(isResolvedStatus({ status: 'blocked', statusCategory: 'in-progress' }), false);
});

// This is the whole point of the migration (per the item's own acceptance):
// a SECOND domain with a DIFFERENT label for its "canceled"-equivalent
// status must be recognized as resolved via statusCategory, NOT via a
// literal 'wontfix' string match.
test("isResolvedStatus: a DIFFERENT domain's canceled-equivalent label ('declined') with statusCategory 'canceled' is resolved -- category-based recognition, not a literal 'wontfix' match", () => {
  assert.equal(isResolvedStatus({ status: 'declined', statusCategory: 'canceled' }), true);
});

test("isResolvedStatus: the same 'declined' label WITHOUT statusCategory 'canceled' is NOT resolved (proves the previous test passed because of the category, not because 'declined' is special-cased anywhere)", () => {
  assert.equal(isResolvedStatus({ status: 'declined' }), false);
  assert.equal(isResolvedStatus({ status: 'declined', statusCategory: 'in-progress' }), false);
});

// --- dep-resolution end-to-end with a cross-domain canceled label ---------

test("frontier: a dep at a DIFFERENT domain's canceled-equivalent status + statusCategory 'canceled' unblocks its dependent, exactly like a coding 'wontfix' dep does", () => {
  const view = {
    work: {
      base: { ...item('base', 'declined'), statusCategory: 'canceled' },
      dependent: item('dependent', 'todo', ['base']),
    },
  };
  assert.deepEqual(frontier(view).map((i) => i.id), ['dependent']);
});

// --- ready-filter statusCategory hybrid (frontier.mjs:92's own audit row) -

test("frontier: an item at statusCategory 'todo' with a DIFFERENT literal status label is still picked up as ready (the ready filter reads category, not the literal string 'todo')", () => {
  const view = { work: { a: { ...item('a', 'not-started'), statusCategory: 'todo' } } };
  assert.deepEqual(frontier(view).map((i) => i.id), ['a']);
});

test("frontier: an item with literal status 'todo' but statusCategory explicitly set to something else is NOT ready (statusCategory, once present, wins over the literal status string)", () => {
  const view = { work: { a: { ...item('a', 'todo'), statusCategory: 'in-progress' } } };
  assert.deepEqual(frontier(view), []);
});

test('frontier: an item with literal status "todo" and NO statusCategory at all (legacy/pre-tsk-38t-2 data) is still ready -- zero regression for every pre-migration item', () => {
  const view = { work: { a: item('a', 'todo') } };
  assert.equal('statusCategory' in view.work.a, false);
  assert.deepEqual(frontier(view).map((i) => i.id), ['a']);
});

// work-item-backlog-status D3: the whole reason `backlog` earns its OWN
// statusCategory rather than reusing `todo`'s. isTodoStatus is a POSITIVE
// match on the category, so a backlog item drops out of `ready` with no
// frontier-side code change at all -- these two assertions are what prove
// that claim rather than assuming it.
test("frontier: an item at statusCategory 'backlog' is NOT ready (a not-yet-committed idea never reaches the frontier)", () => {
  const view = { work: { a: { ...item('a', 'backlog'), statusCategory: 'backlog' } } };
  assert.deepEqual(frontier(view), []);
});

test("frontier: a literal 'backlog' status with NO statusCategory is also NOT ready (the legacy literal fallback compares against 'todo', so it excludes backlog too)", () => {
  const view = { work: { a: item('a', 'backlog') } };
  assert.equal('statusCategory' in view.work.a, false);
  assert.deepEqual(frontier(view), []);
});

