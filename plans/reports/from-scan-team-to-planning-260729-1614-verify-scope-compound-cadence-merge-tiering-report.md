# Tách compound-learning và full-test-suite về sau merge — báo cáo khảo sát

**Ngày:** 2026-07-29 · **Nhánh:** main @ f2dbeb9 · **Loại:** khảo sát trước thảo luận, CHƯA phải plan
**Nguồn:** 5 agent quét song song (verify gate / compound / merge machinery / test selectivity + đo thật / luật & spec)
**Trạng thái:** mọi kết luận dưới đây là đầu vào cho thảo luận, chưa có quyết định nào được chốt

---

## 1. Câu hỏi gốc của người dùng (nguyên văn)

> bật mộ team để quét chi tiết code sẵn sàng cho thảo luận và plannig về việc: tách compound
> learning và run full-test suite về các bước phía sau sau khi merge. tôi muốn khi code làm xong
> sẽ có test, nhưng tốt nhất là chỉ chạy test liên quan trực tiếp tới những việc chúng ta chi
> phối. sau đó sẽ merge. có thể định ra thêm khái niệm nhánh dev nếu cần thiết. mọi thứ sẽ tự
> merge về dev (tích lũy đủ task) rồi sau đó sẽ chạy full test suite và chạy compound. ý là như
> vậy, nhưng cần thảo luận chi tiết.

### 1.1 Tách thành 4 yêu cầu rời

| # | Yêu cầu | Ghi chú |
|---|---|---|
| R1 | Code xong phải có test | Đã là luật hiện hành (`AGENTS.md:33`) |
| R2 | Lúc làm chỉ chạy test **liên quan trực tiếp** tới thay đổi | Cần cơ chế chọn lọc |
| R3 | Merge sớm, sau khi test hẹp xanh | Merge target hiện là gì? |
| R4 | Gom về nhánh `dev` → tích đủ task → chạy full suite + compound theo lô | Khái niệm mới? |

---

## 2. Khảo sát — sự thật đo được và đọc được

### 2.1 Verify gate

- **Verify KHÔNG hardcode `npm test`.** Một primitive duy nhất: `runGoalCheck`
  (`src/runner/goal-check.mjs:20`), chạy trường per-item `item.verify` bằng
  `spawn(item.verify, {shell:true, cwd})` (`goal-check.mjs:23`), **chỉ xét exit code**
  (`goal-check.mjs:85`). Cap output 10MB.
- `item.verify` là **free text bắt buộc**, được điền qua 5 đường:
  1. `fgos add --verify` — bắt buộc (`src/state/work.mjs:145`, `src/cli/command-registry.mjs:74,88`)
  2. `fgos submit` — sentinel `'chưa xác định — P15 bổ sung'` (`bin/fgos.mjs:66-70`)
  3. `fgos discover` @clarify — model verdict điền; không có → `FALLBACK_VERIFY`
     (`src/intake/discovery.mjs:45,199-200`)
  4. `fgos plan` — mỗi item con mang verify riêng (`src/intake/plan.mjs:120,346`)
  5. `fgos edit --verify` (`src/state/store.mjs:186`)
- **Không có validation** chuỗi verify chạy được hay không. Sentinel vẫn bị shell thực thi;
  lệnh không tồn tại → exit khác 0 → item park `blocked` với `errorClass: 'verify-miss'`,
  **không phân biệt được với test hỏng thật**.
- **Verify chạy 3–4 lần cho một item**, không phải 1:
  - `fgos return` — worktree detached tại SHA nhánh (`bin/fgos.mjs:1433`) hoặc cwd (`:1488`)
  - `fgos approve` — verify lại trên main ở chế độ verify-only (`bin/fgos.mjs:1956`)
  - `mergeRunnerItem` — verify trên **cây đã merge, chưa commit** (`src/runner/merge.mjs:429`)
  - `fgos catchup` — verify trên staged merge tree (`bin/fgos.mjs:2106`)
  - runner loop — `loop.mjs:372` (startupReap), `loop.mjs:700` (processItem)
- **Không có timeout mặc định cho CLI verb.** Chỉ khi truyền `--timeout <ms>`
  (`bin/fgos.mjs:1372-1380`); `runGoalCheck` bỏ hẳn timer khi `timeoutMs` falsy
  (`goal-check.mjs:42`). → `fgos return` treo vô hạn nếu verify treo. Runner thì có:
  `.fgos-runner.json` `timeoutMs` hiện = 900000.
- **Không tồn tại bất kỳ cơ chế chọn lọc test nào** trong `src/` hay `bin/`. Không `testFilter`,
  không `--test-name-pattern`, không diff-driven. Scoping chỉ là **convention trong chuỗi verify**,
  ví dụ `npm test -- --grep power` (`.fgos/state.json:179`). fgOS không dựng, không phân tích chuỗi đó.
