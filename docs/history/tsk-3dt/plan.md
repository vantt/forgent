# tsk-3dt — Sổ worker slot + cổng gác trần + verb đọc (engine)

Item: `tsk-3dt` (tier/kind/risk = standard/feature/heavy), con T1 của
`tsk-2sj`.

Mode: **high-risk** — 4 flag áp dụng: *data model* (mục config mới
`workerSlots` + khái niệm lane/occupancy), *public contracts* (2 CLI verb
mới, API module mới, `claimWork` thêm một mã từ chối mới), *existing
covered behavior* (`claimWork` đang được phủ bởi
`test/runner/claim-port.test.mjs`, `test/cli/fgos-claim.test.mjs`,
`test/cli/take-pick-claim-eligibility.test.mjs`), *weak proof around the
area* (GitNexus trả false negative đúng trên `claimWork` — xem Bản đồ rủi
ro). Không flag hard-gate nào (auth, data loss, audit/security, external
provider, gỡ một validation) — nhưng `4+ → high-risk` đã đủ. Một lane nhỏ
hơn không trung thực được: chạm `claimWork` là chạm choke point mọi đường
claim của cả hệ đi qua.

## Nguồn quyết định

Item này **không có `CONTEXT.md` riêng**, và đó là đúng cấu trúc: nó là
item con tách ra từ `tsk-2sj` ở stage `planning`, thừa kế nguyên quyết
định đã khoá của cha. Nguồn citable:

- `docs/history/orchestrator-worker-slots/plan.md` — Mode, bản đồ rủi ro,
  A1-A8, Supersede, chia việc; §Shape "T1" là contract của chính item này.
- `docs/history/orchestrator-worker-slots/DISCUSSION.md` §4 (D1-D10) — bảng
  quyết định của buổi `fgos-coding-shaping`.
- `docs/history/orchestrator-worker-slots/RESEARCH.md` — F-A…F-G, có
  `file:line` thật.

Plan này **không mở lại** bất kỳ quyết định nào ở trên; nó chỉ dịch
§Shape "T1" thành thứ tự thi công và nêu những giả định mới mà chính việc
đọc code sinh ra.

## Approach

### Đường đã chọn

**Một module thuần, hai mặt, hai cửa ra; không đẻ sổ mới, không đẻ event
mới.**

1. **`src/state/worker-slots.mjs` — thuần, không fs** (cùng kỷ luật
   `plan-pool.mjs:1-4`/`cleanup-pool.mjs`/`frontier.mjs`). Export:

   - `countWorkerSlots(view)` — **fold thuần trên view** (D2): đếm item
     `status === 'doing'`, kèm `writer.id` (đã có sẵn trên item — xác minh
     bằng `fgos list --id tsk-3dt --json`, trường `writer: {id, source}`)
     và `claimRole` (`replay.mjs:151` gấp lên item ngay trên cạnh
     `to === 'doing'`, RESEARCH F-C). Không event type mới, không field
     mới, không lọc liveness (A6 đã **gỡ**, không phải hoãn).
   - `hasWorkerSlotRoom(view, { ceiling, batchSize })` — mặt hỏi trước.
     Luật D8 nằm ở đây: `allowed = occupied < ceiling`, và khi `allowed`
     thì `granted = batchSize` **trọn mẻ**, không cắt theo số slot còn
     trống. Trần mềm chỉ ở biên trên (D7), không cộng dồn được vì mẻ kế
     tiếp thấy `occupied >= ceiling` là bị từ chối.
   - `ADMIN_LANE_RESERVATION = 4` — lane admin là **chỗ dành riêng cố
     định** (D9), đơn vị khác hẳn lane execution nên **không trừ vào**
     trần execution: RESEARCH F-B chứng minh lane admin không bao giờ
     claim một work-item (mọi cạnh của nó là `awaiting-approval →
     delivered → retrospective → cleanup → done`, không cạnh nào chạm
     `doing`), nên nó không có đối tượng để đếm chung một pool.

