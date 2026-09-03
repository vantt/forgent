// plan-verdict-from-plan-md.mjs — pure plan-verdict derivation from
// plan.md's own raw text (Cell P01.2, R3/G5,
// plans/260831-1637-step07-inline-assignment-mvp/
// phase-01-execute-assignment-hardening-and-plan-verdict-derivation.md).
//
// New file rather than an addition to `src/intake/plan.mjs` (55K already —
// the phase file's own stated preference): `plan.mjs` owns `resolvePlan`'s
// stateful engine; this module owns exactly one pure function with zero
// side effects (no fs, no store writes), so it can be unit-tested against
// bare strings with no store/worktree rig at all.
//
// SHAPE CONTRACT: the object this returns is fed directly into
// `resolvePlan`'s `callerVerdict` (5th) parameter
// (`resolveCallerPlanVerdict`, `src/intake/plan.mjs:244`, dispatches on
// `raw.verdict`/`raw.children`/`raw.reason`) — every field name here must
// match that dispatch exactly, or a real verdict silently degrades to
// `resolveCallerPlanVerdict`'s `{ kind: 'invalid' }` catch-all.
//
// CHILD-SPEC SHAPE: `children` is handed through PLAIN, unvalidated and
// unreshaped — `resolveCallerPlanVerdict` -> `buildDecomposeChildrenVerdict`
// -> `normalizeChild` already owns every real validation a child spec must
// pass (non-empty `verify`, an `action` citing a real locked decision id,
// ...). Re-validating shape here would duplicate that gate under a
// different name; this module's only job is "did plan.md declare a split,
// and if so, what array did it write" — see
// `domains/coding/skills/fgos-coding-validating/references/
// gate-auto-approve-mechanics.md` ("hand that same JSON block through
// verbatim, never a re-derived or re-worded version of it") and
// `domains/coding/skills/fgos-coding-planning/references/
// split-and-child-specs.md` for the child-spec shape itself:
// `{title, verify, action, kind?, risk?, refs?, footprint?, deps?}`.

// Same regex `resolvePlan`'s own tiny/small skip-and-advance trust signal
// matches (`src/intake/plan.mjs` ~line 479/615) — this module's tiny/small
// handling is deliberately about MATCHING that existing heuristic, not
// inventing a new one (see the design note on TINY/SMALL PRECEDENCE below).
const TINY_SMALL_MODE_PATTERN = /\bmode\s*[:=]\s*\*{0,2}(tiny|small)\b/i;

