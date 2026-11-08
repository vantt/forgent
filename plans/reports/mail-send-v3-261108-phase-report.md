# Mailbox sender: payload version 3 (phase report, step 4)

Branch `mail/send-v3`, worktree `/home/vantt/projects/forgent/.claude/worktrees/agent-a6bbd112c0fb75b57`, target `/home/vantt/projects/forgent-worktrees/mail-send-target`. Not pushed, not merged, target kept for review.

## Outcome

With `mailbox.remote.bodyRef` on, a send to another machine is signed as version 3 under `fgos-mailbox-message/3\n`: the event carries `bodyHash` (sha256 hex) and `bodyBytes`, no `body`, and `wake: true` when asked (an optional signed field of the same domain, exactly as `remote.v1.json` says). The body is one blob named by its hash in a commit on `refs/fgos/mail-bodies/<this machine>`, pushed by the Git crate's leased push, and the event is appended only after the remote acknowledged that push. With the setting off (the default) the payload, domain and bytes are what they were.

## Order-invariant choice: strictest reading, body acknowledged before the event exists

The send path appends the event itself and a detached child pushes, so the weaker reading (append first, child pushes the body before the event) was available. I did not take it: the events ref holds every stream of a machine and any caller of the Event Store sync (the child, `fgos events sync`, setup, a timer) pushes it, so "the child pushes the body first" cannot stop another path from publishing a header whose body is missing. Instead `send` calls `mailbox_body::publish` after signing and before `log.append`: it writes the blob, commits, moves the local ref, pushes the ref and requires `PushOutcome::Accepted`. Any other outcome (refused, lost lease, outcome unknown, timeout, seal busy) returns `body-not-published` and the send answers `not recorded`; no event exists, so no sync of any machine can publish one. The user repeats the send; the retry continues from the local ref that already holds the blob and pushes again.

Cost of this choice, stated plainly: with bodyRef on, `fgos mailbox send` to another machine waits for a git push (bounded at 30 s by `PUSH_TIMEOUT`, plus up to 5 s for the seal) and fails when the remote is unreachable, instead of recording offline. The setting is off by default and per remote. A crash between acknowledged push and append leaves an orphan body, which the plan already accepts (dropped at rotation).

## What was built

