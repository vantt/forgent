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

## Valid reasons to dispatch instead of doing it inline

Four, no more (`docs/history/two-layer-dispatch/DISCUSSION.md` D2, single
source — no consuming skill restates this list, it points here instead):
a cheaper model, a different provider (e.g. Codex/agy), resource
isolation, or running the step in parallel with other work to shorten
wall-clock time (chạy song song cho nhanh — Ship Faster is priority #1,
`AGENTS.md`; the original three-reason list predated that priority order
and silently excluded the one reason that serves it). Anything else stays
inline — the live session already has full context for it, and
dispatching it anyway is the same "soul re-deriving what a live soul
already knows" waste `tsk-1ni` found in `judgeDiscovery`'s blind
cli-spawn.

A single tool call the live session makes directly inside its own
reasoning — `WebSearch`, `Read`, `Grep`, `Bash`, or any other primitive
the session already has — is never itself a candidate for `decide`. It
spawns nothing of its own, so there is no in-process/out-of-process choice
to make; it is exactly "doing it inline" in the sentence above, not a
fifth reason to dispatch. This holds even for a burst of several such
calls in a row (e.g. a research pass running `WebSearch` repeatedly) —
`decide` coordinates whether a STEP a skill would otherwise do inline gets
handed to a capacity/executor instead; it was never meant to gate the
session's own direct tool use, the same way it has never gated a `Read` or
a `Grep`.

## Step A — ask `decide` (never read the config yourself)

```bash
node src/runner/dispatch.mjs decide <EXECUTOR_ID> [--has-live-task-access]
# when you have no executor id, use the door that matches what you know:
#   decide --for <PURPOSE>  [--has-live-task-access]
#   decide --work <WORK_ID> [--stage <STAGE>] [--has-live-task-access]
#   decide --for <LABEL> --needs-soul [--has-live-task-access]
```

Then branch on `mechanism`:

- **`unavailable`** — go straight to `<INLINE_FALLBACK_HEADING>`, printing
  nothing at all. This is the default/common path, byte-identical to
  before this executor existed.
- **`in-process`** — call your own Agent/Task tool with the returned
  `agentType` (or your own default when absent). Print the announce line,
  then read its answer through Step C.
- **`out-of-process`** — continue to Step B.

When `--for`/`--work` resolved a `executorId` (carried in this same JSON
response, additive), reuse that exact value for `<EXECUTOR_ID>` in every
step below — never re-derive it.

## Step B — execute (out-of-process only)

