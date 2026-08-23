# tsk-3jk — runner và fanout xin slot trước khi dispatch

Item: `tsk-3jk` (tier/kind/risk = standard/feature/standard), con T4 của
`tsk-2sj`. Phụ thuộc `tsk-3dt` (T1) — đã merge vào `fgw/tsk-2sj`, nên
`src/state/worker-slots.mjs` (`countWorkerSlots`/`hasWorkerSlotRoom`), verb
`fgos slots`, mục config `workerSlots` và cổng cưỡng chế trong `claimWork`
đều đã có thật trên nhánh nền của item này.

Mode: **standard** — 3 flag áp dụng: *public contracts* (hard rule của
`fgos-fanout/SKILL.md` là contract văn xuôi mà chính SKILL.md tự trích lại
ở §Loop và §Red flags; và khối `runner.parallel` đổi *nghĩa* dù không đổi
*hình dạng*), *existing covered behavior* (`test/runner/loop.test.mjs` phủ
thẳng đường drain-run bằng hai test cấu hình `parallel: {maxRoots,
maxLeavesPerRoot}` — `loop.test.mjs:622` và `:642`), *weak proof around the
area* (`fgos-runner` có code và có test nhưng **chưa từng chạy thật** —
`docs/history/fanout-and-delegation-rubric/DISCUSSION.md:127`, nên bằng
chứng duy nhất quanh vùng này là test, không có vết vận hành). Không flag
hard-gate nào (auth, data loss, audit/security, external provider, gỡ một
validation) ⇒ không lên high-risk. Một lane nhỏ hơn không trung thực được:
đây không phải "vài file, không vùng xám" — nó đổi cách một trong ba
launcher quyết định *có dựng worker hay không*, và đổi một hard rule văn
xuôi mà skill khác đọc.

## Nguồn quyết định

Item này **không có `CONTEXT.md` riêng**, và đó là đúng cấu trúc: nó là
item con tách ra từ `tsk-2sj` ở stage `planning`, thừa kế nguyên quyết định
đã khoá của cha. Nguồn citable:

- `docs/history/orchestrator-worker-slots/DISCUSSION.md` §4 (D4, D6, D7,
  D8, D9), §6 "Trần mềm" / "Ai sở hữu cái gì", §7 `#task-launcher-adoption`
  — contract của chính item này.
- `docs/history/orchestrator-worker-slots/plan.md` §Shape "T4", §Ca đáng
  chứng minh, §Work split (hàng T4, dòng 438).
- `docs/history/orchestrator-worker-slots/RESEARCH.md` — F2 (ba trần độc
  lập), F-G (false negative của GitNexus trên `claimWork`).
- `src/state/worker-slots.mjs` — mặt đọc T1 đã phơi ra, kèm doc comment
  nói thẳng luật trọn-mẻ nằm ở `hasWorkerSlotRoom` (`:99-107`).
- `docs/history/execution-fanout/CONTEXT.md` §D7 và `plan.md:147-156` —
  nguồn gốc cap 5 của `fgos-fanout`, và vế NEGATIVE của verify cũ cưỡng chế
  "không dùng lại `selectWave`".

Plan này **không mở lại** quyết định nào ở trên.

## Approach

### Đường đã chọn

**`selectWave` vẫn chọn ứng viên; trần chung quyết định mẻ đó có được chạy
hay không. Và từ chối của engine là một kết quả bình thường, không phải
lỗi.**

1. **Hỏi engine trước khi dựng (D6).** Trong `runOnce`'s drain-run, ngay
   sau `selectWave` và **trước** `Promise.allSettled(...claimAndDispatch)`,
   hỏi `hasWorkerSlotRoom(view, { ceiling, batchSize: wave.length })`. Hết
   chỗ ⇒ không dispatch cái nào, thoát vòng drain sạch sẽ. `view` đã được
   đọc lại mỗi vòng nên occupancy luôn tươi; `ceiling` đọc một lần từ
   `readSharedConfig(path.dirname(dir))?.workerSlots?.ceiling` — đúng cách
   `claimWork`'s own gate đã resolve (`claim-port.mjs:197-200`), lấy từ
   `dir` chứ không từ `repoRoot` vì caller set `repoRoot` độc lập.

   Đây là chỗ `maxRoots`/`maxLeavesPerRoot` **thôi làm trần riêng**: chúng
   vẫn chặn *kích thước mẻ* runner được phép đề xuất (đúng vai trò cap 5
   của `fgos-fanout`), còn *có chạy hay không* thì engine trả lời. Cùng một
   hình dạng cho cả hai launcher.

