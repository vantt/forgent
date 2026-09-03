---
framework: diataxis
mode: explanation
---
# Explanation: `fgos return` runs `verify` as a literal shell command — a placeholder string is not special-cased

## What happened (tsk-iun)

`tsk-iun` ("fgos edit's EDITABLE_FIELDS allowlist missing description and
footprint") was created with `verify` left at the auto-filled placeholder
text `chưa xác định — bổ sung thủ công` (Vietnamese: "not yet determined —
add manually"). The item's implementation was finished and correct — the
fix landed, the full test suite passed — but the first `fgos return
tsk-iun` call did not report that. It reported failure:

```json
{
  "id": "tsk-iun",
  "from": "doing",
  "to": "blocked",
  "passed": false,
  "exitStatus": 127,
  "output": "/bin/sh: 1: chưa: not found\n"
}
```

`fgos check tsk-iun` afterward recorded the friction plainly:

```json
{
  "id": "tsk-iun",
  "disposition": "blocked",
  "errorClass": "verify-miss",
  "layer": "verification",
  "attempts": 1,
  "detail": "goal-check failed on branch \"fgw/tsk-iun\" (exit 127)"
}
```

## Why this happens

`return` does not parse or sanity-check the `verify` field's *content* — it
hands the string straight to the shell as the item's proof-of-done command.
There is no special case for "this looks like descriptive prose, not a
command" or "this is the untouched placeholder, ask a person instead."
Whatever string sits in `verify` gets executed literally. A placeholder
sentence starts with a word (`chưa`, "not yet" in Vietnamese) that the
shell tries to resolve as a binary, fails to find, and exits `127` — the
same class of failure a typo'd real command would produce. From `return`'s
point of view, a never-filled-in placeholder and a broken command are
indistinguishable: both are just "the verify command failed."

## What to do about it

Before calling `fgos return <id>`, check the item's `verify` field is a
real, executable proof command — not left at the discovery-time
placeholder. If `return` reports `exitStatus: 127` with output naming a
word from the middle of a sentence (not a program name), that is the
signature of exactly this case: fix it with
`fgos edit <id> --verify "<real command>"`, then move the item back to
`doing` (`fgos move <id> --to doing`) before retrying `return`.

## Generalizes to

Any item whose `verify` was never set to a real command — not just items
carrying this specific Vietnamese placeholder. The failure signature to
recognize is the same regardless of language or wording: a `127` exit
status whose output names a word plucked from prose, not a missing binary
that was ever meant to be a program.
