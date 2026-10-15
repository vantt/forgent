# Đề xuất: component Rust đầu tiên là session-identity + holder-lock, pre-commit hook là consumer native đầu tiên

- Ngày: 2026-10-15. Người viết: em (subagent `rust-proposal`, Claude Opus 5.5), theo yêu cầu của Lead.
- Mục đích: input cho lần reopen hội đồng kiến trúc về **OQ1**. Đây là đề xuất để hội đồng tấn công, **không phải quyết định**, không phải plan triển khai.
- Đầu vào chính: [spike S6](spike-s6-261015-1638-rust-identity-call-latency-pre-commit-hook.md), [báo cáo hội đồng](architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md), [luật migration Node→Rust](../../docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md), [Observe spec](../../docs/specs/observe.md).

## 1. Tóm tắt

Em đề xuất chọn **(d) thu hẹp**: một package Rust mới `packages/session-identity` (crate `fgos-session-identity`) làm authority duy nhất cho hai việc là **writer identity** và **giao thức holder-lock** (record, tạo nguyên tử, self-recognition, liveness, reclaim). Pre-commit hook trở thành verb native `fgos hook pre-commit`, là consumer đầu tiên dùng crate trong cùng process.

Lý do chính **không phải latency**. Lý do chính là identity và lock đã bị chép ba nơi, và hai bản chép nằm sẵn trong Rust (mục 2.3). "Rust sau" vì vậy không miễn phí: bản Rust thứ hai đang lệch nghĩa với Node ngay hôm nay.

Thứ tự: wave 1 (1b, 1c, 1d) và câu trả lời RT2-2 vào Node trước, mỗi item có test. Bộ test đó thành test vector cho crate. Crate port **đúng ngữ nghĩa đã sửa**, không thêm ngữ nghĩa mới.

## 2. Sự thật đã kiểm trên source (và chỗ lệch với brief)

### 2.1 Hook

- [`.githooks/pre-commit`](../../.githooks/pre-commit) dài 506 dòng, Node thuần. Nó import tương đối `../src/runner/main-checkout-lock.mjs` và `../src/util/session-identity.mjs` (dòng 29-30), tức chạy **code working-tree**, không chạy release đã activate.
- Thứ tự trong `main()` (dòng 434-503): stale index → xoá `.fgos/` → `.fgos/` trên worker branch → root allowlist → convention warning (gọi Rust qua `invokeHost`, dòng 416) → chỉ khi at home: identity + `acquireMainCheckoutLock` (dòng 471-483) → nhánh `fgw/*` → line-count `.fgos/` giảm.
- `resolveIdentity` (dòng 123-130) ưu tiên `FGOS_MAIN_LOCK_HOLDER_PID` (merge mượn pid cha), sau đó mới gọi `resolveWriterIdentity`.

**Lệch với brief:** hook **không** được wire vào mọi project. [`installGitHooks`](../../src/setup/git-hooks.mjs) dòng 104-107 chỉ set `core.hooksPath` khi project tự ship thư mục `.githooks/`, sau commit `2bd1847e4` ("stop creating fgOS-only files and hook paths in other projects"). Thực tế chỉ repo fgOS (và fork) chạy hook này. Vì vậy phần lợi latency của hook là **mission #3** (dogfood), không phải #1/#2.

### 2.2 Identity và lock trong Node

| File | Dòng | Ghi chú |
|---|---|---|
| [`src/util/session-identity.mjs`](../../src/util/session-identity.mjs) | 204 | Brief ghi ~550, thực tế 204. Env tier: `FGOS_SESSION_ID`, `CLAUDE_CODE_SESSION_ID` (dòng 60); fallback đi 3 bước pid; cache `ownPidIdentity` |
| [`src/runner/main-checkout-lock.mjs`](../../src/runner/main-checkout-lock.mjs) | 737 | Một primitive phục vụ **ba họ lock file**: `main-checkout.lock`, `merge-slot--<ref>.lock` (dòng 71), `dispatch--<cwd>.lock` (dòng 79). Self-recognition ở **dòng 306**: `allowSelfRecognition && record.pid === identity` |
| [`src/runner/dispatch/process-identity.mjs`](../../src/runner/dispatch/process-identity.mjs) | 70 | `resolveHolderLiveness`, lock import ở dòng 48 |