Reached only when Step A's `decide` call answered `mechanism:
"out-of-process"`. Deciding the mechanism a second time here would be
deciding it twice — Step A already did that; this step only self-executes
(tsk-5tm-3 D5, matching marketing-cockpit's `run_task()` contract).

**Run this through the Monitor tool, not a plain synchronous Bash call**
(tsk-37ij): `dispatch.mjs`'s own `execute` CLI path already tees the
child executor's live output to its own stderr as it happens
(`dispatch.mjs:2154`, tsk-129's live-progress feature) — but a
synchronous Bash call blocks until the whole subprocess exits and only
then delivers the entire captured output as one block, so a human
watching this session sees nothing while the executor is actually
running. Monitor's own event stream is stdout-only, so fold the live
stderr tee into it with `2>&1`; each line then becomes its own live
notification while the process is still running — this is the real,
intended relay channel for a live agent session, not a workaround.

**Filter the tee — never pipe it raw** (tsk-4bq's own dispatch of itself
hit exactly the failure mode this line exists to prevent: an executor
that iterates by re-running its own full verify command several times
mid-run flooded the relay with repeated full-suite output, tripping
Monitor's own rate-limit and needing a manual `TaskStop`). Monitor's own
tool guidance already says this generally — "never pipe raw logs; filter
to exactly the success and failure signals you care about" — apply it
here specifically: keep the executor's real signal lines (`[DONE]`,
`[BLOCKED]`, an error/failure marker) and the one line that matters
structurally, the final JSON result (always starts a line with `{`, since
it is `JSON.stringify` output) — drop everything else, including a
verbose test runner's own line-by-line pass output:

```bash
node "$root/src/runner/dispatch.mjs" execute <EXECUTOR_ID> --prompt "<PROMPT_TEMPLATE built as below>" [--has-live-task-access] 2>&1 | grep -E --line-buffered '\[DONE\]|\[BLOCKED\]|Error|FAIL|✗|^\{'
```

**When this session is isolated in a worktree and `<PROMPT_TEMPLATE>` is
built from a file via `$(cat ...)`, the worktree-isolation guard may
refuse this line outright** — "too complex to verify that it stays
inside the worktree; break it into plain, separate commands" — even
though the command has no `git` subcommand in it (tsk-38w, extending
tsk-3rg's own finding that this guard is a harness-level built-in this
repo cannot change). Unlike the `root=$(...)` + `node ... --dir "$root"`
pattern tsk-3rg fixed by splitting into two tool calls, this line is one
logical action (dispatch + live-tee, per the Monitor rule above) that
cannot be split without losing the live-tee. When refused, run
`node scripts/write-wrapper-script.mjs --command "<full shell command>" --dir "$root"`
to produce the wrapper script file inside the worktree, and invoke that
returned single file path through Monitor instead — a single-file
invocation carries no compound shell syntax for the guard to flag.

(pass the line above as Monitor's own `command`, with a `description`
naming the executor/purpose; a reasonable `timeout_ms` for the tier at
hand; `persistent: false`.)

> **Waiting rule:**
> Wait for the harness's own background-completion notification before proceeding to gather results (end the turn with no further tool call once Monitor/background dispatch is started; the harness delivers a task-notification automatically and resumes the session with the output in context). Do NOT use `ScheduleWakeup` or polling — `ScheduleWakeup` is for `/loop` dynamic pacing only (requires `prompt` unless `stop:true`) and fails immediately in this context.

Once Monitor reports the command exited, read its final line: the real
result as JSON — `{"mechanism":"out-of-process", ...real result fields
(status, stdout, stderr, tier, model, provider, command)}`. Print the
announce line, then read `stdout` the same way a consumer used to read a
hand-run command's own output:

```
<EXECUTOR_ID> - out-of-process - <provider> - <model>
```

## Step B.5 — log the dispatch

Immediately after Step B's own final JSON result is read (the
`{"mechanism":"out-of-process", status, stdout, stderr, tier, model,
provider, command}` line), record it durably so a later reader can find
this dispatch without inferring it from a git commit:

```bash
node "$root/src/runner/dispatch.mjs" log <EXECUTOR_ID> --id "<id>" \
  --provider "<provider>" --command "<command>" [--model "<model>"]
```

`<provider>`, `<command>`, and `<model>` come straight from Step B's own
JSON result above — no new value to resolve. `<id>` is the item currently
claimed by this session. This call is mechanical bookkeeping, never a
gate: never stop, retry, or branch on its result — if it fails, continue
exactly as if it had not been called; the dispatch itself already
succeeded.

An error from this call (a thrown `RunnerConfigError`, a spawn failure, a
timeout, or Monitor's own timeout) means fall straight to Step C — treat
it exactly like a malformed response, never retry blind.

## Ad-hoc executor: a runtime-composed task instead of `<PROMPT_TEMPLATE>`

`docs/history/two-layer-dispatch/DISCUSSION.md` D3/D6/D6b/D10: a executor
whose consuming skill has no single fixed question to ask — the parent
composes a different command each time, depending on what it just decided
to split off — cannot fill in a registered `<PROMPT_TEMPLATE>` at all.
This is not a second dispatch mechanism: it still goes through Steps A/B
unchanged (`decide`, then `execute`), it only replaces what text goes
into Step B's own `--prompt` flag.

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
later concern — but the slots exist now on purpose: `resolveExecutorCommand`
already threads `model`/`tier` end-to-end (`src/runner/dispatch.mjs`), and
leaving them out at this layer would nail every ad-hoc dispatch to
`executor.model ?? modelForTier(cfg, work.tier)` — always the default
backend — forcing every call site written against this shape to be
revisited later just to add them.

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
`<PROMPT_TEMPLATE>` in the `--prompt` flag — every later step is
unchanged. When the task's own optional `tier`/`model` fields were
filled in, pass them through as `--tier <tier>`/`--model <model>` on that
same `execute` call (`tsk-2k1`, D10) — either flag, when given, wins over
the executor's own declared tier/model and the computed default; omitted
(every registered-`<EXECUTOR_ID>` call that names neither) resolves
exactly as before this plumbing existed. Which tier/model a task SHOULD
choose is not decided here — `#task-tier-judged-at-dispatch` — this is
only the pass-through.

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
section only adds an override at dispatch TIME, resolved through the
`--model`/`--tier` flags `dispatch.mjs execute` already accepts,
tsk-2k1/D10). Skip this section entirely for a registered `<EXECUTOR_ID>`
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
non-Claude command still has to clear the same `allowCrossProvider` gate
`resolveExecutorConfig` already enforces
(`src/runner/dispatch.mjs:703-707`) — nothing here bypasses it.

Fail-safe is the INVERSE of the six-field task's own (there, a missing
required field means "do not dispatch, fall back to
`<INLINE_FALLBACK_HEADING>` — Step C above): here, failing to reach a
confident tier/provider judgment means dispatch ANYWAY, with the
executor's own declared default (`executor.tier`/`executor.model`, or the
computed `modelForTier` fallback) — an unresolved judgment is never a
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
  tsk-3ik-1) and Step B's out-of-process self-execute (`execute`,
  tsk-5tm-3 D5) are proven by `src/runner/dispatch.mjs`'s own unit tests
  instead, per `docs/history/tsk-5tm-3/iron-law-evidence.md` if applicable.
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  — Native-First Dispatch Doctrine, Step A's own governing rules 1/2/4,
  applied internally by `decide` now (tsk-3ik-1) rather than by hand.
