# Terminal-control docs: spec, boundary row, reading map

## Done

- `docs/platform/terminal-control/spec.md` (new): role, upper port, allocation record, core rules, driver and capabilities, incarnation gap, layout, configuration keys, internal route, failure cases, migration status, known limits, decision history.
- `docs/platform/component-boundary.md`: one row "Terminal-control (L2)" in section 4 only.
- `docs/specs/reading-map.md`: one line for the spec, source and contracts.

## Choices

- Contracts are linked, field lists not copied.
- Migration marked "in progress" (header, section 12): runner still uses `createBatchTab`/`batchTabFor`/`closeIfEmpty`.
- Configuration section says registration into setup and doctor is separate work, not done.
- Incarnation gap (before/after check, restart or live handoff between) stated in section 7 and 13; live handoff noted as unmeasured.
- Pty-size preference and `ratio` = old-pane share taken from the measurement report.

## Not done / limits

- `plans/261016-1306-terminal-control-rust-core-herdr-driver/plan.md` is absent from this worktree and the main-checkout path was denied. I could not read D1-D7 or the owner decisions there. Used only D1, D2, D6, whose meaning is stated in the council, r6 and measurement reports. The plan is cited as code text, not a link, because the file does not resolve here.
- r6 sections 4.1-4.2 not read; nothing in the spec depends on them.
- `fgos convention check` was blocked by command permissions in this run. Links were written relative to existing files; not machine-checked.
- Shell listing was denied too; contract and file names come from `git ls-files`.

## Unresolved questions

- Does the plan define D3-D5, D7 needing a mention in the history section?

Status: DONE_WITH_CONCERNS
Summary: Spec, boundary row and reading-map line written; migration marked in progress.
Concerns/Blockers: plan.md unreadable here; convention check not run.
Context refs:
- (none)
Expected outputs:
- (none)
