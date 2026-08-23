# DISCUSSION — Tầng A: content-hash identity + multi-file per-session + compaction cho `.fgos/events.jsonl`

Item: `tsk-3ve` · Feature dir: `docs/history/eventlog-tier-a-multifile-content-hash/`

## 1. Trạng thái hiện tại

**HỘI TỤ** (vòng 3, 2026-08-23): anh chốt nốt O4 (SQLite → TA-D15: ngoài
Tầng A). Không còn điểm treo nào — §4 có đủ TA-D0…TA-D15 machine-readable,
§6 là synthesis chốt, §7 là danh mục 6 task con với anchor/D-ID/verify draft.
Bước tiếp theo duy nhất: set `refs` per-anchor và handoff native-first sang
`fgos-coding-exploring`/`fgos-coding-planning` cho chuỗi T1→T6.

Vòng 2: anh chốt P1–P4 + Q5/Q6/Q7 → TA-D7…TA-D13; R5 → TA-D14; §6
regenerate sạch marker «đề xuất»; phân tích câu hỏi SQLite (Q8).

Vòng 1: scout code toàn bộ đường ghi/đọc/guard/checkpoint (chi tiết §5),
mint TA-D0…TA-D6 từ report
`plans/reports/investigation-260821-1202-eventlog-branch-union-decision-history-report.md`,
phát hiện 4 gap thật (R1–R4) + 3 điểm để-ngỏ (O1–O3) kèm đề xuất.

## 2. Mục tiêu & đề bài

`.fgos/events.jsonl` hiện là một file append-only duy nhất, git-tracked, 23.280
dòng (~10MB), mà mọi session cùng ghi vào qua một cửa (`appendEvent` +
`events.lock`). Kiến trúc 1-file này là nguồn gốc của cả họ sự cố đã xảy ra
thật: git 3-way merge coi 2 phía cùng append là conflict → hand-resolve làm mất
event (2026-07-28, tsk-n4i); phải vá bằng `merge=union` + resequence
(`events-jsonl-contiguity.mjs`, tsk-3wq) — band-aid, không phải thiết kế an
toàn từ gốc; và seq-làm-identity nghĩa là 2 writer từ cùng điểm chung tự đánh
trùng số. Tầng A (item này) mượn **cấu trúc dữ liệu** của repository-harness —
content-hash identity, nhiều file nhỏ mỗi-writer-một-file, compaction định kỳ
có verify gate — để loại bỏ tận gốc lớp lỗi "2 bên cùng sửa 1 file" và "seq
trùng", trong khi **không đổi vị trí ghi**: mọi write vẫn về main checkout,
ADR0020 (block-tree — worktree không mang `.fgos/`) đứng nguyên. Tầng B
(worktree tự ghi changeset riêng, giảm tải main checkout thật sự) là item khác,
cần anh xác nhận riêng vì đảo một phần quyết định đã chốt. Đích của Tầng A: hết
hẳn lớp mất-data/conflict trên event log, replay deterministic, đọc vẫn nhanh
(giữ cơ chế incremental của tsk-49e), thư mục không phình vô hạn — ổn định
nhất, không thêm gánh vận hành cho người.

## 3. Vấn đề rõ / chưa rõ