- `.githooks/` chỉ có `pre-commit`, và nó **không chạy test** — chỉ guard main-checkout lock,
  fail-closed. Không có `.github/workflows/`. Không có CI nào enforce verify gate.
- **Không có verb `verify`.** `fgos move` không chạy verify — thuần FSM edge (`bin/fgos.mjs:815`).

### 2.2 Đo test suite (node v24.18.0, 16 core, `--test-isolation=process`)

**Full `npm test` = 85.27s wall.** 1655 test / 1650 pass / 0 fail / 5 skip. Suite xanh.

| thư mục | thời gian | số test |
|---|---|---|
| **cli** | **89.2s** | 396 |
| runner | 6.0s | 408 |
| e2e | 5.5s | 42 |
| scripts | 2.1s | 57 |
| intake | 1.4s | 105 |
| state | 1.2s | 507 |
| setup | 0.6s | 53 |
| report | 0.4s | 39 |
| evolve / install / skills | 0.1s mỗi | — |

- **Một file gánh toàn bộ chi phí: `test/cli/fgos.test.mjs` = 77.8s / 85.3s (91%).**
  6149 dòng, 380 test, **730 lần `spawnSync` bin/fgos.mjs** (helper `run()` tại `:48`)
  ≈ 205ms/test thuần overhead tiến trình. Hai file cli còn lại 0.3s mỗi.
- Mọi thứ **trừ** `test/cli` cộng lại ≈ 17.5s serial. **e2e không phải chỗ chậm.**
- 5 skip đều ở `test/e2e/coexistence-canary.test.mjs` (`BEE_SKIP` tại `:66`, bee không cài).

### 2.3 Khả thi của việc chọn test theo thay đổi

- **Mapping src→test rất cơ học:** 48/51 module có cặp chính xác
  `src/<area>/<mod>.mjs` ↔ `test/<area>/<mod>.test.mjs`.
  Thiếu test: `src/intake/risk-keywords.mjs`, `src/cli/command-registry.mjs`,
  `src/setup/git-hooks.mjs` (cái cuối được phủ gián tiếp).
- **`bin/fgos.mjs` là nút thắt:** fan-in **17 file test** trên 7/11 thư mục — cả 3 `test/cli/*`,
  cả 8 `test/e2e/*`, cộng `test/evolve/iron-law`, `test/report/enduser-index`,
  `test/runner/paths`, `test/scripts/fgos-shell-integration`, `test/setup/checks`,
  `test/state/backward-compat`.
  → **Mọi thay đổi `bin/fgos.mjs` buộc chạy `test/cli/fgos.test.mjs` ⇒ sàn 78s ⇒ chọn lọc chỉ tiết
  kiệm ~9% so với 85s.** Và `bin/fgos.mjs` (134KB) chứa cả 37 verb — là chỗ bị sửa nhiều nhất.
- Thay đổi gói trong `src/state/*` → 1.2s thay vì 85.3s = **70×**. Tương tự intake/setup/report/evolve.
- `test/architecture.test.mjs` duyệt toàn bộ `src/`+`bin/` đối chiếu
  `docs/architecture-manifest.json` → phải chạy khi **thêm/xoá/đổi import bất kỳ .mjs nào**.
- Danh sách luôn-phải-chạy (cross-module): `test/state/{awaiting,backward-compat,compound-learn-done-gate}`,
  `test/runner/lock`, `test/skills/fgos-mirror`, `test/smoke`, `test/install-packaging`.
- **Không có cơ chế tag/selection nào:** 0 khối `describe`, 1596 lời gọi `test(` phẳng.
  Bộ chọn duy nhất dùng được hôm nay là **truyền đường dẫn file cho `node --test`** — không cần
  đổi runner.
- Mapping tự động hoá được bằng 4 quy tắc: `src/**` → test cùng đường; `scripts/**` → `test/scripts/`;
  `bin/**` → danh sách fan-in 17 file; thêm/xoá `.mjs` → `test/architecture.test.mjs`;
  cộng ~7 file always-run.

### 2.4 Trường `footprint` — KHÔNG dùng làm input chọn test được

- Tồn tại, validate **chỉ về shape** (`src/state/work.mjs:242-262`). Dùng cho 3 việc, **không việc nào
  liên quan test**: clean-tree tolerance (`merge.mjs:148`), frozen-judge advisory **không bao giờ chặn**
  (`frozen-judge.mjs:57`; `bin/fgos.mjs:1446` — comment "advisory only … a hit never blocks this return"),
  và `fgos conflicts` (`command-registry.mjs:361`). Match **path chính xác, không glob**
  (`frozen-judge.mjs:48-50`).
- **Độ phủ 16/95 item (17%).** done 13/41, todo 2/45, blocked 1/2, **doing 0/3, proposed 0/3**.
- **Chất lượng kém: 9/20 đường dẫn khai báo không tồn tại.** Basename trần `loop.mjs`, `store.mjs`,
  `merge.mjs`; `src/runner/worktree.test.mjs` (test nằm ở `test/`); một item khai `"test/"` — là thư mục.
