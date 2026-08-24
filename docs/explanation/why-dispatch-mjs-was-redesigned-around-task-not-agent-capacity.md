---
type: explanation
title: Why dispatch.mjs was redesigned around task, not agent capacity
tags: [dispatch, executor, capacity, task-dispatch-unification]
source_capture_ids: [tsk-5tm-1, tsk-5tm-2]
authoritative_for: why src/runner/dispatch.mjs's capacity/executor layer was redesigned around "task" as the unifying concept, and the 12 locked decisions behind that redesign
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
  instead of consulting the shared decision protocol.
- **D5 — `dispatch.mjs` must self-execute for the adapter-resolvable
  case,** matching marketing-cockpit's own `run_task()` contract. Before
  this, Flow A (`resolveCapacityCli`) always handed back a bare
  `{command, args}` for the caller to run itself via Bash — even for
  cases the dispatch layer could perfectly well execute directly. This
  is the `execute` CLI subcommand's own origin
  (`src/runner/dispatch/cli.mjs`'s `executeExecutorCli`).
- **D6 — delete the `gather` capacity from `.fgos/config.json`.** It was
  the only cross-provider (agy/Gemini) dispatch path with no remaining
  architectural reason to exist — its own originating item's plan.md had
  literally recorded "not decided" for why it needed to stay, and the
  parallelization reason it once served is now met natively. Landed
  (`tsk-5tm-2`): the capacity entry, its tool-registry entry, and every
  dead reference to it were removed together.
- **D7 — defer writing the dispatch contract into `AGENTS.md`** until D5
  (`execute`) and its `--work` CLI flag actually ship. `AGENTS.md` is
  always-loaded context; documenting a command before it exists would
  point every reader at something that doesn't work yet.
- **D8 — rename "ad-hoc packet" to "ad-hoc task"** in the shared
  vocabulary. Matches what it actually is (an agent composing its own
  prompt that needs dispatching); "work" collides with the lifecycle
  concept a real work item already owns. The id shape
  (`<scope>#p<n>`, deliberately invalid against `ID_PATTERN`) is
  unchanged — see
  `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-executor.md`
  and the `_shared/executor-dispatch-fallback.md` fragment every skill's
  own dispatch step points to.
- **D9 — model/tier resolution moves from one flat map to N-maps per
  provider,** widening the tier vocabulary from 3 to 5 and adding
  `rigorOverrides`. `modelForTier` previously only ever read Claude model
  names — a non-Claude executor (agy/Gemini) silently received the wrong
  model name instead of throwing.
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
  `RunnerConfigError`.
- **D12 — the shared dispatch-fallback prose helper stays one document,
  not split into separate D-IDs per sub-part**: (i) a fragment
  extracting D5's own three-step consequence; (ii) purpose-lookup via
  `--for` already worked and only needed documentation; (iii) the
  `--work <id>` direction (exporting `capacityIdForWork` plus a new CLI
  flag) had already survived three-plus rounds of review with no
  reversal.

## Why this matters beyond forgentX's own dispatch code

This is the mechanism `AGENTS.md`'s Dispatch section enforces on every
coding-domain skill via a `PreToolUse` hook — the same `decide`
(`in-process`/`out-of-process`/`unavailable`) three-way branch this
repo's own skills (and any project using fgOS as its platform layer)
must consult before firing an Agent/Task tool, rather than assuming
native dispatch by default.
