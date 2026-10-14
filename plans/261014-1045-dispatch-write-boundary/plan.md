# Ranh giới ghi của dispatch: quy trách nhiệm ghi lạc, Doer docs-only confined

Status: **blocked — chờ kết luận hội đồng một-cửa** (Lead, 2026-10-14 10:45: không sửa code production đến khi có kết quả). Phần 6 còn chờ thêm `fix/dispatch-followups` merge vào main.
Plan cha: [261014-1033-dispatch-operator-improvements](../261014-1033-dispatch-operator-improvements/plan.md). Báo cáo lane: [lane-d report](../261014-1033-dispatch-operator-improvements/reports/lane-d-261014-1045-dispatch-write-boundary.md).

## Nguồn thiết kế (council)

`architecture-advisory` chạy 2 lần, cả 2 dừng ở bước critique → **không có synthesis đã review, không có explanation, không có close gate**. Plan này dựa trên các báo cáo đã settle của lần 2 (`wf-run-1791949750327-0f2d735b`), quyết định cuối do lane tự chốt:
- Framing: `.fgos/assignments/unit-run-1791949751011-a848aa05/producer/1/runs/01/outbox/report-1.md`
- Shaping 3 ghế mù + synthesizer: `.fgos/assignments/unit-run-1791949862587-4bb45ee9/` (panelist-1 claude, panelist-2 openai, panelist-3 gemini, synthesizer xai)
- Critique producer: `.fgos/assignments/unit-run-1791950183002-9c34bb17/producer/1/runs/01/outbox/report-1.md`
- Critique reviewer (openai, báo cáo có, lượt bị từ chối): `.fgos/assignments/unit-run-1791950183002-9c34bb17/reviewer/1/runs/01/outbox/report-1.md`
Lần 1 (`wf-run-1791949058825-3690e98f`) hỏng vì `read-only-mutation` do phiên lane ghi vào worktree đích; lần 2 hỏng vì reviewer bị chính bộ chặn `wrote-outside-workspace` từ chối (báo cáo lane khác ghi vào main). Cả hai là ca thật của lỗi plan này sửa.

## Quyết định (lane chốt, lý do ngắn)

A. **Một bộ phân loại thuần cho mọi cửa** (`classifyStrayWrites`, đặt cạnh `evidence-attribution.mjs`, thay `watchWritesOutsideWorkspace` refuse-thẳng và nhánh `read-only-mutation` bỏ qua mức bằng chứng). Đầu vào: snapshot path+hash trước/sau (repo root ngoài workspace và workspace), HEAD workspace trước/sau, attestation confinement.
- **Từ chối** chỉ khi: (1) proven — attestation confinement cho thấy ghi ngoài grant; hoặc (2) chữ ký ghi lạc — workspace không có delta (HEAD không đổi VÀ tập dirty không đổi) trong khi ngoài workspace xuất hiện path mới. Ca agy khớp (2); ca F2/F7 không khớp (Doer đã commit).
- **Còn lại** (correlated) → chấp nhận + `warnings[]` (`stray-write-correlated`: paths, level, basis, hash) trong kết quả dispatch, exit 0, `show-run` in ra. Không DispatchError, không needs-input (Release con người: không tạo vòng retry vì người đứng xem).
- Không theo dõi theo tiến trình: inotify không có pid, fanotify cần CAP_SYS_ADMIN, ptrace xung đột sandbox executor (critique, cả 3 ghế đồng ý).
- `evaluateAttributionPolicy` (0 caller production): nối vào bộ phân loại hoặc xoá — không để chết.
- Đánh đổi chấp nhận, ghi vào spec: Doer làm việc thật trong worktree VÀ ghi thêm vào main sẽ chỉ bị cảnh báo, không bị chặn (khi chưa confined).

B. **Docs-only confined = thu hẹp `writes:`, không phải capability/mode mới** (RUL77: posture thuộc capability; trục thứ hai là quyết định trùng lặp). Hai lớp:
- Kiểm footprint sau lượt (không cần confinement, ship trước Việc 2 được): path đổi (`headBefore..HEAD` + dirty) phải khớp glob đã khai; lệch → từ chối (single-writer worktree nên quy trách nhiệm được).
- Mount hẹp (sau `fix/dispatch-followups`): bwrap bind rw chỉ các tiền tố tĩnh của glob; schema `writes` giữ dạng list (bác `{roots, expected}` — hai list cho một consumer).

C. **Sửa mount mặc định của cửa CLI/Work** (`cli.mjs:822` `workspaceRoot ?? root` → `resources.mjs:310` mount rw cả main khi lượt confined `workspace-write` đi qua cửa này; cửa Assignment đã truyền `effectiveCwd`). Mount cwd, main ro. Làm sau Việc 2 (cùng file) với ma trận test: worktree trong/ngoài root, `target/` symlink, commit từ trong worktree.

D. **Doctrine không code**: phiên điều phối không ghi vào worktree đang có lượt dispatch (nguyên nhân F7).

## Phụ thuộc vào kết luận một-cửa

Bất biến giữ dù cửa nào còn: một bộ phân loại ở settlement; "proven" chỉ từ attestation confinement; mount = cwd của worker; kiểm footprint chính xác; cảnh báo đi trong bản ghi kết quả. Thay đổi theo kết luận: chỗ gọi bộ phân loại (cửa nào), và cửa Assignment có phải thêm snapshot repo root để bắt lớp agy không.

## Phase (chưa mở)

| # | Việc | Điều kiện mở |
|---|---|---|
| 1 | Bộ phân loại + cảnh báo trong kết quả (đề xuất 8); test `test/runner/dispatch-stray-write-attribution.test.mjs` (đỏ, chưa commit) chuyển xanh | kết luận một-cửa |
| 2 | Kiểm footprint `writes:` sau lượt | kết luận một-cửa |
| 3 | Mount cwd cho cửa CLI/Work (C) | một-cửa + `fix/dispatch-followups` merged |
| 4 | Mount hẹp theo `writes:` (đề xuất 6) | như 3 |

Mỗi phase: test đỏ trước, CHANGELOG `[Unreleased]`, `docs/specs/runner.md` (rule mới cho bộ phân loại), `npm test` xanh.

## Câu hỏi mở (gom hỏi một lần khi mở phase 4)

- Doer docs-only confined có tự commit không? Mount hẹp làm `.git` metadata ro (`workspace-git-metadata: read`); Lead commit thay khớp mẫu headless hiện tại nhưng thêm một bước.
- Có nâng "path ghi lạc trùng footprint đã khai" thành điều kiện từ chối ở bản đầu không (critique đề xuất; lane hoãn vì chỉ unit có `writes:` mới có footprint).
