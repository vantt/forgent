# Bài 6: Kết quả, những gì còn mở, và bài học

*Chuỗi hồi cứu plan 260925, bài 6/6. Bài trước: [Cái giá](retrospective-261105-1416-doc-260925-post-5-the-cost.md). Quay về đầu chuỗi: [Bài 1](retrospective-261105-1416-doc-260925-post-1-genesis-and-compound.md).*

Năm bài trước kể vì sao có plan 260925, nó làm gì, và nó tốn bao nhiêu. Bài cuối này trả lời hai câu: repo có được gì mà trước đây không có, và cái gì vẫn chưa có. Sau đó là các bài học, mỗi bài gắn với một sự kiện cụ thể trong chuỗi.

## Cutover: một commit

`97dd62aa7` (3/11, giờ commit 22:07), "docs: cut documentation authority over to docs/platform and retire the legacy roots", thay đổi 1.677 file, +182.794 / -239.220 dòng: 166 file thêm, 943 file xoá, 446 file sửa, 122 file đổi tên. Trong số file xoá, 908 nằm dưới `docs/architect` và 6 nằm dưới `docs/specs` (R-built §2).

Commit này cũng gộp hai reading map thành một, viết lại `AGENTS.md`, sửa `.githooks/pre-commit`, thêm `.githooks/reference-transaction` (hook phục vụ lease, bị xoá lại ngày 4/11 theo fact-check #84), và cài ba guard thay cho ratchet (phán quyết L12-89): gốc đã retire bị từ chối, check vị trí trong Convention, và check link/anchor trong doc-health (R-built §2).

## Những gì đã đạt được, có bằng chứng

1. **Một cây thẩm quyền.** `docs/specs` và `docs/architect` không còn tồn tại. `docs/platform/` có 628 file Markdown trong 34 thư mục khu vực. `docs/decisions/` vẫn còn, nhưng theo luật chỉ được chứa `index.md` sinh tự động (R-built §3.1).
2. **Một bản đồ đọc.** `docs/reading-map.md` chứa bản gộp, có dòng Provenance dẫn về cả hai bản cũ (R-built §3.2).
3. **Một check tái lập được.** `node scripts/doc-health.mjs` chạy ngày 5/11 cho kết quả: "628 platform documents, 2607 local links, 302 metadata-exempt, 0 finding(s)". `test/scripts/doc-health.test.mjs` có một wiring proof chạy trong suite (R-built §3.3).
4. **Luật đường dẫn ở một chỗ.** Convention sở hữu tên và vị trí. Các dòng forbidden chặn gốc đã retire (`packages/convention/contracts/convention.rules.v1.json:143-148`). Pre-commit gọi `convention check` trên `docs/**` được stage (R-built §3.4).
5. **Tra được đường dẫn cũ.** Alias table 9.235 mục trên main cho phép tra đường dẫn cũ sau khi gốc cũ đã bị xoá. `docs/platform/history/documentation-authority-unification/sealed-claim-ledger.json` (kèm `.sha256`) trên main là một bản ghi digest của ledger 68.441 dòng, ghim tại snapshot `2a028cdc9`; bản thân các dòng ledger chỉ nằm trong tag local (R-built §2, §3.5; fact-check `review-261105-1423-doc-260925-retrospective-claims.md` #89). Theo cách đọc của người viết, đây là phần trả lời cho phát hiện C2 của review ngày 25/9 (bài 3): đường dẫn tra được trên main, còn danh tính claim chi tiết thì phụ thuộc vào tag local.
6. **Câu trả lời L5 cho người lạ.** `AGENTS.md` giờ dẫn sáu câu hỏi definition-of-done qua `docs/reading-map.md`, `docs/platform/platform-foundations.md` (L1 tới L10) và spec từng khu. Ba bản luật nền giờ chỉ còn một: `git ls-files` chỉ thấy `docs/platform/platform-foundations.md` (writer check 2026-11-05). Lưu ý: sau cutover chưa có lần test fresh-reader nào mới; kết quả gần nhất là ở Phase 5 và Phase 7 (R-built §3.6).
7. **Ít bộ phận phải mang theo hơn.** Commit `159971615` của Phase 10 xoá 7.426 dòng script và 22 file test (xoá 35 file; cả commit chạm 41 file, -13.856 dòng; fact-check #93, writer check 2026-11-05). Việc gỡ lease xoá 2.734 dòng trên 39 file (`c7a354e1d`; R-built §3.7).

Phase 10 land ở đỉnh fast-forward `97cc4b432` ngày 4/11, với các commit công việc `46310f968..00c64d5a5`. Ngoài các mục trên, Phase 10 thêm `fgos convention classify` và ba luật của doc-health (link, header metadata, đường dẫn chết), gắn header governance cho 26 tài liệu, và quét 166 đường dẫn backtick chết (Lead check 2026-11-05; R-built §1, §2).

## Những gì chưa đạt hoặc còn mở

- **DOCOS: "not-planned".** Hệ điều hành tài liệu mà proposal ngày 20/9 hướng tới chưa được dựng và chưa có plan (`plans/261017-1313-fgos-platform-program-board/plan.md:80`). Dòng ledger PF-I024 liệt kê ba thứ chưa làm: một cửa ghi duy nhất (`fgos doc new`), check owner ở mức claim, và check rằng skill hoặc lệnh được nhắc trong tài liệu canonical có tồn tại thật. Lý do được đo: `Canonical for` có 18 giá trị khác nhau và một chuỗi được dùng chung bởi 60 tài liệu (R-built §4). Plan này giải quyết thẩm quyền, chưa giải quyết việc viết.
- **doc-health chỉ chạy trong `npm test`.** Nó không ở pre-commit, và đó là chủ ý ("It is not duplicated in pre-commit", `docs/platform/convention/spec.md:382`). Nó cũng không có doctor row. Một commit làm gãy link chỉ bị bắt khi suite chạy, không bị bắt lúc commit (R-built §4).
- **Evidence chỉ có ở máy owner.** Tag `archive/doc-260925-lineage` (`84bbfa7b8`) không được push lên origin, theo quyết định giữ 7,5 GB ngoài main (Lead check 2026-11-05). Bản nén 575,4 MiB cũng nằm trên cùng máy (R-cost §1). Nếu mất đĩa, các quyết định chi tiết theo từng claim sẽ mất; chỉ còn digest của sealed ledger và 28 file trong thư mục plan trên main (27 lúc cutover; Phase 10 thêm file phase của nó) (R-built §4; fact-check #96).
- **Trạng thái `plan.md` lỗi thời.** Trên main, `plans/260925-documentation-authority-unification/plan.md` vẫn có frontmatter `status: in-progress` (dòng 4) và H1 "active migration plan" (dòng 12). Dòng 15 ghi "Closed" nhưng vẫn nói việc gỡ lease "follows as its own item", trong khi lease đã được gỡ ở `ad72e3a46`. Phase 11 vẫn ghi "pending" (dòng 262) (writer check 2026-11-05). Board là nguồn đúng hiện tại.
- **Guard Phase 9 lúc landing chưa có hiệu lực qua host đã cài.** Release đã kích hoạt lúc đó không mang luật mới (gap G1). Release `47e1016d` sau đó chưa được kiểm lại trong nghiên cứu này (R-built §2, §4).
- **Giới hạn phương pháp chưa truy hết.** 247 finding của audit độc lập ở Phase 8 được ghi "not green and not waived" (`phase-08/owner-answers.md:2821`); biên nhận audit Phase 6 là một lệnh do chính tác giả viết. Nghiên cứu chưa tìm được cách xử lý cuối cùng của chúng (R-built §4). (E6/E7 của Phase 5 không nằm trong danh sách này: chúng đạt sau một vòng sửa, xem bài 4.)

## Bài học

1. **Đặt luật thẩm quyền trước khi đặt cơ chế sinh tài liệu.** Ngày 20/7, cổng compound-learn bắt mỗi item sinh một tài liệu (`3ee30977a`, `1739a83d5`), trong khi luật nền đã có hai bản từ 14/7 (`ad65f59fd`). Cùng giai đoạn đó, `docs/` tăng từ 365 lên 4.301 file trong tám tuần mà specs chỉ có 11 tới 13 file (bài 1, bài 2); việc cổng này là một nguyên nhân chính là cách đọc của người viết. Cộng dồn tri thức đòi hỏi trước hết phải có một chỗ duy nhất để cộng vào.
2. **Dời là dời. Chép mà gọi là "migrate" thì sinh ra bản sao tách nhánh.** `e1307d33f` thêm 943 file và không xoá bản gốc; một ngày sau đã có 67 bản khác nhau (bài 2). Việc di trú tài liệu lớn không nên nằm trong một commit có tiêu đề "fix(dispatch)".
3. **Chuyển bên đọc trước, hoặc cùng lúc.** Switchboard tồn tại từ 15/9, nhưng `AGENTS.md` và `core/instructions` vẫn trỏ cây cũ (bài 2). Phase 8 chuẩn bị bên tiêu thụ, và cutover chuyển chúng trong cùng một commit (bài 4, bài 6). Việc đó là điều kiện để cutover có tác dụng là cách đọc của người viết.
4. **Pilot phải được phép thất bại.** Pilot A tìm ra 16 drop mà audit trước khai là đã giữ. Vòng đầu trượt E6 và E7, owner phán METHOD-MUST-CHANGE, và sau một vòng sửa cả hai đạt (bài 4). Theo cách đọc của người viết, nếu bỏ pilot thì những drop đó đã đi thẳng vào cutover.
5. **Báo chi phí kiểm chứng sớm, đừng để owner phải hỏi.** Ngày 11/10, owner phải tự hỏi "tài liệu thôi mà sao kì công vậy ta" trong khi rework chỉ là 1,8% và Lead vẫn đang viết thêm amendment (bài 4, bài 5). Khi chi phí chứng minh lớn hơn rủi ro nhiều lần, hãy đề xuất cách chia rẻ hơn ngay.
6. **Một review không hội tụ sau vài vòng thì phải đổi đơn vị review, không chạy thêm vòng.** Gói review từng cạnh A36 (338 phần, cho 5.427 cạnh mà thực chất chỉ có 1.018 ánh xạ) bị bỏ ở A50 trước khi được review. Sau đó mẫu ngữ nghĩa 1.275 cạnh vẫn trượt qua bảy lần sinh lại (8,3% rework). Nó chỉ dừng khi cổng được đổi ở A51: kiểm kê cơ học, còn patch được viết và review theo từng file tiêu thụ (bài 4).
7. **Tác giả không bao giờ được chạm vào thước đo của chính mình.** Ngày 30/10, ngay cả với giới hạn "only by named negative fixtures", 5 trên 8 thay đổi của Doer đã nới lỏng check hoặc thay bằng dữ liệu của chính tác giả (bài 4).
8. **Không merge một partial đang đỏ vào nhánh chung.** Khoảng 27/10, một partial đỏ làm hỏng mọi lần chạy proof ở HEAD (bài 4).
9. **Giàn giáo dùng một lần thì ghi rõ ngày gỡ ngay từ lúc dựng.** Write lease được thiết kế ở Phase 4, dựng ở Phase 8 và xoá ngày 4/11 với -2.734 dòng (bài 4, bài 5). Nó có thể đáng, nhưng chi phí của nó nên được nhìn thấy ngay từ đầu.
10. **Evidence chỉ ở một máy thì chưa phải evidence bền.** Theo L9 ("run ≠ merge ≠ durable", `AGENTS.md`), land chưa có nghĩa là bền. 7,5 GB evidence hiện chỉ có trên một máy (bài 5, bài 6). Owner cần chọn: chấp nhận rủi ro này, hoặc có thêm một bản sao thứ hai.
11. **Đổi định dạng plan thì cập nhật trạng thái theo.** `plan.md` ở main từng ghi "Proposed — not authorized" khi plan đã chạy (bài 3), và hôm nay vẫn ghi `status: in-progress` sau khi đã đóng (bài 6). Ngay trong plan dọn thẩm quyền, file trạng thái của chính plan vẫn có hai nguồn nói khác nhau.

## Nguồn

- Cutover: `97dd62aa7`. Phase 10: `97cc4b432`, `46310f968..00c64d5a5`. Lease: `c7a354e1d`, `ad72e3a46`.
- Lead check 2026-11-05 (tag chỉ có trên máy owner; đỉnh Phase 10; thời điểm gỡ lease).
- Writer check 2026-11-05: `plans/260925-documentation-authority-unification/plan.md` dòng 4, 12, 15, 262; `git ls-files 'docs/**/platform-foundations.md'`.
- `docs/platform/convention/spec.md:382`; `packages/convention/contracts/convention.rules.v1.json:143-148`; `plans/261017-1313-fgos-platform-program-board/plan.md:80`.
- Commit `159971615` (gỡ script plan-era).
- [Fact-check](review-261105-1423-doc-260925-retrospective-claims.md) #84, #89, #90, #93, #96, #99, #100, #101, #102.
- [R-built](research-261105-1412-retrospective-plan-260925-built-and-gained.md) §2, §3, §4; [R-cost](research-261105-1411-retrospective-plan-260925-execution-cost.md) §1.
- Các bài trước trong chuỗi và [evidence pack](retrospective-261105-1416-doc-260925-evidence-pack.md) §4.