// Real plan.md files (docs/history/*/plan.md) place the split's child-spec
// JSON array under a level-2 heading that mentions "split" near the
// heading's start, not only as its literal first word — e.g. "## Split",
// "## Split decision: none", "## No split", "## Decide the split",
// "## Shape: no split", "## Step 4 — Split", "## Quyết định split". An
// earlier version of this pattern matched "split" ANYWHERE in a level-2
// heading's full text, which also matched unrelated headings that merely
// discuss a split decision in prose without being the canonical
// split-decision section itself — concretely,
// `docs/history/herdr-cockpit-pane-guard-reuse-and-boot-window/plan.md`'s
// `## Reality-gate finding (fgos-coding-validating, round 1) — split, don't
// guess defect 3` heading, which produced a WRONG `pass-through` verdict for
// a plan.md that actually decided to split (no canonical "## Split" heading
// exists in that file at all). Requiring "split" within the heading's first
// few tokens (not the full heading text) fixes that: re-run directly against
// a `grep -h '^## .*[Ss]plit' docs/history/*/plan.md | sort -u` corpus survey
// (34 distinct live phrasings) confirms this still matches every canonical
// short-form split-decision heading found there ("## Split", "## No split",
// "## Decide the split", "## Shape: no split", "## Step 4 — Split",
// "## Quyết định split", "## Không split", "## Shape / split", "## Shape —
// split into N pieces/children", and other "Split"/"Split decision"-led
// variants) while excluding the "Reality-gate finding" false positive and a
// handful of other real headings that only mention split/no-split deep
// inside prose about a DIFFERENT section (e.g. "## Proof surface (per-piece
// verify, no split so this is the item's own)", "## Verify (root item,
// pass-through — no split)") — those now fall through to this module's own
// pre-existing "no canonical Split section found" -> `null` fail-safe branch
// instead of risking the same wrong-section-extracted misfire. This is a
// precision/recall trade-off resolved toward precision on purpose, matching
// the module's own fail-toward-null design (see NO-SPLIT-SECTION below):
// under-matching a genuine split heading degrades to the pre-existing safe
// `null` no-op; over-matching an unrelated heading risks extracting the
// wrong section and returning an actively wrong queue-mutating verdict,
// which is the strictly worse failure mode.
// The token-skip group must only consume whitespace WITHIN the heading's own
// line ([ \t]+), never a newline (\s+ would). A bare `\s+` here let the
// "first ~3 tokens" bound bleed past the heading's own line ending into the
// FIRST WORD of a completely different, following line -- concretely, an
// early, unrelated "## Approach" heading (1 token) followed by a blank line
// and then "### Split resolved (...)" let the old pattern's match run
// "## Approach\n\n### Split", picking up "###"/"Split" as its 2nd/3rd
// tokens and treating that as the canonical Split heading
// (`docs/history/tsk-3bn-merge-conductor-harness-v2/plan.md`'s real
// "## Approach" / "### Split resolved" pair before its own real,
// further-down "## Split — child items" section). Restricting the skip
// group to same-line whitespace only means "first 3 tokens" always means
// "first 3 tokens of THIS heading's own line" -- it can never match into a
// subsequent line's content, canonical heading or not.
const SPLIT_HEADING_PATTERN = /^##[ \t]+(?:\S+[ \t]+){0,3}\bsplit\b/im;
const NEXT_HEADING_PATTERN = /^##[ \t]+\S/m;
const JSON_FENCE_PATTERN = /```json\r?\n([\s\S]*?)```/i;

// A canonical Split section with no ```json fence is not automatically an
// affirmative "Step 4 decided no split": real plan.md corpus content
// written before/without the JSON-fence convention documents a genuine
// SPLIT decision entirely in prose, with no fence at all
// (`docs/history/tsk-3bn-merge-conductor-harness-v2/plan.md`'s own
// "## Split — child items" section: a real, user-confirmed 4-child
// decompose, numbered list, no fence). Defaulting silently to pass-through
// whenever no fence is present would hand that item the OPPOSITE of its
// real decision. This module cannot recover a prose-only child-spec array
// (that is a human/skill read, not a mechanical one), but it can look for
// an explicit NO-split polarity phrase before ever concluding
// pass-through — modeled on the phrasing actually used across
// `docs/history/*/plan.md`'s own real no-fence Split sections ("No split",
// "Không chia" (Vietnamese "no split"), "Split decision: none", "proceeds
// as itself", "a split would not help", "single piece", "not split into
// children/pieces"). Deliberately excludes a bare "one piece"/"one honest
// piece" phrase: the same corpus also uses that exact wording INSIDE a
// negated, split-affirming sentence ("`tsk-63j` is too wide to build as
// one honest piece ... Splitting into 4 children...",
// `docs/history/canonical-path-resolver/plan.md`), so matching it alone
// would misread a real decompose as pass-through.
const NO_SPLIT_POLARITY_PATTERN =
  /\bno[ \t]+split\b|\bkhông[ \t]+chia\b|\bdecision:[ \t]*none\b|\bproceeds[ \t]+as[ \t]+itself\b|\bwould[ \t]+not[ \t]+help\b|\bsingle[- \t]+piece\b|\bnot[ \t]+split[ \t]+into\b/i;

