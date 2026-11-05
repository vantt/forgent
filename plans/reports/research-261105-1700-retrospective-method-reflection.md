# Retrospective method reflection: how the plan 260925 post series was made

Date: 2026-11-05 (Asia/Saigon). Scope: a factual reconstruction of the method behind the Phase 11 retrospective series (commit `36737e5d6`, 2026-11-05 14:42 +07), written so it can be compared with an automated story-harvesting tool (momentry v0.3.0). Read-only.

Sources:

- **T**: Lead session transcript `~/.claude/projects/-home-vantt-projects-forgentX/a4954387-fafa-46d2-911f-4ea15b20d08d.jsonl`. Timestamps below are UTC as recorded in T; local time is UTC+7.
- **Spec**: `git show archive/doc-260925-lineage:plans/260925-documentation-authority-unification/phase-11-retrospective-post-series.md`, written 2026-10-20 in `18824b36a`.
- **Pack**: [retrospective-261105-1416-doc-260925-evidence-pack.md](retrospective-261105-1416-doc-260925-evidence-pack.md)
- **FC**: [review-261105-1423-doc-260925-retrospective-claims.md](review-261105-1423-doc-260925-retrospective-claims.md)
- **R-genesis**, **R-middle**, **R-trigger**, **R-built** and **R-cost**: the five research reports `research-261105-141[12]-retrospective-*.md` in this directory.

## 1. The pipeline as it was run

The owner wrote "ok làm Phase 11 đi" at T 07:11:49Z. The Lead (Opus) ran the whole series in about 31 minutes, ending with the report to the owner at 07:42:34Z. Every worker was an in-process Agent call: before spawning any, the Lead ran `fgos dispatch decide --for research|review --needs-soul` and got `in-process` (T 07:11:56Z and 07:23:38Z). Every report path came from `fgos convention path`.

| # | Stage | Agent (type, model) | Start → end (T, UTC) | Wall | Tool uses / subagent tokens |
|---|---|---|---|---|---|
| 0 | Lead pre-checks: dispatch decide, the 6 convention paths, the dates of `2085d88fe` and `f6139bf57`, the size of the tag's reports dir, the size of the local evidence tar | Lead | 07:11:54 → 07:12:08 | 14 s | 2 Bash |
| 1a | Research: genesis and the compound idea | general-purpose, sonnet | 07:12:19 → 07:16:19 | 239 s | 43 / 192.6k |
| 1b | Research: middle growth, how docs drifted | general-purpose, sonnet | 07:12:27 → 07:15:46 | 194 s | 31 / 160.5k |
| 1c | Research: what triggered plan 260925 | general-purpose, sonnet | 07:12:36 → 07:14:08 | 91 s | 12 / 149.4k |
| 1d | Research: what Phases 1–10 built, and the gain | general-purpose, sonnet | 07:12:46 → 07:15:47 | 178 s | 23 / 201.9k |
| 1e | Research: measured cost | general-purpose, sonnet | 07:12:57 → 07:15:41 | 164 s | 19 / 149.0k |
| 1x | Lead resolves two open points: `97cc4b432` is the fast-forward tip, and the tag is not on origin (`git ls-remote`) | Lead | 07:15:51 | <5 s | 1 Bash |
| 2 | Writer: evidence pack plus 6 posts, in Vietnamese | general-purpose, opus | 07:16:41 → 07:23:34 | 413 s | 24 / 199.8k |
| 3 | Fact-check, round 1 | code-reviewer, opus | 07:23:51 → 07:35:45 | 713 s | 104 / 224.9k |
| 4 | Writer applies the 23 edits (SendMessage resume of the same writer) | writer | 07:35:58 → 07:39:13 | 195 s | 23 / 256.1k |
| 5 | Lead spot-checks the changes by grep (59 phút, A50/A51, E6, the 368 lower bound, one H1 per file) | Lead | 07:39:18 → 07:39:32 | 14 s | 3 Bash |
| 6 | Fact-check, round 2: the changed passages only (resume of the same reviewer) | reviewer | 07:39:39 → 07:41:23 | 105 s | 14 / 244.7k |
| 7 | Lead applies the one remaining edit by `sed`, verbatim from the reviewer | Lead | 07:41:33 | — | 1 Bash |
| 8 | Lead fast-forwards main, flips `plan.md` and the Phase 10 file to completed, commits 15 files with a pathspec, pushes, opens an mdview preview | Lead | 07:41:38 → 07:42:18 | 40 s | 5 Bash |

