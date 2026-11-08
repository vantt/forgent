# Lead report: doctor readiness, knowledge rows move to the knowledge verbs

Branch `harden/doctor-p05-knowledge-rows` from origin/main `8f39bfec4`. Lead: HARDEN on fg-server2.

## What changed

- New `src/report/knowledge-lints.mjs` (infra, beside the knowledge readers): `knowledgeFindings(view, { root, now, topicMaxDocs })` returns `[{ lint, level, items }]` for the nine lints, in a fixed order, absent when empty. Bodies moved with the same judgments; ids are the old row ids. `doc-role-underused` is `warn` (it was always a passing info row), the rest `fail`.
- `fgos knowledge status` adds `findings`; counts, text and exit code unchanged. `topicMaxDocs` is read through the config facade (`docRegistry.topicMaxDocs`, default 10) in the verb.
- `fgos doc-registry --check` compares both projection files with a fresh projection, never writes; stale or missing raises a validation refusal, the same convention as `fgos decision-index --check`.
- Doctor: ten rows, the `doc-registry-stale` fix, `docRegistryAdopted`, the Work-view-reading helpers and five imports removed from `src/setup/registrations.mjs` (`isFgosSourceCheckout` had no definition left). Doctor now lists 115 rows (`doctor --json` on this tree).
- Registry entries for `knowledge` and `doc-registry` describe the new output and `--check` flag. The routes descriptor is unchanged (`export-command-selectors --check` exit 0).
- Docs moved with the rows (L10): registry contract inventory lines, packaging-distribution spec rows 7 and 7b, how-to section 4.6 (now points at the verbs), documentation spec section 6.5 and the aging-check test line, architecture manifest, test ownership table, CHANGELOG. History narratives untouched.

## Deviation

The plan says `--check` exits 1 when stale. The convention it cites (`decision-index --check`) is a validation refusal, which this CLI maps to exit 4; I followed the convention, so stale exits 4 (non-zero, refused). Test asserts 4.

## Tests

Moved by `git mv test/setup/knowledge-doctor.test.mjs test/report/knowledge-lints.test.mjs`; every lint case kept with assertions (row id to lint id, message substring to item substring).

| Retired | New owner / reason |
|---|---|
| doctor registry includes all 10 design-required checks | behaviour removed (rows gone); `checks.test.mjs` row list drops the ten ids |
| `doc-registry-stale` check passes when up to date | `doc-registry --check refuses a missing or stale projection, passes a fresh one, and never writes` |
| the doc rows of one run read the Work view once | behaviour removed with the rows (`createDoctorRun().once` keeps its own proof in the registrations tests) |
| `doc-registry-stale` fix cases | behaviour removed (no fix) |

Added wiring proofs (one each): `doc-registry --check` exit and no-write; `knowledge status` carries findings next to unchanged counts. Plus `a clean registry has no findings` (owns the warn-vs-fail level of underused roles). Both CLI spawns carry a `// boundary:` reason.

## Evidence

- Focused: knowledge-lints, checks, registrations, architecture, command-registry, doc-health, citation-drift, test-ownership-lint, proof-inventory, unknown-flag-rejection, rust-host command-routes, disconnected-worktree-guard, doctor-strict-exit: 394 tests, 394 pass.
- Red before the registry pins were edited: the two Data Dictionary inventory tests (7, 7b) failed, then passed after the contract and spec lines were updated.
- Live on this checkout: `knowledge status --json` shows `doc-current-path-missing` (1), `doc-source-conservation` (1) and `doc-role-underused` (warn, 362 roles), matching the two live failures; `doc-registry --check` on a fresh registry exits 0.
- One-door scan: 0 undeclared; census regenerated.
- Doctor wall time not re-measured separately (no per-row durations in `--json`); the ten rows are gone, 115 rows remain.

## Net size (estimate in brackets)

Node -94 [-120] (the new module carries the moved bodies, +207; registrations -319); Rust 0 [0]; tests -39 [-60]. Under the estimate because moved bodies stay and three new proofs were added.

## Items for other phases

- `test/suite-baseline.json` still names `test/setup/knowledge-doctor.test.mjs` (TEST owns it; regenerate with `--write-baseline` at landing).
- The phase file's guide section for the owner machine: knowledge lints now live in `fgos knowledge status`.

## Full suite

`node scripts/run-tests.mjs` (HERDR/CLAUDE vars unset, private Cargo target): 8589 tests, 8556 pass, 1 fail (the frozen V7n addendum, known red), no `run-tests: ERROR` lines.
