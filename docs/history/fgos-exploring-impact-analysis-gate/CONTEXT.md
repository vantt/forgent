# fgos-coding-exploring-impact-analysis-gate — locked decisions

Item: `tsk-17w`. Source description (raw, untrusted per RUL45): "fgos-coding-exploring
(stage clarify) has no impact-analysis capability-gate, unlike
fgos-coding-planning/fgos-coding-validating/fgos-coding-implement (all wired by tsk-1e4, merged
2026-07-31: fgos-coding-planning/SKILL.md:95-98, fgos-coding-validating/SKILL.md:81-86,
CLAUDE.md:10-33 all query `fgos tool query --capability impact-analysis
--status present`). Since judgeDiscovery itself has zero tool access
(DEFAULT_RUNNER_CONFIG.executor.args's `--allowedTools` in
src/runner/dispatch.mjs:207-220 only permits git add/git commit), any
scouting or capability query at clarify can only happen in the
fgos-coding-exploring skill session -- but that skill's own scout step (SKILL.md
step 1) is only a one-keyword rg pass over source/docs, it never queries the
impact-analysis capability the way the decompose/executing skills now do.
Fix: extend fgos-coding-exploring/SKILL.md's scout step to also query `fgos tool
query --capability impact-analysis --status present` and record the
posture, following the exact pattern tsk-1e4 already established for
fgos-coding-planning/fgos-coding-validating."

## Feature boundary

Extend `.claude/skills/fgos-coding-exploring/SKILL.md` step 1 ("Scope the gray
areas") so its scout pass also queries the impact-analysis capability gate
and records the resulting posture in `CONTEXT.md` — closing the one
clarify-stage gap left after tsk-1e4 wired `fgos-coding-planning`,
`fgos-coding-validating`, `fgos-coding-implement`, and `CLAUDE.md` itself. Exactly one
file changes: `.claude/skills/fgos-coding-exploring/SKILL.md`. No other skill
file, no runtime code, no CLI surface changes.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | The new capability query runs unconditionally on every clarify pass, with no domain-conditional branching. Grounded: `src/state/workflow-stage-graphs.mjs:88-100` registers exactly one other domain, `synthetic`, and it declares a single stage (`assembling` → `Execute`) with no `clarify` entry at all (`skillMap: { assembling: null }`) — `fgos-coding-exploring` is today only ever reachable through the `coding` domain's `clarify` stage, so a domain gate would be dead code (YAGNI). |
| D2 | The query call must pass `--dir "$root"` explicitly: `fgos tool`'s `query` sub-verb is `requiresExistingStore: true` (`src/cli/command-registry.mjs:750`), and this session's own cwd is a linked worktree — running the bare form here (`node bin/fgos.mjs tool query --capability impact-analysis --status present`, no `--dir`) was tested directly and failed exit 4: `.fgos/ not found ... check you are not inside a linked worktree (worktrees never carry .fgos/, per ADR0020)`. Add `tool` to fgos-coding-exploring's own existing hard-rule bare-verb list (currently `add, ask, answer, decision, discover`) alongside this new call, and write the new step's example with `--dir "$root"` included — never the bare form. |
| D3 | The resulting posture (`impact-analysis: inactive\|degraded\|full`) is recorded as a persisted line inside `CONTEXT.md` itself (this skill's own step 3 "Write the decision doc"), mirroring the exact recording shape `fgos-coding-planning` already uses in `plan.md` (tsk-1e4's pattern: `fgos-coding-planning/SKILL.md:97-98`) rather than a transient session-only status line. This is documentation only — `fgos-coding-exploring` edits no code, produces no proof points, and the hard rule already forbids it from doing implementation-level reasoning, so the posture never gates or reshapes which candidate product decisions get asked at this stage. It is recorded purely so a later reader of this item's `CONTEXT.md` (a person, or `fgos-coding-planning`'s own Orient step) sees the posture without re-deriving it — `fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement` keep independently re-querying the live gate themselves exactly as tsk-1e4 already established; this item does not change that. |

## Pinned assumptions (implementer-level)

- Placement: the new sub-step lands directly after step 1's existing `rg`
  keyword scout block, before the "Cite what the scout actually found..."
  paragraph — same step, not a new numbered step, matching how the other
  three skills fold their gate check into an existing step rather than
  adding one.
- Wording follows `CLAUDE.md`'s own three-way framing (0 providers →
  Inactive/not a gap; registered-not-present → Degraded; present → Full)
  rather than inventing new posture language.

## Scout evidence cited

- `.claude/skills/fgos-coding-implement/SKILL.md:64-71` — the executing-stage gate
  check pattern (posture drives whether the MUST-run-impact rule is
  Full/Degraded/Inactive).
- `.claude/skills/fgos-coding-planning/SKILL.md:94-100` — the planning-stage
  pattern: query the gate, record `impact-analysis: inactive|degraded|full`
  in `plan.md` next to the relevant proof point.
- `.claude/skills/fgos-coding-validating/SKILL.md:80-86` — the validating-stage
  pattern: cross-check the recorded posture against what the live gate
  reports right now; a stale/missing posture is a FAIL.
- `CLAUDE.md:8-33` — the capability-gate contract itself (three-way
  Inactive/Degraded/Full framing, the exact query command).
- `src/cli/command-registry.mjs:750,756-779` — `tool` verb registration:
  `requiresExistingStore: true`, `query` sub-verb, example invocation shown
  without `--dir` in its own registry text.
- Empirical test (this session, inside `.claude/worktrees/tsk-17w-XXsKEX`):
  `node bin/fgos.mjs tool query --capability impact-analysis --status
  present` with no `--dir` → exit 4, `.fgos/ not found ... check you are
  not inside a linked worktree`.
- `src/state/workflow-stage-graphs.mjs:30-42,88-100` — domain registry:
  `coding` is the only domain whose `clarify` stage maps to
  `fgos-coding-exploring`; `synthetic` is illustrative/`Execute`-only and never
  reaches `clarify`.
- `.claude/skills/fgos-coding-exploring/SKILL.md:17-26` — this skill's own
  existing hard rule requiring `--dir "$root"` on every bare state-touching
  `fgos <verb>` call, today enumerating `add, ask, answer, decision,
  discover` (not yet `tool`).

## Deferred / explicitly out of scope

- `fgos-coding-planning/SKILL.md:95-96`, `fgos-coding-validating/SKILL.md:83-84`, and
  `fgos-coding-implement/SKILL.md:67` each show their own `fgos tool query
  --capability impact-analysis --status present` example without `--dir`,
  the identical gap D2 fixes here. They are state-touching bare verb calls
  subject to the same ADR0020 worktree failure. Fixing them is adjacent
  work this item was not asked to do — flagged here for a follow-up item,
  not silently absorbed into tsk-17w's scope.

## Outstanding questions

None — every material point above was answerable directly from the repo
(registry code, domain graph, an empirical CLI run) or fixed by the item's
own "follow the exact pattern already established" instruction; nothing
here required a person's judgment call.
