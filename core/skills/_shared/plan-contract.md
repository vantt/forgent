# Shared fragment: plan-contract

The contract every plan satisfies, whichever planning skill wrote it (`ak-plan`,
`fgos-coding-planning`, or another). No planning skill is changed; the contract wraps
it and a check enforces it.

**Before running any planning skill, read this contract; the output must satisfy it;
run the check.**

`scripts/plan-contract-check.mjs` is the fgOS repository's own check; other projects do
not ship it. In the fgOS repo, run it:

```bash
node scripts/plan-contract-check.mjs --plan plans/<dir>   # one plan, any error exits 1
node scripts/plan-contract-check.mjs --all                # every plan; legacy plans are warned, not failed
```

In any other project, the planner applies the same rules by reading the plan: the required
keys and sections are present, each phase sits in a later wave than its dependencies, and no
two phases in one wave share a footprint. The planner then states in the plan, under the
phase table, that it checked these and what it found.

Plans are project data: plain files in the repository, generic and self-describing, with
no UI-specific or project-specific keys (D-ADR0079 (the portfolio is the project's truth; Work is a replaceable surface)). An engine runs from them with no UI;
any UI layer reads them through its own adapter. The check reads frontmatter through
the YAML door (`src/util/yaml.mjs`), never a private parser.

## 1. Location

- Plan directory: `plans/<dir>/`, with `<dir>` from `fgos convention path --kind plan`
  (Rule: convention-paths, in AGENTS.md; set in .fgos/instructions/effective/rules.json)
- `plans/<dir>/plan.md`: the plan. `plans/<dir>/phase-NN-<name>.md`: one file per phase.
  `plans/<dir>/reports/`: reports, measures, research.
- Boundary: `core/agents/planner.yaml` (description and decision boundary). Within it, the planner
  writes only inside its plan dir; source, tests, docs and other plans are read, never edited.

## 2. Frontmatter of plan.md

| Key | Type | Meaning |
|---|---|---|
| `contract` | `plan-v1` | marks the plan as under this contract; the check skips plans without it (legacy) |
| `title` | string | one line |
| `status` | `draft` \| `ready` \| `running` \| `done` \| `withdrawn` | one vocabulary, below |
| `priority` | `P0`..`P3` | |
| `blockedBy` | list of plan dir names | each must exist under `plans/`; `[]` when none |
| `footprint` | list of repo-relative paths or globs | everything the plan may write: code, tests, docs, changelog.d/<fragment>, the plan dir. Required when `ready` or `running` |
| `base` | 40-char commit sha | the commit the plan was written against; required when `ready` or `running` |
| `host` | Identity machine id (2-63 of `a-z0-9-`) | optional placement. On `ready`, only that machine may run the plan (another machine holds it `held-other-machine:<host>`); with no `host`, the first machine whose admission push reaches origin claims it. On `running`, written by admission in the same commit as `lead` and `base`; a land that changes `host` on a running plan is refused `host-change-refused`. The check warns, never errors, when Identity does not know the machine |
| `lead` | Identity role string, e.g. `lead:S6A` or `head:lead-<handle>-<plan>` | the role of the lead that runs the plan; written in the same commit that sets `status: running`. Required when `status: running` (the check fails if a `running` plan lacks it); the supervisor holds a running plan with no `lead` and never restarts it |
| `source` | list of strings | the DISCUSSION.md path and/or backlog ids the plan answers |
| `created` | `YYYY-MM-DD` | |

Status meanings: `draft` being written or blocked on an owner answer; `ready` passed the
check and may be picked up; `running` a leader holds it; `done` delivered; `withdrawn`
dropped (kept for history).

Legacy values map when a plan is migrated (add `contract: plan-v1` and rewrite the status):
`pending`, `proposed` -> `draft` (or `ready` once it passes the check); `todo`, `approved` -> `ready`;
`in-progress` -> `running`; `completed`, `complete`, `landed`, `done` -> `done`; `cancelled`, `archived` ->
`withdrawn`; any other text (`partial`, `deferred`, a sentence) is decided by the owner. The check counts legacy plans by their mapped value and does not fail them.

## 3. Body of plan.md

Headings (any level) for each, in this order:

1. **Outcome**: what is true when the plan is done, in plain words.
2. **Acceptance criteria**: checks a stranger can run; each names its command or file.
3. **Non-goals**: what is deliberately left out.
4. **Authority map**: a table `New thing | Model row | Note`, between Non-goals and Phases. Each new
   decision, function, module, verb or contract maps to a row id that `fgos authority locate "<sentence>"`
   returns, or to `declare: <kind> <id>` when no row owns it (`kind` is `component`, `decision-kind`,
   `door` or `contract`). A row that overlaps something that already exists says
   `survivor: <id>; retired: <path>`. Applies only where the project has a component authority model
   (`packages/component-authority/model/` in the fgOS repository, `.fgos/authority/model/` elsewhere);
   where it has none, `fgos authority locate` answers `authority: inactive`, and the plan records
   `authority: inactive` in place of the table and goes on.
5. **Phases**: the phase table (section 4).
5a. **Unattended run**: the section below. The rule itself lives in the units `ready-plan-runs-unattended` and
   `coding-footprint-tracing` (Rule: both in AGENTS.md; set in .fgos/instructions/effective/rules.json); this
   contract fixes only the shape.
6. **Owner questions**: only what the owner alone can answer per `decision-question.md#when-to-ask`. Ask each with `fgos questions ask`
   (five-part form of [decision-question.md](decision-question.md)) and list the `q-` ids here,
   each with its headline. Decide whatever the evidence settles (Rule: product-priority-order, in AGENTS.md; set in .fgos/instructions/effective/rules.json, priority 2).
7. **Risks and rollback**: failure modes and the single revert path.

### Unattended run section

```markdown
## Unattended run

### Host steps
| step | argv | executor |
|---|---|---|
| full gate on the integrated tree | fgos release check --worktree <path> | lead |

### Cleanup
Standing rule.            <- or the cleanup that differs

### Beyond the rule
None.                     <- or a table | item | question |, one answered q- id per row

### Split
One sentence: which split was chosen and why.
```

Host steps is `None.` or a table whose every row has an argv starting with `fgos ` and a non-empty executor
(a persona name). Every top-level item under Acceptance criteria starts with `[core]` or `[debt-ok]` after its
number or bullet. Required for a plan going `ready` that was created on or after 2026-11-28; earlier plans are
not failed.

## 4. Organize for parallel work

Phases are the unit of parallel work. Write the plan so as many phases as possible can run
at once.

The phase table has exactly these columns (order free):

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | name linking to the phase file | ids or `-` | owned paths, comma separated | 1 | draft |

- **Footprint**: each phase lists the files it owns (create, modify, delete). Phases in the
  same wave must have disjoint footprints (equal paths or a path inside another's count as
  overlap; a glob counts as its fixed prefix).
- **Footprint check** (an overlap check between phases, not a check of what a phase creates; that is the
  Authority map): before fixing the phase table, run `fgos resource-check --units <file.json>` on the
  draft (before the phase files exist) and `fgos resource-check --plan <plan dir>` after; fix the
  colliding pairs, cycles and layers it reports before you set a wave. In a project without fgOS,
  apply the same overlap rule by hand as stated above.
- **Waves**: a phase's wave is later than the wave of everything it depends on. Every phase
  whose dependencies are met starts at once; layers stay serial (a lower layer lands before
  the one above it starts).
- **Hot files**: one writer per hot file per wave. A shared file (registry, manifest, index)
  goes to one phase or to a final serial phase. Generated files declared in `land.regenerate`
  are rebuilt at land (Rule: design-principles (in AGENTS.md; set in .fgos/instructions/effective/rules.json)., principle 7).
- **Size**: a phase fits one short leader, about one to two days of work. Larger: split it,
  by file boundary first.
- **Execution**: each parallel phase runs as its own Workflow case in its own worktree.
  Judge and validate run once for the plan; every other phase's case continues it with
  `--inherit`. Keep at most 2 slices per case; a project with one family counts solo as a
  deviation (one slice per case).
- **Integration**: the last wave holds an integration phase that merges the branches and
  re-runs the full gate on the combined tree. A branch that passes alone does not prove the
  merge. The gate must also hold on a tree that has only some phases.
- **Phase file**: write it so a fresh leader runs it cold, from the file alone:
  1. inputs (what to read, with paths),
  2. the files it may write (its footprint),
  3. steps in order,
  4. the verify command and the pass condition,
  5. rollback (how to undo the phase).

## 5. Rules

- `ready` is set last, and only after the check passes with no error: the script in the
  fgOS repo, the planner's stated reading check elsewhere.
- `lead` is required with `running` (written in the same commit that sets `status: running`;
  the check fails if a `running` plan lacks it).
- The land door runs the check on every landed plan (`node scripts/plan-contract-check.mjs`);
  a plan that breaks the contract cannot land.
- Cross-plan footprint overlap: overlap with another `ready` or `running` plan is a warning
  naming the plan and paths, never an error, and conflicts are met at land; `blockedBy` is for
  a real ordering, never a workaround for a shared file.
- A plan blocked by an owner question stays `draft` as a whole, but every phase the answer
  does not touch is marked `ready` in the phase table and may start. List the blocked phase
  and its question; do not hold the others.
- Prior art before design: Rule: before-touching-code, in AGENTS.md; set in .fgos/instructions/effective/rules.json.
- A follow-up on a topic whose plan is `done` (a new discussion, a new backlog row) either extends that plan or is a
  new plan. Extend it only when it keeps the same owner and footprint: set `status: draft`, drop `lead` and reset
  `base`, keep every finished phase `done` and add the new ones, list the new discussion and rows in `source`, and
  say in the body why it was extended and what the earlier title meant. Before reopening, check that no plan
  lists it in `blockedBy` (reopening un-satisfies that wait); if one does, write a new plan instead. Otherwise write a
  new plan and cite the old one in `source`.
- Authority map: the validating reviewer rejects a plan whose map is missing or unproven (a row id that
  `fgos authority locate` does not return, a `declare` with no reason, an overlap with no `survivor:`).
  Until documentation H2 admission exists, that review is the independent admission step for each `declare`
  in the map; a new component or decision kind still needs the owner's answered question (`fgos authority
  declare --approved-by <q-id>`). The check for `draft` and `ready` plans fails a missing `Authority map`
  heading, a row id that is not in the model and is not a `declare:` line, and an `overlaps` line without
  `survivor:`; it skips the rule where the project has no model, and for plans created before 2026-11-24.
- No plan ids, phase numbers, audit labels or finding codes in code comments, test names,
  migration names or commit messages: describe the behavior.
- A planner ends its reply with the status block:
  `Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT`, a one-line summary, and
  optional concerns.
