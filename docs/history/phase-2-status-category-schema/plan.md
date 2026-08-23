---
type: plan
title: tsk-38t — Phase 2 multi-domain schema plan
timestamp: 2026-08-04T00:00:00.000Z
---

# plan.md — tsk-38t: Phase 2 multi-domain schema

## Mode

**high-risk.** Flag count: 5 of 10.

| Flag | Applies? | Why |
|---|---|---|
| Data model | YES | Adds `statusCategory` + `domainFields` to the core work-item schema. |
| Public contract | YES | `statusCategory` becomes a new contract every domain-agnostic consumer (frontier, rollup, outcome/friction, discovery-judge) reads. |
| Existing covered behavior | YES | Touches `status-fsm.mjs`, `frontier.mjs`, `retro-pool.mjs` — all covered by existing suites (`test/state/fsm.test.mjs`, `test/e2e/synthetic-domain.test.mjs`, `test/cli/fgos.test.mjs`) that must stay green (0 regression for coding). |
| Weak proof around the area | YES | Confirmed directly: 4 `fgos discover` attempts during `fgos-coding-exploring` were disputed because no shell one-liner can prove these invariants pre-implementation (`CONTEXT.md`'s verify note). |
| Multi-domain | YES | The entire point of the item. |
| Auth / authorization / audit-security / external systems / cross-platform | no | none apply |

A smaller mode (`standard`) would not honestly cover this: it supersedes a
locked architecture decision (base-workflow-model D1-D3), touches L3
(replay determinism), and the item's own `risk: high` / `tier: heavy`
fields (set before this plan) already agree.

## Approach

**Chosen path:** exactly D1-D6 from `CONTEXT.md` — front/tail status
split, `wontfix`→`canceled`, front-segment category table, backfill
migration script, `skillMap.retrospective` extension, `domainFields`
per report. No alternative path was considered during planning — D1-D6
were already locked through real Socratic back-and-forth in
`DISCUSSION.md` (12 rounds), including one already-rejected alternative
per decision (e.g. D1's rejected "domain owns the ENTIRE transition
table" reading, D2's rejected "rename `wontfix`" option). Re-litigating
those here would violate this skill's own rule against reopening a locked
`CONTEXT.md` decision.

**Impact-analysis posture:** degraded — GitNexus registered and `status:
present`, but its index is stale (`last indexed: 251d0b5`, confirmed by
this session's own PostToolUse hook). Every impact/blast-radius claim
below is cross-checked with `rg`/`grep` against real source, not trusted
from GitNexus alone.

**Risk map:**

| Component | Risk | What proves it (→ `fgos-coding-validating`) |
|---|---|---|
| `docs/decisions/` supersede record | Medium | Record exists, `supersedes` cites the base-workflow-model source, lists every real `status-fsm.mjs`/`STATUSES` consumer (not a partial list). |
| Schema (`work.mjs`, `workflow-stage-graphs.mjs`, `store.mjs`) | High | `STATUS_CATEGORIES` frozen constant exists; `statusCategory` written on `work.move`/`work.add` and never re-derived on replay (L3). |
| Backfill migration | High | Dry-run report matches real event count; `git diff` on `.fgos/events.jsonl` after a real run touches ONLY `statusCategory`, no other field/value. |
| Consumer migration (`frontier.mjs`, rollup, outcome/friction, discovery-judge) | High | Full `npm test` green (0 regression, per D1's promise) + new tests with a second, differently-labeled domain proving category-based reads work. |
| `skillMap.retrospective` | Low | `DOMAINS.coding.skillMap.retrospective` resolves; `fgOS:retro-next` loads the domain's configured skill, not `fgos-coding-compounding` unconditionally. |
| `domainFields` | Low-Medium | `EDITABLE_FIELDS` includes it; `fieldSchema`-based validation rejects a bad shape for a domain that declares one, accepts absence for one that doesn't. |

**Files likely touched:** `docs/decisions/<new>.md`, `src/state/work.mjs`,
`src/state/workflow-stage-graphs.mjs`, `src/state/store.mjs`,
`src/state/frontier.mjs`, `src/state/retro-pool.mjs` (only if a real gap
surfaces — D1 says its literal check stays correct), `.claude/skills`'s
`fgOS:retro-next` skill file, `scripts/<new-migration>.mjs`,
`docs/reference/triage-table-columns.md`, plus new test files.

**Order (dependency-driven, matches `DISCUSSION.md` §7's relationship
notes — `fgos graph --what-if` deferred to child-creation time below,
since these children don't exist yet to compare):**

1. Decision record (blocks everything — nothing else should land without it existing first, per the item's own acceptance clause 3).
2. Schema (`statusCategory` + registry) — depends on 1.
3. Backfill + Consumer migration — depend on 2, independent of each other (different files: `.fgos/events.jsonl` rewrite vs `frontier.mjs`/rollup reads), can run in parallel.
4. `skillMap.retrospective` + `domainFields` — independent of 2/3 (different file regions), can run any time after 1, including in parallel with 2/3.
5. Second-domain test — depends on ALL of 2-4 (it is the proof that the whole design holds together).
6. Doc gap (`triage-table-columns.md`) — fully independent, any time.

## Split

Eight pieces — one honest piece each does not cover this item (the
`weak proof` flag alone means each needs its own real verify, not one
combined one). Created (2026-08-04), each `parent: tsk-38t`:

1. **`tsk-38t-1`** — Decision record: supersede base-workflow-model D1-D3
   verify: `grep -lq "2ae492d8" docs/decisions/*.md 2>/dev/null`
2. **`tsk-38t-2`** (deps: `tsk-38t-1`) — Schema: statusCategory + domain registry (D2/D3)
   verify: `node -e "import('./src/state/work.mjs').then(m=>process.exit(m.STATUS_CATEGORIES?0:1))"`
3. **`tsk-38t-3`** (deps: `tsk-38t-2`) — Backfill statusCategory for historical events (D4)
   verify: checks every historical front-segment `work.move` event carries `statusCategory`
4. **`tsk-38t-4`** (deps: `tsk-38t-2`) — Consumer migration to statusCategory (frontier ready-filter, `RESOLVED_STATUSES` hybrid, rollup, outcome/friction, discovery-judge)
   verify: `npm test`
5. **`tsk-38t-5`** (deps: `tsk-38t-1`) — skillMap['retrospective'] per-domain (D5)
   verify: `node -e "import('./src/state/workflow-stage-graphs.mjs').then(g=>process.exit(g.DOMAINS.coding.skillMap.retrospective?0:1))"`
6. **`tsk-38t-6`** (deps: `tsk-38t-1`) — domainFields nested per-domain (D6)
   verify: `grep -q "'domainFields'" src/state/store.mjs`
7. **`tsk-38t-7`** (deps: `tsk-38t-2`,`tsk-38t-3`,`tsk-38t-4`,`tsk-38t-5`,`tsk-38t-6`) — Test domain giả lập thứ 2 chứng minh thiết kế
   verify: confirms a real non-fixture domain with actual transitions exists, plus `npm test`
8. **`tsk-38t-8`** (no deps) — Doc gap: triage-table-columns.md
   verify: `grep -q "delivered" docs/reference/triage-table-columns.md`

## Assumptions (unproven, flagged for `fgos-coding-validating`)

- The exact filename/id the decision-record piece picks is not fixed here
  — verify checks for the source content-hash `2ae492d8` (already cited
  in `work-state.md`/`frontier.mjs` comments as base-workflow-model's own
  ID), not a guessed filename.
- **RESOLVED (2026-08-04):** `tsk-f38`'s rename of skill `fgos-executing` →
  `fgos-coding-implement` merged to `main` (588bfb2). Confirmed for real
  (not assumed): the rename only changes the VALUE of the existing
  `executing` key in `DOMAINS.coding.skillMap`
  (`workflow-stage-graphs.mjs:90`) — no structural change, no key overlap
  with piece 5's planned `retrospective` key addition. `fgw/tsk-38t`
  merged `main` cleanly (no conflicts) to pick this up. No longer a live
  risk.
- Acceptance criteria on the parent `tsk-38t` (9 clauses, pre-dates D1-D6)
  needs rewriting to match — clause 5 (combine explore with `tsk-3p1`) is
  stale (`tsk-3p1` is `wontfix`); clause 1 assumes the OLD 10-status
  category compression D1 already narrowed. Whoever executes should not
  treat the original clauses as binding without checking them against
  `CONTEXT.md`.
