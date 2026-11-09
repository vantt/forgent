---
phase: 03
title: "fgctl command surface: --version, per-verb help that exits 0, usage errors exit 2 with a did-you-mean, task-ordered no-args help"
status: pending
depends_on: []
parallel: "group G1 with P05 and P09; first writer of apps/fgctl/src/main.rs"
effort: ~0.75d
net_size: "Rust about +130 / Node 0 / tests about +60 (estimate)"
---

# Phase 03 - fgctl command surface (F3, fgctl half)

## Context

CMD-06, CMD-08, CMD-15, CMD-16, UX-03. `apps/fgctl/src/main.rs` (311 lines) has no `--version`; `fgctl` with no args prints usage and exits 1 (`:10-31`, `:76-79`); every verb arm answers `--help` with `Unknown option` through `print_usage_and_exit` (`:104`, `:139`, `:206`, `:242`, `:265`, `:287`). The internal holder-lock helper and route arms (`:86-93`) stay hidden. `fgctl` has no tests of its CLI surface (`apps/fgctl/tests/` holds two gate tests).

Reused: `CARGO_PKG_VERSION`; build commit embedding is by `scripts/build-rust-distribution.mjs` (step 1 finds whether it already sets an env for `fgos version`'s `gitCommit`, which is null in a release per the audit).

## Requirements

1. `fgctl --version` and `fgctl version [--json]`: first line `fgctl <version> (<commit12>, <commit date>)`; `--json` is a bare object like the other fgctl JSON (`{name, version, commit, commitTime}`). Exit 0. P09's candidate check and P11's upgrade test read this line.
2. `fgctl --help`, `fgctl help`, `fgctl <verb> --help` write to stdout and exit 0. Each verb's help has the CMD-16 fields: what it changes on disk, prerequisites, every flag with its default, 2-4 examples (one non-interactive), exit codes, the next command.
3. No args: a short task-ordered "Get started" (1. install, 2. `fgctl init`, 3. `fgos run "<prompt>"`) and "Agents: `fgctl init`, then `fgos doctor --json`, run each `next`", exit 0.
4. Usage errors (unknown verb or flag) exit 2 and print a did-you-mean over the verb table. Failures that are not usage keep their current codes.
5. Help text lives in one new leaf `apps/fgctl/src/help.rs` (the verb table is also the did-you-mean list); `main.rs` keeps only dispatch.

## Files

**Create:** `apps/fgctl/src/help.rs`; `apps/fgctl/tests/cli_surface.rs` (also used by P06 and P08).
**Modify:** `apps/fgctl/src/main.rs`; `CHANGELOG.md`.
**Delete:** `print_usage_and_exit` and its repeated call sites.
**Tests to retire:** none; no test asserts the old usage text (step 1 greps `rg "Unknown option" apps packages test`).

## Red tests first

`apps/fgctl/tests/cli_surface.rs`, a child process with a temp HOME: `--version` exits 0 and starts with `fgctl `; `upgrade --help` exits 0 and contains `Exit codes`; `bogus` exits 2 and contains `did you mean`; no args exits 0 and contains `fgctl init`. Why new: nothing tests the fgctl surface.

## Net size

Rust about +130 (help text 60, version 25, did-you-mean 25, dispatch 20); tests about +60.

## Steps

1. Grep callers of the usage text and exit 1; read how fgos gets `gitCommit`. 2. Red tests. 3. `help.rs`, `main.rs`. 4. CHANGELOG.

## Validation

`cargo test -p fgctl` (focused, via the repo's test runner `fr.mjs`); `target/release/fgctl --version`, `fgctl upgrade --help`, `fgctl bogus; echo $?` by hand once.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A script depends on exit 1 for usage | Low x Med | `rg "fgctl" scripts .github docs` before the edit; the consumer proof is read |
| Help text drifts from the verbs | Med x Low | the verb table drives both help and did-you-mean |

## Rollback

Revert the merge; no state written.

## Closes

CMD-06, CMD-08, CMD-15, CMD-16 (fgctl side); UX-03; CMD-09 partial (all progress to stderr, results to stdout, checked in step 3); CMD-12 (SHOULD).
