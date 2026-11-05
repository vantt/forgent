# momentry: how it picks material and stories

Read-only analysis, 2026-11-05. Source: clone at `…/scratchpad/momentry-src/repo`, HEAD `1b64da6`. Paths below are relative to that repo root.

**Version check:** `diff -rq lib prompts` against the installed `~/.local/share/momentry/versions/v0.3.0` shows **no difference**. The two commits after v0.3.0 (`e16ebda` eval harness, `1b64da6` per-step cost) only touch `scripts/eval/`, `test/eval.test.mjs`, `docs/experiments/2026-11-05-step-cost/` and plans (`git diff --stat v0.3.0 HEAD`). The picking logic is the same in both.

## 1. Pipeline, steps 1-11 (plus 12 at list time)

The order is in `docs/prd.md:84-105`. Steps run as 1→6→**9→7→8**→10→11, so stories the outsider step creates get scored with the rest (`docs/prd.md:103`). The glue is `runWindow` in `lib/pipeline.mjs:247-360`.

| # | Step | LLM? (default model, prompt) | Code | What is kept or dropped |
|---|---|---|---|---|
| 1 | Read the source and normalize it into `Entry{L,ts,kind,op,paths,text,bip,exitCode}` | no | `lib/sources/claude.mjs:131-168` (codex, pi, agy are similar) | Dropped: `isCompactSummary` lines (`:138`), user lines starting `<command-`/`<local-command`/`<system-reminder` (`:33,155`), thinking blocks (only `text` and `tool_use` are kept, `:158-163`). `/bip` and `/momentry-bip` are flagged **before** that drop (`:150-153`). Tools are classified as `shell` (Bash), `write` (Edit/Write/MultiEdit/NotebookEdit) or `other` (`:170-176`) |
| 2 | Reduce | no | `lib/reduce.mjs:28-48` | One line per entry: `[Lnnn] USER ≤2500 chars / AGENT ≤2000 / TOOL one line ≤300 / RESULT first 2 lines ≤250`, or **the last 3 lines ≤500 when exit≠0**. Cuts are marked `…[+n]`. Tokens are estimated as chars/3.2 (`:13-21`) |
| 2b | Chunk | no | `lib/reduce.mjs:56-79`; cap `harvest.maxInputTokens` = 150k (`lib/config.mjs:22`) | Splits on entry boundaries with a 20-entry overlap. An entry in the overlap is "owned" by the first chunk that contains it |
| 3 | Hotspots | no (5 pure detectors) | `lib/hotspots.mjs:59-88` | See §2 |
| 4 | Harvest, `harvest.runs` times per chunk (default 1) | **yes**, haiku (`lib/config.mjs:22`), `prompts/harvest.md` | `lib/harvest.mjs:76-93`, called at `lib/pipeline.mjs:272-291` | Input is the whole reduced chunk plus only the hotspots that chunk owns (`lib/pipeline.mjs:275`). Output is `stories[]` plus a `hotspots[]` verdict for each hotspot. The prompt says **do NOT self-filter** and record extra rather than miss anything (`prompts/harvest.md:18,23`) |
| 5 | Coverage check and gap-fill | script, plus haiku `prompts/harvest-fill.md` | `lib/harvest.mjs:94-117` | For hotspots with no valid verdict, re-asks only those ids, at most `fillRetries` times (default 1). Whatever is still missing is recorded and makes the window `partial`; nothing is dropped |
| 6 | Cluster (dedup) | **yes**, sonnet (`rank.model`), `prompts/cluster.md`, script-checked partition | `lib/cluster.mjs:49-90` | **Skipped (no LLM call) when runs≤1, there is 1 chunk and the session has no box stories yet** (`:54`): every raw story becomes its own cluster. Otherwise the LLM partitions the raw stories plus the `box:` stories of the **same session**. If the partition is wrong twice, it falls back to line-overlap (`:99-116`) |
| 9 | Outsider | **yes**, sonnet, `prompts/outsider.md`, once per chunk | `lib/outsider.mjs:25-43`, `lib/pipeline.mjs:313-323` | Rereads the whole chunk plus the cluster titles. Returns 3-8 "things done smoothly that an outsider would ask about". Items that match a cluster add a "Góc người ngoài" (outsider angle) section and `hit_by: outsider`; items that match nothing become new clusters `O<k>` (`:51-69`) |
| 7 | Hook and tension | **yes**, sonnet, `prompts/hook-tension.md` | `lib/score.mjs:33-47` | Runs only on **fresh** clusters (new members or outsider items, `lib/pipeline.mjs:324-327`). Input is the title plus summary, shuffled, ids remapped to M<k>, hits hidden (`lib/score.mjs:12-17`) |
| 8 | Stakes | **yes**, sonnet, `prompts/stakes.md` (variant `si`) | `lib/score.mjs:55-66` | Runs on **all** clusters of the session, old and new (`lib/pipeline.mjs:329`). The model first infers `main_goal`, then scores stakes 0-3 against it |
| 10 | Privacy gate | no | `lib/pipeline.mjs:103-186`, `lib/privacy.mjs` | Checks the blocklist on every field, the slug and any merge patch. A violation, or having no blocklist at all, sends the story to quarantine outside the repo. This step never edits story content |
| 11 | Build story file or merge | no | `lib/story.mjs:59-107`, `lib/pipeline.mjs:192-213` | A new file is written per cluster without a `box:` member. A cluster with a `box:` member is merged into the smallest box id (`lib/cluster.mjs:135-138`) |
| 12 | Rank | no | `lib/rank.mjs` (+ UI `personalize`) | See §3 |

