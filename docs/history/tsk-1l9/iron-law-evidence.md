# tsk-1l9 — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`,
`matchedModules: ["bin/fgos.mjs", "src/state/workflow-stage-graphs.mjs"]`,
`matchedFlags: ["kiểm toán"]`.

Note on the flag: `kiểm toán` matched the item **description**, which narrates
the audit that found the stranded branches. Nothing in the diff touches an
audit surface. This is the false-positive class already filed as `tsk-4gr`
(`canAutoApprove` / `classifyIronLaw` keyword-match run against prose before
tier). The `matchedModules` half is genuine and is what the evidence below
answers.

## What this item lands

Two branches whose content never reached `main` although both items read
`delivered`: `fgw/tsk-64h` and `fgw/tsk-2t5`. Nothing here is newly designed —
both branches were authored, tested and returned on their own claims. The
merge itself is the change.

## Test command

`npm test`, plus the item's own four-clause `verify`:

```
npm test
  && grep -q work-stage-vocabulary src/setup/registrations.mjs
  && grep -q discoverableStages src/state/discover-pool.mjs
  && grep -q "Quét nghiên-cứu trước dispatch (discovery dispatch)" docs/specs/runner.md
  && ! grep -q "Quét làm-rõ trước dispatch (clarify sweep)" docs/specs/runner.md
```

## Failing-before — the item's own verify, run on `main` before any merge

Run from the main checkout at `41fc0ee8`, before `fgw/tsk-1l9` existed. All
four clauses red:

```
A RED (expected)   # grep -q work-stage-vocabulary src/setup/registrations.mjs   -> no match
B RED (expected)   # grep -q discoverableStages src/state/discover-pool.mjs      -> no match
C RED (expected)   # grep -q "Quét nghiên-cứu trước dispatch (discovery dispatch)" docs/specs/runner.md -> no match
D RED (expected)   # the retired "Quét làm-rõ trước dispatch (clarify sweep)" heading was still present
```

## Failing-before — a real integration failure the merge surfaced

This is the failing test that genuinely preceded a source edit in **this**
item's own diff. Neither branch produced it alone; it appears only once both
are on one tree, because `fgw/tsk-64h` moves `discoverableStages` from
`src/intake/discovery.mjs` to `src/state/workflow-stage-graphs.mjs` while
`main`'s `test/cli/command-registry.test.mjs` (landed by `tsk-2so`) still
imports it from the old home.

`npm test` after the two merge commits, before any fix:

```
✖ failing tests:

test at test/cli/command-registry.test.mjs:98:1
✖ discover's description names the stages its precondition actually accepts (31.478127ms)
  TypeError: discoverableStages is not a function or its return value is not iterable
      at TestContext.<anonymous> (.../test/cli/command-registry.test.mjs:102:23)
```

Fix applied (`7ba2456b`): read the symbol from the static registry import the
guard already carries, and drop the now-stale dynamic import — the guard's
stated intent is to derive from live sources, so it follows the symbol rather
than pinning its old module path.

## Passing-after

```
node --test test/cli/command-registry.test.mjs
  ✔ no registry description names a judge* function that no longer exists in src/
  ✔ no registry description names a stage the default domain has retired
  ✔ discover's description names the stages its precondition actually accepts
  ℹ pass 3 · fail 0

npm test
  ℹ tests 2996 · pass 2991 · fail 0 · skipped 5
```

(2996 vs `main`'s 2985 — the eleven new tests are `fgw/tsk-64h`'s own, for
`discover-pool` and the `work-stage-vocabulary` check.)

The four verify clauses, re-run on the merged tree: **all green**.

## Live exercise of the landed check

`fgos doctor --dir <main>` run from the merged tree:

```
work-stage-vocabulary  passed=True :: every open item sits at a stage still registered by its domain
```

Green because the three items that were stranded at retired `clarify` had
already been drained by hand. The check is now standing guard against the
recurrence rather than reporting a live breach.
