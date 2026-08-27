---
type: how-to
title: How to preserve shell escapes when transcribing a verify command
tags: []
timestamp: 2026-08-13T00:00:00.000Z
source_capture_ids: [tsk-12p, tsk-463]
framework: diataxis
mode: how-to
---

# How to preserve shell escapes when transcribing a verify command

Use this when copying a verify command out of a `plan.md` markdown fence
into a `fgos add --verify "..."` / `fgos edit --verify "..."` shell
invocation. A backslash-escaped character inside that command (most
commonly a backtick) can be silently stripped during the copy — the
outer shell running the `fgos` CLI consumes `\`` as its own escape
sequence before `fgos` ever sees the string, unless the nesting is
preserved deliberately.

## Why this is dangerous, and quiet

The resulting string is usually still **syntactically valid shell** — a
bare, unescaped backtick just starts a real command substitution instead
of standing for a literal character. `sh` parses it fine; it just does
something different than intended. So the failure never shows up as a
clean syntax error (contrast
`fix-a-verify-command-broken-by-mixed-in-prose.md`'s own case, where the
shell refuses to parse at all) — instead, `fgos return`/`fgos check` runs
the substituted command, gets a "command not found" or a wrong-output
result, and blocks the item with `errorClass: verify-miss` — indistinguishable
at a glance from a genuine test failure.

**Reproduced live (tsk-12p):** `plan.md`'s own verify block had the
correct backslash escaping. The item's stored `work.verify` field had
lost it. `fgos return` failed with a command-not-found error against a
correct implementation.

## Before you start

Read the item's current `verify` field (`fgos list --json` or `fgos
check <id>`) and compare it, character for character, against the
command as written in `plan.md`'s own fence — not just "does it look
similar", but literally diff the backslashes.

## Steps

1. **Never retype a verify command from memory or by eye.** Copy the
   exact bytes out of `plan.md`'s fence.

2. **When the command itself contains a backtick that must stay literal**
   (e.g. it greps for a symbol name wrapped in backticks, or asserts
   output containing one), keep the backslash-escape intact through every
   layer of quoting between the markdown fence and the final stored
   string:

   ```bash
   # WRONG -- the outer shell strips \` before fgos ever sees it:
   fgos edit tsk-x --verify "grep -q \`foo\` file.txt"

   # RIGHT -- single-quote the whole --verify value so the outer shell
   # does no escape processing on it at all; the backtick then reaches
   # the STORED verify field literally, exactly as `sh -c` (the real
   # execution shell, at return time) needs to see it to treat it as a
   # literal character in its own turn:
   fgos edit tsk-x --verify 'grep -q `foo` file.txt'
   ```

   If the verify string itself also needs a literal single quote, use the
   standard POSIX `'\''` splice inside the single-quoted argument rather
   than switching to double quotes (switching back to double quotes
   reopens the exact hole this doc exists to close).

3. **After writing it, read the value back and diff it against
   `plan.md`'s own fence.** `fgos list --id <id> --json`'s
   `data.work[id].verify` — confirm every backslash that should be there
   still is.

4. **If you only discover the loss after a confusing `blocked` result**
   (not a clean syntax error — see "Why this is dangerous" above): fix
   the stored `verify` value the same way (step 2), then `fgos move <id>
   --to doing` and `fgos return <id>` again, same recovery shape
   `fix-a-verify-command-broken-by-mixed-in-prose.md`'s own step 4 uses.

## Related

- `fix-a-verify-command-broken-by-mixed-in-prose.md` — a different
  symptom (a clean shell syntax error) from a different cause
  (model-generated prose mixed into the command, not an escape lost in
  transcription).
- `docs/history/tsk-1yt-verify-write-time-shell-validation/CONTEXT.md` —
  a write-time syntax check (`sh -n`-shaped), scoped to syntax validity
  only (its own D2) — does not reliably catch this failure mode, since
  the escape-stripped string is typically still syntactically valid; this
  doc is the prevention this item's own scope narrowed to instead.
