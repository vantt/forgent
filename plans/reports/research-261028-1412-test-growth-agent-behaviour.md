---
title: "Why agents kept making the test suite larger: the agent-behaviour side"
description: "Measured attribution of test growth since 2026-09-01 on first-parent main, with the instruction text, harness shape and review flow that produced it, and the guard that missed each cause."
---

# Why agents kept making the test suite larger: the agent-behaviour side

Scope: `origin/main` at `91919362a` (2026-10-28 14:07). This report builds on `plans/reports/research-261026-0010-test-suite-growth-and-slowdown-causes.md`. That report covers the cost side (contained git per store operation, env leaks, guards that count tests but not cost), and this one does not repeat it. Nothing was run except `git` and read-only scans. Raw data: `growth.json`, `growth_nm.json` and `fp_rows.json` in the TEST session scratchpad. Method: for each commit, count added minus removed `test(`/`it(` lines in `test/**` and `#[test]`/`#[tokio::test]` lines in `*.rs`, using a diff against the first parent.

## Answer in one paragraph

Agents grew the suite mostly by doing what their instructions told them. Until 2026-10-20, `AGENTS.md` L5 said "new or changed behavior gets a matching test". The AgentKit skills the lanes ran (`ak:fix`, `ak:cook`, `ak:plan --tdd`, `ak:code-review`, the `tester` agent) say "add a regression test" or "add a test" for every fix and every review finding, and none of them says "find the owning test first". So each feature brought new test files for its new module (58% of all tests added). Each fix and review round added one more test (21%), most of them into existing files. Moves and refactors added a new layer of proof and kept the old one: CLI next to `test/direct`, Node next to Rust, a wrapper next to the moved function, legacy and retired paths next to the new door. 81% of the gross growth happened before principle 8 (One proof) existed. After it arrived on 10-20, Node growth nearly stopped. Growth moved to Rust (54% of what was added since then), which no review item and, until 10-26, no counter looked at. Principle 8 reached `AGENTS.md`, `core/instructions/design-principles.md` and the review checklist in `fgos-run`. It never reached the skills that do the writing: `fgos-coding-implement`, the `ak:cook` worker contract, or the AgentKit fix and review text. The harness makes the costly path the default: `run()` spawns `node bin/fgos.mjs`, and `tmpCwd()` spawns `fgos init`. The only guard that fails a run catches byte-identical clones. A copy of a behaviour at another layer is never byte-identical, so it always passes.

## Size of the growth (measured)

| | 09-01 (`c425fe6e7`) | now (`91919362a`) |
|---|---|---|
| Node `test()`/`it()` | 4371 in 229 files | 8072 in 613 files |
| Rust `#[test]` | 221 | 2291 (176 of them in vendored `packages/yaml-doc/third-party`, outside the workspace) |

The data comes from 5578 non-merge commits since 09-01 (exact commit types). They added 9253 tests in total and removed 3625, for a net of +5628. On first-parent main, 295 commits moved a count by 5 or more, and 163 of those are merges.

| Share of the 9253 tests added | Tests | % |
|---|---|---|
| `feat` commits | 5387 | 58% |
| `fix` commits (564 commits; 1648 into existing files) | 1960 | 21% |
| `test` commits | 928 | 10% |
| `refactor` commits | 556 | 6% |
| into a **new** file | 5264 | 57% |
| into an existing file | 3989 | 43% |
| Node in-process files (not test/cli, not spawning) | 5150 | 56% |
| Node files outside test/cli that spawn the CLI or host | 1213 | 13% |
| `test/cli/` | 271 | 3% |
| `test/direct/` | 184 | 2% |
| Rust | 2435 | 26% |
| `-2..-7` split files | 4 | ~0% |
| commits whose message cites review, findings, red team or a checker | 1291 | 14% |
| before principle 8 (until 10-20 17:50) | 7507 | 81% |
| after principle 8 | 1746 (Rust 950, test/cli 15) | 19% |

Largest first-parent movers (lane taken from branch or scope; board `log.md` grepped by hash):

