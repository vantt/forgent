# Handoff: quản lý luật chặt chẽ, không xung đột, không dư thừa, tới đúng nơi cần

Viết bởi `forgentx-95` lúc 2026-10-21 10:21 (Asia/Saigon), theo yêu cầu của owner lúc 10:20: "viết 1 prompt để handoff qua tiến trình khác đi để xác định và tối ưu hóa việc quản lý luật chặt chẽ, không xung đột luật, không dư thừa luật và đưa luật đến đúng nơi cần".

Bổ sung theo owner ngày 2026-10-21 sau 10:41: mục tiêu mở rộng thành bảy điều (§1), hướng sổ cái và bản render (§6, nhóm E), và việc chia theo nhóm (§6).

Phần dưới đây là prompt, dán nguyên văn cho một phiên agent mới.

---

## Prompt

Bạn nhận luồng **quản lý luật** của repo fgOS. Checkout chính ở máy viết handoff là `/home/vantt/projects/forgentX`; trên máy đang soạn bản bổ sung này thư mục đó không tồn tại và checkout là `/home/vantt/projects/forgent`. Hãy dùng checkout chính của máy bạn đang đứng. Máy là Linux, shell zsh, múi giờ Asia/Saigon. Owner xưng **anh**, bạn xưng **em**, trả lời bằng tiếng Việt.

### 1. Mục tiêu

Luật của repo (instruction, rule, nguyên tắc, luật khoá, quyết định) phải đạt bảy điều:
1. **Chặt chẽ:** mỗi luật **đáng kiểm** có máy kiểm, hoặc có lý do rõ vì sao chỉ là văn bản. Chỉ làm máy kiểm khi chi phí vi phạm đủ lớn; đừng kéo ra cơ chế mới cho luật nhẹ (RUL104).
2. **Xung đột có thứ tự giải:** các luật luôn kéo nhau (giao nhanh với DoD, RUL104 với "giao đủ phạm vi"), nên không đặt đích là "không có căng thẳng nào". Đích là: không có hai luật bảo hai điều trái nhau mà **không** có thứ tự giải quyết ghi rõ ở một chỗ. Xung đột ngầm, agent phải tự đoán bên nào thắng, phải về 0.
3. **Không dư thừa:** mỗi luật chỉ có **một nhà**; nơi khác trỏ về nhà đó chứ không chép lại.
4. **Tới đúng nơi cần:** đúng agent và đúng CLI (fgOS điều phối agent trên nhiều CLI: Claude, Codex, omp, pi, agy…, không chỉ Claude), đúng vai (big lead, lead, worker, reviewer), đúng lúc (luôn nạp, hay chỉ nạp khi làm việc đó), với số token ít nhất.
5. **Được làm theo, đo bằng hành vi:** luật tới đúng chỗ chưa chắc agent làm theo. Mỗi luật nêu **điều kiện kích hoạt** ("khi làm X thì…") và **hành động kiểm được**; nguyên tắc chung chung mà agent không biết lúc nào phải dừng lại làm gì thì phải viết lại hoặc hạ xuống thành `procedure`. Hiệu lực đo bằng hành vi (lead mẫu có làm theo mà không cần nhắc không), không đo bằng việc luật đã được nạp.
6. **Có vòng đời và nguồn gốc:** mỗi luật ghi nó sinh ra từ sự cố hay quyết định nào, ai sở hữu, và điều kiện nào thì hết hạn. Khi một luật đã có máy kiểm chặn thật, **bỏ nó khỏi phần luôn nạp** (giảm token mà không mất an toàn); mục 7 cấm thêm, còn mục này là đường để bớt.
7. **Không phình theo thời gian:** thêm luật mới thì phải nói nó thay luật nào, hoặc vì sao không thay luật nào. Mục này là cổng kiểm cho các mục trên, không phải đích riêng.

Ràng buộc đi kèm: số byte luật luôn nạp giảm chỉ tính là đạt khi phép thử hành vi của mục 5 không tệ đi. Giảm byte mà hành vi tệ đi thì không đạt.

