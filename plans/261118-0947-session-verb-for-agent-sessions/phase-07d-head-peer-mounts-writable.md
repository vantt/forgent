# Phase 7d: Peers can message the secretary head

Owner decision 2026-11-19 ([question and answer](reports/miu-comms-question.md), option C then A). Evidence: [gap
report](reports/miu-comms-gaps.md): Claude Code writes its own registration (`<configDir>/sessions/<pid>.json` + `.key`)
and socket (`/run/user/<uid>/cc-socks/<pid>.sock`) into exactly the two dirs phase 7b mounts read-only, so the head is
invisible to peers' `ListAgents` and cannot be messaged. Depends on phase 4 (shares `src/runner/dispatch/**` and `test/**`).

## Inputs (read first)
- `src/runner/dispatch/confinement/resources.mjs` (peer-sessions resource, read access forced ~872, mounts ~867-885),
  `drivers/bwrap.mjs` (`assessBwrap` grant check, `BOUND_BACK`, writable-grant checks such as
  `confinement-root-in-writable-grant`), `src/session-host/head-grants.mjs` (`peers`).
- Owning tests: `test/runner/dispatch-confinement-machine-private.test.mjs` (real preflight case),
  `test/run-supervisor/bwrap-driver.test.mjs`, `test/runner/dispatch-confinement-policies.test.mjs`.
- `docs/platform/agent-confinement/spec.md` §9.1 grant `peer-sessions`; backlog `p-oqs75qwyco`.

## Steps
1. The `peer-sessions` grant binds both dirs read-write (`--bind`), still only for session heads whose grant has `peers`;
   workers and other heads unchanged. The real preflight still passes (no machine-private or writable-grant refusal).
2. Spec §9.1: the head can now delete or rewrite other sessions' registrations, keys and sockets (redirect or knock a
   session offline), on top of the read and signal exposure already named; owner decision and date.
3. Backlog `p-oqs75qwyco`: the tighter design must now also cover registration/socket publishing; text updated.
4. Tests: extend the owning preflight and argv proofs (rw binds for a peers head, none for a worker); live check with a
   real `claude` in the code-built shape: its own registration and socket appear in the host dirs and a peer's
   `ListAgents` shows it (write the evidence to `reports/phase-07d.md`).
5. CHANGELOG `[Unreleased]`: amend the secretary-head peers line (peers can now message the head).

## Verify
- Focused Node confinement tests + architecture test; census scan.
- Live after release + Miu rotate (owner go): a peer's `ListAgents` shows Miu and a SendMessage to her arrives.

## Rollback
`git revert`; mounts return to read-only (mailbox stays the inbound path).
