---
title: "Test standard and improvement strategy"
description: "One synthesis of the owner's test asks since 10-20, what the TEST lane and the 2026-09 test tracks learned, a proposed test standard, and a phased strategy, written before more cleanup starts."
status: proposal
created: 2026-10-29
---

# Test standard and improvement strategy

Author: TEST lane (`claude-tt7r@fg-server2`). Read-only synthesis; no code changed. Measured at `2f34e562c` plus `test/suite-baseline.json` (sha `c1c5b6973`).

## 1. What the owner asked, in order

| Date | Ask | Recorded in |
|---|---|---|
| 10-20 | "There are very many tests; they feel redundant. When removing code, consider removing its tests." | counsel `counsel-261020-1658-test-suite-growth-rule.md`, accepted 17:47 (one owning proof, lowest layer; principle 8) |
| 10-25 | Speed first. Find, with evidence, why the suite keeps getting slower and larger despite the rule. | TEST plan, F14b/F14c/G1 |
| 10-26 | Q1 cut contained git calls per operation (other lanes), Q2 suite env as an allow-list, Q3 make cost visible on the `suite:` line. | TEST plan Q1–Q3 |
| 10-28 | TEST's role: improve the existing suite, find why agents grew it, review every new test and warn the lane. | TEST plan G2, REV |
| 10-29 | Look for ways to isolate tests so a change is caught near where it was made and spreads less upward. Find a way to separate the tests that spawn processes or start git, since those carry most of the cost. | this report |
| 10-29 | Stop, and set the standard and the strategy before jumping in. | this report |

## 2. What we know now (evidence)

### 2.1 Where the cost is

Per-file CPU from the baseline profile (6539 s of 6720 s attributed), files classed by the heaviest mechanism they use anywhere:

| Class | Files | CPU s | Share |
|---|---:|---:|---:|
| Spawns the CLI (harness `run()`, `bin/fgos.mjs`, `fgctl`, host bin) | 203 | 4267 | 65.3% |
| Builds a git repo or store, no CLI | 69 | 1000 | 15.3% |
| Spawns other processes (supervisor, agents, cargo, races) | 116 | 901 | 13.8% |
| None of these | 210 | 371 | 5.7% |

So the owner's reading is right: process and git work carry about 94% of suite CPU. The class is per file, so a CLI file's in-process cases count as CLI; the next measurement (S-0 below) splits it per test.

Unit costs measured earlier:
- One harness CLI call ≈ 120 ms idle, 175–225 ms under suite load, against 0.3–2 ms for the same use case called in-process (red-team 2026-09-22). Each CLI test made about 3 spawns, and about 60% of them were fixture setup (`add`, `move`, `init`), not the verb under test.
- `test/cli` costs 2.60 s per test against 0.38–0.62 s for `test/direct` cases of the same kind (TEST CLI2D, 10-26).
- Every git call runs in its own `bwrap` namespace: about +14 ms wall and +4.5 ms CPU under 24-way load. `fgos-merge.test.mjs` alone makes 13 010 git and 9 232 bwrap execs. A trivial `resolvePlan` test spawns 37 git and 32 bwrap (10-26 report).
- The tests did not get heavier from 10-21 to 10-25; what they call did (Event Store cutover moved every Work read and write onto git).

### 2.2 Why the suite grows

From `research-261028-1412-test-growth-agent-behaviour.md` (corrected 10-28):
1. Feature work adds a new test file per new module or crate (≈58% of added tests; 57% land in new files).
2. Fixes and review findings add one more test each (≈21%). The rate fell from 3.09 to 1.19 per fix commit after principle 8 entered AGENTS.md; AgentKit skill text is not the cause.
3. Ports and moves keep the proof at the old layer as well as the new one.
4. The harness makes the expensive path the default.
5. "Real everything" raises cost per test, not count.

### 2.3 What was tried before, and what happened

