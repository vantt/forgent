# Track Closeout Report: Rust Host R1 Kernel

- Track: `rust-host-r1-kernel`
- Plan: [`plans/260910-1700-rust-host-r1-kernel/plan.md`](../plan.md)
- Date: 2026-09-11
- Reference Target: `x86_64-unknown-linux-gnu`

## 1. Overview and Delivered Scope

The `rust-host-r1-kernel` track implemented and delivered the full Rust `fgos` host, release packaging pipeline, tier-0 workspace resolver, and `fgctl` bootstrap lifecycle suite:

1. **Rust CLI Host (`apps/fgos`)**: Recognizes all 73 public selectors from generated descriptor [`packages/host-runtime/contracts/command-routes.json`](../../../packages/host-runtime/contracts/command-routes.json). Routes `legacy-cli` selectors through the Node.js payload ([`bin/fgos.mjs`](../../../bin/fgos.mjs)) with byte-identical stdout/stderr/signal/exit behavior, verified by the P02 parity harness.
2. **Native `version` Routing**: Pure `Router` and `InvocationService` kernel execution through built-in provider `distribution.build.show` without creating a Node child process, outputting byte-compatible `fgos.v1` envelope responses.
3. **Release Tree Packaging (`scripts/build-rust-distribution.mjs`)**: Stages standalone release distributions (`bin/fgos`, `bin/fgos-runner`, `libexec/legacy-node/`, `manifest.json`), verified with canonical content digests and covered by four `fgos doctor` diagnostics.
4. **Tier-0 Workspace Shim Resolver**: Transparent resolution of `.fgos/installation/bin/fgos` across Node (`resolveFgosBin`), shell integration ([`scripts/fgos-shell-integration.sh`](../../../scripts/fgos-shell-integration.sh)), and Herdr (`resolve_fgos`).
5. **`fgctl` Binary & Lifecycle Management (`apps/fgctl`)**: Content-addressed machine release store under `${XDG_STATE_HOME:-$HOME/.local/state}/fgos/`, atomic activation (`.fgos/installation/activation.json`), upgrade, rollback repair, and quarantine on integrity violation.
6. **Standalone Installer ([`install.sh`](../../../install.sh))**: Downloads and installs `fgctl` from GitHub releases with `SHA256SUMS` verification without cloning or requiring build toolchains.
7. **CI Release Pipeline & External Consumer Proof**: Workflow [`.github/workflows/release.yml`](../../../.github/workflows/release.yml) and automated verification script [`scripts/ci-external-consumer.sh`](../../../scripts/ci-external-consumer.sh).

## 2. Cell Merge History

Sourced from `git log` and `fgos coordination chain rust-host-r1-kernel --json`:

| Cell | Phase | Merge Commit | Review / Red-Team Verdict | Trace Document |
|---|---|---|---|---|
| P00 | [Phase 00](../phase-00-inventory-and-inputs-freeze.md) | `b3ea08d9` | Clean after 2 fix rounds (reviewer: 9+3 fixed; red-team: 2+1 fixed) | [p00.md](../../../docs/architect/agent-coordination/verification/rust-host-r1-kernel/p00.md) |
| P04 | [Phase 04](../phase-04-cargo-workspace-skeleton.md) | `26c2b261` | Clean after 2 fix rounds across 3 sessions; reviewer: 6 LOW (3 fixed); red-team: 1 MEDIUM fixed | [p04.md](../../../docs/architect/agent-coordination/verification/rust-host-r1-kernel/p04.md) |
| P01 | [Phase 01](../phase-01-command-route-descriptor.md) | `7dddcb4e` | Clean, 0 findings on final round, after 2 fix rounds across 4 sessions | [p01.md](../../../docs/architect/agent-coordination/verification/rust-host-r1-kernel/p01.md) |
| P02 | [Phase 02](../phase-02-parity-harness.md) | `fb09ecb2` | Clean after 3 fix rounds across 4 sessions; reviewer/red-team found 1 HIGH + 2 corroborating HIGH, 4 MEDIUM, all fixed | [p02.md](../../../docs/architect/agent-coordination/verification/rust-host-r1-kernel/p02.md) |
| P05 | [Phase 05](../phase-05-kernel-contracts-and-router.md) | `0121dbc3` | Clean after 3 fix rounds across 3 sessions; reviewer: 6 MEDIUM + 9 LOW; red-team: 1 HIGH documented/rejected then re-confirmed M2 | [p05.md](../../../docs/architect/agent-coordination/verification/rust-host-r1-kernel/p05.md) |
| P03 | [Phase 03](../phase-03-envelope-vectors-and-corpus.md) | `afa3c7cf` | Clean (0 HIGH, 0 open MEDIUM) after 2 fix rounds across 2 sessions; reviewer/red-team found 1 HIGH + 3 MEDIUM, all fixed | [p03.md](../../../docs/architect/agent-coordination/verification/rust-host-r1-kernel/p03.md) |
| P06 | [Phase 06](../phase-06-invocation-service-and-authority.md) | `4565b897` | Clean after 2 fix rounds across 2 sessions; 1 HIGH + lifecycle MEDIUMs + duplicate invocation ID collision fixed | [p06.md](../../../docs/architect/agent-coordination/verification/rust-host-r1-kernel/p06.md) |
| P07 | [Phase 07](../phase-07-cli-adapter-legacy-exec.md) | `37d4c1b3` | Clean, full-suite gate green, after 2 Lead fix rounds across 4 sessions; 4 red-team findings (2 HIGH, 2 MEDIUM) + 3 reviewer MEDIUM fixed | [p07.md](../../../docs/architect/agent-coordination/verification/rust-host-r1-kernel/p07.md) |
| P08 | [Phase 08](../phase-08-native-version.md) | `9fcf975d` | Clean after 1 Lead fix round across 5 sessions; reviewer found 1 HIGH (civil-date constants) + 2 MEDIUM, fixed | [p08.md](../../../docs/architect/agent-coordination/verification/rust-host-r1-kernel/p08.md) |
| P09 | [Phase 09](../phase-09-release-tree-builder-and-doctor.md) | `330e5c85` | Clean, full-suite gate green, after 3 Lead fix rounds across 5 sessions; 5 total HIGH fixed (path traversal, confinement bypasses) | [p09.md](../../../docs/architect/agent-coordination/verification/rust-host-r1-kernel/p09.md) |
| P10 | [Phase 10](../phase-10-tier-zero-resolver.md) | `db099242` | Clean after 2 Lead fix rounds + 1 clean red-team check across 4 sessions; 3 HIGH fixed (executable entry, symlink escape, cross-runtime parity) | [p10.md](../../../docs/architect/agent-coordination/verification/rust-host-r1-kernel/p10.md) |
| P11 | [Phase 11](../phase-11-fgctl-crate-and-release-store.md) | `d226fc5b` | Clean after 2 Lead fix rounds + 1 clean red-team check across 6 sessions; reviewer 2 MEDIUM (test hook dropped), red-team 2 MEDIUM (archive traversal, drive letter) fixed | [p11.md](../../../docs/architect/agent-coordination/verification/rust-host-r1-kernel/p11.md) |
| P12 | [Phase 12](../phase-12-fgctl-init-and-activation.md) | `42c5b1cb` | Clean after 3 Lead fix rounds across 6 sessions; 5 total HIGH fixed (activation lock, crash-orphaned lock reclamation, atomic hard_link creation) | [p12.md](../../../docs/architect/agent-coordination/verification/rust-host-r1-kernel/p12.md) |
| P14 | [Phase 14](../phase-14-install-script.md) | `da99a000` | Clean after 3 Lead fix rounds across 4 sessions; fixed spawnSync deadlock, unbounded network timeouts, symlinked fgctl refusal | [p14.md](../../../docs/architect/agent-coordination/verification/rust-host-r1-kernel/p14.md) |
| P13 | [Phase 13](../phase-13-fgctl-upgrade-repair-rollback.md) | `bafce71d` | Clean, full-suite gate green, after 2 Lead fix rounds across 4 sessions; red-team 1 HIGH (activation TOCTOU), crash-window self-heal verified | [p13.md](../../../docs/architect/agent-coordination/verification/rust-host-r1-kernel/p13.md) |
| P15 | [Phase 15](../phase-15-ci-release-and-external-consumer.md) | `5694a746` | Clean, full-suite gate green, after 1 Lead fix round across 2 sessions; 1 HIGH / 1 MEDIUM fixed by two-gate sequential digest verification | [p15.md](../../../docs/architect/agent-coordination/verification/rust-host-r1-kernel/p15.md) |
| P16 | [Phase 16](../phase-16-docs-changelog-closeout.md) | (current) | Docs, changelog, closeout report, full-suite gate verified | (this report) |

