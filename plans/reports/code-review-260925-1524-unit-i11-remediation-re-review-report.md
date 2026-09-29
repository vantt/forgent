# Unit I11 Remediation — Independent Re-Review

Reviewer: independent `code:review` session (no source/test/docs edits, no commit/merge/push).
Verdict: **REQUEST CHANGES**

## Identity

| Item | Value |
|---|---|
| Implementation base | `585d5ad1febc8067caad61b9d8953cf2002a750e` |
| Implementation candidate (code+tests) | `15e3c4230a8977b29be4a8d0875582f45e772304` |
| Docs/status tip (branch tip) | `2927ed7af3d65db9bdb0bfa4ae95242f671adb45` |
| Branch / worktree | `coordination-skill-harness-i11-remediation` / `.claude/worktrees/coordination-skill-harness-i11-remediation` |
| main / origin-main | `23fd6f96` / `b39898aa` |
| Commits base..tip | `15e3c423` fix(coordination) + `2927ed7a` docs(coordination) |
| Ancestry | `585d5ad1`, `ac19f6d1` (I08), `605d26fe` (I10) all ancestors of tip — OK |
| Integration | candidate NOT in main — OK |
| Divergence main...tip | 2 / 2. Main drift `25fc3133`, `23fd6f96` = docs/plans only (no src/test overlap) |
| Operation markers | none |
| Worktree hygiene | tracked/untracked clean (ignored: `node_modules`, `target`); HEAD `2927ed7a` identical before and after the full matrix |
| `git diff --check` base..tip | clean |

Handoff discrepancy: only short SHAs given; resolved to full SHAs above, both exist. Handoff calls the first-round I11 review "report" — no first-round I11 review report exists in repo (`plans/reports`, plan dirs); adjudicated against plan-recorded findings (I09-REV-12/13, store-scan) and the handoff's F01–F03 definitions.

## Diff and Blast Radius

Files: `store.mjs` (+96/-22), `dag-scheduler.mjs` (+19/-6), `run.mjs` (+8/-5), deferred-probes test (+754/-198), p07 test (2 assertions changed), 3 plan.md + 1 new report.

Scope: no new store/event family/lifecycle, no I12/Phase 4/mutating DAG/fan-out/daemon/N10. `materialized` scheduler value pre-exists in `show.mjs:420` at base (reused in run; not in `dag-request-scheduler.md` §4.1 `outcome` allow-list → doc debt, see F-LOW-2).

GitNexus: **degraded** — index at `16a7900d` (109 commits behind base). Stale numbers not used. Manual callers:
- `recordDriverDisposition[Locked]` ← `run.mjs:463-465` disposition step (both lock paths reach the same gate — no alternate door), CLI via run.
- `resolveNodeCwd` ← `run.mjs:717`, `show.mjs:354`, `close.mjs:22`.
- `scheduleDagSteps` ← `run.mjs:798`.
- Third cwd resolver NOT changed: `session-engine.mjs:3452-3470` (`closeSessionByQuorumLocked`).
Risk not downgraded: authority gate on driver dispositions + close-gate parity → HIGH.

## Finding Adjudication

| Finding | Status | Evidence |
|---|---|---|
| I11-F01 | **OPEN** | Denylist of 3 exact strings; free-form disposition (`schema.mjs` / plan-loop SKILL: free-form ≤200 chars) lets clean-accept meaning through. Reviewer probe RV-F01a: on caveated evidence `Accepted`, `ACCEPTED`, `"accepted "`, `approved`, `partially-accepted`, `closed`, `resolved`, `cell-close` all **APPENDED** (8 events). |
| I11-F02 | **OPEN (partial)** | Sibling borrowing fixed (mutation M2 red, RV-F02a green both orders). But attribution uses latest attempt *directory*, not the result-linked run; and close gate uses a different resolver. RV-F02b: linked run in shared cwd + newer unlinked attempt dir elsewhere → store `accepted` **clean**, `closeSessionByQuorum` **caveat refusal**, `show` caveated=false. Unpadded `9`/`10` attempts: lexicographic sort picks `9` → clean accept of shared-cwd linked run. Target with no run falls back to `opts.cwd` → accepted (RV-F02c). |
| I11-F03 | **OPEN** | (a) Mutation M3a (restore `?? 'deferred'` fallback in `dag-scheduler.mjs:136`) → doer's probes 6/6 and all 59 DAG tests stay **green** — not regression-locked. (b) `dag-scheduler.mjs:156-163`: descendants of a capacity-deferred node are labeled `deferred` with **no** `concurrency-cap` error (RV-F03: `c`, `d` deferred, `error=null`), contradicting `dag-request-scheduler.md` §4 "No other error is deferred". |

