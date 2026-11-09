# HARDEN T9 arbitration: Host & Surface (CLI arms, `main()`, Rust host routing, gateway, dashboard, doctor/setup surface)

- **Big lead:** lead:HARDEN, 2026-11-09 16:20 (Asia/Saigon), fg-server2, `origin/main` `a945bc03a`. This arbitration was read-only, and this file is the only one it wrote. Every claim where two seats disagree, or where a seat and the baseline disagree, was re-checked on `a945bc03a`. The file:line or command is named in the row. `bin/fgos.mjs` is still 5 379 lines and its arms and `main()` have not changed since the baseline (`992af5320`).
- **Inputs:**
  - [baseline](research-261109-1529-harden-t9-baseline.md);
  - the four seats: [correctness](council-261109-1544-harden-t9-seat-correctness.md), [red-team](council-261109-1544-harden-t9-seat-redteam.md), [speed](council-261109-1544-harden-t9-seat-speed.md), [simplicity](council-261109-1544-harden-t9-seat-simplicity.md);
  - format of the [T8 arbitration](council-261109-1000-harden-t8-arbitration.md);
  - [HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md): per-layer loop step 3, the size rule, owner decisions 76(b), 77, 78 and 80;
  - [packaging audit](audit-261109-1533-fgos-packaging-distribution.md).
- **Citations (glossed once):**
  - RUL104 (D-ADR0062, "better, not bigger"): hardening improves what exists and adds no feature, layer or mechanism. A contract change moves every caller and deletes the old path. Ideas go to a separate list for the owner.
  - L10: extend through the door, never beside it.
  - Design principles:
    - 1: one door;
    - 2: bottom-up layering;
    - 4: Rust for platform foundations;
    - 6: KISS/DRY, no file you do not need;
    - 7: one source of truth;
    - 8: one owning proof per behaviour, at the lowest layer that can observe it.
  - Decision 77: T9 moves arm logic down into each layer's use case, bottom-up, and leaves the arms thin.
  - Decision 78: the Work council comes last, and nothing in Work changes before it.
  - Decision 80: the owner's answers on the packaging audit.
- **Status:** arbitration done. Owner ask 1 in section 4 has **4 forks** plus the Part A and landing-slot confirmation.

## Already taken outside this arbitration (in flight elsewhere, not re-planned)

| Item | Owner | Overlap with T9 that the sub-plan must respect |
|---|---|---|
| Red-team F1: the `~/.local/bin/fgos` launcher execs an unverified `.fgos/installation/bin/fgos` (`src/setup/project-launcher.mjs:21-32`; the shim `shim.rs:35-77` has no release confinement) | urgent HARDEN lead (decision 80, "urgent hardening") | (1) T9-13: the mailbox timer's tier-0 binary is that same shim, so only tiers 1 to 3 stay with T9. (2) T9-08: `resolve_fgos`'s `is_confined` fallback. (3) `src/setup/project-launcher.mjs` and `packages/distribution/rust/src/shim.rs` belong to that lead until it lands. |
| Correctness F2: the Rust root walk reaches `$HOME` and takes `~/.fgos` as a project store (`apps/fgos/src/main.rs:160-181`) | the same lead | T9-02, the root door. Its Rust half builds on the bounded walk once it lands. `apps/fgos/src/main.rs` has one writer at a time, so the Rust host phase PR1 starts after that lead. |
| Decision 80 Q2: fgOS never writes a user's global agent config on its own | another lead | The T8-layer phase P07 does not touch `src/setup/agy-permissions.mjs`, `mailbox-claude-accept.mjs` or the host table of `agent-hooks.mjs` beyond the doctor probe memo in T9-11. It rebases on that lead. |
| Decision 80 Q1, Q3 and Q4: per-machine defaults, `fgctl uninstall`, the pin-drift doctor row | the separate packaging sub-plan | (1) Q3 owns the `uninstall` arm (`bin/fgos.mjs:4161-4240`), `--remove-package` and H14 (the README npm sections, packaging spec :46, 91, 513); T9 does not move that arm. (2) Q4 adds one doctor row; T9-11's run-all door lands first or second, with a board line, on `src/setup/registrations.mjs`. (3) Q1 changes the shipped standard config; no T9 overlap. (4) Audit F3 (`--version`, usage exit code 2, did-you-mean, `ok/next/fix` in the doctor JSON) touches `main()`'s exit map and the help render. It is the packaging sub-plan's, and it must take its `bin/fgos.mjs` slot from the same single-writer queue (section 6). |

## Verdict in one paragraph

T9 is not heavy because its arms are heavy. It is heavy because the shell kept five jobs that belong lower:

- hook verdicts;
- the Event Store lifecycle and the store guards;
- the verb property sets;
- root and host-binary lookup;
- run flag folding.

On top of that, three Rust crates each copied one 15-line command builder, and the host re-hashes 62.5 MB on every legacy call.

The seats found two disagreements that change verdicts, and they also found the same rule implemented twice with different outcomes:

- The hook guard fails closed for Claude and fails open for agy, and it trusts a payload `cwd` that a `cd /tmp` defeats (red-team reproduced this).
- From a subdirectory of the main checkout, `fgos list` silently reads an empty store and `fgos init` creates a phantom one (correctness reproduced the first; the second is read from code).

Every accepted fix reuses a door that exists: `maintainEventStore`, `resolveActiveHostBin`, `COMMAND_REGISTRY`, `createDoctorRun().once`, `herdr_fgos_common::fgos`, `src/runner/paths.mjs` and the `src/verbs/<domain>` use-case pattern (tsk-49i). Nothing new moves to Rust. Work arms (51 arms, 2 357 lines) are untouched. Net with the recommended answers:

- `bin/fgos.mjs`: about −860 (to about 4 520);
- Node overall: about −750;
- Rust: about −90 (−4 700 more with Q3 (a));
- tests: about −700 (low confidence).

The honest floor before the Work phase is about 4 500 lines, not "thin".

## Disputed claims, re-checked by the arbiter

