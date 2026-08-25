# Iron Law evidence — tsk-gb3

`classifyIronLaw` against the real committed diff (`trunk...fgw/tsk-gb3`,
commit `99e41445`):

```json
{
  "required": true,
  "matchedFlags": ["auth", "schema"],
  "matchedModules": [
    "src/runner/dispatch.mjs",
    "src/runner/dispatch/cli.mjs",
    "src/runner/dispatch/config.mjs",
    "src/runner/dispatch/resolve.mjs",
    "src/runner/dispatch/transport.mjs"
  ]
}
```

Verify command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/runner/dispatch.test.mjs`

## Failing-before proof

Implement ran out-of-process (`agy`/`gemini-3.6-flash-medium`), so this
driver session did not witness the worker's own red→green cycle live.
Re-derived it directly and honestly instead: checked out the 5
pre-change source files at `branchHeadAtTake`
(`252885c9804672f0f8ee852209fb0d82f2b83114`) back into this worktree —
`src/runner/dispatch.mjs`, `dispatch/{cli,config,resolve,transport}.mjs`
— leaving the new test cases (already committed at HEAD) untouched, then
ran the real command, filtered to the new cases:

```
$ git checkout 252885c9804672f0f8ee852209fb0d82f2b83114 -- src/runner/dispatch/config.mjs src/runner/dispatch/transport.mjs src/runner/dispatch.mjs src/runner/dispatch/resolve.mjs src/runner/dispatch/cli.mjs
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test --test-name-pattern "resolveExecutorEnv|glm|per-executor resolved env" test/runner/dispatch.test.mjs

file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-gb3-PPzQLj/test/runner/dispatch.test.mjs:17
  resolveExecutorEnv,
  ^^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/runner/dispatch.mjs' does not provide an export named 'resolveExecutorEnv'
...
✖ test/runner/dispatch.test.mjs (55.250019ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

Real failure: the pre-change `dispatch.mjs` does not export
`resolveExecutorEnv` at all — the new capability genuinely does not exist
before this change.

## Passing-after proof

Restored the real implementation (`git checkout HEAD -- <same 5
files>`), tree confirmed clean, ran the exact same filtered command:

```
$ git checkout HEAD -- src/runner/dispatch/config.mjs src/runner/dispatch/transport.mjs src/runner/dispatch.mjs src/runner/dispatch/resolve.mjs src/runner/dispatch/cli.mjs
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test --test-name-pattern "resolveExecutorEnv|glm|per-executor resolved env" test/runner/dispatch.test.mjs

✔ resolveExecutorEnv substitutes ${VAR} against baseEnv and passes literals unchanged (1.201572ms)
✔ resolveExecutorEnv returns empty object when rawEnv is absent or invalid (0.408569ms)
✔ spawnWorker / cliSpawnAdapter passes per-executor resolved env to child process (26.168603ms)
✔ registered executors.glm entry resolves command "claude" and env block (19.93371ms)
ℹ tests 4
ℹ pass 4
ℹ fail 0
```

Then the full, unfiltered verify command, real output:

```
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/runner/dispatch.test.mjs
ℹ tests 319
ℹ pass 319
ℹ fail 0
```

(Baseline before this item's first commit, run independently during
`fgos-coding-validating`'s Step 3 feasibility matrix, same command:
`tests 312, pass 312, fail 0` — 7 new tests added, all real, all green.)

## Structural note (not an Iron Law gap, a separate scope boundary)

The real `.fgos/config.json` registration of the `glm` executor entry
(plan.md's step 3) is **not** part of this commit — `.fgos/` is
unconditionally stripped from every worktree (ADR0020), so no branch can
ever carry that change. This matches the existing `agy`/`codex`
precedent (RESEARCH.md Round 1, finding 4): both are hand-authored
directly on the main checkout, never through a branch. The code
capability this item delivers (the `env` schema field + `${VAR}`
substitution + spawn wiring, all Iron-Law-classified above) is complete
and verified; the config-data registration is a separate, explicit
follow-up action against the main checkout.
