---
title: "HARDEN T3 part 04a sub-plan: Agent protocol and Observe"
description: "Implementation sub-plan for HARDEN layer T3 part 04a: land the red tests with their fixes, one hardened shard door for every Observe store and the friction fixes, blocked(usage-limit) and a bounded outbox in the agent protocol, plumbing deletions, a typed run scan, specs; Q3 gated in its own last phase; then verify and land after the Work cutover."
status: pending
priority: P1
effort: "~5.75d work, ~4.25d lead time (P01 0.25d; P02 1.5d ∥ P03 1d; P04 1.5d; P05 0.5d; P06 0.5d; verify+land 0.5d); gated P07 +0.5d only if owner Q3 = remove"
branch: "main (plan only; work runs on track branch harden/t3a-agent-protocol-observe, one linked worktree per phase lead)"
tags: [harden, foundation, rust, agent-protocol, observe, run-result, doctor, tests]
blockedBy: []
blocks: [261021-1118-harden-low-layers-bottom-up]
created: 2026-10-24
---

# HARDEN T3 part 04a sub-plan: Agent protocol and Observe

Main **`42c5a0a55`** (2026-10-24 20:50 Asia/Saigon: the Work cutover code merged while this plan was written). Every `file:line` below was re-checked on that commit; files the cutover rewrote (`src/setup/registrations.mjs`, `scripts/regenerate-observe-fixtures.mjs`, `test/setup/observe-doctor-checks.test.mjs`) were re-pinned after it. Step 4 of the per-layer loop of [the HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md), for [phase 04](../261021-1118-harden-low-layers-bottom-up/phase-04-t3-agent-protocol-observe-event-store.md) part 04a.

**Binding inputs:** [arbitration](../reports/council-261024-1947-harden-t3a-arbitration.md) (§2 shapes owner-approved, decision 30; §3 verdicts; §4 big-lead decisions and fix order; §5 hand-offs); owner decisions 30–32 in the parent plan (Q2 = (b); Q4 none; Q5 land after the Work cutover; **Q3 open**); seat reports [correctness](../reports/council-261024-1935-harden-t3a-seat-correctness.md), [speed](../reports/council-261024-1935-harden-t3a-seat-speed.md), [simplicity](../reports/council-261024-1935-harden-t3a-seat-simplicity.md), [red-team](../reports/council-261024-1935-harden-t3a-seat-redteam.md); [baseline](../reports/research-261024-1927-harden-t3a-baseline.md); red tests on `origin/harden/t3a-red-tests` (report `plans/reports/lead-261024-1953-harden-t3a-red-tests.md` on that branch).

## Outcome

After 04a:
- **Agent protocol** names `blocked(usage-limit)` in terminal mode through one rule for every path, renders the receipt reason itself, reads the outbox bounded and no-follow without hanging, waits only through `pause`, anchors login on screens, and has no dead port surface (`StdinPolicy`, `read`/`activity`, five identical structs, `to_json`, `TerminalBlock`). `classify` stays, ready for T4 to wire.
- **Observe** has one shard door for friction, case, eval and snapshot: one bad byte no longer stops a store, a torn line no longer swallows the next record, symlinked store directories and shards are refused everywhere, migration never re-appends, settlement compares instants, writes no longer read the legacy event log, the Node client is ≈ 70 lines with no lists, and none of `FGOS_NOW`, `FGOS_CALLER_PID`, `FGOS_GIT_HEAD` is read in product code.
- `metrics coverage|runs|harness` cost ≈ ⅓ of today; the doctor parses `result.json` once.
- Specs, contracts and CHANGELOG describe the code. Size ceilings: see "Size" (two are at risk by estimate; named, not hidden).

## Facts (verified on `42c5a0a55`)

