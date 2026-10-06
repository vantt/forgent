# Red-team: Failure Mode Analyst — track request-to-run (P1–P5 + umbrella)

- Ngày: 2026-10-01 · Nhánh đọc: `main` @ d340cc9af · Vai: FLOW TRACER (trace code path, không relitigate quyết định synthesis)
- Phạm vi: `plans/261001-0327-request-to-run-track/`, `-p1-execution-core/`, `-p2-runnable-plans/`, `-p3-workflow-separate-from-work/`, `-p4-discussion-patterns-engine-retirement/`, `-p5-terminology-sweep/`
- Mọi `file:line` dưới đây đã grep/sed trực tiếp trên `main` (hoặc `git show`/`git grep` trên nhánh T khi ghi rõ).

## Finding 1: Cổng ghi file Q9 — `provenance.binding` thay stamp không có cơ chế "hợp lệ", và engine bị khoá giữa phase 5 và phase 7

- **Severity:** Critical
- **Location:** Plan P1, Phase 5, section "Requirements — Cổng ghi file (Q9, supersede ADR-006 §6)"; Plan P1 `plan.md` section "Phases và song song" (sóng C → D)
- **Flaw:** Ba lỗ cùng một cổng.
  1. `bind()` là hàm thuần trả object thuần; bất kỳ caller nào (Lead, hook, test, agent) tự dựng được `provenance.binding`. Cổng hôm nay đã ghi rõ stamp là forgeable và vì thế **bắt buộc resolve stamp về một CoordinationProtocol thật trên đĩa + đúng version + operation `work-product`**. Plan thay bằng "có `provenance.binding` hợp lệ" nhưng không định nghĩa "hợp lệ" là gì (chữ ký? re-derive? ledger admission?). Mất tầng chứng minh thứ hai.
  2. Thứ tự sóng: phase 5 (sóng C) bỏ yêu cầu stamp; phase 7 (sóng D) mới gắn `provenance.binding` cho engine. Trong trạng thái "phase 5 đã merge vào nhánh plan, phase 7 chưa", mọi dispatch mutating của engine đi qua `session-engine.mjs:403` (in-process, không qua CLI) **không có** `provenance.binding` → bị từ chối, trái với tiêu chí phase 5 "Coordination engine còn chạy (test engine xanh)". Cách duy nhất để cả hai đúng là phase 5 giữ **hai cổng** (stamp HOẶC binding) — tức hai chủ cho một mối authority, trái "single path".
  3. Cổng hiện hành chỉ áp cho `provenance.kind === 'inline'`; declared-shape đi qua `classifyDeclaredMutation` và **không có refusal theo posture cwd** ở assignment-runner (effective-execution-contract chỉ gắn nhãn `workspacePosture`). Plan tuyên bố "một chủ" nhưng không đụng đường declared.
- **Failure scenario:** (a) Agent ở checkout chính dựng assignment JSON `mutation: 'mutating'` kèm `provenance.binding` bịa → `fgos run`/`execute` ghi thẳng vào checkout chính. (b) Phase 8 chạy nhánh engine để so sánh ca 1: master loop refuse mọi operation `work-product` vì thiếu binding → không có số liệu đối chứng → nghiệm thu vô nghĩa hoặc phải "tạm" nới cổng.
- **Evidence:**
  - `src/runner/dispatch/assignment-runner.mjs:511` — `if (asgn.mutation !== 'mutating' || asgn.provenance?.kind !== 'inline') return;` (cổng chỉ inline)
  - `src/runner/dispatch/assignment-runner.mjs:518-523` — refuse khi không có stamp; `:527-545` resolve stamp → definition thật, so version, kiểm `result.kind === 'work-product'`
  - `src/runner/dispatch/execution-contract.mjs:23-29` — ghi rõ `carriesProtocolOperationStamp` forgeable, vì thế cần re-verification ở dispatch layer
  - `src/runner/coordination/session-engine.mjs:403` — call site duy nhất của engine: `executeAssignment(assignment, {..., isReadOnlyMode: assignment.mutation !== 'mutating'})`
  - `src/runner/coordination/legality-facts.mjs:23` — engine tự sinh stamp
  - `src/runner/dispatch/cli.mjs:1588-1593` — `execute --assignment` luôn `isReadOnlyMode: true` → engine mutating **không bao giờ** đi qua CLI; câu "chỉ còn `execute --assignment` cho engine tới P4" (P1 phase 5) mô tả sai đường mutating của engine
  - `src/runner/dispatch/effective-execution-contract.mjs:201-214` — posture chỉ ghi nhãn, không refuse
