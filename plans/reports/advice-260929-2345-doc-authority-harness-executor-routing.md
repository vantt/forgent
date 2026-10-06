# Tư vấn: chạy plan Documentation Authority Unification bằng harness fgOS, chọn đúng executor, có mutation

Ngày 2026-09-29. Plan: `plan/260925-documentation-authority-unification` (worktree `~/projects/forgentX-phase00-documentation-authority-unification`), phase 4–10.

## 1. Chẩn đoán

Harness **không bị đóng cứng về năng lực**. Nó chỉ đang **biểu đạt ý định ở sai tầng**:

| Tầng | Hiện tại | Hệ quả |
|---|---|---|
| Protocol | Master loop gán cứng `capability: code:*`, luôn chạy red-team ở vòng đầu | Docs bị định tuyến như code; tối thiểu 3–4 run mỗi vòng |
| Capability registry | Có `execute`/`review`/`advise` chung chung, không có vocabulary cho docs; `review` không có `prefer` | Không nói được "viết tài liệu thì openai, review thì opus" |
| Chọn model | `(executor, tier)` qua `runner.modelPolicies`. Ví dụ `claude.flagship = opus`, `claude.frontier = fable`, `openai.flagship = gpt-5.6-terra`, `openai.frontier = gpt-6-astra` | **Đủ dùng**; `actors[].model` bị cấm với declared protocol (`src/verbs/coordination/run.mjs:223`), nhưng tier thay được |
| Placement | `placementPolicy.readOnlyRedirects.claude` chuyển **mọi** thao tác read-only của claude sang `openai/codex-cli-bwrap` | "Claude opus review" bị đổi lặng lẽ sang openai, **trừ khi** ghim `invocation` tường minh (`hasExplicitInvocationPin`, `src/runner/dispatch/assignment-runner.mjs` ~1430) |
| Cửa mutating | Chỉ bước operation của declared protocol được ghi file (`--contract` từ chối `mutating`; `execute <executor>` dạng thường ghi vào `dispatch-runs/`, nơi Observe không đọc) | Mutation phải đi qua một protocol, mà hiện chỉ có master loop |
| Loader | Nạp protocol từ core, domain và project (`src/runner/definitions/protocol-loader.mjs:21-37`); `capability` là chuỗi tự do | **Thêm protocol cho docs là việc dữ liệu**. Bản nháp `doc-author-review-loop` đã qua `validateFlowDefinition` |

Kết luận: phần thiếu là **vocabulary cộng protocol cộng cấu hình khẩu vị**, không phải engine. Một chỗ cần sửa nhỏ trong engine: cho `prefer` (có `invocation`) của capability được tính là "ghim tường minh" trước redirect.

## 2. Nguyên tắc thiết kế (để hệ thống uyển chuyển)

1. **Tách ba lớp quyết định, mỗi lớp một chủ sở hữu:**
   - **Loại việc** (capability): do *plan/step* khai báo, ví dụ "đây là viết tài liệu", "đây là review tài liệu", "đây là code".
   - **Mức độ quan trọng** (tier): do *step* khai theo rủi ro (constitution, cutover dùng `frontier`; bài viết theo area dùng `flagship`; fresh-reader dùng `standard`).
   - **Khẩu vị** (executor, invocation cho từng capability): do *config* nắm (`runner.capabilities.<cap>.prefer`). Đổi khẩu vị thì chỉ đổi config, không đổi plan hay protocol.
2. **Protocol không biết executor:** protocol chỉ nói vai và luồng (tác giả → review → sửa → review lại; phản biện là tuỳ chọn). Nó không bao giờ tự chọn executor.
3. **Mutation ở quy mô lớn = phán đoán bằng LLM + máy móc bằng script:**
   - LLM viết văn bản đích, spec biến đổi và script.
   - Script làm phần di chuyển, đổi tên, viết lại link và bảng alias theo cách tất định.
   - Conservation gate (ledger của phase 3) là trọng tài.
   - Review tập trung vào **diff ngữ nghĩa và disposition**, không đọc lại hàng nghìn dòng đã được di chuyển máy móc.
4. **Chi phí tỉ lệ với rủi ro:**
   - Mỗi lát việc mặc định = 1 lượt tác giả + 1 lượt review.
   - Sửa và review lại chỉ chạy khi có finding.
   - Phản biện đa góc nhìn **chỉ ở cổng quyết định** (chốt phương pháp, cutover).
   - Không có red-team mỗi vòng.
