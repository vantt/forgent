# orchestrator-worker-slots — plan

Item: `tsk-2sj` (tier/kind/risk = heavy/feature/heavy).

Mode: **high-risk** — 5 flag áp dụng: *data model* (mục config mới + khái
niệm binding slot↔work-item), *external systems* (adapter shell ra CLI
`herdr`), *public contracts* (port `PaneOrchestrator`, pinned term
`fg:agents-N`, prose của 3 skill), *existing covered behavior*
(`claimWork` và 129 test của herdr-plugin đều đang phủ vùng này; đợt này
supersede 2 quyết định đã khoá), *multi-domain* (JS engine + Rust plugin +
skill prose + config registry). Không flag hard-gate nào (auth, data
loss, audit/security, external provider, gỡ một validation) — nhưng riêng
số lượng 5 đã đủ ngưỡng `4+ → high-risk`. Một lane nhỏ hơn không trung
thực được: chỉ riêng việc chạm `claimWork` — choke point mọi đường claim
đi qua — đã vượt xa "vài file, không vùng xám".

## Nguồn quyết định

Item này **không có `CONTEXT.md`**, và đó là đúng cấu trúc chứ không phải
thiếu sót: verdict `clear` ở stage `discovery` bỏ qua `exploring`, mà
`exploring` mới là nơi viết `CONTEXT.md`. Quyết định đã khoá nằm ở hai
chỗ, cả hai đều citable:

- `docs/history/orchestrator-worker-slots/DISCUSSION.md` §4 — bảng D1-D8
  từ buổi `fgos-coding-shaping` 5 vòng.
- Event log của `tsk-2sj` — 9 decision thật (seq 14352-14376, 14401), là
  lưới an toàn máy đọc được, độc lập với việc ai đó có đọc đúng prose hay
  không.

Bằng chứng khảo sát: `docs/history/orchestrator-worker-slots/RESEARCH.md`
(2 vòng, có `file:line` thật).

## Approach

### Đường đã chọn

**Hai mặt, một nguồn sự thật; không đẻ sổ mới.**

T1 phơi **hai mặt tách bạch**, không được gộp làm một:

1. **Hỏi trước (read-only)** — `còn chỗ cho class này không`. Launcher gọi
   *trước khi* dựng worker (mở pane / spawn tiến trình / bắn Agent). Rẻ,
   không giữ chỗ, không ghi gì.
2. **Chặn sau (cưỡng chế)** — cổng bên trong `claimWork`, để không đường
   nào lách qua, kể cả một launcher tương lai quên gọi mặt (1).

Vì sao phải cả hai: `claimWork` chỉ chạy **sau khi** worker đã dựng xong —
chuỗi thật là `herdr mở pane → claude khởi động → /fgOS:discover-next →
chọn item → take/pick → cổng bắn`. Nếu chỉ có mặt (2), một launcher phải
tốn nguyên một pane mới học được "hết chỗ", đúng thứ D6 muốn tránh khi nói
"xin slot TRƯỚC KHI dựng". Nếu chỉ có mặt (1), bất kỳ đường claim nào
không đi qua launcher đều lọt.

**Đua giữa hai mặt là chấp nhận được, có chủ ý.** Giữa "hỏi thấy còn chỗ"
và "claim thật" có cửa sổ để một launcher khác lấy mất chỗ cuối. Không
thêm reservation/TTL để bịt: D7/D8 vốn đã cố ý làm trần mềm, và một pane
bị từ chối vốn đã tự đóng (`--autoClose` khi pool rỗng). Thêm machinery
giữ chỗ là mua phức tạp để giải bài mà thiết kế đã chọn sống chung.

**Cổng phục vụ đúng lane execution, không phục vụ lane admin.** Đường nào
claim thì được cổng phủ: `/fgOS:discover` (SKILL.md bước 2: `take` rồi
fallback `pick`), `/fgOS:plan` (`:87` `take`, `:103` `pick`),
`/fgOS:pick`, runner, fanout (bắn Agent chạy `/fgOS:pick`). Còn
`merge`/`retro`/`cleanup` KHÔNG claim — `merge-next` và `cleanup-next`
không có lệnh claim nào, mọi hit chữ "pick" trong hai file đó chỉ là văn
xuôi — nên chúng nằm ngoài cổng hoàn toàn và được đếm bằng cơ chế riêng
của lane admin (D9).

