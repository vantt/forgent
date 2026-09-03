---
authoritative_for: runner.capabilities advise/execute slots, decide --for purpose resolution, advise-execute-capabilities-configured doctor check
---

# `runner.capabilities`'s `advise`/`execute` slots

`decide --for <purpose>` (`src/runner/dispatch.mjs`) validates a `--for`
name against `runner.capabilities` — but until `tsk-2uf-3`, the shared
config's `capabilities` map shipped completely empty, so no purpose name
could ever resolve. `.fgos/config.json` also can't be hand-edited to fix
this: ADR0020 strips `.fgos/` from every worktree, so no child work item
could ever reach it that way, and `AGENTS.md`'s Install/setup/doctor gate
requires any new config default to register through `fgos setup`'s
config-merge and `fgos doctor`'s check registry — never stand alone.

## The two slots (D2)

Role split by which kind of intelligence the work needs, not by mechanism:

- **`advise`** — async product-decision consult. Value comes from
  disagreement; never changes state; one question, one answer.
- **`execute`** — compliance-driven work. Value comes from following the
  plan; changes files; must pass verify.

Both are declared via `DEFAULT_CAPABILITY_SLOTS`
(`src/setup/registrations.mjs`), each carrying only a `description` —
deliberately no `prefer`/`aliases`/`overrides`: naming which executor
serves a purpose is a dispatch-*mechanism* decision, and `tsk-5tm-3` D5
forbids re-deciding that mechanism here.

## Where it's wired in

Layered onto the **same** `runner` config-default registration that
already carries `DEFAULT_RUNNER_CONFIG` (never a second `key: 'runner'`
registration — `assembleRegistryDefaults` combines registrations by flat
per-key assignment, not a deep merge, so a second entry with the same key
would silently overwrite this one instead of adding to it):

```js
registerConfigDefault({
  id: 'runner',
  key: 'runner',
  shape: {
    ...DEFAULT_RUNNER_CONFIG,
    capabilities: DEFAULT_CAPABILITY_SLOTS,
    // ...
  },
});
```

A fresh `fgos setup` run fills `runner.capabilities` into any project
missing it (or missing either slot), the standard `mergeConfigDefaults`
fill-missing-only path — a project with the slots already present is left
untouched.

## The doctor check

`checkConfigNotStale` already catches `runner.capabilities` being wholly
*absent* through the generic default-merge scan. What it can't catch is a
slot present in the **wrong shape** — a string, an array, `null` — since
that's not "missing," so `mergeConfigDefaults` has nothing to add, and
`decide --for advise`/`--for execute` would fail
`validateCapabilitiesShape` with no doctor signal explaining why. A
dedicated check closes that gap:

```
id: advise-execute-capabilities-configured
```

Fails with `"runner.capabilities section missing -- run fgos setup"` when
the whole section is absent or malformed, or names exactly which slot
(`advise`, `execute`, or both) is missing/malformed otherwise. Passes once
both slots are present as real objects.

## Related: `pi` as the second executor (tsk-47r)

Layered onto the same `runner` config-default entry (same
overwrite-not-merge reasoning): `PI_EXECUTOR_DEFAULT` registers `pi`
(`openai-codex`/`gpt-5.5`) as a second `agent`-kind executor, mirroring
`agy`'s live shape. This is the exact invocation a real D4 proof-test
dispatch ran and confirmed GREEN against the coding-worker contract — see
`docs/reference/coding-worker-contract-shape.md` and
`docs/history/pi-executor-runtime-capacity/RESEARCH.md` Round 4.
