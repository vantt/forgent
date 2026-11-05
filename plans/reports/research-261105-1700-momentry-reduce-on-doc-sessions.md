# Research: what momentry `reduce` picks from the doc-plan 260925 sessions

Date: 2026-11-05. Tool: momentry 0.3.0 (`/home/vantt/.local/share/momentry/versions/v0.3.0`). Ground truth: [retrospective-261105-1416-doc-260925-evidence-pack.md](retrospective-261105-1416-doc-260925-evidence-pack.md) and its six posts.

## 1. What was run, and what was not

- **`reduce` makes no LLM call.** Checked in source: `H.reduce` (`lib/cli.mjs:405`) calls `reduceCommand` (`lib/pipeline.mjs:608`), which does `readEntries` → `render` → `detect` and nothing else. `reduce.mjs` and `hotspots.mjs` import only `node:path` and each other. With `--out` it writes `reduced.txt` and `hotspots.txt` to that directory only. No box, ledger, cache or repo write.
- **Run:** `momentry reduce --transcript <file> --out <scratchpad>/reduce-out/<id>` on 4 transcripts. Read-only checks: `momentry status`, `list` and `ledger`. I also ran a read-only node import of momentry's own `chunk()` and detectors to count harvest windows and classify hits.
- **Not run:** `scan`, `harvest`, `rescore`, `add`, `mark`, `init`, `connect`. The LLM layer (Haiku harvest, cluster, hook/tension, stakes) was **not** run. Everything below about what harvest "would" pick is inference, not measurement.
- **momentry's state for forgentX:** `.momentry.json` is `{}`. `status` says the repo is observed. `list` shows no stories. `ledger` is `{"sessions":{},"repos":{}}`. momentry holds **nothing** about this doc work.

### What `reduce` is (and is not)

A hotspot is **not** a pick and has **no score**. `detect()` runs five regex detectors over entries:

| Detector | What it matches |
|---|---|
| `nonzeroExit` | A tool result with `Exit code N≠0` or `is_error` |
| `metricPair` | Two different numbers joined by `→ -> => lên xuống thành tới to` |
| `gitReversal` | A Bash command containing `git reset/revert/rebase/restore/checkout --/commit --amend/push -f` or the word `squash` |
| `metaWrite` | An Edit/Write tool call to a path under `.claude/ .codex/ .agents/ AGENTS.md CLAUDE.md skills/ hooks/ settings*.json` |
| `bip` | A user `/bip` command |

Hits of the same kind within 5 lines are merged. The harvest prompt (`prompts/harvest.md`) passes the hotspots to Haiku as mandatory items: "Không được bỏ qua điểm nóng nào", and each must get a `story`/`skip` verdict. Haiku also reads the whole reduced transcript and may pick stories with no hotspot. Scores (hook, tension, stakes 0–3, strength) come only from later LLM steps. A hotspot only adds a `hotspot` tag to a story's `hitBy`. So this test measures the **deterministic hint layer**, not momentry's final ranking.

## 2. Sessions tested

The project dir has 66 top-level transcripts. 30 mention the plan. The oldest is from **2026-09-27**: nothing from 07-13..09-26 survives.

| Session | Role | Dates (UTC) | Size / JSONL lines | Entries | Reduced tokens | Harvest windows (150k) | Hotspots |
|---|---|---|---|---|---|---|---|
| `dc747f94` | Harness investigation; wrote the 10-06 resume prompt | 10-06 | 6.8 MB / 3,156 | 657 | ~99k | 1 | 19 |
| `4df9e88c` | Lead, Phases 5–6 (pilot, A12, A28) | 10-06 .. 10-13 | 18 MB / 8,505 | 1,682 | ~287k | 2 | 51 |
| `a4954387` | Current Lead, Phases 6–10, A50/A51, Land, retrospective (still open) | 10-13 .. 11-05 | 186 MB / 89,804 | 21,442 | **~2.63M** | **18** | **439** |
| `4a179af7` | LAND agent (releases, lease removal) | 10-25 .. 11-04 | 15 MB / 4,895 | 863 | ~87k | 1 | 35 |

`reduce` ran fast (1.0 s and 670 MB RSS on the 186 MB file). There is no size cap or truncation of the session itself. Truncation is per entry: USER 2,500 chars, AGENT 2,000, TOOL 300, RESULT 2 lines. In the Lead session, 8,564 of ~21k entries carry a `…[+n]` cut.

Hotspots by kind (after merging):

