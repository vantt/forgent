# Mailbox V3 plan: validation and red-team adjudication

Date: 2026-10-22. Plan: `../plan.md`. This file records the review. `plan.md` and the phase files are the execution authority.

## Validation

The validation log is in `plan.md` ("Validation Log"). In summary:

- **Questions:** 10. Nine were resolved from evidence; one is owner question Q1.
- **Verification:** 34 claims checked, at the Full tier. 29 were verified and 3 failed; all 3 were fixed:
  - the `fgos_process::facts` module path;
  - a line reference;
  - the recorder location, which now follows the `scripts/` precedent.
- **Unverified:** 2 claims. Phase 2's recordings will settle both.

## Red team

Four reviewers ran with hostile lenses, each with a verification role:

| Lens | Verification role |
|---|---|
| Security Adversary | Fact Checker |
| Failure Mode Analyst | Flow Tracer |
| Assumption Destroyer | Scope Auditor |
| Scope & Complexity Critic | Contract Verifier |

**Raw findings:** 36 (8, 9, 9 and 10). After deduplication, 29 remain, all with file:line evidence:

- **By severity:** 15 High, 14 Medium, no Critical.
- **By disposition:** 27 accepted (2 of them partly or modified) and 1 rejected. The open question below (row 29) was also accepted.

