# Rust Host R1 Track

Status: READY FOR PLAN-LOOP EXECUTION (after the three prerequisites below) | Created: 2026-09-10 | Widened 2026-09-10 (fgctl + install.sh + CI release) | Owner: Lead session

Execution track: `rust-host-r1-kernel` (id kept from the original kernel-only scope; `fgos coordination chain` groups on it)

This is a Work-independent implementation track. Do not create, claim, move,
approve, or route any Work item for this plan. Every cell runs through
CoordinationSession / group-thinking plan-loop mechanics
(`fgos-plan-loop` SKILL.md), with the Lead coordinating cells, review,
red-team, dispositions, fix rounds, merges, and proof collection outside the
Work component.

Scope (widened 2026-09-10): the Rust `fgos` host, the staged release tree,
**and the `fgctl` walking skeleton that installs it** — `fgctl` Rust bootstrap
binary, release store + activation, `install.sh` that installs `fgctl`
straight from a GitHub release without cloning, and the CI release workflow
that publishes those assets. This track therefore delivers the whole of the
plan's R1 for one target: a person on a clean machine runs one `curl | sh`,
then `fgctl init` in a project, and `fgos` in that project is the Rust host.
The per-project flip happens through `fgctl init`; the global npm `bin.fgos`
stays as the compatibility channel. P7–P9 (external process, gateway route,
next native read) remain a later track.

## Authority Entering The Plan

Read these before opening any cell:

- `docs/specs/reading-map.md`
- `docs/architect/host-invocation-routing/host-invocation-provider-routing.md` (kernel contract — canonical names)
- `docs/architect/host-invocation-routing/legacy-cli-transition.md`
- `docs/architect/host-invocation-routing/external-provider-protocol.md` (R2 only; read for boundaries)
- `docs/architect/host-invocation-routing/node-to-rust-component-migration.md`
- `docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md` (source plan; this track is its executable form)
- `docs/architect/packaging-distribution/runtime-identity-and-activation.md` §5, §11–§14
- `docs/architect/component-boundary/component-boundary-advisory.md`
- `docs/architect/component-boundary/repo-layout-vision.md`
- `docs/architect/agent-coordination/contracts/coordination-session.md`
- `core/coordination-protocols/standalone-master-coordination-loop.yaml`
- `.agents/skills/fgos-plan-loop/SKILL.md`
- `.agents/skills/_shared/capability-catalog.md`
- `plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md` §6–§8 (settled decisions)

## Goal

A Rust `fgos` binary that:

1. recognizes every one of the 73 public selectors from a generated, checked
   `CommandRouteDescriptor` artifact and execs the unmoved Node payload for
   every `legacy-cli` selector with byte-identical stdout/stderr/exit/signal
   behavior, proven by a harness that also passes Node-against-Node;
2. serves `version` natively through the kernel (`OperationRequest` →
   `InvocationService` → pure `Router` → built-in provider → `ProviderOutcome`
   → CLI presenter → `fgos.v1`), creating no Node process;
3. stays within the performance budget (legacy exec overhead ≤ 25 ms p50,
   native `version` ≤ 10 ms p50 on the reference target);
4. is staged by `scripts/build-rust-distribution.mjs` into the release tree
   shape `runtime-identity-and-activation.md` §5 defines (`bin/fgos`,
   `bin/fgos-runner` shim, `libexec/legacy-node/` = `package.json` `files`,
   `manifest.json` with `entries` + `components.legacyNode.{root,entry,digest}`),
   and runs from that staged tree with no source-tree path;
5. exposes every new binary, payload, generated artifact, and build dependency
   to `fgos doctor` through the existing check registry;
6. adds tier 0 (workspace shim) to each runtime's single `fgos` resolver so the
   nine inventoried call sites are ready for cutover without touching them
   again;
7. ships `fgctl` (Rust): `stage`/`init`/`upgrade`/`repair`/`status` over a
   content-addressed release store, a workspace installation capsule
   (`.fgos/installation/{activation.json,bin/fgos,bin/fgos-runner}`), atomic
   activation, rollback to the previous digest, quarantine on digest mismatch,
   and the `fgos init → doctor --fix → doctor` tail — per
   `runtime-identity-and-activation.md` §11–§14;
