# Phase 02 — Header fixture and consumer-test verification

## Final corrected-source verification

After coordinator integrated the atomic publication correction and regenerated projections, tester reran only the two relevant suites and the existing temporary fixture with publication observation added. The original pre-fix results below remain preserved; the whole 20-file set was not repeated.

```sh
env -u CLAUDE_CODE_SESSION_ID node --test --test-concurrency=1 test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs
```

Exit **0**, stderr empty: **140 tests / 140 passed / 0 failed / 0 skipped / 0 cancelled / 0 todo**, **599.273825 ms**.

Temporary observation reused the seven original fixture source bodies and all original smoke assertions. It wrapped `fs.renameSync` only in the helper process, called the real rename, then read every owned destination ending `.md` immediately after each publication. Every assembled/mirrored destination already had the complete positioned source header after unchanged frontmatter; no headerless published Markdown appeared. Result: **38 observed Markdown renames**, all stamped: **14** main-fixture `.agents` publishes, **6** Claude subsidiary-reference publishes, **14** plugin publishes and **4** external `prune:false` publishes. This covers both render passes and both external layering passes. Thin SKILL wrappers are not rename-published by this fixture path; original smoke independently checks their unchanged marker/frontmatter/provenance, so no wrapper rename count is implied. These are temporary runtime observations, not a permanent implementation-wiring assertion or a claim of exhaustive scheduler stress.

Final fixture exit **0**, stderr empty; original nested shared/domain, idempotence, frontmatter preservation, binary/non-Markdown preservation, temp exclusions, inherited mirror/reference bytes and `prune:false` checks all pass. Original smoke finally removed its owned root, observation restored `fs.renameSync`, and tester removed the owned OS-temp final helper directory. No repo helper/test/source files were modified.

Exact final command/output retained separately as `local://phase-02-tests-final-evidence.json`; original `local://phase-02-tests-evidence.json` remains untouched. The historical inventory/counts below are preserved pre-fix measurements; final mirror/drift suites validate corrected generated output, but the entire numeric target inventory was not needlessly repeated. Whole-suite and native installed-shim handoff remain separate coordinator lanes.

## Preserved pre-fix summary

Post-generation verification in `/home/vantt/projects/worktrees/forgentX-single-door-execution`, after coordinator's successful `npm run build:skills`. Read `ak:test`, its execution reference, project-organization skill, copied Phase02 plan/baseline and `local://render-header-evidence.md`. Historical artifacts were not overwritten.

- Exact temporary fixture smoke: exit **0**, seven source fixtures; all asserted behaviors pass.
- Reconciled targeted regression run: exit **0**; **393 tests, 388 passed, 0 failed, 5 skipped, 0 cancelled, 0 todo**, 108560.756056 ms.
- Actual generated Markdown inventory: **143 files**, **124 positioned assembly headers**, **19 thin wrappers**, **0 mismatches**. Excluded **37 handwritten plugin Markdown source files**.
- These are pre-fix observations, not final acceptance: coordinator subsequently identified raw-Markdown publication before header stamping under concurrent readers. The sequential fixture does **not** test that interleaving. No patch or rerun performed; coordinator owns fix and final relevant verification.

## Commands and outcomes

Fixture shell block was extracted verbatim from the first `sh` fence in `local://render-header-evidence.md` into owned `/tmp/header-tester-helper-kudj81xj/fixture-smoke.sh`. Its original `env -u CLAUDE_CODE_SESSION_ID node --input-type=module` heredoc ran unchanged via `sh` with the same environment unset and execution-worktree cwd. Exit 0; stderr empty. The original relative import was preserved by running the shell helper from the worktree, not changing the smoke source.

Targeted command (one execution; serialized files to avoid packing/setup contention):

```sh
env -u CLAUDE_CODE_SESSION_ID node --test --test-concurrency=1 test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs test/skills/fgos-coding-exploring-root-fix.test.mjs test/cli/fgos-preflight.test.mjs test/state/decision-relation.test.mjs test/state/handoff.test.mjs test/state/domain-registry.test.mjs test/setup/instruction-projections.test.mjs test/setup/uninstall-wiring.test.mjs test/scripts/check-decision-citation-drift.test.mjs test/install-packaging.test.mjs test/e2e/coexistence-canary.test.mjs test/e2e/rebuild-determinism.test.mjs test/setup/uninstall-wiring-2.test.mjs test/setup/uninstall-wiring-3.test.mjs test/setup/dir-resolution.test.mjs test/setup/doctor-fresh-run.test.mjs test/cli/fgos-setup.test.mjs test/cli/fgos-manifest.test.mjs test/setup/checks-doctor-config.test.mjs
```

Exit 0; stderr empty. This single run includes both required `test/setup/skill-wrappers.test.mjs` and `test/skills/fgos-mirror.test.mjs`; neither was redundantly rerun separately. No full `npm test`, Rust cargo command, lint, formatter, build, checkout regeneration, real-main activation or source/test modification was performed by this tester. Existing packaging/setup tests use their owned temporary prefixes/projects/homes; they are not the native restaged installed-shim handoff.

