# Lane D — ranh giới ghi: confined cho lượt docs-only, và báo nhầm "ghi ra ngoài workspace"

Nhánh: feat/dispatch-write-boundary. Đọc lanes/common.md trước.
**Cần council trước khi viết code.**

6. Lượt Doer chỉ ghi trong plans/ hoặc docs/ của worktree nên chạy trong vùng ghi bị giới hạn sẵn (confined), không chỉ nhờ lời dặn.
8. Bộ kiểm tra "ghi ra ngoài workspace" (evidence-attribution.mjs và chỗ dùng trong cli.mjs) coi mọi file đổi trên main trong lúc Doer chạy là do Doer, kể cả file của phiên khác → từ chối cả lượt. Cần: chụp trạng thái main lúc bắt đầu và chỉ tính file do chính tiến trình executor ghi, hoặc hạ thành cảnh báo.

Chồng việc: nhánh fix/dispatch-followups (Việc 2) đang thiết kế đường giao việc chỉ đọc có sandbox + ghim provider (`execute --contract` qua confinement). Đề xuất 6 cùng vùng confinement. Đọc nhánh đó (`git log main..fix/dispatch-followups`, báo cáo trong plans/reports/ nếu có) trước khi thiết kế.
Thứ tự:
1. Chứng minh đề xuất 8 bằng một ca thật hoặc test tái hiện (file của phiên khác đổi trong lúc Doer chạy).
2. Council qua `fgos-architecture-panel`: (a) cách quy trách nhiệm ghi cho đúng tiến trình executor (snapshot + diff, theo dõi tiến trình, hay chỉ dựa vào sandbox), từ chối hay cảnh báo; (b) docs-only confined là một capability/khai báo `writes:` hẹp hay một mode riêng — dựa trên RUL76/RUL77 và kết quả Việc 2.
3. Viết plan riêng: path từ `fgos convention path --kind plan --slug dispatch-write-boundary`, link báo cáo council. Commit trên nhánh lane.
4. Code: đề xuất 8 làm được ngay nếu không đụng vùng Việc 2. Đề xuất 6 chỉ sửa code sau khi fix/dispatch-followups đã merge vào main (kiểm `git branch --merged main`); nếu chưa, dừng sau plan với Status: BLOCKED và nói rõ đang chờ gì, rồi rebase khi đã merge.

## Cập nhật sau hội đồng một-cửa (2026-10-14 12:40) — thay thế thứ tự ở trên

Đọc reports/council-261014-1231-dispatch-one-door-conclusion.md. Gỡ lệnh chờ cho hai việc dưới; #6 vẫn chờ owner.
1. (bước 1 của hội đồng) Sửa `RunResult.confinement` luôn null: predicate `settlement.mjs:697` so mode `'confined'` không tồn tại (`confinement/policies.mjs:68`), và requirement là biến cục bộ không tới settlement (`assignment-runner.mjs:1472-1484`). Nhãn lấy từ backend thật đã chạy, không từ mode yêu cầu. Test contract: non-null khi bwrap chạy, null khi thật không sandbox. Chỉ là provenance backend, không phải quy trách nhiệm ghi.
2. (bước 2, đề xuất 8) Đưa kiểm tra ghi-lạc / read-only-mutation về settlement qua attribution ladder: correlated → **warning**. Phát hiện RT2-3 (mức cao): liệt kê và xử lý MỌI đường refuse, không chỉ attribution — `evidence-attribution.mjs:195-205`, `settlement.mjs:291-300`, `run-result.mjs:528-531`, `cli.mjs:883-885` (`strayWriteError`). Test hồi quy end-to-end "phiên không liên quan commit lên main giữa lượt" ở bước warning (execStatus, failure, policy cuối), dùng ca thật wf-run-1791954133905-844903ed. Giữ test từ chối cho trường hợp ghi đã chứng minh. Không xây observer ghi-path (việc mới, câu hỏi riêng).
3. #6 docs-only: KHÔNG làm cho tới khi owner nhận hướng Q4. Không xây bwrap subpath.
