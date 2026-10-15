# Phase 00: thiết kế resolver identity bằng Rust và phản biện

Đọc trước: [plan](plan.md), [hội đồng §2.2, §3, §5, §6.2](../reports/architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md), [S6](../reports/spike-s6-261015-1638-rust-identity-call-latency-pre-commit-hook.md), [S7](../reports/spike-s7-261015-1859-human-opened-pane-identity-observation.md), [S1](../reports/spike-s1-261015-1818-writer-id-consumer-inventory.md), [đề xuất Rust-first §3–§4](../reports/proposal-261015-1715-rust-first-component-hook-identity-lock.md), [Astra vòng 2 B6–B9](../reports/red-team-astra-round2-261015-1859-lock-and-identity-foundation-design-v2-review.md), [docs/io-contract.md](../../docs/io-contract.md), [Convention spec](../../docs/platform/convention/spec.md) (tiền lệ component nền chỉ-đọc).

Source đối chiếu tại `51cd6b680` (main lúc làm).

## 1. Hiện trạng và prior art

| Chỗ | Đang làm gì | Lệch |
|---|---|---|
| [`src/util/session-identity.mjs`](../../src/util/session-identity.mjs) | env `FGOS_SESSION_ID → CLAUDE_CODE_SESSION_ID`, xác nhận `sessions.json`, rồi leo 3 bước (`/proc` → `ps`), cache `ownPidIdentity` | Không có `CODEX_THREAD_ID`; 3 bước ra `3614` (herdr server) cho mọi shell trần và pid daemon codex cho mọi pane codex (S7) |
| [`packages/observe/rust/src/shard.rs:9`](../../packages/observe/rust/src/shard.rs) `resolve_writer_id` | `FGOS_SESSION_ID` hoặc `pid-<pid của chính nó>` | Bỏ qua Claude/Codex id; không leo |
| [`packages/observe/rust/src/friction.rs:39`](../../packages/observe/rust/src/friction.rs) `current_caller` | `sessionId` = `FGOS_SESSION_ID` | Bản chép thứ ba |
| [`packages/observe/rust/src/eval_journal.rs:262`](../../packages/observe/rust/src/eval_journal.rs) | Gọi `shard::resolve_writer_id` | Theo `shard.rs` |

Prior art (`git log -S`): chưa từng có crate session-identity. `walkAncestors` vào ở `5d96919b5`, `/proc` vào ở `fa4917cec`; cả hai sửa cùng một lỗi gốc: "leo bị cắt ở bước khác nhau ở mỗi process". Luật mới (§4) không đếm bước nên lỗi dạng này không còn chỗ. Hướng "Node trước, Rust sau, hai bản song song" đã bị bác (hội đồng §4, §5).

Có sẵn để dùng lại: route native và catalog (tiền lệ `convention.query`), `FGOS_HOST_BIN` do host đặt cho payload Node ([`legacy_exec.rs:247`](../../apps/fgos/src/legacy_exec.rs)), `scripts/run-tests.mjs` build host và đặt `FGOS_HOST_BIN` cho cả bộ test, luật tìm binary của launcher `~/.local/bin/fgos` và shim fgctl ([`shim.rs`](../../packages/distribution/rust/src/shim.rs)), harness đo của S6 (`scratchpad/s6/`).

## 2. Ranh giới component, một authority

**Session Identity** sở hữu đúng một quyết định: *writer của process đang hỏi là ai, và id đó tin được tới đâu* (`{id, source}`).

| Sở hữu | Không sở hữu |
|---|---|
| Thứ tự và luật hợp lệ của env id | Mint id cho worker, scrub env, lineage (6.3, run supervisor) |
| Xác nhận id với `<fgosDir>/sessions.json` (chỉ đọc; đọc hỏng = không xác nhận) | Ghi `sessions.json` (giữ ở `src/runner/session.mjs`) |
| Luật pid: tổ tiên cao nhất còn tty → session id → pid caller | Liveness, startTime, bootId (process-facts của thiết kế lock) |
| Verb chỉ-đọc `fgos identity` | Quyền lock, quyền settle claim (dùng id, không thuộc đây) |
| Contract + vector dùng chung Rust/Node | Tên file shard Observe (Observe tự đặt từ `{id, source}`) |

