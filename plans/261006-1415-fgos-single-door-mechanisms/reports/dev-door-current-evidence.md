# Current dev-door evidence — 2026-10-06

## Scope and provenance

Incremental companion to [historical Phase 03 research](phase-03-canonical-door-research.md), not its replacement. New execution snapshot: `/home/vantt/projects/worktrees/forgentX-single-door-execution`, branch `feat/single-door-execution`, HEAD `36dc5f083fea3e43c769596cb1e2a2ce70dfb387`. Source observations precede Phase 04 edits. [Revised Phase 03](../phase-03-canonical-door-research-decision.md) keeps D1=B approved: name the existing development host `fgos:dev`; A/restaging remains the route when plain `fgos` must change. C/development activation research was not repeated.

Read first: `docs/specs/reading-map.md:7,15,36`, current `docs/platform/packaging-distribution/README.md:44-76`, and legacy `docs/specs/distribution.md:9-19,43-53`. The portal's authority rule separates target contracts, implemented code and historical compatibility. Current source was inspected only to establish this checkout's host/layout constraints. No host invocation, cargo/build, stage, upgrade, setup, activation changes, tests, lint, formatters, commits or timing runs occurred.

## Current observed source facts

The inspected `scripts/run-rust-dev-host.mjs` retains the historical behavior:

| Concern | Source | Current behavior |
| --- | --- | --- |
| Payload/build source | lines 8-17 | Checkout root is derived from script URL; `cargo build` always runs there with inherited environment. Even a read-only CLI verb through this wrapper would build. |
| Arguments | lines 92-101 | Rust child gets `process.argv.slice(2)` directly; no wrapper argv parser. |
| Runtime workspace | lines 93-95 | Child cwd is `process.cwd()`, not `INIT_CWD`. Build source and runtime workspace are distinct concerns. |
| Binary/hash | lines 35-36,92 | Uses `<checkout>/target/debug/fgos`, independent of Cargo's inherited custom target environment. |
| Manifest | lines 28-40,69-89 | Writes `<checkout>/target/dev-manifest.json`; `entries.fgos` and native file path are `target/debug/fgos`. |
| Node payload | lines 42-46,61-67 | Manifest selects checkout root `.` and `bin/fgos.mjs`; digest is entry-file hash, not a full working-tree fingerprint. |
| Active selection | lines 96-100 | Explicit `FGOS_ACTIVE_RELEASE_PATH=<checkout>` and `FGOS_ACTIVE_MANIFEST_PATH=<manifest>`. No activation file mutation. |
| Terminal outcome | lines 103-114 | Spawn errors fail; child status propagates; signals are forwarded by re-signalling wrapper. |

Historical Rust adapter argument/cwd and plain-shim selection research is retained in the earlier report; those findings were not rerun. Reading argv forwarding does not prove all verbs work. The npm package-root cwd concern and required `INIT_CWD` correction are retained plan requirements, not a smoke observation here.

## New filesystem observation: this checkout really shares target

Raw Node `fs.lstatSync`, `fs.readlinkSync`, and `fs.realpathSync` observed:

| Path | Entry type | Link/real destination |
| --- | --- | --- |
| Execution `target` | Symlink | `/home/vantt/projects/forgentX/target` |
| Execution `node_modules` | Symlink | `/home/vantt/projects/forgentX/node_modules` |
| Main `target` | Real directory, not symlink | `/home/vantt/projects/forgentX/target` |

In this research process, both `CARGO_TARGET_DIR` and `INIT_CWD` are unset. Other process environments and Cargo configuration were not inventoried.

This differs from the historical research checkout `/home/vantt/projects/forgentX-worktrees/single-door-mechanisms`, where `target` did not exist. Both observations remain valid for their own paths and snapshots. No directory or link was created, removed or altered to reproduce either observation.

**[INFERENCE]** In the unchanged host, execution-checkout and main invocations now write the same target manifest and binary paths. Concurrent invocations can interfere; coordinator must serialize development-host/Rust-build work across these actual shared artifacts. This worker did not run either invocation.

## Verifier implications

Current `packages/distribution/rust/src/verify.rs:121-165` was read: `verify_release_files` walks every manifest file segment using `symlink_metadata`, returns `SymlinkRefused` on any symlink segment (151-155), and requires canonical file paths to stay inside canonical release root (158-163).

**[INFERENCE from current source plus observed layout]** The unchanged manifest's listed `target/debug/fgos` traverses the execution checkout's symlink `target`; if passed through this verifier it is refused. This is a path-safety constraint, not merely concurrent-build risk. No verifier or dev-host run was used to reproduce failure.

Cargo inherits `CARGO_TARGET_DIR` via `process.env`, but host binary selection, hashing and manifest paths ignore it. **[INFERENCE]** A custom output directory can leave the wrapper looking for a missing or stale default binary. Merely substituting an external absolute path into the manifest cannot satisfy release-root containment. Phase 04 must use a concrete verifier-compatible artifact/layout strategy; retain symlink refusal and containment rather than weakening verification. No real custom-target success is asserted.

## Concrete Phase 04 handoff

Use the approved [Phase 04 contract](../phase-04-doctor-active-release-drift-check.md), not the historical report's obsolete phase line numbers:

1. Expose `npm run fgos:dev -- <verb> [args]` through the existing host. Retain direct forwarding and terminal-outcome behavior.
2. Runtime child cwd must use `process.env.INIT_CWD ?? process.cwd()` while Cargo source cwd remains script checkout root. Coordinator should exercise a real consumer from a workspace subdirectory, not a forwarding-only echo/mock or permanent source-wording test.
3. Resolve target behavior consistently for Cargo output, executed/hash-selected native binary and manifest. This checkout's shared symlink is a real acceptance case. Preserve verifier containment and symlink refusal; choose confined native artifact placement rather than an escaping manifest path. Custom/external target support and shared-target concurrency require concrete implementation evidence before claiming success.
4. Serialize actual development invocations across main/execution shared target. Do not build Rust concurrently; do not alter existing links or activation as part of this evidence assignment.
5. Implement Node-payload-only `active-release-matches-checkout` against doctor's explicit `dir` working tree, not HEAD, process cwd or main by assumption. Reuse the packaging source list once for builder/check. Exclude staged `node_modules` and packaging shims; pass-skip linked-worktree activation belonging to main; turn unsafe-file/read failures into a failed check, not a crashed doctor. Do not add Rust binary drift hashing.
6. Drift guidance retains B for running working-tree code and A for changing plain `fgos`. Update check registry/id, inventory row #7 and scoped portal/how-to/changelog claims with observed behavior, not hypothetical runtime acceptance.
7. Account for all **7** builder consumers listed in [execution preconditions](execution-preconditions.md), including both CI workflows. Coordinator runs behavioral checks after implementation, including matching/changed/missing/extra payload cases, dependency exclusion, worktree skip, unsafe paths, builder/check agreement, subdirectory cwd and real target-layout consumer behavior.
8. Authorized final stage/restage and doctor through the activated shim belong to coordinator's Phase 04 acceptance. This report does not stage a release, change activation, verify the shim, or supply performance evidence.

## Acceptance boundary

Current source and filesystem evidence is complete. No build latency, doctor runtime, all-verbs success, custom-target success, live confinement enforcement, active-release integrity or fresh-shim pass was measured. Historical advisory static binding evidence remains historical, not live sandbox proof and not a prerequisite for this hygiene-only plan. The artifact-layout/verifier reconciliation is the concrete implementation prerequisite; it is not a reason to reopen D1 or repeat fgctl development-activation research.
