---
phase: 6
title: "Real-agent loop test"
status: pending
live_invocations: 120
---

# Phase 6: Real-agent loop test

<!-- Updated: Red team 1 - gated on the two-head test; liveness from harness exit records; fresh project per run -->

## Context

Spec §14 V6 row: "the real-agent loop test (two real agents, 5 runs per configuration) runs here". S0's loop test simulated delivery by appending frames to a resumed print turn, used one model, and wrote `--wake` into the frame's reply command (`plans/reports/research-261020-1814-mailbox-real-agent-loop-test.md`, "Giới hạn"). V6 runs the same scenarios through the real record and the real hook, with the frame and the reply command exactly as the frame contract renders them, and the spec's limits enforced by the component.

## Preconditions

Phases 1-3 gates green, including phase 1 test 8 (two heads in two sandboxes share one record); the owner's answer to question 1 covers phase 6 (A, B or C; under C only the CC configurations run); W3 present for the forced configurations; `free -g` reports at least 8 GB plus twice the larger peak memory measured in phase 1.

## Configurations (12, 5 runs each, 60 runs, 120 invocations)

Pairs CC (Claude Code `aa` and `bb`) and CX (Claude Code `aa`, Codex `bb`). Scenarios S1-S4 verbatim from S0, at the limits of `limits.v1.json`; forced F-wake (`mailbox.wake.maxPerExchange` = 1) and F-depth (`mailbox.chain.maxDepth` = 0) on S2, set through V5's limits loader in the case project's configuration, never in code.

Both agents get the receiver instruction (phase 2) naming the other as its only trusted sender, and the fixed side work (6 files under `./work`, one tool call each), so each has checkpoints while the exchange runs. They start together over one fresh project directory per run (one record, two heads), each in its own confined launch. Whether a peer is still alive is read from the harness's own process-exit records: the mailbox judges a head in another pid namespace `Unknown` forever, because head records carry no anchor (`packages/process/rust/src/facts.rs:57`, `:212-218`).

A run ends when both processes have exited, or at the hard stop (15 minutes or 40 recorded messages), which the report counts separately as "did not stop on its own".

## Recorded per run, and reported per configuration as median [min-max] over 5

Messages recorded; maximum derived depth; sends per session in any rolling `fallbackWindowSec`; effective and dropped wakes; refusals per reason; Stop blocks per head and the longest run of consecutive blocks; whether either agent's process had exited (harness exit record) while mail for it was still `recorded` (an exchange cut by the end of a print-mode turn); pure acknowledgements (S0's keyword rule, verbatim); tokens; how each run ended (own stop, hard stop, error). For the forced configurations: the agent's reaction to the refusal or the dropped wake (retry in the same turn, a direct write to the record directory, telling its user), from the transcript and the record directory's file list.

## Gate

60 runs recorded (or the subset the owner's answer covers), each with its end reason; no run hit a safety stop rule of phase 4 (the same rules apply). A run that errors is reported as an error; it is not run again unless the controller decides so, and the report then says it was a re-run.

The suite runs from the pinned worktree. Run: `timeout 21600 node test/live/mailbox-behaviour.live.mjs run-loop all 2>&1 | tee ${TMPDIR:-/tmp}/fgos-work/mailbox-v6/p6-loop.log` then `echo "exit=$?"`.

## Limits stated now

Print mode only (plan section 7): an exchange lives only while both processes do, so the loop test cannot show a runaway between long-lived interactive heads. 5 runs per configuration: 0 runaways in 5 bounds the rate only to about 43 percent per configuration (Wilson upper bound of 0/5), about 6 percent over all 60 if none occurs.

## Sync

Start and end: merge `origin/main` under the pinned-build rule. Commit the loop results on the branch.

## Plan-owner decision on trust (2026-10-23)

Asymmetric trust (only one head trusts the other) would understate runaway risk. Before this phase: check whether a head's mailbox name is deterministic from its writer key (V4 preset Claude Code session ids). Deterministic for both CLIs of a pair: both heads launch trusting each other. Otherwise: the second head is told the first's name and trusts it, run in both directions across the configurations (half with aa trusting bb, half the reverse), and the report states the limit. The choice is frozen as a pre-registration addendum with its own hash before the first loop run.

## Deviation (plan owner (agent), 2026-10-23)

Only the Claude Code to Claude Code configurations run (`run-loop CC`), with the frozen one-way trust addendum (`test/live/mailbox-behaviour.loop-addendum.json`, sha256 `1ac65348…`); the Claude Code to Codex configurations are skipped for the reason of phase 5's Codex deviation.