2. **Luật trọn mẻ (D8), không cắt theo `free`.** `hasWorkerSlotRoom` trả
   `granted = batchSize` nguyên vẹn khi còn ≥ 1 chỗ — plan này **không**
   đọc `free` để bóp wave. Bóp wave chính là "bẻ một mẻ đã tính sẵn" mà D8
   cấm, và nó cũng bẻ luôn trục root-affinity mà `selectWave` vừa dựng.

3. **Chấp nhận từ chối (D6) — từ chối do trần không được làm halt cả
   drain-run.** Hôm nay `ClaimError('worker-slot-ceiling')` mang
   `category: 'validation'`, nên nó rơi vào nhánh `EXIT_CODES[category]`
   của `claimAndDispatch` (`loop.mjs:1045-1052`) và thành
   `outcome: 'halted'` với exit code khác 0 — mà `runOnce` thì `break`
   ngay khi thấy `haltExitCode !== null` (`:1340`). Tức là: cả một lượt
   drain dừng và runner thoát khác 0 chỉ vì máy đang bận. Đó không phải
   lỗi, đó là câu trả lời.

   Sửa: `claimAndDispatch` nhận diện đúng mã `worker-slot-ceiling` và trả
   `outcome: 'claim-rejected'` — nhánh **đã có sẵn** trong `runOnce`
   (`:1334`, "never dispatched; left for a later poll"), đúng ngữ nghĩa
   cần. Không thêm outcome mới, không thêm nhánh điều khiển mới.

   Nhánh này là **bắt buộc**, không phải trang trí: nó chính là chỗ D8's
   overshoot hạ cánh an toàn. Pre-check cho cả mẻ 4 đi khi còn 2 chỗ; hai
   item đầu claim được, item thứ ba gặp cổng cưỡng chế của `claimWork` và
   bị từ chối. Không có bước 3 thì đúng ca overshoot mà D8 thiết kế lại là
   ca làm sập lượt drain.

4. **`fgos-fanout` diễn đạt lại D7 theo trần chung + luật trọn mẻ.** Hard
   rule "At most 5 Agents in flight at once (D7)" bị thay bằng: hỏi
   `fgos slots` trước mỗi mẻ; hết chỗ thì không bắn Agent nào và chờ; còn
   ≥ 1 chỗ thì bắn **trọn mẻ**, tối đa 5 thành viên. Con số 5 **sống
   tiếp** — nhưng đổi vai: từ *trần độc lập* thành *kích thước mẻ tối đa*,
   tức thứ chặn biên overshoot ở 4, đúng chữ D8 dùng nó
   (`DISCUSSION.md:71`). Đây là diễn đạt lại, không phải xoá.

### Phương án đã cân nhắc và loại

| Phương án | Vì sao loại |
|---|---|
| Cắt wave xuống đúng `free` slot | Vi phạm thẳng D8; và `hasWorkerSlotRoom` cố ý không trả về con số để cắt (`worker-slots.mjs:99-103`) |
| Ép `maxRoots`/`maxLeavesPerRoot` = `free` trước khi gọi `selectWave` | Cùng vi phạm D8, cộng thêm bẻ trục: `selectWave` xếp theo root-affinity, hạ `maxRoots` sẽ bỏ nguyên một cây lineage chứ không bỏ một item |
| Chỉ dựa vào cổng cưỡng chế trong `claimWork`, không pre-check | D6 nói rõ launcher **xin trước khi dựng**; và hôm nay refusal giữa mẻ làm halt cả drain-run (xem bước 3) |
| Cho `fgos-fanout` import `worker-slots.mjs` trực tiếp | Nó là skill văn xuôi, không phải JS; `0014` để CLI làm cửa và T1 đã phơi verb `fgos slots` đúng cho ca này |
| Cho `loop.mjs` shell ra `node bin/fgos.mjs slots` | Ngược lại với trên: `loop.mjs` là JS in-process, import thẳng module thuần rẻ hơn một subprocess và đúng vết `claim-port.mjs` đã đi |
| Thêm reservation/TTL để đóng đua pre-check ↔ claim | T1 đã chốt chấp nhận đua này có chủ ý (`worker-slots.mjs:27-30`) |
| Trừ `admin.reserved` vào trần trước khi dispatch | Sai đơn vị — D9/F-B: hai lane không chung pool đếm |
| Ranker toàn cục xuyên pool | D6 để lại có chủ ý |
| Đăng ký mục config mới trong `src/setup/registrations.mjs` | T1 **đã** đăng ký `workerSlots` (`registrations.mjs:796-797`); thêm lần hai là trùng, và mô tả item cấm đụng file đó để giữ footprint rời nhau |

