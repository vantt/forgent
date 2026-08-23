# Iron Law evidence: tsk-2q8

Per `tsk-5t3`'s contract (D2/D3): `classifyIronLaw` on this item's final
diff (post-commit, `d59c0aa2`) returned `required: true` —
`matchedModules: ["bin/fgos.mjs"]` (self-modifying: this item edits the
`catchup` verb's own eligibility gate), `matchedFlags: ["data loss", "audit"]`.

```json
{"required":true,"matchedFlags":["data loss","audit"],"matchedModules":["bin/fgos.mjs"]}
```

## Failing-test-first proof

Test command: `node --test --test-name-pattern="tsk-2q8" test/cli/fgos-post-merge.test.mjs`
— the two new tests proving this item's core claim: `fgos catchup` must
recover a cleanup-origin `blocked` item whose recorded commit no longer
resolves (via a live re-check of `checkMergeStillResolves`, not reason-text
matching), while still rejecting a cleanup-origin block caused by a
DIFFERENT check (missing retrospective content) that merging cannot fix.

**Before the fix** (`bin/fgos.mjs` reverted to `HEAD~1`, the commit
immediately before this item's implementation, with the new tests kept as
committed): the positive test fails — `fgos catchup` still rejects the
cleanup-origin block with the old generic error, exit code 4:

```
✖ catchup recovers a cleanup-origin blocked item whose recorded commit no longer resolves, by re-merging and re-verifying (tsk-2q8) (274.208671ms)
  AssertionError [ERR_ASSERTION]: fgos: no runner config found — detected "claude" on PATH; wrote a default (executor: claude) at /tmp/fgos-cli-G859Ta/.fgos/config.json#runner; edit .fgos/config.json by hand to change.
  fgos: catchup: work "cleanup-origin-recover" is blocked for reason "item never actually entered cleanup — no retrospective->cleanup event found in the log; commit 966b3ce802086e8ba94324949ba85c04b0bd2a23 is no longer reachable from HEAD — the merge may have been force-pushed away or history rewritten. HEAD still exists — if this is unexpected, run "git reflog show HEAD" to check for a manual reset that discarded this commit (tsk-3ft)" — catchup only resolves a merge-related park (merge-conflict/verify-fail-post-merge/verify-timeout-post-merge/integration-drift/merge-failed-unclassified); use take/return for a manual rework instead.

  4 !== 0
```

(The negative test already passed before the fix, since it asserts the
OLD, still-correct rejection behavior for a non-merge cleanup-origin park —
consistent with this item narrowing the gate, not loosening it.)

**After the fix** (`bin/fgos.mjs` restored to its committed state): both
tests pass —

```
✔ catchup recovers a cleanup-origin blocked item whose recorded commit no longer resolves, by re-merging and re-verifying (tsk-2q8) (322.756008ms)
✔ catchup still rejects a cleanup-origin blocked item whose recorded commit DOES resolve (missing retrospective content only, not a merge-ancestry gap) (tsk-2q8) (274.384814ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

Full suite (`npm test`) after the fix: 3236 pass, 0 fail, 5 skipped (up
from 3234/0/5 before this item — the two new tests, no regressions).
