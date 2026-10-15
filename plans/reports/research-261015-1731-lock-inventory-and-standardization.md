# Kiểm kê lock và đề xuất chuẩn hoá một lock component cho fgOS

- Ngày: 2026-10-15. Người viết: em (subagent `lock-inventory`, Claude Opus 5.5), theo yêu cầu của Lead.
- Loại: research, chỉ đọc. Đây là input cho vòng chuẩn hoá tầng thấp (session-identity, terminal-control, process supervisor), **không phải quyết định**.
- Đọc kèm (không lặp lại nội dung): [báo cáo hội đồng](architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md) mục 2, 5, 7; [spike S6](spike-s6-261015-1638-rust-identity-call-latency-pre-commit-hook.md); [đề xuất Rust-first](proposal-261015-1715-rust-first-component-hook-identity-lock.md).
- No component-boundary change: báo cáo này không sửa code, spec hay boundary map.

## 1. Tóm tắt

1. fgOS có **khoảng 24 cơ chế lock/claim/lease** (mục 2). Có **14 bản cài đặt riêng** của cùng một ý tưởng "tạo file độc quyền, kiểm pid sống, dọn holder chết": 10 bản ở Node, 4 bản ở Rust. Mỗi bản tự chọn record, TTL, timeout và cách dọn. Bảy bản có lỗi đã biết hoặc mới thấy (mục 3).
2. **Nguyên nhân chính khiến work-item flow kẹt ở `main-checkout.lock` là một lỗi thiết kế, không phải do người dùng sai.** Hook ghi một record dạng "phiên X vừa commit" và không bao giờ release. `claimWork` và bước land của approve đọc record đó bằng **TTL của chính chúng (180 s)**, không phải TTL 20 s của hook. Em đo lại trên thư mục nháp: 30 s sau khi **chính phiên đó** commit, `pick/take` của chính phiên đó vẫn bị `held`, còn chờ 150 s (mục 5.1). Fix `tsk-1d9` (`001b73d87`) chỉ rút ngắn va chạm commit-với-commit, không chạm va chạm commit-với-claim mà chính nó đo được.
3. Cùng lock đó có lỗi ngược chiều: mọi agent trong một phiên Claude Code dùng chung `CLAUDE_CODE_SESSION_ID`. Hook coi tất cả là **một writer**. Lúc em viết báo cáo, `.fgos/main-checkout.lock` đang ghi đúng id phiên này (`bbe6155f-…`), do agent anh em commit. Đây là bằng chứng sống của lớp lỗi RT2-2.
4. `main-checkout.lock` đang gánh **hai việc khác nhau**: (a) đèn báo "có người vừa commit ở main" cho hook, (b) mutex cho các thao tác fgOS ghi vào index/HEAD của main. Đề xuất tách làm hai (mục 5.4). Claim không cần (a). Claim chỉ cần (b) quanh đúng một commit checkpoint.
5. Đề xuất chuẩn hoá: **một holder-lock component** với ba kiểu (mutex, lease, đèn báo), record v2 có `pid+startTime+bootId+token`, liveness từ OS, **re-entry chỉ qua grant token tường minh, không bao giờ qua so sánh identity**. Ngữ nghĩa sửa ở Node trước, có test vector, rồi port sang crate Rust như đề xuất Rust-first. Phương án thay thế: lease kiểu generation ledger (đã có trong repo) cho mọi lock (mục 7).

## 2. Kiểm kê

Ký hiệu cột "Holder": `pid` = `process.pid` thô; `json{…}` = trường trong record. Cột "Sống?" = cách kiểm liveness. Cột "Dọn" = cách gỡ holder chết. "RR" = có đọc lại và so nội dung trước khi unlink. Mọi đường dẫn tính từ gốc repo.

### 2.1 Họ `main-checkout-lock.mjs` (một primitive, ba họ file)

Primitive chung: [`src/runner/main-checkout-lock.mjs`](../../src/runner/main-checkout-lock.mjs). Tạo bằng temp + `link` (`writeAtomicCreate`, dòng 239). Thay bằng temp + `rename`. Record `{"pid": <số hoặc chuỗi>, "ts": ms, "ttlMs"?}`; `ttlMs` chỉ được ghi cho identity composite (`lockRecord`, dòng 225). Self-recognition ở dòng 306: `allowSelfRecognition && record.pid === identity`. Holder số: held khi pid sống **và** tuổi ≤ TTL **của người tranh**. Holder chuỗi: chỉ xét TTL của người tranh; không có TTL thì AMBIGUOUS. Composite `pid:ts:rand` (dòng 174) được kiểm pid chết ngay (dòng 335-352). Dọn: RR (dòng 369-384). Release-if-own (dòng 544), renew-if-own (dòng 608).

