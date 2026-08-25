---
authoritative_for: why every Agent/Task-tool dispatch is enforced through a PreToolUse hook that runs dispatch.mjs decide itself, why the hook self-invokes decide instead of tracking whether the caller already did, why --needs-soul exists, why decide reports configured:true|false instead of throwing, why resolve was retired in favor of decide/execute, and why MCP tool access is a hand-back rather than a second client dispatch.mjs opens itself
---

# Why `dispatch decide` is a hard, hook-enforced gate, not a convention

`tsk-5tm` had already written and gotten approval for the final wording of
`AGENTS.md`'s `## Dispatch` section — but approval alone didn't make it
real: the agreed text sat unread inside `docs/history/
task-dispatch-unification/DISCUSSION.md`, and the version actually live in
`AGENTS.md` was a weaker paraphrase with none of `tsk-5tm`'s real
structure. This item is what closed that gap by making "every dispatch
goes through `decide`" a mechanically enforced rule instead of prose
someone has to remember to read.

## The evidence that prose alone doesn't work

> D1: "moi dispatch" la CUONG CHE CUNG (hook chan that), khong phai
> convention/prose

The proof was found live, inside the very session that produced this
item: that session itself fired `Agent(subagent_type: "fork")` to run
impact-analysis without ever calling `decide`, and nothing stopped it —
the same shape of gap `tsk-5tm` D4 had already used as evidence once
before, and the same shape a prior repo precedent had already needed a
hard fix for: `.githooks/pre-commit` blocking a `.fgos/` deletion
(`tsk-56u`) after a warning in prose alone had already failed once.

## Why the hook re-runs `decide` itself instead of checking "did the caller already call it"

> D5: Hook TU chay decide, KHONG kiem tra "agent da goi decide chua"

A "did you already call decide" check would need per-turn state — a
marker, a TTL, matching the right marker to the right Agent call, correct
behavior across concurrent sessions — fragile and prone to false
positives. The hook sidesteps that entire problem: a call to the Agent/Task
tool is, by definition, need-soul plus live-task-access — the exact two
signals `decide` needs — so the hook can call `decide --for <subagent_type>
--needs-soul --has-live-task-access` itself, with certainty, no guessing.
`in-process` passes through; `out-of-process` is refused with guidance to
use `execute` instead.

## Why `--needs-soul` had to be added rather than reusing `--work`

> D2: KHONG de cua thu 4 (--subtask) cho decide; thay bang co --needs-soul
> ap cho cac cua hien co

The natural first idea — reuse `--work` for an ad-hoc Agent call with no
real work item — didn't fit: `--work` deliberately requires a real item in
the store (a miss throws, on purpose) and only reads `work.domain` to map
to a stage skill, a mapping shape that doesn't describe an arbitrary
subtask. The three existing doors are really three different *lookup
keys* (executor name / capability / domain-to-skill); an ad-hoc subtask
has no key of its own — its natural key is a purpose label, i.e. `--for`.
What was actually missing was a new *input* `decide` had never received
from a caller before: does this specific call need a soul at all — the
exact axis decision `0026`'s rule 1 vs rule 2 already turns on. `--work`'s
own `hasNativeMechanism: true` became one more caller of this same signal.

## Why an unresolvable capacity reports `configured:false` instead of throwing

> D3: decide them field configured:true|false; KHONG throw khi capacityId
> khong co trong config

Tracing a real case (`decide` on a typo'd or unconfigured name falling
through to `out-of-process`, then `execute` silently spawning the global
default executor) found that the same fallback path is also load-bearing
for a legitimate case: `spawnWorker` calling with
`capacityIdForWork(work)` (e.g. `fgos-coding-implement`) is *intentionally*
allowed to miss the `capacities` registry (`tsk-in1` D12) — throwing on a
missing entry would break that normal runner path. The fix stays at
`decide`'s own output instead: keep returning `out-of-process`, but add
`configured: true|false` so a caller can finally tell "typo'd/unconfigured"
apart from "genuinely configured to run out-of-process," a distinction
that was previously invisible.