2. **Cổng cưỡng chế trong `claimWork`** (`src/runner/claim-port.mjs`) —
   đặt **ngang hàng** với nhánh `if (isolate && isLeaf)` ở `:160`, **không
   lồng vào trong**: nhánh đó chỉ bắn cho `pick`, còn một worker chiếm một
   slot bất kể nó có worktree hay không. Cổng bắn đồng đều cho cả ba
   caller sản xuất (`bin/fgos.mjs:2320` `doTake`, `bin/fgos.mjs:2391`
   `doPick`, `src/runner/loop.mjs:496` runner). Từ chối bằng
   `ClaimError('worker-slot-ceiling', …)` với `category: 'validation'`
   (thêm một entry vào `CLAIM_ERROR_CATEGORY` `:60`, cùng khuôn
   `deps-not-merged`) — **không** để rơi vào `unexpected`, vốn làm sập cả
   lượt drain của runner thay vì dừng mềm một item.

3. **Hai CLI verb** (`bin/fgos.mjs` + `src/cli/command-registry.mjs` —
   `test/cli/fgos-manifest.test.mjs:43` bắt buộc hai file khớp nhau):

   - `fgos slots` — mặt read-only phơi ra ngoài. Theo `0014` (CLI-spawn =
     cửa), đây là **đường duy nhất** `herdr-plugin` (Rust, gọi qua
     `Command::new("node") + bin/fgos.mjs`) và `fgos-fanout` (prose skill)
     với tới được. `touchesState: false`, `requiresExistingStore: true`.
   - `fgos report <id> --text … --stop-reason …` — chỗ hạ cánh cho báo cáo
     cuối của driver (D10/A8-3), để đọc bằng `fgos show <id>` thay vì canh
     terminal. **Không event type mới, không field mới**: ghi qua
     `addDecision` sẵn có (`store.mjs:858`) với `source: 'driver-report'`,
     `kind: 'engine'`, `id` = item — `fgos show` đã trả `decisions:
     rawView.decisionsById?.[id]` (`bin/fgos.mjs:1912`) nên báo cáo hiện
     ra ngay, không cần sửa `show`, `store.mjs` hay `replay.mjs` (cả ba
     đều ngoài footprint).

4. **Đăng ký config** qua `registerConfigDefault({id, key, shape})`
   (`src/setup/registrations.mjs:97`), đi đúng vết `gateBypass` `:754` và
   `cleanup` `:776`, để `fgos setup` ghi mặc định và `fgos doctor` nhìn
   thấy — bắt buộc theo install/setup/doctor gate của `AGENTS.md`.

### Phương án đã cân nhắc và loại

| Phương án | Vì sao loại |
|---|---|
| Event type `slot.acquire`/`slot.release` | D2 cấm; RESEARCH F-C cho thấy occupancy suy thuần được. Nguồn sự thật thứ hai sẽ lệch khỏi FSM |
| Đặt cổng trong nhánh `if (isolate && isLeaf)` sẵn có | Chỉ bắn cho `pick`; `take`/runner lọt hoàn toàn — đúng lỗ mà cổng sinh ra để vá |
| Trừ 4 slot admin vào trần execution | Sai đơn vị: F-B chứng minh lane admin không claim work-item nào, nên hai lane không chia chung một pool đếm được |
| Dùng `runner.lock` cho liveness lane admin | A1 cấm dứt khoát: đó là guard singleton một tiến trình, chỉ `fgos-runner` giữ, không phải cơ chế N slot |
| Event type/field mới cho báo cáo driver | Buộc sửa `store.mjs` + `replay.mjs` — cả hai ngoài footprint; `addDecision` + `fgos show` đã đủ chỗ hạ cánh |
| Trần bật sẵn với giá trị in-code khi config vắng | Xem A-3 dưới: store thật đang có **15 item ở `doing`**, bật sẵn sẽ chặn ngay mọi `pick`/`take` của repo này |

