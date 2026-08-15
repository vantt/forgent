# CONTEXT: tsk-4nf — how-to doc: node --test --test-name-pattern vacuous-pass trap

## Feature boundary

Viết đúng 1 file mới `docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md`
ghi lại trap thật gặp lúc làm tsk-580: `node --test --test-name-pattern="<p>"
<file>` khi pattern không match test con nào bên trong vẫn báo `tests 1 /
pass 1 / fail 0` (đếm chính file như 1 test wrapper). Không sửa code, không
đổi verify của item nào khác — thuần tài liệu.

## Locked decisions

| D-ID | Quyết định |
|------|-----------|
| D1 | Nội dung trích từ bằng chứng thực nghiệm đã có sẵn ở `docs/history/tsk-580/plan.md` (phần "Verify cho tsk-580 — sửa lại tại fgos-coding-validating") và `docs/history/tsk-580/iron-law-evidence.md` — không tự phát minh ví dụ mới, dùng lại đúng transcript thật đã chạy. |
| D2 | Format theo đúng khuôn 2 how-to doc chị em hiện có (`close-out-a-goaltier-milestone-after-all-targets-are-done.md`, `close-out-a-decomposed-root-item-after-all-children-are-done.md`): "Use this when...", "Steps", "Real example", "Why this doesn't happen automatically"/tương đương, "Related". |
| D3 | Liên kết 2 chiều: doc mới trỏ về `docs/history/tsk-580/`; không sửa 2 how-to doc close-out hiện có (out of scope — đã deferred lúc plan tsk-580, không phải việc của item này). |

Không có câu hỏi nào cần hỏi thêm — nội dung, bằng chứng, format đều đã có
sẵn, đây là việc chép/tổng hợp lại cho dễ tìm, không phải quyết định sản
phẩm mới.

## Scout evidence

- `docs/history/tsk-580/plan.md` — phần "Verify cho tsk-580" có transcript
  thật (2 lần chạy `node --test --test-name-pattern`, so sánh count).
- `docs/history/tsk-580/iron-law-evidence.md` — transcript RED/GREEN thật.
- `docs/how-to/close-out-a-goaltier-milestone-after-all-targets-are-done.md`
  — mẫu format tham chiếu (D2).
