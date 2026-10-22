# Validation log: Mailbox V4 plan

## Session 1 — 2026-10-22

**Trigger:** `ak-plan validate` after drafting, run by the planning lead. The owner cannot be asked in this session, so every question was resolved from the spec, the code on branch `mailbox/v1-v3` (`9a53299e1`) and the reports; only owner-intent questions went to plan.md "Câu hỏi cho owner".
**Questions considered:** 8. **Owner-intent questions kept:** 1 (demo mode).

### Verification results (tier Full: 10 phases)

- Claims checked: 19 (grouped as listed). Verified: 16. Failed: 3 (fixed in the plan, below). Unverified: 0 left as plan facts; 4 facts are deliberately left to phase 2's probe and named there as such.
- Verified, with evidence:
  - `npm test` discovers only `*.test.mjs` (`scripts/run-tests.mjs:49` `TEST_FILE_SUFFIX`), so `test/live/*.live.mjs` never runs in it; `scripts/test-ownership-lint.mjs` scans only `test/direct`.
  - `BLIND_HIDDEN_ROOTS` today (`src/runner/dispatch/confinement/resources.mjs:26-32`) and its two owning tests (`test/runner/dispatch-confinement-blind.test.mjs:214`, `:224`); readers `src/runner/execution/handoff-refs.mjs:185,247`; `test/runner/execution/handoff-refs.test.mjs` exists.
  - The mailbox root is `<fgosDir>/runtime/mailbox` (`packages/mailbox/rust/store/src/record/paths.rs`, `RUNTIME_DIR` + `MAILBOX_DIR`); the board line `{fgosDir}/mailbox` (`efba97e1f`) is imprecise.
  - Hold API and drain API as listed in phase 1 (`record/mod.rs:286-410`, `hook/mod.rs`, `hook/drain.rs`); `Begun::state_changed`; `Reported::unchanged`; `WriterMismatch` in `begin` (V3 review H1 fix applied).
  - `cargo test` builds examples: `target/debug/examples/mailbox-record-cost` was produced by earlier `cargo test` runs (built 2026-10-22 15:00).
  - The recorder's `redact` reads only `^(\d+)-([A-Za-z]+)\.json$` (`callsOf`, `scripts/record-mailbox-hook-fixtures.mjs:430-436`), so a `<n>-<event>.proc.json` file is never redacted into fixtures.
  - `claude --help` lists `--session-id <uuid>`, `--settings`, `--setting-sources`; `codex exec --help` lists `--dangerously-bypass-hook-trust`, `--skip-git-repo-check`.
  - Installed versions: Claude Code 2.1.308 (contract lists 2.1.307), Codex 0.161.0 (listed).
  - `fgos_process::facts::identity_of(pid) -> Option<ProcTuple>`; `fgos_session_identity::resolve_current(Option<&Path>)` with env order `FGOS_SESSION_ID`, `CODEX_THREAD_ID`, `CLAUDE_CODE_SESSION_ID`; `fgos-session-identity` is already a dev-dependency of `fgos-mailbox`.
  - The core accepts an own suffix only of two `[0-9a-z]` characters (`core/src/names.rs:45-50`), so passing Claude's derived suffix is safe.
  - The frame contract has no report, refusal or inbox text; `frame.rs` has private `section`/`fill` (`:53`, `:62`); section existence is proven in `core/tests/frame.rs:289`.
  - Limits contract keys today: `stopBlock.max`, `hook.lockWaitMs` are the only `hook` keys; `budgetMs` is in spec §12 but not in the contract.
  - Stdin cap precedent: `packages/terminal-control/rust/src/route.rs:23` `MAX_STDIN = 1024 * 1024`.
  - Claude config-directory rule precedent: `packages/observe/rust/src/sources/claude_transcripts.rs:136`.
  - `codex` in the owner's shell is a zsh function needing an account; the binary is `~/.local/bin/codex`.
- Failed and fixed:
  1. Phase 6 test 5 relied on "a V2 helper child that holds the lock" in `tests/common/record.rs`; the lock-holding role lives inside `record_contention.rs` (`hold-at-locked`), and the busy-lock behaviour is already owned there. Fixed: the shell's test uses a newer-schema snapshot (same `RecordError` arm) and names the owning V2 test.
  2. Phase 6 assumed a claimed item carries its body size; `ClaimedItem` has none (`core/src/delivery.rs:157-169`), the size is `Header.body_bytes`. Fixed: hold 1 collects the sizes.
  3. Phase 3 hedged on whether `handoff-refs.test.mjs` exists; it does. Fixed.

### Questions and resolutions

1. **[Architecture]** Where do `send` and `inbox` live in V4, given the product verbs are `apps/fgos` wiring (V5)? Options: example-only logic | crate functions + thin example (Recommended) | build `apps/fgos` verbs now. **Resolved:** crate functions (decision 1); building the product verbs needs the main-checkout resolver (V5 prerequisite). Evidence: spec §4.1, §14 V5 "Waits for".
2. **[Assumptions]** How does a model's reply reach the example, when the frame says `fgos mailbox send`? Options: change the frame text for the test | a fixture `fgos` on `PATH` (Recommended) | absolute path in prompts. **Resolved:** fixture wrapper (decision 3); changing the frame would test a different text than the product's.
3. **[Scope]** Is the Claude scoped-socket idle wake in V4? **Resolved:** no; the V4 row lists stop gate, mid-step, hook ran, `send`, `inbox`; tiers stay `turn` (decision 5).
4. **[Risk]** Version pin: the installed Claude Code is not in `testedAgainst`. Options: list it without recording | re-record with the V3 recorder (Recommended) | run the suite as untested. **Resolved:** re-record (phase 2, decision 13); the contract's own rule forbids listing an unrecorded version.
5. **[Assumptions]** Which process is the head under `claude -p`? **Resolved:** not assumed; phase 2 probes it in the same recorder runs (no extra call) and phase 5 has a default and a fallback rule.
6. **[Risk]** V2 review H1 (misdelivery to a live head whose name the dead name prefixes) is open. **Resolved:** phase 1 gate; V4 does not fix V2 findings.
7. **[Tradeoffs]** Output-size probe at ~820 KB, one run or two? **Resolved:** two (L3a, L3b, decision 14); one injected context of that size likely fills the model window, so the Stop-reason channel would not be reached in the same run.
8. **[Owner intent]** Demo in print mode only, or also interactive? **Kept for the owner** (plan.md Câu 1), default (a) print mode.

### Confirmed decisions

Decisions 1–14 in plan.md.

### Impact on phases

- Phase 3: exact test file named.
- Phase 6: test 5 replaced; body sizes from headers.
- Phase 7: payload and writer key of the process tests stated.

### Whole-plan consistency sweep

- Searched all plan files for `L3 ` (now L3a/L3b), "question 2" (removed; now decision 14), "phase 8" as the place of the guard move (now phase 2), `adapters::claude::head` (now `adapters::claude_head`), `LockWaitLimits` (renamed in phase 4, used consistently), "12 invocations" (now 13). No contradiction left.
- Live-call totals agree: plan.md table 13 expected (5 + 4 + 4), phase 10's closing line 13, phase files' front matter 5, 4, 4.

**Recommendation:** proceed to red-team, then implementation.
