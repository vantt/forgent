# Scan: `fgos session`, `fgos worktree`, `fgos head` (2026-11-18)

Base: `origin/main` 554082bab. Backlog row that already names this work: `p-g2iprtzptz` (docs/backlog.md:5).

## 1. `fgos session start|end|list|gc` — per-session detached worktree

| Sub | Does | State written |
|---|---|---|
| `start [--item <id>]` | detached-HEAD linked worktree under `<tmp>/fgos-sessions/<id>`, `.fgos` symlink to the main store, appends a row | `.fgos/sessions.json` row `{sessionId, worktreePath, itemId, startCommit, pid, record, startedAt}`; git worktree registration |
| `end <id> [--force]` | removes worktree + row; refuses a diverged (dangling-commit) session unless `--force`; seals the Event Store once | registry, worktree, event-store seal |
| `list` | read-only registry print | none |
| `gc` | reclaims rows whose worktree is gone or whose start pid exited; spares diverged/dirty | registry, worktrees |

Owning code: Rust host `apps/fgos/src/wiring/session.rs` (2187 lines, 27 unit tests; routes `apps/fgos/src/routing.rs:90`;
operations `session.*` in `packages/host-runtime/rust/src/catalog.rs:305-345`); registry entry
`src/cli/command-registry.mjs:2214`; manifest/routes/annotations in `packages/host-runtime/contracts/`.
Node client `src/runner/session.mjs` (`listSessions` only).

Readers of the registry / the session concept:
- `bin/fgos.mjs:3179` — `return` exempts a registered session worktree from its linked-worktree refusal, and the refusal
  text tells the user to run `fgos session start --item` (the only live pointer to the verb).
- `src/verbs/merge/approve.mjs:232` — registry loop refusing approve inside a session; redundant: the structural
  `isMainWorktree` check right below refuses every linked worktree anyway.
- `src/state/postland-drift.mjs:57` (+ `src/runner/merge.mjs:1033`) — maps `itemId` → live sessions to warn after a land.
- `packages/git/rust/src/store_admission.rs:161` — `is_session_worktree` admits a checkout whose `.fgos` is a symlink to
  main's store (symlink test, not the registry).
- `packages/identity/rust/src/resolve.rs:126` — `registry_confirms`: env id listed in `sessions.json` ⇒ `source: registry`
  instead of `env` (contract `packages/identity/contracts/identity.writer.v1.json` `x-registryFile`/`x-sessionRegistry`,
  golden beside it). `session start` never exports `FGOS_SESSION_ID`, so in practice nothing hits this branch.
- Gateway REST: `POST /v1/sessions`, `DELETE /v1/sessions/{id}`, `GET /v1/sessions/{id}/slots` (ignores the id, runs
  `fgos slots`) — `apps/fgos-gateway/src/gateway.rs:1087-1137,1282-1284`, contract
  `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml`.

Specs/docs: runner subcomponent `docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md:38`, operations
`docs/platform/runner/operations/h-51f5cd7279fd.md:281,664-778`, `docs/platform/runner/contracts/conserved-dispatch-doctrine.md:31-33`,
git spec G-191 (`docs/platform/git/spec.md:850,1308`), identity spec lines 115/177/186, `docs/reading-map.md:178`,
CHANGELOG 34/36/887/1167.
Tests (12 files): `apps/fgos/tests/cli_tests.rs`, `test/runner/session.test.mjs`, `test/cli/helpers/fgos-cli-harness.mjs`
(`startSession`/`endSession`), `test/cli/fgos-{return,claim,claim-2,disconnected-worktree-guard}.test.mjs`,
`test/verbs/merge/approve-leaf-and-worktree.test.mjs`, `test/rust-host/help-routes.test.mjs`, `test/util/host-bin.test.mjs`,
`test/runner/{dispatch-worker-session,provider-account-probe}.test.mjs`; gateway test `gateway.rs:2786-2875`.
Skills/hooks/scripts calling it: **none**. Live registry in the main checkout: `[]`.

## 2. `fgos worktree create|remove` — the general worktree door

- `create <path> [--branch <name> | --detach] [--base <ref>]` then dependency provisioning (`worktreeSetup.commands`).
- `remove <path> --delivered-to <ref> [--discard-ignored]`: refuses dirty, in-use, worker state, ignored bytes, tip not
  in `--delivered-to`; no force.
- Code: `bin/fgos.mjs:3436` → `src/verbs/worktree/{context,create,remove}.mjs` → Git Worktree port (Rust,
  `packages/git`); spec `docs/platform/git/spec.md` §3/§5 (Worktree port, worktree-admin rank 40).