Đây là quyết định kiến trúc (component boundary). Hãy làm theo RUL104, "tốt hơn, không to hơn": gom, xoá, đưa luật tới đúng chỗ. Owner đã chọn hướng ở nhóm E (§6): sổ cái cộng bản render sinh ra, thêm trục điểm inject và nhật ký inject, mở rộng cái đang có. Mọi cơ chế ngoài hướng đó chỉ thêm khi owner chọn.

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
- **Điều tra harness 10-06:** `plans/reports/harness-investigation-261006-synthesis.md` (vì sao agent vẫn làm tùm lum; còn treo Q6–Q9). Thư mục `plans/reports/harness-investigation-261006/` đã đo sẵn nhiều thứ nhóm A và B sẽ cần, đọc trước khi đo lại:
  - `instruction-audit-261006.md` đo lớp instruction thật sự nạp, kèm script `measure-instruction-layers.cjs` và `count-hook-injections.cjs`;
  - `archaeologist-261006.md` đã kết luận `.claude/rules/*` không nằm trong git và harness là ba lớp từ ba nguồn chồng nhau;
  - `fatal-flaws-261006.md` có bằng chứng rằng sửa bằng văn xuôi luôn nạp không ngăn được lỗi lặp lại (lỗi "hỏi thừa" lặp 3 lần dù luật đang nạp), ủng hộ mục tiêu 5 ở §1;
  - `enforcement-audit-261006.md` cho thấy phần cưỡng chế cũng rải ở 5 cửa.
- **Đã đo điểm inject theo CLI (một phần):** `plans/reports/research-261020-1612-mailbox-s0-human-input-and-peer-prompt-hooks.md` (Claude và Codex có hook `UserPromptSubmit`, agy không có; omp và pi chưa đo) và `plans/reports/research-261020-1814-mailbox-instruction-and-injection-eval-v2.md` (cùng một chỉ dẫn được làm theo rất khác nhau giữa Claude, Codex và pi). Nhóm C2 bắt đầu từ đây.
- **Tiền lệ cơ chế đã land, tái dùng cho sổ cái và bản render:** header sinh tự động trên bản render skill (`plans/261006-1415-fgos-single-door-mechanisms/phase-02-skill-render-generated-header.md`) và hook thi hành mẫu câu hỏi (`plans/261008-1353-decision-question-template-and-cleanup/phase-04-askuserquestion-hook.md`).
- **Danh sách đầy đủ report và plan về tối ưu luật và instruction:** `plans/reports/research-261021-1054-rules-instruction-optimization-references.md` (70 tài liệu xếp theo chín nhóm, kèm vấn đề chính của từng tài liệu).
- **Skill `instruction-audit`** đã có: soát bề mặt instruction, nạp trùng, hook trùng, luật không có máy kiểm. Dùng nó.
- **Backlog `p-7eb9e65b`:** fgOS và AgentKit (`ak`) ghi đè registration của nhau.

### 3. Phạm vi

**Phạm vi gồm** mọi nơi ghi luật:
- `AGENTS.md`;
- `CLAUDE.md` (chỉ được `@AGENTS.md`);
- `core/instructions/*`;
- `.claude/rules/*` và `.claude/hooks/*` (project): chỉ đọc và đo, không sửa. Đã kiểm 2026-10-21: chúng không nằm trong git (`.gitignore:63` là `/.claude/*`, `git ls-files` rỗng) và `.claude/hooks/hooks.json` dùng `${CLAUDE_PLUGIN_ROOT}`, nên có vẻ là bản AgentKit cài cục bộ; nhóm A xác nhận;
- `docs/platform-foundations.md` và `docs/specs/platform-foundations.md`;
- phần "Lịch sử quyết định" và các RUL trong `docs/specs/*.md` và `docs/platform/*/spec.md`;
- `docs/decisions/index.md` (file sinh ra);
- `domains/*/AGENTS.md`;
- `core/skills/_shared/*` và `core/skills/*/SKILL.md` (kèm bản render ở `.agents/skills`, `plugins/fgOS/skills`; không sửa tay bản render, sinh lại bằng `npm run build:skills`);
- mẫu brief và mẫu plan mà fgOS dùng;
- hook nạp luật: hook của fgOS (`fgos hook …`, `scripts/fgos-session-start-hook.mjs`) sửa được; hook trong `.claude/hooks/*` chỉ đo;
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

