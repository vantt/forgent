# Phase 7 step 0: proven causes of the secretary head's blocked grants

Date 2026-11-18. Read-only investigation. Code base: `sv2-p07` at 90c8cd755. Live subject: `head-secretary-miu-4`, with bwrap pid 24870, gate 24871 and claude 24877 on fg-server2. Experiments ran under `/tmp/claude-1000/.../scratchpad/bw`. No code was changed.

## Summary

| # | Symptom | Cause | Status |
|---|---|---|---|
| 1 | Edit of `docs/backlog.md` fails with EROFS | Claude Code writes its temp file beside the target; `docs/` is read-only; a single-file bind leaves no writable sibling | PROVEN (live error, CC 2.1.327 code, bwrap repro) |
| 2 | mailbox send fails with `lock-unavailable` | `open(.fgos/locks/mailbox.lock, O_RDWR\|O_CREAT)` returns EROFS; `.fgos` is under `--ro-bind / /` | PROVEN (strace in bwrap) |
| 3 | SendMessage fails; ListAgents reports `liveness unknown` | Peers' `cc-socks` and `~/.claude/sessions` are masked. Miu's own socket is `/tmp/cc-socks/2.sock`, in the private /tmp. `--unshare-pid` hides peer pids | PROVEN (live `ss`, env); sufficiency of the fix is SUSPECTED |
| 4 | `cli=worker` | `FGOS_SESSION_ID=att-…` wins the resolve order; `cli_of` maps `att-` to `worker`. The role *is* held, but by a different Identity session than the one the mailbox hook binds | PROVEN (live resolve); mailbox split is SUSPECTED (strong, code) |

## How the launcher builds `writes` binds

The path from grant to bwrap argument, in order:

1. `src/session-host/head-grants.mjs:23`: `GRANTS.secretary.writes = ['plans','docs/backlog.md','docs/discussions']`.
2. `src/session-host/head-start.mjs:172,180`: `grantOf` result goes into the launch request.
3. `src/runner/dispatch/session-attempt.mjs:42-47` (`requirementOf`): the policy is `host-write-denied`, plus one `workspace-paths` read-write grant with those paths.
4. `src/runner/dispatch/confinement/resources.mjs:578-602`: each path becomes its own resource, bound on its own.
5. `src/runner/dispatch/confinement/workspace-paths.mjs` (`validateWorkspacePaths`) refuses any path under `.fgos`. A `.fgos` grant through this resource is therefore impossible by design.
6. `src/runner/dispatch/confinement/drivers/bwrap.mjs:579-676` builds the arguments, in this order:
   - `--ro-bind / /`, `--tmpfs /tmp`, `--unshare-pid --as-pid-1`
   - each writable resource as `--bind`
   - each hidden root as `--tmpfs`, including `/run/user/1000`, `~/.claude` and the login stores
   - the attempt files (`bindAttemptFiles`): `gate-exit.json`, the capture logs, and the GO and request sockets as `--ro-bind`
   - `--remount-ro` on every hidden root

`packages/run-supervisor/rust/src/gate/unix.rs` only executes the shape; it adds no binds. The live launcher `.fgos/assignments/head-secretary-miu-4/runs/01/launcher.sh` matches this exactly. Its argument lines 19-30 hold the four `--bind` (outbox, plans, docs/backlog.md as one file, docs/discussions). Lines 31-34 hold `--tmpfs /run/user/1000`. Lines 65-66 hold `--tmpfs ~/.claude`. Lines 83-88 bind back only the two fgos sockets.

## 1. Writes (PROVEN)

**Evidence**

- Miu's transcript has `EROFS: read-only file system, open '/home/vantt/projects/forgent/docs/backlog.md.tmp.2.bca8519ab138'`, three times. The `2` is the claude pid inside the pid namespace (`--as-pid-1`: gate is pid 1, claude is pid 2).
- Claude Code 2.1.327 atomic writer, from strings of `~/.local/share/claude/versions/2.1.327`:
  - The temp file is `${target}.tmp.${process.pid}.${hex6}` when no `stagingDir` is given, opened `O_WRONLY|O_CREAT|O_EXCL`.
  - On error it falls back to an **in-place** write only in two cases:
    - the temp was written and the rename failed with `EXDEV|EPERM|EEXIST|EBUSY` (`gL`);
    - the temp creation failed with `EACCES` on an existing file.
  - EROFS on temp creation has no fallback. That is why the single-file bind is useless for Edit, even though an in-place write to it works.