Không có state, không ghi gì. Phụ thuộc: `fgos-host-runtime` (provider trait), `serde`, `serde_json`, `libc` (unix).

Bố cục: `packages/session-identity/{contracts,rust/{src,tests}}`. Facade Node giữ ở `src/util/session-identity.mjs`, test Node ở `test/`. Đây là chỗ **lệch chữ** với `{contracts,rust,src,tests}` trong đề xuất; lý do ở D8.

**Component boundary:** có đổi bản đồ. Thêm hàng "Session Identity" vào [component-boundary.md](../../docs/platform/component-boundary.md) ở phase 04.

## 3. Phân tầng

```text
L-os   đọc /proc/<pid>/stat (ppid, session, tty_nr), getppid, getsid    module riêng `proc_tree`, sau trait ProcessTree
L-id   resolve(env, tree, caller_pid, fgos_dir) -> {id, source}          thuần; I/O chỉ qua trait + đọc sessions.json
L-app  Observe (gọi crate trong process) · apps/fgos (verb) · facade Node → mọi caller Node
```

- Crate không biết lock, terminal, herdr, transport. Luật không chứa tên multiplexer nào (S7: so theo tên dễ gãy, `comm` của node là `MainThread`).
- Bộ đọc `/proc` là adapter riêng sau trait `ProcessTree`; test dùng bảng process giả. Observe `store_lock.rs` đang có một bộ đọc `/proc/<pid>/stat` khác cho liveness. Gom cả hai vào component process-facts là việc của 4.2 (thiết kế đang sửa B7); khi đó adapter này chuyển sang đó. Điều kiện kết thúc có tên, ghi trong spec.
- Facade Node chỉ là cầu: tìm binary, exec, kiểm hình dạng output, cache. Nó không quyết định id hay source.

## 4. Luật resolve

Đầu vào: env của process hỏi, `caller_pid`, `fgos_dir` (tuỳ chọn). Đầu ra `{id, source}`.

1. **Env.** Lần lượt `FGOS_SESSION_ID`, `CODEX_THREAD_ID`, `CLAUDE_CODE_SESSION_ID`. Giá trị trim; hợp lệ khi khác rỗng, ≤200 ký tự, khớp `^[A-Za-z0-9._-]+$`. Không hợp lệ thì xét biến kế (giữ D18). Biến hợp lệ đầu tiên thắng: `id` = chuỗi đó; `source = registry` nếu `<fgos_dir>/sessions.json` là mảng có row `sessionId === id`, ngược lại `env`.
2. **Gốc terminal (Linux).** Từ `caller_pid` (tính cả chính nó) đi lên cha qua `/proc/<p>/stat` (đếm trường từ dấu `)` cuối) tới pid 1 hoặc khi không đọc được nữa. Nhớ process **cao nhất** có `tty_nr ≠ 0`. Có thì `id` = pid đó, `source = pid`. Giới hạn 4096 bước chống vòng.
3. **Session.** Không tổ tiên nào có tty: `id` = session id của `caller_pid` (Linux: trường session của stat; unix khác: `getsid(caller_pid)`), `source = pid`, khi > 0.
4. **Không xác định.** Không đọc được gì (Windows, `/proc` bị chặn, caller đã chết): `id = caller_pid`, `source = unresolved`. Giữ nghĩa io-contract hiện nay.

Kết quả trên dữ liệu S7: shell trần → zsh gốc pane (hết `3614`/`1`); agy/pi/omp → zsh gốc pane cho cả đường `host` lẫn `direct` (hết lệch hai id trong một pane); claude, codex đi nhánh env. Luật không phụ thuộc độ sâu, nên lớp Rust nằm sâu hơn Node một bậc không đổi kết quả (S6 điều kiện 5 thoả từ luật, không cần mẹo).

### 4.1 Vì sao bước 3 (D1, Lead tự quyết)

S7 đề xuất "không có tty thì giữ leo 3 bước". Em không giữ:

- Giữ là có hai thuật toán leo, một cái đếm bước, đúng thứ `5d96919b5`, `fa4917cec` đã phải chữa.
- Process không tty vẫn cần id ổn định giữa nhiều lệnh: gateway (pick một request, return request khác), cron, CI. `unresolved` cho mỗi lệnh một id, claim lấy ở lệnh này không settle được ở lệnh sau (cơ chế S1 E4).
- Session id là sự thật của OS, đã nằm trong cùng dòng stat, giống nhau cho mọi process trong một session và còn nguyên khi session leader đã chết.

