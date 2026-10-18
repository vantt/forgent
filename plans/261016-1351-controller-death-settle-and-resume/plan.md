---
title: "6.4 Hoàn tất khi controller chết: settle, --resume nhận kết quả, dọn attempt kẹt"
description: "Unit có controller chết hiện 'attempt đã settle, unit chờ resume'; chỉ --resume tường minh đi tiếp và dùng kết quả attempt cũ qua cửa adopt, không chạy lại; Ctrl-C gửi cancel cho supervisor; recover qua adopt; dọn attempt running kẹt; chạy lại các kịch bản spike T8 làm nghiệm thu"
status: pending
priority: P1
effort: 34h
branch: plan/run-supervisor-6-2-6-3-6-4
tags: [run-supervisor, adopt, resume, recover, controller-death, t8]
created: 2026-10-16
---

# Plan 6.4: hoàn tất khi controller chết và `--resume` nhận kết quả

- **Thực hiện thiết kế r6**: [design-261016-1238-...-v3-r6.md](../reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md) §9.6 (bước sau receipt; "unit có controller chết hiện `attempt settled, unit chờ resume`"), §9.7 điểm 5 (`--resume` dùng attempt đã settle, không chạy lại; `supersedesRunId` chỉ khi launch mới), điểm 7 (`recover` không park vì `result-N.json`), §10, §11 entry 6.4, **§16 quyết định của anh** (chỉ `--resume` tường minh; Ctrl-C gửi `cancel`; không tự đi tiếp), §11 "Việc hoãn có tên" (tự resume: làm sau; lease cwd giữa attempt xong và commit `writes`: 6.4 hoặc item riêng).
- **Spike nghiệm thu**: [T8](../reports/spike-t8-261015-1841-controller-crash-during-herdr-and-cli-runs.md) tám ca hA–hD, cA–cD chạy lại; câu hỏi mở T8 §8 số 4, 5 được trả lời ở đây.
- **Xây trên** (không định nghĩa lại): [6.2](../261016-1351-run-supervisor-rust-core-direct-mode/plan.md) (cửa adopt Rust + client Node `adoptRun/adoptScan`, `cancel-requested.json` đã có trong contract và supervisor đã đọc nó, check `run-attempts-stuck`, `sweepAttempts`); [6.3](../261016-1351-terminal-mode-and-launcher-identity/plan.md) (`release-slot` cho `terminal`, herdr qua supervisor); [4.2](../261016-1104-holder-lock-kernel-lock-foundation/plan.md) P10 (guard resume ở [`run.mjs:345-362`](../../src/runner/execution/run.mjs) đã sang kernel lock).
- **Quyết định của anh áp vào đây:** chỉ `--resume` tường minh (r6 §16, **giữ ghi chú**: tự resume là việc hoãn có tên, làm khi supervisor và holder-lock đã ổn định; cần phát hiện controller chết và single-taker); một người dùng, không tương thích ngược; không work item; song song hoá.
- Impact-analysis: GitNexus có mặt, index cũ; executor `analyze` rồi `impact` trên `runUnit`, `recoverApplyUseCase`, `recoverObserveUseCase`, `inspectDispatchRuntime`, `showRunUseCase` trước khi sửa.
- Component boundary: **không đổi** (chỉ dùng cửa adopt đã có). Ghi `No component-boundary change` trong báo cáo landing.

## Prior art (đã kiểm)