| Lock | Bảo vệ gì | Phạm vi | Writer / reader | Holder | TTL / heartbeat | Re-entry |
|---|---|---|---|---|---|---|
| `.fgos/main-checkout.lock` (hook) | Hai phiên commit liên tiếp vào index của main | repo, chỉ khi commit ở main ([`.githooks/pre-commit:166`](../../.githooks/pre-commit) `hookRunsAtHome`) | Ghi: hook dòng 475 | Chuỗi session id, pid tổ tiên, hoặc pid mượn từ `FGOS_MAIN_LOCK_HOLDER_PID` (dòng 123) | 20 s (`HOOK_TTL_MS`, dòng 133), **không ghi vào record**; không bao giờ release | Theo identity bằng nhau |
| `.fgos/main-checkout.lock` (claim) | Vùng claim: đọc state, commit checkpoint `.fgos`, tạo branch/worktree | repo | [`claim-port.mjs:118`](../../src/runner/claim-port.mjs), retry ở `:132` sau `forceReclaimAmbiguousLock` | `process.pid` | 180 s, `releaseOnExit`, release sớm trước `npm ci` (`535000938`) | Theo pid (thực tế không có) |
| `.fgos/main-checkout.lock` (land) | `update-ref` + đồng bộ working tree của main | repo | [`merge.mjs:1895`](../../src/runner/merge.mjs) `landCasMergeUnderLock` | `process.pid` | 180 s; chờ tối đa 60 s (`CAS_LAND_LOCK_WAIT_MS`, dòng 1873) | — |
| `.fgos/main-checkout.lock` (merge không slot) | Cả merge + verify | repo | [`merge.mjs:920`](../../src/runner/merge.mjs); gọi từ [`promote-engine.mjs:75`](../../src/runner/promote-engine.mjs), [`sync-root.mjs:108`](../../src/verbs/merge/sync-root.mjs) | `process.pid` | 180 s, heartbeat 60 s (`4730ecf87`) | Hook con nhận qua `HOLDER_PID_ENV_VAR` |
| `.fgos/main-checkout.lock` (verb) | `unlock`, `lock-status`, release lúc `return` | repo | [`bin/fgos.mjs:4238`](../../bin/fgos.mjs), release-if-own ở `:1408/1425/1795/3566/3596` | `process.pid` / writer id | 180 s | — |
| `.fgos/main-checkout.lock` (Rust đọc) | `fgctl init` không chạy khi Node đang giữ | repo | [`distribution/rust/src/lock.rs:137`](../../packages/distribution/rust/src/lock.rs), gọi từ `init.rs:805/847/886` | chỉ đọc | 180 s cứng | — |
| `.fgos/merge-slot--<ref>.lock` | Một merge mỗi target ref (đọc tip → update-ref) | repo, theo ref | [`merge.mjs:770`](../../src/runner/merge.mjs) `withMergeTargetSlot`; [`approve.mjs:465`](../../src/verbs/merge/approve.mjs), [`sync-root.mjs:212`](../../src/verbs/merge/sync-root.mjs) | `process.pid` (`b5c235552`) | 180 s, heartbeat | Tắt được (`allowSelfRecognition:false`, `65aaa2d0b`) |
| `.fgos/dispatch--<cwd>.lock` | Một dispatch ghi cho mỗi worktree | repo, theo cwd tuyệt đối | Ghi: [`dispatch/cli.mjs:725-774`](../../src/runner/dispatch/cli.mjs), [`assignment-runner.mjs:2216-2252`](../../src/runner/dispatch/assignment-runner.mjs). Đọc: [`execution/run.mjs:345`](../../src/runner/execution/run.mjs), [`reconciliation-planner.mjs:197`](../../src/runner/dispatch/reconciliation-planner.mjs) | Composite `pid:ts:rand` | TTL = run timeout, ghi vào record; renew mỗi ttl/3; trần 4 h (`6020bcf0b`) | Không (mỗi lần gọi một id mới) |

### 2.2 Các lock Node khác

| Lock | Bảo vệ gì | Phạm vi | Cơ chế / holder | Sống? / dọn | Release | Lỗi thấy |
|---|---|---|---|---|---|---|
| `.fgos/events.lock` ([`events.mjs:52`, `:354`](../../src/state/events.mjs)) | Đọc seq cuối rồi append; mọi CAS đọc-kiểm-ghi của `store.mjs`, `porting-store.mjs`, compaction | repo (main `.fgos`) | link; `pid` thô; chờ 5 s, bước 10 ms | kill-0, RR | `finally`, không kiểm chủ | Comment dòng 47 ghi "2s", code 5000 ms |
| `.fgos/runtime/claims.lock` ([`runtime-coordination.mjs:58`](../../src/state/runtime-coordination.mjs)) | Đọc/ghi `.fgos/runtime/claims/<id>.json` | main `.fgos` (`getMainFgosDir`) | link; `json{pid,ts}`; chờ 2 s | pid chết **hoặc tuổi > 30 s** → unlink **không RR** (dòng 86-93) | `finally` unlink **không kiểm chủ** | Holder chạy > 30 s bị cướp, rồi xoá lock của người cướp. Nội dung hỏng không bao giờ được dọn (chờ hết 2 s rồi lỗi) |
| `.fgos/sessions.lock` ([`session.mjs:43`, `:258`](../../src/runner/session.mjs)) | `sessions.json` | repo | link; `pid`; chờ 10 s | kill-0, RR | không kiểm chủ | — |
| `.fgos/runner.lock` ([`loop.mjs:136`, `:256`](../../src/runner/loop.mjs)) | Một runner mỗi repo | repo | link; `pid`; thử 2 lần rồi exit 6 | kill-0, RR | không kiểm chủ; không TTL, giữ cả drain | — |
| `.fgos/gateway.lock` ([`gateway-control.mjs:36`, `:154`](../../src/runner/gateway-control.mjs)) | check-build-spawn gateway | repo | link; `pid`; chờ 120 s | kill-0, RR | không kiểm chủ | — |
| `.fgos/workflow-runs/<id>/advance.lock` ([`workflow/runner.mjs:783`, `:833`](../../src/workflow/runner.mjs)) | Một lần advance mỗi run | run | `open('wx')` rồi ghi pid (có khe file rỗng; ân hạn mtime 2 s) | kill-0, unlink **không RR** (`:848-852`) | **có** kiểm chủ (`:839`) | TOCTOU khi dọn |
| `.fgos/dispatch/reconcile.lock` ([`reconciliation-planner.mjs:379`](../../src/runner/dispatch/reconciliation-planner.mjs)) | Một reconcile apply | repo | `open('wx')` rồi `writeSync` `json{pid,startTime}` | pid+startTime; unlink **không RR** | `finally` | File rỗng sau crash → `blocked` mãi; máy không có `/proc` → `ambiguous` mãi |
| `<runDir>/.recovery.lock` ([`recover.mjs:153`](../../src/verbs/dispatch/recover.mjs)) | Một recovery apply mỗi run | run | `open('wx')` rồi ghi pid | kill-0; holder đọc không được = **sống** | `finally` | File rỗng sau crash → kẹt mãi; dọn không RR; không chống pid reuse |
| provider `state-lock` + `account-locks/<p>/<acct>/lock` ([`provider-capacity.mjs:48`, `:555`, `:693`](../../src/runner/dispatch/provider-capacity.mjs)) | `state.json` capacity; một login refresh mỗi account | máy (runtime dir) | **generation ledger**: file epoch tăng dần, publish bằng link, không bao giờ unlink; `json{pid,processStartTime}`; chờ 30 s | `resolveHolderLiveness` (pid+start time+boot id) | ghi `releasedAt` | Ledger tăng không giới hạn (code tự nhận) |
| run control ([`dispatch/run-lock.mjs:306`](../../src/runner/dispatch/run-lock.mjs)) | Fencing epoch+token cho một Run | run | Generation ledger + release marker | Chỉ reclaim khi có bằng chứng pid chết | Token phải khớp | Biến `heartbeatFresh` thật ra là tuổi kể từ acquire, không có renew |
| provider lease trong `state.json` (`provider-capacity.mjs:829`) | Account đang được một Run dùng | máy | `json{runId,pid,processStartTime}` dưới state-lock | pid chết và worker chết | `:897` | — |
| ownership marker `.fgos-confinement-owner.json` ([`confinement/cleanup.mjs:17`, `:91`](../../src/runner/dispatch/confinement/cleanup.mjs)) | Private home (có OAuth token) thuộc dispatch nào | máy | `json{pid,createdAt,timeoutMs,paneId?}` | kill-0, không start time; quá `max(maxAge, timeout+600 s)` | reaper `:376` | Đây là lease không heartbeat; RT2-1 và `p-c3a41d07` nằm ở đây (hội đồng đã xử lý riêng) |
| runtime claim `.fgos/runtime/claims/<id>.json` ([`runtime-coordination.mjs:179`](../../src/state/runtime-coordination.mjs)) | Ai đang làm work item | main `.fgos` | `json{claimId,writerId,…,hardExpiresAt}` | **Theo hoạt động git**, không theo pid ([`claim-liveness.mjs:102`](../../src/runner/claim-liveness.mjs)) | `releaseClaim` | Lease mềm, đúng kiểu cho việc của người |
| `/tmp/fgos-full-suite.lock` ([`scripts/lib/full-suite-queue.mjs:20`](../../scripts/lib/full-suite-queue.mjs)) | Một full suite mỗi máy | **máy** | `open('wx')` + ghi `json{pid,cwd,startedAt}`; chờ không giới hạn | kill-0, unlink không RR | kiểm pid; chỉ `exit`, không SIGINT/SIGTERM | — |
| `dispatch.claim` (assignment) | Một dispatch mỗi Assignment | run | `open('wx')`, file rỗng | Không có | `recover.mjs:239` unlink vô điều kiện | **Writer không còn trên main** (`session-engine.mjs` chỉ ở worktree cũ); [`docs/specs/runner.md:29`](../../docs/specs/runner.md) vẫn tả nó như đang dùng |
| `.fgos/coordination/sessions/*.claim` ([`setup/registrations.mjs:5919`](../../src/setup/registrations.mjs)) | Claim phiên coordination | repo | mkdir, `claim.json{pid,token,processStartTime}` | doctor kiểm | doctor fix | Writer đã bị xoá cùng L4 coordination (`2180b4e72`); doctor check còn quét đường dẫn không ai tạo |

