# Mailbox receiver: payload version 3 (phase report)

Branch `mail/recv-v3`, commit `64e6bfac7` (worktree /home/vantt/projects/forgent-worktrees/mail-recv-wt, target mail-recv-target). Nothing sends v3.

## What was built
- v3 header = v1 minus `body`, plus `bodyHash` (64 lowercase hex) and `bodyBytes` (<= 2048). Domain `fgos-mailbox-message/3\n` (`SENT_DOMAIN_BODY_REF`). Wake composes: `wake` is an optional signed field (absent or `true`) in the same domain, no second domain. Shape errors (inline `body` present, bad hash, bad/oversize bytes, `wake:false`) are remote-malformed; wrong domain is remote-signature.
- `apps/fgos/src/wiring/mailbox_body.rs` (new): `BodyMirror::resolve` reads the tip of `refs/fgos/remotes/<remote>/mail-bodies/<machine>` and the blob named `bodyHash`, then `check` verifies sha256, length, UTF-8. Machine id must pass `valid_machine_id` (ref component safety).
- `mailbox_ingest.rs`: verify takes v1/v2/v3 by one path (same verify door); a verified v3 header is resolved before the mail is kept. Found+valid -> delivered like v1/v2. Ref or blob absent -> `remote-body-expired`: counted drop plus a refusal that `settle` signs as `mailbox.message-settled` outcome=refused (same door as remote-unconfirmed). Blob present but hash/length/UTF-8 wrong, entry not a blob, or blob over cap -> remote-malformed drop, never delivered.
- New reason value `RemoteBodyExpired` / `remote-body-expired` (`packages/mailbox/rust/core/src/counters.rs`), no existing reason fit (`record-ttl` is a record age). Contract `remote.v1.json`: `bodyRefVersion` block and a `refusalsToSender` row.
- `fgos mailbox status`: JSON `data.crossMachine.acceptedPayloadVersions = [1,2,3]` and text line "cross-machine: this machine takes mail payload versions 1, 2, 3" (inside the cross-machine block, shown only when cross-machine mail is on). Constant `ACCEPTED_PAYLOAD_VERSIONS` in mailbox_remote.rs.

## Git read door (no Git crate change)
Reused `GitDriver::resolve_commit_ref` (inspect.rs:989) and `Inspect::read_paths_at` (lib.rs:471, driver.rs ~2850) through `event_store_clone::open` (the existing driver+repo opener). No new Git read path, no shelling out from product code.

## Deviation from the brief: no Event Store registration change
Brief item 4 asked to register a new schemaVersion. Not needed and wrong: the registry holds ONE schemaVersion per type and `Registry::validate` rejects any other (packages/event-store/rust/src/registry.rs:135-139). `mailbox.message-sent` is registered at schemaVersion 1 in packages/mailbox/contracts/event-streams.v1.json; payload `v` (1, 2 wake) is a separate field never registered, and v3 follows v2. Bumping to 3 would break v1/v2 appends. So `event-streams.v1.json` is untouched.
Older receivers still drop v3: their `verify` matches `v` in {1,2} only, `_ => malformed` (old mailbox_ingest.rs, the existing wake test asserted `v:3` -> RemoteMalformed and still passes, since a v3 without bodyHash is malformed here too).

## Gaps to settle in steps 3/4 (not decided here)
1. Nothing fetches the mail-body mirror yet. `fgos hook mailbox-sync` runs the Event Store `sync`, whose fetch mapping set is events+legacy only (git-mail-bodies report, deviation 1: `granted_fetch_mappings` holds mail-bodies, `publication_fetch_mappings` does not). A v3 header ingested before its body mirror is fetched is settled expired and the cursor moves past it. The sync child must fetch `+refs/fgos/mail-bodies/*:refs/fgos/remotes/<remote>/mail-bodies/*` before ingest (and the sender pushes the body before the event) before any machine sends v3.
2. A Git read failure (not a verdict) returns Err from `ingest` before the cursor moves, so it retries next sync; a permanent read fault would stall mail, same as other store errors.
3. Rollback hazard: a record that counted `remote-body-expired` may not deserialize in an older binary if that enum is serialized into the snapshot (I did not verify); only matters if a machine downgrades after receiving v3.

## Tests (one proof per behaviour)
- mailbox_ingest.rs `a_body_reference_message_is_signed_under_its_own_domain_with_an_optional_signed_wake` (new: no existing test covers v3 shape/domain/wake; v1 and v2 tests untouched except `taken.body` now asserts `Body::Inline`).
- mailbox_body.rs `a_body_is_taken_only_when_its_digest_length_and_text_match_the_signed_header` (digest/length/UTF-8 mismatch -> malformed) and `a_body_is_read_from_the_senders_mirror_and_a_missing_ref_or_blob_is_expired` (real git repo: found, wrong-content blob, absent blob, never-fetched machine, invalid machine id).
- mailbox_routes.rs: existing key-confirmation status test extended with `acceptedPayloadVersions == [1,2,3]` and the text line.
- Not proven end to end: ingest -> settled `remote-body-expired` event over two machines (no sender can emit v3; a hand-built signed event append harness would be a second copy). The refusal reuses the unconfirmed path (`refusals` -> `settle`), which mailbox_routes already proves.
- `a_wake_is_signed...` asserts v3+body -> malformed still holds.

## Gates
- `cargo test -p fgos --bin fgos mailbox`: 13 passed. `--test mailbox_routes`: 36 passed. `--test mailbox_sync_child`: 2 passed. `-p fgos-mailbox-core -p fgos-mailbox`: all ok (6+2+9+6+11+27+26 lines, 0 failed).
- `cargo clippy -p fgos -p fgos-mailbox-core -p fgos-mailbox --all-targets -- -D warnings`: clean.
- `rustfmt --edition 2021 --check` on changed Rust files: ok.
- `cargo check` x86_64-pc-windows-msvc and aarch64-apple-darwin (targets installed): ok; one pre-existing msvc dead_code warning (`StoreLog::envelopes`, mailbox is unix-only), same on origin/main.
- Census regenerated in the commit: 0 undeclared sites.
- Target dir size: see end of reply. No processes left running.

git diff --stat origin/main..HEAD:
```
 apps/fgos/src/wiring/mailbox_body.rs           | 216 +++
 apps/fgos/src/wiring/mailbox_ingest.rs         | 196 ++--
 apps/fgos/src/wiring/mailbox_remote.rs         |  15 +-
 apps/fgos/src/wiring/mailbox_verbs.rs          |  10 +
 apps/fgos/src/wiring/mod.rs                    |   2 +
 apps/fgos/tests/mailbox_routes.rs              |  11 +
 packages/git/contracts/mutation-census.v1.json |  26 +-
 packages/mailbox/contracts/remote.v1.json      |  19 +
 packages/mailbox/rust/core/src/counters.rs     |   4 +
 9 files changed, 461 insertions(+), 38 deletions(-)
```
