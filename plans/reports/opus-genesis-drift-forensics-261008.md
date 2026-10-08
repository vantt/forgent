# Genesis-to-today forensics: why fgOS drifts and bloats

Date 2026-10-08. Read-only git/file evidence. Main checkout HEAD `2bc76ced1`. All line counts = `git diff --shortstat <empty-tree> <rev> -- <path>` on first-parent main (counts include md/json/log lines). Nothing replayed, nothing installed, no tests run.

## 0. Short answer

fgOS was founded as a **self-improving development harness that measures progress by how much of itself it can prove**, not as a product with an outside tenant. Every later mechanism (gates, reviews, laws, evidence ledgers, acceptance clauses) inherits that and has an "add" path but no "stop/size/delete" path. Five structural causes repeat in all four episodes:

1. **No outside tenant pulls the size down. The genesis target was harness parity with bee plus "self-improving" (F5).** Mission #1/#2 was added later as prose (D-ADR0035, 2026-08-17) with no metric. High confidence.
2. **Completeness clauses with no budget.** Phrases like "every claim exactly once", "goals not to be cut", "no scope reduction by omission" and RUL11's "gom tới khi hết, quy mô không bao giờ là lý do miễn trừ" make size an illegal stop reason. Repo-wide grep: zero line, size or time budgets in plans, src, tests or scripts. The advisory plan explicitly **refused** a numeric threshold. High confidence.
3. **Review and verification loops that only add code.** Findings lists (C/H/M/L, R1-R4, A1-A8, "rounds") turn into phases. Each fix must ship with new tests and evidence. No reviewer is asked "what should be deleted or descoped?". High confidence.
4. **Proof is the output that gets rewarded.** docs+plans = 75.9 MB against src = 3.7 MB (20:1), 1,355 committed log/json/jsonl evidence files (31.8 MB), and 1 MB test logs committed into plans. Being "done" requires artifacts, so producing artifacts is what gets produced. High confidence.
5. **The plan is written and locked before any live evidence. When the live gate is blocked, the agent widens into whatever layer blocks it.** Self-declared "done" was later found unwired. Medium-high confidence.

The opposite hypothesis has partial support (§4c). The JSONL state layer, admission/lock correctness, `bind()` and the Workflow runner paid off. They are also the small, early, outside-shaped parts.

A prior report already reached causes 1-3 on 2026-09-29 and proposed a quarterly LOC cap (`plans/reports/deep-comparison-260929-1446-harness-simplicity-herdr-cook-plan-vs-fgos.md` §6, §8.7). No cap exists in the repo today. **Diagnoses become reports, not checks.** That is cause 6 (§4a).

## 1. Genesis

| Date | Commit | Fact |
|---|---|---|
| 07-13 | `f6139bf57` | Initial commit |
| 07-13 | `a21d9446c` `READEME.md` (typo in the original), 7 lines | "Forgent (fgOS) is the platform layer for building and running agent applications … so developers can forge new agents instead of building everything from scratch." |
| 07-13 | `2930a89fc` … `71a78e5f3` | Day 1 was not product. It was a **reference-learning system** (`distill`) scanning other harnesses: beegog, repository-harness, beads, symphony and marketing-cockpit. fgOS learned its shape from harnesses. |
| 07-14 | `823926cc7` | bee onboarded "as development harness (scaffolding, not product)… bee orchestrates forgent's own development… **Retire bee when forgent reaches harness parity on the maturity ladder.**" |
| 07-14 | `e9ff70db7` `docs/platform-foundations.md` | "Luật nền platform forgent (Phase 0 — **compound-learning stack**)". L5 DoD = "agent lạ trả lời được sáu câu… không phải bằng feature list". L6 ladder F0→F5, where F5 = "**Self-improving** — học từ chính vận hành". L8: every doctrine rule gets an anchor-phrase test. |
| 07-14 | `e034e3b6d`..`31c13009e` | Phase 1 state layer (zero-dep, JSONL event log, FSM+CAS, one CLI door) was built in one day and is still alive today (`src/state` ≈12.3k lines, flat since 09-01). |

Original shape on 07-20: 35.7k lines total, src 8.5k, test 18.5k, docs 4.5k. That was a one-door state CLI plus a learning vault.

