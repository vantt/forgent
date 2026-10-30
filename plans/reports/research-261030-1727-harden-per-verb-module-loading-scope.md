# Scope of per-verb module loading in bin/fgos.mjs

Date 2026-10-30 (Asia/Saigon). Research only: no source edits, nothing committed. Measured on an idle machine; the numbers are smaller than the TEST report's, so treat the saving as a range.

## Summary

The proposal is sound and needs no new mechanism, because `bin/fgos.mjs` already uses `await import()` inside verb cases for the workflow and run verbs (lines 521, 1272, 2284, 2779, 2938 and others). Three facts change the sizing, though:

1. `fgos internal attempt-step` does not go through `bin/fgos.mjs`. The Rust host execs `src/run-supervisor/attempt-step.mjs` directly (header comment of that file, lines 1-8). So this change cannot save anything on the two supervisor steps per attempt. That file's own import cost is about 40-50 ms. The "400 ms and 290 ms before first write" in TEST §8 comes from somewhere else (host spawn, envelope checks, the step's own work), and lazy loading in the CLI entry does not touch it.
2. On the machine today the whole entry costs about 100 ms wall (`node -e 0` is 23 ms), not 200-240 ms. About 80 ms of that is module loading. TEST's 180 ms and "about 150 ms saved per call" are therefore roughly double what I measure here; the real saving is closer to 45-60 ms per call when the machine is idle, more under load.
3. Most verbs still need the heaviest shared module (`src/state/store.mjs`, about 25 ms) and several need the runner-config module, so a typical verb gains less than `--help` does.

## 1. How bin/fgos.mjs is organised

- 5,335 lines. 111 static `import` statements at lines 22-163 (103 distinct relative specifiers, plus node builtins). Line 68 is a top-level constant, and a second import block follows it at 69-75.
- Dispatch: `main()` at line 5112 handles `hook`, `--help` and `-h` first, then does `parseArgs`, the unknown-flag check against `COMMAND_REGISTRY`, directory resolution, and finally `runVerb(verb, ...)` at line 5261. `runVerb` (line 1041) is one large `switch (verb)` with a case per verb. `main();` runs at line 5335.
- Imports used by many verbs: `src/state/store.mjs` (`StoreError`, `EXIT_CODES`, `initStore`, the read and write functions), `src/cli/command-registry.mjs` (help, flag check, manifest), `src/runner/paths.mjs`, `src/runner/dispatch.mjs` (`loadRunnerConfigForDir` appears 10 times, including a shared helper at line 429, so a lazy load of this one needs a decision about that helper), `src/state/work.mjs`, `src/cli/invocation-fault-log.mjs` (the fault path at 5296-5325).
- Imports used by one verb or one small group: the merge use cases (`sync-root`, `reject`, `review`, `approve`, `catchup`, `promote-to-component`; one use each at lines 3666-3786), `runDispatchCli` and `resolveWorkForDispatch` (line 2648-2653), `checkDispatchAttestation` (3387), `DOCTOR_CHECKS`/`createDoctorRun`/`runFixes` (4195-4218), `startGateway` and friends (3893), `createWorktreeUseCase` and `removeWorktreeUseCase` (3805), `createSession` and friends (3824), `runGoalCheck` and `frozen-judge` (3353-3357, but `runGoalCheck` is also used at 404 in a shared helper), the setup modules (`git-hooks`, `claude-code-hooks`, `shell-rc`, `skill-wrappers`, `runner-config-conversion`), the knowledge/doc-registry store functions, and `check-decision-citation-drift`.
- Import-time side effects in the entry: none that matter beyond the static imports themselves. `main()` calls `enableCancelOnSignal()` first and `processSealCoalescer.handOff()` (about line 5145), both from small modules that must stay static. `processSealCoalescer` is a singleton created at import (`src/event-store/seal-coalescing.mjs:68`). In the heavy modules I sampled (`store.mjs`, `dispatch.mjs`, `sync-root.mjs`, `work-dispatch.mjs`) the only top-level code is constant tables and empty `Set`/`Map` caches, so moving their evaluation later does not reorder any observable effect.

## 2. Measurements

Wall time of the whole process, idle machine, three runs each:

| Command | Wall |
|---|---|
| `node -e 0` | 23 ms |
| `node bin/fgos.mjs --help` | 100-110 ms |
| `node bin/fgos.mjs list --help` | 101-109 ms |
| `node bin/fgos.mjs list --dir /nonexistent` | 104-105 ms |

