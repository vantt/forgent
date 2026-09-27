# Unit I11 Remediation Round 3 — Independent Re-Review

Reviewer: independent `code:review` session (no source/test/docs edits, no commit/merge/push).
Prior rounds: `code-review-260925-1524-unit-i11-remediation-re-review-report.md`, `code-review-260925-2039-unit-i11-remediation-round2-re-review-report.md` (both REQUEST CHANGES).
Verdict: **APPROVE** (exact candidate locked below; LOW items non-blocking)

## Identity

| Item | Value |
|---|---|
| Implementation base | `585d5ad1febc8067caad61b9d8953cf2002a750e` |
| Candidate (code+tests) | `9cf843b6fbb786923992f9deb2f70deb447620a2` |
| Docs/status tip = branch tip (locked review target) | `3a67a1b9df4cf51391f4abffc13fd988df727cf4` |
| Branch / worktree | `coordination-skill-harness-i11-remediation` / `.claude/worktrees/coordination-skill-harness-i11-remediation` |
| Commits base..tip | `15e3c423`, `2927ed7a`, `46896eb9`, `e4fe98b8`, `9cf843b6`, `3a67a1b9` |
| main / origin-main | `23fd6f96` (docs-only drift since base) / `b39898aa` |
| Ancestry | `585d5ad1`, `ac19f6d1` (I08), `605d26fe` (I10), `e4fe98b8` ancestors — OK; candidate not in main — OK |
| Markers / hygiene | none; worktree clean; HEAD `3a67a1b9` identical before/after full matrix |
| `git diff --check` base..tip | clean |

## Diff and Blast Radius

Round 3 code (`e4fe98b8..9cf843b6`): `dag-declaration.mjs` `resolveNodeCwd` — linked run: missing run dir → `dangling-ref`; missing/unparseable `run.json` or non-string/empty `cwd` → `corrupt-log`; unlinked attempt with `run.json` lacking `cwd` → `corrupt-log`; a `run-retried` after the latest link voids that link (falls to numeric-latest attempt); `results` used only when `events` absent. `show.mjs` validates RunResult evidence before caveat computation and maps only `dangling-ref` to `cwd=null`; `run.mjs` same mapping pre/post schedule. Tests +143 (subcases 8–9). Docs: plans + remediation report.

GitNexus: **degraded** (index `16a7900d`, 109 commits behind base) — not used; manual callers unchanged from round 2 (store gate, `closeSessionByQuorumLocked`, close verb, show, run). Authority doors (store disposition, session-engine close, close verb) do NOT catch `dangling-ref` → fail closed.

Scope: no new store/event family/lifecycle, no I12/Phase 4/fan-out/daemon/N10.

## Finding Adjudication (cumulative)

| Finding | Status | Evidence |
|---|---|---|
| I11-F01 (caveated evidence clean accept) | **RESOLVED** | Allow-list gate; 15 accept-meaning variants refused, 0 events; non-accepting variants allowed; stale action refused; idempotent replay OK; replay after evidence change fails closed. M1/M1b red. |
| I11-F02 (cross-node / non-attributable cwd) | **RESOLVED** | Exact `dagNodeId` join; linked run authoritative; numeric attempt order; one resolver for store/close/show/run. Round-2 blocker closed: delete linked `run.json` → store `corrupt-log`, close `corrupt-log`, show throws `corrupt-log`; `run.json` without `cwd` → same; delete linked run dir → store/close `dangling-ref`. Real-executor probe (RV3b): delete one linked run dir on genuinely caveated session → show, headless show, re-run all throw `dangling-ref`; sibling `accepted` refused; close refused. M2, M2c, M2e, R3M1, R3M1b, R3M2 red. |
| I11-F03 (`deferred` outside concurrency-cap) | **RESOLVED** | Descendants of deferred → `blocked` + `blockedBy`; unsettled w/o outcome → `materialized`; no `deferred` without `concurrency-cap`. M3a, M3d red. |
| I11R2-01 (missing linked run.json → clean accept) | **RESOLVED** | See F02. |
| I11R2-03 (M2d lock) | **RESOLVED** | R3M2 red. |
| I11R2-04 (accounting) | **RESOLVED** | Plans carry round-3 SHAs + round-2 SHAs, round-3 counts (6/59/1045/7652) match reviewer counts; no APPROVE/VERIFIED self-claim; I12 BLOCKED in all three plans; `diff --check` clean. |

## Verification Evidence