| Earlier attempt | Result | Why it stopped |
|---|---|---|
| Fast fixtures `tmpCwdFast()` and `initGitCwdFast()` (2026-09-16) | 136 → 3 `fgos init` sites in three files, 94 → 68 s | Left **opt-in**. 14 files use it. `tmpCwd()` (CLI init) stayed the default. |
| Template clone `tmpCwdFromTemplate()` (2026-09-21) | 9.8 → 7.6 s on its pilot file | Rolled to 20 files, then stopped. |
| Related-test selector `test:related` with ownership manifest (2026-09-15/20) | Works, fail-safe to full suite | Still **shadow** mode, 34 rules. Any unmapped path escalates to the full suite, so it almost always runs everything. Promotion evidence was judged meaningless by the 09-22 red-team. |
| Tiers (fast/slow suites) | — | Deferred in 09-15 until the selector proved itself; never revisited. |
| Pairwise generator for Cartesian files | — | Red-team 09-22: wrong algorithm, no oracle. Dropped. |
| Splitting slow files | Helped once, then negative | Process and import overhead; created 55 clone files. |
| Serial lane for process races (10-06) | Works for 12 files | Did not cut flakes caused by load from outside the suite. |
| Phase 3 use-case extraction (10-21) | `loop.test` 327 → 182 s, `terminal-pane-ownership` 61 → 0.7 s, `help-routes` 95 → 14 s | Done for the top files, then the Event Store cutover raised every Work test's cost. |

The pattern: **cheap paths were built, piloted, and left beside the expensive default.** The harness now has three ways to make a fixture project (`tmpCwd`, `tmpCwdFast`, `tmpCwdFromTemplate`) and the slowest one is the one new tests copy. That is the "tùm lum" shape RUL11 names, not a missing tool.

### 2.4 Lessons from running the lane

- A full run's exit 1 has two sources: `run-tests: ERROR` lines and failing tests. Read both.
- Results depended on the caller's environment (HOME, herdr, session ids) until Q2 made the env an allow-list.
- Timing ratios fail under suite load and pass alone (F1, H21, W3). Load from outside the suite cannot be serialised away.
- A branch gate cannot see a commit made only at landing time.
- Review catches what counts miss: COOK's branch had 18 findings in 183 new tests, including one weakening (a deleted preset test whose asserts nobody re-owned).
- Counting needs care: the guard missed harness `run()` calls and counted vendored crates until 10-28.

## 3. Proposed test standard

Principle 8 stays the root rule. The standard below says what it means in practice for this repo. Items marked *new* are not written anywhere today.

**T1. One behaviour, one owning proof, at the lowest layer that can observe it.** A boundary above it gets at most one wiring proof. (Principle 8, unchanged.)

**T2. Layers and what each may spend.** *New as a written map.*

| Layer | Observes | May use | Owning file |
|---|---|---|---|
| L0 pure | rules, parsing, validation, decisions | memory only | the module's own test file |
| L1 module | a module with its real files | temp dir, real fs, no child process | the module's own test file |
| L2 port | one Rust or Node port against the real system (git, process, lock) | real git, real processes, `bwrap` | the port's crate tests, or its one Node route test |
| L3 use case | a verb's business cases | in-process call, a fixture store built in-process | `test/direct/` or the use-case module's test |
| L4 CLI wiring | argv, exit code, JSON envelope, one per verb | one CLI spawn | `test/cli/` |
| L5 end-to-end | a cross-component flow a user runs | anything | `test/e2e/` |

A case belongs to the lowest layer where its failure can be seen. A validation message is L0, not L4. "The verb rejects a missing value" is L0 or L3 plus at most one L4 envelope proof per verb.

**T3. The cheap path is the default.** *New.* Each fixture need has one door, and that door is the cheap one. The expensive form (CLI init, git init per test) is used only when the boundary itself is the subject, and then says so in the test. A pilot that proves a cheaper fixture replaces the default in the same change, or it does not land.

**T4. Locality.** *New as a rule.* A test lives in the file that owns the module it observes. A change to module X must fail X's own tests first. Tests above X check only that X is wired in. Measured as: for a seeded fault in X, how many test files fail. Fewer, nearer files is better.

**T5. Hermetic and load-safe.** The result does not depend on the caller's environment (allow-list env, isolated HOME, no real agent CLI or network). No timing ratios against wall clock; use rendezvous, barriers and absolute bounds from the same run. Process races run in the serial lane.

**T6. Lifecycle.** Deleting or replacing a mechanism retires its tests in the same change, each naming the test that now owns the behaviour or saying the behaviour was removed. Delete, never `skip`. A test born in a bug fix is a regression witness: its case moves into the owning proof, it does not vanish.

**T7. Cost is visible and reviewed.** Every new test that spawns the CLI, starts git or another process states why a lower layer cannot observe it (admission check, warning). The `suite:` line reports files, Node tests, Rust tests, wall and CPU against the baseline. TEST reviews new tests before landing.

**T8. Rust and Node count the same.** A Rust test is a test; the same one-proof and layer rules apply to crate tests.

