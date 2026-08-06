# Shared fragment: capacity-dispatch-with-fallback

tsk-53h: extracted from `fgos-submit-assist/SKILL.md`'s own classify step
(`tsk-5l2-3`), the first and — until a second consumer exists — only real
wiring of this pattern. Generalized here so a second in-session skill with
an inline-reasoning step can gain the same optional dispatch-to-a-capacity
path without copy-pasting this branch logic into its own `SKILL.md` (DRY —
independent copies drift the next time this logic changes,
`docs/history/agent-executor-generalized-capacity-helper/CONTEXT.md` D2).

Point at this file from a consumer `SKILL.md` by relative path (e.g.
`../_shared/capacity-dispatch-fallback.md`), filling in these three
parameters where the consuming skill's own reasoning step lives:

- **`<CAPACITY_ID>`** — the `.fgos/config.json`/`.fgos-runner.json`
  `runner.capacities.<id>` key this step dispatches through (real example:
  `submit-assist-classify`).
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

Before reasoning it out yourself, check two things in order — whether
`<CAPACITY_ID>` is configured at all, and only if it is, whether its
registered backend is actually present on this machine. These are
deliberately two separate checks, not one: "never configured" and
"configured but the backend is missing" get different, distinguishable
behavior below.

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node -e "
const cfg = JSON.parse(require('node:fs').readFileSync('$root/.fgos-runner.json', 'utf8'));
console.log(cfg.capacities?.['<CAPACITY_ID>'] ? 'configured' : 'not-configured');
"
```

- **`not-configured`** — skip straight to `<INLINE_FALLBACK_HEADING>`,
  with no note printed at all. This is the default/common path, and its
  behavior and output are byte-identical to before this capacity existed —
  nothing here changes for the common case.
- **`configured`** — check presence next (Step B).

## Step B — presence check

```bash
node "$root/bin/fgos.mjs" tool query --capability <CAPACITY_ID> --status present --dir "$root"
```

- **Empty `providers` array (registered but not present, or never
  registered despite being configured)** — print one visible line
  (`<CAPACITY_ID> is configured but its backend isn't available on this
  machine — classifying it directly instead`), then fall through to
  `<INLINE_FALLBACK_HEADING>`. The note is the only difference from the
  `not-configured` case above; the reasoning itself is identical.
- **One provider, `status: "present"`** — dispatch instead of reasoning
  inline (Step B.5, then Step C).

## Step B.5 — native-vs-cli/spawn decision (tsk-3ik-3, Native-First Dispatch
Doctrine, `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-
vs-cli-spawn.md`)

Configured+present no longer means "always exec a subprocess" — check which
dispatch mechanism actually applies before building anything. First decide,
on your own (never inferred from environment or config — the same "the
skill already self-knows its own tool manifest" pattern this whole
optimization relies on): do you, the assistant reading this fragment right
now, already have the Agent/Task tool available in your current tool
manifest? Then ask:

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node "$root/src/runner/dispatch.mjs" decide <CAPACITY_ID> --has-live-task-access
```

(Omit `--has-live-task-access` entirely if you decided above that you do
NOT currently have live Agent/Task tool access — never pass the flag on a
guess.) Prints `{"mechanism": "native"|"cli-spawn"[, "agentType": "<name>"]}`.

- **`mechanism: "cli-spawn"`** — proceed to Step C exactly as before.
  This is every `kind:"cli"` capacity (e.g. `submit-assist-classify`, this
  pattern's one real live consumer today — cross-provider, always
  cli/spawn), every `kind:"task"` capacity when you lack live Task access,
  and any capacity whose config forces cli/spawn (`forceCliSpawn`).
- **`mechanism: "native"`** — skip Step C's `exec` entirely. Call your own
  Agent/Task tool directly instead: `subagent_type` is this same JSON's
  `agentType`, the prompt is `<PROMPT_TEMPLATE>` (the exact same prompt
  Step C would have built — never a different or re-worded one). Read the
  response the same way Step C's own consumer reads a dispatched answer —
  Step D's malformed-response fallback applies identically regardless of
  which mechanism produced the response.

## Ad-hoc capacity: a runtime-composed packet instead of `<PROMPT_TEMPLATE>`

`docs/history/two-layer-dispatch/DISCUSSION.md` D3/D6/D6b/D10: a capacity
whose consuming skill has no single fixed question to ask — the parent
composes a different command each time, depending on what it just decided
to split off — cannot fill in a registered `<PROMPT_TEMPLATE>` at all.
This is not a second dispatch mechanism: it still goes through Steps A/B/
B.5 unchanged (config check, presence check, native-vs-cli decision), it
only replaces where Step C.1's prompt text comes from.