Importer thật (không tính comment):

- `resolveWriterIdentity`: [`bin/fgos.mjs`](../../bin/fgos.mjs), [`dispatch/cli.mjs`](../../src/runner/dispatch/cli.mjs), [`dispatch/transport.mjs:535`](../../src/runner/dispatch/transport.mjs), [`confinement/authority.mjs:1402`](../../src/runner/dispatch/confinement/authority.mjs), [`lock-wait.mjs`](../../src/runner/lock-wait.mjs), [`invocation-fault-log.mjs`](../../src/cli/invocation-fault-log.mjs), [`events.mjs:482`](../../src/state/events.mjs) (bên trong `events.lock`), [`runtime-coordination.mjs:228`](../../src/state/runtime-coordination.mjs), [`store.mjs`](../../src/state/store.mjs), cùng hook. Tổng 23 call site.
- Lock API: [`bin/fgos.mjs`](../../bin/fgos.mjs) (take/unlock/inspect), [`claim-port.mjs:118`](../../src/runner/claim-port.mjs), [`merge.mjs`](../../src/runner/merge.mjs), [`dispatch/cli.mjs`](../../src/runner/dispatch/cli.mjs), [`assignment-runner.mjs`](../../src/runner/dispatch/assignment-runner.mjs), [`execution/run.mjs`](../../src/runner/execution/run.mjs), [`lock-wait.mjs`](../../src/runner/lock-wait.mjs), cùng hook. Tổng 25 call site acquire/release/renew/inspect/reclaim.
- Lock hiện nhận **bốn dạng identity**: pid của chính process (`claim-port.mjs:118`, `bin/fgos.mjs:4239`), session id hoặc pid tổ tiên (hook), pid mượn qua `HOLDER_PID_ENV_VAR` (merge), và chuỗi composite `pid:ts:rand` (dispatch lock, dòng 175).
- Test chạm vào hai module: 21 file. Năm file lõi đã có 2955 dòng.

### 2.3 Rust đã có hai bản chép lệch nghĩa

| Chỗ | Lệch gì so với Node |
|---|---|
| [`packages/observe/rust/src/shard.rs:9`](../../packages/observe/rust/src/shard.rs) `resolve_writer_id()` | Chỉ đọc `FGOS_SESSION_ID`, bỏ qua `CLAUDE_CODE_SESSION_ID`; fallback là `pid-<pid của chính nó>`, không đi 3 bước. Cùng một phiên Claude, Node ra session id còn shard observe ra `pid-NNN` |
| [`packages/distribution/rust/src/lock.rs`](../../packages/distribution/rust/src/lock.rs) (244 dòng), gọi từ [`init.rs:940`](../../packages/distribution/rust/src/init.rs) | Bản đọc lại luật liveness của `main-checkout.lock`, tự ghi là "reuses the liveness rules" và hard-code `DEFAULT_TTL_MS`. Không có nhánh composite pid như Node dòng 175 |
| `init.rs` `try_create` và [`observe/store_lock.rs`](../../packages/observe/rust/src/store_lock.rs) (270 dòng) | Hai bản nữa của "tạo lock nguyên tử + reclaim holder chết", bản đầu ghi rõ "Mirrors `main-checkout-lock.mjs`'s own `writeAtomicCreate`" |

Theo RUL11, đây là tùm lum đang có sẵn, không phải rủi ro giả định. Prior art: `git log -S` không cho thấy crate session-identity nào từng tồn tại rồi bị gỡ.

### 2.4 Đường gọi Rust có sẵn

- Khi exec payload legacy-node, Rust host set `FGOS_HOST_BIN` bằng chính binary của nó ([`apps/fgos/src/legacy_exec.rs:247`](../../apps/fgos/src/legacy_exec.rs)). Mọi process Node do host sinh ra vì vậy đã biết **đúng binary cùng release**, không cần parse manifest và không qua shim.
- `npm test` dùng `FGOS_HOST_BIN` do [`scripts/run-tests.mjs`](../../scripts/run-tests.mjs) đảm bảo (dòng 33-41).
- Hiện có 5 route native: `version`, `gate-bypass`, `metrics`, `friction`, `convention`.

