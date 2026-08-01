# tsk-2vd — Iron Law evidence

Per `docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md` D2/D3: this
item's own diff touches `src/runner/worktree.mjs` (matches `MODULE_RULES`'s
`{ kind: 'prefix', value: 'src/runner/' }`) and `bin/fgos.mjs` (matches
`{ kind: 'equals', value: 'bin/fgos.mjs' }`), so `classifyIronLaw` returns
`required: true` and this evidence file is persisted before return.

## classifyIronLaw result

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/dispatch.mjs"]
}
```

`matchedModules` lists `src/runner/dispatch.mjs` because `changedFiles`
diffs `main...fgw/tsk-2vd`, and `fgw/tsk-2vd` forked from inside
`fgw/tsk-32n`'s own branch (which carries `tsk-32n`'s already-evidenced
`dispatch.mjs` change as an ancestor commit, not part of this item's own
diff — that item has its own separate `docs/history/tsk-32n/iron-law-
evidence.md`). This item's OWN uncommitted changes
(`worktree.mjs`/`bin/fgos.mjs`) independently match `MODULE_RULES` too
(confirmed by direct `git status`/`git diff --stat` inspection this
session) — `required: true` holds regardless of the inherited-lineage
noise in `matchedModules`.

**Note for whoever merges this branch:** `main` advanced past this
branch's fork point during this session (another session's work landed,
`a34c8aa "merge: sync main with fgw/tsk-64p's advanced tip"` — confirmed
via `git log --oneline main` and a `git merge-base` check this session).
`fgw/tsk-2vd` and `fgw/tsk-32n` now share a divergent history from current
`main` ("multiple merge bases" warning observed from `git diff
main...HEAD`) — not a defect in this item's own work, but worth flagging
before either branch is merged, since the merge will need to reconcile
that divergence.

## Test commands

```
node --test test/runner/worktree.test.mjs
node --test --test-name-pattern="declares a real npm dependency" test/cli/fgos.test.mjs
```

(the exact new/changed test coverage this item adds — `npm test`'s
whole-suite run is also green, see below, but these are the same commands
run before and after the implementation.)

## Before (red) — implementation reverted via a scoped `git stash`, test files left in place

`src/runner/worktree.mjs` and `bin/fgos.mjs` were stashed (`git stash push
-u -- src/runner/worktree.mjs bin/fgos.mjs`), leaving the new/modified
tests in the working tree pointed at the pre-implementation code. Real
command output:

`test/runner/worktree.test.mjs` failed to even load — the test file
imports `provisionDependencies` from `worktree.mjs`, which did not exist
yet:

```
SyntaxError: The requested module '../../src/runner/worktree.mjs' does not
provide an export named 'provisionDependencies'
✖ test/runner/worktree.test.mjs (35.784775ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

`test/cli/fgos.test.mjs`'s new return test — real assertion failure,
reproducing the EXACT class of failure that blocked `tsk-32n`'s own
`fgos return` (a `Cannot find module` error inside the disposable
`/tmp/fgos-return-*` verify worktree):

```
✖ return on a branch-source take whose branch declares a real npm dependency: ...
  AssertionError [ERR_ASSERTION]: The input did not match /awaiting-approval/.
  "to": "blocked", "passed": false, "exitStatus": 1,
  "output": "node:internal/modules/cjs/loader:1520\n  throw err;\n  ^\n\n
    Error: Cannot find module 'fgos-test-localdep'\nRequire stack:\n-
    /tmp/fgos-return-dapDxj/[eval]\n ... code: 'MODULE_NOT_FOUND' ..."
```

## After (green) — implementation restored via `git stash apply` (same stash, dropped only after confirming green)

```
node --test test/runner/worktree.test.mjs
ℹ tests 32
ℹ pass 32
ℹ fail 0

node --test --test-name-pattern="declares a real npm dependency" test/cli/fgos.test.mjs
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

Full `npm test` (state + cli + runner + e2e suite) also green: 2048/2053
passed, 5 skipped, 0 fail (unaffected — same 5 pre-existing skips as the
pre-implementation baseline).

## detect_changes() scope check (AGENTS.md gate)

`fgos tool query --capability impact-analysis --status present` → one
provider, `gitnexus`, `status: "present"` — full posture. Ran
`impact({target: "createWorktree", direction: "upstream"})` before editing
(this session, before any code change): risk **CRITICAL** — 9 impacted
symbols, 7 affected processes (`claimAndDispatch`, `startupReap`,
`dispatchClaimedItem`, `claimItem`, `runWatch`, `withMergeEphemeralWorktree`,
`createClaimWorktree`), matching D1's own scoping rationale (`createWorktree`
is the choke point for every leaf/root claim). Reported to the user before
proceeding, per AGENTS.md's MUST-warn rule. The actual change is additive
only — one new call to `provisionDependencies` appended right before
`createWorktree`'s existing `return`, no existing branch of logic altered —
and the full suite (2048/2053) confirms no regression across any of those
affected processes.
