# Discussion — tsk-3tp: Tầng B (worker ghi `.fgos/events/` trong worktree)

## 1. Trạng thái hiện tại

Vòng 1, mới mở. Chưa có D-ID nào chốt. Item `tsk-3tp` tự nó đã tích luỹ 4 mục
"CẢNH BÁO" qua nhiều lần đọc lại (bản thân đề bài, không phải scout mới) —
nghiêng dần từ "bước tiếp theo hợp lý sau Tầng A" sang "có thể chưa cần làm".
Round này scout lại 2 claim cốt lõi của cảnh báo #2/#4 bằng code thật (không
suy diễn từ mô tả cũ), xác nhận cả hai đều còn đúng tính đến hôm nay. Câu hỏi
mở đang chờ anh: có nên tiếp tục shape thiết kế Tầng B, hay dừng ở đây và ghi
nhận "chưa cần" — xem §3 dòng đầu.

## 2. Mục tiêu & đề bài

Tầng B, nếu làm, cho phép worker — tiến trình out-of-process chạy trong
worktree `fgw/<id>` qua `agy`/`dispatch.mjs execute`, không phải session gọi
`fgos` trực tiếp — ghi một file changeset events mới ngay trong worktree của
chính nó, thay vì mọi write dồn hết về main checkout như hiện tại; `merge.mjs`
guard `.fgos-write-rejected` sẽ cần một ngoại lệ hẹp — chấp nhận diff CHỈ
THÊM (không sửa/xoá) một file mới dưới `.fgos/events/` khi merge nhánh
`fgw/<id>`, mọi path khác trong `.fgos/` vẫn bị từ chối cứng như hiện tại.
Đây là item Tầng B trong chuỗi 2 tầng — Tầng A (`tsk-3ve`, đổi
`events.jsonl` sang content-hash identity + sharding theo session/burst) là
dep bắt buộc, đang `doing`/`executing`, CHƯA xong. Việc này đảo một phần hẹp
của D-ADR0020 (chặn `.fgos/` khỏi worktree worker) — một quyết định đã chốt
vì lý do bảo mật (worker's execution context có capability wall yếu, một
write lạc sẽ đập thẳng vào `events.jsonl` sống, không qua review), nên theo
rule "User Decisions", việc mở lại nó không phải phán đoán của phiên này.

## 3. Vấn đề rõ / chưa rõ

| # | Câu hỏi | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Có nên tiếp tục shape Tầng B ngay bây giờ, hay dừng và ghi nhận "chưa cần"? | **Chưa rõ — chờ anh quyết** | Item tự nó đã nghiêng về "chưa cần" (cảnh báo #4); round này xác nhận thêm bằng chứng, xem dòng 3 dưới. |
| 2 | `tsk-3ve` (Tầng A, dep bắt buộc) đã xong chưa? | **Rõ — CHƯA xong** | `fgos show tsk-3ve --json`: `status:todo`, `stage:executing`. Đề bài chính item này nói rõ: đọc mà dep chưa xong thì dừng, không shape code dựa trên cấu trúc file `.fgos/events/<session-id>-<ts>.jsonl` chưa tồn tại thật. Vòng này vì vậy chỉ thảo luận Ở MỨC CHÍNH SÁCH (có nên mở lại ADR0020 hay không), chưa động tới hình dạng file cụ thể. |
| 3 | Worker hôm nay có thật sự không đọc/ghi `.fgos/` từ trong worktree không (YAGNI-check cảnh báo #2)? | **Rõ — xác nhận lại bằng code thật, vẫn đúng** | `grep .fgos src/runner/dispatch/*.mjs`: chỉ có `dispatch/cli.mjs`'s `spawnWorker` nhận `opts.fgosDir` — dùng để launcher (không phải worker) gọi `fgos tool query` presence-check qua `resolveExecutorCommand`; comment tại dòng ~222-224 nói thẳng "fgosDir's root (always the main checkout)" và tách bạch với `attestRoot: cwd` (worktree của worker). Không có call site nào trong `dispatch/*.mjs` cho phép TIẾN TRÌNH WORKER tự đọc/ghi `.fgos/` từ bên trong worktree của nó — đúng như cảnh báo #2 nói, dispatch path 23/8 (đã có agy, fanout) vẫn giữ nguyên tính chất này so với lúc ADR0020 chốt (28/7). |
| 4 | Tầng B có giải được root cause #1 gốc (tần suất commit lên main quá nhanh, buộc `fgw/<id>` catchup thường xuyên) không? | **Rõ — không, hoặc chỉ một phần rất hẹp** | Theo report 21/8 đã dẫn trong đề bài: nguồn write gây áp lực chính là periodic checkpoint + session commit trực tiếp lên main — cả hai đường này KHÔNG đi qua vòng đời "worktree rồi merge" mà Tầng B nhắm tới. Tầng B chỉ có tác dụng cho write sinh ra từ WORKER — nhưng câu 3 vừa xác nhận worker hôm nay không sinh write `.fgos/` nào cả, nên chưa có khối lượng thật ở đúng chỗ Tầng B nhắm giảm. |
| 5 | Nếu quyết "chưa cần Tầng B", hướng nào giải đúng root cause #1 (giảm tần suất commit của SESSION lên main)? | **Chưa rõ — chưa scout, ngoài phạm vi item này nếu tách ra** | Item tự đề xuất hướng này ở cảnh báo #4 nhưng chưa điều tra. Không thuộc §7 của discussion này trừ khi anh muốn mở rộng phạm vi. |

## 4. Quyết định đã chốt

(Chưa có D-ID nào — vòng 1, chưa có điểm nào giữ ổn định qua nhiều vòng.)

## 5. Q&A log

- **[2026-08-23, vòng 1, scout]** Đọc `fgos show tsk-3tp --json` + `fgos show
  tsk-3ve --json`: xác nhận dep `tsk-3ve` status `todo`/stage `executing`,
  chưa xong. Đọc `docs/decisions/index.md` dòng D-ADR0020 (retired, narrative
  dời sang `docs/specs/runner.md` theo tsk-1lv-4) và
  `plans/reports/investigation-260821-1202-eventlog-branch-union-decision-history-report.md`
  mục "Step-by-step để đạt hướng harness" (dòng 152-180) — nguồn gốc trực
  tiếp của đề xuất Tầng A/Tầng B và câu hỏi mở "cần xác nhận của anh trước
  khi lên plan". Grep `src/runner/dispatch/*.mjs` cho mọi tham chiếu `.fgos`
  — xác nhận claim ở §3 dòng 3 (worker không tự đọc/ghi `.fgos/` từ
  worktree hôm nay, `fgosDir` chỉ phục vụ launcher's tool-presence check
  trên main checkout). Chưa hỏi gì mới cho người — câu hỏi mở là câu đã có
  sẵn trong chính đề bài item, chuyển tiếp nguyên văn xuống dưới.

## 6. Thiết kế đã chốt {#design}

(Chưa có gì để tổng hợp — chưa có quyết định nào chốt ở §4. Mục này sẽ được
viết lại toàn bộ ngay khi vòng đầu tiên có D-ID.)

## 7. Danh mục hạng mục / task {#tasks}

(Chưa có — chờ §6 có hình dạng cụ thể trước khi tách task.)
