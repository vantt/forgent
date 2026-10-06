# Third acceptance: evidence honesty, documentation and process

Plan: [plan.md](../261005-1143-observe-run-visibility-and-discussion-measurement/plan.md). Prior round: [opus-reacceptance-evals-and-honesty-261006.md](opus-reacceptance-evals-and-honesty-261006.md). Repair accounts: [docs](observe-second-repair-docs-261006.md), [discussion](observe-second-repair-discussion-261006.md), [foundation](observe-second-repair-foundation-261006.md).

Reviewer: independent Opus third round, 2026-10-06. Scope: commits `5608387d3`, `012595aca`, `2fd5cb6a3` on main (HEAD `2fd5cb6a3`). This review checks whether the words match reality. It does not judge Rust/Node correctness.

I made no repo or git changes. I ran no cargo and no `npm test`. All host reads used `target/debug/fgos` (built 15:27:27, newer than every touched Rust source) with `FGOS_HOST_BIN`, and stdin was `</dev/null`. I ran three read-only static/fixture `node --test` files. One refusal probe ran in my session scratchpad.

## 1. Wording-claim table

Primary evidence I checked myself:

- **Seat masks.** I parsed every `protected/launch-envelope/*.json` of the solo `unit-run-1791270002490-60cc7659` and the panel `unit-run-1791270868625-812a0306` under mdview. Every seat has `--ro-bind / /`. Only `panelist-3` (gemini) adds a `--tmpfs` over forgentX.
- **Contamination timing.** `completion-contaminated-generation.json` has birth = ctime = mtime 14:12:38 +0700 and contains "do not add a mechanical". The panelists' `run.json startedAt` is 07:14:28.6–.8Z (14:14:28 +0700), about 110 s later. Synthesis started at 07:17:18Z.
- **Judge scratch.** The judge run `asgn-claude-1791271898870/runs/01` contains only `run.json` (cwd `/var/tmp/discussion-judge-nmGTTl`). That directory no longer exists. `~/.claude/projects/` has no project directory for that cwd (the run used `--no-session-persistence`).
- **Rejected judges.** Their `execution` argv has `acceptEdits` and no `--tools`, `--safe-mode` or `--include-hook-events`. Their transcripts score A = panel: 2/1/1/1/1 = 6 and 1/1/1/1/1 = 5; B = solo: 1/2/2/1/1 = 7 in both.
- **Eval shard.** I compared `git show 2fd5cb6a3^:` with `2fd5cb6a3:` for `.fgos/observe/evals/observe-independent-comparison-261006.jsonl`. Only `setup` and `judge` changed. `evalId`, `ts`, `scores`, `runRefs`, `question`, `harness`, `rubric`, `v` and `type` are byte-equal. `metrics eval list --dir forgentX` returns exactly 4 records (`observe-solo-opus-261005`, `observe-panel-261005`, `observe-independent-solo-261006`, `observe-independent-panel-261006`) with `invalid: []`.

