# Phase 2: The fgos argv window and its permission table, in Rust

Capability: `code:implement`.

Builds PC-D6 (discussion §4) and the window part of PC-D3: one argv forwarder plus one data table, replacing the
hand-written forward-only branches in the same change (L10, RUL104). Per PC-D11 (owner, 2026-11-24
00:14), the table, the forwarder and `can-i` are Rust in `packages/session-host/rust`; this is the first slice of
plan 3 of the Node-to-Rust inventory, and nothing else of session-host is ported here.

## Inputs

- The discussion, §4 PC-D3 and PC-D6, §5 23:20 (the three holes to close), §6 "Lồng và ô cửa", and the paragraph
  "Chồng lấn với việc chuyển Node sang Rust".
- `src/session-host/head-grants.mjs`: `GRANTS`, the verb arrays, `grantOf` (`{ writes, verbs, mailbox, peers }`). Its
  comment on Miu says she "never closes an event, types into a pane, reads a session or tunes the watcher": the
  replacement text follows PC-D1.
- `src/session-host/head-start.mjs`: calls `grantOf` at launch and writes `session.verbs` and `session.writes` into the
  envelope.
- `src/session-host/head-request.mjs` `runHeadRequest` (about line 728): 28 `case` branches. Forward-only (they check
  argument shapes and call `hostCall`): `supervisor handled`, `supervisor raise`, `watcher tune`, `session read`,
  `session type`, `metrics prune`, `friction record`, `config patch`, `supervisor queue|plans|wake`, `slots`,
  `questions list`. Policy branches that stay in Node until inventory plan 3 ports them: `land`, `run`,
  `request result`, `session start`, `session stop`, the `questions ask|ack|cancel|answer` route,
  `session rotate|answered|restore role`, `worktree create`, `supervisor done` (it stops the caller), `metrics record`
  (the `fgos.coordination.*` kind rule). `session write` is already Rust.
- `packages/run-supervisor/rust/src/head_request.rs`: the transport, the check of `envelope.session.verbs`,
  `SUCCESSOR_READ_VERBS` (line 79), the hand-over to Node through `fgos internal head-request`.
- `packages/run-supervisor/contracts/head-request.v1.json`, `envelope.v3.json`.
- `packages/session-host/rust/src/` (the crate; `fgos-run-supervisor` already depends on it under `supervise`).
- `packages/git/node-addon/src/` (the one Node addon; `writeScope` is the pattern of a small door) and
  `src/native/door.mjs` (its version gate).
- `test/live/head-grant-probe.live.mjs`: reads the contract's `verbs`; it must read the table instead.

## Footprint

Rust: `packages/session-host/rust/src/lib.rs`, `packages/session-host/rust/src/permissions.rs` (new),
`packages/session-host/rust/src/forwarder.rs` (new), `packages/session-host/rust/tests/permissions.rs` (new),
`packages/session-host/rust/tests/forwarder.rs` (new), `packages/session-host/rust/Cargo.toml`, `Cargo.lock`,
`packages/run-supervisor/rust/src/head_request.rs`, `packages/run-supervisor/rust/tests/head_request.rs`,
`packages/git/node-addon/src/session_host.rs` (new), `packages/git/node-addon/src/lib.rs`,
`packages/git/node-addon/Cargo.toml`.
Data and contracts: `packages/session-host/contracts/head-permissions.v1.json` (new),
`packages/run-supervisor/contracts/head-request.v1.json`, `packages/run-supervisor/contracts/envelope.v3.json`.
Node: `src/native/door.mjs`, `src/session-host/head-grants.mjs`, `src/session-host/head-start.mjs`,
`src/session-host/head-request.mjs`, `src/session-host/head-request-client.mjs`, `test/session-host/head-grants.test.mjs`,
`test/session-host/head-request.test.mjs`, `test/session-host/head-start.test.mjs`, `test/live/head-grant-probe.live.mjs`.
CLI registration of `can-i`: `src/cli/command-registry.mjs`, `packages/host-runtime/contracts/command-manifest.json`,
`packages/host-runtime/contracts/command-routes.json`, `packages/host-runtime/contracts/command-route-annotations.json`,
`apps/fgos/src/routing.rs`. Docs: `docs/platform/run-supervisor/spec.md`.

## Decisions taken in this phase (planner's, within PC-D6 and PC-D11)

- **Where the table lives:** `packages/session-host/contracts/head-permissions.v1.json`, compiled into the crate
  (`include_str!`) and read only by `permissions.rs`. It is not a config key, so `config patch` can never widen it; it
  changes only through a landed code change.
- **Table shape:** per persona: `writes`, `mailbox`, `peers` (the cage size), and rules
  `{ prefix, decision: allow|ask|deny, read?: true, args?: {...} }`. Personas inherit `head < supervisor < secretary`
  (lead, planner and shaper are `head` plus their own rows; a lead's `writes` stays its plan dir, filled in by the
  caller as today). The most specific prefix wins; on a tie the strictest decision wins (`deny` > `ask` > `allow`). An
  argv no rule matches is `ask`. `read: true` marks the verbs a rotation successor may use before it holds the role.
  `args` limits a flag's value (used by phase 3 for `--kind` and `--to`).
