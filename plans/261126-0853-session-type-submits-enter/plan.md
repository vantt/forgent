---
contract: plan-v1
title: "fgos session type submits what it types, or refuses by name"
status: draft
priority: P1
blockedBy:
  - 261125-2313-head-communication-agent-to-agent
  - 261124-2143-head-lifecycle-events
  - 261125-2315-head-mail-knowhow-in-skills
footprint:
  - plans/261126-0853-session-type-submits-enter/**
  - packages/session-host/rust/src/pane_io.rs
  - packages/session-host/rust/tests/typed_wake.rs
  - apps/fgos/src/wiring/supervision.rs
  - apps/fgos/tests/supervision_verbs.rs
  - src/cli/command-registry.mjs
  - packages/host-runtime/contracts/command-manifest.json
  - docs/platform/supervision/spec.md
  - core/skills/fgos-supervisor/SKILL.md
  - .agents/skills/**
  - plugins/fgOS/skills/**
  - .claude/skills/**
  - CHANGELOG.md
base: 2dc4d5ec6cbfe3224cee18b7c476087207e83879
source:
  - plans/discussions/ds-itzp2debmh-session-type-submits-enter/DISCUSSION.md
  - p-nroysfhtso
  - p-cdsvrsfnui
  - p-lfwmzs6zsr
created: 2026-11-26
---

# fgos session type submits what it types

Answers the settled discussion `plans/discussions/ds-itzp2debmh-session-type-submits-enter/DISCUSSION.md`
(D1 to D6). The three source rows are one fault: the verb pastes the line and never submits it, yet answers
`typed: true` (D1).

## Outcome

`fgos session type <head> --text <t>` submits the line, so the head starts a turn on it. The answer is
`{session, submitted: true}` only when the pane shows the line was taken. Otherwise the verb refuses by name
(`composer-not-empty` with the draft quoted, `dialog-open`, `busy`, `foreground-not-agent`, `no-cli-profile`,
`delivery-unknown`) and never answers `typed` for unsent text (D6). `--no-enter` keeps today's type-only path
and answers `held` (D5).

## Acceptance criteria

1. Owning proof, `packages/session-host/rust/tests/typed_wake.rs` against the fake panes: for each profile a head
   runs (claude, codex, agy, pi, omp) the shared gate-and-submit call sends the text, waits the profile's
   `enter_gap_ms`, then sends a separate `Enter`, or makes one prompt-door send where `submit_by_prompt_door` is
   set. No newline inside the text is relied on. Each answer `submitted`, `composer-not-empty`, `dialog-open`,
   `busy`, `foreground-not-agent`, `no-cli-profile`, `delivery-unknown` is proven once.
   Command: `cargo test -p fgos-session-host --test typed_wake`.
2. One wiring proof in `apps/fgos/tests/supervision_verbs.rs`: the verb's JSON carries `submitted: true` or the
   refusal cause, and never `typed: true`. Command: `cargo test -p fgos --test supervision_verbs`.
3. `--no-enter` answers `held` and goes through `TerminalCore::type_text`; its existing test
   `type_text_sends_text_exactly_once_via_pane_send_text` stays as that path's proof.
4. Live check on a real Claude Code head: `fgos session type` with a check line starts a turn with no second
   `\r`. The quoted screen before and after, and the answer to O1 (does `pane send-text` replace or append to a
   draft), are in `reports/live-check.md`.
5. `npm test` and `cargo test --workspace` green; `CHANGELOG.md` `[Unreleased]` names `submitted` and
   `--no-enter`; the supervisor skill's wake step carries no "type `\r` alone" workaround and reads the answer.

## Non-goals

- A new wake channel, or any change to the mailbox typed wake's own rules (no typing into a non-empty composer,
  one outstanding nudge, focus-neutral submit).
- Keys or dialog answers through `session type`.
- Clearing the unsent drafts sitting in live panes today (O2, a one-time supervisor job).
- Any change to `terminal-control`, which stays CLI-agnostic (D2).

## Prior art

Reused: `Adapter::deliver_brief` and `Profile` (`packages/agent-protocol/rust/src/terminal/mod.rs`) for the per-CLI
submit, gap, separate `Enter`, prompt door and confirm loop; `composer_state` (plan `261125-2313` phase 3); the
session-host `PaneIo` gate-and-type call that plan `261125-2313` phase 5 adds for the typed wake (D3); the verb's
existing open-event gate in `type_into_session` (`apps/fgos/src/wiring/supervision.rs`); the shared pane lookup
`Listed::terminal_key()` that plan `261125-2315` moves `supervision.rs` onto. Missing: that call refuses only
`busy`, `composer-not-empty`, `dialog-open`, `unknown`, `no-pane`, and it submits text plus `Enter` without the
prompt door. This plan adds the profile submit and the missing causes to the same call, not a second one.

Pinned assumption (not an owner question, D2 with D3 and the typed-wake non-goal): the one call takes a submit
mode. The typed wake keeps its focus-neutral text plus `Enter`; `session type` uses the profile's submit
(prompt door where the profile sets it), because a long check line is what the prompt-door profiles swallow.
If phase 5 lands already submitting by profile, phase 1 only adds the missing causes.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Profile submit mode and the `foreground-not-agent`, `no-cli-profile`, `delivery-unknown`, `submitted` answers on the `PaneIo` gate-and-submit call | `session-host` | extends phase 5's call in `pane_io.rs`; no second typing path |
| `session type` answers `submitted` or a refusal cause; `--no-enter` answers `held` | `supervision` | the verb row in `docs/platform/supervision/spec.md`; `typed: true` is retired |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [The shared pane call submits by profile](phase-01-pane-call-submits-by-profile.md) | - | packages/session-host/rust/src/pane_io.rs, packages/session-host/rust/tests/typed_wake.rs | 1 | ready |
| 2 | [The verb submits and answers by name](phase-02-verb-submits-and-answers.md) | 1 | apps/fgos/src/wiring/supervision.rs, apps/fgos/tests/supervision_verbs.rs, src/cli/command-registry.mjs, packages/host-runtime/contracts/command-manifest.json, docs/platform/supervision/spec.md, core/skills/fgos-supervisor/SKILL.md, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/**, CHANGELOG.md | 2 | ready |
| 3 | [Live check and integration](phase-03-live-check-and-integration.md) | 1, 2 | plans/261126-0853-session-type-submits-enter/reports/live-check.md | 3 | ready |

Why `draft`: the footprint overlaps plans `261125-2313` (`pane_io.rs`, `typed_wake.rs`) and `261124-2143` (`supervision.rs`, the supervisor skill, the supervision spec), which this plan waits for by `blockedBy`, and plan `261125-1631` (the generated `command-manifest.json` and `src/cli/command-registry.mjs`). The plan contract refuses `ready` while a `ready` or `running` plan shares a path, so the plan flips to `ready` once those three are `done` (or `261125-1631` has landed its manifest phase and narrowed its footprint). That flip needs no new decision: rerun `node scripts/plan-contract-check.mjs --plan plans/261126-0853-session-type-submits-enter` and land `plan.md` alone with `status: ready`.

Layers stay serial: the session-host call (phase 1) lands before the supervision wiring above it (phase 2). The
hot files (CHANGELOG, generated manifest, skill renders) belong to phase 2 alone. Each phase is `code:implement`
except phase 3, which is `code:test`.

## Owner questions

None. Every point was settled by analysis in the discussion (D1 to D6); O1 is answered by phase 3's live check
and changes no decision (D4); O2 is outside this plan.

## Risks and rollback

- Phase 5 of plan `261125-2313` lands a call shaped differently than expected. Phase 1 reads the landed call first
  and extends it in place; it never adds a parallel call.
- Prompt-door submit takes focus from a person watching the pane. Only `session type` uses it, on a head an open
  supervision event names as stuck; the typed wake keeps its focus-neutral mode.
- `composer_state` false `empty` on two contrived screens (phase 3 of plan `261125-2313`): the call re-observes
  right before typing, and the live check covers a real head.
- Rollback: revert phase 2's commit to restore the old verb answer; revert phase 1's commit to restore the call.
  No data or store format changes.

## Outstanding questions

None
