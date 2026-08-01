# tsk-4iv-2 — Iron Law evidence

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run against this item's real
changed-file set (`changedFiles`, `src/runner/merge.mjs`) after the
implementation commit:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

Changed files: `bin/fgos.mjs`, `docs/history/fgos-uninstall/CONTEXT.md`,
`docs/history/fgos-uninstall/plan.md`,
`docs/history/tsk-4iv-1/iron-law-evidence.md`,
`docs/how-to/uninstall-fgos-wiring.md`, `src/cli/command-registry.mjs`,
`src/setup/git-hooks.mjs`, `test/setup/self-uninstall-spike.test.mjs`,
`test/setup/uninstall-wiring.test.mjs`. Same gate trigger as `tsk-4iv-1`:
`bin/fgos.mjs`, fgOS's own CLI entry point, self-modifying by definition.

Verify command: `node --test test/setup/self-uninstall-spike.test.mjs`

## Failing-test-first proof

Same reconstruction method as `tsk-4iv-1`'s evidence file: a real detached
`git worktree add` at `e246240442ecf6a2bb94e6075ab5c7418df335f0` (the
commit immediately before this item's implementation), copying only the
new test file onto that pre-implementation tree and running it there.

**Before (pre-implementation tree + new test only) — real failure:**

```
✖ SPIKE: fgos uninstall --yes --remove-package removes a real npm -g installed package on this platform (891.873822ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1

✖ failing tests:

test at test/setup/self-uninstall-spike.test.mjs:28:1
✖ SPIKE: fgos uninstall --yes --remove-package removes a real npm -g installed package on this platform (891.873822ms)
  TypeError: Cannot read properties of undefined (reading 'attempted')
      at TestContext.<anonymous> (file:///tmp/tmp.i56VDjlvkF/test/setup/self-uninstall-spike.test.mjs:74:38)
```

`--remove-package` didn't exist yet, so `data.packageRemoval` was
`undefined` — the test correctly failed against the real pre-implementation
code, not a mock.

**After (implementation commit `5e348ee`) — real pass, with the spike's
actual finding:**

```
SPIKE RESULT: packageRemoval.outcome = removed
✔ SPIKE: fgos uninstall --yes --remove-package removes a real npm -g installed package on this platform (765.95025ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```
