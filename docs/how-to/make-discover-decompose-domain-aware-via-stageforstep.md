# Make a hardcoded stage check domain-aware via `stageForStep`

Goal: when a stage check compares `work.stage` against a literal coding
stage name (`'clarify'`, `'decompose'`, `'executing'`), replace it with a
lookup that resolves correctly for any domain registered in
`src/state/workflow-stage-graphs.mjs` — with zero behavior change for
existing `coding` items.

## Steps

1. **Find the literal.** Grep the affected file for the coding stage
   literals directly (`'clarify'`, `'decompose'`, `'executing'`) rather than
   assuming the call sites you already know about are the only ones — this
   item found 4 separate hardcoded pairs across 3 files by grepping rather
   than trusting memory of an earlier pass:

   - `bin/fgos.mjs` — CLI verb gates comparing `stage !== 'clarify'` /
     `stage !== 'decompose'`.
   - `src/intake/discovery.mjs` — `moveStage(..., to: 'decompose',
     expectedStage: 'clarify', ...)`.
   - `src/intake/plan.mjs` — `moveStage(..., to: 'executing',
     expectedStage: 'decompose', ...)`.

2. **Resolve the domain first.** `work.domain` is already in scope at every
   one of these call sites — no new parameter needs threading through.
   Import `getDomain`/`stageForStep` from
   `src/state/workflow-stage-graphs.mjs`:

   ```js
   import { getDomain, stageForStep } from '../state/workflow-stage-graphs.mjs';
   ```

3. **Replace the literal with the resolved stage name.** Map each literal
   to the base-workflow step it represents (`'clarify'` → `Clarify`,
   `'decompose'` → `Divide`, `'executing'` → `Execute`), then resolve
   through the item's own domain instead of hardcoding the coding name:

   ```js
   // before
   if (stage !== 'clarify') { /* ... */ }
   moveStage(dir, { id, to: 'decompose', expectedStage: 'clarify', ... });

   // after
   const clarifyStage = stageForStep(getDomain(work?.domain, { onUnrecognized: () => {} }), 'Clarify');
   if (stage !== clarifyStage) { /* ... */ }
   moveStage(dir, {
     id,
     to: stageForStep(getDomain(work.domain), 'Divide'),
     expectedStage: stageForStep(getDomain(work.domain), 'Clarify'),
     ...
   });
   ```

   This is the same substitution `bin/fgos.mjs`'s `submitWork` already used
   for stage assignment at intake — port the pattern, don't invent a new
   one.

4. **Confirm zero behavior change for `coding`.** For the default domain,
   `stageForStep(getDomain(undefined), 'Clarify') === 'clarify'` — the
   resolved value is byte-identical to the literal it replaces, so every
   existing `coding` item's behavior is unchanged.

5. **Prove it with a second domain, not just the default one.** A domain
   whose `DOMAINS` entry maps a *non-coding-literal* stage name to
   `Clarify`/`Divide` is the only way to actually exercise the new code path
   — a domain that reuses coding's own stage names would pass even with the
   old hardcoded literals still in place. This item added `test/e2e/
   domain-aware-stage-literals.test.mjs`, driving a domain through
   `fgos submit --domain <id>` → sync `fgos discover` → a runner sweep tick,
   asserting: no throw, the item lands on that domain's own correct next
   stage, and a plain `coding` item in the same tick is unaffected.

## Watch out for: a placeholder verify sentinel reads as a real failure

On the first `fgos return` attempt for this exact change, `fgos return`
failed with a `verify-miss` friction: `goal-check failed on branch
"fgw/tsk-3xo" (exit 2)`. The real cause, recorded on the item afterward:

> "Vòng 1 verify là sentinel giữ chỗ (chưa xác định — P15 bổ sung), model
> round 2 đúng khi không đồng ý. Đã cung cấp verify thật: npm test (full
> suite) + e2e test mới test/e2e/domain-aware-stage-literals.test.mjs — đã
> chạy thật, 2/2 pass sau fix, và full suite 2459/2464 pass (5 skip môi
> trường, không liên quan)."

