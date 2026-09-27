---
name: fgos-plan-loop
user-invocable: false
description: >-
  Drive a Work-independent, plan-driven implementation track (audit -> cell -> review -> red-team -> fix -> close loop)
  entirely through the real `fgos coordination` CLI doors (`chain`/`status`/`start`/`operation`/`authorize-and-dispatch`/`disposition`/`close`)
  and the `standalone-master-coordination-loop` FlowDefinition -- never fgOS Work items, claims, `fgos pick/cook/submit`, or a fgos-runner loop.
  Use when a Lead session needs to resume/open/authorize/close a cell on a track that a plan.md/phase-NN-*.md pair drives, with independent
  review and adversarial testing. Examples: "resume <track> and tell me what's next", "open the next cell for <track>",
  "authorize a fix round for cell <id>", "close cell <id> and report the commit", "run this code implementation plan",
  "execute this code implementation track".
---

# fgos-plan-loop

`fgos-plan-loop` is the implementation-track facade for coordinating plan-driven coding work. While track sequencing across sequential cells is domain-neutral, cell execution and verification are governed by coding-domain policy.

This facade builds directly on two shared doctrine layers:
- **Generic Driver Discipline:** [`../_shared/coordination-driver.md`](../_shared/coordination-driver.md) defines the domain-neutral cycle (`observe -> choose legal action -> dispatch -> verify evidence -> disposition -> adapt -> explicit close -> continuity artifact`).
- **Coding-Cell Policy:** [`../_shared/coding-cell-policy.md`](../_shared/coding-cell-policy.md) defines isolated worktree execution, proof tiers, independent commit/test verification, tested/integrated identity, and merge-after-close rules.
*(Link convention: fragment paths resolve to canonical source trees in core/domains and project to sibling `_shared/` in `.agents/` and `plugins/`.)*

All protocol execution lowers into the registered [`standalone-master-coordination-loop`](../../../core/coordination-protocols/standalone-master-coordination-loop.yaml) FlowDefinition (`doer -> reviewer/red-team -> fixer -> rechecks`).

For a standalone single-cell change without a plan or track, use `fgos-code-panel` (future `fgos-code-change` in Phase 6) instead.

---

## Non-Goals

- **No Work Lifecycle Involvement:** Never use `fgos pick/cook/submit`, claims, or Work items for tracks this skill drives.
- **No Git Merge Authority Inside Sessions:** A coordination session possesses zero git merge authority. Merging into the target branch is strictly a driver action performed outside the session after explicit close.
- **No Secondary Track Ledger:** Track status is derived on demand from session event logs via `fgos coordination chain` and `plan.md`. No secondary ledger or database is created.

---

## Capability Awareness (Planning Input)

When authoring the `plan.md`/`phase-NN-*.md` files this skill drives, tag each requirement with its canonical capability:
[`../_shared/planning-capability-awareness.md`](../_shared/planning-capability-awareness.md) and [`../_shared/capability-catalog.md`](../_shared/capability-catalog.md).
Capability tags (e.g. `code:implement`, `code:review`, `code:test`) signal decomposition boundaries without pinning executors, models, or tiers.

---

## Facade Hook Values for Plan-Loop

| Hook Slot | Plan-Loop Value |
|---|---|
| `unit of iteration` | One cell of the track (`<track>--<cell-id>`), corresponding to the next unmerged phase in `plan.md`. |
| `open inputs` | Extracted from plans/<track>/phase-NN-<name>.md: objective, verification commands, result kind (work-product for a produce cell), the phase's primary capability from the plan.md Product Gates table, and any actor binding the Lead supplies. |
| `evidence verification` | Coding-cell policy: driver independently verifies git commit in worktree and executes the phase's focused tests. |
| `disposition criteria` | Proof-gap findings (judging verification insufficient) cannot be deferred; must be `accepted` (escalating proof tier to full) or evidence-backed `rejected`. |
| `adaptation bounds` | Maximum 3 fix rounds per cell. Past the 3-round cap, remaining non-proof-gap findings are `deferred` and named in the trace; proof-gap findings force `accepted -> Proof: escalated-to-full` (full proof must pass before close, no human escalation). |
| `human-escalation triggers` | Unresolvable spec ambiguity with divergent readings, identical failure across two distinct approaches, or unresolvable merge conflict. Batch questions, non-blocking. |
| `close criteria` | All required operations settled, all rechecks clean, caveat-free per driver discipline, checkpoint identity tuple recorded. |
| `after-close action` | Coding-cell policy: merge `--no-ff` into track branch, clean worktree, append row to `plan.md` cell-status table. |
| `continuity artifact` | `plan.md` cell-status table and cell trace (`docs/architect/agent-coordination/verification/<track>/<cell>.md` or `plans/<track>/reports/`). |

---

## Step-by-Step Cell Operations

### 0. Track Resume: `fgos coordination chain <track>`

Query track progress cold with zero prior chat context:
```sh
fgos coordination chain <track> --json
```
Returns `{track, cells, activeCell, nextAction}`. If `activeCell` is active, resume it through steps 2–4. Otherwise, proceed to the lowest phase lacking a `merged` entry in `plan.md`.
Session IDs use safe characters: letters, digits, hyphen, underscore (e.g. `cell-01`, never periods).

### 1. Open a Cell

1. **Setup Worktree:** Create an isolated worktree per [`../_shared/coding-cell-policy.md`](../_shared/coding-cell-policy.md):
   ```sh
   git worktree add ../<track>-<cell-id> -b <track>--<cell-id> <base-branch>
   ```
