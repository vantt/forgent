---
authoritative_for: codex CLI executor, --dangerously-bypass-approvals-and-sandbox, why workspace-write sandbox blocks the pre-commit hook, tsk-4kh wontfix reversal
---

# Why `codex` was wired as a bypass-all executor, not a sandboxed one

`tsk-3tkc` wires OpenAI's `codex` CLI into `.fgos/config.json` as a second
`agent`-kind executor alongside `agy`/`pi`, using
`--dangerously-bypass-approvals-and-sandbox` — no OS sandbox boundary at
all. This reverses a prior decision: `tsk-4kh` had researched the same
question and closed as `wontfix`, keeping `codex` unwired rather than
accept an unconditional bypass.

## Why the real sandbox (`-s workspace-write`) doesn't work here

`codex exec -s workspace-write` (Codex's real OS-level sandbox) blocks
`git commit` in this repo specifically. Root cause, confirmed generic
across four research rounds: `.githooks/pre-commit` is a Node script that
spawns a **nested** git subprocess for its own `git rev-parse` calls —
and the sandbox denies that nested spawn with `EPERM`. This isn't a
narrow, fixable quirk of one hook; it's the sandbox's own behavior toward
any nested process spawn, so any repo whose pre-commit hook shells out
(a common pattern) hits the identical wall. Two other paths were
evaluated and priced out in `tsk-4kh`'s own research before that item
closed `wontfix`: `-s workspace-write` plus `--add-dir` plus fixing the
hook itself, and a two-invocation dispatch-layer workaround — neither
survived scrutiny as proportionate.

## What changed: the trade-off was made explicit, not the technical facts

Nothing about the sandbox limitation changed between `tsk-4kh` and
`tsk-3tkc` — all four research rounds carried forward unchanged. What
changed is that the user reviewed the full research record and explicitly
decided to accept the bypass-all trade-off (no sandbox boundary at all)
rather than leave `codex` permanently unusable as a dispatch executor.
This is a real, disclosed security-posture change, not something arrived
at by default or by omission — `tsk-3tkc`'s own plan.md hard-gates on
`audit/security` for exactly this reason.

## What shipped

One config-only change, no new source code or doctor check — bypass-all
needs nothing provisioned, unlike a sandboxed path which would need live-
proven policy flags plus a fallback for whatever the sandbox blocks:

```json
"codex-cli": {
  "kind": "agent",
  "description": "OpenAI Codex CLI (bypass-all -- no sandbox boundary, see docs/history/codex-bypass-executor/)",
  "allowCrossProvider": true,
  "invocations": [{
    "via": "cli", "adapter": "cli-spawn", "command": "codex",
    "args": ["exec", "--dangerously-bypass-approvals-and-sandbox", "{prompt}"]
  }]
}
```

No `providerModel`/`rigorOverrides`/`modelPolicies` entry — unlike `agy`,
which requires an explicit `--model` argument, `codex --help` showed no
such required flag; `codex exec` runs against whatever model
`~/.codex/config.toml`/the account already defaults to. This was judged
an honestly-sufficient answer rather than a gap to fill.

## The disclosed risk, stated plainly

`codex-cli` now runs with the same "zero enforced boundary" posture `agy`
had before `tsk-1xm` (see `docs/explanation/agy-permission-denylist-not-
allowlist.md`) — except here there was no working denylist mechanism
found for `codex` either; the accepted trade-off is genuinely wider open
than `agy`'s post-`tsk-1xm` state. A future session extending `codex`
dispatch usage should know this executor carries no process-level
capability boundary at all, only the same prose-level worker-contract
boundary (footprint, cold-pickup refusal) every dispatch already relies
on.
