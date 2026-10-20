# Red-team adjudication: Seat Binding plan (big lead, 2026-10-20 22:10)

Four Opus reviewers (security adversary / fact checker; failure mode analyst / flow tracer; assumption destroyer / scope auditor; scope critic / contract verifier). 37 raw findings, deduplicated to 16. Every accepted finding carries file:line evidence. The big lead re-verified the three load-bearing ones at HEAD:
- the global `~/.fgos/config.json` has `runner.rigorToTier`, and `config.mjs:359` merges it in before validating at :361;
- `ensureRunnerConfigForDir` writes the merged defaults (`config.mjs:395-405`) before validating;
- `execution.status` is only running|pending|pending-inline|settled (`run.mjs:699,731,735,1259,1371,1374`).

## Accepted (apply all)

1. **CRITICAL — global layer.** Every load merges the project file with the global one before validating. The global file still has `rigorToTier`, plus bare-verb capabilities `advise`, `execute` and `review`.
   - Effect: after 06 the new loader would refuse every workspace on both machines, and the old-release fence fails open.
   - Fix:
     - Extend the existing `sanitizeGlobal` hook (`config.mjs:300`, `sanitizeGlobalModelPolicies`) to drop retired keys (`rigorToTier`) from the global layer *before* the merge. Decide and state how global bare-verb entries are treated.
     - The `rigorToTier` refusal and the `seatBindingSchema` requirement apply to the **project layer only**.
     - Phase 05/06/09 tests run with a real global file that still carries `rigorToTier`.
   - Sources: assumption 1, security 1, scope 1, failure 1–2.
2. **CRITICAL — fill-missing writers.** `ensureRunnerConfigForDir` (callers: `bin/fgos.mjs:457,491`, `bin/fgos-runner.mjs:99`, `dispatch/cli.mjs:388,857,1026`, `run.mjs:162`, `assignment-runner.mjs:1276`, `fanout-batch.mjs:51`) and `fgos setup` (`ensureSharedConfigDefaults`, `registrations.mjs:273-283`, `bin/fgos.mjs:4058,4061`) write registry defaults, including `rigorToTier`, into the project and global files before validating.
   - Fix:
     - Order setup: conversion, then fill-missing; or remove `rigorToTier` from `DEFAULT_RUNNER_CONFIG` in the same phase that refuses it.
     - Key the conversion trigger on "`rigorToTier` present OR schema absent", never on the marker alone.
     - Keep schema keys out of the defaults that are written to the global file.
     - Test: old `ensureRunnerConfigForDir` on a converted file, then new setup, ends green.
     - Landing: pull and activate as one step on each machine.
   - Sources: assumption 2, scope 2, failure 3.
3. **CRITICAL — fence.** The old-release refusal must come from a value the OLD validator rejects in *every* converted file, including mdview and mcp-skill-hub, which have no capability rigor. Example: a sentinel inside a map the old code validates strictly, such as `modelPolicies` or `patterns`.
   - Prove it on all three workspaces' converted configs, with the real HOME, and assert the project file bytes are unchanged after the old release runs.
   - Sources: security 1, scope 2, failure 1.
4. **CRITICAL — drain.**
   - Predicate: a `unit.json` without `seatSchema` whose `execution.status` ∈ {running, pending, pending-inline}, plus a controller-liveness check. forgentX has 11–31 `running` records today.
   - Name the existing verb that settles or abandons a dead record (6.4 controller-death lane); never "wait until empty" with no exit.
   - Extend the drain to workflow runs with unsettled steps or parked gates that hold `unit-run:<id>/<role>` refs.
   - Run the corrected drain against live forgentX in phase 00.
   - Sources: security 2, failure 4, assumption 4, scope 6.
5. **CRITICAL — replay sites.**
   - The write-gate recompute is `assignment-runner.mjs:466-500` (with `seatRoleOf` at :1171 and `walkStateOf`), not `commit-unit-work.mjs`, which has no bind. Retarget phases 07 and 08.
   - The doctor row `mutating-assignment-binding-snapshot` (`registrations.mjs:627-680`, registered :1457) replays `bind()` for every historical result (2,275 in forgentX). Put it in the phase 00 inventory. It must skip pre-fence records and replay post-fence ones only, or be retired in favour of the phase 08 replay. Count its execs.
   - `dispatch probe-account` (`dispatch/cli.mjs:1026-1037`) stays outside Seat Binding, as a pinned-account probe, with a test.
   - Sources: assumption 3, scope 5.
