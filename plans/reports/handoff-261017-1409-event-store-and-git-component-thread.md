# Bàn giao: luồng fgos-cook → component Git → event store

Ngày 2026-10-17 14:09, phiên `ac420727` trên máy thứ hai (`~/projects/forgent`). Viết trước khi compact để phiên sau, hoặc máy khác, nối tiếp được mà không cần lịch sử chat. Dòng tương ứng trên bảng chương trình là **ES**, **GIT** và **COOK** trong [plans/261017-1313-fgos-platform-program-board/plan.md](../261017-1313-fgos-platform-program-board/plan.md).

## Chuỗi đã đi qua

1. Owner hỏi về một `fgos-cook` chia việc ra provider/tier/persona. Kết luận: không dịch plan cơ học; agent điều phối hiểu plan và giao qua hai cửa `fgos run` / `fgos workflow`. [Report](research-261016-2141-plan-conductor-coding.md), [roadmap](roadmap-261016-2212-fgos-cook-and-git-component.md).
2. Thiết kế bước gộp nhánh lộ ra ba bản merge song song. Owner quyết tách **component Git** bằng Rust, gom mọi tinh túy. Hội đồng kiến trúc: hướng A (Rust lõi sống ngay), không vá `integrate.mjs`.
3. Quét bài học: [danh mục 234 mục, đã đóng băng](research-261017-1032-git-lessons-catalogue.md), lane gốc trong [git-lessons-sweep-261017/](git-lessons-sweep-261017/). 32 work item đã sửa xong được đóng `wontfix` có bằng chứng ([audit](audit-261017-1020-git-backlog-close-verification.md)).
4. Event store bị nhận ra là gốc của khoảng một phần tư bài học git. [Probe](investigation-261017-1027-fgos-event-store-git-coupling.md), [lịch sử trôi dạt khỏi upstream](research-261017-1102-fgos-event-store-drift-history.md), [hội đồng 1](council-261017-1210-event-store-final-packet.md), hai thí nghiệm ([1](experiment-261017-1220-event-store-exp1-relocate-open-shards.md), [2](experiment-261017-1220-event-store-exp2-seal-first-merge-crash.md), thí nghiệm 2 đã được chạy lại và khớp), [spec nháp](../../docs/platform/event-store/spec.md), hội đồng 2 `wf-run-1792216377992-d45c6038` bác spec nháp làm hợp đồng.
5. 4.3: phần khoá repo (4.3-R) chạy theo plan cũ với rào chắn F10; phần state (4.3-S) giữ chờ event store. 4.2 đã land trên cả hai máy ([landing máy này](landing-261017-1407-holder-lock-this-machine.md)).

## Quyết định của owner còn hiệu lực

- Component Git: Rust lõi sống ngay; mang theo mọi bài học; không vá `integrate.mjs` tạm.
- Event store: hướng B (seal first); view là cache của consumer; claims ở runtime; phạm vi xuất bản theo loại stream (project, branch, local), Work là project; lõi Rust dùng chung, reducer ở consumer.
- **Q1 = (a):** event đã niêm phong là object git trên ref riêng mỗi máy `refs/fgos/events/<máy>`, không là file trong cây làm việc. View đọc qua các verb thường, có lệnh sync / rebuild / status / export, cache tăng dần theo tip của ref. Đây là thay luật L3, cần owner ký decision mới.
- **Q2:** owner làm trên ba máy, nên event phải chia sẻ giữa các máy (đẩy ref của mình, fetch ref của máy khác, hợp theo hash).
- Nhịp niêm phong mặc định (agent chọn, owner không phản đối): khi có sự kiện vòng đời, nếu không thì 300 giây, nếu không thì lúc writer thoát êm.

## Đang chạy lúc bàn giao

| Run | Việc | Khi xong |
|---|---|---|
| `wf-run-1792220971594-ec5449e2` | Spec event store v2 (ghế claude rigor high, chạy opus), sửa mọi lỗi chặn của hội đồng 2 theo Q1=(a) | Lấy spec đầy đủ trong outbox, ghi đè `docs/platform/event-store/spec.md`, commit; rồi chạy `architecture-advisory-reopen` với spec v2 và báo cáo của hội đồng 2 làm context-ref |
| `wf-run-1792220971735-537c5269` | Đo V-SPAWN-01: p50/p95/p99 của claim/move/settle ở 1, 10, 20 phiên, số spawn mỗi mutation | Lưu báo cáo qua `fgos convention path --kind report --type experiment`; đưa số đo vào spec v2 (ngân sách IPC) |

Mọi run ghim `--account tetcu72`. Đọc kết quả bằng `fgos workflow status <run> --json`; báo cáo nằm trong `.fgos/assignments/<unitRunId>/producer/1/runs/01/outbox/report-1.md`.

## Việc kế tiếp, theo thứ tự

1. Nhận spec v2 và số đo; hội đồng mở lại xác nhận; owner ký decision thay L3 (D-ID `ae461c8b`) và D-ADR0003.
2. Cắt lại 4.3-S (P01, P02, P04) quanh claims theo spec v2, sắp thứ tự để P01 + P02 vào main sớm cho 6.2 P09.
3. Lập plan event store (crate `fgos-event-store`, facade Node, migration một lần).
4. Spec G0 cho component Git, dựa trên danh mục 234 mục, bỏ họ `.fgos` mà event store xoá, nhận lớp khoá của 4.3-R.
5. COOK: P1 (doctrine driver theo hai cửa, bản đồ khái niệm) và P3 (giữ `verify` trên Unit, timeout verify cấu hình được, bỏ `npm test` ghim cứng, `--input`/`--verify` cho one-liner) chạy được ngay, không phụ thuộc chuỗi trên.

## Đã giao cho bên khác

- [Brief trần tier theo capability](brief-261017-1350-capability-tier-cap.md): `maxTier` toàn cục đang xoá tác dụng của rigor capability. Owner giao phiên khác làm.

## Cảnh báo cho người nối tiếp

- Main checkout trên máy này đang có việc dở chưa commit của phiên khác (`.fgos/config.json` đổi `claude-herdr` sang `claude`, `AGENTS.md`, `.claude/settings.json`, hai docs, plan `model-pool-config-additive-slice` phase-00, hai test). Không commit chúng; commit file của mình bằng pathspec hoặc qua index như commit `214e8530d`.
- `maxTier` hiện là `flagship` (commit `287c2cb91` của phiên khác, cố ý). Muốn ghế `frontier` cho hội đồng phải đợi brief trần theo capability, đừng nâng trần toàn cục.
- Hook repo chặn lệnh có chuỗi `target`; build release trong worktree riêng, không lách hook.
- Đặt tên report bằng `fgos convention path`, không tự đặt.