## 3. Component đề xuất

| Mục | Nội dung |
|---|---|
| Tên | `packages/session-identity/{contracts,rust,src,tests}`, crate `fgos-session-identity`, phụ thuộc `fgos-host-runtime`, compose ở `apps/fgos` wiring |
| Authority duy nhất | (1) Writer identity: `resolve(pid, env, fgosDir) → {id, source}` với `source ∈ {registry, env, pid, unresolved}` (giữ 4 giá trị theo 1d). (2) Holder-lock protocol: record v1 `{pid, ts, ttlMs?}`, tạo nguyên tử bằng temp + `hard_link`, self-recognition, liveness, TTL, reclaim, force-reclaim |
| Route native | `fgos identity resolve --pid <p> --json` (đọc) và `fgos lock acquire\|renew\|release\|inspect\|reclaim --file <name> --identity <v> ...` (ghi) |
| Không sở hữu | Confinement và reaper (RT2-1 nằm ở đó), dispatch/transport (cách đặt env cho child), chính sách tên lock file (main-checkout, merge-slot, dispatch là việc của caller), sessions registry (chỉ đọc để xác nhận), supervisor, terminal-control |
| Hook | Verb `fgos hook pre-commit` nằm ở package riêng `packages/commit-guard` (crate `fgos-commit-guard`). Package này phụ thuộc `fgos-session-identity` và `fgos-convention`, và sở hữu root allowlist cùng các guard `.fgos/` |

Vì sao hook ở package riêng: allowlist và guard `.fgos/` là chính sách repo hygiene và worktree isolation, không phải identity. Gộp chúng vào crate identity sẽ làm crate nền có hai trách nhiệm. Brief gom "hook + identity + lock" thành một component; em tách ra làm hai package nhưng giao trong **một track**. Hội đồng nên phán điểm này.

## 4. Phạm vi chính xác

### 4.1 Tám bước của hook

| Bước | Đi đâu |
|---|---|
| 1 stale index, 2 xoá `.fgos/`, 3 `.fgos/` trên worker, 4 root allowlist, 7 nhánh `fgw/*`, 8 line-count `.fgos/` | `fgos-commit-guard`, vẫn exec `git` như hiện tại (git là authority của index; không dùng gix) |
| 5 convention | Gọi crate `fgos-convention` trong cùng process. Bỏ `invokeHost` và cú import `host-bin.mjs` tốn ~18 ms (S6 §3.4) |
| 6 identity + lock | Gọi `fgos-session-identity` trong cùng process. Giữ nguyên ưu tiên `FGOS_MAIN_LOCK_HOLDER_PID` |

`.githooks/pre-commit` còn lại một script `sh` vài dòng: `exec "$FGOS_HOST_BIN" hook pre-commit` khi biến này có mặt, nếu không thì đọc `activation.json` một lần rồi exec binary của release. Dùng `exec` nên Rust **chính là** process hook (cùng pid với node hiện nay), nên pid walk 3 bước ra đúng tổ tiên như cũ. Điều kiện 5 của S6 tự thoả cho hook.

`ROOT_FILE_ALLOWLIST` chuyển thành `packages/commit-guard/contracts/root-allowlist.v1.json`. Đoạn "`.githooks/pre-commit` owns the single root-file allowlist" trong [AGENTS.md](../../AGENTS.md) phải sửa cùng commit.

### 4.2 Facade Node, đối chiếu 5 điều kiện S6

