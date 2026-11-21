---
contract: plan-v1
title: "Native Windows CI green on its two packaging reds: P7 tail-failure fixture and the windows-msvc addon digest"
status: running
lead: lead:WINCI
base: e61cfb050eeacd3a379fc459b1e08457cd04a5e9
priority: P1
blockedBy: []
footprint:
  - plans/261121-1456-windows-ci-packaging-reds/**
  - test/rust-host/fgctl-upgrade.test.mjs
  - test/rust-host/fgctl-init-preflight-tail.test.mjs
  - test/rust-host/fgctl-init-fixture.mjs
  - .github/workflows/release-assets.yml
  - Cargo.toml
  - packages/git/node-addon/Cargo.toml
  - packages/git/node-addon/build.rs
  - scripts/build-rust-distribution.mjs
  - docs/platform/packaging-distribution/spec.md
source:
  - p-xh3zdvzyip
  - p-omvbh4a7xm
created: 2026-11-21
---

# Native Windows CI green on its two packaging reds

## Outcome
`release-assets-check` on `windows-latest` is green on both packaging reds. The two installer P7 tail-failure tests
pass natively because their fixture injects a failure the tail really reaches on Windows, and `compare addon digests`
passes because the windows-msvc addon build is reproducible, with the source of the non-determinism named and fixed.

## Facts (prior art, 2026-11-21)
- P7 (p-xh3zdvzyip). On Windows `fgctl upgrade` and `fgctl repair` exit 0 under `SIMULATE_TAIL_FAILURE=1`
  (CI 44878105727 and 44640908347: "upgrade must fail when tail fails", actual 0). The fixture
  `releaseWithFailingTail` (`test/rust-host/fgctl-upgrade.test.mjs:98`) puts the failure at the top of
  `libexec/legacy-node/src/setup/doctor-bridge.mjs`. The tail's `fgos init` reaches the bridge only through the
  Work store step (`apps/fgos/src/wiring/init.rs:177`), and that step is gated on
  `fgos_event_store::lifecycle::platform_supported()`, which is `cfg!(target_os = "linux")`. So on Windows the
  injection never runs. The installer code is correct: `run_tail_step` (`packages/distribution/rust/src/init.rs:767`)
  marks `ready-degraded` and fails whenever the step exits non-zero. The defect is in the fixture.
- `test/rust-host/fgctl-init-preflight-tail.test.mjs:218` uses the same injection. It does not run on Windows yet
  (its CI step has `if: runner.os != 'Windows'`), but it shares the defect, so it gets the same fixture fix.
- Digest (p-omvbh4a7xm). `.github/workflows/release-assets.yml` sets `RUSTFLAGS=-C link-arg=/Brepro` in `build`
  and `independent-addon`, writes only `addon-digest.txt`, and `compare-addon` runs `cmp` on the two digests. Origin
  of this check: 1cd91c992 (stage, verify and audit the combined native addon). The addon is
  `packages/git/node-addon` (cdylib, napi 2.16, `build.rs` = `napi_build::setup()`); the root `[profile.release]`
  sets only `strip = "symbols"`. Failing and passing run ids are in the backlog row.

## Prior art reused, and what was missing
Reused: the existing `SIMULATE_TAIL_FAILURE` tests and their assertions (unchanged), the existing build,
independent-addon and compare-addon jobs and their artifact names. Missing: a fixture failure point the Windows tail
reaches, the addon bytes on a mismatch, and a deterministic windows-msvc link. No new verb, config key, job or
mechanism. The PE section diff is done once by the worker on the downloaded files and is not committed as a tool.

## Acceptance criteria
1. On native `windows-latest`, `release-assets-check` job `focused tests (windows-latest)` is green, and both P7
   tail-failure tests report `ok` in step "Node tests for installers and release packaging". There is no skip and no
   platform branch in the test, and the assertions are unchanged. Linux `focused tests` stays green.
2. On a digest mismatch, `compare addon digests` uploads both windows-msvc addon files as an artifact, and still
   fails.
3. A PE diff of a real mismatch pair names the differing section. The cause is fixed at its source and recorded in
   the packaging-distribution spec. Afterwards `compare addon digests` is green on at least three windows runs of
   the same commit. The job stays blocking and is never retried until green. lead:OPC reviews phase 3.
4. The green windows-latest run ids are written in the Log below.

## Non-goals
- Running `fgctl-init-preflight-tail.test.mjs` on Windows. Its step stays Linux-only, for the reasons listed in the
  workflow.
- An Event Store or Work store on Windows.
- The `windows git custody` job, which lead:WINCUSTODY owns.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [P7 tail-failure fixture the Windows tail reaches](phase-01-p7-tail-fixture.md) | - | test/rust-host/fgctl-upgrade.test.mjs, test/rust-host/fgctl-init-preflight-tail.test.mjs, test/rust-host/fgctl-init-fixture.mjs | 1 | ready |
| 2 | [Addon bytes on a digest mismatch, PE section named](phase-02-addon-mismatch-evidence.md) | - | .github/workflows/release-assets.yml | 1 | ready |
| 3 | [Deterministic windows-msvc addon](phase-03-addon-determinism-fix.md) | 2 | .github/workflows/release-assets.yml, Cargo.toml, packages/git/node-addon/Cargo.toml, packages/git/node-addon/build.rs, scripts/build-rust-distribution.mjs, docs/platform/packaging-distribution/spec.md | 2 | ready |

Execution: one linked worktree per phase (`fgos worktree create`), with a worker started by
`fgos run --writes <phase footprint> --worktree <wt>`. Windows proof comes from pushing the phase branch and running
`gh workflow run release-assets-check.yml --ref <branch>`. The lead rebases and lands each phase with
`fgos land <branch>`.

## Coordination
lead:WINCUSTODY (forgent-4b) edits `.github/workflows/release-assets-check.yml` (a new job only). This plan does not
write that file. Its footprint also has `scripts/build-rust-distribution.mjs`, so whoever lands second rebases.

## Owner questions
None open. The owner approved this plan on 2026-11-21. If the digest fix needs a new mechanism, the supervisor is
asked first.

## Overlap note
plan-contract-check reports an overlap with 261118-1341-s6a-execution-tier-rust (`Cargo.toml`,
`packages/git/node-addon/**`, `test/rust-host/**`) and with 261121-1309-git-windows-custody
(`scripts/build-rust-distribution.mjs`). This is intended. Phase 1 writes only the three P7 test files. Phase 3
touches `Cargo.toml`, the addon crate files or the build script only if the PE diff points there, and whoever lands
second rebases.

## Risks and rollback
- The digest mismatch is intermittent. Phase 2 may need several dispatched runs before it catches a mismatch pair.
- If the fix needs a file outside phase 3's footprint, the phase is parked and the supervisor is asked.
- Rollback: revert the phase's land commit. Each phase is one land.

## Log
- 2026-11-21 lead:WINCI: plan written against origin/main e61cfb050. P7 cause found while writing it (see Facts).