**Cạm bẫy khi đặt cổng — đừng lồng vào nhánh `isolate` sẵn có.** Ba
caller gọi CÙNG một hàm `claimWork`, chỉ khác tham số:

| Caller | `actor` | `isolate` | Ghi chú |
|---|---|---|---|
| `take` (`bin/fgos.mjs:2320`) | `role` | `false` | claim tại main checkout, không dựng worktree |
| `pick` (`bin/fgos.mjs:2391`) | `session` | `true` | dựng `fgw/<id>` dưới `.claude/worktrees` |
| runner (`loop.mjs:496`) | `runner` | `false` | `skipOutcome: true`, runner tự ghi outcome sau |

Check `deps-not-merged` sẵn có nằm trong `if (isolate && isLeaf)`
(`claim-port.mjs:160`) — tức **chỉ bắn cho `pick`**, không bắn cho `take`.
Cổng trần thì ngược lại: phải bắn **đồng đều bất kể `isolate`**, vì một
worker chiếm một slot dù nó có worktree riêng hay không. Đặt cổng ngang
hàng với nhánh đó, không lồng vào trong.

Chính vì tầng chọn đa dạng (6 picker) mà tầng claim lại hội tụ về một hàm
nên cổng **không cần biết picker nào đã chọn item** — nó chỉ đếm số
work-item đang ở `doing`. Đó là điều làm D6 khả thi: giữ nguyên 6 picker,
thêm đúng 1 cổng, thay vì vá 6 chỗ.

Lane execution: cổng gác trần nằm **bên trong `claimWork`**
(`src/runner/claim-port.mjs:90`) — nơi `fgos take` (`doTake`), `fgos pick`
(`doPick`) và runner (`loop.mjs:496`) đều đi qua (RESEARCH F-A). Occupancy
đếm thuần từ view sẵn có: số item `status === 'doing'`, tách theo
`claimRole` khi cần (`replay.mjs:151` gấp `claimRole` lên item ngay trên
cạnh `to === 'doing'`; `store.mjs:1070` đã có sẵn idiom duyệt
`work.move`/`to: 'doing'`) — RESEARCH F-C. Không event type mới, không
field mới (D2, D6, D7).

Lane admin: **chỗ dành riêng, kích thước cố định 4** (3 loại loop hôm nay
+ 1 thủ sẵn), KHÔNG đếm bằng work-item — vì lane này không bao giờ claim
một work-item (D9, RESEARCH F-B). Liveness dùng **hình dạng registry N
entry mang pid** (như `sessions.json`, `session-identity.mjs:58` /
`session.mjs:537`), tái dùng *kỹ thuật* pid-liveness của `runner.lock`
(signal-0, thu hồi khi pid chết) bên trong nó. **Không** tái dùng chính
`runner.lock`: nó là guard singleton một tiến trình, chỉ `fgos-runner`
dùng, không phải cơ chế N slot — xem A1 để biết vì sao validating lật
thứ tự ưu tiên này.

Trần mềm (D7/D8) hiện thực bằng đúng một luật ở cổng: **còn ≥1 slot trống
thì cho lấy trọn mẻ**. Không cộng dồn được, vì lần acquire kế tiếp thấy 0
chỗ là bị từ chối — không cần biến tinh chỉnh nào.

### Phương án đã cân nhắc và loại

| Phương án | Vì sao loại |
|---|---|
| Event type mới `slot.acquire`/`slot.release` | RESEARCH F-C cho thấy occupancy suy thuần được từ `status: doing` + `claimRole`. Một event type mới tạo nguồn sự thật thứ hai, có thể lệch khỏi FSM — đúng thứ D2 cấm |
| Đặt cổng ở từng launcher | Lại ba hiện thực, đúng cái lỗ F2 đang muốn vá; một launcher mới sau này sẽ quên |
| Occupancy đọc từ nhãn pane (hành vi hôm nay) | D2 cấm; và đó chính là bug `fgos-auto-discover` đang sống |
| Ranker toàn cục xuyên pool | D6 để lại có chủ ý — trục ưu tiên chung cần dữ liệu occupancy thật mới thiết kế đúng |
| Đếm theo tài nguyên thật (trọng số/launcher) | D7 chốt đếm theo work-item; chấp nhận đánh đổi độ chính xác lấy một đơn vị duy nhất cả ba launcher cùng nói |

