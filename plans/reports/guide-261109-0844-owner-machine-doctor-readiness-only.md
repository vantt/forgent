# Hướng dẫn cho máy owner: doctor chỉ trả lời về độ sẵn sàng

Hướng dẫn này cho máy owner và máy thứ ba. fg-server2 tự land từng phase. Mỗi phase có một mục bên dưới, xếp theo số phase. Plan: [`plans/261106-1216-doctor-readiness-only/plan.md`](../261106-1216-doctor-readiness-only/plan.md). Hiện chỉ có mục của phase 08; phase 10 điền phần còn lại.

## Phase 08: định nghĩa đóng gói do npm test phán

Commit main: `35c281e73`. Báo cáo: [`lead-261109-0730-doctor-p08-packaged-definitions.md`](lead-261109-0730-doctor-p08-packaged-definitions.md).

### Đổi gì cho người dùng

- Hai dòng doctor bị xoá: `task-specs-resolve` và `domain-workflow-operations-coverage`. Chúng chỉ đọc domain đóng gói trong release, nay là case của `npm test` (`test/setup/packaged-definitions.test.mjs`).
- Bốn dòng chỉ phán tầng do dự án cấp: `agent-claims-resolve`, `domain-registry-compiled` (bỏ qua chính thư mục nguồn release), `agent-type-names-unique` (bỏ qua tầng đọc từ trong release), `operation-prompt-templates-valid` (chỉ `.fgos/prompt-templates`).
- Dự án thường không có `domains/` hay `core/` riêng thì các dòng này pass, không còn phán release thay dự án.

### Sau khi kích hoạt

1. Build, stage, activate release từ main `35c281e73` hoặc mới hơn.
2. `fgos doctor --json` trả 109 dòng; không còn hai id trên.
3. Trong checkout fgOS chạy bằng dev host, các dòng `agent-claims-resolve` và `domain-registry-compiled` in "this directory is the release source; npm test judges ...". Release đã kích hoạt chạy trong checkout coi cây đó là tầng dự án nên vẫn phán.

### Quay lại

Revert merge, kích hoạt lại release trước. Không đổi định dạng trên đĩa.
