---
phase: 5
title: "Shared directory across machines (rung I4)"
status: pending
priority: P2
effort: "1.5d"
dependencies: [4]
---

# Phase 05: Shared directory across machines (I4)

Planned in detail 2026-10-24 after the Work cutover to the Event Store landed on all three machines (fg-server2 20:58, design-lap 21:45, fg-server 21:58). Facts: [scout report](../reports/scout-261024-2245-identity-i4-event-store-facts.md).

## Goal

A session on one machine resolves a session on another machine after one `fgos events sync` on each, by handle, by `lead:<LANE>` or by full id. The answer names the machine, says how old the entry is, never claims the remote session is alive, and carries an entry only when its signature verifies against the publishing machine's pinned key (I5).

## What exists (reused, not rebuilt)

- Local directory, `register_current`, `register_writer`, `drop_role`, `resolve`, `list`, `Refusal`/`Candidate`/`Liveness` (phase 04, `packages/identity/rust/src/directory.rs`).
- Machine key, `sign`, `verify`, pins with `seen`/`confirmed` (I5, `signing.rs`, `pins.rs`).
- Event Store: `append(layout, registry, AppendRequest)` (`packages/event-store/rust/src/append.rs:153`), `read` (`read.rs:424`), consumer stream `project:<name>` sealed onto the machine's own `refs/fgos/events/<machine-id>`, mirrors `refs/fgos/remotes/origin/events/*`, `fgos events sync`, `fgos rebuild` looping the consumer manifest `packages/event-store/contracts/consumers.v1.json` (Node, `src/event-store/consumers.mjs`).
- Precedent consumer: `porting` (`src/state/porting-store.mjs`, contract `porting-event-streams.v1.json`, stream `project:porting`).

## Decisions taken in this plan (inside the G0 frame; the lead decides and reports)

1. **Per project, not per machine.** The Event Store has no user-level stream (scout §3): the open root, refs, mirrors and cache are per clone. An entry is published into the store of the clone the session registered from, and only when that clone has a project id. A session with no project id stays local-only, as today. The local directory under `<stateRoot>/identity/sessions/` stays the source for this machine; the shared view only adds other machines' entries.
2. **No cycle.** `fgos-event-store` already depends on `fgos-identity` (`packages/event-store/rust/Cargo.toml:16`), so Identity never imports the store. The identity crate owns the pure part (build the event payload, sign it, verify and fold a list of payloads into a view, read and answer from the view); the host `apps/fgos`, which may link the store directly (Event Store spec §17, "Rust consumers link the crate and pay no route"), owns the adapter that appends and reads. The crate defines the port (`shared::EntryLog`: `append(event) -> Result`, `read() -> Result<Vec<RawEvent>>`); the host implements it. Node gains only the consumer manifest row and a rebuild module that calls the same fold through the addon, so `fgos rebuild` keeps one door for every consumer.
3. **Two event types, stream `project:identity`, scope `project`, `sealOnWrite: true`** in `packages/identity/contracts/identity-event-streams.v1.json`:
   - `identity.session-published`: `{v:1, entry:{id, handle, cli, projectId, roles, registeredAt}, machine:{id, handle}, publishedAt, sig}`. Published on `--register` (only when the entry is new or its roles changed), on `--role ... [--take]`, on `--drop-role`. The clone path and the liveness record stay local (a path of another machine means nothing here; liveness is never shipped).
   - `identity.session-ended`: `{v:1, id, machine:{id, handle}, endedAt, sig}`. Published when this machine removes a dead entry it had published (prune at the cap, on a role take, and `list --prune`).
   Publishing on change only, never on a timer: every event stays in the chain forever (scout §6).