8. ships `install.sh`: downloads the `fgctl` asset for the current target from
   a GitHub release, verifies `SHA256SUMS`, installs it under
   `~/.local/bin`, and prints the `fgctl init` next step — no clone, no
   npm, no Rust toolchain on the consumer machine;
9. ships `.github/workflows/release.yml`: on a `v*` tag, builds the release
   tree and `fgctl` for the target matrix, writes `SHA256SUMS`, and uploads
   the assets with `gh`; plus an external-consumer CI job that runs the same
   `install.sh → fgctl init → fgos version --runtime-json → one legacy verb`
   proof against locally served assets on every push.

## Non-Negotiable Boundaries

- No Work item, claim, status, approval, `fgos pick/cook/submit`, or
  `fgos-runner` loop for this plan.
- The kernel has exactly one input/output pair (`OperationRequest` /
  `ProviderOutcome`). No `LegacyCliRequest`, no pre-rendered result type, no
  `OsString` inside `packages/host-runtime`.
- The legacy lane is `apps/fgos/src/legacy_exec.rs`; it never calls
  `InvocationService`. It resolves the payload only as
  `join(activeReleasePath, components.legacyNode.root, components.legacyNode.entry)`
  from a manifest — never PATH, never cwd, never a hardcoded path.
- `bin/fgos.mjs` and the Node package are not moved or renamed. `src/` may be
  edited only inside the `resolver` lease (P10) and for doctor registrations
  (P09).
- Built-in providers receive typed Rust requests. No `EncodedMessage`, no
  bytes-at-the-router, no serialization for built-ins. No registry linker,
  cache, or manifest scan: the R1 catalog is a `const` array, the snapshot a
  compile-time constant.
- Router is a pure function (no I/O, no async). `InvocationService` owns
  admit → select → grant → invoke → normalize → record.
- Canonical names only (kernel contract §3). A cell that introduces
  `OperationKey`, `ProviderResponse`, `ProviderCall` or any alias fails review.
- No `setup` verb anywhere new; new local behavior registers as `init` /
  `doctor --fix`.
- `fgctl` is the only writer of the release store and of
  `.fgos/installation/activation.json`; `fgos init` / `doctor --fix` never
  select, download, or activate a release; `fgos doctor` never mutates.
  Activation is atomic (write-then-rename); a digest mismatch quarantines,
  never patches. No automatic state migration.
- `install.sh` installs `fgctl` only. It never installs `fgos`, never touches
  a project, never writes shell rc files without printing exactly what it
  would add, and refuses to run as root by default.
- No signatures, no marketplace, no auto-update daemon in R1: `SHA256SUMS`
  integrity only; upgrade is an explicit `fgctl upgrade`.
- CI publishes assets only from a `v*` tag; the external-consumer job never
  reaches the network for assets (it serves the just-built ones locally).
- `herdr-plugin/` stays outside the new Cargo workspace and keeps building on
  its own (`cargo test --manifest-path herdr-plugin/Cargo.toml`).
- Three crates only: `fgos` (`apps/fgos`), `fgos-host-runtime`
  (`packages/host-runtime/rust`), `fgos-distribution`
  (`packages/distribution/rust`). No `packages/legacy-node/`, no
  `component-protocol` crate (R2).

## Decisions Fixed For This Track (Lead confirms at P00; defaults apply unless overridden)

