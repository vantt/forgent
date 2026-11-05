# Public-release check: Facebook versions of the doc-260925 retrospective series

**REWORK: 3 required fixes, 6 minor.** The public-safety check passes, and nothing in the text is unfair to the owner. Every other sentence of the public text (about 230) is supported by the fact-checked posts or the pack, with its qualifiers intact. Apply the three replacements below and the set is fit to publish.

Scope: the public text above `---` in `plans/reports/retrospective-261105-1416-doc-260925-facebook-post-{1..6}.md`, read sentence by sentence against the current posts 1-6 and the evidence pack (rounds 3-4 applied). Where a rephrasing touched a number or quote, I re-checked the primary source in git or the transcript. Nothing was edited.

## 1. Required fixes

| # | FB post:line | Public text | Verdict | Evidence | Exact replacement |
|---|---|---|---|---|---|
| R1 | FB 3:51 | "Phần sau: ngày thứ 13, anh chủ dự án hỏi 'quy mô tool ghê vậy?', và **15 phút sau** một bản nháp đã đoán đúng kết cục." | **OVERSTATED** (qualifier lost) | Post 4:5 and FB 4:2 both say "Chưa tới 15 phút sau". The real gap is 11 minutes: T5 L2573 15:03:52Z, L2674 15:14:56Z. | "Phần sau: ngày thứ 13, anh chủ dự án hỏi 'quy mô tool ghê vậy?', và chưa tới 15 phút sau một bản nháp đã đoán đúng kết cục." |
| R2 | FB 2:38 | "một commit có tiêu đề bắt đầu bằng 'fix(dispatch)' … và **kết thúc bằng chữ 'migrate'** (di trú)" | **WRONG** (detail) | The commit title ends with "…docs(agent-coordination): migrate to docs/platform/ target structure", not with the word "migrate". Post 2:43 quotes the ending correctly. | "Ngày 18/9, một commit có tiêu đề bắt đầu bằng 'fix(dispatch)' (sửa phần điều phối) và phần sau ghi 'migrate' (di trú) thêm 943 file vào cây mới: không đổi tên, không xoá bản gốc." |
| R3 | FB 5:35 (also post 5:38) | "22/10: ổ SSD của máy bão hoà, ghi mất 765 ms." | **OVERSTATED** (context lost) | The line sits in the list of this plan's frictions, so a reader will blame the plan. The pack's §1 row 2026-10-22 says "nguyên nhân chủ yếu ở lane khác", and memory `project_owner_machine_qlc_ssd_serialize_heavy_io.md` says the same. The fact-checked post 5 already drops that clause, and the public version carries the omission to a wider audience. | "– 22/10: ổ SSD của máy bão hoà, ghi mất 765 ms (chủ yếu do việc khác chạy cùng máy)." Post 5:38 should get the same clause. |

## 2. Minor (fix if convenient)

| # | FB post:line | Issue | Suggested text |
|---|---|---|---|
| n1 | FB 2:22 | "59 phút sau, một commit khác phải sửa lại" is vague. The commit (`4270c0c0d`) fixed 13 dangling citations in skill prose and extended the guard's baseline to absorb the migrated text, which grandfathers it rather than fixing it. Round 1 (#17/#18) corrected exactly this nuance. | "59 phút sau, một commit khác phải sửa một phần và nới mốc của guard để chấp nhận phần còn lại." |
| n2 | FB 4:48 | "chỉ dừng khi anh chủ dự án hỏi" is stronger than post 4:59, which says "chỉ dừng phình". | "Nhưng nó nhân chi phí ở mọi chỗ sửa, và chỉ thôi phình khi anh chủ dự án hỏi." |
| n3 | FB 4:14, FB 5:32 | Phrase (b) "bằng chứng hoặc dấu kiểm không còn khớp" is true. However, "dấu kiểm" usually means a check mark (✓) in Vietnamese, while the source means content digests (OA6:102, "target-digest drift"). | "99 chỗ bằng chứng hoặc mã kiểm nội dung không còn khớp" (FB 5:32: "làm 99 bằng chứng hoặc mã kiểm nội dung không còn khớp"). |
| n4 | FB 4:14 | "Mỗi ý cần một chủ được review…" drops the scope "Ở Phase 6" given in post 4:21. | "Ở giai đoạn 6, mỗi ý cần một chủ được review hoặc một lý do bỏ được ghi lại." |
| n5 | FB 1:42 | "Một số file … không còn tìm thấy" suggests the files are lost. Post 1:57 says they are not found *in the current history*; the benchmark report lived in the workshop. | "Một số file chỉ nằm ngoài repo trong thời gian đó không có trong lịch sử repo hiện tại." |
| n6 | FB 5:41 | "247 lỗi": the source counts "247 findings", which are audit findings and not necessarily errors. | "Một audit độc lập ở giai đoạn 8 còn ghi 247 phát hiện 'chưa xanh và chưa được miễn'; …" |

## 3. (b) The writer's plain-word rephrasings