Every model call goes out isolated: `claude -p --model M --setting-sources "" --tools "" --strict-mcp-config --no-session-persistence --output-format json` (`lib/llm.mjs:32-33`), with `STORY_HARVEST=1` (`:107`). Bad JSON gets one retry (`docs/prd.md:171-177`).

**Triggers.** Claude/Codex hooks on PreCompact, SessionEnd and SessionStart (`lib/hook.mjs:13,77-78`) start `scan --auto` in the background. `scan` skips files modified less than 30 min ago (except the calling session), handles at most 3 sessions per run, and stops at a daily budget of 3 USD (`lib/config.mjs:25,28`; `lib/pipeline.mjs:506-567`). Each session is read incrementally from ledger `lastLine+1` to EOF (`lib/ledger.mjs:127-133`).

## 2. Material selection

**Reduction.** See step 2 above. The window is "every line after `lastLine`", not a hotspot neighbourhood. There is no semantic filtering of transcript content before the LLM: everything except thinking, compact summaries and system/command lines reaches harvest, truncated per line.

**Hotspots** (`lib/hotspots.mjs`). There are no weights and no score threshold. Each detector looks at a single entry:

| Kind | Rule | Line |
|---|---|---|
| `nonzeroExit` | `kind:result` with an integer exitCode≠0, or `isError` | `:15-20` |
| `metricPair` | user/assistant text matching `NUM (→\|->\|=>\|lên\|xuống\|thành\|tới\|to) NUM`, unequal | `:22-31` |
| `gitReversal` | shell op matching `git reset/revert/rebase/restore/checkout --/commit --amend/push -f`, or `squash` | `:33-40` |
| `metaWrite` | write op to `.claude/ .codex/ .agents/ AGENTS.md CLAUDE.md skills/ hooks/ settings*.json` | `:42-49` |
| `bip` | user line flagged `bip:true` | `:52-54` |

- Hits of the **same kind** within 5 lines are merged into one hotspot covering `L..Lend` (`:59-79`).
- Ids are global, `H<L>` (`:76`), with a letter suffix when two kinds share a line (`:81-86`).
- The prompt shows `H<L> [Lx-Ly] signals` and at most 4 signal labels, with **no transcript text** (`:91-93`).
- The PRD calls hotspots an "attention anchor, not a filter" (`docs/prd.md:73`). The experiment found the model marks 25-28 of 28 hotspots as `story` (`docs/experiments/2026-11-03-harvest/README.md:49`).

**Context around a hotspot.** No local window is extracted. The model sees the **entire chunk**, up to about 150k tokens, and only gets the hotspot id and line range as a pointer (`lib/harvest.mjs:78,85`). Outsider likewise rereads the entire chunk (`lib/pipeline.mjs:317`).

