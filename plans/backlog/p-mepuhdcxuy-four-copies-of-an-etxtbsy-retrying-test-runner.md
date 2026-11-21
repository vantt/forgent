---
id: p-mepuhdcxuy
title: Four copies of an ETXTBSY-retrying test runner (tests, priority low; needs OPC review; RUL11 (consolidate tangled boundaries and explicit contracts within scope))
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

A test that writes a fake script and runs it moments later can fail with `text file busy` (error 26) when another test thread forks while holding the write descriptor, even with O_CLOEXEC: the fork keeps the descriptor until its exec. The retry exists in four places: `RetryOnBusy` in `fgos-distribution` (cfg(test), invisible to other crates), `BoundedRunner` in `apps/fgos/src/wiring/wire_agents.rs` `mod tests` (added after the wire-agents plan test failed once with Null), the test retry in `packages/distribution/rust/src/launcher.rs`, and the cli_tests script runners (`wire_agents_runs_in_the_host_without_node_…` and the `scripted_node` doctor tests, which run through the `fgos` child process and are not covered yet).

# Done when

One ETXTBSY-retrying test runner (retry only on raw OS error 26, up to 100 times 20 ms apart, every other error and outcome passes through) used by all four sites; it lives in a small `test-support` module behind a `test-support` cargo feature on `fgos-distribution` or `fgos-process`, enabled only as a dev-dependency (or equivalent); the cli_tests runners get the same retry around their spawn.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
