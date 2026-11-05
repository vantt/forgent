# Góp ý cho momentry: chọn chất liệu và chọn chuyện, rút từ một lần làm retrospective thật

Ngày 2026-11-05. Người viết: Lead DOC (forgentX). Chưa có code nào được viết. Đối tượng: momentry v0.3.0 (repo HEAD `1b64da6`, phần `lib/` và `prompts/` giống hệt v0.3.0).

Báo cáo nền:
- [Phương pháp retrospective em đã chạy](research-261105-1700-retrospective-method-reflection.md)
- [Thuật toán momentry, có trích file:dòng](research-261105-1700-momentry-pick-algorithm.md)
- [Chạy `momentry reduce` lên các phiên của plan tài liệu](research-261105-1700-momentry-reduce-on-doc-sessions.md)
- [Thực hành chọn chuyện bên ngoài](research-261105-1700-story-selection-practice.md) (chỉ 4 link đã được mở lại để kiểm; các link còn lại do agent dẫn theo trí nhớ)

## 1. Phản tư: em đã làm retrospective thế nào

Tổng thời gian khoảng 31 phút, khoảng 1,78M token của subagent. Sản phẩm là 6 bài, một bản tổng hợp bằng chứng và 2 vòng fact-check (commit `36737e5d6`).

| Bước | Cách làm | Ghi nhận |
|---|---|---|
| Thu chất liệu | 5 agent đọc song song. 3 agent chia theo **thời kỳ** (khởi đầu, giai đoạn lớn dần, điều khởi động plan), 2 agent chia theo **câu hỏi** (làm được gì, tốn bao nhiêu). Nguồn: git, file plan, mã quyết định, board log, báo cáo, memory. | Cách cắt này tốt: không sót thời kỳ nào, và câu hỏi về chi phí có agent riêng. **Không đọc transcript**, nên không kiểm được đoạn chat gốc đẻ ra bản đề xuất. |
| Bằng chứng | Chỉ nhận artefact gốc: commit kèm ngày, file tại một commit, báo cáo có ngày. Báo cáo nghiên cứu chỉ được dùng làm chỉ đường. Bản tổng hợp bằng chứng có timeline 55 dòng, chuỗi nhân quả 12 mắt, bảng chi phí và **sổ claim đã bỏ** (10 mục). | Mọi commit được dẫn và cả 10 con số lớn đều đúng. |
| Chọn chuyện | Mạch 6 bài có sẵn từ spec viết ngày 20/10. Tension chủ yếu lấy từ **trí nhớ của Lead**: 5 sai lầm em liệt kê trong brief. Không có bước nào tìm ứng viên rồi xếp hạng; câu mở bài do người viết tự chọn. | **Điểm yếu lớn nhất.** Câu chuyện được chọn từ trên xuống rồi mới đi kiểm. Những chuyện em không nhớ thì không vào được bài. |
| Kiểm chứng | Một người review độc lập kiểm từng claim. Vòng 1 kiểm 102 claim: 13 sai, 2 không có nguồn, 7 nói quá. Vòng 2 chỉ kiểm phần đã sửa. | Mọi lỗi nằm ở **các mắt nối** của câu chuyện, không nằm ở số liệu: sai commit gốc (lấy bản trên main thay vì trên nhánh), xếp sự kiện theo giờ commit thay vì theo quan hệ nhân quả, kết luận rút ra khi mới đọc nửa file quyết định, khoảng thời gian tự tính tay, đếm thiếu quyết định. 3 lỗi bắt nguồn từ tiền đề em viết sẵn trong brief. |
| Sót lại | Lỗi vòng 2 nằm ngay trong câu chữ người review đề xuất. Một claim cũ lọt qua: post 6 ghi `plan.md` "in-progress" trong khi cùng commit đó đã sửa thành completed. Lỗi này đã được sửa sau. Bài 3–6 dài hơn mục tiêu 1 200 chữ (1 388–1 734 chữ). | Thiếu ba thứ: vòng kiểm lại chính đoạn văn người review đề xuất, một lượt cắt độ dài sau khi sửa, và việc đóng băng repo trước lần kiểm cuối. |

**Phương pháp rút gọn (để dùng lại):**
1. Cắt nguồn theo thời kỳ, cộng thêm các câu hỏi xuyên suốt (chi phí, kết quả).
2. Nguồn gồm git, quyết định, báo cáo, memory, **và transcript**.
3. Gom thành bản tổng hợp bằng chứng: timeline, chuỗi nhân quả, bảng số liệu, sổ claim đã bỏ.
4. **Tìm ứng viên chuyện từ chất liệu, xếp hạng chúng, rồi mới chọn mạch.** Không lấy mạch từ trí nhớ người chỉ huy.
5. Brief cho người viết chỉ chứa câu hỏi, không chứa kết luận.
6. Ghim commit gốc trên nhánh làm việc, sắp sự kiện theo quan hệ nhân quả, đếm bằng script, số từ nguồn thiếu thì viết "ít nhất N".
7. Một người kiểm độc lập kiểm từng claim. Họ kiểm lại cả câu chữ chính họ đề xuất.
8. Sau khi sửa: cắt độ dài, đóng băng repo, chạy một lượt kiểm cuối.

