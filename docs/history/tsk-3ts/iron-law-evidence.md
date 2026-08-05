# tsk-3ts — Iron Law evidence

`classifyIronLaw` matched `bin/fgos.mjs` (`matchedModules: ["bin/fgos.mjs"]`,
`matchedFlags: []`, `required: true`) against this item's full committed
diff.

## Verify command

```
node --test --test-name-pattern="compound --doc-path" test/cli/fgos.test.mjs
```

The three new tests this command targets are the D3 boundary cases: file
absent, present-but-untracked, present-but-staged-only. Each proves the
same refusal `bin/fgos.mjs`'s `compound` case now enforces.

## Failing-before

Captured by temporarily swapping in `bin/fgos.mjs` from the parent commit
(`d51f28a`, before the D3 refusal was added) and rerunning the exact
command above against the new tests:

```
✖ compound --doc-path is rejected as validation, exit 4, when the file does not exist at all (338.704741ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  0 !== 4

      at TestContext.<anonymous> (test/cli/fgos.test.mjs:8758:10)
      ...

✖ compound --doc-path is rejected as validation, exit 4, when the file exists but is untracked (323.089694ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  0 !== 4

      at TestContext.<anonymous> (test/cli/fgos.test.mjs:8774:10)
      ...

✖ compound --doc-path is rejected as validation, exit 4, when the file exists and is staged but not committed (323.669966ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  0 !== 4

      at TestContext.<anonymous> (test/cli/fgos.test.mjs:8791:10)
      ...

ℹ tests 3
ℹ pass 0
ℹ fail 3
```

All three fail with `0 !== 4` — the old `compound` returned success (exit
0) for a `--doc-path` that was absent, untracked, or staged-only. This is
the exact class of gap that let 34 real retrospective documents go
missing while their tags still claimed they existed.

## Passing-after

`bin/fgos.mjs` restored to the version actually committed in this item
(`68c386f`), same command rerun:

```
✔ compound --doc-path is rejected as validation, exit 4, when the file does not exist at all (342.460442ms)
✔ compound --doc-path is rejected as validation, exit 4, when the file exists but is untracked (357.980245ms)
✔ compound --doc-path is rejected as validation, exit 4, when the file exists and is staged but not committed (324.420059ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

`bin/fgos.mjs` was verified byte-identical to the committed version
(`diff`, clean) immediately after restoring it, before this transcript was
captured — the passing run above is against the real committed change,
not a reconstruction.
