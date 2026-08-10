# Merge-list tree view + bottleneck-priority merge order

## 1. Trạng thái hiện tại

Vòng 3. Đã xác nhận: chỉ có model A (một process/instance duy nhất —
`merge-loop`, chạy trong pane cố định `fg:operation` mà tsk-2xt sẽ
tự-launch — được phép thực thi merge thật xuyên suốt hệ thống), không có
model B riêng biệt (không tồn tại cơ chế "cha tự merge con"). Câu hỏi
"ai/process nào thực hiện merge" đã tinh chỉnh lại thành: single-owner
merge execution — mọi luồng khác (`cook`, `pick`, `fgos-code-implement`/
`return`, VÀ `fanout`) chỉ được dừng ở `awaiting-approval`, không tự gọi
`approve`. Phát hiện quan trọng: `fgos-fanout` HIỆN TẠI đang tự gọi `fgos
approve` cho các leaf auto-approve — một caller thứ hai, độc lập với
`merge-loop`, đúng là nguyên nhân cụ thể của tình trạng "nhiều tiến trình
cùng lúc chạy vào merge, human phải hang-around đợi approve" mà người
dùng mô tả từ kinh nghiệm thực tế. Đề xuất single-owner đang chờ xác nhận
rõ ràng (round tới), cùng với việc có tách fanout-conflict thành item
riêng ngay bây giờ hay chỉ ghi nhận. Q3 đã trả lời: hiển thị TẤT CẢ
(`ready`/`waiting`/`blockedOnSync`/`mergeSets`/`supersededOut`), vì A/B
dù đang kẹt cỡ nào cuối cùng cũng phải merge vào X. Định nghĩa
"bottleneck" (§3 dòng 1) và tính đệ quy (§3 dòng 4) đã có đề xuất/câu trả
lời nhưng CHƯA giữ ổn định qua hơn một vòng — chưa mint D-ID nào.

## 2. Mục tiêu & đề bài

herdr-plugin đang hiển thị MERGE LIST box dưới dạng ba danh sách phẳng
(`ready`/`waiting`/`blockedOnSync`, `herdr-plugin/src/fgos.rs:127-145` +
`app.rs`), một ánh xạ trực tiếp của `fgos merge list --json`. Mục tiêu của
task này gồm hai phần gắn liền nhau: (a) đổi cách hiển thị sang dạng tree
— cấp cao nhất là các root item merge thẳng vào `main`
(`mergeTier: 'root-to-main'`), các cấp sâu hơn là child-merge (nhánh con
merge vào nhánh cha, `mergeTier: 'leaf-to-root'`), mỗi cấp tự sort theo
cùng một luật; và (b) luật sort đó không chỉ đơn thuần là dependency-order
+ impact như `rankImpact` đang làm hôm nay, mà phải ưu tiên giải phóng
bottleneck trước — item nào đang khiến nhiều task khác kẹt đợi merge nhất
thì merge trước (vẫn tôn trọng ràng buộc dependency), rồi khi không còn
bottleneck mới quay lại luật tuần tự thông thường.

Động lực thật đứng sau: đây là bước chuẩn bị cho herdr-plugin tự động bật
pane chạy `merge-loop` tuần tự (kiến trúc đã chốt ở tsk-2xt, xem §5) —
thứ tự mà box này hiển thị PHẢI là thứ tự thật `merge next`/`merge-loop`
sẽ thực thi khi chạy không người giám sát, không phải một thứ tự trình
bày riêng ở lớp UI.

## 3. Vấn đề rõ / chưa rõ

