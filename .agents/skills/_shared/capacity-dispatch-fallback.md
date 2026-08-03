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
  inline (Step C).

## Step C — configured-and-present dispatch

1. Build the prompt from `<PROMPT_TEMPLATE>` (fixed, so every dispatch
   asks the exact same thing).

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

## Precedent

- `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-capacity.md`
  — the how-to this fragment's own branch logic was extracted from; still
  the reference for config-entry/registration steps (1–3 there), which
  this fragment does not repeat.
- `fgos-submit-assist/SKILL.md` — the real, live consumer of this fragment
  (`<CAPACITY_ID>` = `submit-assist-classify`).
