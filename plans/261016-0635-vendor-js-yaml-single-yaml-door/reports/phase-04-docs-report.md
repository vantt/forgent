# Phase 4 docs report

Worktree /home/vantt/projects/forgent-worktrees/vendor-js-yaml, branch feat/vendor-js-yaml. Commit `f64c68c1d` (docs only; no src/bin/scripts/test touched).

## Files changed
- `CHANGELOG.md` [Unreleased]: five lines under Changed (no npm install needed; agent/workflow YAML must be valid with doctor file/line/column, whole-indented definitions seat, `name: 123` -> "123"; pool checks now evaluate and fail on unparsable workflow; `domain-registry-compiled` reports stale/unparsable; persona rendering: full block scalars, comments stripped, numbers normalised, unparsable persona line, pinned runs resume) and one under Removed (the `yaml` dependency and hand-written readers).
- `docs/specs/distribution.md`: decision entry in "Lịch sử quyết định" (dated 2026-10-16, "fgOS has no npm runtime dependency; YAML is read through one vendored parser (js-yaml 5.4.3)") with rejected alternatives, commit hashes, parity numbers (828 docs, 0 differences, 13 both-reject), timing (+2-3 ms), suite result, why frontmatter.mjs / distill.mjs / compiled.json stay, and the upgrade procedure. Also corrected the Doctor-check row 7: `domain-registry-compiled` was described as "YAML-free"; now says precompiled and that the check reports missing/unreadable/stale/unparsable.
- `docs/backlog.md`: two proposed rows, `p-3e6b1a52` (remove `legacyPersonaProjection`) and `p-8d04c7f1` (watch js-yaml advisories), inserted id-sorted.

## Judged and left alone
- `docs/specs/runner.md:3343` ("repo chỉ có dependency `yaml`") sits in a dated decision record; a historical statement, not current guidance.
- `docs/platform/**` hits for `node_modules` are verification records or the project-local install tier, unrelated.
- No docs registry/index edit needed (no new doc files).

## Decision ID
None allocated. Narrative-only entry with no RUL/D-ADR ID. Registering it needs `fgos decision` against the main checkout store (the worktree `.fgos` is a disconnected snapshot, the command refuses, and the main checkout holds uncommitted user work), then `fgos decision-index`. `docs/decisions/index.md` therefore not regenerated.
Suggested: `fgos decision --text "fgOS has no npm runtime dependency; YAML is read through one vendored js-yaml 5.4.3 behind src/util/yaml.mjs" --rationale "see docs/specs/distribution.md decision history 2026-10-16" --relation none --dir <main>`, then `fgos decision-index`, and put the ID on the spec entry.

## Tests
`node scripts/run-tests.mjs` with the docs-related files (citation-drift, decisions-corpus-retired, rul11-anchor-phrase, prepare-release, decision-relation, setup/checks): the runner executed the full suite: 7850 tests, 7764 pass, 0 fail, 11 skipped. Backlog is a "generated" file but there is no `.bee` store here and no test checks it; rows follow the existing `p-<8hex>` format.

## Operator follow-up
After merge, restage and activate the release, then run `fgos doctor` through the installed shim (the activated release still carries `node_modules` until then).

Status: DONE_WITH_CONCERNS
Summary: Changelog, distribution decision entry with upgrade procedure, doctor-row fact fix and two backlog rows are committed (`f64c68c1d`); full suite green.
Concerns/Blockers: Decision not registered in the state log (so no ID, and the decisions index is unchanged); needs `fgos decision` from the main checkout. docs/backlog.md header says generated from .bee, so rows added by hand may be overwritten by a future `bee backlog render` unless the PBIs are also created there.
