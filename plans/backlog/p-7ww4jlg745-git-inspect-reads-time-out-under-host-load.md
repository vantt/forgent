---
id: p-7ww4jlg745
title: "A read-only git inspect call under host load says which step waited and for how long, before any retry or longer deadline is added (git, priority P2)"
status: proposed
priority: P2
area: git
created: 2026-11-23
---

# Why

On 2026-11-23 on design-lap the release landing for main 57087d7bd failed twice with "the Git read of the source set
failed: Refused: git-timeout". The failing call is `scripts/build-rust-distribution.mjs` `listLegacyNodeSourceFiles`
-> `fgos internal source-payload` (`packages/distribution/rust/src/source_payload.rs`, `tracked_paths` then `status`
with untracked=all) -> the inspect calls in `packages/git/rust/src/inspect.rs`, each with a fixed 30 s deadline
that no setting changes. The load average was 10 to 23 while other sessions ran test suites. `fgos git status --json`
also timed out on the same host that afternoon.

The untracked walk alone does not explain it: at load 7.7, `git status --porcelain --untracked-files=all` in the main
checkout took 0.56 s for 883 entries (`.fgos/runtime` is ignored and not walked). So the 30 s goes somewhere else:
waiting on a lock, a spawn queue, a different inspect call, or the host's start-up. This has not been proven.

A first failed attempt also leaves a half-written staging directory, and the next attempt refuses to stage into it.

# Done when

- A `git-timeout` refusal names the step that ran out of time and how long each step took (lock wait, spawn, git
  run), so the cause can be read from one failure.
- With that diagnosis, the fix addresses the measured cause, not a blind retry or a longer deadline that would hide
  a lock wait. A test reproduces the slow step and shows the read either finishes or refuses by name.
- A failed release build leaves no staging directory the next attempt refuses, or the refusal names how to clear it.

# Notes

Workaround until then: the landing session retries the whole release landing once, after the load drops below 6,
using a fresh staging directory for each attempt.
