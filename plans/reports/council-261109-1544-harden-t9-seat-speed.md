# HARDEN T9 council, SPEED seat: Host & Surface

Seat lens: wall time a project using fgOS pays on every call (Ship Faster, owner priority 1), measured. Main `25210a751` (`origin/main`), activated release `cbae6142…` (the one the baseline used), machine fg-server2, 2026-11-09 15:44 to 16:40 (Asia/Saigon). Read-only seat: only this file is committed.

Board first: the latest COOK line (11:10) is the release of the HOLD suite, so measuring was allowed. The machine was **not quiet**: load average (1 minute, 24 cores) was 3 to 4 for a short window (about 15:50, other lanes between suites), 10 to 17 for the doctor and main() runs, 20 to 38 elsewhere; a full `run-tests.mjs` of another lane (harden-t8-p03, 32 minutes old) was running all the time. Every number below carries its load. Where I could get a quiet window I took it for the host and import numbers, because those are the ones the baseline quoted at load 25 to 34.

Citations used (glossed): RUL104 (rule "better, not bigger"); owner decisions 77 and 78 (T9 moves arm logic down into each layer's use case, bottom-up, Work arms last); design principle 8 (one owning proof per behaviour); H13 (hand-off item: the host re-hashes the release on every call).

## What I ran and read

- Read: the T9 baseline whole, decisions 77 and 78, the T8 speed seat (format), `apps/fgos/src/legacy_exec.rs`, `packages/distribution/rust/src/verify.rs`, `bin/fgos.mjs` (`main`, `handleHook`, the verb property sets), `src/cli/detached-child.mjs`, `src/event-store/{maintenance,seal-coalescing}.mjs`, `src/setup/agent-hooks.mjs` (shim probe), the doctor run loop, `scripts/{dispatch-decide,main-checkout-delete-guard}-hook.mjs`, the `PreToolUse`/`PostToolUse` hooks in `.claude/settings.json`.
- Measured with: a small harness (scratchpad, Python `subprocess` plus `wait4` CPU time, 15 to 31 runs per row, median and minimum), `strace -f --seccomp-bpf -e trace=execve -ttt` for the host phases, an ESM load hook that logs every module a verb loads, a static import-closure script over `bin/fgos.mjs` and its modules (it reproduces the measured 207), generated import sets timed against the node floor, `sha256` of the real release files, and an in-process loop over every `DOCTOR_CHECKS` row (three runs, one with a `child_process` wrapper that counts spawns per row).
- Not measured: **Rust test time of `apps/fgos` and `apps/fgos-gateway`** (a full suite was running, as the brief requires; no cargo target was created, nothing to delete). Also not measured: gateway and dashboard latency, `workflow status` minimal import set (the arm loads 272 modules, I could not separate needed from unneeded without refactoring), how many Bash tool calls match the delete-guard shell pre-filter, and any quiet-load doctor number (the lowest was load 17).
- Method limits: `perf` is refused here (`perf_event_paranoid` 4). `strace` on the host makes the Rust host refuse several store verbs (exit 4 in 3 ms), so spawn counts for those were taken on the payload directly, in a throwaway project under the scratchpad. The temporary project, the import-set files and the traces live in the session scratchpad; nothing was written to the repository or to `.fgos`.
- **Corrections to the baseline.** (1) "Host overhead about 140 ms" is a load figure: quiet it is **55 ms** (table below). (2) The "207 modules, 85 ms" import is right (207 reproduced; 89 ms CPU at load 4.3), but "60 to 80 ms of it is unused" holds only for verbs that need no store; the realistic saving per verb is in F-2. (3) The baseline sketched hook cost as "a second Node process"; measured, that second process is only 64 ms of a 262 ms Agent/Task hook; the larger part is host verify plus the full CLI import in the parent.

## What a call costs, quiet window (load 3.1 to 4.3, 21 to 25 runs, median wall; CPU in the same run)

| Command | Wall ms | CPU ms | Note |
|---|---|---|---|
| `node -e ''` (floor) | 17 | 17 | |
| `fgos version` (Rust native, via launcher and workspace shim) | 21 | 23 | launcher plus shim add nothing measurable (host alone 21, 22) |
| `fgos hook mailbox ...` (native, runs after **every** tool call) | 18 | 18 | load 3.1 |
| `host --help` (legacy route) | 133 | 147 | |
| same payload run by node directly, `FGOS_HOST_BIN` set | 78 | 94 | **host cost on a legacy route: 55 ms wall** |
| `fgos --help` (launcher, shim, host, node) | 134 | 148 | |
| `fgos dispatch decide --for judge` | 213 | 246 | payload direct 158 |
| `fgos workflow status <id>` | 202 | 230 | payload direct 149 |
| `fgos hook dispatch-decide` (Agent/Task tool call, PreToolUse) | **262** | 301 | load 3.1; payload direct 207; the second Node it spawns (`dispatch-decide-hook.mjs` alone) 64 |
| `fgos hook main-checkout-delete-guard` (Bash call whose text matches the shell pre-filter) | **148** | 165 | the script alone 25 ms |
| `fgos lock-status` | 349 | 369 | T0/T1 arm, see "Outside T9" |

Under load 25 to 34 the baseline's numbers (319 ms `--help`) are the same rows 2.3 times slower; ratios hold.

## Host overhead of 55 ms: where it goes

Measured, `strace -f -e execve -ttt`, 6 runs, load 38: host process start to `execve(node)` is 76 to 92 ms (the same phase is 21 ms for a native verb at load 4, so about 35 to 45 ms quiet is the legacy-only work).

| Step | Cost | Evidence |
|---|---|---|
| Launcher walk and workspace shim (`sh`, parses `activation.json`) | under 1 ms (21 vs 21 ms for `version`, load 4) | not a finding |
| Host exec of a 20 MB binary, route lookup | about 20 ms (floor of any native verb) | `fgos version` 21 ms |
| `recompute_artifact_digest` | under 1 ms | canonical JSON of one small file |
| `verify_release_files`: read and SHA-256 **every file of the manifest** | the bulk of the 35 to 45 ms | below |
| `verify_native_addon` (inside `verify_legacy_node`): reads and hashes the 16.5 MB addon **a second time** | 12 to 15 ms (load 37) | `verify.rs:127,229` |
| `verify_legacy_node`: hashes the 310 KB payload entry again | 0.3 ms | |
| Spawn `node` (PATH search: 6 failed `execve` before the hit; plus state-root resolve) | under 1 ms for the search; node start itself is the 17 ms floor | strace |

Bytes hashed per legacy call: **62.5 MB** = 902 manifest files 45.7 MB (the host binary itself 20.2 MB, the addon 16.5 MB, everything else 9.0 MB) + the addon again 16.5 MB + the payload entry 0.3 MB. Hashing exactly these files with the same SHA-NI path: 46 to 55 ms for the manifest files plus 12 to 15 ms for the addon again (load 37); without the host binary 28 to 30 ms; without host binary and addon 10 to 18 ms. **70 percent of the bytes hashed are the running host binary and a duplicate addon read.** The SHA-NI flag is present (`sha_ni`), so this is already the fast path; the only lever is fewer bytes or no re-hash.

## Part A: target shapes (speed view)

Rust: the host stays the door; one speed change inside it (verify memo, F-1). No arm needs to move to Rust for speed, with one exception to weigh later: the hook guards (idea list).

| Component | Authority and speed shape (target) | Budget (quiet load, 24 cores) | Size effect |
|---|---|---|---|
| **Host verify** (`legacy_exec.rs:145-150`, `verify.rs`) | Verify once per activation, then per call confirm that nothing changed since: one `lstat` per manifest file compared to a recorded fingerprint (size, mtime, ctime, inode) plus the manifest digest, recorded after a full verify. A fingerprint miss falls back to the full verify and rewrites the record. The host binary is never hashed by itself, the addon at most once | verify at or under 5 ms (35 to 45 ms today); legacy verb host cost at or under 25 ms (55 today) | about +70 Rust lines, one new proof (tamper detected) |
| **CLI entry** (`bin/fgos.mjs`) | An entry of roughly 60 lines whose static imports are only the flag parser, the command registry, the envelope and the exit-code leaf (about 7 modules). `hook` is decided first, before anything else loads. Everything else is `await import()` of **one arm module per verb**, named by a new registry field. The cross-cutting pipeline (store guards, Event Store triggers, seal hand-off, fault record) is one module loaded only for verbs the registry marks as opening the store | floor import at or under 30 ms of CPU above node (73 today); entry import at or under 10 | the same lines, regrouped; decision 77 already moves each arm's logic into its layer's use case, so each arm module is a few lines and imports only its use case |
| **Arm module boundary** | One file per arm under `src/cli/arms/<verb>.mjs`, exporting `run(ctx)`; owner layer is the folder of the use case it calls. A guard in `test/architecture.test.mjs` forbids a static import of an arm from the entry (one proof of "the entry stays light") | per verb: modules loaded = the verb's use case closure and no more | Δ about 0 net lines (moves), tests unchanged |
| **Error leaf** | `StoreError`, `EXIT_CODES`, `categoryOf`, `exitCodeForOutcome` in a leaf with no imports; today they live in `src/state/store.mjs` (61-module closure), so `main()` alone pulls the store | the entry's floor 7 modules instead of 68 | about 60 lines moved |
| **Hook path** | `fgos hook <kind>` imports the guard module and runs it in the same Node process; no `spawnSync` of a second Node, no agy branch copied into the entry | dispatch-decide at or under 130 ms (262), delete-guard at or under 65 ms (148); both estimated from the parts above, not measured after a change | about -60 lines (the agy copy, the spawn) |
| **Dispatch decide door** (T5, `src/runner/dispatch/cli.mjs`) | `decide` and `probe-account` in a module that does not import the assignment runner, the run-supervisor client or plan compile | `dispatch decide` import about half of today (cli.mjs 154 ms CPU vs 79 for config plus mechanism, load 29) | one module split in T5 |
| **Event Store lifecycle** (D9) | One lifecycle door in `src/event-store` used by the entry, the loop, the session and the gateway; the background child gets its own tiny entry (position on U3, F-5) | end trigger at or under 25 ms first call (14 to 24 today) | already in baseline phase T9-03 |
| **Doctor surface** | One shim probe per shim per run (`run.once`); the three `claude` CLI calls run in parallel; rows get a per-row `ms` in the JSON (idea list) | T9-owned rows at or under 0.5 s (3.4 s at load 17 today) | -20 lines in `agent-hooks.mjs` |
| **Gateway, dashboard** | No speed finding: not measured, no hot path found by reading | n/a | 0 |

Net for the layer from the speed fixes: about +70 Rust lines (verify memo), about -60 Node lines (hook), the rest are moves that decision 77 already requires.

## Part B: findings, ranked

Severity bar (as in T8): High = a measured cost paid on every use of a route, with a small local fix; Medium = measured and bounded, or High whose fix needs a policy choice; Low = measured and small; Not a finding = measured and too small to act on.

**F-1 (High, measured): the host re-hashes 62.5 MB on every legacy call; 70 percent of it is its own binary and a duplicate addon read.**
Scenario: every one of the 74 `legacy-cli` selectors and every hook that is not `mailbox`. Cost: 55 ms wall of host overhead on a 133 ms `--help` (41 percent), 25 percent of `dispatch decide` (213 ms), 21 percent of an Agent/Task hook (262 ms), all at load 3 to 4; hashing the same bytes took 46 to 55 ms plus 12 to 15 ms at load 37.
Fix, two sizes, owner picks: (a) stop hashing `bin/fgos` (the running binary) and read the addon once: 62.5 MB becomes about 26 MB, about -25 to -30 ms, about 15 Rust lines; (b) record a fingerprint after a full verify (manifest digest, then per file size, mtime, ctime, inode) and on each call only `lstat` the 902 files: remaining cost about 3 ms, saving about 35 to 40 ms (estimate from the hash time and the 21 ms native floor, not measured after a change), about 70 Rust lines and one tamper-detection test.
Threat model for (b): the files sit in a user-owned release directory (`~/.local/state/fgos/releases/<digest>`). Someone who can write there can also edit the shim and the `PATH`, so the verify protects against corruption, partial staging and accidental edits, not an adversary with the user's rights. A forged mtime is possible with write access, a forged ctime is not without root, which is why ctime is in the fingerprint. The T0 red-team concern about an unauthenticated cache (baseline H13) is real only for a cache that stores a verdict without a fingerprint; this one stores the fingerprint and falls back to full verify on any difference. **Position: do (b); (a) is the fallback if the owner will not accept a cache.** Whoever lands it owes TEST (`forgent-f8`) a ping (H3).

**F-2 (High, measured): every legacy call imports 207 modules; most verbs need 60 to 140 of them, and the floor of `main()` alone is 117.**
Measured (load 4.3, 21 runs, same-shape import sets of the real modules): full 207 modules **89 ms CPU / 74 ms wall**; the 117 modules `main()` itself reaches (through `StoreError`, `currentDispatchDepth`, `releaseRecordedLand`, `isSessionWorktree`, `isMainWorktree`, `paginate`, `getMainFgosDir`) 65 / 55; 68 modules (parser, registry, flag check, envelope, store, paths) 50 / 45; 7 modules (no store, no paths) 23 / 21; node alone 16 / 16. Loaded in real runs (load hook): `--help`, `hook`, `list`, `version`, `lock-status` all 207; `dispatch decide` **263**; `workflow status` **272** (the arm adds 56 and 65 dynamic imports on top).
Why a lazy import per arm alone is not enough: (1) `main()` pulls 117 modules of cross-cutting code before any arm runs (static trace: `transport.mjs` alone is 38 unique modules, imported only for `currentDispatchDepth` and `DispatchError`; `merge.mjs` 7 for `releaseRecordedLand`); (2) the store leaf (61-module closure) is dragged in only for `StoreError` and exit codes; (3) for `dispatch decide` the arm's own dynamic import (`cli.mjs`) has a **145-module closure** that covers nearly all of the 207, because `cli.mjs` also holds assignment execution and the run-supervisor client, while `decide` needs `config.mjs` plus `mechanism.mjs` (about 60 modules). So the shell cannot cut `dispatch decide` without a T5 split; `run` needs about 169 of 207 (its use case is the whole runner), so lazy imports buy `run` about nothing.
What lazy per-arm buys, per common verb, estimated from the sets above (not measured after a change):

| Verb | Today (modules, CPU of import above node) | After the entry and error-leaf split | Saving (CPU ms) |
|---|---|---|---|
| `hook` (any kind) | 207, 73 | 7 plus the guard (delete-guard 2 modules, dispatch-decide about 60) | delete-guard about 65, dispatch-decide about 35 plus the second Node (64) |
| `--help`, `version`-class, `lock`, `worktree`, `session`, `agents`, `doctor` run-all | 207, 73 | 7 to about 70 | 30 to 65 |
| `dispatch decide` | 263 | about 70 after the T5 split | about 35 to 40 |
| `workflow status` | 272 | not measured (needs a state read plus the workflow loader) | n/a |
| `run` | 207 plus the run door | unchanged: the run use case is the whole runner | about 0 |
| Work arms | 207 | flagged, left out | n/a |

One first step with no design question: `bin/fgos.mjs:39` statically imports `scripts/check-decision-citation-drift.mjs`, which pulls **11 modules of `scripts/`** on every call (the git one-door scanner of 169 KB, the Rust distribution builder, the addon stager, the source lexer). Importing that one file costs **15 to 16 ms** (31 ms vs the 15 ms floor, load 10.8). Its users are the `decision` arm (Work or Knowledge, flagged: the change there is one import line) and `preflight` (T8). Move the import into those two arms: about -15 ms CPU on every other verb, 1 line plus 2 dynamic imports, and the shipped payload stops loading maintainer scanners. Fix size for the whole F-2: entry rewrite about 60 lines, error leaf about 60 moved lines, one architecture guard (about 15 test lines), plus the T5 split. Phase fit: T9-00 (registry fields, dead arms), T9-05 (hook, decide), the error leaf in T9-01.

**F-3 (High, measured): the hook path pays host verify, a full CLI import, and a second Node for a guard that needs 2 modules.**
Scenario: PreToolUse `Agent|Task` runs `fgos hook dispatch-decide` (every subagent spawn); PreToolUse `Bash` runs `fgos hook main-checkout-delete-guard` after a shell `case` that matches any command text containing `rm`, `sh`, `bash`, `zsh`, `clean`, `eval`, `xargs` or `-delete` (how many Bash calls match was not measured). Every tool call runs the native `hook mailbox` at 18 ms (load 3.1): the pattern already works at the native floor. Measured at load 3.1 and 3.0: Agent/Task hook **262 ms** (host 55, parent Node about 143, child 64); delete-guard **148 ms** (the guard script alone 25 ms: its closure is 2 modules, `scripts/main-checkout-delete-guard-hook.mjs` plus `src/git/main-checkout-delete-guard.mjs`). The parent imports 207 modules to reach `spawnSync(process.execPath, scripts/<kind>-hook.mjs)`; the dispatch-decide script itself then loads 146 modules through `cli.mjs`.
Fix: `hook` is handled before the registry loads (first lines of the entry), and the guard modules export a `run(argv, stdin)` that the entry calls in-process; the agy-format branch in `handleHook` (`bin/fgos.mjs:5052-5125`, D3) goes away with it. Estimated: delete-guard 148 to about 55 ms (host 55, then 20 after F-1), dispatch-decide 262 to about 110 to 130 ms (also needs the T5 split of `decide`). Size: about -60 Node lines, hook scripts export a function (T8 owns `decision-question`, T5 `dispatch-decide`). The agent cannot proceed until the hook returns, so this is user-visible latency on every subagent spawn and every matching Bash call.

**F-4 (Medium, measured): doctor spends 13 to 20 percent of its time on T9-owned rows, and most of it is one probe repeated.**
Three in-process runs of all 109 rows against the main checkout: total **44.1 s (load 33.8), 25.8 s (31.7), 17.3 s (17.2)**; `fgos doctor --json` through the CLI took 17.7 s wall (8.1 user, 9.3 sys, load 22 to 26). Share by owning layer (my assignment of rows, from the three runs):

| Owner | Rows | Run 3 (load 17), ms and share | Run 2 (load 32) | Run 1 (load 34) |
|---|---|---|---|---|
| Work (flag, left out) | `delivered-not-on-trunk`, `work-classification-vocabulary`, `work-step-vocabulary` | 5 325 (31 %) | 31 % | 40 % |
| **T9 own** | five `*-hook-wired` rows (codex, dispatch-decide, omp, agy, pi), `claude-plugin-marketplace`, `active-release-matches-checkout` | **1 889 + 1 498 = 3 387 (20 %)** | 18 % | 13 % |
| T2 and T3 (Git, Event Store, mailbox) | `main-checkout-hook-wired`, `event-store-*`, `node-version-and-git`, `root-drift`, `mailbox-hook`, `leaf-notify-drift` | about 4 600 (27 %) | 27 % | 29 % |
| T5 and T6 | `seat-binding-dry-bind`, `blind-steps-use-proven-pools` | 2 530 (15 %) | 17 % | 15 % |
| T4, T1 and the rest | confinement, terminal, locks, other | about 2 200 (13 %) | | |

Top rows, run 3 (load 17): `delivered-not-on-trunk` 4 811, `seat-binding-dry-bind` 1 455, `claude-plugin-marketplace` 1 307, `blind-steps-use-proven-pools` 1 075, `main-checkout-hook-wired` 930, `event-store-open-root` 919, `mailbox-hook` 732, `event-store-machine-id` 612, `root-drift` 581, `confinement-probe-freshness` 571, `node-version-and-git` 536, `work-classification-vocabulary` 512. Everything below that is under 0.5 s; the tail of 85 rows sums to about 1.1 s.
T9-owned causes: the five hook rows run `isShimRunnable` (`src/setup/agent-hooks.mjs:94`), which spawns the **same** workspace shim with up to three probes each (dispatch-decide, delete-guard, mailbox): 14 spawns of identical probes, 1.9 s at load 17 (about 135 ms each). One probe per shim per run (`run.once`, which `createDoctorRun` already offers) removes 11 spawns: about **-1.5 s (9 percent of the doctor)**, about 10 lines. `claude-plugin-marketplace` spawns the external `claude` CLI three times (`plugin marketplace list`, `plugin list`, `--version`), 1.3 to 1.5 s: run the three independently in parallel, estimated -0.8 s (not measured after a change). With F-1 and F-3 each remaining probe is cheaper too (a hook spawn 262 to about 120 ms).
Not T9, for the next seats: the two seat-binding rows spawn the host **98 and 84 times** (`internal seat-binding bind`, 14 to 23 ms each, `src/seat-binding/client.mjs:126`), one bind per workflow step; one batched bind per row would remove about 180 spawns and about 2 s at load 32 (T5 and T6). The Git and Event Store rows are what the T8 speed seat already saw; the Work row `delivered-not-on-trunk` is 27 to 38 percent of the whole doctor on its own and is Work's.
Position on the doctor 12 s target: with the T9 fixes (about -2.3 s at load 17) and the batched seat bind (about -1.7 s at load 17), the doctor falls from 17.3 s to about 13 s at load 17 without touching Work; reaching 12 s needs Work's row (4.8 s) to halve. That is the one place the target and the layer boundary meet.

**F-5 (Medium, measured; no fix proposed for the foreground cost): the cross-cutting jobs of `main()`.**
Measured in a throwaway project (and the main checkout), load 13: `getMainFgosDir` 28 to 32 ms first call (5 sandboxed Git calls: `config`, `var GIT_CONFIG_*`, `rev-parse`, `for-each-ref refs/fgos/...`; 1 ms afterwards, cached per process); the end trigger `maintainEventStore` 14 to 24 ms first call (1 to 2 ms the second); `isMainWorktree` 1 ms; `enableCancelOnSignal`, the registry lookup and the fault record on success: not measurable. At load 31 the first two were 40 to 70 ms and 18 to 26 ms. Which verbs pay: those the registry marks `requiresExistingStore` (34), the 14 store-warning reads and the 7 lifecycle verbs; **`workflow`, `dispatch`, `run`, `worktree`, `session`, `agents`, `doctor` pay none** (0 Git execs counted for `dispatch decide`, `agents`, `workflow status`). So the foreground cost is mostly Work verbs; the T9-owned ones are `lock`, `lock-status`, `tool`, `setup`, `init`, `events`, `rebuild`. `getMainFgosDir` is cached for the verb that follows, so only the end trigger (about 20 ms) is extra. **No change recommended for speed**: it is spec §16's opportunistic seal and publish, and moving it into one door (D9) is the baseline's T9-03 for ownership reasons.
The seal hand-off is the part with a real cost: each write verb that appended with `sealOnWrite` ends by `spawnDetachedCli` of a **full `node bin/fgos.mjs events seal`** (`bin/fgos.mjs:4870`); that child pays the whole 207-module import (at least 205 ms CPU at load 31 in a project where it refused at the addon check, so a lower bound) and runs a second time for `events sync` when a sync is due. It is off the print path but it is CPU, and on a machine shared by many lanes it is the same CPU the suites fight for. A child that starts from its own entry (event-store door plus store leaf, about 61 modules) would import about half as much (store closure 85 ms vs full 165 at load 29). **Position on U3: give each background job its own small entry owned by its layer (`src/event-store/seal-child.mjs`), not the shell.** Size: one file about 25 lines plus the spawn site; the architecture guard for "lower layers spawn the shell" (baseline idea) then has nothing to catch.

**F-6 (Low, measured): `*-hook-wired` and `mailbox-hook` rows duplicate what the hook path (F-3) already proves cheaply.** After F-3 lands, a hook spawn costs about 55 to 120 ms instead of 150 to 260 ms, so the doctor rows shrink without a change of their own; no separate item.

**Not a finding (measured, too small to act on):**
- Launcher walk plus workspace shim: 21 ms vs 21 ms for a native verb (load 4.1, 25 runs).
- Failed `execve` while the host searches `PATH` for `node`: 6 attempts in 0.15 ms.
- `bwrap` around Git: a sandboxed `git rev-parse` 2 ms vs 1 ms plain (load 14); the 28 to 32 ms of `getMainFgosDir` is five process launches, not the sandbox. (T2 may still ask why one invocation needs five.)
- `recompute_artifact_digest`, `verify_legacy_node` entry hash, route lookup: each under 1 ms.

## Outside T9, seen while measuring (named for the owning seat)

- **T0 and T1, `lock-status`:** 349 ms wall, 369 ms CPU at load 3.5, 5 sandboxed Git calls plus the store open (an `execve` trace shows bwrap, git, bwrap, git in a row). For an arm the baseline calls thin, that is the slowest non-Work verb I measured.
- **T2, Git door:** `fgos list --json` (Work, flagged) starts 7 sandboxed Git calls in a project that has no Event Store history; `fgos stale` (Work) started about 30 (3.9 s under strace, load 33). One door call per fact is the speed form of the Git seat's one-door rule.
- **T5 and T6:** the seat-binding bind loop (F-4) and the `cli.mjs` split (F-2).

## Work arms flagged and left out

`list` (822 ms, baseline), `stale`, `ready`, `show`, `rollup`, the 41 Work arms and 10 Knowledge arms of the baseline table, the `decision` arm's static import of the citation scanner (the one-line fix of F-2 touches that arm; it needs Work's consent or a T9-owned dynamic import wrapper), and the Work doctor rows `delivered-not-on-trunk`, `work-classification-vocabulary`, `work-step-vocabulary`. No Work change is proposed.