## 2. So sánh: momentry và retrospective là hai tầng, không phải hai đối thủ

| | momentry | Retrospective em làm |
|---|---|---|
| Đơn vị | Khoảnh khắc trong **một phiên** | **Cung truyện** xuyên 6 tuần, nhiều phiên và nhiều commit |
| Hướng | Từ dưới lên: quét mọi dòng, ghi hết rồi lọc sau | Từ trên xuống: mạch có sẵn, đi tìm bằng chứng |
| Nguồn | Transcript. Không đọc git. | Git, quyết định, báo cáo. Không đọc transcript. |
| Bằng chứng | Con trỏ dòng `sid#Ln` | Commit SHA, file, ngày |
| Kiểm chứng | Không có | 2 vòng kiểm từng claim |
| Chi phí | Khoảng 0,83 USD một phiên. Riêng phiên Lead 186 MB thì khoảng 18 USD (ước tính, 18 cửa sổ). | Khoảng 1,78M token, 31 phút |

Thử nghiệm `reduce` không tốn tiền (không gọi LLM) trên 4 phiên của plan, đối chiếu 15 khoảnh khắc chính thuộc giai đoạn mà các phiên đó phủ:
- **6 trúng thật, 3 trúng nhờ may, 6 trượt.** 12 mắt của chuỗi nhân quả nằm hoàn toàn ngoài tầm, vì chúng xảy ra trước plan và chỉ có trong git.
- Trượt trọn **giọng chủ dự án**: A50/A51 "đồng ý phương án 2", lần dừng vì quota A12, và câu phản đối ngắn "6 tuần". Lệnh `/bip` không được dùng lần nào.
- Nhiễu cao. 117/182 cặp số thật ra là khoảng ("dòng 0 tới 190"). Khoảng 80 git "reversal" là thao tác thường ngày (`checkout --detach`, rebase trước khi push). Khoảng 43 lệnh "thất bại" thật ra là hook chặn hoặc lỗi công cụ.
- Có một tín hiệu chuẩn nhất: **ghi memory, 10/10 lần có ý nghĩa**.
- **Ngược lại, momentry tìm ra 4 chất liệu mà retrospective bỏ sót.** Quan trọng nhất là chuỗi 11-02 → 11-03: chủ dự án viết "thông minh hơn đi … 6 tuần rồi", rồi chọn "Land gọn". Đây chính là quyết định mở khoá Land, mà không có trong bài nào. Ba chất liệu còn lại: 306 → 17 lỗ hổng định danh, máy quét độc lập cắt 442 → 32 và 1 660 → 263 phát hiện, và dòng thời gian các bài học lấy từ memory.

**Kết luận:** thuật toán của momentry không "hay hơn" cách em làm, cũng không kém hơn. Nó giỏi đúng thứ em thiếu: **tìm ứng viên từ dưới lên**, ép model trả lời từng điểm nóng để model không tự lọc bớt, có lượt "người ngoài" chống curse of knowledge, có bộ nhãn tension tiếng Việt (`tuong_ma_hoa_ra`, `giup_ma_hai`…), và giữ nguyên tắc ghi hết lọc sau. Nó thiếu đúng thứ em có: **cung truyện xuyên phiên, nguồn git, và kiểm chứng**. Retrospective là loại chuyện đáng tiền nhất, và chủ dự án nói đó là việc momentry được thiết kế để làm, nhưng hiện momentry không làm được loại chuyện này.

## 3. Ý tưởng cải tiến: chọn chất liệu

Xếp theo lợi ích trên chi phí. Mỗi ý có bằng chứng từ dữ liệu thật ở trên.

