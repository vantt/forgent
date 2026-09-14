# Packaging-Distribution Code-Panel Track Closeout

```txt
Document type: Verification closeout
Audience: Packaging-distribution coordinator, release owner, maintainer
Purpose: Record packet merge commits, proof commands, remaining partial claims, and release decisions for the packaging-distribution code-panel track
Design status: Draft
Implementation status: Current evidence snapshot
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code-panel packet reports, panel branch verification, and packaging-distribution verification docs
Last reviewed: 2026-09-15
Related:
- docs/platform/packaging-distribution/code-panel-rollout-plan.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/verification/source-preservation-audit.md
- docs/platform/packaging-distribution/verification/install-and-release-proof.md
```

## 1. Track State

Panel branch: `panel/packaging-distribution-rollout`

Panel verification HEAD before this closeout report:
`d3384e9a merge(packaging): stabilize final verification timing`

The closeout report itself is recorded by the containing panel-branch commit.
Main-merge preview branch: `pd-main-integration-packaging-rollout`
Main-merge preview commit: `b909476c merge(packaging): land code-panel rollout`
Main merge commit: `f6849be3 merge(packaging): land code-panel rollout on main`
Final verification hygiene commit: `0b528b6e test: stabilize final main verification`

All packet branches P1-P9 have been merged into the panel branch. The final two
panel-only hygiene merges stabilized verification expectations exposed by the
whole-track suite; they do not add new packaging-distribution product scope.

## 2. Packet Merge Ledger

| Packet | Merge commit | Branch/worktree | Result |
| --- | --- | --- | --- |
| P0 | main audit seed before panel execution | already done in main audit pass | Preservation audit seeded the track. |
| P1 | `d3a12f88` | `pd-code-panel-domain-move` | Merged. |
| P2 | `7930e11a` | `pd-skill-source-layout` | Merged. |
| P3 | `515552d6` | `pd-instruction-source-registry` | Merged. |
| P4 | `1d16c6e3` | `pd-instruction-merge-policy` | Merged. |
| P5 | `c3f6ab9c` | `pd-instruction-renderers` | Merged. |
| P6 | `391993fc` | `pd-rust-schema-freeze` | Merged. |
| P7 | `3cfa9a5d` | `pd-rust-init-tail` | Merged. |
| P8 | `1d2b2bb3` | `pd-legacy-setup-retirement` | Merged. |
| P9 | `e866fe04` | `pd-legacy-doc-redirects` | Merged. |
| Final verification hygiene | `006003fb`, `d3384e9a` | `pd-final-verification-hygiene`, `pd-final-verification-flake-fix` | Merged after whole-track failures exposed stale/flaky test expectations. |

## 3. Whole-Track Proof

These commands passed on the panel branch:

```bash
node --test test/architecture.test.mjs
node --test test/cli/fgos-manifest.test.mjs test/setup/checks-setup-rc-line.test.mjs
node --test test/setup/*.test.mjs
node --test test/skills/*.test.mjs
node --test test/install-packaging.test.mjs test/install/*.test.mjs
node --test test/rust-host/*.test.mjs
npm test
```

Final `npm test` result:

```txt
tests 6470
suites 1
pass 6462
fail 0
cancelled 0
skipped 8
todo 0
```

These commands passed again on the main-merge preview result
`b909476c merge(packaging): land code-panel rollout`:

```bash
cargo build --release --workspace
node --test test/architecture.test.mjs test/cli/fgos-manifest.test.mjs test/setup/checks-setup-rc-line.test.mjs test/setup/*.test.mjs test/skills/*.test.mjs test/install-packaging.test.mjs test/install/*.test.mjs test/rust-host/*.test.mjs
npm run build:skills
npm test
git diff --check
git diff --cached --check
node /home/vantt/projects/forgentX/.gitnexus/run.cjs detect_changes --repo /home/vantt/projects/pd-main-merge-preview
```

Main-merge preview focused proof:

```txt
tests 699
suites 1
pass 699
fail 0
cancelled 0
skipped 0
todo 0
```

Main-merge preview `npm test` result:

```txt
tests 6522
suites 1
pass 6514
fail 0
cancelled 0
skipped 8
todo 0
```

Main-merge preview GitNexus change detection reported low risk after indexing
the preview worktree. The analyzer's AGENTS/CLAUDE metadata count side effect
was not included in the merge result.

These commands passed on `main` after the final merge and final verification
hygiene:

```bash
cargo build --release --workspace
node --test test/rust-host/harness.test.mjs test/rust-host/release-tree.test.mjs
node --test test/report/enduser-index.test.mjs test/state/fgos-logs-bucket.test.mjs test/runner/codex-cli-glm-cli-live-executors.test.mjs
node --test test/architecture.test.mjs test/cli/fgos-manifest.test.mjs test/setup/checks-setup-rc-line.test.mjs test/setup/*.test.mjs test/skills/*.test.mjs test/install-packaging.test.mjs test/install/*.test.mjs test/rust-host/*.test.mjs
npm test
git diff --cached --check
```