**Repro with bwrap 0.11.1**

| Run | Shape | Result |
|---|---|---|
| E1 | ro `/` + `--bind docs/backlog.md` (current shape) | in-place append OK; temp beside the target fails with `Read-only file system` |
| E2 | rename from a writable dir onto the single-file bind | `EXDEV` (busy mount point) |
| E5/E6 | **proposed**, see below | listed below |

E5/E6 ran the Claude algorithm (temp beside target, rename, fallback) with this result:

- temp written → rename fails `EBUSY` → **in-place fallback OK**, and the host `backlog.md` is updated;
- `other.md` write → EROFS; unlink or rename over it → EBUSY; `sub/x.md` write → EROFS;
- `docs/new.md` and `mkdir docs/newdir` succeed inside, and **nothing appears on the host**;
- `discussions/` new file OK.

**What the secretary skill writes** (`core/skills/fgos-secretary/SKILL.md`, `core/agents/secretary.yaml`)

| Write | Location | Covered by current grant? |
|---|---|---|
| Backlog row (step 2) | `docs/backlog.md` | bound, but broken (see above) |
| Discussions, `QUESTIONS.md` answers | `docs/discussions/**` | yes (dir bind) |
| Reports | `plans/reports/secretary-<date>-<slug>.md` (from `fgos convention path --kind report --type secretary`) | yes (`plans`) |
| Plan-gate answers | `plans/**` | yes |
| `fgos identity mint backlog` | writes nothing | not needed |
| `fgos head start` | goes through the request socket | not needed |
| Friction | `fgos friction record` writes `.fgos/observe/` | no, read-only; side channel "never stops the request" (`_shared/friction-capture.md`); out of scope unless the owner wants it |
| Mail | see item 2 | no |

**Smallest change.** Owner: `src/runner/dispatch/confinement/drivers/bwrap.mjs` (shape) and `resources.mjs` (resolution). It is a Node shape builder, so edit it, don't port it. `head-grants.mjs` is unchanged.

A `workspace-paths` entry that is a **file** is bound as follows. All other entries of the parent stay read-only, and the parent takes only throwaway new names.

- `--tmpfs <parent>`
- `--ro-bind` back every existing entry of `<parent>` except the granted ones; enumerate with `readdir`, dotfiles included (docs has 20 entries today)
- `--bind <file>` rw, and `--bind` any granted sibling dir

**Cost:**

- Files added to `docs/` on the host after launch are invisible to the head until its next generation.
- One mount per sibling.
- New files the head creates at the `docs/` top level are discarded silently. That is acceptable: the skill never creates any.

`--tmp-overlay` (E5) also works, but it needs unprivileged overlayfs; plain `--tmpfs` (E6) does not. Prefer E6. The whole `docs/` tree writable is **not** needed, so no owner question is required.

Proof: one owning test at the shape-builder layer (a file grant yields tmpfs parent + ro siblings + rw file), and one wiring test (a launched secretary edits `backlog.md` atomically; `docs/other` is still EROFS).

## 2. Mailbox (PROVEN)

**Evidence**

- Lock path: holder-lock registry row `mailbox`, `"v3Path": "<fgosDir>/locks/mailbox.lock"` (`packages/holder-lock/contracts/lock-registry.v1.json`), filled by `packages/mailbox/rust/store/src/record/paths.rs`.
- It is **the project `.fgos`, not the state root**, which corrects the earlier report's guess.
- `open_lock_file` (`packages/holder-lock/rust/src/port.rs:748-757`) opens `O_RDWR|O_CREAT`. A failure becomes `Unavailable{IoError,"open …: …"}` (port.rs:806-813) and then `LockUnavailable` (`record/mod.rs:278-283`).
- Repro, using the activated `fgos` inside `bwrap --ro-bind / / --unshare-pid` with `mailbox send --to lead:OPC`. strace shows:
  `openat(…, "/home/vantt/projects/forgent/.fgos/locks/mailbox.lock", O_RDWR|O_CREAT|O_CLOEXEC, 0666) = -1 EROFS`.
  The output is `"recorded": false … (lock-unavailable)`. The detail is **dropped by the presenter**, which is a separate diagnosability gap.

