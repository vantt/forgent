# Red-team review: Test Suite Optimization Plan (3 Pillars)

**Ngày:** 2026-09-22
**Đối tượng:** `plans/260922-test-suite-optimization/plan.md` @ `plan/test-suite-optimization-260922` (HEAD `9c7a0fce`)
**Vai trò:** reviewer độc lập, không tham gia viết plan
**Máy đo:** 16 core, Node v24.18.0, idle (không chạy `npm test` song song); script đo nằm ở scratchpad session, không commit.

## TL;DR

| Trục | Kết luận | Mức |
|---|---|---|
| 1. Con số | Ước đoán, không đo. CPU/subprocess thật ≈ **150ms** (không phải 300ms); mỗi test CLI spawn **~3.1 process** (không phải 1). Hai sai số ngược chiều nên "47s" tình cờ đúng cỡ, nhưng nền tảng tính sai. Số test/verb trong bảng Pillar 2 sai (edit 58→**68**, stage 71→**51**). | Trung bình |
| 2. Ranh giới P2 | Lỗ hổng lớn: **phần lớn business logic của edit/read/stage nằm trong `bin/fgos.mjs`, không nằm trong use-case fn**. `read` cluster: 4 use-case fn chỉ chạm ~10/103 test; `list` (28 test) có 117 LOC inline, không có `listUseCase`. Ràng buộc "không đổi bin/fgos.mjs" làm mục tiêu "~70 direct test" bất khả thi. | **Cao** |
| 3. IPOG | Thứ tự "sinh → inject pinned → lọc constraint" **sai thuật toán** (lọc sau làm mất pair đã đếm). Pinned #1 trong chính ví dụ của plan **vi phạm constraint của plan** và **không chạm nhánh sync-root** mà nó claim là witness. `pict` không có trên máy; oracle "so sánh output" sai bản chất (covering array không unique). Thiếu hẳn oracle expected-outcome cho từng combo. | **Cao** |
| 4. Promote selector | `patchRelatedMiss` trên commit lịch sử xanh **luôn = false theo định nghĩa** → "0 miss trên 50 diffs" là vô nghĩa. P05 report đã ghi replay lịch sử bất khả thi (manifest staleness + corrupt global config) — plan không đọc. Circuit breaker không có điểm quan sát: CI chỉ chạy `npm test`, và CI main đang **đỏ 7/8 run gần nhất**. Mô phỏng 50 commit src/ gần nhất với manifest Phase 1: **0/50 related, 50/50 escalate**. | **Cao** |
| 5. Phụ thuộc pillar | Phụ thuộc P1←P2 là **giả**: P1 Phase 1 nhắm `merge next`, mà P2 Phase 1 loại `merge` ra. Runner covering-array chạy được trên subprocess. Fallback tồn tại nhưng plan không nói. | Trung bình |
| 6. Test identity | Không có giải pháp. Tên test = `JSON.stringify(combo)` → thêm 1 giá trị đổi toàn bộ tên; JUnit artifact (`scripts/test-timing.mjs`) key theo `name`. Không có golden snapshot của array → generator đổi coverage âm thầm. | Trung bình |
| Ngoài 6 trục | **69 test chạy 2 lần**: `fgos-merge-2`, `fgos-return-{2,3,4}` là bản copy nguyên văn còn sót sau catch-up merge `0a604617` (2026-08-24). ≈45s wall. Bác bỏ tiền đề "không có trùng lặp" của investigation cho cụm merge/return. | **Cao** |

---

## 1. Tính đúng đắn của con số

