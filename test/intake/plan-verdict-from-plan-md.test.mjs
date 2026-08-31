import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planVerdictFromPlanMd } from '../../src/intake/plan-verdict-from-plan-md.mjs';

// Cell P01.2 (R3/G5) — pure derivation, no fs/store rig needed: every case
// is a bare string in, a verdict object (or null) out.

test('planVerdictFromPlanMd returns pass-through for a one-piece plan (a "## Split" section explicitly declaring no split)', () => {
  const planMd = `## Split decision: none\n\nThis is one honest piece of work. A split would not help.\n\n## Outstanding questions\n\nNone.\n`;
  assert.deepEqual(planVerdictFromPlanMd(planMd), { verdict: 'pass-through' });
});

test('planVerdictFromPlanMd returns pass-through for real corpus phrasing "## No split" (docs/history/*/plan.md convention, not just the "## Split..." fixture headings above)', () => {
  const planMd = `## No split\n\nOne honest piece of work; a split would not help here.\n\n## Outstanding questions\n\nNone.\n`;
  assert.deepEqual(planVerdictFromPlanMd(planMd), { verdict: 'pass-through' });
});

test('planVerdictFromPlanMd returns pass-through for real corpus phrasing "## Decide the split" (docs/history/*/plan.md convention)', () => {
  const planMd = `## Decide the split\n\nNo split needed -- this is one coherent piece.\n\n## Outstanding questions\n\nNone.\n`;
  assert.deepEqual(planVerdictFromPlanMd(planMd), { verdict: 'pass-through' });
});

test('planVerdictFromPlanMd does not mistake an unrelated "Reality-gate finding ... split ..." heading for the canonical split section and does not return pass-through for it (real false positive: docs/history/herdr-cockpit-pane-guard-reuse-and-boot-window/plan.md)', () => {
  const planMd = `# Plan — tsk-40g: herdr cockpit pane-guard fixes (3 defects)\n\nMode: standard\n\n## Reality-gate finding (fgos-coding-validating, round 1) -- split, don't guess defect 3\n\nSome analysis prose explaining the trade-offs.\n\n**Decision: split.** Defects 1 and 2 proceed as this item's own scope; defect 3 is carved into its own child item.\n\n## Bootstrap note\n\nNo further split-related heading appears anywhere else in this document.\n`;
  const result = planVerdictFromPlanMd(planMd);
  assert.notDeepEqual(result, { verdict: 'pass-through' }, 'must not silently mis-route this real, currently-in-use heading pattern to pass-through');
  // No canonical "## Split"-led heading exists anywhere else in this
  // fixture, so the correct fail-safe outcome is null (Step 4 outcome
  // unknown from this text), same as "no Split section at all" above --
  // never a guessed decompose/pass-through verdict either.
  assert.equal(result, null);
});

test('planVerdictFromPlanMd returns null when plan.md never mentions a "## Split" section at all (Step 4 outcome unknown -- never guess)', () => {
  const planMd = `## Grounding\n\nSome context.\n\n## Approach\n\nDo the thing directly.\n\n## Outstanding questions\n\nNone.\n`;
  assert.equal(planVerdictFromPlanMd(planMd), null);
});

test('planVerdictFromPlanMd returns decompose with the verbatim children array when plan.md carries a split-children JSON block', () => {
  const planMd = `## Approach\n\nSplitting into two pieces.\n\n## Split\n\nTwo independently workable pieces.\n\n\`\`\`json\n[\n  {\n    "title": "Build parser",\n    "verify": "npm test -- parser",\n    "action": "D1: implement the parser per the locked format.",\n    "footprint": ["src/parser.mjs"],\n    "kind": "task",\n    "risk": "light"\n  },\n  {\n    "title": "Wire parser into runner",\n    "verify": "npm test -- runner",\n    "action": "D1: wire the parser output into the runner per the locked format.",\n    "footprint": ["src/runner.mjs"]\n  }\n]\n\`\`\`\n\n## Outstanding questions\n\nNone.\n`;
  const result = planVerdictFromPlanMd(planMd);
  assert.equal(result.verdict, 'decompose');
  assert.equal(result.children.length, 2);
  assert.equal(typeof result.reason, 'string');
  assert.ok(result.reason.trim().length > 0, 'a non-empty reason is required -- buildDecomposeChildrenVerdict rejects a decompose verdict with none');
  assert.equal(result.children[0].title, 'Build parser');
  assert.equal(result.children[1].title, 'Wire parser into runner');
  // handed through verbatim -- not reshaped/re-derived
  assert.deepEqual(result.children[0], {
    title: 'Build parser',
    verify: 'npm test -- parser',
    action: 'D1: implement the parser per the locked format.',
    footprint: ['src/parser.mjs'],
    kind: 'task',
    risk: 'light',
  });
});

