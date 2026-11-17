---
phase: 1
title: "Fix agy-herdr brief delivery"
status: pending
priority: P1
effort: 6h
depends_on: []
touches: repo (shared Rust crate fgos-agent-protocol, agy fixtures); optional global stopgap
---

# Phase 1: Fix agy-herdr brief delivery

## Context

`agy-herdr` ends with outcome `other`. agy runs in the pane and accepts the brief, but it takes in
a pasted 6 KB brief slowly: about 3-4 lines/s, about 18 s for the whole brief. While it ingests,
`confirm_submitted` (`packages/agent-protocol/rust/src/terminal/mod.rs:605-685`) sees state `idle`
and no recognizable draft. `draft_still_in_composer` (`terminal/common.rs:191`) matches the brief's
first or last 48 characters, a paste chip, or a two-line window (`holds_a_window`, `common.rs:220`),
and the composer that is mid-ingest shows none of them. After `SUBMIT_NO_DRAFT_POLLS` (4) polls of
`POLL_MS` (700) (`common.rs:15,24`), the loop calls `brief_echoed` (`mod.rs:715-724`, first or last
24 characters). That finds nothing either, so the loop returns `DeliveryUnknown` (`mod.rs:657-668`).
The supervisor then cancels the attempt with `terminal:delivery-unknown`, about 17-25 s after start.

The agy profile types the brief and then presses Enter (`terminal/agy.rs:11`,
`submit_by_prompt_door: false`). That path is `deliver_brief` (`mod.rs:563-575`): `type_brief`,
then `enter_gap_ms` (300), then `press_enter`. The Enter key sits in the pty after the text, so agy
submits once ingestion finishes. Today's evidence matches this: a 6.5 KB filler brief typed by hand
was processed correctly after ingestion ended (idle, then working, then done).

The crate is shared by all five CLIs (`terminal/{agy,claude,codex,omp,pi}.rs`). Existing vectors:
`packages/agent-protocol/contracts/fixtures/terminal/<cli>/vectors.json`, run by
`packages/agent-protocol/rust/tests/terminal_vectors.rs:198` (`terminal_every_cli_vector_resolves_as_recorded`).
They are also read by `packages/run-supervisor/rust/tests/supervise_terminal_fake_herdr.rs` and
`test/run-supervisor/support/terminal-harness.mjs`.

## Requirements

- An agy pane that is still ingesting a long brief counts as "not judged yet", never as
  `DeliveryUnknown`.
- No change in outcome for any existing vector of any CLI.
- No new run-time option. A profile field is allowed only if the general rule fails a vector.

## Candidate fixes

- **(a) Prompt door for agy.** Set `submit_by_prompt_door: true` in `agy.rs`. The brief then goes
  through `herdr agent prompt <pane> <text>` (`packages/terminal-control/rust/src/driver/herdr.rs:752-760`).
  This fixes the problem only if herdr waits for ingestion before it returns or submits. After the
  send, `confirm_submitted` runs the same loop, so if agy is still ingesting, the same 4-poll exit
  fires. Supporting fact: the exit command already goes through the prompt door for every CLI
  (`packages/run-supervisor/rust/src/supervise/terminal.rs:1016-1028`), so herdr knows agy panes.
- **(b) Patient confirm loop (general).** In the idle, no-draft branch of `confirm_submitted`:
  return `Delivered` first when `brief_echoed`, as today. If the screen differs from the previous
  poll, the TUI is still drawing (ingestion), so the no-draft counter does not advance. Only still
  screens count toward `SUBMIT_NO_DRAFT_POLLS`. The loop stays bounded by `SUBMIT_CONFIRM_MS` (60 s,
  `common.rs:29`). Gain: it fixes the cause for every CLI, with no new knob. Risk: an idle screen
  that never stops changing (a ticking clock) now fails at 60 s instead of about 3 s. The outcome is
  the same, only slower.
