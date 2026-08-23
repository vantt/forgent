# plan — tsk-3ve: Tầng A event log (multi-file + content-hash + compaction)

Mode: high-risk

Lane flags đếm được (fgos-routing Mode gate): data model (đổi schema/identity
của event log), existing covered behavior (test suite phủ dày events/replay/
store), và hard-gate flag "data loss" (đổi đúng cơ chế từng gây mất data thật
— tsk-n4i, tsk-1vc, và incident 2026-08-23 ghi trong CONTEXT.md's Locked
decisions). Hard-gate flag một mình đã đủ đẩy lên high-risk; lane nhỏ hơn
không che nổi item chạm tầng truth của toàn engine.

## Approach

Nguồn quyết định: CONTEXT.md cùng thư mục (bảng Locked decisions, 17 hàng,
render từ log) + DISCUSSION.md §6 synthesis. Không mở lại quyết định nào —
mọi lựa chọn dưới đây trích D-ID.

Con đường chọn: 6 mảnh tuyến tính, mỗi mảnh tự verify được, theo đúng
DISCUSSION.md §7 (TA-D0 khoá scope; thứ tự do phụ thuộc dữ liệu thật quyết
định, không phải sở thích):

1. **T1 hash+src schema** (TA-D1, TA-D9) — thêm `h`/`src` vào event mới ngay
   tại `appendEventCore` (`src/state/events.mjs`). Đứng đầu vì mọi mảnh sau
   (dedupe, verify gate) tiêu thụ identity này.
2. **T2 write path multi-file** (TA-D2, TA-D11, TA-D14) — `paths(dir)`
   (`src/state/store.mjs`) là điểm chạm duy nhất tên file; thêm resolution
   file-đang-mở per-writer dưới `.fgos/events/`; `events.lock` giữ nguyên
   phạm vi toàn thư mục.
3. **T3 read/replay đa-file** (TA-D3, TA-D7, TA-D12) — discovery gom
   baseline-0 + `events/*` trừ `archive/`, merge-sort `(ts, tên-file, seq)`,
   dedupe theo hash (legacy: theo dòng), fold logic nguyên vẹn.
4. **T4 incremental anchor** (TA-D4, TA-D8) — anchor map per-file + `maxTs`,
   strict `ts > maxTs` mới đi fast-path.
5. **T5 guard + checkpoint theo thư mục** (TA-D10) — mark map per-file,
   auto-commit quét `events/`, doctor checks rescope.
6. **T6 compaction + verify gate** (TA-D5, TA-D6, TA-D13) — module mới
   `src/state/events-compaction.mjs` + doctor check; cần T1 (hash) và T3
   (dedupe replay) đứng trước để crash-giữa-compaction vô hại theo cấu trúc.

Phương án bị bác (trích CONTEXT.md/DISCUSSION.md, không bàn lại): rewrite
23K dòng cũ (TA-D12 bác — vi phạm log bất biến), per-file lock (TA-D14 bác),
sort ts đơn thuần (TA-D7 bác), SQLite view layer trong scope này (TA-D15
bác).

## Risk map

| Risk | Mức | Proof point cho validating |
|---|---|---|
| Replay đa-file không deterministic (2 rebuild ≠ nhau) | cao | Tổng thứ tự TA-D7 là total order thật (ts, tên-file, seq đều so sánh được, không hoà); test determinism mới trên fixture ts-trùng + log thật là verify của T3 |
| Incremental fold ≠ full rebuild khi event mới mang ts cũ | cao | Điều kiện strict `ts > maxTs` (TA-D8) rơi về full read — wrong-in-doubt chỉ chậm, không sai; test fallback là verify của T4 |
| Dedupe-by-hash gộp nhầm 2 event thật | trung | TA-D9: `src` làm dòng unique theo cấu trúc; scout xác nhận `resolveWriterIdentity` đã stamp writer trên mọi mutating event (src/util/session-identity.mjs đọc trực tiếp) |
| CAS/lock semantics vỡ khi nhiều file | cao | TA-D14 giữ nguyên một `events.lock` toàn thư mục — `withEventsLockAndRefresh` (tsk-1q5, src/state/store.mjs:148) không đổi shape, chỉ đổi logPath resolution |
| Migration làm mất/đọc sai 23K event cũ | cao | TA-D12: baseline-0 nguyên trạng, zero rewrite — đường đọc cũ (`parseEventLines`) áp nguyên; test fixture legacy+new trộn là verify của T3 |
| Guard/checkpoint mù với thư mục mới | trung | TA-D10 nằm trong scope (T5), pattern registry đã có (`src/setup/registrations.mjs:1178,1222`) |
| Compaction chạy trên file đang sống | trung | TA-D13: chỉ writer chết/idle, dưới events.lock, verify gate deep-equal trước archive; crash-giữa-chừng vô hại nhờ dedupe (T3) |
| `porting-store.mjs` (store thứ hai dùng chung events.mjs) vỡ | thấp | events.mjs core giữ nguyên contract per-file; multi-file là composition ở store.mjs — porting-store không đổi dòng nào |