- Được LLM decompose judge tự điền (`src/intake/plan.mjs:143`), lọc mỗi điều kiện chuỗi không rỗng,
  **không bao giờ đối chiếu filesystem**. `--footprint` fail-soft (`bin/fgos.mjs:712`).
- → Input tin cậy duy nhất cho chọn test là **`git diff` vs merge base**. Muốn dùng footprint phải
  validate path lúc ghi trước.

### 2.5 Compound learning — hai thứ khác nhau chung tên

**(1) Verb `fgos compound` — rẻ.** Thuần số học + 2 lần append file. Không model call, không quét file.
Mili-giây. Đường đi: `listWork` (replay events.jsonl) → `moveStage` (`store.mjs:548`) → optional
`addOutcome`. `check` cũng thuần: replay + `computeEntropy`/`computeCounts` (zero-I/O) + 1 `appendFileSync`.

**(2) Skill `fgos-coding-compounding` — đắt.** Một lượt agent đầy đủ, 5 bước
(`.claude/skills/fgos/fgos-coding-compounding/SKILL.md:45-135`): `fgos check <id>` → đọc `docs/history/<feature>/`
→ phán đoán Diataxis → `fgos compound --doc-type --doc-path` → `fgos doc-sources` →
**viết hoặc nuôi một doc end-user thật** dưới `docs/<quadrant>/` → `fgos check` lại xác nhận.

→ **Toàn bộ chi phí nằm ở (2).** `judge-executor.mjs` / `frozen-judge.mjs` KHÔNG nằm trên đường này.
Thứ duy nhất model-adjacent trên cạnh `done` là `composeLearning` (`store.mjs:497-503`), bọc try/catch
nuốt lỗi, best-effort, không bao giờ chặn.

**Cổng chặn:** `src/state/store.mjs:439-451`, trong `moveWork`, chỉ khi `to === 'done'`.
Nếu domain khai bước Compound-learn mà `work.stage !== 'compound-learn'` → `StoreError('precondition')`.
- Chặn **cả hai** lối vào `done`: `proposed→done` và `doing→done`. Cả 4 cửa `done` trong
  `bin/fgos.mjs` (`:1758, :1856, :1939, :1969`) đều qua đúng `moveWork` này.
- Đặt **sau** CAS của `transitionWork` và **trước** `appendEventLocked` (`store.mjs:504`), dưới
  `events.lock` — từ chối thì không persist gì.
- Test: `test/state/compound-learn-done-gate.test.mjs:48,63` (chặn), `:74-86` (chỉ cho từ stage
  compound-learn), **`:88-95` domain `synthetic` được miễn**, `:97-110` (thứ tự CAS).
- e2e: `test/e2e/compound-learn-lifecycle.test.mjs:74` happy path; `:96-108` bỏ `compound` thì
  `approve` exit **2**, stderr khớp `/compound-learn/`, item nằm lại `proposed`.
- Stage graph `src/state/workflow-stage-graphs.mjs:50`:
  `['clarify','decompose','executing','compound-learn']`; cạnh vào duy nhất
  `{from:'executing', to:'compound-learn'}` (`:68`); skillMap `'compound-learn' → 'fgos-coding-compounding'` (`:85`).
- **Verb `compound` đòi `status === 'proposed'`** (`bin/fgos.mjs:871`), gọi `moveStage(…, 'compound-learn')`
  (`:892`). Cố tình KHÔNG auto-advance từ return/approve (lý do ghi tại `bin/fgos.mjs:829-833`).
  Không có cạnh compound-learn→compound-learn, nên re-compound ném lỗi.

**Predicted vs actual — chưa có phép so nào.**
- `predicted` ghi lúc claim (`claim-port.mjs:150-160`): `{tier, deps, priorVisits, role, branchHeadAtTake}`.
  Runner ghi bản riêng (`loop.mjs:623-626`).
- `actual` ghi lúc terminal (`loop.mjs:712-722`, `:797-807`; CLI `bin/fgos.mjs:1448,1453,1493,1508`):
  `{outcome, passed, attempts, errorClass, aheadCount, visits}`.
- **Không có trường effort hay files. Không có gì tính delta.** `check` chỉ in hai nửa cạnh nhau
  (`bin/fgos.mjs:291-311`). Replay gộp hai nửa theo id (`replay.mjs:260-263`).

**Entropy — write-mostly.**
- `computeEntropy` (`src/report/entropy.mjs:95-106`) thuần, không fs không Date. Trọng số `:25-31`:
  missingActual 5, staleDoing 5, stageClarify 3, frictionUnsettled 2, awaitingHuman 2.