| Location | Wording | Verdict | Basis |
|---|---|---|---|
| eval shard `…-261006.jsonl:1,2` `setup` | "arm separation by read audit only … not sandbox-isolated … forgentX … readable to the solo, Sonnet, xai and GLM seats; only the Gemini seat masked it"; the packet carries the later decision | TRUE | Matches the envelope parse and the 110 s timing |
| eval shard `:1,2` `judge` | "scratch holding only A.md/B.md … asserted only in coordinator-authored JSON and is unproven (scratch deleted)"; "one isolated judge" | TRUE | Scratch gone. The isolation argv (`--safe-mode --tools '' --strict-mcp-config --include-hook-events`) is in `completion-judge-evidence.json` |
| eval shard `evalId` `observe-independent-*` and the shard name | the name says "independent" | OVERSTATED (LOW, immutable id) | The append-only identity cannot be renamed. The corrected `setup` text discloses the limit |
| `observe-measurement-261005.jsonl:1,2` | "not an independent arm", "data-blind A/B, not isolated" | TRUE | Unchanged since the prior round |
| `completion-data-blind-judge{,-2}-evidence.json` | `isolated: false`; limits now say "Not isolated: default executor argv"; the "tool-disabled" text is removed | TRUE | `grep tool-disabled` returns 0 in both files. The argv was checked above |
| `completion-judge-evidence.json` limits | "cannot be independently verified by a tool-disabled judge" | TRUE | This is the accepted judge, and its argv has `--tools ''` |
| plan.md:86 | "audited isolated Opus judgment … Arm separation is by read audit only … **not** sandbox-isolated … evidence condition differs" | TRUE | As above |
| plan.md:87 | "does not add independence evidence beyond the read-audited comparison above" | TRUE; the contradiction with :86 is resolved | — |
| plan.md:182 | "actual isolated Opus judgment" | TRUE | Judge flags |
| plan.md:186 | "scratch-only-A/B inventory is coordinator-attested and UNPROVEN"; "the source/import guard and the restoration of the deleted stance-prompt regression test are **in progress**" | first part TRUE; **second part FALSE at commit time** | The guard and the restored tests landed in `5608387d3`/`012595aca`, 7–11 s **before** `2fd5cb6a3` (15:37:30/34 vs 15:37:41) |
| phase-06:15, :51 | "read-audited (not sandbox-isolated)"; "Judge isolation is demonstrated"; "scratch inventory … **UNPROVEN**" | TRUE | Judge isolation is shown by retained argv and SDK init (self-captured; the capture harness is deleted, as disclosed earlier) |
| phase-06:56 | "default (non-isolated) argv … solo 7 vs panel 6 and solo 7 vs panel 5" | TRUE | Transcripts recomputed |
| how-to `compare-…eval.md:62-67` | `/var/tmp`, because the confined launch mounts a tmpfs over `/tmp` | TRUE | The judge argv has `--tmpfs /tmp` |
| how-to `:111`, `:117`, `:141` | "coordinator-authored assertion, not an independently retained listing"; the reference comparison "is read-audited only" | TRUE | — |
| how-to `:172-175` `--question` example | `q=$(jq -r .objective …unit.json)` | TRUE | Run from the forgentX root, it returns the two 261006 records. With `--harness=fgos-panel` it returns only the panel record |
| 2026-10-05 journal :4, :15, :25 | "false judge-isolation", "do not prove isolation or an independent setup comparison" | TRUE | — |
| 261005 report :63-67, :87 | "not isolated", scratch "UNPROVEN", "setups were not independent" | TRUE | — |
| **journal `2026-10-06-observe-independent-comparison-completion.md:2,7`** | title "Observe independent comparison completion" | **OVERSTATED (remaining)** | The comparison was read-audited, not independent by enforcement |
| **same journal :11** | "Completed the remaining independent historical-question comparison" | **OVERSTATED (remaining)** | Same, and the packet differs from the 2026-10-04 evidence condition |
| **same journal :19** | "Scratch before/after exactly A.md and B.md with unchanged hashes." | **FALSE as stated** (an unproven claim written as a verified fact) | Scratch is deleted. The only source is coordinator JSON |
| **same journal :23** | "Whole plan stays in progress solely because exact source/import guards conflict with the runtime prohibition" | **FALSE at HEAD** | Guard and exact closure exist and pass (my run: 25/25) |
| 2026-10-06 repair-verification journal :39 | "A separate isolated Opus canary" | TRUE | `isolation-canary.json` has all four flags |
| **ledger `observe-acceptance-fixes-261006.md:3`** (status line at the top) | "reachable repairs complete and verified, including fresh **independent** historical-question A/B" | **OVERSTATED (remaining)** | Corrected only 190 lines later (:192). A stranger reads the false summary first |
| **ledger :85** | "new independent arms verified" | **OVERSTATED (remaining)** | Superseded by :192 but not marked |
| **ledger :168** | "Before/after scratch contains exactly regular `A.md`/`B.md`, unchanged bytes/hashes" | **FALSE as stated** | Superseded by :195 but not marked |
| ledger :191-196 (new section) | owner confirmation, independence, packet, rejected judges, scratch UNPROVEN | TRUE | — |
| **CHANGELOG `[Unreleased]` › Changed, "Discussion comparison guidance …"** | "historical confounded scores remain distinct from new **independent** evals" | **OVERSTATED (user-visible, remaining)** | Not touched by `2fd5cb6a3` |
| CHANGELOG › Fixed "Evaluation provenance …" | "existing real scores are not presented as an independent setup comparison" | TRUE | — |
| `completion-eval-record-smoke.json`, `completion-eval-list.json` | still contain "independent current arm" | OVERSTATED, disclosed (ledger :196) | These are command-output snapshots. Acceptable |

