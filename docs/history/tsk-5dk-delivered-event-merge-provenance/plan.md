# Plan — tsk-5dk (delivered-event merge provenance)

Mode: **high-risk**

Flags counted per `fgos-routing`'s Mode gate: data model (new event payload
fields), audit/security (this IS an audit-evidence feature; also adds a
new refusal/enforcement path), external systems (GitHub `gh` CLI, D2),
public contracts (event schema documented in `docs/specs/work-state.md`'s
Data Dictionary; `move`/`approve` CLI behavior), existing covered behavior
(the item's own acceptance clause requires the pre-existing
delivered-not-on-trunk check, `test/state/drift-status.test.mjs`, to keep
passing unchanged). That is 5 flags, and `audit/security` alone is also a
named hard-gate flag — high-risk either way. Matches the item's own
declared `tier: heavy` / `risk: heavy`.

Impact-analysis posture: `full` (GitNexus present, checked fresh at
`exploring` — see `CONTEXT.md`). Every symbol edited below gets a real
`impact({target, direction:"upstream"})` call immediately before editing,
per `CLAUDE.md`'s MUST rule, with the blast radius reported before the
edit lands.

Iron Law: this item touches `src/state/store.mjs` and `bin/fgos.mjs`
(the item's own note, confirmed by scout) — a failing test must be
written and shown red BEFORE the implementing change, not backfilled
after. Phase 1 and Phase 4 below are ordered so their own red test lands
first.

## Split decision

No split. One honest piece of work: two additive fields threaded through
a small, already-mapped set of call sites, plus one new refusal check in
an already-generic verb. Splitting into separate items would fragment a
single coherent data-model change (the fields and the refusal check are
both read/write halves of the same "delivered means verifiable" contract)
across items with real interdependency (the refusal check's own tests
want the new fields to exist to assert on) — not independently workable
in the sense `fgos-coding-planning`'s split step means.

## Approach

Chosen path: extend `moveWork`'s existing additive-provenance pattern
(exactly how `headAtTake`/`branchHeadAtTake` already work) rather than a
new event type or a side-table — cited in `CONTEXT.md`'s scout evidence,
this is the established shape for "extra fact about a transition, ignored
by the FSM, present only when the caller supplies it." Rejected
alternative: a separate `work.merge-evidence` event — rejected because it
would require a second read/fold path in `replay.mjs` for something that
is properly a property of the SAME transition already being recorded, and
because RUL-style single-write-door discipline (`CTR001`, referenced
throughout this repo's skills) prefers one door per state change over two
events for one fact.

### Risk map

| Component | Risk | Proof point (validated at `fgos-coding-validating` / proven at Execute) |
|---|---|---|
| `moveWork` new optional params (`store.mjs:487`) | Low — pure additive extension of a proven pattern | `test/state/store.test.mjs`: a `moveWork` call with `mergedSha`/`mergedInto` stamps both; a call without them stamps neither (byte-identical payload to today) |
| Local merge call sites deriving `mergedSha` (leaf-into-root `:3534`, root-into-main `:3684`) | Medium — `currentHead(repoRoot)` must be read AFTER the merge commit lands, not before, or it captures the pre-merge sha | Test asserts the recorded `mergedSha` matches the actual merge commit's own sha (`git rev-parse HEAD` in the test's own repo fixture, post-merge) |
| `'pull-door verify-only'` call site (`:3736`) | Low — D1 already locked: pass neither field | Test asserts a verify-only delivered event carries no `mergedSha`/`mergedInto` keys at all |
| GitHub path: `mergeCommit` field addition (`github-adapter.mjs`, D2) | Medium — depends on GitHub's `gh pr view --json` actually exposing `mergeCommit` reliably right after a merge (timing/eventual-consistency risk, same class of risk `viewGitHubPRStatus`'s existing polling loop already exists to handle for `mergeable`) | Reuse the existing poll-until-settled shape (`pollIntervalMs`/`pollTimeoutMs`) already in `viewGitHubPRStatus` rather than a single unpolled read; fake-gh test fixture returns a `mergeCommit` field to prove the plumbing, not GitHub's real timing |
| New `move --to delivered` refusal (`bin/fgos.mjs:1415`) | Medium — must not falsely refuse the 351 historical items that never had a `mergedSha` (acceptance clause 5: `drift-status.test.mjs` must stay green), and must not refuse a legitimate hand-typed move when `fgw/<id>` doesn't exist at all (e.g. a pull/legacy-sourced item) | Test matrix: (a) `fgw/<id>` doesn't exist → allowed; (b) exists and IS reachable from trunk → allowed; (c) exists and NOT reachable → refused without `--override-reason`; (d) same as (c) but with `--override-reason "..."` → allowed, and a decision-log entry is written carrying that reason |
| `docs/specs/work-state.md` Data Dictionary edit | Low — pure documentation | Acceptance clause 3 (mandatory) — reviewed for accuracy against the actual stamped fields, not just presence |

## Files touched, in dependency order

1. `src/state/store.mjs` — add `mergedSha`, `mergedInto` to `moveWork`'s
   destructure + stamp block (mirrors `branchHeadAtReturn`'s block,
   `:570-575`). *(Iron Law: write the red test in
   `test/state/store.test.mjs` first — see Phase 1 below.)*
2. `test/state/store.test.mjs` — red-first tests for step 1 (additive
   stamp, absent-when-undefined).
