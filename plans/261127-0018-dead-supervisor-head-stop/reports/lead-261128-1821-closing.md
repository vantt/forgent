# Closing report: plan 261127-0018 (session stop ends a head whose supervisor is dead)

Plan `done`. Phase 1 landed on main at `df6d2d1b36` from branch `dead-supervisor-head-stop/p01b` (tip `a1334b2443`).

## Acceptance

1. `test/session-host/head-stop.test.mjs`: green in gate c-19684 and as the named `--test` of land c-23887.
2. `cargo test -p fgos-supervision --test definitions` (supervisor-gone gives a session-gone row): green in `cargo test --workspace`, gate c-19684.
3. `changelog.d/261127-0018-dead-supervisor-head-stop.md`: landed.
4. Live check: PASS on `a9af171b77`, run by the supervisor on fg-server2; see [live-stop.md](live-stop.md).
5. `npm test` and `cargo test --workspace`: both green in gate c-19684 on `a9af171b77`. The only later commit, `a1334b2443`, is rustfmt alone (identical tokens), and the land gates (`cargo fmt --all --check` and the architecture set) passed.

## What changed from the first design

- Owner answer q-o7ugiwqcia (A): the new run-supervisor op `end-dead-attempt` stops the attempt's own `fgos-run-<attemptId>` scope and then adopts. Node retires the pane only after `closed.json` exists.
- Owner answer q-ih2qtdetiz (A): a head's gate and agent run in the herdr pane's cgroup, not the scope. The op therefore also signals the binding's own gate record by pid and start identity: SIGTERM together with the scope stop, SIGKILL together with the scope kill. Nothing else is signalled.
- The managed-timer door got one allowed entry for `scope.rs` (its `systemctl` calls stop a scope; they do no timer work). The component-boundary view was re-rendered to match (Doors column: run-supervisor 7, launch-gate 6). Both paths were widened by the supervisor.

## Review dispositions (commit 1b97ab4396)

- Accepted and fixed in `26d6c82d6f`:
  - The contract and docs now name the gate signal.
  - A host that dies mid-op keeps `retiredAt`.
  - The signal order is proven with an ordered event log.
- Deferred, no backlog row: an attempt that has `receipt.json` but no `closed.json` counts as a live supervisor. This mirrors `head_state.rs` and fails safe, as `stop-not-ended` with the stamp kept.
- Rejected: leftover scope contents after the gate dies. The supervisor is already dead and adopt re-checks the domain.

## Cleanup for the supervisor

- `forgent-worktrees/261127-0018-dead-supervisor-head-stop-p01b` was kept by the land (`worktree-dirty-preserved`). Its only dirty file is `live-stop.md`, which is now on main with the same content. Its tip `a1334b2443` is delivered to main.
- `forgent-worktrees/probe-0018-stop` (branch `discussion/probe-0018-stop`) was the first live check's probe and is superseded.
- q-n3ewcrasqv (the widen for criterion 4) is moot, because those widens are on main. Its asker should cancel it.

No debt.