## Files touched (theo thứ tự)

`src/state/events.mjs` → `src/state/store.mjs` → `src/state/replay.mjs` →
`src/state/events-jsonl-truncation-guard.mjs` + `src/setup/registrations.mjs`
→ `src/state/events-compaction.mjs` (mới) + test tương ứng từng mảnh.

## Step 4 — Split

Split thật, 6 con, deps tuyến tính theo index (T5 chỉ cần T2; T6 cần T1+T3):

```json
[
  {
    "title": "Tầng A/T1 — stamp h (16-hex SHA-256) + src (writer id) lên mỗi event mới trong appendEventCore",
    "verify": "node --test test/state/events.test.mjs",
    "action": "Trong src/state/events.mjs's appendEventCore, thêm field h = SHA-256 cắt 16 hex trên nội dung dòng và src = writer id từ resolveWriterIdentity, theo TA-D1 và TA-D9; seq giữ nguyên vị trí nhưng doc lại thành per-file descriptive; log cũ không có h/src vẫn đọc nguyên vẹn (D7a). Đọc DISCUSSION.md#task-hash-identity-schema trước khi code.",
    "footprint": ["src/state/events.mjs", "test/state/events.test.mjs"],
    "kind": "task",
    "risk": "standard",
    "refs": ["docs/history/eventlog-tier-a-multifile-content-hash/DISCUSSION.md#task-hash-identity-schema"],
    "deps": []
  },
  {
    "title": "Tầng A/T2 — write path multi-file: mỗi writer một file đang-mở dưới .fgos/events/, events.lock giữ phạm vi toàn thư mục",
    "verify": "node --test test/state/store.test.mjs test/state/events.test.mjs",
    "action": "Trong src/state/store.mjs, resolve file đang-mở <writer-id>-<openTs>.jsonl dưới .fgos/events/ theo TA-D2 và TA-D11, append qua appendEvent hiện có với seq per-file; events.lock GIỮ NGUYÊN phạm vi toàn .fgos/ theo TA-D14 (per-file lock là sai — CAS + refreshView cần một critical section); withEventsLockAndRefresh (tsk-1q5) không đổi shape. Đọc DISCUSSION.md#task-multifile-write-path trước khi code.",
    "footprint": ["src/state/store.mjs", "test/state/store.test.mjs"],
    "kind": "task",
    "risk": "heavy",
    "refs": ["docs/history/eventlog-tier-a-multifile-content-hash/DISCUSSION.md#task-multifile-write-path"],
    "deps": [0]
  },
  {
    "title": "Tầng A/T3 — replay đa-file: baseline-0 + events/* trừ archive/, total order (ts, tên-file, seq), dedupe theo hash",
    "verify": "node --test test/state/replay.test.mjs test/state/store.test.mjs",
    "action": "Trong src/state/replay.mjs + store.mjs, đổi discovery step: gom events.jsonl cũ (baseline-0 nguyên trạng, zero rewrite theo TA-D12) cộng mọi *.jsonl trong .fgos/events/ trừ archive/, merge-sort theo total order (ts, tên-file, seq-trong-file) theo TA-D7, dedupe theo hash — dòng legacy theo nội dung dòng — theo TA-D13; foldEvents/applyEvent tái dùng nguyên vẹn theo TA-D3; mọi reader raw (readRawEvents, staleDoingAdvisory, show) đi qua cùng cửa đọc mới. Test determinism: rebuild 2 lần deep-equal trên fixture ts-trùng chéo file VÀ trên log thật 23K dòng. Đọc DISCUSSION.md#task-multifile-read-replay trước khi code.",
    "footprint": ["src/state/replay.mjs", "src/state/store.mjs", "test/state/replay.test.mjs"],
    "kind": "task",
    "risk": "heavy",
    "refs": ["docs/history/eventlog-tier-a-multifile-content-hash/DISCUSSION.md#task-multifile-read-replay"],
    "deps": [1]
  },
  {
    "title": "Tầng A/T4 — incremental anchor per-file + maxTs cho state.json fast-path",
    "verify": "node --test test/state/replay.test.mjs",
    "action": "Trong src/state/replay.mjs's tryIncrementalRebuild + store.mjs's refreshView, đổi snapshot anchor thành map {files: {name: {size, lastLine}}, maxTs} theo TA-D4 và TA-D8; fast-path chỉ chạy khi mọi event mới có ts > maxTs STRICT, mọi nghi ngờ (file shrink, file mới, ts <= maxTs, biên trùng) rơi về full rebuild — wrong-in-doubt chỉ trả giá bằng chậm, không bao giờ sai data. Test đủ các nhánh fallback. Đọc DISCUSSION.md#task-incremental-anchor-multifile trước khi code.",
    "footprint": ["src/state/replay.mjs", "src/state/store.mjs", "test/state/replay.test.mjs"],
    "kind": "task",
    "risk": "heavy",
    "refs": ["docs/history/eventlog-tier-a-multifile-content-hash/DISCUSSION.md#task-incremental-anchor-multifile"],
    "deps": [2]
  },
  {
    "title": "Tầng A/T5 — truncation guard + periodic checkpoint + doctor checks theo thư mục events/",
    "verify": "node --test test/state/events-jsonl-truncation-guard.test.mjs test/setup/registrations.test.mjs",
    "action": "Trong src/state/events-jsonl-truncation-guard.mjs, mở rộng guard mark thành map {fileName -> {seq, hash}} cùng sidecar gitignored, và runOpportunisticMainCheckoutChecks + getUncommittedEventCount quét cả .fgos/events/ theo TA-D10; rescope doctor checks events-jsonl-contiguous/events-jsonl-not-truncated trong src/setup/registrations.mjs (legacy baseline-0 giữ check cũ, file mới check per-file đơn-writer). Per-session files vẫn git-tracked nên vẫn nguyên class lỗi git reset/checkout (tsk-cgg) — không làm mảnh này là Tầng A tự mở lỗ quan sát mới. Đọc DISCUSSION.md#task-guards-checkpoint-dir trước khi code.",
    "footprint": ["src/state/events-jsonl-truncation-guard.mjs", "src/state/events-jsonl-contiguity.mjs", "src/setup/registrations.mjs", "test/state/events-jsonl-truncation-guard.test.mjs", "test/setup/registrations.test.mjs"],
    "kind": "task",
    "risk": "standard",
    "refs": ["docs/history/eventlog-tier-a-multifile-content-hash/DISCUSSION.md#task-guards-checkpoint-dir"],
    "deps": [1]
  },
  {
    "title": "Tầng A/T6 — compaction file nguội thành baseline + verify gate đăng ký doctor",
    "verify": "node --test test/state/events-compaction.test.mjs test/setup/registrations.test.mjs",
    "action": "Module mới src/state/events-compaction.mjs: gộp file của writer đã chết/idle quá ngưỡng — chạy dưới events.lock — thành baseline-<ts>.jsonl theo TA-D5 và TA-D13; verify gate (deep-equal view + đếm event + so tập hash) đăng ký thành doctor check trong src/setup/registrations.mjs theo TA-D6; gate xanh mới git mv file gốc vào events/archive/, không xoá gì bao giờ; trigger event-count với config key riêng theo precedent checkpoint.eventThreshold, ngưỡng số đo thật rồi chọn. Test: crash-giữa-chừng (baseline + gốc cùng tồn tại) replay vẫn đúng nhờ dedupe; gate đỏ không archive gì. Đọc DISCUSSION.md#task-compaction-verify-gate trước khi code.",
    "footprint": ["src/state/events-compaction.mjs", "src/setup/registrations.mjs", "test/state/events-compaction.test.mjs", "test/setup/registrations.test.mjs"],
    "kind": "task",
    "risk": "standard",
    "refs": ["docs/history/eventlog-tier-a-multifile-content-hash/DISCUSSION.md#task-compaction-verify-gate"],
    "deps": [0, 2]
  }
]
```

Root verify sau split: `npm test` (đã sync lên item qua discover verdict —
full suite là proof của tổng thể, từng con có verify hẹp riêng ở trên).

## Outstanding questions

None