Nếu bạn xây cơ chế chung (ví dụ cổng kích thước ròng trong `npm test`/doctor, hay lớp "plan addendum" fgOS sở hữu đặt cạnh `ak-plan`/`ak-cook`, hay trục điểm inject, nhật ký inject và bản render theo vai, vốn chạm trục G và cổng 6 của HARDEN), hãy báo `forgentx-95` qua SendMessage để HARDEN và SEAT dùng chung, đừng tạo đường song song.

### 5. Luồng đang chạy có chồng lấn (phối hợp trước khi sửa)

- **Kế hoạch tài liệu 260925** (`plans/260925-documentation-authority-unification/`): phiên `forgentx-5f`, nhánh `plan/260925-documentation-authority-unification`, worktree `/home/vantt/projects/forgentX-phase00-documentation-authority-unification`.
  - Đang ở Phase 8 và đã có bản ghi vá cho 331 file instructions/skills/comment/help.
  - Chỉ land ở Phase 9.
  - Trước khi động vào `AGENTS.md`, `core/instructions` hay skill, nhắn `forgentx-5f` để biết file nào họ đang vá. Đừng sửa cùng file song song.
- **Luồng TEST** (máy thứ hai): luật và công cụ test.
- **Luồng MAIL** (mailbox, phiên `d50dc90b`): instruction chèn vào phiên agent.

### 6. Cách làm: các nhóm việc

Việc chia thành bảy nhóm. Pha 1 (nhóm A đến F) chỉ đọc, đo và viết báo cáo, chưa sửa file luật nào. Pha 2 (nhóm G) chỉ bắt đầu sau khi owner duyệt bộ câu hỏi của nhóm F.

| Nhóm | Việc | Chờ | Chạy song song với | Ra |
|---|---|---|---|---|
| A | Prior art và ranh giới sở hữu | không | B, C | phần prior art; bảng nơi ghi luật và đường inject, đánh dấu sở hữu hay chỉ quan sát |
| B | Sổ luật, chia B1 đến B4 theo nhóm nguồn | không bắt buộc; phần phân loại sở hữu lấy từ A khi A xong | A, C, và các nhánh B với nhau | các dòng sổ luật |
| C | Đo nạp theo CLI (C1) và liệt kê điểm inject (C2) | không | A, B | bảng token theo CLI; danh sách điểm inject |
| D | Xung đột và trùng | B, C | không | danh sách xung đột và trùng |
| E | Thiết kế đích | A, B, C, D; phần đọc code bộ ghép có thể bắt đầu ngay | không | thiết kế đích |
| F | Bộ câu hỏi owner | D, E | không | một bộ câu hỏi |
| G | Plan, thực hiện, nghiệm thu | owner duyệt F | không | thay đổi đã land |

Quy ước chung cho mọi nhóm:
- Mỗi nhóm (và mỗi nhánh B1 đến B4, C1, C2) ghi vào **một file báo cáo riêng** với slug riêng, đường dẫn lấy từ `fgos convention path`; agent chạy song song phải chọn slug khác nhau. Nhóm A, B, C chỉ đọc repo và chỉ ghi file báo cáo của mình nên không đụng nhau. Bạn, người điều phối, gộp thành báo cáo ở §8.
- Trước khi giao việc ra ngoài lượt hiện tại, chạy `fgos dispatch decide` (xem mục Dispatch của `AGENTS.md`). Brief cho mỗi worker gồm: việc, file được đọc, file được ghi, tiêu chí xong, đường dẫn báo cáo, và dòng `Status` ở cuối.
- Nhóm B và C dùng skill `instruction-audit` cho phần soát bề mặt instruction, nạp trùng, hook trùng và luật không có máy kiểm.
- Mọi nhóm tuân §5 (phối hợp với `forgentx-5f`, TEST, MAIL) và §7 (ghi board, git, an toàn) trước khi sửa hay ghi gì ngoài file báo cáo của mình.

#### Nhóm A. Prior art và ranh giới sở hữu

