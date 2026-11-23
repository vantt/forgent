# Phase 5: Cage, a peers head keeps its own pid namespace

Capability: `code:implement`.

Builds the tightening half of PC-D7 for `p-oqs75qwyco`: a peers-granted head (secretary, supervisor) runs with
`--unshare-pid` and can neither signal a host process nor rewrite another session's registration.

## Inputs

- `plans/backlog/p-oqs75qwyco-*.md` (the measured problem and the tighter design it names).
- `src/runner/dispatch/confinement/drivers/bwrap.mjs` around line 603 (`hostPidSpace` drops `--unshare-pid`).
- `src/runner/dispatch/confinement/resources.mjs` around line 123 (the peer-sessions binding read-write).
- `docs/platform/agent-confinement/spec.md` §9.1, grant `peer-sessions`.
- `test/runner/dispatch-confinement-machine-private.test.mjs`.

Owner of the driver: `src/runner/dispatch/confinement/**` is live Node that the Node-to-Rust inventory
(`plans/discussions/ds-wham5txfkv-node-rust-port-inventory/DISCUSSION.md`, row 14) leaves to its later session-host
and setup plans, none of which has a plan directory yet, and `261122-2108` (draft) lists `src/runner/dispatch/**`.
So a fix here is made in place in these Node files; if `261122-2108` is active by the time this phase runs, the lead
stops and asks the supervisor to order the two.

## Footprint

`src/runner/dispatch/confinement/drivers/bwrap.mjs`, `src/runner/dispatch/confinement/resources.mjs`,
`test/runner/dispatch-confinement-machine-private.test.mjs`, `docs/platform/agent-confinement/spec.md`,
`plans/261124-0004-heads-operate-without-owner/reports/cage-pid-namespace.md`.

## Steps

1. Spike in a throwaway confined head: with `--unshare-pid` and the peer-sessions directory read-only, do Claude
   Code's ListAgents and SendMessage still work both ways? Record the result in the report.
2. If they work: drop the `hostPidSpace` exception, make the peer-sessions binding read-only except the head's own
   registration files (bind those writable one by one), update §9.1 of the spec.
3. If they do not: the backlog row's tighter design (peer liveness and SendMessage answered by the run supervisor)
   is a new verb and outside this plan (RUL104). Stop, leave the grant unchanged, write the finding and the needed
   verb in the report, and the supervisor keeps `p-oqs75qwyco` open with the report linked. This is a valid end of the
   phase.
4. When step 2 applies, extend `dispatch-confinement-machine-private.test.mjs`: a peers head cannot `kill(2)` a host
   process and cannot write another session's `<pid>.json`, key or socket; it still writes its own.

## Verify

```bash
node --test test/runner/dispatch-confinement-machine-private.test.mjs
```

Pass: green, and the report states which branch (2 or 3) applied with its evidence. The live proof that Miu still
reaches peers is a row of phase 7's probe.

## Rollback

`git revert` the phase's commits; the host pid space and the read-write binding return.
