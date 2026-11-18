# Phase 7e: One Identity record per session, found by any of its identifiers

Owner design 2026-11-19 00:4x (via supervisor), backlog `p-rk75ictfw7` (high). A live session today carries unconnected
names: herdr tab label and pane id, Claude Code session name and messaging socket (new on each restart), fgOS identity
handle, lane/head role (`lead:X`, `head:secretary-miu`), mailbox address, pid, head generation. Seen 2026-11-18: sends to
stale sockets (ENOENT), Miu as `cli=worker` then `unregistered`, mailbox sender shown by address not role, guessed
addresses. Depends on phase 5 (shares `src/session-host/**`, the command registry) and phase 7d.

## Prior art (step 0 confirms before any design)
- **One store already exists:** the Identity directory (`packages/identity/rust/src/directory.rs` `Entry`: id, handle,
  cli, project, clone, roles, liveness with the agent head's pid; `directory::resolve` answers a handle, session id or
  role). This phase extends that record and that lookup; it adds no second store.
- **Phase 4 retired the other one:** `.fgos/sessions.json` (the per-session worktree registry) is gone with every reader
  and Identity no longer takes `fgos_dir`; nothing here brings a project-local registry back.
- Phase 7 added head binding (`bind_agent_session`, `attempt_session`, `register_attempt_roles`, `attempt_gate`); the
  mailbox hook binds a head and keeps its own binding snapshot; `fgos identity resolve <handle|role>` exists.
- Step 0 also `git log -S` on directory/Entry fields and the mailbox binding snapshot for anything retired before.

## Steps
1. Record: `Entry` gains the session's other identifiers (herdr tab label + pane id, CLI session id/name and messaging
   socket, mailbox address, head persona/name + generation), versioned format, written only through Identity's existing
   write door. Rust only.
2. Updates: the record is written on register/start, rotation (new generation moves the role and identifiers), rebind
   after `/clear`, and refreshed on the hook path when a value changed (tab rename, new socket); stale values are
   replaced, never accumulated.
3. Lookup: `fgos identity resolve <any identifier>` (pane id, tab label, CLI session id/name, socket path, handle, role,
   mailbox address, pid) returns the whole record; ambiguous or stale answers say so. One resolver in Rust; the old
   handle/role resolve is this resolver (no second path).
4. Readers: the mailbox (sender label, `--to` resolution, binding) and the head-request path read the record instead of
   deriving names; the mailbox's own binding snapshot keeps only what the mailbox owns (delivery state), not identifiers.
5. Specs: identity spec (record shape, update points, lookup), mailbox and session-host specs (they read Identity).
6. Tests: record write/update/replace and lookup-by-each-identifier at the Identity layer; one wiring proof each for
   the mailbox sender label and head rotation updating the record.

## Verify
- `cargo test -p` identity, mailbox, run-supervisor, fgos; clippy `-D warnings`; msvc and aarch64-apple-darwin checks;
  focused Node tests; command selectors check; census scan.
- Live after release (owner go): `fgos identity resolve <Miu's herdr pane>` and `... <her mailbox address>` both return
  her record with role `head:secretary-miu`; her mail shows the role.

## Rollback
`git revert`; the record format is versioned so older readers ignore the new fields.