So `--help`, a help route for one verb, and a failing verb all cost the same: the import block. Summing a fresh dynamic import of each distinct specifier in file order gives about 90 ms over 103 modules, which matches the roughly 80 ms above. Costs are first-importer-pays, so the shared dependencies land on whichever comes first. Heaviest in that ordering: `state/store.mjs` 26 ms, `runner/dispatch.mjs` 22 ms, `verbs/merge/sync-root.mjs` 15 ms, `runner/work-dispatch.mjs` 8 ms, `cli/version.mjs` 2 ms, everything else under 2 ms each. The tail is long and cheap: no single other module is worth moving.

Closure costs, each in a fresh process (these overlap, so they are not additive):

- `cli/command-registry.mjs` alone: 2.4 ms. The help path set (registry, version, flag-check, fault log, paths) is 27 ms in total, and nearly all of it is `cli/version.mjs` (11 ms) and what it pulls in.
- `state/store.mjs` alone: 24 ms.
- `runner/dispatch.mjs`: 47 ms (it pulls in store).
- `verbs/merge/sync-root.mjs`: 73 ms (its closure includes most of the runner).
- A `list`/`move`-style set (store, read/move use cases, registry, paths, flag-check, version): 29 ms.
- `src/run-supervisor/attempt-step.mjs` import: 39-51 ms, not part of this entry.

## 3. Smallest change shape and estimate

Smallest shape that gets most of the gain: convert only the heavy closures to function-local dynamic imports at their verb cases, and leave the 90-odd cheap imports static. Concretely:

- `runner/dispatch.mjs` and `runner/work-dispatch.mjs` consumers (`dispatch`, `run`-family cases at 2529-2655, 2874, 2923, 5039, 5312), plus the shared `loadRunnerConfigForDir` helper at line 429 and its callers (10 sites).
- The merge use-case group (`sync-root`, `reject`, `review`, `approve`, `catchup`, `promote-to-component`, `merge.mjs`) at 3666-3786 and 2597-2609, 4888-4889. This group is the main reason `sync-root` shows 73 ms.
- Optionally `setup/checks.mjs` and the other setup modules, `gateway-control`, `session`, and `goal-check`/`frozen-judge`.

Size: roughly 10-14 import statements removed and about 25-40 lines added as `const { x } = await import(...)` at the cases, so about 50-80 lines touched in a 5,335-line file. Restructuring all 111 imports would touch about 250-400 lines and gain only the long cheap tail (a few ms), so it is not worth it.