Ghi chú về §7 của DISCUSSION: dòng "đăng ký config mới vào `fgos setup`
config-merge và `fgos doctor` check registry" trong phần T4 đã được T1 làm
xong trọn vẹn (`registrations.mjs:783-797`, `test/setup/checks.test.mjs:654`).
T4 chỉ **tiêu thụ**. Đây không phải bỏ scope — đây là scope đã được thoả bởi
item khác trong cùng bộ, đúng như mô tả item T4 tự nói.

### Bản đồ rủi ro

`impact-analysis: **degraded**`. `fgos tool query --capability
impact-analysis --status present` trả 1 provider (`gitnexus`, `present`).
Ghi `degraded` chứ không `full` vì có **false negative đo được ngay trên
chính file này**, không phải vì thủ tục:

- `impact({target:'runOnce', direction:'upstream'})` trả
  `impactedCount: 0`, `risk: LOW`, `epistemic: exact` — trong khi
  `rg -l 'runOnce' src bin test` cho **13 file**, gồm caller production
  thật `bin/fgos-runner.mjs` và 5 file test. Cùng hạng false negative mà
  RESEARCH F-G đã bắt trên `claimWork`, cùng file, cùng vùng.
- `impact({target:'selectWave', direction:'upstream'})` trả
  `impactedCount: 1`, `direct: 1`, `risk: LOW` — cái này **khớp** grep
  (`rg 'selectWave' src test bin` chỉ ra `loop.mjs:1324`).

⇒ **Mọi phát biểu blast-radius trong item này lấy từ `rg`/`grep` trước;
GitNexus chỉ là chứng phụ khi trùng khớp.** Kết quả grep (chứng chính):
`DEFAULT_MAX_ROOTS`, `DEFAULT_MAX_LEAVES_PER_ROOT`, `resolveParallel`,
`selectWave` xuất hiện **chỉ trong `src/runner/loop.mjs`** — không file
`src/` nào khác, không file test nào, không `bin/` nào. Hai hằng số tuy
`export` nhưng chưa ai ngoài file này đọc.

| Thành phần | Mức | Cái gì chứng minh được (proof point cho validating) |
|---|---|---|
| Pre-check trong drain-run | TRUNG BÌNH — nằm giữa `selectWave` và dispatch, sai là hoặc chặn oan cả runner hoặc không chặn gì | Test: không cấu hình trần ⇒ hành vi y hệt trước (hai test wave cũ còn xanh); trần đã đầy ⇒ 0 dispatch, không halt, không exit khác 0; còn chỗ ⇒ dispatch bình thường |
| `worker-slot-ceiling` → `claim-rejected` thay vì `halted` | TRUNG BÌNH — đổi cách phân loại một lỗi đã có; sai là nuốt nhầm một lỗi thật | Test: mẻ overshoot ⇒ phần đầu chạy, phần đuôi bị từ chối, `outcome` của cả lượt vẫn `drained`/exit 0, item bị từ chối không bị chuyển trạng thái; và mọi `ClaimError` mã khác vẫn halt y như cũ |
| Không cắt mẻ theo `free` (D8) | TRUNG BÌNH — dễ bị "sửa cho đúng số" trong review | Test: `free = 1`, wave 3 thành viên ⇒ cả 3 được đề xuất, không bị bóp xuống 1 |
| Hành vi cũ khi im lặng config | TRUNG BÌNH — mọi repo hiện tại đều **không** có `workerSlots.ceiling` | `loop.test.mjs` chạy đủ, không test cũ nào phải sửa |
| Diễn đạt lại D7 của `fgos-fanout` | THẤP-TRUNG BÌNH — văn xuôi, nhưng chính SKILL.md trích lại cap 5 ở 3 chỗ (`:62`, `:137`, `:177`) | Chính verify của item: `grep -q 'worker-slot'` và `! grep -q 'At most 5 Agents in flight at once'`; đọc lại để chắc không còn chỗ nào mô tả 5 như trần độc lập |

Không có mục nào ở mức CAO ⇒ không có cảnh báo HIGH/CRITICAL nào phải nêu.

### Thứ tự

`fgos graph tsk-3jk --json`: `topUnblock` bị skip ở frame này;
`criticalPath` không đi qua item này, và item này không chặn anh em nào —
nó là con cuối của `tsk-2sj`, ba anh em T1/T2/T3 đã merge xong. Nên thứ tự
*giữa* các item không còn ràng buộc gì; chỉ còn thứ tự *trong* item.