Raw logs: `/tmp/claude-1000/-home-vantt-projects-forgentX/ea9328b7-605b-4894-9575-95d56e2ce991/scratchpad/logs-r3/` (reviewer probes `reviewer-i11-probes-r3.test.mjs`: 12 probes, all behaviours above). All `env -u CLAUDE_CODE_SESSION_ID`, implementation worktree at `3a67a1b9`.

| Suite | Result | Exit |
|---|---|---|
| A. deferred-probes | 6 / 0 fail / 0 todo | 0 |
| B. focused DAG (corrupt, cold-resume, concurrency, migration-matrix, probes, p07) | 59 / 0 | 0 |
| C. store/fault-injection/replay/session-engine/recovery-and-quorum/headless-identity/run-driver-steps/chain/recovery/run-live-proof | 288 / 0 | 0 |
| D. coordination-wide | 1045 / 0 / 0 todo | 0 |
| E. dispatch dependency (run-result-v2, governance ×2, i08b-remediation, assignment-dispatch, reconciliation ×2, dispatch-recovery, recovery, cross-provider-redirect) | 195 / 0 | 0 |
| F. phase2-concurrency + dispatch + research-fan-out ×3 | 417/417 each | 0 |
| G. `npm test` | 7725: **7652 pass, 0 fail**, 8 skip, 65 todo | **0** |

Mutation proofs (throwaway detached worktree, each reverted, `src` clean after each; suite = probes + 5 DAG files + run-driver-steps, baseline 145/0):

| Mutation | Result |
|---|---|
| R3M1 missing linked `run.json` → silent fallback | RED |
| R3M1b invalid `cwd` → silent fallback | RED |
| R3M2 lexicographic attempt sort | RED |
| R3M3 drop `run-retried` link-void | green (LOW, see I11R3-01) |
| R3M4 show swallows `corrupt-log` too | RED |
| M1 allow-list bypass | RED (5) |
| M2 drop `dagNodeId` filter | RED (2) |
| M3a scheduler `?? 'deferred'` | RED |

Full-suite classification: green; no candidate regression, no timing failures this round.

## Findings (all LOW, non-blocking)

**I11R3-01 — LOW — regression-lock gap for new retry behaviour**
- `dag-declaration.mjs` `resolveNodeCwd` events scan: `run-retried` after the latest `result-linked` voids the link. Behaviour is defensible (superseded run is no longer authoritative; attempt dirs remain fail-closed on corrupt/missing cwd) but no test locks it (R3M3 survives). Remediation (follow-up, any unit): ordinary test — link 01 (shared cwd), `recordRunRetry`, attempt 02 in distinct cwd → expected caveat decision asserted at store/close/show.

**I11R3-02 — LOW — Track Manager ratification (carried from round 2)**
- `dag-request-scheduler.md` §4.1 lists `materialized`; I09-era driver-steps assertion changed `deferred` → `blocked` for descendants of capacity-deferred nodes. Both consistent with proposal §4 strict allow-list and pre-existing `show` vocabulary; reviewer does not treat as unauthorized expansion, but contract-doc edits should be ratified by Track Manager at integration.

**I11R3-03 — LOW — projection nuance**
- `show`/`run` map `dangling-ref` → `cwd=null`, which drops that node from caveat computation. Reachable only when the node already projects `refused`/corrupt-evidence (synthetic fixture) — with real runs show/headless/run throw `dangling-ref` first (RV3b). Authority doors unaffected. No change required; document intent if kept.

**I11R3-04 — LOW — stable-artifact rule**
- Commit subjects carry finding codes (`(I11R2-01)`, "I11 contract defects F01…") contrary to `.claude/rules/review-audit-self-decision.md` "Stable Code Artifacts". Fix only if Track Manager squashes/rewrites at integration; do not rewrite shared history for this alone.

**I11R3-05 — LOW — product question (carried)**
- Accepting disposition allowed on an assignment with on-disk `run.json` but no linked RunResult (in-flight). Not a caveat defect.

## Final Verdict

**APPROVE**

## Exact Next Action

- Locked candidate: code `9cf843b6fbb786923992f9deb2f70deb447620a2`, tip `3a67a1b9df4cf51391f4abffc13fd988df727cf4` on `coordination-skill-harness-i11-remediation`. Any further commit invalidates this approval.
- Return to Track Manager for integration decision and post-merge verification on resulting main (full suite + focused DAG + coordination-wide).
- Track Manager: ratify I11R3-02 at integration; schedule I11R3-01 test as follow-up.
- I12 is NOT opened by this approval; Track Manager decides.
- Reviewer did not merge, push, or modify the candidate.

## Unresolved Questions

- I11R3-05 product intent (accept on in-flight, unlinked run).
- Track Manager ratification of I11R3-02.
