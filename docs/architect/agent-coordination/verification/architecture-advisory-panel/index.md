# Track: architecture-advisory-panel

Plan: `plans/260905-architecture-advisory-panel/plan.md`
Branch: `group-thinking-plan-loop` (deviation from plan's preferred branch strategy below)
Base ref: `d3b2271b` (commit that added this plan on `group-thinking-plan-loop`)
Focused command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' 'test/cli/coordination.test.mjs' 'test/architecture.test.mjs'`
Full command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 npm test`

## Deviation from plan's Entry Conditions — branch/commit strategy

Plan.md's Entry Conditions prefer merging `group-thinking-plan-loop` into `main` and branching `architecture-advisory-panel` from that descendant, or (fallback) branching from a commit containing `22b26333` plus the committed plan. The person explicitly chose instead: stay on `group-thinking-plan-loop`, commit the plan directly there (commit `d3b2271b`), and run the track from this branch without a separate top-level track branch. Recorded here as the actual, immutable `BASE_REF` per the plan's own requirement. Per-cell worktree branches (`architecture-advisory-panel--<cell-id>`) still branch off this branch's HEAD at the time each cell opens, same mechanism the plan describes.

## Deviation from plan's stated cell sequencing

The person's initial request asked to start at Phase 01. Phase 01 (P01.1) declares "Ready after: P00.1" and phase-00's own Exit section states "P01 may use only this allowlist" (the executor/mechanism allowlist P00.1 produces). No verification directory existed and no allowlist had ever been produced, so starting at Phase 01 would dispatch real advisory agents against real proof projects with no live-proven read-only confinement — the exact condition Phase 00 exists to prevent. Presented this conflict to the person; they chose to run Phase 00 first, in original plan order. This track therefore opens at cell P00.1, not P01.1.

## Audit

| Phase | Requirement | Status |
|---|---|---|
| 00 | Live-proven read-only executor/mechanism allowlist | done (P00.1 proven) |
| 01 | Advisory soul and manual proof | P01.1 + P01.2 done; P01.3 open (see Cells table) |
| 02 | Capability-fit audit | blocked on 01 |
| 03 | Minimal hard shell and protocol | blocked on 02 |
| 04 | Production skill and Decision Dialogue | blocked on 03 |
| 05 | Comparative proof and promotion | blocked on 04 |

## Baseline

Full suite run at track start (`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 npm
test`), 2026-09-05: **5614 tests, 5604 pass, 4 fail, 6 skipped**
(`duration_ms 178257`, log saved at
`docs/architect/agent-coordination/verification/architecture-advisory-panel/proofs/P00.1/baseline-full-test.log`).

Plan's own recorded starting baseline (from the completed
`group-thinking-plan-loop` track) named four known failures: legacy
durable-doing ask/answer, missing-quadrant docs-index, live codex
usage-limit, and invalid placeholder characters in two resume examples.
This run's actual four failures:

1. `test/cli/fgos-intake-4.test.mjs` — ask/answer round-trip on a legacy
   durable-doing item (seq 3 vs expected seq 2). Matches "legacy
   durable-doing ask/answer".
2. `test/report/enduser-index.test.mjs` — docs-index missing-quadrant
   tolerance (`docs/tutorials` now exists, so the test's own hide-the-dir
   setup assumption no longer holds). Matches "missing-quadrant docs-index".
3. `test/setup/coordination-doctor-check.test.mjs` —
   `coordination-example-requests-valid`: two published resume-request
   examples (`group-thinking-nominal-group-lite-resume-request.json`,
   `group-thinking-rfc-review-lite-resume-request.json`) still carry the
   placeholder `grantedContextRefs` text, which fails the safe-charset
   check. Matches "invalid placeholder characters in two resume examples".
4. `test/runner/codex-cli-glm-cli-live-executors.test.mjs` — **drift**: the
   plan named "live codex usage-limit" as the fourth known failure; the
   actual fourth failure today is a different live-executor test, the
   GLM-cli self-identification probe returning `MODEL=claude-opus-5`
   instead of a genuine z-ai/GLM identification (OpenRouter route not
   taking effect, or a silent fallback). Both are live/external-service
   flakes in the same class (a real network-dependent executor probe), but
   they are not the same test — named here as required drift, not silently
   folded into the old label. Not independently re-run multiple times yet
   to confirm flake vs regression; P00.1's Doer/Reviewer should re-run this
   one test in isolation before treating it as environment-only.

Net: still exactly four failures, same class (pre-existing environment/live
dependencies unrelated to this track's own work), but item 4's identity
changed. No new failure beyond four. This does not block P00.1 — see Stop
Gates in `current-cell.md` — but must not be silently mislabeled at close.
Confirmed as the authoritative baseline in commit `55c0de9c`, cited by
P00.1's own dispositions (D6) resolving the Doer's internally-contradictory
self-reported numbers.

## Cells

| Cell | Coordination id | Status | Notes |
|---|---|---|---|
| P00.1 | `architecture-advisory-panel--p00-1` | done | Read-only dispatch readiness proven; Allowlist produced |
| P01.1 | `architecture-advisory-panel--p01-1` (fix round + close on `--p01-1-fix1`, see session-workaround note in P01.1.md) | done | Soul authored (3434 lines), 1 HIGH + 4 MEDIUM + 2 LOW findings fixed in 1 round, both rechecks clean |
| P01.2 | manual dispatch, no coordination session (see P01.2.md) | done | Real clear-input proof on mdview: 8 phases + 2 real Decision Dialogue turns with the actual person; found a real production bug (auth token lost on stdout); final outcome: fix 4 named first-run defects, defer Windows packaging, drop telemetry-first sequencing |
| P01.3 | manual dispatch, no coordination session (see P01.3.md) | open | Real unclear-input proof on vnflow (EOD/intraday pipeline evolution); Phase 1 done, Phase 3 dispatch next |

## Admitted Read-Only Advisory Executor Allowlist

The following safe executor/mechanism pairs are live-proven and admitted for Phase 01+ advisory dispatches:

1. `claude-bwrap` (OS mount, `out-of-process`) — Provider: `claude` (Anthropic). Tier: `analytical`/`standard` -> `sonnet`, `critical` -> `opus`. Corrected bwrap mount with explicit `--chdir` to fresh disposable checkout (`bwrap --ro-bind / / --dev /dev --proc /proc --bind <evidenceDir> <evidenceDir> --chdir <checkoutDir> -- claude ...`). Hard OS kernel `bwrap --ro-bind / /` read-only mount.
2. `codex-readonly` (Native sandbox, `out-of-process`) — Provider: `openai-codex` (OpenAI). Tier: `standard`/`analytical`/`critical` -> `gpt-5.5`. Provider-native `-s read-only` sandbox flag.
3. `agy-bwrap` (OS mount, `out-of-process`) — Provider: `gemini` (Google DeepMind). Tier: `standard` -> `gemini-3.6-flash-medium`, `analytical` -> `gemini-3.1-pro-low`, `critical` -> `gemini-3.1-pro-high`. Corrected bwrap mount with explicit `--chdir` to fresh disposable checkout (`bwrap --ro-bind / / --dev /dev --proc /proc --bind <evidenceDir> <evidenceDir> --chdir <checkoutDir> -- agy ...`). Hard OS kernel `bwrap --ro-bind / /` read-only mount.

Excluded Unsafe / Non-Runnable Pairs:
- `claude-reviewer` (`unconfined config`): EXCLUDED (falsified — authorized in-tree write succeeded).
- `agy-plan` (`--mode plan`): EXCLUDED (falsified — wrote file outside checkout).
- `codex-bwrap` (`bwrap OS mount`): EXCLUDED (non-runnable startup crash `os error 30`).
- `codex-cli` (`--dangerously-bypass-approvals-and-sandbox` unconfined): EXCLUDED (mutated target repo).
- `agy-cli` (`--mode accept-edits` unconfined): EXCLUDED (mutated target repo).
- `agy-sandbox` (`--mode accept-edits --sandbox`): EXCLUDED (mutated target repo despite `--sandbox` flag).

## Stop Gate — P01.3, resolved

P01.2 is done. P01.3's required confirmation was given 2026-09-06: the
person confirmed `/home/vantt/projects/vnflow`'s named case ("EOD and
intraday evolution is becoming difficult" — keep separate pipelines with
shared contracts, one pluggable abstraction, or reframe elsewhere) is
still genuinely undecided, independently corroborated by a kongming
pre-check, and authorized real panel dispatch against it. Cell is open —
see `P01.3.md`.