2. **Start Session (runs entry node):**
   `coordination start` on `standalone-master-coordination-loop` automatically resolves and executes the entry node (`produce`, operation: `produce-candidate`, actor: `doer`, mutating) during session initialization. Because the entry operation mutates code, `start` MUST pass `--cwd`:
   ```sh
   fgos coordination start \
     --kind declared-protocol \
     --protocol core.coordination-protocol.standalone-master-coordination-loop \
     --coordination-id "<track>--<cell-id>" \
     --writer-id "<driver-id>" \
     --cwd "../<track>-<cell-id>" \
     --objective "<cell objective from phase file>"
   ```
   Every declared step now resolves its own default binding from the operation's `policy.capability` (`runnerConfig.capabilities.<name>.prefer`) -- `--actors '<json>'` on `start` is an optional per-actor OVERRIDE, not the only way to bind a role. Known limitation: `--actors` on `start` binds the entry node only -- a later `authorize-and-dispatch`/`operation` step does not yet inherit an earlier node's override for the same actor id, so repeat the override at that step if you need it there too.
3. **Dispatch Evaluation Pass:**
   Query `fgos coordination status <track>--<cell-id>`.
   `produce-candidate` has already executed. The next projected legal actions are the parallel primary evaluations:
   `review-candidate` (actor: `reviewer`) and `red-team-candidate` (actor: `red-team`).
   Dispatch each via:
   ```sh
   fgos coordination operation \
     --id "<track>--<cell-id>" \
     --action-key "<actionKey>" \
     --writer-id "<driver-id>" \
     --objective "Review candidate diff against requirements" \
     --expected-outputs "agent-result.json"
   ```

### 2. Read Results and Disposition Findings

Inspect session status:
```sh
fgos coordination status <track>--<cell-id> --detail
```
Independently inspect worker commits and test outputs in the worktree per coding-cell policy.
Record driver dispositions for each reported finding:
```sh
fgos coordination disposition \
  --id "<track>--<cell-id>" \
  --action-key "<actionKey>" \
  --writer-id "<driver-id>" \
  --disposition "accepted" \
  --rationale "Reviewer HIGH-1 accepted; scheduled for fix-1."
```
Caveats block acceptance and close per driver discipline Step 4.

### 3. Authorize and Dispatch Fix Rounds

When findings are accepted, execute a fix round (capped at 3 per cell):
```sh
# Authorize and dispatch Fixer revision (mutating, cwd required)
fgos coordination authorize-and-dispatch \
  --id "<track>--<cell-id>" \
  --action-key "<actionKey>" \
  --writer-id "<driver-id>" \
  --cwd "../<track>-<cell-id>" \
  --objective "Apply accepted Reviewer HIGH-1 finding to candidate." \
  --reason "Apply accepted Reviewer HIGH-1 finding." \
  --granted-context-refs "<failedAssignmentId>" \
  --expected-outputs "agent-result.json"

# Authorize and dispatch Reviewer and Red-Team rechecks
fgos coordination authorize-and-dispatch \
  --id "<track>--<cell-id>" \
  --action-key "<actionKey>" \
  --writer-id "<driver-id>" \
  --objective "Recheck revised candidate against previously accepted finding." \
  --reason "Recheck revised candidate." \
  --granted-context-refs "<reviseAssignmentId>" \
  --expected-outputs "agent-result.json"
```

### 4. Close a Cell

1. **Verify Quorum and Prerequisites:** Confirm all required operations and rechecks are satisfied, no open proof gaps remain, and no node carries an active `sharedCwdCaveat` with `status: 'recheck-required'` (per driver discipline Step 4).
2. **Record Checkpoint Identity:** In the cell trace, record the identity tuple (`testedSha`, `integratedSha`, `treeIdentical`, `outcome`) per coding-cell policy.
3. **Execute Explicit Close:**
   ```sh
   fgos coordination close \
     --id "<track>--<cell-id>" \
     --action-key "<actionKey>" \
     --writer-id "<driver-id>"
   ```
4. **Post-Close Integration:** Outside the session, merge into the target branch and remove the worktree:
   ```sh
   git merge --no-ff <track>--<cell-id>
   git worktree remove ../<track>-<cell-id>
   ```

---

## 5. Unattended track mode: run every cell to the end

When executing a full multi-cell track unattended:

0. **Baseline:** Run the track full proof command once before cell work begins. Record baseline failures in `plan.md` Execution Inputs. Known failures may shrink, never grow.
1. **Track Iteration:** Loop until every phase in `plan.md` is marked `merged`:
   - Query `fgos coordination chain <track> --json`. If `activeCell` is open, resume it. Else select lowest unmerged phase.
   - Set up cell worktree per coding-cell policy.
   - Start session (executes `produce-candidate` inside worktree) and dispatch evaluation pass (`review`, `red-team`).
   - Independently verify doer commit and execute phase focused test in worktree.
   - Read status and disposition findings. Authorize fix rounds as needed (cap: 3).
   - Once rechecks pass cleanly, execute explicit close via `fgos coordination close`.
   - Merge cell branch into track branch (`git merge --no-ff`), drop worktree, and record row in `plan.md` cell-status table.
   - Record checkpoint identity and verify `integratedSha` proof per coding-cell policy.
2. **Track Completion:** Write `<plan dir>/reports/track-closeout.md` summarizing all merged cells, commits, and verified evidence.
