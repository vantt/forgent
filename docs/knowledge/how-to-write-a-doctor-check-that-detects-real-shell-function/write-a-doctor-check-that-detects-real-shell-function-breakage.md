---
type: how-to
title: How to write a doctor check that detects real shell-function breakage, not just text presence
tags: []
timestamp: 2026-08-10T11:39:00.000Z
source_capture_ids: [tsk-2wpi]
framework: diataxis
mode: how-to
---
# How to write a doctor check that detects real shell-function breakage, not just text presence

Use this when a `fgos doctor` check exists to verify a shell integration
(a sourced function, an rc file line) actually works, but only inspects
text — file existence, a regex match on rc-file content — rather than
actually invoking the thing it claims to verify.

## The trap this guards against

`src/setup/registrations.mjs`'s `checkShellIntegrationSourced` and
`src/setup/shell-rc.mjs`'s `hasSourceLine` only regex the rc file's TEXT
for a `source`/`.` line naming the integration script's path. Neither
ever invokes the resulting shell function. A source line can be
textually present and correct while the function it defines is
completely dead — the check literally cannot tell the difference between
"sourced and working" and "sourced and broken":

> "A source line can be textually present and correct while the function
> it defines is dead for any reason ... the check cannot tell the
> difference."
> — real `docs/history/tsk-2wpi-doctor-real-shell-invocation-check/CONTEXT.md`

A second, independent check made this worse rather than better: it
checked `bin/fgos.mjs`'s file existence or a bare PATH lookup in a fresh
subprocess — neither exercises the actual sourced shell function, so its
"local bin/fgos.mjs found" message was true of the *file* and silent
about the *function*. Two green signals, both wrong about the same
broken command.

## Steps

1. **Confirm the check is testing text, not behavior.** Read what the
   check actually does — a regex on file content, a plain file-existence
   check, or a bare `command -v` in a fresh subprocess never exercises
   the real, already-sourced state a live session would have.

2. **Before designing the fix, verify the obvious naive fix would
   actually catch the real bug.** Don't assume "spawn a shell, source the
   script, call the command" is sufficient — test it empirically against
   the known-broken state first:

   > "Considered testing real invocation via a naive 'spawn bash, source
   > the script, call `fgos --help`' probe. Verified empirically this
   > would NOT catch the ... bug at all: a plain subprocess never strips
   > underscore-prefixed functions ... `bash -c 'source ...; fgos --help'`
   > exits 0 today even against the still-unfixed ... script."
   > — real `docs/history/tsk-2wpi-doctor-real-shell-invocation-check/CONTEXT.md`

   A naive real-invocation probe can still be a false green if it doesn't
   reproduce the *actual mechanism* that broke the thing in the first
   place.

3. **Simulate the real failure mechanism directly, generalized rather
   than hardcoded to the one symptom you found.** The chosen fix: after
   sourcing the integration script in a disposable subshell, diff the
   function table before/after to find exactly which functions sourcing
   introduced, unset any of *those* whose name matches the filtering
   convention (here, a leading underscore) that caused the original bug,
   then call the real command and check its exit code. Generalizing to
   "any underscore-prefixed function this script introduces" rather than
   hardcoding the one helper's name keeps the check durable against a
   future helper with the same vulnerability.

4. **Verify the new probe both fails against the broken state and
   passes against the fixed state**, on the actual files on disk — not
   simulated data:

   > "Verified empirically against the current, still-unfixed script ...
   > correctly identifies `_fgos_repo_root` as the introduced underscore
   > function, strips it, and reproduces the exact live failure (`exit
   > 1`) ... Once [the fix] merges, nothing is left to strip, and this
   > same probe passes cleanly."
   > — real `docs/history/tsk-2wpi-doctor-real-shell-invocation-check/CONTEXT.md`

5. **Name the check's real scope honestly, not as total coverage.** State
   plainly what specific failure class the check now detects (here: "does
   this integration survive its own underscore-prefixed helpers being
   stripped") — and what it still can't guarantee (every hypothetical way
   a downstream harness might filter shell state, which would require
   reproducing that harness's own internals, outside this repo's
   knowledge or control).

## Why this matters

A doctor check exists to catch a real failure before a user hits it —
one that only re-confirms its own inputs (a file exists, some text is
present) gives false confidence precisely in the case that matters most:
the thing is broken in a way that leaves the superficial signals intact.
Verifying a fix's detection power against the actual broken state, before
trusting it, is what separates a real regression guard from a check that
merely looks more thorough.

## Related

- `docs/explanation/harness-shell-snapshot-strips-underscore-prefixed-helper-functions.md`
  — the sibling item's own root-cause story (`tsk-3k2`) this check was
  built to detect.
- `docs/history/tsk-2wpi-doctor-real-shell-invocation-check/CONTEXT.md` —
  full decision record (D0–D3).
