# Review a38 step-05 rr4 p37

Pin aa8d3437. Both files have no diff, no parked items, no admitted items. Every item is REJECT/preserve.

## src/setup/run-supervisor-checks.mjs - verdict ok
Items reviewed: 85 (all REJECT/preserve).
- 59 are message/format templates (caller-data-formatting) over host-binary errors, driver names and escapes. Verified they build no path.
- 13 scalar-pass-through, 3 root-only, 2 config-or-metadata, 4 state-event-store and 1 accumulator are paths under `.fgos/` (assignments, attempts, runtime socket dir, host binary resolution) or config scalars. None is a documentation root.
- 2 text-label-join (`join(' ')`, `join('; ')`) are string serialization, not path joins.
- A grep of the pinned source for docs/, .md, spec, readme, architect and plans/ finds only one hit: the header comment at line 2 citing docs/platform/run-supervisor/spec.md. It is a comment, not a runtime string or path operand, so there is no behavioral reference to admit.
- OUTCOME defects: none.

## src/setup/shell-rc.mjs - verdict ok
Items reviewed: 10 (all REJECT/preserve).
- Windows profile relative paths (`Documents/PowerShell/...`) and `path.join(homeDir, ...)` rc-file detection are user-home shell profile paths. "Documents" is the Windows folder name, not a doc root.
- The 4 message templates are non-path.
- grep hits are comments only (CONTEXT.md mention at line 2, "Microsoft docs" at line 22).
- OUTCOME defects: none.

## Record-text notes
- Many reject reasons embed the full caller declaration text ("It formats values at export function ... {; contains no ..."). The sentence is garbled (declaration spliced in place of a noun) but the nonDocumentUse values are true. Cosmetic only.
- `role` of dynamic-015002 is scalar/thread with nonDocumentUse text-label-join. That fits but is an unusual role label.

## Lead-judgment questions
None.

## Counts
Files 2, items 95, admitted 0, rejects judged correct 95, outcome defects 0, record-text notes 2.

Status: DONE
