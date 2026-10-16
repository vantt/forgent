# Thiết kế nền bản 3 (r5, sửa theo kết quả đo trên Windows và macOS thật): holder-lock, terminal-control, agent-protocol và run supervisor

- Ngày: 2026-10-15, sửa r4 và r5 ngày 2026-10-16. Người viết: em (Lead, Claude Opus 5.5). Trạng thái: **thiết kế đề xuất, bản sửa r5** theo kết quả probe trên máy thật (GitHub Actions run `38855067175`, mục 12.10; [báo cáo probe](implementation-261016-1205-platform-probe-windows-macos.md)). r4 sửa sau phản biện kongming trên r3 (duyệt có điều kiện, [báo cáo](red-team-kongming-261016-1018-lock-and-run-supervisor-foundation-v3-r3-review.md)) và yêu cầu mới của anh: chạy tốt trên Linux, macOS và Windows. Trước đó: phản biện vòng 1 (kongming, gpt-6-astra, gemini-4-argon) và vòng 2 (gemini-4-argon; Astra vòng 2 hai lần không ra báo cáo; mục 14), chưa phải plan triển khai. Bản nháp gốc: [design-261015-2103-...-v3.md](design-261015-2103-lock-and-run-supervisor-foundation-v3.md) (commit `fb3b6113e`); bản r1: [design-261016-0122-...-v3-r1.md](design-261016-0122-lock-and-run-supervisor-foundation-v3-r1.md) (commit `ee05a4795`); bản r2: [design-261016-0933-...-v3-r2.md](design-261016-0933-lock-and-run-supervisor-foundation-v3-r2.md) (commit `9622bb642`); bản r3: [design-261016-1017-...-v3-r3.md](design-261016-1017-lock-and-run-supervisor-foundation-v3-r3.md) (commit `bf601456f`); bản r4: [design-261016-1107-...-v3-r4.md](design-261016-1107-lock-and-run-supervisor-foundation-v3-r4.md) (commit `b7c9a56cc`). Các quyết định của anh ghi trong brief là ràng buộc; bản này thiết kế quanh chúng.
- Gộp hai đầu việc: **4.1** (lock bản 3, sửa B1–B9 của [phản biện vòng 2](red-team-astra-round2-261015-1859-lock-and-identity-foundation-design-v2-review.md)) và **6.1** (run supervisor), cùng thiết kế component **6.5 terminal-control**. Thay [bản 2](design-261015-1814-lock-and-identity-foundation-lead-design-v2.md) ở phần lock; phần identity resolver (5.1) do lead riêng làm.
- Đầu vào: [kiểm kê lock](research-261015-1731-lock-inventory-and-standardization.md), [phản biện vòng 1](red-team-astra-261015-1812-lock-and-identity-foundation-design-review.md), [T8](spike-t8-261015-1841-controller-crash-during-herdr-and-cli-runs.md), [S2](spike-s2-261015-1818-reaper-fence-acceptance-tests.md), [S1](spike-s1-261015-1818-writer-id-consumer-inventory.md), [S6](spike-s6-261015-1638-rust-identity-call-latency-pre-commit-hook.md), [S7](spike-s7-261015-1859-human-opened-pane-identity-observation.md), [kết luận hội đồng](architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md) (mục 2, 3, 5, 6.2), đề xuất supervisor của panelist-1 (`.fgos/assignments/unit-run-1792051281308-0c298779/panelist-1/1/runs/01/outbox/report-1.md`), [research herdr gốc](research-261015-1116-herdr-tab-pane-layout-and-naming.md).
- Source đối chiếu tại HEAD `2c2114d06` (main, đã có bản vá IPC `7f1f4c2d2` và bản vá reaper gọn `6ce17f136`). W1' đọc trên nhánh `worktree-agent-a068b1ed9ad8afeb2` lúc viết nháp; sau đó đã vào main (`e8176287f`, `e27182da4`: thêm marker giao thức, checkpoint nhận writer từ caller). Probe tombstone chạy lại trên main sau W1': kết quả không đổi (12.5).
- Bằng chứng: probe đa process chạy thật trong thư mục tạm, không chạm `.fgos` thật (mục 12). Mã và kết quả nằm trong [bundle probe](design-261015-2103-lock-and-run-supervisor-foundation-v3-probes.json) và [bundle r1](design-261016-0122-lock-and-run-supervisor-foundation-v3-r1-probes.json).
- Component boundary: bản này **đổi** bản đồ component (thêm process-facts, holder-lock, terminal-control, agent-protocol, run supervisor). [component-boundary.md](../../docs/platform/component-boundary.md) chưa sửa; việc sửa nằm ở wave đầu tiên có code (mục 11, 4.2).

## 1. Tóm tắt

**Thay đổi lớn nhất so với bản 2: lock không còn là ledger trên đĩa, mà là lock của kernel.** Mỗi mutex/lease là một `flock` trên một *open file description* mà process giữ. Process chết thì kernel nhả. Không còn phán sống/chết, không TTL, không record cần dọn, không GC. Bốn phát hiện của vòng 2 (B1 GC, B3 khe spawn→bind, B7 mtime, B8 helper timeout) **biến mất do cách xây**, không phải nhờ thêm luật. Ledger chỉ còn ở run control (epoch để fencing), không GC, chỉ holder ghi.

Bản này quyết:

1. **Holder-lock** = một component, mọi lock là một *kind*: `mutex`, `lease`, `hot-mutex` (tạm), `beacon` (không phải lock). Mượn quyền = truyền đúng description cho đúng một process con lúc spawn. Không có khe nào để con chạy mà chưa giữ lock. **Luật description** (6.1.1): description lock luôn `CLOEXEC`, chỉ được truyền ở đúng một lời spawn có chủ đích; nó là ranh giới đúng/sai mới, thay cho "ai còn sống".
2. **Đường nóng** (`events.lock`, `claims.lock`) gộp thành **một** mutex nóng, chạy trong process Node tới khi use-case store sang Rust. Giữ fast path link/unlink hôm nay; chỉ việc dọn holder chết đi qua một kernel lock. Bất biến trong vùng găng nóng được viết thành luật đo được (6.6).
3. **Đổi phiên bản** theo hình dạng giao thức cũ: file lock → **tombstone** (thư mục; code cũ gặp `EISDIR`); thư mục ledger → **thế hệ chặn** (holder là PID 1). Quiescence **hai pha**: đặt hàng rào trước, bật v3 chỉ khi mọi process của release cũ đã thoát. Sàn phiên bản cưỡng chế từ 4.2 (6.8).
4. **Bốn component** một chiều: process-facts → holder-lock → terminal-control → agent-protocol → run supervisor → Execution Core. Session-identity là anh em của holder-lock, không ai cấp quyền lock theo writer id.
5. **terminal-control** là component nền thật: ghi đúng một thứ (attempt ↔ slot lúc cấp), mọi thứ khác đọc sống từ herdr/OS. Cổng trên theo attempt id, cổng dưới là driver có khai báo khả năng.
6. **Run supervisor**: một process cho mỗi attempt, là chủ attempt. Hai cách khởi động `direct` và `terminal`; sau khi khởi động, canh giống hệt. Không IPC với controller. Một **cổng chạy (gate)** là gốc process của agent: giữ lock attempt, cầm IO của agent, chạy agent trong **PID namespace** riêng để cái chết của gate kéo theo cả cây (kernel bảo đảm), có trần giờ cứng, ghi kết quả thoát. Supervisor chết thì agent vẫn xong việc và attempt vẫn được nhận kết quả, không trả tiền model lần hai. Lock attempt được giữ **trước** mọi side effect của attempt.
7. **Reaper gộp vào cửa adopt**: chỉ dọn khi lock attempt trống (kernel trả lời; lúc đó miền process đã rỗng). Writer và mọi reader/destructor của home chuyển cùng một đầu việc (6.2). Các trường pane/endpoint/binder của bản vá reaper tạm bị xoá.
8. **Settle khi controller chết**: supervisor chạy các bước "sau receipt" do Execution Core chuẩn bị sẵn (settle attempt, finalize home + trả credential, nhả slot), mỗi bước có receipt riêng. Supervisor cũng chết thì cửa **adopt** đi theo ma trận phục hồi, từ bằng chứng trên đĩa (9.7).
11. **Layout pane** đo từ trạng thái thật của driver và quyết bởi một **policy cắm được**; core giữ cơ chế (7.9).
12. **Đa nền tảng** (anh yêu cầu 2026-10-16): Linux làm trước, nhưng lõi không giả định Linux. Hai cổng trung lập với OS, mỗi OS một driver, mỗi driver khai báo **mức bảo đảm** và doctor báo mức đó: cổng lock (6.0) và cổng chứa process (5.3). Không còn câu "fail trên Windows": nền nào cũng chạy ở mức bảo đảm cao nhất mình có, và nói rõ mức đó. **Luật chung của cổng lock (r5):** lock trống chưa đủ; người acquire tiếp chỉ đi tiếp khi **miền process của holder trước đã rỗng** (6.0.1). Đo trên Windows thật cho thấy lock nhả trước khi job giết xong process.
9. **Rust-first thực tế**: helper lock là route Rust ngay từ 4.2; supervisor và gate là route nội bộ của host Rust (6.2); terminal-control và agent-protocol sang Rust ở 6.3/6.5. Node chỉ chuẩn bị và giao một envelope.
10. **Một state root**, đúng công thức `store.rs`; host Rust phân giải một lần và truyền xuống (6.9).

## 2. B1–B9 → trả lời → bằng chứng

| # | Phát hiện vòng 2 | Bản 3 trả lời | Ở đâu | Bằng chứng |
|---|---|---|---|---|
| B1 | Post-check chọn nhầm thế hệ cao nhất khi GC chen giữa LIST và READ | Mutex/lease không còn ledger, không GC. Run-control ledger giữ, **không GC**, chỉ holder của kernel lock ghi | 6.1, 6.7 | Kernel stress (12.1); P5b: lịch B1 trên ledger không GC → stale link `EEXIST` (12.6). Phương án ledger có GC theo "era" vẫn giữ làm phương án dự phòng có probe (Phụ lục B) |
| B2 | Hàng rào dựa trên lock v1; drain chỉ là ảnh chụp | Hàng rào theo hình dạng (tombstone cho file, thế hệ chặn cho ledger) + quiescence hai pha (hàng rào trước, bật sau khi code cũ chết hết) + sàn cưỡng chế từ 4.2; dispatch cwd chỉ sang phạm vi máy khi toàn máy qua quiescence | 6.8 | Tombstone với code v1 thật: `EISDIR` (12.5). Thế hệ chặn với `tryAcquireAccountLock` production: `held` (12.5). P6 và Astra `r3-cutover`: một lần quét không đủ, vì vậy có pha 2 |
| B3 | Git chạy trước khi grant được gắn; cha chết làm mất bảo vệ | Con nhận description lúc fork. Không có khe. Hook kiểm bằng kernel: đúng file + try-lock trên description kế thừa thành công | 6.4 | Git thật + hook thật, owner bị SIGKILL ngay sau spawn: hook là borrower, contender bị chặn suốt lúc git chạy, anh em cùng env bị từ chối, git commit xong, sau đó contender giành được (12.1 ca 5) |
| B4 | W1 mở cuộc đua checkpoint dưới merge-slot với land | W1' đã bọc checkpoint dưới slot bằng main mutex v1 (`a72d263bc`). v3 giữ: checkpoint **nhận handle**, không tự acquire | 6.10 | Commit W1'; luật handle ở 6.5 |
| B5 | Rank theo process phá dispatch song song và checkpoint lồng | Mỗi acquire là một description mới → hai transaction cùng process loại trừ nhau bằng kernel. Thứ tự kiểm theo `LockScope` truyền tường minh, không theo process. Checkpoint nhận handle | 6.5 | Cùng process hai description: lần hai `held`, đóng lần một thì lần hai được (12.1 ca 2) |
| B6 | Prime identity chưa đủ; `currentHead` exec trong `events.lock`; driver macOS spawn `ps` | Bất biến chính xác cho vùng găng nóng: ghi qua `stateTx` bị thu hồi lúc release, không subprocess (gác bọc `child_process` ở điểm vào), không chờ lock khác. Lấy trước lock: HEAD, gốc main checkout (`getMainFgosDir`), snapshot bằng chứng plan | 6.6 | Source: `currentHead` [`claim-port.mjs:318`](../../src/runner/claim-port.mjs); `getMainFgosDir` → `git rev-parse` ([`paths.mjs:77`](../../src/runner/paths.mjs)); `assertPlanEvidence` ([`store.mjs:601-622`](../../src/state/store.mjs)) |
| B7 | `mtime < boot` không phải bằng chứng chết | Không dùng mtime ở đâu cả. Kernel lock không cần phán chết. Nơi còn phán dùng boot id của kernel + startTime + trạng thái zombie; record thiếu pid hoặc hỏng = không rõ = giữ | 5.1, 6.6 | Probe: owner sống có mtime năm 2000 → `held`; record hỏng → `held` (Phụ lục B) |
| B8 | Inspect sau timeout không đóng được acquire đang chạy | Lock thuộc description của Node, không thuộc helper. Timeout → SIGKILL + reap helper (spawnSync đảm bảo) → đóng fd → chắc chắn không giữ. Không có trạng thái "pending" | 6.3 | Timeout 300 ms → `timeout`, đóng fd, không giữ gì (12.1 ca 4) |
| B9 | Công thức `FGOS_STATE_HOME` lệch `store.rs` | `stateRoot` = đúng công thức `store.rs` (biến `FGOS_STATE_HOME` dùng nguyên giá trị); `lockRoot = stateRoot/locks`. Host Rust phân giải một lần, truyền `FGOS_STATE_ROOT`; dispatch ghim cho process con | 6.9 | Source: [`store.rs:59-75`](../../packages/distribution/rust/src/store.rs) |

Trạng thái A1–A14 của vòng 2 vẫn đúng như bảng đầu báo cáo vòng 2; bản 3 không mở lại A5, A7, A11, A12, A14 (đã đóng). A1, A3, A4, A8, A9 đóng hẳn nhờ kernel lock (mục 6). A2, A13 đóng qua 6.8. A6, A10 qua 6.5, 6.6, 6.10.

## 3. Giữ nguyên từ bản 2

- Quyền lock không bao giờ đến từ writer identity. Writer id bằng nhau không cấp gì.
- Beacon tách khỏi mutex, chỉ hook đọc; W1' đã land đúng bảng beacon của bản 2 (8.5).
- Không bao giờ cướp lock của holder còn sống. Holder sống mà treo: chỉ có đường dừng holder, có xác nhận của người (6.7).
- "Không rõ" = giữ. Bây giờ chỉ còn ở hai chỗ: fast path nóng tạm thời, và nền tảng thiếu kernel lock (6.1).
- Ledger bất biến của run control ([`run-lock.mjs`](../../src/runner/dispatch/run-lock.mjs)) với `settleRunControl` là receiver fencing thật duy nhất.
- Kiểm trần worker trong cùng vùng găng nóng, ngay trước `acquireClaim` (bản 2 mục 9.1; vòng 2 xác nhận bằng probe).
- Mutex `worktree-admin` quanh `git worktree add`, ngoài main mutex (bản 2 mục 8.6).
- Phạm vi bảo đảm của main checkout: raw git ngoài fgOS không bị loại trừ; mọi writer **của fgOS** đi qua main mutex (khuyến nghị vòng 2 câu 3, mặc định của anh).
- Owner claim = writer id lúc acquire, delegation theo `claimId + attempt` (bản 2 mục 9.2).

## 4. Phân tầng và thẩm quyền

### 4.1 Sơ đồ

```text
L5  Execution Core (bind, dispatch, workflow runner, fgos run, cửa adopt)        Node hôm nay
       |  giữ lock attempt trước side effect, cấp slot, chuẩn bị envelope, giao attempt, settle unit
L4  run supervisor + launch gate (route nội bộ của host Rust)                    Rust (6.2)
       |                    |                         |
L3  agent-protocol (thuần, cổng IO riêng)                                         Rust (6.3)
L2  terminal-control (core + policy layout + driver)  |  confinement (prepare/finalize)   Rust (6.5) | Node sau cửa
L1  holder-lock                      session-identity (5.1 resolver, mint id)     Rust crate + facade Node
L0  process-facts (đọc)  |  process-control primitive (spawn ánh xạ fd, pidfd,    Rust; leaf đọc Node giữ cho đường nóng
                             subreaper, PDEATHSIG, PID namespace, tty)
    ---------------------------- kernel / OS / herdr / git / bwrap ------------------------
```

Luật: chỉ gọi xuống. Không tầng dưới nào import tầng trên. Supervisor chạy "bước sau receipt" do L5 chuẩn bị (9.6): đó là lệnh mờ trong envelope (đảo phụ thuộc theo kiểu cổng), supervisor không biết nó làm gì.

Agent-protocol không phụ thuộc terminal-control. Nó khai báo một cổng IO nhỏ (`send`, `read`, `activity`). Supervisor nối cổng đó vào terminal-control (cách `terminal`) hoặc vào pipe của chính nó (cách `direct`). Nhờ vậy agent-protocol thuần logic, test bằng fixture màn hình.

### 4.2 Bảng thẩm quyền

| Component | Quyết định duy nhất / ghi | Không bao giờ | Phụ thuộc | Hôm nay → đích |
|---|---|---|---|---|
| process-facts (L0 đọc) | Sống/chết/không rõ của một tuple `{host, bootId, pidNs, pid, startTime}` | Spawn, kill, đọc mtime | OS | [`process-identity.mjs`](../../src/runner/dispatch/process-identity.mjs) → crate `fgos-process` mô-đun `facts` |
| process-control (L0) | Gate (gốc process của agent), gửi signal sau khi kiểm identity (pidfd trên Linux), subreaper | Biết run, lock, pane | facts | Rải trong `detached-run-supervisor.mjs`, `herdr-round.mjs` → crate `fgos-process` mô-đun `control` |
| holder-lock (L1) | Ai giữ tài nguyên nào (kernel); thứ tự lock trong một scope; luật description | Đọc writer identity; giành từ holder sống | L0, kernel | 11+ lock tự cài → crate `fgos-holder-lock` + facade Node |
| session-identity (L1) | Writer id + nguồn; hàm mint id cho attempt | Cấp quyền lock hay claim | L0 | Node resolver → crate `fgos-session-identity` (5.1, lead riêng) |
| terminal-control (L2) | Map attempt ↔ slot (ghi lúc cấp); luật gom tab, tách pane; nhãn hiển thị | Biết run, deadline, receipt, work item; đọc nhãn để quyết định | L0, driver herdr/tmux | `createBatchTab`, `batchTabFor`, phần pane trong `herdr-round.mjs` → `packages/terminal-control`, crate `fgos-terminal-control` |
| confinement (L2) | Chuẩn bị/attest sandbox; finalize home + trả credential | Chấm kết quả; chọn provider | L0, L1 (lock account) | Node ([`confinement/`](../../src/runner/dispatch/confinement/)); đi sau một cửa |
| agent-protocol (L3) | Với một CLI × cách khởi động: sẵn sàng chưa, gửi brief, brief đã nhận chưa, xong chưa, cần người không | Mở tab, chọn model, đổi timeout, quyết retry | cổng IO riêng | `awaitPromptReady`, `deliverBrief`, `confirmBriefSubmitted`, regex paste-chip trong `herdr-round.mjs`; args headless trong `transport.mjs` → `packages/agent-protocol`, crate `fgos-agent-protocol` |
| run supervisor (L4) | Chủ attempt: lock attempt, lease, run control, home, deadline mềm, heartbeat, capture, receipt, mint writer id (5.2), scrub env | Biết pane; chọn provider; retry; chấm claim | L0–L3 | `detached-run-supervisor.mjs` (cli) + vòng poll trong `herdr-round.mjs` → route `fgos internal supervise` |
| launch gate (L4, nửa trong pane) | Gốc process của agent; trần giờ cứng; ghi `gate-exit` một lần | Gửi brief, đọc màn hình | L0 | Chưa có → route `fgos internal gate` |
| Execution Core (L5) | Bind; cấp slot; chuẩn bị envelope + bước sau receipt; settle unit; adopt/resume | Canh process agent | L1–L4 | `run.mjs`, `assignment-runner.mjs`, `transport.mjs` |
| BoundInvocationSupervisor | Một lời gọi provider RPC ngắn, sống cùng caller | Sống qua caller | L0 | Giữ riêng ([`bound_invocation_supervisor.rs`](../../packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs)); chỉ dùng chung primitive L0 |

