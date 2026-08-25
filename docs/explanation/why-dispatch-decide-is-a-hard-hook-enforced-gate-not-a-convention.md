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

## `execute` streams live output; `decide` never needed to

`dispatch.mjs execute`'s CLI branch ran silently between its start line and
its final JSON result — no intermediate signal at all, easy to mistake for
a hang during a slow spawned executor. `tsk-129` wired the repo's existing
`onChunk` live-tee mechanism (already used elsewhere, `P39`) into this one
remaining caller that had never used it, so a slow executor's output now
streams live to stderr instead of staying silent. `decide` was
deliberately left unchanged — it is fully synchronous, with no in-flight
period for a live tee to have anything to show.

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

## A configured cli-spawn capacity beats a live soul — config wins, not "I can just do it myself"

`tsk-1m8`'s live proof surfaced a real gap the moment it was tried against
a genuine native session: registering a `fgos-coding-implement` capacity
still resolved `in-process` for a session that happened to have live Task
access, silently skipping the out-of-process dispatch the capacity entry
was supposed to force. `tsk-pdg` fixed this by inverting a case decision
`0026`'s own rule 2 (Native-First Dispatch Doctrine) — this only for the
specific case a capacity has actually been configured for that job:

Before this fix, `decideCapacityDispatchMechanism` let a caller's own
`hasLiveTaskAccess: true` silently override a configured `kind: agent`
capacity back to native/in-process dispatch — "I'm already a live soul, so
I'll just do this myself" won by default even when the operator had
explicitly configured a specific capacity for that job. After the fix, a
**cli-spawn-shaped** capacity (its own `command`, or an `invocations[].via
=== 'cli'` entry — e.g. `agy`) dispatches out-of-process *unconditionally*
once configured, regardless of the caller's own live capability.
`0026`'s rule 2 still holds exactly as before for the case it was written
for — no capacity configured at all, where native remains the sane
default. An **agentType-shaped** capacity (e.g. `judge-discovery`) is
unaffected either way — that shape was already correctly resolving
in-process, since dispatching it out-of-process would mean spawning a
whole separate provider process just to do what the live session can
already do natively.

This is the concrete mechanism behind the wording `fgos-coding-implement`'s
own Hard rules give today: *"A `cli-spawn`-shaped capacity already
registered in `.fgos/config.json` resolves `out-of-process`
*unconditionally* once configured — having live Task access does not
change that; config wins, not 'I already have full context so I'll do it
myself'."* The scope is every configured `kind: agent` capacity, not just
`fgos-coding-implement`/`agy` specifically — the fix lives in the shared
`decideCapacityDispatchMechanism` chokepoint, so it applies uniformly.

A full scan of the existing test suite (28 sites asserting
`hasLiveTaskAccess: true`) confirmed zero needed to change — the inversion
only affects the specific combination of a *configured, cli-spawn-shaped*
capacity with a live-task-access caller, a combination the existing tests
hadn't happened to cover. `docs/decisions/0033` records this as an
extension of `0026`, not a rewrite of it — `0026`'s own body stays intact
with a pointer note, since its rule still governs the no-capacity-configured
case correctly.

## `capabilities.<name>` gains `prefer`/`overrides`, replacing per-purpose duplicate capacity entries

`tsk-34n` closed the gap `tsk-1m8`/`tsk-pdg` left behind: `fgos-coding-implement`
had its own dedicated `capacities.fgos-coding-implement` entry, duplicating
`agy`'s real config just to give that one job a name to look up by. This
item modeled the relationship correctly instead: a capability
(`runner.capabilities.<name>`) declares `prefer: <capacityId>` pointing at
the executor that serves it (the executor must itself declare
`for: [<name>]` — this symmetry is enforced at load time, specifically to
catch a `prefer` typo pointing at a capacity that never actually claimed to
serve that purpose) and `overrides` — a shallow merge onto the resolved
capacity, restricted to exactly four fields: `rigorOverrides`,
`providerModel`, `tier`, `model`. `overrides` can never touch `command`,
`args`, `adapter`, or `invocations` — keeping the one-backend-one-command
principle `0026` established intact; a capability can retune *how* an
executor runs a job, never swap in a different program to run it.

> D1: literal-key capacity lookup (`cfg.capacities[capacityId]`) luôn
> thắng trước, không đổi hành vi cũ -- for/prefer chỉ là fallback
> ADDITIVE khi không có literal key

Resolution order stays backward compatible: a literal capacity id always
wins first (existing configs keep working byte-identical); `prefer`/`for`
is purely an additive fallback for the case no literal key was given —
this is exactly how `fgos-coding-implement` itself now resolves (`decide
--work` still passes a literal capacity id when one exists, but a caller
naming just the purpose now finds `agy` through `prefer` instead of
needing its own duplicate entry).

## The real gap self-review found: two independent lookups had to be unified

> D4: một hàm dùng chung (resolveCapacityForId-style) áp toàn bộ thứ tự
> resolve... CẢ spawnWorker's own model lookup LẪN resolveExecutorConfig's
> internal lookup phải gọi hàm này