**Agent protocol**
- F-A1. Direct `classify` is unwired: the supervisor uses only `activity_from` (`packages/run-supervisor/rust/src/supervise.rs:252`) and `newest_result` (`:92`); `adapter_for`/`DirectAdapter` imported at `:21`, field `:188`.
- F-A2. A quota screen is `NeedsHuman` in terminal mode (`packages/agent-protocol/rust/src/terminal/mod.rs:593-601`); `TerminalBlock` has only `TrustDialog | Login` (`:25-39`); the contract says so on purpose (`terminal-outcomes.v1.json:15`); `BlockedReason` already has `UsageLimit` (`outcome.rs:6-11`).
- F-A3. The receipt reason is rendered by the supervisor (`supervise/terminal.rs:538-545`, `format!("terminal:blocked:{}", reason.as_str())`), plus four literal stop reasons outside the contract (`:54`, `:665`, `:709`, `:742`). `TerminalOutcome::to_json` (`terminal/mod.rs:52-68`) is test-only.
- F-A4. `FsOutbox` reads with `std::fs::read` (`terminal/mod.rs:155,175,180`) and sleeps outside `pause` (`:160`, `:179`); `newest_complete` checks length only (`:181`), `newest_unreadable` bytes and mtime (`:161`).
- F-A5. `open_beneath` + `read(max)` exist (`packages/durable-file/rust/src/beneath.rs:255`, `:120-131`; `O_NOFOLLOW|O_NONBLOCK`, regular only, `TooLarge`), Unix only (`lib.rs:421-426`).
- F-A6. Login matching is substring over the bottom 12 screen lines (`terminal/mod.rs:230-235`, `:257-260`; `direct/mod.rs:118-149`); quota is anchored (`direct/mod.rs:151-157`). A measured **direct** vector has a login wording mid-line (agy glog line, `contracts/fixtures/direct/agy/vectors.json`).
- F-A7. `newest_result` refuses `+` only (`direct/mod.rs:76`).
- F-A8. Unreadable screen in the unruled wait returns `Ready` (`terminal/mod.rs:386-389`).
- F-A9. Dead surface: `AgentIo::read`/`activity` (`port.rs:37-39`; stubs `supervise/terminal.rs:482-488`); `StdinPolicy` (`outcome.rs:31`) while stdin is the gate's (`gate.rs:200-205`); Codex override equals the default (`direct/codex.rs`); `Activity::Event` read only via `is_active` (`supervise.rs:252`).
- F-A10. Settle re-reads the pane and matches six wide patterns (`src/run-supervisor/steps/settle-attempt.mjs:84-129`); `terminal-cutover.test.mjs:112-123` relies on it for a `■ You've hit your usage limit…` screen the anchored Rust list does not match; no captured claude terminal quota screen exists in the repo (only fake screens: `plans/261002-1339-…/reports/acceptance-herdr.md:80`).

**Observe**
- F-O1. Shared reader aborts a whole store on one invalid UTF-8 line (`packages/observe/rust/src/shard.rs:43-46`), drops unparsable lines silently (`:51`), follows symlinks (`:42` `is_file`).
- F-O2. `run_lazy_migration` reads the store with `unwrap_or_default()` (`friction.rs:141`); `record`/`resolve` call it with `let _ =` (`:291`, `:342`); `friction migrate` runs it unlocked (`friction_cli.rs:38-44`).
- F-O3. Three unhardened appenders: `friction.rs:119-127` (`writeln!`), `case_journal.rs:214-228`, `metrics_cli/snapshot.rs:69-79`; the migration's own tmp-file append (`friction.rs:266-276`). The hardened pair is `eval_journal.rs:173-228` (`open_append_shard`) and `:233-258` (`read_bounded_line`); its Windows branch uses `create_new(true)` (`:206-220`).
- F-O4. Settlement compares stamp strings (`friction.rs:473`, `:534`; `list --since` `:414`); legacy migration writes `<ts>~` resolve stamps (`:223-224`); on-disk stamps today are all millis + `Z` (1 362 lines checked).
- F-O5. `FGOS_NOW` read in product code (`store_lock.rs:35-43`), `FGOS_CALLER_PID` (`friction.rs:40-43`); users: `scripts/regenerate-observe-fixtures.mjs:206,233-312`, `tests/eval_journal_test.rs:295`.
- F-O6. Node client keeps four drifted value lists and defaults (`src/observe/friction-client.mjs:12-28,64-88,152-165`); 29 call sites pass `layer`/`errorClass`/`disposition`, 6 pass `producer`.
- F-O7. A validation refusal and a store failure both exit 1 with `fgos: error: invocation failed: provider failed: <text>` (run 10-24 against the activated host on a scratch root); `invokeHost` exposes `status`, `stderr`, `timedOut` (`src/util/host-bin.mjs:118-129`).
- F-O8. `invokeHost` kills the host at 5 s (`host-bin.mjs:10`), the store lock waits 5 s (`store_lock.rs:10`).
- F-O9. `observe-host-resolvable` probes `friction ping` (reads nothing) by raw `execFileSync` with no timeout (`src/setup/registrations.mjs:5801-5834`, call `:5812`), and passes without `ok` (`:5823-5826`).
- F-O10. The doctor's coverage row re-implements admission in Node (`registrations.mjs:5996-6017`, recency helper `:5955-5966`; `src/runner/dispatch/assignment-layout.mjs:96-138`).
- F-O11. The run scan parses each `result.json` into `Value` (`packages/run-result/rust/src/lib.rs:568-576`).
- F-O12. `store_lock_multiprocess.rs:163` sleeps 31 s (`:169`) to prove an expiry removed in `8549e77f1` is absent; holder-lock owns exclusion and kill-frees (`packages/holder-lock/rust/tests/multiprocess.rs:46`, `:62`).

**Prior art reused (AGENTS.md "prior art before design"):** eval's hardened pair (moved, not rewritten); `fgos_durable_file::open_beneath` (T0 door); Identity's trusted-main-root pattern (`packages/identity/rust/src/project.rs:154,170`); `windows-sys` (workspace dep, `Cargo.toml:59`); `BlockedReason` (already in the crate). Missing and built: the heal-before-append step, the Windows reparse-point check, the instant comparator with file-order ties, `flags.rs`.

## Phases