3. `bin/fgos.mjs` — thread `mergedSha`/`mergedInto` through
   `moveDeliveredOrRecordFault`'s call sites (`:3534` leaf-into-root,
   `:3684` root-into-main; `:3736` verify-only passes neither, D1) and
   the direct GitHub call site (`:3282`).
4. `src/runner/github-adapter.mjs` — add `mergeCommit` to
   `viewGitHubPRStatus`'s `--json` field list (`:140`) and return it from
   `mergeGitHubPR`'s result object (D2). One line each; no other GitHub
   transport logic changes.
5. `bin/fgos.mjs` — new `move --to delivered` refusal in `case 'move':`
   (`:1415-1427`): when `to === 'delivered'` and `fgw/<id>` exists,
   check `git merge-base --is-ancestor <fgw/id> <trunk>` (mirror the
   pattern already used in `src/state/cleanup-harness.mjs` /
   `src/runner/worktree.mjs`, called inline rather than importing either
   file unless a shared export already exists cleanly). Refuse unless
   `--override-reason "<text>"` is supplied, in which case allow the
   move AND write a `fgos decision`-shaped log entry carrying that reason
   before the move proceeds.
6. `test/state/store.test.mjs` (or a new `test/cli/move.test.mjs` if the
   existing file doesn't already cover CLI-level `move` behavior — check
   at Execute time) — red-first tests for step 5's matrix (a)-(d) above.
7. `docs/specs/work-state.md` — two new Data Dictionary rows
   (`mergedSha`, `mergedInto`), same table shape as existing rows
   15/16/19.
8. `CHANGELOG.md` — one line under `## [Unreleased]` (AGENTS.md's
   install/setup/doctor gate: any user-visible fgOS behavior change gets
   a changelog line — this is user-visible: `move --to delivered` now
   refuses in a new case).

## Assumptions (implementation-only, not material to CONTEXT.md)

- The ancestry check reuses `git merge-base --is-ancestor` called inline
  from `bin/fgos.mjs` (already has git-plumbing helpers like
  `currentHead`/`detectTrunk` in scope) rather than importing
  `cleanup-harness.mjs`/`worktree.mjs` — those two files stay outside the
  declared footprint unless Execute finds a clean, already-exported
  helper worth reusing directly.
- `--override-reason` is the flag name for the override path (item's own
  description says "cờ ghi đè kèm lý do" without naming the flag) — this
  is a naming detail only the implementer needs; not material enough to
  send back to `CONTEXT.md`.

## Validating addendum (fgos-coding-validating, READY WITH CONSTRAINTS)

Reality gate: mode fit PASS, repo fit PASS (every path/function cited in
this plan and in `CONTEXT.md` read directly and confirmed to exist at the
stated shape), assumptions PASS (both flagged assumptions confirmed
non-material), smaller-path PASS (no smaller lane overlooked given the
hard-gate flags), proof surface PASS (item's own `verify` field is real
and runnable), impact-analysis posture PASS (`fgos tool query
--capability impact-analysis --status present` re-checked fresh: still
`present` → `full`, matches what this plan recorded).

Feasibility matrix (medium+ risk rows only):

| Assumption | Risk | Proof required | Evidence found | Result |
|---|---|---|---|---|
| Local merge call sites can derive `mergedSha` via `currentHead(repoRoot)` read right after `moveDeliveredOrRecordFault` | Medium | Confirm `currentHead(repoRoot)` actually reflects the just-landed merge commit at both call sites | Read `bin/fgos.mjs:3425-3436`: **leaf-into-root's real `git merge` runs inside `withMergeEphemeralWorktree(repoRoot, rootId, ...)`, at `ephemeral.path` — NOT `repoRoot`.** `currentHead(repoRoot)` there would read the wrong tree. Separately, `src/runner/merge.mjs:1099` (`mergeRunnerItemLocked`)'s `isAlreadyMerged` branch returns `outcome:'merged'` for a branch that was ALREADY an ancestor of HEAD *before this call ran* (idempotent re-approve) — reading `currentHead(repoRoot)` immediately after in that case can capture a LATER, unrelated commit, not the actual merge point. | **CONSTRAINT** (not a plan-invalidating FAIL — a sourcing correction): derive `mergedSha` from `git rev-parse <result.branch>` (the source branch's own tip commit, resolved in the correct git context — `ephemeral.path` for leaf-into-root, `repoRoot` for root-into-main) instead of `currentHead(repoRoot)` uniformly. This is stable across both the fresh-merge and idempotent-already-merged cases, since it identifies "which commit of the branch landed" rather than "what HEAD happens to be right now." |
| `gh pr view --json mergeCommit` is a valid field on this repo's `gh` | Medium | Confirm the field exists on the installed `gh` version | Ran `gh pr view --json mergeCommit --help` directly: `mergeCommit` is listed as a valid field (`gh version 2.96.0`). Standard GitHub API shape: `mergeCommit` is an object with an `.oid` field — extract that as the sha. | PASS — proceed as planned in `github-adapter.mjs`, reading `.oid` off the returned `mergeCommit` object. |
| New `move --to delivered` refusal doesn't conflict with `case 'move':`'s existing behavior | Medium | Confirm `move` has no existing branch/reachability logic today | Read `bin/fgos.mjs:1415-1427` directly: fully generic, no existing check of this kind for any `--to` target. | PASS — additive, nothing to conflict with. |

## Outstanding questions

None
