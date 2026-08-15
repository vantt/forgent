# DISCUSSION — Hợp nhất vocab capability + đối chiếu lại registry executor

Item: `tsk-in1`. Nối tiếp lineage `tsk-5tm` (task-dispatch-unification,
D1-D12, `docs/history/task-dispatch-unification/`), phát sinh từ 1 phiên
review report `plans/reports/task-dispatch-system-architecture-spec-
260815-1916-concepts-triggers-config-and-real-flows-report.md`. Phần
Q&A trước khi vào shaping diễn ra trực tiếp trong chat (không ghi lại
tại thời điểm đó) — §5 dưới đây phục dựng lại đầy đủ trình tự.

## 1. Trạng thái hiện tại

Vòng 1 của shaping (2026-08-15). **Chưa có D-ID nào đủ điều kiện khoá.**
Trước khi vào skill này, cuộc thảo luận tự do trong chat đã tự đảo liên
tục — mỗi kết luận đưa ra đều bị chính vòng sau đó phản biện và lật lại
(xem §5 đủ chi tiết). Lần lật gần nhất, quan trọng nhất: phát hiện ra
rằng cầu nối `capacities`↔tool-registry mà phiên chat vừa đề xuất xây lại
**đã từng tồn tại thật** (`tsk-62v` D6, qua field `needs`) và **đã bị
`tsk-5tm`'s D1 chủ động cắt, có bằng chứng cụ thể** — nghĩa là mọi đề xuất
"gộp lại" tiếp theo phải đối chiếu ngược với lý do D1 đã cắt, không được
tự ý đề xuất lại như thể là đất trống. Việc đầu tiên của vòng này: đọc
đầy đủ 2 tài liệu gốc (`tsk-62v` CONTEXT.md, `tsk-5tm`'s D1 rationale)
trước khi tiếp tục bàn bất kỳ shape nào.

## 2. Mục tiêu & đề bài

`runner.capacities` (`.fgos/config.json`) hôm nay gánh 2 vai không tách
bạch: đăng ký executor theo tên (13/14 field validate, D11's shape) và
tuỳ chọn gắn 1 purpose (`for`, enum đóng `CAPACITY_PURPOSES`, hôm nay chỉ
`'judge'`) — trong khi `src/state/tool-registry.mjs` duy trì 1 vocab
"capability" HOÀN TOÀN TÁCH RỜI (free-text, `impact-analysis`/
`pane-labeling`/có thể cả `submit-assist-classify` đã chết), phục vụ câu
hỏi khác (ai đang có mặt trên máy, Tầng 1) so với dispatch (ai được gọi
thế nào, Tầng 2). Hai vocab này KHÔNG giao nhau 1 phần tử nào hôm nay.
Quan trọng: 2 tầng này **đã từng được nối** qua field `needs` trên
`capacities.<id>` (`tsk-62v` D6: với `kind:"cli"`, `resolveExecutorConfig`
tự hỏi `fgos tool query --capability <capacityId> --status present`) —
cầu nối đó bị `tsk-5tm`'s D1 RÚT, với bằng chứng cụ thể (2/3 entry thật
là `kind:"task"`, gate không bao giờ chạy; entry còn lại không thêm tín
hiệu gì ngoài OS tự throw ENOENT). Cùng lúc, cách KEY của registry cũng
đã pivot 1 lần: `tsk-62v` D3 khoá `capacityId` = job-identity
(`skillForStage(domain,'executing')`, vd `"fgos-coding-implement"`);
`tsk-5tm-4`'s D11 đổi hẳn sang key theo TÊN EXECUTOR (`agy`) — khiến hôm
nay `capacityIdForWork` vẫn tính ra job-identity nhưng registry lại
không có key nào tên vậy, 2 namespace sống chung 1 object mà không ai
từng đối chiếu tường minh. Đề bài của phiên này: quyết lại, có đầy đủ
grounding lịch sử, xem có nên (a) hợp nhất vocab capability giữa 2 tầng,
(b) khôi phục hoặc không khôi phục 1 dạng cầu nối presence-check, (c) xử
lý xung đột 2-namespace (job-id vs executor-name) đang tồn tại ngầm.

## 3. Vấn đề rõ / chưa rõ

| # | Vấn đề | Trạng thái |
|---|---|---|
| 1 | Có nên hợp nhất vocab "capability" giữa tool-registry (free-text) và dispatch (`CAPACITY_PURPOSES` enum đóng) thành 1 danh mục curated dùng chung? | Người dùng đã nghiêng về CÓ (2 vòng liên tiếp trong chat) — nhưng CHƯA đối chiếu với lý do D1 cắt cầu nối `needs`. Cần đọc lại D1's full rationale + `tsk-62v` D6 trước khi mint. |
| 2 | Có nên khôi phục 1 dạng cầu nối "dispatch tự hỏi tool-registry lúc resolve" (như `tsk-62v` D6 từng làm qua `needs`)? | MỞ — D1 đã cắt có bằng chứng thật (2/3 entry `kind:"task"` khiến gate chết, entry còn lại vô nghĩa). Bất kỳ đề xuất khôi phục nào phải trả lời được: lần này có gì khác để gate không chết như trước? |
| 3 | Xung đột 2-namespace: `capacityIdForWork` tính job-identity (`"fgos-coding-implement"`, kế thừa `tsk-62v` D3), nhưng registry key theo executor-name (kế thừa `tsk-5tm-4` D11) — `decide --work` tra theo job-id vào 1 object key theo tên executor, gần như luôn miss, rơi về mặc định native. Đây là thiết kế cố ý (D4 của `tsk-5tm-6`) hay 1 khoảng trống chưa ai đặt tên? | MỞ — cần đọc lại `tsk-5tm-6`'s D4 rationale kỹ hơn để xác nhận. |
| 4 | Tên field cuối cho registry hợp nhất (`capacities` giữ nguyên / đổi `executors` / tên khác) | MỞ — `tsk-5tm`'s D11 đã khoá lý do giữ `capacities` (tránh đụng `cfg.executors.<tier>` tier-keyed). Đổi tên đòi dời `cfg.executors.<tier>` đi chỗ khác trước — chưa rà blast radius thật (bao nhiêu chỗ đọc `cfg.executors[tier]`). |
| 5 | Có nên bỏ tool-registry's cơ chế ghi event-sourced (`fgos tool register`/`tool.register` event, `.fgos/tool-registry.json`'s committed `providers[]`), gộp khai báo executor thẳng vào `.fgos/config.json`? | Người dùng nghiêng về CÓ ("nó đâu có làm gì, ghi vào config là được") — nhưng kiểm event log thật thấy 5 `tool.register`+3 `tool.remove` trong 2 tuần, đã ghi nhận đúng lịch sử retire `gather`/`submit-assist-classify`. Không phải "không làm gì" — cần cân nhắc lại có mất gì (audit trail qua events.jsonl) khi gộp vào config (chỉ audit qua git commit thường). |
| 6 | Presence-probe logic (`probeTool`/`findExecutableOnPath`/`isIndexStale`) và local status overlay (`tool-status.local.json`, gitignored) giữ nguyên làm hàm thuần, tách khỏi registry file — đồng thuận hay chưa? | Có vẻ đồng thuận (không ai phản đối) — nhưng chưa qua đủ vòng để mint, và chưa kiểm điểm 2 (khôi phục cầu nối) có đổi lại kết luận này không. |
| 7 | `docs/how-to/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md`'s tham chiếu capability `submit-assist-classify` — có phải dead reference (skill đã bị `tsk-6ar` retire) không, xử lý cùng lúc hay tách item riêng? | MỞ — chưa xác nhận qua đọc `tsk-6ar`'s own scope, chỉ mới suy luận từ AGENTS.md reading-map. |
| 8 | Danh mục capability hợp nhất — hình dạng cụ thể: object có alias/description hay chỉ tập tên đơn giản? | MỞ, phụ thuộc #1 đã chốt hay chưa. |