## 3. Deferred Findings Across All Cells

Every deferred finding recorded in the phase verification traces and cell status table:

1. **P00 (Phase 00)**:
   - 1 class deferred to P10: active skill-doc prose (`domains/coding/skills/**` etc.) invoking `bin/fgos.mjs` directly, outside R3's named 9-site scope. Resolved in P10.
2. **P04 (Phase 04)**:
   - LOW-1/LOW-4: No-action (false alarm / pre-existing).
   - LOW-6: Dev manifest fields, spawnSync vs real exec. Deferred to and addressed in P07.
3. **P01 (Phase 01)**:
   - None (0 findings on final round).
4. **P02 (Phase 02)**:
   - LOW nits only, all explicitly latent (no current call site triggers them) — exitCode-preservation edge case, process-spy environment filtering.
5. **P05 (Phase 05)**:
   - M1: The kernel cannot hold real `&'static dyn OperationProvider` values yet, because this phase is explicitly forbidden from declaring the trait body at all (R7) — a genuine contradiction inside the phase spec, resolved in R7's favor. Deferred to Phase 06+.
   - M2: A `replacement`-declaring duplicate pair passes `build_snapshot`'s linking check but `select()` never resolves it, always refusing `AmbiguousBinding`. Deferred, but only as a source comment — no owner in the plan corpus.
   - 4 LOW deferred: M2's plan-corpus ownership gap; `from_static` validation reach (public and unvalidated beyond the `CATALOG` test); a link-time catalog-membership check that could complement M3 without adding a second runtime enforcement point; `SNAPSHOT_FOR_TESTS`'s pub-field justification (same-crate, `pub(crate)` would serve it).
6. **P03 (Phase 03)**:
   - 1 MEDIUM: 2 of 8 R5 assertions test a mock. Real coverage exists in P02's `harness.test.mjs`.
   - 5 LOW deferred: golden vector edge cases, strict key ordering assertions.
7. **P06 (Phase 06)**:
   - MEDIUM-1-residual-on-HIGH-1: Catalog-policy admission is tautological in the only composition this crate offers. Deferred to Phase 08 as a named composition-root obligation.
   - 3 LOW deferred.
8. **P07 (Phase 07)**:
   - 1 MEDIUM accepted: Unknown-verb stderr text differs from Node's, same exit code `4`. Recorded in `CHANGELOG.md`.
   - 1 LOW deferred to P09/P11: Fallback probe order.
   - Recursion-guard: Inherent env-var-clearing limitation accepted per documented threat model.
9. **P08 (Phase 08)**:
   - LOW-1: `cli_projector.rs`/`main.rs` single-native-route shortcut. Deferred as debt for next native route.
   - LOW-2/3/5: Accepted as documented plan-directed caveats (hardcoded tests on version bump, `include_str!` compile-time package.json, multi-strategy fallback).
