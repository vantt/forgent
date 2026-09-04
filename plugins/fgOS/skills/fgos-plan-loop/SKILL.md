---
name: fgos-plan-loop
user-invocable: false
description: >-
  Drive a Work-independent, plan-driven implementation track (one that
  matches docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md's
  audit -> cell -> review -> red-team -> fix -> close loop) entirely
  through the real `fgos coordination` CLI doors (`chain`/`run`/`show`)
  and the `standalone-master-coordination-loop` FlowDefinition -- never
  fgOS Work items, claims, `fgos pick/cook/submit`, or a fgos-runner loop.
  Use when a Lead session needs to resume/open/authorize/close a cell on
  a track that a plan.md/phase-NN-*.md pair drives, and independence
  (separate Doer/Reviewer/Red-Team/Fixer dispatches, resumable by a fresh
  process with zero hand-fed chat history) matters. Examples: "resume
  <track> and tell me what's next", "open the next cell for <track>",
  "authorize a fix round for cell <id>", "close cell <id> and report the
  commit".
---

# fgos-plan-loop

The group-thinking-native successor to
[`master-coordinator.md`](../../../docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md)
for **Work-independent** tracks: instead of a hand-pasted prompt block a
Lead session interprets from scratch each time, this skill distills the
same audit -> cell -> review -> red-team -> fix -> close loop into calls
onto the CoordinationSession runtime's own public doors --
`fgos coordination chain` (resume/status), `fgos coordination run
--file <request>` (open/authorize/dispatch/close), and
`fgos coordination show` (read-only detail) -- and the
[`standalone-master-coordination-loop`](../../../core/coordination-protocols/standalone-master-coordination-loop.yaml)
FlowDefinition, which declares exactly this loop's own worker graph:
`doer` -> `reviewer`/`red-team` (first pass, required) -> `fixer` ->
`reviewer`/`red-team` recheck (driver-authorized, optional).

Every request this skill composes is re-validated end to end by
`validateCoordinationRequest`
([`src/verbs/coordination/schema.mjs`](../../../src/verbs/coordination/schema.mjs))
exactly like any hand-authored request file -- this skill narrows what a
Lead needs to write by hand, it never bypasses that boundary or opens a
second dispatch path. Protocol semantics (which operation is
driver-authorized, which declares `result.kind: work-product`) live in
the FlowDefinition itself, never restated as skill prose that could drift
from it -- read the YAML linked above, not this file, for the graph's own
ground truth.

## Non-Goals

- **No Work involvement, ever.** Never `fgos pick/cook/submit`, claims,
  or Work items to coordinate a track this skill drives. The
  request-schema boundary enforces this independently of this skill's own
  discipline: any field anywhere in a request carrying Work lifecycle
  authority (`approve`, `merge`, `claim`, `workStatus`, `missionId`, and
  siblings) is rejected before it ever reaches the session engine
  (`schema.mjs:46-50` `WORK_LIFECYCLE_KEYS`, enforced recursively at
  `schema.mjs:98-114` `assertNoWorkLifecycleKeys`, per ADR-001). A
  session's own `workRef` (if set at all) is read-only context, never a
  lifecycle channel.
- **No git authority inside the session.** No step type in the five-kind
  request vocabulary (`operation` / `authorize` / `disposition` /
  `fan-out` / `contribution`, `schema.mjs:491-507`) can invoke `git
  merge`, `git push`, or otherwise touch the track/main branch -- merging
  is a Lead action taken **outside** any coordination request, never
  something a template below expresses. The Lead performs every merge
  into the track/main branch itself, by hand, after a cell closes.
- **Commit policy (Phase 01 of this same track).** A Doer/Fixer dispatched
  through a mutating `operation` step MAY commit its own work on the
  cell's own linked-worktree branch -- the default executor already
  permits `git add`/`git commit` there. Only the **Lead** merges that
  branch into the track/main branch; the coordination session itself
  never merges, and this skill never automates that merge step.

## 0. Resume: `fgos coordination chain <track>`

Read-only, reconstructed entirely from each matching session's own
persisted event log (never a cached plan/status file --
[`chain.mjs`](../../../src/verbs/coordination/chain.mjs) header comment,
lines 1-18). Always run this FIRST, including in a genuinely fresh
process with zero prior chat context -- it is the one command this whole
skill assumes a Lead can resume from cold:

