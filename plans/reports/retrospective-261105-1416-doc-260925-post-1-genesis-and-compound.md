# Bài 1: Ngày đầu tiên và lời hứa "compound"

*Chuỗi hồi cứu plan 260925, bài 1/6. Bài sau: [Tài liệu đã trôi dạt thế nào](retrospective-261105-1416-doc-260925-post-2-how-docs-drifted.md). Toàn bộ số liệu nằm trong [evidence pack](retrospective-261105-1416-doc-260925-evidence-pack.md).*

> **Từ dùng trong chuỗi bài**
> - **Owner**: anh chủ dự án, người duyệt và quyết định.
> - **Lead**: phiên agent điều phối plan, đặt câu hỏi cho owner và giao việc.
> - **Doer**: agent làm từng lượt việc cụ thể theo lệnh của Lead.
> - **Thẩm quyền**: tài liệu nào là bản đúng khi hai chỗ nói khác nhau.
> - **Claim**: một ý trong tài liệu, đơn vị mà plan đếm và bảo toàn.
> - **Cutover**: lần chuyển thẩm quyền một lần duy nhất từ cây tài liệu cũ sang cây mới.
> - **Land**: đưa thay đổi lên nhánh main.
> - **Evidence**: báo cáo review, sổ đối chiếu và kết quả chạy, dùng để chứng minh không mất gì.
> - **Oracle / scanner**: công cụ chấm tự động, cho biết tài liệu đã đạt hay chưa.
> - **Ratchet**: luật chặn thêm file mới vào cây cũ.

Sáng 2/11, sau gần sáu tuần, owner gõ một dòng: "thông minh hơn đi. làm tài liệu có phải viết code gì phức tạp mà 6 tuần rồi". Câu trả lời bắt đầu từ ngày repo ra đời, khi một lời hứa rất hay, rằng mỗi việc để lại hệ thống khá hơn, được dựng thành cơ chế sinh tài liệu trước khi có luật nói tài liệu nào là thật. Bài 6 kể owner nhận được câu trả lời gì.

Plan 260925 mất 41 ngày để gom tài liệu của fgOS về một chỗ. Lý do không nằm ở một lỗi cụ thể, mà ở những lựa chọn rất hợp lý trong tuần đầu, khi chưa ai nghĩ `docs/` sẽ phình 12 lần trong tám tuần từ 1/8 tới 25/9 (365 lên 4.301 file).

## Ngày 13/7: repo trống và một hệ học từ người khác

Commit đầu tiên (13/7 11:34) chỉ có file `LICENSE`. Hai giờ sau, tài liệu đầu tiên xuất hiện: một README định vị, gõ sai tên thành `READEME.md`, và một file thử đặt tên dự án. Một phút sau đó, repo có thêm một hệ "reference learning" dưới `docs/references/`, tiền thân của kho học từ các dự án khác.

Như vậy ngay ngày đầu, `docs/` đã chứa ba loại: tài liệu định vị sản phẩm, tài liệu thăm dò, và kho học từ bên ngoài. Chưa có quy tắc nào phân biệt chúng.

## Lời hứa: mỗi việc để lại hệ thống khá hơn

Rạng sáng 14/7, một bài deep-dive về "compound engineering" đặt ra ý tưởng xuyên suốt của fgOS:

> "'Compound engineering' = mỗi đơn vị công việc để lại hệ thống KHÁ HƠN cho đơn vị kế: tri thức được bắt lại như sản phẩm phụ, friction nuôi cải tiến, quyết định tích lũy thành memory tái dùng, harness tự sửa mình."

Câu hỏi trung tâm của nó: "Làm sao để engineering **cộng dồn** thay vì reset mỗi lần?" Bài chia câu hỏi đó làm bốn: tri thức đã chốt được giữ ở đâu, friction biến thành cải tiến thế nào, làm sao biết cải tiến có tác dụng, và ai đóng vòng lặp.

Câu đầu tiên trong bốn câu, "tri thức đã chốt được giữ ở đâu", chính là câu mà plan 260925 phải trả lời lại hơn hai tháng sau.

## Luật nền, và bản thứ hai của nó

Lúc 00:28 cùng đêm, repo có tám luật nền. Luật quan trọng nhất cho câu chuyện tài liệu định nghĩa "xong" bằng sáu câu hỏi, trong đó câu 6 là "Bài học nào để lại?". Luật ghi rõ: "Câu 6 chính là compound-learning — nó nằm trong definition of done, không phải tính năng cộng thêm." Đổi luật thì phải ghi một quyết định mới thay quyết định cũ, không sửa tại chỗ.

Chưa đầy hai giờ sau (02:26), thư mục `docs/specs/` ra đời với bốn file, trong đó có một bản spec của chính các luật nền, trỏ ngược về bản gốc. Ngay ngày thứ hai, luật nền đã có hai bản. Tới 25/9, nó có ba bản với ba kích thước khác nhau (bài 2).

## Compound được dựng thành code

