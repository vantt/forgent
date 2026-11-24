# Phase 1: Diagnose the cage on the active release

Capability: `code:debug`. Read-only: changes no code.

## Inputs

- `plans/discussions/ds-liu5g4k3gh-privileged-chores-research/DISCUSSION.md` §4 PC-D7 and PC-D10, §5 23:28–23:35.
- Owner questions that relayed host test runs: `q-zcileomdpa`, `q-br5rlczzav`, `q-pcwf3slkfp` (`fgos questions --all`).
- Backlog rows `p-ndortdckid` (friction), `p-ia2v33b54u` (Miu mail), `p-btxvtb34u3` (`fgos answer` EROFS),
  `p-oqs75qwyco` (pid namespace).
- `packages/execution/engine/src/confinement/policy/resolver.rs`, `driver/bwrap.rs` (the live head cage).
- `test/live/head-grant-probe.live.mjs`.

## Footprint

`plans/261124-1853-confinement-to-rust/reports/cage-diagnosis.md`.

## Steps

1. Run the live probe in a confined supervisor and secretary head on the active release; record its table.
2. In the same heads, run the declared verify commands (`fgos config get land.gates --json` names them): first a
   `--help`-level smoke, then one real run. Record the first failure of each.
3. Try `friction record`, `fgos mailbox send` from Miu and `fgos questions answer` from Miu; record each result.
4. Diagnose each failure to its cause (a missing writable path such as a cargo target or npm cache, a read-only
   `TMPDIR`, a masked binary, a lock under `.fgos`), with the evidence (command, error, the bwrap argv line). Mark each
   cause either "role's own space" (phase 3 fixes it) or "needs `.fgos`" (a window job for plan 0004's table).

## Verify

```bash
test -s plans/261124-1853-confinement-to-rust/reports/cage-diagnosis.md
```

Pass: the report holds the before table, and every failure has a cause, evidence and its mark.

## Rollback

Delete the report; nothing else changed.