### (a) Điểm yếu
- "1,483 subprocess × 300ms = 445s CPU" và "160 test × ~297ms = 47s": không có nguồn đo. Brainstorm §3.10 nói "~200-500ms" cũng là ước lượng. Hai báo cáo đầu vào không đo per-spawn.
- Đếm tĩnh `run(` ≠ số process động: `addOk`, `tmpCwd`, loop `for` nhân lên; ngược lại nhiều file đã dùng `tmpCwdFromTemplate` nên `init` gần như không spawn.
- Bảng Pillar 2 §2.3 ghi edit 58 / read 103 / stage 71 test; đo thật: **68 / 103 / 51** (batch2 report đã ghi stage = 51).
- Số 1,483 cũng không khớp brainstorm (1,722 static sites) lẫn đếm hôm nay (`run(` = 1,597; `run(cwd, [` = 1,446).

### (b) Bằng chứng đo thật

**Per-call, idle, median 12 lần** (harness thật `test/cli/helpers/fgos-cli-harness.mjs`):

| Case | Subprocess `run()` | Direct import | Tỷ lệ |
|---|---:|---:|---:|
| `edit --risk heavy` | 122.6 ms | `editUseCase` 0.3 ms | 400× |
| `edit` bad flag (validation) | 122.6 ms | 0.0 ms | — |
| `graph` | 123.6 ms | `graphUseCase` 2.0 ms | 60× |
| `stale` | 122.6 ms | `staleUseCase` 2.3 ms | 53× |
| `workflow --stage discovery` | 118.5 ms | `workflowUseCase` 0.0 ms | — |
| `add` (`addOk`) | 122.3 ms | `addWork` 0.4 ms | 300× |
| fixture `tmpCwd()` | 132.9 ms | `tmpCwdFast()` 0.2 ms | 660× |
| fixture `initGitCwd()` | 139.3 ms | `initGitCwdFast()` 13.6 ms | 10× |
| `fgos --help` (boot thuần) | 121.9 ms | — | — |
| `node -e ""` | 18.7 ms | — | — |

CPU thật (`/usr/bin/time`, `fgos list`, 5 lần): **user+sys ≈ 0.15s**. ~100ms trong đó là import graph của `bin/fgos.mjs` (boot node trần 19ms).

**Động, chạy thật 11 file edit/read/stage với `--require` đếm `spawnSync`** (node --test song song, load thật):

| Nhóm | Test | Spawn | Spawn/test | Avg ms/spawn (under load) | Tổng spawn ms | Wall |
|---|---:|---:|---:|---:|---:|---:|
| edit (3 file) | 68 | 220 | 3.2 | 176 | 39,065 | 15.7s |
| read (5 file) | 103 | 298 | 2.9 | 225 | 67,177 | 15.4s |
| stage (3 file) | 51 | 166 | 3.3 | 178 | 29,597 | 11.1s |

Phân rã spawn nhóm edit: `add` 84, `edit` 73, `move` 47, `resolve-park-reason` 10, `init` 4. Tức **verb đang test chỉ chiếm ~33% spawn; fixture (`add`/`move`) chiếm ~60%**.

### (c) Sai số và đề xuất
- 300ms "CPU" sai ~2× (CPU thật 150ms; 300ms chỉ đúng như wall dưới load 16-way). 445s CPU → thực ≈ 220s CPU.
- "1 subprocess/test" sai ~3×. Hệ quả: migrate chỉ call business (giữ fixture qua CLI) tiết kiệm ~160×0.15 = **24s CPU**; migrate cả fixture in-process (`addWork`/`moveWork` direct) tiết kiệm ~160×3.1×0.15 ≈ **74s CPU**. Con số 47s nằm giữa hai kịch bản nhưng plan không nói rõ đang chọn kịch bản nào.
- Đề xuất: thay §2.1 và D-OPT-05 bằng số đo trên; thêm cột "spawn/test" vào bảng §2.3; DoD P2 phải ghi before/after theo `spawnSync` count + wall, không theo test count.

---

## 2. Lỗ hổng an toàn của Pillar 2 — ranh giới business vs CLI