### Bản đồ rủi ro

`impact-analysis: degraded` — index đã được làm tươi trong phiên này,
nhưng vẫn degraded, vì một lý do sắc hơn "index cũ".

Index nay `up-to-date` (indexed commit `fa067c9` khớp HEAD, 14.640 node /
20.545 edge). Dù vậy, với chính index tươi đó:

- `impact({target: 'claimWork', direction: 'upstream'})` trả
  `impactedCount: 0`, `risk: "LOW"`, `epistemic: "exact"`;
- `context({name: 'claimWork'})` chỉ thấy caller là file test.

Trong khi `grep -rn "claimWork(" src bin` cho **ba caller sản xuất thật**:
`src/runner/loop.mjs:496`, `bin/fgos.mjs:2320` (`doTake`), `bin/fgos.mjs:2391`
(`doPick`). Chi tiết: `RESEARCH.md` vòng 3, F-G.

Nghĩa là công cụ đang tự tin báo `LOW` cho đúng symbol mang rủi ro CAO
của kế hoạch này — nguy hiểm hơn một index tự khai là cũ. Ràng buộc bắt
buộc cho cả 4 hạng mục con: **bằng chứng blast-radius từ GitNexus phải
đối chiếu chéo `rg`/`grep`, không bao giờ dùng một mình để hạ mức rủi
ro.** Đúng nhánh degraded của gate trong `CLAUDE.md`.

Ghi chú vận hành phát hiện kèm: `gitnexus analyze` trả **exit code 0 dù
thất bại** (lần đầu chết ở bước xoay WAL, log level 50, index không đổi).
Chỉ `node .gitnexus/run.cjs status` mới nói thật index có tươi hay không.

| Thành phần | Mức | Cái gì chứng minh được |
|---|---|---|
| Cổng trong `claimWork` | **CAO** — mọi đường claim của cả hệ đi qua đây; sai là chặn toàn bộ đầu vào công việc | Test: cổng chỉ từ chối khi thật sự quá trần; toàn bộ test claim hiện có còn xanh. Blast radius đối chiếu chéo `rg` (GitNexus degraded) |
| Cơ chế liveness lane admin | TRUNG BÌNH — chọn lock-pid hay `sessions.json` đổi hành vi thu hồi khi crash | Test: một loop chết để lại lock, slot phải được thu hồi ở lần kiểm kế tiếp |
| `fg:operation` 2 → 4 pane | TRUNG BÌNH — supersede `tsk-5lr` D2 (nhận diện theo hình học); workspace đang sống có tab 2 pane cũ | Test/thủ công: tab `fg:operation` 2 pane có sẵn phải migrate được, không rơi vào trạng thái lỗi |
| Đổi `fg:agents-N` → `fg:workers-N` | TRUNG BÌNH — pinned term; pane đang sống mang nhãn cũ | Vế negative: không còn tham chiếu `fg:agents-` nào sót |
| runner + fanout tuân trần chung | TRUNG BÌNH — đổi hành vi song song của hệ đang chạy ổn | Test: runner vẫn dispatch bình thường khi dưới trần; bị từ chối khi hết chỗ |
| Trần mềm (D8) | THẤP-TRUNG BÌNH — biên vượt không được cộng dồn | Test: sau khi lấy trọn mẻ vượt trần, acquire kế tiếp bị từ chối |
| Bypass `fgos move --to doing` | THẤP — verb thủ công đi thẳng `moveWork`, không qua `claimWork` | Ghi nhận là giới hạn đã biết trong plan; không chặn ở đợt này |

### Thứ tự