6. **HIGH — role-keyed readers and history.** Phase 00 greps every `${role}/`, `unit-run:…/${role}`, `.roles`, `role.role` and `assignmentId.split('/')`, and phase 02 owns the result. Known misses:
   - `unit-run-history.mjs:41-63`, `account-rotation.mjs:78`, `unit-sync.mjs:76,109` (role `sync`), `assignment-layout.mjs:50`;
   - `workflow/ref-digests.mjs:116-122`, `case-start.mjs:234-238`, `workflow/runner.mjs:364-372`, `case-admission.mjs:108,173`;
   - `unit-handoff.mjs:74,80,146,391`, `work-dispatch.mjs:379`;
   - `case-projection.mjs:242-246`: coordinate with the settle-milestones lane, which is merging first; do not declare it untouched;
   - `registrations.mjs:638`.

   Keep ONE legacy read path that maps settled role-keyed panel and debate records to seats, including `packages/run-result/contracts/unit-summary.read.v2.json:55` and `packages/observe/rust/src/metrics_cli/discussions.rs:170`, with golden tests on a pre-fence panel record. Widen the criterion-1 grep to `scripts packages apps`.
   - Sources: assumption 4, scope 6, failure 6.
7. **HIGH — seat id rule.** A seat id becomes a path and ref segment (`run.mjs:1040,1355`, `case-admission.mjs:173`, `unit-run-history.mjs:47-48`). Add a charset and reserved-name rule owned by Convention, enforced in the resolver and the workflow schema, with a traversal test.
   - Source: assumption 5.
8. **HIGH — `tester`.** Decided by the big lead within the frame:
   - Reviewed composition is stated **by checker seat**, not by role.
   - The `tester` seat keeps role `reviewer` only for taste lookup.
   - It keeps today's result contract and receipt treatment through its posture, which is not a verdict seat: `agent-result-claim-contract.mjs:25-27`, `case-projection.mjs:245`.
   - Rename or merge the second checker set at `registrations.mjs:591` and `config.mjs:257,1383`.
   - Note it for the spec errata (§ composition wording) in phase 11.
   - Source: assumption 6.
9. **HIGH — replay trust.** `bindingInput` lives in a worker-reachable `unit.json`.
   - Replay stage 1 runs against the committed config at the run's config digest. Refuse on mismatch; never trust a persisted copy.
   - Persist only an allowlisted, non-secret subset: no `env`, no credential homes.
   - Check the lease receipt against the provider-capacity record (audit), not against `unit.json`.
   - Keep today's rule from `account-rotation.mjs:67-71`.
   - Say whether `bindingInput` replaces or extends `configSnapshot`.
   - Source: security 3.
10. **HIGH — host binary trust.**
    - The seat-binding client resolves the activation host (`ignoreEnv` inside an activated release), and the doctor row probes the same resolution.
    - Strip `FGOS_HOST_BIN` in `workerBaseEnv` (`adapters.mjs:126-143`).
    - Record the host version in `bindingInput`.
    - For the dev door, make `resolveActiveHostBin` honour `FGOS_ACTIVE_MANIFEST_PATH`, or have the dev door export `FGOS_HOST_BIN`. Land that small fix on main first.
    - Set an explicit route timeout and budget; today's copied default is 60 s (`terminal-control/client.mjs:7`).
    - Sources: security 4, failure 9.
11. **HIGH — other raise doors.**
    - Honour `seats[].tier` only from registered, loader-sourced workflow definitions. Refuse it from `--units` and `--unit` files (`units-source.mjs:97` tags the source).
    - A door-selected persona, seat or capability whose resolved tier is above the no-selector resolution counts as a raise: name it in `tierSource` and put it in the G5 proof.
    - The crate ignores `acceptDependence` unless `raiseAuthorized` is set (defence in depth). List every `runUnit` caller door: `work-dispatch.mjs:127`, `operation-choice.mjs:2332`, `fanout-batch.mjs:113`.
    - Sources: security 5, 6.
12. **HIGH — JS model choice left behind.** Add to the 06/07 move-or-delete lists:
    - `resolveTierModel` (7 call sites: `loop.mjs:1614`, `dispatch/cli.mjs:593`, `assignment-runner.mjs:230`, `assignment-policy.mjs:449`, `model-pool-checks.mjs:209`, `scripts/project-agents.mjs:87`, `bind.mjs:309`);
    - `resolveTierCandidates`, `tierFallbackOf`, `resolveStrongerTier`, `TIER_STRENGTH`;
    - `dispatch/assignment.mjs:606`;
    - the barrel `src/runner/dispatch.mjs:28,40-41,66-68`;
    - `scripts/project-agents.mjs:36,84-89` (persona rigor → model; derive from the crate or drop).

    Add these names and `scripts` to the criterion-1 grep.
    - Sources: scope 3, 4.
