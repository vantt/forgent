# Plan: discover-loop skill (tsk-3go)

Decisions this plan honors: `docs/history/discover-loop/CONTEXT.md` D1-D9.

## Mode: small

Flag count: 0 of {auth, authorization, data model, audit/security, external
systems, public contracts, cross-platform, existing covered behavior, weak
proof, multi-domain}. No new work-item schema field, no modification to any
existing verb/skill's behavior (purely additive), no external service, no
auth/audit surface. `CONTEXT.md`'s 9 decisions leave no material gray area
— the only things left are implementation-detail choices (function/file
shape), which is exactly what `small` mode covers directly rather than
escalating to `standard`. Matches the item's own declared `tier: light`.

No split: this is one honest piece of work (a pure state-query function
plus two prose skill files that call it) — not multiple independently
workable items. `fgos graph --json` confirms `tsk-3go` has no deps and no
children, and there is nothing here to fan out into child items per D-ID;
skipped `--what-if` accordingly (nothing to compare against).

## Approach

**Files, in dependency order:**

1. `src/state/discover-pool.mjs` (new) — exports
   `pickNextDiscoverItem(view)`:
   - Filters `view.work` to `status === 'todo'` and `stage` in
     `{'clarify', 'decompose'}` (mirrors the same `stage`/`status` field
     reads `frontier()` already does, `src/state/frontier.mjs:78-98` —
     same shape, different stage set).
   - If any `stage: 'clarify'` candidates exist, pick among them by D3:
     `blocks` (via `rankImpact`, `src/state/impact.mjs:88` — same function
     `blocksForItem`, `src/intake/discovery.mjs:66-69`, already calls; NOT
     `graph-harness.mjs`, which only calls `rankImpact` internally for its
     own unrelated `mergeReadiness`, corrected at `fgos-coding-validating` time)
     DESC, then `urgent` (truthy first), then declaration order (FIFO) —
     clarify always wins over decompose when both pools are non-empty, per
     the original description's "prioritizing clarify first."
   - Else if any `stage: 'decompose'` candidates exist, pick among them by
     D2: `priority` ASC (`undefined`/`null` last), then FIFO — same
     comparator shape as `compareReadyOrder` (`frontier.mjs:121-133`), new
     copy scoped to this stage set rather than importing
     `compareReadyOrder` itself (that function is coupled to
     `frontier()`'s own Execute-stage filtering, not reusable as-is; a
     shared low-level `priority`-comparator helper is a reasonable
     follow-up but out of scope here — YAGNI, only one caller today).
   - Returns `{ id, stage } | null`. Pure function — no `fs`, no `.fgos/`
     read, mirrors `frontier.mjs`'s own "Pure lib" test convention
     (`test/state/frontier.test.mjs`'s header comment).

2. `plugins/fgOS/skills/discover-next/SKILL.md` (new) — mirrors
   `merge-next`'s shape:
   - Step 1: run an inline `node -e` script (same pattern the gate-bypass
     check in `fgos-coding-exploring`/`fgos-coding-planning` already uses) that imports
     `listWork` (`src/state/store.mjs`) and `pickNextDiscoverItem`
     (piece 1), resolves the main-checkout root the same way every other
     `requiresExistingStore` verb in these skills does (`git rev-parse
     --path-format=absolute --git-common-dir | xargs dirname`), and
     prints the picked `{id, stage}` (or `null`) as its only stdout line.
   - Step 2: if `null` — report "pool empty, nothing to discover" and
     stop (this is `discover-loop`'s own D5(a) stop signal, read from this
     skill's own report, not a separate check).
   - Step 3: else run `fgos discover <id> --dir <root>` (stage `clarify`)
     or `fgos plan <id> --dir <root>` (stage `decompose`) — the
     existing verbs, unchanged (D7/D8: no new verb, no worktree).
   - Step 4: classify and report the result per D5's 3-way split. `fgos
     discover`/`fgos plan` run as a **Bash subprocess**, not a JS
     import — there is no JS `Error` object to inspect here, only the
     process's own exit code and JSON stdout/stderr. Classify by **exit
     code**, per the real CLI contract (`EXIT_CODES`, `src/state/
     store.mjs:65-73`; applied at `bin/fgos.mjs:3160` via
     `categoryOf(err)`):
     - exit `0` — success; read the JSON envelope's `outcome` field
       (`'clear'`/`'pass-through'`/`'decompose'` vs
       `'unclear'`/`'need-human'`) to report cleared/decomposed vs parked
       `awaiting-human` (both normal, not a problem, per D5).
     - exit `7` (`'lock-timeout'`) — the systemic case (D5(b)): stop the
       whole loop.
     - exit `3` (`'conflict'`, per-item CAS) — or any other non-zero exit
       — scoped to this one item: report it as skipped, do not stop the
       loop (D5).
   - Optional (D9, deferred): call `/fgOS:terminal <id>` for herdr-pane
     rename before step 3 — non-blocking, ship without it if it adds
     friction, this is explicitly not required for the core shape.

3. `plugins/fgOS/skills/discover-loop/SKILL.md` (new) — mirrors
   `merge-loop`'s shape almost exactly (same `/loop`-wrapping structure,
   same in-conversation-only state, no backend/file state for the loop
   control itself — D5/D6 don't need one):
   - Invoke the `loop` skill with `prompt: "/fgOS:discover-next"`, no
     fixed interval (self-paced), same rationale `merge-loop` already
     gives (variable per-iteration cost).
   - Track, purely in the running conversation's own context (never
     written to any file): running counts of cleared/decomposed, parked,
     skipped-on-error, plus an iteration counter against the configurable
     cap (default: **15**, matching the earlier 2026-07-31 report's
     cost-based recommendation for a ~49-item real backlog — configurable
     via an explicit loop argument, not hardcoded).
   - After each `/fgOS:discover-next` iteration, read its report and
     decide continue/stop per D5: pool-empty → stop; lock-timeout → stop
     immediately; anything else (cleared, parked, per-item error) →
     increment the matching counter and continue; cap reached → stop.
   - On stop (any reason), print the D6 summary: N cleared/decomposed, N
     parked awaiting-human, N skipped/errored, N remaining if the cap was
     the reason (never on pool-empty/lock-timeout, since remaining is 0 or
     unknown-and-irrelevant there).

**Risk map:** all three pieces are additive (new file, two new skill
directories) — nothing existing changes shape or behavior. No proof point
needed at `fgos-coding-validating` that leans on blast-radius evidence (no
existing code is being modified), so the impact-analysis capability
posture (`full` — `gitnexus` present, confirmed at `fgos-coding-exploring` time)
is recorded here for completeness but not load-bearing for any proof
point in this plan.

## Verify

```
node --test test/state/discover-pool.test.mjs
```

New test file, same "pure lib, literal views, no fs" convention as
`test/state/frontier.test.mjs` — cover: empty pool → `null`; clarify
candidates present → picks by `blocks` DESC then `urgent` then FIFO,
ignoring any `decompose`-stage candidates entirely; only `decompose`
candidates → picks by `priority` ASC (undefined-last) then FIFO;
`status: 'doing'` items excluded from both pools (D4).

The two `SKILL.md` prose files have no automated verify of their own (same
as every other skill in `plugins/fgOS/skills/` — none carry tests); a
manual smoke run of `/fgOS:discover-next` once against real state, and
`/fgOS:discover-loop` for a couple of iterations, is `fgos-coding-validating`'s
job to call for explicitly, not encoded here as a scripted command.

## Assumptions

- The exact default iteration cap (15) is a reasonable starting point
  carried over from the prior report's cost estimate, not re-derived
  fresh here — `fgos-coding-validating` or the person running this can adjust it
  before/after first real use; it's a loop argument, not a hardcoded
  constant baked into `discover-pool.mjs`.
- `blocksForItem`/`rankImpact` computation cost on the current ~253-node
  graph (per `fgos graph --json`'s `nodeCount`) is assumed cheap enough to
  call once per `discover-next` invocation without a caching layer — no
  evidence of it being a bottleneck anywhere else `rankImpact` is already
  called (`merge`'s own ranking), so no new caching is planned.
