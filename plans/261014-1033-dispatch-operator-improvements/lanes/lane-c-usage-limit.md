# Lane C — nhận diện hết hạn mức (usage limit)

Nhánh: feat/dispatch-usage-limit. Đọc lanes/common.md trước.
**Cần council trước khi viết code.**

7. Một lượt Codex hết hạn mức mà `execute` vẫn trả exit 0, Lead đọc nhầm là xong. Cần: trạng thái kết quả riêng (vd. `usage-limited`) kèm giờ thử lại đọc từ output provider; cân nhắc tự hẹn chạy lại.

Trình tự:
1. Tái hiện/chứng minh: tìm bằng chứng output thật của lượt hết hạn mức (log dispatch trong .fgos/logs, run evidence) — đừng in credential. Xác định vì sao classifier hiện tại (provider-capacity.mjs, usage-parsers.mjs, run-result.mjs, provider-auth-failure.mjs) bỏ sót. Prior art: đã có quota quarantine (xem git log -G'quota' và memory "quota quarantine") — dùng lại.
2. Council: chạy panel thiết kế qua skill `fgos-architecture-panel` (hoặc `fgos-advise` nếu panel không hợp) với câu hỏi: trạng thái mới đặt ở đâu trong contract kết quả, quan hệ với quota quarantine/account rotation hiện có, và có nên tự hẹn chạy lại không (ai giữ lịch hẹn, durable thế nào, liên quan "Release con người").
3. Viết plan riêng: path từ `fgos convention path --kind plan --slug dispatch-usage-limit`, link báo cáo council. Commit plan trên nhánh lane.
4. Nếu council có hướng thắng rõ → làm. Nếu các hướng ngang nhau (nhất là chuyện tự hẹn chạy lại) → làm phần chắc chắn (trạng thái + giờ thử lại), dừng phần còn lại với câu hỏi quyết định theo mẫu.

## Cập nhật sau hội đồng một-cửa (2026-10-14 12:40) — THU HẸP, thay thế mục 7 ở trên

Đọc reports/council-261014-1231-dispatch-one-door-conclusion.md. Gỡ lệnh chờ trong phạm vi dưới:
- Classifier chạy được cả khi không có lease (`settlement.mjs:600`), chỉ đọc đầu vào RUL65b cho phép (`docs/specs/runner.md:1024`): stderr độ tin cậy cao của provider, outcome adapter đã biết (vd. paused-limit), JSON có cấu trúc của agent (vd. stopReason). KHÔNG đọc stdout chung — câu "giờ thử lại đọc từ output provider" ở trên bị bỏ.
- Giờ thử lại chỉ khi provider có tín hiệu cấu trúc; quarantine dùng lại provider-limit + `until` sẵn có, không trạng thái song song.
- Tự hẹn chạy lại: KHÔNG làm ở lane này (thuộc Workflow runner, câu hỏi quyết định riêng). Nếu plan riêng của lane có Phase làm việc đó thì bỏ phase đó.
- Nếu cần đọc stdout mới bắt được Codex hết hạn mức: dừng, ghi bằng chứng, hỏi Lead (phải có quyết định thay RUL65b).