What is lost by dropping the fixed template is a real guarantee — "the
exact same question every call" — so the replacement has to be an honest
one, not free text: **the same KIND of question every call**, via six
required fields. Missing any one of them means the packet is malformed —
fall through to `<INLINE_FALLBACK_HEADING>` exactly as Step D already does
for any other malformed response, never dispatch a partial packet:

| Field | Shape | Why required |
|---|---|---|
| `id` | `<scope>#p<n>` | Reference id (see below) so a parent can match a returned digest back to the packet that asked for it when several are in flight at once — never a lifecycle id: no claim, no reserve, no cap, no merge (D4 stays exactly as gated as it always was). The `#` makes this id permanently invalid against `work.mjs`'s `ID_PATTERN` (`src/state/work.mjs:24`) — structurally, not by convention, so a packet id can never be mistaken for a real work item. |
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
packet needs to know which kind it is looking at.

`<n>` inside `id`: a counter kept in the composing session's own memory,
restarting at 1 on every fresh session — harmless, since the packet itself
is ephemeral and was never meant to survive a restart. **Never back this
counter with a file.** A counter file is state, and state is exactly the
back door D4's "no lifecycle id for this shape" decision was drawn to
close.

Once the six-field packet is built (or the fallback triggered on a missing
field), continue at Step C.1 below, substituting the packet for
`<PROMPT_TEMPLATE>` — every later step is unchanged.

## Step C — configured-and-present dispatch (cli-spawn mechanism)

1. Build the prompt from `<PROMPT_TEMPLATE>` (fixed, so every dispatch
   asks the exact same thing) — the identical prompt Step B.5's native
   branch would also have used, built once regardless of which mechanism
   Step B.5 picked. For an ad-hoc capacity, this is the six-field packet
   from the section above instead — same "build once, use for whichever
   mechanism Step B.5 picked" rule, just a different source for the text.

2. Resolve the real command/args, reusing `dispatch.mjs`'s own
   `resolveExecutorConfig`/`resolveExecutorCommand` (`tsk-62v`) — never a
   second argv-building implementation:

   ```bash
   node "$root/src/runner/dispatch.mjs" resolve <CAPACITY_ID> --prompt "<the prompt built above>"
   ```

   This prints `{"command":...,"args":[...],"provider":...,"model":...}`
   as JSON. When the packet's own optional `tier`/`model` fields were
   filled in (the ad-hoc section above), pass them through as `--tier
   <tier>`/`--model <model>` on this same call (`tsk-2k1`, D10) — either
   flag, when given, wins over the capacity's own declared tier/model and
   the computed default; omitted (every registered-`<CAPACITY_ID>` call
   that names neither) resolves exactly as before this plumbing existed.
   Which tier/model a packet SHOULD choose is not decided here —
   `#task-tier-judged-at-dispatch` — this is only the pass-through.

3. Print the announce line, then actually run the resolved
   `command`/`args` via Bash (the JSON's `args` array is the real,
   already-`{prompt}`-substituted argv — invoke it as-is, never
   re-templated):

   ```
   <CAPACITY_ID> - <provider> - <model>
   ```

4. Read the response — Step D covers what "malformed" means for it.

## Step D — malformed-response fallback

If the response is missing, unparseable, or doesn't map to a real value
for the field(s) the consuming skill actually needs, fall back to
`<INLINE_FALLBACK_HEADING>` entirely, exactly as if the capacity were
absent. Either way the output is non-authoritative: a wrong external
suggestion is exactly as cheap to fix later as a wrong inline one — never
treat a dispatched answer as more trustworthy than the skill's own
reasoning would have been.

## Precedent

- `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-capacity.md`
  — the how-to this fragment's own branch logic was extracted from; still
  the reference for config-entry/registration steps (1–3 there), which
  this fragment does not repeat.
- `fgos-submit-assist/SKILL.md` — the real, live consumer of this fragment
  (`<CAPACITY_ID>` = `submit-assist-classify`, always `cli-spawn` — no
  live `kind:"task"` consumer exists yet to exercise Step B.5's `native`
  branch end-to-end; that branch is proven by `src/runner/dispatch.mjs`'s
  own unit tests instead, per `docs/history/tsk-3ik-3/iron-law-evidence.md`
  if applicable).
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  — Native-First Dispatch Doctrine, Step B.5's own governing rules 1/2/4.
