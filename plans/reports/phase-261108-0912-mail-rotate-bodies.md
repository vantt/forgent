# Mailbox: rotation of the mail-body ref and its status line (phase report)

Branch `mail/rotate-bodies`, worktree `/home/vantt/projects/forgent/.claude/worktrees/agent-ab78f0e47edc3cd15`, target `/home/vantt/projects/forgent-worktrees/mail-rot-target`. Not pushed, not merged, target kept for review.

## Outcome

With `mailbox.remote.bodyRef` on, the sync child of the owner machine now resets `refs/fgos/mail-bodies/<machine>` to a new parentless root whose tree holds only the bodies younger than the lifetime, and pushes it under the lease on the mirror it just fetched. `fgos mailbox status` prints whether `bodyRef` is on and, when it is, how many bodies this machine's ref keeps and how long ago the oldest was sent. With `bodyRef` off nothing runs and nothing changes except one status line saying so.

## Key: new, not reused

`mailbox.record.bodyRetentionSec` (86400) is the lifetime of a body inside the local record, a different thing. I added exactly one key, `mailbox.remote.bodyLifetimeSec`, default 604800, beside `bodyRef`: config standard, schema (integer, minimum 1), `limits.v1.json` (reader `host`; the existing contract-versus-standard test covers it), `remote.v1.json` limits row, and `CrossMachine.body_lifetime_sec` in `mailbox_config.rs` (zero or mistyped is refused like the other keys).

## Choices

- Age source: the signed `sentAt` of this machine's own `mailbox.message-sent` events (own origin in `project:mailbox`) that carry `bodyHash`; the store timestamp is the fallback; the newest send wins when one text was sent twice. Why not the committer time of the adding commit: after one rotation every surviving blob sits in a single new root dated at rotation, so the commit date would restart every body's clock at each rotation; the header time never moves. A header whose time cannot be read is read as sent now (kept).
- Trigger: rotate when the union of the mirror tip's tree and the own tip's tree holds at least one blob to drop (header older than the lifetime, or no header and the orphan grace is over). A push only ever adds to the tip tree, so every blob reachable in history is in the tip tree; an expired blob therefore triggers the first rotation after it ages, and nothing expired can hide in history. This makes a separate "root older than the lifetime" test redundant, and avoids walking a long commit chain (the Git driver has no parent read). A body lives at most lifetime plus one sync interval.
- Cheap look first: a read-only look at the local mirror and own tips (filled by the sync's own body fetch moments earlier) decides whether anything is to be cut; only then does rotation take the seal, fetch again and build, so a sync with nothing to cut makes no extra network call.
- Orphans: a blob with no header is dropped only when the newest commit of the ref is at least 600 s old (`ORPHAN_GRACE_SECS`). Reason: send pushes the body before it appends the event, so a rotation landing between the two would otherwise cut a live body. Not in the brief; added because the window is real.
- Build and push: `on_body_ref` (same seal, `BODY_WRITER`, `recover_own_transfers` first); the new root is built from what a fresh `fetch_base` brought (mirror tip tree plus own tip tree), never from the earlier look; own ref moved by compare-and-swap; push through the existing leased door. A refused push returns an error line from the sync child and is retried at the next sync; the remote is not replaced.
- Refactor in the same file, one door: `publish` and rotation share `fetch_base`, `union_entries`, `write_root`, `move_ref`, `push_acknowledged`; publish behaviour is unchanged (its tests pass).
- No Git crate change; the primitives (`commit_time`, `write_tree` with an empty tree, leased push of a new root) already existed.

## Files

- `apps/fgos/src/wiring/mailbox_body.rs`: shared helpers, `Retention`, `rotate`, `stage_rotation`, `Held`/`held`, `Held::text`, unit tests.
- `apps/fgos/src/wiring/mailbox_remote.rs`: `body_sent_times`; `ago` made `pub(super)`.
- `apps/fgos/src/wiring/mailbox_sync.rs`: `rotate_bodies` after the sync and ingest, only with `bodyRef` on and a sync that ran to its end; silent on success (the child prints only failures).
- `apps/fgos/src/wiring/mailbox_verbs.rs`: status lines and `crossMachine.bodyRef` in `--json` (`on`, `kept`, `unnamed`, `oldestSentSecs`, `lifetimeSec`).
- `apps/fgos/src/wiring/mailbox_config.rs`, `mailbox_ingest.rs` (test helper field), the two YAML files, `limits.v1.json`, `remote.v1.json`, `CHANGELOG.md`, `packages/git/contracts/mutation-census.v1.json`.

## Tests and owners

- Routes (`apps/fgos/tests/mailbox_routes.rs`, wiring harness): `the_owner_resets_its_body_ref_to_a_new_root_holding_only_the_bodies_younger_than_the_lifetime` (old dropped and unreachable, young kept, a young body only the remote holds kept, orphan dropped, one commit, a second sync changes nothing); `a_machine_whose_body_ref_setting_is_off_never_rotates_its_body_ref`; `status_names_the_body_ref_setting_and_the_age_of_the_oldest_body_kept`. Helpers `append_mail_at`, `push_bodies_at`, `git_out_env` extend the existing ones.
- Unit (`mailbox_body.rs`): `a_rotation_built_before_the_remote_moved_is_refused_and_the_remote_keeps_its_tip` (the one mailbox-level wiring proof of the lease; the Git crate test owns the lease itself); `a_body_is_kept_while_the_message_naming_it_is_younger_than_the_lifetime_and_a_nameless_one_only_until_the_grace_ends` (the age rule).
- `mailbox_config.rs` test extended for the new key (zero refused).

## Commands and results (CARGO_TARGET_DIR on ext4, `-j 3`)

- `cargo test -p fgos --test mailbox_routes`: 45 passed. `--test mailbox_sync_child`: 2 passed. `--bin fgos mailbox`: 16 passed.
- `cargo clippy -p fgos --all-targets -- -D warnings`: clean. `rustfmt --edition 2021 --check` on the seven Rust files: ok.
- `cargo check -p fgos --target x86_64-pc-windows-msvc`: ok (only the known `envelopes` dead-code warning); `--target aarch64-apple-darwin`: ok.
- `node scripts/git-one-door-scan.mjs --write-census`: 0 undeclared; census staged.
- No process of mine left running.

## Risks

1. A blob with no header in this clone's own-origin log is dropped after the grace. If a machine's store was rebuilt before its own earlier headers were fetched back, young bodies would look nameless and be cut (receivers then settle `remote-body-expired`). The same holds for two clones of one machine: a body whose header sits only in the other clone's unsynced log. Both are the documented one-clone-per-machine assumption.
2. Rotation reads every own `mailbox.message-sent` event each sync while `bodyRef` is on; fine at current volume.
3. The orphan grace of 600 s is my number, not from a spec; steady sending within every 10 minutes delays only orphan cleanup, never expiry of headed bodies.
4. A refused rotation leaves the local own ref on the new root until the next publish or rotation re-aligns it on the fetched mirror; both build on the mirror union, so nothing is lost.

## Unresolved questions

- Is the orphan grace acceptable, or should an orphan be dropped at once as the plan says (accepting the send race)?
- Should the sync child log a successful rotation (the module says it prints only failures)?
