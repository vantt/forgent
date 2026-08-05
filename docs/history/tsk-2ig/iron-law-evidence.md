# Iron Law evidence — tsk-2ig

## classifyIronLaw result (at approve time)

```json
{"required": true, "matchedFlags": [], "matchedModules": ["src/runner/dispatch.mjs", "src/runner/frozen-judge.mjs"]}
```

Genuine module match, not a keyword false-positive: this item's own diff
touches `src/runner/dispatch.mjs` (new `captureDispatchAttestation`,
wired into `resolveExecutorCommand`) and `src/runner/frozen-judge.mjs`
(new `footprintDiffHits`), both under the D10+D14 self-modifying-capable
`src/runner/` prefix rule (`src/evolve/iron-law.mjs`'s `MODULE_RULES`).

Full changed-file set: `src/runner/dispatch.mjs`,
`src/runner/frozen-judge.mjs`, `test/runner/dispatch.test.mjs`,
`test/runner/frozen-judge.test.mjs` — implementation commit `9d3c6c0`
("feat(tsk-2ig): worktree-dispatch-attestation mức 1 (advisory-only)"),
parent commit `67b5fb0`.

## Test command

```bash
node --test test/runner/dispatch.test.mjs test/runner/frozen-judge.test.mjs
```

## Failing before

Real execution: a temporary git worktree checked out at `67b5fb0` (the
commit immediately before `9d3c6c0`), with only the NEW test files
(`git show 9d3c6c0:test/runner/{dispatch,frozen-judge}.test.mjs`) copied
in against the OLD `src/runner/{dispatch,frozen-judge}.mjs` (no
`captureDispatchAttestation`/`footprintDiffHits` yet):

```
$ node --test test/runner/dispatch.test.mjs test/runner/frozen-judge.test.mjs
SyntaxError: The requested module '../../src/runner/frozen-judge.mjs' does not provide an export named 'footprintDiffHits'
✖ resolveExecutorCommand: baseCommit/headRef captured from a real git repo when fgosDir is given (AssertionError)
✖ resolveExecutorCommand: baseCommit/headRef are both null when fgosDir is omitted (AssertionError)
✖ resolveExecutorCommand: baseCommit/headRef fail closed to null (never throw) when fgosDir does not point at a git repo (AssertionError)
ℹ tests 131
ℹ pass 127
ℹ fail 4
```

## Passing after

Same scratch worktree, `src/runner/dispatch.mjs` and
`src/runner/frozen-judge.mjs` replaced with the `9d3c6c0` versions (the
real implementation):

```
$ node --test test/runner/dispatch.test.mjs test/runner/frozen-judge.test.mjs
ℹ tests 150
ℹ pass 150
ℹ fail 0
```

The scratch worktree used to capture this was created and removed for
this evidence run only (`git worktree add`/`remove --force` against the
already-committed `67b5fb0`/`9d3c6c0` commits) — no working-tree state was
altered.