5. **Song song theo ranh giới sở hữu:**
   - Mỗi area một worktree con, một tác giả (§5.4–5.5 của plan).
   - **Ledger chỉ có một người ghi là Lead**, commit tuần tự.
6. **Mọi thứ Observe được:** chỉ dùng cửa mà Observe đọc được (assignment run, coordination session). Mỗi phase một case; đóng session tường minh.

## 3. Cần bổ sung vào fgOS (plan fgOS riêng, chạy trước track)

| # | Việc | Loại | Ghi chú |
|---|---|---|---|
| 1 | **Vocabulary docs** trong registry (`src/setup/registrations.mjs` `CURATED_CAPABILITY_NAMES`, kèm setup/doctor theo install gate): `docs:author` (mutating, `serves: {outputKind: change, domain: docs, mutates: true}`), `docs:review` (read-only, confinement `host-write-denied`), `docs:object` (read-only, phản biện quyết định), `research` (read-only, fresh-reader và audit) | dữ liệu + registry | Theo đúng khuôn `code:*` đã có |
| 2 | **Khẩu vị trong `.fgos/config.json`** (ví dụ, anh chốt): `docs:author.prefer = [{executor: openai, invocation: <codex có quyền ghi>}]`; `docs:review.prefer = [{executor: claude, invocation: claude-cli-readonly}]`; `docs:object.prefer = [{xai}, {gemini}]`; `research.prefer = [{gemini}, {xai}]` | config | Tier do step hoặc protocol khai |
| 3 | **Engine:** coi `prefer` có `invocation` của capability là ghim tường minh, để readOnlyRedirect không đè lên | code nhỏ | Nếu không làm, "opus review" bị chuyển sang openai |
| 4 | **Protocol core `doc-author-review-loop`**: author(`docs:author`) → reviewer(`docs:review`, `distinctProviderFrom: required`) + objector(`docs:object`, driver-authorized) → revise (driver-authorized) → recheck (driver-authorized) | dữ liệu | Bản nháp đã validate; đổi capability sang `docs:*` |
| 5 | **Smoke thật trong worktree tạm:** một lát tài liệu nhỏ đi hết vòng; kiểm cổng mutating chấp nhận `docs:author`, và Observe thấy session cùng run | kiểm chứng | Chỉ đây mới chứng minh được cổng mutating |
| 6 | **Kiểm chạy song song:** memory ghi "assignment-id allocator races" khi chạy nhiều `coordination run` cùng lúc | kiểm chứng | Chưa xác nhận đã sửa thì phase 6 chạy tuần tự từng area |
| 7 | (Sau) facade `fgos-doc-change` giống `fgos-code-change`, để Lead khỏi viết request JSON bằng tay | skill | Không chặn |
| 8 | (Rule of three) protocol có **capability slot** được bind theo request, để một đồ thị phục vụ cả code và docs | engine | Chỉ làm khi xuất hiện domain thứ ba |

## 4. Bảng gán cho từng phase và deliverable

Ký hiệu: **A** = `doc-author-review-loop` (mutating); **R** = review `agent-led` read-only; **O** = phản biện quyết định (`group-thinking-rfc-review-lite` hoặc objector của A); **F** = fan-out research read-only (`independent-research-fan-out-fan-in`); **S** = script tất định do Lead chạy (code viết qua `code:implement`, review qua `code:review`); **L** = Lead tự làm (nhỏ). Executor theo khẩu vị mặc định đề xuất ở §3 mục 2.

### Phase 4: Freeze constitution và migration method (Decision + Code)

| Deliverable | Cơ chế | Tác giả (tier) | Kiểm | Vì sao |
|---|---|---|---|---|
| Constitution (schema máy đọc được) | A | openai `frontier` | opus review + **O** | Nền của cả chương trình; sai là lan rộng |
| Ledger schema, target path rules, conflict-resolution procedure | A | openai `flagship` | opus | Văn bản quy tắc |
| Conservation checker, retirement-check dry-run, candidate-status check | S | `code:implement` (codex) | `code:review` opus | Code tất định; test là bằng chứng |
| Legacy-path ratchet | L | — | chạy test | Đã có từ phase 2, chỉ nối vào |
| Alias table và resolver contract | A | openai `flagship` | opus | Contract; resolver code để phase 9 |
| Evidence relocation policy cùng consumer proof | F rồi A | F: gemini + xai `standard`; A: openai | opus | Cần kiểm kê consumer trước khi viết policy |
| Cutover lease design | A | openai `frontier` | opus + **O** | Khoá writer toàn repo; rủi ro cao |
| Danh sách field hoãn sang engine tương lai | L | — | trong review chung | Nhỏ |
| **Cổng phase** | **O** trên quyết định "freeze method" | xai + gemini (`flagship`) | Lead tổng hợp, anh chốt | Quyết định khoá, khó đảo |

