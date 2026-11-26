---
contract: plan-v1
title: "A running plan widens its own footprint through one verb, inside the approved acceptance criteria"
status: ready
priority: P1
blockedBy: []
base: 052dd60b2e19cea913cad5217909d8414a3334ee
footprint:
  - plans/261127-0143-widen-running-plan-footprint/**
  - packages/supervision/rust/src/portfolio.rs
  - packages/supervision/rust/tests/portfolio.rs
  - apps/fgos/src/wiring/supervision.rs
  - apps/fgos/tests/supervision_verbs.rs
  - packages/host-runtime/contracts/command-manifest.json
  - src/cli/command-registry.mjs
  - src/session-host/head-request.mjs
  - test/session-host/head-request.test.mjs
  - packages/session-host/contracts/head-permissions.v1.json
  - packages/session-host/rust/tests/permissions.rs
  - packages/run-supervisor/contracts/head-request.v1.json
  - packages/run-supervisor/rust/tests/head_request.rs
  - core/skills/fgos-lead/SKILL.md
  - core/skills/fgos-supervisor/SKILL.md
  - docs/platform/supervision/spec.md
  - docs/platform/session-host/spec.md
  - changelog.d/261127-0143-a-running-plan-widens-its-own-footprint.md
source:
  - plans/discussions/ds-mzyircswox-widen-a-running-plan-footprint/DISCUSSION.md
  - p-lfsc4czpgh
created: 2026-11-27
---

# A running plan widens its own footprint through one verb

## Outcome

A lead whose unit is refused `write-outside-footprint` widens its own plan's footprint in one call, naming the
phase, the paths and the acceptance criterion they serve. The verb writes the path into both copies of the
footprint (the frontmatter `footprint:` list and the phase row), lands `plan.md`, and the same `run --writes` is
then accepted. No owner question, no supervisor wake, no hand edit. The supervisor runs the same verb for any
running plan. Every other way a lead changes its own footprint stays `footprint-change-refused` (PS-24 amended,
not dropped). A widened path that overlaps another active plan lands, and the answer names that plan.

Scope set by the owner order relayed by lead:SUPERVISOR on 2026-11-27: **D1 only** of discussion `ds-mzyircswox`,
priority P1 (after the eight goal plans), narrow footprint, built on the warning model of plan
`261126-2318-plan-footprint-overlap-warns` without touching its files while it runs.

### Facts (prior art, reused and missing)

- **Readers of the footprint.** Only the frontmatter list is read: `footprintOf` (`src/session-host/head-plan.mjs:110`)
  feeds the `run --writes` check (`head-request.mjs:384-391`) and both land routes (`head-request.mjs:292-312`).
  Unchanged here.
- **PS-24 today.** The land door refuses a lead paths land that changes any `plan.md` footprint against the trunk
  tip (`require_footprint_unchanged`, `packages/supervision/rust/src/land.rs:934`, proofs `tests/land.rs:1416-1498`).
  It applies only when the route passes `--footprint`, which it does for every lead `land`. Unchanged here: the
  widen verb is a separate door, so a plain lead land of `plan.md` keeps its refusal and its existing proofs.
- **Reused: the supervisor already edits `plan.md`.** `admitted_text` (`portfolio.rs:313`) edits frontmatter
  through the YAML document door, and the `admit` adapter (`apps/fgos/src/wiring/supervision.rs:737`) publishes it
  through `session_write_publish` (catch up, path-clean check, symlink guard, paths land). The widen verb is a
  second edit of the same kind through the same publisher; no new writer.
- **Reused: phase table and overlap.** `read_phase_table` (`portfolio.rs:182`) parses the phase rows;
  `running_overlaps` (`portfolio.rs:271`) asks `fgos_write_scope::colliding_pairs` for the shared entries. The
  widen's overlap advice extends that function to compare against every active plan; no new overlap rule
  (door `footprint-write-scope-overlap-rule`).
- **Warning model already live.** Keeper landed plan 2318's phases 1 and 2: the contract check reports cross-plan
  overlap as a warning (`scripts/plan-contract-check.mjs:5`) and admission no longer holds on it
  (`portfolio.rs:302-309`). The widen inherits that: overlap is advice, never a refusal.
- **Missing:** an edit of the phase footprint cell, a verb, a lead route to it, and the permission rows.

### Decisions this plan takes (inside D1)

- **Verb:** `fgos supervisor widen <plan-dir> --phase <id> --path <p> [--path <p> ...] --criterion <n>`, a
  subcommand of the supervision verbs, beside `supervisor plans` (the supervision area owns the portfolio).
- **Criterion check:** `<n>` is the number of an item in the plan's own "Acceptance criteria" numbered list; a
  number the list lacks is refused `criterion-not-found`. This is how "names the criterion it serves" becomes
  checkable: the owner approved that list, and a path the lead cannot tie to one item is a scope change it asks the
  owner about in the five-part form (D1). The commit message carries the phase, the paths and the criterion text.
- **Refusals:** `plan-not-found`; `plan-not-widenable` (status not `ready` or `running`); `phase-not-found`
  (no row with that id, or the row is `done` or `withdrawn`); `criterion-not-found`; `footprint-entry-invalid`
  (a path the write-scope package refuses, or one that starts with `-`); the publisher's own refusals
  (`write-branch-ahead`, `admission-path-dirty`, land refusals) pass through by code.
- **No-op:** a path the frontmatter already covers (same coverage rule as the run door) is not added to the
  frontmatter; it is still added to the phase cell when the cell lacks it. When neither copy changes the answer is
  `unchanged` and nothing is committed.
- **Answer (`--json`):** `{ plan, phase, criterion, added: [...], unchanged: [...], overlaps: [{ plan, paths }],
  commit | null }`.
- **Lead route:** the lead permission row `supervisor widen` has `policy: node`; `head-request.mjs` resolves the
  caller's own plan from the envelope (`planOfHead`), refuses `plan-not-own` when the argv names another plan, and
  runs the host verb on a ticket read by `request result`, as `land` does. The supervisor's row is a plain
  `forward` allow (secretary inherits it).

## Acceptance criteria

1. A lead whose `run --writes <p>` is refused `write-outside-footprint` calls `supervisor widen <own plan> --phase
   <id> --path <p> --criterion <n>`; `plan.md` lands with `<p>` in the frontmatter list and the phase row, and the
   same `run --writes <p>` is then accepted. One end-to-end test owns this in `test/session-host/head-request.test.mjs`.
2. The supervisor runs `fgos supervisor widen` for any running plan: `apps/fgos/tests/supervision_verbs.rs`.
3. A lead paths land of `plan.md` that changes the footprint is still `footprint-change-refused` (existing proofs
   in `packages/supervision/rust/tests/land.rs`, unchanged), and a lead naming another plan is refused
   `plan-not-own` (`test/session-host/head-request.test.mjs`).
4. A widened path that overlaps another active plan's footprint lands, and the answer's `overlaps` names that plan
   and the shared paths: `apps/fgos/tests/supervision_verbs.rs`.
5. `widened_text` writes both copies and keeps every other byte of `plan.md`; a criterion number outside the list,
   an ended phase and a non-active plan are refused by code: `cargo test -p fgos-supervision --test portfolio`.
6. The supervision spec states the amended PS-24 and the widen door, and its "Lịch sử quyết định" records the
   amendment with D1 (L5 question 6); the session-host spec's `land` row points to the widen door; the lead and
   supervisor skills name the verb; `changelog.d/` holds this plan's entry.
7. `npm test` and `cargo test --workspace` are green on the combined tree (`reports/integration.md`).

## Non-goals

- D2: ordering or rebase when a widened path overlaps another plan. Its own backlog item (`p-5iq6tnsjdl`).
- D3's contract-check drift rule (a phase path the frontmatter does not cover fails `plan-contract-check`) and D4
  (a planner starting for a plan with no discussion). Out by the owner order "D1 only"; they stay in the discussion
  for a later plan. The widen verb itself still writes both copies, so it never creates drift.
- Any change to `scripts/plan-contract-check.mjs` or `core/skills/_shared/plan-contract.md`.
- Any widening of the lead's write grant: it still writes only `plans/<its dir>`; the widen is a host verb.
- Narrowing or removing footprint entries; only additions.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| `fgos supervisor widen` verb and `widened_text` edit of `plan.md` | `supervision` | the supervision component owns the plan portfolio; same publisher as admission; `supervision/plan-vocabulary.v1` unchanged |
| Overlap advice of a widened plan against every active plan | `supervision`, `footprint-write-scope-overlap-rule` | extends `running_overlaps`; survivor: `running_overlaps` in packages/supervision/rust/src/portfolio.rs; retired: none |
| Lead and supervisor permission rows for `supervisor widen` | `session-host/head-permissions.v1` | one lead row (`policy: node`) and one supervisor row; data only |
| PS-24 amended: the widen verb is the one way a lead changes its own footprint | `supervision` | decision history entry in `docs/platform/supervision/spec.md`, cites D1 |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Widen verb in the supervision host](phase-01-widen-verb.md) | - | packages/supervision/rust/src/portfolio.rs, packages/supervision/rust/tests/portfolio.rs, apps/fgos/src/wiring/supervision.rs, apps/fgos/tests/supervision_verbs.rs, packages/host-runtime/contracts/command-manifest.json, src/cli/command-registry.mjs | 1 | ready |
| 2 | [Lead route and permission rows](phase-02-lead-route.md) | 1 | src/session-host/head-request.mjs, test/session-host/head-request.test.mjs, packages/session-host/contracts/head-permissions.v1.json, packages/session-host/rust/tests/permissions.rs, packages/run-supervisor/contracts/head-request.v1.json, packages/run-supervisor/rust/tests/head_request.rs | 2 | ready |
| 3 | [Spec, skills, changelog and integration](phase-03-docs-and-integration.md) | 2 | docs/platform/supervision/spec.md, docs/platform/session-host/spec.md, core/skills/fgos-lead/SKILL.md, core/skills/fgos-supervisor/SKILL.md, changelog.d/261127-0143-a-running-plan-widens-its-own-footprint.md, plans/261127-0143-widen-running-plan-footprint/reports/** | 3 | ready |

Phases 1 and 2 are `code:implement`, each reviewed (`code:review`) before it lands. Phase 3 is `code:implement` for
the text then `code:test` for the integration gate. The phases are serial: the lead route calls the host verb, and
the docs describe both.

**Hold on phase 3:** it writes `docs/platform/supervision/spec.md` and `core/skills/fgos-supervisor/SKILL.md`, which
plan `261126-2318-plan-footprint-overlap-warns` phase 3 owns. Per the owner order, phase 3 starts only when plan 2318
is `done`. Phases 1 and 2 touch none of 2318's files.

Checked (2026-11-27): `node scripts/plan-contract-check.mjs --plan` passes as `draft` and as `ready`;
`fgos resource-check --plan` accepts (3 units, 0 findings, waves 1-2-3).

### Checks

Cross-plan overlaps are warnings under the live model (plan 2318's warning model, landed by Keeper). Reported at
`ready`:

- Keeper `261122-0056` (running): `portfolio.rs`, `tests/portfolio.rs`, `wiring/supervision.rs`,
  `tests/supervision_verbs.rs`, `command-registry.mjs`, `head-request.mjs`, `head-permissions.v1.json`,
  `tests/permissions.rs`, the supervisor skill and both specs.
- `261125-2041` (gather rules): the lead and supervisor skills.
- `261126-2324` (changelog fragments): the `changelog.d/` glob; this plan's fragment file is its own.
- `261127-0018` (dead supervisor head stop): `docs/platform/session-host/spec.md`.

Conflicts there are met at land, where the land door merges and gates the combined tree. Plan 2318's own files are
written only by phase 3, after 2318 is `done`.

## Owner questions

None. Scope, priority and the hold on 2318's files come from the owner order relayed by lead:SUPERVISOR on
2026-11-27; the verb name, owner component and criterion check are decided above inside D1.

## Risks and rollback

- **A lead widens for something the owner did not approve.** Bounded: the verb only adds paths, names an item of the
  owner-approved acceptance list, and records phase, paths and criterion text in the commit; the supervisor sees
  every widen in `git log plans/<dir>/plan.md`. A lead that cannot cite a criterion asks the owner, as today.
- **Land conflicts on shared hot files** (Keeper on `portfolio.rs`, `head-request.mjs`, `head-permissions.v1.json`).
  Small additive edits; the lead rebases and lands again on `land-conflict-aborted`.
- **Phase-cell edit breaks a hand-formatted table.** `widened_text` rewrites only the footprint cell of one row and
  re-reads the result with `read_phase_table`; a failing re-read refuses, so nothing lands.
- **Rollback:** revert phase 3, then phase 2 (the lead row and route), then phase 1 (the verb). Reverting phase 2
  alone leaves the supervisor's verb in place and leads back on owner questions, which is today's behavior.
