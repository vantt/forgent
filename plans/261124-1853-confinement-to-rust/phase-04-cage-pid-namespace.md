# Phase 4: Cage, a peers head keeps its own pid namespace (Rust)

Capability: `code:implement`.

Builds the tightening half of PC-D7 for `p-oqs75qwyco`: a peers-granted head (secretary, supervisor) runs with
`--unshare-pid` and can neither signal a host process nor rewrite another session's registration.

## Inputs

- `plans/backlog/p-oqs75qwyco-a-peers-granted-head-keeps-its-pid-namespace.md` (the measured problem and the tighter
  design).
- `packages/execution/engine/src/confinement/driver/bwrap.rs` around line 854 (`host_pid_space` drops `--unshare-pid`).
- `packages/execution/engine/src/confinement/policy/resolver.rs` step 5b (peer sessions bound read-write).
- `packages/execution/engine/src/confinement/request/attestation.rs` (checks the pid flag).
- `docs/platform/agent-confinement/spec.md` §9.1, grant `peer-sessions`.

## Footprint

`packages/execution/engine/src/confinement/` (whole directory),
`packages/execution/engine/tests/confinement_driver.rs`, `packages/execution/engine/tests/confinement_policy.rs`,
`packages/execution/engine/tests/confinement_request.rs`, `docs/platform/agent-confinement/spec.md`,
`plans/261124-1853-confinement-to-rust/reports/cage-pid-namespace.md`.

## Decisions taken in this phase (planner's)

- **Spike before change.** The 2026-11-18 measurement said a peer's pid reads 0 inside a pid namespace; the spike
  re-measures it on today's Claude Code before any code moves.
- **Branch 3 is a valid end.** If peers do not work in a pid namespace, the needed verb (peer liveness answered by the
  run supervisor) is a new item (RUL104), not built here.

## Steps

1. Spike in a throwaway confined head: with `--unshare-pid` and the peer-sessions directories read-only, do ListAgents
   and SendMessage still work both ways? Record the result in the report.
2. If they work: drop the `host_pid_space` exception, bind the peer-sessions directories read-only and the head's own
   registration files (`<pid>.json`, `.key`, socket) writable one by one, keep `attestation.rs` consistent, and
   rewrite §9.1 of the spec (the accepted escape hatches are gone).
3. If they do not: change no code, write the finding and the needed verb in the report; `p-oqs75qwyco` stays open with
   the report linked. Stop here.
4. When step 2 applies, proofs in `tests/confinement_driver.rs` and `tests/confinement_policy.rs`: a peers launch
   carries `--unshare-pid`; another session's `<pid>.json`, key and socket are read-only; the head's own are writable.

## Verify

```bash
cargo test -p fgos-execution-engine --test confinement_driver --test confinement_policy --test confinement_request
```

Pass: green, and the report states which branch (2 or 3) applied with its evidence. The live proof that Miu still
reaches peers is a row of phase 5's after table.

## Rollback

`git revert` the phase's commits; the host pid space and the read-write binding return.
