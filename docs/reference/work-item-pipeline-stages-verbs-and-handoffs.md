# Work-item pipeline: stages, verbs, actors, handoffs

Hand-authored reference, verified 2026-07-31 by reading the real source
(not generated via `fgos-coding-compounding`/`fgos-indexing` — no captured work
item backs this doc, so it carries no `docType`/`docPath` linkage). Scope:
what happens between `fgos submit` and `done`, who does each step
(mechanical engine verb vs skill-guided session), and what each step
consumes from the step before it / produces for the step after it.

**Updated 2026-07-31 (`tsk-4y5`, work-item-priority-matrix):** `priority`
is now a calculated field (rough pass at `clarify`, refined pass at
`decompose`); `intent` is retired in place (stops being written, field/flag
untouched). See `docs/history/work-item-priority-matrix/CONTEXT.md`/
`plan.md` for the full design.

**Updated 2026-07-31 (`tsk-2b0`, shipped after this doc was first
written):** the overloaded `discover` verb described below is SPLIT now —
`discover` only accepts an item at stage `clarify` (refuses otherwise,
naming `fgos plan <id>` instead); `decompose` is a separate verb only
accepting stage `decompose` (`bin/fgos.mjs:881-910`, hard split per D1, no
fallback). The diagram/table below are corrected for this split; treat any
remaining bare "`discover`" reference to the decompose-stage judge
elsewhere in this repo's older docs as stale.

## Stage/status flow

```mermaid
flowchart TD
    A["submit / add<br/>(mechanical, classify.mjs, no LLM)"] -->|"stage: clarify<br/>status: todo"| B["pull door<br/>take / pick"]
    B -->|"status: doing"| C{"discover<br/>(judgeDiscovery)<br/>writes rough priority"}
    C -->|"clear"| E1["decompose or executing<br/>(2 edges exist from clarify)"]
    C -->|"unclear"| D["awaiting-human<br/>fgos-coding-exploring: scout (rg, 1 keyword)<br/>+ 3-test filter, ask/answer"]
    D -->|"answered"| C
    E1 -->|"stage: decompose"| F{"decompose<br/>(judgeDecompose, separate verb, tsk-2b0)<br/>writes refined priority"}
    F -->|"pass-through"| H["executing"]
    F -->|"decompose"| G["children created<br/>(deps-linked, stage: executing directly)"]
    F -->|"need-human / risk:heavy / blast-radius"| D2["awaiting-human<br/>fgos-coding-planning + fgos-coding-validating<br/>(plan.md / CONTEXT.md, graph --what-if,<br/>capability-gate impact-analysis)"]
    D2 -->|"answered / plan approved"| F
    H --> I["fgos-coding-implement<br/>implement -> verify -> return"]
    G --> I
    I -->|"verify green"| J["awaiting-approval"]
    I -->|"verify red"| K["blocked"]
    K -->|"fix, return again"| I
    J --> L["review / approve / reject"]
    L -->|"reject"| I
    L -->|"approve"| M["compound-learn<br/>fgos-coding-compounding: tag + doc"]
    M --> N["done"]
```

## Step-by-step: responsibility, consumes, produces

