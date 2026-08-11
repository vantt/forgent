Iron Law classification for tsk-1ne's real committed diff (`src/state/store.mjs`, matched module):

```
$ node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork(process.argv[1] + '/.fgos').work[process.argv[2]];
const filesChanged = changedFiles(process.argv[1], item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
" '/home/vantt/projects/forgentX' 'tsk-1ne'

{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/state/store.mjs"]
}
```

This is a self-referential proof: tsk-1ne fixes `fgos-coding-implement`'s
Iron Law check step (step 4) never explicitly saying it must run against
the real committed diff, not a pre-commit one — which is exactly the
mistake this session made while implementing tsk-1ne itself. The first
`classifyIronLaw` call (run before `git add`/`git commit`, per the
now-known-buggy ordering) returned `{"required":false}` because
`changedFiles()` saw only the already-committed `CONTEXT.md`/`plan.md`
docs, not the still-uncommitted `store.mjs`/`work.mjs` diff — the exact
false negative `tsk-2l0` (picked up immediately after this one) reports.
Re-run after `git commit` correctly returned `required: true`.

## Failing-test-first proof

Verify command: `node --test test/state/store.test.mjs`

**Before** (pre-fix `src/state/work.mjs`/`src/state/store.mjs`, commit
`f78a637`, checked out over the working tree and reverted immediately
after capturing this transcript — never itself committed): 44/48 pass,
4 fail — the four new proof-case tests this same commit adds:

```
✖ editWork succeeds patching an unrelated field on an item whose stage predates the current enum (grandfathered, not re-validated) (0.396083ms)
  Error [WorkValidationError]: work.stage must be one of ["clarify","decompose","executing"] when present, got: "compound-learn"
      at validateWorkShape (src/state/work.mjs:386:13)
      at validateWork (src/state/work.mjs:723:3)
      at src/state/store.mjs:290:5
      at editWork (src/state/store.mjs:260:17)

✖ editWork succeeds patching an unrelated field on an item whose id exceeds the current 30-char length cap (grandfathered) (0.264ms)
  Error [WorkValidationError]: work.id must be at most 30 characters (got 40): "a-legacy-id-far-past-the-thirty-char-cap" — pick a short descriptive id, not a slugified title.
      at validateWorkShape (src/state/work.mjs:238:11)
      at validateWork (src/state/work.mjs:723:3)
      at src/state/store.mjs:290:5
      at editWork (src/state/store.mjs:260:17)

✖ editWork succeeds patching an unrelated field on an item whose stored acceptance clause has non-traceable evidence (grandfathered) (0.260377ms)
  Error [WorkValidationError]: work.acceptance clause with both "text" and "evidence" must cite a real, existing path in "evidence" — none found/resolved in: "no/such/path.mjs"
      at checkAcceptanceEvidenceTraceable (src/state/work.mjs:781:13)
      at src/state/store.mjs:299:5
      at editWork (src/state/store.mjs:260:17)

✖ editWork still fully validates a field the patch DOES touch, even on an item with other legacy-invalid fields (0.657167ms)
  AssertionError [ERR_ASSERTION]: The input did not match the regular expression /depends on unknown id/. Input:
  'WorkValidationError: work.stage must be one of ["clarify","decompose","executing"] when present, got: "compound-learn"'

ℹ tests 48
ℹ pass 44
ℹ fail 4
```

**After** (post-fix, this commit's actual `src/state/work.mjs`/
`src/state/store.mjs`): 48/48 pass —

```
✔ editWork succeeds patching an unrelated field on an item whose stage predates the current enum (grandfathered, not re-validated) (0.419164ms)
✔ editWork succeeds patching an unrelated field on an item whose id exceeds the current 30-char length cap (grandfathered) (0.295558ms)
✔ editWork succeeds patching an unrelated field on an item whose stored acceptance clause has non-traceable evidence (grandfathered) (0.290241ms)
✔ editWork still fully validates a field the patch DOES touch, even on an item with other legacy-invalid fields (0.237118ms)
✔ editWork still refuses a patch containing "id"/"status"/"stage"/"domain" — the fix never widens EDITABLE_FIELDS (0.437346ms)
ℹ tests 48
ℹ pass 48
ℹ fail 0
```