- `.fgos/entropy-history.jsonl`: 51 dòng; mỗi lần `check` ghi 1 dòng (`bin/fgos.mjs:468-471`) và
  **chỉ đọc lại đúng dòng cuối** (`:437-460`). Mới nhất: `score:192, outcomes:36, frictions:29, settlements:88`.
- **Self-improve loop KHÔNG đọc file này.** Nó ăn `view.frictions` trực tiếp qua
  `rankCandidates` (`src/evolve/candidates.mjs:36-52`) — `test/e2e/self-improve-loop.test.mjs:84-85`
  nói rõ. → gom compound theo lô **không phá consumer nào**, vì chưa có consumer trend.
- `check` phạm vi: `check [id]` scope outcomes/friction/settlement, nhưng **entropy luôn tính trên
  toàn work-state** bất kể id (`bin/fgos.mjs:516-519`). Đã sẵn tính chất "toàn cục theo lô".
- **Không có batching, không có deferral, không có queue** ở bất cứ đâu. `compound` strictly per-item.

### 2.6 Nhánh và merge

- Tên nhánh dẫn xuất một chỗ: `branchNameFor(id) => \`fgw/${id}\`` (`src/runner/worktree.mjs:78-80`).
- 3 gốc worktree trên đĩa: runner → `os.tmpdir()/fgos-worktrees`; `fgos pick` →
  `<cwd>/.claude/worktrees` (`bin/fgos.mjs:1352`); `fgos session start` → `os.tmpdir()/fgos-sessions`, detached.
- `createWorktree` **xoá `.fgos/`** khỏi mọi worktree nó tạo (`worktree.mjs:290`, ADR0020).
- **Không có verb `fgos merge`.** Merge nằm **trong `approve`**:
  `fgos approve <id>` → `bin/fgos.mjs:1623` → `mergeRunnerItem` (`:1807` leaf / `:1890` root).
  **Runner loop không bao giờ merge** — dừng ở `proposed` (`loop.mjs:706,724`).
- **Merge target = nhánh đang checkout của caller**, không phải tham số:
  `git merge --no-commit --no-ff <fgw/id>` với `cwd: repoRoot` (`merge.mjs:403`).
  Target-agnostic có chủ ý (`merge.mjs:326-333`).
- `detectTrunk` (`merge.mjs:81-101`): `origin/HEAD` → local `main`/`master` → literal `'main'`.
  **Chỉ dùng để diff, không bao giờ để merge** (`reviewDiff :256-257`, `changedFiles :309`).
  **Không có key config `baseBranch`/`targetBranch` ở đâu cả.**
- Hardcode `'main'` còn 3 chỗ: `worktree.mjs:209` (base fork), `loop.mjs:651`,
  `bin/fgos.mjs:2058` (target của catchup).
- Chiến lược: **merge commit, ép `--no-ff`** + `git commit --no-edit` (`merge.mjs:403,440`).
  Không rebase, không squash, không ff. Conflict → `git merge --abort` → `{outcome:'conflict'}`,
  **không auto-resolve**.
- **Tiền điều kiện của merge** (thứ tự trong `approve`): status `proposed` (`:1639`) → cwd không nằm
  trong session worktree (`:1667`) → cwd LÀ main worktree (`:1689`) → **Iron Law gate** cần
  `--acknowledge-iron-law` cho item runner-sourced (`:1713-1728`, exit 4, gate cả 2 transport) →
  cây sạch trừ `.fgos/` + own-file-set (`:1783`) → **`main-checkout.lock`** (`merge.mjs:371-392`) →
  **verify xanh trên cây đã staged chưa commit** (`merge.mjs:429-437`).
- **Cây nhánh tích hợp hai tầng ĐÃ TỒN TẠI:** `fgw/<root>` vừa là nhánh của root vừa là nhánh tích hợp
  của con; leaf fork từ tip nó và merge ngược về nó; **chỉ root merge lên trunk**.
  Spec `docs/specs/runner.md:76-84`; code `loop.mjs:647-655`, `claim-port.mjs:110-114`,
  `bin/fgos.mjs:1791-1878`. PR base chọn tại `bin/fgos.mjs:1589`:
  `rootId !== id ? branchNameFor(rootId) : detectTrunk(repoRoot)`.
- **Integration drift đã spec + đã code:** khi root merge lên trunk, verify chạy lại trên cây đã merge
  chưa commit; verify đỏ ≡ conflict văn bản, cả hai abort (`runner.md:82-86`, `merge.mjs:429`).
- **Không có khái niệm dev / integration / release branch cố định** nào khác, không config nào.
  `.fgos/` chỉ chứa `coexistence.json`, `entropy-history.jsonl`, `events.jsonl`, `state.json`.
- Sau merge: `proposed → done` role `human` (`bin/fgos.mjs:1856` leaf / `:1939` root / `:1758` github),
  rồi `cleanupMergedBranch` (`merge.mjs:464-477`). **Đường GitHub cố tình bỏ cleanup** — nhánh local
  và pushed đều rò (`bin/fgos.mjs:1754-1757`).