| Session | number pair | exit≠0 | git reversal | meta write | bip |
|---|---|---|---|---|---|
| dc747f94 | 6 | 7 | 2 | 4 | 0 |
| 4df9e88c | 22 | 22 | 2 | 5 | 0 |
| a4954387 | 179 | 167 | 83 | 10 | 0 |
| 4a179af7 | 4 | 8 | 22 | 1 | 0 |

## 3. Hit / miss against the evidence pack

**HIT** means a hotspot is about that moment. **ACCIDENTAL** means a hotspot lands on the moment for an unrelated reason. **MISS** means no hotspot within ±15 lines. **STRUCTURAL** means the moment cannot appear in any transcript momentry reads.

| # | Evidence-pack moment | Where in the sessions | Result | Detail |
|---|---|---|---|---|
| 1 | Causal links 1–11 (07-13..09-18: two copies of the laws, repo divorce, knowledge store moved 4×, `docs/` 365→4,301, ADR move, two registries, 943-file copy, split authority, consumers, skill copies) | none | **STRUCTURAL** | The evidence is git history. No transcript from before 09-27 exists. `reduce` reads no git. |
| 2 | Link 12: proposal 09-20, plan reviews and truth reset 09-25 (`a725d4788`), main copy 09-26 | none | **STRUCTURAL** | Same reason |
| 3 | 09-29 reformat (800→454 lines), 10-06 resume, generator OOM (exit 134/137) | dc747f94 | **MISS** | The OOM happened in Doer runs (`fgos run`), not in any Claude top-level transcript (0 hits for `Exit code 13[47]`). Doer transcripts are not under `~/.codex/sessions` either (0 doc-plan files there). |
| 4 | 10-07 Phase 5 pilot "Not PASS" (E6 14/20, E7 15.6%), METHOD-MUST-CHANGE, then 19/20 | 4df9e88c L1690, L1821 | **MISS / ACCIDENTAL** | L1690 (the "Not PASS" table, "14/20 … cần 18 ❌") has no hotspot: there is no arrow. H1821 fires on "dropped-002 tới 017", a range, in the message that also holds 19/20. |
| 5 | 10-09 A12, quota stop | 4df9e88c L3314 "codex hết quota nên đợi" | **MISS** | |
| 6 | 10-11 A28: "tài liệu thôi mà sao kì công vậy ta, làm 3 ngày rồi chưa xong" | 4df9e88c L5882 | **ACCIDENTAL** | H5897 `exit error` is the `decision-question` PreToolUse hook blocking the agent's AskUserQuestion ("BLOCKED: write the analysis before asking"). The owner's line itself is not a signal. |
| 7 | 10-19 A50: per-edge package (338 parts) "superseded, not reviewed"; the owner answers "A" | a4954387 L19061/L19073 | **MISS** | |
| 8 | 10-19 A51: 7 regenerations, 106/1,275 = 8.3% rework, "đồng ý phương án 2" | a4954387 L22650–L22756 | **MISS** | No hotspot between H22301 and H22825. "106 trên 1.275 … 8,3%" and "sinh lại 7 lần" have no arrow word. |
| 8b | A51 aftermath: the Step-3 pilot rework counts per round | a4954387 H24065, H24249 | **HIT** | "số file phải làm lại … 14 → 3 → 6 → 0; lượt 3 tăng vì phát sinh lỗi câu chữ" |
| 9 | 10-22 SSD saturated, 765 ms | a4954387 L41664 (cross-session message) | **MISS** | |
| 10 | ~10-27 a red Doer partial merged into the plan branch | a4954387 H63263 | **HIT** | `metaWrite` on memory `feedback_dont_merge_known_red_partial_into_plan_branch.md` |
| 11 | 10-29 "Của em làm lâu quá. Cả 5 tuầ rồi" | a4954387 L67528; H67571 | **HIT (indirect)** | The owner line has no hotspot. The memory write `feedback_doc_plan_parallelize_for_speed.md` 43 lines later does. |
| 12 | 10-30 the Doer edited its copy of the oracle 8 times, 5 of them loosening it | a4954387 L71587 | **MISS** | The lesson memory was written by `cat > … <<EOF` in Bash, which `metaWrite` (Edit/Write tools only) does not see. The same holds for A28's `feedback_flag_verification_cost_early.md`. |
| 12b | Same story, surrounding facts | a4954387 H70881, H72692 | **HIT** | "independent scanner fixed this (442 → 32 findings)" and "số lỗi giảm từ 1.660 xuống 263" |
| 13 | 11-03 cutover `97dd62aa7`: 1,677 files, +182,794/−239,220 | a4954387 | **STRUCTURAL** (numbers) / **HIT** (night) | The diff stats come from git and never appear in the transcript. H85778 `metaWrite` on `project_doc_plan_260925_land_grant_2026_11_03.md` marks the Land night. |
| 14 | 11-04 the 7.5 GB evidence and the 457 MB blob | a4954387 H86420 | **ACCIDENTAL** | It fires on the range "160 to 216 MB", but on the right topic. |
| 15 | 11-04 write lease removed | 4a179af7 H4761/H4780 | **HIT** | "Số khoá trong doctor giảm từ 24 xuống 23" |
| 16 | 11-05 the retrospective itself (365→4,301 and others) | a4954387 H89418, H89498, H89648 | HIT, but circular | The retrospective quotes its own numbers. H89648 "365→4" also shows a parse bug: "4 301" is written with a space as the thousands separator. |

