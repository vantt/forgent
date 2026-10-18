---
title: "6.3 Cách khởi động terminal qua terminal-control + nửa launcher của identity (5.2)"
description: "Gate trong pane nhận lock attempt qua SCM_RIGHTS, supervisor canh round herdr theo attempt id qua terminal-control, agent-protocol interactive cho 5 CLI, supervisor mint writer id + scrub env + lineage cho cả hai cách, supervisor làm chủ home; xoá vòng poll/deadline/đóng pane của controller trong herdr-round.mjs và phần herdr của reaper tạm"
status: completed
priority: P1
effort: 64h
branch: plan/run-supervisor-6-2-6-3-6-4
tags: [run-supervisor, terminal, herdr, agent-protocol, session-identity, rust, cutover]
created: 2026-10-16
---

# Plan 6.3: cách `terminal` + nửa launcher của identity

- **Thực hiện thiết kế r6**: [design-261016-1238-...-v3-r6.md](../reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md) §8 (agent-protocol cách `terminal`), §9.2 cột `terminal`, §9.3 điểm 2, 3 (`--die-with-parent` chỉ ở `terminal`), 9, 10 và đoạn socket attempt (`SO_PEERCRED` chỉ uid, kongming M3), §9.6 bước `release-slot`, §9.8 (xoá phần reaper herdr), §9.11 (5.2), §7.3, §7.7 (ca lỗi terminal-control nhìn từ supervisor), §6.1.2 dòng "Gate trong pane nhận lock" và "Xác thực peer", §10, §11 entry 6.3, §12.3, §15 (nhánh mồ côi). Phản biện [kongming vòng 3](../reports/red-team-kongming-261016-1018-lock-and-run-supervisor-foundation-v3-r3-review.md) câu mở 1, 2 (cha của bwrap trong pane, `TIOCSCTTY`/`tcsetpgrp` trong namespace) và N5.
- **Vai trò (hội đồng, anh quyết 2026-10-15)**: [kết luận hội đồng](../reports/architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md) dòng 164: supervisor không biết pane, gọi terminal-control theo attempt id; bên điều phối cấp slot (`allocate`); home thuộc supervisor; agent-protocol theo CLI × cách khởi động cạnh supervisor.
- **Xây trên** (không định nghĩa lại): [6.2](../261016-1351-run-supervisor-rust-core-direct-mode/plan.md) (envelope v3, GO, gate, supervise, step runner, adopt, cổng chứa, crate agent-protocol, `bwrap.mjs` đã có `--die-with-parent`/`--bind` socket cho `terminal`); [6.5 terminal-control](../261016-1306-terminal-control-rust-core-herdr-driver/plan.md) (crate `fgos-terminal-control`, cổng theo key, client Node + hàng theo `groupKey`, mọi lời gọi herdr đã qua một cửa); [5.1 identity](../261015-2102-identity-resolver-rust-crate/plan.md) (crate `fgos-session-identity`, thứ tự env O2). Spike [S1](../reports/spike-s1-261015-1818-writer-id-consumer-inventory.md) (launcher phải đặt id khác rỗng; `workerBaseEnv` phải bỏ ba biến; id từ `launchCommandId` để resume ra cùng id), [S7](../reports/spike-s7-261015-1859-human-opened-pane-identity-observation.md) (codex chạy lệnh dưới daemon `codex app-server` dùng chung), [S2](../reports/spike-s2-261015-1818-reaper-fence-acceptance-tests.md), [T8](../reports/spike-t8-261015-1841-controller-crash-during-herdr-and-cli-runs.md) hB/hC/hD.
- **Quyết định của anh áp vào đây:** một người dùng, không tương thích ngược, cutover dừng-toàn-bộ xoá đường cũ cùng phase; Rust-first; đa nền tảng qua cổng (Windows: cách `terminal` `unsupported` tới khi herdr có bản Windows, `direct` không ảnh hưởng); chỉ `--resume` tường minh; không work item; song song hoá.
- Impact-analysis: GitNexus có mặt, index cũ; executor chạy `analyze` rồi `impact` trên `runHerdrRound`, `driveRound`, `pollForOutcome`, `settleRound`, `herdrSpawnAdapter`, `reapOrphanedConfinementResources`, `workerBaseEnv` trước khi sửa (dự kiến HIGH với `herdr-round.mjs`).
- Component boundary: **có đổi nhỏ** (launch gate có nửa trong pane; session-identity có hàm mint dùng bởi supervisor). P08 cập nhật [`component-boundary.md`](../../docs/platform/component-boundary.md).

