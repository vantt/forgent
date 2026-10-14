# Shared fragment: executor-dispatch-with-fallback

tsk-53h: extracted from the standalone submit-assist skill's own classify
step (`tsk-5l2-3`), the first and — until a second consumer exists — only
real wiring of this pattern. That skill has since been retired in full
(tsk-6ar) — its dispatch to this pattern was already gone before then
(tsk-4ns, see Precedent below). Generalized here so a second in-session
skill with an inline-reasoning step can gain the same optional
dispatch-to-a-executor path without copy-pasting this branch logic into
its own `SKILL.md` (DRY — independent copies drift the next time this
logic changes,
`docs/history/agent-executor-generalized-capacity-helper/CONTEXT.md` D2).

Point at this file from a consumer `SKILL.md` by relative path (e.g.
`../_shared/executor-dispatch-fallback.md`), filling in these three
parameters where the consuming skill's own reasoning step lives:

- **`<EXECUTOR_ID>`** — the `.fgos/config.json`
  `runner.executors.<id>` key this step dispatches through (no live
  consumer of this fragment's own Steps A-C exists today, tsk-4ns — see
  Precedent below).
- **`<PROMPT_TEMPLATE>`** — the fixed prompt text to send (so every
  dispatch asks the model the exact same thing, never a paraphrase that
  drifts call to call), with the caller's own free-text input spliced in
  verbatim as its own line, never re-worded.
- **`<INLINE_FALLBACK_HEADING>`** — the consuming skill's own heading name
  for "reason about it yourself" (real example: "Classify it yourself"),
  the path every branch below falls through to.

## Shared awareness cluster

This is the dispatch component of a four-fragment shared awareness cluster
(`docs/history/agent-coordination-foundation/plan.md`):
[`capability-catalog.md`](./capability-catalog.md) defines the canonical vocabulary and promises;
[`capability-matching.md`](./capability-matching.md) governs understanding intent, writing Units, and invoking Workflow runner (Q1);
[`planning-capability-awareness.md`](./planning-capability-awareness.md) guides plan decomposition and capability assignment;
and this fragment governs execution-time decision and dispatch (Q2).
None of these shared fragments is coding-specific.

## Activation doctrine: Decide before execute