// Real docsRef-sharing convention: some directories' plan.md concatenates
// MULTIPLE work items' own `# Plan:` level-1 sections into one physical
// file -- and this repo's real corpus uses TWO different heading shapes for
// that, both confirmed by directly reading the named files, not assumed:
// - trailing-parenthesized id: `# Plan: <title> (<item-id>)`
//   (`docs/history/stage-status-driving-coordination/plan.md`: 5 items, 5
//   such headings, confirmed via `grep -n '^# Plan' ...` -- a deliberate,
//   named convention per that file's own CONTEXT.md, not an accident).
// - leading id before an em-dash: `# Plan: <item-id> — <title>`
//   (`docs/history/discover-stage-graph-and-skill-layering/plan.md`: 2
//   items, `tsk-qod` at line 1 and `tsk-2yo` at line 371 -- the id sits
//   immediately after `# Plan:`, no parens at all, so the trailing-paren-
//   only pattern above matched 0 headings in this file and silently fell
//   through `scopeToItemSection`'s "0 or 1 heading" single-item path even
//   though the file genuinely documents 2 items).
// Deriving a verdict from the RAW, unscoped file text in either shape risks
// handing one item's own Split section to a completely different item that
// merely shares the same `docsRef` directory. Both id captures are
// constrained to `work.mjs`'s own real work-item id shape
// (`ID_PATTERN`, `src/state/work.mjs:24`:
// `/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/`) rather than "any parenthesized/dash-
// adjacent text," so the match can't mistake an unrelated parenthetical or
// title fragment for an id.
const PLAN_ITEM_HEADING_PATTERN =
  /^# Plan:[ \t]+(?:([a-z][a-z0-9]*(?:-[a-z0-9]+)*)[ \t]*—|.*\(([a-z][a-z0-9]*(?:-[a-z0-9]+)*)\)[ \t]*$)/gim;

/**
 * Slices `planContent` down to just one item's own `# Plan:` section (either
 * `# Plan: <title> (<id>)` or `# Plan: <id> — <title>`, both real corpus
 * shapes -- see `PLAN_ITEM_HEADING_PATTERN`'s own comment) when the content
 * documents 2+ such items concatenated together.
 *
 * - 0 or 1 `# Plan:` heading (either shape) found -> `planContent` is
 *   returned UNCHANGED (the common case: every existing fixture and the
 *   majority of real plan.md files are single-item).
 * - 2+ headings found and `itemId` names one of them -> sliced to exactly
 *   that heading's own section (from its own heading to the next `# Plan:`
 *   heading, or end-of-document).
 * - 2+ headings found and `itemId` is missing, or does not match any
 *   heading in this content -> `null`. This function has no safe way to
 *   guess which item's section the caller wants; per this module's own
 *   fail-toward-null discipline, "cannot determine scope" is not the same
 *   as "no split", and must never silently fall back to reading whichever
 *   item's section happens to be textually first.
 *
 * @param {string} planContent
 * @param {string|undefined} itemId
 * @returns {string|null}
 */
function scopeToItemSection(planContent, itemId) {
  const headings = [...planContent.matchAll(PLAN_ITEM_HEADING_PATTERN)].map((match) => ({
    index: match.index,
    // group 1 = leading-id-before-em-dash form (`# Plan: <id> — <title>`);
    // group 2 = trailing-parenthesized-id form (`# Plan: <title> (<id>)`).
    // Exactly one of the two alternatives fires per match, so exactly one
    // group is populated -- never both, never neither.
    id: (match[1] ?? match[2]).trim(),
  }));
  if (headings.length < 2) return planContent;
  const trimmedItemId = typeof itemId === 'string' ? itemId.trim() : '';
  if (!trimmedItemId) return null;
  const targetPos = headings.findIndex((heading) => heading.id === trimmedItemId);
  if (targetPos === -1) return null;
  const sectionEnd = targetPos + 1 < headings.length ? headings[targetPos + 1].index : planContent.length;
  return planContent.slice(headings[targetPos].index, sectionEnd);
}