## CẮT LẠI 2026-10-18

Block này thắng mọi dòng cũ trong plan và phase file. Đối chiếu với main sau khi 6.2 (supervisor direct, D-ADR0056) và 6.5 (terminal-control) đã land.

**Tiền đề đã đủ:** 6.2 (crate `run-supervisor`, `agent-protocol`, cổng chứa, route `internal supervise|gate|adopt|attempt-step`, `src/run-supervisor/sweep.mjs`, marker v2); 6.5 (`packages/terminal-control`, route `internal terminal-control`, client Node `src/terminal-control/client.mjs`); `withDefaultExecutor`; hot-lock 4.3. Gate và supervisor đã chạy trên Windows/macOS cho `direct`; `terminal` trên Windows vẫn `unsupported`.

**Đã có sẵn trên main (phase chỉ bổ sung, không định nghĩa lại):**
- `envelope.v3.json` đã có `mode: terminal`, `slot {key}`, bước `release-slot`; `gate-go.v1.json` đã mô tả đường `terminal` (`BRIEF_DELIVERED`, EOF trước/sau); `receipt.v1.json` đã có `carrier-lost`. `gate.rs` đã parse `--go-socket` (kèm `go_pipe.rs`); `bwrap.mjs` đã có `--die-with-parent` + bind socket cho `terminal`.
- `agent-protocol` mới có `port.rs` (`AgentIo`: send/read/activity), `outcome.rs`, fixtures `direct/`; chưa có `terminal/`, chưa có `inspect` trong `AgentIo`.
- Chưa có: `mint_attempt_writer_id`, route `internal identity`, `tools/terminal-gate-probe`, `src/run-supervisor/steps/cleanup-trust.mjs`.
- `killPaneForegroundAndClose` đã không còn trong `src/`; mọi ký hiệu xoá khác ở tiêu chí 6 còn nguyên (`pollForOutcome`, `settleRound`, `concludeFailure`, `livenessProbe`, `startAgent`, `PASTE_CHIP_RE`, `bindOwnershipMarker`, `defaultPaneOpen`, `bindingForPrepared`, `reapOrphanedConfinementResources`). `reapOrphanedConfinementResources` còn caller ở `sweep.mjs` và `registrations.mjs`: P07 chuyển hết sang adopt.
- `FGOS_SESSION_ID` còn đặt ở `transport.mjs:396` và `authority.mjs:1422` (số dòng đã đổi so với phase file).

