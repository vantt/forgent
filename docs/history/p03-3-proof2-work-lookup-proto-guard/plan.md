# plan.md — guard `--work <id>` lookup against JS prototype property names

## Mode gate

1 flag: existing covered behavior (touches an already-tested lookup shared
by two existing call sites, both already covered by
`test/runner/assignment-dispatch.test.mjs`). **Mode: small.** Root cause
and fix direction already confirmed by P03.2's own Red-Team empirical
reproduction (see CONTEXT.md D1/D2) before this item was written.

## Approach

Add an `Object.prototype.hasOwnProperty.call(...)` guard at both call
sites that do `listWork(fgosDir).work[workIdArg]` — `cli.mjs:621`
(`decide --work`) and the `--contract --work` branch that reuses the same
lookup — so a `--work` value matching a JS built-in property name
(`__proto__`, `constructor`, `toString`, ...) produces the same honest "no
work item found" error every other unknown id already produces, instead
of silently resolving to the prototype value. Add two regression tests
(`test/runner/assignment-dispatch.test.mjs`) exercising `--work __proto__`
and `--work constructor` against both call sites, asserting the error
message and that no assignment/dispatch work happens.

Does not touch `state/store.mjs`'s `currentEffectiveView` `work` map
shape (the broader `Object.create(null)`-at-the-source alternative named
in CONTEXT.md D2) — out of scope for this targeted fix, a decision
already locked in CONTEXT.md, not reopened here.

## Verify

```
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/runner/assignment-dispatch.test.mjs
```

## Outstanding questions

None.
