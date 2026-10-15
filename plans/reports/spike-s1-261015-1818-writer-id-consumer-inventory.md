# Spike S1 — Kiểm kê nơi dùng writer id trước khi đổi sang id riêng cho từng worker

- Ngày: 2026-10-15. Người làm: spike-s1 (em). Người đọc: anh (owner) và Lead.
- Câu hỏi: hội đồng chốt việc 1b/1c/1d ([kết luận hội đồng, mục 2.2](architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md)). Mỗi lần chạy worker độc lập có writer id riêng. Id của cha chỉ đi kèm để audit (lineage). Worker không mang `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID` của CLI cha. `CODEX_THREAD_ID` vào tầng env của resolver. Red-team cảnh báo lineage không được thành quyền settle ([A4, A12](red-team-astra-261015-1812-lock-and-identity-foundation-design-review.md)).
- Phạm vi: chỉ đọc repo. Thí nghiệm chạy trong scratch, không chạm `.fgos/` thật.

## 1. Kết luận ngắn

- **1c an toàn để land**, nếu cùng commit có đủ 6 việc ở mục 6.
- Không có đường hợp lệ nào hôm nay **cần** child dùng chung id với cha để có quyền. Đường duy nhất cần "mượn" quyền là commit lồng của `fgos approve`. Đường này đã dùng uỷ quyền tường minh qua pid (`FGOS_MAIN_LOCK_HOLDER_PID`), không dùng session id, nên 1c không làm gãy nó.
- Thí nghiệm xác nhận: id chung làm hai worker lọt qua lock của nhau (E1) và cho sibling settle claim của nhau (E3, E6). Id riêng chặn cả ba (E2, E4, E7).
- Có ba lỗ **1c không tự vá**:
  1. `releaseClaim` không kiểm writer (E8).
  2. `FGOS_MAIN_LOCK_HOLDER_PID` là bearer: hai child cùng mượn đều vào được (E10, đúng A4).
  3. Subagent in-process (Agent tool, ví dụ `fgos-fanout`) vẫn chung `CLAUDE_CODE_SESSION_ID`, vì không đi qua launcher của fgOS.
- Một bẫy khi cài đặt: đặt `FGOS_SESSION_ID=""` **không** chặn được id của cha. Resolver bỏ qua chuỗi rỗng rồi rơi xuống `CLAUDE_CODE_SESSION_ID` (E11 `emptyFgos`). Launcher phải đặt giá trị **khác rỗng**.

## 2. Bảng kiểm kê nơi dùng writer id

Cột "Quyền?" = có so id để quyết định ai được làm gì không. Cột "Khi child có id riêng": giữ nguyên / gãy / phải đổi.

### 2.1 Nguồn id và ba đường bật worker

| # | Vị trí | Dùng để | Quyền? | Khi child có id riêng |
|---|---|---|---|---|
| 1 | [session-identity.mjs:64-74, 173-190](../../src/util/session-identity.mjs) `resolveWriterIdentity` | Nguồn duy nhất của writer id. Thứ tự hôm nay: `FGOS_SESSION_ID` → `CLAUDE_CODE_SESSION_ID` → walk pid 3 bậc. | Gốc của mọi so sánh | **Phải đổi (1d):** thêm `CODEX_THREAD_ID` **sau** `FGOS_SESSION_ID`. Hôm nay pane codex rơi xuống pid (E11 `codexOnly`). Chuỗi rỗng vẫn bị bỏ qua, nên launcher không được dựa vào "đặt rỗng để xoá". |
| 2 | [transport.mjs:535](../../src/runner/dispatch/transport.mjs) cli-spawn (chạy nền) | `FGOS_SESSION_ID = id của dispatcher` | Gián tiếp | **Phải đổi:** `FGOS_SESSION_ID = attempt id` (lấy theo `launchCommandId`), cộng thêm biến lineage riêng, ví dụ `FGOS_PARENT_WRITER_ID`. |
| 3 | [authority.mjs:1402-1410](../../src/runner/dispatch/confinement/authority.mjs) đường sandbox | Như #2. Env này được băm vào `envDigest` của prepared invocation. | Gián tiếp | **Phải đổi** như #2. Id phải lấy từ `launchCommandId` đã lưu (authority.mjs:1017-1031), **không** random lúc gọi. Có vậy resume của cùng attempt mới ra cùng id và cùng digest. |
| 4 | [adapters.mjs:98-108](../../src/runner/dispatch/adapters.mjs) `workerBaseEnv` | Giữ toàn bộ env của cha, chỉ bỏ vài biến OMP/Pi. | Không | **Phải đổi:** bỏ thêm `FGOS_SESSION_ID`, `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`. Nên bỏ cả `FGOS_MAIN_LOCK_HOLDER_PID` (A4). |
| 5 | [herdr-round.mjs:1764-1797](../../src/runner/dispatch/herdr-round.mjs) pane herdr không sandbox | Env của pane = env của herdr server + `paneEnv` (chỉ env của executor). Không truyền id nào. | Gián tiếp | **Phải đổi:** truyền `FGOS_SESSION_ID=<attempt id>` khác rỗng qua `--env`. `--env` không xoá được biến server đã có. Nếu server được bật từ trong một phiên Claude, pane thừa hưởng `CLAUDE_CODE_SESSION_ID` của phiên đó. `FGOS_SESSION_ID` khác rỗng vẫn thắng (E11 `both`). |
| 6 | [herdr-round.mjs:1824-1852](../../src/runner/dispatch/herdr-round.mjs) pane herdr có sandbox | Dùng `preparedWorkerInvocation.env` từ #3. | Gián tiếp | Theo #3, không cần sửa riêng. |