Trong item: (1) pre-check (chạy được ngay, hành vi cũ không đổi khi config
im lặng); (2) chấp nhận từ chối (làm ca overshoot của (1) an toàn); (3)
SKILL.md của fanout (văn xuôi, độc lập hoàn toàn với (1)/(2)); (4) test cho
cả ba. Mỗi bước sau đều có bước trước đã xanh làm nền.

## Shape

### Bước 1 — pre-check trong drain-run (`src/runner/loop.mjs`)

Thêm đúng một import (`hasWorkerSlotRoom` từ `../state/worker-slots.mjs`,
cùng `readSharedConfig` từ `../config/shared-config-file.mjs` — cả hai đã
được `src/runner/claim-port.mjs` import theo đúng hướng này, nên không đẻ
cạnh phụ thuộc mới nào cho `test/architecture.test.mjs`).

```
// cạnh `const parallel = resolveParallel(config);`
const ceiling = readSharedConfig(path.dirname(dir))?.workerSlots?.ceiling;

// trong vòng while, sau `const wave = selectWave(...)`, sau check rỗng:
const room = hasWorkerSlotRoom(view, { ceiling, batchSize: wave.length });
if (!room.allowed) { log(...); break; }
```

`break` chứ không `continue`: hết chỗ thì poll lại ngay cũng vẫn hết chỗ —
một lượt drain là **bounded** (D15), không phải reactor. `--watch` sẽ gọi
lại `runOnce` ở chu kỳ sau, đó mới là chỗ chờ đúng.

Hệ quả trên return shape: nếu wave đầu tiên đã bị từ chối, `dispatched`
rỗng ⇒ `runOnce` trả `outcome: 'idle'`, exit 0. Đúng: "máy đang bận" và
"không có gì để làm" đều là *không có gì runner nên làm lúc này*, và cả hai
đều không phải lỗi. Dòng log phân biệt hai ca cho người đọc.

### Bước 2 — chấp nhận từ chối (`src/runner/loop.mjs`)

Trong `catch` của `claimAndDispatch`, trước khi phân loại theo
`categoryOf`:

```
if (err instanceof ClaimError && err.code === 'worker-slot-ceiling') {
  log(...);
  return { outcome: 'claim-rejected', id: item.id, reason: 'worker-slot-ceiling', exitCode: 0 };
}
```

`ClaimError` đã nằm sẵn trong import của `loop.mjs`. Mọi mã `ClaimError`
khác (`deps-not-merged`, …) đi nguyên đường cũ.

Vòng drain không quay vòng vô hạn vì hai chốt **đã có sẵn**: một wave bị từ
chối toàn bộ ⇒ `progressed` false ⇒ `break` (`:1341`); một wave chỉ bị từ
chối phần đuôi ⇒ vòng sau pre-check thấy 0 chỗ ⇒ `break` ở bước 1. Không
thêm bộ đếm nào.

### Bước 3 — `fgos-fanout` diễn đạt lại D7 (`.claude/skills/fgos-fanout/SKILL.md`)

Ba chỗ phải đổi, vì cả ba đang mô tả 5 như trần:

- §Hard rules `:62-67` — hard rule "At most 5 Agents in flight at once
  (D7)" ⇒ hard rule mới: **hỏi `fgos slots` trước mỗi mẻ (D6)**, hết
  worker-slot thì chờ, còn chỗ thì lấy trọn mẻ (D8), mẻ tối đa 5.
- §Loop `:137` — `for each batch of up to 5 ids from ready (D7)` ⇒ thêm
  bước hỏi slot trước khi bắn, và nói rõ mẻ đi trọn.
- §Red flags `:177` — "dispatching more than 5 Agents at once" ⇒ hai cờ
  đúng hình dạng mới: bắn khi engine đã nói hết chỗ, và tự bẻ một mẻ đã
  tính sẵn cho vừa số slot còn trống.

Từ `worker-slot` phải xuất hiện thật trong văn bản (vế POSITIVE của
verify) — nó là từ vựng chung mà D1 đã khoá, không phải chuỗi ma thuật:
skill này đang nói về đúng khái niệm đó.

Câu lệnh skill dùng để hỏi là `fgos slots --json` — cùng cửa mà
herdr-plugin (T2) đã đi, không phải cửa riêng.

### Bước 4 — test (`test/runner/loop.test.mjs`)

