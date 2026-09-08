---
name: group-thinking-plan-loop
description: >-
  Design proposal for a Work-independent, multi-cell/multi-phase
  implementation-coordination mechanism built on the CoordinationSession
  substrate (group-thinking pack), reproducing master-coordinator.md's own
  Doer/Reviewer/Red-Team/Fixer loop with real, replayable evidence and
  genuine per-role provider diversity.
---

# Group-Thinking Plan Loop — Design Proposal

Document type: Proposal
Design status: Discussion
Implementation: Not started
Last reviewed: 2026-09-04
Canonical for: the design decision this proposal's own plan
(`plans/260904-2329-group-thinking-plan-loop/`) executes against; not yet an
accepted contract.

Related: [Master Multi-Agent Implementation Coordinator](../agent-coordination/playbooks/prompts/master-coordinator.md),
[MVP6+ Dogfood Handoff](../agent-coordination/playbooks/mvp6-dogfood-handoff.md),
[CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md),
[Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md),
[`docs/how-to/run-a-coordination-session.md`](../../how-to/run-a-coordination-session.md),
[`docs/how-to/use-fgos-group-thinking.md`](../../how-to/use-fgos-group-thinking.md)

## 1. Problem statement

fgOS has a manual bootstrap prompt, `master-coordinator.md`, that a human
pastes into a live agent session to drive large, multi-phase engineering
work: read an approved plan, decompose it into bounded cells, dispatch an
independent Doer, then independent Reviewer + Red-Team in parallel,
disposition findings, fix, recheck, close the cell, repeat — persisting
cross-cell state in hand-maintained markdown (`index.md`/`current-cell.md`/
`<cell-id>.md`). This prompt drove the entire `step-09-mvp6-to-mvp9` track
(50+ cells, multiple fix rounds, real git worktree/commit/merge) without
touching the CoordinationSession runtime it was, in part, built to prove
out.

