# Red-team log: Mailbox V5

Date: 2026-10-23, Asia/Saigon. The plan has 9 phases, so four reviewers ran (`code-reviewer`, sonnet, read-only), each also doing the verification role its persona carries:

- Security Adversary (fact checker), 8 findings;
- Failure Mode Analyst (flow tracer), 10 findings;
- Assumption Destroyer (scope auditor), 9 findings;
- Scope and Complexity Critic (contract verifier), 9 findings.

**Totals.** 36 raw findings, deduplicated to 21. Every finding passed the evidence filter: each cites `file:line`. 17 were accepted, some in part, and 4 were rejected with a reason. Owner was unavailable, so adjudication is the planning lead's, inside the signed frame. No accepted change widens the signed V5 row.

## Findings and dispositions

| ID | Severity | Finding (merged sources) | Disposition | Applied in |
|---|---|---|---|---|
| RT1 | Critical | `resolve_workspace_root` → `GitDriver::open_at` creates the state root and the empty-hooks dir, runs a floor probe that can write, and spawns `git config --list` and `git rev-parse` in every fresh hook process. Phase 2 measured it at its best case (FM1, AD1, SA4; `packages/git/rust/src/driver.rs:244-264`, `:289-300`, `:347-353`, `:703-706`, `:741-749`, `:1314-1374`) | **Accept.** Decision 3 now uses a public, disk-only `fgos_git::main_checkout_root` cut out of `resolve_topology` (one copy; GIT/HARDEN review). Phase 2 keeps the `resolve_workspace_root` numbers as evidence only | plan D3, phase 1, 2, 6, 9 |
| RT2 | High | The root follows the process cwd, which can follow the model's `cd`, so the hook and the verbs may use different records (FM6, SA2; `.claude/settings.json:11`, `fixtures/hooks/claude/post-tool-use.json:4`) | **Accept.** Start directory is `CLAUDE_PROJECT_DIR` when set, else cwd. Phase 2 measures hook cwd and the variable after a tool `cd`. Host test from a subdirectory and with the variable set | plan D3, phase 2, 6 |
| RT3 | Critical | The breaker counts `lock-busy`; it is one racy file per project; it skips the directory-trust chain; a planted future time keeps it open; `on_exit` writes can hang the exit; config errors trip it (FM2, FM7, AD3, SA3; `shell.rs:235`, `:313-322`; `record/mod.rs:242`, `:562-592`) | **Accept**, except lost increments under concurrency, which are stated and accepted (they only delay opening). Only non-contention record errors and panics count; the trust-chain check comes first; the state is `openedAtMs`, computed with the loaded pause and a skew clamp; no write in `on_exit` | plan D11, phase 4, 6 |
| RT4 | High | The shim exits 3 (no activation, not ready) or 127 (missing), so "exit 0 on every path" stops at the shim (FM5; `packages/distribution/rust/src/shim.rs:25-34`) | **Accept in part.** The Claude row uses the guarded, no-`exec` form with `\|\| true`. The Codex row uses it if phase 2 P4 shows Codex runs a shell. An older release's "Unknown hook kind" remains owner question 2 | plan D14, phase 2, 7 |
| RT5 | High | Bounded claim: head-of-line blocking by a too-large oldest item; the pointer line outside the budget (FM3; `core/src/delivery.rs:267-277`, `:396-413`) | **Accept.** Skip and continue; reserve the pointer's length inside the bound; tests for both | plan D6, phase 3 |
| RT6 | High | Output bound: no margin; per-hook vs summed across sibling hooks unknown (this repository has other `PostToolUse` hooks); unit unclear for non-ASCII (AD7, SA5, FM3; `.claude/settings.json:7-13`) | **Accept** margin, sibling-hook repeat in the ladder, and a non-ASCII step. **Reject** keying the bound per version and making an untested version Stop-only: an untested version keeps draining by owner decision (spec §17, 2026-10-20), and a Codex hook cannot know its version without a spawn | plan D5, D6, phase 2, 3 |
| RT7 | High | The hop shell as a basename list from one machine (`dash`) breaks wherever `/bin/sh` is something else (AD6, FM10; `head.rs:97`; probe report `:45`) | **Accept.** The contract fact is `hookShell` (the path the CLI invokes), matched on `cmdline[0]` and `realpath`, with `measuredOn` naming the platform. **Reject** a positive doctor probe: it needs a live head and session file, which is beyond a read-only probe and the V5 row | plan D5, D7, phase 2, 3, 5 |
| RT8 | Medium | The Codex "start time earlier than the entry's" check is vacuous; a single head-executable basename is brittle (AD5, SA notes; probe report `:57`) | **Accept.** The check and its test are dropped; `headExecutables` is a list; the full exe path is recorded | plan D8, phase 5 |
| RT9 | Medium | Hook ownership by tail text, and whole-entry replacement, destroy sibling user hooks (SA8; `src/setup/agent-hooks.mjs:55-57`, `:239-259`, `:99-103`) | **Accept.** Install-side ownership is the exact canonical string; only our hook object is replaced; new tests for siblings in the same entry and for look-alike tails | plan D14, phase 7 |
| RT10 | High | Loader strictness: an unknown key kills the hook, and the breaker counts it; CFG will move the project file to YAML; a tracked config can set any value; about 26 defaults are written (SC7, AD2, SA1; Config spec §4, §12; `core/src/limits.rs:12-30`) | **Accept:** unknown keys are ignored (Config spec rule); config errors are not counted and are named by the verbs; the CFG lane is told, and the Config crate is used if it is on main. **Reject** range limits (a tracked `config.json` has the same trust as tracked code, and the spec signs no numbers) and skipping default registration (AGENTS.md install gate; Config spec §4 converts `registerConfigDefault` calls into descriptors) | plan D4, phase 1, 4 |
| RT11 | Critical | `Checkpoint::BoundedStep` fails the `== Checkpoint::Step` tests: notices are never delivered at a bounded step, and `wake:false` mail is hidden (SC1; `delivery.rs:258`, `:276`; `drain.rs:236`, `:251`) | **Accept.** The four equality sites become `takes_all_pending()` and `is_stop()`, plus a notice-under-bound test | phase 3 |
| RT12 | High | `HookCallLimits` has `deny_unknown_fields`, so the breaker and p95 keys would fail to load; the drift proof was "either/or" (SC2, SC8; `store/src/hook/limits.rs:31`; `core/tests/common/support.rs:19-50`) | **Accept.** Breaker keys go inside the `hook` object; `harness` keys are dropped before deserialising; one drift proof through a committed fixture that both Node and Rust read | plan D5, phase 3, 4, 7 |
| RT13 | High | Two hook entries coexist and the phase 6 tests duplicate `test_hook_entry.rs`; a host panic proof needs a test-only switch (SC5, SC6; `tests/test_hook_entry.rs:163-304`) | **Accept.** The example and its test file are retired in phase 6 with named owners; panic and budget proofs stay at store level; the host acceptance criterion is reworded | plan criteria, phase 4, 5, 6, 9 |
| RT14 | High | Unlisted `Ancestry`/`ShellInput` construction sites; `head_of` signature undecided; mirrored relation fields (SC4, AD4; `tests/head.rs:97`, `tests/head_finder.rs:69`, `tests/hook_shell.rs:46`, `examples/mailbox-test-hook.rs:22`, `:256`, `:272`) | **Accept.** Sites enumerated; one signature fixed; `Ancestry` holds the `Relation` whole | phase 5 |
| RT15 | High | Native-route consumers missing: `NATIVE_SUBCOMMANDS`, the projector request map, catalog count assertions, `subcommand-flag-drift.test.mjs:201`, root precedence over `resolve_target_root`, bodies starting with `--`; `wants_help_token` does not exist (SC3, AD8, SA note; `main.rs:62-95`, `:116-144`, `:251-262`, `:259`; `cli_projector.rs:85-118`; `catalog.rs:125`) | **Accept** all of these. **Reject** the sub-point that `emit_invocation_record` adds a write: it writes only when `FGOS_INVOCATION_RECORD_PATH` is set (`legacy_exec.rs:177-190`) | phase 6 |
| RT16 | Medium | The `inbox --claim` output path was left to the implementer (SC8); `--claim` to a redirected stdout loses mail (SA7) | **Accept** SC8: decided as `already_written`, with a named test, and stop-and-ask instead of a second raw branch. **Reject** SA7: spec §5.2 says `offered` is not "read", and a model that redirects its own output discards it as it could discard any text. A separate ack verb is outside the V5 row | plan D2, phase 6 |
| RT17 | High | A pending-but-ineligible drain writes `last_drain_at` on every call (held-back, in-flight or wake-false-at-Stop mail), so "write-free" covers only the empty case (FM4; `delivery.rs:396-413`, `:647-660`) | **Accept in part.** The claim is narrowed to "no pending mail", and T1/T2 measure the held-back case separately. The core rule is unchanged in V5 because status signal 9 depends on it; a miss goes to owner question 3 | phase 4, 8 |
| RT18 | High | `\| tee` hides the exit status; "about 40" calls gives a near-max p95; no pass condition; strace caveat (FM8, AD9) | **Accept.** Redirect and read the exit right after; N ≥ 80 steady calls, with the first call apart; pass on steady-state p95 ≤ 50 ms; a short run is a harness failure | plan criteria, live table, phase 8 |
| RT19 | Medium | Merging main at every phase end makes "done" a moving target (FM9) | **Reject.** This is the owner's explicit rule (board MAIL row, 10-21 22:58 and 23:05). Phase 9 already allows a narrow rerun when an end merge touched none of the rung's shared files | none |
| RT20 | Medium | The repeating pointer is a free per-call nudge an oversize sender controls (SA6; `core/src/frame.rs:150-171`) | **Reject** the fix: per-message state means a snapshot schema change, and an exact escaped size at claim needs the body under the lock. The pointer is fixed contract text, not peer text. The risk is recorded in spec §6.1 (phase 9) | phase 3 risk, phase 9 |
| RT21 | Medium | Honouring `CLAUDE_CONFIG_DIR` reverses a written threat stance without answering it; Observe returns empty with no `HOME` (SC9; `claude_head.rs:9-12`; `claude_transcripts.rs:136-143`) | **Accept.** A replacement threat statement goes into the module doc and spec §6.1; Observe's empty-result behaviour is kept | phase 5, 9 |

