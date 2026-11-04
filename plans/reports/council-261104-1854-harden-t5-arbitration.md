# HARDEN T5 arbitration: Execution Core, Dispatch and Confinement, Seat Binding, Run Result

- **Big lead:** lead:HARDEN, 2026-11-04 (Asia/Saigon), fg-server2, main `06e031923` (no layer file differs from the seats' `af19e6de6`/`c129461af`/`26c652965`).
- **Inputs:** [baseline](research-261104-1755-harden-t5-baseline.md); seats [correctness](council-261104-1840-harden-t5-seat-correctness.md), [speed](council-261104-1840-harden-t5-seat-speed.md), [simplicity](council-261104-1840-harden-t5-seat-simplicity.md), [red-team](council-261104-1840-harden-t5-seat-redteam.md); [phase file](../261021-1118-harden-low-layers-bottom-up/phase-06-t5-execution-core-dispatch-seat-run-result.md) received items.
- **Status:** arbitration done; owner ask 1 in §6. Only the two in-flight fixes below move before the owner answers.
- **Fixing now (not re-planned here):** red-team R-1 (Critical, credential write-back takes its target from the in-home marker) on `harden/fix-writeback-authority`; the undeclared `role` at `src/runner/execution/run.mjs:1243` (correctness B-3, simplicity finding 1) on `harden/fix-native-baseline-refusal`. Both branches exist locally.

## 1. Verdict in one paragraph

The layer has the right split of authority: Seat Binding decides in Rust behind a thin fail-closed client, the supervisor (T4) owns the attempt, and Node keeps flow. No seat found a fault in the Rust crates. The size problem is Node that never shed anything: two giant functions (`executeAssignment` 1 135 lines, `runUnitBody` 1 018), 503 lines of dead confinement doors plus 227 lines of dead modules, a shadow binder that always loses, a config validator that repeats the schema, two outcome derivations, and about 190 Node tests restating the Rust seat golden set. The safety problem is narrower but real: one Critical (in flight), a lost update on the operator's `~/.claude.json`, a fail-open `pass`, a pulled project config that can switch off confinement, host reads of agent-writable files that block on a FIFO, and confined workers that can read every login on the machine. Every accepted fix reuses a door that exists. Net: Node about −2 450 to −2 850, Rust 0, tests about −1 800 to −2 100 (§5).

## 2. Part A: target shapes (for owner approval)

**Execution Core** (`src/runner/execution`, `runUnit`, `bind()` facade, Pattern, seat resolver).
- **Authority:** how a Unit runs: admit, bind each seat through the Rust route, hand each attempt to the supervisor, commit declared writes, settle the unit record. Flow, not a decision: no Rust move.
- **Contract and ports:** `runUnit(options)`, `CaseAdmissionPort`, seat route (protocol 1), supervisor envelope, Git native door, durable-file door (`publishMutableProjection`/`publishImmutableProof` in `proof-helpers.mjs`).
- **Shape:** `runUnitBody` splits along its real seams into `loadResumedUnit`, `admitFreshUnit`, `runRole` (`bindSeat`, `finishPendingCommit`, `runAttempt`) and a pure `answerProviderLimit(result, bound, attempts, rotation, baseline) → stop | rebind | walk`; builders go to the files that own the concept (`assignment.mjs`, `commit-unit-work.mjs`). One `askFor(seat, ledger)` serves the run and the dry bind.
- **Node budget:** `src/runner/execution` ≤ 7 000 lines (from 7 670); `run.mjs` ≤ 1 150 (from 1 629); no function over 300 lines.

**Dispatch** (`src/runner/dispatch` outside `confinement/`).
- **Authority:** one Assignment becomes one supervised attempt: plan, lease, prompt, confinement request, envelope, hand-off; read-only inspection and recovery recommendations.
- **Shape:** `executeAssignment` becomes `loadImmutableAssignment`, `leaseAccountForAttempt`, `settleRefusedLease` (in `settlement.mjs`), `buildLaunch`, `awaitBinding`, over one `attempt` object that the `finally` reads. `admitRunAttempt` moves to its own module. Config: Node keeps cross-field rules only; type, enum, range and required rules live in `core/config-schema/runner.schema.yaml` (CFG reviews). Every host read of an agent-writable or pulled file goes through `readAgentFileSync` (no-follow, non-blocking, regular file, capped), the T3/T4 hostile-input rule, now stated once in the runner spec.
- **Node budget:** ≤ 19 000 lines (from 21 133); `assignment-runner.mjs` ≤ 1 500 with `executeAssignment` ≤ 300; `config.mjs` ≤ 1 300 (from 2 105; sized function by function in the sub-plan); the `dispatch.mjs` barrel gone.

**Confinement** (`src/runner/dispatch/confinement`, own spec).
- **Authority:** which sandbox a launch gets, the private home, attestation, and (after R-1) a write-back whose target comes only from the host-only finalization descriptor under `runDir/protected`.
- **One door:** `prepareConfinementForLaunch` then `finalizeAttemptHome`; `executeThroughConfinement` and `finalizeConfinementResources` go, their 39–46 test calls re-homed.
- **Node budget:** ≤ 5 950 lines (from 6 455).

**Seat Binding** (`packages/seat-binding/rust`, Node client + facade).
- **Authority:** executor, invocation, model, effort, tier and account for one seat. Rust 2 551 lines unchanged; the golden set (82 cases) is the owning proof.
- **Node:** client 173 stays; `bind.mjs` ≤ 520 (from 563); Node seat tests keep only what the facade adds (executor facts, account view, refusal mapping, herdr transport choice): about 64 → 20 in `bind.test.mjs`, cases missing from golden move into golden.

**Run Result** (Node writer and validator, Rust metrics reader).
- **Authority (decided: §3 row B-9, §4 first bullet):** Node derives the outcome at write time and writes it in `classification.outcome`; Rust re-derives only for records without one. One vector file (`test/fixtures/run-outcome/legacy-derivation.json`) proves both sides on the same rows, including rule 0 and the no-classification rows.
- **One written version:** V3 from both paths (lease refusal included); V4 validator, normalizer and constant go; V2/V3 readers stay for old records.
- **Node budget:** `run-result.mjs` ≤ 1 150 (from 1 396). Rust 1 139 unchanged.

**Doctor rows kept (gate 8, no condition lost):** `seat-binding-route`; `seat-binding-dry-bind` (absorbs `executor-posture-coverage`, same three outcomes and messages, one bind pass); `blind-steps-use-proven-pools` (fixed family derivation, no chain walk); `dispatch-decide-hook-wired`; `bwrap-available`; `provider-capacity-state`; the `confinement-*` rows; `credential-copies-retained` (also counts a v2 home whose run has neither envelope nor intent, R-6); `run-attempts-stuck` (T4); `herdr-executor-kinds`; `executor-*` rows. `shadow-binder-divergence` goes with the shadow binder. Shape-only runner rows become config schema findings only where CFG agrees; the row id may change, the condition may not.

**Received items, settled:**
- **D-T2-7 grace rule:** `herdr-deadlines.mjs` goes; `READY_TIMEOUT_MS` is inlined in its one consumer `src/setup/terminal-control-checks.mjs` (simplicity; correctness agreed on deleting the file).
- **`herdrSpawnAdapter`:** the registration stays (verified: `settle-attempt.mjs:235` and `blind-steps-proven-pools.mjs:44` resolve `herdr-spawn` by name, and its `locus` is read); the body shrinks to the one refusal. Correctness's full delete is rejected on that evidence.
- **H-T4e `cliSpawnAdapter` short calls:** no change in T5. Probes, judges and the goal check run unconfined with real logins by design (red-team: no finding); `resolveWorkerArtifactPath` stays with it. Closed, not an owner question.
- **H-T4f + R-6:** pane allocation and attempt-home creation both happen before the envelope; one order change in `buildLaunch` releases both on the failure path, and adopt of an intent-only attempt releases the pane by key.
- **O-1:** `process-identity.mjs` moves to `src/native/` with all importers in one change (spec Process Facts row updated). **O-2:** each of the leaf modules T4 imports (`run-lock`, `cwd-lock`, `proof-helpers`, `dispatch-error`, `stray-writes`, `worker-artifacts`, `trust-store`) moves below both layers when it imports nothing else from `src/runner/dispatch`; the sub-plan lists each with its destination.

## 3. Part B: accepted findings

Checked on current main by the arbiter (file:line opened): B-2, B-3, B-6, B-7, B-12 loop, B-13 (no `dispatch.claim` writer in `src`/`bin`), R-1 site (`authority.mjs:1834-1843`, `provider-credential-renewal.mjs:1168-1176`), R-2/B-1 (`trust-store.mjs:77-101,198-238`), R-3 (`runner.schema.yaml:9,158,422,690` all `x-fgos-scope: both`), R-4 (`trust-store.mjs:173-176`), R-5 (`bwrap.mjs:558`, `resources.mjs:92-99`, spec non-goal `agent-confinement/spec.md:120`), S-1 (`bind.mjs:545-561`), S-2 (`runtime-inspection.mjs:79,275`), dead doors (only `dispatch.mjs:46` and the census row reference them), shadow binder (`transport.mjs:206-231`), addon crates (`packages/git/node-addon/Cargo.toml` links `fgos-config` but not `run-result`).

| Id(s) | Sev | Repro | Fix (reused door) | Owner of file |
|---|---|---|---|---|
| R-1 | Crit | yes (red-team) | **Fixing now**, `harden/fix-writeback-authority` | T5 |
| B-3 | Med | read, arbiter confirmed | **Fixing now**, `harden/fix-native-baseline-refusal` (`...seatTag`, one owning test) | T5 |
| R-2 = B-1 = H-T4c | High | yes, 297 of 400 seeds lost | Shape is owner Q1; whichever option, the write keeps the operator's other keys and resolves `realpath` first (B-4); backlog row added | T5 (+ T4 `cleanup-trust.mjs`) |
| B-2 | High | yes; arbiter confirmed `unit-run-history.mjs:22-25` (no classification → `ok` → `pass`) | Default to `deriveOutcome(interpretRunResult(r).classification)`; an uninterpretable result is `execution-failure`; v1 and empty-object rows join the shared fixture | T5 |
| R-3 | High | config layer yes | Shape is owner Q2; attach to `p-8da4b370` | CFG schema + T5 |
| R-5 | High | yes, real-home confined read | Owner Q3 (non-goal versus mask) | T5 confinement |
| S-1 | High | yes, 460 discarded spawns | `explainSeat(..., { chain: false })` for `blind-steps-proven-pools.mjs:80`; the walk stays for `dispatch explain`. 559 → about 155 spawns per doctor | T5 |
| S-2 | High | yes, 4 reads × 370 files | One `result(l)` per run in a `Map`; inspect `--cwd` about 2.0 → 0.5 s in-process | T5 |
| Simpl. 2 (dead) | High | read, arbiter confirmed | Delete `executeThroughConfinement`, `finalizeConfinementResources`, facade export, census row, 3 architecture rows (re-home tests on `prepareConfinementForLaunch`); `dispatch/prepare.mjs`; `dispatch/recovery.mjs` + `dispatch-effect-guarantee.test.mjs`; `validatePlacementPolicyShape` (unreachable); `loadRunnerConfig`; the 11 unused exports | T5 |
| Simpl. 1 (giants) | High | read | Cuts of §2; duplicates removed while cutting (4× "from" object, 3 bind-walk blocks, no-op `catch (err) { throw err; }` at `assignment-runner.mjs:1893,1968`, plan/phase labels in comments per the Stable Code Artifacts rule) | T5 |
| R-4 | Med | yes, FIFO blocks > 5 s | `.mcp.json`, `.codex/hooks.json`, the marker and the credential copy read through `readAgentFileSync` with a cap | T5 |
| B-5 | Med | yes | `codexSectionPattern` ends at the next header line, not the first `[`; `removeAgyTrust` reports a write failure instead of `already-gone`; the seeded TOML key is escaped | T5 |
| B-6 | Med | yes; arbiter confirmed two derivations | The doctor row imports `getProviderFamily`; second derivation deleted | T5 (`src/setup`) |
| B-7 | Med | measured, 636 entries | `reclaimDeadLeases` drops an `assignments` entry once its attempt is closed | T5 |
| B-8 | Med | no (needs herdr) | Memoise the pending boot per session name; cross-process case under the existing holder-lock door | T5 |
| B-9 = Simpl. 3 | Med | read | Run Result authority as in §2; V3 only, V4 gone | T5 |
| B-10 | Med | no | Audit when the provider state record names a lease, not when the worker-reachable receipt file exists; unreadable file = mismatch | T5 |
| B-11 | Med | read | Account inventory read per bind (a few ms), comment at `run.mjs:169` stays true | T5 |
| B-12 | Med | no (addon); loop confirmed `run-lock.mjs:162-178` | A generation name that exists counts as taken; an unreadable record refuses by name | T5 |
| B-13 | Med | read; no writer of `dispatch.claim` | Delete `resume-driver`/`reassign-driver`, the claim unlink, the three `60000` constants; adopt covers every attempt with an envelope. CHANGELOG line (visible `recover` intents go) | T5 |
| Simpl. 5 = O-5 | Med | read | Delete shadow binder (`provider-adapter.mjs` classes, `resolveVerifiedProviderArgs`, `recordShadowBinderDivergence`, `transport.mjs:206-231`), doctor row, shadow tests; close `tsk-p7-shadow-binders` | T5 |
| Simpl. 5 dry-bind ask | Med | no | One `askFor` shared with `run.mjs` (adds symmetric independence to the dry bind) | T5 |
| Simpl. 6 = O-3 = B-19 | Med | read | Ten hand-rolled temp-and-rename sites (incl. first `unit.json` write at `run.mjs:940`) use `publishMutableProjection` | T5 |
| Simpl. 7 | Med | estimate | Type rules move to the runner schema; each removed Node check names its schema rule; `confinement` gains `additionalProperties: false`; CFG reviews | T5 + CFG |
| Simpl. 8 = H-T4d | Med | read | Now: the two probes import one quota list. Text judge (`provider-capacity.mjs:970-1012`, `AUTH_ANCHOR_PATTERNS`) deleted only when agent-protocol vectors show a typed `stopCause` for every executor's exits; the sub-plan checks, else it stays and is recorded | T5 |
| Simpl. 4 = O-1/O-2 | Med | read | §2 received items | T5 |
| R-6 + H-T4f | Med | no | §2 received items; owning test "a refused pre-handover launch leaves no attempt home and no pane" | T5 |
| R-7 | Low | read | Claim presence via the protocol's newest-result rule (unifies `herdr-round.mjs:351-361`, `worker-artifacts.mjs:39-60`, `settle-attempt.mjs:114-121`: no symlink, no leading zero); temp-root check uses `lstat`; spec §9.3 names abstract sockets and localhost as unmasked | T5 |
| B-14..B-18 | Low | read | Per-directory catch in `readUnitRunSeats`; terminal control built inside the `try` that abandons; anchored staging match; client re-resolves the host on `ENOENT`; `BindBarrier.arrive()` from a top-level `finally` | T5 |
| Simpl. 9 + T2 §5(2) + H20 | Low | read | One "settled result is sound" predicate (`readSettledResult`); delete `lock-wait.mjs` and its test (constant stays where `merge.mjs:54` reads it); drop the name sniff at `settlement.mjs:759` (adapter required); delete `parseHerdrUsage` | T5 |
| `p-a189ff31` | — | yes (red-team) | Gateway token proven hidden by a confined read; record the evidence and close the row | — |
| Tests | — | — | Seat tests to facade wiring (−700 lines); failover decisions proven on the pure `answerProviderLimit` with 3 real-launch tests kept; pre-admission refusals of `run.test.mjs` in a file that never launches; `exec-budget` counted at the client call site; `failover-fixture.mjs:39` skip fails the gate when the platform claims bwrap | T5 |

## 4. Rejected or routed elsewhere (with source)

- **Outcome derivation moved to Rust through the addon** (simplicity option A): rejected as a fix. The addon (`packages/git/node-addon/Cargo.toml`) does not link `run-result`, so A adds a crate dependency and a binding; correctness B-9's single-writer rule plus shared vectors closes the divergence with no new door. Listed as addition A5.
- **Delete `herdrSpawnAdapter` outright** (correctness): rejected; its name and `locus` are read (§2).
- **`legacyPersonaProjection` delete** (`p-3e6b1a52`, correctness): held; it may serve the old records `legacy-seat-read.mjs` keeps by the SEAT-TRIM owner decision. The sub-plan checks its readers first.
- **Routed:** S-3 split of `run.test.mjs` and the failover file across files, and S-4 lighter staged test addon → TEST (S-4 joins ledger H13). S-6 `refreshAhead` on the launch path (unreproduced, behaviour change) → backlog row. `.fgos/assignments` retention (782 run dirs, inspect cost grows) → backlog row for Workflow, not T5. `src/event-store/native.mjs:32` regex → ES owner, note. Speed's "one step process per attempt" → T4 note only.

**Proposed additions (RUL104: not accepted, owner picks; none is counted in §5):**

| # | Addition | Problem and evidence | Benefit | Cost |
|---|---|---|---|---|
| A1 | `bind-many` route on seat-binding (simplicity 7.1, correctness P-2) | Doctor spawns 559 hosts; after S-1 about 155 remain (dry-bind 62, posture folded) | About 1–2 s more per doctor after S-1 | Rust +30–60, Node +15 |
| A2 | Injectable dispatch port for `runRole` (correctness P-1) | Seat-walk logic proven only by real launches (124 s + 140 s) | Milliseconds per case | Node +15; mostly covered by the accepted `answerProviderLimit` extraction |
| A3 | Architecture guard: `src/native`, `src/state`, `src/holder-lock`, `src/run-supervisor` never import `src/runner/dispatch` (simplicity 7.2) | Manifest gives all of them class `infra`; O-1/O-2 went unseen | Keeps the O-1/O-2 moves from regrowing | test +10 |
| A4 | No-undef pass in the gate (correctness P-3) | B-3 survived with no linter over 35 000 lines | Catches the class before runtime | script +40 |
| A5 | Run Result derivation in Rust through the addon (simplicity option A) | Two derivations | One owner in code | Rust +40, addon dependency; Node −180 |
| A6 | Network namespace unshare for read-only policies (red-team P-2) | Abstract sockets and localhost services reachable (R-7) | Closes what masks cannot | out of T5 scope |

## 5. Net size (HARDEN commits, estimate)

| | Node | Rust | Tests |
|---|---|---|---|
| Dead doors, modules, exports, unreachable validator | about −850 | 0 | −600 to −900 |
| Shadow binder and its row | about −385 | 0 | about −300 |
| Giant cuts, duplicates, history comments | about −480 | 0 | about −300 (rework) |
| Config type rules to schema | −500 to −900 | 0 (schema YAML +100) | about −200 |
| Run Result V3 only, dead exports | about −110 | 0 | +50 (vectors) |
| B-13 driver actions, small folds, wording list | about −290 | 0 | about −80 |
| Fixes added (B-2, B-5..B-12, R-4, R-6, R-7, S-1, S-2) | about +150 | 0 | about +250 |
| Seat tests to facade wiring | 0 | 0 (golden +0 to +100 JSON) | about −700 |
| **Accepted total** | **about −2 450 to −2 850** | **0** | **about −1 800 to −2 100** |
| Q1 (a) derived claude store / (b) lock | −40 / +30 | 0 / 0 | −60 / +40 |
| Q2 (a) global-only / (b) raise-only / (c) defer | 0 / +10 / 0 | +4 / +40 / 0 | +30 / +40 / 0 |
| Q3 (a) keep non-goal / (b) mask | 0 (spec +10) / +20 | 0 / 0 | 0 / +30 |

Layer total ≤ 0 in every answer combination.

## 6. Owner ask 1 (gửi anh)

Em gom năm câu; mỗi câu theo mẫu câu hỏi quyết định. Hai việc đang sửa (R-1 ghi đè login qua write-back, `role` chưa khai báo) không cần anh trả lời.

**Q1. Lưu trust của claude (`~/.claude.json`) bị mất khi nhiều seat chạy cùng lúc.**
- **Chuyện gì đang xảy ra:** mỗi pane claude không confined ghi một mục trust vào `~/.claude.json` của anh rồi xoá khi xong, bằng đọc-sửa-rename không khoá. Red-team cho 4 tiến trình ghi 400 mục: mất 297. Seat mất mục sẽ dừng ở hộp thoại trust (`needs-human`); panel chạy song song nên đây là trường hợp thường gặp.
- **Nguyên nhân:** em đã mở `trust-store.mjs:198-238`: không có khoá; claude CLI cũng tự ghi chính file đó nên khoá của fgOS không chặn được nó.
- **Các lựa chọn:** (a) pane claude dùng store riêng sinh ra cho attempt như codex; file của anh không bao giờ bị fgOS ghi; Node −40, test −60; cần đo một lần chạy claude thật. (b) giữ ghi chung, thêm khoá qua holder-lock và đọc lại trong khoá; Node +30, test +40; vẫn còn đua với chính claude.
- **Khuyến nghị:** (a): bỏ hẳn việc ghi vào file của anh thay vì khoá một nửa cuộc đua.
- **Phạm vi:** "có" cho phép đổi `herdr-round.mjs`, `trust-store.mjs`, `cleanup-trust.mjs` và test của chúng trong T5; không đổi cách codex/agy đang làm.

**Q2. Config project kéo về (pull) có thể tắt confinement và thay lệnh executor.**
- **Chuyện gì đang xảy ra:** một commit của đồng đội đặt `confinement.mode: unconfined` cho `code:review` và đổi lệnh claude thành `/bin/sh`; `loadRunnerConfigForDir` nhận cả hai (red-team chạy được).
- **Nguyên nhân:** em đã mở `runner.schema.yaml`: `executor`, `confinementPolicies`, `capabilityConfinement`, `executorEntry` đều `x-fgos-scope: both`, với lý do ghi sẵn "đọc từ main checkout tin cậy". Vậy đây là chủ ý cũ: tin mọi thứ đã vào main. Điều đó trái spec confinement §8.1 luật 3 ("không thành phần nào được hạ policy").
- **Các lựa chọn:** (a) các đường đó thành `global-only`; Rust +4, test +30; project không còn tự cấu hình executor được. (b) project chỉ được nâng confinement, lệnh/args thành global-only; Rust +40 (một luật merge mới trong config), test +40. (c) để nguyên, chờ `p-8da4b370` (duyệt config theo digest); 0 dòng bây giờ, lỗ vẫn mở.
- **Khuyến nghị:** (b) bây giờ, (c) sau: project vẫn siết được, chỉ không hạ được.
- **Phạm vi:** "có" cho phép đổi scope trong schema runner (CFG review) và test scope của config crate; không đụng digest approval của `p-8da4b370`.

**Q3. Worker confined đọc được mọi login trên máy.**
- **Chuyện gì đang xảy ra:** worker thuê account A vẫn đọc được `~/.claude/.credentials.json`, `~/.config/gh/hosts.yml`, `~/.ssh`, các home `~/.codex-*`, `~/.pi/accounts/*`, và mạng ra ngoài vẫn mở; chỉ `~/.fgos/private` bị giấu (red-team đọc thật, chỉ in mã có/không).
- **Nguyên nhân:** em đã mở `bwrap.mjs:558` (`--ro-bind / /`) và `resources.mjs:92-99` (danh sách che chỉ 6 mục). Spec `agent-confinement/spec.md:120` ghi rõ non-goal "không tuyên bố bwrap ngăn đọc secret", nhưng việc chép login vào home riêng lại ngầm giả định worker chỉ thấy login của nó.
- **Các lựa chọn:** (a) giữ non-goal, ghi rõ trong spec §9.3; 0 code. (b) che thêm các store mà inventory account và `credentialStore` của executor khai, qua cơ chế `MACHINE_PRIVATE_ROOTS` sẵn có; Node +20, test +30; seat nào đọc store tại chỗ phải dùng bản chép (đã hỗ trợ).
- **Khuyến nghị:** (b): rẻ, dùng đúng cửa có sẵn, khớp với giả định của home riêng. `gh` và `~/.ssh` không thuộc account nên vẫn đọc được; nếu anh muốn che cả hai thì nói thêm.
- **Phạm vi:** "có (b)" sửa non-goal §3.2 thành "chỉ login của chính attempt"; không gồm tách network namespace (A6).

**Q4. Duyệt hình dạng §2 và các addition §4.**
- **Chuyện gì đang xảy ra:** bốn seat đồng ý hướng chính: Rust giữ quyết định seat, Node giữ luồng nhưng cắt nhỏ; mỗi thành phần có ngân sách Node ở §2.
- **Nguyên nhân:** số dòng lấy từ baseline và seat simplicity; config −500 đến −900 còn là ước lượng, sub-plan đo từng hàm.
- **Các lựa chọn:** (a) duyệt §2 như viết, không lấy addition nào; (b) duyệt §2 và lấy thêm addition anh chọn (A1–A6, chi phí ở bảng §4); (c) sửa §2 ở điểm anh chỉ ra.
- **Khuyến nghị:** (a), có thể kèm A3 (10 dòng test giữ cho O-1/O-2 không mọc lại).
- **Phạm vi:** "có" ghi hình dạng vào spec runner, confinement, seat-binding và cho T5 sub-plan làm mục §3; addition nào không được chọn vẫn chờ trong danh sách RUL104 của plan.

**Q5. Giờ land.**
- **Chuyện gì đang xảy ra:** T5 sẽ land theo từng sub-phase như T4.
- **Nguyên nhân:** quyết định 59 (6a) chỉ áp cho T4.
- **Các lựa chọn:** (a) như T4: fg-server2 tự land từng sub-phase trong khung yên đã báo trên board; máy anh làm theo guide tiếng Việt vào giờ anh chọn. (b) chờ anh đặt giờ cho từng lần land.
- **Khuyến nghị:** (a).
- **Phạm vi:** chỉ giờ land của T5; thay đổi schema `~/.fgos/config.json` (nếu Q2 chọn) vẫn kích hoạt đồng loạt mọi máy.
