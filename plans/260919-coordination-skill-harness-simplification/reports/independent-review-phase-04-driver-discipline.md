# Independent Review — Phase 4 / Unit I15 Driver Discipline

## Verdict

**REQUEST CHANGES.** The structure is right: one domain-neutral driver fragment, one coding-cell fragment, and plan-loop as a thin facade. Projections, drift guards and the full suite are green. But the operational commands that the new skill tells a Lead to run are wrong. The documented close fails at the real CLI (exit 4), the documented fix round fails at the real CLI (exit 4), and the open-cell sequence contradicts `start`'s entry-node dispatch. The Phase 4 exit criterion of ≥60% Lead instruction reduction is also not proven. Phase 5 must not open yet.

## Identity

| Field | Value |
|---|---|
| Candidate branch | `coordination-skill-harness-phase4-driver-discipline` |
| Candidate SHA | `925f361aed6c21f1d2f631d2f6fdaf71fd5456c4` (single commit on base) |
| Worktree | `.claude/worktrees/coordination-skill-harness-phase4-driver-discipline` |
| Base SHA | `2085d88fea9b6aae2b629b3cd4fcd4eec397fcbb` = `main` HEAD at review; `merge-base --is-ancestor` exit 0 |
| Dirty before | clean (`git status --short` empty) |
| Dirty after | clean, apart from this report (mutation probes restored via `git checkout --`) |
| Doer report | [phase-04-driver-discipline-implementation-report.md](phase-04-driver-discipline-implementation-report.md) |

## Changed files (`git diff --name-status 2085d88fe...HEAD`)

- Added — canonical: `core/skills/_shared/coordination-driver.md`, `domains/coding/skills/_shared/coding-cell-policy.md`
- Modified — canonical: `core/skills/fgos-plan-loop/SKILL.md`
- Generated: `.agents/skills/_shared/{coordination-driver,coding-cell-policy}.md`, `plugins/fgOS/skills/_shared/{…}`, `.agents|plugins/…/fgos-plan-loop/SKILL.md`, `.claude/skills/fgos-plan-loop/SKILL.md`
- Tests: `test/skills/coordination-phase4-driver-discipline.test.mjs` (new), `test/skills/coordination-dag-driver-skill-contract.test.mjs` (updated)
- Docs: `plan.md`, the doer report, `CHANGELOG.md`

There are no unrelated changes. Every generated mirror has a canonical source and build evidence.

## Impact analysis

Nothing under `src/` or `bin/` changed, so no source-symbol impact applies and GitNexus `impact` was not needed. File-level risk: `fgos-plan-loop` is a live operator skill, and projecting it ships to every fgOS install via `plugins/fgOS`. A broken command in it breaks real Lead sessions. That is why F1–F3 are rated HIGH even though no code changed.

## Semantic review

| Invariant | Result |
|---|---|
| Driver: 8-step loop + 9 hook slots | ✅ present |
| Driver: no `git/worktree/merge/npm test/phase/plan.md` | ✅ (drift test + probe P1) |
| Driver: genuinely domain-neutral | ⚠️ mostly. Step 8 says "verified commit/evidence identifiers"; minor (F9) |
| Coding-cell policy owned by coding domain | ✅ `domains/coding/skills/_shared/` |
| Coding-cell usable for one cell, no plan sequencing | ✅ content-wise. ❌ duplicates existing `private-cell-worktree.md` (F6) |
| Plan-loop = track sequencing + hook values | ⚠️ restates fragment-owned rules (F7) |
| No raw open/fix/close JSON | ✅ (probe P2) |
| No copied kernel rules / source citations | ⚠️ `actions.mjs`/`composers.mjs` references, Work-field reject list, `assertMutatingDispatchAllowed` citation in the policy (F6/F7) |
| "domain-agnostic" wording corrected | ✅ |
| No new store/ledger | ✅ track status stays `chain` + `plan.md` |
| Explicit close intact | ✅ in runtime (tests 7/8). ❌ **the documented close command is unusable** (F1) |
| No Phase 5/6 work early | ✅ (but see F10 wording) |
| Projections byte-identical | ✅ `npm run build:skills` produced no diff |
| plan.md status honest | ❌ claims "Phase 5 ready" before review/integration (F8) |
| CHANGELOG updated | ✅ present. Baseline number wrong (F12) |