| Điều kiện S6 | Cách thoả |
|---|---|
| 1 verb native | `identity` và `lock` là `route_kind: native` trong [`command-routes.json`](../../packages/host-runtime/contracts/command-routes.json), nên chạy được khi `GUARD=1` |
| 2 exec thẳng release bin, resolve một lần | Facade đọc `process.env.FGOS_HOST_BIN` (host đã set, mục 2.4). Thiếu biến này (kênh `node bin/fgos.mjs`, global npm) thì gọi `resolveHostBin()` **một lần** rồi cache. Không import `host-bin.mjs` trên đường nóng, không đi qua shim |
| 3 không exec trong `events.lock` | `session-identity.mjs` thành facade: exec `fgos identity resolve --pid <process.pid>` **một lần mỗi process**, lười, rồi cache. `events.mjs` gọi facade **trước** khi lấy lock (sửa thứ tự ở `appendEventCore`) |
| 4 ≤5 ms p95 warm, ≤6 ms cold | Đo lại bằng chính harness S6 khi có crate. Đây là cổng của bước 3 trong mục 6 |
| 5 truyền pid | Facade luôn truyền `--pid process.pid`. Rust không tự walk từ pid của chính nó khi có `--pid` |

Lock facade: mỗi thao tác acquire/renew/release là một lần exec (~3.3 ms, S6 §3.3). Các thao tác này không nằm trong `events.lock`, và tần suất là một lần mỗi claim/merge/dispatch round, nên chấp nhận được. `releaseOnExit` giữ ở Node, nhưng exit handler exec `fgos lock release` đồng bộ. Đây là chỗ mong manh nhất của facade (xem rủi ro R3).

Câu hỏi mở của S6 về cache `source`: em đề xuất cache cả `{id, source}`. `id` không đổi trong đời process; `source` chỉ là mức tin cậy. Đổi từ ENV sang REGISTRY giữa chừng không đổi quyết định lock nào.

## 5. Thứ tự so với wave 1 và ràng buộc RT2-2

**Đề xuất: 1b, 1c, 1d cùng luật RT2-2 vào Node trước, có test; crate Rust bắt đầu ngay sau khi các test đó xanh.**

Lý do:

1. 1b (scrub env trong `workerBaseEnv`) và 1c (child `FGOS_SESSION_ID = launchCommandId` ở `transport.mjs:535`) nằm ở **dispatch**, ngoài component. Hai item này ở Node dù OQ1 chọn gì.
2. 1d (thêm `CODEX_THREAD_ID` vào env tier) là một dòng trong `envSessionId`. Làm ở Node trước tốn ít hơn giữ một lỗi đã biết cho tới khi crate xong. Test của 1d thành vector cho crate.
3. Port không mang ngữ nghĩa mới thì parity chứng minh được bằng vector. Đổi ngữ nghĩa và đổi ngôn ngữ cùng lúc thì không ai tách được lỗi nằm ở đâu.

Ràng buộc RT2-2 mà crate phải mã hoá thành vector:

- **V-excl:** hai attempt có id khác nhau thì loại trừ nhau, kể cả khi chúng cùng lineage hoặc cùng cha.
- **V-reentry:** re-entry hợp lệ của process con chỉ được phép qua **grant tường minh** do holder phát, tức tổng quát hoá `FGOS_MAIN_LOCK_HOLDER_PID`. Kế thừa id không bao giờ đủ để re-entry.
- **V-lineage:** trường lineage chỉ để hiển thị và audit, không bao giờ cấp quyền.

Hệ quả: dù T1 rollback về id chung, so sánh `record.pid === identity` ở dòng 306 cũng không còn là đường duy nhất cho re-entry, nên lỗ của RT2-2 không mở lại. Đây là đổi ngữ nghĩa, nên phải làm ở Node trong wave 1 (cùng 1c) và qua S1, rồi mới port. Crate không tự phát minh luật này.

## 6. Các bước migration

Theo luật: trọn use-case, read-only trước writer, không dual-run write, xoá Node khi còn zero route và có proof.