A code sweep found `spawnWorker` had its *own*, separate lookup for model
selection, independent of `resolveExecutorConfig`'s lookup for the command
to run — fixing only one would have silently let model and command drift
apart the moment the duplicate `fgos-coding-implement` entry was deleted. A
single shared resolver (`resolveCapacityAndOverrides`) now backs every real
call site instead: `resolveExecutorConfig`, `decideCapacityDispatchMechanism`,
`spawnWorker`'s model lookup, both of `decideCapacityCli`'s derivation
points, and three more sites inside `executeCapacityCli` found only once
implementation was underway.

A user-requested self-review (before approval, not after) then found three
more real bugs the initial implementation had missed: `executeCapacityCli`'s
`--for` door was silently dropping `overrides` on a second resolve call
that always hit the literal-key branch instead of the purpose branch;
`overrides.tier`/`overrides.model` validated as legal fields but were never
actually consulted anywhere (dead config, no error); and an error message's
remediation advice named the purpose instead of the real resolved capacity
id once they differed. All three were fixed with real red/green regression
tests before the item returned a second time — the same "self-review before
declaring done" discipline `tsk-60f` D16 had already established for the
role/holder wiring.

One pre-existing, out-of-scope finding was documented rather than fixed: a
prototype-pollution-adjacent bracket-access pattern
(`cfg.capacities[key]`) exists across roughly ten sites in this file,
predating this item, low real-world exploitability, left as a named gap
rather than folded into this item's own scope.

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

## Scope boundary: a raw tool call mid-turn (e.g. `WebSearch`) is not a dispatch at all

`tsk-3k4` investigated a real observed gap: `fgos-coding-shaping` ran
`WebSearch` five times back-to-back with no `decide` call anywhere in that
sequence, while `AGENTS.md`'s Dispatch section reads as if it covers "any
task dispatched out of the current turn." Five converging pieces of
evidence, all traced directly rather than assumed, confirmed this is
working as intended, not a gap:

1. The hook's matcher (`Agent|Task`, `test/setup/claude-code-hooks.test.mjs`)
   is a literal regex over two tool names — mechanically incapable of
   firing on `WebSearch` or anything else.
2. The hook's own design (`tsk-60f`'s plan) was built specifically around
   the Agent/Task tool's `subagent_type` field — there is no code path that
   could generalize to a tool call with no such field.
3. `dispatch.mjs`'s own scope (its file header) answers one question —
   should a *spawn* run in-process or out-of-process — never "should this
   tool call happen." A `WebSearch` call is not a spawn: no new process, no
   capacity, architecturally the same category as `Read`/`Grep`/`Bash`,
   none of which are gated through `decide` either.
4. The shared dispatch-reasoning fragment every skill consults names
   exactly four valid reasons to dispatch instead of working inline
   (`docs/history/two-layer-dispatch/DISCUSSION.md` D2) — a single
   `WebSearch` call inside a skill's own reasoning is "doing it inline,"
   not a separate step being handed to anyone.
5. The closest real precedent — organized multi-branch research fan-out in
   `fgos-researching` — was already explicitly decided to bypass `decide`
   on purpose (`tsk-5tm-2` D6): native Task-tool dispatch, no purpose
   check, no round trip, because read-only/no-file-write "gather packet"
   work is a named category that never needed dispatch coordination in the
   first place.

The fix landed was a one-paragraph clarification added to the shared
dispatch fragment (both mirrors) making this boundary explicit for future
readers — no code change, since nothing was actually broken.

## A closing rename: "capacity" became "executor"

Every decision quoted above uses "capacity"/`capacities` because that was
the real, live terminology at the time each of them was made. `tsk-225`
later renamed the concept to "executor"/`executors` across both the
`.fgos/config.json` field and every code identifier, no back-compat kept —
this is why current `AGENTS.md`'s `## Dispatch` section reads "routing
work to a executor" and `resolveExecutorConfig` was already named that
(the rename picked "executor" specifically because it already matched that
function's own return shape, not just for wording — plus the
capability=promise/executor=fulfillment framing already in use). `backend`
was considered and rejected: a static noun with no action sense, and no
prior code ever used it as a field name.

Frozen historical records (`docs/history/*capacity*/`) were deliberately
**left untouched** — rewriting a history folder to use a later name would
misrepresent what things were actually called when those decisions were
made. Living docs (explanation/how-to/reference, including this one) and
the shared skill fragment (`_shared/capacity-dispatch-fallback.md`,
including its own filename) tracked the rename, since they describe
current behavior rather than a frozen record. The seven existing locked
decision records that used "capacity" as their own terminology (three with
substantive content — `0026`, `0029`, `0033`) were handled by one new
decision record (`0034`) annotated onto `0000-index.md`, the same
non-reopening pattern `0028` had already established for its own earlier
rename — `0034` also formally closed a gap `0029` D8 had left open (D8
defined "capacity" as an undifferentiated promise+helper, a split
`tsk-34n` had already made in practice without ever revisiting D8's own
wording).

## Source

`tsk-60f`. Full design: `docs/history/task-dispatch-unification/
DISCUSSION.md`. Verify: `npm test` plus a real (not fixture) demonstration
that the hook blocks one `out-of-process`-resolving Agent call and passes
one `in-process`-resolving call.