Giới hạn: nếu một CLI chạy mỗi lệnh tool trong session mới và không có tty, mỗi lệnh ra một id (không tệ hơn `unresolved` hôm nay). Codex có `CODEX_THREAD_ID`; agy/pi/omp do `fgos run` bật thì nhận `FGOS_SESSION_ID` từ launcher.

### 4.2 Giới hạn đã biết (ghi vào spec)

- Terminal hay IDE bật từ một shell mà không tách session (`xterm &`, có thể một số IDE): tổ tiên cao nhất còn tty là shell đã bật nó, nên các terminal con chung id. Cùng hình dạng cây với omp (pty trong pty) nhưng ngược kết luận; luật chọn "cao nhất" theo bằng chứng S7. Best-effort như D6 cũ.
- Subagent cùng phiên Claude chung `CLAUDE_CODE_SESSION_ID` (hội đồng 2.2, anh đã chấp nhận).
- Container khác pid namespace dùng chung `.fgos`: pid gốc có thể trùng giữa hai container.
- Unix không phải Linux: không có bước 2, chỉ bước 3 (trên macOS session của shell terminal thường chính là gốc tab). macOS không phải target release.
- Pid gốc có thể bị tái dùng sau khi pane đóng; không thêm starttime vì sẽ đổi kiểu `writer.id` (S7 câu 4).
- Multiplexer không gọi `setsid` cho server: mọi pane gộp về một id. Doctor in `{id, source}` để thấy được.
- CI runner tự host chạy như service: mọi job chung một session, nên chung id mãi mãi.
- Process `nohup` sống sau khi pane đóng: rơi xuống bước 3, ra session id, thường bằng pid gốc pane cũ (ổn định chỉ khi tổ tiên cao nhất có tty là session leader).
- Biến env id bị rò: herdr server hay Claude bật từ trong shell codex mang theo `CODEX_THREAD_ID`, và biến này nay đứng trước `CLAUDE_CODE_SESSION_ID`. Scrub env là việc của 6.3.
- `FGOS_HOST_BIN` được kế thừa: process con (worker, payload worktree cũ) dùng binary của cha; cha sống lâu có thể giữ đường tới release đã bị dọn (khi đó `host-missing`).

## 5. Contract và verb

- Route: selector `identity`, `route_kind: native`, `operation_id: session-identity.resolve`, `owner_path: packages/session-identity/rust`, không subcommand. Catalog: effect `Read`, idempotency `Safe`, host kind chỉ `cli`.
- CLI: `fgos identity [--pid <n>] [--fgos-dir <dir>]`.
  - `--pid` vắng: unix lấy `getppid()`; Windows lấy pid của chính nó. Có mặt: số nguyên dương, không thì exit 4. Không so với `getppid()` (D2).
  - `--fgos-dir` vắng: bỏ bước xác nhận registry.
  - Flag lạ hoặc thiếu giá trị: exit 4.
- Output: envelope `fgos.v1`, `data = {"id": <string|number>, "source": "registry"|"env"|"pid"|"unresolved"}`. `id` là chuỗi với `registry`/`env`, số nguyên dương với `pid`/`unresolved` (giữ hình dạng `writer.id` hiện nay).
- Contract: `packages/session-identity/contracts/session-identity.resolve.v1.json` (request/outcome, env order, regex, độ dài, 4 source) và vector `session-identity.golden.v1.json` (§10).
- Chạy được khi `FGOS_RUST_HOST_RECURSION_GUARD=1` (route native, S6 §6).
- `fgos identity --help` đi về manifest Node như mọi verb native: thêm entry vào `src/cli/command-registry.mjs`.

## 6. Facade Node (`src/util/session-identity.mjs`)

```text
resolveWriterIdentity(fgosDir) -> { id, source }     // tên giữ nguyên, 15 importer không đổi
REGISTRY, ENV, PID, UNRESOLVED                       // hằng số giữ nguyên
WriterIdentityError { code, category: 'precondition' }   // exit 2
```

