# Iron Law evidence — tsk-2tr: Extract dispatch result normalization ladder

## Classification (run after commit `0afd231d`, per the timing fix)

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "src/runner/dispatch/cli.mjs",
    "src/runner/dispatch/result-ladder.mjs"
  ]
}
```

`src/runner/dispatch/cli.mjs` is on the Iron Law's self-modifying-capable
module list (`src/evolve/iron-law.mjs`'s `MODULE_RULES`), so this diff
needs failing-test-first proof before `[DONE]`.

## Recipe followed

Test files covering this diff: `test/runner/dispatch.test.mjs` (both
before and after — same scope both runs, per
`docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`).

### 1. Get to red honestly

The implementation was already committed (`0afd231d`) before this
classification ran (avoiding the `tsk-2l0`/`tsk-5cf` false-negative
timing bug this repo's own how-to doc documents). To reconstruct an
honest pre-implementation state without touching the test file:

```bash
git show 76233b7c:src/runner/dispatch/cli.mjs > src/runner/dispatch/cli.mjs
rm src/runner/dispatch/result-ladder.mjs
```

(`76233b7c` is the parent commit — plan/research docs only, no
implementation yet.) `test/runner/dispatch.test.mjs` stayed exactly as
it ships, importing `buildDispatchResult` from the now-removed module.

Real failure, captured verbatim:

```
node:internal/modules/esm/resolve:271
    throw new ERR_MODULE_NOT_FOUND(
          ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/home/vantt/projects/forgentX/.claude/worktrees/tsk-2tr-i3LDrq/src/runner/dispatch/result-ladder.mjs' imported from /home/vantt/projects/forgentX/.claude/worktrees/tsk-2tr-i3LDrq/test/runner/dispatch.test.mjs
    ...
    code: 'ERR_MODULE_NOT_FOUND',
    url: 'file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2tr-i3LDrq/src/runner/dispatch/result-ladder.mjs'
}

Node.js v24.18.0
✖ test/runner/dispatch.test.mjs (67.375909ms)
```

`node --test test/runner/dispatch.test.mjs test/runner/herdr-spawn-adapter.test.mjs`
result: **29 pass / 1 fail** (the whole `dispatch.test.mjs` file failed
to load — module-resolution error, not a paraphrase; `herdr-spawn-adapter.test.mjs`'s
own 29 tests, which don't depend on the new module, passed unaffected).

### 2. Get back to green

```bash
git checkout HEAD -- src/runner/dispatch/cli.mjs src/runner/dispatch/result-ladder.mjs
```

Rerun, identical command:

```
ℹ tests 363
ℹ pass 363
ℹ fail 0
ℹ skipped 0
```

**363/363**, full pass.

### 3. Full suite

`npm test` (after also registering the new module in
`docs/architecture-manifest.json` — a real blocking gap the first full-suite
run surfaced: `test/architecture.test.mjs`'s "đủ sổ" check refused an
unregistered `.mjs` file; fixed in the same amended commit, `infra` layer,
matching every other `src/runner/dispatch/*.mjs` sibling):

```
ℹ tests 4166
ℹ pass 4161
ℹ fail 0
ℹ skipped 5
```

**4161/4161 (5 pre-existing skips)**, no regressions.

### 4. Blast-radius cross-check

`fgos tool query --capability impact-analysis --status present` reports
GitNexus `present`. `mcp__gitnexus__detect_changes` was attempted
(`scope: compare`, `base_ref: main`, this worktree) but this specific
worktree (`tsk-2tr-i3LDrq`, created this session) is not among GitNexus's
indexed repos — **posture: degraded** (registered/present, but this
worktree's index doesn't exist yet; blast radius not confirmed via
code-graph). Named plainly rather than skipped: a direct cross-check
substitutes for it here —

```
grep -rln "result-ladder\|buildDispatchResult" src test
```

→ exactly 3 files: the new module itself, its single call site
(`src/runner/dispatch/cli.mjs`), and its own test file
(`test/runner/dispatch.test.mjs`). No other file in the repo references
either name — confirming the extraction is fully self-contained, matching
`RESEARCH.md`'s own finding that `executeExecutorCli`'s external return
shape is unchanged (only *where* the logic lives moved, not what it
returns), and the full 4161-test suite run above is itself a real,
executed confirmation that nothing downstream broke.
