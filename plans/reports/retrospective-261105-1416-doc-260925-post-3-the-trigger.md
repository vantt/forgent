# Bài 3: Cú hích, từ một proposal thành một plan (15/9 đến 6/10)

*Chuỗi hồi cứu plan 260925, bài 3/6. Bài trước: [Tài liệu đã trôi dạt thế nào](retrospective-261105-1416-doc-260925-post-2-how-docs-drifted.md). Bài sau: [Phương pháp, và vì sao nó chậm](retrospective-261105-1416-doc-260925-post-4-the-method-and-why-slow.md).*

Người ta thường nghĩ một đợt dọn dẹp lớn bắt đầu bằng một sự cố: agent đọc nhầm tài liệu, một bản build hỏng, một lần merge sai. Với plan 260925 thì không phải vậy. Nghiên cứu hồi cứu **không tìm thấy** sự cố, báo cáo hỏng hay đoạn chat nào làm cú hích (R-trigger §1.1). Cú hích là một cuộc thảo luận thiết kế, được lưu lại thành proposal, rồi một phần của proposal đó được cắt ra thành plan.

## Nền: di trú từng khu, có redirect

Ngày 15/9, `23fb220e3` thêm `docs/doc-governance.md` (458 dòng) và `docs/platform/README.md` (79 dòng). Mục 13 của governance quy định cách di trú: "Migrate one area at a time, with redirect/stub pointers" (trích lại trong review độc lập ngày 25/9, R-trigger §1.2). Vậy là từ 15/9, repo có cây `docs/platform/**` mới nằm cạnh `docs/specs/**` và `docs/architect/**`, với từng khu được promote một.

Bài 2 đã cho thấy cách này dẫn tới đâu: ba khu promoted mà vẫn giữ nguồn legacy, và lần chép 943 file ngày 18/9.

## Proposal ngày 20/9

Proposal `docs/platform/proposals/documentation-system-unification.md` ghi `Last reviewed: 2026-09-20`. Nó được commit lần đầu ở `ca854f443` (21/9 23:23), trong một commit có tiêu đề "refactor coordination action legality and test fixtures" và thêm 991 dòng (R-trigger §1.1). Giống commit 18/9, đây lại là một thay đổi lớn về tài liệu nằm lẫn trong một commit có tiêu đề về chuyện khác.

Proposal tự nói nó "preserves the complete discussion so it can continue without chat history". Phiên chat gốc không có trong repo, và prompt ban đầu cũng không. Nguồn gốc này **chưa kiểm chứng được**.

Proposal nêu vấn đề như sau (mục 1, đọc tại `2085d88fe^`):

> "An agent asked to 'write the architecture doc' must still reconstruct the workflow: classify the claim, find its owner, choose a type and path, locate a template, update related links and proof, regenerate projections, and determine which checks apply."

Và nêu ý định của owner:

> "Every retained detail in `docs/specs/**` and `docs/architect/**` must be migrated to the new system. Those legacy trees must then be retired and removed; they must not remain indefinitely as compatibility or 'legacy-current' sources."

Câu thứ hai là yêu cầu thật của plan: không để lại một cái split vĩnh viễn nào.

## Ngày 25/9: hai review, rồi truth reset, cùng một commit

Lúc đó đã có một bản nháp plan. Hai review độc lập đọc bản nháp này và chỉ đưa ra tư vấn, không quyết định. Review thứ nhất do Claude Opus chạy qua fgOS dispatch. Kết luận: "PROCEED WITH REQUIRED CHANGES, for Phase 00 only". Phát hiện quan trọng nhất của nó sửa lại chính tiền đề của plan:

> "The plan is aimed at a clean two-system repository. The live repository already has per-area authority flips, three user-doc systems, and decision history stored in `docs/specs`."

Phát hiện C1 ghi: "Three authority rules are live at the same time and disagree": `docs/reading-map.md` mục 3, `docs/specs/reading-map.md:7`, và portal agent-coordination. C2 ghi: "Deleting legacy platform paths needs a way to look them up afterwards, and that doesn't exist before cutover." Alias table (Phase 4) và sealed claim ledger (Phase 9) về sau đáp đúng nhu cầu mà C2 nêu (R-built §1); việc C2 trực tiếp dẫn tới chúng là cách đọc của người viết.