Five skips are all existing `test/e2e/coexistence-canary.test.mjs` bee-dependent cases: bee installation not found in the isolated checkout. Skipped cases: bee→fgos write verdict map; fail-open self-check without onboarding; matching deny control with onboarding; fgos init preserving bee; real runner footprint. Their acceptance is **not proven** here, and no unsafe worker was launched because the entire runner-footprint case skipped. No failing test was suppressed.

## Historical20 / named14 / current20 reconciliation

The historical **20-file** count remains historical evidence. The copied Phase02 document names **14** paths and explicitly warns that these are not an identity-complete historical 20-path list. The copied Phase00 baseline supplies render counts, not six missing historical test identities. This report does not invent them or claim the following current set is identical to that historical roster.

Current named paths: **13 present**, **1 intentionally withdrawn/absent** (`test/skills/skill-sources-bind-executors-through-config.test.mjs`). The withdrawn permanent source-roster/prose test was not created. Current grep-grounded risk/verification set: **20 existing files** = 13 present named files + 5 indirect setup callers + 2 setup safety/help checks. Thus current20 is independently identified; historical20-to-current20 identity remains unavailable, not fabricated. Actual consumers and broader/support checks are distinguished below.

Inventory used test-only grep for literal `.agents`, assembly/materialization/build symbols, and `['setup'` callers; split setup tests were found from existing uninstall comments and their actual invocations. General `agents` search was unnecessarily broad and also returned unrelated agent/AGENTS tests; no context or AGENTS file was opened, and those unrelated hits were not used to manufacture the header consumer set. Literal `.agents` itself can hit fields such as `manifest.agentsMdReadError`; such false positives were excluded.

| Existing file | Classification |
|---|---|
| `test/setup/skill-wrappers.test.mjs` | Named direct/fixture/path consumer |
| `test/skills/fgos-mirror.test.mjs` | Named direct/fixture/path consumer |
| `test/skills/fgos-coding-exploring-root-fix.test.mjs` | Named direct/fixture/path consumer |
| `test/cli/fgos-preflight.test.mjs` | Named direct/fixture/path consumer |
| `test/state/decision-relation.test.mjs` | Named direct/fixture/path consumer |
| `test/state/handoff.test.mjs` | Named direct/fixture/path consumer |
| `test/state/domain-registry.test.mjs` | Named direct/fixture/path consumer |
| `test/setup/instruction-projections.test.mjs` | Named direct/fixture/path consumer |
| `test/setup/uninstall-wiring.test.mjs` | Named direct/fixture/path consumer |
| `test/scripts/check-decision-citation-drift.test.mjs` | Named direct/fixture/path consumer |
| `test/install-packaging.test.mjs` | Named broad packaging/CLI regression (not direct header assertion) |
| `test/e2e/coexistence-canary.test.mjs` | Named broad packaging/CLI regression (not direct header assertion) |
| `test/e2e/rebuild-determinism.test.mjs` | Named broad packaging/CLI regression (not direct header assertion) |
| `test/setup/uninstall-wiring-2.test.mjs` | Newly reconciled indirect setup/materialization consumer |
| `test/setup/uninstall-wiring-3.test.mjs` | Newly reconciled indirect setup/materialization consumer |
| `test/setup/dir-resolution.test.mjs` | Newly reconciled indirect setup/materialization consumer |
| `test/setup/doctor-fresh-run.test.mjs` | Newly reconciled indirect setup/materialization consumer |
| `test/cli/fgos-setup.test.mjs` | Newly reconciled indirect setup/materialization consumer |
| `test/cli/fgos-manifest.test.mjs` | Setup safety/help supporting check; not actual header consumer |
| `test/setup/checks-doctor-config.test.mjs` | Setup safety/help supporting check; not actual header consumer |

Direct/fixture/path categories are not equivalent to reading generated repository bytes: preflight and decision sweep use isolated fixtures; domain/handoff check the shared contract path; instruction projections include a generated skill ledger fixture; exploring/mirror/citation/drift guards exercise repository renders. Uninstall base file retains the risk comment; real setup round trips now live in `uninstall-wiring-2/3`, included above. CLI setup, dir-resolution and fresh doctor tests reach materialization indirectly. Manifest is setup help only; checks-doctor-config guards safe test environments. Packaging/rebuild/coexistence remain explicitly named broad regressions, not evidence of a new permanent header-prose assertion.

## Exact fixture observations

Seven canonical source Markdown fixtures include core/domain skills, deeply nested references, core/domain shared fragments, CRLF and LF frontmatter, and no-frontmatter bodies. Output is exactly unchanged frontmatter + one expected HTML header + unchanged remaining source bytes. Canonical source bytes remain unchanged; plugin inherits assembled bytes; Claude subsidiary references inherit assembled bytes. Both wrappers retain exactly one original thin-wrapper marker and identify assembled projection provenance. Binary/non-Markdown payloads remain byte-identical across their relevant copies. Own-temp files/directories are excluded; orphan is pruned; manually authored Claude skill/plugin command remain unchanged. Repeated rendering is byte-identical. External `prune:false` assembly preserves the copied base skill and remains idempotent while stamping local-domain references.

