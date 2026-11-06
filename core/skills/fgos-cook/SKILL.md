---
name: fgos-cook
user-invocable: false
description: >-
  Entry for delivering a whole plan written by AgentKit's `ak:plan` (a plan.md
  with phase files): reads all of it, writes its slices, gets one proposal from
  `fgos workflow propose` (frame, slice kinds, rigor, commands) for the owner to
  approve, opens a conductor case inside that frame, then dispatches the slices one
  at a time through `fgos run` / `fgos workflow` naming the case, checks every
  result itself, judges review findings, adapts, integrates on one branch and
  reports.
  Use for "run this plan", "cook this plan", "deliver phases 1-3 of <plan>". Not
  for one ad-hoc task or a single phase to run as-is (use `fgos-run`), not the
  `/fgOS:deliver` Work-item command, and not AgentKit's own `ak:cook`, which
  runs inside a worker. Never edits product code itself and never merges.
---

# fgos-cook

A conductor for a plan that already exists. `ak:plan` is another kit's tool: this
skill reads its output as an artifact and never edits the kit. The plan gives no
authority (RUL-WF-22): its phase count is not a sequence, its file lists are not
write scopes, its `dependencies: []` is not independence. You judge each of those
from the plan and the code in front of you, then act only through the two doors.

The loop itself (observe, choose, dispatch naming the case, verify, disposition,
adapt, close, continuity artifact) is the shared doctrine
[`../_shared/coordination-driver.md`](../_shared/coordination-driver.md); this
skill fills its hook slots below and does not restate it.

**Limits, stated up front.** Slices run **one at a time in one worktree** bound
to the case: the Git component's land operation is not ready, so there is no safe
way to integrate parallel writing branches. Capability, pattern and rigor per slice
kind come from the versioned slice table (`domains/coding/slice-kinds.yaml`)
through `fgos workflow propose`: you may raise a slice's rigor with a reason, never
lower it. You never set a provider, model or tier.

## Route

1. **Read the whole plan.** `plan.md`, every phase file, the decisions it locks,
   any "after red-team" corrections (they beat the older text). Compare it with
   the code as it is now. How to read an `ak:plan` plan:
   [`references/reading-ak-plans.md`](references/reading-ak-plans.md).
2. **Write the slices and propose.** Slicing is your judgment: cut at capability
   and file boundaries, name each slice's writes, one narrow `verify`, its real
   dependencies, a rigor raise with its reason where the paths hide a risk. Put
   them in a slice list and run
   `fgos workflow propose --slices <file> --plan <plan.md>` (a small task with no
   plan: `--request "<text>" --writes <paths> --verify "<cmd>"`). The command
   classifies each slice by its write paths, sizes the frame, checks the proposal
   against the repository and prints the owner's question and the commands that
   follow an approval; it writes nothing. Fields, exit codes and every refusal:
   [`references/propose.md`](references/propose.md). Never size a frame or pick a
   pattern by hand.
3. **Ask once.** Show the question it printed, in the decision-question template
   (`../_shared/decision-question.md`), together with every ambiguity of the plan,
   in one batched message. A slice that must wait for the owner (data, migrations,
   anything irreversible) is in that question, never dispatched. Inside the
   approved frame you decide and report; you ask again only for the triggers in the
   hook table.
   After the owner approves, run the printed commands in order and exactly as
   printed (worktree and branch names, `--base`, the frame, `--inherit` when it
   continues a closed case, then the slices and the final gate). What each line
   means: [`references/case-and-doors.md`](references/case-and-doors.md). Check once that
   the case really records progress (section "Self-check of the case" there); if it
   does not, stop with `milestone-not-recorded`.