| # | Vấn đề | Trạng thái | Ghi chú |
|---|---|---|---|
| C1 | Phạm vi Tầng A: mượn cấu trúc dữ liệu, KHÔNG đảo ADR0020 | **Rõ** — TA-D0 | Ranh giới với Tầng B ghi trong mô tả item |
| C2 | Identity = SHA-256 cắt 16 hex trên nội dung dòng; seq/ts thành mô tả | **Rõ** — TA-D1 | Birthday-bound đã tính trong report; còn R3 bên dưới bổ sung |
| C3 | Mỗi session một file `.fgos/events/<...>.jsonl`, git-tracked | **Rõ** — TA-D2 | Naming rule chính xác còn mở (O1) |
| C4 | Replay đọc cả thư mục, sort theo ts trong nội dung | **Rõ** — TA-D3 | Nhưng thiếu tiebreak → R1 |
| C5 | Giữ incremental-anchor-read của state.json, chỉ đổi đơn vị anchor | **Rõ** — TA-D4 | Nhưng có mâu thuẫn với ts-sort → R2 |
| C6 | Compaction định kỳ, archive không xoá, trigger event-count (tsk-1vc D2) | **Rõ** — TA-D5 | Eligibility khi compact còn mở (O3) |
| C7 | Verify gate trước khi publish baseline, đăng ký vào doctor registry | **Rõ** — TA-D6 | |
| R1 | Thứ tự replay deterministic: tổng thứ tự `(ts, tên-file, seq-trong-file)` | **Rõ** — TA-D7 | Chốt vòng 2 (P1) |
| R2 | Incremental-read vs ts-sort: anchor thêm `maxTs`, fast-path chỉ khi mọi event mới `ts > maxTs`, nghi ngờ → full read | **Rõ** — TA-D8 | Chốt vòng 2 (P2) |
| R3 | Chống hash-collision cấu trúc: stamp field `src` (writer id) vào mỗi event mới, hash tính trên dòng đã có `src` | **Rõ** — TA-D9 | Chốt vòng 2 (P3) |
| R4 | Truncation guard + periodic checkpoint theo thư mục — nằm TRONG scope Tầng A (T5) | **Rõ** — TA-D10 | Chốt vòng 2 (P4) |
| R5 | `events.lock` giữ phạm vi TOÀN thư mục `.fgos/` — bảo vệ CAS precondition + refreshView atomicity, không phải chỉ chống double-seq | **Rõ** — TA-D14 | Giữ ổn 2 vòng, không ai bẻ |
| O1 | Naming: `<writer-id>-<openTs>.jsonl`, một file "đang mở" duy nhất per writer | **Rõ** — TA-D11 | Chốt vòng 2 (Q5) |
| O2 | Di trú: `events.jsonl` cũ = baseline-0 nguyên trạng, không rewrite, cutover 1 lần | **Rõ** — TA-D12 | Chốt vòng 2 (Q6) |
| O3 | Compaction: chỉ file writer chết/idle, dưới lock, verify gate xanh mới `git mv` archive; replay luôn dedupe-by-hash; ngưỡng số chờ đo thật (config key riêng) | **Rõ** — TA-D13 | Chốt vòng 2 (Q7); con số cụ thể vẫn để planning/đo |
| O4 | SQLite view layer | **Rõ** — TA-D15: KHÔNG nằm trong Tầng A; tách item riêng khi số đo state.json vượt ngưỡng đau (phân tích + số đo lưu ở Q8) | Anh chốt vòng 3 |

## 4. Quyết định đã chốt

