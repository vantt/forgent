# Rust Host R1 Kernel Track

Status: READY FOR PLAN-LOOP EXECUTION (after the three prerequisites below) | Created: 2026-09-10 | Owner: Lead session

Execution track: `rust-host-r1-kernel`

This is a Work-independent implementation track. Do not create, claim, move,
approve, or route any Work item for this plan. Every cell runs through
CoordinationSession / group-thinking plan-loop mechanics
(`fgos-plan-loop` SKILL.md), with the Lead coordinating cells, review,
red-team, dispositions, fix rounds, merges, and proof collection outside the
Work component.

Scope: the Rust `fgos` host up to and including a staged release tree that
`fgctl` can consume — the plan's P0–P5 plus the release-tree half of P6. The
installed-entry flip, `fgctl init/upgrade/repair` proof, and P7–P9 are a
second track opened only once the packaging stream's `fgctl` walking skeleton
exists (plan §4 node `PK`).

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
   again.

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
- No installer, no `fgctl`, no `.fgos/installation/` writer in this track.
  P09 builds the tree `fgctl` consumes; it does not activate it.
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
| `distribution.build.show` owner | `fgos-distribution` crate (`packages/distribution/rust`). | kernel §9 |

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
| 11 | [Docs, changelog, closeout](phase-11-docs-changelog-closeout.md) | `code:review` | `CHANGELOG.md` Unreleased rows; `docs/specs/distribution.md` doctor rows; `docs/specs/reading-map.md` entry for `host-invocation-routing/`; `reports/track-closeout.md` with every merge commit, deferred finding, and reproduction command. **Full-suite gate.** |

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
| 7 | P11 | Closeout. |

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

docs-closeout =
  CHANGELOG.md, README.md,
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
REFERENCE_TARGET: x86_64-unknown-linux-gnu (cargo 1.96, node 24)
```

Full-suite gates: P07, P09, P11. Known pre-existing red tests (not
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

For P04–P08 set `doer`/`fixer` `tier` to `heavy` (gemini flash-high). Resolved
models otherwise: doer/fixer gemini-3.8-flash-medium, reviewer opus, red-team
gpt-5.6-terra; codex on `CODEX_HOME=~/.codex-fgovn`.

Unattended run policy: `fgos-plan-loop` SKILL.md section 5. Stop and ask only
for: a Decisions-table row a cell proves wrong; the same failure twice after
the approach changed; an unresolvable merge conflict.

## Cell status (appended by the Lead as cells merge)

| Cell | Merge commit | Review / red-team | Deferred findings |
|---|---|---|---|