- **Không có gì trigger compound và không chạy thêm test nào khi merge.**
- Concurrency: `.fgos/main-checkout.lock`, `O_EXCL`, TTL 3 phút (`main-checkout-lock.mjs:80`).
  3 chỗ acquire: `claimWork` (`claim-port.mjs:80`), `mergeRunnerItem` (`merge.mjs:380`),
  `.githooks/pre-commit:46` (**không bao giờ release**, dựa TTL).
  `write-queue.mjs` là FIFO promise-chain thuần, **không serialize merge**.

### 2.7 Luật khoá và spec

- **L5 câu 6** (`docs/platform-foundations.md:135-137`):
  *"Câu 6 chính là compound-learning — nó nằm trong definition of done, không phải tính năng cộng thêm."*
  Ngưỡng review `:139`: *"Không có — đây là acceptance test, chỉ có thể THÊM câu."*
  → compound **không thể bỏ khỏi done**; chỉ có thể **dời vị trí thời gian**, miễn lúc `done` vẫn trả lời được câu 6.
- **L9 — run ≠ merge ≠ durable** (`:211-239`): `proposed` = *"verify xanh TRÊN NHÁNH — 'đã làm' nhưng
  CHƯA vào main"*; `done` = *"đã duyệt + nhập vào cây chính"*; `:232` *"Đọc `proposed` là 'xong' là lỗi
  phân tầng."* Ngưỡng `:238-239`: *"bổ sung, không đổi ba mức."*
- **L10 — add-through-not-alongside** (`:243-263`): *"Một hành vi ghi/đọc mới LUÔN mở rộng cửa hiện có,
  KHÔNG BAO GIỜ mở một đường song song bên cạnh nó"*; *"đắp một đường cạnh cửa làm MỌI bảo đảm của cửa
  … mất hiệu lực TRONG IM LẶNG."*
  → verify/merge theo lô phải **mở rộng** `return`/`approve`/`compound`, không được là verb mới đứng cạnh.
- **L7** durability ladder (`:169-185`): D1 branch/PR = *"đề xuất, chờ duyệt"*.
- **Status (6, schema từ chối cái khác)** `docs/specs/work-state.md:44`:
  `todo · doing · blocked · awaiting-human · proposed · done`.
  **Stages** `:52`: `clarify · decompose · executing · compound-learn`; compound-learn *"CHỈ tồn tại ở
  domain `coding`"*.
- **3 cổng của `done`:** `RUL4` `:971` (bảng cạnh, terminal); **`RUL50`** `:1007` —
  *"KHÔNG thể tới `done` — qua CẢ HAI lối vào — nếu chưa đi qua stage đó; nỗ lực đóng bị từ chối
  `precondition` (mã 2)"*; **`RUL58`** `:1018` — mọi mệnh đề `acceptance` không rỗng phải có `evidence`
  không rỗng.
- **`RUL49`** `:1006` lý do: *"tổng hợp/học sau-thi-công nay là một stage quan sát-được, FSM-hóa, không
  còn là một phản xạ có thể bị bỏ sót lặng lẽ."*
  **`RUL51`** `:1008`: *"`fgos compound <id>` là hành động CHỦ Ý duy nhất chuyển stage
  `executing → compound-learn` … một auto-advance sẽ làm stage đó trống rỗng, đúng điều D3 cấm."*
- **KHÔNG luật/spec nào bắt full test suite.** `verify` là *"free text"* (`work-state.md:48`).
  Mệnh lệnh full-suite chỉ nằm ở **`AGENTS.md:33`** — *"`npm test` (state + cli + runner + e2e suite)
  green"* — tầng doctrine (L8), **không phải hợp đồng verify cấp item**.
- **Luật phản biện sắc nhất — `RUL27`** (`runner.md:875`): *"Vì đây là phép kiểm DUY NHẤT cho cả cây hậu
  duệ, verify của gốc phải đủ mạnh lúc soạn — verify mỏng bỏ lọt trôi ngữ nghĩa."*
- **Decision 0006**: *"`done` … từ nay nghĩa là 'đã nhận vào cây chính'"*; *"Frontier chỉ mở việc phụ
  thuộc khi dep thật sự `done`."* → hoãn `done` = **chặn item phụ thuộc**.
- **Decision 0022** `:112-113`: một implementation verify duy nhất, *"Không có implementation thứ 2"*.
- **Vision `docs/work-item-lifecycle-vision.md`** (chưa khoá thành luật, `:3`):
  base workflow `:24-29` đặt **Compound-learning là bước 5, SAU Execute**; `:53-56` bước 9-11 =
  tạo PR → người review → hệ tự merge.
  **Câu hỏi treo §7.3 `:89-90` trùng khớp đề xuất này:** *"Độ hạt PR (bước 9): mỗi item nhỏ một PR, hay
  gom mọi item nhỏ của một human-submitted-item thành một PR?"*
  Câu §7.2 `:87-88` (mỗi item một worktree hay chung) cũng liên quan.