| # | Phase | Depends | Parallel | Red tests turned green | Status |
|---|---|---|---|---|---|
| 01 | [Red-test intake](phase-01-red-test-intake.md) | — | first | routes them | pending |
| 02 | [Observe shard door, friction fixes, thin client](phase-02-observe-shard-door-and-friction.md) | 01 | ∥ 03 | 1a, 1b, 2, 3, 4, 5a (5b, 5c folded) + main-flaky lifecycle test | pending |
| 03 | [Agent-protocol contract and outbox](phase-03-agent-protocol-contract-and-outbox.md) | 01 | ∥ 02 | 6a, 6b, 7 | pending |
| 04 | [Observe plumbing deletions + Windows shard door](phase-04-observe-plumbing-deletions.md) | 02, 03 (the Windows helper only) | — | — | pending |
| 05 | [Run-scan typed read + coverage row (Q2 b)](phase-05-run-scan-typed-read-and-coverage-row.md) | 02, 04 | — | — | pending |
| 06 | [Specs and CHANGELOG](phase-06-specs-and-changelog.md) | 02–05 | alone | — | pending |
| 07 | [**GATED: owner Q3** — constant scorecard sections](phase-07-gated-q3-scorecard-constants.md) | 04 + Q3 = remove | after 04; never blocks 01–06 or landing | — | gated |

Red test 8 (RT-01 settle half, commits `129230049` + `30cb75484`) is **not** landed in 04a: handed to T4 with its fix (D-T3A-1).

## Parallelism and shared files

- **Lanes of worktrees:** agent-protocol lane = phase 03 (`packages/agent-protocol/**`, `packages/durable-file/rust/src/lib.rs` (Windows helper only), `packages/run-supervisor/rust/src/{supervise.rs,supervise/terminal.rs}`, `test/run-supervisor/contracts-terminal.test.mjs`). Observe lane = 02 → 04 → 05 in sequence (they share `packages/observe/**`, `src/setup/registrations.mjs`, `packages/run-result/**`, `apps/fgos/src/wiring/*`). The file sets are disjoint; 02 and 03 run in parallel. The one join: phase 04 starts after 03 is merged into the track branch, because its Windows shard door uses 03's `fgos-durable-file` helper (one door for both crates, red-team scope F2).
- **Generated shared files** — `packages/git/contracts/mutation-census.v1.json` and `Cargo.lock`: every phase regenerates them in its own commit (`node scripts/git-one-door-scan.mjs --root . --write-census`; any `cargo` build); on merging a phase into the track branch the big lead resolves a conflict in either **only by regenerating**, never by hand.
- **Hand-written shared files** — `CHANGELOG.md`, `docs/specs/observe.md`, `docs/platform/agent-protocol/spec.md`, `docs/platform/component-boundary.md`, `docs/platform/holder-lock/spec.md`, `docs/specs/reading-map.md`: written **only** by phase 06 (and by 07 if Q3 is answered after 06). Phases 02–05 list their user-visible changes in their reports for phase 06 to write.
- Merge order into the track branch: 02 and 03 as they finish, then 04, 05, 06; 07 whenever Q3 allows.

## Size (estimates; HARDEN commits only; measured Δ goes in each phase report)

| Phase | agent-protocol Rust src | Observe Rust src | Other Rust (T4/T5/apps) | Node | Tests |
|---|---|---|---|---|---|
| 02 | 0 | −50 (±40) | 0 | −120 | +190 |
| 03 | −55 | 0 | run-supervisor −10, durable-file +25 | 0 | +110 |
| 04 | 0 | −320 | apps −40, run-result −10 | 0 | −80 |
| 05 | 0 | 0 | run-result +40 | −45 | −90 |
| 06 | 0 | 0 | 0 | 0 | 0 |
| **Sum without Q3** | **−55** | **−370** | **+15** | **−165** | **+130** (Observe-owned: +20) |
| Ceiling (arbitration §2) | ≤ −60 **✗ at risk (−5)** | ≤ −700 **✗ at risk** | supervisor ≤ +20 ✓ | ≤ −120 ✓ | Observe ≤ −150 **✗ at risk** |
| 07 (Q3 = remove) | 0 | −560 | 0 | 0 | −335 |
| **Sum with Q3** | −55 | −930 | +15 | −165 | −205 (Observe-owned: −315) |
| Ceiling with Q3 | | ≤ −1 300 **✗ at risk** | | | ✓ |

