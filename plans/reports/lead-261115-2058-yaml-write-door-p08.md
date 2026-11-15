# Lead report: yaml-write-door p08 (specs and decision record)

Branch `yaml-write-door/p08`, base 324c95660 (integration head). Docs only; no Rust, no census change.

## Done
- `docs/platform/yaml-document/spec.md`: header Implementation line, section 1 ("or of a new document"), section 2 frontmatter cut and write, section 5 `emit(value)` row plus the empty-path and shape-A sentences, section 6 hidden-character write rule, section 10 bullet (namespace, marker 2, `writeFrontmatter`, three Node rule ids, no `stringifyYaml`, marker conjunction), section 15 pointer entry.
- `docs/platform/packaging-distribution/spec.md`: new top entry in "Lịch sử quyết định" (2026-11-15); the 2026-11-14 entry untouched, the new one says it closes its "Rejected: a YAML writer".
- `docs/platform/component-boundary.md` YAML Document row: new wording.
- Holder check: governance table maps the scope to `packaging-distribution/spec.md`; its narrative home is the spec's history section (the existing YAML entries live there). No new D-ADR id minted (phase file needs none).

## Verification
- Symbols exist on the integration head: `writeFrontmatter` (`src/util/yaml.mjs`), addon `js_name = "emit"` (`packages/git/node-addon/src/yaml.rs`), `pub fn emit` (`packages/yaml-doc/rust/src/edit.rs`). Rule ids and the `tool` profile checked in source. Edit fixture count 98 to 116 read from git.
- Green, one file per run: doc-health (8), check-decision-citation-drift (33), architecture (60); `node scripts/check-decision-citation-drift.mjs` no new findings. `node scripts/doc-health.mjs` alone needs a host binary; the test covers it.

## Concerns
- The entry cites the `write a YAML frontmatter fence` doors row, which the later guard phase adds; until it lands the name is forward-pointing. Land after it or confirm the row name at that phase.
- Phase 12 of the packaging plan edits the same spec file: rebase at land, resolve the history section by hand only if the same lines collide.

## Lessons
- `doc-health.mjs` run directly needs a host binary; its test runner stages one, so use the test.
- Reading the phase reports first gave exact figures (fixture counts) instead of guesses.