## Findings

| # | Sev | Verdict | Where | Finding | Evidence / fix |
|---|---|---|---|---|---|
| F1 | HIGH | CONFIRMED | `core/skills/fgos-plan-loop/SKILL.md:136-141`, `core/skills/_shared/coordination-driver.md:78` | Documented close passes `--reason`. The `close` allowlist (`bin/fgos.mjs:2754`) has no `reason`, so every close the skill teaches fails. | `fgos coordination close cell-x --action-key sha256:abc --writer-id drv --reason done` → `unknown or unsupported option "--reason"`, exit 4. Fix: drop `--reason`; put the summary in the cell trace/continuity artifact instead. |
| F2 | HIGH | CONFIRMED | `SKILL.md:113-128` | Fix-round `authorize-and-dispatch` examples omit the required `--objective`, and omit `--granted-context-refs`/`--context-refs` for the failed/revised assignment. The Phase 4 test itself needs those refs to dispatch `revise-candidate` and `reviewer-recheck`. | CLI probe → `authorize-and-dispatch requires --objective <text>`, exit 4. Fix: document `--objective`, `--expected-outputs` and `--granted-context-refs <assignmentId>`. |
| F3 | HIGH | CONFIRMED (static + test) | `SKILL.md:79-90` | `start` on a declared protocol with no `--steps` auto-dispatches the entry node's operations: `start.mjs:44`, `composers.mjs:217-220`, test comment `coordination-phase4-driver-discipline.test.mjs:326` ("produce-candidate executed at entry node during start"). The skill's `start` has no `--cwd <worktree>`, then tells the Lead to dispatch `produce-candidate` via `operation`, which is no longer a legal action. The mutating entry op therefore runs with cwd = caller's checkout. From the main checkout it is refused by the Mutation Rule; that refusal was inferred, not executed. | Fix: pass `--cwd <worktree>` on `start`; state that the entry `produce-candidate` runs inside `start`; only review/red-team follow via `operation`. |
| F4 | HIGH | CONFIRMED | `coordination-phase4-driver-discipline.test.mjs:109-128`; plan Phase 4 Exit | The ≥60% Lead instruction reduction is not proven. The test hard-codes a baseline of 3,700 words, but Phase 0 measured **5,160** ([phase-00-unit-0c-baseline-replay-measurement.json](phase-00-unit-0c-baseline-replay-measurement.json)). It counts only `SKILL.md`, yet the Lead must now also load the driver fragment (1,126) and cell policy (780): 3,077 words, a **40.4%** reduction. "No extra dispatch wave / no weaker evidence" was not measured with the Phase 0 harness. The crash/resume case is only a `chain` read, with no simulated crash. | Re-measure with the Phase 0 harness on the full Lead load, or record an explicit owner decision on how to count the budget. Fix the test baseline. |
| F5 | MEDIUM | CONFIRMED | Phase 4 tests 7-8 | The lifecycle tests call use-cases directly and bypass the CLI flag allowlist. No test checks skill-documented commands against the real CLI surface, which is why F1/F2 passed green (probe P4). | Add a contract test that parses each `fgos coordination <sub>` block in the skill and fragments, and asserts every flag is in `ALLOWED_COORDINATION_FLAGS[sub]` with required flags present. |
| F6 | MEDIUM | CONFIRMED | `coding-cell-policy.md` §1 | This is a lossy duplicate of the existing `core/skills/_shared/private-cell-worktree.md`, which code-panel still uses. It drops: refusal if the dir exists, branch reuse without `-b`, the objective-text cwd guard, and the `$base` record. The result is two sources of truth for the same rule (RUL11/DRY). | Reference or absorb `private-cell-worktree.md` so exactly one owner remains. Do not fork it. |
| F7 | MEDIUM | CONFIRMED | `SKILL.md:16-31,108,132,163-164` | Plan-loop restates rules the fragments own: the caveat rule (in driver, policy **and** plan-loop twice), merge-after-close, the testedSha non-inference, and the Work-authority reject field list (a kernel rule). This fails the exit criterion "plan-loop restates no rule owned by either fragment". | Replace with pointers. |
| F8 | MEDIUM | CONFIRMED | `plan.md:3`, Gates, parallelism graph; doer report §7 | Status "Phase 5 ready", "Satisfied (Unit I15)" and graph `I15 -> Phase 5` are written before independent review and integration. | Mark I15 as "candidate / under review". Unlock Phase 5 only after APPROVE + integration. |
| F9 | LOW | PLAUSIBLE | `coordination-driver.md` Step 8 | "verified commit/evidence identifiers" leaks coding vocabulary (not on the drift list). | Say "evidence identifiers". |
| F10 | LOW | CONFIRMED | `SKILL.md:24`, `coding-cell-policy.md:3` | Both point at `fgos-code-change`, which is only created in Phase 6. | Say "Phase 6" or drop it. |
| F11 | LOW | CONFIRMED | `docs/how-to/author-a-plan-loop-track.md:146` | Cites "`SKILL.md` §5 step 5", which no longer exists. | Repoint to the policy's tested/integrated identity section. |
| F12 | LOW | CONFIRMED | doer report, CHANGELOG, plan.md | Numbers drift: "~3,700 words / ~68%" (real baseline 5,160, or 5,111 at base). Focused matrix is 166 in the report vs 177 reproduced. Canonical `core/skills/fgos-plan-loop` links `../_shared/coding-cell-policy.md`, which resolves only in projections, not in the source tree. | Correct the figures; note the link-resolution convention. |
| F13 | LOW | CONFIRMED | `SKILL.md` hook table | The old rule "past the 3-round cap, remaining non-proof-gap findings are `deferred` and named in the trace" was dropped. | Restore it in `adaptation bounds`. |