**Totals.** About 31 minutes of wall time. Of that, research was 4.5 min (run in parallel), writing 6.9 min, review round 1 11.9 min (the largest single stage, 39 % of the total), and rework plus round 2 about 5 min. Subagent tokens add up to about 1.78 M, as each agent reported them: research 0.85 M, writer 0.46 M, reviewer 0.47 M.

### How the 5 research slices were cut

The spec's Method section asks for "read-only research agents in parallel per era: genesis, middle growth, plan trigger, and plan execution". The Lead split "plan execution" in two, so three slices were cut by era and two by question:

| Slice | Cut | Window or question | Sources each brief named |
|---|---|---|---|
| R-genesis | era | 07-13 to about 08-15; the compound concepts; the first storage choices | `git log --diff-filter=A`, `git show <sha>:<path>`, the laws and specs files, `docs/decisions/`, `test/e2e/compound-learn-lifecycle.test.mjs` |
| R-middle | era | 08-01 to 09-25; the causal chain of drift | `git log --diff-filter=R -M` by date, `git ls-tree \| wc -l` doc-count samples, period reports in `plans/reports/`, the authority map on the archive tag |
| R-trigger | era/event | what started the plan (about 09-15 to 10-06) | `git show 2085d88fe`, the plan inputs on the tag (authority map, the two frontier reviews and the review prompt), the harness synthesis, `plans/reports` 2609*, memory notes |
| R-built | question | what each phase built, why it was needed, the gain, what is still open | the tag: `plan.md`, `phase-01..10`, the design docs, `reports/`; main: `97dd62aa7`, `97cc4b432`, `ad72e3a46`, the scout report, ledger row PF-I024; one read-only `doc-health` run |
| R-cost | question | measured price | `git rev-list --count` on the tag, `ls-tree -l` sizes, `ls -l` of the tar, the owner-answers files (A/L ids), the board `log.md` grepped by "DOC", memory notes named `doc_plan*` |

Every research brief carried the same constraints:

- read-only git only, with checkout, switch, reset, stash, add and commit forbidden;
- each claim needs a sha with its date, a path, or a dated report, and anything else is marked "unverified";
- quote rather than paraphrase where the wording matters;
- never read the secrets file;
- scope git commands, because the SSD is slow;
- a line cap of 300 to 450;
- a fixed section list: a timeline table, the slice's topic sections, and open questions;
- end the reply with a Status line.

**Source types actually used:** git history, both on main and on the local tag `archive/doc-260925-lineage`; the plan, phase, owner-answers and review files on the tag; the program-board log, grepped; dated reports; the `~/.claude/.../memory/` notes; and one live `doc-health` run. **Not used:** session transcripts. No brief pointed at `~/.claude/projects/*.jsonl` or Codex logs. R-trigger explicitly lists "the closed investigation chat's transcript" as not read (T 07:14:08Z), so the origin of the 09-20 proposal stayed UNVERIFIED.

## 2. How the material was selected