**Owner-confirmation wording.** "Owner xác nhận ngày 2026-10-06 trong phiên lead … bản ghi hội thoại không nằm trong repo" (plan.md:75, :182; phase-04/06; 261005 report; 2026-10-05 journal) is **TRUE and not an invented quote**. The lead session transcript `~/.claude/projects/-home-vantt-projects-forgentX/913dab9b-….jsonl` line 2289 (2026-10-06T08:13:15Z) has the owner replying "2. đúng của anh. ý là kêu nó tự làm hết", in answer to the question at line 2279. The repo wording paraphrases it and quotes nothing. The older quote "Đúng, xác nhận yêu cầu" (ledger :7) still has no source outside the earlier harness, and ledger :191 now correctly marks it as non-evidence.

## 2. Whole-plan acceptance

| # | Criterion (plan.md / phase) | Box | Verdict | My check |
|---|---|---|---|---|
| 1 | show-run resolves nested panelist (:79) | [x] | PASS | `node bin/fgos.mjs dispatch show-run run_unit-run-1791219961331-276f364c/panelist-1/1_01 --dir mdview` returns the nested `runDir` |
| 2 | `findRunningRuns` nested (:80) | [x] | PASS | `assignment-layout.test.mjs:76` asserts it. My run of that file plus the doctor tests: 31/31 |
| 3 | Dated coverage forgentX 1199 / mdview 90 (:81) | [x] | PASS (dated) | Live forgentX: 1199 = 929 + 51 + 219, recent 0, `find` 1199. mdview is now 123 = 110 + 7 + 6, `find` 123, which is later than the dated 90 and is disclosed as a snapshot |
| 4 | `metrics runs --by=role` (:82) | [x] | PASS | mdview `--since=2026-10-05T10:25:29.807Z --until=…11:20:00Z`: 6/6/8/5/5 = 30 |
| 5 | Doctor coverage (:83) | [x] | PASS | `checkObserveRunCoverage` with the rebuilt host passes on both roots: Node 1199/929 = host, Node 123/110 = host |
| 6 | Four Delphi workflows, 30 vs 28 (:84) | [x] | PASS | `metrics discussions --since=2026-10-05 --by=workflow` (mdview): `1f688991` 1/0/0, `842d7c56` 3/8/9, `6466fc15` 4/10/11, `28f05967` 4/10/10. That is 12 units, 28 seats, 30 attempts = 30 runs, with 2 fallback seats |
| 7 | Three valid votes, agreement 1, behavioral CLI regression (:85; phase-05:47-48) | [x] | PASS at HEAD | The v2 summary of `unit-run-1791219961331-276f364c` has three `kind: panelist` `no-gate` valid votes, agreement 1.0. The restored test "workflow and unit CLI options reach the actually dispatched prompts…" is green in the lead's full run (below) |
| 8 | Fresh comparison + isolated judge (:86) | [x] | PASS as now worded | §1 |
| 9 | Final suites (:87) | [x] | **Stale text, true reality** | :87 and :182 cite 6,851/6,778 as "exactly one final" run, "not repeated for later evidence-only work". But two **code** commits followed. The lead ran a second full suite on the final tree: scratchpad `full4.out` at 15:37:01 shows tests 6863, pass 6790, fail 0, skipped 8, todo 65, exit 0. It started 08:30:57Z, after the last committed code edit (15:30:52). That run is **not recorded anywhere in the repo** |
| G | Source/import guard (:88; phase-01:68) | [ ] | **Met but unticked, and its status text is false** | `assignment-enumerator-guard.test.mjs` (allow-list with reasons, stale-entry check, detector self-test) and the exact `deepEqual` closure in `dispatch-reconciliation-import-graph.test.mjs:140` are both in HEAD. My run: 25/25 pass. The spec was extended in place (`runner.md:1433`). Yet plan.md:68, :75, :88, :182, :186, phase-01:4, :19-20, :71, :73 and the ledger status table all still say "unmet / in progress / runtime-policy conflict". Before ticking, the plan should state the disclosed limits: static single-file heuristic, no cross-file parameter flow, no `glob`/`child_process`, and dynamic `import()` excluded (`visibility-session.mjs:299,303`) |
| P5 | phase-05:49 sub-note "đang khôi phục" | — | **False at HEAD** | Restored in `012595aca` (role-tasks, panel, workflow-runner tests) |
| P6 | phase-06 status completed, :50-52 | [x] | PASS | Eval list is 4/`invalid: []`. Exit 4 on the old host is not re-run (prior round) |