4. **Signature inside the payload.** The envelope has no signature field and `src` is only the writer id. `sig` is `fgos_identity::sign` over the canonical JSON of the payload without `sig`, prefixed with the domain text `fgos-identity-directory/1\n` (the mailbox prefixes its own `fgos-mailbox-message/1\n`). The reader verifies with `verify`, which pins the first key seen per machine id. An entry whose signature fails, whose `machine.id` differs from the signer's machine id, or whose key changed (`machine-key-changed`) is dropped from the view and counted for doctor. The answer carries the pin state (`seen` or `confirmed`); a consumer that needs `confirmed` checks that one field (as the mailbox does).
5. **Fold: last event per full id wins**, in the store's deterministic order (Event Store spec §12; `ts` is never the order). `session-ended` removes the id. A role held by entries of two machines resolves to the one whose publishing event is later in the order (the last `--take` wins across machines, as it does locally); a live local holder of the role always wins over a remote one, because local liveness is proven and remote is not.
6. **Resolve and list answer local first, then remote.** A query matches local live entries as today; if none matches, it matches the shared view of the current clone's project. Remote answers set `liveness: "remote"`, `machine: {id, handle}` and `fetchedAt` (the time of the last fetch of that machine's mirror ref, read from the store's sync status). A full id `<other-machine-id>/<local id>` now resolves through the view instead of the fixed "arrives with the shared directory" `not-found`. `list` gains `--machine <handle|id>` and shows remote entries after local ones with their age. Contracts `identity.read.v1.json` gain the optional fields already announced in spec §5 (additive; callers ignore unknown fields).
7. **Where the view lives.** `.fgos/cache/identity-directory.json` of the main checkout (registered in `src/state/fgos-file-registry.mjs`), written by the rebuild module and refreshed by the host after it reads newer events; untracked and rebuildable like every consumer cache. If the cache is missing or behind the store's revision, `resolve` folds from the store in process (one read of one stream; measured in step 1).
8. **Handles across machines.** Session handles already end in `@<machine-handle>`. If two machines share a machine handle (two hosts named alike), the view shows the full machine id instead of the handle for the later one and doctor names both, until one sets `fgos identity machine --alias` (outline decision kept).
9. **Doctor row `identity-shared-directory`** (registered in `src/setup/checks.mjs` and `setup-doctor-registry.md`): passes with counts (machines, entries, oldest fetch); warns on dropped entries (bad signature, key changed) naming the machine id, on entries whose `projectId` differs from this clone's project id (two projects on one remote, spec decision 3), and on a duplicate machine handle. No fix: it reports, a person decides.

## Steps

