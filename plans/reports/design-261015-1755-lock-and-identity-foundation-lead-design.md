# Thiết kế nền lock + identity (Lead)

- Ngày: 2026-10-15. Người viết: Lead (Claude Opus 5.5, phiên điều phối). Đây là **thiết kế đề xuất của Lead** để gửi phản biện độc lập (openai/tetcu72, gpt-6-astra), chưa phải quyết định đã duyệt, chưa phải plan triển khai.
- Gom và chốt từ: [báo cáo hội đồng](architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md) (mục 2, 5, 7, 10, 11), [spike S6](spike-s6-261015-1638-rust-identity-call-latency-pre-commit-hook.md), [đề xuất Rust-first](proposal-261015-1715-rust-first-component-hook-identity-lock.md), [kiểm kê lock](research-261015-1731-lock-inventory-and-standardization.md). Không lặp dữ kiện của các file đó; chỉ ghi chỗ Lead chọn, sửa hoặc thêm.
- Nguyên tắc chủ sở hữu đặt cho đợt này: One Door; phân tầng một chiều từ dưới lên; lõi chung + driver mỏng; component nền độc lập, ưu tiên Rust; đúng theo trạng thái thật của OS; KISS/DRY; mỗi component một quyền quyết định, code và tài liệu một nguồn sự thật.

## 1. Vấn đề cần giải

1. **Lock tùm lum:** khoảng 24 lock/claim/lease/marker; 14 bản tự cài cùng một ý (tạo độc quyền, kiểm pid sống, dọn holder chết), 10 Node + 4 Rust, mỗi bản tự chọn record, TTL, liveness, cách dọn. Có lock kẹt mãi sau crash, có chỗ dọn không đọc lại trước khi xoá, có lock bị cướp khi holder giữ quá 30 s ([kiểm kê](research-261015-1731-lock-inventory-and-standardization.md) mục 2–4).
2. **`main-checkout.lock` chặn work-item flow do lỗi thiết kế:** hook ghi session id và không ghi TTL; claim/land đọc bằng `process.pid` và TTL 180 s của chính chúng. Sau mỗi commit ở main, `pick/take/land` của mọi phiên, kể cả phiên vừa commit, bị chặn tới ~3 phút. Đã xác nhận trên source: [`claim-port.mjs:118`](../../src/runner/claim-port.mjs), [`merge.mjs:790,920,1895`](../../src/runner/merge.mjs), [`main-checkout-lock.mjs:112`](../../src/runner/main-checkout-lock.mjs).
3. **Identity quyết định quyền lock:** self-recognition so `record.pid === identity` ([`main-checkout-lock.mjs:306`](../../src/runner/main-checkout-lock.mjs)). Mọi agent trong một phiên Claude Code và mọi worker kế thừa `FGOS_SESSION_ID` của cha đều là "một writer" → lọt qua lock của nhau (RT2-2 của hội đồng; file lock lúc 17:40 đang ghi đúng id phiên Lead).
4. **Hai sự thật identity đang tồn tại:** Rust tự resolve writer id khác Node ([`observe/rust/src/shard.rs:9`](../../packages/observe/rust/src/shard.rs)); Rust tự đọc lại luật lock khác Node ([`distribution/rust/src/lock.rs`](../../packages/distribution/rust/src/lock.rs)).

## 2. Quyết định của Lead (trả lời các câu hỏi mở của các report)