Bỏ các tham số `env`, `pid`, `execFile` hiện có (chỉ test cũ dùng). Không còn `procPpidOf`.

- **Tìm binary (D5), một lần mỗi process, một module lá cho cả Node:** tạo `src/util/host-bin-path.mjs` (chỉ `fs`/`path`, không vòng import) với `resolveActiveHostBin({ fgosDir, cwd })`, thứ tự:
  1. `process.env.FGOS_HOST_BIN` nếu là file;
  2. `<dirname(fgosDir)>/.fgos/installation/activation.json` (fgosDir của store đã là `.fgos` chính, kể cả khi đang ở worktree `fgos pick` dưới `/tmp/fgos-worktrees`; không cần gọi git);
  3. đi ngược từ `cwd` tìm `.fgos/installation/activation.json` (đúng việc launcher `~/.local/bin/fgos` làm).

  Đọc activation đúng luật shim fgctl: `status: "ready"`, `releasePath`, binary `releasePath/bin/fgos` (hoặc `.exe`), phải là file thực thi. Không tìm thấy → `host-missing`, thông báo nêu các đường đã thử và hai cách sửa (chạy qua `fgos`, hoặc đặt `FGOS_HOST_BIN`). Không đọc `target/`, không PATH, không qua shim (+5 ms, S6), không parse `manifest.json` 242 KB.
  `src/util/host-bin.mjs` `resolveHostBin` chuyển sang gọi `resolveActiveHostBin` (với `fgosDir` = `.fgos` của main root nó vốn tìm bằng git), giữ phần dò thêm cho caller chỉ có cwd. Như vậy cả Node chỉ còn **một** luật "activation → binary", trùng với shim (RUL11: plan này tạo ra chỗ tách nên gom luôn trong phạm vi). Facade không import `host-bin.mjs` (18 ms import; vòng `host-bin → paths → worktree → store → session-identity`).
- **Exec:** `execFileSync(bin, ['identity', '--pid', String(process.pid), ...(fgosDir ? ['--fgos-dir', fgosDir] : [])], { env: <process.env bỏ FGOS_INVOCATION_RECORD_PATH>, timeout: 2000, killSignal: 'SIGKILL', stdio: ['ignore','pipe','pipe'], maxBuffer: 64 KiB })`. Bỏ biến đó để verb thật sự không ghi gì (`main.rs` ghi invocation record khi biến có mặt).
- **Cache (D3), hai tầng:**
  - Khoá env = `[FGOS_SESSION_ID, CODEX_THREAD_ID, CLAUDE_CODE_SESSION_ID]` đọc từ `process.env` lúc gọi.
  - Kết quả `pid`/`unresolved` không phụ thuộc `fgosDir`, nên lưu theo **khoá env** một mình: một process chỉ có một id nhánh pid dù gọi với bao nhiêu dir (giữ đúng tính chất của `ownPidIdentity` cũ). Câu trả lời đầu tiên được giữ suốt đời process, kể cả khi sau đó pane đóng và tty mất.
  - Kết quả `env`/`registry` lưu theo `(khoá env, realpath(fgosDir))` (`path.resolve` khi realpath lỗi), vì `source` phụ thuộc registry của dir đó.
  - Tra: thử bảng pid theo khoá env trước, rồi bảng env theo cặp. Facade không tự xét env nào hợp lệ (không chép luật); nó chỉ học từ `source` binary trả về.
  - Ba tên biến lặp lại contract; test đối chiếu với `session-identity.resolve.v1.json`. Lỗi không bao giờ được cache.
- **Kiểm output:** envelope `fgos.v1`, `ok: true`; `source` thuộc 4 giá trị; `id` đúng kiểu theo `source`. Sai → `bad-output`.
- **Cache cả `source`:** session đăng ký giữa chừng sẽ không đổi `env` → `registry` trong cùng process. Chấp nhận: S1 #26 xác nhận không chỗ nào dùng `source` để cấp quyền.

### 6.1 Timeout và lỗi (B8)