**Is "reachable repairs complete" still dishonest?** Yes, in one place: ledger :3 still says "complete and verified, including fresh independent … A/B". The plan itself is now the reverse, and **under-claims**. It shows the guard as open and the stance test as being restored, when both are done. It also cites a superseded full-suite run.

## 3. Docs vs behavior spot checks

| # | Claim (doc:line) | Code / live | Verdict |
|---|---|---|---|
| 1 | `invalid-timestamp` for a non-RFC3339 settlement (observe.md:56, :57; runner.md:1433; CHANGELOG) | `lib.rs:595`; `assignment-layout.mjs:131` `isRfc3339Instant` | TRUE |
| 2 | First nonblank field is decisive; no fall-through (observe.md:56) | `assignment-layout.mjs:131` skips with `continue` | TRUE |
| 3 | Future mtime is recent only within 60 s (observe.md:57; CHANGELOG) | `lib.rs:474-483` (`MAX_FUTURE_MTIME_SKEW` 60 s); `registrations.mjs:5758-5762` | TRUE |
| 4 | Agreement needs ≥ 2 valid votes (observe.md:61; runner.md:1435; contract v2:83; CHANGELOG) | `discussions.rs:57` `MIN_VALID_VOTES = 2`, `:168`; Rust test `fewer_than_two_valid_votes_is_unmeasured_and_keeps_its_counts` | TRUE |
| 5 | `unitsUndetermined`, excluded from `passRate`/`unitsFailed` (observe.md:61) | Live forgentX 23/6/46 → passRate 23/29 = 0.793. mdview 25/21/2 → 25/46 = 0.543 | TRUE |
| 6 | "About 46 older forgentX units are now undetermined" (CHANGELOG) | My count of `outcome` across `unit-run-*/unit-summary.json`: undetermined 46 | TRUE |
| 7 | 12 → 0 invalid-contract in forgentX (repair report :77) | Live `summariesSkippedByReason: {missing-timestamp: 4}`, no `invalid-contract` | TRUE |
| 8 | "reader chỉ nhận v2, version khác báo `unsupported-version`" (observe.md:59; CHANGELOG "Summaries of another version are skipped as `unsupported-version`") | `unit_summary.rs:150-156` checks missing/invalid timestamp **before** version. The four v1 summaries left in forgentX (`2353b379`, `96579bab`, `107d7b10`, `6cb2ff04`, which still carry a guessed `pattern: "solo"`) are reported as `missing-timestamp`. mdview's v1 `72e118ad` is `unsupported-version` | **PARTLY TRUE**: precedence is undocumented (LOW) |
| 9 | Backfill fills gaps by default; `--regenerate` rewrites or removes; active units untouched (observe.md:59; runner.md:1435; CHANGELOG) | `backfill-unit-summaries.mjs:5,16,68-73,92` | TRUE |
| 10 | `--stance-options` with `--resume` refused with exit 4 (CHANGELOG; runner.md:1435) | `node bin/fgos.mjs run --resume unit-run-0-x --stance-options 'a\|b' --dir <scratch>` → "cannot provide stanceOptions when resuming…", rc 4, no files | TRUE |
| 11 | Eval refusal names shard and line, at most 5, then "and N more" (observe.md:64; CHANGELOG) | `eval_journal.rs:274-282` | TRUE |
| 12 | Contract `run-result.read.v1.json` names `invalid-timestamp` | `"invalid-timestamp"` is present | TRUE |
| 13 | Contract `unit-summary.read.v2.json` has undetermined/`unsupported-version`/quorum | Present at :31 and :83 | TRUE |
| 14 | `observe.eval.v1.json` `question` "Identifier of the exact shared question"; `runRefs` "identifiers … not paths to guessed reports" | The records store the full objective text, and their `runRefs` hold `report=/home/…/agent-report.md` and `evidence=…` | **MISMATCH (LOW, disclosed but unfixed)** |
| 15 | CHANGELOG › Fixed "treats zero valid votes as unmeasured" | Superseded by › Changed "at least two" in the same `[Unreleased]` | **CONTRADICTORY (LOW)** |
| 16 | runner.md:1433 "Mọi việc liệt kê … ngoài `assignment-layout.mjs` bị … guard chặn" | The guard is a static, single-file heuristic with disclosed blind spots | OVERSTATED (LOW) |
| 17 | reading-map.md:51 points to `unit-summary.read.v2.json` | `git grep unit-summary.read.v1` in docs/src/packages/test/apps returns 0 | TRUE |
| 18 | distribution.md doctor row: Observe ids backticked only | `` `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage` ``. The row was not touched in `b3346957a..HEAD`. Older parenthetical prose elsewhere in the row predates this plan | TRUE for this plan |
| 19 | architecture-manifest has a row for every new `.mjs` under `src/` | The only new `src` file in range, `provider-auth-failure.mjs`, has a row. The guard is under `test/` | TRUE |
| 20 | Exactly one H1 per changed doc | All docs changed in the range pass. `AGENTS.md`/`CLAUDE.md` count 3 and 2 because of the GitNexus generated block (`5df843bdb`) | TRUE for this round's docs; pre-existing elsewhere |