| Thứ | Ở đâu | Ghi chú |
|---|---|---|
| `--resume` chạy lại từ đầu | [`run.mjs:329-372`](../../src/runner/execution/run.mjs), T8 §4.4 (`runs/02` mới, `supersedesRunId: null`) | Đường resume hiện có đã có "commit lại mà không spawn agent" (`commitPending` [`run.mjs:168`](../../src/runner/execution/run.mjs)): **tái dùng** đúng mẫu đó cho attempt đã settle |
| `recover` park vì `result-1.json` | [`recovery-planner.mjs:36`](../../src/runner/dispatch/recovery-planner.mjs) `RECOGNIZED_EVIDENCE_TYPES`, [`:89-93`](../../src/runner/dispatch/recovery-planner.mjs); door [`src/verbs/dispatch/recover.mjs`](../../src/verbs/dispatch/recover.mjs) | CAS-guarded door giữ (recommendation + `actionKey`); thêm hành động `adopt` |
| Controller không bắt SIGINT/SIGTERM trên đường `run` | T8 §3 (chỉ [`main-checkout-lock.mjs:470-471`](../../src/runner/main-checkout-lock.mjs) có, nay thuộc 4.3) | Thêm handler mới, không có tiền lệ bị gỡ |
| Attempt kẹt `running/bound` | T8 §4.4 (6 attempt), [`runtime-inspection.mjs:261`](../../src/runner/dispatch/runtime-inspection.mjs) `inspectDispatchRuntime` | Run cũ (trước 6.2) không có `attempt.lock`; adopt trả `legacy-run` (6.2 D10) |

## Lead tự quyết

| # | Quyết định | Lý do |
|---|---|---|
| D1 | Ctrl-C lần một: controller ghi `cancel-requested.json` cho mọi attempt nó đang giao, chờ receipt tối đa `dispatch.cancelWaitMs` (mặc định = `gateKillGraceMs` + 5000), rồi thoát mã 130 (SIGINT) / 143 (SIGTERM) sau khi in `unit chờ resume`. Ctrl-C lần hai: thoát ngay (cancel đã ghi, supervisor vẫn dừng attempt) | r6 §16: Ctrl-C gửi `cancel`; người bấm hai lần không phải đợi |
| D2 | `--resume` gọi `adoptRun` cho attempt cuối của mỗi vai/vòng **trước** mọi thứ khác: `closed` + settled → dùng `result.json` làm kết quả, đi tiếp các bước của unit (commit `writes`, reviewer, attempt kế, `unit-summary.json`); `running`/`being-adopted` → từ chối có tên `attempt-still-running` (in trạng thái, không chờ); `abandoned-not-started` → launch attempt mới với `supersedesRunId` | r6 §9.7 điểm 5; một người dùng nên từ chối rõ tốt hơn chờ mù |
| D3 | Attempt cũ trước 6.2 (`legacy-run`) kẹt `running/bound`: một check doctor `legacy-attempts-stuck` + fix: chỉ khi **mọi** pid ghi trong run (controller, supervisor Node cũ, worker binding) `judge == dead` **và** không còn home bản 1 trỏ tới run đó → settle `abandoned-legacy` qua cửa recover CAS hiện có; còn lại (alive/unknown) → giữ, báo | "Không rõ = giữ" (r6 §3); xoá được 6 attempt của T8 mà không đoán |
| D4 | `inspect` (`dispatch inspect`, `dispatch show-run`, `fgos run --json` khi controller trở lại) có trường `unitState: awaiting-resume` khi attempt cuối `closed` mà `unit-summary.json` chưa có, và `attemptState` từ adopt (`running`, `being-adopted`, `closed`, `legacy-run`) | r6 §9.6 câu cuối; người nhìn biết phải gõ gì |
| D5 | Lease cwd trong khe "attempt xong → runner commit `writes`" (kongming N7) **không** làm ở 6.4 | Không nằm trong phạm vi anh liệt kê; hôm nay đã vậy, v3 không tệ hơn (r6 §11). Câu hỏi mở 1 |
| D6 | Hai `--resume` cùng unit cùng lúc: thư mục attempt mới tạo bằng `mkdir` độc quyền (`runs/NN`); người thứ hai gặp `EEXIST` → từ chối `resume-in-progress` | Không thêm lock; tận dụng tính độc quyền của `mkdir` |

## Phạm vi

Trong 6.4: handler SIGINT/SIGTERM của controller → `cancel`; `--resume` qua adopt (dùng kết quả cũ, không chạy lại); `dispatch recover` qua adopt (không park vì outbox); `inspect`/`show-run` hiện `awaiting-resume`; dọn attempt `running` kẹt (mới qua adopt, cũ qua D3); test crash từng dòng ma trận 9.7 + hai adopter + resume sau adopt; T8 chạy lại; doctor/docs/CHANGELOG; landing.