| Commit | Date | Lane | Node | Rust | New-file share | Layer | Types inside |
|---|---|---|---|---|---|---|---|
| `89a29e29e` feat(mailbox): land the agent mailbox | 10-25 | MAIL (landed by `lead:LAND`) | +139 | +329 | 437 of 468 | Rust 329, in-proc 117, spawning 21 | feat 284, test 108, fix 73 |
| `856eeaf17` merge step-09 MVP6–9 group-thinking | 09-04 | coordination | +372 | 0 | 290 | in-proc | feat 288, fix 45 |
| `809b46133` merge step-08 standalone coordination | 09-02 | coordination | +367 | 0 | 332 | in-proc 326, cli 32 | feat 328, fix 39 |
| `a5ecb2fff` run-supervisor integration | 10-18 | RS | +167 | +111 | 368 | spawning 107, Rust 111 | feat 165, fix 67, test 36 |
| `976665aeb` origin/main merge | 10-20 | mixed | +140 | +83 | 198 | in-proc 124, Rust 83 | feat 163, fix 48 |
| `b6eff5706` origin/main merge | 10-19 | mixed | +133 | +34 | 138 | in-proc 114 | feat 106, fix 50 |
| `ef00e0a2f` rust-host-r1-kernel | 09-11 | rust-host | +166 | 0 | 138 | in-proc | feat 116, fix 48 |
| `f6849be3a` packaging code-panel rollout | 09-15 | packaging | +131 | +30 | 88 | spawning 55, in-proc 73 | feat 80, fix 79 |
| `51e339d0a` build(yaml-doc): vendor saphyr-parser | 10-22 | CFG/yaml-doc | 0 | +85 | 85 | Rust (vendored, not run) | build |
| `0b06824a7` feat(observe) | 10-06 | observe | +34 | +34 | 52 | in-proc, Rust | feat |
| `852171c26` feat(test): P04 related selector (shadow mode) | 09-21 | test-feedback | +46 | 0 | 46 | spawning | feat |
| `97420638c` test(coordination): verify DAG migration… | 09-24 | coordination | +41 | 0 | 41 | in-proc | test |
| **`191d75c42`** merge P4: coordination engine retirement | 10-02 | request-to-run | **−1355** | −3 | – | – | – |

## Ranked causes

### 1. Feature work adds a new test file per new module or crate, and the instruction said every behaviour gets a test (≈58% of what was added)

**Mechanism.** Each feature builds a new module, and its tests go into a new file next to it. Before 10-20 this was the written rule. `AGENTS.md` L5 question 5 read "`npm test` … green; new or changed behavior gets a matching test" (added `e350acbda` 2026-07-14, replaced by `fb8c6e4ae` 2026-10-20; see `git show fb8c6e4ae -- AGENTS.md`). AgentKit planning puts tests in by default:
- `~/projects/.claude/skills/ak-plan/references/plan-organization.md:38` lists a `phase-07-write-tests.md` phase.
- The same file at `:265`/`:267` adds, under `--tdd`, "a **Tests Before** section for regression coverage written first" and "a **Tests After** section for new behavior".
- `ak-cook/references/workflow-steps.md:19` reads "Step 3.T: Write tests for CURRENT behavior (regression safety net)".
- `ak-plan/SKILL.md:48`: "`--tdd`: Enforces test-first design, test matrix, and verification commands in every phase".

None of these says to look for an owning test first. 51 plans under `plans/` name `ak:cook`/`ak:plan`, and HARDEN plans have `phase-01-red-tests.md` files.

**Evidence.**
- `feat` commits added 5387 tests, and 5264 of all added tests went into new files.
- Mechanism churn. The coordination and agent-coordination scopes added 1238 tests in September (`809b46133`, `856eeaf17`, `242c0564e`, `ca854f443`, `97420638c`). The whole engine was retired on 10-02 by `191d75c42` (−1355). Agents kept adding tests to it until a week before it was removed (`97420638c` 09-24, +41).
- After 10-20 the same pattern moved to Rust:
  - mailbox +299, yaml-doc +111, git +99, config +96, identity +93;
  - 513 of the 950 new Rust tests sit in new files;
  - 790 of the 950 sit in `tests/` directories.