| # | Vấn đề | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Định nghĩa "bottleneck" dùng để sort: `rankImpact`'s `blocks` (toàn graph, mọi status) hay một tín hiệu hẹp hơn — đếm riêng item đang nằm trong `mergeReadiness`'s `waiting` bucket mà bị chặn trực tiếp bởi item này? | đề xuất round 2, chưa xác nhận | Dữ liệu thật lúc scout: `waiting` đang RỖNG (0 item) — tín hiệu hẹp gần như luôn bằng 0, không tạo khác biệt thứ tự thật. Đề xuất: tái dùng `blocks` sẵn có (không phát minh metric mới) — đã được `priority-formula.mjs` dùng cho cùng mục đích ("đòn bẩy backlog"), nhất quán với phần còn lại của hệ thống. Người dùng chưa xác nhận trực tiếp đề xuất này (round 3 rẽ sang câu hỏi "ai merge"). |
| 2 | Logic sort mới đặt ở đâu: sửa `rankImpact`/`mergeReadiness` (JS, `src/state/`) hay chỉ ở tầng hiển thị Rust? | rõ | `merge next`/`merge-loop` đọc thẳng `mergeReadiness(view).ready[0]` — sửa ở JS engine, Rust chỉ phản ánh lại. Củng cố thêm bởi round 3: nếu single-owner (dòng 6 dưới) được xác nhận, `merge-loop` càng chắc chắn là nơi duy nhất thứ tự này thật sự được thực thi. |
| 3 | Tree hiển thị gồm những gì | đã trả lời (round 3) | Hiển thị TẤT CẢ: `ready` + `waiting` + `blockedOnSync` + `mergeSets` + `supersededOut` (node phụ/đánh dấu lý do kẹt) — vì A/B dù đang kẹt ở trạng thái nào cuối cùng cũng phải merge vào X, ẩn đi sẽ mất đúng mục đích quan sát bottleneck. |
| 4 | Bottleneck-priority áp dụng đệ quy ở mọi cấp child-merge, hay chỉ ở top-level? | đã trả lời (round 2: "recursive"), chưa qua vòng thứ hai để mint D-ID | |
| 5 | Quan hệ với tsk-2xt | rõ | Độc lập nhưng bổ trợ: tsk-2xt tự khai "logic pick giữ nguyên" (không đổi), nên cải thiện sort ở đây tự động nâng cấp hành vi automation của tsk-2xt mà không cần đổi gì bên tsk-2xt. Không cần dep giữa hai item. |
| 6 | AI (process nào) được phép thực thi merge thật xuyên suốt hệ thống | đề xuất round 3, chờ xác nhận | Model A xác nhận (không có model B: `cleanup-harness.mjs:115-116` — "decompose-into-children never itself merges... children's own branches merge directly into the same resolved root"). Đề xuất cụ thể: single-owner = `merge-loop` (pane `fg:operation`, tsk-2xt) là caller DUY NHẤT được gọi `approve` thật; mọi luồng khác (`cook`/`pick`/`fgos-code-implement`/`return`/`fanout`) chỉ dừng ở `awaiting-approval`. Xung đột phát hiện được: `fgos-fanout` (`.claude/skills/fgos-fanout/SKILL.md:94-106`) hiện đang TỰ gọi `fgos approve` cho leaf auto-approve — caller thứ hai độc lập, khớp đúng với hiện tượng "nhiều tiến trình cùng lúc vào merge, human phải đợi" người dùng mô tả. `withLockRetry` đã ngăn corruption (không phải bug đúng nghĩa) — đây là vấn đề coordination/observability. |
| 7 | fanout self-approve conflict: tách thành item riêng ngay, hay chỉ ghi nhận trong discussion này? | chưa rõ | Hỏi trực tiếp người dùng round 3, đang chờ trả lời. |

## 4. Quyết định đã chốt

*(chưa có D-ID nào)*

## 5. Q&A log

- 2026-08-10T03:40Z (scout, session): Scout ban đầu cho tsk-3cs (thực hiện
  trong `/fgOS:submit` + `/fgOS:pick` trước khi coding-shape mở):
  `herdr-plugin/src/fgos.rs:127-145` + `app.rs` — MERGE LIST box hôm nay
  là ánh xạ phẳng, trực tiếp của `fgos merge list --json`
  (`ready`/`waiting`/`blockedOnSync`), không tree, không đọc `parent`/
  `mergeTier`. `src/state/graph-harness.mjs:94` (`mergeReadiness`) đã có
  sẵn `mergeTier: {[id]: 'leaf-to-root'|'root-to-main'}` theo `item.parent`,
  và `ready` đã sort theo `rankImpact` (blocks desc, tie-break goalTier
  rồi id) — nhưng là một danh sách PHẲNG, không group theo parent.
- 2026-08-10T03:45Z (scout, session): `plugins/fgOS/skills/merge-loop/
  SKILL.md` + `merge-next/SKILL.md` — `merge-loop` = `/loop` quanh
  `/fgOS:merge-next`; mỗi vòng gọi `fgos merge next`, verb này đọc
  `mergeReadiness(view).ready[0]` MỚI mỗi lần (recompute sau mỗi merge),
  rồi `approve` nó. Xác nhận: cải thiện order ở `mergeReadiness` sẽ tự
  động thay đổi thứ tự automation thật thực thi, không cần đổi
  `merge-next`/`merge-loop`.
- 2026-08-10T03:46Z (scout, session): tsk-2xt (`doing`/`decompose`) —
  kiến trúc auto-launch pane đã chốt: khi setting `auto-merge` bật,
  herdr-orchestrator tự launch pane vào tab cố định `fg:operation` chạy
  `merge-loop`. tsk-2xt tự khai rõ "logic pick giữ nguyên (không đổi)" —
  tsk-2xt không sửa thuật toán chọn, chỉ launch pane. Nên tsk-3cs và
  tsk-2xt độc lập, không cần dep, nhưng bổ trợ trực tiếp.
