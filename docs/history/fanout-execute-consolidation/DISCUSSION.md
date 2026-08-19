# fanout-execute-consolidation — DISCUSSION

## 1. Trạng thái hiện tại

Vừa mở. Chưa có quyết định nào chốt. Round 1: scout xong 3 nguồn chính
(`fgos-fanout/SKILL.md`, `references/wave-dispatch-mechanics.md`,
`src/state/worker-slots.mjs`/`graph-metrics.mjs`), đang chờ người quyết
phạm vi trước khi đi tiếp.

## 2. Mục tiêu & đề bài

`fgos-fanout`'s workflow hiện tại spell ra từng bước bash/prose cho agent
tự chạy tuần tự: đọc `fgos list --json`, gọi `computeSchedule` (thật ra
đây là 1 hàm JS pure, không phải verb CLI — nghĩa là hiện tại KHÔNG agent
nào gọi trực tiếp được hàm này qua CLI, phải suy luận lại logic của nó
bằng tay từ mô tả prose), đọc `fgos slots --json`, tự trim batch theo
`execution.free`, rồi với mỗi candidate out-of-process: 3 lệnh riêng
(`fgos pick` → `dispatch.mjs execute --cwd <worktree>` → `fgos return`).
Đây chính là phần "code nhúng trong skill" bị nghi ngờ — không phải bash
đơn lẻ (như hầu hết skill khác), mà là 1 thuật toán nhiều bước với biến
truyền qua các bước, loop, điều kiện.

Mục tiêu của item này: xác định phần nào trong luồng đó gom được thành 1-2
verb thật (chạy 1 lần, trả JSON có cấu trúc), và phần nào BẮT BUỘC ở lại
skill vì lý do kiến trúc thật (không phải vì lười refactor).

**Ràng buộc kiến trúc đã xác nhận (không phải điểm cần bàn — sự thật kỹ
thuật)**: nhánh in-process của Step 3/4 (fire native Agent chạy
`/fgOS:pick <id>`) không thể gom vào `dispatch.mjs`/`fgos` verb, vì
`dispatch.mjs` tự nhận nó "has no Task/Agent tool to call (a passive
CLI/library)" (`src/runner/dispatch/cli.mjs`'s own docblock). Chỉ live
session mới gọi được Agent tool. Vòng lặp đó ở lại skill vĩnh viễn, không
phải một quyết định cần chốt ở đây.

## 3. Vấn đề rõ / chưa rõ

| # | Câu hỏi | Trạng thái |
|---|---|---|
| 1 | Phạm vi gom: chỉ 3-lệnh out-of-process (pick→execute→return), hay gom cả slot-poll/trim-batch (Step 3 phần đọc `fgos slots` + trim) vào cùng 1 verb? | Chưa rõ — đang hỏi |
| 2 | Verb mới đặt ở đâu: subcommand mới trong `dispatch.mjs` (đã có decide/execute/log), hay verb riêng trong `bin/fgos.mjs` (vì chain cần cả `fgos pick`/`fgos return`, hai verb engine, không chỉ dispatch)? | Chưa rõ — đang hỏi |
| 3 | Risk-keyword approve check (Step 5, trước khi auto-approve 1 leaf) — đây là hàm thuần deterministic (`HEAVY_KEYWORDS`, `src/intake/risk-keywords.mjs`), không phải judgment LLM thật. Có nên gom luôn vào verb "gather+approve" không, hay giữ lại skill vì nó VẪN là 1 gate trước khi auto-approve (an toàn hơn khi để agent tự thấy)? | Chưa rõ — đang hỏi |
| 4 | Known hazard đã ghi trong SKILL.md hiện tại (worktree-isolation race khi nhiều Agent concurrent enter worktree) chỉ xảy ra ở nhánh in-process, KHÔNG bị item này đổi gì — có cần ghi chú rõ trong CONTEXT.md sau này rằng item này không chạm/không sửa hazard đó, để tránh ai đó tưởng consolidation "tiện thể" fix luôn? | Chưa rõ — đang hỏi |
| 5 | Đã verify: có `fgos schedule` (CLI verb, `bin/fgos.mjs:2550`) bọc `computedSchedule(dir)` (`store.mjs:1444`) — NHƯNG gọi `computeSchedule(view)` KHÔNG truyền `candidateIds`, tức luôn tính trên TOÀN BỘ frontier. Fanout cần bản SCOPED (`computeSchedule(view, openCandidates)`, chỉ candidate set của 1 parent) — verb hiện có không phủ được case này. Vậy: mở rộng `fgos schedule` thêm `--candidates <id,id,...>` optional, hay verb mới riêng cho fanout? | Rõ hơn — còn 1 lựa chọn cần người quyết |

## 4. Quyết định đã chốt

(chưa có — chưa điểm nào giữ ổn định qua >1 round)

## 5. Q&A log

- **2026-08-19 (round 1, kickoff)** — Item tạo từ audit dispatch-execute
  optimization pass cùng ngày
  (`plans/reports/audit-260819-2045-dispatch-execute-optimization-report.md`)
  và quan sát của user: "code ở skill nhiều quá có tốt không... dispatch
  xử được không". Scout xong `fgos-fanout/SKILL.md` +
  `references/wave-dispatch-mechanics.md` (nguồn duy nhất trong 14
  dev-skill có loop/điều kiện đa bước thật, 12/14 skill còn lại chỉ có
  bash 1-lệnh) + xác nhận `computeSchedule`/`hasWorkerSlotRoom`/
  `countWorkerSlots` đã là hàm JS pure có sẵn (`src/state/graph-
  metrics.mjs`, `src/state/worker-slots.mjs`). Verify thêm: `fgos schedule`
  (CLI, `bin/fgos.mjs:2550`) đã bọc `computeSchedule` nhưng chỉ bản KHÔNG
  scoped (toàn frontier, không nhận `candidateIds`) — không phủ case
  fanout cần. Đặt 5 câu hỏi ở §3, trình bày trực tiếp cho người ngay trong
  round này (không park, không AskUserQuestion, theo hard rule của skill
  này).

## 6. Thiết kế đã chốt {#design}

(chưa có gì để tổng hợp — chưa điểm nào chốt)

## 7. Danh mục hạng mục / task {#tasks}

(chưa chia — chờ §6 có hình dạng cụ thể trước)
