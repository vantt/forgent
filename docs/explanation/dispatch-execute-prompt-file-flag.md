---
authoritative_for: dispatch execute --prompt-file flag, avoiding shell command-substitution for long prompts
---

# `dispatch execute --prompt-file` closes the shell-round-trip friction directly

`tsk-3ps` closed a real, repeated friction: `node src/runner/dispatch.mjs
execute`'s `--prompt` flag had no file/stdin input option, forcing a long
multi-paragraph prompt to be passed inline through shell
command-substitution (`--prompt "$(cat promptfile)"`).

## The friction this replaces

That shell round-trip collided with the worktree isolation guard, which
refuses a compound command combining a `$(cat file)` substitution with a
following `dispatch.mjs execute` invocation ("too complex to verify that it
stays inside the worktree") — even when the target file has nothing to do
with git or the shared checkout. Confirmed as a real repeated pattern, not
a one-off: hit live on `tsk-5pb` (needing a throwaway wrapper script using
`execFileSync` with an argv array to dodge shell interpolation) and again
on `tsk-3av` (a similar hand-authored `.sh` wrapper invoked through
Monitor). See `docs/how-to/handle-worktree-guard-refusal-of-compound-
dispatch-command.md` and `docs/how-to/write-wrapper-script-for-worktree-
guard-refusal.md` for the wrapper-script workaround this flag now makes
unnecessary for this specific case.

## What shipped

A `--prompt-file <path>` flag on `dispatch.mjs execute`
(`src/runner/dispatch/cli.mjs`): when passed, the file's content is read
via `fs.readFileSync` and used as the prompt instead of `--prompt`'s
inline value. A read failure (missing file, permission error) reports the
same structured `{error, errorClass}` JSON-on-stdout shape the rest of the
`execute` subcommand already uses, rather than crashing uncaught.

This closes the shell round-trip at its source for the common case: a
caller can now write the prompt to a file and pass `--prompt-file
<path>` as a single, non-compound argument — no `$(cat ...)` substitution,
so the worktree isolation guard's compound-command refusal never
triggers for this shape. The wrapper-script workaround (`docs/how-to/
write-wrapper-script-for-worktree-guard-refusal.md`) remains the answer
for other compound commands this flag doesn't cover.
