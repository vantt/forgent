# Unit I08 — Post-Integration Re-Verification Report (main@605d26fe)

- **Capability**: `code:test` (verification/accounting only; no production or test code changed)
- **Date**: 2026-09-25
- **Branch**: `coordination-skill-harness-i08-post-integration-reverification`
- **Worktree**: `.claude/worktrees/coordination-skill-harness-i08-post-integration-reverification`
- **Verification baseline**: `main@605d26fea5a67f61c7d40214f17b16eb09264b3f` (local main; `origin/main` at `4ad0b8ca`, main ahead 22 / behind 0)
- **Lineage**: original I08 base `6f3fb9038fd66cd9943972a321eed2ba98587fab`, original I08 candidate `4e9de19541f2acde2380ff4f78147e389385e95c`; I08b candidate `d4e052a6`, candidate merge `98f501be`, integration `ba8f6a9dca8c84ba1561ab5802e2c89a2010446c`; I10 integrated by fast-forward of main to `605d26fe` (reflog `main@{0}`), contains `e516e975`, `97420638`, `3c49cf42`, `2613471e`.
- **Status-recording SHA**: see commit carrying this report (`git log -1` on the branch); it is NOT the verification baseline.
- **Verdict**: **REQUEST CHANGES** — stop condition "redirect/governance bypass" reached by a candidate regression introduced in the I08b F5 remediation (finding RV-01).

## 1. Hygiene