| # | Ý tưởng | Vấn đề thật | Lợi ích |
|---|---|---|---|
| M1 | **Bộ dò giọng chủ dự án.** Bắt câu user ngắn sau một lượt agent chạy dài, câu trả lời lựa chọn ("A", "2B", "đồng ý phương án 2"), từ vựng phản đối hoặc thúc ("không", "sao lại", "thông minh hơn đi", "lâu quá"), lệnh tool bị từ chối, interrupt. | Toàn bộ các quyết định của chủ dự án đều trượt (A12, A50, A51, "Land gọn"). | Quyết định của con người là phần "lựa chọn" trong mọi câu chuyện. Không tốn tiền (heuristic). |
| M2 | **Bộ dò ghi bài học hoặc quyết định**, gồm cả đường bash/heredoc: ghi vào thư mục memory, ADR, `decisions/`, mục "Lịch sử quyết định", CHANGELOG. | 10/10 lần ghi memory có ý nghĩa, nhưng ghi qua heredoc thì `metaWrite` không thấy (trượt vụ oracle bị sửa ngày 10-30). | Đây là những bước ngoặt con người đã tự dán nhãn sẵn, độ chính xác cao nhất. |
| M3 | **Lọc nhiễu cho 3 bộ dò hiện có.** `metricPair`: bỏ khoảng ("0 tới 190", "dòng X–Y"), hiểu số Việt ("4 301", "8,3%", "X trên Y"). `gitReversal`: bỏ `checkout --detach`, rebase ngay trước push, và lệnh dọn dẹp. `nonzeroExit`: tách lỗi do hook hoặc quyền thành loại riêng. | Precision mỗi lần chạy 0,25–0,35 (PRD). Trên phiên Lead, đa số hotspot là nhiễu. | Ít chuyện rác hơn, harvest bớt bị phân tán. |
| M4 | **Git làm nguồn thứ hai** trong khung giờ của phiên: commit, revert, file thêm rồi xoá, khoảng giữa các commit. Gắn SHA vào chuyện, có thể chỉ trong hộp riêng tư nếu luật privacy không cho ghi ra ngoài. | Không có git thì không có cung truyện, không có bảng chi phí, và bằng chứng không ai khác kiểm lại được. | Bằng chứng kiểm lại được. Cũng là nền cho ý S1. |
| M5 | **Đọc transcript của subagent và worker** (ở đây có 1 643 file), ít nhất ở mức tóm tắt kết quả. | Vụ hết bộ nhớ ngày 10-06 và các vòng Doer đều nằm ngoài phiên chính. | Thấy được phần việc do agent con làm. |
| M6 | **Phiên rất dài: chỉ đọc vùng quanh hotspot** (Q.4 đã liệt kê) và cho lượt người ngoài dùng haiku. | Phiên 186 MB ước tính khoảng 18 USD. Lượt người ngoài chiếm 69% chi phí, và 91% token đầu vào là cache write không bao giờ được đọc lại. | Chi phí giảm cỡ một bậc với phiên dài. |

## 4. Ý tưởng cải tiến: chọn chuyện hấp dẫn

| # | Ý tưởng | Vấn đề thật | Lợi ích |
|---|---|---|---|
| S1 | **Tầng cung truyện (chế độ retrospective).** Đầu vào là một khoảng ngày, một plan, hoặc một nhãn. Nối các chuyện trong hộp với nhau qua file hoặc symbol chung, mã quyết định chung, tên plan, độ gần thời gian (có thể thêm embedding, như e5 đã gợi ý), cộng commit từ M4. Đầu ra là timeline, chuỗi nhân quả, bảng số liệu và các cung được xếp hạng. Đây chính là bước 1–4 trong phương pháp ở mục 1, với chuyện của momentry làm kho ứng viên. | `threads` và `links` không bao giờ được máy điền. Lượt quét xuyên phiên T3 đã bị hoãn vì "một phiên không thấy được thói quen". | Đúng loại chuyện chủ dự án muốn nhất. Quy mô lớn nên cần một quyết định riêng (RUL104: tính năng mới phải được chủ dự án chọn). |
| S2 | **Bỏ cổng tension xếp theo thứ tự từ điển, thay bằng cổng "so what" cộng điểm cộng dồn.** Cổng: phát biểu được bài học mà **không dùng tên riêng của repo**. Điểm gồm tension, stakes, độ mạnh bằng chứng, độ mới, mức tự đứng được. Mở rộng stakes thành "đổi kết quả **hoặc** đụng một nguyên tắc đã nêu". | Một chuyện tốt có tension `none` đứng thứ 26/38. Vụ "squash để xoá dữ liệu rò" chỉ được stakes 1. | Chuyện hay nhưng yên ả không bị chôn, chuyện ồn mà vụn không lên đầu. |
| S3 | **Kiểm ABT (Và–Nhưng–Vì vậy) cho câu hook.** Viết được một dòng "Ta làm A và B, nhưng C, vì vậy D". Không có "nhưng" thì không có tension. | 4/8 chuyện tốt bị chê thiếu hook hoặc nhạt, vì hook được viết từ bản tóm tắt đã gộp. | Rẻ, người đọc liếc vài giây là kiểm được, và chặn được hook rỗng. |
| S4 | **Lấy top-k theo từng nhóm** (thất bại, quyết định, con số, quy trình), để một thể loại không chiếm hết. | Cặp số và lệnh thất bại áp đảo về số lượng. | Danh sách đề cử đa dạng hơn. |
| S5 | **Đánh dấu của người dùng phải thật sự đổi thứ hạng**, cả trong CLI `list --rank`. Thêm bộ nhãn đóng băng khoảng 30–50 chuyện cùng so sánh từng cặp, để đo top-5 Use rate (hiện có công cụ đo nhưng chưa có số nào). | Mọi con số đến từ một phiên và một người gán nhãn. Bộ eval 8 phiên dùng nhãn nháp do agent gán. | Có nền đo thật trước khi chỉnh trọng số. |
| S6 | **Khi skill `momentry` viết nháp bài, mang theo vòng kiểm chứng.** Bảng sự kiện đánh số, mỗi claim có mã `[F12]`. Con số tính bằng script. Dữ liệu thiếu thì viết "ít nhất N". Kiểm thứ tự sự kiện theo timestamp. Mỗi claim ghi rõ người làm (người, agent hay tool). Có sổ claim đã bỏ. Người kiểm độc lập chỉ thấy claim và bằng chứng. Checklist lỗi lấy luôn từ 5 loại lỗi em đã gặp (mục 1). | Chính lần làm của em có 22/102 claim sai hoặc nói quá, dù toàn bộ số liệu đều đúng. | Bài đăng ra ngoài không làm mất uy tín người viết. |