Expected saving on an idle machine (my measurements; TEST's upper bound was larger):

| Case | Now | After | Saving |
|---|---|---|---|
| `--help` and `<verb> --help` | about 105 ms | about 50-60 ms (registry, version, paths, store pulled by `version`/fault-log chain; store may still load) | 45-55 ms |
| Typical state verb (`list`, `move`, `add`) | about 105 ms | about 55-65 ms (needs store, 24-29 ms) | 40-50 ms |
| Verb that needs the runner (`run`, `dispatch`, merge) | about 105 ms | about 100 ms | near zero, and the cost moves to verb time |
| `internal attempt-step` | 40-50 ms of its own imports, no bin/fgos.mjs | unchanged | 0 ms, out of reach for this change |

Note the `--help` floor depends on whether `cli/version.mjs` or the fault-log chain drags `store.mjs` in; I saw the combined help set cost about 27 ms and store alone add 0.1 ms after it, so store is already loaded by that set. If so `--help` cannot go below about 50 ms without also cutting that chain. That needs a check before promising the number. Extrapolating TEST's per-call figure to the suite: 2,726 CLI calls times 40-50 ms is 110-135 s of child time, not 400 s.

## 4. Risks

- Fail-fast loss. A static `import { x } from` with a misspelled or removed export fails at link time for every verb. A dynamic import destructure just gives `undefined` and fails when that verb runs. Mitigation is that every moved verb has a test (section 5), and the existing dynamic imports already work this way.
- Import errors now surface at verb time, inside the `try` and its fault-class bookkeeping at 5143-5325. A syntax or link error in a lazy module will be recorded as a verb fault, where before the process died before `main()`. Check the `faultClass` value at that point so it is not misclassified as an argument error.
- Sync helpers. A helper such as the one at line 429 is probably called from sync code too. A dynamic `import()` needs `await`, so each such function must become async and its callers awaited. Count these before choosing the module list; this is the main source of edit size.
- Layering test blind spot. `test/architecture.test.mjs` (the "import một chiều xuống" test, about lines 131-170) scans only statements that start with `import` at line start (regex `^import\s[^;]*?from`), plus the row-per-file check ("đủ sổ") against `docs/architecture-manifest.json`, where `bin/fgos.mjs` is the one `entry` row (line 33). A lazy `await import()` is invisible to it, so the layering check silently stops covering those edges. That is the same blind spot the existing dynamic imports already have, but it grows. Decide whether to accept it or extend the regex in the same change (L10: one door).
- `test/runner/dispatch-reconciliation-import-graph.test.mjs` asserts `EXPECTED_CLOSURE` (line 186) and `ALLOWED_BUILTINS` (line 108) for the reconcile modules only, by lexing static imports and by really loading them in a child. It does not read `bin/fgos.mjs`, so it is not affected. It also pins lazy edges in `visibility-session.mjs` as a tripwire; nothing there changes.
- Release staging: no list or digest depends on the import graph. `scripts/build-rust-distribution.mjs` (lines 425-460) copies the tree and digests each file and the entry as a whole; `test/rust-host/release-tree.test.mjs` (140-167) checks the entry exists and its digest matches. Moving an import between statements changes the entry's bytes, which is normal. The active-release drift check (`test/setup/active-release-drift-check.test.mjs`) compares file bytes, not imports. A plain `fgos` runs the activated release, so the gain only appears after the release is restaged and activated (AGENTS.md "Legacy-Node CLI Ownership Boundary"); the working-tree proof is `npm run fgos:dev -- <verb>`.
- Churn. `bin/fgos.mjs` has had 35 commits on main since 2026-10-23, so a 50-80 line edit across the import block and many cases will conflict easily. Open branches ahead of main that touch it: `origin/review/doc-git-one-door` and `origin/review/opc-scan-lows` (the same 65-line change, 2026-10-26), `work/es-ab-head` (124/78 lines, 2026-10-23, probably stale), `work/es-ab-t2` (2/2, 2026-10-23). None of the active worktree branches (`harden/t3a-red-tests`, `mail/v9-wake`, `mail/v7n`, `harden/t2-p08-census-slices`, `test/f14-slowdown`) touch the file against main. Land quickly after pulling and keep the diff narrow.
- Process timing assertions: I did not find a test that asserts CLI startup time. Tests that spawn the CLI (116 files reference `bin/fgos.mjs`) assert outputs and exit codes; the only stderr dependency I checked is that import failures are not part of any contract.

## 5. Proof ownership and what TEST should measure

- The owning proofs are the verb-level tests: per-verb files under `test/verbs/` and `test/cli/` (for example `subcommand-flag-drift.test.mjs`, `worktree-create.test.mjs`, `worktree-remove.test.mjs`), the Rust-host route tests (`test/rust-host/help-routes.test.mjs`, `command-routes.test.mjs`), and the help and manifest tests. Every verb moved to a lazy import needs one existing test confirmed to execute its case end to end through `bin/fgos.mjs` (or `fgos:dev`) so that an `undefined` import fails. List the moved verbs and, per verb, the test that owns it before starting; add none unless a verb has no spawning proof, and then extend the owning file rather than adding a copy.
- A one-time check that no moved verb is missing a proof is worth more than a new test: run each moved verb with `--help` and with one real minimal argument in a scratch repo.
- TEST should measure before and after, with the same probes on an idle machine, five runs each, median: `node -e 0`; `node bin/fgos.mjs --help`; one state-reading verb against a scratch `.fgos`; one runner verb (`dispatch decide`); one merge verb help. Also measure the same on a loaded machine (during a suite run) since the suite's cost is under load. Separately, time `src/run-supervisor/attempt-step.mjs` imports, because that is where the attempt-step cost actually lives and it needs its own item if worth cutting.

## Unresolved questions

- Whether `cli/version.mjs` (11 ms) or the fault-log chain pulls `store.mjs` into the `--help` path, which sets the floor for the `--help` saving.
- Where the 290-400 ms before the first write in each attempt step comes from, since it is not the CLI entry import.
- Whether to extend the layering test to see lazy edges in this same change.