```sh
fgos coordination chain <track> --json
```

Returns `{track, cells, activeCell, nextAction}` (`chain.mjs:116-157`):
every session id starting with the exact `<track>--` prefix (and no
further `--` in its own remainder, so a differently-prefixed track's
session can never be misfiled under this one, `chain.mjs:41-53`) is
rendered as one cell record (`cellId`, `status`, `phase`,
`lastDisposition`, `pendingDriverAuthorizations`, `assignmentRefs`,
`quorum`); `activeCell` names the most-recently-created still-`active`
cell (or `null` if none has opened yet -- a legitimate state, not an
error); `nextAction` is a plain-text hint built only from fields `show`
already derives (never a new replay of its own, `chain.mjs:59-70`). A
cell whose own session read failed renders with a `renderError` instead
of aborting every other cell's render (`chain.mjs:78-114`).

**Session-id charset gotcha** (a real gap this skill's own authoring
surfaced, not theoretical): `coordinationId` must satisfy the safe
filesystem charset -- letters, digits, underscore, hyphen only
(`schema.mjs:29`, `schema.mjs:64-69`). This repo's own cell-trace-file
naming (`P01.1.md`, `P03.1.md`) uses a **period**, which is *not* in that
charset. Never reuse a period-containing trace-file name as the raw
`<cellId>` suffix of a `coordinationId` you compose below -- pick a
charset-safe cellId instead (e.g. `p01-1` or `cell-01`) even when the
verification doc that tracks the same cell keeps its period-containing
filename.

## 1. Open a cell (`open.json`)

1. **Create the worktree first, as a plain git operation, outside any
   coordination request** -- no request field expresses worktree
   creation; `--cwd` (below) just names a path that must already resolve
   to a linked git worktree before you dispatch into it (Mutation Rule,
   condition 3, below):

   ```sh
   git worktree add ../<track>-<cell-id> -b <track>--<cell-id> <base-branch>
   ```

