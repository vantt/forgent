# Iron Law evidence — tsk-2b0

`classifyIronLaw` on this item's final diff returned `required: true`,
matched module `["bin/fgos.mjs"]` (no matched keyword flags) — the item
edits the CLI dispatcher's `runVerb` switch directly, a self-modifying-
capable module.

## Test command

```
node --test --test-name-pattern="tsk-2b0 D1" test/cli/fgos.test.mjs
```

## Failing-before transcript

Captured by temporarily reverting only `bin/fgos.mjs` to its pre-fix
content (`git show HEAD~1:bin/fgos.mjs`, the merge commit before this
item's own implementation commit) while keeping the reshaped tests, then
running the two new stage-guard tests against the unfixed dispatcher:

```
$ node --test --test-name-pattern="tsk-2b0 D1" test/cli/fgos.test.mjs

✖ discover on a decompose-stage item errors instead of silently dispatching to resolveDecompose (tsk-2b0 D1: hard split, no fallback) (283.808518ms)
✖ decompose on a clarify-stage item errors instead of silently dispatching to resolveDiscovery (tsk-2b0 D1: hard split, no fallback) (192.541413ms)
ℹ tests 2
ℹ pass 0
ℹ fail 2

✖ failing tests:

test at test/cli/fgos.test.mjs:2780:1
✖ discover on a decompose-stage item errors instead of silently dispatching to resolveDecompose (tsk-2b0 D1: hard split, no fallback) (283.808518ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  0 !== 4

    at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2b0-8JR4Wa/test/cli/fgos.test.mjs:2789:10)
  {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 0,
    expected: 4,
    operator: 'strictEqual',
    diff: 'simple'
  }

test at test/cli/fgos.test.mjs:2795:1
✖ decompose on a clarify-stage item errors instead of silently dispatching to resolveDiscovery (tsk-2b0 D1: hard split, no fallback) (192.541413ms)
  AssertionError [ERR_ASSERTION]: The input did not match the regular expression /not "decompose"/. Input:

  'fgos: unknown verb "decompose". Usage: fgos <init|add|submit|discover|move|edit|ask|answer|decision|list|ready|rebuild|repair|check|rollup|take|return|review|approve|reject|catchup|evolve|triage|session|goal|tool|setup|doctor|unlock|lock-status> ...\n'

    at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2b0-8JR4Wa/test/cli/fgos.test.mjs:2802:10)
  {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 'fgos: unknown verb "decompose". Usage: fgos <init|add|submit|discover|move|edit|ask|answer|decision|list|ready|rebuild|repair|check|rollup|take|return|review|approve|reject|catchup|evolve|triage|session|goal|tool|setup|doctor|unlock|lock-status> ...\n',
    expected: /not "decompose"/,
    operator: 'match',
    diff: 'simple'
  }
```

## Passing-after transcript

`bin/fgos.mjs` restored (`git checkout HEAD -- bin/fgos.mjs`), same
pattern re-run:

```
$ node --test --test-name-pattern="tsk-2b0 D1" test/cli/fgos.test.mjs

✔ discover on a decompose-stage item errors instead of silently dispatching to resolveDecompose (tsk-2b0 D1: hard split, no fallback) (316.903086ms)
✔ decompose on a clarify-stage item errors instead of silently dispatching to resolveDiscovery (tsk-2b0 D1: hard split, no fallback) (234.480207ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

Full suite (`npm test`) also green: 1924 pass, 0 fail, 5 skipped
(pre-existing skips, unrelated).