## Files modified

- `plan.md`: decisions 3, 4, 5, 6, 7, 8, 11, 13 and 14; acceptance criteria; live-call table; prior art.
- All nine phase files.

## Whole-plan consistency sweep

**Decision deltas:**

- disk-only `main_checkout_root`, with `CLAUDE_PROJECT_DIR` as the start directory;
- `hookShell` path in place of `hopShells`, and `headExecutables` as a list;
- the start-order check removed;
- skip-and-continue bounded claim with the pointer inside the bound, plus a margin;
- `takes_all_pending()` in place of `Checkpoint ==`;
- breaker counting narrowed, trust-checked, and with no `on_exit` write;
- unknown config keys ignored;
- guarded, no-`exec` Claude command, with exact-string ownership;
- the example retired in phase 6;
- `inbox --claim` through `already_written`;
- a T-case pass condition.

**Search.** All plan files were searched for the following terms: `resolve_workspace_root`, `hopShells`, `HOP_SHELLS`, `headExecutable` (singular), `start-order`, `ClaimBound`, `refusal.record`, `Pick one`, `about 40`, `--write` (selector), `counts in the breaker`, `on_exit` writes, `Switch the example`. What remains:

- `resolve_workspace_root` appears only as the rejected candidate and its evidence (plan prior art and D3; phase 2 step A; phase 9 §6.4);
- `HOP_SHELLS` appears only in its deletion step and the "V4 state" context;
- no other stale term remains.

**Cross-file checks.** The board announcement in phase 1 lists the new shared files: `packages/git/rust/src/{driver.rs,lib.rs}`, `docs/platform/git/spec.md`, the native-route test files and catalog tests, the routing-handoff contract, and the CFG note. The validation log is unchanged except where this log supersedes it: "`Checkpoint::BoundedStep` additive" is now qualified by RT11, and decision 3's resolver by RT1.

**Unresolved contradictions:** none.
