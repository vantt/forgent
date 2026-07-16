---
title: Sổ quyết định forgent (fgOS) — mục lục
updated: 2026-07-14
kind: decision-records-index
---

# Quyết định thiết kế forgent (fgOS)

Đây là **sử ký thiết kế** của forgent cho người ngoài: một người (hoặc agent) lạ,
không có lịch sử chat và không vào xưởng phát triển, đọc thư mục này là hiểu được
các quyết định lớn đã định hình sản phẩm — *cái gì* đã chốt, *vì sao*, và *hệ quả*.

Mỗi record theo dạng ADR (Architecture Decision Record): `NNNN-<slug>.md`, cấu trúc
**Bối cảnh / Quyết định / Hệ quả**. Record là bản chưng cất viết-tay từ nhật ký
quyết định của dự án — không phải log thô. Một quyết định đã chốt sau này (per
`AGENTS.md` Definition of Done bước 6) được thêm vào đây.

Đổi một quyết định = **supersede** record tương ứng bằng một record mới, không sửa
tại chỗ (giữ đúng nguyên tắc bất-biến của platform-foundations).

## Các record

| # | Chủ đề | Tóm tắt một dòng |
|---|--------|------------------|
| [0001](0001-event-log-la-su-that.md) | Nhật ký sự kiện là sự thật | Dữ liệu bền khai là *log* (sự thật, git-committed) hoặc *view* (dựng lại được); DB chỉ là materialized view. |
| [0002](0002-mo-hinh-viec-phang.md) | Mô hình việc phẳng | Một loại work item, một FSM, deps; "epic" là item thường; frontier sẵn-sàng derive toàn cục. |
| [0003](0003-dat-ten-va-bo-cuc-du-lieu.md) | Đặt tên & bố cục dữ liệu | CLI `fgos`, entity `work`, data dir `.fgos/` (events.jsonl = truth, state.json = view gitignored). |
| [0004](0004-pham-vi-va-non-goal.md) | Phạm vi & non-goal | Domain đầu là work-state của chính forgent; chạy song song harness phát triển, không interop tới ngưỡng-có-tên. |
| [0005](0005-runner-va-co-lap-worker.md) | Runner & cô lập worker | Executor headless; runner là người ghi duy nhất; worker sinh ĐỀ XUẤT trên nhánh cô lập; tier→model. |
| [0006](0006-trang-thai-proposed.md) | Trạng thái `proposed` | Vòng đề-xuất → duyệt → merge; `done` nghĩa là "đã nhận vào cây chính". |
| [0007](0007-tien-hoa-schema-va-event.md) | Tiến hoá schema & event | Log đã commit bất khả xâm phạm; replay backward-compatible có test; event mang version. |
| [0008](0008-routing-theo-audience.md) | Routing theo audience | Chọn kiểu giao tiếp theo audience của TỪNG interface, không áp một khuôn toàn cục. |
| [0009](0009-chong-giao-thoa-luc-cai.md) | Chống giao thoa lúc cài | fgOS khi cài không được giao thoa tiến trình với harness khác (yêu cầu platform, chưa thực thi). |
| [0010](0010-ban-do-kien-truc-la-ban-chuan.md) | Bản đồ kiến trúc là bản chuẩn | `docs/architecture-map.md` v0.2 (5 tầng E→U→I→D→K + 2 lớp phủ + 2 sổ) là chuẩn; thẻ-căn-cước-trước-code hiệu lực như phụ lục definition-of-done; 5 câu hỏi mở chốt kèm. |
| [0011](0011-version-tuong-minh-cho-moi-contract.md) | Version tường minh cho mọi contract | Mở rộng 0007: không chỉ event mà cả schema và artifact đều khai version trong định danh (`<name>/v<N>`), theo mẫu `artifact_contract: bee-plan/v1` bee đã dùng sống. |

## Truy vết nguồn (đầy đủ)

Sổ này chưng cất các quyết định **product-facing**. Bảng dưới liệt kê mọi mã quyết
định gốc và nơi nó nằm trong sổ, để không mã nào biến mất không dấu vết.

| Mã gốc | Xử lý | Ở đâu |
|--------|-------|-------|
| `ae461c8b` | record | 0001 |
| `451ca088` | record | 0001 |
| `fd17309a` | record | 0002 |
| `55ad2f9f` | record | 0003 |
| `9ac6ca50` | record | 0004 |
| `0790031c` | record (viết lại thuần product) | 0004 |
| `feed7428` | record | 0005 |
| `14396a5c` | gộp vào | 0005 |
| `14ebeea9` | record | 0008 |
| `99a8a7fc` | record (viết lại thuần product) | 0009 |
| `ca7de3cf` | ngoài phạm vi | Phương pháp luận nội bộ (memory hai tầng), không phải quyết định sản phẩm. |
| `ed953e09` | ngoài phạm vi | Bookkeeping lưu trữ vùng học, phía xưởng. |
| `774b73ef` | ngoài phạm vi | Chính sách vận hành khi phát triển, không phải thiết kế sản phẩm. |
| `f3a16887` | ngoài phạm vi | Thang kiểm chứng nội bộ khi tách kho. |
| `145a4b67` | ngoài phạm vi | Cơ chế tách kho phát triển ↔ sản phẩm. |
| `ddd9e431` | ngoài phạm vi | Nhật ký thi hành tách kho. |
| `47950429` | ngoài phạm vi | Kết quả kiểm khói quy trình phát triển. |
| `13916523` | record | 0011 |
