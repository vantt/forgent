# plan — tsk-4iz: herdr-plugin claude launch missing `--model`

Mode: tiny — one file (`herdr-plugin/src/pick.rs`), one direct mechanical
change (thread a new `--model` segment through two existing pure argv
builders the same way `skip_permissions` already threads through them).
Flag count against `fgos-routing`'s Mode gate: 1 (`existing covered
behavior` — the change touches string literals six existing unit tests
already assert on). 0-1 flags with a single touched file → tiny, not
small: no gray area, no design choice left open (CONTEXT.md D1-D3 already
lock scope/config-shape/default).

## Approach

Mirror `skip_permissions_enabled()` (`pick.rs:75-80`) exactly, per
CONTEXT.md D2:

1. Add `model_flag() -> String`, same shape as `skip_permissions_enabled`:
   read `FGOS_HERDR_MODEL` from env once per call (never cached), default
   `"sonnet"` per CONTEXT.md D3.
2. Thread the resolved value as a plain `&str` parameter into the two pure
   argv builders — `run_argv_for_command` (`:92-108`) and `loop_run_argv`
   (`:140-147`) — never read from env inside them, same testability
   discipline `skip_permissions: bool` already gets.
3. Insert `--model <model>` into both `format!()` command strings, e.g.
   `claude --model {model} --dangerously-skip-permissions '...'` (flag
   ordering is an implementation detail CONTEXT.md left open — any
   ordering the `claude` CLI accepts is fine; pick one and keep it
   consistent across both builders).
4. Update the four public wrapper fns that call these builders —
   `run_argv`, `discover_run_argv`, and the three `loop_run_argv` callers
   (`run_merge_loop`, `run_retro_loop`, `run_cleanup_loop`) — to resolve
   `model_flag()` at the same call sites where `skip_permissions_enabled()`
   is already resolved today (`open_pick_pane`, `open_discover_pane`,
   `open_auto_discover_pane`, and the three `run_*_loop` fns), and pass it
   through.
5. Update the existing in-file unit tests (`mod tests`, `pick.rs:383+`)
   that assert exact command strings — `launch_agent_run_argv_includes_
   skip_permissions_by_default`, `launch_agent_run_argv_omits_skip_
   permissions_when_disabled`, `discover_run_argv_includes_skip_
   permissions_by_default`, `discover_run_argv_always_includes_autoclose`,
   `loop_run_argv_respects_skip_permissions_false`, `loop_run_argv_builds_
   the_cleanup_loop_command` — to include the new `--model` segment in
   their expected output. Add one new test asserting `FGOS_HERDR_MODEL`
   overrides the default, mirroring however `skip_permissions_enabled`'s
   own env-override behavior is tested today (env-var tests in this file
   already exist for the skip-permissions case — same pattern applies).

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `run_argv_for_command`/`loop_run_argv` string format | low — pure string formatting, no control-flow change | `cargo test --manifest-path herdr-plugin/Cargo.toml pick::` (updated assertions) |
| Existing test string-literal drift | low — mechanical, compiler+test failure is immediate and precise | same test run above catches every stale assertion |
| Callers outside `pick.rs` | none found | GitNexus `impact(run_argv_for_command, upstream)` (see CONTEXT.md) found zero callers outside this file; `impact-analysis: degraded` (index 625 commits behind HEAD) but corroborated by an independent, current `grep` scout — trusted |

No medium/high risk identified — no additional proof point needed beyond
the verify command itself.

## Files touched

- `herdr-plugin/src/pick.rs` — only file. New `model_flag()` fn, updated
  `run_argv_for_command`/`loop_run_argv` signatures and their four call
  sites, updated/added unit tests.

## Split decision

No split — one honest piece of work, entirely within one file, already
tiny.

## Outstanding questions

None
