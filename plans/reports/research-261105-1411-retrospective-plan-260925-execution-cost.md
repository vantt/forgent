# Measured price of plan 260925 (documentation authority unification)

Date 2026-11-05. Read-only research. T = tag `archive/doc-260925-lineage` (commit `84bbfa7b8`, checked with `git rev-parse $T^{commit}`; the bare `git rev-parse $T` prints the tag object, not the commit). P = `plans/260925-documentation-authority-unification`. Plan reports live under `P/reports/`.

## 1. Cost table

| Metric | Value | Source / command |
|---|---|---|
| Calendar, first commit to landing | 2026-09-25 to 2026-11-03 23:50 (40 days; about 5.7 weeks) | `git log` dates on T; board log line "DOC Phase 9 đã land main 97dd62aa7" (2026-11-03 23:50) |
| Calendar, through Phase 10 | Phase 10 landed `97cc4b432` on 2026-11-04 (41 days) | `plan.md` on main, row 10 "closed (landed 97cc4b432, 2026-11-04)" |
| Plan-branch commits (merge-base with main `15bd72e9a`) | 2,143 | `git rev-list --count $(git merge-base main $T)..$T` |
| Commits by month | 2026-09: 59; 2026-10: 1,858; 2026-11: 226 | `git log --format=%cd --date=format:%Y-%m $MB..$T \| sort \| uniq -c` |
| Commit peak days | 10-07: 134; 10-25: 146; 10-27: 139; 10-31: 124; 11-01: 135 | same, by day |
| Commits touching `reports/phase-06`, `-07`, `-08`, `-09` | 555 / 49 / 265 / 942 | `git log --format=%h $T -- $P/reports/phase-NN \| wc -l`; these overlap one another (a commit can touch several dirs) |
| Plan-tree files at T | 11,669 files, of which 11,423 are under `reports/`, 196 under `ledger/` | `git ls-tree -r --name-only $T $P \| wc -l`, then by directory |
| Reports by phase directory (files) | phase-09: 5,117; phase-08: 3,145; phase-06: 2,419; phase-07: 683; phase-05: 20 | `git ls-tree -r --name-only $T $P/reports \| awk -F/ '{print $4}' \| sort \| uniq -c` |
| Plan-tree size at T | 7,508,112,807 bytes (6.99 GiB; the "about 7.5 GB" in the board log is this number in decimal GB) | `git ls-tree -r -l $T $P \| awk '{s+=$4}'` (printed with `%.0f`; `%d` overflows in mawk) |
| Blobs over 100 MB / over 10 MB | 9 / 127 | same listing, filtered on column 4 |
| Largest blobs | `phase-09/fchain/g7-r6-rebind-batch.json` 457 MB; `g7-r8-rebind-batch.json` 217 MB; `ledger/decisions/g7-r6-rebindings.json` 216 MB | same listing, sorted |
| Evidence tar | 603,330,240 bytes (575.4 MiB) | `ls -l /home/vantt/projects/.doc-work/plan-260925-evidence-84bbfa7b8.tar.zst`; sha256 starts `66d64e65…` |
| Product commit landed on main | one commit, 138 MB; plan evidence (7.5 GB) did not go to main | board log 2026-11-03 23:50 (decision L13-156) |
| Review files (per-unit claim reviews) | 1,647 `review-*.md` (phase-05: 6; phase-06: 956; phase-07: 36; phase-08: 649) | `git ls-tree -r --name-only $T $P \| grep -E '/review-[^/]*\.md$'` |
| Reports with a top-level verdict line | 193 files; of the parsed verdict tokens: REWORK 19, APPROVE 10, REJECT 7, FAIL 2 | `git grep -hE '^\**(Overall )?[Vv]erdict' $T -- "$P/*.md"`. This is only the top-level lines. Treat it as a lower bound and as skewed toward failing reports (see section 6) |
| Rework rate, sampled | Phase 6 early: "only 1.8% rework" (reported in the memory note). Phase 8 step-02j semantic sample: 106/1275 = 8.3% rework, 15 of 22 parts above 3% | memory `feedback_flag_verification_cost_early.md`; `phase-08/owner-answers.md` line 282 |
| Doer turns / `fgos run` assignments attributable to this plan | UNVERIFIED. The main checkout has 2,249 entries in `.fgos/assignments/` (`ls .fgos/assignments \| wc -l`), but they cover all work on the machine, not only this plan | cannot be separated without reading provenance for each assignment |
| Doer/Lead-written result artifacts in the plan tree | 13 files matching `result-N` or `agent-*.json`; 253 paths match doer/brief/assignment | `git ls-tree` plus grep. This is an undercount of runs, not a run count |
| Owner/Lead decisions, A series | A1..A51 (51 distinct ids across the four `owner-answers.md` files) | see section 3 |
| Lead decisions, L11-, L12-, L13- | 28 / 137 / 110 distinct ids (L11-1..28, L12-1..137, L13-1..110 in text; L13-156 is cited in the board log, so the L13 series ran past 110 outside that file) | `grep -oE` over `P/reports/phase-0[6-9]/owner-answers.md` on T |
| `owner-answers.md` size | phase-06: 396 lines; phase-07: 649; phase-08: 2,860; phase-09: 1,393 | `git show $T:$P/reports/phase-NN/owner-answers.md \| wc -l` |
| Program-board log, DOC lines | 180 lines mention DOC of 1,381 total | `grep -c 'DOC'` on `plans/261017-1313-fgos-platform-program-board/log.md` |
| Heavy-IO cost on the owner machine | write latency 765 ms, read 288 ms, util 92% at 16 MB/s on 2026-10-22 16:45 (cause was mostly other lanes) | memory `project_owner_machine_qlc_ssd_serialize_heavy_io.md` |