function extractSplitSection(planContent) {
  const headingMatch = SPLIT_HEADING_PATTERN.exec(planContent);
  if (!headingMatch) return null;
  const sectionStart = headingMatch.index + headingMatch[0].length;
  const rest = planContent.slice(sectionStart);
  const nextHeadingMatch = NEXT_HEADING_PATTERN.exec(rest);
  return nextHeadingMatch ? rest.slice(0, nextHeadingMatch.index) : rest;
}

/**
 * Derives a `resolvePlan`-ready verdict purely from plan.md's own raw text
 * — no fs, no store, no side effects.
 *
 * - A "## Split" section carrying a ```json fenced array -> the split was
 *   decided: `{ verdict: 'decompose', children }` (children handed through
 *   exactly as plan.md wrote them).
 * - A "## Split" section whose ```json block fails to parse, or parses to
 *   something other than an array -> the split intent is unreadable, never
 *   silently treated as "no split was intended": `null`.
 * - A "## Split" section present, no JSON block, but an explicit no-split
 *   polarity phrase is found (e.g. "## Split decision: none", "## No
 *   split") -> Step 4 was reached and genuinely decided one piece ->
 *   `{ verdict: 'pass-through' }`, UNLESS plan.md also declares tiny/small
 *   mode (see TINY/SMALL PRECEDENCE below) -> `null`.
 * - A "## Split" section present, no JSON block, and NO explicit no-split
 *   polarity phrase either -> the section's own polarity is unreadable
 *   from this text (it may be a real, pre-JSON-fence-convention decompose
 *   write-up in prose) -> `null`. Recovering a prose-only child-spec array
 *   is out of scope for this mechanical module; the goal here is only to
 *   never emit the WRONG pass-through, landing on the safe `null` is
 *   sufficient.
 * - No "## Split" section at all -> Step 4's outcome is simply unknown from
 *   this text (the plan may predate the convention, or may not have
 *   reached Step 4 yet) -> `null`, same fail-safe stance `resolvePlan`'s own
 *   `role === 'runner'` fallback already takes: never guess a real
 *   queue-mutating verdict from silence.
 * - `planContent` documents 2+ work items' own `# Plan:` sections (either
 *   `# Plan: <title> (<id>)` or `# Plan: <id> — <title>`) concatenated
 *   together (a real, live `docsRef`-sharing convention) and `itemId` is
 *   missing or matches none of them -> `null`: this function has no safe
 *   way to guess which item's own section to read (see
 *   `scopeToItemSection`).
 * - Empty/non-string input -> `null` (nothing to derive from).
 *
 * TINY/SMALL PRECEDENCE (Cell P01.2 design decision, current-cell.md's own
 * explicit ask): `resolvePlan` already has ITS OWN tiny/small
 * skip-and-advance path (`src/intake/plan.mjs` ~line 615) that fires only
 * when no `callerVerdict` is supplied at all — and that path is NOT
 * equivalent to an explicit pass-through verdict: it runs BEFORE, and
 * therefore bypasses, the heavy-risk/blast-radius gates an explicit
 * `{ kind: 'pass-through' }` verdict is still routed through further down
 * `resolvePlan` (confirmed by reading both branches, `plan.mjs` ~596-635 vs
 * ~735-760). Returning an explicit `{ verdict: 'pass-through' }` here for a
 * tiny/small plan would silently swap resolvePlan onto the caller-verdict
 * branch and its heavier gate checks for every tiny/small item swept
 * through the Assignment/runner path (R4) — a real behavior change this
 * module must not introduce for items that were already skip-advancing
 * safely before R4 existed. Returning `null` instead keeps `callerVerdict`
 * falsy, so `resolvePlan` takes the exact same branch, with the exact same
 * decision-log text and gate-bypass behavior, it always has for a
 * tiny/small item with no caller verdict.
 *
 * NO-SPLIT-SECTION -> null, NOT an eager pass-through (Cell P01.2 finding,
 * verified empirically against the existing suite): plan.md's own Step 4
 * convention is to say the no-split decision PLAINLY when it applies
 * (`fgos-coding-planning/references/split-and-child-specs.md`: "If one
 * piece is honestly enough, ... Say so plainly in plan.md"). Treating mere
 * ABSENCE of any split discussion as an affirmative "this is one piece"
 * verdict is not that same plain statement — it is a guess, and a wrong
 * guess here is a real queue mutation (`resolvePlan` moving the item to
 * `executing`), not a no-op. It also collided with the existing
 * `test/runner/loop.test.mjs` Cell 6.1/6.2 fixtures, whose plan.md content
 * (a reality-gate/feasibility-matrix note with no Split section) is
 * deliberately silent on the split question so those tests can exercise
 * repeated re-dispatch/staleness rejection against an item that stays at
 * stage `planning` across passes — an eager pass-through there would move
 * the item to `executing` after the FIRST pass and break that setup, a
 * real regression confirmed by running the suite. A plan.md that actually
 * reaches Step 4 and writes its "## Split" section (with or without a
 * JSON block) is unambiguous either way; one that never mentions Split at
 * all is not, and `resolvePlan`'s own `'runner'` no-op fallback is exactly
 * the safe default for "not enough signal to act" the codebase already
 * established for this same fork (see `plan.mjs`'s own comment on that
 * fallback).
 *
 * @param {string} planContent - plan.md's raw text content
 * @param {string} [itemId] - the work item this verdict is being derived
 *   for. Only load-bearing when `planContent` documents 2+ work items' own
 *   `# Plan:` sections (either heading shape, see
 *   `PLAN_ITEM_HEADING_PATTERN`) concatenated in one file (a real,
 *   `docsRef`-sharing convention); ignored otherwise.
 * @returns {{verdict: 'pass-through'} | {verdict: 'decompose', children: unknown[], reason: string} | null}
 */
