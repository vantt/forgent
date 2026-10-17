# Giải thích gói kết luận cuối cho chủ sở hữu: 4.3, Git và EventStore

Trạng thái: chỉ là khuyến nghị. Chưa có đồng thuận của hội đồng và chưa có phê duyệt của chủ sở hữu. Tôi chỉ giải thích gói đã chốt (producer/2 của run `unit-run-1792210870463-c9b2f763`, được reviewer và red-team vòng 2 đều chấm "pass"). Tôi không đổi khuyến nghị, không thêm phê duyệt và không xoá finding nào.

## 1. Câu trả lời ngắn cho các câu hỏi của chủ sở hữu

**Có nên để 4.3 đi qua rồi quay lại Git sau không?** Một nửa. Nửa Git của 4.3 chạy ngay theo plan cũ. Nửa state đóng băng. Không để toàn bộ 4.3 chạy xong rồi "quay lại Git sau", vì như vậy sẽ củng cố đúng sự ràng buộc đang muốn gỡ (phương án ALT-6, bị mọi vai và chính chủ sở hữu bác).

**Có cần bật hội đồng đánh giá EventStore trước không?** Có, nhưng chạy song song với phần Git, không chặn nó. Đây là quyết định của chính chủ sở hữu ("thả 4.3 làm theo plan cũ, bật hội đồng eventstore"), nên gói coi là quy trình ràng buộc, độ tin cậy cao.

**Vì sao EventStore bị biến dạng so với upstream?** Gốc rễ là vị trí đặt các đơn vị sự kiện còn "nóng" và còn ghi được (hot mutable shards) nằm ngay trong working tree được Git theo dõi (E1, F2). Upstream repository-harness giữ DB ngoài Git, còn đơn vị bền là changeset bất biến được commit (E2). fgOS giữ JSONL-là-sự-thật và content hash, nhưng lệch ở hai điểm: vị trí (nóng trong working tree của main) và tính bất biến (shard của phiên ghi còn mở, `merge=union`). Các cơ chế vá về sau (checkpoint, strip, union, truncation, restore) là hệ quả. Giới hạn bằng chứng: mã nguồn upstream không có trên máy này, kết luận dựa trên bản distillery và lịch sử git (E2, rủi ro dư).

**Dữ liệu có lớn đến mức cần SQL để truy vấn không?** Không. Khối lượng nhỏ (khoảng 11 MB `events.jsonl`, 24.780 dòng; 90 shard khoảng 4 MB; E4). Lý do mạnh cho DB là đồng thời, CAS và nguyên tử "capacity + claim" (F3), không phải tốc độ truy vấn.

## 2. Phán quyết, giữ nguyên

**Quy trình (độ tin cậy cao, do chủ sở hữu quyết định):**
- Lane A: đưa nửa Git của 4.3 vào ngay theo plan cũ (P03 cửa chính với fd/hook mượn và checkpoint là adapter tháo rời được, P05, P06, P07, P08, tài liệu và bằng chứng chỉ Git trong P09; ba primitive khoá repo: main-checkout, merge-target slot, worktree-admin).
- Lane B: hội đồng EventStore chạy song song.
- Lane C: sau phán quyết hội đồng, viết lại các lát state đang đóng băng (P01, P02, P04 và phần state của P00/P09) đúng một lần.

**Kiến trúc (độ tin cậy thấp đến trung bình, chưa duyệt):** hai ứng viên ngang hàng, chấm cùng một thang (bảy tư tưởng thiết kế của chủ sở hữu cộng kết quả hai thí nghiệm bác bỏ).
- Ứng viên A, hai tầng: SQLite vận hành cùng máy đặt ngoài mọi working tree của code; changeset JSON bất biến theo từng run/giao dịch đã đóng là sự thật nằm trong Git; một cửa ghi duy nhất với transactional outbox và điểm ack/khôi phục xác định; Git chỉ là bên xuất bản và không biết schema Work.
- Ứng viên B, seal-first (panelist-2): giữ engine JSONL, chuyển shard mở xuống git common-dir, niêm phong shard đã đóng thành file bất biến đánh địa chỉ theo nội dung, bỏ `merge=union`. Panelist-2 khuyến nghị B là bước một nếu cả hai thí nghiệm đạt, và SQLite chỉ khi có nhu cầu đo được.
- JSON vẫn là sự thật cuối cùng, được Git theo dõi, đúng yêu cầu của chủ sở hữu. DB (A) hoặc view cache (B) chỉ là view dựng lại được. L3 được làm rõ hoặc thay thế bằng văn bản chính xác, không sửa mơ hồ.

## 3. Mảng "missing expertise" (giữ nguyên như gói)

