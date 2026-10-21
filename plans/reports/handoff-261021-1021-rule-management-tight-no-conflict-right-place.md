# Handoff: quản lý luật chặt chẽ, không xung đột, không dư thừa, tới đúng nơi cần

Viết bởi `forgentx-95` lúc 2026-10-21 10:21 (Asia/Saigon), theo yêu cầu của owner lúc 10:20: "viết 1 prompt để handoff qua tiến trình khác đi để xác định và tối ưu hóa việc quản lý luật chặt chẽ, không xung đột luật, không dư thừa luật và đưa luật đến đúng nơi cần".

Phần dưới đây là prompt, dán nguyên văn cho một phiên agent mới.

---

## Prompt

Bạn nhận luồng **quản lý luật** của repo fgOS (`/home/vantt/projects/forgentX`). Máy là Linux, shell zsh, múi giờ Asia/Saigon. Owner xưng **anh**, bạn xưng **em**, trả lời bằng tiếng Việt.

### 1. Mục tiêu

Luật của repo (instruction, rule, nguyên tắc, luật khoá, quyết định) phải đạt năm điều:
1. **Chặt chẽ:** mỗi luật quan trọng có máy kiểm, hoặc có lý do rõ vì sao chỉ là văn bản.
2. **Không xung đột:** không có hai luật bảo hai điều trái nhau.
3. **Không dư thừa:** mỗi luật chỉ có **một nhà**; nơi khác trỏ về nhà đó chứ không chép lại.
4. **Tới đúng nơi cần:** đúng agent, đúng vai (big lead, lead, worker, reviewer), đúng lúc (luôn nạp, hay chỉ nạp khi làm việc đó), với số token ít nhất.
5. **Không phình theo thời gian:** thêm luật mới thì phải nói nó thay luật nào, hoặc vì sao không thay luật nào.

Đây là quyết định kiến trúc (component boundary). Hãy làm theo RUL104, "tốt hơn, không to hơn": gom, xoá, đưa luật tới đúng chỗ. Chỉ thêm cơ chế khi owner chọn.

### 2. Bằng chứng đã có (đọc trước)

- **Kiểm kê 14 nơi ghi luật và lý do luật không hiệu quả:** `plans/reports/review-261021-1008-rules-that-grow-the-system.md`, mục 0 và mục 2.
  - Mỗi lượt, một agent Claude nạp khoảng 56 KB luật.
  - "Dùng lại trước khi thêm" bị chép ở 8 nơi.
  - Luật "một bằng chứng / gỡ test theo cơ chế" (`fb8c6e4ae`, 10-20) không tới được phase file, brief và `ak-cook` là ba thứ lead thật sự làm theo.
  - Luật "không cần tương thích ngược" mâu thuẫn với việc fgOS đang cài thật trên 3 workspace × 2 máy.
- **Luồng INS** trên board (`plans/261017-1313-fgos-platform-program-board/plan.md`, hàng INS) và báo cáo nguồn `plans/reports/research-261016-1118-agent-code-quality-guardrails.md`. Đọc toàn bộ, nhất là mục 0, 2 (2a–2d: bảng nạp đo thật cho 4 CLI), 4 (đề xuất P1–P7), 6 và các câu Q4–Q7. Phần làm tay đã land ngày 10-17 (`f9ea9c219`, `40c667c83`); phần cơ chế (nhóm A) ở trạng thái `not-planned`.
- **Quyết định D6 đang chờ owner** (hàng D6 trên board):
  - Q4: khoá 7 nguyên tắc thành luật, hay để ở dạng `procedure`;
  - Q5: xử lý trần 32 KiB của codex;
  - Q6: danh sách luật sinh ra từ nguồn nào;
  - Q7: quyết định 10-06 "không sửa đồ của ak/ck" còn hiệu lực không.
- **Agent Context Engine:**
  - RUL102 ở `docs/specs/distribution.md:362`: một owner duy nhất cho việc ghép instruction của agent;
  - `docs/platform/proposals/documentation-system-unification.md` §4.6 và §4.7.2;
  - `docs/platform/intent-preservation-ledger.md` PF-I007: "preserved future";
  - code hiện có: `src/setup/instruction-composition.mjs`, `src/setup/instruction-projections.mjs`, `.fgos/instructions/effective/`, cùng phần "fgOS Effective Instructions" được render vào `AGENTS.md` từ `core/instructions/*.md`.