**Guard that misses it.**
- Principle 8 itself allows it: "lands in the file that owns that module unless the module or boundary is new" (`core/instructions/design-principles.md:45-56`). Every feature has a new module.
- The `fgos-run` review checklist (`core/skills/fgos-run/SKILL.md:88-93`, `f38dfd1d0`) asks "why not the existing file". It accepts "new module" as the answer, and item 4 covers only "Node test in a Rust-ported area", never Rust tests.
- Rust tests were not counted at all until `2a1868bb8` (10-26). They are now counted, with no limit, and the count includes the 176 vendored tests that never run.

**Smallest change to existing text or guards.**
- Add one line to checklist item 1 in `fgos-run`: a new module that replaces or sits beside an older one names the older module's tests it retires.
- Widen item 4 to "every test in a ported area, Node or Rust".
- In `countRustTests`, add `third-party` to `NOT_RUST_SOURCE` so vendored tests are not counted.

### 2. Every fix and every review finding adds one more test (≈21% of what was added; 14% traceable to review rounds)

**Mechanism.** A review returns findings phrased as "no test covers X, add a test". The lane fixes each finding in its own `fix` commit and adds a regression test for it, usually in the existing file. The text that says to do this:
- `ak-fix/references/workflow-standard.md:79`: "**Regression test:** Add/update test(s) covering the fixed issue. Test MUST fail without fix, pass with fix." It sits in a "**Mandatory skill chain**".
- `ak-fix/references/workflow-deep.md:114`: "**Regression test:** Add comprehensive tests."
- `ak-fix/SKILL.md:48-49`: "Add a regression test when it detects meaningful behavior".
- `ak-code-review/references/edge-case-scouting.md:49-52`: "Data flow risk | Verify or add test", "Edge case | Add test or verify", "Missing test | Add before review".
- `ak-code-review/references/verification-before-completion.md:84-87` (red-green regression tests).
- `~/projects/.claude/agents/tester.md:9` ("You hunt for untested code paths, coverage gaps") and `:27` ("Ensure coverage meets project requirements (typically 80%+)").
- `ak-test/references/test-execution-workflow.md:7`: "Bug fix → regression tests".
- In repo plans: HARDEN's rule "no High stays unreproduced" (`plans/261021-1547-harden-t0-process-facts-door/phase-01-red-tests.md:15`) and "one committed red test for each finding the plan fixes" (`plans/reports/council-261023-0402-harden-t2-arbitration.md:167`; `plans/261023-0415-harden-t2-git-terminal-control/phase-01-red-tests.md:15`).

None of the AgentKit text says to extend the owning proof. The HARDEN phases do say it ("One owning test per High … in the file that owns the module", `phase-01-red-tests.md`, Requirements), so they comply with principle 8, yet they still add a test per finding (that phase estimates "+160 Node, +60 Rust").

**Evidence.**
- `fix` commits added 1960 tests across 564 commits, 1648 of them into existing files.
- Commits whose message cites review, findings, red team or a checker added 1291 tests.
- Review reports under `plans/` carry 104 bullet lines of the form "add a test / no test covers / missing test" (`git grep` over `plans/**/reports/*review*.md`): 64 lines in 32 reports before 10-20, and 40 lines in 19 reports after it.
- Worked example: `test/runner/provider-credential-renewal.test.mjs` (created 10-13) gained 70 tests, 65 of them through `fix(runner)`/`fix(doctor)` commits. 13 such commits landed on 10-13/14 alone (`c62b37204` … `51c8394e0`, e.g. `5e353a0d6` "close the sweep test gaps").
- Accretion leaders since 09-01: `test/setup/skill-wrappers.test.mjs` +105 over 22 commits, `test/runner/execution/run.test.mjs` +80 over 37, `test/runner/execution/bind.test.mjs` +65 over 15, `test/runner/assignment-dispatch.test.mjs` +61 over 24.

