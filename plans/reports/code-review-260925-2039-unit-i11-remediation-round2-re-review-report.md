# Unit I11 Remediation Round 2 — Independent Re-Review

Reviewer: independent `code:review` session (no source/test/docs edits, no commit/merge/push).
Previous round: `plans/reports/code-review-260925-1524-unit-i11-remediation-re-review-report.md` (REQUEST CHANGES).
Verdict: **REQUEST CHANGES** (one remaining approval-blocking defect, narrow fix)

## Identity

| Item | Value |
|---|---|
| Implementation base | `585d5ad1febc8067caad61b9d8953cf2002a750e` |
| Candidate (code+tests) | `46896eb9de353b4fa88132995e4dfa5766eabdfc` |
| Docs/status tip = branch tip | `e4fe98b847e4dae33cf08da478c005d0cc0c8970` |
| Branch / worktree | `coordination-skill-harness-i11-remediation` / `.claude/worktrees/coordination-skill-harness-i11-remediation` |
| Commits base..tip | `15e3c423`, `2927ed7a` (round 1), `46896eb9`, `e4fe98b8` (round 2) |
| main / origin-main | `23fd6f96` (docs-only drift `25fc3133`, `23fd6f96`) / `b39898aa` |
| Ancestry | `585d5ad1`, `ac19f6d1`, `605d26fe`, `2927ed7a` ancestors — OK; candidate not in main — OK; main...tip = 2/4 |
| Markers / hygiene | none; worktree clean; HEAD `e4fe98b8` identical before/after full matrix |
| `git diff --check` base..tip | **not clean** — trailing whitespace (markdown hard breaks) in `phase-03d-i11-runtime-remediation-report.md` lines 3-9. Handoff claim "clean" is inaccurate (LOW). |

## Diff and Blast Radius

Round 2 code: `dag-declaration.mjs` (+143: shared `resolveNodeCwd`), `store.mjs` (allow-list gate, target run-evidence check, resolver use, duplicate ownership loop removed), `session-engine.mjs` / `close.mjs` / `show.mjs` / `run.mjs` (all use shared resolver with events/results; run re-computes caveats after scheduling), `dag-scheduler.mjs` (resolver re-export; pending with unsettled deps → `blocked`), tests (+probes; one driver-steps assertion changed `deferred`→`blocked`).
Docs: `dag-request-scheduler.md` §4.1 adds `materialized` to the outcome list; three plans; remediation report.

GitNexus: **degraded** (index `16a7900d`, 109 commits behind base) — not used. Manual callers: `resolveNodeCwd` now ← store disposition gate, `closeSessionByQuorumLocked`, close verb (2 sites), show, run (pre + post schedule). `recordDriverDisposition[Locked]` ← `run.mjs:463-465` only (no alternate door). Risk HIGH (authority gate + close gate share one resolver now — single point of truth, single point of failure).

Scope: no new store/event family/lifecycle, no I12/Phase 4/fan-out/daemon/N10.

## Finding Adjudication

| Finding | Status | Evidence |
|---|---|---|
| I11-F01 / I11R-01 | **RESOLVED** (subject to I11R2-01) | Allow-list `rejected/reject/deferred/defer/recheck-required` after trim+lowercase; everything else treated as accepting. Reviewer probes: 11 accept-meaning variants + `accepted​`, `accépted`, `not-accepted`, `rejected-but-accepted` all refused, 0 events appended; `Rejected`, `" rejected "`, `DEFER`, `recheck-required` allowed. Stale action refused; idempotent replay `appended:false`; replay after evidence changes fails closed. Mutations M1, M1b red. |
| I11-F02 / I11R-02 | **OPEN — one gap** | Fixed: linked-run priority, numeric attempt sort, one resolver; store/close/show agree on round-1 case L (all caveated), case R, unpadded 9/10; target with no run refused; corrupt `run.json` fails closed at store, close, show; distinct cwd both orders clean. Mutations M2, M2c, M2e red. **Gap:** linked run whose `run.json` is missing → silent fallback to default cwd (I11R2-01). |
| I11-F03 / I11R-03/04 | **RESOLVED** | Descendants of deferred → `blocked` with `blockedBy` (probe: c,d blocked by `b`); unsettled without outcome → `materialized`; no `deferred` without `concurrency-cap` error; non-validation error throws. Mutations M3a and M3d (restore transitive deferred) red. |

## Verification Evidence

Raw logs: `/tmp/claude-1000/-home-vantt-projects-forgentX/ea9328b7-605b-4894-9575-95d56e2ce991/scratchpad/logs-r2/` (reviewer probes: `reviewer-i11-probes-r2.test.mjs`). All `env -u CLAUDE_CODE_SESSION_ID`, in implementation worktree at `e4fe98b8`.

| Suite | Result | Exit |
|---|---|---|
| A. deferred-probes | 6 / 0 fail / 0 todo | 0 |
| B. focused DAG (6 files) | 59 / 0 | 0 |
| C. store/replay/session/recovery/driver-steps/chain/live-proof (10 files) | 288 / 0 | 0 |
| D. coordination-wide | 1045 / 0 / 0 todo | 0 |
| E. dispatch dependency (10 files) | 195 / 0 | 0 |
| F. phase2-concurrency + dispatch + research-fan-out ×3 | 417/417 each | 0 |
| G. `npm test` | 7725: **7652 pass, 0 fail**, 8 skip, 65 todo | **0** |

