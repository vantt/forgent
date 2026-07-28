---
name: show
description: >-
  Use when the user wants to read a specific dogfood-fixture replay
  scenario's full doc (canonical submit text, invocation flows, pass
  criteria), from inside a Claude Code session, invoked as
  /dogfood-fixture:show <scenario>. Pure read of
  dogfood-fixture/scenarios/<scenario>.md; never touches .fgos/ state, never
  calls the fgos CLI. Examples: "/dogfood-fixture:show expr-eval-chain",
  "show me the expr-eval-chain scenario".
---

# dogfood-fixture show

Reads one scenario doc under `dogfood-fixture/scenarios/` in full — the
copy-paste submit text, the interactive (case A) and headless (case B)
invocation flows, and the pass criteria.

## Steps

1. **Parse `$ARGUMENTS` as the scenario name.** If empty, run
   `/dogfood-fixture:list`'s own steps first and ask the user which one they
   want — never guess a name.

2. **Read the scenario file:**

   ```
   ${CLAUDE_PROJECT_DIR}/dogfood-fixture/scenarios/<scenario>.md
   ```

   If it doesn't exist, say so and suggest `/dogfood-fixture:list`. Do not
   fall back to a different scenario silently.

3. **Report and stop.** Relay the file's content to the user (verbatim, or
   plainly summarized if very long) — this is a documentation lookup, not a
   command that changes anything.
