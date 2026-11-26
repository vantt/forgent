---
contract: plan-v1
title: "Plans that share a path both run; the overlap is a warning at ready and at admission, never a refusal"
status: draft
priority: P1
blockedBy: []
base: 43460a291440cc08dea2d814a5aeeb146b9f7e24
footprint:
  - plans/261126-2318-plan-footprint-overlap-warns/**
  - changelog.d/261126-2318-plans-that-share-a-path-both-run.md
  - AGENTS.md
  - core/skills/_shared/plan-contract.md
  - core/skills/fgos-supervisor/SKILL.md
  - docs/platform/supervision/spec.md
  - .agents/skills/**
  - .claude/skills/**
  - plugins/fgOS/skills/**
  - .fgos/instructions/effective/rules.json
source:
  - plans/discussions/ds-yf3vnbidi6-plan-footprint-overlap/DISCUSSION.md
  - p-os3gedpq4x
created: 2026-11-26
---

# Plans that share a path both run; the overlap is a warning

## Outcome

Two plans whose footprints overlap are both admitted and run on their own branches. The overlap is reported as a
warning that names the other plan and the shared paths, at `ready` (the plan contract check) and at admission (the
supervisor's read view); it is never a refusal. Conflicts are met once, at land, where the land door already merges
and gates the combined tree (discussion `ds-yf3vnbidi6` D1, §6).

Unchanged: two unfinished phases of one plan that share a path still cannot share a wave; the footprint still bounds
what a unit may write and what a branch may land (`write-outside-footprint`, `land-outside-footprint`, PS-24).

The land-side half of D1 (changelog fragments under `changelog.d/`, generated skill surfaces in `land.regenerate`)
is plan `261126-2324-changelog-fragments-and-skill-surface-regeneration`, which overlaps no active plan and is
`ready`. This plan writes the rules and docs for both halves (phase 3), so that phase waits until the sibling is
`done`.

**Who carries the two doors (owner answer B to `q-kyzictpkf6`, 2026-11-26 23:40).** Phases 1 and 2 edit the
same supervision files the running plan `261122-0056-orchestration-skeleton` (Keeper) edits, and today's contract
check refused this plan `ready` on that overlap, the very rule it removes. The owner chose that Keeper's lead
carries phases 1 and 2 as Keeper phases: Keeper's footprint was widened by `scripts/plan-contract-check.mjs` and
`test/scripts/plan-contract-check.test.mjs`, and Keeper's lead runs `phase-01-contract-check-warns.md` and
`phase-02-admission-advises-overlap.md` from this directory (both together, as one change of both doors). This plan
keeps phase 3. It stays `draft` until Keeper's phase-1 change is on main; from then the contract check only warns,
and a planner sets it `ready` with the remaining overlaps (Keeper's spec and skill, gather-rules' `AGENTS.md` and
`core/skills/**`) reported as warnings.

### Facts (prior art, reused and missing)

- **Where the blocks are.** The contract check (`scripts/plan-contract-check.mjs:358-368`) turns a cross-plan
  overlap into an error for `ready` and a warning for `running`; `--all` prints `ERROR active plans A and B have
  overlapping footprints` (`:383`). It came in with `ab8ebdfd54` (2026-11-17) and was split by status in
  `d39e3b6a0a` (2026-11-22); no commit or spec cites an incident (discussion §3 row 1). The admission hold
  `held-footprint-overlap` is `admission_hold` (`packages/supervision/rust/src/portfolio.rs:282-296`), shared by
  `admissible` (the read view, `supervisor.rs:106`) and the wake door (`wake.rs:526-530`), landed `5d01f9a79f`.
  Both are retired together (L10); no switch keeps the old path.
- **Reused for the advice.** The overlap and its shared entries come from the `write-scope` package only:
  `colliding_pairs` returns `Pair { a, b, shared }` (`packages/write-scope/src/lib.rs:215-262`), and the Node check
  already reads the same answer through the native door (`collisions`, `plan-contract-check.mjs:62`, returns
  `shared`). No new overlap rule is written (door `footprint-write-scope-overlap-rule`).
- **Same-plan rule exists.** `plan-contract-check.mjs:157-167` (phases sharing a wave) stays; its test stays.
- **Who still tells agents to edit `CHANGELOG.md` or to block on overlap:** `AGENTS.md` (install/setup/doctor
  gate, last bullet), `core/skills/_shared/plan-contract.md` §2 (footprint example), §4 (hot files) and §5
  (cross-plan rule), and `docs/platform/supervision/spec.md` (Plan row, "Lead to land", decision history).

### Decisions this plan takes (inside D1)

- **Admission advice shape:** each `supervisor plans --json` row of a `ready` plan carries
  `overlaps: [{ "plan": "<running plan dir>", "paths": ["<shared entry>", ...] }]`, omitted when empty. Only
  `running` plans are compared, as the hold compared them.
- **Contract-check warning text:** `footprint overlaps another active plan <other> on <path>, <path>` (shared
  entries of the checked plan), printed `WARN`, exit 0; `--all` prints one `WARN active plans A and B share <paths>`
  line per pair.

## Acceptance criteria

1. Two `ready` plans whose footprints overlap both pass: `node scripts/plan-contract-check.mjs --plan <each>` exits
   0 and prints a `WARN` naming the other plan and the shared paths; `--all` exits 0 with one `WARN` per pair.
   Owning proof: `test/scripts/plan-contract-check.test.mjs` (the cross-plan test, rewritten).
2. A `ready` plan whose footprint overlaps a `running` plan is admitted by the wake door, and `supervisor plans`
   lists the overlap under `overlaps`. `rg -n "held-footprint-overlap" packages apps src scripts core docs/platform`
   finds nothing outside decision history. Owning proofs: `cargo test -p fgos-supervision --test portfolio --test
   wake`.
3. Two unfinished phases of one plan that share a path in one wave are still refused: the existing
   `phases of one wave with overlapping footprints are an error` test passes unchanged.
4. `AGENTS.md`, `core/skills/_shared/plan-contract.md` §2, §4 and §5, and `docs/platform/supervision/spec.md`
   state the new rules for both halves of D1; the supervision spec's "Lịch sử quyết định" records the change with
   D1; the `fgos-supervisor` skill names the `overlaps` field. `changelog.d/` holds this plan's entry.
5. `npm test` and `cargo test --workspace` are green on the combined tree (phase 3, `reports/integration.md`).

## Non-goals

- The land-side half: changelog fragments and `land.regenerate` globs (plan
  `261126-2324-changelog-fragments-and-skill-surface-regeneration`).
- Regenerating declared files during a lead's refresh merge of main into its branch (`p-avjhx3gxas`).
- Automatic ordering of overlapping plans (`ds-mzyircswox` D2, `p-5iq6tnsjdl`); `blockedBy` stays for an ordering
  a planner or the owner wants.
- The widening door (`p-lfsc4czpgh`); nothing here depends on it.
- Plans `261125-2041` and `261125-1631`: not touched.
- Footprint overlap among the children of one work item (`src/intake/plan.mjs`), which is the same-plan rule at
  another layer and stays.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Cross-plan overlap reported as a warning by the plan contract check | `supervision`, `footprint-write-scope-overlap-rule` | changes an existing rule of the plan contract the supervision area reads; overlap answered by the write-scope package, no new rule |
| `overlaps` advice on a `supervisor plans` row; admission no longer holds on overlap | `supervision`, `write-scope` | `colliding_pairs` gives the shared entries; survivor: supervision; retired: the `held-footprint-overlap` branch of `admission_hold` in packages/supervision/rust/src/portfolio.rs |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Contract check warns on cross-plan overlap (carried by Keeper)](phase-01-contract-check-warns.md) | - | scripts/plan-contract-check.mjs, test/scripts/plan-contract-check.test.mjs | 1 | withdrawn |
| 2 | [Admission no longer holds on overlap (carried by Keeper)](phase-02-admission-advises-overlap.md) | - | packages/supervision/rust/src/portfolio.rs, packages/supervision/rust/src/supervisor.rs, packages/supervision/rust/src/wake.rs, packages/supervision/rust/tests/portfolio.rs, packages/supervision/rust/tests/wake.rs | 1 | withdrawn |
| 3 | [Rules, docs and integration](phase-03-rules-docs-and-integration.md) | - | AGENTS.md, core/skills/_shared/plan-contract.md, core/skills/fgos-supervisor/SKILL.md, docs/platform/supervision/spec.md, .agents/skills/**, .claude/skills/**, plugins/fgOS/skills/**, .fgos/instructions/effective/rules.json, changelog.d/261126-2318-plans-that-share-a-path-both-run.md, plans/261126-2318-plan-footprint-overlap-warns/reports/** | 2 | draft |

Phases 1 and 2 are `withdrawn` here because Keeper's lead runs them (owner answer B); their phase files stay here
as the brief, and their proofs are the acceptance criteria 1 to 3 above. Phase 3 starts only when both are on main
and plan `261126-2324-changelog-fragments-and-skill-surface-regeneration` is `done`, so no rule lands ahead of its
code. Phase 3 is `code:implement` then `code:test` for the integration gate, reviewed (`code:review`) before it
lands.

Checked: `node scripts/plan-contract-check.mjs --plan` on this directory passes as `draft`; at `ready` it reports the
overlaps named above. `fgos resource-check --plan`: no collisions.

## Owner questions

- `q-kyzictpkf6` (answered B in chat, 2026-11-26 23:40): The plan that makes plan overlap a warning is itself
  refused by that overlap rule; how do we unblock it? Keeper's lead carries phases 1 and 2. The answer is recorded
  in the store by the owner or the secretary (`fgos questions answer q-kyzictpkf6 --option "B. Keeper's lead
  carries phases 1 and 2"`); a planner session may not.

## Risks and rollback

- **A semantic conflict between two admitted plans merges cleanly.** Covered at land: the land door gates the
  merged candidate, and each plan's integration phase re-runs the full gate on the combined tree (discussion §3
  row 7).
- **More land conflicts on hand-written source once plans overlap.** Measured before the block: 3 in about 70
  merges, each solved by one sync merge (discussion §3 row 3). The lead's answer to `land-conflict-aborted` stays
  rebase and land again.
- **Rollback:** revert phase 3, then Keeper's commits for phases 1 and 2 together (reverting only one door leaves the two doors
  disagreeing). Reverting 2 restores `held-footprint-overlap` and its tests.
