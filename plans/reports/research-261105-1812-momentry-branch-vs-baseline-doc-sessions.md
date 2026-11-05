# Research: momentry `feat/story-material-signals` vs baseline on the doc-plan 260925 sessions

Date: 2026-11-05. Follows [research-261105-1737-momentry-harvest-baseline-doc-sessions.md](research-261105-1737-momentry-harvest-baseline-doc-sessions.md).

- Baseline code: momentry `origin/main` `d6f3273`, in the eval worktree `/home/vantt/projects/momentry-eval`.
- Branch code: `/home/vantt/projects/momentry` at `457f76e` on `feat/story-material-signals`. The branch adds the `ownerVoice`, `lessonWrite` and `blocked` hotspots and noise filters for `metricPair` and `gitReversal`. It changes harvest prompts only; `rank.mjs`, `stakes.md` and `hook-tension.md` are unchanged.
- No code was edited and nothing was committed in either checkout (`git status` is clean in both). `~/.config/momentry` and `~/.cache/momentry` have 0 files newer than the pre-run marker.
- Data lives under the gitignored `docs/_private/` only:
  - baseline, plus the new `manifest-v2.json`, `labels-v2/` and `labels-v2/CHANGES.md`: `/home/vantt/projects/momentry-eval/docs/_private/eval-forgentx/`
  - branch captures: `/home/vantt/projects/momentry-eval/docs/_private/eval-forgentx-branch/`

**Spend for this task: 2.944 USD** (cap 4). That is 2.927 for the 8-window capture plus 0.018 for one ssd retry. Label review and both replays cost 0 USD.

## 1. Label review (labels-v2)

v1 had 75 labels, 32 of them `t`. v2 has 88 labels, 31 `t`. Every row change has a one-line reason in `labels-v2/CHANGES.md`, and v1 is untouched. I worked from three sources: the baseline match table (which story each v1 label hit), the evidence pack, and grep-only reads of owner and agent lines in each window.

What changed, by kind:

- **Leniency (most changes).** The matcher's rule 3 (one story line inside the label's range plus any one keyword) let generic keywords match unrelated stories. Generic words were "Land, main, build, done, IO, DOC, lỗi, commit, merge, oracle, scanner, công cụ, tự, hook". Examples of v1 labels hitting the wrong stories:
  - `giao-thuc-stopping-now` hit 5 stories.
  - `git-04-freeze` hit 5 stories.
  - `doer-sua-oracle` hit 5 stories.
  - `loi-1660-263` hit 5 stories.
  - `bao-nham-build-cu` hit 5 stories.
  - `rework-14-3-6-0` best-matched an unrelated checker story at #19 (the real story is #31).
  - `lam-lau-qua-5-tuan` best-matched the rate-limit story.
  - `ca-hai-ngoi-doi` best-matched the pushback story.

  I removed those words and narrowed the ranges.
