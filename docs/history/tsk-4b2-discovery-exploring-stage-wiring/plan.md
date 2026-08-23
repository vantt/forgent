# Plan: wire `discovery`/`exploring` into the real flow

Item: `tsk-4b2`. Mode: **high-risk** (fgos-routing direct-entry fallback
applied — no lane was handed off from an Orient step this session). Flags
that applied: public contracts (changes stage-transition edges and skill
routing every future `clarify`-stage item depends on), existing covered
behavior (`test/state/workflow-stage-graphs.test.mjs`,
`test/intake/discovery.test.mjs`, `test/runner/loop.test.mjs` all exercise
paths this touches), weak proof around the area (impact-analysis posture
is `degraded` — GitNexus present but stale index). No hard-gate flag (auth/
data-loss/audit/external-provider/validation-removal) applies, but the
sheer blast radius — this changes what every item walks through after
`clarify` — earns `high-risk` over a raw `standard` flag count.

## Approach

Root cause and governing law are locked in `CONTEXT.md` (D1-D10) — this
plan only shapes the split and the proof for each piece, it does not
reopen either.

Per `CONTEXT.md` D2 (0030's fine-grained-decomposition law), and because
the changes fall into 3 footprints with **no real technical dependency
between them** (confirmed below), splitting into 3 independently-mergeable
pieces is the honest shape — a single monolithic item bundling a core
state-machine change, a background-sweep bugfix, and a docs-table typo fix
would itself be the coarse-unit anti-pattern `0030` exists to block.

`fgos graph --json` was run — `tsk-4b2` has no existing children yet, so
`criticalPath`/`topUnblock` carry no candidates to compare (expected: the
split is being decided in this same pass, not chosen among pre-existing
items). Ordering below is decided by real footprint/dependency analysis
instead.

Impact-analysis posture: **degraded** (`fgos tool query --capability
impact-analysis --status present`, checked this session — GitNexus
registered/`present`, index stale). `CONTEXT.md`'s own Scout evidence
section (file:line reads of every touched caller) is the substitute proof
for the one row below that would otherwise lean on GitNexus.

## Shape — 3 pieces, no forced ordering

**Piece 1 (this item, `tsk-4b2`, stays as itself) — the load-bearing
piece.** Without this, the other two pieces are meaningless: piece 2 fixes
a sweep that dispatches to a stage nothing can reach without this piece;
piece 3 fixes a table describing skills nothing routes to without this
piece. Per `CONTEXT.md` D3/D4/D6/D9:

- `src/intake/discovery.mjs`: retarget the clear-verdict handler from
  `stageForStep(...,'Divide')` to the literal stage `'discovery'` (D3);
  extend the existing `expectedStage` gate so the same verdict-driven
  mechanism also fires the `exploring -> decompose` edge when called with
  `expectedStage: 'exploring'` (D6) — reusing the module's own
  `resolveDiscovery` machinery rather than inventing a second engine
  path, since both edges are the same shape ("a verdict-driven forward
  move once a Socratic/research pass finishes").
- `.claude/skills/fgos-coding-driving/SKILL.md` (+ `.agents/` mirror,
  D10): add inline, native handling for stages `discovery` and
  `exploring` under a new `## Discovery and exploring stages` section —
  same shape as the existing `clarify`/`decompose` handling: invoke
  `fgos-researching`/`fgos-coding-exploring` in-session (Native-First rule 2,
  no spawn), apply the verdict directly (`clear` → `moveStage`;
  `unclear` → `fgos ask`, per D4).
- `.claude/skills/fgos-coding-exploring/SKILL.md` (+ `.agents/` mirror, D10):
  fix the stale "runs while `stage` is `clarify`" framing to `exploring`
  (D9); update its Gate's engine call from `fgos discover --verdict
  clear` to the exploring->decompose mechanism piece 1 adds above.

  Proof point (medium risk — this is the piece that changes real
  state-machine behavior): `test/intake/discovery.test.mjs` already
  covers `resolveDiscovery`'s existing branches — new tests added for
  the `discovery`-target and `expectedStage: 'exploring'` branches,
  same file, same pattern as the file's existing cases.

  Verify:
  ```
  npm test \
    && grep -q "to: 'discovery'" src/intake/discovery.mjs \
    && grep -q "expectedStage: 'exploring'" src/intake/discovery.mjs \
    && grep -q "## Discovery and exploring stages" .claude/skills/fgos-coding-driving/SKILL.md \
    && grep -q "## Discovery and exploring stages" .agents/skills/fgos-coding-driving/SKILL.md \
    && grep -q '`stage` is `exploring`' .claude/skills/fgos-coding-exploring/SKILL.md \
    && ! grep -q '`stage` is `clarify`' .claude/skills/fgos-coding-exploring/SKILL.md
  ```
  (corrected during Execute: the original grep patterns above dropped the
  backticks around `stage` itself, a genuine typo caught by running the
  verify for real before calling `fgos return` — never trust a written
  verify without running it once.)

**Piece 2 (child `tsk-4v6`) — headless sweep respects the real verdict
(`CONTEXT.md` D5).** `src/runner/loop.mjs`'s DISCOVERY DISPATCH sweep
(~1030-1108) currently advances `discovery -> exploring` on any real
commit, ignoring the worker's own `{clear, question}` verdict.

  **Revised during `fgos-coding-validating`'s reality gate for `tsk-4v6`
  (evidence, not the original guess above):** `src/intake/discovery.mjs`'s
  own header comment (:27, added by piece 1) names this item directly —
  *"`src/runner/loop.mjs`'s own direct `moveStage` call for `discovery ->
  exploring`... still exists unchanged here — reconciling it to call this
  same verb instead is tsk-4v6's own job, not this item's footprint."* The
  "same verb" is `resolveDiscovery(dir, id, cfg, role, callerVerdict)`
  (`src/intake/discovery.mjs:190`) — already the one function both
  `bin/fgos.mjs`'s `discover` CLI verb and piece 1's own driver-side
  `discovery` handling call, already implements both branches
  (`callerVerdict.clear` → `nextDiscoveryEdge` + `moveStage` with verify
  validation; `callerVerdict.clear === false` → park with the question),
  and already degrades to a safe no-op for `role: 'runner'` when no
  `callerVerdict` is supplied. This is the actual driver/launcher-parity
  mechanism (`CONTEXT.md` D2) — calling it directly, instead of
  hand-rolling a second `moveStage`/`fgos ask` pair in `loop.mjs`, is both
  smaller (Reality gate "Smaller path" row) and the literal instruction
  left in the code.

  The one piece genuinely missing — confirmed by reading
  `src/runner/prompt-templates/worker-prompt-discovery.txt` — is that the
  discovery-stage worker is never told to emit its verdict at all today;
  the template's own "How to finish" section says plainly *"there is
  nothing further to decide or report back."* `captureDiscoveredWork`'s
  `fgos-discovered` fence (:534-560) is a different channel for a
  different purpose (surfacing NEW work items the worker stumbled on, not
  this item's own completion verdict) and cannot be reused as-is; a
  sibling fence is needed. Fix, three files:

  - `src/runner/prompt-templates/worker-prompt-discovery.txt`: replace the
    "nothing further to... report back" line with an instruction to emit
    exactly one fenced block once research is done, mirroring
    `fgos-researching`'s own `{clear, verify?, question?}` contract
    (`.claude/skills/fgos-researching/SKILL.md` step 5):
    ```
    ```fgos-verdict
    {"clear": true, "verify": "<a real, runnable command>"}
    ```
    ```
    or
    ```
    ```fgos-verdict
    {"clear": false, "question": "<the one concrete gap>"}
    ```
    ```
  - `src/runner/loop.mjs`: add `parseVerdictBlock(output)`, a single-block
    sibling of `parseDiscoveredBlocks` (:534-560) — same fail-safe shape
    (malformed JSON/missing fence/wrong shape all yield `null`, never
    throw); last well-formed block wins if a worker emits more than one.
    Add `resolveDiscovery` to the existing `import { FALLBACK_VERIFY }
    from '../intake/discovery.mjs'` line (:88). Replace the sweep's direct
    `moveStage(dir, { id: item.id, to: 'exploring', expectedStage:
    'discovery', role: 'runner' })` call (:1105) with: parse the verdict
    from `worker.stdout` after the existing `facts.aheadCount === 0` no-op
    check; when parsed, call `resolveDiscovery(dir, item.id, config,
    'runner', callerVerdict)` and log its `outcome`; when absent/malformed,
    log and leave the item exactly as today's no-commit branch already
    does (stage `discovery`, status `todo`, for the next sweep to retry) —
    never silently treat a missing verdict as `clear`, the exact bug this
    item exists to fix.

  No file overlap with piece 1 (`loop.mjs` + its own test file +
  `worker-prompt-discovery.txt`, none touched by piece 1) — no
  `mergeAfter` dependency needed; can build/merge in either order relative
  to piece 1, though it is only meaningfully *testable end-to-end* once
  piece 1's stage is real (its own unit tests can still fabricate an item
  already at `stage: 'discovery'` and a captured `worker.stdout` string,
  without needing piece 1's edge to exist).

  Verify: `node --test test/runner/loop.test.mjs && npm test`

**Piece 3 (new child) — fix the `fgos-routing` table (`CONTEXT.md`
D8).** `.claude/skills/fgos-routing/SKILL.md:137-143`'s table currently
says `clarify` → `fgos-coding-exploring` (wrong; registry says
`fgos-clarifying`) and has no rows for `discovery`/`exploring` at all.
Fix the wrong line, add the two missing rows. Zero code dependency on
either other piece — this is a pure docs-table correction, true
regardless of whether piece 1 has landed (the WRONG line is wrong today
either way; the new rows describe stages that become real once piece 1
lands, but the table entry itself doesn't require piece 1's code to be
merged first to be written correctly).

  Verify:
  ```
  npm test \
    && grep -q "\`fgos-clarifying\`" .claude/skills/fgos-routing/SKILL.md \
    && grep -q "| \`discovery\` |" .claude/skills/fgos-routing/SKILL.md \
    && grep -q "| \`exploring\` |" .claude/skills/fgos-routing/SKILL.md \
    && ! grep -q "\`clarify\`.*\`fgos-coding-exploring\`" .claude/skills/fgos-routing/SKILL.md
  ```

## Cases sketched (high-risk depth)

- **Empty/boundary**: an item currently sitting at `stage: 'decompose'`
  or later (already past the old direct jump, e.g. this very item,
  `tsk-4b2`) is never affected — the retarget only changes the exit edge
  of a *future* clear verdict at `clarify`, never touches an item already
  past it.
- **Existing behavior that must not regress**: `resolveDiscovery`'s other
  branches (unclear verdict, trusted-CONTEXT.md path, runner no-op sweep
  per D16) are untouched — only the clear-verdict target and the new
  `expectedStage: 'exploring'` branch are added.
- **Concurrent access**: no new lock surface — `moveStage`/`fgos ask`
  reuse the existing CAS-guarded event-log write path unchanged.
- **Partial failure**: an item that reaches `discovery`/`exploring` and
  gets an `unclear` verdict parks via the existing `awaiting-human`
  mechanism (`fgos ask`) — same recovery path every other stage already
  uses, no new failure mode introduced.

## Outstanding questions

None
