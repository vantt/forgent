# HARDEN T9 council, CORRECTNESS seat (Host & Surface: CLI arms, `main()`, Rust host routing, gateway)

Seat: correctness of layer T9. Repo `origin/main` at `25210a751` (baseline measured `992af5320`; `bin/fgos.mjs` is still 5 379 lines, the arms and `main()` are unchanged since). fg-server2, 2026-11-09 15:35 to 15:55 Asia/Saigon. Read-only apart from this file.

Inputs: [T9 baseline](research-261109-1529-harden-t9-baseline.md), owner decisions 77 and 78 in the HARDEN plan, RUL104, L10, design principles 1, 2, 7, 8, format of the [T8 correctness seat](council-261109-0844-harden-t8-seat-correctness.md).

## What I ran, and what I did not

Read line by line: `bin/fgos.mjs` 145-156 (`dataDir`), 4855-5379 (verb sets, `handleHook`, `main`), the `init`, `worktree`, `events`, `workflow` (start), `run` (flag fold) arms; `apps/fgos/src/main.rs` 160-479; `apps/fgos/src/legacy_exec.rs` 193-260; `src/util/host-bin.mjs`, `src/util/host-bin-path.mjs` (resolve), `src/setup/bin-discovery.mjs` (resolve), `src/cli/detached-child.mjs`, `src/cli/invocation-fault-log.mjs`, `src/event-store/maintenance.mjs`, `src/runner/paths.mjs`, `src/state/runtime-coordination.mjs` (`getMainFgosDir`), `src/runner/fanout-batch.mjs` 1-100, `src/runner/merge.mjs` 1157-1186, `scripts/dispatch-decide-hook.mjs`, `apps/fgos-gateway/src/gateway.rs` 335-370, `apps/fgos/src/wiring/mailbox_root.rs`, `packages/observe/rust/src/{friction,store_lock}.rs`.

Executed (read-only, nothing left running):

| Probe | Result |
|---|---|
| `node` script importing `COMMAND_REGISTRY`, the route table and parsing the shell's sets from `bin/fgos.mjs` | arms against registry against routes (table in "Baseline versus code"); the set differences in F5 |
| activated host `friction ping` (prints the root a native request carries) from the main checkout's `docs/`, from a scratch directory, and from the stripped linked worktree of this seat | `docs/` gives the main root; scratch gives itself; **the worktree gives `/home/vantt`** (F2) |
| `fgos list --json` and `fgos ask x` from `docs/` of the main checkout | `list` exits 0 with an **empty** store and no warning; `ask` refuses with advice "run fgos init here" (F1, F3) |
| `fgos gate-bypass` and `fgos version` through `node bin/fgos.mjs` | `gate-bypass` fails `git-addon-unavailable` (the arm is dead on the only channel that reaches it); `version` works on that channel only (F11) |

**Side effect I caused:** the `ask x` probe made the Node shell append one line to the main checkout's `.fgos/logs/invocation-faults.jsonl` (gitignored, class `store-missing`, cwd `docs/`). Nothing else was written. No `init`, no `friction record`, no test, no cargo, no `npm run`. F3 and the write half of F2 are therefore **proven by reading the code, not executed**; I say so where it matters.

## Baseline versus code (verified; corrections the council needs)

| Baseline claim | Check | Verdict |
|---|---|---|
| 74 arms, `main` at 5152-5379, line ranges | `case` count: 73 arms plus `hook` outside the switch; ranges match | agree |
| Registry 80 entries; route table 82 (8 native, 74 legacy) | registry 80, routes 82 (80 plus `--help`, `-h`); registry names equal route names | agree |
| D4: `MUTATING_ONLY_VERBS` is a subset of `requiresExistingStore` | computed: 22 of 22, and also a subset of `touchesState` | agree |
| D4: dead names `check`, `gate-bypass`, `coordination` | `check` is in no registry entry; `coordination` is in no registry entry; `gate-bypass` is a registry entry whose arm is unreachable through the host | agree; the set also lists `evolve` only in a comment, and misses that `lock` has a predicate (`fence`) that duplicates `requiresExistingStore: true` |
| D5: Node `dataDir` is strict cwd, Rust walks to the nearest `.fgos` | both read; the effect is worse than "two policies" (F1, F2) | agree, **understated** |
| C6: lower layers spawn `node bin/fgos.mjs` through `detached-child.mjs`; C7 `fanout-batch` falls back to the file | read; and `fanout-batch` ignores the root it is given (F6) | agree, C7 understated |
| D3: agy hook logic duplicates the Claude scripts | the two copies **disagree on a config refusal** (F4) | agree, the baseline lists it as a duplicate only |
| H13: `legacy_exec.rs:145-150` re-hashes every file per call | lines 145, 147, 150 call `recompute_artifact_digest`, `verify_release_files`, `verify_legacy_node` | agree |
| Arm class counts (heuristic) | not re-derived | not checked |
| Timings | not re-measured (machine load) | not checked |