2. **Compose `open.json`** dispatching the fixture's required first pass
   -- `produce-candidate` (Doer, real mutating work) then
   `review-candidate` + `red-team-candidate` (Reviewer/Red-Team, always
   advisory-only for this fixture). Every field below is cited against
   the real, current schema -- nothing here is copied from an earlier
   design sketch without re-verification.

   ```json
   {
     "kind": "declared-protocol",
     "objective": "Implement cell-01's scoped requirement set and get independent review + red-team on the result.",
     "writerId": "<lead-identity>",
     "coordinationId": "<track>--cell-01",
     "protocolRef": { "id": "core.coordination-protocol.standalone-master-coordination-loop" },
     "actors": [
       { "id": "doer", "executor": "agy-cli", "tier": "standard", "persona": "meticulous-implementer" },
       { "id": "reviewer", "executor": "claude", "tier": "analytical", "persona": "skeptical-reviewer" },
       { "id": "red-team", "executor": "codex-cli", "tier": "analytical", "persona": "adversarial-tester" }
     ],
     "steps": [
       {
         "type": "operation",
         "as": "produce",
         "operationId": "produce-candidate",
         "targetActorId": "doer",
         "taskKey": "produce-candidate-doer",
         "objective": "Implement the current-cell contract. Source plan/artifact: plans/<track>/phase-01-<name>.md.",
         "expectedOutputs": ["agent-result.json (status, summary)"],
         "mutation": "mutating"
       },
       {
         "type": "operation",
         "as": "review",
         "operationId": "review-candidate",
         "targetActorId": "reviewer",
         "taskKey": "review-candidate-reviewer",
         "objective": "Independently review the candidate produced from the current-cell contract.",
         "expectedOutputs": ["agent-result.json (status, summary)"],
         "contextRefs": ["$ref:produce"]
       },
       {
         "type": "operation",
         "as": "redTeam",
         "operationId": "red-team-candidate",
         "targetActorId": "red-team",
         "taskKey": "red-team-candidate-red-team",
         "objective": "Attempt to falsify the candidate's success claims through named bug/invariant attacks.",
         "expectedOutputs": ["agent-result.json (status, summary)"],
         "contextRefs": ["$ref:produce"]
       }
     ]
   }
   ```

   Field-by-field grounding:
   - `kind`/`objective`/`writerId`/`coordinationId`/`protocolRef`/`steps`/`actors`
     — top-level allowlist, `schema.mjs:509-512` `TOP_LEVEL_ALLOWED_KEYS`;
     `objective` non-empty <= 20000 chars (`schema.mjs:514,551-553`);
     `writerId` required non-empty string, the trusted driver identity
     every follow-up request on this `coordinationId` must match exactly
     to resume rather than be refused (`schema.mjs:554-555`,
     `docs/how-to/run-a-coordination-session.md:18-24`); `coordinationId`
     safe-charset (`schema.mjs:557`, see the gotcha above);
     `protocolRef` carries only `{id}` — no inline topology
     (`schema.mjs:235-251`).
   - `actors[]` — `{id, persona?, executor?, model?, tier?}` only, never
     `role` (`schema.mjs:133,143-165` `ACTOR_ALLOWED_KEYS`/
     `validateActorsShape`); every `id` must already be declared by the
     protocol being used (`run.mjs:391-396`) — this fixture declares
     exactly `doer`/`reviewer`/`red-team`/`fixer`
     (`standalone-master-coordination-loop.yaml:49-57`).
     **Per-actor executor/tier/persona diversity only takes effect when a
     step names its actor explicitly via `targetActorId`** — `run.mjs`'s
     own per-actor policy lookup (`actorPolicyFields`) only fires when a
     step declares `targetActorId` (`run.mjs:432`); an `actors[]` entry
     with no step naming it is accepted but silently inert. Every step in
     this template sets `targetActorId` for exactly this reason.
   - `operation` step — `{type, as, operationId, targetActorId?,
     objective, expectedOutputs[], contextRefs?[], constraints?[],
     capabilities?[], fromAssignmentId?, intent?, round?, taskKey?,
     mutation?}` (`schema.mjs:253-295` `OPERATION_STEP_ALLOWED_KEYS`/
     `validateOperationStep`); `expectedOutputs` required non-empty
     (`schema.mjs:264-265`); `contextRefs[]` entries are either a
     `$ref:<label>` placeholder resolving to an assignment dispatched
     **earlier in this same call** (`schema.mjs:71-88`
     `assertSafeRefOrId`) or a plain safe id — never a raw filesystem
     path (`launch-master-loop.mjs:102,106,116` states the same
     constraint for its own `produceObjective` text, which is why a real
     plan-file pointer belongs in `objective`'s free text, not
     `contextRefs`, exactly as this template does).
   - `mutation: "mutating"` on `produce` — legal here specifically because
     `produce-candidate` is the one first-pass operation this fixture
     declares `result.kind: work-product` for
     (`standalone-master-coordination-loop.yaml:85-91`); see the Mutation
     Rule section below for all four conditions, including the `--cwd`
     flag this JSON cannot express on its own.

3. **Dispatch, pointed at the worktree you just created:**

   ```sh
   fgos coordination run --cwd ../<track>-<cell-id> --file open.json
   ```

   `--cwd` is required for the mutating `produce` step to satisfy
   Mutation Rule condition 3 (below) — it is a CLI flag, never a JSON
   field (`schema.mjs`'s `TOP_LEVEL_ALLOWED_KEYS` has no `cwd`/`dir`
   entry; `--cwd` is parsed by the CLI layer,
   `command-registry.mjs:760`). Omitting `--cwd` here does not make the
   request invalid — it makes the mutating dispatch **refused** by the
   session engine's own Mutation Rule check, because the default `cwd`
   resolves to the repo root, which for the Lead's own process is the
   main checkout.

## 2. Read results, disposition findings

```sh
fgos coordination show <coordinationId> --json
```

Read-only, no mutation, no external effect
(`docs/how-to/run-a-coordination-session.md:50-79`). Reports:
`authorizations` issued and whether each is already consumed;
`ignoredAuthorizations` (written after close, never authoritative);
`dispositions` recorded so far, each marked `postTerminal`/
`...OwnedBySession`; and — the field this skill's own loop depends on —
`pendingDriverAuthorizations`, every declared `activation.mode:
driver-authorized` operation with no matching authorization yet (`null`
for an agent-led session).

