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
no UI-specific or project-specific keys (D-ADR0079). An engine runs from them with no UI;
any UI layer reads them through its own adapter. The check reads frontmatter through
the YAML door (`src/util/yaml.mjs`), never a private parser.

## 1. Location

- Plan directory: `plans/<dir>/`, with `<dir>` from `fgos convention path --kind plan`
  (never built by hand; parallel planners choose distinct slugs).
- `plans/<dir>/plan.md`: the plan. `plans/<dir>/phase-NN-<name>.md`: one file per phase.
  `plans/<dir>/reports/`: reports, measures, research.
- The planner writes only inside its plan dir. Source, tests, docs and other plans are
  read, never edited.

## 2. Frontmatter of plan.md

| Key | Type | Meaning |
|---|---|---|
| `contract` | `plan-v1` | marks the plan as under this contract; the check skips plans without it (legacy) |
| `title` | string | one line |
| `status` | `draft` \| `ready` \| `running` \| `done` \| `withdrawn` | one vocabulary, below |
| `priority` | `P0`..`P3` | |
| `blockedBy` | list of plan dir names | each must exist under `plans/`; `[]` when none |
| `footprint` | list of repo-relative paths or globs | everything the plan may write: code, tests, docs, CHANGELOG, the plan dir. Required when `ready` or `running` |
| `base` | 40-char commit sha | the commit the plan was written against; required when `ready` or `running` |
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
4. **Phases**: the phase table (section 4).
5. **Owner questions**: only what the owner alone can answer, batched in one place, each
   in the five-part form of [decision-question.md](decision-question.md) (what is
   happening, cause, options with cost, recommendation, scope of the answer). Decide
   whatever the evidence settles instead of asking.
6. **Risks and rollback**: failure modes and the single revert path.

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
- **Waves**: a phase's wave is later than the wave of everything it depends on. Every phase
  whose dependencies are met starts at once; layers stay serial (a lower layer lands before
  the one above it starts).
- **Hot files**: one writer per hot file per wave. A shared file (registry, manifest, index,
  CHANGELOG) goes to one phase or to a final serial phase. Generated files are named as hot
  files and are regenerated, never hand-merged.
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
- A plan blocked by an owner question stays `draft` as a whole, but every phase the answer
  does not touch is marked `ready` in the phase table and may start. List the blocked phase
  and its question; do not hold the others.
- Two `ready` or `running` plans whose footprints overlap are flagged by the check; resolve
  by `blockedBy` or by narrowing a footprint.
- Prior art before design: say what the plan reused and what was missing.
- No plan ids, phase numbers, audit labels or finding codes in code comments, test names,
  migration names or commit messages: describe the behavior.
- A planner ends its reply with the status block:
  `Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT`, a one-line summary, and
  optional concerns.