**Files a send writes**

- `.fgos/locks/mailbox.lock`: open + flock only. The mailbox never calls `declare_domain`, so there is no `*.predecessor.json` rename.
- Under `.fgos/runtime/mailbox/record/`: `snapshot.json` (temp + rename in the same dir) and `bodies/<id>.body`.
- `.fgos/runtime/mailbox/`: `sync.log`, `mail-taken`, `hook-outcome.json`, `hook-lock-busy.json`.

All of these are read-only in the head (no bind; `.fgos` is refused by `validateWorkspacePaths`).

**Also PROVEN.** The live `snapshot.json` `bindings` list 16 heads, all `forgent-claude-*`, and **none is Miu**. Miu's mailbox hook cannot take the same lock, so Miu also receives no mail.

**Smallest change.** Two options:

- **Option A (binds).** Add a new confinement resource, `mailbox-record`, beside `workspace-paths`. It is not a `workspace-paths` path, because that would breach the `.fgos` rule. It binds rw the file `.fgos/locks/mailbox.lock` and the dir `.fgos/runtime/mailbox`, and the grant table gains `mailbox: true`. It works for both send and hook drain. Cost: the head can rewrite every peer's mail record. Owners: `resources.mjs`, `drivers/bwrap.mjs` (Node, edited) and `head-grants.mjs`.
- **Option B (request socket).** Add verbs `mailbox send` and a mailbox hook drain to the head request socket. `packages/run-supervisor/rust/src/head_request.rs` runs them host-side under the attempt's writer id. The in-sandbox `fgos mailbox` (Rust, `apps/fgos`) forwards when `FGOS_HEAD_REQUEST_SOCKET` is set. Record trust stays host-side, but this is new Rust and a socket round trip on every hook.

**Recommendation: B**, for record trust (one writer per record stays outside the sandbox). A is acceptable as the faster ship if the owner accepts that the secretary can rewrite the record. Step 2 of the phase allows either; this is the five-part question if the lead does not decide.

## 3. Peer sockets (PROVEN symptoms, sufficiency SUSPECTED)

**Evidence (live)**

- Peers listen on `/run/user/1000/cc-socks/<hostpid>.sock`: `ss -xlp` shows 1020432, 2282988, 2477564 and 3723723.
- Each peer has a registry entry `~/.claude/sessions/<pid>.json` with `messagingSocketPath`, `pidDomain: …pid:[4026531836]`, and a `<pid>.<hash>.key` beside it.
- The head masks `/run/user/1000` (tmpfs, read-only) and `~/.claude` (tmpfs). It runs `CLAUDE_CONFIG_DIR=/tmp/fgos-confinement/<disp>/home` with **no `XDG_RUNTIME_DIR`** in env.
- Miu's own socket is therefore `/tmp/cc-socks/2.sock` inside the private /tmp (`ss`: `/tmp/cc-socks/2.sock users:(("claude",pid=24877))`). Another sandboxed claude (825610) also has `2.sock`. Peers cannot reach Miu, and Miu cannot see peers.

**Pid namespace (repro).** A client inside `bwrap --unshare-pid` connects to a host listener:

- `SO_PEERCRED` seen from inside gives server pid **0**, and host `/proc/<pid>` is invisible.
- The host side sees the client's real pid.

Claude Code's peer liveness and `verifiedPeerPid` checks therefore cannot work outbound from inside a pid namespace. That explains `liveness unknown`.

**Smallest change (owner: `resources.mjs` `MACHINE_PRIVATE_ROOTS` handling + `drivers/bwrap.mjs`).** A grant `peers: true` would:

- ro-bind `~/.claude/sessions` back. It holds `.key` files; those are read-only exposure of peer auth material, so this needs a threat-model note.
- bind `/run/user/1000/cc-socks` rw back under the masked runtime dir;
- set `XDG_RUNTIME_DIR=/run/user/1000` in the head env.

