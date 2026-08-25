# Phase 10 — Writer canary — cổng cứng trước migration

> Đọc file này + các link trong nó là đủ để làm. Không cần đọc lại toàn bộ
> `docs/history/compound-learn-artifact-registry/DISCUSSION.md` (1700+ dòng).

**Chặn bởi:** phase 09
**Là cổng cho:** **phase 11** (cổng cứng #3)
**Rủi ro:** heavy

## Context

- Thiết kế: `docs/history/compound-learn-artifact-registry/DISCUSSION.md` §7 mục **A6** (`#task-writer-canary`).
- **Vì sao cần:** migration tooling và writer skill là hai thứ khác nhau (tách ra
  cho an toàn — conservation của migration không nên phụ thuộc hành vi prose của
  một skill). Nhưng tách thì **mất phép thử dogfood đầu tiên của writer**. Canary
  là chỗ lấy lại nó.
- **Đây là CỔNG, không phải bước tuỳ chọn:** migration (phase 11) **chỉ được chạy
  sau khi canary xanh**.

## Requirements — đúng khi nào thì xong

1. Một retrospective item **thật**, hoặc một fixture e2e chuyên dụng, đi qua
   **toàn bộ** đường writer mới:
   ```
   fgos topic register / fgos doc reserve
   write một doc MỚI trong layout mới docs/<purposeSlug>/<role>.md
   fgos knowledge attest  --> THÀNH CÔNG, và thành công CHỈ VÌ registry có currentPath
   doc chuyển sang provisional
   fgos doc-sources <currentPath>  --> trả về capture
   fgos docs-index                --> hiện doc có registry đỡ lưng
   ```
2. Phải chứng minh **writer MỚI biết registry**, không phải chỉ migration tooling
   biết registry.
3. Nhỏ, riêng, **không lẫn vào fold 268 file**.

## Files

**Tạo:**
- `test/e2e/knowledge-writer-canary.test.mjs`
  (khuôn: `test/e2e/compound-learn-lifecycle.test.mjs`, `test/e2e/pr-gate.test.mjs`
  — repo git tạm, binary thật, không mock)

**Cân nhắc:**
- `dogfood-fixture/scenarios/` nếu làm scenario replay thay vì e2e test.

## Implementation steps

1. Đọc `test/e2e/compound-learn-lifecycle.test.mjs` — nó đã dựng sẵn repo git tạm
   + chạy binary thật. Mirror khuôn đó.
2. Dựng một item giả tới `retrospective`, có capture thật.
3. Chạy đủ chuỗi ở Requirements §1 bằng **binary thật**, không gọi hàm nội bộ —
   canary phải chứng minh đường CLI hoạt động, không phải logic đơn lẻ.
4. **Kiểm ngược:** thử `attest` với một path tự đặt (không reserve trước) và
   khẳng định nó **bị từ chối**. Không có bước này thì canary không chứng minh
   được "thành công CHỈ VÌ registry có currentPath".
5. Ghi kết quả canary vào report để phase 11 tham chiếu.

## Tests

- chuỗi đầy đủ chạy xanh trên binary thật.
- **ca ngược**: path không reserve ⇒ `attest` từ chối.
- doc kết thúc ở `provisional`, **không** tự lên `active`.
- `doc-sources <currentPath>` trả đúng capture của item đó.
- `docs-index` hiện doc mới với `topicId` không rỗng.

## Risks & rollback

- **Canary xanh giả**: nếu test tự tạo registry row bằng đường nội bộ thay vì
  `fgos doc reserve`, nó chứng minh sai thứ. Bắt buộc dùng CLI thật.
- Rollback: test-only.
