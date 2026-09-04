---
authoritative_for: herdr-spawn adapter launching a dispatched worker inside a real Herdr pane instead of a stdout-captured subprocess, so a person can watch the agent work; hard constraint always create a fresh pane (herdr pane split) and never reuse an existing one, because herdr pane run/send-text types into whatever process currently holds the pane and a finished worker's pane keeps an idle interactive REPL alive since tsk-1zq dropped --autoClose, so reuse would deliver the next dispatch as a chat message into someone else's live session
---

# Watching an agent work in a real pane, without letting the next dispatch talk to a stranger's session

`tsk-5x7-3` is the third of `tsk-5x7`'s three dependency-free children —
the `herdr-spawn` adapter, satisfying the one real immediate need D6
carved out from the larger redesign: let a person watch a dispatched
agent work in a real terminal pane instead of a blind stdout capture.

## What shipped

A `herdr-spawn` entry was added to `EXECUTOR_ADAPTERS`
(`transport.mjs`), launching the worker inside a Herdr pane instead of a
stdout-captured subprocess. Selected purely by `executor.adapter` — the
executor keeps `invocations[].via: "cli"` unchanged, so `resolve.mjs:280`'s
existing cli gate passes unchanged and no protocol work was required:
`transport.mjs:148` already read `executor.adapter ?? DEFAULT_ADAPTER`
before this item (the same route `tsk-49o` separately proposes
`sandboxed-cli-spawn` through). Results still come back through the
existing confidence ladder — structured if present, else the
`[DONE]`/`[BLOCKED]` token, else `headBefore`/`headAfter` git inference —
this piece introduces no new result protocol and makes no telemetry claim.
`cli-spawn` stays byte-identical: purely additive, opt-in per executor.

## The hard constraint that made this safe

Validating surfaced live evidence (`tsk-1nih`) of a real danger: `herdr
pane run`/`send-text` types into whatever process currently holds the
target pane. Since `tsk-1zq` dropped `--autoClose`, a finished worker's
pane keeps an idle interactive agent REPL alive. If this adapter reused an
existing pane instead of creating a fresh one, the next dispatch would be
delivered as a **chat message into someone else's live session** — with an
item parked at `awaiting-human` as the sharpest failure case (a real
person's answer landing in the wrong conversation).

The resulting hard constraint: this adapter must ALWAYS create a fresh
pane (`herdr pane split`) and must NEVER reuse an existing one, and must
never verify a target pane's foreground process as a substitute for
creating a fresh one. Completion is observed via `herdr pane wait-output
--regex` plus `herdr pane read`, rather than assuming a captured stdout
stream exists the way `cli-spawn` can.

## The other locked constraint this item still had to satisfy

Per `tsk-5x7`'s D2, a surviving hard constraint required a test asserting
that a Herdr runtime signal ALONE never changes task status, review
outcome, blocker resolution, or artifact acceptance — only real fgOS state
transitions do. Herdr stays a visibility/runtime transport, never a
second source of truth for task lifecycle.

## Landing note

Merged into `fgw/tsk-5x7` (the parent's own integration branch) — a
decomposed child, carried to main via the parent's own `sync-root`.

## Generalizing beyond the first target CLI (`tsk-5jl`)

`tsk-5jl` generalized `herdrSpawnAdapter` so ANY agent CLI (`claude`,
`agy`, `codex`, `pi`) can be launched via a real Herdr pane purely by
config, achieving two goals at once: live TTY visibility matching each
CLI's real streaming behavior, and a correct synchronous
`{status, stdout}` result for the dispatch ladder, with the pane
auto-closed once truly done. It also fixed a real gap in the original
adapter: the success path never closed the pane (only a timeout did) —
`herdr pane close <paneId>` now runs on success too.

**Per-CLI streaming behavior, researched not guessed:** Claude Code's
`-p` text mode buffers with no live output until done (per its own
headless docs), but does exit with a real subprocess exit code;
`--output-format stream-json --verbose --include-partial-messages`
streams live but as JSON-lines needing translation. `agy`'s own `-p`
headless mode already streams live plain text natively (already
live-verified in this repo). `pi --mode json` emits a real
`AgentSessionEvent` JSONL stream (evidence fixtures already existed under
`docs/history/pi-executor-runtime-capacity/evidence/`). `codex exec`'s
live-streaming default was left explicitly UNVERIFIED — treated as
unknown, never guessed.

**What shipped:** an optional `liveOutput: { streamFlags, renderer }`
field on an executor invocation (validated in `config.mjs`, consumed in
`transport.mjs`). When present: `streamFlags` are appended to args, the
wrapper script's shebang switches `sh` → `bash` (needed for
`${PIPESTATUS[0]}`), the command pipes through `tee <raw-jsonl> | node
<renderer>`, and the real exit code is captured via `PIPESTATUS[0]`. When
absent: byte-identical to the pre-existing behavior — no regression. Two
renderer scripts were added under `src/runner/dispatch/live-renderers/`:
`claude-stream-json.mjs` and `pi-agent-session.mjs`, the latter built
against the real evidence fixtures already captured for `pi`.

**Config wiring:** `executors.agy` renamed to `executors.agy-cli`
(every other reference to the old id updated repo-wide); a new
`executors.agy-herdr` (adapter `herdr-spawn`, no `liveOutput`) made
ACTIVE, with `capabilities.fgos-coding-implement.prefer` rewired to it,
replacing `claude-herdr`. `claude-herdr` gained `liveOutput` but stayed
dormant/unreferenced; new `executors.pi-herdr` (with `liveOutput`/renderer)
and `executors.codex-herdr` (no `liveOutput`, streaming unverified) were
both added dormant, each with a description explaining how to activate it.

**Required proof, not mocked:** beyond the mocked regression tests for
pane-close-on-success and the `liveOutput`/`PIPESTATUS` pipeline, the item
required dispatching one real fgOS work item through `executors.agy-herdr`
against the actually-installed `herdr` and `agy` binaries — confirming
live pane visibility, auto-close on completion, correct real
`status`/`stdout`, and that the dispatched item's own fgOS state actually
advanced. This item also explicitly consolidates and supersedes `tsk-3d5`
(an earlier empty placeholder with the same stated goal).

The existing `herdrSpawnAdapter` return contract
(`{status, stdout, paneId}`) was preserved exactly for the no-`liveOutput`
default path — this generalization is additive, never a breaking change
to the adapter this doc's own earlier section (`tsk-5x7-3`) shipped.
Scope stayed bounded to the adapter + config + renderers + tests + one
real live proof — `herdr-plugin/src/*.rs` itself was never touched.

## Why the config wiring had to land as a separate hand-edit commit on main (`tsk-2ii`)

`tsk-5jl`'s own worker branch could not carry its `.fgos/config.json`
change to completion: ADR0020 blocks any worker branch from committing a
change under `.fgos/` at all (`docs/how-to/fix-fgos-write-rejected-merge-block.md`,
precedent `tsk-5ge`/`tsk-28o`). The config content itself — the
`executors.agy` → `executors.agy-cli` rename, the new ACTIVE
`executors.agy-herdr` (`capabilities.fgos-coding-implement.prefer`
rewired to it), and the three dormant `claude-herdr`/`pi-herdr`/
`codex-herdr` entries — was already fully validated inside `tsk-5jl`'s own
worktree during development (valid JSON, passed
`loadRunnerConfigFromDir`, real live-tested against the `agy-herdr` path).
`tsk-2ii` landed that exact, already-proven content as a plain
single-parent commit directly on `main` (commit `b32ec6fa`), the same
shape `tsk-5ge` used for its own `.fgos/`-touching change — never through
a worker branch. The first landing attempt hit a `verify-miss` friction
event (goal-check failed on `main`, exit 1); the retry passed, confirming
`agy-herdr` wiring live and `npm test` green.

## A second, opt-in completion-detection mode for real interactive TUIs (`tsk-10j`)

`tsk-5jl`/`tsk-2ii` deliberately kept `agy-herdr` on `agy -p` (headless)
rather than `agy -i` (real interactive mode), because `-p` gives a
deterministic subprocess exit code the sentinel mechanism needs, at the
cost of a plain non-interactive-looking pane. `tsk-10j` designed and
shipped a second, config-selected completion-detection path so a person
watching the pane sees `agy`'s real rich TUI (banner, live spinner,
box-drawn status bar) instead of a `-p` text dump, while still returning
a correct, deterministic `{status, stdout}`.

