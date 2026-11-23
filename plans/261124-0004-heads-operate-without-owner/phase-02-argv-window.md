# Phase 2: The fgos argv window and its permission table

Capability: `code:implement`.

Builds PC-D6 (discussion §4) and the window part of PC-D3: one argv forwarder plus one data table, replacing the
hand-written forward-only branches in the same change (L10, RUL104).

## Inputs

- The discussion, §4 PC-D3 and PC-D6, §5 23:20 (the three holes to close), §6 "Lồng và ô cửa".
- `src/session-host/head-grants.mjs`: `GRANTS`, `HEAD_VERBS`, `QUESTION_VERBS`, `LAND_VERBS`, `COORDINATION_VERBS`,
  `PORTFOLIO_READ_VERBS`, `LEAD_VERBS`, `grantOf`. Its comment on Miu says she "never closes an event, types into a
  pane, reads a session or tunes the watcher": rewrite it to PC-D1 here.
- `src/session-host/head-request.mjs` `runHeadRequest` (about line 728): 28 `case` branches. The ones that only
  check argument shapes and call `hostCall` are forward-only (`supervisor handled`, `supervisor raise`, `watcher tune`,
  `session read`, `session type`, `metrics prune`, `friction record`, `config patch`, `supervisor queue|plans|wake`,
  `slots`, `questions list`). Policy branches keep their code: `land`, `run`, `request result`, `session start`,
  `session stop`, `session write`, the `questions ask|ack|cancel|answer` route, `session rotate|answered|restore role`,
  `worktree create`, `supervisor done` (it stops the caller), `metrics record` (the `fgos.coordination.*` kind rule).
- `src/session-host/head-request-client.mjs`: the per-verb client constants.
- `packages/run-supervisor/contracts/head-request.v1.json`: `verbs`, `refusalCodes`, `envelope`.
- `packages/run-supervisor/rust/src/head_request.rs`: `SUCCESSOR_READ_VERBS` (line 79), the check of
  `envelope.session.verbs`.
- `test/live/head-grant-probe.live.mjs`: reads the contract's `verbs`; it must read the new table instead.

## Footprint

`src/session-host/head-grants.mjs`, `src/session-host/head-request.mjs`, `src/session-host/head-request-client.mjs`,
`packages/session-host/contracts/head-permissions.v1.json` (new), `packages/run-supervisor/contracts/head-request.v1.json`,
`packages/run-supervisor/rust/src/head_request.rs`, `packages/run-supervisor/rust/tests/head_request.rs`,
`src/cli/command-registry.mjs`, `packages/host-runtime/contracts/command-manifest.json`,
`packages/host-runtime/contracts/command-routes.json`, `packages/host-runtime/contracts/command-route-annotations.json`,
`apps/fgos/src/routing.rs`, `test/session-host/head-grants.test.mjs`, `test/session-host/head-request.test.mjs`,
`test/live/head-grant-probe.live.mjs`, `docs/platform/run-supervisor/spec.md`.

## Decisions taken in this phase (planner's, within PC-D6)

- **Where the table lives:** `packages/session-host/contracts/head-permissions.v1.json`, shipped in the release and
  read only by `grantOf`. It is not a config key, so `config patch` can never widen it; it changes only through a
  landed code change.
- **Table shape:** rows `{ persona, prefix, decision: allow|ask|deny, read?: true }`; personas inherit
  `head < supervisor < secretary` (lead, planner and shaper are `head` plus their own rows). The most specific prefix
  wins; on a tie the strictest decision wins (`deny` > `ask` > `allow`). An argv no row matches is `ask`.
  `read: true` marks the verbs a rotation successor may use before it holds the role (replaces
  `SUCCESSOR_READ_VERBS`).
- **Who decides:** `grantOf` resolves the persona's rows into the envelope at launch (digest-protected, as
  `session.verbs` is today); the Rust run supervisor matches the request argv against them, so a sandbox cannot change
  the answer. `fgos can-i <argv...>` is answered by the run supervisor itself from the same rows, with no route child,
  like `session bind session`.
- **`ask`:** the route files one five-part question with `fgos questions ask` (form of
  `core/skills/_shared/decision-question.md`) whose body carries the exact argv, and replies `asked` with the `q-` id.
- **Arguments the forwarder refuses for every persona (`deny`, code `argv-not-allowed`):** any flag that changes the
  project root, cwd or environment (`-C`, `--cwd`, `--root`, `--project`, `--env`, and an argv element that is not a
  plain string); `fgctl` and `fgos release activate` style activation (phase 6 replaces this deny with its policy
  branch); `config patch` whose edits touch a key under the grant, confinement or `release` prefixes (the patch file
  is read on the host side before the call; the exact key prefix list is a constant beside the table and named in the
  contract).

## Steps

1. Write `head-permissions.v1.json` with the rows that reproduce today's grants exactly (one row per verb a persona
   holds), then add for the supervisor and, through inheritance, the secretary: `config patch` (allow, with the key
   deny above), `worktree remove --delivered-to` (allow; refused by the verb itself when not landed),
   `git recover` (allow), `dispatch probe-account` (allow), `session write plans/backlog.md` (already in source).
   Raw shell is not a row: an argv must start with an `fgos` verb.
2. Change `grantOf` to read the table; keep its signature (`{ writes, verbs, mailbox, peers }`) and add `rules`.
   Delete the verb arrays that the table now holds.
3. Replace the forward-only `case` branches of `runHeadRequest` with one forwarder: validate argv elements (strings,
   no leading-dash values where the verb takes a value, bounded lengths as today), run the host verb with
   `execFile`-style argv (no shell) through the existing `hostCall`, with `--json` appended. Keep the policy branches.
4. In `head_request.rs`, match the request argv against `envelope.session.rules`; delete `SUCCESSOR_READ_VERBS` and
   read the `read` flag. Serve `can-i` from the rules.
5. Update `head-request.v1.json`: the forwarder frame (`verb: "fgos"`, `args.argv`), the decision and refusal codes
   (`argv-not-allowed`, `asked`), the `can-i` reply; remove the per-verb entries of the deleted branches. Register
   `can-i` in `src/cli/command-registry.mjs`, the host-runtime contracts and `apps/fgos/src/routing.rs`. Update
   `head-request-client.mjs` so every head-side verb sends the forwarder frame.
6. Point `test/live/head-grant-probe.live.mjs` at the table: expected outcomes come from the persona's rules, and it
   adds one `can-i` call per row class.
7. Tests (extend the owning files, no copies): `head-grants.test.mjs` owns the table resolution (inheritance, most
   specific prefix, strictest tie, default `ask`); `head-request.test.mjs` owns the forwarder (allow runs with no
   shell, ask files a question carrying the argv, one test per deny rule: grant/confinement/release key in
   `config patch`, a cwd/root/env flag, activation); `packages/run-supervisor/rust/tests/head_request.rs` owns the
   Rust match and the successor `read` flag. Retire the per-branch argument tests whose branch is deleted, naming in
   the commit the forwarder test that now owns each behaviour.
8. Update `docs/platform/run-supervisor/spec.md` for the new frame and decisions.

## Verify

```bash
node --test test/session-host/head-request.test.mjs test/session-host/head-grants.test.mjs
cargo test -p fgos-run-supervisor
node --test test/cli/subcommand-flag-drift.test.mjs
```

Pass: all green; `rg -n "SUCCESSOR_READ_VERBS" packages src` finds nothing; `rg -c "case HEAD_" src/session-host/head-request.mjs`
counts only the policy branches listed above.

## Rollback

`git revert` the phase's commits; the old branches and constant come back together, since they were removed in the
same commits.
