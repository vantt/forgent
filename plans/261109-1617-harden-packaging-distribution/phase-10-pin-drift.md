---
phase: 10
title: "Activation-versus-pin drift: a doctor row, the same line in fgctl status and verify, a digest-only-pin error with three ways out, and a pin-bump step in the release process (Q4/5 a)"
status: pending
depends_on: ["P02 landed (registrations.mjs chain, doctor warn status)", "P06 landed (init.rs chain)"]
parallel: "group G4 with P08 and P11"
effort: ~0.75d
net_size: "Rust about +40 / Node about +30 / docs about +15 / tests about +50 (estimate)"
---

# Phase 10 - Pin drift (F15, decision 80 Q4/5 a)

## Context

PRN-02, CMD-10, DOC-05. The committed exact-digest pin (`.fgos/distribution.json`, read by `read_tracked_pin`, `packages/distribution/rust/src/init.rs:635`) names `df7a1a…` (2026-10-17) while a machine runs a different release; the activation records `pinSnapshot` and `pinOverrideReason` (`init.rs:111`); `fgctl status` (`get_workspace_status :1914`), `verify` and `fgos doctor` never mention the difference. A clone with a digest-only pin dead-ends on "no --from source was provided", naming neither `--override-pin` nor `FGCTL_VERSION`.

Decision 80: keep exact-digest pins; doctor warns when the activation differs from the pin; the pin is bumped at each official release. This phase does **not** change the committed pin's value; the next official release moves it by the step below.

Reused: `read_tracked_pin` and the activation reader for status; for Node, the activation reader that `active-release-matches-checkout` already uses (`src/setup/registrations.mjs:2884` region). One comparison rule, one shared fixture; step 1 decides whether the Node row reads the two files or calls `fgctl status --json`, and reports why.

## Requirements

1. Pure `pin_drift(activation, pin)` in Rust returning none, `ahead-with-override(reason)`, or `differs(no override)`; `fgctl status` and `verify` print `active <d12> != pin <d12> (override: <reason> | none)` only when they differ.
2. Doctor row `activation-matches-pin`, status `warn` on difference, `fix` text giving the two honest choices: `fgctl init` (follow the pin) or `fgctl upgrade` then commit the pin (you are ahead on purpose). The row is skipped when no pin exists.
3. The digest-only-pin error lists three ways out (`fgctl init --from <source>`, `FGCTL_VERSION=<tag> fgctl init`, `fgctl init --override-pin`), checked against what `init_workspace_resolving :694` really accepts.
4. Release process: `docs/knowledge/how-to-cut-a-fgos-release-tag/cut-a-fgos-release-tag.md` gains a step after publish: run `fgctl upgrade` against the published release in the repo, commit the moved `.fgos/distribution.json` as `chore(release): pin <tag>`, and confirm the doctor row is quiet. Step 1 checks `upgrade_workspace_resolving :1408` really moves the pin; if it does not, the step names the exact edit instead of inventing a script.

## Files

**Modify:** `packages/distribution/rust/src/init.rs` (status line, error text), `verify.rs` if `verify` prints separately (step 1), `src/setup/registrations.mjs` (one row, after P02 and P01), the how-to above, `CHANGELOG.md`.
**Create:** a shared golden fixture under `packages/distribution/rust/tests/goldens/` used by both readers' tests.
**Delete:** none.
**Tests to retire:** none.

## Red tests first

Rust unit tests of `pin_drift` (equal, differs with override, differs without, no pin, digest-only pin); `test/setup/pin-drift-check.test.mjs` (new file: it tests a new row, no existing test owns it) using the golden; a `cli_surface.rs` case for the three-ways error.

## Net size

Rust about +40, Node about +30, docs about +15, tests about +50. RUL104 asks a new doctor row to name the row it replaces: none is replaced; decision 80 authorises this one; step 1 reports whether it can share a comparator with `active-release-matches-checkout` (plan Unresolved question 3).

## Steps

1. Facts: read the two readers and `upgrade_workspace_resolving`. 2. Red tests. 3. Rust, row, error. 4. How-to step; dry-read it against the last tag cut.

## Validation

FR the Rust tests, `test/setup/pin-drift-check.test.mjs`, `test/architecture.test.mjs`; on this machine `fgctl status` shows the drift it has today (it runs an override); `fgos doctor --json` row id count is old count plus one.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| The warning is noise on the owner's override-by-design machines | High x Low | `warn` not `fail`; the override reason is shown; the owner can read it as "intended" |
| Two readers of one contract drift | Med x Med | one golden fixture drives both tests |
| `init.rs` collision | Med x Med | chain P06, P10, P12 |

## Rollback

Revert the merge; the row and lines are read-only.

## Closes

PRN-02, CMD-10 (digest-only error), DOC-05 (partial -> done for pin drift); decision 80 Q4/5 (a).
