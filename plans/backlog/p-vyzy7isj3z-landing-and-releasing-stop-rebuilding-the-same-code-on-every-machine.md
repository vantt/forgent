---
id: p-vyzy7isj3z
title: "Landing and releasing stop rebuilding the same code on every machine: land gates reuse a build, releases are built once and downloaded (distribution, priority P1; owner decision 2026-11-24)"
status: proposed
priority: P1
area: packaging-distribution
created: 2026-11-24
---

# Why

Builds have become the slowest and heaviest part of shipping (owner, 2026-11-24). Seen on design-lap the same day:

- every `fgos land` runs its test gate in a fresh candidate worktree, and `scripts/run-tests.mjs` builds the native
  addon into that candidate's own `target/`, so each landing compiles from scratch unless sccache hits;
- the shared sccache wrapper (`~/.cargo/config.toml`) stalled two builds at once (754 compile requests, 509 executed,
  no hits, cargo waiting on a futex); both ran once the wrapper was emptied;
- after each landing the release is built locally (`cargo build --release --workspace`), and every other machine that
  wants the new main builds it again, while `release.yml` and `fgctl upgrade` can already build once in CI and
  download a checksum-verified release (last tagged release `v0.2.0-rc.12`, 2026-11-18);
- three landings failed at the very end with `fast-forward main: git-timeout` under load 10-15
  (see p-7ww4jlg745).

# Done when

A landing on any machine reuses compiled dependencies and finishes without a stalled cache or a timeout under normal
load, and a machine moves to a new main by downloading a release built once, not by building it. The design is
settled in a discussion with the owner first (owner asked for a thorough brainstorm); measurements come before
options.

# Notes

Related: p-7ww4jlg745 (git inspect timeout under load). The release flow on design-lap is run by session
forgentx-38; it is consulted before any change to it.
