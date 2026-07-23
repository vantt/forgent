---
area: fgos-plugin
updated: 2026-07-23
sources: [str83-fgos-slash-commands, str88-fgos-verb-wrappers]
decisions: [7574fe5a]
coverage: full
---

# Spec: fgOS Plugin (Claude Code slash-command surface)

The fgOS plugin lets a person working inside Claude Code operate the fgOS
work-item lifecycle — claim, submit, move, monitor, and inspect work — as
`/fgOS:<verb>` slash commands, without hand-typing the underlying command-line
tool or its arguments. Every command is a thin, safety-checked wrapper: it
shells out to the one underlying tool, never touches the work-item store
directly, and shows the real error and stops when anything goes wrong. The
lifecycle rules each verb enforces (what "move" is allowed, what "return"
checks, what triggers "awaiting-human") are owned by the Work-State area
(`docs/specs/work-state.md`) — this spec covers only the plugin's own
convenience layer on top of that.

## Entry Points & Triggers

- `/fgOS:submit <free-text>` → intake a new work item from a plain-language description.
- `/fgOS:pick [id]` → claim the next (or a named) work item and switch straight into its own isolated workspace.
- `/fgOS:move <id> <status>` → move a work item to a new status.
- `/fgOS:return <id>` → complete a claimed item: run its own verification and advance it.
- `/fgOS:ask <id> <question text>` → park a work item pending a question, with the question attached.
- `/fgOS:answer <id> <answer text>` → resume a parked work item once its question is answered.
- `/fgOS:ready` → list every work item ready to be picked up right now.
- `/fgOS:stale` → list work items that look stuck (claimed but inactive too long).
- `/fgOS:rollup <id>` → show one work item's children: how many are done out of the total, and each child's status.
- `/fgOS:check [id]` → show the predicted-vs-actual outcome report for one item, or every item at once.
- `/fgOS:graph [id]` → show work-graph metrics (independent parallel tracks), or — with an id — what completing that one item would unblock.
- `/fgOS:conflicts` → list pairs of ready work items whose declared file footprints overlap (a parallel-work collision risk).

## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|---------|---------|--------|----------|---------|
| 1 | Work item id | The identifier of the item a command acts on or reports on | free text, must match an existing item for verbs that require one | required for `move`/`return`/`ask`/`answer`/`rollup`; optional for `pick`/`check`/`graph` | — (no default; an optional id omitted means "every item" for `check`, "the frontier head" for `pick`, "full metrics" for `graph`) |
| 2 | Target status | The status `move` transitions a work item to | any status in the item's lifecycle (owned by Work-State) | yes, for `move` | — |
| 3 | Question text | The question attached when parking an item | free text | yes, for `ask` | — |
| 4 | Answer text | The answer recorded to resume a parked item | free text | yes, for `answer` | — |
| 5 | Free-text description | The plain-language input a new item is intaken from | free text | yes, for `submit` | — |

## Behaviors & Operations

### submit

- **Blocked when:** the free-text description is empty — the person is asked for text before anything runs.
- **What changes:** a new work item is created from the description; if a clear, textually-grounded dependency on an existing item is found, the person is asked to confirm, edit, or reject it before the item is created — never attached silently.
- **Side effects:** none beyond the new item.
- **Afterwards:** the person sees the new item's id and derived fields.

### pick

- **Blocked when:** no id is given and no item is ready to claim, or a named id does not exist or cannot be claimed.
- **What changes:** the named (or next-ready) item is claimed, and an isolated workspace for it is created or reused.
- **Side effects:** the current session switches into that isolated workspace when the surrounding tool supports it; otherwise the workspace's location is printed for the person to open separately.
- **Afterwards:** the person sees which item was claimed and, when the switch could not happen automatically, where to go to continue.

### move

- **Blocked when:** the target status is missing, or the transition is not legal for the item's current status (checked by Work-State).
- **What changes:** the item's status changes to the target status.
- **Side effects:** none beyond the status change itself.
- **Afterwards:** the person sees the item's previous and new status.

### return

- **Blocked when:** the item id does not exist, or is not currently in a state `return` can act on.
- **What changes:** the item's own verification runs; a passing result advances it, a failing result parks it as blocked, per Work-State's rules.
- **Side effects:** none beyond the status change.
- **Afterwards:** the person sees whether verification passed and the item's resulting status.

### ask

- **Blocked when:** the question text is missing — the person is asked for it rather than the command guessing or skipping it.
- **What changes:** the item is parked pending an answer, with the question attached.
- **Side effects:** none beyond the park.
- **Afterwards:** the person sees the item's previous and new status.