## Mutation / negative probes (restored after each)

| Probe | Mutation | Phase 4 suite result |
|---|---|---|
| P1 | Append "worktree" to the canonical driver fragment | 6 pass / **2 fail** (drift + projection) ✅ |
| P2 | Append a raw `{"kind": "declared-protocol", … "type": "operation"}` JSON block to plan-loop | 6 / **2 fail** ✅ |
| P3 | Hand-edit the `.agents/skills/_shared/coordination-driver.md` mirror | 7 / **1 fail** ✅ |
| P4 | Unmodified tree, where the skill already documents invalid `close --reason` | 8 / 0: **no guard** ❌ (F5) |
| P5 | Rename `fgos coordination close` → `finish` in plan-loop | 6 / **2 fail** ✅ |

## Commands and results

| Command | Exit | Result |
|---|---|---|
| `git merge-base --is-ancestor 2085d88fe HEAD` | 0 | base correct |
| `npm run build:skills` | 0 | no working-tree diff |
| `git diff --check 2085d88fe..HEAD` | 0 | clean |
| `node bin/fgos.mjs coordination close cell-x --action-key sha256:abc --writer-id drv --reason done` | 4 | unsupported `--reason` (F1) |
| `node bin/fgos.mjs coordination authorize-and-dispatch cell-x --action-key sha256:abc --writer-id drv --cwd ../x --reason fix` | 4 | requires `--objective` (F2) |
| `env -u CLAUDE_CODE_SESSION_ID node --test` (8 focused suites listed in the doer report) | 0 | 177 tests, 177 pass, 0 fail |
| `env -u CLAUDE_CODE_SESSION_ID npm test` | 0 | 7765 tests, 7692 pass, 0 fail, 8 skipped, 65 todo, 27 suites |

## Phase 5 gate

**Phase 5 may NOT open.** It needs:

1. F1–F3 fixed, and a CLI-surface contract test (F5) proving the documented commands parse.
2. F4 resolved by a real Phase 0 harness measurement of the full Lead load, or an explicit owner ruling on how the budget counts fragments.
3. F6–F8 fixed.
4. Re-review, then integration to `main`.

F9–F13 can ride with the same fix commit.

## Unresolved questions

