# Thiết kế nền lock + identity, bản 2 (Lead)

- Ngày: 2026-10-15. Người viết: em (Lead, Claude Opus 5.5). Đây là **thiết kế đề xuất**, chưa phải quyết định đã duyệt, chưa phải plan triển khai.
- Bản này thay [bản 1](design-261015-1755-lock-and-identity-foundation-lead-design.md) và tự đứng được: người đọc không cần mở bản 1. Nó trả lời từng phát hiện của [phản biện độc lập gpt-6-astra](red-team-astra-261015-1812-lock-and-identity-foundation-design-review.md) (A1–A14) và 9 câu hỏi cuối của phản biện.
- Đầu vào khác: [kiểm kê lock](research-261015-1731-lock-inventory-and-standardization.md), [kết luận hội đồng](architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md), [spike S6](spike-s6-261015-1638-rust-identity-call-latency-pre-commit-hook.md), [đề xuất Rust-first](proposal-261015-1715-rust-first-component-hook-identity-lock.md).
- Source đối chiếu tại HEAD `2e739d714`. Mọi `file:dòng` tính từ gốc repo.
- Bằng chứng mới: ba probe đa process chạy thật trong thư mục tạm (mục 14, Phụ lục). Probe dùng primitive production (`publishNextGeneration`, `acquireMainCheckoutLock`) qua import chỉ-đọc. Không chạm `.fgos` thật, không sửa source.
- Component boundary: bản này đề xuất component nền mới (process-facts, holder-lock). Bản thiết kế chưa sửa [component-boundary.md](../../docs/platform/component-boundary.md); việc đó nằm trong W2 (mục 13).

## 1. Tóm tắt

**Sẽ xây gì.** Một component holder-lock duy nhất cho mọi mutex và lease của fgOS. Nền của nó là **generation ledger bất biến** đã có trong repo ([`run-lock.mjs`](../../src/runner/dispatch/run-lock.mjs), [`provider-capacity.mjs`](../../src/runner/dispatch/provider-capacity.mjs)). Không còn thao tác nào xoá file lock của người khác để giành quyền. Bên dưới là tầng process-facts trả ba trạng thái sống / chết / không rõ. Writer identity tách hẳn khỏi quyền lock.

**Vì sao.** Hai cách dọn holder chết của bản 1 và của kiểm kê (rename, sidecar) đều mất loại trừ khi người dọn bị dừng giữa chừng. Phản biện chứng minh bằng process thật (A1). Ledger không có lỗ này: người tới sau chỉ có thể tạo thế hệ mới, không xoá được thế hệ đang giữ. Probe của em xác nhận điều đó trên đúng lịch chạy của phản biện (mục 14).

**Thứ tự.**

1. **W1, làm ngay, nhỏ, Node:** tách đèn của hook ra file riêng, để claim/land không còn bị chặn 180 s sau mỗi commit. Cùng release đó "trung hoà" code cũ để các bước sau đổi phiên bản an toàn. Không đổi format lock, không thu hẹp vùng claim.
2. **W2:** module holder-lock trên ledger, process-facts, resolver khoá tài nguyên. Chuyển từng lock qua một hàng rào phiên bản. Main checkout có một cửa ghi duy nhất. Sửa kiểm sức chứa worker trong cùng commit thu hẹp claim.
3. **W3:** đợt identity của hội đồng (1b–1f), với quyền sở hữu claim không đi theo gia phả.
4. **W4–W5:** crate Rust, rồi facade cho đường lạnh theo cổng S6. Đường nóng (`events.lock`, `claims.lock`) giữ bản Node trong process tới khi use-case store sang Rust. Đây là giai đoạn hai bản cài đặt có hạn, có điều kiện kết thúc (mục 12).
5. **W6:** dọn phần còn sót.

## 2. Bản đồ phát hiện → mục trả lời → bằng chứng

| # | Phát hiện | Trả lời ở | Bằng chứng |
|---|---|---|---|
| A1 | Sidecar hết tuổi mở lại khe so-rồi-unlink | Mục 5 (ledger, điểm tuyến tính hoá), 5.5 (GC) | Probe 1: lịch chạy A1 trên ledger, một holder (14.1). Probe 2: GC + contender bị dừng, có/không post-check (14.2) |
| A2 | Reader v1 xoá record v2 của holder sống | Mục 6 (hàng rào phiên bản, trung hoà, drain, rollback) | Probe 3a/3b tái hiện nguy cơ với code v1 thật; probe 3c chứng minh marker + kiểm lại sau acquire (14.3) |
| A3 | Không rõ sống/chết bị biến thành chết qua TTL | Mục 4 (facts API ba trạng thái, namespace, driver, phân loại lỗi đọc), 5.6, 5.7 | Source: [`process-identity.mjs:59-70`](../../src/runner/dispatch/process-identity.mjs) chỉ trả held/dead; vector W2 |
| A4 | Grant là bearer token nhân bản được | Mục 7.1 (uỷ quyền cho đúng một subprocess, gắn pid con, borrow mode) | Prior art: `child` trong [`provider-capacity.mjs:510-516`](../../src/runner/dispatch/provider-capacity.mjs); vector W2c |
| A5 | Hook đọc mutex không phải loại trừ | Mục 8.2 (phạm vi bảo đảm), 8.4 (thứ tự với `index.lock` của git) | Thử Git thật của phản biện; test hai chiều trong W2c |
| A6 | Inventory ghi main sai/thiếu | Mục 8.1 (bảng mọi writer), 8.3 (một cửa ghi), 10 (thứ tự lock) | Source dẫn từng dòng ở 8.1 |
| A7 | Thu hẹp claim vỡ trần worker | Mục 9.1 | Ca `narrowedClaimModel` của phản biện; test hai item tranh slot cuối trong W2c |
| A8 | Epoch không tự tạo fencing | Mục 5.8 | Source: [`run-lock.mjs:447-452`](../../src/runner/dispatch/run-lock.mjs) là receiver thật duy nhất; [`merge.mjs:1912`](../../src/runner/merge.mjs) chỉ có SHA CAS |
| A9 | Facade Rust không rõ process nào là holder | Mục 7.2 | Vector + test helper exit, caller chết, timeout trong W5 |
| A10 | W2–W4 chưa có đường hoàn tất thoả S6 và một authority | Mục 11 (đường nóng), 12 (S6, hai bản có hạn, nhánh dừng), 13 (proof trước writer, doctor/CHANGELOG theo wave) | Đo chi phí ledger: 14.4 |
| A11 | Beacon và grant tự chặn checkpoint | Mục 8.5 (bảng beacon riêng) | Test bốn ca trong W1 |
| A12 | Claim theo lineage đưa quyền gia phả trở lại | Mục 9.2 | Source: [`store.mjs:1141-1145`](../../src/state/store.mjs); test S1 trong W3 |
| A13 | Dispatch lock phạm vi máy chưa có cutover chung | Mục 4.4 (resolver), 6 (cutover), 9.3 | Source: [`dispatch/cli.mjs:725-726`](../../src/runner/dispatch/cli.mjs), [`execution/run.mjs:345-362`](../../src/runner/execution/run.mjs), [`reconciliation-planner.mjs:197`](../../src/runner/dispatch/reconciliation-planner.mjs) |
| A14 | Mutex quanh `git worktree add` không có giới hạn thời gian | Mục 8.6 | Thử Git thật của phản biện (`worktree-add-runs-project-hook`) |

## 3. Giữ nguyên từ bản 1 (phản biện đã xác nhận)

- **Quyền lock tách khỏi writer identity.** Writer id bằng nhau không cấp quyền gì (phản biện, "những điểm đứng vững" 2).
- **Đèn báo (beacon) tách khỏi mutex.** Lỗi 180 s là thật và đến từ việc trộn hai thứ này trong một file (điểm đứng vững 5).
- **Tầng thấp nhất là sự thật của OS** về process, dùng chung cho lock và identity, không vòng phụ thuộc.
- **Không bao giờ cướp lock của holder được biết là còn sống** (điểm đứng vững 4; luật sẵn có ở [`run-lock.mjs:18-22`](../../src/runner/dispatch/run-lock.mjs)).
- **Tạo độc quyền bằng temp + `link`** là nền tốt (điểm đứng vững 3). Lỗi nằm ở cách dọn, không ở `link`.
- **Sửa nghĩa ở Node trước, có test vector, rồi port Rust** (điểm đứng vững 8).
- Bác rename-reclaim của kiểm kê (điểm đứng vững 1).

## 4. Tầng process-facts (trả lời A3)

### 4.1 Phân tầng

```text
L-os     process-facts      sống / chết / không rõ, namespace, thời điểm boot      chỉ đọc OS
L-key    resource-key       khoá tài nguyên + thư mục lock, chỉ đọc, thuần          dùng fs
L-lock   holder-lock        ledger, quyết định, uỷ quyền, thứ tự lock               dùng L-os, L-key; KHÔNG biết session
L-id     session-identity   writer id + source; lineage chỉ để audit                dùng L-os
L-app    hook, claim, land, dispatch, events, workflow, gateway, fgctl, observe     dùng L-lock + L-id
```

L-os và L-key là **leaf chỉ đọc**, không spawn, không kill. Reconcile bị cấm import code điều khiển process ([`process-identity.mjs:1-8`](../../src/runner/dispatch/process-identity.mjs) và test import-graph), nên nó chỉ được import hai leaf này. Phần "pid có tồn tại không" (kill 0) là chỗ riêng của caller, truyền vào dạng boolean, như hôm nay.

### 4.2 Owner record và ba trạng thái

Owner trong record v2: `{host, bootId, pidNs, pid, startTime}`. `pidNs` là inode của `/proc/self/ns/pid` (Linux). Hàm judge nhận dạng đã chuẩn hoá này, không đọc tên trường trực tiếp. Adapter đổi các record cũ (`processStartTime` của run-lock và provider) sang `startTime`. Đây là chỗ phản biện chỉ ra: hôm nay đổi tên trường mà không có adapter làm mất kiểm pid tái dùng ([`process-identity.mjs:66`](../../src/runner/dispatch/process-identity.mjs)).

| Sự kiện | Kết quả |
|---|---|
| `host` khác host hiện tại, hoặc `pidNs` khác namespace hiện tại | **Không rõ.** BootId khác trên host khác không chứng minh gì |
| Cùng host, `bootId` khác boot hiện tại | **Chết** (host đã khởi động lại) |
| Cùng host, file thế hệ có mtime trước thời điểm boot hiện tại | **Chết** (ghi từ lần boot trước). Luật này cứu record hỏng sau mất điện |
| Cùng host + namespace + boot, pid không tồn tại (ESRCH) | **Chết** |
| Pid tồn tại, driver đọc được startTime, khớp | **Sống** |
| Pid tồn tại, startTime khác | **Chết** (pid đã bị tái dùng) |
| Pid tồn tại, không đọc được startTime (không có driver, lỗi quyền, quá thời gian) | **Không rõ** |

Hàm hiện có trả `held` cho "không rõ" ([`process-identity.mjs:66-68`](../../src/runner/dispatch/process-identity.mjs)). Bản mới trả riêng `unknown` để người gọi báo đúng, nhưng **mọi quyết định giành quyền coi `unknown` như sống**.

### 4.3 Driver theo nền tảng

| Nền tảng | startTime | bootId / thời điểm boot | Ghi chú |
|---|---|---|---|
| Linux | `/proc/<pid>/stat` trường 22 | `/proc/sys/kernel/random/boot_id`, `btime` trong `/proc/stat` | Đã có ở Node; Rust port |
| macOS | Rust: `sysctl(KERN_PROC_PID)` → `p_starttime`. Node: `ps -o lstart= -p` có timeout ngắn; quá giờ là **không rõ** | `sysctl kern.boottime` | `ps` từng treo trong `events.lock` (`6ab5e02ad`); vì vậy chỉ người tranh gọi, có timeout, không bao giờ holder gọi |
| Windows | Rust: `OpenProcess` + `GetProcessTimes` (creation time) | `GetTickCount64` suy ra thời điểm boot | [`lock.rs:63-96`](../../packages/distribution/rust/src/lock.rs) đã có `OpenProcess`; thiếu creation time. Node trên Windows: chỉ pid tồn tại hay không; còn lại **không rõ** |
| Khác | Không hỗ trợ | Không hỗ trợ | Pid không tồn tại vẫn là chết; còn lại không rõ. Doctor báo "liveness driver: unsupported" |

Hệ quả cần nói thẳng: trên nền tảng thiếu driver, holder crash **mà pid của nó bị tái dùng** sẽ giữ lock tới khi process mang pid đó thoát. Trường hợp hiếm. Đổi lại không bao giờ có hai holder. Phản biện xác định Windows native là target thật ([`distribution.md:310`](../../docs/specs/distribution.md)); driver Windows vì vậy nằm trong crate Rust ở W4, không bị đẩy hết sang TTL.

### 4.4 Khoá tài nguyên (L-key, trả lời phần "máy" của A13)

Một resolver chỉ đọc: `resolveLockResource(kind, input) → {key, lockDir, scope, display}`. Mọi writer và mọi inspector (acquire, `lock-status`, guard resume, reconcile, doctor) dùng đúng hàm này.