## 4. Quyết định đã chốt

Chưa có — phiên đầu, mọi điểm ở §3 còn dưới 1 vòng ổn định (theo đúng
hard rule: mint D-ID chỉ khi 1 điểm giữ nguyên qua >1 vòng KHÔNG bị đảo).
Vòng chat trước khi vào shaping có nhiều "kết luận" nhưng đều bị chính
vòng kế tiếp lật lại — không tính là đã ổn định.

## 5. Q&A log

- **Round a.** Người dùng phát hiện report kiến trúc dispatch (viết ở 1
  item khác trong cùng phiên) gọi nhầm `agy` (1 executor entry) là
  "capacity". Bằng chứng: `agy` không khai `for`, D11 tự ghi "executor
  vẫn dùng để GỌI TỪNG ENTRY, không phải tên field JSON". Sửa report.
- **Round b.** Người dùng hỏi tiếp: "chúng ta đang config executor dưới
  tên capacity" — có phải config sai chỗ? Quét `validateCapacityShape`:
  14 field, đúng 1 field (`for`) mô tả capacity, 13 field còn lại mô tả
  executor. Xác nhận: không phải đặt sai chỗ (không có field `executors`-
  theo-tên nào khác để đặt đúng — `cfg.executors` là trục tier-keyed
  hoàn toàn khác).
- **Round c.** Người dùng chốt hướng: "capability = lời hứa fgOS tự định
  nghĩa, executor = cách triển khai cụ thể hiện thực hoá". Đối chiếu
  marketing-cockpit thật (`docs/distillery/sources/marketing-cockpit.md`):
  họ có đúng 1 `executor-registry.yaml` (không có trục purpose), tier→
  model là file riêng (`model-policy.yaml`). fgOS có NHIỀU trục hơn (đúng
  ý "tiến hoá hơn" người dùng nêu) — nhưng tên field `capacities` là di
  sản GIAI ĐOẠN TRƯỚC (key theo purpose, trước D11), không phải thừa kế
  từ marketing-cockpit.