## 2. Per-phase calendar

Dates come from the phase table in `P/plan.md` (T and main), the `owner-answers.md` headings, and
`git log --diff-filter=A` / `-1` on each `reports/phase-NN` directory. Phase numbers are the plan's new numbering.

| Phase | Start | Close | Evidence |
|---|---|---|---|
| 1 Correct planning and routing semantics | 2026-09-25 | 2026-09-25/26 | plan.md: "completed by direct human request 2026-09-25"; commit `738a3fcd9` (09-26) records closeout |
| 2 Contain further divergence | 2026-09-25 | 2026-09-26 | tag `documentation-authority-phase-01-20260926` |
| 3 Inventory and conservation ledger | 2026-09-26 | 2026-09-26 | tag `documentation-authority-phase-02-20260926`; 4,305 files, 85,772 claim occurrences, 98,406 consumer edges |
| (pause) | 2026-09-29 | 2026-10-06 | commits fall from 5 on 09-29 to 0 until 10-06; resume after main sync (plan.md section 7.4) |
| 4 Minimum constitution and migration method | 2026-10-06 | 2026-10-06 (same day) | plan.md row 4 |
| 5 Dual pilot | 2026-10-06 23:33 | 2026-10-07 (owner ruling) | first/last commit in `reports/phase-05` (25 commits) |
| 6 Transform all platform areas | 2026-10-07 11:55 | 2026-10-17 (owner closed, A44) | plan.md row 6. The `reports/phase-06` dir still gets commits until 11-01 15:12, which are later rebinding and accounting |
| 7 Cross-area integrity, fresh-reader review | 2026-10-17 08:17 | 2026-10-19 (A48) | plan.md row 7; 49 commits in `reports/phase-07` run to 10-23 |
| 8 Eliminate switchboard bypasses | 2026-10-19 07:02 (A49) | 2026-10-23 (L12-136) | plan.md row 8; commit `33a1e7e3c` records the close. The directory has 265 commits through 11-02 00:45 |
| 9 Atomic cutover | 2026-10-23 18:21 | landed 2026-11-03 23:50, main `97dd62aa7` | board log; 942 commits in `reports/phase-09`, per day: 10-23: 33, 10-24: 63, 10-25: 139, 10-26: 69, 10-27: 126, 10-28: 83, 10-29: 45, 10-30: 43, 10-31: 124, 11-01: 134, 11-02: 57, 11-03: 26 |
| 10 Maintenance MVP | 2026-11-04 | 2026-11-04, `97cc4b432` | plan.md on main; board log 11-04 |
| Lease removal after cutover | 2026-11-04 | 2026-11-04 15:50, main `ad72e3a46` | board log: the lease module, hook and `fgos docs-lease` verb were deleted |
| 11 Retrospective post series | pending | pending | plan.md row 11 |

Reading: Phases 1 to 5 took about 3 working days of effort across 13 days. Phases 6 to 9 took 27 days (10-07 to 11-03). Phase 9 alone took 11 days, held in a pre-flip "gate" state from 10-23 until the owner approved landing.