- **Luồng TEST** (máy thứ hai) sở hữu luật test và công cụ đo test: `plans/reports/counsel-261020-1658-test-suite-growth-rule.md`, `plans/reports/phase-lead-261020-1748-test-governance-rule-and-first-cleanup.md`, dòng `suite:`, `test/suite-baseline.json`.
- **Điều tra harness 10-06:** `plans/reports/harness-investigation-261006-synthesis.md` (vì sao agent vẫn làm tùm lum; còn treo Q6–Q9).
- **Skill `instruction-audit`** đã có: soát bề mặt instruction, nạp trùng, hook trùng, luật không có máy kiểm. Dùng nó.
- **Backlog `p-7eb9e65b`:** fgOS và AgentKit (`ak`) ghi đè registration của nhau.

### 3. Phạm vi

**Phạm vi gồm** mọi nơi ghi luật:
- `AGENTS.md`;
- `CLAUDE.md` (chỉ được `@AGENTS.md`);
- `core/instructions/*`;
- `.claude/rules/*` (project);
- `docs/platform-foundations.md` và `docs/specs/platform-foundations.md`;
- phần "Lịch sử quyết định" và các RUL trong `docs/specs/*.md` và `docs/platform/*/spec.md`;
- `docs/decisions/index.md` (file sinh ra);
- `domains/*/AGENTS.md`;
- `core/skills/_shared/*` và `core/skills/*/SKILL.md` (kèm bản render ở `.agents/skills`, `plugins/fgOS/skills`; không sửa tay bản render, sinh lại bằng `npm run build:skills`);
- mẫu brief và mẫu plan mà fgOS dùng;
- hook nạp luật;
- máy kiểm luật: `test/architecture.test.mjs`, `docs/architecture-manifest.json`, `.githooks/pre-commit`, `scripts/check-*.mjs`, các doctor row liên quan.

**Ngoài phạm vi, không đụng:**
- `~/.claude/rules/*`, các skill `ak-*`/`ck`, `rtk`. Đây là dự án của người khác. Chỉ đo và thiết kế quanh chúng, trừ khi owner trả lời Q7 khác đi.
- `~/.fgos/config.json` và config thật của mọi workspace.
- Luật test chi tiết: thuộc luồng TEST. Bạn chỉ lo đưa luật đó tới đúng nơi và gỡ bản trùng.
- Những phần dành cho luồng HARDEN và SEAT (mục 4).

### 4. Phần đã giữ lại ở phiên `forgentx-95` (đừng làm trùng)

- **Brief cho lead của SEAT và HARDEN:** `forgentx-95` tự sửa mẫu brief của mình. Brief sẽ bắt lead tìm test chủ, liệt kê test cần gỡ và báo Δ dòng Node/test. Riêng SEAT có thêm mốc đo sau phase 08.
- **Trục G (bề mặt cho agent) và cổng 6 (hướng dẫn cho agent rõ, nhẹ, không trùng)** của HARDEN, áp cho các component foundation khi soát từng tầng: `plans/reports/proposal-261021-0851-harden-review-criteria-and-method.md`.
- **Ngân sách Node cho từng foundation** và cổng kích thước ròng khi soát từng tầng: HARDEN đo và áp theo tầng.

Nếu bạn xây cơ chế chung (ví dụ cổng kích thước ròng trong `npm test`/doctor, hay lớp "plan addendum" fgOS sở hữu đặt cạnh `ak-plan`/`ak-cook`), hãy báo `forgentx-95` qua SendMessage để HARDEN và SEAT dùng chung, đừng tạo đường song song.

### 5. Luồng đang chạy có chồng lấn (phối hợp trước khi sửa)