test('planVerdictFromPlanMd returns null when the "## Split" section carries a JSON block that fails to parse (malformed)', () => {
  const planMd = `## Split\n\nIntended two pieces but the block below is broken.\n\n\`\`\`json\n[\n  { "title": "Build parser", "verify": "npm test -- parser", }\n]\n\`\`\`\n`;
  assert.equal(planVerdictFromPlanMd(planMd), null);
});

test('planVerdictFromPlanMd returns null when the "## Split" section carries a JSON block that parses to a non-array (malformed shape)', () => {
  const planMd = `## Split\n\n\`\`\`json\n{ "title": "Build parser", "verify": "npm test -- parser", "action": "D1: x." }\n\`\`\`\n`;
  assert.equal(planVerdictFromPlanMd(planMd), null);
});

test('planVerdictFromPlanMd returns null for empty/non-string input', () => {
  assert.equal(planVerdictFromPlanMd(''), null);
  assert.equal(planVerdictFromPlanMd('   \n  '), null);
  assert.equal(planVerdictFromPlanMd(undefined), null);
  assert.equal(planVerdictFromPlanMd(null), null);
});

// --- tiny/small mode precedence (Cell P01.2's own explicit design ask) ---
//
// resolvePlan's OWN pre-existing tiny/small skip-and-advance path
// (src/intake/plan.mjs ~line 615) fires only when callerVerdict is falsy,
// and takes a DIFFERENT, narrower code path than an explicit pass-through
// verdict would (it bypasses the heavy-risk/blast-radius gates an explicit
// pass-through is still routed through). This function must return null
// for a tiny/small-mode plan whose "## Split" section explicitly declares
// no split, so that a caller threading this result into resolvePlan's
// callerVerdict parameter preserves that exact pre-existing behavior
// instead of silently rerouting a tiny/small item onto the heavier
// caller-verdict gate path. (A plan with no "## Split" section at all
// already returns null regardless of mode -- covered above -- so these
// fixtures deliberately include an explicit "## Split: none" section to
// exercise the precedence check itself, not the no-signal-at-all case.)

test('planVerdictFromPlanMd returns null for a plan declaring "Mode: tiny" with an explicit no-split section (defers to resolvePlan\'s own skip-and-advance, does not claim explicit pass-through)', () => {
  const planMd = `## Approach\n\n**Mode: tiny** — a single file, no gray areas.\n\n## Split decision: none\n\nOne honest piece.\n\n## Outstanding questions\n\nNone.\n`;
  assert.equal(planVerdictFromPlanMd(planMd), null);
});

test('planVerdictFromPlanMd returns null for a plan declaring "mode: small" with an explicit no-split section (case/format-insensitive, same regex resolvePlan itself uses)', () => {
  const planMd = `Some notes.\nmode: small\nMore notes.\n\n## Split\n\nNo split -- one honest piece.\n`;
  assert.equal(planVerdictFromPlanMd(planMd), null);
});

test('planVerdictFromPlanMd does not defer for "medium"/"high-risk" modes -- only tiny/small get the defer-to-resolvePlan treatment', () => {
  const planMd = `## Approach\n\n**Mode: high-risk** — several files, real gray areas.\n\n## Split decision: none\n\nOne honest piece despite the risk.\n\n## Outstanding questions\n\nNone.\n`;
  assert.deepEqual(planVerdictFromPlanMd(planMd), { verdict: 'pass-through' });
});

test('a "## Split" section with a real children block still wins over a tiny/small mode declaration elsewhere in the same plan.md', () => {
  // Not a realistic combination in practice (tiny/small is single-piece by
  // definition per fgos-coding-planning's own mode gate), but the function
  // is purely mechanical and must not silently drop a real split just
  // because an unrelated mode line also matched.
  const planMd = `## Approach\n\n**Mode: small** — stated once, ignored here since a real split follows.\n\n## Split\n\n\`\`\`json\n[{"title": "Piece one", "verify": "npm test", "action": "D1: x."}]\n\`\`\`\n`;
  const result = planVerdictFromPlanMd(planMd);
  assert.equal(result.verdict, 'decompose');
  assert.equal(result.children.length, 1);
});