## 4. Process findings

### MEDIUM

1. **The docs commit landed stale on arrival, and the plan now misstates its own state.** `2fd5cb6a3` (15:37:41) was written in parallel and committed after `5608387d3`/`012595aca` (15:37:30/34), but says those repairs are "in progress".
   - Locations: plan.md:68 (phase-1 status), :75, :88 (unticked, "being written by a separate agent"), :182, :186; phase-01:4, :19-20, :71, :73 ("runtime policy forbids"); phase-05:49 ("đang khôi phục"); ledger status table (:202-206).
   - Failure scenario: a stranger agent (L5 Q1–Q5) sees the guard unmet. It either re-implements a second enumerator guard (RUL11 duplication) or reports the plan blocked on a policy conflict that the repo already disproves.
   - Fix: tick :88 and phase-01:68 with the disclosed heuristic limits; set phase 1 and the plan status by the remaining criteria; remove the "in progress"/"runtime-policy" sentences; replace the phase-05:49 note; update the ledger table.
2. **The latest green full suite is unrecorded, and :87/:182 still say "exactly one final" run, "not repeated for later evidence-only work".** The later work changed production code. Real evidence is the scratchpad `full4.out`: 6863 / 6790 / 0 fail / 8 skip / 65 todo, exit 0, started after the last code edit. Failure scenario: the repo cites a suite that does not cover HEAD's `run.mjs`/`unit-summary.mjs`/`lib.rs`, so the L5 Q5 proof is not traceable. Fix: record the second run (count, time, tree) in the ledger and plan.
3. **Remaining overstated or false honesty statements outside the corrected set:**
   - journal `2026-10-06-observe-independent-comparison-completion.md`: title :2/:7, :11, :19 (scratch stated as fact), :23 (guard reason, now false);
   - ledger :3 status line, :85, :168;
   - CHANGELOG `[Unreleased]` "new independent evals" (user-visible).
   The docs agent left both journals alone (its report :84) and so said explicitly. Fix: add a dated correction note to the journal (append, keep it historical); strike or annotate ledger :3/:85/:168 to point at :192-195; change the CHANGELOG wording to "read-audited evals".
4. **Append-only eval records were rewritten in place.** `2fd5cb6a3` replaced lines 1–2 of a tracked eval shard. CHANGELOG and observe.md:64 call the store append-only ("không … tự sửa log"). The ledger says the fields "được sửa", but the commit message does not say that committed log lines were rewritten. The `.fgos/**/*.jsonl` shrink guard did not fire, because the lines grew. Failure scenario: a precedent for silent log edits. A later edit could change scores with the same mechanism, and nothing would flag it except `git log -p`. Note that scores, ids, ts and refs are verified unchanged. This is an owner decision (§5.4).

### LOW

5. observe.md:59 and CHANGELOG `unsupported-version`: undocumented precedence (spot check 8). The four forgentX v1 summaries keep a guessed `pattern: "solo"` because backfill never touches "active" units.
6. `observe.eval.v1.json` `question`/`runRefs` descriptions do not match the stored records (spot check 14).
7. CHANGELOG Fixed vs Changed vote-threshold contradiction (spot check 15).
8. runner.md:1433 states the guard as absolute (spot check 16).
9. `5608387d3` mixes two areas: the run-layout/doctor foundation and the eval-store error text. The commit message discloses both. Acceptable, but it is not a single theme.
10. `metrics eval list` hung once without `</dev/null` (docs report :83). This was not investigated or recorded. It is a possible host stdin wait.

