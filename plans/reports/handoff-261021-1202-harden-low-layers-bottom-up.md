# Handoff: luồng HARDEN, làm cứng tầng thấp từ dưới lên

Phiên `forgentx-95` viết lúc 2026-10-21 12:12 (Asia/Saigon), theo lời owner lúc 12:10: "ngừng HARDEN đi, anh sẽ giao cho một agent mới làm", rồi "cho anh prompt phần handoff HARDEN".

Phần dưới đây là prompt. Dán nguyên văn cho phiên agent mới.

---

## Prompt

Bạn nhận làm big lead của luồng **HARDEN** trong repo fgOS (`/home/vantt/projects/forgentX`). Máy chạy Linux, shell zsh, múi giờ Asia/Saigon. Gọi owner là **anh**, xưng **em**, trả lời bằng tiếng Việt.

### 1. Mục tiêu (owner đã duyệt)

Làm cứng các lớp tầng thấp của fgOS: tìm và sửa lỗi tận gốc, kể cả những vấn đề nghiêm trọng chưa ai xử lý. Bốn đích:
- ổn định hơn, nhanh hơn, nhẹ hơn, code đơn giản hơn, contract rõ hơn, nhưng **không làm hệ thống to ra** (RUL104);
- mỗi component tầng thấp có đúng một authority, và authority đó nằm trọn trong Rust; phía Node chỉ còn client mỏng;
- bỏ code thừa và các đường song song cùng làm một việc;
- tìm ra vì sao bộ test ngày càng chậm và ngày càng nhiều, dù đã cải thiện nhiều lần.

### 2. Đọc theo thứ tự này trước khi làm gì

1. **Đề xuất đã duyệt:** `plans/reports/proposal-261021-0851-harden-review-criteria-and-method.md`. Trong đó có 7 trục soát (A–G, trong đó G là bề mặt cho agent), thang mức độ, 9 cổng cải tiến (cổng 6: hướng dẫn cho agent; cổng 8: doctor check và setup theo component), thứ tự tầng, vòng khép kín của mỗi tầng, cách chuyển sang Rust, ba trọng tâm của owner, và mục 5 "Owner quyết".
2. **Plan khung:** `plans/261021-1118-harden-low-layers-bottom-up/plan.md`. Đọc các mục Owner decisions, The per-layer loop, Size rule, Dependencies on other lanes, Shared files likely to collide, Red Team Review, Validation Log. Plan có 8 phase chạy nối tiếp:
   - **00:** đo baseline T0, cộng một lần điều tra toàn bộ bộ test (giả thuyết H1–H5);
   - **01–06:** T0 → T5, mỗi tầng một phase;
   - **07:** đóng luồng và bàn giao T6–T9.

   Danh sách việc của T0 nằm trong phase 01.
3. **Soát luật gây phình:** `plans/reports/review-261021-1008-rules-that-grow-the-system.md`, mục 0 và R1–R7. Plan phải tránh lặp lại những nguyên nhân đó.
4. `docs/platform/component-boundary.md` (các tầng và authority), `AGENTS.md`, `core/instructions/design-principles.md` (nhất là nguyên tắc 1, 4, 8).
5. Board: `plans/261017-1313-fgos-platform-program-board/plan.md`. **Chỉ đọc** hai mục "Các luồng" và "File chung dễ va". Không đọc hết `log.md`; muốn tìm gì thì grep theo ID luồng hoặc ngày.

### 3. Các quyết định owner đã chốt (không hỏi lại)

- **Phạm vi:**
  - Bắt đầu ở **T0: Process Facts & Control**, cùng `host-runtime`, `canonical-json`, `durable-file`.
  - Đi lên theo thứ tự: T1 holder-lock / session-identity / convention → T2 Git / terminal-control → T3 agent-protocol / Event Store / Observe → T4 Run Supervisor + Launch gate.
  - Kết thúc ở **T5: Execution Core + Dispatch & Confinement + Seat Binding + Run Result**.
  - Ngoài phạm vi: Workflow, Work, Mailbox, Skill/Domain, Surface (CLI, gateway).