## 5. L0: process facts và process control

### 5.1 Facts

API: `judge(tuple) → alive | dead | unknown`. Tuple chuẩn hoá: `{host, bootId, pidNs, pid, startTime}`. Adapter đọc record cũ (`processStartTime`).

| Sự kiện | Kết quả |
|---|---|
| Host khác, hoặc pidNs khác | unknown |
| Cùng host, bootId ghi khác bootId kernel hiện tại | dead |
| Không có pid trong record (record thiếu, hỏng) | unknown (hôm nay `process-identity.mjs:60` trả `dead`: sai hướng, gemini R3-3) |
| pid không tồn tại (ESRCH) | dead |
| pid tồn tại nhưng ở trạng thái zombie/dead (`Z`/`X` trong `/proc/<pid>/stat`) | dead (`kill(pid,0)` vẫn thành công với zombie; gemini R3-3) |
| pid tồn tại, startTime khớp | alive |
| pid tồn tại, startTime khác | dead (pid tái dùng) |
| Không đọc được startTime (thiếu driver, quyền, timeout) | unknown |

**Process trong PID namespace của attempt** (R4-1 vòng 2): pid bên trong namespace không có nghĩa với process ngoài, và ngược lại. Gate đặt env `FGOS_PIDNS_ANCHOR` = tuple host của chính gate cho mọi process trong namespace. Record do process trong namespace ghi mang `{pidNs, pid, startTime, anchor}`. Luật phán thêm:

| Sự kiện | Kết quả |
|---|---|
| pidNs của record khác pidNs của người phán, record có `anchor`, anchor **chết** | dead (init namespace chết thì kernel đã giết cả namespace) |
| pidNs khác, anchor sống hoặc không có anchor | unknown → giữ (không bao giờ phán chết một holder mình không nhìn thấy) |
| Người phán **không** ở init PID namespace, record **thiếu** `pidNs` (record cũ `{pid, startTime}`) | unknown → giữ (kongming N4: agent trong sandbox chạy `fgos` không được dọn record của holder host). Record nóng có `pidNs` ngay từ 4.3 |

Hệ quả: holder trong attempt chết khi đang giữ lock nóng thì lock giữ tới khi attempt kết thúc (bị chặn trên bởi trần cứng), không kẹt vĩnh viễn; process trong namespace không bao giờ cướp lock của process host (lịch "cấu hình C" của Argon).

Nguồn boot id có thẩm quyền: Linux `/proc/sys/kernel/random/boot_id`; macOS `sysctl kern.bootsessionuuid`; Windows không có boot id, dùng creation time của process (FILETIME, không trùng khi pid tái dùng). Không bao giờ suy boot từ đồng hồ trừ uptime, không bao giờ dùng mtime (B7).

Leaf đọc không spawn. Driver macOS ở Node không gọi `ps`; thiếu startTime thì `unknown`. Bây giờ facts gần như không còn trên đường quyết định lock (kernel lo); nó còn dùng cho: binding supervisor/gate, fast path nóng tạm thời, hiển thị.

### 5.2 Control

- **Gửi signal theo identity:** Linux dùng `pidfd_open` → kiểm startTime → `pidfd_send_signal`, không có khe tái dùng pid. Nền khác: kiểm tuple ngay trước `kill`, khe còn lại được ghi rõ.
- **Primitive cho gate** (gate là thành phần L4, 9.3): spawn với ánh xạ fd tường minh, `PR_SET_CHILD_SUBREAPER`, `PR_SET_PDEATHSIG` + kiểm lại cha, chạy trong PID namespace mới (qua bwrap), đặt foreground group của tty. L0 không biết attempt, envelope hay lock.
- Reconcile vẫn chỉ được import mô-đun `facts` (luật import-graph hiện có, [`process-identity.mjs:1-8`](../../src/runner/dispatch/process-identity.mjs)).

### 5.3 Cổng chứa process (containment) — trung lập với OS

Supervisor (9.3) không gọi bwrap, Job Object hay process group trực tiếp; nó gọi một cổng. Mỗi OS một driver.

| Thao tác | Ý nghĩa |
|---|---|
| `create(attemptId) → domain` | Tạo miền chứa cho attempt; trả `domain` có danh tính để adopt kiểm sau này |
| `spawn_in(domain, spec) → identity` | Chạy gate (và từ đó agent) bên trong miền |
| `is_empty(domain) → empty \| not-empty \| unknown` | "Còn process nào của attempt không?" — trạng thái thật của OS |
| `kill_all(domain, grace)` | Kết thúc mọi process trong miền |
| `guarantee() → kernel \| best-effort` kèm danh sách đường thoát | Doctor in ra; mỗi attempt ghi mức đã dùng vào binding |

| Driver | Cơ chế | `is_empty` | Mức | Đường thoát nói thẳng |
|---|---|---|---|---|
| Linux `bwrap-pidns` | `bwrap --unshare-pid --as-pid-1 --proc /proc`; gate là pid 1 của namespace | `judge(gate) == dead` theo tuple host của gate (bwrap `--info-fd` trả child pid host). Kernel giết và reap xong mọi task của namespace trước khi init thành zombie, nên gate chết ⇔ namespace rỗng (kongming N3) | kernel | Process do daemon ngoài namespace tạo theo yêu cầu của agent (herdr, systemd, docker) |
| Windows `job-object` | Job Object **có tên** (tên chứa attempt id + token), `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`, không cho breakaway; supervisor tạo job, đưa gate vào job, gate cũng giữ một handle của job | `OpenJobObject` theo tên thất bại (job đã huỷ) **hoặc** `QueryInformationJobObject` → `ActiveProcesses == 0`. Đo: đóng job thì con, cháu, con `DETACHED_PROCESS` đều chết sau 4,0 ms; breakaway bị từ chối; `ActiveProcesses` về 0 sau 2,0 ms (12.10). Việc giết là **bất đồng bộ**, nên luật 6.0.1 bắt buộc | kernel | Process do service/COM ngoài job tạo; process tự tạo với `CREATE_BREAKAWAY_FROM_JOB` bị chặn vì job không cho breakaway |
| macOS `pgroup-tree` | Process group + session riêng cho agent; khi cần kết thúc: `killpg` + quét cây con cháu (`proc_listchildpids`) | Không còn process trong pgid và trong cây đã quét. Đo trên macOS 26.6 arm64: `killpg` kết thúc cả group; quét cây + `kill_all` tìm và kết thúc đủ cây 40 process (12.10) | **best-effort** (đã đo) | Process `setsid` + fork hai lần bị nhận nuôi bởi `launchd` rời khỏi cây — **đã đo: sống sót qua kill group** (12.10); dịch vụ launchd/XPC. Trên macOS, "lock trống" **không** chứng minh không còn writer; adopt chờ thêm một khoảng và quét lại, attempt ghi mức `best-effort` |

Linux là driver làm trước (6.2). Spike X1 (Windows) và X2 (macOS) đã chạy trên máy thật (12.10): cơ chế Job Object và process group/quét cây đúng như mô tả; driver Windows và macOS viết sau Linux theo kết quả đó. Chính sách chung: chạy ở mức cao nhất nền đó có; doctor `process-containment` báo mức; `fgos run --json` và `inspect` ghi mức của từng attempt. Không nền nào bị từ chối chỉ vì mức là `best-effort`; mức đó được nói ra.

## 6. Holder-lock v3

### 6.1 Primitive: kernel lock trên open file description

Mỗi tài nguyên có một file `<lockDir>/<name>.lock` (tạo một lần, không bao giờ xoá khi tài nguyên còn). Acquire = mở file thành một description mới, rồi `flock(LOCK_EX)` trên description đó. Release = đóng mọi bản sao của description. Kernel nhả khi mọi process giữ description đã chết.

| Tính chất | Hệ quả |
|---|---|
| Lock thuộc **description**, không thuộc pid | Không tái dùng pid, không boot, không startTime trong quyết định |
| Process chết → kernel đóng fd → nhả | Không TTL, không phán chết, không record cần dọn, không GC (B1, B7 hết) |
| Hai `open()` trong cùng process là hai description, xung đột nhau | Hai transaction cùng process loại trừ nhau; không có re-entry theo pid (B5) |
| Description truyền cho con lúc spawn → con cùng giữ | Mượn quyền không có khe spawn→bind (B3, A4) |
| Kernel trả lời "có ai giữ không" bằng try-lock | Adopt chỉ cần một `probe` (9.7) |
| Không biết ai giữ | Không ghi record hiển thị (một writer thứ hai có độ cũ riêng). Linux: quét `/proc/*/fdinfo/*` tìm dòng `lock:` trên inode của file lock → danh sách đúng mọi process đang giữ. Nền khác: `held (không liệt kê được holder)` |

### 6.0 Cổng lock — trung lập với OS

Mọi caller (Node facade, crate Rust, hook) dùng một cổng; mỗi OS một driver.

| Thao tác | Ý nghĩa |
|---|---|
| `acquire(resource, mode: EX\|SH, wait) → handle \| held \| unknown` | Giữ lock |
| `release(handle)` | Nhả (POSIX: đóng description; Windows: kết thúc process giữ lock) |
| `run_borrowed(handle, spec) → exit` | **Cách duy nhất** để cho một lệnh con (git commit của checkpoint/merge) đi qua với quyền của holder. Caller không bao giờ tự truyền fd hay handle |
| `probe(resource) → free \| held` | Thử `SH` không chờ, không cản người khác (dùng cho quét adopt, kongming N6) |
| `holders(resource) → list \| unlistable` | Chẩn đoán cho doctor `lock-holders` |
| `guarantee()` | `{exclusion, borrow, holders}`; doctor `lock-kernel-semantics` in ra |

| Driver | Loại trừ | Mượn (`run_borrowed`) | Holder liệt kê được | Ghi chú |
|---|---|---|---|---|
| Linux `flock` (fs cục bộ) | kernel, theo description (đo, 12.1) | kernel: description truyền cho đúng một con lúc spawn (6.4); hook kiểm bằng try-lock trên description kế thừa | có (fdinfo) | Làm trước |
| macOS `flock` | kernel (BSD flock, cùng ngữ nghĩa description) | kernel, như Linux | không (`unlistable`) | Spike X2 đo trước khi bật |
| Windows `lockfileex` | kernel, **cộng luật 6.0.1**. `LockFileEx` gắn với **process khoá**, không chia sẻ qua kế thừa như description POSIX (đo: con giữ handle kế thừa **không** giữ được lock khi process khoá chết; lock nhả 0,1 ms sau `TerminateProcess`). Node không gọi được `LockFileEx` (không addon), nên driver chạy một **process giữ lock** (helper Rust) cho mỗi lock: helper lock file, chờ trên handle của process cha và trên stdin; cha chết hoặc đóng stdin → helper thoát → kernel nhả lock. Trong attempt, helper chạy **bên trong job của attempt** (5.3), nên lock sống đúng bằng đời job | **Chạy lệnh bên trong job của process giữ lock**: `run_borrowed` nhờ helper tạo lệnh con (git) trong job `KILL_ON_JOB_CLOSE` của chính helper. Helper chết → job đóng → git chết. **Nhưng** lock nhả trước khi job giết xong (đo: 0,2 ms so với 3,9 ms), nên loại trừ chỉ đúng nhờ luật 6.0.1: người acquire tiếp chờ job của holder trước rỗng (tương đương B3 chỉ khi có luật này). Hook nhận ra borrower bằng token một lần do helper cấp + kiểm chuỗi tổ tiên (Toolhelp) có helper; mức `kernel (job-scoped)` cho loại trừ, kiểm của hook là `token+ancestry` | có (helper tự báo) | X1 đã đo (12.10): helper thoát cùng cha sau 2,9 ms, lock trống sau 3,0 ms; chuỗi tổ tiên Toolhelp đủ, snapshot 2,6 ms |
| NFS/SMB | không bảo đảm | — | — | Driver từ chối với lỗi có tên; doctor báo `none` |

#### 6.0.1 Luật "miền của holder trước phải rỗng" (r5, từ đo Windows)

**Đã đo trên Windows thật** (`git-borrow-blocking-hook`, 12.10): holder giữ `LockFileEx` và chạy `git commit` trong job `KILL_ON_JOB_CLOSE` của chính nó; git bị chặn trong hook; giết holder. Lock thấy **trống sau 0,2 ms**, nhưng mọi process trong job **chỉ chết hết sau 3,9 ms**. Lock thuộc process giữ nó nên nhả ngay khi process đó chết; job giết process của nó **bất đồng bộ**. Có một khe vài ms mà writer khác lấy được lock trong khi git có thể còn ghi. Câu của r4 "không có cảnh lock trống mà git còn ghi" **sai trên Windows**. (Linux/macOS không có khe này ở đường mượn, vì git tự giữ bản sao description: probe `git-borrow-*` trên cả hai đều pass.) Cùng dạng với khe "gate bị SIGKILL" trên Linux (9.3 điểm 7).

**Luật ở mức cổng:** `acquire` chỉ trả `handle` khi **cả hai** đúng: (1) giữ được lock của kernel; (2) **miền process mà holder trước đã khai** là rỗng theo cổng chứa (5.3 `is_empty`). Không có điều (2) thì lock trống chưa phải bằng chứng.

Cơ chế, đơn giản nhất mà đúng:

1. Holder nào tạo miền con khi giữ lock (Windows: job cho `run_borrowed`; attempt: job/namespace của attempt) ghi **ngay sau khi acquire, trước khi tạo miền**, một record `predecessor.json` cạnh file lock: `{domainKind, domainId}` (Windows: tên job, chứa token duy nhất; Linux: tuple host của gate). Ghi khi đang giữ lock, nên không ai đọc lúc đang ghi.
2. Người acquire tiếp, **sau khi đã giữ lock của kernel**, đọc `predecessor.json` và hỏi `is_empty(domainId)`:
   - Windows: `OpenJobObject(tên)` thất bại → job đã huỷ → rỗng. Mở được → chờ `ActiveProcesses == 0` (đăng ký completion port nhận `JOB_OBJECT_MSG_ACTIVE_PROCESS_ZERO`, hoặc hỏi lặp mỗi 1 ms).
   - Linux: `judge(gate) == dead` (đã có, 9.3 điểm 7).
   - macOS: quét cây đã ghi; mức `best-effort`.
   - Không có record (holder trước không tạo miền) → không chờ.
3. Chờ có hạn `lock.predecessorDrainMs` (cấu hình, mặc định 2000 ms; đo thực tế là vài ms). Quá hạn mà vẫn còn process: holder trước đã chết (ta đang giữ lock), nên ta được `kill_all(domain)` (Windows `TerminateJobObject`) rồi chờ tiếp một hạn nữa. Vẫn không rỗng → nhả lock, trả `held (predecessor-domain-not-empty)` có tên; doctor hiện miền đó.
4. Sau khi miền trước rỗng, holder mới ghi đè `predecessor.json` theo bước 1 nếu chính nó sẽ tạo miền.

**Chi phí:** một lần ghi file nhỏ cho mỗi acquire **có tạo miền** (checkpoint/merge mượn cho git, attempt); một lần đọc + `OpenJobObject`/query (vài chục µs) cho mỗi acquire trên Windows; chỉ khi holder trước chết bất thường mới phải chờ vài ms. Đường nóng tạm thời (6.6) không tạo miền nên không đổi. Adopt (9.7) dùng đúng luật này thay cho "lock trống" một mình, trên mọi nền.

**Probe chứng minh** (đề nghị team lead thêm vào `tools/platform-probe` rồi chạy lại):
- `git-borrow-blocking-hook-predecessor-check` (Windows): như `git-borrow-blocking-hook`, nhưng contender sau khi lấy `LockFileEx` còn chạy bước 2 rồi mới ghi thời điểm "được đi tiếp". Lặp 50 lần. Khẳng định: thời điểm được đi tiếp **luôn ≥** thời điểm process cuối trong job chết (0 vi phạm); ghi phân bố thời gian chờ thêm.
- `predecessor-record-stale` (Windows): record trỏ tới một job đã đóng từ trước → `OpenJobObject` thất bại → đi tiếp ngay (đo độ trễ thêm).
- `predecessor-drain-timeout` (Windows): job trước có process không chết (giữ handle job ở process ngoài) → sau `predecessorDrainMs` contender `TerminateJobObject` rồi đi tiếp, hoặc trả `held` có tên.
- Cùng ba ca cho Linux/macOS với miền tương ứng (đối chứng).

Cổng giấu khác biệt: caller chỉ thấy `acquire/release/run_borrowed`. Chỗ duy nhất biết "fd" hay "job" là driver. Đường nóng tạm thời (6.6) không dùng cổng này cho fast path; nó chỉ dùng cổng cho lock `state.reclaim`.

### 6.1.1 Luật description (bắt buộc, có test)

Ranh giới đúng/sai đã dời từ "ai còn sống" sang "ai đang có một bản sao description". Vì vậy:

1. Description lock **luôn** `FD_CLOEXEC`. Khoảnh khắc duy nhất nó không `CLOEXEC` là bên trong đúng một lời spawn mượn nó, bằng ánh xạ fd tường minh (Node: slot `stdio`; Rust: `pre_exec` + `dup2`).
2. Bên nhận (fd 3 kế thừa, hoặc `SCM_RIGHTS` với `MSG_CMSG_CLOEXEC`) đặt `FD_CLOEXEC` trước mọi syscall khác.
3. Lý do có bằng chứng: Node `fs.openSync` mở với `O_CLOEXEC`, nhưng Rust `std::process::Command` **kế thừa** fd ≥ 3 không `CLOEXEC` mà nó nhận được (kongming F1, F3). Probe Python của bản nháp chỉ đúng vì Python che lỗi này (`set_inheritable(False)`, `recv_fds`, `close_fds=True`).
4. Test bắt buộc trước writer đầu tiên của mỗi route Rust nhận description (helper, supervisor, gate): sau khi agent chạy, quét `/proc/<agent>/fd` và một cháu; inode lock **không** được có mặt.
5. Doctor `lock-holders` (quét fdinfo) báo mọi holder không phải process fgOS, để vi phạm luật lộ ra ngay. Process monitor của bwrap (ngoài namespace, có bản sao description vì bwrap không đóng fd trước clone) mà cha là supervisor/gate của một attempt đang giữ lock được coi là thành viên, không phải holder lạ (kongming N1).
6. Sau acquire, kiểm `fstat(fd).ino == stat(path).ino`; khác thì đóng và thử lại. Nhờ vậy file lock được phép xoá an toàn khi tài nguyên hết đời (lock attempt nằm trong thư mục run, xoá cùng run).
7. Mở file lock bằng `O_RDWR` (NFSv4/BSD từ chối lock độc quyền trên fd chỉ đọc; gemini R3-1).
8. **Mượn là quyền mạnh, chỉ được đóng:** bất kỳ bản sao nào gọi `LOCK_UN` cũng nhả lock chung (Astra R3-9, đo). Hợp đồng: owner và borrower chỉ `close`, không bao giờ `LOCK_UN`; không dùng guard thư viện tự `LOCK_UN` khi drop. Fd mượn có thể bị shell/hook chuyển tiếp cho process nền (Astra đo qua shell alias tạo `sleep` nền; kongming đo `git gc --auto`): API mượn tắt gc tự động của git, hook không được chạy nền, và doctor `lock-holders` lộ mọi rò rỉ còn lại. **Vector test bắt buộc** cho mượn: git → shell alias tạo process nền; git → filter clean/smudge; git → hook tạo process nền; `gc.auto=1` + object rời. Mỗi vector khẳng định lock trống ngay khi git và owner đã đóng. **Không có chế độ "tắt mượn" lúc chạy** (kongming M4: đường đó tự chặn commit của chính fgOS và bật sau mỗi release). Thay bằng check doctor `lock-borrow-vectors`: repo tạm, chạy đủ bốn vector trên (< 1 s), chạy ở `fgctl activate` và ở doctor. **Đỏ = doctor FAIL** và activate từ chối. Một đường commit, một hook.