### Hygiene checks (pass)

- **Commit order and themes.** The order is foundation, then discussion, then docs/evidence. The docs commit contains only md/json/jsonl and no code or contract.
- **`.fgos` scope.** The only `.fgos` change in the three commits is the eval shard (2+/2−). Untracked `.fgos/events`, `.fgos/backups` and plan dirs were not swept in.
- **Leaks (counts only).**
  - `5608387d3`: 0 `/home/vantt`, 0 credential patterns.
  - `012595aca`: 0 and 0.
  - `2fd5cb6a3`: 9 added lines with `/home/vantt` (eval records and reports, username/path only). Its 1 credential-pattern hit is a false positive: the earlier report's list of the patterns it grepped for.
- **Codes and labels.** No plan ids, phase numbers, audit labels or finding codes appear in the lines added under `src test packages scripts apps` in `b3346957a..HEAD`, or in the three commit messages. The only near miss is "second acceptance round" in the docs subject, which is descriptive, not a code. The older finding codes in `dispatch-reconciliation-import-graph.test.mjs` test names (`F4`, `R1`, `M1b`) predate this range.

## 5. Owner decisions (stated neutrally)

1. **The `apps/fgos/tests/cli_tests.rs` edit, outside the assigned file list (`012595aca`).**
   - What changed: the fixture moves from v1 to v2 and gains a second panelist; the assertions go from 2 seats / 1 vote to 3 seats / 2 votes.
   - Why it was needed: under the new reader, a v1 fixture becomes `unsupported-version`, and a single voter becomes `unmeasured`, so the test would fail. The single-vote path is covered separately by `fewer_than_two_valid_votes_is_unmeasured_and_keeps_its_counts`.
   - Options: (a) keep it, as the forced consequence of the contract change; (b) revert it and accept a red CLI test.
   - Recommendation: (a). The scope breach is mechanical.
2. **Flag overdue units (`run.json.startedAt + timeoutMs`)?**
   - Evidence: forgentX has 4 "active forever" units (with stale v1 summaries) and `summariesMissing` 2; mdview has 1 active unit and `summariesMissing` 3. The reader cannot separate a running unit from an abandoned one (documented at observe.md:59). Deadlines are inexact: late `dispatch recover`/supervisor settlement is possible, and inline units have no deadline.
   - Options: (a) leave as documented; (b) a Node backfill diagnostic `overdue` that changes no state; (c) a reader-side flag, which the discussion agent says breaks the reader contract.
   - Recommendation: (b) only if the owner wants the signal. It is cheap and stays non-authoritative.
3. **Keep `invalid-timestamp` as a separate reason?**
   - Evidence: live impact is 0 in both roots (929/929 and 110/110 well-formed). The reason is already in both languages, the shared fixture, both contracts, observe.md, runner.md and CHANGELOG.
   - Options: (a) keep it; (b) merge it into `no-timestamp`, which needs another contract, spec, fixture and changelog edit and loses the "present but malformed" signal.
   - Recommendation: (a).
4. **(Found in this round) Rewriting committed append-only eval lines.**
   - Options: (a) accept as a one-off, disclosed correction (scores, ids, ts and refs are verified unchanged) and say so in the ledger; (b) revert to the original lines and append corrections as new records with new `evalId`s (this duplicates scores in `list`); (c) design a supersede field later.
   - Recommendation: (a), plus an explicit ledger line that the two lines were rewritten in place, and why.

## 6. Verdict

**ACCEPT WITH FIXES.**

- **What landed.** Every targeted wording correction landed and is true: the eval `setup`/`judge`, the rejected-judge files, plan.md:86/87, phase-06, the how-to `/var/tmp` and `--question` changes, and the owner wording, which is backed by the lead transcript. Eval scores, ids, ts and refs are unchanged, and the store lists 4 valid records.
- **Remaining overstatements:** the 2026-10-06 comparison journal, ledger :3/:85/:168, and the CHANGELOG "independent evals".
- **Plan state:** the plan was committed stale. It shows the done guard and the restored tests as in progress, and it cites a superseded full-suite run while the real green run on HEAD is unrecorded.