| # | Câu hỏi | Lead chọn | Lý do ngắn |
|---|---|---|---|
| D1 | Gỡ kẹt `main-checkout.lock`: vá đệm hay tách | **Tách ngay (L1)**, không làm bản vá đệm | Bản vá đệm (ghi `ttlMs=20s`) vẫn giữ lỗi pid-vs-chuỗi và vẫn chặn 20 s, rồi phải bỏ; L1 phạm vi rõ |
| D2 | Giữ đèn của hook | **Giữ, chỉ cho hook** | Chi phí gần 0 sau khi tách; hook chỉ có ở repo fgOS; bỏ khi có số liệu cho thấy vô ích |
| D3 | Re-entry | **Chỉ qua grant token, cho mọi lock, cùng wave 1 (đi với 1c)** | Đây là cách duy nhất giữ được RT2-2: identity bằng nhau không bao giờ là quyền |
| D4 | Phạm vi dispatch cwd lock | **Máy (theo realpath cwd)**, làm ở L3 qua setup/doctor | Cwd là tài nguyên của máy; hai repo hoặc worktree ngoài repo hôm nay không thấy lock của nhau |
| D5 | Kiểu record | **Một file record v2 cho mutex/lease/đèn; giữ generation ledger cho lease cần fencing** (run control, provider) | Ledger có sẵn fencing và không có TOCTOU nhưng đắt cho đường nóng; record file rẻ cho mutex |
| D6 | Cách dọn holder chết | **Sửa đề xuất của kiểm kê** (mục 4.4): không dùng rename-reclaim | Rename-reclaim có lỗ mất loại trừ (mục 4.4) |
| D7 | Thời điểm Rust (OQ1) | **"d thu hẹp"**: sửa ngữ nghĩa ở Node trước có test vector (L0–L3, wave 1 identity), rồi port sang crate Rust; facade theo 5 điều kiện S6 | S6 đạt có điều kiện; hai bản Rust lệch đã tồn tại nên "Rust sau" = chấp nhận hai sự thật |
| D8 | Dọn đồ thừa | **Làm cùng L6** (`dispatch.claim`, doctor check `*.claim` coordination, 4 dispatch lock mồ côi, spec `runner.md` lệch TTL) | Cùng một registry |
| D9 | Root pane rỗng | **Bỏ (item 1f của hội đồng)**; chưa chọn ALT-TAB1 | Bằng chứng live mục 10 của báo cáo hội đồng |

## 3. Phân tầng (một chiều, từ dưới lên)

```text
L-os      process-facts        pid sống?, startTime, bootId, hostname        (chỉ đọc OS)
L-lock    holder-lock          mutex | lease | beacon, record v2, grant token  (dùng L-os; KHÔNG biết session)
L-id      session-identity     writer id + source, lineage                    (dùng L-os)
L-app     hook, claim, land, dispatch, events, workflow, gateway, ...         (dùng L-lock + L-id)
```

- **Thêm so với các report:** holder-lock **không phụ thuộc** session-identity. Quyền của lock chỉ dựa trên `owner` (pid + startTime + bootId) và `token`. Writer id do caller truyền vào record chỉ để hiển thị/audit. Nhờ vậy sửa identity (1c) không thể vô tình mở lock, và lock không cần chờ identity xong mới làm.
- **L-os đã có sẵn** ở [`src/runner/dispatch/process-identity.mjs`](../../src/runner/dispatch/process-identity.mjs) (70 dòng: `getBootId`, `getProcessStartTime`, `resolveHolderLiveness`). Kế hoạch: nâng nó thành leaf dùng chung (vị trí thấp hơn `dispatch/`), không viết thêm bản mới; xoá 11+ bản `isPidAlive`/kill-0 chép tay khi chuyển từng lock.
- Hiện có 4 luật liveness có start time khác nhau ([kiểm kê](research-261015-1731-lock-inventory-and-standardization.md) mục 3). Luật chuẩn duy nhất: pid không tồn tại, hoặc startTime khác, hoặc bootId khác → **chết**; đọc được và khớp → **sống**; không đọc được (không `/proc`, khác host) → **không rõ**, lùi về `ttlMs` của record có trần.

## 4. Holder-lock component

### 4.1 Record v2 (một schema)

```json
{"v":2,"kind":"mutex|lease|beacon","name":"main-checkout",
 "owner":{"pid":123,"startTime":"<proc stat field 22>","bootId":"<uuid>","host":"<hostname>"},
 "writer":{"id":"<writer id>","source":"env|registry|pid|unresolved"},
 "token":"<128-bit ngẫu nhiên>","epoch":7,
 "acquiredAt":0,"renewedAt":0,"ttlMs":0,"purpose":"land"}
```