Verified OK: refusal under `withEventsLock` before append; 0 events appended on refusal (RV-F01b); `rejected` still recordable; close door refuses caveated session; valid accepted + idempotent replay `appended:false` (RV-F01c); after evidence changes, replay fails closed (refused, not appended); evidenceRef without `dagNodeId` → validation; conflicting `dagNodeId` → corrupt-log; corrupt sibling `run.json` → corrupt-log at store; stale action key refused; in-flight (unsettled, no outcome) → `materialized`, descendants `blocked` with `blockedBy`; non-validation error throws.

## Verification Evidence

Raw logs: `/tmp/claude-1000/-home-vantt-projects-forgentX/ea9328b7-605b-4894-9575-95d56e2ce991/scratchpad/logs/` (reviewer probes saved as `reviewer-i11-probes.test.mjs` there). All runs `env -u CLAUDE_CODE_SESSION_ID`, in implementation worktree at `2927ed7a` (only place with deps), HEAD/status unchanged before/after.

| Suite | Result | Exit |
|---|---|---|
| A. deferred-probes | 6 pass / 0 fail / 0 todo | 0 |
| B. focused DAG (corrupt, cold-resume, concurrency, migration-matrix, probes, p07) | 59 / 0 / 0 | 0 |
| C. store, fault-injection, replay, session-engine, recovery-and-quorum, headless-identity, run-driver-steps, chain, recovery, run-live-proof | 288 / 0 | 0 |
| D. coordination-wide | 1045 / 0 / 0 todo | 0 |
| E. run-result-v2, governance-operability, provider-denylist, i08b-remediation, assignment-dispatch, reconciliation(+concurrency), dispatch-recovery, recovery, cross-provider-redirect | 195 / 0 | 0 |
| F. timing debt (phase2-concurrency + dispatch + research-fan-out) ×3 | 417/417 each | 0 |
| F'. research-fan-out stress 2 rounds × 4 parallel | 8/8 runs 14/14 | 0 |
| G. `npm test` | 7725 tests: 7650 pass, **2 fail**, 8 skip, 65 todo | **1** |

G failures: `coordination-research-fan-out.test.mjs` R5 ×2 — wall-clock asserts ("elapsed 2677ms", "4561ms"). Classification: **timing/flaky under full-suite load**, not candidate regression (code path `dispatchResearchFanOut`/`session-engine.mjs` untouched by diff; isolated 3/3 and 4-way stress 8/8 green). Not labeled pre-existing: base reproduction impossible here (fresh base worktree lacks deps; hook blocks linking them). Doer's claim "7652 pass, exit 0" not reproduced on this run.

Separate fresh-worktree full run (no deps): 456 fail, all dependency-missing (`FlowDefinitionError not-found`, `RunnerConfigError`) — environment prerequisite, discarded.

Mutation proofs (throwaway detached worktree, reverted, `git status` src clean after each):

| Mutation | Result |
|---|---|
| M1a gate only `cell-closed` | RED (probes 2, 5) |
| M1b gate bypassed | RED (probes 2, 5, p07 REV-05/09) |
| M2 drop `dagNodeId` filter | RED (probes 4, 5) |
| M2b exact base scan | RED |
| M3a scheduler `?? 'deferred'` fallback | **GREEN — survives (6/6 probes, 59/59 DAG)** |
| M3b run.mjs resumed → `deferred` | RED (probes 1, 6) |
| M3c pending → deferred unconditionally | RED (probe 1) |

## Findings

**I11R-01 — HIGH — defect not fully fixed (F01)**
- Location: `src/runner/coordination/store.mjs:1521-1523`.
- Repro: caveated two-node shared-cwd session; `recordDriverDisposition(..., disposition: 'Accepted' | 'approved' | 'closed' ...)` → `appended: true`.
- Impact: caveated/non-attributable evidence still receives clean-accept disposition; contract unmet.
- Remediation: invert to an allow-list — on caveated sessions permit only explicitly non-accepting dispositions (e.g. `rejected`, `deferred`, `recheck-required`; confirm set against the plan-loop vocabulary), refuse everything else fail-closed; normalize (trim/lowercase) before comparing. Add probe covering case/whitespace variants and synonyms.

