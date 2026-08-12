# RESEARCH.md — tsk-358

## Round 1 — 2026-08-11

**Asked:** is tsk-358's goal ("wire herdr-plugin's discover pane launch to
pass `--autoClose` to `/fgOS:discover`") clear enough to leave `discovery`,
and what does the caller need to know to get there?

**Checked (repo, `rg`/direct read — every named thing in the goal is
internal, no external lookup needed):**

- `plugins/fgOS/skills/discover/SKILL.md:37-52` — `/fgOS:discover` already
  parses an optional trailing `--autoClose` token from its own
  `$ARGUMENTS` (opt-in only, `docs/history/fgos-terminal-close-autoclose/
  CONTEXT.md` D1). This is a flag on the slash-command TEXT itself, not a
  CLI/env flag — so enabling it from herdr-plugin only requires the typed
  command string to read `/fgOS:discover <id> --autoClose` instead of
  `/fgOS:discover <id>`.
- `plugins/fgOS/skills/discover/SKILL.md:148-161` — the close-gate (D2) is
  already in place and unconditional: `/fgOS:terminal-close` fires only on
  an advance to `decompose` or a legitimate `awaiting-human` park, never on
  `blocked`/no-progress. Nothing here needs to change — the item's own
  text ("must reuse the existing D2 safety gate as-is") already matches
  what exists; there is no reimplementation risk to design around.
- `herdr-plugin/src/pick.rs:88-103` (`run_argv_for_command`) — the one
  shared builder behind BOTH `run_argv` (pick, `PICK_SLASH_COMMAND`,
  pick.rs:111-113) and `discover_run_argv` (discover,
  `DISCOVER_SLASH_COMMAND`, pick.rs:117-119). It formats
  `claude '<slash_command> <id>'` (or with
  `--dangerously-skip-permissions`) — the flag needs to land INSIDE the
  single-quoted slash-command text, so a plain string-append after the
  call would not work; the builder itself needs an extra-args knob (or
  `discover_run_argv` needs its own small variant) so `run_argv`/pick
  stays byte-identical while `discover_run_argv` gains the suffix. This is
  an implementation-shape detail for `fgos-coding-planning`, not a design
  decision this research round makes.
- `herdr-plugin/src/pick.rs:177-190` (`open_discover_pane`, the manual
  Discover button) and `herdr-plugin/src/pick.rs:230-284`
  (`auto_discover_launch_argv_sequence` / `open_auto_discover_pane`, the
  tsk-2ja auto-discover launcher) — BOTH call `discover_run_argv`
  directly, no other call site exists. Confirmed via
  `rg 'discover_run_argv' herdr-plugin/src/pick.rs`: exactly the two call
  sites above plus the two existing tests. A single change inside
  `discover_run_argv` (or the shared builder, scoped to discover only)
  covers both launch points the item names — no third call site was
  missed.
- `herdr-plugin/src/pick.rs:441-503` (existing test module) — two tests
  assert the exact command string `discover_run_argv` produces today
  (`discover_run_argv_includes_skip_permissions_by_default`,
  `discover_run_argv_rejects_ids_fgos_itself_would_reject`); the first
  will need its expected string updated to include `--autoClose`, and a
  new test should assert the flag's presence explicitly — same
  `assert_eq!`-on-argv shape every existing test in this module already
  uses, nothing novel needed.
- `tsk-3v2` (done) and `tsk-2ja` (status `cleanup`) — both already read as
  deps on this item (confirmed via `fgos show` on submit); their own
  scope/verify text is consistent with what's found above (tsk-3v2's
  verify explicitly forbids touching `herdr-plugin/src/`, tsk-2ja's own
  description confirms it reuses `discover_run_argv`/`open_discover_pane`
  unchanged).

**Found:** the goal is fully mechanical and unambiguous — one Rust
function (`discover_run_argv`, or the shared helper it calls) needs to
emit ` --autoClose` inside the quoted slash-command text it already
builds, without touching `run_argv`/pick's own command shape or the
already-correct skill-level D2 gate. No unresolved unknown remains.

**Still open:** none for intent/clarity. The exact split between "add a
parameter to `run_argv_for_command`" vs. "give `discover_run_argv` its own
small builder" is an implementation choice, left to planning/implementation
— not a gap in the goal itself.

## Verdict

`clear: true`

`verify`: `cd herdr-plugin && cargo test discover -- --nocapture && cargo test launch_agent_run_argv -- --nocapture`

(`cargo test discover` covers every `discover_run_argv`/`open_discover_pane`/
`open_auto_discover_pane` test, including the updated/new `--autoClose`
assertions; `cargo test launch_agent_run_argv` re-runs the `run_argv`/pick
tests unchanged, proving pick's own command shape was not touched — the
same "prove the untouched half stayed untouched" shape tsk-3v2's own verify
used with its `! git diff ... herdr-plugin/src/` line, adapted here since
this item's whole point IS touching `herdr-plugin/src/`.)