### answer

- **Blocked when:** the answer text is missing — same handling as `ask`.
- **What changes:** the answer is recorded and the item resumes from its parked state.
- **Side effects:** none beyond the resume.
- **Afterwards:** the person sees the item's previous and new status.

### ready

- **Runs when:** invoked with no argument.
- **What changes:** nothing — read-only.
- **Side effects:** none.
- **Afterwards:** the person sees the current list of work items ready to be picked up.

### stale

- **Runs when:** invoked with no argument.
- **What changes:** nothing — read-only, never reclaims a stuck item itself.
- **Side effects:** none.
- **Afterwards:** the person sees which items look stuck, classified by how long is "too long" for the kind of actor holding each one.

### rollup

- **Blocked when:** the id is missing, or does not exist.
- **What changes:** nothing — read-only.
- **Side effects:** none.
- **Afterwards:** the person sees the parent item, a done/total count of its direct children, and each child's own status.

### check

- **Runs when:** invoked with or without an id.
- **What changes:** nothing — read-only.
- **Side effects:** none.
- **Afterwards:** the person sees the predicted-vs-actual report for the named item, or for every item when none is named.

### graph

- **Runs when:** invoked with or without an id.
- **What changes:** nothing — read-only.
- **Side effects:** none.
- **Afterwards:** with no id, the person sees the full work-graph metrics (independent parallel tracks and related structure); with an id, they see only what completing that one item would unblock.

### conflicts

- **Runs when:** invoked with no argument.
- **What changes:** nothing — read-only, suggests only, never re-slices work itself.
- **Side effects:** none.
- **Afterwards:** the person sees pairs of ready items whose file footprints overlap, with the shared paths.

## Actors & Access

| Capability | Person in a Claude Code session |
|---|---|
| Submit / pick / move / return / ask / answer (mutating verbs) | ✓ |
| Read frontier / staleness / rollup / check / graph / conflicts | ✓ |

Every command runs as whatever actor the underlying tool itself assigns (a
human actor for the mutating verbs) — the plugin layer introduces no separate
role model of its own.

## Business Rules

- **R1.** The plugin wraps exactly 12 verbs total: `submit`, `pick` (existing) plus `move`, `return`, `ask`, `answer` (manipulate), `ready`, `stale`, `rollup` (monitor), `check`, `graph`, `conflicts` (inspect) — added deliberately to cover convenience for manipulating, monitoring, and inspecting work, not to mirror every command the underlying tool exposes (per 7574fe5a).
- **R2.** Every command is one-door-write: it only ever shells out to the underlying tool's own command for that verb — it never writes the work-item store directly.
- **R3.** On a failing command, the person sees the real error and the command stops — it never retries with a guessed argument and never falls back silently.
- **R4 (not yet implemented — see `docs/backlog.md`).** The remaining verbs the underlying tool exposes (`init`, `add`, `discover`, `compound`, `edit`, `decision`, `list`, `rebuild`, `repair`, `take`, `review`, `approve`, `reject`, `catchup`, `evolve`, `triage`, `docs-index`, `doc-sources`, `session`) have no plugin wrapper; a person needs them must use the underlying tool directly.

## Edge Cases Settled

- An empty required argument (`move` missing a target status, `ask`/`answer` missing text, `submit` missing a description) is never guessed or silently skipped — the person is asked, or the command stops and shows the underlying tool's own error.
- An id argument that does not exist is not pre-validated by the plugin layer — the underlying tool's own error surfaces verbatim.

## Open Gaps

- none — every entry point, behavior, and rule above is evidenced against the shipped skill files and the underlying tool's source.

## Visuals

Not applicable — no screen; this is a command-line/chat interaction surface.

## Pointers (implementation)

- `repo/plugins/fgOS/.claude-plugin/plugin.json` — plugin manifest (name, description, version).
- `repo/plugins/fgOS/skills/<verb>/SKILL.md` — one skill per verb (`submit`, `pick`, `move`, `return`, `ask`, `answer`, `ready`, `stale`, `rollup`, `check`, `graph`, `conflicts`); each wraps `node ${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs <verb> ...`.
- `repo/bin/fgos.mjs` — the underlying CLI every wrapper shells out to; owns argument validation and all lifecycle enforcement.
- `docs/specs/work-state.md` — the lifecycle/FSM meaning behind `move`/`return`/`ask`/`answer` and every other verb's business rules.