Khuyến nghị đầu tiên của review Opus là: "Phase 00 must first inventory the current authority state". Review này cũng tự nhận giới hạn: shell của nó bị chặn, nên tổ tiên của `5c948d2a4`, kết quả `fgos doctor` và số consumer đếm bằng `rg` đều "not independently verified".

"Truth reset" là câu trả lời cho khuyến nghị đó. Nó tạo `current-authority-map-2026-09-25.md`, snapshot tại `ac19f6d1e`. Map tự giới hạn: "Records current authority; does not promote, migrate, delete, or supersede any source". Quy tắc routing của nó bắt đầu bằng: "Use explicit declarations, not path, date, prose quality, or a bare `Canonical:` metadata field" (R-trigger §1.4). Một quy tắc như vậy chỉ cần viết ra khi không có cơ chế nào làm việc đó.

Re-review do Gemini 3.1 Pro High chạy trên bản plan đã sửa. Nó ghi rằng plan "incorporates critical corrections from the prior review". Kết luận: "PROCEED WITH REQUIRED CHANGES for Phase 00 only; migration execution remains unauthorized". Nó nêu năm phát hiện, gồm bốn phát hiện chính dưới đây và L1 về số tài liệu provisional/active:

- H1: phát hiện drift không phải là đóng băng ghi.
- H2: dời payload evidence có thể làm hỏng bên đọc lúc runtime.
- M1: chưa chứng minh được L5/L8 có hardcode đường dẫn bị dời hay không.
- M2: claim ledger chưa có chỗ lưu bền.