- Git internals (refs, plumbing, GC, clone/fetch refspec, bare/separate-git-dir/submodule topologies)
- SQLite/WAL concurrency and crash-recovery testing
- Distributed-systems/CRDT-style multi-machine conflict semantics
- Rust platform-component implementer (storage-location and session-identity ports)
- Product owner for claim/lease semantics and acceptable data-loss window (RPO)
- POSIX and cross-platform filesystem semantics (atomic rename, directory fsync, WSL/NTFS locking, cross-device links) for the seal and outbox materialize steps
- Event-log compaction and snapshot lifecycle engineering (replay growth in either candidate)

## 4. Finding có gán nguồn (các điểm cần chủ sở hữu biết)

- F1 (chủ sở hữu, framing, ba panelist, synthesizer, producer/2): tách Lane A/B/C. Ràng buộc.
- F2: vị trí đặt đơn vị nóng là lớp ràng buộc gốc.
- F4 (panelist-1, panelist-3, framing): cửa sổ crash của ghi kép (DB commit và materialize JSON) là trung tâm thiết kế; cần kill test giữa mọi cặp bước, apply idempotent theo hash, doctor thấy outbox đang chờ.
- F5: bề mặt xuất bản (state ref qua plumbing so với `.fgos/changesets` được theo dõi) và điểm ack là hai ngã rẽ thật, chưa giải quyết.
- F7: claims là lease lúc chạy (panelist-1) hay cùng giao dịch bền với work (panelist-3). Đưa ra ngoài thì phải thay thế tính nguyên tử mà `events.lock` đang cho P04.
- F8: không cứng hoá `.git/fgos/operational.db`; common-dir chỉ là mặc định đứng sau một cổng storage-location, cần kiểm tra bare, separate-git-dir, submodule.
- F9: các con số "xung đột 0.000%" và "<1.2s replay" chưa kiểm chứng, bị bác; chỉ nói "hiếm về cấu trúc".
- F10 (high, quy trình): Lane A có thể rò chính sách EventStore qua inventory stateTx của P00, adapter checkpoint của P03, cổng P09/P10, plan 6.2 P09 phụ thuộc P01+P02, và đồ thị wave cũ. Rào chắn bắt buộc: adapter checkpoint chọn-tham-gia và tháo rời được; test Lane A phải pass với adapter null; bằng chứng Git ở P09 chạy không cần `events.jsonl` hay hot-lock.
- F11 / E3: con số "43/182 bài học Git (~24%)" không tái lập được (catalogue v2 có 233-234 bài; đếm lại theo từ khoá ra 41). Dùng danh sách xoá theo họ cơ chế, không dùng phần trăm. Gói ghi rõ lần này đã sửa một overclaim bị lặp lại trước đó.
- F13: ack sau khi có ref Git cục bộ có thể tái tạo chờ-Git, chính sự chậm đang muốn thoát.
- RT-F1..RT-F5: đều đã được xử lý trong gói (nguồn gốc việc đọc panelist, đưa B về ngang hàng, thêm topology outbox vào đối tượng quyết định, thêm hai chuyên môn, thêm rào chắn Lane A).

## 5. Bất đồng chưa giải quyết (giữ nguyên, không ai bị thắng thua)

1. Panelist-2 so với panelist-1/panelist-3: seal-first đủ so với SQLite cần thiết. Cách xếp hạng A là "primary" của synthesizer chỉ là ý kiến được ghi lại, không phải quyết định.
2. Panelist-1 so với panelist-3: state ref qua plumbing/CAS (bền sau ref cục bộ) so với `.fgos/changesets` được theo dõi (bền sau khi materialize JSON).
3. Panelist-1 so với panelist-3: claims là lease runtime hay cùng giao dịch bền.
4. Panelist-1 so với framing/panelist-3: thay thế L3 chính thức hay làm rõ tại chỗ (cùng đồng ý JSON-final giữ nguyên trừ khi chủ sở hữu nói khác).
5. Chủ sở hữu: câu "db là thứ sẽ được dùng khi làm việc" mơ hồ, có thể là SQLite vận hành nhiều bảng hoặc chỉ là cache view đã làm mới. Cần chính lời của chủ sở hữu.

## 6. Bằng chứng và độ mạnh

Bằng chứng E1-E8 trong gói gồm: cơ chế ràng buộc (có commit và đường mã), khối lượng dữ liệu (đo trên máy này), claims đã nằm ở `.fgos/runtime/claims` (đường mã), ngưỡng xem xét của L3 đã chạm (văn bản spec), `compactColdWriterFiles` không có nơi gọi production (nén chưa là năng lực giao), và chỉ có một worktree lúc dò nên hành vi đa worktree, bare, separate-git-dir, submodule chưa được chứng minh (E8). Panel không có prototype hay benchmark nào: sự đồng thuận đa số giữa các panelist là một cụm thiết kế, không phải kết quả thực nghiệm.

