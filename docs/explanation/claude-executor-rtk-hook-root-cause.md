---
authoritative_for: tsk-1dsr root-causing tsk-1jt's RED finding to a machine-local rtk PreToolUse hook
---

# `tsk-1dsr`: `tsk-1jt`'s RED finding was environment-local, not a `claude`/config defect

`tsk-1jt`'s RED D4 proof-test result (the named `claude` executor
couldn't complete a git commit under headless dispatch) traced to a
personal `PreToolUse` hook on the testing machine — an `rtk` proxy that
rewrites `git ...` commands to `rtk git ...` before the
`--allowedTools` allowlist match runs. Not a syntax defect in the
allowlist and not a limit of `claude`'s own comprehension of the worker
contract.

**Fix:** `runner.executors.claude`/`runner.executor` now name both the
bare and `rtk`-wrapped command forms:

```
"Bash(git add:*),Bash(git commit:*),Bash(rtk git add:*),Bash(rtk git commit:*)"
```

still scoped to `add`/`commit` only. Retested live with this exact
config: `claude` completed the full contract — wrote the exact requested
content, honored the footprint, committed with the item id in the
message, never called `fgos`, reported through the exact `[DONE]` token
— confirmed independently via the throwaway worktree's real `git log`/
`git show --stat`, not from the self-report alone.

See `docs/explanation/claude-executor-d4-proof-test-red.md` for the
original RED finding and `docs/reference/claude-named-executor.md`/
`docs/reference/coding-worker-contract-shape.md` for the resulting live
config and full cross-provider proof history.

## The lesson

A RED result from a live proof-test dispatch is not automatically a
defect in the thing being tested — it can be an artifact of the specific
machine running the test. Before concluding a provider or contract is
broken, check for machine-local interference (personal shell hooks,
proxies, aliases) sitting between the dispatch and the real command.
