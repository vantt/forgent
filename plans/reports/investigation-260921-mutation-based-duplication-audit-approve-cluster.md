# Mutation-based duplication audit: `approve` cluster

**Date:** 2026-09-21
**Motivation:** the user's persistent hypothesis (raised repeatedly this session) that the
~7,791-test suite reflects wasteful duplication. Two earlier prose-sampling passes
(this session, `approve` and `classify`/intake clusters) found no naive duplication
but were not rigorous — sampling by reading test names/comments is not evidence.
This is the rigorous version: brainstorm doc item 4.4 ("Contract mutation seeding
có mục tiêu") — seed real faults at real guards, see which tests actually catch
which faults. Per the doc's own principle (§2): "một test chỉ được coi là dư thừa
khi cùng invariant, cùng production guard, cùng boundary và cùng failure mode đã
có canonical proof khác" — this is the only way to check that condition with
evidence instead of assumption.

## Scope

Full audit of ~7,791 tests is infeasible in one session. Piloted on the `approve`
cluster (already partially sampled earlier this session): `src/verbs/merge/approve.mjs`
(965 lines) against its full candidate test set — `test/verbs/merge/approve.test.mjs`
(4 "direct" tests) + `test/cli/fgos-approve{,-2..7}.test.mjs` (68 CLI tests) = 72 tests
total.

## Method

4 targeted mutations, each disabling one real, distinct guard in `approve.mjs`
(chosen to span different invariant categories per the doc's own mutation-type
table): a precondition check, an environment-identity guard, a hard policy gate,
and an evidence-completeness check. For each mutation: apply, run all 72 tests,
record exactly which ones fail (= which ones actually prove that guard), revert,
next mutation. Baseline (unmutated) confirmed 72/72 green first.

| Mutation | Guard disabled | Catchers |
|---|---|---|
| M1 | `if (item.status !== 'awaiting-approval')` precondition | 2 |
| M2 | `if (!isMainWorktree(repoRoot))` environment-identity guard | 5 |
| M3 | `if (ironLaw.required)` hard policy gate | 3 |
| M4 | `assertAcceptanceEvidence`/`assertPlanEvidence` (both call sites) | 3 |

## Finding: zero redundant pairs

For every mutation, the catching tests each cover a **distinct input combination
or historical regression**, not the same scenario proven twice:

- **M1** (2 catchers): re-approving an already-`done` item vs. approving an item
  never reaching `awaiting-approval` at all — different starting states, same guard.
- **M2** (5 catchers): the worktree-identity guard fires identically for
  runner-sourced, pull-sourced, and `--github` sources, each with and without
  `--trust-dir` — 5 genuinely different combinations reaching the same guard,
  matching the guard's own doc comment ("covering BOTH non-github source paths,
  each dangerous for its own reason").
- **M3** (3 catchers): the local-merge path, the `--acknowledge-iron-law false`
  value-form edge case (a named historical regression, f02), and the `--github`
  path (a separate named regression, f01 — the gate used to be bypassable via
  `--github` entirely). Three different historical bugs, not one test repeated.
- **M4** (3 catchers): acceptance-evidence on the `--github` path,
  acceptance-evidence on the local-merge path, and a *different* check entirely
  (plan.md evidence for `risk:heavy` items) — two distinct evidence types across
  two distinct transports.

**The 4 "direct" tests caught zero of the four mutations.** They test a disjoint
concern (merge *mechanics* — catchup, leaf-into-root, conflict handling), not the
CLI-layer guards. This confirms this session's earlier sampling: the direct and
CLI layers are not duplicating each other, they prove different things. It also
means these 4 guards have **no proof outside the CLI boundary** — not a defect,
but consistent with `approve.mjs`'s own header comment ("moved here whole from
bin/fgos.mjs... every return branch has to keep its exact shape").

No two tests, across this whole pilot, caught the identical mutant set — the
direct test of "are these interchangeable" that duplication would require.

## Disposition

**No duplication found in this cluster.** The naive "68 CLI tests for one file
looks excessive" impression does not survive contact with real fault-seeding
evidence — each test earns its place by proving a distinct input combination or
a specific historical regression (several tagged with their own finding IDs:
f01, f02).

This is one cluster, not proof for the whole 7,791-test suite. But it is now two
independent methods (prose sampling, then mutation seeding) agreeing on the same
cluster, which raises confidence the `approve` cluster specifically is not a
duplication problem, without claiming this generalizes.

## Remaining risk / explicit deferred work

- Only 1 of ~apx 30+ clusters this size in the suite. No claim about the other
  clusters is made or implied.
- Only 4 mutations were seeded (of many possible guards in this one 965-line
  file) — a bounded pilot, not exhaustive coverage of even this single cluster.
- If the user wants to pursue this further, the next-cheapest step is repeating
  this exact method on 2-3 more clusters chosen for the highest test-count-to-
  file-size ratio (the strongest a priori "looks excessive" candidates) rather
  than expanding scope on `approve` itself.