### 2.3 Rust

| Lock | Bảo vệ gì | Phạm vi | Cơ chế / holder | Sống? / dọn | Release | Lệch so với Node |
|---|---|---|---|---|---|---|
| `.fgos/installation/activation.lock` ([`init.rs:164-287`](../../packages/distribution/rust/src/init.rs)) | Một lần publish activation mỗi workspace | repo | temp + `hard_link`; `json{pid,ts}` | pid sống và ≤ 180 s; nội dung hỏng = stale (cố ý); chuỗi = **không bao giờ** stale; RR | `Drop` xoá vô điều kiện | Không heartbeat: publish > 3 phút bị cướp. Release không kiểm chủ |
| `~/.local/state/fgos/install.lock` ([`store.rs:24-57`](../../packages/distribution/rust/src/store.rs)) | Một `stage_release` mỗi máy | **máy** | `create_new`, file rỗng | **Không có** | `Drop` | SIGKILL → kẹt mãi, phải xoá tay |
| `.fgos/observe/.lock` ([`observe/store_lock.rs:139`](../../packages/observe/rust/src/store_lock.rs)) | Ghi journal observe (case, eval, friction) | repo | `create_new` rồi ghi; `json{pid,startTime,ts}`; chờ 5 s | ESRCH, `/proc`, start time; hết hạn theo **mtime 30 s**; dọn **không RR** | `Drop` vô điều kiện | Lock duy nhất ghi start time. Không heartbeat: ghi > 30 s bị cướp. `FGOS_NOW` được đọc trong production |
| `lock.rs` (đọc `main-checkout.lock`) | xem 2.1 | | | | | Không có nhánh composite; bỏ qua `ttlMs` trong record; luôn 180 s |
| `shard.rs:9` `resolve_writer_id` ([link](../../packages/observe/rust/src/shard.rs)) | Không phải lock; tên shard theo writer | | Chỉ đọc `FGOS_SESSION_ID`, fallback `pid-<own>` | | | Không đọc `CLAUDE_CODE_SESSION_ID`, không walk 3 bước (đề xuất Rust-first mục 2.3 đã nêu) |

Không phải lock (đã kiểm): [`worker-slots.mjs`](../../src/state/worker-slots.mjs) (đếm thuần, không TTL), proof bất biến publish bằng link (`detached-run-supervisor.mjs`, `proof-helpers.mjs`), `herdr-fgos-common/fgos.rs`, `gateway.rs:313` (chỉ comment), `cf_access.rs` (Mutex trong process).

### 2.4 Rác đang nằm trên đĩa

`ls .fgos` lúc 17:40 có 4 file `dispatch--…lock` từ 19/08 đến 15/09 (worktree `tsk-4bq`, `tsk-68j`, hai thư mục `dispatch-operability-implementation-i0x`). Không gì dọn chúng. Chúng chỉ bị đánh giá khi có người tranh cùng cwd. Guard resume ở [`execution/run.mjs:345-360`](../../src/runner/execution/run.mjs) từ chối resume khi pid trong record còn sống, **bỏ qua TTL**. Nếu pid cũ bị tái dùng, resume worktree đó bị từ chối mãi.

## 3. Ai chép logic của ai

| Logic | Số bản | Nơi |
|---|---|---|
| Tạo độc quyền + kiểm pid + dọn | 14 | Node: events, sessions, runner, gateway, main-checkout, claims, advance, reconcile, recovery, full-suite. Rust: activation, install, observe, (lock.rs chỉ đọc) |
| `isPidAlive` / kill-0 | ≥ 11 | các file trên, cộng `run.mjs:350`, `cleanup.mjs:362`, `provider-credential-renewal.mjs:697`; Rust khai báo `extern "C" fn kill` 3 lần |
| Liveness có start time | 4, luật khác nhau | `process-identity.mjs` (start time thiếu = held), reconcile (thiếu = ambiguous), observe Rust (khác nhau = chết), `cwdLockHolder` của reconcile (so wall-clock với `ts`, lề 5 s) |
| Regex composite + tên file dispatch lock | 2 | `main-checkout-lock.mjs:174` và `reconciliation-planner.mjs:125/197` (bị cấm import, được ghim bằng test) |
| Generation ledger | 2 | `provider-capacity.mjs:391-624`, `run-lock.mjs:143-266` |
| Heartbeat `max(250, ttl/3)` | 3 | `cli.mjs:768`, `assignment-runner.mjs:2248`, `merge.mjs` |
| Writer identity | 2 (lệch) | `session-identity.mjs` và `shard.rs` |

