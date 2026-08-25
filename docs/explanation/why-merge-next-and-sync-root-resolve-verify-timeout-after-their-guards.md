---
authoritative_for: why fgos sync-root, fgos merge next, and fgos review resolve CLI flags (verify timeout, --wait, --pr) lazily, after their own use-case guards, instead of eagerly in the CLI adapter — the tsk-49i-2 flag-parsing-move regression family
---

# Why merge-next, sync-root, and review resolve their flags after their guards

`tsk-49i-2` moved flag parsing into the CLI adapter, so
`parseMergeClusterOptions` started calling `resolveVerifyTimeoutMs`
(`bin/fgos.mjs`) before the use case ran any guard. That function falls
through to `ensureRunnerConfigForDir`, which **writes** a default runner
config and prints a stderr warning when none exists yet — turning two
previously side-effect-free paths into ones that write on refusal:

- `fgos sync-root <id>` wrote on every refusal path (work-not-found,
  linked-worktree, missing branch, Iron Law) — the pre-change order was
  item guard → `isMainWorktree` → `branchExists` → Iron Law → *then*
  `resolveVerifyTimeoutMs`.
- `fgos merge next` wrote even when nothing was ready — the old code only
  ever reached `resolveVerifyTimeoutMs` by recursing into `approve`/
  `sync-root`, so a `{picked: null}` outcome never touched config before.

This was reproduced empirically on two identical fresh git repos with an
initialized store: the old binary printed only the refusal message; the
new binary printed `no runner config found ... wrote a default` first,
before the refusal. `approve`/`catchup` were never affected — both already
resolved the timeout as their first statement, so the refactor didn't
change their order.

## The fix: make the timeout resolution lazy

Rather than resolving the timeout eagerly at flag-parsing time,
`parseMergeClusterOptions` passes a `resolveTimeoutMs` thunk through
`options`, called at the exact point each old case block used to call it —
top of `approve`/`catchup` (unchanged), and *after* the Iron Law gate in
`sync-root`. This means `merge next` only ever resolves (and potentially
writes) a runner config once it actually reaches `approve` or `sync-root`
— never on a refusal or an empty-pool outcome.

The general lesson: a side-effecting resolver (writes a config file) being
called for its *return value* at a point earlier than the original code's
call site is a real regression even when the returned value itself is
correct — the write is the bug, not the value.

## The sibling case: `--wait` flags flip the pool-empty exit shape

The same eager-parsing regression had a second half that the timeout fix
above missed: `parseMergeClusterOptions` also calls `parseWaitFlags`
eagerly while building the options object, so `merge next` validates
*both* `approve`'s and `sync-root`'s wait flags before `mergeReadiness`
decides anything. On `main`, those flags were only ever parsed inside the
recursive `runVerb('approve', ...)` call, which never ran on the
`ready.length === 0` early return.

Reproduced the same way as the timeout case — two identical fresh repos, an
initialized store, nothing ready to merge: `main` returns
`{picked: null, reason: 'nothing ready to merge'}` at exit 0; the eager
version prints `approve --wait must be a positive number of milliseconds
(got "0")` at exit 4. This is a bigger problem than a cosmetic message
change — it flips the *shape* an unattended merge-loop driver parses.
`/fgOS:merge-loop`'s own pool-empty stop rule keys on `{picked: null}`; a
driver carrying a stale or malformed `--wait` value gets a hard refusal
instead of the clean stop it expects. The same eager parse also moves
`sync-root`'s `--wait` validation ahead of its item-not-found/
`isMainWorktree`/branch/Iron-Law guards (message-only difference there,
since `sync-root` already exits 4 on any of those guards too).

Fix direction is the same treatment already applied to the timeout case:
`parseMergeClusterOptions` hands over `resolveWaitFlags` as a thunk;
`approve` calls it at the top (where its old case block parsed wait), and
`sync-root` calls it after the Iron Law gate — so `merge next`'s early
returns never parse `--wait` at all.

## A third instance: `review --pr` outranks the item-not-found guard

`tsk-49i-2` also moved `review`'s `--pr` parse into the CLI adapter
(`bin/fgos.mjs case review`), where it now runs before `reviewUseCase`'s
own found/status preconditions. On `main`, the equivalent
`optionalField(flags.pr, ...)` call lived *inside* the `if (flags.github)`
branch, after the work-not-found and awaiting-approval guards.

Reproduced on two identical fresh repos: `main` answers `review: work
"nosuch" not found.`; the branch answers `review --github --pr requires a
PR number: --pr <n>`. The exit code is 4 either way, so nothing keying off
exit codes changes — the cost is that a caller with both a bad id and a
bare `--pr` is now told about the flag instead of the item that does not
exist. `approve` already keeps its own `--pr` check inside the use case
(the same `requireField`-equivalent shape); `review` should match it.

Fix direction, same family as the two cases above: the adapter forwards
`flags.pr` raw; `reviewUseCase` performs the `optionalField`-equivalent
check at the same point the old case block did — after the item-found and
status guards, not before them.

## The pattern across all three

`tsk-49i-2` moved CLI flag parsing (verify timeout, `--wait`, `--pr`) out
of each verb's own case block and into the shared adapter, as a genuine
DRY win — but doing that eagerly, at the point the adapter builds its
`options` object, silently promoted every one of those flags' own
validation to run *before* the use case's own preconditions instead of
after them, for every verb whose old code happened to parse that flag
partway through its own guard sequence rather than at the very top. The
fix is not "don't share the parsing" — it's "share the parsing, but keep
it lazy": pass a thunk, and call it at the exact point in the use case's
own guard sequence the original inline code used to.

## Source

`tsk-55f`, `tsk-2fx`, and `tsk-h6r`, all children of `tsk-49i` (the
CLI-adapter flag-parsing move) — `tsk-2fx` and `tsk-h6r` were both found by
a second branch review of `main...fgw/tsk-49i`, after `tsk-55f`'s own fix
had already landed for the timeout half alone. Verify (`tsk-55f`): `npm
test && test -f test/cli/fgos-merge-next-no-config-write.test.mjs && grep
-qF resolveTimeoutMs src/verbs/merge/sync-root.mjs`. Verify (`tsk-2fx`):
`npm test && test -f test/cli/fgos-merge-next-idle-turn.test.mjs && grep
-qF resolveWaitFlags src/verbs/merge/approve.mjs`. Verify (`tsk-h6r`): `npm
test && test -f test/cli/fgos-review-pr-precedence.test.mjs && ! grep -qF
"optionalField(flags.pr" bin/fgos.mjs`.