Before executing any independently executable unit (e.g. `code:implement` for coding implementation), select the canonical capability for the job — see `capability-catalog.md` for the registered vocabulary — and call `decide` (`fgos dispatch decide --for <PURPOSE> [--has-live-task-access]`) before proceeding. The returned `mechanism` controls execution: `unavailable` means execute inline directly in this session; `in-process` or `out-of-process` delegates according to the control plane. The resolved provider is not necessarily agent-shaped — a capability may resolve to an MCP/tool provider or another registered adapter instead of an agent executor (`capability-catalog.md`'s "Capability execution guidance"); read the resolved `mechanism`/executor `kind` rather than assuming an Agent/Task hand-off.

Five valid reasons justify configuring an executor for a capability:
a cheaper model, a stronger model (when the unit's required `rigor` exceeds
the current session's model capability — tied to `rigor`, never to `size`),
a different provider (e.g. Codex/agy), resource isolation (confinement / sandboxing),
or running the step in parallel with other work to shorten wall-clock time
(chạy song song cho nhanh — Ship Faster is priority #1, `AGENTS.md`).
When no executor is configured for that capability, `decide` answers `unavailable`
and the unit executes inline in the live session.

A single tool call the live session makes directly inside its own
reasoning — `WebSearch`, `Read`, `Grep`, `Bash`, or any other primitive
the session already has — is never itself an independently executable unit for `decide`. It
spawns nothing of its own, so there is no in-process/out-of-process choice
to make; it is exactly "doing it inline", not a separate unit to dispatch. This holds even for a burst of several such
calls in a row (e.g. a research pass running `WebSearch` repeatedly).

## Step A — ask `decide` (never read the config yourself)

```bash
fgos dispatch decide <EXECUTOR_ID> [--has-live-task-access]
# when you have no executor id, use the door that matches what you know:
#   decide --for <PURPOSE>  [--has-live-task-access]
#   decide --work <WORK_ID> [--step <STEP>] [--has-live-task-access]
#   decide --for <LABEL> --needs-soul [--has-live-task-access]
```

Then branch on `mechanism`:

- **`unavailable`** — go straight to `<INLINE_FALLBACK_HEADING>`, printing
  nothing at all. This is the default/common path, byte-identical to
  before this executor existed.
- **`in-process`** — call the returned hand-back yourself: use `agentType`
  with your Agent/Task tool, or call `mcpTool` directly. If neither field
  is returned, use your normal default for that live call. Print the
  announce line, then read its answer through Step C.
- **`out-of-process`** — continue to Step B.

When `--for`/`--work` resolved a `executorId` (carried in this same JSON
response, additive), reuse that exact value for `<EXECUTOR_ID>` in every
step below — never re-derive it.

## Step B — run it as a Unit (out-of-process only)

Reached only when Step A's `decide` call answered `mechanism:
"out-of-process"`. Deciding the mechanism a second time here would be
deciding it twice — Step A already did that; this step only runs the work
through the one execution door, `fgos run`, which builds a Unit from the
prompt, binds it through `bind()` with `<EXECUTOR_ID>` as a soft preference,
runs it and settles it:

```bash
fgos run "<PROMPT_TEMPLATE built as below>" --provider <EXECUTOR_ID> --capability <PURPOSE> [--effort <level>] --json
# work that changes files names its scope and a linked worktree:
fgos run "<PROMPT_TEMPLATE>" --provider <EXECUTOR_ID> --capability <PURPOSE> --writes <path>[,<path>...] --worktree <linked-worktree> --json
```

`--provider` takes an agent executor only. When `<EXECUTOR_ID>` is a
`kind: "tool"` executor, `fgos run` refuses it as a provider: call that
tool directly instead (the dispatch-decide hook says the same).

`--capability` is the same `<PURPOSE>` Step A asked `decide` for: left
out, the Unit runs under the writing capability `execute`, with its own
executor pool and posture. Without `--writes` the Unit is read-only and runs sandboxed; `--writes`
needs a linked worktree and is refused from the main checkout before
anything runs. The worker never runs `git add`/`git commit`: after a
passing round the runner commits only the paths inside `--writes`. Work
already written as a Unit file runs as `fgos run --unit <file>`. Never run
the resolved command yourself through Bash.

When herdr is present the worker runs in a watched pane, so a person can
follow it live; otherwise the call blocks until the Unit settles. Run a
long call backgrounded (`run_in_background: true`) and wait for the
harness's own completion notification — do NOT use `ScheduleWakeup` or
polling.

**When this session is isolated in a worktree and `<PROMPT_TEMPLATE>` is
built from a file via `$(cat ...)`, the worktree-isolation guard may
refuse this line outright** — "too complex to verify that it stays
inside the worktree; break it into plain, separate commands" (tsk-38w,
a harness-level built-in this repo cannot change). When refused, run
`node scripts/write-wrapper-script.mjs --command "<full shell command>" --dir "$root"`
to produce the wrapper script file inside the worktree, and invoke that
returned single file path instead — a single-file invocation carries no
compound shell syntax for the guard to flag.

Read the result JSON (the payload sits under `data`): `data.outcome`
(`pass` or why not), `data.unitRunId`, and the last round at
`data.results[-1]` — the worker's answer is
`data.results[-1].runResult.agentClaim.summary`, and for writing work the
runner's commit is `data.results[-1].commit` (`status`, `sha`, `files`,
`outOfScope`, `needsWrites`). Print the announce line from the bound
executor, provider and model, then read the summary the same way a
consumer used to read a hand-run command's own output:

```
<EXECUTOR_ID> - out-of-process - <provider> - <model>
```

There is nothing to log by hand: the run's provenance (Unit, binding,
round results, commit) is already under `.fgos/assignments/<unitRunId>/`.

An error from this call (a refusal before the run, a failed bind, or a
timeout) means fall straight to Step C — treat it exactly like a malformed
response, never retry blind.

## Ad-hoc executor: a runtime-composed task instead of `<PROMPT_TEMPLATE>`

`docs/history/two-layer-dispatch/DISCUSSION.md` D3/D6/D6b/D10: an executor
whose consuming skill has no single fixed question to ask — the parent
composes a different command each time, depending on what it just decided
to split off — cannot fill in a registered `<PROMPT_TEMPLATE>` at all.
This is not a second dispatch mechanism: it still goes through Steps A/B
unchanged (`decide`, then `fgos run`), it only replaces what text goes
into Step B's own prompt.

What is lost by dropping the fixed template is a real guarantee — "the
exact same question every call" — so the replacement has to be an honest
one, not free text: **the same KIND of question every call**, via six
required fields. Missing any one of them means the task is malformed —
fall through to `<INLINE_FALLBACK_HEADING>` exactly as Step C already does
for any other malformed response, never dispatch a partial task:

| Field | Shape | Why required |
|---|---|---|
| `id` | `<scope>#p<n>` (D8: the `p` stays literal — renaming the concept never changes this shape) | Reference id (see below) so a parent can match a returned digest back to the task that asked for it when several are in flight at once — never a lifecycle id: no claim, no reserve, no cap, no merge (D4 stays exactly as gated as it always was). The `#` makes this id permanently invalid against `work.mjs`'s `ID_PATTERN` (`src/state/work.mjs:24`) — structurally, not by convention, so a task id can never be mistaken for a real work item. |
| goal | one sentence | The one thing a worker cannot infer from the files it's handed |
| inputs | concrete paths to read | "read exactly these; nothing else will be provided" — never "look around the repo" |
| boundary | what must not be touched/written | Equivalent to symphony's `forbidden_paths` |
| expected shape | what the returned digest should look like | Without it the worker picks its own format and the parent has to guess |
| return contract | one fixed reply format | Equivalent to bee's status-token discipline: "exiting is not signaling" |

Plus two fields that may be left blank (D10): `provider` and `tier`. No
selection logic sits behind either yet — deciding them is a separate,
later concern — but the slots exist now on purpose: `fgos run` already
carries them into `bind()` (`--provider` as a soft preference, `--rigor`
for the tier), and leaving them out at this layer would nail every ad-hoc
dispatch to the capability's default backend — forcing every call site
written against this shape to be revisited later just to add them.

`<scope>` inside `id` (D11): the id of the work item currently claimed, or
— when there is none — `s` followed by the first 8 characters of
`resolveWriterIdentity`'s own id (`src/util/session-identity.mjs:134`,
its existing four-tier registry/env/pid/unresolved fallback; never a new
identity source). The `s` prefix only matters for the pid-sourced case:
it keeps a scope from starting with a digit, since a pid alone is not
even a stable identity across process restarts. Record which tier
produced it as `scopeSource`, the same `{id, source}` shape a work item's
own `writer` field already carries — a pid-sourced scope is not stable
across processes the way a registry-sourced one is, and a reader of the
task needs to know which kind it is looking at.

`<n>` inside `id`: a counter kept in the composing session's own memory,
restarting at 1 on every fresh session — harmless, since the task itself
is ephemeral and was never meant to survive a restart. **Never back this
counter with a file.** A counter file is state, and state is exactly the
back door D4's "no lifecycle id for this shape" decision was drawn to
close.

Once the six-field task is built (or the fallback triggered on a missing
field), continue at Step B above, substituting the task for
`<PROMPT_TEMPLATE>` as the prompt — every later step is unchanged. The
task's own optional `provider` field becomes `--provider`; its `tier` is a
rigor, not a pin: pass it as `--rigor <low|standard|high|critical>` (and a reasoning budget as
`--effort <level>`), and `bind()` picks the model for it. Omitted, the
capability's own defaults apply. Which tier a task SHOULD choose is not
decided here — `#task-tier-judged-at-dispatch` — this is only the
pass-through.

## Step C — malformed-response fallback

If the response is missing, unparseable, or doesn't map to a real value
for the field(s) the consuming skill actually needs, fall back to
`<INLINE_FALLBACK_HEADING>` entirely, exactly as if the executor were
absent. Either way the output is non-authoritative: a wrong external
suggestion is exactly as cheap to fix later as a wrong inline one — never
treat a dispatched answer as more trustworthy than the skill's own
reasoning would have been.

## Provider/tier judgment for an ad-hoc dispatch (D5/D7/D10/D12)

`docs/history/two-layer-dispatch/DISCUSSION.md` D12: this is an optional,
per-dispatch REFINEMENT on top of everything above — it never adds a
second dispatch mechanism, and it never requires splitting `work.tier`
into a separate field (D12 picked the smaller path over a field split:
`work.tier` keeps carrying both its existing meanings unchanged; this
section only adds a preference at dispatch TIME, passed as `fgos run`'s
`--provider`/`--rigor`/`--effort` flags and resolved by `bind()`). Skip this section entirely for a registered `<EXECUTOR_ID>`
dispatch with no reason to deviate from its own declared tier/model —
nothing here changes that path.

When a consuming skill's own reasoning session has a real reason to pick a
different tier (and, optionally, a non-default provider) for one specific
dispatch, judge it INLINE, as the session's own reasoning — never via a
second subprocess judge call spawned just to answer this. That would be
the exact same "soul re-deriving what a live soul already knows" waste
`docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-
spawn.md`'s own "Lớp còn thiếu" section already names for
`judgeDiscovery`/`judgeDecompose` — spawning one here would repeat that
mistake one layer further down the stack. The evidence to reason FROM,
when dispatching an ad-hoc task (see the section above), is the
task's own six required fields — reuse bee's three-tier rubric
(light/standard/heavy) against the task's `goal`/`expected shape`/
`return contract`, the same rubric a work item's own `tier` is judged
against at intake, just applied per-dispatch instead of once.

This judgment produces ONLY `provider`/`tier` — never a mechanism.
Mechanism stays entirely `decide`'s own decision, already resolved at Step
A above, never re-derived here; a judged `provider` that resolves to a
non-Claude executor still goes through every filter `bind()` applies to
a preference (governance, independence, posture) and fails over when it
cannot run — nothing here bypasses them.

Fail-safe is the INVERSE of the six-field task's own (there, a missing
required field means "do not dispatch, fall back to
`<INLINE_FALLBACK_HEADING>` — Step C above): here, failing to reach a
confident tier/provider judgment means dispatch ANYWAY, with the
executor's own declared default (`executor.tier`/`executor.model`, or the
computed `resolveTierModel` fallback) — an unresolved judgment is never a
reason to block a dispatch that would otherwise proceed.

