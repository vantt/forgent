# Launch claude in a new herdr pane from a plugin

A recipe for a plugin that needs to open a new herdr pane and start an
interactive program in it with an initial input already queued —
grounded in `tsk-19y-3`, the herdr dashboard's row-select-to-`/fgOS:pick`
action.

## 1. A manifest `[[actions]]` entry cannot carry per-row selection

It's tempting to model "select a dashboard row, trigger an action" as a
herdr `[[actions]]` manifest entry, invoked via `herdr plugin action
invoke <id>`. Check the real CLI source before committing to that shape:

```rust
// upstreams/herdr/src/cli/plugin.rs, plugin_action_invoke
print_plugin_response(Method::PluginActionInvoke(PluginActionInvokeParams {
    action_id: action_id.clone(),
    plugin_id,
    context: Some(PluginInvocationContext {
        workspace_id: None, tab_id: None, focused_pane_id: None,
        selected_text: None, invocation_source: Some("cli".into()),
        // ... no field carries an arbitrary caller-supplied argument
    }),
}))
```

`context` only carries herdr-level invocation metadata (workspace/tab/pane
ids, selected *terminal text*, a clicked URL) — there is no field for a
plugin-defined parameter like "which row was selected in my own list
widget". Herdr has no visibility into a `[[panes]]` process's internal
list-cursor state at all; that state lives only in the pane's own running
process memory. A per-row action has to be triggered from *inside* that
process — an in-dashboard keybinding — not through a manifest-level
action.

## 2. The real two-call sequence: `pane split` then `pane run`

Confirmed live against a real herdr install (0.7.4, this machine):

```bash
$ herdr pane split --current --direction right --focus
{"id":"cli:pane:split","result":{"pane":{"pane_id":"wS:p16", ...}}}

$ herdr pane run wS:p16 "echo hello-from-pick-argv-test"
# types the command into the new pane's shell and presses Enter
```

`--current` resolves to the *calling* plugin process's own pane via
herdr's own `HERDR_PANE_ID` injection — no need to read that env var
yourself. `pane run <pane_id> <command>` is **not** a spawn — it's
`PaneSendInputParams{text, keys: ["Enter"]}` under the hood: it literally
types the given text into whatever shell is already running in that pane.
That has two consequences:

- There is no shell-safe argv boundary. Any untrusted text that becomes
  part of the typed command can break out of it.
- Launching an interactive program *with an initial prompt already
  queued* is one `pane run` call, not two — pass the whole invocation
  (`claude '/fgOS:pick <id>'`) as the command text, rather than typing
  `claude` alone and racing a second `pane run` against its startup time.

## 2b. Pin the model explicitly — the launched session won't inherit yours

A `claude` invocation built without `--model` runs on the CLI's own
default, not on whatever the launching session happens to be using. If you
want the pane's session pinned, every argv builder has to say so.

Set `FGOS_HERDR_MODEL` to choose it; it defaults to `sonnet`:

```bash
FGOS_HERDR_MODEL=opus herdr ...   # per-launch override
```

The resulting command text looks like:

```
claude --model sonnet --dangerously-skip-permissions '/fgOS:pick tsk-19y-3'
```

Three details worth copying when you add a similar knob:

- **Cover every builder, not the one you happened to be looking at.** In
  this plugin that meant both `run_argv_for_command` (used by `/fgOS:pick`
  and `/fgOS:discover`) *and* `loop_run_argv` (used by `merge-loop`,
  `retro-loop`, and `cleanup-loop`). A model pinned in one path and absent
  from the other is worse than absent from both, because the inconsistency
  is invisible until someone compares two panes.
- **Read the env var once per launch, then thread it in as a plain
  argument.** Do not read the environment *inside* the argv builder. The
  builders stay pure and unit-testable that way — the same shape
  `skip_permissions_enabled()` already uses, where the test passes a plain
  bool rather than manipulating process env.
- **Default to the short alias (`sonnet`), not a full model id
  (`claude-sonnet-5`).** This matches what the repo already does
  everywhere else: `.fgos/config.json`'s `runner.executor.args` and
  `executors.*.args` all use alias-shaped literals, and the event log
  shows real executed invocations in the same form (`claude -p '...'
  --model haiku ...`). Introducing a full-id convention here would make
  this one call site the odd one out.

## 3. Re-validate any id before it's typed into a pane

Since `pane run`'s command text has no shell-safe boundary, defensively
re-check any dynamic value against its own source-of-truth grammar before
interpolating it — don't trust it just because it came from a JSON
response you already parsed:

```rust
// mirrors src/state/work.mjs's ID_PATTERN: /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
fn is_valid_id(id: &str) -> bool { /* ... */ }

pub fn run_argv(pane_id: &str, id: &str) -> Result<Vec<String>, InvalidId> {
    if !is_valid_id(id) {
        return Err(InvalidId(id.to_string()));
    }
    Ok(vec!["pane".into(), "run".into(), pane_id.into(),
        format!("claude '/fgOS:pick {id}'")])
}
```

## 4. Parse the new pane's id from the real response shape, fixture-tested

`pane split`'s response nests the new pane's id at `result.pane.pane_id`
— capture a real response as a test fixture rather than guessing the
shape from the schema alone (server-side response wrapping isn't always
obvious from the request struct):

```rust
#[test]
fn parse_split_pane_id_reads_the_real_herdr_response_shape() {
    let response = r#"{"result":{"pane":{"pane_id":"wS:p16", ...}}}"#;
    assert_eq!(parse_split_pane_id(response).as_deref(), Some("wS:p16"));
}
```

## 5. Smoke-test the real mechanism without spawning a nested agent

When the program you're launching is itself an interactive agent (here,
`claude`), a full live test from inside another agent session risks
spawning a real nested session with real side effects. Decompose the
smoke test instead of skipping it:

- Run the real `pane split` + `pane run` sequence live, but substitute a
  harmless command (`echo ...`) for the actual target program, proving
  the pane-open/typed-input mechanics end to end.
- Separately unit-test the response-parsing and argv-building logic
  against real captured fixtures (step 4).
- Exercise the actual compiled binary live too: `herdr plugin pane open`
  the real dashboard, then `herdr pane read <pane_id> --format ansi` to
  confirm real data renders and `herdr pane send-keys <pane_id> Down`
  moves the selection (visible as an ANSI `\e[7m` reverse-video code in
  the read-back) — stopping short of the actual `Enter` keypress that
  would trigger the real nested launch.

This combination is a genuine live proof of every piece except the exact
moment the target program starts, without needing to interact with (or
tear down) a second, unwanted agent session.