### 6.1.2 Ma trận khả năng và mức bảo đảm (R3-12 vòng 1, yêu cầu đa nền tảng)

Mỗi khả năng có probe riêng. Thiếu khả năng mà carrier cần → dùng mức thấp hơn nếu có và **báo mức đó**; chỉ từ chối khi không có mức nào đúng nghĩa (ví dụ lock trên fs mạng). Không bao giờ lùi về TTL.

| Khả năng | Linux | macOS | Windows | NFS/SMB |
|---|---|---|---|---|
| Loại trừ (cổng lock 6.0) | kernel (đo) | kernel (đo, macOS 26.6) | kernel qua process giữ lock + luật 6.0.1 (đo) | none → từ chối có tên |
| Mượn cho git (`run_borrowed`) | kernel fd (đo) | kernel fd (đo: không lúc nào lock trống khi git/con còn sống) | job của holder + token/tổ tiên + luật 6.0.1 (thiếu luật thì **đo thấy 1 vi phạm**) | — |
| Chứa process (cổng 5.3) | kernel: PID namespace khi có user namespace (đo, 12.7); không có user namespace → best-effort process group | best-effort (đo: kẻ thoát `setsid`+fork đôi sống sót; cây thường bị quét và kết thúc đủ) | kernel: Job Object (đo), giết bất đồng bộ nên kèm luật 6.0.1 | — |
| Gate trong pane nhận lock (`terminal`) | `SCM_RIGHTS` (đo) | `SCM_RIGHTS` (đo: lock còn ở người nhận khi người gửi chết) | phụ thuộc herdr hỗ trợ Windows (máy probe: herdr không có trên PATH); chưa có thì cách `terminal` báo `unsupported`, cách `direct` vẫn chạy | — |
| Foreground tty | `tcsetpgrp` trong namespace | `tcsetpgrp` | console API (theo herdr) | — |
| Xác thực peer của socket attempt | uid (`SO_PEERCRED`) + `attemptId`/digest trong GO | uid (`LOCAL_PEERCRED`) + `attemptId` | named pipe ACL theo SID + `attemptId` | — |

Doctor có ba check báo mức: `lock-kernel-semantics`, `process-containment`, `lock-borrow-vectors`. Mỗi attempt ghi mức chứa và mức lock đã dùng.

### 6.2 Các kind