- **[ĐÍNH CHÍNH 2026-07-29] Phát biểu "backlog không có PBI nào đề xuất việc này" là SAI.**
  Agent chỉ quét `docs/backlog.md`; backlog vận hành của fgOS nằm ở `.fgos/state.json` — hai kho khác
  nhau. Trong kho thật, đề xuất này **đã được file, sâu hơn phân tích ở mục 3-4 dưới đây**:
  - **`tsk-4op`** (todo/clarify) — *"Tách 'ship' khỏi 'compound-learn' … chuyển lớp TỔNG-HỢP-VIẾT sang
    batch/patch, GIỮ lớp GHI-NHẬN rải rác xuyên tiến trình"*. Chẻ compound thành 2 lớp: (a) GHI-NHẬN rẻ,
    tự động, rải nhiều điểm (giữ RUL13/RUL20/RUL21/RUL32 + friction); (b) TỔNG-HỢP-VIẾT đắt dời sang lô
    theo ngưỡng N item / T thời gian. **Giải K7 mà không cần nhánh dev**: dep mở theo *"tín hiệu
    code-đã-merge (marker mới, không cần status FSM mới)"*. Nêu ràng buộc mạnh nhất corpus: ghi-nhận chỉ
    ở một điểm cuối thì *"cơ hội ghi lại quyết định/lựa chọn-đã-loại giữa chừng sẽ MẤT VĨNH VIỄN trước
    khi batch-compound kịp chạy"*, có bằng chứng đối chiếu bee. **Phụ thuộc thật vào `STR70a`**
    (checkpoint distillate, `docs/backlog.md:31`, `proposed`, chưa xây; `STR69a` dọn đường đã done).
  - **`tsk-34y`** (todo/clarify) — đã ĐO đúng vấn đề test: 54 test dùng chung cụm
    `is rejected as validation, exit 4`, 53 test assert `no event written`, 8 test giống hệt khác mỗi
    tên flag. Đề xuất gộp table-driven giữ nguyên coverage. Vì chi phí thật là 730 `spawnSync`, giảm
    test lặp mạnh hơn tách file. `tsk-3wr` (done) đã xong đợt sửa tên test.
  - **`tsk-4j9`** — chuẩn hoá merge, ĐANG CHẠY: `tsk-4j9-3` (fgOS:merge list, xếp hạng theo dep graph)
    done; `tsk-4j9-4` (fgOS:merge next) doing. Mọi thiết kế merge-về-dev phải cắm vào bộ này.
- Hàng liên quan trong `docs/backlog.md` (đều `proposed`):
  - `p-73d99989` — **nguy cơ mất dữ liệu**: `reclaimOrphanedCheckout` force-remove worktree cha đang sống trong lúc leaf `approve`
  - `p-b91d487a` — `mergeRunnerItem` không idempotent; approve retry sau lỗi hậu-merge làm kẹt item
  - `p-26c4a4fd` — `pick` fork leaf từ main thay vì `fgw/<rootId>`
  - `STR73` (in-flight) — done-flip phải đối chiếu từng mệnh đề CoS với evidence

---

## 3. Kết luận rút ra

### K1 — Tiền đề "full suite đắt" không đứng vững ở dạng tổng quát
85.3s toàn suite. Chi phí **không phân bố đều**: 91% nằm ở một file. Vấn đề không phải "suite to"
mà là **một file test trả giá 730 lần spawn tiến trình**.

### K2 — Chọn test theo thay đổi cho lợi ích lệch, không đều
70× cho thay đổi gói trong `src/<area>/`; **chỉ 9%** cho thay đổi `bin/fgos.mjs` — vốn là loại thay đổi
phổ biến nhất ở repo này. Chọn lọc **không thể** phá sàn 78s chừng nào `test/cli/fgos.test.mjs` còn nguyên khối.

### K3 — Yêu cầu R2 không đụng luật khoá nào
Verify đã per-item free text, đã có tiền lệ `--grep` trong state. Mệnh lệnh full-suite ở `AGENTS.md`
là doctrine, sửa được mà không supersede luật. **Nhưng `RUL27` chặn verify mỏng tại điểm tích hợp gốc.**

### K4 — Chi phí thật nằm ở compound, không ở test
Verb = mili-giây; skill = một lượt agent viết doc thật. **Gom compound theo lô có giá trị thật; gom test
thì không.** Gom compound còn tốt hơn về chất: một doc nuôi từ N item liên quan > N lần sửa vụn.