- **Suggested fix:** Định nghĩa "hợp lệ" bằng cơ chế kiểm được ở dispatch layer: (i) cổng **re-run `bind()`** với `(unit, role, overrides, config digest)` ghi trong assignment và so `executor/invocation/mechanism`; hoặc (ii) `fgos run` ghi admission record vào `.fgos/unit-runs/<id>/events.jsonl` và cổng đối chiếu `unitRunId/role/round` với record đó. Gộp phase 7 vào phase 5 (hoặc phase 5 giữ stamp với test "dual gate tồn tại tới phase 7" và phase 7 xoá). Thêm test âm cho declared-shape mutating ở checkout chính.

## Finding 2: Kill-resume bằng `admitRunAttempt` + assignment id tất định sẽ bị từ chối `run-in-flight` / `dispatch-in-flight`

- **Severity:** High
- **Location:** Plan P1 `plan.md` section "Risk Assessment" hàng "Resume sau crash tự xây yếu"; Phase 5 section "Requirements — Store/--resume/assignment id tất định `unitRunId/role/round`; `admitRunAttempt` giữ 'một run chưa settle'"; Phase 8 "ca kill-resume"
- **Flaw:** `admitRunAttempt` M1 **từ chối** admission mới khi attempt hiện tại chưa có `result.json` và holder không chứng minh được là chết; chỉ `forceNewAttempt` mới vượt. Sau SIGKILL tiến trình `fgos run`: (a) detached worker được thiết kế để sống lâu hơn runner → "alive" → refuse; (b) nếu worker đã chết, bằng chứng chết dựa vào run-control/claim (memory 2026-09-28 probe: `dispatch.claim` luôn là file rỗng, lock ghi pid runner chứ không phải worker) → "undecidable" → refuse. Dùng id tất định `unitRunId/role/round` đảm bảo resume **luôn** trúng assignmentDir của attempt bị kill. Thêm nữa, lock cwd `dispatch--<cwd>.lock` có `ttlMs = timeoutMs`, heartbeat chết cùng tiến trình → resume cùng worktree trong TTL bị `dispatch-in-flight`. Plan không nhắc `--force-new-attempt`, không nhắc reclaim lock, không nói resume dùng cwd nào.
- **Failure scenario:** Producer vòng 2 bị kill → `fgos run --resume <id>` → `run-in-flight`. Operator thêm `--force-new-attempt` → nếu detached worker còn sống, hai worker cùng mutate một worktree (đúng double-materialization M1 sinh ra để chặn). Ca kill-resume phase 8 fail hoặc "đạt" nhờ bỏ qua guard.
- **Evidence:**
  - `src/runner/dispatch/assignment-runner.mjs:806-846` — M1: `if (current && !forceNewAttempt) { ... if (!fs.existsSync(path.join(priorRunDir, 'result.json'))) { const priorControl = inspectRunControl(priorRunDir); ...` → `status: 'run-in-flight'` (:881)
  - `src/runner/dispatch/assignment-runner.mjs:1575` — call site trong `executeAssignment`
  - `src/runner/dispatch/assignment-runner.mjs:2194-2210` — `acquireMainCheckoutLock(fgosDir, { identity: pid:ts:rand, ttlMs: timeoutMs, lockFile: dispatchLockFile(cwd) })` → `HELD` → `DispatchError('dispatch-in-flight')`
  - `src/runner/main-checkout-lock.mjs:78-80` (`dispatch--${encodeURIComponent(cwd)}.lock`), `:111` (`DEFAULT_TTL_MS`), `:422`
  - `src/runner/dispatch/detached-run-supervisor.mjs:102-105` — liveness của worker tách khỏi runner
  - `src/runner/dispatch/run-lock.mjs:369` — `inspectRunControl`
- **Suggested fix:** Thiết kế resume ở phase 5 như một **attempt mới có fence**: dùng `retryId`/`predecessorRunId`/`expectedRunId` đã có (`assignment-runner.mjs:694-760`) thay vì tái dùng id; bước reclaim tường minh (inspect run control → chờ worker → admit); test kill ở 3 điểm (trước admission, sau spawn worker còn sống, sau worker chết không `result.json`); ghi rõ resume chạy ở cwd nào và lock cwd được reclaim thế nào.

