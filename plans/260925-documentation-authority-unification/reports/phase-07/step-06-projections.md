# Step 6 projection and copy reconciliation

Author session: `codex-session:fgos-run_unit-run-17922205e4d698@2026-10-17`.
Review status: pending independent review. Evidence pin at author start: `f836da42ca77d706fc247e45baee812df66dbd2a`.

The four authored inputs have one current canonical source each and one settled candidate target. All four pairs were fully read and compared over every byte. The JSON companion records source ids, full SHA-256 digests, before/after target digests, declared rules, evidence pins and findings. Current authority remains unchanged; no source retires or target is promoted here.

| Group | Current canonical source → candidate target (under `docs/`) | Result and freshness |
|---|---|---|
| X-DUP-01 | `contracts/fgos-gateway-api-v1.yaml` → `platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml` | Fresh byte-equal manual copy; OpenAPI 3.1.0, CTR010 / `fgos-gateway.v1`, A45. Gateway's `/contract` handler and MCP read the source. No YAML generator is declared. |
| X-DUP-02 / X-SEM-31 | `ui-spec/schema/surface-contract.schema.json` → `platform/ui-spec/history/schema/surface-contract.schema.json` | Fresh byte-equal authored JSON Schema validator input. Full schema, refs, conditionals and enums read; output freshness is separate. |
| X-DUP-03 | `architecture-manifest.json` → `platform/contracts/architecture-manifest.json` | Corrected stale candidate with exactly nine new `infra` entries from main; now byte equal. Root manifest is the authored input read by `test/architecture.test.mjs`, not generator output. Existing keys and `map` pointer preserved. |
| X-DUP-04 / X-SEM-29 | `ui-spec/spec.config.yaml` → `platform/ui-spec/architecture/spec.config.yaml` | Fresh byte-equal authored compiler config. Source root works; candidate layout is explicitly not certified as a compiler root. |

Equality means the statements and grammar were copied intact. It does not certify implementation truth, generated freshness, native conservation or readiness to change consumers. X-SEM-29/31 settle through X-DUP-04/02 respectively: target settled; legacy source retires at Phase 9.

The manifest delta is seven `src/holder-lock/*.mjs` facade modules plus `src/setup/holder-lock-checks.mjs` and `src/runner/dispatch/cwd-lock.mjs`, all `infra`. The only candidate file changed is `docs/platform/contracts/architecture-manifest.json`. Its content/occurrence binding and before/intended-final digests were appended to `post-review-edits.md` before the write. Every affected native unit returns to pending and must receive Step 9 carry/rebind/matching review. There is no approval carry.

## Scratch regeneration

The declared home skill path in `docs/ui-spec/00-overview.md` is absent. The compiler exists in the main checkout at `/home/vantt/projects/forgentX/.claude/skills/ui-spec/tools`; its sources and lockfile were pinned and copied unmodified. An isolated scratch clone of the relevant tracked subtree was materialized using read-only `git archive HEAD docs/ui-spec` (no Git metadata or state copied). Build inputs match HEAD. No `fgos` CLI, Git mutation, dependency install or working-tree generator ran.

In `/tmp/fgos-work/phase-07-step-06/clone/`, the unmodified `validate.mjs --root .../docs/ui-spec` passed: 12 spec files, 44 actions, 10 surfaces, no warning. `build.mjs` and `interpret-wireframe.mjs` both exited 0. The interpreter's optional browser launch failed because no browser exists; its HTML was written successfully. No declared `--check` exists for these generators; regeneration stayed in scratch.

| Output under `docs/ui-spec/generated/` | Scratch comparison |
|---|---|
| `surface-registry.yaml` | Equal |
| `action-registry.csv` | Different; two S02 actions added |
| `navigation-graph.yaml` | Different; `A-S02-012/013` added |
| `coverage-report.md` | Different; 42 → 44 actions |
| `wireframe-v2.html` | Different; actions and source presentation added |

These are substantive source/output differences, not timestamp-only drift. S6-UI-DRIFT-01 routes the four stale outputs to Phase 9 regeneration before promotion, with Step 9 scorecard disclosure. No generated output or render source was edited. S6-UI-ROOT-02 parks only candidate-root certification: config under `architecture/`, schema under `history/schema/` and relocated surfaces need consumer/root handling outside this step. The existing candidate README already records this obligation. Phase 8 prepares those consumers; Phase 9 resolves it before promotion.

## Six inherited dispositions

- **GRP-LIVE-01:** four digests / nine contextual target occurrences remain exact. Retain the directory list, lifecycle example, generated metadata vocabulary and relation vocabulary in their design/history/governance contexts. They are not newly generated projections or a new competing authority. Promotion consistency remains Phase 9.
- **GRP-HEAD-02:** preserve the three reviewed work-state target headings: `9-behaviors-and-operations`, `14-presentation-surface`, `1-provenance-of-retired-decisions`. Each current target digest equals its recorded reviewed target digest. Source and target heading digests can differ because heading identity includes context. Re-key if later promotion changes these headings; do not restore old wording now.
- **GRP-SPECS-03:** six digests / 34 bound target occurrences remain exact. No current claim rows were found for the three named no-row specs (`platform-foundations`, `enduser-docs-authoring`, `enduser-docs-index` under `docs/specs/`). Retain the conditional re-key obligation if new decisions later assign different owners. This is a check of current authored decisions, not an inference about future ownership.
- **F10-11:** the protected legacy `docs/reading-map.md:158` still misattributes `EXECUTOR_ADAPTERS`; the definition is now `src/runner/dispatch/adapters.mjs:48`. Route that correction to Phase 9. The named `4415,4503` runner citation defect was already corrected in Step 4 to `4410,4498`; no second rewrite. Other historical runner citations are not recertified by that bounded correction.
- **F10-12:** retain the list-overlap limitation. Historical Phase 6 counts (1,305 overlapping tuples / 2,336 union) are not current native measurements. A single list's metadata is not independent approval. Step 9 must recompute the union and bind changed tuples without editing these accounting inputs now.
- **F10-13:** comparator equality is drift detection after rebuilding expected lists from E, not independent conservation proof. Step 9 must say so and still obtain independent matching review plus native both/each D, strict E and unchanged-comparator evidence.

The production extractor verifies all 43 listed contextual occurrences mechanically; the bounded review request asks the independent reviewer to inspect all of them. No sample is preselected by the author. Rationale-only wording remains Phase 9 under L10-37.

## Checks and remaining routes

Architecture tests pass 27/27. Candidate-status strict check passes for 217 checked files (611 discovered), zero findings. Strict constitution placement without ledger passes: 610 matched, one existing exception, zero leftovers, ambiguity or orphan evidence. A/B/C and unchanged-reader/baseline checks pass within their stated bounded scope. G is category-only over persisted identity; fresh native closing proof remains Step 9. Step 5 artifacts and protected working paths have zero diff.

The unchanged legacy ratchet exits **1** with three imported exception-digest mismatches in `docs/specs/distribution.md`, `reading-map.md`, `runner.md`. All three equal this turn's HEAD bytes; Step 6 did not author them. S6-RATCHET-03 routes them to Step 9 protected-import accounting. The inherited reading-map provenance park, PARK-PROTECTED-01, remains visible. No gate, exception or baseline is changed to turn this green. Full `npm test` and global native jobs are reserved for Step 9, not claimed here.

Independent handoff: `review-request-a38-step-06-01.md`, one logical request. Step 6 authoring is complete; acceptance awaits that review. Only UI candidate-root certification and protected-import proofs are parked; other groups proceed.