- **Who decides:** the run supervisor resolves the caller's persona from `envelope.session.role` (digest-protected)
  and asks `permissions.rs`; the sandbox cannot change the answer. `envelope.session.verbs` is retired in the same
  change. `fgos can-i <argv...>` is answered by the run supervisor itself from the same function, with no route child,
  like `session bind session`.
- **`allow`:** `forwarder.rs` validates the argv and the run supervisor execs the host's own `fgos` (envelope hostBin)
  with that argv plus `--json`, from the project root, no shell, no Node hop. A verb whose rule says `policy: node`
  (the kept Node branches) still goes to `fgos internal head-request` as today.
- **`ask`:** the run supervisor files one five-part question (`fgos questions ask`, form of
  `core/skills/_shared/decision-question.md`) whose body carries the exact argv, and replies `asked` with the `q-` id.
- **Refused for every persona (`deny`, code `argv-not-allowed`):** any flag that changes the project root, cwd or
  environment (`-C`, `--cwd`, `--root`, `--project`, `--env`) and any argv element that is not a plain string; an argv
  that is not an `fgos` verb (raw shell is never a row); activation of a release (phase 6 replaces this with its
  policy branch); `config patch` whose edits touch a key under the grant, confinement or `release` prefixes (the
  forwarder reads the patch file before the call; the key prefix list is a constant in `permissions.rs`, named in the
  contract).
- **Node reads the cage size through a thin port:** `grantOf` keeps its signature and becomes a call to the addon's
  `sessionHost.grantOf` (new door, gated in `door.mjs`), until inventory plan 3 ports the launch.

## Steps

1. Write `head-permissions.v1.json` with rows that reproduce today's grants exactly (cage size and verbs per persona),
   then add for the supervisor and, through inheritance, the secretary: `config patch` (allow, with the key deny
   above), `worktree remove --delivered-to` (allow; the verb refuses itself when not landed), `git recover` (allow),
   `dispatch probe-account` (allow). `session write plans/backlog.md` is already a write grant in source.
2. Write `permissions.rs` (load, inherit, match, decide, cage size) and `forwarder.rs` (argv validation, the deny rules,
   the exec description), exported from `lib.rs`. Owning proofs in `tests/permissions.rs` (inheritance, most specific
   prefix, strictest tie, default `ask`, the successor `read` flag, the parity of today's grants) and
   `tests/forwarder.rs` (one test per deny rule: grant/confinement/release key in `config patch`, a cwd/root/env flag,
   a non-`fgos` argv, activation).
3. In `head_request.rs`: decide with `permissions.rs`; for `allow` exec through the forwarder; for `ask` file the
   question; for `deny` refuse; serve `can-i`. Delete `SUCCESSOR_READ_VERBS` and the `session.verbs` check. Wiring proof
   in `packages/run-supervisor/rust/tests/head_request.rs`: one allowed forward, one ask, one deny, one `can-i`.
4. Delete the forward-only `case` branches of `runHeadRequest` and their argument tests in
   `test/session-host/head-request.test.mjs`, naming in the commit the Rust test that now owns each behaviour. Update
   `head-request-client.mjs` so every head-side verb sends the forwarder frame.
5. Add the addon door `sessionHost.grantOf` and gate it in `door.mjs`; make `grantOf` in `head-grants.mjs` call it and
   delete `GRANTS` and the verb arrays; drop `session.verbs` from the envelope in `head-start.mjs` and
   `envelope.v3.json`. `test/session-host/head-grants.test.mjs` keeps one wiring proof (the port answers a persona's
   cage size); `head-start.test.mjs` drops its `session.verbs` expectation.
6. Contracts: `head-request.v1.json` gets the forwarder frame (`verb: "fgos"`, `args.argv`), the decisions and refusal
   codes (`argv-not-allowed`, `asked`) and `can-i`, and loses the per-verb entries of deleted branches. Register
   `can-i` in the CLI registry, the host-runtime contracts and `apps/fgos/src/routing.rs`.
7. Point `test/live/head-grant-probe.live.mjs` at the table: expected outcomes come from the persona's rules, and it
   adds one `can-i` call per decision.
8. Update `docs/platform/run-supervisor/spec.md` for the new frame and decisions.

## Verify

```bash
cargo test -p fgos-session-host
cargo test -p fgos-run-supervisor
node --test test/session-host/head-request.test.mjs test/session-host/head-grants.test.mjs test/session-host/head-start.test.mjs
node --test test/cli/subcommand-flag-drift.test.mjs
```

Pass: all green; `rg -n "SUCCESSOR_READ_VERBS|const GRANTS" packages src` finds nothing; `rg -c "case HEAD_" src/session-host/head-request.mjs`
counts only the kept Node policy branches listed above.

## Rollback

`git revert` the phase's commits; the Node table, branches and constant come back together, since they were removed in
the same commits. Rebuild the addon.