**Not sufficient while `--unshare-pid` stays.** Miu's socket name would be its namespace pid (collision risk), and peer liveness reads host pids. Dropping `--unshare-pid` for heads breaks the invariant "namespace empty ⇒ tree gone" (`bwrap.mjs:584-586`), which the supervisor relies on. **Recommendation:** peers talk to the head through the mailbox, once item 2 is fixed. Ask the owner (five-part) before weakening the pid namespace. A live test with a real claude is still owed.

## 4. Identity `cli=worker` (PROVEN)

**Evidence**

- The gate exports `FGOS_SESSION_ID=att-cmd_1795011049728_72d691c6` (envelope `launch.env`; `packages/identity/rust/src/launcher.rs:43-58`). It scrubs `CLAUDE_CODE_SESSION_ID`, but Claude re-exports its own id to tool children.
- The resolve order puts `FGOS_SESSION_ID` first (launcher.rs:7), and `cli_of` gives `worker` for an `att-` id (`packages/identity/rust/src/session.rs:48-56`).
- Live, in bwrap with that id, `fgos identity session` gives `{"id":"fg-server2-jdp2bv/att-cmd_…","handle":"worker-of54@fg-server2"}`.
- `fgos identity resolve head:secretary-miu` gives the same entry with `roles:["head:secretary-miu"]` and `liveness: alive`. The supervisor registers it from outside: `packages/run-supervisor/rust/src/supervise/terminal.rs:927-952`, key `ENV_ORDER[0]`. So **the role is held**; only the cli label and the session identity are wrong.

**SUSPECTED (strong, code).** The mailbox binds a head by the hook payload key (the Claude session UUID, cli `claude`) and maps it to Identity with `identity_key` (`apps/fgos/src/wiring/mailbox_identity.rs:89-99`). A role alias resolves to the holder's full id `…/att-…`, and is then matched against mailbox heads by full id (mailbox_identity.rs:195). Once item 2 works, Miu's mailbox head would be `…/<uuid>`, but the role sits on `…/att-…`, so `--to head:secretary-miu` would find no head.

**Smallest change (Rust, `packages/identity`).** Identity moves a `head:*` role from an attempt entry to the agent's own session. This happens when that session registers with a head process that descends from the attempt entry's head (the gate pid and start time already recorded), in `directory.rs` `register_writer`/`register_session` (~482-537). The trigger is the mailbox hook's first registration or `head answered`. The display cli then comes from the real session (`claude`).

The alternative is for the supervisor to pass the executor's cli into `register_writer` (`terminal.rs:927`). That fixes the label only; the mailbox split remains.

## Unresolved

- The real-claude live test of shape E6 (expected to pass given the CC 2.1.327 fallback code) and of peer SendMessage (expected to fail under the pid namespace).
- Mailbox A vs B: a record-trust decision.
- Whether exposing `~/.claude/sessions/*.key` to a head is acceptable.
- The mailbox send presenter hides `detail`. Suggest printing it (small fix, separate item).

## Implementation (2026-11-18)

- Writes: a granted file gets a parent shell (tmpfs, other entries ro-bound back, symlinks recreated, granted entries bound rw after it); generic for any file in a `workspace-paths` grant (`resources.mjs` `fileGrantParents`, `drivers/bwrap.mjs`).
- Mailbox: option A. Grant field `mailbox: true` (secretary only) adds the `mailbox-record` resource: rw `.fgos/locks/mailbox.lock` and `.fgos/runtime/mailbox`, nothing else of `.fgos`.
- Receiving: the mailbox hook skipped a confined head as `RunnerHead` (writer `att-`). A head session attempt (env has `FGOS_HEAD_REQUEST_SOCKET`) is now its CLI session to the mailbox (`hook::resolve::head_cli_session`; also `mailbox_verbs.rs` `caller`).
- Identity: Identity's directory is read-only in the sandbox, so the report's in-sandbox trigger cannot write. New supervisor-answered verb `head bind session`: the head's mailbox hook sends its CLI key; Identity `bind_agent_session` checks the caller pid runs under the gate, registers the CLI session on the gate and moves the attempt's roles to it. `attempt_session` / `register_attempt_roles` let the socket's role checks and rotation take follow the bound session; `current_session` returns the bound CLI session for an attempt whose bound session shares its head.
- Not done here (separate phase): peer sockets, `~/.claude/sessions`, `--unshare-pid`.
