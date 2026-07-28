---
name: list
description: >-
  Use when the user wants to see which dogfood-fixture replay scenarios
  exist, from inside a Claude Code session, invoked as /dogfood-fixture:list.
  Reads dogfood-fixture/scenarios/*.md; never touches .fgos/ state, never
  calls the fgos CLI. Examples: "/dogfood-fixture:list", "what dogfood
  scenarios exist", "list replay scenarios".
---

# dogfood-fixture list

Lists the reusable replay scenarios under `dogfood-fixture/scenarios/`
(doc: `docs/decisions/0018-moc-mvp2-fgos.md`, backlog `p-52601a01`). Pure
read — this plugin never writes `.fgos/` state and never shells out to
`bin/fgos.mjs`; it is fixture housekeeping, deliberately separate from the
`fgOS` plugin's real lifecycle verbs.

## Steps

1. **Ignore `$ARGUMENTS`.** `list` takes no arguments.

2. **List scenario files.** Run:

   ```
   ls ${CLAUDE_PROJECT_DIR}/dogfood-fixture/scenarios/*.md
   ```

   If the directory is empty or missing, say so plainly — that is a valid
   result, not a failure.

3. **Report and stop.** For each file, report its basename without `.md` as
   the scenario name (e.g. `expr-eval-chain.md` → `expr-eval-chain`). Point
   to `/dogfood-fixture:show <name>` for details on any one of them.
