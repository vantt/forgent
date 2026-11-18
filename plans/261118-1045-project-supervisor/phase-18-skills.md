# Phase 18 — Skills: supervisor, lead, planner no-item path, secretary handoff

Teaches the new roles through skills. `fgos-supervisor` and `fgos-lead` are new; `fgos-secretary`, `fgos-fanout` and `fgos-coding-planning` change in the few lines the new machinery makes wrong. The sole writer of skill sources and renders in this plan. The shaper brief template fix is not here (it moved to the secretary).

## Inputs
Step 0: re-grep every path and line. The session-verb plan renames `fgos head ...` to `fgos session ...` in `core/skills/**` (PS-16); write the new skills with the final verb names and leave its edits in the old ones alone. Persona files `core/agents/{supervisor,lead,planner}.yaml` (phase 9) name the skills each persona loads; this phase adds their `skills` field naming `fgos-supervisor` / `fgos-lead` and regenerates `.claude/agents/**` with `node scripts/project-agents.mjs`.
- Plan vocabulary: `core/skills/_shared/plan-contract.md` (sections 2-5), `scripts/plan-contract-check.mjs`; plan path from `fgos convention path --kind plan`.
- Verbs this plan adds (phase 16): `fgos supervisor wake|plans|queue|handled|done`, `fgos land [--paths]`, `fgos slots`, `fgos watcher tick`; existing: `fgos session start|stop`, `fgos questions --open`, `fgos run`, `fgos mailbox send`. Grants: `src/session-host/head-grants.mjs` (phase 9).
- Duties and admission rule: `plan.md` outcome and PS-8, PS-9, PS-11, PS-14.
- Fold-in, parked prototype: `git show origin/plan-supervisor-prototype:tools/plan-supervisor/SKILL.md` and `RUNBOOK.md`. Keep: stateless tick, drift check (`git rev-list --count <base>..HEAD -- <footprint>`), light/heavy weight guess, one owner queue. Drop: its own state dir, lock and `plan-board.mjs` (the Event Store queue and `fgos supervisor` replace them).
- Hand brief: `/home/vantt/projects/forgent/.fgos/runtime/tmp/supervisor-brief-secretary-plan.md`, if it exists. Keep: per-phase leader seat, review by a `code-reviewer` subagent on `git diff origin/main...HEAD` with the phase file as the spec, staged explicit paths, never SIGKILL a test run, Cargo target on ext4, board line after each wave. Drop: `land-branch.sh` and hand census fixes (`fgos land` replaces them).
- Edits: `core/skills/fgos-secretary/SKILL.md:31` (route row "plan `ready` | hand to a supervisor"); `core/skills/fgos-fanout/SKILL.md:63-66, 78-90, 213-217, 262-278`, `core/skills/fgos-fanout/references/wave-dispatch-mechanics.md:59-61` (`slotsFull`), `core/task-specs/fgos-fanout.md:10,15` (slot-gated, `min(5, execution.free)`); `domains/coding/skills/fgos-coding-planning/SKILL.md` (item-bound: "creates no work items", `docs/history/<feature>/plan.md`).

## Footprint
`core/skills/fgos-supervisor/**`, `core/skills/fgos-lead/**`, `core/skills/fgos-secretary/**`, `core/skills/fgos-fanout/**`, `core/task-specs/fgos-fanout.md`, `core/agents/supervisor.yaml`, `core/agents/lead.yaml`, `.claude/agents/**` (regenerated), `domains/coding/skills/fgos-coding-planning/**`, `.agents/skills/**`, `.claude/skills/**`, `plugins/fgOS/skills/**`.

## Steps
1. `fgos-supervisor/SKILL.md` (`user-invocable: false`, frontmatter like `fgos-secretary`): a stateless wake. Order: `fgos supervisor queue`; per event, act, then `fgos supervisor handled <id>`; `fgos supervisor done` last (it refuses while an event is unhandled). Duties from `plan.md`: admit `ready` plans whose `blockedBy` are all done, by `priority` then `created`, while leads < `supervisor.maxLeads` and `fgos slots` shows a free lane; mark `running`, start `fgos session start lead --name <plan dir cut to 32>`; a gone or stuck lead is restarted from the phase table, parked, or asked about; close `done` plans with a board line; start a planner on `discussion-settled`. Portfolio edits reach `main` only through `fgos land --paths`. Owner questions only in the five-part form, batched (`fgos questions --open`). A name collision (PS-11) becomes a question. Never implements, reviews, lands code or chats with the owner.
2. `fgos-lead/SKILL.md`: one plan. Read `plan.md`; per wave start the phases whose footprints are disjoint, each as `fgos run` with its phase file as brief; review each result with a `code-reviewer` subagent; land with `fgos land <branch>` (never `land-branch.sh`, never hand census edits); update the phase table with `fgos land --paths`; set `done` or park with a reason. `fgos land` refusals are read by code (`land-gate-missing`, a conflict beyond generated files): fix or ask, never bypass. Ticket verbs: read the outcome with `request result <id>`.
3. `fgos-secretary`: change only the `plan ready` row: nothing to do, the watcher raises `plan-became-ready` and wakes the supervisor; the secretary reports its status.
4. `fgos-fanout`: the pre-check reads `fgos slots --json` and uses `lanes.free`; the gate itself is enforced at seat start, a refused seat returns `lane-pool-full`. Remove the `execution.*`, `hasRoom`, `null`-means-unarmed and `slotsFull` text from the skill, the reference and the task-spec in one pass.
5. `fgos-coding-planning`: add a no-item path. With no claimed item (a planner started on `discussion-settled`), read the settled discussion or shaping report, write `plans/<dir>/plan.md` and phase files per plan-contract, run `node scripts/plan-contract-check.mjs --plan <dir>`, and set `status: ready` last. The item path stays as is.
6. `npm run build:skills`; commit the regenerated `.agents`, `.claude`, `plugins` renders. Never hand-edit them.

## Verify
- `npm run build:skills` leaves no diff on a second run.
- `node scripts/run-tests.mjs test/setup/instruction-projections.test.mjs test/rust-host/help-routes.test.mjs` passes, plus any test that names a changed skill (`rg -ln "fgos-fanout|fgos-secretary|fgos-coding-planning" test`).
- `node scripts/check-decision-citation-drift.mjs --skills-dir plugins/fgOS/skills` passes.
- `rg -n "slotsFull|execution\.free|hasRoom|land-branch" core domains .agents .claude plugins` finds nothing.

## Rollback
Revert the merge commit and run `npm run build:skills`. The personas of phase 9 then list two skills that do not exist; revert 9 with it, or a persona-skill check fails.
