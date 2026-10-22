# Validation log: Mailbox V5

## Session 1: 2026-10-23

**Trigger:** the `ak-plan validate` gate after the plan was drafted.

The owner was asleep and the controller had asked for autonomous work. Every question that the spec, the code or the reports could answer was resolved here, with its evidence. Only owner-intent questions went to `plan.md` "Câu hỏi cho owner" (Q1–Q3), each with a provisional default.

### Verification results (Full tier: 9 phases, four roles)

**Totals:** 31 claims checked. 28 verified; 3 failed and corrected in the plan; 0 left unverified.

**Fact checker.** Verified at `9bb562808`:

- `fgos_process::facts::relation_of` exposes `tty_nr`, `session` and `start_ticks` (`facts.rs:356-370`), and `view_of` exposes `exe` (`facts.rs:515`);
- `fgos_identity::{env_identity, resolve_current, ATTEMPT_PREFIX}` are exported, and `is_attempt_writer_id` does not exist;
- `MailboxState::claim` is at `core/src/delivery.rs:387` and `Checkpoint` at `:150`;
- `hook::drain::begin` is at `store/src/hook/drain.rs:157`;
- `record_error_text` is at `core/src/report.rs:91`, with section `[record.error]` at `frame.v1.txt:68`;
- `durable-file` has `replace_durably`, and `fgos_distribution::shim::workspace_shims` exists;
- Observe's own `CLAUDE_CONFIG_DIR` read is at `claude_transcripts.rs:136`, and `session.rs:52` compares the attempt prefix by hand;
- `GitDriver::resolve_topology` is `pub(crate)` with a disk-only body (`driver.rs:418-463`), and `open_at` spawns `git` (`require_floor`, `repository_formats`);
- `registrations.mjs:47-58` imports the per-CLI hook functions;
- `snapshot.v1.json` exists;
- the owning test files named in phases 3–7 exist;
- the recorder already writes `.proc.json`, and `setAsideReplacedAuth` exists;
- `export-command-selectors.mjs` writes by default and checks with `--check`, and `git-one-door-scan.mjs` takes `--write-census`;
- the installed versions (Claude Code 2.1.308, Codex 0.161.0, agy 1.4.4) match `adapters.v1.json`.

**Failed, and corrected in the plan:**

1. **The plan named a new section `[refusal.record]`.** The record-error text already exists as `[record.error]` / `record_error_text`. Decisions 3 and 4 and phase 3 now use the existing section and only extend its wording (review L2).
2. **The plan said "add the routing-handoff pointer if missing".** It is missing: `docs/routing-handoff-contract.md` names no mailbox, although spec §13 promised it "in the same change". Phase 9 now adds it, and the board announcement lists the file.
3. **The plan pointed at a non-existent legacy hook test file.** The only test that runs `bin/fgos.mjs hook …` is `test/cli/dispatch-retired-doors.test.mjs:145`, and phase 6 now names it.

**Contract verifier:**

- `MailboxState::claim` has 51 call sites, 4 outside tests (`drain.rs:233`, `mailbox-record-cost.rs:85, :431, :463`). The bounded claim became an additive `Checkpoint::BoundedStep(u64)` instead of a new parameter, so no call site changes.
- `delivery_report` has 6 callers (`verbs.rs:32`, `core/tests/report.rs` ×4, `store/tests/verbs.rs`), and all are listed for the new version argument.
- `ShellInput` is built in 2 places (`tests/hook_shell.rs:100`, `examples/mailbox-test-hook.rs:288`), both of which are updated by the lazy record opener.
- The hook installer's exported names are kept, so `registrations.mjs` and `claude-code-hooks.mjs` need no import change.

**Flow tracer:**

- In the hook path, stdin is read inside `shell::run` before the resolver. The plan's breaker check and config read sit in the wiring before `shell::run`, and the record opener is now lazy, so a malformed probe creates nothing. Phase 6 step 4 and phase 7 step 4 were corrected: the first draft opened the record before parsing, which would have made `fgos doctor` create `.fgos/runtime/mailbox`.
- Topology through the shim: the shim ends in `exec "$entry"`, so the host keeps the shim's pid and parent. Claude's `sh` stays the hop and Codex stays the direct parent. Phase 2 now runs its probes with the product command form to measure exactly that.