// --- item-scoping across a shared docsRef (real corpus shape:
// docs/history/stage-status-driving-coordination/plan.md concatenates 5
// work items' own "# Plan: <title> (<id>)" sections in one physical file,
// each item resolved via the same docsRef and therefore the same
// plan.md content) ---

test('planVerdictFromPlanMd scopes to the current item\'s own "# Plan: ... (<id>)" section when plan.md documents multiple items sharing one docsRef, instead of returning whichever item\'s section is textually first', () => {
  const sharedPlanMd = [
    '# Plan: classify stale post-delivery (tsk-aaa)',
    '',
    '## No split',
    '',
    'One honest piece of work, proceeds as itself.',
    '',
    '---',
    '',
    '# Plan: herdr-launcher auto-launch (tsk-bbb)',
    '',
    '## Shape',
    '',
    '## Split',
    '',
    '```json',
    '[{"title": "Piece one", "verify": "npm test", "action": "D1: x."}, {"title": "Piece two", "verify": "npm test", "action": "D1: y."}]',
    '```',
    '',
  ].join('\n');

  assert.deepEqual(planVerdictFromPlanMd(sharedPlanMd, 'tsk-aaa'), { verdict: 'pass-through' });

  const bResult = planVerdictFromPlanMd(sharedPlanMd, 'tsk-bbb');
  assert.equal(bResult.verdict, 'decompose');
  assert.equal(bResult.children.length, 2);
});

test('planVerdictFromPlanMd returns null when plan.md documents multiple items sharing one docsRef and no itemId is supplied (cannot safely pick which item\'s section to read)', () => {
  const sharedPlanMd = [
    '# Plan: classify stale post-delivery (tsk-aaa)',
    '',
    '## No split',
    '',
    'One honest piece of work, proceeds as itself.',
    '',
    '---',
    '',
    '# Plan: herdr-launcher auto-launch (tsk-bbb)',
    '',
    '## Split',
    '',
    '```json',
    '[{"title": "Piece one", "verify": "npm test", "action": "D1: x."}]',
    '```',
    '',
  ].join('\n');

  assert.equal(planVerdictFromPlanMd(sharedPlanMd), null);
});

test('planVerdictFromPlanMd returns null when plan.md documents multiple items sharing one docsRef and the given itemId matches none of the "# Plan:" headings present', () => {
  const sharedPlanMd = [
    '# Plan: classify stale post-delivery (tsk-aaa)',
    '',
    '## No split',
    '',
    'One honest piece of work, proceeds as itself.',
    '',
    '---',
    '',
    '# Plan: herdr-launcher auto-launch (tsk-bbb)',
    '',
    '## Split',
    '',
    '```json',
    '[{"title": "Piece one", "verify": "npm test", "action": "D1: x."}]',
    '```',
    '',
  ].join('\n');

  assert.equal(planVerdictFromPlanMd(sharedPlanMd, 'tsk-does-not-exist'), null);
});

test('planVerdictFromPlanMd is unaffected by itemId (and by a single "# Plan:" heading) for the common single-item case -- existing single-item behavior is unchanged', () => {
  const planMd = `# Plan: some item (tsk-only-one)\n\n## Split decision: none\n\nOne honest piece.\n`;
  assert.deepEqual(planVerdictFromPlanMd(planMd, 'tsk-only-one'), { verdict: 'pass-through' });
  // itemId is irrelevant when there's 0 or 1 "# Plan:" heading -- same result
  // with a mismatched or absent itemId, matching pre-item-scoping behavior.
  assert.deepEqual(planVerdictFromPlanMd(planMd, 'tsk-unrelated'), { verdict: 'pass-through' });
  assert.deepEqual(planVerdictFromPlanMd(planMd), { verdict: 'pass-through' });
});

// --- heading-line-boundary containment (the token-skip group must never
// cross a newline into a different, following heading) ---

test('planVerdictFromPlanMd does not let an early short "##" heading bleed across its own line ending into a following "### Split ..." subheading (real corpus shape: docs/history/tsk-3bn-merge-conductor-harness-v2/plan.md\'s "## Approach" / "### Split resolved" pair, before its own real, further-down "## Split -- child items" section)', () => {
  const planMd = [
    '## Approach',
    '',
    '### Split resolved (deferred question, decided here)',
    '',
    'Some unrelated prose about ordering and risk that has nothing to do with',
    'this item\'s own split decision.',
    '',
    '### Order',
    '',
    'More unrelated prose.',
    '',
    '## Split -- child items',
    '',
    '```json',
    '[{"title": "Real piece", "verify": "npm test", "action": "D1: x."}]',
    '```',
    '',
  ].join('\n');

  const result = planVerdictFromPlanMd(planMd);
  assert.equal(result.verdict, 'decompose');
  assert.equal(result.children.length, 1);
  assert.equal(result.children[0].title, 'Real piece');
});

