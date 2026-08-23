# Iron Law evidence — tsk-2ck

## Classification

`{"required":true,"matchedFlags":["schema"],"matchedModules":["src/runner/loop.mjs","src/runner/prompt-templates/worker-prompt-default.txt","src/runner/prompt-templates/worker-prompt-discovery.txt","src/runner/prompt-templates/worker-prompt-skill-pointer.txt"]}`

No false positive here despite the same "schema" keyword that tripped the
Gate's own hard-gate floor (`plan.md`'s Gate section) — this time the
match is against the item's real committed diff's own module list
(`src/runner/loop.mjs` et al.), and `loop.mjs` genuinely is a
self-modifying-capable module on `MODULE_RULES`
(`src/evolve/iron-law.mjs`). This item does make a real behavior change
to it (the risk/kind coercion), so `required: true` is correct on its
own merits here, independent of the keyword.

## RED — new tsk-2ck tests against pre-fix `loop.mjs`

Pre-fix `src/runner/loop.mjs` restored via `git show
8f3d3e2c:src/runner/loop.mjs > src/runner/loop.mjs` (`8f3d3e2c` is the
parent of this item's own implementation commit `816b835e`), with the
new tests from post-fix `test/runner/loop.test.mjs` already in place
(test file is additive-only, no existing test needed changing):

```
$ node --test --test-name-pattern="tsk-2ck" test/runner/loop.test.mjs
✖ tsk-2ck: a fgos-discovered block with an out-of-vocabulary risk (e.g. "medium") is coerced to derived.risk, creating the item instead of dropping it
  AssertionError [ERR_ASSERTION]: item was created instead of being silently dropped
  0 !== 1
✖ tsk-2ck: a fgos-discovered block with an out-of-vocabulary kind is coerced to derived.kind, creating the item instead of dropping it
  AssertionError [ERR_ASSERTION]: item was created instead of being silently dropped
  0 !== 1
✔ tsk-2ck: a fgos-discovered block with absent kind and risk falls back to derived.kind and derived.risk
ℹ tests 3
ℹ pass 1
ℹ fail 2
```

Both failures are exactly the bug this item fixes: pre-fix code passes
an out-of-vocabulary `block.risk`/`block.kind` straight to `addWork`,
`validateWorkShape` throws, the surrounding `try/catch` silently
swallows it, and `0 !== 1` items get created — the silent-drop this item
closes. The third test (absent-value path, the pre-existing `?? derived`
fallback) already passed pre-fix, confirming that path was never broken
and needed no change.

## GREEN — same tests against post-fix `loop.mjs`

Post-fix file restored via `git checkout HEAD -- src/runner/loop.mjs`
(identical command, no code changed beyond that restore):

```
$ node --test --test-name-pattern="tsk-2ck" test/runner/loop.test.mjs
✔ tsk-2ck: a fgos-discovered block with an out-of-vocabulary risk (e.g. "medium") is coerced to derived.risk, creating the item instead of dropping it
✔ tsk-2ck: a fgos-discovered block with an out-of-vocabulary kind is coerced to derived.kind, creating the item instead of dropping it
✔ tsk-2ck: a fgos-discovered block with absent kind and risk falls back to derived.kind and derived.risk
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

## Item's own verify command

```
$ npm test -- test/runner/loop.test.mjs test/e2e/domain-aware-stage-literals.test.mjs
140 tests passed, 0 tests failed.
```

## Full suite (regression check)

```
$ npm test
3941 tests passed, 0 tests failed.
```

No regression anywhere else in the suite from this diff. Working tree
confirmed clean of the temporary pre-fix swap (`git status --short
src/runner/loop.mjs` empty after the `git checkout HEAD --` restore) —
the RED-phase swap was restored before this evidence was written, not
left in place. One unrelated pre-existing modification
(`docs/enduser-docs-index.json`, drift already present in this worktree
before this item's own dispatch ran, citing other items' capture ids) is
untouched by both this item's commit and the RED/GREEN swap above — left
alone as out of this item's scope.

## Verification source

- `src/evolve/iron-law.mjs` — `classifyIronLaw`'s `MODULE_RULES` list,
  confirming `src/runner/loop.mjs` is self-modifying-capable and triggers
  `required: true` on a real files-changed match.
- The RED/GREEN transcripts above — real command runs against real file
  contents swapped in/out on disk (`git show 8f3d3e2c:<path>` extraction,
  `git checkout HEAD --` restore), not paraphrased or fabricated.
- `docs/history/discovered-work-risk-vocabulary/plan.md` and
  `RESEARCH.md` — the decisions and scope this evidence satisfies.
