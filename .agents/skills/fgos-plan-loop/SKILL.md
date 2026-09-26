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

All protocol execution lower into the CoordinationSession control plane (`actions.mjs`, `composers.mjs`) and the registered [`standalone-master-coordination-loop`](../../../core/coordination-protocols/standalone-master-coordination-loop.yaml) FlowDefinition (`doer -> reviewer/red-team -> fixer -> rechecks`).

For a standalone single-cell change without a plan or track, use `fgos-code-panel` (or `fgos-code-change`) instead.

---

## Non-Goals

- **No Work Lifecycle Involvement:** Never use `fgos pick/cook/submit`, claims, or Work items for tracks this skill drives. The session engine strictly rejects fields carrying Work lifecycle authority (`approve`, `merge`, `claim`, `workStatus`, `missionId`).
- **No Git Merge Authority Inside Sessions:** A coordination session possesses zero git merge authority. Doer and Fixer operations commit inside the cell worktree branch, but merging into the target branch is strictly a driver action performed outside the session after explicit close.
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
| `open inputs` | Extracted from `plans/<track>/phase-NN-<name>.md` (objective, verification commands, actor requirements). |
| `evidence verification` | Coding-cell policy: driver independently verifies git commit in worktree and executes the phase's focused tests. |
| `disposition criteria` | Proof-gap findings (judging verification insufficient) cannot be deferred; must be `accepted` (escalating proof tier to full) or evidence-backed `rejected`. |
| `adaptation bounds` | Maximum 3 fix rounds per cell. Unresolved proof gaps force full proof gate before close. |
| `human-escalation triggers` | Unresolvable spec ambiguity with divergent readings, identical failure across two distinct approaches, or unresolvable merge conflict. Batch questions, non-blocking. |
| `close criteria` | All required operations settled, all rechecks clean, caveat-free, checkpoint identity tuple recorded. |
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
2. **Start Session:** Initialize the session via semantic command:
   ```sh
   fgos coordination start \
     --kind declared-protocol \
     --protocol core.coordination-protocol.standalone-master-coordination-loop \
     --coordination-id "<track>--<cell-id>" \
     --writer-id "<driver-id>" \
     --objective "<cell objective from phase file>"
   ```
3. **Dispatch Initial Pass:**
   Query `fgos coordination status <coordination-id>`. Dispatch initial operations:
   - `produce-candidate`: mutating, passing `--cwd ../<track>-<cell-id>`
   - `review-candidate` and `red-team-candidate`: read-only advisory operations
   Execute each via `fgos coordination operation --id "<coordination-id>" --action-key "<actionKey>" ...`.

### 2. Read Results and Disposition Findings

Inspect session status:
```sh
fgos coordination status <coordination-id> --detail
```
Independently inspect worker commits and test outputs in the worktree.
Record driver dispositions for each reported finding:
```sh
fgos coordination disposition \
  --id "<coordination-id>" \
  --action-key "<actionKey>" \
  --writer-id "<driver-id>" \
  --disposition "accepted" \
  --rationale "Reviewer HIGH-1 accepted; scheduled for fix-1."
```
**Caveat Rule:** A finding with `sharedCwdCaveat` (`status: 'recheck-required'`, `verdict: 'non-attributable'`) is never valid sign-off evidence and blocks close. An uncaveated recheck is mandatory.

### 3. Authorize and Dispatch Fix Rounds

When findings are accepted, execute a fix round (capped at 3 per cell):
```sh
# Authorize and dispatch Fixer revision (mutating)
fgos coordination authorize-and-dispatch \
  --id "<coordination-id>" \
  --action-key "<actionKey>" \
  --writer-id "<driver-id>" \
  --cwd "../<track>-<cell-id>" \
  --reason "Apply accepted Reviewer HIGH-1 finding."

# Authorize and dispatch Reviewer and Red-Team rechecks
fgos coordination authorize-and-dispatch \
  --id "<coordination-id>" \
  --action-key "<actionKey>" \
  --writer-id "<driver-id>" \
  --reason "Recheck revised candidate."
```

### 4. Close a Cell

1. **Verify Quorum and Prerequisites:** Confirm all required operations and rechecks are satisfied, no open proof gaps remain, and no node carries an active `sharedCwdCaveat` with `status: 'recheck-required'`.
2. **Record Checkpoint Identity:** In the cell trace, record: `phase/cell id`, `command`, `baseline`, `testedSha`, `integratedSha`, `treeIdentical`, and `outcome`.
3. **Execute Explicit Close:**
   ```sh
   fgos coordination close \
     --id "<coordination-id>" \
     --action-key "<actionKey>" \
     --writer-id "<driver-id>" \
     --reason "All review and red-team checks clean; tests match baseline."
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
   - Query `fgos coordination chain <track> --json`. If `activeCell` is open, resume it. Else select the lowest unmerged phase.
   - Set up cell worktree per coding-cell policy.
   - Start session and dispatch initial operations (`produce`, `review`, `red-team`).
   - Independently verify doer commit and execute phase focused test in the worktree.
   - Read status and disposition findings. Authorize fix rounds as needed (cap: 3).
   - Once rechecks pass cleanly, execute explicit close via `fgos coordination close`.
   - Merge cell branch into track branch (`git merge --no-ff`), drop worktree, and record row in `plan.md` cell-status table.
   - If `testedSha !== integratedSha`, verify gate proof on `integratedSha` unless `treeIdentical: true` applies.
2. **Track Completion:** Write `<plan dir>/reports/track-closeout.md` summarizing all merged cells, commits, and verified evidence.