## Why `resolve` was retired outright, not deprecated in place

> D4: Rut HAN resolve (resolveCapacityCli + CLI branch), PORT ~15 test
> sang execute, sua 3 how-to

`resolve`'s only remaining job — printing the resolved command without
running it — was a second door onto the same logic `decide`/`execute`
already covered, and impact analysis confirmed it was low-risk to remove
outright: the only direct callers were `dispatch.mjs`'s own CLI branch and
its test file, zero production consumers. The ~15 existing tests were
*ported* to exercise `execute` instead of deleted, since they covered real
behavior `execute` didn't yet have an equivalent for (provider-model
resolution via `modelForTier`, `--tier`/`--model` overrides, gate-carries
propagation). Three how-to docs that taught `resolve` directly were
rewritten to teach the `decide` → `execute` pair instead; a fourth
(`diagnose-a-blocked-return-from-an-unrelated-verify-failure.md`) was left
alone deliberately — it only narrates history about a past item, and
editing it would distort the historical record rather than fix live
guidance. The accepted loss: no more offline "what command would this
run" dry-run — if that's needed again, it belongs inside `decide`, not
resurrected as a second door.

## Why this item couldn't be built as a child of `tsk-in1`, or directly on an item-less branch

> D6: Item nay phu thuoc tsk-in1 merge vao main truoc

`--needs-soul` needed to land inside `decideCapacityDispatchMechanism`,
which on `main` still read the pre-`tsk-in1` `kind === "task"` vocabulary;
the ~15 ported tests needed `tsk-in1`'s `kind: "agent"` fixtures; and both
items touch `src/runner/dispatch.mjs` heavily — the exact overlap the
engine's own footprint-conflict gate had already flagged when splitting
`tsk-in1`'s own children. Making this a child of `tsk-in1` was also
rejected: `tsk-in1` is capability/registry vocabulary unification, this
item is dispatch enforcement plus prose plus a hook — a different
boundary, and nesting it would have anchored `tsk-in1` open longer than
necessary. Building directly on an item-less branch was rejected too, as
the repo's own established anti-pattern (`tsk-5cm` exists specifically to
name that mistake).

## MCP tool access is a hand-back, not a second client

> D10: MCP invocation -> HAND-BACK cho phien song goi MCP tool cua chinh
> no, KHONG xay MCP client rieng trong dispatch

