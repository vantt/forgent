# RESEARCH — tsk-397 review followups (tsk-3ti)

## Round 1 — 2026-08-20 — verify all 10 findings against current main HEAD (ae476f22)

**Asked:** Is each of the 10 findings from tsk-397's two independent reviews
(core-foundation vs domain-boundary reorg) still true/present in the
current code, or already fixed? Source: one located review report,
`plans/reports/discussion-review-260819-2122-tsk397-boundary-report.md`
(the "round1"/"round2" finding labels come from the item's own
description — the second round's standalone report file was not located
as a separate artifact; its content is only recoverable via the finding
labels embedded in the item text itself).

**Checked:** repo source directly (Explore agents, fanned out in parallel,
one per finding cluster), plus `git log -p` for finding 4's history claim.

**Found**, one line each with citation (full evidence in the fan-out
transcripts, condensed here):

1. **Still true.** `executorIdForWork` (`src/runner/dispatch/cli.mjs:76-80`)
   accepts `role` as its third param, never reads it. JSDoc at `cli.mjs:72-74`
   claims a `role ?? work?.holder ?? work?.role` resolution that doesn't
   exist in the body. All 3 call sites (lines 206, 607, 722) never pass a
   3rd arg.
2. **Still true.** `workflow-stage-graphs.mjs:308-320` spreads `registryData`
   AFTER the workflow-derived fields in `domainObj` — registry.yaml can
   silently override. `stage-fsm.mjs:94-95` and `plan.mjs:560-561` do the
   opposite (workflow value preferred, domain value only as fallback). Zero
   test references `registryData` (`grep -rn registryData test/` → no hits).
3. **Still true, plus new evidence.** `test/architecture.test.mjs`'s
   `extractImports` (lines 54-67) only regexes `import`/`export`/dynamic
   `import()` specifiers — no `path.join` detection. `find domains -name
   '*.mjs'` → 0 files, so the real (non-fixture) siloing check has never
   fired on real domain code. New: found 6 live `path.join(..., 'domains',
   ...)` call sites (`agent-roster.mjs:46`, `workflow-stage-graphs.mjs:244,706`,
   `registrations.mjs:438,539`, `skill-wrappers.mjs:125`) plus a hardcoded
   `'coding'` domain literal (`workflow-stage-graphs.mjs:72`
   `DEFAULT_DOMAIN`, `prompt-templates.mjs:36-37`) that the current
   import-only scan can never catch.
4. **Still true, confirmed via git history.** Neither
   `scripts/project-agents.mjs` nor `src/setup/registrations.mjs:470-493`
   (`extractSkillsFromYamlText`) carries the invariant comments today.
   Deleted in commit `f18c9e87` (tsk-397-12, project-agents.mjs: canonical
   root not under `.fgos/`, tool-scope authority, `resolveMainCheckoutRoot`
   rationale — ~55-60 lines) and commit `b4e8e621` (tsk-397-11,
   registrations.mjs: why `extractSkillsFromYamlText` hand-parses YAML
   instead of importing — doctor must run before `npm install` exists).
5. **Still true.** `docs/specs/reading-map.md:25` points to AGENTS.md's
   `## fgOS Workflow` section. `grep -n "fgOS Workflow" AGENTS.md` → no
   hits; that content now lives at `domains/coding/AGENTS.md` per current
   AGENTS.md:14.
6. **Still true.** `--stage` flag exists (`cli.mjs:868`, used at
   `cli.mjs:253`) but undocumented in: usage string (`cli.mjs:590,921`),
   AGENTS.md's "Four ways to call decide" (`AGENTS.md:99-104`), and
   `core/skills/_shared/executor-dispatch-fallback.md:60-64` (`.agents/`
   mirror byte-identical, same gap). No `.claude/skills/_shared/` dir
   exists in this repo.
7. **Still true.** `resolveAgentTypeForTaskSpec`'s fail-open pattern
   (`currentAgentType || agentDefs[0]?.name ?? null` instead of refusing)
   recurs at 4 points: `cli.mjs:90` (no taskSpecHeader), `:101` (pinned
   agent not in roster → `pinnedAgents[0]` verbatim), `:110` (no
   requires-skill), `:126` (no agent matches requires-skill).
8. **Doc-only, never a literal field — genuine scope question.** No `soul`
   key anywhere in code/schema/yaml (`scripts/project-agents.mjs:19`
   `REQUIRED_FIELDS` has no `soul`). D20's intent (agent-type declares
   "what it has") is materialized as `role`+`persona` fields instead
   (present in every `core/agents/*.yaml`). The 251 other "soul" hits in
   the repo are the unrelated `needsSoul` dispatch-flag concept
   (`cli.mjs`, `dispatch-decide-hook.mjs`) — a session-liveness flag, not
   an agent-type schema field. Open question for planning: is this a real
   gap needing a literal field, or was D20's intent already satisfied by
   `role`+`persona` and only the doc language is stale?
9. **Dormant, not a live bug — scope decision still open.**
   `findAgentYamlFiles` (`scripts/project-agents.mjs:74-118`) still scans
   legacy `agents/` (line 115). D33's uniqueness check
   (`scripts/project-agents.mjs:166-190`) throws unconditionally on any
   name collision across sources, no legacy-loses softness. But the legacy
   `agents/` dir no longer exists at repo root (confirmed absent in both
   main checkout and this worktree) — `scanDir`'s `existsSync` guard
   short-circuits, so today this is latent, not firing. Item's own text
   frames this as "cần quyết định" (needs a decision): drop the legacy
   scan entirely, or keep it but lower its priority instead of additive —
   both are known, bounded implementation choices, not an unknown.
10. **Still true.** `assembleSkills` (`src/setup/skill-wrappers.mjs:122-162`)
    and `generateAllSkillWrappers` (`:62-90`) only add/overwrite, no prune
    step for orphaned wrappers whose source skill was deleted, and no
    collision check when two domains (or a domain and core) define the
    same skill name (`:142-159`, silent last-writer-wins). D33's existing
    agent-name uniqueness pattern (`scripts/project-agents.mjs:166-190`,
    `Map` + throw) is inline in `main()`, not exported/reusable, but is a
    ready-made pattern to port.

**Still open (deferred to planning, not blocking clear):**
- #8: literal `soul` field vs. doc-language fix — implementation-scope
  choice, not a product unknown (role+persona already covers the intent).
- #9: drop-vs-deprioritize legacy `agents/` scan — implementation-scope
  choice between two named, bounded options, item is dormant today.

## Verdict

`{clear: true, verify: "npm test"}` — all 10 findings are grounded in
current-code evidence (7 confirmed still-broken as described, 1 confirmed
dormant-not-firing, 1 confirmed doc-intent-only with a bounded scope
question, 1 confirmed already-fixed-nowhere/no regression). No point
depends on information only a person has; the two open sub-questions
(#8, #9) are bounded implementation choices for planning to resolve, not
gray product-intent gaps needing `exploring`. Existing repo test command
(`npm test` → `node --test 'test/**/*.test.mjs'`) is the real, runnable
verify — item had no real verify stamped yet (`"chưa xác định — P15 bổ
sung"` placeholder).
