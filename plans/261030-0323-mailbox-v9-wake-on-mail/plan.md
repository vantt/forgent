---
title: "Agent mailbox V9: wake an idle session on mail"
status: approved to build by the owner 2026-10-30 03:2x (option A of the board question of 2026-10-29 22:05); each phase lands only after its own gate
lane: MAIL
created: 2026-10-30
---

# Agent mailbox V9: wake an idle session on mail

Owner: lead:MAIL. Authority: `docs/platform/agent-mailbox/spec.md` sections 6.2 (`Nudge`), 7.2 (K1), 15.8; measurements in `plans/reports/research-261024-0415-mailbox-v7f-wake-channel-probes.md`. The spec is frozen until DOC lands; this plan adds no spec edit, and the spec lines that change are listed for DOC at the end.

## Outcome

A session that finished its turn and waits for a person reads its mail within seconds of the mail being recorded, on the same machine first and then from another machine. The wake line is fixed text and never carries the body. A CLI whose wake channel has not passed the safety bar keeps today's behaviour (mail at the next tool call).

## Constraints (from what is measured, not assumed)

- **Safety bar of V7f** (owner decision, 2026-10-23): a channel is built for a CLI only if it starts a turn with no dialog, no focus change, no typed input, and 0 acted in the harmful-mail test for that CLI.
  - Codex `codex queue`: meets the bar (turn started, 0 acted of 30).
  - Claude Code socket: channel works under a scoped `crossSessionInbound: accept` (2.0 s) but the test gave 1 acted of 27, and the real socket wraps the line in a frame the test did not use. **Not built until phase 01 re-measures with that frame and gets 0 acted.**
  - pi and omp extension timers meet the channel part; the harmful test was never run for them. Not built here.
- The owner's Claude sessions run with `--dangerously-skip-permissions`. A raw socket write to such a session is held behind a dialog (W2, W2b). So even a passing Claude channel reaches only sessions started with a scoped `accept` through `--settings`; sessions already running stay at `turn`. K1 stays: no global `accept`.
- Remote mail has never woken; the new path keeps the existing limits (a confirmed machine key, per-verified-sender caps) and adds a wake-specific cap.
- Hook budget 50 ms is untouched: the hook never nudges; only the detached sync child and `fgos mailbox send` do.

## Phases and budget

| Phase | Outcome | Size | Heavy runs |
|---|---|---|---|
| [01](phase-01-nudge-port-same-machine.md) | `Nudge` and `Presence` ports with a Codex adapter, same-machine `--wake` reaches an idle Codex head; Claude Code's frame re-measured, adapter built only if it passes | 350-500 lines src, 250 test | up to 40 print-mode Claude runs, up to 6 interactive sessions with the owner not needed (own panes) |
| [02](phase-02-cross-machine-wake.md) | The receiving sync child nudges for a verified remote mail whose sender allows wake; two-machine proof | 250-400 lines src, 150 test | one two-machine run |

Stop rules: a harmful mail acted on in any test stops that CLI's channel at once. Phase 01 may end with Claude Code unbuilt; that is a valid result, reported as such. Anything beyond the ranges above stops and goes back to the owner with the five-part question.

## Review and landing

- Each new process or socket call site goes to lead:OPC before it lands; `node scripts/git-one-door-scan.mjs --write-census` in the same commit, 0 undeclared; rebase onto origin/main before pushing.
- `mailbox.wake.enabled` defaults ON for same-machine and the cross-machine key stays tied to `mailbox.crossMachine.enabled` (default off until the live two-machine proof; then flipped by its own commit).
- Release to each machine through that machine's landing window; the owner machine needs the owner's go.

## Spec lines for DOC (after DOC lands)

Section 6.2 table (Codex tier `push` via `codex queue`; Claude row per phase 01 result), 6.3 (`waiting` presence value), 7.2 (the prompting-mode finding of W7), 15.8 pointer to this plan.