### Bản đồ rủi ro

`impact-analysis: **degraded**` — không phải vì index cũ. `fgos tool query
--capability impact-analysis --status present` trả **1 provider
(`gitnexus`, `status: present`)**, nhưng chính lời gọi
`impact({target:'claimWork', direction:'upstream'})` trong phiên này trả
`impactedCount: 0`, `maxRisk: "LOW"`, 3 candidate đều `direct: 0` — trong
khi `grep -rn "claimWork(" src bin` cho **3 caller sản xuất thật**
(`src/runner/loop.mjs:496`, `bin/fgos.mjs:2320`, `bin/fgos.mjs:2391`).
Đúng false negative mà RESEARCH F-G đã ghi. ⇒ **Mọi phát biểu blast-radius
trong item này đều lấy từ `rg`/`grep`, GitNexus chỉ là chứng phụ, không
bao giờ dùng một mình để hạ mức rủi ro.**

| Thành phần | Mức | Cái gì chứng minh được (proof point cho validating) |
|---|---|---|
| Cổng trong `claimWork` | **CAO** — mọi đường claim đi qua đây; sai là chặn toàn bộ đầu vào công việc | Test: cổng chỉ từ chối khi `occupied >= ceiling`; **toàn bộ test claim hiện có còn xanh** (`npm test`). Blast radius đối chiếu chéo `rg` |
| Trần bật/tắt theo config | **CAO** — bật sai chỗ là brick cả backlog đang chạy (15 item `doing` thật) | Test: config vắng ⇒ cổng no-op, hành vi y hệt trước khi có nó; config có `ceiling` ⇒ cổng bắn |
| Mã lỗi mới của `ClaimError` | TRUNG BÌNH — `category` sai làm sập cả lượt drain của runner | Test: `err.category === 'validation'`, không phải `'unexpected'` |
| Hai verb CLI mới | TRUNG BÌNH — `fgos-manifest.test.mjs:43` bắt registry ↔ `runVerb()` khớp tuyệt đối | `npm test` (chính test đó là vế chứng minh) |
| `fgos report` ghi qua `addDecision` | THẤP-TRUNG BÌNH — `addDecision` bắt buộc `rationale` non-empty (`store.mjs:862`) | Test: `fgos report` rồi `fgos show <id>` thấy bản ghi |
| Luật trọn-mẻ (D8) | THẤP-TRUNG BÌNH — biên vượt không được cộng dồn | Test: `hasWorkerSlotRoom` với `batchSize > free` vẫn `granted = batchSize` khi còn ≥1 chỗ; `occupied >= ceiling` thì `granted = 0` |
| Bypass `fgos move --to doing` | THẤP — verb thủ công đi thẳng `moveWork` | Ghi nhận là giới hạn đã biết (A3 của cha); không chặn ở đợt này |

### Thứ tự

`fgos graph --json` cho item này: `topUnblock: null`, `criticalPath` chạy
nhánh herdr-plugin — tức tsk-3dt không nằm trên critical path của đồ thị,
nhưng T2 và T4 phụ thuộc nó, nên nó vẫn phải xong trước hai con đó.

Trong item: (1) module thuần trước — nó không phụ thuộc gì và là thứ mọi
phần còn lại import; (2) test module thuần; (3) cổng trong `claimWork` +
test cổng; (4) hai verb CLI + registry; (5) `registerConfigDefault`.
Thứ tự này để mỗi bước sau đều có bước trước đã xanh làm nền.

## Shape

### Bước 1 — `src/state/worker-slots.mjs` (mới, thuần)

```
ADMIN_LANE_RESERVATION = 4
DEFAULT_WORKER_SLOT_CEILING = 8
countWorkerSlots(view) -> { execution: { occupied, items: [{id, sessionId, claimRole}] },
                            admin: { reserved: ADMIN_LANE_RESERVATION } }
hasWorkerSlotRoom(view, { ceiling, batchSize = 1 })
  -> { allowed, occupied, ceiling, free, granted, reason }
```