`ttlMs` **luôn do holder khai trong record**; người đọc không bao giờ dùng TTL của mình. Đây là sửa gốc của lỗi 180 s.

### 4.2 Thao tác

`tryAcquire(name, opts) → handle | HELD{holder, overdue}`, `acquire(name, {waitMs})`, `renew(handle)`, `release(handle)`, `inspect(name)`, `grant(handle) → envValue`. `handle = {name, token, epoch}`.

### 4.3 Bảng quyết định (một bảng, có test vector, Node và Rust chạy cùng vector)

| Record hiện có | Quyết định |
|---|---|
| Không có | Tạo bằng temp + `link` → ACQUIRED |
| Hỏng / rỗng | Tuổi file > ân hạn ghi (2 s) → coi như holder chết, dọn theo 4.4; trong ân hạn → HELD. Không còn AMBIGUOUS vĩnh viễn |
| `token` = token của người gọi | Refresh (re-entry của chính handle) |
| Grant token khớp (env `FGOS_LOCK_GRANT=<name>:<token>`) | Mượn: làm việc dưới lock của cha, không đổi owner, không release được |
| `owner` chết theo L-os | Dọn theo 4.4 rồi acquire |
| `owner` sống, `now - renewedAt ≤ ttlMs` | HELD |
| `owner` sống, quá `ttlMs` | mutex/lease: HELD + `overdue` (không cướp holder sống); beacon: hết hạn |
| `owner` không rõ | Theo `ttlMs` của record, có trần |
| `writer.id` bằng nhau | **Không cấp quyền gì** |

Ngoại lệ có chủ đích: **beacon** so `writer.id` để biết "cùng phiên tiếp tục". Beacon không loại trừ và chỉ hook được đọc nó.

### 4.4 Dọn holder chết (Lead sửa đề xuất của kiểm kê)

Đề xuất rename-reclaim ([kiểm kê](research-261015-1731-lock-inventory-and-standardization.md) mục 7.1) có lỗ: nếu giữa lúc phán "holder chết" và lúc rename, holder cũ đã release và **holder mới đã acquire**, rename sẽ dời mất lock hợp lệ của holder mới; lúc đọc lại thấy khác thì định "publish lại nếu đường gốc trống", nhưng trong khe đó người thứ ba có thể đã tạo lock → **hai holder cùng tin mình giữ**.

Cách Lead chọn:

1. Người dọn tạo **sidecar `<name>.reclaim`** bằng `link` độc quyền (record v2 nhỏ, `ttlMs` vài giây). Mọi người dọn bị tuần tự hoá.
2. Dưới sidecar: đọc lại lock, phán lại bằng L-os. Chỉ khi nội dung y hệt bản đã phán **và** owner vẫn chết → `unlink` lock.
3. Lý do an toàn: lock có record (kể cả record chết) thì không ai acquire được (acquire chỉ tạo khi đường trống); owner chết không thể renew/release; chỉ người dọn được unlink, và người dọn đã bị tuần tự hoá. Đọc lại dưới sidecar nên không còn khe so-rồi-unlink giữa hai người dọn.
4. Sidecar chết thì được dọn **chỉ theo tuổi** (> `ttlMs` của nó, vài giây) bởi người dọn kế tiếp, không cần đệ quy.
5. Giả định phải ghi rõ: liveness đúng (pid + startTime + bootId); filesystem cục bộ hỗ trợ `link` và thấy ngay. Trên host khác / không đọc được liveness thì chỉ dọn sau `ttlMs` của record.
6. Nếu test đa process (L3) bác được cách này → chuyển toàn bộ mutex sang generation ledger (phương án 7.2 của kiểm kê), trả GC bằng doctor.

### 4.5 Fencing

`epoch` tăng mỗi lần acquire. Lease ghi state dài hạn (land, run control) mang epoch theo; người nhận từ chối epoch cũ. Run control và provider giữ ledger hiện có (D5).

### 4.6 Registry các lock (một dòng mỗi lock, doctor đọc)

