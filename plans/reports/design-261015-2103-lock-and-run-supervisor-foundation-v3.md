# Thiết kế nền bản 3: holder-lock, terminal-control, agent-protocol và run supervisor

- Ngày: 2026-10-15. Người viết: em (Lead, Claude Opus 5.5). Trạng thái: **thiết kế đề xuất**, chưa phải plan triển khai. Các quyết định của anh ghi trong brief là ràng buộc; bản này thiết kế quanh chúng.
- Gộp hai đầu việc: **4.1** (lock bản 3, sửa B1–B9 của [phản biện vòng 2](red-team-astra-round2-261015-1859-lock-and-identity-foundation-design-v2-review.md)) và **6.1** (run supervisor), cùng thiết kế component **6.5 terminal-control**. Thay [bản 2](design-261015-1814-lock-and-identity-foundation-lead-design-v2.md) ở phần lock; phần identity resolver (5.1) do lead riêng làm.
- Đầu vào: [kiểm kê lock](research-261015-1731-lock-inventory-and-standardization.md), [phản biện vòng 1](red-team-astra-261015-1812-lock-and-identity-foundation-design-review.md), [T8](spike-t8-261015-1841-controller-crash-during-herdr-and-cli-runs.md), [S2](spike-s2-261015-1818-reaper-fence-acceptance-tests.md), [S1](spike-s1-261015-1818-writer-id-consumer-inventory.md), [S6](spike-s6-261015-1638-rust-identity-call-latency-pre-commit-hook.md), [S7](spike-s7-261015-1859-human-opened-pane-identity-observation.md), [kết luận hội đồng](architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md) (mục 2, 3, 5, 6.2), đề xuất supervisor của panelist-1 (`.fgos/assignments/unit-run-1792051281308-0c298779/panelist-1/1/runs/01/outbox/report-1.md`), [research herdr gốc](research-261015-1116-herdr-tab-pane-layout-and-naming.md).
- Source đối chiếu tại HEAD `2c2114d06` (main, đã có bản vá IPC `7f1f4c2d2` và bản vá reaper gọn `6ce17f136`). W1' (`a72d263bc`, `49cfc4be3`) đọc trên nhánh `worktree-agent-a068b1ed9ad8afeb2`, chưa vào main lúc viết.
- Bằng chứng: probe đa process chạy thật trong thư mục tạm, không chạm `.fgos` thật (mục 12). Mã và kết quả nằm trong [bundle probe](design-261015-2103-lock-and-run-supervisor-foundation-v3-probes.json).
- Component boundary: bản này **đổi** bản đồ component (thêm process-facts, holder-lock, terminal-control, agent-protocol, run supervisor). [component-boundary.md](../../docs/platform/component-boundary.md) chưa sửa; việc sửa nằm ở wave đầu tiên có code (mục 11, 4.2).

## 1. Tóm tắt

**Thay đổi lớn nhất so với bản 2: lock không còn là ledger trên đĩa, mà là lock của kernel.** Mỗi mutex/lease là một `flock` trên một *open file description* mà process giữ. Process chết thì kernel nhả. Không còn phán sống/chết, không TTL, không record cần dọn, không GC. Bốn phát hiện của vòng 2 (B1 GC, B3 khe spawn→bind, B7 mtime, B8 helper timeout) **biến mất do cách xây**, không phải nhờ thêm luật. Ledger chỉ còn ở run control (epoch để fencing), không GC, chỉ holder ghi.

Bản này quyết:

1. **Holder-lock** = một component, mọi lock là một *kind*: `mutex`, `lease`, `fenced-lease` (kernel lock + epoch ledger), `beacon` (không phải lock). Mượn quyền = truyền đúng description cho đúng một process con lúc spawn. Không có khe nào để con chạy mà chưa giữ lock.
2. **Đường nóng** (`events.lock`, `claims.lock`) gộp thành **một** mutex nóng, chạy trong process Node tới khi use-case store sang Rust. Giữ fast path link/unlink hôm nay; chỉ việc dọn holder chết đi qua một kernel lock. Bất biến trong vùng găng nóng được viết thành luật đo được (6.6).
3. **Đổi phiên bản** bằng quiescence có kiểm soát + **bia mộ** (tombstone): thay file lock cũ bằng một thư mục. Code cũ mọi phiên bản gặp `EISDIR` và dừng, không cần hợp tác. Đây là sàn launch vật lý (6.8).
4. **Bốn component** một chiều: process-facts → holder-lock → terminal-control → agent-protocol → run supervisor → Execution Core. Session-identity là anh em của holder-lock, không ai cấp quyền lock theo writer id.
5. **terminal-control** là component nền thật: ghi đúng một thứ (attempt ↔ slot lúc cấp), mọi thứ khác đọc sống từ herdr/OS. Cổng trên theo attempt id, cổng dưới là driver có khai báo khả năng.
6. **Run supervisor**: một process cho mỗi attempt, là chủ attempt. Hai cách khởi động `direct` và `terminal`; sau khi khởi động, canh giống hệt. Không IPC với controller. Một **cổng chạy (gate)** là gốc process của agent: giữ lock attempt, có trần giờ cứng, ghi kết quả thoát. Supervisor chết thì agent vẫn xong việc và attempt vẫn được nhận kết quả, không trả tiền model lần hai.
7. **Reaper** chỉ còn một câu: lock attempt có ai giữ không (kernel trả lời). Các trường pane/endpoint/binder của bản vá reaper tạm bị xoá ở 6.3.
8. **Settle khi controller chết**: supervisor chạy các bước "sau receipt" do Execution Core chuẩn bị sẵn (settle attempt, finalize home + trả credential). Supervisor cũng chết thì cửa **adopt** (resume / recover / quét đầu mỗi `fgos run`) làm thay, từ bằng chứng trên đĩa.
9. **Rust-first thực tế**: helper lock là route Rust ngay từ 4.2; supervisor và gate là route nội bộ của host Rust (6.2); terminal-control và agent-protocol sang Rust ở 6.3/6.5. Node chỉ chuẩn bị và giao một envelope.
10. **Một state root**, đúng công thức `store.rs`; host Rust phân giải một lần và truyền xuống (6.9).

## 2. B1–B9 → trả lời → bằng chứng

