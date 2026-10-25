# Slice C docs closeout (stateful record, 2026-10-25)

Scope: the documentation edits for the Node door cutover. The final gates, the budget count and the board rows are the lead's.

## Changed

- `docs/platform/config/spec.md`: implementation status (Slice C done, open items named), section 11 doctor list now points to `packages/config/contracts/doctor-rows.v1.json` instead of copying it, section 12 rewritten as built, section 13 (linked-worktree command values, `--dry-run`, tests helper), section 16 gates G2/G4/G5, section 4 and 5 tense fixes, one history line.
- `docs/platform/yaml-document/spec.md`: status line names Node's config path through the facade.
- `docs/platform/component-boundary.md`: Config row (crate path, facade, readers done).
- `docs/specs/seat-binding.md`: the `$comment` representation clause of D-ADR0072 recorded as superseded (it was not yet written); section 5.1, pointers and E5 updated; `src/setup/tier-ladder-comment.mjs` and its test no longer exist.
- `docs/specs/runner.md`: pointer bullet for the runner config source and the account inventory location.
- `docs/specs/distribution.md`: row 5b, row 5h, row 7 (removed rows `config-not-stale`, `config-awareness`, the per-key `*-configured` rows, `advise-execute-capabilities-configured`, and the long-gone `model-policy-tier-coverage`), row 7b, setup "what changes" and side effects, `config-merge.mjs` pointer.
- `docs/specs/reading-map.md`, `docs/backlog.md` (p-99951b9e in-flight with progress, p-a189ff31 note, p-be6b5abe note, two new proposed rows: duplicate `findExecutableOnPath`, legacy `gate-bypass.json` fallback), `CHANGELOG.md` (five new lines; the old line saying fgOS still reads JSON was corrected).
- Instruction sentences naming `.fgos/config.json`: `README.md`, `docs/how-to/install-fgos-in-a-project-and-use-doctor.md` (also two retired doctor rows removed, the token row updated), `docs/how-to/configure-and-operate-agent-confinement.md`, `docs/routing-handoff-contract.md`, `docs/reference/dispatch-module-boundaries.md`, `docs/platform/secrets/spec.md`, and three skill sources under `core/skills/_shared/` (`capability-catalog.md`, `catchup-self-recovery.md`, `executor-dispatch-fallback.md`).

`npm run build:skills` must run to refresh the generated render surfaces (`.agents/skills`, `plugins/`) for the three skill sources. Not run here.

## Could not verify

- Which machines have converted their global file: left to the stateful records, not written into the spec.
- Whether `fgos setup` creates `~/.fgos/private/`: not asserted; only `doctor --fix` (`create-machine-files`) is.
- The effect of the `explain`/`applyPatch` entries on Node: only stated as "no Node caller" from the facade's exports.
- Impact analysis was not applicable (documentation only).

## Remaining matches of the retired names (grep over docs and core)

All are history or dated records: `docs/history/**`, `docs/**/verification/**`, `docs/architect/**`, `docs/knowledge/**` (explanations of past decisions), `docs/explanation/dispatch-config-cache-scope-narrowed.md`, `docs/platform/git/spec.md` (a dated census note), `docs/reference/runner-capabilities-advise-execute-slots.md` (a past-tense explanation), the RUL101/RUL108 supersession text in `docs/specs/distribution.md`, `docs/platform/yaml-document/spec.md`, `docs/platform/component-boundary.md` and `docs/specs/reading-map.md`, and the intentional "was deleted" statements in `docs/platform/config/spec.md`, `docs/backlog.md`, the CHANGELOG and this report. `docs/specs/runner.md` keeps the deleted names only in a "deleted" sentence. Many history and RUL paragraphs in `docs/specs/runner.md` still say `.fgos/config.json` as it was at the time; not rewritten.
