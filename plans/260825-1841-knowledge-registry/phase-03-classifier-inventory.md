# Phase 03 — Classifier / inventory đọc-thuần trên 268 tài liệu

> Đọc file này + các link trong nó là đủ để làm. Không cần đọc lại toàn bộ
> `docs/history/compound-learn-artifact-registry/DISCUSSION.md` (1700+ dòng).

**Chặn bởi:** —  (chạy song song được với phase 01/02)
**Là cổng cho:** **phase 04, 11**
**Rủi ro:** standard

## Context

- Thiết kế: `docs/history/compound-learn-artifact-registry/DISCUSSION.md` §7 mục **A2b** (`#task-classifier-inventory`).
- D-ID phải tuân: **D-tsk28x-11** (pha phân loại CHÍNH LÀ pass bottom-up sinh
  vocabulary — một việc, không phải hai), **D-tsk28x-18** (nó phải chạy TRƯỚC
  bootstrap vì output của nó *là* dữ liệu bootstrap).
- **Task này gánh hai việc mà trước đây tưởng là hai.** Đây là lần thứ ba trong
  thảo luận này hai việc tưởng rời hoá ra là một.

## Requirements — đúng khi nào thì xong

1. Đọc toàn bộ tài liệu end-user hiện có (`docs/how-to/`, `docs/explanation/`,
   `docs/reference/`, `docs/tutorial(s)/`, cộng vị trí thay thế trong
   `QUADRANT_DIR_ALIASES` của `src/report/enduser-index.mjs`).
2. Sinh cho **từng file**:
   ```
   topicId | purposeSlug | role | entities[] | framework | mode | targetPath
   ```
3. **Mỗi lần gán phải kèm `confidence` + `evidence`** (trích đoạn thật trong file
   làm căn cứ). Trả nhãn trần là không đạt — phase 06 cần confidence để phân biệt
   match chắc / match yếu / không match.
4. **Đọc-thuần tuyệt đối**: không sửa tài liệu, không ghi registry, không tạo file
   trong `docs/`. Output là một report + một file dữ liệu.
5. Sinh kèm **danh sách `role` ứng viên** và phân bố của chúng — đây là vocabulary
   để chủ sản phẩm chốt (Câu A vòng 9: bottom-up, không liệt kê tay).

## Files

**Tạo:**
- `scripts/knowledge-classifier.mjs` (KHÔNG nằm trong `package.json` `files` —
  không ship; khuôn: `scripts/probe-storytelling-material.mjs` của `tsk-1hy`)
- `test/scripts/knowledge-classifier.test.mjs`
- Output: `docs/history/compound-learn-artifact-registry/reports/` (report người đọc)
  + một JSON dữ liệu cho phase 04 tiêu thụ.

## Implementation steps

1. Đọc `scripts/probe-storytelling-material.mjs` (từ `tsk-1hy`) làm khuôn: script
   đọc-thuần, output report + dữ liệu, có test riêng.
2. Gom danh sách file qua `QUADRANT_DIR_ALIASES` để không sót vị trí thay thế
   (hiện `explanation` → cũng quét `docs/decisions/`).
3. Với mỗi file: đọc frontmatter (dùng `src/report/frontmatter.mjs`) + nội dung,
   suy `(purposeSlug, role, entities[])`. **`authoritative_for` nếu có là tín hiệu
   mạnh nhất** — 67 file đã mang sẵn.
4. `role` phải tuân **Q4**: không được trùng tên bất kỳ quadrant/mode Diataxis nào.
   Nếu candidate ra `reference`, đổi tên (vd. `lookup-table`) và ghi rõ trong report.
5. Sinh `targetPath = docs/<purposeSlug>/<role>.md`.
6. Report phải nêu: phân bố role, phân bố purpose, số file mỗi target, và **danh
   sách target sẽ vượt ngưỡng độ dài** (đầu vào để chốt ngưỡng `doc-topic-oversized`).

## Tests

- chạy trên fixture nhỏ (5-10 file giả) cho ra bảng gán đúng shape.
- mọi dòng output có `confidence` và `evidence` không rỗng.
- không file nào trong `docs/` bị sửa (so hash trước/sau).
- `role` sinh ra không trùng `tutorial|how-to|reference|explanation`.
- file có `authoritative_for` được ưu tiên dùng nó làm căn cứ purpose.

## Risks & rollback

- **Cỡ mẫu.** Thảo luận này đã hai lần rút kết luận vì suy rộng từ mẫu nhỏ. Report
  phải nói rõ độ phủ và chỗ nào classifier không chắc, thay vì trình bày như đã
  chắc hết.
- **Đừng chốt vocabulary trong phase này.** Nó *đề xuất*; chủ sản phẩm chốt.
- Rollback: đọc-thuần, không có gì để rollback.
