# Research: momentry harvest baseline on the doc-plan 260925 sessions

Date: 2026-11-05. Code: momentry `origin/main` `d6f3273` in the eval worktree `/home/vantt/projects/momentry-eval` (no edits to `lib/` or `prompts/`). Follows [research-261105-1700-momentry-reduce-on-doc-sessions.md](research-261105-1700-momentry-reduce-on-doc-sessions.md), which measured only `reduce` (no LLM). Here the paid pipeline ran: Haiku harvest, cluster, outsider, then Sonnet hook/tension and stakes.

**Total spend: 3.076 USD** (cap 8). Dry-run estimate for the same windows was 3.20 USD, so the real spend came to 0.96× the estimate.

## 1. Set-up

- Data dir (gitignored, never committed): `/home/vantt/projects/momentry-eval/docs/_private/eval-forgentx/`, holding `manifest.json`, `labels/*.md`, `<id>/runs/1/` captures, `results/`, and `README-local.txt` (how to re-capture with new code).
- **Isolation verified.** The harness ran every capture in a scratch git repo with its own `MOMENTRY_CACHE`, `MOMENTRY_CONFIG` and `XDG_CONFIG_HOME` under the data dir. After the run, `~/.config/momentry` and `~/.cache/momentry` had 0 files newer than a marker touched before the capture. forgentX's `.momentry.json` and box were untouched, and `git status` in the eval worktree is clean. No `init`/`connect`/`scan`/`mark` was run.
- **Windows.** The cap allowed more than the 3–4 suggested windows, so I used 8. Together they cover all 15 session-era moments, and cost stayed at 38% of the cap.

| id | Transcript | Lines | Dates | Why |
|---|---|---|---|---|
| `4a179af7` | LAND agent | 1–4895 (whole) | 10-25..11-04 | lease 24→23, Land seen from LAND |
| `dc747f94` | harness investigation | 1–3156 (whole) | 10-06 | 10-06 resume, generator |
| `4df9e88c` | Lead, Phases 4–6 | 1–8505 (whole) | 10-06..10-13 | pilot, A12, A28, 306→17 |
| `a4954387-a50a51` | Lead | 18800–25000 | 10-19..10-20 | A50, A51, rework 14→3→6→0 |
| `a4954387-ssd` | Lead | 41400–42000 | 10-22 | SSD 765 ms |
| `a4954387-redpartial` | Lead | 62800–63500 | 10-27 | red partial merged |
| `a4954387-oracle` | Lead | 66800–73000 | 10-29..10-31 | "5 tuần", oracle edits, scanner 442/1,660 |
| `a4954387-land` | Lead | 84500–86600 | 11-02..11-03 | "thông minh hơn đi", "Land gọn", Land night, 7.5 GB |

The Lead session is still open, but every window ends at line 86600 (11-03) or earlier. `capture.json` stores each window's sha, so later growth of the file does not affect a replay.

- **Labels** (`labels/*.md`, 75 rows, 32 marked `t`) are **drafts by an agent**, not reviewed by the owner. Each `t` row is one of the 15 moments or 4 extras, or the strongest story in its window. I wrote the labels from the evidence pack, the reduce report and a skim of each window's turns, while the capture was running and before I read any harvest output.

## 2. Results per window (harness metrics)

Capture, then a free replay (`--fake-llm`). The replay reproduced every window exactly (`replay: done`, the same id list as the capture, no window drift), so the replay is deterministic.

| Window | USD | Seconds | Stories | Recall | p@5 | p@10 | t-rank | t in top half |
|---|---|---|---|---|---|---|---|---|
| 4a179af7 | 0.292 | 177 | 26 | 89% | 0.60 | 0.70 | 10.7 | 2/4 |
| dc747f94 | 0.323 | 164 | 28 | 91% | 0.80 | 0.70 | 5.0 | 5/5 |
| 4df9e88c | 0.767 | 293 | 42 | 100% | 0.20 | 0.20 | 18.6 | 6/8 |
| a4954387-a50a51 | 0.787 | 387 | 41 | 100% | 0.80 | 0.60 | 8.3 | 3/3 |
| a4954387-ssd | 0.069 | 99 | 16 | 100% | 0.80 | 0.60 | 5.0 | 1/1 |
| a4954387-redpartial | 0.078 | 111 | 19 | 100% | 0.40 | 0.50 | 4.5 | 2/2 |
| a4954387-oracle | 0.514 | 305 | 35 | 100% | 0.80 | 0.60 | 6.3 | 4/4 |
| a4954387-land | 0.246 | 172 | 17 | 100% | 0.80 | 0.80 | 1.6 | 5/5 |
| **Total / mean** | **3.076** | **1707** | **224** | **97%** | **0.65** | **0.59** | **7.5** | **28/32** |

