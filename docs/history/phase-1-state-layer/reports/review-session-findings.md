# Review Session Findings — review-phase-1-state-layer-260714

Date: 2026-07-14 · Scope: e9ff70d..ad65f59 (feature phase-1-state-layer, 40 files ±2346) · Panel: 4 core + api-contract (đều opus, ngữ cảnh cô lập) + evidence/artifact scan.

## Kết quả tổng

**P1: 0 · P2: 4 · P3: 7** (sau khử trùng lặp; 2 finding được corroborate chéo bởi 2 reviewer độc lập).

Cổng bằng chứng: cả 4 cell behavior-change có verify output thật + red-before, 0 frozen-judge hit. Artifact: 17/17 EXISTS+SUBSTANTIVE, mọi key link WIRED. Cả 5 bất biến khóa (một cửa ghi · fsm/replay thuần · event-trước-view-sau · phẳng+deps · không rò Phase 2) được architecture reviewer xác minh trên source. Điểm mạnh cấu trúc: không code nào đọc lại `state.json` — đường đọc duy nhất là event log, nên view rách không thể làm hỏng truth.

## P2 (không chặn merge, đã vào backlog)

1. **`move` để lọt input hỏng sang sai phạm trù mã thoát** *(corroborated: api-contract + code-quality; gated_auto)* — parser coerce cờ trống thành `true`/`''`: `fgos move x --to` → exit 2 (precondition), `--expect ""` → exit 3 (conflict) thay vì 4 (validation). Client theo R4 sẽ đọc nhầm thành "có writer khác đụng". Fix một dòng ở verb move. Ghi chú severity: giữ P2 dù corroborated vì không khớp định nghĩa P1 (không mất dữ liệu, không event ghi, chỉ malformed invocation).
2. **Bảng phạm trù→exit-code rải 5 file** *(architecture; manual)* — category mới không thêm vào map của bin sẽ âm thầm về exit 1. Hợp nhất một nguồn export, `categoryOf` đọc `err.category`.
3. **Recovery chưa test đúng chế độ hỏng thật** *(test-coverage; gated_auto)* — risk map hứa "test giả lập view lệch"; suite chỉ test view-bị-xóa. Refactor tương lai sang merge-view sẽ lọt lưới. Một test: log hợp lệ + state.json cũ-còn-tồn-tại → rebuild → deep-equal fold tươi.
4. **`validateWork` chưa ràng `status` vào STATUSES** *(corroborated: code-quality + test-coverage, promote P3→P2; advisory — chạm public contract, cần user quyết)* — CLI hardcode `todo` nên hiện không chạm được; gap ở tầng lib.

## P3 (gói vào backlog, chi tiết đủ trong session record `.bee/reviews/review-phase-1-state-layer-260714.json`)

`__proto__` key hardening (security, đã probe không leo thang) · CLI import error class từ 4 module thay vì facade store · header store.mjs overclaim · O(n)×3 mỗi mutation (trade có chủ đích theo plan — không sửa trước ngưỡng) · test corrupt-giữa-log đúng nghĩa · done-terminal qua CLI thật · exit-5 khi mutation trên log hỏng · test document tính bất khả thi của dep-cycle · `--help` · JSON stdout cho mutation.

## Non-issues đã xác minh

Secrets/injection/path-traversal: không có sink nào (threat model local single-user đúng). Multi-writer CAS race: đúng phạm vi loại trừ của L3 premise, có ngưỡng tên. Spec `docs/specs/work-state.md` khớp reality — không drift.