**Delta theo phase:**
- **P00:** chỉ thêm phần còn thiếu: `terminal:{socketPath, exitCommand, orphanSettleMs}`, `slot.groupKey`, `identity{writerId, parentWriterId}` vào envelope; `attempt-writer-id.v1.json` + vector; `terminal-outcomes.v1.json`; `inspect` vào contract AgentIo. Bỏ phần receipt/GO đã có. Cập nhật contract test hiện có `test/run-supervisor/contracts.test.mjs` thay vì chỉ tạo file mới.
- **P01:** không đổi. Dùng `terminal-control` (6.5) mở pane thay vì gọi herdr thô; tab riêng.
- **P02:** gate đã có `--go-socket`/`go_pipe.rs`: việc thật là nhánh peer uid, `SCM_RIGHTS`, tty foreground, mồ côi. Giữ nguyên chủ file `gate.rs`, `go_channel.rs`, `go_pipe.rs`.
- **P03:** gọi `fgos-terminal-control` in-process; chủ `supervise.rs`, `steps.rs`; `release-slot` là bước builtin trong envelope đã khai. Adopt (`adopt.rs`) dùng cùng bước.
- **P04:** thêm `terminal/` vào crate `agent-protocol`; mở rộng `AgentIo` có `inspect`. Đọc logic nguồn ở HEAD của `herdr-round.mjs`, số dòng trong phase file chỉ để tham khảo.
- **P05:** route `internal identity mint-attempt` đăng ký theo bảng route hiện tại của host (`apps/fgos/src/main.rs` đi qua `internal`), không còn tranh `main.rs` với 6.2. `workerBaseEnv` ở `adapters.mjs`; hai chỗ đặt `FGOS_SESSION_ID` nêu ở trên.
- **P06:** `herdr-round.mjs` vẫn là chủ duy nhất; mọi lời gọi herdr đã đi qua `src/terminal-control/client.mjs`, nên xoá vòng canh chỉ còn gỡ logic, không đổi IO. Đường `direct` của 6.2 là mẫu cho prepare+giao.
- **P07:** thêm: gỡ caller `reapOrphanedConfinementResources` ở `sweep.mjs` và `registrations.mjs`.
- **P08:** `registrations.mjs` đã đổi sang `sweepAttempts` ở 6.2; chỉ kiểm lại sau P07.
- **P09 phần A:** review độc lập chạy trên Sonnet (owner 10-17: không Opus/Fable cho review code).

**Thứ tự chạy (thay thứ tự merge cũ):** P00 → P01 → P02 → P04 → P05 → P03 → P06 → P07 → P08 → P09 phần A. Chuỗi lead chạy tuần tự một phase một lúc; P03 sau P04 và P02 vì nghiệm thu cần cả hai; P08 sau P07. Thứ tự không phải đổi so với hàng đợi của brief. Windows/macOS CI: workflow `process-containment.yml` chạy khi push nhánh `terminal-mode/**`.

**Hai sửa đã làm cùng phase này (P00r):** gate đọc được envelope khi run dir/gate nằm dưới `/tmp` (bwrap bind lại, test bwrap thật); `FGOS_HOST_BIN` trỏ file không chạy được là lỗi, không rơi sang activation.

## Prior art (đã kiểm `git log -G`)

