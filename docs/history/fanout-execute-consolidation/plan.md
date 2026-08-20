# fanout-execute-consolidation — plan.md

Mode: standard

3 flags counted (`fgos-routing`'s own Mode gate): **public contracts**
(`dispatch.mjs execute`'s CLI surface is documented/cited by
`../_shared/executor-dispatch-fallback.md`; this item extends it with a
new `fanout-batch` subcommand and extends `fgos schedule` with a new
`--candidates` flag — both additive/backward-compatible, but still real
contract surface), **existing covered behavior** (`dispatch/cli.mjs` and
`bin/fgos.mjs`'s `schedule` case both have real test coverage,
`test/runner/dispatch.test.mjs` + the schedule verb's own tests), and
**weak proof around the area** (impact-analysis posture is `degraded` —
GitNexus registered but its index is stale relative to current HEAD, per
CONTEXT.md's own scout evidence; blast-radius claims below are
grep/direct-read-based, not graph-based). Not `high-risk`: no hard-gate
flag (auth/data-loss/audit-security/external-provider/removing-validation)
applies — this is CLI/skill-prose mechanics, not those. No `fgos graph
--json` critical-path ordering applies — this item is a standalone node,
no `deps`.

## Approach

**Chosen path** (honors D1/D2/D4/D6, CONTEXT.md):

1. **Extend `fgos schedule` with `--candidates <id,id,...>`**
   (`bin/fgos.mjs`'s `schedule` case, `src/state/store.mjs`'s
   `computedSchedule`, `src/state/graph-metrics.mjs`'s `computeSchedule`
   already accepts a second `candidateIds` param — confirmed by direct
   read, no new algorithm). When given, thread the parsed id list down to
   `computeSchedule(view, candidateIds)`; omitted keeps today's whole-
   frontier behavior byte-identical (every existing caller of `fgos
   schedule` passes no such flag).

2. **Add `dispatch.mjs fanout-batch <id,id,...>` — new CLI subcommand**
   (`src/runner/dispatch/cli.mjs`'s `runDispatchCli`, alongside
   `execute`/`decide`/`log`). Per D2, gathers both the out-of-process
   chain AND the slot-poll/trim-batch logic into one call:
   - Read `fgos slots --json` once (reuse `hasWorkerSlotRoom`/
     `countWorkerSlots`, `src/state/worker-slots.mjs`, already pure/
     tested — call them directly, not via a nested CLI shell-out).
   - `hasRoom: false` → return immediately `{fired: [], deferred: <all
     candidates>, slotsFull: true}`. No internal wait/retry — per D2's
     own rationale in CONTEXT.md, pacing across multiple calls stays the
     skill's own outer loop (unchanged Step 6 "go back to Step 1"), so
     this verb stays a single fast/testable call, never a multi-minute
     internal poll.
   - Trim to `execution.free` when a real number (reuse the same
     `min(batch.length, execution.free)` shape `wave-dispatch-
     mechanics.md` already documents).
   - For each trimmed candidate, serially: `decideExecutorDispatchMechanism`
     (reuse in-process, not a nested `node dispatch.mjs decide` shell-out)
     to reconfirm still out-of-process (guards the race window between
     the skill's earlier `decide --work` consult and this call actually
     running) → `fgos pick` (needs the real `pick` verb — call through
     the same CLI-invocation shape `dispatch/cli.mjs` already uses
     elsewhere for cross-module calls, since `pick` lives in
     `store.mjs`/`bin/fgos.mjs`'s own territory, not `dispatch`'s) →
     `executeExecutorCli` (in-process function call, not a nested shell-
     out — this module already owns it) → on success, `fgos return`.
   - Collect per-candidate outcome: `fired` (status/errorClass),
     `mechanismChanged` (decide flipped since the skill's earlier
     consult), `unavailable`, or `error` (pick/execute/return threw).
     Return `{fired: [...], mechanismChanged: [...], unavailable: [...],
     deferred: [...]}`.

3. **Rewrite `references/wave-dispatch-mechanics.md`** (3 mirrors:
   `.agents/skills/fgos-fanout/`, `.claude/skills/fgos-fanout/`,
   `plugins/fgOS/skills/fgos-fanout/`, byte-identical per this repo's own
   mirroring convention) — Step 2/3 collapse to 2 calls: `fgos schedule
   --candidates <...>` then `dispatch.mjs fanout-batch <...>`. Step 5
   (gather + risk-keyword approve, per D3) stays prose, unchanged in
   substance — only the input it now reads is the batch verb's own JSON
   instead of state it tracked by hand. `fgos-fanout/SKILL.md`'s own
   high-level Workflow section (Step 2/3, prose summary) updated to match;
   its "Known hazard" section gets D5's one-line note that this item's
   change never touched or improved that hazard.

**Alternatives rejected:**
- A standalone Node orchestration script file. Rejected per D6 — would
  reverse `tsk-4bq`'s own explicit "no embedded scripts, CLI-call prose
  only" convention; a subcommand on the already-existing `dispatch.mjs`
  CLI (already invoked via CLI-call prose) does not.
- Folding the risk-keyword approve check into `fanout-batch`'s own
  return shape. Rejected per D3 — keeps that safety gate visible in skill
  prose, auditable, not hidden inside a verb's own internal logic.
- Making `fanout-batch` internally wait/retry on a full slot lane (like
  `wave-dispatch-mechanics.md`'s current "wait ~60s, re-ask, stop after
  10 refusals" loop). Rejected — that pacing genuinely belongs to the
  caller polling repeatedly over TIME, not a single verb call's own
  internal logic; keeping the verb non-blocking/fast is also what makes
  it cheaply unit-testable (no timers to fake).

**Risk map:**

| Component | Risk | What proves it |
|---|---|---|
| `fgos schedule --candidates` (`bin/fgos.mjs`, `store.mjs`, `graph-metrics.mjs`) | light | Purely additive optional flag; every existing caller (no `--candidates`) byte-identical. `computeSchedule(view, candidateIds)` already accepts this exact param — confirmed by direct read (`src/state/graph-metrics.mjs:747`), no new algorithm. New test asserts the scoped case returns only the requested candidates' wave. |
| `dispatch.mjs fanout-batch` (`src/runner/dispatch/cli.mjs`) | standard | New subcommand, real control flow (slot-check, trim, per-candidate pick/decide-recheck/execute/return). `test/runner/dispatch.test.mjs`'s existing fake-executor fixtures (`writeEchoExecutor` et al.) extend directly — no real agent CLI needed to test it, same pattern the rest of that file already uses. |
| `wave-dispatch-mechanics.md` rewrite (3 mirrors) + `fgos-fanout/SKILL.md` prose update | standard | Prose + bash-shape change, no new runtime module in the skill itself. Per `docs/how-to/write-verify-for-a-skill-prose-change.md`, `npm test` alone proves nothing here — the POSITIVE/NEGATIVE grep pair below is the real proof; a live disposable-candidate fanout run (real `fgos-fanout` invocation) is the honest end-to-end rehearsal, same as `tsk-4bq`'s own risk-map entry for this exact file recommended. |

**Impact-analysis posture:** `degraded` — GitNexus registered
(`present`) but stale (index older than current HEAD, confirmed live this
session via `fgos tool query`). Blast-radius claims above (small,
contained caller sets for `computeSchedule`/`hasWorkerSlotRoom`/
`executeExecutorCli`) are grep/direct-read-based, not graph-based —
weaker than a fresh GitNexus query, per CLAUDE.md's own three-way
framing. `fgos-coding-validating`'s feasibility matrix should treat this
row as real but weaker evidence.

**Files likely touched, in order** (no critical-path ordering applies —
standalone node):
1. `src/state/graph-metrics.mjs` — confirm `computeSchedule`'s existing
   `candidateIds` param needs no change (read-only verification, not an
   edit — the param already exists).
2. `bin/fgos.mjs` (`schedule` case) + `src/state/store.mjs`
   (`computedSchedule`) — thread `--candidates` through.
3. `src/runner/dispatch/cli.mjs` (new `fanout-batch` subcommand) +
   `src/runner/dispatch.mjs` (barrel re-export, if the new function needs
   a named export beyond the CLI subcommand itself).
4. `test/runner/dispatch.test.mjs` — new coverage for `fanout-batch`
   (slot-full case, trim case, mechanism-changed case, fire-success case)
   + a new/extended test for `fgos schedule --candidates`.
5. `.agents/skills/fgos-fanout/SKILL.md` +
   `.agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md`
   (the real source, per this repo's own skill-mirroring convention).
6. `.claude/skills/fgos-fanout/references/wave-dispatch-mechanics.md` +
   `plugins/fgOS/skills/fgos-fanout/references/wave-dispatch-mechanics.md`
   (kept byte-identical to the `.agents/` source — `.claude/skills/...
   /SKILL.md` itself is a generated thin wrapper, `npm run build:skills`
   regenerates it if the frontmatter/description needs a matching edit).

## Shape

Concrete cases worth proving against, at `standard`-mode depth:

- **Slots full**: `fanout-batch` called while `hasRoom: false` — returns
  immediately with every candidate in `deferred`, `slotsFull: true`, no
  claim attempted on any of them.
- **Trim**: `execution.free` smaller than the candidate list — only that
  many fire, the rest land in `deferred`, none of the trimmed-off
  candidates get claimed.
- **Mechanism changed mid-flight**: a candidate resolved `out-of-process`
  by the skill's earlier `decide --work` consult, but by the time
  `fanout-batch` re-checks it, resolves differently (e.g. executor config
  changed) — lands in `mechanismChanged`, never claimed blind.
- **A candidate's `execute` fails** (non-zero exit, timeout, spawn-fail):
  lands in `fired` with its real `status`/`errorClass`, never treated as
  a whole-batch failure — siblings still complete independently.
- **All-native batch** (today's only working case for the in-process
  branch): unaffected, byte-for-byte — `fanout-batch` is never called at
  all when every candidate in a wave resolves `in-process`.
- **Mixed batch**: some candidates `in-process` (skill fires natively,
  unchanged), some `out-of-process` (skill calls `fanout-batch` once for
  that subset) — both proceed independently within the same iteration.
- **`fgos schedule --candidates` with an empty/single-id list**: degrades
  cleanly (empty candidate set → empty wave; single id → a wave of one),
  never a crash on the boundary.

**Pass-through, no split** — this is one honest piece of work per D1-D6:
2 new CLI surfaces (co-located in `dispatch.mjs`/`bin/fgos.mjs`, both
mechanical extensions of existing verbs) plus one prose rewrite that
depends on both existing first, so `wave-dispatch-mechanics.md` is
written once, not twice for two separate halves. Splitting would force
either an artificial ordering dependency or a temporary broken state
where the skill references a verb that does not exist yet.

## Verify

```
npm test && grep -q "case 'fanout-batch'" src/runner/dispatch/cli.mjs && grep -q -- "--candidates" bin/fgos.mjs && grep -q "fanout-batch" .agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md && grep -q "fanout-batch" .claude/skills/fgos-fanout/references/wave-dispatch-mechanics.md && grep -q "fanout-batch" plugins/fgOS/skills/fgos-fanout/references/wave-dispatch-mechanics.md && ! grep -q "JSON.parse(process.argv\[1\]).worktreePath" .agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md
```

POSITIVE: `npm test` proves the new code paths behave correctly under
real unit tests; the three `fanout-batch` greps prove the verb exists in
code AND that all 3 skill mirrors were actually rewritten to reference
it, not just the canonical source. NEGATIVE: the old raw
`JSON.parse(process.argv[1]).worktreePath` pattern (today's line 91 of
`wave-dispatch-mechanics.md`, the exact hand-rolled worktree-path
extraction this item replaces) must be gone from the canonical source —
proves the old multi-step shape was actually removed, not left dangling
alongside the new one.

## Outstanding questions

None