| D-ID | Nội dung | Nguồn gốc |
|---|---|---|
| TA-D0 | Tầng A mượn CẤU TRÚC DỮ LIỆU của harness (multi-file, content-hash, compaction), KHÔNG mượn vị trí ghi — mọi write vẫn về main checkout, ADR0020 không đảo; Tầng B là item riêng cần xác nhận riêng | report 21/8 → mô tả item, giữ ổn 2+ vòng |
| TA-D1 | Identity mỗi event = SHA-256 cắt 16 hex (64-bit) trên nội dung dòng; `seq`/`ts` giữ làm field mô tả/hiển thị, không còn là khoá định danh chính | report 21/8 (birthday-bound ~1/145 triệu/năm ở quy mô thật) → mô tả item |
| TA-D2 | Tách log thành nhiều file nhỏ theo session dưới `.fgos/events/`, git-tracked — 2 session ghi đồng thời là 2 file khác tên, không bao giờ thành git conflict; nhu cầu `merge=union` cho log này biến mất về dài hạn | report 21/8 → mô tả item |
| TA-D3 | `rebuildView`/`replayView` đổi bước liệt kê nguồn: gom mọi file trong thư mục, sort theo `ts` trong NỘI DUNG event (không theo tên file), tái dùng tối đa logic fold hiện có | report 21/8 → mô tả item |
| TA-D4 | Giữ nguyên cơ chế incremental-anchor-read của state.json (tsk-49e): chỉ đổi anchor từ byte-offset-1-file sang danh-sách-file-đã-tiêu-thụ + offset file đang dở — không viết lại cơ chế | report 21/8 → mô tả item |
| TA-D5 | Compaction định kỳ gộp file nhỏ cũ thành baseline mới; KHÔNG xoá file gốc (archive — kỷ luật log bất biến RUL11/ADR-0019); trigger tái dùng quyết định event-count-based của tsk-1vc D2 (`checkpoint.eventThreshold` precedent), không bày lịch mới | report 21/8 → mô tả item |
| TA-D6 | Gate kiểm tra trước khi publish baseline — đăng ký check mới vào `fgos doctor` registry có sẵn (`src/setup/registrations.mjs` pattern), đúng Install/setup/doctor gate rule của AGENTS.md | report 21/8 → mô tả item |
| TA-D7 | Tổng thứ tự replay = `(ts, tên-file, seq-trong-file)` — deterministic, bảo toàn causality nội-writer; sort ts đơn thuần bị bác vì không định nghĩa thứ tự khi trùng ts giữa 2 file | vòng 1 (P1) → anh chốt vòng 2 |
| TA-D8 | Snapshot anchor của incremental read ghi thêm `maxTs`; fast-path chỉ chạy khi mọi event mới có `ts > maxTs` (strict), mọi nghi ngờ (kể cả biên trùng) rơi về full rebuild — wrong-in-doubt chỉ trả giá bằng chậm, không bao giờ sai data | vòng 1 (P2) → anh chốt vòng 2 |
| TA-D9 | Mỗi event mới stamp thêm field `src` (writer/session id từ `resolveWriterIdentity`); hash tính trên dòng đã có `src` — 2 event thật khác nhau không bao giờ byte-identical theo cấu trúc, dedupe-by-hash an toàn tuyệt đối | vòng 1 (P3) → anh chốt vòng 2 |
| TA-D10 | Truncation guard mở rộng thành map `{fileName → {seq, hash}}` cùng sidecar; periodic auto-commit + `getUncommittedEventCount` quét cả `.fgos/events/`; doctor checks rescope — nằm TRONG scope Tầng A (hạng mục T5), không để thành lỗ quan sát mới | vòng 1 (P4) → anh chốt vòng 2 |
| TA-D11 | Naming: `<writer-id>-<openTs>.jsonl` (writer-id từ `resolveWriterIdentity`, openTs compact chống trùng sau compaction); mỗi writer đúng 1 file "đang mở", process cùng session append tiếp file đó; nguồn UNRESOLVED (fallback pid) tạo file-per-invocation là degraded mode chấp nhận được, compaction gom sau | vòng 1 (Q5) → anh chốt vòng 2 |
| TA-D12 | Di trú: KHÔNG rewrite 23K dòng cũ — `events.jsonl` hiện tại thành baseline-0 nguyên trạng, vẫn là source thật của replay; write path mới chỉ ghi `.fgos/events/`; cutover 1 lần khi code land, không dual-write; `merge=union` giữ cho file cũ, không áp cho `events/*` | vòng 1 (Q6) → anh chốt vòng 2 |
| TA-D13 | Compaction eligibility: chỉ file của writer đã chết/idle quá ngưỡng, chạy dưới `events.lock`, verify gate xanh mới `git mv` vào `archive/`; replay dedupe theo hash MỌI LÚC (legacy: theo nội dung dòng) nên crash giữa compaction vô hại theo cấu trúc; ngưỡng số cụ thể đo thật rồi chọn, config key riêng theo precedent `checkpoint.eventThreshold` | vòng 1 (Q7) → anh chốt vòng 2 |
| TA-D14 | `events.lock` giữ nguyên phạm vi TOÀN thư mục `.fgos/` — multi-file loại git-conflict, không loại local race; CAS precondition (moveWork expectedStatus, addWork dup-id) + refreshView-trong-lock (tsk-1q5) cần một critical section duy nhất bao mọi writer; per-file lock là sai | vòng 1 (R5) → giữ ổn qua vòng 2 |
| TA-D15 | SQLite view layer KHÔNG nằm trong Tầng A — state.json giữ nguyên; khi số đo parse/rewrite của state.json vượt ngưỡng người dùng cảm được thì submit item riêng "swap materialized view JSON→SQLite (node:sqlite, nâng engines ≥22)"; phân tích + số đo nền (8.1MB / 1013 items / 67ms đọc + 70ms parse mỗi call) lưu ở §5/Q8 | session đề xuất Q8 vòng 2 → anh chốt vòng 3 |

(Mỗi D-ID trên đã ghi qua `fgos decision --id tsk-3ve --relation none` tại vòng nó được mint.)

## 5. Q&A log

**2026-08-23T17:20+07:00 — Vòng 1: scout + review mô tả gốc (session, chưa có phản hồi người).**

Scout đã đọc trực tiếp (không suy diễn):

- `src/state/events.mjs` — `appendEvent`/`appendEventCore`: seq đọc từ dòng cuối
  file, ghi 1 dòng JSON `{seq, ts, type, payload, v}` dưới `events.lock`
  (link-atomic, blocking 2s/10ms). `withEventsLock` export cho store.mjs mở
  rộng critical section trùm cả precondition-read (CAS). Lock derive từ
  `path.dirname(logPath)` — `porting-store.mjs` truyền dir khác tự có lock riêng.
- `src/state/store.mjs` — `paths(dir)` map dir → `{logPath, viewPath}` (điểm
  chạm duy nhất tên file); `withEventsLockAndRefresh` (tsk-1q5) gộp
  append+refreshView vào MỘT critical section; `refreshView` ghi state.json
  (7.9MB, atomic-rename) kèm snapshot `{size, mtimeMs, lastLine}`; các reader
  raw: `staleDoingAdvisory`, `stalePostDeliveryAdvisory`, `readRawEvents`,
  `readRawEventsAndText`.