Ý tưởng không dừng ở văn bản. Ngày 15 và 16/7, repo có vòng "dự đoán rồi đối chiếu kết quả thật": mỗi việc ghi dự đoán lúc nhận, kết quả lúc xong, các va vấp gặp phải, và tự ghi bài học khi xong. Ngày 16/7, một commit tuyên bố đạt bậc trưởng thành F4, nhưng ghi rằng bằng chứng nằm trong một báo cáo benchmark ngoài repo, nên tuyên bố đó **không kiểm chứng được** từ repo hiện tại.

Ngày 20/7, compound thành bước bắt buộc: một việc coding không thể đóng nếu chưa qua bước compound-learn, và có test end-to-end giữ luật đó. Cùng ngày, một skill được thêm để viết một tài liệu end-user cho mỗi việc, theo một trong bốn kiểu tài liệu. Skill dặn: "a thin, honest document beats an invented rich one".

Đây là điểm mấu chốt. Từ 20/7, **mỗi việc coding hoàn thành sinh ra ít nhất một tài liệu mới**, theo thiết kế.

## Những lựa chọn lưu trữ đầu tiên

Trong ba tuần đầu, có nhiều lựa chọn lưu trữ hợp lý khi đứng riêng, nhưng không có quy tắc nào ràng chúng lại:

1. **Spec là "lớp trạng thái".** Mỗi khu một file spec, với một file trạng thái lớn nuốt dần mọi tính năng.
2. **Quyết định nằm ở ba chỗ**: một file JSONL với mã hex, một thư mục ADR gồm 9 ADR chưng cất tay từ 17 quyết định, và các trích dẫn rải trong spec.
3. **Tách repo hai tuần.** Ngày 14/7, `plans/` và history bị loại khỏi repo sản phẩm; ngày 28/7 mới đưa lại. Các file chỉ nằm ngoài repo trong hai tuần đó, như báo cáo benchmark, không tìm thấy trong lịch sử hiện tại.
4. **Kho tri thức đổi chỗ liên tục.** Trong khoảng sáu tuần có ít nhất bốn kho bài học khác nhau.

Không lựa chọn nào sai khi đứng riêng. Vấn đề là không cái nào trả lời được câu "khi hai chỗ nói khác nhau thì chỗ nào đúng".

## Nhìn lại

Lời hứa compound rất rõ: tri thức phải cộng dồn chứ không reset. Cơ chế cũng được dựng thật, có cổng và có test. Nhưng chính cơ chế đó, khi chưa có luật thẩm quyền và vị trí, đã biến "cộng dồn tri thức" thành "cộng dồn file". Bài 2 đo xem số file đã cộng dồn nhanh tới mức nào.

## Nguồn

- Câu mở bài: transcript Lead `~/.claude/projects/-home-vantt-projects-forgentX/a4954387-fafa-46d2-911f-4ea15b20d08d.jsonl` dòng 84830 (2026-11-02T03:57:15Z, tức 10:57 +07); "6 tuần" là chữ của owner (25/9 tới 2/11 là 39 ngày tính cả hai đầu). Evidence pack §6.
- 365 lên 4.301 file: R-middle §2.
- Ngày 13/7: `f6139bf57` (root), `a21d9446c` (`READEME.md`, `docs/naming.md`), `2930a89fc` (`docs/references/`, `scripts/ref-delta.sh`); R-genesis §1.
- Compound engineering: `ebc6e8047` (`docs/distillery/deep-dives/compound-engineering.md`); R-genesis §2.1.
- Luật nền: `e9ff70db7` (`docs/platform-foundations.md`, L1-L8; luật nói trên là L5; quy tắc supersede mã D-ID trong `.bee/decisions.jsonl`); bản thứ hai: `ad65f59fd` (`docs/specs/platform-foundations.md`); R-genesis §2.2, §3.7.
- Vòng dự đoán-kết quả: `dc472783c` (`work.outcome`), `96e5e3a29` (`work.friction`, năm lớp), `0228c4034` (bản ghi bài học), `15ddd61e8` (F4, "full evidence lives in the workshop's benchmark report"); R-genesis §2.3.
- Bước compound-learn: `3ee30977a` (+ `test/e2e/compound-learn-lifecycle.test.mjs`), `1739a83d5` (skill `fgos-compounding`, bốn góc Diataxis dưới `docs/<quadrant>/`); R-genesis §2.4.
- Lưu trữ: `docs/specs/<area>.md` và `work-state.md`; `.bee/decisions.jsonl`, `docs/decisions/` (`c93aa4acf`); tách repo `e99998633` / `2bbd8f70f`; kho tri thức `docs/history/learnings/`, event `.fgos`, `docs/explanation/*` (`cf27ae0b3`), `docs/knowledge/`; R-genesis §3.
- [research-261105-1411-retrospective-genesis-compound-era.md](research-261105-1411-retrospective-genesis-compound-era.md) (R-genesis); [R-middle](research-261105-1411-retrospective-middle-growth-era.md).
- [Evidence pack](retrospective-261105-1416-doc-260925-evidence-pack.md) §1, §2, §6.
