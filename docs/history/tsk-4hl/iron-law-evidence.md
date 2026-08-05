# Iron Law evidence — tsk-4hl

## classifyIronLaw result

```json
{"required": true, "matchedFlags": [], "matchedModules": ["bin/fgos.mjs", "src/runner/dispatch.mjs", "src/runner/loop.mjs"]}
```

Genuine module match: `bin/fgos.mjs` (`footprintDiffHits` wiring in the
`return` verb), `src/runner/dispatch.mjs` (`attestRoot`,
`captureDispatchAttestation`, `resolveExecutorCommand`, `spawnWorker`),
`src/runner/loop.mjs` (`capacity.dispatch` event payload).

Full changed-file set: `bin/fgos.mjs`, `src/runner/dispatch.mjs`,
`src/runner/loop.mjs`, `test/cli/fgos.test.mjs`,
`test/runner/dispatch.test.mjs` — implementation commit `8dfda94`, parent
commit `c778cbb`.

## Test commands

```bash
node --test test/runner/dispatch.test.mjs
node --test --test-name-pattern="tsk-4hl|D5 absent-footprint exemption" test/cli/fgos.test.mjs
```

(The full item verify — `node --test test/runner/dispatch.test.mjs
test/runner/frozen-judge.test.mjs test/cli/fgos.test.mjs` — was already
run once in-worktree, green: 697/697. This evidence run scopes to the 9
new tests the fix actually adds, since the full CLI suite takes ~150s.)

## Failing before

Real execution: a temporary git worktree checked out at `c778cbb` (the
commit immediately before `8dfda94`), with only the NEW test content
(`git show 8dfda94:test/{runner/dispatch,cli/fgos}.test.mjs`) copied in
against the OLD `bin/fgos.mjs`/`src/runner/{dispatch,loop}.mjs`:

```
$ node --test test/runner/dispatch.test.mjs
ℹ tests 133
ℹ pass 130
ℹ fail 3   (the 2 resolveExecutorCommand attestRoot tests + 1 spawnWorker attestation test)

$ node --test --test-name-pattern="tsk-4hl|D5 absent-footprint exemption" test/cli/fgos.test.mjs
✖ return: a changed file outside the item's footprint surfaces a footprintDiffHits advisory ...
✖ return: footprintDiffHits is empty when the item declares NO footprint at all (D5 ...) ...
✖ return: the item's own docs/history/<id>/iron-law-evidence.md is exempt from footprintDiffHits ...
ℹ tests 3
ℹ pass 0
ℹ fail 3
```

## Passing after

Same scratch worktree, `bin/fgos.mjs`/`src/runner/dispatch.mjs`/
`src/runner/loop.mjs` replaced with the `8dfda94` versions (the real
implementation):

```
$ node --test test/runner/dispatch.test.mjs
ℹ tests 133
ℹ pass 133
ℹ fail 0

$ node --test --test-name-pattern="tsk-4hl|D5 absent-footprint exemption" test/cli/fgos.test.mjs
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

The scratch worktree used to capture this was created and removed for
this evidence run only (`git worktree add`/`remove --force` against the
already-committed `c778cbb`/`8dfda94` commits) — no working-tree state
was altered.
