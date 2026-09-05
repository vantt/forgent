---
name: fgos-code-panel
user-invocable: false
description: >-
  Get a single, straightforward code change implemented and independently
  reviewed + red-teamed through the real `fgos coordination` CLI doors --
  no plan.md/phase-NN.md track required, no fgOS Work items, no lifecycle
  stage, no UI/dashboard. Self-contained: dispatches through the same
  hardened CoordinationSession engine and `standalone-master-coordination-
  loop` protocol `fgos-plan-loop` uses (real mutation-gating, real quorum
  close), with its own coding-flavored doer/reviewer/red-team persona
  roster and its own concrete request examples -- reading `fgos-plan-loop`
  is not required to use this skill. Use when someone has one concrete
  code change in mind and wants it done with a real independent
  second/third opinion, not a whole multi-cell track. Examples: "implement
  this fix and get it reviewed+red-teamed", "run a code panel on this
  change", "get an independent review and red-team on this patch before I
  merge it".
---

# fgos-code-panel

Dispatches through the exact same CoordinationSession engine
([`session-engine.mjs`](../../../src/runner/coordination/session-engine.mjs)),
request schema
([`schema.mjs`](../../../src/verbs/coordination/schema.mjs)), and
[`standalone-master-coordination-loop`](../../../core/coordination-protocols/standalone-master-coordination-loop.yaml)
FlowDefinition that `fgos-plan-loop` uses -- not a copy, the same code
path. This is a real, necessary dependency, not a documentation
convenience: that engine is what already earned its hardening (real
mutation-gating against a forged-stamp attack and a ticket-reuse attack,
real quorum-close, real resumability from a persisted event log alone) --
forking it would mean re-earning all of that from zero for no reason.
Everything else below is this skill's own: its own Non-Goals in its own
words, its own actor roster, its own worked request examples. Nothing
here requires opening `fgos-plan-loop` to understand or use.

## Non-Goals

- **No fgOS Work items, ever.** Never `fgos pick/cook/submit`, claims, or
  a fgos-runner loop to drive a code-panel cell. Enforced at the schema
  boundary independently of this skill's own discipline: any field
  carrying Work-lifecycle authority (`approve`, `merge`, `claim`,
  `workStatus`, `missionId`) is rejected before it reaches the session
  engine (`WORK_LIFECYCLE_KEYS`/`assertNoWorkLifecycleKeys`,
  `schema.mjs:46-50,98-114`). This skill never reads or writes an item's
  `stage` and never claims anything through the pull door -- deliberately
  NOT a member of the `fgos-coding-*` stage-routed family
  (`fgos-coding-discovering/planning/validating/...`) even though both
  live in this same repo.
- **No git merge authority inside the session.** A `produce-candidate`/
  `revise-candidate` step may commit its own work on the cell's own
  worktree branch (the default executor already permits `git add`/`git
  commit` there) -- but only the Lead merges that branch into the target
  branch, by hand, outside any coordination request, after the cell
  closes.
- **No design-doc ceremony.** `objective` names the exact file(s)/
  behavior to change directly, in plain text -- not a pointer to a
  separate design document. A change big enough to need its own design
  discussion before implementation is a `fgos-plan-loop` track, not this
  skill.

## Known gap (`tsk-371`, not fixed yet)

