# Unit I25 — Claude-only parallel execution report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/I25`,
worktree `.claude/worktrees/coordination-skill-harness-i25-action-view-conformance`,
base `main@5c63ac40d` (post-I24b), integrated `main@165bae767`.

Closes the two narrow remainders left after I24b's own M1 fix and
work-item-6 test — Phase 5 work items 5/6's "genuine remainder", not new
functionality. This unit's own decomposition (I25) was corrected once
before dispatch: an independent decomposition review of the original
I25/I26 draft found the premise partly stale (the `revise-synthesis`
real-protocol visibility test the original draft asked for already
existed) and the allowlist-hardening scope under-specified (the real
fixture only emits 4 of 8 action kinds) — both corrected in plan.md before
any implementer touched it.

## Implementer (sonnet, fullstack-developer)

Added a real-protocol conformance assertion that `revise-explanation`
stays legal across both bounded-reopen invocations, mirroring the existing
`revise-synthesis` assertion structurally without duplicating it (different
operation, different actor, extended call chain since `revise-explanation`
needs an `explainId` grant). Added a real-protocol assertion that
`record-human-turn` is legal in the `architecture-advisory-panel-v1` typed
action view. Hardened the work-item-6 mechanical-fields test from an
8-name denylist (checked only against non-`specialist` kinds) into an
exact per-kind top-level-and-target-field allowlist covering all 8 action
kinds the projector emits — reading `actions-projector.mjs` (read-only)
to derive the exact field sets, building fixtures for the 4 kinds absent
from the original fixture by reusing existing fixtures already present
elsewhere in the same file. Correctly left `core/skills/fgos-architecture-panel/
SKILL.md` untouched (owned by the parallel I26 unit) despite a mid-task
Bash cwd hint briefly showing the wrong worktree — caught and re-verified
before committing. Full suite at candidate: 7939 tests, 7866 pass, 0 fail.

## Independent test + review (round 1, opus, parallel)

Both agents actively tried to break the new tests rather than just
re-running them:
- **test-i25** independently re-derived every kind's field set from
  `actions-projector.mjs` and confirmed an exact match with the new
  allowlists. Ran 10 targeted mutation probes (an injected extra field on
  each of the 8 kinds, both top-level and target placements) against a
  scratch copy of the projector — 9 of 10 were caught immediately by the
  new test failing as expected. The 10th (an extra field reachable only
  through `record-disposition`'s conditional `allowedValues` branch,
  itself gated on a `rechecks.dischargeOn` match) escaped — not because
  the allowlist entry was wrong, but because NO fixture repo-wide
  (confirmed via instrumentation across every `coordination-*` test file)
  ever exercises that branch shape. Also mutated `evaluateDriverAuthorizedBindings`
  directly (`count < 1` and `count < true`) and confirmed both new
  bounded-reopen assertions fail in the expected direction — the tests
  guard both "still legal after #1" and "no longer legal after #2", not
  just one side.
- **review-i25** independently confirmed the same allowlist accuracy by
  reading the projector directly, and separately confirmed the
  `revise-explanation` test structurally mirrors `revise-synthesis`'s own
  three-point-check shape via a scratch-copy `maxInvocations` edit
  (2→1), which failed both the pre-existing over-cap test and the new
  visibility test identically.
- Neither agent found a HIGH or MEDIUM issue. LOW findings only: no
  assertion that all 8 kinds were actually observed during the test run
  (a fixture regression could silently drop coverage for one kind without
  failing); the `record-disposition` conditional-`allowedValues` coverage
  gap (same one test-i25's mutation testing surfaced); a duplicated
  `SPECIALIST_ALLOWED_FIELDS` list that could drift from its sibling;
  plan-ID citations in a test name/comments ("(I25)", "Item 5") — rejected
  per this track's own established precedent (the repo's own convention
  already does this pervasively, confirmed across I18/I21/I22/I23/I24a/
  I24b's own unit reports).

## Lead final verification and merge

Independently re-read the diff directly and ran both target test files
myself before either independent agent's report came back: 29/29 pass.
No fix round was needed — every finding from both agents was LOW-severity
and either optional test-hardening (deferred, doesn't affect correctness)
or the established plan-ID convention (rejected, matching prior units'
disposition). Full `env -u CLAUDE_CODE_SESSION_ID npm test` on the
worktree: 7939 pass, 0 fail, exit 0 (test-i25's own independent run,
matching my own earlier direct verification).

`git -C /home/vantt/projects/forgentX merge --no-ff unit/I25` from the
main checkout onto post-I24b `main@5c63ac40d`, `ort` strategy, clean
auto-merge (test-file-only diff, no conflicts). `integratedSha =
165bae7671e8279d178a50fc592111aa97787ae8`. Reran both key suites on the
merged tree (29/29 pass) to confirm the merge introduced nothing
unexpected.

## Process note

This is the first unit in the track where zero fix rounds were needed
after independent test + review — a direct result of the decomposition
review catching scope gaps (stale premise, under-specified allowlist
coverage) BEFORE implementation started, rather than after. The
decomposition-review-before-dispatch discipline (already used for I22-I24b)
paid off concretely here: what could have been a round of "the allowlist
doesn't actually cover 4 of 8 kinds" fix-round churn was instead caught
and corrected in the plan text itself.
