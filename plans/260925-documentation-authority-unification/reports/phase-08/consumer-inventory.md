# Phase 8 consumer inventory — planning seed

Author: `codex-session:fgos-run_unit-run-1792366642fb4c@2026-10-19`. Input commit: `49ad04648447439b5c243af6ddd0b604acb5b3e5`. No consumer is edited by this turn.

The [machine inventory](consumer-inventory.json) is a tracked-file lexical census with per-file SHA-256, line locations, matched path spellings and categories. It is not a completed semantic reader/writer classification. Step 2 must close dynamic/relative/wrapped-path gaps before claiming the Requirements complete.

Scanned 8,818 UTF-8 regular files, skipping `.fgos/**` entirely and this plan's own evidence. Found 2,276 files mentioning the defined legacy roots; history and payload mentions are included rather than silently treated as rewrite instructions.

| Category | Files |
|---|---:|
| cli-help | 2 |
| generated-render | 15 |
| generators-and-checks | 21 |
| historical-review-before-rewrite | 1155 |
| immutable-evidence-payload | 390 |
| instructions | 1 |
| reading-maps-portals-and-docs | 543 |
| runtime-and-comments | 65 |
| setup-doctor | 3 |
| skills-and-prompts | 15 |
| tests-and-fixtures | 66 |

## The 22 skill/task-spec files

The historical count of 22 reproduces at this pin: 13 files contain the literal `docs/history/<feature>/plan.md` convention; nine name the historical agent-coordination plan. Preserve the distinction. A reference to a historical plan is not by itself a writer instruction. Domain sources also own coding skills; edit `domains/coding/skills/**` where its generated header names that source. `core/skills/**` owns shared/platform skills; `.agents/skills/**` and `plugins/fgOS/skills/**` are generated renders.

| File | Lines | Classification |
|---|---|---|
| `.agents/skills/_shared/capability-catalog.md` | 6 | named-historical-plan-reference; render |
| `.agents/skills/_shared/executor-dispatch-fallback.md` | 34 | named-historical-plan-reference; render |
| `.agents/skills/_shared/planning-capability-awareness.md` | 8 | named-historical-plan-reference; render |
| `.agents/skills/fgos-coding-planning/SKILL.md` | 17 | literal-plan-convention; render |
| `.agents/skills/fgos-coding-planning/references/verify-sync-and-gap.md` | 65, 69 | literal-plan-convention; render |
| `.agents/skills/fgos-coding-validating/SKILL.md` | 16 | literal-plan-convention; render |
| `.agents/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md` | 15 | literal-plan-convention; render |
| `core/skills/_shared/capability-catalog.md` | 5 | named-historical-plan-reference; source |
| `core/skills/_shared/executor-dispatch-fallback.md` | 33 | named-historical-plan-reference; source |
| `core/skills/_shared/planning-capability-awareness.md` | 7 | named-historical-plan-reference; source |
| `domains/coding/skills/fgos-coding-planning/SKILL.md` | 16 | literal-plan-convention; source |
| `domains/coding/skills/fgos-coding-planning/references/verify-sync-and-gap.md` | 64, 68 | literal-plan-convention; source |
| `domains/coding/skills/fgos-coding-validating/SKILL.md` | 15 | literal-plan-convention; source |
| `domains/coding/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md` | 14 | literal-plan-convention; source |
| `domains/coding/task-specs/shape-plan.md` | 12 | literal-plan-convention; source |
| `plugins/fgOS/skills/_shared/capability-catalog.md` | 6 | named-historical-plan-reference; render |
| `plugins/fgOS/skills/_shared/executor-dispatch-fallback.md` | 34 | named-historical-plan-reference; render |
| `plugins/fgOS/skills/_shared/planning-capability-awareness.md` | 8 | named-historical-plan-reference; render |
| `plugins/fgOS/skills/fgos-coding-planning/SKILL.md` | 17 | literal-plan-convention; render |
| `plugins/fgOS/skills/fgos-coding-planning/references/verify-sync-and-gap.md` | 65, 69 | literal-plan-convention; render |
| `plugins/fgOS/skills/fgos-coding-validating/SKILL.md` | 16 | literal-plan-convention; render |
| `plugins/fgOS/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md` | 15 | literal-plan-convention; render |

## Evidence payload consumers

The policy's approximately 190-file population is refreshed lexically: 212 non-payload files mention an evidence-root form, 194 include the legacy form. These counts exclude `.fgos` and this plan, and include immutable history. They are not 194 rewrite candidates. Exact file/line/category rows are in `evidenceConsumerFiles` in the JSON.

Read the policy §3 table as the semantic baseline: comments, fixtures, shipped links, area proof-preservation table, immutable records and tree walkers have different treatment. Re-measure the 867 mirror pairs and modes at Step 6; the old count is not a current digest manifest. Never rewrite payload bytes or recorded fixture history. Absolute `/home/` strings are not made resolvable by a repo-relative alias.

## Confirmed behavioral seam and completeness limits

`apps/fgos-gateway/src/gateway.rs:1187` opens `docs/contracts/fgos-gateway-api-v1.yaml` fresh for `GET /v1/contract`. It must join the runtime cutover/parity packet even though the broad legacy ratchet roots do not cover `docs/contracts`. The 47 Pilot B judgment edges are mandatory inputs before any consumer rewrite.

Reproduction: enumerate `git ls-files -z`; skip `.fgos/**`, this plan, symlinks/nonfiles and binary/non-UTF8 content; apply the three exact regular expressions stored in the JSON to each line, recording unique spellings and SHA-256. Root authorities come from the unchanged switchboard `rootDocuments`. Categories derive from path prefixes and are provisional. This is a light scan, not native inventory or D/E.

Unproven: ignored/external instruction surfaces, live work-item consumers (state reads forbidden here), arbitrary relative links, wrapped comments and computed paths. Step 2 must reconcile the existing inventory edge types and the older consumer survey, manually trace each discovered runtime construction, and obtain an authorized read-only export for live work-item fields. Never read secrets or state merely to inflate completeness.