## 5. Chiều ngược lại: momentry dạy gì cho cách em làm retrospective

- Thêm bước **tìm ứng viên từ dưới lên** trước khi chốt mạch. Có thể chạy hotspot của momentry (bản `reduce` không tốn tiền) lên transcript, cộng memory và ghi quyết định, rồi xếp hạng các ứng viên.
- Đưa **giọng chủ dự án** vào làm nguồn hạng nhất. Chuyện "thông minh hơn đi → Land gọn" lẽ ra phải có trong bài 5 hoặc bài 6.
- Cho lượt **người ngoài** đọc bản nháp: "người không biết repo hỏi gì?"

## 6. Đề xuất bước tiếp

1. Chạy harvest có trả phí lên **một** phiên ngắn của plan (khoảng 1 USD) để xem bước LLM có bù được các chỗ `reduce` trượt không. Câu hỏi này hiện chưa kiểm.
2. Nếu chủ dự án muốn: chuyển mục 3–4 thành backlog cho repo momentry. M1, M2, M3 nhỏ và rẻ. S1 là một plan riêng.
3. Có thể bổ sung chuyện "thông minh hơn đi → Land gọn" vào loạt bài trước khi chủ dự án duyệt.

## Câu hỏi còn mở

- Bước harvest có trả phí có bắt lại được giọng chủ dự án từ toàn văn không? Chưa kiểm.
- Luật privacy của momentry có cho ghi SHA hoặc đường dẫn file vào hộp không, hay chỉ ghi trong hộp riêng tư?
- Góp ý này sẽ được đưa vào repo momentry dưới dạng nào (issue, plan, backlog), và ai làm? Việc này chờ chủ dự án quyết định.

## 7. Đã làm (2026-11-05, chủ dự án cho phép làm hết)

- **momentry `main` `e040cbf`** (epic E20, plan `plans/261105-story-material/plan.md` trong repo momentry):
  - M1, M2, M3 thành bộ dò: `ownerVoice`, `lessonWrite`, `blocked`, lọc nhiễu `metricPair`/`gitReversal`.
  - Sửa lỗi id điểm nóng lạ làm mất cả cửa sổ.
  - 370 test pass.
- **Đo có trả phí** ([mốc](research-261105-1737-momentry-harvest-baseline-doc-sessions.md), [nhánh so với mốc](research-261105-1812-momentry-branch-vs-baseline-doc-sessions.md)), tổng khoảng 6 USD:
  - Bước LLM bắt lại gần đủ những chỗ `reduce` trượt.
  - Code mới giảm điểm nóng rác. Số chuyện nêu tên quyết định của chủ dự án tăng từ 14 lên 24.
  - p@k nằm trong độ lệch của một lần chụp.
- **Gốc của việc chuyện quyết định bị xếp thấp:** `hook-tension` chấm các chuyện này là `none`, và tầng tension đặt mọi chuyện `none` xuống dưới.
  - Đề xuất M.5 (đổi xếp hạng) được giao cho E17, phải chạy lại trên bộ eval của E17 trước khi đổi.
  - M.6 (prompt) chờ một lần chụp có trả phí.
- **Bộ eval thứ hai:** `~/projects/momentry-eval/docs/_private/eval-forgentx/` (labels-v2), không commit.
- **Loạt bài forgentX:** được viết lại từ danh sách ứng viên đã xếp hạng, có thêm transcript làm nguồn. Fact-check vòng 3 và 4 đã áp dụng hết.