### 2.2 Lock

| # | Vị trí | Dùng để | Quyền? | Khi child có id riêng |
|---|---|---|---|---|
| 7 | [main-checkout-lock.mjs:295-308](../../src/runner/main-checkout-lock.mjs) self-recognition | `record.pid === identity`: coi là cùng writer, cho refresh. | **Có** | Giữ nguyên code. Hành vi đúng hơn: sibling bị `held` (E2). Hôm nay `acquired` (E1). |
| 8 | [.githooks/pre-commit:123-130, 466-475](../../.githooks/pre-commit) | Id của hook = `FGOS_MAIN_LOCK_HOLDER_PID` nếu có, không thì `resolveWriterIdentity`. Chỉ chạy khi commit ở main checkout (`hookRunsAtHome`, dòng 166-168). | **Có** | Giữ nguyên. Commit trong linked worktree thoát trước khi đụng lock, nên commit lồng trong worktree không liên quan id. Worker không có quyền git write. Runner commit trong chính tiến trình runner, trong linked worktree ([commit-unit-work.mjs:276, 411](../../src/runner/execution/commit-unit-work.mjs)). |
| 9 | [merge.mjs:772-790, 899-934, 1582-1591, 1892-1931](../../src/runner/merge.mjs), [claim-port.mjs:118-168](../../src/runner/claim-port.mjs), [bin/fgos.mjs:4239](../../bin/fgos.mjs) | Lock main checkout và merge-slot lấy theo `process.pid`. Commit lồng mượn pid qua `HOLDER_PID_ENV_VAR`, chỉ trong env của đúng một lệnh `git commit`. | **Có** (theo pid) | Giữ nguyên, vì không dùng session id. Lỗ A4 vẫn còn: hai child cùng mượn pid đều vào (E10). Không phải phụ thuộc của 1c. |
| 10 | [dispatch/cli.mjs:724-733](../../src/runner/dispatch/cli.mjs), [assignment-runner.mjs:2219-2250](../../src/runner/dispatch/assignment-runner.mjs) lock theo cwd | Id ghép `pid:ms:rand`, không phải writer id. | Có (theo pid) | Giữ nguyên. |
| 11 | [bin/fgos.mjs:1408, 1425, 1795, 3566, 3596](../../bin/fgos.mjs) `releaseMainCheckoutLockIfOwn(resolveWriterIdentity)` | Nhả sớm lock của hook mà chính phiên này để lại sau commit ở main. | **Có** | Giữ nguyên. Phiên tương tác dùng cùng env cho commit và `return`. Worker không commit ở main. |
| 12 | [lock-wait.mjs:100](../../src/runner/lock-wait.mjs) | Chỉ để chọn câu thông báo "có lẽ là phiên của anh". | Không | Giữ nguyên. |

### 2.3 Claim

| # | Vị trí | Dùng để | Quyền? | Khi child có id riêng |
|---|---|---|---|---|
| 13 | [runtime-coordination.mjs:215-245](../../src/state/runtime-coordination.mjs) `acquireClaim` | Ghi `writerId` làm chủ claim. | Ghi chủ | Giữ nguyên. Claim do child lấy thuộc về child. |
| 14 | [store.mjs:1125-1166](../../src/state/store.mjs) `settleClaim` | So chính xác `claim.writerId === writer hiện tại`, hai lần (trước và trong lock). | **Có** | Giữ nguyên, **cấm** nới theo lineage. Sibling bị từ chối (E4). Attempt cũ không settle được claim mới (E7). Child không settle được claim của cha (E5); hôm nay không có luồng hợp lệ nào cần việc này, xem mục 4. |
| 15 | [store.mjs:1032-1058](../../src/state/store.mjs) `revisionDriftIsSelfCaused` | Coi lần sửa item sau khi claim là "do chính mình" nếu `payload.writer.id === claim.writerId`. | **Có** | Hành vi đổi theo hướng fail-closed: worker sửa item đang bị claim thì cha settle bị từ chối (E12). Đúng với hợp đồng worker (mục 4). Cần ghi rõ trong changelog. |
| 16 | [runtime-coordination.mjs:258-288](../../src/state/runtime-coordination.mjs) `releaseClaim` | Chỉ so `claimId` khi được truyền. Không kiểm writer. | **Không có, nhưng lẽ ra phải có** | 1c không vá. Sibling có id bất kỳ vẫn nhả được claim đang sống của người khác (E8). Nơi gọi: [claim-port.mjs:268, 356](../../src/runner/claim-port.mjs) (reclaim có kiểm liveness), [store.mjs:1308](../../src/state/store.mjs) (trong settle), [bin/fgos.mjs:4149, 4161](../../bin/fgos.mjs) `unclaim` (có kiểm liveness ở nhánh `doing`). |
| 17 | [bin/fgos.mjs:4153](../../bin/fgos.mjs) | In `claim.writerId` trong lỗi `unclaim`. | Không | Giữ nguyên. |