- F4: does the plan's "Lead instruction-token reduction" count loaded shared fragments? Reviewer reading: yes, because the Lead must load them to operate. This is an owner call if disputed.
- F6: should `coding-cell-policy.md` absorb `private-cell-worktree.md` now (code-panel repointed), or reference it until Phase 6?

---

## Re-review round 2 — remediation `7a66d481f`

**Verdict: REQUEST CHANGES (minor), with one owner decision pending.** All three HIGH defects (F1–F3) are fixed and verified against the real CLI and use-cases. What remains is two small doc/test gaps, plus F4, which is an owner call rather than a defect.

### Identity

| Field | Value |
|---|---|
| Candidate HEAD | `7a66d481fed3a17b732ddec14bf511abc0728770` (on top of review commit `ff5f9f9e1`) |
| Base | `2085d88fe` = `main` HEAD; unchanged |
| Dirty before/after | clean / clean apart from this report; probes restored via `git checkout --` |
| Scope `ff5f9f9e1..HEAD` | 14 files: canonical skill and 2 fragments + mirrors, Phase 4 test, how-to, plan.md, doer report, CHANGELOG. No `src/`/`bin/` changes, so no symbol impact |

### Round-1 findings

| # | Status | Evidence |
|---|---|---|
| F1 | ✅ fixed | Close examples no longer pass `--reason`. The contract test fails if it is re-added (probe Q1). |
| F2 | ✅ fixed | Examples carry `--objective`, `--reason`, `--granted-context-refs` and `--expected-outputs`. String values normalize through `normalizeStringArray`, and `contextRefs` defaults to `grantedContextRefs` (`composers.mjs:385-386`). |
| F3 | ✅ fixed | `start` passes `--cwd ../<track>-<cell-id>` and states that the entry `produce-candidate` runs inside `start`. Evaluation proceeds through `operation`. |
| F4 | ⚖️ **owner decision** | The doer chose the facade-only reading: 1,240 words vs 5,160, a 76% cut. Combined Lead load is 1,240 + 1,141 + 733 = **3,114, a 39.7% cut**. The test adds an ad-hoc `combined <= 3300` cap. The reviewer does not accept or reject this interpretation (it is the user's decision; see below). Dispatch-count parity (3 and 5) is now asserted. |
| F5 | ⚠️ partial → R2 | A new contract test catches unknown flags and `close --reason`. See R2. |
| F6 | ✅ fixed | The policy points to `private-cell-worktree.md`; bash duplication and the source citation are removed. The link breaks in `.agents` (R4). |
| F7 | ✅ fixed | The caveat rule is referenced once; the Work-field list and source-file citations are gone. |
| F8 | ✅ fixed | plan.md says "candidate under review" and "Phase 5 (blocked)". |
| F9–F12 | ✅ fixed | Driver Step 8 wording; the `fgos-code-change` mention is marked "future, Phase 6"; the how-to now points to the policy's identity section; numbers corrected. Minor drift: plan says 1,233 words, actual is 1,240. |
| F13 | ⚠️ **regressed → R1** | See R1. |

### New findings

| # | Sev | Verdict | Where | Finding | Fix |
|---|---|---|---|---|---|
| R1 | MEDIUM | CONFIRMED | `SKILL.md` hook `adaptation bounds` | The F13 restore now says "proof-gap findings escalate to **human**" after the 3-round cap. The previous skill and `docs/how-to/author-a-plan-loop-track.md:221-237` say the disposition is **forced to `accepted -> Proof: escalated-to-full`** and the cell closes after the full proof run, with no human needed. This is an unrequested behavior change that contradicts a live doc and lowers autonomy (priority #2, "Release con người"). | Restore "proof-gap past cap → forced `accepted`, `Proof: escalated-to-full`, full proof before close". |
| R2 | MEDIUM | CONFIRMED | `coordination-phase4-driver-discipline.test.mjs:342-455` | (a) The allowlist is a hand copy of `bin/fgos.mjs` `ALLOWED_COORDINATION_FLAGS`, so a future CLI change will not be detected. (b) Required flags are checked only for `close`/`authorize-and-dispatch`. Probe Q3 removed the CLI-required `--objective` from the plan-loop `operation` example: the contract test **still passed** and only the projection check tripped. | Spawn the real `bin/fgos.mjs coordination <sub> …` for each documented example against a nonexistent id, and assert the error is neither "unknown or unsupported option" nor "requires --…". This covers both gaps with no `src/` change. |
| R3 | LOW | CONFIRMED | test 8 | Wave parity is claimed in comments only; just the dispatch count is asserted. "Cold resume" is a same-process re-query, not a new process. | Assert waves from event ordering, or reword the claim. |
| R4 | LOW | CONFIRMED | `coding-cell-policy.md` §1 | The link `../../../../core/skills/_shared/private-cell-worktree.md` resolves in canonical and `plugins/`, but **not** in `.agents/skills/_shared/`, which is the copy the Claude wrapper loads. The prose names the sibling, so the damage is small. | Link the sibling `private-cell-worktree.md` (it resolves in both projections), matching plan-loop's convention. |

### Probes (restored after each)

| Probe | Mutation | Result |
|---|---|---|
| Q1 | Add `--reason "x"` to the plan-loop close example | contract test **fails** ✅ (+ projection) |
| Q2 | Add `--bogus-flag` to the `operation` example | contract test **fails** ✅ |
| Q3 | Remove the required `--objective` from the `operation` example | contract test **passes** ❌ (only the projection test fails) → R2 |
| Q4 | Add "worktree" to the driver fragment | drift test **fails** ✅ |

### Commands

| Command | Exit | Result |
|---|---|---|
| `npm run build:skills` | 0 | no working-tree diff |
| `git diff --check 2085d88fe..HEAD` | 0 | clean |
| focused: 8 round-1 suites + `test/setup/skill-wrappers.test.mjs` | 0 | 287 tests, 287 pass, 0 fail |
| `env -u CLAUDE_CODE_SESSION_ID npm test` | 0 | 7766 tests, 7693 pass, 0 fail, 8 skipped, 65 todo, 27 suites |

### Phase 5 gate

**Not yet.** It needs R1 and R2 fixed (R3/R4 can ride along), an owner ruling on F4, then a short re-review and merge to `main`.

### Owner decision needed (F4)

- **Option A — facade-only (doer's reading):** 76% cut, which passes. Justification: the driver fragment is shared platform doctrine, amortized across plan-loop, architecture-panel, panel and code-change. Risk: the literal Exit wording, "Lead instruction-token reduction", is not met for plan-loop on its own until other facades adopt the fragment.
- **Option B — full Lead load:** 39.7%, which fails. The facade or fragments would need about 1,050 more words cut, likely stripping operational detail.
- **Option C — accept A and amend the plan's Exit wording**, e.g. "facade ≥60%, combined load bounded at ≤3,300 and re-measured after Phase 5 amortization". This makes the rule explicit rather than an ad-hoc test constant.

Reviewer recommendation: **C**. The split is architecturally right, and B would trade clarity for a number. The plan text, however, must say what is being counted.

### Owner ruling on F4 (2026-09-27)

The owner chose **Option C**. The doer must change the Phase 4 `### Exit` bullet in `plan.md` from "≥60% Lead instruction-token reduction" to an explicit rule:

- the facade (`fgos-plan-loop/SKILL.md`) is at least 60% smaller than the Phase 0 baseline of 5,160 words;
- the combined Lead load (facade + `coordination-driver.md` + `coding-cell-policy.md`) is at most 3,300 words;
- the combined load is re-measured after Phase 5, once architecture-panel and panel also use the driver fragment.

The test's `combined <= 3300` bound then enforces a plan rule and is no longer an ad-hoc constant. With this ruling F4 is closed as a finding. It still has to land together with R1/R2 before re-review.

---

## Re-review round 3 — `0983c28b4`

**Verdict: REQUEST CHANGES (one targeted test fix).** R1, R3, R4 and the F4 ruling have all landed correctly. R2's goal is met: the contract test now runs the real CLI and catches probe Q3. However, the new test executes the documented `start`, which is a **real mutating dispatch that spawns a live agent**. It is currently harmless only because of a placeholder-substitution bug.

### Identity

| Field | Value |
|---|---|
| Candidate HEAD | `0983c28b4f7dde1d8e39484df81aad9178451095` (on top of `e2c6f5784`) |
| Base | `2085d88fe` = `main`; unchanged |
| Scope `e2c6f5784..HEAD` | 8 files: plan.md Exit, SKILL.md hook row, cell-policy link (+ mirrors), Phase 4 test. No `src/`/`bin/` changes |
| Dirty before/after | clean / clean apart from this report; probes restored; scratch probe dirs removed |

### Round-2 items

| # | Status | Evidence |
|---|---|---|
| F4 (owner C) | ✅ | Phase 4 `### Exit` now states facade ≥60% vs 5,160, combined ≤3,300, re-measure after Phase 5. The test comment points to it. |
| R1 | ✅ | `SKILL.md:53`: past the cap, a proof-gap is forced to `accepted -> Proof: escalated-to-full`, "no human escalation". Matches the how-to at lines 221-237. |
| R2 | ✅ goal met, ❌ see R5 | Hand-copied allowlist removed. Every documented `fgos coordination …` runs through `bin/fgos.mjs`. **Probe Q3** (remove `--objective` from `operation`) now **fails** the contract test. Negative guards for `close --reason` and `authorize-and-dispatch` without `--objective` are present. |
| R3 | ✅ | "wave parity" wording removed; dispatch counts (3/5) asserted. |
| R4 | ✅ | Sibling link `private-cell-worktree.md` resolves in `.agents` and `plugins`. The canonical `domains/…/_shared/` copy does not resolve, matching plan-loop's stated projection convention. |

### New findings

| # | Sev | Verdict | Where | Finding | Fix |
|---|---|---|---|---|---|
| R5 | HIGH | CONFIRMED | `coordination-phase4-driver-discipline.test.mjs` test 7, `substitutePlaceholders` | (1) **The probe executes real, state-advancing commands.** When `start` passes flag validation it opens a session and dispatches the mutating entry `produce-candidate` on an auto-detected executor. Replaying the test's exact `start` invocation (`--dir <tmp>`, `--cwd <tmp>/dummy-worktree`, `env -u CLAUDE_CODE_SESSION_ID`) wrote a default runner config (`executor: claude`) and **spawned a real Claude doer: 146 s, exit 0, `agent-result.json status: done`**. (2) The test avoids this only by accident: `replaceAll('<track>')` / `('<cell-id>')` run **before** `replaceAll('../<track>-<cell-id>', dummyWt)`, so that rule never matches. `--cwd` becomes `../test-track-cell-01` relative to the repo checkout, which does not exist, so `start` fails fast. Proven: node replay of the substitution chain prints `--cwd "../test-track-cell-01"`. If that sibling path ever exists (plan-loop's own naming creates `../<track>-<cell-id>` worktrees), or once someone "fixes" the ordering, `npm test` would spawn a paid headless agent with write access in that directory. (3) Any non-validation error counts as a pass, so the probe proves only "not rejected by the flag parser". That is fine for its purpose, but it must never reach dispatch. | Make the probe **incapable of dispatching**: pre-write `<tmp>/.fgos/config.json` with a runner whose executor cannot spawn (or run the probe with a `PATH` holding only `node`, and assert "no executor"). Add an assertion that no `assignments/*/runs/` directory appears under `<tmp>/.fgos`. Fix the substitution order (most-specific pattern first). Assert the probe's failure reason is the expected pre-dispatch one. |
| R6 | LOW | CONFIRMED | `plan.md` Phase 4 `### Exit` | The rewrite dropped the original "…with no weaker evidence or extra dispatch wave" clause. The owner ruling concerned only the word-count basis. Dispatch-count parity is tested, so the loss is textual only. | Restore the clause as its own bullet. |

### Probes

| Probe | Result |
|---|---|
| Q3 (remove required `--objective` from `operation`) | contract test **fails** ✅ (+ projection) |
| Replay the test's `start` probe with correct `--cwd` substitution | **real agent spawned, 146 s** ❌ → R5 |

### Commands

| Command | Exit | Result |
|---|---|---|
| `npm run build:skills` | 0 | no working-tree diff |
| `git diff --check 2085d88fe..HEAD` | 0 | clean |
| focused: 8 suites + `test/setup/skill-wrappers.test.mjs` | 0 | 287 / 287 pass |
| `env -u CLAUDE_CODE_SESSION_ID npm test` | 1 | 7766 tests, 7692 pass, **1 fail**, 8 skipped, 65 todo |
| `node --test test/runner/coordination-research-fan-out.test.mjs` ×3 | 0 | 14/14 pass each run |

The single full-suite failure is `R5 concurrency … maxConcurrency: 2 …` in `test/runner/coordination-research-fan-out.test.mjs`. That file is **not touched** by the candidate, passes 3/3 in isolation, and passed in both earlier full-suite runs (rounds 1 and 2). This matches the timing instability already recorded as LOW debt in the plan status, so it is classified as a pre-existing load-sensitive flake, not a regression.

### Phase 5 gate

**Not yet.** Fix R5 (and R6 in the same commit), then a quick round-4 check: the R5 probe proves no dispatch occurs, and the full suite is green. Everything else is done, and no further semantic re-review is needed.

---

## Re-review round 4 — `38e552bb9`

**Verdict: APPROVE.** R5 and R6 are closed. No open finding is HIGH or MEDIUM.

### Identity

| Field | Value |
|---|---|
| Candidate HEAD | `38e552bb90c693a51783ae19a7cbec6fe32ad064` (on top of `8cc7a59ab`) |
| Base | `2085d88fe` = `main`; unchanged |
| Scope `8cc7a59ab..HEAD` | `plan.md` (+1 line), `coordination-phase4-driver-discipline.test.mjs` (+88/-4). No `src/`/`bin/` changes |
| Dirty before/after | clean / clean apart from this report; scratch probe dirs removed |

### Items

| # | Status | Evidence |
|---|---|---|
| R5 | ✅ | Substitution order is fixed: `../<track>-<cell-id>` → `dummyWt` comes first. Before any command runs, the probe writes `<tmp>/.fgos/config.json` with an executor that cannot run. `start` must fail with a pre-dispatch block. After the loop the test asserts: no `assignments/*/runs/*` entries, and no `run.json`/`agent-result.json` anywhere under `<tmp>`. |
| R6 | ✅ | `plan.md:796` restores "no weaker evidence or extra dispatch wave". |

### Independent layer proof (manual CLI replay, not a test mutation)

| Layer isolated | Result |
|---|---|
| A: bogus runner config, full `PATH` | exit 4 in 0 s: `dispatch decide blocked operation … cross-provider egress target`; no `runs/` ✅ **sufficient alone** |
| B: `PATH=$(dirname node)` only, no config | **spawned a real agent (80 s, `runs/01/agent-result.json`)**. On this machine `claude` and `codex` live in node's global bin dir ❌ |

The test combines A and B, so it is safe. B alone gives no protection on npm/nvm-global installs.

### Residual (non-blocking)

| # | Sev | Finding | Suggested follow-up |
|---|---|---|---|
| R7 | LOW | The `PATH`-isolation comment/claim is misleading: layer A is the real guard. A future edit that drops the config write would bring back a live-agent spawn in `npm test`, and the `start` assertion would only notice after the fact. | Keep A and label it the load-bearing guard in a comment, or add a test-only env knob that refuses dispatch outright. Can ride with a Phase 5 commit. |

### Commands

| Command | Exit | Result |
|---|---|---|
| `npm run build:skills` | 0 | no working-tree diff |
| `git diff --check 2085d88fe..HEAD` | 0 | clean |
| focused: 8 suites + `test/setup/skill-wrappers.test.mjs` | 0 | 287 / 287 pass, 7 s, no probe dirs left in `/tmp` |
| `env -u CLAUDE_CODE_SESSION_ID npm test` | 0 | 7766 tests, 7693 pass, 0 fail, 8 skipped, 65 todo, 27 suites |

### Phase 5 gate

**Phase 5 may open once this branch is merged to `main`** and the plan status records the integration SHA. The Phase 4 Exit criteria, as amended by the owner's ruling (option C), are all satisfied.
