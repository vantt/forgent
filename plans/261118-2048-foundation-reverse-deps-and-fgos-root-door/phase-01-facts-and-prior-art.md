# Phase 01: facts and prior art

Wave 1. No dependency. Read-only. Capability `code:review`. Effort 0.25d. Status done (2026-11-18, planner
`lead:FOUNDATION-PLAN`), read on `origin/main` `5fd22aa1d`. Validating re-checks the line numbers on its own base.

## F1. The three exceptions (`docs/architecture-manifest.json` `tierExceptions`)

| # | Edge | What it needs | Why "moves down with the Work batch" | Finding |
|---|---|---|---|---|
| E1 | `src/runner/worktree.mjs` (T2) -> `src/state/store.mjs` (T7) | only the class `StoreError` (`worktree.mjs:12`, thrown at 183, 249, 251, 366) | the class lived in the Work store | The class already moved to an import-free leaf `src/state/store-error.mjs` (commit `f01e200f2`, "error leaf"); `store.mjs:29,33` re-exports it. Only the leaf's directory (`src/state/`, tier 7) keeps the edge upward. A second copy of the class sits in `src/runner/dispatch/cli.mjs:10` |
| E2 | `src/identity/directory-store.mjs` (T1) -> `src/state/runtime-coordination.mjs` (T7) | `getMainFgosDir(path.join(cwd ?? repoRoot, '.fgos'))` (`directory-store.mjs:14`) to find the main checkout's `.fgos` | `getMainFgosDir` is a Work helper; its reason says it "goes to the invocation-root door with the Work batch" | Its only caller is the rebuild use case `src/verbs/events/rebuild.mjs:38` (T9), which already holds the authenticated main checkout as `facts.trustedMain` (`src/verbs/events/context.mjs:9-16`). `getMainFgosDir` itself calls `resolveMainCheckoutRoot` (T2), so T1 cannot reach it through any door either: the caller must hand the answer down |
| E3 | `src/util/host-bin.mjs` (T0) -> `src/runner/paths.mjs` (T2) | `resolveMainCheckoutRoot(cleanDir)` and `fgosDirFromRoot` in `resolveHostBin` (`host-bin.mjs:17-21`) | "the root resolver moves down when the project locator becomes one leaf" | The Rust host sets `FGOS_HOST_BIN` to itself for every Node child (`apps/fgos/src/legacy_exec.rs:258-265`), and `resolveActiveHostBin` answers with it first. The main-checkout step is reached only on the channels AGENTS.md calls unsupported (`node bin/fgos.mjs`, global npm bin) and in tests without the variable. Lowest caller is T1 `src/convention/convention-client.mjs:21,35`; others T3 (`friction-client`), T4 (`run-supervisor/client`), T7 (`runner/session`), T9 (`bin/fgos.mjs`) |