// --- prose-only Split sections (no ```json fence): only an explicit
// no-split polarity phrase may still yield pass-through; otherwise the
// section's own polarity is unreadable and must return null, never guess
// a wrong pass-through for what may be a real, prose-only decompose ---

test('planVerdictFromPlanMd returns null (not the wrong pass-through) for a "## Split" section documented entirely in prose with no JSON fence and no explicit no-split polarity phrase (real corpus shape: docs/history/tsk-3bn-merge-conductor-harness-v2/plan.md\'s own user-confirmed 4-child decompose, written as a numbered list with Title/Verify/deps/Footprint per child, closed with a "Filed:" line -- no fence anywhere)', () => {
  const planMd = [
    '## Split -- child items (reconciled with engine\'s judgeDecompose, D8)',
    '',
    'User chose merge both -- 4 children. Each carries `parent: tsk-3bn`.',
    '',
    '1. **drift-detection**',
    '   Title: `driftStatus(repoRoot, view) + fgos doctor wiring`',
    '   Verify: `node --test test/state/drift-status.test.mjs`',
    '   `deps: []`',
    '',
    '2. **sync-root action**',
    '   Title: `fgos sync-root <root-id>: merge a root branch\'s tip`',
    '   Verify: `node --test test/runner/merge.test.mjs`',
    '   `deps: [<drift-detection child id>]`',
    '',
    'Filed: `tsk-5m7` (drift-detection), `tsk-50i` (sync-root, deps: `tsk-5m7`).',
    '',
    '## Assumptions',
    '',
    'None.',
    '',
  ].join('\n');

  assert.equal(planVerdictFromPlanMd(planMd), null);
});

test('planVerdictFromPlanMd still returns pass-through for a prose-only "## Split" section that carries an explicit no-split polarity phrase ("proceeds as itself"), no JSON fence needed', () => {
  const planMd = `## Split\n\nNo further decomposition needed here; the item proceeds as itself, no children created.\n\n## Outstanding questions\n\nNone.\n`;
  assert.deepEqual(planVerdictFromPlanMd(planMd), { verdict: 'pass-through' });
});

test('planVerdictFromPlanMd returns pass-through for the real corpus Vietnamese no-split phrasing "Không chia" in a prose-only "## Split" section, no JSON fence needed', () => {
  const planMd = `## Split\n\nKhông chia -- 1 mảnh honest, không cần children thật.\n\n## Outstanding questions\n\nNone.\n`;
  assert.deepEqual(planVerdictFromPlanMd(planMd), { verdict: 'pass-through' });
});

// --- item-scoping across the second real docsRef-shared heading format
// (real corpus shape: docs/history/discover-stage-graph-and-skill-layering/
// plan.md concatenates 2 work items' own "# Plan: <id> — <title>" sections
// -- id immediately after "# Plan:", no trailing parens -- which the
// trailing-parenthesized-id-only pattern did not recognize at all, so this
// file's genuinely-2-item shape fell through to the unscoped single-item
// path and only avoided a wrong verdict because both items happened to
// share the same real decision) ---

test('planVerdictFromPlanMd scopes to the current item\'s own "# Plan: <id> — <title>" section (leading-id-before-em-dash heading format) when two items sharing one docsRef have genuinely diverging decisions, instead of leaking the textually-first item\'s verdict into the other', () => {
  const sharedPlanMd = [
    '# Plan: tsk-qod — first item',
    '',
    '## Decide the split',
    '',
    'No split. One coherent piece.',
    '',
    '# Plan: tsk-2yo — second item',
    '',
    '## Decide the split',
    '',
    'Splitting into two pieces:',
    '',
    '```json',
    '[{"title": "Piece one", "verify": "npm test", "action": "D1: x."}, {"title": "Piece two", "verify": "npm test", "action": "D1: y."}]',
    '```',
    '',
  ].join('\n');

  assert.deepEqual(planVerdictFromPlanMd(sharedPlanMd, 'tsk-qod'), { verdict: 'pass-through' });

  const secondResult = planVerdictFromPlanMd(sharedPlanMd, 'tsk-2yo');
  assert.equal(secondResult.verdict, 'decompose');
  assert.equal(secondResult.children.length, 2);
  assert.equal(secondResult.children[1].title, 'Piece two');
});
