# agent-executor generalized capacity-dispatch helper (tsk-53h) — locked decisions

## Feature boundary

`fgos-submit-assist`'s classify step (`tsk-5l2`) is the only skill in this
repo wired through the capacity-dispatch mechanism
(`resolveCapacityCli`/`resolveExecutorConfig`, `src/runner/dispatch.mjs`)
today. `tsk-53h`'s scope: extract that one skill's wiring into a
general, reusable pattern (a shared how-to or a small skill-facing helper)
any other in-session skill can follow, instead of re-deriving
`fgos-submit-assist`'s own wiring from scratch each time. This item does
not build a new dispatch mechanism — `tsk-62v` already built that — it
generalizes the *consumer-side* pattern for using it.

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | This item's own dependency now runs on `tsk-3sw` (`tsk-3sw.deps` cleared, `tsk-53h.deps = [tsk-3sw]` — inverted from the original `tsk-3sw depends on tsk-53h`). Reason: `tsk-53h`'s actual deliverable (the shared helper) wraps `resolveCapacityCli`'s return shape — `tsk-3sw` is about to change that shape (kind-resolution default branch simplification, `agentType`/`--agent` flag support). A helper authored against today's shape would need rewriting the moment `tsk-3sw` lands; authoring it after `tsk-3sw` is done means it's written once, against the real final contract. The inverted deps releases `tsk-3sw` to be worked immediately and independently (it no longer needs `tsk-53h` done first) while `tsk-53h`'s own further progress (decompose/planning shape, and definitely the actual helper file) waits on `tsk-3sw` reaching `done`. This wait is not mechanically enforced by the deps graph for THIS session (this item was already claimed/`doing` before the inversion — deps only gate the `todo`→`doing` transition) — it is a discipline this record pins so a later `fgos-coding-planning` pass (or this same session resuming later) does not silently build the helper too early. |
| D2 | Shared-helper format: prefer a single shared skill-facing fragment/reference file that consumer `SKILL.md` files point to by path, over each skill copy-pasting the branching prose into its own `SKILL.md`. Reason: independent copies drift out of sync the next time this pattern's logic changes (DRY) — a single referenced source doesn't. The exact path/filename is left to `fgos-coding-planning` (implementation shaping, not a product decision) — this repo has no existing `_shared`-style skill-fragment convention to follow precedent from (scouted: no `*shared*`/`*_common*` entry under `.claude/skills/` or `.agents/skills/`); the closest external precedent found is a per-skill `references/<skill>-reference.md` pattern (`docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md`), informative but not binding. |
| D3 | Sequencing for THIS session, following from D1: pause `tsk-53h`'s own stage progress here once this record is written, switch to pick and drive `tsk-3sw` to `done`, then resume `tsk-53h`'s `decompose`/`executing` afterward — per explicit user instruction in this item's own driving session. |

## Pinned terms

- **cli-dispatch** / **task-dispatch** — mechanism names (not caller-identity
  names): cli-dispatch is the `resolveCapacityCli`/`spawnWorker` subprocess-
  spawn mechanism, available from any context with Bash; task-dispatch is
  native Agent/Task tool use, available only inside a live Claude Code
  session that actually has that tool granted. Supersedes an earlier
  "domain-1 / domain-2" (caller-identity) framing already renamed
  throughout `src/runner/dispatch.mjs`, its test, and the two capacity
  how-to docs.
- **Capacity** — an `.fgos/config.json`'s `runner.capacities.<id>` entry:
  the config unit this whole mechanism dispatches through (`tsk-62v`).

## Scout evidence

- `rg resolveCapacityCli src bin test docs dogfood-fixture` — only real
  hits: `src/runner/dispatch.mjs` (the function + its doc comment) and
  `test/runner/dispatch.test.mjs` (its own unit tests). Confirms
  `fgos-submit-assist`'s `SKILL.md` (`.claude/skills/fgos-submit-assist/`,
  `.agents/skills/fgos-submit-assist/`) remains the only real consumer —
  the gap this item generalizes is real, not already closed elsewhere.
- `fgos tool query --capability impact-analysis --status present` →
  GitNexus registered and `present` on this machine — impact-analysis
  posture for this item's later `executing` stage is **full**, per
  `CLAUDE.md`'s capability gate.
- `fgos show tsk-3sw` / `fgos show tsk-53h` (before D1) — confirmed the
  literal inverted-deps state described in D1: `tsk-3sw.deps: ["tsk-53h"]`,
  `tsk-53h.deps: []`.
- This item's own `description` field (accumulated across a long prior
  discussion session, not reproduced verbatim here) already carries the
  full evidence trail D1/D2 summarize: the cli-dispatch/task-dispatch
  nesting-rule finding, live-verified `claude --agent`/`agy --agent`/
  Codex `.codex/agents/<name>.toml` evidence (three genuinely different
  per-provider agent-dispatch shapes — no common flag convention to lean
  on), and the shared-helper generalization gap itself. `fgos show tsk-53h`
  is the canonical way to read that full trail; this CONTEXT.md is the
  formal decision record, not a duplicate of it.

## Outstanding, deferred to planning

- Exact file path/name for the shared fragment (D2) — implementation
  shaping, `fgos-coding-planning`'s call once `tsk-3sw`'s shape is real to design
  against.
- Whether `tsk-53h` itself should decompose into two children (a
  design/pattern-record piece buildable now vs. a helper-authoring piece
  formally depending on `tsk-3sw`) instead of pausing as one item (D3) —
  `fgos-coding-planning`'s shaping call, not decided here per this skill's own
  "do not split it into pieces" rule.

## References

- `docs/explanation/agent-executor-capacity-aware-dispatch.md` — why the
  capacity mechanism exists.
- `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-capacity.md`
  — `fgos-submit-assist`'s own real precedent, the one this item
  generalizes from.
- `tsk-3sw` — the dependency this item now waits on (D1).
