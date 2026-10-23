# Phase 10: The one-file write transaction

Depends on 02, 07, 08, 09. Suggested executor: sonnet; opus only after a failed sonnet attempt; independent sonnet review before landing (concurrency and refusal order).

## Context

Spec section 6: three doors write config (`init`, `doctor --fix`, `fgos config set|unset|patch|...`); the doors are Slice C and D. This phase builds what they all call: one transaction on one source file. Who may write: a confined worker writes no config through any door (`config-write-confined`); a `command` or `global-only` key is written only by an unconfined session; the result records the writer id. Steps: (1) take the scope's lock; (2) open the file under the file rules and compare its revision, computed from that same open file, with the revision the caller's patch was computed against, else `config-write-conflict` and nothing written; (3) apply the edits through YAML Document, render the comments, validate the result against the schema; (4) re-read and compare the revision again just before replacing, else `config-write-conflict`; replace through Durable File keeping the file's mode (0600 for global); (5) release. Limits stated in the spec stand: one source per transaction; an outside editor in the window between step 4's check and the rename loses its edit without an error.

## Files it may touch

`src/write.rs`, `contracts/fixtures/write.v1.json`, `tests/write_golden.rs` (edit semantics on temp files), `tests/write_concurrency.rs` (locks, two writers, observer seam).

## Design