Authority map, hai review và `plan.md` (724 dòng, ghi Phase 00 "authorized and completed") được commit cùng nhau trên nhánh plan ở `a725d4788` (25/9 13:57), commit đánh dấu "complete phase 00 truth reset" (writer check 2026-11-05: `git show a725d4788:plans/260925-documentation-authority-unification/plan.md | wc -l` = 724; fact-check `review-261105-1423-doc-260925-retrospective-claims.md` #32, #35).

## Ngày 26/9: bản plan lên main

`plan.md` xuất hiện lần đầu trên nhánh plan ở `a725d4788`. Phải tới `2085d88fe` (26/9 22:43), "docs: establish documentation authority unification plan", main mới nhận một bản 704 dòng, kèm ba file review và các sửa đổi ở governance, portal, reading map, intent ledger và proposal. Commit này gồm 10 file, 1.524 dòng thêm (R-trigger §2). `a725d4788` không phải tổ tiên của `2085d88fe`, nên từ đây plan có hai bản song song: bản trên nhánh đang chạy, và bản trên main (fact-check #35). Trong khi đó trên nhánh, Phase 1 tới 3 đã đóng vào 25 và 26/9 (bài 4). Phần đầu bản trên main ghi:

> "Plan status: Proposed — not authorized for execution
> Primary objective: Collapse the competing platform-documentation authorities into one canonical system under docs/platform/**
> Risk: Critical documentation migration"

Mục tiêu được viết như một công thức: "one platform claim → one canonical owner → one explicit authority route → one maintained physical document". Plan cũng nói rõ đây "is not a cleaner-looking directory tree". Phần sứ mệnh đòi kết thúc split "without losing any retained claim, rationale, contract, decision, proof, or preserved intent" (R-trigger §3).

Hai nguyên tắc định hình toàn bộ chi phí phía sau:

- **Quyết định 5**: "Completion of the authority flip is atomic for the platform-documentation system." Không có trạng thái nửa vời.
- **Bảo toàn từng claim**: đến từ phần sứ mệnh ở trên, cùng các quyết định 2 và 6. Quyết định 12 thì hẹp hơn: "No scope reduction by omission. Deferred architecture is recorded with a revisit trigger in the intent-preservation ledger." (fact-check #38).

Hai nguyên tắc này đúng về mặt nguyên tắc. Nhưng chính chúng biến một việc "dọn tài liệu" thành việc kế toán từng claim một, như bài 4 và bài 5 sẽ cho thấy.

Cùng commit đó, plan knowledge-registry cũ (`plans/260825-1841-knowledge-registry/plan.md`) bị hạ xuống thành "historical implementation plan".

## Ngày 29/9 đến 6/10: đổi định dạng, rồi dừng, rồi chạy tiếp

- `4d80eaf29` (29/9 18:51) đổi plan sang định dạng phase-file của AgentKit: `plan.md` trên nhánh, khi đó 800 dòng, rút còn 454 dòng: một index với mười file `phase-NN`, đánh số lại từ 1. Vì vậy trong lịch sử, tag và tên artifact giữ số cũ (00 đến 09) trong khi phase file dùng số mới (R-built, phần đầu).
- Cùng tối đó, một báo cáo tư vấn (`plans/reports/advice-260929-2345-doc-authority-harness-executor-routing.md`) chẩn đoán rằng harness đang định tuyến việc tài liệu như việc code (`capability: code:*`).
- Từ 30/9 tới 5/10 không có commit nào trên nhánh plan (R-cost §2).
- Ngày 6/10, bản tổng hợp harness (`plans/reports/harness-investigation-261006-synthesis.md`, mục H6) phát hiện plan đã chạy được một phần trên nhánh riêng, trong khi `plan.md` ở main vẫn ghi "Proposed — not authorized". Bản tổng hợp tự nhận một câu sai trước đó: "Em đã nói sai ở lượt trước ('không thấy dấu hiệu phase nào chạy')" (R-trigger §2).
- Resume: main được merge vào nhánh plan (`b9fee1e56`, `6b8ef0e8d`); lúc đó main đi trước 400 commit và nhánh có 59 commit chưa lên main. Inventory sinh lại tăng từ 4.305 lên 4.311 file và từ 85.772 lên 86.085 claim unit. Generator hết bộ nhớ hai lần: exit 134 ở heap 4 GB, rồi exit 137 ở 7,5 GB sau 44 phút, vì nó đọc lại chính file JSON khoảng 250 MB do nó sinh ra. Báo cáo resume ghi 43 claim unit biến mất là "UNPROVEN" (mất thật hay chỉ đổi chỗ) (`plans/reports/resume-261006-1635-doc-authority-unification.md`, R-trigger §2).

Owner quyết định plan chạy trong một phiên chat riêng. Phiên điều tra chỉ hoàn thiện plan và ý định, không chạy phase nào (R-trigger §2).

## Nhìn lại

Không có cú hích dạng sự cố. Có một trạng thái tích tụ suốt hai tháng, một proposal ghi lại ý định "xoá hẳn cây legacy", và hai review cho thấy thực tế tệ hơn tiền đề của bản nháp. Lựa chọn atomic và bảo toàn từng claim được đưa ra từ ngày đầu. Bài 4 kể về phương pháp mà hai lựa chọn đó đòi hỏi.

## Nguồn

- Governance và portal: `23fb220e3`.
- Proposal: `ca854f443`; nội dung đọc tại `2085d88fe^:docs/platform/proposals/documentation-system-unification.md`.
- Truth reset: `a725d4788`, snapshot `ac19f6d1e`; `TAG:P/current-authority-map-2026-09-25.md`.
- Review: `TAG:P/independent-frontier-review-2026-09-25.md`, `TAG:P/independent-frontier-rereview-2026-09-25.md` (TAG = `archive/doc-260925-lineage`, P = `plans/260925-documentation-authority-unification`).
- Plan: `a725d4788` (nhánh), `2085d88fe` (main); đổi định dạng `4d80eaf29`.
- [Fact-check](review-261105-1423-doc-260925-retrospective-claims.md) #32, #34, #35, #38, #40.
- Báo cáo: `plans/reports/advice-260929-2345-doc-authority-harness-executor-routing.md`, `plans/reports/harness-investigation-261006-synthesis.md`, `plans/reports/resume-261006-1635-doc-authority-unification.md`.
- [research-261105-1411-retrospective-plan-260925-trigger.md](research-261105-1411-retrospective-plan-260925-trigger.md) (R-trigger) §1, §2, §3.
- [Evidence pack](retrospective-261105-1416-doc-260925-evidence-pack.md) §1.