| Rephrasing | Verdict | Evidence |
|---|---|---|
| "bằng chứng hoặc dấu kiểm không còn khớp" | TRUE (wording n3) | OA6:102: 47 target-digest drift, 50 exact proofs no longer valid, 2 retired candidates |
| "trong giới hạn hẹp" (Doer may edit its oracle) | TRUE | memory `feedback_author_never_edits_acceptance_tool.md`: "only by named negative fixtures" |
| "bộ test thứ hai" (cargo) | TRUE | board log 2026-11-03 23:50: "npm 9300/45 fail + cargo workspace 1 fail" |
| "không chạy lúc commit" (pre-commit) | TRUE | `docs/platform/convention/spec.md:382`, "It is not duplicated in pre-commit" |
| "bản lưu chỉ có trên máy của anh chủ dự án, không được đẩy lên server chung" | TRUE | tag `archive/doc-260925-lineage` local only, not on origin (Lead check 2026-11-05); the tar is on the same machine (board log 23:50) |
| 6/10 owner quote cut with "…" | TRUE, and fair | TI L2097 continues "…hay chỉnh lại thành ak-plan và làm luôn vì nó đang giữ một đống tài liệu không chuẩn hóa". The cut keeps the question form and the meaning (he doubted the wait) and removes a third-party tool name. The leading subject "H6" was also dropped, which is fine |
| "[thư mục spec]" inside the Opus quote | TRUE (acceptable editorial bracket) | review :23 "…decision history stored in `docs/specs`" |
| Other paraphrases (FB 3:2 and :14 translations of C1/C2; FB 3:20 "chưa được phép bắt đầu di trú"; FB 3:26 the owner's intent; FB 3:34 the mission list; FB 5:53 "giải phóng con người khỏi việc ngồi canh chờ") | TRUE | review :23, :34, :41; re-review; proposal at `2085d88fe^`; AGENTS.md priority 2 |

## 4. (a) Qualifiers, labels, actors and dates

All of these were kept:
- **"ít nhất":** "ít nhất tám lần nữa" (FB 4:2); "ít nhất chín lần" (FB 4:32, FB 6:36); "ít nhất 33" and "29 trước khi Land" (FB 5:2, :39, :53); "ít nhất 368 … cận dưới" (FB 5:1, :22); "ít nhất một tài liệu mới" (FB 1:34); "ít nhất bốn kho" (FB 1:43).
- **"theo cách đọc của người viết":** FB 2:18, FB 5:53, FB 6:24, :40, :46. FB 6:44 repeats the Lead's own conclusion, unlabelled in both post 6 and the FB text; that is acceptable because it echoes the Lead's quoted words at FB 6:8.
- **The owner's ambiguous 4/11 sentence:** still framed as the Lead's interpretation (FB 6:30, :42), with the owner's approval of tasks 1-4 kept.
- **Actors:** decisions attributed to the owner (pilot verdict, 19/10 A50/A51, Land gọn) and to the Lead (tool tightening, "Lẽ ra em nên hỏi gộp") match the sources.
- **Dates and times** are all in +07 and match the transcript and git (re-checked: 13 hours, 10:22, 14:14, 10:57, 21/10, the nine reminder times, 40 days, 13 days with commits on 5, 27 days, 11 days).
- **Numbers:** 365→4.301, 11→13, 6/935→67, 17.034/867/431/402, 34, 59 minutes, 332, 14/473/905, 25 in 22, 3/3/12, 16 groups, 23, 19/20, 99/21, 13,3%/26,7%, 338/20.030/5.427/1.018, 8,3%, 8/5, 43/499/467/219, 2.143/1.858/146, 11.669/11.423, 20/5.117, 7.508.112.807, 457 MB, 1,8%, 1.647, 247, 45/9.300/1, 1.677/943, 628/34, 2.607/0, 9.235. Each one is identical to the fact-checked posts and pack.
- **FB 1:30, "(trên thang F0 tới F5)":** this detail is not in the current post 1, but it is the L6 maturity ladder that round 1 verified (pack timeline; `AGENTS.md` L6 "Maturity ladder F0–F5"). It is a supported clarification, not a new claim.

## 5. (c) Public safety

- **Identifiers:** I scanned the public text of all six posts for hashes (7-40 hex characters), local paths (`/home`, `~/`, `.jsonl`, `docs/…`, `.md`, `.mjs`), machine names (design-lap, fg-server), session or work ids (`tsk-`, `L13-…`, `A<n>`), internal or third-party tool names (codex, ak, herdr, omp, openai), personal names, emails and URLs. There were **no hits**; the only matches were hex runs inside ordinary words.
- **Names that do appear** are public product or model names (fgOS, Claude Opus, Gemini) and generic roles (anh chủ dự án, Lead, Doer). The area name "Agent Coordination" and the commit-title fragment "fix(dispatch)" are not sensitive.
- **Fairness to the owner:** the nine quoted reminders and the 33 progress asks are framed as a cost the system pushed onto him (FB 4:32, FB 5:53 labelled), not as his fault. "thông minh hơn đi" is aimed at the agent, and the Lead accepts the blame (FB 6:8). The 4/11 "Nếu ổn…" passage keeps both his approval of tasks 1-4 and the Lead's interpretation (FB 6:30). The truncated 6/10 quote removes a third-party tool name and changes nothing about him. I found nothing that would embarrass him beyond what the story needs. Since the owner is publishing these himself, the quotes are his own choice.

## 6. Unresolved questions

- None for this check. The open source questions from rounds 3-4 (what "dữ liệu" meant in TL L87031; the extra reminder candidates) are handled by the existing labels and "ít nhất".

Status: DONE
Summary: REWORK. Three required fixes: FB 3 drops "chưa tới" from "15 phút sau"; FB 2 says the commit title "ends with 'migrate'" when it does not; FB 5 lists the SSD saturation as plan friction without "chủ yếu do việc khác". Public-safety and fairness checks pass, and every other sentence matches the fact-checked posts with qualifiers and labels intact.