- **Phạm vi repo:** `<main .fgos>/runtime/locks/<name>/`. `.fgos/runtime/` đã bị git bỏ qua ([`.gitignore:23`](../../.gitignore)).
- **Phạm vi máy = một OS user trên một host.** Gốc là `${FGOS_STATE_HOME:-${XDG_STATE_HOME:-<home theo passwd>/.local/state}}/fgos/locks/`, cùng công thức với [`store.rs:59-66`](../../packages/distribution/rust/src/store.rs). Home lấy theo passwd (`os.userInfo().homedir` ở Node), **không** theo biến `HOME`, vì worker trong sandbox có `HOME` riêng. Hôm nay [`provider-capacity.mjs:37-39`](../../src/runner/dispatch/provider-capacity.mjs) dùng `os.homedir()` (theo `HOME`) và một gốc khác (`~/.fgos/runtime`); gốc đó được đưa về resolver khi lock provider đi qua hàng rào của nó.
- **Process con không tự tính lại gốc máy.** Dispatch truyền gốc đã chốt xuống env `FGOS_LOCK_ROOT`. Một process tự đặt `FGOS_STATE_HOME` khác là một phạm vi máy khác theo định nghĩa; doctor báo nếu hai process của cùng workspace nhìn hai gốc.
- **Khoá của cwd** là `dev:ino` của thư mục (lấy bằng `stat` sau `realpath`), không phải chuỗi đường dẫn. Bind mount và symlink cùng trỏ một thư mục cho cùng khoá. Thư mục bị xoá rồi tạo lại có inode mới, là tài nguyên mới. Cwd đã bị xoá thì acquire từ chối. Hôm nay khoá là chuỗi cwd thô ([`main-checkout-lock.mjs:79-81`](../../src/runner/main-checkout-lock.mjs)).
- **Handle giữ khoá đã chốt.** Release và renew dùng khoá trong handle, không tính lại từ cwd. Mỗi thư mục lock ghi `resource.json` (đường dẫn hiển thị, `dev:ino`, lúc tạo) để inspector tìm được lock của một đường dẫn không còn tồn tại.
- Hai user khác nhau trên cùng host dùng chung một worktree: **không hỗ trợ**, ghi vào spec.

### 4.5 Kết quả đọc một record

| Trạng thái đọc | Ý nghĩa | Quyết định |
|---|---|---|
| Không có | Tài nguyên trống | Được tạo thế hệ kế tiếp |
| Đọc được, đúng schema | Bình thường | Theo bảng 5.6 |
| Hỏng (không parse được) | Ghi dở sau mất điện, hoặc thứ khác ghi vào | Nếu file có mtime trước boot hiện tại: chết. Nếu không: **giữ (unknown)**. Tuổi file không bao giờ là bằng chứng chết |
| Schema lạ (`v` lớn hơn bản này hiểu) | Bản mới hơn đang giữ | **Giữ**, không bao giờ dọn. Báo "cần nâng cấp fgOS" |
| Lỗi I/O (EACCES, EIO, ...) | Không biết gì | Trả lỗi cho caller. Không bao giờ coi là trống hay chết |

## 5. Holder-lock v2 trên generation ledger (trả lời A1, A8)

### 5.1 Bố cục trên đĩa

```text
<lockDir>/
  resource.json                 mô tả tài nguyên (4.4), ghi một lần
  protocol.json                 marker phiên bản writer (mục 6)
  generations/0000000042.json   một thế hệ = một lần acquire; bất biến
  releases/0000000042.json.release   marker release, publish một lần
  grants/<grantId>.json          uỷ quyền (mục 7.1), publish một lần
  grants/<grantId>.bound         pid con đã gắn, publish một lần
  heartbeat/0000000042.hb        chỉ cho lease; thay nguyên tử, chỉ để hiển thị
```

Record thế hệ: `{v:2, kind, name, token, owner:{host,bootId,pidNs,pid,startTime}, writer:{id,source}, purpose, acquiredAt, ttlMs}`. `writer` chỉ để audit. `ttlMs` chỉ dùng để báo `overdue`, không cấp quyền giành (5.6).

### 5.2 Acquire

1. Đọc thư mục `generations/`, lấy thế hệ cao nhất N (giữ vòng đọc lại khi file biến mất giữa `readdir` và `read`, như [`provider-capacity.mjs:442-498`](../../src/runner/dispatch/provider-capacity.mjs)).
2. Quyết định trên N: đã có marker release, hoặc owner **chết** (4.2), hoặc không có N → được tạo N+1. Nếu owner sống hoặc không rõ, hoặc còn con được uỷ quyền đang sống (7.1) → HELD.
3. Ghi record vào file tạm, `link` sang `generations/N+1`. EEXIST nghĩa là người khác đã thắng N+1: đọc lại, quyết định lại (giống [`run-lock.mjs:213-237`](../../src/runner/dispatch/run-lock.mjs)).
4. **Post-check:** sau khi `link` thành công, đọc lại thư mục. Nếu có thế hệ cao hơn N+1, mình vừa lấp một lỗ do GC để lại: publish marker release cho thế hệ đó, coi như thua, quay lại bước 1.

Không có bước nào xoá hay ghi đè record của người khác.

### 5.3 Điểm tuyến tính hoá (câu hỏi 1 của phản biện)

Quyền được cấp tại đúng một thao tác: `link` thành công vào `N+1` **và** post-check thấy `N+1` là cao nhất.

- Quyết định ở bước 2 chỉ dựa trên sự thật **đơn điệu** của thế hệ N: đã release thì mãi đã release; đã chết (pid + startTime + boot) thì không sống lại. Vì vậy một quyết định cũ, nếu `N+1` vẫn còn trống lúc `link`, vẫn đúng.
- Người dọn bị dừng giữa quyết định và `link` (đúng lịch A1) khi tỉnh lại chỉ có thể `link` vào `N+1`. Nếu người khác đã vào trước, `link` báo EEXIST và nó phải đọc lại. Nó không có thao tác nào chạm vào thế hệ của người khác.
- Hai người dọn cùng tới một holder chết được phân xử bằng chính `link`. Không có sidecar, nên không có "sidecar chết" phải dọn.
- Giả định cần ghi trong spec và kiểm ở doctor: filesystem cục bộ hỗ trợ `link` và thấy ngay (như hôm nay). Filesystem không có `link`: acquire từ chối với lỗi rõ, không lùi về cách khác.

Probe 1 chạy đúng lịch A1 (holder chết, R1 quyết định rồi bị dừng, chờ 200 ms, R2 giành và vào vùng găng, R1 chạy tiếp): R1 nhận `held`, chỉ một holder trong vùng găng (14.1).

### 5.4 Release và renew

- **Release:** chỉ handle chủ (có token trong process). Kiểm token khớp record N, rồi publish `releases/N.release` một lần. Release thứ hai là no-op. Release từ handle cũ (thế hệ đã bị thay) trả `superseded`, không làm gì.
- **Release khi có con được uỷ quyền:** từ chối với `borrowers-active` tới khi con thoát (7.1).
- **Renew (chỉ lease):** thay nguyên tử `heartbeat/N.hb`. Heartbeat không cấp quyền gì cho mutex/lease không có fencing; nó chỉ giúp hiển thị `overdue`.

### 5.5 GC và high-watermark

Ledger không GC thì lớn mãi. [`provider-capacity.mjs:520-554`](../../src/runner/dispatch/provider-capacity.mjs) ghi lại một lần GC trước đây đã gây **hai holder sống cùng lúc**: contender tính `N` từ lâu, bị dừng, tỉnh dậy sau khi `N` đã bị xoá, `link` vào `N` thành công. Vì vậy GC đã bị gỡ hẳn, chấp nhận thư mục lớn mãi.

Luật GC của v2:

1. **Thế hệ cao nhất không bao giờ bị xoá.** Nó là high-watermark bền: còn qua release, restart, GC. Thư mục lock không bao giờ bị xoá khi tài nguyên còn tồn tại (doctor cũng không).
2. GC chỉ xoá thế hệ (và marker release, grant của nó) **nhỏ hơn** thế hệ cao nhất nó vừa thấy. Ai cũng được chạy GC: người vừa release, hoặc doctor.
3. Bất biến: mọi lỗ do GC để lại luôn có một thế hệ cao hơn còn tồn tại. Một contender cũ lấp lỗ sẽ bị post-check (5.2 bước 4) bắt và coi là thua. Reader luôn lấy thế hệ cao nhất, nên record lấp lỗ không bao giờ được hiểu là holder hiện tại.
4. Thế hệ duy nhất mà một tiến trình còn hợp lệ có thể đang dùng là thế hệ cao nhất. GC không chạm nó, nên GC không bao giờ thu thứ mà một contender còn dùng.

Probe 2 tái hiện đúng bug GC của provider-capacity: không có post-check thì hai holder (C ở thế hệ 2 đã bị xoá, B ở thế hệ 3); có post-check thì C nhận `held`. Stress 6 process × 60 vòng, GC sau 70% lần release: không post-check có 82/72/73 lần vi phạm loại trừ trong ba lượt; có post-check 0 vi phạm, 97/89/89 lần lấp lỗ bị phát hiện và từ chối (14.2).

### 5.6 Bảng quyết định cho mutex và lease

Beacon có bảng riêng (8.5). Bảng này chạy trên thế hệ cao nhất N.

| Thế hệ N | Mutex | Lease không fencing | Lease có fencing (run control) |
|---|---|---|---|
| Không có | ACQUIRED (N=1) | ACQUIRED | ACQUIRED |
| Đã release | ACQUIRED (N+1) | ACQUIRED | ACQUIRED |
| Owner chết, không con nào sống | ACQUIRED (N+1) | ACQUIRED | ACQUIRED |
| Owner hoặc con sống, trong `ttlMs` | HELD | HELD | HELD |
| Owner hoặc con sống, quá `ttlMs` | HELD + `overdue` | HELD + `overdue` | HELD + `overdue` |
| Owner không rõ | HELD + `unknown` | HELD + `unknown` | Được giành sau hạn **chỉ vì** receiver từ chối epoch cũ (5.8) |
| Record hỏng / schema lạ / lỗi I/O | Theo 4.5 | Theo 4.5 | Theo 4.5 |
| Writer id của người gọi bằng writer id trong record | Không cấp gì | Không cấp gì | Không cấp gì |
| Grant hợp lệ cho đúng process này (7.1) | Vào với quyền mượn | Vào với quyền mượn | Vào với quyền mượn |

Không có re-entry theo token trong process: một handle đã giữ thì code của chính nó không acquire lại cùng tài nguyên. Kiểm thứ tự lock (mục 10) bắt lỗi này.

### 5.7 Holder sống nhưng treo (R3 cũ)

Không xoá file. Lệnh khôi phục mới (`fgos lock fence <name>`, thay `unlock --force`):

1. Holder sống trên host này: hiện holder, hỏi xác nhận, gửi SIGTERM rồi SIGKILL tới **owner và con được uỷ quyền**. Khi chúng chết, acquire bình thường giành được. Không có đường nào giành quyền trong lúc holder còn sống.
2. Holder không rõ (host khác, thiếu driver): với mutex/lease không fencing, từ chối. Người vận hành phải dừng process trên host gốc, rồi chạy `fence --attest-stopped`. Lệnh này publish một thế hệ mới có ghi người xác nhận và lý do, ghi event. Đây là đường giành quyền duy nhất không dựa trên bằng chứng OS, và nó là quyết định của người.

### 5.8 Fencing có thật ở đâu (A8)

- **Epoch sống ở đâu:** là số của thế hệ cao nhất, không bao giờ bị xoá (5.5). Không phụ thuộc file record bị unlink, nên không tái dùng số cũ.
- **Receiver thật:** chỉ những chỗ kiểm epoch ngay trước khi commit tác dụng của mình. Hôm nay: run control (`isRunControlCurrent`, `settleRunControl`, [`run-lock.mjs:390-452`](../../src/runner/dispatch/run-lock.mjs)). Provider state ghi dưới chính mutex ledger của nó, nên không cần epoch.
- **Main checkout không có receiver.** `update-ref <new> <old>` ([`merge.mjs:1912`](../../src/runner/merge.mjs)) là CAS theo SHA, bảo vệ ref, không biết epoch. `read-tree`, index và working tree không có kiểm nào đi kèm thao tác. Vì vậy main mutex **không bao giờ** được giành từ holder có thể còn ghi (sống hoặc không rõ).
- Bản v2 không tuyên bố fencing ở đâu khác. Merge slot có thể là ứng viên (ref đích được CAS), nhưng chỉ khi có proof riêng; không làm trong track này.

## 6. Đổi phiên bản an toàn (A2, cutover của A13)

### 6.1 Vì sao code cũ nguy hiểm

Probe 3 dùng code v1 thật ([`main-checkout-lock.mjs`](../../src/runner/main-checkout-lock.mjs)):

- **3a:** record v2 đặt vào đường dẫn v1. Reader v1 báo `ambiguous`; claim v1 gọi `forceReclaimAmbiguousLock` như [`claim-port.mjs:131`](../../src/runner/claim-port.mjs) và xoá mất record của holder đang sống. Tái hiện đúng A2.
- **3b:** v2 ở đường dẫn mới, không có hàng rào. Code v1 không thấy ledger, acquire file cũ thành công trong lúc v2 đang giữ: hai bên cùng tin mình giữ.