Lệch nguy hiểm nhất: **hai reader đánh giá cùng một file `dispatch--<cwd>.lock` bằng hai luật**. Đường acquire coi holder có pid sống là held tới hết TTL. Reconcile coi holder là chết nếu tiến trình mang pid đó khởi động sau `ts`. Reconcile có thể dọn thứ mà đường acquire còn coi là đang giữ, và ngược lại.

## 4. Lịch sử sự cố, gom theo nguyên nhân gốc

| Nguyên nhân | Sự cố và fix (commit) | Còn mở |
|---|---|---|
| **Identity trùng** (hai process khác nhau bị coi là một writer) | Merge slot: id session kế thừa làm hai process tự nhận nhau (`tsk-1wr`, `65aaa2d0b` tắt self-recognition; `tsk-18k` `b5c235552` đổi sang pid). Root→main merge với fanout cùng session (`tsk-70l` `c871cdcf1`, thêm `FGOS_MAIN_LOCK_HOLDER_PID`). Worker con kế thừa `FGOS_SESSION_ID` của cha ([`transport.mjs:535`](../../src/runner/dispatch/transport.mjs); hội đồng F03, RT2-2) | Mọi subagent của một phiên Claude dùng chung `CLAUDE_CODE_SESSION_ID`: bằng chứng sống ở mục 1. RT2-2 chưa đóng |
| **Identity không ổn định** (một process ra hai id) | `ps` chậm làm walk dừng ở hop khác: "writer identity mismatch" (`5d96919b5`, `fa4917cec` đọc `/proc`). `ps` treo bên trong `events.lock` (`tsk-13m` `6ab5e02ad`) | Hết trên Linux; macOS vẫn dùng `ps` |
| **Identity tự va chính mình** | Commit checkpoint `.fgos` bị hook của chính holder từ chối, file nằm staged (`tsk-32v` `00aafe0ce`). Claim của một phiên bị chính commit của phiên đó chặn (mục 5.1, **mới, chưa có fix**) | Có |
| **Holder chết / lock mồ côi** | Không có `ttlMs` → AMBIGUOUS vĩnh viễn, mọi take/pick kẹt (`de852ff44`). Thêm verb + skill `unlock` (`8ef58808f`, `d562bd6da`). Tự dọn AMBIGUOUS trong claim (`tsk-2l8` `05cfcaef3`). Dispatch holder chết vẫn chặn hết TTL (`d6b48eb90`). Activation lock mồ côi sau SIGKILL (`e7c941346`). Recovery/reconcile lock kẹt mãi (`de2fb7161`, `4ac564397` M9a). Guard resume đọc sai tên file nên không bao giờ chặn (`1e8b5a048`) | `install.lock`, `.recovery.lock` file rỗng, `reconcile.lock` file rỗng hoặc không `/proc`, dispatch lock mồ côi trên đĩa |
| **TOCTOU** | Tạo rồi mới ghi để lộ file rỗng: events (`962eb6b80`), sessions (`bc219f8e5`), runner (`28a48d65f`), main-checkout (`tsk-2tm` `eda082bd5`), activation (`ccb12c383`). Lock mất giữa merge (`tsk-2qp` `e9b884dbb`, `0783a22a9`). Re-check own-file-set dưới lock (`59e69c18e`). Settlement CAS (`2681b3898`, `3d6c00444`) | Dọn không RR: claims, advance, reconcile, recovery, full-suite, observe. Ngay cả RR cũng còn khe giữa so và unlink (code tự nhận ở `reconciliation-planner.mjs:580`) |
| **TTL quá ngắn / thiếu heartbeat** | Verify của merge 185 s > TTL 180 s (`tsk-4l8` `4730ecf87`). `npm ci` giữ lock quá TTL; heartbeat không chạy được vì code đồng bộ, phải thu hẹp vùng giữ (`tsk-1mn` `535000938`). Dispatch không heartbeat (`d6b48eb90`). Người tranh có TTL ngắn hơn cướp lock của holder (`7eec849ac`). Hạ TTL chung 5 → 3 phút (`1dabb6b8f`). Timeout `events.lock` lên 5 s (`dc8a61c58`). Capacity lock chờ 30 s (`60b5dd371`) | claims (30 s), observe (30 s), activation (180 s) không heartbeat |
| **TTL quá dài** | Hook giữ main 2/3 thời gian làm việc (`tsk-1d9` `001b73d87`, tách 20 s). Trần 4 h cho ttl do holder tự ghi, vì pid tái dùng trông như sống (`6020bcf0b`) | Claim/land vẫn đọc record hook bằng 180 s (mục 5.1) |
| **Phạm vi sai với linked worktree** | Hook chặn commit trong worktree không liên quan (`tsk-sir` `981edd86e`). Leaf approve lấy lock trong worktree tạm đã xoá `.fgos`, không bao giờ tranh (`tsk-2eq` `8d5e52413`). Root merge giữ main lock suốt verify trong worktree tạm (`ffc64b1aa`). Merge queue theo target ref (`e5810b866`). Dispatch lock theo cwd thay vì cả main (`tsk-64hk` `e28de3b7f`; `tsk-2e7` xác nhận) | `promote-engine.mjs:75` và nhánh không-slot của sync-root vẫn giữ main lock suốt merge + verify trong worktree tạm. Lock file nằm trong repo trong khi herdr và worktree ngoài repo dùng chung (hội đồng mục 2) |
| **Lệch giữa ngôn ngữ** | Bản Rust đọc lại luật main-checkout (`fbecde3a5`, `e7c941346`) | `lock.rs` thiếu composite và `ttlMs` trong record; `init.rs` coi chuỗi là không bao giờ stale; `shard.rs` khác writer id |
| **Ma sát với người** | Verb `unlock`, skill `fgos-unlock` (`8ef58808f`). `lock-status` (`435ddf3db`). `--wait` retry (`tsk-6c2` `d6c464be8`, `tsk-2rf` `204227333`). Thông báo tự/khác holder (`tsk-6uc` `4ea17d8e2`), ETA (`tsk-6ci` `9b06831ff`), busy-spin (`tsk-mgb` `963debe47`), thông báo trung thực cho holder chuỗi (`tsk-24t` `92b31dd6a`) | Bốn lớp UX bọc quanh một lock vẫn chặn sai người |