Notes: the red-team round added code that the first draft did not have (directory preflight on every store, a read+append descriptor and torn-tail policy, the Windows helper in `fgos-durable-file`, an elapsed-time stability loop, a null-preserving typed read, the kept directory comparison in the doctor, more proofs); each is the fix of a reproduced or reasoned failure, not a feature. The Observe tests line counts Observe-owned Rust and Node tests (02: +190, 04: −80, 05: −90 → +20 against ≤ −150); the agent-protocol +110 is outside that ceiling. The red tests (≈ +320 as written) are the cost of the reproduction rule (loop step 9); phase 02 folds the three per-store symlink tests into the door's proofs. Contract fixtures (`contracts/fixtures/**`, ≈ +60 JSON lines) are listed apart. D17 (≈ −780, WORK, H33) is not counted here. My count of the listed deletions does not reach the arbitration's −700 Observe ceiling (simplicity's non-gated Observe rows sum to ≈ −445); see Unresolved questions.

## Decisions made inside the frame (planner; each with its evidence)

- **D-T3A-1. The settle change that turns RT-01 green waits for T4; 04a leaves its path clear.** Evidence:
  1. Arbitration §4.1 already routes a red test that lives in T4 code to T4 "with the fix"; the RT-01 red test lives in `test/run-supervisor/attempt-steps.test.mjs` and its fix in `src/run-supervisor/steps/settle-attempt.mjs:103-129` (T4's file, arbitration §5 T4 row).
  2. Turning it green means deleting the Node screen judging. Today that judging is the only thing that recognises a claude terminal quota screen: Rust's anchored quota list has codex/agy wordings only (`direct/mod.rs:151-157`), no captured claude terminal quota screen exists (only fake ones, F-A10), and the arbitration's wording rule admits a wording only with a recorded vector. Deleting it now trades a false quarantine for a missed rotation.
  3. `test/run-supervisor/terminal-cutover.test.mjs:112-123` would go red for the same reason (its `■ You've hit…` screen is not anchored).
  
  What 04a does so T4's change is a pure Node table swap: one rule names `usage-limit` on every terminal path; the reason renderer lives in the protocol and emits `terminal:blocked:usage-limit|login|trust-dialog` and `terminal:needs-human`; login is anchored (removes the RT-09 half of RT-01). T4's prerequisite: a captured claude (and codex TUI) quota screen added as protocol vectors, which then decide the `■` case.
- **D-T3A-2. The reason renderer moves with its one call site in 04a** (`supervise/terminal.rs:538-545` → `TerminalOutcome::receipt_reason`). L10: two renderers must not coexist; the swap is mechanical (≈ −13 lines in T4's crate, inside the +20 ceiling). This narrows arbitration §5's T4 row to the direct arm plus `classify` wiring. The direct arm is not added in 04a (it would be dead until T4).
- **D-T3A-3. One block enum:** `TerminalBlock` is deleted for `BlockedReason` (simplicity F5); adding `UsageLimit` made them identical.
- **D-T3A-4. Login anchoring is per window:** terminal screens anchor at line start (agent text is on screen); direct mode keeps substring matching in the last 5 capture lines, the CLI's own error region, because a measured direct vector has the wording mid-line (F-A6). Acceptance by vectors.
- **D-T3A-5. Contract version stays 1** for `terminal-outcomes`: the consumer set is closed and moves in the same commit; the receipt's `reason` is free text (`packages/run-supervisor/contracts/receipt.v1.json:11`).
- **D-T3A-6. B-A4 returns `Unverified`, not `NotReady`:** same wire outcome, honest name; `NotReady` would stop typing into a pane whose screen could not be read, a delivery-behaviour change that belongs to the owner, not to a hardening pass (RUL104).
- **D-T3A-7. Observe lock wait 5 s → 4 s** so the host names `observe-lock-timeout` before `invokeHost` kills it at 5 s (F-O8); the root resolve runs before the lock; phase 02 measures the pre/post-lock p99 and stops to ask if 4 s no longer fits. Rejected alternative: a per-call timeout option on `invokeHost` (a new parameter on a shared helper).
- **D-T3A-8. Host refusals are named `friction-invalid-input:`; `--producer` stays required in Rust and the client keeps its one `producer ?? 'work'` default.** Answers the arbitration's open question "can `invokeHost` surface a refusal code": not today (F-O7). The prefix follows the store's existing named errors (`observe-lock-timeout:`, `store_lock.rs:14`); Node matches it only on the first stderr line, anchored after `provider failed: `, and no Observe error writes a path or file content before it. The producer default stays in Node because moving it would change the declared CLI contract (`src/cli/command-registry.mjs:264`, `command-routes.json:386`) and the attribution of direct CLI calls; this is the one recorded deviation from arbitration §2.2 "no defaults" (red-team scope F1).
- **D-T3A-9. Red tests that duplicate the door's proofs are folded before landing** (principle 8): 1a and 2 become `shard.rs` door tests; 5b and 5c are not landed (owner: the door's symlink case and `tests/eval_journal_test.rs:360`); 5a stays as the one wiring proof for a non-eval store.
- **D-T3A-10. Root rule reuses Identity's pattern** (Git `trusted_main_root`), applied once per Observe invocation before the lock, with three named outcomes (repository → main root; not a repository → requested root; resolver error → `observe-root-unresolved:`, never a silent downgrade) and a stop-and-ask gate at +10 ms p50. The host's own walk (`apps/fgos/src/main.rs:128-148`) stays T9's (H17).
- **D-T3A-13. One Windows no-reparse open in `fgos-durable-file`**, used by the outbox (phase 03) and the shard door (phase 04): design principle 2, shared primitives live in the lowest layer; replaces two different copies the first draft had.
- **D-T3A-14. Settlement ties by file order only in session-named shards;** `pid-*` shards (not unique across machines, RT-21) never settle on an equal instant.
- **D-T3A-11. RT-02's supervisor stall gets no second test:** the supervisor reaches the FIFO only through `FsOutbox` (`supervise/terminal.rs:658`, `:703`), so the protocol-level red test 6a is its one owning proof (principle 8). B-A1's "screen changed" red test is T4's, written with T4's settle change.
- **D-T3A-12. The holder-lock "past 30 s" question** (arbitration unresolved): no test owns it because no expiry mechanism exists to test (`store_lock.rs:1-5`; `rg -i "expir|ttl"` finds only that comment); the 31 s test is retired naming holder-lock `multiprocess.rs:62` as owner of "a live holder excludes a taker".

## Hand-offs (recorded by the big lead in the receiving plan the same turn)

| To | What | Change against arbitration §5 |
|---|---|---|
| T4 (parent phase 05, "Received") | Red test 8 (`129230049`, `30cb75484` on `origin/harden/t3a-red-tests`) and its fix: settle maps `terminal:blocked:usage-limit|login` → `provider-limit`, `terminal:blocked:trust-dialog`/`terminal:needs-human` → `blocked`, deleting `settle-attempt.mjs:103-129`'s screen judging. Prerequisite: captured claude and codex-TUI quota screens as protocol vectors; then `terminal-cutover.test.mjs:112-123` is re-pointed at a captured screen. Write B-A1's "screen changed" red test. Wire `classify` and add the `direct:blocked:<reason>` arm to the protocol renderer. | Renderer call for terminal already wired by 04a (D-T3A-2) |
| T5 (parent phase 06) | As arbitration §5 (B-A5), plus: the Node readers of the outbox (`src/runner/dispatch/worker-artifacts.mjs:39-62,75`; `src/run-supervisor/steps/settle-attempt.mjs:186,197`) still follow symlinks, read unbounded and accept leading-zero numbers (`Number("007")`) that the protocol now refuses; B-A5's unification must use the protocol's rule and a regular-file check (red-team security F1). Also: 04a changed `run-result`'s scan to a typed read (`lib.rs:568`), deleted `UnitSummarySource`'s `ObservationSource` impl, and deleted Node `projectRunEligibility`/`isRfc3339Instant` from `src/runner/dispatch/assignment-layout.mjs` | adds the outbox-reader, D14 and Q2 (b) notes |
| WORK (`claude-uygd@fg-server2`) | Told **before** phase 02 merges to main: `friction record|resolve` no longer run the lazy migration; `friction migrate` locks and fails closed. H33 (D17) unchanged | none |
| Identity owner | RT-21 (`pid-<N>` shard names not unique across machines) | none |
| DOC (`forgentx-5f`) | Phase 06's file list before merge | none |

## On-disk and contract formats

- Friction, case, eval, snapshot shard lines: **unchanged** JSON. Healing adds a `\n` to a torn shard; the previous release reads it.
- Receipt `reason` gains the value `terminal:blocked:usage-limit`; the previous release's settle step accepts it through the same regex (`settle-attempt.mjs:126`) and settles it as today.
- `terminal-outcomes.v1.json` enum widened, `wire.usageLimit` removed; `agent-protocol.v1.json` loses `io.read`, `io.activity`, the stdin decision. No persisted data uses these.
- No `~/.fgos/config.json` change; no config default, env var or doctor row added (two env reads deleted). `fgos setup` untouched.

## Landing (owner decision 32)

1. **Precondition:** WORK confirms the Work cutover has *landed* (code merged `42c5a0a55` and activated on fg-server2), and the landing window is agreed with WORK and TEST on the board.
2. Tell WORK before the merge (hand-off row).
3. Big lead runs the **Verify step** on the final track tip.
4. Merge `harden/t3a-agent-protocol-observe` to main on fg-server2; build the release; activate on `~/projects/forgent` (fg-server2); `fgos doctor` (observe rows and `agent-cli-project-trusted` unchanged in status) and a smoke: `fgos friction rank --limit 1`, `fgos metrics coverage` (timed), one `fgos run` read-only unit in terminal mode if a seat is free.
5. Write the owner-machine guide (`fgos convention path` for its name) for the three workspaces (forgentX, mdview, mcp-skill-hub): pull, build/stage/activate, `fgos doctor`, the same smoke; link it on the board. The owner runs it at a time the owner names.
6. Re-measure (loop step 8) on the activated release, same machine and load class as the baseline (routes of baseline §2; Observe test wall time) and write the before/after table in the closing report.

## Verify step (big lead)

On the final track tip, in a window agreed with TEST on the board: `npm test` and `cargo test --workspace` (private `CARGO_TARGET_DIR` under `/home/vantt/projects/forgent-worktrees/`), plus the land gates of every phase (`cargo check --all-targets` for every touched crate on `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`, `cargo clippy … -D warnings`, `node scripts/git-one-door-scan.mjs --root .` count 5). Read the `ERROR` lines of `run-tests`, not only its exit code (leak and clone checks can fail it). `detect_changes` (GitNexus, if present per the impact-analysis gate) against main.

## Risks (plan-wide; each phase lists its own)

| Risk | L × I | Mitigation |
|---|---|---|
| A wording or settle change shifts which account gets quarantined | M × H | 04a changes no settle behaviour (D-T3A-1); the receipt text changes only for anchored quota lines |
| Size ceilings missed (Observe src, Observe tests) | H × M | Named here, measured per phase; big lead asks the owner or restates (Unresolved) |
| Observe lane is serial (02 → 04 → 05) | M × M | Agent-protocol lane runs beside it; 04's steps are verb-by-verb and can be split across two leads only after 02 merges |
| A parallel lane (DOC, WORK follow-ups, T1/T2 leftovers) edits a shared file | M × M | Shared-file rules above; board row for this lane |
| Root rule cost per write | M × M | Stop-and-ask gate (phase 02 step 7) |

## Rollback

- Before the next layer merges: revert the merge commit on main, re-activate the previous release on fg-server2 and, if already landed there, on the owner machine's three workspaces; record the revert SHA (a re-merge reverts the revert first).
- After T4 merged on top: roll forward with a fix; never revert 04a under T4.
- No data migration to undo (formats above).

## Done when

- Red tests 1a, 1b, 2, 3, 4, 5a, 6a, 6b, 7 green on main; red test 8 recorded in T4's "Received".
- `npm test` and `cargo test --workspace` green; land gates green; census count 5.
- Doctor rows of the layer: 4 Observe rows still present (none added); every fail/warn condition kept or named as removed by owner decision 31.
- `fgos metrics coverage` p50 ≤ 0.35 s warm on the activated release; `store_lock_multiprocess` < 3 s.
- Measured Δ per phase reported against the table above; closing report written.

## Red Team Review

### Session — 2026-10-24 21:00–21:20 (four reviewers in parallel, read-only, sonnet: failure modes / flow tracer, assumptions / scope auditor, security / fact checker, scope & complexity / contract verifier; returned in-session, no report files)

35 findings raised (8 + 10 + 9 + 8). After de-duplication, 21 remain; every one carried `file:line` evidence, and the planner re-checked the decisive citations on `42c5a0a55` before ruling. **Accepted 15 (3 modified), rejected 6.** No user review round: the planner cannot ask the owner, so the dispositions below are proposals for the big lead.

| # | Finding (reviewers) | Sev | Disposition | Where applied / why rejected |
|---|---|---|---|---|
| 1 | Terminal login anchoring breaks recorded omp (`Warning: No default model…`, `terminal/omp/login-needed.txt:10`) and claude (`Invalid API key · Please run /login`) screens (assumptions F1) | Critical | Accept | Phase 03 req 3: two named matchers, prefix set `error/warning/fatal`, explicit start-phrase table, step-2 gate over every recorded vector and capture |
| 2 | Shard door guards only the leaf; `.fgos/observe/<store>` itself may be a planted symlink (`shard.rs:24,42`) (security F2) | Critical | Accept (modified) | Phase 02 req 1: eval's per-component directory preflight (`eval_journal.rs:145-170`) for every store, no-follow entry checks; residual race named. `openat`-relative appends rejected: they need a new `durable-file` write API (RUL104) |
| 3 | Fail-closed migration on invalid lines + heal = permanent dead end the doctor points at (`registrations.mjs:5720`) (failure F1) | High | Accept | Phase 02 req 2: fail closed on read errors only; invalid lines skipped and named |
| 4 | Legacy `~` stamps and free-text `kind@ts` resolve stamps break instant settlement (`friction.rs:221-224`) (failure F2) | High | Accept | Phase 02 req 3: unparsable resolve stamp settles earlier records of the subject in its shard; test over both legacy branches |
| 5 | Typed run-scan struct turns explicit `null` into absent and non-object results into `unparseable` (`run-result lib.rs:196-202,222`) (failure F6, assumptions F2) | High | Accept | Phase 05 req 1: null-preserving map visitor, non-object passes through unchanged, full key list, four fixtures, byte-identical output check |
| 6 | Root resolver has error outcomes and costs a git floor probe (`driver.rs:339-351,436-451`) (assumptions F3, security F8) | High | Accept | Phase 02 req 7: three named outcomes, resolve before the lock, gate on p50 and p99 |
| 7 | `--producer` optional in Rust contradicts the CLI contract (`command-registry.mjs:264`, `command-routes.json:386`) (scope F1, assumptions F5) | High | Accept (modified) | Phase 02 req 9–10: stays required in Rust; client keeps the one default; missing-flag errors prefixed; client rethrows `StoreError` (validation) |
| 8 | Two divergent Windows no-follow copies; outbox fallback follows links (scope F2, security F3) | High | Accept | D-T3A-13: one `open_no_reparse` in `fgos-durable-file` (phase 03), used by the shard door in phase 04; phase 04 now depends on 03 |
| 9 | Node outbox readers still follow links, read unbounded, accept `007` (`worker-artifacts.mjs:39-62,75`) (security F1) | High | Accept as hand-off | T5 row: B-A5 unification uses the protocol's rule plus a regular-file check; Node readers are T5's files |
| 10 | Usage-limit in `classify_blocked` changes banner/ready-gate/unruled paths (`terminal/mod.rs:288,310,390`) (failure F4) | Medium | Accept | Phase 03 req 2: quota only on the two stop paths |
| 11 | Stability check degenerates when `TermIo::pause` returns early on finish (`supervise/terminal.rs:524-534`) (failure F5, assumptions F10) | Medium | Accept | Phase 03 req 5: elapsed-time loop on `now_ms`, cut-short window is not stable, two proofs, all `Outbox` implementers listed |
| 12 | Heal needs a read on the same descriptor, under the lock, own shard only; per-store policy (failure F7, security F6) | Medium | Accept | Phase 02 req 1: read+append descriptor, under the store lock, own writer shard, `Heal`/`Refuse` policy (eval `Refuse`) |
| 13 | File-order ties assume unique shard names; `pid-*` collides across machines (failure F8) | Medium | Accept | Phase 02 req 3, D-T3A-14 |
| 14 | `read_all_json` callers outside the file list (`entropy.rs:103`, `fixture_test.rs`); OpenOptions criterion unmeetable (assumptions F7) | Medium | Accept | Phase 02 req 1, Files, success criteria |
| 15 | Phase 05 misses `assignment-layout.test.mjs:117`; dropping the directory comparison exceeds decision 31 (assumptions F8) | Medium | Accept | Phase 05 req 3: directory comparison kept (not admission); `:117` adjusted; only `:260` retired from the doctor tests |
| 16 | `FGOS_GIT_HEAD` is the same test switch; regenerator must normalise derived fields and check order (assumptions F9) | Medium | Accept | Phase 02 req 5 |
| 17 | Flag literals must stay in verb files for the drift test; newly accepted flags need schema entries (assumptions F6) | Medium | Accept | Phase 02 req 6, phase 04 req 11 |
| 18 | `toReceiptReason` is prose, not a list (`terminal-outcomes.v1.json:19`) (scope F5) | Medium | Accept | Phase 03 req 8/10: prose names every reason, shape unchanged, substring test |
| 19 | Doctor row description still says `friction ping` (`registrations.mjs:6034`) (scope F8, first half) | Medium | Accept | Phase 02 req 11 |
| 20 | `flags.rs` adds grammar the loops never had; two paths across phases (scope F4) | Medium | Reject | Arbitration §2.2 approved exactly that grammar ("`--k=v`, unknown flags and bad numbers behave one way, and `--json` is accepted as a no-op"); 02 and 04 land in one merge, so main never carries two paths |
| 21 | `Direct` struct and dropping `Activity::Event` exceed the approved delete list (scope F6) | Medium | Reject | §2.1: "the five identical direct adapter structs (they become one `match` on generic or named blocks)" — a struct plus one `match` is that; `Event` is deleted "if no consumer appears", and the only consumer reads `is_active` (`supervise.rs:252`) |
| — | Regenerator normalisation hides the binary's stamping (scope F7) | Medium | Reject | Volatile fields only; stamping behaviour is owned by Rust unit tests, not by golden fixtures (principle 8); normalisation now also asserts stamp order |
| — | Stderr skip warning smuggles in owner addition A3 (scope F8, second half) | Medium | Reject | §2.2 approved "a bad line is named and skipped"; A3 is a separate `--check` command, not built |
| — | Login/quota anchoring is forgeable by column-0 agent text (security F4) | High | Reject (residual named) | Same outcome reachable today through Node's screen patterns (`settle-attempt.mjs:103-110`); 04a does not widen it and narrows the login half; gating on the detector would break the recorded idle quota vector; T4's settle swap removes the Node half |
| — | 4 s lock wait vs 5 s kill margin unmeasured (failure F3, assumptions F4) | Medium | Accept (modified) | Phase 02 req 8: measured p99 budget with stop-and-ask; per-call timeout stays rejected (shared helper) |
| — | Worker can mask its own result with many entries or a refused newest file (security F7) | Medium | Reject (residual named) | Self-harm bounded by the attempt's own deadlines; no new mechanism (RUL104) |
| — | Fact-check misses (`windows-sys` feature, stale seat cites) (security F9) | Medium | Reject | `Cargo.toml:59-62` enables `Win32_Storage_FileSystem` (checked); seat cites are not used by this plan; all 60 plan anchors verified |

### Whole-Plan Consistency Sweep

Decision delta: (a) Windows hardening moved to one `fgos-durable-file` helper, so phase 04 depends on 03; (b) `--producer` stays required in Rust and the client keeps one default; (c) migration fails closed on read errors only; (d) directory comparison kept in the doctor; (e) quota naming on stop paths only; (f) three env switches, not two; (g) size estimates revised.

Checked across `plan.md` and every phase file with `rg`: no remaining "`--producer` becomes optional", "`windows-sys` cfg(windows)" in Observe, "any invalid line → `Err`", "lists every reason", "`ready gate share one rule`", "drops the directory comparison"; phase table, parallelism text, size table, decisions, hand-offs and outcome agree; phase 04 frontmatter `depends_on: [02, 03]`. Unresolved contradictions: none. Open items are owner/big-lead questions, listed below, and none blocks phases 01–05.

## Validation Log

### Verification Results

- Tier: **Full** (7 phases; Fact Checker, Contract Verifier, Flow Tracer, Scope Auditor).
- Claims checked by the planner on `42c5a0a55`: **60** `file:line` anchors with a token check (`sed -n Np | grep`), plus the traced behaviours below. Verified: 60 | Failed: 0 | Unverified: 0. Four anchors drifted while writing (the Work cutover merged at 20:50 and moved `registrations.mjs` by −170 lines and `observe-doctor-checks.test.mjs` by +6) and were re-pinned before this count.
- Traced behaviours (Flow Tracer):
  - receipt reason for a `Blocked` outcome is rendered from the reason's `as_str` (`supervise/terminal.rs:540`), so adding a variant needs no supervisor change to reach settle; settle's regex accepts it (`settle-attempt.mjs:126`) → D-T3A-1's "settle unchanged" holds.
  - the terminal quota rule today runs only on the idle path (`terminal/mod.rs:593-601`); the detector-blocked path goes through `classify_blocked` (`:263-279`) which has no quota check → requirement 2 of phase 03 (one rule) is needed for the arbitration's "terminal names usage-limit".
  - `friction record` reads the legacy log under the lock on every call (`friction.rs:290-291` → `run_lazy_migration` → legacy sources) → B-O7 holds.
  - host refusal vs store failure are indistinguishable to Node (run against the activated host on a scratch root, 10-24 20:4x) → D-T3A-8.
  - 29 `recordFriction` call sites, all pass `layer`/`errorClass`/`disposition`, 23 omit `producer` (scripted count over `src` and `bin`) → D-T3A-8.
  - `open_beneath` opens the root with `NOFOLLOW|DIRECTORY` (`beneath.rs:172-175`, `:177-182`) and the leaf with `NOFOLLOW|NONBLOCK` (`:238`), refusing a non-regular leaf → phase 03 requirement 4.
  - the fixture regenerator no longer relies on lazy migration after the cutover: it copies a frozen migrated snapshot (`scripts/regenerate-observe-fixtures.mjs:193-199`) → removing migration from `record` does not change the golden fixture.
- Scope Auditor: every Node consumer of `projectRunEligibility` (`registrations.mjs:145,6002`; `test/runner/assignment-layout.test.mjs:7,48,117,230,249,265,275,285`) and of `UnitSummarySource` (`run-result` `lib.rs:4`, `tests/unit_summary.rs:3,66,292,471,525,570`; `apps/fgos/src/wiring/metrics_sources.rs:5,12`) is named in its phase.

### Questions (to the big lead, batched; the planner cannot ask the owner)

Recorded under "Unresolved questions" below; none blocks phases 01–06 from starting.

## Unresolved questions

1. **Size ceilings (big lead, maybe owner).** By estimate, without Q3: Observe Rust src −370 against ≤ −700, Observe-owned tests +20 against ≤ −150, agent-protocol −55 against ≤ −60; with Q3 Observe src −930 against ≤ −1 300. The listed deletions (seat D11, D13–D16, the door) do not reach −700 by my count (simplicity's own non-gated Observe rows sum to ≈ −445). Options: (a) restate the ceilings to the measured Δ at phase close; (b) name further Observe deletions now (none found beyond Q3 and D17); (c) accept and report. Recommendation: (a), with each phase reporting measured Δ.
2. **Owner Q3** (scorecard constants and the coordination-session contract) is still open; phase 07 carries a plain-language wording for the owner.
3. **T4 prerequisite (big lead to place):** the settle swap needs a captured real claude (and codex TUI) terminal quota screen; who captures it, and when, decides when RT-01 closes in production (D-T3A-1).
4. **Root rule cost:** if phase 02's gate trips (> +10 ms p50 per Observe call), choose between applying the rule to writes only or accepting the cost.
5. **Agent-protocol ceiling reading:** does "−60 or less net in the crate" count crate tests (`tests/`, +110) or src only? This plan reads it as src, like Observe's "Rust src" line.

## Big-lead answers (2026-10-24 21:10)

1. **Size ceilings:** the arbitration's per-component ceilings were big-lead targets, not owner numbers. The binding rule is the layer's net Δ ≤ 0 (parent plan, loop step 9), which this plan meets by a wide margin. Each phase records its measured Δ; at layer close the ceilings are restated to the measured figures, and every accepted fix that adds code names the defect it pays for.
2. **Owner Q3:** still open; phase 07 waits for it.
3. **Claude and codex quota screens:** T4 captures them when a real quota screen next appears (recorded in the parent phase 05 addendum); no fake screen counts as a vector.
4. **Root-rule cost gate:** if it trips (over +10 ms per Observe call), apply the root rule to writes only and record the measurement; do not accept the cost silently.
5. **Agent-protocol ceiling:** `src` only; crate tests are counted with the layer's tests.
