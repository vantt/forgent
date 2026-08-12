# orchestrator-worker-slots — RESEARCH

Tích luỹ, không đè. Mỗi vòng một mục có ngày riêng.

## 2026-08-12 — Vòng 1 (gọi từ `fgos-coding-discovering`, item `tsk-2sj`)

### Hỏi gì

Occupancy của "worker slot" có suy được từ cơ chế claim đã có trong fgOS
không, hay bắt buộc phải đẻ một sổ/state-module/event-type MỚI? Bốn nhánh
con: (1) `claimWork` có phải choke point đủ cho mọi launcher không;
(2) đếm "đang chạy bao nhiêu work-item" có suy thuần từ view hiện có
không; (3) có field/event nào sẵn ghi "ai đang giữ item" không; (4) lane
hành chính (merge/retro/cleanup) có claim work-item không.

Giữ inline tuần tự, không fan-out: bốn nhánh phụ thuộc nhau (đáp án (1)
quyết định cách đọc (4)), đúng điều kiện "branches that depend on each
other's result stay inline" của skill.

### Kiểm gì, thấy gì

**F-A — `claimWork` là choke point duy nhất của lane execution.**

- `src/runner/claim-port.mjs:90` — `claimWork(dir, { id, actor, isolate,
  claimTrigger, repoRoot, worktreeDir, skipOutcome })`.
- `fgos take` → `doTake()` gọi `claimWork` (`bin/fgos.mjs`, case `take`).
- `fgos pick` → `doPick()` gọi `claimWork` (`bin/fgos.mjs`, case `pick`).
- `fgos-runner` → `src/runner/loop.mjs:496` gọi `claimWork` với
  `actor: 'runner', isolate: false`.
- Mọi launcher cuối cùng đều rơi vào đó: `fgos-fanout` bắn Agent chạy
  `/fgOS:pick` (→ `claimWork`); herdr-plugin mở pane chạy
  `/fgOS:discover-next` → `/fgOS:discover` bước 2 gọi `take`/`pick`
  (→ `claimWork`).

**Một đường bypass có thật:** `fgos move <id> --to doing` đi thẳng
`moveWork` (`bin/fgos.mjs`, case `move`), KHÔNG qua `claimWork`. Đây là
verb thủ công/hành chính — cần biết khi đặt cổng gác, không nhất thiết
phải chặn.

**F-B — Lane hành chính KHÔNG BAO GIỜ claim một work-item.** Bằng chứng
dứt khoát, hai lớp:

- `src/state/status-fsm.mjs:123,133,134,135` — toàn bộ cạnh của lane
  hành chính là `awaiting-approval → delivered`, `delivered →
  retrospective`, `retrospective → cleanup`, `cleanup → done`. **Không
  cạnh nào chạm `doing`.** (Ba cạnh duy nhất VÀO `doing` là `todo →
  doing`, `blocked → doing`, `awaiting-human → doing`, dòng 100/104/146.)
- Thân verb `approve`, `retrospective`, `cleanup` trong `bin/fgos.mjs`
  chứa **0** lần nhắc `'doing'` hoặc `claimWork` (đếm trực tiếp trên từng
  case).

⇒ Thứ chiếm một chỗ ở lane hành chính là một **tiến trình loop**
(merge-loop/retro-loop/cleanup-loop quét nhiều item), KHÔNG phải một
work-item ở `doing`. Nói cách khác: **"đếm theo work-item" không có đối
tượng để đếm ở lane hành chính.**

**F-C — Occupancy lane execution suy thuần được từ view hiện có, không
cần field mới, không cần event mới.**

- `src/state/replay.mjs:151` — `claimRole` được gấp lên chính item ngay
  trên cạnh `to === 'doing'`; giá trị `human`/`session`/`runner`.
- `src/state/store.mjs:1070` — đã có sẵn idiom duyệt event
  `work.move` với `payload.to === 'doing'` (nền của `staleDoingAdvisory`).

⇒ Đếm = số item có `status === 'doing'`, tách theo `claimRole` nếu cần.

**F-D — Có sẵn HAI cơ chế engine-side, dựa trên pid, không dùng nhãn, đủ
mang occupancy cho lane hành chính.**

- Registry phiên: `<fgosDir>/sessions.json`
  (`src/runner/session-identity.mjs:58`), kèm dò sống bằng signal-0
  (`src/runner/session.mjs:67-71`, `isPidAlive`).
- Khuôn lock của runner: `src/runner/loop.mjs:119` (`LOCK_FILE =
  'runner.lock'`), `:245` (thu hồi khi pid chết), `:117` (`EXIT_BUSY`).

Cả hai đều engine-side và không đụng nhãn, nên đều thoả D2. Chọn cái nào
là việc của người triển khai — trả về như một finding, không quyết hộ.

### Kết luận cho câu hỏi gốc

**Không lane nào cần sổ/event-type mới.** Lane execution: cổng gác trần
đặt trong `claimWork` là đủ, occupancy suy từ `status: doing` +
`claimRole`. Lane hành chính: không có work-item để đếm, nhưng tái dùng
được một trong hai cơ chế pid sẵn có ở F-D.

### Còn mở (không chặn câu hỏi này)

- Chọn `sessions.json` hay khuôn `runner.lock` cho lane hành chính —
  việc của người triển khai.
- Có chặn `fgos move --to doing` ở cổng gác không — verb thủ công.

## 2026-08-12 — Vòng 2 (cùng caller, hai điểm cơ học cho T3/T4)

### Hỏi gì

(A2) Hình dạng đăng ký một capability mới vào tool registry, cho T3.
(A3) Hình dạng đăng ký config mới vào `fgos setup` config-merge +
`fgos doctor` check registry, cho T4.

### Kiểm gì, thấy gì

