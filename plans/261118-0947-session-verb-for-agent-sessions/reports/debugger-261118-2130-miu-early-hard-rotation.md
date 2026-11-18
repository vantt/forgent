# Debugger report: Miu "early hard" rotations (gen 3 at 21:02, gen 4 at 21:10)

Date 2026-11-18, fg-server2, times UTC (+7 = machine). Read-only investigation.

## Executive summary

- **No threshold fired.** Both rotations were *manual* `fgos head rotate secretary --name miu` calls: gen 2->3 by lead:OPC (an acceptance test of plan 261118-1847), gen 3->4 by Miu herself. The rotation executor writes every non-soft reason, including `manual`, as `rotation: hard`. PROVEN.
- **The handoffs are empty** because a manual rotation carries no `stopFacts`, and no `personas.secretary.reload` portfolio is configured. PROVEN.
- **"Diverged checkout"** has nothing to do with rotation. Every generation's envelope `cwd` is the main checkout, and the briefs differ only in the handoff line. The divergence is the main checkout's own state. PROVEN.
- **Q4 (mailbox/SendMessage fail):** Miu's bwrap sandbox makes the project and state dirs read-only and hides `/run/user/1000` and `/tmp` behind tmpfs. The lock acquire (mailbox) and peer sockets (SendMessage) are therefore unreachable. The `lock-unavailable` result is PROVEN. The read-only state root as its cause is SUSPECTED (strong).

## Timeline

| gen | run dir | start (UTC) | context at last turn (transcript) | rotate request | handoff |
|---|---|---|---|---|---|
| 1 | head-secretary-miu-1 | 06:50 | - | none, outcome `gate-lost` 06:51 (supervisor.log: `session-dir-undeclared`) | - |
| 2 | head-secretary-miu-2 | 14:01:49 | 14:02:44: 2+2805+101125 = **103,932 tok** (sonnet-5-5) | **14:02:49.334 lead:OPC ran `fgos head rotate secretary --name miu --json`** (transcript `~/.claude/projects/-home-vantt-projects-forgent/4f660b01-...jsonl`) | 261118-1402-cmd17950.md, id 05d97bcf8b2d0b95 |
| 3 | head-secretary-miu-3 | 14:02:50 | 14:10:53: 2+515+128055 = **128,572 tok** | **14:10:49.567 Miu ran `fgos head rotate secretary --name miu`** → `{"started":true,"pid":24336}` (own transcript, protected/session/.../e6540401-...jsonl). Supervisor.log: `head-request 5930d19f4e7262fd head rotate done` (random Node id from head-request-client.mjs:81, not a `hook-<pid>-<ms>` id) | 261118-1410-cmd17950.md, id db488cd5f3292df2 |
| 4 | head-secretary-miu-4 | 14:10:49 / answered 14:11:11 | - | - | - |

The cancel requesters match the rotation executors. Gen 2 was cancelled by pid 3905303, which is the lease pid of gen 3 (`miu-3/.../provider-capacity-selection.json`). Gen 3 was cancelled by pid 24336, the pid the rotate command returned. Both cancels carry `by: signal:session-rotation`.

Stop-hook measure, had it run: there is no `context-sidecar.jsonl` in the lineage dir, so the transcript fallback applies (measure.rs:186-188). The window is the config `windowSize` of 1,000,000 (core/config-standard/sessionRotation.yaml:12). That gives 0.104 for gen 2 and 0.129 for gen 3. Both are far below soft 0.4, so the hook correctly requested nothing.

Why Miu rotated herself: her final text says she rotated to get a session that can write `docs/backlog.md` (Edit failed with `EROFS ... docs/backlog.md.tmp.2.*`). Her mailbox send had also returned `lock-unavailable`. Earlier, lead:ACCOUNT-LEASE had told her at 14:07:51 to "rotate yourself (OPC proved gen 3)".

## Root causes

### Q1 "hard fired early": not a threshold (PROVEN)
- `bin/fgos.mjs:3462-3463`: the CLI `head rotate` always sends `reason: 'manual'`.
- `src/session-rotation/rotate.mjs:264`: `rotate: reason === 'soft' ? 'soft' : 'hard'` turns `manual` into `hard` in the handoff and in `latest.json`. That makes a manual rotation indistinguishable from a threshold one. The real reason survives only in the transient `rotation.json` (rotate.mjs:273).
- Eliminated:
  - Wrong window: the measure would give 0.10 to 0.13.
  - Cumulative tokens: measure.rs:111-143 takes the last assistant entry only.
  - Predecessor transcript reuse: each gen has its own session file.
  - Generation reuse: gens are 2, 3, 4 with distinct keys.
- Latent issue (SUSPECTED, not the cause): Miu runs sonnet-5-5 and starts at about 88k tokens. If that model's real window is 200k, the 1M default under-measures 5x: gen 3's 128.6k would be 0.64 and should have triggered **soft**. No sidecar writer exists to report the true window.

