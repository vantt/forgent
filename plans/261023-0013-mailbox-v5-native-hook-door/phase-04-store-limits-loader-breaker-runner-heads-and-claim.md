---
phase: 4
title: "Store: real limits loader, breaker, runner heads, inbox --claim, versions"
status: pending
priority: P1
effort: "6h"
dependencies: [3]
---

# Phase 4: Store, part one

## Goal

Make `fgos-mailbox` ready for a product entry:

- a real limits loader;
- the circuit breaker;
- runner heads kept out;
- `inbox --claim`;
- the recipient's version in the delivery report.

Phase 6 then adds only wiring.

## Context

- Plan decisions 4, 9, 11 and 12.
- V4 loads limits from `packages/mailbox/rust/core/tests/common/support.rs`, which `examples/mailbox-test-hook.rs` includes by path (review L6).
- `fgos-identity` exports `ATTEMPT_PREFIX` only. `packages/identity/rust/src/session.rs:52` compares the prefix with `starts_with`.
- Spec §1: the prefix test is "a function exported by session-identity, not a string comparison in this crate".
- Shared files of this phase: `packages/identity/rust/src/{attempt.rs,lib.rs,session.rs}` (IDENT lane). Before editing them, re-check `git log origin/main -- packages/identity` and merge first.

## Tests before

