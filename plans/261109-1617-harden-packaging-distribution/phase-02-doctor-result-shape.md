---
phase: 02
title: "Doctor result shape: per-check status and fix, top-level ok and next, and a git row that converges on a local-only project"
status: completed
depends_on: ["in-flight (2) landed", "T8-P11 landed"]
parallel: "group G2; first writer of registrations.mjs after T8-P11"
effort: ~1d
net_size: "Node about +90 / Rust 0 / tests about +60 (estimate)"
---

# Phase 02 - Doctor result shape (F4, F3 doctor half)

## Context

DOC-01, CMD-18, CMD-10, CMD-11. A check result carries `id, description, passed, message, detail`; warnings are text inside passing checks (9 lines in `registrations.mjs` contain `warning:`, 21 mention `skipped`; 91 `registerCheck` calls; `registerCheck :170`). After `doctor --fix` a local-only repo keeps failing `git-repository-config`, whose fix then fails with its stderr printed as a number array (audit live run; text built in `attemptFix`, `src/setup/git-checks.mjs:100-102`; the byte-array origin is in the native fetch-mapping call `[UNVERIFIED]`, step 1 reproduces it in a temp repo with no `origin`). The README promises doctor exits 0 whatever the checks say (`README.md:157`); Q-B keeps that, so agents get `ok` and `next[]` instead of an exit code.

Contract doc to update: `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`.

## Requirements

1. **Additive envelope fields.** Per check: `status` (`ok|warn|fail|skip`) and `fix` (a runnable command string, or null with the reason in `detail`). Top level: `ok` (no `fail`) and `next[]` (deduplicated fix commands of failing checks, registry order). `passed` stays the source of `status` unless a row sets `status` itself. One path (L10): the doctor arm and `fgctl` read the same envelope.
2. **Rows that fake a status in text** set it: the `warning:` rows -> `warn`, the `skipped` rows -> `skip`. Step 1 lists each by id (the counts above are string greps, not row counts).
3. **A `fix` for every failing row.** Step 1 lists failing rows without one and gives each a command, or makes it `skip` with a reason.
4. **Git row.** No remote -> `skip` with `fix: git remote add origin <url> && fgos doctor --fix`. Fix errors decode stderr bytes to text at the one place the message is built.
5. **User-facing text.** `tsk-*` ids leave the row descriptions at `registrations.mjs:1000`, `:1226`, `:1232` (comments may keep them).
6. **Convergence.** On a scratch HOME with a local-only repo, `doctor --fix` then `doctor` gives `ok: true`; a row that still fails names the user action in `fix`. Rows owned by P01 and in-flight (2) are not edited here.

## Files

**Modify:** `src/setup/registrations.mjs` (envelope builder, the rows' `status`, 3 descriptions), `src/setup/git-checks.mjs`, `bin/fgos.mjs` doctor arm `:4241` (reads `ok`, nothing else), the contract doc, `CHANGELOG.md`.
**Create:** none. **Delete:** the `warning:` and `skipped` text prefixes that `status` replaces (keep the explanation words).
**Tests to retire:** none; cases that match `message.startsWith('warning:')` move to `status === 'warn'`.

## Red tests first

`test/setup/checks.test.mjs` (envelope: `ok`, `next[]`, `status`); `test/setup/git-checks.test.mjs` (no remote -> skip with fix; stderr bytes decode); `test/setup/doctor-strict-exit.test.mjs` stays green unchanged (exit codes untouched, Q-B).

## Net size

Node about +90 (envelope 40, rows 30, git 15, descriptions 5); tests about +60.

## Steps

1. Reproduce the live failures in a scratch HOME; list the 5 failing rows and the two that P01 and item (2) handle. 2. Red tests. 3. Envelope, rows, git. 4. Contract doc, CHANGELOG.

## Validation

FR `test/setup/checks.test.mjs test/setup/git-checks.test.mjs test/setup/doctor-strict-exit.test.mjs test/setup/doctor-fresh-run.test.mjs`; row id list before and after (same ids, same count); scratch-HOME loop `doctor --fix` -> `doctor --json` shows `ok`.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Consumers parse `message` prefixes | Med x Med | `rg "warning:" src test scripts` before the edit; every hit moved |
| Many row edits collide in `registrations.mjs` | High x Med | one writer by the chain; rebase on the landed predecessor |

## Rollback

Revert; the fields are additive and no consumer reads them until P06.

## Closes

DOC-01, CMD-18, CMD-10 (git); CMD-11 and DOC-05 partials. DOC-02 stays with Q-B.