Map Reviewer/Red-Team findings from `review`/`redTeam`'s own
`agent-result.json` content onto master-coordinator.md's own severity
state machine (HIGH blocks close; MEDIUM needs a fix or an explicit,
recorded deferral; LOW may become a follow-up, section E of the Master
Prompt). Record the Lead's own accept/reject/defer decision per finding
as a `disposition` step — same step type `close.json` uses to close the
whole cell, differentiated only by `targetRef`/`disposition`/`rationale`:

```json
{
  "type": "disposition",
  "as": "dispositionReviewHigh1",
  "targetRef": "<real assignment id from the show/run result above, e.g. asgn_...>",
  "disposition": "accepted",
  "rationale": "Reviewer HIGH-1 (missing negative test for X) accepted; routed to fix-1.json.",
  "evidenceRefs": []
}
```

`disposition` step fields — `{type, as, targetRef, disposition,
rationale, evidenceRefs?[]}` (`schema.mjs:353-383`
`DISPOSITION_STEP_ALLOWED_KEYS`/`validateDispositionStep`); `disposition`
is a free-form string up to 200 chars, deliberately not a closed
vocabulary (`schema.mjs:364-369`) — `"accepted"` / `"rejected"` /
`"deferred"` per finding, `"cell-closed"` to close the whole cell
(section 4). **`targetRef` here cannot be a `$ref:` placeholder** if the
finding came from an earlier, separate `fgos coordination run` call (as
it will for any disposition step in `fix-N.json`/`close.json`, both
separate calls from `open.json`) — `$ref:<label>` only resolves within
the SAME call that declared the labelled step
(`schema.mjs:71-76,79-86`). Use the real `asgn_...`-shaped assignment id
captured from `open.json`'s own printed result or from `show`'s own
output instead; that id already satisfies the same safe-charset check
(`schema.mjs:64-69`) a plain id needs. A `disposition`/`authorize` step
can never carry a second `authorizedBy`/`linkedBy` identity — driver
provenance is pinned to the session's own top-level `writerId`
(`schema.mjs:313-317,452-456`).

## 3. Authorize + dispatch a fix round (`fix-N.json`)

Every position past the required first pass —
`revise-candidate` (Fixer), `reviewer-recheck`, `red-team-recheck` — is
`activation.mode: driver-authorized`
(`standalone-master-coordination-loop.yaml:106-159`): none of them can
materialize an Assignment without a matching `authorize` step issued by
this same request's own driver identity first. One fix round therefore
pairs an `authorize` + `operation` step per position it needs, all
resuming the SAME `coordinationId`:

```json
{
  "kind": "declared-protocol",
  "objective": "Fix round 1: apply the accepted Reviewer/Red-Team findings and get an independent recheck.",
  "writerId": "<lead-identity>",
  "coordinationId": "<track>--cell-01",
  "protocolRef": { "id": "core.coordination-protocol.standalone-master-coordination-loop" },
  "actors": [
    { "id": "fixer", "executor": "agy-cli", "tier": "standard", "persona": "pragmatic-fixer" },
    { "id": "reviewer", "executor": "claude", "tier": "analytical", "persona": "detail-oriented-rechecker" },
    { "id": "red-team", "executor": "codex-cli", "tier": "analytical", "persona": "relentless-attacker" }
  ],
  "steps": [
    {
      "type": "authorize",
      "as": "authRevise",
      "operationId": "revise-candidate",
      "targetActorId": "fixer",
      "authorizationId": "auth_cell01_fix1_revise",
      "invocationKey": "cell01:fix1:revise:1",
      "reason": "Reviewer HIGH-1 accepted (dispositioned above); apply the fix."
    },
    {
      "type": "operation",
      "as": "revise",
      "operationId": "revise-candidate",
      "targetActorId": "fixer",
      "taskKey": "revise-candidate-fixer",
      "objective": "Apply the accepted findings from Reviewer HIGH-1 and Red-Team (if any accepted).",
      "expectedOutputs": ["agent-result.json (status, summary)"],
      "mutation": "mutating"
    },
    {
      "type": "authorize",
      "as": "authReviewRecheck",
      "operationId": "reviewer-recheck",
      "targetActorId": "reviewer",
      "authorizationId": "auth_cell01_fix1_reviewer_recheck",
      "invocationKey": "cell01:fix1:reviewer-recheck:1",
      "reason": "Revision landed; recheck against the original HIGH-1 finding."
    },
    {
      "type": "operation",
      "as": "reviewRecheck",
      "operationId": "reviewer-recheck",
      "targetActorId": "reviewer",
      "taskKey": "reviewer-recheck-reviewer",
      "objective": "Recheck the revised candidate against the accepted findings.",
      "expectedOutputs": ["agent-result.json (status, summary)"],
      "contextRefs": ["$ref:revise"]
    },
    {
      "type": "authorize",
      "as": "authRedTeamRecheck",
      "operationId": "red-team-recheck",
      "targetActorId": "red-team",
      "authorizationId": "auth_cell01_fix1_red_team_recheck",
      "invocationKey": "cell01:fix1:red-team-recheck:1",
      "reason": "Revision landed; recheck for the same class of attack that found HIGH-1."
    },
    {
      "type": "operation",
      "as": "redTeamRecheck",
      "operationId": "red-team-recheck",
      "targetActorId": "red-team",
      "taskKey": "red-team-recheck-red-team",
      "objective": "Recheck the revised candidate; re-attempt any attack that previously succeeded.",
      "expectedOutputs": ["agent-result.json (status, summary)"],
      "contextRefs": ["$ref:revise"]
    }
  ]
}
```