**Guard that misses it.**
- A test added to an existing file with a new body passes every guard. The clone check fails only byte-identical bodies (`scripts/test-proof-inventory.mjs:351-356`, status at `:621`).
- The `fgos-run` checklist requires a reason, but only when someone reviews against it.
- The `ak:cook` worker contract (`core/skills/_shared/ak-cook-worker-contract.md`, last changed `9fa8a08f0` 10-20 12:20, before principle 8 at 17:50) passes `ak:cook` through without overriding its test steps.

**Smallest change.**
- Add one rule to `ak-cook-worker-contract.md` §"What the brief tells the worker": "A fix or a review finding extends the behaviour's owning proof (AGENTS.md L5 q5); a new test names the owning test it could not extend."
- Add the same sentence to the review-report findings format, where a lane's reviewer writes "add a test".

### 3. Moves, refactors and ports add a second layer of proof and keep the first (measured in clusters; total share not proven)

**Mechanism.** When code moves to a lower layer or to Rust, the agent writes proofs at the new layer and keeps the old ones, "so nothing is lost". The text behind this:
- The general rule "never weaken" tests (`~/projects/.claude/rules/primary-workflow.md:38` "Fix regressions instead of weakening tests"; `fgos-coding-implement/SKILL.md:137` "never weaken it").
- AgentKit's high bar for deletion (`ak-test/references/audit-suite-workflow.md:34` "prove with a coverage diff before deleting", `:62`).
- The Git spec, which demands both layers: `docs/platform/git/spec.md:731` "All vectors need real temporary-repo conformance tests through Rust and the relevant Node route". Before 10-20 its E6 row read "Git maintainer preserves behavior/assertions … not weaken" (`git show fb8c6e4ae -- docs/platform/git/spec.md`).

**Evidence (three clusters).**
1. **CLI and `test/direct` (edit refusals).** `29c86d6d2` (09-22, "test(edit): migrate business tests to direct in-process calls", empty body) created `test/direct/fgos-edit.test.mjs` (+459 lines) and `test/parity/edit-parity.test.mjs`. It left 14 CLI cases that repeat the same refusals. They lived 36 days, until `2b2f26781` (10-28) retired them: "Fourteen CLI cases repeat a refusal the edit use case makes and test/direct/fgos-edit.test.mjs already proves with the same assertions". `d7b11f33b` (read/stage, same day) did the same and also added `test/parity/{read,stage}-parity.test.mjs`. That makes a third layer whose only job is to prove the first two agree.
2. **Process liveness rule, proved three times.**
   - `d0ed681df` (09-21, "fix(dispatch): … cross-checked holder identity … (H1, H3, M2, L1)", review findings) added `test/runner/run-lock-identity.test.mjs`.
   - `5b3d205c8` (09-28, refactor) moved the judge to `process-identity.mjs` and added `test/runner/process-identity.test.mjs` (+79). Its message says why the old tests stayed: "run-lock.mjs's own resolveHolderLiveness(holder) is now a thin wrapper around it, so every existing importer keeps working unchanged".
   - `605d489af` (10-16, Rust process door) added Rust `judge_vectors.rs` and a third Node file, `test/process/process-facts-vectors.test.mjs` ("a record without a pid is held, never dead"), and kept both older files.
   - HARDEN T0 named the copies (`phase-01-red-tests.md`, last bullet of Files), and `812468ce0` (10-21) deleted `process-identity.test.mjs`.
3. **Node and Rust implementing the same rule.** `test/convention/seat-id.test.mjs:17` (`171bf7eab` 10-21) and `test/convention/definition-files.test.mjs:13` (`cfe2a6b92` 10-21) both have the test "the shared golden vectors give the same answer here as in the Rust crate". Rust runs the same file in `packages/convention/rust/tests/golden.rs:39`. The second proof exists because a second implementation exists (`src/convention/seat-id.mjs`), and the header says so: "the Rust crate and this loader read the same contract entry and run the same golden vectors".

