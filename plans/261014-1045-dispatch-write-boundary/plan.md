# Ranh giới ghi của dispatch: quy trách nhiệm ghi lạc, Doer docs-only confined

Status: **một phần xong; phần còn lại chờ owner** (cập nhật 2026-10-14 sau hội đồng một-cửa).

## Cập nhật sau hội đồng một-cửa (thay thế phần dưới khi mâu thuẫn)

Kết luận: [council-261014-1231-dispatch-one-door-conclusion.md](../261014-1033-dispatch-operator-improvements/reports/council-261014-1231-dispatch-one-door-conclusion.md) + mục cập nhật trong brief lane D.
- **Xong — bước 1 hội đồng** (`RunResult.confinement` ghi backend thật): `e9c946b39`.
- **Xong — bước 2 / đề xuất 8**: mọi đường từ chối dựa trên snapshot → cảnh báo; chỉ `proven` mới từ chối (chưa có observer nào chứng minh): `54afd4665`. **Thay quyết định A dưới đây**: KHÔNG giữ "chữ ký ghi lạc" làm điều kiện từ chối — hội đồng một-cửa chốt correlated → warning không ngoại lệ ("a real stray write is only flagged, not rejected"); ca agy giờ chỉ được cảnh báo.
- **Chờ owner**: đề xuất 6 (hướng Q4: worktree + `workspace-write` + kiểm phạm vi sau sự việc `scope-checked`, không bwrap subpath — quyết định B và phase 3–4 dưới đây bị thay); observer ghi-path gắn run (điều kiện để từ chối lại) là việc mới, câu hỏi riêng.
- Quyết định C (mount cwd cho cửa CLI/Work) không nằm trong phạm vi hội đồng giao → giữ ghi nhận, chưa làm.
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
- Lượt read-only: HEAD của cwd dịch chuyển trong lượt là bằng chứng correlated, không phải đột biến của lượt (ca 12:03:38, `wf-run-1791954133905-844903ed`). Lượt confined `host-write-denied` không thể commit (`.git` ro) → HEAD đổi là proven do bên ngoài → allow; lượt read-only unconfined (`--contract`) → cảnh báo.
- `evaluateAttributionPolicy` (0 caller production): nối vào bộ phân loại hoặc xoá — không để chết. `rollbackReadOnlyMutations` (0 caller, `git reset --soft` trên cwd có thể là main): xoá.
- Đánh đổi chấp nhận, ghi vào spec: Doer làm việc thật trong worktree VÀ ghi thêm vào main sẽ chỉ bị cảnh báo, không bị chặn (khi chưa confined).

B. **Docs-only confined = thu hẹp `writes:`, không phải capability/mode mới** (RUL77: posture thuộc capability; trục thứ hai là quyết định trùng lặp). Hai lớp:
- Kiểm footprint sau lượt (không cần confinement, ship trước Việc 2 được): path đổi (`headBefore..HEAD` + dirty) phải khớp glob đã khai; lệch → từ chối (single-writer worktree nên quy trách nhiệm được).
- Mount hẹp (sau `fix/dispatch-followups`): bwrap bind rw chỉ các tiền tố tĩnh của glob; schema `writes` giữ dạng list (bác `{roots, expected}` — hai list cho một consumer).

C. **Sửa mount mặc định của cửa CLI/Work** (`cli.mjs:822` `workspaceRoot ?? root` → `resources.mjs:310` mount rw cả main khi lượt confined `workspace-write` đi qua cửa này; cửa Assignment đã truyền `effectiveCwd`). Mount cwd, main ro. Làm sau Việc 2 (cùng file) với ma trận test: worktree trong/ngoài root, `target/` symlink, commit từ trong worktree.

D. **Doctrine không code**: phiên điều phối không ghi vào worktree đang có lượt dispatch (nguyên nhân F7); panel/ghế read-only chạy trên worktree sạch riêng, không trên main checkout (ca 12:03:38 chạy cwd = main).

## Phụ thuộc vào kết luận một-cửa

Bất biến giữ dù cửa nào còn: một bộ phân loại ở settlement; "proven" chỉ từ attestation confinement; mount = cwd của worker; kiểm footprint chính xác; cảnh báo đi trong bản ghi kết quả. Thay đổi theo kết luận: chỗ gọi bộ phân loại (cửa nào), và cửa Assignment có phải thêm snapshot repo root để bắt lớp agy không.

## Phase (chưa mở)

| # | Việc | Điều kiện mở |
|---|---|---|
| 1 | Bộ phân loại + cảnh báo trong kết quả (đề xuất 8); 2 ca đỏ trong `test/runner/dispatch-stray-write-attribution.test.mjs` (cửa CLI: file dirty; cửa Assignment: commit của phiên khác) chuyển xanh, ca agy giữ xanh | kết luận một-cửa |
| 2 | Kiểm footprint `writes:` sau lượt | kết luận một-cửa |
| 3 | Mount cwd cho cửa CLI/Work (C) | một-cửa + `fix/dispatch-followups` merged |
| 4 | Mount hẹp theo `writes:` (đề xuất 6) | như 3 |

Mỗi phase: test đỏ trước, CHANGELOG `[Unreleased]`, `docs/specs/runner.md` (rule mới cho bộ phân loại), `npm test` xanh.

## Câu hỏi mở (gom hỏi một lần khi mở phase 4)

- Doer docs-only confined có tự commit không? Mount hẹp làm `.git` metadata ro (`workspace-git-metadata: read`); Lead commit thay khớp mẫu headless hiện tại nhưng thêm một bước.
- Có nâng "path ghi lạc trùng footprint đã khai" thành điều kiện từ chối ở bản đầu không (critique đề xuất; lane hoãn vì chỉ unit có `writes:` mới có footprint).
