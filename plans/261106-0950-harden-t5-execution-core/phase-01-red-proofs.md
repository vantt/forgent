---
phase: 01
title: "Red proofs: one failing test per open defect, in the file that owns its behaviour, shown red on main; never landed alone"
status: pending
depends_on: []
parallel: "none (wave 0; short)"
effort: ~0.5d
net_size: "0 / 0 / 0 here (each test is counted in the phase that lands it with its fix)"
---

# Phase 01 — Red proofs

## Context

Loop close rule: no High-or-above finding left unreproduced (per-layer loop step 9). The red-team reproduced R-2, R-3, R-5 and the R-1 residual with scratch scripts outside the repo; R-6/H-T4f, B-8 and B-13 are reasoned; B-7 was measured on live state. None of these has a test in the repo on `4b116c27e`. Each fix phase takes its red test from this branch, so every fix starts from a proof that fails on main.

Code read on `4b116c27e`:
- R-2: `herdr-round.mjs:309-310` (claude target = real `~/.claude.json`), `:463-465` (seed when no worker home), `trust-store.mjs:203-236` (`seedTrust`/`removeTrust` read-modify-rename, no lock).
- R-3: `runner.schema.yaml:9,158,422,690` (`x-fgos-scope: both`); `scope.rs:47-91` (`judge`).
- R-5: `resources.mjs:92-99` (`MACHINE_PRIVATE_ROOTS`), `:312-333`; `bwrap.mjs:559` (`--ro-bind / /`), `:644,654` (`--tmpfs` masks).
- A8 residual: `provider-credential-renewal.mjs:1217-1258` (a newer copy is staged and applied under the account lock with no probe and no identity check).
- R-6/H-T4f: `assignment-runner.mjs:1908` (home), `:1948` (pane), `:2034` (envelope), `:2119-2143` (`finally`: intent removed when settled without envelope; pane released by `abandon`, the bwrap home not finalized).
- B-7: `provider-capacity.mjs:661` (write), no delete.
- B-8: `worker-session-boot.mjs:118-172` (`existsSync` then detached `spawn`; `spawnFn`/`existsSync` are already injectable parameters at `:121-122`).
- B-13: `recovery-planner.mjs:60,160-202,377`; `recover.mjs:238-252` (unlinks `dispatch.claim`, which no `src` code writes).

## Requirements

One test per row, in the named owning file (extend it; no new file unless the row says so). Each test names its behaviour in plain words, without finding codes. Show it red on `origin/main` (record command and failing assertion in the report), then commit on `harden/t5-p01-red-tests`. The branch never lands by itself; each fix phase cherry-picks its rows.

| Behaviour (test title, plain words) | Owning file | Lands in |
|---|---|---|
| an unconfined claude pane never writes the operator's claude store | `test/runner/dispatch-trust-store.test.mjs` (or `herdr-private-home-trust.test.mjs` if it owns `seedAttemptTrust`) | P05 |
| a project file cannot lower a capability's confinement | `packages/config/rust/tests/golden_scope.rs` | P04 |
| a confined worker cannot read a login store the account inventory names | `test/runner/dispatch-confinement-p04.test.mjs` or the probe-harness test that owns blind reads (stand-in stores under a scratch home, never real logins) | P03 |
| a renewed login whose account differs from the leased account is never applied | `test/runner/provider-credential-renewal.test.mjs` | P03 |
| a held home settles by itself once its login is safe | same file (expected red: held homes stay held) | P03 |
| a launch refused before the handover leaves no attempt home and no pane | the `assignment-runner` launch test the lead finds owns pre-handover refusals (`test/runner/assignment-dispatch.test.mjs` candidate) plus Rust `adopt_matrix.rs` for the intent-only case | P06 |
| an attempt whose outcome is recorded leaves no assignment record in the provider state | `test/runner/provider-capacity.test.mjs` | P07 |
| two seats starting at once share one worker session server | `test/runner/dispatch-worker-session-boot.test.mjs` (injected `spawnFn` counting calls) | P07 |
| recover offers no action that only reports success | `test/verbs/dispatch-recovery.test.mjs` (or `test/runner/recovery.test.mjs`, whichever owns the planner) | P07 |

## Files

**Create:** none (tests extend owning files).

**Modify:** the test files in the table only.

**Delete:** none.

**Tests to retire:** none.

## Net size

0 / 0 / 0 here; about +250 test lines distributed to P03–P07.

## Steps

1. For each row, find the owning test (`rg -ln "<function name>" test`), read it, add the case.
2. Run it on `origin/main` (FR for Node, `cargo test -p fgos-config --test golden_scope` for Rust), record red.
3. Commit per row (`test(...)`: plain behaviour), push the branch, write the report with the red evidence table.

## Validation (focused)

- FR on each touched Node file: the new case fails, the others pass.
- `cargo test -p fgos-config --test golden_scope`: only the new case fails.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A test that cannot be red without a live provider or herdr | M × M | Use the seams that exist (`spawnFn`, fake herdr in Rust tests, stand-in stores); the R-5 case uses the probe harness with stand-ins, as `confinement-blind-read` does. If no seam exists, report it; the fix phase proves it by reasoning plus its wiring test. |
| Red test touches the real `~/.claude.json` | L × H | Every trust test points `HOME`/store path at a scratch dir; the lead greps the test for `os.homedir()` before running. |

## Rollback

Nothing lands. Delete the branch if abandoned.

## Done when

Every row red on `origin/main` with recorded evidence; branch pushed; report written.

## Lead brief essentials

No production code. Owning file first. Scratch homes only. All plan.md lead rules apply.