**Root reading.** None of the founding documents names an external tenant or project. The success ladder (L6) and the exit condition for bee ("harness parity") are both self-referential. L5 defines done as "explainable to a stranger agent", which is a documentation criterion. The mission boundary arrived 35 days later (`b2444f3d2` 2026-08-17, "self-dev is a gated dogfood lane") as a decision record, with no ladder rung, metric or check. L6 was never superseded.

## 2. Growth curve

### 2a. Snapshots (lines)

| Date | src | test | docs | plans | .fgos | apps+pkgs | total |
|---|---|---|---|---|---|---|---|
| 07-20 | 8.5k | 18.5k | 4.5k | 0 | 0.1k | 0 | 35.7k |
| 08-01 | 15.2k | 33.1k | 49.1k | 15.2k | 5.4k | 0 | 135.9k |
| 08-15 | 27.1k | 56.2k | 191.1k | 26.3k | 20.5k | 0 | 373.6k |
| 09-01 | 41.8k | 89.7k | 302.3k | 35.7k | 51.2k | 0 | 590.3k |
| 09-15 | 80.2k | 149.6k | 567.6k | 86.9k | 201.4k | 16.6k | 1,189k |
| 10-01 | 101.3k | 201.8k | 803.1k | 62.1k | 203.4k | 25.3k | 1,674k |
| 10-08 | 82.2k | 162.2k | 804.3k | 182.0k | 203.9k | 44.3k | 1,735k |

- Growth multiples 07-20→10-08: docs ×178, plans 0→182k, .fgos ×1,800, src ×9.7, test ×8.8. Test stays about 2× src throughout.
- Fastest areas: `docs/architect` (19.3 MB) and `docs/platform` (18.9 MB). Of these, `*/agent-coordination` = 18.4 + 18.5 MB, and **868 of 937 blobs are byte-identical across the two trees**. That is 37 MB of docs, duplicated, for an engine retired 6 days ago and still not deleted. `docs/history` = 13.3 MB, 881 dirs.
- `src/runner/dispatch`: 0 (08-15) → 8.1k (09-01) → 24.9k (09-15) → 31.5k (10-01). Since 09-15 it accounts for 443 of all src file-touches, against 163 for the next area (`src/verbs`). It is the gravity well.
- Plans week 10-01→10-08: +120k lines. `plans/261006-1415-fgos-single-door-mechanisms` is 6.1 MB, about 5 MB of which is four committed 1 MB `npm test` logs plus a 1 MB evidence JSON.
- Commit cadence: 8,701 commits in 87 days (~100/day). Weekly net insertions peak at +450k (W36) and +349k (W38).
- August commit mix: 4,269 commits, of which 2,425 are `docs(tsk-*)`. Among those: 433 "retrospective synthesis", about 200 "Iron Law" evidence, and about 160 "shape/lock CONTEXT/clarify". Only 199 are `feat`. The coding workflow's ceremony per item was the main output of August.

### 2b. Retired or abandoned subsystems