4. **Loop, one slice at a time:** read `fgos workflow status <caseId>`, pick the
   next ready slice (the plan's order is a hint, the milestones and the code
   decide), run `fgos dispatch decide --for <capability>`, dispatch with the
   printed `fgos run` line (`--case <caseId> --activity <id>`), then verify the
   result yourself (re-run the slice's check, read the diff against the declared
   writes, read the checker's report). Record the finding dispositions in the notebook. Questions that wait
   for the owner are parked and batched; slices that do not depend on them go on.
   A seat can fail to start (the dispatch ends `execution-failure`; read the unit
   run's receipt). When the receipt shows the brief never reached the agent
   (outcome `abandoned-*`, or reason `terminal:foreground-not-agent`) the case hands
   the dispatch back to the frame, so run the same printed line once more. A second
   failure of the same kind, or any other failure, spends the dispatch: stop and
   report the unit run id and the receipt reason instead of looping. This is not a
   refusal: a refused dispatch is never re-run unchanged.
5. **Integrate and hand off.** All slices already sit on the case branch. Run the
   printed `workflow gate`, then the plan's own full verification in that worktree
   yourself when it is wider than the gate's command, reconcile what the plan
   says against what was built, and report to the owner with branch, evidence and
   what is missing. Merge is the owner's decision at the approve door: you never
   merge, never write consent, never edit plan status.

## What you do not do

- Edit product code, tests or docs in your own session. Such edits are outside the
  ledger, so the case cannot see or admit them. Every change is a slice through a
  door. `fgos dispatch decide` answering `unavailable` for a slice's capability is
  a blocker to ask about, not permission to do it inline.
- Dispatch a slice without naming the case, read-only slices included.
- Retry a refused dispatch unchanged: a refusal is an answer. Read its code and
  condition, re-observe, change the proposal, or stop.
- Call a door for a case nested in your worker's own Unit, or let a confined
  worker dispatch a writer: workers ask you.
- Invent a rigor-to-tier rule, pin an executor, or write a persona file.
- Compute the frame, the slice kinds or the commands yourself: `propose` owns them,
  and a proposal it refuses is fixed at its cause, not worked around.

## Facade hook values

| Hook slot | Value |
|---|---|
| `unit of iteration` | One slice: one `fgos run ... --case` dispatch (or one bounded `--units` wave nested with `--case` when the plan has several independent read-only checks). Writing slices run serially. |
| `open inputs` | (a) result kind: work-product. (b) exactly one primary capability per slice from `../_shared/capability-catalog.md`. (c) the plan, the phase file, the locked decisions and corrections the slice depends on (`--input`), the slice's `--writes`, its `--verify`, its rigor (never below the frame's floor). Persona only from `fgos agents list`. |
| `evidence verification` | Re-run the slice's own verify in the case worktree, read the diff against the declared writes, read the checker report under `.fgos/assignments/<unitRunId>/`. A worker's summary, and a claude worker that could not run tests, are claims, never proof. |
| `disposition criteria` | Finding accepted: fix slice, then independent recheck. Rejected: reason in the notebook. Deferred: only when outside the approved scope and the plan allows; otherwise accepted. |
| `adaptation bounds` | Per slice: the pattern's own rounds, then at most one fix slice, one read-only diagnosis, one rigor raise. Past that, ask. Frame counts are the hard bound. |
| `human-escalation triggers` | Frame approval at the start; a consent gate the guide marks human; a frame that must be widened; an ambiguity in the plan itself; a plan step that contradicts the real code; an irreversible or out-of-scope write; repeated refusals across distinct approaches. A single refusal is not one. |
| `close criteria` | Every planned slice passed its own verify, every finding is dispositioned and rechecked, the plan's full verification is green on the case worktree. The case itself closes only with `fgos workflow close` after the owner's decision. |
| `after-close action` | Report: branch, commits, evidence, what the plan said vs what was built, parked questions, frame used vs approved. Leave merge to the approve door. |
| `continuity artifact` | `fgos workflow status <caseId>` plus the notebook (path and fields in `references/case-and-doors.md`). A fresh conductor resumes from those two alone. |

## Boundaries

- This is coordination, not an execution engine. Guide, admission and the two doors
  stay authoritative; `bind()` alone picks who runs a slice.
- Never claim a slice is verified because a worker or a checker said so; claim only
  what you re-ran or read.
- Do not touch Work items: the old Work-item path is `/fgOS:deliver`.
- The frame is the owner's once approved: you may narrow it, never widen it. A
  widened frame is a new proposal and a question.
