# Mailbox sync child: body fetch and hold (phase report, step 2b)

Branch `mail/sync-bodies`, commit `826ba154c` (worktree /home/vantt/projects/forgent-worktrees/mail-sync2b-wt, target mail-recv-target, 8.1 GB). Event Store and Git crate untouched.

## What was built
- `mailbox_body.rs`: `BodyFetch { Fetched, NotFetched(reason) }` and `fetch(main, remote)`. It opens the clone, takes the granted mail-bodies mapping (granted minus publication mappings), requires it in `Inspect::configured_fetch_refspecs` (the existing config read; no new read, no git shell-out), pins the URL with `fgos_event_store::refspec::pinned_url`, takes the `event-seal` hold, binds `HolderAuthority::new(.., refs/fgos/mail-bodies/<this machine>, "mailbox-body-fetch")`, runs `recover_own_transfers`, then `fetch_refs(.., [bodies mapping])`, then releases the seal (a release that cannot be proven counts as not fetched).
- `mailbox_sync.rs`: order is event sync, then `mailbox_body::fetch`, then ingest. `publish` now returns whether the sync ran to its end (false when another process held the seal); if it did not run or errored, the body fetch is skipped and the state is `NotFetched`. Held messages print `mailbox-sync: held <id>: <why>`; a clean fetch with no held mail stays silent.
- `mailbox_ingest.rs`: a v3 header without its blob is expired only under `BodyFetch::Fetched`. Otherwise, and on a Git read `Err` (which no longer aborts the ingest with `?`), that one message is held: `reached[origin]` is capped at `held_seq - 1`. Later events of that origin are still verified and delivered now; their drops and refusals are not counted or sent while the hold stands (they are read again later), so nothing is counted twice. Delivered mail is deduplicated on re-read by the core's `(machine, id)` rule. `ingest` now takes `&Hold` (record, limits, wait, now; `Hold` made pub) because the new parameter made clippy's 7-argument limit fail.
- `remote.v1.json`: receiver state `held` added, `expired` narrowed to the post-fetch condition, refusal row for `remote-body-expired` narrowed. States what the sender sees: no refusal during a hold; its status keeps counting the message as `waiting`; when the hold ends in remote-stale no settlement is signed either, so it stays waiting as unanswered.

## Seal door (no Event Store change)
`SealGuard.handle` is `pub(crate)`, so a caller outside the crate cannot borrow the guard from `acquire_seal`. I copied the door every outside caller uses: `fgos_holder_lock::acquire(Resource::new(SEAL_NAME, layout.seal_lock()), Mode::Ex, ..)` then `HolderAuthority::new` (packages/git/node-addon/src/git.rs:67-85, packages/event-store/rust/tests/seal_publication.rs:507). It runs after the event sync has released its own hold, never nested.

## Hold bounds (proved)
- Hold ends by the age rule: `verify` judges age before any body lookup, so a held header is dropped as remote-stale once older than MAX_AGE_SEC + 300. Unit proof: `a_body_reference_header_goes_stale_by_the_same_age_rule_which_ends_any_hold`.
- Re-read dedup holds for the whole hold: the core keeps `seen` for `max(ttl, ...) + 3600` s (remote.rs `forget_old_remote`), longer than any hold (<= MAX_AGE + 300 after the held event's own time, and later mail was first seen no earlier).
- Cursor never goes back (`advance_remote_cursor`), and the cap `held_seq - 1 >= cursor` because only events past the cursor are judged.
- A cursor entry of 0 can appear for an origin whose first judged message is held; it equals "unset".

## Tests (apps/fgos/tests/mailbox_routes.rs, two real clones sharing a bare remote; v3 events are hand-signed because no sender emits v3)
1. `a_body_pushed_before_its_event_is_delivered_by_one_sync_of_the_receiver`: body pushed first, event appended, one receiver sync delivers it (events, bodies, ingest in one child run).
2. `a_clone_without_the_body_mapping_holds_the_header_and_delivers_it_once_the_mapping_is_installed`: clone lacks the third mapping: v3 held, cursor on the sender's origin unchanged, a plain message after it is taken once and read again without a second copy, the sender is refused nothing; after the mapping is installed the next sync delivers the held mail and the cursor moves. This is also the idempotency proof.
3. `a_header_whose_blob_is_absent_after_a_successful_body_fetch_is_expired_and_the_sender_is_told`: ref present, blob absent, mapping installed: settled, cursor moves, sender status shows `remote-body-expired: 1`.
4. `a_failed_body_fetch_holds_the_header_instead_of_expiring_it`: remote advertises a mail-bodies ref whose object is missing, so the body fetch fails while the event sync does not; header held, no refusal; after the broken ref is removed the next sync delivers it.
- Extended: helper `sync_child_said` (stderr) split out of `sync_child`, which still asserts only nudge lines.
- mailbox_ingest.rs unit test for the stale bound (above).
- Mutation check: forcing `NotFetched` makes all four routes tests fail; reverted.

## Gates
- `cargo test -p fgos --bin fgos mailbox`: 14 passed (see flake below). `--test mailbox_routes`: 40 passed (36 + 4). `--test mailbox_sync_child`: 2 passed. `-p fgos-mailbox-core -p fgos-mailbox`: all ok.
- clippy `-D warnings --all-targets` on fgos, fgos-mailbox-core, fgos-mailbox: clean.
- `rustfmt --edition 2021 --check` on the four changed Rust files: ok.
- `cargo check -p fgos` x86_64-pc-windows-msvc: ok (pre-existing dead_code warning `StoreLog::envelopes`, same on origin/main); aarch64-apple-darwin: ok.
- Census regenerated in the commit: 0 undeclared sites.

## Concerns
1. Pre-existing flake, not from this change: `wiring::mailbox_identity::tests::an_omp_head_renders_...` fails at mailbox_identity.rs:358 (`unwrap` after copying /bin/sleep and spawning it; text-file-busy race with concurrent forks). Measured on origin/main with my change stashed: 8 of 25 runs failed; with my change 2 of 12. Left alone (not in my file list).
2. Every child now runs one extra `ls-remote` round trip (the body fetch) even with no v3 mail; it is silent unless a header is held. Lazy fetch only when a v3 header is absent would save it but breaks "bodies before ingest" simplicity; reviewer's call.
3. Event Store order check: `sync` fetches events twice (once before push, once after to confirm publication). The body fetch starts after `sync` returns, so it follows both, and the ruling's condition holds for every event the child's ingest can see. Nothing in `sync` makes events-then-bodies unsafe. The one unsafe window is a sender that pushes its event before its body, which the sender step forbids; a late body then reads as expired only if it is also absent from the sender's ref at the body fetch.
4. `fetch` waits up to 5 s (`APPEND_WAIT_MS`) for the seal; on failure it holds. Reasonable for a detached child; say if you want `Wait::Try`.

## Unresolved questions
- Concerns 2 and 4 for the reviewer.