- **Round d.** Người dùng chốt: hợp nhất 1 vocab capability duy nhất cho
  cả 2 tầng (tool-registry + dispatch). Phát hiện phụ: tool-registry's
  `capability` field là free-text mở (`normalizeCapability`, không
  enum), trong khi dispatch's `CAPACITY_PURPOSES` là enum đóng hardcode —
  hợp nhất đòi chọn 1 mô hình (curated/đóng, theo ý người dùng).
- **Round e.** Người dùng hỏi có bao nhiêu "hình thái" gọi
  `fgos tool query --capability X --status present`. Đếm được 6 call
  site thật (loại trừ ~250 file `docs/history/*` chỉ paste boilerplate),
  3 giá trị capability sống: `impact-analysis`, `pane-labeling`,
  `submit-assist-classify` (nghi chết).
- **Round f.** Người dùng hỏi lại: đây có phải "cách dispatch đang hoạt
  động" không, và "không ai cung cấp thì coi như không làm gì" đúng
  không. Xác nhận: KHÔNG phải dispatch — `dispatch.mjs` không có dòng
  code staleness nào; pattern nằm ở `tool-registry.mjs`'s `probeTool`/
  `isIndexStale` + `CLAUDE.md`'s prose gate 3-mức. "Không ai cung cấp =
  bỏ qua" đúng, và đây là bằng chứng pattern y hệt bị phát minh lại 2 lần
  độc lập (`Inactive` posture bên tool-registry vs
  `mechanism:"unavailable"` bên dispatch).
- **Round g.** Người dùng hỏi có phải kết luận là "bỏ tool-registry, chỉ
  giữ dispatch". Rà lại: KHÔNG — 2 tầng trả lời 2 câu hỏi khác bản chất
  (tool-registry: presence/fact, kể cả cho capability không bao giờ đi
  qua dispatch như GitNexus MCP; dispatch: cơ chế invoke). Rút đề xuất
  "dispatch tự query tool-registry bên trong thành điểm gọi duy nhất" vì
  ép mọi capability thành dispatch-shaped là sai (GitNexus không được
  "spawn").
- **Round h.** Người dùng phản biện sâu hơn: tool-registry chỉ nên trả
  lời presence, KHÔNG nên trả lời "tươi" (staleness không tổng quát hoá
  được, sẽ nổ ra muôn vàng câu hỏi provider-riêng). Đồng thời: provider
  của tool-registry (gitnexus, herdr) CHÍNH LÀ executor theo nghĩa
  dispatch — 2 bảng ghi cùng 1 loại thực thể, tách rời do vô tình, không
  do chủ đích. Đề xuất bỏ hẳn "harness tool-registry", ghi thẳng vào
  config. Ultrathink round: xác nhận `isIndexStale` đúng là hack đặc thù
  GitNexus núp dưới vỏ tổng quát (đọc `meta.json`'s `lastCommit`, không
  generalize thật). Kiểm event log thật: 5 `tool.register`+3
  `tool.remove` trong 2 tuần — không phải "không làm gì", đã ghi nhận
  đúng lịch sử retire `gather`/`submit-assist-classify`. Đề xuất tạm: gộp
  phần REGISTRATION (event-sourced) vào config (giống capacities đã làm,
  không event-sourced), giữ probe-logic + local-status overlay tách
  riêng làm hàm thuần.
- **Round i.** Người dùng hỏi tiếp: config còn lại là gì sau khi gộp.
  Đưa ra 1 shape nháp: `executor` (global) + `tierExecutors` (đổi tên từ
  `executors.<tier>` cũ) + `capabilities` (danh mục mới) + `executors`
  (đổi tên từ `capacities`, gộp cả provider tool-registry cũ).
- **Round j (lật lại quan trọng nhất).** Người dùng chỉ ra: "chỗ
  executors cấu hình sai rồi, chúng ta đã có 1 thảo luận sâu về cấu hình
  chỗ này và đã chốt, em làm một cái mới hoàn toàn". Tìm lại
  `docs/history/agent-executor-capacity-dispatch/CONTEXT.md` (`tsk-62v`)
  — D6 xác nhận cầu nối `capacities`↔tool-registry ĐÃ từng được thiết kế
  và xây (qua `needs`), rồi `tsk-5tm`'s D1 chủ động cắt có bằng chứng.
  D3 xác nhận pivot namespace (job-id → executor-name qua D11). Kết luận
  round i bị coi là "làm mới hoàn toàn" mà không grounding vào lịch sử
  thật này — dừng đề xuất tự do, chuyển sang `fgos-coding-shaping` để
  đọc đầy đủ trước khi tiếp tục (vòng này).

## 6. Thiết kế đã chốt {#design}

Chưa có — chưa đủ điều kiện để viết synthesis (§3's điểm #1/#2/#3/#4
đều còn mở, phụ thuộc việc đọc lại đầy đủ `tsk-62v`/`tsk-5tm` lineage
trước). Việc tiếp theo của phiên này: đọc trọn `tsk-5tm`'s D1 rationale
gốc (đã có trong `docs/history/task-dispatch-unification/DISCUSSION.md`
§4 D1) đối chiếu trực tiếp với `tsk-62v`'s D6, rồi mới tiếp tục bàn §3.

## 7. Danh mục hạng mục / task {#tasks}

Chưa có — chưa tới lúc chia task.
