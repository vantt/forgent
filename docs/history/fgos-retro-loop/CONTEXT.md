# tsk-3o3: /fgOS:retro-loop — CONTEXT.md

## Feature boundary

Build the retrospective half of the `delivered → retrospective → cleanup
→ done` chain (`work-item-status-delivered-retrospective-cleanup`,
D8/D9/D11), mirroring the shape `tsk-dvc` already established for the
cleanup half:

- `src/state/retro-pool.mjs` — a pure picker (no fs, no `.fgos/` read
  directly — same discipline as `cleanup-pool.mjs`/`discover-pool.mjs`)
  returning the single next item at status `retrospective`.
- `fgOS:retro-next` skill — single item: pick, run `fgos-coding-compounding`
  synthesis on it (settlement/decision/enduser-docs), then
  `fgos move <id> --to cleanup` on success.
- `fgOS:retro-loop` skill — wraps the built-in `/loop` skill around
  `retro-next`, same recursion pattern as `merge-loop`/`discover-loop`/
  `cleanup-loop` (`docs/explanation/why-merge-loop-recurses-into-loop-not-ck-loop.md`).

No CLI/FSM change needed — `fgos retrospective` (the sweep verb) and
`fgos-coding-compounding`'s retarget to status `retrospective` already exist
(`tsk-3wo`, `tsk-1zi`, both `done`).

### Prior scope, superseded

This item originally read "design a batch-trigger threshold (N item / T
time) for when compound-learn synthesis runs" (child of `tsk-4op`,
parked `awaiting-human` on the question "per-domain or global
threshold?"). Retargeted 2026-08-02 at the user's direction: the
question is moot because `fgos retrospective` already sweeps *every*
`delivered` item in one mechanical call with no N/T parameter, and there
is no daemon auto-triggering anything in this system — a trigger is
always a person or a loop invoking a verb explicitly. The parked question
was answered as moot (`fgos answer tsk-3o3`, 2026-08-02) and the item's
title/description rewritten to this scope. The old discovery question
recorded under `view.discovery["tsk-3o3"]` is stale ground, not a live
question — it belongs to the retired scope, not this one.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 (logged via `fgos decision`, 2026-08-02) | `retro-next` calls `fgos retrospective` (the sweep) every iteration, before picking. One `/fgOS:retro-loop` invocation drains `delivered → retrospective → cleanup` end to end — no separate manual sweep step. |

**D1's reasoning**, for the record: `fgos retrospective`
(`bin/fgos.mjs:948-957`) commits one `moveWork` event per item inside its
own loop — each item's `delivered → retrospective` move is its own
CAS-checked, durably-committed event. A sweep interrupted partway (crash,
lock-timeout) is safe: items already swept stay durably at
`retrospective`; items not yet reached stay untouched at `delivered`. No
atomicity requirement, no corruption risk, no meaningful difference
between "sweep everything then process" and "sweep-and-pick one at a
time" — the sweep step itself is cheap and mechanical (no LLM cost)
regardless of how often it's called, unlike `retro-next`'s own synthesis
step. This was live: 24 items sat at `delivered` with 5 at
`retrospective` and 0 at `cleanup` at the time of this session (verified
via `fgos list --all`) — nothing in the codebase currently calls `fgos
retrospective` automatically (`src/cli/command-registry.mjs:194` is its
only registration; grep across `src/bin/test/docs/dogfood-fixture/
.claude/plugins/scripts` found no caller).

## Pinned terms

- **status `retrospective`** — a work-item **status** value (the FSM
  dimension `delivered/retrospective/cleanup/done/...`), *not* a stage.
  Do not confuse with the retired **stage** `compound-learn` (see below).
  `tsk-3o3` itself has both a `stage` (`clarify`, independent workflow
  dimension) and a `status` (`doing`) — the loop being built processes
  items by their **status**, unrelated to `tsk-3o3`'s own stage/status.
- **sweep** — the mechanical, no-LLM-cost `delivered → retrospective`
  batch move performed by `fgos retrospective`. Distinct from
  **synthesis** (fgos-coding-compounding's real work: settlement/decision/
  enduser-docs), which is the expensive, per-item, LLM-judgment step.

## Scout evidence

- `bin/fgos.mjs:935-957` — `case 'retrospective'`: the sweep verb, D9.
  Comment explicitly states the *synthesis itself* is "a session's own
  separate work while an item sits at `retrospective`" — i.e. exactly
  what `retro-next` is meant to be.
