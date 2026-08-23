# CONTEXT: fgOS choke-point survey (tsk-1ab)

## Feature boundary

A read-only, repo-wide survey of fgOS's own implementation (`bin/fgos.mjs`,
`src/runner/*.mjs`, `src/intake/*.mjs`, skills under `plugins/fgOS/skills/`)
for **choke-points**: decision types that multiple independent call sites
(a CLI verb, the runner's automatic loop, a user-facing skill) each
reimplement on their own instead of routing through one shared
harness/module — producing behavior that silently diverges between
"someone calling the CLI directly", "the runner loop", and "a skill",
for what is meant to be the same business rule.

`tsk-53f` already confirmed one concrete instance of this pattern (claim +
worktree-isolation: `take`/`pick` vs `loop.mjs`, see
`plans/reports/choke-point-investigation-260728-1717-claim-worktree-report.md`).
This item is the broader survey: find the *pattern* across other decision
types, not just that one case.

Deliverable: (1) a list of every suspected repeated decision-point across
CLI/runner/skill, (2) per candidate, confirmation of *real* logic
duplication (not surface similarity) by reading each call site, (3) a
single ranked table for merge priority, (4) no fixes applied now — each
fix becomes its own item later, mirroring how tsk-53f's finding became its
own item.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Output lands in `docs/decisions/` (an architecture-decision record), not `plans/reports/` — this survey's findings are treated as decision input, not a throwaway investigation report. |
| D2 | The worktree/`createWorktree` case is **re-investigated from scratch** as part of this survey; tsk-53f's existing report is not reused as-is. Scope is explicitly **not limited to worktree** — the survey covers every decision type suspected of being reimplemented independently per call site (same business rule, divergent behavior across CLI/runner/skill). |
| D3 | The 4 candidates named in the item description (lock acquisition per verb, verify run/timeout, `docType`/`docsRef` validation, worktree create/cleanup) are a **non-exhaustive starting point**, not a checklist ceiling. The survey actively searches for other choke-point categories beyond those 4. |
| D4 | Ranking output is **one flat table** (not split by criterion): sort key = risk-of-behavior-divergence DESC, call-frequency DESC as tiebreak. Mirrors tsk-63j's D3 flat-table precedent (`fgOS:triage`). |

## Pinned terms

- **Choke-point** (as used by this item): a single shared module/function/skill that every flow needing a given decision is routed through, so the decision is made once and applied consistently.
- **Decision type** (unit of survey): a category of business logic that recurs across call sites — e.g. "how is a lock acquired", "how does verify run and time out", "how is docType/docsRef validated" — not a single line of code.
- Explicitly excluded from this item's own execution: applying any fix. Each confirmed choke-point becomes a separate item at decompose/planning time.

## Scout evidence

- `plans/reports/choke-point-investigation-260728-1717-claim-worktree-report.md` (tsk-53f, 2026-07-28): confirmed 3 independent claim paths and 6 `createWorktree` call sites with no shared choke-point; `main-checkout-lock.mjs` defined but imported nowhere (dead code). Referenced as prior-art pattern, not reused as this item's deliverable per D2 — worktree is re-verified fresh here alongside every other candidate.
- `grep -rn "createWorktree" src bin`: call sites in `src/runner/claim-port.mjs:170`, `src/runner/loop.mjs:398,679,681`, `bin/fgos.mjs` (pick/approve/review paths) — consistent with tsk-53f's 6-site count, available as a starting cross-check, not the final answer for this item.
- `fgos list` → `view.discovery["tsk-1ab"]`: empty — no prior clarify round for this item.
- `fgos list` → `view.decisions`: no prior D-entries scoped to `tsk-1ab` before this session; entries for tsk-63j/tsk-53f/tsk-64s confirm the flat-table and file-scope decision-recording conventions this item's D1–D4 follow.

## Canonical references

- `plans/reports/choke-point-investigation-260728-1717-claim-worktree-report.md` — prior-art format and the one already-confirmed instance of the pattern.
- `src/state/workflow-stage-graphs.mjs` — domain/stage → skill registry (how `fgos-routing` resolves this item's next skill after `clarify`).
- `docs/specs/runner.md` — RUL44/RUL45 conventions this survey's own writing must respect (untrusted item text, single source of truth for a decision type).

## Outstanding questions deferred to planning

- Whether the survey needs to spawn child work items immediately for each ranked choke-point (as tsk-53f became its own item), or whether that split happens in a later planning/decompose pass — this is a shaping/sizing judgment call, not a clarify-stage decision (fgos-coding-exploring hard rule: does not decide how to split work).
- Whether `docs/decisions/` gets one combined decision record for the whole survey, or one record per confirmed choke-point — a shaping/format detail for planning, not gated here.