### K5 — Compound bị khoá cứng ở TRƯỚC merge, gỡ được nhưng phải chạm 3 chỗ
`compound` đòi `proposed` (`bin/fgos.mjs:871`) + cổng `done` đòi stage `compound-learn`
(`store.mjs:439-451`) + `RUL51` cấm auto-advance. Sau merge **không gọi được nữa**.
Cơ chế miễn trừ theo domain **đã tồn tại** (`synthetic` được miễn) — mở rộng theo đường đó hợp `L10`.

### K6 — "Nhánh dev" đã tồn tại một nửa, và tiền lệ pháp lý đã có
`fgw/<root>` **chính là** nhánh tích hợp, phạm vi theo từng feature. Full-suite tại điểm tích hợp
(integration drift) **đã spec + đã code**. Hơn nữa leaf merge vào `fgw/<root>` rồi chuyển thẳng `done`
(`bin/fgos.mjs:1856`) → fgOS **đã** coi "nhập vào nhánh tích hợp" = `done`, dù `L9` nói `done` = cây chính.
Thêm tầng `dev` đi theo tiền lệ này, không tạo tiền lệ mới. *(Chỗ lệch luật này đang sống, đáng ghi nhận riêng.)*

### K7 — Hoãn `done` là cái giá không né được
Decision 0006: frontier chỉ mở dep khi dep thật sự `done`. Gom càng nhiều, item phụ thuộc chặn càng lâu.

### K8 — Merge target gần như miễn phí để đổi
Target-agnostic theo thiết kế. Trỏ về `dev` = checkout `dev` rồi `approve`. Chỉ cần sửa 3 chỗ hardcode
`'main'` + thêm config nếu muốn tường minh.

---

## 4. Ba phương án đã đặt lên bàn

**A — Tách `test/cli/fgos.test.mjs` theo verb.** Không đụng lifecycle, không đụng luật.
Sửa đúng 91% chi phí; song song hoá được (hiện 1 tiến trình 78s ghim critical path trong khi 15 core
ngồi không); **mở đường** cho chọn-lọc về sau. Rẻ nhất, đòn bẩy cao nhất.

**B — Compound ở tầng root, không ở tầng leaf.** Leaf verify hẹp + merge vào `fgw/<root>`;
chỉ root làm compound + full suite trước khi lên trunk.
Dùng cây tích hợp và integration-drift verify đã có → **không cần nhánh `dev` mới**.
Trả lời luôn câu treo `vision §7.3`. `L5-Q6` vẫn được trả lời ở cấp người-nộp — đúng cấp đáng có doc.
Mở rộng miễn-trừ-theo-domain thành miễn-trừ-theo-tầng, hợp `L10`. Leaf vẫn `done` khi merge vào root
→ **K7 không phát sinh**. `RUL27` được tôn trọng vì verify của root *là* full suite.

**C — Nhánh `dev` cố định làm tầng thứ ba.** Mọi root merge về `dev`, tích đủ rồi full suite + compound
trước `dev → main`. Thêm được thứ B không có: **bắt lỗi tương tác liên-feature**.
Giá: `main` đình cho tới lượt lô; dependency liên-feature chậm; thêm config `baseBranch`; sửa 3 hardcode
`'main'` + `catchup` target; phải định nghĩa merge-vào-dev là mức nào trong `L9`.

**[SỬA LẠI sau đính chính backlog]** Ba phương án trên soạn khi còn tưởng chưa có gì được file. Sau khi
đọc kho thật, khung đúng hơn là:
- **A bị `tsk-34y` thay thế phần lớn.** Tách file chỉ chia lại cùng khối lượng; gộp table-driven cắt
  thẳng số `spawnSync`. Tách file vẫn còn giá trị riêng cho tính song song, nhưng là bước sau, không phải
  bước đầu.
- **B bị `tsk-4op` thay thế và làm tốt hơn.** `tsk-4op` không dời compound sang tầng root mà chẻ compound
  làm hai lớp — ghi-nhận giữ nguyên chỗ, chỉ tổng-hợp-viết đi theo lô — và mở dep bằng marker
  code-đã-merge. Nhẹ hơn, không đụng `L9`, không cần đổi tầng.
- **C (nhánh dev) — ĐÃ QUYẾT: tạm thời bỏ** (người dùng, 2026-07-29; ghi vào log qua `fgos decision`,
  seq 977). Nhu cầu "gom rồi chạy lô" đã được `tsk-4op` giải bằng ngưỡng N/T + marker code-đã-merge, nên
  không cần thêm tầng nhánh. Bỏ dev cũng tránh phải trả lời câu hỏi `L9` (merge-vào-dev là mức bền nào)
  và tránh thêm config `baseBranch` + sửa 3 chỗ hardcode `'main'`. Cây tích hợp 2 tầng hiện có giữ
  nguyên. Chỉ xây lại nếu sau này có bằng chứng đau THẬT về lỗi tương tác liên-feature — lý do độc lập,
  không phải hệ quả của việc gom compound. "Tạm thời", không đóng cửa vĩnh viễn.

