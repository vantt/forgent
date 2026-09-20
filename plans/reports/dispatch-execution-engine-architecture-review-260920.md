# Dispatch & Execution Engine — Independent Architecture Review

Ngày: 2026-09-20 · Repo: `/home/vantt/projects/forgentX` @ `7853e4d7` + working tree (toàn bộ mục "Implementation Subcomponent Map" + Source Inventory của `dispatch-control-plane.md` là **uncommitted**; mọi finding code nằm trên code đã commit trừ khi ghi khác).

Phương pháp: 8 nhóm component review song song (read-only, source ↔ test ↔ docs), lead tự đối chiếu lại mọi finding Critical/High trên source trước khi ghi nhận. Bằng chứng empirical: 3 probe script (capacity quarantine/lock/classifier, assignment-door attestation, supervisor tee), CLI probe read-only (`decide`, `dispatch inspect/show-run/recover/reconcile plan` với id giả). Test tập trung chạy tại HEAD: 148/148 pass (recovery, reconcile, capacity, inspect, result v2, operability door) + 27/27 `test/verbs/dispatch-recovery.test.mjs`. Không chạy `npm test` toàn bộ (không hermetic trong session).

Báo cáo chi tiết từng nhóm (claim table, findings, contract rows, test gaps, doc corrections riêng) nằm trong phần Phụ lục ở cuối tài liệu này.

Thuật ngữ trạng thái: `implemented` / `partial` / `proposed` / `deferred` / `reserved-not-executed`.

---

## Executive Verdict

**Kết luận: NOT READY** (cho vai trò "control plane duy nhất, chịu được crash/concurrency" mà docs công bố). Khung kiến trúc đúng hướng và phần lớn gate thật sự fail-closed, nhưng có 2 lỗi Critical tạo double-launch / mất khả năng dispatch, và một cụm High làm docs mô tả bảo đảm mà code chưa có.

Lý do tác động cao nhất (đã chứng minh bằng source, không phải suy đoán):

1. **Resume của một Run chưa settle spawn thêm worker thứ hai cạnh worker còn sống.** `executeAssignment` chỉ dừng khi reconcile trả `settled && runResult`; `waiting`/`parked`/`refused` rơi xuống spawn mới cùng runId (`assignment-runner.mjs:1840-1876` → `:2249`). `dispatch recover --action resume-driver` xoá `dispatch.claim` mà không có bằng chứng driver chết (`recover.mjs:205-215`, planner không đọc liveness `recovery-planner.mjs:117-129`) là cánh cửa mở đường vào đúng path này. Vi phạm trực tiếp F-b/F-c và luật "a missing or lost RunHandle never grants a new admission".
2. **Provider Capacity Rotator tự khoá chết pool account.** Runner gọi `quarantineProviderAccount` với field không tồn tại (`manualClear`, `evidence`) và bỏ `until`/`quarantineKind` (`assignment-runner.mjs:2602-2613` vs `provider-capacity.mjs:318`) → mọi 429 thành quarantine vĩnh viễn; classifier chạy không có `provider` nên regex OpenAI bắt nhầm stderr thường ("token … failed") thành `auth-token` quarantine; `state.lock` không kiểm chủ sở hữu → một SIGKILL chặn mọi lease sau đó, và throw thoát ra **sau** admission → Run mồ côi.
3. **Chuỗi bảo đảm admission/lock chỉ đúng cho caller "fenced".** Ledger + control lock là thật (`run-lock.mjs`, `admitRunAttempt`) nhưng holder identity là `{id, pid}` với reclaim = `kill(pid,0)` (design mandates `{hostId, bootId, pid, processStartTime}`); fencing `retryId`/`predecessorRunId` là opt-in mà chỉ coordination schema-2 dùng; standalone `execute --assignment`, operation-choice, first-attempt session đều "next available attempt". Docs contract và recovery-design mâu thuẫn nhau; cả hai đều sai một phần.
4. **Hai consumer quyết định "thành công" bỏ qua fail-closed của RunResult v2.** session-engine đọc `result.json` bằng `JSON.parse` thô, gate trên compat `status/confidence`, không qua `interpretRunResult` → `contract-corrupt` được chấp nhận ở quorum. Ladder của `execute` biến token `[DONE]` thành `verifiedSha` bất kể exit code → `fgos return` bỏ verify.
5. **Docs mô tả proposed/target như đã ship** ở nhiều điểm then chốt: `fallbackExecutors` "reserved-not-executed" (thực tế đã chạy cross-provider từ 33490c36), PlacementPolicy "binds" (thực tế shadow verifier), `dispatch recover` "re-enters compiler/confinement/adapter" (thực tế chỉ ghi epoch/jsonl/xoá claim), delivery tri-state, `bound/delivered` phases, RunHandle, attribution `proven`, `ProviderOutcome` — không có trong code.

**Residual risk (thiếu bằng chứng, chưa chứng minh sự cố):** rotator đang inactive trên host này (không có global accounts) nên C2 là source+probe; attestation `outcome=unknown` trên Assignment door do reviewer chạy probe, lead chỉ xác nhận cấu trúc hai door tách biến; tác động thật của giới hạn argv 128 KiB cho prompt cli-spawn chưa đo; số lần `loadRunnerConfig` trong luồng multi-verb chưa đo (một `decide` chỉ load một lần).

Điểm mạnh đã xác nhận (giữ, bảo vệ bằng test): mọi executor spawn đều qua `executeThroughConfinement`; Gate B3 chặn MCP-only; `inspect/show-run/watch` không ghi gì (import-graph test pin); `reconcile` từ chối mọi verb recovery và có CAS 2-process thật; ledger admission append-only + hardlink; dependency direction module-level đúng (dispatch không import coordination/verbs/bin); RunResult v2 normalizer + `interpretRunResult` fail-closed; herdr visibility là sibling field, không trộn vào Run truth.

---

## Đánh giá lại report & kế hoạch cải thiện (2026-09-20, sau khi gộp)

Đọc lại toàn bộ phần thân + 8 phụ lục với con mắt phản biện, đối chiếu thêm với các plan/track đang tồn tại. Kết quả: verdict **NOT READY giữ nguyên**; sửa 5 điểm trong chính report này; kế hoạch cải thiện được sắp xếp lại thành plan riêng.

### Điều chỉnh so với bản đầu

| # | Điều chỉnh | Căn cứ |
|---|---|---|
| 1 | **H9 là regression, không phải gap từ đầu.** Bằng chứng P06 (`plans/260910-1243-confinement-authority-implementation/reports/phase-06-evidence/*.json`, dispatch 2026-09-10) có `phase:completed, outcome:enforced, backend:bwrap` trên chính path coordination → assignment door. Nhánh `if (!request.assignmentLaunchContext)` tách hai door được thêm 2026-09-13 (`8e3da27c`, `f7d8ccec`, `649792d6` — runtime-recovery P02). Từ đó assignment door ghi `outcome=unknown`. Ưu tiên tăng: proof đã có sẵn để bám. | `git log -S assignmentLaunchContext -- authority.mjs`; evidence JSON |
| 2 | **M8 (reaper chưa nối) là carryover đã biết từ P03**, không phải phát hiện mới; P08 cũng ghi "reaper hygiene from P03". Giữ finding nhưng hạ "novelty"; vẫn cần làm vì đã leak 215 dir. | confinement plan P05/P08 rows |
| 3 | **C2 là regression so với contract của plan account-rotator Phase 05** ("quota/auth classifier fixtures quarantine only high-confidence cases"). Đồng thời `plans/260916-account-rotator/plan.md:3` ghi "not implemented" trong khi code đã ship (Phase 01–06 có trong `provider-capacity.mjs`) — plan status stale. | `plans/260916-account-rotator/plan.md:3, 277, 325` |
| 4 | **Severity calibration body ↔ phụ lục** (nêu rõ để không hiểu nhầm): Phụ lục 03 M3 "full env persisted" (Medium) + Phụ lục 06 M2 (Major) → thân **H11 High** vì live config có `ANTHROPIC_AUTH_TOKEN`/`ANTHROPIC_API_KEY` được expand và envelope bất biến không bao giờ xoá. Phụ lục 07 H2 "S3 over-claim" (High) → thân **M13 Medium** vì thuần docs. Phụ lục 05 F3 "Medium-High" → thân **H5 High** vì bỏ verify ở `fgos return` là false-success trên path production. Phụ lục 02 C1 → thân **C2** (đổi số, không đổi mức). | — |
| 5 | **Tag Priority now/next/later trong từng finding bên dưới bị thay thế** bởi thứ tự phase trong plan (nguyên nhân gốc × lộ diện thực tế × dependency). "Now" ban đầu có 13 mục — không phải kế hoạch. Giữ tag cũ để truy vết, không dùng để lập lịch. | plan §Nguyên tắc sắp xếp |

Điểm yếu còn lại của report (không sửa trong bản này): (a) C2 đánh giá bằng source + probe, chưa có sự cố sống vì host này không có inventory; (b) H9 lead chỉ xác nhận cấu trúc hai door, số liệu `outcome=unknown` là probe của reviewer (đã có regression evidence bù); (c) chưa đo argv 128 KiB và số lần `loadRunnerConfig` trong luồng multi-verb; (d) confinement track P08 ghi "chưa merge vào main" nhưng main hiện có `confinement.backend:'bwrap'` trên invocations — cần `git branch --contains 569f72d3` để xác định, plan Phase 00 việc 13.

### Kế hoạch cải thiện (đã sắp xếp lại)

Plan: [`plans/260920-2217-dispatch-engine-hardening/plan.md`](../260920-2217-dispatch-engine-hardening/plan.md) — 10 phase, 4 wave, mỗi phase là một ứng viên `fgos submit`, acceptance = test còn thiếu trong §Test Gaps trở thành xanh.

| Wave | Phase | Findings | Gate |
|---|---|---|---|
| 1 | 00 Decision gate + docs truth | M13 + docs "stays proposed" + D1–D6 | user |
| 1 | 01 Result truth (no false success) | H4, H5, M4, M14, L6, L7 | — (L6 chờ D3) |
| 1 | 02 Admission/lock foundation | M2, H1, H3, L1 | — |
| 2 | 03 Single live worker per Run | C1, H2, H13, M1, M9(a), M15(a), L2 | Phase 02 |
| 2 | 04 Confinement attestation + secrets | H9, H11, H10, M8, L9 | D2, D4 |
| 3 | 05 Policy/plan governance coherence | H6, H12, M5, M6, M7, M12, L4 | D1; chủ plan executor-policy-dispatch-seams cho M5 |
| 3 | 06 Provider capacity rotator | C2, H8, M6(vocab), H3(state.json) | **trước khi bật global inventory** |
| 3 | 07 Herdr adapter, trust, supervisor tee | H7, M3, M15(b,c), L11 | — |
| 4 | 08 Operability/CLI + doctor | M11, M9(b,c), M16, L3, L10 | Phase 03 |
| 4 | 09 Boundary placement + simplification | M10, L5, L8, L12, L13, tách file | Phase 01–08; **có component-boundary change** |

Vì sao C2 (Critical) xếp Wave 3 sau H4/H5 (High): C2 chỉ kích hoạt khi có `runner.providers.*.accounts` global — host này chưa có; H4/H5 chạy trên mọi Assignment/`fgos return` hôm nay. Gate của Phase 06 là tuyệt đối: không bật inventory trước khi nó xong.

Traceability finding thân ↔ phụ lục: C1 = PL4 F1 + PL6 C1 + PL7 H1 · C2 = PL2 C1/H1/H2 · H1 = PL4 F2 · H2 = PL4 F3 + PL8 F1 · H3 = PL4 F4 + PL5 F4 · H4 = PL5 F1 · H5 = PL5 F3 · H6 = PL1 H1/H2 · H7 = PL2 H3 + PL6 m9 · H8 = PL2 H4 · H9 = PL3 H1 · H10 = PL3 H2 · H11 = PL3 M3 + PL6 M2 · H12 = PL1 H3 · H13 = PL6 M3 · M1 = PL4 F5 · M2 = PL4 F6 · M3 = PL6 M1 · M4 = PL5 F2 · M5 = PL2 1a/L1 · M6 = PL1 M1/M2 + PL2 M3/M4 · M7 = PL2 M6 · M8 = PL3 M1/M2/M4 · M9 = PL7 M1/M2/M3 · M10 = PL8 F2/F3 · M11 = PL1 M3 + PL7 M4 + PL8 F5/F6/F7 · M12 = PL1 3a/3g/L1 + PL8 F4 · M13 = PL1 M4 + PL7 H2 · M14 = PL5 F5 · M15 = PL6 claim 5/m5/4a · M16 = PL8 F8 · L1–L13 = PL4 F7/F9/F10/F11, PL5 F6–F9, PL6 m1–m8, PL7 L1–L4, PL8 F9/F10.

---

## Findings

### Critical

#### C1 — Resume Run chưa settle spawn worker thứ hai (double launch)
- **Severity:** Critical
- **Evidence:** `src/runner/dispatch/assignment-runner.mjs:1840-1876` (resume block; early-return duy nhất `if (rec.settled && rec.runResult)`), `:1883-2249` không có guard trên `rec.status` (lead grep xác nhận); `reconcileCliSpawnRun` trả `{status:'waiting'}` khi supervisor/worker pid sống (`:3286`, `:3312`); `reconcileHerdrSpawnRun` trả `waiting` cho worker sống (`herdr-round.mjs:2170-2176`) và `settled` **không có** `runResult` khi settle từ receipt/outbox (`:2036-2040`, `:2120-2125`). Cửa vào: `dispatch recover --action resume-driver` xoá `dispatch.claim` vô điều kiện (`src/verbs/dispatch/recover.mjs:205-215`); `checkPreconditions` chỉ chặn khi đã settled (`recovery-planner.mjs:91-104`); liveness được collect (`:286-295`) nhưng không dùng; session-engine tái nhập qua `wx` claim gate (`session-engine.mjs:423-431`). Rename `EEXIST` (`assignment-runner.mjs:1160-1166`) và retry cùng `retryId` → `resumed:true` cũng tới đây.
- **Vấn đề thực tế:** F-b ("coordinator dies after bind; recovery finds live worker, same Run, zero new spawn") không được `executeAssignment` tôn trọng; bảo đảm chỉ tồn tại ở hàm reconcile rời.
- **Kịch bản:** coordinator crash sau khi launch worker A; operator/loop chạy `recover resume-driver` rồi `coordination run` (hoặc retry cùng tuple) → worker B spawn vào cùng cwd, cùng runId, cùng outbox; hai `result-1.json`, last-writer-wins; evidence attribution trộn hai worker.
- **Boundary/contract:** Run admission ("lost RunHandle never grants a new admission"), RunHandle, `dispatch recover` vs `reconcile clear-assignment-claim` (hai cửa, hai luật mâu thuẫn trên cùng file claim: planner đòi 3 precondition + refuse session-owned `reconciliation-planner.mjs:377-433`, recover đòi không gì).
- **Vì sao test không bắt:** `herdr-reconciliation.test.mjs:634` (F-b) gọi `reconcileHerdrSpawnRun` trực tiếp và assert `waiting`; không test nào resume qua `executeAssignment` với worker sống; `assignment-dispatch.test.mjs:2832` xoá run dir (không worker) nên relaunch là hành vi mong muốn ở đó; fixture `test/verbs/dispatch-recovery.test.mjs:18-26,344-358` không có generation/visibility/session.
- **Sửa nhỏ nhất:** (a) sau `rec = await reconcileFn(runDir)`: `waiting|held|observed|refused`, hoặc `parked` với reason ≠ `command-missing` → throw typed refusal `run-in-flight`/`run-unreconciled`; chỉ `command-missing` mới được launch; (b) `reconcileHerdrSpawnRun` trả `runResult` khi `settled` (hoặc `{settled:false, observed:true}` tường minh); (c) `recoverApplyUseCase`: refuse khi Run thuộc session (`findCoordinationSessionOwningAssignment`, đã export ở `runtime-inspection.mjs:94`), `resume` đòi `liveness.fresh === false`, và route xoá claim qua `planClearAssignmentClaim/applyClearAssignmentClaim` để một bộ proof cai quản file.
- **Priority:** now.

#### C2 — Provider Capacity Rotator: quarantine vĩnh viễn, classifier bắt nhầm, lock kẹt sau crash
- **Severity:** Critical (khi rotator active; trên host này inactive → source+probe)
- **Evidence:** (a) `assignment-runner.mjs:2602-2613` truyền `{manualClear, evidence}` — không có trong signature `quarantineProviderAccount({provider, accountId, reasonCode, quarantineKind='temporary', until, runtimeDir, detail})` (`provider-capacity.mjs:318`); `until` bị bỏ → `isQuarantined` fail-closed vĩnh viễn; evidence record đọc `quarantine?.status/manualClear` không tồn tại (`:2615-2619`). Probe: quota fault có reset 3h → record không `until`, `healthy:false` sau 30 ngày. (b) `classifyProviderCapacityFault` gọi không có `provider` (`:2587-2591`); branch `provider === 'openai' || provider === undefined` (`provider-capacity.mjs:392`) + regex `/\b(login|auth|…|token)\b/ && /\b(failed|expired|…)\b/` trên toàn stderr (`:403`). Probe: `"SyntaxError: Unexpected token } … 1 test failed"` → `auth-token` manual-clear. (c) `withFileLock` `provider-capacity.mjs:185-210`: ghi `{pid}` nhưng không đọc lại, không kiểm liveness, hết deadline throw raw `EEXIST`; `acquireProviderAccountLease` tại `:1635` ngoài try, **sau** `admitRunAttempt` → Run `running` mồ côi; doctor `provider-capacity-state` dùng `inspect` không lấy lock nên vẫn pass.
- **Kịch bản:** một 429 → account A quarantine vĩnh viễn; lần sau lease B → tương tự; pool cạn; mọi dispatch settle `provider-capacity-refused` cho tới khi operator clear tay từng account. Hoặc: OOM/SIGKILL giữa `openSync` và `unlinkSync` → mọi lease host-wide fail sau 5 s bằng error không phân loại.
- **Boundary/contract:** `provider-capacity-state.v1` (record) vs runner call site; H1 gate comment ở `provider-capacity.test.mjs:158-163` nêu đúng invariant mà call site vi phạm.
- **Vì sao test không bắt:** classifier và `quarantineProviderAccount` test riêng với args đúng; `assignment-dispatch.test.mjs` chỉ pre-seed quarantine (`:1251`, `:1335`), không đẩy fault qua `executeAssignment`; không có negative case "token"+"failed"; concurrency test chỉ chứng minh exclusion.
- **Sửa nhỏ nhất:** truyền `quarantineKind: fault.quarantineKind, until: fault.until, detail: {...}`; đọc `quarantine.kind/until` cho evidence; truyền `provider`, bỏ wildcard `undefined`, anchor regex theo dòng provider-known hoặc chỉ N dòng cuối, `auth-token` chỉ khi `adapterOutcome` corroborate; lock: đọc pid, reclaim khi `!isPidAlive(pid)` (helper có sẵn `:224`), bọc lease vào cùng settle path như `refused`; doctor check `provider-capacity-lock-stale`.
- **Priority:** now.

### High

#### H1 — Control-lock reclaim chỉ dựa PID; identity thiếu bootId/processStartTime
- **Evidence:** `run-lock.mjs:32-41` (`kill(pid,0)`, EPERM=alive), `:296-303` reclaim khi `isProcessAlive` false; holder `{id, pid}` tại `assignment-runner.mjs:1944`, `:3125`, `recover.mjs:280`. `getBootId`/`getProcessStartTime` có sẵn (`cli-spawn-supervisor.mjs:48-61, 384-398`) nhưng không dùng cho holder. Design §6 (`runtime-recovery-design.md:158`) đòi `{hostId, bootId, pid, processStartTime}`.
- **Vấn đề:** (a) PID reuse sau reboot/uptime dài → lock "held" mãi, không có TTL escape (by design); (b) contender trong sandbox/PID namespace (bash sandbox của repo này không thấy host process) thấy ESRCH cho holder sống → reclaim → hai controller; loser chỉ phát hiện ở `isRunControlCurrent` (`:2292/2410/2711`) **sau** adapter I/O.
- **Boundary:** §6 holder identity; "Unknown liveness is not dead".
- **Test miss:** `assignment-dispatch.test.mjs:2962` release sạch trước khi interloper acquire; không test dead-pid vs reused-pid vs invisible-pid.
- **Fix nhỏ nhất:** ghi `bootId` + `processStartTime` vào holder; trong `acquireRunControl`: pid alive nhưng startTime lệch → dead; không đọc được `/proc/<pid>` → **unknown → held**. Cùng holder cho recover/reconcile.
- **Priority:** now.

#### H2 — `RunnerConfigError` ném sau admission/spawn nhưng session-engine coi là "chưa spawn" và xoá claim
- **Evidence:** `session-engine.mjs:385-397` (comment: mọi throw site "fires strictly before mkdirSync(runDir)"), unlink claim tại `:436-446`, `:4810-4825`. Runner ném class này tại `assignment-runner.mjs:1957` (control held — run dir đã tồn tại), `:2293`, `:2411`, `:2712` (token superseded — adapter đã chạy), `:2762`, `:2858`.
- **Kịch bản:** controller A mất control giữa chừng (recover/second controller) → throw → engine xoá `dispatch.claim`/`retry-N.claim` → lần `createAndExecuteSessionTask` tiếp theo thấy không claim, `findLatestRunResult` null (N chưa settle) → dispatch N+1 khi N còn sống dưới controller khác. Đúng điều claim tồn tại để chặn.
- **Boundary:** Coordination → Dispatch error-class contract.
- **Test miss:** `coordination-session-engine.test.mjs:316-353` chỉ case governance-blocked pre-spawn; `:2962` chỉ assert message.
- **Fix:** thêm `code`/`phase:'post-admission'` cho 6 site (hoặc class riêng `run-control-held`, `run-control-superseded`); engine unlink chỉ khi pre-admission.
- **Priority:** now.

#### H3 — `result.json` / `run.json` / `assignment.json` ghi không atomic; torn `result.json` khi resume → relaunch
- **Evidence:** `writeFileSync` thẳng tại `assignment-runner.mjs:1782, 2717, 2833, 3060` (result.json), `:2839, 3066` (run.json full rewrite), `:1369, 1887-1890` (assignment.json RMW `dispatchedRuns`), `:1696-1704, 2239` (dispatch-plan/effective contract rewrite in place). Helper atomic có sẵn cùng module family: `publishMutableProjection` (`cli-spawn-supervisor.mjs:97-137`), `writeJsonAtomic` (`visibility-session.mjs:88-93`), `writeRunJsonPatch` (`recover.mjs:176-183`). Resume `:1841-1846`: parse throw bị nuốt → reconcile nuốt tiếp (`:3088-3093`) → `parked` → C1 fall-through. `provider-capacity.mjs:182-185` `state.json` cũng non-atomic, `readState` không xử lý corrupt.
- **Kịch bản:** crash giữa write → Run đã có effect bị dispatch lại; `dispatchedRuns` RMW dưới hai caller unfenced mất một entry → `operation-choice.mjs:140-149` từ chối evidence "never dispatched"; torn rewrite của protected artifact → reconcile `refused: protected-artifact-corrupt` bricks recovery.
- **Fix:** route 4 write result.json + run.json + protected rewrites qua `publishMutableProjection`; `dispatchedRuns` → marker append-only per attempt; resume: "result.json tồn tại nhưng không parse được" → `parked/corrupt`, không launch; capacity `state.json` temp+rename, corrupt → rename aside + audit.
- **Priority:** now (result.json/run.json), next (assignment.json, state.json).

#### H4 — Run Result Evaluator (session-engine) bỏ qua validation v2; `contract-corrupt` được chấp nhận
- **Evidence:** `session-engine.mjs:275-284` (`readLinkedRunResultFromDisk`), `:304-316` (`findLatestRunResult`) `JSON.parse` thô; gate `:1654, :1667, :3508-3515, :4337` chỉ đọc compat `status/confidence`. `grep classification|contractCorrupt|validateRunResultV2 session-engine.mjs` → 0. Rule fail-closed chỉ ở `interpretRunResult` (`run-result.mjs:559-573`), gọi bởi dispatch resume/reconcile/inspect/operation-choice/herdr.
- **Kịch bản:** `classification.execution.status: failed` nhưng compat `status: done, confidence: verified` (post-settle edit, partial write recovered tay, writer bug tương lai) → `accepted` ở quorum; `fgos dispatch inspect` trên cùng file nói `contract-corrupt`. Hai reader, hai câu trả lời.
- **Boundary:** Dispatch → RunResult → Evaluator handoff; docs §Addendum "fails closed" chỉ đúng một nửa.
- **Fix:** hai chỗ đọc → `interpretRunResult(JSON.parse(raw))`, `contractCorrupt === true` → failed (đã project `no-evidence/failed`, gate hiện có tự fail-closed). Một import, hai dòng.
- **Priority:** now.

#### H5 — Ladder của `execute` biến `[DONE]` thành `verifiedSha` bất kể exit; `fgos return` bỏ verify
- **Evidence:** `result-ladder.mjs:58` `isDone && headAfter ? {verifiedSha}` không xét `result.status`; `cli.mjs:1086` gọi vô điều kiện; `cli.mjs:1338-1340` forward `--worker-verified-sha`; `bin/fgos.mjs:3597-3608` `check.passed=true, skipped=true` khi sha == branch head.
- **Kịch bản:** worker in `[DONE]`, commit, exit ≠ 0 hoặc timeout sau khi in → verify bị bỏ khi return. Process/token success thay cho semantic success — đúng điều docs §Confidence cấm. Path này nằm ngoài RunResult nên fail-closed của v2 không thấy.
- **Test miss:** negative test "timeout/non-zero exit with misleading success text" không có cho ladder `execute`.
- **Fix:** gate `verifiedSha` trên `status === 0` và không `timeout/failed`. Một điều kiện.
- **Priority:** now.

#### H6 — `--work` plan không có policy/governance; executor id chưa đăng ký spawn lặng lẽ vào executor toàn cục
- **Evidence:** `plan.mjs:117-135` early return với `governance:{null,null}`, không policy/tier/model/provenance, vẫn dispatchable (`cli.mjs:1283` fanout dùng). `resolveExecutorAndOverrides` trả `{executorId:null, configured:false}` cho id lạ (`resolve.mjs:331`); `resolveExecutorConfig` rơi về `cfg.executor` (`:447`); cả hai gate `carries` (`:365`) và `allowCrossProvider` (`:498`) nằm sau `if (executorEntry && …)` → bỏ qua; `disallowedProviders` không bao giờ được đánh giá. Live: `decide agy` → `{"mechanism":"out-of-process","configured":false}` exit 0 (registry hiện là `gemini`); `decide nonexistent-executor` giống hệt; cùng id qua `--work` → `in-process` (`dispatch.test.mjs:5189` pin là cố ý). `resolveAssignmentDispatchPolicy` fail-closed trên cùng input (`assignment-policy.mjs:352-354`) — hai door bất đồng.
- **Giảm nhẹ:** executor toàn cục hôm nay là Claude → egress không cross-provider; hệ quả thực là "id gõ sai spawn vào default không policy", không phải rò rỉ. Trở thành rò rỉ nếu project đặt `runner.executor.command` non-Claude không `allowCrossProvider`.
- **Boundary:** Governance gate; "Executor identifiers must resolve through configured/approved targets".
- **Fix:** branch early-return vẫn chạy `resolveExecutorConfig` cho global và copy `governance`, synthesize minimal policy để `disallowedProviders` chạy; `selector.type==='executor'` + `configured:false` → `mechanism:'unavailable'` + `reasonCodes:['selector.unregistered']` (đã là hành vi của `--for`). **Điểm thứ hai đảo ngược test pinned — cần quyết định của anh, không phải reviewer.**
- **Priority:** now (governance), user-decision (unknown id).

#### H7 — Trust store: kind `agy`/`agy-json` bị route vào `~/.claude.json`; hàm agy/remove là dead code; entry không bao giờ xoá
- **Evidence:** `herdr-round.mjs:578-597` (`codex-toml` else `seedTrust(~/.claude.json)`); live `.fgos/config.json:551-556` `kind:"agy"` với `env.HOME: ~/.agy-homes/mucdong`; `seedAgyTrust/removeAgyTrust/removeTrust/removeCodexTrust` (`trust-store.mjs:277-372`) 0 caller; commit e1307d33 chỉ widen `TRUST_STORE_KINDS`. `seedAgyTrust` tự vi phạm B1 (thêm repoRoot không kiểm `:301-311`) và ghi đè file corrupt bằng `{}` (`:319-327`). `worker-home.mjs:130-145` là writer trust thứ hai.
- **Kịch bản:** agy visible dispatch vẫn gặp trust dialog (đúng bug kind được thêm để sửa) trong khi `round.note({trustSeeded:'agy'})` ghi thành công; `~/.claude.json` của operator phình một entry mỗi herdr dispatch, không prune.
- **Fix:** route `agy*` → `seedAgyTrust` với HOME resolved; áp B1; không overwrite corrupt; gọi `removeTrust*` ở teardown (`herdr-round.mjs:929` vùng); doctor check readability cho codex/agy (chỉ `claude-json` được check `registrations.mjs:3544`).
- **Priority:** now (a) / next (b,c).

#### H8 — Credential của account đã lease chỉ được provision dưới bwrap; provenance ghi account X nhưng worker chạy credential ambient; resume không lease
- **Evidence:** chỉ `confinement/drivers/bwrap.mjs:29-51,371` đọc `request.providerCapacity.credentialSource`; `worker-home.mjs:105-126` copy `~/.claude/.credentials.json` ambient (lead xác nhận); không `CODEX_HOME`/credentialSource trong transport/cli-spawn-supervisor/herdr-round/worker-session-boot. `assignment-runner.mjs:1629-1633` `shouldSelectProviderAccount = !admitted.resumed && …` → resume không lease nhưng sticky map vẫn nêu account.
- **Kịch bản:** `provider-capacity-selection.json` nói `accountId: a1, credentialProvisioned:false` nhưng worker dùng `~/.codex/auth.json` của dispatcher; quota/quarantine/stickiness phạt sai account; resume bỏ qua concurrency limit per-account.
- **Fix:** refuse (`credential-provisioning-unsupported`) khi lease được chọn mà backend không provision được, hoặc provision qua env cho cli-spawn; resume re-acquire sticky trước relaunch.
- **Priority:** next.

#### H9 — Confinement: attestation `completed` trên Assignment door ghi `outcome=unknown, backend=null` dù launch đã bwrap-enforced
- **Evidence:** hai door giữ hai biến `preparedConfinement` riêng (`authority.mjs:586` direct, `:1162` assignment); attestation completed chỉ build ở direct door `:1094-1098` với `outcome: preparedConfinement ? "enforced" : undefined`; `prepareConfinementForLaunch` không trả `backendPlan/preparedConfinement`. Probe reviewer: cùng request, fake adapter, có `assignmentLaunchContext` → `outcome=unknown backend=null coverage={hostWrite:unverified}` trong khi adapter nhận `/usr/bin/bwrap --ro-bind / / …`.
- **Kịch bản:** mọi consumer đọc `<dispatchId>.completed.json` (show-run, evidence review, `proven` tương lai) kết luận Run không confined. `.prepared.json` có plan nhưng không gì nối "prepared" với "actually launched".
- **Test miss:** p04 R8 (assert `enforced` thật) skip trừ `FGOS_LIVE_BWRAP_TESTS=1` và dùng direct door; không test nào đưa assignment door tới completion.
- **Fix:** `prepareConfinementForLaunch` trả `{backendPlan, preparedConfinement}`; dùng cho completed/failed attestation; thêm test assignment-door assert `outcome==='enforced'`.
- **Priority:** now.

#### H10 — Direct `dispatch execute` door từ chối mọi capability `required` trong production (`backendId` không resolve)
- **Evidence:** `request.mjs:413` `backendId: backendId ?? cfg.executors[execId].confinement.backend` (executor-level only; comment "Invocation data is untrusted"); live config đặt `confinement.backend:'bwrap'` trên `invocations[]` (`.fgos/config.json:240,359,473,498,571`); direct door refuse `required` không backendId (`authority.mjs:638-655` `confinement-backend-missing`); assignment door default `'bwrap'` (`:1168`, `backendRegistry.defaultBackend` là dead code — schema registry cấm key này `backend-registry.mjs:151-157`). Probe reviewer: `advise/claude`, `code:review/openai`, `code:debug/openai` → `backendId=null`.
- **Kịch bản:** skill chạy `node src/runner/dispatch.mjs execute --for code:review` (door out-of-process được docs chỉ) luôn refuse. Fail-closed, không bypass — nhưng hai door hai luật.
- **Câu hỏi chưa giải:** đây là bug hay interim cố ý ("until P06 wires backends", p04 R7)? Anh quyết.
- **Fix:** một rule defaulting chung (`request.backendId || registry default || 'bwrap'`) cho cả hai door, hoặc lift `invocations[].confinement.backend` tại `request.mjs:413`.
- **Priority:** now (quyết định), next (code).

#### H11 — Toàn bộ `process.env` + token provider đã expand được ghi vào launch envelope bất biến và argv herdr
- **Evidence:** `authority.mjs:1349-1355` `workerEnv = {...process.env, ...resolveExecutorEnv(rawEnv)}`; ghi vào `protected/launch-envelope/<id>.json` `:1606-1614` và compat `:1641-1646` (`publishImmutableProof`, không xoá); `resolveExecutorEnv` expand `${ANTHROPIC_AUTH_TOKEN}`/`${ANTHROPIC_API_KEY}` (tên có trong live config); herdr: `paneSplit --env K=V` argv (`transport.mjs:817` → `herdr-agent.mjs:154-156`), launcher script export (`herdr-round.mjs:66-80`, giữ lại khi fail). `attestation-store.mjs` header hứa "redacted references and digests only" — sai cho hai record này. Dir tạo mode mặc định (`cli-spawn-supervisor.mjs:99,125`).
- **Kịch bản:** mọi Run fail/timeout để lại token sống trên đĩa dưới `.fgos/assignments/**/protected/` (gitignored nhưng đọc được bởi tool/backup khác của user; argv thấy được qua process listing).
- **Fix:** envelope lưu `envDigest` (đã tính `:1358`) + subset allow-list; supervisor nhận secret qua side file 0600 xoá sau spawn; pane env chỉ non-secret; hoặc tối thiểu chmod `protected/` 0700.
- **Priority:** now.

#### H12 — `preferInvocation` validated nhưng `mergePolicyStack` bỏ; declared-protocol actor không pin được invocation, read-only redirect ghi đè
- **Evidence:** `definitions/schema.mjs:272-276` validate; `:341-345` merge chỉ `preferPersona/preferExecutor/visibility/fallbackExecutors`; `session-engine.mjs:2896-2904` rebuild `cliOverride` từ `merged` (không có `preferInvocation`); `assignment-runner.mjs:1477` chỉ đọc `opts.cliOverride.preferInvocation`. `grep -rl preferInvocation test/` → rỗng.
- **Kịch bản:** actor khai `{executor:"claude", invocation:"claude-cli-readonly"}` → Gate B2 chọn "first via:cli" (full write) → vì read-only bị `selectReadOnlyRedirectExecutor` redirect lặng — đúng kết quả guard `:1469-1477` tồn tại để chặn.
- **Fix:** thêm `preferInvocation` vào merge loop và rebuild `cliOverride`; một test declared-protocol assert invocation id spawn.
- **Priority:** now.

#### H13 — Herdr adapter ghi `controller/commands/<id>.json` (state `reconciled`) không qua control-token guard
- **Evidence:** `herdr-round.mjs:1325-1330, 1503-1515, 1571-1580, 1695-1712, 2113-2118` `publishMutableProjection` trực tiếp; cli-spawn path chỉ commit qua `commitCommandOutcome` kiểm `controlEpoch/controlTokenDigest` (`cli-spawn-supervisor.mjs:992-1010`; `authority.mjs:978-994`).
- **Kịch bản:** round herdr của controller đã bị supersede ghi đè record command của controller mới hơn. Docs "Herdr never settles Run truth" đúng với `result.json`, sai với command projection.
- **Fix:** route qua `commitCommandOutcome`/tương đương có token; authority commit cuối như cli-spawn.
- **Priority:** next.

### Medium

#### M1 — Callers unfenced không có bảo đảm "một un-settled Run per Assignment"
- `admitRunAttempt` không `retryId` → decide callback không bao giờ `stop` (`assignment-runner.mjs:955-1023`); callers: `cli.mjs:1557, 1729`, `operation-choice.mjs:2211`, `session-engine.mjs:345` (first attempt, chỉ in-session claim). Test `:3023` pin. Hai `execute --assignment` đồng thời → hai Run admit + launch. Fix: branch unfenced refuse khi current generation chưa có `result.json` và holder alive/unknown (dùng H1 identity); `--force-new-attempt` cho operator. Priority: next.

#### M2 — Refusal admission/lock chỉ là prose `RunnerConfigError`, không `code`
- `:1079-1088, 1957, 2293, 2411, 2712`; `config.mjs:75-81` chỉ `category:'validation'`; test match regex (`:2793`, `:3020`). `dispatch reconcile/recover` cũng chỉ `outcome` + prose `reason`, không `reasonCode` (`reconciliation-planner.mjs:279-317`, `recover.mjs:302-321`). Caller không phân biệt `held` với `config-invalid`. Fix: thêm `code` (`admission-duplicate-retry`, `admission-invalid-predecessor`, `run-control-held`, `run-control-superseded`) và `reasonCode` cho verbs. Priority: next.

#### M3 — Supervised cli-spawn tee: callback đảo tham số và giao mỗi chunk hai lần
- `cli-spawn-supervisor.mjs:434-451` `deliverLiveChunk` gửi cả IPC lẫn stdio; `:849-863` parent subscribe cả ba nguồn và gọi `onChunk(chunk, stream)`; consumers `cli.mjs:1563,1735,1777` `(stream, chunk) => process.stderr.write(chunk)`, `loop.mjs:1017`, `transport.mjs:275-281` mong `(stream, chunk)`. Probe: 2 chunk → 4 call `(Buffer,'stdout')`. Hệ quả: `execute --assignment` in chữ `stdoutstdout…` thay vì output; log consumer append `'stdout'`. Parity test `cli-spawn-reconciliation.test.mjs:76-79` chấp nhận cả hai thứ tự. Fix: `onChunk(stream, chunk)` + chỉ subscribe IPC. Priority: next.

#### M4 — Normalizer bịa worker claim và ghi basis `valid-agent-result-claim`
- `assignment-runner.mjs:2689-2694, 2820, 3045` `agentClaim ?? {status, summary:'Settled'}`; `run-result.mjs:381-383, 485-490`. Reader không phân biệt "worker said done" với "runner said done on its behalf". Fix: pass `null`, giữ synthesized summary dưới key riêng, basis theo `claimPresent`. Priority: next.

#### M5 — PlacementPolicy là shadow verifier, không phải binder; hai fallback machinery
- `placement-policy.mjs:1-11` header "SHADOW MODE ONLY … no caller in the real dispatch path yet" (đã stale: `cli.mjs:29`, `assignment-policy.mjs:28`, `assignment-runner.mjs:63` import); mọi binder trả `legacyModel/legacyExecutorId` khi lệch (`:224, :425, :489`). `admitFallbackCandidate/fallbackCandidates` (shadow) song song `recovery.mjs resolveFallback` (production). Docs "PlacementPolicy binds provider/model/executor" là partial. Fix: docs nói đúng; xoá shadow fallback hoặc ngừng mô tả. Priority: next.

#### M6 — Provider family bị override bởi selector/capability và derive lệch ở 3 chỗ
- `assignment-policy.mjs:407-425` `cliOverride.providerModel ?? opPolicy.providerModel` thắng derivation và trở thành `providerModel`, `provenance.provider`, subject của `disallowedProviders` (`:510`); `policyForActualExecutor` (`assignment-runner.mjs:270-296`) và `:1628` gọi `deriveProviderFamily(entry)` không command → default `'claude'` (`resolve.mjs:135`); `cli.mjs:855-890/303` tự tính model rồi gọi resolver post-hoc. Vocabulary `openai` vs `openai-codex` tách ở config/adapter/classifier/inventory (`provider-adapter.mjs:75-84`, `provider-capacity.mjs:392`, test `:1336`) → inventory có thể "not managed" lặng. Fix: một `deriveProviderFamily(entry, cliCommand)` + `normalizeProviderFamily` tại inventory và `:1628/:1270`; tách lookup-table provider khỏi family. Priority: next.

#### M7 — Read-only redirect cross-provider chỉ được re-check bằng per-call option không ai truyền
- Live `placementPolicy.readOnlyRedirects.claude → {executor:"openai", invocation:"codex-cli-bwrap"}`; re-check `assignment-runner.mjs:1500-1510` chỉ đọc `opts.options`; `allowCrossProvider` vẫn fire lúc spawn nên không lặng, nhưng quyết định redirect chỉ là dòng stderr (`:257-260`) + `executorRedirected`, không record vì sao entry thắng. Fix: persist `{sourceExecutorId, pool, seed, chosen, invocation}` vào `dispatch-plan.json/run.json`; pool entry cross-provider cần khai `crossProvider:true`. Priority: next.

#### M8 — Confinement: orphan private-home không bao giờ reap; worker-home rò credential khi crash; bypass pairing kiểm legacy flag
- `reapOrphanedConfinementResources` (`cleanup.mjs:100`) 0 caller; `/tmp/fgos-confinement` 215 dir, 108 owner chết; assignment door drop `cleanup` closure; `finalize` chỉ xoá `exited+process-group`, `timeout` receipt → retained mãi (`authority.mjs:1690-1705`). `worker-home.mjs:126` copy credential thật vào `/tmp` 0600; crash giữa `createWorkerHome` và teardown để lại; 415 `/tmp/worker-*` do test (fixture creds). `evaluateBypassPairing` đọc legacy `privateHome/isolatedSession/ownWorktree` (`authority.mjs:506-520`), không phải policy coverage; `permissionMode` không có trong attestation. Fix: gọi reaper từ `doctor --fix`/runner start + doctor count; test dùng mkdtemp riêng; pairing derive từ plan coverage, record `permissionMode`. Priority: next.

#### M9 — `reconcile apply` lock không reclaim dead holder; `watch` không thoát trên cửa sổ repair-projection; RunObservation sai vocabulary
- `reconciliation-planner.mjs:537-541` `wx` + `{pid}` không kiểm → một SIGKILL chặn mọi apply (recover đã giải bài này `recover.mjs:140-172`). `watch.mjs:21,82` chỉ dừng trên `run.json.status`; `readRunSnapshot` không nhìn `result.json` → loop tới `--ticks`. `runtime-inspection.mjs:108-111`: `phase` luôn `'admitted'` (writer duy nhất `assignment-runner.mjs:1571`, không bao giờ advance), `delivery:'not-sent'`, `resourceState` = visibility status — không thuộc closed set của contract. Fix: reclaim bằng `startTime(pid)` (đã có trong module), snapshot thêm `settled: existsSync(result.json)`, derive `phase` từ facts. Priority: next.

#### M10 — Dispatch CLI tự lái Work lifecycle (`pick`/`return` subprocess) và ghi Work event log
- `cli.mjs:1248-1360` `fanoutBatchExecutorCli`: `listWork` + `hasWorkerSlotRoom` (OccupancyPort là của Work Driver, boundary-map §9), `execFgos(['pick'])` `:1307`, `execFgos(['return', '--worker-verified-sha'])` `:1342`; `appendEvent` `:25` → `executor.dispatch` vào event log (`:520-522, :1847`), evaluator `src/report/dispatch-confidence.mjs:13` đọc lại từ Work log thay vì run dir. Vi phạm bằng placement (qua public door nên không hỏng truth) + cycle process-level Dispatch→Host→Work→Dispatch mà import-graph test không thấy; `pick` OK nhưng `executeExecutorCli` throw → item claimed không `return` (`:1353` chỉ report). Fix: dời `fanoutBatchExecutorCli` sang Work Driver layer; grep-test `src/runner/dispatch/**` không tham chiếu `'pick'/'return'/appendEvent`; docs ghi rõ exception event log. Priority: next.

#### M11 — `decide`/`execute`/`log` là surface CLI chưa đăng ký, ngoài envelope; `decide` drop `reasonCodes/blockedReason`; selector/exit code không nhất quán
- `decideExecutorCli` `cli.mjs:1236-1244` bỏ `reasonCodes`/`blockedReason` (plan có `plan.mjs:157-167,255-262`); `cli.mjs:1543`, `assignment-runner.mjs:1433` đọc `plan.dispatch==='human-only'` — field compiler không bao giờ emit (dead). Live: governance-blocked → `{"mechanism":"unavailable","configured":true}`, unregistered → `configured:false` — chỉ khác một bit không mang nghĩa "why". Không entry `decide/execute` trong `command-registry.mjs`; output raw JSON, lỗi exit 1 không phân loại; profile warning `gitnexus` in mỗi lần hook chạy `decide`. `inspect --run` vs `show-run --run-id` (`--run` bị báo "requires a runId" dù đã cho id); not-found exit 0 (inspect) / 1 (show-run/watch/recover) / 4 (coordination recover); `fgos dispatch decide …` báo "requires a runId" vì `requireField` (`bin/fgos.mjs:2982`) chạy trước throw unknown-sub (`:3031`); `reconcile --run X` không `--action` trả lời về cwd lock (`reconciliation-planner.mjs:263` default `clear-cwd-lock`, bỏ qua `--run`); `--cwd/--dir` ba nghĩa giữa hai binary. `dispatch.mjs reconcile` crash `ReferenceError: positional` (`cli.mjs:1870`). Fix: pass `reasonCodes/blockedReason` (additive); xoá dead `dispatch` check; register `fgos dispatch decide|execute|log` bọc `fgos.v1`; alias `--run`; not-found → một categorised code; `reconcile plan` có `--run/--assignment` mà không `--action` → validation error; sửa thứ tự unknown-sub; `?? undefined` cho `positional`. Priority: next.

#### M12 — PolicyPatch: 4 allow-list, precedence bị misattribute, `cliOverride` là misnomer
- `POLICY_PATCH_FIELDS` `schema.mjs:125` (7 key) / resolver đọc 14 key (`assignment-policy.mjs:148,223,236,260,416,436,486`) / `ALLOWED_POLICY_KEYS` `registrations.mjs:853` (5) / `execution-contract.mjs:325-333` (`minTier` only). Resolver chỉ nhận 3 input (assignment.policy, work tier/risk, cliOverride); rung runner/definition/operation/role/actor được `mergePolicyStack` (`schema.mjs:312`, gọi từ `session-engine.mjs:891, 2885-2905`) gộp rồi giao dưới tên `cliOverride` với `policyProvenance` chỉ cho tier/persona/executor (`assignment-policy.mjs:188,204,301`); `mode/minRigor/reasoningEffort/fallbackExecutors/visibility/repeatMode` stamp `{scope:'cliOverride'}` bất kể nguồn. Ba precedence list khác nhau (`assignment-policy.mjs:3-8`, `schema.mjs:299-301`, docs `:158-167`). Fix: một allow-list ở contract doc, rename `cliOverride` → `policyInputs` (alias một release), provenance mọi field. Priority: next.

#### M13 — Doc claim sai chiều thực thi và slice status
- `fallbackExecutors` "reserved-not-executed" (`dispatch-control-plane.md:182, :343-344`; comment `assignment-policy.mjs:313-316`, `schema.mjs:277-280`) → đã chạy cross-provider (`assignment-runner.mjs:1177-1180, 1206-1318`; test `assignment-dispatch.test.mjs:1300-1336` claude→openai-codex). S3 "Implemented (`recovery.mjs`)" → `assess()` 0 production caller (chỉ `driver.assess` của confinement trùng tên); `resolveFallback` chỉ nối ở capacity-refusal lúc launch → effect boundary reserved-not-executed. "recover re-enters compiler/confinement/adapter" → sai (xem C1). Priority: now (docs).

#### M14 — Evaluator hardcode `agent-report.md` phẳng; herdr-spawn outbox không bao giờ validate
- `session-engine.mjs:4088-4090` hash `runs/<NN>/agent-report.md`; herdr worker ghi `outbox/report-N.md` (`worker-artifacts.mjs`); `sha256OfFile` ENOENT → undefined → stale → `no-consensus`. Fix: dùng `resolveWorkerArtifactPath`. Priority: next.

#### M15 — Herdr: unconfined path bind `paneId` sau `agent start`; resend có thể giao brief 3 lần; ack timeout báo `worker-spawn-fail`
- `herdr-round.mjs:1497-1515` (persist sau start; crash giữa chừng → pane sống không bind); `:814-826` `ackSeen` chỉ từ `outbox/ack-1.json` → agent hoàn thành mà không ghi ack bị re-brief tới 2 lần; `deliverBrief` `:700-713` timeout không result → `worker-spawn-fail` (docs: unacked send là `unknown`, never launch-failed). Tên agent normalize 32 ký tự middle-trim (`herdr-agent.mjs:49-60`) có thể collide id dài. Fix: persist paneId trước prompt; coi `working` observed sau send là ack cho mục đích resend; delivery `unknown` typed. Priority: next.

#### M16 — Doctor/setup registration gap
- Attestation store dir (`XDG_STATE_HOME`/`FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`) không check (`grep attestation registrations.mjs` = 0); `herdr-available` probe literal `'herdr'` (`registrations.mjs:3535,3612`) trong khi dispatch dùng `FGOS_HERDR_BIN` (`transport.mjs:800`); `FGOS_HERDR_ANCHOR_PANE`, `FGOS_HERDR_MODEL` (herdr-plugin `pick.rs:107-109`, model pin ngoài runner config) không diagnose; provider-capacity runtime dir và attestation store `os.homedir()`-only, không project override (trái gate "project overwrites global"). Fix: check `confinement-attestation-store-writable`, cùng helper resolve binary, ghi nhận hai state dir global-only trong `docs/specs/distribution.md`. Priority: next.

### Low

- **L1** `expectedRunId` đẩy `attempt` nhảy cóc để lại gap cho caller unfenced (`assignment-runner.mjs:1025-1033`); session ledger và assignment ledger có thể bất đồng "current". Fix: refuse `expectedRunId` có attempt ≠ next computed. later.
- **L2** Session-engine claim file (`retry-N.claim`, `dispatch.claim`) span provider I/O và cần xoá tay sau crash (`session-engine.mjs:4796-4806`; message hướng dẫn "remove <path>") — trái §6 và X07. Fix: thay bằng admission ledger (M1). later.
- **L3** Receipt poll 20 ms `existsSync+readFileSync` (`assignment-runner.mjs:2271-2290`); transport 50 ms (`transport.mjs:427-431`); herdr `agentGet` 500 ms + `paneProcessInfo` mỗi tick ≈ 2-4 sync `herdr` spawn/giây/round, block event loop → round đồng thời serialize. Fix: back-off/`fs.watch`; skip `paneProcessInfo` khi `working`. later.
- **L4** Import cycle `config.mjs:39 → transport.mjs → resolve.mjs → config.mjs` (sống nhờ ESM live binding; top-level use `EXECUTOR_ADAPTERS` sẽ TDZ). `authority.mjs:7,16,23-30` import transport/cli-spawn-supervisor/herdr-agent — confinement phụ thuộc adapter nó gate; `herdr-round.mjs:47-53` import proof helper từ adapter kia. Fix: leaf module cho `DispatchError`, `resolveExecutorEnv`, proof helpers, `EXECUTOR_ADAPTERS`. later.
- **L5** `prepare.mjs` không bound payload ("never truncated" `:45-46`), `prepareDispatch` 0 caller; cli-spawn đặt cả prompt vào một argv element (`transport.mjs:167`) → Linux MAX_ARG_STRLEN 128 KiB → `E2BIG` hiện thành `worker-spawn-fail` không gợi ý; herdr brief lặp claim schema với hai result path mâu thuẫn (`assignment.mjs:715-731` `agent-result.json` vs `brief.mjs:83-110` `outbox/result-1.json`), `effectiveContract` không truyền vào `renderBrief` (`herdr-round.mjs:1060`). Fix: một schema, một path; size hint. later.
- **L6** Resume chấp nhận `result.json` bất kỳ trong run dir không so `runId` (`assignment-runner.mjs:1841-1846`, `run-result.mjs:540-575`); superseded controller's late result bị **refuse**, không "stored and validated" như docs #16 (`:2410-2414, 2712-2716`). Quyết định rồi align. later.
- **L7** Attribution trang trí: `proven` unreachable (call site `assignment-runner.mjs:2648, 3017` không truyền hash/attestation), `evaluateAttributionPolicy`/`attributeClaimEvidenceRefs` 0 caller, `inherited` không tồn tại, committed work → `attribution:[]`; `cwd` vs `effectiveCwd` lệch ở `computeChangedFiles` (`:2546, 2549`). later.
- **L8** In-process handback (Task/API/MCP) không mở Run, không nhận result (`cli.mjs:748-830`, dir dưới `os.tmpdir()`); `gatewaySessionId` không producer nào set (`herdr-round.mjs:1462-1469`); `resolveFallback` đọc `replacement-authority--<id>.json` từ outbox worker-writable (`recovery-planner.mjs:294-299`) — trái §7 "never worker-supplied ownership"; hiện không consumer. later.
- **L9** Refusal-path attestation write failure che typed refusal (`attestation-store.mjs:166` throw trước `DispatchError`); `getBackendDriver` untyped trên direct door (`authority.mjs:635`); `private-home` grant "satisfied" nhờ allocation không nhờ use (`claude-cli-bwrap` không `resourceBindings` HOME); driver `container/remote` không bao giờ pass required (`authority.mjs:94-97`) → extension contract khai báo, không thực thi. later.
- **L10** Provider-family warning `gitnexus` in mỗi `decide` (một lần/process; multi-verb flow lặp vì `bin/fgos.mjs` 9 load site) — comment `config.mjs:808-822` tự ghi "unresolved". Fix: skip khi mọi invocation non-cli. later.
- **L11** Hai `reconcileCliSpawnRun` cùng tên (`cli-spawn-supervisor.mjs:1035` vs `assignment-runner.mjs:3079`), ba vocabulary reconcile (`waiting`/`running` đồng nghĩa); ba bản copy `/proc` start-time parsing để thoả import ban; `DRIVER_FRESH_MS` lặp; supervisor arm hard timeout hai lần (`cli-spawn-supervisor.mjs:568-590, 700-722`); cli-spawn liveness chỉ theo supervisor pid, không so `host`/`processStartTime` ở branch không binding (`:1140-1146, 1177-1183`). later.
- **L12** `openDispatchRun` (`cli.mjs:259-283`) ghi `run.json` không admission cho path prompt-only; hai shape `run.json` cùng layout. Fix: stamp `contract:'dispatch-run.legacy'`. later.
- **L13** herdr-plugin `pick.rs:107-109, 254-358` launch `claude` interactive với model pin riêng (`FGOS_HERDR_MODEL`, default sonnet) — host convenience, không phải Assignment dispatch; ghi nhận trong docs. later.

---

## Contract Audit

| Contract | Owner | Producer | Consumer | Required invariants | Ambiguity or gap | Evidence |
|---|---|---|---|---|---|---|
| Assignment (declared) | Assignment builder | `buildDeclaredAssignment` | executeAssignment, compileDispatchPlan, operation-choice | immutable; stage/operation/taskSpec tồn tại; provenance.kind stamped; mutation/evidence.required stamped | `policy` không shape-validate (spread verbatim `assignment.mjs:364`); `_fromYaml`/`_allowLiteralModel` underscore flag; `dispatchedRuns` append RMW non-atomic | `assignment.mjs:302-371`, `assignment-normalizer.mjs:103-187`; docs `assignment-run-runresult.md:35-37` nói "not started" — **stale, đã implemented** |
| Assignment (inline) | execution-contract | `buildInlineAssignment` | như trên | strict allow-list; `mutating` chỉ khi engine stamp | Tốt nhất nhóm | `execution-contract.mjs:256-333`, `assignment.mjs:494` |
| DispatchRequest | (doc-only) | caller | `compileDispatchPlan(cfg, opts)` | — | options bag 13 key không validate; `work`/`assignment` cross boundary (`plan.mjs:110`); 5 selector cho 2 identity | `plan.mjs:36-84`; docs tự nhận "no typed object" |
| PolicyPatch | Definition schema + resolver | FlowDefinition YAML, workflow YAML, coordination verbs, CLI flags | `mergePolicyStack` (coordination) → `resolveAssignmentDispatchPolicy` | minTier/repeatMode raise-only; most-specific-wins; provenance per field | 4 allow-list; `preferInvocation` mất khi merge (H12); rung definition→actor tới resolver dưới tên `cliOverride`; provenance chỉ 3 field | `schema.mjs:125,272-345`, `assignment-policy.mjs:132-563`, `session-engine.mjs:2885-2905` |
| DispatchPlan | plan compiler | `compileDispatchPlan` | assignment-runner, cli decide/fanout, resolveFallback | governance-blocked never dispatchable; sole execution chooser | 3 early-return shape thiếu policy/governance nhưng dispatchable (H6); `capability` 3 cách derive; consumer đọc `plan.dispatch` không tồn tại; không validate anywhere | `plan.mjs:117-166, 331-348`, `cli.mjs:1543`, `assignment-runner.mjs:1433` |
| Execution capability / invocation contract | config validator | `runner.executors/capabilities` | resolve, transport | kind agent\|tool; via cli\|task\|mcp\|api; carries enum; overrides allow-list | observability/contactability, mode-specific reachability **proposed**, không có trong code; `carries` gate không thoả được qua plan preview (`plan.mjs:234`) | `config.mjs:387-1076, 1236-1264`, `transport.mjs:210-222, 883-912` |
| Confinement request / plan / attestation | confinement authority | `buildConfinementRequest`, `authority.mjs` | authority, store, adapters | request keys closed; attestation phase/outcome/channels complete; adapter chỉ resolve trong `executeThroughConfinement` | `backendId` resolve lệch hai door (H10); attestation Assignment door sai outcome (H9); `permissionMode` vắng; envelope chứa full env (H11); plan/finalization không schema validator | `request.mjs:20-31, 405-418`, `authority.mjs:114-215, 638-655, 1094-1104, 1168, 1349-1360` |
| Run record + admission/lock | Run repository (assignment-runner + run-lock) | `admitRunAttempt`, `acquireRunControl` | reconcile, recover, inspect, session-engine | append-only ledger; monotonic attempt; live pid never reclaimed; at most one un-settled Run | holder `{id,pid}` (H1); fencing opt-in `retryId` (M1); `phase/delivery` static (`:1571-1572`); không `revision` CAS/`admissionKey`/`writerRuntime`/`settlement`; refusal prose (M2); `run.json` non-atomic rewrite (H3) | `run-lock.mjs:275-340`, `assignment-runner.mjs:938-1176, 1563-1585` |
| RunObservation | runtime-inspection | `inspectDispatchRuntime` | inspect CLI, planners | read-only; cannot settle/retry/cancel/authorize | vocabulary `phase/delivery/resourceState/evidenceCompleteness` ngoài closed set (M9); `coordinationIds` luôn `[]` cho assignment/cwd selector | `runtime-inspection.mjs:108-131` |
| Reconciliation plan | reconciliation-planner | `planReconciliation` | `reconcile apply` | 4 action only; CAS digest+TTL; never launch/signal | `preconditions` là string; không `reasonCode`; default action `clear-cwd-lock` bỏ qua `--run` (M11); apply lock không reclaim (M9) | `reconciliation-planner.mjs:263-317, 537-541, 609-688` |
| Recovery snapshot / action plan | recovery-planner + recover verb | `plan/checkApply/collectEvidence` | `dispatch recover` | pure planner; idempotent action key; never worker-supplied ids | §7 shape `{outcome, subjectRefs, reasonCode, nextCheckAt}` **proposed**, không implement; liveness collected không dùng (C1); replacement-authority từ outbox (L8) | `recovery-planner.mjs:91-140, 286-299`, `recover.mjs:205-335` |
| RunResult v2 | run-result normalizer | `normalizeRunResultV2` qua runner | session-engine, run.mjs, inspect, operation-choice, reconcile | one immutable terminal truth; classification separate; compat mismatch → contract-corrupt fail closed | consumer session-engine không validate (H4); write non-atomic (H3); synthesized claim (M4); `ProviderOutcome` không tồn tại trong code; runId không so với dir khi resume (L6) | `run-result.mjs:244-254, 381-397, 559-573`, `session-engine.mjs:275-316` |
| Handoff Dispatch → Run Result Evaluator | — | dispatch (`classifyRunEvidence` → `confidence`) | session-engine quorum/fan-in, `fgos return` (ladder) | separation receipt vs semantic judgment | Dispatch **tính** `confidence` (mechanical: exit/claim/git delta/report) và evaluator coi `verified`=accepted — chấp nhận được như receipt grade nhưng từ "confidence" mời đọc sai; ladder `execute` → `verifiedSha` bỏ verify (H5); evaluator hardcode report path (M14); dependency direction đúng (engine import dispatch, không ngược) | `assignment-runner.mjs:631-744`, `result-ladder.mjs:58`, `session-engine.mjs:3508-3515, 4088` |
| Provider capacity state / selection / fallback record | provider-capacity | acquire/release/quarantine | rank/inspect/doctor; runner evidence | quarantine w/o until ⇒ unhealthy; lease reclaim needs dead-run proof | C2; non-atomic `state.json`; `credentialProvisioned:false` thường (H8); `fromProvider→toProvider` không có field riêng | `provider-capacity.mjs:182-340`, `assignment-runner.mjs:1272-1319, 1793` |
| Trust seed | trust-store (claimed single door) | herdr-round, worker-home | herdr agent | derived from trusted root (B1); removal on teardown | agy misrouted, không removal, hai writer (H7) | `trust-store.mjs:277-372`, `herdr-round.mjs:578-597`, `worker-home.mjs:130-145` |
| Invocation receipt / locator / delivery | adapters | cli-spawn-supervisor, herdr-round | authority, reconcile | receipt digest-bound to envelope; binding before delivery; delivery tri-state | delivery tri-state **proposed** (không field); herdr unconfined bind sau start (M15); command projection ghi không token (H13); 3 vocabulary reconcile | `cli-spawn-supervisor.mjs:384-398, 499-520, 992-1021`, `herdr-round.mjs:1325-1330, 1497-1541, 1742-1759` |

---

## Architecture Quality Audit

| Concern | Current design | Evidence | Strength | Drift or risk | Smallest corrective action |
|---|---|---|---|---|---|
| Dependency direction Work/Coord/Host → Dispatch → RunResult → Evaluator | Module-level một chiều: dispatch không import coordination/verbs/bin; engine import dispatch | `session-engine.mjs:76-80`, grep dispatch imports | Đúng ở cấp import; import-graph test pin reconcile | Reverse read: dispatch → `state/workflow-stage-graphs`, `agent-roster`, `listWork`, `hasWorkerSlotRoom` (`cli.mjs:20-39`, `resolve.mjs:13`, `prepare.mjs:35`); reverse write: `appendEvent` + `execFgos pick/return` (process-level cycle); `operation-choice.mjs` import intake/worktree; coordination store dùng run-lock primitive (placement smell, không cycle) | Dời `fanoutBatchExecutorCli`, `executorIdForWork`, `buildPrompt(workItem)` sang Work Driver cùng operation-choice; leaf `generation-ledger.mjs` cho primitive dùng chung; docs forbidden-list ghi "target" + exception |
| Sole execution chooser / no second dispatch path | Mọi executor spawn qua `buildConfinementRequest → executeThroughConfinement → adapter`; Gate B3 | inventory 06 §2, 08 §2; `dispatch-production-call-sites.test.mjs` | Giữ vững; cohort-planner chỉ re-read | Hai tầng door (`executeExecutorCli` không `executeAssignment` — RUL68 có chủ đích) với hai chế độ cli-spawn khác bảo đảm (supervised chỉ khi `assignmentLaunchContext`, `authority.mjs:846`); in-process handback không có Run; herdr-plugin driver launcher pin model riêng | Docs nêu hai mode; `openDispatchRun` mint launch context để `spawnWorker` cũng supervised; ghi nhận host launcher |
| Confinement là gate duy nhất trước adapter | Adapter fn chỉ resolve trong `executeThroughConfinement` `:832-850`; refusals typed; không kill switch | 03 §2 | Fail-closed thật | `authority.mjs` import adapter layer nó gate (layering inversion); hai door ~200 dòng trùng + drift (backend default, store-isolation, claims-mismatch, driver-error wrap, cleanup closure); `required` hôm nay = host-write-deny only; `RunHandle` PROPOSED nhưng docs viết như invariant | Một `assessAndPrepare(request)` cho cả hai door; leaf cho `DispatchError/resolveExecutorEnv/proof helpers`; docs nói đúng phạm vi `required` |
| Run admission là authority duy nhất | Ledger append-only hardlink + control epoch/token; retry declaration ở coordination store | `run-lock.mjs`, `admitRunAttempt`, `store.mjs:2196-2250` | Đúng hướng, không TTL takeover | Bốn "current Run" source: admission ledger, `runs/NN` dir, session `run-retried` generations, `assignment.json.dispatchedRuns`; session claim file là exclusivity thứ hai; fencing opt-in | Unfenced branch refuse khi current chưa settle + holder alive/unknown; thay claim file bằng ledger; `expectedRunId` không được adopt attempt lệch |
| Policy resolution một chỗ | `resolveAssignmentDispatchPolicy` + `compileDispatchPlan` đọc `compiledPlan.policy` (không gọi resolver lần hai ở runner) | `assignment-runner.mjs:1422-1438` | Đúng | Ba executor substitution (read-only redirect, capacity fallback, `policyForActualExecutor`) tự derive provider/model; `cli.mjs` tính model rồi resolver post-hoc; capability `overrides.providerModel` đổi family; PlacementPolicy shadow | Một primitive "rebind executor → recompile plan" (`resolveFallback` đã là) cho cả ba; tách lookup provider khỏi family |
| Adapter/Herdr không sở hữu Run truth | Herdr không ghi `result.json`; visibility là sibling field | `visibility-session.mjs`, `show-run.mjs:125-131` | Đúng cho result | Herdr ghi command projection không token (H13); `visibility-session.reconcileRun` fire-and-forget dynamic import reconciler có thể ghi result.json (`:283-330`, error nuốt) | Route qua `commitCommandOutcome`; bỏ courtesy reconcile hoặc ghi rõ không dựa vào |
| Inspect / reconcile / recover tách mutation authority | inspect/show-run/watch 0 write; reconcile 4 action + CAS 2-process; recover CAS epoch | 07 §2 | Rất tốt cho inspect/reconcile | recover là cửa yếu nhất cai quản cùng file claim với luật yếu hơn planner (C1); "recover re-enters gates" sai; 3 read door (inspect/show-run/recover observe) 3 shape | Một proof set cho claim; recover observe = `inspect --run --recommend`; docs sửa |
| Extension points (executor, mechanism, provider, backend, recovery adapter) | Config validator một chỗ; backend driver registry type whitelist | `config.mjs:1344`, `backend-registry.mjs`, `authority.mjs:94-97` | Executor/mechanism có validation | Backend `container/remote` không thể pass required (khai báo không thực thi); provider vocabulary tách; recovery adapter chỉ cli-spawn/herdr; `via:'api'` validate nhưng Gate B3 refuse | Docs ghi reserved; `normalizeProviderFamily`; test chứng minh container không pass |
| Hidden coupling | env `FGOS_HERDR_ANCHOR_PANE/BIN`, `FGOS_CONFINEMENT_*`; fs layout `controller/commands` contract string quyết định reconcile fn; ba candidate dir worker artifacts; retryId aborted marker path biết bởi store và runner; global-only state dirs | 08 §3, 04 §4 | Có doctor cho phần lớn | attestation store không doctor; `herdr-available` probe literal; project-over-global không áp cho state dir | Đăng ký doctor; helper resolve binary chung; docs distribution ghi global-only |
| Concurrency & distributed execution | Lock/ledger cục bộ; no session lock spans I/O (store.mjs:2420) | 04 §1 row 10 | Đúng cho lock | Claim file span I/O; PID-only identity; sandbox không thấy host process; capacity lock không reclaim | H1/M1/L2/C2 fixes |
| Good decisions unprotected | Gate B3, governance-blocked-no-policy, ledger append-only, inspect read-only, reconcile CAS | tests nêu ở 01/07 | — | `--work` governance, `preferInvocation`, decide blocked-vs-unregistered, assignment-door attestation, resume-with-live-worker, control reclaim identity đều không test | Test gaps §dưới |

---

## Simplicity Audit

| Area | Complexity that earns its keep | Accidental complexity | User/reader impact | Simplification proposal | Risk |
|---|---|---|---|---|---|
| `assignment-runner.mjs` (3377) | Admission ledger; control fencing; evidence classification | Sáu concern cùng file (admission, policy/redirect, capacity fallback, launch 3 adapter, settlement ×3 bản gần trùng `2420-2748/2749-2844/2845-3078`, reconcile cli-spawn) với atomicity drift | Sửa một chỗ quên hai chỗ (H3) | Tách `settlement.mjs` (một pipeline) và `reconcile-cli-spawn.mjs` (import-graph test đã muốn) | Thấp nếu giữ export; test hiện dựa vào tên |
| Confinement doors | Attestation + probe + plan | Hai door ~200 dòng trùng, drift 5 điểm; parser argv bwrap để suy `hostWrite deny` khi driver đã biết nó emit gì; legacy flag vs policy control song song | H9/H10; bypass pairing sai vocabulary | `assessAndPrepare` chung; driver claims → attestation, xoá parser; một vocabulary posture | Trung bình (test p03/p04/p05 lớn) |
| Selector/request surface | Hai identity capability/executor | 5 selector (`executor/assignment/work/purpose/adHocAgent`), `--needs-soul` đổi câu trả lời cho cùng target, `for`/`purpose`/`capability`/`executor.for` cùng nghĩa, `cliOverride` là cả stack | Operator không đọc được "why" từ JSON | Typed `DispatchRequest{target, policyInputs, provenance}`; `decide` thêm `reasonCodes/blockedReason` | Thấp (additive) |
| Policy shapes | Precedence + provenance | 4 allow-list, 3 precedence list, `preferInvocation` rơi | H12, M12 | Một list ở contract doc, table-driven test mọi key sống sót merge | Thấp |
| Provider/model derivation | Resolver | 3 derivation ngoài resolver, 2 provider vocabulary, PlacementPolicy shadow + shadow fallback không dùng | M5/M6 | Một `deriveProviderFamily(entry, cmd)`, xoá shadow fallback | Thấp |
| Reconcile/recovery | Pure planner + CAS | 2 `reconcileCliSpawnRun` cùng tên, 3 vocabulary, 3 copy `/proc` parser, 3 read door, 2 luật cho `dispatch.claim` | C1, M9, M11 | Leaf `process-incarnation.mjs` (fs-only, không widen graph); một reconcile result contract; recover xoá claim qua planner | Thấp |
| Invocation adapters | Receipt/binding/tamper check | `transport.cliSpawnAdapter` direct body trùng supervisor (timeout/idle/maxBuffer 2 bản, receipt khác nhau); herdr-round 2234 dòng gộp round interactive + S2 proof layer, receipt publication trùng 2 branch | M3/M4/M15 | Supervisor cho mọi cli-spawn; tách `herdr-reconcile.mjs` | Trung bình |
| Result/evidence | v2 normalizer, legacy interpret contained | 3 ladder (`classifyRunEvidence`, v2 fallback, `execute` token ladder); 2 claim-fallback object; attribution decorative | H5, M4, L7 | Ladder `execute` gate theo status; attribution khai `correlation-only` hoặc nối attestation | Thấp |
| CLI surface | `fgos dispatch` registry | `decide/execute/log` ngoài registry/envelope; `--cwd/--dir` 3 nghĩa; `--run` vs `--run-id`; exit code 0/1/4 cho not-found | M11 | Register + alias + một categorised code | Thấp |
| Docs | Subcomponent map (uncommitted) là bước đúng | Proposed viết như shipped ở ≥10 chỗ; hai bản docs/architect vs docs/platform lệch banner; reading-map trỏ bản cũ | Người mới tin sai | Mục "Documentation Corrections" | — |

---

## Performance And Token Audit

| Path | Current cost or risk | Evidence | Safe optimization | Benchmark or measurement needed |
|---|---|---|---|---|
| Required confinement launch | 8 probe + `bwrap --version` = 9 `spawnSync` + mkdtemp tree mỗi launch; ~213 ms đo; doctor lặp | `authority.mjs:752, 1287`, `probes/harness.mjs`, reviewer [run] | Cache `{fingerprint → passedAt}` TTL trong attestation store (fingerprint đã có `computeProbeFingerprint`) | Đo p50/p95 launch với/không cache; xác nhận cache không che probe fail sau upgrade bwrap |
| Herdr polling | `agentGet` 500 ms + `paneProcessInfo` mỗi tick → 2-4 sync `herdr` spawn/s/round; block event loop; round đồng thời serialize | `herdr-round.mjs:345, 716-728, 790` | Back-off 1-2 s sau ack; skip `paneProcessInfo` khi `working` | Đếm spawn/round 30 phút; đo latency round đồng thời |
| Receipt poll | 20 ms (`assignment-runner.mjs:2271-2290`), 50 ms (`transport.mjs:427-431`) `existsSync+readFileSync` | code | `fs.watch` receipts dir hoặc back-off 250 ms sau 1 s; supervisor `close` đủ | Không cần; thấp |
| Supervisor tee | 2× bytes, nội dung sai (M3) | probe [run] | Chỉ IPC | — |
| Inspect/reconcile scans | `allRuns(root)` full readdir+parse mọi `run.json` mỗi call; plan/apply gọi inspect 2-3×, apply re-derive dưới lock → 4-6 full scan/apply; `--cwd` O(runs×assignments); `--cwd` embed mọi RunResult lịch sử | `runtime-inspection.mjs:118`, `reconciliation-planner.mjs:286-400` | Memo per-process trong một verb call; `--cwd` không embed historical results mặc định | Đo ở 1k+ runs (giả thuyết pathological) |
| Config load | `loadRunnerConfigFromDir` = read+parse+merge+validate; `decide` 1 lần (đo: 1 warning line); `bin/fgos.mjs` 9 site | `config.mjs:262-279`, 01 §5 | Skip provider-family warning cho executor non-cli; memo per-process | Đo multi-verb flow (coordination run → dispatch) — giả thuyết 3+ load |
| Plan compile | 2× `resolveAssignmentDispatchPolicy`, 3-4× `resolveExecutorAndOverrides`, 3 serialisation plan digest | `plan.mjs:98, 302`, `assignment-runner.mjs:1550-1569, 2085` | Giữ policy từ lần 1; digest một lần | Không đáng — micro giây |
| Prompt/context | Không bound (`prepare.mjs:45`); herdr brief lặp claim schema ~40 dòng với 2 result path mâu thuẫn; cli-spawn prompt trong một argv → 128 KiB `E2BIG` | `assignment.mjs:715-731`, `brief.mjs:83-110`, `transport.mjs:167` | Một schema, một path; size hint trước spawn; file-pointer cho cli-spawn như herdr | Đo prompt size phân phối thật; xác nhận E2BIG threshold |
| Stdout/RunResult | maxBuffer 10 MiB; RunResult chỉ lưu path log — tốt | `cli.mjs:341, 918`, supervisor `731-740` | — | — |
| **Tối ưu KHÔNG chấp nhận** | Cache attestation/plan qua Run (mất attribution); bỏ probe khi fingerprint đổi; bỏ digest re-check để giảm I/O; merge receipt của controller superseded | — | — | — |

---

## Test Gaps

Ưu tiên giảm dần; mỗi mục là test còn thiếu, không phải test đã pass.

1. **Resume với worker sống → zero new spawn** qua `executeAssignment` (cli-spawn và herdr), cả từ `dispatch recover resume-driver` → `coordination run` (C1). Assert không có `controller/commands` thứ hai, không spawn.
2. **Crash windows**: giữa control acquire và command projection; giữa projection và spawn; giữa settle write và `markRunSettled` (torn `result.json`/`run.json`) → refuse/park, không relaunch (H3).
3. **Concurrent unfenced admission** (`execute --assignment` ×2, operation-choice ×2) — hôm nay tạo hai Run; pin hành vi mong muốn (M1).
4. **Control reclaim identity**: dead pid reclaim; reused pid (same pid, khác startTime) reclaim; `/proc` unreadable → held (H1). X01 TTL race đầy đủ.
5. **Post-admission `RunnerConfigError`** qua engine → `dispatch.claim`/`retry-N.claim` còn nguyên (H2).
6. **Provider capacity**: fault quota qua `executeAssignment` → `quarantine.until` có; auth → `manual-clear`; classifier negative "Unexpected token … failed" với/không `provider`; stale `state.lock` pid chết reclaim, pid sống giữ; corrupt `state.json` không brick; inventory `openai-codex` vs executor `openai` cùng provider; unconfined cli-spawn với lease → refuse hoặc `credentialProvisioned:true`; resume re-acquire sticky (C2, H8, M6).
7. **Provider/model/account mismatch**: capability `overrides.providerModel` vs `disallowedProviders` đánh giá trên family đăng ký; `policyForActualExecutor` parity với resolver; fallback evidence có `fromProvider/toProvider` (M6).
8. **Confinement**: assignment door tới `completed` assert `outcome==='enforced'`, `backend.id==='bwrap'` (H9); real-config capabilities qua `executeExecutorCli` (H10); p04 R8 chạy mặc định khi bwrap có; `finalize` với `timeout` receipt + reaper wired (M8); attestation-store write fail giữ typed refusal; `container` driver không pass required; `permissionMode:'bypass'` + policy private home pass pairing.
9. **False success / late result**: evaluator nhận `result.json` contract-corrupt (status done / classification failed) → failed (H4); `buildDispatchResult` `[DONE]` + `status:1`/`timeout` không `verifiedSha` (H5); no-claim run → `agentClaim` null, basis không `valid-agent-result-claim` (M4); stale artifact mtime < launchedAt bị bỏ; superseded worker late result: retained per Run, never linked (X03); attempt N artifact byte-identical sau N+1.
10. **Inspect/reconcile mutation boundaries**: `recover resume-driver` refuse session-owned Run / heartbeat fresh (C1); reconcile lock dead-holder reclaim (M9); RunObservation vocabulary assertions; `watch` với `result.json` + `status:running` thoát.
11. **Recovery/fallback effect-unknown**: `assess()` không production caller → test không thể tồn tại; cần quyết định nối hoặc ghi reserved (M13); E-a..E-d/E-f, F-d, X05, X10, X11 MISSING.
12. **Herdr visibility vs Run truth**: round dưới token superseded không ghi đè command projection (H13); unconfined crash giữa `paneSplit` và projection → next attempt; resend không triple-deliver khi `working` observed; `gatewaySessionId` populate hoặc bỏ.
13. **Invocation/CLI**: `startSupervisorProcess` arg order + single delivery (M3); `preferInvocation` end-to-end declared-protocol + agent-led (H12); `--work` plan có `governance.egress`, global executor cross-provider không `allowCrossProvider` → `unavailable` (H6); `decide` JSON blocked ≠ unregistered (M11); `bin/fgos.mjs dispatch` unknown-sub, `--run` alias, exit code not-found (M11); `node dispatch.mjs reconcile` không arg; argv size limit direct-spawn; `dispatch-production-call-sites` bổ sung `fanoutBatchExecutorCli` + `dispatchDeclaredOperation` → adapter.
14. **Boundary pin**: grep-test `src/runner/dispatch/**` không tham chiếu `pick`/`return`/`appendEvent` (M10); table-driven test mọi key `POLICY_PATCH_FIELDS` sống sót merge (H12); `policyProvenance` cho mode/minRigor/reasoningEffort/fallbackExecutors (M12); doctor `herdr-available` và adapter cùng binary dưới `FGOS_HERDR_BIN` (M16).
15. **Trust store**: `kind:'agy'` ghi `settings.json.trustedWorkspaces`, không `~/.claude.json`; teardown xoá entry (H7).

---

## Documentation Corrections

Không mô tả proposed/deferred/reserved-not-executed như đã triển khai. `[U]` = mục uncommitted trong working tree.

**`docs/platform/agent-coordination/architecture/dispatch-control-plane.md`**
- §PolicyPatch "Implementation status" (:177-183): "resolveAssignmentDispatchPolicy implements this exact precedence" → "resolver nhận 3 input (Assignment policy, Work tier/risk, request override); rung runner/definition/operation/role/actor được `mergePolicyStack` (`src/runner/definitions/schema.mjs`) gộp trong `session-engine.mjs:2885` và giao qua `cliOverride` + `policyProvenance` (chỉ tier/persona/executor có provenance thật)". "`fallbackExecutors` remains reserved-not-executed" (:182 và :343-344) → "executed: `attemptProviderCapacityFallback` một lần khi capacity refused, governed by `executorPreference` + `resolveFallback`; candidate cross-provider được phép khi đăng ký và governance-clean (33490c36)".
- §Merge rules (:161-163): thêm ngoại lệ capability `overrides.providerModel` và `cliOverride.providerModel` override family; bare-shape entry default `claude`. "Dispatch does not define a second policy shape" (:147-150) → "4 allow-list hiện tồn tại; unification open".
- §DispatchPlan (:203-231): status "Implemented for dispatchable plans" → partial; thêm "`--work` selector không executor đăng ký trả plan dispatchable **không** policy/governance (`plan.mjs:117-135`)".
- §Routing Identities/DispatchRequest rules (:83-87, :127-129): "Work/workflow/task/skill objects never cross this boundary" → target state; hôm nay `workItem` cross (`plan.mjs:110`), `resolve.mjs:13`/`assignment.mjs`/`prepare.mjs:35` import workflow-stage graph.
- §Component-Internal Ownership forbidden list (:276-289): ghi "target"; exception hiện tại: `cli.mjs:1307,1342` (`pick/return`), `cli.mjs:21-22` (roster/stage), `appendEvent` (`cli.mjs:25`); `cohort-planner.mjs:151` gọi `resolveExecutorConfig` (Component-Outer Note :455-457 nói "none of them calls" — sai).
- `[U]` §Planning And Admission diagram (:300-331): Capacity lease xảy ra **sau** Run admission và sau Plan (`assignment-runner.mjs:1635`), không upstream Governance; bỏ cạnh `Capacity → Governance`, thêm `Capacity refusal → fallback recompile (Governance)`. "PlacementPolicy binds" (:339) → "verifies legacy binding, yields on divergence (shadow)". :342 "Neither mechanism may select an arbitrary cross-provider fallback" → "rotator không đổi provider; declared `fallbackExecutors` có thể đổi provider, subject to `resolveFallback` + spawn-time `allowCrossProvider`".
- `[U]` §Launch, Evidence, And Control diagram (:348-386): `worker-home/worker-session/worker-session-boot` thuộc herdr adapter (`herdr-round.mjs:529,544`), không nằm trong Confinement box; thứ tự code là Mechanism (compileDispatchPlan) **trước** Gate (authority), không `Gate --> Mechanism`; `Native --> Live` sai (in-process handback không Run/liveness/visibility). Prose :388-393: "RunHandle runtime methods cannot bypass" → RunHandle là PROPOSED (`run-handle.md:9`); invariant thật: adapter fn chỉ resolve trong `executeThroughConfinement` (`authority.mjs:832-850`); "Herdr … does not settle Run truth" đúng cho `result.json`, sai cho `controller/commands` (H13); thêm "`required` hôm nay = host-write-deny only; hai door default backend khác nhau; `backendRegistry.defaultBackend` không phải key hợp lệ".
- `[U]` §Observation, Reconciliation, And Recovery (:401-432): "`dispatch recover` … re-enters the normal compiler, confinement, and adapter gates" → "records a CAS-guarded recovery decision (control epoch, `recovery-commands.jsonl`, clears Assignment `dispatch.claim` on resume-driver); relaunch chỉ qua session/runner doors". :440 "no cross-provider substitution by the rotator" — thêm một mệnh đề phân biệt rotator (same-provider accounts) với declared-fallback executors.
- `[U]` §Source Inventory (:436-445): thiếu `confinement/drivers/bwrap.mjs`, `confinement/probes/harness.mjs` (production dependency), `src/runner/dispatch.mjs` (barrel + CLI entry); "trust-store.mjs: single door" → qualify (`worker-home.mjs` cũng ghi; agy misrouted); "Resolution and policy" row thêm `definitions/schema.mjs` (`mergePolicyStack`) là out-of-folder member; thêm `src/report/dispatch-confidence.mjs` là Evaluator consumer ngoài component; :442 thêm "cli-spawn supervised (receipt/bindings/capture) chỉ cho Assignment-owned launch; `spawnWorker`/plain `execute` direct spawn không receipt".
- §Execution capability set (:40-47): "observability/contactability declared per executor" và "mode-specific reachability" → **proposed**; hôm nay chỉ prompt delivery, permission posture, confinement được khai.
- :333-337 operation-choice note: thêm "nó gọi `executeAssignment` trực tiếp (`operation-choice.mjs:2211`)".

**`docs/platform/agent-coordination/contracts/assignment-run-runresult.md`**
- :35-37 "inline contracts are read-only only … stamped snapshot has not started" → implemented (`assignment-normalizer.mjs:103-187`, `buildInlineAssignment`; inline `mutating` chỉ với engine stamp `execution-contract.mjs:281-289`).
- :103-114 "Atomic admission and crash durability … per-Run controller lock are not implemented" → stale: ledger + control lock implemented (`run-lock.mjs`, `admitRunAttempt`) **cho caller truyền `retryId`**; unfenced callers giữ next-available-attempt; holder `{id,pid}`; `phase/delivery` static; cancellation (`cancel-unsupported`), standalone supersession event, `revision` CAS, `bound/delivered` phases chưa implement.
- §Effect protection (:98-101): ghi `dispatch-effect-guarantee.test.mjs` chỉ chứng minh repeat-eligibility classification của pure function, không runtime dedup.
- §Dispatch Operability Addendum (:240-268): "contract-corrupt fails closed" → "khi đọc qua `interpretRunResult`; coordination evaluator hiện đọc compat fields" (hoặc fix H4 rồi giữ); `ProviderOutcome` không tồn tại trong code — đặt tên adapter return hoặc bỏ; "agent-result.json never independent proof" thêm "normalizer không được synthesize claim" (M4); RunObservation vocabularies chưa enforce (M9).
- §Confidence (:270-279): ghi `confidence` trong `result.json` là runtime-receipt grade do dispatch tính (`classifyRunEvidence`); acceptance semantic thuộc evaluator (`verified`→accepted, khác→unverified).
- §Evidence Freshness (:281-291): `proven` unreachable ở call site production; `inherited` chưa implement (X05 deferred) — nói ở đây, không chỉ trong plan.
- §Required Negative Tests #16 (:316-317): code **refuse** settlement của controller superseded, không "stored and validated" — chọn một.

**`docs/platform/agent-coordination/architecture/runtime-recovery-design.md`**
- §9 S1 (:233) "Implemented — no two winners" → "fenced callers only; unfenced CLI/operation-choice paths can admit two Runs; holder identity `{id,pid}` (§6 :158 là target)".
- §9 S2 (:234): partial — herdr unconfined bind `paneId` sau `agent start`; runner không consume `waiting` (C1).
- §9 S3 (:235) "Implemented (`recovery.mjs`)" → "Partial: admission-time fallback wired cho provider-capacity refusal; effect boundary (`assess`) reserved-not-executed".
- §7 (:182-204): ghi standalone door trả `{kind|outcome, action, actionKey, snapshotHash, expectedControlEpoch, expiresAt, evidenceIds, reason}`; `reasonCode/subjectRefs/nextCheckAt/waiting` còn proposed.
- §10 F-b/F-f (:258, :261): F-b proven cho `reconcile*` read model, **không** cho `executeAssignment` resume; F-f proven cho herdr launch collision + fenced admission, không unfenced. X02 (:276): implemented với ack-file dependency; "unknown delivery remains unknown" **không** implement — unacked prompt timeout báo `worker-spawn-fail`. E-c (:271): adapter giữ pane nhưng báo `worker-timeout`.
- Delivery tri-state `not-sent/sent/unknown`: không field nào tồn tại — proposed.

**Khác**
- `docs/specs/reading-map.md:33-34`: trỏ `docs/platform/agent-coordination/**`, bỏ "chưa implemented" cho recovery design (S0-S4 shipped theo chính §9). Hai bản `docs/architect/...` vs `docs/platform/...` chỉ lệch banner — chọn một owner.
- `docs/platform/agent-coordination/README.md` `[U]`: box Evaluator vẽ sibling nhưng `run-result.mjs`/`result-ladder.mjs` nằm trong `src/runner/dispatch/`, evaluator ngoài duy nhất (`src/report/dispatch-confidence.mjs`) đọc Work event log — label "target authority; today implemented inside dispatch/". :144 sửa như control-plane :342.
- `docs/platform/agent-coordination/subcomponents/README.md:31` `[U]` link architect copy là "legacy" trong khi `docs/platform/component-boundary.md:64` link architect copy là canonical — chọn một; sửa `component-boundary.md:64` → bản platform.
- `docs/architect/proposals/component-authority-boundary-map.md` §6 (:192): thêm `--needs-soul`/`--work` là selector đổi câu trả lời cho cùng target chưa đăng ký; §9 `OccupancyPort` (:496): `hasWorkerSlotRoom` hiện gọi trong Dispatch (`cli.mjs:1261`) — placement debt.
- `docs/architect/component-boundary/component-boundary-advisory.md` §12: pointer tới M10 là exception hiện tại.
- `docs/specs/runner.md` RUL68 (:1037-1044): thêm `executeExecutorCli` vẫn giữ tham số `purpose` nội bộ (`cli.mjs:680-716`).
- `AGENTS.md` §Dispatch: kết quả `decide` có thêm `executorId` khi resolve gián tiếp; ví dụ `decide --for judge` trả `unavailable` ở repo này (không capability `judge`) — chọn ví dụ configured; "unknown name answers from the default" chỉ đúng cho `decide <executorId>`/`--needs-soul`, `--for` trả `unavailable`.
- `src/cli/command-registry.mjs:801` `cwd` "inspect only" → cũng là target `reconcile plan clear-cwd-lock`; `--help` render `positional: sub` trong khi registry khai `['sub','run-id']`; description `touchesState:false` nên nói "writes run/guard files, never events.jsonl".
- Code comments stale (không phải docs nhưng cùng bệnh): `placement-policy.mjs:1-11` "no caller in the real dispatch path yet"; `assignment-policy.mjs:3-8, 313-316`; `definitions/schema.mjs:277-280`; `attestation-store.mjs` header "redacted references and digests only" (sai cho prepared-invocation/launch-envelope); `prepare.mjs` "bounded payloads".

---

## Unresolved questions (cần anh quyết)

Sáu câu hỏi này là Phase 00 (decision gate) của plan `plans/260920-2217-dispatch-engine-hardening/` — ở đó có khuyến nghị cụ thể cho từng câu và phase nào bị chặn bởi câu nào.

1. **H6 / unknown executor id**: giữ hành vi pinned (`dispatch.test.mjs:5189`, typo → global executor) hay đổi thành `unavailable` + `reasonCodes:['selector.unregistered']`? Đảo test pinned là quyết định của anh.
2. **H10 / direct `execute` door refuse required**: bug hay interim cố ý "until P06 wires backends" (p04 R7)? Quyết định này định hình fix (một defaulting rule chung vs docs gap).
3. **L6 / superseded late result**: docs nói "stored and validated", code refuse. Chọn một: ghi `result.superseded.json` hay sửa docs.
4. **`permissionMode:'bypass'`** có bao giờ hợp lệ trên policy path bwrap, hay chỉ herdr legacy flags? (M8)
5. **`assess()` effect boundary**: nối vào một mid-run fallback path thật, hay đánh dấu reserved và bỏ khỏi S3 "Implemented"? (M13)
6. **`confidence` trong `result.json`**: giữ tên với docs định nghĩa lại là receipt grade, hay đổi tên ở v3?

## Phụ lục — Báo cáo chi tiết theo từng nhóm component

Tám báo cáo dưới đây là bản gốc do 8 reviewer độc lập viết cho từng nhóm component (mỗi báo cáo tự chứa claim-status table, findings có `file:line`, contract audit, test gaps, doc corrections riêng). Báo cáo tổng hợp ở trên đã đối chiếu lại mọi finding Critical/High trên source trước khi đưa vào; phần phụ lục này giữ nguyên độ chi tiết gốc cho ai cần truy vết sâu hơn.

### Phụ lục 1: Review 01 — Dispatch core: request normalization, contracts, resolution, policy, plan compiler, mechanism, config


Reviewer: rv-core-2 (read-only). Repo: /home/vantt/projects/forgentX @ 7853e4d7 + uncommitted tree. Date: 2026-09-20.
Scope: `src/runner/dispatch/{assignment,assignment-normalizer,execution-contract,effective-execution-contract,agent-result-claim-contract,assignment-policy,plan,resolve,mechanism,config}.mjs`, boundary of `operation-choice.mjs`, entry `src/runner/dispatch.mjs`.
Docs checked: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md` (the 161-line uncommitted diff is only the "Implementation Subcomponent Map" section; every "Implementation status" claim below is committed text), `contracts/assignment-run-runresult.md`.

Live probes run (no writes): `node src/runner/dispatch.mjs decide {nonexistent-executor | agy | gitnexus | --for code:implement | --for judge | --for judge --needs-soul}`.

Note for the lead: the brief says `mergePolicyStack` lives in `assignment-policy.mjs`. It does not — it lives in `src/runner/definitions/schema.mjs:312` and is called only from `coordination/session-engine.mjs:891` and `coordination/cohort-planner.mjs:465,528`. The dispatch policy resolver never calls it.

#### 1. Claim status table

| # | Doc claim (dispatch-control-plane.md) | Status | Evidence |
|---|---|---|---|
| 1a | "exactly two target identities: capability and executor-id" | **partial** | `resolveExecutorAndOverrides` resolve.mjs:263-332 has exactly 3 branches (executor-id / capability.prefer / capability.for) — OK. But a THIRD derivation path exists in dispatch core: `executorIdForWork` resolve.mjs:38-42 turns Work+stage into a skill name via `skillForStage`, and `resolveCapabilityIdentityDetails` resolve.mjs:534-700 derives a capability from `work.kind`/`work.role`/stage/stepMap heuristics (e.g. `role==='reviewer' → 'code:review'`, :578). Both are called from dispatch core (plan.mjs:110, cli.mjs:371,737). |
| 1b | "purpose is compatibility terminology; nothing downstream branches on purpose" | **implemented** (with one nit) | plan.mjs:176-183 reads `purpose ?? executor.for[0]` only to pick an MCP tool name; `capability` field = `purpose ?? executor.for[0] ?? executorId` (:186). No routing branch on the word. Nit: `selector.type: 'purpose'` (:81) and `executor.for` still leak the legacy term into the public plan shape. |
| 1c | "job is not a routing identity" | **implemented** | No `job` read in any reviewed module. |
| 2a | DispatchRequest: "no typed object; compileDispatchPlan options bag is de facto request" | **implemented as described** | plan.mjs:36-51 destructures 13 untyped keys; no validation of unknown keys. |
| 2b | "work/assignment resolved inside plan.mjs" | **implemented as described (boundary violation acknowledged in doc)** | plan.mjs:107-135 (`executorIdForWork(workItem, stageArg)`), :94-106 (assignment → policy → executorId). |
| 2c | "Work/workflow/task/skill objects never cross this boundary as semantic resolver input" | **not met** | `workItem` crosses at plan.mjs:110 and is fed to `resolveAssignmentDispatchPolicy({work: workItem})` :302-308 (reads `work.tier`, `work.risk`, `work.id`). resolve.mjs:13 imports `DOMAINS/skillForStage` from `state/workflow-stage-graphs.mjs`. `buildDeclaredAssignment` assignment.mjs:330-355 does `operationsForStage(domain, stage, {kind: workflow})` + taskSpec file existence check. No Work GRAPH traversal (parent/children) happens in dispatch core — that part holds. |
| 3a | PolicyPatch precedence "runner/default → definition → operation/taskSpec → role → actor → Work → Assignment → trusted human/CLI → governance" is "Implemented" in `resolveAssignmentDispatchPolicy` | **partial / misattributed** | The resolver (assignment-policy.mjs:132-563) reads exactly three inputs: `assignment.policy` ("opPolicy"), `work` (tier/risk only), `cliOverride`. The runner/definition/operation/role/actor rungs are composed OUTSIDE it by `session-engine.mjs:2885-2905` via `mergePolicyStack` (definitions/schema.mjs:312) and then delivered to the resolver **as `cliOverride`** with `policyProvenance` relabelling. For the declared-protocol path, "Assignment" and "trusted CLI" are the same rung (both inside `cliOverride`). The header comment of assignment-policy.mjs:3-8 claims "Global → Domain → Workflow → Stage → …" — a third, different precedence list nobody implements. |
| 3b | tier monotonic accumulation | **implemented** | assignment-policy.mjs:160-186 (`resolveStrongerTier`), mergePolicyStack schema.mjs:325-331. Tested: assignment-policy.test.mjs:56, dispatch-coordination-role-tiers.test.mjs:283. |
| 3c | executor preference most-specific-wins | **implemented** | assignment-policy.mjs:198-202; schema.mjs:341-344. |
| 3d | "provider family derives from the selected registered executor, never from a raw selector string" | **partial** | assignment-policy.mjs:416-423: `cliOverride.providerModel ?? opPolicy.providerModel` wins over `deriveProviderFamily(registeredExecutorEntry)`; the override value also becomes `providerModel`, `provenance.provider` and the governance `disallowedProviders` subject (:510). For an UNREGISTERED non-default id with no registry the raw id is used (:423 `: primaryExecutor`). `policyForActualExecutor` assignment-runner.mjs:270-296 re-derives with `deriveProviderFamily(executorEntry)` (no `invocations[].command` extraction → drifts from the resolver's :412 rule). |
| 3e | provenance `{field:{value,source:{scope,id}}}` | **implemented** | assignment-policy.mjs:536-559; tested assignment-policy.test.mjs:528,551. |
| 3f | "`fallbackExecutors` remains `reserved-not-executed`" (stated at :182 and again :343-344) | **wrong — executed since 33490c36 (2026-09-17)** | assignment-runner.mjs:1206-1230 `attemptProviderCapacityFallback` iterates `compiledPlan.policy.executorPreference.slice(1)` and recompiles/leases a cross-provider candidate; pinned by assignment-dispatch.test.mjs:1300-1336 (claude→`codex-bwrap`, providerModel `openai-codex`) and dispatch-coordination-role-tiers.test.mjs:359. Stale in-code comments: assignment-policy.mjs:313-316, definitions/schema.mjs:277-280. |
| 3g | "Dispatch does not define a second policy shape; it consumes the same one" | **not met** | Four shapes: (1) `POLICY_PATCH_FIELDS` schema.mjs:125 (7 keys); (2) resolver reads 14 keys off `assignment.policy` incl. `model, providerModel, rigorOverrides, mode, minRigor, reasoningEffort, constraints, _fromYaml` (assignment-policy.mjs:148,223,236,260,416,436,486); (3) `ALLOWED_POLICY_KEYS` setup/registrations.mjs:853 (5 keys, lacks `repeatMode`/`preferInvocation`); (4) `execution-contract.mjs` `ACCEPTED_POLICY_FIELDS` = `minTier` only (:325-333). `mergePolicyStack` validates `preferInvocation` but never merges it (schema.mjs:341-345). |
| 4a | DispatchPlan carries bindingSource/tier/model/providerModel/provenance/policy | **implemented for the main branch only** | plan.mjs:331-348. Tested dispatch.test.mjs:6219-6414. |
| 4b | "assignment-runner reads compiledPlan.policy instead of calling the policy resolver a second time" | **implemented** | assignment-runner.mjs:1422-1438; no direct `resolveAssignmentDispatchPolicy(` call remains in that file (grep). But plan.mjs itself calls the resolver TWICE for the assignment selector (:98 and :302). |
| 4c | `policy.executor-mismatch-ignored` | **implemented** | plan.mjs:328; test dispatch.test.mjs:6377. |
| 4d | governance-blocked / unavailable plans leave policy unset | **implemented** | plan.mjs:144-166, :252-263; test :6400-6414. |
| 4e | (implied) every dispatchable plan carries policy | **not met** | `--work` selector with no registered executor returns early at plan.mjs:117-135 with `mechanism` in-process/out-of-process, `configured:false`, `governance:{null,null}`, and NO policy/tier/model/provenance — yet it is dispatchable (cli.mjs:1283 fanout uses it). |
| 5a | Executor kinds `agent|tool` | **implemented** | config.mjs:426; mechanism.mjs:82 keys native-mechanism on `kind==='agent'`. |
| 5b | Gate B3 throws for MCP-only executor on CLI path | **implemented** | resolve.mjs:410-418; plan.mjs:229-236 only attempts it for `out-of-process`. Live: `decide gitnexus` → in-process mcp handback. |
| 6a | Assignment immutable | **implemented** | assignment.mjs freezes policy/contextRefs/expectedOutputs/provenance (:369-371, :414-416, :450-455); `effectiveAssignment` re-frozen in runner :1402. |
| 6b | provenance.kind `declared|inline` | **implemented** | assignment.mjs:290-300 dispatch; tested assignment-provenance.test.mjs:31,94. |
| 6c | doc: inline class + stamped snapshot (mutation, evidence.required) "not started" | **wrong — implemented** | `stampDeclaredAssignment` / `stampInlineAssignment` assignment-normalizer.mjs:103-187, wired at assignment.mjs:425 and in `buildInlineAssignment`; tests assignment-normalizer.test.mjs (10 cases), assignment-provenance.test.mjs:55,63,148. Doc source: assignment-run-runresult.md:36-37 "Implementation of the inline class and the stamped snapshot has not started; the declared-operation path remains the only implemented" — stale. Also :35 "inline contracts are read-only only" is stale: execution-contract.mjs:281-289 admits `mutating` when the engine stamp is present. |
| 7 | Assignment fields validated at boundary | see §3 contract audit | — |

#### 2. Findings

##### Critical
No finding.

##### High

**H1 — `--work` dispatch plans skip policy and governance entirely, then execute against the global executor with the cross-provider/carries gates disabled.**
- Evidence: plan.mjs:107-135 — when `resolveExecutorAndOverrides(cfg, skillName).configured === false` the function returns before `decideExecutorDispatchMechanism`, `resolveExecutorConfig`, and `resolveAssignmentDispatchPolicy`. Result has `governance:{providerFamily:null,egress:null}`, no `policy`. Downstream `resolveExecutorConfig` with an unknown id (resolve.mjs:333-334 → `executorEntry === undefined`) falls to `cfg.executor` (:447) and every guard is `if (executorEntry && …)` (:365 carries, :498 allowCrossProvider) — nothing is checked. `options.disallowedProviders/disallowedExecutors` are never evaluated because no policy was resolved. dispatch.test.mjs:5189 pins the in-process half as intentional; fanout uses this plan at cli.mjs:1283.
- Actual problem: a plan that says "dispatchable" carries no governance verdict. Whether it is safe depends solely on the global `executor` block being Claude today.
- Failure scenario: project sets `runner.executor.command` to a non-Claude CLI (or `env.ANTHROPIC_BASE_URL`) without `allowCrossProvider`; `execute --work <id>` spawns it with repo content; `decide --work` reported no `governance.blocked`.
- Boundary: Governance gate (dispatch core) bypassed by the request shape.
- Why tests miss it: tests assert mechanism/executorId only (:5189-5200); none asserts `governance`/`policy` on a `--work` plan or runs the global-executor cross-provider case through `--work`.
- Smallest safe fix: in the early-return branch, still run `resolveExecutorConfig(cfg, undefined, undefined /*global*/, …)` for `out-of-process` and copy its `governance`; synthesize the same minimal policy the main branch does (so `disallowedProviders` runs). Alternatively make the branch fall through to the common tail with `executorId = null` + `bindingSource: 'global-executor'`.
- Priority: now.

**H2 — Executor id typos silently dispatch the global Claude executor (`decide <unknown>` → `out-of-process, configured:false`, exit 0).**
- Evidence (live, this repo): `decide agy` → `{"mechanism":"out-of-process","configured":false}` (AGENTS.md/skills still cite `agy`; registry now has `gemini`). `decide nonexistent-executor` identical. Path: plan.mjs:170 `decideExecutorDispatchMechanism` → resolve.mjs:263 returns `{executorId:null, executor:undefined}` → mechanism.mjs:82 `hasNativeMechanism:false` → `'out-of-process'`; plan.mjs:229 `resolveExecutorConfig` resolves the global block (H1's same fallthrough) and the plan is `configured:false` but dispatchable with `bindingSource: null`.
- Impact: a wrong `--executor`/positional id runs the wrong backend under the wrong name; the log line carries the typo. Contrast: `resolveAssignmentDispatchPolicy` fails closed on the same input (assignment-policy.mjs:352-354) — the two doors disagree.
- Boundary: registry resolver ("Executor identifiers must resolve through configured/approved targets", doc §Governance).
- Why tests miss it: dispatch.test.mjs:5189 asserts the current behaviour as the desired one.
- Smallest safe fix: in `compileDispatchPlan`, when `selector.type==='executor'` and `resolved.configured===false`, return `mechanism:'unavailable'` + `reasonCodes:['selector.unregistered']` (already the behaviour for `--for`). Keep the global fallback only for `executorId === undefined`.
- Priority: now (it is a user decision — flag to the user rather than silently flipping the pinned test).

**H3 — `preferInvocation` is validated as a PolicyPatch field but dropped by `mergePolicyStack`, so declared-protocol actors can never pin an invocation; the read-only redirect then overrides their choice.**
- Evidence: schema.mjs:272-276 validates it; :341-345 merges only `preferPersona/preferExecutor/visibility/fallbackExecutors`; session-engine.mjs:2896-2904 rebuilds `cliOverride` from `merged` only (no `preferInvocation`), replacing `opts.cliOverride` (:2983). verbs/coordination/run.mjs:102-114 puts `preferInvocation` into `cliPolicy` for `dispatchDeclaredOperation` (:485-489). assignment-runner.mjs:1477 reads only `opts.cliOverride.preferInvocation`. The agent-led path (run.mjs:383-401) forwards it and works.
- Impact: an actor declared `{executor:"claude", invocation:"claude-cli-readonly"}` in a declared protocol dispatches through Gate B2's "first via:cli" (`claude-cli`, full write) and, being read-only, gets silently redirected by `selectReadOnlyRedirectExecutor` (:1480) — the exact outcome the guard at :1469-1477 exists to prevent.
- Why tests miss it: `grep -rl preferInvocation test/` → no file. Zero coverage on both paths.
- Fix: add `preferInvocation` to the merge loop in schema.mjs:341 and to the `cliOverride` rebuild in session-engine.mjs:2896; add one declared-protocol test asserting the spawned invocation id.
- Priority: now.

##### Medium

**M1 — Capability `overrides.providerModel` rewrites provider-family identity, provenance and governance, not just the model lookup table.**
- Evidence: assignment-policy.mjs:416-425; plan.mjs:281-283 folds `resolved.overrides.providerModel` into the synthetic policy; config.mjs:1236 allows it. `resolvedProvider` becomes the override → `providerModel`, `provenance.provider`, and `disallowedProviders` (:510) all see the override, never `deriveProviderFamily(registeredExecutorEntry)`.
- Scenario: `capabilities.code:review = {prefer:'openai', overrides:{providerModel:'claude'}}` + `disallowedProviders:['openai']` → governance passes, plan reports `providerModel:'claude'`, model comes from the Claude table, spawned binary is codex. Config-owned, so not an untrusted bypass, but the doc rule 3d is violated and the audit trail lies.
- Fix: split "lookup table" from "family": keep `lookupProvider = override ?? family` for `resolvePolicyTierModel`, but compute `providerModel`/governance from the registered entry; record the override under `provenance.lookupProvider`.
- Tests: assignment-policy.test.mjs:787-860 pin only the model outcome, not governance/provenance.
- Priority: next.

**M2 — Two more provider/model derivations outside the policy resolver drift from it.**
- `policyForActualExecutor` assignment-runner.mjs:270-296 calls `deriveProviderFamily(executorEntry)` with the default `resolvedCommand='claude'` (no `invocations[].command` extraction as the resolver does at :412) and skips `resolveVerifiedAssignmentModel`. An invocations-shaped redirect target lacking `providerModel` derives `claude`.
- `executeExecutorCli` cli.mjs:855-890 computes model itself (`modelForTier` + `resolveVerifiedPlacementModel`) then calls the resolver with `cliOverride:{model}` purely as a post-hoc governance check; `spawnWorker` cli.mjs:303 does the same for the Work path. Doc §Boundaries says "provider/model selection only in policy resolver" — status: partial.
- Fix: make `policyForActualExecutor` call `resolveAssignmentDispatchPolicy` with `cliOverride.preferExecutor = redirectTarget` (same as the fallback path already does via `resolveFallback`); route cli.mjs's two ad-hoc computations through the same call.
- Priority: next.

**M3 — Operator cannot distinguish governance-blocked from unregistered on the CLI, and the `execute --assignment` gate always prints "unexecutable mechanism".**
- Evidence: `decideExecutorCli` cli.mjs:1236-1244 rebuilds the output from `{mechanism, configured, agentType?, mcpTool?, executorId?}` and drops `reasonCodes` and `blockedReason`. cli.mjs:1543 then reads `decided.blockedReason ?? decided.reason` — both always undefined. Live: governance-blocked → `{"mechanism":"unavailable","configured":true}`; unregistered → `{…,"configured":false}`. The only signal is `configured`, which the doc defines as "has a config entry", not "why it is blocked". `assignment-runner.mjs:1433` and cli.mjs:1543 also test `plan.dispatch === 'human-only'`, a field `compileDispatchPlan` never emits (dead check).
- Fix: pass `reasonCodes` and `blockedReason` through `decideExecutorCli`'s return (additive keys), and delete the dead `dispatch` checks or make plan.mjs emit `dispatch` from the Assignment.
- Priority: next.

**M4 — Doc/code both say `fallbackExecutors` is reserved-not-executed; it has been executed cross-provider since 33490c36.**
- Evidence: see claim 3f. Also doc :343-344 "Neither mechanism may select an arbitrary cross-provider fallback" while the pinned test at assignment-dispatch.test.mjs:1300-1336 is exactly a claude→openai-codex fallback (governed by `executorPreference`, so "arbitrary" is arguable, but "reserved-not-executed" is false).
- Fix: doc correction (§7) + delete stale comments assignment-policy.mjs:313-316, schema.mjs:277-280.
- Priority: now (doc), later (comments).

**M5 — `compileDispatchPlan` resolves policy twice and `resolveExecutorAndOverrides` up to four times per plan; the recovery fallback recompiles per candidate.**
- Evidence: plan.mjs:98 (assignment selector) and :302 (tail) both call `resolveAssignmentDispatchPolicy` with identical inputs; `resolveExecutorAndOverrides` at :101/:112/:150, again inside `decideExecutorDispatchMechanism` (mechanism.mjs:81), again inside `resolveExecutorConfig` (resolve.mjs:334), and a fourth time at :191 when `resolved` reuse misses. All in-memory object lookups; no I/O. Measured cost is negligible per call; the real cost is that the two policy calls can disagree only by bug, so the second exists to detect the first (mismatch check :318-329).
- Fix: keep `policy` from :98 and skip the second call when `realAssignmentForPolicy` is set.
- Priority: later.

##### Low

**L1 — Three stale/contradictory precedence lists.** assignment-policy.mjs:3-8 ("Global→Domain→Workflow→Stage→…"), schema.mjs:299-301 ("runner<definition<node<operation<role<actor<assignment<cli<governance"), doc :158-167 (adds "Work constraints", omits "node"). Only schema's list matches `session-engine.mjs:2885-2892` (which has no `node` entry either). Fix: one list, in the contract doc, referenced by both comments.

**L2 — Hidden `_fromYaml` / `_allowLiteralModel` underscore flags on frozen Assignment policy.** assignment.mjs:366 sets `_fromYaml`; assignment-policy.mjs:148 reads both; `_allowLiteralModel` has no producer anywhere (`grep -rn _allowLiteralModel src` → only the reader). Dead branch; the YAML-model rejection therefore always fires when `matchedOp.policy.model` is set and no CLI `--model` is given (tested assignment-policy.test.mjs:163 — behaviour is right, the flag is noise). Fix: drop `_allowLiteralModel`, rename `_fromYaml` to `provenance.policySource` inside `provenance.declared`.

**L3 — Role-based persona default hard-wired in the resolver.** assignment-policy.mjs:299 `assignment.role==='reviewer' ? 'code-reviewer'`. This is a "role" rung living inside the resolver while the doc says role policy is composed upstream. Harmless today; it is the only place a persona name is hard-coded in dispatch core.

**L4 — `config.mjs` → `transport.mjs` → `resolve.mjs` → `config.mjs` import cycle.** config.mjs:39 imports `EXECUTOR_ADAPTERS` from transport.mjs (the launch layer), which imports config.mjs and resolve.mjs. Works only via ESM live bindings; a future top-level use of `EXECUTOR_ADAPTERS` at config load would TDZ. Fix: move `EXECUTOR_ADAPTERS` into config.mjs (or a leaf `adapters.mjs`) and have transport import it.

**L5 — Provider-family warning fires once per process but for an executor that can never take the CLI path.** config.mjs:802-830 (NOTE at :808). Live: each `decide` prints it exactly once (stderr line count = 1 across 5 probes), so "several times per process" is not reproduced for `decide`; `bin/fgos.mjs` has 9 `loadRunnerConfig*` call sites, so multi-step verbs likely repeat it. Fix: skip when every invocation is non-`cli` (gitnexus shape) — cross-call-site disagreement cannot arise for a target that never spawns.

**L6 — `--work` plan reports `capability: <skill name>`** (plan.mjs:125 `capability: executorId` where executorId is e.g. `fgos-coding-implement`). Skill name ≠ capability; `resolveCapabilityIdentityDetails` would say `code:implement`. Two answers to "what capability is this" for the same request.

#### 3. Contract audit

| Contract | Owner / producer → consumer | Validated at boundary | Implicit / legacy / options-bag fields | Invariants held | Verdict |
|---|---|---|---|---|---|
| **Assignment (declared)** | `buildDeclaredAssignment` assignment.mjs:302 → `executeAssignment`, `compileDispatchPlan`, `operation-choice` | `stage`, `operation` non-empty (:319-324); operation must exist in `operationsForStage` (:334); taskSpec must exist (:340) + file must exist on disk unless `options.allowSyntheticCompatibilityOperation` (:348-355); `policy` is **not** shape-validated (spread verbatim :364) | `_fromYaml` (:366); `options.repoRoot/cwd/existingIds` bag; `role` defaults `matchedOp.role ?? 'implementer'`; `dispatch` mode copied from YAML | frozen; provenance.kind='declared' stamped; mutation/evidence stamped by normalizer (:425) | OK for identity; **policy shape unvalidated** (see 3g) |
| **Assignment (inline)** | `buildInlineAssignment` :494 ← `validateExecutionContract` execution-contract.mjs:256 | strict allow-lists on contract/evidence/budget/caller/policy; `mutation:'mutating'` requires engine stamp (:281-289); `policy` = `{minTier}` only | `INLINE_ASSIGNMENT_PARAM_WHITELIST` :287 rejects declared-shape fields (good) | second defensive stamp gate in normalizer :160-187 | **Good** — the strictest contract in the group |
| **DispatchRequest** | none (doc-only) — `compileDispatchPlan(cfg, opts)` plan.mjs:36 | none: no unknown-key rejection, `caller.role` free string, `stage` unvalidated, `assignment` may be string or object, `cliOverride`/`options` opaque pass-through | selector precedence (executor > assignment > work > purpose > adHoc) only documented in a comment :56-67 | — | **proposed** (doc says so); the bag is the contract today |
| **PolicyPatch** | producers: FlowDefinition YAML (schema.mjs:254), workflow YAML (registrations.mjs:853 doctor check), coordination verbs (run.mjs:94-118), `cliOverride` from CLI flags (cli.mjs:1553-1556) → consumer `resolveAssignmentDispatchPolicy` | validated only on the FlowDefinition path (schema.mjs) and doctor path; the resolver validates VALUES (tier/mode/minRigor/reasoningEffort/repeatMode enums) but never KEYS | 4 divergent allow-lists (3g); `preferInvocation` dropped by merge (H3); `cliOverride` doubles as "composed stack" for declared protocols (3a) | minTier raise-only ✔; repeatMode raise-only ✔ (schema only) | **partial** |
| **DispatchPlan** | `compileDispatchPlan` → assignment-runner :1422, cli.mjs decide/fanout, recovery `resolveFallback` | not validated anywhere; 3 early-return shapes lack `bindingSource/tier/model/providerModel/provenance/policy` (:120-135, :144-153, :157-166) and one lacks `blockedReason` | `configured` (means "has entry"), `capability` (3 different derivations: purpose / executor.for[0] / executorId), `agentType`, `mcpTool` conditional keys; consumers test a nonexistent `plan.dispatch` (M3) | governance-blocked never dispatchable ✔ (:241-263, tested :6174) | **partial** — dispatchable-without-policy exists (H1) |
| **EffectivePolicy** (resolver output) | `resolveAssignmentDispatchPolicy` → plan, runner, `policyForActualExecutor`, `resolveFallback` | frozen; provenance always objects (:536-559) | `executorId` **and** `executorPreference[0]` (same value, two names); `tier` vs `semanticTier` vs `lookupPolicyTier`; `providerModel` doubles as lookup-table key and family (M1) | — | OK, over-wide |
| **Execution capability contract** (`executors.<id>` / `capabilities.<name>`) | config.mjs `validateRunnerConfigShape` :1236-1264, :1393 | `overrides` keys allow-listed; `prefer` normalised (:605); kinds/carries/via enums | project-over-global merge (`mergeWithGlobalConfig` :275) means a global `capabilities.code:implement.prefer` can be shadowed silently by project — live: project has `code:implement`, global also has it; which wins is not surfaced by `decide` (`bindingSource` says `capability.prefer`, not which file) | — | OK; add `bindingSource` file scope |
| **agent-result-claim v2** | worker → `validateAgentResultClaimContract` agent-result-claim-contract.mjs:52 | status enum, summary, blocker/error conditionals, evidenceRefs, assessment.verdict for reviewer/red-team/`*recheck*` | legacy (no `contract`) path accepted forever (:57); `isAssessmentRequired` keys on `operation.includes('recheck')` substring (:22) | "nothing is proof" ✔ | **Good**; substring rule is a smell |

Validated-vs-implicit summary for Assignment (claim 7): validated = stage, operation, taskSpec existence, role∈YAML, inline contract fields; implicit = policy keys, `dispatch`, `reason`, `skills`, `_fromYaml`, `expectedFiles`, `contextRefs` contents, `options.*`.

#### 4. Simplicity / architecture observations

- **Layering**: `plan.mjs` → `assignment-policy.mjs` → `placement-policy.mjs`/`resolve.mjs` → `config.mjs` is clean, but `config.mjs:39` reaching up into `transport.mjs` closes a cycle (L4). `resolve.mjs:13` importing `state/workflow-stage-graphs.mjs` and `assignment.mjs` importing it too means dispatch core depends on the workflow graph — the doc's "component-outer derives capability first" is aspirational, not enforced.
- **operation-choice.mjs boundary holds**: it imports only `executeAssignment`/`classifyRunEvidence`/`isSubstantiveReportText` (:22) and calls `executeAssignment(assignment, opts)` at :2211; no `compileDispatchPlan`/`resolveExecutor*`/`spawnWorker` reference. Not a second compiler. ✔
- **cohort-planner.mjs** calls `resolveExecutorConfig` (:151) and `resolveAssignmentDispatchPolicy` (:629) to build an inventory and cross-checks provider family against its own derivation (:162) — read-only, but it is a third caller of the registry resolver outside dispatch, contradicting doc :455-457 "None of them calls resolveExecutorConfig".
- **Executor substitution happens in three places outside the resolver**: read-only redirect (assignment-runner :1478-1483 via placement-policy), provider-capacity fallback (:1206), and `policyForActualExecutor` (:270). Each re-derives model/provider its own way (M2). One "rebind executor → recompile plan" primitive (`resolveFallback` already is one) should serve all three.
- **`cliOverride` is a misnomer**: for declared protocols it is the whole merged stack (session-engine :2896-2905); for `execute --assignment` it is three CLI flags (cli.mjs:1553-1556); for `executeExecutorCli` it is a computed model (:890). Rename to `requestPolicy` + separate `provenance` would remove the `policyProvenance` relabelling hack (assignment-policy.mjs:171-176, 200, 300, 460).
- **Selector compat surface**: `executor / assignment / work / purpose / adHocAgent` (plan.mjs:69-84) is five ways to say two identities; `work` and `assignment` are the ones that pull outer objects across the boundary.
- **Good decisions unprotected by tests**: (a) `--work` plan governance (H1); (b) `preferInvocation` end-to-end (H3); (c) `decide` output for governance-blocked vs unregistered (M3) — only `mechanism`/`configured` asserted; (d) `bindingSource` for the global-executor fallthrough (`null` today, unasserted).
- **Naming/UX**: `configured:false` + `mechanism:'out-of-process'` reads as "will run something unconfigured" — which is literally true (H2). `capability` on the plan means three different things (L6).

#### 5. Performance observations (evidence vs hypothesis)

- Evidence: per `compileDispatchPlan` with an assignment selector: 2× `resolveAssignmentDispatchPolicy`, 3-4× `resolveExecutorAndOverrides`, 1× `resolveExecutorConfig`; the runner then calls `resolveExecutorCommand` → `resolveExecutorConfig` again (transport.mjs:158) and `policyForActualExecutor`. All are synchronous object lookups over an already-loaded `cfg`; no fs. Fallback recompiles once per skipped candidate (assignment-runner :1230-1240). Cost: microseconds; not a token/latency concern.
- Evidence: `loadRunnerConfigFromDir` = fs read + JSON.parse + global merge + full shape validation + confinement normalisation (:262-279). Call sites: bin/fgos.mjs 9, cli.mjs 3, assignment-runner 1, cohort-planner 1. Measured: a single `decide` process loads it once (one warning line). Hypothesis (not measured): multi-verb flows (coordination run → dispatch → execute) load it 3+ times per dispatch; harmless for correctness, noisy on stderr (L5).
- No repeated catalog work of note: `resolveCapabilityIdentityDetails` scans `cfg.capabilities` O(n) twice per call (cli.mjs:371, :737) — n≈10.

#### 6. Test gaps (prioritised)

1. **`--work` plan carries governance** — assert `plan.governance.egress` and that a cross-provider global executor without `allowCrossProvider` yields `mechanism:'unavailable'` (H1).
2. **`preferInvocation` end-to-end for declared-protocol and agent-led** — assert the spawned invocation id and that read-only redirect does NOT fire when pinned (H3).
3. **`decide` CLI distinguishes blocked vs unregistered** — assert `reasonCodes`/`blockedReason` reach stdout/stderr (M3); also a test that `execute --assignment` prints the real `blockedReason`.
4. **Capability `overrides.providerModel` vs governance** — assert `disallowedProviders` is evaluated against the registered family, and `provenance.provider` names the registered executor (M1).
5. **`policyForActualExecutor` parity** — for an invocations-shaped redirect target with no `providerModel`, assert the same family the resolver derives (M2).
6. **Unknown executor id via positional** — decide whether H2 stays; if it stays, add a test that the log line and plan mark `bindingSource:'global-executor'` so it is at least auditable.
7. **`mergePolicyStack` field coverage** — table-driven test that every key in `POLICY_PATCH_FIELDS` survives a merge (would have caught H3).
8. Baseline snapshot harness (dispatch-policy-baseline-snapshot.test.mjs:1129) — extend with one `--work`-selector and one `decide <unregistered>` fixture so the plan shapes for the three early returns are pinned.

#### 7. Doc corrections

| File | Section | Wrong → Right |
|---|---|---|
| dispatch-control-plane.md | PolicyPatch → Implementation status (:179-183) | "`resolveAssignmentDispatchPolicy()` implements this exact precedence" → "the resolver consumes three inputs (Assignment policy, Work tier/risk, request override); the runner/definition/operation/role/actor rungs are composed by `mergePolicyStack` in `session-engine.mjs:2885` and handed over as `cliOverride` with `policyProvenance`". |
| dispatch-control-plane.md | PolicyPatch (:182-183) and Planning And Admission (:343-344) | "`fallbackExecutors` remains `reserved-not-executed`" → "executed by `attemptProviderCapacityFallback` (assignment-runner.mjs) on a provider-capacity refusal, governed by `executorPreference` and `resolveFallback`; cross-provider candidates are allowed when registered and governance-clean (33490c36)". |
| dispatch-control-plane.md | PolicyPatch merge rules (:161-163) | "provider family derives from the selected registered executor, never from a raw selector" → add "except a capability `overrides.providerModel`, which currently overrides the family for lookup, provenance and governance (tracked M1)". |
| dispatch-control-plane.md | PolicyPatch (:147-150) "Dispatch does not define a second policy shape" | → "Four allow-lists exist today (schema.mjs, assignment-policy.mjs reader, registrations.mjs doctor, execution-contract.mjs); unification is open" (status partial). |
| dispatch-control-plane.md | DispatchPlan → Implementation status (:203-231) | Add: "A `--work` selector with no registered executor returns a dispatchable plan with **no** policy/governance (plan.mjs:117-135)"; status "Implemented for dispatchable plans" → "partial". |
| dispatch-control-plane.md | Routing Identities (:83-87) / DispatchRequest rules (:127-129) | "Work/workflow/task/skill objects never cross this boundary" → mark **target state**; today `workItem` crosses (plan.mjs:110) and `resolve.mjs`/`assignment.mjs` import the workflow-stage graph. |
| dispatch-control-plane.md | Component-Outer Boundary Note (:455-457) | "None of them calls `resolveExecutorConfig`" → note `coordination/cohort-planner.mjs:151` does (read-only inventory cross-check). |
| dispatch-control-plane.md | Source Inventory (:437) "Resolution and policy" row | add `definitions/schema.mjs` (`mergePolicyStack`) as an out-of-folder member, or state explicitly that stack merge lives in the coordination layer. |
| assignment-run-runresult.md | §Assignment :35-37 | "inline contracts are read-only only … Implementation of the inline class and the stamped snapshot has not started" → "implemented: `buildInlineAssignment` + `assignment-normalizer.mjs` stamp `mutation`/`evidence.required`/`resultKind`/`onAdvance` for declared and inline (tests: assignment-normalizer.test.mjs, assignment-provenance.test.mjs); inline `mutating` is admitted only with the engine protocol-operation stamp (execution-contract.mjs:281-289)". |
| src (comments, not docs) | assignment-policy.mjs:3-8, :313-316; schema.mjs:277-280 | stale precedence list and "reserved-not-executed" comments — delete or point at the doc. |

### Phụ lục 2: Review 02 — PlacementPolicy, Provider Capacity Rotator, provider adapter, governance, trust store


Scope: `src/runner/dispatch/{placement-policy,provider-capacity,provider-adapter,trust-store}.mjs`, the governance/egress gate in `resolve.mjs`/`assignment-policy.mjs`, and their call sites in `assignment-runner.mjs`, `herdr-round.mjs`, `worker-home.mjs`, `confinement/drivers/bwrap.mjs`. Read-only; one probe script run (`scratchpad/review/probe.mjs`) to confirm three findings empirically. No `npm test`.

Machine note: `~/.fgos/config.json` on this host declares no `runner.providers.*.accounts`, so the rotator is inactive here; findings are from source + probe, not live incidents.

#### 1. Claim status

| # | Doc claim | Status | Evidence |
|---|---|---|---|
| 1a | "PlacementPolicy binds provider/model/executor" (dispatch-control-plane.md:339) | **partial — shadow/verifier, never the binder** | `placement-policy.mjs:1-11` header: "SHADOW MODE ONLY … Never changes production binding". Every production entry (`resolveVerifiedPlacementModel` :224, `resolveVerifiedRedirectExecutor` :425, `resolveVerifiedAssignmentModel` :489) returns the caller's `legacyModel`/`legacyExecutorId` on any disagreement. The legacy formulas in `cli.mjs`, `assignment-policy.mjs:454`, `assignment-runner.mjs:235-268` remain the binders; PlacementPolicy only stamps `source:'placement-policy'` when it agrees. |
| 1b | "Provider Capacity Rotator ranks, leases, releases, quarantines accounts within that already selected provider" | **implemented** (with defects, §2) | `provider-capacity.mjs:240-290` `acquireProviderAccountLease` takes `provider` as input and never chooses one; `FORBIDDEN_ACCOUNT_KEYS` :14 rejects placement fields on accounts. |
| 1c | "Neither mechanism may select an arbitrary cross-provider fallback" | **misleading — cross-provider fallback is executed by design** | `assignment-runner.mjs:1206-1318` `attemptProviderCapacityFallback` re-derives `provider` per fallback candidate (:1270) and leases in *that* provider; `recovery.mjs:93-158` `resolveFallback` checks tier/visibility/governance, never provider equality. Test `assignment-dispatch.test.mjs:1321-1336` dispatches primary `claude` → fallback `openai-codex` and asserts success. Not "arbitrary" (declared list + governance), but cross-provider. |
| 1d | "`fallbackExecutors` … core automatic executor failover remains `reserved-not-executed`" (:182, :344) | **stale — implemented since commit 33490c36 / Phase B** | `assignment-runner.mjs:1177-1180` "has been reserved-not-executed (Phase 00 R10) until now; this closes that gap"; live adoption at :1671-1736; resume rehydration :1600-1622. |
| 2 | "Governance resolver checks egress/provider/executor/content constraints (cross-provider gate, allowCrossProvider, carries)" (:266) | **implemented for cli-spawn + herdr paths; `carries` gate only when executor opts in; `disallowedProviders` is a per-call option, not config** | `resolve.mjs:365-381` (carries), :452-505 (cross-provider). Fires via `transport.mjs:158` for `cli.mjs:327/906` and `assignment-runner.mjs:2102`; herdr goes through `executeExecutorCli` (:906). `disallowedProviders` only from `options` (`assignment-policy.mjs:510`), no config-level source found in `src/` (only `cli.mjs:619`, `session-engine.mjs:831`). |
| 3a | "Cross-provider/model/tier dispatch must remain explicit and auditable" | **partial** | Fallback is recorded (`run.json.fallback`, `evidence.json.fallback`, provenance `scope:'fallback'` :1235). Read-only redirect provenance `scope:'readOnlyExecutorRedirect'` :286. BUT provider for the redirect target is derived with `deriveProviderFamily(executorEntry)` and the default command `'claude'` (:273, `resolve.mjs:135`) — wrong family for a bare-shape non-Claude target; and `cliOverride.providerModel` (`assignment-policy.mjs:407-411`) is a raw caller string that becomes `resolvedProvider`. |
| 3b | "Read-only/mutating policy must be checked before launch" | **implemented** | `isReadOnlyAssignment` gating at :1477-1481; H5 re-check :1500-1510; bwrap read-only. |
| 4 | "provider family derives from the selected registered executor, never from a raw selector string" (:170) | **partial** | `assignment-policy.mjs:407-411`: `cliOverride.providerModel ?? opPolicy.providerModel` overrides derivation; `assignment-runner.mjs:1628` and `:273` call `deriveProviderFamily(entry)` without the resolved command → defaults to `'claude'` for any entry lacking `providerModel`/`provider` (acknowledged debt at `assignment-policy.mjs:380-405`). |
| 5 | "trust-store.mjs: the single CLI folder-trust-store door" (:439) | **partial — two other writers; agy branch never reaches the store it names** | `worker-home.mjs:130-145` writes a fresh `.claude.json` with `hasTrustDialogAccepted:true` (derived via `readTrust`, ok in spirit but a second writer). `herdr-round.mjs:578-597` routes kinds `agy`/`agy-json` into `seedTrust(~/.claude.json)`; `seedAgyTrust`/`removeAgyTrust`/`removeTrust`/`removeCodexTrust` have **zero callers** in `src/`. |
| 6 | Diagram `Capacity --"same-provider account lease only"--> Governance`, `Placement --> Governance` (:309-324) | **inaccurate** | Order in code is Policy+Governance (inside `compileDispatchPlan` :1420) → redirect (:1477) → capacity lease (:1635, after Run admission) → on refusal, fallback re-runs governance (:1229). Capacity is downstream of Plan, not upstream of Governance. |

#### 2. Findings

##### Critical

**C1. Runtime quarantine drops the classifier's `until`/`quarantineKind`; every quota fault becomes a permanent quarantine and `manual-clear` intent is lost.**
- Severity: Critical (rotator's core loop; requires manual `fgos dispatch reconcile provider-capacity clear-quarantine` after every rate-limit).
- Evidence: `assignment-runner.mjs:2602-2613` calls `quarantineProviderAccount({ runnerConfig, provider, accountId, reasonCode, manualClear: fault.manualClear, runtimeDir, evidence })`. Signature at `provider-capacity.mjs:318` is `{ provider, accountId, reasonCode, quarantineKind='temporary', until, runtimeDir, detail }`. `fault.manualClear`, `fault.confidence` do not exist on the classifier output (:377-417). Probe: classifier returned `{quarantineKind:'temporary', until:+3h}`; written record was `{kind:'temporary', reasonCode:'quota-limit', quarantinedAt}` with **no `until`**; `inspectProviderCapacity` reports `healthy:false` now and still after 30 days (fails closed per `isQuarantined` :208-212). For `auth-token`, kind `manual-clear` is downgraded to `temporary` (same effective outcome, wrong record).
- Also: evidence written at :2615-2619 reads `quarantine?.status`/`quarantine?.manualClear`, fields the record never has → `state:'quarantined', manualClear:false` always.
- Failure scenario: one 429 from account A → A quarantined forever; second run leases B → same; pool exhausted; every subsequent dispatch settles `provider-capacity-refused` until an operator clears each account by hand. Doctor `provider-capacity-state` (:1670-1702) reports it but "never auto-clears".
- Boundary: `provider-capacity-state.v1` record contract vs. runner call site; H1 gate comment in `provider-capacity.test.mjs:158-163` states the invariant the call site violates.
- Why tests miss it: `provider-capacity.test.mjs` tests classifier and `quarantineProviderAccount` separately with correct args; `assignment-dispatch.test.mjs` only pre-seeds quarantine records (:1251, :1335), never drives a fault through `executeAssignment`.
- Smallest fix: pass `quarantineKind: fault.quarantineKind, until: fault.until, detail: {...evidence}` at :2602; read `quarantine.kind`/`quarantine.until` for evidence; add an integration test that returns quota stderr from the fake executor and asserts `until` present.
- Priority: now.

##### High

**H1. Classifier runs without `provider` at the call site, so OpenAI regexes apply to every provider and match ordinary worker stderr → account quarantined `manual-clear`.**
- Evidence: `assignment-runner.mjs:2587-2591` passes `{stderr, adapterOutcome, structuredAgent}` only. `provider-capacity.mjs:392` branch `provider === 'openai' || provider === undefined`. Regex :403 `/\b(login|auth|authentication|token)\b/ && /\b(failed|expired|invalid|required|missing|no api key)\b/` over the **whole** worker stderr. Probe: `"SyntaxError: Unexpected token } in JSON\n1 test failed"` → `{action:'quarantine', reasonCode:'auth-token', quarantineKind:'manual-clear'}`.
- Impact: a worker whose test output mentions "token" and "failed" (JSON parse errors, JWT tests, npm audit) quarantines the leased account for the whole machine (state is global `~/.fgos/runtime/provider-capacity`). Combined with C1, permanent.
- Why tests miss it: :153-158 only test positive matches and one benign string without the "token"+"failed" pair.
- Fix: pass `provider: providerCapacitySelection.provider`; drop the `provider === undefined` wildcard; require the auth pattern to match a provider-known line shape (e.g. anchored `/^.*(No API key found|Use \/login)/m`) or only the last N lines of stderr; classify `auth-token` as `evidence-only` unless `adapterOutcome` corroborates.
- Priority: now.

**H2. A crashed dispatcher leaves `state.lock` forever; every later lease attempt fails after 5 s (`EEXIST`) with no doctor check and no recovery path.**
- Evidence: `provider-capacity.mjs:188-210` `withFileLock` opens with `wx`, writes `{pid}`, never reads it back; no staleness/pid check; on deadline rethrows raw `EEXIST`. Probe: pre-existing lock with pid 999999 → `EEXIST after 5003 ms`. `checkProviderCapacityState` (`registrations.mjs:1670`) uses `inspectProviderCapacity`, which does not take the lock, so doctor passes while dispatch is wedged.
- Impact: SIGKILL/OOM of any fgos process between `openSync` and `unlinkSync` (e.g. during `writeState`) bricks account rotation host-wide; the error surfaces as an unclassified throw from `acquireProviderAccountLease` (:1635 is not in a try → escapes `executeAssignment` as a raw `EEXIST`, after `admitRunAttempt` already created the Run → orphaned `running` Run, the exact H2 case the settlement branch at :1645 was written to avoid, but only for `status:'refused'`).
- Fix: read the lock's `pid`, reclaim when `!isPidAlive(pid)` (helper already exists :224) or when older than N minutes; wrap `acquireProviderAccountLease` in the same settle path as a refusal; add doctor check `provider-capacity-lock-stale`.
- Priority: now.

**H3. `trustStore.kind: "agy"` / `"agy-json"` seeds claude's `~/.claude.json`, not agy's `settings.json`; agy trust functions are dead code; trust entries are never removed.**
- Evidence: `herdr-round.mjs:578-597` `if (kind === 'codex-toml') … else seedTrust(~/.claude.json)`; live `.fgos/config.json:551-556` declares `kind:"agy"` with `env.HOME: ${HOME}/.agy-homes/mucdong`. `seedAgyTrust`/`removeAgyTrust` (`trust-store.mjs:277-372`) have no callers; `removeTrust`/`removeCodexTrust` also none (rg across `src/`). Commit e1307d33 widened `TRUST_STORE_KINDS` only.
- Impact: (a) agy visible dispatch still hits its folder-trust dialog (the bug the kind was added for) while `round.note({trustSeeded:'agy'})` records success; (b) the operator's `~/.claude.json` grows one `projects[<worktree>]` entry per herdr dispatch of any kind and is never pruned — the module's own comment calls removal "not optional housekeeping" (:141-146); (c) if `trustStore.path` is set to agy's settings.json, `seedTrust` throws `schema-drift` (no `projects`), swallowed at :595.
- Additional: `seedAgyTrust` itself violates B1 — it adds `repoRoot` **and** `projectPath` without checking the root is already trusted (:301-311), and replaces an unparseable settings.json with `{}` (:319-327), the exact behavior `readStore` refuses for claude (:65-70).
- Fix: route `agy`/`agy-json` to `seedAgyTrust` with the executor's resolved `HOME`; apply B1 there (refuse when `repoRoot` not already present) and stop overwriting corrupt files; call `removeTrust*` in `herdr-round.mjs` teardown (:929 region); doctor check for codex/agy trust readability (only `claude-json` is checked, `registrations.mjs:3544`).
- Priority: now (a) / next (b,c).

**H4. Leased account credential is applied only under bwrap; unconfined or herdr dispatch records account X in provenance but runs on the ambient credential. Resumed Runs run with no lease at all.**
- Evidence: only `confinement/drivers/bwrap.mjs:29-51,371` reads `request.providerCapacity.credentialSource` and copies `auth.json` into the private home. No `CODEX_HOME`/credentialSource handling in `transport.mjs`, `cli-spawn-supervisor.mjs`, `herdr-round.mjs`, `worker-session-boot.mjs` (rg). `assignment-runner.mjs:1629-1633`: `shouldSelectProviderAccount = !admitted.resumed && …` — a resume acquires nothing, `providerCapacitySelection` stays `null`, but the sticky `assignments[provider:assignmentId]` record still names an account.
- Impact: `provider-capacity-selection.json`/`effective-execution-contract.providerCapacity` claim `accountId: a1, credentialProvisioned:false` while the worker used whatever `~/.codex/auth.json` the dispatcher had. Quota accounting, quarantine (C1/H1) and stickiness then punish the wrong account. On resume the prior lease is reclaimed by pid-death (:230-240) and the Run proceeds unleased — concurrency limits per account silently bypassed.
- Fix: refuse (`status:'refused', reason:'credential-provisioning-unsupported'`) when a lease is selected but the effective backend cannot provision it, or provision via env (`CODEX_HOME`) for cli-spawn; on resume, re-acquire (sticky) before relaunch.
- Priority: next.

##### Medium

**M1. `state.json` is written non-atomically; a crash mid-write corrupts global rotator state and every later call throws from `JSON.parse`.**
- Evidence: `provider-capacity.mjs:182-185` `writeFileSync` straight to `state.json` (contrast `trust-store.mjs:81-91` temp+rename). `readState` :167 has no corrupt-file handling.
- Fix: temp+rename in the same dir; on parse error, rename aside and start empty with an audit entry (accounts are re-derived from config; only leases/quarantine are lost).
- Priority: next.

**M2. Lease liveness is keyed to the dispatcher's own pid, not the worker's; "release on Run settle" is best-effort only inside the process lifetime.**
- Evidence: `:261` `pid: process.pid`; reclaim :230-240 by `isPidAlive(lease.pid) || runIsDead(runId)`; `runIsDead` is an optional caller callback (`opts.providerCapacityRunIsDead`) with no default resolver wired from Run store. Release sites :1714, :1949, :2737 are all inside `executeAssignment`'s process.
- Impact: correct for the synchronous supervisor model; wrong if a future adapter detaches the worker (lease reclaimed while worker still consuming quota) and lease leaks only reclaim when another dispatch of the same provider runs. Acceptable today; document the invariant.
- Priority: later.

**M3. Provider vocabulary is not one vocabulary across placement, capacity, classifier, and adapter.**
- Evidence: live config uses `providerModel:"openai"` (:321) and `modelPolicies.openai` (:758); tests key accounts as `'openai-codex'` (`assignment-dispatch.test.mjs:1336`); `provider-adapter.mjs:75-84` normalizes `openai-codex|codex` → `'openai-codex'` but leaves `'openai'` as-is; classifier :392 keys on `'openai'`; `deriveProviderFamily` returns raw `providerModel`. `hasProviderAccounts(cfg, provider)` is an exact string match, so an inventory under `providers.openai-codex` is invisible to an executor declaring `providerModel:"openai"`, and vice versa — silently "not managed".
- Fix: one `normalizeProviderFamily` applied at inventory validation and at the `providerCapacityProvider` derivation (:1628, :1270).
- Priority: next.

**M4. `deriveProviderFamily` called without the resolved command in two runner sites defaults to `'claude'`.**
- Evidence: `assignment-runner.mjs:273` (`policyForActualExecutor`) and `:1628`; `resolve.mjs:135` default `resolvedCommand='claude'`. A bare-shape non-Claude redirect target or executor without `providerModel` gets provider `'claude'`, model from `modelPolicies.claude`, provenance `provider: claude`. Known and deliberately left (`assignment-policy.mjs:389-405`) because 125 fixtures depend on it; `warnIfProviderFamilyUnreliable` exists. Live config is safe (all non-Claude executors declare `providerModel`).
- Fix: at minimum pass the `via:'cli'` invocation command (as `assignment-policy.mjs:406` and `placement-policy.mjs:116-118` already do) at the two runner sites; they are not the fixture-sensitive path.
- Priority: next.

**M5. `carries` gate cannot be satisfied through `compileDispatchPlan` preview.**
- Evidence: `plan.mjs:234` calls `resolveExecutorConfig(cfg, undefined, executorId, undefined, undefined, agentType)` with `contentCarries` undefined; `resolve.mjs:365-369` throws "did not declare what content it carries" when the executor declares `carries`. `compileDispatchPlan` then returns `mechanism:'unavailable', reasonCodes:['governance.blocked']` (:248-260) and `executeAssignment` throws at :1432-1435. No live executor declares `carries` today (rg on `.fgos/config.json`), so latent.
- Fix: thread `contentCarries` into the plan preview (assignment-level content class) or treat "undeclared at preview" as `governance.unknown`, not blocked.
- Priority: later.

**M6. Read-only redirect can retarget to a cross-provider executor with only the per-call `disallowedProviders` option as a governance re-check.**
- Evidence: live `placementPolicy.readOnlyRedirects.claude → {executor:"openai", invocation:"codex-cli-bwrap"}` (:112-125). Re-check :1500-1510 only consults `opts.options`, which no production caller populates (§1 row 2). `allowCrossProvider` on the target still fires at spawn (`resolve.mjs:499`), so egress is not silent, but the redirect's own decision record is a stderr line (`:257-260`) plus `executorRedirected` — no reason code naming *why* this pool entry won.
- Fix: persist `{sourceExecutorId, pool, seed, chosen, invocation}` in `dispatch-plan.json`/`run.json`, and make the redirect subject to the same `allowCrossProvider`-style declaration at the pool (e.g. `crossProvider: true` required when target family differs).
- Priority: next.

##### Low

**L1. `placement-policy.mjs` header (lines 1-11) is stale**: says "this module has no caller in the real dispatch path yet", while `cli.mjs:29`, `assignment-policy.mjs:28`, `assignment-runner.mjs:63` import its verified binders and `readOnlyRedirectPool` is the *only* reader of the redirect config. Priority: later (doc).

**L2. `provider-adapter.mjs` verified binder always diverges when a template lacks `{model}`** — `render` appends `--model` (:222-224) whereas legacy substitution does not, so `resolveVerifiedProviderArgs` returns `source:'legacy'` for those executors and the "production flip" is a no-op there. Not wrong, but the provenance tag overstates adoption. Priority: later.

**L3. `redactProviderCapacitySelection` is applied to persisted evidence but the full selection (with `credentialSource.home`) travels through `executeExecutorCli → buildConfinementRequest` (:2391, `request.mjs:416`).** `authority.mjs` persists `preparedInvocation`/envelope, not the request, and `effective-execution-contract.mjs:432-435` forbids `credentialSource`/`home` — no leak found; the path is a filesystem location, not a secret. Note only.

**L4. `worker-home.mjs` copies `~/.claude/.credentials.json` into the worker home (:125-127)**; removal at `herdr-round.mjs:561,929` is `try/catch` best-effort, so a crash leaves a credential copy under `baseDir`. Out of this group's ownership but relevant to "leaked credential". Priority: later.

#### 3. Contract audit

| Record | Producer | Consumer | Invariants stated | Gaps |
|---|---|---|---|---|
| `provider-capacity-state.v1` (`~/.fgos/runtime/provider-capacity/state.json`) | `acquire/release/quarantine/clear` | `rank`, `inspect`, doctor | quarantine w/o `until` ⇒ unhealthy; lease reclaim needs dead-run proof | Non-atomic write (M1); lock has no owner check (H2); `assignments` sticky map never pruned; audit only for clear |
| `provider-capacity-selection.v1` (`runDir/provider-capacity-selection.json`, also in effective contract) | runner :1793 | evidence readers | redacted (no credentialSource) | `credentialProvisioned:false` is the common state outside bwrap (H4); quarantine sub-record shape wrong (C1) |
| `run.json.fallback` / `evidence.json.fallback` | `attemptProviderCapacityFallback` | resume :1600, auditors | one attempt only; skippedCandidates listed | provider switch not named as a field (`fromProvider→toProvider`) — reader must diff plans |
| placement decision (`source:'placement-policy'|'legacy'` + divergence) | verified binders | stderr only (:257) | legacy wins on divergence | no persisted decision record; divergence not in run evidence |
| governance descriptor `{providerFamily, egress{kind,target,content}}` | `resolve.mjs:489` | `compileDispatchPlan` :270 | recorded | `content` defaults to `'repo-content'` when nothing declared (recorded, not enforced) |
| trust seed | `herdr-round.mjs:590` | `round.note` only | derived from trusted root | no removal, no record of *which* file was written (H3) |

Provenance sufficiency: account+provider+model+tier can be reconstructed from `dispatch-plan.json` + `provider-capacity-selection.json` + `run.json.fallback` **only when** bwrap provisioned the credential; otherwise `accountId` is asserted, not true (H4).

#### 4. Simplicity / architecture

- Dependency direction is clean: `provider-capacity.mjs` imports only node builtins; `placement-policy.mjs` imports `config`/`resolve`; neither imports the runner. `assignment-runner.mjs` re-implements `stableIndex` (:229) to avoid a cycle — acknowledged.
- Three copies of tier→policyTier and two of provider derivation (`placement-policy.mjs:41-44` names the debt). RUL11 applies: one `deriveProviderFamily(entry, cliCommand)` helper called everywhere would close M3/M4.
- Two fallback machineries exist for the same concept: `placement-policy.mjs` `admitFallbackCandidate`/`fallbackCandidates` (shadow, unexported, unused in production) and `recovery.mjs resolveFallback` (production). The shadow one should be deleted or the doc should stop describing it.
- Operator UX: a capacity refusal, a governance block, and a stale lock look different (`provider-capacity-refused` settled Run; `RunnerConfigError: dispatch decide blocked …`; raw `EEXIST` unsettled Run). Only the first is a classified Run outcome.
- Hidden coupling: runtime dir default is `~/.fgos/runtime/provider-capacity` (global, host-wide) while inventory is global-only by rule (`rejectProjectProviderAccountInventory`) — consistent, but neither registered in `fgos setup` config-merge; only the doctor read-check exists. `placementPolicy.readOnlyRedirects` is project-level config (validated at `config.mjs:1362`) — precedence project-over-global is inherited from `mergeWithGlobalConfig`; no hardcoded install-level assumption found.

#### 5. Performance

- Per dispatch: 1 lock + full `state.json` read/parse/write for acquire, again for release, again for quarantine; `providerAccountInventory()` re-validates the whole config on each call (`hasProviderAccounts`, `acquire`). Constant-size files; not a measured problem. `withFileLock` busy-waits with `Atomics.wait` 20 ms slices — fine.
- `selectReadOnlyRedirectExecutor` runs two identical hash selections per dispatch (legacy + verified) — negligible. Hypothesis only; no profiling evidence.

#### 6. Test gaps (priority order)

1. `executeAssignment` integration: fake executor emits quota stderr → assert `state.json` quarantine has `kind:'temporary'` **and** `until`; auth stderr → `kind:'manual-clear'`. (C1)
2. Classifier negative cases: "Unexpected token … failed", "invalid token in JWT test", with and without `provider`. (H1)
3. Stale `state.lock` from a dead pid is reclaimed; live pid is respected. (H2)
4. `herdr-round` trust seeding with `kind:'agy'` writes `settings.json.trustedWorkspaces` and never `~/.claude.json`; teardown removes the entry. (H3)
5. Unconfined cli-spawn with a selected lease: assert refusal or `credentialProvisioned:true`; resumed Run re-acquires the sticky account. (H4)
6. Inventory keyed `openai-codex` vs executor `providerModel:'openai'` resolves to the same provider. (M3)
7. Corrupt `state.json` does not brick dispatch. (M1)
8. Fallback evidence names `fromProvider`/`toProvider`. (1c)

#### 7. Doc corrections

- `docs/platform/agent-coordination/architecture/dispatch-control-plane.md:182` and `:343-344`: `fallbackExecutors` is **executed** (one bounded attempt on capacity refusal, since 33490c36/Phase B); delete "reserved-not-executed".
- Same file `:342` and `README.md:144`: replace "Neither mechanism may select an arbitrary cross-provider fallback" with "the rotator never changes provider; a declared `fallbackExecutors` candidate may resolve to a different provider, subject to `resolveFallback` governance (tier/visibility/allowed verdict) and the spawn-time `allowCrossProvider` gate".
- `:339` "PlacementPolicy binds provider/model/executor": it *verifies* the legacy binding and yields to it on divergence; say so, or cite the legacy binders as the current authority.
- `:309-324` diagram: capacity lease happens after Run admission and after Plan; move `Capacity` below `Admission` and drop the `Capacity → Governance` edge; add `Capacity refusal → fallback recompile (Governance)`.
- `:439` "single CLI folder-trust-store door": qualify — `worker-home.mjs` also writes a trust entry (into a private home), and agy kinds are currently mis-routed (H3).
- `:170` provider-family rule: add the exception that `cliOverride.providerModel`/`opPolicy.providerModel` override derivation, and that bare-shape entries default to `claude`.
- `src/runner/dispatch/placement-policy.mjs:1-11` header: remove "no caller in the real dispatch path yet".

### Phụ lục 3: 03 — Confinement authority + worker environment (read-only review, 2026-09-20)


Scope: `src/runner/dispatch/confinement/*`, `worker-home.mjs`, `worker-session.mjs`, `worker-session-boot.mjs`, their callers, doctor registration, tests. All paths relative to repo root. Evidence marked **[run]** was executed on this machine (Linux, bubblewrap 0.6.1 at `/usr/bin/bwrap`); everything else is code reading.

Empirical probe used: `scratchpad/probe-assignment-attestation.mjs` (scratch registry + scratch attestation store via `FGOS_CONFINEMENT_*` env vars, fake adapter with `preparedInvocationContract='exact-v1'`).

#### 1. Claim status table

| # | Doc claim (dispatch-control-plane.md / runtime-recovery-design.md) | Status | Evidence |
|---|---|---|---|
| 1 | `authority.mjs` is the mandatory launch gate; missing required backend refuses; no adapter turns refusal into unconfined spawn | **partial** | Gate is real for every out-of-process adapter (`transport.mjs:469` cli-spawn, supervisor `cli-spawn-supervisor.mjs:596`, herdr via `herdr-round.mjs:952-995` all require prepared invocation). Refusal is typed (`confinement-backend-missing`, `authority.mjs:648`, `1168-1176`). BUT the two doors default differently: non-assignment door (`executeThroughConfinement`, `authority.mjs:589-655`) needs an explicit `backendId`; assignment door (`prepareConfinementForLaunch`, `authority.mjs:1168`) defaults to `'bwrap'`. Production capabilities `advise`/`code:review`/`code:debug` resolve `backendId=null` **[run]** → the skill-facing `dispatch execute` door refuses them (Finding H2). |
| 2 | Diagram order Admission → request → policy/backend → resources/worker-home/session/boot → prepare/execute/finalize/attest → mechanism → adapters | **partial** | Order holds for cli-spawn. `worker-home`/`worker-session`/`worker-session-boot` are NOT invoked by authority; they are called from the herdr adapter (`herdr-round.mjs:529,544`) *after* authority handed the invocation over. Diagram places them inside the confinement box; code places them inside the adapter. |
| 3 | Execution capability set: missing capability refused by name, mode-specific reachability declared | **implemented** (for the confinement half) | `adapterConsumesPreparedSandbox` (`authority.mjs:58-73`) → `confinement-adapter-unsupported`; in-process → `confinement-unsupported` (`authority.mjs:447-463`); herdr non-bwrap backend → `confinement-backend-unsupported` (`herdr-round.mjs:966`). |
| 4 | "Confinement remains the only gate invoking the launch adapter; RunHandle runtime methods cannot bypass." S2: real bwrap herdr launch (2cff7102) | **partial / RunHandle = proposed** | Adapter fn is resolved only inside `executeThroughConfinement` (`authority.mjs:832-850`). `RunHandle` does not exist in `src/` (rg: 0 hits); `docs/.../run-handle.md:9` says "Design status: PROPOSED". Commit 2cff7102 exists and touches `drivers/bwrap.mjs`, `herdr-round.mjs`; herdr's confined branch reads Authority's prepared record (`herdr-round.mjs:1148-1187`). The doc sentence describes a proposed object as if it were a runtime constraint. |
| 5 | "only adapter/confinement evidence with declared positive coverage can produce `proven`" | **reserved-not-executed** | `attributeWorkspaceChanges` is called with only `preLaunchDirt/postRunDirt` (`assignment-runner.mjs:2648, 3017`); `adapterAttestation` and `declaredCoverage` are always null → `checkAttestation` (`evidence-attribution.mjs:130-136`) returns false → `proven` unreachable. Confinement never produces `writtenPaths`; its only fs "coverage" is argv-string inspection in `buildConfinementAttestation` (`authority.mjs:133-215`), and on the assignment path even that reads the *unwrapped* invocation (Finding H1). Cross-confirms sibling finding. |

#### 2. Spawn-site inventory (src/runner/dispatch, src/runner/coordination, bin)

| Site | Gated by authority? | Notes |
|---|---|---|
| `transport.mjs:469` `spawn(command,…)` (cliSpawnAdapter) | yes | reached only via adapterFn resolved at `authority.mjs:832-850`; receives `preparedInvocation` (bwrap-wrapped when confined) |
| `cli-spawn-supervisor.mjs:596` worker spawn | yes | reads `protected/launch-envelope/<id>.json` published by `prepareConfinementForLaunch` (`authority.mjs:1590-1640`); parks on missing envelope (`cli-spawn-supervisor.mjs:1099-1106`) |
| `cli-spawn-supervisor.mjs:841` supervisor self-spawn (`node supervisor.mjs envelope`) | yes (indirect) | spawns fgOS's own supervisor, not an executor; envelope is the gate artifact |
| herdr `agent start` (via `herdr-agent.mjs:64 execFileSync herdr …`, driven from `herdr-round.mjs`) | yes for required/preferred; **no for legacy/unconfined** | `runHerdrRound` refuses required without prepared invocation (`herdr-round.mjs:978-993`); an executor with only legacy `confinement:{privateHome,…}` or none launches the raw command through herdr with ambient env (`establishConfinement` `herdr-round.mjs:488-565`) — attestation records this as `herdr-partial-maturity` mismatch (`authority.mjs:356-362`) |
| `worker-session-boot.mjs:95` `herdr --session fgos-worker server` | no (infra, not executor) | detached, inherits operator env; not an executor launch; not attested |
| in-process Agent/Task, MCP (`cli.mjs:772-818`) | yes, attestation `null` | `authorityScope:'external-harness'` → returns invocation without adapter; refuses only when `mode==='required'` (`authority.mjs:447-463`) |
| http/api adapter (`transport.mjs` httpAdapter) | yes | no `preparedInvocationContract` → required refuses `confinement-adapter-unsupported`; unconfined passes through |
| `verbs/dispatch/recover.mjs` | n/a | no spawn; plans/applies via `recovery-planner.mjs`; relaunch re-enters `assignment-runner.mjs` → `prepareConfinementForLaunch` (`assignment-runner.mjs:2191`) |
| fallback relaunch (`assignment-runner.mjs:2070-2100`) | yes | refuses fallback candidate without confined invocation (`RunnerConfigError` "refusing to silently downgrade") — fail-closed |
| `probes/harness.mjs` 9× `spawnSync bwrap` | n/a | probe harness; production dependency of every required launch (`authority.mjs:752, 1287`) and of doctor (`registrations.mjs:4263`) |
| `assignment-runner.mjs:392-567`, `cli.mjs:549,1303`, `herdr-agent.mjs:64`, `bin/fgos.mjs` | n/a | `git`/`npm`/`fgos` self-invocations, not executor launches |
| `operation-choice.mjs:487` execFileSync | n/a | git count; not executor |

No executor launch path spawns an agent command without passing through `executeThroughConfinement`. The unconfined *outcome* is reachable only by an explicit `mode:'unconfined'` requirement (attested as `outcome:'unconfined'`, evidence `explicit-opt-out`, `authority.mjs:400-408`), by `authorityScope:'external-harness'` (in-process, attestation null), or by herdr legacy-flag executors (attested as mismatch). No global kill switch: `config.mjs:1283` rejects boolean `unconfined`; `runner.confinement.strict` (`config.mjs:1482-1547`) only tightens.

#### 3. Findings by severity

##### H1 — Assignment-path completed attestation records `unknown`/`backend:null` for a launch that was actually bwrap-enforced
- **Severity:** High (evidence integrity; every production Assignment run is on this path)
- **Evidence [run]:** identical request, fake adapter. Direct door → `outcome=enforced backend={id:bwrap…} coverage={…satisfied…} evidence=…falsification-probe`. With `assignmentLaunchContext` → `outcome=unknown backend=null coverage={hostWrite:unverified,process:unverified}`, no probe evidence — while the adapter received `/usr/bin/bwrap --ro-bind / / …`.
- **Cause:** `preparedConfinement`/`backendPlan` are only assigned in the `!assignmentLaunchContext` branch (`authority.mjs:586-589`); `prepareConfinementForLaunch` keeps its own locals (`authority.mjs:1162`) and returns neither. Final attestation uses `outcome: preparedConfinement ? "enforced" : undefined` (`authority.mjs:1098`) and `applyBackendPlanToAttestation(attestation, null)`. `buildConfinementAttestation` then inspects `request.invocation` (unwrapped `codex`/`claude`), not the envelope's bwrap argv.
- **Failure scenario:** any downstream consumer (`fgos dispatch show-run`, evidence review, future `proven` wiring) reading `<dispatchId>.completed.json` concludes the run was never confined. The `.prepared.json` record does carry the plan, but nothing links "prepared" to "actually launched".
- **Boundary:** authority-internal; no adapter change needed.
- **Why tests miss it:** `p04` R8 (only live test asserting `enforced`) is skipped unless `FGOS_LIVE_BWRAP_TESTS=1` and uses the direct door; `p03:993` uses direct door + fake adapter; `cli-spawn-reconciliation.test.mjs` asserts no attestation field; authority test at :986 asserts only `adapterOpts` threading.
- **Smallest fix:** have `prepareConfinementForLaunch` return `{ backendPlan, preparedConfinement }` (or at least `backendPlan` + `enforced` flag) and use them in the completed/failed attestation; add a test on the assignment door asserting `outcome==='enforced'` and `backend.id==='bwrap'`.
- **Priority:** P1.

##### H2 — Non-assignment `dispatch execute` door refuses every production `required` capability (`backendId` never resolves)
- **Severity:** High (functional; fail-closed, not a bypass)
- **Evidence [run]:** `buildConfinementRequest` with real config for `advise/claude`, `code:review/openai`, `code:debug/openai` → `mode=required policyId=host-write-denied backendId=null`; executor-level `confinement` is null for both executors, `backend:'bwrap'` lives only on the invocation (`.fgos/config.json` `claude-cli-bwrap`). `request.mjs:413` reads `cfg.executors[execId].confinement.backend` only. `authority.mjs:640-655` then throws `confinement-backend-missing: no confinement backend specified`, while `prepareConfinementForLaunch` defaults to `'bwrap'` (`authority.mjs:1168`).
- **Failure scenario:** a skill running `node src/runner/dispatch.mjs execute --for code:review` (the documented out-of-process door, `cli.mjs:1055`, no `assignmentLaunchContext`) always refuses. Only Assignment runs (`assignment-runner.mjs:2191`) can launch these capabilities.
- **Boundary:** `request.mjs` (request builder) or `authority.mjs` (defaulting rule).
- **Why tests miss it:** `p04` R1 Case 1 asserts the refusal as *desired* for a request with no backendId; nothing tests the real config's capabilities through `executeExecutorCli`.
- **Smallest fix:** one defaulting rule shared by both doors (e.g. `request.backendId || registry default || 'bwrap'` in `executeThroughConfinement` too), or lift invocation-level `confinement.backend` at `request.mjs:413`. Note `backendRegistry.defaultBackend` (`authority.mjs:1168`) is dead: `validateBackendRegistryShape` rejects any doc key other than `contract`/`confinementBackends` (`backend-registry.mjs:151-157`).
- **Priority:** P1.

##### M1 — Orphaned confinement private-homes are never reaped in production
- **Severity:** Medium (resource hygiene; credential retention risk on codex path)
- **Evidence [run]:** `/tmp/fgos-confinement` holds 215 `disp_*` dirs; 108 carry the ownership marker with a dead owner pid; oldest 2026-09-17. `reapOrphanedConfinementResources` (`cleanup.mjs:100`) has **zero** callers in `src/`/`bin/` (only `registrations.mjs` imports the registry bootstrap). On the assignment door the driver's `cleanup` closure is dropped (`prepareConfinementForLaunch` never returns it; `authority.mjs:1086` finally-block only fires for the direct door). `finalizeConfinementResources` deletes only on `exited`+`process-group` receipts (`authority.mjs:1690-1705`); `timeout` receipts carry `coverage:'partial-escaped-descendant-possible'` (`cli-spawn-supervisor.mjs:587`) → `retained` forever. A retained home may hold a copied Codex `auth.json` (`bwrap.mjs:28-52,371`). (0 of the 215 currently hold `auth.json`.)
- **Boundary:** doctor/setup or a runner sweep.
- **Smallest fix:** call the reaper from `fgos doctor --fix` (or on runner start) with `tempRoot = backendConfig.privateHomeRoot||tempRoot||os.tmpdir()/fgos-confinement`; add a doctor check that counts markered dead-owner dirs.
- **Priority:** P2.

##### M2 — herdr worker homes: no reaper, and the test suite leaks them
- **Severity:** Medium (test hygiene) / Low-risk today
- **Evidence [run]:** 415 `/tmp/worker-*` homes, every one with `.claude/.credentials.json`; all are 37-byte test fixtures (0 match the real credential hash), oldest 2026-09-10. Marker `.fgos-worker-home` is known only to `worker-home.mjs`; no reaper. Production path removes on settle (`herdr-round.mjs:929`) and redacts on failure (`:1081`), but a controller crash between `createWorkerHome` (`:529`) and either leaves a real credential copy (`worker-home.mjs:126`) at 0600 in `/tmp`.
- **Smallest fix:** tests must create homes under their own mkdtemp base and rm it; add the worker-home marker to the same reaper as M1.
- **Priority:** P2.

##### M3 — Full controller environment persisted in plaintext under `runDir/protected/`
- **Severity:** Medium (at-rest secret exposure to other local users; not a worker-facing leak)
- **Evidence [run]:** `protected/launch-envelope/lc-01.json` → `invocation.env` has 94 keys incl. `PATH`, `HOME`; source is `workerEnv = {...process.env, ...resolvedExecutorEnv}` (`authority.mjs:1352`) written into `prepared-invocation` (`:1433`) and the envelope (`:1610`), plus a compat copy (`:1643`). `.fgos/assignments/` is gitignored (`.gitignore:24`) but dirs are created with default mode (`cli-spawn-supervisor.mjs:99,125`). Executor secrets such as `${GLM_OPENROUTER_API_KEY}` (`.fgos/config.json` glm executor) are substituted into this env. `attestation-store.mjs` header promises "redacted references and digests only" — true for attestations, false for these two records.
- **Smallest fix:** persist `envDigest` + the executor-declared delta only; let the supervisor rebuild `process.env` at spawn (it already lives on the same host). Or chmod `protected/` 0700.
- **Priority:** P2.

##### M4 — Bypass pairing is evaluated against legacy flags that the policy model never sets
- **Severity:** Medium (contract confusion; fail-closed)
- **Evidence:** `evaluateBypassPairing` inputs come from `invocation.confinement` legacy fields (`authority.mjs:506-520`; `herdr-round.mjs:492-511`; `config.mjs:934-948`). Both built-in policies declare `home:'host', session:'shared', workspace:'shared'` (`policies.mjs:24-62`), so a `permissionMode:'bypass'` executor confined by the *new* policy path with a bwrap private home is still refused unless it also carries the legacy `privateHome/isolatedSession/ownWorktree` flags — and those flags describe the herdr mechanism, not the bwrap one. Bypass is config-declared only (worker cannot request it); it is **not** recorded in the attestation (`buildConfinementAttestation` ignores `permissionMode`), only in the prepared invocation.
- **Smallest fix:** derive the pairing from the effective plan coverage (`control:home/session/workspace` satisfied) and record `permissionMode` in the attestation.
- **Priority:** P3.

##### L1 — Refusal-path attestation write failure masks the typed refusal
- `saveAttestationRecord` (`attestation-store.mjs:166`) throws `AttestationStoreError`/fs errors *before* each `throw new DispatchError(…)` (e.g. `authority.mjs:481,530,573,615`). An unwritable `~/.local/state/fgos/attestations` turns `confinement-backend-missing` into an untyped fs error; on the completed path (`:1103`) it throws after the worker already ran, dropping `adapterResult`. Launch never proceeds without a prepared record (good: fail-closed pre-spawn). No doctor check covers the store dir or `XDG_STATE_HOME`/`FGOS_CONFINEMENT_ATTESTATION_STORE_PATH` (rg `attestation` in `registrations.mjs`: 0 hits). Priority P3.

##### L2 — `getBackendDriver` throws an untyped `ConfinementBackendRegistryError` on the direct door
- `authority.mjs:635` is outside try/catch (the assignment door wraps it at `:1200-1210`). A registry entry of type `container`/`remote` (allowed by schema, no driver) surfaces as a non-`DispatchError` with no attestation. Priority P3.

##### L3 — `private-home` grant is "satisfied" by allocation, not by use
- `claude-cli-bwrap` has no `resourceBindings` pointing `HOME` at the private home (`.fgos/config.json`), so the sandbox keeps the operator's read-only `HOME` under `--ro-bind / /` (`bwrap.mjs:356`) while the attestation reports `grant:private-home: satisfied` **[run]**. Codex executors bind `CODEX_HOME` correctly. Priority P3 (config + contract wording).

##### Non-findings (checked, OK)
- Symlink/traversal: `canonicalizeAndVerifySubpath` (`resources.mjs:28-95`) refuses escapes; cleanup deletes only markered dirs with matching `dispatchId` (`cleanup.mjs:63-85`); `finalize` compares marker digest recorded at prepare (`authority.mjs:1723-1728`); `removeWorkerHome` refuses unmarked dirs (`worker-home.mjs:170-186`).
- Attestation store isolation vs writable grants is fail-closed and checked three times (`bwrap.mjs:319-326`, `authority.mjs:1228-1240`, `bwrap.mjs:342`).
- Attestation attribution: fresh `dispatchId` per request (`request.mjs:360`); no stale reuse. Resume reuses the on-disk prepared-invocation digest (`authority.mjs:1467-1489`) — correct.
- Inherited fds closed by the bash wrapper (`bwrap.mjs:401`); no `--unshare-net`/`--unshare-pid` is *by declared policy* (`process:host`, `networkEgress:allow` are the only supported values, `bwrap.mjs:172-200`): confinement is write-deny only; host reads, network and the full env are allowed and honestly attested as such.

#### 4. Contract audit

| Record | Producer | Consumer | Validated on write | Validated on read | Gap |
|---|---|---|---|---|---|
| `confinement-request.v1` | `request.mjs:259 buildConfinementRequest` | `authority.mjs:444,1127` | `validateConfinementRequest` (allowed keys `request.mjs:20-31`) | n/a | `backendId` resolution inconsistent (H2) |
| `confinement-plan.v1` | `authority.mjs:697-722 / 1250-1275` | attestation, `finalization.preparedPlan` digest | `savePlanRecord` checks `dispatchId` only | none | no schema validator |
| `confinement-attestation.v1` | `buildConfinementAttestation` | store, `cli.mjs` results, `createRedactedAttestationReference` | `validateAttestationCompleteness` (phase/outcome/channels) | `loadAttestationRecord` | outcome wrong on assignment door (H1); `permissionMode` absent (M4) |
| `authority-prepared-invocation.v1` | `authority.mjs:1409-1456` | `herdr-round.mjs:1150-1181` (digest-verified), supervisor via envelope | digest | digest + caller digest | contains full env (M3) |
| `confinement-finalization.v1` | `authority.mjs:1495-1530` | `finalizeConfinementResources` | digest over subset | none (JSON.parse) | `cleanupState` never reaches `cleaned` on timeout receipts (M1) |
| `cli-spawn-launch-envelope.v1` | `authority.mjs:1590-1640` | `cli-spawn-supervisor.mjs:1099` | digest | digest | full env (M3); compat `launch-envelope.json` is first-attempt-only (EEXIST swallowed `:1644`) |
| `confinement-backend-registry.v1` | operator / `ensureMachineBackendRegistryDefaults` | `loadMachineBackendRegistry` | closed schema | closed schema | `defaultBackend` referenced but schema-forbidden (H2 note) |
| `ConfinementBackendDriverV1` | `drivers/bwrap.mjs:445` | `registerBackendDriver`/`getBackendDriver` | type whitelist only | — | `assess/prepare` shape not validated at registration; claims-vs-plan mismatch checked only on direct door (`authority.mjs:773-820`), **not** on assignment door |
| worker-home provisioning | `worker-home.mjs:73` | herdr adapter | arg checks + trust read | — | no schema; marker private to module |

#### 5. Simplicity / architecture

- **Layering inversion:** `authority.mjs` imports `../transport.mjs` (adapters, env resolution, `DispatchError`), `../cli-spawn-supervisor.mjs` (proof publishing) and `../herdr-agent.mjs` (`authority.mjs:7,16,23-30`). The confinement box depends on the adapter box it is supposed to gate; `bwrap.mjs` also imports the attestation store. Extracting `DispatchError` + `resolveExecutorEnv` + proof helpers into a leaf module would restore the doc's arrow direction.
- **Two doors, two rule sets:** `executeThroughConfinement` (direct) and `prepareConfinementForLaunch` (assignment) duplicate ~200 lines (registry load, assess, adapter check, coverage failures, plan, probe, prepare, prepared attestation) with drift already visible: backend defaulting (H2), store-isolation check (assignment only, `:1228`), claims-mismatch check (direct only, `:773`), driver-error wrapping (L2), cleanup closure ownership (M1). One `assessAndPrepare(request)` used by both would remove the class.
- **Legacy vs policy confinement:** `normalizeLegacyConfinement` flags and `requirement.policy` controls coexist; bypass pairing and herdr `establishConfinement` read only the legacy side (M4). Two vocabularies for one posture.
- **Attestation heuristics:** `buildConfinementAttestation` parses bwrap argv strings (`:133-215`) to infer `hostWrite deny`; the driver already *knows* what it emitted. Feeding driver claims into the attestation (as the plan path does) would delete the parser.
- **New-backend extension:** `registerBackendDriver` only checks `type ∈ {bwrap,container,remote}`; `verifyRequiredProbe` hard-fails any non-bwrap type (`authority.mjs:94-97`), so a `container` driver can never pass required mode. Extension contract is declared, not executable.
- **probes/harness.mjs** is a production dependency (authority + doctor), not test-only.
- **Actionable errors:** refusals are typed and name the missing thing; good. The one prose-only case is L2.

#### 6. Performance

- Every required launch runs the 8-probe harness + `bwrap --version` (`verifyRequiredProbe` → `runAllConfinementProbes`, `computePlatformDigest`): 9 `spawnSync`, a `mkdtemp` tree, **213 ms measured [run]**. No cache keyed on the fingerprint (`computeProbeFingerprint`) despite the fingerprint existing for exactly that. Doctor's `confinement-probe-freshness` (`registrations.mjs:4263`) repeats it. Fix: cache `{fingerprint → passedAt}` in the attestation store with a TTL.
- `assertAttestationStoreIsolated` + `realpath` walks run 3× per launch; `loadMachineBackendRegistry` re-reads and re-validates per launch. Negligible next to the probe cost.
- `finalize` reads/writes descriptor and marker per resource; fine.

#### 7. Test gaps

1. No test drives the assignment door to `completed` and asserts `outcome/backend` (H1). Suggested: extend `dispatch-confinement-authority.test.mjs` fixture at :940-1000 with `requirement.mode='required'` + scratch registry (skip without bwrap).
2. No test builds requests from the real `.fgos/config.json` capabilities through `executeExecutorCli` (H2).
3. `p04` R8 (the only real bwrap `enforced` assertion) is opt-in via `FGOS_LIVE_BWRAP_TESTS=1`; CI and `npm test` never run it although bwrap is present here.
4. No test for `finalizeConfinementResources` with a `timeout`/partial-coverage receipt (retained-forever path) or for the reaper being wired (M1).
5. No test that attestation-store write failure preserves the typed refusal (L1); no doctor test for the store dir.
6. `dispatch-worker-home.test.mjs` / herdr tests leave 415 homes in `/tmp` (M2).
7. No test that `permissionMode:'bypass'` + policy-based private home passes pairing (M4 would fail it).
8. `container`/`remote` driver registration has schema tests but no test proving they cannot pass required mode (documents the reserved status).

#### 8. Doc corrections

- `dispatch-control-plane.md` Subcomponent Map (uncommitted, +161 lines): move `worker-home`/`worker-session`/`worker-session-boot` from the Confinement box to the herdr adapter; they run after the gate (`herdr-round.mjs:529,544`).
- Same section: replace "RunHandle runtime methods cannot bypass" with the actual invariant (adapter function resolved only inside `executeThroughConfinement`, `authority.mjs:832-850`); `RunHandle` is PROPOSED (`run-handle.md:9`).
- State that `required` confinement today means **host-write-deny only** (host read, network, env, process namespace all allowed) — `bwrap.mjs:172-200` refuses any stronger control.
- State the two-door difference in backend defaulting until H2 is fixed, and that `backendRegistry.defaultBackend` is not a valid registry key.
- `attestation-store.mjs` header "public events and results carry redacted references and digests only" should exclude `prepared-invocation`/`launch-envelope` (M3) or those records should be redacted.
- Evidence attribution: document that `proven` is reserved; confinement produces no `writtenPaths` (claim 5).
- `runtime-recovery-design.md` S3 "eligible fallback through compiler and confinement — Implemented": accurate for Assignment runs (`assignment-runner.mjs:2070-2100`); note it does not cover the direct door.

#### Unresolved questions
- Is the direct `dispatch execute --for <required-capability>` door meant to be usable by skills before "P06 wires backends" (`p04` R7 wording), or is refusal the intended interim? (Determines whether H2 is a bug or a doc gap.)
- Should `permissionMode:'bypass'` ever be legal on the bwrap policy path, or only on herdr legacy flags?

### Phụ lục 4: Review 04 — Run admission, run lock, launch orchestration, payload prepare, effect guarantee


Scope: `src/runner/dispatch/assignment-runner.mjs` (3377 lines), `run-lock.mjs`, `prepare.mjs`, `dispatch-error.mjs`, `brief.mjs`; callers `session-engine.mjs`, `cli.mjs`, `recover.mjs`. Read-only review, no tests run.

Doc references: `docs/platform/agent-coordination/contracts/assignment-run-runresult.md` (§Run, lines 43-225) = **contract doc**; `docs/architect/agent-coordination/architecture/runtime-recovery-design.md` (§6 lines 148-185, §9 lines 232-243; the `docs/platform/...` copy is byte-different only in its migration banner, same claims) = **recovery doc**.

#### 1. Claim status table

| # | Claim (source) | Status | Evidence |
|---|---|---|---|
| 1 | `assignment-run.v2` writer with contract/revision CAS, admissionKey, admissionPayloadDigest, supersedesRunId, phase, delivery, launchCommandId/launchState, writerRuntime, settlement (contract doc §Proposed Amendment) | **partial** | `run.json` carries `contract:'assignment-run.v2'`, `runId/attempt/supersedesRunId/retryId/payloadDigest/dispatchPlanDigest/phase/delivery/executorId/status` (assignment-runner.mjs:1563-1585). No `revision` CAS, no `admissionKey`, no `writerRuntime`, no `settlement` object. `phase:'admitted'` and `delivery:'not-sent'` are written once and never advanced (only write sites: 1571-1572). launchCommandId lives in separate `controller/commands/<id>.json` projections, not in run.json. |
| 2 | `admitRun(...)` with typed created / already-admitted / refused results | **partial** | `admitRunAttempt` (938-1176) is module-private; internal decide statuses `duplicate` / `duplicate-retry` / `invalid-predecessor` exist (975-979, 1000, 1040) but surface only as `RunnerConfigError` prose (1079-1088) or as `{resumed:true|false}` (1094, 1166, 1175). No reason code on the error (config.mjs:75-81 has `category:'validation'` only). |
| 3 | Atomic admission + crash durability (contract doc says NOT implemented; recovery doc S1 says Implemented) | **implemented for fenced callers, absent for unfenced callers** | Append-only generation ledger via fsynced temp + `linkSync` (run-lock.mjs:178-206); staging dir + `renameSync` (1131-1170). Only a caller passing `retryId` gets idempotent/predecessor fencing (955-1000). Every caller except session-engine's schema-2 retry path (session-engine.mjs:4811) omits `retryId`; cli.mjs:1557/1729, operation-choice.mjs:2211, session-engine.mjs:345 are unfenced and get "next available attempt" (1003-1023, test assignment-dispatch.test.mjs:3023). Two concurrent unfenced `execute` calls yield two admitted, launched Runs. **Contract doc is stale; recovery doc overstates "no two winners".** |
| 4 | Per-Run controller lock: holder `{hostId, bootId, pid, processStartTime}`, generation records, no TTL-only takeover, release markers, temp+fsync+hardlink | **partial** | Ledger/markers/hard-link/no-TTL-takeover implemented (run-lock.mjs:275-318, 328-340). Holder identity is `{id, pid}` only (assignment-runner.mjs:1944, 3125; recover.mjs:280). Reclaim decision is `isProcessAlive(pid)` = `kill(pid,0)` (run-lock.mjs:33-41, 300) — no bootId / processStartTime match. Contract doc "not implemented" is stale; recovery doc "Implemented" omits the identity gap. |
| 5 | Phases admitted → launched → bound → delivered → settled | **partial** | Launch/bind facts exist as separate artifacts for cli-spawn (evaluator-baseline 2025, command projection 2047, supervisor/worker bindings read at 3260-3312) but the Run record's own `phase`/`delivery` never change; `status` flips `running→settled/failed` via `markRunSettled` (visibility-session.mjs:334-344) and direct rewrites (2839, 3066). |
| 6 | At most one current un-settled Run per Assignment | **partial** | Enforced only via `retryId`+`predecessorRunId` (invalid-predecessor, 995-1000) and, in-process, by session-engine claim files (`dispatch.claim` 4xx, `retry-N.claim` 4796-4806). Unfenced callers can admit a second un-settled Run at any time. |
| 7 | `attempt` never resets | **implemented** | attempt = max(nextEpoch, max existing dir, max ledger attempt)+ (1003-1023); ledger is append-only. |
| 8 | Missing/lost RunHandle never grants a new admission; recovery reads result → handle → classify → then admits | **partial / violated on resume** | Resume path (1840-1876) reads result.json, then reconcile; but when reconcile returns `waiting`/`parked`/`observed`/`refused` (not `settled`) execution **falls through to a fresh launch of the same Run** (1872-1875 → 1877+ → 2249). See F1. |
| 9 | Cancellation is intent, not proof; cancelled Run still settles via late result | **not implemented** | `reconcileCliSpawnRun` parks `cancel-unsupported` (3081-3083); herdr-round.mjs:1876-1877 same. No cancel intent record exists. |
| 10 | Lock order session → Assignment → Run; no session/Assignment lock spans provider I/O; no upward acquisition | **implemented for locks, violated by claim files** | assignment-runner imports no session store (only `state/workflow-stage-graphs.mjs`, line 55) — cannot call upward. store.mjs:2420 releases session lock before adapter I/O. But session-engine's Assignment-level `retry-N.claim` (4796-4806) and `dispatch.claim` are held across the whole `executeAssignment` (provider I/O) and survive a crash requiring manual deletion (message text 4801-4802) — contradicts recovery doc X07 "no manual claim-file deletion". |
| 11 | Effect protection: "Run promises no exactly-once external effect" | **implemented as classification only** | `dispatch-effect-guarantee.test.mjs` imports `compileDispatchPlan`, `resolveAssignmentDispatchPolicy`, `assessBwrap`, `recovery.mjs` (lines 4-13) and proves the repeat-eligibility matrix of pure functions (`assess`, repeatMode). It proves nothing about runtime dedup or that a duplicate launch cannot happen. |
| 12 | Assignment immutability: retry never rewrites Assignment | **partial** | Runner rewrites `assignment.json` to append `dispatchedRuns` via non-atomic read-modify-write (1883-1894); initial write is also non-atomic `writeFileSync` (1369). Assignment fields themselves are not rewritten; `mutation` backfill is in-memory (1400-1405). |
| 13 | prepare.mjs "builds bounded payloads" | **not implemented** | `buildPrompt` reproduces description verbatim, "never truncated" (prepare.mjs:45-46, 78-138); no size bound anywhere in prepare.mjs/assignment.mjs. `prepareDispatch` (147-158) has zero callers (grep). |
| 14 | Strict fencing against the exact superseded Run | **partial** | Admission-time exact fencing exists for fenced callers (predecessorRunId vs current valid generation, 995-1000). Result-link fencing in store.mjs `linkResult` still authorizes by presence of a `run-retried` event (store.mjs:2134-2138), not exact Run. Stale result fencing at settle is by control token (2292, 2410, 2711). |
| 15 | Standalone supersession event (`run-retried` equivalent for standalone dispatch) | **not implemented** | `run-retried` only in coordination store (store.mjs:2196-2250). Standalone retry = call `executeAssignment` again; `supersedesRunId` only populated when caller passes `predecessorRunId` (1567). |
| 16 | Docs: assignment-runner reads `compiledPlan.policy` directly, no second policy resolution | **implemented** | Single `compileDispatchPlan` call (1422); `effectivePolicy = compiledPlan.policy` (1437). Fallback re-compiles per candidate by design (1231). Governance check follows immediately (1432-1435); placement redirect (1454-1520), provider capacity lease after admission (1635), confinement prep under control lock (2191). No Assignment branch launches without `compileDispatchPlan`; the only plan-less launch is the non-Assignment legacy `execute <executorId> --prompt` path (cli.mjs:259-283 `openDispatchRun`). |
| 17 | Runner never mutates Work lifecycle / session state | **implemented** | Imports (16-108): no `src/state/work*`, no coordination store, no verbs. |

#### 2. Findings by severity

##### Critical

**F1 — Resume of an un-settled Run with a live or unknown worker falls through to a second spawn of the same Run**
- Severity: Critical
- Evidence: assignment-runner.mjs:1840-1876 (resume block) — the only early return is `if (rec.settled && rec.runResult) return rec.runResult;` (1873-1875). `reconcileCliSpawnRun` returns `{status:'waiting', state:'supervisor-running'|'running'}` when supervisor/worker pid is alive (3286, 3312) and `parked`/`observed`/`refused` otherwise; none of these stop execution. Control continues to `dispatchedRuns` bookkeeping (1883), prompt render (1901), control acquire (1945), new `launchCommandId` (1971), new command projection (2047), `startSupervisorProcess` (2249). Control acquisition does not block: the dead coordinator's pid is reclaimable (run-lock.mjs:300), and the detached supervisor/worker never held the control lock.
- Actual problem: F-b ("coordinator dies after bind; recovery finds live worker, same Run, zero new spawn") is not honoured by `executeAssignment`. Reachable via session-engine `retrySessionTask` resume with the pending retry tuple (session-engine.mjs:4811 → same retryId → `duplicate` → `resumed:true`) and via any rename `EEXIST` (1160-1166).
- Failure scenario: coordinator crashes after launching worker A; operator/loop re-runs retry; worker A still editing the worktree; worker B is spawned into the same cwd under the same runId, same outbox. Two workers write `outbox/result-1.json`; last writer wins; evidence attribution mixes both.
- Boundary: Run admission rule ("a missing or lost RunHandle never grants a new admission") and RunHandle contract.
- Why tests miss it: herdr-reconciliation.test.mjs:634 (F-b) calls `reconcileHerdrSpawnRun` directly and asserts `waiting`; no test resumes through `executeAssignment` with a live worker. assignment-dispatch.test.mjs:2832 deletes the run dir (no worker) so the relaunch is the desired behaviour there.
- Smallest safe fix: after `rec = await reconcileFn(runDir)`, if `rec.status` is `waiting`/`held`/`observed`/`refused`, or `parked` with a reason other than `command-missing`, throw a typed refusal (`run-in-flight` / `run-unreconciled`) instead of falling through; only `command-missing` (nothing was ever launched) may proceed to launch.
- Priority: now.

##### High

**F2 — Control-lock reclaim is pid-liveness only; pid reuse and hidden /proc both defeat it**
- Severity: High
- Evidence: run-lock.mjs:33-41 (`kill(pid,0)`; EPERM = alive), 296-303 (reclaim when `isProcessAlive` false); holder record `{id, pid}` at assignment-runner.mjs:1944, 3125, recover.mjs:280. `getBootId`/`getProcessStartTime` exist (cli-spawn-supervisor.mjs, used at 3267-3299 for worker incarnation) but are not used for the controller holder. Recovery doc §6 line 158 requires `{hostId, bootId, pid, processStartTime}`.
- Actual problem: (a) pid reuse after reboot or long uptime → a dead holder's pid can belong to a live unrelated process → lock stuck "held" forever with no TTL escape (by design there is none). (b) Sandboxed/containerised contender (this repo's own note: sandboxed bash cannot see host processes) sees ESRCH for a live holder → reclaims → two live controllers; the loser only discovers it at the next `isRunControlCurrent` check (2292/2410/2711) after adapter I/O already ran.
- Boundary: recovery doc §6 holder identity; "Unknown liveness is not dead".
- Why tests miss it: assignment-dispatch.test.mjs:2962 releases the token cleanly before the interloper acquires; no test exercises reclaim of a dead pid vs a reused pid vs an invisible pid.
- Smallest safe fix: record `bootId` and `processStartTime` in the holder (both helpers already exist); in `acquireRunControl` treat "pid alive but startTime mismatch" as dead and "cannot read /proc/<pid>" as **unknown → held** (never reclaim on unknown).
- Priority: now.

**F3 — `RunnerConfigError` now fires after spawn, but session-engine treats it as "nothing was spawned" and deletes its claim file**
- Severity: High
- Evidence: session-engine.mjs:385-397 (comment: every `RunnerConfigError` throw site "fires strictly before … mkdirSync(runDir)"), 436-446 and 4818-4825 (unlink claim on `RunnerConfigError`). assignment-runner.mjs throws `RunnerConfigError` at 1957 (control held — run dir exists), 2293 / 2411 / 2712 (control token superseded — after adapter I/O completed, worker has run).
- Actual problem: the error-type contract the engine relies on was widened by the admission/lock work. On a "no longer current" refusal the worker ran (test 2962 shows agent files written, result.json withheld); the engine removes `dispatch.claim`/`retry-N.claim`, re-opening the very window the claim exists to close, while the Run has no settlement.
- Boundary: session-engine ↔ runner error contract; dispatch-claim exclusivity.
- Why tests miss it: 2962 asserts the refusal message only; no test asserts claim-file state after a post-spawn `RunnerConfigError`.
- Smallest safe fix: introduce a distinct error (or `code` field) for post-admission refusals (`run-control-held`, `run-control-superseded`) and make session-engine unlink only on pre-admission validation errors.
- Priority: now.

**F4 — result.json / run.json / assignment.json written non-atomically; a torn result.json on resume triggers relaunch (duplicate effect)**
- Severity: High
- Evidence: `fs.writeFileSync(path.join(runDir,'result.json'), …)` at 1782, 2717, 2833, 3060; run.json full rewrites at 2839, 3066 (plain `writeFileSync`); assignment.json at 1369 and 1887-1890. Compare the atomic helpers available in the same file's import list: `publishImmutableProof`/`publishMutableProjection` (cli-spawn-supervisor.mjs:97-137), `writeJsonAtomic` in visibility-session.mjs:342, `writeRunJsonPatch` in recover.mjs:176-183.
- Actual problem: crash mid-write leaves a truncated result.json. On resume (1841-1846) `interpretRunResult` throws on the parse, is swallowed, reconcile also swallows it (3088-3093) and returns `parked` (worker dead) → F1 fall-through → relaunch of a Run whose effects already happened. `dispatchedRuns` RMW (1883-1894) under two concurrent unfenced callers loses one entry → operation-choice.mjs:140-149 later refuses that Run's evidence as "never dispatched".
- Boundary: Run settlement durability; Assignment immutability (append-only bookkeeping key).
- Why tests miss it: no torn-write fixture; concurrency tests (2774, 2808) use fenced tuples.
- Smallest safe fix: route the four result.json/run.json writes and the assignment.json append through `publishMutableProjection` (temp+fsync+rename); for `dispatchedRuns` use an append-only marker per attempt (`assignment/dispatched/<NN>`) instead of RMW.
- Priority: now (result.json), next (assignment.json).

##### Medium

**F5 — Unfenced callers get no "one un-settled Run per Assignment" guarantee at all**
- Severity: Medium (High for `fgos dispatch execute --assignment` run twice by an operator/loop)
- Evidence: admitRunAttempt 955-1023: with `retryId === undefined` the decide callback never returns `stop`; concurrent callers publish generations 1 and 2 and materialise `runs/01` and `runs/02`, each launching. Callers without `retryId`: cli.mjs:1557, 1729; operation-choice.mjs:2211; session-engine.mjs:345 (first attempt, guarded only by the in-session `dispatch.claim`). Test 3023 pins this as intended byte-compat.
- Actual problem: exclusivity for the CLI door is nil; the "next available attempt" contract is the old readdirSync behaviour, not admission.
- Boundary: contract doc "At most one current un-settled Run per Assignment".
- Smallest safe fix: in the unfenced branch, refuse when the current valid generation's Run has no `result.json` and its control generation holder is alive/unknown (reuse F2 identity check); expose `--force-new-attempt` for operators.
- Priority: next.

**F6 — Admission refusals and lock refusals are prose-only `RunnerConfigError`s**
- Severity: Medium
- Evidence: 1079-1088, 1957-1959, 2293, 2411, 2712 (message strings); config.mjs:75-81 (no `code`); tests discriminate with regexes (`/could not acquire control|invalid-predecessor|duplicate-retry/`, 2793; `/no longer current/`, 3020). `DispatchError` (dispatch-error.mjs:16-24) already carries `errorClass`/`code` but is reserved for adapter failures. No `.message.includes` on these in src (grep), so callers cannot currently distinguish `held` from `config-invalid` at all (session-engine 439, cohort-planner 166/631, run.mjs:350 branch on class/category only).
- Smallest safe fix: add `code` to `RunnerConfigError` (`admission-duplicate-retry`, `admission-invalid-predecessor`, `run-control-held`, `run-control-superseded`) and have tests assert on `code`.
- Priority: next.

**F7 — `expectedRunId` can push `attempt` forward, creating gaps that unfenced callers then fill**
- Severity: Medium
- Evidence: 1025-1033 (`declaredAttempt > attempt` → adopt it); unfenced allocation 1003-1023 uses max(existing dirs, ledger attempts)+1 so a later unfenced call fills the highest+1, but a session declaring attempt 5 while ledger is at 2 leaves 3-4 unallocated forever and lets two ledgers (session retry generations, assignment admission generations) disagree on "current". Ledger drift is refused only when `runId !== expectedRunId` (1037-1060).
- Smallest safe fix: refuse `expectedRunId` whose attempt ≠ computed next attempt instead of adopting it; make the session's `nextRunId` derive from the assignment ledger, not vice-versa.
- Priority: later.

**F8 — Contract file and dispatch-plan rewritten in place after admission**
- Severity: Medium
- Evidence: 1696-1704 (fallback rewrites dispatch-plan.json + effective contract), 2239 (cli-spawn rewrites effective contract after Authority prep), 2361 (legacy). Plain `writeFileSync`; the same files were fsynced into the staging dir at 1137-1156 to be crash-safe. reconcile treats unreadable protected artifacts as `refused: protected-artifact-corrupt` (3186-3240), so a torn rewrite bricks recovery for that Run.
- Smallest safe fix: `publishMutableProjection` for both rewrites.
- Priority: next.

##### Low

**F9 — Session-engine claim files span provider I/O and need manual deletion after a crash**
- Evidence: session-engine.mjs:4796-4806 (`retry-N.claim` `wx`), 4801-4802 (repair guidance: "remove <path>"). Recovery doc §6 "No session/Assignment lock spans provider I/O"; X07 "no manual claim-file deletion".
- Fix: replace the claim with the assignment admission ledger (F5 fix) so no second exclusivity mechanism exists. Priority: later.

**F10 — 20 ms busy poll for the adapter receipt**
- Evidence: 2271-2290 (`existsSync` + `readFileSync` every 20 ms for up to `timeoutMs + 10 s`). Fix: `fs.watch` on the receipts dir or back-off to 250 ms after the first second. Priority: later.

**F11 — Legacy `run.json` writer outside admission**
- Evidence: cli.mjs:259-283 `openDispatchRun` writes an un-admitted `run.json` (schema-less `runId: <workId>-<timestamp>`) for the prompt-only `execute <executorId>` path. Not an Assignment Run, but it shares `markRunSettled` and the `dispatch-runs/` layout, so tooling that globs `run.json` sees two shapes. Fix: stamp `contract:'dispatch-run.legacy'` on it. Priority: later.

#### 3. Contract audit rows

| Record | Owner (writer) | Producers | Consumers | Invariants stated | Validated at boundary? |
|---|---|---|---|---|---|
| `admission/generations/NNNNNNNNNN.json` | admitRunAttempt | executeAssignment only | admitRunAttempt (`isGenerationValid` 984-999) | append-only, monotonic epoch, tuple idempotence per retryId | Structure never validated on read (`parseJsonFile` returns any JSON, run-lock.mjs:117-131) |
| `admission/markers/<retryId>.aborted.json` | coordination store (`markRunRetryAborted`) | store.mjs | admitRunAttempt 947-952, 986 | one-shot | presence only |
| `runs/NN/run.json` (`assignment-run.v2`) | admitRunAttempt (create), executeAssignment/markRunSettled/settle* /recover (rewrite) | 4 writers, 2 atomic (visibility-session, recover), 2 non-atomic (2839, 3066) | reconcile 3160-3170, session-engine `findLatestRunResult`, `dispatch recover`, `show` | status ∈ RUN_STATUSES; `phase`/`delivery` never updated | `markRunSettled` validates status only |
| `runs/NN/control/generations/*.json` + `releases/*.release` | run-lock.mjs | executeAssignment (worker-spawn), reconcile (reconciliation), recover (recovery-apply) | same three + `isRunControlCurrent` | monotonic; release marker per epoch; live pid never reclaimed | holder shape not validated; `holder.pid` may be undefined → `isProcessAlive(undefined)` = false → reclaimable |
| `runs/NN/controller/commands/<launchCommandId>.json` | executeAssignment (`publishMutableProjection`) | executeAssignment, reconcile | resume 1847-1870, reconcile 3096-3110 | `contract` discriminates cli-spawn vs herdr | contract string checked; digests checked against receipt only in reconcile |
| `runs/NN/result.json` | executeAssignment / settle* | 4 sites | `interpretRunResult` (no runId↔runDir cross-check, run-result.mjs:540-575), session-engine link | one per Run | JSON structure normalised; **runId not checked against directory** — a copied/planted result.json is adopted on resume (1841-1846) |
| `assignment.json` | executeAssignment (create) + `dispatchedRuns` append | executeAssignment, session-engine (`createSessionAssignment`), cli `--contract` | executeAssignment (immutable input), operation-choice 140-149, session-engine 4742 | assignment fields immutable; `dispatchedRuns` append-only | corrupt → fail hard (1380-1385); non-atomic RMW |
| `assignments/<id>/retry-N.claim`, `dispatch.claim` | session-engine | session-engine | session-engine | exclusive create | none; manual repair |

#### 4. Simplicity / architecture observations

Responsibility map of `assignment-runner.mjs` (line ranges):

| Range | Responsibility |
|---|---|
| 1-115 | header, imports, `resolveRunWorkerArtifactPath` |
| 116-390 | settlement classification helpers, executor read-only-redirect selection, report/evidence substantiveness |
| 389-630 | git snapshot / dirty-file / rollback helpers (evidence collection) |
| 631-790 | `classifyRunEvidence` (verdict ladder) |
| 791-937 | inline-mutating authorization + assignment legality validation (policy) |
| 938-1176 | `admitRunAttempt` (admission ledger + staging/rename) |
| 1177-1336 | `attemptProviderCapacityFallback` (fallback executor selection + lease) |
| 1337-1556 | `executeAssignment` prologue: config, assignment.json, `compileDispatchPlan`, governance gate, read-only redirect, tier/model resolution |
| 1556-1610 | admission call + resume rehydration |
| 1610-1840 | provider-capacity lease, fallback adoption, refusal settlement, effective-contract build |
| 1840-1876 | resume short-circuit (result.json / reconcile) — **F1** |
| 1877-1960 | dispatchedRuns bookkeeping, prompt render, git baseline, control acquire |
| 1960-2330 | cli-spawn supervised launch: baseline proof, command projection, confinement prep, supervisor spawn, receipt poll, receipt/failed settlement |
| 2330-2420 | legacy/non-supervisor adapter path (`executeExecutorCli`) |
| 2420-2748 | settlement: logs, exit.json, claim validation, evidence, provider-capacity fault, RunResult build, result.json, `markRunSettled`, `finally` release |
| 2749-3078 | `settleFailedRunFromOutcome`, `settleReceiptRunFromOutcome` (duplicated evidence pipeline) |
| 3079-3377 | `reconcileCliSpawnRun` (recovery read model for one adapter) |

- Six concerns co-habit: admission, policy/redirect, capacity fallback, launch orchestration for three adapters, evidence/settlement (three near-copies: 2420-2748, 2749-2844, 2845-3078), and reconciliation. The settlement pipeline is duplicated three times with drifting atomicity (F4).
- Second source of truth for "current Run": admission ledger (`admission/generations`) vs `runs/NN` directories vs session `run-retried` generations vs `assignment.json.dispatchedRuns`. `admitRunAttempt` reconciles the first two on every call (1003-1023); the session ledger is reconciled only by `expectedRunId` refusal (F7).
- Hidden coupling via fs layout: resume dispatch on `controller/commands/*.json` contract string (1847-1870); worker artifacts by three candidate dirs (27-49); `retryId` aborted markers path known to both store.mjs and this file.
- Dependency direction is clean (no state/verbs imports); `reconcileCliSpawnRun` living here forces `dispatch recover`/planner tests to prove import-graph exclusion (dispatch-reconciliation-import-graph.test.mjs:100) — a sign it wants its own module.
- Error UX: all refusals are one-line prose; the "no longer current" message does not say what happened to the worker's output (it is on disk, unsettled).

#### 5. Performance / token observations

- Config loaded once per `executeAssignment` (1342); `compileDispatchPlan` once (1422) plus once per fallback candidate (1231). Acceptable.
- Payload digest hashes `JSON.stringify({assignment, compiledPlan})` (1550-1553) and dispatchPlan digest twice more (1569, 2085) — three serialisations of the same plan per launch.
- `admitRunAttempt` re-lists `runs/` and every generation file on each decide iteration (1003-1023) and `isGenerationValid` re-reads every aborted generation's run.json twice (984-999 and 1041-1056, duplicated code).
- Receipt poll: 20 ms `existsSync`+`readFileSync` loop (F10).
- Prompt size: unbounded description/plan text (prepare.mjs:45); brief.mjs wraps it verbatim; no token budget is applied or recorded in run.json.

#### 6. Test gaps (prioritised)

1. **Resume with live worker → zero new spawn** (F1): run `executeAssignment` with same tuple while a supervisor/worker pid is alive; assert no second `controller/commands/*.json`, no second spawn.
2. **Control reclaim identity** (F2): dead-pid reclaim succeeds; reused-pid (same pid, different start time) reclaims; pid unreadable → held.
3. **Post-spawn `RunnerConfigError` leaves session claim in place** (F3).
4. **Torn result.json / run.json** (F4): truncate after settle, resume → expect refusal, not relaunch.
5. **Two unfenced concurrent `execute --assignment`** (F5): today produces two Runs; pin desired behaviour.
6. **Late result after supersession**: worker of epoch 1 writes outbox after epoch 2 settled; assert stored-but-not-linked (X03) — currently no test.
7. **Crash between control acquire and command projection**, and **between command projection and supervisor spawn**: resume must classify `command-missing` vs `launch-envelope-missing` correctly and only the former may relaunch.
8. **Cancellation** (claim 9): none possible until implemented; add a refusal test for `cancel` intent so docs match.

#### 7. Doc corrections

- contract doc lines 96-114: "Atomic admission and crash durability … and the per-Run controller lock are not implemented" → stale. Replace with: admission ledger + per-Run control lock implemented (`run-lock.mjs`, `admitRunAttempt`) **for callers passing `retryId`**; unfenced callers keep next-available-attempt; holder identity is `{id,pid}`; `phase`/`delivery` are static; cancellation, standalone supersession event and `revision` CAS remain unimplemented.
- recovery doc §9 S1 "Implemented — no two winners": qualify as "fenced callers only; unfenced CLI/operation-choice paths can admit two Runs"; §6 holder identity line 158 is a target, not shipped.
- recovery doc §10 F-b/F-f: mark F-b as proven for `reconcile*` read models only, not for `executeAssignment` resume (F1); F-f proven for herdr launch collision (herdr-reconciliation.test.mjs:675) and fenced admission (assignment-dispatch.test.mjs:2774), not for unfenced.
- contract doc §Effect protection: state that `dispatch-effect-guarantee.test.mjs` proves repeat-eligibility classification only.
- prepare.mjs header / any doc saying "bounded payloads": say "verbatim, unbounded; `prepareDispatch` unwired".
- Migration banner: `docs/platform/...runtime-recovery-design.md` and `docs/architect/...` differ only in banner; pick one owner.

### Phụ lục 5: Review 05 — Run evidence & result (liveness, visibility, worker artifacts, claim, ladder, attribution, RunResult v2, evaluator handoff)


Scope: `src/runner/dispatch/{liveness,visibility-session,worker-artifacts,agent-result-claim-contract,result-ladder,evidence-attribution,run-result}.mjs`, settle section of `assignment-runner.mjs`, consumer boundary in `src/runner/coordination/session-engine.mjs`. Read-only review; no tests executed.

#### 1. Doc claim status

| # | Claim (assignment-run-runresult.md) | Status | Evidence |
|---|---|---|---|
| 1 | RunResult only immutable terminal truth; `result.json` the one location | **implemented (partial)** | All four writers are in `assignment-runner.mjs` (1782, 2717, 2833, 3060). No other module writes it. But the write is a plain `fs.writeFileSync` (non-atomic) and the resume path (1841-1846) accepts any existing `result.json` without checking `runId` matches the run dir. |
| 2 | RunObservation is mutable read projection; cannot settle/retry/cancel | **implemented** | `runtime-inspection.mjs` has no write calls; `visibility-session.mjs` writes only `run.json`/visibility, never `result.json` (91-92, 334-343). |
| 3 | ProviderOutcome is a host wrapper, not Run truth | **implemented by absence** | No `ProviderOutcome` symbol exists in `src/`. The adapter return is consumed only inside `executeAssignment`; result-ladder's `buildDispatchResult` is a different, `execute`-CLI-only wrapper. Doc name has no code referent. |
| 4 | `agent-result.json` is `agent-result-claim.v2`, consumed by normalizer, never proof | **partial** | Contract + validator exist (`agent-result-claim-contract.mjs`). Missing `contract` field is accepted as legacy (60-63). BUT the normalizer synthesizes a claim when none exists and then records basis `valid-agent-result-claim` (see F2). |
| 5a | v2 classifies execution/assessment/confidence/failure/policy/delivery/provenance separately | **implemented** | `normalizeRunResultV2` 266-517; `run-result-v2.test.mjs`. |
| 5b | v1 interpreted as legacy-derived, not rewritten | **implemented** | `interpretRunResult` 590-712; test `run-result-v2.test.mjs:243`. |
| 5c | v2 with status/confidence disagreeing with classification is contract-corrupt, fails closed | **partial — only inside dispatch** | `validateRunResultV2` 244-254 + `interpretRunResult` 559-573 enforce it. The Run Result Evaluator (`session-engine.mjs` 275-284, 304-316) reads `result.json` with raw `JSON.parse` and gates only on compat `status`/`confidence`; it never calls `interpretRunResult`/`validateRunResultV2`. See F1. |
| 6 | Confidence boundaries | **partial** | verified-needs-evidence: `classifyRunEvidence` 725-729 requires post-run git delta (git diff alone suffices; no adapter attestation). reported-only-when-permitted: 715-722 requires read-only op + companion report. no-evidence never success: 731-736 + evaluator gates (1654, 1667, 3508). malformed/stale/cross-context cannot raise: malformed yes (652); stale/cross-context **not checked** at dispatch. process≠semantic: exit 0 + no claim + git delta → `done/inferred` (738-740) and the `execute` ladder's `[DONE]` token → `verifiedSha` → verify skipped (F3). |
| 7 | Attribution levels; only adapter/confinement positive coverage yields `proven` | **implemented in module, reserved-not-executed at call site** | `attributeWorkspaceChanges` can produce `proven` only with `adapterAttestation` ∧ `declaredCoverage` (107-109, 124-133). The one production call site passes neither (`assignment-runner.mjs` 2648, 3017) so `proven` is unreachable in practice; hashes are also not passed, so a pre-dirty file mutated during the run is classified `excluded` (81-88). `inherited` level does not exist anywhere in `src/runner/dispatch` (grep confirms). `evaluateAttributionPolicy` and `attributeClaimEvidenceRefs` have zero callers in `src/`. |
| 8 | Required Negative Tests (16) | see §4 | 9 covered, 5 partial, 2 missing |
| 9a | Unknown liveness is not dead | **implemented** | `liveness.mjs` 169 (`unknown` resets streak); `visibility-session.mjs` 229-231; tests dispatch-liveness 47, visibility 117/207. |
| 9b | Zero stdout never infers launch failure or completion | **implemented** | `normalizeRunResultV2` never reads stdout content; `buildDispatchResult` yields `unsignaled` on empty stdout, never a failure. |
| 9c | Herdr is visibility only, never Run truth | **implemented (soft edge)** | `visibility-session.mjs` writes `run.json`/visibility only. `reconcileRun` (283-330) fire-and-forgets a dynamic import of `reconcileCliSpawnRun`/`reconcileHerdrSpawnRun` which *can* write `result.json`; errors swallowed (`.catch(() => {})`). |

#### 2. Findings by severity

##### F1 — Evaluator bypasses v2 validation; contract-corrupt RunResult is accepted as truth
- **Severity:** High
- **Evidence:** `src/runner/coordination/session-engine.mjs:275-284` (`readLinkedRunResultFromDisk`) and `304-316` (`findLatestRunResult`) do `JSON.parse(fs.readFileSync(...))`; gates at 1654, 1667, 3508-3515, 4337 read only `runResult.status` / `runResult.confidence`. `grep classification|contractCorrupt|validateRunResultV2 session-engine.mjs` → no hits. Doc claim 5c says corrupt v2 "fails closed".
- **Actual problem:** The fail-closed rule lives only in `interpretRunResult`, which is called by dispatch's own resume/reconcile/inspect paths (`assignment-runner.mjs:1844, 2753, 2849, 3091`; `runtime-inspection.mjs:48`; `operation-choice.mjs:158`; `herdr-round.mjs:1890`) — never by the consumer that decides quorum/acceptance.
- **Failure scenario:** A `result.json` whose `classification.execution.status` is `failed` but whose compat `status: 'done'`, `confidence: 'verified'` (post-settle edit, partial write recovered by hand, or a future writer bug) is counted `accepted` at 3510-3511 and satisfies `classifyOperationAssignment`. `fgos ... inspect` on the same file would say `contract-corrupt`. Two readers, two answers.
- **Boundary:** Dispatch → RunResult → Evaluator handoff. Invariant "compat fields must match projection" is validated by producer only.
- **Why tests miss it:** `run-result-v2.test.mjs:201` tests `validateRunResultV2` in isolation; `dispatch-operability-production-door.test.mjs:221` tests `inspect`. No test feeds a corrupt v2 file into `classifySessionQuorum`/`synthesizeResearchFanIn`.
- **Smallest safe fix:** In `readLinkedRunResultFromDisk` and `findLatestRunResult`, replace `JSON.parse(raw)` with `interpretRunResult(JSON.parse(raw))` and treat `contractCorrupt === true` as `failed` (it already projects `status:'no-evidence'`, `confidence:'failed'`, so the existing gates fail closed automatically). One import, two lines.
- **Priority:** P1.

##### F2 — Normalizer fabricates a worker claim and records `valid-agent-result-claim` basis when no claim exists
- **Severity:** Medium (contract integrity; evidence basis lies)
- **Evidence:** `assignment-runner.mjs:2689-2694` passes `agentClaim: agentClaim ?? { status, summary: 'Settled' }` (also 2820, 3045). `run-result.mjs:381-383`: `if (agentClaim && !claimInvalid) basis.push('valid-agent-result-claim')`. `run-result.mjs:485-490` has its own identical fallback.
- **Actual problem:** For an `inferred` run (exit 0, no claim, git delta) `result.json` says `agentClaim.status: 'done'` and `confidence.basis: ['valid-agent-result-claim','captured-stdout','workspace-git-diff']`. The worker never wrote anything. Doc claim 4 ("worker claim consumed by normalizer, never independent proof") is inverted: the normalizer *manufactures* the claim. A downstream reader cannot distinguish "worker said done" from "runner said done on the worker's behalf".
- **Failure scenario:** Any future consumer that checks `agentClaim.status === 'done'` or `basis.includes('valid-agent-result-claim')` as "the worker attested" is fooled. Also `assessment.verdict` for a non-assessment role goes to `pass` via the synthesized `done` (run-result.mjs 352-353) rather than via the `confidenceLevel` path — same answer today, different reason.
- **Why tests miss it:** `assignment-runresult.test.mjs:238` asserts `status`/`confidence` only; no test asserts `agentClaim` is `null`/absent or that `basis` excludes `valid-agent-result-claim` when no file existed.
- **Smallest safe fix:** Pass `agentClaim: null` from the runner; in `normalizeRunResultV2` keep the synthesized summary under a distinct key (e.g. `agentClaim: null, runnerNote: {...}`) or set `basis` from a `claimPresent` flag. Keep compat `status`/`confidence` unchanged.
- **Priority:** P2.

##### F3 — `execute` ladder turns a stdout `[DONE]` token into `verifiedSha`, which skips `fgos return`'s verify, regardless of exit status
- **Severity:** Medium-High (false success path outside RunResult)
- **Evidence:** `result-ladder.mjs:58` `...(isDone && headAfter ? { verifiedSha: headAfter } : {})` — no check of `result.status`/exit code. `cli.mjs:1086` calls it unconditionally; `cli.mjs:1338-1340` forwards `--worker-verified-sha`; `bin/fgos.mjs:3597-3608` sets `check.passed = true, skipped = true` when the sha equals branch head.
- **Actual problem:** Process/token success substitutes for semantic success (doc §Confidence, last bullet). A worker that prints `[DONE]`, commits, then exits non-zero (or times out after printing it) still gets verify skipped on return. Backtick stripping (tsk-5gd) guards prose mentions, not a worker that emits the literal token and fails.
- **Boundary:** result-ladder (dispatch `execute`) → `fgos return`. This ladder is *not* the RunResult path, so RunResult-level fail-closed logic never sees it.
- **Why tests miss it:** Negative test "timeout/non-zero exit with misleading success text" has no coverage for the `execute` ladder; `dispatch.test.mjs` only has the "misleading merge" plan test (6400).
- **Smallest safe fix:** In `buildDispatchResult`, gate `verifiedSha` on `!(typeof result.status === 'number' && result.status !== 0) && result.status !== 'timeout' && result.status !== 'failed'`. One condition.
- **Priority:** P1.

##### F4 — `result.json` written non-atomically; a torn write is indistinguishable from "never settled" and triggers re-dispatch
- **Severity:** Medium
- **Evidence:** `assignment-runner.mjs:2717, 2833, 3060, 1782` use `fs.writeFileSync` directly. `visibility-session.mjs:88-93` already has `writeJsonAtomic` (tmp + rename) for `run.json`. Resume path 1841-1846: `interpretRunResult(path)` throws on truncated JSON → swallowed → falls through to reconcile → a fresh attempt is dispatched in the same run dir.
- **Actual problem:** Crash between `open` and `close` of the result write leaves a partial file. The negative test "RunResult persistence failure not reported as success" is about the *throw* path (which does propagate — correct), but the torn-file path silently converts a settled run into a re-run.
- **Why tests miss it:** No test writes a truncated `result.json` and re-enters `executeAssignment` with `resumed: true`.
- **Smallest safe fix:** Use the same tmp+rename helper for `result.json` (import `writeJsonAtomic` or hoist it to a shared util). Additionally, in the resume path, treat "result.json exists but unparsable" as `parked/corrupt` rather than falling through to dispatch.
- **Priority:** P2.

##### F5 — Evaluator's settle-report cross-pass hardcodes flat `agent-report.md`; herdr-spawn outbox reports can never validate
- **Severity:** Medium (handoff contract mismatch)
- **Evidence:** `worker-artifacts.mjs` documents two names (`outbox/report-N.md` for herdr-spawn). Runner records `settleReports[].path` relative to root (`assignment-runner.mjs:2517-2527`). `session-engine.mjs:4088-4090` derives `runs/<NN>/agent-report.md` and hashes that; `sha256OfFile` returns `undefined` on ENOENT (4046-4052) → `currentRevision` undefined → stale → `no-consensus`.
- **Actual problem:** Two readers of one artifact disagree on where it is — exactly the drift `worker-artifacts.mjs` was written to end, reintroduced on the evaluator side.
- **Why tests miss it:** Aggregation tests use cli-spawn runs with flat reports.
- **Smallest safe fix:** Export `resolveWorkerArtifactPath` use from `worker-artifacts.mjs` in the evaluator (derive dir from validated ids as now, then resolve inside it), not the literal filename.
- **Priority:** P2. (Owner is evaluator group; reported here because it is the handoff.)

##### F6 — Attribution records are decorative: `proven` unreachable, hashes never supplied, policy evaluator unused
- **Severity:** Low-Medium (doc overstates; no runtime harm because nothing reads `attribution`)
- **Evidence:** `assignment-runner.mjs:2648, 3017` call with only `preLaunchDirt`/`postRunDirt`. `evaluateAttributionPolicy`, `attributeClaimEvidenceRefs` have no callers in `src/`. `grep -rn attribution src/runner/coordination` → none. Attribution also only sees `git status` dirt: a worker that **commits** leaves a clean tree, so `changedFiles` (via `git diff before..after`) is non-empty while `attribution` is `[]`.
- **Impact:** `evidence.attribution` in `result.json` is misleading for committed work (empty) and cannot express `proven`. Doc §Evidence Freshness correctly says "Planned", but the Addendum reads as shipped.
- **Smallest safe fix:** Either feed `dirtyBeforeSnapshots` hashes + confinement attestation (`attestation-store.mjs`) into the call, or mark the field `attributionVersion: 'correlation-only'` and say so in the doc.
- **Priority:** P3.

##### F7 — `cwd` vs `effectiveCwd` mismatch in changed-file computation
- **Severity:** Low (latent)
- **Evidence:** `assignment-runner.mjs:1915, 1926, 2418-2419` snapshot `dirtyBefore/gitBefore/gitAfter/dirtyAfter` from `effectiveCwd`; `2546` runs `computeChangedFiles(cwd, …)` and `2549-2552` reads `path.join(cwd, relPath)` for mutation hashes. `effectiveCwd` can differ from `cwd` (1524, 1616, 1731 — compiled plan / fallback plan).
- **Impact:** When a fallback plan redirects cwd, committed-diff evidence and dirty-before hash checks run against the wrong directory. `git diff a..b` still resolves if both are worktrees of one repo; relative paths do not.
- **Fix:** Use `effectiveCwd` at 2546 and 2549. Two tokens.
- **Priority:** P3.

##### F8 — Resume path accepts any `result.json` in the run dir without `runId` binding
- **Severity:** Low (same trust class; doc claims cross-context evidence cannot raise confidence)
- **Evidence:** `assignment-runner.mjs:1841-1846`; `interpretRunResult` never compares `runId` to the directory. Evaluator side does bind (`assertValidRunIdForAssignment` 273).
- **Fix:** After interpret, refuse if `settledResult.runId !== runId`.
- **Priority:** P3.

##### F9 — Doc deviation: superseded controller's late result is *refused*, not "stored and validated"
- **Severity:** Doc/contract
- **Evidence:** `assignment-runner.mjs:2410-2414, 2712-2716` throw `RunnerConfigError` before writing anything; test `assignment-dispatch.test.mjs:3018`. Negative test #16 says "stored and validated, never accepted as authoritative".
- **Impact:** A superseded worker's real work product is dropped from the record. Refusing is the safer of the two; the doc should say what the code does, or the code should write `result.superseded.json`.
- **Priority:** P3 (decide, then align).

#### 3. Contract audit

| Contract | Owner / producer | Consumer(s) | Invariants validated? | Gap |
|---|---|---|---|---|
| RunResult v2 (`result.json`) | `normalizeRunResultV2` via `executeAssignment`/`settle*FromOutcome` | session-engine (quorum, fan-in, recheck), `run.mjs` summary, inspect, operation-choice, reconcile | Producer: yes (`validateRunResultV2` at read via `interpretRunResult`). Evaluator: **no** (F1). Schema version: unknown/mismatched `contract` → corrupt (562-573) ✓. | F1, F4, F8 |
| RunObservation (`runtime-inspection.mjs`) | inspect CLI | humans/agents | Read-only ✓ | none |
| agent-result-claim v2 | worker | `executeAssignment` (validate → classify) | Validated ✓; legacy (no `contract`) accepted; `evidenceRefs` untrusted ✓ | F2 (synthesized claim) |
| Evidence record (`evidence.json`, `RunResult.evidence`) | runner | nothing in `src/` reads `attribution`; `changedFiles` read by classifier only | `attribution` never validated | F6, F7 |
| settleReports / claimSha256 | runner | evaluator `aggregationSourceFrom` | Hash re-check ✓ | F5 (path derivation) |
| `execute` ladder result (`buildDispatchResult`) | `cli.mjs` | `fgos return`, `report/dispatch-confidence.mjs` | none; `verifiedSha` unconditioned | F3 |
| Separation runtime receipt vs confidence | — | — | Dispatch computes `confidence` (`classifyRunEvidence`) and feeds it as `confidenceLevel`; normalizer has a second fallback ladder (391-397). Confidence is a *mechanical* derivation (exit, claim, git delta, report presence), not a semantic judgment — acceptable as a compat field but it is still dispatch deciding "verified". | D-observation below |

#### 4. Required-negative-test coverage

| # | Negative test | Coverage |
|---|---|---|
| 1 | missing / malformed worker result | **covered** — `assignment-runresult.test.mjs:238, 498, 541, 472` |
| 2 | exit zero with absent expected output | **covered** — `:238, 917` |
| 3 | stale result artifact | **MISSING** — no mtime/launch-time check in runner (`findWorkerClaim` accepts any existing file); no test |
| 4 | evidence belonging to another Assignment/Run | **partial** — evaluator binds `runId`→dir (`assertValidRunIdForAssignment`); dispatch resume does not (F8). Tests found ("another Assignment") are contextRefs foreign-ref tests, not evidence. No dispatch-level test |
| 5 | dirty-before file claimed as new output | **covered** — `:583, 621, 669, 850`; `evidence-attribution.test.mjs:16` |
| 6 | mutating claim with no post-run delta | **covered** — `:827, 917` |
| 7 | dispatch rejection before launch | **covered** — `assignment-dispatch.test.mjs:1198`; `dispatch-operability-production-door.test.mjs:256` |
| 8 | timeout / non-zero exit with misleading success text | **partial** — exit≠0 and timeout without claim (`:19` cases 1-2; operability 129). No test of exit≠0 **plus** `status:'done'` claim or `[DONE]` token (F3) |
| 9 | retry preserving prior Run and evidence | **partial** — `:385` (monotonic attempt). No assertion that attempt N's `result.json`/`evidence.json` are byte-identical after attempt N+1 |
| 10 | RunResult persistence failure not reported as success | **MISSING** — write throw propagates (correct by construction) but untested; torn write path re-dispatches (F4) |
| 11 | crash after admitted before launched | **covered** — `cli-spawn-reconciliation.test.mjs:258`; `herdr-reconciliation.test.mjs:543` |
| 12 | crash after launched before bound | **covered** — `cli-spawn-reconciliation:710, 783`; `dispatch-visibility-session.test.mjs:270`; `herdr-reconciliation:543` |
| 13 | delivery unknown never launch failure | **covered** — `herdr-reconciliation:576`; `dispatch-visibility-session:117, 207` |
| 14 | second controller on un-settled Run refused | **covered** — `assignment-dispatch:3018`; `cli-spawn-reconciliation:663`; `herdr-reconciliation:711` |
| 15 | coordinator restart does not reset attempt | **partial** — `:385` covers gap allocation; `herdr-reconciliation:496` covers gateway restart; no explicit restart-then-resume attempt-continuity test |
| 16 | superseded Run's late result stored & validated, never authoritative | **partial / deviates** — refused, not stored (F9). `dispatch-reconciliation.test.mjs:273`, `assignment-dispatch:3018` |

#### 5. Simplicity / architecture observations

- **Three ladders, not one.** (a) `classifyRunEvidence` (assignment-runner 631-744) produces compat `status/confidence`; (b) `normalizeRunResultV2` (run-result 391-397) re-derives confidence when `confidenceLevel` is null and re-derives assessment from the claim; (c) `buildDispatchResult` (result-ladder) is the `execute`-CLI token ladder, reused by `report/dispatch-confidence.mjs`. `liveness.mjs` is a fourth, but it is a *round-over* ladder, correctly distinct. (a) and (b) can disagree only if a caller omits `confidenceLevel`; today every production caller passes it, so (b)'s fallback is dead-in-practice but live-in-tests.
- **Runner passes `status` and `confidence` into `normalizeRunResultV2` (2670-2671), which does not destructure them.** Harmless, misleading.
- **Two identical claim-fallback objects** (runner 2689-2694 and run-result 485-490).
- **Dependency direction is correct:** session-engine imports dispatch (76-80); no dispatch module imports coordination. Dispatch → RunResult → Evaluator holds.
- **Dispatch does compute `confidence`.** It is a mechanical projection (exit / valid claim / post-run git delta / report presence), stored as a compat field, and the evaluator treats `verified` as accept, `reported|inferred` as unverified (3510-3515). That is a defensible split — "verified" here means "runtime-verifiable delta exists", not "semantically correct" — but the word invites the reading the doc forbids. Recommend renaming in v3 or documenting `confidence` as a runtime receipt grade.
- **Herdr visibility boundary is honest but leaky by delegation:** `reconcileRun` triggers `result.json`-writing reconcilers via dynamic import with swallowed errors. Fine for a courtesy stamp; should not be relied on for settlement.
- **Worker artifacts:** `resolveWorkerArtifactPath` anchors names by regex (`^result-(\d+)\.json$`) so no traversal; symlinks are followed (`existsSync`/`readFileSync`), so a link inside `outbox/` could point at another run's claim — same trust class as the runner, so documented non-issue, but `claimSha256` binds bytes, not identity.
- **Legacy v1 dual path** is contained in `interpretRunResult` and never rewrites; acceptable. `contract` missing on a *claim* is also accepted as legacy; the doc should state a sunset.

#### 6. Performance / token observations

- Stdout/stderr are bounded by `maxBuffer` (10 MiB default, `cli.mjs:341, 918`; supervisor 419, 738-784) and RunResult stores only relative log paths (`runtime.stdoutLog`), never content. Good.
- Normalization re-reads worker files once each; `snapshotDirtyBeforeFiles` reads every pre-dirty file fully into memory twice (before and after, 598-614 and 2549-2560) — bounded by the user's dirty set, fine.
- `computeChangedFiles` shells `git diff --name-only` once. `safeGitStatusFiles` twice. No repeated log scanning. The `execute` ladder scans stdout twice (`includes` ×3 on a regex-stripped copy) — negligible.
- No trimming of `stderrText` into `agentClaim.summary` etc. — summaries come from the claim, not logs.

#### 7. Test gaps, prioritized

1. Evaluator fed a contract-corrupt v2 `result.json` (status `done` / classification `failed`) must classify `failed` (F1).
2. `buildDispatchResult` with `[DONE]` + `status: 1` / `'timeout'` must not emit `verifiedSha` (F3).
3. `executeAssignment` with no claim: assert `agentClaim` absent/null and `confidence.basis` lacks `valid-agent-result-claim` (F2).
4. Truncated `result.json` + `resumed: true` must not dispatch a fresh attempt (F4).
5. Herdr-spawn run with `outbox/report-1.md` passes `aggregationSourceFrom` revision check (F5).
6. Stale artifact: claim file with mtime < `launchedAt` is not counted (needs the check first).
7. Retry: attempt N files unchanged after attempt N+1 settles.
8. `effectiveCwd ≠ cwd` fallback plan still records committed diff (F7).

#### 8. Doc corrections

- §Addendum "contract-corrupt … fails closed": add "when read through `interpretRunResult`; the coordination evaluator reads compat fields only" — or fix F1 and keep the sentence.
- §Addendum `ProviderOutcome`: no such type exists; either name the adapter return of `executeExecutorCli`/`buildDispatchResult` or drop the bullet.
- §Evidence Freshness: `proven` is unreachable at the production call site; `inherited` is not implemented (X05 deferred is accurate; say so here, not only in the plan).
- §Required Negative Tests #16: code refuses a superseded controller's settlement outright; doc says "stored and validated". Pick one.
- §Confidence: state that `confidence` in `result.json` is a runtime-receipt grade computed by dispatch (`classifyRunEvidence`), and that semantic acceptance is the evaluator's (`verified`→accepted, others→unverified).
- Addendum's claim that `agent-result.json` is "never independent proof" should also say the normalizer must not synthesize one (F2).

### Phụ lục 6: 06 — Invocation mechanisms / adapters, CLI spawn supervisor, transport, Herdr agent/round


Scope: `src/runner/dispatch/{transport,cli,cli-spawn-supervisor,herdr-agent,herdr-round,mechanism}.mjs`, plus the confinement seam that feeds them. Read-only; one empirical probe (`scratchpad/sup-probe.mjs`, no repo writes).

#### 1. Claim status

| # | Claim (doc) | Status | Evidence |
|---|---|---|---|
| 1 | Invokes only through compiled mechanism + declared adapter; MCP handback in-process; MCP-only executor never spawned | **implemented** (with a gap) | Every executor spawn goes `buildConfinementRequest → executeThroughConfinement → adapterFn` (cli.mjs:398-441, 762-796, 986-1030; authority.mjs:842, 979). Gate B3 throws for an executor with no `via:"cli"` invocation (resolve.mjs:417-425). `mcpTool` only ever surfaces from `decide` (cli.mjs:1234-1235, plan.mjs:186-195). Gap: the in-process handback opens no Run (cli.mjs:751, `os.tmpdir()/fgos-in-process/...`, no `run.json`), returns `{mechanism, agentType, prompt, attestation}` (cli.mjs:823-830) and never receives a result — see finding m6. |
| 2a | "CLI spawn is an execution mechanism, not a governance bypass" | **implemented** | Both `spawnWorker` and `executeExecutorCli` build a confinement request before any spawn; the direct-spawn path in transport.mjs:469 is reached only as the adapter function. |
| 2b | "Herdr participates in invocation and visibility only; never settles Run truth or replaces retained artifacts" | **partial** | Herdr never writes `result.json` (only assignment-runner.mjs:1782/2717/2833/3060 do). But herdr-round writes `controller/commands/<id>.json` with `state:'reconciled'` and `outcome.kind:'receipt-backed'` directly via `publishMutableProjection`, bypassing `commitCommandOutcome`'s controlEpoch/controlToken guard (herdr-round.mjs:1503-1515, 1571-1580, 1695-1712, 2113-2118 vs cli-spawn-supervisor.mjs:992-1021). Finding M3. |
| 3 | Execution capability set declared per executor; missing capability refused by name; mode-specific reachability declared | **partial** | Declared today: `permissionMode`, `confinement`, `promptDelivery`, `interactiveMode` (transport.mjs:210-222), adapter `receiptContract`/`locus` metadata (transport.mjs:883-912). Not declared anywhere in these files: observability/contactability, or per-mode reachability. Herdr-only knobs travel by env (`FGOS_HERDR_ANCHOR_PANE`, `FGOS_HERDR_BIN`, transport.mjs:768, 800). |
| 4a | Delivery tri-state not-sent / sent / unknown; unacked send is `unknown`, never launch-failed | **proposed** (not in code) | No such field exists. herdr-round records `status: briefed/working` in visibility only (herdr-round.mjs:686, 757). A prompt submission that times out with no result file throws `worker-spawn-fail` (`deliverBrief`, herdr-round.mjs:700-713) — i.e. unacked send **is** reported as launch failure. |
| 4b | X02: Herdr resends only while adapter reports ready and no ack; never after ack/working | **implemented** | herdr-round.mjs:814-826 (`!ackSeen && isReadyState(agentState)`, cap `MAX_RESENDS=2`, herdr-round.mjs:346). Ack is the worker-written `outbox/ack-1.json` only (herdr-round.mjs:757-762); a worker that finishes without writing the ack gets the brief up to 3 times (m5). |
| 5 | S2: deterministic agent name from runId; duplicate-name refusal; no resurrection after close; launched-before-bound reconciles, never allocates another attempt | **partial** | Name `fgos-<runId>-<launchCommandId>` (herdr-round.mjs:1054-1055, normalized to 32 chars herdr-agent.mjs:49-60 — middle-trim can collide on long ids). Collision check on `controller/commands` (herdr-round.mjs:1020-1040, 1804-1820). `resourceClosed → parked` (herdr-round.mjs:1883-1885). Confined path persists `paneId` **before** `pane run` (herdr-round.mjs:1325-1330). Unconfined path persists `paneId` only **after** `agent start` (herdr-round.mjs:1497-1515) — a crash in between leaves an unbound live pane; next attempt splits a new pane and herdr's own name refusal is the only guard. |
| 6a | Zero stdout never infers launch failure or completion | **implemented** | cli-spawn outcome is the receipt's `completion.kind`/`exitCode` only (transport.mjs:384-416); herdr outcome is the result file only (herdr-round.mjs:786-795). |
| 6b | Quota line: park same Run, preserve line, no timed relaunch | **partial** | Ladder outcome `paused-limit` keeps the pane (`paneFateFor`, herdr-round.mjs:882), but the adapter collapses it to `errorClass:'worker-timeout'` (herdr-round.mjs:322-328, acknowledged seam) so the recovery matrix cannot tell quota from timeout. Relaunch decision is owned by the runner. |
| 7 | Interactive/headless parity — identical capability both modes | **partial** | cli-spawn only: `maxBuffer`, stdout/stderr capture + digests, supervisor bindings, idle timer on output. herdr only: batch tab, anchor pane, trust seeding, tamper checks, `usageLimitPatterns`, screen read. Neither exposes the other's surface; `dispatchBatchKey` is threaded but ignored by cli-spawn. |

#### 2. Spawn / gateway call-site inventory

| Site | Mechanism | Gated by DispatchPlan + confinement prepare? | Notes |
|---|---|---|---|
| transport.mjs:125 `execFileSync('git', …)` | attestation read | n/a (metadata) | Runs on every `resolveExecutorCommand`, fail-safe. |
| transport.mjs:343 `startSupervisorProcess(...)` → cli-spawn-supervisor.mjs:841 `spawn(node, [supervisor, envelope])` | **supervised cli-spawn** | Yes — adapter fn from `executeThroughConfinement`; envelope exists only when `request.assignmentLaunchContext` (authority.mjs:846-848, 950-951) | Detached, IPC + stdout tee (double-delivered, args swapped — M1). Caller has no own timer; waits for receipt file (50 ms poll, transport.mjs:427) or supervisor `close`. |
| cli-spawn-supervisor.mjs:596 `spawn(command, args, {env: envelope.invocation.env})` | worker (inside supervisor) | Yes (via envelope) | `env` is the full serialized `process.env` + resolved executor env (authority.mjs:1351-1355). |
| transport.mjs:469 `spawn(command, args)` | **direct cli-spawn** (no envelope) | Yes for confinement; **no** receipt/binding/capture | Live for `spawnWorker` (loop.mjs:1005, 1410) and plain `execute <id> --prompt` (cli.mjs:1780). Prompt substituted into argv (transport.mjs:167). |
| transport.mjs:687 `fetch(url)` | http adapter | Yes | Reachable only via `executor.adapter:'http'`; a `via:'api'` invocation is validated (config.mjs:692) but Gate B3 refuses it for dispatch. |
| herdr-agent.mjs:64 `execFileSync(herdrBin, args)` | **every herdr gateway call** (pane split/list/close/process-info/run/report-agent, workspace create, tab create/get/close, agent start/prompt/wait/get/read) | Yes — only via `runHerdrRound` from `herdrSpawnAdapter` | Synchronous; blocks the event loop up to `timeoutMs+15000` (agentStart 45 s, herdr-agent.mjs:307-313). Env values passed as `--env K=V` argv (herdr-agent.mjs:154-156). |
| worker-session-boot.mjs:97 `spawn(herdrBin, ['--session', name, 'server'])` | isolated herdr server | Yes — from `establishConfinement` (herdr-round.mjs:539-545) | Detached, `unref`; outlives dispatch by design. |
| cli.mjs:549 `execFileSync('git rev-parse HEAD')` | head capture | n/a | |
| cli.mjs:1303/1305 `execFileSync(fgos pick/return)` | fgos verbs (fanout) | n/a (not executor spawns) | Sync calls inside `Promise.allSettled` (cli.mjs:1288-1350) serialize the batch. |
| No `/v1/`, `herdr-plugin`, or HTTP gateway calls in any of the six files. | | | The Rust gateway is unreachable from the adapters; herdr is reached only through the CLI binary. |

Exported direct-spawn helpers: the barrel (`src/runner/dispatch.mjs:59-72`) re-exports `spawnWorker`, `executeExecutorCli`, `resolveExecutorCommand`, `executeThroughConfinement`; `cliSpawnAdapter`/`herdrSpawnAdapter`/`EXECUTOR_ADAPTERS` are exported from transport.mjs only. Outside `src/runner/dispatch/` the only executor-spawning caller is loop.mjs (`spawnWorker`, confinement-gated). No skill/plugin/bin file calls herdr or an adapter directly (only prose mention at `plugins/fgOS/skills/fgos-code-panel/SKILL.md:563`).

#### 3. Findings by severity

##### C1 — Herdr reconcile result for a live or receipt-settled worker is not consumable by the resume path (cross-confirms runner reviewer's Critical)
- **Severity:** Critical (shared with runner reviewer).
- **Evidence:** `reconcileHerdrSpawnRun` returns `{status:'waiting', state:'worker-running'}` for a live, incarnation-matched worker (herdr-round.mjs:2170-2176) and `{status:'settled', settled:true, receipt, outcome}` **without `runResult`** when settlement comes from receipt/outbox (herdr-round.mjs:2036-2040, 2120-2125). assignment-runner.mjs:1874-1877 short-circuits only on `rec.settled && rec.runResult`; everything else falls through to a fresh dispatch. Inside the adapter, `runHerdrRound` returns the raw reconcile object as the adapter result when the on-disk command is `reconciled` or `pending+paneId` (herdr-round.mjs:1044-1051) — a shape with string `status` and no `stdout`, unlike the normal `{status:0, stdout,…}` (herdr-round.mjs:1720-1730).
- **Failure scenario:** coordinator restarts while a herdr worker is mid-turn → resume → `waiting` → fresh attempt (or a settlement written from a non-result shape). Contradicts F-b/F-c.
- **Boundary:** adapter (return shape) + runner (consumption).
- **Why tests miss:** herdr-reconciliation.test.mjs asserts `rec.status === 'waiting'` from the function (lines 385, 668, 1199) but never drives `executeAssignment` resume over it.
- **Smallest fix:** return `runResult` (or an explicit `{settled:false, observed:true}`) contract from `reconcileHerdrSpawnRun`, and make assignment-runner treat `waiting`/`running` as "observe, do not launch". Priority P0.

##### M1 — Supervised cli-spawn live tee delivers every chunk twice with swapped arguments
- **Severity:** Major (observability of every Assignment-owned cli-spawn run).
- **Evidence:** `startSupervisorProcess` calls `onChunk(Buffer, stream)` from three subscriptions — IPC `message` (cli-spawn-supervisor.mjs:849-853), `proc.stdout` (856-858), `proc.stderr` (861-863) — while the supervisor's `deliverLiveChunk` sends each chunk over **both** IPC and its own stdout/stderr (cli-spawn-supervisor.mjs:434-451). Every production consumer expects `(stream, chunk)`: cli.mjs:1563, 1735, 1777 (`process.stderr.write(chunk)`), loop.mjs:1017 (`appendWorkerLogChunk(dir, id, chunk)`), transport.mjs:275-281 (`teeChunk`). Probe (`scratchpad/sup-probe.mjs`): 2 worker chunks → 4 `onChunk` calls, each `(Buffer, 'stdout'|'stderr')`.
- **Actual problem:** for `execute --assignment` / `--contract` the operator's stderr shows the literal words `stdoutstdout…`, never worker output; a log consumer appends `'stdout'`.
- **Boundary:** cli-spawn-supervisor.mjs (adapter internals).
- **Why tests miss:** cli-spawn-reconciliation.test.mjs:76-79 accepts either argument order; supervisor tests pass `onChunk` to `runSupervisor` directly, not through `startSupervisorProcess`.
- **Smallest fix:** in `startSupervisorProcess` call `onChunk(stream, chunk)` and subscribe to IPC only (drop the stdout/stderr pipe subscriptions, or stop `deliverLiveChunk` writing to its own stdio). Priority P1.

##### M2 — Resolved provider credentials persisted to immutable run artifacts and process argv
- **Severity:** Major (secret retention; classes only, no values inspected).
- **Evidence:** `workerEnv = {...process.env, ...resolveExecutorEnv(executor.env)}` (authority.mjs:1351-1355) is written whole into `protected/launch-envelope/<id>.json` and the compat `protected/launch-envelope.json` via `publishImmutableProof` (authority.mjs:1610, 1641-1646); nothing deletes it. `.fgos/config.json` executor env declares `ANTHROPIC_AUTH_TOKEN: ${…}` placeholders that `resolveExecutorEnv` (transport.mjs:136-145) expands to the literal token. The same resolved env is passed as `paneSplit --env K=V` argv (transport.mjs:817 → herdr-round.mjs:1135 → herdr-agent.mjs:154-156), visible to any process listing, and exported in the confined launcher script (herdr-round.mjs:66-80; deleted on settle herdr-round.mjs:934-937, kept on failure by design). No log line prints values; the dispatch stderr lines print only executor/provider/model (cli.mjs:335, 986).
- **Failure scenario:** any failed or timed-out Assignment run leaves live provider tokens on disk indefinitely under `.fgos/assignments/**/protected/` (gitignored, .gitignore:24, but world-readable to the user's other tools/backups).
- **Boundary:** confinement authority (envelope) + herdr adapter (argv/script).
- **Why tests miss:** no test asserts envelope/launcher env content is redacted or removed.
- **Smallest fix:** store `envDigest` (already computed, authority.mjs:1358) plus an allow-listed env subset in the envelope; have the supervisor receive secrets through a 0600 side file removed after spawn; pass non-secret pane env only. Priority P1.

##### M3 — Herdr adapter settles command state without the control-token door
- **Severity:** Major (boundary/contract).
- **Evidence:** herdr-round.mjs:1325-1330, 1503-1515, 1571-1580, 1695-1712 and 2113-2118 write `controller/commands/<launchCommandId>.json` with `publishMutableProjection`, including `state:'reconciled'` and a receipt-backed outcome. The cli-spawn path only lets authority commit that through `commitCommandOutcome`, which checks `controlEpoch`/`controlTokenDigest` (cli-spawn-supervisor.mjs:992-1010; authority.mjs:978-994). A superseded controller's herdr round therefore overwrites a fresher controller's command record.
- **Boundary:** adapter writing runner-owned projection.
- **Why tests miss:** no test drives a herdr round under a stale token.
- **Smallest fix:** route those writes through `commitCommandOutcome`/`updateCommandEnvelope` (or a herdr-shaped equivalent) that verifies the token, and have authority perform the final commit as it does for cli-spawn. Priority P1.

##### M4 — cli-spawn has two live modes with different recovery guarantees
- **Severity:** Major (contract clarity; doc overstates).
- **Evidence:** envelope/supervisor/receipt/binding path only when `request.assignmentLaunchContext` (authority.mjs:846). `spawnWorker` (loop.mjs:1005) and plain `execute <id> --prompt` take transport.mjs:469: in-memory stdout, no receipt, no binding, worker orphaned silently if the parent dies, caller's own SIGTERM-only kill (transport.mjs:318-329, no SIGKILL escalation). Supervised mode: SIGTERM pgid then receipt says `timeout` with `stoppedProof:'not-claimed'` (cli-spawn-supervisor.mjs:702-722) — honest, but a worker ignoring SIGTERM outlives a receipt that already closed the run.
- **Boundary:** adapter.
- **Smallest fix:** document the two modes explicitly (doc §8), or make `openDispatchRun` mint a launch context so `spawnWorker` also gets the supervised path. Priority P2.

##### m1 — `dispatch.mjs reconcile` subcommand crashes on missing argument
- Minor. cli.mjs:1870 references `positional`, which is not defined in `runDispatchCli` → `ReferenceError` instead of the usage message; the default usage string (cli.mjs:1889) omits `fanout-batch` and `reconcile`. Not covered (test/cli/dispatch-reconcile.test.mjs tests the `fgos dispatch reconcile` verb, not this subcommand). Fix: `?? undefined` and add to usage.

##### m2 — Two `reconcileCliSpawnRun` functions, three status vocabularies
- Minor (simplicity). cli-spawn-supervisor.mjs:1035 (object arg; `running/parked/reconciled/refused/observed-stale/not-requested/unknown`) vs assignment-runner.mjs:3079 (positional `(runDir, opts)`; `settled/parked/observed/held/stale/…`), the latter re-exported by cli.mjs:41-42 under the same name. `reconcileHerdrSpawnRun` uses `settled/waiting/parked/observed/failed/refused`. visibility-session.mjs:304-308 calls both with `(dir)` only. Fix: one reconcile result contract shared by both adapters.

##### m3 — Supervisor arms the hard timeout twice
- Minor. cli-spawn-supervisor.mjs:568-590 arms `timeoutTimer` before spawn and 700-722 re-arms it after binding, overwriting the handle; the first is never cleared (harmless only because `captureFrozen` and `process.exit(0)` at 1277). `process.exit` right after resolve can drop the last IPC chunk messages (best-effort tee).

##### m4 — cli-spawn liveness judged by supervisor pid only
- Minor/Major-adjacent (overlaps runner reviewer's relaunch finding). `reconcileCliSpawnRun` returns `parked: worker-state-unknown` when the supervisor pid is dead and no receipt exists (cli-spawn-supervisor.mjs:1177-1183) although the worker is a detached pgid leader that can outlive its supervisor; in the no-worker-binding branch (1140-1146) a reused pid yields `running` with no start-time check; binding `host` is recorded (391) but never compared. Fix: check worker pid + `processStartTime` before parking; compare host.

##### m5 — Resend can triple-deliver a brief to a worker that skipped the ack file
- Minor. herdr-round.mjs:814-826: `ackSeen` comes only from `outbox/ack-1.json`; an agent that completed a turn and sits `idle`/`done` without writing it is re-briefed after `resendAfterMs` (20 s default) up to twice. Compliant with X02 wording, but a real double delivery. Fix: treat an observed `working` since the first send as ack for resend purposes.

##### m6 — In-process (Task/API/MCP) handback creates no Run and returns no result
- Minor (documented design, but not a Run). cli.mjs:748-830: run dir under `os.tmpdir()`, no `run.json`, no receipt, result never re-enters dispatch; `fanoutBatchExecutorCli` just reports `mechanismChanged` (cli.mjs:1290-1292). `decide` with `mcpTool` says in-process (cli.mjs:1234) while `execute` on that executor throws Gate B3 — consistent, but "handback" is a return value, not an invocation. Status: reserved-not-executed for API/MCP; Task handback is caller-executed.

##### m7 — Prompt duplication and contradictory result paths in the Herdr brief
- Minor (token/UX). `renderAssignmentPrompt` instructs `<runDir>/agent-result.json` + `agent-report.md` and renders the claim schema (assignment.mjs:715-731); `renderBrief` wraps that same prompt and renders the claim schema again pointing at `<runDir>/outbox/result-1.json` with "Write only inside outbox" (brief.mjs:83-110, briefPaths brief.mjs:35-47). `effectiveContract` is never passed to `renderBrief` (herdr-round.mjs:1060), so its contract section is dead. Hypothesis, not measured: ~40 lines of duplicated instruction per round plus a real risk the worker writes the wrong file.

##### m8 — No prompt size bound; cli-spawn puts the whole prompt in one argv element
- Minor (hypothesis). transport.mjs:167 substitutes `{prompt}` per element; Linux caps a single argv string at 128 KiB (MAX_ARG_STRLEN) → `E2BIG` surfaces as `worker-spawn-fail` with no hint. Herdr's file-pointer delivery has no such cap. No bounding anywhere in these files.

##### m9 — Trust seeding writes the operator's `~/.claude.json` for the agy kind
- Known (sibling): herdr-round.mjs:578-607 `seedTrust(path.join(os.homedir(), '.claude.json'))` for any non-codex `trustStore.kind`. Skipped when a private HOME exists (herdr-round.mjs:1246-1248).

#### 4. Contract audit

| Contract | Where | Status | Notes |
|---|---|---|---|
| Invocation shape per adapter | transport.mjs:331, 681, 741; `validateInvocationShape` (config.mjs) | implemented | cli: `{command,args,env}`; http: `{method,url,headers,body}`; herdr: `+ argsTemplate, prompt, interactiveMode, promptDelivery, permissionMode, confinement, workerInvocation, requirement`. |
| Receipt | `cli-spawn-adapter-receipt.v1` (cli-spawn-supervisor.mjs:499-520), `herdr-adapter-receipt.v1` (herdr-round.mjs:1519-1541, 1670-1692) | implemented | Different bodies; both digest-bound to envelope/prepared invocation. herdr receipt for non-settled outcomes has `result:null`. |
| Locator / binding | cli: supervisor + worker bindings (`pid, processStartTime, pgid, bootId, host`) cli-spawn-supervisor.mjs:384-398, 671-690; herdr: `paneId, agentSession, resourceIncarnation{paneId, shellPid, workerPid, foregroundPgid, gatewaySessionId, processStartTime}` herdr-round.mjs:1742-1759 | implemented | `gatewaySessionId` is never populated by any producer (always null; herdr-round.mjs:1462-1469, 1487-1494). |
| Delivery state | — | proposed | Only visibility notes `briefed`/`working`; no `not-sent/sent/unknown` field. |
| Reconcile result | three vocabularies (m2) | partial | `waiting` (herdr) vs `running` (cli) mean the same thing. |
| Adapter result | `{status:number, signal, stdout, stderr, tier, model[, receipt|paneId,runDir,resultPath,outcome]}` | partial | herdr resume path returns the reconcile object instead (C1). |
| Command projection ownership | `controller/commands/<id>.json` | partial | token-guarded for cli (authority), unguarded writes from herdr-round (M3). |
| Env/creds to worker | env object (cli, via envelope), `--env` argv + launcher script (herdr) | implemented | secrets persisted (M2). |

#### 5. Simplicity / architecture

**cli.mjs responsibility map:** 82-220 agentType resolution (roster); 221-259 stray-write watcher; 260-287 `openDispatchRun` (writes `run.json` — a Run-record writer living in the invocation file); 288-518 `spawnWorker` (tier→model, prompt, attestation, run open, confinement request); 520-546 audit log; 547-560 head capture; 595-1161 `executeExecutorCli` (config load with worktree override, executor/purpose resolve, mechanism, in-process branch, policy resolve, dispatch lock, confinement, dirty-path diff, result build); 1163-1246 `decideExecutorCli`; 1248-1396 `fanoutBatchExecutorCli` (pick → execute → return via `execFileSync`); 1398-1420 cwd guard; 1422-1897 `runDispatchCli` (hand-rolled flag parser; `execute` with three doors `--assignment`/`--contract`/plain; `decide`; `log`; `fanout-batch`; `reconcile`). `executeExecutorCli` and `spawnWorker` duplicate ~120 lines of confinement-request/refusal construction (cli.mjs:376-441 vs 762-796 vs 986-1030).

**herdr-round.mjs responsibility map:** 56-94 launcher script + shell escaping; 95-284 `/proc` identity verifiers (argv/exe/cwd/environ); 285-363 pane kill/close + error-class map; 364-414 constants/deadlines; 416-486 round object, run dir; 488-576 confinement (legacy flags → private HOME, isolated session); 578-607 trust seeding; 609-649 agent start; 651-714 brief delivery; 716-854 liveness probe + poll loop + resend; 856-948 conclude/settle; 950-1096 `runHerdrRound` (requirement guards, collision scan, resume→reconcile, prepare, brief write, confinement); 1098-1114 batch tabs; 1116-1731 `driveRound` (pane, prepared-invocation digest checks, launcher write/readback, tamper checks, incarnation, command-projection writes, brief, poll, receipt publication ×2); 1733-1872 launch command + receipt I/O; 1874-2234 `reconcileHerdrSpawnRun`. Two distinct concerns share the file: the interactive round (≈900 lines) and the S2 proof/reconcile layer (≈500 lines); receipt-publication code is duplicated between the failed and settled branches (1501-1541 vs 1650-1712).

**Coupling:** herdr-round imports `publishImmutableProof/publishMutableProjection/computeSha256Digest/getProcessStartTime` from the *other adapter* (herdr-round.mjs:47-53) — proof helpers belong in a shared module. Adapters import runner-side modules (`liveness.mjs`, `visibility-session.mjs`, `run-result.mjs`) and read `result.json` in reconcile (herdr-round.mjs:1889-1895). No import cycle observed among the six files. Herdr-only configuration leaks through env (`FGOS_HERDR_ANCHOR_PANE`) because the generic doors refuse to carry a pane id (transport.mjs:751-777) — a deliberate but hidden channel. `mechanism.mjs` is clean.

**Overlap:** `transport.mjs` `cliSpawnAdapter` contains the direct-spawn body (transport.mjs:461-678) that the supervisor reimplements (cli-spawn-supervisor.mjs:596-836) — timeout/idle/maxBuffer logic exists twice with subtly different receipts.

#### 6. Perf / token

- **Herdr polling:** `agentGet` every 500 ms (herdr-round.mjs:345, 790) plus `paneProcessInfo` per tick (liveness, 716-728) → ~2-4 synchronous `herdr` process spawns per second per round for the round's whole life (30-min round ≈ 5k spawns); each blocks the Node event loop, so concurrent rounds in one process serialize on every herdr call. Evidence: code. Fix: back-off (1-2 s after ack), skip `paneProcessInfo` while `working`.
- **cli-spawn receipt poll:** 50 ms `existsSync` (transport.mjs:427-431) — cheap but chatty; `fs.watch` or supervisor `close` alone would do.
- **Double tee (M1):** 2× bytes to consumers, garbage content.
- **Prompt rebuild:** built once per Run/round (cli.mjs:326; assignment-runner.mjs:1904; herdr-round.mjs:1060); resend retypes only the pointer line (file-pointer) — no rebuild. Retry = new Run = new render, by design. Duplicate claim-schema text in herdr briefs (m7) is the only identified waste; no evidence of soul/instructions being embedded twice in these files.
- **Buffering:** direct path accumulates up to `maxBuffer` (10 MiB default, cli.mjs:346, 968) in memory; supervised path streams to files and digests on close (cli-spawn-supervisor.mjs:731-740). Timeout defaults: envelope 900 000 ms when unset (authority.mjs:1616).

#### 7. Test gaps

1. `startSupervisorProcess` argument order and single delivery per chunk (M1) — parity test accepts both orders.
2. `executeAssignment` resume over a `waiting`/receipt-settled herdr reconcile result must not launch (C1).
3. Herdr round under a superseded control token must not overwrite the command projection (M3).
4. Envelope/launcher/pane-env secret retention and removal (M2).
5. cli-spawn worker alive after supervisor death → not `parked` (m4); pid-reuse in the pre-binding branch.
6. `node dispatch.mjs reconcile` with no argument (m1).
7. Unconfined herdr path crash between `paneSplit` and projection write → next attempt behaviour (claim 5).
8. `gatewaySessionId` never set — either populate or drop from `matchIncarnations`.
9. Live executor tests (`codex-cli-glm-cli-live-executors.test.mjs`) are env-skipped; nothing exercises the direct-spawn argv size limit (m8).

#### 8. Doc corrections

- `dispatch-control-plane.md:442` — add: cli-spawn runs supervised (receipt/bindings/capture) **only** for Assignment-owned launches; `spawnWorker`/plain `execute` use direct spawn with no receipt (M4).
- `dispatch-control-plane.md:392-393` — "Herdr … does not settle Run truth": true for `result.json`, false for `controller/commands` state until M3 is fixed; say so or fix.
- `dispatch-control-plane.md:378-384` diagram — code order is Mechanism (`compileDispatchPlan`/`decideExecutorDispatchMechanism`) **before** Gate (authority), not `Gate --> Mechanism`; `Native --> Live` is not true: the in-process handback has no liveness/visibility session and no Run (m6).
- `dispatch-control-plane.md:40-47` capability set — mark "observability/contactability declared per executor" and "mode-specific reachability" as **proposed**; only prompt delivery, permission posture and confinement are declared today.
- `runtime-recovery-design.md:238` S2 — "Implemented … herdr-spawn": partial; unconfined path binds `paneId` after `agent start`, and the runner does not consume `waiting` (C1).
- `runtime-recovery-design.md:280` X02 — implemented in the adapter with the ack-file dependency (m5); "unknown delivery remains unknown" is **not** implemented — an unacked prompt timeout is reported as `worker-spawn-fail`.
- Delivery tri-state (`not-sent/sent/unknown`) — no field exists in any of these files; describe as proposed, not shipped.
- `runtime-recovery-design.md:275` E-c quota — adapter keeps the pane but reports `worker-timeout`; "no timed relaunch" depends on the recovery matrix distinguishing `outcome`, which it cannot from `errorClass` alone.

### Phụ lục 7: 07 — Operability & Recovery review (inspect / show-run / watch / reconcile / recover)


Reviewer: rv-operability-2. Read-only. Repo: /home/vantt/projects/forgentX @ 7853e4d7 + uncommitted docs.
Verified by: source reading, `node --test test/verbs/dispatch-recovery.test.mjs` (27/27 green), read-only CLI probes (`dispatch inspect/show-run/watch/recover/reconcile plan` with bogus ids, `coordination recover bogus`).
Canonical docs: `docs/platform/agent-coordination/**` (promoted from `docs/architect/**` in e1307d33; the architect copies are stale mirrors — reading-map.md:33-34 still points at `docs/architect/` and calls the recovery design "PROPOSED, chưa implemented", which contradicts §9's own status table).

#### 1. Claim status

| # | Doc claim | Status | Evidence |
|---|---|---|---|
| 1 | inspect / show-run / watch mutate nothing | **implemented** | runtime-inspection.mjs: only `fs.readFileSync/readdirSync/existsSync/statSync/realpathSync`; show-run.mjs:12-16 imports fs/path/paths/readVisibility only; watch.mjs:14-16 imports fs/path/show-run only. Import-graph pins: test/runner/dispatch-runtime-inspect.test.mjs:34, test/verbs/dispatch-observe.test.mjs:76 (no writable binding on the closure), test/runner/dispatch-reconciliation-import-graph.test.mjs:100 (exact-set walk, 17 banned modules :47-66). Default `watch` writes one line per tick to **stderr** (watch.mjs:67-72) — not a state write. |
| 2 | reconcile = guard/projection repair only; never recovers/launches/signals | **implemented** | Four actions only: clear-cwd-lock, collect-result, clear-assignment-claim, repair-projection (reconciliation-planner.mjs:279-283, 692-696). Forbidden action names refused at CLI, catalog, dynamic import, and tampered plan (test/runner/dispatch-operability-production-door.test.mjs:256-329). Apply writes: unlink lock/claim, tmp+rename run.json, append reconciliation-actions.jsonl (planner:609-611, 645-651, 683-687, 688). No spawn/signal anywhere in the graph. **Hidden-takeover check:** clearing cwd lock does enable the next `take/pick` launch by design; guarded by `no-active-run-for-holder` re-read of the `--cwd` inspection view (planner:657-666) + byte-digest re-read before unlink (:669-687). Not a hidden takeover. CAS under concurrency: proven with two real OS processes (dispatch-reconciliation-concurrency.test.mjs:36 + reconcile-apply-cas-worker.helper.mjs). |
| 3 | recover "re-enters compiler + confinement + adapter gates" (control-plane.md:421-425) | **over-claim** | `dispatch recover --action` never compiles, confines, spawns, or calls `executeAssignment`. It bumps the run-control epoch via `acquireRunControl` then releases (recover.mjs:279-323), patches `run.json.controlEpoch` (:326), appends `recovery-commands.jsonl` (:335), and for `resume-driver` **unlinks `<assignment>/dispatch.claim`** (:215-233). Nothing in `src/` reads `recovery-commands.jsonl` or `run.json.controlEpoch` (grep). The relaunch happens only *indirectly*: claim removal lets `createAndExecuteSessionTask` (session-engine.mjs:423-431) or a runner pass reach `executeAssignment`'s resume path (assignment-runner.mjs:1840-1876). Actions that exist: `resume-driver`, `reassign-driver` (recovery-planner.mjs:117-140). "Same Assignment / attempt increments / bounded / unknown effects park / result scanning wins / cancellation keeps late results" belong to `executeAssignment`/`reconcileCliSpawnRun`/`reconcileHerdrSpawnRun` (runner reviewer's lens), not to this door. |
| 4 | Slice table S0–S7 | see §1a | |
| 5 | §7 return shape / idempotency / no worker ids / needs-input names decision | **partial** | Shape differs (see §4). Idempotent replay: recover.mjs:260-264, test :252. needs-input names the missing grant (planner:132-136). Worker-supplied ids: **violated** — `replacement-authority--<driverId>.json` is read from the worker-writable outbox (planner:294-299). |
| 6 | Proof matrix | see §1b | |
| 7 | Typed refusal reasons | **partial** | Runner reconcile (`reconcileCliSpawnRun`/`reconcileHerdrSpawnRun`) returns typed `{status, reason}` codes (command-missing, incarnation-mismatch, protected-artifact-corrupt, evaluator-baseline-*, supervisor-binding-unknown, host-reboot-unknown, confinement-mismatch, cancel-unsupported, shared-cwd-takeover-unsupported…). `dispatch reconcile`/`dispatch recover` return `outcome` enums + **prose `reason` only, no `reasonCode`** (planner:279-317, recover.mjs:302-321). Only `executeAssignment` branches on runner codes (`rec.settled && rec.runResult`, assignment-runner.mjs:1873); thrown verb errors carry `.code` (`invalid-run-id`, `run-not-found`, `missing-expectation`, `lock-busy`, `invalid-intent`). |
| 8 | RunObservation cannot settle/retry/cancel/authorize/clear guard | **implemented** (behaviour) / **partial** (vocabulary) | No write path in runtime-inspection.mjs. `recoveryAuthority` is only a hint string (:104). Field vocabularies drift from the contract (Finding M2). |

##### 1a. Slice table S0–S7 (runtime-recovery-design.md:228-246)

| Slice | Doc status | Verified status | Note |
|---|---|---|---|
| S0 | Implemented | not re-verified | fixture freeze; outside this group. |
| S1 | Implemented (`run-lock.mjs`) | **implemented** | acquire/held/stale + PID-dead-only reclaim (run-lock.mjs:275-326). |
| S2 | Implemented cli-spawn + herdr-spawn; writable takeover parks | **implemented** | typed statuses (assignment-runner.mjs:3079-3377; herdr-round.mjs:1870+); takeover/cancel park (:3081-3086). |
| S3 | Implemented (`recovery.mjs`) | **partial** — over-claim | `assess()` (effect boundary, "unknown effects park") has **zero production callers** (grep src). `resolveFallback` is wired only for *launch-time provider-capacity refusal* (assignment-runner.mjs:1206-1320, 1660-1675), not §4's "worker cannot continue → eligible replacement Run". Status should read: fallback-at-admission implemented; effect-boundary **reserved-not-executed**. |
| S4 | Implemented (pure planner + `dispatch recover`) | **implemented** with defect | planner pure (test/verbs/dispatch-recovery.test.mjs:80). Apply door exists beyond "no automatic repair" — see H1. |
| S5 | session half implemented, transfer deferred | **implemented as stated** | `src/verbs/coordination/recover.mjs` is a distinct door: resolves Runs only via `assignmentRefs`, actions `observe/collect/settle/close/park` (coordination/schema.mjs:628), writes through `store.recordRecoveryCommand`. Retry/replace are engine doors (`retrySessionTask` session-engine.mjs:4705, `replaceSessionActor` :4900), not reachable from `dispatch recover`. |
| S6 / S7 | Not implemented | **consistent** | |

##### 1b. Proof matrix coverage (only ids touching this group)

| ID | Coverage | Test |
|---|---|---|
| F-a | covered | herdr-reconciliation.test.mjs:449,496,1149 (incarnation-mismatch parks); cli-spawn-reconciliation.test.mjs:453 (PID reuse refuses inspect/kill/settle). |
| F-b | covered | herdr:634 ("F-b coordinator dead, worker alive"), cli-spawn:189. |
| F-c | PARTIAL | herdr:711 / cli-spawn:663 (stale controller observes, no settle). No explicit "caller timeout while worker working" fixture. |
| F-d | MISSING (in group) | no provider-pause/retryAfter pane-preservation test in these files. |
| F-e | PARTIAL | herdr:340 (idle/done alone never settles), herdr:576 (absence w/o absent-proven parks). "Zero stdout never infers" not asserted. |
| F-f | covered | herdr:675; run-lock admission proof is outside group. |
| F-g | PARTIAL | herdr:543 (pre-bind parks incarnation-unknown); no assertion that refusal names Run/handle. |
| E-a…E-d, E-f | MISSING | `assess()` matrix is unit-tested purely (test/runner/dispatch-effect-guarantee.test.mjs:39-84) but no production path calls it. |
| E-e | PARTIAL | dispatch-recovery.test.mjs:50-135 (governance/compiler refusals) — pure `resolveFallback` only. |
| X01 | PARTIAL | verbs/dispatch-recovery.test.mjs:395 (live-holder gate). Full TTL-race proof lives with run-lock tests (outside group). |
| X02 | covered (cli-spawn) | cli-spawn:663,710,783; herdr:711. |
| X03 | PARTIAL | dispatch-reconciliation.test.mjs:273 (superseded collect blocks); retention-per-Run not asserted. |
| X04 | PARTIAL | cli-spawn:189,388 (protected capture, partial coverage); writable takeover parks (cli-spawn:1028, herdr:775). |
| X05 | MISSING | |
| X06 | PARTIAL | cancel is `parked: cancel-unsupported` (assignment-runner.mjs:3081-3083); "late result retained" not asserted. |
| X07–X09 | MISSING (deferred P07) | consistent with doc. |
| X10 | MISSING (in group) | inspect marks malformed run.json `partial/manual-required` (inspect test :27) but no state-version/foreign-owner refusal. |
| X11 | MISSING | |

#### 2. Mutation-authority table

| Verb | Reads | Writes | May spawn / signal? | Exit on not-found |
|---|---|---|---|---|
| `dispatch inspect --run/--assignment/--cwd` | `.fgos/assignments/**/run.json,result.json,visibility.json,admission/**,assignment.json`, `dispatch-runs/**`, `coordination/sessions/*/session.json`, `dispatch.lock`, `workspace-evidence.json`, `dispatch/projection-conflicts.json`, `.git` metadata | none | no | exit 0, `inspectionStatus: not-found` |
| `dispatch inspect --provider-capacity` | global config + provider-capacity state | none | no | — |
| `dispatch show-run` | run.json, visibility.json, outbox listing | none | no | exit **1** (`DispatchObserveError` uncategorized) |
| `dispatch watch` | same + stdout.log tail, every `--interval` ms (default 1000) | stderr progress line only | no | exit 1 |
| `dispatch reconcile plan` | inspect views + lock/claim/result bytes + `/proc/<pid>/stat`, `/proc/stat` | none | no | exit 0, `outcome: blocked/refused/needs-input` |
| `dispatch reconcile apply --plan` | re-derives plan under `.fgos/dispatch/reconcile.lock` | unlink `dispatch--<cwd>.lock` or `dispatch.claim`; tmp+rename `run.json` (`resultCollectedAt` / `status:'settled'`+`settledAt`); append `.fgos/dispatch/reconciliation-actions.jsonl` | no | exit 0 typed outcome |
| `dispatch reconcile provider-capacity clear-quarantine` | global config | provider-capacity state file + audit | no | typed `refused` |
| `dispatch recover <runId>` (no --action) | run.json, visibility, outbox, `control/generations/`, result.json classification | none | no | exit 1 |
| `dispatch recover --action …` | same, under `<runDir>/.recovery.lock` | `control/generations/<n>.json` + release marker (via run-lock), `run.json.controlEpoch`, `recovery-commands.jsonl`, **unlink `<assignment>/dispatch.claim`** (resume-driver) | no direct spawn; **enables** a session/runner relaunch by removing the exclusivity marker | exit 1 not-found; exit 4 missing CAS field |
| `coordination recover <id>` | session manifest/events, assignmentRefs runs | session event via `recordRecoveryCommand` (actions observe/collect/settle/close/park) | no | exit 4 (StoreError validation) |

#### 3. Findings

##### H1 — `dispatch recover --action resume-driver` clears `dispatch.claim` with no dead-driver proof and no session-ownership refusal (hidden relaunch enabler)
- **Severity:** High (correctness; policy split between two doors on the same file).
- **Evidence:** recover.mjs:215-233 `clearDispatchClaimForRecoveredDriver` unconditionally unlinks `<assignment>/dispatch.claim` after apply. Liveness evidence is collected (recovery-planner.mjs:288-293) but `deriveRecoveryFacts` never reads it (:117-129: `resume` → `ok` whenever not settled). The only liveness gate is `acquireRunControl` returning `held`, which fires **only if a control generation exists with a live pid** (run-lock.mjs:286-300); a schema-1/epoch-0 run passes trivially — exactly the fixture in test/verbs/dispatch-recovery.test.mjs:18-26,344-358 ("after dead-driver recovery" in the name, no driver at all in the fixture). recover.mjs has no `coordinationId`/`findCoordinationSessionOwningAssignment` check, while `reconcile clear-assignment-claim` refuses session-owned claims (planner:377-381) and requires dead-holder proof + no pending collection + no unsettled run (:383-433).
- **Actual problem:** Two public doors govern the same guard with contradictory rules; the weaker one is the one named "recover".
- **Failure scenario (F-b shape):** coordinator/runner process dies, herdr worker keeps working (visibility `lastSeenAt` fresh). Run-control holder pid (the dead runner, assignment-runner.mjs:1944-1945) is dead, so `acquireRunControl` succeeds — it proves the *coordinator* is gone, not the *worker*; the worker heartbeat is the evidence the planner collects and ignores. Operator runs `dispatch recover <run> --action '{"type":"resume-driver"}' …` → `applied`, `dispatchClaimCleared:true`. Next `coordination run` passes the `wx` claim gate (session-engine.mjs:423-431) → `runExecutorAttempt` → `executeAssignment` resume path (assignment-runner.mjs:1840-1876): `reconcileHerdrSpawnRun` answers `waiting` for the live worker and the runner falls through to a **fresh spawn** for the same Assignment (the runner reviewer's Critical), while the original worker is still writing. Schema-1 runs with no generation at all skip even the coordinator check.
- **Boundary:** recover.mjs (verb) + recovery-planner.mjs (planner ignores liveness).
- **Why tests miss:** fixture has no generation, no visibility, no session; the test asserts the unlink happens, not that it is proven safe.
- **Smallest fix:** (a) refuse in `recoverApplyUseCase` when `run.coordinationId ?? run.coordinationSessionId` is set or `findCoordinationSessionOwningAssignment(root, run.assignmentId)` matches (already exported by runtime-inspection.mjs:94); (b) in `deriveRecoveryFacts`, `resume` requires `liveness.fresh === false` (else `needs-input: driver heartbeat fresh`); (c) replace the raw unlink with `planClearAssignmentClaim`/`applyClearAssignmentClaim` so one proof set governs the file.
- **Priority:** P1.

##### H2 — S3 "Implemented (`recovery.mjs`)" over-claims: the effect boundary is dead code
- **Severity:** High (doc/claim; effect safety not enforced).
- **Evidence:** `assess` has no caller in `src/` (grep). `resolveFallback` is wired only in `attemptProviderCapacityFallback` (assignment-runner.mjs:1206-1320) called from the launch-time capacity-refusal branch (:1660-1675). No path implements §4 row 3 "worker cannot continue → reconcile effects, then eligible replacement Run" or "unknown effects park".
- **Failure scenario:** none at runtime today (nothing repeats post-delivery automatically); the risk is a future caller adding a mid-run fallback and believing the matrix is already enforced.
- **Smallest fix:** change S3 status to "partial: admission-time fallback implemented; effect-boundary (`assess`) reserved-not-executed"; keep `assess` or mark it explicitly unwired in its header.
- **Priority:** P2 (doc), P3 (code).

##### M1 — `reconcile apply` local lock has no dead-holder reclaim; one SIGKILL blocks every future apply
- **Severity:** Medium.
- **Evidence:** reconciliation-planner.mjs:537-541 `withLocalLock`: `openSync(file,'wx')` failure → `{outcome:'blocked', reason:'another reconcile apply is in progress'}`; no pid check. recover.mjs:140-172 (M1) already solved the same problem for `.recovery.lock`.
- **Failure scenario:** apply killed between :539 and `finally` → `.fgos/dispatch/reconcile.lock` persists → all `reconcile apply` calls report `blocked` forever; the only remedy is a manual delete, which the design forbids ("no manual claim-file deletion", X07).
- **Why tests miss:** concurrency test proves exclusion only.
- **Smallest fix:** write pid (already done :541) and on EEXIST reuse the module's own `startTime(pid)` (ENOENT ⇒ `null` ⇒ dead) to reclaim; `isProcessAlive` cannot be imported (run-lock banned :63).
- **Priority:** P2.

##### M2 — RunObservation fields do not follow the contract's closed vocabularies
- **Severity:** Medium (contract quality).
- **Evidence:** runtime-inspection.mjs:108-111. `phase` = `run.json.phase`, which every `assignment-run.v2` writer sets to `'admitted'` at admission and never updates (assignment-runner.mjs:1571; no other writer) → a **settled** run reports `phase:'admitted'`; runs without the field leak `status` values `running/died`. `delivery` = `run.json.delivery` = `'not-sent'` (:1572) — not in `{not-started,running,delivered,unknown,replayed,recovered}` (contract run-result-and-observation.md:74-82). `resourceState` = `visibility.json.status` (`detached/died/reconciled`, visibility-session.mjs:131,323) — not in `{live-proven,…,unsupported}`. `evidenceCompleteness.workspace:'partial'` is not a completeness value.
- **Why tests miss:** dispatch-runtime-inspect.test.mjs asserts `inspectionStatus`/hints only.
- **Smallest fix:** derive `phase` from facts (result.json ⇒ settled; controller/commands ⇒ launched/bound), map visibility status → resourceState, map `not-sent` → `not-started`, use `unsupported` for workspace.
- **Priority:** P2.

##### M3 — `dispatch watch` never terminates on the crash window `repair-projection` exists for
- **Severity:** Medium (UX/correctness).
- **Evidence:** watch.mjs:21,82 stops only on `run.json.status ∈ {settled,died,unknown}`; `readRunSnapshot` (show-run.mjs:113-131) never looks at `result.json`. The planner's own rationale for repair-projection is a writer that wrote `result.json` but died before `markRunSettled` (planner:436-447).
- **Failure scenario:** run finished, status stuck `running` → watch loops until `--ticks`/Ctrl-C, printing `status=running`.
- **Smallest fix:** add `settled: fs.existsSync(path.join(dir,'result.json'))` to the snapshot and break on it.
- **Priority:** P3.

##### M4 — Exit-code categories are inconsistent across the five sub-verbs (io-contract.md:73-78)
- **Severity:** Medium (operator distinguishability).
- **Evidence (probed):** `inspect --run bogus` → exit 0 + `inspectionStatus:not-found`; `show-run bogus` / `watch bogus` / `recover bogus` → stderr `fgos: no run "bogus" under …`, **exit 1** (`DispatchObserveError`/`RecoveryError` carry `.code` but no `.category`, so bin/fgos.mjs:5114 falls to 1); `coordination recover bogus` → exit 4; `dispatch inspect` (no selector) → exit 4; `recover bogus --action {}` → exit 4 (missing CAS field checked before run lookup). io-contract says 1 = "bất ngờ, chưa phân loại".
- **Smallest fix:** set `category: 'precondition'` on not-found and `'validation'` on invalid-run-id/missing-expectation in both error classes (or map `.code` in bin).
- **Priority:** P3.

##### L1 — `resolveFallback` sources replacement authority from the worker outbox
- recovery-planner.mjs:294-299 treats `outbox/replacement-authority--<id>.json` (worker-writable) as authority; §7 forbids worker-supplied ownership assertions. No consumer of `reassign-driver` exists today (nothing reads `recovery-commands.jsonl`), so impact is nil now. Fix: read grants from a controller-owned location (e.g. `controller/`), never `outbox/`.

##### L2 — recover accepts ad-hoc `dispatch-runs/**` runs it was not designed for
- recover.mjs:211-213 `dispatchClaimPathForRunDir` → `.fgos/dispatch-runs/dispatch.claim` for a `dispatch-runs/<g>/<stamp>` run (harmless ENOENT). `findRunDir` (show-run.mjs:52-76) searches both layouts; recover should refuse non-Assignment runs or scope the claim path by layout.

##### L3 — Marker writes with no reader
- `run.json.controlEpoch` shadow (recover.mjs:326; module's own comment :55-58 says nothing fences it), `recovery-commands.jsonl`, and `resultCollectedAt` have no production reader except `clear-assignment-claim`'s precondition (planner:409). `collect-result` is therefore a stamp, not a "link through owning authority" (planner:286-292 wording).

##### L4 — `apply` reports a now-live holder as `plan-stale`
- planner:615,652,688 & 705: fresh outcome `refused` (holder alive) is folded into `plan-stale`. Operator loses the distinction "facts moved" vs "you must not do this". Fix: pass `fresh.outcome` through when it is `refused`/`needs-input`.

#### 4. Contract audit rows

| Contract | Doc | Code | Verdict |
|---|---|---|---|
| RunObservation shape | contract.md:38-96 | runtime-inspection.mjs:108 emits `contract{id,version}`, `observedAt`, `subject`, `phase`, `resourceState`, `delivery`, `inspectionStatus`, `evidenceCompleteness`, `recoveryAuthority:null`, `observations[]` | shape ✔, vocabularies ✘ (M2). Doc example uses `summary`, code uses `value`. |
| inspect top-level | — | `{inspectionStatus, subject{kind,id,locations[]}, observations[], runObservation, runResult, recoveryAuthority?, reconciliation{state,reason}, links{assignmentIds,coordinationIds,runIds}}` | consistent across run/assignment/cwd; `coordinationIds` always `[]` for assignment/cwd selectors (:120,131) even when the owning session is known — minor. |
| Reconciliation plan | control-plane.md:401-425 | `{outcome:'planned', actionKey, snapshot{digest,…,expiresAt}, proposedAction{kind,path,…}, preconditions[]}` else `{outcome, reason}` | implemented; `preconditions` are strings, not verified flags; no `reasonCode`. TTL 5 min; `now/ttlMs` cannot be forged over CLI (reconcile.mjs:6-14, test :66). |
| Recovery recommendation | design.md:182-204 `{outcome, action, subjectRefs, reasonCode, evidenceRefs, nextCheckAt?}` | observe: `{kind, snapshotHash, expectedControlEpoch, actionKey, evidenceIds, action, expiresAt, reason}`; apply: `{outcome, actionKey, action, appliedAt, controlEpochBefore/After, snapshotHash, dispatchClaimCleared}` | **proposed shape not implemented**; `waiting`, `subjectRefs`, `reasonCode`, `nextCheckAt` absent. Doc already labels §7 "proposed request fields" — fine, but control-plane.md:421-425 describes recover as shipped and gate-re-entering (over-claim). |
| Fallback eligibility | design.md:104-116, executor-health-and-fallback.md | `resolveFallback` may change **executor** (hence provider/model) if listed in `policy.executorPreference`, same tier + visibility required (recovery.mjs:96-160); provenance: `evidence{declaredPrimary, reasonCode:'provider-capacity-refused', skippedCandidates[], resolved, switchedAt}` (assignment-runner.mjs:1272-1319) → auditable. Quiescence check vs a live superseded worker: **none** — fallback runs only before any launch (capacity refusal), so N/A today. | cross-provider by design (control-plane.md:440 "no cross-provider substitution by the rotator" refers to placement, not this path — wording collision worth one sentence). |

#### 5. UX / surface audit

- **Selectors:** `inspect` uses `--run | --assignment | --cwd` (exactly one; validation :119); `show-run/watch/recover` take positional `<runId>` or `--run-id`; `reconcile plan` takes `--action` + `--run` (collect-result/repair-projection) or `--assignment` (clear-assignment-claim) or `--cwd` (clear-cwd-lock, default action, default `process.cwd()`); `--dir` selects the main checkout `.fgos` (bin/fgos.mjs:2933). Three different spellings for "which run" (`--run`, `--run-id`, positional) across one verb family.
- **Legacy aliases:** none found; `json` flag accepted as no-op.
- **Quoted messages (probed):** `fgos: no run "bogus" under /home/vantt/projects/forgentX` (exit 1); `fgos: dispatch inspect requires exactly one selector: --run, --assignment, or --cwd` (exit 4); `fgos: dispatch recover --action requires --expected-snapshot` (exit 4); `{"outcome":"blocked","reason":"no cwd lock exists"}`; `{"outcome":"refused","reason":"unsupported reconciliation action: bogus"}`; `{"outcome":"refused","reason":"repair-projection requires a runId"}`; `--assignment ../../etc` → `blocked: no matching Assignment was found for clear-assignment-claim` (escape refused silently via isWithinDir :24-28; nothing outside `.fgos/assignments` is read — cli test :94).
- **Distinguishability:** unavailable (not-found) vs governance-blocked vs confinement-refused vs runtime-unknown vs recovery-eligible — from *reconcile/recover* output an operator can tell `blocked` (a named precondition false) / `needs-input` (facts unverifiable) / `refused` (policy) / `plan-stale|plan-expired|held|already-applied` by `outcome`, but only by **prose** inside `reason`; there is no `reasonCode`. Governance/confinement refusals are not observable from this group at all (they live in the runner's `reconcile*` codes which the CLI never surfaces). `recoveryAuthority.observeCommand` tells the operator which door to use (`fgos coordination recover <id>` vs `fgos dispatch recover <runId>`) — good.
- **show-run and Herdr state:** `visibility` (pane/paneId/lastSeenAt) is a sibling field to `run`, never merged into `run` (show-run.mjs:125-131); watch prints `visibility=` separately. Herdr state is **not** presented as Run truth. ✔
- **watch:** interval default 1000 ms, `--ticks` bound, exits on `settled|died|unknown` status, `tick-budget`, or abort; returns `stoppedBecause`. See M3.

#### 6. Simplicity / architecture

- **Planners pure?** recovery-planner.mjs: pure (crypto only; test :80). reconciliation-planner.mjs: *not* pure — it reads fs, `/proc`, and applies (planner = plan+apply in one 730-line module); tolerable but the name misleads.
- **Verbs import runner?** inspect/reconcile/show-run/watch import only read-only runner modules. recover.mjs imports `run-lock.mjs` (writer) and `visibility-session.mjs` — acceptable, but recover is the one verb whose *policy* (claim clearing) duplicates and contradicts the planner's (H1).
- **Duplication:** three byte-identical copies of `/proc` start-time parsing and epoch reading are kept on purpose to satisfy the import-graph ban (planner:23-70,166-183 vs cli-spawn-supervisor, recover.mjs:56-59); `DRIVER_FRESH_MS` duplicated twice (planner:47, coordination/recover.mjs:42). The ban forces copies; a tiny shared leaf (`process-incarnation.mjs`, fs-only) would remove three copies without widening the graph.
- **Verb overlap:** `inspect --run` vs `show-run` vs `recover` (no --action) are three read doors over the same run dir with three shapes. `recover` observe could be `inspect --run --recommend`.
- **Recovery bypasses gates?** Yes indirectly (H1). Standalone `recover` + `reconcile clear-assignment-claim` + session `dispatch.claim` writer form a three-party protocol with no single owner.

#### 7. Perf

- `inspectDispatchRuntime` calls `allRuns(root)` (full readdir + JSON parse of every `run.json` under `assignments/**` and `dispatch-runs/**`) on **every** call (:118). `planCollectResult`/`planClearAssignmentClaim` call inspect 2–3× (planner:286-300, 351-400), and `apply*` re-derives the plan under the lock → 4–6 full scans per apply. `--cwd` path calls `owner()` per bound run, each recomputing `assignmentEvidence` over `all` (O(runs × assignments)). `result(l)` re-reads/re-interprets `result.json` up to three times per run in the cwd aggregate (:127). Acceptable at hundreds of runs; pathological at thousands. Recovery snapshot (`buildSnapshot`) is per-run and cheap. **No stale cache** exists anywhere (no caching at all) — stale-snapshot risk is only the plan TTL (5 min) + digest/epoch CAS, which is correct.
- `--cwd` observation embeds every historical `RunResult` in full (`historicalRunResults`, :127) — envelope can be large.

#### 8. Test gaps

1. No test that `recover --action resume-driver` refuses a session-owned Run or a live-heartbeat driver (H1).
2. No test that `.fgos/dispatch/reconcile.lock` left by a dead process is reclaimed (M1).
3. No vocabulary assertions on `phase/delivery/resourceState/evidenceCompleteness` (M2).
4. No watch test with `result.json` present and `status:'running'` (M3).
5. No CLI test pins exit codes for show-run/watch/recover not-found (M4); cli tests only assert `status===0` for envelope paths.
6. `assess()` has pure tests only; no production-path test can exist because nothing calls it (H2).
7. Proof matrix F-d, X05, X10, X11 have no test in the group; E-a..E-d/E-f none.
8. `recover` on a `dispatch-runs/**` run (L2) untested.

#### 9. Doc corrections

- control-plane.md:421-425: replace "`dispatch recover` … then re-enters the normal compiler, confinement, and adapter gates" with: "records a CAS-guarded recovery decision (control epoch, recovery-commands.jsonl, clears the Assignment dispatch claim on resume-driver); relaunch happens only through the existing session/runner doors."
- runtime-recovery-design.md:239 (S3): "Implemented" → "Partial: admission-time fallback (`resolveFallback`) wired for provider-capacity refusal; effect boundary (`assess`) reserved-not-executed."
- runtime-recovery-design.md:182-204 (§7): note that the standalone door's return shape is `{kind|outcome, action, actionKey, snapshotHash, expectedControlEpoch, expiresAt, evidenceIds, reason}` and that `reasonCode/subjectRefs/nextCheckAt/waiting` remain proposed.
- reading-map.md:33-34: point at `docs/platform/agent-coordination/**` and drop "chưa implemented" for the recovery design (S0–S4 shipped per its own §9).
- assignment-run-runresult.md:240-268 addendum: add that RunObservation vocabularies are not yet enforced by inspect (M2) or fix the code.
- control-plane.md:440 "no cross-provider substitution by the rotator" vs recovery fallback being cross-executor: add one clause distinguishing rotator (same-provider accounts) from declared-fallback executors.
- command-registry.mjs:792-842 `touchesState:false` for `dispatch`: `reconcile apply` and `recover --action` do write `.fgos/` files (locks, run.json, jsonl); the comment justifies it by the field's narrow definition — fine, but the description should say "writes run/guard files, never events.jsonl".

### Phụ lục 8: 08 — Dispatch & Execution Engine: cross-boundary review (callers, config/doctor, CLI, docs)


Read-only review, 2026-09-20, repo `/home/vantt/projects/forgentX` @ `7853e4d7` + uncommitted tree.
All code findings below sit in COMMITTED code (`git diff -U0` of session-engine.mjs / bin/fgos.mjs / command-registry.mjs touches no dispatch-boundary hunk). Doc findings marked **[uncommitted]** sit in the working tree.

#### 1. Dependency-direction table

Expected one-way: Work / Coordination / Domain / Host → Dispatch → RunResult normalization → Evaluator → caller.

| From | To | file:line | Verdict |
|---|---|---|---|
| Host (bin/fgos.mjs) | Dispatch barrel | `bin/fgos.mjs:45`; verbs `bin/fgos.mjs:94`, `2931-3032` | allowed |
| Host (bin/fgos-runner.mjs) | dispatch config | `bin/fgos-runner.mjs:24` | allowed |
| Host (herdr-plugin) | `claude` interactive launch | `herdr-plugin/src/pick.rs:254-358`, model pin `pick.rs:107-109` | allowed (host launcher), see §2 |
| Coordination session-engine | executeAssignment / RunnerConfigError / TIER_STRENGTH / execution-contract | `src/runner/coordination/session-engine.mjs:76-80` | allowed |
| Coordination cohort-planner | resolveExecutorConfig, resolveAssignmentDispatchPolicy | `cohort-planner.mjs:38-40`, call `:151` | allowed (documented exception; read-only re-resolve) |
| Coordination store | `buildAssignment`, `claimAssignmentId` | `coordination/store.mjs:24` | allowed |
| Coordination store | run-lock generation primitive (`publishNextGeneration`, `publishMarkerOnce`, `readMarker`, `currentGeneration`, `listGenerations`) | `coordination/store.mjs:38`, used `:2179`, `:2256` | **direction OK, placement smell**: Coordination's own session-ledger writer is built on a Dispatch-internal file primitive. Nothing dispatch-specific is used (append-only marker/generation), so it is a shared filesystem utility living under `dispatch/`. Not a cycle. |
| Coordination recover verb | run-lock `controlDirs/currentGeneration`, visibility-session | `src/verbs/coordination/recover.mjs:32-33` | allowed |
| Work verbs → Dispatch | `verbs/state/stage.mjs:6` (operation-choice), `verbs/state/read.mjs:5` (visibility-session) | allowed |
| Runner loop → Dispatch | `src/runner/loop.mjs:100` (operation-choice) | allowed |
| Setup → Dispatch | `setup/registrations.mjs:34,38,44,45,47,48,62`, `setup/executor-profile-warnings.mjs:12` | allowed (doctor reads) |
| Evaluator (`src/report/dispatch-confidence.mjs`) → Dispatch | `dispatch-confidence.mjs:15` imports `result-ladder.mjs` | allowed (Evaluator consumes ladder) |
| **Dispatch → Work state (read)** | `dispatch/cli.mjs:20,24` (`DEFAULTS`, `listWork`, `resolveWriterLogPath`), `config.mjs:23` (`TIERS`), `prepare.mjs:34` | **reverse (read-only vocabulary/list)** |
| **Dispatch → Work event log (write)** | `dispatch/cli.mjs:25` `appendEvent` → `logExecutorDispatch` `cli.mjs:520-522`, called `cli.mjs:1847` (`log` subcommand) | **reverse**: Dispatch appends `executor.dispatch` events into the Work event log. |
| **Dispatch → Work verbs via subprocess** | `dispatch/cli.mjs:1307` `execFgos(['pick',…])`, `:1342` `execFgos(['return',…])` inside `fanoutBatchExecutorCli` (`cli.mjs:1248`) | **reverse + cycle** (Dispatch → Host CLI → Work lifecycle). See §5 F2. |
| **Dispatch → Work occupancy** | `dispatch/cli.mjs:39,1261-1262` `hasWorkerSlotRoom` | reverse: OccupancyPort is declared Work-Driver-owned (boundary map §9 `OccupancyPort`). |
| **Dispatch → workflow/stage/skill lookup** | `cli.mjs:21`, `prepare.mjs:35`, `resolve.mjs:13` (`workflow-stage-graphs`: `skillForStage`, `bundleForStage`, `resolveTaskSpecPath`), `cli.mjs:22` (`agent-roster`) | reverse vs the doc's own forbidden list ("no workflow/stage/task/skill lookup", platform dispatch-control-plane.md §Component-Internal Ownership). |
| **Dispatch → intake (planning-stage engine)** | `operation-choice.mjs:19-20` → `src/intake/plan.mjs`, `plan-verdict-from-plan-md.mjs`; `operation-choice.mjs:25` → `runner/worktree.mjs` | reverse; both boundary docs already admit operation-choice belongs to Work Driver (advisory §18 l.92-93; boundary-map l.248-249). |
| Dispatch → definitions | `assignment-policy.mjs:29`, `recovery.mjs:48` (`REPEAT_MODE_VALUES`), `assignment-runner.mjs:67` (protocol-loader) | allowed (Definition Loader is upstream vocabulary) |
| Dispatch → setup/config | `config.mjs:24-26`, `cli.mjs:38,46` | allowed |
| Dispatch → tool-registry | `config.mjs:27` `findExecutableOnPath` | allowed |

No import cycle at module level (dispatch never imports coordination/*, verbs/*, or bin/*). The only cycle is the **process-level** one through `execFgos pick/return`.

**What the two pinning tests pin**
- `test/runner/dispatch-reconciliation-import-graph.test.mjs:52-125` — the reconcile verb's transitive import closure is EXACTLY {reconcile.mjs, reconciliation-planner, runtime-inspection, run-result, visibility-session, worker-artifacts, provider-capacity, global-config, shared-config-file, config-merge} and never reaches 17 banned process-control/admission modules (incl. `session-engine.mjs`, `claim-port.mjs`, `run-lock.mjs`). It pins reconcile's read-only-ness, nothing about the rest of the graph.
- `test/runner/dispatch-production-call-sites.test.mjs` — `spawnWorker` and `executeExecutorCli` from a real config file through `resolveExecutorCommand` to the herdr adapter: confinement reaches herdr, refusal on unestablishable confinement (`errorClass: invalid-config`), run opened is closed, in-session door writes under `.fgos/`, stray-path refusal (`worktree-fail/wrote-outside-workspace`), attestation attached (R5/R7), in-process `authorityScope: external-harness` (R6), http adapter through confinement. It does NOT cover `fanoutBatchExecutorCli` or `dispatchDeclaredOperation`.

#### 2. Second-dispatch-path inventory

| Path | Location | Goes through compileDispatchPlan + assignment-runner? | Verdict |
|---|---|---|---|
| `spawnWorker` / `executeExecutorCli` (purpose door) | `dispatch/cli.mjs` | compileDispatchPlan yes; executeAssignment NO (RUL68 documents this as a deliberate 2-tier design, runner.md:1037) | sanctioned |
| `fanoutBatchExecutorCli` | `dispatch/cli.mjs:1248-1360` | compileDispatchPlan yes (`:1282`); then subprocess `fgos pick` → `executeExecutorCli` → `fgos return` | sanctioned mechanism, wrong layer (§5 F2) |
| `dispatchDeclaredOperation` | `session-engine.mjs:2886-2983` | yes: 7-scope policy stack → `cliOverride` → `createAndExecuteSessionTask` → `executeAssignment` (`:345`) | sanctioned; naming issue (§5 F4) |
| cohort-planner re-resolve | `cohort-planner.mjs:151` | read-only `resolveExecutorConfig`; no spawn (`cohort-planner.mjs:16` comment; grep confirms no child_process) | documented exception, holds |
| headless-adapter | `coordination/headless-adapter.mjs:25` → `runCoordinationUseCase` | yes (through session-engine) | ok |
| Doctor probes | `setup/registrations.mjs:2294-2374` (`claude --version`, `claude plugin …`), `:3535,3612` (`herdr --version`, herdr args) | n/a — diagnostics, no agent prompt | ok; note `'herdr'` hardcoded, ignores `FGOS_HERDR_BIN` (§3) |
| Gateway | `runner/gateway-control.mjs:273,295` spawns `herdr-fgos gateway` | n/a — service, not an executor | ok |
| **herdr-plugin pane launcher** | `herdr-plugin/src/pick.rs:254-358` spawns `herdr … claude` typing `/fgOS:pick <id>`; model pinned by `FGOS_HERDR_MODEL` default `sonnet` (`pick.rs:107-109`) | NO. Launches an interactive `claude` with its own model policy, outside `runner.executors`/placement policy. The session then runs `decide` itself, so Assignment dispatch is not bypassed, but executor/model selection for the *driver* session is. | host-layer second executor-launch policy; not registered in config/doctor |
| Skill prose | `core/skills/fgos-architecture-panel/SKILL.md:183-193` quotes `claude -p …` only as a diagnostic of what the global default WOULD run; `plugins/fgOS/skills/terminal*/…sh` call `herdr pane rename/close` (chrome only) | no executor launch | ok |
| `src/intake/plan.mjs` | header `:8-12`: nested `claude -p` judge RETIRED | none | ok |

`cliOverride` channel: `session-engine.mjs:2886-2904` merges runner/definition/operation/role/actor/assignment/cli scopes, then hands the merged values to `resolveAssignmentDispatchPolicy` as `cliOverride`, with `policyProvenance` carrying real scope only for `tier`, `persona`, `executor` (`assignment-policy.mjs:188,204,301`). `mode` (`:246`), `minRigor`, `reasoningEffort` (`:289`), `fallbackExecutors`, `visibility`, `repeatMode` still get stamped `{scope:'cliOverride'}` or no provenance. The name is not honest: a value that came from the FlowDefinition or a role policy is recorded as a CLI override.

#### 3. Config / env / directory / binary dependency table

| Dependency | Where dispatch reads it | `fgos setup` config-merge default | `fgos doctor` check | Notes |
|---|---|---|---|---|
| `runner.executors` | `config.mjs:387-1076` validators; `validateRunnerConfigShape` `:1344` | `registrations.mjs:1819-1828` (`key:'runner'`, `executors.openai` only) | `runner` (config default), `executor-profile-warnings`, `herdr-executor-kinds`, `executor-confinement` | single validator, no drift |
| `runner.capabilities` | `config.mjs:1238` | `DEFAULT_CAPABILITY_SLOTS` `:1724` | `advise-execute-capabilities-configured` | ok |
| `runner.placementPolicy` | `config.mjs:1180` | not defaulted | none (implicit via `runner` shape) | gap: no doctor check names placement |
| `runner.modelPolicies` | `config.mjs:1309` | `:1823-1826` | — | ok |
| `runner.confinement` / `confinementPolicies` | `config.mjs:89`, `confinement/policies.mjs:245,340,385,548` | — | `confinement-policies-declared`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-strict-readiness`, `confinement-herdr-maturity`, `bwrap-available` | validator shared between config.mjs:43/58 and registrations.mjs:38 — one source |
| provider account inventory | `provider-capacity.mjs:61` (called from `config.mjs:1442`) | — | `provider-capacity-state` | ok |
| `~/.fgos/runtime/provider-capacity/{state.json,state.lock}` | `provider-capacity.mjs:33-41` | — | `provider-capacity-state` | hardcoded `os.homedir()`; no project-level override, no env var |
| `~/.fgos/confinement-backends.json` / `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH` | `backend-registry.mjs:188-189` | — | `confinement-backend-registry-readable` (imports registry module, so env honored) | ok |
| Attestation store `$XDG_STATE_HOME/fgos/attestations` or `~/.local/state/…` / `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH` | `attestation-store.mjs:154-160` | — | **none** (`grep -c attestation registrations.mjs` = 0) | gap: writable-dir/readability never diagnosed |
| `FGOS_HERDR_BIN` (default `herdr`) | `transport.mjs:800` | — | `herdr-available` uses literal `'herdr'` (`registrations.mjs:3535`, `:3612`) | **drift**: doctor may report herdr OK while dispatch uses a different binary, or vice versa |
| `FGOS_HERDR_ANCHOR_PANE` | herdr adapter | — | none | undocumented in doctor |
| `FGOS_HERDR_MODEL` (herdr-plugin only) | `herdr-plugin/src/pick.rs:108` | — | none | host-layer model pin outside runner config |
| `HOME`, `USER`, `PATH`, `XDG_STATE_HOME` | worker-home, trust-store, attestation, `detectAssistantCli` (`config.mjs:162`) | — | `tool-registry-configured` covers PATH probes | ok |
| `bwrap` | `confinement/drivers/bwrap.mjs` | — | `bwrap-available`, `confinement-bwrap-platform` | ok |
| provider CLIs `claude/codex/gemini/agy` | `transport.mjs`, `provider-adapter.mjs`, `config.mjs:162` | `executors.openai` (pi) | `agy-permissions-configured`, `agy-sub-homes-configured`, `claude-plugin-marketplace` | no generic "declared executor command resolvable" check beyond `executor-profile-warnings` (which warned on `gitnexus` in every probe below) |
| Gateway URL | http adapter reads `invocation.url` per executor (`transport.mjs:242,682-688`) | `gateway` config default | `gateway-token-configured` | ok |
| `dispatch.mjs decide` PreToolUse hook | `.claude/settings.json` | — | `dispatch-decide-hook-wired` (`registrations.mjs:1051`) | ok |

Precedence: `loadRunnerConfigFromDir` (`config.mjs:262-277`) reads the shared project file then `mergeWithGlobalConfig` (`:275`), project over global; `ensureRunnerConfigForDir` (`:315-345`) validates the same shape. Validation is in ONE place (`validateRunnerConfigShape`), called at `:131`, `:277`, `:345`; no second schema in setup or coordination for these keys (coordination has its own `runner-coordination-orgPolicy-shape`). Hardcoded install-level assumptions: provider-capacity runtime dir and attestation store are global-only (`os.homedir()`), never project-scoped, which contradicts "project config always overwrites global" for state dirs.

#### 4. CLI surface table

| Door | Registered in command-registry? | Selectors | Exit | Quoted message | Next action named? |
|---|---|---|---|---|---|
| `node src/runner/dispatch.mjs decide <executorId>` | **no** (only AGENTS.md prose) | positional, `--for`, `--work [--stage]`, `--assignment`, `--needs-soul`, `--has-live-task-access` | 0 | `{"mechanism":"out-of-process","configured":false}` for `nonexistent-executor` | no. `reasonCodes`/`blockedReason` from `plan.mjs:157-167,255-262` are dropped at `cli.mjs:1233-1240`; JSON cannot tell unregistered from governance-blocked. |
| `decide --for nonexistent-capability` | no | | 0 | `{"mechanism":"unavailable","configured":false}` | no |
| `decide --for x --needs-soul` | no | | 0 | `{"mechanism":"out-of-process","configured":false}` (pinned as intended by `dispatch.test.mjs:2581`) | same unregistered purpose flips answer on a caller self-declaration; a consumer reading only JSON cannot see why |
| `decide --work bogus-work-id` | no | | **1** | `no work item "bogus-work-id" found -- cannot resolve its dispatch executor.` | not-found is exit 1 here, exit 0 `unavailable` for `--for`; inconsistent |
| `decide` (no arg) | no | | 1 | usage line (`cli.mjs:1179`) | usage lists `decide --assignment`; the top-level usage (`node src/runner/dispatch.mjs`) omits it |
| `execute --for x` | no | refused | 1 | `execute --for is no longer supported -- resolve the purpose first (decide --for <purpose>) …` (`cli.mjs:1484`); commit `223086d7` confirmed | yes |
| `execute` flags | no | `--cwd` ∥ `--dir` (aliases, `cli.mjs:1508,1590`), `--repo-root`, `--assignment` ∥ `--contract` (mutually exclusive), `--model/--tier/--executor/--carries/--prompt` | 0/1 | | `--cwd`/`--dir` both mean worker cwd; in `bin/fgos.mjs` `--dir` means the `.fgos` dir and `--cwd` means lock target (`bin/fgos.mjs:2933,2963`). Same flag, three meanings across two binaries. |
| `fgos dispatch` (no sub) | yes | | 4 | `dispatch requires a sub-verb: fgos dispatch <show-run|inspect|watch|recover|reconcile>` | yes |
| `fgos dispatch --help` | yes | | 0 | shows `positional: sub` only although registry declares `positional: ['sub','run-id']` (`command-registry.mjs:819`) | partial |
| `fgos dispatch inspect --run bogus` | yes | `--run`, `--assignment`, `--cwd`, `--provider-capacity` | **0** | envelope `inspectionStatus:"not-found"`, `reconciliation.reason:"No matching Run was found…"` | consumer must parse `data.inspectionStatus`; a not-found is exit 0 while `show-run bogus` is exit 1 |
| `fgos dispatch show-run bogus` | yes | positional or `--run-id` (NOT `--run`) | 1 | stderr `no run "bogus" under /home/vantt/projects/forgentX` — no envelope, generic exit 1 (io-contract says 2 precondition / 4 validation) | no |
| `fgos dispatch show-run --run bogus` | | | 4 | `dispatch show-run requires a runId: fgos dispatch show-run <runId>` | misleading: the id WAS given, in the selector the sibling verb accepts |
| `fgos dispatch recover --run bogus` / `watch --run bogus` | | positional or `--run-id` | 4 | same shape | same |
| `fgos dispatch reconcile --run bogus` | yes | `--action`, `--run`, `--assignment`, `--cwd` | 0 | envelope `{"outcome":"blocked","reason":"no cwd lock exists"}` | **silent**: without `--action`, `planReconciliation` defaults to `clear-cwd-lock` (`reconciliation-planner.mjs:263`) and ignores `--run`; the operator asked about a run and got a lock answer |
| `fgos dispatch decide --for x` / `fgos dispatch execute --for x` | not sub-verbs | | 4 | `dispatch decide requires a runId: fgos dispatch decide <runId>` | wrong: `requireField(runId)` at `bin/fgos.mjs:2982` runs before the unknown-sub throw at `:3031`, so an unknown sub-verb is reported as a missing runId |

Distinguishability verdict (operator, from JSON/exit code only):
- unavailable vs governance-blocked: `decide` JSON — **not distinguishable** (`blockedReason` dropped; `configured` differs only sometimes).
- confinement-refused: only via `execute` throw `errorClass: invalid-config|confinement-unsupported` on stderr (prod-call-sites test 228-245, 500-525) — exit 1, not a categorised io-contract code.
- runtime-unknown vs recovery-eligible: `inspect` gives `inspectionStatus`/`reconciliation.state`; `recover` (no `--action`) gives a recommendation — distinguishable, but both via bespoke `data` fields, never exit code.
- io-contract (`docs/io-contract.md:60,73-78`): "errors are not enveloped; consumers branch on categorised exit code, never message". `dispatch show-run` not-found → exit 1 (uncategorised); `dispatch inspect` not-found → exit 0 envelope; `decide` errors → exit 1 plain text, never enveloped even on success (raw JSON, no `fgos.v1`). The `decide`/`execute`/`log` surface is outside the envelope contract entirely.
- Registry metadata: `dispatch` has `touchesState:false, externalEffect:false` (`command-registry.mjs:835-843`) although `reconcile apply` and `recover --action` write (only run-dir files, argued at `:836-841`; defensible) — but `--cwd` is described as `"inspect" only` (`:801`) while `bin/fgos.mjs:2963` also uses it for `reconcile plan`.

#### 5. Findings by severity

##### F1 — Cross-boundary error-class contract broken: session-engine unlinks `dispatch.claim` on post-admission `RunnerConfigError`
- **Severity:** High
- **Evidence:** `session-engine.mjs:385-397` (doc comment "every RunnerConfigError throw site … before `fs.mkdirSync(runDir)`") and `:440-446` `if (err instanceof RunnerConfigError) fs.unlinkSync(dispatchClaimPath)`; same at `:4810-4816` (`retryClaimPath`). But `assignment-runner.mjs` throws `RunnerConfigError` AFTER `admitRunAttempt` (`:1556`) at `:1957` (could not acquire run control), `:2293`, `:2411`, `:2712` (control token no longer current), `:2762`, `:2858` (settle helpers).
- **Actual problem:** Dispatch's error class conflates "bad input, nothing happened" with "lost the controller race / superseded mid-flight". Coordination consumes it as the former.
- **Failure scenario:** Controller A admits attempt N (run.json `running`) then loses control at `:1957` or `:2293` because `fgos dispatch recover --action resume-driver` (or a second controller) took over. A's throw removes `dispatch.claim`. A third `createAndExecuteSessionTask` finds no claim, `findLatestRunResult` (`:293-317`) returns null because N is unsettled, and re-dispatches attempt N+1 while N is live under another controller: two live attempts for one Assignment, exactly what the claim exists to prevent.
- **Boundary:** Coordination → Dispatch (error-class contract).
- **Why tests miss:** `coordination-session-engine.test.mjs:316-353` only proves the pre-spawn (governance-blocked) case; no test throws a post-admission RunnerConfigError through executeAssignment into the engine.
- **Smallest fix:** Dispatch: throw a distinct class (or `err.phase = 'post-admission'`) at the six post-admission sites; session-engine: unlink only when `err.phase !== 'post-admission'` (or when no `runs/<n>/run.json` was created since the claim). Add the missing test.
- **Priority:** P1

##### F2 — Dispatch CLI drives the Work lifecycle itself (`pick`/`return` via subprocess)
- **Severity:** High (boundary), Medium (runtime risk)
- **Evidence:** `dispatch/cli.mjs:1248-1360` `fanoutBatchExecutorCli`: `listWork` + `hasWorkerSlotRoom` (`:1261-1262`), `execFgos(['pick', …])` (`:1307`), `execFgos(['return', …, '--worker-verified-sha'])` (`:1342`). Platform dispatch-control-plane.md §Component-Internal Ownership: "no `Work` lifecycle mutation".
- **Actual problem:** Classification: **boundary violation by placement** (host-layer composition inside the Dispatch file), not a semantic break — the mutation is done through the public `fgos pick/return` doors, so Work truth is not corrupted. But Dispatch now (a) has the Work Driver's occupancy decision (`OccupancyPort`, boundary-map l.496), (b) enters a process-level cycle Dispatch→Host→Work→Dispatch, (c) hardcodes the executing-stage prompt (`buildPrompt(workItem)` `:1327`), (d) is untestable without the whole CLI. `dispatch-reconciliation-import-graph.test.mjs` cannot see this cycle because it is a subprocess, not an import.
- **Failure scenario:** any change to `pick`/`return` envelope shape (already bitten once: `:1311-1314` comment "data.worktree.path is the real shape") breaks fanout silently; a `pick` that succeeds but `executeExecutorCli` throws leaves the item claimed with no `return` (catch at `:1353` only reports).
- **Boundary:** Dispatch ↔ Work Lifecycle / Work Driver.
- **Why tests miss:** `dispatch.test.mjs:5626` proves the happy path end-to-end; nothing asserts the boundary (that dispatch never calls Work verbs).
- **Smallest fix:** move `fanoutBatchExecutorCli` to the Work Driver layer (`src/runner/loop.mjs` neighbourhood or `src/verbs/state/`), keep `compileDispatchPlan` + `executeExecutorCli` as the only Dispatch calls; add a grep-level test that `src/runner/dispatch/**` never references `'pick'`/`'return'` verbs or `appendEvent`.
- **Priority:** P2

##### F3 — Dispatch writes to the Work event log (`executor.dispatch` events)
- **Severity:** Medium
- **Evidence:** `cli.mjs:25` `appendEvent`, `logExecutorDispatch` `:520-522`, `log` subcommand `:1847`; consumer `src/report/dispatch-confidence.mjs:13` reads it back via `readAllEventsFromDir`.
- **Actual problem:** Dispatch has a write path into L3 truth (JSONL event log) that is neither an Assignment run dir nor a Run ledger. The docs list "no Work lifecycle mutation" but not "no Work event-log append"; today it is an observability line, but it makes the Evaluator depend on the Work log for dispatch facts instead of on `run.json`/`result.json`.
- **Failure scenario:** Work-independent tracks (`fgos-plan-loop`, standalone Runs) never emit this event, so `classifyDispatchConfidence` has no data for them — evaluator coverage silently differs by caller.
- **Boundary:** Dispatch → Work state (write), Evaluator → Work state (read).
- **Why tests miss:** tests assert the event is written, not that it is the only record.
- **Smallest fix:** document the exception explicitly in dispatch-control-plane.md, or route the fact through the run dir and have the evaluator read run dirs. No behaviour change required now.
- **Priority:** P3

##### F4 — `cliOverride` is a misnomer for the composed policy stack; provenance partial
- **Severity:** Medium (auditability)
- **Evidence:** `session-engine.mjs:2886-2904` (7 scopes → `cliOverride`), `assignment-policy.mjs:188,204,301` (provenance honoured for tier/persona/executor only), `:246,289` (`mode`, `reasoningEffort` stamped `{scope:'cliOverride'}` regardless of origin).
- **Actual problem:** An operator reading a Run's `policy provenance` sees "cliOverride" for a value that came from the FlowDefinition or role policy. The advisory (§12) says Dispatch must be "the final egress/policy gate" — it cannot audit what it cannot attribute.
- **Failure scenario:** a role policy sets `mode: read-only`; the recorded provenance says a human CLI flag did; a post-incident review blames the wrong layer.
- **Boundary:** Coordination → Dispatch (policy input contract).
- **Why tests miss:** `policyProvenance` tests cover tier/persona/executor only.
- **Smallest fix:** rename the parameter to `policyInputs` (keep `cliOverride` as an alias for one release) and extend `policyProvenance` to every field the stack can set.
- **Priority:** P3

##### F5 — `decide` drops `reasonCodes`/`blockedReason`; unavailable-vs-blocked indistinguishable
- **Severity:** Medium (operability)
- **Evidence:** `plan.mjs:157-167,255-262` vs `cli.mjs:1233-1240`; probes §4.
- **Smallest fix:** include `reasonCodes` and `blockedReason` (when set) in the JSON; additive, no consumer breaks. Add a test asserting the governance-blocked JSON differs from the unregistered JSON.
- **Priority:** P2

##### F6 — `fgos dispatch` selector and exit-code inconsistencies
- **Severity:** Medium (operability)
- **Evidence:** §4 rows (inspect `--run` vs show-run `--run-id`; not-found exit 0 vs 1 vs 4; unknown sub reported as missing runId `bin/fgos.mjs:2982` before `:3031`; `reconcile --run X` silently answers about the cwd lock `reconciliation-planner.mjs:263`).
- **Smallest fix:** (a) move the unknown-sub throw above the `requireField(runId)`; (b) accept `--run` as an alias of `--run-id` on show-run/watch/recover; (c) `reconcile plan` with `--run`/`--assignment` but no `--action` → validation error (exit 4) naming the action; (d) map not-found to one categorised code (io-contract has no not-found code; pick `2 precondition` and say so in io-contract.md).
- **Priority:** P2

##### F7 — `decide`/`execute`/`log` are an unregistered CLI surface outside the envelope contract
- **Severity:** Medium (contract)
- **Evidence:** no `decide`/`execute` entry in `command-registry.mjs` (grep empty); outputs raw JSON, errors exit 1 uncategorised; every invocation prints the `executor "gitnexus"` warning to stderr (executor-profile-warnings), including a hook-driven `decide` on every Agent/Task call.
- **Actual problem:** AGENTS.md mandates this door for every dispatch decision, but it is invisible to `fgos --help`, `command-routes-drift`, and io-contract consumers. `execute --contract` and `--assignment` doors are the same.
- **Smallest fix:** register `fgos dispatch decide|execute|log` in the registry delegating to `runDispatchCli`, wrap success in `fgos.v1`; keep `node src/runner/dispatch.mjs` as a compatibility alias. Suppress profile warnings on `decide` unless `--verbose`.
- **Priority:** P3

##### F8 — Doctor/setup registration gaps for dispatch dependencies
- **Severity:** Medium
- **Evidence:** §3: attestation store dir unregistered; `herdr-available` probes literal `'herdr'` (`registrations.mjs:3535,3612`) while dispatch honours `FGOS_HERDR_BIN` (`transport.mjs:800`); `FGOS_HERDR_ANCHOR_PANE`, `FGOS_HERDR_MODEL` undiagnosed; provider-capacity runtime dir and attestation store are `os.homedir()`-only with no project override (contradicts AGENTS.md install/setup gate "project config always overwrites global").
- **Smallest fix:** one `confinement-attestation-store-writable` check; make `herdr-available` resolve the binary through the same `FGOS_HERDR_BIN ?? 'herdr'` helper; document the two global-only state dirs in `docs/specs/distribution.md` as deliberate.
- **Priority:** P3

##### F9 — Host-layer `claude` launcher with its own model policy (herdr-plugin)
- **Severity:** Low
- **Evidence:** `herdr-plugin/src/pick.rs:107-109,254-358`.
- **Actual problem:** driver sessions started from the dashboard use `FGOS_HERDR_MODEL`/`sonnet`, not `runner.executors`/placement policy. Not an Assignment dispatch, so not a control-plane bypass, but it is a second place executor+model is chosen.
- **Smallest fix:** note it in dispatch-control-plane.md §Component-Outer Boundary as a host convenience; optionally read the default from runner config.
- **Priority:** P4

##### F10 — Reverse imports contradicting the doc's own forbidden list
- **Severity:** Low (documentation honesty) / Medium (target architecture)
- **Evidence:** `cli.mjs:21-22`, `prepare.mjs:35`, `resolve.mjs:13` (workflow/stage/skill/task-spec lookup) vs platform dispatch-control-plane.md §Component-Internal Ownership "no workflow/stage/task/skill lookup"; `operation-choice.mjs:19-25` intake/worktree.
- **Smallest fix:** reword the forbidden list to "no NEW workflow/stage/skill lookup; existing `executorIdForWork`/`buildPrompt` lookups are Work-Driver compatibility code scheduled to move with operation-choice", or move `executorIdForWork`/`buildPrompt` out. Doc currently describes the target as if shipped.
- **Priority:** P3

#### 6. Doc corrections

| File | Section | Wrong → Right |
|---|---|---|
| `docs/platform/agent-coordination/architecture/dispatch-control-plane.md` **[uncommitted]** | §Source Inventory table (l.436-445) | omits `confinement/drivers/bwrap.mjs`, `confinement/probes/harness.mjs`, `src/runner/dispatch.mjs` (barrel + CLI entry), `src/verbs/dispatch/show-run.mjs`/`watch.mjs` are named in prose but check the row; add them. Add `src/report/dispatch-confidence.mjs` as the Evaluator consumer, outside the component. |
| same | §Component-Internal Ownership forbidden list (l.276-289) | "no `Work` lifecycle mutation" / "no workflow/stage/task/skill lookup" stated as current → mark as target; cite `cli.mjs:1307,1342` and `cli.mjs:21-22` as known exceptions pending relocation (F2, F10). |
| same | l.333-337 operation-choice note | says it "may not become a second DispatchPlan compiler" — true, but it already calls `executeAssignment` directly (`operation-choice.mjs:22`, callers `:2211`); say so. |
| `docs/platform/agent-coordination/README.md` **[uncommitted]** | Mermaid `Session --> Assignment --> Dispatch --> Runtime --> Result` and "sibling authority" text | Evaluator drawn as a sibling box, but `run-result.mjs`/`result-ladder.mjs` live inside `src/runner/dispatch/` and the only outside evaluator (`src/report/dispatch-confidence.mjs`) reads the Work event log. Label the box "target authority; today implemented inside dispatch/" |
| `docs/platform/agent-coordination/subcomponents/README.md` **[uncommitted]** | Dispatch Control row (l.31) | links the architect copy as "legacy" while `docs/platform/component-boundary.md:64` links the architect copy as canonical. Pick one; the architect file carries a migration banner (l.3-6) saying the platform copy is the target. |
| `docs/platform/component-boundary.md` | l.64 | link → `docs/platform/agent-coordination/architecture/dispatch-control-plane.md` |
| `docs/architect/proposals/component-authority-boundary-map.md` | §6 row "Dispatch And Execution Engine" (l.192) | "Owns exactly two routing identities" is accurate for `plan.mjs`; add that `decide --needs-soul` and `--work` are two further *selectors* (not identities) that change the answer for the same unregistered target (§4). |
| same | §9 `OccupancyPort` (l.496) "Check claims, worker slots… before dispatch" owned by Work Driver | today `hasWorkerSlotRoom` is called inside Dispatch (`cli.mjs:1261`); note as placement debt. |
| `docs/architect/component-boundary/component-boundary-advisory.md` | §12 "Dispatch should not … move Work lifecycle" | add pointer to F2 as the current exception; §7 contract table row "Dispatch Control Plane" says "Routes on exactly two identities" — fine. |
| `docs/architect/agent-coordination/contracts/assignment-run-runresult.md` | l.110-115 "Atomic admission and crash durability … and the per-Run controller lock are not implemented" | contradicted by `run-lock.mjs` + `admitRunAttempt` (`assignment-runner.mjs:938-1000`, control acquire `:1940-1962`, fencing `:2293,2411,2712`) and by `runtime-recovery-design.md:233` "S1 **Implemented** — P01 (`run-lock.mjs`)". Correct to: "implemented in Node (`run-lock.mjs`); strict retry-id fencing is opt-in via `retryId` (`assignment-runner.mjs:947-961`); `bound`/`delivered` phases and standalone supersession event remain unimplemented". |
| `docs/specs/runner.md` | RUL68 (l.1037-1044) | accurate on `execute --for` retirement; add that `executeExecutorCli`'s internal `purpose` parameter still exists (`cli.mjs:680-716`) so library callers can still use the purpose door. |
| `src/cli/command-registry.mjs` (self-describing doc) | dispatch `cwd` param (l.801) `"inspect" only` | also `reconcile plan` clear-cwd-lock target (`bin/fgos.mjs:2963`). `--help` renders `positional: sub` only; registry says `['sub','run-id']`. |
| `AGENTS.md` §Dispatch | result shape | accurate: `mechanism`, `configured`, `agentType` xor `mcpTool` (`cli.mjs:1233-1240`), plus `executorId` when resolved indirectly (`:1240`) — AGENTS.md does not mention `executorId`; add it. Example `decide --for judge` returns `unavailable` in this repo (no `judge` capability in `.fgos/config.json`); pick a configured example (`advise`, `execute`). Says an unknown name answers "from the default" → correct only for `decide <executorId>`/`--needs-soul`; `--for` without `--needs-soul` answers `unavailable` (§4). |

#### 7. Test gaps

1. No test throws a post-admission `RunnerConfigError` (control-lost / stale token) through `executeAssignment` into `createAndExecuteSessionTask` and asserts `dispatch.claim` survives (F1). Only `coordination-session-engine.test.mjs:316`.
2. No import/graph test asserts `src/runner/dispatch/**` never invokes Work verbs (`pick`/`return`) or `appendEvent`; `dispatch-reconciliation-import-graph.test.mjs` is scoped to reconcile only (F2/F3).
3. `decide` JSON: no test that governance-blocked output differs from unregistered output (`blockedReason` has 1 test file, but on plan objects not CLI output) (F5).
4. `bin/fgos.mjs dispatch`: 0 tests for `unknown dispatch sub-verb`, `requires a runId`, `no cwd lock exists` (grep) — the misleading messages in §4 are unpinned (F6).
5. `dispatch-production-call-sites.test.mjs` covers `spawnWorker`/`executeExecutorCli` but not `fanoutBatchExecutorCli` from a config file, nor `dispatchDeclaredOperation` → adapter (the third production call site).
6. `policyProvenance`: no test for `mode`/`minRigor`/`reasoningEffort`/`fallbackExecutors` provenance when set by definition/role scope (F4).
7. Doctor: no test that `herdr-available` and the herdr adapter resolve the same binary under `FGOS_HERDR_BIN` (F8); no attestation-store check to test.