| Kind | Cơ chế | Dùng cho (lock hôm nay) | Phạm vi |
|---|---|---|---|
| `mutex` | kernel lock, giữ ngắn | main checkout, `worktree-admin`, merge slot, sessions, advance, reconcile, recovery, observe shard, activation, install, account provider | repo hoặc máy |
| `lease` | kernel lock, giữ suốt việc dài; có thể truyền cho gate | dispatch cwd, runner, gateway, full-suite, attempt (file nằm trong thư mục run: `runs/NN/attempt.lock`) | repo, máy hoặc run |
| `hot-mutex` (tạm) | Node trong process: link/unlink + dọn holder chết dưới kernel lock | `events.lock` (đã gộp `claims.lock`) | repo |
| `beacon` | không phải lock | `main-checkout-activity.json` (W1') | repo |
| `terminal-placement` (hoãn) | kernel lock phạm vi máy/herdr-session | chỉ khi S5 bắn (7.6) | máy |

Run control **không** thành kind mới (KISS, theo kongming 12): giữ nguyên ledger + CAS của [`run-lock.mjs`](../../src/runner/dispatch/run-lock.mjs), không GC. Loại trừ thật của attempt do lock attempt (kernel) lo; epoch chỉ còn vai receiver của `settleRunControl`. Vì không GC nên B1 không áp được (P5b, 12.6).

### 6.3 Facade Node và helper Rust

Node không có `flock` (không addon). Cách làm, đã đo (12.1):

1. Node `open()` file lock → fd (Node giữ description).
2. Node gọi helper Rust `fgos internal lock-fd --try|--wait-ms N` với fd đó ở stdio slot 3. Helper `flock` description kế thừa rồi thoát. Lock ở lại với fd của Node.
3. Release = `close(fd)`.
4. Kiểm inode sau acquire (6.1.1 điểm 6).

Đúng năm điều kiện S6: route native, exec thẳng binary từ `FGOS_HOST_BIN`/activation resolve một lần mỗi process, không qua shim, không exec trong vùng găng nóng, lệch phiên bản thì fail-closed. Chi phí đo với `flock` của util-linux làm vật thế chỗ: p50 1,35 ms, p95 1,58 ms. Helper Rust dự kiến ~3 ms theo S6. Chỉ đường lạnh dùng.

**Timeout (B8):** chờ bằng `spawnSync` với `killSignal: 'SIGKILL'`. Khi `spawnSync` trả về, helper đã chết và đã được reap. Node đóng fd. Kết quả là `not-acquired`, chắc chắn: nếu helper kịp lock trước khi bị giết, đóng fd đã nhả. Không có trạng thái treo. Chờ lâu không chặn event loop: dùng `--try` lặp bất đồng bộ, không `--wait` đồng bộ trong process runner.

**Owner khi gọi qua helper (A9):** owner là description, mà description thuộc caller. Helper không bao giờ là owner. Không cần `--owner-pid`, `getppid()` hay token sinh trước.

Rust gọi `flock` trực tiếp trong process (crate). Rust và Node lock **cùng file**, cùng primitive, nên loại trừ nhau ngay, không cần giai đoạn "hai giao thức" (bản 2 mục 12).

### 6.4 Mượn quyền (B3, A4)

Mục đích: cho `git commit` của checkpoint/merge (có hook bên trong) đi qua mà không bị coi là người lạ. Thay `FGOS_MAIN_LOCK_HOLDER_PID`.

1. Holder spawn git với description của main mutex ở một stdio slot (ví dụ 3), env `FGOS_LOCK_FD=main:3`. Chỉ facade holder-lock được ánh xạ fd lock vào stdio (luật 6.1.1). API mượn **luôn** thêm `-c gc.auto=0 -c maintenance.auto=false`: git 2.34 tự chạy `gc --auto` dạng daemon, nó kế thừa fd 3 và giữ main mutex sau khi commit đã trả về (kongming F2: còn giữ sau khi holder đóng fd; với `gc.auto=0` thì không). Hook của git kế thừa description nên không được chạy nền bất cứ thứ gì.
2. Hook chỉ tự coi là borrower khi đủ ba điều: env `FGOS_LOCK_FD` chỉ đúng slot; `fstat(slot)` cùng `dev:ino` với file lock; `flock(slot, LOCK_EX|LOCK_NB)` thành công. Process anh em có cùng env nhưng tự mở file → try-lock thất bại → bị từ chối. Thiếu một điều → hook tự thử lock một lần bằng description mới của chính nó, không bao giờ xưng borrower. (Lỗ nhỏ kongming chỉ ra: NB trên description kế thừa cũng thành công nếu không ai giữ; chỉ xảy ra khi API truyền một description chưa lock, tức lỗi lập trình; API chỉ truyền description sau khi acquire.)
3. Không có khe: con giữ description ngay từ lệnh đầu tiên nó chạy. Cha chết lúc git đang chạy: lock vẫn giữ tới khi git thoát. Đây đúng là điều bản 2 phải xây bằng `.bound` + "con sống thì thế hệ sống".
4. Borrow mode: con không release được thay cha (đóng fd chỉ đóng bản sao của nó). Con không được truyền tiếp fd ngoài hook của chính git.
5. Scrub: `workerBaseEnv` ([`adapters.mjs:99-109`](../../src/runner/dispatch/adapters.mjs)) bỏ `FGOS_LOCK_FD` và `FGOS_MAIN_LOCK_HOLDER_PID`. Env lọt ra cũng vô dụng vì thiếu description.
6. Cha phải đợi con trước khi coi transaction xong (đã vậy hôm nay).

Bằng chứng: git thật, hook thật, owner bị SIGKILL ngay sau spawn (12.1 ca 5).

### 6.5 Scope transaction và thứ tự lock (B5)

- `LockScope` là object truyền tường minh qua lời gọi. Mỗi `claimAndDispatch` song song trong runner ([`loop.mjs:1818`](../../src/runner/loop.mjs)) có scope riêng. Thứ tự kiểm **trong một scope**: chỉ acquire hạng lớn hơn mọi hạng scope đó đang giữ; hai lock cùng hạng trong một scope bị cấm.
- Loại trừ giữa hai scope cùng process do kernel lo (hai description). Không cần tập hạng toàn process.
- Cửa có handle: `withMainCheckout(scope, purpose, fn)` acquire và trao `mainHandle`. `checkpointMainFgos(mainHandle)` **bắt buộc** nhận handle, không bao giờ tự acquire. Caller đang giữ main (claim [`claim-port.mjs:168`](../../src/runner/claim-port.mjs), merge [`merge.mjs:934`](../../src/runner/merge.mjs)) truyền handle; caller chỉ giữ slot ([`merge.mjs:804`](../../src/runner/merge.mjs)) gọi `withMainCheckout` trước. W1' đã đi theo hướng này (`mainLockHolder`).
- Xuyên process (hook, helper) không cần kiểm thứ tự: hook chỉ thử một lần, không chờ; helper không giữ gì sau khi thoát.
- **Bảng hạng lấy từ trace thật, không đoán.** Một release ghi `FGOS_LOCK_TRACE` (thứ tự acquire thật của mỗi scope) và kiểm thứ tự chỉ **cảnh báo**; release sau mới ném lỗi. Bảng dưới là dự kiến cho luồng v3: controller acquire attempt (15) trước, rồi supervisor acquire cwd (30) trong scope của nó; hôm nay [`assignment-runner.mjs:2219`](../../src/runner/dispatch/assignment-runner.mjs) acquire cwd trước, nên đổi thứ tự là một phần của 6.2.

| Hạng | Lock | Kind |
|---|---|---|
| 10 | runner, gateway | lease |
| 15 | attempt (9.4) | lease |
| 20 | `merge-slot--<target>` | mutex |
| 30 | dispatch cwd (máy) | lease |
| 40 | `worktree-admin` | mutex |
| 50 | main checkout | mutex |
| 55 | `index.lock` của git | ngoài fgOS; hook chỉ thử hạng 50 một lần |
| 60 | hot `state` (events + claims) | hot-mutex |
| 80 | lá: sessions, advance, reconcile, recovery, observe, provider account, activation, install, full-suite | mutex |

### 6.6 Đường nóng (B6 + mặc định của anh)

**Gộp `claims.lock` vào `events.lock`** thành một mutex nóng `state`. Lý do: `claims.lock` được giữ cả trong `events.lock` ([`store.mjs:1148`](../../src/state/store.mjs), `claimWork`) lẫn ngoài ([`bin/fgos.mjs:4152,4165`](../../bin/fgos.mjs), [`claim-port.mjs:270,358`](../../src/runner/claim-port.mjs)); hai lock nóng lồng nhau là nguồn của bài toán "contender claims đang giữ events" (B6). Gộp là gom tùm lum (RUL11): một lock, không lồng. Các hàm claim nhận `stateTx` khi đã ở trong lock, không acquire lại. `claims.lock` hôm nay còn **cướp holder sống sau 30 s** và unlink không đọc lại ([`runtime-coordination.mjs:88-92`](../../src/state/runtime-coordination.mjs)); gộp xoá luôn lỗi này.

**Cơ chế tạm, Node trong process** (tới khi use-case store sang Rust):

- Fast path giữ nguyên hôm nay: `link` temp → `events.lock`, release = `unlink`. Record = `{pid, startTime, bootId}` thay vì chỉ pid ([`events.mjs:302`](../../src/state/events.mjs)).
- Holder chết (theo 5.1, chỉ `dead`, không bao giờ `unknown`) chỉ được dọn **khi đang giữ kernel lock `state.reclaim`**: đọc lại record, khác thì thôi, giống thì unlink, nhả kernel lock, thử lại link. Dưới kernel lock, record của holder chết không thể đổi (holder chết không release; mọi người dọn khác bị tuần tự hoá), nên lịch A1 không còn.
- Record không đọc được: không bao giờ dọn. Doctor báo `lock-record-unreadable`; người xác nhận rồi `fgos lock fence`.
- Bằng chứng: lịch A1 không kernel lock → hai holder; có kernel lock → một (12.4). Stress 8 process, holder bị SIGKILL trong vùng găng: không kernel lock 4 vi phạm và process crash vì record bị cướp; có kernel lock 0 vi phạm.

**Bất biến trong vùng găng nóng (B6, chốt):**

1. Hàm truyền vào là đồng bộ, và **mọi ghi trong vùng găng đi qua `stateTx`**. `stateTx` bị thu hồi lúc release; ghi qua `stateTx` đã thu hồi → ném. Kiểm thenable sau khi callback trả về là **quá muộn** (Astra R3-7: continuation async vẫn ghi trong lúc process khác giữ lock), nên không dựa vào nó. Thêm kiểm tĩnh call site cho callback đồng bộ.
2. Không subprocess dưới bất kỳ hình thức nào. Các `try/catch` rộng quanh exec cũ (`getMainFgosDir`, `assertPlanEvidence`) phải được gỡ cùng lúc, để lỗi của gác không bị nuốt thành "không có branch" hay sai đường dẫn. Facade đếm độ sâu vùng găng nóng trong process. Gác được cài **một lần**, ngay khi nạp mô-đun sở hữu lock nóng (`src/state/events.mjs`), bằng cách bọc `node:child_process` (`spawn`, `spawnSync`, `exec*`, `fork`) rồi gọi `module.syncBuiltinESMExports()` để cả các `import { execFileSync } from 'node:child_process'` đã liên kết cũng thấy bản bọc (thiếu bước này thì import có tên vượt được gác, Argon R4-8). Đặt ở mô-đun lock chứ không ở `bin/fgos.mjs`, vì `bin/fgos-runner.mjs` và các điểm vào khác không đi qua đó. Độ sâu > 0 → `exec-under-hot-lock`. **Lịch bật giống thứ tự lock (6.5)** (kongming M5): một release chạy với `FGOS_LOCK_TRACE`, gác chỉ **cảnh báo** và ghi call site; release sau mới ném. Ba chỗ đã biết (`currentHead`, `getMainFgosDir`, `assertPlanEvidence`) không chứng minh không còn chỗ thứ tư. Vẫn là hành vi production, không phải nhánh test. Một chỗ, phủ mọi call site (repo có ~150 lời gọi spawn/exec trong 54 file), là hành vi production, không phải nhánh test.
2b. Acquire lại `state` khi chính process đang giữ → `hot-lock-reentry` **ngay** (cùng lịch cảnh báo → ném như điểm 2), không spin tới timeout 5 s như hôm nay ([`events.mjs:381`](../../src/state/events.mjs)).
3. Không chờ lock nào khác (sau khi gộp không còn lock nóng thứ hai). Không hỏi liveness (dọn holder chết xảy ra lúc acquire, trước khi vào).
4. Chỉ đọc/ghi file dưới state root và tính toán trong process. Đọc `sessions.json` được phép.
5. Mọi giá trị cần exec được lấy **trước** lock và truyền vào: writer identity (prime một lần mỗi điểm vào process); **gốc main checkout** (`getMainFgosDir` chạy `git rev-parse` mỗi lần, [`runtime-coordination.mjs:14`](../../src/state/runtime-coordination.mjs) → [`paths.mjs:77`](../../src/runner/paths.mjs), nằm trong `acquireClaim`/`releaseClaim`; phân giải một lần mỗi process rồi truyền trong `stateTx`, gemini R3-2); **bằng chứng plan của việc heavy** (`assertPlanEvidence` gọi git trong `moveWork` dưới lock, [`store.mjs:601-622`](../../src/state/store.mjs): lấy snapshot ngoài lock, trong lock chỉ so revision/SHA, lệch thì thử lại ngoài lock; Astra R3-8, gemini R3-2); và HEAD. `claimWork` đọc HEAD trước `withEventsLock`, truyền SHA tường minh cho cả tạo worktree lẫn record claim (`headAtTake`). Nhất quán: worktree tạo từ đúng SHA ghi trong claim; HEAD đổi sau đó là chuyện của land (CAS theo SHA), không phải của claim.

**Nền tảng của cơ chế tạm:** phán chết cần startTime (Linux). Nền khác: dùng `{bootId nếu có, pid còn tồn tại}` như hôm nay cho riêng đường nóng tạm thời (rủi ro pid tái dùng giữ nguyên như hôm nay, không tệ hơn).

**Chi phí:** fast path không đổi (link/unlink ~25 µs). Đường dọn có exec ~1,4 ms nhưng chỉ khi holder chết. **Điều kiện kết thúc** có tên: use-case store ([`store.mjs`](../../src/state/store.mjs), [`events.mjs`](../../src/state/events.mjs), [`runtime-coordination.mjs`](../../src/state/runtime-coordination.mjs)) sang Rust → mutex nóng thành kernel lock trong process Rust (µs), đổi bằng tombstone (6.8).

**Rủi ro còn lại, ghi thẳng:** sau mất điện trên fs không đảm bảo thứ tự dữ liệu, record nóng có thể rỗng → giữ tới khi người fence. Chấp nhận trong giai đoạn tạm; kernel lock ở đích không có rủi ro này.

### 6.7 Fencing và holder sống treo (A8)

- Receiver thật duy nhất vẫn là `settleRunControl` ([`run-lock.mjs:390-452`](../../src/runner/dispatch/run-lock.mjs)). Ở v3 loại trừ của attempt do lock attempt (kernel, 9.4); ledger run control giữ nguyên, không GC, chỉ còn vai epoch cho CAS.
- Main checkout không có receiver: kernel lock không bao giờ bị giành từ holder còn sống, nên không cần fencing.
- **Holder sống mà treo:** `fgos lock fence <name>` (thay `unlock --force`): tìm mọi process đang giữ description (Linux: quét `/proc/*/fdinfo`), hiện ra, hỏi xác nhận, gửi SIGTERM rồi SIGKILL theo identity (5.2). Lock tự nhả khi chúng chết. Không có đường nào giành lock trong lúc holder sống. Nền không liệt kê được holder: người tự dừng process rồi chạy `fence --attest-stopped`, lệnh này chỉ kiểm lại bằng try-lock.

### 6.8 Đổi phiên bản: hàng rào theo hình dạng giao thức + quiescence hai pha + sàn (B2, A2, A13)

Mặc định của anh: quiescence có kiểm soát + sàn launch. Vòng 1 chỉ ra tombstone không phải hàng rào chung (Astra R3-1, gemini R3-4). Bản này chia theo **hình dạng giao thức cũ**, không theo tên lock.

**Kiểm kê theo hình dạng** (là một phần bắt buộc của registry lock 4.2):

| Hình dạng cũ | Lock | Hàng rào làm code cũ fail-closed | Bằng chứng |
|---|---|---|---|
| File link/unlink ở đường dẫn cố định | `main-checkout.lock`, `merge-slot--*`, `events.lock`, `claims.lock`, `.fgos/porting/events.lock` ([`porting-store.mjs:27`](../../src/state/porting-store.mjs)), runner, gateway, sessions, advance, reconcile, recovery, full-suite | **Tombstone**: thay file bằng thư mục có `TOMBSTONE` | Code thật main (trước và sau W1') + W1' + `withEventsLock`: mọi lời gọi `EISDIR` (12.5). Hook shell gọi `inspectMainCheckoutLock` → thoát khác 0 |
| Thư mục ledger (`currentGeneration` đọc tên số, bỏ qua tên khác) | account provider, `state-lock` của provider-capacity | **Thế hệ chặn**: publish (bằng `link`) một thế hệ cuối có holder là PID 1 **không có** `processStartTime` và `bootId`. Code cũ: pid 1 luôn sống trong mọi namespace, thiếu startTime thì luôn `held` ([`process-identity.mjs:66`](../../src/runner/dispatch/process-identity.mjs)). Có startTime thì bị vượt trong PID namespace (startTime của init namespace khác; Argon R4-3). Tài khoản chưa có ledger: v3 đặt thế hệ chặn lười trước lần kernel lock đầu; gặp thế hệ v1 còn sống thì `held`. Tombstone **không** chặn được (Astra: `v1Acquired:true` cạnh `TOMBSTONE`) | `tryAcquireAccountLock` production: trước chặn `acquired`, sau chặn `held` (12.5) |
| File theo tên cwd, có thể ở nhiều root | `dispatch--<cwd>.lock` | Không tombstone trước được mọi tên, mọi root (Astra: hai `fgosDir` cho cùng cwd). Xem dưới | Astra `r3-cutover.mjs` |
| Rust `fgctl` đọc `main-checkout.lock` | [`lock.rs`](../../packages/distribution/rust/src/lock.rs) | Tombstone làm `fgctl` cũ từ chối **activate** → phải đi sau 4.4 | kongming 4, gemini R3-11 |

**Quiescence hai pha** (Astra: một lần quét không khoá cửa launch; holder xuất hiện **sau** quét vẫn lọt):

1. **Pha 1 — chặn cửa mới:** dưới điều kiện đã dừng writer (người vận hành), đặt hàng rào của mọi tài nguyên trong họ (tombstone hoặc thế hệ chặn) ngay lập tức. Với họ dispatch cwd: liệt kê mọi worktree (`git worktree list --porcelain`) và claim, đặt tombstone cho mọi tên v1 của chúng ngay ở pha này, không đợi lười (R4-4 vòng 2). Tombstone theo tên không chặn được một release cũ chạy qua một symlink chưa biết tới cwd. Vì vậy **họ dispatch cwd không được bật v3 khi cửa admission của code cũ còn mở** (Astra vòng 2): chỉ bật khi (a) workspace đã activate ≥ sàn, (b) không còn payload release dưới sàn nào của workspace chạy được (`fgctl` gỡ hoặc đánh dấu không chạy được các release đã stage dưới sàn), và (c) quét pha 2 sạch. Chưa đủ ba điều → họ cwd giữ v1 (ngữ nghĩa W1'), không bật nửa vời. Từ lúc này mọi lần acquire mới của code cũ thất bại. Tombstone đặt bằng `mkdir` độc quyền: nếu một holder cũ vừa link file trước thì `mkdir` thất bại và cutover huỷ, không bao giờ có cảnh cả hai cùng giữ ở đường dẫn.
2. **Pha 2 — chờ code cũ chết hết:** v3 của họ đó **chưa bật**. Đợi tới khi quét cho thấy **không còn process nào của release dưới sàn** (không chỉ "không ai giữ lock": holder cũ bị giành file theo TTL vẫn có thể đang trong vùng găng mà không có file, P6). Quét Linux: `/proc/*/environ` (`FGOS_STATE_ROOT`, đường dẫn workspace), `/proc/*/cwd` thuộc **bất kỳ worktree nào** của repo, `cmdline` có payload fgOS (gồm release đã stage và `--cwd`). Nền khác hoặc provenance không rõ: cần người xác nhận.
3. **Bật:** ghi marker họ `runtime/locks/<họ>.active`. Code R-dual chỉ dùng v3 khi marker có; trước đó dùng v1 như cũ (và gặp hàng rào thì báo lỗi rõ, không tự xoá).
4. Ghi `lockProtocolFloor` của workspace. **Cưỡng chế sàn ở 4.2**, trước cutover đầu tiên (không chờ 4.5): `fgctl activate` mới từ chối release dưới sàn. Sàn chỉ là trải nghiệm với `fgctl` cũ; hàng rào ở bước 1 mới là chốt thật.
5. **Họ dispatch cwd giữ phạm vi `fgosDir` như hôm nay**, chỉ đổi cơ chế sang kernel lock. Chuyển sang phạm vi máy **ra khỏi track này** (kongming, KISS/YAGNI): mở item riêng khi có nhu cầu thật (hai workspace cùng cwd). Tombstone đặt cho cả dạng `path.resolve` (như v1 tính) lẫn `realpath` (gemini R3-4c).
6. **Rollback:** chỉ về release ≥ R-dual, theo đúng hai pha ngược lại (gỡ marker `.active`, chờ code v3 chết hết, rồi gỡ hàng rào). Không bao giờ về dưới R-dual.
7. Guard resume cũ ở `run.mjs` bắt mọi lỗi đọc lock và coi như không có holder (Astra, gemini R3-4a: fail-open trên tombstone). Nó được thay bằng try-lock của holder-lock **trong cùng commit** với cutover của họ dispatch cwd; trước đó, writer phía sau vẫn từ chối vì acquire gặp hàng rào.

Release cũ gặp hàng rào chết với `EISDIR` thô hoặc "held by pid 1", không phải lỗi có tên: chấp nhận (một người dùng), ghi CHANGELOG.

### 6.9 Một state root (B9)

- `stateRoot` = `FGOS_STATE_HOME` (nguyên giá trị) | `XDG_STATE_HOME/fgos` | `HOME/.local/state/fgos`: **đúng** công thức [`store.rs:59-75`](../../packages/distribution/rust/src/store.rs). `lockRoot = stateRoot/locks`. Không đổi nghĩa override.
- Một hàm trong crate Rust là nguồn duy nhất. Host Rust phân giải một lần và đặt `FGOS_STATE_ROOT` trước khi exec payload Node. Node chỉ đọc biến này; vắng (kênh tương thích `node bin/fgos.mjs`) thì gọi route `fgos internal state-root` một lần, trước mọi lock.
- Dispatch ghim `FGOS_STATE_ROOT` vào env của mọi process con, nên `HOME` riêng của sandbox không đổi gốc. Process tự đặt gốc khác là phạm vi máy khác theo định nghĩa.
- Doctor in gốc đã phân giải và nguồn của nó. Vector: `FGOS_STATE_HOME`, XDG, HOME, sandbox HOME + `FGOS_STATE_ROOT`, Windows.
- Khoá của cwd vẫn là `dev:ino` sau `realpath` (bản 2 mục 4.4).

### 6.10 Main checkout

Giữ bảng writer của bản 2 (mục 8.1) và phạm vi bảo đảm (8.2). Thay đổi:

- Main mutex là kernel lock. Hook chỉ thử một lần. Commit của fgOS mượn description (6.4) nên hook thấy borrower thì bỏ qua beacon.
- B4 đã đóng ở W1' bằng main mutex v1 quanh checkpoint dưới slot; v3 giữ cấu trúc đó với handle (6.5).
- Rủi ro staged-but-uncommitted khi land `read-tree` (bản 2 8.2) vẫn là test bắt buộc trước writer v3 đầu tiên của main.

## 7. terminal-control

### 7.1 Vai trò

Component nền độc lập: package `packages/terminal-control`, crate `fgos-terminal-control`. Dùng được không cần run: `/fgOS:terminal`, `herdr-dashboard`, pane do người mở. Không biết run, deadline, receipt, work item.

### 7.2 Ghi gì

Đúng một thứ: **allocation record**, ghi một lần lúc cấp (publish bằng `link`):

`{key, groupKey, driver, serverIncarnation, tabId, paneId, allocatedAt, display}`

cùng hai marker một lần: `launched` (identity process do launch trả) và `released` (disposition). Nơi lưu: `stateRoot/terminal/<driver>/<serverIncarnation>/allocations/<key>.json`. `serverIncarnation` = `{host, bootId, pidNs, pid, startTime, endpoint}` của herdr server (thiếu bootId thì sau reboot pid/startTime có thể lặp; Astra R3-11). Mọi thao tác phá huỷ (`close`) mang incarnation mong đợi; driver kiểm peer của socket (`SO_PEERCRED` → pid, rồi startTime + bootId của pid đó) khớp incarnation ngay trên kết nối dùng để đóng. Không kiểm được → `unknown`, giữ pane.

Marker `launch-requested` được ghi **trước** khi gọi driver chạy lệnh; `launched` ghi sau. Supervisor chỉ gửi GO sau khi `launched` bền (R3-6 vòng 1).

Pane nhận bằng `attach` không bao giờ bị core đóng; `release` của nó chỉ gỡ nhãn/gắn kết.

Mọi thứ khác **đọc sống**: pane còn không, process nào đang chạy trong pane, tab có những pane nào. Một file gợi ý `groups/<groupKey>.json` (tabId) chỉ để tìm nhanh; luôn kiểm sống trước khi dùng, sai thì bỏ.

Không có "holder" của slot trong record. Ai được dùng slot là chuyện của tầng trên: run supervisor giữ lock attempt; slot chỉ có key.

### 7.3 Cổng trên (theo key; với run thì key = attempt id)

| Thao tác | Kết quả |
|---|---|
| `allocate(key, groupKey, display, roleHint?)` | `{slot}` \| `unsupported` \| `unknown`. Vị trí do policy layout quyết (7.9); `roleHint` là dữ liệu hiển thị thuần, chỉ policy đọc |
| `attach(key, pane)` | Nhận một pane có sẵn (pane của chính người gọi: `/fgOS:terminal`, pane người mở) |
| `launch(key, launchSpec)` | Chạy lệnh trong pane, trả **identity process** `{pid, startTime, bootId, pgid}` của gốc process vừa chạy (kiểm argv như [`verifyForegroundProcessArgv`](../../src/runner/dispatch/herdr-round.mjs) hôm nay) \| `not-started` \| `unknown` |
| `send(key, text | keys)` | gửi vào pane |
| `read(key, {lines})` | màn hình |
| `inspect(key)` | `{pane: live|gone|unknown, foreground: identity, activity?}` (`activity` khi driver có) |
| `release(key, {disposition: close | retain(until)})` | đóng pane, hoặc giữ cho người xem tới `until` |
| `label(key, display)` | nhãn hiển thị |

Mọi kết quả có `unsupported` và `unknown` tường minh. Core không đoán.

### 7.4 Luật của core (đây là hợp đồng test, kế thừa nguyên mục 2.3 và 2.4 của hội đồng)

1. Gom tab theo `groupKey`. Mặc định `groupKey` = unit run id, hoặc workflow run id nếu có. Không còn nhãn tự chế `fgos-lead-<key>-<ts>` ([`herdr-round.mjs:1656-1660`](../../src/runner/dispatch/herdr-round.mjs)).
2. Tách pane neo trên một pane **còn sống** của nhóm. Không còn root pane rỗng: tab mới mở bằng pane của chính worker đầu tiên. Đã đo trên herdr thật với 5 CLI (hội đồng 2.4, bản chi tiết commit `8b61ae947` mục 10).
3. Pane neo chết hoặc tab biến mất → mở tab mới cùng nhãn. Pane cuối đóng thì herdr tự xoá tab. Xoá hẳn `closeIfEmpty` ([`herdr-agent.mjs:479`](../../src/runner/dispatch/herdr-agent.mjs)).
4. Nhãn chỉ để hiển thị. Không code nào đọc nhãn để quyết định.
5. Core chỉ đóng pane do chính nó cấp, theo key. Không bao giờ đóng cả tab.

### 7.5 Cổng dưới: driver và khả năng

Driver khai báo khả năng; core trả `unsupported` cho thao tác driver không có.

| Khả năng | herdr | tmux (sau) |
|---|---|---|
| `tab.create`, `pane.split`, `pane.close` | có | có |
| `pane.run` | có | có (`send-keys` + Enter) |
| `send.text`, `send.keys`, `read.screen` | có | có |
| `process.info` (foreground) | có (`pane process-info`) | có (`#{pane_pid}` + /proc) |
| `activity.state` | có (agent state) | không → `unsupported` |
| `label` | có | có |
| `layout.geometry` (rect thật của tab và mọi pane) | có (`herdr pane layout`, đo 7.9) | có (`list-panes -F '#{pane_left} #{pane_top} #{pane_width} #{pane_height}'`) |
| `pane.resize`, `pane.swap`, `pane.move` | có | có |
| `server.incarnation` | socket + pid server | socket + pid server |

Lỗi driver (timeout, lỗi đọc) → `unknown`. Không bao giờ quy `unknown` thành "pane đã đóng".

### 7.6 Đồng thời: phương án (a)

Bên điều phối biết nhóm (dispatch/workflow runner, **một** process cho một nhóm) gọi `allocate` rồi giao attempt cho supervisor. Không daemon, không lock.

Trong **một** bên điều phối, các attempt cùng nhóm tuần tự hoá thao tác tách/đóng theo `groupKey` (một hàng promise trong process điều phối, bọc quanh lời gọi route `fgos internal terminal-control`; mỗi lời gọi là một process riêng nhưng điều phối chờ lời gọi trước xong mới gọi tiếp), để một lần tách không đua với lần `release(close)` pane neo của attempt anh em.

Hai bên điều phối cùng `groupKey` (chỉ xảy ra khi tự đặt trùng): có thể sinh hai tab cùng nhãn. Vô hại vì nhãn không phải khoá; mỗi slot vẫn đúng key. Trigger S5 (process không cùng cha phải chung tab: gateway, hai terminal) → thêm kind `terminal-placement` của holder-lock (phạm vi máy) quanh "đọc gợi ý → tách → ghi gợi ý". Phương án (b) chỉ khi S5 bắn.

### 7.7 Ca lỗi

| Ca | Điều gì giữ đúng | Ai dọn |
|---|---|---|
| Điều phối chết trước `allocate` | Chưa có gì | — |
| Điều phối chết sau `allocate`, trước khi giao supervisor | Lock attempt đã giữ từ trước allocate (9.4), nên khi điều phối chết lock nhả; adopt kết luận `abandoned-not-started` rồi gọi `release(key)` | Chỉ tầng trên (adopt) có quyền đóng. Quét riêng của terminal-control **không** đóng gì chỉ vì quá hạn: hết `allocationGrace` chỉ kích hoạt đối soát (`inspect`); slot chưa `launch-requested` và pane chỉ có shell trần → báo cho doctor; mọi trường hợp `unknown` hoặc đã `launch-requested` → giữ (Astra R3-6, gemini R3-10b) |
| Supervisor chết khi slot đã cấp, chưa launch | Gate chưa chạy hoặc không kết nối được → không agent nào chạy (12.3) | Adopt `abandoned` → `release(key, close)` |
| `launch` trả về rồi supervisor chết | Gate giữ lock attempt, agent chạy tiếp tới xong hoặc trần cứng (9.3) | Adopt sau khi lock attempt nhả → `release` |
| Slot giữ lại (`retain`) | Giữ tới `until`; không có process nào cần nó | Quá `until` **và** pane cùng incarnation **và** foreground không phải process lạ → đóng; còn lại giữ (thời gian không phải bằng chứng) |
| Resume gặp slot cũ | Attempt cũ còn lock → resume chỉ quan sát qua `inspect(key)`; không bao giờ launch lại vào slot cũ. Attempt mới = key mới = slot mới | — |
| Hai điều phối cùng nhóm | Hai tab cùng nhãn (hiển thị) | — |
| herdr server khởi động lại | Pane mất, agent mất theo pty. `serverIncarnation` khác → record cũ vô hiệu | Supervisor thấy agent chết không kết quả → `carrier-lost`; quét bỏ record của incarnation cũ |
| Reboot | Mọi thứ chết; kernel lock nhả | Adopt + quét |
| Người đóng/di chuyển pane | `inspect` trả `gone`/pane ở tab khác; core không suy luận từ nhãn | Supervisor xử lý như agent mất |

### 7.8 Research gốc: giữ, đổi, bác

| Đề xuất của research | Bản 3 | Vì sao |
|---|---|---|
| Crate `terminal-control` riêng | **Giữ**, thành component nền thật (anh quyết) | Dùng cả ngoài run |
| Driver herdr, tmux sau | **Giữ**, có khai báo khả năng | Hexagonal |
| Gom tab theo nhóm, bỏ root pane | **Giữ** (2.3, 2.4 là luật core) | Đã đo |
| Lệnh `fgos terminal` cho người dùng | **Bác** khi chưa supersede D2/STR40 | Đảo quyết định cũ; release cũ ở project khác gặp verb lạ. Bản 3 chỉ dùng route nội bộ cùng release (xem 9.10) |
| Layout engine theo tỉ lệ màn hình | **Bác**, thay bằng phần layout đo thật + cổng policy (7.9) | Pseudocode tự mâu thuẫn với bảng của nó (terminal dọc 110×80); số học ô viền là một mô hình nữa (đo herdr thật: rect con cộng đúng bằng rect cha); 85×20 và tối đa 4 chưa ai đo |
| File lock layout trong repo | **Bác** | Sai với worktree và herdr dùng chung nhiều repo; nếu cần là kind phạm vi máy (7.6) |
| Đọc nhãn pane để suy trạng thái | **Bác** | Hiển thị thành khoá dữ liệu |
| Helper 4 hàm, "85% giống nhau" | **Đổi** | Port phải có `unsupported`/`unknown`/`retain` |
| Map tab trong RAM của process | **Đổi** | Record ghi lúc cấp + đọc sống; RAM chỉ là cache |

### 7.9 Layout: cơ chế đo thật + cổng policy cắm được

Ý anh (2026-10-15): vị trí pane tính từ **trạng thái thật**, không từ mô hình hình học của terminal; và phần layout là một **policy cắm được**, để sau này thêm cách xếp tốt hơn mà không chạm core hay driver.

**Core làm cơ chế, policy chỉ quyết vị trí:**

1. Trước mỗi lần đặt pane, core hỏi driver `layout.geometry` của tab nhóm: vùng tab và rect thật của mọi pane (kèm key của pane do core cấp).
2. Core gọi policy: `place({groupKey, tabs: [geometry đo được], groupPanes: [{key, rect, roleHint}], request: {display, roleHint}, limits}) → {split: {anchorKey, direction, ratio}} | {newTab} | {unsupported}`. Policy là hàm thuần, xác định, test bằng fixture hình học.
3. Core áp quyết định, rồi **đo lại**. Pane mới nhỏ hơn mức tối thiểu (làm tròn, pane khác vừa đổi) → core đóng chính pane rỗng vừa tạo (chưa launch nên an toàn) và mở tab mới cùng nhóm.
4. `limits` là cấu hình (`terminal.layout.minCols`, `minRows`, `maxPanesPerTab`), không phải bất biến. Cùng nhóm cấu hình: `terminal.allocationGraceMs` (mặc định = thời hạn chờ binding supervisor + 30 s, phải lớn hơn thời hạn đó; doctor từ chối giá trị nhỏ hơn) và `terminal.retainFailedPaneMs` (thời gian giữ pane của attempt thất bại để người xem; caller lấy từ cấu hình này khi gọi `release(key, retain(until))`; mặc định giữ hành vi hôm nay là giữ tới khi người đóng, tức `until` vô hạn, và quét chỉ báo cho doctor). Tất cả đăng ký vào config-merge của `fgos setup` và check doctor in giá trị cùng nguồn, **trước** khi bật cách `terminal` (6.5). Giá trị mặc định lấy từ đo ở 6.5: kích thước nhỏ nhất mà từng CLI trong 5 CLI còn hiện đủ prompt và paste-chip (fixture màn hình đã có từ phép đo 2.4). Không dùng 85×20 hay "tối đa 4" của research khi chưa đo. Doctor in giá trị đang dùng và nguồn của nó.
5. Driver không khai báo `layout.geometry` → không có policy nào chạy; core dùng luật tách hôm nay (tách pane neo, `down`, 0.3) và chỉ áp `maxPanesPerTab` theo số pane.

**Policy không bao giờ** đổi chủ, vòng đời, hay đóng pane của key khác. Thao tác trên pane đã có của chính nhóm (`resize`, `swap`) chỉ được nếu driver khai báo khả năng, và vẫn do core áp. Policy chọn bằng cấu hình `terminal.layout.policy` (registry tên → policy). `roleHint` là trường dữ liệu có cấu trúc do caller truyền, không phải đọc nhãn (luật 7.4.4 giữ nguyên).

**Policy mặc định `measured-split`:** với mỗi pane còn sống của nhóm và mỗi hướng (`right`, `down`), lấy kích thước hai con từ **rect đo được** với tỉ lệ 0.5; chọn ứng viên có pane con nhỏ hơn lớn nhất, so theo tỉ số với `minCols`/`minRows`; không ứng viên nào đạt mức tối thiểu, hoặc tab đủ `maxPanesPerTab` → `newTab`. Đúng/sai cuối cùng là phép đo lại ở bước 3, không phải phép tính dự đoán. Policy sau này cắm vào cùng cổng: lưới, xếp theo vai (producer và reviewer cạnh nhau), gói theo nhóm.

**Bằng chứng đo trên herdr thật** (`probe_herdr_geometry.py`, tab riêng tự tạo rồi đóng):

| Câu hỏi | Kết quả |
|---|---|
| Driver có trả hình học thật không | Có: `herdr pane layout` trả vùng tab (352×69) và rect từng pane, cả cây split và tỉ lệ |
| Tách có ăn một ô viền không | Không trong số liệu herdr trả: tách phải 0.5 của 352 cột → 176 + 176; tách xuống 0.5 của 69 dòng → 35 + 34. Phép tính "trừ 1 ô viền" của research cũng là mô hình sai với driver này; vì thế core đo lại, không tính |
| Luật hôm nay (tách pane mới nhất xuống 0.3) sau nhiều worker | Cột cao 34 dòng sau 6 lần tách: các pane còn 2, 2, 4, 4, 5, 7, 10 dòng. Chính pane của Lead trong tab này lúc viết chỉ còn 6 dòng |

**Test (6.5):** vector policy với fixture hình học (352×69 ngang, 110×80 dọc, các ca bảng research, tab đã đầy); test core trên herdr thật: lấp một tab tới giới hạn, khẳng định pane kế tiếp mở tab mới cùng nhóm và không pane nào dưới mức tối thiểu; test driver không có `layout.geometry` dùng đúng luật hôm nay.

### 7.10 Chuyển đổi

- Ngay (Node): 2.3 và 2.4 cài trong một mô-đun Node `src/terminal-control/` có đúng cổng 7.3; test của 2.3/2.4 là hợp đồng. `herdr-round.mjs` gọi mô-đun này thay vì `createBatchTab`/`batchTabFor`.
- 6.5 (cùng 6.3): crate Rust qua cùng vector; Node gọi qua route nội bộ `fgos internal terminal-control <op> --json` (lạnh, mỗi attempt vài lần). Mô-đun Node bị xoá trong commit chuyển caller cuối. Không lúc nào một caller có hai bản.
- `/fgOS:terminal` (`rename.sh`) chuyển sang `attach` + `label` cùng commit đó.

## 8. agent-protocol

- Mỗi adapter là một máy trạng thái thuần cho một CLI × một cách khởi động. 5 CLI: claude, codex, agy, pi, omp.
- `direct` (headless): dựng argv/stdin brief, đọc kết quả từ stdout hoặc outbox. Nguồn hôm nay: [`resolveExecutorCommand`](../../src/runner/dispatch/transport.mjs) (dòng 151).
- `terminal` (interactive): sẵn sàng nhận prompt, dán brief, nhận ra paste-chip, xác nhận brief đã gửi, nhận ra xong, lệnh thoát. Nguồn hôm nay: `awaitPromptReady` (`herdr-round.mjs:974`), `deliverBrief` (871), `confirmBriefSubmitted` (1092), `isDraftStillInComposer` (1052), `PASTE_CHIP_RE` (1040), `VISIBLE_WORKING_TAIL_RE` (1043).
- Cổng IO của chính nó: `send`, `read`, `activity?`. Supervisor nối vào terminal-control (theo key) hoặc pipe.
- Kết quả có tên: `ready`, `blocked(trust-dialog|login|...)`, `delivered`, `delivery-unknown`, `completed(resultPath)`, `needs-human`. Màn hình đổi không phải bằng chứng đã nhận brief; không gửi lại mù (đề xuất panelist-1 mục 5).
- Không mở tab, không chọn model, không đổi timeout, không quyết retry.
- Vector: fixture màn hình thật của 5 CLI (đã có từ phép đo 2.4).

## 9. Run supervisor

### 9.1 Vai trò

Một process cho mỗi attempt. Là **chủ** attempt:

- giữ lock attempt (lease hạng 15), lease cwd; dùng token run control do controller cấp (9.6);
- là chủ home sandbox;
- giữ deadline mềm và idle timeout (idle theo agent-protocol);
- heartbeat (chỉ để hiển thị), capture stdout/stderr vào file;
- publish receipt một lần;
- chạy các bước sau receipt (9.6);
- nửa launcher của identity (5.2): mint writer id cho attempt, scrub env cha, đặt lineage.

Không bao giờ: biết pane (chỉ biết key), chọn provider, retry/fallback, chấm claim so với evidence (Run Result Evaluator), làm bước của unit (commit writes, vòng reviewer).

### 9.2 Hai cách khởi động

| | `direct` (= cli-spawn hôm nay) | `terminal` (= herdr-spawn hôm nay) |
|---|---|---|
| Ai bật gate | Supervisor spawn gate trực tiếp | `terminal-control.launch(key, spec)`; `spec` chạy route gate với đường dẫn socket |
| Kênh GO | socketpair kế thừa | unix socket của attempt |
| Brief | agent-protocol headless: argv/stdin | agent-protocol interactive qua `send` |
| Biết xong | gate báo agent thoát + outbox | agent-protocol thấy `completed` → supervisor gửi lệnh thoát; gate báo agent thoát |

Sau khi khởi động, **canh giống hệt**: identity của gate/agent (L0), `gate-exit`, deadline, receipt.

### 9.3 Launch gate và miền process

Gate là thành phần L4 (biết attempt, envelope, báo cáo thoát); nó dùng các primitive L0 (5.2). Gate là gốc process của agent, dù agent chạy ở đâu:

1. Kết nối tới supervisor. Bị từ chối hoặc EOF trước GO → thoát ngay, **không chạy agent** (12.3 ca 2, 3; P3 ca B).
2. Nhận GO cùng hai description lock (attempt, cwd) qua `SCM_RIGHTS` với `MSG_CMSG_CLOEXEC` (terminal) hoặc kế thừa (direct), đặt `CLOEXEC` ngay (luật 6.1.1). Từ đây lock attempt được giữ bởi cả supervisor lẫn gate.
3. **Miền process có thể chứng minh rỗng** qua cổng chứa (5.3). Driver Linux: gate là **pid 1 thật** của một PID namespace mới: `bwrap --unshare-pid --as-pid-1 --proc /proc <bind của confinement hoặc --dev-bind / /> -- fgos internal gate …` (kongming M2: không có `--as-pid-1` thì bwrap tự làm pid 1, gate ở pid 2, mọi lập luận "gate là init" sai). Vì là pid 1, gate **phải** cài handler SIGTERM và SIGINT (pid 1 bỏ qua mọi signal không có handler, nên SIGTERM của deadline mềm sẽ không có tác dụng) và chạy vòng `waitpid(-1)` liên tục để reap mọi zombie bị nhận nuôi suốt attempt, không chỉ lúc kết thúc.
   **`--die-with-parent` chỉ ở cách `terminal`** (cha của bwrap là process của pane: người đóng pane thì sandbox chết, đúng 7.7). **Không** dùng ở cách `direct`: cha của bwrap là supervisor, nên cờ này làm "supervisor chết → agent chết", trái chính sách "agent chạy tiếp" (kongming M1, đo: có cờ thì `sleep` trong sandbox chết khi supervisor bị SIGKILL; không cờ thì sống). Miền vẫn chứa được nhờ gate là pid 1.
   Gate gọi `setsid` + `TIOCSCTTY` + `tcsetpgrp` cho agent bên trong namespace (từ ngoài pgid không hợp lệ). Hôm nay driver [`bwrap.mjs`](../../src/runner/dispatch/confinement/drivers/bwrap.mjs) có `--proc /proc` (dòng 464), chỉ có `--unshare-pid` ở mode blind (dòng 511), không có `--as-pid-1`/`--die-with-parent`: 6.2 sửa driver theo đúng hai cách trên, và `--bind` thư mục socket runtime vào sandbox cho cách `terminal` (kongming N5). Máy Linux không có user namespace: cổng chứa dùng mức `best-effort` (process group) và báo mức đó.
   **Ranh giới nói thẳng:** process do một daemon ngoài miền tạo theo yêu cầu của agent (qua socket của herdr, systemd, docker…) không bị giết theo. Cũng như raw git ngoài fgOS, đó là ngoài bảo đảm. Attempt có sandbox chỉ thấy các socket host được confinement cho phép tường minh.
4. (Bỏ ở r4.) Bản trước kiểm lại cha sau `PR_SET_PDEATHSIG`; đó là tàn dư của khi gate nằm ngoài namespace. Gate là pid 1 thì không cần PDEATHSIG nào ở gate trong cách `direct` (kongming N8).
5. Trần giờ cứng là mốc tuyệt đối theo `CLOCK_BOOTTIME` kèm bootId, ghi trong envelope (khởi động muộn không gia hạn). Hết trần: SIGTERM, chờ ngắn, **SIGKILL**, rồi chờ miền process rỗng (init namespace thoát). Đây là chốt an toàn khi supervisor đã chết; deadline mềm và idle vẫn do supervisor.
6. Lý do dừng có tên: supervisor ghi `stop-requested.json {cause: soft-deadline|idle|cancel}` **trước** khi gửi SIGTERM; gate chép `cause` vào `gate-exit` (sửa phân loại sai `stopped` thay vì `timeout`).
7. Agent thoát → gate (pid 1 của namespace) `kill(-1, SIGKILL)` mọi process còn lại trong namespace và reap tới `ECHILD` → chỉ lúc đó publish `gate-exit.json` một lần `{exitCode, signal, stoppedBy, cause}` → thoát. Gate giữ lock tới sau bước reap, nên ở đường bình thường lock chỉ nhả khi namespace đã rỗng.
   **Khi gate bị SIGKILL:** kernel đóng fd của gate trước khi xong việc giết namespace, nên có khe ngắn lock trống mà namespace chưa rỗng. Adopt vì vậy hỏi cổng chứa `is_empty(domain)`, không chỉ `probe` lock. Driver Linux trả lời bằng `judge(gate) == dead` theo tuple host của gate ghi trong binding: kernel giết và reap xong mọi task của namespace trước khi init (gate) thành zombie, nên khi tuple của gate đã chết thì namespace rỗng (kongming N3; thay cho quét inode `ns/pid` ở r3, inode có thể bị tái dùng và quét gặp `EACCES`; quét chỉ còn là chẩn đoán của doctor).
   Supervisor thấy gate thoát thì **đóng lease cwd ngay**, trước các bước sau receipt: cwd không còn ai dùng, và round kế tiếp của controller không phải chờ supervisor dọn xong (R4-5 vòng 2).
8. **Gate làm chủ IO của agent.** GO mang đường dẫn capture và brief; gate tự mở file capture (`dup2` vào 1, 2) và file brief (stdin ở cách `direct`). Supervisor chỉ đọc đuôi file. Không có pipe từ agent tới supervisor, nên supervisor chết thì agent không gặp `EPIPE` (kongming 3A; hôm nay supervisor Node cầm pipe, [`detached-run-supervisor.mjs:615`](../../src/runner/dispatch/detached-run-supervisor.mjs)).
9. **Nhánh mồ côi (cách `terminal`):** sau khi giao brief xong, supervisor gửi `BRIEF_DELIVERED` cho gate. Supervisor EOF **trước** tín hiệu đó → gate kết thúc miền process ngay (`abandoned-before-brief`; REPL đang đứng ở dấu nhắc trống sẽ không bao giờ tạo outbox, Argon R4-9). EOF **sau** tín hiệu → gate theo dõi đường dẫn outbox kết quả (có trong GO); có kết quả + một khoảng ngắn → kết thúc miền process. Không có kết quả thì tới trần cứng.
10. Cách `terminal`: group của agent làm foreground group của tty trong pane (`tcsetpgrp`, gate bỏ qua `SIGTTOU` khi làm việc này); quan hệ với job control của shell trong pane ghi trong spec terminal-control. `terminal-control.launch` chỉ trả identity của gate (gốc process trong pane); gate gửi identity của agent cho supervisor qua socket.

Socket của attempt nằm dưới thư mục runtime ngắn (`$XDG_RUNTIME_DIR/fgos/` hoặc `/tmp/fgos-<uid>/`, quyền 0700, chủ là user) với tên băm của attempt, vì `sun_path` chỉ ~107 byte (probe gặp đúng lỗi này, 12.3). Gate kiểm peer bằng **uid** (`SO_PEERCRED`; thư mục runtime 0700 của một user đã đủ) và GO mang `attemptId` + digest envelope để gate so với envelope của chính nó. **Không** so pid: gate ở PID namespace con thấy pid của supervisor (ở ngoài) là 0 (kongming M3, đo `peer pid=0`). Thư mục này đăng ký vào setup và doctor ngay ở 6.2.

**Chính sách khi supervisor chết: agent chạy tiếp** tới khi thoát, tới nhánh mồ côi, hoặc tới trần cứng. Loại trừ vẫn đúng vì gate giữ lock attempt và cwd; miền process vẫn chứng minh được nhờ namespace. Lựa chọn còn lại (gate giết agent ngay khi supervisor chết) bỏ việc model đã làm. Cả hai đã có probe (12.2 và Phụ lục B).

### 9.4 Giao attempt: controller → supervisor

Thứ tự đổi so với bản nháp (R3-3 vòng 1: prepare home trước khi attempt được bảo vệ cho phép reaper xoá home trước khi giao):

1. Mint attempt id; tạo thư mục run; **acquire lock attempt** (`runs/NN/attempt.lock`) rồi, **chỉ với attempt ghi (mutating)** như hôm nay ([`assignment-runner.mjs:2167-2172`](../../src/runner/dispatch/assignment-runner.mjs)), **lease cwd**, trong cùng `LockScope` (hạng 15 rồi 30). Attempt chỉ đọc (nhiều ghế song song trên cùng cwd) không lấy lease cwd (R4-5 vòng 2). Không được → từ chối. Mọi side effect sau đây nằm dưới các lock này.
2. Execution Core chuẩn bị: bind, `confinement.prepare` (marker home ghi attempt id), `terminal-control.allocate(key = attempt id)` (cách `terminal`). Ghi **envelope v3** bất biến có digest: mode, key slot, launch spec, deadline mềm/idle/trần tuyệt đối, protocol id, đường dẫn brief/outbox/capture, bước sau receipt (9.6), secrets và token run control ở side file 0600.
3. Spawn supervisor bằng binary host (`FGOS_HOST_BIN`, resolve một lần) với description lock attempt ở fd 3 và lease cwd (nếu có) ở fd 4: `setsid`, stdio vào file, **không IPC** (T8: `ERR_IPC_CHANNEL_CLOSED`).
4. Chờ `supervisor-binding.json`. Hết thời hạn mà không thấy: **không** kết luận `not-started`. Kết quả là `launch-unknown`: attempt giữ nguyên cho adopt; adopt chỉ kết luận khi lock attempt trống (mọi thành viên đã đi, miền process rỗng). Không mở attempt mới chỉ vì đọc file chậm (R3-5 vòng 1).
5. Controller **phải đóng** các fd lock ngay khi thấy binding, và trong `finally` của **mọi** đường thoát (gồm `launch-unknown`). Controller treo mà vẫn giữ fd là một holder sống làm adopt mãi báo `running` (kongming, R3-5 vòng 1; T8 chính là chuyện controller treo). Sau đó chỉ đọc tiến độ từ file và đọc kết quả khi có.

Không exec nào trong vùng găng nóng: mọi bước trên nằm ngoài `state`.

### 9.5 Deadline

- Deadline mềm và idle: supervisor. Hết giờ → `stop-requested` + SIGTERM gate, receipt `timeout`.
- Trần cứng: gate (9.3 điểm 5).
- Phục hồi không bao giờ gia hạn: deadline là mốc tuyệt đối (`CLOCK_BOOTTIME` + bootId). Reboot thì mọi process chết, không cần gia hạn.

### 9.6 Receipt và các bước sau receipt

- Receipt: kết quả vật lý `{outcome, gateExit, capture digests, outbox present?}`, publish một lần (link). Receipt không phải kết quả công việc.
- **Bước sau receipt** là lệnh mờ trong envelope, supervisor chạy làm con. Bước **không** nhận fd lock nào: supervisor giữ lock suốt lúc chạy và chờ bước; cho bước kế thừa chỉ thêm holder (bước treo vẫn là holder sống, adopt báo `running`) và thêm bề mặt rò (kongming N2). Đây là đảo phụ thuộc theo cổng: L5 định nghĩa lệnh và evaluator, L4 chỉ chạy theo hợp đồng (Astra xác nhận không vi phạm phân tầng). Mỗi bước có trong envelope: `stepId`, `hostBin`, `payloadRoot` (của **cùng release** đã ghi envelope, có thể đã bị deactivate khi bước chạy), `cwd`, `env` (có `FGOS_STATE_ROOT`, gốc project), `stepTimeoutMs`. Token run control `{controlEpoch, controlToken}` ở side file 0600.
- Mỗi bước publish **receipt bước** riêng (`steps/<stepId>.json`, một lần) khi xong. Chạy một lần; lỗi để attempt cho adopt.
  1. `settle-attempt`: cửa của Execution Core: Run Result Evaluator, `exit.json`/`evidence.json`/`result.json`, `settleRunControl` (CAS) qua `commitRunSettlement` ([`settlement.mjs:411-480`](../../src/runner/dispatch/settlement.mjs)).
  2. `finalize-home`: cửa của confinement: trả credential (`credentialWriteBack`, [`provider-credential-renewal.mjs:1165`](../../src/runner/dispatch/provider-credential-renewal.mjs)) rồi dọn home. **Đổi hợp đồng** (R4-7 vòng 2, đã kiểm source): hôm nay `finalizeConfinementResources` chỉ dọn khi kết thúc là `exited`/`spawn-failed`, còn lại ghi `retained` và trạng thái này dính vĩnh viễn ([`authority.mjs:1804-1828`](../../src/runner/dispatch/confinement/authority.mjs)); trước đây reaper cứu những home đó. Khi được gọi từ supervisor/adopt (lock attempt chứng minh miền process rỗng), bước này trả credential và dọn home với **mọi** kiểu kết thúc. Receipt bước chỉ ghi khi home đã sạch; `credential-home-kept` (chưa trả được credential) để adopt thử lại, attempt chưa `closed`.
  3. `release-slot`: `terminal-control.release(key, close|retain)`.
- Trong lúc supervisor còn sống, controller **không** tự settle (bỏ hai chỗ settle của controller, [`assignment-runner.mjs:1884,2742`](../../src/runner/dispatch/assignment-runner.mjs)).
- Khi controller chết, attempt vẫn được settle, credential vẫn được trả, slot vẫn được nhả, không cần ai resume (T8 mục 6, ý 3 và 4).
- **Không** làm ở đây: bước của unit (commit writes của runner, `unit-summary.json`, vòng reviewer, attempt kế). Những việc đó thuộc controller, hoặc `--resume` nhận attempt đã settle và đi tiếp (9.7). Unit có controller chết hiện `attempt settled, unit chờ resume` ở `inspect`; đi tiếp chỉ bằng `--resume` tường minh (anh quyết 2026-10-16, mục 16).

### 9.7 Adopt: một cửa cho resume, recover, quét và dọn

**Reaper cũ gộp vào cửa này** (R3-6 của gemini: reaper giữ lock trong lúc dọn làm adopt khác báo `running`; hai người hành động trên cùng attempt là hai thẩm quyền). Một cửa duy nhất, gọi từ `fgos run --resume`, `fgos dispatch recover`, quét đầu mỗi `fgos run` (chỗ reaper chạy hôm nay, [`run.mjs:315`](../../src/runner/execution/run.mjs)) và doctor fix:

1. `probe` lock attempt (thử `LOCK_SH` không chờ, nên hai lần quét không cản nhau; kongming N6) và hỏi cổng chứa `is_empty` (luật 6.0.1: lock trống chưa đủ). Lock đang bị giữ độc quyền: nếu có marker `adopting` (ghi bởi một adopter đang giữ lock) → báo `being-adopted`; không có → báo `running`. Không bao giờ chạy attempt thứ hai cho cùng việc.
2. Lock trống **và** `is_empty == empty` → giữ lock (`EX`), ghi `adopting`, rồi đi theo **ma trận phục hồi** (R3-4 vòng 1), mỗi bước idempotent, mỗi bước có receipt bước:

| Trạng thái thấy được | Việc adopt làm |
|---|---|
| Không binding, không receipt | `abandoned-not-started` (miền process rỗng vì lock trống); chạy đủ `settle-attempt` (kết quả `abandoned-not-started`), `finalize-home`, `release-slot` để tới được `closed` |
| Binding có, `gate-exit` chưa, receipt chưa (supervisor + gate cùng SIGKILL, mất điện, reboot) | Lock trống chứng minh miền rỗng → tổng hợp receipt `gate-lost` (kèm outbox nếu có) rồi đi tiếp như dòng dưới (R4-6a vòng 2) |
| `gate-exit` có, receipt chưa | publish receipt từ `gate-exit` + outbox |
| Receipt có, run control `settled`, `result.json` chưa | **giữ đường phục hồi sẵn có**: `commitRunSettlement` nhận `alreadySettledByUs` bằng token cũ trong side file và hoàn tất publish; không acquire epoch mới (production trả `settled`, sẽ từ chối) |
| Receipt có, chưa settle | settle bằng **token của attempt** trong side file 0600 qua `commitRunSettlement` (token là của attempt, không phải của process nào); không acquire epoch mới khi generation đó chưa settle — controller còn sống vẫn là holder nên production trả `held` (R4-6b vòng 2). Chỉ khi side file mất mới acquire, và chỉ khi holder ghi đã chết |
| `result.json` có, `finalize-home` chưa có receipt bước | chạy `finalize-home` (`result.json` xác nhận công việc, không xác nhận dọn) |
| `release-slot` chưa có receipt bước | chạy `release-slot` |
| Mọi bước có receipt | đánh dấu attempt `closed`; lần quét sau bỏ qua |

3. **Outbox có kết quả thì settle từ outbox**, bất kể `stoppedBy` (trần cứng, nhánh mồ côi); Run Result Evaluator vẫn chấm như mọi lần (R3-7 của gemini, kongming 3).
4. Quét có giới hạn: chỉ attempt chưa `closed`; mọi try-lock gom vào **một** lời gọi route Rust (`fgos internal lock-scan`, danh sách đường dẫn qua stdin). Mục tiêu < 50 ms ở 2000 run.
5. `--resume` của unit dùng attempt đã settle như kết quả, **không chạy lại** (sửa T8 mục 4.4). `supersedesRunId` chỉ ghi khi thật sự launch attempt mới.
6. Hai adopter: kernel lock tuần tự hoá (P4 ca E); exactly-once của side effect dựa vào receipt bước + idempotency sẵn có của settlement (CAS) và credential staging, không dựa vào lock.
7. `recover` không còn park vì `result-1.json` (T8): `outbox/result-N.json` là bằng chứng có tên trong hợp đồng adopt.

### 9.8 Dọn home: không còn reaper riêng

- Home thuộc attempt (marker ghi attempt id, 9.4 bước 2). Chỉ cửa adopt dọn home, và chỉ khi lock attempt trống. Lock trống nghĩa là mọi thành viên đã đi **và** miền process rỗng (9.3), nên không còn agent nào dùng home.
- OQ2 của anh (liveness không rõ + credential quá hạn → hạn thắng; không bao giờ áp cho run đang sống): chỉ còn áp ở nơi kernel không trả lời được. Trên nền đã hỗ trợ không có trạng thái đó; trên nền chưa hỗ trợ thì carrier bị từ chối từ đầu (6.1.2), nên không có home nào ở trạng thái đó. Run có lock đang giữ không bao giờ bị áp.
- **Chuyển trong cùng một đầu việc với writer mới** (R3-10 vòng 1): 6.2 chuyển writer (supervisor mới) **và** mọi reader/destructor của home (bốn call site reaper: [`run.mjs:315`](../../src/runner/execution/run.mjs), [`dispatch/cli.mjs:1230`](../../src/runner/dispatch/cli.mjs), [`loop.mjs:1443`](../../src/runner/loop.mjs), [`setup/registrations.mjs`](../../src/setup/registrations.mjs)) sang cửa adopt. Marker home có phiên bản: marker cũ (không attempt id) vẫn đi qua luật reaper cũ cho tới khi hết; marker mới chỉ đi qua adopt. Mỗi home đúng một giao thức quyết quyền dọn. Probe vòng 1 cho thấy reaper cũ xoá home trong khi lock attempt mới đang giữ và worker còn sống, nếu chuyển lệch.
- **Xoá ở 6.2/6.3** (bản vá reaper tạm, `6ce17f136`): `bindOwnershipMarker`, `markOwnershipLaunched`, `LAUNCH_GRACE_MS`, `OWNERSHIP_BINDING_FIELDS` ([`cleanup.mjs:138-180`](../../src/runner/dispatch/confinement/cleanup.mjs)); luật binder/pane trong `reapOrphanedConfinementResources` (465 trở đi) và nhánh đọc lại marker (586); `defaultPaneOpen`, `paneOpenUnlessClosed` (403, 434) và lượt dọn sau probe ở `dispatch/cli.mjs:1230`; `herdrEndpointForEnv`/`envForEndpoint` nếu không còn ai dùng ([`worker-session.mjs:84,97`](../../src/runner/dispatch/worker-session.mjs)); `bindingForPrepared` và phần bỏ qua trường binding khi so digest ở finalizer (`authority.mjs`). Phần cho `direct` xoá ở 6.2, phần herdr ở 6.3. Test S2 viết lại theo luật mới.

### 9.9 Quan hệ với BoundInvocationSupervisor

Giữ riêng. Nó gắn với một lời gọi RPC ngắn và chết cùng caller ([`bound_invocation_supervisor.rs:1-16`](../../packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs)). Run supervisor sống qua controller. Chỉ dùng chung primitive L0 (giới hạn capture, gửi signal theo identity). Gộp hai vòng đời là đảo lại tách biệt đã có quyết định (commit `e589577c1`, `649682f4e` và comment đầu [`detached-run-supervisor.mjs`](../../src/runner/dispatch/detached-run-supervisor.mjs)).

### 9.10 Rust-first, chuyển đổi thực tế

- Supervisor = route nội bộ `fgos internal supervise --envelope <path>` của host Rust. Gate = `fgos internal gate`. Route nội bộ: không có trong help, hợp đồng JSON có phiên bản, chỉ payload của **cùng release** gọi (lệch phiên bản → `host-version-mismatch`, fail-closed). Đây không phải verb người dùng; D2/STR40 không bị đảo.
- Node chỉ chuẩn bị và giao (9.4). Đường nóng không đổi.
- Confinement finalize vẫn Node, sau cửa `fgos internal confinement-finalize` mà supervisor gọi như bước sau receipt. Chuyển confinement sang Rust là việc riêng, không chặn.
- Credential write-back cần lock account provider (kind `mutex`, phạm vi máy) — từ 4.2 là kernel lock, Rust và Node cùng primitive.
- Chuyển theo cách khởi động, mỗi cách một commit chuyển, không chạy song song hai bản cho cùng một cách (luật migration: không dual-run writer).

### 9.11 Nửa launcher của identity (5.2)

- Writer id của attempt = hàm của crate session-identity áp lên attempt id (xác định, nên resume ra cùng id; S1 yêu cầu "mint một chỗ").
- Supervisor đặt `FGOS_SESSION_ID=<id attempt>` khác rỗng, xoá `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID` của cha, đặt env lineage cho id cha. Áp cho cả hai cách khởi động (pane herdr nhận qua spec launch, không còn nhánh "pane không sandbox không nhận id").
- Delegation claim (bản 2 9.2): điều phối tính trước id con bằng cùng hàm và publish delegation trước khi giao attempt.

## 10. Mô hình lỗi

| Ai chết | Lock attempt | Agent | Deadline | Receipt / settle | Home | Dọn |
|---|---|---|---|---|---|---|
| Controller trước khi spawn supervisor | Nhả (controller là holder duy nhất) | Chưa chạy | — | Adopt: `abandoned-not-started` | Adopt finalize | Adopt + `release(key)` |
| Controller sau binding | Giữ (supervisor + gate) | Chạy tiếp | Supervisor | Supervisor + bước sau receipt | Giữ tới `finalize-home` | Không cần ai (12.2 A, P4 A) |
| Supervisor | Giữ (gate) | Chạy tới xong (gate cầm IO); `terminal`: nhánh mồ côi kết thúc khi có kết quả | Trần cứng của gate (SIGTERM → SIGKILL) | Adopt từ `gate-exit` + outbox (outbox thắng) | Giữ tới adopt | Adopt (P4 B, D) |
| Gate | Giữ (supervisor) | Gate là pid 1 → kernel giết cả namespace (12.7); Windows: job còn handle của supervisor nên agent sống tới khi supervisor dừng nó; macOS: best-effort | — | Supervisor: `gate-lost` | Supervisor finalize | Supervisor |
| Agent | Giữ tới gate thoát | — | — | Bình thường | `finalize-home` | Supervisor |
| Supervisor + gate (vd. `kill -9` cả nhóm) | Nhả, và lúc nhả miền process đã rỗng | Chết theo namespace | — | Adopt: theo ma trận 9.7 (từ outbox nếu agent đã ghi) | Adopt finalize | Adopt |
| herdr server | Giữ | Mất theo pty | — | Supervisor: `carrier-lost` | Finalize | Supervisor; record incarnation cũ vô hiệu |
| Reboot | Nhả (kernel) | Chết | — | Adopt khi `fgos run` kế | Finalize | Adopt |
| Đồng hồ nhảy | Không ảnh hưởng (kernel) | — | Mốc tuyệt đối `CLOCK_BOOTTIME` + bootId | — | — | — |
| Bước sau receipt chết giữa chừng | Giữ tới khi supervisor thoát | — | — | Receipt bước thiếu → adopt chạy lại bước đó (idempotent) | Theo ma trận | Adopt |

## 11. Lộ trình

Mỗi đầu việc: thay đổi, **xoá** (One Door), **bằng chứng trước writer đầu tiên**, doctor/setup/CHANGELOG **ngay trong đầu việc đó**.

**4.0 (W1', đã vào main `e8176287f`, `e27182da4`).** Đã đóng kẹt 180 s và B4. Không đổi.

**4.2 Holder-lock (plan, chi tiết ở `plans/261016-1104-holder-lock-kernel-lock-foundation/`).** Không đụng main checkout, events, claims. Xây **cổng lock 6.0** (`acquire/release/run_borrowed/probe/holders/guarantee`) với driver `flock` cho Linux và macOS (X2 đã xác nhận); **hợp đồng `acquire` gồm luật 6.0.1** (đọc `predecessor.json`, hỏi `is_empty` của miền trước, chờ có hạn `lock.predecessorDrainMs`) ngay từ driver đầu tiên, dù trên Linux đường mượn git không cần chờ. Driver Windows viết sau khi ba probe 6.0.1 xanh trên Windows thật; giao diện cổng không có thứ gì chỉ đúng với POSIX (không lộ fd hay handle ra caller). Cấu hình `lock.predecessorDrainMs` đăng ký vào setup và doctor.
- Thay đổi: crate `fgos-process` (facts + control) và `fgos-holder-lock`; route nội bộ `fgos internal lock-fd`, `fgos internal state-root`; facade Node (`LockScope`, kind, mượn qua fd, kiểm inode, luật description 6.1.1); spec `docs/specs/holder-lock.md`; cập nhật [component-boundary.md](../../docs/platform/component-boundary.md). **Registry lock kèm hình dạng giao thức cũ** (6.8, gồm `porting/events.lock` và `state-lock`); **cưỡng chế `lockProtocolFloor`** ở `fgctl activate`; check doctor `lock-borrow-vectors` (6.1.1 điểm 8, đỏ = FAIL); ma trận khả năng 6.1.2. Chuyển các lock lạnh rủi ro thấp sang kernel lock, mỗi lock một commit, mỗi họ qua quiescence hai pha với đúng hàng rào của hình dạng: gateway, sessions, runner, advance, reconcile, recovery, full-suite (tombstone); account provider, `state-lock` (thế hệ chặn). Dispatch cwd: đổi cơ chế sang kernel lock, giữ phạm vi `fgosDir` (tombstone cả dạng `path.resolve` và `realpath`); phạm vi máy ra khỏi track (6.8 bước 5). Guard resume ở `run.mjs` đổi trong cùng commit.
- Xoá: bản chép `isPidAlive` ở từng lock; regex composite ở reconcile; GC trade-off của provider-capacity (không còn ledger mutex).
- Bằng chứng trước writer: probe 12.1 thành test đa process trên crate thật (giữ sau helper thoát, cùng process hai scope, SIGKILL, timeout, mượn qua git thật với `gc.auto=1` + một object rời — lock trống ngay sau khi đóng, anh em bị từ chối, stress có SIGKILL); **test rò description** (6.1.1) trên chính route Rust; tombstone và thế hệ chặn với code v1 thật (gồm `tryAcquireAccountLock`); test cutover hai pha có holder v1 xuất hiện sau lần quét đầu (lịch `r3-cutover` của Astra) phải không cho bật v3; vector state root; một release `FGOS_LOCK_TRACE` cảnh báo thứ tự trước khi bật ném lỗi.
- Doctor/setup/CHANGELOG: `lock-kernel-semantics` (báo mức bảo đảm của driver trên fs của lockDir; `none` trên fs mạng), `lock-holders` (quét fdinfo, báo holder lạ), `lock-cutover` (fix có quiescence), `state-root`; setup tạo `stateRoot/locks`; CHANGELOG mỗi lần đổi phạm vi.

**4.3 Main checkout + đường nóng (plan, cần 4.4 phần `fgctl` đã activate trước khi tombstone `main-checkout.lock`).**
- Thay đổi: main mutex sang kernel lock; `withMainCheckout` + `checkpointMainFgos(handle)`; reset trong mutex; promote-engine dưới slot bên ngoài; mượn qua fd thay `FGOS_MAIN_LOCK_HOLDER_PID` (API mượn tắt `gc.auto`/`maintenance.auto`); `worktree-admin`; gộp `claims.lock` vào `state` với `stateTx` qua acquire/release/settle; record nóng có tuple đầy đủ của 5.1; dọn holder chết dưới kernel lock; bất biến 6.6 (`stateTx` thu hồi, gác spawn và re-entry theo lịch trace → cảnh báo → ném); lấy trước lock: HEAD, gốc main checkout, snapshot bằng chứng plan; kiểm trần trong `state`; thu hẹp vùng claim — trần và thu hẹp trong **một** commit.
- Xoá: `HOLDER_PID_ENV_VAR`, `allowSelfRecognition`, `forceReclaimAmbiguousLock`, nhánh 30 s của `claims.lock`, `withClaimsLock`.
- Bằng chứng: hai land loại trừ; checkpoint dưới slot vs land; hook từ chối khi land giữ; commit tay ↔ land ở khe `update-ref`/`read-tree`, có/không hook; staged-but-uncommitted; mượn: hai con cùng env, cha chết khi git chạy; hai item tranh slot cuối; A1 trên mutex nóng; test gác spawn bắt `currentHead`, `getMainFgosDir`, `assertPlanEvidence` cũ; test continuation async ghi sau release bị từ chối; zombie holder được coi là chết; benchmark round thật (fast path không đổi).
- Doctor/CHANGELOG: `fgos lock fence` thay `unlock --force` (verb `unlock` và skill `fgos-unlock` đổi theo); `lock-record-unreadable`; CHANGELOG.

**4.4 Rust callers (plan; phần `fgctl` đi trước cutover main của 4.3, nằm trên đường găng).** `fgctl` ([`lock.rs`](../../packages/distribution/rust/src/lock.rs), activation lock trong `init.rs`), `install.lock` ([`store.rs:24-57`](../../packages/distribution/rust/src/store.rs)), observe [`store_lock.rs`](../../packages/observe/rust/src/store_lock.rs) và shard dùng crate; driver macOS/Windows; probe macOS mượn qua kế thừa. Xoá phép đọc `main-checkout.lock` của `fgctl` (thay bằng try-lock). Bằng chứng: cargo test cùng vector; một writer Node + một writer Rust trên cùng file lock. CHANGELOG.

**4.5 Doctor/registry (code).** Registry mọi lock (kind, phạm vi, hạng, đường dẫn) là nguồn duy nhất cho `lock-status`, doctor và spec; dọn `dispatch.claim`, check `*.claim`, spec `runner.md` lệch TTL; sàn `lockProtocolFloor` trong activation.

**6.0 (xong).** IPC (`7f1f4c2d2`), reaper gọn (`6ce17f136`). Là vá tạm; 6.3 xoá phần reaper.

**6.2 Supervisor Rust + `direct` (plan, cần 4.2).**
- Thay đổi: route `supervise` và `gate`; envelope v3; lock attempt + lease cwd giữ **trước** prepare; **cổng chứa 5.3** với driver Linux `bwrap-pidns`; gate là pid 1 (`--as-pid-1`, handler SIGTERM/SIGINT, reap liên tục), cầm IO, trần cứng có SIGKILL; bước sau receipt có receipt bước; cửa adopt với ma trận phục hồi (gồm `alreadySettledByUs`); `direct` cho CLI headless. **Chuyển writer và mọi reader/destructor của home cùng lúc** (bốn call site reaper sang cửa adopt, marker home có phiên bản, 9.8). Driver `bwrap.mjs`: `--unshare-pid --as-pid-1 --proc /proc`; `--die-with-parent` **chỉ** ở cách `terminal`; bind thư mục socket runtime; env `FGOS_PIDNS_ANCHOR` và luật phán 5.1 cho process trong namespace; hợp đồng mới của `finalizeConfinementResources` (dọn với mọi kiểu kết thúc khi có bằng chứng lock); lease cwd chỉ cho attempt ghi, nhả ngay khi gate thoát. `cliSpawnAdapter` ([`transport.mjs:381`](../../src/runner/dispatch/transport.mjs)) giao envelope thay vì tự chạy supervisor Node.
- Xoá: `detached-run-supervisor.mjs` phần chạy (giữ đọc artifact cũ một release theo luật dữ liệu sống), kênh IPC ([`detached-run-supervisor.mjs:866`](../../src/runner/dispatch/detached-run-supervisor.mjs)), `bindConfinedHomesToSupervisor`.
- Bằng chứng trước writer: P4 A–E và 12.2 thành test trên route thật (controller SIGKILL, supervisor SIGKILL, deadline, trần cứng, hai adopter) với một CLI Node thật ghi stdout liên tục (không chỉ `sleep`), để chứng minh gate cầm IO; ba test fd (kế thừa, `SCM_RIGHTS`, rò description) chạy trên route Rust, không chỉ probe Python; resume nhận attempt đã xong không chạy lại; T8 chạy lại cho cli: worker sống, settle đủ file.
- Bằng chứng thêm: mọi test "supervisor SIGKILL → agent chạy tiếp" chạy **qua bwrap thật**, không phải Python (kongming M1); SIGTERM tới gate → agent dừng trong grace; gate bị SIGKILL khi agent có cháu `setsid` → cháu chết (12.7 thành test); agent bỏ qua SIGTERM → trần cứng vẫn kết thúc; reaper cũ không bao giờ dọn home có marker mới (lịch `r3-reaper-migration` của Astra); controller chết ở từng cạnh 9.4 (trước lock, sau lock trước prepare, sau prepare, sau spawn trước binding).
- Doctor/setup/CHANGELOG: check attempt treo (`running` mà lock trống); thư mục socket runtime (quyền 0700, chủ); `process-containment` (báo mức của cổng chứa; Linux không có user namespace → `best-effort`); CHANGELOG (resume không chạy lại; controller chết không mất kết quả).

**6.3 `terminal` + 5.2 (plan, cần 6.2, 6.5).**
- Thay đổi: cách `terminal` qua terminal-control; agent-protocol Rust; gate trong pane với `SCM_RIGHTS`; mint writer id + scrub + lineage; supervisor làm chủ home.
- Xoá: vòng poll/deadline/đóng pane trong controller (`pollForOutcome`, `killPaneForegroundAndClose`, `settleRound` của [`herdr-round.mjs`](../../src/runner/dispatch/herdr-round.mjs)); phần reaper tạm dành cho herdr (9.8); nhánh reconcile herdr park vì `result-1.json`.
- Bằng chứng: T8 chạy lại cho herdr (hB/hC/hD): deadline thi hành, settle đủ, home không bị xoá dưới agent sống; S2 viết lại xanh hết; 12.3 thành test với herdr thật; 5 CLI qua agent-protocol.
- Doctor/CHANGELOG: `herdr` capability probe qua driver; `docs/io-contract.md` (writer id mỗi attempt); CHANGELOG.

**6.4 Hoàn tất khi controller chết (plan).** Phần cho `direct` đã nằm trong 6.2 (6.2 không được quảng cáo sống qua controller chết nếu thiếu nó). 6.4 còn lại: `inspect` hiện `unit chờ resume`; unit chỉ đi tiếp bằng `--resume` tường minh (anh quyết 2026-10-16, mục 16); Ctrl-C của controller gửi `cancel` cho supervisor; `release-slot` cho `terminal`. Bằng chứng: hai adopter; resume sau adopt; mọi dòng ma trận 9.7 có test crash đúng chỗ.

**6.5 terminal-control (thiết kế ở đây → plan, cùng 6.3).** Mô-đun Node ngay (2.3, 2.4 với test hợp đồng), crate Rust ở đợt 4; phần layout (7.9): khả năng `layout.geometry` của driver, cổng policy, policy mặc định `measured-split`, cấu hình `terminal.layout.*` đăng ký vào config-merge của `fgos setup` và check doctor in giá trị; đo kích thước tối thiểu của 5 CLI để đặt mặc định; xoá `createBatchTab`, `batchTabFor`, `closeIfEmpty`, nhãn tự chế; `/fgOS:terminal` sang `attach`/`label`. Bằng chứng: vector 7.4 trên herdr thật (5 CLI), ca lỗi 7.7.

**Spike đa nền tảng: X1, X2 đã chạy (12.10).** Phần còn lại trước khi viết driver Windows: chạy ba probe của 6.0.1 trên Windows thật và có 0 vi phạm. Mô tả gốc của spike:
- **X1 Windows** trên máy thật: Job Object `KILL_ON_JOB_CLOSE` (gate giữ handle, supervisor chết, gate chết, `ActiveProcesses`), process giữ lock `LockFileEx` cho Node (chi phí một process mỗi lock, nhả khi cha chết), `run_borrowed` git for Windows trong job của holder + hook nhận token/tổ tiên. Ra số đo và mức bảo đảm thật trước khi viết driver Windows của 5.3 và 6.0.
- **X2 macOS** trên máy thật: `flock` trên description kế thừa (helper, git hook), `SCM_RIGHTS`, kill cây theo process group + `proc_listchildpids`, đo đúng các đường thoát (setsid + fork đôi, launchd). Ra mức bảo đảm thật trước khi bật driver macOS.
- Cách `terminal` trên Windows phụ thuộc herdr có chạy trên Windows; ghi trạng thái herdr vào kết quả X1.

**Việc hoãn có tên:**
- Lease cwd hôm nay nhả ở `finally` của `executeAssignment` ([`assignment-runner.mjs:2786`](../../src/runner/dispatch/assignment-runner.mjs)) **trước** khi runner commit `writes` ([`run.mjs:687`](../../src/runner/execution/run.mjs)); khe "attempt xong → writes được commit" không có lease, hôm nay đã vậy và v3 không làm tệ hơn. Làm ở 6.4 hoặc item riêng (kongming N7).
- Dispatch cwd phạm vi máy (6.8 bước 5).
- Tự resume unit sau khi controller chết — làm sau, khi supervisor và holder-lock đã ổn định; cần phát hiện controller đã chết và bảo đảm chỉ một bên nhận đi tiếp (single-taker).

Đường găng: 4.2 → 4.4 (`fgctl`) → 4.3 → 6.2 → (6.5 ∥ agent-protocol) → 6.3 → 6.4. Phần còn lại của 4.4 song song sau 4.2. 5.1 song song (lead riêng); 5.2 nằm trong 6.3.

## 12. Bằng chứng đã chạy

Máy Linux 16 core, tải ~8–10, Node v24.18.0, Python 3.10.12, util-linux `flock` làm vật thế chỗ cho helper Rust, Python làm vật thế chỗ cho supervisor/gate Rust. Thư mục `…/scratchpad/design-v3/`. Đây là **mô hình** từ primitive thật của OS và code fgOS chỉ-đọc, không phải test của crate (chưa tồn tại). Mã nguồn và kết quả: [bundle probe](design-261015-2103-lock-and-run-supervisor-foundation-v3-probes.json). P3–P6 do lead trước viết trong cùng thư mục; em chạy lại và sửa P6 (thiếu `--input-type=module` nên treo). Em lỡ xoá hai file probe P1, P2 của lead trước; `probe-kernel-lock.mjs` viết lại và mở rộng cùng các ca đó.

### 12.1 Kernel lock (`probe-kernel-lock.mjs`)

| Ca | Kết quả |
|---|---|
| Node giữ sau khi helper thoát | stranger không lock được; đóng fd thì được |
| Cùng process, hai description | lần hai `held`; đóng lần một thì lần hai `acquired` |
| Holder SIGKILL | trước: bị chặn; sau: lock được |
| Helper timeout 300 ms | `timeout` sau 301 ms; đóng fd; khi blocker chết thì trống |
| Git thật + hook thật, owner SIGKILL ngay sau spawn | hook `borrower`; contender **bị chặn** suốt lúc git chạy; anh em cùng env, tự mở file: `refused`; git commit xong; sau đó contender lock được |
| Stress 8 process (+thay thế), 10 holder bị SIGKILL trong vùng găng | 310 lần acquire, **0 vi phạm**, 0 kẹt |
| Chi phí acquire qua helper exec | p50 1,35 ms, p95 1,58 ms, p99 1,71 ms (300 lần) |

P5a (lead trước, chạy lại): 8 process × 120, 25 holder SIGKILL trong vùng găng: 1839 acquire, 0 vi phạm, 0 kẹt.

### 12.2 Controller chết (P4, lead trước, chạy lại; supervisor/gate Python, settle qua `run-lock.mjs` production)

| Ca | Kết quả |
|---|---|
| A: controller SIGKILL | supervisor publish receipt, settle `pass` (epoch 2), home dọn, lock attempt trống; adopt sau đó: `already-settled` |
| B: thêm supervisor SIGKILL giữa chừng | adopt lúc agent còn chạy: `kept` (lock giữ), home còn; sau khi agent xong: adopt publish receipt từ `gate-exit`, settle `pass` (epoch 3); agent chạy đúng một lần |
| C: deadline 1 s sau khi controller chết | receipt `timeout` lúc 1,5 s, con cháu bị giết |
| D: controller + supervisor chết, trần cứng 2,5 s | agent bị gate giết ở trần, adopt settle `timeout` |
| E: hai adopter cùng lúc | một `adopted`, một `kept`; không settle bị từ chối |

Phương án em viết trước (gate giết agent khi supervisor chết, `probe-supervisor-crash.mjs`): controller chết → settle từ receipt; deadline 1 s thi hành lúc 1021 ms; supervisor SIGKILL → agent dừng trong một chu kỳ poll, adopt `abandoned`, cwd lease trống; resume khi supervisor sống → `running`, không launch thứ hai; supervisor chết trước GO → gate EOF, agent không chạy. Giữ làm bằng chứng cho phương án không chọn.

### 12.3 Gate trong pane nhận lock qua `SCM_RIGHTS` (`probe_terminal_gate_fd_passing.py`)

Gate chạy bằng `setsid` (không phải con của supervisor, như pane herdr):

| Ca | Kết quả |
|---|---|
| Giao xong rồi supervisor SIGKILL | stranger **không** lock được khi gate còn chạy; agent chạy xong; sau khi gate thoát thì trống |
| Gate khởi động sau khi supervisor đã chết | `connect` bị từ chối (111), agent không chạy |
| Supervisor chết khi gate chờ GO | EOF, agent không chạy |

Lần chạy đầu lỗi `AF_UNIX path too long` với đường dẫn dài: là ràng buộc thiết kế (9.3).

P3 (lead trước, chạy lại): supervisor chết sau GO → lock vẫn giữ khi agent chạy, nhả sau khi gate thoát; supervisor chết trước GO → gate thoát mã 3, agent không chạy.

### 12.4 Mutex nóng tạm thời (`probe-hot-reclaim.mjs`)

| Ca | Không kernel lock khi dọn | Có kernel lock khi dọn |
|---|---|---|
| Lịch A1 trên `events.lock` (R1 dừng ngay trước unlink) | R2 vào trong lúc R1 dừng; R1 unlink record của R2 rồi vào: **hai holder** | R2 chờ; R1 vào một mình: **một holder** |
| Stress 8 process, holder bị SIGKILL trong vùng găng | 4 vi phạm, worker crash vì record bị cướp | **0 vi phạm**, 540 acquire |

### 12.5 Đổi phiên bản (`probe-tombstone*.mjs`, P6)

- Tombstone thư mục ở đường dẫn `main-checkout.lock`, chạy code v1 thật của main và của nhánh W1': acquire (pid), acquire (session), inspect, release, releaseIfOwn, forceReclaim → **mọi lời gọi `EISDIR`**; tombstone còn nguyên.
- `withEventsLock` thật với tombstone ở `events.lock` → `EISDIR` sau 2 ms, không vào vùng găng.
- P6: holder v1 dừng quá TTL trong vùng găng. Luật nâng của vòng 2 (giành v1 rồi nâng) → nâng trong lúc holder còn trong vùng găng. Luật quiescence: **file v1 đã vắng** (bị giành rồi unlink) nhưng quét process thấy 1 process của workspace → từ chối.

- Thế hệ chặn cho ledger cũ (`probe-ledger-fence-generation.mjs`): `tryAcquireAccountLock` production `acquired` trước khi chặn, `held` sau khi publish thế hệ có holder PID 1 với startTime thật.
- Phản biện vòng 1 chạy lại các probe tombstone và thêm phản ví dụ cho lời hứa "mọi code cũ": ledger account bỏ qua `TOMBSTONE`; hai `fgosDir` cho cùng cwd; holder xuất hiện sau lần quét (Astra `r3-legacy.mjs`, `r3-cutover.mjs`). Ba điều này dẫn tới bảng hình dạng và quiescence hai pha ở 6.8.

### 12.6 Ledger run control không GC (P5b)

Lịch B1 trên `publishNextGeneration` production, không GC: link cũ vào thế hệ 2 gặp `EEXIST`, quyết lại với thế hệ 3, kết quả `held`. Không có lỗ nên không cần post-check.

### 12.7 Miền process: PID namespace (`probe_pidns_containment.py`)

Agent fork một cháu, cháu `setsid` và ghi heartbeat. Giết gate bằng SIGKILL:

| Gate | Cháu còn ghi sau khi gate chết |
|---|---|
| Subreaper + PDEATHSIG cho con đầu (như P4) | **Có** (khớp Astra `r3-grandchild.py`) |
| Chạy agent qua `bwrap --unshare-pid --die-with-parent` | **Không**: kernel giết cả namespace |

### 12.8 Hình học pane herdr thật (`probe_herdr_geometry.py`)

Kết quả ở 7.9: `herdr pane layout` trả rect thật; con cộng đúng bằng cha (352 → 176 + 176; 69 → 35 + 34); luật tách hôm nay để lại pane 2 dòng sau 6 lần tách. Tab probe tự tạo và đã đóng (`wS:tF8`).

### 12.9 Thí nghiệm của kongming

F1: fd Node `openSync` có `O_CLOEXEC`. F2: git 2.34 `gc --auto` dạng daemon giữ fd 3 sau khi commit trả về; `gc.auto=0` thì không. F3: Rust `std::process::Command` kế thừa fd ≥ 3 không `CLOEXEC`. Mã ở `…/scratchpad/kongming/`, báo cáo [kongming](red-team-kongming-261015-2210-lock-and-run-supervisor-foundation-v3-counsel.md).

### 12.10 Đo trên máy thật: Windows, macOS, Linux (GitHub Actions run `38855067175`)

Công cụ `tools/platform-probe`; báo cáo [implementation-261016-1205-platform-probe-windows-macos.md](implementation-261016-1205-platform-probe-windows-macos.md). JSON nguyên văn: [Windows](evidence-261016-1220-platform-probe-report-windows.json), [macOS](evidence-261016-1220-platform-probe-report-macos.json), [Linux](evidence-261016-1220-platform-probe-report-linux.json).

| Nền | Kết quả | Điểm quyết định cho thiết kế |
|---|---|---|
| macOS 26.6.2 arm64 | 8 pass, 1 skip (herdr không có trên PATH) | `flock` nhả khi SIGKILL; fd kế thừa và fd qua `SCM_RIGHTS` giữ lock sau khi cha chết; `killpg` kết thúc group; kẻ thoát `setsid`+fork đôi **sống sót** (xác nhận best-effort); quét cây + `kill_all` kết thúc đủ cây; mượn git (hook chặn, `gc.auto=1`) không lúc nào thấy lock trống khi git/con còn sống |
| Linux 6.17 Azure (đối chứng) | 8 pass, 1 skip (herdr không có trên PATH) | Như macOS |
| Windows Server 10.0.26100, NTFS, git 2.56 | 7 pass, 1 fail, 1 skip | `LockFileEx` nhả 0,1 ms sau `TerminateProcess`; helper thoát cùng cha (2,9 ms), lock trống 3,0 ms; con giữ handle kế thừa **không** giữ lock; job đóng giết con, cháu, con detached (4,0 ms), breakaway bị từ chối; `ActiveProcesses` 5 → 0 (2,0 ms); Toolhelp đủ chuỗi tổ tiên (2,6 ms). **Fail `git-borrow-blocking-hook`**: lock trống 0,2 ms, process cuối trong job chết 3,9 ms → 1 vi phạm → luật 6.0.1. Skip: herdr không có trên PATH |

## 13. Khác gì so với bản 2

| Bản 2 | Bản 3 | Vì sao |
|---|---|---|
| Generation ledger + post-check + GC high-watermark | Kernel lock trên description; ledger chỉ ở run control, không GC, chỉ holder ghi | B1; bỏ cả lớp phán sống/chết |
| Ba trạng thái sống/chết/không rõ quyết định giành lock | Kernel quyết; facts chỉ cho binding, fast path nóng, hiển thị | A3, B7 |
| Grant file + `.bound` + kiểm pid cha | Truyền description lúc spawn; hook kiểm bằng try-lock | B3, A4 |
| Owner qua helper: `--owner-pid`, `getppid()`, token, inspect | Owner là description của caller | A9, B8 |
| Hạng theo process | `LockScope` truyền tường minh; kernel loại trừ hai scope | B5 |
| `events.lock` + `claims.lock` sang ledger ở W2d | Gộp thành `state`; fast path giữ; dọn dưới kernel lock; bất biến ghi rõ | B6, mặc định của anh |
| Trung hoà → drain → marker | Quiescence quét process + tombstone + sàn activation | B2 |
| Mtime trước boot = chết | Không dùng mtime | B7 |
| Gốc máy công thức riêng | Đúng công thức `store.rs`, host truyền xuống | B9 |
| Supervisor chưa thiết kế | Supervisor + gate + adopt + bước sau receipt | 6.1 |
| terminal lock hoãn | Vẫn hoãn; terminal-control không cần lock ở phương án (a) | Quyết định của anh |

## 14. Phản biện: các vòng và cách xử lý

**Vòng 1** trên bản nháp `fb3b6113e`. Ba người phản biện độc lập: kongming (Claude Fable 5.1, in-process), gpt-6-astra (openai, herdr, `unit-run-1792076216464-ce536565`), gemini-4-argon-high (agy, herdr, `unit-run-1792076240199-f5290412`). Cả ba: hướng kernel lock đúng; **chưa duyệt** nguyên trạng. Báo cáo nguyên văn: [kongming](red-team-kongming-261015-2210-lock-and-run-supervisor-foundation-v3-counsel.md), [Astra](red-team-astra-261016-0122-lock-and-run-supervisor-foundation-v3-review.md), [Argon](red-team-argon-261016-0122-lock-and-run-supervisor-foundation-v3-review.md).

| Phát hiện | Người | Xử lý | Ở đâu |
|---|---|---|---|
| Description rò vào cây agent (Rust kế thừa fd ≥ 3) | K1 | Nhận: luật description, test rò, doctor `lock-holders` | 6.1.1 |
| `git gc --auto` giữ main mutex sau commit; fd mượn rò qua shell nền | K2, A R3-9, G R3-1 | Nhận: API mượn tắt gc tự động; hook không chạy nền; close-only, cấm `LOCK_UN`; `O_RDWR` | 6.1.1, 6.4 |
| Supervisor cầm pipe → agent `EPIPE` khi supervisor chết; `terminal` treo tới trần rồi bị ghi `timeout` | K3, G R3-7 | Nhận: gate cầm IO; nhánh mồ côi; outbox thắng `stoppedBy` | 9.3, 9.7 |
| Tombstone không phải hàng rào chung (ledger dir, nhiều root, holder sau quét) | A R3-1, G R3-4 | Nhận: hình dạng giao thức, thế hệ chặn (đo), quiescence hai pha, sàn từ 4.2, phạm vi máy chỉ sau quiescence toàn máy, khoá cả `path.resolve` và `realpath`, thêm `porting/events.lock` | 6.8 |
| Thứ tự cutover chặn chính `fgctl activate` | K4, G R3-11 | Nhận: `fgctl` (4.4) đi trước cutover main | 6.8, 11 |
| Gate chết, cháu `setsid` sống; lock trống mà còn writer; trần không leo SIGKILL | A R3-2, G R3-8 | Nhận: PID namespace qua bwrap (đo), SIGKILL, kiểm lại cha sau PDEATHSIG, `stop-requested` | 9.3, 12.7 |
| Prepare home trước khi attempt được bảo vệ | A R3-3 | Nhận: lock attempt + lease cwd trước mọi side effect; truyền cả hai fd | 9.4 |
| Adopt bỏ sót settled-chưa-có-result và finalize sau `result.json`; reaper và adopt xung đột | A R3-4, G R3-5, G R3-6 | Nhận: ma trận phục hồi, receipt bước, `alreadySettledByUs`, gộp reaper vào adopt, marker `adopting` | 9.6, 9.7, 9.8 |
| Controller giữ fd làm adopt kẹt; hết hạn chờ binding không phải `not-started` | K12, A R3-5 | Nhận: bắt buộc đóng; `launch-unknown` | 9.4 |
| Thiếu `launched` không có nghĩa pane rỗng; quét đóng pane đang khởi động | A R3-6, G R3-10b | Nhận: `launch-requested` trước driver, GO sau `launched`; quét chỉ đối soát, không đóng | 7.2, 7.7 |
| Gác thenable quá muộn | A R3-7 | Nhận: `stateTx` thu hồi lúc release | 6.6 |
| Exec còn trong vùng găng nóng: `assertPlanEvidence`, `getMainFgosDir` | A R3-8, G R3-2 | Nhận: lấy trước lock; gỡ `try/catch` nuốt lỗi | 6.6 |
| Zombie bị coi là sống; record thiếu pid bị coi là chết | G R3-3 | Nhận | 5.1 |
| Reaper cũ xoá home khi lock mới đang giữ (chuyển lệch wave) | A R3-10 | Nhận: writer + mọi reader/destructor cùng 6.2, marker có phiên bản | 9.8, 11 |
| `serverIncarnation` thiếu boot/namespace; close không gắn kết nối | A R3-11 | Nhận: tuple đủ, `SO_PEERCRED`, `attach` không bị đóng | 7.2 |
| Ma trận nền tảng; Windows sai | K9, A R3-12 | Nhận: ma trận 6.1.2; supervisor v1 chỉ Linux có user namespace; Windows không hỗ trợ (r4: thay bằng mức bảo đảm theo nền, 6.1.2, 5.3) | 6.1.2 |
| Bảng hạng lệch thứ tự thật | K6, G R3-9 | Nhận: trace, cảnh báo trước khi ném; attempt rồi cwd trong controller | 6.5, 9.4 |
| Re-entry `events.lock` tự khoá 5 s; gác spawn phải phủ 150 call site | K7 | Nhận: ném ngay; bọc `child_process` ở điểm vào | 6.6 |
| Bước sau receipt thiếu trường, có thể chạy trùng | K8 | Nhận: danh sách trường cố định, một lần, controller không tự settle | 9.6 |
| Lock file mãi không xoá; quét adopt tốn giây | K5 | Nhận: lock attempt trong thư mục run, kiểm inode, quét một exec | 6.1.1, 9.7 |
| Tab đua giữa các seat cùng nhóm | K11, G R3-10a | Nhận: tuần tự hoá theo `groupKey` trong điều phối | 7.6 |
| `fenced-lease` là kind thừa; record hiển thị là writer thứ hai | K12 | Nhận (KISS) | 6.2, 6.1 |
| Gate đặt ở L0 trong khi biết attempt | A | Nhận: gate L4, primitive L0 | 4.1, 5.2 |
| Hook borrower: NB thành công cả khi không ai giữ | K10, A R3-9 | Nhận một phần: siết điều kiện tự nhận borrower; khe còn lại chỉ do lỗi lập trình (API chỉ truyền description đã lock) | 6.4 |

Thêm theo yêu cầu của anh (qua team lead) giữa vòng: layout đo hình học thật + policy cắm được (7.9, probe herdr thật 12.8).

**Vòng 2** trên bản r1 (`ee05a4795`). gemini-4-argon-high (`unit-run-1792088608180-001250fd`) ra báo cáo: [Argon vòng 2](red-team-argon-261016-0933-lock-and-run-supervisor-foundation-v3-r1-review.md), **chưa duyệt**, R4-1…R4-10. gpt-6-astra hai lần dừng vì idle 25 phút không ra báo cáo (`unit-run-1792088585215-ac402193`, `unit-run-1792114314855-80c46e4e`).

| Phát hiện vòng 2 | Xử lý | Ở đâu |
|---|---|---|
| R4-1 PID namespace làm hỏng phán liveness (pid trong namespace ghi vào lock chung; process trong namespace cướp lock của host) | Nhận: `FGOS_PIDNS_ANCHOR` + luật phán theo anchor; không bao giờ phán chết holder không nhìn thấy | 5.1 |
| R4-2 driver `bwrap.mjs` thiếu `--die-with-parent` (và `--unshare-pid` ở mode thường); thoát namespace qua daemon host; pgid ngoài namespace | Nhận (đã kiểm source `bwrap.mjs:464,511`): gate làm init trong namespace, driver luôn có ba cờ (6.2); daemon host ghi là ranh giới | 9.3, 11 |
| R4-3 thế hệ chặn PID 1 bị vượt trong PID namespace | Nhận: bỏ `processStartTime`/`bootId` khỏi thế hệ chặn; publish bằng `link`; chặn lười tài khoản chưa có ledger | 6.8 |
| R4-4 tombstone cwd lười, symlink | Nhận một phần: tombstone mọi worktree/claim ở pha 1; symlink lạ là rủi ro chấp nhận | 6.8 |
| R4-5 lease cwd chặn ghế chỉ đọc; tự tranh chấp với round kế; fd rò ở `launch-unknown` | Nhận: lease cwd chỉ cho attempt ghi, nhả ngay khi gate thoát, đóng fd trong `finally` | 9.3, 9.4 |
| R4-6 ma trận adopt thiếu dòng binding-có/gate-exit-chưa; acquire run control bị `held` khi controller sống; dòng 1 không tới `closed` | Nhận: dòng `gate-lost`; settle bằng token của attempt; dòng 1 chạy đủ ba bước | 9.7 |
| R4-7 `finalizeConfinementResources` giữ home vĩnh viễn với kết thúc không phải `exited` | Nhận (đã kiểm source `authority.mjs:1804-1828`): đổi hợp đồng, dọn với mọi kiểu kết thúc khi có bằng chứng lock | 9.6 |
| R4-8 gác `child_process` bị vượt bởi import ESM có tên; bỏ sót `fgos-runner` | Nhận: cài ở `events.mjs` + `syncBuiltinESMExports()` | 6.6 |
| R4-9 supervisor chết sau GO, trước khi giao brief → nhánh mồ côi chờ vô ích | Nhận: `BRIEF_DELIVERED` | 9.3 |
| R4-10a incarnation qua `SO_PEERCRED` cần startTime + bootId | Nhận | 7.2 |
| R4-10b hàng đợi theo nhóm không tuần tự hoá giữa các process route | Bác: hàng đợi nằm trong process điều phối, bọc quanh lời gọi route; điều phối chờ lời gọi trước xong. Hai điều phối khác nhau là trigger S5, như anh đã quyết | 7.6 |

**Vòng 2, Astra (lần ba, brief hẹp chỉ kiểm R3-1…R3-12 của Astra vòng 1)** trên r2 (`9622bb642`), `unit-run-1792118056236-d043ffd1`, báo cáo: [Astra vòng 2](red-team-astra-261016-1017-lock-and-run-supervisor-foundation-v3-r2-review.md). Kết quả: 8 đóng, 4 đóng một phần, không phát hiện mới. Bốn phần còn mở, sửa ở r3:

| Mã | Còn mở | Sửa ở r3 | Ở đâu |
|---|---|---|---|
| R3-1 | Họ cwd vẫn nhận release cũ qua symlink | Không bật v3 cho họ cwd khi admission của code cũ còn mở (ba điều kiện) | 6.8 bước 1 |
| R3-2 | "Agent thoát → miền rỗng" chưa đúng khi còn cháu; gate bị SIGKILL nhả lock trước khi namespace rỗng | Gate `kill(-1)` + reap tới `ECHILD` rồi mới publish; adopt kiểm thêm không còn process nào trong PID namespace của attempt | 9.3 điểm 7 |
| R3-9 | Thiếu vector rò qua shell/filter/process nền và điều kiện kiểm lại khi đổi git/host/driver | Vector bắt buộc + dấu vân tay runtime, đổi thì tắt mượn tới khi xanh lại | 6.1.1 điểm 8 |
| R3-12 | `allocationGrace` và policy retain thiếu nguồn cấu hình/mặc định/check | `terminal.allocationGraceMs`, `terminal.retainFailedPaneMs`, setup + doctor trước khi bật `terminal` | 7.9 điểm 4 |

Ghi chú về độ tin cậy của Argon vòng 2: bảng kiểm vòng 1 của Argon có nhiều dòng nói về nội dung **không có** trong bản r1 (§8.4, §8.6, "trần chờ 15 phút", `probe_pane_cleanup_tree.py`, `.min-protocol-version`, C5). Em không dựa vào các dòng đó. Mọi phát hiện R4 được nhận ở trên đều đã đối chiếu source hoặc logic của bản r1.


**Vòng 3, kongming** trên r3 (`bf601456f`), [báo cáo](red-team-kongming-261016-1018-lock-and-run-supervisor-foundation-v3-r3-review.md): **duyệt có điều kiện**; 4.2 bắt đầu được; 11/12 phát hiện vòng 1 đóng, K3 đóng một phần vì M1. Xử lý ở r4:

| Mã | Xử lý | Ở đâu |
|---|---|---|
| M1 `--die-with-parent` ở `direct` giết agent khi supervisor chết | Nhận: chỉ ở `terminal`; test qua bwrap thật | 9.3 điểm 3, 11/6.2 |
| M2 gate không phải pid 1; pid 1 bỏ qua SIGTERM | Nhận: `--as-pid-1`, handler SIGTERM/SIGINT, `waitpid(-1)` liên tục | 9.3 điểm 3 |
| M3 kiểm peer theo pid luôn hỏng (pid 0 qua namespace) | Nhận: uid + `attemptId`/digest | 9.3 (socket) |
| M4 vân tay runtime → tắt mượn tự chặn commit của fgOS | Nhận: doctor `lock-borrow-vectors`, đỏ = FAIL, không chế độ không mượn | 6.1.1 điểm 8 |
| M5 gác exec ném ngay từ release đầu | Nhận: trace → cảnh báo → ném | 6.6 |
| N1 monitor bwrap bị báo là holder lạ | Nhận | 6.1.1 điểm 5 |
| N2 bước sau receipt kế thừa fd | Nhận (cắt) | 9.6 |
| N3 quét inode namespace | Nhận: `is_empty` = `judge(gate) == dead`; quét chỉ chẩn đoán | 9.3 điểm 7, 5.3 |
| N4 process trong namespace đọc record host thiếu `pidNs` | Nhận | 5.1 |
| N5 bind thư mục socket runtime | Nhận | 9.3, 11/6.2 |
| N6 quét adopt dùng `LOCK_SH` | Nhận | 6.0, 9.7 |
| N7 khe cwd trước commit writes (có sẵn) | Nhận làm việc hoãn có tên | 11 |
| N8 PDEATHSIG ở gate là tàn dư | Nhận (bỏ) | 9.3 điểm 4 |
| KISS: cắt dispatch cwd phạm vi máy khỏi track | Nhận | 6.8 bước 5, 11 |
| Câu mở 1–3 (cha của bwrap ở `terminal`; `TIOCSCTTY` khi shell pane còn giữ tty; reap liên tục) | Câu 3 đã vào 9.3. Câu 1, 2 là probe bắt buộc của 6.3 | 11/6.3 |

Không bác mục nào của kongming vòng 3.

**Yêu cầu mới của anh (2026-10-16): chạy tốt trên Linux, macOS, Windows.** Thêm cổng lock 6.0 và cổng chứa 5.3, mỗi cổng một driver mỗi OS, khai báo mức bảo đảm, doctor báo mức; bỏ mọi chữ "fail trên Windows"; spike X1, X2 đo trước khi viết driver (11).

**r5, theo đo trên máy thật:** khe "lock nhả trước khi job chết xong" trên Windows sửa bằng luật 6.0.1 ở mức cổng (cùng dạng với luật Linux "gate bị SIGKILL"); X1/X2 ghi kết quả; ma trận 6.1.2 đổi từ "spike" sang số đo. Chờ team lead mở rộng probe với ba ca của 6.0.1 và chạy lại.

## 15. Bất đồng còn lại

- **Chứa process ngoài Linux.** Linux dùng PID namespace qua bwrap (không thêm phụ thuộc, đã đo). Windows dùng Job Object (mức kernel, chờ spike X1). macOS chỉ có mức `best-effort`: process tách ra bằng `setsid` + fork đôi về `launchd` thoát khỏi cây; trên macOS "lock trống" không chứng minh không còn writer. Em không tìm được cơ chế mức kernel trên macOS mà không thêm phụ thuộc (endpoint security cần entitlement); ghi thẳng mức và báo ở doctor.
- **Nhánh mồ côi ở `terminal`.** Kongming đề xuất hoặc thêm nhánh mồ côi hoặc fail-stop cho `terminal`. Em chọn nhánh mồ côi (một `if` trong gate). Nếu đo thực tế thấy outbox có thể xuất hiện trước khi agent ghi xong (ghi nhiều bước), quay lại fail-stop cho `terminal`.
- **Hook borrower** (6.4): khe "NB thành công khi không ai giữ" không bịt được bằng kernel; em chấp nhận vì chỉ xảy ra khi API có lỗi lập trình.

## 16. Quyết định của anh

1. **Unit có controller chết: chờ `--resume` tường minh** (anh quyết 2026-10-16, phương án (a)). Khi controller chết, attempt vẫn được settle, credential vẫn được trả (9.6); các bước của unit sau attempt (runner commit phần `writes`, vòng reviewer, attempt kế, `unit-summary.json`) chờ người hoặc workflow runner gọi `--resume`; resume dùng kết quả cũ, không chạy lại. `inspect` hiện "attempt đã settle, unit chờ resume". Ctrl-C (SIGINT/SIGTERM) của controller gửi `cancel` cho supervisor; chỉ controller chết bất thường mới để attempt chạy tiếp. Không tự đi tiếp trong đợt này.

## Phụ lục A. Chạy lại probe

Từ [bundle](design-261015-2103-lock-and-run-supervisor-foundation-v3-probes.json) và [bundle r1](design-261016-0122-lock-and-run-supervisor-foundation-v3-r1-probes.json) (thêm `probe_pidns_containment.py`, `probe-ledger-fence-generation.mjs`, `probe_herdr_geometry.py`; `probe_herdr_geometry.py` tạo rồi đóng một tab herdr thật): tạo một thư mục tạm mới, ghi từng mục của trường `files` ra đúng tên, rồi chạy `node probe-kernel-lock.mjs`, `node probe-hot-reclaim.mjs`, `node probe-tombstone.mjs`, `node probe-tombstone-events.mjs`, `python3 probe_terminal_gate_fd_passing.py`, `python3 p3_gate_probe.py`, `node p4-controller-crash-probe.mjs`, `node p5-kernel-lock-stress-and-ledger-no-gc.mjs`, `node p6-quiescent-raise.mjs`, `node probe-era-ledger.mjs`, `node probe-grant-gate.mjs`, `node probe-supervisor-crash.mjs`. Cần `flock` (util-linux), `git`, Python ≥ 3.9. Probe import chỉ-đọc vài file `src/` theo đường dẫn tuyệt đối của repo; đổi prefix nếu chạy ở máy khác. Không chạy với cwd là `.fgos` thật. `probe-tombstone.mjs` cần bản sao W1' ở `v1-w1/` (tạo bằng `git show worktree-agent-a068b1ed9ad8afeb2:<file>`), hoặc bỏ biến thể đó.

## Phụ lục B. Phương án không chọn, có probe

1. **Ledger có GC theo "era"** (`era-ledger.mjs`, `probe-era-ledger.mjs`). Nếu phải giữ ledger cho mutex, đây là cách sửa B1 em chứng minh được: không bao giờ xoá trong một thư mục còn tới được; GC = holder chuyển ledger sang era mới (bản sao record của mình), đổi con trỏ `current`, rồi xoá era cũ; post-check đọc lại con trỏ. Era mang boot id trong tên nên sau reboot mọi record của era cũ chết mà không đọc nội dung, không mtime. Kết quả: ca "holder chuyển era rồi chết, contender cũ link vào era cũ trong lúc D giữ era mới": **có** post-check một holder, **không** post-check hai holder; stress 6×60 (×3) và 12×80 với chuyển era mỗi 3 lần: 0 vi phạm, post-check bắt 1–8 lần link vào era không còn tới được; owner sống mtime năm 2000 → `held`; record hỏng → `held`; boot khác → giành được và chuyển era. Không chọn vì kernel lock bỏ hẳn cả lớp vấn đề.
2. **Gate chờ GO qua pipe + `.bound` cho ledger** (`probe-grant-gate.mjs`): thứ tự bản 2 (con chạy ngay) → 9 lần ghi sau khi contender giành; có gate → 0. Kiểm tuple đầy đủ từ chối pid đúng mà startTime sai; kiểm pid-only chấp nhận. Không chọn vì mượn qua description không có khe.
3. **Gate giết agent khi supervisor chết** (`probe-supervisor-crash.mjs`), xem 12.2.
