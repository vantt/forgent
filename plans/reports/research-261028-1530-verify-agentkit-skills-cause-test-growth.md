---
title: "Check: do AgentKit fix and review skills cause the per-fix test growth?"
description: "Adversarial check of cause 2 in research-261028-1412 using this machine's session transcripts (causation) and a seeded sample of 60 tests added by fix commits (harm). Verdict: not supported on the evidence available."
---

# Check: do AgentKit fix and review skills cause the per-fix test growth?

Scope: `origin/main` at `5ba5226b3` (2026-10-28 22:10 +07:00). Claim under test: cause 2 of `plans/reports/research-261028-1412-test-growth-agent-behaviour.md`. It says the text of `ak:fix` (`workflow-standard.md:79`), `ak:code-review` (`edge-case-scouting.md:49-52`) and the `tester` agent ("typically 80%+") makes agents add a test for every fix and finding, about 21% of tests added since 09-01. Nothing was run except `git`, read-only scans and Python over the transcripts. No test suite was run.

## Verdict: NOT SUPPORTED

On this machine, no session that committed a fix ever had the quoted `ak:fix` or `ak:code-review` text in its context. The test count per fix commit fell by 61% on 2026-10-20, when `AGENTS.md` L5 changed. The AgentKit text stayed the same. In a seeded sample of 60 tests added by fix commits, none duplicates an existing proof.

Limits of this verdict:
- Transcripts on this machine cover only 2026-10-15 to 2026-10-28. September and early October, where most growth happened, cannot be checked here.
- This is one machine of three.

## Test 1: causation

### What the sessions loaded

Corpus: 21 top-level Claude Code sessions and 302 subagent transcripts in `~/.claude/projects/-home-vantt-projects-forgent/`, plus 1 land job. Their first timestamps run from 10-15 to 10-28. omp and pi logs on this machine (`~/.omp`, `~/.pi`) contain only mailbox probe sessions and other projects. No omp or pi session committed to forgent. I also scanned the 476 `fgos run` worker records in `/home/vantt/projects/forgent/.fgos/assignments/` (1.3 GB).

| Signal | Sessions or files where it appears (outside this research session) |
|---|---|
| `Skill` call `ak:fix` | 0 |
| `Skill` call `ak:code-review` | 0 |
| Text "MUST fail without fix" (`ak-fix/references/workflow-standard.md:79`) | 0 |
| Text "Add before review" / "Add test or verify" (`ak-code-review/references/edge-case-scouting.md:51-52`) | 0 |
| Any read of an `ak-fix/` or `ak-code-review/` file | 0 |
| `ak:fix` / `ak:code-review` listed as available, with its description only | 111 transcripts |
| Text "typically 80%+" (`tester` agent system prompt) | 12 files, all `tester` subagents in 4 sessions |
| `Skill` call `ak:cook` | 8 files: 7 subagents of one session on 10-21, and 1 main session on 10-16 |
| `Skill` call `ak:plan` / `ak-plan` | 6 |
| `subagent_type: code-reviewer` (AgentKit agent) | 33 reviewer transcripts |
| `fgos run` worker records containing any quoted line | 0 of 476 |
| Old L5 "new or changed behavior gets a matching test" (in `AGENTS.md` until 10-20 17:50) | 127 files |

The skill descriptions shown in the listing do not ask for tests. `ak:fix` reads "Fix bugs, errors, test failures, and CI/CD issues with intelligent routing". The `code-reviewer` agent prompt (`~/projects/.claude/agents/code-reviewer.md`) has no "add a test" line. It says "Use the scout and code-review skills". None of the 33 reviewers loaded that skill.

The `ak:fix` and `ak:code-review` text appears only in this TEST research session (`d976dcea`), which read those files to write the earlier report and this check.

### What the sessions committed

- 2431 `git commit` commands with results. I parsed each subject (from `-m`, a heredoc, or the hash in the result for `-F file`). I then matched each subject to non-merge commits on `origin/main`. Matching on subject also catches rebased or cherry-picked commits.
- 1216 commits matched. `origin/main` has 3441 non-merge commits dated 10-15 to 10-28, so I matched 35% of the window.
- 168 matched commits are `fix` commits. 160 have a subject that is unique on `origin/main`, and only those were used. They add 204 tests (108 Rust). 16 of these tests went into new files and 188 into existing files.
- Coverage: 168 of 486 `fix` commits in the window (35%). That is 17% of the 988 `fix` commits since 09-01, and 0% of September.