Ngoài: tự resume (hoãn có tên, giữ ghi chú); lease cwd tới commit `writes` (D5).

## Phase và phụ thuộc

Tiền đề: **6.2 và 6.3 đã land**.

| Phase | Nội dung | Phụ thuộc | Wave | Giờ |
|---|---|---|---|---|
| [00](phase-00-contracts-unit-state.md) | Contract `unitState`, `attemptState`, mã thoát Ctrl-C, khoá `dispatch.cancelWaitMs` | 6.2, 6.3 landed | 0 | 1 |
| [01](phase-01-controller-cancel-on-signal.md) | SIGINT/SIGTERM → `cancel` | 00 | 1 | 4 |
| [02](phase-02-resume-adopts.md) | `--resume` qua adopt | 00 | 1 | 7 |
| [03](phase-03-inspect-and-recover-via-adopt.md) | `inspect`/`show-run` + `recover` qua adopt | 00 | 1 | 5 |
| [04](phase-04-stuck-attempts-cleanup.md) | Dọn attempt kẹt (mới + cũ) | 00 | 1 | 4 |
| [05](phase-05-crash-matrix-tests.md) | Test crash ma trận 9.7, hai adopter, resume sau adopt | 00; 01–04 (nghiệm thu) | 1–2 | 6 |
| [06](phase-06-doctor-docs-changelog.md) | Doctor, spec, intent ledger, CHANGELOG | 00 (docs); 04 (check) | 1–2 | 3 |
| [07](phase-07-t8-rerun-integration-landing.md) | Tích hợp, T8 chạy lại, landing | 00–06 | 3 | 4 (Lead) |

```text
wave 0: P00
wave 1: P01 ∥ P02 ∥ P03 ∥ P04 ∥ P05(viết test đỏ) ∥ P06(docs)
wave 2: P05(xanh sau khi 01–04 merge) ∥ P06(check)
wave 3: P07 (Lead)
```

Nhánh tích hợp `controller-death/integration` (worktree `.claude/worktrees/cd-integration`); phase `controller-death/pNN-<slug>`, worktree `.claude/worktrees/cd-pNN`. Thứ tự merge: P00 → P03 → P04 → P01 → P02 → P06 (docs) → P05 → P06 (check). Chủ file: `src/runner/execution/run.mjs` → P02 (P01 không sửa `run.mjs`; handler đặt trong module riêng, P02 gọi `installCancelOnSignal` một dòng — hàm do P01 cung cấp, nối ở P02); `src/runner/dispatch/assignment-runner.mjs` → P01 (đăng ký attempt đang giao vào sổ cancel); `src/verbs/dispatch/{recover,inspect,show-run}.mjs`, `recovery-planner.mjs`, `runtime-inspection.mjs` → P03; `registrations.mjs`, `checks.test.mjs`, `CHANGELOG.md`, docs → P06; `src/run-supervisor/legacy-sweep.mjs` → P04. Không ai sửa `bin/fgos.mjs`, `test/test-ownership.mjs`.

## Data flow

```text
fgos run (controller)            Ctrl-C → cancel-registry: ghi cancel-requested.json mọi attempt đang giao → chờ receipt ≤ cancelWaitMs → in "unit chờ resume" → exit 130/143
  (chết bất thường)              supervisor + bước sau receipt settle attempt, trả credential, nhả slot (6.2/6.3) → attempt closed; unit dừng ở awaiting-resume
fgos dispatch inspect/show-run   đọc unit.json + adopt (probe, không ghi) → unitState: awaiting-resume, attemptState
fgos run --resume <unit>         adoptRun(attempt cuối) → closed+settled: dùng result.json → commit writes / reviewer / attempt kế / unit-summary
                                 running|being-adopted → từ chối attempt-still-running ; abandoned-not-started → attempt mới (supersedesRunId)
fgos dispatch recover <run>      recommendation `adopt` (CAS: snapshotHash + controlEpoch) → adoptRun ; outbox là bằng chứng có tên
fgos doctor --fix                run-attempts-stuck → sweepAttempts ; legacy-attempts-stuck → settle abandoned-legacy khi mọi pid dead
```