| # | Claim | Seats | Arbiter check on `a945bc03a` | Verdict |
|---|---|---|---|---|
| X1 | `run`'s override fold duplicates the workflow fold (D1), and `run` skips `assertReasoningEffort` | baseline and correctness: duplicate; simplicity: different semantics | `bin/fgos.mjs:2829-2862` writes onto raw overrides, user-typed ones included. `unitOverridesOf` (`src/workflow/unit-handoff.mjs:193-222`) builds seat-scoped overrides with `origin: 'workflow'`, and the unit's own timeout wins (`applyTimeout`). Effort is checked per executor in `bind.mjs:264-268`. `parseRunTimeout` is already shared. | **Simplicity is right.** The duplicate is the same "push an unscoped override, fill where unset" block written three times inside `run`. The slug is a real copy: `bin/fgos.mjs:514` vs `src/workflow/propose.mjs:41`; only the fallback word differs. |
| X2 | Event Store lifecycle wired in "five doors with different rules" (correctness F9) vs "one door, three callers" (simplicity) | correctness, simplicity, baseline D9 | `maintainEventStore` (`src/event-store/maintenance.mjs:36`) is the one function. `session.mjs:417`, `gateway-control.mjs:359` and `loop.mjs:1790` call it as a clean writer exit (`shutdown: true`). Only `main()` holds the start trigger (5299, which drops `{ error }`), the end trigger (5366, which records), the seal hand-off (4870-4875, 5187) and the Land release (4866-4868, 5373). | **Simplicity on the shape, correctness on the defects.** The shell-only policy moves into `maintenance.mjs`. The asymmetric error handling and the verb-keyed `landsWork` are real (T9-07). |
| X3 | Store sets can be derived from existing registry fields (baseline T9-00) | baseline vs correctness and simplicity | `requiresExistingStore: true` is on 34 entries. `MUTATING_ONLY_VERBS` (22) is a strict subset. `requiresExistingStore`'s only reader outside the registry is `main()`. `touchesState` (52) also feeds the public help manifest (`bin/fgos.mjs:4541-4582`). | **Rejected as stated.** One field must change. Lead decision L-4 replaces `requiresExistingStore` by a `store` field instead of adding one (no net field). |
| X4 | Root policy: one door (correctness, red-team, speed) vs keep the per-verb policy, unify only the mechanics (simplicity) | all four | (1) `dataDir` is strict cwd (`bin/fgos.mjs:145-156`). (2) The store-missing warning is gated on `!isMainWorktree(cwd)` (5279), and `isMainWorktree` compares Git top levels (`src/runner/worktree.mjs:503-506`), so a subdirectory of the main checkout counts as main and gets no warning. (3) The `init` guard (5263) passes in a subdirectory, and the refusal text says "run `fgos init` here" (5223). (4) The Rust walk serves native routes only (`main.rs:437`). The legacy route gets only the state root pinned (`legacy_exec.rs:254`), never a project root. | **One door, policy as a parameter** (lead decision L-1). Simplicity's own reason was the phantom-store guard, and a walk bounded by the Git top level keeps that guard: a linked worktree's top level has no store, so it is still refused. The strict policy is what creates the phantom store (correctness F3). |
| X5 | Background children: own small entry per layer (speed F-5) vs keep the shell as the entry (correctness, red-team, simplicity) | all four | `spawnDetachedCli` runs `process.execPath` with its own module-relative `bin/fgos.mjs` (`src/cli/detached-child.mjs:10,24`). A child that called the host would hit `FGOS_RUST_HOST_RECURSION_GUARD` (`legacy_exec.rs:35-42,245`). | **Keep the shell as the entry; move the door into `src/util`** (L-5). The import saving speed wants comes from the lazy entry (T9-04): `events seal` would then load only its own arm. A per-layer entry is a second door, by principle 1. |
| X6 | Speed: one module per arm (`src/cli/arms/<verb>.mjs`) | speed alone | 74 arms, so about 74 new files. 58 arms already use `await import()`. | **Rejected** (principle 6). The lazy shape is reached with dynamic imports inside the arms, an error leaf and `hook` first (T9-04, L-6). |
| X7 | `external_process` size | baseline 2 590 source; simplicity 2 780 + 2 031 tests | `find packages/host-runtime/rust/src/providers/external_process -name '*.rs'` gives 2 590. The four test files (`external_process_*`, `external_provider_manifest_and_registry.rs`, fixture `echo_process.rs`) give 2 031. No caller outside `packages/host-runtime` (`git grep` hits only `lib.rs`, `providers/mod.rs` and its own files). | **2 590 + 2 031 (+ about 190 related module lines by simplicity's count).** It is an owner fork (Q3) because `docs/platform/host-invocation-routing/architecture/external-provider-protocol.md` states it as a direction. |
| X8 | Where the 55 ms host overhead goes (speed F-1) | speed vs baseline (140 ms "under load") | `legacy_exec.rs:145-150` calls `recompute_artifact_digest`, `verify_release_files` and `verify_legacy_node`. `verify_legacy_node` calls `verify_native_addon` (`verify.rs:235`), which runs `verify_release_files` again on the addon entry (`verify.rs:216-220`), so the addon is hashed twice per call. | **Speed is right.** The baseline's 140 ms is a load figure; quiet it is 55 ms. |
| X9 | The agy hook fails open where Claude fails closed | correctness F4, red-team F2b, simplicity B2 | `bin/fgos.mjs:5065-5085` has `catch { // fail-open }` around `decideExecutorCli`. `scripts/dispatch-decide-hook.mjs:25-31,67-92` blocks a `config-*` refusal with exit 2. The agy branch takes `workspacePaths[0]`, the Claude script takes `data.cwd` (`:61`). | **Confirmed.** It is also red-team's cwd bypass (reproduced by the seat: payload `cwd` `/tmp` gives exit 0). |
| X10 | `fanout-batch` drops the root it is given | correctness F6, baseline C7 | `resolveBinFgos()` takes no parameter (`src/runner/fanout-batch.mjs:19-21`), and the call passes `root` (`:89`), which is dropped. `.mjs` runs through `process.execPath` (`:90-94`). | **Confirmed.** |
| X11 | `host-bin.mjs` falls back to another checkout's host | correctness F7, simplicity B10 | `src/util/host-bin.mjs:44-67`: `[process.cwd(), PACKAGE_ROOT]`, commented "e.g. in tests". | **Confirmed.** It is a test-only branch in production code (AGENTS.md DoD 5). |
| X12 | `preflight` has no caller | simplicity, red-team | `git grep preflight` outside `bin/` and `test/` finds only the word in other senses (fgctl's init preflight, CHANGELOG lines, archived plans) | **Confirmed.** |
| X13 | Rhai `execute` limits | red-team F5 (not run) | `mcp.rs:215` sets only `set_max_operations(500_000)`. `apps/fgos-gateway/Cargo.toml:42`: `rhai = { version = "1", features = ["serde"] }`, default features on, so the file module resolver is present and string, array and map sizes are unbounded. | **Accepted from code.** The owning proof (one Rust test running the doubling script) settles it on the first run. |
| X14 | Delete guard as a native Rust route (speed idea) | speed | Decision 76(b): "no native Rust hook unless a CLI cannot carry it". | **Not raised again** without new evidence. T9-01's in-process form reaches about 55 ms. |

## 1. Part A: target shapes (for owner approval)

**Rust/Node boundary:** no arm moves to Rust (all four seats). Rust work is deletion, one shared builder, the verify cost, and the Rhai limits. No new spec file. The settled shapes go into:

- `docs/platform/host-invocation-routing/` (README and roadmap; the stale "75 selectors / 5 native" counts at roadmap :26, 40, 99, 113 become 82 / 8);
- `docs/platform/packaging-distribution/spec.md` for the doctor surface;
- the reading map's line on the use-case layer (tsk-49i).

DOC is told before merge.

**Rule for every arm:** parse flags, build the arguments of one call, call one use case, print. Every refusal, default, composition and exit decision the arm holds today goes to the door named. The use-case pattern is the existing one: `src/verbs/<domain>/<verb>.mjs` with `<verb>UseCase(ctx, options)`, ctx built by the adapter, and no `process.cwd()`, env or argv inside the use case (reading map, tsk-49i). It is not a new layer.

### 1.1 Arm groups, bottom-up (decision 77 order)

| Layer | Arms | Use-case door the arm calls (exists / extend) | What moves down | What the arm keeps |
|---|---|---|---|---|
| **T0/T1** process, identity, lock | `lock` (4380-4398), `lock-status` (4399-4439) | `src/runner/lock-fence.mjs` (exists); `collectLockStatus` in `src/runner/lock-status.mjs` (extend) | beacon age and active arithmetic (4405-4415) into `collectLockStatus` | flags, `confirmFence` (a TTY prompt is shell work), print |
| T0/T1 (not an arm) | root and host-binary lookup | `resolveInvocationRoot({ cwd, dir, policy })` in `src/runner/paths.mjs` over one `readRepoFacts(cwd)` Git read; `resolveActiveHostBin` (`src/util/host-bin-path.mjs:69`) | `dataDir` (145-156); the six repeated `flags.dir !== undefined ? … : resolveMainCheckoutRoot(cwd) ?? cwd` lines (1047, 4027, 4169, 4248, 4264, 4445); the three separate `resolveRepo()` reads (`paths.mjs:33,74`, `execution/run.mjs:63`); the `host-bin.mjs` cross-checkout loop; `fanout-batch`'s file fallback | one call |
| **T2** git, worktree | `git` (1045-1058), `worktree` (3820-3861), `session` (3862-3913), `resync-worktree` (4440-4469), `main-checkout-reset` (4470-4526) + helpers 161-231 | `src/verbs/worktree/{create,remove}` (exist); `runner/session.mjs` (exists); `resyncWorktree` (exists); `mainCheckoutResetUseCase` in `src/runner/main-checkout-reset-guard.mjs` (extend the existing guard module) | one worktree ctx (built twice today, 3824 and 3836); usage errors as `StoreError('validation')` (3823, 3835, 3846); the reset request, lost-commit listing, SafeRestore call and the main-checkout policy check (the root door refuses a `--dir` that is not this repo's trusted main root, red-team F6); branch derivation for `resync` (4442-4443); the `session` entry projection | flags, print |
| **T3** events, mailbox, config | `init` (1005-1044), `events` (2953-2974), `rebuild` (2975-2985) | `src/verbs/events/*` (exist); `initStoreUseCase` in `src/state/store.mjs`'s neighbourhood (one function composing mint, lock dirs, `initStore`, the coexistence manifest and Git recovery) | the `init` composition; the `init` guard joins the root door (init only at a Git top level with no store) | flags, print. `mailbox` and `config` are already native (Rust); nothing to move |
| **T4** run-supervisor | none | `dispatch recover/watch` use cases already in `src/verbs/dispatch` | nothing | — |
| **T5** run, dispatch | `run` (2790-2952) + `adhocUnitFromPrompt` (472-528), `dispatch` (2639-2789) + `retiredDispatchDoorMessage` (979-997), `agents` (3970-3977), `tool` (3978-4021), `hook` (`handleHook` 5013-5151) | `buildRunRequest(flags, positional, roots)` in `src/runner/execution/run-request.mjs` (extend; no new file); `src/runner/dispatch/cli.mjs` with `decide` and `probe-account` split from the assignment runner so the hook and `decide` load about 60 modules, not 145; one verdict function per hook kind (`decideDispatchHook` beside `cli.mjs`, `checkDecisionQuestion` in `src/state/decision-question.mjs`) behind one payload normalizer for the Claude and agy formats | provider validation, persona resolve, confined-write refusal, case-admission wiring, the three fold blocks as one local helper, one `slugOf` leaf shared with `workflow/propose.mjs`; `decide` parsed once with one error shape (today JSON on stdout at 2665-2667, then the shell writes to stderr); `KNOWN_DISPATCH_SUBVERBS` (2643-2652) from the registry; the agy branches and the second Node spawn (5138) | flags, one call, print. The exit-code map stays in the shell |
| **T6** workflow | `workflow` (2270-2385) | `src/workflow/index.mjs` (exists) | `--frame` key=value parse, the `--seats` split, the resume refusals for `--timeout` and `--account` | flags, print |
| **T8** setup, skills | `setup` (4022-4160), `doctor` (4241-4261), `preflight` (4307-4379) per Q1; **not** `uninstall` (decision 80 Q3, packaging sub-plan) | `setupUseCase` in `src/setup/` (composes the nine steps the arm composes today); `runDoctor({ root, fix, strict })` beside `createDoctorRun` in `src/setup/registrations.mjs` | the doctor loop (4252-4258) and its strict exit; one shim probe per run through `run.once`; the three `claude` CLI calls of `claude-plugin-marketplace` in parallel; `mailbox-sync-timer` names only the activated host (tiers 1 to 3 go); `src/setup/registrations.mjs:104` stops importing `src/cli/version.mjs` | flags, `renderPretty` (output formatting is shell work) |
| **T9 own** | `gateway` (3914-3940) | `src/runner/gateway-control.mjs` (exists) | nothing (already thin) | as today |
| **Work** (41 + 10 Knowledge arms) | listed in section 6.3 | — | **nothing (decision 78)** | unchanged |

### 1.2 Where `main()`'s cross-cutting jobs go

| Job today in `main()` | Target owner (one door) | Shell keeps |
|---|---|---|
| Parse, `--help`, unknown-flag refusal, envelope, print, exit-code map | shell | all of it. The four verb-keyed exit branches (5320-5337) become a registry `exitOf(data)` per entry, or `{ data, exitCode }` from the use case, so `main()` stops naming verbs |
| Root | `resolveInvocationRoot` (1.1, T0/T1) | one call |
| Store guards: missing store, disconnected snapshot, `init` in a worktree, store-missing warning (5198-5290) | `admitStoreAccess({ store, dir, cwd, explicitDir })` beside `isMainWorktree` in `src/runner/worktree.mjs`, driven by the registry `store` field (L-4) | one call; the refusal is a tagged `StoreError` carrying `faultClass`, so the six `faultClass = …` assignments go |
| Event Store start and end triggers, seal hand-off, Land release (5187, 5291-5300, 5361-5376; `landsWork`, `handSealsToChild`, `opensEventStore`, `isEventStoreChild`, `EVENT_STORE_LIFECYCLE_VERBS`) | `runWithEventStoreLifecycle(facts, fn)` **in the existing `src/event-store/maintenance.mjs`**. Facts: `{ trustedMain, dispatched, opensStore, landed }`. The Land release comes in as a callback so T3 imports no Work or merge code. Both triggers record their error the same way | one wrapper call around `runVerb` |
| Fault record (`recordInvocationFault`, 5340-5349) | `src/observe/invocation-fault-log.mjs` (moved from `src/cli`, with `approve-fault-log.mjs`). Values are redacted to an argv shape, the file is 0600 and capped (red-team F9) | the call |
| Seal child entry | `spawnDetachedCli` moves to `src/util/spawn-detached-fgos.mjs`, same contract. Its entry stays `bin/fgos.mjs` (X5) | nothing |

### 1.3 Invocation-root door (U2)

- **Authority:** the one answer to "which project does this invocation act on".
- **Contract:** `resolveInvocationRoot({ cwd, dir, policy })` returns `{ root, fgosDir }` or a named refusal.
  - Policies: `main-checkout` (setup, doctor, uninstall, unclaim, resync, main-checkout-reset); `caller-tree`; `strict-cwd` (only where a verb proves it needs it).
  - Default when no `--dir` is given: the nearest `.fgos` that is a project store, walking up from cwd **and never past the Git top level**. It never takes the machine's global `~/.fgos` (the in-flight F2 fix sets the same bound for the Rust walk).
  - `--dir` is a request the door validates. Under `main-checkout` it must equal the trusted main root of the cwd's repository.
- **What it fixes:** correctness F1 (an empty view from a subdirectory), F3 (a phantom `docs/.fgos`), red-team F6 (`main-checkout-reset --dir <other>` skips its guard), and H17's mechanics.
- **Cross-language:** the Rust walk serves native routes and the Node door serves legacy routes. Both follow one rule, proven by one shared fixture table in `test/rust-host/` (a tree, an expected root). The env pin that correctness proposed is not taken: it adds a channel, and the direct `node bin/fgos.mjs` path would still need the Node rule.
- **Open for T2 (red-team F12):** whether Git Inspect rejects a `.git` file whose `gitdir` does not point back. If it does not, the check goes inside this door.
- **Size:** `bin/fgos.mjs` about −60, `src` about +40, Rust 0 (the in-flight fix already bounds the walk).

### 1.4 Host verify cost (H13, speed F-1)

- **Today:** about 62.5 MB is hashed on every legacy call, 55 ms of host overhead at quiet load. 70 % of those bytes are the running host binary (20.2 MB) and a second read of the addon (16.5 MB).
- **Lead decision L-7, no owner answer needed:**
  - Stop hashing the running host binary from inside itself. A tampered host would skip its own check anyway, so the self-hash proves nothing.
  - Hash the addon once (`verify_legacy_node` stops re-entering `verify_native_addon` when `verify_release_files` already covered the entry).
  - Effect: about 26 MB per call, about −25 to −30 ms, about +15 Rust lines.
- **Owner fork Q4:** the fingerprint memo (a per-file size, mtime, ctime and inode record taken after a full verify, falling back to a full verify on any difference). It brings host overhead to at most 25 ms and adds about 70 Rust lines plus one tamper test.
- Whoever lands either change pings TEST (`forgent-f8`, H3).

### 1.5 Lazy imports and the `bin/fgos.mjs:39` import (speed F-2)

- **Entry static imports:** only the parser, the registry, the envelope and an **error leaf**.
- **Error leaf:** `StoreError`, `EXIT_CODES`, `OUTCOME_EXIT_CODES`, `categoryOf` and `exitCodeForOutcome` move to `src/state/store-error.mjs`, which has no imports. `store.mjs` keeps one re-export so its callers are untouched, which makes it one definition, not two.
- **Other imports:** every other import becomes `await import()` inside the arm that uses it. 58 arms already do this. Each layer phase converts the arms it owns, and P00 converts the shell's own cross-cutting imports. Examples: `currentDispatchDepth` drags in `transport.mjs`'s 38-module closure (`bin/fgos.mjs:84`), and `releaseRecordedLand` drags in `merge.mjs` (`:90`).
- **`hook`:** handled before the registry loads.
- **Proof:** one guard in `test/architecture.test.mjs` that names the entry's allowed static imports.
- **`bin/fgos.mjs:39`** statically imports `scripts/check-decision-citation-drift.mjs` (11 `scripts/` modules, 15 to 16 ms on every call). It becomes a dynamic import inside the `decision` arm (Work: one import line, no behaviour change, WORK told; precedent T8 L-7) and the `preflight` arm (gone if Q1 (a)).
- **Targets, estimated by speed and not yet measured after a change:**
  - entry import at most 10 ms of CPU above node (73 today);
  - `--help` and version-class verbs about −30 to −65 ms;
  - `dispatch decide` about −35 to −40 ms with the T5 split;
  - `run` about 0, because its use case is the whole runner.

### 1.6 Hook path cost (speed F-3)

- **Today, at load 3:**
  - An Agent/Task `PreToolUse` costs 262 ms: host 55, parent Node about 143, child Node 64.
  - A matching Bash call through the delete guard costs 148 ms, while the guard script alone is 25 ms.
- **Target:**
  - `fgos hook <kind>` runs its verdict in-process from a 2-to-60-module closure, with no second Node.
  - Dispatch-decide drops to about 110 to 130 ms, and the delete guard to about 55 ms.
  - With Q4 (a), each loses about another 30 ms.
- **Size:** about −60 Node lines on top of T9-01's merge of the two hook copies.
- **The native `hook mailbox` (18 ms) is already the floor pattern.** No new native hook (decision 76(b)).

### 1.7 Gateway and dashboard scope (U5)

**In T9:**

- one command builder `herdr_fgos_common::fgos::fgos_command(root, args) -> io::Result<Command>`. It runs the workspace shim or returns a named refusal ("run `fgctl init`"), never `node <root>/bin/fgos.mjs` (decision 10, H24). It is used by `gateway.rs:345-363`, `herdr-dashboard/src/main.rs:210-230` and `fgos.rs:395-411`, and `resolve_fgos`'s silent node fallback on a failed confinement goes (red-team F10);
- the Rhai limits and a concurrency cap on the authenticated router (T9-09);
- the small gateway items of T9-17;
- `ECHO_PROVIDER_DESCRIPTOR` out of the production composition (`apps/fgos/src/main.rs:17,131,278`), once `catalog.rs` no longer needs `test.fixture.echo` in production;
- the bind default and token model **per Q2**;
- `external_process` **per Q3**.

**Not in T9 (Work, C10):** the REST and MCP argv of the Work verbs (D7: one-line duplicates, except `list`, about 15 lines), the Work REST shape, and whether the gateway reaches Work only by spawning the CLI (D-ADR0014).

### 1.8 Doctor rows

- **No new row** from T9.
- `*-hook-wired` rows (five) keep their conditions and share one probe per shim per run.
- `claude-plugin-marketplace` keeps its condition and runs its three calls in parallel.
- The pin-drift row belongs to the packaging sub-plan (decision 80 Q4).
- No condition is lost.

### 1.9 Net size targets (estimates; HARDEN commits only)

| Area | Today | After (recommended answers) | Δ | From |
|---|---|---|---|---|
| `bin/fgos.mjs` | 5 379 | about 4 520 | **about −860** | dead arms and names −100, hook −115, registry sets −45, sub-verbs −25, lifecycle and guards −90, run −165, setup, doctor and init −60, T2 and lock arms −60, root lines −60, `preflight` −73 (Q1 a), main residue and helpers −70 |
| Node `src/` | — | — | about +300 | verdicts +120, `buildRunRequest` +140, lifecycle +70, setup, doctor and init use cases +90, root door +40, error leaf 0 (moved); host-bin fallback −30, fanout fallback −8, imports of the dead arms |
| `scripts/` | hooks 182, backlog check 143 | about 12 | about −310 | hook scripts become thin entries; `check-backlog-reconciliation.mjs` goes with Q1 (a) |
| **Node total** | | | **about −750** (about −530 with Q1 (b)) | |
| Rust | | | **about −90** | builder +15, three node branches −45, three `bin/fgos.mjs` fallback tests −50, echo −4, verify L-7 +15, Rhai limits and cap +20, gateway small items +15, dashboard −20, roadmap docs 0; Q4 (a) +70; Q3 (a) −4 621 (2 590 source + 2 031 tests) |
| Tests | `test/cli` 14 712 lines | | **about −700 (low confidence)** | `fgos-preflight` −156 (Q1 a), cases that assert a decision through a spawned CLI move to unit proofs and leave one wiring case per arm; the sub-plan does a per-arm census |
| Gateway, dashboard | 2 544 + 694 + 2 080 | | about −10 (bind Q2 ±5) | |

**Layer net ≤ 0 in every answer combination.** The worst case is Q1 (b), Q3 (b), Q4 (a): Node about −530, Rust about −20, tests about −550.

## 2. Part B: findings, merged

Severity after merging: **High 4** (two reproduced by a seat's run, two measured), **Medium 9**, **Low 10**. Rejected 10, routed 12. **No High is left unreproduced.** The Highs are:

- T9-01 (reproduced);
- T9-02 (reproduced);
- T9-03 (measured);
- T9-04 (measured).

### 2.1 Accepted (ranked by value over risk)

| Id | Seats | Sev | Repro | Evidence | Fix (door reused) | Size | Owning proof after | Phase |
|---|---|---|---|---|---|---|---|---|
| T9-01 | correctness F4; red-team F2 a+b; simplicity B2; speed F-3; baseline D3 | **High** | yes (red-team: payload `cwd` `/tmp`, `/nonexistent` and `$HOME` give exit 0 for a call that blocks from the project) | `bin/fgos.mjs:5052-5125` (agy branch inline, `catch { fail-open }` at 5083-5085, `workspacePaths[0]`); `scripts/dispatch-decide-hook.mjs:61` (`data.cwd`), `:25-31,67-92` (fail closed on `config-*`); the second Node spawn at 5138; `scripts/decision-question-hook.mjs:36-60` reads the transcript, the agy branch does not | One verdict per kind behind one payload normalizer, run in-process. The project comes from the harness project dir (`CLAUDE_PROJECT_DIR`, the agy workspace root), never a payload `cwd`; a payload `cwd` outside it is judged against the project. The config refusal fails closed in both formats (L-8). The agy branch, the second spawn and the duplicated script bodies go | bin −115, scripts −170, src +120 | `test/scripts/dispatch-decide-hook.test.mjs` and `decision-question-hook.test.mjs` re-pointed at the verdict functions, one fixture table per format (config refusal, cwd outside, malformed JSON); wiring `test/cli/dispatch-retired-doors.test.mjs:159` | P05 |
| T9-02 | correctness F1, F3; red-team F6; simplicity B12; speed U2; baseline D5, H17 | **High** | yes (correctness: `fgos list --json` from `docs/` exits 0 with `work: {}` and no warning); F3 read; F6 read | X4 above; `main-checkout-reset` guard skipped when `--dir` is given (`bin/fgos.mjs:4473`) | `resolveInvocationRoot` (section 1.3) | bin −60, src +40 | `test/runner/paths.test.mjs` (one case per policy plus subdirectory, stripped worktree, `--dir` of another repo); the Rust/Node conformance table in `test/rust-host/` | P01 (+ P02 for the reset arm) |
| T9-03 | speed F-1; baseline H13 | **High** | measured (55 ms of a 133 ms `--help`, quiet) | `legacy_exec.rs:145-150`; `verify.rs:216-220,235` | L-7 now; Q4 (b) if the owner takes it | Rust +15 (+70 with Q4 a) | a Rust test in `apps/fgos/tests`: an edited payload byte is refused (exists for the full verify; extended for the memo under Q4) | PR1 |
| T9-04 | speed F-2; baseline 4.2 | **High** | measured (207 modules on every call; the `scripts/` import 15 to 16 ms) | `bin/fgos.mjs:1-144`, `:39`, `:84`, `:90` | Section 1.5 (L-6) | about 0 net (moves); guard +15 test lines | architecture guard on the entry's static imports | P00 (shell) + each layer phase for its arms |
| T9-05 | correctness F6, F7; simplicity B10; baseline C7, H17 | Med | read | X10, X11 | `fanout-batch` passes `root` to `resolveActiveHostBin({ cwd: root })` and drops the file fallback; `resolveHostBin` becomes a call into `resolveActiveHostBin` with no cross-checkout loop; tests set `FGOS_HOST_BIN` or `packageRoot` | src −38 | `test/util/host-bin-path.test.mjs` (the hermetic cases are re-fixtured, not deleted); `fanout-batch` case in its own test | P01 |
| T9-06 | correctness F5; simplicity B1 (sets part), B3, B6; baseline D4 | Med | computed (registry loaded by both seats) | `bin/fgos.mjs:4855-5012`: dead `check`, `gate-bypass`, `coordination`; `lock` classified twice; `KNOWN_DISPATCH_SUBVERBS` 2643-2652; nine hand-written sub-verb lists | Registry `store` field (L-4) and `landsWork` field; `requireSubVerb` from the registry `subcommands`; the 65-line history comment shrinks to the invariant | bin −70, registry +35 | `test/cli/subcommand-flag-drift.test.mjs` gains one row ("every state-touching entry states its `store`; every `landsWork` verb exists"); behaviour stays owned by `test/cli/fgos-disconnected-worktree-guard.test.mjs` | P00 (fields, readers), each layer phase for its sub-verb lists |
| T9-07 | correctness F9; simplicity B5; baseline D9, C2 | Med | read | X2; start trigger error dropped (5299), end recorded (5366-5371); `landsWork` keyed on names while the real owner is `landRunnerItem` (`src/runner/merge.mjs:870`) | `runWithEventStoreLifecycle` in `maintenance.mjs` (section 1.2); `trustedMain` resolved by the function when omitted (session, gateway-control drop their own `resolveMainCheckoutRoot(x) ?? x`) | bin −90, src +70 | `test/event-store/triggers.test.mjs` owns start/end and both error records; one `test/cli` wiring case | P03 (lead:ES reviews, spec §16) |
| T9-08 | correctness F8; red-team F10; simplicity B8; baseline D6, H24 | Med | read | `gateway.rs:345-363`, `fgos.rs:375-411` (silent `bin/fgos.mjs` fallback, also when confinement fails), `herdr-dashboard/src/main.rs:210-230` | One `fgos_command` (section 1.7); the gateway maps the refusal to 503 with the `fgctl init` hint | Rust −105 net | `fgos.rs` unit tests: shim present gives a shim command; no shim or an unconfined shim gives a refusal; `gateway.rs:1334` keeps its working-dir proof; three `bin/fgos.mjs` fallback tests retired (behaviour removed by decision 10) | PR2 |
| T9-09 | red-team F5 | Med | read (X13) | `mcp.rs:215`; `spawn_blocking` per verb handler and `post_runner_tick` | `set_max_string_size`, `set_max_array_size`, `set_max_map_size`, `set_max_call_levels`, `set_max_expr_depths`, `DummyModuleResolver`, a wall-clock bound on `execute`; a `tower` concurrency limit on the authenticated router (L-9) | Rust +20 | one Rust test in `mcp.rs`: the doubling script ends in a script error, not an abort; one `import` refused | PR2 |
| T9-10 | simplicity B4; baseline D1, D2 (corrected by X1) | Med | read | `bin/fgos.mjs:2829-2862` (three fold blocks), `:472-528`, `:514` vs `propose.mjs:41` | `buildRunRequest` in `run-request.mjs`; one fold helper; one `slugOf` leaf. `unitOverridesOf` is **not** merged (different semantics) | bin −165, src +140 | new `test/runner/execution/run-request.test.mjs` cases (the module exists; one proof per refusal); `test/cli/run-verb.test.mjs` keeps one wiring case per branch (prompt, `--unit`, `--resume`, `--case`) | P05 |
| T9-11 | speed F-4; baseline 2.1 #15, H10 (door only) | Med | measured (14 identical shim probes, 1.9 s at load 17; `claude` three calls in series, 1.3 to 1.5 s) | `bin/fgos.mjs:4252-4258`; `src/setup/agent-hooks.mjs:75,393,618`; `createDoctorRun().once` (`registrations.mjs:195-206`) | `runDoctor` door; `isShimRunnable` through `run.once` keyed by shim path; the three `claude` calls in parallel | bin −12, src +25 | `test/setup/checks.test.mjs`: one probe per shim per run; the doctor exit case moves with the door | P07 |
| T9-12 | baseline C4, C5, C6, C9; simplicity B11; red-team F9 | Med (F9 Low) | read; red-team read the live file | `friction-client.mjs:10`, `approve.mjs:60`, `maintenance.mjs:5`, `case-start.mjs:26`, `registrations.mjs:104`; `invocation-fault-log.mjs:68-80` writes full argv, umask mode, no cap | Move both fault logs to `src/observe/`, `detached-child` to `src/util/`; argv shape (verb, sub-verb, flag names, value lengths), 0600, drop the oldest half past 1 MB; one manifest guard: `src/{event-store,workflow,observe,verbs,setup}` import nothing from `src/cli` | src +15 | moved tests; `docs/architecture-manifest.json` row checked by `test/architecture.test.mjs`; one redaction case in the fault-log test | P03 |
| T9-13 | red-team F3 | Med | read + `renderSystemd` run | `src/setup/mailbox-sync-timer.mjs:204-206`: tier 0 then `bin(cwd)` tiers 1 to 3 (`<cwd>/bin/fgos.mjs`, `node_modules/.bin`, PATH) written into a systemd/launchd unit; `quote()` escapes `"` and `\` only | The timer names the activated release's host read through `hostBinFromActivation` (confined), never tiers 1 to 3; control characters and `%` refused in `projectRoot`, `bin` and `remote`. **Tier 0 is the in-flight F1 fix's shim**; this item does not touch the launcher | src −5 | `test/setup/mailbox-sync-timer.test.mjs` | P07 (MAIL told: their file area) |
| T9-14 | correctness F11; simplicity B1; baseline D10 | Low | yes (`gate-bypass` through `node bin/fgos.mjs` stops at `git-addon-unavailable`) | `bin/fgos.mjs:1001-1004`, `2255-2269`; imports :54, :72; `ALLOWED_HOOK_KINDS` (5012) knows `mailbox` but not `mailbox-sync` | Delete both arms and their imports; the Node `hook` refuses both native kinds by name (it is reached only on the unsupported channel) | bin −30 | `test/rust-host/command-routes.test.mjs:80-81`; `test/cli/fgos-version.test.mjs` re-pointed at the host like `unknown-flag-rejection.test.mjs:100`; `fgos-setup.test.mjs:114-117` uses `lock-status` as its probe verb | P00 |
| T9-15 | correctness F10 | Low | read | the only three `throw new Error` in the switch: 3823, 3835, 3846 | `StoreError('validation', …)` | ±0 | one case in `test/cli/fgos-worktree*.test.mjs` (unknown sub-verb exits 4) | P02 |
| T9-16 | baseline 2.1 #3 | Low | read | `decide` writes JSON to stdout and throws (2665-2668) | one error, one stream (in T5's split) | bin −5 | `runDispatchCli` error-shape case | P05 |
| T9-17 | red-team F11 | Low/Med | read | `gateway.rs:863` `read_to_string(resolved.join(name))` follows a file link; `with_static_serving(..., Path::new("static"))` (`:1318`) relative to cwd; `CfAccessVerifier` `reqwest::Client::new()` with no timeout | Canonicalize the file and recheck the prefix; serve the embedded bundle only; client timeout plus a 30 s negative JWKS cache | Rust +15 | three Rust unit tests in `gateway.rs`/`cf_access.rs` | PR2 |
| T9-18 | correctness F13 | Low | read | `detached-child.mjs:10` assumes the entry sits inside the release payload | one release-layout assertion in the existing `test/distribution` source-payload test | test +5 | that test | P03 |
| T9-19 | baseline D8; simplicity B13 | Low | read | `scripts/build-rust-distribution.mjs:151,245,370,396`; `src/setup/skill-wrappers.mjs:54-66` (`lstatPlain`, now on main) | one `src/util/refuse-symlink.mjs` leaf; the script and `skill-wrappers` import it | −12 | the leaf's own test (new module, so a new file is allowed by principle 8) | PK |
| T9-20 | baseline H9 (echo part) | Low | read | `apps/fgos/src/main.rs:17,131,278` | Out of production once `catalog.rs` confirms nothing needs it | Rust −4 | existing host-runtime tests keep the fixture | PR1 |
| T9-21 | red-team F8 | Low | run (30 strings) | `src/git/main-checkout-delete-guard.mjs:1-24` calls itself "last line of defence" | Header and `worktree-safety.md` name what it does not judge (interpreters, `rsync --delete`, glob `mv`, `shred`) | text | none (text) | P05 |
| T9-22 | baseline 1.4 | Low | read | `docs/platform/host-invocation-routing/roadmap.md:26,40,99,113` (75 / 5) vs live 82 / 8 | Correct the counts | docs | none | PR1 (DOC told) |
| T9-23 | T8 arbitration routed item (`materializeSkillsIntoProject` / `createProjectSkillGuard` with the setup retirement; R-9 `npm pack` list) | Low | read | — | **Moved to the packaging sub-plan** with decision 80 Q3 (it reshapes setup and uninstall); listed here so it is not lost | — | — | packaging sub-plan |

### 2.2 Rejected (with source)

- **Baseline D1, "`run` duplicates the workflow fold and skips `assertReasoningEffort`."** X1: `bind.mjs:264-268` checks the effort. `unitOverridesOf` has different semantics on purpose. Only the in-`run` triple block and the slug are taken (T9-10).
- **Baseline D9, "three copies of the lifecycle wiring."** X2: there is one door with three clean-exit callers. Only the shell's own policy moves (T9-07).
- **Baseline T9-00, "derive the mutating sets from existing registry fields."** X3: `requiresExistingStore` has 12 more verbs. L-4 replaces the field instead.
- **Simplicity U2, "keep strict cwd; change only the mechanics."** X4: the strict policy is what produces correctness F1 (reproduced) and F3. The phantom-store guard survives the bounded walk.
- **Correctness A1, "the host pins the invocation root in the payload env."** It adds a channel, and the direct-node test channel would still need the Node rule. A shared conformance table is used instead (section 1.3).
- **Speed F-5 position, "a small entry per background job (`src/event-store/seal-child.mjs`)."** X5: the lazy entry gives the same import saving without a second door.
- **Speed Part A, "one module per arm (`src/cli/arms/<verb>.mjs`)."** X6: about 74 new files (principle 6).
- **Speed idea, "native delete-guard route."** Decision 76(b); X14.
- **Correctness F12, "`preflight` unguarded in a worktree," as its own fix.** It is covered by Q1. If the owner keeps the verb, the guard goes in P07.
- **Red-team F1 trust-record design and `fgos trust`.** In flight elsewhere (decision 80 urgent item); the design is not re-planned here.

### 2.3 Routed (not T9 phases)

| Item | To | Why |
|---|---|---|
| `return`'s two near-copy branches (3366-3459 and 3461-3673: settle-pass, settle-fail and the friction record each written twice) | WORK (Work council, decision 78) | Work arm |
| `src/verbs/state/edit.mjs:41,48` tells users to run `node <root>/bin/fgos.mjs` (C8) | WORK | Work file |
| Four Work reads that reach the store and sit in no set (`gate-check`, `slots`, `context-render`, `doc-registry`; correctness F5) | WORK | L-4 gives their entries a `store` value that keeps today's behaviour; the new warning is Work's choice |
| Gateway Work argv REST vs MCP (D7), Work REST shape, CLI-only reach (C10) | WORK | D-ADR0014; Work verbs |
| Doctor row `delivered-not-on-trunk` (4.8 s, 27 to 38 % of the doctor) | WORK | the remaining gap to the 12 s doctor target (speed F-4) |
| Seat-binding rows spawn the host 98 and 84 times (`src/seat-binding/client.mjs:126`) | T5/T6, done by HARDEN (closed layers, decision 48 rule) as an item, not a T9 phase | about −2 s of doctor at load 32 |
| `fgos lock-status` 349 ms (5 sandboxed Git calls) | T0/T1 item (HARDEN) | measured by speed; not an arm-logic move |
| `getMainFgosDir` launches 5 Git processes; `fgos list` 7, `fgos stale` about 30 | OPC (T2 Git door) | one door call per fact |
| Red-team F12: `.git` file redirect of the trusted main root | OPC (T2) question; T9-02 adds the check if Inspect does not refuse it | not reproduced (a hook blocked the probe) |
| Dashboard `--dangerously-skip-permissions` default on (`herdr-dashboard/src/pick.rs:89-100`) | owner via Q2 (option c) | a recorded D1 of the dashboard; reversing it is the owner's call |
| `uninstall` arm, `--remove-package`, H14 README/spec npm lines, T9-23, audit F3 surface items | packaging sub-plan (decision 80 Q3, Q4) | it reshapes these surfaces |
| Gemini/plugin `$ARGUMENTS` and `--acknowledge-iron-law` note from the T8 arbitration | plugin owner (Work merge commands) | no injection found; noted only |

## 3. Lead decisions (inside RUL104 and decisions 77 and 80; no owner answer needed)

| # | Decision | Reason |
|---|---|---|
| L-1 | **One invocation-root door with named policies** (section 1.3). The default is a walk bounded by the Git top level that never takes the global `~/.fgos`. | Three of four seats agree. The fourth seat's reason (phantom-store guard) holds under the bounded walk (X4). F1 is a silent wrong answer (an empty backlog) for any agent whose cwd is a subdirectory, and it hits every project that uses fgOS (D-ADR0035 mission #1). tsk-49i's per-verb policy was about use-case ctx, which the door keeps as a parameter. |
| L-2 | T9-01 and T9-02 start first, in the bottom-up order: T9-02 in P01 after the in-flight F2 fix lands, T9-01 in P05. Neither waits on owner answers. | Two reproduced Highs; both are missing checks inside existing mechanisms. |
| L-3 | `run`/`workflow` folds are **not** merged across modules (X1). | Different semantics, verified in the code. |
| L-4 | Registry: `requiresExistingStore` is **replaced** by `store: 'none' \| 'read' \| 'require' \| 'write' \| (positional, flags) => …`, plus `landsWork: true \| (positional) => boolean`. `touchesState` stays because it is part of the public help manifest. Work entries get values that reproduce today's behaviour exactly. | Replaces five sets and a predicate table with one field change (no net field); ends the dead-name class (`check`, `coordination` survived two retirements because nothing checked the sets). |
| L-5 | The detached child keeps `bin/fgos.mjs` as its entry, and `spawnDetachedCli` moves to `src/util/`. Routing it through the host is left to T3 and T6 with the ES reviewer. | X5; the host recursion guard refuses a host-spawned host. |
| L-6 | Lazy imports are part of each arm move, not a separate feature: error leaf, `hook` first, entry import guard, and the `:39` import moved into the `decision` arm (one line, WORK told). No per-arm files. | Decision 77 already makes each arm call one use case; a static import of every other arm is then dead weight (speed). |
| L-7 | Host verify: drop the self-hash and the duplicate addon read (section 1.4); TEST pinged. | A running binary verifying itself proves nothing; the addon is read twice by a door re-entry. It is not the cache the T0 red-team warned about. |
| L-8 | **The agy hook becomes fail-closed on an unusable config, like Claude** (simplicity's D-1). Both formats judge against the harness's project dir, not a payload `cwd`. | One verdict function has to pick one rule. The Claude rule is the documented one (`scripts/dispatch-decide-hook.mjs:25-31`: a broken config must not bypass the rules it declares). Three seats recommend closing it, and none argues for fail-open. It is a security gap (red-team reproduced the bypass), not a product preference. CHANGELOG line: "agy hooks now refuse when the project config is unusable, as Claude hooks do". |
| L-9 | Rhai `execute` gets the memory, depth and module limits and the router a concurrency cap (T9-09). | It bounds resources and removes a capability nobody intended: the module comment at `mcp.rs:229-233` says only bound functions are reachable. Not a D9 sandbox reopen (it grants nothing). One seat raised it, none disputed it. |
| L-10 | Gateway and dashboard use one shim-or-refuse builder; no `node bin/fgos.mjs` fallback. | Decision 10 already declares that channel unsupported (simplicity D-3 is a notice, not a fork). |
| L-11 | **U1: the knowledge, doc and decision verbs stay with Work** (`knowledge`, `doc`, `doc-registry`, `docs-index`, `doc-sources`, `authoritative-match`, `decision`, `decision-index`, `compound`, `context-render`); the Work council decides whether a Report layer exists. | All four seats agree; their lower modules are Work-side (`state/knowledge-registry`, `report/*`, `state/store`); decision 78 holds. |
| L-12 | T9 does not move the `uninstall` arm or touch H14. The packaging sub-plan owns both (decision 80 Q3). | It avoids moving a body twice. |
| L-13 | No new doctor row from T9; `fgos doctor --time` stays an idea (section 5). | Size rule: a new row must name the row it replaces. |
| L-14 | One writer at a time on `bin/fgos.mjs`, by range (section 6). The packaging sub-plan's `uninstall` and help-surface edits take a slot in the same queue. | Shared-file rule; the T8 precedent. |

## 4. Owner ask 1 (gửi anh)

Em gom 4 câu thật sự cần anh chọn, thêm câu 5 duyệt hình dạng và giờ land. Anh trả lời một lần là được, ví dụ "1a 2b 3a 4a 5a".

**Không hỏi, em đã quyết (mục 3):**

- Một cửa duy nhất xác định project gốc cho mỗi lệnh (L-1). Hôm nay chạy `fgos list` từ thư mục con `docs/` thì nhận về một store rỗng mà không có cảnh báo gì; chạy `fgos init` ở đó thì đẻ ra một store thứ hai.
- Hook của agy sẽ chặn khi config hỏng, giống hệt Claude (L-8). Hai bản hook đang cho hai kết quả khác nhau với cùng một đầu vào, và chỉ cần `cd /tmp` là qua được guard.
- Thêm giới hạn bộ nhớ cho Rhai trong MCP `execute` (L-9).
- Bỏ phần host tự hash chính nó và bỏ lần đọc addon thứ hai (L-7). Mỗi lệnh nhanh hơn khoảng 25 đến 30 ms mà không mất lớp kiểm tra nào.
- Các verb knowledge, doc, decision ở lại với Work (L-11), vì cả bốn seat đều đồng ý.

**Phần đang làm ở chỗ khác, em không lập kế hoạch lại:** shim chạy file chưa xác minh, walk lên `$HOME`, ghi config agent global, cùng các câu Q1, Q3, Q4 của quyết định 80.

**Q1. Bỏ verb `fgos preflight`.**

- **Chuyện gì đang xảy ra:** `fgos preflight` (`bin/fgos.mjs:4307-4379`) chạy `npm run build:skills` và hai script trong `scripts/` của repo mà cwd đang đứng. Nó chỉ chạy đúng trong checkout fgOS. Trong một project khác, nó chạy script `package.json` của chính project đó. Trong một worktree, nó ghi `.fgos/instructions/effective/repo.json` và làm kẹt worktree.
- **Nguyên nhân:** em đã `git grep` và không có caller nào (skill, hook, CI, docs, verb khác), chỉ có test của chính nó (156 dòng). `scripts/check-backlog-reconciliation.mjs` (143 dòng) cũng không có caller nào khác. Đây là verb công khai nên bỏ nó là đổi contract.
- **Các lựa chọn:**
  - (a) Bỏ verb khỏi registry và route table (82 còn 81 selector) và xoá luôn script backlog. Nếu vẫn muốn giữ kiểm tra backlog thì nó thành một `npm run` script của repo này. Giảm: Node −216, test −156, kèm một dòng CHANGELOG.
  - (b) Giữ verb, nhưng từ chối chạy nếu `package.json` không phải `forgent` hoặc gốc không phải main checkout hay worktree của nó. Thêm khoảng 10 dòng Node.
  - (c) Để nguyên.
- **Khuyến nghị:** (a). Verb này chỉ phục vụ sứ mệnh #3 (D-ADR0035), lại mang một cái tên nghe như chỉ đọc nhưng thực ra chạy code. Mỗi kiểm tra của nó đã có chủ khác: `fgos-mirror.test.mjs` và verb `decision`.
- **Phạm vi:** "có (a)" cho phép xoá arm, entry registry, route, test, script backlog và thêm một dòng CHANGELOG. Không đụng `build:skills` hay script citation.

**Q2. Gateway mặc định nghe `0.0.0.0` bằng HTTP thường, dùng một token cho mọi quyền.**

- **Chuyện gì đang xảy ra:** `core/config-standard/gateway.yaml:7-8` đặt `bind: 0.0.0.0` (cố ý cho LAN và Tailscale). Gateway phục vụ HTTP thường. Ai giữ được token, hoặc bất kỳ ai CF Access cho qua, đều làm được mọi việc: submit, approve, `/runner/tick`. Log không ghi ai đã gọi, vì `gateway.rs:470` bỏ qua danh tính CF. Dashboard thì mặc định bật `--dangerously-skip-permissions` (`herdr-dashboard/src/pick.rs:89-100`).
- **Nguyên nhân:** em đọc theo seat red-team, không chạy gateway. Token sinh ngẫu nhiên, file 0600, so sánh constant-time, CF kiểm đủ `iss`, `aud`, `exp`: những phần đó đều ổn. Chỗ hở nằm ở mặc định và ở việc không có dấu vết.
- **Các lựa chọn:**
  - (a) Giữ mặc định. Ghi người gọi (danh tính CF, không có thì ghi fingerprint ngắn của token) vào `--source` của verb, và giới hạn số spawn đồng thời. Khoảng Rust +25.
  - (b) Đổi mặc định sang `127.0.0.1`. Muốn dùng `0.0.0.0` thì phải đặt rõ trong config, và chỉ được khi đã có `cfAccess*` hoặc TLS phía trước (Tailscale, CF). Kèm luôn phần ghi người gọi của (a). Khoảng Rust +30, config 1 dòng, một dòng CHANGELOG. Máy anh nào đang dùng LAN thì phải thêm một dòng config (em viết guide trước khi land).
  - (c) Làm như (a), cộng thêm tắt mặc định `--dangerously-skip-permissions` của dashboard (bật lại bằng `FGOS_HERDR_SKIP_PERMISSIONS=1`). Khoảng Rust +30.
- **Khuyến nghị:** (b). Token đi qua LAN dạng chữ rõ, và quyền của nó là toàn quyền. Một project dùng fgOS không nên mở cổng ra mạng chỉ vì để mặc định. Còn (c) là một quyết định riêng về dashboard; em đề nghị làm cùng nếu auto-launcher không người canh được phép nhận item mới.
- **Phạm vi:** "có (b)" cho phép đổi default trong standard, thêm lệnh từ chối khi bind non-loopback mà không có CF/TLS, ghi người gọi, cap spawn, guide cho máy anh. Không đổi cách cấp token.

**Q3. `external_process` của host-runtime: giữ hay bỏ.**

- **Chuyện gì đang xảy ra:** `packages/host-runtime/rust/src/providers/external_process/` có 2 590 dòng nguồn và 2 031 dòng test. Ngoài chính `packages/host-runtime`, không có caller production nào.
- **Nguyên nhân:** em đã `git grep external_process`, chỉ ra `lib.rs`, `providers/mod.rs`, file của chính nó và ba file test. Nhưng `docs/platform/host-invocation-routing/architecture/external-provider-protocol.md` ghi nó là một hướng đi, còn README ghi "implemented preview". Xoá đi tức là đảo một ý định đã ghi.
- **Các lựa chọn:**
  - (a) Bỏ ngay: Rust −4 621. Sửa README và ghi doc protocol thành "retired, khôi phục được từ git". Sau này khi có provider ngoài thật thì làm lại qua cửa provider.
  - (b) Giữ làm preview, không đổi gì. Chi phí: bảo trì code và test hiện có, cộng thời gian cargo test.
  - (c) Giữ code, nhưng bỏ phần test integration nặng, chỉ giữ unit test. Khoảng −800.
- **Khuyến nghị:** (a). Không có ai dùng, và đây đúng là kiểu mảnh lỏng làm layer nặng (RUL11). Giống Gemini ở T8 (quyết định 79 Q1).
- **Phạm vi:** "có (a)" cho phép xoá thư mục, các test, export trong `lib.rs`/`mod.rs`, sửa hai doc của host-invocation-routing, một dòng CHANGELOG. Không đụng `InvocationService` hay route table.

**Q4. Có cho host nhớ "đã xác minh release" bằng fingerprint không.**

- **Chuyện gì đang xảy ra:** sau L-7, mỗi lệnh legacy vẫn hash khoảng 26 MB, tức khoảng 25 đến 30 ms ở máy rảnh. Cộng lại, mỗi lệnh `fgos` tốn khoảng 25 đến 30 ms hơn mức cần.
- **Nguyên nhân:** seat speed đã đo: 902 file manifest, SHA-NI đã bật nên không còn đường nào nhanh hơn ngoài hash ít byte đi. Release nằm trong thư mục của chính user. Ai ghi được vào đó thì cũng sửa được shim và PATH. Vì vậy lớp verify chặn được hỏng file và stage dở, nhưng không chặn được kẻ đã có quyền của user. Red-team T0 từng cảnh báo về một cache lưu kết quả mà không có fingerprint.
- **Các lựa chọn:**
  - (a) Sau mỗi lần verify đủ, ghi lại fingerprint (digest manifest, rồi size, mtime, ctime, inode từng file). Mỗi lệnh sau chỉ `lstat` 902 file. Khác bất kỳ chỗ nào thì verify đủ lại và ghi lại. Ctime thì không giả được nếu không có root. Ước tính host còn ≤ 25 ms (đang 55). Rust +70, cộng một test giả mạo bị bắt.
  - (b) Không cache, chỉ dùng L-7. 0 dòng thêm.
- **Khuyến nghị:** (a). Mọi hook Agent/Task và mọi lệnh đều trả khoản phí này, và fingerprint có ctime đúng là thứ red-team T0 yêu cầu.
- **Phạm vi:** "có (a)" cho phép thêm bản ghi fingerprint cạnh activation trong release store, sửa `legacy_exec.rs`/`verify.rs` và test, ping TEST. Không đổi định dạng manifest hay activation.

**Q5. Duyệt hình dạng mục 1 và giờ land.**

- **Chuyện gì đang xảy ra:**
  - Mỗi nhóm arm có một cửa use case, và arm chỉ còn flag với in.
  - Năm việc của `main()` xuống tầng dưới: gốc, guard store, vòng đời Event Store, ghi lỗi, sinh tiến trình con.
  - Không thêm doctor row. Work không đổi gì.
  - `bin/fgos.mjs` còn khoảng 4 520 dòng, Node giảm khoảng 750, Rust giảm khoảng 90.
- **Nguyên nhân:** số liệu lấy từ baseline, bốn seat và phần em đếm lại (bảng "Disputed claims").
- **Các lựa chọn:**
  - (a) Duyệt mục 1 như đã viết. fg-server2 tự land từng phase khi gate qua, trong khung yên đã báo trên board. Máy anh và fg-server làm theo guide tiếng Việt, như T8 (quyết định 79 Q8).
  - (b) Duyệt, nhưng chờ anh đặt giờ cho từng lần land.
  - (c) Sửa mục 1 ở những điểm anh chỉ ra.
- **Khuyến nghị:** (a).
- **Phạm vi:** chỉ cho T9. Các phase `uninstall` và packaging đi theo sub-plan packaging (quyết định 80). T9 không đổi schema `~/.fgos/config.json`, nên không cần kích hoạt đồng loạt; riêng Q2 (b) cần guide cho máy dùng LAN.

## 5. Feature ideas (RUL104: not accepted, the owner picks; none counted in section 1.9)

| # | Idea | Seats | Problem and evidence | Benefit | Cost |
|---|---|---|---|---|---|
| F-1 | `fgos doctor --time` (per-row ms in the JSON) | baseline, correctness, simplicity, speed (H10, decision 76, P10) | every number in speed F-4 and P10 needed a preload wrapper | the next seat reads row costs from the door | about 10 lines in the `runDoctor` door (T9-11) |
| F-2 | Native `dispatch-decide` hook (Rust) | speed (idea list), brief | 262 ms per subagent spawn today; about 110 to 130 after T9-01 and T9-04 | about another 90 ms per Agent/Task call | a Rust port of `bind()`'s decide path; decision 76(b) says no native hook unless a CLI cannot carry it, so only with new evidence after T9-01 lands |
| F-3 | `fgos root` (print the invocation root, its marker and why) | correctness | F1 and F2 were found with `friction ping`, which is not meant for it | one command answers "which store am I on" | small verb over `resolveInvocationRoot` |
| F-4 | Gateway audit line per mutating request (caller fingerprint, verb, item) | red-team | Q2: no record of which token or identity wrote | answers "who approved this" | part of Q2 (a)/(b) if taken there; separate otherwise |
| F-5 | `Host` header allowlist on the gateway | red-team | DNS rebinding is blocked today only by the bearer check | defence in depth if cookies ever come | small middleware |
| F-6 | Delete-guard rules for `rsync --delete` and glob `mv` | red-team | both wipe a checkout and pass (T9-21) | closes two plausible accidents | +2 rules and their cases |
| F-7 | More native read routes (`list`, `show`, `slots`) | baseline | 74 of 82 selectors pay host + Node start | dashboard and gateway reads at the native floor | Work council question (Work verbs) |
| F-8 | `fgos worktree list` | baseline | the brief assumed it exists; it does not (T9-15 makes the error honest) | only if a real caller needs it | small sub-verb |
| F-9 | Doctor row `launcher-trust-record` | red-team | after the in-flight F1 fix, a machine without the record cannot tell | doctor finds the gap | +1 row; belongs to the F1 lead |

## 6. Proposed sub-plan phase split

Lanes own files, not findings. One writer at a time on each `bin/fgos.mjs` range (line numbers on `a945bc03a`; each phase rebases and re-reads its ranges). Every phase lists Create, Modify, **Delete** and **Tests to retire** and a net-size line, and every retired test names the test that now owns its behaviour (plan step 4).

### 6.1 Serial on `bin/fgos.mjs` (bottom-up, decision 77)

| Phase | Layer | Owns in `bin/fgos.mjs` | Lower files | Findings | Net Δ est. | Reviewer |
|---|---|---|---|---|---|---|
| **P00** | shell | 1-144 (imports), 999-1004, 2255-2269, 4855-5012, `main` 5152-5379 (reads only: registry fields, error leaf, `hook` first) | `src/cli/command-registry.mjs`, new `src/state/store-error.mjs`, `test/architecture.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs` | T9-04 (entry part), T9-06 (fields and readers), T9-14 | bin −180, src +45, test −10 | independent |
| **P01** | T0/T1 | 145-156, 350-369, 4380-4439, the six root lines (1047, 4027, 4169, 4248, 4264, 4445) | `src/runner/paths.mjs`, `src/util/host-bin.mjs`, `src/util/host-bin-path.mjs`, `src/runner/fanout-batch.mjs`, `src/runner/lock-status.mjs`, `test/rust-host/` conformance table | T9-02, T9-05, lock-status beacon move. **Starts after the in-flight F2 fix lands** | bin −90, src +5, test +40 | OPC (root facts over Git Inspect) |
| **P02** | T2 | 1045-1058, 3820-3913, 4440-4526, helpers 161-231 | `src/verbs/worktree/*`, `src/runner/session.mjs`, `src/runner/worktree.mjs`, `src/runner/main-checkout-reset-guard.mjs` | reset use case with the `main-checkout` policy (red-team F6), worktree ctx once, T9-15, resync branch, session projection | bin −60, src +50, test −40 | OPC (SafeRestore, Git diffs) |
| **P03** | T3 | 1005-1044, 2953-2985, 4866-4884, `main` 5187, 5291-5300, 5340-5376 | `src/event-store/maintenance.mjs`, `src/observe/` (fault logs moved in), `src/util/spawn-detached-fgos.mjs` (moved), `src/state/store.mjs` (init use case), `docs/architecture-manifest.json` | T9-07, T9-12, T9-18, init use case | bin −110, src +85, test ±0 | lead:ES (spec §16) |
| — | T4 | none | — | none | 0 | — |
| **P05** | T5 | 472-528, 979-997, 2639-2952, 3970-4021, 5013-5151 | `src/runner/execution/run-request.mjs`, `src/runner/dispatch/cli.mjs` (decide split), the verdict functions, `src/state/decision-question.mjs`, `scripts/dispatch-decide-hook.mjs`, `scripts/decision-question-hook.mjs`, `src/git/main-checkout-delete-guard.mjs` (header), one `slugOf` leaf | T9-01, T9-10, T9-16, T9-21, sub-verb lists of `dispatch`/`tool` | bin −300, src +260, scripts −170, test −150 | independent; CHANGELOG (L-8) |
| **P06** | T6 | 2270-2385 | `src/workflow/index.mjs`, `src/workflow/propose.mjs` (slug import) | frame and seats parse, resume refusals | bin −45, src +30 | independent |
| **P07** | T8 | 4022-4160, 4241-4261, 4307-4379 (per Q1), 4540-4865 only where `renderPretty` reads setup or doctor | `src/setup/*` except the files of the in-flight decision 80 Q2 lead; `src/setup/mailbox-sync-timer.mjs` (MAIL told) | setup use case, T9-11, T9-13, Q1, C9 | bin −160 (−90 with Q1 b), src +60, scripts −143 (Q1 a), test −300 | independent; CHANGELOG |
| **PKG-slot** | packaging sub-plan | 4161-4240 (`uninstall`), plus the audit F3 help and exit surface in 4540-4865 and 5320-5337 | that sub-plan's files | decision 80 Q3, H14, audit F3 | per that sub-plan | that sub-plan |
| **T9-W** | **Work, last and untouched** | 1059-2254 minus the dead arms, 2386-2638, 2986-3815, 3941-3969, 4262-4306, helpers 245-974 | — | listed only (section 6.3) | 0 | Work council after T7 |

Order: P00 → P01 → P02 → P03 → P05 → P06 → P07. The PKG slot fits between any two of them, by board line. P00 can begin at once. P01 waits only for the in-flight root-walk fix, and P02 onward follow in order.

### 6.2 In parallel (touch no `bin/fgos.mjs` range; file-disjoint)

| Phase | Files | Findings | When | Net Δ est. |
|---|---|---|---|---|
| **PR1 Rust host** | `apps/fgos/src/legacy_exec.rs`, `apps/fgos/src/main.rs` (echo only), `packages/distribution/rust/src/verify.rs`, `apps/fgos/tests`, `docs/platform/host-invocation-routing/roadmap.md` | T9-03 (L-7, Q4), T9-20, T9-22 | after the in-flight lead releases `main.rs`; TEST pinged | Rust +11 (+70 with Q4 a) |
| **PR2 Gateway and dashboard** | `packages/herdr-fgos-common/rust/src/fgos.rs`, `herdr-dashboard/src/main.rs` (and `pick.rs` with Q2 c), `apps/fgos-gateway/src/{gateway,mcp,cf_access}.rs`, `core/config-standard/gateway.yaml` (Q2) | T9-08, T9-09, T9-17, Q2 | now, apart from `fgos.rs`'s `is_confined` lines, which are coordinated with the in-flight F1 lead | Rust −70 (±5 per Q2) |
| **PR3 host-runtime** | `packages/host-runtime/rust/**`, two docs of host-invocation-routing | Q3 | after the owner answers | −4 621 with Q3 (a), 0 with (b) |
| **PK Packaging leaf** | new `src/util/refuse-symlink.mjs` + its test, `scripts/build-rust-distribution.mjs`, `src/setup/skill-wrappers.mjs` (one import; T8 render phases must have landed) | T9-19 | after T8's P01 lane is on main | −12 |

### 6.3 Work-owned ranges and files left untouched by every phase

- **Arms:** `add`, `submit`, `discover`, `plan`, `move`, `retrospective`, `cleanup`, `topic`, `doc`, `knowledge`, `doc-registry`, `compound`, `edit`, `resolve-park-reason`, `ask`, `answer`, `handoff`, `handoff-return`, `decision`, `decision-index`, `context-render`, `gate-approve`, `list`, `show`, `ready`, `graph`, `gate-check`, `stale`, `slots`, `report`, `conflicts`, `recheck-blocked`, `schedule`, `plan-lint`, `merge`, `rollup`, `docs-index`, `doc-sources`, `authoritative-match`, `take`, `pick`, `return`, `review`, `approve`, `sync-root`, `promote-to-component`, `reject`, `catchup`, `triage`, `goal`, `unclaim`.
- **Helpers:** `submitWork`, `parseDiscoverCallerVerdict`, `parsePlanCallerVerdict`, `collect*`, `parseWaitFlags`, `parseMergeClusterOptions`, `targetsOf`, `exclude*`, `assertNoPriorBlockedOutcome`, `resolveVerifyTimeoutMs`.
- **Other Work-owned code:** `src/state/*`, `src/verbs/state/*`, `src/verbs/merge/*` (apart from the one import line moved in T9-12, WORK told), and the gateway `/work*` handlers and MCP bound functions as semantics.
- **Touched only with WORK told:** the `decision` arm's one import line (L-6) and the registry `store` values of Work entries (L-4, no behaviour change).

## Unresolved questions

1. Red-team F12: does Git Inspect refuse a `.git` file whose `gitdir` does not point back? OPC answers. If not, P01 adds the check inside the root door.
2. T9-09: is the pinned Rhai bounded by default? The owning test answers it on its first run. If it is, only the module resolver and the cap remain.
3. Q2: is the unattended dashboard auto-launcher allowed to take freshly submitted items? This decides whether option (c) is needed.
4. The test-line target (about −700) needs P00's per-arm census of `test/cli` cases that duplicate a lower proof. Rust test time of the T9 crates was not measured by any seat, because a suite was running each time.
5. Hook-path and import targets are speed's estimates. The layer's re-measure (plan step 8) confirms them on the activated release.
