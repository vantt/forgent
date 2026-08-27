---
type: explanation
title: Why return's blocked-friction hint checks real output, not the verify command string
tags: [return, friction, goal-check, adr0020, worktree]
source_capture_ids: [tsk-4o9]
framework: diataxis
mode: explanation
---
# Why `return`'s blocked-friction hint checks real output, not the verify command string

`tsk-4o9` started as an investigation into `tsk-3fj`, whose verify had
been hand-edited three times in 24 minutes. Reading `tsk-3fj`'s own
24-event history settled the two founding questions before any code was
written: `tsk-3fj` went through `fgos return`'s real success path, not
`fgos move` (`branchHeadAtReturn` plus a following
`work.outcome.actual.passed:true` event prove it — not a `tsk-280`-class
bypass), and the original red-verify symptom
(`test/runner/dispatch.test.mjs`) was already fixed 369 commits later by
an unrelated item (`44d5c4cc`, `tsk-49u`) — currently green, 179/179.
Neither needed a code change.

## The real, still-open gap

What `tsk-3fj`'s edit history actually exposed: its verify was rewritten
three times specifically to dodge ADR0020 — a verify command that reads
`.fgos/` can never pass inside `return`'s own detached-worktree
re-verify, because a worktree never carries `.fgos/` by design. Nothing
told the operator *why* the verify kept failing; they had to already
know ADR0020 to recognize the pattern.

## Why the fix checks captured output, not the verify command's text

The narrowed fix, confirmed with the user directly: when `return`'s
re-verify fails, inspect the already-captured `check.output`
(`runGoalCheck` already returns combined stdout+stderr) for signs the
failure is caused by a missing `.fgos/` — mentions of `.fgos` together
with `ENOENT`/`not found`/`no such file` — and append an explanatory
hint to the `addFriction` call's `detail` field, pointing at ADR0020.
Advisory only: never a new gate, never blocks a verify that is currently
passing, never changes `return`'s own pass/fail outcome.

A simpler-looking alternative — pattern-matching the verify command
*string* itself for the substring `.fgos/` — was considered and
rejected. A repo-wide scan of every item's current `verify` field found
6 hits for that substring, and 4 of the 6 were false-positive-prone:
absolute paths, doc-content greps, and `rg` exclusion globs that mention
`.fgos/` without the command actually depending on its presence.
Checking the real failure *output* instead — and only ever on an
already-failing verify — carries no equivalent false-positive risk: none
of those 4 items' commands would ever produce that specific
`.fgos`-plus-`ENOENT` error text, since none of them actually depend on
`.fgos/` existing to succeed.

## Where it landed

A small pure helper, `detachedWorktreeFgosHint(output)` in
`src/runner/goal-check.mjs` (next to `runGoalCheck`, its natural home),
returns a hint string or `null`. `bin/fgos.mjs`'s `return` case calls it
at both of its blocked paths — branch-source and main-source — and
appends the hint to the same `friction` record `addFriction` already
writes when non-null. No new event type, no new field on the item.

## Related

- `docs/history/tsk-4o9-verify-detached-worktree-fgos-hint/CONTEXT.md` —
  the full decision record (D1: return not move; D2: symptom already
  fixed; D3: output-based check, not string match; D4: wiring point).
- `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` (ADR0020) — the
  constraint this hint points readers at.