## Finding 3: Verb `fgos workflow` đã tồn tại — P3 phase 2 tạo trùng tên trước khi phase 3 xoá stage

- **Severity:** High
- **Location:** Plan P3, Phase 2, section "Requirements — Verb: `fgos workflow start|status|answer|resume`"; P3 `plan.md` "Câu hỏi mở 1"
- **Flaw:** `workflow` đã là verb công khai: "Inspect declared stage operations for a domain and workflow" với positional `stage`. Phase 2 (sóng B) merge trước phase 3 (sóng C, nơi stage mới bị xoá). Hoặc phase 2 đè verb sống (gãy `fgos-routing` — 28 dòng tham chiếu stage — và skill coding gọi `fgos workflow <stage>`), hoặc hai handler chung một tên với positional mơ hồ: `fgos workflow status <runId>` → handler cũ lấy `positional[0] = 'status'` làm tên stage.
- **Failure scenario:** Sau merge phase 2 vào nhánh plan: `fgos workflow status wr-1` trả lỗi "unknown stage status" hoặc handler mới nuốt lệnh cũ → test coding skill đỏ hàng loạt ở giữa plan, không thuộc phase nào.
- **Evidence:**
  - `src/cli/command-registry.mjs:1630-1640` — `name: 'workflow'`, `invoke: 'fgos workflow [operations] --stage <stage> ...'`
  - `bin/fgos.mjs:2163-2172` — `case 'workflow': { let stage = flags.stage; if (!stage) { if (positional[0] === 'operations') ... else if (positional[0]) stage = positional[0]; }`
  - `core/skills/fgos-routing/SKILL.md` — 28 dòng chứa `stage`
- **Suggested fix:** Phase 2 phải xoá/đổi tên verb cũ **cùng phase** (single path) và sửa caller (`rg "fgos workflow" core domains docs plugins`), hoặc đặt tên verb mới khác tới khi phase 3 xoá stage. Thêm verb cũ vào Delete list của phase 2 và vào bảng sở hữu P2 ∥ P3.

## Finding 4: Bảng sở hữu P2 ∥ P3 bỏ sót file chung và cây skill generated đang được track

- **Severity:** High
- **Location:** Track `plan.md` section "Sở hữu file giữa P2 và P3"; P2 Phase 2/3/4 "Related Code Files"; P3 Phase 2/3/6 "Related Code Files"
- **Flaw:** (1) `bin/fgos.mjs` (5155 dòng) + `src/cli/command-registry.mjs`: P2 sở hữu "chỉ mục capability/plan-lint", P3 phase 2 thêm verb `workflow`, phase 3 viết lại `discover/plan` — cùng file, không ai là chủ. (2) `src/setup/registrations.mjs` (5359 dòng) bị P2 phase 4 và P3 phase 2, 6 sửa nhưng **không có trong bảng sở hữu**. (3) `core/skills/fgos-routing/SKILL.md` bị P2 phase 3 (trỏ driver mới) và P3 phase 3 (stage → workflow run) cùng sửa. (4) Cả hai plan chạy `npm run build:skills`, tái sinh **cây tracked** `.agents/skills` (59 file) và `plugins/fgOS/skills` (91 file) → mọi lần merge P2/P3 vào `main` đụng conflict ở file generated; memory ghi `fgos setup` từ worktree khác tự revert sửa tay.
- **Failure scenario:** P2 merge `main` trước. P3 "merge main một lần" conflict ở `bin/fgos.mjs`, `registrations.mjs`, 150 wrapper generated. Lead giải bằng cách chạy lại `build:skills` trong worktree P3 → wrapper của P2 bị sinh lại từ `core/skills` của P3 (chưa có đổi của P2 nếu merge chưa xong) → mất skill `fgos-run` của P2 một cách im lặng.
- **Evidence:**
  - `git ls-files .agents/skills | wc -l` = 59; `git ls-files plugins/fgOS/skills | wc -l` = 91
  - `wc -l bin/fgos.mjs` = 5155; `src/setup/registrations.mjs` = 5359; `src/cli/command-registry.mjs` = 1652
  - `core/skills/fgos-routing/SKILL.md` — 28 dòng `stage`, 0 dòng `fgos-code-change` (P2 vẫn khai sửa file này)
  - Plan P3 Phase 2 "Modify: `bin/fgos.mjs`, `src/cli/command-registry.mjs` (verb `workflow`), `src/setup/registrations.mjs`"; Plan P2 Phase 4 "Modify: `bin/fgos.mjs` + `src/cli/command-registry.mjs` (mục `capability`) ... `src/setup/registrations.mjs`"
