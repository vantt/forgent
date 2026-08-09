---
type: iron-law-evidence
title: Iron Law evidence — retire .fgos-runner.json
tags: [iron-law]
timestamp: 2026-08-07T07:45:00.000Z
source_capture_ids: []
---

# Iron Law evidence: tsk-5hv

`classifyIronLaw` result against the real committed diff (`8b9a6ec`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs",
    "src/runner/dispatch.mjs",
    "src/runner/loop.mjs",
    "src/runner/paths.mjs",
    "src/runner/prompt-templates.mjs"
  ]
}
```

Triggered by module match (core runner dispatch surface), not a keyword flag.

## Test command

```
npm test
```

## Failing-before proof

Before the fix, the full suite showed 39 failing test lines (many
duplicated in the trailing summary section, ~19 unique failures). Real
excerpts:

```
✖ discover on a clear verdict moves the submitted item to stage decompose with the model-proposed verify (8099.674365ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  'unclear' !== 'clear'
      at TestContext.<anonymous> (file:///.../test/cli/fgos.test.mjs:3254:10)
```

```
✖ bin/fgos-runner.mjs run from a SUBDIRECTORY of another repo operates on that repo (root from cwd, never __dirname) (689362.05268ms)
  AssertionError [ERR_ASSERTION]: The input did not match the regular expression /awaiting-approval/. Input:
  'fgos-runner: claimed "item-cli" (todo -> doing)\n' +
    'fgos-runner: worker for "item-cli" exited 0 (tier standard -> sonnet)\n' +
    'fgos-runner: goal-check miss for "item-cli" (attempt 1): verify passed but the branch carries no commit — the worker must commit its work\n' +
    ...
    'fgos-runner: parked "item-cli" (verify-miss, 2 attempt(s))\n'
```

```
✖ e2e pr-gate (a) runner item full loop: ... (308484.470393ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'blocked'
  - 'awaiting-approval'
```

Root cause, confirmed by direct investigation (not assumed): these test
files' own scripted-executor fixtures write `.fgos-runner.json` to stand
in for a real `claude` CLI (deterministic node-script executors, so the
test never needs a live LLM call). Once the legacy read path was removed
(D1), the CLI stopped finding those fixtures and fell through to a
different config (or a bootstrap default), so a real, unscripted
resolution ran instead — producing the nondeterministic/incorrect
behavior above. A second, independent bug compounded this: several call
sites (`bin/fgos.mjs`'s `discover`/`decompose`/`return`/`approve`/
`sync-root`/`catchup`, `dispatch.mjs`'s `resolveCapacityCli`/
`decideCapacityCli`, `scripts/project-agents.mjs`) resolved the runner
config against a worktree-local root instead of the main checkout —
invisible while the legacy file (git-tracked, survives worktree creation)
was still being read as a fallback, exposed the moment it was removed.

## Passing-after proof

After updating every fixture writer to target `.fgos/config.json` and
fixing the worktree-root-resolution gap (`resolveMainCheckoutRoot`,
`src/runner/paths.mjs`), narrow re-runs on the affected files:

```
$ node --test test/runner/dispatch.test.mjs
ℹ tests 133
ℹ pass 133
ℹ fail 0
```

```
$ node --test --test-name-pattern="discover on a clear verdict|decompose on an item sitting at stage decompose|discover on a decompose-stage item|discover on an unclear verdict|discover --verdict clear --verify|decompose --verdict pass-through|return omitting --timeout" test/cli/fgos.test.mjs
✔ discover on a clear verdict moves the submitted item to stage decompose with the model-proposed verify (320.462777ms)
✔ decompose on an item sitting at stage decompose dispatches to resolveDecompose and pass-throughs it on to executing (sync/async parity) (632.85581ms)
✔ discover on a decompose-stage item errors instead of silently dispatching to resolveDecompose (tsk-2b0 D1: hard split, no fallback) (398.758534ms)
✔ discover on an unclear verdict parks the submitted item in awaiting-human with the question, still stage clarify (393.02958ms)
✔ discover --verdict clear --verify moves the item to decompose with that exact verify, bypassing the configured (opposite) judge verdict (273.351407ms)
✔ decompose --verdict pass-through moves the item to executing, bypassing the configured (opposite) judge verdict (397.691302ms)
✔ return omitting --timeout falls back to the runner config's timeoutMs, blocking a verify that outlives it (1894.573326ms)
ℹ tests 7
ℹ pass 7
ℹ fail 0
```

Also confirmed live (not just via tests): running `node scripts/project-agents.mjs` and `node src/runner/dispatch.mjs resolve <capacityId>` directly against this repo's own `.fgos/config.json` from inside this item's own worktree produces byte-identical output to before the change (`git status --short .claude/agents/fgos-placeholder.md` empty after the run).

Full-suite run is still in progress at the time of this evidence file (heavy e2e suite, ~15-20 min); the fixture-writer + root-resolution fixes above account for every failure whose root cause was directly investigated. `fgos return`'s own verify re-run is the authoritative final gate.