## 7. Điểm cần đọc cẩn thận trong các bước kiểm tra (không đổi phán quyết)

- Gói producer/2 tự thú đã đọc panelist-3 chỉ đến khoảng dòng 130 cộng tìm kiếm có mục tiêu; red-team nói đã tự đọc dòng 130-282 và thấy không méo. Hai điều này nhất quán nhưng độ bao phủ của red-team là lời khai của red-team, chưa được tôi kiểm lại độc lập.
- Reviewer ghi "18 đối tượng quyết định" và gọi topology outbox là "mục 16"; trong gói thực tế có 19 mục và topology outbox là mục thứ 17. Chỉ là lệch đếm, không ảnh hưởng nội dung.
- Reviewer ghi ALT-1 là "xếp hạng primary bởi synthesizer", trong khi gói nói rõ không chấp nhận xếp hạng đó làm mặc định. Gói là nguồn có thẩm quyền.
- Red-team kết luận "không còn lỗ hổng nào" là diễn đạt mạnh hơn mức gói tự thừa nhận: gói vẫn liệt kê 13 rủi ro dư. Red-team cũng liệt một "named default" thứ bảy (không daemon ma, giới hạn latency CLI) mà gói producer/2 không có ở dạng default; trong gói nó chỉ là đối tượng quyết định và rủi ro. Cả hai không đổi khuyến nghị.
- Tôi chỉ đọc lại gói cuối cùng và các đánh giá reviewer/red-team vòng 2; các báo cáo trung gian (framing, panelist, critique) tôi không đọc lại, nên nội dung về chúng ở đây dựa vào cách gói cuối trích dẫn.

## 8. Một hành động tiếp theo, đảo ngược được

Mở hội đồng EventStore (Lane B), dùng chính gói này làm brief, với hai ứng viên A và B ngang hàng, 19 đối tượng quyết định và thang chấm chung đã thống nhất trước khi chấm. Đây là hành động chỉ-đọc và đảo ngược được: không đụng code, không đụng dữ liệu, có thể dừng hay thu hẹp lúc nào cũng được, và Lane A vẫn tiến song song dưới rào chắn adapter null. Hội đồng cũng nên chạy hai thí nghiệm bác bỏ (di chuyển shard mở qua registry và đếm bài học Git chết; seal/merge hai worktree cùng crash giữa seal và rename) như bằng chứng chung, phi sản xuất, giới hạn thời gian, không chặn Lane A.

## 9. Bẫy cần lường (rủi ro dư chính)

- Lane A rò chính sách EventStore và làm lệch hội đồng.
- Ack một mutation khi JSON vẫn có thể mất thì DB thành sự thật thật sự, trái ý chủ sở hữu.
- SQLite và JSON không thể là một giao dịch ACID; giao thức outbox chưa chứng minh được cho đến khi có kill test.
- Topology drain outbox chưa xác định: fsync đồng bộ mỗi lệnh CLI có thể làm chậm Ship Faster; drainer tách rời có nguy cơ tiến trình ma, trái quy tắc process-management.
- Hành vi rename và fsync thư mục khác nhau giữa POSIX, APFS, WSL/NTFS.
- Replay tăng không giới hạn vì nén chưa giao.
- Plan 6.2 P09 tạo áp lực nới đóng băng state sớm.

## 10. Điều kiện đảo ngược (rút gọn)

Nếu cả hai thí nghiệm đạt, RPO của shard mở chấp nhận được và claim+capacity không cần khoá mới, chọn seal-first. Nếu tải đo được cần nguyên tử đa bảng, chuyển sang SQLite hai tầng. Nếu kill test cho thấy outbox không đóng được cửa sổ crash, xem lại điểm ack hoặc bỏ A. Nếu chủ sở hữu nói DB phải là sự thật chính thức, thay thế L3 một cách tường minh. Nếu kiểm tra hệ tệp hay topology thất bại trên nền tảng được hỗ trợ, đổi mặc định vị trí hoặc giao thức seal/outbox. Nếu kiểm toán bài học Git cho số khác hẳn, đổi kích thước G0.

## Câu hỏi còn mở

- "DB khi làm việc" nghĩa là SQLite vận hành nhiều bảng hay cache view? (cần lời chủ sở hữu)
- Bề mặt xuất bản và điểm ack: state ref hay `.fgos/changesets`; sau ref cục bộ hay sau materialize JSON?
- Claims là lease runtime hay cùng giao dịch bền? Cần chủ sở hữu sản phẩm định nghĩa RPO chấp nhận được.
- Làm rõ hay thay thế L3 bằng văn bản và ID nào?