- **Paraphrase fixes.** For `ki-cong-a28`, "kì công" never survives harvest. v2 uses the content words "tốn công, 30 unit, mẫu 30, candidate-unverified" and drops "hook, decision-question", which had made the label match the hook story. `land-gon` now has no line range, `min 2`, and keywords for the decision's content ("gate gọn, cổng gọn, chỉ kiểm sản phẩm, sổ sách sau Land").
- **Splits.** The hook veto right after A28 is now its own non-`t` row, as is the "không chạy ở đây" owner decision (dc747f94).
- **`t` changes.** Two LAND rows are now non-`t`: the 7.5 GB pause and the 97dd62aa7 Land are DOC's events, relayed to LAND. `phan-loai-19-file-a17` is now `t`: it was the baseline's top story, where the plan's stop condition was hit and method change A17 followed.
- **New rows (14).** All were checked against the transcript before adding:
  - 4df9e88c top 10: 74% script proof / 5,420 lines; 2,926→4,744; 48 identical copies; D3; update-ref 51 files; 173 receipts; plus the owner prod "đừng phức tạp quá" (1/9).
  - dc747f94: 233 node_modules; 29 modules.
  - redpartial: ruling wrong 24/32.
  - oracle: auditor faked edits (448); scanner v2 1,698; Land-date estimate slipped three times.
  - land: auditor REWORK of the lean gate; 254 fixtures still green under mutation.
  - Not added: "40/54" (4df9e88c baseline #2). Its numbers are not in the window's text.

Known limit of v2: `land-gon` (no range, `min 2`) is too strict for a short story. It misses the branch's #1 "…chủ đổi sang gate gọn", which names the decision. I did not retune it after seeing branch output; the manual count in §3 corrects for it.

## 2. Metrics on labels-v2 (harness)

Both runs were replayed against labels-v2. Replay was deterministic in both: `replay: done`, the same id list as the capture, no window drift.

**The branch's ssd window failed twice** (exit 4, "mọi lần harvest đều hỏng"). The branch filter removed one of baseline's two ssd hotspots, which left a single hotspot `H41924 [L41924] exit 2`. Haiku answered with id `"H1"` on all 4 calls, and `lib/validate.mjs` treats an unknown hotspot id as a hard error, so the whole window was lost. The cause predates the branch (main has the same strict validator), but the branch made it show up here. Cheap fix: map an unknown id to the only hotspot, or drop unknown answers instead of failing. The tables below compare the **7 windows both runs have**.

| Window | Base USD | Branch USD | Base s | Branch s | Base N | Branch N | Recall b/br | p@5 b/br | p@10 b/br | t-rank b/br | t top half b/br |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 4a179af7 | 0.292 | 0.296 | 177 | 184 | 26 | 24 | 89/100% | 0.20/0.60 | 0.50/0.50 | 7.5/10.0 | 2/2 · 1/2 |
| dc747f94 | 0.323 | 0.344 | 164 | 187 | 28 | 36 | 86/79% | 1.00/0.40 | 0.80/0.50 | 8.4/12.8 | 3/5 · 3/5 |
| 4df9e88c | 0.767 | 0.788 | 293 | 342 | 42 | 34 | 96/75% | 0.80/0.60 | 0.80/0.70 | 15.0/8.7 | 8/9 · 6/9 |
| a50a51 | 0.787 | 0.695 | 387 | 274 | 41 | 33 | 100/75% | 0.60/0.20 | 0.50/0.40 | 12.3/5.5 | 2/3 · 2/3 |
| redpartial | 0.078 | 0.073 | 111 | 107 | 19 | 17 | 100/100% | 0.60/0.60 | 0.50/0.50 | 4.5/7.5 | 2/2 · 1/2 |
| oracle | 0.514 | 0.493 | 305 | 279 | 35 | 32 | 100/92% | 0.80/0.60 | 0.50/0.50 | 13.5/4.3 | 2/4 · 3/4 |
| land | 0.246 | 0.224 | 172 | 137 | 17 | 21 | 92/83% | 1.00/0.60 | 0.80/0.70 | 4.2/6.0 | 4/5 · 4/5 |
| **7 windows** | **3.006** | **2.913** | **1608** | **1510** | **208** | **197** | **95/86%** | **0.71/0.51** | **0.63/0.54** | **9.35/7.84** | **23/30 · 20/30** |
| ssd | 0.069 | 0.031 (2 failed) | 99 | 178 | 16 | 0 | 100/0% | | | | 1/1 · 0/1 |

Spend by step (all windows) moved little:

| Step | Baseline USD | Branch USD |
|---|---|---|
| harvest | 1.265 | 1.253 |
| outsider | 0.797 | 0.800 |
| hook-tension | 0.394 | 0.338 |
| cluster | 0.353 | 0.315 |
| stakes | 0.267 | 0.238 |

Harvest input grew 1.60M→1.70M tokens; the retries are inside that.

Hotspots per kind, counted from the harvest prompts:

| Kind | Baseline | Branch |
|---|---:|---:|
| metricPair | 82 | 16 |
| nonzeroExit | 55 | 37 |
| gitReversal | 39 | 9 |
| metaWrite | 13 | 1 |
| ownerVoice (non-short) | n/a | 38 |
| ownerVoice short turn | n/a | 26 |
| lessonWrite | n/a | 21 |
| blocked | n/a | 19 |
| **Total** | **189** | **167** |

Per window, the count went 35→26, 19→23, 51→68, 35→12, 10→12, 34→21, 3→4, 2→1. In 4df9e88c, ownerVoice adds 27 and lessonWrite adds 10, which is why that window costs more there (dry-run 0.86 vs 0.77).

**Noise.** Each side is a single capture, and harvest is not deterministic: earlier project data had the same session give 14 vs 31 stories. Read these as noise:

- Story counts per window (±8, about ±25%).
- p@5 on 5 items: one story is 0.20.
- t-rank shifts of a few places.
- The harness recall drop (95→86%), most of which is keyword fragility (next section).

What is not noise in direction:

- Hotspot mix: deterministic code, so measured exactly.
- The ssd failure: reproduced on 4 of 4 calls.
- Owner moments appear more often in titles. 14 of 208 stories in baseline and 24 of 197 in branch name the owner ("chủ / owner / người duyệt / người dùng"). Their median relative rank moved from 0.89 to about 0.76. This is plausible, since the ownerVoice hotspot forces harvest to give a verdict on each owner turn, but it is still one run.

## 3. Manual check of the `t` labels (7 common windows: 30 `t`)

| | Full | Partial | Missed |
|---|---|---|---|
| Baseline | 25 | 5 (pilot "Not PASS" unnamed, truth pass, Land gọn as proposal only, "5 tuần" as background, H6 resume folded into 59-commit story) | 0 |
| Branch | 22 | 6 (lease 24→23 only a detail of a doctor-count story, pilot, generator OOM only background in 4df9e88c, 19-file story turned into its A17 remedy, 14→3→6→0 numbers lost, H6 resume) | 2 (A12 quota stop; "chưa có writer" inventory in redpartial) |

The harness numbers err in both directions:

- **Branch, counted missed but actually found:** A28 (#2, plus the owner-choice story #27), Land gọn (#1), "5 tuần" (#15). All three are paraphrased.
- **Branch, counted found but wrong story:** generator (#25), lease (#15).

**The two branch misses are within run-to-run noise.** Neither is a hotspot-driven story, and one capture per side cannot attribute them to the code.

Rank of the owner-voice and decision moments (rank/N; tension, stakes/strength):

| Moment | Baseline | Branch |
|---|---|---|
| A12 quota stop | #30/42 (khac, 0/1) | missed |
| A28 "kì công… 3 ngày" | #11/42 (it_ma_nhieu, 3/1); owner line paraphrased | content #2/34 inside "tỉ lệ làm lại 36%→1,8% khi tách… kiểm sự thật" (3/3); owner choice "Chủ dự án thúc vì chậm… chọn phương án B" **#27/34 (none, 3/0)** |
| Owner prod 2/9 "build tool cả buổi chiều" | #18/42 | **#3/34** (giup_ma_hai, 3/3) |
| A50 per-edge | #4/41 (3/2) | #9/33 (it_ma_nhieu, 3/1) |
| A51 "phương án 2" | #5/41 (khac, 3/2), #2 | #8/33 "Chủ dự án đổi cổng…" (3/1), #2 |
| Rework 14→3→6→0 | #31/41 (none, 2/1) | #25/33 (none, 2/0), numbers lost |
| "làm lâu quá… 5 tuần" | #26/35 (none, 1/1), background only | **#15/32** "Chủ dự án thúc tiến độ…" (giup_ma_hai, 1/2) |
| "thông minh hơn đi" | #2/17 (3/3) | #1/21 (3/3) |
| "Land gọn" | partial: #2 proposes the gate, the owner's choice is unnamed | **#1/21**: "…chủ đổi sang gate gọn", the choice is named |
| "ko để anh tự bàn giao" | #18/28 | #29/36 |

Net: the branch names owner decisions more often (Land gọn, A51, A28 choice, "5 tuần", prod 2/9), and several move up. A50, A51 and "bàn giao" move down. With one run per side, only the "named more often" direction is worth trusting. The rank moves are mixed and within noise.

## 4. Diagnosis: why owner-decision stories rank low in both runs

`lib/rank.mjs` `rankKey`:

```
[outsider-only ? 1 : 0, tension ≠ none ? 0 : 1, -(stakes + strength), -hits, -date]
```

Tension `none` sorts a story below **every** story that has a tension, whatever its stakes. After that, stakes and strength count equally. Across the 7 windows:

| Run | Owner-titled stories: % none | Owner: stakes / strength | Other stories: % none | Other: stakes / strength |
|---|---|---|---|---|
| Baseline | 36% | 0.86 / 0.86 | 27% | 1.40 / 1.65 |
| Branch | 38% | 1.38 / 1.21 | 21% | 1.38 / 1.68 |

In the branch, stakes for owner stories caught up with the rest. The remaining gap is in **strength and tension**, which come from `hook-tension.md`. Concrete cases:

- **A28 owner choice (branch):** stakes 3 ("đổi hướng"), but tension `none` and strength 0, so it lands at #27/34.
- **Rework 14→3→6→0:** stakes 2, tension `none`. It lands at #31 in the baseline and #25 in the branch.
- **"5 tuần" (baseline):** stakes 1. Its reason, from `stakes-1.json`, was "Song song hoá để kịp hạn, quy trình".
- **A12:** stakes 0, reason "sự cố môi trường".

The prompt lines responsible:

- `prompts/hook-tension.md:11`: "- none: không có giằng xé thật, chỉ là sự kiện, mẹo, hay việc vặt"
- `prompts/hook-tension.md:13`: "Đừng ép giằng xé khi không có: none là câu trả lời hợp lệ và thường gặp." The listed types (lines 4–10) have `it_ma_nhieu` (little in, much out) but not its inverse. Much effort for little result is exactly the owner's complaint ("6 tuần cho tài liệu"), so the model picks `none`.
- `prompts/stakes.md:5`: "- 0: sự cố bên lề (công cụ, môi trường, quy trình) không ảnh hưởng kết quả việc chính". Along with line 3 ("việc chính… user đang cố đạt kết quả gì"), this makes the derived `main_goal` purely about output. For example: "Di trú/dọn lại toàn bộ cây tài liệu… với bảo toàn nội dung có chứng minh bằng máy". Pace and cost pushback therefore counts as "quy trình" and gets 0–1.

**Smallest proposed changes (not implemented). Each can be checked by replay at 0 USD except the prompt changes:**

1. **Rank tweak (`lib/rank.mjs`, 1 line, 0 USD to verify by replay).** Treat tension `none` as `none` only when stakes < 2. A story the stakes step calls a partial or full turning point should not sit below every story that has a tension. Simulated on the captured lists, with `2·stakes + strength` as the sum:
   - branch A28 owner choice: #27→#11
   - baseline rework 14→3→6→0: #31→#20
   - branch rework 14→3→6→0: #25→#21
   - A50 and A51: up 1–2 places
   - Land #1 and the oracle stories: unchanged

   With the plain `stakes + strength` sum, the gain is smaller (A28 choice #27→#20). Check it with a replay on both eval sets before adopting.
2. **`hook-tension.md`, one line after line 11.** "Khi user chê, giục hoặc chọn đổi hướng, giằng xé là giữa công đã bỏ ra và kết quả (bỏ nhiều mà thu ít), hoặc giữa điều agent làm và điều user cần: chọn `khac` hoặc `giup_ma_hai`, không phải `none`." This needs no schema change. A new `nhieu_ma_it` type would be cleaner, but it needs `TENSIONS` in `lib/box.mjs`.
3. **`stakes.md`, one line after line 8.** "Lời user phản đối, giục hoặc quyết định làm đổi phạm vi, cách làm hay nhịp của việc chính là ít nhất 2; user chọn hướng mới là 3." Both prompt changes need a paid capture to measure: about 0.4 USD for hook-tension plus stakes across 8 windows, if run on the cached clusters.

Option 1 alone fixes the buried A28-choice and rework stories. Options 2 and 3 are needed for pace pushback ("5 tuần", A12), which today gets stakes 0–1.

## Unresolved questions

- Should `land-gon` get its line range back with `min 2`? That would let it match the branch's #1 at the cost of some leniency. I left v2 frozen so both runs are scored by the same labels.
- The strict hotspot-id validator lost a whole window over one renamed id. Should that be fixed before more branch evals?
- A second capture of each side (about 3 USD each) is the only way to separate the code effect from noise for the A12, writer and rank moves.

Status: DONE_WITH_CONCERNS
Summary: The labels are revised into labels-v2 (88 rows, 31 `t`, every change logged). Baseline-v2 and the branch were compared on 7 windows. The branch names owner decisions more often (Land gọn #1, "5 tuần" #15, prod 2/9 #3), but harness recall and p@k are lower and most differences are within single-run noise. The branch's ssd window failed on a pre-existing strict hotspot-id check. Spent 2.944 USD of the 4 USD cap.
Concerns: one window lost (ssd) and only one capture per side, so rank moves cannot be told apart from noise.