- `ceiling` là **tham số**, không đọc config bên trong — giữ module thuần.
- `ceiling` `null`/`undefined`/không phải số nguyên dương ⇒ `allowed:
  true`, `reason: 'no-ceiling-configured'`. Đây là hình dạng "không cấu
  hình thì không chặn" mà repo này đã dùng cho `invariantChecks`
  (`shared-config-file.mjs:51-53`: *"an absent section means no invariant
  check runs at all, leaving behavior identical to before this existed"*).

### Bước 2 — `test/state/worker-slots.test.mjs` (mới)

Chứa **cả** test module thuần **và** test tích hợp cổng — vì
`test/runner/claim-port.test.mjs` nằm ngoài footprint của item này.

### Bước 3 — cổng trong `src/runner/claim-port.mjs`

Đặt sau khối `if (isolate && isLeaf)` (`:160-168`), **ngang hàng**, trước
đoạn tính `branchHeadAtTake` — tức trước `moveWork`, cùng lý do khối
`deps-not-merged` đã nêu tại `:155-159`: từ chối *trước* khi `moveWork`
commit thì lần claim hỏng trông như chưa từng xảy ra, thay vì bỏ mồ côi
item ở `doing`.

Đọc trần: `readSharedConfig(repoRoot)?.workerSlots?.ceiling`
(`src/config/shared-config-file.mjs:28`, `dir` là project root — chính
`repoRoot` mà `claimWork` đã nhận sẵn).

### Bước 4 — `bin/fgos.mjs` + `src/cli/command-registry.mjs`

`fgos slots [--json]` và `fgos report <id> --text … [--stop-reason …]`,
mỗi verb một entry registry đủ 4 cờ (`touchesState`, `externalEffect`,
`paginated`, `requiresExistingStore`) theo `fgos-manifest.test.mjs:49`.

### Bước 5 — `src/setup/registrations.mjs`

```
registerConfigDefault({ id: 'workerSlots', key: 'workerSlots',
  shape: { ceiling: DEFAULT_WORKER_SLOT_CEILING,
           adminReservation: ADMIN_LANE_RESERVATION } });
```

### Ca đáng chứng minh

- **Biên rỗng/biên trên:** view rỗng; 0 item `doing`; đúng bằng trần; trên
  trần.
- **Trọn mẻ (D8):** `batchSize = 5` khi chỉ còn 1 chỗ ⇒ `granted = 5`;
  `occupied >= ceiling` ⇒ `granted = 0`.
- **Không cấu hình ⇒ không chặn:** `ceiling` vắng ⇒ mọi claim đi qua y như
  trước.
- **Cổng bắn đồng đều:** từ chối cả `isolate: true` (`pick`) lẫn
  `isolate: false` (`take`/runner) khi hết chỗ.
- **Hành vi cũ không vỡ:** toàn bộ `npm test`.
- **Hỏng một phần:** claim bị từ chối **trước** `moveWork` ⇒ item vẫn ở
  `todo`, không mồ côi ở `doing`.
- **`fgos report` → `fgos show`:** báo cáo hiện ra trong `decisions`.

## Assumptions

- **A-1 — Lane admin không cần cơ chế liveness nào ở T1.** *Giả định có
  chủ ý, kèm bằng chứng — đây là chỗ duy nhất plan này đi khác chữ nghĩa
  của A1 (cha), nên nêu thẳng thay vì lặng lẽ.*

  A1 (cha) chốt: nếu cần liveness cho lane admin thì dùng **hình dạng
  registry N entry mang pid** (như `sessions.json`,
  `session-identity.mjs:58`), **không bao giờ** `runner.lock`. Plan này
  giữ nguyên vế cấm — `runner.lock` không xuất hiện ở đâu trong T1.

  Vế còn lại: T1 **không hiện thực cơ chế liveness nào cả**, vì D9 đã chốt
  lane admin là **chỗ dành riêng kích thước cố định 4**. "Cố định" nghĩa
  là occupancy của nó là hằng số theo định nghĩa — một bộ lọc liveness sẽ
  *mâu thuẫn* với chính chữ "cố định", và A6 vốn đã gỡ hẳn việc lọc
  liveness định kỳ. Cộng thêm F-B: lane admin không claim work-item nào,
  nên không có gì để đếm. Một registry pid không ai ghi vào và không ai
  đọc ra là code chết.

  ⇒ Nếu về sau một consumer thật (T2, mô hình 4 pane của `fg:operation`)
  cần occupancy admin *động*, thì hình dạng đã được A1 chỉ định sẵn là
  registry N entry mang pid — item này chỉ không xây trước khi có người
  dùng. **Cần validating xác nhận cách đọc này**, vì nó là chỗ duy nhất
  plan con nới chữ nghĩa của plan cha.

- **A-2 — D8 (trọn mẻ) sống ở mặt hỏi trước, không sống ở cổng.**
  *Giả định có chủ ý.* `claimWork` được gọi **mỗi item một lần**, nên cổng
  chỉ biểu đạt được luật đó với `batchSize = 1`, tức "từ chối khi và chỉ
  khi `occupied >= ceiling`". Hệ quả đã biết: một mẻ 5 worker được mặt hỏi
  trước cho qua lúc chỉ còn 1 chỗ sẽ có 1 worker claim được và 4 bị cổng
  từ chối. Đây **không phải lỗi mới** — nó là chính "đua giữa hai mặt là
  chấp nhận được, có chủ ý" mà plan cha đã khoá (`plan.md:70-74`), và pane
  bị từ chối vốn đã tự đóng. Không thêm reservation/TTL để bịt.

- **A-3 — Trần phải TẮT khi config vắng, nếu không sẽ brick backlog đang
  chạy.** *Bằng chứng đo trong phiên này, không phải suy đoán.* Store thật
  (`/home/vantt/projects/forgentX/.fgos`) đang có **15 item ở `status:
  doing`**. Với trần in-code 8 bật sẵn, `fgos pick`/`fgos take` tiếp theo
  ở repo này — kể cả 3 item con còn lại của `tsk-2sj` — bị từ chối ngay.
  Vì vậy mặc định in-code là **không có trần** (cổng no-op), còn số 8 chỉ
  là giá trị `fgos setup` ghi ra khi người ta chủ động bật. Đây là đúng
  kỷ luật `invariantChecks` đã dùng (`shared-config-file.mjs:51-53`), chứ
  không phải nới lỏng để test xanh.

  (15 item `doing` đó phần lớn là *sự cố* theo đúng nghĩa A6 mô tả — việc
  của `/fgOS:stale` + `tsk-3ni`, ngoài phạm vi item này.)

- **A-4 — `addDecision` đủ làm chỗ hạ cánh cho D10.** *Chưa chứng minh —
  proof point ở validating/test.* `addDecision` bắt buộc `rationale`
  non-empty (`store.mjs:862-867`); `fgos report` phải tự cấp một
  `rationale` có nghĩa (stop reason), không được để rỗng.

- **A-5 — `claimWork` chỉ có 3 caller sản xuất.** *Đã chứng minh bằng
  `grep -rn "claimWork(" src bin test`* — 3 caller sản xuất + 1 định
  nghĩa + 25 lời gọi trong `test/runner/claim-port.test.mjs`. GitNexus
  **không** xác nhận được điều này (trả 0) — xem Bản đồ rủi ro.

## Ngoài phạm vi

Ranker toàn cục xuyên pool (D6 để lại có chủ ý); T2/T3/T4 (item riêng);
`tsk-60h` (agent tự xử xung đột merge); chặn `fgos move --to doing`
(A3 của cha); dọn 15 item `doing` tồn đọng (`/fgOS:stale`).

## Outstanding questions

None
