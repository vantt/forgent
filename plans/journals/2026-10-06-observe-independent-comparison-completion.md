---
title: Observe read-audited comparison completion
date: 2026-10-06
summary: Completed a read-audited (not sandbox-isolated) historical-question A/B and two real evals; the guard sentence below is corrected at the end.
---

# Observe read-audited comparison completion

## What happened

Completed the remaining historical-question comparison, read-audited rather than independent by enforcement (see the correction at the end), without repeating the already green full npm suite or production repairs. Kept clean solo unit-run-1791270002490-60cc7659; excluded a contract-passing but contaminated panel after Gemini read earlier reports. Only the panel was regenerated, as unit-run-1791270868625-812a0306, with forgentX masked for Gemini and the same immutable source packet copied to all five accepted seats.

## Root causes and decisions

The earlier Pi lock failure came from an inherited readonly home. Existing owning-root account-backed private-home profiles and opaque bwrap provisioning already solve it; no manual credential inspection/copy or new mechanism was needed. Claude needed supported own-assignment read/write access. Judge setup also exposed default invocation selection: two paid attempts did not apply the isolated flags, so their transcripts remain rejected isolation evidence, not real evals. Preserved referenced profile IDs, aligned every temporarily selectable CLI profile and added a no-provider selected-argv preflight.

## Evidence

Successful official Dispatch Opus judge: actual wrapper/kernel cwd and argv retained; SDK claude-opus-5-5, tools/MCP/skills/slash_commands empty, zero tool/hook events. A scratch before/after inventory of exactly A.md and B.md with unchanged hashes is recorded only in coordinator-authored JSON; the scratch was deleted, so this is UNPROVEN. Native eval record appended two complete actual vectors; list has four real records, invalid[]. Solo 7/10; panel 5/10. Runtime configurations were byte-restored. Source packet sha256 9a93aa925f7d3f5c4693227357a0100c79889a45180a1031d5fceac9db7782d2. Evidence and qualification limits: plans/reports/observe-acceptance-fixes-261006.md.

## Limits and remaining acceptance

One question/one successfully isolated judge; citations unverified, CLI instead of historical herdr, three builtin plugins/admin policy may remain. Actual outputs are 360/498 whitespace words, both over the requested 300; no trimming or regeneration to improve scores. Phase6 is complete. At the time of writing, the whole plan stayed in progress because the exact source/import guards were believed to conflict with a runtime prohibition on permanent source-text/wiring tests; that sentence is superseded (see the correction below). No push, new work item, event/backups mutation or second full npm run. AgentWiki publish skipped.

## Correction after the third acceptance round

- **Not independent by enforcement.** No seat *read* the other arm's output; this is checked from raw tool calls. The arms were not isolated by sandbox: the launch envelopes of the solo, Sonnet, xai and GLM seats bind the whole filesystem read-only and do not mask forgentX; only the Gemini seat does. The accurate description is "read-audited, not sandbox-isolated". The ledger's [second-round correction section](../reports/observe-acceptance-fixes-261006.md#cập-nhật-sau-nghiệm-thu-lần-hai) holds the envelope and timing evidence.
- **Scratch inventory.** UNPROVEN, as corrected above.
- **Guard.** The source-enumerator guard (`test/runner/assignment-enumerator-guard.test.mjs`) and the exact import-closure assertion (`test/runner/dispatch-reconciliation-import-graph.test.mjs`) exist in commit `5608387d3`; the runtime-policy reason given above no longer holds. Known limits: the enumerator guard is a static heuristic over one file at a time (no cross-file flow, no glob or `child_process` listing, a multi-line `path.join` binding is missed, and an allow-listed file can add another walker under the same key); the closure assertion follows static imports only, and dynamic `import()` is not followed.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
