# Phase 4: Cage, the role's own work runs inside

Capability: `code:debug` for the diagnosis, then `code:implement`.

Builds the loosening half of PC-D7: what is the role's own work runs inside its cage. Never opens `.fgos`, `.git` or
the release to a grant (`validateWorkspacePaths`).

## Inputs

- The discussion, §4 PC-D7 and PC-D10 (the cage runs the verify commands the project declares; in forgent,
  `npm test` and `cargo test --workspace`), §5 23:28–23:35.
- Owner questions that relayed host test runs: `q-zcileomdpa`, `q-br5rlczzav`, `q-pcwf3slkfp` (`fgos questions --all`).
- Backlog rows: `p-ndortdckid` (friction), `p-ia2v33b54u` (Miu mail), `p-btxvtb34u3` (`fgos answer` EROFS).
  `friction record` and `questions answer` are already socket verbs (plan 0118 phase 2), so for these rows the work is
  to re-prove, and fix only what still fails.
- `src/runner/dispatch/confinement/workspace-paths.mjs`, `resources.mjs`, `drivers/bwrap.mjs` (read only here; phase 5
  owns `bwrap.mjs`).
- `test/live/head-grant-probe.live.mjs` and `test/runner/dispatch-confinement-policies.test.mjs`.

## Footprint

`src/runner/dispatch/confinement/workspace-paths.mjs`, `src/runner/dispatch/confinement/resources.mjs`,
`test/runner/dispatch-confinement-policies.test.mjs`,
`plans/261124-0004-heads-operate-without-owner/reports/cage-before-after.md`.

## Steps

1. Before: run the live probe in a confined supervisor and secretary head on the active release and record the table
   in the report. In the same heads run `npm test -- --help`-level smoke of the declared verify commands
   (`fgos config get land.gates --json` names them), then one real run, and record the first failure of each.
2. Diagnose each failure to its cause (a missing writable path such as a cargo target or npm cache, a read-only
   `TMPDIR`, a masked binary, a lock under `.fgos`). Write cause and evidence in the report before changing anything.
3. Fix only what the cause names, inside the role's own space: a writable private cache or target directory bound per
   head, never a path under `.fgos`, `.git` or the release. If a cause needs `.fgos` writable, stop that item, write it
   in the report as a window job (it becomes a table row in a later item), and continue with the rest.
4. Re-prove `friction record`, mail send from Miu and `questions answer` from Miu on the active release; for each that
   still fails, fix by the same rule. Write the backlog ids each closes in the report; the supervisor closes the rows.
5. Extend `dispatch-confinement-policies.test.mjs` with one proof per new binding: it is writable, and it is not under
   `.fgos`, `.git` or the release.

## Verify

```bash
node --test test/runner/dispatch-confinement-policies.test.mjs
```

Pass: green, and the report holds the before table, each cause with evidence, and the fix per cause. The after
table is phase 7's probe run.

## Rollback

`git revert` the phase's commits; the bindings return to today's set.