**Scope auditor:**

- The breaker file is per project (one record per project), so a failing snapshot pauses every head's drain in that project. This is intended, because the failure the breaker counts may be the snapshot itself (spec §4.1).
- It is written without the mutex, so concurrent increments can be lost. That is accepted: a lost increment only delays the breaker.
- No new state goes into the snapshot. Schema 1 stays frozen.

### Questions and answers (resolved by the planning lead from evidence; not owner-intent)

1. **[Architecture] Should the hook kind run through `InvocationService` like the other native verbs, or as a raw branch declared in the route table?**
   - Options: raw branch with `native_kinds` (recommended) | `InvocationService` with a raw-output presenter | a hidden `if` in `main.rs`.
   - **Answer:** raw branch with `native_kinds`.
   - **Rationale:** the hook protocol needs exact stdout bytes and exit 0 on every path (spec §6.1, review H1). The presenter wraps output in `fgos.v1`. The `internal` routes are the precedent, and declaring the split as data keeps it visible to the drift test.
2. **[Architecture] Should the verbs go through the native door or a raw branch?**
   - Options: native door with `--json` (recommended) | raw branch.
   - **Answer:** native door.
   - **Rationale:** the host-invocation contract (§4) says native routes use `InvocationService`. The one hard case, `inbox --claim` writing before it finishes, has a stated fallback in phase 6.
3. **[Architecture] Are the adapter facts per version or per CLI?**
   - Options: per version | per CLI with `measuredOn` (recommended).
   - **Answer:** per CLI.
   - **Rationale:** a hook cannot know a Codex head's version without a spawn on the hot path.
4. **[Assumptions] Does `inbox --claim` belong to V5?**
   - **Answer:** yes. The V5 row inherits it from V4 (spec §14), and the oversize pointer needs it.
5. **[Scope] Should V5 build the wake channel?**
   - **Answer:** no. It is outside the signed V5 row, so it became owner Q1, default V7.
6. **[Scope] Should V5 install agy mailbox rows?**
   - **Answer:** no. agy is deferred in `adapters.v1.json`, so its rows come with its adapter (decision 14).
7. **[Scope] Does V5 need a CHANGELOG line?**
   - **Answer:** no. V5 is not merged, and spec §12 and §14 put the line at V7.
8. **[Risks] How is the lock order proven?**
   - Options: strace test with a skip | structure plus review (recommended).
   - **Answer:** structure plus review. A test that skips when a tool is missing would be an environment-dependent skip, which AGENTS.md forbids.
9. **[Assumptions] Does "through the shim" in the V5 row require activation?**
   - **Answer:** no. Use the same shim bytes over a private activation (the controller's rule), recorded as a deviation.
10. **[Risks] What does a CLI with no measured output bound do?**
    - **Answer:** it does not drain at steps (quiet `NoStepBound`). Mail waits for Stop or `inbox --claim`, so nothing is ever moved to a file and still marked offered.

### Confirmed decisions

Plan decisions 1–16 stand, with the three corrections above and two refinements:

- `Checkpoint::BoundedStep` instead of a new claim parameter;
- per-CLI `hookFacts` instead of per-version facts.

### Impact on phases

- **Phase 2:** probes use the product command form.
- **Phase 3:** per-CLI facts; `BoundedStep`; `[record.error]`; the repeating-pointer risk.
- **Phase 4:** `inbox --claim` uses `Checkpoint::Step`.
- **Phase 5:** the Codex writer guard keeps its teeth through `env_identity` (a tool's `CODEX_THREAD_ID` that differs from the payload means quiet).
- **Phase 6:** lazy record opener; legacy test file named; lock-order test replaced by structure plus review.
- **Phase 7:** the read-only doctor probe asserts that nothing is created.
- **Phase 9:** the routing-handoff pointer is required.

### Whole-plan consistency sweep

- Searched every plan file for `ClaimBound`, `refusal.record`, `facts(cli, version)`, `--write` (selector export) and `HOP_SHELLS`.
- None remains except `HOP_SHELLS` in its deletion step, and `--write-census`, which is correct.
- The plan, the phases and the board announcement name the same shared files.
- No contradiction remains.

**Recommendation:** proceed to red team.
