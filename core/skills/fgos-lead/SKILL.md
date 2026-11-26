---
name: fgos-lead
user-invocable: false
description: >-
  Procedure of a plan's lead: run one plan to done wave by wave. Create a worktree per phase with a disjoint
  footprint, run each phase as a unit with the phase file as brief, review each result with a code-reviewer subagent,
  land the branch through the land door and record progress in the plan's phase table. Writes only its plan
  directory. Never starts or stops a session. Examples: "the lead started for a plan", "run the next wave".
---

# fgos-lead

You lead exactly one plan (boundary: `core/agents/lead.yaml`). Your sandbox writes only the plan directory; the plan's `footprint`, read from the trunk
tip, bounds what a unit may write and what a land may bring in. You never change the footprint and never start or
stop a session. You have no mailbox and no peers: escalate with `fgos questions ask` or park the phase with a reason
as an event (below), never as a commit of its plan file.

A wake is one turn: never end it before your done step (a phase set `done` in its plan file, or a park raised as an event).
When parking a phase on another party (an owner answer, another plan or an outside run), run
`fgos supervisor raise --kind coordination-help --ref plan:<dir> --reason "parked <phase> on <party>: <what>"`
in the same turn. Do not end the turn idle without that event.
Parking is an event, not a commit (Rule: writes-to-main, in AGENTS.md; set in .fgos/instructions/effective/rules.json). The event carries the reason; the owner's
question is in the question store. Land the plan directory only when a phase becomes `done`, when the plan changes
status, or when a file's meaning changes for a later session (a decision, a corrected brief). The one allowed park commit is a ticket still `running` after 12 waits: put its id in the plan file, once.

## Start

0. Taking a plan: in the same `fgos land --paths` commit that sets its `status: running`, write `lead: <your role>` (for
   example `lead:S6A` or your `head:lead-...` role) into its frontmatter, so the supervisor can read your liveness.
1. `fgos request result` with no id lists this role's tickets. A restarted lead reads them first and resumes runs
   already started instead of starting them again.
2. Read `plan.md` (outcome, footprint, phase table) and the phase files of the next wave. Phases not `done` and whose
   dependencies are done form the wave.

## Per wave

For each phase of the wave whose footprint is disjoint from the others in it:

1. `fgos worktree create <path> --branch <name>`. The path is absolute, in the sibling worktrees directory of the
   project (`<parent of the project root>/<project directory name>-worktrees/`, e.g.
   `/home/me/projects/forgent-worktrees/`), never inside the project root or your plan directory. One worktree per
   phase: reuse the one worktree for later units of the same phase (run inside it with `--sync <trunk>` when it must
   catch up with the trunk tip instead of creating a fresh worktree); a fix unit after the land needs a new worktree,
   because the land may have removed the phase's worktree. Its last segment must be unique in the repository
   (git keys the worktree by it) and is named from the plan and phase: `<plan dir name>-p<NN>`. The branch is
   `<plan slug>/p<NN>`.
   A refusal: Rule: driver-discipline (in AGENTS.md; set in .fgos/instructions/effective/rules.json). A refused verb is reported in the plan file or with
   `fgos questions ask`; never investigate it in the host's source.
2. Decide first (Rule: dispatch-decide-door, in AGENTS.md; set in .fgos/instructions/effective/rules.json); an `out-of-process` answer runs through
   `fgos run "<prompt naming the phase file>" [--provider <id>] [--capability <purpose>] --worktree <path> --writes <paths>`
   (only these flags pass), with `--writes` inside the plan footprint. `--provider` is optional and soft: name it only
   for one of the five reasons, otherwise leave it out and `fgos run` binds itself (Rule: capability-routing-rules, in AGENTS.md; set in .fgos/instructions/effective/rules.json)
3. Read the outcome with `fgos request result <id> --wait <seconds>` (at most 50). A failed ticket's `code` and `message` (with `argv` and `stderrTail`) say why; read it, never retry blind.
   Never end your turn while a `run` or `land` ticket of yours is `running`: nothing wakes you when it settles. Repeat
   `fgos request result <id> --wait 50` until it leaves `running`, then continue (review, land). If it is still
   `running` after 12 waits, park the phase in the plan file with the ticket id and that reason.
4. Review each result with a `code-reviewer` subagent on `git diff origin/main...HEAD` of the branch, with the phase
   file as the spec. Fix blocking findings through another unit (reusing the phase worktree).
5. Land with `fgos land <branch> [--test <path>...]` (name the tests the phase file lists). After a successful branch
   land, the clean worktree is automatically removed (`worktreesRemoved`). Squash lands always keep their worktree
   (the door refuses `worktree-delivery-unproven` because the tip is not an ancestor of the target). Hand any worktree
   the land kept (`worktreesKept`) to the supervisor by name (raise an event with `fgos supervisor raise --kind
   coordination-help --ref plan:<dir> --reason "worktree kept: <path> (<refusal code>)"`). Never run a hand-made land
   script and never edit the mutation census by hand.
6. Update the phase table in the plan directory with `fgos land --paths` and set the phase `done`. To park a phase,
   raise the event above instead of landing a note. After the last phase set the plan `done`.

Run the Node tests the phase names outside the unit's sandbox when the unit could not run them; stage explicit paths;
never SIGKILL a test run.

## Land refusals

`fgos land` refusals are read by code and never bypassed:

| Code | Do |
|---|---|
| `land-gate-missing` | the project has no `land.gates`: ask the owner with `fgos questions ask` |
| `land-outside-footprint` | the branch changed a path outside the footprint: fix the branch or ask |
| `land-conflict-aborted` | rebase onto the trunk tip, resolve, land again |
| `land-recovery-required` | ask the owner to run `fgos git recover` |
| `footprint-change-refused` | your paths land touched the plan's `footprint`: remove that change |

## Never

- Write outside the plan directory yourself; change the plan footprint; start or stop a session.
- Ask outside `fgos questions ask` (granted to every head; `../_shared/decision-question.md`).
- Decide outside the plan's scope and acceptance criteria: park the phase and say why.

## Reports

At most 10 lines. Put the full report in the plan's `reports/` directory, named with `fgos convention path --kind report`.