| # | Finding (reviewers) | Severity | Disposition | Rationale / evidence | Applied to |
|---|---|---|---|---|---|
| 1 | Recordings inherit the recording agent's session id variables, so the env evidence is polluted and the key-equality test is hollow (Scope, Failure, Assumption) | High | Accept | `packages/session-identity/rust/src/resolve.rs:9-13,92-108` (first usable variable wins). `CLAUDE_CODE_SESSION_ID` is set in the recording shell | Phase 2 isolation; decision 15 |
| 2 | Grepping for the canary passes for any shape, because Claude logs raw hook stdout as `hook_success` (Failure) | High | Accept | 2705 `hook_success` records with raw `stdout` in local transcripts | Phase 2 injection rule; decision 10 |
| 3 | Adding `stopBlock.max` turns the core's limits contract test red (Assumption) | High | Accept | `packages/mailbox/rust/core/tests/limits_contract.rs:12-22` | Phase 1: `reader` field; retargeted core test; new hook-key test |
| 4 | A denylist redaction passes unknown keys through unchanged (Security) | High | Accept | Phase 2 rule "no other value is changed" | Phase 2 allowlist redaction; `redact` lists replaced unknown keys for review |
| 5 | Path replacement depends on order; slug-form paths and account names leak; the guard misses the slug (Security, Assumption) | High | Accept | Claude `transcript_path` and `scratchpad_dir` slugs (S0 report line 35) | Phase 2 rules and guard |
| 6 | The token denylist misses Google (`ya29.`, `1//0`) and GitHub (`github_pat_`, `ghs_`) formats and long random strings (Security) | Medium | Accept | agy runs under a Google-backed home | Phase 2 guard |
| 7 | The linked Codex `auth.json` can be replaced by a live token during a refresh; the account is read from the "current" account (Security) | High | Accept | `.gitignore:23` keeps the file without deleting it; `_codex_current_account` reads `~/.codex_active_account` | Phase 2: `CODEX_ACCOUNTS[tetnu]`, `test -L` after each run, `clean`; plan risk |
| 8 | Recording ran inside the worktree with bypass flags; project and user hooks fire; the plan wrongly claimed the repository's `.agents/hooks.json` loads (Security, Assumption) | Medium | Accept | `.claude/settings.json:56-62` in the worktree; `.agents/hooks.json` absent from the worktree | Phase 2: raw directory outside any checkout; `--setting-sources`; the false sentence removed |
| 9 | The payload's Codex `session_id` becomes the stored handle unchecked (Security) | High | Accept, partly | `packages/mailbox/rust/core/src/registry.rs:131,160,193` | Decision 13; phases 5 and 6. The handle is used only when it equals the writer key, with a length bound in the adapter. No core change: the handle stays opaque in the core |
| 10 | The subordinate rule needs a non-empty `agent_id`; `null`, `""` or `agent_type` alone read as the head (Security) | Medium | Accept | spec §15.6 (both fields) | Decision 6; phase 5 synthesized vectors |
| 11 | Any process that inherits the head's environment can drain the head's mail by calling the hook entry (Security) | Medium | Accept (documentation and hand-off; out of V3's code) | `resolve.rs:156-160` reads env | Decision 13; phase 6 module doc; phase 7 spec and hand-off |
| 12 | "Exit 0" was proven by a constant, and `emit` returned a `Result` (Scope, Assumption) | High | Accept | phase 6 draft; spec V4/V5 rows did not list exit status | Outcome; infallible API; phase 7 adds the exit-status proof to the V4 row on the branch |
| 13 | The hook duplicated the core's same-head rule; `register` sweeps before refusing; the Outcome's "refused changes nothing" was false (Scope, Failure) | High | Accept | `registry.rs:134,143-148,151-152` | Decision 5; phase 3 core change, with the retired and retargeted tests named |
| 14 | The `changed` clone-and-compare is a new mechanism for a V5 concern (Scope) | Medium | Accept | Core return values already report effects | `changed` removed from the API; tests compare snapshots |
| 15 | Default or partial `Record`s compare equal, so a stranger counts as the same head; an unparseable stored head defers forever (Scope, Failure) | High | Accept | `packages/process/rust/src/facts.rs:64,117-139,225-227` | Phase 4 `is_complete`; phase 6 `HeadUnknown`; permanent `Deferred` handed to V5 |
| 16 | The Stop count rose before the block was printed, and nothing reset it at a new turn (Failure, Assumption) | High | Accept | phase 6 draft step 5; recorded `stop_hook_active` / `executionNum` | Decision 8: count in `finish`, first-Stop reset; phases 3 and 6 |
| 17 | One missing body poisoned the whole claim; healthy mail was refused at the offer cap (Assumption) | High | Accept, modified | `delivery.rs:359-388`; `sweep.rs:27-44` | Decision 3: body-missing frame from the contract (phase 3); phase 6 two-message test |
| 18 | One claim has no size bound (Failure) / the 64 KiB probe is out of scope and an invented number (Scope) | High | Accept the scope finding; accept the truncation risk as a recorded V4 item; reject "block phase 6" | V3 cannot measure a CLI's truncation without live runs at a contract-derived size, and the payload contract does not depend on it. Evidence: `limits.v1.json` (`maxBodyBytes` 16384, `queue.cap` 50) | Decision 14; `size` run removed; phase 7 hand-off |
| 19 | The order of `finish` and the stdout write was undefined (Failure) | Medium | Accept | spec §5.2 (emit before finish) | Shell duties in the plan architecture and the phase 6 module doc |
| 20 | Q1 option A assumed `Stop` is head-only on CLIs never measured; "could not trigger a subagent" was not covered (Failure, Assumption) | High | Accept | spec §15.6 (Claude only) | Q1 rewritten; phase 2 subagent run records every event and the subagent's env |
| 21 | Versions lived in two files plus a sync test; `adapters.v1.json` departed from the spec's shape (Scope, Assumption) | Medium | Accept | spec §4.1 `{cli, version}`; precedent `vectors.json` shape | Decision 11; phase 2 before/after version check |
| 22 | Head-judgement cases were proven at three layers (Scope) | Medium | Accept | `packages/process/contracts/process-facts.judge.v1.json` | Phase 4 reduced to the round trip and the completeness rule |
| 23 | `SeqIds` would be copied into the store crate's tests (Scope) | Medium | Accept | `core/tests/common/mod.rs:52-61` | Phase 1 shared `support.rs` |
| 24 | The Stop-bound test depends silently on the wake quota per exchange (Failure) | Medium | Accept | `wake.rs:91-99` | Phase 6: a different sender per Stop; `effective_wake` asserted |
| 25 | "Byte-for-byte" was promised, but JSON values were compared (Assumption) | Medium | Accept | phase 5 | Outcome item 1 now says "same JSON value" |
| 26 | The delivery-report sentence is needed at V4, which already runs `send` (Assumption) | Medium | Accept | spec V4 row | Decision 12; phase 7 V4 row |
| 27 | §12 says "per session", the contract says "per head generation" (Assumption, Scope) | Medium | Accept | spec §12 | Phase 7 §12 edit |
| 28 | Drop env and tool-env capture and the key-equality test: out of scope, and a redaction tautology (Scope) | High | Reject | The placeholder mapping is one-to-one, so equal placeholders mean equal real values. With the parent environment cleared (finding 1), the test compares what the CLI itself set. The registration key is part of V3's "generation registration". The evidence answers spec §5.1's open question at the cost of one `printenv` in a run that happens anyway | none |
| 29 | Open question: does a CLI run hooks in another PID namespace, which would make every stored head `Unknown`? (Failure) | — | Accept | `facts.rs:207-211` | Phase 2 records the hook namespace; plan risk |