### (a) Điểm yếu
Plan giả định bước 1 "xác nhận use-case fn đã tồn tại ở `src/verbs/`". Thực tế use-case fn **mỏng** hoặc **không tồn tại** cho phần lớn test trong 3 verb Phase 1, và logic nghiệp vụ nằm inline trong `bin/fgos.mjs`. Ràng buộc bất biến #4 "`bin/fgos.mjs` không đổi" khoá luôn đường extract. Plan không có hướng dẫn cho test "vừa business vừa CLI", và hai rule trong §2.2.2 mâu thuẫn nhau không có thứ tự ưu tiên.

### (b) Bằng chứng

**Kích thước use-case fn so với CLI layer:**
- `editUseCase` (`src/verbs/state/edit.mjs`) = 20 dòng: check patch rỗng, check role, gọi `editWork`, gọi `addDecision` nếu có priority.
- `bin/fgos.mjs` `case 'edit'` (~1860-2080): parse `--parent ""` vs bare, `--priority` integer check, `--intent`, `--impact/--effort` non-negative, **toàn bộ `--verify-from-children/--verify-from-targets`** (gọi `listWork`, `git rev-parse`, sinh chuỗi jq). Đây là business logic nhưng chỉ chạm được qua subprocess.
- `read` cluster: `read.mjs` có 4 fn (`graph`, `workflow`, `gateCheck`, `stale`). Phân bố 103 test theo verb: **list 28, check 20, rollup 11, ready 11, triage 6, show 6, goal 6, conflicts 4, stale 4, graph 4**… Chỉ ~10 test chạm 4 use-case fn. `case 'list'` = **117 LOC** inline, không có `listUseCase`. Mục tiêu "~70 direct test" cho read là bất khả thi trong ràng buộc plan.
- `add` không có use-case: `addWork(dir, item)` đòi shape đầy đủ (`status`, `deps`, `refs`…) — thử `addWork` với item như `directFixture` §2.2.4 → `WorkValidationError: work.status is required`. Shaping nằm ở `bin/fgos.mjs:~1000-1026`. Helper `directFixture` như plan viết **không chạy được**.

**3 test cụ thể từ `fgos-edit.test.mjs`:**

| Test (dòng) | Phân loại | Vì sao mơ hồ |
|---|---|---|
| L164 `edit --deps pointing at an unknown id is rejected as validation, exit 4, no event written` | **Mixed**. Rule "dep phải tồn tại" ở store (`validateWork`); nhưng `--deps ghost-dep` → `['ghost-dep']` là parse CLI; `exit 4` là mapping CLI. | Direct test chỉ bắt được `StoreError('validation')`; mất witness cho comma-split và exit map. Plan không nói: giữ 1 witness exit-map chung cho cả verb hay mỗi rule 1 witness? |
| L202 `edit omitting --refs/--deps leaves the field untouched; an explicit empty value clears it` | **CLI-only, nhưng trông như validation**. Phân biệt "flag vắng → `patch.refs` undefined" vs "`--refs ''` → `[]`" xảy ra hoàn toàn ở `bin/fgos.mjs`. | Theo §2.2.2 "validation logic thuần → migrate" sẽ bị xếp nhầm; direct test sẽ tầm thường (truyền `undefined` vs `[]` vào `editUseCase`) và không bảo vệ gì. |
| L246 `edit --parent closing a cycle is rejected at the CLI, same "graph cycle" message as the store-layer test` | **Đã là parity test** (store-layer test tồn tại ở `test/state/store.test.mjs`). Assert `stderr` match. | Rule "stderr/user-facing → giữ" và rule "business rule thuần → migrate" **cùng khớp**; plan không có thứ tự ưu tiên. |
| L349 `edit --verify-from-children …` (bonus) | **Business logic sống trong CLI layer** + git thật + linked worktree. | Không thể migrate mà không extract khỏi `bin/fgos.mjs`; plan cấm. |