Separately, a narrower, already-shipped native path exists:
`fgos coordination launch-master-loop` + `fgos coordination run --file`
driving the frozen `standalone-master-coordination-loop.yaml` fixture (4
actors: doer/reviewer/red-team/fixer). It produces real, replayable
Assignment/Run/RunResult evidence, but expresses exactly ONE loop over ONE
artifact — it has no mechanism to sequence many cells across an entire
plan, and every Assignment it dispatches is hard-locked read-only at the
kernel (`session-engine.mjs`'s `buildReadOnlyContract`), so a Doer cannot
actually edit files through it today.

The user's explicit requirement (stated directly, not inferred): build a
mechanism that operates like `master-coordinator.md` — audit a plan,
decompose it into cells, dispatch/review/red-team/fix/close, repeat,
resumable across many separate agent invocations — **on the group-thinking
/ CoordinationSession substrate, without attaching to the Work engine**,
because per-role provider/model/tier diversity (Doer on one provider,
Reviewer on another, Red-Team on a third — genuinely different CLI
executors collaborating in one evidence-linked session) is a proven,
first-class property of that substrate (`P10.1`/`P10.3`'s own live proof;
demonstrated again in `docs/how-to/coordination-examples/group-thinking-delphi-feedback-lite-request.json`)
that raw Agent/Task-tool subagent dispatch does not give an equivalent,
replayable guarantee of.

Two hard constraints from the user, given directly during this design's
own brainstorming and binding on every option below:

1. **The lead/coordinator stays external** — a real, full-judgment LLM
   session, never absorbed into a graph as an actor node. (Matches
   `standalone-master-coordination-loop.yaml`'s own header: the coordinator
   is "durable authority outside this declared worker graph, never a worker
   actor inside it," and this repo's standing "no autonomous in-graph
   coordinator/leader" rule.)
2. **The rigid graph layer must itself have designed-in give** — not a
   purely fixed structure. The existing substrate already has three proven
   mechanisms for this (not invented for this proposal): `activation.mode:
   driver-authorized` bindings (may or may not ever be invoked, at the
   driver's live discretion), MVP9's `specialistSlotRef` (a declared slot
   whose actor identity is bound at runtime, not protocol-authoring time),
   and bounded multi-round graphs (`maxRounds`).

## 2. Options considered, and why two were rejected

### Option A — a dynamically-growing meta-FlowDefinition graph

**Rejected — genuine structural mismatch, not a preference.**
`session-engine.mjs`'s dispatch path reads a session's bound FlowDefinition
at call time and refuses any drift from what the session opened against
(`dispatchDeclaredOperation`'s version-drift check); quorum classification
(`actorGatingOperationIds`) walks the pinned definition's own declared
bindings. A graph whose node set grows after the session opens would
either violate that pinning or require the kernel to trust a caller-supplied
graph shape at each call — precisely the "trust a caller-supplied count/
shape for a legality decision" bug class this same repo's own
`step-09-mvp6-to-mvp9` track found and fixed four separate times in
`classifySessionQuorum`/`actorGatingOperationIds` this same week (see
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10-KERNEL-FIX.md`).
It would also make the coordinator a graph actor by construction, directly
violating constraint 1.

### Option B — a thin "plan runner" with its own persisted plan/cell ledger

**Rejected in its original form — duplicates the Work engine's own job as
a second, parallel lifecycle ledger**, and reopens `Mission` (grouping N
sessions into one trackable unit), a concept `docs/specs/runner.md`
explicitly records as `deferred-preserved` with no `missionId` field
anywhere in the schema. Building it under a different name, for the one
case where Work is off-limits, is exactly the shape of self-referential
effort `docs/specs/platform-foundations.md`'s D-ADR0035 warns against
("fgOS exists to develop OTHER projects... not to develop itself").

The user weighed this concern directly and chose to proceed with a
Work-independent design anyway — this is not an oversight being corrected
here, it is a deliberate, informed choice, consistent with Step 09's own
original, real, documented MVP1-5 framing: "Do not require Work. Step 09 is
standalone coordination first" (`plans/260903-1049-step09-mvp3-to-mvp5/plan.md:32-34`,
`docs/architect/proposals/step-09-group-thinking-substrate.md:70-91`).

### Option C (accepted, revised) — chained rigid cell-sessions, plan status as a query, Doer/Fixer mutate inside a Lead-owned isolated worktree

The surviving design, after a second, adversarial reconsideration pass (see
§4) corrected an initial mistake in this proposal's own first draft (see
§3.4).

## 3. Accepted design

### 3.1 No new protocol kind

The cell-level protocol already exists and needs no changes:
`core/coordination-protocols/standalone-master-coordination-loop.yaml`
(doer/reviewer/red-team/fixer; produce → review+red-team →
driver-authorized revise → driver-authorized recheck → disposition →
close). It is registered into the group-thinking Protocol Pack (a data
edit, `core/protocol-packs/group-thinking.json`) so it can be launched
through the same `runGroupThinkingRequest` gate as the three existing
group-thinking-lite protocols — this does not change the fixture's own
semantics, it only adds an explicit-selection membership check on top of
`run.mjs`'s existing behavior, exactly as P10.1 already proved for the
three sibling protocols.

### 3.2 Chaining: an id convention, not a new persistence layer

`coordinationId = <TRACK>--<cellId>` (safe charset, e.g.
`plan-loop-proof--P01-1`). Resuming an existing id already works
(`findExistingManifest`, writerId-identity gated) — the "no resume door"
comments in `launch-master-loop.mjs` are stale as of this track's own
investigation and are corrected as part of Phase 2 (`phase-02-chain-verb-and-pack-registration.md`'s
own R8) — Phase 3 forbids touching `src/verbs/coordination/**` at all, so
this comment-only correction belongs to whichever cell owns that file's
lease, not to Phase 3.

### 3.3 Plan status is a query over the session chain, never a stored object

Everything `index.md`/`current-cell.md`/`<cell-id>.md` held maps onto data
already on each session's own event log (manifest status, phase,
`pendingDriverAuthorizations`, disposition rationale/evidence, RunResult
artifacts). A new read-only verb, `fgos coordination chain <track>`,
enumerates every session whose id carries the track's own prefix and
renders the same status board `index.md` used to hold by hand — reusing
`showCoordinationUseCase` per session, never introducing a second
lifecycle ledger. Only which cell comes next stays deliberately
undetermined by the runtime — that judgment belongs to the external Lead,
by design (constraint 1).

### 3.4 Mutation: Doer/Fixer work inside a Lead-owned, isolated git worktree — not a read-only session producing a patch artifact

**This proposal's own first draft recommended the Doer/Fixer stay
kernel-`read-only` and instead write a `candidate.patch` file into their
run directory for the Lead to apply.** A direct challenge to that
draft — "not letting the Doer write directly is not obviously a good
thing; it still has to write a patch file either way, so what's the actual
benefit?" — triggered a second design pass that reversed it. The
reconsideration, in full:

- **Review-before-apply and attempt-isolation are identical under both
  designs.** A worktree gives the Lead `git diff BASE_REF..fgw-cell/<id>`
  on a branch nothing else sees until merge; rejection is `git worktree
  remove` + `git branch -D` — exactly as reversible as discarding an
  unapplied patch file, and immune to a patch that no longer applies
  cleanly against a moved base.
- **Worktree mode is strictly better on every other axis**: the Doer can
  run its own focused tests before reporting done (impossible against a
  read-only Assignment); the dispatch evidence ladder grades a real git
  delta `verified` rather than a bare artifact claim `reported`
  (`assignment-runner.mjs`'s own grading rule); every changed file is
  attributed to its Assignment via the runner's existing `dirtyBefore`
  baseline; the Lead's own "apply" step becomes an ordinary `git diff`/
  merge — the exact, already-proven pattern this week's own
  `step-09-mvp6-to-mvp9` track used for every isolated-worktree cell,
  not a new one being invented.
- **The kernel's `mutation: 'read-only'` lock is not a label** — the
  dispatch runner actively fails and rolls back any file change a
  read-only-tagged worker makes. A worktree-based Doer is therefore
  mechanically impossible without a scoped, deliberate unlock; this is not
  optional plumbing, it is the one real kernel change this whole design
  needs.
- **Three separate historical reasons for the lock were checked against
  a worktree-isolated Doer, individually**: (1) "a read-only operation
  must not mutate repo state" — protects consult/review/red-team roles,
  stays unchanged, never triggered by a Doer explicitly declared
  `mutation: 'mutating'`; (2) ADR-006 §6's "first slice is read-only
  only" — its own text frames this as a sequencing decision ("first
  slice"), not a permanent threat model; (3) ADR-010 / `runner.md:1279-1282`'s
  stop gate — its named concerns (a session mutating a *shared* checkout,
  a session performing merges, agent consensus driving Work state) are
  each addressed by construction in this design: the worktree is isolated,
  the Lead — never the session — merges, and no Work-lifecycle key is
  ever accepted (`assertNoWorkLifecycleKeys` stays unchanged). What
  remains is to run the live proof that stop gate always asked for — this
  plan's own Phase 3.

The unlock rule, scoped narrowly enough to state as literal test
assertions (Phase 1's own acceptance bar):

> A declared operation may dispatch `mutating` only when (i) the request's
> `operation` step explicitly declares `mutation: 'mutating'`, (ii) the
> bound FlowDefinition operation declares `result.kind: work-product`
> (`standalone-master-coordination-loop.yaml` already declares this for
> `produce-candidate`/`revise-candidate`), (iii) the dispatch `cwd` resolves
> to a linked worktree, never the main checkout, and (iv) nothing under
> `src/runner/coordination/**` ever merges, commits to a shared branch, or
> transitions Work state. Authorize/disposition/contribution/fan-out/task
> steps stay unconditionally read-only, unchanged.

### 3.5 A real, previously-untested bug found during this design's own investigation

`resolveCoordinationPaths` (`src/runner/coordination/store.mjs`) derives
the sessions directory from the caller's `cwd`, not the resolved main
checkout root. Running `fgos coordination run` from inside a worktree
would silently write session state under `<worktree>/.fgos/`, which
ADR0020 strips on worktree removal — real, permanent data loss, not a
theoretical risk. Phase 1 fixes this alongside the mutation unlock (same
investigation surface, same review bar) — every other `fgosDirFromRoot(`
call site under `src/runner/coordination/**` and `src/runner/dispatch/**`
must be grepped and checked for the same class of bug before Phase 1
closes.

### 3.6 The Lead's own operating loop

A live agent session follows a new skill, `fgos-plan-loop`, the
group-thinking-native successor to `master-coordinator.md` for tracks that
explicitly choose not to attach Work. Per cell:

```text
fgos coordination chain <track> --json      # resume: what's done, active cell, next action

# 1. prepare (judgment) -> write requests/<track>--<cellId>.open.json from a template
git worktree add <worktree> -b fgw-cell/<cellId> <BASE_REF>
fgos coordination run --cwd <worktree> --file requests/<track>--<cellId>.open.json
# 2. Lead reads: git diff (produce), reviewer/red-team RunResults, runs the stated test command in <worktree>
# 3. if accepted findings: authorize + revise + recheck, same coordinationId, same worktree
fgos coordination run --cwd <worktree> --file requests/<track>--<cellId>.fix-1.json
# 4. close
fgos coordination run --cwd <worktree> --file requests/<track>--<cellId>.close.json   # disposition: cell-closed
git -C <BASE checkout> merge --no-ff fgw-cell/<cellId>   # Lead merges, never the session
git worktree remove <worktree>
```

Per-role provider diversity is a first-class, always-available property of
every request template (`actors[].executor/tier/persona`), not an
afterthought — this is the concrete reason this design lives on the
group-thinking substrate rather than as a reformalized version of the
manual prompt.

## 4. Explicitly out of scope for this plan

- Retiring `master-coordinator.md` for `forgentX`'s own development — it
  remains fgOS's own permanent fallback (its "Retirement" section already
  anticipates a native path; this plan adds one pointer line to it, nothing
  more).
- `Mission`/`missionId` or any cross-track grouping concept — out of scope,
  matches the standing deferred decision.
- Per-actor `model` override for declared-protocol requests — currently
  refused by `run.mjs`; provider diversity is expressed via
  `modelPolicies.<provider>.<tier>` instead. A dedicated model-override
  channel is a separate, later decision if a real need surfaces.
- Running the live proof against `forgentX` itself — Phase 3's proof runs
  on a separate host/dogfood project, never this repo, to avoid the exact
  mission #3 trap named in §2's rejection of option B.

## 5. Acceptance for this proposal

This proposal is superseded by its own plan's closing disposition
(`plans/260904-2329-group-thinking-plan-loop/plan.md`) once Phase 3's live
proof either confirms the design or names what broke. `Implementation:`
above updates to `Partial`/`Implemented` only when that plan closes, per
this repo's own documentation-management rule (do not promote a proposal
into an accepted contract silently).
