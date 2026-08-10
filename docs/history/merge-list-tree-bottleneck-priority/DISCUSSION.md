# Merge-list tree view + bottleneck-priority merge order

## 1. Trạng thái hiện tại

Vòng đầu tiên. Đã scout xong bức tranh hệ thống hiện có (xem §5). Câu hỏi
mở đang chờ trả lời: định nghĩa chính xác của "bottleneck" dùng để sort
(§3, dòng 1), và xác nhận layer nào sở hữu logic sort mới (§3, dòng 2).
Chưa có D-ID nào được chốt.

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
| 1 | Định nghĩa "bottleneck" dùng để sort: `rankImpact`'s `blocks` (toàn graph, mọi status) hay một tín hiệu hẹp hơn — đếm riêng item đang nằm trong `mergeReadiness`'s `waiting` bucket mà bị chặn trực tiếp bởi item này? | chưa rõ | Hai con số có thể khác xa nhau: `blocks` cao không có nghĩa các item phụ thuộc đó đã sẵn sàng chờ merge (`awaiting-approval`) — có thể chúng còn ở `todo`/`doing` rất xa. |
| 2 | Logic sort mới đặt ở đâu: sửa `rankImpact`/`mergeReadiness` (JS, `src/state/`) hay chỉ ở tầng hiển thị Rust? | gần như đã rõ, cần xác nhận | `merge next`/`merge-loop` (mà tsk-2xt sẽ tự-launch) đọc thẳng `mergeReadiness(view).ready[0]` — nếu bottleneck-priority chỉ nằm ở Rust rendering, tree hiển thị một thứ tự nhưng automation thực thi thứ tự khác. Nghiêng về: sửa ở JS engine, Rust chỉ phản ánh lại. |
| 3 | Tree hiển thị gồm những gì: chỉ `ready`, hay cả `waiting`/`blockedOnSync`/`mergeSets`/`supersededOut` (dưới dạng node phụ/xám)? | chưa rõ | |
| 4 | Bottleneck-priority áp dụng đệ quy ở mọi cấp child-merge, hay chỉ ở top-level (root-to-main)? | chưa rõ | Người dùng: "con cũng sort theo trình tự như ở top level" — có vẻ là đệ quy, cần xác nhận rõ ràng bằng câu trả lời riêng. |
| 5 | Quan hệ với tsk-2xt | rõ | Độc lập nhưng bổ trợ: tsk-2xt tự khai "logic pick giữ nguyên" (không đổi), nên cải thiện sort ở đây tự động nâng cấp hành vi automation của tsk-2xt mà không cần đổi gì bên tsk-2xt. Không cần dep giữa hai item. |

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

## 6. Thiết kế đã chốt {#design}

*(chưa đủ chín để viết — còn 4 điểm mở ở §3)*

## 7. Danh mục hạng mục / task {#tasks}

*(chưa tách task — chờ §6 ổn định)*