Prior art: the three rows were added together in `8a7d6bc9f` (2026-11-12, "a tier per file, one downward-imports
rule"); no owner decision names them (review §1). The root door: `2273382e7` (11-12, "one invocation-root door"),
`b0eb6a9b5` (11-14, Node `resolveInvocationRoot`/`admitStoreAccess` become adapters over the addon, the Node walk
deleted), `ad5142b8a` (11-15, manifest row "resolve the invocation root"). `fgosDirFromRoot` dates from `f875ab178`
(2026-07-29, "canonical path resolver, subsuming 4 root getters"); `getMainFgosDir` from `7c4c4a132` (08-25). The
`.fgos` file registry from plan `260825-0842-fgos-logs-dir-bucketing` phase 03 (archived), written as a
"kernel layer" leaf for exactly this reason (its header). Nothing was removed that this plan would revive.

## F2. The existing doors this plan reuses

- **Root decision:** manifest door "resolve the invocation root": `packages/git/rust/src/invocation_root.rs`, carried
  by `packages/git/node-addon/src/git.rs:259-285`; Node adapters `resolveInvocationRoot` and
  `resolveMainCheckoutRoot` (`src/runner/paths.mjs`, T2). Its debt rows: `mailbox_root.rs`, `session.rs`,
  `host-bin-path.mjs` (bootstrap walk for the activation), `worktree.mjs` `isMainWorktree`.
- **Join:** `fgosDirFromRoot(root)` (`src/runner/paths.mjs`, "the single place that join happens"), imported by 17
  product files, 4 tests, 1 script; but T0/T1 files cannot import T2, so 35 sites join by hand.
- **Well-known files under `.fgos`:** `resolveFgosFile` in `src/state/fgos-file-registry.mjs` (tier 0 by a manifest
  file override; pure `path.join`, no fs, no Git). 30 importers (10 product, 20 tests).
- **Global directory:** door "global fgOS directory" owns `~/.fgos`; `llm-accounts.mjs` and the confinement probe
  harness are already its debt.
- **Guard:** `checkDoors` (`test/architecture.test.mjs:1747-1880`) walks `bin src scripts apps packages .githooks
  core domains`, per-line JS regex; a debt entry with no hit is stale.

## F3. The 36 lookups, by tier

`git grep -lE "path\.join\([^)]*'\.fgos'" -- src bin` = 35 files; `src/runner/repo-locks.mjs:83,116` joins by
template string (`` `${trustedMain}/.fgos` ``): 36, matching the review. 88 files contain a `.fgos` literal at all;
the other 52 carry it in messages, relative Git paths or comments, not joins.

| Tier | Files | Handling |
|---|---|---|
| T0 | `src/util/host-bin-path.mjs` (16, 27) | allowed in the new row: bootstrap before any door can load, and the Git one-door scan needs the literal shim path (its own comment) |
| T1 | `src/config/facade.mjs:97`, `src/identity/directory-store.mjs:14` | facade swaps to `fgosDirFromRoot`; directory-store receives the dir (phase 3) |
| T2 | `src/git/inspect.mjs:43`, `src/git/main-checkout-delete-guard.mjs:231`, `src/runner/paths.mjs:89`, `src/runner/worktree.mjs:55`, `src/runner/repo-locks.mjs:83,116` | swap |
| T5 | `src/runner/dispatch/{assignment-runner,config,confinement/probes/harness,operation-prompt-templates,reconciliation-planner,runtime-inspection}.mjs`, `src/runner/execution/{case-run-paths,commit-unit-work,handoff-refs,run,unit-run-start}.mjs`, `src/session-host/head-start.mjs`, `src/session-rotation/rotate.mjs` | swap (harness keeps its home join at 632 under the global door); `src/runner/dispatch/llm-accounts.mjs:258` is a home join only: not this row |
| T6 | `src/workflow/{case-bindings,case-close,case-gate,case-lock,case-runtime,unit-handoff}.mjs` | swap |
| T7 Work | `src/runner/merge.mjs`, `src/runner/operation-choice.mjs`, `src/runner/work-dispatch.mjs`, `src/state/porting-store.mjs`, `src/state/store.mjs` | debt, retires with the Work batch |
| T9 | `src/setup/doctor-bridge.mjs`, `src/setup/instruction-registry.mjs`, `src/setup/registrations.mjs` | swap; registrations in phase 6 (held by plan 1847) |

Outside `src`/`bin` the same pattern hits 23 files: 17 under `scripts/` (harness, benches, fixtures), shell lines
(`.githooks/pre-commit`, `launcher.sh`, `herdr-cockpit.sh`), one contract JSON and one skill markdown (not walked),
and `packages/execution/rust/src/decide.rs`. Phase 5 writes the pattern so it sees JS only (single-quoted
`path.join` and backtick templates) and allows `scripts/**` with a reason.

## F4. Guards that constrain the shape

- The A4 guard (`test/architecture.test.mjs:871-985`) forbids `src/runner/dispatch/**`, `src/runner/execution/**`,
  `src/runner/dispatch.mjs` and `src/workflow/**` from importing anything under `state/`, transitively, except the
  one allowlisted edge `worktree.mjs -> store.mjs` (`StoreError`). So the join leaf cannot stay in `src/state/`: T5
  and T6 files must import it. Moving both leaves to `src/util/` (tier 0 by directory) removes the allowlist entry
  and the two tier-0 file overrides.
- The tier rule fails on a stale exception (`test/architecture.test.mjs:252-265`).

## F5. What the Work batch still needs (unchanged by this plan)

`getMainFgosDir` and its cache in `runtime-coordination.mjs`; the five Work-tier joins; owner decision 3 (hot mutex
in Node until Work); ledger H22; the tier map of `src/state` and `src/runner` (default tier 7 with many T2/T5
overrides). Review §3 lists these for Work's phase 00.

## F6. Impact-analysis posture

`fgos dispatch decide --for impact-analysis --json` on 2026-11-18: `mechanism: unavailable`, `tool.missing`.
GitNexus is not present on this machine; the importer lists above come from `git grep` and are the blast radius
evidence (weak proof, named in the plan).