Prior art quan trọng cho thiết kế mới:

- **`f1c315d3f` (2026-09-07) gỡ "actor lease"** vì nó đọc rồi ghi mà không có gì ở giữa, hai process cùng thấy ghế trống. Bài học được ghi trong commit: chỉ xây lock khi có một thứ thật cần tuần tự hoá.
- **Generation ledger** (`3c8d518cb`, `58613b1c4`, `run-lock.mjs`) là thiết kế duy nhất trong repo không bao giờ unlink. Nhờ vậy nó không có TOCTOU khi dọn, và có sẵn fencing token (epoch).
- `git log -S` không cho thấy holder-lock chung nào từng tồn tại rồi bị gỡ. Mỗi bản đều tự ghi "mirrors X, deliberately NOT imported" (ví dụ [`main-checkout-lock.mjs:7-14`](../../src/runner/main-checkout-lock.mjs)). Tức là việc chép là chủ ý từ đầu (zero-dep, test độc lập), không phải tai nạn. Theo RUL11, đây là tùm lum cần gom.

## 5. Phân loại

| Kiểu | Định nghĩa | Thành viên hiện nay |
|---|---|---|
| **Mutex** (vùng găng ngắn, acquire và release trong cùng một lời gọi) | Loại trừ, holder chết thì dọn được ngay | events, claims, sessions, gateway, advance, reconcile, recovery, activation, install, observe, provider state-lock, account lock, main-checkout (claim, land, verb) |
| **Lease** (giữ qua thao tác dài, có renew) | Loại trừ có thời hạn do holder khai, renew, có fencing khi mất | dispatch cwd, merge slot, main-checkout (merge không slot), run control (có fencing thật), runner.lock (giữ cả drain, không TTL), full-suite queue |
| **Đèn báo hiện diện** (không release, TTL là cách xoá duy nhất) | "Ai đó vừa làm X ở đây", không phải loại trừ | main-checkout.lock do hook ghi |
| **Lease mềm cho việc của người** | Hết hạn theo hoạt động, không theo pid | runtime claim |
| **Ownership marker** | Tài nguyên thuộc ai, reaper dọn | confinement marker (một lease thiếu heartbeat và start time) |
| **Fence một lần** (tạo độc quyền, không bao giờ release) | Idempotency | proof bất biến, herdr launch collision, `dispatch.claim`, `update-ref` CAS |

Nhận xét:

1. **Mutex và lease là cùng một primitive** khác tham số: ai renew, TTL do ai khai, có fencing hay không. Mười bốn bản cài đặt nên còn một.
2. **Đèn báo không phải mutex.** Lỗi lớn nhất là `main-checkout.lock` trộn đèn báo của hook với mutex của claim/land trong cùng một file và cùng một bảng quyết định.
3. **Sai phạm vi:**
   - Claim lấy main mutex cho cả vùng claim, dù state đã có `events.lock` + `claims.lock`. Thứ duy nhất trong claim ghi vào index của main là commit checkpoint `.fgos` ([`claim-port.mjs:168`](../../src/runner/claim-port.mjs)).
   - `promote-engine` và sync-root không-slot giữ main lock cho merge diễn ra trong worktree tạm. Đây đúng là lớp lỗi `ffc64b1aa` đã sửa cho root approve; nên dùng merge slot của target.
   - `dispatch--<cwd>.lock` khoá một cwd tuyệt đối nhưng nằm trong `.fgos` của repo. Cwd là tài nguyên của máy. Hai repo, hoặc một worktree nằm ngoài repo, không thấy lock của nhau.
   - `install.lock` (máy) và `full-suite` (máy, `/tmp`) đúng phạm vi.
4. **Thừa:** `dispatch.claim` (không còn writer trên main), doctor check `*.claim` của coordination (writer đã xoá), skill `fgos-unlock` khi lock không còn chặn claim nữa (mục 6).

## 6. Riêng `main-checkout.lock`

### 6.1 Vì sao work-item flow cứ đụng nó

Em tái hiện trên thư mục nháp, gọi thẳng primitive, không chạm lock thật:

```text
hook commit, phiên A, 30 s trước (ttl 20 s)        -> acquired
pick/take của chính phiên A bây giờ (pid, 180 s)    -> held, remainingTtlMs 150000
commit của phiên B bây giờ (ttl 20 s)               -> acquired
```

Lý do, theo thứ tự:

1. **TTL do người tranh chọn.** Record của hook không chứa `ttlMs` (`lockRecord` chỉ ghi cho composite, dòng 225). Claim và land đánh giá nó bằng 180 s. Vì vậy sau **mọi** commit ở main, mọi `pick/take/approve-land` của mọi phiên bị chặn tới 3 phút. `tsk-1d9` đo đúng triệu chứng này ("lock warm 2/3 thời gian") nhưng chỉ đổi TTL phía hook (D2: "never touches claim-port.mjs/merge.mjs").
2. **Hai họ identity không bao giờ bằng nhau.** Hook dùng session id (chuỗi). Claim và land dùng `process.pid` (số). Phiên tự chặn chính mình. Thông báo của `lock-wait.mjs` còn nói "likely your own session's other in-flight call".
3. **Holder chuỗi không có liveness.** Phiên đã thoát vẫn chặn đủ 180 s. `unlock` cũng từ chối, vì nó dùng cùng bảng quyết định ([`bin/fgos.mjs:4238`](../../bin/fgos.mjs)).
4. **Main checkout giờ là nơi Lead commit report và docs.** Hôm nay có nhiều phiên cùng commit report (git log 15/10). Mỗi commit làm mới đèn.
5. **Land chờ 60 s sau verify.** Commit ở main trong 2 phút trước land làm approve thất bại **sau khi đã verify xong** (`CAS_LAND_LOCK_WAIT_MS`, [`merge.mjs:1873`](../../src/runner/merge.mjs)). Đây là suy luận từ code; em chưa đo một lần approve thật.
6. **Ngược lại, nó loại trừ quá ít:** mọi agent trong một phiên Claude là một writer (mục 1). Worker được dispatch mang id của cha.

