# Phase 7d report: peers can message a peers-granted head

Date: 2026-11-19. Branch `svb/p07d` (from origin/main `62528b20b`). Machine fg-server2, claude 2.1.327.
Owner decision 2026-11-19: C then A ([question and answer](miu-comms-question.md), [gap report](miu-comms-gaps.md)).

## 1. What changed

- **Grant.** `requirementOf` (`src/runner/dispatch/session-attempt.mjs`) declares the `peer-sessions` grant with
  `access: 'read-write'` for a head whose grant has `peers` (still only the secretary). The resolver
  (`resources.mjs`) refuses any other access (`confinement-grant-invalid`) and resolves both peer mounts read-write.
  Path edit approved by the coordinator (honest contract instead of "grant says read, mount is rw").
- **Shape.** bwrap now emits `--bind /run/user/<uid>/cc-socks /run/user/<uid>/cc-socks` and
  `--bind ~/.claude/sessions <privateHome>/sessions`; workers and other heads get neither directory and keep
  `--unshare-pid --as-pid-1`; `assessBwrap` still accepts the grant for a session launch only.
- **Preflight.** `confinement-root-in-writable-grant` now checks every writable mount, bound back or not, so the rw peer
  mounts are covered too (before, bound-back mounts were skipped). The real preflight passes on the head shape.
- **Docs.** Confinement spec §9.1 grant `peer-sessions` (new tamper/DoS risk, owner decision and date, live check) and
  the §9.3 bind sentence; decision row 2026-11-19 in `decisions/confinement-authority-decisions.md`; backlog
  `p-oqs75qwyco` (tighter design must also publish the head's registration and socket); CHANGELOG `[Unreleased]`
  secretary peers line.

## 2. Accepted risk (owner, 2026-11-19)

The head can delete or rewrite other sessions' `<pid>.json`, `.key` and `<pid>.sock` in the shared dirs: rewrite
`messagingSocketPath` to redirect a session's inbound messages, or delete its key/socket to knock it offline until it
restarts. No new read exposure (7b already exposed the keys read-only). Secretary only.

## 3. Proofs

| Behaviour | Owning proof |
|-----------|--------------|
| Real preflight accepts the rw peer mounts inside machine-private roots; argv has `--bind` (not `--ro-bind`) for both, after the masks; non-session launch refused | `a head granted its peers starts with the session sockets and registry…` (`test/runner/dispatch-confinement-machine-private.test.mjs`) |
| Launched secretary shape (real bwrap, `requirementOf(grantOf(role))`): host pid space, dials a peer socket, writes its own registration into the host registry and listens in the host socket dir; argv binds both rw; worker shape keeps its pid namespace and binds no peer directory | `a launched secretary shape keeps the host pid space, reaches … and registers and listens beside its peers…` (`test/runner/dispatch-confinement-backend-p03.test.mjs`) |
| Grant `peer-sessions` (`read-write`) is session-only | assess case in `assessBwrap: a workspace-paths grant is supported…` (same p03 file) |

Focused runs, one at a time (`node scripts/run-tests.mjs <file>`), all fail 0 and 0 ERROR lines:
machine-private 27, policies 35, backend-p03 42, bwrap-driver 9, head-start 12, architecture 80,
`test/setup/git-mutation-census.test.mjs` 1. Census regenerated: `0 undeclared site(s)`.

## 4. Live check (PROVEN)

- **Shape built by the code**: `grantOf('head:secretary-p07d')` -> `requirementOf` -> `buildConfinementRequest`
  (session launch context) -> `assessBwrap` (no mismatches, `grant:peer-sessions` satisfied) -> `prepareBwrap`, real
  host roots, scratch project outside the repo. Prefix held no `--unshare-pid`/`--as-pid-1`, held
  `--bind /run/user/1000/cc-socks /run/user/1000/cc-socks` and
  `--bind /home/vantt/.claude/sessions <privateHome>/sessions`, env `XDG_RUNTIME_DIR=/run/user/1000`.
- **Run**: private home seeded with onboarding/trust and a credential copy; `env -i` (no `CLAUDE_CODE_*` leak),
  `CLAUDE_CONFIG_DIR=<privateHome>`, `claude --dangerously-skip-permissions` interactive in tmux `p07d-head`
  (host pid 715514, `FGOS_CONFINED=1`, parent `/usr/bin/bwrap`). Own peer: plain `claude` in tmux `p07d-peer`
  (pid 714365, `peerdir-63`).
- **(a) Registration and socket in the host dirs**: host `~/.claude/sessions` gained `715514.json` and
  `715514.23cfeaf0….key`; `/run/user/1000/cc-socks/715514.sock` appeared. `715514.json`: `name: proj-3c`,
  `messagingSocketPath: /run/user/1000/cc-socks/715514.sock`, `pidDomain …pid:[4026531836]` (host pid ns).
- **(b) Peer's ListAgents shows the head**:

  ```
  Peer sessions (4):
    lead-session-verb-0d [407aac]  ·  interactive  ·  busy  ·  started 4h ago
    forgent-1d [599cb3]  ·  interactive  ·  idle  ·  started 13h ago
    proj-3c [cfb582]  ·  interactive  ·  idle  ·  started 13s ago
    forgent-67 [236a56]  ·  interactive  ·  idle  ·  started 10h ago
  ```

- **(c) SendMessage peer -> head arrives** (one message, to the test head only): peer got `{"success":true, …,
  "msg_id":"c3abb653-d275-4d24-9cbe-b9a67174c9df"}`; head pane showed
  `Message from @peerdir-63: ping from 7d test, ignore`.
- **Cleanup**: both sessions `/exit`ed; Claude Code removed `714365`/`715514` json, key and sock itself; tmux
  sessions gone, no process left; scratch project, private home and credential copy deleted.

## 5. Still owed

Live after release + Miu rotate (owner go): a peer's `ListAgents` shows Miu and a SendMessage to her arrives.

## Unresolved

None.