- `src/state/replay.mjs` — `tryIncrementalRebuild`: fast-path 3 nấc (mtime+size
  y nguyên → trả view; size tăng + lastLine giữ → fold phần mới; mọi nghi ngờ →
  full read). `rebuildView` guarantee: rebuild 2 lần từ cùng log = deep-equal.
- `src/state/events-jsonl-contiguity.mjs` — dedupe theo dòng byte-identical,
  stable-sort theo ts, renumber seq 1..N. Đây là "band-aid sau union-merge" mà
  TA-D2 làm cho hết cần với cấu trúc mới.
- `src/state/events-jsonl-truncation-guard.mjs` — guard mark `{seq, hash}` cho
  MỘT file (sidecar gitignored) + `runOpportunisticMainCheckoutChecks`: periodic
  auto-commit của đúng relPath `events.jsonl` (threshold 50 event /
  `checkpoint.eventThreshold` config / 15 phút — chính là tsk-1vc D2 mà TA-D5
  tái dùng).
- `src/util/session-identity.mjs` — `resolveWriterIdentity`: env session id
  (uuid, xác nhận qua registry) → fallback ancestor-pid → UNRESOLVED. Mọi
  mutating event đã stamp `writer` từ nguồn này.
- `src/setup/registrations.mjs` — doctor checks `events-jsonl-contiguous`,
  `events-jsonl-not-truncated`, `main-checkout-guard-warnings` (pattern đăng ký
  cho TA-D6).
- Consumer của `seq` ngoài core: chỉ hiển thị/return value trong kết quả CLI
  (`seq: event.seq`) + guard mark + contiguity — `cursor.mjs` chủ đích KHÔNG
  dùng seq. Không có ai dùng seq làm khoá tra cứu chéo-item. → đổi seq thành
  per-file là an toàn về contract.
- Live log: 23.280 dòng / ~10MB; state.json 7.9MB (gitignored); guard sidecar
  gitignored.

**Q1 (R1 — session tự đặt): sort ts đơn thuần có đủ deterministic không?**
Không. ISO-8601 ms có thể trùng giữa 2 file (2 writer ghi trong cùng ms — với
lock 10ms retry thì hiếm nhưng hoàn toàn có thể; và `fixContiguity` cũng đã
từng phải dựa stable-sort để né vấn đề này trong 1 file). Với multi-file, "thứ
tự đọc dir" của OS không ổn định → vi phạm guarantee rebuild-twice-deep-equal.
**Đề xuất P1:** tổng thứ tự = `(ts, tên-file, seq-trong-file)` — trong một file
giữ nguyên thứ tự append của chính writer đó (bảo toàn causality nội-writer),
giữa các file trùng ts thì tên file làm tiebreak cố định. Deterministic, rẻ,
không cần trường mới.

**Q2 (R2 — session tự đặt): incremental anchor có sống được với ts-sort toàn cục không?**
Không nếu giữ nguyên "fold thêm phần mới": event mới của file A có thể mang ts
nhỏ hơn event đã fold từ file B (2 process, độ trễ giữa lúc lấy `new Date()` và
lúc giữ được lock). **Đề xuất P2:** snapshot anchor mới ghi thêm `maxTs` (ts
lớn nhất đã fold). Điều kiện dùng fast-path: mọi event mới đọc thêm phải có
`ts > maxTs` (strict, kể cả biên trùng thì rơi về full read); vi phạm → full
rebuild. Đúng học thuyết tsk-49e: wrong-in-doubt chỉ trả giá bằng chậm hơn 1
lần đọc, không bao giờ sai. Trong thực tế ghi tuần tự dưới lock, điều kiện này
đúng ~mọi lần → fast-path vẫn giữ được giá trị.

**Q3 (R3 — session tự đặt): hash trên nội dung dòng có thể đụng nhau hợp lệ không?**
Có: 2 session cùng ms, cùng type/payload (ví dụ 2 no-op giống hệt), cùng seq
nội bộ file → 2 dòng byte-identical ở 2 file khác nhau, nhưng là 2 event thật
khác nhau. Dedupe-by-hash sẽ gộp nhầm còn 1. **Đề xuất P3:** stamp thêm field
`src` (writer/session-file id) vào mỗi event mới — dòng trở thành duy nhất
toàn cục theo cấu trúc (không dựa may rủi), provenance đi theo event cả sau
compaction (khi ranh giới file biến mất). Hash tính trên dòng đã có `src`.
Chi phí: ~20 byte/dòng.

