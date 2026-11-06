---
phase: 02
title: "Dead and duplicate rows deleted, each condition proven owned elsewhere first"
status: pending
depends_on: [01]
parallel: "none: registrations.mjs and git-checks.mjs chains (01 → 02 → 03 → 04 → …)"
owning_lane: "HARDEN (reviewers: ES for the two Event Store rows, CFG for the config dead keys, OPC for git-repository-config)"
effort: ~0.5d
net_size: "Node −420 / Rust 0 / tests −250 (estimate)"
---

# Phase 02 — Dead and duplicate rows

## Context

Audit §1 rows marked D; decision 65 "Dead/duplicate rows (14) are deleted". `shadow-binder-divergence` is already gone (`847913570`); `convention-conformance` (D/R) moves in P03; `no-stuck-merge-abort` folds into `fgos git status` in P06. This phase deletes the other 12. Code read on `fd476d709`:

| Row id | Check body | Registration | Duplicate of / why dead |
|---|---|---|---|
| `dependencies-installed` | `registrations.mjs:2419-2437` | `:2439-2444` | judges the user's own `package.json`; fgOS has no runtime deps (`package.json` `dependencies: {}`) |
| `plugin-skill-cli-reachable` | `:2633-2650` | `:2651-2656` | a running doctor proves a CLI; `project-fgos-launcher` (`:1358-1400`) owns PATH |
| `plugin-dev-skills-packaged` | `:2697-2717` | `:2718-2723` | `test/skills/fgos-mirror.test.mjs:116-138` (names, file sets, bytes) |
| `command-routes-drift` | `:4335-4398` | `:4399-4404` | `test/rust-host/command-routes.test.mjs:123` (`checkCommandRoutes` clean, same `scripts/export-command-selectors.mjs`) |
| `tier-vocabulary-dead-keys` | `:713-776` | `:1413-1418` | claimed: `config-unknown-key` (config engine, `src/setup/config-checks.mjs`) — **must be proven** |
| `coordination-protocol-dead-vocabulary` | `:777-827` | `:1461-1466` | retired vocabulary; `test/runner/dead-vocabulary-guard.test.mjs` guards the source tree |
| `coordination-protocol-fixtures-valid` | `:3476-3485` | `:3480` block | returns "retired" |
| `coordination-example-requests-valid` | `:3521-3546` | `:3525` block | returns "retired" |
| `operation-capability-resolves` | `:2399-2418` | `:2403` block | returns "retired" |
| `identity-pinned-machines` | `src/setup/identity-checks.mjs:141` | `registrations.mjs:5414-5418` | informational listing of `fgos identity pins` |
| `event-store-refspec` | `src/setup/event-store-checks.mjs:54-61` | loop `registrations.mjs:5479-5482` | claimed: `git-repository-config` (`src/setup/git-checks.mjs:59-70`) — **conditions differ, see Requirements** |
| `event-store-native-addon` | `event-store-checks.mjs:45-46` | same loop | its message defers to `git-component-compatible`; ES spec `docs/platform/event-store/spec.md:642` kept it only for the facade-export check |

## Requirements

- **Condition table before any deletion.** For each row, the report lists every condition the row can fail or warn on and the test or row that owns it after deletion. A condition with no owner moves; it is never dropped.
- **`event-store-refspec`.** Its conditions (ES spec `:638`): (1) remote configured but fetch refspec missing; (2) a positive push refspec whose source can match `refs/fgos/`; (3) a positive fetch refspec matching `refs/fgos/local-events` or `refs/fgos/branch-events`; (4) no mapping provenance; (5) provenance URL differs from the remote (`event-store-remote-changed`). `git-repository-config` covers (1) only (`git-checks.mjs:66`). Move (2)–(5) into `git-repository-config` as problems of the same row (the facts are already in `eventStoreFacts`; read them through the same doctor run, `createDoctorRun().once`, so no second inspection), keeping the result codes `event-store-refspec-missing` / `event-store-remote-changed` in the sentence (`packages/event-store/contracts/result-codes.v1.json:24` stays). Then delete the ES row. ES reviews.
- **`event-store-native-addon`.** The ES spec kept it only because the facade-export check would be lost. Fold `eventStoreAddonAvailable` (`event-store-checks.mjs:45`) into `git-component-compatible` (one ABI row for the combined addon, Git spec §4), then delete the row; ES spec `:642` and `:798` say so (history line, not an edit of the old decision text).
- **`tier-vocabulary-dead-keys`.** Prove with a fixture that each key the check names (`checkTierVocabularyDeadKeys` list, `:713-776`) makes `config-unknown-key` (or another config row) fail. Any key the config engine accepts keeps the row (report it; the row then stays K and leaves this phase). `test/runner/dead-vocabulary-guard.test.mjs:76-79` drops its two exclusion regexes for the deleted functions in the same commit.
- **`identity-pinned-machines`.** Delete row and `checkIdentityPinnedMachines`; identity spec line points to `fgos identity pins`.
- Everything else: delete the body, the registration, now-unused imports (lint by running the A4 no-undef gate in `npm test`), and every test that only drove the deleted row.
- Consumers: before each deletion run the plan.md id grep; doc mentions under `docs/platform/*/spec.md` and the registry contract change; `docs/platform/agent-coordination/verification/**` are history (left alone).
- `CHANGELOG.md`: the 12 rows removed, named; `git-repository-config` and `git-component-compatible` now carry the Event Store mapping and facade checks.