**F-E — Tool registry.** `src/state/tool-registry.mjs`: `KINDS` là tập
kind hợp lệ (`:34`, port nguyên từ repository-harness);
`normalizeCapability` (`:43`) chuẩn hoá nhãn capability tự do về
kebab-case ("Impact Analysis"/"impact_analysis" → `impact-analysis`);
`:78` chặn `--kind` ngoài tập; `:84` chuẩn hoá `capability`. Hai kind
được xác minh bằng cách quét một path trên đĩa nên bắt buộc có
`scanTarget` (`:38-39`). ⇒ T3 đăng ký `pane-labeling` qua đúng
`fgos tool register` sẵn có, không cần cơ chế mới.

**F-F — Registry của doctor/config KHÔNG nằm ở `src/setup/checks.mjs`.**
File đó chỉ là **shim re-export mỏng** (`checks.mjs:1-8`, dẫn CONTEXT.md
D1 của `setup-doctor-config-registry`); registry thật nằm ở
`src/setup/registrations.mjs` (53KB), và shim tồn tại chỉ để
`bin/fgos.mjs` + `test/setup/checks.test.mjs` khỏi phải sửa import.

API: `registerConfigDefault({ id, key, shape })`
(`registrations.mjs:97`), cùng `registerCheck`/`registerFix`. Ví dụ thật
đang chạy: `gateBypass` (`:754`), `cleanup` (`:776`), `invariantChecks`.

**Quan trọng cho T4:** section `herdrOrchestrator` **đã có sẵn một doctor
check** (`registrations.mjs:1083-1093` — báo "section missing -- run fgos
setup", và bắt giá trị non-boolean). Nghĩa là khuôn này đã được diễn tập
đúng cho chính section config mà đợt này sẽ mở rộng; thêm trần worker chỉ
là đi theo vết đã có.

**Doc-drift phát hiện kèm:** `AGENTS.md` (mục install/setup/doctor gate)
chỉ người đọc tới `src/setup/checks.mjs` như nơi đăng ký check. Từ
`setup-doctor-config-registry` trở đi điều đó không còn đúng — nơi đăng
ký thật là `registrations.mjs`. Không chặn item này; đáng sửa một dòng
trong `AGENTS.md`.

### Kết luận vòng 2

Cả A2 và A3 đều `clear`, cơ học, có điểm neo cụ thể. Không phát sinh câu
hỏi nào cần người.

## 2026-08-12 — Vòng 3 (sau khi reindex GitNexus theo yêu cầu người dùng)

### Hỏi gì

Sau khi index được làm tươi, posture `impact-analysis` có nâng từ
`degraded` lên `full` được không — tức bằng chứng blast-radius cho rủi ro
CAO của kế hoạch (`claimWork`) có tin được một mình không?

### Kiểm gì, thấy gì

**Reindex thành công, nhưng phải hai lần và exit code nói dối.**

- Lần 1 `analyze --force`: tự phát hiện cờ `incrementalInProgress` còn
  treo từ lần fail buổi sáng và tự chuyển sang full rebuild — nhưng chết
  ở bước xoay/xoá file checkpoint WAL của LadybugDB, kèm gợi ý phục hồi
  (`--wal-checkpoint-threshold 67108864`). **Exit code vẫn là 0** dù log
  ở level 50 (error), và `status` sau đó vẫn báo `stale`, index còn ở
  `4ce7a96`.
- Lần 2 với ngưỡng WAL 64 MiB: thành công. `status` báo `up-to-date`,
  indexed commit `fa067c9` khớp HEAD. Quy mô 14.640 node / 20.545 edge
  (trước: 12.247 / 17.374).

⇒ Bài học vận hành: **không tin exit code của `gitnexus analyze`** —
phải `node .gitnexus/run.cjs status` mới biết index có tươi thật không.

**F-G — Index tươi VẪN trả false negative trên đúng symbol rủi ro nhất.**

Với index đã `up-to-date`:

- `impact({target: 'claimWork', direction: 'upstream'})` →
  `impactedCount: 0`, `risk: "LOW"`, `epistemic: "exact"`.
- `context({name: 'claimWork'})` → `incoming.calls` chỉ có
  `test/runner/claim-port.test.mjs` (lặp 2 lần), không có caller sản xuất
  nào.

Đối chiếu chéo bằng `grep -rn "claimWork(" src bin` cho **ba caller sản
xuất thật**:

```
src/runner/loop.mjs:496       claimWork(dir, { id: item.id, actor: 'runner', ... })
bin/fgos.mjs:2320             const doTake = () => claimWork(dir, {
bin/fgos.mjs:2391             const doPick = () => claimWork(dir, {
```

`loop.mjs:496` là lời gọi `.mjs` phẳng, không phải pattern lạ — vậy mà đồ
thị vẫn sót. Hai tool còn mâu thuẫn nhau (`impact` trả 0, `context` trả
2), nên đây là lỗ hổng cạnh incoming, không phải cách đọc khác nhau.

### Kết luận vòng 3

Posture giữ nguyên **`degraded`**, nhưng vì lý do sắc hơn lúc đầu: không
còn vì index cũ (đã tươi), mà vì **index tươi tự tin báo `risk: LOW` cho
một symbol có ba caller sản xuất**. Một câu trả lời zero tự tin nguy hiểm
hơn một index tự khai là cũ. Đúng thứ gate trong `CLAUDE.md` dặn nghi ngờ
("a suspicious zero-result ... is worth a quick grep/rg cross-check before
being trusted") — và ở đây nó trượt bài kiểm chéo.

Ràng buộc cho mọi hạng mục con: bằng chứng blast-radius từ GitNexus phải
đối chiếu chéo `rg`/`grep`, không dùng một mình để hạ mức rủi ro.
