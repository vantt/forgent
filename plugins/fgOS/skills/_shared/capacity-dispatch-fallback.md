# Shared fragment: capacity-dispatch-with-fallback

tsk-53h: extracted from the standalone submit-assist skill's own classify
step (`tsk-5l2-3`), the first and — until a second consumer exists — only
real wiring of this pattern. That skill has since been retired in full
(tsk-6ar) — its dispatch to this pattern was already gone before then
(tsk-4ns, see Precedent below). Generalized here so a second in-session
skill with an inline-reasoning step can gain the same optional
dispatch-to-a-capacity path without copy-pasting this branch logic into
its own `SKILL.md` (DRY — independent copies drift the next time this
logic changes,
`docs/history/agent-executor-generalized-capacity-helper/CONTEXT.md` D2).

Point at this file from a consumer `SKILL.md` by relative path (e.g.
`../_shared/capacity-dispatch-fallback.md`), filling in these three
parameters where the consuming skill's own reasoning step lives:

- **`<CAPACITY_ID>`** — the `.fgos/config.json`
  `runner.capacities.<id>` key this step dispatches through (no live
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

## Step A — config check

Before reasoning it out yourself, check whether `<CAPACITY_ID>` is
configured at all:

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node -e "
const cfg = JSON.parse(require('node:fs').readFileSync('$root/.fgos/config.json', 'utf8'));
console.log(cfg.runner?.capacities?.['<CAPACITY_ID>'] ? 'configured' : 'not-configured');
"
```

- **`not-configured`** — skip straight to `<INLINE_FALLBACK_HEADING>`,
  with no note printed at all. This is the default/common path, and its
  behavior and output are byte-identical to before this capacity existed —
  nothing here changes for the common case.
- **`configured`** — dispatch through `execute` next (Step B). There is no
  separate presence check here any more (tsk-5tm-1 D1: the field `needs`
  this used to query by, and the gate in `dispatch.mjs` that consulted it,
  are both retired — dead for every `kind:"task"` capacity, and no signal
  beyond the OS's own ENOENT for the rest). A missing/absent backend now
  surfaces as `execute`'s own spawn failure, caught by Step C below —
  later, and cheaper to have skipped a redundant check for, than before.

## Step B — execute (tsk-5tm-3 D5): self-execute or hand back, one call

Before this item, this fragment's own Steps A/B/B.5/C did a config check, a
presence check, a native-vs-cli/spawn decision, THEN built and ran the
command by hand — because `dispatch.mjs` itself only ever handed back
`{command,args}` for a `kind:"cli"` capacity, never ran it. `execute` now
does all of that internally (matching marketing-cockpit's `run_task()`
contract) — self-executing every case it can, handing back only the one
case it structurally can't (native, same-family, live session — dispatch
is a passive CLI, it has no Task tool of its own to call):

```bash
node "$root/src/runner/dispatch.mjs" execute <CAPACITY_ID> --prompt "<PROMPT_TEMPLATE built as below>" [--has-live-task-access]
```

`--has-live-task-access` is your own self-declaration (never inferred from
environment or config — the same "the skill already self-knows its own
tool manifest" pattern this whole optimization relies on): do you, the
assistant reading this fragment right now, already have the Agent/Task
tool available in your current tool manifest? Omit the flag entirely if
not — never pass it on a guess. This self-declaration is what the Native-
First Dispatch Doctrine (`docs/decisions/0026-vision-orchestrator-roottask-
capacity-native-vs-cli-spawn.md`, tsk-3ik-3) actually decides on
underneath — same-provider + live access → native; anything else →
cli/spawn — `execute` applies those rules for you, at runtime.

Prints JSON, one of two shapes:

- **`{"mechanism":"in-process","agentType":"<name>","prompt":"..."[,"capacityId":"..."]}`**
  — call YOUR OWN Agent/Task tool: `subagent_type` is this JSON's
  `agentType`, the prompt is the `prompt` field (the exact same
  `<PROMPT_TEMPLATE>` you passed — echoed back, never re-worded). Print the
  announce line before calling it:

  ```
  <CAPACITY_ID> - in-process - <agentType> - <model actually used>
  ```

  where `<model>` is whichever model the Agent/Task call actually resolves
  to (the target agent definition's own pinned `model:`, an explicit
  override you pass, or — when neither applies — the current session's own
  model, since native dispatch is same-provider by construction).
- **`{"mechanism":"out-of-process", ...real result fields (status, stdout,
  stderr, tier, model, provider, command)}`** — this already IS the real
  answer; nothing left to run. Print the announce line:

  ```
  <CAPACITY_ID> - out-of-process - <provider> - <model>
  ```

  Read `stdout` the same way a consumer used to read a hand-run command's
  own output — Step C's malformed-response fallback below applies
  identically regardless of which shape produced the answer.

An error from this call (a thrown `RunnerConfigError`, a spawn failure, a
timeout) means fall straight to Step C — treat it exactly like a malformed
response, never retry blind.

## Ad-hoc capacity: a runtime-composed task instead of `<PROMPT_TEMPLATE>`

`docs/history/two-layer-dispatch/DISCUSSION.md` D3/D6/D6b/D10: a capacity
whose consuming skill has no single fixed question to ask — the parent
composes a different command each time, depending on what it just decided
to split off — cannot fill in a registered `<PROMPT_TEMPLATE>` at all.
This is not a second dispatch mechanism: it still goes through Steps A/B
unchanged (config check, then `execute`), it only replaces what text goes
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
`capacity.model ?? modelForTier(cfg, work.tier)` — always the default
backend — forcing every call site written against this shape to be
revisited later just to add them.

`<scope>` inside `id` (D11): the id of the work item currently claimed, or
— when there is none — `s` followed by the first 8 characters of
`resolveWriterIdentity`'s own id (`src/runner/session-identity.mjs:129`,
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
the capacity's own declared tier/model and the computed default; omitted
(every registered-`<CAPACITY_ID>` call that names neither) resolves
exactly as before this plumbing existed. Which tier/model a task SHOULD
choose is not decided here — `#task-tier-judged-at-dispatch` — this is
only the pass-through.

## Step C — malformed-response fallback

If the response is missing, unparseable, or doesn't map to a real value
for the field(s) the consuming skill actually needs, fall back to
`<INLINE_FALLBACK_HEADING>` entirely, exactly as if the capacity were
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
tsk-2k1/D10). Skip this section entirely for a registered `<CAPACITY_ID>`
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
Mechanism stays entirely `execute`'s own internal decision, resolved
through the Native-First Dispatch Doctrine's rules 1–4 exactly as Step
B above already does; a judged `provider` that resolves to a
non-Claude command still has to clear the same `allowCrossProvider` gate
`resolveExecutorConfig` already enforces
(`src/runner/dispatch.mjs:703-707`) — nothing here bypasses it.

