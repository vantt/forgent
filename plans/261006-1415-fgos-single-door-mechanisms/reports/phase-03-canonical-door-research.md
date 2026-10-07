---
phase: 03
kind: read-only-research
conducted: 2026-10-06
scope: corrected-canonical-dev-door
---
# Canonical door research: corrected Phase 03

## Summary

**D1=B is already owner-approved; this report does not reopen it.** `plan.md:48` records the 2026-10-06 decision: name the existing Rust development host through `fgos:dev`; restaging (A) remains the route when plain `fgos` must use a new activated release. Development activation (C) belongs to a separate plan.

The current host forwards arguments and selects the working-tree Node payload, but still uses the package/process cwd and hardcodes every runtime artifact under checkout `target/`. Passing `CARGO_TARGET_DIR` through to Cargo is not equivalent to respecting it end-to-end. Current isolated-worktree filesystem observations **do not reproduce the plan's historical shared-target symlink state**.

## Scope and method

- Authority: `plan.md:88-90` requires final red-team corrections to win. `phase-03-canonical-door-research-decision.md:55-61` removes Q1 development-activation research and D1-pre, leaving only read-only evidence needed by Phase 04: argument forwarding, child cwd, manifest/binary location, target sharing.
- Read source and downstream corrected phase; use only read-only `stat` and `printenv` observations. No host invocation, builds, staging, upgrades, setup, doctor fixes, tests, or activation changes.
- **Timing is unmeasured:** no cold/incremental Cargo time, development-command latency, staging/upgrade duration, or doctor runtime was measured. Source establishes behavior, not end-to-end success for every verb.
- Paths below are relative to `/home/vantt/projects/forgentX-worktrees/single-door-mechanisms`, unless explicitly absolute. Line references describe the inspected source snapshot.

## Findings

### Arguments and subprocess cwd

| Concern | Observed evidence | Consequence |
|---|---|---|
| Checkout selection | `scripts/run-rust-dev-host.mjs:8-10` derives checkout root from the script URL. | Payload/build source is the checkout containing the script, independent of caller cwd. |
| Build invocation | `scripts/run-rust-dev-host.mjs:12-17` always calls `cargo build`, debug profile, `cwd: checkoutRoot`, inheriting `process.env`. | Calling even a read-only verb through this host writes build artifacts; it was not invoked here. |
| Argument forwarding | `scripts/run-rust-dev-host.mjs:91-101` passes `process.argv.slice(2)` directly to the Rust executable. | Phase 04's script can expose `npm run fgos:dev -- <verb> [args]`; no extra argv parser is needed. |
| Runtime cwd | `scripts/run-rust-dev-host.mjs:93-95` sets `cwd: process.cwd()`. | It does not currently use `INIT_CWD`. The npm package-root cwd problem and required correction are explicitly recorded at `phase-04-doctor-active-release-drift-check.md:70`; actual npm/dev-host behavior was not smoke-executed. |
| Process completion | `scripts/run-rust-dev-host.mjs:103-114` handles spawn error, returns child status, or re-signals itself. | Wrapper already propagates terminal outcome; no new behavior requested here. |

### Manifest, payload, and Cargo target contract

- `scripts/run-rust-dev-host.mjs:28-36` creates `<checkout>/target/dev-manifest.json` and hashes `<checkout>/target/debug/fgos`; `:91-99` executes that same hardcoded binary and sets `FGOS_ACTIVE_RELEASE_PATH=<checkout>`, `FGOS_ACTIVE_MANIFEST_PATH=<manifest>`.
- The generated manifest has `entries.fgos='target/debug/fgos'` (`:39-40`), `components.legacyNode.root='.'`, entry `bin/fgos.mjs` (`:42-46`), and a native-host file at `target/debug/fgos` (`:69-75`). It is regenerated/written on each call (`:78-89`). The Node digest is the entry-file digest, not a recursive working-tree fingerprint (`:35`, `:43-46`, `:61-67`).
- There is **no explicit `CARGO_TARGET_DIR` lookup** in the inspected host. Cargo receives it through `env: process.env` (`:16`), but manifest location, native hash, manifest paths, and executable location remain hardcoded (`:29-40`, `:69-75`, `:92`). **Inference:** a custom Cargo output directory can make the wrapper fail on the default binary path or select an existing stale default binary; this was not executed.
- `apps/fgos/src/legacy_exec.rs:48-51,69-71,103-104` documents and prioritizes the two active-release environment variables. Its fallback discovers manifests relative to the executable (`:73-94`, `:106-120`), not the runtime cwd. Explicit wrapper env avoids reliance on that fallback, particularly when target location changes.
- The Rust adapter validates manifest invariants, artifact digest, release files, and legacy Node payload (`apps/fgos/src/legacy_exec.rs:141-151`). It launches `node <payload>` with preserved `forward_args`, recursion guard, host-bin env, and inherited stdio (`:242-253`). No child cwd override is set in that command-construction block, so it inherits the Rust process cwd.
- **Implementation constraint:** `packages/distribution/rust/src/verify.rs:133-155` walks every listed manifest path and rejects symlink segments; `:158-163` enforces canonical release-root containment. Therefore a shared symlink `target/` is not merely a concurrency hazard for the current manifest: its listed native-host path meets this rejection. An external Cargo target directory cannot simply become a manifest file path outside checkout root. Phase 04 must preserve this verification contract when changing artifact paths, not weaken confinement. Neither scenario was exercised here.

