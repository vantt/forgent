---
type: explanation
title: Quyết định thiết kế forgent (fgOS)
tags: []
timestamp: 2026-07-22T00:00:00.000Z
source_capture_ids: []
updated: 2026-07-18
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

**Quy ước trích dẫn rút gọn:** trong văn xuôi, khi trích một record mà không kèm
tên file đầy đủ, viết dạng `ADR<n>` (vd `ADR0013`) thay vì số trần trụi (`0013`).
Tên file đầy đủ (`NNNN-slug.md`) hoặc một markdown link (href đã kèm sẵn tên
file) không cần đổi.

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
| [0012](0012-typed-edge-model-supersedes-deps-parent-separation.md) | Đồ thị typed-edge derive | Một đồ thị typed-edge derive trên work item (deps→`blocks`, parent→`parent-child`); bảo đảm acyclic của cửa-ghi mở rộng từ đồ-thị-deps sang subset chặn hợp nhất. Supersede tách deps-và-parent. |
| [0013](0013-discovered-from-runner-report-channel.md) | Kênh báo-cáo-không-ghi cho `discovered-from` | Worker phát khối rào `fgos-discovered` (dữ liệu thuần) trong output; runner đọc và tự ghi — thêm nhà sản xuất tự-động mà giữ nguyên runner-một-cửa-ghi (CTR002/D3). |
| [0014](0014-kien-truc-giao-tiep-nguoi-fgos.md) | Kiến trúc giao tiếp người ↔ fgOS | Contract = schema event-log (không phải lib); lib là client tham chiếu; CLI = adapter local standalone; daemon NGOÀI core (consumer qua CLI, `b2d18cc7` giữ nguyên); UI là client của daemon; push tách subsystem. Mức interface. |
| [0015](0015-doi-ten-ctr-cho-contract.md) | Đổi tên định danh contract C1-C9 thành CTR001-CTR009 | Định danh contract registry (`architecture-map.md` §7) đổi từ `C<n>` trần sang `CTR<n>` 3-digit zero-padded (vd `CTR009`), theo `id-systems-audit.md` #6; đổi tên thuần, không đổi ý nghĩa/ranh giới/maturity của bất kỳ contract nào. |
| [0016](0016-moc-mvp-fgos.md) | Mốc MVP của fgOS | Người mới, chỉ dựa tài liệu đã ship, nộp một yêu cầu văn xuôi và nhận code sẵn-sàng-merge với tối thiểu ngồi canh; bổ sung cho L5/L6, không thay thế. |

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
| `4faa122e` | record | 0016 |
| `9401954d` | record | 0016 |