| File (owning proof) | New test |
|---|---|
| `packages/identity/rust/src/attempt.rs` (unit tests module, where `mint_attempt_writer_id` is tested) | `an_attempt_writer_id_is_recognised_by_its_prefix_and_nothing_else_is` |
| `packages/mailbox/rust/store/tests/limits_loader.rs` (new: the loader is a new module) | `without_project_config_the_loader_yields_the_contract_defaults`; `a_project_config_value_overrides_its_default_and_leaves_the_rest`; `an_unknown_mailbox_key_is_ignored_and_reported_to_the_caller`; `a_wrong_type_or_a_value_the_core_rejects_makes_the_section_invalid_and_names_the_key`; `the_exact_object_setup_registers_loads_unchanged` (it reads the shape phase 7 registers, from a committed fixture that phase 7's test also reads; this is the one drift proof between Node and Rust, RT12); `the_harness_only_key_is_dropped_before_deserialising` |
| `packages/mailbox/rust/store/tests/hook_shell.rs` | `a_runner_head_writer_is_quiet_and_registers_nothing`; `the_breaker_opens_after_the_configured_counted_failures_and_answers_quiet_before_reading_stdin`; `an_open_breaker_closes_after_its_pause`; `lock_contention_config_errors_budget_exits_and_benign_quiets_never_count`; `a_planted_future_open_time_cannot_extend_the_pause`; `the_breaker_is_never_read_or_written_under_an_untrusted_directory`; `the_no_mail_path_writes_neither_snapshot_nor_breaker_file` ("no mail" means nothing pending; a drain with pending but ineligible mail still stamps `last_drain_at` under the V1 rule, which phase 8 measures; red team RT17); `a_corrupt_symlinked_or_oversized_breaker_file_reads_as_closed` |
| `packages/mailbox/rust/store/tests/verbs.rs` | `inbox_claim_claims_emits_and_finishes_like_a_drain_and_a_failed_write_never_finishes`; `inbox_claim_of_an_unregistered_caller_answers_no_address`; `send_adds_the_untested_version_clause_from_the_recipients_version`; `send_adds_the_unknown_version_clause_when_no_version_can_be_read` |
| `packages/mailbox/rust/store/tests/record_snapshot.rs` | none: the snapshot schema does not change (decision 12). Assert it by leaving `fixtures/record/snapshot.v1.json` untouched |

## Implementation

1. **`fgos-identity`.**
   - Add `pub fn is_attempt_writer_id(id: &str) -> bool` in `attempt.rs`, exported from `lib.rs`.
   - `session.rs:52` calls it (one door; no behaviour change, covered by its existing test).
   - In `packages/mailbox/rust/store/Cargo.toml`, move `fgos-identity` from `[dev-dependencies]` to `[dependencies]`. Check the dependency direction: identity imports neither mailbox nor anything above L4 (spec §4 "Dependency direction").
2. **Limits loader** (`store/src/limits.rs`, new; the one production path; plan decision 4).
   - `pub fn load(project_config: Option<&serde_json::Value>) -> Result<Loaded, LimitsError>`, where `Loaded { limits: Limits, hook: HookLimits, ignored_keys: Vec<String> }`.
   - It embeds `../../contracts/limits.v1.json` with `include_str!`, and keeps only the keys whose reader is `core` or `hook`. `harness` keys are dropped before deserialising.
   - It overlays the value at the same dotted path under the project config's `mailbox` object.
   - A `mailbox.*` key not in the contract is ignored and listed in `ignored_keys`.
   - `LimitsError::{WrongType(String), Rejected(String)}` names the key. `Rejected` means `Limits`/`HookLimits` deserialisation or the core's own checks refused the value.
   - If the CFG lane's Config crate is on main at this phase's start sync (phase 1 recorded it), read through that crate instead of the raw file, and note it.
   - `pub fn read_project_config(fgos_dir: &Path, max_bytes: u64) -> Result<Option<Value>, LimitsError>` reads `<fgos_dir>/config.json` as a regular file, no-follow, capped at `hook.maxReadBytes` from the contract default. A missing file is `Ok(None)`.
   - Move `core/tests/common/support.rs`'s contract parsing onto this loader where it can. Production code must not reference anything under `tests/`.
3. **Runner heads.**
   - In `hook::shell`, after the resolver returns `Resolved { writer, .. }` and before hold 1: if `fgos_identity::is_attempt_writer_id(writer.as_str())`, return quiet `Quiet::RunnerHead` with no hold. Nothing is registered, so `send` to it is refused as unknown by the existing name resolution.
   - The same check runs in `verbs::inbox` with `--claim` (an `att-` caller answers `[inbox.no-address]`).
   - This closes spec §11 item 8 for V5. `list` does not exist yet, so its omission is V7.
4. **Breaker** (`store/src/hook/breaker.rs`, new; plan decision 11).
   - `Paths::breaker()` names `<fgosDir>/runtime/mailbox/breaker.json`. `Paths::is_known` is unaffected, because the file is not inside `record/`.
   - Every read and write goes through one function that first runs the record's directory-trust check (`record/mod.rs:562-592`) on `.fgos`, `runtime` and `mailbox`. An untrusted chain means the breaker is closed and nothing is written.
   - State: `{ "schema": 1, "failures": u32, "openedAtMs": u64|null }`.
   - Read: no-follow regular file, at most 4 KiB, parsed strictly. Any error reads as closed with `failures: 0`. An `openedAtMs` later than `now` plus 5 s (clock skew, named in the code) reads as closed. Open means `openedAtMs <= now < openedAtMs + pause_sec × 1000`, using the loaded config.
   - Write: through `fgos-durable-file::replace_durably`, only when a counted failure occurs, or after a success when the stored count is non-zero. The no-mail path therefore never writes.
   - The wiring (phase 6) checks the breaker before reading stdin.
   - **Counted failures:** `Quiet::Record(code)` with any code except lock contention (`lock-busy`), and a caught panic. **Not counted:** `ConfigInvalid`, budget exits (the watchdog writes nothing in `on_exit`), and every benign quiet.
   - Concurrency: last writer wins without the mutex. A lost increment only delays opening; this is stated in the module doc.
5. **`inbox --claim`** (`verbs::inbox_claim`).
   - It takes the same two holds as the drain: claim with `Checkpoint::Step` (every pending item, no bound), render, write to the caller's stdout, flush, and finish only after a successful write. It reuses `hook::shell`'s write-then-finish order through a shared private function, not a copy.
   - Output: the frames joined by one blank line, as plain text. The caller is a tool process, not a hook shape. Otherwise `[inbox.empty]` or `[inbox.no-address]`.
6. **Recipient version** (`verbs::send`).
   - After the hold returns `Ok(outcome)`, call `version_of(binding)`:
     - **Claude Code:** read `version` from `<claude config dir>/sessions/<head pid>.json`, using phase 5's resolver once it lands. Until then, a parameter.
     - **Codex:** run `codex --version` with a 2 s timeout, through `std::process::Command` with no shell, and parse `codex-cli <x>`.
     - **Anything else:** `Unknown`.
   - Compare with `TestedClis` and pass the `VersionClause` to `delivery_report`.
   - The version is read **outside** the mutex. A failure gives `Unknown`, never a refusal.
7. **Test-only entry.** Not touched in this phase. Phase 5 changes it only as far as compiling needs, and phase 6 retires it (red team RT13).

## Tests after

- `cargo test -p fgos-identity -p fgos-mailbox` is green.
- `grep -rn "tests/common" packages/mailbox/rust/store/src` finds nothing.

## Regression gate

```bash
cd /home/vantt/projects/forgent-mailbox || exit 1
free -g | awk '/Mem:/{print $7}'
CARGO_BUILD_JOBS=4 timeout 1800 cargo test --locked -p fgos-identity -p fgos-mailbox -p fgos-mailbox-core -- --test-threads=4
echo "exit=$?"
cargo clippy --locked -p fgos-identity -p fgos-mailbox --all-targets -- -D warnings
```

## Risks

- **IDENT is renaming or adding in `packages/identity` at the same time.** Merge main before the edit and keep the change to one function and one call site. MAIL lands later, so MAIL reviews IDENT's diff at each merge.
- **A Codex version spawn at `send` costs time.** It is outside the mutex, bounded at 2 s, and only for a Codex recipient. Its cost is noted in phase 8's report.

## Todo

- [ ] Identity: add the function and its test; move the call site
- [ ] Limits loader and its tests
- [ ] Runner-head quiet
- [ ] Breaker
- [ ] `inbox --claim`
- [ ] Version clause
- [ ] Run the gate; regenerate the census; sync and push

## Notes

- Commits `c2d26b518` (`is_attempt_writer_id`) and `bc4abcfee` (loader, breaker, runner heads, `inbox --claim`, version clause). Gate: 323 passed; 29 hand mutants killed, 1 equivalent (sorting ignored keys; the JSON map is already sorted).
- No Config crate on main: the loader reads `config.json` itself. The breaker lives in `hook::shell::run` (read before stdin, counted after the call). `SendOutcome` gained the recipient's CLI and head text for the version clause.