### Q2 empty handoffs (PROVEN)
- A manual path carries no stop facts. `rotateHead` (src/session-host/head-request.mjs:44-48) passes `stopFacts` only if given, and the CLI gives none. `writeHandoff` then gets `lastAssistantMessage: null`, `pendingQuestion: null` and `portfolio: []` (rotate.mjs:262-266).
- The portfolio would be empty even on a hook rotation. `core/config-standard/sessionRotation.yaml:16` has `personas: {}`, and the project config has no `sessionRotation`, so `reload_of("secretary")` is empty (decide.rs:140-144; session_rotation_hook.rs:144-150).
- Gen 3's pending-work summary (4 backlog ids, unsent mail, unlock chain) was written in its final message *after* the rotate call, so no handoff could carry it. The data was lost. Gen 4's `answered.json` confirms it resumed with no pending context.

### Q3 "diverged checkout" (PROVEN unrelated to rotation)
- `envelope.json` `cwd` is `/home/vantt/projects/forgent` for gens 2, 3 and 4.
- `brief-1.md` gen 2 vs gen 3 differs in one line only (the handoff path). The briefs are built from the same project root.
- The pane cwd `runs/01` is the launcher shell's directory. The bwrap gate runs the agent in the envelope cwd.
- The 194-behind/19-ahead state is the main checkout's own (local docs commits not pushed), and it predates the rotations, per the coordinator.
- Minor oddity: `miu-4/terminal-endpoint.json` has `socket: null`, while gens 1-3 have the herdr socket. Its effect is unverified.

### Q4 mailbox / SendMessage / writes fail from Miu (SUSPECTED strong; symptoms PROVEN)
- In `miu-3/runs/01/launcher.sh`, bwrap binds `/` read-only. The only writable binds are outbox, `plans/`, `docs/backlog.md` (single file), `docs/discussions`, the capture logs and gate-exit.
- It mounts `--tmpfs /run/user/1000` (read-only) with only two fgos sockets, and `--tmpfs /tmp`.
- Consequences:
  - **backlog writes fail**: Edit writes a temp file beside the target and renames it, and `docs/` is read-only. Single-file binds cannot support atomic replace. PROVEN by the EROFS lines.
  - **mailbox send fails**: `lock-unavailable` comes from holder-lock `Acquire::Unavailable` (packages/mailbox/rust/store/src/record/mod.rs:281). The lock lives under the state root (apps/fgos/src/wiring/mailbox_identity.rs:31-35), which is read-only in the sandbox. The cause is SUSPECTED; the exact `detail` was not captured.
  - **SendMessage fails**: peer session sockets under `/run/user/1000` or `/tmp` are hidden by the tmpfs mounts. SUSPECTED.
  - `ListAgents` shows every peer `liveness unknown`, consistent with this.
- Identity `worker-of54 cli=worker`: the head is registered as the gate's worker attempt (`FGOS_SESSION_ID=att-cmd_...`), not as a `claude` head. Not traced further. SUSPECTED identity/registration gap for confined heads.

## Smallest fix options (no code changed here)

1. **Record the true reason** (session-host rotation executor, `src/session-rotation/rotate.mjs:264` plus handoff-store): write `rotation: manual`. The handoff contract (`packages/session-host/contracts/rotation-files.v1.json`) must then allow `manual`, and the Rust `handoff.rs` reader must accept it.
2. **Manual rotation keeps context**: either refuse `fgos head rotate` from inside the head and tell it to put its summary in its turn first, or have the executor read the old transcript's last assistant message, which it can locate via `protected/session`.
3. **Configure the secretary portfolio**: set `sessionRotation.personas.secretary.reload` to `docs/backlog.md` plus the board and portfolio files. Config only; no code.
4. **Window size per model**: set `sessionRotation.windowSize` to the real window of Miu's model, or ship a sidecar writer. Verify the sonnet-5-5 window first.
5. **Sandbox grants for heads** (run-supervisor confinement / head grants):
   - Bind `docs/` (or a writable sibling) so atomic replace of backlog.md works.
   - Bind the mailbox state root/lock dir writable, or route mailbox send through the head request socket.
   - Expose the peer sockets needed for SendMessage, or document that heads talk only through mailbox.
6. **Process**: briefs should stop telling Miu to "rotate yourself" as a workaround for blocked writes. Rotating does not change the sandbox.

Owning components and specs:
- Session Host rotation: `docs/platform/session-host/spec.md` §8.8, `src/session-rotation/rotate.mjs`, `packages/session-host/rust/src/rotation/*`.
- Confinement and grants: run-supervisor / `src/session-host/head-grants.mjs`, `head-start.mjs`.
- Mailbox: `docs/platform/agent-mailbox/spec.md`.
- Config: `core/config-standard/sessionRotation.yaml`.

## Unresolved questions
- What is the real context window of claude-sonnet-5-5 as Miu runs it (200k or 1M)? It decides whether soft should have fired in gen 3.
- What is the exact `detail` of the mailbox `lock-unavailable` (lock path)? It is needed to confirm the read-only state root.
- Why does gen 4 have `terminal-endpoint.socket: null`, and does that affect pane messaging?
- Why does Identity register a confined head as `cli=worker`, and does the mailbox key resolve to the role holder?