| # | Bước | Xoá gì (One Door) | Proof |
|---|---|---|---|
| 0 | Spec `docs/specs/session-identity.md` + contracts: `identity.resolve.v1`, `holder-lock.record.v1`, bảng quyết định acquire (trạng thái record × identity caller × liveness × TTL → ACQUIRED/HELD/AMBIGUOUS), V-excl/V-reentry/V-lineage. Vector sinh từ test Node hiện có | — | Vector chạy xanh trên Node (dùng `test/util/session-identity.test.mjs` và `test/runner/main-checkout-lock.test.mjs`) |
| 1 | Crate + verb `identity resolve` (chỉ đọc). Thay `observe::shard::resolve_writer_id` và `distribution::lock` bằng lời gọi crate trong process | `shard.rs:9-17`, phần judge của `lock.rs` | Cargo test chạy vector; test observe và fgctl-init xanh. Tên shard observe của writer terminal đổi từ `pid-<own>` sang pid tổ tiên. Reader đọc mọi shard nên không mất dữ liệu, nhưng phải ghi CHANGELOG |
| 2 | Facade Node cho identity (mục 4.2) | Toàn bộ logic trong `session-identity.mjs`, chỉ còn facade ~40 dòng | Vector chạy qua facade; đo lại S6 (điều kiện 4); full `npm test`. Resolve là thao tác đọc nên chạy cả hai bản trên cùng input trong test là hợp lệ, không phải dual-run write |
| 3 | Crate lock + verb `lock` (writer). Chuyển **mọi** caller của ba họ lock file trong **một** commit | Logic trong `main-checkout-lock.mjs`, chỉ giữ hằng số và facade | Vector chạy trên Rust trong temp dir riêng. Bổ sung test đa process thật (giống `merge-target-slot-multiprocess.test.mjs`) với V-excl/V-reentry. Không chạy writer Node và Rust song song trên cùng file để so |
| 4 | `fgos hook pre-commit` native; `.githooks/pre-commit` còn shim `sh` | 506 dòng Node | Ba file e2e hook hiện có (`main-checkout-lock-hook*.test.mjs`, `root-file-guard-hook.test.mjs`) chạy nguyên trạng trên hook mới; đo latency hook |
| 5 (item riêng, RUL11) | Gom `observe/store_lock.rs`, activation lock của `init.rs`, và `acquireEventsLock` ([`events.mjs:354`](../../src/state/events.mjs), thêm một bản `link()` nguyên tử nữa) về primitive holder-lock | Các bản tạo nguyên tử còn lại | Test của từng crate; riêng `events.lock` phải đo lại, vì đây là đường nóng nhất |

Bước 3 phải flip tất cả cùng lúc. Nếu hook dùng Rust mà `claim-port` vẫn dùng Node, sẽ có hai bản cài đặt cùng ghi một file lock. Đó là hai sự thật, đúng điều hội đồng cấm ở (c).

### 6.1 Tác động lên activation giữa các project

- **Định dạng record giữ nguyên v1, cả đọc lẫn ghi.** Trong một workspace vẫn có thể có writer khác version cùng lúc (`npm run fgos:dev`, `node bin/fgos.mjs` từ worktree, release cũ chưa restage), nên track này không đổi format.
- **Activation cũ + payload mới:** không xảy ra trên đường chuẩn, vì payload Node đi trong cùng release với host và facade lấy `FGOS_HOST_BIN` của host đó. Mismatch chỉ có ở kênh compat: verb `identity` chưa tồn tại thì exit 4. Facade phải map lỗi này thành `host-version-mismatch` với lời nhắc restage. Lock thì fail-closed. Identity thì cũng fail-closed (không có identity giả).
- **Project ngoài:** không có hook (mục 2.1). Tác động chỉ đến từ facade identity/lock trong `fgos take/pick/approve/dispatch`, và các lệnh đó luôn chạy qua host nên luôn có `FGOS_HOST_BIN`.
- **Không có activation** (clone mới chưa build, CI): hook shim không tìm thấy binary. Em đề xuất **fail-open có cảnh báo** khi không có cả `FGOS_HOST_BIN` lẫn activation, vì lúc đó không có writer fgOS nào để va chạm. Khi có activation mà exec lỗi thì **fail-closed**. Đây là câu hỏi Q2 cho anh, vì hôm nay hook vẫn chặn được trong trường hợp này.
- **Hook chạy code release, không chạy code working-tree.** Sửa logic hook trong repo fgOS sẽ chỉ có hiệu lực sau khi restage/activate. Phải bổ sung doctor check (cổng install/setup/doctor): `main-checkout-hook-wired` kiểm thêm việc shim resolve được binary có verb `hook`.

## 7. Kích thước, lợi ích, rủi ro

