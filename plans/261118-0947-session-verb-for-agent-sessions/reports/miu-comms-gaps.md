# Miu comms gaps: mailbox sender `unregistered_*` and ListAgents invisibility

Read-only investigation, 2026-11-18, fg-server2, release 1acca915, Miu gen 6
(`.fgos/assignments/head-secretary-miu-6/runs/01`, claude pid 2690182, Claude Code 2.1.327).

## TL;DR

Both gaps come from one cause. Phase 7b binds the host's `~/.claude/sessions` **read-only over Miu's own
`$CLAUDE_CONFIG_DIR/sessions`**, and host `/run/user/1000/cc-socks` read-only at its own path. Claude Code uses
that same directory for its OWN registration (`<pid>.json`, `<pid>.<sha256(sock)>.key`) and the same cc-socks
dir for its OWN socket. Both writes fail silently (EROFS). So Miu has no session file and no socket anywhere:

- (1) mailbox hook `claude_head::find_head` cannot find `<pid>.json` -> `NoHead::NoSessionFile` -> no mailbox
  binding -> Identity bind (`head bind session`) is never asked -> sends are labelled `unregistered_28afeba0`.
- (2) peers have no `2690182.json` / `2690182.sock` to discover -> she is absent from ListAgents.

Phase 7 code (caller(), head_cli_session, ensure_registered) is correct; it never gets to run.

## Evidence

| Fact | Source |
|---|---|
| Sandbox: `--ro-bind /run/user/1000/cc-socks /run/user/1000/cc-socks`, `--ro-bind /home/vantt/.claude/sessions /tmp/fgos-confinement/disp_1795020307801_9c0e2b21/home/sessions`; no `--unshare-pid` | runs/01/launcher.sh |
| Miu env: `CLAUDE_CONFIG_DIR=/tmp/fgos-confinement/disp_…/home`, `XDG_RUNTIME_DIR=/run/user/1000`, `FGOS_SESSION_ID=att-cmd_1795020307661_4007b702`, `FGOS_HEAD_REQUEST_SOCKET` set | /proc/2690182/environ |
| Her CLI session id = `28afeba0-e532-4ff7-ac52-94d312044845` | /proc/2690182/root/tmp/claude-1000/-home-vantt-projects-forgent/28afeba0-… |
| No `2690182.json`/`.key` in host `~/.claude/sessions` (only 1020432, 2282988, 3723723) | ls |
| No listening socket `2690182.sock`; same net ns as host (`net:[4026531833]`), host cc-socks has no entry for her | /proc/2690182/net/unix, ls cc-socks |
| Mailbox message `61b984d930c5d739`: `from: 28afeba0-…`, `from_generation: null`, to f381c6d2 | .fgos/runtime/mailbox/record/snapshot.json messages[10] |
| No binding for `28afeba0-…` in `bindings` (16 bindings, all host sessions) | same snapshot |
| `fgos identity resolve head:secretary-miu` -> `att-cmd_…` (cli `worker`, handle `worker-435v`); no Identity entry mentions `28afeba0` | identity resolve, grep ~/.local/state/fgos |
| Supervisor log has ONE head-request, `hook-2692378-…`, which is the session-rotation Stop hook (apps/fgos/src/wiring/session_rotation_hook.rs:237), not the mailbox bind (`mbx-<pid>`, mailbox_identity.rs:172) | runs/01/supervisor.log |
| No `hook-outcome.json`: `Quiet::NoHead` is not recorded as a reason | packages/mailbox/rust/store/src/hook/outcome_log.rs:90 |

## (1) Mailbox sender attribution — cause chain

1. `caller()` apps/fgos/src/wiring/mailbox_verbs.rs:638 -> `head_cli_session` (packages/mailbox/rust/store/src/hook/resolve.rs:50) correctly returns `28afeba0-…` (head attempt + `CLAUDE_CODE_SESSION_ID`). Sender key is right.
2. Label: `MailboxState::sender_label` packages/mailbox/rust/core/src/delivery.rs:442 finds no binding for that key -> `unregistered_` + 8 chars.
3. Binding is only made by the hook: `resolver_for` Claude arm (resolve.rs:117-124) -> `claude_head::find_head` packages/mailbox/rust/store/src/adapters/claude_head.rs:40 reads `$CLAUDE_CONFIG_DIR/sessions/<pid>.json` -> NotFound -> `NoHead::NoSessionFile` (claude_head.rs:71).
4. With `outcome.bound == None`, apps/fgos/src/wiring/mailbox_hook.rs:155 returns before `ensure_identity`/`ensure_registered` (mailbox_hook.rs:158-169), so `head bind session` (mailbox_identity.rs:146-173) never runs.
5. The file is missing because the dir it lives in is the host registry, bound read-only by `peerSessionPaths` src/runner/dispatch/confinement/resources.mjs:126 (target = private home `sessions`), mounted at resources.mjs:867-885, and the grant is forced `access: 'read'` (resources.mjs:872).