| Source fixture | Header offset / frontmatter bytes |
|---|---:|
| `core/skills/fgos-core-fixture/SKILL.md` | 60 / 60 |
| `core/skills/fgos-core-fixture/references/nested/plain.md` | 0 / 0 |
| `core/skills/fgos-core-fixture/references/nested/meta.md` | 60 / 60 |
| `domains/coding/skills/fgos-domain-fixture/SKILL.md` | 49 / 49 |
| `domains/coding/skills/fgos-domain-fixture/references/deep/domain.md` | 0 / 0 |
| `core/skills/_shared/deep/core.md` | 0 / 0 |
| `domains/coding/skills/_shared/deep/domain.md` | 60 / 60 |

## Actual generated-target inventory

Inventory traversed actual `.agents/skills/**/*.md`; plugin `fgos-*` and `_shared` Markdown; Claude `fgos-*` and `distill` Markdown, including `CREATION-LOG.md` and recursive references, not only SKILL files. Each assembly header was matched at byte offset `extractFrontmatter`-equivalent frontmatter length. Named source must exist under `core/skills` or `domains/<domain>/skills`, map to the exact target suffix, retain identical frontmatter bytes and yield exact source-plus-header output; inherited plugin/Claude files must match `.agents` bytes. Wrappers checked original marker count, frontmatter and assembled provenance. This is temporary inventory evidence, not a new committed prose/roster test.

| Lane | Markdown | Positioned headers | Thin wrappers | With frontmatter | SKILL.md |
|---|---:|---:|---:|---:|---:|
| agents | 53 | 53 | 0 | 19 | 19 |
| plugin | 48 | 48 | 0 | 18 | 18 |
| claude | 42 | 23 | 19 | 19 | 19 |

Current total 143 vs copied baseline 138 is explained by requested **distill** Claude coverage: baseline counted only 37 fgos Claude Markdown, current coverage includes those 37 plus 5 distill Markdown = 42. Agents remains 53; plugin remains 48. Claude has 18 fgos wrappers + 1 distill wrapper, 19 fgos subsidiary Markdown + 4 distill subsidiary Markdown. No generated-target file lacks both header and marker. Source-path, positioning, frontmatter, content/mirror errors all **0**.

### Per-file source mapping

For assembly rows, frontmatter length is also header offset. Wrapper source is its assembled redirect; wrapper intentionally uses unchanged thin marker instead of assembly header.