### 7.1 Kích thước (dòng thật; phần Rust là ước tính)

| Phía | Hiện có | Sau |
|---|---|---|
| Node xoá | 204 + 737 + 506 = 1447 (giữ `process-identity.mjs` 70 dòng vì dispatch còn dùng) | Facade ~40 + ~80, shim hook ~10 |
| Rust xoá/thay | `shard.rs` ~10, `lock.rs` 244 (bước 5 thêm ~270 + phần lock của `init.rs`) | — |
| Rust mới (ước tính, chưa đo) | — | identity ~250, holder-lock ~600, commit-guard ~500, contract + test ~1500 |
| Test Node phải chuyển hoặc giữ | 21 file, 5 file lõi 2955 dòng | Phần lớn giữ làm test hành vi qua facade/e2e |

Quy mô cỡ track Observe (Rust observe ~5k dòng), nhưng nhỏ hơn vì không có thuật toán scorecard.

### 7.2 Lợi ích

- **Latency hook** (chỉ ở repo fgOS). Hiện ~45 ms median at home. "Away from home" là 34.5 ms, trong đó Node khởi động ~22 ms và import ~5 ms, nên phần git + logic còn ~7.5 ms. Ước tính hook native: shim `sh` 1-3 ms + Rust khởi động 2-3.3 ms + git ~7.5 ms, tức **~12-15 ms, tiết kiệm ~30 ms mỗi commit**. Khi stage report, hook còn bỏ được ~18 ms của `invokeHost`. Đây là ước tính, chưa đo.
- **Thời gian giữ `events.lock`:** không đổi (~0) vì resolve chạy trước lock. Nếu làm sai thành (a2) thì sẽ tăng ~470 lần (S6 §5), nên đây là cổng cứng.
- **Process Node khác:** thêm ~3.3 ms một lần cho mỗi process cần identity, và ~3.3 ms cho mỗi thao tác lock. Đây là **chi phí**, không phải lợi ích; con số nhỏ so với một round dispatch.
- **Lợi ích thật:** một authority identity cho cả Node và Rust (sửa lệch observe ngay hôm nay); một giao thức lock thay cho bốn bản; nền cho T2/T5-T8 (terminal-control, supervisor) khi tới trigger mà không phải tách lại.

### 7.3 Rủi ro

| # | Rủi ro | Giảm thiểu |
|---|---|---|
| R1 | Hook mất khả năng chặn khi không có activation (fail-open) | Q2; doctor check; CHANGELOG |
| R2 | Sửa hook không có hiệu lực tới khi activate, gây nhầm khi dogfood | Doctor check; ghi rõ trong spec |
| R3 | `releaseOnExit` bằng exec trong exit handler có thể không chạy khi bị SIGKILL | Hôm nay cũng vậy (handler Node không chạy khi SIGKILL); TTL và liveness vẫn là lưới an toàn. Phải có test |
| R4 | Flip ba họ lock trong một commit có blast radius lớn (dispatch, merge, claim) | Vector + test đa process; bước 3 tách khỏi bước 2 để rollback bằng revert một commit |
| R5 | Shard observe đổi tên với writer terminal | Reader đọc mọi shard; ghi CHANGELOG |
| R6 | Cargo gate làm chậm vòng phát triển Node; `npm test` phụ thuộc binary build | Đã đúng như vậy từ khi có convention/observe (`run-tests.mjs`) |
| R7 | Mission #3: phần hook chỉ phục vụ repo fgOS | Chỉ coi hook là consumer chứng minh; giá trị mission #1/#2 nằm ở identity/lock dùng cho take/pick/dispatch ở mọi project |

## 8. So sánh phương án

