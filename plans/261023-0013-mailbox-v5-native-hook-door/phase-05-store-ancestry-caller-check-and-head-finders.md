---
phase: 5
title: "Store: product ancestry, per-CLI caller check, Codex and Claude head finders"
status: pending
priority: P1
effort: "6h"
dependencies: [4]
---

# Phase 5: Store, part two

## Goal

Give the product entry everything it needs to decide who is calling:

- the ancestry reader, as library code over process facts;
- a caller check whose accepted hook shells come from the adapter contract (review M3);
- a Codex head that must be the Codex executable (review M4);
- a Claude head finder whose sessions directory comes from one resolver shared with Observe.

## Context

- Plan decisions 7, 8 and 10. Phase 2 report tables (b), (c), (e) and (f).
- V4 state:
  - `ancestry_of` lives in `store/tests/common/ancestry.rs` and reads `comm` from `/proc`;
  - `Topology::head_of` uses the shared `HOP_SHELLS = ["sh","dash","bash","zsh"]`;
  - the Codex head is "the parent if it is not a shell", in example code only.
- Process facts already expose everything needed: `fgos_process::facts::relation_of(pid)` (parent, session, tty, start ticks), `view_of(pid, filter)` (exe, cmdline) and `identity_of(pid)` (the record).
- Shared files of this phase: `packages/identity/rust/src/` (new `cli_dirs.rs`, exported from `lib.rs`) for IDENT, and `packages/observe/rust/src/sources/claude_transcripts.rs` for CFG (which also edits `packages/observe`). Re-check `git log origin/main` on both before editing.

## Tests before