| Target | Kind | Source | Frontmatter bytes |
|---|---|---|---:|
| `.agents/skills/_shared/capability-catalog.md` | assembly | `core/skills/_shared/capability-catalog.md` | 0 |
| `.agents/skills/_shared/capability-matching.md` | assembly | `core/skills/_shared/capability-matching.md` | 0 |
| `.agents/skills/_shared/catchup-self-recovery.md` | assembly | `core/skills/_shared/catchup-self-recovery.md` | 0 |
| `.agents/skills/_shared/citation-format.md` | assembly | `core/skills/_shared/citation-format.md` | 0 |
| `.agents/skills/_shared/coding-cell-policy.md` | assembly | `domains/coding/skills/_shared/coding-cell-policy.md` | 0 |
| `.agents/skills/_shared/coding-worker-contract.md` | assembly | `core/skills/_shared/coding-worker-contract.md` | 0 |
| `.agents/skills/_shared/coordination-driver.md` | assembly | `core/skills/_shared/coordination-driver.md` | 0 |
| `.agents/skills/_shared/executor-dispatch-fallback.md` | assembly | `core/skills/_shared/executor-dispatch-fallback.md` | 0 |
| `.agents/skills/_shared/fgos-cli-fallback.md` | assembly | `core/skills/_shared/fgos-cli-fallback.md` | 0 |
| `.agents/skills/_shared/planning-capability-awareness.md` | assembly | `core/skills/_shared/planning-capability-awareness.md` | 0 |
| `.agents/skills/_shared/private-cell-worktree.md` | assembly | `core/skills/_shared/private-cell-worktree.md` | 0 |
| `.agents/skills/distill/CREATION-LOG.md` | assembly | `core/skills/distill/CREATION-LOG.md` | 0 |
| `.agents/skills/distill/SKILL.md` | assembly | `core/skills/distill/SKILL.md` | 1010 |
| `.agents/skills/distill/references/consult-protocol.md` | assembly | `core/skills/distill/references/consult-protocol.md` | 0 |
| `.agents/skills/distill/references/deep-dive-protocol.md` | assembly | `core/skills/distill/references/deep-dive-protocol.md` | 0 |
| `.agents/skills/distill/references/extract-rules.md` | assembly | `core/skills/distill/references/extract-rules.md` | 0 |
| `.agents/skills/fgos-architecture-panel/SKILL.md` | assembly | `core/skills/fgos-architecture-panel/SKILL.md` | 591 |
| `.agents/skills/fgos-clarifying/SKILL.md` | assembly | `core/skills/fgos-clarifying/SKILL.md` | 949 |
| `.agents/skills/fgos-coding-discovering/SKILL.md` | assembly | `domains/coding/skills/fgos-coding-discovering/SKILL.md` | 689 |
| `.agents/skills/fgos-coding-driving/SKILL.md` | assembly | `domains/coding/skills/fgos-coding-driving/SKILL.md` | 729 |
| `.agents/skills/fgos-coding-driving/references/caller-contract.md` | assembly | `domains/coding/skills/fgos-coding-driving/references/caller-contract.md` | 0 |
| `.agents/skills/fgos-coding-driving/references/loop-mechanics.md` | assembly | `domains/coding/skills/fgos-coding-driving/references/loop-mechanics.md` | 0 |
| `.agents/skills/fgos-coding-driving/references/reclaim-and-role-graph.md` | assembly | `domains/coding/skills/fgos-coding-driving/references/reclaim-and-role-graph.md` | 0 |
| `.agents/skills/fgos-coding-exploring/SKILL.md` | assembly | `domains/coding/skills/fgos-coding-exploring/SKILL.md` | 426 |
| `.agents/skills/fgos-coding-exploring/references/gate-mechanics.md` | assembly | `domains/coding/skills/fgos-coding-exploring/references/gate-mechanics.md` | 0 |
| `.agents/skills/fgos-coding-exploring/references/lock-decisions-and-write-context.md` | assembly | `domains/coding/skills/fgos-coding-exploring/references/lock-decisions-and-write-context.md` | 0 |
| `.agents/skills/fgos-coding-exploring/references/re-entry-from-planning.md` | assembly | `domains/coding/skills/fgos-coding-exploring/references/re-entry-from-planning.md` | 0 |
| `.agents/skills/fgos-coding-exploring/references/scope-and-reclaim.md` | assembly | `domains/coding/skills/fgos-coding-exploring/references/scope-and-reclaim.md` | 0 |
| `.agents/skills/fgos-coding-implement/SKILL.md` | assembly | `domains/coding/skills/fgos-coding-implement/SKILL.md` | 444 |
| `.agents/skills/fgos-coding-implement/references/implement-and-collaboration.md` | assembly | `domains/coding/skills/fgos-coding-implement/references/implement-and-collaboration.md` | 0 |
| `.agents/skills/fgos-coding-implement/references/return-mechanics.md` | assembly | `domains/coding/skills/fgos-coding-implement/references/return-mechanics.md` | 0 |
| `.agents/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md` | assembly | `domains/coding/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md` | 0 |
| `.agents/skills/fgos-coding-implement/references/worker-contract-and-orient.md` | assembly | `domains/coding/skills/fgos-coding-implement/references/worker-contract-and-orient.md` | 0 |
| `.agents/skills/fgos-coding-knowledge/SKILL.md` | assembly | `domains/coding/skills/fgos-coding-knowledge/SKILL.md` | 268 |
| `.agents/skills/fgos-coding-planning/SKILL.md` | assembly | `domains/coding/skills/fgos-coding-planning/SKILL.md` | 466 |
| `.agents/skills/fgos-coding-planning/references/approach-and-shape.md` | assembly | `domains/coding/skills/fgos-coding-planning/references/approach-and-shape.md` | 0 |
| `.agents/skills/fgos-coding-planning/references/bootstrap-and-lane.md` | assembly | `domains/coding/skills/fgos-coding-planning/references/bootstrap-and-lane.md` | 0 |
| `.agents/skills/fgos-coding-planning/references/split-and-child-specs.md` | assembly | `domains/coding/skills/fgos-coding-planning/references/split-and-child-specs.md` | 0 |
| `.agents/skills/fgos-coding-planning/references/verify-sync-and-gap.md` | assembly | `domains/coding/skills/fgos-coding-planning/references/verify-sync-and-gap.md` | 0 |
| `.agents/skills/fgos-coding-shaping/SKILL.md` | assembly | `domains/coding/skills/fgos-coding-shaping/SKILL.md` | 800 |
| `.agents/skills/fgos-coding-validating/SKILL.md` | assembly | `domains/coding/skills/fgos-coding-validating/SKILL.md` | 521 |
| `.agents/skills/fgos-coding-validating/references/bootstrap-and-reality-gate.md` | assembly | `domains/coding/skills/fgos-coding-validating/references/bootstrap-and-reality-gate.md` | 0 |
| `.agents/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md` | assembly | `domains/coding/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md` | 0 |
| `.agents/skills/fgos-coding-validating/references/gate-tier-a-b-triggers.md` | assembly | `domains/coding/skills/fgos-coding-validating/references/gate-tier-a-b-triggers.md` | 0 |
| `.agents/skills/fgos-fanout/SKILL.md` | assembly | `core/skills/fgos-fanout/SKILL.md` | 1046 |
| `.agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md` | assembly | `core/skills/fgos-fanout/references/wave-dispatch-mechanics.md` | 0 |
| `.agents/skills/fgos-group-thinking/SKILL.md` | assembly | `core/skills/fgos-group-thinking/SKILL.md` | 700 |
| `.agents/skills/fgos-indexing/SKILL.md` | assembly | `core/skills/fgos-indexing/SKILL.md` | 580 |
| `.agents/skills/fgos-panel/SKILL.md` | assembly | `core/skills/fgos-panel/SKILL.md` | 685 |
| `.agents/skills/fgos-researching/SKILL.md` | assembly | `core/skills/fgos-researching/SKILL.md` | 806 |
| `.agents/skills/fgos-routing/SKILL.md` | assembly | `core/skills/fgos-routing/SKILL.md` | 472 |
| `.agents/skills/fgos-run/SKILL.md` | assembly | `core/skills/fgos-run/SKILL.md` | 217 |
| `.agents/skills/fgos-unlock/SKILL.md` | assembly | `core/skills/fgos-unlock/SKILL.md` | 381 |
| `plugins/fgOS/skills/_shared/capability-catalog.md` | assembly | `core/skills/_shared/capability-catalog.md` | 0 |
| `plugins/fgOS/skills/_shared/capability-matching.md` | assembly | `core/skills/_shared/capability-matching.md` | 0 |
| `plugins/fgOS/skills/_shared/catchup-self-recovery.md` | assembly | `core/skills/_shared/catchup-self-recovery.md` | 0 |
| `plugins/fgOS/skills/_shared/citation-format.md` | assembly | `core/skills/_shared/citation-format.md` | 0 |
| `plugins/fgOS/skills/_shared/coding-cell-policy.md` | assembly | `domains/coding/skills/_shared/coding-cell-policy.md` | 0 |
| `plugins/fgOS/skills/_shared/coding-worker-contract.md` | assembly | `core/skills/_shared/coding-worker-contract.md` | 0 |
| `plugins/fgOS/skills/_shared/coordination-driver.md` | assembly | `core/skills/_shared/coordination-driver.md` | 0 |
| `plugins/fgOS/skills/_shared/executor-dispatch-fallback.md` | assembly | `core/skills/_shared/executor-dispatch-fallback.md` | 0 |
| `plugins/fgOS/skills/_shared/fgos-cli-fallback.md` | assembly | `core/skills/_shared/fgos-cli-fallback.md` | 0 |
| `plugins/fgOS/skills/_shared/planning-capability-awareness.md` | assembly | `core/skills/_shared/planning-capability-awareness.md` | 0 |
| `plugins/fgOS/skills/_shared/private-cell-worktree.md` | assembly | `core/skills/_shared/private-cell-worktree.md` | 0 |
| `plugins/fgOS/skills/fgos-architecture-panel/SKILL.md` | assembly | `core/skills/fgos-architecture-panel/SKILL.md` | 591 |
| `plugins/fgOS/skills/fgos-clarifying/SKILL.md` | assembly | `core/skills/fgos-clarifying/SKILL.md` | 949 |
| `plugins/fgOS/skills/fgos-coding-discovering/SKILL.md` | assembly | `domains/coding/skills/fgos-coding-discovering/SKILL.md` | 689 |
| `plugins/fgOS/skills/fgos-coding-driving/SKILL.md` | assembly | `domains/coding/skills/fgos-coding-driving/SKILL.md` | 729 |
| `plugins/fgOS/skills/fgos-coding-driving/references/caller-contract.md` | assembly | `domains/coding/skills/fgos-coding-driving/references/caller-contract.md` | 0 |
| `plugins/fgOS/skills/fgos-coding-driving/references/loop-mechanics.md` | assembly | `domains/coding/skills/fgos-coding-driving/references/loop-mechanics.md` | 0 |
| `plugins/fgOS/skills/fgos-coding-driving/references/reclaim-and-role-graph.md` | assembly | `domains/coding/skills/fgos-coding-driving/references/reclaim-and-role-graph.md` | 0 |
| `plugins/fgOS/skills/fgos-coding-exploring/SKILL.md` | assembly | `domains/coding/skills/fgos-coding-exploring/SKILL.md` | 426 |
| `plugins/fgOS/skills/fgos-coding-exploring/references/gate-mechanics.md` | assembly | `domains/coding/skills/fgos-coding-exploring/references/gate-mechanics.md` | 0 |
| `plugins/fgOS/skills/fgos-coding-exploring/references/lock-decisions-and-write-context.md` | assembly | `domains/coding/skills/fgos-coding-exploring/references/lock-decisions-and-write-context.md` | 0 |
| `plugins/fgOS/skills/fgos-coding-exploring/references/re-entry-from-planning.md` | assembly | `domains/coding/skills/fgos-coding-exploring/references/re-entry-from-planning.md` | 0 |
| `plugins/fgOS/skills/fgos-coding-exploring/references/scope-and-reclaim.md` | assembly | `domains/coding/skills/fgos-coding-exploring/references/scope-and-reclaim.md` | 0 |
| `plugins/fgOS/skills/fgos-coding-implement/SKILL.md` | assembly | `domains/coding/skills/fgos-coding-implement/SKILL.md` | 444 |
| `plugins/fgOS/skills/fgos-coding-implement/references/implement-and-collaboration.md` | assembly | `domains/coding/skills/fgos-coding-implement/references/implement-and-collaboration.md` | 0 |
| `plugins/fgOS/skills/fgos-coding-implement/references/return-mechanics.md` | assembly | `domains/coding/skills/fgos-coding-implement/references/return-mechanics.md` | 0 |
| `plugins/fgOS/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md` | assembly | `domains/coding/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md` | 0 |
| `plugins/fgOS/skills/fgos-coding-implement/references/worker-contract-and-orient.md` | assembly | `domains/coding/skills/fgos-coding-implement/references/worker-contract-and-orient.md` | 0 |
| `plugins/fgOS/skills/fgos-coding-knowledge/SKILL.md` | assembly | `domains/coding/skills/fgos-coding-knowledge/SKILL.md` | 268 |
| `plugins/fgOS/skills/fgos-coding-planning/SKILL.md` | assembly | `domains/coding/skills/fgos-coding-planning/SKILL.md` | 466 |
| `plugins/fgOS/skills/fgos-coding-planning/references/approach-and-shape.md` | assembly | `domains/coding/skills/fgos-coding-planning/references/approach-and-shape.md` | 0 |
| `plugins/fgOS/skills/fgos-coding-planning/references/bootstrap-and-lane.md` | assembly | `domains/coding/skills/fgos-coding-planning/references/bootstrap-and-lane.md` | 0 |
| `plugins/fgOS/skills/fgos-coding-planning/references/split-and-child-specs.md` | assembly | `domains/coding/skills/fgos-coding-planning/references/split-and-child-specs.md` | 0 |
| `plugins/fgOS/skills/fgos-coding-planning/references/verify-sync-and-gap.md` | assembly | `domains/coding/skills/fgos-coding-planning/references/verify-sync-and-gap.md` | 0 |
| `plugins/fgOS/skills/fgos-coding-shaping/SKILL.md` | assembly | `domains/coding/skills/fgos-coding-shaping/SKILL.md` | 800 |
| `plugins/fgOS/skills/fgos-coding-validating/SKILL.md` | assembly | `domains/coding/skills/fgos-coding-validating/SKILL.md` | 521 |
| `plugins/fgOS/skills/fgos-coding-validating/references/bootstrap-and-reality-gate.md` | assembly | `domains/coding/skills/fgos-coding-validating/references/bootstrap-and-reality-gate.md` | 0 |
| `plugins/fgOS/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md` | assembly | `domains/coding/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md` | 0 |
| `plugins/fgOS/skills/fgos-coding-validating/references/gate-tier-a-b-triggers.md` | assembly | `domains/coding/skills/fgos-coding-validating/references/gate-tier-a-b-triggers.md` | 0 |
| `plugins/fgOS/skills/fgos-fanout/SKILL.md` | assembly | `core/skills/fgos-fanout/SKILL.md` | 1046 |
| `plugins/fgOS/skills/fgos-fanout/references/wave-dispatch-mechanics.md` | assembly | `core/skills/fgos-fanout/references/wave-dispatch-mechanics.md` | 0 |
| `plugins/fgOS/skills/fgos-group-thinking/SKILL.md` | assembly | `core/skills/fgos-group-thinking/SKILL.md` | 700 |
| `plugins/fgOS/skills/fgos-indexing/SKILL.md` | assembly | `core/skills/fgos-indexing/SKILL.md` | 580 |
| `plugins/fgOS/skills/fgos-panel/SKILL.md` | assembly | `core/skills/fgos-panel/SKILL.md` | 685 |
| `plugins/fgOS/skills/fgos-researching/SKILL.md` | assembly | `core/skills/fgos-researching/SKILL.md` | 806 |
| `plugins/fgOS/skills/fgos-routing/SKILL.md` | assembly | `core/skills/fgos-routing/SKILL.md` | 472 |
| `plugins/fgOS/skills/fgos-run/SKILL.md` | assembly | `core/skills/fgos-run/SKILL.md` | 217 |
| `plugins/fgOS/skills/fgos-unlock/SKILL.md` | assembly | `core/skills/fgos-unlock/SKILL.md` | 381 |
| `.claude/skills/distill/CREATION-LOG.md` | assembly | `core/skills/distill/CREATION-LOG.md` | 0 |
| `.claude/skills/distill/SKILL.md` | wrapper | `.agents/skills/distill/SKILL.md` | 1010 |
| `.claude/skills/distill/references/consult-protocol.md` | assembly | `core/skills/distill/references/consult-protocol.md` | 0 |
| `.claude/skills/distill/references/deep-dive-protocol.md` | assembly | `core/skills/distill/references/deep-dive-protocol.md` | 0 |
| `.claude/skills/distill/references/extract-rules.md` | assembly | `core/skills/distill/references/extract-rules.md` | 0 |
| `.claude/skills/fgos-architecture-panel/SKILL.md` | wrapper | `.agents/skills/fgos-architecture-panel/SKILL.md` | 591 |
| `.claude/skills/fgos-clarifying/SKILL.md` | wrapper | `.agents/skills/fgos-clarifying/SKILL.md` | 949 |
| `.claude/skills/fgos-coding-discovering/SKILL.md` | wrapper | `.agents/skills/fgos-coding-discovering/SKILL.md` | 689 |
| `.claude/skills/fgos-coding-driving/SKILL.md` | wrapper | `.agents/skills/fgos-coding-driving/SKILL.md` | 729 |
| `.claude/skills/fgos-coding-driving/references/caller-contract.md` | assembly | `domains/coding/skills/fgos-coding-driving/references/caller-contract.md` | 0 |
| `.claude/skills/fgos-coding-driving/references/loop-mechanics.md` | assembly | `domains/coding/skills/fgos-coding-driving/references/loop-mechanics.md` | 0 |
| `.claude/skills/fgos-coding-driving/references/reclaim-and-role-graph.md` | assembly | `domains/coding/skills/fgos-coding-driving/references/reclaim-and-role-graph.md` | 0 |
| `.claude/skills/fgos-coding-exploring/SKILL.md` | wrapper | `.agents/skills/fgos-coding-exploring/SKILL.md` | 426 |
| `.claude/skills/fgos-coding-exploring/references/gate-mechanics.md` | assembly | `domains/coding/skills/fgos-coding-exploring/references/gate-mechanics.md` | 0 |
| `.claude/skills/fgos-coding-exploring/references/lock-decisions-and-write-context.md` | assembly | `domains/coding/skills/fgos-coding-exploring/references/lock-decisions-and-write-context.md` | 0 |
| `.claude/skills/fgos-coding-exploring/references/re-entry-from-planning.md` | assembly | `domains/coding/skills/fgos-coding-exploring/references/re-entry-from-planning.md` | 0 |
| `.claude/skills/fgos-coding-exploring/references/scope-and-reclaim.md` | assembly | `domains/coding/skills/fgos-coding-exploring/references/scope-and-reclaim.md` | 0 |
| `.claude/skills/fgos-coding-implement/SKILL.md` | wrapper | `.agents/skills/fgos-coding-implement/SKILL.md` | 444 |
| `.claude/skills/fgos-coding-implement/references/implement-and-collaboration.md` | assembly | `domains/coding/skills/fgos-coding-implement/references/implement-and-collaboration.md` | 0 |
| `.claude/skills/fgos-coding-implement/references/return-mechanics.md` | assembly | `domains/coding/skills/fgos-coding-implement/references/return-mechanics.md` | 0 |
| `.claude/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md` | assembly | `domains/coding/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md` | 0 |
| `.claude/skills/fgos-coding-implement/references/worker-contract-and-orient.md` | assembly | `domains/coding/skills/fgos-coding-implement/references/worker-contract-and-orient.md` | 0 |
| `.claude/skills/fgos-coding-knowledge/SKILL.md` | wrapper | `.agents/skills/fgos-coding-knowledge/SKILL.md` | 268 |
| `.claude/skills/fgos-coding-planning/SKILL.md` | wrapper | `.agents/skills/fgos-coding-planning/SKILL.md` | 466 |
| `.claude/skills/fgos-coding-planning/references/approach-and-shape.md` | assembly | `domains/coding/skills/fgos-coding-planning/references/approach-and-shape.md` | 0 |
| `.claude/skills/fgos-coding-planning/references/bootstrap-and-lane.md` | assembly | `domains/coding/skills/fgos-coding-planning/references/bootstrap-and-lane.md` | 0 |
| `.claude/skills/fgos-coding-planning/references/split-and-child-specs.md` | assembly | `domains/coding/skills/fgos-coding-planning/references/split-and-child-specs.md` | 0 |
| `.claude/skills/fgos-coding-planning/references/verify-sync-and-gap.md` | assembly | `domains/coding/skills/fgos-coding-planning/references/verify-sync-and-gap.md` | 0 |
| `.claude/skills/fgos-coding-shaping/SKILL.md` | wrapper | `.agents/skills/fgos-coding-shaping/SKILL.md` | 800 |
| `.claude/skills/fgos-coding-validating/SKILL.md` | wrapper | `.agents/skills/fgos-coding-validating/SKILL.md` | 521 |
| `.claude/skills/fgos-coding-validating/references/bootstrap-and-reality-gate.md` | assembly | `domains/coding/skills/fgos-coding-validating/references/bootstrap-and-reality-gate.md` | 0 |
| `.claude/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md` | assembly | `domains/coding/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md` | 0 |
| `.claude/skills/fgos-coding-validating/references/gate-tier-a-b-triggers.md` | assembly | `domains/coding/skills/fgos-coding-validating/references/gate-tier-a-b-triggers.md` | 0 |
| `.claude/skills/fgos-fanout/SKILL.md` | wrapper | `.agents/skills/fgos-fanout/SKILL.md` | 1046 |
| `.claude/skills/fgos-fanout/references/wave-dispatch-mechanics.md` | assembly | `core/skills/fgos-fanout/references/wave-dispatch-mechanics.md` | 0 |
| `.claude/skills/fgos-group-thinking/SKILL.md` | wrapper | `.agents/skills/fgos-group-thinking/SKILL.md` | 700 |
| `.claude/skills/fgos-indexing/SKILL.md` | wrapper | `.agents/skills/fgos-indexing/SKILL.md` | 580 |
| `.claude/skills/fgos-panel/SKILL.md` | wrapper | `.agents/skills/fgos-panel/SKILL.md` | 685 |
| `.claude/skills/fgos-researching/SKILL.md` | wrapper | `.agents/skills/fgos-researching/SKILL.md` | 806 |
| `.claude/skills/fgos-routing/SKILL.md` | wrapper | `.agents/skills/fgos-routing/SKILL.md` | 472 |
| `.claude/skills/fgos-run/SKILL.md` | wrapper | `.agents/skills/fgos-run/SKILL.md` | 217 |
| `.claude/skills/fgos-unlock/SKILL.md` | wrapper | `.agents/skills/fgos-unlock/SKILL.md` | 381 |

