---
authoritative_for: runner.executors.claude entry, difference from the top-level runner.executor default, why claude skips allowCrossProvider
---

# `runner.executors.claude` — why it's a pure naming change, not new behavior

`tsk-1cn` added a `claude` key to `.fgos/config.json`'s `runner.executors`,
mirroring `agy-cli`/`codex-cli`/`pi`'s own shape. Before this, `claude`
dispatch only worked through the top-level, unnamed `runner.executor`
default — inconsistent with every other provider, which had a real named
entry addressable by id (`decide claude`, `execute --executor claude`).

## Same args, same behavior — only addressability changed

```json
"claude": {
  "kind": "agent",
  "description": "Claude Code CLI (headless dispatch)",
  "invocations": [{
    "via": "cli", "adapter": "cli-spawn", "command": "claude",
    "args": ["-p", "{prompt}", "--model", "{model}", "--permission-mode",
      "acceptEdits", "--allowedTools",
      "Bash(git add:*),Bash(git commit:*),Bash(rtk git add:*),Bash(rtk git commit:*)"]
  }]
}
```

`args` is the exact same array `runner.executor.args` (the top-level
default) already carried — this is a naming/addressability change, not
new behavior: the resolver already spawned this exact command/args
combination whenever no named executor was requested at all
(`src/runner/dispatch/resolve.mjs`, `executor = byExecutor ?? cfg.executor`).
Registering it by name just makes `decide claude` / `--executor claude`
resolvable, the same way `agy`/`codex`/`pi` already are.

(The `rtk git add:*`/`rtk git commit:*` allowlist entries were added
later, by `tsk-1dsr` — see `docs/reference/coding-worker-contract-shape.md`'s
proof-test history for why: a machine-local `rtk` proxy hook rewrites `git
...` to `rtk git ...` before the allowlist match runs, so both forms need
to be present.)

## Why `claude` skips `allowCrossProvider`/`providerModel`/`rigorOverrides`

`agy`, `codex`, and `pi` all need `allowCrossProvider: true` because
`resolve.mjs`'s cross-provider gate fires whenever the resolved `command`
is outside `CLAUDE_CLI_COMMANDS = ['claude']` (`dispatch/config.mjs`) —
their `command` is `agy`/`codex`/`pi`, not `claude`. Since this entry's
`command` literally IS `"claude"`, the gate never fires for it, so
`allowCrossProvider` would be a no-op.

Similarly, `providerModel` already defaults to `'claude'`
(`resolve.mjs`) with no entry needed, and `rigorOverrides` exists only to
downgrade a *non*-Claude provider's model-policy tier — irrelevant when
the provider already is Claude. Copying those three fields from the
other executors' entries would be inert-but-misleading, not a more
complete mirror — omitting them is the correct copy, not an incomplete
one.

## Where the proof-test history for this executor lives

`tsk-1jt`/`tsk-1dsr`'s live dispatch proof-test findings against this
exact config (RED on the missing `rtk`-wrapped allowlist entries, then
GREEN once fixed) are documented in `docs/reference/coding-worker-
contract-shape.md`'s cross-provider proof history section, not repeated
here.