## Tiêu chí xong

1. Mọi dòng ma trận 9.7 có test crash đúng chỗ (giết process khi file tương ứng xuất hiện, không nhánh test trong code), cả `direct` và `terminal` (fake herdr); hai adopter; resume sau adopt dùng kết quả cũ (đếm số lần agent fixture chạy = 1).
2. Ctrl-C: attempt nhận `cancel`, receipt `cancelled`, controller thoát 130 trong `cancelWaitMs`; Ctrl-C hai lần thoát ngay, attempt vẫn kết thúc `cancelled`.
3. `--resume` sau controller chết: không `runs/02` mới khi attempt 01 đã settle; unit đi tiếp tới `unit-summary.json`; `inspect` attempt 01 `closed`, không còn `running/bound`.
4. `dispatch recover` trên run herdr có `outbox/result-1.json`: không còn `park`; đề xuất `adopt`; áp dụng → settle.
5. T8 chạy lại tám ca với CLI thật (P07): bảng kết quả đảo hết các dòng "Không" của T8 §1 (trừ "worker sống tiếp" cli giờ là "Có").
6. `legacy-attempts-stuck` dọn 6 attempt kẹt của T8 trên máy anh (hoặc báo rõ vì sao giữ).
7. Full `npm test` xanh (`env -u …`, `FGOS_HOST_BIN=<build>`); doctor xanh ở ba workspace sau landing.

## Rủi ro chính

| Rủi ro | Khả năng × tác động | Giảm thiểu |
|---|---|---|
| Resume dùng kết quả attempt mà bước của unit trước đó đã chạy một phần (commit `writes` dở) | TB × Cao | Tái dùng `commitPending`/`assertNoStrayCommit` hiện có ([`run.mjs:168-190`](../../src/runner/execution/run.mjs)); test ca "commit thất bại sau settle" |
| Handler signal làm controller không chết khi người muốn | Thấp × TB | Lần hai thoát ngay (D1); hạn `cancelWaitMs` |
| Dọn attempt cũ nhầm khi pid tái dùng | Thấp × TB | `judge` theo tuple (startTime/bootId); record thiếu → `unknown` → giữ (D3) |
| Hai resume cùng lúc | Thấp × TB | D6 |

## Rollback

Chỉ code (không state mới ngoài field hiển thị). Revert merge, activate release 6.3. Attempt đã `closed` vẫn đúng với release 6.3 (adopt bỏ qua `closed`).

## Câu hỏi mở cho anh

1. **Đổi 2026-10-18 (owner):** phần lease `dispatch-cwd` qua runner commit (N7) **chuyển sang plan Git** ([phase 04](../261018-0914-git-component-fgos-git/phase-04-custody-lease-and-successor-admission.md)), theo spec Git đã ký D-ADR0057 §6 (Q2). 6.4 **không** thêm phase ~3 h này nữa; lead 6.4 đừng tạo phase file cho nó. Kiểm ngày 18/10: chưa ai làm; `direct-launch.mjs` của run supervisor chỉ giữ lease trong lúc attempt chạy. Ghi chép cũ: ~~Đã chốt 2026-10-16: gom vào 6.4 theo RUL11~~ (khe hở thật, nằm trong phạm vi): thêm phase ~3 h giữ `dispatch-cwd` quanh `commitUnitWork`, cả đường resume; Lead thêm phase file khi mở track. (D5, kongming N7) Khe "attempt xong → runner commit `writes`" không có lease cwd (hôm nay đã vậy). **Mặc định:** để ngoài 6.4 và giữ trong "Việc hoãn có tên" của r6. Nếu anh muốn gom vào đây (RUL11): thêm một phase ~3 h, `runUnit` giữ `dispatch-cwd` quanh `commitUnitWork` ([`run.mjs:687`](../../src/runner/execution/run.mjs)), cả đường resume.
2. **Đã chốt 2026-10-16:** giữ mặc định (từ chối ngay). (D2) `--resume` gặp attempt còn `running` thì từ chối ngay. **Mặc định:** từ chối và in lệnh `fgos dispatch inspect` để xem. Phương án khác: chờ tới khi attempt `closed` rồi đi tiếp (`--resume --wait`), thêm ~2 h.
3. Tự resume vẫn hoãn (r6 §16). Ghi chú giữ trong spec runner và intent-preservation ledger; không có code nào cho nó ở 6.4.