Field-by-field grounding for `authorize` — `{type, as, operationId,
targetActorId?, nodeId?, authorizationId, invocationKey, reason,
grantedContextRefs?[], targetArtifactRef?, mutation?}`
(`schema.mjs:297-351` `AUTHORIZE_STEP_ALLOWED_KEYS`/
`validateAuthorizeStep`); `authorizationId` safe-charset, concatenated
verbatim into the driver-authorized dispatch's own default `taskKey`
(`schema.mjs:326-329`); `invocationKey` required, <= 512 chars
(`schema.mjs:302,330-332`); `reason` required, <= 20000 chars
(`schema.mjs:303,333-335`). **An `authorize` step's own `mutation` field
stays hard-refused for anything but `"read-only"`** — only a declared
`operation` step may set `"mutating"`
(`schema.mjs:122-131,319-322` `assertMutationAllowed` called without
`allowMutating: true` for the `authorize` path) — omit `mutation`
entirely on every `authorize` step above, as this template does.

Dispatch the same way as `open.json`, still pointed at the SAME cell
worktree (`revise-candidate` is the one recheck-round operation declaring
`result.kind: work-product`,
`standalone-master-coordination-loop.yaml:106-112`, so it is the one that
needs `--cwd`):

```sh
fgos coordination run --cwd ../<track>-<cell-id> --file fix-1.json
```

A follow-up `fix-2.json`, `fix-3.json`, ... repeats this same shape with
new `authorizationId`/`invocationKey` values (each `invocationKey` must
be unique per authorization to avoid a duplicate-authorization refusal)
if a recheck itself surfaces a new accepted finding.

## 4. Close a cell (`close.json`)

A `disposition` step with `disposition: "cell-closed"` is the whole
mechanism — there is no separate "close" step or door.
`runCoordinationUseCase` always attempts `closeSessionByQuorum` as its
own last, automatic step after every declared step in a request finishes
dispatching (documented behavior this skill relies on, never
reimplements — see the `fgos-group-thinking` skill's own "The gate, and
why it holds" section for the same claim proven against a sibling
protocol pack). Close only once every required first-pass step **and**
every fix round this cell needed have already dispatched cleanly and the
Lead has re-run the phase's stated test command and compared it against
the recorded baseline (master-coordinator.md section H, `CLOSE CELL`):

```json
{
  "kind": "declared-protocol",
  "objective": "Close cell-01: independent review + red-team both clean after fix-1, tests pass against baseline.",
  "writerId": "<lead-identity>",
  "coordinationId": "<track>--cell-01",
  "protocolRef": { "id": "core.coordination-protocol.standalone-master-coordination-loop" },
  "actors": [
    { "id": "doer", "executor": "agy-cli", "tier": "standard", "persona": "delivery-focused-closer" },
    { "id": "reviewer", "executor": "claude", "tier": "analytical", "persona": "final-sign-off-reviewer" },
    { "id": "red-team", "executor": "codex-cli", "tier": "analytical", "persona": "closing-adversary" }
  ],
  "steps": [
    {
      "type": "disposition",
      "as": "closeCell",
      "targetRef": "<real assignment id of the final, accepted revise/recheck dispatch>",
      "disposition": "cell-closed",
      "rationale": "Reviewer + Red-Team recheck both clean post-fix-1; tests match the recorded baseline; commit <hash> lands on <track>--cell-01.",
      "evidenceRefs": ["<real assignment id of reviewRecheck>", "<real assignment id of redTeamRecheck>"]
    }
  ]
}
```