- **(b') agy-scoped patience.** Same rule, but only for profiles that declare it. Fallback only, if
  (b) changes any existing vector.
- **(c) Config stopgap (decision D6).** Set `promptDelivery: file-pointer` on the global `agy-herdr`.
  A one-line pointer to `brief-<round>.md` is typed instead (`herdr-round.mjs:307-317`). Short
  prompts are confirmed fine today. Cost: a person watching the pane no longer sees the full brief.
  This is a stopgap, not the fix.

## Steps

1. **Worktree.** `fgos worktree create ../forgentX-wt-agy-delivery --branch fix/agy-brief-ingest --base main`.
   Copy `node_modules` with `cp -al`, never symlink it. Give the worktree its own `CARGO_TARGET_DIR`.
   Announce one quiet IO window before building.
2. **E1, record ingestion screens (no quota).** Find today's per-second samples first. Search
   `.fgos/runtime/tmp/`, the failing run's directory under `.fgos/assignments/` and the supervisor
   pane captures. **[UNVERIFIED location]** If they are not found: open a herdr pane and start the
   owner's own `agy --mode accept-edits --new-project` there. The owner's shell wrapper picks their
   current account home, so no login file is copied or read by fgOS. Type a 6 KB filler brief with
   `herdr pane send-text`, without pressing Enter, so nothing is submitted. Sample
   `herdr pane read --source visible` and `herdr agent explain` every 700 ms until the screen holds
   still. Then clear the composer (Esc or Ctrl-C) and close the pane. Save 3-4 frames as
   `fixtures/terminal/agy/brief-ingesting-{1..n}.txt` with `.insp.json`, and the final
   composer-held frame. Record the source line, as the existing `vectors.json` `source` field does.
3. **E2, prompt door semantics (no quota).** Read `herdr agent prompt --help` and herdr's docs or
   source for whether `agent prompt` waits until the agent's composer settles or the agent shows
   working. If it is unclear, test it in the same throwaway pane with a 6 KB filler: time the
   `herdr agent prompt` call while sampling the screen. A submit spends one tiny turn of quota, so
   it is owner-gated. Record the result in the phase notes.
4. **E3, write failing vectors first.** Add to `fixtures/terminal/agy/vectors.json`:
   - `delivered-after-a-slow-paste-is-ingested`: step `deliver-brief`, timed frames from step 2
     (idle, changing screens without draft or echo for about 18 s, then working). Expect `delivered`.
   - `still-screen-without-draft-or-echo-stays-delivery-unknown`: a still idle screen. Expect
     `delivery-unknown`. This keeps the current guard.
   Run `cargo test -p fgos-agent-protocol --test terminal_vectors` and confirm the first vector fails
   on main.
5. **Choose.** If E2 proves herdr waits for ingestion, apply (a) and check whether the vector passes
   with the prompt door. Otherwise apply (b) in `mod.rs` `confirm_submitted`: track the previous
   idle screen and advance `no_draft` only on an unchanged screen. Keep `brief_echoed` as the first
   exit. If any existing vector changes outcome under (b), switch to (b') with one profile field and
   record why.
6. **Run every proof that reads the fixtures:**
   `cargo test -p fgos-agent-protocol`, `cargo test -p fgos-run-supervisor --test supervise_terminal_fake_herdr`,
   `node --test test/run-supervisor/terminal-fallback.test.mjs`.
7. **Live probe (owner-gated, quota).** From the worktree, run
   `npm run fgos:dev -- dispatch probe-account --provider gemini --account tetcu72 --leg harness`.
   The dev host materializes the worktree's Rust under `.fgos/runtime/dev-host/`, so the activated
   release stays untouched. Expected: the `agy-herdr` row is `ok`, and the `agy-cli-bwrap` row stays
   `ok`.
8. **Docs.** Add one line to `docs/platform/agent-protocol/spec.md` stating the delivery rule: a
   changing screen is not judged. Add one `CHANGELOG.md` `[Unreleased]` line: "agy panes no longer
   cancel while taking in a long brief".
9. **Commit** in the worktree with a pathspec. Merge to main with ff-only from the main checkout
   only after the owner agrees. Remove the worktree with `fgos worktree remove ... --delivered-to main`.

## Optional stopgap (decision D6, global write, owner approval)

Back up `~/.fgos/config.yaml` to `~/.fgos/private/config-backup-<YYMMDD-HHMM>-agy-pointer/`. The
door cannot insert one key into a sequence item, so replace the whole sequence:
`fgos config set --global runner.executors.gemini.invocations '<flow list with agy-herdr + promptDelivery: file-pointer>' --reason "agy pane takes the brief as a one-line pointer until the slow-paste delivery fix ships"`.
Prove it with the step 7 probe on the activated release. Revert after P1 is activated.

## Validation

- Vectors: the new agy vectors pass. Every vector of every CLI passes unchanged.
- `git diff --stat` touches only the P1 footprint.
- Owner-gated probe: `agy-herdr` is `ok` on gemini/tetcu72.

## Risk

| Risk | L x I | Mitigation |
|------|-------|------------|
| (b) delays a real delivery failure on a CLI with an animated idle screen | M x L | outcome unchanged, bounded at 60 s; vectors of all CLIs stay green |
| Recorded frames do not reproduce the live race | M x M | live probe (step 7) is the acceptance gate |
| Briefs over about 20 KB ingest longer than 60 s | L x M | note it in the spec line; raising `SUBMIT_CONFIRM_MS` is a separate decision |
| Heavy cargo build contends with other sessions' IO | M x M | one build at a time, own target dir, announce the window |

## Rollback

Revert the worktree commit, or do not merge it. The fixture files are additive. The stopgap is
reverted by restoring the backup sequence through `fgos config set --global` with the saved value.