- **Kế hoạch tài liệu 260925** (`plans/260925-documentation-authority-unification/`): phiên `forgentx-5f`, nhánh `plan/260925-documentation-authority-unification`, worktree `/home/vantt/projects/forgentX-phase00-documentation-authority-unification`.
  - Đang ở Phase 8 và đã có bản ghi vá cho 331 file instructions/skills/comment/help.
  - Chỉ land ở Phase 9.
  - Trước khi động vào `AGENTS.md`, `core/instructions` hay skill, nhắn `forgentx-5f` để biết file nào họ đang vá. Đừng sửa cùng file song song.
- **Luồng TEST** (máy thứ hai): luật và công cụ test.
- **Luồng MAIL** (mailbox, phiên `d50dc90b`): instruction chèn vào phiên agent.

### 6. Cách làm

1. **Prior art trước khi thiết kế** (`AGENTS.md`, mục "Prior art before design"). Chạy `git log -S`/`-G` trên `instruction-composition`, `effective instructions`, `RUL102`, `AGENTKIT`, `core/instructions`. Ghi rõ cái gì đã có, cái gì bị gỡ, và việc gỡ đó có cố ý không.
2. **Sổ luật:** một bảng, mỗi dòng một luật, gồm các cột:
   - id (L, RUL, D-ADR, nguyên tắc, hoặc chưa có);
   - nội dung một câu;
   - nhà hiện tại, và mọi nơi bị chép lại;
   - ai cần luật này (vai, CLI), khi nào cần;
   - có máy kiểm chưa (cái nào);
   - xung đột với luật nào;
   - đề xuất: giữ / gom / xoá / đổi nhà / thêm máy kiểm.

   Đo token mà mỗi CLI (Claude, Codex, omp/pi, agy) thực sự nạp mỗi lượt. Đo thật như mục 2d của báo cáo guardrails.
3. **Danh sách xung đột và trùng,** mỗi mục có `file:line`. Mục nào cần owner chọn bên thì viết thành câu hỏi theo mẫu `core/skills/_shared/decision-question.md`.
4. **Thiết kế đích** (một hình dạng, RUL11), trả lời bốn câu:
   - mỗi luật có một nhà;
   - tầng giao luật: luôn nạp (L0, dưới trần token đã đo) / nạp theo vai / nạp theo việc;
   - ai ghép luật: Agent Context Engine theo RUL102. Đối chiếu với code ghép đang có trước khi đề xuất thêm;
   - máy kiểm nào cho luật nào.

   Đặt ba thứ cạnh nhau: tầng giao luật của proposal §4.6, đề xuất P1–P7 của báo cáo guardrails, và câu hỏi D6. Không dựng mới khi đã có bản thiết kế.
5. **Gom câu hỏi owner thành một bộ** (D-ADR0030 điều 2): Q4–Q7 của D6, chính sách tương thích ngược (R4), và các câu mới. Hỏi một lần.
6. **Sau khi owner chọn:** lập plan bằng `ak-plan`, có red-team và validate, chia phase nhỏ, mỗi phase có mục **Delete** và **Tests to retire**. Chạy bằng lead trong worktree riêng (`ak-cook`). Big lead tự verify độc lập: chạy toàn suite với `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`, `FGOS_SESSION_ID` đã unset; file hỏng thì chạy riêng từng file qua `node scripts/run-tests.mjs <file>`, vì từ Git 07 test cần addon được stage. Lead tự báo xanh thì chưa tính.
7. **Thước đo khi xong:**
   - số byte luật luôn nạp giảm;
   - số luật bị chép giảm về 0;
   - số xung đột còn mở về 0;
   - mỗi luật quan trọng có máy kiểm, hoặc ghi lý do vì sao không;
   - luật tới được phase file, brief và worker contract. Kiểm bằng một lead mẫu: lead đó có làm theo luật "gỡ test" mà không cần nhắc thêm không.

### 7. Luật làm việc ở repo này

- **Ghi board** (`plans/261017-1313-fgos-platform-program-board/plan.md`):
  - cập nhật hàng INS (hoặc mở một hàng mới nếu đổi tên luồng) khi bắt đầu, xong, bị chặn hay land;
  - ghi log mới nhất lên đầu phần 2026-10-21;
  - mỗi quyết định kèm điều kiện đảo lại;
  - mọi điều đã báo owner đều phải lên board.