- **Suggested fix:** Bổ sung bảng sở hữu theo **tên verb / tên check** cho `bin/fgos.mjs`, `command-registry.mjs`, `registrations.mjs`; một chủ cho `fgos-routing` (P3), P2 gửi patch. Luật: **không commit cây generated trong nhánh phase**, chỉ tái sinh một lần trên nhánh plan sau khi merge `main`; thêm test "wrapper == render(core)" chạy ở bước merge.

## Finding 5: P3 phase 3 bỏ `stage` khỏi Work — Rust work-state/gateway đọc `state.json` trực tiếp, `viewSchemaVersion` không tồn tại, gateway đang chạy không có bước restart

- **Severity:** High
- **Location:** Plan P3 `plan.md` section "Risk Assessment" hàng "Dữ liệu Work cũ ... `viewSchemaVersion`"; Phase 3 section "Requirements — Rust `packages/work-state` + `herdr-plugin`"; Phase 1 bước 5
- **Flaw:** (1) `rg viewSchemaVersion src packages` = 0 kết quả; cơ chế thật là `SCHEMA_VERSION` ở `work.mjs` (replay.mjs:47) — plan viện dẫn một cơ chế không có. (2) Rust `work_source.rs` đọc **`.fgos/cache/state.json`** đã fold bởi Node, đồng thời nhúng contract riêng `domain-entry-stages.json` và đếm `stage_entry` → reader thứ hai có ngữ nghĩa stage riêng; herdr-plugin/src có 134 tham chiếu `stage`, web 14. (3) Gateway là tiến trình detached sống lâu (`fgos gateway start`); P3 không có bước stop/start (P1 phase 8 có "restart gateway nếu cần", P3 phase 3/6 không). (4) fgOS cài global đang chạy ở nhiều project khác (AGENTS.md D-ADR0035) với binary cũ → tiếp tục ghi event có `stage` sau khi `main` đã bỏ; "đường đọc duy nhất" vì thế phải **vĩnh viễn**, nhưng P5 phase 3 cấm `\bstage\b` trong code.
- **Failure scenario:** P3 merge; Node fold ghi `state.json` không `stage`; gateway binary cũ đang chạy đọc `state.json` mới → board trống cột stage, entropy `stage-entry`=0, herdr pick theo stage im lặng chọn sai. Sau restart, một session ở project khác (binary staged cũ) ghi `state.json` có `stage` → view hai hình dạng xen kẽ.
- **Evidence:**
  - `packages/work-state/rust/src/work_source.rs:6` (đọc `state.json`), `:18` (`include_str!("../../contracts/domain-entry-stages.json")`), `:73` (`stage_entry`), `:86-89` (`.fgos/cache/state.json`)
  - `rg -c "\bstage\b" herdr-plugin/src` = 134; `herdr-plugin/web/src` = 14; `packages/work-state/rust/src` = 20
  - `src/state/replay.mjs:47` — "work.mjs's SCHEMA_VERSION"; `src/state/store.mjs:339`; không có `viewSchemaVersion`
  - `AGENTS.md` § "Starting the herdr gateway" — gateway detached, chỉ `fgos gateway start/stop`
  - P1 Phase 8 bước 5 có "restart gateway"; P3 Phase 3 bước 1-5 và Phase 6 không có
- **Suggested fix:** Thay "viewSchemaVersion" bằng cơ chế thật (bump `SCHEMA_VERSION`, luật fold cũ→mới, invalidate `.fgos/cache/state.json`), thêm version cho contract `work-events.read.v1.json` + `domain-entry-stages.json` phía Rust; thêm bước "`fgos gateway stop` trước merge, `start` sau" vào P3 phase 3 và 6; ghi tường minh legacy read path là ngoại lệ của guard P5.

## Finding 6: P4 phase 6 xoá `packages/coordination-state/rust` nhưng `apps/fgos` link nó vào metrics — Rust workspace gãy, số liệu việc lẻ A thành chết

