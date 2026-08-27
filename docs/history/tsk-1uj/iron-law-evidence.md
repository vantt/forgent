# Iron Law evidence — tsk-1uj

## Classifier result (against commit `f928d60d`, the item's real committed diff)

```json
{"required":true,"matchedFlags":["migration"],"matchedModules":[]}
```

Command run (`docs/history/<id>/iron-law-evidence.md` mechanics, `fgos-coding-implement`
references/verify-commit-and-iron-law.md):

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork(process.argv[2]).work[process.argv[1]];
const filesChanged = changedFiles(process.argv[3], item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
" "tsk-1uj" "$root/.fgos" "$root"
```

## Why `required: true` fires here

`matchedModules` is **empty** — this diff touches no runner/dispatch/store
machinery. The trigger is `matchedFlags: ["migration"]`, a keyword hit
against the item's own submitted *description text*, which mentions
"migration apply thật" as context for why this item (enabling
`docRegistry.enforce`) is a prerequisite for the separate `tsk-5mh`
migration item — a topic mention, not a description of an actual risky
change in *this* diff. Per the documented, deliberate design in
`src/intake/risk-keywords.mjs` ("a title/description that merely mentions
a hard-gate word as a topic still hard-gates — accepted") and the
established precedent for this exact shape
(`docs/how-to/fix-fgos-write-rejected-merge-block.md`'s `tsk-28o` example:
"The fix is not to silence or dispute the classifier — it's reading the
real diff correctly... scoped narrower than the full inherited diff"),
this evidence covers what this item's own committed diff is actually
responsible for, not the unrelated migration work `matchedFlags` merely
alludes to.

## The real, committed diff (`f928d60d`)

```diff
diff --git a/test/cli/knowledge-attest-gate.test.mjs b/test/cli/knowledge-attest-gate.test.mjs
index ea5ac666..698e455d 100644
--- a/test/cli/knowledge-attest-gate.test.mjs
+++ b/test/cli/knowledge-attest-gate.test.mjs
@@ -102,7 +102,7 @@ test('knowledge attest gate - 6 key conditions and regression', async () => {
   assert.equal(view.docs['t1:concept'].docLifecycle, 'reserved');
 });

-test('knowledge attest - with docRegistry.enforce off (the real default), an unregistered path is skipped, not refused or silently accepted', async () => {
+test('knowledge attest - with docRegistry.enforce off (fgos setup\'s own fresh-install default), an unregistered path is skipped, not refused or silently accepted', async () => {
   // enforceRegistry defaults to false here -- the actual shipped default,
   // kept that way so retrospective items are never deadlocked before
   // bootstrap/migration finishes (phase-06-attest-gate.md's own "Risks &
```

1 file changed, 1 insertion(+), 1 deletion(-) — the test's own name-string
literal only. No assertion, no fixture, no production code changed.

## Proof: identical behavior before and after, real transcript both ways

Since the only change is a string literal passed to `test(...)`, there is
no behavior for a "failing-before/passing-after" TDD proof to capture —
the honest proof for this shape is that the exact same test, run at the
parent commit (old title) and at this commit (new title), passes
identically both times, with the same 2 tests in the same file.

**Before (`f928d60d^` = `0d7f66e4`, old title), real output:**

```
✔ knowledge attest gate - 6 key conditions and regression (850.378603ms)
✔ knowledge attest - with docRegistry.enforce off (the real default), an unregistered path is skipped, not refused or silently accepted (393.340649ms)
ℹ tests 2
ℹ suites 0
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

**After (`f928d60d`, HEAD, new title), real output:**

```
✔ knowledge attest gate - 6 key conditions and regression (869.515996ms)
✔ knowledge attest - with docRegistry.enforce off (fgos setup's own fresh-install default), an unregistered path is skipped, not refused or silently accepted (439.862029ms)
ℹ tests 2
ℹ suites 0
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Produced by checking out the parent commit's copy of the one changed file
in place, running it, then restoring the working tree to `HEAD` (verified
clean via `git status --short` immediately after):

```bash
git checkout f928d60d^ -- test/cli/knowledge-attest-gate.test.mjs
node --test test/cli/knowledge-attest-gate.test.mjs
git checkout HEAD -- test/cli/knowledge-attest-gate.test.mjs
```

**Full-suite proof (the worker's own Verify step, `f928d60d`'s
`verifiedSha`):** `npm test` — 4238 tests, 4233 pass, 0 fail, 5 skipped.