Kết luận: **không giao thức nào tự bảo vệ được trước code cũ chưa được sửa.** Code cũ phải được trung hoà rồi rút hết trước khi writer v2 đầu tiên chạy trên cùng tài nguyên.

### 6.2 Ba bước cho mỗi tài nguyên

1. **Trung hoà (release R-neutral).** Code v1 vẫn ghi v1 nhưng:
   - Không bao giờ tự xoá record nó không hiểu. Nội dung là JSON có trường `v` (schema lạ) → coi là HELD. Nội dung không phải JSON → giữ cách tự lành hiện tại (`tsk-2l8`), vì mọi writer của file này publish bằng `link` nên không có trạng thái ghi dở.
   - Sau khi acquire v1 thành công, **đọc lại `protocol.json`** của tài nguyên. Nếu marker nói writer = 2: release v1 ngay, đi đường v2.
   - Code v2 đã có sẵn trong release này nhưng chỉ chạy khi marker = 2.
2. **Rút (drain).** Chứng nhận không còn process nào chạy code trước R-neutral có thể chạm tài nguyên (6.3).
3. **Nâng marker.** Người nâng acquire lock v1 (để không có vùng găng v1 nào đang chạy), ghi `protocol.json` = 2 bằng thay nguyên tử, release v1. Mọi writer R-neutral acquire v1 sau đó sẽ thấy marker = 2 ở bước kiểm lại và chuyển sang v2. Marker chỉ tăng.

Probe 3c chạy đúng lịch nguy hiểm: P đọc marker = 1 rồi bị dừng; marker được nâng; một writer v2 giữ ledger; P chạy tiếp. Không kiểm lại marker sau acquire: hai holder. Có kiểm lại: P release v1, đi v2, nhận `held`. Một holder (14.3).

### 6.3 Chứng nhận đã rút

Repo không có registry process. Bản này chọn cách rẻ nhất mà vẫn có bằng chứng, nằm trong doctor (`lock-protocol-drain`):

- Liệt kê process sống của user (Linux: `/proc/*/cmdline`, `/proc/*/cwd`) đang chạy payload fgOS từ một release root khác các release ≥ R-neutral, hoặc chạy `bin/fgos.mjs` từ một worktree mà nhánh chưa chứa commit R-neutral. Có process như vậy chạm workspace này → từ chối nâng.
- Với lock phạm vi máy: mọi workspace đã đăng ký trên máy phải activate ≥ R-neutral. Workspace nào doctor không thấy (không có trong registry máy) thì người vận hành xác nhận.
- macOS/Windows: doctor liệt kê được ít hơn, nên phần còn lại là xác nhận của người.

Đây là câu hỏi cho anh (mục 17, câu 2): chấp nhận drain có người xác nhận, hay xây registry process.

### 6.4 Rollback

- Hạ marker 2 → 1: người hạ giữ **mutex v2** khi ghi marker. Writer v2 sau khi thắng ledger cũng đọc lại marker; thấy 1 thì release, đi v1. Đối xứng với 6.2.
- Chỉ được rollback tới release ≥ R-neutral. Rollback về release trước R-neutral là bỏ hàng rào; doctor từ chối nâng marker khi phát hiện, và CHANGELOG của R-neutral ghi rõ "không hạ cấp xuống dưới bản này".
- Chạy Node và Rust song song chỉ an toàn khi cả hai cùng nói một giao thức trên **cùng** ledger (mục 12); không có pha "hai file riêng để so".

## 7. Uỷ quyền và owner (A4, A9)

### 7.1 Grant: uỷ quyền cho đúng một subprocess

Mục đích hẹp: cho **một** lệnh con của holder (hôm nay là `git commit` của checkpoint/merge, có hook bên trong) đi qua kiểm tra mà không bị coi là người lạ. Thay `FGOS_MAIN_LOCK_HOLDER_PID` ([`merge.mjs:1591`](../../src/runner/merge.mjs), [`claim-port.mjs:168`](../../src/runner/claim-port.mjs)).

1. Holder spawn lệnh con bằng spawn bất đồng bộ, nên biết pid con ngay. Holder publish `grants/<grantId>.json` = `{epoch, resourceKey, mode:'borrow', purpose, issuedAt, maxLifetimeMs}` rồi `grants/<grantId>.bound` = `{pid, startTime, bootId}` của **chính con đó**. Rồi chờ con thoát.
2. Env `FGOS_LOCK_GRANT=<resourceKey>:<epoch>:<grantId>` chỉ đặt cho env của lần spawn đó, không export ra process cha.
3. Process nhận (hook) chấp nhận grant chỉ khi: grant tồn tại; `epoch` là thế hệ cao nhất, chưa release; owner sống; chưa quá `maxLifetimeMs`; và **pid cha của hook (lệnh git) đúng là pid đã gắn**. Một process anh em có cùng env nhưng khác cha bị từ chối. Grant dùng lại sau release bị từ chối (epoch không còn là hiện tại hoặc đã release). Sai tài nguyên hoặc sai epoch bị từ chối.
4. **Borrow mode:** không renew, không release, không phát grant tiếp, không acquire lại tài nguyên đó.
5. **Liveness của thế hệ = owner sống HOẶC con đã gắn sống.** Contender coi là HELD trong lúc git con còn chạy, kể cả khi holder cha đã chết. Đây là prior art đã chạy thật: `child` trong [`provider-capacity.mjs:510-516`](../../src/runner/dispatch/provider-capacity.mjs).
6. **Holder cha phải đợi con trước khi release.** Release từ chối (`borrowers-active`) khi con gắn còn sống.
7. **Cha chết khi con đang chạy:** thế hệ vẫn HELD tới khi con thoát; sau đó cả hai chết, contender giành bình thường. Không ai giành được trong lúc git con còn ghi index.
8. **Scrub ở cả ba đường launch:** `workerBaseEnv` ([`adapters.mjs:99-109`](../../src/runner/dispatch/adapters.mjs), dùng ở [`transport.mjs:535`](../../src/runner/dispatch/transport.mjs) và [`confinement/authority.mjs:1405-1410`](../../src/runner/dispatch/confinement/authority.mjs)) bỏ `FGOS_LOCK_GRANT` và `FGOS_MAIN_LOCK_HOLDER_PID`; herdr pane không confined nhận env qua cùng hàm. Kể cả khi env lọt ra, kiểm pid cha ở bước 3 làm nó vô dụng.
9. Mô hình đe doạ: chống kế thừa nhầm và nhân bản ngẫu nhiên giữa các process fgOS. Không chống process cục bộ cố ý phá (process đó xoá được file trong `.fgos`).

### 7.2 Owner khi gọi Rust qua helper (A9)

- **Owner là process chịu trách nhiệm transaction** (process Node gọi), không phải pid của helper Rust.
- Helper không tin pid được gửi sang. Nó nhận `--owner-pid`, kiểm pid đó **bằng `getppid()` của chính nó** (helper luôn là con trực tiếp của caller), rồi tự đọc startTime/bootId/pidNs của pid đó qua L-os.
- **Token do caller sinh trước khi exec** và gửi sang (`--token`). Helper timeout hoặc crash: caller gọi `inspect`; thế hệ cao nhất mang token của nó → nó đang giữ (dùng tiếp hoặc release); không có → không giữ. Kết quả acquire không bao giờ bị bỏ lửng.
- **Caller chết trước hoặc sau khi publish:** thế hệ có owner chết, contender giành bình thường (không cần dọn riêng).
- **Release-on-exit:** handler `exit` của Node exec `fgos lock release` đồng bộ. SIGKILL thì handler không chạy; liveness dọn (như hôm nay). Handle ghi đường dẫn binary lúc acquire; release dùng đúng binary đó, kể cả khi activation đã đổi giữa chừng. Hai binary khác phiên bản vẫn an toàn nhờ marker (mục 6).
- Con git sống lâu hơn holder: theo 7.1 bước 5.

## 8. Main checkout: ai ghi gì, bảo đảm tới đâu (A5, A6, A11, A14)

### 8.1 Mọi writer của index, HEAD, working tree ở main

| Writer | Ghi gì | Source | Hôm nay giữ gì | v2 |
|---|---|---|---|---|
| Commit tay (người hoặc agent) | index, HEAD, working tree | ngoài fgOS | Không gì; hook (nếu có) kiểm | **Không bị loại trừ.** Xem 8.2 |
| Pre-commit hook | Ghi đèn; đọc lock | [`.githooks/pre-commit:471-484`](../../.githooks/pre-commit) | Acquire `main-checkout.lock` bằng session id hoặc pid mượn | Chỉ ghi beacon (8.5) và đọc mutex thử một lần (8.4) |
| Checkpoint `.fgos` trong claim | `git add`, `commit`, `reset` khi lỗi | [`claim-port.mjs:168`](../../src/runner/claim-port.mjs) → [`events-jsonl-truncation-guard.mjs:490-508`](../../src/state/events-jsonl-truncation-guard.mjs) | main mutex của claim | Qua cửa checkpoint (8.3) |
| Checkpoint khi chỉ giữ merge slot | như trên | [`merge.mjs:804`](../../src/runner/merge.mjs) | **Chỉ slot**, không main mutex | Qua cửa checkpoint: slot → main |
| Checkpoint trong merge không slot | như trên | [`merge.mjs:934`](../../src/runner/merge.mjs) | main mutex | Qua cửa checkpoint |
| Land | `update-ref` + `read-tree -m -u` | [`merge.mjs:1890-1933`](../../src/runner/merge.mjs) | main mutex, kiểm dirty lại dưới mutex | Giữ; main mutex v2 |
| sync-root của root không parent | `merge --no-commit`, verify, `commit`, abort **ngay trên main** | [`sync-root.mjs:266-278`](../../src/verbs/merge/sync-root.mjs) → [`merge.mjs:920,1302,1591`](../../src/runner/merge.mjs) | main mutex suốt merge + verify | **Giữ main mutex** tới khi nhánh này chuyển sang ephemeral + land (item riêng) |
| `promote-engine` | merge trong worktree tạm | [`promote-engine.mjs:73-78`](../../src/runner/promote-engine.mjs) | main mutex lấy **bên trong** callback, đọc tip không được bảo vệ | Merge slot của đích bọc **bên ngoài** `withMergeEphemeralWorktree`, như nhánh có parent của sync-root ([`sync-root.mjs:212-263`](../../src/verbs/merge/sync-root.mjs)) |
| `main-checkout-reset --confirm` | `reset --hard` | [`bin/fgos.mjs:4327-4369`](../../bin/fgos.mjs) | Không gì | Kiểm sạch + kiểm commit mất + reset nằm trong **một** vùng main mutex |
| `fgctl init`/publish | `.fgos/installation/` (bị git bỏ qua, [`.gitignore:42`](../../.gitignore)) | [`init.rs:940-947`](../../packages/distribution/rust/src/init.rs) | Đọc `main-checkout.lock` rồi lấy `activation.lock` | **Không phải writer của main.** Phép đọc lock là kiểm sớm, không phải loại trừ. An toàn đổi phiên bản đến từ marker (mục 6). Giữ phép đọc tới W4, rồi bỏ |

`git worktree add` / `git branch` không ghi index hay HEAD của main; chúng ghi ref và `.git/worktrees/`. Xem 8.6.

### 8.2 Phạm vi bảo đảm, nói thẳng

- **Được loại trừ lẫn nhau:** mọi writer fgOS trong bảng 8.1 (checkpoint, land, sync-root trên main, reset). Tất cả đi qua main mutex v2.
- **Không được loại trừ:** commit tay, `git add`, sửa file trong working tree của main. Chúng chỉ được bảo vệ bởi:
  - CAS của git: commit thấy HEAD đã đổi thì fail (thử Git của phản biện: exit 128, `cannot lock ref 'HEAD'`); `update-ref` của land fail khi tip đã đổi.
  - Kiểm dirty lại dưới mutex trước `update-ref` ([`merge.mjs:1908-1910`](../../src/runner/merge.mjs)).
  - Kiểm sớm của hook (8.4) giảm số lần đụng nhau. Nó không phải loại trừ.
- **Rủi ro còn lại phải test trong W2c, chưa có bằng chứng:** người đã `git add` nhưng chưa commit, land chạy `read-tree -m -u HEAD`, mục đã stage có thể bị đặt lại trong index. Nếu test xác nhận, land phải kiểm cả index (không chỉ working tree) dưới mutex và trả `main-checkout-dirty-mid-merge`.
- **Project không có hook** (mọi project ngoài repo fgOS, [`git-hooks.mjs:103-107`](../../src/setup/git-hooks.mjs)): cùng bảo đảm, trừ kiểm sớm.
- Muốn loại trừ cả commit tay thì phải bọc commit tay qua một cửa fgOS. Đó là câu hỏi cho anh (mục 17, câu 3).

### 8.3 Một cửa ghi main

`withMainCheckout(purpose, fn)` là cửa duy nhất cho writer fgOS. Nó acquire main mutex v2, chạy `fn`, release. Checkpoint thành một hàm `checkpointMainFgos()` luôn đi qua cửa này cho trọn add, commit và reset khi lỗi. Mọi caller ở 8.1 gọi cửa này; không caller nào tự gọi `git add/commit` vào main.

### 8.4 Thứ tự với `index.lock` của git