## CẮT LẠI 2026-10-18

Ghi bởi P00r. Đọc main `dfe7f9212` (6.2 đã land) và 6.3 **theo `terminal-mode/integration` @6f2e922bf** (chưa land; big lead kiểm lại các dòng 6.3 sau khi land). Khối này **ghi đè** các dòng cũ ở trên khi mâu thuẫn. Phase P00r không có code sản phẩm.

### Tiền đề
- 6.2 đã land: cửa adopt (`fgos internal adopt`, `src/run-supervisor/client.mjs` `adoptRun`/`adoptScan`, `probeOnly`), `sweepAttempts`, receipt, marker v2, check `run-attempts-stuck`, `closed.json`. Trạng thái adopt có thật: `closed`, `running`, `being-adopted`, `held`, `legacy-run`, outcome `adopted`/`open`/`held` (spec §8).
- 6.3 (per terminal-mode/integration @6f2e922bf): supervisor `terminal`, `release-slot`, launcher writer id; `herdr-reconcile.mjs`, `liveness.mjs`, `worker-session.mjs` đã bị xoá, `herdr-round.mjs` rút gọn. Chưa land thì P00 không mở.
- Quyết định chủ (10-18 10:05): **lease cwd qua bước runner commit (N7) chuyển sang plan Git phase 04** (`plans/261018-0914-git-component-fgos-git/plan.md`). 6.4 bỏ phần đó.
- Không dùng số D-ADR0057 (Git G0 giữ; 6.3 P08 cũng đã viết một "D-ADR0057" trùng). Docs 6.4 ghi quyết định bằng tên, không số.

### Phần đã moot / đổi nghĩa
| Chỗ | Trạng thái |
|---|---|
| D5 + câu hỏi mở 1 ("gom lease cwd vào 6.4, phase ~3h") | **Moot**: sang Git phase 04. P02 giữ test "commit `writes` thất bại sau settle" (đường `commitPending`), bỏ mọi việc giữ `dispatch-cwd` quanh `commitUnitWork`. P06 sửa dòng ledger: lease cwd = Git phase 04, không "hoãn theo D5" |
| P03 mục 2 "outbox `result-N.json` là `unknown` → park" | 6.3 đã sửa `collectEvidence`: `result-*.json` là `worker-result`, không còn park vì `unknown`. Còn lại: recommendation mới `adopt` (planner hiện chỉ có `resume-driver`, cần liveness heartbeat cũ) và evidence `attempt-receipt`. Sửa test kỳ vọng park nếu có |
| P02 mục 1 "adopt `closed` + `result.json` → dùng kết quả" | `executeAssignment` đã có nhánh `admitted.resumed` (adopt, `readSettledResult`, từ chối `run-in-flight`/`run-unreconciled`/`result-corrupt`, từ chối run trước 6.2 bằng `legacy-run`). Việc thật của P02 còn lại nằm ở `runUnit`: `run.mjs` không truyền `retryId`/attempt cũ, nên resume sẽ admit `runs/02` mới. P02 phải nối resume vào nhánh `resumed` có sẵn (tìm attempt cuối ở `<unitDir>/<role>/<round>/runs/NN`), không viết cơ chế adopt thứ hai |
| `legacy-run` ở P02 ("chạy lại + cảnh báo") | Mâu thuẫn với hành vi đã land (từ chối `run-unreconciled`/`legacy-run`). Giữ hành vi đã land: từ chối có tên, người dọn bằng P04 rồi `--resume` |
| P00 `controller.json {tuple}` | Đã có `inspectRunControl(runDir)` (holder run control, dùng cho admission). P00 quyết dùng nó để biết controller chết; chỉ thêm `controller.json` nếu nó không phân biệt được |
| Cơ chế `unit.json` | `attempts[n].runId` chỉ ghi **sau** khi `executeAssignment` trả về (`run.mjs` ~813): controller chết giữa chừng thì attempt không có `runId`. P02/P03 tìm run dir theo `assignmentDir`, không theo `runId` trong `unit.json` |

