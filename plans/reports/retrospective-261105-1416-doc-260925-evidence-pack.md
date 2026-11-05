# Evidence pack: hồi cứu plan 260925 (documentation authority unification)

Ngày lập: 2026-11-05 (Asia/Saigon). Đây là nguồn dữ liệu cho chuỗi sáu bài hồi cứu. Mỗi dòng có nguồn. Dòng nào nghiên cứu ghi là chưa kiểm chứng thì được đánh dấu **UNVERIFIED** hoặc bỏ hẳn (danh sách bỏ ở mục 5).

## Quy ước nguồn

- **R-genesis**: [research-261105-1411-retrospective-genesis-compound-era.md](research-261105-1411-retrospective-genesis-compound-era.md)
- **R-middle**: [research-261105-1411-retrospective-middle-growth-era.md](research-261105-1411-retrospective-middle-growth-era.md)
- **R-trigger**: [research-261105-1411-retrospective-plan-260925-trigger.md](research-261105-1411-retrospective-plan-260925-trigger.md)
- **R-built**: [research-261105-1412-retrospective-plan-260925-built-and-gained.md](research-261105-1412-retrospective-plan-260925-built-and-gained.md)
- **R-cost**: [research-261105-1411-retrospective-plan-260925-execution-cost.md](research-261105-1411-retrospective-plan-260925-execution-cost.md)
- **TAG** = `archive/doc-260925-lineage` (commit `84bbfa7b8`); **P** = `plans/260925-documentation-authority-unification`.
- **Lead check 2026-11-05**: ba sự kiện do Lead xác nhận: (a) `97cc4b432` là đỉnh fast-forward mà Phase 10 land lên main, các commit công việc của Phase 10 là `46310f968..00c64d5a5`; (b) tag `archive/doc-260925-lineage` (`84bbfa7b8`) chỉ có trên máy owner, không push lên origin, để giữ 7,5 GB evidence ngoài main; (c) write lease của cutover được gỡ ở `ad72e3a46` (2026-11-04).
- **Fact-check**: [review-261105-1423-doc-260925-retrospective-claims.md](review-261105-1423-doc-260925-retrospective-claims.md), trích theo số claim (#N). Bản pack này đã sửa theo các edit của nó.
- **Writer check 2026-11-05**: kiểm tra trực tiếp, chỉ đọc, của người viết (`git log -1` và `sed` trên file ở main).
- Memory notes được trích theo tên file trong `~/.claude/projects/-home-vantt-projects-forgentX/memory/`.
- **TL** = transcript Lead `~/.claude/projects/-home-vantt-projects-forgentX/a4954387-fafa-46d2-911f-4ea15b20d08d.jsonl`; **T5** = `4df9e88c-dcc7-4ca8-b24a-b69b112e7ced.jsonl` (Lead, Phase 4 tới 6); **TI** = `dc747f94-5283-4c29-9790-177f2aa7ee33.jsonl` (điều tra harness). `L<n>` = dòng JSONL. Giờ trong transcript là UTC; bảng dưới ghi +0700. Các dòng này lấy từ [báo cáo chọn chuyện](research-261105-1738-retrospective-story-candidates-ranked.md) và được người viết đọc lại từng dòng ngày 2026-11-05 (chỉ text của lượt đó, không đọc cả file).
- **OA6 / OA8** = `TAG:P/reports/phase-06/owner-answers.md` / `TAG:P/reports/phase-08/owner-answers.md`.

## 1. Dòng thời gian gộp (genesis đến 2026-11-04)

| Ngày (+0700) | Commit / file | Sự kiện | Nguồn |
|---|---|---|---|
| 2026-07-13 11:34 | `f6139bf57` | Root commit, chỉ có `LICENSE`. | R-genesis §1 |
| 2026-07-13 13:29 | `a21d9446c` | Tài liệu đầu tiên: README định vị (gõ sai thành `READEME.md`) và `docs/naming.md`. | R-genesis §1 |
| 2026-07-13 13:30 | `2930a89fc` | Hệ "reference learning" (`docs/references/*`), tiền thân của distillery. | R-genesis §1 |
| 2026-07-14 00:01 | `ebc6e8047` | Deep-dive `compound-engineering`: "mỗi đơn vị công việc để lại hệ thống KHÁ HƠN cho đơn vị kế". | R-genesis §1, §2.1 |
| 2026-07-14 00:03 | `823926cc7` | Onboard bee 0.1.32; `AGENTS.md`, `docs/history/learnings/critical-patterns.md`. | R-genesis §1 |
| 2026-07-14 00:28 | `e9ff70db7` | `docs/platform-foundations.md`: tám luật L1 đến L8 của compound-learning stack. | R-genesis §1, §2.2 |
| 2026-07-14 02:26 | `ad65f59fd` | `docs/specs/` ra đời (work-state, system-overview, platform-foundations, reading-map); bản thứ hai của luật nằm ở `docs/specs/platform-foundations.md`. | R-genesis §1, §3.7 |
| 2026-07-14 | `06df4970f` | `docs/routing-handoff-contract.md` đặt ở gốc `docs/`, ngoài `specs/`. | R-middle §1 |
| 2026-07-14 20:02 | `e99998633` | "Repo divorce": `/plans/`, `/docs/history/`, `/docs/distillery/` bị ignore khỏi repo sản phẩm. | R-genesis §3.3 |
| 2026-07-14 22:48 | `c93aa4acf` | `docs/decisions/` với 9 ADR chưng cất tay từ 17 quyết định nguồn. | R-genesis §1, §3.2 |
| 2026-07-15 10:20 | `8c7be926a` | `docs/work-item-lifecycle.md`: bước 5 là "Compound-learning". | R-genesis §2.4 |
| 2026-07-16 | `2d60303ef` | `docs/architecture-map.md` ở gốc `docs/`. | R-middle §1 |
| 2026-07-16 15:17 | `15ddd61e8` | Tuyên bố đạt bậc F4. Bằng chứng benchmark nằm ở workshop, ngoài repo: **UNVERIFIED** từ repo này. | R-genesis §2.3 |
| 2026-07-20 19:33 | `3ee30977a` | Done-gate: item coding không được tới `done` nếu chưa qua stage compound-learn; thêm `test/e2e/compound-learn-lifecycle.test.mjs`. | R-genesis §1, §2.4 |
| 2026-07-20 23:49 | `1739a83d5` | Skill `fgos-compounding`: viết tài liệu end-user theo bốn góc Diataxis. | R-genesis §2.4 |
| 2026-07-22 | `cf27ae0b3` | `critical-patterns.md` được chưng cất thành `docs/explanation/*`. | R-genesis §1 |
| 2026-07-28 | `2bbd8f70f` | Bỏ ignore `docs/history`, kết thúc thời "divorce". | R-genesis §3.3 |
| 2026-08-01 | `6e0e3c017` | Mẫu đo: 365 file trong `docs/`. | R-middle §2 |
| 2026-08-15 | `36e0602fd` | 1.500 file; `docs/history` tăng 535 lên 1.115 trong một tuần. | R-middle §2 |
| 2026-08-17 | `4722361ae` | tsk-1lv-4 dời 34 ADR vào mục "Lịch sử quyết định" của `docs/specs/<area>.md`. | R-middle §1, §3.3 |
| 2026-07-27 | `41af242e7`, `510abb006` | Script và spec guard citation drift ra đời. | fact-check #18 |
| 2026-08-17 | `4270c0c0d` | 59 phút sau, phải cập nhật baseline của guard citation drift và sửa "dead write-time sweep". | R-middle §3.3; fact-check #17, #18 |
| 2026-08-20 | `07c4a5205` | Tách doctrine core/domain; sửa tay bản render `plugins/fgOS/skills/fgos-routing/SKILL.md` trong cùng commit với nguồn. | R-middle §1, §3.9 |
| 2026-08-25 | report | 268 tài liệu end-user, +50 mỗi 7 ngày. | `plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md` (R-middle §1) |
| 2026-08-26/27 | `ccf8ed091`, `6cce97ab3`, `7dc95a26c`..`c30261fac` | `docs/doc-registry.md`; `docRegistry.enforce` bật; tsk-5mh dời 332 tài liệu vào `docs/knowledge/`, các gốc quadrant cũ không bị xoá. | R-middle §3.4 |
| 2026-08-31 | `ba7b62ace` | `docs/architect/agent-coordination/` có cấu trúc con; tới 09-12 chứa 905 file. | R-middle §1, §2 |
| 2026-09-14 | `679585957` | Commit đầu tiên dưới `docs/platform/`. | R-middle §1 |
| 2026-09-15 03:13 | `23fb220e3` | Một commit "chore" thêm `docs/doc-governance.md` (Implementation: Partial), `docs/reading-map.md`, `docs/platform/README.md`. | R-middle §1; R-trigger §1.2 |
| 2026-09-18 | `e1307d33f` | Commit tên "fix(dispatch)..." thêm 943 file vào `docs/platform/agent-coordination/`, 0 rename, 0 xoá bản gốc. | R-middle §1, §3.6 |
| 2026-09-19 | `81437ffff` | 935 đường dẫn tương đối có ở cả hai cây; 868 giống hệt, 67 khác nhau. Lúc chép (`e1307d33f`) chỉ 6 trong 935 khác. | R-middle §2; writer check 2026-11-05 (so blob id theo đường dẫn tương đối); round 3 m3 |
| 2026-09-20 | proposal | Proposal "documentation-system-unification" ghi `Last reviewed: 2026-09-20`. Phiên chat gốc: **UNVERIFIED** (không có trong repo). | R-trigger §1.1 |
| 2026-09-21 23:23 | `ca854f443` | Proposal được commit lần đầu trong một commit tên "refactor coordination action legality and test fixtures". | R-trigger §1.1 |
| 2026-09-25 | `cfdaf4bc9` | Ba bản luật nền (16.398 B, 33.845 B, 3.341 B); hai reading map. | R-middle §2 |
| 2026-09-25 | review files tại TAG | Hai review độc lập của bản nháp plan (Opus, rồi Gemini trên bản đã sửa): "PROCEED WITH REQUIRED CHANGES, for Phase 00 only". Opus yêu cầu Phase 00 kiểm kê trạng thái thẩm quyền trước; Gemini nêu năm phát hiện (H1, H2, M1, M2, L1). | R-trigger §1.4; fact-check #32, #34 |
| 2026-09-25 13:57 | `a725d4788` | Truth reset trả lời yêu cầu đó: authority map (snapshot `ac19f6d1e`), hai review và `plan.md` (724 dòng, "Phase 00 authorized and completed") commit cùng nhau trên nhánh plan. Đây là lần đầu `plan.md` xuất hiện. | R-trigger §1.4; fact-check #32, #35; writer check 2026-11-05 |
| 2026-09-26 22:43 | `2085d88fe` | Bản 704 dòng "Proposed — not authorized for execution" được commit lên main; `a725d4788` không phải tổ tiên của nó. | R-trigger §2; fact-check #35; writer check 2026-11-05 |
| 2026-09-26 | tag `documentation-authority-phase-01-20260926`, `-phase-02-` | Phase 2 và Phase 3 (số mới) đóng; inventory 4.305 file, 85.772 claim unit. | R-built §1; R-cost §2 |
| 2026-09-29 18:51 | `4d80eaf29` | Plan đổi sang định dạng AgentKit: `plan.md` trên nhánh từ 800 rút còn 454 dòng, mười file phase, đánh số lại từ 1. | R-trigger §2; fact-check #40; writer check 2026-11-05 |
| 2026-09-30 đến 10-05 | (không commit) | Tạm dừng. | R-cost §2; fact-check #41 |
| 2026-10-06 | `b9fee1e56`, `6b8ef0e8d`, `73142f7d6`, `3c5080b06` | Resume: merge main (main đi trước 400 commit); generator inventory hết bộ nhớ (exit 134, 137); Phase 4 đóng cùng ngày. | R-trigger §2; R-built §2 |
| 2026-10-06 15:30 | TI L2097 | Owner hỏi: plan "đã dừng khá lâu để đợi cơ chế harness ổn định và quay lại", đợi lâu vậy có nên không. | TI L2097 (08:30:10Z) |
| 2026-10-06 16:49 | TI L2428 | Owner: plan chạy ở phiên chat khác; "ở đây chúng ta chỉ hoàn thiện plan và ý định cho nó, không chạy nhé". | TI L2428 (09:49:04Z) |
| 2026-10-07 | `TAG:P/reports/phase-05/pilot-method-defects.md` | Phase 5 pilot: vòng đầu "Not PASS" (E6 14/20, E7 15,6%); owner phán METHOD-MUST-CHANGE; sau một vòng sửa E6 đạt 19/20, E7 đạt theo tiêu chí định nghĩa lại; PASS-WITH-AMENDMENTS (owner). 16 nhóm drop thật bị audit cũ bỏ sót. | pilot-method-defects §3, §5, §6; R-built §2; fact-check #50 |
| 2026-10-07 22:03 | T5 L2573 | Owner: "chỉ là viết tài liệu thôi mà sao build tool cho phase 2 mà làm cả buổi chiều mà chưa xong. quy mô tool ghê vậy?" (lần 1/9). | T5 L2573 (15:03:52Z) |
| 2026-10-07 22:06 | `a7ec5054a` | A5 (owner-decided): tooling di trú là "single-use", đóng băng ở `1ec3ceca6`, thu hẹp review. | OA6:35-36; `a7ec5054a` |
| 2026-10-07 22:14 | T5 L2674 | Lead báo bản nháp bộ kiểm lâu dài: "Khoảng 7.100 dòng script di trú, cộng khoảng 6.200 dòng dữ liệu ratchet, sẽ bỏ sau cutover"; thay bằng "một module `doc-health` khoảng 400–500 dòng". | T5 L2674 (15:14:56Z) |
| 2026-10-10 17:29 / 17:44 | T5 L4124, L4129 | Bảng tiến độ Phase 6: Agent Coordination 17.034 dòng (867 file), hai khu kế 431 và 402. Owner: "1 component nhưng 867 files, vấn đề quá rõ." | T5 L4124 (10:29:43Z), L4129 (10:44:33Z) |
| 2026-10-09 | A12 | Dừng vì hết quota trong Phase 6. | R-cost §4.1 |
| 2026-10-11 13:55 | A28 | Owner: "tài liệu thôi mà sao kì công vậy ta, làm 3 ngày rồi chưa xong" (lần 2/9). A28 bỏ check ngược T6=0, thay bằng mẫu 30 unit. | T5 L5882 (06:55:16Z); R-cost §4.3; memory `feedback_flag_verification_cost_early.md` |
| 2026-10-13 10:08 | T5 L7150 | Owner: "tiến độ lâu quá em" (lần 3/9). | T5 L7150 (03:08:01Z) |
| 2026-10-14 10:33 | TL L1631 | Owner: "quá lâu, chúng ta làm tới đâu rồi" (lần 4/9). | TL L1631 (03:33:25Z) |
| 2026-10-14 17:32 | TL L2797 | Lần đầu owner gõ "báo cáo tiến độ"; tới 5/11 có ít nhất 33 lượt owner bắt đầu bằng "báo cáo". | TL L2797 (10:32:52Z); đếm bằng script trên TL |
| 2026-10-15 | A40, A41 | Mẫu đúng-sai: specs-ui 4/30 câu sai (13,3%), runner 8/30 (26,7%); owner cho sửa mọi câu sai đã biết. | OA6:216, 222 |
| 2026-10-17 | A44 | Phase 6 đóng (owner). | R-cost §2 |
| 2026-10-19 | A48, A49 | Phase 7 đóng; Phase 8 được duyệt. | R-cost §2 |
| 2026-10-19 | A50, A51 | A50 (owner): gói per-edge 338 phần bị "superseded, not reviewed", review chuyển xuống mức ánh xạ. A51 (owner, "đồng ý phương án 2"): Phán đoán ngữ nghĩa không hội tụ qua bảy lần sinh lại; mẫu cuối (step-02j) trượt 106/1.275 = 8,3%. Cổng Step 2 đổi thành kiểm kê cơ học; patch viết và review theo từng file tiêu thụ ở Step 3, L12-21..26 là quy tắc viết patch. | `TAG:P/reports/phase-08/owner-answers.md:193-197, 280-286`; fact-check #57 |
| 2026-10-20 | phase-11 brief | Owner yêu cầu chuỗi bài hồi cứu. | `TAG:P/phase-11-retrospective-post-series.md` |
| 2026-10-20 11:12 | TL L26868 | Owner: "project này lâu quá, mấy tuần rồi chưa xong luôn" (lần 5/9). | TL L26868 (04:12:06Z) |
| 2026-10-21 16:07 / 16:09 | TL L37706; L12-89 | Owner hỏi: "bộ quy định, ràng buộc để docs không sinh bậy cũng được land trong phase 9?"; L12-89 (Owner, 16:09) đưa ba guard vào cutover thay ratchet, vì khoảng hở giữa lúc bỏ ratchet và Phase 10 "would recreate split authority". | TL L37706 (09:07:37Z); OA8:1285-1291 |
| 2026-10-22 16:45 | memory | SSD QLC bão hoà: ghi 765 ms (nguyên nhân chủ yếu ở lane khác). | R-cost §1 |
| 2026-10-23 | L12-136 | Phase 8 đóng, 12 cổng PRE-FLIP chuyển sang Phase 9. | R-built §2; R-cost §2 |
| khoảng 2026-10-27 | memory | Partial đang đỏ của Doer bị merge vào nhánh plan, làm đỏ mọi lần chạy proof. | R-cost §4.6 |
| 2026-10-29 11:14 | memory | Owner: "làm lâu quá. Cả 5 tuần rồi." (lần 6/9) | R-cost §4.7; memory `feedback_doc_plan_parallelize_for_speed.md`; TL L67528 (04:14:03Z) |
| 2026-10-30 | memory | Doer sửa bản oracle của mình 8 lần; 5 lần nới lỏng check hoặc thay bằng dữ liệu của chính tác giả. | R-cost §4.5; memory `feedback_author_never_edits_acceptance_tool.md` |
| 2026-10-31 17:55 | TL L74788; `e96261471` | Lead đóng băng công cụ lần hai, ghim tại `e96261471` (commit 15:30): "Từ giờ tới Land không siết thêm luật nào." | TL L74788 (10:55:19Z); round 3 m4 |
| 2026-10-31 17:54 / 17:55 | TL L74780, L74788 | Owner: "có vẻ không có tiến độ nhỉ" (lần 7/9). Lead: số lỗi scanner 43, 499, 467, 219; cú nhảy do Lead siết công cụ (L13-91..95); "Mỗi lần siết công cụ thì số đo lại bắt đầu từ đầu"; "em đã để tiêu chuẩn nghiệm thu thay đổi liên tục trong khi tác giả vẫn đang sửa". | TL L74780 (10:54:56Z), L74788 (10:55:19Z) |
| 2026-11-01 20:56 | TL L82549 | Owner: "chẳng hiểu từ 29/10 lên 1/11 giờ 3/11" (lần 8/9). | TL L82549 (13:56:42Z) |
| 2026-11-02 10:57 | TL L84830, L84838 | Owner: "thông minh hơn đi. làm tài liệu có phải viết code gì phức tạp mà 6 tuần rồi" (lần 9/9). Lead: "Phần tài liệu thật ra không khó; cái làm chậm là bộ máy chứng minh mà em dựng quanh nó"; "Hôm nay sửa 119 link chết mất trọn một ngày". | TL L84830 (03:57:15Z), L84838 (03:57:39Z) |
| 2026-11-03 10:22 | TL L84844; `ee695a632` | Owner chọn "Land gọn (Recommended)": chỉ kiểm tra sản phẩm chặn Land, sổ sách plan sang sau. Ghi thành L13-152 ("owner, 2026-11-03 10:20"). | TL L84844 (03:22:06Z); `ee695a632` 10:22:34 |
| 2026-11-03 11:35 | TL L85139 | Auditor độc lập trả REWORK cho cổng gọn: `sameLinesTwice` cũng báo hai patch sửa đè cùng dòng (xung đột bytes sản phẩm), không được hạ xuống "ghi lại sau Land". | TL L85139 (04:35:12Z) |
| 2026-11-03 14:14 | TL L85763, L85790; `c8b02bd67` | Owner: "tưởng sáng cho quyền rồi. anh thấy cả 2 tiến trình đều ngồi đợi". Lead: "Lẽ ra em nên hỏi gộp ngay lúc đó: gate qua thì Land luôn"; quyền Land ghi thành L13-155. | TL L85763 (07:14:25Z), L85790 (07:14:52Z); `c8b02bd67` 14:14:37 |
| 2026-11-03 22:07 (commit) / 23:41 (reflog main) / 23:50 (board log) | `97dd62aa7` | Cutover nguyên tử: 1.677 file, +182.794 / -239.220. | R-built §2; writer check 2026-11-05 |
| 2026-11-04 10:08 | TL L87031 | Lead đã hỏi chỗ lưu bằng chứng ngoài máy (câu hỏi A) và đề xuất các việc 1-4 (gồm các bản ghi sau Land). Owner viết: "làm 1,2,3,4 và 2B. Nếu ổn thì anh không cần giữ dữ liệu đâu. Ổ cứng 500GB sao chỉ còn 19GB, dọn được không". Owner không chọn phương án nào cho câu A; hiểu "dữ liệu" là evidence là cách đọc của Lead. | TL L87026 (03:04:21Z), L87031 (03:08:41Z); round 3 O4 |
| 2026-11-04 10:17 | TL L87304 | Lead dừng các bản ghi sau Land mà owner vừa duyệt, viện dẫn câu trên (L13-159): "Anh đã nói không cần giữ dữ liệu, nên em không làm tiếp". | TL L87304 (03:17:36Z) |
| 2026-11-04 | `b37aea82c` | Phase 10 viết lại thành "không verb mới, không checker song song". | R-built §2 |
| 2026-11-04 10:49 | `159971615` | Gỡ công cụ di trú: `scripts/` +57 / -7.426 dòng, xoá 22 file test. `scripts/doc-health.mjs` hôm nay 214 dòng. | numstat; `wc -l`; writer check 2026-11-05 |
| 2026-11-04 12:56 | `97cc4b432` | Phase 10 land (đỉnh fast-forward); công việc là `46310f968..00c64d5a5`. | Lead check 2026-11-05; writer check 2026-11-05 |
| 2026-11-04 15:46 | `ad72e3a46` (merge), `c7a354e1d` | Gỡ write lease: 39 file, +182 / -2.734. | Lead check 2026-11-05; R-built §1 |

## 2. Chuỗi nhân quả

| # | Mắt xích | Bằng chứng |
|---|---|---|
| 1 | Ngày 07-14, luật nền có hai bản (`docs/platform-foundations.md`, `docs/specs/platform-foundations.md`); contract và architecture map đặt ở gốc `docs/`. Ngay từ đầu đã có ít nhất ba chỗ có thể sở hữu một claim, và không có dấu nào chỉ ra chỗ nào có thẩm quyền. | `e9ff70db7`, `ad65f59fd`, `06df4970f`, `2d60303ef`; R-middle §3.1 |
| 2 | Repo divorce đẩy history, plan và report ra workshop trong hai tuần; bằng chứng cho F4 nằm ngoài repo. | `e99998633`, `2bbd8f70f`, `15ddd61e8`; R-genesis §3.3 |
| 3 | Kho tri thức đổi chỗ ít nhất bốn lần trong sáu tuần (`docs/history/learnings`, event `.fgos`, quadrant Diataxis, `docs/knowledge/`). | `823926cc7`, `0228c4034`, `cf27ae0b3`, `d889032c0`; R-genesis §3.4 |
| 4 | Mỗi work item ghi evidence vào cùng cây `docs/`, skill tự sinh thêm tài liệu; "viết mới hay viết thêm" chỉ do `fs.existsSync` quyết định. `docs/` tăng 365 lên 4.301 file trong 8 tuần, `specs/` vẫn 11 đến 13 file. | R-middle §2, §3.2; report 2026-08-25 |
| 5 | Dời ADR vào specs: guard citation drift đã có từ 27/7 (`41af242e7`, `510abb006`) nhưng lần dời vẫn để lại tham chiếu chết; 59 phút sau `4270c0c0d` phải cập nhật baseline của guard và sửa sweep. | `4722361ae`, `4270c0c0d`; R-middle §3.3; fact-check #17, #18 |
| 6 | Hai registry tài liệu end-user trong một tuần; gốc cũ không xoá; 332 tài liệu đều `provisional`, số topic bằng số tài liệu. | `ccf8ed091`, `6cce97ab3`, tsk-5mh; R-middle §3.4 |
| 7 | Cây `docs/architect/agent-coordination` phình thành nơi chứa payload (905 file tới 09-12). | `ba7b62ace`; R-middle §3.5 |
| 8 | Cây đích `docs/platform/` được tạo bằng cách chép chứ không dời: 943 file ở `e1307d33f`, 67 bản tách nhánh. Governance ghi "Implementation: Partial". Ý định của người chép: **UNVERIFIED**. | `23fb220e3`, `e1307d33f`; R-middle §3.6 |
| 9 | Di trú từng khu, nên thẩm quyền chia ba: 3 promoted, 3 candidate, 12 legacy-current; portal promoted vẫn trỏ ngược về `docs/architect/**`. | R-middle §3.7; current-authority-map 2026-09-25 |
| 10 | Bên tiêu thụ luôn được nạp (AGENTS.md, `core/instructions`, skill) không đổi sang switchboard: AGENTS.md vẫn trỏ `docs/specs/*`. | `cfdaf4bc9:AGENTS.md`; R-middle §3.8 |
| 11 | Bản sao skill nhân lên qua các render target (`.agents/skills`, `.claude/skills`, `plugins/fgOS`), có bản bị sửa tay. | `07c4a5205`, `e859e71d6`; R-middle §3.9 |
| 12 | Kết quả: proposal 09-20 yêu cầu bỏ hẳn cây legacy; review bản nháp plan ngày 09-25 phát hiện "three authority rules are live at the same time and disagree"; truth reset và plan được commit trên nhánh (`a725d4788`), rồi lên main (`2085d88fe`). | `ca854f443`, `a725d4788`, `2085d88fe`; R-trigger §1.3, §1.4; fact-check #32, #35 |

## 3. Bảng chi phí

| Chỉ số | Giá trị | Nguồn |
|---|---|---|
| Lịch, từ commit đầu tới landing | 2026-09-25 đến 2026-11-03: 40 ngày (khoảng 5,7 tuần) | R-cost §1 |
| Lịch, tới hết Phase 10 | 41 ngày (2026-11-04) | R-cost §1; Lead check 2026-11-05 |
| Commit trên nhánh plan | 2.143 (09: 59; 10: 1.858; 11: 226) | R-cost §1 |
| Ngày đỉnh | 10-25: 146; 10-27: 139; 11-01: 135; 10-07: 134 | R-cost §1 |
| File trong cây plan tại TAG | 11.669 (11.423 dưới `reports/`) | R-cost §1 |
| Dung lượng cây plan | 7.508.112.807 byte (khoảng 7,5 GB thập phân) | R-cost §1 |
| Blob lớn nhất | `phase-09/fchain/g7-r6-rebind-batch.json` 457 MB; 9 blob trên 100 MB | R-cost §1 |
| Bản nén evidence | 575,4 MiB (`.tar.zst`) | R-cost §1 |
| File review per-unit | 1.647 `review-*.md` | R-cost §1 |
| Tỉ lệ rework trên toàn bộ review per-unit | **Chưa đo được**: verdict nằm theo dòng bảng, chưa parse (con số 19/10/7/2 trước đây không tái lập được, đã bỏ) | R-cost §6; fact-check #77 |
| Tỉ lệ rework mẫu | Phase 6 sớm 1,8%; Phase 8 step-02j 106/1.275 = 8,3% | R-cost §1 |
| Quyết định có số | A1..A51 (51), L10 42, L11 28, L12 137, L13 110 trong file (L13-156 trong board log); tổng **ít nhất 368** (cận dưới). 33 mã A là owner-decided hoặc owner-directed (A5, A10, A15-17, A19-21, A26, A28-51); A11 không ghi người quyết; 17 mã Lead-decided | R-cost §3; fact-check #73, #74 |
| Dòng board log của lane DOC | 180 trên 1.381 | R-cost §1 |
| Lượt owner bắt đầu bằng "báo cáo…" | **ít nhất 33** (14/10 tới 5/11; 29 trước khi Land lúc 3/11 23:41; chỉ đếm TL) | TL L2797..L89158; mục 6; round 3 m5 |
| Lần owner nhắc tốc độ hoặc độ phức tạp | **ít nhất 9** trong 27 ngày (7/10 tới 2/11, tính cả hai đầu) | mục 6 |
| Số lượt Doer / reviewer gắn riêng cho plan | **UNVERIFIED** (2.249 assignment trên cả máy, không tách được) | R-cost §1, §6 |
| Giờ công, token, chi phí model | **Không đo** | R-cost §6 |
| Bị bỏ / xoá | Gói per-edge A36 (338 part, A50); check T6=0; write lease (thiết kế Phase 4, dựng Phase 8, xoá 11-04) | R-cost §4.10; Lead check 2026-11-05 |
| Phần code dọn đi ở Phase 10 và sau đó | `159971615`: -7.426 dòng script, xoá 22 file test (xoá 35 file; -13.856 dòng cả commit); lease: -2.734 dòng trên 39 file | fact-check #93; writer check 2026-11-05; `c7a354e1d` |

## 4. Trạng thái mở tại 2026-11-05

| Mục | Bằng chứng |
|---|---|
| DOCOS: "not-planned", chưa có plan | `plans/261017-1313-fgos-platform-program-board/plan.md:80`; R-built §4 |
| doc-health chỉ chạy trong `npm test`, không ở pre-commit, không có doctor row | `docs/platform/convention/spec.md:382`; R-built §4 |
| Evidence chỉ có ở máy owner (tag local + một tar). Trên main chỉ còn bản ghi digest của sealed ledger (68.441 dòng, ghim `2a028cdc9`) và 28 file trong thư mục plan (27 lúc cutover). Ngày 4/11 owner viết "Nếu ổn thì anh không cần giữ dữ liệu đâu", và Lead **hiểu** câu đó là không cần bản sao ngoài máy (cách đọc của Lead; owner chưa chọn phương án cho câu hỏi A). `plan.md` trên main dòng 280 ghi L13-159 và nơi evidence nằm, không ghi quyết định chấp nhận nào | Lead check 2026-11-05; R-built §4; fact-check #89, #96; TL L87031, L87304; writer check 2026-11-05 |
| `plan.md` ở main lệch trạng thái lúc viết (đã sửa trong `36737e5d6`): frontmatter `status: in-progress`, H1 "active migration plan", dòng 15 vẫn ghi việc gỡ lease "follows as its own item", Phase 11 "pending" | writer check 2026-11-05 (`plans/260925-documentation-authority-unification/plan.md` dòng 4, 12, 15, 262) |
| Guard Phase 9 không có hiệu lực qua host đã cài lúc landing (gap G1); release `47e1016d` sau đó chưa được kiểm lại | R-built §2 (UNVERIFIED cho release sau) |

## 5. Những gì đã bỏ vì thiếu nguồn

- Nguyên nhân `.agents/skills` và `plugins` nhảy số giữa 08-15 và 08-22 (R-middle §4.1).
- ~~Bản sao 67 file tách nhánh trước hay sau lần chép 09-18 (R-middle §4.2).~~ Đã kiểm ngày 2026-11-05: 6 khác lúc chép, 67 một ngày sau (round 3 m3).
- Ai quyết định chép thay vì dời ở `e1307d33f` (R-middle §4.6): chỉ nêu là chưa rõ.
- "Bản viết lại plan 10-06": không tìm thấy commit; chỉ dùng `4d80eaf29` (09-29) và resume 10-06 (R-trigger §2).
- Số liệu "479 docs/topics: 147 active, 332 provisional" của plan: re-review đánh dấu có thể sai, không dùng (R-trigger §3).
- Vòng F5 "self-improving" có được dựng hay không (R-genesis §2.3).
- Phiên chat gốc sinh ra proposal 09-20 (R-trigger §4.1).
- Số lần chạy lại cổng do SSD bão hoà (R-cost §4.8).
- Cách xử lý cuối cùng của 247 finding Phase 8 (`phase-08/owner-answers.md:2821`): chỉ nêu là chưa truy được. (E6/E7 của Phase 5 đã truy được, xem dòng 2026-10-07.)
- Bảng đếm verdict 19/10/7/2 trên 193 file và câu "khoảng 3 ngày làm việc thực" cho Phase 1 tới 5: bỏ theo fact-check #77, #65.
- Bài 6 (bản đầu) ghi "Owner cần chọn: chấp nhận rủi ro này, hoặc có thêm một bản sao thứ hai"; bản thứ hai ghi "owner đã chấp nhận". Cả hai đều chưa đúng: owner viết một câu mơ hồ ngày 4/11 (TL L87031), và việc coi nó là chấp nhận rủi ro là cách đọc của Lead (round 3 O4). Bài 6 giờ nói đúng như vậy.
- "Đừng phức tạp quá" (7/10 11:32, T5 L1971) không phải lời nhắc về tốc độ: câu đầy đủ là chỉ dẫn chọn công cụ trước khi làm. Đã bỏ khỏi danh sách chín lần nhắc, thay bằng T5 L7150 (13/10) (round 3 W1).
- "Gần 12 tiếng sau, commit cutover lên main": **sai**; commit được tạo sau 11 giờ 45 phút, nhưng lên main lúc 23:41, khoảng 13 giờ sau (round 3 W2).
- "Cả hai tiến trình ngồi đợi thêm gần bốn tiếng": **sai**; Lead trả lời cùng lúc "Hai bên không ngồi đợi suông" (TL L85790) (round 3 W3).
- "Thứ khởi động [plan] là một review": phóng đại; review đọc một bản nháp đã có, nó làm plan cấp bách chứ không khởi động plan (round 3 O1).
- "doc-health 214 dòng, nhỏ hơn mức 400–500 dòng dự đoán": so sánh hai phạm vi khác nhau; đã thay bằng câu của reviewer (round 3 O2).
- "Mỗi lần một khúc được cắt … chỉ lần thứ chín đổi được chính cái cổng": phóng đại; đã thay (round 3 O3).
- Ứng viên lời nhắc chưa tính: TL L60292 (27/10, "có vẻ không làm việc à") và T5 L3156 (8/10, về agent khác). Vì vậy con số chín vẫn là "ít nhất".
- "Ổ trống từ 15 GB lên 201 GB" sau khi dọn (TL L87304): chỉ là báo cáo của Lead, chưa đo lại; không dùng.
- "Mốc đã lùi ba lần" (Lead, TL L82557): owner chỉ nêu ba mốc (hai lần lùi); bài dùng ngày, không dùng "ba lần".
- Bản tar có còn giữ sau câu "không cần giữ dữ liệu" hay không: `plan.md:280` trên main vẫn ghi `.doc-work/plan-260925-evidence-84bbfa7b8.tar.zst`, nhưng chưa kiểm trên đĩa. Bài 6 chỉ trích lời owner.
- "Câu hỏi chờ khoảng 23,5 giờ": đo từ câu của owner (2/11 10:57) tới câu trả lời (3/11 10:22); Lead đặt câu hỏi sau đó (lần đầu bị hook chặn, TL L84840), nên bài chỉ ghi "gần một ngày".
- Câu cũ của bài 4 "Lead đã không báo chi phí kiểm chứng sớm, mà để owner phải tự hỏi" như thể 11/10 là lần đầu: owner đã hỏi lần đầu ngày 7/10 và A5 đã trả lời (OA6:35). Đã sửa: 11/10 là lần thứ hai.

### Cắt khỏi bài vì độ dài ngày 2026-11-05 (vẫn đúng; nguồn ở mục 1 tới 4 hoặc trong research)

Lượt sửa thứ hai (theo bài đọc của người ngoài) đưa hầu hết mã quyết định và hash commit từ thân bài xuống phần Nguồn của từng bài; không claim nào bị bỏ vì việc đó. Thêm: bảng mười phase của bài 4 thành một đoạn văn (bỏ cột "làm gì" của Phase 7 và chi tiết từng phase); các bảng thời gian, khối lượng, dung lượng, quyết định của bài 5 thành văn xuôi (số chi tiết ở Nguồn bài 5 và mục 3); mục "đã đạt" và "bài học" của bài 6 rút gọn (phần còn lại ở mục 7).

- Bài 1: ba trường phái bee / harness / marketing-cockpit và khuyến nghị; luật L1 và L6; danh sách file phẳng ở gốc `docs/` (R-genesis §2.1, §2.2, §3).
- Bài 2: số 137 / 20 / 6 file quadrant; kích thước từng reading map; danh sách năm mắt xích (giữ ở mục 2).
- Bài 3: giới hạn shell của review Opus; danh sách H1/H2/M1/M2 (chỉ giữ H1, M2); trích header `plan.md` trên main; công thức "one platform claim → …"; câu quyết định 12; plan knowledge-registry bị hạ cấp; báo cáo tư vấn 29/9 (`capability: code:*`); câu tự sửa của bản tổng hợp; chi tiết OOM (giữ ở bài 5) và 4.305 → 4.311 / 85.772 → 86.085.
- Bài 4: đoạn "logic của phương pháp" và `gateway.rs`; Pilot B; M-05, M-09 (fact-check #48); số đóng Phase 6 (160/160, 114/114, 9.236 alias, 68.441 dòng) và câu "author-written audit"; quota 9/10, partial đỏ, SSD, 29/10 và write lease (giữ ở bài 5, 6).
- Bài 5: vết môi trường Phase 8 (worktree 0/7, ledger 1/8, observe 0/2; 9.330 / 8.833 / 399 / 1 tại `e1966d417`); hai mốc giờ landing 22:07 / 23:50 (giữ ở mục 1); blob 217 và 216 MB; A11 không ghi người quyết và 17 mã Lead-decided; 180 / 1.381 dòng board log (giữ ở mục 3).
- Bài 6: chi tiết 166 / 446 / 122 file, 908 / 6 file xoá; `.githooks/reference-transaction`; Provenance của reading map; PF-I024 chi tiết (18 giá trị, 60 tài liệu); 26 header, 166 đường dẫn của Phase 10; release `47e1016d` (gọi là "release sau đó"); mục "`plan.md` từng lỗi thời" (đã sửa ở `36737e5d6`, giữ ở mục 4); mục "Giới hạn phương pháp" (247 finding giữ ở bài 5; biên nhận audit Phase 6 do tác giả viết); bài học 11 cũ.

## 6. Bổ sung 11-05: transcript và các dòng owner-answers mới dùng

Mọi dòng dưới đây đã được người viết đọc lại ngày 2026-11-05 (chỉ text của đúng dòng đó).

| Bài | Claim | Nguồn |
|---|---|---|
| 1, 6 | Câu mở: "thông minh hơn đi. làm tài liệu có phải viết code gì phức tạp mà 6 tuần rồi" (2/11 10:57 +07); "6 tuần" là chữ của owner, 25/9 tới 2/11 là 39 ngày | TL L84830, 2026-11-02T03:57:15Z |
| 2 | Bảng Phase 6: Agent Coordination 17.034 dòng (867 file), Host-invocation-routing 431, Packaging-distribution 402; owner: "nhìn bảng tổng kết mới thấy cơ chế viết tài liệu của chúng ta có vấn đề. 1 component nhưng 867 files, vấn đề quá rõ." | T5 L4124 (Lead, 2026-10-10T10:29:43Z), L4129 (owner, 10:44:33Z) |
| 3 | Lý do tạm dừng 30/9 tới 5/10, theo lời owner hỏi lại: "đã dừng khá lâu để đợi cơ chế harness ổn định và quay lại" | TI L2097, 2026-10-06T08:30:10Z |
| 3 | "ở đây chúng ta chỉ hoàn thiện plan và ý định cho nó, không chạy nhé" | TI L2428, 2026-10-06T09:49:04Z |
| 4 | Câu hỏi ngày 13 và dự đoán 7.100 dòng / doc-health 400–500 dòng, chưa tới 15 phút sau | T5 L2573 (15:03:52Z), L2674 (15:14:56Z) |
| 4, 6 | Kết cục: `159971615` (4/11 10:49) `scripts/` +57 / -7.426. `scripts/doc-health.mjs` hôm nay 214 dòng cho ba luật (link, metadata, đường dẫn chết), dùng chung khoảng 200 dòng helper (`scripts/lib/doc-links.mjs` 126, `scripts/list-doc-anchors.mjs` 82); bản nháp 7/10 dự đoán 400–500 dòng cho sáu kiểm, ba kiểm (đường dẫn đã retire, claim hai chủ, tài liệu sinh lỗi thời) chưa làm | `git show --numstat 159971615 -- scripts/`; `wc -l`; T5 L2674; round 3 O2 |
| 4 | A5 là lần trả lời đầu (7/10): "The migration tooling is single-use"; "Tooling is frozen as it is at `1ec3ceca6`" | OA6:35-36; `a7ec5054a` 2026-10-07 22:06 |
| 4, 6 | A40, A41: 4/30 (13,3%) và 8/30 (26,7%) câu sai so với hiện trạng | OA6:216, 222 |
| 4, 6 | Lead dời thước đo; đóng băng công cụ lần hai ở `e96261471` | TL L74788, 2026-10-31T10:55:19Z |
| 4 | Chín lần nhắc (cận dưới, chỉ transcript cấp cao nhất), trong 27 ngày (7/10 tới 2/11, tính cả hai đầu): 7/10 22:03, 11/10 13:55, 13/10 10:08, 14/10 10:33, 20/10 11:12, 29/10 11:14, 31/10 17:54, 1/11 20:56, 2/11 10:57 | T5 L2573, L5882, L7150; TL L1631, L26868, L67528, L74780, L82549, L84830; round 3 W1 |
| 5 | Ít nhất 33 lượt owner bắt đầu bằng "báo cáo…" (14/10 17:32 tới 5/11 09:34), 29 trước khi Land | TL, đếm lại bằng script ngày 2026-11-05: L2797 (10:32:52Z) … L89158 (2026-11-05T02:34:35Z) |
| 6 | Mốc land 29/10 → 1/11 → 3/11 do owner nêu | TL L82549 |
| 6 | Lead: "Phần tài liệu thật ra không khó; cái làm chậm là bộ máy chứng minh mà em dựng quanh nó"; "Hôm nay sửa 119 link chết mất trọn một ngày" | TL L84838, 2026-11-02T03:57:39Z |
| 6 | Ba lựa chọn (phạm vi câu hỏi giữ lại quyền Land: "Không: tự Land, push main…") và câu trả lời "Land gọn (Recommended)" lúc 10:22; L13-152 | TL L84842, L84844 (2026-11-03T03:22:06Z); `ee695a632` 10:22:34 |
| 6 | Cutover lên main 23:41:14 +07, khoảng 13 giờ sau khi chọn Land gọn; commit tạo 22:07:32 | `git reflog show --date=iso main`; round 3 W2 |
| 6 | Auditor REWORK cổng gọn (`sameLinesTwice` gồm cả xung đột bytes) | TL L85139, 2026-11-03T04:35:12Z |
| 6 | "tưởng sáng cho quyền rồi…"; "Lẽ ra em nên hỏi gộp ngay lúc đó: gate qua thì Land luôn"; L13-155. Cùng tin nhắn đó Lead viết "Hai bên không ngồi đợi suông" | TL L85763 (07:14:25Z), L85790 (07:14:52Z); `c8b02bd67` 14:14:37; round 3 W3 |
| 6 | Câu hỏi guard của owner (21/10) và lý do của L12-89 | TL L37706 (2026-10-21T09:07:37Z); OA8:1285-1291 |
| 6 | Sáng 4/11, Lead hỏi chỗ lưu bằng chứng ngoài máy; owner duyệt các việc 1-4 (gồm các bản ghi sau Land) và viết thêm: "Nếu ổn thì anh không cần giữ dữ liệu đâu". Lead hiểu câu đó là không cần bản sao ngoài máy, và cũng dựa vào nó để dừng phần sổ sách sau Land (L13-159). Không có quyết định chấp nhận rủi ro nào trong decision log của plan; `plan.md:280` trên main chỉ ghi nơi evidence nằm | TL L87026, L87031 (2026-11-04T03:08:41Z), L87304 (03:17:36Z); writer check 2026-11-05; round 3 O4 |
| 2 | Lúc chép, 6 trong 935 file chung đường dẫn khác nhau; một ngày sau 67 | so blob id theo đường dẫn tương đối tại `e1307d33f` và `81437ffff`; writer check 2026-11-05; round 3 m3 |

## 7. Bài học khác và kết quả khác (chuyển từ bài 6, 2026-11-05)

Bài 6 giữ 3 kết quả và 5 bài học. Phần dưới đây là phần còn lại, nội dung không đổi so với bản trước.

### Kết quả khác

- **Luật đường dẫn ở một chỗ.** Convention chặn gốc đã retire (`packages/convention/contracts/convention.rules.v1.json:143-148`) qua pre-commit (R-built §3.4).
- **Ít bộ phận phải mang theo hơn.** `159971615` xoá 7.426 dòng script và 22 file test (fact-check #93); gỡ lease xoá 2.734 dòng trên 39 file (`c7a354e1d`).
- **Phase 10** land ở `97cc4b432` ngày 4/11, thêm `fgos convention classify` và ba luật doc-health (Lead check 2026-11-05).
- Chưa có test fresh-reader nào sau cutover (R-built §3.6).

### Bài học khác

- **Pilot phải được phép thất bại.** Pilot A tìm ra 16 nhóm drop mà audit trước bỏ sót (bài 4).
- **Review không hội tụ thì đổi đơn vị review, không chạy thêm vòng.** Phán đoán ngữ nghĩa không hội tụ qua bảy lần sinh lại; mẫu cuối (step-02j) trượt 106/1.275 = 8,3%. Nó chỉ dừng khi A51 đổi cổng (bài 4).
- **Không ai được dời thước đo giữa chừng, kể cả người giám sát.** Doer nới lỏng oracle của mình; Lead siết công cụ làm số lỗi nhảy 43 lên 499 (bài 4).
- **Dời là dời.** `e1307d33f` chép 943 file dưới tên "fix(dispatch)"; lúc chép 6 file đã khác, một ngày sau 67 (bài 2).
- **Chuyển bên đọc cùng lúc với nội dung.** `AGENTS.md` trỏ cây cũ dù switchboard có từ 15/9 (bài 2); cutover chuyển cả hai trong một commit. (Gộp vào bài học 4 của bài 6.)
- **Không merge một partial đang đỏ vào nhánh chung** (khoảng 27/10, bài 5).
- **Giàn giáo dùng một lần thì ghi ngày gỡ ngay lúc dựng** (write lease, bài 5).