- **What counted as evidence.** A primary artefact that can be re-read: a sha with its date and subject, `<sha>:<path>` with line numbers, a tag path, a dated report, or a named memory note for an owner quote. Research summaries were explicitly not proof: the fact-check brief says "use them only as pointers; they are NOT proof" (T 07:23:51Z). The Lead added three "Lead check 2026-11-05" facts, settled by his own `git show` and `ls-remote` (T 07:15:51Z), and the writer cites them under that label.
- **How claims got citations.** The citation was written in at research time, with each row carrying a sha or path. The writer re-cited inline in each post and per row in the pack, using the short labels R-genesis, R-middle and so on, plus §. The pack also uses "writer check" for the writer's own `sed`/`git log -1` reads, and "fact-check #N" after rework.
- **How the 12-link causal chain was built.** R-middle §3 gave 10 links. The writer merged two of R-genesis's storage seeds into them: the repo divorce (§3.3) and the 4 knowledge-store moves (§3.4). The result is Pack §2: links 1 and 4–11 are R-middle 1–9, links 2–3 are from R-genesis, and link 12 is R-middle 10 joined to R-trigger §1.3–1.4. Each link has a sha, path or report.
- **How the timeline was built.** It is the union of the five reports' timeline tables, ordered by commit time: 55 rows in Pack §1. Commit-time order is also where the "order of events" errors came from (see §4).
- **What was dropped, and why.** Pack §5 lists 10 items. Each was dropped because no primary source was found, or because the fact-check could not reproduce it:
  - why render copies jumped between 08-15 and 08-22;
  - whether the 67 copies diverged before or after the 09-18 copy;
  - who chose copy over move (the claim is kept, labelled UNVERIFIED);
  - "the 10-06 plan rewrite", for which no commit exists;
  - the "479/147 active" figure, which the re-review flagged as possibly wrong;
  - whether F5 was ever built;
  - the chat that produced the proposal;
  - SSD-caused gate reruns;
  - the final disposition of the 247 Phase 8 findings;
  - the 19/10/7/2 verdict tally and the "3 working days" figure (FC #77, #65).

  The writer's first-pass reply lists the same drops (T 07:23:34Z). One rule applied throughout: anything a research report marked unverified was either dropped or kept with the UNVERIFIED label (writer brief, T 07:16:41Z).

## 3. How the story was selected and shaped

- **Why 6 posts.** The arc was not chosen on 11-05. The spec, written on 2026-10-20 at the owner's request, gives "4–6 posts" with a suggested six-part arc: genesis and compound, how docs drifted, the trigger, the method and why it was slow, the cost, the result and lessons. The Lead turned that arc directly into the 6 file names in the writer brief. The arc is chronological and causal (origin → drift → trigger → method → price → outcome), not a ranking of the most interesting moments.
- **Where the tension came from.** It was largely seeded by the Lead, not found by the pipeline. The writer brief told the writer to "name mistakes and dead ends plainly" and listed five of them, all drawn from the Lead's prior knowledge and memory notes:
  - the 09-18 copy-not-move of 943 files;
  - the per-edge review that never converged;
  - the Doer that loosened its own oracle;
  - the owner pushback on 10-11 and 10-29;
  - the lease that was built and then deleted.
- **What the research did contribute.** R-trigger's finding of "no incident" became the reversal in post 3. R-middle's measured surprises became the numbers in post 2: 365 → 4,301 files, 943 files copied, 67 divergent copies.
- **Hooks.** No separate hook-selection step existed. The writer chose each opening:
  - post 1 opens on a scale contrast: 41 days of work, rooted in reasonable first-week choices, and a 12× growth;
  - post 2 opens on method: "this post measures the consequence", followed by the sampling rule;
  - post 3 opens on a reversal: "people assume a big cleanup starts with an incident; not here", stated with R-trigger as the source;
  - post 4 opens on the two locked principles, then promises "where it was slow, wrong, or a dead end";
  - post 5 opens with what was not measured, as an honesty frame, before giving any number;
  - post 6 opens on two questions: what was gained, and what is still missing.
- **What made the posts interesting**, in order of weight:
  1. **Self-inflicted cost:** the copy-not-move, and the oracle loosened by its own author.
  2. **Reversals:** no trigger incident; the plan existing as two parallel copies (post 3 after the fix); the per-edge review stopped by owner decisions A50/A51 rather than by better tooling.
  3. **Surprise numbers:** 12× doc growth, 59 minutes to the first dead-reference fix, 2,143 commits, 7.51 GB of evidence, at least 368 decision ids, and 1.8 % rework at the moment the owner asked "tài liệu thôi mà sao kì công vậy ta".
  4. **The owner's own words** (10-11, 10-29), as human tension.
  5. **An outcome stated against what is still open:** 0 findings over 628 docs, next to DOCOS being not-planned and the evidence living on one machine only.

  Post 6 ties each of its 11 lessons to a named event in the series.

## 4. The verification loop

**Rubric** (fact-check brief, T 07:23:51Z):

- Check each factual claim against its cited primary source: `git show -s` for a sha's date and subject, the path at that commit, re-run counts (at least the 10 headline numbers), quotes via `git grep` / `git show`, dates and times.
- Classify each claim as VERIFIED, WRONG, UNSUPPORTED or OVERSTATED.
- Flag any estimate or unverified item that appears as fact elsewhere in the series.
- The verdict is REWORK if anything is WRONG or UNSUPPORTED; the report must list the exact edits.

The reviewer was a different agent type (code-reviewer) from the writer (general-purpose), and both ran on Opus.

**Round 1** checked 102 claims: 80 VERIFIED, 13 WRONG, 2 UNSUPPORTED, 7 OVERSTATED. All 60 cited shas and all 10 headline numbers reproduced. **Round 2** re-checked 20 passages: 19 VERIFIED and 1 WRONG. That one error was introduced by the reviewer's own round-1 edit 13, which used the wrong A-id range: it included A18 and missed A45–A47. The Lead applied the reviewer's replacement sentence verbatim, and no round 3 was run.

The errors are grouped by class below, with the slice or step that produced each and the type of source behind it.

| Class | FC # | Produced by | Root cause (source type) |
|---|---|---|---|
| Wrong commit attribution / plan origin | 35, 40 | the spec and the Lead's briefs ("created on 2026-09-26 in `2085d88fe`"), then R-trigger, then the writer | The anchor fact in the brief was the **main-side copy**; `a725d4788` on the plan branch (09-25, 724 lines) is the real origin. R-trigger read `plan.md` on main (704 lines), not on the branch (800 → 454). The cause is reading main instead of the branch where the work happened. |
| Order of events | 32 | R-trigger timeline, then the writer | The timeline was sorted by commit time: the truth reset (13:57) is listed before the "two reviews" row, which has no time. Causal order (the reviews asked for the reset) can only be read from the review text (:190), not from commit order. |
| "How it ended" reported as unresolved or resolved differently | 50, 99 (E6/E7); 57, 101 (per-edge) | R-built (read pilot §2 only, not §5–6); R-cost (read owner-answers :195-197, :282-286 but concluded "rules moved into the checker"); the **spec's own premise**, "before the rule classes moved into the checker", which was repeated in the R-cost brief | Partial reads of long owner-answers and pilot files, and a premise in the brief that primed the conclusion. |
| Arithmetic / time delta | 17 ("five hours" → 59 min) | R-middle §3 link 3 | Computed by hand, never from `%ci`. |
| Causal inference stated as fact | 18 (guard "added afterwards") | R-middle §3.3 and the summary line 94 | Inferred from a commit message, without checking the guard's birth commit (`41af242e7`, 07-27). |
| Undercounted owner decisions | 74 | R-cost (named only A28/A44/A48/A49) | The decided-by labels on headings were sampled, not enumerated. |
| Count not reproducible | 77 (verdict tally) | R-cost | A loose regex over the verdict lines of 193 files. |
| Interpretation stated as measurement | 65 ("3 working days") | R-cost's "Reading:" line, which the writer stated as fact | An estimate whose label was lost on the way into the post. |
| Lower bound stated as an estimate | 73 (326 → at least 368) | R-cost | The L10 series (42 ids) was left out. |
| Stale count | 96 (27 → 28 plan files) | R-built | A count taken at the cutover was presented as today's count. |
| Estimate used where a measurement existed | 93 (9.5k lines / 23 tests → 7,426 / 22) | R-built, from the scout report | A planning estimate was cited instead of measuring commit `159971615`. |
| Overstated wording / incomplete list | 38 (decision 12), 48 ("most severe"), 34 (four findings, not five) | R-trigger and R-built paraphrases | Paraphrase drift from the quoted text; a list item was dropped. |
| Hedge dropped across posts | 90, 100, 102 | the writer | A "writer's reading" label, or the second half of a quote, kept in one post and dropped in another. |
| Paraphrase of method | 13 (sampling rule) | the writer | R-middle stated the rule correctly ("at or before 23:59"); the writer simplified it. |

**Pattern.** Every sha and every headline number held. All the defects were in narrative glue: event order, how things ended, who decided, and how long apart. These come from partial reads of long Markdown records (owner-answers, pilot reports), from commit-time ordering standing in for causal order, and from premises the Lead and the spec wrote into the briefs. The 22 non-verified claims of round 1 attribute as follows:

| Producer | Claims | Count |
|---|---|---|
| R-cost | #57, #65, #74, #77, #101 | 5 |
| R-built | #48, #50, #93, #96, #99 | 5 |
| R-trigger | #32, #34, #35, #40 | 4 |
| R-middle | #17, #18 | 2 |
| Writer | #13, #89, #90, #100, #102 | 5 |
| Shared by R-trigger and R-built | #38 | 1 |

The spec or brief premise co-caused 3 of these: #35, #57 and #101. R-genesis produced none. #73, the lower bound, appears only in FC's list of estimates stated as fact, not in the 22.

## 5. Weak points

- **Could not be measured:**
  - Doer and reviewer turns for this plan (`.fgos/assignments/` holds 2,249 entries machine-wide, with no attribution);
  - hours, tokens and model cost;
  - SSD-caused gate reruns;
  - a dead-link count over the drift window;
  - whether release `47e1016d` carries the Phase 9 guards;
  - the original design chat behind the proposal.

  That last gap exists because transcripts were outside the source set. They are the one source an automated harvester reads first.
- **Length overrun.** The brief asked for 600–1,200 words. `wc -w` gives post 1: 1,204; post 2: 1,259; post 3: 1,612; post 4: 1,711; post 5: 1,388; post 6: 1,734. Rework added text: the corrections expanded passages rather than replacing them (the 25/9 and 26/9 sections, A50/A51, E6/E7). No editing pass for length was run.
- **A stale claim was shipped in the same commit.** Post 6 (its "Trạng thái `plan.md` lỗi thời" item and lesson 11) and Pack §4 say `plan.md` on main still reads `status: in-progress`. The Lead changed that line to `completed` at T 07:41:59Z, and commit `36737e5d6` contains both the fix and the posts that call the line stale. No check ran after this edit.
- **Verification did not close the loop.** Round 2's remaining edit came from the reviewer and was applied by the Lead with no round 3. The criterion "the reviewer finds no unsupported claim" holds by construction, not by re-check. The reviewer's own correction (edit 13) was itself wrong, which shows that a reviewer's suggested text needs checking too.
- **Wasteful or slow steps:**
  - Review round 1 was 39 % of the wall time (104 tool calls). Most of that was re-deriving facts the research slices had already sourced, because research output was treated as non-proof. That is correct for independence, but it doubles the git reads.
  - Two slices (R-built and R-cost) both read the same owner-answers and pilot files, partially, and produced most of the errors.
  - The Lead's opening message (T 07:13:04Z) says the Lead would merge the evidence pack, but the writer built it. Merging and writing were done by the same agent, so the merge step had no independent check before the review.
- **Story selection was mostly upstream.** The arc came from a spec written 16 days earlier, and the "interesting" moments were listed by the Lead from memory. The pipeline verified and enriched a story that had already been chosen. It did not discover candidates and rank them.
- **Not yet done:** the owner has not approved the posts and nothing is published (spec success criterion 3).

## 6. Distilled reusable method

1. Inputs: a scope (repo, window, plan id), the arc wanted (N posts, one question each), a source whitelist (git, plan records, decision files, board log, memory notes, **transcripts**), a forbidden list (no writes, no secrets).
2. Pin the anchor facts yourself first: the origin commit on the work branch (not the main copy), the landing tip, and where the evidence lives. Put them in every brief as "Lead check" facts.
3. Cut the research into 3–5 parallel read-only slices, by era for causality and by question for built, gained and cost. Give each a fixed section schema and a line cap.
4. Evidence rule: every row carries a sha with its date, `<sha>:<path>:line`, or a dated report; quote the source; anything unproven is labelled UNVERIFIED; open questions are a required section.
5. Order events by causal text, not commit time; compute every time delta from `%ci`; enumerate (never sample) "who decided" labels; read long decision and pilot files to the end, including the final ruling.
6. Never put a conclusion in a brief ("X moved into the checker"); ask "how did X end?".
7. One writer builds the evidence pack (timeline, causal chain, cost table, open state, dropped list), then the posts. Each post gets one question, an inline source on every claim, and estimates and readings labelled the same way in every post.
8. Hook check: each opening states a measured surprise, a reversal, or a cost, with its source.
9. Gate A, the independent fact-check: a different agent re-derives every claim from primary sources and sorts it into VERIFIED, WRONG, UNSUPPORTED or OVERSTATED; any WRONG or UNSUPPORTED claim means REWORK, with exact edits listed.
10. The writer applies the edits by number. Gate B: the reviewer re-checks the changed passages, **including its own suggested text**. Repeat until zero WRONG or UNSUPPORTED claims remain.
11. Gate C, the length/edit pass: each post fits its word budget after rework; trim, don't append.
12. Gate D, freeze: make no repo edit that changes a claimed fact after the last check; if one is needed, re-check the affected claims before committing.
13. Commit with a pathspec, preview, and wait for owner approval before publishing anything.

## Unresolved questions

- Did the writer measure post length in Vietnamese syllables or in tokens? The overrun figure depends on the unit.
- Would adding transcripts as a source have resolved the UNVERIFIED proposal origin? That is untested.