Git giữ `index.lock` **trong lúc** chạy pre-commit. Land giữ main mutex rồi mới để git lấy `index.lock` (`read-tree`). Hai chiều ngược nhau. Vì vậy:

- Hook chỉ được **thử một lần** main mutex, không bao giờ chờ. Thấy bị giữ bởi người không có grant hợp lệ → từ chối commit với thông báo "fgOS đang ghi main". Chờ trong hook có thể tạo deadlock với land.
- Trong thứ tự lock (mục 10), `index.lock` của git xếp dưới main mutex.

### 8.5 Beacon: bảng riêng (A11)

Beacon không phải lock. Nó là gợi ý "một phiên khác vừa commit ở đây". File: `.fgos/runtime/main-checkout-activity.json` (đã bị git bỏ qua). Record: `{v:1, kind:'beacon', writer:{id,source}, writtenAt, windowMs, auditPid}`. Một trường thời hạn duy nhất là `windowMs`. `auditPid` chỉ để debug; liveness **không bao giờ** được hỏi.

| Tình huống ở hook | Quyết định |
|---|---|
| Commit mang grant main hợp lệ (checkpoint/merge của fgOS) | Bỏ qua beacon, **không ghi** beacon |
| Không có beacon | Cho commit; ghi beacon của mình **ở cuối hook**, sau mọi kiểm tra khác |
| Beacon cùng writer id | Cho commit; làm mới beacon |
| Beacon khác writer, còn trong `windowMs` | Từ chối commit |
| Beacon khác writer, quá `windowMs` | Cho commit; ghi đè beacon |
| Beacon hỏng | Cho commit, cảnh báo, ghi đè. Beacon là gợi ý nên fail-open |

Writer id của beacon luôn là session identity của người commit, không bao giờ là pid mượn hay token. Kết quả với các ca phản biện nêu:

- A commit, B checkpoint ngay sau: checkpoint mang grant, bỏ qua beacon. Qua.
- Cùng phiên commit → checkpoint → commit: checkpoint không chạm beacon; commit thứ hai cùng writer. Qua.
- Grant hợp lệ và beacon của writer khác: grant thắng, beacon không đổi.
- Hook lỗi sau khi ghi beacon: không xảy ra, vì beacon ghi cuối. Git commit fail sau hook: beacon sáng tối đa `windowMs`, chỉ chặn writer khác.

Trước khi có grant v2 (W1), dấu hiệu "commit của fgOS" là biến `FGOS_MAIN_LOCK_HOLDER_PID` hợp lệ trong env, như hôm nay.

### 8.6 `git worktree add` (A14)

- Nó không ghi index/HEAD của main, nên **ra khỏi main mutex** khi claim được thu hẹp (W2c).
- Nó vẫn tranh ref và `.git/worktrees/` với `git worktree add` khác. Cho tới khi có test đa process chứng minh song song an toàn, giữ một mutex riêng `worktree-admin` (phạm vi repo) quanh đúng lời gọi đó.
- Trade-off nói thẳng: lời gọi này chạy hook `post-checkout` của project và filter, **không có giới hạn thời gian**. Một hook chậm làm các `pick` khác chờ, nhưng **không** còn chặn land hay commit. Không tắt hook của project khách.
- Hook `post-checkout` gọi ngược `fgos pick` sẽ tự chờ chính nó: không hỗ trợ, `worktree-admin` chờ có hạn và báo lỗi rõ.

## 9. Claim (A7, A12, phần claim của A13)

### 9.1 Trần worker trong cùng vùng găng (A7)

Hôm nay kiểm trần ở [`claim-port.mjs:207-217`](../../src/runner/claim-port.mjs) chạy dưới main mutex rộng, ngoài `events.lock`. Main mutex rộng là thứ duy nhất tuần tự hoá hai claim khác item. Thu hẹp nó mà không đổi chỗ kiểm trần làm vượt trần (ca `narrowedClaimModel` của phản biện: trần 1, chiếm 2).

Sửa, trong cùng commit thu hẹp claim (W2c):

- Đếm và kiểm trần **bên trong** khối `withEventsLock` ở [`claim-port.mjs:299-322`](../../src/runner/claim-port.mjs), ngay trước `acquireClaim`, trên `readClaims` và durable view mới đọc lại.
- Vì sao đủ: mọi đường làm **tăng** số chỗ chiếm (acquire claim, chuyển item sang `doing`) đều giữ `events.lock`. Đường làm giảm (`releaseClaim`) chỉ làm trần an toàn hơn.
- Thứ tự `events → claims`, khớp `settleClaim` ([`store.mjs:1147-1148`](../../src/state/store.mjs)).
- Ngoại lệ stale-reclaim (`isPotentialStaleClaimReclaim`) tính lại trong cùng khối.
- Test: hai item khác nhau tranh slot cuối (một thắng); cùng item vẫn `conflict`; stale-reclaim; tạo nhánh worker thất bại sau khi giữ chỗ thì chỗ được trả.

### 9.2 Ai sở hữu claim (A12)

- **Lineage chỉ để audit.** Không có đường nào cấp quyền vì chung tổ tiên.
- **Chủ claim** = writer id ghi lúc acquire ([`runtime-coordination.mjs:228`](../../src/state/runtime-coordination.mjs)), so **chính xác** khi settle ([`store.mjs:1141-1145`](../../src/state/store.mjs)). Giữ như hôm nay.
- **Uỷ quyền tường minh:** khi một con có writer id riêng (sau 1c) cần settle claim của cha, cha publish delegation `{claimId, attempt, delegateWriterId}` dưới `claims.lock` **trước** khi spawn con. Writer id của con biết trước khi spawn (`launchCommandId`, hội đồng 1c). Settle chấp nhận khi writer id khớp chủ, hoặc khớp đúng delegation của đúng `claimId` + `attempt`.
- Anh em B đọc được `claimId` của A vẫn bị từ chối (khác writer id, không có delegation). Attempt cũ không settle được claim mới (delegation ghi attempt).
- Câu "1c chỉ ảnh hưởng attribution" của bản 1 bị rút lại: writer id còn quyết định quyền settle.
- S1 (kiểm kê consumer của writer id) phải chỉ ra mọi chỗ con settle thay cha; mỗi chỗ cần delegation. Không có chỗ nào thì không cần delegation nào.

### 9.3 Dispatch cwd sang phạm vi máy

- Hai writer ([`dispatch/cli.mjs:725-733`](../../src/runner/dispatch/cli.mjs), [`assignment-runner.mjs:2217-2224`](../../src/runner/dispatch/assignment-runner.mjs)) và hai reader ([`execution/run.mjs:345-362`](../../src/runner/execution/run.mjs), [`reconciliation-planner.mjs:197`](../../src/runner/dispatch/reconciliation-planner.mjs)) chuyển **trong cùng một commit**, cùng resolver 4.4, sau hàng rào của tài nguyên này.
- Guard resume ở `run.mjs` hôm nay đọc `pid` cấp trên và bỏ qua TTL; reconcile tự dựng tên file. Cả hai được thay bằng `inspect` của holder-lock qua resolver. Reconcile chỉ import leaf chỉ đọc (4.1).
- Không thêm đường acquire dự phòng ở path cũ. 4 file `dispatch--*.lock` mồ côi được doctor dọn khi có bằng chứng holder chết.

## 10. Thứ tự lock

Mỗi lock có một hạng. Một process chỉ được acquire lock có hạng **lớn hơn** mọi lock nó đang giữ. Holder-lock theo dõi các hạng đang giữ trong process và ném `lock-order-violation` khi sai; test sẽ bắt mọi call site lệch.

| Hạng | Lock | Ghi chú |
|---|---|---|
| 10 | runner, gateway | singleton của process |
| 20 | `merge-slot--<target>` | lease |
| 30 | dispatch cwd (máy) | lease |
| 40 | `worktree-admin` | mutex, mới (8.6) |
| 50 | main checkout | mutex |
| 55 | `index.lock` của git | ngoài fgOS; hook chỉ thử một lần hạng 50 (8.4) |
| 60 | events | mutex, đường nóng |
| 70 | claims | mutex, đường nóng |
| 80 | sessions, advance, reconcile, recovery, observe, provider state/account, activation, install, full-suite | lá: giữ lock này thì không acquire gì thêm |

Hai lock cùng hạng (hai merge slot) không được giữ cùng lúc. Một process không được chờ con trong lúc giữ lock mà con có thể cần, trừ khi con là người mượn qua grant (7.1).

## 11. Đường nóng: events.lock và claims.lock (A10)

- **Không bao giờ exec bên trong `events.lock`.** Hôm nay `appendEventCore` resolve identity bên trong lock ([`events.mjs:482`](../../src/state/events.mjs)), và `acquireClaim` cũng vậy ([`runtime-coordination.mjs:228`](../../src/state/runtime-coordination.mjs)). Sửa theo call graph, không theo từng helper: mỗi điểm vào process (dispatcher verb của `bin/fgos.mjs`, vòng runner, gateway, hook) gọi `primeWriterIdentity()` **một lần, trước mọi lock**. Code dưới lock chỉ đọc giá trị đã prime. Chưa prime thì ném lỗi trong test, nên call site bị sót lộ ra ở test, không lộ ra thành exec trong lock.
- Cache cả `{id, source}` (câu hỏi mở của S6). Xác nhận registry đọc `sessions.json` là đọc file trong process, không exec, nên được phép dưới lock.
- **Lock của đường nóng chạy trong process.** `events.lock` và `claims.lock` không bao giờ gọi helper Rust. Release và renew của chúng cũng vậy. Lock đường lạnh (hạng ≤ 50) có thể đi qua helper, vì theo thứ tự lock chúng được acquire trước và release sau `events.lock` (LIFO), nên exec của chúng không bao giờ nằm trong vùng giữ `events.lock`.
- **Chi phí ledger trên đường nóng, đo được (14.4):** link/unlink hiện tại 25 µs p50; ledger không fsync 165 µs p50, 376 µs p95 cho một lần acquire + release + GC. Bản có fsync (như `publishNextGeneration` production) ~5 ms, không dùng cho mutex: record mutex không cần sống qua mất điện, vì holder của nó cũng không sống qua (luật mtime-trước-boot ở 4.2 xử lý file hỏng sau mất điện). Cổng chuyển `events.lock` (W2d): đo lại trên một round thật, thêm ≤ 0,5 ms p95 mỗi lần append.

## 12. Rust, S6 và giai đoạn hai bản cài đặt

**Cổng S6 đầy đủ** (không rút gọn) cho mọi lần Node gọi sang Rust:

1. Verb là route native, chạy được khi `FGOS_RUST_HOST_RECURSION_GUARD=1`.
2. Exec thẳng binary của release từ `FGOS_HOST_BIN` hoặc activation, resolve một lần mỗi process; không qua shim; không import `host-bin.mjs` trên đường gọi.
3. Không exec trong `events.lock` (mục 11).
4. Overhead ≤ 5 ms p95 warm, ≤ 6 ms lần đầu khi cache lạnh, đo bằng harness S6 trên crate thật.
5. Truyền pid caller và helper kiểm bằng `getppid()` (7.2).
6. Host lệch phiên bản: verb không tồn tại (exit 4) → lỗi `host-version-mismatch`, fail-closed cho lock và identity.
7. Hook khi chưa có activation: câu hỏi Q2 của đề xuất Rust-first, chỉ phải quyết trước W5.

**Hai bản cài đặt có hạn, nói thẳng.** Bản 1 hứa một authority. Bản 2 nói rõ: giao thức (spec + vector + format trên đĩa) là authority duy nhất; code thực thi có hai bản trong một giai đoạn:

- **Đường lạnh** (main mutex, merge slot, dispatch cwd, runner, gateway, activation, install, observe): sau W5, chỉ còn crate Rust. Bản Node của các lock này bị xoá trong commit flip.
- **Đường nóng** (`events.lock`, `claims.lock`): bản Node trong process ở lại **tới khi use-case store** (`store.mjs`, `events.mjs`, `runtime-coordination.mjs`) chuyển sang Rust theo [luật migration](../../docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md). Đó là điều kiện kết thúc có tên. Trong giai đoạn này, Node và Rust cùng ghi **cùng ledger** an toàn được, vì cả hai chỉ dùng `link` + post-check; CI có test đa process một writer Node + một writer Rust trên **cùng** tài nguyên.
- **Nhánh dừng nếu S6 fail ở W5:** không có facade. Rust crate chỉ phục vụ caller Rust (fgctl, observe). Node giữ bản của mình cho mọi caller Node. Hai bản, một giao thức, cùng vector, cùng test cùng-tài-nguyên. Ghi thành quyết định trong spec, không để ngầm.

Đây là câu hỏi cho anh (mục 17, câu 1).

## 13. Lộ trình

Mỗi wave: thay đổi gì, xoá gì (One Door), bằng chứng **trước writer đầu tiên**, doctor/setup/CHANGELOG **trong chính wave đó**.

### W1. Gỡ kẹt 180 s, trung hoà main-checkout (Node, nhỏ, làm ngay)

**Thay đổi:**

