# Iron Law evidence: tsk-558

Per `tsk-5t3`'s contract (D2/D3): `classifyIronLaw` on this item's final
diff (post-commit, `4febbc6`) returned `required: true` —
`matchedModules: ["bin/fgos.mjs"]`. This item's own diff never touches
`bin/fgos.mjs` — the match comes from `bin/fgos.mjs` already being part
of this branch's history via the earlier, already-merged sibling item
`tsk-4jf` (this branch forks from `fgw/tsk-1q1`, which carries that
merge). Same situation `tsk-slq`'s own evidence doc already documented for
a different reason: the gate is satisfied by the failing-test-first proof
below regardless of which flag/module triggered `required: true`.

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

## Failing-test-first proof

Test command: `node --test --test-name-pattern="tsk-558" test/state/cleanup-harness.test.mjs`
— the two new tests proving this item's core claim (D1/D2): a
claim-lifecycle `predicted`/`actual` field must never satisfy D8's content
check (the false-pass this item closes), and a real `docType`/`docPath`
doc must satisfy it even with no `predicted`/`actual` at all (the
false-fail this item closes).

**Before the fix** (`src/state/cleanup-harness.mjs` reverted to `3320967`,
the commit immediately before this item's implementation): both new tests
fail — the old code accepts `predicted`/`actual` alone (false pass) and
rejects a real doc with no `predicted`/`actual` (false fail), exactly the
two real-data bugs this item's own audit found (3 false passes, 2 false
fails among 55 live `cleanup`-status items). Real transcript:

```
✖ checkRetrospectiveContent: NOT ok when the item has a claim-lifecycle predicted/actual outcome but no real doc (tsk-558 false-pass regression) (17.755857ms)
  AssertionError [ERR_ASSERTION]: predicted/actual alone must never satisfy D8 — that was the false-pass bug
  true !== false
ℹ tests (this test alone) fail 1

✖ checkRetrospectiveContent: ok when docType/docPath are recorded AND the file actually exists on disk, with no predicted/actual at all (tsk-558 false-fail regression) (13.393715ms)
  AssertionError [ERR_ASSERTION]: a real doc must pass even with no predicted/actual field — that was the false-fail bug
  false !== true
```

**After the fix** — `checkRetrospectiveContent` reads `outcome.docType`/
`outcome.docPath` (confirming the file exists on disk via `fs.existsSync`)
instead of `outcome.actual`/`outcome.predicted`; `hasDecision` remains the
valid alternate pass. Same tests, real transcript:

```
✔ checkRetrospectiveContent: NOT ok when the item has a claim-lifecycle predicted/actual outcome but no real doc (tsk-558 false-pass regression) (15.628823ms)
✔ checkRetrospectiveContent: ok when docType/docPath are recorded AND the file actually exists on disk, with no predicted/actual at all (tsk-558 false-fail regression) (13.163976ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

Full suite after the fix (the item's own recorded `verify` command run in
full — `node --test test/state/cleanup-harness.test.mjs`): **20 tests, 20
pass, 0 fail, 0 cancelled, 0 skipped**. Full repo `npm test` (state + cli
+ runner + e2e): **2551 tests, 2546 pass, 0 fail, 5 skipped
(pre-existing, unrelated)**.