The item's `verify` field had been left as the intake sentinel text
("chưa xác định — P15 bổ sung") rather than a real runnable command — a
`return` against that sentinel is not a real proof of anything, and the
engine correctly treated it as a miss rather than passing it through. Fix:
before returning a domain-generalization change like this one, replace the
sentinel with the actual command that proves it (here: `npm test` plus the
new e2e fixture), the same way any other item's `verify` field must name a
real, runnable command — never a placeholder standing in for one.

A merge-conflict friction also occurred at merge time (`git merge --no-commit
--no-ff fgw/tsk-3xo` conflicted, merge aborted, main left unchanged) —
resolved through the normal conflict-resolution path before the item
reached `delivered`; ordinary rebase/merge conflict handling, not specific
to this domain-aware-stage change.

## Variant: a NEW child item created from a PARENT item's context (`addWork`)

The steps above cover a `moveStage`-style check comparing an EXISTING
item's own stage against a literal. A second, distinct shape of the same
bug exists wherever code creates a brand-new item derived from an existing
one via `addWork(dir, {...})` and stamps a stage literal onto it without
also carrying the parent's `domain` forward. Both parts of the bug matter
together: the hardcoded stage literal may not even exist in the child's
real domain's stage graph once the domain is fixed separately, so fixing
one half without the other still produces a broken child.

Found by grepping `rg -n "addWork\(dir" src` (confirmed exhaustive: only
the `addWork` definition plus the affected call sites matched — no
call site was missed):

- `src/intake/plan.mjs` — child `addWork` call when a
  `verdict.kind === 'decompose'` split creates children: had
  `stage: 'executing'` hardcoded, no `domain` key at all, even though the
  parent's `domain` was already resolved one line away in the same
  function (`stageForStep(domain, 'Execute')` was already in use on the
  very next `moveStage` call — the fix pattern was proven one line below
  the bug).
- `src/runner/loop.mjs` — discovered-from `addWork` call, where the
  runner creates a new item from a worker's own discovery report: had
  `stage: 'clarify'` hardcoded, no `domain` key.

Fix shape, same substitution as above but applied at item-creation time
rather than a stage-comparison time:

```js
// before
addWork(dir, { ...fields, stage: 'executing' });

// after
const domain = getDomain(work.domain);
addWork(dir, { ...fields, domain: work.domain, stage: stageForStep(domain, 'Execute') });
```

Zero behavior change for `domain: coding` items, same reasoning as step 4
above — `stageForStep` resolves to the identical literal string when the
domain is `coding` or absent.

Test proof must exercise a REAL decompose-split verdict (not a
pass-through fixture) for a non-`coding` domain, asserting the produced
children carry both the correct `domain` and the correct (non-literal)
stage — an existing pass-through-only fixture will pass before AND after
the fix, proving nothing. Name both new assertions explicitly in the
item's `verify` command (e.g. via `--test-name-pattern`) and require
`pass >= 2`, so a fix that only covers one of the two call sites (the
`decompose.mjs` child-creation path or the `loop.mjs` discovered-from
path) can't pass silently by covering just one.

### Watch out for: Node's TAP summary line format changed across versions

A `verify` command written against `node --test` output as
`grep -qE "^# pass [1-9]"` will silently stop matching on newer Node —
this repo's Node v24.18.0 prints `ℹ pass N` / `ℹ fail N`, not the older
`# pass N` / `# fail N` TAP summary format. A narrow `[2-9]` single-digit
sanity check on top of that is a second, separate trap: it fails on any
real two-digit-or-higher pass count (e.g. `12`). This was caught by
`fgos return`'s own real disposable-worktree spawn under `/bin/sh`, not by
eyeballing raw test output by hand — the corrected form parses `ℹ pass N`
and `ℹ fail N` with plain numeric `-ge`/`-eq` checks and no digit-class
sanity check at all.