| Tình huống | Facade | Ghi chú |
|---|---|---|
| exit 0, envelope đúng | trả `{id, source}`, cache | |
| không tìm thấy binary / spawn `ENOENT`, `EACCES` | `host-missing` (kèm đường đã thử) | |
| exit 4 và stderr chứa `unknown verb "identity"` | `host-version-mismatch` | release đang active cũ hơn payload; cần restage/activate. Câu này cố định ở `main.rs` |
| `err.code === 'ETIMEDOUT'` (quá 2000 ms) | `timeout` | `execFileSync` gửi SIGKILL và **chờ child thoát** trước khi trả về; verb không ghi gì nên không có kết quả lửng; lần gọi sau thử lại từ đầu |
| mọi `err.code` khác (`ENOBUFS`, `EAGAIN`, `ENOMEM`, `EMFILE`…), chết vì signal khác, exit khác 0 khác | `host-error` (kèm errno/signal/exit, stderr) | |
| output không parse được / sai hình | `bad-output` | |
| cache trượt khi process đang giữ `events.lock`/`claims.lock` | `identity-in-lock` | xem §7; không exec |

Không retry (D6). Không bao giờ trả id đoán. `unresolved` vẫn là kết quả hợp lệ, không chặn caller. **Lỗi cài đặt thì chặn verb ghi**: đây là sửa D9 của io-contract ("caller chưa xác danh không bị chặn" vẫn đúng; "không có binary host thì không ghi" là điều mới, theo O5).

### 6.2 Caller

| Caller | Khi resolve lỗi |
|---|---|
| store, events, runtime-coordination, transport, authority, dispatch/cli | ném lên; verb fail với `WriterIdentityError` (exit 2), không ghi gì |
| `.githooks/pre-commit` `resolveIdentity` | try/catch → `refuse("commit refused: cannot resolve the writer identity (<code>): <message>")` |
| `bin/fgos.mjs` `releaseMainCheckoutLockIfOwn(dir, …)` (5 chỗ) | bỏ qua bước nhả sớm; TTL của hook lo phần còn lại |
| `src/runner/lock-wait.mjs:100` | câu "a different pid/session" |
| `src/cli/invocation-fault-log.mjs:78` | ghi fault với `writer: null, writerError: <code>` thay vì mất cả record |

## 7. Không exec khi đang giữ lock (D4, phần identity của B6)

- Bất biến: **cầu identity không exec khi process đang giữ `events.lock` hoặc `claims.lock`.** Exec khác trong vùng găng (vd `git rev-parse HEAD` trong `claimWork`, B6) không thuộc 5.1 mà thuộc 4.3 (thu hẹp vùng claim). Spec ghi đúng phạm vi lời hứa này.
- Cách giữ (cấu trúc, không dựa vào caller nhớ):
  - `withEventsLock(logPath, fn, fgosDir = path.dirname(logPath))` và `withClaimsLock(fgosDir, fn)` gọi `resolveWriterIdentity(fgosDir)` **trước** khi lấy lock. `withClaimsLock` prime đúng dir đã chuẩn hoá (`getMainFgosDir`) mà code bên trong dùng.
  - Lock lồng: `settleClaim` (`store.mjs:1147-1148`) và `claimWork` (`claim-port.mjs:301`) lấy `events.lock` rồi mới tới `claims.lock`. Hai chỗ này prime thêm `getMainFgosDir(dir)` **trước** lock ngoài. Nhờ cache hai tầng (§6), nhánh pid đã trúng sẵn; chỉ nhánh env cần dir đúng.
  - Call site truyền `fgosDir` khi `logPath` là file per-writer dưới `.fgos/events/` (vì `dirname` khi đó là `events/`): `store.mjs` và `porting-store.mjs` `withEventsLockAndRefresh`, `events-compaction.mjs:219`, `claim-port.mjs:301`, `events.mjs` `repairTruncatedLastLine`, `appendEvent(logPath, opts, fgosDir)`.
