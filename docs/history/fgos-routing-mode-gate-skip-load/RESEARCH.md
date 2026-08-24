# RESEARCH — fgos-routing-mode-gate-skip-load (tsk-2yog)

## Round 1 — 2026-08-23 (discovery stage)

**Asked:** Is tsk-2yog's claim ("Mode gate classifies items into a lane
but never skip-loads the heavy stage-skill chain for tiny/small items")
still true today? Does any existing mechanism already provide a
lane-conditional lighter path? Does any other open work item already
claim this exact fix?

**Checked:**

- `.agents/skills/fgos-routing/SKILL.md:36-73` (live Mode gate section,
  read directly) — text still literally says "This is knowing-before-load,
  not skip-load... every `planning`-shaping item still gets routed to
  `fgos-coding-planning` below regardless of lane... A genuine skip-load
  optimization... would need an actual routing-table change, which this
  decision does not make." Matches the item's quoted text verbatim.
- `src/state/workflow-stage-graphs.mjs:511-609` (`resolveWorkflow`,
  `skillForStage`, `bundleForStage`) — the only per-item workflow
  selection axis is `kind` (bug/chore/design/docs/feature/task via
  `domain.workflowFor[kind]`), never the Mode-gate lane
  (tiny/small/standard/high-risk/spike). No lane input reaches this
  selection at all.
- `src/state/workflow-stage-graphs.mjs:153-179` + `domains/coding/registry.yaml`
  + `domains/coding/workflows/` (only `feature.yaml` present on disk) —
  `coding` domain registers exactly one workflow (`feature`), one
  `skillMap`, applied uniformly regardless of lane. No lighter workflow
  variant exists anywhere in the repo.
- `test/state/workflow-multiplicity.test.mjs:1-6` (file header, read
  directly) — states outright: "Only `feature` is registered on coding
  today; these tests prove the mechanism runs for real... without
  asserting anything about a second workflow shape, which does not exist
  yet by design (D7a)." Independent confirmation from the test suite
  itself that no second (lighter) workflow shape exists.
- `docs/history/fgos-planning-mode-gate-and-gate-traceability/CONTEXT.md`
  (tsk-5ay, status `done`) — D1 locked moving the mode-gate *decision*
  from `fgos-coding-planning` into `fgos-routing` (triage-before-load);
  confirmed implemented and live. That same CONTEXT.md's "Outstanding
  questions deferred to planning" section explicitly scoped OUT "the rest
  of tsk-5ay's original ask" as a possible separate follow-up item —
  tsk-2yog is that follow-up for the skip-load half of the gap.
- `fgos list --all --json` scanned for title/description matches on
  skip-load/lighter-path/lane-routing terms across every work item
  (`node -e` filter, ad hoc) — hits: `tsk-5ay`/`tsk-da1`/`tsk-59a` (all
  `done`, the mode-gate-relocation lineage, not the skip-load fix itself);
  `tsk-5ym`/`tsk-9tu` (`todo`, both about dispatch cost-awareness for
  in-process vs out-of-process *execution*, an unrelated axis — not
  stage-skill lane routing). No open item claims this exact fix.

**Found:**

1. The bug is real and current as of 2026-08-23 — confirmed against live
   `fgos-routing/SKILL.md` text, not stale evidence.
2. No existing mechanism (lane-conditional workflow, lighter skillMap,
   anything) already covers this — `kind` and lane are two separate,
   never-crossed axes in the routing code.
3. No duplicate open work item claims this fix.
4. Direct precedent exists (`tsk-5ay`'s locked D1/D2) for exactly this
   area of the codebase, including an explicit note that this follow-up
   scope was deliberately deferred rather than folded in.
5. A real, runnable verify baseline exists to extend:
   `test/state/workflow-multiplicity.test.mjs` +
   `test/state/workflow-stage-graphs.test.mjs` already test
   `resolveWorkflow`/`skillForStage`/`bundleForStage` for the current
   single-workflow shape; a fix would add a second (lane-conditional)
   workflow and extend these same files' assertions.

**What's still open:** none — the fix's own concrete shape (which
stages fold together for tiny/small, how lane provenance stays recorded)
is a planning-stage design decision, not a discovery-stage gap; the
item's own "Fix direction (not locked)" text already frames it that way.

**Verdict:** `clear`. Verify:
`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`
(repo's own `npm test`, per `AGENTS.md`'s DoD question 5) — real and
runnable today, and the fix's own new/extended tests land inside this
same suite.