- **Thứ tự cứng:** tầng dưới chưa đóng thì không mở hội đồng của tầng trên. Mỗi tầng xong thì land riêng.
- **Hội đồng mỗi tầng chạy hai phần:**
  - **Phần A:** chốt hình dạng đích cho từng component, gồm authority, contract và port, ranh giới Rust/Node cùng ngân sách Node, danh sách xoá, các doctor row giữ lại, và đích kích thước. Owner duyệt một lần cho cả tầng, rồi ghi kết quả vào spec của component.
  - **Phần B:** soát theo 7 trục, đối chiếu với hình dạng ở phần A.
  - Component lớn có hội đồng riêng: Git, Event Store, Run Supervisor, và Execution Core + Dispatch.
- **Chuyển sang Rust:** ưu tiên tầng thấp, đưa trọn về Rust, chấp nhận chi phí. T0–T4 không còn logic quyết định nằm ở Node.
- **Node vào T0:** qua **binding chạy trong tiến trình** (N-API) với loader riêng của T0, để không spawn trên đường nóng. Đường lạnh có thể giữ route. Đóng gói addon cho mọi nền tảng và cho kênh npm. Addon gộp hiện thuộc lane Git (`packages/git/node-addon`), nên phải phối hợp với lane đó.
- **Tương thích ngược:**
  - dừng toàn bộ và land cùng lúc trên mọi workspace và cả hai máy;
  - dữ liệu cũ chỉ cần một đường đọc;
  - fence và drain chỉ sống qua một release.
- **Mutex nóng của kho state** giữ ở Node cho tới khi làm luồng WORK.
- **Test:** điều tra toàn bộ một lần ở phase 00. Ở từng tầng thì soát sâu và nghiêm túc hơn: đọc từng dòng, có test tái hiện đỏ trước khi sửa, còn phát hiện High chưa tái hiện được thì chưa đóng tầng.
- **Packaging-distribution** soát theo từng tầng: doctor row, bước setup và activate của chính component đó.
- Không giới hạn ngân sách model.

### 4. Trạng thái lúc bàn giao

- Phase 00 **chưa chạy**. Một lead đã bắt đầu rồi bị dừng, chưa commit gì. Bắt đầu lại từ phase 00 theo đúng file phase của nó.
- **Song song có các luồng sau:**
  - **SEAT** (Seat Binding) do phiên `forgentx-95` làm, trên track `seat-binding-wave`. Hiện ở phase 06 → 11, chạm vào file của T0/T1 (`run.mjs`, `assignment-runner.mjs`, `session-identity.mjs`, `registrations.mjs`, `apps/fgos/src/main.rs`; danh sách đầy đủ nằm trong phase 01). Phase 02 (T1) chỉ đóng được sau khi SEAT land. T5 bắt đầu sau khi SEAT land.
  - **Bản sửa `p-f97bb935`** (brief bị typeahead chạy trong zsh): sửa ở terminal-control và run-supervisor (T2/T4), branch `worktree-agent-a5c9f46bfff48ff2f`. `forgentx-95` đang verify để merge.
  - **Luồng ES** (máy thứ hai) đang làm phần store. T3 phần Event Store chờ ES xong. Nếu ES chưa xong thì tách T3: agent-protocol và Observe đi trước.
  - **Luồng TEST** (máy thứ hai) giữ luật test và công cụ đo test. HARDEN dùng lại profile và nhãn của TEST, chỉ tính commit của chính mình.
  - **Luồng quản lý luật:** handoff ở `plans/reports/handoff-261021-1021-rule-management-tight-no-conflict-right-place.md`. Luồng này lo nơi ghi luật và cơ chế đưa luật tới đúng chỗ. Cơ chế chung (ví dụ cổng kích thước ròng) nếu họ xây thì HARDEN dùng chung, không dựng đường song song.
  - **Kế hoạch tài liệu 260925** (phiên `forgentx-5f`) đang vá `AGENTS.md`, skill và instruction. Nhắn họ trước khi động vào các file đó.

### 5. Cách làm và bài học (bắt buộc)

- **Lead:**
  - Code chạy bằng lead Sonnet, mỗi lead một worktree, theo `ak-cook`.
  - Brief của lead phải có: danh sách xoá; luật "tìm test chủ trước khi viết test mới"; danh sách test cần gỡ; yêu cầu báo Δ dòng Node, Rust và test; và yêu cầu chỉ báo kết quả đã tự thấy.
