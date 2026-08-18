---
type: explanation
title: Why herdr-plugin's discover pane launches always pass --autoClose
tags: [herdr-plugin, discover, autoclose, terminal-close]
source_capture_ids: [tsk-358]
---
# Why herdr-plugin's discover pane launches always pass `--autoClose`

`/fgOS:discover` gained an opt-in `--autoClose` flag under `tsk-3v2`,
which lets the pane close itself via `/fgOS:terminal-close` once the
driven item truly finishes. `tsk-3v2` deliberately never wired
herdr-plugin's own Rust launch code to pass that flag — its own verify
forbade touching `herdr-plugin/src/` — leaving `/fgOS:terminal-close`
dead in practice for any herdr-triggered discover session. `tsk-358` is
the deferred wiring `tsk-3v2` left behind.

## What changed

`herdr-plugin/src/pick.rs`'s `discover_run_argv` — the shared builder
behind both discover pane launch points — now always appends
` --autoClose` to the `/fgOS:discover <id>` command it types into the
launched `claude` session. Both call sites route through it: the manual
"Discover" button (`open_discover_pane`) and `tsk-2ja`'s unattended
auto-launcher (`open_auto_discover_pane`). `run_argv` (the plain `pick`
launch path) stays untouched — the flag is discover-only, confirmed by a
comment at the call site itself.

## Why both launch points get it, not just the auto one

Confirmed with the user directly: manual-button sessions should also
self-close on a real finish, the same as the auto-launcher — there is no
split behavior between the two. The alternative (auto-close only for the
unattended launcher, leave manual button sessions open) was considered
and rejected as inconsistent — a person clicking "Discover" has no more
reason to babysit a finished pane than the auto-launcher's own unattended
run does.

## Why this was purely a wiring change, not new close logic

`/fgOS:discover`'s own `$ARGUMENTS` parser already stripped a trailing
`--autoClose` token before this item — absent, behavior stayed
byte-identical to today, so the fix was "type the extra token," nothing
on the skill side needed touching. The skill-level close gate (only fires
on a real advance to `decompose` or a legitimate `awaiting-human` park,
never on `blocked`/no-progress) was already exactly what this item was
scoped to reuse as-is — no loosening, no reimplementation, only passing
the flag through from herdr-plugin's own launch call.

## What stayed out of scope

Extending `--autoClose` to any other launch mechanism — `/fgOS:pick`
itself, `/fgOS:plan`, `/fgOS:retro-next`, `/fgOS:cleanup-next` — was
explicitly out of scope, unrelated to this specific bug (the two
already-shipped discover launch points that `tsk-3v2` had to skip).

## Related

- `docs/history/herdr-discover-pane-autoclose-wiring/CONTEXT.md` — the
  full decision record (D1: both launch points get `--autoClose`).
- `docs/history/fgos-terminal-close-autoclose/CONTEXT.md` (`tsk-3v2`) —
  the item that built the opt-in flag and the close-gate, and explicitly
  deferred this wiring.