13. **HIGH — one authority for effective rigor.** `patterns/reviewed.mjs:45,91` (exact-key, no prefix) and `dispatch/plan.mjs:415`, `dispatch/cli.mjs:576`, `assignment-policy.mjs:287` compute it in Node, while the crate computes it with prefix inheritance.
    - Pick one: the crate returns effective rigor and checker composition to the resolver, or Node owns it and the crate takes it as input.
    - Delete the other path.
    - Source: scope 7.
14. **HIGH — concurrent rebind.** A lease-conflict rebind happens inside the parallel launch (`assignment-runner.mjs:1622-1645`; `reviewed.mjs:354`, `panel.mjs:77` use `Promise.allSettled`).
    - Serialize the ledger-read → bind → publish sequence per unit.
    - Re-check hard rules for already-bound seats when a rebind changes family.
    - Test: two checkers hit lease-conflict at once.
    - Source: failure 7.
15. **HIGH — drift, landing and rollback.**
    - Every main→track merge from 06 on re-runs `convertRunnerConfig` on the merged config and flags new `rigor` keys.
    - Phase 12 gets a step: merge main into the track, run the full `npm test` and the grep criterion, then land.
    - If GIT 07 has landed by then, write the landing steps with the Land/Sync verbs.
    - Ship the record fence on main ahead of the wave as a small separate change, so the current release refuses records that carry `seatSchema`. Otherwise rollback must drain new-release records before re-activating the old release.
    - Sources: failure 5, 8.
16. **MEDIUM (apply):**
    - (a) Phase 06 deletes `resolveTierCeiling`, which `model-pool-checks.mjs:12,205` imports. Move the removal of `capability-rigor-ceiling` and `runner-rigor-config` into 06 together with their tests. Phase 09 only adds rows. (scope 8)
    - (b) Re-cite every § against `docs/specs/seat-binding.md`, which is on main: do-not-add §12, proofs §11, conversion §9, personas §6.4, independence §7.3. Phase 11 becomes "status → implemented + pointer edits + spec errata", since D-ADR0072 and the supersede pointers already landed. Add `docs/how-to/install-fgos-in-a-project-and-use-doctor.md:233,237` and `docs/specs/work-state.md:54`. Cite `component-boundary.md:64`. (security 8, scope 9)
    - (c) Drop the `fgos agents` layer/scope listing (not in the spec) and the kept measurement script (record the numbers in the 04 report). Delete `resolveAssignmentDispatchPolicy` instead of keeping a wrapper, and point `plan.mjs:118,174,427`, `cli.mjs` and `loop.mjs` at the facade. Decide now what happens to the `bind.mjs` walk exports (`walkBindings`, `listCandidates`, `nextCandidate`, `retrySameCandidate`; consumers `explain.mjs:7`, `run.mjs:15`, `blind-steps-proven-pools.mjs:13`). List every new file and symbol. (scope 10)
    - (d) "Conversion keeps today's tiers" is true only for capability rigor. Reword it. The conversion diff and the dry-bind output must list every workflow unit, `--rigor` use and guide `rigorFloor` whose unit rigor raises tier today (`bind.mjs:141-153`, `architecture-advisory.yaml:62`, `architecture-advisory-reopen.yaml:20`, `case-start.mjs:52-57`). Add a CHANGELOG line. (assumption 8)
    - (e) Exec budget per surface (run, explain, doctor, preflight, replay), measured as before/after wall time, with a realistic request size of about 22 KB of runner config. (assumption 9)
    - (f) Phase 00 classifies the 62 `rigorToTier` test files: fixture-only files get a codemod that writes the converter output as literal source; tests that assert rigor→tier are rewritten by hand to declared tiers and listed in the report. (failure 10)
    - (g) The doctor dry-bind row binds against a fixed headless session. "No pool configured" and account-state refusals are info, not failure. Each workspace states which refusals it expects (mcp-skill-hub has no `prefer`; mdview `group-cognition:explore`). (assumption 7)
    - (h) The named-account lease keeps the per-CLI login-store filter: accountView carries the CLI names per account (never homes), and `cli` is passed to `acquireNamedAccountLease`. (security 7)

## Rejected

- **Pricing the in-process Node addon as a third option in the reversal trigger** (scope 10 part). Pricing an option builds nothing, and the addon is still Rust; it is the existing `packages/git/node-addon` pattern. It stays as information for the S-vs-B question. It is not a new option the plan implements.

## Open questions raised by reviewers, answered by the big lead

- **Does the test suite isolate HOME?** Assume yes (the reviewers saw temp HOMEs), so findings 1 and 2 need explicit tests with a real global file (accepted items 1 and 3).
- **Does the second machine's global file also carry `rigorToTier`?** Treat it as yes; the sanitizer in item 1 covers both machines.
- **Can a worker write `.fgos/assignments`?** Treat it as yes; item 9 removes the trust either way.