- Callers: `core/skills/fgos-run`, `core/skills/fgos-cook/references/case-and-doors.md`, `core/skills/_shared/cook-worker-contract.md`,
  `domains/coding/skills/fgos-coding-shaping`, `domains/coding/instructions/worktree-safety.md`,
  `docs/how-to/recover-main-checkout-after-ignored-files-wipe.md`, AGENTS.md. Every lead/planner/shaper checkout uses it.
- No `list` / `gc`; no item binding; no registry (git's own worktree list is the record).
- A third worktree maker exists: `fgos pick` → `src/runner/worktree.mjs` `createWorktree` (`fgw/<id>`, `.fgos` stripped).

## 3. Overlap

| Job | `session` | `worktree` |
|---|---|---|
| make a checkout | `start` (detached, tmp dir, symlinked `.fgos`) | `create --detach` (any path, provisioned) |
| remove it | `end [--force]` (divergence guard) | `remove --delivered-to` (stronger proof, no force) |
| list / reclaim stale | `list`, `gc` (own registry) | none (git list) |
| bind to a work item | `--item` → post-land drift warning, `return` exemption | none |

Same job, two doors: create and remove. Only `session` has the item binding, list and gc, and the only live consumer
of those is the `return` exemption + drift warning.

## 4. Other meanings of "session" (not worktrees)

- Identity: `fgos identity session [--register|--role lead:X|--take|--drop-role]` — the agent session's writer id, handle
  and role (`docs/platform/identity/spec.md` §5/§7a); directory `<stateRoot>/identity/sessions/`.
- Session Host component `docs/platform/session-host/spec.md` (§8 head sessions and rotation), `src/session-host/**`,
  `src/session-rotation/**`.
- Run supervisor head-request socket `packages/run-supervisor/contracts/head-request.v1.json` (ops `head start`,
  `head rotate`, …) — already on main.
- Claim role `'session'` in `take`/`discover`/`edit` (`--role human|session`), dispatch worker sessions (herdr panes,
  `src/runner/dispatch/worker-session-boot.mjs`), mailbox "head" (`packages/mailbox/rust/store/src/head.rs`).

## 5. `fgos head` today

Not on main. Secretary plan `plans/261117-1856-secretary-session-spine` phase 15 (wave 8, status ready) adds
`fgos head start <persona> --name <n>` and `fgos head rotate <persona> --name <n> [--now]` as a Node verb
(registry, manifest, routes, `bin/fgos.mjs`, `test/cli/head-verb.test.mjs`, session-host spec verb section). Phases 16
(secretary/handoff skills), 17 (rotation hooks, registry), 18 (CHANGELOG, reading-map) use it. The phase marks the name
provisional and points at `p-g2iprtzptz` for the rename "with no alias". The use cases (`startHeadSession`,
`rotateHeadSession`, `requestRotation`) and the socket ops `head start|rotate` already landed (waves 5-7).

## 6. Prior art — why `session` holds worktree jobs

- 2026-07-17 `1d96b4412` / `d46f5e20c` / `20bbfa112`: plan fgos-multi-session-checkout (STR35) — several agent
  sessions each needed their own source checkout over one shared store; "session" meant "an agent session's checkout".
  `approve` refusal and the `return` exemption came with it.
- 2026-10-19 `8a8362712`: Git component adds the guarded Worktree port and the public `fgos worktree create`; lanes
  moved to it, `session` was not folded in.
- 2026-11-15 `4a27ace2f`, `67dd1eef9`: `session` moved whole into the Rust host (no one asked whether it was still used).
- 2026-11-17: secretary plan needs `fgos session` for agent sessions, finds it taken, names `fgos head` provisionally
  (secretary-miu DISCUSSION.md:50-54).

## 7. Reading for the plan

The session worktree lifecycle is a second door to a job `fgos worktree` does, with no live user. Retiring it (not
merging list/gc/item-binding into `fgos worktree`) is the RUL104/L10 shape: the item binding's two consumers can rely on
what exists (store admission already recognises a store-linked checkout structurally; post-land drift can key on the
`fgw/<id>` leaf branch it already reads), approve's registry loop is dead weight, identity's `registry` source is
unreachable. Then `fgos head` is renamed `fgos session` with the socket ops, specs, skills and tests.

## 8. Owner answers (2026-11-18)

- Direction: retire the session worktree lifecycle outright (list/gc/item binding are not moved into `fgos worktree`).
- Gateway: the three routes `POST /v1/sessions`, `DELETE /v1/sessions/{id}`, `GET /v1/sessions/{id}/slots` belong to
  the gateway, which will come back. Keep the routes; they stop shelling `fgos session` and answer a clear refusal
  until the gateway work rebuilds them on the new `session` verb.
- Correction to section 1: `gc` judges liveness by the pid of the `fgos session start` process itself
  (`session.rs:925` `self_record`), which exits as soon as start returns, so every clean session reads dead at once.
