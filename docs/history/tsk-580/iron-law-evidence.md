# Iron Law evidence — tsk-580

`classifyIronLaw` (`src/evolve/iron-law.mjs`) at `approve` time: `required:
true`, matched module `bin/fgos.mjs` (a self-modifying diff, per
`docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md` D2). Evidence
gathered the same way `approve` itself classifies, not a separate
heuristic.

## Command run

```
node --test --test-name-pattern="verify-from" test/cli/fgos.test.mjs
```

Same command as the item's own `verify` field's first stage (before the
pass/fail-count + fail-line hardening documented in `plan.md`).

## Before the fix — RED (bin/fgos.mjs reverted to commit 90faf15, the
branch's own pre-implementation tip; test file kept at its current,
already-written state)

```
✖ edit --verify-from-children generates a jq command listing all direct children ids with the resolved-set check and an absolute --dir, exit 0
✖ edit --verify-from-targets generates a jq command listing all target ids with the resolved-set check and an absolute --dir, exit 0
✖ edit --verify-from-children with no children found throws a validation error instead of writing a vacuous verify, exit 4
✖ edit --verify-from-targets with empty targets throws a validation error instead of writing a vacuous verify, exit 4
ℹ tests 4
ℹ pass 0
ℹ fail 4
```

Failure detail for test 1 (representative — the other 3 fail the same way,
missing flags falling through to the generic "requires at least one field
to change" error):

```
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
4 !== 0
    at TestContext.<anonymous> (.../test/cli/fgos.test.mjs:1373:10)
```

Test 3/4 (the guard tests) failed on the wrong error entirely — with no
`--verify-from-children`/`--verify-from-targets` flags recognized yet, the
CLI fell through to its generic no-op-flags error instead of a
children/targets-specific one:

```
AssertionError [ERR_ASSERTION]: The input did not match the regular
expression /no children|no item has parent/i. Input:
'fgos: edit requires at least one field to change: --title/--description/
--kind/--risk/--verify/--tier/--refs/--deps/--footprint/--acceptance/
--priority/--intent/--docs-ref/--parent/--urgent/--impact/--effort/
--merge-after/--superseded-by/--duplicates/--domain-fields.\n'
```

## After the fix — GREEN (`bin/fgos.mjs` restored to its real, committed
implementation)

```
✔ edit --verify-from-children generates a jq command listing all direct children ids with the resolved-set check and an absolute --dir, exit 0
✔ edit --verify-from-targets generates a jq command listing all target ids with the resolved-set check and an absolute --dir, exit 0
✔ edit --verify-from-children with no children found throws a validation error instead of writing a vacuous verify, exit 4
✔ edit --verify-from-targets with empty targets throws a validation error instead of writing a vacuous verify, exit 4
ℹ tests 4
ℹ pass 4
ℹ fail 0
```

`git status --short bin/fgos.mjs` after restoring from the scratch copy:
empty (byte-identical to the committed version) — the revert-and-restore
cycle above never left any stray diff behind.

## Method note

This proof was reconstructed AFTER the real implementation commit
(`6e9c771`), not captured live test-first during implementation — the
actual work order was: write the fix, smoke-test it by hand, then write
the 4 named test cases, all before the Iron Law gate at `approve` time
demanded this evidence. To produce a genuine (not fabricated) red/green
transcript, `bin/fgos.mjs` was temporarily overwritten with `git show
90faf15:bin/fgos.mjs` (the branch's own pre-implementation commit) while
keeping the already-written test file unchanged, the failing run above was
captured, then the real implementation was restored from a saved copy and
the passing run captured. No test or assertion was altered between the two
runs.
