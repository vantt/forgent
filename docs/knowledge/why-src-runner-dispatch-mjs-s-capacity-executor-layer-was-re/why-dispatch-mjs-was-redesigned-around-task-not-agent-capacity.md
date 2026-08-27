---
type: explanation
title: Why dispatch.mjs was redesigned around task, not agent capacity
tags: [dispatch, executor, capacity, task-dispatch-unification]
source_capture_ids: [tsk-5tm-1, tsk-5tm-2, tsk-5tm-3, tsk-5tm-4, tsk-5tm-5, tsk-5tm-6, tsk-2y4, tsk-5tm, tsk-5er, tsk-1qn, tsk-2te]
authoritative_for: why src/runner/dispatch.mjs's capacity/executor layer was redesigned around "task" as the unifying concept, and the 12 locked decisions behind that redesign
framework: diataxis
mode: explanation
---
# Why `dispatch.mjs` was redesigned around "task," not agent capacity

`tsk-5tm` (parent). Full design: `docs/history/task-dispatch-unification/CONTEXT.md`.
This is the design underlying `dispatch.mjs decide`/`execute` and
`AGENTS.md`'s own Dispatch section — the mechanism every coding-domain
skill in this repo (`fgos-coding-implement`, `fgos-researching`,
`fgos-fanout`) is required to consult before firing an Agent/Task tool.

## D1 landed (`tsk-5tm-1`): the `needs` field was 100% dead data

`dispatch.mjs`'s gate only ran the `needs` check when
`kind !== 'task'` — but 2 of the 3 real registered capacity entries were
already `kind: "task"`, so the check never actually fired for them,
making `needs` dead configuration carrying no real signal for the
overwhelming majority of real entries. **Fix**: retire the `needs` field
from both `capacities.<id>` config shape and the dispatch gate itself.

## The other 11 locked decisions

- **D2 — name it "executor," never "backend."** Matches what already
  existed: `resolveExecutorConfig`/`EXECUTOR_ADAPTERS`, ADR0042, and
  marketing-cockpit's own `executor-registry.yaml` precedent.
- **D3 — `for` and `needs` are two orthogonal axes: JOB vs. MECHANISM.**
  `for` is the purpose-lookup (what job is being dispatched); `needs` —
  as a *concept*, even after its field is retired by D1 — is which
  mechanism must be present to serve it.
- **D4 — generalize dispatch around "task,"** widening `tsk-3ik` D3's
  already-locked scope. Flow B (`capacityIdForWork`) had already done
  half of this; `fgos-fanout` still hardcoded the `Agent` tool directly
  instead of consulting the shared decision protocol. Landed
  (`tsk-5tm-6`): `fgos-fanout` now calls `decide --work <id>` before
  firing an Agent for each candidate — the `decideExecutorCli`'s `--work`
  door (resolving a work item's own dispatch executor via
  `executorIdForWork`, the exact lookup `spawnWorker` already uses
  internally) built specifically for this consumer.