## Files

**Create:** none.

**Modify:**
- `src/setup/registrations.mjs` (bodies and registrations above; imports)
- `src/setup/event-store-checks.mjs:45-61` and the loop list at `registrations.mjs:5479`
- `src/setup/git-checks.mjs:54-70` (`git-component-compatible` gains the export check; `git-repository-config` gains conditions 2–5)
- `src/setup/identity-checks.mjs:141-` (delete function)
- Tests: `test/setup/checks.test.mjs` (row list; cases of deleted rows), `test/setup/checks-doctor-config.test.mjs:559-600` (dead-keys cases → the config-engine fixture case, or deleted), `test/setup/event-store-checks.test.mjs` (refspec/native-addon cases move to `test/setup/git-checks.test.mjs`), `test/setup/registrations.test.mjs`, `test/setup/yaml-parse-failures.test.mjs` only if it drives a deleted row, `test/runner/dead-vocabulary-guard.test.mjs:76-79`
- Docs: `docs/platform/event-store/spec.md:636-642,798`, `docs/platform/git/spec.md` §12 table rows for the two Git rows (`:629-633`; this phase edits only the two rows it folds into), `docs/platform/identity/spec.md` (pinned row line), registry contract inventory, `CHANGELOG.md`

**Delete:** none (functions and registrations only).

**Tests to retire** (each names its owner):
- `checks.test.mjs` cases for `dependencies-installed`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged`, `command-routes-drift`, the three retired coordination rows, `operation-capability-resolves`, `identity-pinned-machines` → behaviour removed (rows judged nothing fgOS needs) or owned by `test/skills/fgos-mirror.test.mjs:116-138` (mirror) and `test/rust-host/command-routes.test.mjs:123` (routes).
- `checks-doctor-config.test.mjs:559-600` dead-keys cases → owned by the new config-engine fixture case (or kept if the row stays).
- `event-store-checks.test.mjs` refspec and native-addon cases → moved (not copied) into `git-checks.test.mjs` cases of `git-repository-config` / `git-component-compatible`, assertions kept.

## Net size

Node: bodies + registrations ≈ −480, folded conditions +40, imports −20 → about −420. Tests: deleted cases ≈ −280, moved cases ±0, config fixture +30 → about −250.

## Validation

- FR `test/setup/checks.test.mjs test/setup/checks-doctor-config.test.mjs test/setup/event-store-checks.test.mjs test/setup/git-checks.test.mjs test/setup/registrations.test.mjs test/setup/identity-checks.test.mjs test/runner/dead-vocabulary-guard.test.mjs test/skills/fgos-mirror.test.mjs test/rust-host/command-routes.test.mjs`
- `rg -n "'(dependencies-installed|plugin-skill-cli-reachable|plugin-dev-skills-packaged|command-routes-drift|coordination-protocol-dead-vocabulary|coordination-protocol-fixtures-valid|coordination-example-requests-valid|operation-capability-resolves|identity-pinned-machines|event-store-refspec|event-store-native-addon)'" src bin test` → nothing (and `tier-vocabulary-dead-keys` unless kept)
- `npm run fgos:dev -- doctor --json` on fg-server2: the two Git rows show the folded conditions; row count down by 12 (or 11); time before/after.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A refspec/addon condition silently lost | M × H | Condition table; folded conditions keep their result codes; ES reviews |
| Reversing the ES spec's "kept as its own row" decision without new evidence | M × M | The fold keeps the export check (the only reason given), so the decision's reason holds; spec history line records it |
| A dashboard reads a deleted id | L × L | Id grep; CHANGELOG names every id |

## Rollback

Revert the merge; re-activate the previous release. No on-disk format change.

## Done when

Twelve (or eleven) rows gone with every condition owned; landed with a guide section.

## Lead brief essentials

Condition table first; fold, then delete. Prove the dead-keys duplicate with a fixture. All plan.md lead rules apply.