1. Hook ghi beacon vào `.fgos/runtime/main-checkout-activity.json` theo bảng 8.5 (dấu hiệu fgOS-commit là `FGOS_MAIN_LOCK_HOLDER_PID` hợp lệ). Hook **không còn ghi** `main-checkout.lock`.
2. Hook đọc `main-checkout.lock` thử một lần: holder số còn sống và khác pid mượn → từ chối "fgOS đang ghi main". Là kiểm sớm, không phải loại trừ.
3. Mọi writer của `main-checkout.lock` ghi `ttlMs` vào record; contender dùng `ttlMs` của record. Record chuỗi không có `ttlMs` (do hook bản cũ để lại trong lúc chuyển) được đánh giá bằng `HOOK_TTL_MS` (20 s), không phải 180 s.
4. Trung hoà (6.2 bước 1) cho `main-checkout.lock`, `merge-slot--*`, `dispatch--*`: không tự xoá nội dung JSON có trường `v`; kiểm lại `protocol.json` sau acquire (vắng = 1).
5. Vùng claim **giữ nguyên độ rộng**; không đổi chỗ kiểm trần.
6. Năm chỗ `releaseMainCheckoutLockIfOwn(dir, resolveWriterIdentity(dir).id)` trong [`bin/fgos.mjs`](../../bin/fgos.mjs) (dòng 1408, 1425, 1795, 3566, 3596) vốn để tắt đèn của chính phiên. Chúng chuyển sang "tắt beacon nếu cùng writer". Sau W1 không còn lời gọi nào chạm `main-checkout.lock` bằng writer id.

**Xoá:** đường hook acquire `main-checkout.lock`; năm lời release theo writer id ở trên; nhánh đọc đèn ở claim/land (đèn không còn ở file đó).

**Đóng được:**

- Claim/land/approve không còn bị chặn tới 180 s sau mỗi commit tay ở main, kể cả phiên vừa commit.
- Record main-lock do hook tạo cho pid mượn trong checkpoint dưới merge slot (đường [`merge.mjs:804`](../../src/runner/merge.mjs)) không còn sinh ra, nên không còn chặn người khác tới khi merger thoát.
- `fgctl init` không còn bị chặn 180 s sau mỗi commit (Rust [`lock.rs`](../../packages/distribution/rust/src/lock.rs) chỉ còn thấy record số).
- RT2-2 ở main mutex: hook không còn acquire main mutex bằng session id, nên các agent cùng phiên không còn "là một writer" đối với mutex. Chúng vẫn là một writer đối với beacon, đúng chủ ý.
- Code của release này không còn xoá record schema lạ (tiền đề cho mục 6).

**Chưa đóng:** A1 (dọn v1 vẫn là đọc-lại-rồi-unlink), A5 (commit tay không bị loại trừ), A6 (checkpoint dưới slot vẫn không có main mutex; reset chưa bọc; promote-engine đọc tip ngoài lock), A14 (worktree add vẫn dưới main mutex), A3 (liveness hai trạng thái), lấy cắp holder số còn sống khi quá TTL của contender ([`main-checkout-lock.mjs:313-317`](../../src/runner/main-checkout-lock.mjs)).

**Phạm vi project:** release đi tới mọi project. Project ngoài repo fgOS không có hook ([`git-hooks.mjs:103-107`](../../src/setup/git-hooks.mjs)), nên chúng không mắc lỗi đèn 180 s; với chúng W1 không đổi hành vi nào ngoài trung hoà. Lợi ích gỡ kẹt rơi vào repo fgOS và fork, cùng `fgctl init` ở đó.

**Proof trước writer:** test e2e với hook thật trong repo tạm: commit ở main rồi `pick` ngay → thành công; cùng writer commit → commit trong cửa sổ → qua; writer khác → bị từ chối; checkpoint dưới merge slot không để lại record trong `main-checkout.lock`; record chuỗi cũ không `ttlMs` hết sau 20 s; record JSON có `v` không bị claim xoá; kiểm lại marker (test đơn vị). Ba file e2e hook hiện có chạy xanh.

**Doctor/setup/CHANGELOG:** CHANGELOG (pick/take không còn chờ sau commit; file beacon mới); `lock-status` hiện beacon riêng; doctor không thêm check mới (file nằm dưới `.fgos/runtime/` đã có sẵn).

### W2. Holder-lock trên ledger, facts, resolver, chuyển từng lock

- **W2a (dormant):** module Node `holder-lock` + leaf `process-facts` + leaf `resource-key` + spec `docs/specs/holder-lock.md` + vector. Mọi lock còn lại nhận trung hoà (6.2 bước 1). Không flip gì. Cập nhật [component-boundary.md](../../docs/platform/component-boundary.md). **Proof trước writer:** ba probe của bản này thành test đa process thật trên module (lịch A1, GC + contender dừng, stress có GC, hàng rào marker cả hai chiều); vector cho bảng 4.2, 4.5, 5.6; crash sau publish/trước trả handle; pid tái dùng. Doctor: check `liveness-driver` (supported/unsupported) và `lock-link-support` (filesystem có `link`).
- **W2b:** drain + nâng marker cho lock rủi ro thấp, mỗi commit một lock: gateway, sessions, runner, advance, reconcile, recovery, full-suite. Rồi dispatch cwd sang phạm vi máy (9.3), cả bốn caller trong một commit. **Xoá:** bản chép của từng lock trong commit flip nó; `isPidAlive` chép; regex composite chép ở reconcile. **Proof:** test hiện có của từng lock + test drain chặn khi còn process cũ + test hai repo cùng cwd, symlink alias, resume/reconcile sau flip. **Doctor/setup:** `lock-protocol-drain`; setup tạo gốc lock máy; CHANGELOG cho đổi phạm vi dispatch.
- **W2c:** main checkout. Main mutex sang ledger; cửa `withMainCheckout` + `checkpointMainFgos` (8.3); reset trong mutex; promote-engine dưới slot bên ngoài; grant v2 thay `FGOS_MAIN_LOCK_HOLDER_PID` (7.1); `worktree-admin` (8.6); claim thu hẹp cùng sửa trần worker (9.1) trong **một** commit. **Xoá:** `HOLDER_PID_ENV_VAR`, `allowSelfRecognition`, `forceReclaimAmbiguousLock`, nhánh main mutex quanh worktree add. **Proof:** hai land loại trừ; checkpoint dưới slot loại trừ với land; hook từ chối khi land giữ; commit tay ↔ land hai chiều và ở khe giữa `update-ref`/`read-tree`, có và không có hook; staged-but-uncommitted (8.2); grant: hai con cùng env, dùng lại sau release, sai epoch, cha chết khi git con chạy; hai item tranh slot cuối; hai `git worktree add` song song + hook `post-checkout` chậm. **Doctor/CHANGELOG:** `fgos lock fence` thay `unlock --force`; verb `unlock` và skill `fgos-unlock` đổi sang fence; CHANGELOG.
- **W2d:** `claims.lock`, rồi `events.lock`, sau cổng đo 11. **Proof:** benchmark round thật; test đa process hiện có của events.

### W3. Identity (hội đồng 1b–1f)

1b scrub env CLI cha; 1c writer id riêng mỗi attempt, phủ ba đường launch; 1d `CODEX_THREAD_ID`; 1e, 1f như hội đồng. Có thể chạy song song W2 sau W1, vì sau W1 không lock nào cấp quyền theo session id. **Trước 1c:** S1 + delegation claim (9.2). **Proof:** S1; sibling settle bị từ chối; delegation đúng claimId + attempt được phép; attempt cũ không settle claim mới; full `npm test`. **Docs:** `docs/io-contract.md` (đổi hợp đồng writer id); CHANGELOG.

### W4. Crate Rust

Crate cho process-facts + holder-lock + session-identity, port bằng vector. Thay [`lock.rs`](../../packages/distribution/rust/src/lock.rs), activation lock của `init.rs`, `install.lock` ([`store.rs:24-57`](../../packages/distribution/rust/src/store.rs), thêm liveness), [`store_lock.rs`](../../packages/observe/rust/src/store_lock.rs), `shard.rs`. Driver macOS và Windows (4.3). Mỗi lock Rust đổi format đi qua hàng rào marker. **Proof:** cargo test cùng vector; test đa process **một writer Node + một writer Rust trên cùng ledger**. **Doctor/CHANGELOG:** đổi tên shard observe (Rust-first R5); bỏ phép đọc main-lock của `fgctl`.

### W5. Facade cho đường lạnh, hook native

Theo cổng S6 đầy đủ (mục 12). Flip mọi lock đường lạnh của Node sang facade trong một commit, xoá bản Node tương ứng. Hook thành `fgos hook pre-commit` native. **Proof:** đo lại S6 trên crate thật; test helper thoát khi Node còn giữ, caller chết trước/sau publish, helper timeout, release-on-exit, git con sống lâu hơn holder. Nếu S6 fail: nhánh dừng (mục 12). **Doctor/CHANGELOG:** `main-checkout-hook-wired` kiểm shim resolve được verb `hook`; CHANGELOG.

### W6. Dọn phần còn sót

`dispatch.claim`, doctor check `*.claim` của coordination, spec `runner.md` lệch TTL, GC ledger provider-capacity qua luật 5.5 (bỏ trade-off "lớn mãi" ở [`provider-capacity.mjs:545-554`](../../src/runner/dispatch/provider-capacity.mjs)).

## 14. Bằng chứng đã chạy

Máy Linux 16 core, load ~7, Node v24.18.0. Thư mục: `/tmp/claude-1000/-home-vantt-projects-forgentX/bbe6155f-ff18-4e69-ad42-40abac4a35bf/scratchpad/design-v2/`. Mã và kết quả nhúng ở Phụ lục. Đây là **mô hình** giao thức ghép từ primitive production, không phải test của module v2 (chưa tồn tại).

### 14.1 Probe 1: lịch A1 trên ledger

R1 quyết định "H0 chết, tôi lấy thế hệ 2", bị dừng trước `link`. Chờ 200 ms (TTL sidecar của phản biện là 50 ms). R2 giành thế hệ 2 và vào vùng găng. R1 chạy tiếp: `link` EEXIST, đọc lại, thấy R2 sống, nhận `held`. **Một holder.**

### 14.2 Probe 2: GC + contender bị dừng

| Ca | Kết quả |
|---|---|
| Không post-check | C `link` vào thế hệ 2 đã bị GC xoá, vào vùng găng cùng B (thế hệ 3). **Hai holder** (tái hiện bug provider-capacity) |
| Có post-check | C thấy thế hệ 3 cao hơn, từ chối, nhận `held`. **Một holder** |
| Stress 6 × 60, GC sau 70% release, không post-check | 82, 72, 73 vi phạm trong ba lượt |
| Stress, có post-check | 0 vi phạm; 97, 89, 89 lần lấp lỗ bị phát hiện và từ chối |

### 14.3 Probe 3: đổi phiên bản

| Ca | Kết quả |
|---|---|
| 3a: record v2 trong đường dẫn v1, claim v1 thật | `ambiguous` → `reclaimed`, record v2 **bị xoá** |
| 3b: v2 ở đường dẫn mới, v1 thật không trung hoà | Cả hai `acquired` |
| 3c: marker, P không kiểm lại sau acquire v1 | **Hai holder** |
| 3c: marker, P kiểm lại sau acquire v1 | P release v1, đi v2, `held`. **Một holder** |

Chưa chứng minh được bằng probe: drain thật (cần code R-neutral và doctor), và chiều rollback (đối xứng, sẽ là test W2a).

### 14.4 Chi phí trên đường nóng

| Cách (3000 lần, không tranh chấp) | p50 | p95 | p99 |
|---|---|---|---|
| link/unlink như `events.lock` hôm nay | 25,5 µs | 63,5 µs | 76,5 µs |
| Ledger, fsync (primitive production), GC mỗi lần | 4973 µs | 7196 µs | 15638 µs |
| Ledger không fsync, GC mỗi lần | 164,6 µs | 376,2 µs | 452,2 µs |
| Ledger không fsync, GC mỗi 16 lần | 245,8 µs | 782,9 µs | 945,7 µs |

GC mỗi lần release rẻ hơn GC thưa (thư mục luôn nhỏ). Đây là cơ sở cho cổng 0,5 ms ở mục 11.

## 15. Khác gì so với bản 1

