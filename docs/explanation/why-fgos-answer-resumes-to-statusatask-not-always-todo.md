---
type: explanation
title: Why fgos answer resumes to statusAtAsk, not always todo
tags: [fgos-answer, awaiting-human, claim-lock, cli-help]
source_capture_ids: [tsk-f3p]
authoritative_for: why fgos answer's real resume behavior is statusAtAsk rather than always todo, and why its CLI help text was corrected to match
---
# Why `fgos answer` resumes to `statusAtAsk`, not always `todo`

`tsk-f3p`. `fgos answer`'s CLI help string
(`src/cli/command-registry.mjs:341`) claimed "resume the item to
`todo`" — but the real resume logic (`answerAwaiting`,
`src/state/store.mjs:747-763`) resumes to `statusAtAsk`: `doing` when a
claim was actively held at the moment `fgos ask` parked the item,
`todo` otherwise. This is documented, intentional, already-shipped
behavior (`docs/specs/work-state.md:229,1016`, "claim-lock §5.1") — the
old always-`todo` resume was the real historical bug, already fixed
separately. Only the help string had never been updated to describe the
real behavior.

Reproduced live on `tsk-19z`: a session claimed the item (`doing`), asked
a question (`statusAtAsk: doing`) and the item parked `awaiting-human`;
answering it later correctly resumed to `doing`, not `todo` — matching
spec, contradicting the stale help text.

## Why the resume-to-prior-status behavior is correct, and stays unchanged

Reverting to always-`todo` was considered and rejected: that IS the
pre-fix bug. An item that was `doing` when asked should resume `doing` —
resetting it to `todo` would silently drop the in-progress claim state a
real session was relying on.

## The "orphaned claim" scenario this reproduction also raised

The original claiming session's worktree no longer existed by the time
the item resumed to `doing`, so a naive `fgos pick` would refuse to
reclaim it (expecting `todo`). Investigation found this is **not a
gap**: the already-shipped session-claim-liveness self-reclaim mechanism
(`tsk-3ni`, `src/runner/claim-port.mjs:269-306` +
`src/runner/claim-liveness.mjs`) already handles exactly this case in
`pick`'s own claim-conflict path. No code change was needed there — only
the help string.

## The fix

A one-line, non-executable string edit to the `answer` verb's
description in `src/cli/command-registry.mjs`, with zero runtime branch
or caller depending on its content (confirmed: no test asserts this
string). The change carries no behavior risk by construction.
