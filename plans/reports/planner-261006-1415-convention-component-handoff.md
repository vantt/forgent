# Handoff: plan B, component `convention` (H2)

Ngày 2026-10-06. Người lập: planner. Plan status: Proposed — not authorized for execution.

Plan: [plans/261006-1415-fgos-convention-component/plan.md](../261006-1415-fgos-convention-component/plan.md)

## Plan gồm gì

| Phase | Nội dung | Gộp/xoá |
|---|---|---|
| [00](../261006-1415-fgos-convention-component/phase-00-spec.md) | Spec `docs/specs/convention.md` (không code), Q1-Q12, kết quả component-boundary: **có đổi**, thêm một hàng | — |
| [01](../261006-1415-fgos-convention-component/phase-01-shared-civil-time.md) | Helper ngày dân sự trong `fgos-host-runtime` | 4 bản thuật toán ngày → 1 |
| [02](../261006-1415-fgos-convention-component/phase-02-convention-crate.md) | Crate `fgos-convention`, rules/golden JSON, `cargo test` với đồng hồ ghim | không thêm bản thời gian thứ năm |
| [03](../261006-1415-fgos-convention-component/phase-03-route-wiring.md) | Catalog, composition root, projector, annotation, registry, sinh lại `command-routes.json`, test | nhánh subcommand mã cứng `main.rs:158-160` → bảng |
| [04](../261006-1415-fgos-convention-component/phase-04-node-client.md) | Client Node mỏng; `invokeHost` nhận `unknown verb` là host cũ | không có cài đặt Node thứ hai (grep làm bằng chứng) |
| [05](../261006-1415-fgos-convention-component/phase-05-enforcement.md) | Pre-commit (chỉ file mới thêm) + doctor `convention-conformance` (degraded, không failed) | 2 thư mục journal → 1 |
| [06](../261006-1415-fgos-convention-component/phase-06-agents-line.md) | Một dòng `AGENTS.md`, sau phase AGENTS.md của Plan A | tên do brief tự dựng → lệnh |
| [07](../261006-1415-fgos-convention-component/phase-07-docs-changelog.md) | Spec implemented, maps, CHANGELOG, ghi chú di chuyển caller | — |

Phụ thuộc Plan A: vòng dev/kích hoạt release (chỉ cho kiểm tay qua cửa `fgos` thật; test dùng `target/debug/fgos`), phase AGENTS.md (trước 06), guard pre-commit và check doctor (trước 05). Thư mục của Plan A chưa có lúc lập plan nên đường dẫn là UNVERIFIED.

## Câu hỏi chưa giải quyết (cần anh)

1. **Q10, bố cục:** quyết định ghi `packages/convention/{contracts,rust,src,tests}`, nhưng mọi package hiện có chỉ có `contracts/` + `rust/` (test ở `rust/tests/`). Em đề xuất theo bố cục thật. Em không tự đổi quyết định của anh.
2. **Q6, journal:** `plans/journals/` (10 file, `YYYY-MM-DD-slug`, còn dùng) và `docs/journals/` (5 file, `YYMMDD-HHMM-slug`, ngừng từ 2026-08-11). Chọn một thư mục và một mẫu.
3. **Q9, múi giờ:** đề xuất giờ local và ghi offset trong output (khớp tên do `ak plan create` sinh); nếu chọn UTC thì tái lập giữa các máy nhưng lệch 7 giờ so với thư mục plan hiện có.
4. Q7 (`type` mở hay đóng; có từ chối đuôi `-report` không: 119 file hiện có đuôi này), Q8 (slug không phải ASCII), Q11/Q12 (host cũ hoặc không có host thì suy giảm, không chặn commit).
5. Q1-Q5 là nghiên cứu, làm trong phase 00: gọi ngược host (§3 chỉ có thiết kế; `"host.callback"` có trong danh sách capability ở `registry.rs:44`, chưa thấy kênh gọi), WASM (0 file Rust, ledger HI-I018 ghi là việc tương lai), `FGOS_HOST_BIN` cho extension (host chỉ đặt cho payload Node, `legacy_exec.rs:245-247`), vị trí lắp (đã trace), các bộ sinh khác (`branchNameFor`, `next-doc-id.mjs`, `nextFreeDecisionId`).

## Rủi ro chính

- **H2 có thể không thắng được khối `## Naming` của hook ak/ck** (hook đó ngoài phạm vi). Cơ chế (lệnh + pre-commit) là lớp chính; hiệu quả chưa chứng minh, sẽ đo ở H4.
- Phase 01 đụng `cli_presenter.rs`, tức envelope của mọi lệnh native. Phase 03 đụng `CATALOG`/`main`, dự kiến impact HIGH; plan bắt chạy impact và báo trước khi sửa.
- Sửa pre-commit có thể chặn nhầm mọi commit. Đã giới hạn: chỉ file mới thêm, và chỉ khi có host.
- Index GitNexus đang ở `b3346957a`, sau HEAD 6 commit (degraded). Mỗi phase code phải chạy `analyze` lại và đối chiếu bằng `rg`.
- `npm test` không hermetic trong phiên agent. Mọi bước dùng `env -u CLAUDE_CODE_SESSION_ID npm test`.

## Bằng chứng: kiểm lại hay kế thừa

Em đã kiểm lại trong phiên này:
- Bố cục package, đường lắp native (`catalog.rs`, `main.rs`, `cli_projector.rs`, annotations, generator, test), 4 route native.
- `invokeHost` và lỗ hổng nhận diện mismatch, `FGOS_HOST_BIN`, env của provider ngoài, không có WASM.
- Mẫu doctor degraded, danh sách ở `distribution.md:70`, cách `ensureHostBin` tự build host cho test.
- Số đo tên report và plan, hai thư mục journal, 4 bản thuật toán ngày, `nativeOnly` ở `bin/fgos.mjs:4576`, caller trong script, plan r1 đã nằm trong `archive/`, trạng thái index GitNexus, `tool query` trả `present`.

Kế thừa từ synthesis, chưa kiểm lại:
- "78 lời gọi đi vòng `paths.mjs`".
- "khoảng 19 chỗ sinh id".
- 40/46 tên đọc sẵn trong brief, các con số drift.
- Release dán digest và bản sao Node (H1(c)).

Em không chạy `npm test`, `cargo`, hay lệnh fgos nào làm đổi trạng thái. Em cũng không chạy `set-active-plan.cjs`, vì nó ghi ra ngoài hai đầu ra được phép.