1. **Prior art trước khi thiết kế** (`AGENTS.md`, mục "Prior art before design"). Chạy `git log -S`/`-G` trên `instruction-composition`, `effective instructions`, `RUL102`, `AGENTKIT`, `core/instructions`, cả dưới tên cũ trước các lần đổi tên. Ghi rõ cái gì đã có, cái gì bị gỡ, và việc gỡ đó có cố ý không.
2. **Phân loại sở hữu cho từng nơi ghi luật và từng đường inject:** *sở hữu* (fgOS sửa được, đi qua cửa của engine) hay *chỉ quan sát* (AgentKit, `~/.claude`, `rtk`: chỉ đo và liệt kê). Điểm xuất phát đã kiểm 2026-10-21, cần nhóm A xác nhận:
   - `.claude/rules/*` và `.claude/hooks/*.cjs` không nằm trong git (`.gitignore:63`), có vẻ là bản AgentKit cài cục bộ: chỉ quan sát. Đây mới là phía Claude; phân loại tương tự cho phần cài cục bộ và đường nạp của Codex, omp, pi và agy;
   - hook gọi `fgos hook …` (`dispatch-decide`, `decision-question`) và `scripts/fgos-session-start-hook.mjs`: của fgOS, sở hữu;
   - nội dung `.claude/rules/*` (orchestration, process management, review/audit…) cũng xuất hiện trong phần "fgOS Effective Instructions" render vào `AGENTS.md`, nên một phiên Claude nạp cùng nội dung hai lần (qua `CLAUDE.md` import `AGENTS.md`, và qua `.claude/rules/*`). Ghi lại như một mục trùng cho nhóm D; ai là nhà của nó là câu hỏi cho owner (liên quan Q7 và backlog `p-7eb9e65b`).

#### Nhóm B. Sổ luật

Một bảng, mỗi dòng một luật, gồm các cột:
- id (L, RUL, D-ADR, nguyên tắc, hoặc chưa có);
- nội dung một câu;
- nhà hiện tại, và mọi nơi bị chép lại;
- ai cần luật này (vai, CLI), khi nào cần;
- điều kiện kích hoạt ("khi làm X thì…") và hành động kiểm được; ghi "chưa có" nếu luật chỉ là nguyên tắc chung chung;
- nguồn gốc (sự cố hoặc quyết định sinh ra luật), lý do, chủ sở hữu, điều kiện hết hạn;
- điểm inject hiện tại: luật này đang vào agent qua đường nào (`AGENTS.md`, hook nào, brief, phase file, skill…), và đường đó là sở hữu hay chỉ quan sát;
- có máy kiểm chưa (cái nào);
- xung đột với luật nào, và thứ tự giải đã ghi ở đâu (ghi "ngầm" nếu chưa có);
- đề xuất: giữ / gom / xoá / đổi nhà / thêm máy kiểm / bỏ khỏi phần luôn nạp vì đã có máy kiểm chặn thật.

Chia nhánh theo nhóm nguồn, mỗi nhánh một file báo cáo, cùng một bộ cột:
- **B1:** `AGENTS.md`, `CLAUDE.md`, `core/instructions/*`, `domains/*/AGENTS.md`, `.claude/rules/*` (chỉ đọc).
- **B2:** `docs/platform-foundations.md`, `docs/specs/platform-foundations.md`, phần "Lịch sử quyết định" và các RUL trong `docs/specs/*.md` và `docs/platform/*/spec.md`, `docs/decisions/index.md` (file sinh ra).
- **B3:** `core/skills/_shared/*`, `core/skills/*/SKILL.md` (kèm bản render ở `.agents/skills`, `plugins/fgOS/skills`; không sửa tay, sinh lại bằng `npm run build:skills`), mẫu brief, mẫu plan, và worker contract (xác định nhà của worker contract khi lập sổ; có thể là `docs/routing-handoff-contract.md`).
- **B4:** các máy kiểm luật: `test/architecture.test.mjs`, `docs/architecture-manifest.json`, `.githooks/pre-commit`, `scripts/check-*.mjs`, các doctor row liên quan. Nhánh này điền cột "có máy kiểm chưa" cho B1 đến B3 và chỉ ra luật nào chưa có máy kiểm.

#### Nhóm C. Đo nạp và điểm inject

