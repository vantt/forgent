# Phase 09 — Skill `fgos-coding-knowledge` — registry-first

> Đọc file này + các link trong nó là đủ để làm. Không cần đọc lại toàn bộ
> `docs/history/compound-learn-artifact-registry/DISCUSSION.md` (1700+ dòng).

**Chặn bởi:** **phase 06** (cổng cứng #2)
**Là cổng cho:** phase 10
**Rủi ro:** standard

## Context

- Thiết kế: `docs/history/compound-learn-artifact-registry/DISCUSSION.md` §7 mục **A4** (`#task-writer-skill`), mục Vocabulary.
- D-ID: **D-tsk28x-10** (contract hai trục), **D-tsk28x-3** (trục cách viết là
  registry mở nhiều framework), **D-tsk28x-16** (đổi tên skill), **D-tsk28x-17**
  (luôn provisional trước).
- **Phải chạy SAU phase 06.** Writer là prose — nó không phải hàng rào; hàng rào
  là verb. Nhưng đổi writer trước khi verb chặn được thì vẫn hở.

## Requirements — đúng khi nào thì xong

1. Đổi tên thư mục skill: `fgos-coding-compounding` → **`fgos-coding-knowledge`**,
   ở **cả hai** `.agents/skills/` và `.claude/skills/` (mirror byte-identical).
2. Luồng mới thay hẳn "chọn quadrant + tự đặt path":
   ```
   1. resolve topic + role
   2. cần doc mới  ->  fgos doc reserve <topicId> <role> <currentPath>
   3. write + commit file tại currentPath
   4. fgos knowledge attest --doc-path currentPath
   5. doc.mark-rendered -> provisional        (LUÔN, D-tsk28x-17)
   6. fgos doc promote -> active              (hành động RIÊNG, không tự động)
   ```
3. Ba nhánh theo độ chắc của match:
   - **match chắc** ⇒ grow đúng doc hiện có;
   - **match yếu** ⇒ ghi `provisional`, **không** mở topic chính thức mới;
   - **không match** ⇒ tạo topic ứng viên trạng thái chờ, **không** tự coi là sự
     thật đã công nhận.
4. Muốn topic mới ⇒ **phải qua `fgos topic register`**, không tự mở thư mục lặng lẽ.
5. Giữ nguyên luật hiện hành **write first, tag second** (retrospective-doc-write-path
   D1/D3 — 34 tài liệu từng mất vì thứ tự ngược).
6. Path là **projection**: `docs/<purposeSlug>/<role>.md`. Diataxis **chỉ** nằm
   trong frontmatter (`framework: diataxis`, `mode: explanation`).
7. Hard rule cũ "không viết ngoài `docs/<quadrant>/`" bị thay bằng "không viết
   ngoài `currentPath` mà registry cấp".

## Files

**Đổi tên + sửa:**
- `.agents/skills/fgos-coding-compounding/SKILL.md` → `.agents/skills/fgos-coding-knowledge/SKILL.md`
- `.claude/skills/` mirror (byte-identical)

**Sửa:**
- `AGENTS.md` / `docs/specs/reading-map.md` nếu có nhắc tên skill cũ.

**Tạo:**
- `test/skills/fgos-coding-knowledge.test.mjs`
  (khuôn có sẵn: `test/skills/fgos-coding-compounding-doc-write-path.test.mjs`)

## Implementation steps

1. Đọc `.agents/skills/fgos-coding-compounding/SKILL.md` bước 2-4 hiện tại — đó
   là chỗ chọn quadrant, `fs.existsSync` grow-vs-create, và `fgos compound`.
2. Thay bước "Detect grow-vs-create by file existence" bằng **hỏi registry**.
   Câu đầu tiên skill hỏi không còn là *"file path nào?"* mà là *"capture này map
   vào topicId nào, role nào, doc nào?"*.
3. Giữ nguyên phần MERGE_HEAD refusal và thứ tự commit-trước-tag — đó là hai bug
   thật đã trả giá (tsk-2oy 5 lần; 34 tài liệu mất).
4. Cập nhật Red flags: thêm "tự đặt tên file thay vì hỏi registry", "promote tự
   động thay vì để `fgos doc promote` riêng".
5. `test/skills/` kiểm prose — xem khuôn `docs/how-to/write-verify-for-a-skill-prose-change.md`.

## Tests

- skill prose có bước `doc reserve` trước khi ghi file.
- skill prose **không còn** `fs.existsSync` làm cơ chế grow-vs-create.
- skill prose giữ write-first-tag-second.
- skill prose không tự `promote`.
- `.claude/` và `.agents/` mirror **byte-identical**.
- không còn tham chiếu `fgos-coding-compounding` nào trong skill roster.

## Risks & rollback

- **Mirror lệch.** Hai cây skill phải byte-identical; lệch là bug âm thầm. Có
  test riêng cho việc này.
- Đổi tên skill lần thứ hai trong hai tuần (lần trước `fgos-compounding` →
  `fgos-coding-compounding`). Chấp nhận vì phase này viết lại nội dung skill anyway.
- Rollback: prose-only, revert commit là đủ.
