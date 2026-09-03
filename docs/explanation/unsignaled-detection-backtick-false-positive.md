---
authoritative_for: [DONE]/[BLOCKED] backtick-quoted false-positive signal detection, agy/gemini-3.6-flash-medium proof-test finding, executeExecutorCli strips backtick spans
---

# The `[DONE]`/`[BLOCKED]` detector had a false-positive hole — closed by cross-provider proof-testing

`tsk-5gd` closed a real false-positive gap in
[`tsk-4oq`'s own `unsignaled` outcome detector](dispatch-execute-unsignaled-outcome.md):
a live proof-test dispatching real `agy` with `gemini-3.6-flash-medium`
found the worker printing `[DONE]` **inside backtick-quoted prose**
describing its own feature work (the item being implemented was, itself,
about scanning for `[DONE]`/`[BLOCKED]` tokens) — without ever printing a
standalone, unquoted status line. `executeExecutorCli`'s naive substring
check (`stdoutStr.includes('[DONE]')`) was fooled into treating this as a
real signal, the opposite failure direction from `tsk-4oq`'s own finding:
instead of missing a real signal, it accepted a fake one.

## Confirmed live on `tsk-4oq` itself

Dispatching `fgos-coding-implement` out-of-process via `agy`/`gemini-
3.6-flash-medium` for `tsk-4oq`: the worker completed real, verifiable
work (clean commit citing the item, clean tree, its own `npm test` run
passed per its own summary) but its full stdout never contained a
standalone `[DONE]` line — only backtick-quoted mentions inside prose
describing the feature it had just implemented. The driver had to fall
back to git-log/git-status forensics — exactly the cost `tsk-4oq`'s own
fix existed to reduce.

## Root cause confirmed, not left open

The item's own description named two candidate root causes (genuine
model inconsistency vs. the model echoing the tokens only inside quotes
referring to its own implementation, not as its own report) as
unconfirmed. Discovery research (`docs/history/tsk-5gd/RESEARCH.md`
Round 1) confirmed the second: detection evaluated a raw substring match
on stdout without stripping backtick-quoted text first, so any mention
of the literal token anywhere in the output — including one referring to
the feature being built, not the worker's own status — counted as a real
signal.

## What shipped

`executeExecutorCli` now strips backtick-quoted spans (`` `...` ``) from
stdout before evaluating `[DONE]`/`[BLOCKED]` — a quoted reference in
prose is ignored, so this case now correctly evaluates as
`outcome: 'unsignaled'` instead of a false positive. Documented directly
in `coding-worker-contract.md` (all render copies) as a named live
proof-test finding, in the same cross-provider evidence table already
tracking `pi` (GREEN) and `claude` (RED then GREEN after an environment
fix) — `agy`/`gemini-3.6-flash-medium` now has its own entry for this
specific failure mode.
