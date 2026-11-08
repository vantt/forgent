---
phase: 02
title: "The Playbook integrate step is deleted: no second merge door to the trunk; a definition that declares it is refused by name; the Land consumer proof moves where OPC places it"
status: pending
depends_on: ["OPC's pick for the Land consumer proof (step 1)"]
parallel: "wave 0, with 01"
effort: ~1d
net_size: "Node −130 / Rust 0 / tests −250 (estimate)"
---

# Phase 02 — Playbook integrate step deleted (Q2 a = simplicity 3 = R-4 = B-6)

## Context

Owner decision 71 (2a): "the Playbook `integrate` step is deleted (OPC places the Land consumer proof)". Arbitration §1 Playbook runner delete list; §3 row Git. Doing this before the runner cut (P05) removes about 150 lines the cut would otherwise reshape.

Code read on `595faa273`: `VALID_STEP_KINDS` `definition.mjs:30`; `target` rule `:202-207`; guide mapping of a Playbook step `guide-schema.mjs:162-164`; runner branch `runner.mjs:205-250` (calls `mergeWorkflowBranch` `:227`, `acknowledgeWorkflowLand` `:250`); `mergeWorkflowBranch` `:604-630`; `acknowledgeWorkflowLand` `:632-642`; write-chain walk stops at integrate `unit-handoff.mjs:212-233`; `resolveIntegrationTarget` `:324-337` (declared target `:326`); `settleUnitWorktrees` `:359-398` (`deliveredTo` via the integration target `:367-368`, `branch not integrated` `:383`); `index.mjs` exports `mergeWorkflowBranch`, `resolveIntegrationTarget`, `createWorkflowWorktree`, `cleanupWorkflowWorktree` (production importers outside `src/workflow`: none, `rg` over `src bin scripts`). Shipped users: none (`feature.yaml:148` is a guide activity run by `fgos workflow gate`; it stays). Tests: `case-verbs.test.mjs:52`, integrate cases in `units-runner.test.mjs`, `case-admission-port.test.mjs`, `workflow-runner.test.mjs` integration group (titles near 206, 1205-1271, 2218-2294 at baseline), `test/git/e2e-consumer-noncoding.test.mjs:73-91`. Git spec: `docs/platform/git/spec.md:361` (owning Land proofs include `units-runner.test.mjs`), `:1072` (the noncoding fixture). Census: hashes of `runner.mjs`, `unit-handoff.mjs`.

## Requirements

1. **OPC first.** Message OPC (SendMessage on this machine + one board line): the step goes; options for the noncoding writing-land proof: (a) re-home on `test/runner/merge-land.test.mjs` (already the main Land owner) as a non-coding consumer case, (b) on `fgos run --writes` (the door that commits and lands a Unit). Wait for the pick before step 4; steps 2-3 may proceed.
2. Delete the Playbook step kind `integrate` (`VALID_STEP_KINDS` becomes `standard` only; a step `kind: integrate` or a `target` is refused by name, `WorkflowDefinitionError` naming the approve door), the runner branch, `mergeWorkflowBranch`, `acknowledgeWorkflowLand`, the integrate stop in the write-chain walk, the declared-target use of `resolveIntegrationTarget`, the `index.mjs` exports of removed names.
3. **Keep** the guide activity kind `integrate` (`feature.yaml:148`, conductor) and its proofs; remove only `guide-schema.mjs:162-164`'s Playbook-step mapping (RT-4).
4. **Worktree cleanup keeps its meaning (RT-5):** `settleUnitWorktrees` still treats a passed writing Unit as delivered when its branch is an ancestor of the trunk ref resolved by the existing Inspect rule (`origin/HEAD`, else the checked-out branch); only the declared integrate target goes. Proof: the cleanup cases of `test/workflow/unit-handoff.test.mjs`.
5. **Old ledgers** that hold integrate step events still fold and print: one fixture ledger (copied from a real run, trimmed) read through `projectWorkflowState`/`statusWorkflow` in `workflow-store-ledger.test.mjs`.
6. Git spec lines `:361` and `:1072` rewritten to OPC's pick (OPC reviews); census regenerated.

## Files

**Create:** none (the re-homed proof extends an existing file).

**Modify:** `src/workflow/definition.mjs`, `src/workflow/guide-schema.mjs` (`:162-164` only), `src/workflow/runner.mjs`, `src/workflow/unit-handoff.mjs`, `src/workflow/index.mjs`, `docs/platform/git/spec.md`, `test/git/e2e-consumer-noncoding.test.mjs`, the test OPC picks (`test/runner/merge-land.test.mjs` or the `fgos run --writes` owner), `test/workflow/workflow-store-ledger.test.mjs` (old-ledger fixture), `CHANGELOG.md`, census, `docs/architecture-manifest.json` only if a file goes.