### Handwritten plugin exclusions

- `plugins/fgOS/skills/answer/SKILL.md`
- `plugins/fgOS/skills/approve/SKILL.md`
- `plugins/fgOS/skills/ask/SKILL.md`
- `plugins/fgOS/skills/cleanup-loop/SKILL.md`
- `plugins/fgOS/skills/cleanup-next/SKILL.md`
- `plugins/fgOS/skills/coding-shape/SKILL.md`
- `plugins/fgOS/skills/coding-shape-distill/SKILL.md`
- `plugins/fgOS/skills/conflicts/SKILL.md`
- `plugins/fgOS/skills/cook/SKILL.md`
- `plugins/fgOS/skills/discover/SKILL.md`
- `plugins/fgOS/skills/discover-loop/SKILL.md`
- `plugins/fgOS/skills/discover-next/SKILL.md`
- `plugins/fgOS/skills/goal/SKILL.md`
- `plugins/fgOS/skills/graph/SKILL.md`
- `plugins/fgOS/skills/list/SKILL.md`
- `plugins/fgOS/skills/merge-list/SKILL.md`
- `plugins/fgOS/skills/merge-loop/SKILL.md`
- `plugins/fgOS/skills/merge-loop/references/blocked-pick-decision-tree.md`
- `plugins/fgOS/skills/merge-next/SKILL.md`
- `plugins/fgOS/skills/metrics/SKILL.md`
- `plugins/fgOS/skills/move/SKILL.md`
- `plugins/fgOS/skills/pick/SKILL.md`
- `plugins/fgOS/skills/plan/SKILL.md`
- `plugins/fgOS/skills/plan-loop/SKILL.md`
- `plugins/fgOS/skills/plan-next/SKILL.md`
- `plugins/fgOS/skills/ready/SKILL.md`
- `plugins/fgOS/skills/retro-loop/SKILL.md`
- `plugins/fgOS/skills/retro-next/SKILL.md`
- `plugins/fgOS/skills/return/SKILL.md`
- `plugins/fgOS/skills/rollup/SKILL.md`
- `plugins/fgOS/skills/show/SKILL.md`
- `plugins/fgOS/skills/stale/SKILL.md`
- `plugins/fgOS/skills/submit/SKILL.md`
- `plugins/fgOS/skills/terminal/SKILL.md`
- `plugins/fgOS/skills/terminal-close/SKILL.md`
- `plugins/fgOS/skills/triage/SKILL.md`
- `plugins/fgOS/skills/unlock/SKILL.md`

## Cleanup, evidence and remaining gate

Original smoke `finally` removed its owned `fgos-header-smoke-*` root, including external-layer fixture. Tester removed only owned `/tmp/header-tester-helper-kudj81xj` helper directory after extraction/execution. No historical artifact/temp directory was deleted. Full exact fixture stdout, test command/stdout/stderr, source mappings and exclusions retained as `local://phase-02-tests-evidence.json` (new tester-owned evidence).

Preserved pre-fix handoff: no source changes or silent fixes by tester; at this measurement's conclusion coordinator still needed to apply the concurrent-publication fix and verify it. That correction and focused final verification are now recorded at the top of this report. Phase06 owns whole-suite verification. Native release/restaged installed-shim doctor remains a separate lane and is not claimed here. Historical20 identity reconciliation cannot be asserted beyond the independently mapped current20 and explicitly absent named test; bee-dependent cases remain skipped.