**I11R-02 — HIGH — defect not fully fixed (F02) + gate parity**
- Location: `store.mjs:1574-1605` (latest dir), `dag-scheduler.mjs:25-29`, `session-engine.mjs:3452-3470` (first dir, unfiltered order, `catch {}`).
- Repro: RV-F02b case L (above) — store accepts clean, close refuses as caveated, show says not caveated.
- Impact: attribution derived from a non-authoritative attempt; disposition gate, close gate and show disagree on the same evidence.
- Remediation: resolve node cwd from the result-linked run (`result-linked.runId`) of the node's own assignment(s), numeric attempt ordering when no link; one shared resolver used by store, `resolveNodeCwd` callers, and `closeSessionByQuorumLocked`; corrupt/unreadable `run.json` fail closed consistently (show projects refused/corrupt, not silent fallback). Missing run for a target being accepted → refuse instead of `opts.cwd` fallback.

**I11R-03 — HIGH (approval-blocking) — regression lock missing (F03)**
- Location: `dag-scheduler.mjs:136`; tests `coordination-dag-deferred-probes.test.mjs` probe 6 subcase 3 always passes an explicit `schedulerOutcome`.
- Repro: M3a above.
- Remediation: add ordinary test where `execute` returns `{authoritativeSettled:false}` without `schedulerOutcome`; assert not `deferred`.

**I11R-04 — MEDIUM — defect not fully fixed (F03 taxonomy)**
- Location: `dag-scheduler.mjs:156-163`.
- Repro: b throws `concurrency-cap` every attempt, c→b, d→{a,b}: c and d `deferred`, `error: null`.
- Impact: `deferred` emitted for nodes never admitted and without concurrency-cap error, against strict allow-list.
- Remediation: mark such descendants `blocked` with `blockedBy` naming the deferred prerequisite (session still stays open since blocked prevents close), or obtain Track Manager/contract amendment authorizing transitive deferral; test either way.

**I11R-05 — LOW — accounting/documentation debt**
- Plans record "F01, F02, F03 resolved" — contradicted by this review; docs tip `2927ed7a` and full SHA not recorded alongside candidate; test count "7652 pass exit 0" not reproduced here (7650/2 timing fails).
- `materialized` run outcome not in `dag-request-scheduler.md` §4.1 allow-list (pre-exists only in show projection).
- Duplicate `assertDispositionRefOwnedBySession(evidenceRefs…)` loop (store.mjs 1509-1519 and 1621-1630) — harmless, remove one.
- Accounting otherwise correct: no APPROVE/VERIFIED self-claim, no integration SHA claimed, I12 BLOCKED in all three plans.

**I11R-06 — LOW — timing/flaky (not candidate)**
- `coordination-research-fan-out` R5 wall-clock thresholds fail under full-suite load. Track as existing timing debt; base reproduction pending.

## Final Verdict

**REQUEST CHANGES**

## Exact Next Action

Minimal fix round (same branch, new candidate SHA):
1. F01 allow-list gate + normalization (I11R-01).
2. Single linked-run cwd resolver shared by store/run/show/close; fail closed on missing/corrupt (I11R-02).
3. F03 descendants of deferred → `blocked` (or authorized contract amendment) (I11R-04).
4. Update plans: I11 "remediation round 2 ready for re-review", no "resolved" claim; record full candidate + docs SHAs.

Required tests/probes next round:
- disposition variants (`Accepted`, `" accepted"`, `approved`, `closed`, `partially-accepted`) refused on caveated evidence, 0 events appended;
- linked-attempt-vs-latest-dir, unpadded attempt ordering, store/close/show parity on same fixture;
- target-without-run accept refused;
- scheduler unsettled result without `schedulerOutcome` → not `deferred`;
- descendant-of-deferred outcome + `blockedBy`;
- mutation proofs M1–M3 (incl. M3a) must all go red;
- full `npm test` with raw log + exit code; if R5 fan-out timing fails again, reproduce on exact base.

I12 stays BLOCKED. Reviewer did not merge, push, or modify candidate.

## Unresolved Questions

- First-round I11 review report location (not in repo) — Track Manager to confirm F01 original wording covers disposition synonyms/case variants (reviewer treats it as covered: "clean accept meaning").
- Is transitive `deferred` for descendants of capacity-deferred nodes intended by Track Manager? If yes, contract §4 needs amendment first.
