# Bài 1: Ngày đầu tiên và lời hứa "compound"

*Chuỗi hồi cứu plan 260925, bài 1/6. Bài sau: [Tài liệu đã trôi dạt thế nào](retrospective-261105-1416-doc-260925-post-2-how-docs-drifted.md). Toàn bộ số liệu nằm trong [evidence pack](retrospective-261105-1416-doc-260925-evidence-pack.md).*

Plan 260925 mất 41 ngày để gom tài liệu của fgOS về một chỗ. Muốn hiểu vì sao cần một việc lớn như vậy, phải quay về ngày repo ra đời. Lý do không nằm ở một lỗi cụ thể. Nó nằm ở những lựa chọn rất hợp lý trong tuần đầu tiên, khi chưa ai nghĩ tới chuyện `docs/` sẽ phình lên 12 lần chỉ trong tám tuần từ 1/8 tới 25/9 (365 lên 4.301 file, R-middle §2).

## Ngày 13/7: repo trống và một hệ học từ người khác

Root commit `f6139bf57` (2026-07-13 11:34) chỉ có file `LICENSE`. Hai giờ sau, `a21d9446c` thêm tài liệu đầu tiên: một README định vị, gõ sai tên thành `READEME.md`, và `docs/naming.md` để thử đặt tên dự án (R-genesis §1). Một phút sau đó, `2930a89fc` dựng một "reference learning system" dưới `docs/references/`, kèm script `scripts/ref-delta.sh`. Đây là tiền thân của distillery, nơi fgOS học từ các dự án khác.

Như vậy ngay ngày đầu đã có ba thứ cùng nằm trong `docs/`: tài liệu định vị sản phẩm, tài liệu thăm dò, và kho học từ bên ngoài. Chưa có quy tắc nào phân biệt chúng.

## Lời hứa: mỗi việc để lại hệ thống khá hơn

Rạng sáng 14/7, `ebc6e8047` thêm bài deep-dive `docs/distillery/deep-dives/compound-engineering.md`. Bài này đặt ra ý tưởng xuyên suốt của fgOS (R-genesis §2.1):

> "'Compound engineering' = mỗi đơn vị công việc để lại hệ thống KHÁ HƠN cho đơn vị kế: tri thức được bắt lại như sản phẩm phụ, friction nuôi cải tiến, quyết định tích lũy thành memory tái dùng, harness tự sửa mình."

Câu hỏi trung tâm của nó: "Làm sao để engineering **cộng dồn** thay vì reset mỗi lần?" Bài chia câu hỏi đó làm bốn: tri thức đã chốt được giữ ở đâu, friction biến thành cải tiến thế nào, làm sao biết cải tiến có tác dụng, và ai đóng vòng lặp. Bài cũng so sánh ba trường phái: bee (con người duyệt), harness (đo outcome) và marketing-cockpit (tự động, quên theo trọng số). Khuyến nghị là lấy cổng duyệt của bee, phép đo outcome của harness, và bỏ cơ chế tự nhớ.

Câu hỏi đầu tiên trong bốn câu, "tri thức đã chốt được giữ ở đâu", chính là câu mà plan 260925 phải trả lời lại hơn hai tháng sau.

## Tám luật nền, lúc 00:28

Lúc 00:28 cùng đêm, `e9ff70db7` tạo `docs/platform-foundations.md` với tám luật L1 đến L8 của "compound-learning stack" (R-genesis §2.2). Các luật đáng chú ý cho câu chuyện tài liệu:

- **L1** tách hai loại tri thức: Log (chỉ ghi thêm, theo feature) và State (ghi đè, theo khu vực).
- **L5** định nghĩa "xong" bằng sáu câu hỏi. Câu 6 là "Bài học nào để lại?". Luật ghi rõ: "Câu 6 chính là compound-learning — nó nằm trong definition of done, không phải tính năng cộng thêm."
- **L6** là thang trưởng thành F0 đến F5; bậc F4 "Compounding" yêu cầu vòng predicted→actual chạy được.

Luật có mã quyết định trong `.bee/decisions.jsonl`, kèm quy tắc "thay đổi luật = supersede quyết định D-ID tương ứng, không sửa tại chỗ".

Chưa đầy hai giờ sau, `ad65f59fd` (02:26) đóng Phase 1 và tạo thư mục `docs/specs/` với bốn file, trong đó có `docs/specs/platform-foundations.md`, một bản spec trỏ ngược về bản gốc. Reading map của commit đó ghi: "văn bản gốc 8 luật nền platform (L1–L8); spec: docs/specs/platform-foundations.md" (R-genesis §3.7). Vậy là ngay ngày thứ hai, luật nền đã có hai bản. Tới 25/9, nó có ba bản với ba kích thước khác nhau (bài 2 kể tiếp).

## Compound được dựng thành code

Ý tưởng không dừng ở văn bản. Từ 15 đến 16/7, Phase 3 dựng vòng predicted→actual (R-genesis §2.3):