### Exposure against tests added (160 fix commits)

"Before" means the event happened earlier in the same top-level session than the commit. "File" means the transcript that ran `git commit`.

| Group | Fix commits | Tests per fix commit | Share that add a test |
|---|---|---|---|
| All matched | 160 | 1.27 | 45% |
| quoted `ak:fix` / `ak:code-review` text in context | **0** | – | – |
| `code-reviewer` ran before, old L5 era | 24 | 2.79 | 71% |
| no `code-reviewer`, old L5 era | 7 | 1.00 | 71% |
| `code-reviewer` ran before, after 10-20 17:50 | 99 | 1.01 | 38% |
| no `code-reviewer`, after 10-20 17:50 | 30 | 1.00 | 40% |
| `tester` ran before, after 10-20 | 59 | 0.92 | 29% |
| no `tester`, after 10-20 | 70 | 1.09 | 47% |
| committing file had loaded `ak:cook`/`ak:plan` | 54 | 0.76 | 24% |
| committing file had not | 106 | 1.54 | 56% |
| old L5 in `AGENTS.md` (before 10-20 10:50Z) | 31 | 2.39 | 71% |
| new L5 and principle 8 | 129 | 1.01 | 39% |

Readings:
- The quoted skill text cannot be the cause in this window, because no committing session had it.
- After 10-20, the AgentKit `code-reviewer` agent makes no difference: 1.01 against 1.00 tests per fix commit. Before 10-20 there is a gap, but only 7 commits had no reviewer.
- The `tester` agent and `ak:cook`/`ak:plan` go with **fewer** tests per fix, not more.
- The big split is the `AGENTS.md` change. Over all of `origin/main` since 09-01, `fix` commits added 3.09 tests each before 10-20 17:50 (693 commits, 71% added at least one). After it they added 1.19 each (295 commits, 50%). The AgentKit files did not change on that date. They carry an install time of 10-17 19:05, and `ak:cook` was already in use on 10-16.

### Where the "add a test" instruction came from (sample)

I read the brief or the preceding context for 12 fix commits that added tests. In every case, the instruction came from the lead's brief, a repo plan, or a review report. None came from AgentKit skill text.

| Commit | Tests | Source of the instruction |
|---|---|---|
| `89a27480d` fix(observe) | +18 | Lead brief: HARDEN branch "already carries the Observe red tests"; "extend the owning test". Plan phase-01 red tests. |
| `9578108c2` fix(work) | +13 | Lead brief: "Owning proof: add the 3-origin cascade vector from review A". |
| `c9c378839` fix(holder-lock) | +12 | Lead in main session, after reading a `fgos run` review report: "Add a test that runs a scan against a concurrent compaction loop". |
| `7c9662347` fix(git) | +9 | `fgos run` review report: "extend the regression test so it recovers X". |
| `9b5eae9dd` fix(event-store) | +5 | Lead brief: "Owning proof: a two-process case". |
| `c67c1d7d1` fix(git) | +4 | Lead brief: "Add tests (live-locked → no fail; dead-locked → finding)". |
| `fd430a8a4`, `c5eb6b9c8` fix(persona), fix(yaml) | +4, +3 | Lead brief after a review: "Negative tests for each case", "Add a sub-100-alias exponential test". |
| `7c56c4501` fix(test) | +2 | Lead brief: "Add a regression test to test/scripts/run-tests". |
| `8e1ecbf63`, `3e43fa59e`, `df4c30d82` fix(git), fix(dispatch) | +3, +4, +2 | Lead brief: the committed red tests of `harden/t2-p01-red-tests` "are your targets"; "design principle 8 (find the owning test before adding one)". |

Two more facts about the source:
- Reviewers ask for tests without the skill text. 17 of the 33 `code-reviewer` transcripts end with a recommendation to add a test (words such as "add a test", "no test covers", "untested"). The share is lower when the brief names the owning proof: 3 of 7, against 14 of 26 when it does not.
- Lead briefs often carry principle 8 wording ("owning proof", "one proof", "principle 8"). It appears in 160 of 431 subagent prompts across the window, not counting the research session. Fix commits made under such a brief added 1.52 tests each, against 1.07 without one. The brief's wording does not cut the count. HARDEN briefs pair it with committed red tests.