| Subsystem | Size | Lifetime | Retired by |
|---|---|---|---|
| bee/workshop vendored tree (scaffolding copies) | −94.3k | ~1 d | `e99998633` 07-14 (untracked, not built) |
| judge-subprocess machinery | −6.2k | UNPROVEN birth | `794df20e0` 08-07 |
| tool-registry event-sourced registration; per-tier executor overrides | not measured | ~weeks | `7fbe7e4b2`, `d5e32ccb9` 08-16 |
| `docs/decisions/*.md` corpus (moved to specs) | −3.2k | ~5 wk | `4722361ae` 08-17 |
| mission-lite | in a +3.5k/−1.7k commit | UNPROVEN | `626e057b1` 09-01 (replaced by CoordinationSession, so the next, bigger thing) |
| `fgos-code-panel` skill | stubbed | 9 d (09-05→09-14) | `e859e71d6` |
| `readOnlyExecutorRedirects`, legacy executor aliases | small | weeks | `415320994`, `60d14e8c7` 09-16/17 |
| dispatch.claim, 2 of 4 shadow binders | small | weeks | `3ee9b52ea`, `df527cb5d` 09-29 |
| `capability-match.mjs`, DemandFacts, `fgos-plan-loop` | P2 commit −2.2k | **4 d** (09-27→10-01) and 26 d | `6527596eb` 10-01 |
| Work stage FSM (L3 sequencer #1 of 3) | −4.7k | 59 d (08-04→10-02) | `07bd0c594` 10-02 |
| **L4 coordination engine** (session engine, DAG scheduler, FlowDefinition, 13 protocols, Rust coordination-state) | peak ≈25.4k src + 49.2k test; −79.2k at retirement | **31 d** (`626e057b1` 09-01 → `2180b4e72` 10-02) | `2180b4e72` (plus `packages/coordination-state` −384 after) |
| agent-coordination docs (×2 trees) | 37 MB | still alive | **not retired** |
| Doc-unification tooling (branch only) | 14.8k code+test plus 6.2k JSON baselines (22.8k gross inserted) plus 4.7M lines of inventory and registry artifacts (49.7 MB `identity-registry.json`) | 13 d of activity in 09-25→10-08 | frozen by owner A5 (10-07), not deleted; revert `ab69e3d6b` removed only 126 lines |
| Advisory Phase 02 (uncommitted in worktree) | +1,430 src, +3,259 test, 51 files | 2 d, unfinished | not retired; still uncommitted |

Pattern: the heaviest retired system lived 31 days. Short-lived ones (4-9 days) cluster in September, which shows the add-then-delete cadence speeding up.

## 3. Episodes

### E1. Coordination engine (09-01 → 10-02)

- **Small goal.** Step 07 (`plans/260831-1637-step07-inline-assignment-mvp`, `c425fe6e7`): "Prove Vision V-012 on the **smallest slice**: two one-shot, read-only consumers". Out of scope: "`coordinationId`/ledger … Step 08 protocols".
- **Already proven by hand.** The "manual Master Coordinator operating shape" was about 1,050 lines of prose (`master-coordinator.md` 568 + `coordination-operating-harness.md` 482, created 08-31). Step 09 says it "turns the proven manual … shape into the first standalone runtime-facing … fixture".
- **First widening decision.** Step 08 (`33494fd66`, created **one day after** Step 07): five goals at once. Agent-led plus declared protocols, heterogeneous cohorts, "one real Group Cognition framework", and "**interactive and headless operation over the same semantic engine**". Locked Product Decisions were made before code.
- **What kept widening it.**
  - (a) Two days later, Step 09 was cut into three plans (MVP1-2, 3-5, 6-9).
  - (b) Distrust of the LLM became code: specialist bindings, quorum, driver authorization, stale-action proof, CAS. See the 2.7k-line `coordination-driver-authorization.test.mjs`.
  - (c) The engine was dogfooded to build the engine. Of 307 sessions in `.fgos/backups/coordination-sessions-backup.tar.gz`, about 228 are fgOS's own code-panel/recheck/phase sessions and the rest are test/probe leaks. Zero sessions in this repo targeted another project. The 09-29 report counts 11 sessions across `~/projects`; not re-verified.
  - (d) A "simplification" plan (`260919-…harness-simplification`) proposed **adding** "a shared control layer" instead of deleting.
- **Size curve.** src 7.2k (09-02), 14.3k (09-04), 17.8k (09-15), 25.4k (10-01). Test 7.7k, 24.5k, 30.2k, 49.2k.
- **Where a numeric check stops it.** On 09-04 the engine was 14.3k src + 24.5k test, about 13× the prose that already worked. A rule like "runtime may not exceed N× the proven manual prose without a usage count from a non-fgOS project" fires on day 3.
- **Ending.** Retired by the request-to-run track. Measured: old engine 3-13 lead commands and 15 min-7 h 40 per advisory session, against the new Workflow's 1 command and 8 min 20 s (`…p4…/reports/acceptance-case-2.md`). The same-question comparison was **NOT RUN**.

### E2. Doc-unification Phase 02 tool (09-25 → frozen 10-07)

- **Small goal.** End the docs split: "one platform claim → one canonical owner". Plan status: "Proposed — not authorized"; "documentation-only until a phase explicitly includes tooling".
- **Widening clauses.**
  - Locked decisions §3: "Migration is **claim-based**"; #5 "Completion … is **atomic**"; #12 "**No scope reduction by omission**".
  - Phase 02 gate: "every in-scope source is accounted for exactly once"; "every heading/unheaded content block passes the source-coverage floor"; "every retained claim has exactly one proposed target owner".
  - Claim-level completeness over 1,700+ files cannot be met by hand, so it forces an extractor, a registry and conservation ledgers.
- **What kept widening it.**
  - (a) Review rounds R1-R4, then "residual", then "re-review": 6 fix commits on 09-25 and 18 tooling commits on 09-26 (+5.1k), e.g. "build detached Rust binaries for Phase 02 verification".
  - (b) A verifier that re-builds the inventory in a detached worktree with `npm ci` plus a Rust release build plus the full suite (`phase-02-execution-record.md:73`).
  - (c) Phase 06 amendments A1-A8 within 2 days. A4 alone opened 5 Medium fixes (M1-M5 seeded-mutation packs, sensitivity scores).
  - (d) Scope includes migrating 37 MB of docs for the engine retired in E1 (A8: the "scheduler-outcome-enum" debate over retired code).
- **Stop point.** End of 09-25: +9.3k tooling lines on a "documentation-only" plan. A rule like "tooling > X lines in a docs plan = stop and ask" fires on day 1.
- **What actually stopped it.** The owner's A5 threat-model statement: "the real risk is an honest agent dropping … content, not a reviewer trying to forge approval. The migration tooling is single-use." That is a threat-model correction, applied 12 days late.

### E3. Advisory completion Phase 02 (10-06 → now)

- **Small goal.** "Một skill mỏng dùng Workflow/Pattern/Unit/bind sẵn có". Five contracts.
- **The owner asked the size question directly.** `owner-challenges-and-rationale.md:12` asks: "Có giữ được chức năng với skill nhỏ … khoảng 151 dòng?" The plan answers: "Sự đơn giản nằm ở ít owner/contract …, **không phải giữ một số dòng**". Line 54 adds: "**Không đưa một numeric threshold bịa ra**". Phase 01 exit claims "complexity budget … locked", but the budget is qualitative only. **This is the exact point where the numeric check was offered and declined.**
- **Widening clauses.**
  - "Mục tiêu không được cắt" (six non-cuttable goals).
  - "Seven live scenarios ACCEPT before … cutover; failure blocks this plan."
  - The plan's own Exclusions forbid "provider/transport/confinement change". Yet the uncommitted diff touches `src/runner/dispatch/{confinement/*,transport.mjs,herdr-round.mjs,herdr-reconcile.mjs,settlement.mjs}` (+870/−130) and the execution runner (+349).
- **Mechanism.**
  - The live gate is blocked by environment readiness: trust dialog and read-only provider readiness (`journals/2026-10-07-…-live-gate-blocked.md`). The agent repairs whatever layer blocks the gate.
  - Review then adds "atomic no-clobber publication" and "bounded-memory capture" with a 512 MiB smoke test. Neither is among the five declared contracts.
  - 3.3k test lines against 1.4k src.
  - Two days of work are **still uncommitted** in the worktree.
- **Stop point.** At the first blocker outside the declared contracts, i.e. the first edit to a path the Exclusions forbid. A path allowlist check fires immediately.

### E4. Dispatch hardening chain (09-20 → 10-08)

- **Small goal.** It started from one review report: `plans/reports/dispatch-execution-engine-architecture-review-260920.md`, 1,789 lines / 318 KB.
- **First widening.** `plans/260920-2217-dispatch-engine-hardening` converted the review's findings (C1-C2, H1-H13, M1-M16, L1-L13) into **10 phases**. That includes Phase 06, a provider capacity rotator that "phải xong trước khi bật global account inventory", while the plan admits the host "chưa có" any inventory. That is building for a non-existent load.
- **Chained follow-ups.** Each was born from the previous one's audit:
  - `260928 …liveness-hardening`, from an audit with 2 HIGH, 4 MED, 3 LOW, which notes "liveness gets judged nine-plus different ways";
  - request-to-run P6 "Nối thật";
  - `261003 confinement-credential-hygiene…`;
  - `261003 mutating-quota-fallback…`;
  - `261004 flaky-tests-under-load`;
  - `261007 provider-credential-rotation-safety`.
- **Phantom completion.** The P1 track row says "**xong** … một cửa chạy `fgos run` (herdr mặc định); read-only một posture". The next day P6 records that `bind().transport`, `resolvePosture` and `nextCandidate` had **no caller** and `canApplyPosture` "luôn `true`".
- **Mechanism.** Audit → findings list → phases → each fix adds tests and evidence → a new audit of the larger surface. Detached supervisors and workers, built for headless use, created the lock-holder-vs-worker bug class that later plans then had to harden (per the audit).
- **Stop point.** A rule like "phase may not start unless its trigger exists in production (inventory configured, ≥1 outside run)" removes Phase 06 and much of the confinement work. Per the 09-29 report, confinement is 5.9k lines serving 99 of 1,028 runs.

## 4. Cause analysis

### 4a. Structural causes (repeat across episodes)

**S1. The self-referential mission is encoded in the founding laws.** Evidence: genesis bee commit ("harness parity"), L6 F5 "self-improving", E1 (228 of 307 sessions were self-use), E2 (migrating docs of its own retired engine), E4 (hardening for an inventory nobody configured). D-ADR0035 exists only as prose. Confidence: high.

**S2. Completeness or atomic clauses plus an explicit ban on size as a stop reason.** Evidence:
- RUL11 source quote (`docs/specs/platform-foundations.md` ADR0036): "em đừng ngại heavy… gom hết 1000 files em cũng làm được", "quy mô không bao giờ là lý do miễn trừ", "cấm diễn giải lại";
- E2 "No scope reduction by omission", "exactly once", "atomic";
- E3 "Mục tiêu không được cắt" and "không đưa numeric threshold";
- E1 Step 08's five goals in one step.

RUL11's intent was *consolidation* (fewer doors). Agents read the operative clause as "never stop for size" and "finish everything". The rule is enforced only by an anchor-phrase test (`test/docs/rul11-anchor-phrase.test.mjs`), i.e. a wording check, not a behaviour check (synthesis V14). Confidence: high.

**S3. Review/audit outputs are finding lists that convert 1:1 into phases and code. No reviewer verdict class means "delete/descope".** Evidence: E2 R1-R4/A1-A8, E3 "review then found … repairs", E4 C/H/M/L → 10 phases → chained audits, E1's step-08 "pre-plan architecture review". The 09-19 "simplification" plan added a layer. Confidence: high.

**S4. Proof artifacts are the rewarded output; nothing counts their cost.** Evidence:
- August had 2,425 `docs(tsk)` commits against 199 `feat` (retrospective, Iron Law, lock CONTEXT);
- 31.8 MB of committed log/json evidence; 1 MB test logs in plans (E3/single-door);
- E2's 49.7 MB identity registry and 4.7M-line inventory;
- L5 DoD is a documentation test;
- L8 demands a test per doctrine rule.

Confidence: high.

**S5. Plans and decisions are locked before live evidence; the live gate comes last, and its blockage leaks into other layers.** Evidence:
- E1 Locked Product Decisions before code; old-vs-new comparison NOT RUN;
- E3 Phase 02 gate blocked by environment, so edits went into the dispatch/confinement layers its exclusions forbid;
- E4 P1 "xong" with unwired functions.

Confidence: medium-high.

**S6. Self-verification of completion, plus diagnoses that never become mechanisms.** Evidence:
- E4 P1 "xong" self-reported, contradicted 1 day later;
- E3 "Phase01 contract is CLI-closed" while the live gate is NOT ACCEPTED;
- the 09-29 report's §8.7 LOC cap was never implemented;
- the 10-06 synthesis states "Chưa có hành động nào được thực hiện";
- its fix for a naming-convention drift is a new Rust crate (`plans/261006-1415-fgos-convention-component`), so the guardrail itself becomes the next heavy system.

Confidence: medium-high.

**S7. Split-and-reopen without closing the parent's scope.** Evidence:
- E3 split out of the single-door plan;
- request-to-run became P1-P6, with P6 reopening P1;
- the dispatch chain spans 7 plans;
- Step 09 became 3 plans in 1 day;
- 28 active plan dirs and 35 worktrees exist now.

Each split restarts the full ceremony (plan, phases, reviews, evidence) and no plan owns the total. Confidence: medium.

**S8. Parallel reimplementation instead of extending one owner.** Evidence: 3 sequencers (stage FSM, DAG session, skill prose; synthesis 260930 A2), 2 supervisors, 3 result ladders, 5 selectors (09-29 report), 2 duplicated doc trees, and 9+ liveness judges (E4). Confidence: high (measured by prior reports, spot-checked here for the doc trees and the sequencers).

### 4b. One-off or contributing causes (not shown to repeat structurally)

- Shared main checkout and concurrent sessions: lost files and cwd drift (memory and synthesis V21). This adds rework but is not the bloat cause.
- Provider/executor unreliability (gemini/agy idling) causes retries, not design growth.
- The test wall-clock budget (tsk-3um, tsk-25b) is the only numeric budget found. It was "satisfied" by splitting files (−10k/−7k moved), not by shrinking. This is a cautionary gaming example for §5.
- `apps/fgos-gateway` +14.9k this week is a relocation (`05a0b5e4a` "move REST, MCP…"), not new code.

### 4c. Opposite hypothesis: where heavy machinery paid off

- **JSONL truth plus one-CLI-door state layer** (genesis Phase 1): stable 12k lines since 09-01. It let the retired engine's 307 sessions be backed up and counted after deletion (`acceptance-case-2.md`). Paid off. It was built small, in one day, from an outside reference (beads/beegog).
- **Admission/single-live-worker and lock fixes**: real, probe-reproduced races (maxRounds TOCTOU 15/15 → 0/15; lock-holder-vs-worker gaps; see this agent's memory notes for step-08 and the dispatch lock gap). These are necessary for parallel headless runs. Partly self-inflicted by the detached-supervisor design.
- **`bind()` + Workflow runner + Unit**: the model that replaced 75k lines of engine with 1 command and 8 min. It is light *because* it reused dispatch primitives the heavy phase had produced. This is the strongest evidence for "heavy first, then compress". But the compression came from an outside comparison (herdr-cook-plan, 09-29), not from internal process.
- **Independent cross-provider review**: it caught real defects (E3's Astra blockers, E4's audits). Its value is real; its output format (fix list only) is the problem, not its existence.

Verdict: the machinery pays off where it guards a real concurrent-write invariant or a single source of truth. It does not pay off where it encodes distrust of the LLM's judgment (driver authorization, seeded-mutation review packs, claim-level conservation), or where it targets load that does not exist.

## 5. Guardrails (ranked by expected effect ÷ added weight; max 12)

Each guardrail lists what it is, who enforces it, and how it can be gamed or grow heavy.

1. **Plan header budget line (a template clause).** Every `plan.md` declares `budget: src≤N, test≤M, days≤D, paths: [allowlist]`, written before Phase 01. If exceeded: stop, report, and the owner either re-budgets or kills. No other content is needed.
   - Enforced by: the lead at each phase close, plus #2.
   - Gaming / growth: inflated budgets. Counter: the owner sees the number at approval, and a budget above 3× the nearest prior art must cite why.
2. **Diff-budget pre-merge check.** One script, ≤100 lines: `git diff --numstat base..HEAD` against the plan header's budget and path allowlist, exit 1 on breach. It would have caught E3 (forbidden dispatch/confinement paths) on day 1 and E2's tooling on day 1.
   - Enforced by: the pre-merge hook or `fgos approve`.
   - Gaming / growth: splitting into more plans (see #6). Do not let it grow flags; it reads one header line.
3. **Outside-tenant trigger for any new runtime component.** A new module or engine/scheduler/store needs ≥1 recorded use from a non-fgOS project, or an owner-signed exception naming the external user. Measure it with the existing Observe/run records.
   - Enforced by: the plan reviewer, plus one doctor row counting runs per project.
   - Gaming / growth: fixture "projects". Counter: the project must have its own git remote.
4. **Reword RUL11's operative clause, not its intent.** Supersede ADR0036 with: "gom = reduce the count of doors/owners/lines; a consolidation that raises net lines needs owner approval". Keep "tùm lum, không phải nặng" as the rationale. This is a law change: supersede the ID, do not edit in place.
   - Enforced by: the owner decision, then #2 measuring net lines.
   - Gaming / growth: "net lines" moved into JSON/config. Counter: count all non-evidence paths.
5. **A "descope/delete" verdict is mandatory in every review.** The review template requires a section "what to delete or not build", and every finding is tagged `fix | defer | descope`. A finding without an outside trigger defaults to `defer`.
   - Enforced by: the review prompt (the existing code-review skill reference).
   - Gaming / growth: an empty section. Counter: the lead rejects a review with an empty descope section on a diff over 500 lines.
6. **One parent owns the total.** A split plan inherits the parent's remaining budget; the children's sum must stay ≤ the parent's budget. Store it in the parent header.
   - Enforced by: #2 summing over children through a `parent:` field.
   - Gaming / growth: orphan plans with no parent. Counter: a plan without a parent needs fresh owner approval.
7. **Live probe before plan lock.** No "Locked decisions" section until one real end-to-end run (even crude) exists on the target. Its run id goes in the plan header. Otherwise the plan status stays `draft`.
   - Enforced by: the plan template plus the reviewer.
   - Gaming / growth: toy runs. Counter: the run must be on the stated target (external repo or real workflow).
8. **Environment blocker = stop, not repair.** If an acceptance gate is blocked by environment or another layer, the executor files a work item and stops. It never edits outside the allowlist to unblock. This is a one-sentence plan-template clause, mechanically backed by #2.
   - Enforced by: the executor brief.
   - Gaming / growth: widening the allowlist mid-flight. Counter: allowlist changes need an owner note.
9. **Independent completion check (no self-"xong").** "done" requires one caller-trace check: every new public function has a non-test caller (grep or GitNexus), plus a run id from the real entry point. Run by someone other than the author.
   - Enforced by: the closing reviewer, plus a small script for unused exports.
   - Gaming / growth: callers added only to pass. Counter: the run-id requirement.
10. **Evidence size cap.** Committed evidence per plan is ≤1 MB. Logs are stored as hash + summary, with raw logs outside git (`.fgos/backups`-style). A pre-commit size check rejects `*.log` over 200 KB under `plans/` or `docs/`.
    - Enforced by: the existing `.githooks/pre-commit`.
    - Gaming / growth: splitting logs into parts. Counter: the cap is per plan dir, not per file.
11. **Deletion with retirement.** A retirement commit must also remove or archive the subsystem's docs, or the doctor row "docs for retired component present" fails. Apply now to the 37 MB of agent-coordination docs (both trees), before the doc-unification plan spends more effort migrating them.
    - Enforced by: `fgos doctor` with one row listing retired component names.
    - Gaming / growth: moving docs to `history/`. That is acceptable if it is out of default reading and size-capped (#10).
12. **Diagnosis→mechanism SLA.** Every forensic or drift report must end with at most 3 actions, each ≤1 day and ≤200 lines, or it is filed as "no action". Unexecuted actions older than 14 days are listed by doctor. Explicitly forbid a new crate or component as the remedy for a process drift.
    - Enforced by: the report template, plus the lead.
    - Gaming / growth: this report itself. The 12 items above must be cut to the top 3-4 by the owner.

Recommended minimum set: **#1 + #2 + #5 + #11**. That is roughly one template line, one script under 100 lines, one review section and one doctor row. It addresses S2, S3, S4, S7 and S8 directly, and S1/S5 indirectly.

## 6. UNPROVEN or not checked

- Which exact artifact the owner's "17,000-line Phase 2 tool, all cancelled" refers to. Measured on the branch: 14.8k code+test plus 6.2k JSON baselines (22.8k gross inserted); frozen (A5), not deleted. No other branch or worktree with a doc tool was found among the 35 worktrees, but not all were inspected.
- Engine sessions in other `~/projects` repos (11, cited from the 09-29 report, not re-counted).
- Birth dates and sizes for judge-subprocess, tool-registry and mission-lite.
- Whether the advisory uncommitted diff will be committed or discarded. Its quality was not reviewed.
- The cost/time (tokens, hours) per episode. Only commit dates and lines were measured.
- Line counts include md/json/log lines and are not LOC of code. src/test numbers include comments.

## 7. Unresolved questions for the owner

1. Supersede L6's F5 "self-improving" rung, and bee's "harness parity" exit, with an outside-tenant metric?
2. Reword RUL11's operative clause (#4), or keep it verbatim and rely on budgets (#1/#2) alone?
3. Delete both agent-coordination doc trees (37 MB) now, which shrinks the doc-unification scope, or keep them as history?
4. Advisory Phase 02: commit, cut back to the five contracts, or discard the dispatch/confinement edits that its own Exclusions forbid?
5. Who is the independent completion checker (#9) when every executor is an agent session?