- Main checkout: branch `main`, HEAD `605d26fe`, no `MERGE_HEAD`/`REBASE_HEAD`/`CHERRY_PICK_HEAD`/`REVERT_HEAD`/`BISECT_*`/`rebase-*`/`sequencer`.
- User-owned dirty state (AGENTS.md, CLAUDE.md, docs/history/**, deleted knowledge-registry plan files, events, reports, scratch/) untouched: no stage/stash/reset/checkout on main.
- `ba8f6a9d` and `605d26fe` are ancestors of main (verified).
- Worktree created from exact `605d26fe`, clean; `node_modules` symlinked from main checkout; Rust release binaries built inside worktree (`cargo build --release --workspace`, no Rust diff between `6f3fb903` and `605d26fe`).
- No merge, rebase or push performed.

## 2. Area verdicts

| Area | Verdict | Evidence |
|---|---|---|
| A. Governance / redirect | **FAIL (RV-01, candidate regression)** | independent probe `probe-gov.mjs`, A/B vs `6f3fb903` |
| B. Public CLI | PASS | `probe-cli.sh`; focused CLI suites |
| C. Observation / RunResult / recovery | PASS | `probe-observe.mjs`; focused suites |
| D. Doctor / setup | PASS (1 LOW pre-existing) | `probe-doctor.mjs`, doctor fs-snapshot A/B |
| E. Performance R7 | PASS (controlled rerun p95 85/89 ms ≤ 146; no base-vs-candidate delta) | A/B interleaved benchmark §7 |
| F. F4–F10 regression suite | PASS (5/5) | `test/runner/dispatch-i08b-remediation.test.mjs` |

## 3. Area A — Governance and redirect

Independent probes (not copies of committed tests; different vendor pairs/directions, worker writes a marker file to prove spawn/no-spawn):

| Probe | 605d26fe | 6f3fb903 |
|---|---|---|
| pi+openai → pi+deepseek, no opt-in | refused `redirect.cross-provider-not-permitted`, no spawn | refused |
| claude harness z-ai → claude, no opt-in | refused, no spawn | refused |
| glm → z-ai (intra family), no opt-in | allowed, provenance `z-ai`→`z-ai`, `crossProvider:false` | refused (pre-F5 raw compare) |
| deepseek → openai with `crossProvider:true` + target `allowCrossProvider` | allowed; provenance `sourceProvider: deepseek`, `selectedProvider: openai-codex` | allowed, provenance raw `openai` |
| opt-in entry, target lacks `allowCrossProvider` | refused pre-spawn | refused |
| `disallowedExecutors:['tgt']` on redirect | refused pre-spawn | refused |
| `disallowedProviders:['openai-codex']`, redirect to `providerModel:'openai'` | refused pre-spawn | **allowed, spawned** |
| **`disallowedProviders:['openai']`, redirect to `providerModel:'openai'`** | **allowed, worker spawned** | refused pre-spawn |
| **`disallowedProviders:['glm']`, redirect to `providerModel:'glm'`** | **allowed, worker spawned** | (not comparable: base lacked model for `glm`) |

Direct (non-redirect) path, same governance config, both revisions identical:
`disallowedProviders:['openai']` + executor `providerModel:'openai'` → refused; `['openai-codex']` → **allowed/spawned**; `['glm']` → refused; `['z-ai']` + `glm` → **allowed/spawned**.

Other A checks: explicit unregistered executor fails closed on both doors (exit 1, `errorClass: executor-not-found`, no worker, only the pre-existing default `.fgos/config.json` bootstrap written); `DispatchError instanceof Error` true, `instanceof RunnerConfigError` false, `errorClass` preserved; `normalizeProviderFamily('deepseek','pi')='deepseek'`, `('openai','pi')='openai-codex'` (not same vendor); PlacementPolicy binder unchanged and exercised by `dispatch-cross-provider-redirect`, `placement-policy`, `assignment-dispatch` suites. Refusals leave only `assignment.json` + empty `runs/` (no run/controller/worker artifacts).

### RV-01 (HIGH, candidate regression from I08b F5) — redirect governance bypass via provider vocabulary mismatch

- `src/runner/dispatch/assignment-runner.mjs` `policyForActualExecutor` now sets `effectivePolicy.providerModel` to the canonical family (`resolveProviderFamilyForExecutor` → `normalizeProviderFamily`), and the post-redirect governance gate (`assignment-runner.mjs:1792`) checks `disallowedProviders.includes(effectivePolicy.providerModel)` against that canonical value.
- The primary gate (`assignment-policy.mjs:526`) still compares against the raw declared family (`deriveProviderFamily`).
- Result: one governance config gives opposite answers for the same executor. `disallowedProviders:['openai']` blocks a direct dispatch to an executor declaring `providerModel:'openai'` but lets a read-only redirect reach it (canonical `openai-codex` ∉ list). Same for `glm`/`z-ai`. Before I08b (`6f3fb903`) the redirect gate refused this exact case.
- Committed tests miss it because every redirect-governance test uses the canonical spelling (`openai-codex`): `dispatch-cross-provider-redirect.test.mjs:290`, `assignment-dispatch.test.mjs:1084,1116`.
- Stop condition: redirect/governance bypass, prompt egress to a disallowed provider.
- Remediation direction (for a `code:implement` unit, not done here): compare governance lists in one vocabulary on both gates — normalize both the list entries and the resolved provider via `normalizeProviderFamily` (or match either raw or canonical) in `assignment-policy.mjs` and `assignment-runner.mjs`, and add regression tests using raw aliases (`openai`, `codex`, `glm`, `agy`) on both direct and redirect paths.

### RV-02 (MEDIUM, pre-existing baseline, same root cause) — direct path does not canonicalize governance

`disallowedProviders:['openai-codex']` (the canonical spelling used by tests) does not block a direct dispatch to an executor declaring `providerModel:'openai'`; `['z-ai']` does not block `glm`. Identical on `6f3fb903` and `605d26fe`. Should be fixed together with RV-01 so the two gates share one vocabulary.

## 4. Area B — Public CLI

Probe in a temp git repo (both doors):

- `execute <unregistered>`: public exit 1, compat exit 1, identical `{"error":"no executor registered for id …","errorClass":"executor-not-found"}`.
- `decide <unregistered>`: both exit 0; public wraps in `fgos.v1` envelope; `mechanism: unavailable`, `configured:false`, `reasonCodes` incl. `selector.unregistered`.
- `show-run|recover|watch --run <missing>` and `show-run --run-id <missing>`: exit 2 (precondition).
- `dispatch frobnicate` and `dispatch frobnicate --run x`: exit 4, unknown sub-verb reported before field validation; `show-run` without runId: exit 4.
- `reconcile plan --run r1`, `--assignment a1`, `--run r1 --action clear-cwd-lock`: exit 4 "requires --action" (no cwd-lock inspection); bare `reconcile plan`: exit 0 envelope (`outcome: blocked`, default contract); `reconcile bogus-sub`: exit 4.
- `fgos --help`: `fgos dispatch <show-run|inspect|watch|recover|reconcile|decide|execute|log> [runId] [write+external]`.
- Baseline defect reproduced (not I08, not fixed): unknown flags ignored — `dispatch decide x --bogus-flag` exit 0, `show-run --run m --bogus-flag` behaves as without the flag.
- LOW pre-existing: outside a git repo, public `decide` exits 4 while compat `decide` exits 1 (public/compat `execute` both 1); identical on `6f3fb903`.

## 5. Area C — Observation, RunResult, recovery

Probe over one run dir per case (`readRunSnapshot`, `watchRunUseCase` maxTicks 50, `inspectDispatchRuntime --run`):

- Valid v2 result (built with the module's own projection) and legacy `done` with matching runId: `settled:true`, watch `terminal` immediately, `evidenceCompleteness.result: complete`.
- empty, whitespace, malformed, array, `{}`, directory `result.json`, v2 with wrong runId, legacy without runId, `status: totally-bogus`: all `settled:false`, `resultCorrupt:true`, watch `corrupt-evidence` in ≤2 ms (no tick exhaustion), `evidenceCompleteness.result: corrupt`.
- `interpretRunResult`: legacy leniency without `expectedRunId` preserved; missing runId with `expectedRunId` → `contractCorrupt`.
- RunObservation fields always inside the code's closed sets (`phase`, `delivery`, `resourceState`, `evidenceCompleteness.result`).
- `recoveryAuthority` absent (null) whenever ownership is missing/incomplete, including every corrupt case.
- LOW (doc drift): the original I08 report §4.2 lists vocab sets that differ from the code's sets (`delivery` code set is `not-started|running|delivered|unknown|replayed|recovered`; `resourceState` includes `absent-proven|unobserved`). Code sets unchanged since `6f3fb903`; the old report table is inaccurate, not the code.

## 6. Area D — Doctor / setup

- `resolveHerdrBin`: padded env trimmed; option beats env; whitespace/empty option falls back to trimmed env; whitespace env → `herdr`.
- `checkHerdrAvailable` with a fake herdr binary: no anchor → pass; empty / whitespace anchor → fail "is empty"; unresolvable anchor → fail with herdr error; padded valid anchor → pass "verified"; missing binary → fail.
- `fgos doctor` (no `--fix`) in temp repo + temp HOME: exit 0; only an empty `proj/.fgos/` directory and files written by the external `claude` CLI itself (`~/.claude.json`, backups) appear — byte-identical behaviour on `6f3fb903` (LOW, pre-existing, no fgOS state file written).
- Registry/manifest/docs sync: `test/architecture.test.mjs` 13/13, `test/rust-host/command-routes.test.mjs` 14/14, `test/setup/checks-doctor-config.test.mjs` + `visibility-checks.test.mjs` green; `docs/specs/distribution.md` rows 5d/5e document the global-only provider-capacity and attestation dirs.

## 7. Area E — Performance R7

- Harness: committed `scripts/bench-receipt-latency.mjs` (`runReceiptLatencyBenchmark(40)`), invoked by import from a scratch wrapper so the historical `i08-receipt-latency-measurement.json` is **not** overwritten (the script's own main entry writes that fixed path).
- Command: `env -u CLAUDE_CODE_SESSION_ID node run-bench.mjs <worktree> <out.json> 40` (wrapper imports `runReceiptLatencyBenchmark`, adds revision/command, writes JSON).
- Revision `605d26fea5a67f61c7d40214f17b16eb09264b3f`; Linux 6.8.0-138-generic x64, 16 cores (i7-12650H); Node v24.18.0.
- Artifact: `plans/260920-2217-dispatch-engine-hardening/reports/i08-post-integration-605d26fe-receipt-latency-measurement.json` (primary run raw samples + controlled and loaded A/B summaries).

**Controlled rerun (started after load1 < 6; candidate/base interleaved, 40 trials each):**

| Run | min | median | p95 | max | load1 |
|---|---|---|---|---|---|
| 605d26fe #1 (primary artifact) | 41 | 68 | **85** | 86 | 6.8 |
| 6f3fb903 #1 | 42 | 66 | 95 | 95 | 6.4 |
| 605d26fe #2 | 41 | 59 | **89** | 387 | 6.4 |
| 6f3fb903 #2 | 50 | 75 | 89 | 94 | 6.0 |

Acceptance p95 ≤ 146 ms (baseline 46 + 100): **PASS** (85 / 89 ms). The single 387 ms max in #2 is one outlier sample; p95 unaffected.

**Loaded runs (load1 9–19 from other sessions)**: candidate p95 142–176 ms, base p95 148–159 ms, medians ~117–133 ms for both. First candidate run at load1 9.3 hit p95 162 ms (FAIL) — reproduced equally on base, so classified environment/load noise, not candidate regression. Absolute numbers are higher than the original I08 run (median 38 / p95 47) on both revisions under this host's current load; the base-vs-candidate delta is ~0 in every paired comparison.

Timing evidence does not replace correctness evidence; R7 is not a blocker.

## 8. Test results (worktree @ 605d26fe, `env -u CLAUDE_CODE_SESSION_ID`)

| Suite | Result |
|---|---|
| Focused 11 files (prompt §6 list, incl. `dispatch-i08b-remediation` and `dispatch-governance-operability`) | 189 pass / 0 fail |
| `test/runner/dispatch-i08b-remediation.test.mjs` (F4, F5, F6, F7, F10) | 5/5 pass (within focused) |
| `test/runner/dispatch.test.mjs` | 387 pass / 0 fail |
| `test/runner/assignment-dispatch.test.mjs` | 75 pass / 0 fail |
| `test/architecture.test.mjs` | 13 pass |
| `test/rust-host/command-routes.test.mjs` | 14 pass |
| Affected matrix, 55 files (`find test -name '*.test.mjs' \| grep -E "dispatch\|herdr\|assignment\|run-result\|placement\|provider\|redirect\|coordination-session\|confinement\|reconcile"`) | 1465 pass / 0 fail / 1 skip (live agy-herdr, opt-in) |
| `npm test` run 1 (before Rust build) | 7590 pass / 51 fail / 8 skip / 68 todo — all 51 in `test/rust-host/{fgctl-init,fgctl-stage,fgctl-upgrade,release-tree}` ("fgctl binary must exist" / "Compiled Rust binary not found") |
| Those 4 files after `cargo build --release --workspace` | 52/52 pass → environment, not regression |
| `npm test` run 2 (binary built) | **7641 pass / 0 fail / 8 skip / 68 todo, exit 0** (359 s) |
| `git diff --check` (worktree) | clean |

The 3 `coordination-dag-deferred-probes` entries listed under "failing tests" are `todo` (deferred findings I09-REV-12/13 etc.), counted in the 68 todo, not failures. Note: the full suite is green while RV-01 exists — the suite has no raw-alias governance case.

`git diff --check 6f3fb903 605d26fe`: 4 "new blank line at EOF" (3 windows-ci-hardening plan files, `src/runner/dispatch/trust-store.mjs`), all from `origin/main@4ad0b8ca` lineage (`eb1f69a9`) — LOW, outside I08.

## 9. GitNexus

`fgos tool query --capability impact-analysis --status present` → 0 providers (inactive); local index `.gitnexus/meta.json` at `16a7900d` (behind `605d26fe`) → **degraded/stale**, not used; no `analyze` run. Blast radius checked manually: callers of `resolveProviderFamilyForExecutor` / `policyForActualExecutor` (`assignment-runner.mjs` redirect selection, policy retarget, post-redirect governance gate), governance consumers grep'd (`assignment-policy.mjs:526`, `assignment-runner.mjs:1792`, `placement-policy.mjs:152,164`), and the redirect/governance test files listed in RV-01.

## 10. Findings

| ID | Severity | Class | Summary |
|---|---|---|---|
| RV-01 | **HIGH (blocker)** | candidate regression (I08b F5) | redirect governance gate compares canonical family against raw `disallowedProviders` → egress to disallowed provider via read-only redirect |
| RV-02 | MEDIUM | pre-existing baseline | direct governance gate does not canonicalize; canonical list entries miss raw-declared executors |
| RV-03 | LOW | environment | R7 loaded runs exceeded 146 ms on both base and candidate; controlled rerun passes; see §7 |
| RV-04 | LOW | pre-existing | unknown CLI flags silently ignored |
| RV-05 | LOW | pre-existing | non-git precondition: public `decide` exit 4 vs compat exit 1 |
| RV-06 | LOW | pre-existing | `doctor` without `--fix` creates empty `.fgos/` dir |
| RV-07 | LOW | doc drift | original I08 report vocab table ≠ code sets; bench harness main entry overwrites the historical artifact and embeds a fixed base-commit note |
| RV-08 | LOW | out of scope | blank-line-at-EOF in `origin/main@4ad0b8ca` lineage |
| RV-09 | LOW | accounting | unified plan / dispatch plan at `605d26fe` still record I10 as "pending merge" and I08 as "pending re-verification" |
| N10 | LOW-MEDIUM | follow-up (unchanged) | `getProviderAdapter` still keys adapter selection on declared vendor; must split before extending ProviderAdapter beyond Claude; not implemented here |

F4, F6, F7, F10 remain resolved. F5's declared-vendor redirect comparison is resolved for the redirect family check itself, but its canonicalization leaked into the governance gate (RV-01).

## 11. Accounting decision

Verification did not pass, so the unified plan, dispatch-hardening plan, Phase 08 doc and original I08 report were **not** updated to `verified`. This report and the benchmark artifact are the only additions (docs/measurement only). I08 remains `pending post-integration re-verification — REQUEST CHANGES (RV-01)`. I10 integration at `main@605d26fe` is confirmed by git lineage; recording it in the plans is left to the Track Manager. **I11 stays BLOCKED**; nothing here opens or approves it.

## 12. Next action for Track Manager

1. Open a `code:implement` remediation unit for RV-01 (and RV-02, same root cause) branching from `main@605d26fe`: single governance vocabulary for `disallowedProviders` on direct and redirect gates + raw-alias regression tests on both paths.
2. After it lands, rerun this I08 post-integration re-verification on the new main (probes in §3 are directly reusable).
3. Record I10 as integrated at `main@605d26fe` in the plans (RV-09).
4. Optionally re-baseline R7 absolute numbers on a quiet host; current evidence shows no candidate delta (§7).

## Unresolved questions

- Intended governance vocabulary: should `disallowedProviders` match canonical families only, or raw declared names too? RV-01/RV-02 fix depends on this product decision (safe default: match either).
