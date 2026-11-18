# Phase 18 — Skills: supervisor, lead, planner no-item path, secretary handoff

**Owner question Q1 answered (A), 2026-11-18:** the lead skill says a lead writes only its plan dir.

Teaches the new roles through skills. `fgos-supervisor` and `fgos-lead` are new; `fgos-secretary`, `fgos-fanout` and
`fgos-coding-planning` change in the few lines the new machinery makes wrong. The sole writer of skill sources and
renders in this plan. The shaper brief template fix is not here (it moved to the secretary).

## Inputs
Step 0: re-grep every path and line. The session-verb plan renames `fgos head ...` to `fgos session ...` in
`core/skills/**` (PS-16), and the owner-question store drops the `--open` flag (bare `fgos questions` lists open questions) and
adds `fgos questions ask|ack|cancel` (its QP-9, QP-15); write the new skills with the final verb names and leave their
edits in the old ones alone. Persona files `core/agents/{supervisor,lead}.yaml` (phase 9) get their `skills` field
here naming `fgos-supervisor` / `fgos-lead`; regenerate `.claude/agents/**` with `node scripts/project-agents.mjs`.
- Plan vocabulary: `core/skills/_shared/plan-contract.md` (sections 2-5), `scripts/plan-contract-check.mjs`; plan path from `fgos convention path --kind plan`.
- Verbs this plan adds (phase 16): `fgos supervisor wake|plans|queue|handled|done`, `fgos land [--paths] [--test]`, `fgos request result [<id>] [--wait]`, `fgos session stop`, `fgos session start ... --for-question <id>`, `fgos slots`, `fgos watcher tick`; existing: `fgos session start`, `fgos questions`, `fgos run`, `fgos worktree create --branch`, `fgos mailbox send`. Grants: `src/session-host/head-grants.mjs` (phase 9); route bindings (phase 10).
- Duties and rules: `plan.md` outcome, PS-8, PS-9, PS-11, PS-14, PS-23, PS-24, the two Handoffs paragraphs.
- Fold-in, parked prototype: `git show origin/plan-supervisor-prototype:tools/plan-supervisor/SKILL.md` and `RUNBOOK.md`. Keep: stateless tick, drift check (`git rev-list --count <base>..HEAD -- <footprint>`), light/heavy weight guess, one owner queue. Drop: its own state dir, lock and `plan-board.mjs`.
- Hand brief: `/home/vantt/projects/forgent/.fgos/runtime/tmp/supervisor-brief-secretary-plan.md`, if it exists. Keep: per-phase leader seat, review by a `code-reviewer` subagent on `git diff origin/main...HEAD` with the phase file as the spec, staged explicit paths, never SIGKILL a test run, Cargo target on ext4, board line after each wave. Drop: `land-branch.sh` and hand census fixes.
- Edits: `core/skills/fgos-secretary/SKILL.md:6-7` (description), `:30-31` (route rows "`discussion: settled` | hand to a planner", "plan `ready` | hand to a supervisor"); `core/skills/fgos-fanout/SKILL.md:63-66, 78-90, 213-217, 262-278`, `core/skills/fgos-fanout/references/wave-dispatch-mechanics.md:59-61` (`slotsFull`), `core/task-specs/fgos-fanout.md:10,15`; `domains/coding/skills/fgos-coding-planning/SKILL.md` (item-bound).

## Footprint
`core/skills/fgos-supervisor/**`, `core/skills/fgos-lead/**`, `core/skills/fgos-secretary/**`, `core/skills/fgos-fanout/**`, `core/task-specs/fgos-fanout.md`, `core/agents/supervisor.yaml`, `core/agents/lead.yaml`, `.claude/agents/**` (regenerated), `domains/coding/skills/fgos-coding-planning/**`, `.agents/skills/**`, `.claude/skills/**`, `plugins/fgOS/skills/**`.