## Test 2: harm

Sample: all tests added by `fix` commits since 09-01 (2128 before 10-20 10:50Z, 341 after), sorted by commit, file and title. I drew 30 from each period with `random.Random(20261028)`. For each test I read its body and the tests in the parent version of the same file. I also searched the whole parent tree for similar titles.

| Class | Before 10-20 (30) | After 10-20 (30) |
|---|---|---|
| (i) proves a behaviour no test proved before | 24 (80%) | 20 (67%) |
| (ii) duplicates an existing proof | 0 | 0 |
| (iii) higher layer than needed | 1 (3%) | 0 |
| rewrite or rename of an existing test in the same commit (not a new proof) | 5 (17%) | 9 (30%) |
| not a test: `#[test]` child-process entry | 0 | 1 (3%) |

With 0 duplicates in 60, the true duplicate share is likely below 5% (rule of three: 3/60).

Examples:
- (i) `pr28` `503808ee1` `test/runner/herdr-agent.test.mjs` "a herdr error envelope on STDERR is still a named failure". The parent proves the stdout envelope only.
- (i) `po1` `8e1ecbf63` `packages/git/rust/tests/worktree.rs` "a_chain_stopped_between_its_outcome_and_its_pin_release…". Its comment says "No other case leaves a terminal chain whose pin is still installed".
- (i) `po8` `89a27480d` `packages/observe/rust/src/shard.rs` "a_torn_last_line_is_healed…". The commit says that red tests 1a and 2 "are now owned by the shard door's tests". This is a move of the owning proof to the right place, not an extra test.
- (iii) `pr9` `717ec6597` `test/e2e/runner-loop.test.mjs` "e2e --config is gone…". This proves that a flag was removed by spawning the runner end to end. An argument-parser test could observe the same thing.
- Rewrite: `po29` `754c48803` `test/event-store/work-conflicts.test.mjs`. It renames "a failed precondition that follows another clone's event is recorded, never thrown…". The same commit removes the old title.
- Rewrite: `pr8`/`pr14` `e8176287f` `test/cli/fgos-return.test.mjs`. These replace the lock-release tests with beacon tests, because the mechanism changed.
- Not a test: `po15` `861dab2c4` `install_lock_multiprocess.rs::staging_child_entry`. This is a `#[test]` entry that a parent test spawns.

There is one side finding about the earlier count. It counts added `test(`/`#[test]` lines. In this sample, 14 of 60 such lines (23%) are renames or rewrites, and the same commit removed the old line. So "fix commits added 1960 tests" overstates the new tests. Net for all `fix` commits since 09-01 is +1903 (2494 added, 591 removed) under this check's counting.

The sample also touched one pattern outside the claim. In `027636e4e` (09-27), a fix added `test/cli/capability-match-adversarial.test.mjs` and `test/runner/capability-match-adversarial.test.mjs` side by side. That pattern belongs to cause 3 (two layers), not to cause 2.

## What would change the verdict

- **To CONFIRMED or PARTLY:** transcripts from the other two machines, or from September to mid-October, showing `ak:fix` or `ak:code-review` loaded (a `Skill` call or the quoted text) before fix commits that add tests. Those commits would also need more tests per fix, or more duplicates, than comparable fix commits without the skill. The September commits carry the most weight, because 81% of the growth happened before 10-20.
- **To PARTLY:** a larger harm sample that finds more than about 10% duplicates or higher-layer tests in fix commits.
- **Stays NOT SUPPORTED:** if the other machines' sessions also never invoked `ak:fix` or `ak:code-review`. On this machine those skills were offered in 111 transcripts and invoked in none.

## What this means for the earlier report