Record whichever tier/model actually gets used — judged or defaulted —
through the one existing writer of `.fgos/logs/`, `appendWorkerLog`
(`src/runner/worker-log.mjs`); never a new log file or module for this:

```bash
node --input-type=module -e "
import { appendWorkerLog } from './src/runner/worker-log.mjs';
appendWorkerLog('.', '<scope>', {
  tier: '<judged-or-default-tier>',
  model: '<judged-or-default-model>',
  message: 'ad-hoc dispatch <task id>: <goal>',
});
"
```

`<scope>` is the task id's own `<scope>` segment (the part before the
`#` in `<scope>#p<n>`) — in the common case, the work item currently
claimed, so this entry lands in `.fgos/logs/<scope>.log`, the exact same
file that item's own regular dispatch entries already write to. That is
deliberate: it is what lets a later read of one file answer "what did
this item's own ad-hoc sub-dispatches choose", and it is exactly the data
a future downgrade-feedback-loop pass over `.fgos/logs/` needs to measure
how often the expensive tier was actually scarce. Log every judged-or-
defaulted choice, not only the cases where a downgrade happened — a
scarcity signal needs the full denominator, not just the misses.

## Precedent

- `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-executor.md`
  — the how-to this fragment's own branch logic was extracted from; still
  the reference for config-entry/registration steps (1–3 there), which
  this fragment does not repeat.
- No live consumer of this fragment's own Steps A-C remains today (tsk-4ns
  retired the standalone submit-assist skill's own dispatch to
  `submit-assist-classify` — its classify step never had a real reason to
  dispatch per the "Valid reasons to dispatch" list above: the input was
  already in the caller's own context, and spawning added latency at the
  exact moment a person is waiting, `AGENTS.md`'s priority #1; that skill
  has since been retired in full, tsk-6ar). This
  fragment stays in place: six other stage skills
  (`fgos-coding-validating`/`fgos-coding-implement`/`fgos-fanout`/`fgos-coding-planning`/
  `fgos-coding-exploring`/`fgos-researching`) cite its "Valid reasons to dispatch"
  list directly when explaining their own never-delegate-reasoning rule,
  and it remains the ready-made pattern for the next real cross-provider
  consumer. Step A's `in-process`/`out-of-process` branching (`decide`,
  tsk-3ik-1) is proven by `src/runner/dispatch.mjs`'s own unit tests, and
  Step B's run by `fgos run`'s (`src/runner/execution/run.mjs`).
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  — Native-First Dispatch Doctrine, Step A's own governing rules 1/2/4,
  applied internally by `decide` now (tsk-3ik-1) rather than by hand.
