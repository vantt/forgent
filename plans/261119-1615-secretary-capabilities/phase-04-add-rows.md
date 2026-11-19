# Phase 4: Session write add-rows

## Context
After phase 1, `session write` replaces a whole file under a base check. Adding one backlog row should not need a copy
of the whole file. No backlog writer exists. docs/backlog.md has one open table (lines 3-267), a `## Done / Declined`
list, and ~100 rows appended after that list by hand (outside the table).

## Requirements
1. `fgos session write <path> --add-rows` (stdin = one or more markdown table rows). The route reads the file after
   catch-up, inserts the rows after the last row of the file's first table, writes and publishes in the same merge
   slot with base = the OID it read (no window). Rust, inside `write_and_publish`; the request arg is `mode: "add-rows"`.
2. Refusals by name: `write-row-malformed` (not a `| ... |` row with the table's column count), `write-row-exists`
   (first-cell id already in the file), `write-no-table`.
3. The ~100 rows appended after `## Done / Declined` (outside the table) are a backlog-file fix for the supervisor, who
   owns backlog writes; until moved, add-rows inserts into the first table as specified.
4. fgos-secretary skill step 2 uses `--add-rows` for a new row; whole-file write with `--base` stays for edits.
5. Contract, session-host spec; CHANGELOG line handed to the supervisor.

## Validation
Route tests: two add-rows racing with an unrelated commit both land; duplicate id refused; malformed refused.
CLI test for the flag. clippy, msvc, census.
