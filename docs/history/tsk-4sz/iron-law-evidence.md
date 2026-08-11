# Iron Law evidence: tsk-4sz

Per `tsk-5t3`'s contract (D2/D3): `classifyIronLaw` on this item's final
diff (`src/runner/merge.mjs`'s `changedFiles`, computed against `main`
after the implementation commit) returned `required: true` —
`matchedModules: ["src/runner/loop.mjs"]` (a self-modifying-capable
module on `MODULE_RULES`), `matchedFlags: []` (no description-keyword
hit).

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/loop.mjs"]
}
```

## Failing-test-first proof

Test command (the item's own locked `verify`, `--test-name-pattern`
scoped to the two new assertions):

```
node --test --test-name-pattern="domain-aware (decompose child addWork|discovered-from addWork) inherits parent domain" test/e2e/domain-aware-stage-literals.test.mjs
```

**Before the fix** (`src/intake/plan.mjs` / `src/runner/loop.mjs`
temporarily reverted to the pre-fix commit, test file kept at its
post-fix state) — both new tests failed exactly on the claimed bug: a
`triage`-domain child/discovered-from item silently defaulted to no
domain (`coding`'s implicit default) instead of inheriting the parent's
`domain`. Real transcript:

```
✖ domain-aware decompose child addWork inherits parent domain+stage (331.676093ms)
  AssertionError [ERR_ASSERTION]: child inherits the PARENT's domain, not the coding default
  + actual - expected

  + undefined
  - 'triage'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-4sz-hvpkwn/test/e2e/domain-aware-stage-literals.test.mjs:256:10)
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: undefined,
    expected: 'triage',
    operator: 'strictEqual',
    diff: 'simple'
  }

✖ domain-aware discovered-from addWork inherits parent domain+stage (375.560903ms)
  AssertionError [ERR_ASSERTION]: discovered-from item inherits the PARENT's domain, not the coding default
  + actual - expected

  + undefined
  - 'triage'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-4sz-hvpkwn/test/e2e/domain-aware-stage-literals.test.mjs:326:10)
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: undefined,
    expected: 'triage',
    operator: 'strictEqual',
    diff: 'simple'
  }

ℹ tests 2
ℹ pass 0
ℹ fail 2
```

**After the fix** — `decompose.mjs`'s child `addWork` gained
`domain: work.domain` + `stage: stageForStep(domain, 'Execute')`;
`loop.mjs`'s discovered-from `addWork` gained `domain: item.domain` +
`stage: stageForStep(getDomain(item.domain), 'Clarify')`. Same test file,
real transcript:

```
✔ domain-aware decompose child addWork inherits parent domain+stage (476.544007ms)
✔ domain-aware discovered-from addWork inherits parent domain+stage (418.236095ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

Full suite after the fix (`npm test`, this item's own `plan.md`-committed
regression bar, run in full — not just the pattern-scoped verify above):
**2579 tests, 2574 pass, 0 fail, 0 cancelled, 5 skip** (the 5 skips
pre-exist this item, unrelated to this change).

## Why `matchedModules: ["src/runner/loop.mjs"]` is a real hit, not a false positive

`loop.mjs` sits in the runner's core dispatch chain
(`dispatchClaimedItem → claimAndDispatch → runOnce`, confirmed via
GitNexus `impact()` during `fgos-coding-planning` — HIGH blast radius,
`impactedCount: 3`) — exactly the kind of self-modifying-capable module
the Iron Law exists to gate. The proof above is real failing-test-first
evidence, captured by reverting only the two target files to their
pre-fix state (`git checkout HEAD~1 -- src/intake/plan.mjs
src/runner/loop.mjs`) while keeping the new test file at its post-fix
state, then restoring the fix (`git checkout HEAD -- ...`) and
re-running — never fabricated or paraphrased from expectation.