**Đề xuất cũ (giữ lại làm dấu vết, đã bị khung trên thay thế): A + B ngay, C để dành.**
A sửa chi phí thật đo được. B đạt đúng ý người dùng mà không phát minh khái niệm mới — chỉ chốt một câu
hỏi đã treo và dùng máy móc đã dựng. C là YAGNI cho tới khi có bằng chứng đau liên-feature.

---

## 5. Phát hiện phụ (ngoài phạm vi câu hỏi, đáng mở PBI riêng)

1. **[đã file: `tsk-3vo`]** `fgos return`/`approve`/`catchup` **không timeout mặc định** — verify treo =
   treo vô hạn (`bin/fgos.mjs:1372-1380`). Đã xác minh: không-timeout là **cố ý** (text của flag ghi
   *"omit `--timeout` entirely for no timeout"*), nhưng runner loop không chia sẻ lựa chọn đó.
2. Sentinel verify chưa điền vẫn bị shell thực thi; thất bại **không phân biệt được** với test hỏng thật.
3. `footprint` 17% phủ, 45% path sai — advisory dựa trên nó (`conflicts`, frozen-judge) đang chạy trên
   dữ liệu rác.
4. `entropy-history.jsonl` write-mostly: 51 dòng, đọc lại đúng 1 dòng cuối, không consumer trend nào.
5. Đường GitHub bỏ cleanup nhánh → rò nhánh local + remote (`bin/fgos.mjs:1754-1757`).
6. **[đã file: `tsk-2eq`]** Lock của leaf→root merge trỏ vào `.fgos` của worktree tạm, không phải repo
   thật (`bin/fgos.mjs:1807` → `merge.mjs:371`). **Đã xác minh, nặng hơn báo cáo ban đầu:**
   `createWorktree` xoá thư mục đó (`worktree.mjs:290`) rồi `acquireMainCheckoutLock` **tự
   `mkdirSync` tạo lại** (`main-checkout-lock.mjs:270`) → lock luôn mới, luôn `ACQUIRED`, không bao giờ
   tranh chấp. Lock thật ở `<repoRoot>/.fgos/` **không bao giờ được giữ** trong merge leaf→root, nên
   khoảng hở mà comment `merge.mjs:351-357` nói là nó đóng vẫn mở nguyên. Approve root không dính
   (`bin/fgos.mjs:1890` truyền repoRoot thật). Xung đột hướng sửa với `tsk-45y`.
7. `.githooks/pre-commit` acquire lock và **không bao giờ release**, dựa TTL 3 phút.
8. Lệch spec/code: `runner.md:1015` còn ghi *"`opts.trunk` TÙY CHỌN mặc định `'main'`"* trong khi code
   dùng `detectTrunk`.
9. Leaf `done` khi merge vào `fgw/<root>` chứ chưa vào cây chính — căng với `L9`.
10. **[đã file: `tsk-5gu`]** `fgos submit` không có tham số `verify` nào (`command-registry.mjs:98-117`),
    `classify.mjs` không xử lý verify — mọi item nộp qua `submit` mang sentinel cho tới khi `discover`
    chạy. Cố ý theo D5, nhưng bất đối xứng với `fgos add` (bắt buộc `--verify`) và làm mất verify người
    nộp đã nêu rõ trong text. Nối với phát hiện #2: sentinel vẫn bị shell thực thi lúc `return`.

---

## 6. Câu hỏi chưa ngã ngũ

1. **Đòn bẩy nào trước** — tách file test cli (sửa 91% chi phí) hay dựng chọn-lọc theo git diff (lợi 70×
   nhưng chỉ cho thay đổi không đụng `bin/`)?
2. **Gom ở tầng nào** — `fgw/<root>` có sẵn, nhánh `dev` cố định, hay cả hai tầng?
3. **Nới cổng compound thế nào** — miễn trừ theo tầng (mở rộng cơ chế miễn-theo-domain), cho compound
   chạy sau `done`, hay thêm stage batch riêng?
4. **Đau thật của người dùng là gì** — thời gian chờ, hay chuyện khác (verify đỏ chặn merge không đáng,
   phải ngồi canh, compound cắt mạch làm việc, worktree/nhánh rối)? Số đo 85s cho thấy có thể tiền đề
   "chờ lâu" không phải nguyên nhân gốc.
5. **"Nhánh dev" hình dung cụ thể ra sao** — tầng thứ ba toàn repo, dev theo từng feature, dev thay main
   làm nơi nhận, hay chỉ là chỗ tạm để chạy lô?
6. Khoảng trống `BEE_SKIP` 5 test: canary coexistence có bao giờ chạy ở checkout local bình thường không,
   hay `WORKSHOP_ROOT` được kỳ vọng phải set?
