# Iron Law evidence — tsk-65q

`classifyIronLaw` result on the real committed diff (`git diff
trunk...fgw/tsk-65q`, computed via `changedFiles`/`classifyIronLaw` per
`src/runner/merge.mjs`/`src/evolve/iron-law.mjs`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

`bin/fgos.mjs` is an Iron-Law-gated module (any change to it trips the
gate regardless of matched keyword flags).

## Test command (item's own `verify`)

```
node --test test/state/gate-bypass.test.mjs test/cli/fgos-gate-approve.test.mjs
```

## Failing-before / passing-after: the real defect, reproduced

The item's own defect isn't "the old code throws uncaught" — its own
`.catch()` already converted the crash into a silent `false`. The real
defect is: a genuine external-install consumer's Gate-section check
**always answers `false`**, no matter what gate-bypass level they actually
configured, because neither resolution tier could ever reach the real
`canAutoApproveMergedGate` computation. Reproduced against the exact
scenario the item describes: a consumer cwd with no local `src/state/*.mjs`
(`consumer-cwd`), and a separate consumer repo root (`consumer-root`) that
also carries none — matching "no repo-local src/state/*.mjs at all, at
`./` or at `$root`" verbatim from the item's own description. `consumer-root`
carries a real, correctly-configured `.fgos/gate-bypass.json`
(`{"level":"standard"}`) and a clean `plan.md`, so a correct answer here is
`true` — the whole point of the reproduction is that the OLD code could
never even see that real configuration.

**Before (HEAD~1's own `.claude/skills/fgos-coding-validating/SKILL.md`
snippet, extracted verbatim and run exactly as documented, `--` args
substituted for the simulated consumer):**

```
$ node -e "<the exact resolveModule/canAutoApproveMergedGate snippet from
  HEAD~1's SKILL.md>" -- "$CONSUMER_ROOT" "fixture" "$CONSUMER_ROOT/plan.md" '[]' "REVERSIBLE"

Cannot find module '/…/consumer-root/src/state/store.mjs' imported from /…/consumer-cwd/[eval]
false
$ echo $?
0
```

Real, correctly-configured `gate-bypass.json` (`level: "standard"`,
which covers this fixture item's tier) — and the old code still reports
`false`, because it never reached the real computation at all. This is the
item's own described defect made concrete: the whole gate-bypass feature
is silently a permanent no-op for this population.

**After (this commit's `bin/fgos.mjs gate-check`, same exact consumer cwd,
same exact `--dir`, invoked by absolute path — nothing about the
simulated consumer's filesystem layout changed):**

```
$ node /path/to/fixed/bin/fgos.mjs gate-check fixture --gate validateApprove \
    --plan "$CONSUMER_ROOT/plan.md" --children '[]' --cost REVERSIBLE --dir "$CONSUMER_ROOT"

{
  "contract": "fgos.v1",
  "generated_at": "2026-08-13T09:20:14.577Z",
  "data_hash": "d5cb032de925634e034f8f44142378b6969a3323c02482ca9afb4ee194a7c446",
  "data": { "canAutoApprove": true }
}
$ echo $?
0
```

Same consumer, same configured level, same clean plan — now answers `true`,
the real computation's real answer, because `bin/fgos.mjs`'s own static
imports resolve `gate-bypass.mjs` against the CLI file's own location, not
the caller's cwd or repo root.

## `npm test`-level regression proof (this item's own `verify`)

```
$ node --test test/state/gate-bypass.test.mjs test/cli/fgos-gate-approve.test.mjs
…
ℹ tests 57
ℹ pass 57
ℹ fail 0
```

Includes (`test/cli/fgos-gate-approve.test.mjs`): `gate-check` invoked via
`run()`, which spawns the CLI by absolute path from a fresh `mkdtemp()`
scratch dir under `os.tmpdir()` — a cwd with no local checkout of
`src/state/*.mjs` anywhere near it, the same class of condition reproduced
above — for both `contextApprove` and `validateApprove`, true and false
paths. Also includes (`test/state/gate-bypass.test.mjs`): malformed
`--children` JSON and a bad `--plan` path both fail loud with a real
stderr diagnostic rather than silently, carrying forward the regression
intent of the two tests this item's own change replaced (which used to
extract and re-run the now-deleted inline snippet directly).
