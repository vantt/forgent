---
authoritative_for: tsk-1jt claude executor D4 proof-test RED finding (config-blocked, not contract-blocked)
---

# `tsk-1jt`: the named `claude` executor's first D4 proof-test came back RED

`tsk-1jt` was the D4 cross-provider proof test (does the dispatched
executor follow `coding-worker-contract.md`?) for `runner.executors.claude`
(`tsk-1cn`, see `docs/reference/claude-named-executor.md`). The result was
RED, config-blocked rather than contract-blocked: the worker read the
layered skill-pointer chain correctly and executed the file-write step
exactly as directed, but could not complete Layer 2's commit step — the
invocation's own `--permission-mode acceptEdits --allowedTools "Bash(git
add:*),Bash(git commit:*)"` did not grant Bash-tool execution in the
headless, non-interactive session, so every git command was denied
(confirmed both by the worker's own report and independently by the
throwaway worktree's real `git log`/`git status` — no commit landed). It
also didn't use the contract's `[DONE]`/`[BLOCKED]` vocabulary when
blocked — it asked a live question a headless dispatch has no one to
answer, a second, independent deviation.

**Neither finding says `claude` cannot follow the worker contract** — both
say the invocation shape at the time couldn't complete it end-to-end. The
follow-up (`tsk-1dsr`) traced the root cause to a machine-local `rtk`
proxy hook and fixed the allowlist — see
`docs/reference/coding-worker-contract-shape.md`'s cross-provider proof
history section for both findings in full, and
`docs/reference/claude-named-executor.md` for the config that resulted.
