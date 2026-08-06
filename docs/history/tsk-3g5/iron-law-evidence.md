# Iron Law evidence — tsk-3g5

## classifyIronLaw result

```json
{"required": true, "matchedFlags": [], "matchedModules": ["bin/fgos.mjs"]}
```

Genuine module match: `bin/fgos.mjs`'s `STORE_MISSING_WARNING_VERBS` set
changed.

Full changed-file set: `bin/fgos.mjs`, `test/cli/fgos.test.mjs` —
implementation commit `2a1d129`, parent commit `46fa528`.

## Test command

```bash
node --test --test-name-pattern="gate-bypass from a|doc-sources from a|lock-status from a" test/cli/fgos.test.mjs
```

(The full suite was already run once in-worktree, green: 548/548.)

## Failing before

Real execution: a temporary git worktree checked out at `46fa528` (the
commit immediately before `2a1d129`), with only the NEW test content
(`git show 2a1d129:test/cli/fgos.test.mjs`) copied in against the OLD
`bin/fgos.mjs` (`gate-bypass`/`doc-sources`/`lock-status` not yet in
`STORE_MISSING_WARNING_VERBS`):

```
$ node --test --test-name-pattern="gate-bypass from a|doc-sources from a|lock-status from a" test/cli/fgos.test.mjs
✖ gate-bypass from a .fgos/-less linked worktree with no --dir warns on stderr and reports the empty-store default, never the real main-checkout level
✖ doc-sources from a .fgos/-less linked worktree with no --dir warns on stderr instead of a silent count: 0
✖ lock-status from a .fgos/-less linked worktree with no --dir warns on stderr instead of a silent "free"
ℹ tests 3
ℹ pass 0
ℹ fail 3
```

## Passing after

Same scratch worktree, `bin/fgos.mjs` replaced with the `2a1d129` version:

```
$ node --test --test-name-pattern="gate-bypass from a|doc-sources from a|lock-status from a" test/cli/fgos.test.mjs
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

The scratch worktree used to capture this was created and removed for
this evidence run only (`git worktree add`/`remove --force` against the
already-committed `46fa528`/`2a1d129` commits) — no working-tree state
was altered.