## Steps
1. `fgos-supervisor/SKILL.md` (`user-invocable: false`, frontmatter like `fgos-secretary`): a stateless wake.
   - Order: `fgos supervisor queue`; per event, act, and only after the action is done `fgos supervisor handled <id>`
     (a crash mid-drain leaves the event unhandled, so the next wake redoes it); `fgos supervisor done` last: it refuses
     while an event is unhandled and, on an empty queue, ends this session.
   - Admit: `fgos supervisor plans`; `ready` plans whose `blockedBy` are all done, by `priority` then `created`, while
     leads < `maxLeads` and `fgos slots --json` shows a free lane; mark `running` with `fgos land --paths`; start
     `fgos session start lead --name <headName from plans>`. A name collision (PS-11) becomes a question.
   - A `running` plan with `leadLive: false`, `head-gone` or `plan-no-progress`: restart from the phase table, park, or
     ask. Only the supervisor stops a lead.
   - Close `done` plans with a board line; `fgos session stop` its lead if still live.
   - `discussion-settled`: start the one planner (`fgos session start planner --name <headName of the discussion>`)
     unless a plan's `source` already names the discussion or that planner is live (PS-23); stop the planner with
     `fgos session stop` once its plan is `ready`.
   - `question-answered` (Handoffs): a live busy asker needs nothing; an idle or gone asker: `fgos session stop` the
     idle holder, then start the successor from the event's `successor` field with
     `fgos session start <persona> --name <name> --for-question <question id>` (the asker's own persona and name, so
     the successor holds the asker's `head:` role; Identity has no `answers:` role); the successor writes the answer
     back and acks or cancels with `fgos questions ack|cancel <id>`. Only the asker, a session with the same head
     role, or any head (asker without a head role) may ack or cancel; the supervisor never acks or cancels.
   - Portfolio edits reach `main` only through `fgos land --paths`. Owner questions only through
     `fgos questions ask` (five-part form), batched. Never implements, reviews, lands code or chats with the owner.
2. `fgos-lead/SKILL.md`: one plan. On start, `fgos request result` (no id) lists this role's tickets, so a restarted
   lead resumes its runs instead of starting them again. Read `plan.md`; per wave, for each phase whose footprint is
   disjoint, `fgos worktree create <path> --branch <name>` then `fgos run` with the phase file as brief and `--writes`
   inside the plan footprint; read outcomes with `fgos request result <id> --wait`; review each result with a
   `code-reviewer` subagent; land with `fgos land <branch> [--test <path>...]` (never `land-branch.sh`, never hand
   census edits); update the phase table with `fgos land --paths` (the footprint itself is never changed by a lead);
   set `done` or park with a reason. The lead writes only its plan dir. `fgos land` refusals are read by code
   (`land-gate-missing`, `land-outside-footprint`, `land-conflict-aborted`, `land-recovery-required` -> ask the owner
   to run `fgos git recover`): fix or ask, never bypass.
3. `fgos-secretary`: rows at `:30-31` and the description at `:6-7`: a settled discussion and a `ready` plan need no
   start from the secretary; the watcher raises `discussion-settled` / `plan-became-ready` and the supervisor starts
   the planner or lead. The secretary reports the status (PS-23). Any leftover `--open` flag on `fgos questions` in the
   skill becomes bare `fgos questions`.
4. `fgos-fanout`: the pre-check reads `fgos slots --json` and uses `lanes.free` for its report only; the gate is at seat
   start, a seat past the pool waits up to `workerSlots.laneWaitSec` and then returns `lane-pool-full`. Remove the
   `execution.*`, `hasRoom`, `null`-means-unarmed and `slotsFull` text from the skill, the reference and the task-spec
   in one pass.
5. `fgos-coding-planning`: add a no-item path. With no claimed item (a planner started on `discussion-settled`), read the
   settled discussion or shaping report, write `plans/<dir>/plan.md` and phase files per plan-contract, run
   `node scripts/plan-contract-check.mjs --plan <dir>`, land them with `fgos land --paths`, and set `status: ready` last.
   The item path stays as is.
6. Persona `skills` fields; `node scripts/project-agents.mjs`; `npm run build:skills`; commit the regenerated `.agents`,
   `.claude`, `plugins` renders. Never hand-edit them.

## Verify
- `npm run build:skills` leaves no diff on a second run.
- `node scripts/run-tests.mjs test/setup/instruction-projections.test.mjs test/rust-host/help-routes.test.mjs` passes, plus any test that names a changed skill (`rg -ln "fgos-fanout|fgos-secretary|fgos-coding-planning" test`).
- `node scripts/check-decision-citation-drift.mjs --skills-dir plugins/fgOS/skills` passes.
- `rg -n "slotsFull|execution\.free|hasRoom|land-branch|questions -[-]open" core domains .agents .claude plugins` finds nothing.

## Rollback
Revert the merge commit, rerun `node scripts/project-agents.mjs` and `npm run build:skills`. The personas then carry no
`skills` field again, as phase 9 left them.