New facts the baseline does not carry: F1 to F4, F6, F7 and the sets' effect in F5.

## Part A, target shape (RUL104: better, not bigger; decisions 77 and 78)

Rule for every row: the shell parses flags, builds nothing but the arguments of one call, and prints. Every refusal, default, composition and exit mapping the arm holds today goes to the door named. No new layer, no new process: each door below is an existing module or an existing use-case directory (`src/verbs/<domain>/<verb>.mjs`, signature `<verb>UseCase(ctx, options)`, tsk-49i). Net Node change: negative.

### A1. The shell's own jobs (what `main()` keeps and what leaves it)

| Job today in `main()` | Target owner (one door) | Shape | Delete |
|---|---|---|---|
| Parse, `--help`, unknown-flag refusal, envelope, print | shell (keep) | unchanged | nothing |
| Root: `dataDir` (strict cwd) plus 6 repeated `flags.dir !== undefined ? ... : resolveMainCheckoutRoot(cwd) ?? cwd` lines plus the Rust walk | **T1/T2** `src/runner/paths.mjs`: `resolveInvocationRoot({ cwd, dir })`; the Rust host resolves it once with the same rule and pins it for the payload exactly as it pins the state root (`PINNED_ROOT_ENV` in `legacy_exec.rs:132-136`) | one rule: explicit `--dir`, else the nearest ancestor `.fgos` that is a project store (not the global `~/.fgos`), bounded by the Git top level; a stripped linked worktree has none, and says so (ADR0020) | `dataDir`, the 6 repeated lines, `resolve_target_root`'s walk |
| Store guards: missing store, disconnected snapshot, `init` in a worktree, store-missing warning (5198-5290; the refusals at 5222, 5250, 5263, 5279) | **T2** `src/runner/store-guard.mjs` (beside `isMainWorktree`): `admitStoreAccess({ access, dir, cwd, explicitDir })` returning `{ ok }` or a tagged refusal | `access` is a field of the verb's registry entry: `none`, `read` (warn when no store), `write` (refuse when no store, refuse a disconnected snapshot); a verb with a mixed shape gives a function `(positional, flags) => 'read' \| 'write'` in its entry, so the predicate sits next to the verb | `STORE_MISSING_WARNING_VERBS`, `MUTATING_ONLY_VERBS`, `MUTATING_SUBCOMMAND_PREDICATES`, `isMutatingInvocation`, the 60-line comment block (its content becomes the field's doc), `requiresExistingStore`/`touchesState` stay only if another reader needs them |
| Fault classes: the mutable `faultClass` marker assigned between statements | the same guard door: each refusal throws a tagged error (`error.faultClass`); the shell's catch reads the tag | no statement-order coupling; the unknown-verb special case disappears | the `faultClass = ...` chain (6 assignments) |
| Invocation-fault record (`recordInvocationFault`) | **T3** `src/observe/invocation-fault-log.mjs` (moved from `src/cli`, baseline C5) | its other caller `friction-client.mjs` stops importing the CLI; the third root policy (the Git main-root fallback in `resolveFaultLogPath`) reads the same `resolveInvocationRoot` | `src/cli/invocation-fault-log.mjs` |
| Event Store start and end triggers, seal hand-off, Land release (5187, 5291-5300, 5361-5376; `landsWork`, `handSealsToChild`, `opensEventStore`) | **T3** `src/event-store/lifecycle.mjs`: `beginInvocation(facts)` / `endInvocation(facts)` over `maintainEventStore`; `session`, `gateway-control`, `loop` call the same pair with `{ shutdown: true }` | `facts` carry `{ trustedMain, dispatched, opensStore, landed }`. `opensStore` comes from the registry's `access`; `landed` is a registry field (`landsWork: true`, with a `(positional) => boolean` for `merge next`) so the knowledge of "which verb leaves a Land candidate" sits with the verb, and the end door calls the release function the shell passes in (T3 does not import Work or `runner/merge`) | `landsWork`, `handSealsToChild`, `opensEventStore`, `EVENT_STORE_LIFECYCLE_VERBS`, three of the four copies of the policy (D9) |
| Exit-code map: four `if` branches keyed on verb names (5320-5337) | each use case returns `{ data, exitCode? }`, or the registry entry gives `exitOf(data)`; the shell reads it | `doctor --strict`, `plan-lint`, `workflow propose`, `run`, foreground workflow and gate settle state their own code | the `isExecutionRun` / `isForegroundWorkflow` / `isGateSettle` / `doctorFailed` block |
| `handleHook` | **T5** `src/runner/dispatch/hook-guard.mjs`: `decideHook({ kind, format, payload })` (pure, one fail-open rule) used by `scripts/dispatch-decide-hook.mjs`, the agy branch and `fgos hook`; the decision-question check calls `src/state/decision-question.mjs` the same way | the agy branch and the second `node` process (5138) go | 110 lines in `handleHook`, the duplicated config-refusal rule |

