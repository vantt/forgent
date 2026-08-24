# CONTEXT — Tầng A: content-hash identity + multi-file per-session + compaction cho `.fgos/events.jsonl`

Item: `tsk-3ve` · Nguồn quyết định: `DISCUSSION.md` cùng thư mục (3 vòng
shaping, hội tụ 2026-08-23) + 16 decision đã log qua `fgos decision --id
tsk-3ve`.

## Feature boundary

Trong phạm vi: cấu trúc dữ liệu của event log — identity content-hash,
tách file per-session dưới `.fgos/events/`, replay đa-file deterministic,
incremental anchor mới, truncation-guard/periodic-checkpoint theo thư mục,
compaction có verify gate. Ngoài phạm vi: vị trí ghi (mọi write vẫn về main
checkout — ADR0020 không đảo; Tầng B là item riêng), SQLite view layer
(TA-D15 — item tương lai), state.json write-amplification (quan sát, không
sửa ở đây).

## Locked decisions

| D-ID | Quyết định |
|---|---|
| — | TA-D7: tổng thứ tự replay = (ts, tên-file, seq-trong-file) — deterministic, bảo toàn causality nội-writer; sort ts đơn thuần bị bác vì không định nghĩa thứ tự khi 2 file trùng ts |
| — | TA-D8: snapshot anchor incremental read ghi thêm maxTs; fast-path chỉ chạy khi mọi event mới có ts > maxTs (strict), mọi nghi ngờ rơi về full rebuild |
| — | TA-D9: mỗi event mới stamp field src (writer id từ resolveWriterIdentity); hash tính trên dòng đã có src — 2 event thật khác nhau không bao giờ byte-identical theo cấu trúc |
| — | TA-D10: truncation guard mở rộng map per-file + periodic auto-commit/getUncommittedEventCount quét cả .fgos/events/ + doctor checks rescope — nằm TRONG scope Tầng A (T5) |
| — | TA-D11: naming file per-session = <writer-id>-<openTs>.jsonl; mỗi writer đúng 1 file đang-mở, process cùng session append tiếp; nguồn UNRESOLVED (fallback pid) tạo file-per-invocation là degraded mode chấp nhận được, compaction gom sau |
| — | TA-D12: di trú KHÔNG rewrite 23K dòng cũ — events.jsonl hiện tại thành baseline-0 nguyên trạng, vẫn là source thật của replay; write path mới chỉ ghi .fgos/events/; cutover 1 lần, không dual-write; merge=union giữ cho file cũ, không áp cho events/* |
| — | TA-D13: compaction chỉ gom file của writer đã chết/idle quá ngưỡng, chạy dưới events.lock, verify gate xanh mới git mv vào archive/; replay dedupe theo hash MỌI LÚC (legacy: theo nội dung dòng) nên crash giữa compaction vô hại theo cấu trúc; ngưỡng số đo thật rồi chọn, config key riêng |
| — | TA-D14: events.lock giữ nguyên phạm vi TOÀN thư mục .fgos/ — multi-file loại git-conflict, không loại local race; CAS precondition + refreshView-trong-lock (tsk-1q5) cần một critical section duy nhất; per-file lock là sai |
| — | TA-D15: SQLite view layer KHÔNG nằm trong Tầng A — state.json giữ nguyên; khi số đo parse/rewrite state.json vượt ngưỡng cảm được thì submit item riêng swap JSON→SQLite (node:sqlite, nâng engines >=22); số đo nền: 8.1MB/1013 items, 67ms đọc + 70ms parse mỗi call |
| — | TA-D0: Tầng A mượn cấu trúc dữ liệu harness (multi-file, content-hash, compaction), KHÔNG mượn vị trí ghi — mọi write vẫn về main checkout, ADR0020 không đảo; Tầng B là item riêng cần xác nhận riêng |
| — | TA-D1: identity mỗi event = SHA-256 cắt 16 hex trên nội dung dòng JSONL; seq/ts thành field mô tả/hiển thị, không còn là khoá định danh chính |
| — | TA-D2: tách events.jsonl thành nhiều file nhỏ theo session dưới .fgos/events/, git-tracked — 2 writer đồng thời là 2 file khác tên, không bao giờ git conflict; merge=union hết cần cho log mới |
| — | TA-D3: rebuildView/replay đổi bước liệt kê nguồn — gom mọi file trong .fgos/events/ (trừ archive/) cộng events.jsonl cũ, sort theo ts trong nội dung event, tái dùng nguyên vẹn foldEvents/applyEvent |
| — | TA-D4: giữ nguyên cơ chế incremental-anchor-read của state.json (tsk-49e), chỉ đổi đơn vị anchor từ byte-offset-1-file sang danh-sách-file-đã-tiêu-thụ + offset file đang dở |
| — | TA-D5: compaction định kỳ gộp file nguội thành baseline mới; KHÔNG xoá file gốc (archive bằng git mv — RUL11/ADR-0019); trigger tái dùng event-count-based của tsk-1vc D2, không bày lịch mới |
| — | TA-D6: gate kiểm tra trước khi publish baseline (deep-equal view + đếm event + so tập hash) đăng ký thành check mới trong fgos doctor registry (src/setup/registrations.mjs pattern) |
| — | INCIDENT 2026-08-23 ~10:29-10:33Z: 7 lệnh fgos decision (TA-D0..TA-D6, vòng shaping 1) exit 0 nhưng event không bao giờ xuất hiện trong .fgos/events.jsonl main checkout — không checkpoint commit nào từng chứa (git log --all -S), interleaving seq các session khác trong cùng window contiguous không gap, không tìm thấy trong worktree/global store nào, guard không fire. Cùng class tsk-1vc (silent loss, exit-0-nhưng-mất). Đã re-record 16/16 với read-back verification. Bằng chứng sống củng cố động cơ của chính tsk-3ve: single-file shared log không đáng tin ngay cả khi CLI báo thành công |

## Pinned terms

- **baseline-0** — file `.fgos/events.jsonl` hiện tại (23.280 dòng), giữ
  nguyên trạng làm nguồn replay đầu tiên, không bao giờ rewrite (TA-D12).
- **file đang mở** — file `<writer-id>-<openTs>.jsonl` mới nhất chưa
  archive mang prefix của writer đó (TA-D11).
- **writer id** — kết quả `resolveWriterIdentity`
  (`src/util/session-identity.mjs`): env session id → ancestor-pid →
  UNRESOLVED.
- **h / src** — 2 field mới trên mỗi event: `h` = SHA-256 cắt 16 hex trên
  nội dung dòng (TA-D1), `src` = writer id (TA-D9).
- **tổng thứ tự replay** — `(ts, tên-file, seq-trong-file)` (TA-D7).

## Scout evidence (đọc trực tiếp vòng 1, chi tiết DISCUSSION.md §5)

- `src/state/events.mjs` — appendEvent/appendEventCore/withEventsLock;
  lock link-atomic derive từ `dirname(logPath)`.
- `src/state/store.mjs` — `paths(dir)` là điểm chạm duy nhất tên file;
  `withEventsLockAndRefresh` (tsk-1q5) gộp CAS + append + refreshView vào
  một critical section.
- `src/state/replay.mjs` — `tryIncrementalRebuild` 3 nấc; guarantee
  rebuild-twice-deep-equal.
- `src/state/events-jsonl-truncation-guard.mjs` — guard mark 1 file +
  `runOpportunisticMainCheckoutChecks` (threshold 50 event / config
  `checkpoint.eventThreshold` / 15 phút).
- `src/setup/registrations.mjs` — doctor checks `events-jsonl-contiguous`,
  `events-jsonl-not-truncated` (pattern đăng ký cho gate mới).
- Consumer `seq` ngoài core: chỉ hiển thị trong kết quả CLI (grep toàn
  repo) — đổi seq thành per-file an toàn về contract.
- Số đo: events.jsonl 23.280 dòng/~10MB; state.json 8.1MB/1013 items,
  67ms đọc + 70ms parse mỗi call.

## Canonical references

- `DISCUSSION.md` cùng thư mục — §6 synthesis, §7 danh mục task (anchor
  per-task).
- `plans/reports/investigation-260821-1202-eventlog-branch-union-decision-history-report.md`
  — phân tích harness/beehive gốc.
- `docs/history/events-jsonl-merge-driver-recurring-write-loss/CONTEXT.md`
  (tsk-3wq), `docs/history/tsk-1vc-silent-eventlog-loss-detection/CONTEXT.md`
  (tsk-1vc) — 2 sự cố nền.

## Outstanding questions

None