- **C1. Đo token theo CLI.** Đo token mà mỗi CLI (Claude, Codex, omp/pi, agy) thực sự nạp mỗi lượt. Đo thật như mục 2d của báo cáo guardrails, không ước lượng.
- **C2. Danh sách điểm inject.** Liệt kê mọi đường luật đang vào agent, cho cả bốn CLI, mỗi đường ghi: sở hữu hay chỉ quan sát, nạp luật nào, cho việc gì. Với Claude, các điểm đã thấy trong `.claude/settings.json`: `SessionStart` (`fgos-session-start-hook.mjs`, `session-init.cjs`), `UserPromptSubmit` (`dev-rules-reminder.cjs`, `simplify-gate.cjs`), `PreToolUse` (`dispatch-decide`, `decision-question`, `scout-block`, `context-firewall`…), `PostToolUse` (`dev-rules-reminder.cjs` khi Write/Edit), `SubagentStart` (`subagent-init.cjs`, `team-context-inject.cjs`), `Stop`, `PreCompact`; ngoài hook còn có `AGENTS.md` nạp tự động, mẫu brief, phase file và skill được load. Danh sách hook này mới có cho Claude. Với Codex, omp, pi và agy, nhóm C2 phải **đo thật** từng CLI có những điểm inject nào (có hook không, hook ở sự kiện nào, có đường nạp file tự động nào, trần kích thước ra sao); không suy ra từ Claude, và không giả định CLI nào cũng có hook.

#### Nhóm D. Xung đột và trùng

Danh sách xung đột và trùng, mỗi mục có `file:line`. Tách **xung đột ngầm** (chưa có thứ tự giải) khỏi xung đột đã có thứ tự giải. Mục nào cần owner chọn bên thì viết thành câu hỏi theo mẫu `core/skills/_shared/decision-question.md` và chuyển cho nhóm F. Các mục đã biết để bắt đầu: R4 (`review-261021-1008`, mục R4: "không cần tương thích ngược" mâu thuẫn với việc cài thật), "dùng lại trước khi thêm" bị chép ở 8 nơi, và `.claude/rules/*` trùng với phần effective instructions trong `AGENTS.md` (nhóm A).

#### Nhóm E. Thiết kế đích

Một hình dạng (RUL11), trả lời bốn câu:
- mỗi luật có một nhà;
- tầng giao luật: luôn nạp (L0, dưới trần token đã đo) / nạp theo vai / nạp theo việc;
- ai ghép luật: Agent Context Engine theo RUL102. Đối chiếu với code ghép đang có trước khi đề xuất thêm;
- máy kiểm nào cho luật nào.

Đặt ba thứ cạnh nhau: tầng giao luật của proposal §4.6, đề xuất P1–P7 của báo cáo guardrails, và câu hỏi D6. Không dựng mới khi đã có bản thiết kế.