10. **P09 (Phase 09)**:
    - MEDIUM-4: Manifest missing `releaseVersion`. Flagged for P11+.
    - MEDIUM-6: Two P07-introduced env vars never registered with `fgos setup`. Flagged for P11+.
    - Several LOW accepted as documented caveats.
11. **P10 (Phase 10)**:
    - MEDIUM: Worktree-topology limitation for `cli.mjs` tier-0 resolution. Ratified as Lead decision, deferred to cutover track.
    - Pre-existing `cohort-planner` flake and minor LOW accepted as documented caveats.
    - LOW (found in P16 closeout verification): the cell's `herdr::resolve_fgos` addition to `fgos.rs`/`main.rs` was never run through `cargo fmt`, since `herdr-plugin` is `[workspace].exclude`d from the track's own `cargo fmt --all -- --check` gate and no reviewer/red-team round caught it. 6 new unformatted hunks against an already-unformatted pre-existing baseline (see §5). Deferred — fixing it now would touch code outside this closeout cell's own docs-only lease.
12. **P11 (Phase 11)**:
    - M1: Stale-lock ownership after a crash. Flagged for P12/P13 lock format.
    - L3–L8 and 2 new LOW (pax-global-header format; same-trust-domain archive-reopen TOCTOU) accepted as documented caveats.
    - INFO: Phase 09's manifest builder does not yet emit `digestKind`, `releaseVersion`, `sourceRevision`, `createdAt`, `requires.git`, or `stateSchemas`; `fgos-distribution`'s `ReleaseManifest` accommodates these as optional fields so deserialization never hard-fails. Not a P11 defect — anticipated explicitly by this phase's own requirements.
13. **P12 (Phase 12)**:
    - MEDIUM F2: A 2-syscall reclaim-path race, injection-only, never spontaneous, identical to the residual window in reference `main-checkout-lock.mjs`. Deferred to a structurally different mechanism (flock or tombstone-rename).
    - Several LOW accepted as documented caveats.
14. **P14 (Phase 14)**:
    - LOW/INFO accepted as documented caveats: static source-regex test limits; tar symlinked-dir/hardlink escape refusal is environment behavior; byte-drip server without coreutils `timeout`.
15. **P13 (Phase 13)**:
    - LOW: Missing dedicated regression test for init-door chain-past rule (twin upgrade-door has one).
    - 2 INFO: Quarantined `previousArtifactDigest`; sub-ms same-digest lock-guard window.
    - LOW/L2-L9 DRY/duplication notes carried from round 1.
16. **P15 (Phase 15)**:
    - 4 LOW carried: Gate 1 checksum recompute runs after `fgctl init` staged archive; phase file R1 prose describes pre-fix single-gate design; `gh release create` line continuations collapsed; `build-rust-distribution.mjs` distribution-output-dir exemption has no unit test.
    - INFO: GitHub prerelease tag resolution on `/releases/latest`.

## 4. Performance Measurements

Both performance budgets defined in `plan.md` §Decisions table and Phase 08 R9 were measured warm on the reference host architecture (`x86_64-unknown-linux-gnu`, 12th Gen Intel Core i7-12650H, 16 CPUs):

### Exact Reproduction Command

```sh
node scripts/run-rust-dev-host.mjs version && node scripts/measure-p08-performance.mjs
```

### Measured Numbers

Sourced from the committed
[`plans/260910-1700-rust-host-r1-kernel/reports/p08-performance.json`](p08-performance.json)
artifact. The reproduction command above rewrites that same file in place —
running it re-measures live rather than reading a static number, and every
live re-run observed this cell (2.638 ms, 3.131 ms, across two separate runs
on this shared host) landed well inside budget but never reproduced the
committed `0.263 ms` figure to the decimal; the committed artifact was
restored via `git checkout` after each verification run so this report cites
only it, not a live re-measurement:

1. **Legacy Exec Overhead (`ready` selector)**:
   - Definition: Wall time of `fgos <legacy selector>` through the Rust CLI minus direct `node <payload> <selector>`, both warm (51 samples, 5 warmup rounds).
   - Rust CLI p50: `374.634 ms`
   - Direct Node p50: `374.371 ms`
   - **Overhead p50**: `0.263 ms`
   - **Budget / Threshold**: `≤ 25 ms`
   - **Status**: **PASS (within threshold)**

2. **Native `version` Latency**:
   - Definition: Wall time of `fgos version` through the native Rust route (51 samples, 5 warmup rounds).
   - **Native Version p50**: `6.183 ms`
   - **Budget / Threshold**: `≤ 10 ms`
   - **Status**: **PASS (within threshold)**

## 5. Full-Suite Verification Gates

`plan.md`'s own `FULL_TEST` definition (line 323) is the whole-repo Node suite,
not just the rust-host subset:

```sh
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs' \
  && cargo fmt --all -- --check \
  && cargo clippy --workspace --all-targets -- -D warnings \
  && cargo test --workspace \
  && cargo test --manifest-path herdr-plugin/Cargo.toml
```

`plan.md` itself documents one pre-existing, non-regression red test in that
Node suite (lines 336-338: `cohort-planner` "buildCandidateInventory against
the real committed", `check-decision-citation-drift`), so the chained command
above does not itself exit 0 — each piece was verified individually instead:

| Command | Target / Scope | Result / Exit Code |
|---|---|---|
| `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'` | Whole-repo Node suite | Exit code 1 — 6030/6038 passed, 7 skipped, 1 failed (`cohort-planner`'s `buildCandidateInventory` test, the plan.md-documented pre-existing red, reproduced identically on unmodified `main`, not a regression) |
| `cargo fmt --all -- --check` | Rust formatting across the workspace only — `herdr-plugin` is `[workspace].exclude`d, so this command does not cover it (see below) | Passed (exit code 0) |
| `cargo fmt --manifest-path herdr-plugin/Cargo.toml -- --check` | Rust formatting for `herdr-plugin` specifically | **Fails** — 276 diff hunks across 12 files. 270 of those hunks, in all 12 files, reproduce identically on unmodified `main` — pre-existing, unrelated to this track. The remaining 6 (`fgos.rs` 8→13, `main.rs` 52→53) are new, introduced by this track's own Phase 10 commits, since no tooling this track ran ever covers `herdr-plugin`'s formatting (it is `[workspace].exclude`d from every `cargo fmt --all` call, including this cell's own). Not part of `plan.md`'s own `FULL_TEST` definition, which only names the two commands above it, but recorded here for completeness since "workspace and `herdr-plugin`" is otherwise a misleading claim |
| `cargo clippy --workspace --all-targets -- -D warnings` | Rust linting across all workspace crates and targets | Passed (exit code 0) |
| `cargo test --workspace` | Rust unit and integration tests across workspace crates | Passed (exit code 0) |
| `cargo test --manifest-path herdr-plugin/Cargo.toml` | Rust integration and unit tests for `herdr-plugin` | Passed (exit code 0, 225 tests passed) |
| `scripts/ci-external-consumer.sh --assets dist` (a hand-built distribution directory, packaged per `.github/workflows/release.yml`'s own steps) | External consumer proof on clean environment | Passed (exit code 0) |
| `source scripts/fgos-shell-integration.sh && fgos coordination chain rust-host-r1-kernel --json` | Coordination chain status read | Passed (exit code 0) |

Every command above was run individually and its real exit code recorded;
none were assumed. The two non-zero exits are the plan.md-documented
pre-existing `cohort-planner` red and the `herdr-plugin` formatting drift
noted above — neither is part of `plan.md`'s own `FULL_TEST` definition.
The `cohort-planner` red is entirely pre-existing; the `herdr-plugin`
drift is overwhelmingly pre-existing (270 of 276 hunks) with a small
addition (6 hunks, 2 files) this track's own Phase 10 introduced — see
§3.
