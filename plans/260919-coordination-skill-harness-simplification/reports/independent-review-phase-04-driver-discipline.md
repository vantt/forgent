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
