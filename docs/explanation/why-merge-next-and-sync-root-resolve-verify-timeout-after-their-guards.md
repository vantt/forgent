---
authoritative_for: why fgos sync-root and fgos merge next resolve the verify timeout lazily, after their own refusal guards, instead of at CLI flag-parsing time
---

# Why merge-next and sync-root resolve the verify timeout after their guards

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

## Source

`tsk-55f`, a child of `tsk-49i` (the CLI-adapter flag-parsing move). Verify:
`npm test && test -f test/cli/fgos-merge-next-no-config-write.test.mjs &&
grep -qF resolveTimeoutMs src/verbs/merge/sync-root.mjs`.