**Evidence attached to a story** (`lib/story.mjs:59-80`):
- `lines`: the union of member line refs as `<sid>#L<n>`, which come from the model's `lines` list (`lib/harvest.mjs:37-44`).
- `date`: the timestamp of the smallest line (`:63-64`).
- `signals`, `hit_by` (hotspot / harvest / outsider / bip, `:33-42`), `source` = `chat Claude, <sid>`.
- `repo` (name only), and `artefact`, which is free text the model writes ("what to screenshot and what to mask").
- The body comes from the member with the **longest** `what_happened` (`:60`).
- There is **no commit SHA, no file path and no verbatim quote.** The privacy rule asks for mechanisms, numbers and tool names only (`prompts/harvest.md:20`). Verbatim evidence exists only as the line pointers into the transcript.

## 3. Story selection, scoring and ranking

**Scoring dimensions.** All come from sonnet and are read off summaries, not the transcript.

| Field | Range | Source |
|---|---|---|
| `hook` | sentence of <15 words | `prompts/hook-tension.md:13` |
| `tension` | one of `nho_ma_to, giup_ma_hai, tuong_ma_hoa_ra, hop_ma_tan, cam_ma_van_lot, it_ma_nhieu, khac, none`, plus `side_a`/`side_b` | `prompts/hook-tension.md:4-11` |
| `strength` | 0-3 ("0 = no tension; 3 = reader can't stop") | same file, `:13` |
| `stakes` | 0-3: does the story change the outcome of the inferred `main_goal`? Scored independently of how interesting it is | `prompts/stakes.md:3-9` |
| `hits` | number of distinct harvest runs among the cluster members; always 1 when runs=1 | `lib/cluster.mjs:141-145`, capped at `runs` (`lib/story.mjs:73`) |

**Rank formula** (`lib/rank.mjs:10-30`). The sort key is ascending and there is **no threshold**:

`[tension≠none ? 0 : 1 (missing=2), −(stakes×strength) (missing=+∞), −hits, −date]`, ties broken by id.

So any story with a tension label outranks every `none` story, whatever its stakes.

**UI "stars"** are `stakes×strength`: ≥6 gives 3 stars, ≥2 gives 2, otherwise 1 (`lib/ui-api.mjs:143-149`).

**Clustering and dedup.**
- Raw stories become clusters in one of three ways: the LLM partition, the line-overlap fallback, or one cluster per story.
- Cross-window dedup inside a session works by feeding the existing `box:` stories of that session into the cluster prompt (`lib/cluster.mjs:56-64`).
- If a cluster contains two or more `box:` ids, the new material is merged into the smallest id and a `cluster.duplicate-box` event is logged; nothing is deleted (`lib/pipeline.mjs:198-200`).
- Merges only append (`sessions`, `signals`, `hit_by`, `lines`) and add to `runs`/`hits`.
- Machine fields are re-scored **only while `status: raw`** (`lib/box.mjs:11-13`; `docs/prd.md:467`).

**Outsider check.** A separate sonnet call (the "curse of knowledge" pass, `prompts/outsider.md:13-15`).
- In the experiment, 13 of 16 items matched stories already picked, so its main effect is to **reframe** stories rather than find new ones (`docs/experiments/2026-11-03-harvest/README.md:93`).
- It does **not** feed into the rank key directly. It only adds `hit_by: outsider` and the "Góc người ngoài" text, and new `O<k>` clusters get scored by steps 7-8 like any other.

**User marks (Use / Later / Drop).**
- Use → `status: picked`, Drop → `status: dropped`, Later → recorded in local UI state only (`lib/ui-api.mjs:318-336`).
- Feedback exists only as a **local re-ordering in the UI** (`personalize`, `lib/ui-api.mjs:180-206`). Once there are at least 3 used-or-dropped stories (`MIN_LABELS`, `:177`):
  - It tallies the `signals` and `tension` of used stories (+) and dropped stories (−).
  - For each still-raw story it computes `pref` = the sum of `sign(plus−minus)` over its keys, clamped to ±2.
  - It re-sorts by `index − 1.5×pref`, so a story moves at most about 3 places.