- **D5 — `dispatch.mjs` must self-execute for the adapter-resolvable
  case,** matching marketing-cockpit's own `run_task()` contract. Before
  this, Flow A (`resolveCapacityCli`) always handed back a bare
  `{command, args}` for the caller to run itself via Bash — even for
  cases the dispatch layer could perfectly well execute directly. This
  is the `execute` CLI subcommand's own origin
  (`src/runner/dispatch/cli.mjs`'s `executeExecutorCli`). Landed
  (`tsk-5tm-3`): `node src/runner/dispatch.mjs execute <executorId>` —
  the exact subcommand `_shared/executor-dispatch-fallback.md`'s Step B
  and this repo's own coding-domain skills now call for the
  `out-of-process` branch of `decide`, self-executing via
  `EXECUTOR_ADAPTERS` instead of handing `{command, args}` back to the
  caller.
- **D6 — delete the `gather` capacity from `.fgos/config.json`.** It was
  the only cross-provider (agy/Gemini) dispatch path with no remaining
  architectural reason to exist — its own originating item's plan.md had
  literally recorded "not decided" for why it needed to stay, and the
  parallelization reason it once served is now met natively. Landed
  (`tsk-5tm-2`): the capacity entry, its tool-registry entry, and every
  dead reference to it were removed together. A stale test
  (`test/runner/dispatch.test.mjs`) that still asserted `capacities.gather`
  must exist was missed in that same pass — confirmed pre-existing and
  unrelated to any other work via a `git stash` reproduction against the
  base commit. **Fix** (`tsk-2y4`): the test was updated to assert
  `gather`'s removal instead of restored — this repo's own in-flight
  redesign (this same `tsk-5tm` family) was never expected to bring back
  an equivalent capacity, so waiting for one was never the right call.
- **D7 — defer writing the dispatch contract into `AGENTS.md`** until D5
  (`execute`) and its `--work` CLI flag actually ship. `AGENTS.md` is
  always-loaded context; documenting a command before it exists would
  point every reader at something that doesn't work yet. Landed
  (`tsk-2te`), once the deferral condition was satisfied: `AGENTS.md`'s
  own "Dispatch — routing work to a executor" section — the same section
  that gates every Agent/Task-tool call in this repo via a `PreToolUse`
  hook — is this item's own deliverable.
- **D8 — rename "ad-hoc packet" to "ad-hoc task"** in the shared
  vocabulary. Matches what it actually is (an agent composing its own
  prompt that needs dispatching); "work" collides with the lifecycle
  concept a real work item already owns. The id shape
  (`<scope>#p<n>`, deliberately invalid against `ID_PATTERN`) is
  unchanged — see
  `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-executor.md`
  and the `_shared/executor-dispatch-fallback.md` fragment every skill's
  own dispatch step points to. Found unimplemented in 3 files (plus 2
  plugin mirrors) by `tsk-5tm`'s own post-merge review pass — unlike D7
  (deliberately deferred), D8 had no documented deferral, so this was a
  genuine miss. **Fix** (`tsk-5er`): the rename applied across all 5
  files — pure vocabulary/doc change, zero runtime impact.
- **D9 — model/tier resolution moves from one flat map to N-maps per
  provider,** widening the tier vocabulary from 3 to 5 and adding
  `rigorOverrides`. `modelForTier` previously only ever read Claude model
  names — a non-Claude executor (agy/Gemini) silently received the wrong
  model name instead of throwing. Landed (`tsk-5tm-5`): model/tier
  resolution moved to provider-keyed `modelPolicies` (visible in this
  repo's own `.fgos/config.json`, e.g. `modelPolicies.gemini.lightweight`),
  widened to the 5-tier vocabulary, with `rigorOverrides` — the exact
  mechanism the `fgos-coding-implement` capability's own config entry
  uses to pin `agy` to a specific Gemini model regardless of
  `executors.agy`'s own defaults.
- **D10 — the `judge-discovery`/`judge-decompose` `for: "judge"`
  collision is harmless and needed no fix** to
  `resolveCapacityIdForPurpose`. Investigation found the real bug behind
  two related items was unrelated to `for`/purpose-lookup at all — it was
  confusion between `runner.executors.judge` and a completely different
  tier mechanism.
- **D11 — the new registry shape keeps the top-level `capacities` key
  name, never renames it to `executors`.** `dispatch.mjs`'s own
  validation only allows *tier* names as keys under `cfg.executors` — a
  key named after an executor there would be rejected outright by a
  `RunnerConfigError`. Landed (`tsk-5tm-4`): each `runner.executors.<id>`
  entry restructured to carry an `invocations: [{via, adapter, command,
  args}]` array (visible in this repo's own `.fgos/config.json` today,
  e.g. the `claude`/`agy` executors' `via: "cli"` entries) — the concrete
  shape D2's "executor, not backend" naming and D9's per-executor
  model/tier resolution both build on.
- **D12 — the shared dispatch-fallback prose helper stays one document,
  not split into separate D-IDs per sub-part**: (i) a fragment
  extracting D5's own three-step consequence; (ii) purpose-lookup via
  `--for` already worked and only needed documentation; (iii) the
  `--work <id>` direction (exporting `capacityIdForWork` plus a new CLI
  flag) had already survived three-plus rounds of review with no
  reversal.

## Independent post-merge verification (`tsk-1qn`): no bug found

A dedicated review pass re-checked every one of D1-D12 against the code
that actually shipped (`mergedSha e774207b`) — line-by-line, not
assumed: D1's `needs` retirement confirmed via a live config carrying no
`needs` key; D9's `modelPolicies` resolution traced through
`modelForTier`'s real code path; D6's `gather` removal confirmed via a
zero-match grep across both `dispatch.mjs` and the committed config; D7's
deferral of the dispatch contract out of `AGENTS.md` confirmed still
honored. **Result: no bug found** — every decision matched the shipped
code exactly, and `npm test` (3338 tests, 3333 pass, 5 skipped) was
confirmed green twice, once before and once after the review pass with
no code changes between them. `tsk-5tm`'s own pre-merge friction (two
blocked merge attempts) had already been resolved by fix-up commits that
were already part of the merged sha by the time this review ran — this
item's own diff is documentation-only.

## Why this matters beyond forgentX's own dispatch code

This is the mechanism `AGENTS.md`'s Dispatch section enforces on every
coding-domain skill via a `PreToolUse` hook — the same `decide`
(`in-process`/`out-of-process`/`unavailable`) three-way branch this
repo's own skills (and any project using fgOS as its platform layer)
must consult before firing an Agent/Task tool, rather than assuming
native dispatch by default.
