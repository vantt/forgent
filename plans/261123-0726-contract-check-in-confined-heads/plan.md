---
contract: plan-v1
title: "Repo scripts load the staged addon in a confined head: one reuse-or-build door, so planners can run the plan contract check"
status: running
lead: head:lead-forgent-261123-0726-contra-e554b
priority: P1
blockedBy: []
base: a4a5d7a17e6dc5ed0989e4cbd3952915c45c56a3
footprint:
  - plans/261123-0726-contract-check-in-confined-heads/**
  - scripts/lib/git-addon-stage.mjs
  - scripts/git-addon.mjs
  - test/distribution/native-addon.test.mjs
  - scripts/check-backlog-reconciliation.mjs
  - scripts/identity-ids-unique.mjs
  - test/scripts/doc-health.test.mjs
  - docs/history/backlog-execution-reconciliation/RECONCILIATION.md
source:
  - p-b5jixi4mov
  - p-mtqil2rpyy
  - plans/reports/planner-261123-0724-contract-check-blind-in-confined-heads.md
created: 2026-11-23
---

# Repo scripts load the staged addon in a confined head

## Outcome

A confined head (`FGOS_CONFINED=1`, `target/` read-only) can run `node scripts/plan-contract-check.mjs --plan <dir>`
and get a real answer. The same holds for the other repository scripts that load the native addon through
`ensureAddonForScript`. When this checkout's staged addon is fresh, scripts reuse it and do not run cargo. When it is
stale and cannot be rebuilt, the script stops with a named cause instead of a cargo stack trace. There is one
reuse-or-build door in the leaf module, not two `ensureGitAddon` functions with different behaviour.

Folded in on 2026-11-23 (owner approval relayed by the supervisor): `p-mtqil2rpyy`. The two backlog checks
(`check-backlog-reconciliation.mjs`, `identity-ids-unique.mjs`) see a migrated item by its `Original id:`, through one
shared reader, and keep their independent line-scan cross-check and loud missing-addon failure (phase 3).

The owner chose this fix on 2026-11-23 (option A in the report named in `source`). Evidence for the cause is in that
report.

## Facts (at c953e546b)

- `scripts/plan-contract-check.mjs:21` calls `ensureAddonForScript` (`scripts/lib/git-addon-stage.mjs:84`), which
  skips staging only when `FGOS_ACTIVE_MANIFEST_PATH` is set and otherwise calls the leaf `ensureGitAddon`. That
  function always runs `cargo build --locked -p fgos-node-addon` into `target/` (`git-addon-stage.mjs:38-41`).
- In a confined planner head this fails with `failed to open: target/debug/.cargo-build-lock ... Read-only file system
  (os error 30)`. This was observed on 2026-11-23 in head `ds-at6x3xj2ng`.
- The staged addon at `.fgos/runtime/git-addon/<checkout>/` was fresh at the time: its `source-digest` equalled
  `gitAddonSourceDigest()`. With the env trio from `devHostEnv` (`FGOS_HOST_BIN`, `FGOS_ACTIVE_RELEASE_PATH`,
  `FGOS_ACTIVE_MANIFEST_PATH`), the check ran and passed. Setting only `FGOS_ACTIVE_MANIFEST_PATH` fails with
  `git-addon-unavailable: addon not shipped on this channel`, because `src/native/door.mjs:45` finds the release
  through `FGOS_HOST_BIN`.
- Scripts that call `ensureAddonForScript` and fail the same way: `plan-contract-check`, `project-agents`,
  `check-decision-citation-drift`, `check-backlog-reconciliation`, `build-skill-wrappers`,
  `check-decision-supersession`, `build-domain-registry`.

## Prior art reused, and what was missing

- **Reused:** `scripts/git-addon.mjs` already has a reuse-or-build `ensureGitAddon`. If the staged `source-digest`
  matches, the manifest's addon loads through the native door, the staged host exists and the `bin/fgos.mjs` digest
  matches, it sets the env through `devHostEnv` and returns without cargo. Otherwise it falls back to the leaf build.
  `scripts/lib/git-ports.mjs`, `regenerate-observe-fixtures.mjs` and the event-store scripts use it.
- **Missing:** that reuse sits one layer above the leaf. `ensureAddonForScript` lives in the leaf and calls the
  always-build function, so the script door never reaches the reuse path. Two functions share the name
  `ensureGitAddon` and behave differently. This plan moves the reuse into the leaf, makes the upper module's export
  the same function (design principle 1, L10), and adds the named failure.
- **Not reused, on purpose:** the test launcher `scripts/run-tests.mjs` calls the leaf build directly. It keeps that
  behaviour unless the lead shows reuse is safe there (see phase 1 step 4), because the launcher must never test stale
  bytes.

## Acceptance criteria

1. `node scripts/run-tests.mjs test/distribution/native-addon.test.mjs` passes. It includes one new proof: with a
   fresh staged addon and a cargo stub that records any call, `ensureAddonForScript` sets the env trio and does not
   call cargo. With a stale digest and an unwritable target directory, it throws an error whose message names the
   stale staged addon and says to restage from an unconfined session.
2. `scripts/git-addon.mjs` no longer defines its own reuse logic: `rg -n "GIT_ADDON_SOURCE_DIGEST_FILE" scripts`
   shows the read only in `scripts/lib/git-addon-stage.mjs`. Every existing importer of `scripts/git-addon.mjs` keeps
   working (`node scripts/run-tests.mjs test/distribution/native-addon.test.mjs test/architecture.test.mjs`).
3. From a confined head with a fresh staged addon, `node scripts/plan-contract-check.mjs --plan
   plans/261123-0726-contract-check-in-confined-heads` exits 0 with no env set by hand. The run is recorded in
   `plans/261123-0726-contract-check-in-confined-heads/reports/`.
4. `node scripts/run-tests.mjs test/scripts/doc-health.test.mjs` passes, with one owning proof that the backlog checks
   see a migrated item by its Original id, keep the line-scan cross-check, and fail loudly without the addon.
   `node scripts/check-backlog-reconciliation.mjs` no longer reports `tsk-p7-shadow-binders` as an unknown id and
   still requires a section for every proposed item, so its remaining findings are the unreconciled items only (owner
   answer to `q-tvhmli3fns`).
5. `npm test` and `cargo test --workspace` are green on the combined tree (L5).

## Non-goals

- **Restoring the plan-contract land gate.** That gate belongs to `261122-0118-heads-stable-and-able` phase 3. Commit
  `14287de27` holds it with lead:SUPERVISOR until the active release substitutes `{plans}`. Release `3b595f7c`
  (activated 2026-11-23 06:48) now does, so the hold condition is met. Restoring it there before this plan lands
  would refuse every plan land from a confined head, because `fgos land` runs gates with the caller's environment
  (`packages/supervision/rust/src/land.rs:180-195`). This plan therefore lands first. The gate restore stays in that
  plan's footprint (`.fgos/config.yaml`) so no file gets a second writer. Phase 2 records the hand-off.
- Making `target/` writable inside confinement, or having confined heads build Rust. A planner has no reason to build.
- Changing the native door's release lookup (`src/native/door.mjs`).
- Editing `core/skills/_shared/plan-contract.md` §5. Its sentence "the land door runs the check" becomes true again
  when heads-stable restores the gate, and that file belongs to other active plans' footprints.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [One reuse-or-build door in the leaf](phase-01-one-reuse-or-build-door.md) | - | scripts/lib/git-addon-stage.mjs, scripts/git-addon.mjs, test/distribution/native-addon.test.mjs | 1 | parked: branch contract-check-in-confined-heads/p01b @3a9ab48bc (reviewed diff re-applied on main plus the ort-static fix) ready to land; lands refused land-target-ahead (other heads' unpushed main commits), then main-checkout-dirty-overlap on plans/261121-2110-component-authority-doors/plan.md (that lead's uncommitted edit in the main checkout, last ticket c-11439-1795405880138); on resume land it again; see reports/lead-261123-1047-phase1-reapply-and-land.md |
| 3 | [Backlog checks count a migrated item's Original id](phase-03-backlog-checks-count-original-ids.md) | - | scripts/check-backlog-reconciliation.mjs, scripts/identity-ids-unique.mjs, test/scripts/doc-health.test.mjs, docs/history/backlog-execution-reconciliation/RECONCILIATION.md | 1 | done: landed 5eeb2d60a (owner chose option 1 on q-tvhmli3fns: rule kept; the 277 unreconciled items go to a backlog row the secretary files) |
| 2 | [Integration: confined proof and gate hand-off](phase-02-integration-and-gate-handoff.md) | 1, 3 | plans/261123-0726-contract-check-in-confined-heads/reports/ | 2 | draft |

Execution: phases 1 and 3 are independent `code:implement` units, each in its own worktree, in wave 1. Phase 2 is a `code:test` unit plus a supervisor
hand-off note. No two phases share a path.

## Owner questions

- `q-tvhmli3fns` (answered 2026-11-23): **fix ids, keep the rule, file the 277.** Phase 3 counts Original ids through
  one reader, names a section whose item is no longer proposed, and keeps the per-item rule and both safeguards.
  **For the secretary:** file one backlog row for the 277 proposed items with no RECONCILIATION.md section (measured
  2026-11-23 on main); `check-backlog-reconciliation.mjs` stays red on them until that row is done.

The owner chose the confined-check fix (option A, 2026-11-23). The supervisor accepted keeping the gate restore in its
owning plan (heads-stable phase 3) and hands it to that lead after phase 1 lands.

## Risks and rollback

- **The reuse path hides stale bytes.** The digest covers every workspace member's `.rs`, `.toml` and `.json` files,
  and the existing reuse also checks the `bin/fgos.mjs` digest and loads the addon through the verifying door. Phase 1
  keeps all three checks, and its proof covers the stale case.
- **In-process load at reuse time.** The moved reuse loads the addon to verify it. A script that later loads a
  different addon file would be refused with `git-addon-second-load`. Scripts load this same manifest, so this is a
  non-issue for script callers. The launcher keeps its build path (phase 1 step 4).
- **Legacy overlap:** the running legacy plan `261106-1216-doctor-readiness-only` names
  `test/scripts/doc-health.test.mjs` in its phase 03 without a frontmatter footprint, so the check cannot see the
  overlap. Phase 3's lead cuts its branch at the trunk tip right before landing and keeps its test as one new block.
- **Rollback:** revert the phase 1 commit; revert the phase 3 commit on its own. Scripts go back to always building, which works outside confinement as it
  does today.

## Outstanding questions

None