- **Severity:** High
- **Location:** Plan P4, Phase 6, section "Requirements — Xoá ... `packages/coordination-state/rust`, nguồn coordination trong `packages/observe/rust`"; Track Phase 1 bảng điều kiện "Việc lẻ A ... `protocols_defined`"
- **Flaw:** Workspace root và `apps/fgos` đều phụ thuộc crate này; `metrics_sources.rs` dựng `CoordinationSource` vào danh sách nguồn metrics. Phase 6 "Related Code Files" không có `apps/fgos/**`, không có root `Cargo.toml`. Việc lẻ A sửa số `protocols_defined` (nguồn coordination) làm **tiền đề nghiệm thu P1**, rồi P4 xoá nguồn mà không có nguồn thay thế Rust cho `unit-runs`/`workflow-runs` (P1 phase 5 chỉ thêm `unitRunId` vào run-result; P3 phase 2 không có Rust reader cho `workflow-runs`).
- **Failure scenario:** `cargo build` fail trên nhánh phase 6 (unresolved crate) → sửa vội `apps/fgos` ngoài plan; hoặc xoá nguồn → `fgos metrics harness` mất `protocols_defined` → số liệu ca 2/3 không so được với ca 1.
- **Evidence:**
  - `Cargo.toml:10` — `"packages/coordination-state/rust"` (workspace member)
  - `apps/fgos/Cargo.toml:12` — `fgos-coordination-state = { path = "../../packages/coordination-state/rust" }`
  - `apps/fgos/src/wiring/metrics_sources.rs:3` (`use fgos_coordination_state::CoordinationSource;`), `:13` (`Box::new(CoordinationSource::new())`)
  - `packages/observe/rust/src/scorecard.rs` — tham chiếu nguồn coordination
- **Suggested fix:** Thêm `apps/fgos/Cargo.toml`, `apps/fgos/src/wiring/metrics_sources.rs`, root `Cargo.toml` vào Delete/Modify của phase 6; định nghĩa `UnitRunSource`/`WorkflowRunSource` Rust ở P1 phase 5 / P3 phase 2 để harness liên tục **trước** khi xoá.

## Finding 7: Store mới `.fgos/unit-runs/`, `.fgos/workflow-runs/` không gitignore trong khi `.fgos/events` đang tracked; worktree không có `.fgos` riêng nên `fgos run` cần `--dir` mà verb không khai

- **Severity:** Medium
- **Location:** Plan P1 `plan.md` section "Hợp đồng dữ liệu — Store mới"; Phase 5 "Requirements — Verb `fgos run --unit ... [--resume]`" và "Đăng ký `.fgos/unit-runs/` vào setup/doctor"; P3 Phase 2 "`src/workflow/store.mjs`"; P2 Phase 3 driver
- **Flaw:** `.gitignore` liệt kê `runtime/assignments/coordination/dispatch-runs` nhưng không plan nào thêm hai thư mục mới; `.fgos/events` **đang tracked** (87 file) nên `git add -A` ở worktree/checkout chính sẽ vớt event log unit-runs vào commit → vi phạm ADR0020 (worktree không có `.fgos` riêng; không commit `.fgos` trên nhánh worker), `fgos catchup` conflict. Mutating `fgos run` bắt buộc cwd là worktree (cổng), nhưng store phải nằm ở `.fgos` của checkout chính — CLI hiện hành yêu cầu `--dir <mainRoot>` tường minh; verb `fgos run` trong plan không có `--dir/--cwd/--repo-root`; `run.mjs` bị cấm import `src/state` nên phải tự resolve qua `src/runner/paths.mjs` — plan không nói.
- **Failure scenario:** Driver P2 spawn `fgos run` cho mỗi Unit trong worktree riêng, không `--dir` → store resolve về `os.tmpdir()`/rỗng (như `openDispatchRun` hôm nay) → Observe (G1) không thấy; `--resume` từ checkout chính không tìm thấy unit-run.
- **Evidence:**
  - `.gitignore:23-26` — `.fgos/runtime/`, `.fgos/assignments/`, `.fgos/coordination/`, `.fgos/dispatch-runs/` (không có unit-runs/workflow-runs); `git ls-files .fgos | wc -l` = 99, trong đó `.fgos/events` = 87
  - `bin/fgos.mjs:160-166` — "A worktree-resident session (no `.fgos/` at its own cwd, per ADR0020) passes `--dir <mainRoot>` to reach the one real store explicitly"
  - `src/runner/dispatch/cli.mjs:1347-1356` — `--cwd`/`--dir`/`--repo-root` → `resolveMainCheckoutRoot(cwd)` → `fgosDirFromRoot(root)`
  - `src/runner/dispatch/cli.mjs:262-267` — fallback `os.tmpdir()/fgos-dispatch-runs` khi thiếu fgosDir (tiền lệ mất dữ liệu)
