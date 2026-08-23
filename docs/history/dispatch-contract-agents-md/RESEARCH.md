# Research log — tsk-2te

## Round 1 — 2026-08-15 (discovery stage)

**Asked:** tsk-2te's text is "tìm cách ứng dụng cơ chế dispatch mới được
triển khai bởi tsk-5tm" (find ways to apply the new dispatch mechanism
tsk-5tm implemented). Two independent branches: (a) what is the current
adoption state of the mechanism across fgOS's own producers (has every
skill that used to hand-roll dispatch logic switched to the new shared
path, or is a producer still duplicating it), and (b) is there a named,
deferred piece of work from tsk-5tm's own decision log that is now
unblocked and still outstanding.

**Checked:**
- `fgos show tsk-5tm --json` / `fgos list --json` — full decision log
  (D1–D12) and 6-child decomposition, all `delivered`/`retrospective`.
- `docs/history/task-dispatch-unification/plan.md` — confirms the shipped
  CLI surface is a 3-part contract: `decide` / `execute` / `--work`.
- `src/runner/dispatch.mjs` (grep for subcommand dispatch) — `execute`
  (line 1673) and `decide --work` (line 1690/1694) both present in the
  live subcommand switch.
- `AGENTS.md` — grep for "dispatch" (case-insensitive): zero matches.
- `.agents/skills/**/SKILL.md` — grep for
  `dispatch.mjs|decideCapacityCli|capacityIdForWork|resolveCapacityCli|EXECUTOR_ADAPTERS`:
  hits in `fgos-fanout` (already calls `dispatch.mjs decide --work <id>`,
  lines 111/262) and `fgos-coding-exploring`.
- `.agents/skills/**` — grep for `capacity-dispatch-fallback` (the shared
  prose helper D12 asked for): consulted by `fgos-coding-validating`,
  `fgos-fanout`, `fgos-coding-planning`, `fgos-coding-exploring`,
  `fgos-coding-implement`, `fgos-researching` (both `.claude/skills/` and
  `.agents/skills/` mirrors) — 6 producers already wired through the one
  shared fragment.
- `src/runner/loop.mjs` — `import { spawnWorker, modelForTier } from
  './dispatch.mjs'` (line 79): the runner itself already consumes the
  redesigned module directly, no separate hand-rolled path.
- `src/config/global-config.mjs`, `bin/fgos.mjs`, `bin/fgos-runner.mjs` —
  grepped for `capacit`, no hits; not independent dispatch producers.
- `docs/how-to/reuse-the-shared-capacity-dispatch-fallback-fragment.md` —
  an existing producer-facing how-to for wiring a *new* skill through the
  fragment; already mentions `tsk-5tm-3 D5`'s `execute` simplification.
  This is a different document from the one tsk-5tm D7 deferred.

**Found:**
- Adoption across fgOS's own in-repo producers is already broad and
  consistent: every stage-skill that dispatches to a capacity
  (`fgos-coding-exploring`/`-planning`/`-validating`/`-implement`,
  `fgos-researching`, `fgos-fanout`) goes through the one shared fragment
  `_shared/capacity-dispatch-fallback.md`, and the runner
  (`src/runner/loop.mjs`) imports `dispatch.mjs` directly. No producer
  found still hand-rolling its own capacity/executor resolution outside
  this set.
- tsk-5tm's own decision **D7** (`fgos show tsk-5tm --json`, `decisions[]`)
  explicitly deferred writing the dispatch contract into `AGENTS.md`
  "cho tới khi D5 (execute subcommand) và --work CLI flag ... đã ship" —
  precisely so AGENTS.md (an always-loaded doc every agent acts on
  immediately) never points at commands that don't exist yet.
- Both preconditions are now confirmed shipped and merged: `execute`
  subcommand (tsk-5tm-3, `retrospective`) and `decide --work <id>` /
  exported `capacityIdForWork` (tsk-5tm-6, `retrospective`) are both live
  in `src/runner/dispatch.mjs` on `main`.
- `AGENTS.md` currently has **zero** mentions of `dispatch` — the deferred
  write from D7 was never done. This is the one concrete, well-scoped,
  currently-unblocked application of tsk-5tm's mechanism: give AGENTS.md
  (the always-loaded contract every session in this repo reads) its own
  short dispatch-doctrine section — what `dispatch.mjs`'s `decide`/
  `execute`/`--work` surface is, and a pointer to
  `_shared/capacity-dispatch-fallback.md` for any new skill wiring a
  dispatch step — instead of leaving the doctrine locked inside
  `docs/history/task-dispatch-unification/` and scattered per-skill
  fragments only.
- The candidate false lead `docs/explanation/why-fgos-dispatch-splits-
  into-gather-packets-and-a-gated-exec-packet.md` was checked and ruled
  out: its "gather packet" is an ad-hoc-task *shape* (tsk-2t6, B1 vs B2
  split), unrelated to the retired `gather`-purpose *capacity*
  (tsk-5tm-2 D6) despite the shared word — not stale, no action needed.

**Verdict:** clear. The goal ("find ways to apply the new mechanism") has
one concrete, evidence-grounded answer: write the AGENTS.md dispatch
contract section that tsk-5tm D7 deliberately deferred, now that its own
stated precondition has shipped. Proposed verify: `AGENTS.md` references
both the `dispatch.mjs` CLI surface and the shared fragment, i.e.
`grep -q "dispatch.mjs" AGENTS.md && grep -q "capacity-dispatch-fallback" AGENTS.md`.
