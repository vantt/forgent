---
name: metrics
description: >-
  Use when the user wants observation metrics suite (harness scorecard, runs,
  outcomes, entropy, snapshot), invoked as /fgOS:metrics [subcommand].
  Examples: "/fgOS:metrics", "/fgOS:metrics harness", "/fgOS:metrics runs",
  "/fgOS:metrics outcomes", "/fgOS:metrics entropy", "/fgOS:metrics snapshot".
---

# fgOS metrics

Wraps `fgos metrics` (native Rust host command) so a person working inside
Claude Code can see the harness scorecard, runs breakdown, outcomes,
entropy, or snapshot without hand-typing the CLI. Defaults to `fgos metrics harness`.

## Steps

1. **Read arguments.** `$ARGUMENTS` is the metrics subcommand (e.g. `harness`,
   `runs`, `outcomes`, `entropy`, `snapshot`), or empty (defaults to `harness`).

2. **Run the metrics command.**

   Use `../_shared/fgos-cli-fallback.md`, substituting `<verb-cmd>` with:

   - If `$ARGUMENTS` is non-empty:

     ```
     metrics $ARGUMENTS --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
     ```

   - If `$ARGUMENTS` is empty:

     ```
     metrics harness --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
     ```

3. **Report the result.** Read the returned JSON envelope's `data` field
   and relay the metrics plainly back to the user.
