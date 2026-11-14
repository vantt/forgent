# F0 phase 06: Event Store maintain, config authority and the global directory

Branch `rust-verb-migration-program/f0-p06`, based on `origin/rust-verb-migration-program/f0` (286017771). Not landed.

## Done

- `fgos-event-store`: `lifecycle.rs` (`maintain`, `sync_due`, `platform_supported`, `Timers`, `Policy`, `Request`, `Outcome`) and `resolve.rs` (`driver`, `resolve_repo`, `resolve`, `ResolveError`; the one constructor of driver, repository and machine id, including the detached `state-root-gone` rule). No new crate edge: `maintain` takes plain timers, not the config type.
- `fgos-config`: module `event_store.rs` (`EventStoreConfig::from_section`, `::when_refused`, `Invalid`) holds the minimums, the standard defaults and the refusal rule; `machine::global_dir` answers "where is `~/.fgos`" next to `home_dir`. `project_snapshot` and the host provider (`provider.rs`) use it.
- Addon: `maintainEventStore` (new function), `resolveEventStore` and `eventStoreFacts` call `resolve`; `config` namespace gains `eventStore`, `eventStoreConfig`, `globalDir`; `versions().config` is 4 and `combinedAbiMatches` needs 4. `driver_for` (still used by `git/inspect.rs`) delegates to `resolve::driver`.
- Node: `maintainEventStore` keeps its signature, return and error semantics; it reads the config, calls `maintainStore` (new in `native.mjs`) and starts the publish child when `syncDue`. `syncDue` and the seal loop are gone. `eventStoreConfig` and `readEventStoreConfig` are adapters with the same signatures and `event-store-config` errors. `globalFgosDir()` in `src/config/facade.mjs` asks the addon (memoised on `HOME`/`USERPROFILE`), the facade default uses it, and the five choosers use it (each keeps its own env override and file name).
- Tests: Rust `lifecycle.rs` (6), `event_store_section.rs` (6), `machine_view.rs` (+1); Node `facade.test.mjs` (+1 for `globalFgosDir`).

## Retired tests and their owners

- `triggers.test.mjs` "seals only streams older than the seal interval and everything on shutdown": now `lifecycle.rs` `a_trigger_seals_only_streams_older_than_the_interval_and_shutdown_seals_all`.
- `triggers.test.mjs` "a store that cannot be opened is reported as a code": now `lifecycle.rs` `a_store_that_cannot_be_opened_is_a_code_and_never_a_publish`.
- `verbs.test.mjs` integer-boundary loop over seven values: now `event_store_section.rs` (`every_numeric_key_refuses_...`, `a_section_or_sub_section_that_is_no_object_...`); one adapter refusal assertion stays as the wiring proof.
- Rewritten, not retired: "reads maintenance facts and never the integrity status" now counts one `maintainEventStore` call per trigger and zero `status` calls; the CLI spy test logs `maintain` instead of `maintenance`.

## Follows the facts where they differ from the phase text

- Facts (a): the host opener `event_store_clone::open` lacks `detached` and a real trusted main; the new `resolve` has both, but `event_store_clone` is phase 08 territory and is not switched here.
- Facts (b): the refusal-degrade rule (a refused file that does not name `eventStore` gives `sync.intervalSec` 0) is now written once, in `EventStoreConfig::when_refused`. Rust readers that refuse on any config failure (`CrossMachine::read`) are unchanged; phase 08 chooses per caller.
- Facts (c): the mailbox stamp rule (`mailbox_hook.rs:186-224`, stamp file `.fgos/mailbox/mail-taken`) and Node's `syncDue` (`sync.json` last attempt) are different jobs with different preconditions. `lifecycle` is the owner of the Event Store publish schedule only; it is not shared. They share only the interval and remote reads, which now come from `EventStoreConfig`. Evidence for the phase 08 `doors` row reason: `phase-261114-2225-f0-p00a-facts.md` section "the host's mailbox sync-due rule against Node's `syncDue`: not the same job".
- Facts (d): no Rust code reads `FGOS_DISPATCH_DEPTH`; `dispatched` stays a caller-supplied boolean in `Policy`.
- Facts (f): two Rust copies of the home rule differed from Node. Rust now has one (`machine::global_dir`); Node asks it. `mailbox_config.rs:145-152,171` and `apps/fgos-gateway/src/gateway.rs:112` still derive it themselves (phase 08 owns the first; the second is an outside leak, see below).

## Files outside the phase list

All unowned by another phase in the collision table:

- `src/event-store/native.mjs`, `src/event-store/index.mjs`: the only Node importer of the addon's Event Store exports must carry `maintainStore`.
- `packages/event-store/rust/src/resolve.rs` (new): the constructor module the phase allows ("if it is not placed in `lifecycle.rs`").
- `packages/git/node-addon/src/lib.rs`: `driver_for` delegates to the crate (it is also called from `git/inspect.rs`, which this phase does not touch), plus the `config` version and the new export.
- `packages/config/rust/src/provider.rs`: one line, global directory through `machine::global_dir`.
- `src/native/door.mjs`, `test/git/native-load.test.mjs`, `test/config/config-door.test.mjs`: the `config` marker moved to 4.
- `docs/platform/config/spec.md`: one line (the addon entry list is a settled fact that changed). Decision-history narrative is left to phase 11.
- `packages/git/contracts/mutation-census.v1.json`: regenerated (hash lines and digest only).