- **Suggested fix:** Thêm `.gitignore` + doctor check cho hai store ở P1 phase 5 / P3 phase 2; khai hợp đồng `fgos run --cwd <worktree> --dir <mainRoot>` giống `dispatch execute`; test: chạy từ worktree ghi vào `.fgos/unit-runs` của checkout chính.

## Finding 8: Xoá writer `dispatch-runs` và `execute` thường nhưng reader, `.gitignore`, và 25 tài liệu/skill + AGENTS.md vẫn trỏ

- **Severity:** Medium
- **Location:** Plan P1, Phase 5, section "Requirements — Xoá" và "Related Code Files — Delete: phần writer `dispatch-runs`"; Success Criteria "`rg "openDispatchRun|dispatch-runs" src` rỗng"
- **Flaw:** Reader không có trong danh sách: `show-run.mjs`, `visibility-session.mjs`, `runtime-inspection.mjs` quét `dispatch-runs`. Tiêu chí "rỗng" buộc xoá reader → run lịch sử biến mất khỏi `fgos dispatch show-run`/visibility. `fgos dispatch execute` (dạng thường) được 25 file `core/domains/docs` và **AGENTS.md § Dispatch (luôn-nạp)** chỉ dẫn; AGENTS.md chỉ được viết lại ở **P2 phase 4** → từ lúc P1 merge tới P2 phase 4, doctrine luôn-nạp trỏ vào cửa đã xoá; hook PreToolUse `scripts/dispatch-decide-hook.mjs` trả `out-of-process` kèm lệnh không còn.
- **Failure scenario:** Agent làm theo AGENTS.md → `fgos dispatch execute <executor>` → unknown subverb → agent tự chạy lệnh executor qua Bash (đúng điều AGENTS.md cấm) → mất Observe.
- **Evidence:**
  - `src/verbs/dispatch/show-run.mjs:58-63`; `src/runner/dispatch/visibility-session.mjs:234-249`; `src/runner/dispatch/runtime-inspection.mjs:83-84`
  - `src/runner/dispatch/cli.mjs:260` (`openDispatchRun`), `:1413` (execute thường → `executeAssignment`)
  - `rg -l "dispatch execute" core domains docs | wc -l` = 25
  - `.claude/settings.json:56-64` — PreToolUse `node "${CLAUDE_PROJECT_DIR}/scripts/dispatch-decide-hook.mjs"`
  - `AGENTS.md` § "Dispatch — routing work to a executor" (hướng dẫn `fgos dispatch execute`)
- **Suggested fix:** Chuyển sửa AGENTS.md § Dispatch + text hook vào P1 phase 5; liệt kê reader và quyết tường minh giữ/xoá khả năng đọc lịch sử `dispatch-runs`; nếu giữ, bỏ tiêu chí `rg` rỗng và giữ dòng `.gitignore:26`.

## Finding 9: Guard A4 "execution không import `src/state`" va vào `src/runner/worktree.mjs` (import `state/store.mjs`) và lối thoát "qua lệnh CLI hiện có"

- **Severity:** Medium
- **Location:** Plan P2, Phase 3, section "Requirements — Lập lịch: ... tái dùng `src/runner/worktree.mjs` qua interface, không import `src/state/**` từ lõi execution — nếu cần claim/lock thì qua lệnh CLI hiện có"; P1 `plan.md` bảng authority hàng 4; P3 Phase 5 guard
- **Flaw:** `worktree.mjs` import `StoreError` từ `../state/store.mjs` → bất kỳ import nào từ `src/runner/execution/plan-reader.mjs` kéo `src/state` theo bắc cầu → guard theo import-graph đỏ. Lối thoát "qua lệnh CLI" nghĩa là lõi execution **spawn binary `fgos`** từ bên trong fgOS — binary nào? (memory: `fgos` shell function có thể trúng staged release cũ; nhánh track vs `main`), và tiến trình con mang pid khác nên lock cwd/claim nhận diện sai holder. Tạo worktree song song từ driver đã được xác nhận race thực (memory fanout 3-way).
- **Failure scenario:** Driver chạy 3 Unit song song, mỗi `fgos run` tạo worktree; một cái trượt vào checkout chính → cổng mutating refuse (tốt) hoặc worktree tạo chồng nhau → hai Unit ghi cùng cây.
- **Evidence:**
  - `src/runner/worktree.mjs:60` — `import { StoreError } from '../state/store.mjs';`
  - `test/architecture.test.mjs` tồn tại (nơi guard sẽ sống), `src/runner/execution/` chưa tồn tại
  - `src/runner/main-checkout-lock.mjs:422` — identity theo pid tiến trình gọi