- This affects **only** the web UI wall. `momentry list --rank` uses `sortRanked` without it (`lib/cli.mjs:209`).
- Marks never re-run scoring, never change prompts and never affect harvesting.
- Each decision is also logged with the rank the story held on the wall at that moment, for the top-5 Use-rate metric (`lib/metrics.mjs:108-146`).
- Sending labels to a shared server is a backlog item that is explicitly **not built** (`plans/261105-shared-labels/plan.md:4,17`).

## 4. Unit of analysis

- **Bounded to one session window.** Steps 1-11 run per (session, line window) (`docs/prd.md:105`). A session can produce several windows (PreCompact, then SessionEnd). Long windows are split into chunks.
- **Across windows of the same session:** merged through the `box:` members at step 6 (`lib/pipeline.mjs:310`; `storiesOfSession` matches `data.sessions` includes sid, `lib/box.mjs:148-150`). `main_goal` is re-inferred per window and appended to the ledger's `mainGoals[]` (`lib/ledger.mjs:152-153`). Stakes for older raw stories are overwritten by the latest window (`docs/prd.md:195`).
- **Across sessions, days, commits or plans: nothing.**
  - The cluster prompt says the input is from "CÙNG một phiên" (the same session) (`prompts/cluster.md:2`). Stakes is likewise "từ CÙNG một phiên" (from the same session), relative to that session's own goal (`prompts/stakes.md:2`).
  - No code links stories across sessions. `sessions[]` is a list only so that merges can append to it.
  - `links` and `threads` are never filled by the machine. They start empty (`lib/story.mjs:74`), and the machine never changes them (`docs/prd.md:468`). The UI "series" view just groups stories by hand-written `threads` (`lib/ui-api.mjs:351+`).
  - Git is never read: no commit or plan ingestion. Signals come only from transcript tool calls such as `git reset`.
- **Explicitly deferred:**
  - Multi-repo / cross-repo threads (`docs/prd.md:61`, DM.13 `:687`).
  - Automatic `threads.md` (`docs/prd.md:62`).
  - A weekly cross-session "habits" pass (T3), dropped for now because "no single session can see a habit" and there was no data (`docs/history/debate-2026-11-03.md:134,476`).
  - The cross-session `learning_chain` detector of v1 (`docs/history/design-v1-body-brain.md:214`; dropped at `docs/prd.md:746`).
  - Embedding-based cross-session dedup (e5) is floated as the place where embeddings would really help, but is not built (`plans/261104-story-quality/plan.md:41`).

## 5. Weaknesses the project itself records

1. **Every number comes from one session, one domain and one labeller**, and the rankings were tuned on the very data that suggested them. Stakes AUC 0.93-0.94 is "certainly optimistic" (`docs/prd.md:216-218`; `docs/experiments/2026-11-03-harvest/README.md:240`). The re-check on new data, DM.10, is waiting on the user (`docs/prd.md:684`).
2. **The tension gate buries good stories.** A `t`-labelled story with tension `none` and stakes 2 ranked 26th of 38 (`docs/experiments/2026-11-04-dm-real-run/README.md:49,62`). The story-quality plan's ranking item (Q.5) targets this (`plans/261104-story-quality/plan.md:34`).
3. **Stakes misses principle-level importance.** "Squash 6 commits to scrub leaked data" got stakes 1. The project proposes extending stakes to "changes the main outcome **or** threatens a stated principle", which is untested (`docs/experiments/2026-11-03-harvest/README.md:232-236`; `docs/prd.md:727`).
4. **Detection is fine; the telling is weak.** 4 of the 8 `t` stories were flagged as having no hook or being dull (`docs/experiments/2026-11-03-harvest/README.md:162`). The hook is written from a merged summary that may already be slanted toward tension (`:205`).
5. **Noise.** Precision per run is 0.25-0.35, with 20-36 files per long session (`docs/prd.md:700,699`). Git noise is open question 6 (`:731`).
6. **LLM self-filtering and run-to-run variance.** Harvest falls into either a "short" or a "long" mode. Answering hotspots one by one stabilizes this, but the model can still ignore them (e5-2 answered 8 of 28) (`docs/experiments/2026-11-03-harvest/README.md:48,103-105`). Harvest "thinks" in only 6 of 9 runs: the same session gave 14 vs 31 stories and p@5 dropped by 0.20 (`docs/experiments/2026-11-05-step-cost/README.md:112,134`).
7. **Untested pieces of v2** (`docs/prd.md:709-722`):
   - outsider removed from the harvest prompt;
   - the fill loop;
   - chunking;
   - windowed re-harvest with box merge;
   - the runs=1 configuration as a whole;
   - Codex tool mapping (`apply_patch` has never been seen in real data, `docs/experiments/2026-11-04-dm-real-run/README.md:83`).