The general rule this decision states: `dispatch.mjs` runs what it can run
itself (`cli`, `http`); anything only the live session can do (the Task
tool, an MCP tool) gets handed back to that session instead. The live
agent session already holds real MCP tools in its own manifest (e.g.
`mcp__gitnexus__*`); opening a second MCP connection to the same server
from a batch CLI process, while the caller already holds a live one, is
the identical waste class `judgeDiscovery` had already been caught making
once (spawning a fresh `claude` process when the caller was already a live
`claude` session). This decision superseded `tsk-45f`'s own original plan
to open its own MCP client. Shape: an invocation declares a
capability-to-tool mapping (`invocations: [{via: "mcp", command:
"mcp:gitnexus", tools: {"impact-analysis": "mcp__gitnexus__impact"}}]`);
`decide` returns `{mechanism: "in-process", mcpTool: "mcp__gitnexus__impact"}`
— the three `mechanism` values stay exactly as locked before, only the
payload differs: `agentType` for a Task-tool call, `mcpTool` for an
MCP-tool call, both meaning the same thing ("do this yourself, with a
capability you already hold").

This is exactly why the current `AGENTS.md` Dispatch section describes
`in-process` as calling "your own live capability... neither an Agent/Task
tool nor an MCP client of its own" — the wording in force today
(`D12`, amending the earlier `D7` text once D10 was locked) states the
*structural* reason `dispatch.mjs` hands back rather than a temporary
limitation.

## Retiring the dead `capacity.capability` field in favor of `capacities.<id>.for`

> D11: Hop nhat 2 field trung nghia tren capacity — GIU capacities.<id>.for
> (mang, D15), RUT capacity.capability (string don)

Two fields on a capacity entry meant the same thing. The evidence pointed
one direction: `for` had real machinery (shape validation, `resolveCapacityIdForPurpose`,
a real dispatch chokepoint) but zero live declarations in the actual
running config (`agy`/`gitnexus`/`herdr` all had `for: None`) — a leftover
from `tsk-5tm` D10's own finding that `for: "judge"` had never actually
been read through purpose-lookup, later deleted outright by `tsk-4w4`.
`capability`, meanwhile, had two live declarations already running real
queries (`gitnexus` → `impact-analysis`, `herdr` → `pane-labeling`) via
`fgos tool query`. So this wasn't merging two active fields — it was
retiring a dead one and keeping the live one, settling only the *name*:
`for` won because it was already an array (`D15`: one executor can serve
several capabilities) while `capability` was a single string. This closed
the other half of `tsk-in1` D4's own unfinished work: the curated
`runner.capabilities` catalog existed and both sides validated against it,
but the field binding an executor to a capability was still split, so an
executor declaring `capability: "impact-analysis"` stayed invisible to
`decide --for impact-analysis` until this decision closed that gap.

## Scope boundary with `tsk-45f`

> D13: tsk-60f GIU phan cuong che (6 manh, D1-D9). Phan
> capability-fulfillment (D10 MCP hand-back + D11 hop nhat field for)
> chuyen sang tsk-45f

Rather than opening a new item for the MCP-hand-back and field-unification
work, it was folded into `tsk-45f` (already scoped to MCP/GitNexus
capacity registration) with a scope rewrite — fewer items, and a clean
boundary: `tsk-60f` = enforcement (dispatch must go through `decide`),
`tsk-45f` = capability fulfillment (a declared capability request actually
resolves). Both still touch `src/runner/dispatch.mjs`, so they had to
sequence rather than run concurrently, the same footprint-overlap
discipline `tsk-in1` had already established.

## Live proof: `fgos-coding-implement` really does dispatch out-of-process to `agy`

`tsk-1m8` live-proved the mechanism described above actually works for a
real coding-domain capacity, not just in design: registering a
`fgos-coding-implement` capacity entry pointed at the existing `agy` CLI
(`kind: agent`, `allowCrossProvider: true`, `providerModel: gemini`) flips
`decide`'s `configured` field from `false` to `true`, and a real `execute`
call actually spawned `agy`, which returned the exact requested smoke-test
reply (`AGY_DISPATCH_TEST_OK`) — no `src/` code change needed to make this
work, only the config entry. The proof ran entirely against a scratch
`.fgos/config.json` fixture outside the live repo, so the live config (and
every other coding item's real headless dispatch) was never touched or put
at risk while proving this.

## A real operational snag: approve cannot run from inside an isolated worktree

This item's own driving hit a structural wall worth recording: once fully
implemented and verified, the driving session — itself worktree-isolated
to `fgw/tsk-60f`, along with every subagent it could spawn — could not run
`fgos approve`, because that verb refuses to run from any worktree cwd,
and the sandbox refuses to `cd`/redirect out of the worktree. It needed a
session actually rooted at the main checkout to run `fgos approve tsk-60f
--acknowledge-iron-law`. This is the same class of constraint later swept
work (e.g. `tsk-4dk-1`'s own retrospective/cleanup sweep) has to work
around by explicitly exiting worktree isolation for operations that must
run from the main checkout.

## Source

`tsk-60f`. Full design: `docs/history/task-dispatch-unification/
DISCUSSION.md`. Verify: `npm test` plus a real (not fixture) demonstration
that the hook blocks one `out-of-process`-resolving Agent call and passes
one `in-process`-resolving call.