| Lock | Kiểu | Phạm vi |
|---|---|---|
| events, claims, sessions, gateway, advance, reconcile, recovery | mutex | như hiện nay |
| runner | lease (renew trong drain) | repo |
| `main-checkout.lock` | mutex | repo |
| `main-checkout.activity` | beacon | repo |
| `merge-slot--<ref>` | lease | repo |
| dispatch cwd | lease | **máy**, theo realpath cwd (D4) |
| activation | mutex | repo |
| install, full-suite | mutex / lease | máy |
| observe store | mutex | repo |
| provider state/account, run control | ledger (giữ nguyên) | máy / run |
| confinement ownership marker | lease (đã có thiết kế riêng: item 1a của hội đồng) | máy |

Runtime claim (lease mềm theo hoạt động git) và fence một lần (proof bất biến, `update-ref` CAS) **không** vào component.

## 5. Tách `main-checkout.lock` (L1)

| Mới | Kiểu | Ai ghi / đọc | Hold |
|---|---|---|---|
| `.fgos/main-checkout.activity` | beacon | Chỉ hook ghi và đọc; `lock-status` hiển thị | `windowMs` ghi trong record (20 s như `HOOK_TTL_MS`) |
| `.fgos/main-checkout.lock` | mutex | Commit checkpoint `.fgos` của claim, land (`update-ref` + đồng bộ working tree), `fgctl init`; hook **chỉ đọc** (từ chối commit khi fgOS đang land) | giây; holder chết dọn ngay |

- Claim chỉ lấy mutex quanh đúng commit checkpoint ([`claim-port.mjs:168`](../../src/runner/claim-port.mjs)), không phải cả vùng claim; bỏ `forceReclaimAmbiguousLock`.
- `git branch` / `git worktree add`: **giữ trong mutex ngắn cho tới khi test đa process chứng minh git tự an toàn** (R1 của kiểm kê). Đây là chỗ Lead thận trọng hơn đề xuất.
- `promote-engine` và sync-root không-slot chuyển sang `merge-slot--<target>` (cùng lớp lỗi `ffc64b1aa` đã sửa cho root approve).
- Hook con của holder (commit checkpoint) vào bằng grant token (D3), thay `FGOS_MAIN_LOCK_HOLDER_PID`.
- Rust `lock.rs` đọc cả file mới theo record v2 (L1 phải sửa cùng, nếu không `fgctl init` đọc sai).
- Hệ quả: verb `unlock`, skill `fgos-unlock`, lớp `--wait` của take/pick còn rất ít việc → đánh giá xoá ở L6.

## 6. Identity (khớp wave 1 của hội đồng)

- 1b scrub session var CLI của cha; 1c mỗi attempt độc lập một writer id (`launchCommandId`, mint khi không có), id cha đi riêng làm lineage, phủ cả ba đường launch (cli-spawn, confined env, herdr pane không confined); 1d thêm `CODEX_THREAD_ID` vào env tier.
- Vì quyền lock đi qua token (D3), 1c chỉ còn ảnh hưởng **attribution** (events, claims, metrics), không ảnh hưởng loại trừ. T1 của hội đồng (cấm quay về id chung) vẫn giữ.
- **Rủi ro còn lại:** runtime claim dùng `writerId` để biết "ai đang làm item"; 1c làm mỗi worker một id → claim liveness/ownership theo id phải dùng lineage. Cần inventory consumer của `writer.id` (S1 của hội đồng) trước 1c.

## 7. Lộ trình (wave), mỗi bước xoá đường cũ trong cùng bước

