# Iron Law evidence — tsk-1gj

`classifyIronLaw` on this item's final diff returns:

```json
{
  "required": true,
  "matchedFlags": ["auth", "delete", "audit"],
  "matchedModules": []
}
```

`required: true` here comes from the DESCRIPTION-keyword side of
`classifyIronLaw` (this item's own description quotes "auth"/"delete"/
"audit" as the false-positive examples that motivated the fix) — a fitting
irony, not a bug: the description genuinely discusses those risk keywords,
so flagging it is the classifier's own keyword-flag axis working as
designed. Unrelated to `matchedModules` (empty — `src/state/gate-bypass.mjs`
is not itself on `MODULE_RULES`'s self-modifying-capable list).

## Failing-test-first proof

Four new tests, pinning the exact real false positives the scan report
found live in the backlog (finding 11):

- `canAutoApprove: "auth" inside "authoring" is not a hard-gate hit (tsk-1gj)`
- `canAutoApprove: "audit" inside "audited" is not a hard-gate hit (tsk-1gj)`
- `canAutoApproveValidate: "auth" inside "authoring" is not a hard-gate hit (tsk-1gj)`
- `canAutoApproveValidate: "audit" inside "audited" is not a hard-gate hit (tsk-1gj)`

### RED — run against the pre-fix code

Pre-fix `src/state/gate-bypass.mjs` restored from `git show 7689058^:<path>`
(the parent of this item's own implementation commit), with the new tests
from the post-fix `test/state/gate-bypass.test.mjs` layered on top:

```
$ node --test --test-name-pattern="tsk-1gj" test/state/gate-bypass.test.mjs

✖ canAutoApprove: "auth" inside "authoring" is not a hard-gate hit (tsk-1gj)
  AssertionError: false !== true
✖ canAutoApprove: "audit" inside "audited" is not a hard-gate hit (tsk-1gj)
  AssertionError: false !== true
✖ canAutoApproveValidate: "auth" inside "authoring" is not a hard-gate hit (tsk-1gj)
  AssertionError: false !== true
✖ canAutoApproveValidate: "audit" inside "audited" is not a hard-gate hit (tsk-1gj)
  AssertionError: false !== true

ℹ tests 4
ℹ pass 0
ℹ fail 4
```

All four fail for the real reason: the pre-fix substring match sees "auth"
inside "authoring" and "audit" inside "audited", hard-gating both — exactly
the false positives the scan report evidenced live (`tsk-12t`, `tsk-5ma`).

### GREEN — run against the fixed code

Restored `src/state/gate-bypass.mjs` to its post-fix state (verified
`git diff --stat` against the working tree was empty first, confirming
byte-identical recovery):

```
$ node --test --test-name-pattern="tsk-1gj" test/state/gate-bypass.test.mjs

✔ canAutoApprove: "auth" inside "authoring" is not a hard-gate hit (tsk-1gj)
✔ canAutoApprove: "audit" inside "audited" is not a hard-gate hit (tsk-1gj)
✔ canAutoApproveValidate: "auth" inside "authoring" is not a hard-gate hit (tsk-1gj)
✔ canAutoApproveValidate: "audit" inside "audited" is not a hard-gate hit (tsk-1gj)

ℹ tests 4
ℹ pass 4
ℹ fail 0
```

### Full suite, post-fix

```
$ node --test test/state/gate-bypass.test.mjs
ℹ tests 37
ℹ pass 37
ℹ fail 0

$ npm test
ℹ tests 2741
ℹ pass 2736
ℹ fail 0
ℹ skipped 5
```

## Verification source

- `src/evolve/iron-law.mjs`'s `matchedFlags` keyword-scan (description
  text side, not the module-list side) — confirms `required: true` traces
  to real risk-keyword mentions in this item's own description, not a
  misfire.
- The RED/GREEN transcripts above — both real command runs against real
  file contents swapped in/out on disk (`git show 7689058^:<path>` to
  `/tmp`, then restored from the working tree's own already-committed
  post-fix state), not paraphrased or fabricated.
- `docs/history/tsk-1gj-gate-bypass-word-boundary-match/CONTEXT.md` D0-D2
  and `plan.md`'s risk map — the decisions and proof points this evidence
  satisfies.