- `apps/fgos/src/wiring/mailbox_body.rs`: `on_body_ref` is the one door for both body fetch and body push: it binds the event-seal hold to `refs/fgos/mail-bodies/<machine>` under `BODY_WRITER` and runs `recover_own_transfers` before the work (fetch was refactored onto it, behaviour unchanged, default transport timeout kept). New `publish(main, remote, machine, body)`: base is the own ref's tip, else the own mirror (so a fresh clone of the machine does not cut bodies the remote holds), else empty; new commit = base tree plus the blob (a body already in the tree adds no commit but is pushed again); `write_blob`, `write_tree`, `write_commit`, `compare_and_swap`, `push_refs` of the Publication port. Refuses when the store's machine id differs from the id the event will name (the receiver looks the blob up under the signer's machine id), and when the tree holds a non-blob entry. New `sha256_hex`, now also used by `check`.
- `apps/fgos/src/wiring/mailbox_remote.rs`: `sent_payload` picks version and domain from `(body_ref, wake)`; `send` publishes the body before the append; the sent-view preview of a version 3 send shows `(body in the mail-body ref)` instead of an empty string (small consequence of the format, not asked for).
- `apps/fgos/src/wiring/mailbox_config.rs`: `CrossMachine.body_ref`, read next to `requireConfirmed`; a missing or mistyped key is refused like the others. `mailbox_ingest.rs` test helper updated for the new field.
- Registration, following exactly where `requireConfirmed` is wired: `core/config-standard/mailbox.yaml` (default false), `core/config-schema/mailbox.schema.yaml`, `packages/mailbox/contracts/limits.v1.json` (reader `host`; the existing contract-versus-standard test covers it), `packages/mailbox/contracts/remote.v1.json` (limits row, and the `bodyRefVersion.when` text now states the setting and the order rule). `requireConfirmed` has no separate setup or doctor registry entry (rg over `src/setup` finds none; setup and doctor read config through the schema), so none was added for `bodyRef`.
- `CHANGELOG.md` line under Unreleased. Census regenerated: 0 undeclared (line shifts only).
- No Git crate change was needed: every primitive already existed.

## Tests (one proof per behaviour, `apps/fgos/tests/mailbox_routes.rs`)

- New `a_send_with_the_body_ref_on_signs_a_version_three_header_and_the_body_reaches_the_head_through_the_body_ref`: signature verifies under `/3` on the other machine's key, `bodyHash`/`bodyBytes` match, no `body`, wake carried, blob readable on the remote's `refs/fgos/mail-bodies/<alpha>`, one receiver sync delivers body and wake to the head. It replaces `a_body_pushed_before_its_event_is_delivered_by_one_sync_of_the_receiver`, which hand-signed a header only because no sender emitted version 3; the new test owns the same behaviour (one sync delivers a pushed-before-event body) with the real sender. The hand-built `append_mail`/`push_bodies` helpers stay for the receiver cases a real send never produces (held, expired, failed fetch).
- New `a_body_push_the_remote_refuses_leaves_the_send_unrecorded_and_no_header_published_until_it_is_retried`: the remote's `refs/fgos/mail-bodies` directory is read-only, so the push is refused; the send exits 1 with `not recorded` and `body-not-published`, no event is appended, three sync children of both machines later no event ref on the remote contains `mailbox.message-sent` and the receiver has nothing; after the directory is writable the same send records, the blob is on the remote and the receiver delivers. (A `pre-receive` hook was tried first and does not run: the driver disables hooks for its children.)
- Existing owners unchanged: v1/v2 sending and wake in `a_send_to_a_session_on_another_machine_...` and `a_wake_asked_from_another_machine_...` pass untouched (bodyRef=false path); config reading in `mailbox_config.rs` test extended with the new key; wire domain constants in `mailbox_remote.rs` test.
- Not done: no unit test of the tree-merge in `publish` apart from the routes proofs; a second push of a body already in the tree is exercised only through the retry (the blob is in the local ref from the refused attempt).

## Commands and results (CARGO_TARGET_DIR on ext4, `-j 3`)

- `cargo test -p fgos --test mailbox_routes`: 41 passed. `--test mailbox_sync_child`: 2 passed. `--bin fgos mailbox`: 14 passed.
- `cargo test -p fgos-config -p fgos-mailbox -p fgos-mailbox-core`: all ok, 0 failed.
- `cargo clippy -p fgos --all-targets -- -D warnings`: clean. `rustfmt --edition 2021 --check` on the five Rust files: ok.
- `cargo check -p fgos --target x86_64-pc-windows-msvc`: ok, only the known `StoreLog::envelopes` dead-code warning. `--target aarch64-apple-darwin`: ok.
- `node scripts/git-one-door-scan.mjs --write-census`: 0 undeclared; census file staged with the commit.
- No process left running (checked with ps).

## Risks

1. Offline or slow remote now fails a bodyRef send; see above. Mitigated by default off and per-remote.
2. The seal is held across the push (up to 30 s); a concurrent sync child waits or this send refuses after 5 s. Same lock the existing sync holds across its own push.
3. A lost lease (another writer moved the ref) refuses the send; the retry re-reads the tip. Two clones of one machine writing the same body ref would replace each other's bodies (leased replace by design; one clone per machine assumed).
4. `fgos mailbox send` caps were counted before the push; a refused push over-counts the sender, the existing documented direction.
5. The `send` timeout bound is my choice (30 s), not from a spec.

## Unresolved questions

- Is a synchronous push at send time acceptable to the owner, or should a machine that wants offline recording keep v1/v2 (current behaviour when bodyRef is off)? A queued variant would need every event-publishing path to know about pending bodies, which is Event Store territory.
- Should `fgos mailbox status` also print whether bodyRef is on for this machine? Not added.