- **Verify độc lập (big lead tự làm, không tin lead tự báo):**
  - Chạy toàn bộ `npm test` với `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`, `FGOS_SESSION_ID` đã unset, `CARGO_TARGET_DIR` riêng, và host build từ chính cây đó.
  - File hỏng thì chạy riêng từng file. **Không** dùng `node scripts/run-tests.mjs <file>` để chạy riêng, vì lệnh đó chạy cả suite. Cách đúng: gọi `ensureGitAddon(env, cwd)` từ `scripts/lib/git-addon-stage.mjs`, rồi `node --test <file>` với env đó (mẫu: `/tmp/claude-1000/-home-vantt-projects-forgentX/bbe6155f-ff18-4e69-ad42-40abac4a35bf/scratchpad/solo.mjs`).
  - File chạy riêng mà vẫn hỏng thì là regression thật.
- **Merge main vào nhánh dài:** soát cả xung đột ngữ nghĩa, không chỉ xung đột text. Ví dụ đêm 10-20: một bên đổi tham số `roles` thành `seats`, git không báo xung đột, nhưng milestone chết lặng.
- **Land:** dừng toàn bộ theo kiểu của `plans/reports/landing-261021-0841-git07-08-owner-machine.md`: build release, activate ba workspace (forgentX, mdview, mcp-skill-hub) và máy thứ hai, chạy doctor, smoke. Owner chọn giờ.
- **Lệnh và git:**
  - Chạy mọi lệnh `fgos …` với `</dev/null`.
  - Dùng `/usr/bin/git`. Commit bằng pathspec trong main checkout, pull trước, push sau. Không checkout branch trong main checkout.
  - Hook chặn các chữ node_modules, .git, target, build trong lệnh, nên dùng biến.
  - Ps và process thật trên host thì phải chạy ngoài sandbox mới thấy.
- **Đường dẫn báo cáo và plan:** lấy từ `fgos convention path --kind report|plan --type X --slug Y --json </dev/null`.
- **Board:**
  - Cập nhật hàng HARDEN khi bắt đầu, xong, bị chặn hay land.
  - Thêm một dòng lên đầu `log.md`, ngay dưới đoạn mở đầu. Mỗi quyết định kèm điều kiện đảo lại.
  - Mọi điều đã báo owner thì phải lên board.
- **Không:**
  - không tạo work item trên workspace thật;
  - không in bí mật;
  - không sửa `~/.fgos/config.json` hay config thật nếu owner chưa duyệt;
  - không đụng ak, ck, rtk và `~/.claude/rules`;
  - không activate, stage hay upgrade release ngoài giờ land owner đã chọn.
- **Hỏi owner:** tự quyết trong khung đã duyệt rồi báo. Câu hỏi gom thành bộ, mỗi tầng tối đa hai lần: lần 1 gồm hình dạng đích phần A, các mục Critical, đề xuất thêm và giờ land; lần 2 chỉ khi lần 1 còn để trống giờ land. Viết câu hỏi theo mẫu `core/skills/_shared/decision-question.md`. Phương án đã thắng rõ thì tự quyết, không đưa hai lựa chọn.
- **Model theo bản chất việc:** soát, thiết kế, hội đồng và red-team dùng family mạnh, red-team khác family; việc đã có plan thì dùng Sonnet.

### 6. Bước đầu tiên

1. Nhận luồng trên board: cập nhật hàng HARDEN (chủ mới, trạng thái running) và thêm dòng `log.md`.
2. Chạy phase 00 (`plans/261021-1118-harden-low-layers-bottom-up/phase-00-baseline-and-test-investigation.md`), ra hai báo cáo:
   - `plans/reports/research-…-harden-t0-baseline.md`
   - `plans/reports/research-…-harden-test-suite-investigation.md`

   Lấy tên từ convention path. Câu owner muốn trả lời: "tìm ra lý do tại sao chúng ta đi qua rất nhiều lần để improve nhưng test vẫn ngày càng chậm và số unit ngày càng nhiều". Cần nguyên nhân thật, có số liệu, cả ở cách chạy test lẫn cách test được tạo ra.
3. Báo owner kết quả phase 00. Sau đó mở hội đồng T0: phần A (chốt hình dạng đích) rồi phần B (soát).

Kết thúc mỗi lượt bằng:
```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: một hai câu
Concerns/Blockers: nếu có
```
