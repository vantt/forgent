# Phase 12 close: doors rows, docs, parity close, port pace (S5, Execution read door)

Branch `s5/p12`, written 2026-11-18. Status: DONE_WITH_CONCERNS (the Node tests listed under "What the lead must run" were
not all run here; the door tests were).

## What changed

- `docs/architecture-manifest.json` `doors`: eight rows added, four existing rows edited. Each new row has a seeded
  caught/passed case in `test/architecture.test.mjs` (eight tests; stale-entry failures of a one-file seed are filtered, the
  full-tree test `every door row holds` stays the stale-entry check).
- Docs: `runner/spec.md` (Execution Core bullet), `seat-binding/spec.md` (section 3 who asks and protocol 2, section 15
  erratum line for step 2 done, section 16 pointers), `host-invocation-routing/spec.md` (recount: 80 selectors, 61
  `legacy-cli`, 19 native, `agents` native, `dispatch` and `hook` sub-verbs; decision-history bullet),
  `component-boundary.md` (Seat Binding row, `bind.mjs` clause of the Execution row, Executor Model row), `reading-map.md`,
  `vision.md` (step 2 done), runner subcomponent spec RUL93 and `config/spec.md` (the deleted-symbol mentions),
  `CHANGELOG.md` `[Unreleased]` (seven lines, including the `maxTier: flagship` line), the program plan S5 row.
- Deleted: `test/rust-host/verb-parity.test.mjs` and its `test/suite-baseline.json` entry. `harness.mjs` keeps
  `parityBaseEntrySpec` and `PARITY_CASES_DIR` (its own test pins them; S6a restores the runner from history for its rows).
- Owner-machine guide: `reports/guide-261118-1441-erd-owner-machine-activation.md` (D16).

## Doors rows

Step one (hits over this tree, patterns anchored on imports and definitions, never a bare `\bbind\(`):

| Pattern family | Hits found | Owner step |
|---|---|---|
| `from '.../execution/bind.mjs'` and `from './bind.mjs'` | 11 files: `dispatch/plan.mjs`, `dispatch/assignment-runner.mjs`, `execution/run.mjs`, `execution/dry-bind.mjs`, `execution/account-pin.mjs`, `execution/unit-run-start.mjs`, `execution/account-rotation.mjs`, `session-host/head-start.mjs` | S6a |
| same | `runner/loop.mjs` | S7 |
| same | `setup/seat-binding-checks.mjs` (`seat-binding-route`, `seat-binding-dry-bind`) | doctor, `bridge:S6a` |
| same | `setup/blind-steps-proven-pools.mjs` | doctor, `bridge:S6b` |
| Node twin definitions (`familyOf`, `lookupExecutor`, `readLlmAccounts`, ... 17 names) | `dispatch/{config,provider-adapter,provider-capacity,mechanism,resolve,llm-accounts}.mjs`, `dispatch/confinement/{policies,backend-registry}.mjs`, `execution/{run,capability-config,seat-resolver}.mjs`, `runner/agent-listing.mjs` | S6a (all) |
| `compileDispatchPlan`, `purposeSeatOf` | `dispatch/plan.mjs` | S6a |
| `findAgySubHomes` | `setup/agy-permissions.mjs` (twin of `find_sub_homes`, `checks.rs`) | S6a |
| `fgos_seat_binding::bind` | `execution/rust/src/bind.rs` only | Rust owner |

New rows: "bind a seat" (allows `bind.rs`, `executor_model.rs`), "the Node bind facade has only its named callers" (11 callers,
each with its owner in the reason), "derive executor facts" (Rust `packages/execution/rust/src/**` allowed, 12 Node files as
`debt` "twin, same vectors as the contract", `retiredBy` S6a), "decide a dispatch" (`decide.rs`; `plan.mjs` debt, S6a),
"execution doctor judgments" (`checks.rs`; `findAgySubHomes` debt, S6a), "capability rows hold jobs and tool abilities"
(four retired code names), "retired Node S5 code" (`decideDispatchHook`, `explainCapability`, `seat-policy.mjs`,
`--protocol 1`, `dispatch.mjs decide`), "retired Node S5 hook script" (the old script name only as the two legacy markers of
the hook table). Edited: "read runner.capabilities" and "choose an executor from prefer" (reasons name the Rust owner and
that `seat-policy.mjs` is gone), "tool lookup by capability" (`tools.rs` allowed, `tool-providers.mjs` now debt), "agent
definition tier directories" (already carried the Rust adapters from phase 08; unchanged).