`fgos graph --json` cho `criticalPath` depth 10 chạy đúng chuỗi
herdr-plugin (`tsk-4vo → tsk-3t9 → … → tsk-19y-1`), `topUnblock: null`.
Nghĩa là nhánh herdr là đường dài nhất của đồ thị — càng thêm lý do để
KHÔNG bắt đầu từ nó: T1 (engine) phải xong trước để T2 có cái mà gọi.

T1 → rồi T2, T3, T4 chạy song song được. Footprint đã tách để không đụng
nhau: T1 giữ trọn phần đăng ký config trong `registrations.mjs` (T4 chỉ
tiêu thụ, không sửa file đó); T2 chỉ đụng Rust; T3 chỉ đụng prose skill.

## Shape — 4 pha

**T1 — Sổ worker slot + cổng gác trần (engine).** Thêm module thuần
`src/state/worker-slots.mjs` (không fs, cùng kỷ luật `discover-pool.mjs`/
`plan-pool.mjs`) export **cả hai mặt**: phép đếm occupancy + phép hỏi còn
chỗ (mặt read-only launcher gọi trước khi dựng worker), gồm cả luật
trọn-mẻ của D8. Nối mặt cưỡng chế vào `claimWork`. Đăng ký mục config trần
qua `registerConfigDefault({id, key, shape})`
(`src/setup/registrations.mjs:97`, theo đúng vết `gateBypass` `:754` và
`cleanup` `:776`) để `fgos setup` ghi mặc định và `fgos doctor` nhìn thấy
— bắt buộc theo install/setup/doctor gate của `AGENTS.md`.

**T2 — herdr-plugin dùng port, bỏ nhãn-guard.** Chuyển từ tự đếm sang xin
phép engine; sửa bug `fgos-auto-discover` ở phía ĐỌC (hỏi engine thay vì
dò nhãn — D5). Đổi `fg:agents-N` → `fg:workers-N`; `fg:operation` 2 → 4
pane, supersede `tsk-5lr` D2; bỏ `MAX_PANES_PER_TAB`/`MAX_AGENT_TABS` khỏi
vai trò nguồn trần; đổi từ vựng `place_new_agent_pane` sang slot.

**T3 — Helper đặt nhãn có capability-gate.** Đưa `terminal`/`rename.sh`
thành điểm hexagon thật: khai capability qua `fgos tool register`
(`src/state/tool-registry.mjs`, `KINDS` `:34`, `normalizeCapability`
`:43`), gate theo `fgos tool query`, no-op im lặng khi không hỗ trợ. Chốt
chỗ gọi cho lane execution ở `fgos-coding-driving`; gỡ lời gọi rename rải
rác (`discover-next` bước 6).

**T4 — runner và fanout xin slot trước khi dispatch.** `runner.parallel.
{maxRoots,maxLeavesPerRoot}` thành đầu vào của trần chung thay vì trần
riêng; D7 của `fgos-fanout` (cap 5) diễn đạt lại theo trần chung + luật
trọn-mẻ.

### Ca đáng chứng minh

- **Biên rỗng/biên trên:** 0 item đang chạy; đúng bằng trần; vượt trần một
  mẻ rồi acquire tiếp.
- **Hành vi cũ không được vỡ:** toàn bộ test `claimWork` hiện có; 129 test
  herdr-plugin; runner dispatch bình thường khi dưới trần.
- **Truy cập đồng thời:** hai launcher cùng xin slot cuối cùng — chỉ một
  được (cổng nằm trong `claimWork`, vốn đã chạy dưới main-checkout-lock).
- **Hỏng một phần:** một loop admin chết đột ngột — slot phải được thu
  hồi, không kẹt vĩnh viễn. Một pane herdr bị đóng tay giữa chừng.
- **Migrate:** workspace đang sống có tab `fg:operation` đúng 2 pane và
  tab `fg:agents-1` mang nhãn cũ.

## Assumptions

