---
contract: plan-v1
title: "The plan check does not count a file the land door regenerates as a cross-plan clash"
status: draft
priority: P2
blockedBy: []
footprint:
  - scripts/plan-contract-check.mjs
  - test/scripts/plan-contract-check.test.mjs
  - core/skills/_shared/plan-contract.md
  - .agents/skills/_shared/plan-contract.md
  - plugins/fgOS/skills/_shared/plan-contract.md
  - plans/261125-1259-plan-check-regenerated-census/
base: bafa505cc8881023e82f5012953c8614c8f6e75b
source:
  - p-qvgaqip4tj
  - plans/261124-1945-run-tests-fgos-leak-check/plan.md
created: 2026-11-25
---

# The plan check does not count a file the land door regenerates as a cross-plan clash

## Outcome

`node scripts/plan-contract-check.mjs` refuses `ready` for a plan whose footprint overlaps an
active plan's. On 2026-11-25 it refused the P1 land-gate fix
(`261124-1945-run-tests-fgos-leak-check`) only because both it and the running plan
`261122-2108-delete-dead-node-execution-closure` named
`packages/git/contracts/mutation-census.v1.json`. That file is never merged: the land door
regenerates it in the candidate before its gates (`land.regenerate` in `.fgos/config.yaml`,
`packages/supervision/rust/src/land.rs`). The owner chose, in q-zw4htizjz2, to stop counting
such a file as a clash.

After this plan, the cross-plan overlap check leaves out every path the land door names in
`land.regenerate.files` of the effective config, so two plans that share only such files are
not a clash. Any other shared path still is.

## Acceptance criteria

1. Two active plans whose footprints share only a file listed in `land.regenerate.files`
   produce no cross-plan overlap: `--plan` on the `ready` one prints `ok`, and `--all` prints
   no "overlapping footprints" line for the pair. Proof: the cross-plan overlap test in
   `test/scripts/plan-contract-check.test.mjs`.
2. Two active plans that share such a file and another path still clash (error when `ready`,
   warning when `running`), and a directory or glob claim that contains a regenerated file
   (for example `packages/git/contracts/`) still clashes with a claim of that file. Proof: the
   same test.
3. The list comes from the effective config through `readConfig` in
   `src/config/facade.mjs`, never a constant copied into the script: `rg -n
   "mutation-census" scripts/plan-contract-check.mjs` prints nothing. One wiring proof runs
   `main` on plans that share `packages/git/contracts/mutation-census.v1.json` against this
   repository's config and gets `ok`.
4. `core/skills/_shared/plan-contract.md` states the rule in the cross-plan overlap line, and
   its two renders match (`npm run build:skills`, then `git diff --exit-code` on the renders
   after the commit).
5. `node scripts/run-tests.mjs test/scripts/plan-contract-check.test.mjs` exits 0.

## Non-goals

- Same-wave phase overlap inside one plan: the hot-file rule (one writer per hot file per
  wave) stays as it is.
- Changing the land door, its regeneration or `land.regenerate`.
- Exempting generated files the land door does not regenerate (the skill renders, golden
  vectors): those can conflict on a merge.
- Changing the work-item footprint conflict report (`collidingFootprints` in
  `src/state/graph-adapter.mjs`), a different door.

## Prior art

- `git log -S'activeOverlaps' -- scripts/plan-contract-check.mjs`: the cross-plan rule has no
  exemption of any kind; the contract's "Hot files" rule says generated files are
  regenerated, never hand-merged, but the check never learned which files those are.
- Reused: `land.regenerate.files`, the land door's own list of the files it regenerates
  (`core/config-standard/land.yaml` defines the key; the project config fills it). The land
  door already treats those files as exempt from a branch's footprint only through its own
  regeneration (`land.rs`, around line 1166). The check reads the same list, so there is one
  source of which files are regenerated.
- Reused: `readConfig` (`src/config/facade.mjs`), the one config door
  (`docs/platform/config/spec.md`); `scripts/git-one-door-scan.mjs` already reads config
  through it.
- Missing: nothing else; no new key, file or mechanism.

## Authority map

`fgos authority locate "the plan contract check that judges cross-plan footprint overlap"`
returns only the vocabulary contract `supervision/plan-vocabulary.v1` by meaning, which owns
plan status words, not the overlap rule; `scripts/plan-contract-check.mjs` has no model row.
The change adds no component, door, contract or decision kind: it filters one input of an
existing check by a list an existing config key already holds.

| New thing | Model row | Note |
|---|---|---|

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Leave land-regenerated files out of cross-plan overlap](phase-01-leave-land-regenerated-files-out-of-cross-plan-overlap.md) | - | scripts/plan-contract-check.mjs, test/scripts/plan-contract-check.test.mjs, core/skills/_shared/plan-contract.md, .agents/skills/_shared/plan-contract.md, plugins/fgOS/skills/_shared/plan-contract.md | 1 | ready |

One phase: the filter, its proof and the contract sentence land together. The footprint does
not name the census: the land door regenerates it (Outcome).

## Progress

- 2026-11-25 13:10: written from the owner's answer to q-zw4htizjz2. Left `draft`: its
  render files `.agents/skills/_shared/plan-contract.md` and
  `plugins/fgOS/skills/_shared/plan-contract.md` sit inside the claims `.agents/skills/**`
  and `plugins/fgOS/skills/**` of two running plans,
  `261122-2108-delete-dead-node-execution-closure` and `261124-0004-heads-operate-without-owner`
  (checked by setting `ready` and running the check). The phase in the table is `ready`; the
  plan goes `ready` when both finish or narrow those claims.

## Owner questions

- **q-zw4htizjz2: answered "Exempt regenerated census"** (owner, 2026-11-25 12:54). This plan
  is that exemption. The land-gate fix it was asked for no longer waits on it: that plan
  dropped the census from its footprint instead (see its Owner questions).

## Risks and rollback

- **A regenerated file listed by mistake hides a real clash.** Only files the land door
  rewrites on every matching land belong in `land.regenerate.files`; a hand-edited file put
  there would also escape the land's footprint check, so the risk is the config's, not new.
- **Config unreadable.** `readConfig` throws on a broken config; the check then exits 2 with
  the message, as it does for any other unreadable input. It never falls back to an empty
  list.
- **Admission.** Until those two running plans finish or narrow their render claims, this plan
  cannot be `ready`. Nothing waits on it: the P1 land-gate fix went `ready` without it.
- **Rollback:** revert the phase commit; the land of the revert regenerates the census.

## Outstanding questions

None.