- **Cạnh có canh:** hai lock helper tăng/giảm một bộ đếm "đang giữ lock" cấp process (trong `finally`). Facade trượt cache khi bộ đếm > 0 thì ném `identity-in-lock`, không exec. Đây là lỗi lập trình (một đường mới chưa prime), verb fail sạch trước khi ghi, không phải nhánh riêng cho test.
- Code bên trong lock vẫn gọi `resolveWriterIdentity(dir)` như cũ và trúng cache.
- Exec khác trong vùng găng vẫn còn và **không** thuộc 5.1: `git rev-parse HEAD` trong `claimWork` (B6), `getMainFgosDir` gọi git khi `acquireClaim`/`releaseClaim` chạy bên trong `events.lock`. Thuộc 4.3.
- Proof: test đa process đặt `FGOS_HOST_BIN` là wrapper `sh` ghi lại "lúc exec, `events.lock`/`claims.lock` có tồn tại không" rồi `exec` binary thật. Chạy trên **repo git thật có linked worktree, đi qua một đường symlink**, process mới (cache trống), gọi `addWork`, `editWork`, `moveWork`, `acquireClaim`, `releaseClaim`, `settleClaim`, `claimWork`, `appendEvent` per-writer. Wrapper không được thấy lock nào và không có `identity-in-lock`.

## 8. Hook

- Đổi tối thiểu: thân `resolveIdentity` bọc try/catch như §6.2. Dòng import giữ nguyên.
- Hook chạy code working tree. Giữa merge và activate, binary đang active chưa có verb `identity` → commit ở main checkout bị từ chối với `host-version-mismatch` (lỗi rõ). Runbook phase 06: activate ngay sau merge, hoặc dùng `git commit` trần với `FGOS_HOST_BIN` trỏ binary vừa build. Commit do một verb `fgos` sinh ra không dùng cách này được: host luôn ghi đè `FGOS_HOST_BIN` bằng chính nó (`legacy_exec.rs:246-247`).
- Clone mới chưa activate: commit ở main bị từ chối với `host-missing` (O5). Commit trong linked worktree không đi qua bước identity.
- Điểm gặp với W1' (hook ghi beacon `.fgos/runtime/main-checkout-activity.json` thay cho `main-checkout.lock`): em chỉ sửa thân `resolveIdentity` (khoảng dòng 123–130). Nếu W1' land trước và đổi chỗ gọi, khi merge giữ try/catch quanh lời gọi resolve, bất kể nó đổ vào lock hay beacon.

## 9. Observe

- `shard.rs`: xoá `resolve_writer_id`. Tên shard: `id` khi `source` là `env`/`registry`, `pid-<id>` khi `pid`/`unresolved` (giữ dạng tên cũ). Gọi `fgos_session_identity::resolve_current(None)`.
- `eval_journal.rs` và mọi nơi đặt tên shard đi qua hàm đó; `lib.rs` bỏ re-export cũ.
- `friction.rs` `current_caller`: `sessionId` = `id` khi `source` là `env`/`registry`, vắng khi `pid`/`unresolved`. Giữ trường `pid`.
- Hệ quả thấy được (CHANGELOG): writer terminal trước có một shard mỗi process (`pid-<own>`), nay chung `pid-<gốc terminal>`; ghi đã nằm dưới `acquire_store_lock`, reader đọc mọi shard. Phiên Claude/Codex nay ghi shard theo session id.

## 10. Vector dùng chung

`packages/session-identity/contracts/session-identity.golden.v1.json`:

- `envCases`: env + trạng thái registry (`absent`, `rows`, `corrupt`, `not-array`, không có `fgosDir`) → `{id, source}`. Gồm: thứ tự ba biến; biến rỗng rơi xuống biến kế (bẫy S1 E11); `:` bị loại (dạng `HERDR_PANE_ID`); 201 ký tự bị loại; 200 ký tự nhận; trim; registry khớp/không khớp/hỏng.
- `treeCases`: bảng process giả `{pid, ppid, session, tty}` + `callerPid` → `{id, source}`. Lấy từ S7: shell trần trong herdr, omp với pty riêng, tool shell của Claude (`tty=0`, session riêng) dưới claude, đường `host` và `direct` cùng pane ra cùng id, daemon codex không tty → session, container pid 1 có tty, process biến mất giữa đường, không đọc được caller → `unresolved`, vòng ppid → dừng.
- `treeCases` thêm: sudo `use_pty` (pty trong pty, ra shell ngoài), multiplexer không `setsid`, process `nohup` mất tty sau khi pane đóng.
- Cargo chạy cả hai nhóm. Node chạy `envCases` qua binary thật (env thật, thư mục registry tạm). Nhóm cây chỉ cargo chạy được; Node có thêm test process thật (§11).

## 11. Test

