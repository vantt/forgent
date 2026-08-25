# Phase 12 — Deprecate `fgos compound` → `fgos knowledge attest`

> Đọc file này + các link trong nó là đủ để làm. Không cần đọc lại toàn bộ
> `docs/history/compound-learn-artifact-registry/DISCUSSION.md` (1700+ dòng).

**Chặn bởi:** phase 11
**Là cổng cho:** —
**Rủi ro:** heavy

## Context

- Thiết kế: `docs/history/compound-learn-artifact-registry/DISCUSSION.md` §7 mục **A7** (`#task-compound-deprecation`), mục Vocabulary.
- D-ID: **D-tsk28x-16** (gộp vào `tsk-28x`, không tách item).
- **Đứng cuối có chủ đích:** đánh dấu deprecated trước khi `knowledge attest` thật
  sự thay được việc của nó là hứa suông với người dùng.

## Requirements — đúng khi nào thì xong

1. `fgos compound` đánh dấu `deprecated` trong `src/cli/command-registry.mjs`,
   trỏ sang `fgos knowledge attest`.
2. **GIỮ `fgos compound` chạy được** ít nhất một chu kỳ phát hành — verb đã ship,
   AGENTS.md đòi giữ public contract trừ khi thay đổi là có chủ đích và đã được
   chấp nhận. **Deprecate ≠ xoá.**
3. Cập nhật spec + hard rule:
   - `docs/specs/enduser-docs-authoring.md` → đổi tên **`docs/specs/knowledge.md`**;
     **R4** (grow-vs-create theo tồn-tại-tệp) và **R5** (Diataxis là trục cấu trúc
     duy nhất) đều bị thay; § Open Gaps còn viết "mới ngăn how-to có tài liệu thật"
     — sai từ lâu.
   - `src/report/enduser-index.mjs` — `QUADRANT_DIR_ALIASES` đổi vai.
   - `docs/specs/reading-map.md` + `system-overview.md` § Area Map — thêm area
     **`knowledge`**.
   - Thêm mục **"Knowledge surfaces"** trong `docs/specs/knowledge.md` liệt kê đủ
     ba mặt (`topic`, `doc`, `knowledge`) — chống ba namespace trôi thành ba subsystem.
4. **Một dòng trong `CHANGELOG.md` `## [Unreleased]`** — đây là thay đổi người
   dùng fgOS thấy được (AGENTS.md).

## Files

**Sửa:**
- `src/cli/command-registry.mjs`
- `docs/specs/enduser-docs-authoring.md` → `docs/specs/knowledge.md`
- `docs/specs/reading-map.md`, `docs/specs/system-overview.md`
- `CHANGELOG.md`
- ~55 file tham chiếu `compound` (phần lớn là prose skill/test cần đổi tên,
  không phải logic)

**Verify:** `node --test test/cli/fgos-manifest.test.mjs`

## Implementation steps

1. **Đây là lần ĐẦU TIÊN đường deprecation được dùng trong repo** — field
   `deprecated` có trong schema `command-registry.mjs` nhưng **mọi verb hiện đều
   `null`**. Nên phải kiểm bằng tay ba thứ trước khi tin:
   - verb deprecated **còn chạy được** không;
   - `fgos --help [--json]` render nó ra sao;
   - `test/cli/fgos-manifest.test.mjs` (test chống-lệch sổ verb) có bắt không.
2. Grep 55 file tham chiếu, đổi tên **có chọn lọc**: prose và test đổi; **văn bản
   lịch sử trong `docs/history/` KHÔNG đổi** — §5 của DISCUSSION.md là log
   append-only, các vòng 1-9 thật sự đã dùng tên đó.
3. Thêm dòng glossary vào `docs/specs/knowledge.md`:
   *"`compound` (thuật ngữ cũ) = tên cũ của đường retrospective knowledge synthesis
   / doc attestation. Kể từ D-tsk28x-16 nó là `knowledge`."*
4. Cập nhật `docs/decisions/index.md` nếu cần (`fgos decision-index`).

## Tests

- `fgos compound` **vẫn chạy** và vẫn cho kết quả đúng.
- `fgos --help --json` hiện `deprecated` không null cho `compound`.
- `fgos-manifest.test.mjs` xanh.
- `check-decision-citation-drift` xanh.
- `doctor` xanh (gồm `decision-index-stale`).
- không còn tham chiếu `fgos-coding-compounding` trong `src/`, `.agents/`, `.claude/`
  (trừ `docs/history/`).

## Risks & rollback

- **Xoá nhầm thay vì deprecate.** Verb đã ship; xoá là breaking change không ai
  chấp nhận trong phase này.
- **Đổi tên trong `docs/history/`** sẽ viết lại lịch sử — cấm.
- Rollback: đặt `deprecated: null` lại; prose revert bình thường.