### 6.2 Hôm nay nó bảo vệ gì thật

| Người dùng | Tài nguyên thật cần bảo vệ | Có còn cần không |
|---|---|---|
| Hook | Phiên B commit trong khi phiên A vừa commit ở main (STR65: `git add -A` quét thay đổi của người khác trong working tree chung) | Giá trị thấp. Hại của STR65 xảy ra lúc `git add` và lúc sửa file, không phải lúc commit; hook chỉ bắt được commit thứ hai trong 20 s. Biện pháp thật hôm nay là commit theo pathspec và làm việc trong worktree. Các agent cùng phiên Claude không được tách ra |
| Claim | Commit checkpoint `.fgos` vào main; `git branch` / `git worktree add` (ref và metadata `.git` dùng chung) | Commit checkpoint: cần mutex ngắn. Branch/worktree add: git đã tự khoá ref (`*.lock` của git); cần test đa process để xác nhận trước khi bỏ |
| Land (`update-ref` + `read-tree`) | HEAD và working tree của main | Cần. CAS của `update-ref` lo phần ref; phần đồng bộ working tree cần loại trừ với commit tay |
| Merge không slot | Không có gì ở main (merge chạy trong worktree tạm) | Không. Nên dùng merge slot |
| Rust `init` | Không publish khi Node đang ghi main | Cần kiểu mutex, không cần đèn |

Worktree isolation không xoá được nhu cầu (b). Main checkout vẫn có người ghi: Lead commit tay, commit checkpoint `.fgos`, land. Nhưng nhu cầu là **mutex ngắn quanh mỗi lần ghi index/HEAD**, không phải **cửa sổ "gần đây có hoạt động"** chặn claim.

### 6.3 Thứ cần giữ từ prior art

- Không release trên exit đối với đèn của hook (`tsk-45z` D2). Luật này giữ nguyên, nhưng chỉ áp dụng cho đèn.
- Fail-closed khi nội dung hỏng. Giữ nguyên, nhưng file hỏng mà có liveness proof thì tự dọn được (như `tsk-2l8`).
- Heartbeat cho giữ dài (`tsk-4l8`), thu hẹp vùng giữ khi có code đồng bộ (`tsk-1mn`).

### 6.4 Cách tách tốt hơn

| Mới | Kiểu | Ai ghi / đọc | Holder | Ghi chú |
|---|---|---|---|---|
| `.fgos/main-checkout.activity` | Đèn báo | Chỉ hook ghi và đọc; `lock-status` hiển thị | writer id (session) + `windowMs` **ghi trong record** | Claim và approve **không đọc**. Một cửa sổ duy nhất do người ghi khai |
| `.fgos/main-checkout.lock` | Mutex ngắn | Commit checkpoint `.fgos`, land, `fgctl init`; hook chỉ **đọc** (từ chối commit khi fgOS đang land) | pid + startTime + bootId + token | Hold tính bằng giây. Holder chết thì dọn ngay, không chờ TTL. Hook con của holder vào được bằng grant token (tổng quát hoá `FGOS_MAIN_LOCK_HOLDER_PID`) |
| Claim | — | Chỉ lấy mutex quanh commit checkpoint | — | Bỏ `forceReclaimAmbiguousLock` trong claim; bỏ lớp `--wait` cho take/pick nếu không còn ai chặn lâu |
| Merge không slot (`promote-engine`, sync-root) | Lease | `merge-slot--<target>` | như merge slot | Như `ffc64b1aa` |

Hệ quả: skill `fgos-unlock` và verb `unlock` còn một việc là dọn đèn hỏng (hiếm). Có thể gộp vào doctor check.

## 7. Đề xuất chuẩn hoá

### 7.1 Thiết kế chính: holder-lock component

**Hợp đồng record v2** (một schema cho mọi kiểu):

```json
{"v":2,"kind":"mutex|lease|beacon","name":"main-checkout",
 "owner":{"pid":123,"startTime":"<proc stat 22>","bootId":"<uuid>","host":"<hostname>"},
 "writer":{"id":"<session id>","source":"env|registry|pid|unresolved"},
 "token":"<128-bit ngẫu nhiên>","epoch":7,
 "acquiredAt":0,"renewedAt":0,"ttlMs":0,"purpose":"land"}
```

**Thao tác:** `tryAcquire`, `acquire({waitMs})`, `renew(handle)`, `release(handle)`, `inspect`, `reclaimIfDead`. `handle = {name, token, epoch}`.

**Bảng quyết định** (một bảng, có test vector):

| Record hiện có | Quyết định |
|---|---|
| Không có | Tạo bằng temp + link → ACQUIRED |
| Hỏng, không đọc được | Có tuổi file > ân hạn ghi (2 s) và không có record hợp lệ thay thế → dọn rồi tạo; trong ân hạn → HELD. Không còn AMBIGUOUS vĩnh viễn |
| Token = token của người gọi | Refresh (re-entry của chính handle) |
| Grant token khớp (env `FGOS_LOCK_GRANT=<name>:<token>`) | Mượn: được làm việc dưới lock của cha, không đổi owner |
| `owner` chết theo OS (pid không tồn tại, hoặc startTime khác, hoặc bootId khác) | Reclaim ngay |
| `owner` sống, `now - renewedAt ≤ ttlMs` **của record** | HELD |
| `owner` sống nhưng quá `ttlMs` của record | mutex/lease: HELD nhưng báo `overdue` (không cướp holder sống, theo luật `run-lock.mjs`); beacon: hết hạn |
| Không đọc được liveness (không `/proc`, khác host) | Theo `ttlMs` của record, có trần (như `RUN_TIMEOUT_MAX_MS`) |
| Identity writer bằng nhau | **Không** cấp quyền gì. Chỉ để hiển thị và audit (V-lineage) |

**Luật re-entry, giữ RT2-2:**

