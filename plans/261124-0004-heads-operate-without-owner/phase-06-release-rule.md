# Phase 6: Domain-free release rule and the forgent recipe

Capability: `code:implement`.

Builds PC-D9 and PC-D10: the supervisor skill carries only the general rule; the recipe is project data; the window
gains one policy branch that runs it, written in Rust (the discussion's Rust decision, commit `2b3336dae`).

## Inputs

- The discussion, §4 PC-D9, PC-D10; §5 00:05 (land and release per domain; reversible or not); §7 T6.
- `packages/session-host/contracts/head-permissions.v1.json`, `packages/session-host/rust/src/forwarder.rs` and
  `packages/run-supervisor/rust/src/head_request.rs` as phases 2 and 3 left them (activation is a `deny` today).
- `packages/config/rust` (how the Rust side reads a config key).
- `core/config-standard/land.yaml` (`land.gates`) and forgent's `.fgos/config.yaml`.
- `apps/fgctl/src/help.rs`: `fgctl upgrade` (activate a newer release) and `fgctl repair` (roll back to the previous
  release, `previousArtifactDigest`).
- `test/live/head-grant-probe.live.mjs` (forgent's probe).

## Footprint

`packages/session-host/rust/src/release.rs` (new), `packages/session-host/rust/src/lib.rs`,
`packages/session-host/rust/tests/release.rs` (new), `packages/session-host/contracts/head-permissions.v1.json`,
`packages/run-supervisor/rust/src/head_request.rs`, `packages/run-supervisor/contracts/head-request.v1.json`, `core/config-standard/release.yaml` (new),
`core/config-schema/release.schema.yaml` (new), `.fgos/config.yaml`, `core/skills/fgos-supervisor/SKILL.md`,
`core/skills/fgos-secretary/SKILL.md`, regenerated `.agents/skills/**`, `plugins/fgOS/skills/**`, `.claude/skills/**`.

## Decisions taken in this phase (planner's, within PC-D9 and PC-D10)

- **Recipe keys (domain-free), `release.*`:** `reversible` (boolean, default `false`), `checks` (list of argv lists,
  default empty), `apply` (argv list, default none: no rollout step), `probe` (argv list, optional), `rollback` (argv
  list, required when `reversible` is true). An unset `apply` means the project declares no release, and the branch
  answers `no-recipe`. Every `release.*` key is already a `deny` for `config patch` from heads (phase 2), so only a
  landed change or the owner sets it.
- **One policy branch, `release run`:** long-running like `land`: it answers at once with an id and runs detached,
  and the caller reads the outcome back with `request result` (reuse that verb's ticket store; if the Rust side cannot
  reach it, write the outcome where `request result` reads tickets and say so in the commit). In
  order: refuse `nothing-new` when the trunk tip has nothing landed since the active release; refuse `land-in-progress`
  while the merge slot is held; run each `checks` argv (refuse `checks-failed` on the first non-zero); if
  `reversible` is false, file an owner question with the exact apply argv and stop (`asked`); else run `apply`, then
  `probe`; on a failed probe run `rollback` and answer `rolled-back`; finally write one report line to the owner
  (through the question store as information, not a choice). Argv runs with no shell, from the project root.
- **Probe placement:** forgent's probe is meant to run inside a confined head. The recipe's `probe` argv runs on the
  host to decide rollback; the confined proof per persona stays phase 7's job and the supervisor's after-release
  check.
- **Forgent's recipe (project data):** `checks` = the commands in `land.gates`; `apply` = `fgctl upgrade`; `probe` =
  `node test/live/head-grant-probe.live.mjs`; `rollback` = `fgctl repair`; `reversible: true`.

## Steps

1. Add `core/config-standard/release.yaml` and `core/config-schema/release.schema.yaml` with the keys above, each
   with its `@fgos:doc` line. No default anywhere else. If doctor must know the key, add nothing to doctor: a missing
   recipe is a normal state.
2. Write `packages/session-host/rust/src/release.rs` (the ordered steps above, every external call behind a port
   trait so the test drives a fixture `fgctl`) and wire it as a policy branch in `head_request.rs`. Replace the activation
   `deny` row with `release run`: `allow` for the supervisor (and the secretary through inheritance), not granted below.
   Add the verb and its refusal codes to `head-request.v1.json`.
3. Write forgent's recipe into `.fgos/config.yaml`.
4. Supervisor skill: when to call `release run` (after a lead lands a change, when no lead is landing), and that it
   never knows what the recipe runs. Secretary skill: when the supervisor does not come back after a release, run
   the recipe's `rollback` through the window (`release run` answers it as the rollback path), then wake the
   supervisor. Both domain-free.
5. Tests in `packages/session-host/rust/tests/release.rs`: refused when checks fail; refused while a land holds the merge
   slot; rollback runs when the probe fails; an irreversible recipe files a question and applies nothing; no recipe
   answers `no-recipe`.
6. `npm run build:skills`.

## Verify

```bash
cargo test -p fgos-session-host
cargo test -p fgos-run-supervisor
node --test test/config
npm run build:skills
```

Pass: green, and the build leaves no diff on a second run. One real `release run` happens after the owner's first
manual activation (phase 7).

## Rollback

`git revert` the phase's commits; the activation `deny` row comes back with them, and `.fgos/config.yaml` loses the
recipe.