**Q4 (R4 — session tự đặt): guard/checkpoint hiện tại có theo được cấu trúc mới không?**
Không tự nhiên: cả truncation guard lẫn periodic auto-commit hardcode 1
relPath. Per-session files vẫn git-tracked → vẫn nguyên class lỗi git
stash/checkout/reset revert (đã gây tsk-cgg, tsk-1vc thật) và vẫn cần
checkpoint commit. **Đề xuất P4:** đưa vào scope Tầng A luôn (hạng mục con
riêng, §7): guard mark mở rộng thành map `{fileName → {seq, hash}}` trong cùng
sidecar; `getUncommittedEventCount`/auto-commit quét cả `.fgos/events/`;
`events-jsonl-contiguous` check rescope (legacy file giữ check cũ, file mới
check per-file đơn writer). Không làm phần này thì Tầng A tự mở một lỗ quan
sát mới trong khi mục tiêu là ổn định nhất.

**Q5 (O1 — khuyến nghị): naming rule.**
`<writer-id>-<ts-mở-file>.jsonl`, writer-id từ `resolveWriterIdentity` (đã
charset-safe, đã dùng làm `writer` trên mọi event), ts dạng compact
`YYYYMMDDTHHMMSSmmmZ` chống trùng khi một writer mở file mới sau compaction.
Mỗi writer có đúng 1 file "đang mở" (file mới nhất chưa archive mang prefix
của nó); process mới cùng session append tiếp vào file đó (an toàn vì
`events.lock` toàn thư mục vẫn serialize — R5). Nguồn UNRESOLVED (fallback
pid) tạo file-per-invocation — chấp nhận như degraded mode, compaction sẽ gom.

**Q6 (O2 — khuyến nghị mạnh): di trú.**
Không rewrite 23K dòng cũ (giữ đúng D7a "log lines never rewritten" + RUL11).
File `events.jsonl` hiện tại trở thành **baseline-0 nguyên trạng**: replay đọc
`events.jsonl` (nếu tồn tại) + mọi file trong `.fgos/events/`; write path mới
chỉ ghi vào `.fgos/events/`. Cutover 1 lần khi code land, không chạy song
song, không dual-write. Process cũ còn sống lỡ append vào file cũ vẫn được đọc
(file cũ vẫn là source thật) — degrade mềm. `.gitattributes merge=union` giữ
cho file cũ (vô hại, sẽ nghỉ hưu sau), KHÔNG áp cho `.fgos/events/*`.

**Q7 (O3 — nguyên tắc): compaction.**
Chỉ compact file của writer đã chết/nguội (pid/registry không còn sống + file
idle quá ngưỡng), chạy dưới `events.lock`, ghi `baseline-<ts>.jsonl` → chạy
verify gate (TA-D6: view(baseline) deep-equal view(các file gốc), đếm event +
so tập hash) → xanh mới `git mv` file gốc vào `.fgos/events/archive/`
(discovery của replay bỏ qua archive/). Crash giữa chừng (baseline đã ghi,
chưa kịp archive) không được làm sai view → **replay dedupe theo hash mọi lúc**
(với dòng legacy không có hash: dedupe theo nội dung dòng, đúng precedent
`fixContiguity`) — đây chính là chỗ TA-D1 trả giá trị lớn nhất: double-apply
trở thành cấu trúc-không-thể, không phải kỷ luật vận hành. Ngưỡng cụ thể: đo
tốc độ ghi thật rồi chọn, config key riêng theo precedent
`checkpoint.eventThreshold`.

**Ghi nhận thêm (R5):** `events.lock` giữ nguyên phạm vi TOÀN thư mục
`.fgos/` — multi-file loại git-conflict, không loại local race: CAS
precondition của store.mjs (moveWork expectedStatus, addWork dup-id, tsk-1q5
refreshView-trong-lock) cần một critical section duy nhất bao mọi writer.
Per-file lock là sai. Điểm này phải thành D-ID khi giữ ổn qua vòng sau.

---

**2026-08-23T21:20+07:00 — Vòng 2: anh chốt + câu hỏi SQLite.**

**Anh:** "đồng ý hết P1–P4 và Q5/Q6/Q7, chốt. anh đang thắc mắc lỡ làm tới
đây có nên support hỗ trợ read thẳng từ sqlite như repository-harness không?"

→ P1–P4, Q5/Q6/Q7 promote thành TA-D7…TA-D13; R5 (giữ ổn 2 vòng, không ai
bẻ) thành TA-D14. §6 regenerate bỏ marker «đề xuất».

**Q8 (O4 — anh đặt): có nên support đọc thẳng từ SQLite như harness không?**

Scout thêm cho câu này (số thật, không suy diễn):

- `package.json` engines: `"node": ">=18"`. `node:sqlite` builtin chỉ có từ
  Node ≥22.5 — adopt nó là nâng floor phân phối 18→22, một quyết định
  distribution thật (theo Install/setup/doctor gate + docs/distribution-vision.md),
  không phải chi tiết kỹ thuật. Dùng package ngoài (better-sqlite3…) thì phá
  kỷ luật zero-dep của cả tầng state.