- `bin/fgos.mjs:959-978+` — `case 'cleanup'`: the harness-gated
  `cleanup → done` edge, D8, reused as-is; `retro-next`'s job ends at
  `fgos move <id> --to cleanup`, never touching this harness.
- `src/state/cleanup-pool.mjs` — pure-picker template for the new
  `retro-pool.mjs` (`pickNextCleanupItem` shape: filter by status,
  return `{id}` or `null`).
- `plugins/fgOS/skills/cleanup-next/SKILL.md` +
  `plugins/fgOS/skills/cleanup-loop/SKILL.md` — direct shape template:
  pick → run verb → classify exit code → loop with pool-empty/
  lock-timeout stop rules. **Caveat**: cleanup-loop's own per-item step
  is *purely mechanical* (a deterministic TTL/content/merge check) and
  therefore has no iteration cap (D3 in `docs/history/fgos-cleanup-loop/
  CONTEXT.md`). `retro-next`'s own per-item step (`fgos-coding-compounding`) is
  *not* mechanical — it is real LLM judgment, same cost profile as
  `discover-next`'s `fgos discover`/`fgos plan` calls.
- `plugins/fgOS/skills/discover-next/SKILL.md` +
  `plugins/fgOS/skills/discover-loop/SKILL.md` — the LLM-cost-loop
  precedent: `discover-loop` caps at 15 iterations specifically because
  each iteration carries real judgment cost, unlike `cleanup-loop`. Given
  `retro-next` also carries real per-item LLM cost (`fgos-coding-compounding`),
  `retro-loop`'s stop rules likely need to follow `discover-loop`'s
  shape (pool-empty / lock-timeout / iteration cap) rather than
  `cleanup-loop`'s (pool-empty / lock-timeout only, no cap) — left as an
  implementation judgment for `fgos-coding-planning`, not locked here (it
  doesn't change the item's own scope or acceptance criteria, only the
  loop skill's internal tuning).
- `.claude/skills/fgos-coding-compounding/SKILL.md` — **stale**: frontmatter and
  step 1 still describe the trigger as "a claimed item's stage reads
  `compound-learn`" and "this step only runs once the item is already at
  stage `compound-learn`". Per `src/state/workflow-stage-graphs.mjs:25-28,
  48-49,80-81`, that stage is retired (D11) and the trigger is now status
  `retrospective`, "driven by the retrospective loop" (i.e. by the very
  skill this item builds) — the doc text was never updated when `tsk-1zi`
  ("Retire compound-learn stage; retarget fgos-coding-compounding skill to
  retrospective status", `done`) landed. `retro-next` is the first real
  caller of `fgos-coding-compounding` under the new trigger, so fixing this
  skill doc's trigger description belongs in this item's own
  implementation scope (it directly wires into it) — deferred to
  `fgos-coding-planning`, not asked here per this skill's own rule (implementer
  concern, not a product decision).
- `fgos tool query --capability impact-analysis --status present` →
  GitNexus registered and `present`. Per `CLAUDE.md`'s capability gate:
  **full** — impact-analysis MUST run before editing any symbol during
  implementation (`fgos-coding-compounding`'s own symbol, any FSM/CLI touch,
  etc.), and HIGH/CRITICAL blast radius must be reported before
  proceeding.

## Canonical references

- `docs/history/work-item-status-delivered-retrospective-cleanup/` — the
  parent feature's own decision record (D5, D7, D8, D9, D11).
- `docs/history/fgos-cleanup-loop/CONTEXT.md` — the cleanup-loop sibling
  this item mirrors; also the precedent for "CLI verb/naming for this
  loop left to the implementer."
- `docs/explanation/why-merge-loop-recurses-into-loop-not-ck-loop.md` —
  why this recurses into `/loop`, never `ck-loop`.

## Outstanding, deferred to planning (implementer-level, not product)

- Exact naming for the new picker/skills (`retro-pool.mjs` vs
  `retrospective-pool.mjs`, `retro-next` vs `retrospective-next`) — left
  to the implementer, same precedent `cleanup-loop` set.
- Whether `retro-loop` needs an iteration cap (discover-loop shape) —
  scout evidence above strongly suggests yes, final number left to
  planning.
- Whether to fix `fgos-coding-compounding`'s stale stage-based trigger wording
  as part of this item's implementation — scout evidence says it's in
  scope; planning confirms.
