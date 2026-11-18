# Phase 05: one join door for a project .fgos

Wave 5. Depends on 4. Capability `code:implement`. Effort 1d. Meets the HARDEN criterion "one door for `.fgos`
lookup" for every tier except Work (phase 01 F3).

## Context

Which project root a call acts on is already decided once (invocation-root door). The join `root + '.fgos'` is
written by hand in 35 files because its one function, `fgosDirFromRoot`, sits in T2 `src/runner/paths.mjs` and the
`.fgos` file registry sits in `src/state/`, which the A4 guard forbids to T5/T6 files (phase 01 F4). Design principle
2 puts a shared path primitive in the lowest layer that needs it: T0.

## Requirements

1. **Move the leaf.** `git mv src/state/fgos-file-registry.mjs src/util/fgos-file-registry.mjs`. Move
   `fgosDirFromRoot` (body unchanged: `path.join(path.resolve(root), '.fgos')`) from `src/runner/paths.mjs` into it.
   Delete the export from `paths.mjs` (no re-export; `paths.mjs` imports it from the leaf for its own use). Update
   the header comment of the leaf (it names the old location and `paths.mjs` as the join's home).
2. **Move every importer in the same commit** (L10). Registry importers: `bin/fgos.mjs`,
   `src/identity/directory-store.mjs`, `src/observe/approve-fault-log.mjs`, `src/observe/invocation-fault-log.mjs`,
   `src/runner/paths.mjs`, Work files `src/state/{porting-store,runtime-coordination,store,work-event-store}.mjs`
   (import path only), and the 20 tests and helpers listed in the plan footprint. `fgosDirFromRoot` importers:
   `bin/fgos.mjs`, `src/observe/{friction-client,invocation-fault-log}.mjs`,
   `src/runner/dispatch/{assignment-runner,cli,session-attempt}.mjs`, `src/runner/{fanout-batch,loop}.mjs` (Work
   tier: import path only), `src/runner/main-checkout-reset-guard.mjs`, `src/runner/paths.mjs`,
   `src/setup/run-supervisor-checks.mjs`, `src/state/runtime-coordination.mjs` (import path only),
   `src/util/host-bin.mjs` (if it still uses it after phase 4), `src/verbs/dispatch/{inspect,recover,show-run,watch}.mjs`,
   `scripts/fgos-session-start-hook.mjs`, `test/runner/{assignment-enumerator-guard,dispatch-runtime-inspect,dispatch,paths}.test.mjs`.
   The implementer regenerates both lists with `git grep -l` on its base before editing; a file that appeared since
   this plan's base is moved too.
3. **Swap every hand join** outside Work to the leaf: `path.join(X, '.fgos')` becomes `fgosDirFromRoot(X)`,
   `path.join(X, '.fgos', a, b)` becomes `path.join(fgosDirFromRoot(X), a, b)`, the template joins of
   `src/runner/repo-locks.mjs` likewise. Files (phase 01 F3): `src/config/facade.mjs`,
   `src/git/main-checkout-delete-guard.mjs`, `src/runner/paths.mjs`, `src/runner/worktree.mjs`,
   `src/runner/repo-locks.mjs`, `src/runner/dispatch/{assignment-runner,config,confinement/probes/harness,operation-prompt-templates,reconciliation-planner,runtime-inspection}.mjs`,
   `src/runner/execution/{case-run-paths,handoff-refs,run,unit-run-start}.mjs`,
   `src/session-host/head-start.mjs` (joins at :41, :143, :154; not renamed), `src/session-rotation/rotate.mjs`,
   `src/workflow/{case-bindings,case-close,case-gate,case-lock,case-runtime,unit-handoff}.mjs`,
   `src/setup/{doctor-bridge,instruction-registry}.mjs`. `src/git/inspect.mjs` and `execution/commit-unit-work.mjs` no longer
   join `.fgos` (the latter only compares the string `'.fgos'`), so they are not touched. `src/setup/agent-hooks.mjs:8`
   is a comment only; `doorText` (`test/architecture.test.mjs:1791`) blanks comments, so the door does not see it and it
   needs no edit. A relative constant with no root
   (`operation-prompt-templates.mjs:39` `path.join('.fgos', 'prompt-templates')`) becomes a join on the root at its
   use site, or, if it is only ever shown as text, stays text without `path.join` (validating decides per site).
   Home joins (`harness.mjs:632`, `llm-accounts.mjs:258`) are not touched: they belong to the global directory door.
   `src/runner/dispatch/config.mjs:160,336` build display text; they swap too, so no hand join is left to copy.
4. **Manifest.**
   - Delete the file override `"src/state/fgos-file-registry.mjs": 0` from `tiers` (now tier 0 by directory).
   - Rename the `files` layer-map key `src/state/fgos-file-registry.mjs` to `src/util/fgos-file-registry.mjs` (layer
     stays `kernel`), and the same path in the `allowed` list of the door row "record a malformed call (twin)".
   - `git grep -n "state/fgos-file-registry" -- docs/architecture-manifest.json src bin scripts test` is empty after.
   - Add one row to `doors`:
     - `job`: "join .fgos onto a project root"; `kind`: "door";
     - `patterns`: `path\.join\((?!\s*(?:home|homeDir|os\.homedir\(\))\b)[^)]*'\.fgos'` and
       `` `[^`]*\$\{[^}]+\}/\.fgos\b `` (JS only: single-quoted `path.join` and backtick templates; home joins stay with
       the global directory row, whose patterns already match them);
     - `allowed`: `src/util/fgos-file-registry.mjs`; `src/util/host-bin-path.mjs` with reason "bootstrap: finds the
       activation before any door can load; the Git one-door scan needs the literal shim path"; `scripts/**` with
       reason "repo tooling and harnesses build their own fixture projects; not payload";
     - `debt`: `src/runner/merge.mjs`, `src/runner/operation-choice.mjs`, `src/runner/work-dispatch.mjs`,
       `src/state/porting-store.mjs`, `src/state/store.mjs`, each "Work tier; Work is deferred until after the
       packaging release", and `src/setup/registrations.mjs` "phase 6 swaps it" (plan 261118-1847 is done; the entry exists only until phase 6 lands);
     - `retiredBy`: "the Work batch (T7) swaps the five Work-tier joins";
     - `reason`: "which root is decided by the invocation-root door; the .fgos of that root is joined in one T0
       function, so every tier uses the same answer".
   - Run `checkDoors` and fix any other hit the pattern finds (a hit in `apps/` or `packages/` would mean the pattern
     is too wide: narrow it, do not allow the file).

5. Regenerate the Git mutation census and commit it with the phase.

## Proof

Owning proofs: `checkDoors` and the tier rule in `test/architecture.test.mjs` (mechanical guard for the door);
`test/runner/paths.test.mjs` already owns `fgosDirFromRoot`'s behaviour and moves its import only. No new behaviour,
so no new test. Each touched module's own tests must stay green; none is weakened.

## Validation

- Plan acceptance criteria 2-4 (`git grep` checks).
- Focused run through the repo test runner: `test/architecture.test.mjs`, `test/runner/**`, `test/state/**`,
  `test/workflow/**`, `test/event-store/**`, `test/observe/**`, `test/cli/**`, then the full suite in phase 7.
- `git diff --stat` shows only renames, import lines and one-line swaps; no deletion beyond the moved function.

## Risk and rollback

Low per site, wide in count. The `path.resolve` inside `fgosDirFromRoot` is the one semantic difference (plan risk
map, row 2). Rollback: revert the commit (a single commit keeps the move and the swaps atomic).