- Đo thật trên máy này: `state.json` 8.137.723 byte, 1013 work items — mỗi
  CLI call trả **67ms đọc + 70ms parse (~137ms)**; mỗi mutation rewrite
  nguyên 8.1MB. Có thật, tăng tuyến tính theo số item, nhưng chưa phải
  bottleneck so với các thao tác git/lock quanh nó.
- Điều harness THẬT SỰ làm (report 260821-1202 đã grep nguồn): SQLite của họ
  là **materialized view gitignored, rebuild được từ JSONL changesets** —
  truth vẫn là JSONL trong git. fgOS đã có ĐÚNG hình dạng đó: truth =
  events log (git), view = `state.json` gitignored rebuild từ log. Tức là
  "theo harness" fgOS đã theo rồi — SQLite chỉ là **đổi định dạng của tầng
  view**, không phải đổi kiến trúc.
- Chính harness đã **rút lui** khỏi việc bắt mọi repo gánh SQLite mặc định
  (Phase 1–2 chuyển thành add-on `--with-cli` — tín hiệu chi phí thật, report
  đã ghi).

**Khuyến nghị của session:** KHÔNG đưa vào Tầng A. Lý do: (1) Tầng A đã đủ
lớn (T1–T6) và mục tiêu số 1 là ship faster — thêm một tầng storage mới là
mở scope đúng chỗ dễ trượt nhất; (2) kiến trúc sau Tầng A **để cửa mở sẵn**:
truth là JSONL bất biến, view là thứ vứt-đi-rebuild-được — swap JSON→SQLite
sau này là item độc lập, không đụng lại bất kỳ quyết định nào của Tầng A,
thậm chí Tầng A làm nó DỄ hơn (multi-file + hash-dedupe replay là input sạch
cho bất kỳ store nào); (3) chưa có ngưỡng đau bằng số — 137ms/call là đáng
ghi nhận, chưa đáng trả giá nâng Node floor + migrate mọi reader. Khi nào
làm: khi số đo (parse time hoặc rewrite amplification của state.json) vượt
ngưỡng người dùng cảm được, submit item riêng "swap materialized view
JSON→SQLite (node:sqlite, nâng engines ≥22)" — lúc đó có Tầng A làm nền thì
việc này gọn hơn nhiều so với làm bây giờ. Chờ anh xác nhận để đóng O4.

---

**2026-08-23T21:35+07:00 — Vòng 3: anh chốt O4 → HỘI TỤ.**

**Anh:** "đồng ý, như vậy" — O4 đóng theo khuyến nghị Q8, mint TA-D15.
Không submit item SQLite ngay (đúng khuyến nghị: chỉ submit khi số đo vượt
ngưỡng; phân tích + số đo đã lưu tại Q8 để item tương lai không đào lại).
Discussion hội tụ: §6 stable, §7 real — đủ điều kiện terminal handoff theo
skill. Anh hỏi thêm về model nào phù hợp chạy các stage tiếp theo — trả lời
trong chat (không phải quyết định thiết kế của feature này, không mint D-ID).

## 6. Thiết kế đã chốt {#design}

*(Synthesis viết cho người lạ không có chat history. Toàn bộ dưới đây đã
chốt: TA-D0…TA-D14. Điểm mở duy nhất còn lại là O4/Q8 — SQLite view layer —
nằm ngoài scope Tầng A theo khuyến nghị đang chờ xác nhận.)*

### Bức tranh

`.fgos/events.jsonl` (một file, mọi session cùng append, seq toàn cục làm
identity) được thay bằng một **thư mục event-sourcing** `.fgos/events/`:

- **Ghi (TA-D2/D9/D11):** mỗi writer (session identity từ
  `resolveWriterIdentity`) append vào đúng một file riêng của nó —
  `<writer-id>-<openTs>.jsonl`, mỗi writer đúng 1 file "đang mở", process
  cùng session append tiếp vào file đó; nguồn UNRESOLVED (fallback pid) tạo
  file-per-invocation là degraded mode chấp nhận được, compaction gom sau.
  Không bao giờ có 2 writer cùng sửa 1 file → git không còn gì để conflict,
  `merge=union` + resequence hết lý do tồn tại cho log mới. Mỗi event mới
  mang `h` (SHA-256 cắt 16 hex trên nội dung dòng — identity thật, TA-D1) và
  `src` (writer id, TA-D9) — nhờ `src`, hai event thật khác nhau không bao
  giờ byte-identical theo cấu trúc, dedupe-by-hash an toàn tuyệt đối. `seq`
  vẫn ghi nhưng là **per-file, thuần mô tả** — mọi consumer hiện tại của seq
  chỉ hiển thị, đã xác nhận bằng grep toàn repo.