1. **Facts, measured before code** (report `plans/reports/` via `fgos convention path --kind report`): (a) whether a Node `openStore` with a registry lacking `identity.*` types fails on reading or sealing a stream that holds them (decides whether the manifest row must land in the same release as the first publisher; expected yes); (b) cost of `read` of `project:identity` with 1000 entries on fg-server (budget: resolve under 50 ms); (c) the field in sync status that gives the last fetch time per mirror ref (`fetchedAt`); (d) that the host can open the store from `apps/fgos` without the Node gate (porting appends under `withConsumerState`; identity events need no Work gate, confirm the store's own `event-append` lock suffices).
2. **Crate, pure part** (`packages/identity/rust/src/shared.rs`, feature `directory`): payload builders, `sign_payload`, `verify_payload`, `fold(&[RawEvent]) -> SharedView` with dropped-entry counts, `SharedView::{resolve, list}` returning the same `Listed`/`Candidate` types with the new optional fields, the `EntryLog` port. `Liveness` gains `Remote`. Tests in `tests/shared.rs`: sign then verify round trip; tampered payload dropped; machine id mismatch dropped; changed key dropped and counted; last-wins per id; ended removes; role across two machines goes to the later event; local live holder beats remote; unknown fields ignored.
3. **Contracts:** `identity-event-streams.v1.json` (two types); `identity.read.v1.json` and `identity.write.v1.json` optional `machine`, `fetchedAt`, `liveness: remote`, `pin`; consumer manifest row `{id: "identity", contractFile, cachePath: ".fgos/cache/identity-directory.json", rebuildModule: "src/identity/directory-store.mjs"}`. The manifest belongs to the Event Store (lane WORK/ES): IDENT adds only its own row, announces it on the board before landing and asks WORK to review it; consumer ids are fixed names in code, not ids Identity mints.
4. **Host adapter** (`apps/fgos`, add `fgos-event-store` dependency): implement `EntryLog` over `append`/`read` for the trusted main checkout of the cwd; call publish from the register, role, drop-role and prune paths after the local write succeeds. A failed publish never fails the local registration: it prints one warning line and the reason (`identity-publish-failed: <store reason>`), because the local directory is this machine's truth and the board use case must not break on a store fault. Resolve and list read through the port when the local query misses.
5. **Node rebuild module** `src/identity/directory-store.mjs` exporting `rebuildFromStore`, folding through the addon's export of `shared::fold` (one fold, no Node copy of the rule; design principle 7). Addon export added in `packages/git/node-addon`.
6. **Doctor row** (decision 9) and registry doc row; `fgos identity list` help and CLI projector entries for `--machine`.
7. **Docs:** identity spec §5 (shared directory implemented, the event types, the fold rule, signature, per-project scope and its reason), §7 ladder row I4, §10 decision history line; Event Store spec consumers list mentions `identity`; `CHANGELOG.md` `[Unreleased]`.
8. **Gates:** `cargo test -p fgos-identity`, `cargo test --workspace` and `npm test` sequentially with the RAM cap; regenerate the census (`node scripts/git-one-door-scan.mjs --write-census`) as the last commit.
9. **Land on all three machines** (landing procedure of the I5 landing report), then the two-machine proof below, then a board line to MAIL (the remote candidates and `pin` field it can read), WORK (the new consumer in the manifest) and every lane (`resolve lead:<LANE>` now works across machines).

## Files

- Create: `packages/identity/rust/src/shared.rs`, `packages/identity/rust/tests/shared.rs`, `packages/identity/contracts/identity-event-streams.v1.json`, `src/identity/directory-store.mjs`, `apps/fgos/src/identity_shared.rs` (adapter; name follows the host's module naming at the time).
- Modify: `packages/identity/rust/src/{lib.rs,directory.rs,refusal.rs,provider.rs}`, `packages/identity/contracts/identity.{read,write}.v1.json`, `packages/event-store/contracts/consumers.v1.json`, `src/state/fgos-file-registry.mjs`, `packages/git/node-addon/src/*` (fold export), `apps/fgos/Cargo.toml`, `apps/fgos/src/cli_projector.rs`, `src/setup/checks.mjs`, `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`, `docs/platform/identity/spec.md`, `docs/platform/event-store/spec.md`, `CHANGELOG.md`, `packages/git/contracts/mutation-census.v1.json`, tests that count consumers (`test/event-store/consumers.test.mjs`, `verbs.test.mjs`) and doctor rows.
- Not touched while HARDEN T2 is active: `mint.rs`, `sequence.rs`.

## Verification

- Unit: the crate cases of step 2; one wiring proof in `apps/fgos/tests/cli_tests.rs` that `--register` appends one `identity.session-published` to a temp store and `resolve` answers a remote entry folded from a second temp store's events (design principle 8: the cases live in the crate, the host gets one wiring proof).
- Two machines (the rung's proof, spec §7): on fg-server2 `fgos identity session --role lead:WORK` (the WORK lead), `fgos events sync`; on fg-server `fgos events sync`, then `fgos identity resolve lead:WORK --json` returns fg-server2's full id, `liveness: "remote"`, `machine.handle: "fg-server2"`, a `fetchedAt`, `pin: "seen"`; the same by handle and by full id. Then `--drop-role` on fg-server2, sync both, and the resolve on fg-server is `not-found`. Command pairs and outputs go in the phase report.
- Forgery: an event appended on a test clone with a payload signed by a different key for the same machine id is dropped, and doctor names the machine.

## Risk and rollback

- **Old releases reading a stream with unknown types** (step 1a): if an older release refuses the store, the publisher must not run before every machine activates the release carrying the manifest row. Mitigation: the publisher checks the manifest of the active release (it ships together), and the landing note tells each machine to land before registering roles; the three machines land the same evening.
- **Chain growth:** publishing on change only; a re-register with unchanged roles publishes nothing.
- **Signing cost:** `ssh-keygen -Y sign` spawns once per publish (about 10-30 ms); registration stays well under the 50 ms hook budget only because the hook path never publishes: the mailbox hook calls `register_current`/`register_writer` in process, and those do not publish. Only the CLI verbs publish. Measured in step 1.
- **Rollback:** revert the release; the events stay in the chain as unknown types to an older release only if step 1a shows that is harmless, else the rollback also drops the manifest row and leaves the events unread (they are inert data in `project:identity`). No local directory change, so local resolve is unaffected.

## Open questions for the owner

None. Decision 1 (per project) follows from the store's design; the rest stays inside the G0 frame (shared directory through Event Store refs, spec §5) and RUL104.