- Cargo (`packages/session-identity/rust/tests/golden.rs` + unit): mọi vector; parse stat có `)` và khoảng trắng trong comm; `--pid` sai dạng bị từ chối (test binary thật trong `apps/fgos`).
- Node `test/util/session-identity.test.mjs` (viết lại): `envCases` qua binary thật; đối chiếu ba tên biến với contract; cache (đổi env → kết quả mới; cùng env → không exec lại, đếm bằng wrapper); độ sâu không đổi id (con và cháu qua `sh -c` cùng id); `setsid` không tty → id là session; lỗi `host-missing`, `host-version-mismatch` (binary giả in đúng câu), `timeout` (binary giả ngủ, kiểm child đã chết khi facade trả về), `bad-output`, `host-error`; lỗi không bị cache; tìm binary qua `activation.json` trong cwd giả.
- Node: cache hai tầng (nhánh pid một id cho mọi dir; nhánh env tách theo realpath dir); `identity-in-lock` khi trượt cache trong lock; env con không có `FGOS_INVOCATION_RECORD_PATH`; `host-bin-path.mjs` (thứ tự ba nguồn, luật shim, file không thực thi bị bỏ) và `host-bin.mjs` dùng nó.
- Regex/độ dài id trong `execution-contract.mjs:249-250` là bản chép còn lại: test đối chiếu với contract JSON.
- Baseline `scripts/check-decision-codes.baseline.json` có tên file test bị viết lại: sinh lại đúng lệnh mà suite dùng, `git diff --stat` trước khi stage.
- Node đa process §7: `test/state/identity-before-lock.test.mjs`.
- Test đang có cần sửa: hook e2e (truyền `FGOS_HOST_BIN` cho git), `test/state/store.test.mjs`, `runtime-coordination`, `test/cli/fgos-post-merge.test.mjs`, `merge*.test.mjs`, `runner-loop`, `root-file-guard-hook`, `command-routes`, `help-routes`, Observe `eval_journal_test.rs`.
- Rà test spawn `bin/fgos.mjs` với env tự dựng không có `FGOS_HOST_BIN` (`env: {` không trải `process.env`): thêm biến vào env đó, không thêm nhánh bỏ qua.
- Cách chạy (không chạy full `npm test`): `cargo test -p fgos-session-identity -p fgos-observe -p fgos`; `env -u CLAUDE_CODE_SESSION_ID -u FGOS_SESSION_ID -u CODEX_THREAD_ID FGOS_HOST_BIN=<target/debug/fgos> node --test <file>…`.

## 12. Doctor, setup, docs

- Doctor `writer-identity-resolvable` (`src/setup/registrations.mjs`): resolve **hai lần**, một lần theo đường bình thường (có `FGOS_HOST_BIN` khi chạy qua host), một lần bỏ qua `FGOS_HOST_BIN` (đường mà hook của `git commit` trần đi). In `{id, source}` và cả hai binary. Fail khi đường thứ hai không tìm được binary trong main checkout có activation, kèm mã lỗi và cách sửa. Không thêm config default hay env var mới; `fgos setup` không đổi.
- Kênh tương thích (`node bin/fgos.mjs`, `bin.fgos` của npm global) không có `FGOS_HOST_BIN`: chỉ ghi được khi cwd/fgosDir nằm trong project đã activate. Ghi rõ ở [AGENTS.md](../../AGENTS.md) mục "Legacy-Node CLI Ownership Boundary", `docs/specs/distribution.md` và CHANGELOG. O5 giữ nguyên.
- Ghi check vào [`docs/specs/distribution.md`](../../docs/specs/distribution.md) và [`setup-doctor-registry.md`](../../docs/platform/packaging-distribution/contracts/setup-doctor-registry.md).
- Spec mới `docs/platform/session-identity/spec.md` (khung giống Convention spec). [`docs/io-contract.md`](../../docs/io-contract.md): câu `pid` đổi thành gốc terminal → session; thêm câu lỗi cài đặt chặn verb ghi. [`component-boundary.md`](../../docs/platform/component-boundary.md) thêm hàng. [`reading-map.md`](../../docs/specs/reading-map.md) thêm dòng. [`docs/specs/observe.md`](../../docs/specs/observe.md) câu tên shard. [node-to-rust-migration.md](../../docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md) thêm hàng "Session Identity in Rust".
- CHANGELOG `[Unreleased]`: verb `fgos identity`; id mới cho shell trần, agy/pi/omp, pane codex; payload Node cần binary host cho mọi lần ghi; tên shard Observe; `sessionId` của friction; phải drain trước activate.