- **Suggested fix:** Tách helper worktree thuần (không `StoreError`) hoặc định nghĩa port `src/runner/execution/ports.mjs` do tầng CLI tiêm; serialize tạo worktree dưới một lock; guard phải kiểm **đồ thị import bắc cầu**, không chỉ top-level; cấm spawn `fgos` từ lõi execution.

## Finding 10: Guard từ vựng không có chủ — bốn plan cùng tạo/mở rộng một test chưa tồn tại; `\bstage\b` của P5 cấm chính legacy read path P3 phải giữ

- **Severity:** Medium
- **Location:** Plan P1 Phase 8 "Guard test ... từ vựng chết của P1"; P2 Phase 5 "Guard từ vựng"; P4 Phase 6 "Guard từ vựng chết"; P5 Phase 3 "`test/runner/dead-vocabulary-guard.test.mjs`: thêm docs/core/domains..."
- **Flaw:** File không tồn tại; P5 giả định "mở rộng" nó; P1/P2/P4 mỗi plan "thêm guard" không nói file nào (P2 ∥ P3 có thể cùng sửa `test/architecture.test.mjs`). P5 cấm `\bstage\b` trong code trong khi P3 Finding 5 buộc giữ đường đọc `stage` cũ vĩnh viễn và Rust vẫn có contract `domain-entry-stages.json`.
- **Failure scenario:** Hai plan cùng tạo `dead-vocabulary-guard.test.mjs` với bảng từ khác nhau → conflict add/add khi merge; P5 guard đỏ trên legacy read path → ai đó "sửa" bằng cách xoá đường đọc cũ → dữ liệu Work cũ đọc sai.
- **Evidence:**
  - `ls test/runner/dead-vocabulary-guard.test.mjs` → không tồn tại; `rg -l "vocabulary" test` chỉ ra `test/state/*.test.mjs`, `test/setup/*.test.mjs` (không có guard chung)
  - `packages/work-state/contracts/domain-entry-stages.json` tồn tại
- **Suggested fix:** P1 phase 8 tạo **một** file guard với bảng dữ liệu (từ, phạm vi, ngoại lệ); các plan sau chỉ thêm hàng; ngoại lệ tường minh cho legacy read path + contract Rust.

## Verification Results (FLOW TRACER)

