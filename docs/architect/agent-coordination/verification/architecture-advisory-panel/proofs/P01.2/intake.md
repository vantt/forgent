# Intake — P01.2 Clear-Input Manual Proof

Provenance: Coordinator (session `1b6fb381-92ae-4764-b75e-f1a39844aa49`), 2026-09-06.

## The Person's Words (verbatim, never edited)

The case as named in `plans/260905-architecture-advisory-panel/plan.md`'s
"Proof Cases And Human Boundary" section, and re-confirmed directly by the
person on 2026-09-06 as still genuinely undecided (their exact words:
"mdview vẫn chưa quyết, cho panel dispatch vào đi" — "mdview is still
undecided, go ahead and dispatch the panel into it"):

> decide whether the experimental native desktop shell should remain a thin
> client of the existing single-daemon registry/render/search authority or
> acquire local ownership

## Who Is Asking

PERSON input as filled by the launcher (the Coordinator, at session start,
per the person's own direct instruction): "the project maintainer; holds
final authority over this decision." No further detail about authority was
volunteered and none is assumed — Phase 3 (Context Investigator) scouts
CODEOWNERS/commit history/permissions on `mdview` if authority ever becomes
material; Phase 1 opens no channel to ask.

## Case Boundary

- PROJECT_ROOT: `/home/vantt/projects/mdview` (a real, independent git repo,
  NOT part of the `forgentX` repo this playbook lives in).
- Genuinely undecided per the person's direct confirmation (2026-09-06) —
  not inferred, not assumed.
- Out of bounds: no implementation, no mutation of `PROJECT_ROOT` under any
  circumstance, no git authority over `mdview`, no vote tallying, no
  fabricated human input.
- No constraint was volunteered beyond the question itself.

## Roster Resolved At Intake

Per `architecture-advisory-coordinator.md`'s ROLE ROUTING and the P00.1
allowlist (`docs/architect/agent-coordination/verification/architecture-advisory-panel/P00.1.md`):

| Role | Executor/mechanism | Provider family | Tier |
|---|---|---|---|
| Lead advisor | `claude` via bwrap | `claude` | critical |
| Context investigator | `codex-readonly` (native sandbox) | `openai-codex` | analytical |
| System shaper | `claude` via bwrap | `claude` | analytical |
| Alternative shaper | `agy` via bwrap | `gemini` | analytical |
| Constraint advocate | `codex-readonly` | `openai-codex` | analytical |
| Architecture critic | `agy` via bwrap | `gemini` | analytical |
| Synthesizer | `claude` via bwrap | `claude` | critical |

Three provider families reachable (`claude`, `openai-codex`, `gemini`) —
satisfies the diversity floor with margin. Real per-actor dispatch
mechanism, provenance, and any material tier effect are recorded in
`runs/<ordinal>-<role>.json` as each actor is actually dispatched, not
assumed in advance.

**Real gap found and recorded here rather than silently worked around:**
`architecture-advisory-coordinator.md`'s ROLE ROUTING section instructs
running `node src/runner/dispatch.mjs decide <safe-executor-id>
--has-live-task-access` before dispatch. `claude-bwrap`/`agy-bwrap` (P00.1's
own descriptive labels for `claude`/`agy` wrapped in a hand-built `bwrap`
invocation) were never registered as real `.fgos/config.json` executors —
P00.1's own probes invoked `bwrap` directly, bypassing the dispatch/config
system entirely. Confirmed by reading `src/runner/dispatch/mechanism.mjs`:
`decideExecutorDispatchMechanism` returns a generic `{"mechanism":"out-of-process","configured":false}`
fallback for ANY unrecognized executor id — this is not a validation that
the bwrap mechanism exists or is safe, it is the same answer an unrelated
typo would get. Calling `dispatch.mjs execute claude-bwrap ...` would
silently resolve to whatever `runner.executor`'s own default is (plain
`claude`, unconfined) rather than refusing or actually invoking `bwrap`.
**This cell therefore invokes `bwrap` directly, by hand, exactly matching
the invocation P00.1's Red-Team-recheck already live-proved** — `decide` is
still called and its (uninformative) answer recorded per the playbook's own
instruction, but the actual confinement mechanism is the direct `bwrap`
command, never `dispatch.mjs execute` with a fake executor id. Flagged as a
finding for Phase 02's capability-fit audit: either register these as real
executors, or correct the playbook's own ROLE ROUTING text.