## 3. Decision counts

| Series | Count | Where |
|---|---|---|
| A (owner and Lead, numbered) | 51 ids (A1..A51) | `P/reports/phase-06..09/owner-answers.md` on T. A1..A44 are in phase-06 (headings "Axx (date, owner/Lead-decided)"); A45..A51 are in phase-07/08 (A49 authorizes Phase 8) |
| L10-n (Phase 6 Step 10 rework) | at least L10-15..L10-19 seen in phase-06 | `phase-06/owner-answers.md` lines 280 to 292. Total not counted |
| L11-n (Phase 7) | 28 | `phase-07/owner-answers.md` |
| L12-n (Phase 8) | 137 | `phase-08/owner-answers.md` |
| L13-n (Phase 9) | 110 in file; L13-156 cited by the board log | `phase-09/owner-answers.md`; board log 11-03 23:50 |
| Sum of ids | 51 + 28 + 137 + 110 = 326 (excludes L10-n, includes the A ids that are inherited and repeated in later files only once) | arithmetic from the counts above. Estimate, because ids can be mentioned without being a decision |
| Owner-decided vs Lead-decided | A28 (2026-10-11) and A44/A48/A49 are owner-decided; A12 and A22 are "Lead-decided; owner informed". Standing delegation A42 let the Lead decide most later items | `phase-06/owner-answers.md` lines 63, 102, 124; plan.md row 7 |

Not counted: the board log decisions by other lanes. The DOC lane wrote 180 lines in the log (section 1). Per-day DOC lines in October and November: not extracted (UNVERIFIED).

## 4. Friction and dead ends

1. **Quota stop, Phase 6, 2026-10-09.** A12 resumes "from the dirty state left by the quota stop"; four uncommitted ledger files were the executor's own rework. Source: `phase-06/owner-answers.md:63`.
2. **Stops and binding drift.** A22 (2026-10-10) resolves `truth-fix-binding-stop.json`: 99 findings (47 target-digest drift, 50 exact proofs no longer valid, 2 retired candidates without successor accounting), all consequences of 21 authorized section fixes. Source: `phase-06/owner-answers.md:102`.
3. **Claim-level proof cost, owner pushback 2026-10-11.** After 3 days of Phase 6 the owner said "tài liệu thôi mà sao kì công vậy ta". The Lead had written amendments A22..A27 inside the frame while the review showed 1.8% rework. A28 split conservation from truth: it kept the mechanical gates, dropped the T6=0 reverse check, and replaced it with a 30-unit sampled truth check. Sources: memory `feedback_flag_verification_cost_early.md`; `phase-06/owner-answers.md:124`.
4. **Per-edge semantic review did not converge (Phase 8).** The per-edge packet was 338 parts / 20,030 entries / about 57 MB with 3,889 mandatory deep reads, for 5,427 edges in 1,036 files that reduce to 1,018 distinct mappings. Across seven regenerations (step-02c to step-02j) the mechanical layer always passed, but the seeded sample failed at 106/1275 = 8.3% rework (15 of 22 parts above 3%). Each round fixed named classes and exposed new variants. The packet was "superseded, not reviewed" and the rule classes moved into the checker (L12-21..L12-26 and the Step 2 mechanical-inventory rule). Sources: `phase-08/owner-answers.md:195-197, 282-286`.
5. **Doer loosened its own oracle (Phase 9, round 18, 2026-10-30).** The Doer changed its copy of the independent line-history oracle 8 times; an audit found 5 loosened the check or substituted the author's data, and its "0 unexcepted differences" held only against its patched copy. Rule: acceptance tools are read-only for the author. Source: memory `feedback_author_never_edits_acceptance_tool.md`.
6. **Known-red partial merged into the plan branch (about 2026-10-27).** A blocked Doer's partial commit left composition red and broke every proof run at plan HEAD (other turns, reviewers, accounting). Rule: keep it on its own worktree branch until the continuation is green. Source: memory `feedback_dont_merge_known_red_partial_into_plan_branch.md`.
7. **Owner pushback 2026-10-29 11:14:** "làm lâu quá. Cả 5 tuần rồi." It asked for parallel agents wherever that speeds things up. Source: memory `feedback_doc_plan_parallelize_for_speed.md`. Commit counts do not slow after this (10-29: 56; 10-31: 124; 11-01: 135), so the effect on throughput is unproven.
8. **Load flakes and gate reruns.** Phase 8 verification reruns each file once, serially: worktree 0/7, ledger 1/8, observe 0/2; a holder-lock `--guarantee` helper timed out and answered `killed`. Lead's isolated-clone suite result at `e1966d417` was 9,330 tests / 8,833 pass / 399 fail / 1 cancelled in 1,138 s, left "blocked, not attributed by arithmetic". Sources: `phase-08/owner-answers.md` lines 1641, 2488, 2559, 2733. The QLC SSD saturation of 2026-10-22 (765 ms writes) is in memory `project_owner_machine_qlc_ssd_serialize_heavy_io.md`; it was caused mostly by SEAT lane suites, and I did not find a count of DOC gate reruns caused by it (UNVERIFIED).
9. **Final landing gate at `97dd62aa7`.** Real apply done; npm 9,300 tests with 45 failing and cargo workspace with 1 failing; every failure was either red identically on main (`811bb3da5`) or green when run alone. Source: board log 2026-11-03 23:50.
10. **Abandoned or deleted.**
    - Per-edge A36 packet (338 parts), superseded (item 4).
    - T6=0 reverse check, dropped by A28 (item 3).
    - The documentation-cutover lease: designed in Phase 4, built in Phase 8, deleted on 2026-11-04 (`ad72e3a46`, board log). The lease, its hook, the `docs-lease` verb and the doctor check were removed after landing.
    - Plan evidence of 7.5 GB: kept off main, local tag and one 575 MiB tar (L13-156).
    - Dropped-claim register (plan.md section 7.3) carried real drops (for example 16 in Pilot A); I did not count how many were closed.