| Decision | Default for this track | Source |
|---|---|---|
| Target matrix | `x86_64-unknown-linux-gnu` only (this machine + `ubuntu-latest` CI). macOS/Windows join in the cutover track. | plan §3.1 |
| Preview vs stable | Preview. Nothing this track ships is the installed default. | plan §3.5 |
| Node compatibility window | Two releases after a selector goes native before its Node path may be deleted. | plan §3.6 |
| Performance budgets | legacy exec overhead ≤ 25 ms p50; native `version` ≤ 10 ms p50; measured warm, same machine, by the P02 harness. | plan §6 |
| Selector classification | All 73 selectors `legacy-cli` except `version` (`native`, `distribution.build.show`). | plan §5 |
| `distribution.build.show` owner | `fgos-distribution` crate (`packages/distribution/rust`); the same crate owns manifest parsing, release-tree canonicalization, and digest verification, shared by `fgos` and `fgctl`. | kernel §9 |
| Machine release store | `${XDG_STATE_HOME:-$HOME/.local/state}/fgos/` (`releases/<artifactDigest>/`, `installs/`, `install.lock`, `quarantine/`); release directory is **digest-only**, version lives in the manifest. | topology §4, runtime-identity §3, §15.2 |
| Workspace topology for `fgctl` V1 | Workspace root = the git main checkout (parent of `git rev-parse --git-common-dir`); linked worktrees share that checkout's `.fgos/installation/`. `workspaceId` = first 16 hex of sha256(realpath of the main root); `workStateId` = `workspaceId` in V1 (no separate work-state root yet). | topology §2, §15.1 |
| Stable shim | POSIX `sh` script at `.fgos/installation/bin/fgos` (and `fgos-runner`) that reads only `activation.json`'s `releasePath` and `exec`s `<releasePath>/bin/fgos` (`entries.fgos`/`entries.fgosRunner` are fixed at those paths by P09 for every release this track stages, so the shim need not parse the manifest). Rust shim only if a target lacks `sh`. | runtime-identity §6, §15.3 |
| Acquisition sources | `fgctl init/upgrade --from <release-tree dir | .tar.gz | github>`; `github` (default) resolves `vantt/forgent` latest release, or the tag pinned in tracked `.fgos/distribution.json`. | runtime-identity §13, §15.4 |
| Preflight before activation | manifest `artifactDigest` recomputes identically; every `files[]` digest matches; `requires.node` satisfied by the `node` on PATH; `bin/fgos` executable; `bin/fgos version --runtime-json` succeeds against the staged tree. No host-visible projection writes. | runtime-identity §11, §15.5 |
| Mutating lease | V1 reuses the existing `.fgos/main-checkout.lock` liveness: `fgctl` refuses to publish a new activation while that lock is held live. Per-invocation lease files are a later change. | runtime-identity §7, §12 |
| Retention / quarantine | Keep the previous release directory for rollback; no GC in R1. Quarantine at `<store>/quarantine/<digest>/`. | runtime-identity §11, §15.6–7 |
| GitHub release assets | `fgos-<version>-<target>.tar.gz` (release tree), `fgctl-<version>-<target>.tar.gz`, `SHA256SUMS`; tag `v<package.json version>`; `install.sh` also attached and served from `raw.githubusercontent.com/vantt/forgent/main/install.sh`. | this track |
| `install.sh` prefix | `${FGCTL_INSTALL_DIR:-$HOME/.local/bin}`; `FGCTL_VERSION=<tag>` pins; `FGCTL_ASSET_BASE_URL=<url>` redirects to a local server (CI/offline). | this track |

## Product Gates

