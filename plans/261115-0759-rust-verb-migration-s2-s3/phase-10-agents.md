---
phase: 10
title: "`agents list` native (only if the owner answers S23-Q1 = a)"
status: dropped
effort: "3d if S23-Q1 = a; 0.25d if S23-Q1 = b (hand-off note only)"
wave: B
step: S3
blockedBy: [0, S23-Q1]
startsAfter: ["one-door-debt phase 16 landed (S23-Q1 = a only)"]
---

> Dropped (owner answer S23-Q1 = b, 2026-11-15 08:41): the owner moved `agents` to S5; nothing in this file is executed in S3.

# Phase 10: `agents list`

**If S23-Q1 = (b):** this phase only writes one line into the program plan's S5 row ("`agents` verb, moved from S3 by
owner answer S23-Q1; the persona reader joins `bind()`") and one into its S3 row. Effort 0.25d. The rest applies to S23-Q1 = (a).

`agents list` (`src/runner/agent-listing.mjs`, 123 lines) reads personas through `src/runner/agent-definitions.mjs`
(272 lines), which eight runner, workflow, doctor and script modules import (plan.md S23-Q1). The definitions reader gets
one Rust owner; `agent-definitions.mjs` and `agent-listing.mjs` keep their exports as addon calls, so no runner caller
and no doctor row changes.

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s3-p10`, cut after one-door-debt phase 16 landed
on `main` (it rewrites the doctor's persona walk onto `agent-definitions.mjs` and owns `test/runner/agent-definitions.test.mjs`).
Report slug `s3-p10-agents`.

## Context

- Registry `src/cli/command-registry.mjs:2329-2350`: `list [--worktree <path>]`; `store: 'none'`.
- Arm `bin/fgos.mjs:3635-3641` (next to `case 'tool'` at 3642, which the capability-reads plan deletes); without
  `--worktree` it uses `resolveGitRoots` (`src/runner/execution/run.mjs`).
- Output `{ projectRoot, agents[], masked, duplicates, ignored }`.
- Doors row "agent definition tier directories" (allowed `src/runner/agent-definitions.mjs`, `src/util/domain-dirs.mjs`,
  `src/cli/command-registry.mjs`; debt `src/setup/registrations.mjs`, removed by one-door-debt 16).
- Runner decision 0059 (`docs/platform/runner/decisions/h-36d872fbb0e5.md` ~1685): "`fgos agents list` is the one listing".

## Requirements

1. Rust owner of agent definitions (crate and module named by 00 F12; candidate `packages/seat-binding/rust`, the persona
   authority of the binding, which the addon would then link: a crate edge not in D10, stop and ask the step lead; the
   step lead commits `Cargo.lock`): tier scan
   (core, domain, project), `readAgentDefinition`, `resolveAgentDefinition`, render warnings, shadowing and hidden
   personas, YAML through `fgos-yaml-doc`.
2. Addon entries; `agent-definitions.mjs` and `agent-listing.mjs` keep every export as calls; a vector file of tier
   layouts and the listing each yields, read by both test sides.
3. Host: operation `agents.list` (read), projector (`--worktree`), root as Node's `resolveGitRoots` gives it (00 F12),
   annotation, `native: true`.
4. Parity `agents.cases.mjs`: core only; a domain persona; a project persona shadowing core; a hidden persona; a
   malformed definition (render warning); `--worktree` elsewhere; unknown sub.
5. Delete: the arm (rebase by hand next to `case 'tool'`); `test/runner/agent-listing.test.mjs` (5) and the
   `agent-definitions.test.mjs` cases whose rules moved (names in the report; one adapter case stays per module).
6. `doors` row "agent definition tier directories": `allowed` gains the Rust module and the addon entry file;
   `agent-definitions.mjs` stays allowed with reason "adapter"; `retiredBy: "S5/S6a: the runner and bind move"`.

## Files

- Create: the Rust module (path from 00), its vector file, `agents.cases.mjs` (deleted by 12).
- Modify: the crate's `lib.rs` and `Cargo.toml` (after the yes), the addon's `Cargo.toml`, `lib.rs` and a new entry file,
  `src/runner/agent-definitions.mjs`, `src/runner/agent-listing.mjs`, host files per the recipe, `bin/fgos.mjs`,
  `test/runner/agent-definitions.test.mjs`, `docs/architecture-manifest.json`, `test/suite-baseline.json` (214), census.
- Delete: `test/runner/agent-listing.test.mjs` (if every case has an owner).

## Gates

- Rust fmt, clippy `-D warnings`, tests of the touched crates; msvc and darwin checks.
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/runner/agent-definitions.test.mjs test/scripts/project-agents.test.mjs test/workflow/workflow-loader-persona-scope.test.mjs test/setup/packaged-definitions.test.mjs test/setup/checks-doctor-config.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`

## Risk and rollback

- Persona resolution on the run path changes (M x H): vector file covers every rule of today's tests; runner tests unchanged.
- Rollback: revert the phase.
