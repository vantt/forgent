# Implement: identity shared directory, crate + contracts + host adapter (part 1)

Branch `ident/p05-shared-directory`. Scope: plan steps 2-4. Not done (part 2): consumer manifest row, Node rebuild module, doctor row, `--machine` projector flag, docs, CHANGELOG, package.json `files` entry for the new contract.

## Built
- `packages/identity/rust/src/shared.rs` (feature `directory`): payload builders, `sign_payload`/`verify_payload` (domain `fgos-identity-directory/1\n` + `fgos-canonical-json` of payload minus `sig`; `sig` = `Signature` object), `fold(state_root, events, fetched_at) -> SharedView`, `SharedView::{resolve, list, retain_project, len}`, `publish_changes` (publish on change only + `session-ended` for sessions this machine published that left the directory), ports `EntryLog` and `LogDoor`.
- `refusal.rs`: `Liveness::Remote`, `Remote {machine, fetchedAt?, pin}` flattened into `Listed` and `Candidate` (absent for local).
- `directory::resolve` / `list` take `Option<&SharedView>`; all callers + tests updated (L10). Local first; remote only on local miss; remote entries listed after local ones, minus roles a live local session holds.
- `provider.rs`: `IdentityProvider::with_log_door(Arc<dyn LogDoor>)`. CLI verbs only: `--register`, `--role/--take`, `--drop-role`, `list --prune` call `publish`; failure prints `identity-publish-failed: <reason>: <detail>` on stderr, verb result unchanged. `resolve` asks the view only on a local `not-found`; `list` builds the view when a project id and store exist. `register_current`/`register_writer` (hook doors) untouched, never publish. Read fault: one stderr line `identity-shared-unavailable`.
- `apps/fgos/src/wiring/identity_log.rs`: `StoreLogDoor` over `fgos-event-store` (`append`/`read`, stream `project:identity`, `Layout::from_common_dir`). No project id, not a repo, or no migrated store (`layout.store()` missing) -> no publish, no read, no error. `fetchedAt` = `sync_status().last_fetch.time` when its error is none. Append passes the read cursor as `seen` (own position removed) so a later take orders after what it replaces. `apps/fgos` gains deps `fgos-event-store`, `fgos-git`.
- Contracts: `identity-event-streams.v1.json` (2 types, project scope, sealOnWrite true); additive `machine`, `fetchedAt`, `pin`, liveness `remote` in `identity.read/write.v1.json`. `consumers.v1.json` untouched.

## Choices
- Contract path: embedded with `include_str!` + `Registry::register(ConsumerContract)` (host already embeds `command-routes.json`; no runtime release-layout search). Note: `package.json` `files` has no identity contract entry; part 2 must add it for Node `registryFiles()`.
- Fold verifies the first event of each machine in store order first (so the pinned key is the first published one, not the newest), then newest-first per id, falling back to older events only when the newest is dropped. Events of this machine are skipped (local directory is its truth).
- Role across machines: later event in store order keeps the role; no event is published for the holder a take displaces.
- A shared machine handle shows as the machine id for the later machine.

## Tests
- `packages/identity/rust/tests/shared.rs`: 8 new (round trip + tamper, machine mismatch, key changed, last-wins + ended, role to later event, local beats remote + full id via view + list, unknown fields ignored, publish-on-change/ended). `cargo test -p fgos-identity`: all green.
- `apps/fgos/tests/cli_tests.rs`: 1 wiring test with two real clones (`--register` appends one event, repeat appends none, `resolve` of lead / full id from a second machine after sync). `cargo test -p fgos`: green (41 cli tests).
- `cargo clippy -p fgos-identity -p fgos --all-targets -- -D warnings`: clean.
- Census regenerated; no diff left after last commit.

## Measured (budget 50 ms)
- Resolve on an already folded view: ~5 us.
- Cold fold of 1000 events over 20 sessions: ~500 ms, i.e. ~25 ms per verified session (one `ssh-keygen -Y verify` each). A remote miss on a clone with few sessions folds in tens of ms; budget is NOT met for more than ~2 sessions without a cache. Part 2 cache (`.fgos/cache/identity-directory.json`, plan decision 7) must hold the verified view (or the host a verified-event memo) to meet 50 ms. Local hits never fold.

## Concerns
- Seal: appended events stay in `active.jsonl` until `fgos events sync` seals them; the Rust host does not hand off a detached seal like the Node CLI. The wiring test proves publish -> sync -> remote resolve.
- `publish_changes` trusts unverified own-machine events in the log to decide "unchanged".

## Part 2

Built:
- Verified-view cache `.fgos/cache/identity-directory.json` (main checkout): `{v, fetchedAt, entries(+machine, pin), dropped[{reason, machineId}], verified[sha256 of signed bytes + signature]}`, written atomically (`fgos-durable-file`), skipped when unchanged. `fold(state_root, events, fetchedAt, Option<&Cache>)` skips `verify_payload` for a cached hash only while the machine's current pin still equals the signing key (re-keyed machine is checked again; test proves 12 dropped `key-changed`). Written on resolve/list miss and after a publish that appended. Missing/unreadable cache: refolded silently; write failure: one stderr line `identity-cache-failed`. `project::project_at` returns the main checkout root beside the project info.
- `list --machine <handle|id>`: provider, projector (+ unit assertion), `command-registry.mjs`, regenerated `command-routes.json`; wiring test extended (cache file, `--machine`).
- Node: manifest row `identity`; `src/identity/directory-store.mjs` `rebuildFromStore` drops the cache and returns `{entries: [], dropped: []}` (no Node fold); `FGOS_FILE.IDENTITY_DIRECTORY`; contract added to `package.json` `files` (the legacy-node payload is built from that list; no other list names contract files). `verbs.test.mjs` rebuild expectation gains the identity row (cover null: the cache has no cursor); `consumers.test.mjs` compares to the manifest dynamically, unchanged.
- Doctor `identity-shared-directory` (cache only; passes with counts, warns on dropped / foreign project / shared handle, "no shared directory yet" otherwise), registry doc list, `checks.test.mjs` order list, new test in `identity-checks.test.mjs`.
- Docs: identity spec sections 5, 7, 10 and status line (seal note and "unchanged decided from own unverified events" included); Event Store spec consumer mention; CHANGELOG line.

Measured (release and debug agree): 1000 events / 20 sessions, warm read cache + fold + resolve of a remote hit 9 ms (release) / 15 ms (debug) against the 50 ms budget; cold fold ~500 ms. The store read itself is outside this number.

Gates: `cargo test -p fgos-identity` (9 shared tests), `cargo test -p fgos` (41 cli), clippy `-D warnings` for both: green. `node --test` on `test/event-store/{consumers,verbs}.test.mjs`, `test/setup/checks.test.mjs`, `test/rust-host/command-routes.test.mjs`, `test/cli/unknown-flag-rejection.test.mjs`: green. `test/setup/identity-checks.test.mjs` with `FGOS_HOST_BIN` set: my new test passes; 2-3 older tests (machine-id/key/project mint) fail intermittently, and 2 also fail on the base without my changes (checked with stash).

Not done / notes: the real two-machine run, and landing on the three machines, are the lead's.
