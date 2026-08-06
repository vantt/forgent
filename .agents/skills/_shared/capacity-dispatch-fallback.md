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

## Step C — configured-and-present dispatch (cli-spawn mechanism)

1. Build the prompt from `<PROMPT_TEMPLATE>` (fixed, so every dispatch
   asks the exact same thing) — the identical prompt Step B.5's native
   branch would also have used, built once regardless of which mechanism
   Step B.5 picked.

2. Resolve the real command/args, reusing `dispatch.mjs`'s own
   `resolveExecutorConfig`/`resolveExecutorCommand` (`tsk-62v`) — never a
   second argv-building implementation:

   ```bash
   node "$root/src/runner/dispatch.mjs" resolve <CAPACITY_ID> --prompt "<the prompt built above>"
   ```

   This prints `{"command":...,"args":[...],"provider":...,"model":...}`
   as JSON.

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

## Provider/tier judgment for an ad-hoc dispatch (D5/D7/D10/D12)

`docs/history/two-layer-dispatch/DISCUSSION.md` D12: this is an optional,
per-dispatch REFINEMENT on top of everything above — it never adds a
second dispatch mechanism, and it never requires splitting `work.tier`
into a separate field (D12 picked the smaller path over a field split:
`work.tier` keeps carrying both its existing meanings unchanged; this
section only adds an override at dispatch TIME, resolved through the
`--model`/`--tier` flags `dispatch.mjs resolve` already accepts,
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
when dispatching an ad-hoc packet (see the section above), is the
packet's own six required fields — reuse bee's three-tier rubric
(light/standard/heavy) against the packet's `goal`/`expected shape`/
`return contract`, the same rubric a work item's own `tier` is judged
against at intake, just applied per-dispatch instead of once.

This judgment produces ONLY `provider`/`tier` — never a mechanism.
Mechanism stays entirely `dispatch.mjs decide`'s own call, resolved
through the Native-First Dispatch Doctrine's rules 1–4 exactly as Step
B.5 above already does; a judged `provider` that resolves to a
non-Claude command still has to clear the same `allowCrossProvider` gate
`resolveExecutorConfig` already enforces
(`src/runner/dispatch.mjs:691-693`) — nothing here bypasses it.

Fail-safe is the INVERSE of the six-field packet's own (there, a missing
required field means "do not dispatch, fall back to
`<INLINE_FALLBACK_HEADING>` — Step D above): here, failing to reach a
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
  message: 'ad-hoc dispatch <packet id>: <goal>',
});
"
```

`<scope>` is the packet id's own `<scope>` segment (the part before the
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
- `fgos-submit-assist/SKILL.md` — the real, live consumer of this fragment
  (`<CAPACITY_ID>` = `submit-assist-classify`, always `cli-spawn` — no
  live `kind:"task"` consumer exists yet to exercise Step B.5's `native`
  branch end-to-end; that branch is proven by `src/runner/dispatch.mjs`'s
  own unit tests instead, per `docs/history/tsk-3ik-3/iron-law-evidence.md`
  if applicable).
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  — Native-First Dispatch Doctrine, Step B.5's own governing rules 1/2/4.
