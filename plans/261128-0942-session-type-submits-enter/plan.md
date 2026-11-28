---
contract: plan-v1
title: "fgos session type submits what it types, or refuses by name"
status: ready
priority: P1
blockedBy: []
footprint:
  - plans/261128-0942-session-type-submits-enter/**
  - packages/agent-protocol/rust/src/terminal/claude.rs
  - packages/agent-protocol/rust/src/terminal/codex.rs
  - packages/agent-protocol/rust/src/terminal/agy.rs
  - packages/agent-protocol/rust/src/terminal/pi.rs
  - packages/agent-protocol/rust/src/terminal/omp.rs
  - packages/agent-protocol/rust/tests/terminal_vectors.rs
  - packages/agent-protocol/contracts/fixtures/terminal/**
  - packages/mailbox/contracts/adapters.v1.json
  - packages/mailbox/rust/store/tests/nudge_typed.rs
  - packages/session-host/rust/src/pane_io.rs
  - packages/session-host/rust/tests/typed_wake.rs
  - apps/fgos/src/wiring/mailbox_verbs/typed_wake.rs
  - apps/fgos/src/wiring/supervision.rs
  - apps/fgos/tests/supervision_verbs.rs
  - packages/run-supervisor/rust/tests/fixtures/fake-herdr-pane.py
  - src/cli/command-registry.mjs
  - packages/host-runtime/contracts/command-routes.json
  - packages/host-runtime/contracts/command-manifest.json
  - packages/host-runtime/contracts/command-route-annotations.json
  - docs/platform/supervision/spec.md
  - docs/platform/session-host/spec.md
  - docs/platform/agent-mailbox/spec.md
  - core/skills/fgos-supervisor/SKILL.md
  - .agents/skills/fgos-supervisor/SKILL.md
  - plugins/fgOS/skills/fgos-supervisor/SKILL.md
  - changelog.d/261128-0942-session-type-submits.md
base: 89a347aeab781be7070386e1992a03b3110f2d07
source:
  - plans/discussions/ds-itzp2debmh-session-type-submits-enter/DISCUSSION.md
  - p-nroysfhtso
  - p-cdsvrsfnui
  - p-lfwmzs6zsr
created: 2026-11-28
---

# fgos session type submits what it types, or refuses by name

The supervisor wakes a stuck head with `fgos session type`, but the verb only pastes the line and answers
`typed: true`, so the line sits unsent in the head's input box and the head stays stuck
(DISCUSSION.md §2, D1). This plan routes the verb through the one session-host gate-and-submit call that the
mailbox typed wake already uses (`PaneIo::typed_wake`, landed by plan `261125-2313` phase 5). It makes that call
submit the line by the CLI profile and confirm that the CLI took it (D2, D3).

Mode: standard. One fault in three source rows (`p-nroysfhtso`, `p-cdsvrsfnui`, `p-lfwmzs6zsr`), one plan.

## Outcome

`fgos session type <head> --text <t>` submits the line, so the head acts on it. The answer is
`{session, submitted: true}` only when the pane shows the CLI took the line. Otherwise the verb refuses by name:
`dialog-open`, `busy`, `composer-not-empty` (with the draft quoted), `foreground-not-agent`, `no-cli-profile`,
`unknown` (when the pane or the CLI version cannot be judged), or `delivery-unknown` (the line was typed but its
submit was not confirmed). It never answers `typed: true` for text left unsent (D6). `--no-enter` keeps the old
type-only path and answers `held` (D5). The mailbox typed wake goes through the same call, and its own rules stay
unchanged.

## Acceptance criteria

1. [core] Owning proof in `packages/session-host/rust/tests/typed_wake.rs`, against its fake `Panes`, for each
   CLI profile (claude, codex, agy, pi, omp): the call sends the text raw, waits that profile's `enter_gap_ms`,
   then sends a separate `Enter`. It never relies on a newline inside the pasted text. The answers `submitted`,
   `composer-not-empty` (draft quoted), `dialog-open`, `busy`, `foreground-not-agent`, `no-cli-profile` and
   `delivery-unknown` are each proven. Command: `cargo test -p fgos-session-host --test typed_wake`.
2. [core] One wiring proof in `apps/fgos/tests/supervision_verbs.rs`: the verb's JSON reports `submitted: true`, or
   the refusal cause, and never `typed: true`. Command: `cargo test -p fgos --test supervision_verbs`.
3. [core] `fgos session type <head> --text <t> --no-enter` keeps the type-only path (`TerminalCore::type_text`),
   and its answer says `held: true`. The existing `type_text_sends_text_exactly_once_via_pane_send_text` test stays
   as that path's proof. The same `supervision_verbs` run proves the answer.
4. [core] Live check: on a real Claude Code head, `fgos session type` with a check line makes the head start a turn
   without a second `\r`. The quoted screens before and after go in
   `plans/261128-0942-session-type-submits-enter/reports/live-check.md`, together with the O1 answer (whether herdr
   `pane send-text` replaces or appends to existing composer text).
5. [core] `npm test` and `cargo test --workspace` are green. One changelog fragment,
   `changelog.d/261128-0942-session-type-submits.md`, names the new `submitted` answer and `--no-enter`. It is
   assembled into `CHANGELOG.md` `[Unreleased]` at release (`changelog.d/README.md`). The supervisor skill's wake
   step says the verb submits, and what to do on each refusal. It carries no "type `\r` alone" workaround: none is
   in `core/skills/fgos-supervisor/SKILL.md` at `base`, and none is added.
6. [core] Each terminal profile's `pinned_version` equals the version of that CLI installed on the machine that runs
   the live check. The composer vectors in `packages/agent-protocol/contracts/fixtures/terminal/<cli>/` are recorded
   at that version, and pi and omp get a real `composer_state` in place of the always-`Unknown` one. Command:
   `cargo test -p fgos-agent-protocol --test terminal_vectors`.

Criterion 6 is not in the discussion's hand-off. It is required for criteria 1 and 4: `typed_wake` refuses
`unknown` whenever the head's CLI version differs from the profile pin (`pane_io.rs:49`). Claude Code on this
machine is `2.1.332`, while the pin is `2.1.302` (`terminal/claude.rs:8`). And pi and omp return
`ComposerState::Unknown` for every screen (`terminal/pi.rs:20`, `terminal/omp.rs:23`), so the gate refuses before
typing. Without criterion 6, the verb would refuse on every live head, and pi and omp could never be proven to
submit. It re-proves existing profiles and adds no mechanism (RUL104).

## Non-goals

- A new wake channel, or changing the mailbox typed wake's own rules: no typing into a non-empty composer, one
  outstanding nudge, and the mailbox's `typedNudges` CLI list is unchanged apart from moved versions.
- Keys or dialog answers through `session type`.
- Clearing the leftover drafts in live heads today (O2). That is a one-time manual job for the supervisor.
- Changing `terminal-control`, which stays CLI-agnostic (D2).
- The prompt door. Criterion 1 of the hand-off allows "a separate `Enter`, or one prompt-door send where the
  profile says so". This plan takes the first branch for every profile, because the prompt door
  (`herdr agent prompt`) moves focus. The agent-mailbox spec measured this (`docs/platform/agent-mailbox/spec.md`
  §15.8 rule 4, and the `deliver_brief` warning there), and a focus move would break the typed wake's own rule, which
  the discussion keeps (non-goal). Raw text, then the profile gap, then `Enter` is already measured to submit on
  codex 0.163.0 and agy 1.4.2 (`adapters.v1.json` `typedNudges`). The confirm step catches a swallowed `Enter`.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| `PaneIo::typed_wake` grows into the gate-and-submit call: profile gap, separate `Enter`, confirm, named causes | `session-host` | survivor: `PaneIo::typed_wake`; retired: the fixed 300 ms gap and the bare `Typed` answer in `packages/session-host/rust/src/pane_io.rs` |
| `fgos session type` submits through that call; `--no-enter` flag; `submitted` / `held` answers | `session-host/head-permissions.v1` | The verb wiring stays in `apps/fgos/src/wiring/supervision.rs`. The head-permissions row `session type` is unchanged and its args are not restricted |
| Re-pinned profiles, and `composer_state` for pi and omp | `agent-protocol` | Existing profile fields. No new field |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Re-prove the terminal profiles on the installed CLIs](phase-01-reprove-terminal-profiles.md) | - | packages/agent-protocol/rust/src/terminal/claude.rs, packages/agent-protocol/rust/src/terminal/codex.rs, packages/agent-protocol/rust/src/terminal/agy.rs, packages/agent-protocol/rust/src/terminal/pi.rs, packages/agent-protocol/rust/src/terminal/omp.rs, packages/agent-protocol/rust/tests/terminal_vectors.rs, packages/agent-protocol/contracts/fixtures/terminal/**, packages/mailbox/contracts/adapters.v1.json, packages/mailbox/rust/store/tests/nudge_typed.rs, plans/261128-0942-session-type-submits-enter/reports/phase-01-capture.md | 1 | ready |
| 2 | [Session type submits through the shared pane call](phase-02-session-type-submits.md) | - | packages/session-host/rust/src/pane_io.rs, packages/session-host/rust/tests/typed_wake.rs, apps/fgos/src/wiring/mailbox_verbs/typed_wake.rs, apps/fgos/src/wiring/supervision.rs, apps/fgos/tests/supervision_verbs.rs, packages/run-supervisor/rust/tests/fixtures/fake-herdr-pane.py, src/cli/command-registry.mjs, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-route-annotations.json, plans/261128-0942-session-type-submits-enter/reports/phase-02-impact.md | 1 | ready |
| 3 | [Docs, supervisor skill and changelog](phase-03-docs-skill-changelog.md) | - | docs/platform/supervision/spec.md, docs/platform/session-host/spec.md, docs/platform/agent-mailbox/spec.md, core/skills/fgos-supervisor/SKILL.md, .agents/skills/fgos-supervisor/SKILL.md, plugins/fgOS/skills/fgos-supervisor/SKILL.md, changelog.d/261128-0942-session-type-submits.md | 1 | ready |
| 4 | [Integration, gates and live check](phase-04-integration-live-check.md) | 1, 2, 3 | plans/261128-0942-session-type-submits-enter/reports/integration.md, plans/261128-0942-session-type-submits-enter/reports/live-check.md, plans/261128-0942-session-type-submits-enter/reports/closing.md | 2 | ready |

The three wave-1 phases own disjoint paths. Phase 2's tests read the pin through
`adapter_for(cli).pinned_version()` and never as a literal, so phase 1's version moves do not touch phase 2's
files. Phase 3 writes the locked behaviour from DISCUSSION.md §6 and needs no code from phase 2. The
generated files are hot and each has one writer: `command-*.json` belongs to phase 2 and is regenerated by
`node scripts/export-command-selectors.mjs`, and the two generated skill copies belong to phase 3 and are
regenerated by `npm run build:skills`.

## Unattended run

### Host steps

| step | argv | executor |
|---|---|---|
| phase 1: name a live idle head per CLI, or the throwaway one started for the capture | fgos session list --json | supervisor |
| phase 1: start the throwaway capture head for the half-typed frame | fgos session start <persona> --name <capture-name> | supervisor |
| phase 1: allow typing into the capture head (open event naming it) | fgos supervisor raise --kind coordination-help --ref session:<capture-head> --reason "terminal profile capture" | supervisor |
| phase 1: capture the idle-empty and working frames | fgos session read <capture-head> --lines 60 --json | supervisor |
| phase 1: make the half-typed frame on the throwaway head (release at `base`, type-only) | fgos session type <capture-head> --text "profile capture draft, do not act" | supervisor |
| phase 1: stop the throwaway capture head | fgos session stop <persona> --name <capture-name> --reason "terminal profile capture done" | supervisor |
| phase 4: full gate on the integrated tree | fgos release check --worktree <integration-worktree> | lead |
| phase 4: activate the landed release on the live-check machine | fgos release run | supervisor |
| phase 4: open event naming the live-check Claude head | fgos supervisor raise --kind coordination-help --ref session:<claude-head> --reason "session type live check" | supervisor |
| phase 4: screen before | fgos session read <claude-head> --lines 40 --json | supervisor |
| phase 4: the check line | fgos session type <claude-head> --text "Live check of session type: reply with the single word ok." --json | supervisor |
| phase 4: screen after | fgos session read <claude-head> --lines 40 --json | supervisor |

The throwaway capture head of phase 1 is only for the half-typed frame. A live head's composer is never drafted
into. Phase 1 names how the head was started in its report. The CLI of a head comes from seat binding, and a plan
pins no executor.

### Cleanup

Standing rule. In addition, the throwaway capture head of phase 1 is stopped by its last host step.

### Beyond the rule

None.

### Split

The work splits by component boundary into three parallel phases (agent-protocol profiles, session-host call with
the verb, docs) and one integration phase, with no staged releases, because each piece is reversible by one
revert and touches no state outside the worktree before it lands.

## Owner questions

None. Every point is settled in DISCUSSION.md (D1 to D6). The prompt-door choice and criterion 6 follow from
measured facts already in the repo, cited above (D-ADR0030: decide and report).

## Outstanding questions

None.

## Risks and rollback

| Risk | Proof point | Handling |
|---|---|---|
| No granted verb returns the herdr inspection detail that a `.insp.json` fixture holds | Phase 1, step 2 | `session read` gives the screen. If the inspection detail cannot be captured, phase 1 records the frames whose inspection it can derive, raises `coordination-help` for the rest, and does not invent fields |
| fg-server and fg-server2 run different CLI versions, but a profile has one pin | Phase 1 step 1, and phase 4 | Pin the version of the machine that runs the live check, and name the other machine's version in the report. A head on the other version is refused `unknown`, which is safe |
| The confirm step misreads a slow CLI as `delivery-unknown` | Phase 2 fake cases, and the phase 4 live check | Reuse `Terminal::confirm_submitted` and its bounds instead of a new loop. The live check shows the real timing |
| Moving the mailbox typed wake to the profile gap (codex 600 ms instead of 300 ms) changes its timing | `nudge_typed.rs`, and the typed wake cases in `typed_wake.rs` | Slower is safe for the wake. No rule changes |
| A person's half-typed text gets submitted | `composer-not-empty` and `unknown` cases | The gate refuses unless two observations show an empty composer (D4). That gate is unchanged |

Rollback: revert the landed merge commit of the plan. Nothing outside the repository changes before land, except
the phase 1 capture head, which is stopped. After rollback, `session type` is back to type-only.
