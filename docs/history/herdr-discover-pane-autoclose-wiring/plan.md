# Plan: wire herdr-plugin's discover pane launch to pass --autoClose

**Item:** tsk-358. Mode: **small** (a few files, no gray areas — every
product decision is already locked in `CONTEXT.md` D1; 0 of the hard-gate
flags apply: no auth, authorization, data model, audit/security, external
provider, public-contract, or cross-platform change).

`fgos graph --json` shows tsk-358 outside the repo's critical path
(`criticalPath.path` has 10 items, tsk-358 not among them) and no
`topUnblock` entries reference it — there is no ordering signal to weigh;
this is a single independent piece with no split decision to make.

## Approach

Both discover-launch call sites (`open_discover_pane`, manual button;
`open_auto_discover_pane`, tsk-2ja auto-launcher) already route through the
one shared `discover_run_argv` function (`herdr-plugin/src/pick.rs:117`),
which itself delegates to `run_argv_for_command` (`pick.rs:88`) — the same
builder `run_argv` (pick) also uses. Per CONTEXT.md D1, both call sites
must gain `--autoClose`; per the item's own scope, `run_argv`/pick must
stay untouched.

**Chosen path:** give `run_argv_for_command` one new parameter,
`extra_args: &str` (empty string for the pick call site, `" --autoClose"`
for the discover call site), appended inside the single-quoted command
text right after `{slash_command} {id}`. `run_argv` passes `""`;
`discover_run_argv` passes `" --autoClose"`. This keeps the change to
exactly one function body plus its two thin callers' call sites — no
signature change to `run_argv`/`discover_run_argv` themselves (both keep
taking `(pane_id, id, skip_permissions)`), so `ports.rs`'s
`PaneOrchestrator` trait and every existing caller of either public
function (`open_pick_pane`, `open_discover_pane`,
`auto_discover_launch_argv_sequence`) needs no change beyond what already
flows through `discover_run_argv`.

**Rejected alternative:** a separate `discover_run_argv_with_autoclose`
function, called only from the two discover call sites, leaving
`discover_run_argv` itself unchanged. Rejected — it would duplicate the
whole builder for one string difference, and the plain
`discover_run_argv` would become dead code with no real caller (contradicts
CONTEXT.md's boundary: BOTH real call sites need the flag, so there is no
remaining caller that wants the flag-less version).

## Files touched

- `herdr-plugin/src/pick.rs` — `run_argv_for_command` gains the
  `extra_args: &str` parameter; `run_argv` and `discover_run_argv` each
  pass their own literal. The one existing test asserting
  `discover_run_argv`'s exact output string
  (`discover_run_argv_includes_skip_permissions_by_default`, pick.rs:486)
  gets its expected string updated to include ` --autoClose`
  (`discover_run_argv_rejects_ids_fgos_itself_would_reject`, pick.rs:500,
  only checks `Ok`/`Err` and needs no change). One new test covers the
  non-skip-permissions branch of `discover_run_argv` explicitly.

**Correction, recorded post-implementation:** this section originally
planned a NEW test to prove `auto_discover_launch_argv_sequence`'s
`run_argv` element also carries the flag. Running the real `verify`
command during implementation surfaced a PRE-EXISTING test neither this
plan's own research nor `fgos-validating`'s reality-gate citation check
had caught — `auto_discover_launch_sets_label_before_spawning_claude`
(pick.rs:580) — which already asserts that exact element and failed
against the old flag-less string. Its expected string was corrected in
place instead of adding a duplicate new test; a research/citation gap in
this plan, not a defect in the shipped code — real `cargo test` output
caught it before `fgos return`, exactly as the reality gate is meant to.

No other file needs a change: `ports.rs`'s trait signatures are unchanged,
`main.rs`'s call sites are unchanged, and the fgOS skill side
(`plugins/fgOS/skills/discover/SKILL.md`) already has both the
`--autoClose` parser and the D2 close-gate — confirmed unchanged in
CONTEXT.md's scout evidence.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `run_argv`/pick's own command shape | Low — must stay byte-identical | `cargo test launch_agent_run_argv` (existing tests, unmodified, must still pass with their exact original expected strings) |
| `discover_run_argv`'s two callers (`open_discover_pane`, `open_auto_discover_pane`) both actually receive the flag | Low — mechanical, but must be proven for BOTH, not just one | `auto_discover_launch_sets_label_before_spawning_claude`'s existing assertion on `auto_discover_launch_argv_sequence`'s output (corrected in place, see note above), alongside the updated `discover_run_argv` tests |
| Skill-level D2 close-gate | None — explicitly unchanged, already correct (CONTEXT.md scout evidence) | No new proof needed; verified by inspection already recorded in CONTEXT.md |

Impact-analysis posture: `full` (GitNexus present, freshly checked at
`fgos-coding-exploring` — see CONTEXT.md). Implementation must run `impact` on
`discover_run_argv`/`run_argv_for_command` before editing, per CLAUDE.md's
gate, to confirm no other caller beyond the two named above exists.

## Assumptions

- The flag's exact spelling/position (`--autoClose` as a trailing token,
  space-separated) matches what `/fgOS:discover`'s own `$ARGUMENTS` parser
  expects (`plugins/fgOS/skills/discover/SKILL.md:37-52`, confirmed in
  CONTEXT.md scout evidence) — not re-verified here since it is
  implementation-only and already grounded in the skill's own documented
  parsing behavior.

## No split

One honest piece — a single function-signature change plus two call-site
literals and matching tests, all in one file. Splitting further would only
add footprint-tracking overhead with no real parallelism gain.

## Outstanding questions

None