**Hướng đã thống nhất với owner (2026-10-21): hai bản ghi, sổ cái và bản render, mở rộng cái đang có.**
- **Sổ cái** là nơi duy nhất được sửa. Mở rộng `core/instructions/*.md` (frontmatter và schema ở `src/setup/instruction-registry.mjs`), không tạo kho thứ ba. Frontmatter hiện có `id`, `kind`, `owner`, `scope`, `mode`, `appliesTo`, `specificity`, `title`, `description`; cần thêm: nguồn gốc (sự cố hoặc quyết định sinh ra luật), lý do, điều kiện kích hoạt, hành động kiểm được, điều kiện hết hạn, máy kiểm (hoặc lý do không có). Quan hệ `supersedes`, `refines`, `conflictsWith` đã có và giữ vai trò thứ tự giải xung đột của mục 2 ở §1.
- **Bản render** chỉ mang câu luật, điều kiện kích hoạt và hành động. Nguồn gốc và lý do không bao giờ được inject vào agent. Bản render là nhiều lát cắt sinh từ cùng một sổ cái: theo CLI (Claude, Codex với trần 32 KiB, omp/pi, agy), theo vai (big lead, lead, worker, reviewer) và theo việc (luôn nạp hay chỉ nạp khi làm việc đó). Không ai sửa tay lát cắt nào.
- **Bộ ghép đã có:** `src/setup/instruction-composition.mjs` ghép theo thứ tự law, boundary, procedure, preference; xung đột thì fail, không last-write-wins. Phần render ra `AGENTS.md` và host file cùng projection ledger là P5, mới có tối thiểu. Đề xuất mở rộng bộ ghép này theo RUL102, không dựng bộ ghép mới; đối chiếu với PF-I007 trước khi chốt.
- **Việc lớn nhất là kéo luật còn nằm ngoài sổ cái vào.** Sổ cái hiện chỉ có 3 file (`decision-question`, `design-principles`, `platform-laws`); RUL11, RUL104, `.claude/rules/*` và phần viết tay trong `AGENTS.md` vẫn nằm ngoài. Kéo vào chính là bước gom và xoá bản trùng.
- **Máy kiểm chống sửa tay bản render** theo mẫu header nguồn cộng sinh lại (`npm run build:skills`) mà repo đã dùng; nếu thiếu thì hai bản sẽ lệch nhau.
- **Máy luật làm thêm hai việc (owner thêm 2026-10-21):**
  1. **Kiểm soát mọi cơ hội inject luật và biết chính xác inject để làm việc gì.** Hiện chưa có chỗ nào làm việc này: luật chảy vào agent qua nhiều đường rời rạc, mỗi hook tự quyết nói gì mà không hỏi sổ cái. Danh sách điểm inject do nhóm C2 lập.
  2. **Cơ chế gom luật từ nhiều nguồn về một bản render cuối cùng, hợp với thời điểm inject đang được yêu cầu.** `instruction-composition.mjs` đã gom nhiều nguồn về một tập hiệu lực, nhưng mới ghép theo đối tượng (repo, domain, component) và host. Cần thêm trục **điểm inject** kèm ngân sách token cho từng điểm: cùng một sổ cái cho ra lát cắt khác nhau cho đầu phiên, lúc giao brief cho lead, lúc worker sắp sửa file.
- **Ba điều kiện thiết kế cho hai việc trên:**
  - Phân biệt điểm inject **sở hữu** (đi qua cửa của engine, được điều khiển) với điểm **chỉ quan sát** (`~/.claude/rules/*`, skill `ak-*`, hook của AgentKit: ngoài phạm vi, chỉ đo và liệt kê). Không hứa "kiểm soát tất cả" khi chỉ điều khiển được phần đi qua cửa mình.
  - Mỗi lần inject phải **khai báo "cho việc gì"**: điểm inject nào, vai nào, loại việc nào. Engine không tự biết; người gọi nói. Dùng lại từ vựng đã có của `fgos run`/Unit (capability, stage), không đặt từ vựng mới.
  - Mỗi lần inject ghi **một dòng nhật ký** (luật nào, điểm nào, việc gì, bao nhiêu byte) để đo số byte luôn nạp, phát hiện luật bị inject hai lần trong một phiên, và chạy phép thử hành vi của mục 5 §1. Khử trùng trong phiên: luật đã inject ở đầu phiên thì không inject lại ở brief.
- **Trung lập CLI (fgOS điều phối nhiều CLI, nguyên tắc 3 trong `design-principles`: mỗi CLI là driver mỏng, thay được, sau một port):** điểm inject được định nghĩa **trừu tượng**, không theo tên hook của Claude: đầu phiên, mỗi lượt, trước hoặc sau một hành động, khởi tạo subagent hoặc giao brief, nén ngữ cảnh. Mỗi CLI có một adapter mỏng khai báo nó hỗ trợ điểm nào và inject bằng cách nào; hook của Claude chỉ là một adapter. CLI không có hook thì chỉ còn hai đường: file nạp tự động (`AGENTS.md`, chịu trần của CLI đó) và brief do `fgos run`/Unit dựng. Vì `fgos run` dựng brief cho mọi CLI, đây là điểm inject sở hữu chung duy nhất không phụ thuộc CLI, nên nhiều khả năng là đường chính cho luật theo vai và theo việc. Nhóm C2 đo xác nhận trước khi chốt.
- **Theo RUL104:** danh sách điểm inject là dữ liệu trong sổ cái hoặc manifest, không thêm lớp code mới. Theo gate "Install/setup/doctor" của `AGENTS.md`, nó phải đăng ký vào registry của `fgos doctor` để doctor báo được hook nào inject luật mà không đi qua engine.
- **Còn chưa chốt, thiết kế phải trả lời:** luật tới được lead đang chạy theo `ak-plan`/`ak-cook` bằng đường nào, khi mình không được sửa các skill đó. Đường khả dĩ đã có trong §4: mẫu brief, mẫu plan và phase file do fgOS sở hữu, hoặc lớp "plan addendum" đặt cạnh `ak-plan`/`ak-cook`. Đây là chỗ luật "gỡ test" hiện không tới được (§2).