| # | Phát hiện vòng 2 | Bản 3 trả lời | Ở đâu | Bằng chứng |
|---|---|---|---|---|
| B1 | Post-check chọn nhầm thế hệ cao nhất khi GC chen giữa LIST và READ | Mutex/lease không còn ledger, không GC. Run-control ledger giữ, **không GC**, chỉ holder của kernel lock ghi | 6.1, 6.7 | Kernel stress (12.1); P5b: lịch B1 trên ledger không GC → stale link `EEXIST` (12.6). Phương án ledger có GC theo "era" vẫn giữ làm phương án dự phòng có probe (Phụ lục B) |
| B2 | Hàng rào dựa trên lock v1; drain chỉ là ảnh chụp | Quiescence kiểm bằng quét process (không chỉ "file lock vắng") + tombstone thư mục làm code cũ fail-closed + sàn phiên bản ở activation | 6.8 | Tombstone với code v1 thật (main và W1'), cả `events.lock`: mọi lời gọi `EISDIR`, tombstone còn nguyên (12.5). P6: file v1 đã vắng mà holder v1 bị dừng vẫn còn; chỉ quét process bắt được (12.5) |
| B3 | Git chạy trước khi grant được gắn; cha chết làm mất bảo vệ | Con nhận description lúc fork. Không có khe. Hook kiểm bằng kernel: đúng file + try-lock trên description kế thừa thành công | 6.4 | Git thật + hook thật, owner bị SIGKILL ngay sau spawn: hook là borrower, contender bị chặn suốt lúc git chạy, anh em cùng env bị từ chối, git commit xong, sau đó contender giành được (12.1 ca 5) |
| B4 | W1 mở cuộc đua checkpoint dưới merge-slot với land | W1' đã bọc checkpoint dưới slot bằng main mutex v1 (`a72d263bc`). v3 giữ: checkpoint **nhận handle**, không tự acquire | 6.10 | Commit W1'; luật handle ở 6.5 |
| B5 | Rank theo process phá dispatch song song và checkpoint lồng | Mỗi acquire là một description mới → hai transaction cùng process loại trừ nhau bằng kernel. Thứ tự kiểm theo `LockScope` truyền tường minh, không theo process. Checkpoint nhận handle | 6.5 | Cùng process hai description: lần hai `held`, đóng lần một thì lần hai được (12.1 ca 2) |
| B6 | Prime identity chưa đủ; `currentHead` exec trong `events.lock`; driver macOS spawn `ps` | Bất biến chính xác cho vùng găng nóng: hàm đồng bộ, không subprocess, không chờ lock khác, chỉ thao tác fs dưới state root. HEAD lấy **trước** lock, truyền SHA tường minh. Liveness không bao giờ được hỏi trong vùng găng nóng | 6.6 | Source: [`claim-port.mjs:318`](../../src/runner/claim-port.mjs) gọi `currentHead` trong khối `withEventsLock` (dòng 301). Gác spawn ném lỗi là hành vi production, không phải nhánh test |
| B7 | `mtime < boot` không phải bằng chứng chết | Không dùng mtime ở đâu cả. Kernel lock không cần phán chết. Nơi còn phán (fast path nóng, binding supervisor) dùng boot id của kernel + startTime; record hỏng = không rõ = giữ | 5.2, 6.6 | Probe: owner sống có mtime năm 2000 → `held`; record hỏng → `held` (Phụ lục B) |
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
L5  Execution Core (bind, dispatch, workflow runner, fgos run, adopt/resume)     Node hôm nay
       |  cấp slot, chuẩn bị envelope, giao attempt, settle unit
L4  run supervisor  (route nội bộ của host Rust) + launch gate                   Rust (6.2)
       |                 |                     |
L3  agent-protocol   terminal-control     confinement (prepare / finalize)        Rust (6.3, 6.5); confinement Node sau cửa
       |  (cổng IO riêng, supervisor nối vào terminal-control hoặc pipe)
L1  holder-lock                      session-identity (5.1 resolver, mint id)     Rust crate + facade Node
L0  process-facts (đọc)  |  process-control (gate, gửi signal theo identity)       Rust; leaf đọc Node giữ cho đường nóng
    ---------------------------- kernel / OS / herdr / git -----------------------------
```

Luật: chỉ gọi xuống. Không tầng dưới nào import tầng trên. Supervisor chạy "bước sau receipt" do L5 chuẩn bị (9.6): đó là lệnh mờ trong envelope (đảo phụ thuộc theo kiểu cổng), supervisor không biết nó làm gì.

Agent-protocol không phụ thuộc terminal-control. Nó khai báo một cổng IO nhỏ (`send`, `read`, `activity`). Supervisor nối cổng đó vào terminal-control (cách `terminal`) hoặc vào pipe của chính nó (cách `direct`). Nhờ vậy agent-protocol thuần logic, test bằng fixture màn hình.

### 4.2 Bảng thẩm quyền

| Component | Quyết định duy nhất / ghi | Không bao giờ | Phụ thuộc | Hôm nay → đích |
|---|---|---|---|---|
| process-facts (L0 đọc) | Sống/chết/không rõ của một tuple `{host, bootId, pidNs, pid, startTime}` | Spawn, kill, đọc mtime | OS | [`process-identity.mjs`](../../src/runner/dispatch/process-identity.mjs) → crate `fgos-process` mô-đun `facts` |
| process-control (L0) | Gate (gốc process của agent), gửi signal sau khi kiểm identity (pidfd trên Linux), subreaper | Biết run, lock, pane | facts | Rải trong `detached-run-supervisor.mjs`, `herdr-round.mjs` → crate `fgos-process` mô-đun `control` |
| holder-lock (L1) | Ai giữ tài nguyên nào; epoch của fenced-lease; thứ tự lock trong một scope | Đọc writer identity; giành từ holder sống | L0, kernel | 11+ lock tự cài → crate `fgos-holder-lock` + facade Node |
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
| pid không tồn tại (ESRCH) | dead |
| pid tồn tại, startTime khớp | alive |
| pid tồn tại, startTime khác | dead (pid tái dùng) |
| Không đọc được startTime (thiếu driver, quyền, timeout) | unknown |

Nguồn boot id có thẩm quyền: Linux `/proc/sys/kernel/random/boot_id`; macOS `sysctl kern.bootsessionuuid`; Windows không có boot id, dùng creation time của process (FILETIME, không trùng khi pid tái dùng). Không bao giờ suy boot từ đồng hồ trừ uptime, không bao giờ dùng mtime (B7).

Leaf đọc không spawn. Driver macOS ở Node không gọi `ps`; thiếu startTime thì `unknown`. Bây giờ facts gần như không còn trên đường quyết định lock (kernel lo); nó còn dùng cho: binding supervisor/gate, fast path nóng tạm thời, hiển thị.

### 5.2 Control

- **Gửi signal theo identity:** Linux dùng `pidfd_open` → kiểm startTime → `pidfd_send_signal`, không có khe tái dùng pid. Nền khác: kiểm tuple ngay trước `kill`, khe còn lại được ghi rõ.
- **Gate:** mục 9.3. Nằm ở L0 vì cả holder-lock (borrow cho git) và supervisor đều cần "chạy một con sau khi điều kiện đủ". Thực tế ở bản này, borrow cho git không cần gate (fd kế thừa đủ), nên gate chỉ supervisor dùng.
- Reconcile vẫn chỉ được import mô-đun `facts` (luật import-graph hiện có, [`process-identity.mjs:1-8`](../../src/runner/dispatch/process-identity.mjs)).

## 6. Holder-lock v3

### 6.1 Primitive: kernel lock trên open file description

Mỗi tài nguyên có một file `<lockDir>/<name>.lock` (tạo một lần, không bao giờ xoá khi tài nguyên còn). Acquire = mở file thành một description mới, rồi `flock(LOCK_EX)` trên description đó. Release = đóng mọi bản sao của description. Kernel nhả khi mọi process giữ description đã chết.

| Tính chất | Hệ quả |
|---|---|
| Lock thuộc **description**, không thuộc pid | Không tái dùng pid, không boot, không startTime trong quyết định |
| Process chết → kernel đóng fd → nhả | Không TTL, không phán chết, không record cần dọn, không GC (B1, B7 hết) |
| Hai `open()` trong cùng process là hai description, xung đột nhau | Hai transaction cùng process loại trừ nhau; không có re-entry theo pid (B5) |
| Description truyền cho con lúc spawn → con cùng giữ | Mượn quyền không có khe spawn→bind (B3, A4) |
| Kernel trả lời "có ai giữ không" bằng try-lock | Reaper và adopt chỉ cần một try-lock (9.7, 9.8) |
| Không biết ai giữ | Ghi một **record hiển thị** sau acquire (pid, mục đích, lúc nào). Chỉ để xem, không bao giờ để quyết định. Linux: `/proc/<pid>/fdinfo/<fd>` có dòng `lock:` để tìm đúng mọi process đang giữ |

Nền tảng:

| Nền tảng | Primitive | Mượn qua kế thừa | Ghi chú |
|---|---|---|---|
| Linux, fs cục bộ | `flock` | Có (đo, 12.1) | Mặc định |
| macOS | `flock` (BSD, cùng ngữ nghĩa description) | Có theo ngữ nghĩa BSD; chưa đo trên máy thật | Probe chạy trong W4 trước khi bật |
| Windows | `LockFileEx` trên handle | **Chưa chứng minh** | Mutex/lease chạy; khả năng mượn khai báo `unsupported` → checkpoint/hook trên Windows không mượn được (hook fgOS chỉ có ở repo fgOS) |
| NFS/fs mạng | `flock` có thể bị giả lập bằng lock theo process | Không | Từ chối với lỗi rõ. Doctor `lock-kernel-semantics` probe ngữ nghĩa trên chính fs của lockDir |

### 6.2 Các kind

| Kind | Cơ chế | Dùng cho (lock hôm nay) | Phạm vi |
|---|---|---|---|
| `mutex` | kernel lock, giữ ngắn | main checkout, `worktree-admin`, merge slot, sessions, advance, reconcile, recovery, observe shard, activation, install, account provider | repo hoặc máy |
| `lease` | kernel lock, giữ suốt việc dài; có thể truyền cho gate | dispatch cwd, runner, gateway, full-suite, attempt | repo hoặc máy |
| `fenced-lease` | kernel lock + epoch ledger ghi **chỉ bởi holder** | run control (admission, settle) | theo run |
| `hot-mutex` (tạm) | Node trong process: link/unlink + dọn holder chết dưới kernel lock | `events.lock` (đã gộp `claims.lock`) | repo |
| `beacon` | không phải lock | `main-checkout-activity.json` (W1') | repo |
| `terminal-placement` (hoãn) | kernel lock phạm vi máy/herdr-session | chỉ khi S5 bắn (7.6) | máy |

Fenced-lease: vì chỉ holder của kernel lock được ghi ledger, mọi lỗ do GC (B1) không thể có người lạ lấp. Bản 3 vẫn **không GC** ledger run control (mỗi run một thư mục, vài thế hệ; không cần).

### 6.3 Facade Node và helper Rust

Node không có `flock` (không addon). Cách làm, đã đo (12.1):

1. Node `open()` file lock → fd (Node giữ description).
2. Node gọi helper Rust `fgos internal lock-fd --try|--wait-ms N` với fd đó ở stdio slot 3. Helper `flock` description kế thừa rồi thoát. Lock ở lại với fd của Node.
3. Release = `close(fd)`.

Đúng năm điều kiện S6: route native, exec thẳng binary từ `FGOS_HOST_BIN`/activation resolve một lần mỗi process, không qua shim, không exec trong vùng găng nóng, lệch phiên bản thì fail-closed. Chi phí đo với `flock` của util-linux làm vật thế chỗ: p50 1,35 ms, p95 1,58 ms. Helper Rust dự kiến ~3 ms theo S6. Chỉ đường lạnh dùng.

**Timeout (B8):** chờ bằng `spawnSync` với `killSignal: 'SIGKILL'`. Khi `spawnSync` trả về, helper đã chết và đã được reap. Node đóng fd. Kết quả là `not-acquired`, chắc chắn: nếu helper kịp lock trước khi bị giết, đóng fd đã nhả. Không có trạng thái treo. Chờ lâu không chặn event loop: dùng `--try` lặp bất đồng bộ, không `--wait` đồng bộ trong process runner.

**Owner khi gọi qua helper (A9):** owner là description, mà description thuộc caller. Helper không bao giờ là owner. Không cần `--owner-pid`, `getppid()` hay token sinh trước.

Rust gọi `flock` trực tiếp trong process (crate). Rust và Node lock **cùng file**, cùng primitive, nên loại trừ nhau ngay, không cần giai đoạn "hai giao thức" (bản 2 mục 12).

### 6.4 Mượn quyền (B3, A4)

Mục đích: cho `git commit` của checkpoint/merge (có hook bên trong) đi qua mà không bị coi là người lạ. Thay `FGOS_MAIN_LOCK_HOLDER_PID`.

1. Holder spawn git với description của main mutex ở một stdio slot (ví dụ 3), env `FGOS_LOCK_FD=main:3`. Chỉ facade holder-lock được ánh xạ fd lock vào stdio; mọi fd khác của Node/Rust mặc định `CLOEXEC`.
2. Hook kiểm, cả hai đều phải đúng: `fstat(3)` cùng `dev:ino` với file lock; và `flock(3, LOCK_EX|LOCK_NB)` thành công (chỉ thành công khi đó là chính description đang giữ lock). Process anh em có cùng env nhưng tự mở file → try-lock thất bại → bị từ chối.
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

1. Hàm truyền vào là đồng bộ. Trả về thenable → ném `hot-lock-async-body` (hôm nay mọi caller đã đồng bộ; luật biến điều đó thành bảo đảm).
2. Không subprocess dưới bất kỳ hình thức nào. Facade đếm độ sâu vùng găng nóng trong process; mọi helper spawn của fgOS đi qua một hàm kiểm đếm đó và ném `exec-under-hot-lock`. Đây là hành vi production, không phải nhánh test.
3. Không chờ lock nào khác (sau khi gộp không còn lock nóng thứ hai). Không hỏi liveness (dọn holder chết xảy ra lúc acquire, trước khi vào).
4. Chỉ đọc/ghi file dưới state root và tính toán trong process. Đọc `sessions.json` được phép.
5. Mọi giá trị cần exec được lấy **trước** lock và truyền vào: writer identity (prime một lần mỗi điểm vào process), và HEAD. `claimWork` đọc HEAD trước `withEventsLock`, truyền SHA tường minh cho cả tạo worktree lẫn record claim (`headAtTake`). Nhất quán: worktree tạo từ đúng SHA ghi trong claim; HEAD đổi sau đó là chuyện của land (CAS theo SHA), không phải của claim.

**Chi phí:** fast path không đổi (link/unlink ~25 µs). Đường dọn có exec ~1,4 ms nhưng chỉ khi holder chết. **Điều kiện kết thúc** có tên: use-case store ([`store.mjs`](../../src/state/store.mjs), [`events.mjs`](../../src/state/events.mjs), [`runtime-coordination.mjs`](../../src/state/runtime-coordination.mjs)) sang Rust → mutex nóng thành kernel lock trong process Rust (µs), đổi bằng tombstone (6.8).

**Rủi ro còn lại, ghi thẳng:** sau mất điện trên fs không đảm bảo thứ tự dữ liệu, record nóng có thể rỗng → giữ tới khi người fence. Chấp nhận trong giai đoạn tạm; kernel lock ở đích không có rủi ro này.

### 6.7 Fencing và holder sống treo (A8)

- Receiver thật duy nhất vẫn là `settleRunControl` ([`run-lock.mjs:390-452`](../../src/runner/dispatch/run-lock.mjs)). Ở v3 run control là `fenced-lease`: kernel lock attempt (9.4) cho loại trừ, ledger cho epoch. Ledger không GC.
- Main checkout không có receiver: kernel lock không bao giờ bị giành từ holder còn sống, nên không cần fencing.
- **Holder sống mà treo:** `fgos lock fence <name>` (thay `unlock --force`): tìm mọi process đang giữ description (Linux: quét `/proc/*/fdinfo`), hiện ra, hỏi xác nhận, gửi SIGTERM rồi SIGKILL theo identity (5.2). Lock tự nhả khi chúng chết. Không có đường nào giành lock trong lúc holder sống. Nền không liệt kê được holder: người tự dừng process rồi chạy `fence --attest-stopped`, lệnh này chỉ kiểm lại bằng try-lock.

### 6.8 Đổi phiên bản: quiescence + tombstone + sàn (B2, A2, A13)

Mặc định của anh: quiescence có kiểm soát + sàn launch. Cách làm cho mỗi tài nguyên:

1. **R-dual:** release có code v3 nằm im. Code đọc trạng thái bằng `lstat` đường dẫn v1: là **thư mục** → dùng v3; là file hoặc vắng → dùng v1 như hôm nay.
2. **Cutover (một bước vận hành, nằm trong doctor fix `lock-cutover`, không phải verb mới):**
   - Quiescence: không process fgOS nào của workspace còn sống. Linux: quét `/proc/*/cmdline` + `/proc/*/cwd`. macOS/Windows hoặc khi provenance không rõ: báo "chưa chứng minh được quiescence" và cần người xác nhận. **File lock v1 vắng không đủ**: probe P6 cho thấy holder v1 bị dừng quá TTL đã bị người khác giành và unlink mất file, chỉ quét process bắt được (12.5).
   - Đường dẫn v1 không có record sống (record của holder chết được dọn ngay lúc này, vì đã quiescence).
   - Thay đường dẫn v1 bằng **tombstone**: `mkdir` (độc quyền) + file `TOMBSTONE` bên trong, ghi nơi lock mới ở đâu.
   - Ghi `lockProtocolFloor` của workspace. Activation (`fgctl`) từ chối activate release thấp hơn sàn.
3. **Sau cutover:** mọi code v1 (kể cả release cũ, kể cả W1') gặp tombstone thì `EISDIR` ở acquire, inspect, release, releaseIfOwn, forceReclaim, và `withEventsLock`; tombstone không bị xoá (12.5). Đây là sàn launch vật lý, không cần code cũ hợp tác, không cần registry process.
4. **Họ lock có tên theo cwd** (dispatch cwd, chuyển sang phạm vi máy): không tombstone trước được mọi tên. Cutover đặt marker họ `runtime/locks/dispatch-cwd.cutover/`. Code v3 khi acquire một cwd lần đầu đặt tombstone ở đường dẫn v1 của cwd đó. Gặp record v1 ở đó: holder sống/không rõ → HELD; chết → để doctor dọn ở lần quiescence sau, không tự unlink.
5. **Rollback:** chỉ về release ≥ R-dual, bằng cách gỡ tombstone dưới đúng điều kiện quiescence như bước 2. Không bao giờ về dưới R-dual (sàn chặn).
6. Chuyển trong một commit cả bốn caller của dispatch cwd (hai writer [`dispatch/cli.mjs:725-733`](../../src/runner/dispatch/cli.mjs), [`assignment-runner.mjs:2217-2224`](../../src/runner/dispatch/assignment-runner.mjs); hai reader [`execution/run.mjs:345-362`](../../src/runner/execution/run.mjs), [`reconciliation-planner.mjs:197`](../../src/runner/dispatch/reconciliation-planner.mjs)). Guard resume ở `run.mjs` đổi thành try-lock của holder-lock.

Vì tombstone làm code cũ fail-closed bất kể nó làm gì, bước "trung hoà" của bản 2 (code v1 tự kiểm marker) không còn là điều kiện an toàn. W1' đã từ chối record có trường `v` hoặc marker ≠ 1; giữ như một lớp báo lỗi rõ hơn, không dựa vào.

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

cùng hai marker một lần: `launched` (identity process do launch trả) và `released` (disposition). Nơi lưu: `stateRoot/terminal/<driver>/<serverIncarnation>/allocations/<key>.json`. `serverIncarnation` = socket herdr + pid/startTime của herdr server, để không bao giờ dùng nhầm pane id của một server khác.

Mọi thứ khác **đọc sống**: pane còn không, process nào đang chạy trong pane, tab có những pane nào. Một file gợi ý `groups/<groupKey>.json` (tabId) chỉ để tìm nhanh; luôn kiểm sống trước khi dùng, sai thì bỏ.

Không có "holder" của slot trong record. Ai được dùng slot là chuyện của tầng trên: run supervisor giữ lock attempt; slot chỉ có key.

### 7.3 Cổng trên (theo key; với run thì key = attempt id)

| Thao tác | Kết quả |
|---|---|
| `allocate(key, groupKey, display)` | `{slot}` \| `unsupported` \| `unknown` |
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
| `server.incarnation` | socket + pid server | socket + pid server |

Lỗi driver (timeout, lỗi đọc) → `unknown`. Không bao giờ quy `unknown` thành "pane đã đóng".

### 7.6 Đồng thời: phương án (a)

Bên điều phối biết nhóm (dispatch/workflow runner, **một** process cho một nhóm) gọi `allocate` rồi giao attempt cho supervisor. Không daemon, không lock.

Hai bên điều phối cùng `groupKey` (chỉ xảy ra khi tự đặt trùng): có thể sinh hai tab cùng nhãn. Vô hại vì nhãn không phải khoá; mỗi slot vẫn đúng key. Trigger S5 (process không cùng cha phải chung tab: gateway, hai terminal) → thêm kind `terminal-placement` của holder-lock (phạm vi máy) quanh "đọc gợi ý → tách → ghi gợi ý". Phương án (b) chỉ khi S5 bắn.

### 7.7 Ca lỗi

| Ca | Điều gì giữ đúng | Ai dọn |
|---|---|---|
| Điều phối chết trước `allocate` | Chưa có gì | — |
| Điều phối chết sau `allocate`, trước khi giao supervisor | Slot có record, không `launched`. Attempt chưa có lock nên adopt đánh dấu `not-started` | Quét của terminal-control: slot không `launched`, key không còn ai dùng (tầng trên báo qua `release`) hoặc quá `allocationGrace` → đóng pane rỗng. An toàn vì pane không có process launch |
| Supervisor chết khi slot đã cấp, chưa launch | Gate chưa chạy hoặc không kết nối được → không agent nào chạy (12.3) | Adopt `abandoned` → `release(key, close)` |
| `launch` trả về rồi supervisor chết | Gate giữ lock attempt, agent chạy tiếp tới xong hoặc trần cứng (9.3) | Adopt sau khi lock attempt nhả → `release` |
| Slot giữ lại (`retain`) | Giữ tới `until`; không có process nào cần nó | Quét: quá `until` → đóng |
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
| Layout engine theo tỉ lệ màn hình | **Bác** | Chưa đo, tự mâu thuẫn, quên ô viền |
| File lock layout trong repo | **Bác** | Sai với worktree và herdr dùng chung nhiều repo; nếu cần là kind phạm vi máy (7.6) |
| Đọc nhãn pane để suy trạng thái | **Bác** | Hiển thị thành khoá dữ liệu |
| Helper 4 hàm, "85% giống nhau" | **Đổi** | Port phải có `unsupported`/`unknown`/`retain` |
| Map tab trong RAM của process | **Đổi** | Record ghi lúc cấp + đọc sống; RAM chỉ là cache |

### 7.9 Chuyển đổi

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

- giữ lock attempt (lease hạng 15), lease cwd, run control (fenced-lease);
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

### 9.3 Launch gate

Gate là gốc process của agent, dù agent chạy ở đâu:

1. Kết nối tới supervisor. Bị từ chối hoặc EOF trước GO → thoát ngay, **không chạy agent** (12.3 ca 2, 3; P3 ca B).
2. Nhận GO cùng các description lock (attempt, cwd) qua `SCM_RIGHTS` (terminal) hoặc kế thừa (direct). Từ giây này lock attempt được giữ bởi cả supervisor lẫn gate.
3. Đặt `PR_SET_CHILD_SUBREAPER`; spawn agent trong process group riêng với `PR_SET_PDEATHSIG` hướng về gate. Cách `terminal`: group của agent được đặt làm foreground group của tty trong pane (`tcsetpgrp`), để phím và brief đi tới agent. Gate gửi identity của agent cho supervisor qua socket; `terminal-control.launch` chỉ trả identity của gate (gốc process trong pane).
4. Trần giờ cứng = `deadline + grace` đọc từ envelope (có digest). Hết trần thì giết cả cây. Đây là chốt an toàn khi supervisor đã chết, không phải deadline thứ hai: deadline mềm và idle vẫn do supervisor.
5. Agent thoát → giết con cháu còn sót → publish `gate-exit.json` một lần `{exitCode, signal, stoppedBy, descendantsKilled}` → thoát. Lock attempt nhả khi supervisor và gate đều đã đóng.

Giới hạn `sun_path` (~107 byte Linux, 104 macOS): socket nằm dưới thư mục runtime ngắn (`$XDG_RUNTIME_DIR/fgos/` hoặc `/tmp/fgos-<uid>/`) với tên băm của attempt. Probe gặp đúng lỗi này với đường dẫn dài (12.3).

**Chính sách khi supervisor chết: agent chạy tiếp** tới khi thoát hoặc chạm trần cứng; lock attempt vẫn giữ nhờ gate nên không ai giành cwd hay home. Lựa chọn còn lại (gate giết agent ngay khi supervisor chết) đơn giản hơn một chút nhưng mất việc model đã làm; em chọn chạy tiếp vì loại trừ vẫn đúng và trần cứng giới hạn thời gian. Cả hai đã có probe (12.2 và Phụ lục B).

### 9.4 Giao attempt: controller → supervisor

1. Execution Core chuẩn bị: bind, `confinement.prepare` (prepared invocation có digest), `terminal-control.allocate` (cách `terminal`), mint attempt id. Ghi **envelope v3** bất biến có digest: mode, key slot, launch spec, deadline mềm/idle/trần, protocol id, đường dẫn brief/outbox, bước sau receipt, secrets ở side file 0600 (như envelope v2 hôm nay).
2. Mở và acquire lock attempt (kernel, try). Không được → có attempt khác đang chạy → từ chối.
3. Spawn supervisor bằng binary host (`FGOS_HOST_BIN`, resolve một lần) với description lock ở fd 3: `setsid`, stdio vào file, **không IPC** (bài học T8: lỗi `ERR_IPC_CHANNEL_CLOSED`).
4. Chờ `supervisor-binding.json` (identity supervisor). Không thấy trong thời hạn → giết theo identity nếu có, đóng fd, attempt `not-started`.
5. Controller đóng fd lock của mình hoặc giữ để quan sát (giữ cũng không hại: nó là thành viên attempt). Đọc tiến độ từ file (capture, heartbeat). Đọc receipt khi có.

Không exec nào trong vùng găng nóng: mọi bước trên nằm ngoài `state`.

### 9.5 Deadline

- Deadline mềm và idle: supervisor. Hết giờ → SIGTERM gate (gate giết cây), receipt `timeout`.
- Trần cứng: gate (9.3).
- Phục hồi không bao giờ gia hạn: deadline là mốc tuyệt đối ghi trong envelope. Reboot thì mọi process chết, không cần gia hạn.

### 9.6 Receipt và bước sau receipt

- Receipt: kết quả vật lý `{outcome, gateExit, capture digests, outbox present?}`, publish một lần (link). Receipt không phải kết quả công việc.
- **Bước sau receipt** là lệnh mờ trong envelope, supervisor chạy làm con (con kế thừa lock attempt):
  1. `settle-attempt`: cửa của Execution Core, chạy Run Result Evaluator, ghi `exit.json`/`evidence.json`/`result.json` ([`settlement.mjs`](../../src/runner/dispatch/settlement.mjs)) và `settleRunControl` (CAS).
  2. `finalize-home`: cửa của confinement, dọn home và trả credential (`credentialWriteBack`, [`provider-credential-renewal.mjs:1165`](../../src/runner/dispatch/provider-credential-renewal.mjs)).
- Vì vậy khi controller chết, attempt vẫn được settle và credential vẫn được trả, không cần ai resume (T8 mục 6, ý 3 và 4).
- **Không** làm ở đây: bước của unit (commit writes của runner, `unit-summary.json`, vòng reviewer, attempt kế). Những việc đó thuộc controller, hoặc `--resume` nhận attempt đã settle và đi tiếp (9.7). Unit có controller chết hiện `attempt settled, unit chờ resume` ở `inspect`.

### 9.7 Adopt: resume, recover, quét

Một cửa duy nhất, gọi từ `fgos run --resume`, `fgos dispatch recover`, và quét đầu mỗi `fgos run` (cùng chỗ reaper chạy hôm nay, [`run.mjs:315`](../../src/runner/execution/run.mjs)):

1. Try-lock attempt. Đang giữ → có thành viên sống (supervisor/gate/controller) → giữ nguyên, báo `running`. Không bao giờ chạy attempt thứ hai cho cùng việc.
2. Lock trống, đã có `result.json` → không làm gì.
3. Lock trống, chưa settle: giữ lock (kernel), acquire run control (epoch mới), publish receipt từ bằng chứng nếu chưa có (`gate-exit`, outbox), chạy hai bước sau receipt, đóng attempt `settled` hoặc `abandoned` (không có bằng chứng agent đã chạy).
4. `--resume` của unit dùng attempt đã settle như kết quả, **không chạy lại** (sửa T8 mục 4.4: hôm nay resume chạy lại từ đầu và bỏ kết quả attempt 01). `supersedesRunId` chỉ ghi khi thật sự launch attempt mới.
5. Ai đóng attempt treo `running`: chính cửa này. Hai adopter cùng lúc: kernel lock cho đúng một (P4 ca E).
6. `recover` không còn park vì "unrecognized evidence result-1.json" (T8): `outbox/result-N.json` là bằng chứng có tên trong contract của adopt.

### 9.8 Reaper rút gọn

- Home thuộc attempt. Reaper: try-lock attempt. Đang giữ → giữ home, bất kể herdr nói gì. Trống → giữ lock trong lúc dọn (không ai bắt đầu dùng được), rồi chạy `finalize-home` nếu adopt chưa chạy.
- OQ2 của anh (liveness không rõ + credential quá hạn → hạn thắng; không bao giờ áp cho run đang sống): chỉ còn áp ở nơi kernel không trả lời được (nền không có kernel lock, fs mạng). Ở đó trạng thái lock là `unknown` → theo hạn. Run có lock đang giữ không bao giờ bị áp.
- **Xoá ở 6.3** (bản vá reaper tạm, `6ce17f136`): `bindOwnershipMarker`, `markOwnershipLaunched`, `LAUNCH_GRACE_MS`, `OWNERSHIP_BINDING_FIELDS` ([`cleanup.mjs:138-180`](../../src/runner/dispatch/confinement/cleanup.mjs)); luật binder/pane trong `reapOrphanedConfinementResources` (465 trở đi) và nhánh đọc lại marker (586); `defaultPaneOpen`, `paneOpenUnlessClosed` (403, 434) và lượt dọn sau probe ở [`dispatch/cli.mjs:1230`](../../src/runner/dispatch/cli.mjs); `herdrEndpointForEnv`/`envForEndpoint` nếu không còn ai dùng ([`worker-session.mjs:84,97`](../../src/runner/dispatch/worker-session.mjs)); `bindingForPrepared` và phần bỏ qua trường binding khi so digest ở finalizer (`authority.mjs`). Test S2 viết lại theo luật mới: các ca đỏ tái hiện "xoá home của worker sống" phải xanh theo cách xây (lock giữ ⇒ không xoá); các ca todo của part (ii) bị bỏ vì không còn khe để chặn.

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
| Controller | Giữ (supervisor + gate) | Chạy tiếp | Supervisor | Supervisor + bước sau receipt | Giữ tới finalize | Không cần ai (12.2 A, P4 A) |
| Supervisor | Giữ (gate) | Chạy tới xong hoặc trần cứng | Trần cứng của gate | Adopt từ `gate-exit` + outbox | Giữ tới adopt | Adopt (P4 B, D) |
| Gate | Giữ (supervisor) | PDEATHSIG giết agent | — | Supervisor: `gate-lost` | Supervisor finalize | Supervisor |
| Agent | Giữ tới gate thoát | — | — | Bình thường | Finalize | Supervisor |
| Supervisor + gate (vd. `kill -9` cả nhóm) | Nhả | PDEATHSIG giết | — | Adopt: `abandoned` hoặc từ outbox nếu agent đã ghi | Adopt finalize | Adopt |
| herdr server | Giữ | Mất theo pty | — | Supervisor: `carrier-lost` | Finalize | Supervisor; quét record incarnation cũ |
| Reboot | Nhả (kernel) | Chết | — | Adopt khi `fgos run` kế | Finalize | Adopt |
| Đồng hồ nhảy | Không ảnh hưởng (kernel) | — | Deadline dùng đồng hồ đơn điệu trong process; trần cứng trong gate cũng vậy | — | — | — |

## 11. Lộ trình

Mỗi đầu việc: thay đổi, **xoá** (One Door), **bằng chứng trước writer đầu tiên**, doctor/setup/CHANGELOG **ngay trong đầu việc đó**.

**4.0 (W1', đang tích hợp).** Đã đóng kẹt 180 s và B4. Không đổi.

**4.2 Holder-lock (plan).**
- Thay đổi: crate `fgos-process` (facts + control) và `fgos-holder-lock`; route nội bộ `fgos internal lock-fd`, `fgos internal state-root`; facade Node (`LockScope`, kind, record hiển thị, mượn qua fd); spec `docs/specs/holder-lock.md`; cập nhật [component-boundary.md](../../docs/platform/component-boundary.md). Chuyển các lock lạnh rủi ro thấp sang kernel lock, mỗi lock một commit với tombstone: gateway, sessions, runner, advance, reconcile, recovery, full-suite, account provider. Rồi dispatch cwd sang phạm vi máy (6.8 bước 4, 6).
- Xoá: bản chép `isPidAlive` ở từng lock; regex composite ở reconcile; GC trade-off của provider-capacity (không còn ledger mutex).
- Bằng chứng trước writer: probe 12.1 thành test đa process trên crate thật (giữ sau helper thoát, cùng process hai scope, SIGKILL, timeout, mượn qua git thật, anh em bị từ chối, stress có SIGKILL); tombstone với code v1 thật; vector state root.
- Doctor/setup/CHANGELOG: `lock-kernel-semantics` (fs của lockDir có đúng ngữ nghĩa description), `lock-cutover` (fix có quiescence), `state-root`; setup tạo `stateRoot/locks`; CHANGELOG mỗi lần đổi phạm vi.

**4.3 Main checkout + đường nóng (plan).**
- Thay đổi: main mutex sang kernel lock; `withMainCheckout` + `checkpointMainFgos(handle)`; reset trong mutex; promote-engine dưới slot bên ngoài; mượn qua fd thay `FGOS_MAIN_LOCK_HOLDER_PID`; `worktree-admin`; gộp `claims.lock` vào `state`; record nóng có startTime/bootId; dọn holder chết dưới kernel lock; bất biến 6.6 (gác async, gác spawn); HEAD lấy trước lock; kiểm trần trong `state`; thu hẹp vùng claim — trần và thu hẹp trong **một** commit.
- Xoá: `HOLDER_PID_ENV_VAR`, `allowSelfRecognition`, `forceReclaimAmbiguousLock`, nhánh 30 s của `claims.lock`, `withClaimsLock`.
- Bằng chứng: hai land loại trừ; checkpoint dưới slot vs land; hook từ chối khi land giữ; commit tay ↔ land ở khe `update-ref`/`read-tree`, có/không hook; staged-but-uncommitted; mượn: hai con cùng env, cha chết khi git chạy; hai item tranh slot cuối; A1 trên mutex nóng; test gác spawn bắt `currentHead` cũ; benchmark round thật (fast path không đổi).
- Doctor/CHANGELOG: `fgos lock fence` thay `unlock --force` (verb `unlock` và skill `fgos-unlock` đổi theo); `lock-record-unreadable`; CHANGELOG.

**4.4 Rust callers (plan).** `fgctl` ([`lock.rs`](../../packages/distribution/rust/src/lock.rs), activation lock trong `init.rs`), `install.lock` ([`store.rs:24-57`](../../packages/distribution/rust/src/store.rs)), observe [`store_lock.rs`](../../packages/observe/rust/src/store_lock.rs) và shard dùng crate; driver macOS/Windows; probe macOS mượn qua kế thừa. Xoá phép đọc `main-checkout.lock` của `fgctl` (thay bằng try-lock). Bằng chứng: cargo test cùng vector; một writer Node + một writer Rust trên cùng file lock. CHANGELOG.

**4.5 Doctor/registry (code).** Registry mọi lock (kind, phạm vi, hạng, đường dẫn) là nguồn duy nhất cho `lock-status`, doctor và spec; dọn `dispatch.claim`, check `*.claim`, spec `runner.md` lệch TTL; sàn `lockProtocolFloor` trong activation.

**6.0 (xong).** IPC (`7f1f4c2d2`), reaper gọn (`6ce17f136`). Là vá tạm; 6.3 xoá phần reaper.

**6.2 Supervisor Rust + `direct` (plan, cần 4.2).**
- Thay đổi: route `supervise` và `gate`; envelope v3; lock attempt; bước sau receipt; adopt; `direct` cho CLI headless. `cliSpawnAdapter` ([`transport.mjs:381`](../../src/runner/dispatch/transport.mjs)) giao envelope thay vì tự chạy supervisor Node.
- Xoá: `detached-run-supervisor.mjs` phần chạy (giữ đọc artifact cũ một release theo luật dữ liệu sống), kênh IPC ([`detached-run-supervisor.mjs:866`](../../src/runner/dispatch/detached-run-supervisor.mjs)), `bindConfinedHomesToSupervisor`.
- Bằng chứng trước writer: P4 A–E và 12.2 thành test trên route thật (controller SIGKILL, supervisor SIGKILL, deadline, trần cứng, hai adopter); resume nhận attempt đã xong không chạy lại; T8 chạy lại cho cli: worker sống, settle đủ file.
- Doctor/CHANGELOG: check attempt treo (`running` mà lock trống); CHANGELOG (resume không chạy lại; controller chết không mất kết quả).

**6.3 `terminal` + 5.2 (plan, cần 6.2, 6.5).**
- Thay đổi: cách `terminal` qua terminal-control; agent-protocol Rust; gate trong pane với `SCM_RIGHTS`; mint writer id + scrub + lineage; supervisor làm chủ home.
- Xoá: vòng poll/deadline/đóng pane trong controller (`pollForOutcome`, `killPaneForegroundAndClose`, `settleRound` của [`herdr-round.mjs`](../../src/runner/dispatch/herdr-round.mjs)); toàn bộ phần reaper tạm liệt kê ở 9.8; nhánh reconcile herdr park vì `result-1.json`.
- Bằng chứng: T8 chạy lại cho herdr (hB/hC/hD): deadline thi hành, settle đủ, home không bị xoá dưới agent sống; S2 viết lại xanh hết; 12.3 thành test với herdr thật; 5 CLI qua agent-protocol.
- Doctor/CHANGELOG: `herdr` capability probe qua driver; `docs/io-contract.md` (writer id mỗi attempt); CHANGELOG.

**6.4 Hoàn tất khi controller chết (plan).** Bước sau receipt cho mọi cách; adopt ở `recover` và quét đầu `fgos run`; `inspect` hiện `unit chờ resume`; đóng attempt treo. Bằng chứng: kill controller ở từng cạnh của 9.4; hai adopter; resume sau adopt.

**6.5 terminal-control (thiết kế ở đây → plan, cùng 6.3).** Mô-đun Node ngay (2.3, 2.4 với test hợp đồng), crate Rust ở đợt 4; xoá `createBatchTab`, `batchTabFor`, `closeIfEmpty`, nhãn tự chế; `/fgOS:terminal` sang `attach`/`label`. Bằng chứng: vector 7.4 trên herdr thật (5 CLI), ca lỗi 7.7.

Đường găng: 4.2 → 4.3 → 6.2 → (6.5 ∥ agent-protocol) → 6.3 → 6.4. 4.4 song song sau 4.2. 5.1 song song (lead riêng); 5.2 nằm trong 6.3.

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

### 12.6 Ledger run control không GC (P5b)

Lịch B1 trên `publishNextGeneration` production, không GC: link cũ vào thế hệ 2 gặp `EEXIST`, quyết lại với thế hệ 3, kết quả `held`. Không có lỗ nên không cần post-check.

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

(Điền sau vòng phản biện.)

## 15. Bất đồng còn lại

(Điền sau vòng phản biện.)

## 16. Câu hỏi cho anh

(Điền sau vòng phản biện.)

## Phụ lục A. Chạy lại probe

Từ [bundle](design-261015-2103-lock-and-run-supervisor-foundation-v3-probes.json): tạo một thư mục tạm mới, ghi từng mục của trường `files` ra đúng tên, rồi chạy `node probe-kernel-lock.mjs`, `node probe-hot-reclaim.mjs`, `node probe-tombstone.mjs`, `node probe-tombstone-events.mjs`, `python3 probe_terminal_gate_fd_passing.py`, `python3 p3_gate_probe.py`, `node p4-controller-crash-probe.mjs`, `node p5-kernel-lock-stress-and-ledger-no-gc.mjs`, `node p6-quiescent-raise.mjs`, `node probe-era-ledger.mjs`, `node probe-grant-gate.mjs`, `node probe-supervisor-crash.mjs`. Cần `flock` (util-linux), `git`, Python ≥ 3.9. Probe import chỉ-đọc vài file `src/` theo đường dẫn tuyệt đối của repo; đổi prefix nếu chạy ở máy khác. Không chạy với cwd là `.fgos` thật. `probe-tombstone.mjs` cần bản sao W1' ở `v1-w1/` (tạo bằng `git show worktree-agent-a068b1ed9ad8afeb2:<file>`), hoặc bỏ biến thể đó.

## Phụ lục B. Phương án không chọn, có probe

1. **Ledger có GC theo "era"** (`era-ledger.mjs`, `probe-era-ledger.mjs`). Nếu phải giữ ledger cho mutex, đây là cách sửa B1 em chứng minh được: không bao giờ xoá trong một thư mục còn tới được; GC = holder chuyển ledger sang era mới (bản sao record của mình), đổi con trỏ `current`, rồi xoá era cũ; post-check đọc lại con trỏ. Era mang boot id trong tên nên sau reboot mọi record của era cũ chết mà không đọc nội dung, không mtime. Kết quả: ca "holder chuyển era rồi chết, contender cũ link vào era cũ trong lúc D giữ era mới": **có** post-check một holder, **không** post-check hai holder; stress 6×60 (×3) và 12×80 với chuyển era mỗi 3 lần: 0 vi phạm, post-check bắt 1–8 lần link vào era không còn tới được; owner sống mtime năm 2000 → `held`; record hỏng → `held`; boot khác → giành được và chuyển era. Không chọn vì kernel lock bỏ hẳn cả lớp vấn đề.
2. **Gate chờ GO qua pipe + `.bound` cho ledger** (`probe-grant-gate.mjs`): thứ tự bản 2 (con chạy ngay) → 9 lần ghi sau khi contender giành; có gate → 0. Kiểm tuple đầy đủ từ chối pid đúng mà startTime sai; kiểm pid-only chấp nhận. Không chọn vì mượn qua description không có khe.
3. **Gate giết agent khi supervisor chết** (`probe-supervisor-crash.mjs`), xem 12.2.