## 4. Strategy

Ordered so each step is measured before the next, and so that cost falls where it is largest. Steps marked *TEST* are in the lane's frame; *route* means another lane owns the code.

**S-0. Measure per test, not per file (TEST, read-only).** Use the existing spawn-spy preload to record, per test: CLI spawns, git execs, bwrap execs, other spawns, CPU. Output: a ranked table by layer class, and the share of CLI spawns that are fixture setup versus the verb under test. This replaces the per-file class above and decides S-1 versus S-2 order with numbers.

**S-1. One fixture door, cheap by default (TEST).** Collapse `tmpCwd`, `tmpCwdFast` and `tmpCwdFromTemplate` into one `tmpCwd()` that builds the store in-process (or clones a template once per file). Do the same for the `initGitCwd*` family. Callers that test `init` itself keep `rawTmpCwd()` plus an explicit `init`. Move harness seeding helpers (`addOk`, `moveStep` and similar) to in-process calls where the seed is setup, not the subject. Expected: removes most fixture spawns (about 60% of CLI spawns in the 09-22 sample). One mechanism less, not one more.

**S-2. Move cases to their layer, heaviest verbs first (TEST for tests; route seams).** For each heavy CLI file: move the business and validation cases to L0/L3 in the owning module's test file, keep one L4 wiring proof per verb, retire the CLI copies with named owners. Where a verb has no in-process use case (logic inline in `bin/fgos.mjs`), stop and route the seam to the owning lane; do not add a test-only seam.

**S-3. Share one built fixture per file (TEST, F14c).** Read-only tests in one file reuse one store or repo built once; write tests copy it. This cuts git and Event Store setup, the 15% class.

**S-4. Locality for the inner loop (TEST, needs an owner decision).** As S-1 and S-2 move cases into module-owned files, add the module to the selector manifest. Then promote `test:related` from shadow for the inner loop only; the full `npm test` stays the DoD gate before landing. Measure T4 with the existing mutation tool (`test-select-mutate`): files failing per seeded fault, before and after.

**S-5. Product cost of git (route: HARDEN/OPC, owner Q1).** Fewer contained git calls per operation helps users and every git-class test. TEST supplies counts from S-0; it does not change the product.

**S-6. Prevention (TEST, ongoing).** REV review of every new test; the admission warning for new spawns; the `suite:` line. Add the T2 layer map and T3 to the lead brief template once DOC's freeze lifts (AGENTS.md and docs are DOC's).

### Not doing, and why

- No in-memory Event Store or fake git adapter for now. It is a new mechanism (RUL104) that must be kept equal to the real store. Revisit only if S-0 to S-3 leave git setup as the main cost.
- No tiers or a separate "fast suite" as a DoD gate. The full suite stays the proof; the selector serves the inner loop only.
- No more file splitting, no test-count cap, no pairwise generator (section 2.3).

## 5. Decisions for the owner

**D1. Adopt T1–T8 as the TEST lane's review standard now, and propose them for AGENTS.md / the brief template when the docs freeze lifts?**
- What: today only T1, T5 (partly) and T6 are written; T2, T3, T4 are new.
- Options: (a) adopt now in TEST's review and plan, propose the doc text later; (b) wait for DOC before using them.
- Recommendation: (a). Review needs a written standard to warn against; nothing under `docs/` changes.

**D2. Order: S-0, then S-1, then S-2/S-3, with S-4 after them?**
- Cost: S-0 is read-only, one full run. S-1 touches one helper file and its callers; one full gate.
- Recommendation: yes. S-1 is the largest cut per line changed and closes the three-door mess.

**D3. Promote the related-test selector out of shadow for the inner loop, after S-1/S-2 have moved enough cases into owned files?**
- Options: (a) yes, inner loop only, full suite unchanged as gate; (b) keep shadow.
- Recommendation: (a), decided when S-4 starts with its mutation numbers in hand.

## 6. Not yet proven

- The 94% figure classes whole files; S-0 gives the per-test split.
- The 60% fixture share of CLI spawns comes from 11 files in 09-22, before the Rust host and the Event Store cutover. S-0 re-measures it.
- No estimate yet of wall-time gain; CPU is the stable measure on this shared machine.

## 7. S-0 result (2026-10-29 21:17, main `ba617a077`)

Full `npm test` profile (`scripts/test-timing.mjs profile`, junit per test), then one in-process timing of the fixture doors and single verbs (8 repeats each, idle machine). Per-test times are wall under suite concurrency, so compare them with each other, not with CPU.