**Tally for the 15 session-era moments (rows 3–16):** 6 real hits. Four come from memory writes or lease/scanner numbers, and two are aftermath or adjacent facts rather than the turning point itself. 3 are accidental. 6 are misses. The pre-plan story (all 12 causal links) is structurally unreachable.

The retrospective's three strongest owner quotes ("kì công", "làm lâu quá", "đồng ý phương án 2") get no direct hotspot. Short owner pushback is not a signal class in `reduce`. Only `/bip` marks the owner's voice, and nobody used `/bip` (0 hits).

## 4. Noise: what `reduce` flags that the retrospective treats as noise

These are raw detector hits before merging, classified by a read-only script over momentry's own detectors.

| Class | Lead a4954387 | Others | Why it is noise here |
|---|---|---|---|
| `metricPair` on ranges ("rows 0 to 190", "8 to 12 days", "mapping-0241 to 0300", "1816 to 85766 bytes") | **117 of 182** | 4df9e88c 14/22, 4a179af7 3/4 | `to`/`tới` match English ranges. Reviewer task-notifications ("I reviewed rows X to Y") fill the Lead session. |
| `gitReversal` on `checkout --detach/--ours/--theirs` | 32 | 0 | The regex `checkout\s+--` also matches flags |
| `gitReversal` on `git checkout -- <generated file>` and routine `rebase origin/main` before a push | 40 | 4a179af7: 19 of 22 | Worktree hygiene, not a reversal of a decision |
| `gitReversal` inside heredoc text (decision records that mention "git revert" as a rollback plan) | 7 | dc747f94 1, 4a179af7 3 | The detector scans the whole command string |
| `nonzeroExit` from the privacy hook (`.ckignore` "To allow, add…") | 23 | 10 | Environment friction |
| `nonzeroExit` from harness or tool errors (Blocked sleep, InputValidationError, ReadNotifications off) | 20 | 4 | Agent mechanics |
| `nonzeroExit` from real commands (python tracebacks, grep exit 1, push rejected) | 131 | 24 | Mostly routine. A few matter, e.g. exit 144 with "doc-health: 628 platform documents … 0 finding(s)". |

The retrospective dropped all of these classes. By my reading of the contexts, about 70–80% of the Lead session's 439 hotspots would get a `skip` from harvest. That is cost (each must be answered), not signal.

## 5. Structural limits seen

1. **Session-bounded.** Harvest works per window (150k tokens). Stakes infers a "main goal" per session. No step joins sessions, so the arc 07-13 → 11-04 (12 links, 41 days) cannot be built. Four sessions hold the plan. The Lead session alone needs **18 windows**, each judged by Haiku without the others' context.
2. **No git.** Commit counts, diff stats, tags, file growth (365→4,301), the 943-file copy, and "who copied instead of moved" carry the retrospective's whole causal chain, and none of them live in transcripts.
3. **Retention.** Claude transcripts before 09-27 are gone from the project dir, so the genesis and trigger eras have no source at all.
4. **Top-level transcripts only.** `listTranscripts` reads `<project>/*.jsonl`. It skips the 1,643 subagent transcripts (1,389 mention the plan), sessions in linked worktrees (their `cwd` is outside the repo root), and Doer runs (`fgos run`, where the OOM and the oracle edits happened). Reviewer verdicts only show up as parent-side task-notifications.
5. **Open session.** `scan` skips sessions written in the last 30 minutes. A Lead session kept open for 23 days is harvested only in quiet gaps, through the ledger's `lastLine` windows.
6. **Cost.** `help scan` says about USD 1 per 150k-token session. The Lead session is about 2.63M reduced tokens, which is roughly USD 18 per harvest run for that session alone (estimate, not measured).
7. **Vietnamese.** `lên/xuống/thành/tới` are covered, and `1.360` and `4,744` parse. Missed forms: "X trên Y", "X/Y", percentages, "giảm còn", and space-grouped thousands ("4 301" became `365→4`). The owner's Vietnamese pushback has no detector.
8. **Bash writes evade `metaWrite`.** Memory notes written by heredoc are invisible, and that includes two of the three memory notes the evidence pack cites.