- **A1** — Liveness lane admin. *Chưa chứng minh, và bằng chứng ở
  validating đã lật thứ tự ưu tiên ban đầu.*

  Bản đầu của plan này ưu tiên "khuôn `runner.lock`". Validating tìm ra
  điều đó **không khớp hình dạng bài toán**: `runner.lock`
  (`loop.mjs:119`, `acquireRunnerLock:207`) là guard **singleton một tiến
  trình** — chỉ `fgos-runner` dùng, không ai khác — chứ không phải cơ chế
  N slot. Lane admin cần 3-4 slot độc lập (merge/retro/cleanup + dự
  phòng), mỗi cái liveness riêng; áp khuôn đó ra thành N file lock rời
  rạc là vụng.

  `sessions.json` (`session-identity.mjs:58`) ngược lại **đúng là một
  registry N entry mang pid** (`session.mjs:537`: `entry.pid` +
  `isPidAlive`), hiện đang rỗng `[]`. Hình dạng đó khớp "N slot admin"
  hơn hẳn.

  ⇒ T1 **mặc định dùng hình dạng registry**, tái dùng *kỹ thuật*
  pid-liveness của `runner.lock` (signal-0, thu hồi khi pid chết) bên
  trong nó — chứ không tái dùng chính file lock đó. Nếu T1 tìm được lý do
  ngược lại thì phải nêu bằng chứng, không mặc định quay về khuôn cũ.

  **BẪY LỚN NHẤT khi code T1: lock KHÔNG dùng được làm tín hiệu
  occupancy.** Không agent nào ôm lock suốt vòng đời của nó, dù chạy
  interactive hay headless. Agent chỉ ôm `main-checkout.lock` trong
  *khoảnh khắc* gọi engine (`pick`/`return`/`approve`) rồi nhả ngay
  (`releaseOnExit: true`); lúc nó ngồi sửa file hàng chục phút trong
  worktree riêng thì không giữ lock nào cả. Một agent đang làm việc thật
  sự là *vô hình* với mọi lock. Đó chính là lý do D2 chọn occupancy =
  state (`status: doing`) + tín hiệu hoạt động worktree của `tsk-3ni`.

  Cùng lý do đó cho thấy cổng trần trong `claimWork` đúng chỗ: nó chạy
  *dưới* `main-checkout.lock` nên hai launcher không thể cùng giành slot
  cuối — nhưng lock nhả ngay sau claim, nên occupancy *sau đó* buộc phải
  là derived state, không phải lock-held.

  **Ba lock đang tồn tại, đừng lẫn** (validating xác minh):
  - **`runner.lock`** (`loop.mjs:119`) — bảo vệ quyền *điều phối*, không
    phải quyền làm việc: chỉ `fgos-runner` giữ, suốt cả lượt `runOnce`
    (reap + discovery dispatch + drain), để hai runner không cùng
    reap/dispatch một repo (`loop.mjs:1079-1083`). Agent bị nó spawn ra
    **không** giữ lock này — agent không ra quyết định xếp việc.
  - **`main-checkout.lock`** (`main-checkout-lock.mjs:49`) — bảo vệ quyền
    *ghi vào main checkout*. Giữ bởi `claimWork` (`claim-port.mjs:98`),
    `merge.mjs:720`, `fgos unlock` (`fgos.mjs:4344`), **và git hook mỗi
    lần commit**. Ngắn, TTL 3 phút. Identity là `process.pid` *hoặc một
    chuỗi* — hook ghi chuỗi mỗi commit và không bao giờ release, TTL tự
    hết hạn là thiết kế chứ không phải bug.
  - **`EVENTS_LOCK_FILE`** (`state/events.mjs`) — khoá `events.jsonl`,
    chính là category `lock-timeout`.

  `main-checkout.lock` do **engine** giữ theo `process.pid`, bất kể lời
  gọi đến từ session tương tác hay headless — nên cổng trần trong
  `claimWork` nằm sẵn dưới nó, không cần tự lo đồng bộ.
- **A2** — Đặt cổng trong `claimWork` không làm hỏng đường claim nào hiện
  có. *Chưa chứng minh* — cần chạy thật toàn bộ test claim.
- **A3** — `fgos move --to doing` (bypass thủ công, RESEARCH F-A) chấp
  nhận để ngoài cổng ở đợt này. *Giả định có chủ ý*, ghi nhận là giới hạn
  đã biết.
- **A4** — Không có launcher thứ tư nào chưa biết đang dựng worker ngoài
  ba cái đã khảo sát.