Deviations from the phase text, each forced by the door checker:
- `apps/fgos/src/wiring/doctor/execution.rs` is not in the "execution doctor judgments" allowed list: it defines none of the
  judge names (it wires `checks.rs`), and the checker fails an allowed entry that never matches. The reason says so.
- The kept coding rows (Q3 = (c)) cannot be `debt` entries: the door walk reads `.mjs/.js/.cjs/.rs/.sh/.ps1` only, and
  `core/config-standard/runner.yaml` is YAML. They are named in the row's reason with `retiredBy` S7 and backlog p-nnbfsrxcss
  and marked "not checked by a pattern check". Code that read the old rows (`DEFAULT_CAPABILITY_SLOTS`,
  `RUNNER_LOOP_CAPABILITY_USES`, `isCapabilityDeclared`, `hasPreferPool`) is the checked part.
- Rust `fn bind` is not a pattern (it matches `publication.rs`, `supervise.rs` and others); the Rust call
  `fgos_seat_binding::bind` is, and the crate's own `fn bind` is not guarded.
- The red-first order was not kept literally for the manifest rows: rows and seeded tests were written together, then the
  seeds were run; one first run was red for a test helper reason (stale-entry noise in one-file seeds), fixed in the helper.
- `fn probe_status` would have matched a `holder-lock` function; the tool row uses `index_is_stale` only.

## Req 2: parity close

Each phase report already records its parity against its base; none was re-run (lead decision). Counts, quoted:

| Phase | Proof | Result |
|---|---|---|
| 10 native verbs (base `7655f4f3e`) | tables agents 25, dispatch-decide 46, dispatch-explain 22, hook-dispatch-decide 37 | all green after the lead's fixes |
| 11 doctor rows (base origin/main `940272e10`) | doctor table: S4's 82 cases plus 20 new | 101/101 green; seven rows compared per call, 119 to 120 answers each, 0 differ (one case excluded, one accepted difference) |
| 09 route and Node callers | no table: golden bind vectors (90) and the route tests own it; wall time and host calls measured in `erd-p09-route-measurement.md` | n/a |
| 16 llmAccounts | `executor-model.v1.json` `validate` vectors replayed by Rust and Node | green |
| 06, 07, 08 | vectors `bind.v1.json` 90, `decide.v1.json` 104, `agents.v1.json`, plus 110 `validate` vectors | replayed by Rust, and by Node where it still owns code |

The table files and `verb-parity.test.mjs` left main already (`0c9153b98`, `454fa2c9f`); this phase deletes the transitional
runner and its baseline entry. Not run here: any new table (none exists).

## Req 4: port pace (for the program's Q2)

Source: `git show --numstat` over the plan's landed commits on `ec27d2be8..HEAD` (S4 landing to the p11 close), 15 phase
groups (49 commits), chosen by hand from the commit subjects (the phase-12 files are not included; transitional parity
table commits and unrelated lanes that landed in the same window are excluded). Lines are additions/deletions; Node src is
`src/`, `bin/`, `scripts/` JavaScript; Node test is `test/**` JavaScript.

| Phase | Rust | Node src | Node test |
|---|---|---|---|
| 01 contract | +0/-0 | +78/-6 | +181/-226 |
| 02 councils | +0/-0 | +0/-0 | +20/-9 |
| 13 config repair | +329/-39 | +0/-0 | +3/-3 |
| 14 unit tier | +0/-0 | +47/-15 | +52/-3 |
| 15 legacy launch | +18/-66 | +82/-91 | +261/-367 |
| 03 taste tables | +67/-94 | +52/-50 | +103/-87 |
| 04 crate | +2259/-155 | +0/-0 | +0/-0 |
| 05 capability rows | +24/-23 | +104/-228 | +226/-280 |
| 06 bind | +2004/-112 | +89/-32 | +131/-21 |
| 07 decide | +4212/-202 | +78/-13 | +204/-16 |
| 08 agents | +560/-0 | +52/-1 | +67/-82 |
| 09 route | +894/-265 | +173/-683 | +161/-1078 |
| 16 llmAccounts | +166/-344 | +55/-350 | +157/-415 |
| 10 native verbs | +2016/-47 | +97/-625 | +484/-1566 |
| 11 doctor rows | +1276/-89 | +58/-361 | +135/-454 |
| **Total** | **+13825/-1436 (net +12389)** | **+965/-2455 (net -1490)** | **+2185/-4607 (net -2422)** |

