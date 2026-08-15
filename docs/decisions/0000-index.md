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

**Supersede phải trỏ ngược (STR72).** Record mới ghi `supersedes: [<id cũ>]` trong
frontmatter là chưa đủ — record CŨ (bị supersede) phải mang một dấu trỏ NGƯỢC
trong CÙNG đơn vị công việc: thêm field `superseded_by: <id mới>` vào frontmatter
của record cũ, và cập nhật dòng của nó trong bảng bên dưới để không còn đọc như
đang hiện hành 100%. Thiếu bước này, một phiên đọc thẳng record cũ (không qua
record mới) sẽ tái-suy framing đã lỗi thời. Đây là kỷ luật văn-xuôi (không có
script tự-động kiểm), người viết record mới tự đối chiếu.

## Các record

| # | Chủ đề | Tóm tắt một dòng |
|---|--------|------------------|
| [0001](0001-event-log-la-su-that.md) | Nhật ký sự kiện là sự thật | Dữ liệu bền khai là *log* (sự thật, git-committed) hoặc *view* (dựng lại được); DB chỉ là materialized view. |
| [0002](0002-mo-hinh-viec-phang.md) | Mô hình việc phẳng | Một loại work item, một FSM, "epic" là item thường; frontier sẵn-sàng derive toàn cục. **Phần deps/parent một-phần đã supersede bởi [0012](0012-typed-edge-model-supersedes-deps-parent-separation.md).** |
| [0003](0003-dat-ten-va-bo-cuc-du-lieu.md) | Đặt tên & bố cục dữ liệu | CLI `fgos`, entity `work`, data dir `.fgos/` (events.jsonl = truth, state.json = view gitignored). |
| [0004](0004-pham-vi-va-non-goal.md) | Phạm vi & non-goal | Domain đầu là work-state của chính forgent; chạy song song harness phát triển, không interop tới ngưỡng-có-tên. |
| [0005](0005-runner-va-co-lap-worker.md) | Runner & cô lập worker | Executor headless; runner là người ghi duy nhất; worker sinh ĐỀ XUẤT trên nhánh cô lập; tier→model. |
| [0006](0006-trang-thai-proposed.md) | Trạng thái `proposed` | Vòng đề-xuất → duyệt → merge; `done` nghĩa là "đã nhận vào cây chính". **Tên `proposed` đã supersede bởi [0024](0024-doi-ten-status-proposed-thanh-awaiting-approval.md) → `awaiting-approval`; thiết kế FSM/edges không đổi.** |
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
| [0017](0017-dong-audit-he-id-ten-goi.md) | Đóng audit hệ id/tên gọi (STR47) | Giữ đa hệ id/tên gọi có chủ đích (6 hệ fgOS vĩnh viễn + 7 hệ bee giàn giáo tạm), không hợp nhất; khoá luật D-local không bao giờ trích ngoài `CONTEXT.md` gốc; cell-id/feature-slug giữ nguyên; boundary appendix tại `architecture-map.md` Phụ lục B. Đóng vòng STR53-STR58 (tất cả đã migrate). |
| [0019](0019-mien-tru-viet-lai-nhat-ky.md) | Miễn trừ pre-release cho RUL11 | Trong lúc sản phẩm chưa phát hành, migration được phép viết lại tại chỗ cả ba kho `.fgos`; miễn trừ hết hiệu lực ở v1.0.0; không bao gồm `phase1-events.jsonl`. |
| [0020](0020-chan-fgos-khoi-worktree-worker.md) | Chặn `.fgos/` khỏi worktree worker | `fgw/<id>` worktree worker không được symlink (khóa-trong-cây) lẫn bootstrap-copy (cô-lập-cây) `.fgos/` — xóa hẳn khỏi checkout + `merge.mjs` từ chối cứng diff chạm `.fgos/`; `session.mjs` (actor trusted) giữ nguyên symlink D10. Mở rộng `0005`. |
| [0021](0021-wire-main-checkout-hook-qua-doctor-setup.md) | Wire main-checkout lock hook qua doctor/setup | Str65's `.githooks/pre-commit` (đã viết, đã test) chỉ active khi `core.hooksPath` = `.githooks` — wire vào `fgos doctor` (đọc) + `fgos setup` (ghi, fill-only, không đè custom path); không app-level lock-wrap, không epoch-fence mới. Fix khả-tiếp-cận, không phải enforcement bắt buộc. |
| [0023](0023-uu-tien-san-pham-ship-dod-hoan-thien.md) | Thứ tự ưu tiên sản phẩm | 3 bậc: ship faster > DoD (result verify + docs evidence-linked, cùng 1 gate) > hoàn thiện sau ngưỡng (polish, không mở rộng scope). **Đã supersede bởi [0025](0025-mo-rong-uu-tien-san-pham-them-ux-van-hanh-vao-ship-faster.md) → nạp always-loaded qua AGENTS.md.** |
| [0024](0024-doi-ten-status-proposed-thanh-awaiting-approval.md) | Đổi tên status `proposed` thành `awaiting-approval` | `proposed` là ngoại lệ duy nhất trong 7 status không tự-giải-nghĩa; domain-agnostic (chứng minh qua `synthetic` domain) nên tên không được gắn nghĩa "merge". Đổi đồng nhất `work.status` + `outcome.actual.outcome`; migration ghi-đè-tại-chỗ dưới miễn trừ `0019`. Supersede một phần thuật ngữ của `0006`, giữ nguyên FSM edges. |
| [0025](0025-mo-rong-uu-tien-san-pham-them-ux-van-hanh-vao-ship-faster.md) | Thứ tự ưu tiên sản phẩm, nạp always-loaded | Nguyên văn 3 mục cố định: (1) Ship Faster — giao nhanh, không đoán mò, giảm friction/better-dev-ux, ít chờ đợi; (2) DoD — reproducibly verifiable result + evidence-linked documentation; (3) Polish Sau DoD — hoàn thiện sau ngưỡng, không mở scope. Pointer 3 dòng đặt trong `AGENTS.md` (always-loaded, theo placement test L8) thay vì chỉ nằm `docs/decisions/`. Supersede `0023`. **Đã supersede bởi [0030](0030-them-release-con-nguoi-vao-thu-tu-uu-tien-san-pham.md) → thêm bậc 2 "Release con người".** |
| [0026](0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md) | Native-First Dispatch Doctrine | 4 quy tắc chọn dispatch native vs cli/spawn; vocabulary launcher/rootTask/subTask/capacity cho toàn bộ cơ chế dispatch. **Đã supersede bởi CẢ [0028](0028-doi-ten-orchestrator-thanh-launcher.md) (đổi tên pinned term ban đầu thành `launcher`) LẪN [0029](0029-sua-dinh-nghia-roottask-subtask-capacity-t1-cua-0026.md) (sửa ba mệnh đề từ vựng rootTask/subTask/capacity/T1).** |
| [0027](0027-domain-so-huu-status-doan-truoc-delivered-supersede-base-workflow-model-d1-d3.md) | Domain sở hữu vocabulary/status đoạn trước `delivered` | Domain khai stage/step-map/transitions riêng nhưng KHÔNG BAO GIỜ chi phối bảng chuyển-status dùng chung (`status-fsm.mjs`); supersede trích dẫn nội tuyến `base-workflow-model` D1-D3 (content-hash `2ae492d8`). |
| [0028](0028-doi-ten-orchestrator-thanh-launcher.md) | Đổi tên pinned term ban đầu của `0026` thành `launcher` | Tên gọi ban đầu sai nghĩa ngành cho vai trò `0026` mô tả (chọn 1 item rồi bước ra, không điều phối liên tục); đổi nhãn xuyên suốt prose fgOS tự sở hữu, không đổi thiết kế/logic. Supersede `0026`. **Mệnh đề guard (test cấm từ cũ tái xuất) đã supersede bởi [0031](0031-bo-guard-cam-tu-orchestrator-sau-khi-0029-gan-nghia-moi.md); phần đổi tên vai trò thành `launcher` vẫn nguyên hiệu lực.** |
| [0029](0029-sua-dinh-nghia-roottask-subtask-capacity-t1-cua-0026.md) | Sửa ba mệnh đề từ vựng dispatch của `0026` | Bỏ `rootTask`/`subTask` khỏi từ vựng (thay bằng `work`/child work); `capacity` = behavior-promise + functional-helper; T1 (vai trò bên gọi) chỉ có hai giá trị `launcher`/`driver`, tên gọi ban đầu của `0026` là tầng hợp thành T0. Supersede `0026`. |
| [0030](0030-them-release-con-nguoi-vao-thu-tu-uu-tien-san-pham.md) | Thứ tự ưu tiên sản phẩm, thêm "Release con người" | Mở rộng `0025` từ 3 lên 4 bậc cố định, chèn bậc 2 mới **Release con người**: hệ thống tự vận hành tối đa, chỉ hỏi người khi thật cần, gom câu hỏi thành bộ để một lần quay lại trả lời được nhiều nhất; một câu hỏi treo không được nghẽn phần việc khác của cùng item còn tiến được — đòi hỏi stage/skill chia nhỏ, mịn, mỗi mảnh park/tiến độc lập. DoD/Polish lùi xuống bậc 3/4, nội dung không đổi. Supersede `0025`. |
| [0031](0031-bo-guard-cam-tu-orchestrator-sau-khi-0029-gan-nghia-moi.md) | Bỏ guard cấm từ `orchestrator` | `0028` cấm từ này khi nó còn trống nghĩa; `0029` D17 sau đó gán nghĩa chính thức (tầng hợp thành T0 — N đơn vị, ở lại), nên guard đang cấm fgOS dùng chính từ vựng fgOS vừa chốt. Xoá guard test + allowlist: một `grep` mức-từ không phân biệt được nghĩa cũ với nghĩa mới, và allowlist đã phình lên 28 entry với 4 item sinh ra chỉ để vá nó. Supersede riêng mệnh đề guard của `0028`; việc đổi tên vai (1 đơn vị, buông) thành `launcher` giữ nguyên. |
| [0032](0032-cong-iron-law-chi-hoi-o-ranh-gioi-trunk-them-muc-warn.md) | Cổng Iron Law: chỉ hỏi ở ranh giới trunk, thêm mức `warn` | Cổng chỉ chạy khi merge target là trunk (leaf → `fgw/<root>` và `sync-root` vào nhánh cha đi thẳng), discriminator riêng theo từng call site; key config riêng `ironLaw.level` với `ask` mặc định fail-closed và `warn` opt-in ghi bản ghi rồi merge tiếp; người quyết trong chat còn agent tự gõ lệnh; item bị giữ không nghẽn cả vòng merge. Supersede riêng mệnh đề "chặn cứng ở mọi ranh giới" của `D16/D17 self-improve-loop` (quyết định nội tuyến trong spec, không có record đánh số để trỏ ngược). |

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
| `2accc216` | record | 0019 |
| `80fe8e83` | record | 0019 |