| Bản 1 | Bản 2 | Vì sao |
|---|---|---|
| Record một file + sidecar reclaim (4.4) | Generation ledger, không unlink record người khác; GC có high-watermark + post-check | A1; probe 1, 2 |
| "Không rõ" → theo TTL của record | "Không rõ" → HELD cho mutex/lease; chỉ resource có receiver thật mới giành theo hạn | A3, A8 |
| Record hỏng > 2 s → coi như chết | Hỏng/schema lạ/lỗi I/O tách riêng; chỉ "ghi trước lần boot này" là chết | A3 |
| Reader đọc cả v1/v2, writer v2 bật theo activation | Trung hoà → drain → marker; kiểm marker sau acquire; luật rollback | A2; probe 3 |
| Grant = env `<name>:<token>` | Grant gắn đúng pid con, borrow mode, liveness gồm con, cha đợi con | A4 |
| Owner = pid trong record (không nói khi qua helper) | Owner = caller, kiểm bằng `getppid()`, token sinh trước, inspect sau timeout | A9 |
| Hook đọc mutex = bảo vệ commit vs land | Chỉ là kiểm sớm; phạm vi bảo đảm ghi thẳng; commit tay không bị loại trừ | A5 |
| sync-root không-slot và promote-engine sang merge slot | sync-root trên main giữ main mutex; promote-engine slot bọc ngoài; checkpoint/reset vào một cửa | A6 |
| Claim chỉ lấy mutex quanh checkpoint | Thu hẹp cùng lúc chuyển kiểm trần vào `events.lock`; W1 không thu hẹp | A7 |
| Epoch tăng mỗi lần acquire = fencing | Fencing chỉ ở run control; main mutex không giành từ holder có thể còn ghi | A8 |
| W4 "≤ 5 ms p95"; events chờ không hạn | Cổng S6 đủ 7 điều kiện; đường nóng giữ Node có điều kiện kết thúc; nhánh dừng có tên | A10 |
| Beacon dùng chung bảng, `windowMs` vs `ttlMs` | Bảng beacon riêng, một trường thời hạn, grant bỏ qua beacon | A11 |
| Claim dùng lineage | Lineage chỉ audit; delegation theo claimId + attempt | A12 |
| Dispatch cwd theo realpath, phạm vi máy chưa định nghĩa | Resolver chung, khoá `dev:ino`, máy = user theo passwd, flip bốn caller một commit | A13 |
| Giữ mutex quanh worktree add tới khi test | Worktree add ra khỏi main mutex; mutex riêng `worktree-admin`, không giới hạn thời gian được nói thẳng | A14 |
| D3: grant cho mọi lock ngay wave 1 | Grant v2 ở W2c; W1 không dùng grant | A10 điểm 5 |
| Doctor/CHANGELOG ở W5 | Trong từng wave | A10 điểm 5 |
| L-os "đã có sẵn" | Phải thêm ba trạng thái, namespace, adapter, driver | A3 |

D2 (giữ beacon chỉ cho hook), D9 (bỏ root pane rỗng) và D7 (Node trước, Rust sau, có cổng S6) giữ nguyên. D4 (dispatch phạm vi máy) giữ, có định nghĩa. D5, D6 thay bằng ledger. D8 (dọn đồ thừa) vào W6.

## 16. Trả lời 9 câu hỏi của phản biện

1. **(A1) Điểm tuyến tính hoá; hai người dọn cùng tới?** `link` vào N+1 thành công **và** post-check thấy N+1 cao nhất (5.3). Quyết định dựa trên sự thật đơn điệu của thế hệ N. Người dọn bị dừng chỉ có thể thua EEXIST, không chạm được thế hệ người khác. Không có sidecar; hai người dọn được phân xử bởi chính `link`. Probe 1, 2.
2. **(A2/A13) Ngăn code cũ thế nào; rollback rút gì, ai chứng nhận?** Trung hoà → drain → nâng marker dưới lock v1; code R-neutral kiểm lại marker sau acquire (6.2). Doctor `lock-protocol-drain` liệt kê process cũ còn sống và workspace chưa nâng; phần doctor không thấy được thì người xác nhận (6.3). Rollback hạ marker dưới mutex v2, chỉ về release ≥ R-neutral (6.4). Dispatch cwd flip bốn caller một commit sau hàng rào (9.3).
3. **(A3/A4/A9) Owner chính xác là ai; unknown có bao giờ cho giành mutex?** Owner = process chịu trách nhiệm transaction, định danh bằng host + pidNs + bootId + pid + startTime; khi qua helper, là caller được helper kiểm bằng `getppid()`, không phải helper (7.2). Git con được gắn vào thế hệ, nên thế hệ sống khi owner hoặc con sống (7.1). Unknown **không bao giờ** cho giành mutex; chỉ người xác nhận đã dừng holder mới mở được (5.7).
4. **(A4/A12) Grant và delegation claim có scope, lifetime gì; anh em dùng chung được không; ai cấp?** Grant: một tài nguyên, một epoch, một pid con, borrow, có `maxLifetimeMs`, hết khi thế hệ release (7.1). Delegation claim: một claimId, một attempt, một writer id con, do chủ claim cấp trước khi spawn (9.2). Anh em không dùng chung được: grant kiểm pid cha, delegation kiểm writer id. Lineage không cấp gì.
5. **(A5/A6) Phạm vi với commit tay, project không hook, reset, checkpoint từ slot, `fgctl init`? Sync-root sang CAS trước khi bỏ mutex?** Commit tay và project không hook: không bị loại trừ, chỉ CAS + kiểm dirty (8.2). Reset và checkpoint từ slot: vào main mutex qua một cửa (8.3). `fgctl init` không ghi main; phép đọc của nó chỉ là kiểm sớm, bỏ ở W4 (8.1). Sync-root trên main **giữ main mutex** tới khi có item riêng chuyển nó sang ephemeral + land; không bỏ mutex trước.
6. **(A7) Snapshot capacity và acquire claim cùng transaction ở đâu; thứ tự lock nào?** Trong khối `withEventsLock` của `claimWork`, ngay trước `acquireClaim` (9.1). Thứ tự toàn cục ở mục 10, có kiểm khi chạy.
7. **(A8) Epoch sống ở đâu sau unlink; sink nào từ chối epoch cũ; GC giữ bất biến thế nào?** Không có unlink record: epoch là số thế hệ cao nhất, không bao giờ bị xoá (5.5). Sink thật duy nhất là run control (5.8). Main index không có sink nên không giành từ holder có thể còn ghi. GC chỉ xoá dưới high-watermark; post-check bắt mọi lần lấp lỗ.
8. **(A10) S6 fail thì authority nào còn; khi nào bản Node biến mất; exec release/claims dưới `events.lock`?** Giao thức là authority; nếu S6 fail, Node giữ bản của mình cho caller Node, Rust cho caller Rust, cùng vector và test cùng-tài-nguyên (12). Bản Node đường lạnh biến mất ở W5 nếu S6 đạt; bản Node đường nóng biến mất khi use-case store sang Rust. Lock đường nóng không bao giờ exec; lock đường lạnh theo thứ tự lock nằm ngoài vùng `events.lock` (11).
9. **(A11/A14) Hook có grant xử lý beacon ra sao; mutex quanh worktree add có giới hạn không?** Grant hợp lệ bỏ qua và không ghi beacon (8.5). Worktree add không có giới hạn thời gian; vì vậy nó ra khỏi main mutex, sang `worktree-admin` chỉ chặn `pick` khác, không chặn land/commit (8.6).

## 17. Câu hỏi cho anh

Chỉ những điểm phụ thuộc ý định của anh. Mọi lựa chọn khác trong bản này em đã tự quyết theo phân tích.

1. **Hai bản cài đặt cho lock đường nóng.**
   - Đang xảy ra: `events.lock`/`claims.lock` không thể gọi Rust qua exec (S6, mục 11).
   - Nguyên nhân: use-case store vẫn ở Node.
   - Phương án: (a) Node giữ bản trong process cho đường nóng tới khi store sang Rust, cùng giao thức + vector + test cùng-tài-nguyên (em đề xuất); (b) chuyển cả use-case store sang Rust trước khi gom lock (track lớn, chặn W2d nhiều tuần); (c) addon N-API (repo hôm nay tránh addon).
   - Em khuyên (a).
   - Phạm vi: chỉ `events.lock` và `claims.lock`.
2. **Chứng nhận drain khi đổi phiên bản.**
   - Đang xảy ra: không có registry process; code cũ không tự dừng được (probe 3a/3b).
   - Phương án: (a) doctor quét process + workspace, phần còn lại người xác nhận (em đề xuất, rẻ); (b) xây registry process mới (mỗi process fgOS ghi lease sống), tốn thêm một component.
   - Em khuyên (a), vì anh là người dùng duy nhất và mỗi lần nâng marker là một bước vận hành có chủ đích.
3. **Commit tay ở main có cần bị loại trừ với land không.**
   - Hôm nay và trong v2: không; chỉ CAS + kiểm dirty + kiểm sớm của hook (8.2).
   - Phương án: (a) chấp nhận phạm vi này, ghi vào spec (em đề xuất); (b) thêm cửa commit của fgOS và yêu cầu agent commit qua đó ở main.
   - Em khuyên (a); (b) đổi thói quen của mọi agent và không cứu được người dùng git trực tiếp.
4. **Cho W1 chạy ngay như một item riêng** (Node, nhỏ, không chờ W2/W3), trong khi W2–W6 vào một plan có phase? Em khuyên có.

## Phụ lục: mã probe và kết quả

Chạy lại: chép các file dưới đây vào một thư mục tạm mới, rồi `node probe-ledger.mjs`, `node probe-mixed-version.mjs`, `node bench-hotpath.mjs`. Script import chỉ-đọc `src/runner/dispatch/run-lock.mjs`, `src/runner/dispatch/process-identity.mjs`, `src/runner/main-checkout-lock.mjs` theo đường dẫn tuyệt đối của repo; mọi ghi chỉ nằm trong thư mục tạm của script. Mô hình chưa có đủ thiết kế: owner chưa có host/pidNs, chưa có grant, chưa có luật mtime-trước-boot; probe 3 đặt ledger ở `.fgos/locks/` thay vì `.fgos/runtime/locks/` của mục 4.4. Những khác biệt này không chạm điểm được chứng minh (điểm tuyến tính hoá, GC, marker).

### A. Kết quả probe 1 và 2 (`probe-ledger-results.json`, gọn)

```json
{"case":"a1-paused-reclaimer-vs-ledger","R1":{"pid":1853382,"acquired":false,"status":"held","heldEpoch":2},"R2":{"pid":1853390,"acquired":true,"epoch":2,"othersInsideOnEntry":0},"liveHoldersInCs":1,"currentEpoch":2,"currentHolderPid":1853390,"twoLiveHolders":false}
{"case":"gc-paused-contender, postCheck=false","epochsAfterGc":[3],"filesRemovedByGc":4,"A_epoch":2,"B":{"pid":1853404,"acquired":true,"epoch":3,"othersInsideOnEntry":0},"C":{"pid":1853397,"acquired":true,"epoch":2,"othersInsideOnEntry":1},"liveHoldersInCs":2,"readersSeeCurrentEpoch":3,"twoLiveHolders":true}
{"case":"gc-paused-contender, postCheck=true","epochsAfterGc":[3],"filesRemovedByGc":4,"A_epoch":2,"B":{"pid":1853419,"acquired":true,"epoch":3,"othersInsideOnEntry":0},"C":{"pid":1853411,"acquired":false,"status":"held","heldEpoch":3},"liveHoldersInCs":1,"readersSeeCurrentEpoch":3,"twoLiveHolders":false}
{"case":"stress 6 procs x 60, GC p=0.7 after each release, postCheck=false","acquisitions":360,"csViolations":82,"holeFillsDetectedAndRefused":0,"finalEpoch":279,"filesLeftInLedger":1,"elapsedMs":1934}
{"case":"stress 6 procs x 60, GC p=0.7 after each release, postCheck=false","acquisitions":360,"csViolations":72,"holeFillsDetectedAndRefused":0,"finalEpoch":275,"filesLeftInLedger":1,"elapsedMs":1830}
{"case":"stress 6 procs x 60, GC p=0.7 after each release, postCheck=false","acquisitions":360,"csViolations":73,"holeFillsDetectedAndRefused":0,"finalEpoch":269,"filesLeftInLedger":1,"elapsedMs":1797}
{"case":"stress 6 procs x 60, GC p=0.7 after each release, postCheck=true","acquisitions":360,"csViolations":0,"holeFillsDetectedAndRefused":97,"finalEpoch":360,"filesLeftInLedger":1,"elapsedMs":2801}
{"case":"stress 6 procs x 60, GC p=0.7 after each release, postCheck=true","acquisitions":360,"csViolations":0,"holeFillsDetectedAndRefused":89,"finalEpoch":360,"filesLeftInLedger":1,"elapsedMs":2840}
{"case":"stress 6 procs x 60, GC p=0.7 after each release, postCheck=true","acquisitions":360,"csViolations":0,"holeFillsDetectedAndRefused":89,"finalEpoch":360,"filesLeftInLedger":1,"elapsedMs":2836}
```

Ghi chú: ở stress không post-check, `finalEpoch` < 360 vì một số lần lấp lỗ được tính là acquire thành công. Đó chính là các lần hai holder.

### B. Kết quả probe 3 (`probe-mixed-version-results.json`)

```json
{
  "node": "v24.18.0",
  "results": [
    {"case": "(a) v2 record in the v1 path, unneutralized v1 claim", "oldReader": "ambiguous", "oldClaimRecovery": "reclaimed", "v2RecordStillExists": false},
    {"case": "(b) v2 ledger at a new path, unneutralized v1 on the old path", "v2Status": "acquired", "v1Status": "acquired", "bothBelieveTheyHold": true},
    {"case": "(c) marker barrier, P re-reads marker after acquiring v1 = false", "raiserV1Status": "acquired",
     "V2": {"pid": 1853200, "enteredCs": true, "via": "v2", "othersInsideOnEntry": 0, "epoch": 1},
     "P": {"pid": 1853193, "enteredCs": true, "via": "v1", "othersInsideOnEntry": 1}, "liveHoldersInCs": 2, "twoLiveHolders": true},
    {"case": "(c) marker barrier, P re-reads marker after acquiring v1 = true", "raiserV1Status": "acquired",
     "V2": {"pid": 1853214, "enteredCs": true, "via": "v2", "othersInsideOnEntry": 0, "epoch": 1},
     "P": {"pid": 1853207, "enteredCs": false, "via": "v2", "status": "held"}, "liveHoldersInCs": 1, "twoLiveHolders": false}
  ]
}
```

