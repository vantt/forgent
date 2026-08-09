# tsk-2uo — Iron Law evidence

`classifyIronLaw` result on this item's real committed diff
(`changedFiles(repoRoot, item)` against trunk):

```json
{
  "required": true,
  "matchedFlags": ["audit"],
  "matchedModules": []
}
```

## Failing-test-first proof

`test/docs/launcher-vocabulary-guard.test.mjs`, pre-fix content (`git show
f456046~1:test/docs/launcher-vocabulary-guard.test.mjs`, temporarily
written over the working tree, then restored from a saved copy — working
tree confirmed clean against `HEAD` afterward):

```
✖ NEGATIVE: "orchestrator" does not appear in fgOS-owned prose outside the allowlist (159.568525ms)
  AssertionError [ERR_ASSERTION]: pinned term "orchestrator" leaked back into: docs/history/backlog-execution-reconciliation/RECONCILIATION.md, docs/history/tsk-33w-capacity-dispatch-command-audit-field/iron-law-evidence.md, docs/history/tsk-4eu-executors-key-tier-validation/iron-law-evidence.md, docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md, plans/260808-2210-dispatch-vocabulary-rearrange/next-session-prompt.md
```

Same file, post-fix (`HEAD`):

```
ℹ tests 7
ℹ pass 7
ℹ fail 0
```

Confirms all 5 offenders this item allowlisted are the exact 5 the pre-fix
run flagged — no more, no fewer.

## Full item verify command (already run)

```
node --test test/docs/launcher-vocabulary-guard.test.mjs
```

Result: 7 tests, 0 fail (NEGATIVE + 2 self-checks + 4 POSITIVE tests all
green).

## Note: scope grew by one file during implementation

The plan originally allowlisted only 4 files, deliberately leaving
`plans/260808-2210-dispatch-vocabulary-rearrange/next-session-prompt.md`
(tsk-5td's own live artifact) untouched. Once implemented and the guard
test actually run, that left the item's own `verify` red — the guard test
is a single NEGATIVE assertion over all tracked files, with no way to mark
one expected offender as "known, still red on purpose." Presented to the
user as a real tension (see `fgos decision` log on this item); user chose
to allowlist the 5th file too, reasoning it discusses the pinned term as
its own subject matter — the same shape as the file's existing
`gate-question-quality-and-routing/DISCUSSION.md` allowlist entry, not
prose this item was rewriting.