Final main focused proof:

```txt
tests 700
suites 1
pass 700
fail 0
cancelled 0
skipped 0
todo 0
```

Final main `npm test` result:

```txt
tests 6523
suites 1
pass 6514
fail 0
cancelled 0
skipped 9
todo 0
```

Additional P9 proof:

```bash
node --test test/architecture.test.mjs
git diff --check
git log --all --oneline -- docs/architect/packaging-distribution/migration-map.md docs/architect/packaging-distribution/rewrite-plan.md
```

The legacy doc link/read-through proof covered all current
`docs/architect/packaging-distribution/**` files and recorded absent/no-history
errata for `migration-map.md` and `rewrite-plan.md` in
`verification/source-preservation-audit.md`.

## 4. P6/P7 Host-Invocation Handoff

P6 owns the Rust manifest/release handoff fields and manifest-based Rust host
fallback proof. P7 owns workspace activation end-to-end proof.

Evidence recorded in `verification/implementation-alignment.md`:

| Claim | Status | Evidence |
| --- | --- | --- |
| Release tree includes native `bin/fgos`, runner shim, legacy Node payload, and manifest. | implemented | `scripts/build-rust-distribution.mjs`, `test/rust-host/release-tree.test.mjs`, `packages/distribution/rust/src/manifest.rs`, `packages/distribution/rust/tests/schema_golden.rs` |
| Workspace activation is per-workspace through `.fgos/installation/activation.json`. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs`, `src/setup/bin-discovery.mjs` |
| `fgctl` never writes host-visible projections directly. | implemented | `apps/fgctl/src/main.rs`, `packages/distribution/rust/src/init.rs`, `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs` |

The active plan note requires the workspace activation proof where
`.fgos/installation/bin/fgos version --runtime-json` enters the Rust host and
reports the activated `artifactDigest`. The P7 rust-host proof suite is green
and the alignment table records activation/runtime-tail behavior as implemented;
release posture remains partial until the release owner approves public/default
runtime claims.

## 5. Updated Status Surfaces

The track updated these status/proof surfaces:

- `docs/platform/packaging-distribution/verification/implementation-alignment.md`
- `docs/platform/packaging-distribution/verification/source-preservation-audit.md`
- `docs/platform/packaging-distribution/verification/install-and-release-proof.md`
- `docs/platform/packaging-distribution/code-panel-rollout-plan.md`
- `docs/platform/packaging-distribution/README.md`
- `CHANGELOG.md`

## 6. Remaining Partial Claims

These claims remain intentionally partial or planned; they were not silently
promoted by packet proof:

| Claim | Current status | Why it remains open |
| --- | --- | --- |
| `fgctl` is the recommended install/bootstrap entry. | partial | Needs a current GitHub release asset path before the whole install channel can be called fully implemented. |
| Repository/workspace/release-store layout boundaries are explicit. | partial | Worker capsule and projection ledger implementation still need focused scan/proof. |
| Host-neutral skill intent ids map to host-native triggers. | partial | Existing direct mapping is implemented, but public intent metadata or explicit alias contract remains open. |
| Gemini receives a native extension/package target for fgOS skills. | partial | Prototype generator exists; full build/release packaging, install pipeline, and doctor integration are later work. |
| Packaging-distribution component boundary is fully promoted. | partial | Detailed component-boundary source still needs promotion into `docs/platform/component-boundary.md`. |
| Shared gateway/web owns a runtime adapter. | planned | Future-only until gateway grows runtime-adapter authority. |

## 7. Release Decisions Still Required

The code-panel track does not decide these product/release questions:

- preview versus stable/default public release;
- Node fallback compatibility window;
- whether installed/default runtime claims may flip;
- whether host-invocation R1 may move from the current partial posture to implemented.

The coordinator/user approved and completed the merge to `main` after the
panel-branch proof and main-merge preview proof passed.

## 8. Main Merge Gate

The panel branch satisfied the technical preconditions for the final merge:

- all closed packet branches are merged into `panel/packaging-distribution-rollout`;
- no unresolved packet-to-packet conflicts remain on the panel branch;
- whole-track proof commands are recorded in this closeout;
- `source-preservation-audit.md` is updated for legacy/source details touched by the track.

The current main checkout's dirty state was preserved first in
`23fb220e chore: preserve main worktree before packaging merge`, then the proven
integration branch was merged into `main` at `f6849be3`.

The merge had content conflicts in the legacy packaging-distribution docs listed
below. Resolution kept the promoted-source metadata block from the preserved main
snapshot and the historical redirect language from the code-panel track:

```txt
docs/architect/packaging-distribution/README.md
docs/architect/packaging-distribution/future-constraints.md
docs/architect/packaging-distribution/history/distribution-baseline.md
docs/architect/packaging-distribution/runtime-identity-and-activation.md
docs/architect/packaging-distribution/scope-map.md
docs/architect/packaging-distribution/workspace-runtime-model.md
```