| Phase | Cell | Capability | Exit |
|---|---|---|---|
| 00 | [Inventory and inputs freeze](phase-00-inventory-and-inputs-freeze.md) | `code:review` | Decisions table confirmed; 73-selector classification, nine-caller inventory, packaging interface fields, and lease map written to `reports/p00-inventory.md`; no code change. |
| 01 | [Command-route descriptor generator](phase-01-command-route-descriptor.md) | `code:implement` | `scripts/export-command-selectors.mjs` emits the checked `packages/host-runtime/contracts/command-routes.json` from the Node registry + annotations; `--check` detects drift; `scripts/explain-command-route.mjs <selector>` prints route kind/owner/payload/suites; unlisted or double-bound selectors fail. |
| 02 | [Parity harness](phase-02-parity-harness.md) | `code:implement` | `test/rust-host/harness.mjs` runs Node or a candidate binary with identical argv bytes/stdin/cwd/env/timeout, captures bytes/exit/signal/fs-diff/child-process spy/wall-clock, supports the four comparison modes, and proves it catches every injected difference while passing Node-against-Node on the coverage floor. |
| 03 | [Envelope vectors and serialization corpus](phase-03-envelope-vectors-and-corpus.md) | `code:implement` | Node-generated `fgos.v1` golden vectors + differential serialization corpus (insertion order, integer limits, −0, exponent formatting, Unicode/control, nesting, null/bool) checked in under `test/rust-host/vectors/`; timestamp checked by shape/range. |
| 04 | [Cargo workspace skeleton](phase-04-cargo-workspace-skeleton.md) | `code:implement` | Root `Cargo.toml` with the three crates, `herdr-plugin` excluded and still building alone; `.gitignore` covers the Rust build dir; `cargo fmt/clippy -D warnings/test --workspace` green; CI job added; `scripts/run-rust-dev-host.mjs` builds and runs the source host with a `dev` manifest (`root: "."`); `fgos` binary prints usage. |
| 05 | [Kernel contracts and pure Router](phase-05-kernel-contracts-and-router.md) | `code:implement` | `fgos-host-runtime` defines every canonical type from kernel §3; `const` catalog with `distribution.build.show` + one fixture; `RegistrySnapshot` compile-time constant; `Router::select` pure with negative tests (missing/duplicate binding, incompatible contract, disallowed host, wrong mode). |
| 06 | [InvocationService and authority](phase-06-invocation-service-and-authority.md) | `code:implement` | `InvocationService` pipeline with two-stage authority (admission before select, grant after), async `OperationProvider` trait, `InvocationControl`/`EventSink`, closed `ProviderError` families, monotonic lifecycle record with one terminal, cancellation/deadline through an in-memory provider; CLI and in-memory remote projectors reach the same provider; no host module imports another. |
| 07 | [CLI adapter legacy exec](phase-07-cli-adapter-legacy-exec.md) | `code:implement` | `apps/fgos` scans only host-global options + checked selector via `args_os`, embeds `command-routes.json`, resolves the payload from the manifest, execs `node <payload>` with stdin/stdout/stderr/cwd/env/exit/signal preserved, a private recursion marker, and one invocation record; P02 harness passes Node-vs-Rust for every `legacy-cli` selector on the coverage floor. **Full-suite gate.** |
| 08 | [Native `version`](phase-08-native-version.md) | `code:implement` | `fgos-distribution` provides `distribution.build.show`; CLI projector/presenter produce exactly one `fgos.v1` envelope byte-compatible with Node (`version --json`) per P03 vectors; process spy proves no Node child; P02 harness records both performance budgets and they pass. |
| 09 | [Release tree builder and doctor](phase-09-release-tree-builder-and-doctor.md) | `code:implement` | `scripts/build-rust-distribution.mjs` stages `bin/fgos`, `bin/fgos-runner` shim, `libexec/legacy-node/` (= `package.json` `files`), and `manifest.json` (§5 fields, release-tree digest); P02 harness passes against the staged tree from a directory outside the checkout; doctor checks registered for Rust binary/target, payload presence, manifest/descriptor drift. **Full-suite gate.** |
| 10 | [Tier-0 resolver](phase-10-tier-zero-resolver.md) | `code:implement` | Workspace-shim tier added to `src/setup/bin-discovery.mjs`, the shell function, and one Herdr `resolve_fgos`; the nine inventoried call sites use their runtime's resolver; absence of `.fgos/installation/` falls back to today's behavior; tests cover both. |
| 11 | [fgctl crate, manifest verify, release store](phase-11-fgctl-crate-and-release-store.md) | `code:implement` | `apps/fgctl` binary; `fgos-distribution` gains manifest parse + canonical-tree digest + verify; `fgctl stage --from <dir|tar.gz>` stages a release under `<store>/releases/<digest>/` under `install.lock`, quarantines on mismatch; `fgctl status` reads the store. Tested against P09's staged tree. |
| 12 | [fgctl init and workspace activation](phase-12-fgctl-init-and-activation.md) | `code:implement` | `fgctl init` resolves the main checkout, runs preflight, writes the `sh` shims and `root.json`, publishes `activation.json` atomically, then runs `fgos init → doctor --fix → doctor` through the active release; `fgos version --runtime-json` (Rust host) reports the identity fields of runtime-identity §14; idempotent re-run; refuses while `main-checkout.lock` is live. |
| 13 | [fgctl upgrade, repair, rollback](phase-13-fgctl-upgrade-repair-rollback.md) | `code:implement` | `fgctl upgrade --from` stages a second release and re-activates; `fgctl repair` rolls back to `previousArtifactDigest` with the preserved directory; state-schema read/write range checked before publish; `ready-degraded` when the post-publish tail fails; quarantine path exercised by a corrupted-file test. **Full-suite gate.** |
| 14 | [install.sh from GitHub release](phase-14-install-script.md) | `code:implement` | `install.sh` detects target, downloads `fgctl-<version>-<target>.tar.gz` + `SHA256SUMS` from `FGCTL_ASSET_BASE_URL` (default GitHub release), verifies, installs to `~/.local/bin`, prints PATH hint and `fgctl init` next step; `test/install/install-sh.test.mjs` serves fixture assets from a local HTTP server and proves success, checksum-mismatch refusal, and pinned-version; README install section rewritten. |
| 15 | [CI release and external-consumer proof](phase-15-ci-release-and-external-consumer.md) | `code:implement` | `.github/workflows/release.yml` on `v*`: build, stage, tar, `SHA256SUMS`, `gh release upload`; `scripts/ci-external-consumer.sh` (also runnable locally): serve built assets → `install.sh` into a temp HOME → `fgctl init` in a temp project → `fgos version --runtime-json` + one legacy verb; `ci.yml` runs it on every push. Lead cuts a prerelease tag after merge as the real proof. **Full-suite gate.** |
| 16 | [Docs, changelog, closeout](phase-16-docs-changelog-closeout.md) | `code:review` | `CHANGELOG.md` Unreleased rows; `docs/specs/distribution.md` doctor rows; `docs/specs/reading-map.md` entry for `host-invocation-routing/`; `reports/track-closeout.md` with every merge commit, deferred finding, the prerelease tag, and reproduction commands. **Full-suite gate.** |

