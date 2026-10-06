---
title: Observe acceptance repair verification
date: 2026-10-06
summary: Five ordered repairs verified; source guards unmet and fresh A/B judgment unproven
---

# Observe acceptance repair verification

## Repairs and commits

| Repair | Commit |
|---|---|
| Reopen unsupported completion/guard claims | `842287533` |
| Correct evaluation provenance and comparison claims | `75606d308` |
| Preserve Unit settlement authority; measure declared voters | `b2c7b4588` |
| Reconcile eligible run history; refuse ambiguous IDs | `c439264cd` |
| Enforce rubric completeness and atomic eval identity | `f11504363` |

Voting membership uses writer-owned pattern kind, not role spelling. Reviewed siblings drain before settlement; inline producer recording cannot settle a reviewed Unit. Active/unsettled backfill is skipped. Derived-summary failures warn without changing the authoritative outcome. Missing/unusable summaries remain counted.

Settlement uses real result completion fields, then regular sibling owner run.json settlement only when result times are absent/blank; never start/creation/mtime. Node and Rust share directory/admission behavior, including Unicode duplicate ordering. Show/watch/recover refuse ambiguous IDs. Known quality rubric requires all five keys. Eval IDs are checked across shards under the existing Observe lock; unsafe shards remain visible, and portable libc flags replace the architecture-specific constant.

## Exercised proof

- Final narrow consumers: 259 Unit/measurement Node tests and 99 foundation Node tests passed. Eval main harness: 23 passed, including real same-shard and duplicate-ID competing processes.
- Final `cargo test -p fgos-run-result -p fgos-observe` passed (aggregate 95 includes child harness output). Linux arm64 cargo check passed; compile-only, not runtime proof.
- Exact golden regeneration succeeded; fixture diff remained empty.
- Rebuilt native CLI exercised runs/coverage/discussions/eval; actual rebuilt and old-host doctor behavior checked. Derived summaries were regenerated on both live roots without modifying source journals.
- Exactly one final `env -u CLAUDE_CODE_SESSION_ID npm test`: 6,851 tests, 6,778 pass, zero fail/cancelled, eight skipped, 65 todo; 334,907.732836ms. No other test/provider job remained and no commit was made while it ran (artifact://456; full runner artifact://453).

## Honest limits

The original source-enumerator guard and exact import-closure assertion remain **not fixed** because the current higher-priority runtime test policy prohibits those tests. This is not represented as a repository law or owner waiver. Original whole-plan acceptance remains in progress.

Historical judge provenance is corrected, not retroactively proven. The original solo consumed panel output; its question differed and tools/settings/MCP were loaded but unused. The two old real scorecards are not fresh independent comparison evidence.

Fresh real Unit arms reused the entire historical English objective and one hashed source packet. Solo Opus, panel Sonnet and Gemini passed; xai failed before inference because the inherited readonly Pi auth store could not create its lock. GLM synthesis never launched. No quota exhaustion was established, credentials were not read/copied/provisioned by the assistant, grants were not widened, and temporary project config was restored byte-for-byte. A provisioned writable private Pi account runtime is missing. No new A/B judgment or two new evals were fabricated.

A separate isolated Opus canary captured actual argv and SDK tools/MCP/skills/slash-command arrays as empty. Three builtin plugins remain; no complete hidden-instruction snapshot was emitted. Native Unit prepared arguments are not actual-child-argv proof, and its SDK cwd reported /home/vantt rather than the requested scratch. Fresh fair comparison is **UNPROVEN**.

## Records

[Complete finding ledger and evidence](../reports/observe-acceptance-fixes-261006.md). All six phase documents and the root plan are synced; the original three Opus reports remain immutable. AgentWiki publication skipped. No push, work-item lifecycle command, event/backup staging, or release activation.

## Correction after the third acceptance round

The "not fixed" guard statement above (summary and Honest limits) is superseded. Commit `5608387d3` adds the source-enumerator guard (`test/runner/assignment-enumerator-guard.test.mjs`) and restores the exact import-closure assertion (`test/runner/dispatch-reconciliation-import-graph.test.mjs`). Known limits: the enumerator guard is a static heuristic over one file at a time (no cross-file flow, no glob or `child_process` listing, a multi-line `path.join` binding is missed, and an allow-listed file can add another walker under the same key); the closure assertion follows static imports only, and dynamic `import()` is not followed. The full-suite figures above describe the tree before the later code commits, not the current HEAD.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