Other files (contracts, vectors, YAML, docs) added +7461/-2023 and fixtures +49/-57. Reading for S6: Rust lines added were
about 5.6 per Node source line deleted (8.3 on the net), because the new crate carries the executor model, the vectors' owners and the
adapters while Node keeps its launch twins until S6a; Node tests fell by 4607 lines against 13825 of Rust (tests included).
Lead-days per phase were not recorded by the leads; the board shows the calendar: S4 landed 2026-11-17 13:34 and phase 11
landed 2026-11-18 14:40 (+07:00), 25 hours for 15 phases with up to four leads at once, against the plan's 38.5 estimated
lead-days. Landings (board time): 14, 02, 01, 13 at 13:49 to 14:04; 03 at 15:00; 15 at 15:57; 04 at 17:24; 08 at 18:24;
05 at 18:44; 06 at 18:54; 07 at 19:23 (all 11-17); 09 at 10:41, 16 at 11:33, 10 at 12:59, 11 at 14:40 (11-18). Longest
single phase window in commits: phase 03 (about 3 hours of commits across seven commits, including re-records).

## Ideas (backlog proposals, not backlog rows; the owner picks)

1. **Emit operation ids for a partly native verb from the route exporter** (problem: `routing.rs` `PARTIAL_VERB_OPERATIONS`
   hand-maps the operation ids of `dispatch` because the exporter emits none for a `legacy-cli` verb with native sub-verbs;
   evidence: `erd-p10-native-verbs.md`, concerns; the table is a second declaration beside the registry `native` field).
   Benefit: one declaration (RUL11), the hand table is deleted; cost: one exporter change plus its generated-route test.
2. **Reuse `HostWorkspace` and `read_snapshot` from `wiring/dispatch_decide.rs` in `wiring/doctor/execution.rs`** (problem:
   `effective_runner` and `LoadedDoor` there duplicate a path to the config snapshot; evidence: `erd-p11-doctor-rows.md`,
   "Why `dispatch_decide.rs` was on the needs list"). Benefit: about 70 duplicate lines gone and refused-config messages
   gain file-and-line origins.
3. **Hook payloads over 8 MiB are cut and allowed** (problem: a guard over a huge prompt is not enforced; evidence:
   `erd-p10-native-verbs.md`, concerns). Needs an owner choice between fail-open and a documented limit.

## What the lead must run (I could run only the door tests)

Run here and green: `node --test test/architecture.test.mjs` (every door test, including the eight seeded cases; the one
failing test of the file, `A4 boundary guard ...`, needs the Git native addon that is not present in this sandbox and failed
the same way before my change). Not run: `npm test` in full; `cargo test --workspace` (no Rust changed here);
`test/rust-host/harness.test.mjs` (the runner file is gone, the harness helpers stay); the CHANGELOG/doc drift tests
(`test/docs/**`) and `scripts/` doc-link checks; `fgos convention check`. The mutation census is not regenerated, as
instructed.

## Concerns

- `test/suite-baseline.json` lost one entry by hand: a full run regenerates the file if anything else drifted.
- The CHANGELOG lines are written from the phase reports, not re-verified against a running host; the hook-marker sentence
  (an earlier install's entry is recognised) rests on the legacy-marker comment in `agent_hooks.rs`.
- Stale-reference check of docs outside my scope: `docs/reference/runner-capabilities-advise-execute-slots.md` still
  describes a retired check (noted by phase 05, out of scope here).

Status: DONE_WITH_CONCERNS