Spend by step: harvest 41%, outsider 26%, hook-tension 13%, cluster 11%, stakes 9%. Input was 3.38M tokens; the outsider step re-reads the whole window, so it uses nearly as many input tokens as harvest.

**Read these numbers with care. The matcher is lenient.** A label matches when it shares 2 keywords with a story, or when one keyword sits inside the label's line range. A manual check of every `t` match found:

- **Inflated:** 4a179af7 "7,5 GB" matched only a passing mention inside the stopping-now protocol story (#17). In 4df9e88c, A28 matched the hook-bug story #27, but the real A28 story is #11; the label keyword "kì công" was paraphrased away. In `land`, "ca-hai-ngoi-doi" also matched #2, but its real story is #11.
- **Deflated:** p@5 and p@10 for 4df9e88c (0.20) are low mainly because the labels are incomplete. Its top 10 are real story-grade moments that I did not label, such as "Merge main làm vỡ 173 receipt", "update-ref làm main checkout đảo ngược 51 file" and "Trạng thái nằm trong /tmp: reboot làm mất registry".
- My manual count for the 32 `t` labels: about 27 genuinely recovered, 3 partly recovered, and 2 missed (the Land commit `97dd62aa7` seen from LAND, and LAND's own view of the 7.5 GB pause). Two of the 27 rank low (#30 and #31).

## 3. Does the paid step fix reduce's misses?

**Mostly yes for recall, no for ranking.** Every moment that `reduce` missed or hit only by accident shows up as a harvest story, and most of the turning points have no hotspot tag (`hit_by: [harvest]` or `[harvest, outsider]`), so harvest found them on its own. Across all windows, 147 of 224 stories carry no hotspot. The weak point is ranking: several owner-voice moments come out as strength-1 stories in the bottom half.

| # | Moment | reduce | Harvest (rank/N, strength, hit_by) |
|---|---|---|---|
| 3 | 10-06 resume, generator OOM | MISS | **Recovered.** dc747f94 #4/28 s3 "Plan 'chưa ai làm' thực ra chạy dở 59 commit trên branch riêng" (harvest only). dc747f94 #15/28 "Bộ sinh kiểm kê đọc chính kết quả của mình: 250 MB, hết bộ nhớ" (harvest only). 4df9e88c #19/42 s3 "…hết bộ nhớ, sau sửa còn 1,9 GB" |
| 4 | Pilot "Not PASS" → 19/20 | MISS / accidental | **Partial.** #16/42 s2 "Phép thử mù: 16 claim bị rơi lộ ra" (E1 6/7→7/7). The words "Not PASS", 14/20 and METHOD-MUST-CHANGE never appear |
| 5 | A12 quota stop | MISS | **Recovered, low.** #30/42 s1 "Phiên dừng vì hết quota giữa chừng: worktree dở 4 file" (harvest only) |
| 6 | A28 "kì công … 3 ngày" | accidental | **Recovered, low.** #11/42 s1 "Tách kiểm nội dung khỏi kiểm sự thật" (sample of 30 units). The owner line is paraphrased as "Owner hỏi vì sao tài liệu mà tốn công thế". The hook-block story is #27 |
| 7 | A50 per-edge 338 parts | MISS | **Recovered.** #4/41 s2 "Đổi cách review từ từng cạnh sang từng cặp ánh xạ: 20.030 mục còn 1.018 cặp" (harvest only) |
| 8 | A51 8.3%, "phương án 2" | MISS | **Recovered.** #5/41 "Khi máy không hội tụ, đổi đơn vị review từ cạnh sang file (quyết định A51)" (harvest + outsider), and #2/41 s3 "Mẫu vượt ngưỡng 3% nên bản kiểm kê bị bác" |
| 8b | Rework 14→3→6→0 | HIT | Recovered but **#31/41**, s1 |
| 9 | SSD 765 ms | MISS | **Recovered.** #5/16 "Hai agent tranh đĩa: cửa sổ I/O và tín hiệu 'DOC quiet'" (harvest + outsider) |
| 10 | Red partial merged | HIT | #7/19 "Merge nhầm phần đang dở vào nhánh plan" |
| 11 | "làm lâu quá. Cả 5 tuần rồi" | indirect | **Weak.** #26/35 s1 "Chạy song song để kịp hạn". The quote survives only as background |
| 12 | Doer edits its oracle | MISS | **Recovered, top 3.** #3/35 s3 "Doer tự sửa oracle: số lệch giảm 481 xuống 50 nhờ sửa thước đo, 5/8 chỗ sửa sai" (harvest + outsider) |
| 12b | Scanner 442→32, 1,660→263 | HIT | #9/35 "442 xuống 32 finding", #21/35 "1.660 xuống 263", plus #4 "kiểm toán độc lập tìm 328" and #2 "scanner v2 báo 1.698" |
| 13 | Land night 11-03 | HIT (memory write) | `land` #5/17 "Bảy lần dry-run, mỗi lần lộ một lớp lỗi mới" and #11 "Quyền Land đã cấp qua chat mà máy vẫn chờ". The git diff stats are still structurally out of reach |
| 14 | 7.5 GB evidence, 9 blobs over 100 MB | accidental | **Recovered, #1/17** s3 "Plan 7,5 GB đi cùng nhánh sản phẩm: GitHub sẽ từ chối và test chậm 251 giây" (harvest + outsider) |
| 15 | Write lease removed, 24→23 | HIT | 4a179af7 #7/26 s1 |

The four extras:

| Extra | Harvest |
|---|---|
| "thông minh hơn đi … 6 tuần rồi" (11-02), then "Land gọn" (11-03) | **Pushback recovered at #2/17 s3**, hook "Chỉ để sửa link chết, mốc giao trượt gần 6 tuần", with source lines 84826/84838/84864. **"Land gọn" is not named as a decision**: the story ends on a lesson, not on the owner's choice. Partial |
| Identity gaps 306→17 | Recovered, #20/42 s2 "Đếm lại danh tính: ghép theo anchor kéo gap 306 xuống 17" |
| Scanner 442→32, 1,660→263 | Recovered (see 12b) |
| Memory-note writes | Only 2 stories in the Lead windows mention the memory rule (red partial, Land grant). Harvest does not turn the memory writes into a lesson timeline |

The six items you asked about:

- **A50:** recovered at #4/41 with no hotspot.
- **A51:** recovered at #5/41 and #2/41, both without a hotspot.
- **"Land gọn":** partial. The owner's pushback ranks #2, but the decision itself is unnamed.
- **Oracle edit:** recovered at #3/35, the clearest win. `reduce` missed it, and harvest ranks it strength 3.
- **SSD saturation:** recovered at #5/16.
- **A12:** recovered, but low at #30/42.

## 4. Other observations

- **Quality beyond the labels.** Harvest surfaced strong stories that neither the retrospective nor `reduce` named. Examples: "Auditor làm giả chỉnh sửa, công cụ nhận; siết lại thì 448 chỉnh sửa thật bị chặn" (oracle #1); "Test xanh không chứng minh được gì: đột biến code vẫn qua 254 fixture" (land #3); "Kiểm kê bước apply: không có công cụ nào ghi composition vào docs" (redpartial #2, on 10-27); "63% lỗi 'do harness' tan khi chấm lại" (dc747f94 #1).
- **Ranking bias.** Strength-3 stories are mostly technical "number flips". Owner-voice and process turns (A12, A28, "5 tuần", rework 14→3→6→0, 306→17) come out as strength 1–2 and fall into the bottom half. For this domain, the scoring under-rates the owner's pushback.
- **Noise.** 27 outsider-only stories are generic "how the agent works" items, such as "Dùng agent con chạy song song…". They sit at the bottom of every list, so they cost reading time but do little ranking harm.
- **Cost per window** tracks the reduced token count closely: about 0.29–0.32 USD per 100k tokens.

## 5. Re-running

- Replay (free): `node scripts/eval/run.mjs --manifest docs/_private/eval-forgentx/manifest.json --out docs/_private/eval-forgentx`
- New capture with new code (about 3 USD): add `--capture --budget 8`. It lands in `runs/2/`, and the drift columns compare it against this baseline.
- Before using these labels as a gate, an owner or a second reviewer should fix the label keywords that paraphrase breaks (A28 "kì công", "Land gọn") and add the unlabelled top stories of 4df9e88c.

## Unresolved questions

- Should the labels be owner-reviewed before this set is used as a regression gate? As drafts they inflate recall (lenient keywords) and deflate p@k in 4df9e88c (missing labels).
- The ranking under-weights owner pushback. Is that a scoring change for momentry's owner, or is it acceptable for this domain?
- The missing pre-09-27 sessions and the git-only causal chain are still structurally out of reach. This baseline did not change that.