Related: 247 test titles in 121 files prove a legacy, retired or "no longer" path, for example `test/cli/dispatch-retired-doors.test.mjs` and `test/state/events-legacy-absence.test.mjs`. Retiring a door adds tests that prove it is gone.

**Guard that misses it.**
- The clone check compares exact bytes, and a copy at another layer never matches.
- `--duplicates` (shared titles) only warns, and it sees Node only (`scripts/test-proof-inventory.mjs:612`).
- No guard links a Node test to a Rust test of the same behaviour.

**Smallest change.**
- Edit `docs/platform/git/spec.md:731` to read "owning conformance proof in Rust; at most one wiring proof per Node route".
- Make `test/parity/*` say in its header which layer owns each case. Otherwise retire it.

### 4. The harness makes the expensive path the easy one (cost per test, and CLI-shaped tests)

**Mechanism.** `test/cli/helpers/fgos-cli-harness.mjs` has 1271 lines, 73 functions and 95 exported names, and 58 test files import it.
- Its `run(cwd, args)` is `spawnSync(process.execPath, [FGOS, ...args])` (`:133-142`), a full CLI process per call. There are 1701 `run(` calls under `test/`.
- The default fixture, `tmpCwd()` (`:81-87`), runs `fgos init` through the CLI. It still has 185 call sites.
- The fast variants were added beside it and did not replace it:
  - `tmpCwdFast` (`da5684afa` 09-16, "pilot fast fixture initialization"): 140 uses.
  - `tmpCwdFromTemplate`: 173 uses.
  - `initGitCwd` 22 uses next to `initGitCwdFast` 86; `initGitCwdMain` 78 next to `initGitCwdMainFast` 99.
- Chain helpers such as `makeRunnerProposedItem` mix CLI `take` with real `git checkout/commit` (`:677-719`).
- 2914 Node tests (36%) now live in 221 files that spawn the CLI or host.

**How the `-2..-7` files happened.**
- `a20c69ef3` (2026-08-11, tsk-3um) split `test/cli/fgos.test.mjs`. It held 581 tests and took 171 s, and "that single file set the wall-clock for the entire suite". The split made ten files and moved the shared code into the harness.
- `99e1b913e` (2026-08-24, tsk-25b) split nine of them again because "main added a large number of new CLI verb tests to the same files … pushing each back over the ~30s per-file ceiling — up to 164s for fgos-intake alone". It named the pieces "by sequence number rather than by topic … a mechanical top-up".

Splitting fixed the wall clock and left cost and count alone, so growth went on. Both splits predate 09-01. Since then the split files added 4 tests and lost 153, so the pattern stopped.

**Guard that misses it.**
- The admission rule `new-cli-spawn-without-reason` (`scripts/test-proof-inventory.mjs:270-276`, `060caa637` 10-21) matches only `spawn|spawnSync|execFile|execFileSync|fork(` with an FGOS token on the same line (`:252-257`). A harness `run(cwd, [...])` call never matches.
- The rule warns only (`:620`).
- Only 15 `// boundary:` markers exist in `test/`.

**Smallest change.**
- Make `isCliSpawn` also match the harness `run(<cwd>, [` form.
- Point `tmpCwd` at the in-process init, so the plain name is the cheap one. `6dc4fd7a3` (10-26) started this.

### 5. "Real everything" doctrine raises cost per test, not count

**Mechanism.**
- `~/projects/.claude/rules/development-rules.md:12` says "Do not add fake data, mocks", and `ak-test/SKILL.md:36` says "No mocks/cheats/tricks".
- The HARDEN red-test phase requires "No mocks of the OS: real child processes, real files".
- The Git spec at `:731` requires "real temporary-repo conformance tests" for every vector.

Agents therefore build real repositories and processes per test. The earlier report measured what each such call costs. This report only names the text that chose it.

**Guard that misses it.** The CPU-per-test warning (`2a1868bb8`, 10-26) only warns and is not tied to a commit.

**Smallest change.** Add one sentence beside principle 8: a real fixture is shared per file when the behaviour does not need its own. That is the F14c direction already in the TEST plan.

### 6. Tests for test tooling and per-experiment test files (small, recent)

