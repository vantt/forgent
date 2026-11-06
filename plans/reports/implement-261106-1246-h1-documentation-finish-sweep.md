# Documentation unification finish sweep

Branch `worktree-agent-a462a12d57f6743fa`, worktree `/home/vantt/projects/forgentX/.claude/worktrees/agent-a462a12d57f6743fa`. Head sha: see `git log -1` (the report commit is the last one).

## Items

| Item | Result | Commit |
|---|---|---|
| O1 reading map routes | done: authority route is platform README + governance, switchboard listed as transition evidence, `:150` BA-reference wording fixed | `fa51ef0f1` |
| O2 governance migration-rules clause | done: one-owner rule stated inline citing sections 5 and 8, ratchet clause dropped | `fa51ef0f1` |
| O3 switchboard classification | done: both files moved by `git mv` into `docs/platform/documentation/history/`, headers set to History / Canonical: No, rules `doc-switchboard-doc-1` and `migration-authoring-rules` deleted, golden case moved to the history path, convention spec sentence removed, all inbound links repointed | `fa51ef0f1` |
| O4 drift spec text | done | `164d4787b` |
| O5 drift default | done: default `--specs-dir` is `docs/platform`, sentinel and flat legacy scan deleted, one filtered read set (spec.md, decisions folders, platform-foundations, no history); fixtures use `<root>/area/spec.md`; the legacy-spec case removed from the default-scan test (behaviour gone) | `164d4787b` |
| O6 roadmap section 9 | done | `fa51ef0f1` |
| O7 packaging README and spec pointer | done | `fa51ef0f1` |
| O8 documentation-system-design | done (past tense) | `fa51ef0f1` |
| O9 skills | done: core sources cite D-ADR0026 with gloss and the runner decisions holder, `npm run build:skills` regenerated `.agents` and `plugins` | `164d4787b`, `2c8ca0684` |
| O10 test titles and dead search dir | done, no assertion changed | `164d4787b` |
| O11 comments | done (knowledge-migration, status-category, decision-relation, conserved-dispatch-doctrine) | `164d4787b`, `fa51ef0f1` |
| O12 decision-index | done: `narrativeHolderResolver` reads the governance scope-to-holder table (alias or area name, fallback to the platform file carrying the scope name); `buildDecisionIndexMarkdown` takes an optional `holderFor`; computeDecisionIndex and the instruction-registry equality check both pass it; index regenerated with `npm run fgos:dev -- decision-index` (34 rows changed, 0 `docs/specs` pointers left); 2 new tests | `7427a57da` |
| O13 ledger | done: PF-I005 and PF-I020 set to implemented with current facts and evidence | `0cd18df70` |
| O14 L13-159 ruling | done: copied into plan.md as 7.5c | `0cd18df70` |
| O15 stale lines | done: execution-authority and resume-state lines replaced, tag note added | `0cd18df70` |
| O16 board | done: DOC row leads with closed, branch cell cleared, roster line 51 closed with DOCOS as follow-on, one line on top of `log.md` | board commit (last) |
| CHANGELOG | done: `unplaced-docs` line under Unreleased | `0cd18df70` |

## Blast radius (O12)

GitNexus was not available to this agent; callers found by grep: `bin/fgos.mjs` (compute and generate), `src/setup/registrations.mjs` (decision-index doctor rows), `src/setup/instruction-registry.mjs` (equality check, updated to pass the same resolver), setup tests. New argument is optional, so other callers are unchanged. Risk: low.

## Tests

- `cargo test -p fgos-convention`: 11 passed.
- `test/scripts/check-decision-citation-drift.test.mjs`: 32 passed.
- `test/report/decision-index.test.mjs`: 18 passed.
- `test/docs/*.test.mjs` (5 files): 30 passed.
- `test/scripts/doc-health.test.mjs`, `test/scripts/list-doc-anchors.test.mjs`, `test/setup/instruction-registry.test.mjs`, `test/setup/instruction-composition.test.mjs`, `test/state/status-category.test.mjs`, `test/state/decision-relation.test.mjs`: pass except the live doc-health case below.
- `node scripts/doc-health.mjs`: 1 finding, `docs/platform/proposals/documentation-system-unification.md:19` Related path `../../../plans/...`. Artifact of the worktree depth: the checker also tries the path from the repo root, and `../../../plans` from `.claude/worktrees/<id>` is the main checkout's `plans/`. Not caused by this change and it resolves on main. Everything else: 617 documents, 0 other findings.
- Environmental failures, unrelated to this change (native yaml addon not shipped in this worktree, `git-addon-unavailable`): 3 cases in `test/runner/dead-vocabulary-guard.test.mjs` (the P5 doc-search case I edited passes) and 2 `loadRunnerConfig` cases in `test/setup/capability-catalog-doctrine.test.mjs`.
- Legacy-path regex over live areas: only provenance lines in `docs/reading-map.md` (2), a comment describing the retired path in `src/report/decision-index.mjs`, and immutable decision text in `docs/decisions/index.md`.
- `npm test` not run (linked worktree, per brief). `node_modules` was not copied: the hook blocked the `cp -al` and the narrow tests ran without it.

## Concerns

- Pre-commit convention check skipped (`host-unavailable`) in the worktree; the convention change is covered by the cargo golden test only.
- The release active today still carries the old rule set until the next activation (LAND).