## Supersede

- **`tsk-5lr` D2** — nhận diện trái/phải trong `fg:operation` bằng hình
  học (`x` nhỏ nhất = trái = merge-loop) bị thay bởi mô hình 4 pane. Cả
  "pinned assumption" của item đó (tab không đúng 2 pane là trạng thái
  lỗi) cũng hết hiệu lực.
- **Pinned term của `tsk-1q3`** — `fg:agents-N` đổi thành `fg:workers-N`.

Cả hai supersede theo đúng kỷ luật của `AGENTS.md`: quyết định cũ bị thay
thế và ghi rõ ở đây, không sửa tại chỗ trong record cũ.

## Ngoài phạm vi

Ranker toàn cục xuyên pool (D6 để lại có chủ ý); agent tự xử xung đột
merge (item riêng `tsk-60h`); gom câu hỏi để hỏi người một lần.

Doc-drift phát hiện kèm, không thuộc phạm vi item này: `AGENTS.md` trỏ
`src/setup/checks.mjs` như nơi đăng ký doctor check, nhưng file đó nay chỉ
là shim re-export — registry thật ở `src/setup/registrations.mjs`.

## Chia việc — 4 item con

Item này tách thành 4 item con thật, mỗi con mang `parent: tsk-2sj`, có
`--footprint` khai sẵn (để `footprintOverlapAmong` bắt được va chạm giữa
anh em trước khi ai bắt đầu), và `refs` trỏ về anchor riêng của nó trong
`DISCUSSION.md` §7.

| Con | Id | Phụ thuộc | Footprint | Verify |
|---|---|---|---|---|
| T1 sổ slot + cổng gác trần | `tsk-3dt` | — | `src/state/worker-slots.mjs`, `src/runner/claim-port.mjs`, `src/setup/registrations.mjs`, `test/state/worker-slots.test.mjs` | `node --test test/state/worker-slots.test.mjs && npm test` |
| T2 herdr-plugin dùng port | `tsk-1zq` | `tsk-3dt` | `herdr-plugin/src/{layout,main,pick,ports,pane_scan,app}.rs` | `cargo test … && cargo build --release … && ! grep -rq 'fg:agents-' herdr-plugin/src` |
| T3 helper đặt nhãn có gate | `tsk-3ac` | — | `plugins/fgOS/skills/terminal/{SKILL.md,rename.sh}`, `plugins/fgOS/skills/discover-next/SKILL.md`, `.claude/skills/fgos-coding-driving/SKILL.md` | `npm test && grep -q 'pane-labeling' … && ! grep -q 'Optional: rename the herdr pane' …` |
| T4 runner + fanout xin slot | `tsk-3jk` | `tsk-3dt` | `src/runner/loop.mjs`, `.claude/skills/fgos-fanout/SKILL.md` | `npm test && grep -q 'worker-slot' … && ! grep -q 'At most 5 Agents in flight at once' …` |

**Sửa lại một điểm của `DISCUSSION.md` §7:** ở đó T3 được ghi là phụ thuộc
T1 với lý do "cần binding để biết đặt nhãn gì". Sai — D5 chốt session TỰ
đặt nhãn bằng chính id nó đã biết, không cần đọc binding từ engine. Nên
T3 **độc lập**, chạy song song với T1 ngay từ đầu. Chỉ T2 và T4 mới thật
sự phụ thuộc T1 (T2 hỏi engine xin slot; T4 tiêu thụ mục config T1 đăng
ký). Deps trên item đã đặt theo bản sửa này, không theo §7.

Footprint bốn con rời nhau hoàn toàn — `registrations.mjs` do T1 giữ trọn
và T4 chỉ tiêu thụ, nên không có cặp nào chồng lấn.

Verify của T3 và T4 theo đúng khuôn `npm test && POSITIVE && NEGATIVE` mà
`docs/how-to/write-verify-for-a-skill-prose-change.md` bắt buộc cho mọi
thay đổi prose skill — vế positive chứng minh deliverable mới có thật, vế
negative chứng minh pattern cũ đã biến mất.

## Outstanding questions

None