- **Đường dẫn báo cáo và plan:** lấy từ `fgos convention path --kind report|plan --type X --slug Y --json`, không tự đặt tên.
- **Lệnh và git:**
  - chạy mọi lệnh `fgos …` với `</dev/null`;
  - dùng `/usr/bin/git`; commit bằng pathspec (`git commit -- <path>`), pull trước khi commit, push sau commit;
  - không bao giờ checkout branch trong main checkout;
  - hook chặn các chữ node_modules, .git, target, build trong lệnh, nên dùng biến.
- **An toàn:**
  - không tạo work item trên workspace thật;
  - không in bí mật; file credential chỉ cho thấy tên trường hoặc hash.
- **Sửa luật:**
  - luật đã khoá (L1–L10, RUL có D-ADR) chỉ được thay bằng record mới (supersede), không sửa tại chỗ;
  - config của owner phải được duyệt trước khi sửa.
- **Tự quyết và chọn model:**
  - tự quyết trong khung đã duyệt rồi báo; chỉ hỏi owner khi thật sự là quyết định của owner;
  - model theo bản chất việc: soát và thiết kế dùng family mạnh; việc đã có plan dùng Sonnet.
- **Release đang active:** `sha256:653affd6…` (lock protocol 2, land 10-21 08:32). Không activate, stage hay upgrade gì nếu chưa có giờ land do owner chọn.

### 8. Đầu ra đầu tiên (trước khi sửa gì)

Một báo cáo nghiên cứu (đường dẫn lấy từ convention) gồm:
- sổ luật;
- bảng nạp token theo CLI;
- danh sách xung đột và trùng;
- thiết kế đích;
- bộ câu hỏi owner.

Chưa sửa file luật nào cho tới khi owner duyệt bộ câu hỏi. Báo `forgentx-95` và owner khi báo cáo xong.

Kết thúc mỗi lượt bằng:
```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: một hai câu
Concerns/Blockers: nếu có
```

---

## Plan và báo cáo liên quan (đã tìm, để owner điểm lại)

| Mục | Ở đâu | Trạng thái |
|---|---|---|
| **INS**: kiểm soát luật ở nguồn | board, hàng INS; [research-261016-1118](research-261016-1118-agent-code-quality-guardrails.md) | làm tay **landed** 10-17; cơ chế nhóm A **not-planned** |
| **D6**: luật instruction (Q4–Q7) | board, hàng D6 | **chờ owner** |
| **Agent Context Engine**: một owner ghép instruction | RUL102 trong `docs/specs/distribution.md:362`; `docs/platform/proposals/documentation-system-unification.md` §4.7.2; ledger PF-I007; code `src/setup/instruction-composition.mjs`, `instruction-projections.mjs` | "preserved future"; mới có phần ghép tối thiểu |
| **Kế hoạch tài liệu 260925**: thống nhất thẩm quyền tài liệu | `plans/260925-documentation-authority-unification/` | **running**, Phase 8 (phiên `forgentx-5f`); 331 file instruction/skill/help có bản vá chờ Phase 9 |
| **TEST**: luật test, One proof | [counsel-261020-1658](counsel-261020-1658-test-suite-growth-rule.md), [phase-lead-261020-1748](phase-lead-261020-1748-test-governance-rule-and-first-cleanup.md), `fb8c6e4ae` | **running** (máy thứ hai) |
| **Điều tra harness 10-06** | [harness-investigation-261006-synthesis](harness-investigation-261006-synthesis.md) | chờ Q6–Q9 |
| **RUL104 / RUL11**: tốt hơn không to hơn, tùm lum | `docs/specs/platform-foundations.md` (D-ADR0062, D-ADR0054) | khoá |
| **Soát luật gây phình** (hôm nay) | [review-261021-1008](review-261021-1008-rules-that-grow-the-system.md) | báo cáo, chờ owner |
| **HARDEN**: trục G, cổng 6 | [proposal-261021-0851](proposal-261021-0851-harden-review-criteria-and-method.md) | chờ owner duyệt |
| Backlog `p-7eb9e65b`: fgOS và ak ghi đè registration | `docs/backlog.md` | proposed |
| Skill `instruction-audit` | `.claude/skills/instruction-audit` | có sẵn để dùng |