### 2.4 Quy thuộc, tên file shard, provenance

| # | Vị trí | Dùng để | Quyền? | Khi child có id riêng |
|---|---|---|---|---|
| 18 | [store.mjs:158-176](../../src/state/store.mjs) `resolveWriterLogPath` | Tên file `.fgos/events/<writerId>-<ts>.jsonl`. | Không | Giữ nguyên code. Mỗi attempt có ghi state sẽ tạo file riêng (E9). Hai sibling không còn ghi chung một file. Ghi chú: file được chọn theo prefix `${writerId}-`. Id mới mint không nên chứa `-` để tránh id này là prefix của id khác. `launchCommandId` dạng `cmd_<ms>_<hex>` đã thoả. |
| 19 | [events.mjs:482](../../src/state/events.mjs) `src` | Đóng dấu writer vào event trước khi băm. | Không | Giữ nguyên. |
| 20 | [store.mjs:369, 451, 486, 708, 1484, 1586, 1623](../../src/state/store.mjs) `payload.writer` | Quy thuộc. Replay lấy writer ghi sau cùng. | Không (riêng #15 đọc lại nó) | Giữ nguyên. |
| 21 | [worker-slots.mjs:94-113](../../src/state/worker-slots.mjs) | `sessionId = item.writer.id`, chỉ để hiển thị. Đếm slot theo item. | Không | Giữ nguyên. |
| 22 | [invocation-fault-log.mjs:78](../../src/cli/invocation-fault-log.mjs) | Quy thuộc. | Không | Giữ nguyên. |
| 23 | [dispatch/cli.mjs:1208](../../src/runner/dispatch/cli.mjs), [assignment.mjs:90-94, 548](../../src/runner/dispatch/assignment.mjs), [execution-contract.mjs:248-251, 390-394](../../src/runner/dispatch/execution-contract.mjs) | Token đặt tên assignment, ghi provenance `caller.writerId`. Kiểm định dạng `[A-Za-z0-9._-]{1,200}`. | Không | Giữ nguyên. Id mint phải qua regex này. `cmd_<ms>_<hex>` qua. |
| 24 | [shard.rs:9-26](../../packages/observe/rust/src/shard.rs), [eval_journal.rs:262](../../packages/observe/rust/src/eval_journal.rs) | Tên shard observe `<FGOS_SESSION_ID or pid-N>.jsonl`. Không đọc `CLAUDE_CODE_SESSION_ID`, nên đã lệch với resolver JS. | Không | Giữ nguyên code. Mỗi attempt một shard. Các file `pid-*.jsonl` đang tràn trong `git status` là tiến trình không có `FGOS_SESSION_ID`, nhiều khả năng là pane herdr không sandbox (#5). 1c sẽ thay chúng bằng shard theo attempt. |
| 25 | [friction.rs:38-47](../../packages/observe/rust/src/friction.rs) `current_caller` | Ghi `session_id` của caller vào friction. | Không | Giữ nguyên. |
| 26 | [session.mjs](../../src/runner/session.mjs) `sessions.json` | Chỉ để xác nhận `source = registry`. | Không. Grep không thấy chỗ nào dùng `writer.source` làm quyền. | Giữ nguyên. Id của child sẽ báo `source: env`. |
| 27 | [registrations.mjs:369](../../src/setup/registrations.mjs) | `CLAUDECODE` hoặc `CLAUDE_CODE_SESSION_ID` → "đang trong shell của harness", đổi mức của một check doctor. | Không | Giữ nguyên. Worker đã scrub mà chạy `fgos doctor` thì check này được báo như terminal thường. Lành tính. |
| 28 | [scripts/stress-test-files.mjs:75](../../scripts/stress-test-files.mjs), [scripts/regenerate-observe-fixtures.mjs:213](../../scripts/regenerate-observe-fixtures.mjs) | Công cụ test: xoá hoặc ghim id. | Không | Giữ nguyên. |
| 29 | Subagent in-process (Agent tool, [fgos-fanout](../../core/skills)) | Dùng chung env của tiến trình Claude Code, nên chung `CLAUDE_CODE_SESSION_ID`. | Gián tiếp | **Ngoài tầm 1c.** Năm Agent chạy `/fgOS:pick` song song có cùng writer id. Lỗi A12 (sibling settle hộ) và lỗi lock của hook vẫn sống ở đường này. |

## 3. Bốn câu hỏi cụ thể của Lead

| Bề mặt | Hôm nay (id chung) | Sau 1c (id riêng) | Cần đổi gì |
|---|---|---|---|
| Lock main checkout, merge-slot, dispatch | Hook so theo session id, nên sibling lọt (E1). Merge-slot, approve, take, dispatch lock đều theo pid, không bị ảnh hưởng. | Sibling bị `held` ở hook (E2). Các lock theo pid không đổi. | Không đổi code lock. A4 (grant bearer) là việc riêng. |
| Claim acquire/settle | Sibling settle hộ được (E3). Attempt cũ settle được claim mới (E6). | Cả hai bị từ chối (E4, E7). Chủ claim vẫn settle được. | Giữ so chính xác. Vá `releaseClaim` (E8) ở việc riêng, nên sớm. |
| Quy thuộc events, shard observe | Mọi worker ghi dưới id của Lead và vào chung file. | Mỗi attempt một file, lineage nằm ở biến riêng. | Chỉ cần thêm lineage vào payload nếu muốn audit "ai sinh ra ai" ngay trong event. Không bắt buộc cho 1c. |
| Luồng take → worker → return | Worker bị hợp đồng cấm gọi verb ghi. Nhưng nếu vi phạm thì vẫn qua check, vì chung id. | Worker vi phạm bị chặn ở settle (E5) và làm cha settle lỗi khi nó đã sửa item (E12). | Không cần uỷ quyền. Ghi rõ hành vi fail-closed mới. |

## 4. Đường nào hôm nay thật sự cần child == parent

Em đã xét từng ứng viên. Không đường nào cần chung **session id** để đúng.

| Ứng viên | Có cần chung id? | Bằng chứng | Thay bằng gì nếu sau này cần |
|---|---|---|---|
| Commit lồng của `fgos approve` (root → main) phải được hook nhận là chủ lock | Cần chung **pid**, không cần chung session id | `HOLDER_PID_ENV_VAR` chỉ nằm trong env của một lệnh `git commit` (merge.mjs:1582-1591) | Grant có phạm vi resource + epoch, dùng một lần, cha join trước khi nhả (theo A4). Không làm trong 1c. |
| Worker tự `fgos return` hoặc settle claim của dispatcher | Không. Bị cấm. | [coding-worker-contract.md:103-114](../../core/skills/_shared/coding-worker-contract.md); [loop.mjs:4-7](../../src/runner/loop.mjs) "the worker's prompt forbids it from calling `fgos`"; [worker-prompt-discovery.txt:31](../../src/runner/prompt-templates/worker-prompt-discovery.txt). Runner tự settle trong tiến trình của nó (loop.mjs:487-1266). | Nếu sau này cần: bản ghi uỷ quyền tường minh do chủ claim ghi dưới `claims.lock`, dạng `{claimId, attempt, delegateWriterId, action: "settle", expiresAt, singleUse}`. `settleClaim` chấp nhận khi writer bằng `claim.writerId`, **hoặc** khớp đúng một grant cùng claimId + attempt + id của delegate. Không bao giờ chấp nhận vì cùng cha. |
| Worker sửa item đang bị claim (revision drift "do chính mình") | Không. Bị cấm, như dòng trên. | E12 cho thấy sau 1c thì fail-closed | Như trên, nếu thật sự cần. |
| `fgos pick` rồi `fgos return` trong cùng phiên tương tác | Không phải child. Cùng env. | bin/fgos.mjs:3257-3596 | Không cần. |
| Resume cùng một attempt sau khi tiến trình khởi động lại | Cần **cùng id với chính nó**, không phải với cha | launchCommandId được lưu và kiểm khi resume (herdr-round.mjs:1528-1554, 1703-1738) | Lấy attempt id = `launchCommandId` đã lưu. |
| Dispatch lồng (worker tự `fgos run`) | Không | Cháu lấy id của cháu, lineage trỏ về child | Không cần. |

## 5. Thí nghiệm S1

Thí nghiệm gọi thẳng helper production (`resolveWriterIdentity`, `acquireMainCheckoutLock`, `acquireClaim`, `settleClaim`, `releaseClaim`, `addWork`, `editWork`) trên `.fgos` tạm trong `/tmp/claude-1000/-home-vantt-projects-forgentX/bbe6155f-ff18-4e69-ad42-40abac4a35bf/scratchpad/s1/`. Mỗi kịch bản dùng `.fgos` mới. Mọi tiến trình con đều bị gỡ `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`, `CLAUDECODE`. Mỗi bước là một tiến trình OS riêng.

| Mã | Kịch bản | Kết quả | Ý nghĩa |
|---|---|---|---|
| E1 | A, B chung `P` lấy lock kiểu hook | A acquired, **B acquired** | Lỗi an toàn 2 tái hiện |
| E2 | A=`P.a`, B=`P.b` | A acquired, **B held** | 1c đóng được |
| E3 | Chung id: A claim, B settle claim của A | **ok:true** | A12 đang sống |
| E4 | Id riêng: B settle claim của A, rồi A settle | B: writer mismatch; A: ok | Đúng |
| E5 | Cha `P` claim, child `P.c1` settle, rồi cha settle | child: writer mismatch; cha: ok | Child không có quyền nhờ lineage |
| E6 | Chung id: attempt1 claim → release; attempt2 claim; attempt1 settle claim mới | **ok:true** | Attempt cũ cướp được claim mới |
| E7 | Như E6, id riêng | attempt1: writer mismatch; attempt2: ok | Đúng |
| E8 | Id riêng: B `releaseClaim` claim của A | **released:true**, claim của A mất | Lỗ còn lại sau 1c |
| E9 | A, B chung `P` và A2, B2 riêng, mỗi người `addWork` | File: `P-<ts>`, `P.a-<ts>`, `P.b-<ts>` | Shard theo attempt |
| E10 | Cha giữ lock theo pid, hai child cùng mượn `FGOS_MAIN_LOCK_HOLDER_PID` | **Cả hai acquired**; sibling dùng id riêng: held | A4 xác nhận |
| E11 | Các tầng của resolver | Chỉ có Claude var → dùng id của Lead; chỉ có codex var → pid; cả hai biến → `FGOS_SESSION_ID` thắng; **`FGOS_SESSION_ID` rỗng → rơi về id của Lead** | Cần 1d; không được scrub bằng cách đặt rỗng |
| E12 | Cha claim kèm revision; worker `editWork`; cha settle | Chung id: reconciled, ok. Id riêng: **revision changed** | Fail-closed mới, đúng hợp đồng |

Phần "nested git commit trong worktree" em không chạy bằng hook thật. Hook tự tìm repo root theo vị trí file của nó. Chạy hook thật nghĩa là đụng `.fgos/main-checkout.lock` của repo, trái ràng buộc. Theo code, commit ở linked worktree thoát ở `hookRunsAtHome` (pre-commit:166-168, 466-471) trước khi đụng lock, nên id không tham gia. E1/E2 dùng đúng lời gọi mà hook làm cho commit ở main checkout (`acquireMainCheckoutLock(fgosDir, { identity: resolveWriterIdentity(fgosDir).id, ttlMs: HOOK_TTL_MS })`).

## 6. Phán quyết: 1c có land được không

**Được**, nếu cùng commit có đủ các việc sau:

1. **Một chỗ mint id duy nhất.** Attempt writer id = `launchCommandId`, cho cả ba đường (cli-spawn, sandbox, herdr). Với `legacySpawn` không có `launchCommandId` thì mint một lần `cmd_<ms>_<hex>` tại launcher. Không random lại khi resume.
2. **`workerBaseEnv` bỏ** `FGOS_SESSION_ID`, `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID` (đề xuất bỏ cả `FGOS_MAIN_LOCK_HOLDER_PID`). Sau đó launcher đặt `FGOS_SESSION_ID=<attempt id>` và `FGOS_PARENT_WRITER_ID=<id cha>` (tên biến lineage tuỳ anh chốt).
3. **Pane herdr không sandbox** nhận `FGOS_SESSION_ID` khác rỗng qua `--env`. Đây là đường hôm nay không có id nào.
4. **Resolver (1d):** thứ tự `FGOS_SESSION_ID` → `CODEX_THREAD_ID` → `CLAUDE_CODE_SESSION_ID` → pid. Lineage **không** được đọc ở bất kỳ chỗ so sánh quyền nào: #7, #8, #11, #14, #15, #16.
5. **Hợp đồng và changelog:** sửa mục `writer` trong [io-contract.md](../../docs/io-contract.md): "một id cho mỗi lần chạy độc lập; lineage chỉ để audit; không bao giờ quay lại id chung (T1)". Thêm dòng vào `## [Unreleased]` của `CHANGELOG.md`, vì hành vi fail-closed ở E5 và E12 là thứ người dùng thấy được.
6. **Test hồi quy** từ E2, E4, E5, E7, E12. Thêm test env của cả ba launcher: không còn biến id của cha; `FGOS_SESSION_ID` khác rỗng và ổn định qua resume; digest của prepared invocation không đổi khi resume.

**Không cần cùng commit, nhưng nên mở item riêng ngay:**
- `releaseClaim` phải kiểm chủ (writer) hoặc đi qua đường reclaim đã kiểm liveness (E8).
- Thiết kế lại grant thay cho `FGOS_MAIN_LOCK_HOLDER_PID` (A4, E10).
- Subagent in-process dùng chung id (#29).

**Điểm chắc nhất:** E1–E7 chạy trên helper production thật, kết quả giống nhau ở hai lần chạy đầy đủ.

**Điểm yếu nhất:** đường herdr không sandbox chỉ được đọc code. Em không kiểm env thật của herdr server trên máy này. Vì vậy việc pane thừa hưởng `CLAUDE_CODE_SESSION_ID` là có thể xảy ra, chưa đo.

No component-boundary change.

## 7. Câu hỏi cho anh

1. **Tên và chỗ để lineage.** Đề xuất: biến env `FGOS_PARENT_WRITER_ID`, và nếu muốn audit trong event thì thêm `payload.writer.parentId`. Chỉ biến env thì đủ cho 1c. Thêm vào event thì đổi schema `writer` trong io-contract. Em nghiêng về chỉ dùng biến env ở 1c, ghi vào event ở việc sau.
2. **Subagent in-process (#29).** Anh có muốn đường Agent tool (fanout) cũng có id riêng không? Muốn vậy thì skill phải tự đặt `FGOS_SESSION_ID` cho từng lệnh, vì fgOS không kiểm soát env của Agent tool. Nếu không làm, cần ghi rõ giới hạn: fanout in-process vẫn chung id.
3. **`releaseClaim` (E8)** mở item riêng ngay, hay gộp vào 1c? Em nghiêng về item riêng: nơi gọi khác (reclaim, unclaim) và cần quyết ai được nhả claim của người đã chết.
4. **Thứ tự `CODEX_THREAD_ID` và `CLAUDE_CODE_SESSION_ID`** khi cả hai cùng có (codex chạy trong shell của Claude, hoặc ngược lại). Em đề xuất `CODEX_THREAD_ID` đứng trước, vì nó là biến của tiến trình gần hơn. Nhưng chưa có bằng chứng thực tế.

## Phụ lục A — Code thí nghiệm

`child.mjs`:

```js
// S1 child: calls real fgOS production helpers against a scratch .fgos dir.
// usage: node child.mjs <fgosDir> <action> [args...]
const R = '/home/vantt/projects/forgentX/src';
const { resolveWriterIdentity } = await import(`${R}/util/session-identity.mjs`);
const lockMod = await import(`${R}/runner/main-checkout-lock.mjs`);
const rc = await import(`${R}/state/runtime-coordination.mjs`);
const store = await import(`${R}/state/store.mjs`);
const [dir, action, ...a] = process.argv.slice(2);
const who = process.env.S1_NAME || '?';
const out = (o) => console.log(JSON.stringify({ who, action, ...o }));
try {
  switch (action) {
    case 'whoami': out({ writer: resolveWriterIdentity(dir) }); break;
    case 'hook-lock': { // same call the pre-commit hook makes for a main-checkout commit
      const id = resolveWriterIdentity(dir).id;
      const r = lockMod.acquireMainCheckoutLock(dir, { identity: id, ttlMs: lockMod.HOOK_TTL_MS });
      out({ identity: id, status: r.status }); break; }
    case 'borrow-lock': { // the hook's HOLDER_PID_ENV_VAR branch
      const id = Number(process.env[lockMod.HOLDER_PID_ENV_VAR]);
      const r = lockMod.acquireMainCheckoutLock(dir, { identity: id, ttlMs: lockMod.HOOK_TTL_MS });
      out({ identity: id, ownPid: process.pid, status: r.status }); break; }
    case 'add': out({ seq: store.addWork(dir, { id: a[0], title: `s1 ${a[0]}`, status: 'todo', kind: 'task', deps: [], risk: 'light', refs: [], verify: 'true' }).seq }); break;
    case 'claim': {
      const c = rc.acquireClaim(dir, { id: a[0], actor: 'runner', preClaimStatus: 'todo' });
      out({ claimId: c.claimId, writerId: c.writerId }); break; }
    case 'settle': {
      const r = store.settleClaim(dir, { id: a[0], claimId: a[1], finalStatus: 'blocked', reason: 's1', role: 'runner' });
      out({ ok: true, seq: r?.event?.seq ?? null }); break; }
    case 'claim-rev': { // claim with preClaimRevision, as claim-port.mjs does
      const { rebuildViewFromDir } = await import(`${R}/state/replay.mjs`);
      const rev = rc.getItemDurableRevision(rebuildViewFromDir(dir), a[0]);
      const c = rc.acquireClaim(dir, { id: a[0], actor: 'session', preClaimStatus: 'todo', preClaimRevision: rev });
      out({ claimId: c.claimId, writerId: c.writerId }); break; }
    case 'edit': out({ seq: store.editWork(dir, { id: a[0], patch: { title: `edited by ${who}` } }).seq }); break;
    case 'release': out({ result: rc.releaseClaim(dir, { id: a[0] }) }); break;
    case 'read-claim': out({ claim: rc.readClaim(dir, a[0]) }); break;
    default: throw new Error(`unknown action ${action}`);
  }
} catch (err) { out({ ok: false, error: `${err.name}: ${err.message}` }); }
```

`borrow-parent.mjs`:

```js
// Parent acquires main-checkout.lock under its own pid (as merge.mjs does), then
// hands HOLDER_PID_ENV_VAR to TWO independent children at once (A4 bearer check).
import { execFileSync } from 'node:child_process';
const R = '/home/vantt/projects/forgentX/src';
const lockMod = await import(`${R}/runner/main-checkout-lock.mjs`);
const dir = process.argv[2];
const r = lockMod.acquireMainCheckoutLock(dir, { identity: process.pid, ttlMs: lockMod.DEFAULT_TTL_MS });
console.log(JSON.stringify({ who: 'parent', action: 'lock', identity: process.pid, status: r.status }));
for (const name of ['childA', 'childB']) {
  process.stdout.write(execFileSync(process.execPath, [new URL('./child.mjs', import.meta.url).pathname, dir, 'borrow-lock'], {
    env: { ...process.env, S1_NAME: name, [lockMod.HOLDER_PID_ENV_VAR]: String(process.pid) }, encoding: 'utf8' }));
}
// a sibling with its OWN identity (no borrowed pid) must be refused
process.stdout.write(execFileSync(process.execPath, [new URL('./child.mjs', import.meta.url).pathname, dir, 'hook-lock'], {
  env: { ...process.env, S1_NAME: 'siblingOwnId', FGOS_SESSION_ID: 'sib-own' }, encoding: 'utf8' }));
```

`run.sh`:

```bash
#!/usr/bin/env bash
# S1 driver. Every run uses a fresh scratch .fgos; parent CLI session vars are removed.
set -u
S=$(cd "$(dirname "$0")" && pwd); cd "$S"
C() { local name=$1 sid=$2; shift 2
  if [ "$sid" = "-" ]; then env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID -u CLAUDECODE S1_NAME=$name node child.mjs "$@"
  else env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u CLAUDECODE S1_NAME=$name FGOS_SESSION_ID=$sid node child.mjs "$@"; fi; }
fresh() { rm -rf "$S/$1"; mkdir -p "$S/$1/.fgos"; echo "$S/$1/.fgos"; }
claimid() { sed -n 's/.*"claimId":"\([^"]*\)".*/\1/p'; }

echo "## E1 shared FGOS_SESSION_ID=P: hook-style main-checkout lock"
D=$(fresh e1); C A P "$D" hook-lock; C B P "$D" hook-lock
echo "## E2 unique ids P.a / P.b: hook-style main-checkout lock"
D=$(fresh e2); C A P.a "$D" hook-lock; C B P.b "$D" hook-lock

echo "## E3 shared id: A claims, sibling B settles A's claim"
D=$(fresh e3); C P P "$D" add it3 >/dev/null; CL=$(C A P "$D" claim it3 | tee /dev/stderr | claimid); C B P "$D" settle it3 "$CL"
echo "## E4 unique ids: A claims, sibling B settles A's claim, then A settles"
D=$(fresh e4); C P P "$D" add it4 >/dev/null; CL=$(C A P.a "$D" claim it4 | tee /dev/stderr | claimid); C B P.b "$D" settle it4 "$CL"; C A P.a "$D" settle it4 "$CL"

echo "## E5 take->worker->return: parent P claims, child with unique id settles"
D=$(fresh e5); C P P "$D" add it5 >/dev/null; CL=$(C P P "$D" claim it5 | tee /dev/stderr | claimid); C child P.c1 "$D" settle it5 "$CL"; C P P "$D" settle it5 "$CL"

echo "## E6 stale attempt vs new claim (shared id): attempt1 claim, release, attempt2 claim; attempt1 settles attempt2's claim"
D=$(fresh e6); C P P "$D" add it6 >/dev/null; C att1 P "$D" claim it6 >/dev/null; C att1 P "$D" release it6 >/dev/null
CL2=$(C att2 P "$D" claim it6 | tee /dev/stderr | claimid); C att1 P "$D" settle it6 "$CL2"
echo "## E7 same as E6 with unique per-attempt ids"
D=$(fresh e7); C P P "$D" add it7 >/dev/null; C att1 P.att1 "$D" claim it7 >/dev/null; C att1 P.att1 "$D" release it7 >/dev/null
CL2=$(C att2 P.att2 "$D" claim it7 | tee /dev/stderr | claimid); C att1 P.att1 "$D" settle it7 "$CL2"; C att2 P.att2 "$D" settle it7 "$CL2"

echo "## E8 releaseClaim has no writer check: sibling B (unique id) releases A's live claim"
D=$(fresh e8); C P P "$D" add it8 >/dev/null; C A P.a "$D" claim it8 >/dev/null; C B P.b "$D" release it8 | cut -c1-160; C A P.a "$D" read-claim it8

echo "## E9 events attribution: shard files after writes"
D=$(fresh e9); C A P "$D" add s1 >/dev/null; C B P "$D" add s2 >/dev/null; C A2 P.a "$D" add u1 >/dev/null; C B2 P.b "$D" add u2 >/dev/null; ls "$D/events" | sed 's/-[0-9TZ]*\.jsonl$/-<ts>.jsonl/'

echo "## E10 HOLDER_PID_ENV_VAR delegation: one parent, two children borrow its pid"
D=$(fresh e10); env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID node borrow-parent.mjs "$D"

echo "## E11 resolver tiers today"
D=$(fresh e11)
env -u FGOS_SESSION_ID -u CODEX_THREAD_ID S1_NAME=claudeOnly CLAUDE_CODE_SESSION_ID=lead-claude-uuid node child.mjs "$D" whoami
env -u FGOS_SESSION_ID -u CLAUDE_CODE_SESSION_ID S1_NAME=codexOnly CODEX_THREAD_ID=codex-thread-1 node child.mjs "$D" whoami
env -u CODEX_THREAD_ID S1_NAME=both FGOS_SESSION_ID=child-own CLAUDE_CODE_SESSION_ID=lead-claude-uuid node child.mjs "$D" whoami
env -u FGOS_SESSION_ID -u CODEX_THREAD_ID S1_NAME=emptyFgos FGOS_SESSION_ID= CLAUDE_CODE_SESSION_ID=lead-claude-uuid node child.mjs "$D" whoami

echo "## E12 revision drift: holder claims with preClaimRevision, a worker edits the item, holder settles"
for mode in shared unique; do
  D=$(fresh e12-$mode); C P P "$D" add it12 >/dev/null; CL=$(C P P "$D" claim-rev it12 | claimid)
  if [ $mode = shared ]; then W=P; else W=P.w1; fi
  echo "# $mode (worker id $W)"; C worker $W "$D" edit it12; C P P "$D" settle it12 "$CL"
done
```

## Phụ lục B — Output

Claim id rút gọn thành `clm-<ms>-<hex>`.

```text
## E1 shared FGOS_SESSION_ID=P: hook-style main-checkout lock
{"who":"A","action":"hook-lock","identity":"P","status":"acquired"}
{"who":"B","action":"hook-lock","identity":"P","status":"acquired"}
## E2 unique ids P.a / P.b: hook-style main-checkout lock
{"who":"A","action":"hook-lock","identity":"P.a","status":"acquired"}
{"who":"B","action":"hook-lock","identity":"P.b","status":"held"}
## E3 shared id: A claims, sibling B settles A's claim
{"who":"A","action":"claim","claimId":"clm-<ms>-<hex>","writerId":"P"}
{"who":"B","action":"settle","ok":true,"seq":3}
## E4 unique ids: A claims, sibling B settles A's claim, then A settles
{"who":"A","action":"claim","claimId":"clm-<ms>-<hex>","writerId":"P.a"}
{"who":"B","action":"settle","ok":false,"error":"StoreError: settleClaim: writer identity mismatch for \"it4\" — claim acquired by writer \"P.a\", settling as writer \"P.b\"."}
{"who":"A","action":"settle","ok":true,"seq":2}
## E5 take->worker->return: parent P claims, child with unique id settles
{"who":"P","action":"claim","claimId":"clm-<ms>-<hex>","writerId":"P"}
{"who":"child","action":"settle","ok":false,"error":"StoreError: settleClaim: writer identity mismatch for \"it5\" — claim acquired by writer \"P\", settling as writer \"P.c1\"."}
{"who":"P","action":"settle","ok":true,"seq":3}
## E6 stale attempt vs new claim (shared id): attempt1 claim, release, attempt2 claim; attempt1 settles attempt2's claim
{"who":"att2","action":"claim","claimId":"clm-<ms>-<hex>","writerId":"P"}
{"who":"att1","action":"settle","ok":true,"seq":3}
## E7 same as E6 with unique per-attempt ids
{"who":"att2","action":"claim","claimId":"clm-<ms>-<hex>","writerId":"P.att2"}
{"who":"att1","action":"settle","ok":false,"error":"StoreError: settleClaim: writer identity mismatch for \"it7\" — claim acquired by writer \"P.att2\", settling as writer \"P.att1\"."}
{"who":"att2","action":"settle","ok":true,"seq":2}
## E8 releaseClaim has no writer check: sibling B (unique id) releases A's live claim
{"who":"B","action":"release","result":{"released":true,"claim":{"claimId":"clm-<ms>-<hex>","id":"it8","actor":"runner","writerId":"P.a","source":nu
{"who":"A","action":"read-claim","claim":null}
## E9 events attribution: shard files after writes
P-<ts>.jsonl
P.a-<ts>.jsonl
P.b-<ts>.jsonl
## E10 HOLDER_PID_ENV_VAR delegation: one parent, two children borrow its pid
{"who":"parent","action":"lock","identity":1846484,"status":"acquired"}
{"who":"childA","action":"borrow-lock","identity":1846484,"ownPid":1846491,"status":"acquired"}
{"who":"childB","action":"borrow-lock","identity":1846484,"ownPid":1846498,"status":"acquired"}
{"who":"siblingOwnId","action":"hook-lock","identity":"sib-own","status":"held"}
## E11 resolver tiers today
{"who":"claudeOnly","action":"whoami","writer":{"id":"lead-claude-uuid","source":"env"}}
{"who":"codexOnly","action":"whoami","writer":{"id":1087187,"source":"pid"}}
{"who":"both","action":"whoami","writer":{"id":"child-own","source":"env"}}
{"who":"emptyFgos","action":"whoami","writer":{"id":"lead-claude-uuid","source":"env"}}
## E12 revision drift: holder claims with preClaimRevision, a worker edits the item, holder settles
# shared (worker id P)
{"who":"worker","action":"edit"}
fgos: settleClaim reconciled a same-writer revision drift for "it12" (writer "P") -- preClaimRevision "5fdc4f6e1c6f37c4" -> "a59abe0290158852"
{"who":"P","action":"settle","ok":true,"seq":4}
# unique (worker id P.w1)
{"who":"worker","action":"edit"}
{"who":"P","action":"settle","ok":false,"error":"StoreError: settleClaim: item \"it12\" durable revision changed from \"5fdc4f6e1c6f37c4\" to \"c049069613090583\"."}
```