## 6. What `reduce` surfaced that the retrospective missed (good material)

None of these appear in the six posts or the evidence pack (checked with grep).

| Hotspot | Date | Material |
|---|---|---|
| H84840 (accidental), owner L84830 | 2026-11-02 10:57 +0700 → decision 11-03 10:22 | Owner: "thông minh hơn đi. làm tài liệu có phải viết code gì phức tạp mà 6 tuần rồi". Agent: "Phần tài liệu thật ra không khó; cái làm chậm là bộ máy chứng minh mà em dựng quanh nó". The owner then picks **"Land gọn"**, and Land follows that night. This is the decision that unlocked the landing. The posts stop at the 10-29 "5 tuần" quote. |
| H1006 / H1034 / H1061 | 10-06 | Making the ledger look claims up by anchor collapsed claim-identity gaps from **306 to 17** and total gaps from **1,360 to 1,071**: a small root cause behind a big gap count. |
| H24065 / H24249 | 10-19/20 | Rework per round went **14 → 3 → 6 → 0**, because "mỗi lượt reviewer lại tìm ra một kiểu lỗi chữ mới". This is direct evidence for the A51 thesis that semantic judgment does not converge by regeneration. |
| H70881 / H72692 | 10-30 | An independent scanner cut findings **442 → 32**, and later errors went **1,660 → 263**. This is the positive half of the "author never edits the acceptance tool" lesson. The retrospective tells only the negative half (8 oracle edits). |
| H5897, H84840 | 10-11, 11-02 | Both owner-frustration turns coincide with the `decision-question` hook blocking the agent's escalation question. This is a small process story: the guard fired exactly when the agent tried to hand the cost problem back to the owner. |
| All 10 `metaWrite` hits in the Lead session | 10-14 .. 11-03 | Every one is a memory lesson with a timestamp (Doer limits, self-decide A42, main-sync scope, model routing, Phase 9 guards, cross-machine sync, red partial, parallelize, Land grant). It is the most precise detector here (10/10 meaningful), and it amounts to a ready-made lesson timeline the retrospective only partly used. |

## 7. Conclusion

- On this project, `reduce` alone is a poor picker. It hits the plan's turning points about 6 times in 15, three more by accident, and misses the owner-voice moments that carry the retrospective. Its precision in the Lead session is low: ranges, routine git and hook errors make up most of the 439 hotspots.
- The retrospective's core, the 12-link causal chain and the cost table, is out of momentry's reach by design: it uses no git, joins no sessions, and the transcripts are gone before 09-27.
- Where momentry adds value: memory-write hits and before/after number pairs inside long Lead sessions. They surfaced four story-grade facts the human-style retrospective did not use, the biggest being the 11-02/03 "thông minh hơn đi → Land gọn" turn.
- Whether Haiku harvest would recover the misses from the full reduced text (A50/A51 and the owner quotes are all present in `reduced.txt`, none truncated past their key line) is **untested**: it needs a paid run.

## Unresolved questions

- Would a harvest run on the 18 Lead windows recover A51 and the owner quotes without hotspots? This needs a paid run, or `--fake-llm`, which needs prepared outputs.
- Where do Doer (`fgos run`) transcripts live, and does any momentry source reader (codex, pi, omp, agy) see them? I did not locate them.
- Should momentry add owner-pushback and Bash-heredoc memory-write detectors, and narrow `metricPair` and `gitReversal`? Those are design changes for momentry's owner, out of scope here.

Scratch outputs (not in repo): `/tmp/claude-1000/-home-vantt-projects-forgentX/a4954387-fafa-46d2-911f-4ea15b20d08d/scratchpad/reduce-out/{dc747f94,4df9e88c,a4954387,4a179af7}/{reduced.txt,hotspots.txt}`, plus `a4954387/ctx-all.txt` (hotspot to context lines).