export function planVerdictFromPlanMd(planContent, itemId) {
  if (typeof planContent !== 'string' || !planContent.trim()) return null;

  const scopedContent = scopeToItemSection(planContent, itemId);
  if (scopedContent === null) return null; // 2+ items in this content, no safe way to pick one

  const splitSection = extractSplitSection(scopedContent);
  if (splitSection === null) return null; // Step 4 outcome unknown from this text -- never guess

  const fenceMatch = JSON_FENCE_PATTERN.exec(splitSection);
  if (fenceMatch) {
    let parsed;
    try {
      parsed = JSON.parse(fenceMatch[1]);
    } catch {
      return null; // malformed: block present but not valid JSON
    }
    if (!Array.isArray(parsed)) return null; // malformed: not the children-array shape
    // `reason` is required, not actually optional, for a non-empty children
    // array (`buildDecomposeChildrenVerdict`, plan.mjs: "a decompose verdict
    // with no real top-level reason ... is invalid"). This module has no
    // judgment to explain WHY plan.md called for a split -- it states the
    // one fact it mechanically knows instead of fabricating a rationale.
    const reason = `plan.md's own "## Split" section declares a split into ${parsed.length} piece(s).`;
    return { verdict: 'decompose', children: parsed, reason };
  }

  // "## Split" section present but no JSON block in it -- only treat this
  // as an affirmative "Step 4 explicitly decided no split" when the section
  // itself carries a real no-split polarity phrase; otherwise the section's
  // intent is unreadable from this text (see NO_SPLIT_POLARITY_PATTERN's
  // own comment) and must not be guessed.
  if (!NO_SPLIT_POLARITY_PATTERN.test(splitSection)) return null;
  if (TINY_SMALL_MODE_PATTERN.test(scopedContent)) return null;
  return { verdict: 'pass-through' };
}
