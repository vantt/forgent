# Full-Suite Test Baseline (Plan-Loop Mandatory Baseline)

- **Date:** 2026-09-15
- **Track:** `code-panel-multicell-facade`
- **BASE_REF:** `45569ac3379445e93436524c1226159b3869265c`
- **Command:** `env -u CLAUDE_CODE_ENTRYPOINT -u CLAUDECODE -u CLAUDE_CODE_SSE_PORT npm test`
- **Environment Fingerprint:** `node v24.18.0 / npm 11.16.0 / Linux x86_64 / package-lock.json sha256:b097ecd850ca73e265a2dcbf94c63aa48c118069db53d42b00996fecd83fe2fc`
- **Authority:** `plans/260915-code-panel-multicell-facade/plan.md` (Execution Inputs `BASELINE`)

---

## 1. Summary of Outcome

- **Total Tests:** 6528
- **Pass:** 6467
- **Fail:** 52 (47 unique failing titles)
- **Suites:** 0
- **Duration:** ~12-15m

---

## 2. Failure Triage & Classification

All 52 test failures are pre-existing and unrelated to this track's deliverables:

1. **46 failures under `test/rust-host/*`:**
   Caused by the missing compiled Rust host binary in this worktree/environment. These are pre-existing across all Node-only worktrees and tracks that do not compile `target/release/fgos`.
2. **1 failure in `test/cli/fgos-intake-4.test.mjs:318`:**
   Test title: `'ask/answer round-trip on a genuinely legacy durable-doing item (no claim)'`
   Root cause: `seq:2` vs actual `seq:3` assertion mismatch. Confirmed deterministic by isolated re-run. Pre-existing in main repo baseline and completely unrelated to coordination or code-panel.

---

## 3. Mandatory Invariant

> [!IMPORTANT]
> **List may only shrink, never grow.**
> For every later full-suite gate in this track (`code-panel-multicell-facade`), no new test failures are admitted. Any failure not explicitly itemized in this baseline constitutes a regression that blocks cell close.