## Parallel Execution Map

Default sequential. The Node lanes (P01–P03) and the Rust lanes (P04–P06)
have zero file overlap, so the Lead may run one Node cell and one Rust cell
concurrently once P00 is merged. P07 needs both lanes merged.

| Wave | Cells | Why |
|---|---|---|
| 1 | P00 | Freezes decisions, classification, inventory, leases. |
| 2 | P01 → P02 → P03 ∥ P04 → P05 → P06 | Node harness lane and Rust kernel lane are independent leases. |
| 3 | P07 | First Node-vs-Rust proof; needs descriptor, harness, kernel, workspace. |
| 4 | P08 | First native operation; needs P03 vectors and P06 pipeline. |
| 5 | P09 | Release tree; needs a real binary and a passing harness. |
| 6 | P10 | Resolver; independent of P09 but placed after so the staged tree exists for its fixture. |
| 7 | P11 → P12 → P13 | fgctl lane; consumes P09's release tree, activates the shim P10's resolvers already look for. |
| 8 | P14 ∥ P13 allowed | `install.sh` only needs a `fgctl` binary (P11) and the asset naming decision; may run beside P13 (disjoint leases). |
| 9 | P15 | CI release + external-consumer proof; needs everything above. |
| 10 | P16 | Closeout. |

## Shared-File Lease Rule

```text
node-harness =
  test/rust-host/**,
  scripts/export-command-selectors.mjs,
  scripts/explain-command-route.mjs,
  packages/host-runtime/contracts/**

rust-workspace =
  Cargo.toml, Cargo.lock, rustfmt.toml, clippy.toml, .gitignore,
  .github/workflows/ci.yml,
  scripts/run-rust-dev-host.mjs

rust-kernel =
  packages/host-runtime/rust/**

rust-cli =
  apps/fgos/**

rust-distribution =
  packages/distribution/rust/**

release-builder =
  scripts/build-rust-distribution.mjs,
  test/rust-host/release-tree.test.mjs,
  src/setup/registrations.mjs        (doctor registrations only)

resolver =
  src/setup/bin-discovery.mjs,
  src/setup/registrations.mjs        (reachability check only),
  scripts/fgos-shell-integration.sh,
  herdr-plugin/src/fgos.rs, herdr-plugin/src/gateway.rs, herdr-plugin/src/main.rs,
  src/runner/dispatch/cli.mjs,
  src/evolve/iron-law.mjs,
  core/skills/_shared/fgos-cli-fallback.md   (then `npm run build:skills`),
  package.json                              (bin map)

fgctl =
  apps/fgctl/**,
  packages/distribution/rust/**   (after P08; manifest/digest/verify modules),
  apps/fgos/src/cli_projector.rs, apps/fgos/src/cli_presenter.rs   (P12 only: `version --runtime-json`),
  test/rust-host/fgctl-*.test.mjs

install =
  install.sh,
  test/install/**,
  README.md                         (install section)

ci =
  .github/workflows/release.yml,
  .github/workflows/ci.yml          (after P04),
  scripts/ci-external-consumer.sh

docs-closeout =
  CHANGELOG.md,
  docs/specs/distribution.md, docs/specs/reading-map.md,
  docs/architect/host-invocation-routing/**
```

