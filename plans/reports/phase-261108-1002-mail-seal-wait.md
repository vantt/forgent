# Mail send waits for the event seal (bodyRef on)

## Outcome

With `mailbox.remote.bodyRef` on, a send that overlaps a sync no longer refuses for ordinary seal contention. Every body transfer (send, the sync child's body fetch, rotation) now waits up to 60 s for the `event-seal` instead of 5 s; a seal held past 60 s still refuses with `body-not-published`, the unchanged `retry when the remote is reachable, or set mailbox.remote.bodyRef to false...` text, and nothing is recorded (the body publish runs before the event append). `bodyRef` off is untouched, and no rotation-while-off was added.

## Measurement: how long the seal is held

- The sender's wait was `APPEND_WAIT_MS` = 5000 ms, shared with the Event Store's append wait.
- The Event Store sync (`sync_with_fs`) holds the seal across sealing every open stream, the event fetch, merge and the push, i.e. network inside the seal. That is in the Event Store and is not shortened here.
- The sync child takes the seal in separate holds: the event sync, then the body fetch (own hold, released before ingest, which holds only the record), then a second event sync if mail was settled, then rotation (only when a body is due to be cut). The sender can slip in between holds, so what it must outlast is the longest single hold.
- Measured on fg-server2 at load average 16 (the loaded condition of the observed failures): three plain `fgos events sync` runs against the real remote took 5.9 s, 12.0 s and 10.2 s wall, and a fourth 8.3 s. The wall time includes process start, so the seal hold is a subset of it, but 5 s is clearly below it. A bare `git ls-remote` took 0.6 s. This matches the two refusals seen live.
- Upper bounds: a rotation hold is a fetch plus a push, each bounded by `PUSH_TIMEOUT` (30 s), so at most about 60 s in a pathological case. The Event Store sync's own transport default is 300 s; a seal held that long is a genuinely stuck transfer.

## Choice and why

Option (a), a longer bounded wait: `SEAL_WAIT` = 60 s in `mailbox_body.rs`. It is about five times the worst measured hold (12 s), covers a rotation's two bounded transfers, and keeps the push timeout at 30 s. A normal overlap waits only the seconds the sync still needs; the 60 s is paid only in the stuck case, after which the old refusal stands (worst case about 90 s with the push).

Option (b), shortening the sync's hold, was not taken: the long part is the Event Store sync's fetch and push inside its seal, which is the Event Store's one-scope rule; changing it risks the ordering and hold rules. The body fetch hold is already minimal. No queue of sends (order invariant kept: body acknowledged before the event is appended). No Event Store or Git crate change.

One door: the three callers share `on_body_ref`, so the sync child's body fetch and rotation also wait up to 60 s rather than 5 s behind a send. That is harmless for a detached child and means a fetch that lands on a send is no longer dropped to the next interval.

## Files

- `apps/fgos/src/wiring/mailbox_body.rs`: new `SEAL_WAIT` and `take_seal(seal, wait)` (the one place the seal is taken for a body transfer; `on_body_ref` calls it); removed the `APPEND_WAIT_MS` import; one module test.
- `apps/fgos/tests/mailbox_routes.rs`: one route test.
- `CHANGELOG.md`: Unreleased line.
- `packages/git/contracts/mutation-census.v1.json`: regenerated (digests only), 0 undeclared.

## Tests and owners

- `mailbox_routes.rs::a_send_with_the_body_ref_on_waits_out_a_seal_held_longer_than_an_append_waits` (owner of the send-level behaviour, next to the other bodyRef send tests): the test holds alpha's seal for 8 s (longer than the old 5 s, shorter than 60 s) while a real `mailbox send` runs; the send exits 0 after the seal is free, the body is on the remote and one event is recorded. I confirmed it fails with `SEAL_WAIT` set back to 5 s, then restored 60 s.
- `mailbox_body.rs::a_seal_is_waited_for_up_to_the_bound_and_refused_past_it` (owner of the seal wait itself): a hold released after 1.5 s is waited out; a hold outlasting the wait is refused with `event-seal not taken: Timeout`.
- The refusal text and the "records nothing" path are owned by the existing `a_body_push_the_remote_refuses_leaves_the_send_unrecorded...`: every `publish` error, including the seal timeout, goes through the same `body-not-published` refusal before the append. A send-level test of a seal held past 60 s would need a 60+ s wall wait or a test-only wait override; I did not add either (the earlier rule: no test-only switch). That is the one gap against the acceptance wording, covered instead at the seal-wait level plus the shared refusal path.

## Commands and results

- `cargo test -p fgos --test mailbox_routes --test mailbox_sync_child`: 47 passed, 2 passed. `--bin fgos mailbox`: 18 passed.
- `cargo clippy -p fgos --all-targets -- -D warnings`: clean. `cargo fmt -p fgos --check`: ok.
- `cargo check -p fgos --target x86_64-pc-windows-msvc`: ok (known dead-code warning only). `--target aarch64-apple-darwin`: ok.
- `node scripts/git-one-door-scan.mjs --write-census`: 0 undeclared; census staged.
- CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/mail-seal-target, `-j 3`. No full suite run. The known `mailbox_identity.rs:358` flake did not appear.

## Risks

- A genuinely stuck seal holder now makes a send wait up to 60 s before refusing (worst case about 90 s including the push), where it used to refuse in 5 s. Accepted by the owner's "must not refuse for ordinary contention".
- The sync child can also wait up to 60 s behind a long send; children are detached and the due stamp prevents pile-up under normal intervals.
- The 60 s is a constant, not a setting; a setting would need setup and doctor registration and was out of scope.

## Unresolved questions

- None blocking. Does the owner want the 60 s bound exposed as a config key later if a machine shows holds beyond 60 s?
