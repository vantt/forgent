---
phase: 1
title: "Sync, preconditions, API re-check"
status: pending
depends_on: []
live_calls: 0
---

# Phase 1: Sync, preconditions, API re-check

## Context

While this plan was written the branch moved: the V2 review (`plans/261022-1005-mailbox-v2-record-store/reports/code-review-v2.md`, committed on the branch in `599570dbd`) is being acted on by another session. At 15:30 the branch head was `b299e63f7` ("never pass the exact name of a dead head on to a live head it prefixes", the V2 H1 fix) and the worktree held **uncommitted** edits to `record/{bodies,mod,paths,sys}.rs`, `tests/record_bodies.rs` and `tests/record_snapshot.rs` (V2 M1/M2 work). V4 builds directly on `Record::hold`, `Record::body` and `Paths`, so it must start from a settled tree. <!-- Updated: red-team - baseline and dirty-tree gate -->

## Steps

1. `free -g | awk '/Mem:/{print $7}'` ≥ 8.
2. **Clean-tree gate (hard stop).** `git -C /home/vantt/projects/forgent-mailbox status --short` must print nothing. If it prints anything, **stop with status BLOCKED**: tell the controller which files are dirty; never commit, stash or discard another session's work. V4 starts only after the V2 review work is committed and pushed by its owner.
3. Record the branch head as **the V4 base** (`git rev-parse HEAD`); phase 10's review diff starts there. Write it into the branch copy of this file.
4. Sync (plan.md "Branch sync rule"). Record the merged main commit.
5. **V2 H1 gate, by test, not by grep.** Run the core name test that owns "the exact name of a dead head is never resolved to a live head it prefixes" (`rg -n "dead" packages/mailbox/rust/core/tests/names.rs` to find its exact name; at `b299e63f7` it sits in `core/tests/names.rs` around line 77), with `cargo test --locked -p fgos-mailbox-core --test names <name> -- --exact`, and read its exit status. Missing or red: stop with status BLOCKED (V4 does not fix V2 findings).
6. **API checklist** (grep each in the worktree; for each mismatch, write the current name and signature into this file's "Deviations" and adjust the later phases' wording, not their behaviour):
   - `fgos_mailbox::record::{Record, Paths, Wait, Held, Reported, ReportsChange, RecordError, Step}`; `Record::open(fgos_dir)`, `Record::hold(wait, now, limits, mutate)`, `Record::send(req, wait, now, limits)`, `Record::body(id, expected_bytes, limits)`, `Held { value, wrote, warning, collected }`. The V2 M1/M2 work may have changed these: re-read `record/mod.rs` in full.
   - `fgos_mailbox::hook::{begin, render_reply, finish, Begun, Claimed, FinishTicket, HeadFacts, HookCall, HookReply, QuietReason, HookEvent, Adapter, HookLimits, LockWaitLimits}`; `Begun::state_changed()`.
   - `fgos_mailbox::adapters::TestedClis::{embedded, contains}`; `fgos_mailbox::head::{is_complete, head_text, judge_stored, stored_liveness}`.
   - core: `MailboxState::{send, claim, finish, inbox, binding, bindings, message}`, `SendRequest`, `SendOutcome`, `Refusal` (`code()` and its `Display`, if any), `WakeDrop`, `MessageView { id, kind, from_label, recorded_at, offers, in_flight }`, `Header.body_bytes`, `render`, `frame_sections`, `Limits`.
   - `fgos_process::facts::{identity_of, judge_here, Record}`; `fgos_session_identity::resolve_current`.
   - The mailbox root in `record/paths.rs` is `<fgosDir>/runtime/mailbox`. Phase 3 copies this exact string; if paths.rs says otherwise now, phase 3 uses what it says.
   - V2 hand-off: the hold takes the lock with `LockScope::seeded(vec![])`, so nothing in V4 may take a mailbox hold while holding another lock. The shell and the verbs hold nothing else.
7. Installed versions: `claude --version`, `~/.local/bin/codex --version` (in the owner's shell `codex` is a zsh function; call the binary). Compare with `packages/mailbox/contracts/adapters.v1.json` `testedAgainst`. On 2026-10-22 15:01: Claude Code **2.1.308** (listed: 2.1.307), Codex **0.161.0** (listed).
8. Baseline proof on fresh main: `CARGO_BUILD_JOBS=4 cargo test --locked -p fgos-mailbox -p fgos-mailbox-core -- --test-threads=4` (observable exit). Record pass counts.

## Proof

Clean tree; the H1 test green by name; baseline green on fresh main; checklist written.

## Done when

Branch synced and pushed. The plan directory reaches the branch through the main merge (the controller commits it on main), as V2 and V3 did; the implementation lead records deviations and the "Done on the branch" notes in the branch copy of each phase file and commits them there.

## Deviations

(filled by the implementation lead)
