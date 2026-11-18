# Phase 7: The secretary head gets the grants its role needs

Backlog `p-zgbqe2bpig` (HIGH). Owner decision 2026-11-18 21:3x (via supervisor): **raise the grants**, not "read-only by
design". The secretary head gets mailbox send and its lock, its peers' sockets under `/run/user/<uid>`, write access to
exactly the files its skill edits, and an Identity that resolves it as a head. Everything else stays confined.
Evidence: [debugger report](reports/debugger-261118-2130-miu-early-hard-rotation.md) §Q4 (symptoms proven, causes
strongly suspected). Runs first (owner priority 21:4x) on the current names (`head-grants.mjs`, `fgos head`); phase 5 renames them later.

## Inputs (read first)
- `src/session-host/head-grants.mjs` (`GRANTS.secretary.writes`), `src/session-host/head-start.mjs` (launch, env,
  `FGOS_SESSION_ID`), the bwrap shape: `src/runner/dispatch/confinement/{resources.mjs,drivers/bwrap.mjs}`,
  `packages/run-supervisor/rust/src/gate/unix.rs`; a real launcher `.fgos/.../head-secretary-miu-*/runs/01/launcher.sh`.
- Skill `core/skills/fgos-secretary/SKILL.md` (and its references): the exact list of files the secretary writes.
- Mailbox lock path: `apps/fgos/src/wiring/mailbox_identity.rs:31-35`, `packages/mailbox/rust/store/src/record/mod.rs:281`.
- Identity: why a confined head registers as `cli=worker` (`packages/identity/**`, head-start's env).
- Specs: `docs/platform/agent-confinement/`, `docs/platform/session-host/spec.md`, `docs/platform/agent-mailbox/spec.md`.

## Steps
0. Reproduce each symptom in a confined head (or the confinement probe harness): backlog Edit (EROFS on the temp+rename),
   mailbox send (`lock-unavailable`, capture its `detail`), a peer socket connect, `fgos identity session` output.
   Record the proven cause of each in the phase report before changing anything.
1. Writes: take the secretary's write list from the skill. A single-file bind cannot take an atomic replace; grant the
   smallest shape that lets the skill's real write path succeed (e.g. a writable path the editor's temp file can share a
   filesystem with) and keep every other path read-only. If the only working shape is the whole `docs/` tree writable,
   stop with one five-part owner question.
2. Mailbox: the head reaches the mailbox store and its lock writable (only those dirs), or mailbox send goes through
   the head request socket; pick by step 0's evidence, new code in Rust.
3. Peers: expose the peer session sockets the head needs under `/run/user/<uid>` (only those, not the whole dir).
4. Identity: a confined head resolves as `head:<persona>-<name>` with its real cli, not the gate's worker attempt.
5. The grant stays one table (`grantOf`); the shaper and any other persona keep `NONE` writes. Tests: one owning proof
   per grant at the lowest layer (shape builder / Rust gate), one wiring proof that a launched secretary shape holds them
   and a non-granted path is still read-only.

## Verify
- Focused Node tests of session-host and confinement; `cargo test` of touched crates; clippy `-D warnings`.
- Live (after landing, on fg-server2 with the owner's go via Miu): Miu edits `docs/backlog.md`, sends one mail, reaches
  one peer, and `fgos identity session` shows her head role.

## Rollback
`git revert` the phase commit set; the next head start uses the old shape.
