---
phase: 5
title: "Claude head finder and caller check"
status: pending
depends_on: [2, 4]
live_calls: 0
---

# Phase 5: Claude head finder and caller check

## Why

V3 handed two shell duties to V4 (spec §14 V3 "does not yet prove"; `hook/drain.rs` module doc):

- **Head finder (Claude Code):** from the hook process to the head's `HeadFacts` (process-facts `Record`, own two characters, handle). The hook's own pid is never the head (spec §5.1).
- **Caller check:** drain only when the entry runs directly under the head CLI (or under the one shell hop phase 2 found), comparing process-facts records, not the parent pid alone (spec §6.1 shell duties).

## What this check is, and is not (write it into the module doc and spec §6.1)

- It **is**: a topology check (the entry's parent, or the shell hop's parent, is the process the session file names) and a pid-reuse guard (the head's process record is read from process facts at the moment of the drain, compared in full, and `procStart` is compared when phase 2 found it comparable).
- It **is not** a security guard against processes of the same user. A tool process that the head exec'd directly (`bash -c '… entry …'`) has the head as its parent, and any same-user process can set the environment the writer key comes from or write the snapshot directly (spec §8 item 6: an unconfined worker can write the snapshot; `from` is attribution only). V4 claims no guard against them; the `agent_id` skip is not a security boundary either (spec §6.1). Phase 8 records a real tool process's ancestry and variable names next to the hook's, for V5's search for a discriminator. <!-- Updated: red-team - the check is a topology and pid-reuse guard, not a security boundary -->

## Design (both topologies specified now; phase 2's probe picks one)

New file `packages/mailbox/rust/store/src/adapters/claude_head.rs`, exported as `fgos_mailbox::adapters::claude_head`:

```rust
/// The entry's ancestry as process facts read it at the moment of the call.
pub struct Ancestry {
    pub parent: (ProcId, Record),            // the entry's parent
    pub grandparent: Option<(ProcId, Record)>,
    pub parent_comm: String,                 // `/proc/<parent>/comm`
}

pub enum Topology { Direct /* A */, OneShellHop /* B */ }

pub enum NoHead { NoSessionFile, Unreadable, OtherSession, OtherProcess, StartTimeMismatch, WrongTopology }

/// Topology A: the head is `ancestry.parent`.
/// Topology B: `ancestry.parent_comm` is one of `sh`, `dash`, `bash`, `zsh`, and the head is
/// `ancestry.grandparent`; anything else is `WrongTopology`.
/// Then reads `<sessions_dir>/<head pid>.json` (opened with O_NOFOLLOW | O_NONBLOCK, regular
/// file checked with fstat on the descriptor, at most `hook.max_read_bytes`), and returns
/// the head when the file's `pid` is the head pid and its `sessionId` is `writer`.
pub fn find_head(sessions_dir: &Path, ancestry: &Ancestry, topology: Topology,
                 writer: &WriterKey, hook: &HookLimits) -> Result<HeadFacts, NoHead>;
```

- `HeadFacts.record` is the head's process-facts `Record` from `ancestry`, never fields of the session file. `own_suffix` is the segment after the last `-` of `name` when `nameSource` is `"derived"` (the core keeps it only in suffix shape, `core/src/names.rs` `is_own_suffix`); otherwise `None`. `handle` is `None` (the socket is a later wake channel; nothing in V4 uses it).
- When phase 2 found `procStart` equal to `/proc/<pid>/stat` `starttime`, compare it with the head record's `start_time`; unequal is `StartTimeMismatch`.
- **Caller check:** `pub fn caller_is_head(ancestry: &Ancestry, topology: Topology, head: &Record) -> bool` in `head.rs`, beside and reusing the same-head comparison `judge_stored` uses (no second comparison): the record of the topology's head position, read again by the shell just before hold 1, equals `head` and both are complete. The shell (phase 6) calls it after the finder, so a pid reused between the finder and the drain is refused.
- `sessions_dir` is a parameter. The entry passes `$HOME/.claude/sessions` only. `CLAUDE_CONFIG_DIR` is not honoured in V4: no V4 run sets it, its effect on `claude -p`'s session file was not measured, and an environment-chosen directory is one more lever for a same-user process. The rule for the Claude config directory that `packages/observe/rust/src/sources/claude_transcripts.rs:136` uses (`CLAUDE_CONFIG_DIR`, else `$HOME/.claude`) is recorded in the closing report as the item "one Claude config-directory resolver in a leaf crate, used by observe and mailbox" (RUL11), together with the measurement it needs. <!-- Updated: red-team - no env-chosen sessions directory -->

## Tests first (`packages/mailbox/rust/store/tests/head_finder.rs`, new module)

Real files in a temporary directory and real processes; no mock of process facts. The "head" is a child the test spawns (`sleep`), so its pid and start time are real; topology B uses `sh -c 'sleep …; :'` (a shell that does not exec its last command) with the `sleep` as its child, and the ancestry the test builds from process facts.

1. `a_session_file_naming_the_head_and_the_writer_gives_that_process_as_the_head` (topology A; record equals `identity_of(child).to_record()`; own suffix from a derived name).
2. `under_one_shell_hop_the_head_is_the_shells_parent_and_any_other_parent_is_the_wrong_topology` (topology B; a non-shell parent in B, and a shell parent in A, give `WrongTopology`).
3. `a_session_file_of_another_session_gives_no_head` (`OtherSession`).
4. `a_session_file_whose_pid_is_not_the_head_gives_no_head` (`OtherProcess`).
5. `a_missing_unreadable_symlinked_fifo_or_oversized_session_file_gives_no_head_and_never_follows_the_link` (table: absent, a directory, a symlink to a valid file, a FIFO (must not block), one byte over the cap, invalid JSON).
6. `a_start_time_the_session_file_disagrees_with_gives_no_head` (only if phase 2 kept the `procStart` comparison; otherwise remove it from this list in the branch copy).
7. `a_name_that_is_not_derived_gives_no_own_suffix` (`nameSource: auto`, free text with spaces, spec §5.1.1).
8. `the_caller_check_accepts_only_the_same_complete_record_at_the_topologys_head_position` (equal; same pid with another start time; incomplete record; a different parent) — in `tests/head.rs`, which owns the same-head comparison, not in the new file.

## Proof

`CARGO_BUILD_JOBS=4 cargo test --locked -p fgos-mailbox --test head_finder --test head -- --test-threads=4`, clippy and fmt on the crate, green on fresh main. Commit `feat(mailbox): find the Claude Code head from its session file and check the caller's topology against process facts`; census; sync; push.

## Deviations

From phase 2's probe (`plans/reports/research-261022-1751-mailbox-v4-hook-process-probe.md`): Claude Code 2.1.308 under `claude -p` runs the hook through one `sh` (dash) whose parent is the `claude` head, so the live suite uses **topology B**; `procStart` equals `/proc/<pid>/stat` `starttime`, so the finder compares it and test 6 stays. Both topologies are still built and tested (the plan specifies both).
