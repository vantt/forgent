---
phase: 2
title: "Pending-copy safety and read-only follow-ups"
status: in-progress
priority: P1
effort: "1d"
dependencies: [1]
---

# Phase 02: Pending-copy safety and read-only follow-ups

## Overview

Phase 01 keeps a login that may hold the only valid refresh token in `pending/` copies and held private homes. This phase closes the ways those copies could still be lost or go unseen, without changing what phase 01 decided: a copy is dropped only when it is proven broken, when the source is readable and proves it is not newer, or when an identical copy is retained; never because of age or count.

## Requirements

- The pending-copy limit (five per account) gives way to the invariant: the limit is applied only under the account lock, after the pending copies were applied, and drops only a copy whose logins are identical to another pending copy's. Over the limit with nothing redundant, nothing is dropped and `fgos doctor` reports the account.
- Duplicates are recognised by an in-memory fingerprint of the entries (key, refresh token, expiry). It is never written or printed.
- The staged file, its directory and the pending directory are synced before the home may go; the test checks each sync on its own.
- A held home settled into the pending copies no longer reads the source twice to decide: nothing depends on that decision any more.
- A login store a probe left half-written is kept under `torn/` for hand recovery, outside the copies that are applied or dropped, and is reported by the doctor check. Basis: pi rewrites its store in place; omp commits through SQLite (plan question 4).
- Done in the follow-up (2026-10-14): the `.tmp-*` staging directories left by a crash are reported and swept only when provably unneeded, homes under `privateHomeRoot` are scanned, the over-limit line names its store, and staging no longer copies `-shm`.

## Files

- Modify: `src/runner/dispatch/provider-credential-renewal.mjs`, `src/setup/registrations.mjs`, `test/runner/provider-credential-renewal.test.mjs`, `test/setup/credential-copies-retained-check.test.mjs`, `docs/specs/runner.md` (RUL75), `docs/specs/confinement-authority.md` (13.2), `CHANGELOG.md`, `plan.md`.
- No new source file.

## Validation

- Every new test fails on the code before this phase (seven tests), and each removal of a single sync fails the sync test.
- Full suite green; result in the implementation report of this phase.

## Risks and rollback

- An account can keep more than five pending copies when none can be judged and none is identical; that is the intended trade (nothing lost) and is reported. Rollback: revert the phase commits; the previous limit logic returns.