| Bước | Việc | Xoá | Bằng chứng cần |
|---|---|---|---|
| W1-a | L0: spec + contract (record v2, bảng 4.3, registry, V-excl/V-reentry/V-lineage) + vector sinh từ test hiện có; nâng `process-identity.mjs` thành leaf L-os | — | Vector xanh trên Node |
| W1-b | L1 (mục 5) + grant token cho main-checkout (L2 phần main) | đường đọc đèn ở claim/land; `forceReclaimAmbiguousLock`; `HOLDER_PID_ENV_VAR` | Test đa process thật: commit ở main rồi pick ngay → thành công; hai land loại trừ; hook từ chối khi land giữ mutex; hai `git worktree add` song song (quyết có bỏ mutex quanh chúng không) |
| W1-c | Hội đồng 1b, 1c (sau S1), 1d, 1e, 1f; 1a sau khi S2 pass | homemade tab label, `closeIfEmpty`, `dispatchBatchKey` | Theo hội đồng: S1, S2, S3', S4; full `npm test` |
| W2 | L3: module Node `holder-lock` thay `main-checkout-lock.mjs`; chuyển từng lock, rủi ro thấp trước (gateway, sessions, runner, advance, reconcile, recovery, full-suite, claims, dispatch cwd → phạm vi máy); events.lock cuối | mỗi bản chép bị xoá trong commit chuyển nó; 11+ `isPidAlive` | Test sẵn có + test crash (file rỗng tự dọn; pid tái dùng bị bắt qua startTime); test đa process cho 4.4 |
| W3 | Rust: crate cho L-os + holder-lock + session-identity, port bằng vector; thay `lock.rs`, activation, install (thêm liveness), observe store lock, `shard.rs` | 4 bản Rust lệch | Cargo test chạy cùng vector; Node và Rust **không ghi chung một file** trong lúc chuyển |
| W4 | Facade Node gọi binary cho đường lạnh (claim, merge, dispatch) đủ 5 điều kiện S6; hook thành verb Rust native; events.lock chỉ chuyển khi exec nằm ngoài vùng giữ lock | logic Node tương ứng; hook Node | Đo lại S6 ≤ 5 ms p95; full `npm test` + cargo |
| W5 | L6: doctor check theo registry (lock mồ côi, dọn khi có bằng chứng chết), xoá đồ thừa (D8), sửa spec | doctor check `*.claim`, `dispatch.claim` | Doctor xanh; CHANGELOG |

W1-a/W1-b gỡ kẹt cho mọi project dùng fgOS (claim/approve chạy ở mọi project) và làm được ngay bằng Node.

## 8. Rủi ro và điều kiện bác bỏ

| # | Rủi ro / điều kiện | Xử lý |
|---|---|---|
| R1 | Hai `git worktree add` song song hỏng `.git` | Giữ mutex ngắn quanh chúng cho tới khi test chứng minh khác |
| R2 | Sidecar reclaim (4.4) sai khi liveness sai (pid reuse không bắt được, host khác) | L-os dùng startTime + bootId; host khác chỉ dọn theo TTL; test đa process; bác thì sang ledger |
| R3 | Holder sống nhưng treo giữ mutex mãi (không cướp holder sống) | Báo `overdue` kèm holder; `fgos unlock --force` có xác nhận; doctor hiển thị |
| R4 | Record v1/v2 cùng lúc (release cũ chưa restage, `fgos:dev`) | Reader đọc cả hai; writer v2 bật theo activation mới; không backward-compat cho ghi |
| R5 | 1c phá runtime claim theo writer id | Inventory consumer (S1) trước 1c; claim dùng lineage |
| R6 | Đổi phạm vi dispatch lock sang máy là đổi hợp đồng cài đặt | Qua setup/doctor registry; thư mục state máy đã có (`~/.local/state/fgos`) |
| F1 | Test đa process bác 4.4 hai vòng | Chuyển mutex sang ledger |
| F2 | Bằng chứng STR65 tái diễn sau khi claim không đọc đèn | Đánh giá lại D2 |
| F3 | S1 cho thấy consumer cần re-entry ngầm theo id kế thừa | Đánh giá lại D3 (nhưng không được quay về so identity; T1) |

## 9. Câu hỏi còn mở cho chủ sở hữu

1. Duyệt D1–D9 hay đổi câu nào?
2. W1-b đụng claim/approve ở mọi project: làm trong một track riêng có plan, hay gộp vào plan wave 1 của hội đồng?
3. ALT-TAB1 (một tab xuyên các pha tuần tự) có cần không, hay chấp nhận pha sau mở tab mới cùng nhãn?