| Claim trong plan | Kết quả | Bằng chứng |
|---|---|---|
| `executeAssignment` có 4 caller | **Đúng** | `operation-choice.mjs:2212`, `session-engine.mjs:403`, `cli.mjs:1413`, `cli.mjs:1588`; định nghĩa `assignment-runner.mjs:1232` |
| 4 import `workflow-stage-graphs` trong dispatch | **Đúng**, nhưng thiếu | `operation-choice.mjs:20`, `assignment-runner.mjs:57`, `cli.mjs:21`, `assignment.mjs:51`; ngoài ra `config.mjs:23,27` (`state/work`, `state/tool-registry`), `cli.mjs:20,24,38` (`state/work`, `state/store`, `state/worker-slots`) — P3 phase 5 có nhắc `config.mjs (state Work)` nhưng không nhắc `tool-registry`/`worker-slots` |
| Resume qua `admitRunAttempt` giữ "một run chưa settle" | **Sai như thiết kế** | M1 từ chối `run-in-flight` (`assignment-runner.mjs:806-881`); cần `forceNewAttempt`; lock cwd `:2194-2210` |
| `openDispatchRun` tại `cli.mjs ~260` | **Đúng** | `cli.mjs:260-267` |
| Cổng mutating `~521-560` | **Đúng vị trí**, **sai phạm vi** | chỉ `provenance.kind === 'inline'` (`:511`); declared-shape không có refusal posture |
| Khối redirect `~1428-1455`, fallback `~2318-2353` | **Đúng trên main**; **lệch trên T** | main `:1431-1432`, `:2316-2322`; nhánh T: `selectReadOnlyRedirectExecutor` ở `assignment-runner.mjs:184`, redirect `:1411-1432`, `placement-policy.mjs` còn 128 dòng |
| `assignment-policy.mjs ~290` default `'claude'`; `~388-391` persona `'code-reviewer'` | **Đúng** | `:294` `'claude'`; `:389-390` |
| `assertNoPortableExecutorPin ~925-942` | **Gần đúng** | hàm tại `session-engine.mjs:933` |
| `feature.yaml:65 preferExecutor: claude` | **Đúng** | `domains/coding/workflows/feature.yaml:65` |
| `execute --assignment` là đường engine tới P4 | **Sai cho mutating** | `cli.mjs:1588-1593` luôn `isReadOnlyMode: true`; engine mutating đi in-process `session-engine.mjs:403` |
| `viewSchemaVersion` như T D12 | **Không tồn tại** | 0 hit `src/state`, `packages/work-state`; chỉ `SCHEMA_VERSION` (`replay.mjs:47`) |
| Verb `fgos workflow` là verb mới | **Trùng** | `command-registry.mjs:1630`, `bin/fgos.mjs:2163` |
| Loader 3 tầng như `protocol-loader.mjs` | **Đúng** | `src/runner/definitions/protocol-loader.mjs:21-35` (project `.fgos/coordination-protocols`, domain `domains/<d>/coordination-protocols`) |
| `core/workflows/` (P3/P4) | **Chưa có** | chỉ `domains/coding/workflows/` tồn tại; `.fgos/workflows` không |
| `packages/coordination-state/rust` chỉ engine dùng | **Sai** | `apps/fgos/Cargo.toml:12`, `apps/fgos/src/wiring/metrics_sources.rs:3,13`, root `Cargo.toml:10` |
| `test/runner/dead-vocabulary-guard.test.mjs` | **Không tồn tại** | `ls` lỗi; `test/architecture.test.mjs` có |
| Gate T: `rg rigorToTier src` có kết quả sau T merge | **Chưa kiểm được** | nhánh T hiện 0 hit trong `src` (chỉ `resolveTierModel`: `dispatch.mjs:36`, `assignment-policy.mjs:27,443`); `rigorToTier` là **khoá config** theo T `plan.md:31,42` — gate có thể chỉ khớp comment/chuỗi config |
| Hook PreToolUse vị trí chưa rõ (P2 phase 1) | **Đã tìm** | `.claude/settings.json:56-64` → `scripts/dispatch-decide-hook.mjs` (repo-local, không phải binary global) |
| `.fgos/coordination/sessions` 602 session | **606 thư mục**, gitignored | `ls | wc -l` = 606; `.gitignore:25` |
| Observe case journal append nguyên tử | **Đúng** | `packages/observe/rust/src/case_journal.rs:219-231` (O_APPEND + fsync), `:254` (trong store lock) |

## Câu hỏi chưa giải

1. "`provenance.binding` hợp lệ" được kiểm bằng gì ở dispatch layer? (Finding 1)
2. Resume dùng cwd/worktree nào và ai reclaim lock cwd + run control sau SIGKILL? (Finding 2)
3. P3 phase 2 có xoá verb `workflow` cũ cùng phase không, hay phase 3? (Finding 3)
4. Cây generated `.agents/skills`/`plugins/fgOS/skills` có tiếp tục được commit trong nhánh phase không? (Finding 4)

Status: DONE_WITH_CONCERNS
Summary: 10 finding (1 Critical, 5 High, 4 Medium); plan set có cấu trúc tốt nhưng các điểm chạm runtime thật (cổng mutating, admission/lock khi resume, verb trùng tên, Rust/gateway đọc `state.json`, crate coordination-state do `apps/fgos` link, store mới chưa gitignore) chưa được trace tới code.
Concerns: Finding 1 và 2 chặn P1 phase 5/8 nếu không sửa thiết kế trước khi bắt đầu; Finding 3–6 làm P2 ∥ P3 và P4 phase 6 gãy ở thời điểm merge.