- 249 tests prove the test tooling itself: `run-tests`, `test-select*`, `test-timing`, `test-proof-inventory`, `write-test-marker`, `run-test-canary`. Most came from the September test-feedback-cost program (`852171c26` +46, `97357ffc2` +34).
- After 10-20, MAIL added one test file per behaviour-experiment version: `test/scripts/mailbox-behaviour-v7`, `v7e`, `v7f`, `v7g`, `v7h`, `v7i`, `v7j` (53 tests, 7 files, 10-23 to 10-24, `51ccef883` … `45dffcc58`). Each one "pre-registers" an experiment.
- These pass the clone check and checklist item 1, because each one is a new boundary.

## Where principle 8 reached and where it did not

- **Arrived:** `fb8c6e4ae` 2026-10-20 17:50 (`AGENTS.md` L5 q5 and principle 8, Git spec E6) and `f38dfd1d0` 18:13 (the `fgos-run` review checklist §4, the clone ratchet, the `suite:` line).
- **Not updated afterwards:**
  - `domains/coding/skills/fgos-coding-implement/SKILL.md` (last change `f9ea9c219` 10-17). It talks about reuse for code (`:75-80`), never about tests.
  - `core/skills/_shared/ak-cook-worker-contract.md` (`9fa8a08f0` 10-20 12:20).
  - `core/skills/fgos-cook` mentions tests only for write scope (`references/reading-ak-plans.md:20-24`).
  - The AgentKit skills and agents (third-party, outside the repo).
  - The Git spec `:731`, which still asks for a Node route proof of every vector.
- **Effect seen:** after 10-20, Node grew 1746 − 950 = 796 tests in total, and `test/cli` grew 15. Rust took 54% of the growth.

## Review and guard gap (what passes each)

| Guard | Looks at | Passes |
|---|---|---|
| `.githooks/pre-commit` | root files, `.fgos` and convention paths | everything in tests (no test check at all) |
| Clone ratchet (`suiteReport`, fails a run) | byte-identical Node test bodies across files | any copy with one changed byte; any cross-layer or Node/Rust copy; all Rust |
| Duplicate-title list | the same Node title in two files | warning only |
| Admission rules (`checkAdmission`) | added `test/` lines with a direct spawn/`fgos init`/network call | harness `run()` calls, in-process git repos; warning only |
| `suite:` line + `test/suite-baseline.json` | Node count, Rust count (since 10-26), wall, CPU; CPU-per-test warning | any growth; nothing fails on count or cost |
| `fgos-run` checklist §4 | a reviewer reads new tests | anything not reviewed against it; "new module" answers item 1; Rust is outside item 4 |
| Iron Law gate (`src/evolve/iron-law.mjs`) | asks *for* a failing-test-first proof on `src/runner/` etc. | not a brake; 385 `iron-law-evidence.md` files, of which the 375 with an add date in history are from July (11), August (361) and September (3), none since, so not a driver in this window |
| Per-file time limit (`scripts/run-tests.mjs:197`) | 10 min per file | everything short of a hang |

## Not yet proven

- **Which skill each session actually loaded.** Commit messages do not record `/ak:fix` or `/ak:cook` use. The link between those texts and the 1960 fix-commit tests is circumstantial (wording matches, 51 plans name `ak:cook`).
- **AgentKit text at the time.** The quotes come from the files on disk today. Their version history is not in this repo.
- **Layer of deleted files.** Tests in files that no longer exist are counted as "in-process", so the spawning share (13%) is a floor.
- **Review-driven share.** The 14% comes from matching words in commit messages. It is likely an undercount, because many review fixes say only "fix(…)".
- **Total share of cause 3.** The cross-layer and alongside duplicates are measured cluster by cluster: 14 CLI copies, 3 process-liveness files, the parity files, 247 legacy/retired titles. A whole-suite behaviour map was not built.
- **Merge commits.** First-parent rows for merges of `main` into lane branches include the lane's commits, so a few lanes appear twice in the movers table. The aggregates use non-merge commits only and do not double-count.