- 2026-08-10T03:47Z (scout, session): `src/state/priority-formula.mjs:63`
  — `rankImpact`'s `blocks` cũng đã được `computeImpact` tái dùng cho
  `priority`/triage ranking nói chung (một consumer khác của cùng field)
  — đổi ý nghĩa `blocks` (nếu #1 trên chọn hướng đó) sẽ gợn sang cả
  triage, cần cân nhắc khi chốt #1.

- 2026-08-10T10:20Z (người dùng): Đặt câu hỏi vision trước khi thảo luận
  chi tiết — ai (process nào) thực hiện merge: (A) một process merge tổng
  (merge-loop/herdr-plugin) tự chọn item rồi merge vào đúng vị trí trong
  tree; (B) process cha điều phối các con, tự merge con vào mình sau khi
  con xong; (C) cả A và B. Nghiêng về A tự xử lý được hết. Trả lời Q1
  (bottleneck): "đợi merge để làm tiếp" — nghiêng hướng hẹp nhưng tự nhận
  "nghĩ đơn giản, cần tư vấn thêm". Q2 (đệ quy): "recursive". Q3 (tree
  scope): "không hiểu câu hỏi".
- 2026-08-10T10:35Z (scout, session): `bin/fgos.mjs:2689` (`approve`) —
  xác nhận `approve` tự resolve target branch động qua `resolveRoot`/
  `branchNameFor` MỖI LẦN gọi (leaf → `fgw/<root>`, root → `main`) — CÙNG
  một verb cho cả hai tier, không có cơ chế "cha tự merge con" riêng biệt.
  `src/state/cleanup-harness.mjs:115-116` xác nhận bằng lời: "decompose-
  into-children never itself merges `fgw/<id>` into anything -- its
  children's own branches merge directly into the same resolved root".
  → model B không tồn tại trong codebase; model A đã khớp thực tế.
  `fgos merge list --json` thật lúc scout: `ready: 11 item`, `waiting: 0`,
  `blockedOnSync: 1` — dữ liệu thật cho thấy §3 dòng 1's tín hiệu hẹp
  (đếm `waiting`) sẽ gần như luôn = 0, không có tác dụng phân biệt thứ tự
  thật hôm nay.
- 2026-08-10T10:38Z (session): Đề xuất Q1 = tái dùng `blocks` sẵn có
  (không phát minh metric mới), và làm rõ Q3 bằng ví dụ cụ thể (root X có
  2 con A/B, A bị footprint-conflict, B bị sync-drift — có hiện hai con
  này trong tree hay ẩn đi).
- 2026-08-10T11:23Z (người dùng): Xác nhận chỉ có model A, nhưng làm rõ
  câu hỏi thật của mình không phải "quy trình" mà là "process INSTANCE
  nào đang claim item+worktree để merge" — kể kinh nghiệm thực tế: có lúc
  một merge-loop chạy, có lúc nhiều tiến trình sau khi xong việc tự merge
  đồng thời, tranh lock, khiến người dùng phải hang-around đợi bấm
  approve. Yêu cầu: cần sự rõ ràng/rành mạch về AI (who) thực hiện merge
  xuyên suốt hệ thống để (a) smooth và (b) người dùng quan sát rõ cái gì
  đã/cần merge — giao việc tự giải quyết concrete design này cho session
  ("smart agent như em cần tự giải quyết"). Q3: xác nhận "show all" (A/B
  dù gì cũng phải merge vào X).
- 2026-08-10T11:30Z (scout, session): Grep mọi entry point gọi `approve`/
  `merge next` hôm nay (`grep -rl "fgos approve\|merge next" plugins/
  .claude/skills bin/ src/runner`) — tìm thấy `fgos-fanout` là caller thứ
  hai, độc lập với `merge-loop`, TỰ gọi `fgos approve` cho leaf auto-
  approve (`.claude/skills/fgos-fanout/SKILL.md:94-106`), với logic order
  riêng của nó. `cook`/`pick` xác nhận KHÔNG tự gọi approve (dừng ở
  `awaiting-approval`, "theirs to run next"). `bin/fgos.mjs:287` +
  `withLockRetry` xác nhận lock hiện có ngăn corruption khi nhiều approve
  chạy đồng thời (đã tự trải nghiệm lock-held khi claim tsk-2ec đầu
  session này) — nghĩa là vấn đề không phải correctness mà là
  coordination/observability. Đề xuất single-owner = `merge-loop` (dòng 6
  trong §3), hỏi người dùng có tách fanout-conflict thành item riêng
  ngay không.

## 6. Thiết kế đã chốt {#design}

*(chưa đủ chín để viết — còn 4 điểm mở ở §3)*

## 7. Danh mục hạng mục / task {#tasks}

*(chưa tách task — chờ §6 ổn định)*