## 13. Lead tự quyết (D1–D8)

| # | Quyết | Lý do ngắn |
|---|---|---|
| D1 | Không tty → session id, `source: pid` | §4.1 |
| D2 | `--pid` tuỳ chọn, mặc định `getppid()`; **không** so với `getppid()` | Luật không phụ thuộc độ sâu nên phép so chỉ thêm đường lỗi (wrapper, Windows). Identity không cấp quyền, khác owner pid của lock helper. Facade vẫn luôn truyền `--pid` (S6 điều kiện 5, nhánh `unresolved`) |
| D3 | Cache hai tầng: nhánh pid theo khoá env; nhánh env theo `(khoá env, realpath dir)` | ~57 chỗ test đổi `process.env.FGOS_SESSION_ID` giữa chừng; một process một id nhánh pid |
| D4 | Prime trong `withEventsLock`/`withClaimsLock` + hai chỗ lock lồng; trượt cache trong lock → `identity-in-lock` | §7 |
| D5 | Module lá `host-bin-path.mjs`: `FGOS_HOST_BIN` → activation cạnh `fgosDir` → activation gần nhất từ cwd; `host-bin.mjs` dùng lại nó | Một luật "activation → binary" cho cả Node, trùng shim. Chạy được trong worktree `/tmp/fgos-worktrees` |
| D6 | Timeout 2000 ms, SIGKILL + chờ child thoát, không retry | §6.1 |
| D7 | Hook chỉ thêm try/catch | §8 |
| D8 | Facade ở `src/util/session-identity.mjs`, test ở `test/` | Payload release chỉ stage `src/` (`package.json` `files`), `npm test` chỉ tìm trong `test/`; tiền lệ Convention Q10/Observe. Đưa vào `packages/session-identity/src` phải đổi staging và runner test, không mua thêm gì |

## 14. Rủi ro

| Rủi ro | Giảm |
|---|---|
| Commit ở main bị chặn giữa merge và activate | Runbook phase 06; thông báo lỗi nói cách sửa |
| Claim mở dưới id cũ không settle được sau đổi | Drain **mọi** claim mở trước activate (phase 06), không chỉ id số: id chuỗi cũng đổi khi process có cả `CODEX_THREAD_ID` lẫn `CLAUDE_CODE_SESSION_ID`. Hôm nay có 12 claim mở, 3 giữ bởi `"2548"` |
| Worktree tạo trước 5.1 vẫn chạy resolver Node cũ, ghi vào `.fgos` chính dưới id khác | Runbook phase 06: liệt kê worktree đang mở có merge-base trước 5.1, catch-up trước khi ghi |
| Mọi lần ghi Node cần binary host | Production: host đặt `FGOS_HOST_BIN`. Dev/test: `run-tests.mjs` đã build. Chạy `node bin/fgos.mjs` trực tiếp ở chỗ không có activation thì fail rõ (O5) |
| Test đổi hành vi theo có/không tty (local khác CI) | Bước 3 làm CI và local cùng "một writer cho cả lượt chạy" |
| Cache theo khoá env làm test đổi env chậm hơn (mỗi khoá mới ~3 ms) | Chấp nhận |
| Một đường ghi mới quên truyền `fgosDir` cho lock helper | Prime nằm trong helper; test §7 bắt lần exec trong lock |

Rollback: revert các commit của 5.1 trên nhánh tích hợp trước khi activate. Sau khi activate thì activate lại release trước (fgctl giữ `previousArtifactDigest`); claim đã lấy dưới id mới cần drain lần nữa.

## 15. Việc của phase này

1. Viết plan + phase (xong).
2. `node bin/fgos.mjs dispatch decide --for review --needs-soul --has-live-task-access`, rồi phản biện in-process theo 7 nguyên tắc.
3. Red-team Astra qua `node bin/fgos.mjs run … --account tetcu72`, đọc report ở outbox.
4. Gộp phát hiện (nhận / giảm / bác có bằng chứng), tối đa 2 vòng red-team. Ghi kết quả vào `reports/`.