Ngoài footprint đã khai (`src/runner/loop.mjs`,
`.claude/skills/fgos-fanout/SKILL.md`) — nêu thẳng ở đây thay vì lặng lẽ
thêm. Test không phải file mà item khác đang sửa (T1 viết
`test/state/worker-slots.test.mjs`, T2 viết Rust, T3 đã xong), và item này
là con cuối chạy một mình, nên không có nguy cơ đụng nhau. Hạ tầng đã có
sẵn trong file: `configFor`, `writeCommittingExecutor`, và hai test
`parallel:` ở `:622`/`:642` là khuôn để nương theo.

### Ca đáng chứng minh

- **Biên rỗng/biên trên:** không cấu hình trần (mọi repo hôm nay); trần
  đúng bằng số item đang chạy; trần còn đúng 1 chỗ mà wave có 3.
- **Hành vi cũ không vỡ:** toàn bộ `test/runner/loop.test.mjs` và
  `test/e2e/runner-loop.test.mjs` còn xanh, không test nào phải sửa.
- **Vượt trần rồi acquire tiếp:** mẻ overshoot chạy, lượt kế bị từ chối
  sạch, không cộng dồn.
- **Hỏng một phần:** một `ClaimError` mã khác giữa mẻ ⇒ vẫn halt như cũ.
- **Truy cập đồng thời:** một launcher khác chiếm chỗ giữa pre-check và
  claim ⇒ cổng cưỡng chế bắt được, và bước 2 hạ cánh mềm.

## Assumptions

- **A-1 — Luật trọn mẻ là luật phía *launcher*, không phải bảo đảm
  end-to-end.** *Giả định có chủ ý, nêu thẳng vì đây là chỗ dễ đọc D8
  thành lời hứa mạnh hơn thực tế.* Pre-check cấp trọn mẻ, nhưng
  `claimWork` vẫn gác từng item một với `batchSize` mặc định 1, nên phần
  đuôi của một mẻ overshoot **vẫn có thể bị chặn**. Đó đúng là cuộc đua mà
  T1 đã chốt chấp nhận (`worker-slots.mjs:27-30`), và biên overshoot D8
  mô tả là **chặn trên**, không phải bảo đảm mẻ nào cũng đi trọn. Sửa cho
  chặt sẽ phải đụng `claim-port.mjs` — ngoài footprint, và ngược với chủ ý
  T1. Bước 2 tồn tại chính là để ca này hạ cánh mềm thay vì làm sập lượt.

- **A-2 — Trần đọc một lần cho cả lượt drain là đủ.** *Giả định có chủ ý.*
  `ceiling` là **cấu hình** (đổi khi người sửa `config.json`), còn
  `occupied` là **trạng thái** (đổi liên tục) — chỉ cái sau cần đọc lại mỗi
  vòng, và nó đã được đọc lại qua `view`. Một lượt drain là bounded và
  ngắn; `--watch` đọc lại ở chu kỳ sau. Đọc lại `config.json` mỗi vòng là
  thêm I/O đồng bộ vào đúng vòng nóng để đổi lấy một ca không có thật.

- **A-3 — `fgos-fanout` hỏi engine bằng `fgos slots --json`, không tự đếm
  Agent đang bay.** *Giả định có chủ ý, khớp D2.* Skill này chạy trong một
  session và có thể tự biết nó đã bắn bao nhiêu Agent — nhưng con số đó
  chỉ là phần của chính nó, mù với herdr-plugin và runner, tức đúng cái lỗ
  F2 mà item này đóng. Occupancy là sự thật của engine (D2). Hệ quả: một
  Agent đã bắn nhưng chưa claim được item nào thì **chưa** chiếm slot —
  đúng D7 (đếm theo work-item), không phải theo tiến trình.

- **A-4 — `readSharedConfig` ném khi JSON hỏng, và để nguyên như vậy.**
  *Giả định có chủ ý.* File config hỏng là lỗi cấu hình thật, và nó đã ném
  ở mọi caller khác (`claim-port.mjs`, `fgos slots`) — nuốt riêng ở runner
  sẽ làm runner im lặng chạy không trần trong khi mọi cửa khác báo lỗi.
  Ném ở đây rơi vào `catch` ngoài của `runOnce` và được phân loại như mọi
  lỗi khác, không có đường riêng.

## Ngoài phạm vi

Ranker toàn cục xuyên pool (D6 để lại có chủ ý); liveness động cho lane
admin (T1 A-1 để lại); `tsk-60h` (agent tự xử xung đột merge); gom câu hỏi
để hỏi người một lần (`AGENTS.md` ưu tiên #2); làm `claimWork` hiểu
`batchSize` để bảo đảm trọn mẻ end-to-end (A-1); trần cho chính lane admin
(D9: chỗ dành riêng cố định, không phải trần).

## Outstanding questions

None
