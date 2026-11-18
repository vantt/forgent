---
contract: plan-v1
title: "Foundation: remove the three upward imports of T0-T2 and send every project .fgos join through one door"
status: draft
priority: P1
blockedBy: []
footprint:
  - plans/261118-2048-foundation-reverse-deps-and-fgos-root-door/**
  - docs/architecture-manifest.json
  - test/architecture.test.mjs
  - src/state/store-error.mjs
  - src/util/store-error.mjs
  - src/state/fgos-file-registry.mjs
  - src/util/fgos-file-registry.mjs
  - src/runner/worktree.mjs
  - src/runner/paths.mjs
  - src/runner/repo-locks.mjs
  - src/runner/main-checkout-reset-guard.mjs
  - src/git/inspect.mjs
  - src/git/main-checkout-delete-guard.mjs
  - src/identity/directory-store.mjs
  - src/verbs/events/rebuild.mjs
  - src/util/host-bin.mjs
  - src/util/host-bin-path.mjs
  - src/config/facade.mjs
  - src/state/store.mjs
  - src/state/porting-store.mjs
  - src/state/runtime-coordination.mjs
  - src/state/work-event-store.mjs
  - src/observe/approve-fault-log.mjs
  - src/observe/invocation-fault-log.mjs
  - src/observe/friction-client.mjs
  - src/runner/dispatch/cli.mjs
  - src/runner/dispatch/session-attempt.mjs
  - src/runner/dispatch/assignment-runner.mjs
  - src/runner/dispatch/config.mjs
  - src/runner/dispatch/confinement/probes/harness.mjs
  - src/runner/dispatch/operation-prompt-templates.mjs
  - src/runner/dispatch/reconciliation-planner.mjs
  - src/runner/dispatch/runtime-inspection.mjs
  - src/runner/execution/**
  - src/runner/fanout-batch.mjs
  - src/runner/loop.mjs
  - src/session-host/head-start.mjs
  - src/session-rotation/rotate.mjs
  - src/workflow/**
  - src/setup/doctor-bridge.mjs
  - src/setup/instruction-registry.mjs
  - src/setup/run-supervisor-checks.mjs
  - src/verbs/dispatch/**
  - bin/fgos.mjs
  - scripts/fgos-session-start-hook.mjs
  - test/architecture.test.mjs
  - test/cli/exit-code-table.test.mjs
  - test/cli/helpers/fgos-cli-harness.mjs
  - test/cli/take-pick-claim-eligibility.test.mjs
  - test/e2e/compound-learn-lifecycle.test.mjs
  - test/e2e/domain-aware-stage-literals.test.mjs
  - test/e2e/fixture-marketing-domain.test.mjs
  - test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs
  - test/e2e/pr-gate.test.mjs
  - test/e2e/rebuild-determinism.test.mjs
  - test/e2e/runner-loop.test.mjs
  - test/e2e/self-improve-loop.test.mjs
  - test/e2e/synthetic-domain.test.mjs
  - test/event-store/verbs.test.mjs
  - test/observe/invocation-fault-log.test.mjs
  - test/report/authoritative-match.test.mjs
  - test/runner/assignment-enumerator-guard.test.mjs
  - test/runner/dispatch-runtime-inspect.test.mjs
  - test/runner/dispatch.test.mjs
  - test/runner/merge.test.mjs
  - test/runner/paths.test.mjs
  - test/state/decision-scope-field.test.mjs
  - test/state/porting-store.test.mjs
  - test/state/runtime-coordination.test.mjs
  - test/state/store.test.mjs
  - test/state/work-size-rigor.test.mjs
  - test/util/host-bin.test.mjs
  - test/verbs/merge/approve-fixtures.mjs
  - docs/platform/event-store/spec.md
  - packages/event-store/contracts/consumers.v1.json
  - docs/backlog.md
base: 5fd22aa1d96cab4030e49fe97531b4300d86fa63
source:
  - docs/backlog.md
  - plans/reports/review-261118-1850-harden-plan-review.md
  - plans/reports/closing-261118-1344-harden-root-closing.md
  - plans/261021-1118-harden-low-layers-bottom-up/plan.md
created: 2026-11-18
---

# Foundation: remove the three upward imports of T0-T2 and send every project `.fgos` join through one door

Backlog row `p-zs23zde4mh` (owner 2026-11-18: option a of the HARDEN plan review Q3, priority high). Facts and prior
art with file:line evidence: [phase 01](phase-01-facts-and-prior-art.md) (done while planning, read on
`origin/main` `5fd22aa1d`).

## Outcome

1. `docs/architecture-manifest.json` `tierExceptions` is an empty list. No file at T0-T2 imports a file of a higher
   tier, and the tier rule of `test/architecture.test.mjs` proves it with no named exception.
2. The path of a project's `.fgos` directory is joined in one function, `fgosDirFromRoot`, living in a T0 leaf
   (`src/util/fgos-file-registry.mjs`), which every tier can import. Which project root a call acts on stays decided
   by the existing invocation-root door (`packages/git/rust/src/invocation_root.rs`, Node adapter
   `resolveInvocationRoot` and `resolveMainCheckoutRoot` in `src/runner/paths.mjs`); this plan adds no root decision.
3. A new row in the manifest's existing `doors` table ("join .fgos onto a project root") makes the rule mechanical:
   `checkDoors` fails on any new hand-written join outside the leaf. The five Work-tier files are its only debt, each
   with reason and `retiredBy: the Work batch (T7)`.
4. Of the 36 files the HARDEN criterion counts (`path.join(..., '.fgos')` in `src`/`bin`: 35, plus the template join
   in `src/runner/repo-locks.mjs`; the review's 36 is confirmed), 29 lose their own join, 1 (`host-bin-path.mjs`)
   is the named bootstrap exception, 1 (`llm-accounts.mjs`) is a home join that the existing "global fgOS directory"
   door already lists as debt, and 5 are Work debt.

## Constraints and non-goals

- No new mechanism, layer, port or config key (RUL104). Every change moves a function to the lowest layer that needs
  it, deletes an import, or uses an existing door. Old paths are deleted in the same change (L10): no re-export of a
  moved name remains.
- No Work-layer change. Tier-7 files (`src/state/*` except leaves, `src/runner/merge.mjs`, `operation-choice.mjs`,
  `work-dispatch.mjs`) get only the import-path edits that L10 forces when a leaf they import moves; their own `.fgos`
  joins and `getMainFgosDir` stay for the Work batch. Work stays deferred until after the packaging release.
- No locked law changes. No Rust change: the root decision is already in Rust; this plan only deletes Node
  duplication around it, which is the non-disruptive form of "new code in Rust".
- Rust `.join(".fgos")` sites (57 non-test files) are composition on roots the Rust door already resolved; they are
  outside this plan's criterion (see "Ideas for the owner").
- One owning proof per behaviour at the lowest layer (design principle 8); each phase names the proof it extends.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Facts and prior art](phase-01-facts-and-prior-art.md) | - | plans/261118-2048-foundation-reverse-deps-and-fgos-root-door/phase-01-facts-and-prior-art.md | 1 | done |
| 2 | [StoreError leaf moves to T0](phase-02-store-error-leaf.md) | 1 | src/state/store-error.mjs, src/util/store-error.mjs, src/runner/worktree.mjs, src/runner/dispatch/cli.mjs, src/state/store.mjs, src/runner/main-checkout-reset-guard.mjs, bin/fgos.mjs, test/architecture.test.mjs, test/cli/exit-code-table.test.mjs, test/observe/invocation-fault-log.test.mjs, docs/architecture-manifest.json | 2 | draft |
| 3 | [Identity rebuild takes the main .fgos from the rebuild door](phase-03-identity-rebuild-root.md) | 2 | src/identity/directory-store.mjs, src/verbs/events/rebuild.mjs, test/event-store/verbs.test.mjs, docs/architecture-manifest.json | 3 | draft |
| 4 | [Host binary lookup without a Git root](phase-04-host-bin-without-git.md) | 3 | src/util/host-bin.mjs, test/util/host-bin.test.mjs, docs/architecture-manifest.json | 4 | draft |
| 5 | [One join door for a project .fgos](phase-05-one-fgos-join-door.md) | 4 | every footprint path of this plan except src/setup/registrations.mjs (listed in the phase file) | 5 | draft |
| 6 | [Setup registrations through the door](phase-06-setup-registrations.md) | 5 | src/setup/registrations.mjs, docs/architecture-manifest.json | 6 | draft |
| 7 | [Integration, docs and full gate](phase-07-integration.md) | 6 | plans/261118-2048-foundation-reverse-deps-and-fgos-root-door/reports/integration.md, docs/platform/event-store/spec.md, packages/event-store/contracts/consumers.v1.json, docs/backlog.md | 7 | draft |

Phases 2-5 are serial because each rewrites `docs/architecture-manifest.json` and phases 2 and 5 rewrite
`test/architecture.test.mjs`; the architecture test fails on a stale exception (`test/architecture.test.mjs:261-264`),
so each phase drops its own row in its own commit and stays green alone.

`src/setup/registrations.mjs` is held by the running plan 261118-1847 (account lease), so it is not in this plan's
frontmatter footprint; phase 6 starts only when 1847 is done (an external wait the phase table cannot express) and
adds the path then, and until then phase 5 lists that file as debt of the new
door row.

Effort (lead-days): 1: 0.25 (done); 2: 0.25; 3: 0.25; 4: 0.5; 5: 1; 6: 0.1; 7: 0.25. Total 2.6; remaining 2.35,
all on one serial path. One lead, one linked worktree, Sonnet-class implementer is enough (mechanical moves with a
small behaviour change in phase 4).

Capability per phase: 1 `code:review`; 2-6 `code:implement`; 7 `code:test`.

## What can run now and what waits

- **Runs now:** phases 2-5 and 7. None depends on the packaging release: the change is Node payload and manifest only
  and ships with whatever release comes next. Work is not needed: its files only receive forced import-path edits.
- **Waits on plan 261118-1847 (running):** phase 6 only (one file, three joins).
- **Packaging release:** no real dependency; nothing here waits for it.
- **Work batch:** not needed; the five Work-tier joins stay as named debt and retire with it.

## Collisions with active and draft plans

| Plan (status) | Shared files | Handling |
|---|---|---|
| 261118-1847 account lease (running) | `src/setup/registrations.mjs` (and `test/setup/**`, `llm-accounts.mjs`, which this plan does not touch) | registrations: phase 6 waits for 1847 done and adds the path to this footprint then. `llm-accounts.mjs` keeps its home join under the global door. The frontmatter names exact dispatch and test files, no prefix that covers a 1847 path |
| 261118-0936 ops-metrics (running, phase 16 only) | none (its footprint is its plan dir, `friction.rs`, `docs/platform/observe/**`) | - |
| 261118-0947 session verb (draft until 1847 is done) | catch-all `src/**`, `test/**`, `docs/architecture-manifest.json`; concretely `src/runner/worktree.mjs` (comment lines), `src/git/inspect.mjs`, `test/util/host-bin.test.mjs`, `test/architecture.test.mjs` | land this plan before 0947 leaves draft (it waits on 1847, which leaves a window of about the 2.35 days needed); otherwise run after 0947 phase 4. Never both active: their footprints overlap |
| 261118-1341 S6a execution tier (draft) | `src/runner/dispatch/**`, `src/runner/execution/**`, `src/workflow/**`, `src/setup/**`, `head-start.mjs`, `rotate.mjs`, `bin/fgos.mjs` | phase 5 edits there are one-line join/import swaps; S6a rebases. S6a moving `payload-root.mjs` is unaffected (this plan does not import it) |
| 261118-1045 supervisor (draft) | `src/runner/dispatch/assignment-runner.mjs` | one join swap; whichever lands second rebases |
| 261118-1455 S6a worktree door | done | - |

The supervisor sets `ready` after the contract check and decides landing order.

## Risk map

| Risk | Level | Proof point (validating) |
|---|---|---|
| Phase 4 drops the main-checkout step of `resolveHostBin`; a Node process started outside the Rust host, from a linked worktree, with no `FGOS_HOST_BIN`, then finds no host | medium | list every production way the payload starts without the host (`scripts/*hook*.mjs`, `.githooks/*`, herdr launchers, `bin/fgos.mjs` direct) and show each either has `FGOS_HOST_BIN` (`apps/fgos/src/legacy_exec.rs:265` sets it for every host child) or runs in the main checkout; if one does not, phase 4 uses `nativeHelperExe(nativeDoor())` (`src/native/door.mjs`, T0) as the second step instead, still no new mechanism |
| `fgosDirFromRoot` resolves the root (`path.resolve`) where `path.join(root, '.fgos')` did not; a caller passing a relative root changes its answer | low | for each of the 29 swapped sites, show the root comes from a resolver (absolute) or a test fixture under a temp dir |
| The new door pattern is too wide (scripts, Rust, shell) or too narrow (a call split over lines) | low | run `checkDoors` on the branch: every hit is the leaf, an allowed file with reason, or Work debt; pattern and exclusions written in phase 5 |
| Moving `fgos-file-registry.mjs` out of `src/state` changes the A4 guard result (`test/architecture.test.mjs:871-985`) | low | A4 tests green; the guard's Work regex `/(^|\/)state\//` no longer matches the leaves, which is the point |

GitNexus impact analysis: `fgos dispatch decide --for impact-analysis` answered `unavailable` (`tool.missing`) on
2026-11-18, so blast radius is measured by `git grep` importer lists in phase 01 (weak proof, named here).

## Acceptance criteria

1. `tierExceptions` is `[]` and `node --test test/architecture.test.mjs` is green.
2. `git grep -nE "path\.join\([^)]*'\.fgos'|\\$\{[^}]+\}/\.fgos" -- src bin` lists only: `src/util/fgos-file-registry.mjs`,
   `src/util/host-bin-path.mjs`, the five Work-tier files, and home joins already owned by the global door.
3. `fgosDirFromRoot` is defined once, in `src/util/fgos-file-registry.mjs`; `src/runner/paths.mjs` exports no
   `fgosDirFromRoot`; no file imports `src/state/fgos-file-registry.mjs` or `src/state/store-error.mjs`.
4. The manifest row "join .fgos onto a project root" exists, `checkDoors` is green, and its debt lists exactly the
   five Work files.
5. `npm test` green (via the repo's test runner); `cargo test --workspace` not required because no Rust file changes
   (phase 7 confirms with `git diff --stat origin/main -- '*.rs'` empty).
6. HARDEN success criterion "one door for `.fgos` lookup" reads met for T0-T6 and T9 in this plan's integration
   report, with the Work residue named.

## Ideas for the owner (not in scope, RUL104)

- `src/git/main-checkout-delete-guard.mjs:231-248` judges "is this the main checkout" with its own gitfile walk (a
  hook must not spawn Git). It is a second root decision the invocation-root door row does not see because no pattern
  matches it. Benefit of adding it as named debt with a pattern: the leak becomes visible; it ties to the open owner
  idea "one shared gitfile parser" (HARDEN plan row 04r).
- Rust has 57 non-test files that join `.fgos` onto a resolved root. A Rust twin of the join door (one function in
  `fgos-git` or `fgos-config`) would make the same rule hold there; evidence: `git grep -lE 'join\("\.fgos"\)' -- '*.rs'`.
- The HARDEN criterion text "`.fgos` lookup: T1" is stale: the root door is at T2 (`src/runner/paths.mjs`) and the
  join leaf lands at T0. The closed HARDEN plan is not edited here; the integration report records it.

## Owner questions

None. Every choice above follows from the owner's answer (option a, no Work change, no new mechanism) and the
evidence in phase 01; the one behaviour choice (phase 4) has a named fallback decided at validating.

## Outstanding questions

None