`src/setup/registrations.mjs` appears in two leases (P09 doctor checks, P10
reachability check). They are sequential waves; the Lead resolves the trivial
integration, never overlaps the cells. `bin/fgos.mjs` and the root `AGENTS.md`
receive only the ownership header/note (P00 output, applied in P07) — no
behavior change in this track. `apps/fgos/src/main.rs` is touched by P07
(composition root with the echo fixture) and P08 (adds the distribution
provider to the same `build_snapshot` call) — sequential waves, P08 edits only
the snapshot-assembly lines.

## Group-Thinking Execution Contract

For each cell:

1. The Lead creates a linked worktree for the cell branch outside any
   coordination request.
2. The Lead opens one CoordinationSession with
   `core.coordination-protocol.standalone-master-coordination-loop`.
3. Every request uses explicit `actors[]` and `targetActorId`.
4. Doer/Fixer operations may be `mutation: "mutating"` only in the linked
   worktree and only for work-product operations.
5. Reviewer and Red-Team stay advisory/read-only. Reviewer must run the cell's
   focused command itself (`cargo test`/`node --test`), never trust the Doer's
   narration.
6. Findings are dispositioned before any fix round; cap three fix rounds.
7. A cell closes only after Reviewer and Red-Team are clean or remaining
   findings are `deferred` with rationale.
8. The Lead merges the cell branch into the track branch outside the session.
9. Status is read with `fgos coordination chain rust-host-r1-kernel --json` /
   `show`, never from worker narration.

Rust cells (P04–P08) dispatch the Doer at tier `heavy`; every other cell at
`standard`. Reviewer and Red-Team stay `analytical`.

## Plan-Level Acceptance

- `command-routes.json` lists all 73 selectors, exactly one route each; an
  unlisted selector fails the Rust build.
- Harness passes Node-against-Node and Node-against-Rust for every
  `legacy-cli` selector on the coverage floor; it detects an injected stdout
  byte, exit-code change, missing argv token, and unexpected child process.
- `version` through Rust is byte-compatible with Node per P03 vectors and
  spawns no Node process (process spy, not timing).
- Both performance budgets measured and within threshold.
- `cargo fmt --check`, `cargo clippy --workspace --all-targets -D warnings`,
  `cargo test --workspace`, `cargo test --manifest-path herdr-plugin/Cargo.toml`,
  and `npm test` green at every full-suite gate.
- Staged release tree runs the harness from outside the checkout; manifest
  digest recomputes identically.
- Doctor reports every new binary/payload/artifact dependency.
- On a clean temp HOME with no clone, no npm, no Rust toolchain:
  `install.sh` (assets served locally) installs `fgctl`; `fgctl init` in a
  temp project activates the release; `.fgos/installation/bin/fgos version
  --runtime-json` reports the digest, workspaceId, release version, state
  schema range, legacy payload identity, and `host: rust`; one legacy verb
  runs byte-identically through the shim; `fgctl upgrade` then `fgctl repair`
  round-trips to the previous digest with no work-state mutation.