Fail-safe is the INVERSE of the six-field task's own (there, a missing
required field means "do not dispatch, fall back to
`<INLINE_FALLBACK_HEADING>` — Step C above): here, failing to reach a
confident tier/provider judgment means dispatch ANYWAY, with the
capacity's own declared default (`capacity.tier`/`capacity.model`, or the
computed `modelForTier` fallback) — an unresolved judgment is never a
reason to block a dispatch that would otherwise proceed.

Record whichever tier/model actually gets used — judged or defaulted —
through the one existing writer of `.fgos/logs/`, `appendWorkerLog`
(`src/runner/worker-log.mjs`); never a new log file or module for this:

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node --input-type=module -e "
import { appendWorkerLog } from '$root/src/runner/worker-log.mjs';
appendWorkerLog('$root', '<scope>', {
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

- `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-capacity.md`
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
  consumer. Step B's `in-process`/`out-of-process` branches (`execute`,
  tsk-5tm-3 D5) are proven by `src/runner/dispatch.mjs`'s own unit tests
  instead, per `docs/history/tsk-5tm-3/iron-law-evidence.md` if applicable.
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  — Native-First Dispatch Doctrine, Step B's own governing rules 1/2/4,
  applied internally by `execute` now (tsk-5tm-3 D5) rather than by hand.