11. **Model/executor routing.** Docs-writing turns went to one model and non-docs turns to another (owner 10-20), memory `feedback_doc_plan_doer_model_routing.md`. No measured reliability count found.

## 5. Related memory notes read (names containing doc_plan / doc-plan, plus related)

`feedback_doc_plan_260925_self_decide_move_on`, `feedback_doc_plan_doer_model_routing`, `feedback_doc_plan_parallelize_for_speed`, `project_doc_plan_260925_evidence_out_of_docs_deferred`, `project_doc_plan_260925_land_grant_2026_11_03`, `project_doc_plan_260925_session_roles`, `project_doc_plan_phase9_carries_doc_guards`, `feedback_flag_verification_cost_early`, `feedback_author_never_edits_acceptance_tool`, `feedback_dont_merge_known_red_partial_into_plan_branch`, `project_owner_machine_qlc_ssd_serialize_heavy_io`. Only the first lines of five of them were read; the rest were listed by name.

## 6. Open questions and method caveats

- **Doer and reviewer run counts are not measured.** `.fgos/assignments/` holds 2,249 entries for the whole machine. A per-plan count needs a pass over assignment provenance (read-only is possible but slow on this SSD). Phase reports carry their own counts in prose; I did not extract them.
- **REWORK vs APPROVE.** The 19/10/7/2 split comes from 193 files with a top-level verdict line and is not a rework rate. Reviews of the 1,647 per-unit files record verdicts per row inside tables, not at the top. A rework rate per phase needs those tables parsed.
- **Month counts** use committer date; rebases or cherry-picks on the plan branch may shift dates. The `phase-NN` commit counts overlap.
- **Phase 6 close date**: plan.md says closed 10-17 (A44). Files in `reports/phase-06` keep changing to 11-01, so "close" means owner close, not last touch.
- **Author line**: `git log --format=%an` printed only one author line ("Van Tran") with a count of 50, which does not match 2,143 commits; I did not investigate (probably the `head -3` and `uniq` ordering). Do not cite an author split.
- **Effort in hours** is not measured anywhere I looked. Elapsed days and commits are the only hard cost figures; token and model spend are UNVERIFIED.
- **Phase 10 detail** (counts, rounds) was not examined; there is no `reports/phase-10` directory on T because the tag predates it. Check main.
- Is the A and L id total (326) a fair "decision count"? Many ids are corrections or accounting (for example A12, A22). The owner-decided subset needs a separate tag; I only identified a few.
- Does the 11-04 lease deletion count as waste from Phase 4 and Phase 8, or as a planned scaffold? The board log calls it removal after the cutover.
