---
name: submit
description: >-
  Use when the user wants to submit a dogfood-fixture replay scenario's
  canonical text into the fgOS backlog in one step, from inside a Claude
  Code session, invoked as /dogfood-fixture:submit <scenario>. Reads the
  scenario's own canonical submit text verbatim from
  dogfood-fixture/scenarios/<scenario>.md, then hands it to the fgOS
  plugin's own submit skill — never writes .fgos/ state directly and never
  shells out to bin/fgos.mjs itself. Examples:
  "/dogfood-fixture:submit expr-eval-chain", "submit the expr-eval-chain
  scenario".
---

# dogfood-fixture submit

Shortcut so replaying a scenario doesn't require copy-pasting its canonical
text out of the `.md` file by hand. This skill only locates and extracts
that text; the actual backlog write still goes through the `fgOS` plugin's
`submit` skill (one-door-write, CTR001) — keeping the deliberate separation
documented in `dogfood-fixture/skills/list/SKILL.md` (this plugin never
touches `.fgos/` state or `bin/fgos.mjs` directly).

## Steps

1. **Parse `$ARGUMENTS` as the scenario name.** If empty, run
   `/dogfood-fixture:list`'s own steps and ask the user which one — never
   guess.

2. **Read the scenario file:**

   ```
   ${CLAUDE_PROJECT_DIR}/dogfood-fixture/scenarios/<scenario>.md
   ```

   If it doesn't exist, say so and suggest `/dogfood-fixture:list`. Do not
   fall back to a different scenario silently.

3. **Extract the canonical submit text verbatim.** It is the fenced code
   block directly under the `## Canonical submit text` heading. Copy it
   exactly — do not paraphrase, translate, or reformat it.

4. **Optionally flag a stale precondition.** If the scenario file's
   `## Precondition` section names paths (e.g. `src/expr/`, `test/expr/`)
   and those already exist in the repo, mention it and suggest
   `/dogfood-fixture:cleanup <scenario>` first — but don't block on it
   without the user's say-so, since submit itself doesn't require baseline.

5. **Hand off to the fgOS submit skill.** Follow
   `plugins/fgOS/skills/submit/SKILL.md`'s own steps (dependency scan,
   explicit confirm/edit/reject, then the actual `fgos submit` call) using
   the extracted text from step 3 as its `$ARGUMENTS`. This skill does not
   call `fgos submit` itself — it stays a pure hand-off.

6. **Report and stop.** Relay the fgOS submit skill's own result (new item
   id and derived fields, or its error) back to the user unchanged.