- `dc472783c`: event `work.outcome`, gồm dự đoán lúc claim và kết quả thật lúc kết thúc.
- `96e5e3a29`: event `work.friction`, quy friction vào năm lớp.
- `0228c4034`: tự động ghi bản ghi bài học khi item `done`.
- `15ddd61e8` (16/7 15:17) tuyên bố đạt bậc F4. Commit này nói "full evidence lives in the workshop's benchmark report". Báo cáo đó nằm ngoài repo, nên tuyên bố F4 **không kiểm chứng được** từ repo hiện tại.

Ngày 20/7, compound trở thành một stage bắt buộc. `3ee30977a` thêm cổng: item coding không thể tới `done` nếu chưa qua stage compound-learn, kèm `test/e2e/compound-learn-lifecycle.test.mjs`. `1739a83d5` thêm skill `fgos-compounding`, có nhiệm vụ viết một tài liệu end-user theo một trong bốn góc Diataxis dưới `docs/<quadrant>/`. Skill dặn: "a thin, honest document beats an invented rich one" (R-genesis §2.4).

Đây là điểm mấu chốt cho phần sau. Từ ngày 20/7, **mỗi work item coding hoàn thành sẽ sinh ra ít nhất một tài liệu mới**, theo thiết kế.

## Những lựa chọn lưu trữ đầu tiên

Trong ba tuần đầu, có nhiều lựa chọn lưu trữ hợp lý khi đứng riêng, nhưng không có quy tắc nào ràng chúng lại với nhau (R-genesis §3):

1. **Specs là "state layer".** `docs/specs/<area>.md`, với một file `work-state.md` lớn nuốt dần mọi feature qua các commit "spec sync".
2. **Quyết định nằm ở ba chỗ.** `.bee/decisions.jsonl` với mã hex; `docs/decisions/NNNN-<slug>.md` (`c93aa4acf`, 14/7 22:48) gồm 9 ADR chưng cất tay từ 17 quyết định; và các trích dẫn "per D2 ... / 9c67c3d1" bên trong specs.
3. **Repo divorce.** `e99998633` (14/7) ignore `/plans/`, `/docs/history/`, `/docs/distillery/` khỏi repo sản phẩm. `2bbd8f70f` (28/7) đảo lại để skill có thể commit `CONTEXT.md`. Các file chỉ nằm ở workshop trong hai tuần đó, như CONTEXT của Phase 3 và báo cáo benchmark, không tìm thấy trong lịch sử hiện tại. Chúng đã đi đâu thì chưa kiểm chứng được.
4. **Kho tri thức đổi chỗ liên tục.** `docs/history/learnings/` (bee), rồi bản ghi bài học trong event `.fgos` (20/7), rồi các thư mục Diataxis (`cf27ae0b3` chưng cất `critical-patterns.md` vào `docs/explanation/*` ngày 22/7), rồi `docs/knowledge/` (27/8). Trong khoảng sáu tuần có ít nhất bốn kho.
5. **File phẳng ở gốc `docs/`.** `routing-handoff-contract.md`, `architecture-map.md`, `work-item-lifecycle.md`, `io-contract.md`, `distribution-vision.md`... Chưa có luật đặt chỗ nào ngoài L8, mà L8 chỉ áp cho lớp doctrine.

Không có lựa chọn nào trong số này là sai khi đứng riêng. Vấn đề là không có cái nào trả lời được câu "khi hai chỗ nói khác nhau thì chỗ nào đúng".

## Nhìn lại

Lời hứa compound ban đầu rất rõ: tri thức phải cộng dồn chứ không reset. Cơ chế cũng được dựng thật, có cổng done và có test e2e. Nhưng chính cơ chế đó, cộng với việc không có luật thẩm quyền và vị trí, đã biến "cộng dồn tri thức" thành "cộng dồn file". Bài 2 đo xem số file đã cộng dồn nhanh tới mức nào.

## Nguồn

- Root và tài liệu đầu: `f6139bf57`, `a21d9446c`, `2930a89fc`.
- Compound engineering: `ebc6e8047` (`docs/distillery/deep-dives/compound-engineering.md`).
- Luật nền: `e9ff70db7`; bản spec thứ hai: `ad65f59fd`.
- Phase 3 compound: `dc472783c`, `96e5e3a29`, `0228c4034`, `15ddd61e8`.
- Compound-learn stage: `3ee30977a`, `1739a83d5`, `test/e2e/compound-learn-lifecycle.test.mjs`.
- Lưu trữ: `c93aa4acf`, `e99998633`, `2bbd8f70f`, `cf27ae0b3`.
- [research-261105-1411-retrospective-genesis-compound-era.md](research-261105-1411-retrospective-genesis-compound-era.md) (R-genesis) §1, §2, §3.
- [Evidence pack](retrospective-261105-1416-doc-260925-evidence-pack.md) §1, §2.
