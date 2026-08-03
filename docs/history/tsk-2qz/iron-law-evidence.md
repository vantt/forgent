# Iron Law evidence — tsk-2qz

`fgos approve tsk-2qz` refused with:

```
fgos: approve: "tsk-2qz" trips the Iron Law — a failing test must precede
this self-modifying diff before it can land. Matched flags: [none];
matched modules: [bin/fgos.mjs]. Re-run with --acknowledge-iron-law to
confirm failing-test-first proof and proceed.
```

`bin/fgos.mjs` (the whole entry file) is on `MODULE_RULES` as a deliberate
over-approximation for "the evolve verb" (`src/evolve/iron-law.mjs`'s own
comment) — this item's actual change to it is a `--fix` flag on the
`doctor` case, unrelated to self-modification/evolve, but the gate still
applies per its own coarse-matching design.

## Recipe followed (per docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md)

Scoped test files: `test/setup/checks.test.mjs test/setup/doctor-fresh-run.test.mjs`
(the two files whose new assertions actually exercise `bin/fgos.mjs`'s
`--fix` flag path).

**Get to red honestly.** Reverted only `bin/fgos.mjs` to its pre-implementation
content (`git show f72b792:bin/fgos.mjs > bin/fgos.mjs` — `f72b792` is
`df071b9`'s parent, the commit immediately before this item's first real
implementation commit), keeping every new/modified test file exactly as
it ships:

```
node --test test/setup/checks.test.mjs test/setup/doctor-fresh-run.test.mjs
```

Real failures, real output:

```
✖ fgos doctor --fix (CLI e2e) actually bootstraps gateBypass.level via the real fix (67.794094ms)
  TypeError: Cannot read properties of undefined (reading 'find')
      at TestContext.<anonymous> (test/setup/checks.test.mjs:250:33)

✖ e2e: fresh external project reaches expected fgos doctor state after init + setup (916.032422ms)
  AssertionError [ERR_ASSERTION]: doctor --fix did not report a "fixed" array
      at TestContext.<anonymous> (test/setup/doctor-fresh-run.test.mjs:110:12)
```

`tests 49 / pass 47 / fail 2` — exactly the two tests that assert on the
`--fix` flag's response shape, nothing else regressed by the revert
(confirms the failures are real and scoped, not an unrelated break).

**Get back to green.** Restored the real file (`git checkout HEAD --
bin/fgos.mjs`), ran the identical command:

```
tests 49 / pass 49 / fail 0
```

**Full suite**, same worktree, same commit:

```
npm test
tests 2075 / pass 2070 / fail 0 / skipped 5
```

5 pre-existing skips — same count the `tsk-62v` precedent recorded for its
own full-suite run, not a new gap introduced here.

## GitNexus `detect_changes` (scope: compare, base_ref: main)

Re-indexed first (`node .gitnexus/run.cjs analyze`, was stale). Result:
`risk_level: "critical"`, `changed_count: 75`, `affected_count: 32`.

**This number is inflated by scope, not by this item's actual diff** — the
comparison is against `main`, and `fgw/tsk-2qz` is far ahead of `main`
(this branch merged `main` mid-work at `9fbd752`, and unrelated items —
`tsk-5vf`, `tsk-slq`, `tsk-2ta`'s later children — landed on `main` after
that, none of which this item touched). Most of the 75 changed symbols and
32 affected processes belong to those unrelated commits (e.g.
`judgeDecompose`/`judgeDiscovery`/`resolveDecompose` chains,
`docs/how-to/avoid-a-hung-verify-on-return-approve-catchup.md`,
`docs/reference/forgentx-tool-registry-configuration.md` — none authored
by this item).

The symbols this item's own diff actually added/touched:
`registerFix`, `runFixes`, `checkGateBypassConfigured`,
`fixGateBypassConfigured` (`src/setup/registrations.mjs`),
`readGateBypassLevel`, `readLegacyStandaloneLevel`
(`src/state/gate-bypass.mjs`), `COMMAND_REGISTRY`
(`src/cli/command-registry.mjs`). Their only reported affected processes
are:

- `RunFixes → SharedConfigFilePath` (`proc_102_runfixes`, intra_community,
  step_count 5)
- `RunFixes → LegacyRunnerConfigPath` (`proc_103_runfixes`,
  intra_community, step_count 5)

Both are exactly the mechanism this item built (`runFixes` calling into
`fixGateBypassConfigured`, which reads/writes through
`sharedConfigFilePath`/`legacyRunnerConfigPath`) — expected, low-risk,
intra-community blast radius, not a surprise finding. None of this item's
own changed symbols appear in any of the `critical`-flagged
`judgeDecompose`/`judgeDiscovery` process chains.