**Delete:** step kind `integrate`, `mergeWorkflowBranch`, `acknowledgeWorkflowLand`, runner `:205-250`, the integrate stop in `unit-handoff.mjs:224,233`, the declared target `:326`, their `index.mjs` exports.

**Tests to retire** (each names its owner):
- `case-verbs.test.mjs:52` "an answered gate lets the integrate step land the writing unit branch on main": behaviour removed; answering a gate is owned by `case-runtime.test.mjs`/`case-verbs.test.mjs` answer cases; landing by `test/runner/merge-land.test.mjs`.
- `units-runner.test.mjs:140` "workflow integration lands on the actual prepared target after an unrelated advance" and `:334` "an integrate step that would land a unit with out-of-scope writes fails and says so": behaviour removed; Land onto a moved target is owned by `test/runner/merge-land.test.mjs`; out-of-scope writes ending `findings` by `units-runner.test.mjs:207` (kept).
- `workflow-runner.test.mjs:206` "integrate helpers: create worktree, merge branch, and cleanup": the merge half removed; worktree create/cleanup owned by `unit-handoff.test.mjs` (lead confirms the case exists, else moves that half there).
- `workflow-runner.test.mjs:1251` "integration target: declared step target, then origin/HEAD, then the checkout branch": the declared-target branch removed; the trunk-resolution half stays if `settleUnitWorktrees` keeps it (requirement 4), rewritten in place.
- `workflow-runner.test.mjs:1271` "a step target is accepted on integrate steps only": replaced by the red refusal case (step 2).
- `workflow-runner.test.mjs:2218`, `:2259`, `:2294` (integration uses the replacement branch; conflict fails and preserves branches; lands nothing for a contained branch): behaviour removed; Land conflict and no-op proofs owned by `test/runner/merge-land.test.mjs`.
- `workflow-runner.test.mjs:1205`, `:1239` (finished workflow removes integrated unit worktrees; trunk `master`): kept, they prove requirement 4.
- Integrate cases in `case-admission-port.test.mjs` (lead lists titles in the step-3 table): behaviour removed; admission of a writing activity owned by its non-integrate cases.
- The retired → owner table is written in the phase report and reviewed by the big lead **before** the deletions commit (plan acceptance 6).
- `test/git/e2e-consumer-noncoding.test.mjs:91` integrate fixture: moved to OPC's pick (not retired).

**Cross-lane one-liners:** none (`test/workflow/case-verbs.test.mjs` is rebase-only with P01: P01 adds cases, P02 deletes one).

## Net size

Node: about −130 (runner −50, `mergeWorkflowBranch`/`acknowledgeWorkflowLand` −40, unit-handoff −25, definition −15, guide-schema −3, index −3, refusal +6). Tests: about −250 (integration groups) +15 (old-ledger fixture, re-homed proof net).

## Steps

1. OPC message and board line (requirement 1).
2. Red: a definition with `kind: integrate` is accepted today → test expects refusal by name (`guide-schema.test.mjs` or the definition cases); commit red.
3. Deletions (requirements 2-4); old-ledger fixture (5); retire tests with owners.
4. After OPC's pick: move the noncoding writing-land case; Git spec lines; census.
5. `rg -n "integrate" src/workflow` → only the guide activity path and comments that state the approve door; CHANGELOG ("a Playbook step `kind: integrate` is refused; merge happens at the approve door").

## Validation (focused)

- FR `test/workflow/guide-schema.test.mjs test/workflow/unit-handoff.test.mjs test/workflow/units-runner.test.mjs test/workflow/case-admission-port.test.mjs test/workflow/case-verbs.test.mjs test/workflow/workflow-runner.test.mjs test/workflow/workflow-store-ledger.test.mjs test/workflow/conductor-case.test.mjs test/git/e2e-consumer-noncoding.test.mjs test/runner/merge-land.test.mjs`
- `node scripts/git-one-door-scan.mjs --root .` → 0 undeclared.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A consumer project declares `kind: integrate` in its own YAML | L × M | Refused by name at load with the approve-door hint; CHANGELOG and guide line |
| Guide activity `integrate` lost (RT-4) | L × H | Requirement 3; `conductor-case.test.mjs` green |
| Worktree cleanup changes (RT-5) | M × M | Requirement 4 |
| OPC slow to pick | M × L | Steps 2-3 land-ready; step 4 is the only wait; the phase lands after the pick |

## Rollback

Revert the merge; re-activate the previous release. New ledgers carry no integrate events, so the old release reads them.

## Done when

OPC pick recorded on the board; deletions done; old-ledger fixture green; Git spec lines reviewed by OPC; landed with smoke `fgos workflow start council-lite --foreground` in a scratch project (read-only preset) and `fgos workflow status`; guide section written.

## Lead brief essentials

Delete the Playbook step kind only, never the guide activity kind. Wait for OPC before moving the Git consumer proof. All plan.md lead rules apply.