### Actual target-sharing state

Read-only command observations in the isolated worktree:

```text
stat -c '%F %N' /home/vantt/projects/forgentX-worktrees/single-door-mechanisms/target /home/vantt/projects/forgentX/target
stat: cannot stat '/home/vantt/projects/forgentX-worktrees/single-door-mechanisms/target': No such file or directory
 directory '/home/vantt/projects/forgentX/target'
exit 1

printenv CARGO_TARGET_DIR INIT_CWD
(no output)
exit 1
```

Thus **this worktree currently has no `target` entry**, main has a real target directory, and neither environment variable is exported in this research process. No shared symlink is established between these two paths. This is a current observation, not a denial of the lead's earlier measurement recorded at `plan.md:116,129` and `phase-03-canonical-door-research-decision.md:61`. Other worktrees, user Cargo configuration, and future environment settings were not inventoried. No target directory or symlink was created to reproduce historical state.

### Plain `fgos` and restaging

The development wrapper directly executes its debug Rust host (`scripts/run-rust-dev-host.mjs:91-101`); it does not stage or update a workspace shim. Shell integration prefers the workspace installation at tier 0 over development-checkout self-hosting (`scripts/fgos-shell-integration.sh:13-19,70-85`). Naming this wrapper does not make plain `fgos` automatically use working-tree code.

The existing documented A route is `cargo build --release -p fgos -p fgctl`, build distribution into a temporary directory, `fgctl stage`, `fgctl upgrade`, then status/verify and shim invocation (`docs/how-to/measure-a-real-case.md:100-120`). This is documentation evidence only: no commands in that flow were run, no new release/store or activation state was inspected or changed, and timing remains unmeasured.

## Exact Phase 04 handoff

Final corrections in `phase-04-doctor-active-release-drift-check.md:62-72` override its original statement that the host stays unchanged (`:22`):

1. Add `"fgos:dev": "node scripts/run-rust-dev-host.mjs"` beside existing package scripts (`package.json:26-43` currently has no such entry); expose `npm run fgos:dev -- <verb> [args]` using existing direct argument forwarding.
2. Change runtime child cwd to `process.env.INIT_CWD ?? process.cwd()` and cover invocation from a subdirectory (`phase-04...:70`). Keep Cargo's cwd at script checkout root; runtime workspace and payload source are different concerns.
3. Honor `CARGO_TARGET_DIR` consistently for binary selection/hash, manifest location, and manifest content, not only Cargo environment (`phase-04...:70`; hardcoded sites above). Retain active env selection and manifest verification. External target placement and symlink rejection require a compatible concrete design before claiming this works; this report neither invents a new distribution capability nor edits that contract.
4. Document one `fgos:dev` invocation at a time across worktrees that actually share target artifacts; avoid asserting this isolated worktree currently does so. Shared manifest rewrites and binary rebuilds can interfere (`phase-04...:70`).
5. Implement the read-only `active-release-matches-checkout` check with the existing packaging file list factored once and reused by builder/check (`phase-04...:15-21,34-36`). Compare the doctor's `dir` working tree, not HEAD, process cwd, or main checkout; pass-skip linked-worktree activation belonging to main (`:68`). Ignore staged `node_modules` and packaging shims as corrected (`:66`), catch errors including symlinks as a failed check rather than a crashed doctor (`:69`).
6. Check messaging must recommend B for running working-tree code and A when plain `fgos` must be updated (`phase-04...:22`). **Do not add Rust-binary hashing/staleness detection:** that signal was removed; doctor covers Node payload only (`:67`). A new Rust verb may still be absent in an old activated host.
7. Update check registry/id and row #7 documentation/how-to/changelog; cover corrected fixtures, builder/check agreement, cwd, custom target behavior, and expanded existing builder callers as directed by `phase-04...:26-27,33-36,66-72`. These are instructions for the implementation/verification owner, not checks exercised by this research.
8. After authorized Phase 04 implementation, its owner stages a fresh release and verifies doctor through the shim (`:72`). This remains outside this read-only assignment.

## Limitations and unresolved implementation prerequisite

- D1 remains **B, approved**. Q1/C activation research was deliberately not repeated; no conclusion about `fgctl` development activation is made.
- All runtime success and performance claims remain unmeasured. No all-verbs acceptance claim follows merely from argument forwarding.
- Phase 04 must reconcile custom/external Cargo targets with manifest path confinement and symlink rejection. The corrected plan requests support, but the existing code does not supply the path strategy. This is not a proof that external target placement is impossible; alternative compatible manifest/artifact layouts were not researched in this corrected scope. The evidence was communicated to the integration owner.
- This report does not authorize downstream execution or bypass the independent Phase 01 confinement gate (`plan.md:96-97,106,123`). The integration owner reports implementation parked at Phase 01 R1: static actors, `actors[]`, and specialist-slot coordination cannot map one-to-one to the current five-step Workflow without a rewrite beyond roster scope. That owner-reported gate was not independently researched here. Only this report was written; source files and plan status were left unchanged.