- Cause 2's mechanism (a test per fix and per finding) is real: 65% of fix commits since 09-01 add a test. But the quoted AgentKit text is not shown to be its source. On this machine the instruction comes from lead briefs, repo plans (HARDEN red tests), `fgos run` review reports, and the old L5 line.
- The earlier report's "smallest change" for cause 2 still fits, because it targets briefs and review-report format, not AgentKit. Editing AgentKit `ak:fix`/`ak:code-review` would not have changed any commit seen here.
- Most of what fix commits add is legitimate under principle 8. A fix shows a behaviour that no passing test proved, so its regression test is usually a first proof.

## Method (rerun)

Scripts and data are in `/tmp/claude-1000/-home-vantt-projects-forgent--claude-worktrees-test-wa/d976dcea-6c0f-49cb-a0d3-4323545bac2b/scratchpad/verify-akit/`. Run them from that folder with `python3 -I`. Set `T=~/.claude/projects/-home-vantt-projects-forgent` and `R=/home/vantt/projects/forgent/.claude/worktrees/test-wa`.

1. Inventory:
   - `find ~/.claude/projects -path '*forgent*' -name '*.jsonl'`
   - `find ~/.omp ~/.pi -name '*.jsonl' -printf '%h\n' | sort | uniq -c`
   - `find ~/projects/.claude -path '*ak-fix*' -o -path '*ak-code-review*'`
2. Per-file signals (`Skill` inputs, `Agent` `subagent_type`/prompt, marker strings, timestamps):
   - `python3 -I extract.py $T > sessions.json`
3. Where each marker appears (entry type and tool):
   - `python3 -I ctx.py $T 'MUST fail without fix' 'Add before review' 'typically 80%+' 'edge-case-scouting' 'ak-fix/'`
   - Exclude the `d976dcea` research session.
4. Commit commands and their subjects:
   - `python3 -I cmds2.py $T > commitcmds.jsonl`
   - It records each Bash `git … commit` with the subject from `-m`, a heredoc, or `-F` plus the 9-hex hash in the result.
5. Per-commit test delta on `origin/main` since 09-01:
   - `python3 -I growth.py $R origin/main 2026-09-01 > growth.json`
   - It reads `git log --no-merges -p --unified=0` and counts `+`/`-` lines matching `^\s*(test|it)(\.skip|\.only|\.todo)?\s*\(` under `test/` and `#[test]`/`#[tokio::test]` in `*.rs`, with new-file flags.
   - A fix commit is a subject matching `^fix(\(|:|!)`.
6. Match and expose:
   - `python3 -I match.py` writes `matched.json`, joining on exact subject.
   - `python3 -I commitlevel.py` writes `fixexp.json`, keeping only unique subjects.
   - "File-level ak:cook/plan" means the committing transcript had a `Skill` call with `cook` or `plan` before the commit time.
   - The L5 cut is `2026-10-20T10:50Z` (`fb8c6e4ae`).
7. Briefs and preceding context:
   - `python3 -I briefsnip.py '<subject prefix>'`
   - `python3 -I before.py <transcript> <commit-iso-time> <hours>`
8. Reviewer outputs:
   - `python3 -I reviewers.py $T` reads `*.meta.json` with `agentType == code-reviewer` and checks the last assistant text for add-test wording.
9. Worker records:
   - `grep -rlF '<marker>' /home/vantt/projects/forgent/.fgos/assignments | cut -d/ -f2 | sort -u | wc -l`
10. Harm sample:
    - `python3 -I sample.py $R 20261028` writes `sample.json`. The population is the tests added by fix commits, split at 10-20 10:50Z, sorted, and sampled 30 + 30.
    - `python3 -I similar.py $R > similar.txt` lists the removed test lines in the same file and the closest parent titles.
    - `python3 -I inspect.py $R pr1 … po30` prints each body and the parent titles that share at least 3 words.
    - Classification is by hand. The per-item labels are in "Test 2" above and can be checked against `similar.txt`.

## Not proven

- Sessions before 10-15 and the other two machines were not seen. The verdict covers 35% of the commits in a two-week window.
- Subject matching can attach a commit to the wrong session when two sessions used the same subject. I dropped subjects that are not unique on `origin/main`, but not subjects that are unique on main yet were typed in two sessions.
- Exposure is per session, in time order. A lead can read a reviewer's output without acting on it. The tables show co-occurrence, not use.
- The harm classes are one reader's judgment of 60 tests, with a search of titles and of the same file. A duplicate in another file with a very different title could be missed.
