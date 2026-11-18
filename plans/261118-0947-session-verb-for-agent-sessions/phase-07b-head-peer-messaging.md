# Phase 7b: Heads keep the host pid space and reach their peers

Owner decision 2026-11-18 21:5x (via supervisor; [question and answers](reports/phase-07-owner-question.md)): after
phase 7 lands without SendMessage (option C), do option A in this plan. Evidence: [phase 7 report](reports/phase-07.md) §3
(proven by bwrap repro: inside `--unshare-pid` a peer's pid reads 0, so Claude Code cannot verify peers; peers listen
on `/run/user/<uid>/cc-socks/<pid>.sock` and register in `~/.claude/sessions/<pid>.json` + `<pid>.<hash>.key`).
Depends on phase 7. OPC reviews every run-supervisor gate change.

## Inputs (read first)
- `src/runner/dispatch/confinement/drivers/bwrap.mjs` (`--unshare-pid --as-pid-1`, the "namespace empty => tree gone"
  invariant ~584-586), `resources.mjs`; `packages/run-supervisor/rust/src/gate/unix.rs` (gate, tree cleanup) and its tests.
- `src/session-host/head-start.mjs`, `head-grants.mjs` (head shape after phase 7).
- `docs/platform/agent-confinement/**`, `docs/platform/run-supervisor/**`.

## Steps
0. Find the owning proof of "empty pid namespace means the tree is dead" and every place that relies on it (gate wait,
   cancel, reap, orphan checks).
1. Run-supervisor gate (Rust): track and kill a head's process tree without a pid namespace, by pidfd or cgroup
   (pick by what the gate already uses and what works unprivileged on Linux; macOS/Windows keep compiling). The old
   invariant is replaced by the new one ("the gate's tracked tree is empty => the tree is gone") with an owning proof
   that a forked grandchild is reaped on cancel and on gate exit.
2. Heads only drop `--unshare-pid`; workers keep it. The head shape gains read-only binds of `/run/user/<uid>/cc-socks`
   and `~/.claude/sessions` (heads only), and the head's own messaging socket lands where peers can see it.
3. Confinement spec: heads see the host pid space and read peers' session `.key` files (read-only); say why (owner
   decision, SendMessage between sessions) and what stays confined.
4. Skill fgos-secretary: SendMessage to peers works again; mailbox stays for cross-machine/signed mail.
5. Tests: the gate proof (step 1) at the Rust layer; one wiring proof that a launched head shape has no pid namespace
   and the two read-only binds, and a worker shape keeps `--unshare-pid`.

## Verify
- `cargo test -p` the run-supervisor crate, clippy `-D warnings`, msvc and aarch64-apple-darwin compile checks;
  focused Node confinement and session-host tests.
- Live on fg-server2 after landing (owner go via Miu): Miu's `ListAgents` shows peers alive and one SendMessage arrives.

## Rollback
`git revert`; heads return to the phase 7 shape (mailbox only).