## Feature ideas (kept apart; owner picks, none is planned)

- `fgos doctor --time`: per-row milliseconds in the JSON (H10, decision 76). Problem: every number in F-4 needed a preload wrapper. Benefit: the next seat reads it from the door. Cost: about 10 lines in the run-all door (`checks.push` already loops there).
- A native route for `hook main-checkout-delete-guard`: the judgement is one pure function over one payload (`src/git/main-checkout-delete-guard.mjs`, 1 module). Problem: it runs on every matching Bash call at 148 ms; native `hook mailbox` runs at 18 ms. Benefit: about 130 ms per matching call. Cost: a Rust port of the guard and its tests (design principle 4: platform foundations in Rust). Only after F-3, whose in-process Node form already reaches about 55 ms.
- Replace the shell `case` pre-filter in the `Bash` hook by the native guard reading the payload itself: removes `P=$(cat)`, the `case` and the printf pipe. Same condition: after the native route exists.
- A per-process verify memo is not offered as a second idea: F-1(b) is the item.
- `fgos worktree list` stays out (baseline question; no speed reason).

## Positions on the baseline's open questions

- **U1 (owner of knowledge, doc, decision verbs):** speed-neutral; keep them with Work, as the baseline did. The one speed fact: `decision` statically imports a maintainer scanner for everybody (F-2); whoever owns it, that import moves.
- **U2 (per-verb root policy or one invocation-root door):** one door, computed lazily once per process and passed down. Reason: `resolveMainCheckoutRoot` runs Git (the 28 to 32 ms above, 5 launches) and six arms recompute it by hand; a memoised root costs nothing for verbs that never ask. Keep the per-verb difference as an argument of the door (`strict`), not as separate code.
- **U3 (background jobs):** each job gets its own small entry owned by its layer (F-5); about half the import CPU of today's child, and it removes the layer inversion.
- **U4 (`preflight`):** speed view only: it is the second reason `scripts/` is imported at startup. Move it to a script of this repo (or retire it), and the static import in `bin/fgos.mjs` goes with it. The product choice stays with the owner.
- **U5 (gateway and dashboard scope):** no speed finding in either; the baseline's H24 and D6 are correctness and duplication items. Leave the gateway out of the speed budget until someone measures a request.
- **Lazy imports per arm, listed by the baseline as a feature idea:** not a feature. Decision 77 produces it: once an arm is a few lines calling one use case, a static import of every other arm is the thing that looks wrong. Do it as part of the arm moves (T9-00 and onward), not as a separate phase, and add the guard. It pays on hooks, help and version-class verbs, and on `dispatch decide` only with the T5 split; it does not pay on `run`.
- **The 12 s doctor target:** reachable without Work only with the batched seat bind (T5 and T6) in addition to T9's fixes (F-4); Work's row alone is 28 percent at load 17.

