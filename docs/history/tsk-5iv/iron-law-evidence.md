# tsk-5iv — Iron Law evidence

`classifyIronLaw` result against this item's real changed-file set:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

`bin/fgos.mjs` trips the self-modifying module gate. Verify command:
`node --test test/cli/fgos.test.mjs test/intake/plan.test.mjs
test/runner/loop.test.mjs test/runner/main-checkout-reset-guard.test.mjs
test/skills/fgos-coding-exploring-root-fix.test.mjs && node --test
'test/**/*.test.mjs'`. Full suite: 2665 pass / 0 fail / 5 skip (baseline
2656/0/5 before this item).

## Failing-test-first proof (real transcripts, pre-fix vs post-fix)

### D1 — main-checkout-reset refuses without `--dir` from a linked worktree

Pre-fix (`git show HEAD:bin/fgos.mjs` restored temporarily, before D1's
`isMainWorktree` refusal was added):

```
✖ main-checkout-reset from a linked worktree with no --dir refuses before touching git (D1) (160.160075ms)
  AssertionError [ERR_ASSERTION]: must be a clean validation refusal, never a crash or a silent reset

  0 !== 4
```

Post-fix (real fixed `bin/fgos.mjs` restored):

```
✔ main-checkout-reset from a linked worktree with no --dir refuses before touching git (D1) (154.543884ms)
```

### D2 — `.fgos/gate-bypass.json` change surfaces in `footprintDiffHits`

Pre-fix:

```
✖ return: a .fgos/gate-bypass.json change bundled into the item's own commit DOES surface in footprintDiffHits, unlike events.jsonl (tsk-5iv D2: exemption narrowed to noise only) (374.601564ms)
  AssertionError [ERR_ASSERTION]: a policy-file change outside the declared footprint must surface, not be silently swallowed by the noise exemption
```

Post-fix:

```
✔ return: a .fgos/gate-bypass.json change bundled into the item's own commit DOES surface in footprintDiffHits, unlike events.jsonl (tsk-5iv D2: exemption narrowed to noise only) (328.345187ms)
```

### D6 — decompose crash-guard fixture actually reaches the crash site

Guard temporarily removed (`covered.add(f);` unconditional, no
`typeof f === 'string'` check) — real crash reproduced, not simulated:

```
    actual: TypeError: Cannot read properties of null (reading 'replace')
        at isCoveredByDirectory (.../src/intake/plan.mjs:536:21)
        at file:///.../src/intake/plan.mjs:562:32
        at Array.filter (<anonymous>)
        at findUncoveredLockedDecisions (.../src/intake/plan.mjs:561:20)
        at file:///.../test/intake/plan.test.mjs:2151:23
    expected: undefined,
    operator: 'doesNotThrow'
```

Guard restored — real fix, not the round-2 phantom fixture:

```
✔ findUncoveredLockedDecisions: a non-string footprint entry (e.g. null) is skipped, never thrown on
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

## Matched module

`bin/fgos.mjs` — D1 (`main-checkout-reset` refusal), D2
(`excludeFgosPaths` narrowing), D3 (`STORE_MISSING_WARNING_VERBS`
addition) all land here; the module gate covers all three in one trip,
consistent with `classifyIronLaw`'s per-module (not per-decision) grain.
