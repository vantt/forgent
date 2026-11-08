# HARDEN T6 P02: Playbook integrate step deleted (lead report)

Branch `harden/t6-p02-integrate-deleted`, not landed: waits on lead:OPC's pick for the Land consumer proof.

## What changed
- `definition.mjs`: step `kind: integrate` and step `target` are refused at load, naming the approve door; `VALID_STEP_KINDS` and the step `kind`/`target` fields are gone (a step has only the standard shape).
- `runner.mjs`: the integrate branch, `mergeWorkflowBranch`, `acknowledgeWorkflowLand` and their imports deleted.
- `unit-handoff.mjs`: write-chain walk no longer stops at integrate; `resolveIntegrationTarget({ repoRoot })` has no declared target (origin/HEAD, else the checkout branch); `settleUnitWorktrees` unchanged in meaning.
- `guide-schema.mjs`: Playbook-step mapping of integrate removed; guide activity kind `integrate` (`feature.yaml`) untouched. `index.mjs`: `mergeWorkflowBranch` export removed.
- Docs: Git spec (Land owning proof line, noncoding follow-up line), Workflow spec settled-fact subsection in section 17, runner subcomponent spec (two stale integrate-step clauses), CHANGELOG line.

## Red to green
Red: `a Playbook step of kind integrate, or a step target, is refused by name...` (workflow-runner.test.mjs), committed first and failing; green after deletion.

## Retired tests -> owner
| Retired | Owner |
|---|---|
| units-runner: integration lands on the actual prepared target after an unrelated advance | test/runner/merge-land.test.mjs ("runner Land lets Land choose the current target and lands on a target that advanced meanwhile") |
| units-runner: integrate step that would land out-of-scope writes | units-runner "a unit that wrote outside its writes ends findings..." (kept; integrate step dropped from its fixture) |
| workflow-runner: integration uses the recorded replacement branch | behaviour removed (no merge door); Land conflict/no-op in merge-land.test.mjs |
| workflow-runner: integration conflict fails the workflow | merge-land.test.mjs ("root construction conflicts preserve both refs...") |
| workflow-runner: integration lands nothing for contained branch | behaviour removed; Land no-op owned by merge-land.test.mjs |
| workflow-runner: integration target: declared step target, then origin/HEAD, then checkout | rewritten in place: trunk resolution half stays |
| workflow-runner: a step target is accepted on integrate steps only | replaced by the refusal case |
| workflow-runner: integrate helpers (create, merge, cleanup) | renamed to worktree create + cleanup; merge half removed |
| case-verbs: an answered gate lets the integrate step land | behaviour removed; gate answers owned by workflow-runner answer cases |
Rewritten in place (not retired): units-runner "out-of-scope file left uncommitted..." (no land step; asserts the branch content), workflow-runner cleanup seed (a plain `git merge --no-ff` lands the merged unit).
Added: workflow-store-ledger "a ledger written when the Playbook had an integrate step still folds and prints" (hand-built from the real event shapes: no local run holds integrate step events, only conductor snapshots that carry the guide kind).
Moved: e2e-consumer-noncoding fixture now ends at the runner's unit branch and lands it with `landRunnerItem` (provisional pick (a)-variant, see below).

## Gate
Focused 188/188 (guide-schema, units-runner, case-admission-port, case-verbs, workflow-runner, conductor-case, merge-land, architecture), store-ledger 9/9, e2e-consumer-noncoding 3/3, doc-health + citation-drift 41/41, architecture 81 with docs, one-door scan 0 undeclared (census regenerated). Full `npm test` not run (phase not landing).

## Net size
src/workflow: 15 insertions, 138 deletions (Node -123 against the -130 budget); tests about -265 deletions, +30 added.

## Open
- OPC pick: asked by mailbox (recorded d58887b24dc0eb4a) with options (a) merge-land.test.mjs, (b) `fgos run --writes`; no answer yet. I implemented the proposal variant: keep the labelled e2e fixture and land through `landRunnerItem`. If OPC picks (a) strictly or (b), only that test and two spec lines move. The fixture needs `.fgos/` ignored because `landRunnerItem` refuses a dirty main checkout (the removed step's Land call did not).
- The big-lead review of the retired -> owner table could not precede the deletion commit; the table is above and in the commit body.
- Stored workflow definitions: resuming a run whose stored Playbook definition has an integrate step now refuses at reload (no shipped user has one).