**What was live-verified before design, not guessed:** `agy -i` never
exits on its own after answering (process stays alive, sitting at its own
"? for shortcuts" idle prompt) — confirmed by process listing. Asking the
model itself to run `/exit` fails; `agy` explicitly refuses ("I cannot
directly execute slash commands"), confirming slash commands are
UI-input-layer only. An *external* `herdr pane run` typing `/exit` into
the pane from the herdr side, after the model goes idle, does make the
process genuinely terminate, returns to a plain shell prompt, and a
follow-up pane-run echoing the shell's own exit status captures the real
underlying exit code. Naively grepping the pane's raw text for a
first-match completion token is unreliable the same way the pre-`tsk-5jl`
sentinel design already learned: an instruction like "print token X when
done" gets echoed into the pane by the interactive UI itself, producing a
false-positive match while the model is still visibly generating — the
real completion only shows up as the *second* occurrence, correlating
with the status bar's own "Generating…"/"Working…" → idle transition. The
item's own discovery-stage research found the reliable signal instead:
`herdr pane list`/`get` exposes a structured `agent_status` field
(`"working"` → `"idle"`) for the pane's detected foreground process — any
correct implementation of this mode must anchor on that structured field,
never raw-text token matching.

**Shape of what shipped:** an adapter-driven two-phase sequence, selected
per-executor by config (`interactiveMode`, additive alongside the
existing `liveOutput` field, never a replacement): (1) type
`agy -i {prompt}` straight into the fresh pane — no disposable wrapper
script for this path, the prompt is the model's real first interactive
turn; (2) poll `herdr pane get`'s `agent_status` field for the
`working → idle` transition instead of text-matching; (3) once idle, send
a second `herdr pane run` typing `/exit`, wait for the shell prompt to
return; (4) send a third `herdr pane run` echoing a sentinel plus the
real shell exit status, parse it, close the pane. Scope stayed bounded to
`executors.agy-herdr` only — `agy`'s own verified interactive-mode/idle-
signal/external-exit behavior does not automatically generalize to
`claude-herdr`/`pi-herdr`/`codex-herdr`, each of which would need the same
kind of live verification separately before adopting this mode. The
existing sentinel-based default path (what every other executor still
uses) is untouched — this is a new, additional, opt-in detection mode.

Landed via `fgw/tsk-10j` (merged `761cc571`); the Iron Law gate required
proof and was satisfied via `--acknowledge-iron-law` with a
failing-test-first sequence across `config.mjs`/`resolve.mjs`/
`transport.mjs`/`cli.mjs`. First return attempt hit the same detached-
worktree `.fgos/`-presence `verify-miss` friction pattern documented
elsewhere in this doc's own `tsk-2ii` section; the retry passed clean.