### (c) Đề xuất
1. Bỏ ràng buộc "`bin/fgos.mjs` không đổi" — nguồn trích dẫn sai: AGENTS.md chỉ cấm **relocate/rename** (Legacy-Node CLI Ownership Boundary); RUL37 trong `docs/specs/runner.md` là về Iron Law, không liên quan `runCli`. Thay bằng: "được extract logic từ `case 'x'` sang `src/verbs/state/x.mjs` theo pattern `src/verbs/merge/*`, không tạo global `runCli`" (đúng brainstorm §3.4/Wave 2).
2. Thêm bước 0 vào §2.2.3: **đo tỷ lệ test chạm use-case fn hiện có** cho mỗi verb; nếu <50%, extract trước khi viết direct test. Bảng §2.3 phải ghi kèm "LOC inline trong bin/fgos.mjs" cho từng verb.
3. Quy tắc phân loại có thứ tự ưu tiên: (i) test assert `stderr`/exit code/env/cwd/git → boundary, giữ; (ii) test mà **invariant chỉ tồn tại ở tầng parse** (omitted-vs-empty, bare flag, comma-split) → boundary, giữ, dù trông như validation; (iii) còn lại → migrate, và **mỗi verb giữ đúng 1 witness exit-map mỗi category** (validation=4, not-found…) thay vì mỗi rule 1 witness.
4. `directFixture` phải dùng cùng shaping với `add` — tức phải có `addUseCase` (đòi hỏi #1).

---

## 3. IPOG correctness risk (Pillar 1)

### (a) Điểm yếu
1. **Thứ tự bước trong §1.2.2 sai**: "1. sinh IPOG → 2. inject pinned → 3. loại combo vi phạm constraint". Lọc *sau* khi sinh làm mất pair mà IPOG đã tính là covered (row bị xoá có thể là row duy nhất chứa pair đó). Constraint phải được xử lý **trong** horizontal/vertical extension hoặc có repair pass; plan không có bước verify coverage sau lọc.
2. **Pinned vs constraint mâu thuẫn ngay trong ví dụ của plan**: pinned #1 `{readyPool:'n', syncOutcome:'dirty'}` vi phạm constraint `if readyPool ∈ [1,n] then syncOutcome ≠ dirty`. Theo bước 3 nó bị xoá → phá "pinned NEVER removed". Plan không định nghĩa ai thắng.
3. **Pinned witness không tái hiện lỗi nó claim**: `src/verbs/merge/merge.mjs:109` — nhánh sync-root fallback (nơi `dirty` phát sinh, mutation M2 của batch2) chỉ chạy khi `ready.length === 0 && blockedOnSync.length > 0`. Pinned #1 có `readyPool:'n'` → nhánh không bao giờ được chạm. Ticket `tsk-49i` trong witness là về `resolveRoot` chuyển file (`docs/specs/runner.md:1158`), không phải sync-root.
4. **Biến mô hình hoá sai**: `ironLawGate: pass|fail|ack|warn` gộp 3 thứ độc lập — `ironLaw.level` config (`IRON_LAW_LEVELS = ['ask','warn']`, `src/setup/registrations.mjs:2176`), flag `--acknowledge-iron-law`, và item có `required` hay không. Combo `ack`+`warn`, `fail`+`warn` biến mất khỏi không gian. `source` là thuộc tính per-item (`classifySource`), không phải biến toàn cục — khi `readyPool:'n'` thì không xác định.
5. **Oracle "so sánh với pict"**: `pict`/`pictcli` không có trên máy (`which` → not found). Quan trọng hơn: covering array **không unique**; IPOG và PICT cho array khác nhau cùng hợp lệ. So sánh output là oracle sai. `pinnedCombinations` làm output khác thêm — câu hỏi trong đề đúng.
6. **Thiếu oracle expected-outcome**: `assertExpectedOutcome(t, combo, result)` — plan không nói expected đến từ đâu. Với 12 combo merge-next, phải viết tay 12 expected (chính là test thủ công đổi hình dạng) hoặc có decision-table/model (§3.6 brainstorm) — một thiết kế lớn hơn hẳn "IPOG 150-200 LOC". Mutation 0-survivor **không phát hiện oracle yếu** kiểu "không throw là pass".
7. "4 mutation từ investigation" là mẫu quá nhỏ để claim tương đương; batch2 cho thấy mỗi mutation bị bắt bởi 1-6 test — tức mỗi test giữ 1 guard riêng, và 12 combo pairwise không có lý do gì bao phủ 99 guard-witness hiện có nếu không được pin gần hết.

### (b) Bằng chứng
- Constraint violation: đọc trực tiếp §1.2.1 schema ví dụ.
- Nhánh sync-root: `src/verbs/merge/merge.mjs:109-151`.
- `IRON_LAW_LEVELS`: `src/setup/registrations.mjs:2176`; `wouldTripIronLaw`: `merge.mjs:71-78`.
- `pict` không có: `which pict pictcli` → not found; `npm ls | grep -i pict/pairwise/covering` → rỗng.

### (c) Đề xuất
- Oracle đúng cho generator = **pair-coverage checker** (~30 LOC): liệt kê mọi pair hợp lệ bằng brute-force Cartesian có lọc constraint (≤ 324 combo, rẻ), assert mọi pair xuất hiện trong ≥1 row. Chạy như property test trên schema ngẫu nhiên nhỏ. Không cần `pict`.
- Bộ test generator tối thiểu: (1) pair-coverage, (2) determinism, (3) pinned ⊆ output, (4) mọi row (kể cả pinned) thoả constraint — nếu pinned vi phạm, **generator từ chối schema ở load-time**, không âm thầm bỏ, (5) size ≤ max(|vi|×|vj|) + slack.
- Cân nhắc greedy AETG-style (~60 LOC, dễ verify) thay IPOG; với 3-5 biến × 3-6 giá trị, chênh size vài row không đáng để nhận rủi ro thuật toán phức tạp hơn.
- Bổ sung vào §1.2.3 nguồn expected-outcome: decision table per cluster (dữ liệu, commit vào repo), hoặc metamorphic relation; ghi rõ đây là phần việc lớn nhất của P1, không phải generator.
- Sửa schema ví dụ: tách `ironLawLevel`, `acknowledge`, `itemRequiresIronLaw`; sửa pinned #1 thành `readyPool:'empty'`; xoá ticket sai.

---

## 4. Selector promote quá sớm (Pillar 3)

### (a) Điểm yếu
1. **Metric vô nghĩa trên lịch sử**: `scripts/test-select.mjs:401` định nghĩa `patchRelatedMiss = related.status===0 && full.status!==0`. Replay trên commit đã merge (full xanh) → **miss = false theo định nghĩa**, không phụ thuộc manifest. "0 miss trên 50 diffs" được đảm bảo bởi cấu trúc, không phải bởi selector.
2. **Plan không đọc P05**: `plans/260920-immediate-test-feedback-reduction/reports/selector-shadow-evaluation.md` đã ghi replay lịch sử **bất khả thi** (manifest validate fail trên tree cũ; chạy test từ checkout cũ **làm hỏng `~/.fgos/config.json` toàn máy**), và đã pivot sang fault-injection (3 case). §3.2.3 của plan đề xuất lại đúng quy trình đã fail, còn dùng `git checkout $sha` trên checkout chính (vi phạm quy ước worktree của repo).
3. **Circuit breaker không có điểm quan sát**: CI (`.github/workflows/ci.yml:46`) chỉ chạy `npm test`. Không có nơi nào chạy related rồi full cùng SHA để so sánh. Sau promote, related chạy ở máy dev, full ở CI; không có ledger nối 2 kết quả → breaker không thể trip. Cần proof-provenance ledger (brainstorm §4.14 / Wave 5) — plan không có.
4. **Tín hiệu "full red" hiện là nhiễu**: `gh run list` — CI main **failure 7/8 run gần nhất** (09-18 → 09-21), 1 success 09-20. Breaker key theo "full red" sẽ trip liên tục vì lý do không liên quan, hoặc bị tune thành không bao giờ trip.
5. **Phân bố diff thật không khớp Phase 1 scope**: mô phỏng 50 commit `src/` gần nhất (09-16 → 09-22) với manifest hiện có + `src/verbs/state/*` (Phase 1): **related 0 / escalate 50** (20 FULL_TRIGGER, 30 unknown-path; unknown chủ yếu `src/runner/dispatch` 92 touch, `src/verbs/coordination` 16, `src/runner/coordination` 15). DoD "escalation ≤50%" và D-OPT-03 "50 diff chạm ≥3 area state/report/intake" **không thể đạt** trên lịch sử thật (state chỉ 3 touch/50 commit).
6. Con số nền sai: D-OPT-03 nói "~15-20 commit/tuần vào src/". Đo: **68 / 99 / 74 / 117** commit/tuần (4 tuần gần nhất). 50 diff ≈ 4-5 ngày, không phải 3 tuần — luận điểm "100 diff = 6 tuần delay" sụp.
7. Câu hỏi đề bài — "sau promote vẫn chạy full ở DoD": plan **có** giữ (ITR-D01, §3.2.4 "Full replacement KHÔNG BAO GIỜ"). Điểm này không phải lỗ hổng. Lỗ hổng là ở giữa: inner-loop related xanh → dev commit → DoD full chạy ở `fgos return`/CI, nhưng không ai ghi nhận đó là "related miss" để demote.

### (b) Bằng chứng
- `scripts/test-select.mjs:340-401` (runShadow, comparison).
- P05 report: đoạn "Methodology: what changed and why" và "Handoff".
- `.github/workflows/ci.yml:45-46`.
- `gh run list --workflow ci.yml --limit 8` (kết quả trên).
- Mô phỏng escalation: script regex trên `git log -50 --no-merges -- src/` + `git show --name-only`, dùng đúng `FULL_TRIGGERS` và `MANIFEST` của `test/test-ownership.mjs` + rule `src/verbs/state/*` giả định. (Là mô phỏng, không gọi `selectTests` thật; sai số nằm ở phía "related" — thực tế chỉ có thể escalate nhiều hơn vì rule cũng phải khớp test path.)
- Commit/tuần: `git log --since/--until --no-merges -- src/`.

### (c) Đề xuất
- Thay "50 historical diffs" bằng **fault-injection có kiểm soát**: mỗi rule manifest ≥1 mutation thật (như P05 đã làm 3 case), miss = "related không chọn file bắt được mutation". Đây là metric có ý nghĩa; historical replay chỉ dùng để đo escalation ratio/overhead, không đo miss.
- Circuit breaker: yêu cầu tối thiểu `test:related` ghi `{sha, decision, selectedFiles, status}` vào `.fgos/`-ngoài hoặc artifact; `fgos return`/CI đọc lại và so sánh cùng SHA. Nếu chưa có ledger → không promote; ghi rõ là dependency lên Wave 5.
- Đổi target area Phase 1 sang nơi diff thật tập trung (`src/runner/dispatch/*`, `src/verbs/coordination/*`) hoặc chấp nhận DoD escalation ≤50% là không đạt được trong Phase 1 và bỏ tiêu chí.
- Xoá `git checkout $sha` khỏi plan; nếu replay, dùng `git worktree add --detach` + symlink `node_modules` như P05 mô tả, và cô lập `HOME`/`~/.fgos` (P05 đã bị corrupt).

---

## 5. Dependency risk giữa 3 pillar

### (a) Điểm yếu
- Plan khẳng định P1 cần P2 ("business tests phải ở in-process trước"). Sai ở hai chỗ:
  1. **Runner covering-array độc lập với execution surface**: `for combo → buildFixture → run(cwd, argv) → assert` chạy qua subprocess y hệt; chỉ chậm hơn, không sai hơn.
  2. **Mâu thuẫn scope nội bộ**: P1 Phase 1 ưu tiên #1 là `merge next` (§1.3); P2 Phase 1 **loại `merge`** ("KHÔNG LÀM ngay: approve, merge, return", §2.3). Vậy P1's #1 target không bao giờ có nền P2 trong Phase 1. Cụm `read (list)` cũng vậy — `list` không có use-case fn (mục 2).
- Nếu P2 bị revert (parity drift), P1 không bị block về kỹ thuật — nhưng plan viết "P1 cuối, cần P2 xong" nên **lịch** bị block 9-11 ngày vô cớ.
- Phụ thuộc thật mà plan không ghi: P1 trên `merge next` cần **fixture factory git thật** cho ≥12 combo (`initGitCwdFast` 13.6ms + `add`/`move`/`toProposed` subprocess) — cost fixture, không phải cost subprocess của verb, mới là ràng buộc.
- P3 ↔ P2: nếu P2 tạo `test/direct/`, manifest phải thêm rule cho từng file direct (D-OPT-04 chỉ nói "file src mới", không nói test mới). Không có rule → `src/verbs/state/edit.mjs` đổi chỉ chọn CLI test (đã `todo`) → **related xanh giả**. Đây là dependency thật và nguy hiểm hơn cái plan ghi.

### (b) Bằng chứng
- §1.3 vs §2.3 của plan (trích trực tiếp).
- `fgos-read-5.test.mjs` đã gọi `graphUseCase` bên cạnh `run(...)` — chứng minh hai surface sống cạnh nhau, không có thứ tự bắt buộc.
- `test/test-ownership.mjs` `MANIFEST`: mọi rule đều liệt kê test path tường minh; không có auto-discovery (ITR-D07) → file direct mới vô hình với selector cho tới khi được thêm tay.

### (c) Đề xuất
- Ghi lại dependency: P1 **không** phụ thuộc P2; P1 phụ thuộc **fixture factory per cluster** (đo cost trước). Cho phép P1 chạy song song P2 trên cụm khác nhau.
- Thêm vào P2 DoD: "mỗi `test/direct/*.test.mjs` mới có rule manifest cùng commit; `validateManifest` + 1 test assert mọi file trong `test/direct/` được ít nhất 1 rule tham chiếu".
- Sửa D-OPT-05: nếu vẫn chọn thứ tự P2→P3→P1, lý do phải là budget/ROI, không phải "P1 cần P2".

---

## 6. Regression trong generator — test identity stability

### (a) Điểm yếu
- Tên test = `merge next: ${JSON.stringify(combo)}` (§1.2.3). IPOG mở rộng theo cột: thêm 1 giá trị cho biến thứ k làm **đổi nội dung mọi row** (horizontal growth ghi đè, vertical growth thêm row) → toàn bộ tên đổi. Thêm 1 biến → tên đổi 100%.
- Repo có tooling key theo tên: `scripts/test-timing.mjs:237-250` parse JUnit `<testcase name=…>` để so baseline (artifact `plans/reports/artifacts/…/junit.xml`). Đổi tên hàng loạt làm mất khả năng so timing/flake theo thời gian.
- Không có **golden snapshot** của array sinh ra → bug generator hoặc sửa schema đổi tập combo thực chạy mà **không có diff nào trong code review**. Đây là rủi ro lớn hơn tên test: coverage giảm âm thầm.
- Plan chỉ có "Formatter tên test từ combo metadata" (§1.4, rủi ro "Thấp") — giải quyết dễ đọc, không giải quyết ổn định.

### (b) Bằng chứng
- IPOG semantics: Lei & Tai 2002 — mỗi bước thêm parameter đều gán lại giá trị cho row hiện có.
- `scripts/test-timing.mjs` `parseJUnitTestcases` trả `{name, time, file}`.

### (c) Đề xuất
- **Commit array sinh ra** thành `test/covering/<cluster>.generated.json` + 1 test "generator(schema) deep-equals file" (drift check). Đổi schema → regenerate → diff hiện rõ row thêm/bớt, reviewer thấy coverage thay đổi.
- Tên test = `${cluster}#${witnessId ?? shortHash(combo)}` với hash content-addressed của combo (sorted keys). Row không đổi → tên không đổi; row pinned giữ tên witness. Metadata combo đưa vào `t.diagnostic()` thay vì tên.
- Ghi vào D-OPT mới: "schema chỉ được ADD giá trị/biến kèm regenerate + review diff; xoá giá trị cần mutation proof như xoá test" (đúng ITR-D13).

---

## Phát hiện ngoài 6 trục — 69 test đang chạy 2 lần

Tiền đề của plan ("investigation xác nhận không có trùng lặp; chi phí là do tổ hợp") **sai cho cụm merge/return**:

| File | Test | Trùng tên với file gốc | Dòng non-comment chỉ có ở bản copy | Wall (đơn lẻ) |
|---|---:|---:|---:|---:|
| `test/cli/fgos-merge-2.test.mjs` | 30 | **30/30** (`fgos-merge.test.mjs`) | 1 | 20.3s |
| `test/cli/fgos-return-2.test.mjs` | 14 | **14/14** (`fgos-return.test.mjs`) | 9 | 8.1s |
| `test/cli/fgos-return-3.test.mjs` | 14 | **14/14** | 4 | 9.0s |
| `test/cli/fgos-return-4.test.mjs` | 11 | **11/11** | 4 | 7.7s |

Nguyên nhân (git): `99e1b913` (tsk-25b, 2026-08-24) tách đúng — file gốc còn 0 bản `merge next on an empty store`. Commit kế tiếp `0a604617` "catch-up: merge main into fgw/tsk-25b, resolve test-file conflicts" **đưa toàn bộ nội dung đã tách trở lại file gốc**; bản copy giữ nguyên. Từ đó đến HEAD cả hai cùng tồn tại (đã kiểm tra tại `30455c2d`, `012af034`, `da5684af`, HEAD). Vài dòng lệch (9/4/4) cho thấy fix đã được áp cho **một** bản mà không áp cho bản kia — hazard bảo trì.

Hệ quả:
- ≈45s wall (đơn lẻ) và ~170 spawn git-heavy chạy thừa mỗi `npm test` — **lớn hơn toàn bộ tiết kiệm Phase 1 của Pillar 2** (24-74s CPU), đạt được bằng cách xoá 4 file, rủi ro 0 (ITR-D13 thoả: cùng invariant, cùng guard, cùng boundary, cùng body).
- Batch2 audit trên `merge.mjs` ghi M1 "1 test bắt" — không nhất quán với việc test đó tồn tại ở 2 file; audit khả năng chỉ chạy 1 file. Kết luận "không trùng lặp" cần được rerun trên toàn `test/cli/`.
- `fgos-post-merge-{2,3,4}` cùng split đó **không** bị trùng (0/14) — chỉ merge/return bị.

Kiểm tra nhanh toàn `test/cli/`: chỉ 4 cặp trên (và 1 test trùng tên `faults`↔`help`, chưa xem).

---

## Câu hỏi chưa giải quyết
1. Bản `fgos-merge-2`/`return-{2,3,4}` hay bản trong file gốc là "canonical"? Dòng lệch (9/4/4) là fix ở bên nào — cần diff từng test trước khi xoá.
2. Batch2 mutation audit cho `merge.mjs` chạy trên file nào? Nếu chỉ 1 file, số "catcher" của cả 4 mutation cần ×2.
3. Plan có chấp nhận extract logic khỏi `bin/fgos.mjs` (mục 2c) không? Không có nó, Pillar 2 Phase 1 thu hẹp còn ~10 test read + ~25 test edit + ~30 test stage.
4. Với phân bố diff thật (dispatch-heavy), Pillar 3 Phase 1 có còn đáng làm trước Pillar 1 không, hay đổi area?
5. Ledger `{sha, decision, status}` cho circuit breaker thuộc track nào — plan này hay Wave 5?
