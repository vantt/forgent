# Iron Law evidence — tsk-5z0

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run over this item's own change
set:

```json
{
 "required": true,
 "matchedFlags": [],
 "matchedModules": [
  "bin/fgos.mjs"
 ]
}
```

Test command (the same one run at step 3, and the first leg of the item's own
`verify`):

```
node --test test/cli/invocation-fault-log.test.mjs
```

## Failing before

Captured by restoring every touched file to `HEAD` (`git show HEAD:bin/fgos.mjs`,
`HEAD:.gitignore`, `HEAD:docs/architecture-manifest.json`, and deleting
`src/cli/invocation-fault-log.mjs`), then running the command above unchanged:

```
✖ an unknown verb is recorded with its argv, cwd and writer identity (104.904593ms)
✖ a bare --dir (nothing to resolve a store from) is recorded as an input fault (114.080982ms)
✔ a verb's own refusal is not a malformed call and is never recorded (105.674183ms)
✖ recording never writes to events.jsonl (101.821286ms)
✖ the fault is announced on stderr, after the error itself, and only when a record landed (112.067829ms)
✖ a fault from a linked worktree records into the main checkout, never into the worktree (112.775079ms)
✔ outside a git repo with no store, nothing is recorded and no store is created (45.014456ms)
✖ concurrent faults append whole lines, never a torn one (187.909906ms)
✖ the fault log is gitignored in this repo — recorded argv must never be committed (2.527622ms)
ℹ tests 9
ℹ pass 2
ℹ fail 7
```

Two tests pass before the change, and that is the point of them: they assert
what must **not** happen — a verb's own refusal leaves no record, and a refused
verb in a storeless non-git dir creates nothing. They would still pass if the
feature were never built, so they are guards against over-recording, not proof
of the feature.

Representative failure detail from the same run:

```
✖ the fault log is gitignored in this repo — recorded argv must never be committed (2.400038ms)
  AssertionError [ERR_ASSERTION]: .fgos/invocation-faults.jsonl must be gitignored: the records carry the raw argv of the bad call

  1 !== 0

    at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5z0-zG4ath/test/cli/invocation-fault-log.test.mjs:186:10)
  {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: 1,
    expected: 0,
    operator: 'strictEqual'
  }
```

## Passing after

Same command, same test file, with the implementation restored:

```
✔ an unknown verb is recorded with its argv, cwd and writer identity (111.579279ms)
✔ a bare --dir (nothing to resolve a store from) is recorded as an input fault (105.42294ms)
✔ a verb's own refusal is not a malformed call and is never recorded (101.359834ms)
✔ recording never writes to events.jsonl (98.330587ms)
✔ the fault is announced on stderr, after the error itself, and only when a record landed (141.09679ms)
✔ a fault from a linked worktree records into the main checkout, never into the worktree (108.65758ms)
✔ outside a git repo with no store, nothing is recorded and no store is created (40.968338ms)
✔ concurrent faults append whole lines, never a torn one (185.955096ms)
✔ the fault log is gitignored in this repo — recorded argv must never be committed (2.054592ms)
ℹ tests 9
ℹ pass 9
ℹ fail 0
```

## No regression in the module the gate flagged

`bin/fgos.mjs` is why the gate applies, so its existing coverage was run
unchanged, along with the layering check the new module's manifest row affects
and the whole suite:

```
node --test test/cli/fgos.test.mjs      → ℹ tests 439   ℹ pass 439   ℹ fail 0
node --test test/architecture.test.mjs  → ℹ tests 3     ℹ pass 3     ℹ fail 0
npm test                                → ℹ tests 1836  ℹ pass 1831  ℹ fail 0  ℹ skipped 5
```
