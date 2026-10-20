# Seat Binding spec promotion — report

Scope: stateful record of one docs-only promotion. Authority is `docs/specs/seat-binding.md`, not this file.

## Authority surfaces

- Created `docs/specs/seat-binding.md` (status "approved, not implemented"). Carries sections 2-13 of the approved text: authority and agent-seat scope, boundary, Shape S with Shape B fork and reversal trigger, tier ladder, rigor split, cells, tier composition (project wins, `maxTier` visible cap), authority to raise (none by override in wave 1), config schema and precedence, personas (no `prefer`/`tier` in persona files), seat identity and patterns, pins and `--provider`, conversion with drain stop, worked examples, proof list, do-not-add list, short evidence section with file:line, and "Lịch sử quyết định" with D-ADR0072. Council labels G1-G8 and local ids are written as plain contract text, not cited.
- Changed `docs/specs/runner.md`: pointer under the bind/tier paragraph; one supersede pointer line under each of RUL80, RUL91, RUL98, RUL102, RUL103, RUL106 (rule text untouched); full D-ADR0072 record appended after D-ADR0071. All six rules live only in runner.md's decision history; none is a locked law in `docs/platform-foundations.md`, so no platform-foundations edit.
- Changed `docs/specs/workflow.md`: pointer in the "unchanged at both doors" line where `bind()` is named.
- Changed `docs/specs/reading-map.md`: new entry.
- Changed `docs/platform/component-boundary.md`: a "Planned, not implemented" sentence appended to the Execution Core row (the file already uses "planned" / "Not implemented" inline in rows, e.g. Git, Event Store). The row's ownership was not moved.
- Changed `docs/decisions/index.md`: one committed D-ADR0072 row (see concerns).

## Evidence classes

- Intent/decision: owner approval 2026-10-20 21:31, answers 20:39, 21:06, 21:23 (quoted from the approved draft).
- Current evidence: code citations in section 13 and the "hôm nay" sentences were copied from the approved draft's re-check at its HEAD; I did not re-verify each line number in this pass, except that the files exist.
- Not verified: Shape S exec cost, vendor tier/price claims (stated as such in the spec).

## Validation

- `node scripts/check-decision-citation-drift.mjs`: no findings (after adding one-line glosses to every RUL/D-ADR citation; ids with a gloss of 15 chars or less count as bare).
- `fgos decision-index --check`: unchanged with the committed row.
- Tests run with deps copied via `cp -al`, `CLAUDE_CODE_SESSION_ID` unset: `test/scripts/check-decision-citation-drift.test.mjs`, all five `test/docs/*.test.mjs`, `test/runner/dead-vocabulary-guard.test.mjs` pass; `test/state/decision-relation.test.mjs` has 7 CLI tests failing (spawned `bin/fgos.mjs decision` exits 2 in temp repos). They build temp fixtures and do not read the edited docs; I could not run them on a clean main to prove baseline, so treat as environmental until confirmed.
- `test/architecture.test.mjs` not run: manifest untouched.

## Docs impact

No code or config changed. Component-boundary row moves when the code lands, with its plan.

## Unresolved

- `fgos decision` was not run, to avoid writing shared `.fgos` state from a worktree. The D-ADR0072 row in `docs/decisions/index.md` is hand-committed; the lead should record the decision in state (`fgos decision`, relation supersedes-in-part of the six rules) when landing, or the row has no state twin.
- The seat-choice split of each superseded rule is stated only as "the seat-choice part"; the spec does not itemise which sentences remain valid.
