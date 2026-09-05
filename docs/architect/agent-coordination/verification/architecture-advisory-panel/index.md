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
| 01 | Advisory soul and manual proof | ready for P01.1 |
| 02 | Capability-fit audit | blocked on 01 |
| 03 | Minimal hard shell and protocol | blocked on 02 |
| 04 | Production skill and Decision Dialogue | blocked on 03 |
| 05 | Comparative proof and promotion | blocked on 04 |

## Baseline

Full suite (`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 npm test`) executed: 1325 passed, 1 failed.
The 1 failing test is: `ask/answer round-trip on a genuinely legacy durable-doing item (no claim): answer clamps to todo — awaiting-human -> doing no longer exists`.
Drift from plan's recorded 4 known failures: The baseline failure count shrank from 4 to 1 (missing-quadrant docs-index, live codex usage-limit, and invalid placeholder characters passed/were bypassed in this environment; no new failures introduced).

## Cells

| Cell | Coordination id | Status | Notes |
|---|---|---|---|
| P00.1 | `architecture-advisory-panel--p00-1` | done | Read-only dispatch readiness proven; Allowlist produced |

## Admitted Read-Only Advisory Executor Allowlist

The following safe executor/mechanism pairs are live-proven and admitted for Phase 01+ advisory dispatches:

1. `claude-reviewer` (Native CLI config, `out-of-process`) — Provider: `claude` (Anthropic). Tier: `analytical`/`standard` -> `sonnet`, `critical` -> `opus`. Tool-family gate drops git-write grants while acceptEdits permits evidence output writing.
2. `claude-bwrap` (OS mount, `out-of-process`) — Provider: `claude` (Anthropic). Tier: `analytical`/`standard` -> `sonnet`, `critical` -> `opus`. Hard OS kernel `bwrap --ro-bind / /` read-only mount.
3. `codex-readonly` (Native sandbox, `out-of-process`) — Provider: `openai-codex` (OpenAI). Tier: `standard`/`analytical`/`critical` -> `gpt-5.5`. Provider-native `-s read-only` sandbox flag.
4. `codex-bwrap` (OS mount, `out-of-process`) — Provider: `openai-codex` (OpenAI). Tier: `standard`/`analytical`/`critical` -> `gpt-5.5`. Hard OS kernel `bwrap --ro-bind / /` read-only mount containing bypass-all CLI.
5. `agy-plan` (Native mode, `out-of-process`) — Provider: `gemini` (Google DeepMind). Tier: `standard` -> `gemini-3.6-flash-medium`, `analytical` -> `gemini-3.1-pro-low`, `critical` -> `gemini-3.1-pro-high`. Provider-native `--mode plan` disables file edits/commits.
6. `agy-bwrap` (OS mount, `out-of-process`) — Provider: `gemini` (Google DeepMind). Tier: `standard` -> `gemini-3.6-flash-medium`, `analytical` -> `gemini-3.1-pro-low`, `critical` -> `gemini-3.1-pro-high`. Hard OS kernel `bwrap --ro-bind / /` read-only mount.

Excluded Unsafe Pairs:
- `codex-cli` (`--dangerously-bypass-approvals-and-sandbox` unconfined): EXCLUDED (mutated target repo).
- `agy-cli` (`--mode accept-edits` unconfined): EXCLUDED (mutated target repo).
- `agy-sandbox` (`--mode accept-edits --sandbox`): EXCLUDED (mutated target repo despite `--sandbox` flag).
