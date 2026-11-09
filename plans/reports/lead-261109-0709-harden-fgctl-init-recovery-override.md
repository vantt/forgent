# HARDEN lead report: `fgctl init --override-pin` recovery override

Date: 2026-11-09. Branch `harden/fgctl-init-recovery-override`, landed on main as `492d4ee59` (OPC MERGE 07:00 on the reviewed `27ba8daae`, rebased twice onto main with only the generated census regenerated).

## Why
Owner chose option 1 of the pin question in `plans/reports/lead-261108-2257-harden-wipe-rule-pin-runbook.md`. After the main-checkout wipe, `fgctl init` could not re-activate: the committed digest-only pin (`df7a1a04`, no native addon) refused any other `--from` as `pin-mismatch`, and `fgctl upgrade` needs an activation. Recovery needed a temporary hand edit of the tracked pin.

## What changed
- `fgctl init --from <path> --override-pin <reason>` (`apps/fgctl/src/main.rs`, help text included). The name follows `fgos move --override-reason`: the flag carries the reason it requires.
- `packages/distribution/rust/src/init.rs`:
  - `init_workspace_resolving` takes `pin_override_reason`. Before reading the workspace, it refuses an empty reason (`pin-override-reason-empty`) and any source other than a local path (`pin-override-needs-from`). The override never downloads.
  - A guarded first arm in `init_workspace_tagged` selects the release through `staged_pin_override_candidate`. It refuses with `pin-override-without-pin`, `pin-override-unneeded` (the release is the pinned one) or `pin-override-unstaged` (not in `releases/`, which includes a quarantined release). It never stages.
  - The unchanged common path then runs every check a plain init runs: the staged manifest digest, the main-checkout lock, preflight, the activation lock, the under-lock idempotent check, the holder-lock gate and the Git admission (`git-addon-missing`).
  - The stderr line `pin overridden: ... pins <pin>; activating staged release <digest> (reason: ...); the pin file is not changed` prints after preflight.
  - `activation.json` gets the optional `pinOverrideReason` field. `schemaVersion` stays 1 and `pinSnapshot` still holds the pin. `update_pin` stays false and a pin must exist, so `.fgos/distribution.json` is never written. Upgrade and repair write activations without the field.
- Reused: the existing pin read, `is_release_staged`, `release_dir_path`, preflight and `publish_and_tail`. No new mechanism was added beyond the selection function and the field.
- Docs:
  - packaging spec: command table, a "Recovery override" bullet under RUL15 (fgctl init downloads a checksum-verified release when no source is given), and a decision-history entry dated 2026-11-09;
  - activation-binding contract: new `pinOverrideReason` row;
  - CHANGELOG `[Unreleased]`;
  - runbook step 1 (`docs/how-to/recover-main-checkout-after-ignored-files-wipe.md`) now uses the flag instead of the hand edit, and notes how to build an `fgctl` that has the flag.

## Proofs
- Crate unit tests in `init.rs`, each owning one rule:
  - a staged, non-pinned release is selected;
  - an unstaged or quarantined release is refused and nothing is staged;
  - no pin, or the pinned release itself, is refused;
  - a missing reason or a non-local source is refused before anything is read.
- Schema golden `activation-binding-full.json` carries the field; the minimal golden asserts that it is absent.
- One wiring test in `test/rust-host/fgctl-init.test.mjs`, the owner of pin reconciliation, checks the real binary:
  - a plain init still refuses with `pin-mismatch`;
  - the override activates the release, prints the stderr line, records the reason and keeps `pinSnapshot`;
  - the pin file stays byte-identical;
  - a tampered staged release is refused by preflight, with no installation written.
- "Without the flag, unchanged": the existing Item 2 case B keeps owning `pin-mismatch`, and the wiring test re-asserts it once.

## Gates
- `cargo fmt --all --check` passes.
- `cargo clippy -p fgos-distribution -p fgctl --all-targets -D warnings` passes.
- `cargo test -p fgos-distribution -p fgctl`: 114 passed, 0 failed.
- `cargo check` passes for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`.
- One-door scan: 0 undeclared. The census was regenerated, and only rows of the files I touched changed.
- Citation drift: no new findings. doc-health is green.
- Full `npm test` through the queue on the landed tip (based on `9776799c6`):
  - 8629 pass, 1 fail, no ERROR lines, +1 `test()` call;
  - the one failure is the known frozen V7n addendum.
  - The first run, on `b7c7c372c`, also had the two worktree-only failures that main has since fixed in `27b2c580c`.
- Plain `node --test` runs of the fgctl and holder-lock files fail on `addon not shipped on this channel`. That is environmental: only `run-tests.mjs` stages the addon door. They pass inside the full suite.
- impact-analysis is inactive (0 providers), so blast radius was taken by grep:
  - `init_workspace_resolving` has one caller (`fgctl` main);
  - `PublishArgs` has 3 sites, all updated;
  - `WorkspaceActivationBinding` is built in one place.

## Accepted nits (OPC, not fixed: they would change the reviewed diff and change no outcome)
- The `pin overridden` line prints before the under-lock idempotent check. When the release is already active, nothing new is published, but the line still says "activating".
- A pin file that exists but does not parse reads as "no pin" (`pin-override-without-pin`). That is the same reading plain init uses (`read_tracked_pin`), but the message says the file "holds no pin".

## Not done / out of scope
- The pin and the exact-digest policy are unchanged, and `.fgos/distribution.json` was not touched.
- Backlog `p-7lbid77g4g` (a fresh clone fails with `git-addon-missing`) stays open. It is related but is a different failure.
- The flag reaches machines only through a release built from `492d4ee59` or later. Until then, the runbook says to build `fgctl` from the checkout.