- V-excl: hai lần acquire có token khác nhau luôn loại trừ nhau, kể cả khi cùng session id, cùng cha, cùng lineage.
- V-reentry: process con chỉ vào được qua grant token do holder phát cho đúng một lời gọi con (đúng như cách `HOLDER_PID_ENV_VAR` đang làm cho hook, nhưng dùng token không đoán được thay cho pid).
- V-lineage: `writer.id` không bao giờ là căn cứ cấp quyền.
- Đèn báo (beacon) là ngoại lệ có chủ đích: nó **so writer id** để biết "cùng phiên tiếp tục", vì nó không phải loại trừ. Nó không được dùng làm cổng cho thứ gì ngoài hook.

**Dọn holder chết:** đổi tên lock sang `<name>.reclaim-<token người dọn>` bằng `rename` (nguyên tử), đọc lại file đã đổi tên, so với nội dung đã phán; khác thì publish lại bằng link nếu đường gốc còn trống, nếu không thì bỏ. Cách này đóng khe "so rồi unlink" mà RR hiện tại còn để lại. Cần test đa process trước khi chốt; nếu chứng minh không đóng được, dùng phương án 7.2.

**Release:** chỉ khi token khớp. Exit/SIGINT/SIGTERM handler tuỳ chọn. SIGKILL thì liveness proof dọn ngay, không chờ TTL.

**Fencing:** `epoch` tăng mỗi lần acquire. Lease nào ghi state dài hạn (run control, land) phải mang epoch theo, và người nhận từ chối epoch cũ. Hôm nay chỉ `run-lock.mjs` có.

**Lock kinds và nơi ở** (registry, một dòng mỗi lock, doctor đọc được):

| Lock | Kiểu | Phạm vi đề xuất |
|---|---|---|
| events, claims, sessions, gateway, advance, reconcile, recovery | mutex | như hiện nay |
| runner | lease (renew trong vòng drain) | repo |
| main-checkout.lock | mutex | repo |
| main-checkout.activity | beacon | repo |
| merge-slot--<ref> | lease | repo |
| dispatch cwd | lease | **máy**, theo realpath của cwd (thư mục state của máy), không theo repo |
| activation | mutex | repo |
| install, full-suite | mutex / lease | máy |
| observe store | mutex | repo |
| provider state/account | lease (đang là ledger) | máy |
| confinement marker | lease có heartbeat + start time | máy |

Runtime claim và fence một lần **không** đi vào component. Chúng là thứ khác (mục 5).

**Nơi ở và thứ tự**, khớp đề xuất Rust-first ("(d) thu hẹp"):

| Bước | Việc | Xoá gì (One Door) | Bằng chứng cần |
|---|---|---|---|
| L0 | Spec + contract: record v2, bảng quyết định, registry, V-excl/V-reentry/V-lineage, vector sinh từ test hiện có | — | Vector xanh trên Node |
| L1 | **Gỡ kẹt ngay, Node, nhỏ:** tách đèn của hook khỏi mutex (6.4); claim chỉ lấy mutex quanh commit checkpoint; land, `promote-engine` và sync-root dùng đúng lock; record ghi `ttlMs` của chính holder và người đọc dùng nó | `forceReclaimAmbiguousLock` trong claim; đường đọc đèn ở claim và land | Test đa process thật: commit ở main rồi pick ngay → thành công; hai land loại trừ nhau; hook từ chối commit trong khi land giữ mutex; hai `git worktree add` song song không hỏng `.git` |
| L2 | Grant token thay `HOLDER_PID_ENV_VAR`; bỏ self-recognition bằng identity (đi cùng wave 1: 1b/1c của hội đồng) | `allowSelfRecognition`, `HOLDER_PID_ENV_VAR` | Test RT2-2: hai process cùng session id loại trừ nhau; hook con của holder vào được; con không có grant thì bị chặn |
| L3 | Module Node `holder-lock` (thay `main-checkout-lock.mjs`). Chuyển từng lock theo thứ tự rủi ro thấp trước: gateway, sessions, runner, advance, reconcile, recovery, full-suite, claims, dispatch cwd. **events.lock cuối cùng**, sau khi đo | Mỗi bản chép bị xoá trong cùng commit chuyển nó; regex composite chép ở reconcile; `isPidAlive` chép | Test hiện có của từng lock, thêm test crash: file rỗng sau crash tự dọn; pid tái dùng bị phát hiện qua start time |
| L4 | Crate Rust port bằng vector (thuộc `fgos-session-identity` hoặc crate holder-lock riêng, như đề xuất Rust-first bước 3); thay `lock.rs`, activation, install (thêm liveness), observe (thêm release-if-own, ghi `ttlMs`) | 4 bản Rust | Cargo test chạy cùng vector; test đa process giữa một writer Node và một writer Rust **trên hai file khác nhau** (không dual-write cùng file) |
| L5 | Facade Node gọi crate cho đường lạnh (claim, merge, dispatch), theo cổng latency của S6. events.lock chỉ chuyển khi đo thấy chi phí exec nằm ngoài vùng giữ lock | Logic Node tương ứng | Đo S6 lại; full `npm test` |
| L6 | Doctor check: liệt kê lock theo registry, báo lock mồ côi (4 file dispatch đang có), dọn khi có bằng chứng chết; sửa spec lệch | doctor check `*.claim` của coordination; `dispatch.claim` nếu xác nhận không còn writer | Doctor xanh trên repo này; CHANGELOG |

