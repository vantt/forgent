---
phase: 05
title: "Knowledge rows move to the knowledge verbs: `fgos knowledge status` reports the lints, `fgos doc-registry --check` reports staleness"
status: pending
depends_on: [04]
parallel: "none (registrations.mjs, bin/fgos.mjs, command-registry.mjs chains)"
owning_lane: "HARDEN (reviewer: DOC)"
effort: ~1d
net_size: "Node −120 / Rust 0 / tests −60 (estimate)"
---

# Phase 05 — Knowledge rows to knowledge verbs

## Context

Decision 65 (1a) with audit home C (§1 "Docs and knowledge", §2.6). These rows read the knowledge registry from the Work view, so they are history-derived and cannot be `npm test` repo checks; they move to the component's own verbs, which every project that adopted the registry already has. Code read on `fd476d709`:

- Bodies `src/setup/registrations.mjs:3083-3386` (`isFgosSourceCheckout`, `docRegistryAdopted`, `checkDocRegistryStale` `:3092`, `fixDocRegistryStale` `:3113`, `checkDocAliasBroken` `:3144`, `checkDocActiveDuplicate` `:3169`, `checkDocNearDuplicate` `:3195`, `checkDocProvisionalAged` `:3215`, `checkDocTopicOversized` `:3231`, `checkDocRoleUnderused` `:3245`, `checkDocCurrentPathMissing` `:3263`, `checkDocSourceUnreachable` `:3294`, `checkDocSourceConservation` `:3331`); registrations `:3388-3398`. They share the run's Work view (`doctorWorkView`, `:225`).
- `fgos knowledge status` counts only (`bin/fgos.mjs:1621-1650`); `fgos doc-registry` always writes (`bin/fgos.mjs:1706-1716`), no `--check`.
- Live failing on fg-server2 today: `doc-current-path-missing` (2 960 ms), `doc-source-conservation` (audit §0).
- Tests: `test/setup/knowledge-doctor.test.mjs` (row cases), `test/setup/checks.test.mjs` (row list).

## Requirements

- **One lint module** (infra, name from `fgos convention name`, beside the knowledge readers in `src/report/`, e.g. `src/report/knowledge-lints.mjs`) exporting `knowledgeFindings(view, { root, now })` → `[{ lint: '<id>', level: 'fail'|'warn', items: [...] }]`, built by moving the nine `checkDoc*` bodies (except the registry staleness) unchanged in judgment. The lint ids keep the old row ids so a user searching for `doc-current-path-missing` finds it.
- **`fgos knowledge status`** adds `findings` (the module's answer) to its JSON; the counts stay byte-identical; text and exit code unchanged (a read verb, exit 0). `--json` consumers (grep `knowledge status` in `core/skills`, `domains/*/skills`, `src`) keep working.
- **`fgos doc-registry --check`** computes the projection (`computeKnowledgeProjection`) and compares with `docs/doc-registry.{md,json}` without writing; answer `{ stale: bool, mdPath, jsonPath }`, exit 1 when stale (the same convention as `fgos decision-index --check`, `bin/fgos.mjs:2004`). Plain `fgos doc-registry` unchanged.
- Registry entries for both verbs gain the new output/flag in their description and parameters; the routes descriptor regenerates only if flags are listed for these legacy routes (`scripts/export-command-selectors.mjs --check`).
- **Delete** the ten rows, `fixDocRegistryStale`, `docRegistryAdopted` and `isFgosSourceCheckout` if no caller remains (P03 removed the decision-index caller; grep), and now-unused imports.
- Knowledge spec (`docs/platform/documentation/spec.md` or the knowledge-registry contract under `docs/platform/work-state/contracts/knowledge-registry.md`; find the holder with the plan id grep) states where the lints run; `core/skills/fgos-indexing/SKILL.md` or other skills that say "run fgos doctor" for knowledge lints point at `fgos knowledge status` (canonical source under `core/skills`, regenerate with `npm run build:skills`).
- `CHANGELOG.md`: ten rows and one fix leave doctor; `fgos knowledge status` reports the lints; `fgos doc-registry --check`.

## Files

**Create:** `src/report/<knowledge lints>.mjs`.

**Modify:** `src/setup/registrations.mjs:3083-3398` (removed) and imports; `bin/fgos.mjs:1621-1650,1706-1716`; `src/cli/command-registry.mjs` (`knowledge`, `doc-registry` entries); tests `test/setup/knowledge-doctor.test.mjs` (moves, see below), `test/setup/checks.test.mjs`, `test/setup/registrations.test.mjs`; the knowledge spec/contract; skill sources that name doctor for these lints; `docs/architecture-manifest.json`; registry contract inventory; `CHANGELOG.md`.

**Delete:** `test/setup/knowledge-doctor.test.mjs` after its cases move (`git mv` to the module's owning test file name from `fgos convention name`, then edit, so history follows).

**Tests to retire:** none of the lint behaviours: every case in `knowledge-doctor.test.mjs` moves to the lint module's test with assertions kept (row id → lint id). The `doc-registry-stale` fix cases → behaviour removed (no fix); the check cases become `doc-registry --check` cases. One CLI wiring proof for `knowledge status` findings and one for `--check` exit codes, in the existing CLI test that owns `knowledge` (find with `rg -ln "'knowledge'" test/cli`).

## Net size

Node: rows/registrations/helpers −60, bodies moved ±0, verb additions +25, imports −20, fix −20 → about −75 to −120. Tests: fix cases −40, wiring +20, row-list −10 → about −30 to −60.

## Validation

- FR the moved lint test, the knowledge CLI test, `test/setup/checks.test.mjs test/setup/registrations.test.mjs`
- `npm run fgos:dev -- knowledge status --json` on fg-server2 shows `doc-current-path-missing` and `doc-source-conservation` findings (the two live failures); `npm run fgos:dev -- doc-registry --check` exit 0 on a fresh `fgos doc-registry`
- doctor time before/after (expect about −3.3 s)

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A project relied on `doctor --fix` to refresh its doc registry | L × L | `fgos doc-registry` refreshes; CHANGELOG names it |
| The lints stop being seen at all | M × M | P10 guide and AGENTS.md gate name `fgos knowledge status`; RT-7 accepted by 1a |
| `knowledge status` gets slower (2–3 s of lints) | M × L | Lints run only on that verb; measure and report |

## Rollback

Revert the merge; re-activate the previous release. No on-disk format change.

## Done when

Ten rows out of doctor; lints and staleness reported by the knowledge verbs with every case moved; landed with a guide section.

## Lead brief essentials

Move bodies unchanged; keep the lint ids. DOC reviews the spec holder line. All plan.md lead rules apply.
