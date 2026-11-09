# HARDEN T9 baseline: Host & Surface (`bin/fgos.mjs` arms, Rust host routing, gateway, herdr-dashboard, doctor/setup surface)

Main SHA `992af5320` (`992af5320c79ba216d0994f5e4c7dab873000c38`, 2026-11-09 15:22 +07), read in the linked worktree `forgent-worktrees/t9-baseline` made from `origin/main`. Measured 2026-11-09 15:29 to 15:40 (Asia/Saigon) on fg-server2 through the activated release `sha256:cbae6142…` from the main checkout. Board checked first: the latest COOK line (11:10) released the HOLD, so the timing commands ran. Load was **not** idle: 25 to 34 on 24 cores, 5 `run-tests.mjs` processes from other lanes. Timings below are load-class "busy" and only good for ratios. No test suite was run.

Read-only research by a subagent for lead:HARDEN. Inputs: [HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md) per-layer loop step 1, owner decisions 77 (T9 = move arm logic down, bottom-up, leave arms thin; Work arms last, after T7) and 78 (Work last; no Work change or plan here beyond listing), the hand-off ledger (H9, H10, H11, H13, H14, H17, H24), the [T8 baseline](research-261109-0654-harden-t8-baseline.md) format, [doctor P10 report](lead-261109-0855-doctor-p10-docs-gate-measure-close.md), `docs/reading-map.md`, AGENTS.md "Legacy-Node CLI Ownership Boundary".

## Summary