**Smallest fix for (1) alone:** stop mounting the host registry over the head's own `sessions` dir (keep her
private, writable `sessions`). The hook then finds `<pid>.json`, binds, and asks `head bind session`. Cost: a few
lines in resources.mjs `peerSessionPaths` + its owning test. Side effect: she loses read of peers' registry (7b's
reading half), so this only is acceptable if (2) is solved by option A or B below; otherwise the real fix for (1) is
the same as for (2). Independent hardening: record `Quiet::NoHead(_)` for a confined head in outcome_log.rs:90 so
this failure is visible (today it is silent).

## (2) ListAgents invisibility — confirmed

How Claude Code 2.1.327 discovers peers (from the shipped binary):
- Socket path = `$XDG_RUNTIME_DIR/cc-socks/<pid>.sock` (fallback `/tmp/cc-socks-<uid>` when > 103 bytes) — fn `kal`.
- Registry = `<configDir>/sessions` — fn `Tde() { return join(Ye(), "sessions") }`; `<pid>.json` carries `messagingSocketPath`.
- Auth: `<pid>.<sha256(canonical socket path)>.key` holding `peerToken` in the same registry (`ars`, `cYa`, `uYa`).
- Peer socket accepted if in the reader's own socket dir, or (feature `reply_across_default_dirs`) if it matches
  `/run/user/<uid>/cc-socks/<pid>.sock` or `/tmp/cc-socks[-uid]/…` (`lvi`, `yz`, `IJ`).

Miu's attempt to write all three fails on the RO binds, so nothing exists to discover. Her socket could not live in
her private `/tmp` either: bwrap `--tmpfs /tmp` is invisible to the host.

### Options

**(A) Read-write binds of `/run/user/1000/cc-socks` and `~/.claude/sessions`.** Claude Code then registers and
listens natively; fixes (1) and (2) with zero new code paths. Cost: S (flip grant to `write` in resources.mjs:872
validation + head grant, update the owning test; ~0.5 day incl. live check).
What she could then do to other sessions (same uid, so only the bind is the barrier): delete/overwrite any peer's
`<pid>.json` (rewrite its `messagingSocketPath` to hijack/redirect inbound messages, rename it, mark it dead),
delete `.key` files (breaks peers' auth) or plant her own, unlink peer sockets (DoS until restart), and Claude
Code's own orphan reaper (`uds_key_orphans_reaped`) would run from her side too (correct now that she shares the
host pid ns). Note: RO already lets her read every peer's `peerToken`, i.e. she can already send to any peer; RW
adds tamper/DoS, not new read.

**(B) Host-side publisher in the Rust run supervisor.** Keep her `sessions` private+writable (fixes (1)); bind a
host-visible writable per-head dir for her socket; the supervisor mirrors her `<pid>.json` + `.key` into host
`~/.claude/sessions` and exposes her socket under `/run/user/1000/cc-socks/<pid>.sock`.
Feasibility risks: (i) socket must exist at a host path — needs a writable bind for it, and a path peers accept
(`IJ` default dirs or same dir), so either a symlink in host cc-socks or `XDG_RUNTIME_DIR` pointed at a host dir
whose path still matches `/run/user/<uid>/cc-socks`; (ii) the key file name hashes the *canonical* socket path
(`DN`/`n8`), and if canonical = realpath a symlinked socket's hash will not match the mirrored key name -> must be
proven empirically; (iii) a registration written by another process is accepted by format (readers only parse
json + `pidDomain`/`procStart` liveness checks), but the supervisor must also follow her in-place updates
(`status`, `name`, `updatedAt`) and remove files on exit; (iv) reverse direction (her reading peers) still needs
peers mirrored into her private dir. Cost: M-L (2-4 days Rust watcher + lifecycle + tests), fragile across
Claude Code versions (undocumented file layout).

**(C) Env/setting separating registry/socket from CLAUDE_CONFIG_DIR.** Socket dir is movable via
`XDG_RUNTIME_DIR` (only `cc-socks` under it; also moves anything else that uses XDG_RUNTIME_DIR). Registry has no
separate knob: `Tde()` is always `<configDir>/sessions`; `CLAUDE_CODE_TMPDIR` only adds scan dirs. So C alone
cannot fix the registry half. Cost of using XDG part: XS, but only useful as part of B.

**Recommendation:** A, if the owner accepts that a confined secretary can tamper with/DoS peer session
registrations (she is a trusted owner-facing head and already reads peer tokens). B only if tamper-resistance
toward peers is a requirement; prove key-hash/symlink acceptance with a 30-min spike first.

## Unresolved questions

- Whether Claude Code canonicalizes the socket path with realpath (decides B's symlink approach). Not tested (read-only).
- Whether any earlier generation (pre-7b) ever bound in the mailbox; gen 4 log shows no `mbx-` request either, so
  phase 7 has not yet been proven live end to end.