| Thứ bị thay | Vào ở | Ghi chú |
|---|---|---|
| `pollForOutcome` ([`herdr-round.mjs:1186`](../../src/runner/dispatch/herdr-round.mjs)), `settleRound` (`:1404`), `concludeFailure` (`:1360`), `killPaneForegroundAndClose` (`:319`), `cleanupIfWorkerStillLive` (`:344`), `livenessProbe` (`:1158`) | `9f43e4b4b` (2026-09-07, "make the herdr round readable"), `d8b99fb44` (2026-09-14), `8afab86ec` | Deadline/kết quả/đóng pane nằm trong controller: T8 hB/hC/hD mất hết khi controller chết. Chuyển sang supervisor + gate |
| `awaitPromptReady` (`:974`), `deliverBrief` (`:871`), `submitBrief` (`:854`), `confirmBriefSubmitted` (`:1092`), `isDraftStillInComposer` (`:1052`), `PASTE_CHIP_RE` (`:1040`), `VISIBLE_WORKING_TAIL_RE` (`:1043`), `ensureHerdrKnowsAgent` (`:942`), `refuseBriefIntoUnreadyPane` (`:1024`), `MAX_RESENDS` (`:400`), `startAgent` (`:798`) | cùng các commit trên | **Tái dùng nguyên logic và regex**, dời vào adapter Rust (P04); test hiện có ([`herdr-spawn-adapter.test.mjs`](../../test/runner/herdr-spawn-adapter.test.mjs)) thành vector |
| `buildLauncherScriptContent` (`:98`, `exec -a`) + `verifyForegroundProcessArgv` (`:128`) | — | Launcher `exec` lệnh: cha của lệnh là shell của pane. Ở 6.3 launcher `exec` bwrap → gate (đo ở P01) |
| Bản vá reaper tạm cho herdr: `bindOwnershipMarker`, `markOwnershipLaunched`, `LAUNCH_GRACE_MS`, `OWNERSHIP_BINDING_FIELDS` ([`cleanup.mjs:138-180`](../../src/runner/dispatch/confinement/cleanup.mjs)), `defaultPaneOpen`/`paneOpenUnlessClosed` (`:403`, `:434`), call `binding.bind` ([`herdr-round.mjs:1900`](../../src/runner/dispatch/herdr-round.mjs)), [`bwrap.mjs:572-575`](../../src/runner/dispatch/confinement/drivers/bwrap.mjs), `herdrEndpointForEnv`/`envForEndpoint` ([`worker-session.mjs:84,97`](../../src/runner/dispatch/worker-session.mjs)), `bindingForPrepared` ([`authority.mjs:1772`](../../src/runner/dispatch/confinement/authority.mjs)) + phần bỏ qua trường binding khi so digest (`:1849-1852`) | `6ce17f136` (6.0) | Đã ghi "vá tạm, 6.3 xoá" (r6 §11/6.0) |
| Inject `FGOS_SESSION_ID = id của dispatcher` ([`transport.mjs:553`](../../src/runner/dispatch/transport.mjs), [`authority.mjs:1408-1415`](../../src/runner/dispatch/confinement/authority.mjs)) | `13bdf7392` (2026-09-22) | S1 #2, #3: đổi thành id của attempt |
| `RECOGNIZED_EVIDENCE_TYPES` không gồm outbox ([`recovery-planner.mjs:36`](../../src/runner/dispatch/recovery-planner.mjs)) → park vì `result-1.json` | — | Nhánh reconcile herdr park: xoá ở đây (đường herdr đi qua adopt); `recover` qua adopt là 6.4 |

## Lead tự quyết