#### Nhóm F. Bộ câu hỏi owner

Gom thành một bộ (D-ADR0030 điều 2), mỗi câu theo mẫu `core/skills/_shared/decision-question.md`, hỏi một lần:
- Q4–Q7 của D6;
- chính sách tương thích ngược (R4 trong `review-261021-1008`);
- phạm vi schema mới của sổ cái;
- có mở rộng bộ ghép hiện có hay không (RUL102);
- điểm inject nào là sở hữu so với chỉ quan sát;
- ai là nhà của nội dung `.claude/rules/*` đang trùng với effective instructions trong `AGENTS.md`;
- đường cho luật tới lead chạy theo `ak-plan`/`ak-cook` (cuối nhóm E);
- các câu mới từ nhóm D và E.

#### Nhóm G. Plan, thực hiện, nghiệm thu (chỉ sau khi owner duyệt nhóm F)

1. **Plan:** lập bằng `ak-plan`, có red-team và validate, chia phase nhỏ, mỗi phase có mục **Delete** và **Tests to retire**.
2. **Thực hiện:** chạy bằng lead trong worktree riêng (`ak-cook`). Big lead tự verify độc lập: chạy toàn suite với `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`, `FGOS_SESSION_ID` đã unset; file hỏng thì chạy riêng từng file qua `node scripts/run-tests.mjs <file>`, vì từ Git 07 test cần addon được stage. Lead tự báo xanh thì chưa tính.
3. **Thước đo khi xong:**
   - số byte luật luôn nạp giảm, và phép thử hành vi (mục 5 của §1) không tệ đi;
   - số luật bị chép giảm về 0;
   - số xung đột ngầm (không có thứ tự giải) về 0;
   - mỗi luật đáng kiểm có máy kiểm, hoặc ghi lý do vì sao không;
   - mỗi luật có nguồn gốc, chủ sở hữu và điều kiện hết hạn;
   - luật tới được phase file, brief và worker contract. Kiểm bằng một lead mẫu: lead đó có làm theo luật "gỡ test" mà không cần nhắc thêm không. Chạy phép thử trên ít nhất hai CLI khác nhau (một là Claude), vì luật tới đúng chỗ trên Claude chưa chứng minh gì cho CLI khác.

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
- phần prior art và bảng sở hữu hay chỉ quan sát (nhóm A);
- sổ luật, đủ các cột ở nhóm B (gồm điều kiện kích hoạt, nguồn gốc/chủ sở hữu/hạn dùng, điểm inject hiện tại), gộp từ B1 đến B4;
- bảng nạp token theo CLI (nhóm C1);
- danh sách điểm inject: mọi đường luật đang vào agent, đánh dấu sở hữu hay chỉ quan sát, mỗi điểm nạp luật nào và cho việc gì (nhóm C2);
- danh sách xung đột và trùng, tách xung đột ngầm (chưa có thứ tự giải) khỏi xung đột đã có thứ tự giải (nhóm D);
- thiết kế đích: sổ cái và bản render sinh ra, mở rộng `core/instructions` và bộ ghép hiện có, thêm trục điểm inject, nhật ký inject, khử trùng trong phiên, và đường cho luật tới lead chạy theo `ak-plan`/`ak-cook` (nhóm E);
- bộ câu hỏi owner (nhóm F).

Chưa sửa file luật nào cho tới khi owner duyệt bộ câu hỏi (nhóm G chỉ bắt đầu sau đó). Báo `forgentx-95` và owner khi báo cáo xong.

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
| **Quét lại toàn bộ report và plan** về tối ưu luật và instruction | [research-261021-1054](research-261021-1054-rules-instruction-optimization-references.md) | 70 tài liệu, 9 nhóm; bảng ở trên là phần cốt lõi, danh sách đầy đủ nằm ở report này |
