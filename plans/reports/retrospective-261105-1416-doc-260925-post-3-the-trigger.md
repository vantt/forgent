# Bài 3: Cú hích, từ một proposal thành một plan (15/9 đến 6/10)

*Chuỗi hồi cứu plan 260925, bài 3/6. Bài trước: [Tài liệu đã trôi dạt thế nào](retrospective-261105-1416-doc-260925-post-2-how-docs-drifted.md). Bài sau: [Phương pháp, và vì sao nó chậm](retrospective-261105-1416-doc-260925-post-4-the-method-and-why-slow.md).*

Nghiên cứu hồi cứu **không tìm thấy** sự cố, báo cáo hỏng hay đoạn chat nào làm cú hích cho plan 260925. Thứ làm nó cấp bách là một review của bản nháp plan, nói thẳng: "Three authority rules are live at the same time and disagree". Bản nháp đó được cắt ra từ một proposal ghi lại một cuộc thảo luận thiết kế.

## Ngày 25/9: review bác tiền đề của bản nháp

Ngày 25/9, bản nháp plan được đưa cho hai model khác nhau review độc lập. Hai review chỉ tư vấn, không quyết định.

Review thứ nhất, do Claude Opus chạy, khuyên đi tiếp nhưng chỉ cho bước đầu tiên, kèm những thay đổi bắt buộc. Phát hiện quan trọng nhất của nó không phải một lỗi trong plan, mà là tiền đề của plan sai:

> "The plan is aimed at a clean two-system repository. The live repository already has per-area authority flips, three user-doc systems, and decision history stored in `docs/specs`."

Bản nháp tưởng repo có hai hệ tài liệu, một cũ một mới, và chỉ cần chuyển từ hệ này sang hệ kia. Review cho thấy repo đang có nhiều hơn thế: thẩm quyền đã bị lật theo từng khu, có ba hệ tài liệu end-user, và lịch sử quyết định nằm trong spec. Phát hiện đầu tiên của nó chính là câu đã dẫn ở đầu bài: ba luật thẩm quyền, ở hai bản đồ đọc và một cổng vào của khu Agent Coordination, cùng có hiệu lực và nói khác nhau. Phát hiện thứ hai: "Deleting legacy platform paths needs a way to look them up afterwards, and that doesn't exist before cutover."

Khuyến nghị đầu tiên của review là: "Phase 00 must first inventory the current authority state". Trước khi dời gì, phải biết hiện tại cái gì đang là bản đúng.

Câu trả lời là "truth reset": một bản đồ thẩm quyền hiện tại theo từng khu, chỉ ghi lại, không dời hay xoá gì. Quy tắc định tuyến của nó mở đầu bằng: "Use explicit declarations, not path, date, prose quality, or a bare `Canonical:` metadata field". Một quy tắc như vậy chỉ cần viết ra khi không có cơ chế nào làm việc đó.

Review thứ hai, do Gemini chạy trên bản plan đã sửa, ghi rằng plan "incorporates critical corrections from the prior review", nhưng vẫn giữ: "migration execution remains unauthorized". Nó nêu năm phát hiện, trong đó hai điều về sau thành việc thật: phát hiện drift không có nghĩa là đã chặn được việc ghi, và sổ claim chưa có chỗ lưu bền.

Bản đồ thẩm quyền, hai review và plan được commit cùng nhau trên nhánh riêng của plan ngày 25/9, lúc 13:57.

## Trước đó: một proposal và một yêu cầu

Từ 15/9, quy định quản lý tài liệu cho phép di trú từng khu một, có con trỏ chuyển hướng: "Migrate one area at a time, with redirect/stub pointers". Bài 2 đã cho thấy cách này dẫn tới đâu.

Một proposal ghi ngày review cuối 20/9 lật lại cách làm đó. Nó được commit lần đầu đêm 21/9, trong một commit có tiêu đề về chuyện khác ("refactor coordination action legality and test fixtures"), giống lần chép ngày 18/9. Proposal tự nói nó "preserves the complete discussion so it can continue without chat history", nhưng phiên chat gốc không có trong repo, nên nguồn gốc này **chưa kiểm chứng được**. Nó nêu ý định của owner:

> "Every retained detail in `docs/specs/**` and `docs/architect/**` must be migrated to the new system. Those legacy trees must then be retired and removed; they must not remain indefinitely as compatibility or 'legacy-current' sources."

Đây là yêu cầu thật của plan: không để lại một cái split vĩnh viễn nào.

## Hai nguyên tắc, và hai bản plan

Ngày 26/9, một bản plan được commit lên main, ghi "Proposed — not authorized for execution", trong khi trên nhánh riêng, bản đang chạy đã đóng ba phase đầu. Từ đây plan có hai bản song song.

Phần sứ mệnh đòi kết thúc split "without losing any retained claim, rationale, contract, decision, proof, or preserved intent". Hai nguyên tắc định hình toàn bộ chi phí phía sau:

- **Chuyển thẩm quyền một lần**: "Completion of the authority flip is atomic for the platform-documentation system." Không có trạng thái nửa vời.
- **Bảo toàn từng claim**: đến từ phần sứ mệnh ở trên và hai quyết định khác của plan.

Hai nguyên tắc này đúng về mặt nguyên tắc. Nhưng chính chúng biến một việc "dọn tài liệu" thành việc kế toán từng claim một, như bài 4 và bài 5 sẽ cho thấy.

## 29/9 đến 6/10: đổi định dạng, dừng, rồi chạy tiếp

Ngày 29/9, plan được đổi sang định dạng mười file phase, đánh số lại từ 1. Từ 30/9 tới 5/10 không có commit nào trên nhánh plan. Ngày 6/10, owner nhắc lại lý do khi hỏi: plan "đã dừng khá lâu để đợi cơ chế harness ổn định và quay lại, nhưng liệu đợi lâu như vậy có nên hay không, hay chỉnh lại thành ak-plan và làm luôn vì nó đang giữ một đống tài liệu không chuẩn hóa". Cùng ngày, một bản tổng hợp phát hiện plan đã chạy được một phần trên nhánh riêng, trong khi bản trên main vẫn ghi "chưa duyệt".

Plan chạy lại ngay hôm đó. Main được merge vào nhánh plan, khi main đã đi trước 400 commit. Bộ sinh inventory hết bộ nhớ hai lần trước khi chạy được (bài 5), và báo cáo resume ghi 43 claim biến mất là "UNPROVEN": chưa rõ mất thật hay chỉ đổi chỗ. Owner quyết định plan chạy trong một phiên chat riêng: "ở đây chúng ta chỉ hoàn thiện plan và ý định cho nó, không chạy nhé".

## Nhìn lại

Không có cú hích dạng sự cố. Có hai tháng tích tụ, một proposal đòi "xoá hẳn cây legacy", và một review cho thấy thực tế tệ hơn tiền đề của bản nháp. Bài 4 kể phương pháp mà lựa chọn atomic và bảo toàn từng claim đòi hỏi, và lần đầu owner hỏi vì sao nó to như vậy.

## Nguồn

- Không có sự cố khởi động: R-trigger §1.1.
- Review: `TAG:P/independent-frontier-review-2026-09-25.md` (Opus: "PROCEED WITH REQUIRED CHANGES, for Phase 00 only"; C1, C2; khuyến nghị 1 ở :190), `TAG:P/independent-frontier-rereview-2026-09-25.md` (Gemini 3.1 Pro High; năm phát hiện H1, H2, M1, M2, L1). TAG = `archive/doc-260925-lineage`, P = `plans/260925-documentation-authority-unification`. C1 trỏ `docs/reading-map.md` mục 3, `docs/specs/reading-map.md:7` và portal agent-coordination.
- Truth reset: `TAG:P/current-authority-map-2026-09-25.md`, snapshot `ac19f6d1e`; R-trigger §1.4. Map, hai review và `plan.md` (724 dòng) cùng ở `a725d4788` (25/9 13:57); fact-check #32, #34, #35.
- Quy định 15/9: `23fb220e3` (`docs/doc-governance.md` mục 13); R-trigger §1.2.
- Proposal: `docs/platform/proposals/documentation-system-unification.md`, `Last reviewed: 2026-09-20`, commit lần đầu `ca854f443` (21/9 23:23, 991 dòng), đọc tại `2085d88fe^`; R-trigger §1.1.
- Plan trên main: `2085d88fe` (26/9 22:43, 704 dòng; `a725d4788` không phải tổ tiên); quyết định 5; bảo toàn từ sứ mệnh và quyết định 2, 6; R-trigger §2, §3; fact-check #35, #38.
- Đổi định dạng: `4d80eaf29` (29/9 18:51, 800 còn 454 dòng); fact-check #40. Không commit 30/9 tới 5/10: R-cost §2.
- Transcript điều tra harness `~/.claude/projects/-home-vantt-projects-forgentX/dc747f94-5283-4c29-9790-177f2aa7ee33.jsonl` dòng 2097 (owner, 2026-10-06T08:30:10Z) và 2428 (owner, 09:49:04Z).
- Bản tổng hợp: `plans/reports/harness-investigation-261006-synthesis.md` mục H6. Resume: `b9fee1e56`, `6b8ef0e8d`; `plans/reports/resume-261006-1635-doc-authority-unification.md`.
- [R-trigger](research-261105-1411-retrospective-plan-260925-trigger.md); [fact-check](review-261105-1423-doc-260925-retrospective-claims.md); [round 3](review-261105-1800-doc-260925-retrospective-claims-round3.md) O1; [evidence pack](retrospective-261105-1416-doc-260925-evidence-pack.md) §1, §6.