| Measure | Value |
|---|---|
| Node tests | 8814; summed test time 8577 s; suite wall 619 s, CPU 6396 s |
| Tests ≥ 1 s | 1749 (20%) hold 7721 s (90%) |
| Tests < 0.05 s | 4802 (54%) hold 15 s |
| By file class (static: CLI harness / git / other spawn / pure) | CLI 161 files 59%; git 125 files 26%; spawn 87 files 7%; pure 232 files 8% |

| One call | ms |
|---|---:|
| `tmpCwd()` (git init + `fgos init` spawn) | 411 |
| `tmpCwdFast()` (in-process init) | 130 |
| `tmpCwdFromTemplate()` (copy) | 49 |
| `fgos list` spawn | 386 |
| `fgos add` spawn | 352 |
| `fgos --help` spawn | 117 |

Findings:

- **The fixture is not the main cost; the verb spawns are.** Static sites: 185 `tmpCwd()` against 1284 CLI `run(...)` calls. Moving every `tmpCwd()` to the template door saves about 185 × 0.36 s ≈ 67 s summed, about 1% of test time. The §6 "60% fixture share" from 09-22 no longer holds. S-1 stays (one door, simpler), but it is not the speed lever.
- **A real verb costs about 3× a bare spawn** (352–386 ms against 117 ms for `--help`). The extra 240–270 ms per call is product startup work (store, identity, config, git reads), paid by every CLI test and every user command. This is S-5: route to the owning lanes with a startup profile, not a test change.
- **Cost is concentrated.** One fifth of the tests hold 90% of the time. S-2 works through the ≥ 1 s list file by file, largest first: `runner/loop.test.mjs` 411 s, `run-supervisor/crash-matrix-adopt-resume` 218 s, `runner/execution/run.test.mjs` 198 s, `run-provider-failover` 182 s, `workflow/workflow-runner` 168 s, `cli/fgos-return` 165 s.
- Revised order: S-2 (cases to their layer, biggest files first) and S-5 (verb startup profile, routed) before S-1.

Data: `.fgos/runtime/tmp/s0-profile-261029-2117/` (junit, analysis) on fg-server2, not committed.

## 8. Where a run and a verb spend their time (2026-10-30 03:30)

Measured in-process on the idle machine, with `child_process` wrapped to time each child, and with a file timeline of one run directory.

**One `runUnit` with one attempt (failover fixture, warm process): about 1.9–2.1 s.** Fixture setup is 42 ms. Timeline of one attempt:

| ms | Event |
|---:|---|
| 0–750 | in-process admission, bind, dispatch plan, envelope (about 15 durable writes) |
| 750 | `fgos internal supervise` starts |
| 817 | fake worker finished (outbox written) |
| 912 | receipt |
| 912–1474 | step `settle-attempt`: a new `fgos internal attempt-step` process, about 400 ms of it before its first write |
| 1474–1841 | step `finalize-home`: another new process, about 290 ms before its first write |
| 1876 | supervise exits |

The first run in a process also pays the bwrap falsification probe suite once per fingerprint (11 bwrap launches, about 0.9 s). It is cached in memory and on disk, so it is not per test.

**Node CLI startup.** `node -e 0` takes 20 ms; `node bin/fgos.mjs --help` takes 200–240 ms. `bin/fgos.mjs` has 111 static imports, and importing it costs about 180 ms before any verb runs; `src/state/store.mjs` alone takes about 108 ms. An `attempt-step` needs only about 63 ms of modules, but it enters through the same entry and loads all of them.

So one cost explains three findings: the 240–270 ms a verb pays over `--help` (§7), the two dead gaps in every attempt, and part of the `runUnit` time in `run.test.mjs`, `run-provider-failover.test.mjs` and `loop.test.mjs`. Every user command and every real attempt pays it too.

**Proposal (S-5, product, routed, not TEST's to build):** load each verb's modules when that verb runs, not at entry, so a process pays only for the verb it serves. Rough upper bound, not measured: about 150 ms per CLI call and about 300 ms per attempt. Owner of `bin/fgos.mjs` decides; TEST measures before and after with the same scratch probes.

`run-provider-failover.test.mjs` itself is not a duplicate: `account-rotation.test.mjs` already owns the pure rotation rules (9 cheap tests), and the 29 run-level tests check rotation inside a real attempt. Some cases could move down (for example the two "refused before any unit run exists" tests), but the bigger lever for this file is the per-attempt cost above.