8. **Outsider value is unproven.** Opus judged it and may favour Sonnet's style. User labels disagree on 2 items. The blind test, DM.8, is pending (`docs/prd.md:712`; `docs/experiments/2026-11-03-harvest/README.md:157-161`).
9. **Cost.** Outsider is 69% of spend because it rereads the whole window with sonnet. 91% of input tokens are billed as 1-hour cache writes that are never read. Dry-run underestimates cost by about 1.5× (`docs/experiments/2026-11-05-step-cost/README.md:110-111,106`). The cost-cut options in Q.4 (haiku outsider, merging it into harvest, reading only around hotspots) are listed but not done (`:142-149`).
10. **Codex exit codes** exist only when the output text prints them, so `nonzeroExit` is often blind on Codex (`docs/experiments/2026-11-04-dm-real-run/README.md:82`).

## 6. Measured numbers

| Metric | Value | Source |
|---|---|---|
| Recall vs 7 sample stories (e4 prompt, haiku) | 6-7/7 full in all 5 runs | `docs/experiments/2026-11-03-harvest/README.md:70-74` |
| Recall on the user's 8 `t` labels | 8/8 in 4 of 5 runs, 7/8 in 1; 0 fabricated | same file, `:136-139` |
| Tension AUC (`t` vs `s`) | sonnet 0.83-0.85, haiku 0.75-0.79 | same file, `:176-179` |
| Stakes AUC / stakes×strength AUC | si-sonnet 0.93-0.94 / 0.96-0.98 (optimistic) | same file, `:219-220` |
| Real pipeline run on `95ca719b` | 7/7 answers, 28/28 hotspots, 38 stories, 7 of 8 `t` in the top half, 1.01 USD, 246 s | `docs/experiments/2026-11-04-dm-real-run/README.md:24-49` |
| 8-session eval (draft agent labels, not user-reviewed) | recall 92%, p@5 0.63, p@10 0.62, mean `t` rank 6.4, 21/30 `t` in the top half; "all `t` in the top half" met in only 3 of 8 sessions | `docs/experiments/2026-11-05-step-cost/README.md:121-136` |
| Cost per session (8 sessions, 9 captures) | mean 0.83 USD (0.50-1.12). Split: harvest 20%, outsider 69%, hook-tension 6%, stakes 4%, cluster 0 (never called in the default config) | same file, `:28-37` |
| Top-5 Use rate | Only the instrument exists: it counts each story's latest decision on stories ranked 1-5 and shows a rate once there are ≥10 such decisions (`lib/metrics.mjs:20,127-146`). **No value is recorded anywhere in the repo** | `plans/reports/fullstack-developer-261105-u8-measurement.md:14-20` |

**Eval harness** (`scripts/eval/README.md`):
- It captures the model outputs once and then replays them with `--fake-llm` at 0 USD.
- Stories are matched to labels deterministically, by slug, by keywords (≥min) or by line range plus one keyword. No LLM judges the match (`:83-91`).
- Metrics are recall, p@5, p@10, mean `t` rank, `t` in the top half, and drift between two captures (`:97-104`).

## Unresolved questions

- No real top-5 Use rate exists, and the 8-session labels are agent drafts the user has not reviewed. So there is no ground truth for ranking quality beyond session `95ca719b`.
- It is unclear whether the UI `personalize` re-ordering was ever measured. The eval harness ranks with `sortRanked` only, without personalize (`scripts/eval/README.md:95`).
