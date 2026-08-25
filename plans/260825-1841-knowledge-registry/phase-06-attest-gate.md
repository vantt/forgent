# Phase 06 — `fgos knowledge attest` + registry gate + enforcement

> Đọc file này + các link trong nó là đủ để làm. Không cần đọc lại toàn bộ
> `docs/history/compound-learn-artifact-registry/DISCUSSION.md` (1700+ dòng).

**Chặn bởi:** phase 04, 05
**Là cổng cho:** **phase 09** (cổng cứng #2)
**Rủi ro:** heavy

## Context

- Thiết kế: `docs/history/compound-learn-artifact-registry/DISCUSSION.md` §7 mục **A3b** (`#task-compound-registry-gate`) — *task chốt
  của cả kế hoạch*.
- **Vì sao phải là verb, không phải thứ tự triển khai:** writer là **skill prose**,
  không gì cưỡng chế nó. Chỉ producer verb chặn được. Khuôn có sẵn: `fgos compound`
  đã từ chối `--doc-path` không resolve trong HEAD (retrospective-doc-write-path D3).

## Requirements — đúng khi nào thì xong

1. `fgos knowledge attest --doc-path <path>` phải thoả **cả bốn**:
   ```
   1. <path> đã commit tại main HEAD              (đã có sẵn — D3)
   2. doc registry enforcement đang bật
   3. <path> là currentPath của một live doc slot trong registry
   4. <path> KHÔNG chỉ là alias
   ```
2. **Điều kiện (4) là chỗ bịt kín.** Sau migration, alias **có** trong registry —
   thiếu điều kiện này thì skill cũ tự đặt lại đúng old path sẽ được resolver tha
   và sprawl quay lại qua chính cửa vừa khoá. **Alias chỉ dùng đọc/resolution lịch
   sử, không bao giờ để tag capture mới.**
3. `attest` **không tự tạo registry row** — nó chỉ kiểm. Tạo row là việc của
   `doc.reserve` (phase 05).
4. Config default **`doc-registry.enforce`** phải đăng ký vào **cả hai**:
   `registerConfigDefault(...)` và `registerCheck(...)` trong
   `src/setup/registrations.mjs` — AGENTS.md § install/setup/doctor gate cấm một
   config default đứng một mình, `doctor` không thấy.
5. Thông điệp từ chối phải **nêu cách sửa**, trỏ thẳng `fgos doc reserve`.

## Files

**Sửa:**
- `bin/fgos.mjs` + `src/cli/command-registry.mjs` — verb `knowledge attest`.
- `src/setup/registrations.mjs` — `registerConfigDefault` + `registerCheck` cho
  `doc-registry.enforce`.

**Tạo:**
- `test/cli/knowledge-attest-gate.test.mjs`

⚠️ `bin/fgos.mjs` — xung đột với phase 05, 07.

## Implementation steps

1. Đọc code hiện tại của `fgos compound` trong `bin/fgos.mjs` (kiểm HEAD).
   `knowledge attest` **giữ nguyên** kiểm đó rồi **thêm ba tầng còn lại**.
2. Tầng (4): resolve path qua registry (phase 02). Nếu nó khớp **alias** chứ không
   phải `currentPath` ⇒ từ chối, và nêu `currentPath` thật trong thông điệp.
3. `registerConfigDefault({ id: 'doc-registry', key: 'docRegistry', shape: { enforce: false } })`
   — **mặc định `false`**, bật ở bước triển khai riêng, để phase này landed được
   mà chưa khoá ai.
4. `registerCheck({ id: 'doc-registry-enforce', ... })` báo trạng thái enforce +
   độ phủ registry.
5. Chỉ **sau** khi bootstrap (phase 04) xong mới bật `enforce: true` trong config
   thật — đây là bước vận hành, ghi rõ trong CHANGELOG.

## Tests

Đủ **sáu** ca gate:
```
attest rejects committed path not in registry
attest accepts registered currentPath committed at HEAD
attest rejects ALIAS path for a new tag
attest rejects registered path if not committed at HEAD
attest rejects second active doc for same (topicId, role)
doc.reserve is the ONLY way to hold a new path before the file exists
```
**Regression đóng đúng cửa sổ hở:**
```
legacy writer tự đặt tên docs/explanation/new-random.md
file được commit thật
attest TỪ CHỐI vì path không phải registry currentPath
```
Cộng: `doctor` thấy `doc-registry-enforce`; `fgos setup` merge được config default.

## Risks & rollback

- **Bật `enforce` trước khi bootstrap xong = khoá chết mọi retrospective item.**
  Mặc định `false` là để tránh đúng chuyện đó. Đừng đổi mặc định trong phase này.
- Item đang dở dang lúc flip: thông điệp từ chối phải đủ rõ để người tự gỡ bằng
  `fgos doc reserve`, không phải đọc source mới hiểu.
- Rollback: đặt `enforce: false` là gỡ khoá tức thì, không cần revert code.