### C. Kết quả đo chi phí (`bench-hotpath-results.json`)

```json
{
  "node": "v24.18.0",
  "iterations": 3000,
  "linkUnlinkMutex": {"p50us": 25.5, "p95us": 63.5, "p99us": 76.5},
  "ledgerGcEveryRelease": {"p50us": 4973.3, "p95us": 7195.8, "p99us": 15638.3},
  "ledgerGcEvery16": {"p50us": 5088.2, "p95us": 7124.7, "p99us": 16622.3},
  "ledgerNoFsyncGcEveryRelease": {"p50us": 164.6, "p95us": 376.2, "p99us": 452.2},
  "ledgerNoFsyncGcEvery16": {"p50us": 245.8, "p95us": 782.9, "p99us": 945.7}
}
```

### D. `ledger-v2.mjs` (mô hình giao thức từ primitive production)

```javascript
// Model of the v2 holder-lock protocol built ONLY from production primitives
// (read-only import of src/runner/dispatch/run-lock.mjs + process-identity.mjs).
// Writes only under the temp dirs the probes pass in. Not an implementation.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  publishNextGeneration,
  publishMarkerOnce,
  readMarker,
  listGenerations,
  currentGeneration,
} from '/home/vantt/projects/forgentX/src/runner/dispatch/run-lock.mjs';
import { getBootId, getProcessStartTime, resolveHolderLiveness } from '/home/vantt/projects/forgentX/src/runner/dispatch/process-identity.mjs';

export function dirs(lockDir) {
  return { gens: path.join(lockDir, 'generations'), rel: path.join(lockDir, 'releases') };
}
const genName = (e) => `${String(e).padStart(10, '0')}.json`;
const relPath = (lockDir, e) => path.join(dirs(lockDir).rel, `${genName(e)}.release`);

function kill0(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

export function selfHolder() {
  return { pid: process.pid, processStartTime: getProcessStartTime(process.pid), bootId: getBootId() };
}

// alive | dead ; production judge already maps "cannot disprove" to held.
export function liveness(holder) {
  return resolveHolderLiveness(holder, kill0(holder?.pid));
}

export function isReleased(lockDir, epoch) {
  return readMarker(relPath(lockDir, epoch)) !== null;
}

// Same algorithm as production publishNextGeneration (EEXIST -> reread ->
// re-decide, never unlink/overwrite) minus the fsync of the temp record: a
// mutex record need not survive power loss (its holder cannot either).
export function publishNextNoFsync(gensDir, decide) {
  fs.mkdirSync(gensDir, { recursive: true });
  for (;;) {
    const current = currentGeneration(gensDir);
    const nextEpoch = (current?.epoch ?? 0) + 1;
    const d = decide({ current, nextEpoch });
    if (d.stop) return { published: false, ...d };
    const target = path.join(gensDir, genName(nextEpoch));
    const tmp = path.join(gensDir, `.tmp-${process.pid}-${nextEpoch}-${Math.random().toString(36).slice(2)}`);
    fs.writeFileSync(tmp, JSON.stringify(d.record));
    try { fs.linkSync(tmp, target); } catch (e) { fs.unlinkSync(tmp); if (e.code !== 'EEXIST') throw e; continue; }
    fs.unlinkSync(tmp);
    return { published: true, epoch: nextEpoch, record: d.record };
  }
}

/**
 * tryAcquire: one round. pauseHook runs AFTER the decision and BEFORE link
 * (the exact gap of the review's A1 schedule). postCheck=true is the v2 rule:
 * after winning a link, the winner must still be the highest generation,
 * otherwise it filled a GC hole and has lost.
 */
export function tryAcquire(lockDir, { holder = selfHolder(), pauseHook, postCheck = true, publish = publishNextGeneration } = {}) {
  const { gens } = dirs(lockDir);
  const token = crypto.randomUUID();
  let paused = false;
  let holeFills = 0;
  for (;;) {
    const res = publish(gens, ({ current }) => {
      if (current && !isReleased(lockDir, current.epoch) && liveness(current.record.holder) === 'held') {
        return { stop: true, status: 'held', epoch: current.epoch, holder: current.record.holder };
      }
      if (pauseHook && !paused) { paused = true; pauseHook(); }
      return { record: { v: 2, token, holder, acquiredAt: Date.now() } };
    });
    if (!res.published) return { status: res.status, epoch: res.epoch, holder: res.holder, holeFills };
    if (postCheck) {
      const max = currentGeneration(gens);
      if (!max || max.epoch !== res.epoch) {
        // Filled a hole left by GC: never authoritative. Mark it released so
        // it can never be mistaken for a live holder, then re-decide.
        publishMarkerOnce(relPath(lockDir, res.epoch), { epoch: res.epoch, token, lostHole: true });
        holeFills += 1;
        continue;
      }
    }
    return { status: 'acquired', epoch: res.epoch, token, holeFills };
  }
}

function markerNoFsync(p, rec) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const tmp = `${p}.tmp-${process.pid}-${Math.random().toString(36).slice(2)}`;
  fs.writeFileSync(tmp, JSON.stringify(rec));
  try { fs.linkSync(tmp, p); } catch (e) { if (e.code !== 'EEXIST') throw e; }
  fs.unlinkSync(tmp);
  return { published: true };
}

export function release(lockDir, { epoch, token }, { fast = false } = {}) {
  const { gens } = dirs(lockDir);
  let rec;
  try { rec = JSON.parse(fs.readFileSync(path.join(gens, genName(epoch)), 'utf8')); } catch { return { status: 'unknown-generation' }; }
  if (rec.token !== token) return { status: 'token-mismatch' };
  return (fast ? markerNoFsync : publishMarkerOnce)(relPath(lockDir, epoch), { epoch, token, releasedAt: Date.now() });
}

/** GC: delete every generation (and its release marker) strictly below the
 * highest present one. Never touches the highest: it is the high-watermark. */
export function gc(lockDir) {
  const { gens } = dirs(lockDir);
  const all = listGenerations(gens);
  if (all.length === 0) return 0;
  const max = all[all.length - 1].epoch;
  let n = 0;
  for (const { epoch } of all) {
    if (epoch >= max) continue;
    for (const p of [path.join(gens, genName(epoch)), relPath(lockDir, epoch)]) {
      try { fs.unlinkSync(p); n += 1; } catch (e) { if (e.code !== 'ENOENT') throw e; }
    }
  }
  return n;
}

// ---- tiny cross-process signalling through files -------------------------
export function sleepMs(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }
export function touch(p) { fs.writeFileSync(p, String(process.pid)); }
export function waitFor(p, timeoutMs = 10000) {
  const end = Date.now() + timeoutMs;
  while (!fs.existsSync(p)) { if (Date.now() > end) throw new Error(`timeout waiting ${p}`); sleepMs(2); }
}

// Critical-section witness: every holder drops a file while inside; >1 file
// at any instant is a mutual-exclusion violation observed directly.
export function enterCs(csDir, tag) {
  fs.mkdirSync(csDir, { recursive: true });
  fs.writeFileSync(path.join(csDir, tag), '');
  return fs.readdirSync(csDir).length;
}
export function leaveCs(csDir, tag) { try { fs.unlinkSync(path.join(csDir, tag)); } catch {} }
```

### E. `actor.mjs`

```javascript
// One actor process. argv[2] = JSON {role, lockDir, sig, csDir, postCheck, tag}
import fs from 'node:fs';
import path from 'node:path';
import { tryAcquire, release, enterCs, leaveCs, touch, waitFor, sleepMs } from './ledger-v2.mjs';

const o = JSON.parse(process.argv[2]);
const s = (name) => path.join(o.sig, `${o.tag}.${name}`);
const out = (obj) => fs.writeFileSync(s('result.json'), JSON.stringify({ pid: process.pid, ...obj }));

// "paused": decides, signals, waits for resume, then links.
// "plain":  acquires without pause.
// Both: on success enter CS, signal, stay inside until <tag>.finish exists.
const pauseHook = o.role === 'paused' ? () => { touch(s('decided')); waitFor(s('resume')); } : undefined;
const r = tryAcquire(o.lockDir, { pauseHook, postCheck: o.postCheck !== false });
if (r.status !== 'acquired') {
  out({ acquired: false, status: r.status, heldEpoch: r.epoch });
  touch(s('done'));
  process.exit(0);
}
const inside = enterCs(o.csDir, o.tag);
out({ acquired: true, epoch: r.epoch, othersInsideOnEntry: inside - 1 });
touch(s('in-cs'));
waitFor(s('finish'));
leaveCs(o.csDir, o.tag);
if (o.releaseOnExit !== false) release(o.lockDir, r);
touch(s('done'));
```

### F. `stress-actor.mjs`

```javascript
// Stress worker: loop acquire -> CS witness -> release -> aggressive GC.
// argv[2] = JSON {lockDir, csDir, iterations, postCheck, outFile}
import fs from 'node:fs';
import { tryAcquire, release, gc, enterCs, leaveCs, sleepMs } from './ledger-v2.mjs';

const o = JSON.parse(process.argv[2]);
let violations = 0;
let acquisitions = 0;
let holeFillsSeen = 0;
for (let i = 0; i < o.iterations; i++) {
  for (;;) {
    // Random delay inside the decide->link gap widens the stale-contender window.
    const r = tryAcquire(o.lockDir, { postCheck: o.postCheck, pauseHook: () => sleepMs(Math.random() < 0.15 ? 5 + Math.floor(Math.random() * 20) : 0) });
    holeFillsSeen += r.holeFills ?? 0;
    if (r.status === 'acquired') {
      acquisitions += 1;
      const tag = `${process.pid}-${i}`;
      if (enterCs(o.csDir, tag) > 1) violations += 1;
      sleepMs(Math.floor(Math.random() * 2));
      if (fs.readdirSync(o.csDir).length > 1) violations += 1;
      leaveCs(o.csDir, tag);
      release(o.lockDir, r);
      if (Math.random() < 0.7) gc(o.lockDir);
      break;
    }
    sleepMs(1);
  }
}
fs.writeFileSync(o.outFile, JSON.stringify({ pid: process.pid, acquisitions, violations, holeFillsSeen }));
```

### G. `probe-ledger.mjs`