- **Request:** `WriteRequest { target: Target (Project | Global | Accounts), roots, expected: Revision (Absent | Sha(String)), edits: Vec<Edit>, reason: String, acknowledge_comment_loss: bool, lock_wait_ms }` and `Writer { identity: &WriterIdentity, class: SessionClass }` (D3). `Edit` is `Set { path, value }` or `Unset { path }`; `patch` is several edits with one reason. Paths are `Vec<Segment>` (text form parsing is the door's job, `fgos_yaml_doc::path::parse_path`).
- **Order of refusals (nothing touched until the lock):** confined writer -> `config-write-confined` (no file opened, no directory created, no lock file created); reason rules (phase 08); target is legacy JSON -> `config-format-legacy-json` (D11); both formats present -> `config-legacy-shadowed`; each edit's path judged for scope and file placement (phase 06) for the target's role -> `config-key-out-of-scope` / `config-key-in-wrong-file`; each `Set` value checked against its descriptor (phase 05) -> `config-schema`. Only then the lock.
- **Lock:** `LockScope::acquire(PROJECT_CONFIG | GLOBAL_CONFIG, params, Wait::Ms(lock_wait_ms))` (phase 02 constants; `packages/holder-lock/rust/src/scope.rs:120`). A held or timed-out lock is `config-write-conflict` with reason `lock-held` (D13). The scope is local to the call (dropping it closes the description).
- **Open and compare (step 2):** `open_beneath` (phase 07) for the file, creating `.fgos/` or `~/.fgos` (and `private/` at 0700) beneath the root when missing. Compare the revision of the bytes read from this one descriptor with `expected`; `Absent` expected and file present, or the reverse, is a conflict.
- **Edit (step 3):** parse with `Profile::StrictConfig`; per edit: redundancy (D14: a `Set` equal to the standard value of the path on an absent key is skipped with notice `redundant-noop`; on a present key it becomes an `Unset`), then `Document::set` / `remove` with `CommentLoss::Refuse` unless the caller acknowledged. A `comment-would-be-lost` from yaml-doc is returned as it is, so the door can ask and retry. After the value edit, `set_comment_block` with phase 08's block for the key (`block_for_new_key` or `block_for_changed_key`); newly created described ancestors get their `@fgos:doc` line only. A new file starts from `header_lines` (the `# @fgos:v1` line and the pointer line). `Unset` on a key with a `@fgos:why` or free note needs `acknowledge_comment_loss` (spec section 7). Then validate the produced document with `judge` and `check` (everything but `undescribed`); any refusal writes nothing.
- **Second check and replace (step 4):** reopen beneath, compare the revision again and the parent directory identity against the descriptor held since step 2 (dev, ino); then `fgos_durable_file::replace_durably_with_mode(dir, name, bytes, existing_mode)` (`packages/durable-file/rust/src/lib.rs:169`) for an existing file, `install_once_with_mode` for a new one (a racing creation makes it fail, mapped to conflict), modes: existing file keeps its mode; a new global, accounts or token-directory file 0600 and `private` 0700; a new project file 0644 filtered by umask.
- **Observer seam (the only seam, not a test switch):** `commit_observed(request, writer, observe: impl FnMut(Step))` with `Step` of `LockHeld`, `FirstCheck`, `Edited`, `Validated`, `SecondCheck`, `Replaced`; `commit(...)` passes a no-op. Same pattern as `replace_durably_observed` (`packages/durable-file/rust/src/lib.rs:187`), whose steps its tests already use to prove durability points. No env, no cfg, no flag.
- **Result:** `WriteResult { writer_id: String (the real id, D18), source, new_revision, applied: Vec<AppliedEdit>, notices: Vec<Notice> }`; on refusal the file is byte-identical and no temporary file remains (the Durable File contract; tested).

## Steps

1. Merge `origin/main`. Implement refusal order, then the happy path on existing and missing files, then lock and conflicts, then the observer.
2. `write_golden.rs` over `write.v1.json` (about 34 cases; inline file text before and after): byte fidelity (edit one deep value, every other byte identical, comments included; acceptance 2); new key gets `doc` then `why` in the spec's order and a note above it is preserved; changed key replaces why and keeps doc and notes; set on a missing file creates header, doc, why; redundant set is a notice and writes nothing; redundant set on a present key becomes `unset`; unset with and without acknowledgement; `comment-would-be-lost` from a flow collection passes through; reason refusals; scope and placement refusals happen before any lock file exists; type mismatch writes nothing; undescribed key written with no doc line; legacy JSON refused; shadowed refused; `null` on an `<any>` that allows it; `patch` of three edits is one transaction with one revision change.
3. `write_concurrency.rs` (real locks, `common::serial()` like `packages/holder-lock/rust/tests/common/mod.rs:24`): two threads, same expected revision, one commits and one gets `config-write-conflict`, the file parses and holds exactly the winner's bytes; a child process holding `project-config` makes the writer return `lock-held` after the bounded wait and write nothing; observer-driven: at `Edited` another process rewrites the file, then the commit gets conflict at `SecondCheck` and the file keeps the outsider's bytes (acceptance 3 and the section 6 limit); at `FirstCheck` mutate the file: conflict at step 2; a confined writer creates no lock file and no directory; the observer aborting before `Replaced` leaves the file unchanged and no `*.tmp` file; a killed lock holder (child killed) is reclaimed by the predecessor protocol and the write proceeds.
4. Prove the actor: the written `@fgos:why [<actor>]` equals `writer.identity.id` and the result's `writer_id` is the same string.

## Owning proofs

| Behaviour | Proof |
|---|---|
| Edit semantics, comments, redundancy, refusal order, nothing written on refusal | `write_golden.rs` over `write.v1.json` |
| One committer among racing writers, lock-held, second check, no torn file | `tests/write_concurrency.rs` |
| Rank order of the lock | phase 02's `lock_rows.rs` (not repeated) |

## Validation

`cargo test -p fgos-config --test write_golden --test write_concurrency --jobs 4` (the concurrency test runs serial inside its binary), clippy, fmt. Run the concurrency binary three times in a row once at phase end to catch flakiness; a flaky test is fixed, not retried.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Lock held by a crashed process | L x M | holder-lock reports `Held` only for a live holder; the killed-holder test proves reclamation |
| Torn file | L x H | only `replace_durably_with_mode` writes; tests assert no partial and no temp file on abort |
| Parent directory swapped between check and rename | L x H | identity re-check just before replace; residual window named in the spec section 6 limits and idea I3 |
| `set_comment_block` after `set` fails and leaves a half-edit | L x H | all edits run on the in-memory `Document`; bytes are produced only after every edit and the validation pass; any error discards the document (yaml-doc leaves it unchanged per its re-parse guarantee) |
| Reason accepted but yaml-doc guard refuses a character (bidi) | M x L | the guard's refusal passes through as a yaml-doc rule id; fixture |
| Mode 0644 for a new project file differs from today's `writeFileSync` default (0666 & umask) | L x L | same result under umask 022; documented in the phase commit |

## Rollback

Revert: new files only. Nothing calls the transaction until Slice C.