| File (owning proof) | New test |
|---|---|
| `packages/mailbox/rust/store/tests/head.rs` | `only_the_shell_the_cli_invokes_for_hooks_is_accepted_as_the_hop_and_a_login_zsh_is_refused` (it kills review mutation M4: a parent whose exe is `zsh`, or whose `cmdline[0]` is not the contract's `hookShell`, is refused); `the_hop_shell_is_matched_by_resolved_executable_and_invoked_path_not_by_comm` |
| same | the discriminator from phase 2 (f), if one was chosen: `a_tool_shell_that_shares_the_hook_shells_executable_is_told_apart_by_<fact>` |
| `packages/mailbox/rust/store/tests/head_finder.rs` | `a_direct_head_must_run_one_of_the_adapters_head_executables` (a parent whose exe is `systemd` or a pane process gives `NoHead::WrongExecutable`). There is no start-order test: a parent is always older than its child, so that check would separate nothing (RT8) |
| same | `the_claude_sessions_directory_follows_the_shared_config_dir_resolver` |
| `packages/mailbox/rust/store/tests/ancestry.rs` (new: the reader becomes a product module) | `the_ancestry_of_a_child_names_its_real_parent_and_grandparent_with_their_executables` (spawn `sh -c '<child>'` and read it); `an_unreadable_parent_gives_no_ancestry` |
| `packages/identity/rust/src/cli_dirs.rs` | `claude_config_dir_prefers_its_variable_then_home_and_is_none_without_either` |
| `packages/observe/rust/src/sources/claude_transcripts.rs` (existing tests at `:354`, `:449` set `CLAUDE_CONFIG_DIR`) | no new test: the existing ones must stay green after the move. They are the owning proof of Observe's behaviour |
| `packages/mailbox/rust/store/tests/hook_shell.rs` | `the_caller_check_runs_again_just_before_hold_1_with_the_adapters_facts` (extend the existing caller-check case to take facts from the contract, not the constant) |

## Implementation

1. **Ancestry reader** (`store/src/ancestry.rs`, new).
   - `pub fn ancestry_of(pid: u32) -> Option<Ancestry>`, over `fgos_process::facts::{relation_of, view_of, identity_of}`.
   - `Ancestry` holds the parent's `Record`, its `Relation` (kept whole, not mirrored field by field; RT14), its `exe: Option<PathBuf>` and `cmdline0: Option<String>`, and the grandparent's `Record`. `parent_comm` is removed.
   - **Every construction site changes in this phase** (RT14):
     - `tests/head.rs:97`;
     - `tests/head_finder.rs:69`;
     - `tests/hook_shell.rs:46`;
     - `tests/common/ancestry.rs:24` (the file is deleted; the tests call the library function);
     - `examples/mailbox-test-hook.rs:22` (its `#[path]` include), `:256` and `:272`. The example is changed only to compile against the library; phase 6 retires it.

     Tests keep building the struct literally, as today.
   - Update the crate doc: "the store reads no process table" becomes "the store reads its own ancestry through process facts, and nothing else".
2. **Caller check per CLI.** One signature survives (RT14): `Topology::head_of(self, ancestry: &Ancestry, facts: &AdapterFacts) -> Option<&Record>` and `caller_is_head(ancestry: &Ancestry, facts: &AdapterFacts, head: &Record) -> bool`, with `Topology` taken from `facts.topology`.
   - `OneShellHop` is accepted only when `parent.exe == realpath(facts.hook_shell)` and `parent.cmdline0 == facts.hook_shell`, plus the phase 2 rule if one was chosen.
   - `Direct` is accepted only when the parent's exe basename is in `facts.head_executables`.
   - Delete the `HOP_SHELLS` constant.
   - Consumers to change: `store/src/hook/shell.rs:116` (caller check), `store/src/adapters/claude_head.rs:28` (`find_head`), and the tests in `tests/head.rs` and `tests/head_finder.rs`.
   - `caller_is_head` keeps the full-record comparison (pid reuse).
3. **Codex head finder** (`store/src/adapters/codex_head.rs`, new).
   - `find_head(ancestry, facts) -> Result<HeadFacts, NoHead>`: the record at the `Direct` position, after the exe check.
   - `own_suffix: None` (Codex keeps no name). `handle`: the payload's `session_id`, as the V3 rule already does inside `begin`.
   - New variant `NoHead::WrongExecutable`.
4. **Codex writer key.** `adapters::codex_writer(payload, env_identity) -> Result<WriterKey, NoHead>`.
   - The key is the payload's `session_id`, accepted only in session identity's alphabet and length (the core's `WriterKey::new`).
   - **The `WriterMismatch` guard keeps its teeth.** A real Codex hook process sees no session variable (V3/V4 probes). If the entry's own environment carries one (`fgos_identity::env_identity()`: `FGOS_SESSION_ID`, `CODEX_THREAD_ID`, `CLAUDE_CODE_SESSION_ID`) and it is not the payload's `session_id`, the call is quiet `WriterMismatch`. That is the case of a Codex tool command (which sees `CODEX_THREAD_ID`) piping a payload that names another session.
   - The drain's own payload-vs-writer check runs as before.
   - New test in `tests/hook_shell.rs`: `a_codex_entry_whose_environment_names_another_session_than_its_payload_is_quiet`.
5. **Claude config dir.**
   - `fgos_identity::cli_dirs::claude_config_dir(home: Option<&OsStr>, claude_config_dir: Option<&OsStr>) -> Option<PathBuf>`: a pure function, so it is testable without setting the process environment.
   - Callers read the two variables once.
   - Observe's `claude_transcripts.rs:136` calls it, and its inline `match` is deleted.
   - The mailbox's resolver closure passes `claude_config_dir(..)?.join("sessions")` to `claude_head::find_head`.
   - The `claude_head.rs` module doc replaces "CLAUDE_CONFIG_DIR is not honoured … one more lever for a same-user process" with the threat statement, and spec §6.1 gets the same sentence in phase 9. The statement: the directory is chosen by the environment, but the head is bound by the caller check and by the session file's `pid`, `sessionId` and `procStart` matching process facts, never by the directory, and a same-user process is outside the guard anyway (spec §6.1). The custom-directory case is unmeasured (plan decision 10).
   - Observe keeps its behaviour exactly: when neither variable gives a directory it returns no observations (`claude_transcripts.rs:136-143`). The pure function returns `None` there, and Observe maps `None` to an empty result.
6. **One resolver function for the entry** (`store/src/hook/resolve.rs`, new).
   - `pub fn resolver_for(adapter, facts, env: &HookEnv) -> impl Fn(&[u8], &Ancestry) -> Result<Resolved, NoHead>`:
     - **Claude:** the writer from `fgos_identity::resolve_current(Some(fgos_dir))` with source `Env|Registry` only, as V4 does, and the head from `claude_head::find_head`.
     - **Codex:** the writer from the payload, and the head from `codex_head::find_head`.
     - **agy:** `Err(NoHead::WrongTopology)`, deferred.
   - `HookEnv { home, claude_config_dir, fgos_dir }` is read once by the entry.
   - This moves the example's resolver closure into the library. The example and the host (phase 6) both call it, so it is built once.

## Tests after

- `cargo test -p fgos-mailbox -p fgos-identity -p fgos-observe` is green.
- `grep -rn "HOP_SHELLS\|tests/common/ancestry" packages/mailbox` finds nothing.

## Regression gate

```bash
cd /home/vantt/projects/forgent-mailbox || exit 1
free -g | awk '/Mem:/{print $7}'
CARGO_BUILD_JOBS=4 timeout 1800 cargo test --locked -p fgos-mailbox -p fgos-identity -p fgos-observe -- --test-threads=4
echo "exit=$?"
cargo clippy --locked -p fgos-mailbox -p fgos-identity -p fgos-observe --all-targets -- -D warnings
```

## Risks

- **Phase 2 found no fact that separates a hook's shell from a tool's shell when both run the same executable.** The check then stays a topology and pid-reuse guard. The residual goes into spec §6.1 and the closing report, and the M3 test still pins the accepted set. This is not a blocker: spec §6.1 already says the check is no guard against same-user processes.
- **Observe's test sets the process environment, which races other tests.** Keep its current pattern. The new pure function avoids adding more such tests.
- **CFG edits `packages/observe` (removing `serde_yaml`) at the same time.** The edit here is one call site; merge main first.

## Todo

- [ ] Ancestry reader as library code
- [ ] Caller check driven by the contract (M3)
- [ ] Codex head finder with the executable check (M4)
- [ ] Codex writer key from the payload
- [ ] Shared Claude config-dir resolver; move Observe onto it
- [ ] One resolver function for the entry
- [ ] Run the gate; regenerate the census; sync and push

## Notes

- Commits `58aaaafa2` (shared `claude_config_dir`; Observe's copy deleted), `5ed25bf20` (ancestry reader, caller check from the contract, Codex head finder and writer key, `resolver_for`), `c91d29ede` (harness stubs: `/bin/sh` hop, Codex stub as a hard link of Node named `codex`). Gate: 413 passed; `cargo test -p fgos` 57 passed; 11 hand mutants killed.
- The caller check is the free function `head_position(ancestry, facts)`; `ShellInput.topology` is gone. The test entry keeps `--topology` only as an assertion against the contract until it is retired in phase 6.