## Hand-off for phase 08 (`doors` rows and debt)

- Global directory row: `fn global_dir(` in `packages/config/rust/src/machine.rs`; `export function globalFgosDir` in `src/config/facade.mjs`. Recorded debt, with reasons: `src/setup/registrations.mjs:517` (capability-reads plan edits it), `packages/distribution/rust/src/uninstall.rs:445` (needs a `fgos-config` edge, moves with `uninstall`). Further leaks found by `rg` that the phase did not name: `src/runner/dispatch/llm-accounts.mjs:287` (takes `homeDir` as a parameter), `src/runner/dispatch/confinement/probes/harness.mjs:632`, `src/setup/setup-use-case.mjs:37` (takes `homeDir`), `apps/fgos-gateway/src/gateway.rs:112`, `apps/fgos/src/wiring/mailbox_config.rs:171`.
- Event Store maintain row: `fn sync_due`/`sync_interval_sec`/`sync.intervalSec` live in `packages/event-store/rust/src/lifecycle.rs` and `packages/config/rust/src/event_store.rs`; `mailbox_hook.rs` stays a different job (reason above).
- Config section row: `export function (readEventStoreConfig|eventStoreConfig)` only in `src/event-store/config.mjs`; the Rust owner is module `event_store` of `fgos-config`.
- Platform: `lifecycle::platform_supported()` is the Rust answer. Node `eventStorePlatformSupported()` (`process.platform`) stays: `test/event-store/platform-refusal.test.mjs` pins a refusal before the addon loads or disk is read. It is the same rule in two layers until the Node arm retires.

## Gates

- `cargo fmt --all --check`: clean. `cargo clippy -p fgos-event-store -p fgos-config -p fgos-node-addon --all-targets -- -D warnings`: clean; also `-p fgos` and `-p fgos-config --features host-provider`.
- `cargo test -p fgos-event-store -p fgos-config`: all green (67 result lines ok); `cargo test -p fgos config`: green.
- `cargo check -p fgos-event-store -p fgos-config -p fgos-node-addon` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`: green.
- Focused Node run (72 files: the phase list, every hit of both `rg` rules, architecture, census, doc-health, citation drift, plus `lifecycle`, `platform-refusal`): 1507 tests, 1500 pass, 0 fail, 7 skipped, no run-tests ERROR lines.
- One-door scan: `0 undeclared site(s)`, class counts identical to the baseline. Census regenerated, not hand-merged.
- Not run (needs COOK): full `npm test`, `cargo test --workspace`.

## Behaviour notes

- Node `os.homedir()` fell back to the passwd entry when `HOME` was unset; the single Rust rule refuses (`config-io`, keyword `HomeUnset`), as both Rust copies did. A caller with no home now fails by name where it used to use the passwd home. `readStandardValue` needs no directory and does not ask for one.
- Rust seals and publishes decisions use the addon's clock (system time), as `Date.now()` did.
- Red-first: the Rust tests were written together with the code, not before it; the Node wiring tests were edited to the new spy points before the Node change was run.

## Suggested `[Unreleased]` line

- Changed: the Event Store's seal-and-publish triggers, the `eventStore` config rules and the location of the global `~/.fgos` directory are now decided in one place in the Rust core; behaviour is unchanged, except that a process with no home directory now fails by name instead of using the passwd home.

## Authority

- Event Store platform support is decided twice: `lifecycle::platform_supported()` (Rust) and `eventStorePlatformSupported()` (Node, `process.platform`). Belongs in Rust; the Node copy has to stay until the Node Event Store arm retires, because its refusal must happen before the addon loads.
- The global directory was decided in four places (Node `os.homedir()` in six choosers, `machine.rs`, `mailbox_config.rs`, `provider.rs`) and is now `machine::global_dir`; the leaks listed in the hand-off remain and belong to phase 08 and the later steps.
- The sync schedule is held in two layers by design (mailbox stamp file in the host, `sync.json` in the Event Store); different jobs, not a duplicate. Phase 08 should write that reason, not unify them.

## Lessons

- A spy test that wraps a store method proves wiring only while the code goes through that method; moving a policy into one native function moves the spy point, and the test titles should say what they prove ("once per trigger, never status"), not how.
- The one-door scan compiles Rust and the commit hook demands a regenerated census; export `CARGO_TARGET_DIR` in the same command as the scan.
- An addon entry added without a `versions()` bump is silent until an old addon meets a new payload; bump the marker with the entry and update the version assertions in the same commit.

Status: DONE_WITH_CONCERNS
Summary: Maintain policy, store construction, `eventStore` config rules and the global directory each have one Rust owner, Node is adapters, and the focused gates plus Rust checks are green; branch pushed, not landed.
Concerns/Blockers: Files outside the phase list were touched (listed above, none owned by another phase); the home-unset behaviour change; full `npm test` and `cargo test --workspace` not run.
