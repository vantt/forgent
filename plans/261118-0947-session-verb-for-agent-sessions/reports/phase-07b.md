# Phase 7b report: heads keep the host pid space and reach their peers

Date: 2026-11-18. Branch `svb/p07b` (on `svb/p07`). Machine fg-server2, claude 2.1.327.

## 1. What changed

- **Grant.** `grantOf` gains `peers` (secretary `true`, every other persona `false`). `requirementOf` turns it into a
  required `peer-sessions` grant (`access: 'read'`). `assessBwrap` accepts it only for a session launch.
- **Shape.** The resolver binds back read-only `{claudeSocketBase}/cc-socks` (at its own path, inside the masked runtime
  dir) and the host registry `~/.claude/sessions` at `sessions` under the head's config dir (the private home when the
  launch has one). It sets `XDG_RUNTIME_DIR` (or `CLAUDE_CODE_TMPDIR`) to the host socket base. A plan with
  `peer-sessions` resources gets no `--unshare-pid --as-pid-1`; every other launch keeps them.
- **Envelope.** `buildEnvelope` picks `linux-pgroup` with the bwrap prefix when the prefix has no `--unshare-pid`. Only a
  terminal envelope may carry it (`pid-namespace-required` otherwise). The `linux-pgroup` containment driver now refuses
  any prefix by name instead of dropping it and starting the gate unconfined.
- **Gate.** Reuses the existing non-pid-1 mode (subreaper, sweep until its own tree is empty). New: the agent starts
  with `PR_SET_PDEATHSIG(SIGKILL)` on the gate when the gate is not pid 1, with a parent check so it never starts unarmed.
- **Invariant for heads.** "The gate's subreaped tree is empty means the tree is gone." It is written in `bwrap.mjs`,
  `containment.port.v1.json`, `envelope.v3.json`, `internal-route.run-supervisor.v1.json`, the run-supervisor spec
  (driver table, session attempt paragraph, known limits, decision history) and the agent-confinement spec.

## 2. Live test (PROVEN)

### Setup

- **Peer.** I started my own interactive peer, `claude` in tmux session `p07b-peer`, cwd in the scratchpad (host pid
  1520237, `peer-5c`).
- **Shape.** Built by the code: `grantOf('head:secretary-p07b')`, then `requirementOf`, then
  `resolveConfinementResources` (real host roots; login store `~/.claude`), then `prepareBwrap`.
- **What the shape held:**
  - no `--unshare-pid` and no `--as-pid-1`;
  - `--ro-bind /run/user/1000/cc-socks /run/user/1000/cc-socks`;
  - `--ro-bind /home/vantt/.claude/sessions <privateHome>/sessions`;
  - `XDG_RUNTIME_DIR=/run/user/1000`.
- **How the head ran.** I seeded the private home with onboarding/trust and a credential copy (removed afterwards).
  Then I ran it under `env -i`, so no `CLAUDE_CODE_*` variable leaked from my own session.
- **What it ran.** `claude --dangerously-skip-permissions`, interactive, in tmux session `p07b-head`.

### Results

- **(a) It starts.** Claude reached its prompt normally even though `cc-socks` and `sessions` are read-only.
  Inside, `touch $CLAUDE_CONFIG_DIR/sessions/x` gives `Read-only file system`. `ls /run/user/1000/cc-socks | wc -l`
  gives 17. `echo $$` gives 1610776, a host pid. The host registry was unchanged afterwards (no entry of the head).
- **(b) ListAgents shows the peers alive** (not "liveness unknown"):

  ```
  Peer sessions (4):
    peer-5c [4b85f9]  ·  interactive  ·  idle  ·  tmux p07b-peer:@0.%0  ·  started 15m ago
    lead-session-verb-0d [407aac]  ·  interactive  ·  busy  ·  started 2h ago
    forgent-1d [599cb3]  ·  interactive  ·  idle  ·  started 11h ago
    forgent-67 [236a56]  ·  interactive  ·  idle  ·  started 8h ago
  ```

- **(c) SendMessage reaches the peer.** It went to my own peer only:
  `{"success":true, ... "msg_id":"e71fb888-a299-436e-9f6b-be0121f688e5"}`. The peer pane showed
  `Message from @…: ping from 7b test, ignore`. No other session was messaged.
- **Earlier hand-built shape.** The same results came first from a hand-written bwrap line (headless `-p` and
  interactive), before the code existed.
- **Cleanup.** Both tmux sessions are closed and the private home is removed. No `p07b` process is left.

**Limit, by design.** The head registers nothing and listens nowhere peers can see (read-only binds). SendMessage
therefore reports "no inbox bound here", and peers cannot SendMessage the head. Inbound mail stays on the mailbox.
The owner-go live check on fg-server2 after landing (Miu) is still owed per the phase file.

## 3. Proofs

| Behaviour | Owning proof |
|-----------|--------------|
| Non-pid-1 gate ends adopted orphans on agent exit and on cancel | `a_gate_that_is_not_pid_1_ends_the_orphans_it_adopted` (gate_pid1.rs, extended) |
| Agent dies when a non-pid-1 gate is SIGKILLed | `the_agent_of_a_gate_that_is_not_pid_1_dies_when_the_gate_is_killed` (fails without the change: agent outlived the gate) |
| `linux-pgroup` driver refuses a bwrap prefix | `a_bwrap_prefix_is_refused_never_dropped` (containment_pgroup.rs) |
| Head shape: no pid namespace, peer socket dialable, registry readable, both read-only; no-grant shape keeps the namespace | `a launched secretary shape keeps the host pid space…` (dispatch-confinement-backend-p03.test.mjs, real bwrap) |
| Grant `peer-sessions` is session-only | assess case in `assessBwrap: a workspace-paths grant is supported…` |
| Envelope `linux-pgroup` + prefix in a pane only | `a sandbox that keeps the host pid space is held as a process group…` (direct-cutover.test.mjs) |
| Grant table | `the grant table…` (head-start.test.mjs) |