```javascript
// Probes 1 and 2: the review's A1 schedule and the GC paused-contender
// schedule against the ledger model. Temp dirs only.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { publishNextGeneration, currentGeneration, listGenerations } from '/home/vantt/projects/forgentX/src/runner/dispatch/run-lock.mjs';
import { tryAcquire, release, gc, dirs, waitFor, touch, sleepMs, selfHolder } from './ledger-v2.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = fs.mkdtempSync(path.join(here, 'run-'));

function actor(caseDir, tag, role, extra = {}) {
  const o = { role, tag, lockDir: path.join(caseDir, 'lock'), sig: path.join(caseDir, 'sig'), csDir: path.join(caseDir, 'cs'), ...extra };
  const child = spawn(process.execPath, [path.join(here, 'actor.mjs'), JSON.stringify(o)], { stdio: 'inherit' });
  return { child, sig: (n) => path.join(o.sig, `${tag}.${n}`), result: () => JSON.parse(fs.readFileSync(path.join(o.sig, `${tag}.result.json`), 'utf8')) };
}
function newCase(name) {
  const d = path.join(root, name);
  for (const s of ['lock', 'sig', 'cs']) fs.mkdirSync(path.join(d, s), { recursive: true });
  return d;
}
function deadHolder() {
  const r = spawnSync(process.execPath, ['-e', 'process.stdout.write(String(process.pid))']);
  return { pid: Number(r.stdout.toString()), processStartTime: 'gone', bootId: selfHolder().bootId };
}
const csNow = (d) => fs.readdirSync(path.join(d, 'cs')).length;
const finish = async (...as) => { for (const a of as) touch(a.sig('finish')); for (const a of as) await new Promise((r) => (a.child.exitCode !== null ? r() : a.child.on('exit', r))); };

// ---- Probe 1: review A1 schedule (paused reclaimer, "expired sidecar") ----
async function probeA1() {
  const d = newCase('a1-paused-reclaimer');
  const lockDir = path.join(d, 'lock');
  const dead = deadHolder();
  publishNextGeneration(dirs(lockDir).gens, () => ({ record: { v: 2, token: 'dead-H0', holder: dead } }));
  const r1 = actor(d, 'R1', 'paused');
  waitFor(r1.sig('decided'));          // R1 judged H0 dead and is paused right before link
  sleepMs(200);                        // longer than any sidecar TTL the v1 design had (50 ms in the review)
  const r2 = actor(d, 'R2', 'plain');  // R2 reclaims the same dead holder and enters CS
  waitFor(r2.sig('in-cs'));
  touch(r1.sig('resume'));             // R1 resumes its already-made decision
  waitFor(r1.sig('result.json'));
  const out = {
    case: 'a1-paused-reclaimer-vs-ledger',
    R1: r1.result(), R2: r2.result(),
    liveHoldersInCs: csNow(d),
    currentEpoch: currentGeneration(dirs(lockDir).gens).epoch,
    currentHolderPid: currentGeneration(dirs(lockDir).gens).record.holder.pid,
  };
  await finish(r1, r2);
  out.twoLiveHolders = out.liveHoldersInCs > 1;
  return out;
}

// ---- Probe 2: GC + paused contender (the provider-capacity pruning bug) ---
async function probeGc(postCheck) {
  const d = newCase(`gc-paused-contender-postcheck-${postCheck}`);
  const lockDir = path.join(d, 'lock');
  const g1 = tryAcquire(lockDir);      // epoch 1, released below
  release(lockDir, g1);
  const c = actor(d, 'C', 'paused', { postCheck });
  waitFor(c.sig('decided'));           // C decided "epoch 1 released, I take epoch 2", paused before link
  const a = tryAcquire(lockDir);       // A wins epoch 2 for real, then releases
  release(lockDir, a);
  const b = actor(d, 'B', 'plain');    // B wins epoch 3 and stays in CS
  waitFor(b.sig('in-cs'));
  const removed = gc(lockDir);         // GC frees epochs 1 and 2 (below the high-watermark 3)
  const afterGc = listGenerations(dirs(lockDir).gens).map((g) => g.epoch);
  touch(c.sig('resume'));              // C's stale link targets the freed epoch 2
  waitFor(c.sig('result.json'));
  const out = {
    case: `gc-paused-contender, postCheck=${postCheck}`,
    epochsAfterGc: afterGc, filesRemovedByGc: removed,
    A_epoch: a.epoch, B: b.result(), C: c.result(),
    liveHoldersInCs: csNow(d),
    readersSeeCurrentEpoch: currentGeneration(dirs(lockDir).gens).epoch,
  };
  await finish(c, b);
  out.twoLiveHolders = out.liveHoldersInCs > 1;
  return out;
}

// ---- Probe 2b: randomized stress, aggressive GC ---------------------------
async function stress(postCheck, k, workers = 6, iterations = 60) {
  const d = newCase(`stress-postcheck-${postCheck}-${k}`);
  const outs = [];
  const procs = [];
  for (let i = 0; i < workers; i++) {
    const outFile = path.join(d, `w${i}.json`);
    outs.push(outFile);
    const o = { lockDir: path.join(d, 'lock'), csDir: path.join(d, 'cs'), iterations, postCheck, outFile };
    const p = spawn(process.execPath, [path.join(here, 'stress-actor.mjs'), JSON.stringify(o)], { stdio: 'inherit' });
    procs.push(new Promise((r) => p.on('exit', r)));
  }
  const t0 = Date.now();
  await Promise.all(procs);
  const rs = outs.map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
  return {
    case: `stress ${workers} procs x ${iterations}, GC p=0.7 after each release, postCheck=${postCheck}`,
    acquisitions: rs.reduce((s, r) => s + r.acquisitions, 0),
    csViolations: rs.reduce((s, r) => s + r.violations, 0),
    holeFillsDetectedAndRefused: rs.reduce((s, r) => s + r.holeFillsSeen, 0),
    finalEpoch: currentGeneration(dirs(path.join(d, 'lock')).gens).epoch,
    filesLeftInLedger: fs.readdirSync(dirs(path.join(d, 'lock')).gens).length,
    elapsedMs: Date.now() - t0,
  };
}

const results = [await probeA1(), await probeGc(false), await probeGc(true)];
for (const pc of [false, true]) for (let k = 0; k < 3; k++) results.push(await stress(pc, k));
const report = { node: process.version, host: os.hostname(), temporaryRoot: root, results };
fs.writeFileSync(path.join(here, 'probe-ledger-results.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
```

### H. `mixed-actor.mjs`

```javascript
// Mixed-version actor. argv[2] = JSON {role, fgosDir, sig, csDir, tag, postAcquireMarkerCheck}
// role "r1-code": the neutralized release (still writes v1 while the marker
//   says 1, re-reads the marker AFTER acquiring v1 and switches to v2).
// role "v2": a v2 writer (ledger only, only when marker says 2).
import fs from 'node:fs';
import path from 'node:path';
import { acquireMainCheckoutLock, ACQUIRED } from '/home/vantt/projects/forgentX/src/runner/main-checkout-lock.mjs';
import { tryAcquire, release, enterCs, leaveCs, touch, waitFor } from './ledger-v2.mjs';

const o = JSON.parse(process.argv[2]);
const s = (n) => path.join(o.sig, `${o.tag}.${n}`);
const ledgerDir = path.join(o.fgosDir, 'locks', 'main-checkout');
const markerPath = path.join(ledgerDir, 'protocol.json');
const readMarker = () => { try { return JSON.parse(fs.readFileSync(markerPath, 'utf8')).writer; } catch { return 1; } };
const out = (obj) => fs.writeFileSync(s('result.json'), JSON.stringify({ pid: process.pid, ...obj }));
const holdCs = (via, extra = {}) => {
  const n = enterCs(o.csDir, o.tag);
  out({ enteredCs: true, via, othersInsideOnEntry: n - 1, ...extra });
  touch(s('in-cs'));
  waitFor(s('finish'));
  leaveCs(o.csDir, o.tag);
};

function viaV2() {
  const r = tryAcquire(ledgerDir);
  if (r.status !== 'acquired') { out({ enteredCs: false, via: 'v2', status: r.status }); return; }
  holdCs('v2', { epoch: r.epoch });
  release(ledgerDir, r);
}

if (o.role === 'v2') {
  if (readMarker() !== 2) { out({ enteredCs: false, refused: 'marker-not-v2' }); }
  else viaV2();
} else {
  const before = readMarker();
  touch(s('read-marker'));
  waitFor(s('resume'));               // paused between reading the marker and acquiring v1
  if (before === 2) viaV2();
  else {
    const lock = acquireMainCheckoutLock(o.fgosDir, { identity: process.pid, ttlMs: 180000 });
    if (lock.status !== ACQUIRED) out({ enteredCs: false, via: 'v1', status: lock.status });
    else if (o.postAcquireMarkerCheck && readMarker() === 2) {
      lock.release();                 // marker moved while we waited: v1 is closed, go v2
      viaV2();
    } else {
      holdCs('v1');
      lock.release();
    }
  }
}
touch(s('done'));
```

### I. `probe-mixed-version.mjs`

```javascript
// Probe 3: mixed-version cases. Uses the real v1 primitive
// (src/runner/main-checkout-lock.mjs, read-only import) on temp dirs only.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { acquireMainCheckoutLock, forceReclaimAmbiguousLock, ACQUIRED } from '/home/vantt/projects/forgentX/src/runner/main-checkout-lock.mjs';
import { getBootId, getProcessStartTime } from '/home/vantt/projects/forgentX/src/runner/dispatch/process-identity.mjs';
import { tryAcquire, release, waitFor, touch } from './ledger-v2.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = fs.mkdtempSync(path.join(here, 'mixed-'));
const newCase = (name) => { const d = path.join(root, name); for (const x of ['.fgos', 'sig', 'cs']) fs.mkdirSync(path.join(d, x), { recursive: true }); return d; };

// (a) v2 record written into the v1 path: unneutralized v1 claim code deletes it.
function sameFile() {
  const d = newCase('a-v2-record-in-v1-file');
  const fgos = path.join(d, '.fgos');
  const rec = { v: 2, kind: 'mutex', owner: { pid: process.pid, startTime: getProcessStartTime(process.pid), bootId: getBootId(), host: os.hostname() }, token: 't', epoch: 7 };
  fs.writeFileSync(path.join(fgos, 'main-checkout.lock'), JSON.stringify(rec));
  const old = acquireMainCheckoutLock(fgos, { identity: process.pid + 1, ttlMs: 180000 });
  const force = forceReclaimAmbiguousLock(fgos); // exactly claim-port.mjs:131
  return { case: '(a) v2 record in the v1 path, unneutralized v1 claim', oldReader: old.status, oldClaimRecovery: force.status, v2RecordStillExists: fs.existsSync(path.join(fgos, 'main-checkout.lock')) };
}

// (b) v2 moved to a new path, no barrier: unneutralized v1 is blind to it.
function namespaceSplit() {
  const d = newCase('b-namespace-split');
  const fgos = path.join(d, '.fgos');
  const v2 = tryAcquire(path.join(fgos, 'locks', 'main-checkout'));
  const v1 = acquireMainCheckoutLock(fgos, { identity: process.pid + 1, ttlMs: 180000 });
  const out = { case: '(b) v2 ledger at a new path, unneutralized v1 on the old path', v2Status: v2.status, v1Status: v1.status, bothBelieveTheyHold: v2.status === 'acquired' && v1.status === ACQUIRED };
  v1.release?.();
  release(path.join(fgos, 'locks', 'main-checkout'), v2);
  return out;
}

// (c) protocol marker barrier with the paused-reader schedule.
async function barrier(postAcquireMarkerCheck) {
  const d = newCase(`c-marker-barrier-postcheck-${postAcquireMarkerCheck}`);
  const fgos = path.join(d, '.fgos');
  const ledgerDir = path.join(fgos, 'locks', 'main-checkout');
  fs.mkdirSync(ledgerDir, { recursive: true });
  const spawnActor = (tag, role) => {
    const o = { tag, role, fgosDir: fgos, sig: path.join(d, 'sig'), csDir: path.join(d, 'cs'), postAcquireMarkerCheck };
    const child = spawn(process.execPath, [path.join(here, 'mixed-actor.mjs'), JSON.stringify(o)], { stdio: 'inherit' });
    const sig = (n) => path.join(o.sig, `${tag}.${n}`);
    return { child, sig, result: () => JSON.parse(fs.readFileSync(sig('result.json'), 'utf8')) };
  };
  const p = spawnActor('P', 'r1-code');
  waitFor(p.sig('read-marker'));            // P read marker=1 and paused before acquiring v1
  // Raiser: hold the v1 lock (so no v1 critical section is in flight), publish marker=2, release.
  const raiser = acquireMainCheckoutLock(fgos, { identity: process.pid, ttlMs: 180000 });
  const tmp = path.join(ledgerDir, `.protocol.tmp-${process.pid}`);
  fs.writeFileSync(tmp, JSON.stringify({ writer: 2, raisedAt: Date.now() }));
  fs.renameSync(tmp, path.join(ledgerDir, 'protocol.json'));
  raiser.release();
  const v2 = spawnActor('V2', 'v2');         // a v2 writer takes the ledger and stays inside
  waitFor(v2.sig('in-cs'));
  touch(p.sig('resume'));
  waitFor(p.sig('result.json'));
  const out = { case: `(c) marker barrier, P re-reads marker after acquiring v1 = ${postAcquireMarkerCheck}`, raiserV1Status: raiser.status, V2: v2.result(), P: p.result(), liveHoldersInCs: fs.readdirSync(path.join(d, 'cs')).length };
  for (const a of [p, v2]) touch(a.sig('finish'));
  for (const a of [p, v2]) await new Promise((r) => (a.child.exitCode !== null ? r() : a.child.on('exit', r)));
  out.twoLiveHolders = out.liveHoldersInCs > 1;
  return out;
}

const results = [sameFile(), namespaceSplit(), await barrier(false), await barrier(true)];
const report = { node: process.version, temporaryRoot: root, results };
fs.writeFileSync(path.join(here, 'probe-mixed-version-results.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
```

### J. `bench-hotpath.mjs`

```javascript
// Uncontended cost of one acquire+release: today's link/unlink mutex shape
// (events.lock) vs the ledger model (production publishNextGeneration +
// release marker + GC that keeps only the high-watermark). Temp dir only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tryAcquire, release, gc, publishNextNoFsync } from './ledger-v2.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = fs.mkdtempSync(path.join(here, 'benchdata-'));
const N = 3000;

function stats(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { p50us: +(q(0.5) / 1000).toFixed(1), p95us: +(q(0.95) / 1000).toFixed(1), p99us: +(q(0.99) / 1000).toFixed(1) };
}

function linkUnlink() {
  const lockPath = path.join(root, 'events.lock');
  const t = [];
  for (let i = 0; i < N; i++) {
    const a = process.hrtime.bigint();
    const tmp = `${lockPath}.tmp-${process.pid}-${i}`;
    fs.writeFileSync(tmp, String(process.pid));
    fs.linkSync(tmp, lockPath);
    fs.unlinkSync(tmp);
    fs.unlinkSync(lockPath);
    t.push(Number(process.hrtime.bigint() - a));
  }
  return stats(t);
}

function ledger(gcEvery, fast = false) {
  const lockDir = path.join(root, `ledger-gc${gcEvery}-${fast}`);
  const t = [];
  for (let i = 0; i < N; i++) {
    const a = process.hrtime.bigint();
    const r = tryAcquire(lockDir, fast ? { publish: publishNextNoFsync } : {});
    release(lockDir, r, { fast });
    if (i % gcEvery === 0) gc(lockDir);
    t.push(Number(process.hrtime.bigint() - a));
  }
  return stats(t);
}

const out = {
  node: process.version,
  iterations: N,
  linkUnlinkMutex: linkUnlink(),
  ledgerGcEveryRelease: ledger(1),
  ledgerGcEvery16: ledger(16),
  ledgerNoFsyncGcEveryRelease: ledger(1, true),
  ledgerNoFsyncGcEvery16: ledger(16, true),
  note: 'fsync variants use production publishNextGeneration/publishMarkerOnce (fsync temp + dir); NoFsync variants keep the same link/EEXIST algorithm without fsync',
};
fs.writeFileSync(path.join(here, 'bench-hotpath-results.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
```