`actors[]` is declared here too even though this cell's own single
`disposition` step targets no actor directly (a `disposition` step never
carries `targetActorId` — `schema.mjs:353-355`) — kept visible so the
full per-actor roster this cell dispatched across stays legible in the
request that closes it out, matching R3's own always-shown, never-buried
requirement; it is inert for this particular call (no step looks it up)
but not rejected (`schema.mjs:143-165` places no requirement that every
declared actor be referenced by a step in the SAME call).

```sh
fgos coordination run --cwd ../<track>-<cell-id> --file close.json
```

Then, **outside this skill and outside the coordination session
entirely** — the Lead's own git operation, never a coordination request:

```sh
git -C <main checkout> merge --no-ff <track>--<cell-id>   # or the Lead's own equivalent merge policy
git worktree remove ../<track>-<cell-id>
```

## The four-condition Mutation Rule, stated plainly

Full, final, post-4-fix-round description:
[`coordination-session.md`'s own "Mutation Rule" section](../../../docs/architect/agent-coordination/contracts/coordination-session.md)
(lines 872-938) — read that section for the authoritative text; this is
a plain restatement so a Lead knows exactly what a declared `operation`
step must satisfy before `mutation: "mutating"` is legal, never a
paraphrase that could drift from it:

Every dispatch door defaults to read-only. A declared `operation` step
(never `authorize`/`disposition`/`fan-out`/`contribution`, which stay
hard-refused for anything but `"read-only"` at the schema boundary) may
set `mutation: "mutating"` only when **all four** hold, checked before
any Assignment is materialized, refused by name otherwise:

1. **Declared on an `operation` step.** Schema-level: `schema.mjs:253-295`.
2. **The bound operation declares `result.kind: "work-product"`**, read
   from the FlowDefinition at dispatch time, never trusted from the
   request. `produce-candidate` and `revise-candidate` both declare this
   in `standalone-master-coordination-loop.yaml`; `review-candidate`,
   `red-team-candidate`, `reviewer-recheck`, `red-team-recheck` all
   declare `result.kind: "advisory"` and can never be dispatched
   mutating regardless of what the request asks for.
3. **`cwd` resolves to a linked git worktree, never the main checkout**
   — exact comparison `resolveMainCheckoutRoot(cwd) ===
   resolveRepoRoot(cwd)` refuses; a `cwd` outside any git checkout also
   refuses (fail closed). This is why every mutating dispatch above
   passes `--cwd ../<track>-<cell-id>` explicitly — the request JSON has
   no field for this at all.
4. **The inline execution contract carries the engine's own reserved
   `protocol-operation:` provenance stamp**, minted only by
   `dispatchDeclaredOperation` itself — a hand-crafted inline contract
   claiming `mutation: "mutating"` without it is refused independently by
   `execution-contract.mjs`/`assignment-normalizer.mjs`, so the
   schema/normalizer layer alone is not sufficient on its own.

And the layer that actually enforces this at execution time, one level
below the four conditions above: **the caller must explicitly assert
`isReadOnlyMode: false`** — an omitted or truthy flag is refused, never
treated as permission
(`assignment-runner.mjs:516-521,542-549`
`assertInlineMutatingAssignmentAuthorized`). `runExecutorAttempt`
(`session-engine.mjs`) is the only code path allowed to pass
`isReadOnlyMode: false` into `executeAssignment`, and it derives that
flag from the Assignment's own already-stamped `mutation` field, never a
second, independently-decided boolean
(`coordination-session.md:917-924`). A step that omits `mutation`
entirely behaves byte-identically to every request that predates this
rule — read-only, `isReadOnlyMode: true` — and a reviewer/red-team/recheck
dispatch that mutates a file regardless still fails closed at the
pre-existing read-only-violation gate, unaffected by any of the above.