### A2. Arm groups, bottom-up (decision 77 order; Work last, no change planned to Work arms)

| Layer | Arms | Door it calls (exists / to make) | Logic that moves in; what the arm keeps |
|---|---|---|---|
| T0/T1 | `lock`, `lock-status` | `src/runner/lock-fence.mjs` (exists), `src/runner/lock-status.mjs` `collectLockStatus` (exists) | beacon age/active arithmetic (4405-4415) into `collectLockStatus`; the TTY confirm (`confirmFence`) stays in the shell. Flags only |
| T1 | root resolution (not an arm) | `resolveInvocationRoot` (A1) | the 6 repeated root lines; `init`, `setup`, `uninstall`, `doctor`, `unclaim`, `resync-worktree` call it |
| T2 | `git`, `worktree`, `session`, `resync-worktree`, `main-checkout-reset` | `src/verbs/worktree/{create,remove}` (exist), `runner/session.mjs` (exists), `runner/worktree.mjs` `resyncWorktree` (exists), `runner/main-checkout-reset-guard.mjs` (exists; add `mainCheckoutResetUseCase`) | one ctx builder for `worktree` (built twice today, 3824, 3836); `usage` and unknown sub-verb as `StoreError('validation')` (F10); lost-commit listing and SafeRestore call into the reset use case; the branch-from-`gitWorktrees` derivation into `resyncWorktree`; `session` entry projection into `session.mjs`. Arms: flags and print |
| T3 | `init`, `events`, `rebuild` | `src/verbs/events/*` (exist); `src/state/init-store.mjs` (to make): `initStoreUseCase(ctx)` | mint machine id, lock dirs, `initStore`, coexistence manifest, Git recovery composed once, with the `init` guard in the store-guard door (F3). `events`/`rebuild` arms are already thin |
| T4 | none | `dispatch recover/watch` use cases exist | no arm; nothing to do (agree with baseline) |
| T5 | `run`, `dispatch`, `agents`, `tool`, hook | `src/runner/execution/run-request.mjs` (exists): add `buildRunRequest(flags)`; `src/runner/dispatch/cli.mjs` (exists) | override fold (`effort`, `timeout`, `account`) shared with `workflow` (D1; I found no behaviour difference, bind re-checks effort, so this is duplication only); prompt slug (D2); provider validation, persona resolve, confined-write refusal, case-admission wiring; `dispatch decide` and `probe-account` parsed once. Arm: flags, one call, print |
| T6 | `workflow` | `src/workflow/index.mjs` (exists) | `--frame` key=value parse, `--seats` split, resume refusals for `--timeout`/`--account` (mirror of `run`'s, same door as T5). Arm: flags |
| T8 | `setup`, `uninstall`, `doctor`, `preflight` | `src/setup/*`: `runSetupUseCase`, `runDoctor({ checks, fix, strict })` beside `createDoctorRun`, `uninstallUseCase` | nine setup steps; the doctor loop (4252-4258) and its strict exit; `uninstall`'s npm channel goes with H14; `preflight` leaves the product CLI (position on U4) |
| T9 own | `gateway`, gateway REST/MCP, dashboard | `herdr-fgos-common::fgos` (one builder), `gateway-control.mjs` | one "workspace shim or refuse" builder; no `node bin/fgos.mjs` branch (F8) |
| Work | 41 arms plus 10 Knowledge arms | (Work phase after T7) | **No change planned (decision 78).** Listed in Part B only where a shell mechanism that serves them is wrong (F5) |

## Part B, findings (ranked)

Counts: High 2, Medium 7, Low 4. Fix size in lines of production code, net.

### High

**F1. High. One invocation, four root policies; from a subdirectory the Node shell silently reads an empty store.**
Evidence: `bin/fgos.mjs:145-156` (`dataDir` is `resolveFgosDir(cwd, { strict: true })`, never git-resolved); `apps/fgos/src/main.rs:160-181` (`resolve_target_root` walks up to the nearest `.fgos`); `src/state/runtime-coordination.mjs:23-37` (`getMainFgosDir` resolves the Git main root); `src/cli/invocation-fault-log.mjs` (`resolveFaultLogPath` falls back to the Git main root); six arms repeat `resolveMainCheckoutRoot(cwd) ?? cwd` (1047, 4027, 4169, 4248, 4264, 4445). Executed from `docs/` of the main checkout: `fgos friction ping` reports root `/home/vantt/projects/forgent`; `fgos list --json` exits 0 with `work: {}` and prints no warning; `fgos ask x` refuses naming `docs/.fgos`, and the fault line lands in the main root's log.
Scenario: an agent whose cwd is `docs/` or `src/` runs `fgos list` or `fgos ready`, sees no work, and concludes the backlog is empty. The warning meant for this case (`bin/fgos.mjs:5279`) is gated on `!isMainWorktree(cwd)`, and `isMainWorktree` (`src/runner/worktree.mjs:503-506`) compares the Git **top level** with the main root, so a subdirectory of the main checkout counts as "main" and the warning never fires. A write from the same directory is refused, and `native` verbs in the same directory work, so two verbs of one session disagree about where the project is.
Fix: one `resolveInvocationRoot` (Part A1); the host pins it, the shell reads it. About 50 lines net negative (`dataDir`, six repeated lines, the Rust walk body become one call each). Position on U2: do this. Owner-decision flag: tsk-49i recorded "each verb computes repoRoot by its own policy" as intended for **use cases** (ctx built by the adapter). That stays true: the adapter builds ctx once, from the one root. It is not a license for the adapter to differ from the host.

**F2. High. The Rust host walks into `$HOME` and treats the global `~/.fgos` as the project store.**
Evidence: `main.rs:171-180` accepts any ancestor with a `.fgos` directory; `/home/vantt/.fgos` is the global directory (it holds `config.yaml`, `private/`, `runtime/`). Executed: the activated host run from this seat's stripped linked worktree (no `.fgos` on disk, ancestors `forgent-worktrees`, `projects` have none) reports `friction ping` root `/home/vantt`. A scratch directory under `/tmp` reports itself. By reading: `friction::record` takes `acquire_store_lock(root)` which calls `create_dir_all` on the observe directory (`store_lock.rs:53-57`), and `config` and `convention path` take the same root.
Scenario: a worker, a script or a pane that reaches the host binary directly (`FGOS_HOST_BIN`, a dispatched worker, `invokeHost` without `--dir`) from a worktree records friction into `~/.fgos/observe/` or reads config as if `$HOME` were a project. The `~/.local/bin/fgos` shim hides it only because it refuses to start without a `.fgos/installation` above (it printed that refusal here). The shim looks for `.fgos/installation`, the host for `.fgos`: two different markers for "the project".
Fix: the same door as F1 (skip the global directory; require the same marker the shim requires). If F1 slips, a 6-line stopgap in `resolve_target_root` (skip a `.fgos` equal to the machine's global directory) removes the HOME case alone.

### Medium

**F3. Medium. `fgos init` is refused in a linked worktree but allowed in a subdirectory, and the missing-store message tells the user to run it there.**
Evidence: the guard `verb === 'init' && !isMainWorktree(cwd)` (`bin/fgos.mjs:5263`) uses the same top-level comparison as F1, so a subdirectory of the main checkout passes; the `init` arm then runs `initStore(dir)` with `dir` = strict cwd (`:1010-1011`), and the refusal text of `requiresExistingStore` says `run "fgos init" here first` (`:5223`). Not executed (it would create a phantom store in the main checkout); read from code.
Scenario: the exact phantom-store hazard ADR0020 closes. An agent in `docs/` follows the refusal text and creates `docs/.fgos`; from then on the Rust walk (F1) and the Node shell both take `docs/.fgos` as the project store for that directory, a second, empty Work store beside the real one.
Fix: the root door (F1) makes `init` run only at a Git top level that has no store, and the message names the root it resolved. About 6 lines, inside the F1 change.

**F4. Medium. The same guard decides differently by agent format.**
Evidence: `bin/fgos.mjs:5057-5091` (agy branch) wraps `decideExecutorCli` in `catch { /* fail-open */ }`, so any throw allows. `scripts/dispatch-decide-hook.mjs` (Claude format) treats a config refusal (`isConfigRefusal`, or `RunnerConfigError` with `code` starting `config-`) as **blocking**: stderr names the fix and exit 2. The agy branch also never checks the tool name, the Claude script allows only `Agent` and `Task`.
Scenario: `~/.fgos/config.yaml` is unusable. Claude Code is told "run `fgos config check`"; an agy session silently dispatches every subagent call in-process, past the routing guard, on a config that cannot be read. Same input, two outcomes, depending on which agent wrote the payload.
Fix: `decideHook` (Part A1); one rule, the script's. About 90 lines out of `bin/fgos.mjs`, 15 in. Proof: one test of `decideHook` over both payload shapes (the agy and Claude hook tests become wiring proofs).

**F5. Medium. The "which verbs open the store" classification is three hand lists and a predicate table that no longer match the registry.**
Evidence (computed with the registry loaded): `STORE_MISSING_WARNING_VERBS` names `check`, which no verb has, and `gate-bypass`, whose arm cannot run through the host; the predicate table names `coordination`, which is not a registry entry. Four Work read verbs reach the Work store through `dir` and sit in none of the sets: `gate-check` (2386-2403), `slots` (2426: `listWork(dir)`), `context-render` (2058), `doc-registry` (1736); from a stripped worktree they return an empty view with no warning and no refusal. `run`, `workflow` and `dispatch recover` have `touchesState: true` and are classified nowhere in the 60-line comment (it says 44 verbs were sorted; the registry has 48 today). `lock` appears twice (a predicate for `fence` and `requiresExistingStore: true`).
Scenario: the next verb added to the registry follows the registry's rules, not the sets, and is silently outside the guard; the four read verbs above already are.
Fix: `access` as a registry field with the guard door (Part A1); a registry self-test that every state-touching entry states its access (one proof replaces the comment). The four Work verbs are Work arms: the field is added to their entries, their arms are not touched. About 120 lines out of `bin/fgos.mjs`, 35 in the registry.

**F6. Medium. `fanout-batch` resolves the CLI from the wrong checkout, and from a release it runs the Node payload, not the host.**
Evidence: `src/runner/fanout-batch.mjs:19-20` defines `resolveBinFgos()` with no parameter and calls `resolveFgosBin(REPO_ROOT)` (the directory of the running payload); the call site passes `root` (`:89`), which is dropped. In a release the payload root has no `.fgos/installation`, so tier 0 misses and tier 1 (`bin-discovery.mjs:36`, `<cwd>/bin/fgos.mjs`) hits the payload's own file, which runs through `process.execPath` (`:92`).
Scenario: `fgos-fanout` in a project other than the fgOS checkout resolves the host of the fgOS checkout (or, from a release, the payload file) for `pick`, `run` and `return`. `pick` and `return` are among the verbs AGENTS.md calls unsupported on that channel, and they work today only because the host's `FGOS_HOST_BIN` is inherited.
Fix: pass `root` and use `resolveActiveHostBin({ cwd: root })`; delete the file fallback and the `.mjs` branch (`:90-94`). About 8 lines, negative.

**F7. Medium. A test fallback in production host resolution picks a different checkout's host.**
Evidence: `src/util/host-bin.mjs:48-70` loops `[process.cwd(), PACKAGE_ROOT]` and returns the host of whichever checkout it finds when the project's own has none; its comment says "If dir was a temporary directory (e.g. in tests)". Three resolvers exist (`host-bin.mjs:22`, `host-bin-path.mjs:69`, `bin-discovery.mjs:143`).
Scenario: a project whose installation is missing or broken gets its friction, metrics or convention call served by the host of another checkout (a different release); the caller sees a valid envelope and no sign of the mismatch. It is the "test-only branch in production" AGENTS.md forbids.
Fix: one resolver (`resolveActiveHostBin`, already in `host-bin-path.mjs`); tests set `FGOS_HOST_BIN`, which both honor first. About 30 lines negative. (H17.)

**F8. Medium. Gateway: every spawned verb carries `--dir`, which switches the disconnected-snapshot guard off, and the non-onboarded path runs a file that does not exist.**
Evidence: `gateway.rs:345-363` appends `--dir <root>` in both branches; the guard runs only when `flags.dir === undefined` (`bin/fgos.mjs:5250`). The `node <root>/bin/fgos.mjs` branch exists in every project except fgOS's own checkout, where it is the unsupported channel; the doc comment still cites `bin/fgos.mjs:4559,1497` (stale lines). The same builder is copied in `herdr-dashboard/src/main.rs:210-230` and `herdr-fgos-common/rust/src/fgos.rs:395-411`.
Scenario: a gateway pointed at a root whose installation is missing spawns `node <root>/bin/fgos.mjs`, which fails with `ENOENT` and returns a generic 500 instead of "not onboarded". A gateway rooted in a stripped worktree is never refused, because `--dir` is explicit. The REST/MCP argv duplication (D7) I did not re-read.
Fix: one builder in `herdr-fgos-common`, shim or a named refusal; the gateway passes `--dir` as it does (the explicit root is the safe contract), but the root it passes is the one `resolveInvocationRoot` accepts. About 60 lines negative across three files.

**F9. Medium. The Event Store lifecycle is split across five doors with different rules, and the Land release is keyed on verb names.**
Evidence: `main()` runs start (dispatched only) and end triggers (5299, 5366); `loop.mjs:1790`, `session.mjs:417`, `gateway-control.mjs:359` each call `maintainEventStore` with their own options. The start trigger's `{ error }` is discarded (5299), the end trigger's is recorded (5368-5371). `landsWork` (4866-4868) lists `approve`, `sync-root`, `promote-to-component`, `merge next`; the real owner is `landRunnerItem` (`src/runner/merge.mjs:870`, callers `approve.mjs:536,701`, `sync-root.mjs:132`, `promote-engine.mjs:73`), so the list equals today's callers and nothing keeps it so.
Scenario: a new verb that lands (or `merge` gaining a sub-verb) leaves a retained Land candidate that nothing releases until another landing verb runs; a failure of the start trigger leaves no trace, while the same failure at the end leaves one.
Fix: lifecycle door and `landsWork` registry field (Part A1). About 70 lines out of `bin/fgos.mjs`, 40 in `src/event-store`. ES reviewer applies (spec section 16).

### Low

**F10. Low. `worktree` throws plain `Error` for usage mistakes: exit 1, no fault record.** `bin/fgos.mjs:3823, 3835, 3846` are the only three `throw new Error` in the whole switch (awk over 999-4539). `categoryOf` maps them to `unexpected`, exit 1, while every other usage refusal is `validation`, exit 4; `faultClass` is already `null` there, so nothing is recorded. `fgos worktree list` (a natural guess) therefore exits 1 as if the CLI had crashed. Fix: `StoreError('validation', ...)`, 3 lines.

**F11. Low. Dead Node arms and Node-channel stubs of Rust-native verbs.** `case 'version'` (1001) and `case 'gate-bypass'` (2255) are served natively; through `node bin/fgos.mjs` `gate-bypass` stops at `git-addon-unavailable` (executed), `version` works. `handleHook` answers `mailbox` with `exit 0` but does not know `mailbox-sync` (`ALLOWED_HOOK_KINDS`, 5012), which the host serves natively, so the two channels disagree on a kind the setup writes into timers (`mailbox-sync-timer.mjs:56`). Fix: delete the two arms and the stub; −25 lines. Baseline D10, confirmed.

**F12. Low. `preflight` is outside every store guard and runs `npm run build:skills` wherever it is called.** `bin/fgos.mjs:4320` spawns it (the arm starts at 4307); the guard comment group 5 exempts `preflight` because it resolves its own root. In a linked worktree it therefore triggers the T8 finding that the skill build writes the skip-worktree `.fgos/instructions/effective/repo.json` and strands the worktree. Fix: retire from the CLI (U4), or refuse in a linked worktree; −75 lines if retired.

**F13. Low. A detached child bypasses the host.** `spawnDetachedCli` runs `node <payload>/bin/fgos.mjs` with the caller's environment (`detached-child.mjs:24`), so it skips the host's digest and payload verification and relies on the inherited `FGOS_HOST_BIN` for the writer identity; if the variable is missing (a scrubbed environment) the seal child dies silently by design (`bin/fgos.mjs:4871-4873`). The publish child leaves a fault record (`isEventStoreChild`), the seal child's failure is covered only by the doctor pointer. Not a defect today; a release-layout test should prove the entry sits inside `components.legacyNode.root` (`detached-child.mjs:10`).

## Feature ideas (separate list; owner chooses; RUL104)

| Idea | Problem and evidence | Benefit |
|---|---|---|
| `fgos root` (read verb: prints the invocation root, its marker, and why) | F1 and F2 were found by running `friction ping`, which is not meant for it | one command to ask "which store am I on"; the refusal text for F1 can print it |
| Registry self-test "every state-touching entry states its access" | F5: the 60-line comment was the only enforcement | mechanical guard; replaces prose |
| Warn on stderr when a read verb's store is empty because the cwd is a subdirectory | F1 | only if the owner does not take the root door |
| `fgos doctor --time` (baseline, H10) | per-row cost | lands in the T8 run-all door |

## Positions on the baseline's five open questions

- **U1 (owner of Knowledge/doc/decision arms):** keep them with Work for T9; no change before T7 (decision 78). The two pure generators (`decision-index`, `docs-index`) could move earlier but gain nothing from it: they read Work stores.
- **U2 (per-verb root policy or one door):** one door, built once by the adapter and pinned by the host (F1, F2, F3). The per-verb policy tsk-49i recorded applies to use cases, which already take `ctx`; it does not cover the adapter and the host disagreeing. Size depends on this answer: with it, T9-01 is the largest correctness item of the layer.
- **U3 (background jobs):** keep the shell as the detached entry; do not add a per-layer entry file (RUL104, no new files). Calling the host from a child does not work as is: the child inherits `FGOS_RUST_HOST_RECURSION_GUARD=1` (`legacy_exec.rs:126`) and the host refuses it. Add one release-layout proof (F13) and let the lifecycle door (F9) own the spawn spec.
- **U4 (`preflight`):** retire it from the product CLI; it works only inside the fgOS checkout (mission 3), writes through `build:skills` and is unguarded in worktrees (F12). Keep the scripts it calls.
- **U5 (gateway and dashboard scope):** in T9 for the command builder, the refusal, `--dir` and argv duplication (F8, D6, D7, H24) only. Work-facing REST shape belongs to the Work council (C10).

## Order and size (for the arbitration; not a plan)

F1+F2+F3 form one change (T9-01) and should come first because F5, F9 and the guards read its output. F4 rides T9-05, F6/F7 ride T9-01 (host resolver), F8 rides T9-08, F9 is T9-03, F10/F11 ride T9-00, F12 rides T9-07. Net production change from this seat: about 450 lines out of `bin/fgos.mjs`, 60 into registry and `src/event-store`, about 250 out of Rust and host-resolution code; the pieces above are each one owning proof at the lowest layer (resolver, guard door, lifecycle door, `decideHook`).

Status: DONE