## Order and ownership by speed value

1. F-1 (host verify memo or, as fallback, drop the self-hash and the double read): one Rust change, every legacy call, TEST ping.
2. F-3 plus the `hook`-first entry: 100 ms or more on each Agent/Task and matching Bash call.
3. F-2 first step (the `scripts/` import): one line, every call; then the entry and error-leaf split with decision 77's arm moves.
4. F-4 (one shim probe per run, parallel `claude` calls): about -2.3 s of doctor.
5. F-5 (own entry for the seal child), with the Event Store door phase.

## Unresolved questions

- F-1: does the owner accept a fingerprint cache under the threat model above (user-owned release directory), or must the verify stay a full hash (then F-1(a) only, about -25 to -30 ms)?
- F-3: how many Bash calls match the delete-guard shell pre-filter in a normal agent hour? It sets whether the native route (idea list) is worth the Rust port after the Node fix.
- F-2: the `workflow status` minimal import set was not measured; whoever refactors T6 reads should measure it after the loader split.
- Rust test time of `apps/fgos` and `apps/fgos-gateway` was not measured (a full suite was running); the baseline's own list says the same. A seat or the lead can run `cargo test -p fgos` with a target under `forgent-worktrees` in a window with no suite.
- Quiet-load doctor numbers: the lowest load for a doctor run was 17; a number at load under 5 needs a window with no suite.

Status: DONE
Summary: Measured host overhead (55 ms quiet, 70 percent of hashed bytes are the host binary and a duplicate addon read), the 207-module import (static trace reproduced, realistic floor 68 or 7, `dispatch decide` needs a T5 split), the hook path (262 and 148 ms) and three doctor runs (T9 owns 13 to 20 percent, mostly one repeated shim probe); Rust test time was not measured because a full suite was running.