- **Lock (TA-D14):** `events.lock` giữ nguyên, phạm vi toàn `.fgos/` — nó
  bảo vệ CAS-precondition + refreshView atomicity (tsk-1q5), không phải chỉ
  chống double-seq. Multi-file đổi bài toán git, không đổi bài toán
  concurrency cục bộ. Per-file lock là sai.
- **Đọc/replay (TA-D3/D7/D12):** discovery gom `events.jsonl` cũ (baseline-0
  nguyên trạng — di trú không rewrite, TA-D12) + mọi `*.jsonl` trong
  `.fgos/events/` trừ `archive/`. Tổng thứ tự = `(ts, tên-file,
  seq-trong-file)` (TA-D7 — deterministic, bảo toàn causality nội-writer).
  Fold logic (`applyEvent`) tái dùng nguyên vẹn. Replay **dedupe theo hash**
  (dòng legacy: theo nội dung dòng) — double-apply thành bất-khả-cấu-trúc,
  chống cả trạng thái crash giữa compaction.
- **Incremental read (TA-D4/D8):** snapshot anchor trong state.json đổi từ
  `{size, mtimeMs, lastLine}` một file thành map per-file + `maxTs`;
  fast-path chỉ chạy khi mọi event mới có `ts > maxTs` (strict), mọi nghi
  ngờ rơi về full read — giữ nguyên học thuyết
  wrong-in-doubt-costs-speed-not-truth của tsk-49e.
- **Guard + checkpoint (TA-D10):** truncation guard mark thành map
  `{fileName → {seq, hash}}` trong cùng sidecar gitignored; periodic
  auto-commit (`runOpportunisticMainCheckoutChecks`) +
  `getUncommittedEventCount` quét cả thư mục; doctor checks rescope tương
  ứng. Nằm trong scope Tầng A (T5) — không để Tầng A tự mở lỗ quan sát mới.
- **Compaction (TA-D5/D13) + gate (TA-D6):** khi tổng event trong các file
  nguội vượt ngưỡng (event-count-based, precedent tsk-1vc D2, config key
  riêng), gộp các file của writer đã chết/idle — chạy dưới `events.lock` —
  thành `baseline-<ts>.jsonl`, verify gate (deep-equal view + đếm + so tập
  hash — đăng ký thành doctor check) xanh mới archive file gốc bằng
  `git mv` — không xoá gì bao giờ. Ngưỡng số cụ thể chọn sau khi đo tốc độ
  ghi thật.

### Luồng

```mermaid
flowchart LR
  subgraph write [Ghi - main checkout, ADR0020 giữ nguyên]
    W1[Session A] -->|append + h,src,seq per-file| FA[events/A-ts.jsonl]
    W2[Session B] -->|append| FB[events/B-ts.jsonl]
    LK[events.lock toàn thư mục\nCAS + refreshView atomic] -.serialize.- W1
    LK -.serialize.- W2
  end
  subgraph read [Đọc]
    FA --> M[merge-sort ts,file,seq\n+ dedupe theo hash]
    FB --> M
    L0[events.jsonl cũ = baseline-0\nkhông rewrite] --> M
    BL[baseline-ts.jsonl] --> M
    M --> FOLD[foldEvents - tái dùng nguyên vẹn] --> SJ[state.json + anchor per-file + maxTs]
  end
  subgraph compact [Compaction định kỳ]
    FA -.writer chết/idle.-> C[compactor dưới events.lock]
    C --> BL
    C -->|verify gate xanh: deep-equal + count + hash-set| AR[git mv vào events/archive/]
    GATE[fgos doctor check mới] --- C
  end
```

### Cái gì KHÔNG đổi

- Vị trí ghi (main checkout), ADR0020, block-tree, merge guard
  `fgos-write-rejected` — nguyên vẹn (TA-D0).
- `foldEvents`/`applyEvent`, toàn bộ semantics fold từng event type.
- `events.mjs` core (`appendEvent(logPath)` per-file vẫn đúng nguyên dạng —
  `porting-store.mjs` với log riêng của nó không bị chạm).
- state.json vẫn được rebuild + ghi atomic-rename như cũ (write-amplification
  7.9MB/mutation của chính state.json là quan sát ngoài scope, ghi nhận cho
  item tương lai).

## 7. Danh mục hạng mục / task {#tasks}

Dependency tuyến tính: T1 → T2 → T3 → T4 → T5 → T6 (T5/T6 có thể đảo cho
nhau; T6 phụ thuộc T1+T3 vì verify gate cần hash-dedupe replay).

### T1 — Hash identity + schema per-event {#task-hash-identity-schema}

- **Goal:** mọi event mới mang `h` (16-hex SHA-256 trên nội dung dòng) và
  `src` (writer id); `seq` giữ nguyên vị trí nhưng doc lại thành per-file
  descriptive. Chưa đổi vị trí file nào.