`src/verbs/coordination/run.mjs`'s operation-step dispatch does not
forward a step's own declared `mutation: "mutating"` into
`dispatchDeclaredOperation` (confirmed by `grep -n "mutation"
src/verbs/coordination/run.mjs` returning zero matches, and live four
separate times during this project's own R5 live proof). **Effect for
this skill specifically:** a `produce-candidate`/`revise-candidate` step
whose real commit lands correctly still comes back with RunResult
`status: "failed"`. Work around it directly, every time: after a
produce/revise step reports, check `git log`/`git diff` in the cell's own
worktree for the expected commit, and run the target project's real test
command there. If the real commit and real tests both check out, treat
the step as genuinely successful in your own disposition, and record in
the disposition `rationale` that the `"failed"` grading is this known
gap, not a real defect.

## Default actor roster

Executor/tier mapping already decided for this product line (doer/fixer
-> `agy-cli`, reviewer -> `claude`, red-team -> `codex-cli`), personas
tuned for reading/writing/attacking real code:

```json
"actors": [
  { "id": "doer", "executor": "agy-cli", "tier": "standard", "persona": "focused-code-implementer" },
  { "id": "reviewer", "executor": "claude", "tier": "analytical", "persona": "code-quality-reviewer" },
  { "id": "red-team", "executor": "codex-cli", "tier": "analytical", "persona": "edge-case-and-security-attacker" }
]
```

Fix-round roster:

```json
"actors": [
  { "id": "fixer", "executor": "agy-cli", "tier": "standard", "persona": "surgical-fixer" },
  { "id": "reviewer", "executor": "claude", "tier": "analytical", "persona": "code-quality-rechecker" },
  { "id": "red-team", "executor": "codex-cli", "tier": "analytical", "persona": "relentless-code-attacker" }
]
```

`persona` is free-form prose the executor receives as framing, not a
closed vocabulary (`schema.mjs:133` `ACTOR_ALLOWED_KEYS`) -- sharpen any
of these for a specific change (a security-sensitive diff wants an even
sharper red-team persona), but keep the roster shape and the
executor/tier mapping unless there is a real reason to diverge.

## 1. Open the cell

```sh
git worktree add ../<change-slug> -b code-panel--<change-slug> <base-branch>
```

`open.json`:

```json
{
  "kind": "declared-protocol",
  "objective": "Implement <the real code change, named directly> and get it independently reviewed + red-teamed.",
  "writerId": "<lead-identity>",
  "coordinationId": "code-panel--<change-slug>",
  "protocolRef": { "id": "core.coordination-protocol.standalone-master-coordination-loop" },
  "actors": [
    { "id": "doer", "executor": "agy-cli", "tier": "standard", "persona": "focused-code-implementer" },
    { "id": "reviewer", "executor": "claude", "tier": "analytical", "persona": "code-quality-reviewer" },
    { "id": "red-team", "executor": "codex-cli", "tier": "analytical", "persona": "edge-case-and-security-attacker" }
  ],
  "steps": [
    {
      "type": "operation",
      "as": "produce",
      "operationId": "produce-candidate",
      "targetActorId": "doer",
      "taskKey": "produce-candidate-doer",
      "objective": "Implement <exact file(s)/behavior>. Land a real commit on this worktree's own branch; run <the target project's real test command> and confirm it passes before reporting done.",
      "expectedOutputs": ["a real git commit on this worktree's branch", "agent-result.json (status, summary, the test command's real outcome)"],
      "mutation": "mutating"
    },
    {
      "type": "operation",
      "as": "review",
      "operationId": "review-candidate",
      "targetActorId": "reviewer",
      "taskKey": "review-candidate-reviewer",
      "objective": "Independently review the real commit for correctness, test coverage, and dead code -- read the diff directly, never trust the doer's own summary alone.",
      "expectedOutputs": ["agent-result.json (status, summary, findings by severity)"],
      "contextRefs": ["$ref:produce"]
    },
    {
      "type": "operation",
      "as": "redTeam",
      "operationId": "red-team-candidate",
      "targetActorId": "red-team",
      "taskKey": "red-team-candidate-red-team",
      "objective": "Attempt to break the real commit through named attacks: edge cases, boundary values, and any invariant the objective implies but never states as an explicit test.",
      "expectedOutputs": ["agent-result.json (status, summary, findings by severity)"],
      "contextRefs": ["$ref:produce"]
    }
  ]
}
```

Dispatch, pointed at the worktree:

```sh
fgos coordination run --cwd ../<change-slug> --file open.json
```

`--cwd` is required for `mutation: "mutating"` to be legal on `produce`
-- `produce-candidate` is the one operation this protocol declares
`result.kind: work-product` for
(`standalone-master-coordination-loop.yaml`'s own `operations[]`); the
engine refuses `"mutating"` whenever `cwd` resolves to the main checkout
(full four-condition Mutation Rule:
[`coordination-session.md`](../../../docs/architect/agent-coordination/contracts/coordination-session.md),
"Mutation Rule" section).

## 2. Read results, disposition findings

```sh
fgos coordination show code-panel--<change-slug> --json
```

Verify the doer's real outcome yourself first (known gap above), then
record each accept/reject/deferred decision as a `disposition` step:

```json
{
  "type": "disposition",
  "as": "dispositionReviewHigh1",
  "targetRef": "<real assignment id from the show/run result above, e.g. asgn_...>",
  "disposition": "accepted",
  "rationale": "Reviewer HIGH-1 (missing test for X) accepted; routed to fix-1.json.",
  "evidenceRefs": []
}
```

## 3. Fix round (`fix-1.json`), only if a finding was accepted

Every position past the required first pass
(`revise-candidate`/`reviewer-recheck`/`red-team-recheck`) is
`activation.mode: driver-authorized` -- pair an `authorize` + `operation`
step per position, all resuming the same `coordinationId`:

```json
{
  "kind": "declared-protocol",
  "objective": "Fix round 1: apply the accepted findings and get an independent recheck.",
  "writerId": "<lead-identity>",
  "coordinationId": "code-panel--<change-slug>",
  "protocolRef": { "id": "core.coordination-protocol.standalone-master-coordination-loop" },
  "actors": [
    { "id": "fixer", "executor": "agy-cli", "tier": "standard", "persona": "surgical-fixer" },
    { "id": "reviewer", "executor": "claude", "tier": "analytical", "persona": "code-quality-rechecker" },
    { "id": "red-team", "executor": "codex-cli", "tier": "analytical", "persona": "relentless-code-attacker" }
  ],
  "steps": [
    { "type": "authorize", "as": "authRevise", "operationId": "revise-candidate", "targetActorId": "fixer", "authorizationId": "auth_codepanel_<change-slug>_fix1_revise", "invocationKey": "code-panel:<change-slug>:fix1:revise:1", "reason": "Reviewer HIGH-1 accepted; apply the fix." },
    { "type": "operation", "as": "revise", "operationId": "revise-candidate", "targetActorId": "fixer", "taskKey": "revise-candidate-fixer", "objective": "Apply the accepted findings. Land a real commit; re-run the target project's real test command.", "expectedOutputs": ["a real git commit", "agent-result.json (status, summary, the test command's real outcome)"], "mutation": "mutating" },
    { "type": "authorize", "as": "authReviewRecheck", "operationId": "reviewer-recheck", "targetActorId": "reviewer", "authorizationId": "auth_codepanel_<change-slug>_fix1_reviewer_recheck", "invocationKey": "code-panel:<change-slug>:fix1:reviewer-recheck:1", "reason": "Revision landed; recheck against the original finding." },
    { "type": "operation", "as": "reviewRecheck", "operationId": "reviewer-recheck", "targetActorId": "reviewer", "taskKey": "reviewer-recheck-reviewer", "objective": "Recheck the revised commit against the accepted findings.", "expectedOutputs": ["agent-result.json (status, summary)"], "contextRefs": ["$ref:revise"] },
    { "type": "authorize", "as": "authRedTeamRecheck", "operationId": "red-team-recheck", "targetActorId": "red-team", "authorizationId": "auth_codepanel_<change-slug>_fix1_red_team_recheck", "invocationKey": "code-panel:<change-slug>:fix1:red-team-recheck:1", "reason": "Revision landed; re-attempt the same class of attack." },
    { "type": "operation", "as": "redTeamRecheck", "operationId": "red-team-recheck", "targetActorId": "red-team", "taskKey": "red-team-recheck-red-team", "objective": "Re-attempt any attack that previously succeeded against the revised commit.", "expectedOutputs": ["agent-result.json (status, summary)"], "contextRefs": ["$ref:revise"] }
  ]
}
```

Dispatch (still pointed at the worktree -- `revise-candidate` is the one
recheck-round operation declaring `result.kind: work-product`):

```sh
fgos coordination run --cwd ../<change-slug> --file fix-1.json
```

Repeat with `fix-2.json`, ... (new `authorizationId`/`invocationKey`
values each time) if a recheck itself surfaces a new accepted finding.

## 4. Close

A `disposition` step with `disposition: "cell-closed"` is the whole
close mechanism -- `runCoordinationUseCase` always attempts a quorum
close as its own last step after every declared step finishes
dispatching. Close only once the required first pass and every fix round
this change needed have dispatched cleanly and the real target-project
test command passes:

```json
{
  "kind": "declared-protocol",
  "objective": "Close: independent review + red-team both clean, real tests pass, commit lands.",
  "writerId": "<lead-identity>",
  "coordinationId": "code-panel--<change-slug>",
  "protocolRef": { "id": "core.coordination-protocol.standalone-master-coordination-loop" },
  "actors": [
    { "id": "doer", "executor": "agy-cli", "tier": "standard", "persona": "focused-code-implementer" },
    { "id": "reviewer", "executor": "claude", "tier": "analytical", "persona": "code-quality-reviewer" },
    { "id": "red-team", "executor": "codex-cli", "tier": "analytical", "persona": "edge-case-and-security-attacker" }
  ],
  "steps": [
    {
      "type": "disposition",
      "as": "closeCell",
      "targetRef": "<real assignment id of the final, accepted revise/recheck dispatch>",
      "disposition": "cell-closed",
      "rationale": "Reviewer + Red-Team recheck both clean; real tests pass; commit <hash> lands on code-panel--<change-slug>.",
      "evidenceRefs": ["<real assignment id of reviewRecheck>", "<real assignment id of redTeamRecheck>"]
    }
  ]
}
```

```sh
fgos coordination run --cwd ../<change-slug> --file close.json
```

Then, outside this skill and outside the coordination session entirely
-- the Lead's own git operation, never a coordination request:

```sh
git -C <main checkout> merge --no-ff code-panel--<change-slug>
git worktree remove ../<change-slug>
```

No `index.md`, no track directory, no cross-cell sequencing -- one
change, one cell, done.
