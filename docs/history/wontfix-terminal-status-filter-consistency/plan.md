# wontfix terminal-status filter consistency — plan

Item: tsk-37u · Decisions: `docs/history/wontfix-terminal-status-filter-consistency/CONTEXT.md` (D1/D2/D3)

## Mode

Flags counted (of the 10 standard flags):
- **public contracts** — yes: `frontier()`'s `depsReady` output, `rankImpact`'s
  `blocks`/`blockedBy`/openIds shape, and `fgos list`/`fgos triage`'s
  default-view membership all change observable output.
- **existing covered behavior** — yes: `tsk-5oa`'s own verify command
  asserts "no `status === 'done'` item in default `fgos list`" — D2
  extends that contract to `wontfix` too, so that assertion (or its
  replacement) must be updated deliberately, not just left to fail.
- (auth/authorization/data-model/audit-security/external-systems/
  cross-platform/weak-proof/multi-domain: no — this is a single-domain
  state-derivation fix, no schema change, no external system, area is
  already well-covered by tests)

That's 2 counted flags (→ would be `standard` alone), but one hard-gate
flag also applies: **removing a validation** — `frontier.mjs:89`'s
`depsReady` and `claim-port.mjs:152`'s `unmergedDeps` are both safety
gates today (per their own doc comments: "a dep sitting at any non-done
status does NOT unblock", "done guarantees content merged"). D1 loosens
both to also accept `wontfix`. A hard-gate flag forces **high-risk**
regardless of the 2-flag count — this is not a story-sized change of
convenience, it changes what the runtime engine considers "safe to
claim."

## Approach

**Chosen path:** implement D1/D2/D3 as one item (no split — see below),
in three phases matching the three locked decisions, each phase ending in
its own commit and its own test run, so a partial stop still leaves the
tree in a state where 1–2 of the three decisions are fully done and
verified, never a half-edited file.

**Alternatives rejected:**
- *Split into 3 child items (one per D-ID).* Rejected: `fgos graph
  --what-if tsk-37u --json` shows `unblocksTransitive: 0` — nothing else
  in the backlog depends on this item finishing, so there is no
  scheduling/parallelism benefit to splitting, only coordination overhead
  (3 branches, 3 merges, 3 review passes) for work that shares one root
  cause and one CONTEXT.md. `fgos graph --json`'s `topUnblock` also does
  not surface tsk-37u or any of its pieces as high-leverage picks, further
  confirming no urgency to reorder or parallelize.
- *Fix D2 without D1 (reporting-only, leave gating as-is).* This was the
  original framing before `fgos-coding-exploring`'s scout — rejected in
  CONTEXT.md itself: doing only D2 would make triage/list show an item as
  unblocked while `frontier.mjs` still refuses to actually let it be
  claimed, a worse (silently misleading) state than today's status quo.
- *One shared `RESOLVED_STATUSES` import from day one vs. per-file local
  consts.* Chosen: export `frontier.mjs`'s existing `RESOLVED_STATUSES =
  new Set(['done', 'wontfix'])` (frontier.mjs:138) and import it from
  every other touched file, rather than re-declaring the same two-element
  set six times (DRY; also means a future third terminal status only
  needs one edit). Rejected a new shared module (e.g.
  `src/state/terminal-status.mjs`) as unnecessary ceremony for a
  two-element, rarely-changing set — `frontier.mjs` is already the
  module that documents and owns this concept.

**Risk map:**

| Component | Risk | Proof point for `fgos-coding-validating` |
|---|---|---|
| `frontier.mjs:89` `depsReady` | high — changes real claim eligibility | new test: a dep at `wontfix` unblocks its dependent (no existing test currently covers a dep's own status against readiness with `wontfix`, confirmed by reading `test/state/frontier.test.mjs`'s existing coverage — only the *item's own* status-not-todo exclusion and the *lineage* wontfix case are tested today, not a *dep's* wontfix status) |
| `claim-port.mjs:152` `unmergedDeps` | medium — changes leaf-fork eligibility | `test/runner/claim-port.test.mjs`: a leaf whose dep is `wontfix` (not `done`) is allowed to fork, no `deps-not-merged` throw |
| `impact.mjs:78,133` `openIds`/`includeDone` | medium — changes `triage` ranking and done-tail shape | `test/state/impact.test.mjs`: a `wontfix` item drops out of default `rankImpact` output and out of `blocks`/`blockedBy` counting; appears in the `includeDone` tail same as a `done` item |
| `bin/fgos.mjs:~1105` `list` default filter | medium — changes `fgos list` default membership, and needs `command-registry.mjs:285,289`'s docstrings updated to match | `test/cli/fgos.test.mjs`: default `list` excludes a `wontfix` item; `--all` still includes it |
| `graph-metrics.mjs:296,356,376,397,402` | low-medium — five call sites, same one-line pattern each | `test/state/graph-metrics.test.mjs`: `staleBlocked` never names a `wontfix` id as a `blockedBy` entry; `greedyTopUnblock`/`goalScopedGreedyTopUnblock`/`whatIf` all treat a `wontfix` item as resolved |
| `entropy.mjs:86` `countStageClarify` | low — single-signal, additive filter | `test/report/entropy.test.mjs`: a `wontfix` item still at `stage: 'clarify'` does not contribute to the `stage-clarify` count |

**Files touched (implementation):**
1. `src/state/frontier.mjs` — export `RESOLVED_STATUSES`; use it in `depsReady` (line 89) alongside its existing use in `hasOpenDescendant`.
2. `src/runner/claim-port.mjs` — import `RESOLVED_STATUSES`; use it in `unmergedDeps` (line 152).
3. `src/state/impact.mjs` — import `RESOLVED_STATUSES`; use it for `openIds` (line 78) and the `includeDone` done-tail filter (line 133).
4. `bin/fgos.mjs` — import `RESOLVED_STATUSES`; use it in `list`'s default-view filter (~line 1105).
5. `src/cli/command-registry.mjs` — update the two docstrings (lines 285, 289) to say "open-only (status not `done`/`wontfix`)" instead of "(status !== 'done')", matching the corrected behavior.
6. `src/state/graph-metrics.mjs` — import `RESOLVED_STATUSES`; use it at all five sites (296, 356, 376, 397, 402) in place of the local `!== 'done'` / `=== 'done'` checks.
7. `src/report/entropy.mjs` — add a status guard to `countStageClarify` using `RESOLVED_STATUSES` (or `frontier.mjs`'s import), excluding `done`/`wontfix` items.
8. Tests: `test/state/frontier.test.mjs`, `test/runner/claim-port.test.mjs`, `test/state/impact.test.mjs`, `test/cli/fgos.test.mjs` (including `tsk-5oa`'s original assertion, extended to also check `wontfix`), `test/state/graph-metrics.test.mjs`, `test/report/entropy.test.mjs`.

**Order** (per the risk map, highest-risk/most-foundational first, matching the phase split below): D1's two runtime-gating sites first (they are the ones a hard-gate flag was raised over, and the ones CONTEXT.md's D2 rationale depends on being true), then D2's five reporting sites, then D3's single entropy site.

**Excluded from this item's scope, found while reading `bin/fgos.mjs` during planning (not one of CONTEXT.md's locked decisions, not reopening anything):**
`bin/fgos.mjs:568` `collectRollupData`'s `doneCount` (`children.filter((w) => w.status === 'done').length`, the `fgos rollup` progress view) deliberately counts only true `done` children — same "prove it was actually built" pattern CONTEXT.md already excludes for `store.mjs`'s compound-learn/acceptance gates. A `wontfix` child is not progress toward the parent being built; folding it into `doneCount` would inflate a rollup's apparent completion. Left unchanged.

## Shape (high-risk — phased)

**Phase 1 — D1, runtime gating (frontier.mjs, claim-port.mjs).**
Export `RESOLVED_STATUSES` from `frontier.mjs`; switch `depsReady` to use
it. Import it in `claim-port.mjs`; switch `unmergedDeps` to use it. Add
tests for both (a `wontfix` dep unblocks/allows-fork). Cases to prove:
dep exactly `wontfix` (satisfies), dep `done` (still satisfies, no
regression), dep `blocked`/`doing`/`awaiting-approval`/`awaiting-human`
(still does NOT satisfy — the only two doors that open are `done` and
`wontfix`), a dep id that doesn't exist in `work` at all (still does NOT
satisfy — `RESOLVED_STATUSES.has(undefined)` is `false`, same as today).
Run `npm test` scoped to `test/state/frontier.test.mjs` and
`test/runner/claim-port.test.mjs`. Commit.

**Phase 2 — D2, reporting/advisory (impact.mjs, bin/fgos.mjs's `list`,
command-registry.mjs docstrings, graph-metrics.mjs).**
Import `RESOLVED_STATUSES` in each; replace the five
`graph-metrics.mjs` sites and the two `impact.mjs` sites and the one
`bin/fgos.mjs` site. Update `command-registry.mjs`'s two docstrings.
Cases to prove: default `fgos list`/`fgos triage` exclude a `wontfix`
item (extending `tsk-5oa`'s original "no `done` item" assertion to also
assert "no `wontfix` item"); `--all` still includes it in the done-tail;
`staleBlocked` never lists a `wontfix` id as a blocker;
`greedyTopUnblock`/`goalScopedGreedyTopUnblock`/`whatIf` all stop
counting a `wontfix` item as not-done. Run `npm test` scoped to
`test/state/impact.test.mjs`, `test/cli/fgos.test.mjs`,
`test/state/graph-metrics.test.mjs`. Commit.

**Phase 3 — D3, entropy (entropy.mjs).**
Add the status guard to `countStageClarify`. Case to prove: a `wontfix`
item still carrying `stage: 'clarify'` (the case that motivated D3 —
closed before ever being explored) no longer contributes to the
`stage-clarify` count; a `todo`/`doing`/`blocked`/`awaiting-human` item at
`stage: 'clarify'` still does. Run `npm test` scoped to
`test/report/entropy.test.mjs`. Commit.

**After all three phases:** full `npm test` (whole suite, per this repo's
definition of done — state + cli + runner + e2e), then
`detect_changes({scope: "compare", base_ref: "main"})` (per this repo's
GitNexus contract) to confirm the affected-symbol set matches exactly
this plan's file list before handing to `fgos-coding-validating`.

## Split decision

No split. One item, three phases (above), each independently committed
and tested. Rationale: `fgos graph --what-if tsk-37u --json` shows
`unblocksTransitive: 0` (nothing else waits on this), so there is no
scheduling upside to separate items — only the coordination cost of three
branches/merges/reviews for one root cause already fully decided in a
single `CONTEXT.md`.