| Phương án | Ưu | Nhược | So với đề xuất |
|---|---|---|---|
| (a) Node trước, Rust khi có trigger | Rẻ nhất trước mắt; wave 1 không đổi | Lệch identity ở observe và bản sao lock ở distribution vẫn còn và tăng dần; trigger T4 đã có dữ liệu (S6 conditional pass) nên "chờ" không còn lý do đo đạc | Đề xuất **giữ phần tốt của (a)**: wave 1 vẫn ở Node; chỉ khác ở chỗ Rust bắt đầu ngay sau wave 1 thay vì chờ |
| (b) Crate session-identity độc lập ngay | Thoả nguyên tắc #4 cho identity | Nếu chỉ có identity mà lock vẫn ở Node, thì self-recognition (dòng 306), chỗ quyết định RT2-2, vẫn ở Node. Identity và quyết định dùng identity nằm ở hai ngôn ngữ | Đề xuất là (b) **cộng lock**, vì hai việc đó là một use-case trọn (luật migration: không tách helper riêng) |
| (d) Cả hai nền Rust (identity + terminal-control), supervisor Node giữ lại | Đúng hướng dài hạn của panelist-1 | Terminal-control còn chờ S3/S7, và đúng cái bất đồng P1 vs P3 về pane do người mở. Mở hai nền cùng lúc tức là kéo phần chưa chín vào | Đề xuất là **(d) thu hẹp**: chỉ nền identity/lock trước, terminal-control khi S7 xong |
| (c) Hai crate + Node mirror | — | Hai sự thật; hội đồng đã bác | Loại |
| Chỉ hook sang Rust, identity/lock giữ Node | Lợi latency nhanh nhất | Hook Rust phải tự resolve identity và ghi lock, tức là bản cài đặt thứ hai của cùng giao thức trên cùng file `main-checkout.lock`. Vi phạm One Door, và lại thêm một bản sao kiểu `distribution/lock.rs` | Loại. Hook chỉ được sang Rust **sau** bước 3 |

## 9. Điều kiện bác bỏ và đảo ngược

Đề xuất sai, hoặc phải dừng, nếu:

1. **Đo lại sau bước 2** cho thấy facade vượt ngân sách S6 (>5 ms p95 warm hoặc >6 ms cold), hoặc có call site nào buộc phải resolve bên trong `events.lock`. Khi đó dừng ở bước 1 (chỉ thống nhất phía Rust) và để Node giữ resolver; ghi rõ là hai sự thật có hạn.
2. **S1 cho thấy có consumer cần re-entry ngầm** theo id kế thừa mà không thể chuyển sang grant tường minh. V-reentry sai, và crate không có hợp đồng ổn định để port.
3. **Bước 3 không qua được test đa process** (V-excl fail trên Rust nhưng xanh trên Node, hoặc ngược lại) sau hai vòng sửa. Revert commit flip và giữ lock ở Node.
4. **Anh chọn hook phải chạy được khi không có activation** (Q2 = fail-closed hoặc giữ hành vi hiện tại). Khi đó bước 4 không có cách nào ngoài việc giữ hook Node (hai sự thật), nên bỏ bước 4 và chỉ làm bước 0-3.
5. **Ưu tiên của anh là terminal-control/supervisor** (pain vận hành herdr hiện tại) thay vì identity. Khi đó component đầu tiên nên là thứ khác và đề xuất này lùi lại.
6. Track Observe có hậu quả xấu chưa được ghi lại (ví dụ cargo gate làm chậm hẳn release). Em chưa thấy bằng chứng, nhưng hội đồng nên hỏi.

## 10. Câu hỏi cho anh

1. **Q1 — OQ1:** chọn "(d) thu hẹp" như trên (wave 1 ở Node, crate identity+lock ngay sau, hook native ở bước 4), hay giữ (a) của packet?
2. **Q2 — Hook khi không có activation:** fail-open có cảnh báo (em đề xuất), fail-closed, hay coi đây là lý do giữ hook ở Node?
3. **Q3 — Tách package:** hook thành `packages/commit-guard` riêng như em đề xuất, hay gom vào `session-identity` thành một component như brief ban đầu?
4. **Q4 — V-reentry:** đồng ý rằng re-entry chỉ đi qua grant tường minh (tổng quát hoá `FGOS_MAIN_LOCK_HOLDER_PID`), và đưa luật này vào wave 1 cùng 1c?
5. **Q5 — Bước 5** (gom `observe/store_lock.rs` và activation lock của distribution): làm trong track này hay để thành item riêng?
6. **Q6 — Shard observe đổi tên** với writer terminal ở bước 1: chấp nhận được không?