### Phase 5: Dual pilot (điểm then chốt để hiệu chỉnh)

| Deliverable | Cơ chế | Tác giả | Kiểm |
|---|---|---|---|
| Pilot A re-audit host-invocation-routing | F: 2 auditor độc lập (gemini, xai `flagship`), rồi Lead diff | — | Discrepancy report viết bằng A (openai), review opus |
| Pilot B transform work-state + `io-contract.md` | A trong worktree con | openai `frontier` | opus; conservation bằng S sau mỗi commit |
| Link rewrite preview, alias lookup test | S | codex | `code:review` |
| Fresh-reader review (6 câu L5, không briefing) | F, 2 reader chưa từng thấy area | gemini + xai `standard` | Lead chấm theo pass criteria |
| Sửa method/constitution | A | openai `flagship` | opus |

**Khuyến nghị:** phase 5 cũng là **pilot cho chính harness**. Đo bằng Observe: số run, token, verdict, can thiệp tay. Hiệu chỉnh khẩu vị và tier trước phase 6, phase tốn nhất.

### Phase 6: Transform tất cả area (tốn nhất, mutation nặng nhất)

| Việc | Cơ chế | Chi tiết |
|---|---|---|
| Mỗi target area | A trong worktree con của area | openai `flagship` (`frontier` cho area phức tạp như agent-coordination); opus review; **không** có objector |
| Di chuyển, đổi tên, viết lại link, portal | S | Script sinh một lần, chạy tất định; review diff script, không review từng file |
| Conservation sau mỗi commit | S | Lead chạy; fail thì dừng area đó |
| Ledger, final ledger destination | L | Lead ghi tuần tự |
| Song song | Tuần tự cho tới khi xác nhận allocator race đã sửa; sau đó 2–3 area một lúc (DAG, area không chồng nhau) | Plan §5.5: không bao giờ hai worker cùng area hoặc cùng ledger |

### Phase 7: Cross-area integrity và fresh-reader

| Chiều review | Cơ chế |
|---|---|
| One owner per claim, generated projection khớp source | S (gate và inventory) |
| Contract producer/consumer, vocabulary, separation, boundary, intent, evidence | F: mỗi lens một researcher; provider khác tác giả (claude opus hoặc gemini pro, `flagship`) |
| Newcomer navigation, stranger test (L5) | F: fresh-reader tier `standard`, không briefing |
| Sửa lỗi tìm ra | A (openai) + R (opus) |

### Phase 8: Loại bỏ bypass và chuẩn bị consumer (chủ yếu code, skill, instruction)

| Việc | Cơ chế |
|---|---|
| AGENTS/CLAUDE, instruction sources, reading maps, portal | A (openai) + opus; phải kiểm anchor L8 và projection |
| Skills, prompt templates | S hoặc `code:implement`: sửa ở `core/skills`, rồi `npm run build:skills` (memory: `.agents/` là render target) |
| CLI help, setup/doctor, generator, test, fixture, comment | S (thay path hàng loạt) + `code:review` opus |
| Shipped conventions (quyết định 11) | F: kiểm tác động lên project dùng fgOS, trước khi sửa |

### Phase 9: Atomic cutover

| Việc | Cơ chế |
|---|---|
| Quyết định cutover | **O** tier `frontier` + phê duyệt tường minh của anh |
| Chuỗi 10 bước (lease, inventory lại, xoá, alias, regenerate, enforcement) | **S tuần tự do Lead chạy**; LLM không viết mới ở bước này |
| Diff cutover | `code:review` + `docs:review` opus; chạy suite đầy đủ |

### Phase 10: Maintenance MVP (`fgos doc …`)

| Việc | Cơ chế |
|---|---|
| Verb `fgos doc classify/new/check/inventory/retirement-check` | `code:implement` **bằng Rust native** (vision Node→Rust), khuôn giống Observe + `code:review` opus |
| Tài liệu cho verb | A + R |

## 5. Observe cho track này