- **§6:** mục "Ghi" — identity thật; nền cho dedupe-by-hash ở T3/T6.
- **D-IDs:** TA-D1, TA-D9.
- **Sibling:** mọi task sau đọc `h`; không phụ thuộc ai.
- **Verify (draft):** `node --test test/state/events.test.mjs test/state/replay.test.mjs` — event mới có `h`/`src` đúng; log cũ không `h` vẫn đọc nguyên (D7a).

### T2 — Write path multi-file {#task-multifile-write-path}

- **Goal:** store.mjs resolve file per-writer dưới `.fgos/events/` (naming rule
  chốt từ O1), append qua đúng `appendEvent` hiện có; `events.lock` giữ phạm
  vi toàn thư mục; seq derive từ dòng cuối của CHÍNH file writer đó.
- **§6:** mục "Ghi" + "Lock".
- **D-IDs:** TA-D2, TA-D11, TA-D14.
- **Sibling:** cần T1 (event mới nên có identity ngay từ dòng multi-file đầu tiên).
- **Verify (draft):** `node --test test/state/store.test.mjs` + test mới: 2 writer giả lập ghi xen kẽ → 2 file, CAS expectedStatus vẫn đúng, không git conflict khi commit.

### T3 — Read/replay multi-file + total order + dedupe {#task-multifile-read-replay}

- **Goal:** discovery đọc baseline-0 (`events.jsonl` cũ nguyên trạng) + mọi
  file trong `events/` trừ `archive/`; merge-sort `(ts, file, seq)`; dedupe
  theo hash/nội dung dòng; mọi reader raw (`readRawEvents`,
  `staleDoingAdvisory`, show verb…) đi qua cùng một cửa đọc mới trong
  store.mjs.
- **§6:** mục "Đọc/replay" + "Cái gì không đổi" (foldEvents nguyên vẹn).
- **D-IDs:** TA-D3, TA-D7, TA-D12.
- **Sibling:** cần T2; T4 xây trên đầu ra của task này.
- **Verify (draft):** test determinism: rebuild 2 lần deep-equal với file-set trộn ts trùng nhau; fixture legacy+new trộn; `npm test` full khi contract đọc đổi.

### T4 — Incremental anchor per-file {#task-incremental-anchor-multifile}

- **Goal:** snapshot anchor thành `{files: {name: {size, lastLine}}, maxTs}`;
  fast-path 3 nấc như cũ + điều kiện `ts > maxTs` (P2); mọi nghi ngờ → full
  read.
- **§6:** mục "Incremental read".
- **D-IDs:** TA-D4, TA-D8.
- **Sibling:** cần T3.
- **Verify (draft):** test mở rộng `test/state/replay.test.mjs`: file mới xuất hiện, file shrink, event ts nhỏ hơn maxTs → tất cả rơi về full read và vẫn đúng; benchmark nhanh không tệ hơn hiện tại trên log thật.

### T5 — Guard + checkpoint theo thư mục {#task-guards-checkpoint-dir}

- **Goal:** truncation-guard mark map per-file; `getUncommittedEventCount` +
  periodic auto-commit quét `.fgos/events/`; doctor checks
  `events-jsonl-contiguous`/`events-jsonl-not-truncated` rescope (legacy giữ
  check cũ; file mới: per-file đơn-writer).
- **§6:** mục "Guard + checkpoint".
- **D-IDs:** TA-D10, TA-D6 (pattern registry).
- **Sibling:** cần T2 (có thư mục để guard); độc lập T3/T4.
- **Verify (draft):** `node --test test/state/events-jsonl-truncation-guard.test.mjs test/setup/registrations.test.mjs` mở rộng: revert 1 file per-session → guard bắt được; auto-commit gom đủ file mới.

### T6 — Compaction + verify gate {#task-compaction-verify-gate}

- **Goal:** compactor (chỉ file writer chết/idle, dưới `events.lock`) ghi
  `baseline-<ts>.jsonl`; verify gate deep-equal view + count + hash-set, đăng
  ký doctor check; xanh mới `git mv` vào `archive/`; trigger event-count
  config key riêng (precedent `checkpoint.eventThreshold`); ngưỡng số cụ thể
  chọn sau khi đo (O3).
- **§6:** mục "Compaction + gate".
- **D-IDs:** TA-D5, TA-D6, TA-D13.
- **Sibling:** cần T1 (hash) + T3 (dedupe replay làm crash-giữa-compaction vô hại).
- **Verify (draft):** test: compact fixture nhiều file → view trước/sau deep-equal; crash-giữa-chừng (baseline + gốc cùng tồn tại) → replay vẫn đúng nhờ dedupe; gate đỏ → không archive gì.