Ghi chú về L1: L1 không cần component mới. Nó là phần đáng làm nhất vì nó gỡ kẹt cho mọi project dùng fgOS (mission #1), không chỉ repo fgOS. Hook chỉ chạy ở repo fgOS (đề xuất Rust-first mục 2.1). Nhưng claim/approve/land chạy ở mọi project, và commit tay ở main của project đó cũng có thể làm sáng đèn nếu project tự ship `.githooks`.

### 7.2 Phương án thay thế: generation ledger cho mọi lock

Dùng chung thiết kế của [`run-lock.mjs`](../../src/runner/dispatch/run-lock.mjs) và `provider-capacity.mjs`: mỗi lock là một thư mục; mỗi lần acquire publish file epoch kế tiếp bằng link; không bao giờ unlink hay ghi đè; release là một marker bất biến.

| | 7.1 record một file | 7.2 ledger |
|---|---|---|
| TOCTOU khi dọn | Phải chứng minh cách rename-reclaim | Không có, theo cấu trúc |
| Fencing | Thêm trường `epoch` | Có sẵn |
| Đường nóng (events.lock, nhiều lần mỗi giây) | 1 link + 1 unlink | Thư mục lớn dần; cần GC; list thư mục mỗi lần |
| Đã có test và đã dùng thật | main-checkout, 10 bản chép | provider capacity, run control |
| Hợp với người đọc khác (Rust `lock.rs`, `lock-status`) | Đọc một file | Đọc epoch cao nhất |

Em đề xuất 7.1 cho mutex và đèn, và **giữ ledger cho lease cần fencing** (run control, provider). Nếu test đa process ở L3 chứng minh rename-reclaim không đóng được khe, chuyển toàn bộ sang 7.2 và trả GC bằng doctor.

Không chọn `flock(2)`: kernel tự release khi process chết là ưu điểm lớn. Nhưng Node không có `flock` mà không cần addon, facade exec không giữ được flock qua process, và đèn của hook phải sống lâu hơn process hook. Chỉ hợp cho holder Rust tự chạy trong process (observe, install). Có thể dùng sau L4, như chi tiết cài đặt bên trong crate.

## 8. Rủi ro, điều kiện bác bỏ, câu hỏi cho anh

### 8.1 Rủi ro

| # | Rủi ro | Giảm thiểu |
|---|---|---|
| R1 | Bỏ main mutex khỏi claim làm lộ race trên `.git` khi hai claim cùng `git worktree add` | Test đa process ở L1 trước khi bỏ; nếu đỏ thì giữ mutex ngắn quanh đúng lời gọi git đó |
| R2 | Đèn hook chỉ còn chặn commit-với-commit, nên một commit tay ở main giữa lúc claim commit checkpoint vẫn được chặn bằng mutex, nhưng commit tay giữa hai bước của land thì chỉ được git `index.lock` bảo vệ | Hook đọc mutex (6.4) |
| R3 | Rename-reclaim sai trên filesystem không hỗ trợ hard link hoặc NFS | Giống hôm nay (`link` đã là nền); doctor báo |
| R4 | Flip nhiều lock một lúc có blast radius lớn | L3 chuyển từng lock, mỗi commit một lock |
| R5 | `startTime` không đọc được trên macOS/Windows | Lùi về `ttlMs` của record, có trần; như `process-identity.mjs` hôm nay |
| R6 | Đổi record v1 → v2 khi có writer khác version cùng lúc (`fgos:dev`, release cũ chưa restage) | Reader đọc cả v1 và v2; writer v2 chỉ bật khi activation mới; record v1 do ai ghi thì người đó release. Theo luật "no backward compat", v1 chỉ cần đọc được, không cần ghi |

### 8.2 Điều kiện bác bỏ

1. Test đa process cho thấy hai `git worktree add`/`git branch` song song từ hai claim làm hỏng `.git` → claim vẫn cần mutex quanh các lời gọi đó (vẫn ngắn, không phải đèn 180 s).
2. Có bằng chứng STR65 tái diễn sau khi claim không còn đọc đèn → đèn có giá trị hơn em đánh giá.
3. Rename-reclaim không vượt test đa process sau hai vòng → chọn 7.2.
4. Đo cho thấy events.lock không chịu được thêm đọc `/proc/<pid>/stat` khi tranh → events.lock giữ kill-0 thuần, chỉ thống nhất record và dọn.
5. S1 của hội đồng cho thấy có consumer cần re-entry ngầm theo id kế thừa → V-reentry sai (giống điều kiện 2 của đề xuất Rust-first).

### 8.3 Câu hỏi cho anh

Mỗi câu theo mẫu [câu hỏi quyết định](../../core/skills/_shared/decision-question.md), rút gọn.

1. **Tách `main-checkout.lock` (mục 6.4) và làm L1 trước mọi thứ khác?**
   - Đang xảy ra: mọi commit ở main chặn pick/take/land của mọi phiên tới 3 phút, kể cả phiên vừa commit.
   - Nguyên nhân: đèn của hook và mutex của fgOS dùng chung file và bảng quyết định; TTL do người tranh chọn.
   - Phương án: (a) tách như 6.4, khoảng 1-2 ngày, rủi ro R1; (b) sửa nhỏ: hook ghi `ttlMs=20s` vào record và người đọc dùng nó, vài giờ, nhưng vẫn giữ lỗi identity pid-với-chuỗi và vẫn chặn 20 s; (c) giữ nguyên.
   - Em khuyên (a). (b) là bước đệm hợp lý nếu anh muốn gỡ kẹt ngay hôm nay.
   - Phạm vi: chỉ main-checkout, không đụng các lock khác.
2. **Có giữ đèn của hook không?** Giá trị đo được thấp (6.2) và nó không tách được các agent cùng một phiên Claude. (a) giữ, chỉ cho hook; (b) bỏ hẳn, hook chỉ đọc mutex. Em nghiêng (a) cho tới khi có số liệu, vì chi phí giữ gần bằng không sau khi tách.
3. **Re-entry chỉ qua grant token (V-reentry), áp dụng cho mọi lock, trong wave 1 cùng 1c?** Đây cũng là câu Q4 của đề xuất Rust-first; một câu trả lời cho cả hai.
4. **Dispatch cwd lock chuyển sang phạm vi máy?** Cwd là tài nguyên của máy. Đổi chỗ lưu là đổi hợp đồng, phải qua setup/doctor.
5. **Thời điểm Rust:** theo OQ1 của hội đồng. Đề xuất này chạy được với (a) hoặc (d) thu hẹp; L0-L3 giống nhau ở cả hai.
6. **Dọn đồ thừa ngay trong track này** (`dispatch.claim`, doctor check `*.claim` của coordination, 4 lock dispatch mồ côi, spec `runner.md` ghi TTL 15 phút và 5 phút trong khi code là 20 s và 180 s ở dòng 889 và 1261), hay tách thành item riêng? Em khuyên làm cùng L6, vì cùng một registry.

### 8.4 Việc em chưa kiểm

- Cổng `useSupervisorRecovery` có loại herdr-spawn ra không. Nếu không, một Assignment herdr ghi có thể giữ hai dispatch lock với hai identity ([`assignment-runner.mjs:2145-2220`](../../src/runner/dispatch/assignment-runner.mjs)).
- Hai `git worktree add` song song có an toàn thật không (R1). Em chưa chạy.
- `markResourceRetained` có đổi digest của marker trước check `ownership-marker-mismatch` không.
- Chi phí thật của land thất bại sau verify (6.1 điểm 5). Em mới suy ra từ code, chưa có lần approve nào được đo.