Handoff counts "43 focused DAG / 771 coordination" do not match reviewer counts (59 / 1045 for the prescribed file sets) — different file globs; not a correctness issue, but plan still carries round-1 "49/49 … 1045/1045".

Mutation proofs (throwaway detached worktree, reverted, `src` clean after each; suite = probes + 5 DAG files):

| Mutation | Result |
|---|---|
| M1 allow-list bypassed | RED (5) |
| M1b revert to 3-string denylist | RED (1) |
| M1c drop trim/lowercase | green — equivalent-safe (only makes gate stricter) |
| M2 drop `dagNodeId` filter | RED (2) |
| M2c resolver ignores linked run | RED (1) |
| M2d lexicographic attempt sort | **green — not locked** (LOW; real attempts padStart(2), linked run has priority) |
| M2e drop target run-evidence check | RED (1) |
| M3a scheduler `?? 'deferred'` | RED (1) |
| M3d restore transitive deferred | RED (1) |

## Findings

**I11R2-01 — HIGH (approval-blocking: missing evidence → clean accept) — defect not fully fixed (F02/F01)**
- Location: `src/runner/coordination/dag-declaration.mjs` `resolveNodeCwd`, `if (linkedRunId) { … if (fs.existsSync(runJsonPath)) {…} }` — no else; also `run.cwd` absent/empty in an existing linked `run.json` falls through. Loop then continues to other assignments and finally returns `defaultCwd`.
- Repro (reviewer probe RV2-F02b): X, Y read-only concurrent, both runs linked with `run.json.cwd = shared` → `accepted` refused (correct). Delete X's linked `runs/01/run.json` → `recordDriverDisposition(y, 'accepted')` **appended clean**; `show` reports both nodes `caveated=false`; `closeSessionByQuorum` passes the caveat gate (refused only later for quorum). Variant RV2-F02: linked run dir without `run.json` → target `accepted` clean with cwd = fallback.
- Impact: caveated / non-attributable evidence gains clean acceptance and passes close caveat gate by deleting (or never writing) one file; asymmetric with corrupt `run.json`, which correctly throws.
- Remediation: when a linked `runId` exists, its `run.json` must exist and carry a non-empty string `cwd`; otherwise throw `CoordinationError('corrupt-log' | 'dangling-ref')` (same family as `readLinkedRunResultFromDisk`). Add ordinary tests: linked run missing `run.json`; linked `run.json` without `cwd`; both at store, close, show. Mutation "restore silent fallback" must go red.

**I11R2-02 — LOW — contract doc changed by doer; needs Track Manager ratification**
- `dag-request-scheduler.md` §4.1 now lists `materialized`; driver-steps test (introduced `d52093fb`, I09 forward-port) previously asserted dependent `deferred` "rather than falsely blocked"; now `blocked`. Both align with proposal §4 strict allow-list ("No other error is deferred"; "A refusal blocks descendants"), and `materialized` pre-exists in the verified `show` projection at base, so reviewer does not treat this as unauthorized schema expansion — but a contract-doc edit and reversal of an I09-encoded assertion should be ratified by Track Manager, not self-authorized.

**I11R2-03 — LOW — regression lock gap**
- M2d (lexicographic sort) survives. Add a probe with attempts `9` and `10` (unlinked) asserting `10` wins.

**I11R2-04 — LOW — accounting/hygiene**
- Unified plan I11 entry still carries round-1 counts ("49/49 focused DAG pass; 1045/1045 coord-wide") under round-2 candidate; docs tip `e4fe98b8` not recorded; `git diff --check` not clean (report trailing whitespace) while handoff claims clean.
- Correct: no APPROVE/VERIFIED claim, no integration SHA, "resolved" self-claims removed, I12 BLOCKED in all three plans.

**I11R2-05 — LOW — behaviour notes (no change required unless Track Manager decides otherwise)**
- Accepting disposition allowed on an assignment with a disk `run.json` but no linked RunResult (in-flight). Caveat-wise attributable; whether accepting unsettled work is allowed is a product question.
- Non-accepting dispositions (`rejected`) now also fail closed with `corrupt-log` when any DAG run evidence is corrupt; `show` throws `corrupt-log` instead of projecting. Consistent with proposal §4 integrity rule; operator visibility on corrupt sessions reduced.

Timing debt: no fan-out timing failures this round (full suite green, F ×3 green).

## Final Verdict

**REQUEST CHANGES**

## Exact Next Action

Minimal fix round 3 (same branch, new candidate SHA):
1. `resolveNodeCwd`: linked run without readable `run.json` or without string `cwd` → fail closed (I11R2-01).
2. Tests: RV2-F02b-style ordinary test (genuine shared cwd → delete linked `run.json` → accept/close/show must refuse or throw), linked `run.json` without `cwd`, unpadded `9`/`10` probe; mutation "silent fallback" and M2d must go red.
3. Plans: replace stale round-1 counts, record docs tip SHA; fix trailing whitespace or stop claiming `diff --check` clean.
4. Track Manager: ratify §4.1 `materialized` doc change and the `deferred`→`blocked` descendant semantics (I11R2-02).

Re-review scope next round can be narrow: resolver diff + new tests + probes A/B/D + full suite.

I12 stays BLOCKED. Reviewer did not merge, push, or modify the candidate.

## Unresolved Questions

- Should an accepting disposition be allowed on an assignment whose run exists on disk but has no linked RunResult (I11R2-05)?
- Track Manager ratification of I11R2-02 items.
