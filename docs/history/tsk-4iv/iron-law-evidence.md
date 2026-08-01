# tsk-4iv — Iron Law evidence (root item)

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run against this root
item's real changed-file set (`changedFiles`, `src/runner/merge.mjs`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

Same gate trigger as both children — `bin/fgos.mjs`, fgOS's own CLI entry
point. This root item introduces no `bin/fgos.mjs` changes of its own; the
diff is entirely the two children's already-merged, already-proven
commits (`aheadCount: 13`, `fgos check tsk-4iv`). Real failing-test-first
proof for every actual line changed in `bin/fgos.mjs` already exists,
never re-fabricated here:

- `docs/history/tsk-4iv-1/iron-law-evidence.md` — the `case 'uninstall'`
  wiring-reversal handler (confirmation gate, git-hooks unwind, shell-rc
  report).
- `docs/history/tsk-4iv-2/iron-law-evidence.md` — the `--remove-package`
  extension to that same handler.

Verify command (root item's own, `npm test`): full suite, 2085 pass / 5
skipped / 0 fail, run directly in this worktree before `fgos return
tsk-4iv` (see that command's own real output, `fgos check tsk-4iv`).