- Mỗi phase một case (`fgos metrics case open doc-authority-p<N> --harness fgos`); đóng case kèm `--sessions` gồm mọi session A/R/O/F của phase đó.
- **Chỉ số nên theo dõi:**
  - run theo capability và executor (verdict tách khỏi lỗi hạ tầng sau plan RunResult);
  - token theo executor: codex có `totalTokens`, claude lấy từ transcript;
  - số lượt review lại mỗi lát việc;
  - can thiệp tay;
  - số conservation fail.
- **Điều kiện trước:** follow-up của plan Observe (sửa transcript cho worktree ngoài `.claude/worktrees`, stage lại đúng quy trình) và plan RunResult.

## 6. Thứ tự đề xuất

1. Xong follow-up Observe và plan RunResult.
2. **Plan fgOS "docs capabilities + doc-author-review-loop"**: §3 mục 1–6, khoảng 1,5–2 ngày, smoke thật.
3. Cập nhật track: thay §7.2 bằng bảng ở §4, thêm `blockedBy` plan fgOS mới.
4. Chạy **phase 4**, rồi **phase 5 như pilot của harness**; hiệu chỉnh khẩu vị, tier và ngân sách dựa trên số liệu Observe.
5. Phase 6 trở đi theo số liệu.

## 7. Câu hỏi cho anh

1. **Khẩu vị:**
   - viết tài liệu: openai `frontier` (gpt-6-astra) hay `flagship` (gpt-5.6-terra)?
   - review tài liệu: claude opus (`flagship`) hay fable (`frontier`) cho các cổng quan trọng?
   - phản biện: xai + gemini pro?
   - viết code/script: codex hay claude sonnet?
2. **Engine fix (§3 mục 3):** đồng ý để `prefer` có `invocation` được tính là ghim tường minh, thắng readOnlyRedirect?
3. **Vocabulary:** tạo `docs:*` riêng (đề xuất), hay tái dùng `execute`/`review` chung?
4. **Song song ở phase 6:** chấp nhận chạy tuần tự tới khi xác nhận allocator race đã sửa?
5. **Ngân sách:** trần số run hoặc token mỗi phase, để Lead dừng và hỏi khi vượt?

## 8. Quyết định của anh (2026-09-30) và trả lời câu 4

**Khẩu vị đã chốt:**

| Capability | Executor | Tier (model) |
|---|---|---|
| Viết tài liệu (`docs:author`) | openai | `flagship` (gpt-5.6-terra) |
| Review tài liệu (`docs:review`) | claude, invocation `claude-cli-readonly` | `flagship` (opus) |
| Phản biện quyết định (`docs:object`) | claude, invocation `claude-cli-readonly` | `flagship` (opus) |
| Viết code/script (`code:implement`) | gemini | theo cấu hình hiện có |
| Review code (`code:review`) | claude readonly | `flagship` (opus); khác provider với gemini |
| Research/fresh-reader | gemini, xai | `standard` |

**Ngân sách:** không áp trần. Observe chỉ đo, không chặn.

**Câu 4: hệ có chạy được song song và tuần tự không? Có. Đã kiểm bằng code và test chạy ngày 2026-09-30:**
- **Tuần tự:** đường bình thường của coordination.
- **Song song trong một session (DAG):** các node chỉ-đọc độc lập chạy chồng lên nhau, và cạnh phụ thuộc được tôn trọng. `test/runner/coordination-dag-concurrency.test.mjs`: 9/9 xanh (chồng node, diamond fan-in, trần concurrency, writer trùng được tuần tự hoá, writer xung đột bị chặn trước khi ghi).
- **Song song nhiều session / nhiều process:** assignment id được claim nguyên tử bằng `mkdirSync` kèm retry khi EEXIST (`store.mjs:1031` → `claimAssignmentId`). `test/runner/dispatch-assignment-id-claim-concurrency.test.mjs`: hai process OS thật cùng `writerId` và cùng operation vẫn ra id khác nhau (xanh).
- **Ghi file song song:** dispatch giữ lock theo từng `cwd`, nên hai bước ghi **cùng một worktree** sẽ bị tuần tự hoá, và đó là điều đúng. Muốn song song thật thì mỗi area một worktree riêng; plan §5.4–5.5 vốn đã yêu cầu vậy.
- **Sự cố 15/9** (memory): claim nguyên tử đã có từ 1/9, nên nguyên nhân sự cố **chưa xác định được**; có thể do track đó chạy code của nhánh khác. Plan fgOS sẽ có **một smoke song song thật** (2 area, 2 worktree) để chốt trước phase 6. Đây không còn là giả định "không chạy được".