### Delta theo phase
- **P00** (contract): `cancel-requested.v1.json` hiện `{v, attemptId, requestedBy (free text), at}` và supervisor (`supervise.rs`) so `attemptId`; chỉ bổ sung giá trị `requestedBy` (`signal:SIGINT|signal:SIGTERM|recover`) và requester tuple nếu cần, giữ `attemptId`. Không sửa `.rs`. `unit-state.v1.json` trỏ tới `adopt` state có thật (thêm `held`). `recover-actions.v1.json`: `adopt`, `abandon-legacy`.
- **P01**: `installCancelOnSignal` ghi `cancel-requested.json` **kèm `attemptId`** (đọc từ envelope/binding), không thì supervisor bỏ qua. Chờ receipt, thoát 130/143; lần hai thoát ngay. Không sửa `.rs`.
- **P02**: như bảng trên. **Guard 6.2**: `supervise` từ chối khởi động khi run dir đã có binding/receipt → `--resume` luôn đi qua adopt, **không bao giờ spawn supervisor thứ hai** cho attempt đã bind; có test riêng (resume trên attempt bound không gọi `supervise`). D6 (`mkdir` độc quyền `runs/NN`): admission hiện có (`admitRunAttempt`, CAS) đã cấp số attempt; P02 kiểm xem còn cần `mkdir` thêm không, không thì bỏ.
- **P03**: `inspectDispatchRuntime`/`show-run` thêm `attemptState` qua `adoptRun(probeOnly)` + `unitState`; `isSupervisedAttemptStillWorking` (assignment-runner) là probe sẵn có, tái dùng. Planner: thêm `adopt`; `recover.mjs` dùng `classifyRunOutcome(liveness:'unknown')`, giữ CAS.
- **P04**: `legacy-sweep.mjs` mới. ~2100 attempt mở của run cũ trên forgentX (doctor `run-attempts-stuck`) là tải thật: `settleLegacy` quét theo lô, đo thời gian, không chạy tuần tự từng lần `internal` route. Run cũ thiếu `attempt.lock` → `legacy-run`.
- **P05**: ma trận crash dùng supervisor `direct` thật và `terminal` (fake herdr) per terminal-mode/integration @6f2e922bf (đã có `test/run-supervisor/direct-crash-matrix.test.mjs` và `terminal-crash-matrix.test.mjs` + `test/run-supervisor/support/`: tái dùng helper, không viết lại).
- **P06**: thêm `legacy-attempts-stuck`, `units-awaiting-resume`, `dispatch.cancelWaitMs` vào `registrations.mjs` (file này 6.3 và Git lane B cũng sửa: merge main trước, giữ cả hai phía). Docs không dùng số D-ADR; ghi "tự resume hoãn có tên" ở deferred của spec, kèm seam: cần phát hiện controller chết + một người nhận duy nhất.
- **P07 A**: gồm `controller-death/**` trong push trigger CI (đã thêm ở P00r).

### File bị lane khác chuyển
Git/ES sau khi 6.3 land sẽ chuyển `packages/run-supervisor/rust/src/publish.rs`, `packages/terminal-control/rust/src/store.rs`, `packages/run-supervisor/rust/src/envelope.rs` sang `fgos-durable-file` / `fgos-canonical-json`. **Không phase 6.4 nào sửa ba file này** (P00 chỉ sửa contract JSON). Nếu có phase đổi ý, phải báo big lead để xếp thứ tự. Holder-lock borrow cleanup đã đổi trên main: P05 kiểm kỳ vọng "mọi holder bị giết" trong test mới.

### Thứ tự chạy
P00 → P01 → P02 → P03 → P04 → P05 → P06 → P07 phần A, một lead một lần. Thứ tự merge: P00 → P03 → P04 → P01 → P02 → P06 docs → P05 → P06 check. Big lead bắt đầu P00 sau khi 6.3 land và kiểm lại các dòng "per terminal-mode/integration".