- One prerelease tag (`v0.2.0-rc.1` or the Lead's choice) published by
  `release.yml` carries `fgos-*.tar.gz`, `fgctl-*.tar.gz`, `SHA256SUMS`,
  `install.sh`, and the same proof passes against the real GitHub assets.
- User-visible behavior recorded in `CHANGELOG.md`.

## Execution Inputs

```text
REPO_ROOT: /home/vantt/projects/forgentX
PLAN_DIR: /home/vantt/projects/forgentX/plans/260910-1700-rust-host-r1-kernel
TRACK: rust-host-r1-kernel
TRACK_BRANCH: rust-host-r1-kernel
BASE_REF: capture current main HEAD when execution begins
MAX_PARALLEL_CELLS: 1 by default; 2 allowed in wave 2 (one node-harness cell + one rust-* cell)
FULL_TEST: FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs' \
  && cargo fmt --all -- --check \
  && cargo clippy --workspace --all-targets -- -D warnings \
  && cargo test --workspace \
  && cargo test --manifest-path herdr-plugin/Cargo.toml
FOCUSED_NODE: FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/rust-host/*.test.mjs'
FOCUSED_RUST: cargo test --workspace
SMOKE_DECIDE: node src/runner/dispatch.mjs decide --for code:implement --has-live-task-access
EXTERNAL_CONSUMER: scripts/ci-external-consumer.sh   (P15+; temp HOME, local asset server)
REFERENCE_TARGET: x86_64-unknown-linux-gnu (cargo 1.96, node 24)
GITHUB_REPO: vantt/forgent
```

Full-suite gates: P07, P09, P13, P15, P16. Known pre-existing red tests (not
regressions): `cohort-planner` "buildCandidateInventory against the real
committed", `check-decision-citation-drift`.

## Prerequisites Before Opening P00 (Lead, outside any cell)

1. Commit the 2026-09-10 architecture/plan doc changes and this track
   (`git worktree add` only sees committed state).
2. Add Rust commands to `claude-reviewer-herdr`'s `--allowedTools` in
   `.fgos/config.json`: `Bash(cargo test:*),Bash(rtk cargo test:*),Bash(cargo clippy:*),Bash(rtk cargo clippy:*),Bash(cargo fmt:*),Bash(rtk cargo fmt:*),Bash(cargo build:*),Bash(rtk cargo build:*)`.
   Then `fgos doctor` green.
3. Confirm the Decisions table above (or override a row) — the only product
   input this track asks for.

## Roster (every request repeats this `actors[]` verbatim)

Proven live 2026-09-10 (`herdr-smoke--cell-01`,
`plans/reports/group-thinking-readiness-260910-1235-confinement-authority-code-track.md`):

```json
"actors": [
  { "id": "doer",     "executor": "agy-herdr",             "tier": "standard",   "persona": "focused-code-implementer" },
  { "id": "reviewer", "executor": "claude-reviewer-herdr", "tier": "analytical", "persona": "code-quality-reviewer" },
  { "id": "red-team", "executor": "codex-herdr",           "tier": "analytical", "persona": "edge-case-and-security-attacker" },
  { "id": "fixer",    "executor": "agy-herdr",             "tier": "standard",   "persona": "surgical-fixer" }
]
```

For the Rust cells P04–P08 and P11–P13 set `doer`/`fixer` `tier` to `heavy`
(gemini flash-high). Resolved
models otherwise: doer/fixer gemini-3.8-flash-medium, reviewer opus, red-team
gpt-5.6-terra; codex on `CODEX_HOME=~/.codex-fgovn`.

Unattended run policy: `fgos-plan-loop` SKILL.md section 5. Stop and ask only
for: a Decisions-table row a cell proves wrong; the same failure twice after
the approach changed; an unresolvable merge conflict.

## Cell status (appended by the Lead as cells merge)

| Cell | Merge commit | Review / red-team | Deferred findings |
|---|---|---|---|
| P00 | `b3ea08d9` | Clean after 2 fix rounds (reviewer: 9+3 findings fixed; red-team: 2+1 findings fixed) | 1 class deferred to P10: active skill-doc prose (`domains/coding/skills/**` etc.) invoking `bin/fgos.mjs` directly, outside R3's named 9-site scope — see `docs/architect/agent-coordination/verification/rust-host-r1-kernel/p00.md` |