| Step | Actor | Responsibility | Consumes (from before) | Produces (for after) |
|---|---|---|---|---|
| `submit`/`add` | Mechanical (`classify.mjs`, no LLM) | Classify tier/kind/risk from free text, generate id | Free-text description | Work item, `stage: clarify`, `status: todo` |
| pull door (`take`/`pick`) | Human/agent | Claim exactly one item | Frontier order (`priority` ASC → `intent` DESC → FIFO — v2 contract unchanged; `intent` now silently vacuous for every new item, per `tsk-4y5` D7) | `status: doing`; `pick` also creates `fgw/<id>` worktree |
| `discover` @ `clarify` (`judgeDiscovery`) | Mechanical, nested `claude -p`, **zero tool access** (`--allowedTools` limited to `git add`/`git commit`, `src/runner/dispatch.mjs:207-220`) | Verdict clear/unclear + `impactScore` (0-100 semantic-relatedness estimate, renamed from `intentScore` by `tsk-4y5` D3) | Item text + `graphMetrics`/`rankImpact` (work-graph metadata only, no code/docs read) | `clear` → next edge fires; `unclear` → `awaiting-human` + question; **rough `priority`** computed+written regardless of outcome (`impact` = `blocks` + `impactScore`, `effort` defaulted to floor, `urgent`/`risk` read from the item — `src/state/priority-formula.mjs`) |
| `fgos-coding-exploring` (only when parked) | Skill session, real tool access | Lock product decisions Socratically, filtered by material/grounded/answerable | Prior `judgeDiscovery` verdict, **one keyword `rg` scout pass** | `CONTEXT.md`, `fgos decision` log entries, `docsRef` pointer |
| `decompose` (`judgeDecompose`, **separate verb from `discover` now**, `tsk-2b0`) | Mechanical, same zero-tool-access executor | Verdict pass-through / decompose (auto children) / need-human | `docsRef` → `CONTEXT.md`/`plan.md` (post `tsk-1wd` fix — used to run blind, now grounded); also reads `plan.md`'s recorded mode + any real blast-radius figure (`tsk-4y5` D5/D8) | pass-through → `executing`; decompose → children (`parent`-linked when `fgos-coding-planning` created them — `--parent` is a real CLI flag now, `tsk-1xx` — or `deps`-linked when the judge auto-splits, `stage: executing` directly since D2 already forces each a real `verify`); need-human/`risk:heavy`/**blast-radius-over-threshold** → `awaiting-human`; **refined `priority`** recomputed on every non-invalid outcome (real `effort` from `plan.md`'s mode, real blast-radius when present) |
| `fgos-coding-planning` (session, first half of `decompose`) | Skill session, real tool access | Mode-size the item (mechanical flag count), write approach + risk map, decide split if any, **query `impact-analysis` capability** (`fgos tool query --capability impact-analysis --status present`, wired by `tsk-1e4`) | `CONTEXT.md`, `fgos graph --json`/`--what-if` | `plan.md` (mode, approach, risk map, capability posture) |
| `fgos-coding-validating` (session, second half of `decompose`) | Skill session, real tool access | Prove `plan.md` against real evidence, re-check `impact-analysis` posture live (never trust plan.md's stale note) | `plan.md`, live `fgos tool query` | READY / READY WITH CONSTRAINTS / NOT READY (hands back to `fgos-coding-planning` on fail) |
| `fgos-coding-implement` (stage `executing`) | Skill session (or runner auto-dispatch) | Implement, run item's own `verify`, check Iron Law evidence need, **query `impact-analysis` capability** before editing a symbol | `plan.md`/`CONTEXT.md` (when present), item's `verify` | Real diff, one commit; `fgos return` |
| `return` | Mechanical | Re-verify (never trusts caller), check clean tree + advanced commit history | Worktree diff | `awaiting-approval` (verify green) or `blocked` (verify red) |
| `review`/`approve`/`reject` | Human/agent + main-checkout lock | Gate the diff before merge | `awaiting-approval` item | Merge (approve) opens `executing→compound-learn` edge; reject sends back, never automatic |
| `fgos-coding-compounding` (`compound-learn`) | Skill session | Classify capture into one Diataxis quadrant, write/grow the end-user doc | `fgos check <id>` outcome/friction capture | Tagged capture (`docType`/`docPath`), doc under `docs/<quadrant>/` |
| `fgos-indexing` | Mechanical | Regenerate machine-readable doc index | Doc tree + capture tags | `docs/enduser-docs-index.json` |

## Two-layer pattern: mechanical engine judge vs skill session

The same shape repeats at both `clarify` and `decompose`: a **mechanical
judge** (`judgeDiscovery`/`judgeDecompose`, nested `claude -p`, verified
zero tool access) is the only thing allowed to actually fire a stage edge
(RUL42/RUL46 — picker stays mechanical forever); a **skill session**
(`fgos-coding-exploring`, `fgos-coding-planning`+`fgos-coding-validating`) does the real
grounded work (scout, graph queries, capability checks, feasibility
proof) but only ever writes *input* — `CONTEXT.md`/`plan.md`/decision
log — never applies the stage move itself.

| | Mechanical judge (fires the edge) | Skill session (grounds the decision) |
|---|---|---|
| `clarify` | `judgeDiscovery` — zero scout | `fgos-coding-exploring` — 1-keyword `rg` scout, 3-test question filter |
| `decompose` | `decompose` verb, `judgeDecompose` — separate verb from `discover` now (`tsk-2b0`), reads `docsRef` (post `tsk-1wd` fix), still zero tool access itself | `fgos-coding-planning`+`fgos-coding-validating` — `fgos graph --what-if`, **`impact-analysis` capability gate (wired, `tsk-1e4`)** |

`impact-analysis` capability gate (`fgos tool query --capability
impact-analysis --status present`, `src/state/tool-registry.mjs`) is wired
at `decompose` (planning+validating) and `executing` — **not yet at
`clarify`** (`fgos-coding-exploring` has no such step as of this writing).

## Known gaps (verified against source, not inferred)

1. ~~**`parent` field has no CLI writer.**~~ **RESOLVED (`tsk-1xx`,
   merged 2026-07-31.)** `add --parent`/`edit --parent` are real now
   (`src/cli/command-registry.mjs:82,227`, `bin/fgos.mjs:783,1046-1050`).
   `fgos-coding-planning` SKILL.md's step 5 can actually be executed as written.
2. ~~**`clarify` has no capability-gate for `impact-analysis`.**~~
   **RESOLVED (`tsk-17w`, merged 2026-07-31.)** `fgos-coding-exploring/SKILL.md`
   now queries it too, matching `fgos-coding-planning`/`fgos-coding-validating`/
   `fgos-coding-implement`.
3. **`priority` has no guard against a human's explicit `edit --priority`
   being silently overwritten by the next automated `discover`/`decompose`
   pass** (`tsk-4y5`, found in post-merge review; filed as `tsk-sq9`,
   `urgent: low`). `resolveDiscovery`
   (`src/intake/discovery.mjs:309-310`) and `resolveDecompose`
   (`src/intake/plan.mjs:394-401`) both write `priority`
   unconditionally, every pass, with no check for a pre-existing
   human-set value.

## Sources (file:line, read directly 2026-07-31)

`src/state/work.mjs`, `src/state/workflow-stage-graphs.mjs`,
`src/intake/classify.mjs`, `src/intake/discovery.mjs`,
`src/intake/plan.mjs`, `src/intake/judge-executor.mjs`,
`src/runner/dispatch.mjs`, `src/cli/command-registry.mjs`,
`bin/fgos.mjs`, `src/state/impact.mjs`, `src/state/graph-metrics.mjs`,
`src/state/tool-registry.mjs`, `.claude/skills/fgos-routing/SKILL.md`,
`.claude/skills/fgos-coding-exploring/SKILL.md`,
`.claude/skills/fgos-coding-planning/SKILL.md`,
`.claude/skills/fgos-coding-validating/SKILL.md`,
`.claude/skills/fgos-coding-implement/SKILL.md`,
`.claude/skills/fgos-coding-compounding/SKILL.md`, `docs/specs/runner.md`,
`docs/specs/work-state.md`, `docs/backlog.md` (STR7/STR8/STR14/STR40/
STR67/STR68/STR92/STR93, `tsk-1wd`, `tsk-1e4`).

Updated 2026-07-31 for `tsk-4y5`: `src/state/priority-formula.mjs`,
`docs/history/work-item-priority-matrix/CONTEXT.md`/`plan.md`.