| # | Quyết định | Lý do |
|---|---|---|
| D1 | Supervisor gọi terminal-control **in-process** qua crate `fgos-terminal-control` (cùng binary host), không qua route; `allocate` vẫn do controller gọi qua client Node có hàng `groupKey` (6.5 P05) | r6 §7.6: bên điều phối cấp slot; supervisor chỉ gọi theo key. In-process tránh một process mỗi lần `read` trong vòng canh |
| D2 | `release-slot` là bước **Rust có sẵn** trong step runner (`builtin:release-slot`), không phải lệnh Node | terminal-control đã Rust; không cần đi qua payload Node |
| D3 | Đua `release(close)` của supervisor (process khác) với `allocate` tách trên chính pane đó của controller: không thêm lock. Core 6.5 đã xử lý neo chết → tab mới cùng nhãn (r6 §7.4.3); test ở P06 khẳng định không pane nào bị tách từ pane đã đóng mà lỗi lọt ra | Hàng promise của 6.5 chỉ trong một process; khe này cho kết quả vô hại (tab mới cùng nhãn). Trigger S5 → kind `terminal-placement` (r6 §7.6) |
| D4 | Writer id của attempt = `mint_attempt_writer_id(attemptId)` trong crate `fgos-session-identity` = chuỗi xác định `att-<attemptId>`; lineage `FGOS_PARENT_WRITER_ID` = writer id của controller (tên theo S1 #2) | S1: xác định để resume ra cùng id và cùng `envDigest`; tên biến S1 đề xuất |
| D5 | Scrub env thi hành ở **gate** (`env_clear` + env tường minh), không chỉ ở supervisor: pane herdr thừa hưởng env của herdr server, `--env` không xoá được biến server có sẵn (S1 #5) | Chỗ duy nhất thật sự `exec` agent là gate |
| D6 | Thứ tự `exec` trong pane: launcher script `exec bwrap … --die-with-parent … -- <hostBin> internal gate --go-socket <p>`; cha của bwrap là shell của pane. Nếu P01 đo thấy `tcsetpgrp` cần gate là session leader, đổi launcher thành `exec setsid -c …` theo kết quả đo, không đoán trước | Kongming câu mở 1, 2: phải đo |
| D7 | Brief gửi bằng `send` của terminal-control theo adapter (paste/ký tự/file pointer như `briefMessage` [`:840`](../../src/runner/dispatch/herdr-round.mjs)); trong lúc supervisor chết trước `BRIEF_DELIVERED`, gate kết thúc miền (`abandoned-before-brief`) | r6 §9.3 điểm 9; §15 chọn nhánh mồ côi |
| D8 | Windows: supervisor chọn `terminal` khi driver terminal-control trả `unsupported` → từ chối có tên `terminal-mode-unsupported` (không tự đổi sang `direct`) | 6.5 đã khai Windows `unsupported`; đổi cách khởi động là quyết định của executor/bind, không phải supervisor |

## Phạm vi

Trong 6.3: route gate cách `terminal` (socket unix, `SO_PEERCRED` uid, `SCM_RIGHTS` + `MSG_CMSG_CLOEXEC`, tty foreground, nhánh mồ côi); supervisor cách `terminal` (socket attempt, `terminal-control.launch/send/read/inspect`, `carrier-lost`, bước `release-slot`); adapter agent-protocol `terminal` cho 5 CLI; mint writer id + scrub + lineage cho cả hai cách; supervisor làm chủ home herdr (marker bản 2); cutover `herdr-spawn`; xoá vòng poll/deadline/đóng pane của controller và phần reaper herdr; S2 viết lại; doctor/docs/CHANGELOG; landing.

Ngoài: `inspect` "unit chờ resume", `--resume`/`recover` qua adopt, Ctrl-C → `cancel` (6.4); herdr trên Windows; tmux driver.

## Phase và phụ thuộc

Tiền đề: **6.2 và 6.5 đã land**; 5.1 đã land.

| Phase | Nội dung | Phụ thuộc | Wave | Giờ |
|---|---|---|---|---|
| [00](phase-00-contracts-terminal-and-identity.md) | Contract: envelope `terminal`, khung GO qua socket, mint id, lineage | 6.2, 6.5 landed | 0 | 2 |
| [01](phase-01-pane-tty-and-env-measurements.md) | Đo trên herdr thật: cha của bwrap, tty trong namespace, `SCM_RIGHTS` qua bind, env codex daemon, ghi outbox | 00 | 1 | 4 |
| [02](phase-02-gate-terminal-mode.md) | Gate cách `terminal` | 00; 01 (tty) | 1 | 7 |
| [03](phase-03-supervisor-terminal-mode.md) | Supervisor cách `terminal` + `release-slot` | 00; 02, 04 (nghiệm thu) | 1 | 8 |
| [04](phase-04-agent-protocol-terminal-adapters.md) | Adapter `terminal` 5 CLI | 00 | 1 | 8 |
| [05](phase-05-launcher-identity-mint-scrub.md) | Mint writer id, scrub, lineage (Rust + Node) | 00 | 1 | 5 |
| [06](phase-06-cutover-herdr-spawn.md) | Cutover `herdr-spawn`; xoá vòng controller trong `herdr-round.mjs` | 01–05 | 2 | 14 |
| [07](phase-07-remove-herdr-reaper-patch.md) | Xoá phần reaper herdr + S2 viết lại | 00; 06 (nghiệm thu) | 2 | 6 |
| [08](phase-08-doctor-docs-changelog.md) | Doctor, spec, io-contract, boundary, CHANGELOG | 00 (docs); 06 (check) | 1–2 | 4 |
| [09](phase-09-integration-real-herdr-landing.md) | Tích hợp, T8 herdr chạy lại, 5 CLI thật, landing | 00–08 | 3 | 6 (Lead) |

```text
wave 0: P00
wave 1: P01 ∥ P02 ∥ P03 ∥ P04 ∥ P05 ∥ P08(docs)
        (P02 chốt phần tty sau báo cáo P01; P03 nghiệm thu cần P02, P04)
wave 2: P06 ∥ P07 ∥ P08(check)      (P06, P07 khác file; nghiệm thu P07 sau P06)
wave 3: P09 (Lead)
```

Nhánh tích hợp `terminal-mode/integration` (worktree `.claude/worktrees/tm-integration`); phase `terminal-mode/pNN-<slug>`, worktree `.claude/worktrees/tm-pNN`. Thứ tự merge: P00 → P01 → P04 → P05 → P02 → P03 → P08 (docs) → P06 → P07 → P08 (check). Chủ file: contract, `Cargo.lock` → P00; `packages/run-supervisor/rust/src/gate.rs` → P02; `supervise.rs`, `steps.rs` → P03; `packages/session-identity/**`, `adapters.mjs` (`workerBaseEnv`) → P05; `herdr-round.mjs`, `transport.mjs`, `herdr-reconcile.mjs`, `recovery-planner.mjs`, `assignment-runner.mjs` → P06; `confinement/cleanup.mjs`, `bwrap.mjs`, `worker-session.mjs`, `authority.mjs`, `dispatch/cli.mjs` → P07; `registrations.mjs`, `checks.test.mjs`, `CHANGELOG.md`, docs → P08. Không ai sửa `bin/fgos.mjs`, `test/test-ownership.mjs`.

## Data flow

```text
controller (Node): LockScope attempt(15)[+cwd(30)] → prepare (marker v2) → client.allocate(key=attemptId, groupKey) (hàng 6.5)
  → envelope v3 {mode: terminal, slot.key, socketPath, steps:[settle-attempt, finalize-home, builtin:release-slot]}
  → spawn supervise (fd3, fd4) → chờ binding → đóng fd → chỉ đọc file
supervise (Rust): listen socketPath (runtime dir 0700, tên băm) → mint writer id → terminal-control.launch(key, spec)
     spec = launcher: exec bwrap --unshare-pid --as-pid-1 --die-with-parent --bind <sockdir> … -- hostBin internal gate --go-socket <p>
  → accept: SO_PEERCRED uid → HELLO{attemptId} → declare_domain → GO{attemptId, digest} + SCM_RIGHTS(fd attempt, fd cwd)
  → AGENT{tuple} → agent-protocol interactive qua AgentIo = terminal-control.send/read/inspect(activity)
       ready → deliver brief → confirm → BRIEF_DELIVERED → canh (deadline mềm, idle, inspect: gone/incarnation lệch → carrier-lost)
       completed → lệnh thoát (vd. /exit) → gate-exit → receipt → bước → release-slot(close|retain)
gate (trong pane, pid 1 namespace): CLOEXEC → tty foreground cho group agent → env_clear + env (FGOS_SESSION_ID=att-…, FGOS_PARENT_WRITER_ID) → agent
  supervisor EOF trước BRIEF_DELIVERED → kết thúc miền (abandoned-before-brief); sau → chờ outbox + khoảng ngắn → kết thúc miền
```

## Tiêu chí xong

1. `cargo test -p fgos-run-supervisor -p fgos-agent-protocol -p fgos-session-identity -p fgos` xanh; vector `terminal` 5 CLI xanh trên fixture màn hình thật.
2. 12.3 thành test trên herdr thật: supervisor SIGKILL sau GO → người lạ không lock được khi gate còn chạy, agent chạy xong; gate khởi động sau khi supervisor chết → `connect` bị từ chối, agent không chạy; supervisor chết khi gate chờ GO → EOF, agent không chạy; supervisor chết trước `BRIEF_DELIVERED` → miền bị kết thúc.
3. T8 herdr chạy lại (hB, hC, hD) với claude thật: controller chết → deadline thi hành (hD dừng ở 2 phút), settle đủ `result.json`/`exit.json`/receipt, pane được `release`, home **không** bị xoá khi agent còn sống, không pane mồ côi.
4. S2 viết lại theo luật mới: không còn ca đỏ, không ca todo (ca nào không còn nghĩa thì xoá kèm lý do trong báo cáo).
5. Agent của cả hai cách thấy `FGOS_SESSION_ID=att-<attemptId>`, không có `CLAUDE_CODE_SESSION_ID`/`CODEX_THREAD_ID` của cha, có `FGOS_PARENT_WRITER_ID`; lệnh do codex chạy (qua daemon) thấy id của attempt hoặc báo rõ giới hạn (P01 đo, D-ADR ghi lại).
6. `rg 'pollForOutcome|killPaneForegroundAndClose|settleRound|concludeFailure|bindOwnershipMarker|markOwnershipLaunched|LAUNCH_GRACE_MS|OWNERSHIP_BINDING_FIELDS|defaultPaneOpen|paneOpenUnlessClosed|bindingForPrepared|PASTE_CHIP_RE|awaitPromptReady' src` rỗng; `reapOrphanedConfinementResources` không còn (mọi home đi qua adopt).
7. Full `npm test` xanh trên nhánh tích hợp (`env -u …`, `FGOS_HOST_BIN=<build>`); 5 CLI qua `fgos run` herdr thật settle đủ; doctor xanh ở ba workspace sau landing.

## Rủi ro chính

| Rủi ro | Khả năng × tác động | Giảm thiểu |
|---|---|---|
| `TIOCSCTTY`/`tcsetpgrp` từ trong PID namespace thất bại (kongming câu 2) → CLI interactive không nhận phím | TB × Cao | P01 đo trước; D6 chọn chuỗi `exec` theo số đo; nếu không làm được foreground trong namespace → báo anh (câu hỏi mở 1) |
| Port logic chờ/regex của 5 CLI sang Rust lệch hành vi | TB × Cao | Vector từ fixture màn hình thật + test Node hiện có chuyển thành vector; nghiệm thu 5 CLI thật ở P09 |
| `herdr-round.mjs` (2295 dòng) viết lại lần hai sau 6.5 P06 | Cao × TB | P06 một chủ; phần còn lại ở Node chỉ là chuẩn bị + giao; rollback revert P06+P07 |
| Codex chạy lệnh dưới daemon dùng chung (S7) → env attempt không tới lệnh của codex | Cao × TB | P01 đo; nếu không tới: writer id của lệnh codex rơi về `CODEX_THREAD_ID` (khác nhau giữa pane, S7 #4) — chấp nhận, ghi giới hạn trong io-contract |
| Outbox ghi nhiều bước, gate thấy file trước khi agent ghi xong (r6 §15) | Thấp × TB | P01 đo cách CLI ghi `result-N.json`; publish bằng rename thì an toàn; không thì nhánh mồ côi chờ thêm `orphanSettleMs`, hoặc quay về fail-stop cho `terminal` theo §15 |

## Rollback

Dừng toàn bộ; chạy `adopt --scan` bằng release 6.3 tới khi sạch; revert merge, activate release 6.2. Pane đang mở của run 6.3 không bị đóng bởi release cũ (record của terminal-control giữ nguyên). Marker home bản 2 của herdr: release 6.2 đã hiểu bản 2 (adopt), nên không mất home.

## Câu hỏi mở cho anh

1. **Đã chốt 2026-10-16:** giữ mặc định, nhưng P01 phải báo số đo cho controller trước khi chọn. Nếu P01 đo thấy không đặt được foreground tty cho agent khi gate ở trong PID namespace: **mặc định** gate ra ngoài namespace ở cách `terminal` (gate là cha của bwrap, miền chứa bằng bwrap `--die-with-parent` + subreaper, mức `best-effort` ở `terminal`), báo mức đó ở doctor. Phương án khác: giữ pid namespace và cho agent chạy không foreground (một số CLI không nhận phím). Em sẽ báo số đo trước khi chọn.
2. **Đã chốt 2026-10-16:** giữ mặc định. (D4) Tiền tố `att-` cho writer id của attempt. **Mặc định:** `att-<attemptId>`. Có ràng buộc định dạng nào trong `docs/io-contract.md` mà anh muốn khác thì đổi ở P00.