| Item | Value |
|---|---|
| `bin/fgos.mjs` | **5 379 lines**: imports 1–144 (95 static import lines, 58 dynamic `await import` inside arms), 36 top-level helpers 145–998 (530 lines in functions), `runVerb` switch 999–4539 (**74 arms, 3 526 lines, 2 181 code lines**), help/render 4540–4865, verb-property sets and Event Store trigger predicates 4866–5012, `handleHook` 5013–5151, `main` 5152–5379. It grew 4 968 (10-14) → 5 287 (10-23) → 5 379 |
| Arm code lines by class (heuristic, section 1.2) | flag parsing 161, output formatting 6, **decisions and validation 521, filesystem/Git/state access 100**, call-through and data assembly 1 393 |
| `src/cli/` | 8 files, 2 897 lines; `command-registry.mjs` **2 598** lines, 80 entries (6 `nativeOnly`) |
| Rust host `apps/fgos/src` | 7 979 lines (main 479, `legacy_exec` 397, `cli_presenter` 445, `cli_projector` 1 145, `wiring/` 5 513 of which mailbox is ~5 000); `apps/fgos/tests` 8 068 lines; 162 `#[test]` |
| Route table `packages/host-runtime/contracts/command-routes.json` | **82 selectors: 8 native** (`config convention friction gate-bypass identity mailbox metrics version`), **74 `legacy-cli`** to the Node payload (`hook` has two native kinds: `mailbox`, `mailbox-sync`) |
| `apps/fgos-gateway` | 4 339 Rust (gateway.rs 2 544, mcp.rs 694, cf_access 555, remote_invocation 492), 88 inline tests; web 4 349 lines |
| `herdr-dashboard` | 6 930 Rust, 125 tests; `packages/herdr-fgos-common` 1 324 Rust, 25 tests |
| Doctor/setup surface | `src/setup` 36 files 10 859 lines; `registrations.mjs` 3 961 (90 `registerCheck` calls) + 11 `*-checks.mjs` 1 553; **109 doctor rows** in the active release |
| Tests of this layer (recorded CPU, `test/suite-baseline.json` at `85ac64809`, 2026-11-08) | `test/cli` 67 files, 655 tests, 14 712 lines, **1 172.5 CPU-s (21 % of the suite's 5 505)**; `test/rust-host` 16 files, 141 tests, 789.7 CPU-s (mostly `fgctl-*`, Packaging); `test/setup` 58 files, 214.5 CPU-s. Rust test time of the five crates: not measured (no suite run allowed) |
| Timings (busy machine, median of 5) | `fgos version` (Rust native) 58 ms; `fgos --help` 319 ms vs the same payload by `node` directly 178 ms; `dispatch decide --for judge` 220 ms; `workflow status` 216 ms; `list --json` 822 ms; **`doctor --json` 17.4 to 47.5 s** |
| Import cost of the payload | `--help` loads **207 project modules** (220 total); CPU profile 85 ms, of which the module loader is 39 ms and payload code under 4 ms |

Facts that matter most for the council:

1. **Most arm logic is Work.** Of the 521 decision and validation lines in arms, 362 are in Work and Knowledge arms (41 + 10 arms, 1 307 code lines). The non-Work arms T0–T8 hold 251 decision/IO lines in 22 arms; the biggest are `run` (58), `workflow` (35), `dispatch` (26), `preflight` (23), `uninstall` (15), `main-checkout-reset` (15), `setup` (14). That is the T9 work before T7.
2. **The shell holds behaviour that no lower door has.** Event Store start/end triggers and the seal hand-off (main 5187, 5291–5300, 5361–5376), the Land-candidate release after land verbs (`landsWork`, 4866), the store guards (missing store, disconnected worktree snapshot, `init` in a worktree, 5198–5290), and invocation-fault recording live only in `main()`. The runner loop, `session`, and `gateway-control` each wire their own copy of the Event Store triggers. A Work door reached any other way gets none of it. That is the core of question 3.
3. **Lower layers call back up through the shell.** `src/event-store/maintenance.mjs:18` (T3) and `src/workflow/case-start.mjs:130` (T6) spawn `node bin/fgos.mjs …` through `src/cli/detached-child.mjs`; `src/observe/friction-client.mjs:10` (T3) imports `src/cli/invocation-fault-log.mjs`; `src/runner/fanout-batch.mjs:17` falls back to `bin/fgos.mjs`. The architecture manifest allows this (it has five coarse layers; `src/cli/detached-child.mjs` is `infra`), so no guard catches it.
4. **Seven duplicates between the shell and lower code**, listed in section 2.2 (overrides fold of `run` vs workflow, prompt slug, agy hook logic vs hook scripts, verb property sets vs registry, four Node root resolvers plus the Rust walk, three Rust "shim else `node bin/fgos.mjs`" builders, gateway REST vs MCP argv).
5. **Ledger items are all still open.** H9 (`ECHO_PROVIDER_DESCRIPTOR` still in the production composition table, `apps/fgos/src/main.rs:131`; `external_process/` is 2 590 lines), H13 (`legacy_exec.rs:145-150` still re-hashes every release file per call; host overhead on `--help` is about 140 ms under load), H14 (README:102-117 and packaging spec:46,91 still document `npm install -g`; `uninstall --remove-package` drives it), H17, H24 (moved to `gateway.rs:345-363`).

## 1. Inventory

### 1.1 Whole file

| Range | Lines | What | Class |
|---|---|---|---|
| 1–144 | 144 | 95 static `import` lines | load cost (section 4.2) |
| 145–998 | 854 | 36 helpers (530 lines inside functions) | mostly arm logic hoisted for reuse (section 1.3) |
| 999–4539 | 3 541 | `runVerb`: 74 arms + unknown-verb default | section 1.2 |
| 4540–4865 | 326 | help manifest render, `renderPretty` for setup/doctor, plan-lint report | output formatting (belongs in the shell) |
| 4866–5012 | 147 | `landsWork`, `handSealsToChild`, `opensEventStore`, `STORE_MISSING_WARNING_VERBS`, `EVENT_STORE_LIFECYCLE_VERBS`, `MUTATING_ONLY_VERBS`, `MUTATING_SUBCOMMAND_PREDICATES`, `ALLOWED_HOOK_KINDS` | verb properties beside the registry (2.2 D4) |
| 5013–5151 | 139 | `handleHook`: agy-format `dispatch-decide` and `decision-question` inline, else spawns `node scripts/<kind>-hook.mjs` | logic (2.2 D3) |
| 5152–5379 | 228 | `main`: parse, help, unknown-flag, store guards, Event Store triggers, envelope, exit-code map, fault record | parse + output + **store/lifecycle logic** |

### 1.2 Arms

Columns: code = non-blank non-comment lines; **flag** = a line whose only job is to read or check a flag; **fmt** = writes output; **logic** = decision/validation (`if`/`throw`/`&&`) plus filesystem, Git or store access; **call** = call-through, argument objects and data assembly. The split is a regex heuristic (script kept outside the repo); `call` overstates thin arms with long argument objects and understates assembly logic, so `logic` is the firm floor. Owner layer follows decision 77. "Work/Knowledge" marks knowledge, doc and decision verbs: decision 77 names no layer for them, so they are listed with Work (question U1).

| Arm | Range | Lines | Code | Flag | Fmt | Logic | Call | Owner | Lower module it calls |
|---|---|---|---|---|---|---|---|---|---|
| version | 1001–1004 | 4 | 3 | 0 | 0 | 0 | 3 | dead: route is Rust-native | `src/cli/version.mjs` |
| init | 1005–1044 | 40 | 26 | 0 | 0 | 7 | 19 | T3 (composes T1 mint, T2 recovery) | `util/identity-mint`, `setup/event-store-fixes`, `state/store`, `git` |
| git | 1045–1058 | 14 | 13 | 0 | 0 | 5 | 8 | T2 | `git/status.mjs`, `runner/paths` |
| add | 1059–1186 | 128 | 36 | 5 | 0 | 7 | 24 | Work | `state/store` |
| submit | 1187–1236 | 50 | 27 | 1 | 0 | 5 | 21 | Work | `intake/classify`, `submitWork` helper |
| discover | 1237–1279 | 43 | 23 | 2 | 0 | 4 | 17 | Work | `intake/discovery`, `workflow/index` |
| plan | 1280–1308 | 29 | 26 | 2 | 0 | 4 | 20 | Work | `intake/plan` |
| move | 1309–1353 | 45 | 18 | 6 | 0 | 2 | 10 | Work | `verbs/state/move` |
| retrospective | 1354–1406 | 53 | 27 | 0 | 0 | 6 | 21 | Work | `state/retrospective-doors` |
| cleanup | 1407–1480 | 74 | 44 | 1 | 0 | 9 | 34 | Work | `runner/worktree`, `runner/main-checkout-activity` |
| topic | 1481–1521 | 41 | 40 | 9 | 0 | 14 | 17 | Work | `state/store` |
| doc | 1522–1646 | 125 | 115 | 13 | 0 | 45 | 57 | Work/Knowledge | `state/knowledge-registry`, `report/knowledge-resolver` |
| knowledge | 1647–1735 | 89 | 61 | 2 | 0 | 23 | 36 | Work/Knowledge | `report/knowledge-lints`, `config/facade` |
| doc-registry | 1736–1754 | 19 | 18 | 0 | 0 | 11 | 7 | Work/Knowledge | `report/knowledge-projection` |
| compound | 1755–1825 | 71 | 42 | 3 | 1 | 19 | 19 | Work/Knowledge | `report/knowledge-resolver` |
| edit | 1826–1832 | 7 | 6 | 3 | 0 | 0 | 3 | Work | `verbs/state/edit` |
| resolve-park-reason | 1833–1844 | 12 | 7 | 3 | 0 | 0 | 4 | Work | `state/store` |
| ask | 1845–1879 | 35 | 13 | 4 | 0 | 2 | 7 | Work | `state/store` |
| answer | 1880–1903 | 24 | 11 | 7 | 0 | 0 | 4 | Work | `state/store` |
| handoff | 1904–1927 | 24 | 14 | 6 | 0 | 4 | 4 | Work | `state/store` |
| handoff-return | 1928–1934 | 7 | 6 | 2 | 0 | 0 | 4 | Work | `state/store` |
| decision | 1935–2032 | 98 | 37 | 9 | 0 | 12 | 16 | Work/Knowledge | `state/store`, **`scripts/check-decision-citation-drift.mjs`** (static import, `bin/fgos.mjs:39`) |
| decision-index | 2033–2057 | 25 | 15 | 0 | 0 | 4 | 11 | Work/Knowledge | `report/decision-index` |
| context-render | 2058–2144 | 87 | 51 | 1 | 1 | 16 | 33 | Work/Knowledge | `report/context-render`, `intake/plan` |
| gate-approve | 2145–2170 | 26 | 14 | 4 | 0 | 2 | 8 | Work | `state/store` |
| list | 2171–2195 | 25 | 13 | 2 | 0 | 1 | 10 | Work | `verbs/state/read` |
| show | 2196–2224 | 29 | 19 | 1 | 0 | 5 | 13 | Work | `report/item-trace`, `state/replay`, `collect*` helpers |
| ready | 2225–2234 | 10 | 3 | 0 | 0 | 1 | 2 | Work | `state/store` |
| graph | 2235–2254 | 20 | 7 | 1 | 0 | 1 | 5 | Work | `verbs/state/read` |
| gate-bypass | 2255–2269 | 15 | 3 | 0 | 0 | 0 | 3 | dead: route is Rust-native (`work.gate-bypass.show`) | `state/gate-bypass` |
| workflow | 2270–2385 | 116 | 101 | 9 | 0 | 35 | 57 | T6 | `workflow/index`, `workflow/propose`, `workflow/ref-digests` |
| gate-check | 2386–2403 | 18 | 17 | 5 | 0 | 5 | 7 | Work | `verbs/state/read` |
| stale | 2404–2425 | 22 | 5 | 0 | 0 | 0 | 5 | Work | `verbs/state/read` |
| slots | 2426–2448 | 23 | 16 | 0 | 0 | 0 | 16 | Work | `state/worker-slots`, `runner/claim-port` |
| report | 2449–2461 | 13 | 10 | 3 | 0 | 2 | 5 | Work | `state/store` |
| conflicts | 2462–2489 | 28 | 13 | 0 | 0 | 1 | 12 | Work | `state/domain-registry` |
| recheck-blocked | 2490–2500 | 11 | 5 | 0 | 0 | 1 | 4 | Work | `state/cleanup-harness` |
| schedule | 2501–2512 | 12 | 4 | 0 | 0 | 1 | 3 | Work | `state/store` |
| plan-lint | 2513–2600 | 88 | 73 | 2 | 0 | 36 | 35 | Work | `report/capability-plan-lint` |
| merge | 2601–2638 | 38 | 20 | 1 | 0 | 4 | 15 | Work | `verbs/merge/merge` |
| dispatch | 2639–2789 | 151 | 134 | 7 | 1 | 26 | 100 | T5 | `runner/dispatch/cli` (decide, probe-account), `verbs/dispatch/*`, `runner/execution/explain` |
| run | 2790–2952 | 163 | 133 | 11 | 0 | 58 | 64 | T5 | `runner/execution/run`, `workflow/case-admission-port`, `runner/execution/run-request` |
| events | 2953–2974 | 22 | 21 | 0 | 0 | 6 | 15 | T3 | `verbs/events/*` |
| rebuild | 2975–2985 | 11 | 4 | 0 | 0 | 1 | 3 | T3 | `verbs/events/rebuild` |
| rollup | 2986–3015 | 30 | 4 | 1 | 0 | 0 | 3 | Work | `collectRollupData` helper |
| docs-index | 3016–3048 | 33 | 5 | 0 | 0 | 1 | 4 | Work/Knowledge | `report/enduser-index-generate` |
| doc-sources | 3049–3074 | 26 | 14 | 1 | 0 | 2 | 11 | Work/Knowledge | `report/enduser-index`, `report/item-trace` |
| authoritative-match | 3075–3138 | 64 | 45 | 3 | 0 | 8 | 34 | Work/Knowledge | `report/authoritative-match` |
| take | 3139–3239 | 101 | 50 | 2 | 0 | 16 | 32 | Work | `runner/worktree`, `runner/claim-port` |
| pick | 3240–3308 | 69 | 32 | 2 | 0 | 10 | 20 | Work | `runner/claim-port` |
| return | 3309–3673 | 365 | 199 | 3 | 2 | 53 | 141 | Work | `runner/goal-check`, `runner/frozen-judge`, `runner/worktree`, `state/store` |
| review | 3674–3689 | 16 | 8 | 1 | 0 | 0 | 7 | Work | `verbs/merge/review` |
| approve | 3690–3721 | 32 | 9 | 1 | 0 | 1 | 7 | Work | `verbs/merge/approve` |
| sync-root | 3722–3748 | 27 | 6 | 1 | 0 | 1 | 4 | Work | `verbs/merge/sync-root` |
| promote-to-component | 3749–3785 | 37 | 13 | 1 | 0 | 4 | 8 | Work | `verbs/merge/promote-to-component` |
| reject | 3786–3792 | 7 | 6 | 2 | 0 | 0 | 4 | Work | `verbs/merge/reject` |
| catchup | 3793–3815 | 23 | 6 | 2 | 0 | 1 | 3 | Work | `verbs/merge/catchup` |
| triage | 3816–3819 | 4 | 3 | 0 | 0 | 0 | 3 | Work | `state/impact` |
| worktree | 3820–3861 | 42 | 28 | 1 | 0 | 11 | 16 | T2 | `verbs/worktree/{create,remove}` |
| session | 3862–3913 | 52 | 43 | 3 | 0 | 8 | 32 | T2 | `runner/session` |
| gateway | 3914–3940 | 27 | 22 | 1 | 0 | 8 | 13 | T9 own | `runner/gateway-control` |
| goal | 3941–3969 | 29 | 12 | 2 | 0 | 3 | 7 | Work | `state/store` |
| agents | 3970–3977 | 8 | 8 | 1 | 0 | 2 | 5 | T5 | `runner/agent-listing` |
| tool | 3978–4021 | 44 | 35 | 4 | 0 | 11 | 20 | T5 | `state/tool-registry`, `runner/dispatch/config` |
| setup | 4022–4160 | 139 | 70 | 0 | 0 | 14 | 56 | T8 | `setup/{checks,git-hooks,claude-code-hooks,shell-rc,skill-wrappers,runner-config-conversion}`, `config/facade` |
| uninstall | 4161–4240 | 80 | 60 | 0 | 0 | 15 | 45 | T8 | `setup/{git-hooks,shell-rc}`, `npm` via `execFileSync` |
| doctor | 4241–4261 | 21 | 12 | 0 | 0 | 5 | 7 | T8 | `setup/checks` (`DOCTOR_CHECKS`, `createDoctorRun`, `runFixes`) |
| unclaim | 4262–4306 | 45 | 39 | 1 | 0 | 15 | 23 | Work | `state/runtime-coordination`, `state/replay` |
| preflight | 4307–4379 | 73 | 59 | 0 | 0 | 23 | 36 | T8 | spawns `npm run build:skills`, `scripts/check-decision-citation-drift.mjs`, `scripts/check-backlog-reconciliation.mjs` |
| lock | 4380–4398 | 19 | 18 | 2 | 0 | 4 | 12 | T0/T1 | `runner/lock-fence` |
| lock-status | 4399–4439 | 41 | 18 | 0 | 0 | 1 | 17 | T0/T1 | `runner/lock-status`, beacon read |
| resync-worktree | 4440–4469 | 30 | 8 | 0 | 0 | 4 | 4 | T2 | `runner/worktree` |
| main-checkout-reset | 4470–4526 | 57 | 55 | 1 | 1 | 15 | 38 | T2 (lock T1) | `runner/main-checkout-reset-guard`, `createGitSafeRestore`, `withMainCheckout` |

Totals by owner layer:

| Owner | Arms | Lines | Code | Flag | Fmt | Logic | Call |
|---|---|---|---|---|---|---|---|
| T0/T1 | 2 | 60 | 36 | 2 | 0 | 5 | 29 |
| T2 | 5 | 195 | 147 | 5 | 1 | 43 | 98 |
| T3 | 3 | 73 | 51 | 0 | 0 | 14 | 37 |
| T4 | 0 | 0 | 0 | — | — | — | — |
| T5 | 4 | 366 | 310 | 23 | 1 | 97 | 189 |
| T6 | 1 | 116 | 101 | 9 | 0 | 35 | 57 |
| T8 | 4 | 313 | 201 | 0 | 0 | 57 | 144 |
| T9 own (`gateway`) | 1 | 27 | 22 | 1 | 0 | 8 | 13 |
| dead (Rust-native) | 2 | 19 | 6 | 0 | 0 | 0 | 6 |
| **Work** | 41 | 1 720 | 904 | 89 | 2 | 221 | 592 |
| **Work/Knowledge** | 10 | 637 | 403 | 32 | 2 | 141 | 228 |

### 1.3 Helpers above the switch (145–998), by owner

| Owner | Helpers (lines) |
|---|---|
| shell (keep) | `dataDir` 12, `requireField` 6, `optionalField` 4, `parseListFlag` 7, `readPaginationFlags` 10, `paginateVerbResult` 5 |
| T1 | `lockErrorToStoreError` 5, `confirmFence` 12 (TTY prompt, legit shell) |
| T2 | `describeLostCommits` 18, `renderStatus` 13, `isWorkingTreeClean` 3, `commitsSince` 3, `changedFilesSince` 5, `existsAtHead` 3 |
| T5 | `adhocUnitFromPrompt` 57, `retiredDispatchDoorMessage` 19, `resolveVerifyTimeoutMs` 22 (also used by Work `return`/`catchup`) |
| Work | `submitWork` 95, `parseDiscoverCallerVerdict` 42, `parsePlanCallerVerdict` 30, `collectRollupData` 30, `collectSettlementData` 19, `collectLearningData` 14, `collectMissingOutcomeNag` 15, `parseWaitFlags` 14, `parseMergeClusterOptions` 12, `targetsOf` 11, `parseAcceptanceFlag` 11, `assertNoPriorBlockedOutcome` 8, `exclude*` 12, `entryStepFor`/`withStepEffective`/`childrenOf` 10, `ghCommandOpts` 3 |

### 1.4 Rust host routing (`apps/fgos/src`)

- `main.rs` parses the selector, looks it up in the embedded route table (`command_routes()`, :122), sends `legacy-cli` to `legacy_exec::execute_legacy_cli` (:340-347) and `native` through the composition root (`COMPOSITION_PROVIDERS`, :130-147) and `InvocationService`. `--help` on any verb falls through to the legacy payload, which owns the manifest (:328-334).
- **Native (8):** `config`, `convention`, `friction`, `gate-bypass`, `identity`, `mailbox`, `metrics`, `version`; plus `hook mailbox` / `hook mailbox-sync` as native kinds of the `hook` selector (:264-271). Everything else (74) execs the Node payload.
- `legacy_exec.rs:145-150` verifies the manifest digest, **every release file**, and the legacy payload on each legacy call (H13).
- The `.fgos` ancestor walk for `--dir` defaulting is `main.rs:166-181`; the Node shell instead uses strict cwd (`dataDir` → `resolveFgosDir(cwd, { strict: true })`, `bin/fgos.mjs:145-156`). Two root policies for one invocation (H17).
- `COMPOSITION_PROVIDERS` still lists `ECHO_PROVIDER_DESCRIPTOR` (`test.fixture.echo`, `packages/host-runtime/rust/src/registry.rs:71-80`) in production (H9).
- `docs/platform/host-invocation-routing/roadmap.md:26,40,99,113` still says 75 selectors / 5 native; live is 82 / 8 (stale doc).

### 1.5 Gateway, dashboard, doctor registry

- **Gateway:** every Work action goes through `build_fgos_command` (`gateway.rs:345-363`), which runs the workspace shim or, failing that, `node <root>/bin/fgos.mjs` (H24; the line range moved from 381-397). REST (`gateway.rs:590, 643, 809, 946, 960, 1021, 1082`) and MCP (`mcp.rs:226, 252, 310, 323`) each build the argv for `list`/`show`/`take`/`approve` separately. D-ADR0014 makes the CLI the local adapter and the daemon a consumer outside the core, so spawning the CLI is by design.
- **Dashboard:** `herdr-dashboard/src/main.rs:210-230` (`fetch_worker_slots`) copies the shim-or-node builder of `herdr-fgos-common/rust/src/fgos.rs:395-411`; its own comment says it was "mirrored here rather than reused because `fgos.rs` is outside this item's footprint".
- **Doctor:** 109 rows (`DOCTOR_CHECKS` of the active release). The loop that runs them is in the shell (`bin/fgos.mjs:4252-4258`); `createDoctorRun` lives in `src/setup`. P10 measured median **19.86 s** at load 5.3–6.6 (target 12 s pending Work P09 and T5 seat rows); the slowest row is the Work row `delivered-not-on-trunk` (4.9–8.8 s).

### 1.6 Tests of this layer

| Set | Files | Tests | Lines | Recorded CPU-s | Notes |
|---|---|---|---|---|---|
| `test/cli` | 67 | 655 | 14 712 | 1 172.5 | 29 files spawn `process.execPath` with the CLI (`FGOS`, `BIN_FGOS`, `fgosBin`); top: `fgos-return` 133.6 (Work), `fgos-claim` 55.6, `run-verb` 45.4, `unknown-flag-rejection` 45.1, `fgos-post-merge` 40.9, `fgos-post-merge-4` 39.1 |
| `test/rust-host` | 16 | 141 | 5 141 | 789.7 | `fgctl-*` (Packaging) is ~510 of it; `harness` 72.8, `dev-host` 47.3 |
| `test/setup` | 58 | 697* | 14 585 | 214.5 | doctor rows; *test count includes the T8 skill tests |
| Rust `#[test]` | — | apps/fgos 162, gateway 88, dashboard 125, herdr-fgos-common 25, host-runtime 90 | — | not measured | |

Moving logic down moves its proof down: most `test/cli` cases that check a verb's decision through a spawned CLI become use-case tests, with one wiring proof per arm left (design principle 8).

## 2. Logic in the shell

### 2.1 Ranked by logic that belongs below (non-Work first, then Work for the record)

| # | Arm(s) | Logic lines | Should own it | Exists below? |
|---|---|---|---|---|
| 1 | `run` 2790–2952 + `adhocUnitFromPrompt` 472–528 | 58 + 27 | `src/runner/execution` (a run-request builder beside `run-request.mjs`) | **Partly.** Effort/timeout/account folding into overrides (2826–2862) is done for workflows by `src/workflow/case-start.mjs:172-178` (`assertReasoningEffort`, `parseRunTimeout`) and `unitOverridesOf` (`src/workflow/runner.mjs:165`); `run` folds without `assertReasoningEffort`. The prompt slug (514) copies `slugOf` in `src/workflow/propose.mjs:41`. Provider validation (497–504), persona resolve, confined-write refusal and case-admission wiring have no door |
| 2 | `workflow` 2270–2385 | 35 | `src/workflow/index.mjs` | Mostly flag mapping already; `--frame` key=value parse, `--seats` split, resume refusals for `--timeout`/`--account` (mirrors of `run`'s) |
| 3 | `dispatch` 2639–2789 + `retiredDispatchDoorMessage` 979–997 | 26 + 6 | `src/verbs/dispatch/*`, `runner/dispatch/cli.mjs` | Use cases exist (`showRunUseCase`, `watchRunUseCase`, `recover*`, `invoke*Operation`). **Second parser:** `decide` and `probe-account` re-parse `rawArgv` through `runDispatchCli` (2657, 2663); `decide` also writes its own JSON error to stdout and then throws (2665-2668), so the shell adds the same error on stderr: one failure, two shapes on two streams |
| 4 | `preflight` 4307–4379 | 23 | `src/setup` (or retire) | No. It runs `npm run build:skills` (which writes the skill surfaces and `.fgos/instructions/effective/repo.json`, T8 baseline K2/K3) and repo-relative `scripts/*.mjs`, so it only works inside the fgOS checkout (mission #3 only, D-ADR0035) |
| 5 | `uninstall` 4161–4240 | 15 | `src/setup` | No; `--remove-package` (4181-4213) drives the npm channel H14 retires |
| 6 | `main-checkout-reset` 4470–4526 + `describeLostCommits`/`renderStatus` 161–191 | 15 + 7 | `src/runner/main-checkout-reset-guard.mjs` | **Yes, partly:** `assertSafeMainCheckoutReset` is there; the request build, lost-commit listing and SafeRestore call are composed in the arm |
| 7 | `setup` 4022–4160 | 14 (+56 assembly) | `src/setup` (a setup use case) | No; nine steps composed in the arm. T8 arbitration ties `materializeSkillsIntoProject`/`createProjectSkillGuard` to the `fgos setup` retirement |
| 8 | `worktree` 3820–3861 | 11 | `src/verbs/worktree/*` | Use cases exist; the ctx (repoRoot, stateRoot, writer) is built twice in the arm (3824-3827, 3836-3839) |
| 9 | `tool` 3978–4021 | 11 | `src/state/tool-registry.mjs` | Partly |
| 10 | `session` 3862–3913 | 8 | `src/runner/session.mjs` | Yes; the arm re-projects the entry fields twice (start, end) |
| 11 | `gateway` 3914–3940 | 8 | `src/runner/gateway-control.mjs` | Yes; arm is thin (error mapping only) |
| 12 | `init` 1005–1044 | 7 (+19 composition) | T3 store bootstrap use case | No; composes T1 mint, T3 lock dirs, Work store, coexistence manifest, T2 Git recovery |
| 13 | `events`, `rebuild` | 7 | `src/verbs/events/*` | Yes; thin |
| 14 | `resync-worktree` 4440–4469 | 4 | `runner/worktree.mjs` `resyncWorktree` | Branch-from-`gitWorktrees` derivation (4442-4443) is in the arm |
| 15 | `doctor` 4241–4261 | 5 | `src/setup/registrations.mjs` (beside `createDoctorRun`) | No run-all door; the loop is in the arm. H10 per-row timing would land in that door |
| 16 | `lock-status` 4399–4439 | 1 (+17 assembly) | `src/runner/lock-status.mjs` | Beacon age/active arithmetic (4405-4415) is in the arm |
| 17 | `lock` 4380–4398 | 4 | `runner/lock-fence.mjs` | Yes; thin |
| — | **Work, for the record (decision 78: no change):** `return` 53 (two near-copy branches, branch path 3366-3459 and main path 3461-3673: settle-pass, settle-fail and friction record each written twice), `doc` 45, `plan-lint` 36, `knowledge` 23, `compound` 19, `context-render` 16, `take` 16, `unclaim` 15, `topic` 14, `decision` 12, `doc-registry` 11, `pick` 10, `cleanup` 9, `authoritative-match` 8; helper `submitWork` 95 lines | | Work use cases (`src/verbs/state/*`, `src/verbs/knowledge/*`) | `src/verbs/state/{move,edit,read,step}` and `src/verbs/merge/*` show the pattern exists (tsk-49i) |

Shell-level logic outside the arms (not a verb's): store guards and Event Store triggers in `main` (5198-5300, 5361-5376), verb property sets 4855-5012, `handleHook` 5013-5151.

### 2.2 Duplicates (arm vs lower layer, or copy vs copy)

| ID | What | Copies | Owner of the one door |
|---|---|---|---|
| D1 | Effort/timeout/account fold into unit overrides | `bin/fgos.mjs:2826-2862` (`run`) vs `src/workflow/case-start.mjs:172-178` + `src/workflow/runner.mjs:165` | T5 (`runner/execution`), T6 reuses |
| D2 | Prompt/request slug | `bin/fgos.mjs:514` vs `src/workflow/propose.mjs:41` | T5/T6 shared leaf |
| D3 | Hook guards: agy format inline, Claude format in scripts | `bin/fgos.mjs:5052-5125` vs `scripts/dispatch-decide-hook.mjs` (98) and `scripts/decision-question-hook.mjs` (84). The Claude path also spawns a second Node process (`spawnSync(process.execPath, scripts/<kind>-hook.mjs)`, 5138) | T5 (dispatch-decide), Work/T8 (decision question) |
| D4 | Verb properties | `MUTATING_ONLY_VERBS`, `MUTATING_SUBCOMMAND_PREDICATES`, `STORE_MISSING_WARNING_VERBS`, `EVENT_STORE_LIFECYCLE_VERBS`, `landsWork` (4855-4990) vs `COMMAND_REGISTRY` fields `touchesState` (48) and `requiresExistingStore` (34). Dead names: `check` (no such verb) and `gate-bypass` (Rust-native) in the store-missing set; `coordination` predicate (no such verb or route) | shell + registry (`src/cli/command-registry.mjs`) |
| D5 | Root resolution | `dataDir` (strict cwd), `resolveMainCheckoutRoot` (`runner/paths.mjs:74`), `getMainFgosDir` (`state/runtime-coordination.mjs:23`), `resolveGitRoots` (`runner/execution/run.mjs:63`), plus `flags.dir !== undefined ? path.dirname(dir) : (resolveMainCheckoutRoot(cwd) ?? cwd)` repeated in 6 arms (1047, 4027, 4169, 4248, 4264, 4445); Rust ancestor walk `apps/fgos/src/main.rs:166-181`; host-bin resolvers `src/util/host-bin.mjs:22` (falls back across checkouts), `src/util/host-bin-path.mjs:69`, `src/setup/bin-discovery.mjs:143` (H17). The reading map records "each verb computes repoRoot by its own policy" (tsk-49i) as intended, so unifying is a question (U2) | T1/T2 |
| D6 | "Workspace shim, else `node bin/fgos.mjs`" command builder | `herdr-fgos-common/rust/src/fgos.rs:395-411`, `herdr-dashboard/src/main.rs:210-230`, `apps/fgos-gateway/src/gateway.rs:345-363` (H24) | T9 own (`herdr-fgos-common`) |
| D7 | Gateway argv per Work verb | `gateway.rs` REST vs `mcp.rs` | T9 own (gateway), Work verbs |
| D8 | "Refuse a symbolic link" predicate (T8 P02) | `scripts/build-rust-distribution.mjs:151, 245, 370, 396` (four sites in one script) vs the new `lstatPlain` in `src/setup/skill-wrappers.mjs:50-66` on branch `harden/t8-p02-render-correctness` (`3799e328d`, **not on main yet**). P02 brief: share it only if it can be a `src/` leaf without `src` importing `scripts`; the branch kept it local, so the item comes here | Packaging/T9: one `src/util` leaf, the script imports it |
| D9 | Event Store lifecycle wiring per door | shell `main` (5187, 5291-5300, 5361-5376), `src/runner/loop.mjs:1286,1701,1790`, `src/runner/session.mjs:417`, `src/runner/gateway-control.mjs:359` | T3 (`src/event-store/maintenance.mjs`) |
| D10 | Dead Node arms of Rust-native verbs | `version` 1001-1004, `gate-bypass` 2255-2269 (reachable only by the unsupported `node bin/fgos.mjs` channel) | delete |

## 3. Coupling of Work to the shell (the cut list before T7)

Searched: imports of `bin/fgos.mjs` or `src/cli/*` from `src/state`, `src/verbs`, `src/intake`, `src/report`, `src/observe`, `src/workflow`, `src/event-store`, `src/setup`, `domains/`; spawns of the CLI; `process.argv`/`process.exit` in Work code (none found).

| # | Where | Kind | Cut |
|---|---|---|---|
| C1 | Work use cases exist only as arms: `return`, `take`, `pick`, `add`/`submit` (`submitWork`), `ask`/`answer`/`handoff*`, `unclaim`, `cleanup`, `goal`, `show`/`rollup` (`collect*`), `plan-lint`, knowledge/doc/decision arms | Work behaviour reachable only through the shell | Work's own phase after T7 (decision 78); listed only |
| C2 | Event Store start/end triggers, seal hand-off to a detached child, Land-candidate release after `approve`/`sync-root`/`promote-to-component`/`merge next` (`bin/fgos.mjs:4866-4884, 5187, 5291-5300, 5361-5376`) | behaviour only `main()` provides; three other doors wire their own copies (D9) | T3: one lifecycle door in `src/event-store/maintenance.mjs`; Land release stays with Work/merge but is called by that door |
| C3 | Store guards: missing store, disconnected worktree snapshot, `init` in a worktree, store-missing warning (`bin/fgos.mjs:5198-5290`) | Work-store safety only the CLI enforces | T1/T3: a store-open guard below the shell (e.g. `src/state/store.mjs` open) |
| C4 | `src/verbs/merge/approve.mjs:60` imports `src/cli/approve-fault-log.mjs` | Work → CLI helper | move the log writer below (observe) |
| C5 | `src/observe/friction-client.mjs:10` imports `src/cli/invocation-fault-log.mjs` | T3 observe → CLI helper | move `invocation-fault-log` into `src/observe` |
| C6 | `src/event-store/maintenance.mjs:18` and `src/workflow/case-start.mjs:130` spawn `node bin/fgos.mjs …` via `src/cli/detached-child.mjs` | lower layers run their background work through the shell | T3/T6: a detached entry per job (or keep the shell as the entry but owned by the layer); question U3 |
| C7 | `src/runner/fanout-batch.mjs:17-20` falls back to `bin/fgos.mjs` | T5 → shell file | use the one host resolver (D5) |
| C8 | `src/verbs/state/edit.mjs:41,48` tells the user to run `node <root>/bin/fgos.mjs list …` | Work message names the unsupported channel | Work phase; one-line text fix could ride along if the owner allows |
| C9 | `src/setup/registrations.mjs:104` imports `src/cli/version.mjs` | T8 → CLI helper (version is now Rust-native) | T8 |
| C10 | Gateway and dashboard reach Work only by spawning the CLI (D6, D7) | by D-ADR0014 | Work/T7 council decides whether that stays |

## 4. Measured facts

### 4.1 Cold verb timings (activated release `cbae6142…`, main checkout, load 25–34 on 24 cores, 5 runs each)

| Command | Runs (ms) | Median | Exit |
|---|---|---|---|
| `node -e ''` (floor) | 28, 25, 27, 27, 22 | 27 | 0 |
| `fgos version --json` (Rust native) | 46, 58, 78, 47, 137 | 58 | 0 |
| `fgos --help` | 264, 319, 334, 414, 301 | **319** | 0 |
| `node <release payload>/bin/fgos.mjs --help` (no host) | 207, 178, 190, 178, 174 | **178** | 0 |
| `fgos doctor --json` | 45 221, 47 381, 47 524, 21 650, 17 378 | 45 221 | 0 |
| `fgos dispatch decide --for judge` | 233, 212, 222, 220, 217 | 220 | 0 |
| `fgos workflow status wf-run-1794149778059-a1790101` | 225, 216, 216, 216, 241 | 216 | 0 |
| `fgos worktree list` | 134, 141, 139, 139, 142 | 139 | **1**: there is no `list` sub-verb (`create`/`remove` only); the arm throws a plain `Error`, not `StoreError` (3846) |
| `fgos list --json` (extra, a Work read) | 822, 794, 826, 795, 822 | 822 | 0 |

Host overhead on a legacy route: `fgos --help` minus the direct payload ≈ **140 ms** at this load (H13 measured the release re-hash alone at ~36 ms on 2026-10-21 at low load; the rest is the host exec and Node start). Doctor: P10's idle-window median is 19.86 s; the 17–47 s spread here is load.

### 4.2 Import cost of `bin/fgos.mjs`

- `--help` loads **220 modules, 207 of them project files** (by directory: `src/runner` 64, `src/state` 29, `src/git` 11, `src/util` 11, `src/report` 11, `src/workflow` 10, `src/holder-lock` 9, `src/run-supervisor` 9, `src/verbs` 8, `src/cli` 7, `scripts/lib` 7, `src/event-store` 6, …). Time to exit with a counting loader hook: 99–145 ms.
- `node --cpu-prof` of `--help`: 85 ms sampled; module loader (resolve, compile, link) 39 ms, other Node internals 21 ms, program 11 ms, GC 3 ms; payload code under 4 ms. So about **60–80 ms of every legacy verb is loading modules the verb does not use**; the 95 static imports are the cause (58 arms already use dynamic `import()`).

### 4.3 Doctor per-row timing

P10 needed a preload wrapper to see row costs. Decision 76 and the P10 report propose `fgos doctor --time` (per-row ms). Listed as an idea only (section 7). Its natural home is the run-all door of section 2.1 #15, not the shell loop.

## 5. Prior art

- **Use-case layer already exists:** `src/verbs/<domain>/<verb>.mjs`, signature `<verb>UseCase(ctx, options)`, ctx computed by the adapter, the use case never reads `process.cwd()`/env/argv (reading map line 162, tsk-49i). First cluster `9a600342d` (2026-08-15, merge verbs), then state verbs `71b50a2f2` (2026-09-16: move, edit, read), dispatch read door `4315692f1` (2026-09-07), events `408e0d694` (2026-10-19), worktree `8a8362712` (2026-10-19). 25 files, 3 444 lines today. T9 extends this door; it adds no new pattern.
- **Doctor judgments already moved to component verbs:** `c2631fb79` (2026-11-08, "one read-only pointer row per component").
- **Shared leaves moved below Dispatch:** `98e1c5824` (2026-11-06), with the layering guard (`test/architecture.test.mjs`, `docs/architecture-manifest.json`, five layers, `bin/fgos.mjs` is `entry`).
- **Native routes:** route table born in `d2a9d3284`; `gate-bypass` went native but its Node arm (`5942b4f6e`) stayed.
- **Size history of `bin/fgos.mjs`:** 5 113 (09-19) → 4 968 (10-14) → 5 287 (10-23) → 5 379 (11-08): extractions were outpaced by additions.
- **Ledger items handed to T9 (status re-checked today):**

| # | Item | Status on `992af5320` |
|---|---|---|
| H9 | host-runtime T9 list: `providers/external_process/**` (2 590 lines), production `EchoProvider`/`test.fixture.echo`, tautological admission gate, empty `RouterPolicy`, `command-routes-drift` spawn cost | open; echo descriptor still in `COMPOSITION_PROVIDERS` (`apps/fgos/src/main.rs:131`) |
| H10 | doctor per-row timing | open; idea only (decision 76, P10) |
| H11 | release-manifest canonical-JSON producer/verifier pair | Packaging; not re-checked here |
| H13 | each CLI call verifies the release once (merges H8); whoever lands it owes TEST (`forgent-f8`) a ping (H3) | open; `legacy_exec.rs:145-150` unchanged |
| H14 | retire `npm install -g github:vantt/forgent` | open; README:102,115, packaging spec:46,91,513; `uninstall --remove-package` (4181-4213) |
| H17 | two Node host-bin resolvers + Rust `.fgos` walk vs Git's trusted main root | open; walk now `main.rs:166-181`; third Node resolver `src/setup/bin-discovery.mjs:143` |
| H24 | gateway `node bin/fgos.mjs` branch | open; now `gateway.rs:345-363`, and copied twice more (D6) |
| T8 P02 | symlink predicate duplicate | branch `3799e328d` keeps it local in `skill-wrappers.mjs`; item lands here (D8) |
| T8 arb. | `materializeSkillsIntoProject`/`createProjectSkillGuard` go when `fgos setup` retires; R-9 `npm pack` list | Packaging (T9) |

## 6. Candidate phases (bottom-up; one writer per hot file)

`bin/fgos.mjs` has one writer at a time. Each phase owns the arm and helper ranges named (line numbers on `992af5320`; a phase rebases and re-reads them). Rust-only phases touch no `bin/fgos.mjs` range and can run beside the Node phases when their files are disjoint. Net Δ is an estimate (Node + Rust + tests); every phase retires the `test/cli` cases whose behaviour moves down, naming the use-case test that now owns them.

| Phase | Layer | Owns in `bin/fgos.mjs` | Lower files | Work | Net Δ est. | Risk |
|---|---|---|---|---|---|---|
| T9-00 | shell | 999–1004 (`version`), 2255–2269 (`gate-bypass`), 4855–5012 (verb sets), 5152–5379 (`main` guards only) | `src/cli/command-registry.mjs` | Delete the two dead Node arms (D10) and dead names `check`, `gate-bypass`, `coordination` (D4); derive the mutating/store sets from registry fields where they already agree (`MUTATING_ONLY_VERBS` ⊂ `requiresExistingStore`, checked) | −40 to −60 | Low; registry shape unchanged if only existing fields are used |
| T9-01 | T0/T1 | 145–156 (`dataDir`), the 6 repeated root lines (1047, 4027, 4169, 4248, 4264, 4445), 4380–4439 (`lock`, `lock-status`), 350–369 | `src/runner/paths.mjs`, `src/util/host-bin*.mjs`, `src/setup/bin-discovery.mjs`, `src/runner/lock-status.mjs`, `apps/fgos/src/main.rs:166-181` | D5/H17 once U2 is answered: one invocation-root door, one host-bin resolver; beacon projection into `collectLockStatus`; store-open guards (C3) below the shell | −60 to −120 | Medium: root policy is a contract; the owner said per-verb policy was intended |
| T9-02 | T2 | 1045–1058, 3820–3913, 4440–4526, helpers 161–231 | `src/runner/main-checkout-reset-guard.mjs`, `src/verbs/worktree/*`, `src/runner/session.mjs`, `src/runner/worktree.mjs` | `main-checkout-reset` use case (with lost-commit listing), one worktree ctx, resync branch derivation, session projection | −40 | Medium (SafeRestore path; OPC reviews Git diffs) |
| T9-03 | T3 | 1005–1044 (`init`), 2953–2985, 4866–4884, `main` trigger lines 5187, 5291–5300, 5361–5376 | `src/event-store/maintenance.mjs`, `src/cli/invocation-fault-log.mjs` → `src/observe/`, `src/cli/detached-child.mjs` | One Event Store lifecycle door used by shell, loop, session, gateway-control (D9, C2); move fault log under observe (C4, C5); store bootstrap use case for `init` | −50 to −80 | Medium-high: lifecycle timing (spec §16), ES reviewer |
| T9-04 | T4 | none | — | No T4 arm; `dispatch recover/watch` use cases are already in `src/verbs/dispatch`. Skip | 0 | — |
| T9-05 | T5 | 472–528, 979–997, 2639–2952, 3970–4021, 5013–5151 (`handleHook`) | `src/runner/execution/*`, `src/runner/dispatch/cli.mjs`, `scripts/dispatch-decide-hook.mjs`, `scripts/decision-question-hook.mjs` | Run-request builder (D1, D2: share with workflow); parse `dispatch decide`/`probe-account` once and drop the double stdout error; hook guards take a format argument so the agy branch and the second Node spawn go (D3); C7 | −100 to −150 | Medium: `run` is the primary door; exit-code map stays in the shell |
| T9-06 | T6 | 2270–2385 | `src/workflow/index.mjs`, `src/workflow/case-start.mjs` | Frame/seats parsing and resume refusals into the workflow door; reuse T9-05's fold | −20 | Low |
| T9-07 | T8 | 4022–4261 (`setup`, `uninstall`, `doctor`), 4307–4379 (`preflight`), 4540–4865 only where `renderPretty` reads setup/doctor | `src/setup/*` | Setup use case; doctor run-all door beside `createDoctorRun`; `preflight` moved or retired (U4); H14 (drop `--remove-package`, README/spec lines); C9 | −150 to −250 | Medium; touches the install/setup/doctor gate (CHANGELOG line) |
| T9-08 | T9 own (Rust, no `bin` range) | none | `packages/herdr-fgos-common`, `herdr-dashboard/src/main.rs`, `apps/fgos-gateway/src/{gateway,mcp}.rs`, `apps/fgos/src/{main,legacy_exec}.rs`, `packages/host-runtime` | D6/H24 one command builder (drop the `node bin/fgos.mjs` branch per decision 10), D7 argv once, H9 deletes (echo provider, `external_process` if unused), H13 verify-once (ping TEST), roadmap doc counts | −300 to −2 800 (H9 decides) | Medium; H13 is a security boundary (T0 red-team F1 on unauthenticated cache) |
| T9-09 | Packaging | none | `scripts/build-rust-distribution.mjs`, a new `src/util` leaf (or the T8 one moved) | D8 symlink predicate once; T8 setup-retirement items | −10 | Low; after T8 P02 lands |
| T9-W | Work, after T7 (decision 78) | 1059–2254 minus dead, 2386–2638, 2986–3815, 3941–3969, 4262–4306, helpers 245–974 | Work use cases | Listed only: C1, C8, C10 and the `return` double branch | — | — |

Order: T9-00 → 01 → 02 → 03 → 05 → 06 → 07 serial on `bin/fgos.mjs`; T9-08 and T9-09 in parallel when their files are free. Each phase passes the per-layer loop (council, arbitration, sub-plan, land, re-measure).

## 7. Feature ideas (owner chooses; RUL104)

| Idea | Problem / evidence | Benefit |
|---|---|---|
| `fgos doctor --time` (H10, decision 76, P10) | P10 and the audit needed a preload wrapper to see row costs | per-row ms in the JSON; lands in the doctor run-all door |
| Lazy imports per arm | 207 modules on every call; ~60–80 ms of an 85 ms import is unused loading (4.2) | faster every legacy verb; arguably "lighter", not a feature, but it changes the import shape of the entry |
| More native read routes | 74 of 82 selectors pay host exec + Node start (~140 ms + import) | `list`/`show`/`slots` for the dashboard and gateway; owner and Work council question |
| `fgos worktree list` | The brief asked for it; it does not exist (exit 1) | only if a real caller needs it |
| A layer guard for "lower code spawns the shell" (C6) | the manifest has five layers and allows it | catches the coupling class mechanically |

## Unresolved questions

- U1: Which layer owns `knowledge`, `doc`, `doc-registry`, `docs-index`, `doc-sources`, `authoritative-match`, `decision`, `decision-index`, `compound`, `context-render`? Decision 77 names none; this report lists them with Work.
- U2: Keep the per-verb root policy (tsk-49i) or one invocation-root door (D5, H17)? T9-01's size depends on it.
- U3: Should background jobs of T3/T6 keep using the shell as their detached entry (C6), or get their own entry per layer?
- U4: `preflight` runs repo scripts of the fgOS checkout and writes skill surfaces: retire it, or move it to a script for this repo only?
- U5: Is `apps/fgos-gateway` + `herdr-dashboard` in T9 scope for logic moves, or only for H24/D6/D7 (they are Work surfaces by D-ADR0014)?
- Not measured: Rust test time of the T9 crates (no suite run); idle-load timings (machine busy throughout).
