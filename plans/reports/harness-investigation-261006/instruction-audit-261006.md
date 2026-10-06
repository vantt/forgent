# Kiểm toán lớp instruction (vai 2), 2026-10-06

Phạm vi: em đo những gì một phiên Claude Code trong repo này thật sự nạp, gồm cả hook. Em chỉ đọc. Script và số liệu thô nằm cùng thư mục này:

- [measure-instruction-layers.cjs](measure-instruction-layers.cjs) → [instruction-layers-measure.txt](instruction-layers-measure.txt)
- [render-hook-reminders.cjs](render-hook-reminders.cjs) → [hook-reminder-global.txt](hook-reminder-global.txt), [hook-reminder-project.txt](hook-reminder-project.txt)
- [count-hook-injections.cjs](count-hook-injections.cjs) → [hook-injection-counts.txt](hook-injection-counts.txt) (40 transcript gần nhất của main), [hook-injection-counts-worktrees.txt](hook-injection-counts-worktrees.txt) (97 transcript chạy trong worktree)
- [report-name-patterns.txt](report-name-patterns.txt)

Token ước theo chars/3.6, tức là xấp xỉ, không phải tokenizer thật.

## 1. Kết luận chính

1. **Hai bộ kit cùng chạy song song.** ClaudeKit (`ck`, ở `~/.claude/`) và AgentKit (`ak`, ở `.claude/` của repo) đăng ký **cùng 11 hook** (`~/.claude/hooks/managed-hooks.json` và `.claude/settings.json`). Lệnh của hai bên là hai chuỗi khác nhau nên cả hai đều chạy. Mỗi lượt agent vì thế nhận **hai khối "Rules" nói ngược nhau**. Trong 560 prompt có khối rules ở main, **464 prompt (83%) nhận cả hai khối**. 253/253 lần `Write` (100%) nhận hai hướng dẫn đặt tên trái nhau.
2. **Bộ instruction đổi theo checkout.** `.claude/rules/*.md` và `.claude/hooks/*` bị gitignore (`.gitignore:62` `/.claude/*`, chỉ mở lại skills/settings/agents). `git ls-files` trả về không có file nào. Worktree vì thế có **0 rules và 0 hooks của repo**: em kiểm 5/5 worktree. 97/302 transcript (32%) chạy trong worktree. Ở đó **58% prompt chỉ nhận khối global** ("Follow YAGNI", tên `-report.md`), 29% nhận cả hai, 13% chỉ nhận khối project. Cùng một repo nhưng luật khác nhau tùy chỗ agent đứng.
3. **Hậu quả đo được: tên báo cáo không có quy ước nào thắng.** Trong `plans/reports/` có 135 báo cáo từ 2026-09-01. Đuôi ngày `-YYMMDD.md`, kiểu brief của lead, chiếm 34%. Kiểu hook project chiếm 30%. Kiểu hook global `-report.md` chiếm 24%. Khác chiếm 11%. Không quy ước nào vượt 35%.
4. **Doctrine riêng của repo nằm giữa, nhiễu chung của kit nằm ở chỗ chú ý cao.** RUL11 nằm ở byte 24.207/63.960 của lớp markdown (khoảng 38%). Còn khối hook kit-generic khoảng 6,4 KB được chèn **sát prompt người dùng mỗi lượt**.
5. **RUL11 chỉ là văn xuôi, không kèm "cách làm".** Điều này trái L8 quy tắc 2 ("transport rides with the order", `docs/platform-foundations.md:205-207`). Cơ chế cơ học duy nhất là một test giữ cho câu chữ còn đó (`test/docs/rul11-anchor-phrase.test.mjs`). Không có gì ép hành vi "một path, một tên, tra trước khi tạo".

## 2. Bản đồ nạp (thứ tự quan sát trong system-reminder của chính phiên này)

| # | Lớp | File | Bytes | ~Tok |
|---|---|---|---|---|
| 1-2 | user CLAUDE.md → @RTK.md | `~/.claude/CLAUDE.md`, `RTK.md` | 972 | 268 |
| 3-8 | user rules (6) | `~/.claude/rules/*.md` | 9.313 | 2.587 |
| 9 | project CLAUDE.md | `CLAUDE.md` | 6.643 | 1.835 |
| 10 | @AGENTS.md | `AGENTS.md` | 17.180 | 4.578 |
| 11-18 | project rules (8, **không track**) | `.claude/rules/*.md` | 18.734 | 5.647 |
| 19 | auto-memory index (59 mục: 38 feedback, 21 project) | `MEMORY.md` | 13.118 | 3.607 |
| | **Tổng markdown luôn nạp** | | **63.960** | **~17.500** |
| — | danh sách skill (226 skill có description ở `~/.claude/skills` + `.claude/skills`, chưa tính plugin) | | ~49.700 | ~13.800 (ước) |
| — | `domains/coding/AGENTS.md` (không tự nạp; fgos-routing đọc khi cần) | | 6.305 | 1.742 |

Hook, theo sự kiện (40 transcript main; [hook-injection-counts.txt](hook-injection-counts.txt)):

| Sự kiện | Nguồn | Nội dung | Đo |
|---|---|---|---|
| UserPromptSubmit | `~/.claude/hooks/dev-rules-reminder.cjs` + `.claude/hooks/dev-rules-reminder.cjs` | Session/Rules/Modularization/Paths/Naming, cả hai bản | 1.130 lần, 3,56 MB, trung bình 3,15 KB/khối; median 40 KB/phiên, phiên lớn nhất 1,06 MB |
| PostToolUse Write/Edit | `.claude/hooks/dev-rules-reminder.cjs` (chỉ project) | lại cả khối ~3,6 KB | 97 lần ở main, 263 lần ở worktree |
| PreToolUse Write | `descriptive-name.cjs`, cả hai bản | hướng dẫn đặt tên, hai khối trái nhau | 253/253 có cả hai |
| SessionStart | global `session-init` + project `session-init` + `scripts/fgos-session-start-hook.mjs` | 3 khối; global đổ "Previous Session State" tới 214 KB (persisted, chỉ 2 KB preview gồm các dòng "Agent Result: unknown") | 31/92 lần startup bị persisted-output |
| SubagentStart | global `subagent-init` + project `subagent-init` + `team-context-inject` | hai khối Rules/Naming trái nhau | thấy trực tiếp trong context của chính em |
| PreToolUse Agent/Task | `scripts/dispatch-decide-hook.mjs` | chặn thật (`exit(2)`, dòng 73) | — |

## 3. Trùng lặp

- **Trùng chính xác:** 23 đoạn (≥80 ký tự), khoảng 5,8 KB, tức **9,0%** lớp markdown ([instruction-layers-measure.txt](instruction-layers-measure.txt)):
  - Khối GitNexus nằm ở `CLAUDE.md:80-120` và `AGENTS.md:167-207`. Khối MDView nằm ở `CLAUDE.md:50-78` và `AGENTS.md:137-165`. `CLAUDE.md:6` lại @-import `AGENTS.md`, nên cả hai khối vào context hai lần.
  - `review-audit-self-decision.md` giống hệt giữa global và repo (`cmp` không ra khác biệt).
  - `orchestration-protocol`, `development-rules` và `primary-workflow` trùng phần lớn.
- **Trùng gần đúng (cùng tên file, nội dung lệch):** `development-rules` lệch 7 dòng, `orchestration-protocol` 9, `primary-workflow` 40, `documentation-management` 64. Số đo khớp với quan sát hạt giống.
- **Trùng ở hook:** 11 hook trùng tên chạy hai lần. Riêng `privacy-block.cjs` giống hệt byte nhưng vẫn chạy hai lần. `.claude/settings.json` còn đăng ký `simplify-gate` và `secret-output-guardrail` hai lần trong chính nó (hai nhóm `UserPromptSubmit`). Em chưa chứng minh Claude Code có khử trùng lệnh y hệt hay không: UNPROVEN.
- **Churn do khối sinh tự động:** khối GitNexus nằm trong file viết tay. 34/53 commit sửa `CLAUDE.md` và 30/83 commit sửa `AGENTS.md` là commit cập nhật số symbol GitNexus (`git log --grep`). Working tree hôm nay cũng đang bẩn đúng 2 dòng đó. Ngay trong phiên này số symbol đã đổi từ 58449 lên 58821.

## 4. Mâu thuẫn (file:dòng)

| # | Chủ đề | Bên A | Bên B | Hiện ra cho agent |
|---|---|---|---|---|
| M1 | YAGNI | `~/.claude/rules/development-rules.md:8` "Prefer YAGNI, KISS, DRY"; `~/.claude/hooks/lib/context-builder.cjs:594` "Follow YAGNI-KISS-DRY" | `.claude/rules/development-rules.md:8-11`, `.claude/hooks/lib/context-builder.cjs:577` "YAGNI chỉ khi `--yagni`" | 83% prompt ở main nhận cả hai. Khối global còn tự mâu thuẫn: dòng đầu bảo "Read and follow `.claude/rules/development-rules.md`" (file nói YAGNI opt-in), rồi ngay sau đó bảo "Follow YAGNI" |
| M2 | Tên báo cáo | global `context-builder.cjs:676` `{type}-{date}-{slug}-report.md` | project `context-builder.cjs:656` `{type}-{date}-{slug}.md` | Agent con (chính em) nhận cả hai, cộng thêm tên thứ ba do brief đặt `<vai>-261006.md`: ba quy ước trong một context |
| M3 | Tên plan | `~/.claude/.ck.json` `plan.namingFormat {date}-{issue}-{slug}`, `dateFormat YYMMDD-HHmm`, giờ địa phương (hook in `261006-1003`) | `ak plan create` tạo "`<timestamp>-<slug>`" (`ak plan create --help`). `plans/261005-1143-…` có commit lúc 19:51 +07, khớp giờ UTC 11:43 khi tạo khoảng 18:43 local | Hai nguồn sinh tên. Phần UTC em suy luận, chưa chạy `ak plan create` để khỏi đụng plan store: chưa chứng minh trực tiếp |
| M4 | Vị trí plan | `~/.claude/rules/documentation-management.md:18` `plans/<timestamp>-<slug>/` | `.claude/rules/documentation-management.md:19` "Follow the repository's configured … convention" (không nói ở đâu) | Rule repo trỏ đi đâu đó mà không có đích |
| M5 | Đặt tên file khi `Write` | `~/.claude/hooks/descriptive-name.cjs:17` "Markdown: dùng ## Naming"; `:19` "Python snake_case" | `.claude/hooks/descriptive-name.cjs:16` "Bỏ qua với markdown"; `:17` "Python kebab-case" | 100% lần `Write` |
| M6 | Nơi ghi quyết định | `AGENTS.md:64-65` (L5 Q6) "settled decision goes into `docs/decisions/`" | `AGENTS.md:13,25,33`: corpus `docs/decisions/*.md` đã retire, narrative ở `docs/specs/<area>.md` | Mâu thuẫn ngay trong AGENTS.md |
| M7 | GitNexus MUST | `AGENTS.md:173-187` MUST/NEVER vô điều kiện | `CLAUDE.md:8-48` gate theo capability (inactive/degraded/full) | Runtime chỉ đọc AGENTS.md (codex/pi/agy) không thấy gate. Trong Claude, gate đứng trước nhưng khối MUST xuất hiện hai lần |
| M8 | Prefix skill | `~/.claude/rules/development-rules.md:27`, `primary-workflow.md:29`, `orchestration-protocol.md:42` dùng `/ck:preview`, `/ck:team` | `.claude/rules/*` dùng `/ak:preview`, `/ak:team`; hook project (`context-builder.cjs` Rules) "invoke ak:scout, ak:cook…" | 82 skill global có bản sao `ak-*` trong repo, nên catalog có đôi `ck:x`/`ak:x` |
| M9 | Nạp theo nhu cầu, hay luôn nạp | `~/.claude/rules/CLAUDE.md:3,15-21` nói các rule file chỉ "Load … only when the current task needs them" | Claude Code luôn tự nạp mọi `~/.claude/rules/*.md` (thấy cả 6 file trong system-reminder của phiên này) | Thiết kế "on-demand" là sai sự thật |
| M10 | Đọc gì trước | `~/.claude/rules/CLAUDE.md:9` "README.md + docs/" | `AGENTS.md:38,54` `docs/specs/reading-map.md`. Repo còn có `docs/reading-map.md` (3,7 KB), là file `docs/doc-governance.md:16` trỏ tới | Hai reading-map, hai điểm vào |
| M11 | Gọi CLI fgos | `MEMORY.md:28` "dùng hàm shell `fgos`" | `MEMORY.md:39` "`fgos` có thể chạy release cũ, dùng `node bin/fgos.mjs`"; `AGENTS.md:110-127` dùng `fgos …` | Memory tự mâu thuẫn |
| M12 | Nơi đặt markdown | hook cả hai bản: "DO NOT create markdown outside plans/ or docs/" | `AGENTS.md:9-14` + L8: doctrine nằm ở `domains/*/AGENTS.md`, `core/skills`, `CHANGELOG.md`; `docs/doc-governance.md:96-103` cho phép `domains/`, `.agents/skills/`, `plugins/` | Rule hook hẹp hơn governance thật |

**Ai thắng khi mâu thuẫn:**

- **Không có cơ chế ưu tiên nào ở tầng prompt.** Hook chỉ nối chuỗi: khối global đến trước, project sau (transcript `a019f72e…jsonl` dòng 44 rồi 45). Văn xuôi được để mô hình tự chọn.
- Code project có ý định thắng: comment ở `.claude/hooks/lib/context-builder.cjs:571-575` nói rõ chuyện này. Nhưng lớp global vẫn nói song song.
- Ở worktree thì **global thắng mặc định**, vì project vắng mặt (mục 1.2).
- Proxy hành vi: các tên báo cáo từ 2026-09-01 chia gần đều giữa ba quy ước (mục 1.3). Đây là tương quan, không phải nhân quả (UNPROVEN). Một phần do brief của người hoặc lead tự đặt tên.

## 5. Văn xuôi hay cơ khí hóa

| Quy tắc | Nơi viết | Cơ chế ép | Phân loại |
|---|---|---|---|
| `dispatch decide` trước Agent/Task | `AGENTS.md:112` | `scripts/dispatch-decide-hook.mjs:73` `exit(2)` | **Cơ khí.** 20 dòng văn xuôi ở `AGENTS.md:107-130` phần lớn thừa với Agent/Task, vì hook tự gọi `bind()` |
| Không đọc secrets | hooks, CLAUDE | `privacy-block.cjs:156` `exit(2)` | Cơ khí (chạy 2 lần) |
| Scout-block (node_modules…) | — | `scout-block.cjs` `exit(2)` | Cơ khí |
| RUL11 tồn tại đúng chữ | `AGENTS.md:97-105` | `test/docs/rul11-anchor-phrase.test.mjs` | Cơ khí **cho câu chữ**, văn xuôi **cho hành vi** |
| Thuật ngữ đã retire không quay lại | — | `test/runner/dead-vocabulary-guard.test.mjs` | Cơ khí |
| Mã quyết định, citation | — | `scripts/check-decision-codes.mjs`, `check-decision-citation-drift.mjs` + test | Cơ khí |
| Hook script có guard khi thiếu file | — | `scripts/check-hook-registrations-guarded.mjs` | Cơ khí. Có điều nó chỉ lo "đừng crash khi thiếu file", tức là đang hợp thức hóa việc hook không có trong worktree |
| GitNexus impact trước khi sửa | `CLAUDE.md`, `AGENTS.md` (×2) | gitnexus-hook chỉ làm giàu Grep/Bash, không có `exit(2)` | **Văn xuôi** |
| Tên/vị trí report và plan | hook ×2, rules ×2 | không có (`descriptive-name` trả `permissionDecision: allow`) | **Văn xuôi**, mâu thuẫn |
| Markdown chỉ ở plans/ và docs/ | hook ×2 | không | Văn xuôi |
| Prior art trước khi thiết kế, tra skill roster trước khi tự chế | `AGENTS.md:42-47`, `.claude/rules/primary-workflow.md:19`, MEMORY | không | Văn xuôi |
| Đọc reading-map và spec trước khi sửa code | `AGENTS.md:36-40` | không | Văn xuôi |
| Gate install/setup/doctor, dòng CHANGELOG | `AGENTS.md:72-90` | không tìm thấy test hay doctor nào ép (grep `test/` theo `Unreleased`/`CHANGELOG`: không có test chuyên) | Văn xuôi (chưa chứng minh tuyệt đối) |
| Mỗi doc có đúng một H1 | `.claude/rules/documentation-management.md:30` | không có lint (grep "one H1" trong test/scripts/src: 0) | Văn xuôi |
| mdview sau mỗi file markdown | `CLAUDE.md`, `AGENTS.md` (×2) | không | Văn xuôi; L8 placement test cũng nghi vấn |
| L8 anchor-suite cho mọi doctrine rule | `docs/platform-foundations.md:209` | chỉ RUL11 có anchor test (test tự ghi "RUL1-RUL10 do not have an equivalent test yet") | Luật cơ khí hóa **1/13 mục** H2 của AGENTS.md |

## 6. Bị chôn, sai vị trí

- RUL11 và "Prior art before design" nằm ở khoảng 32-38% chiều dài lớp markdown, giữa khối product-priority và hai khối công cụ (GitNexus, MDView). Phía sau còn khoảng 14 KB rules generic và 13 KB memory.
- Ngược lại, khối hook generic (YAGNI, "Sacrifice grammar", "Modularization", "Naming") được chèn **mỗi lượt sát prompt người dùng**. Đó là vị trí chú ý cao nhất. Nó cũng là nguồn mâu thuẫn chính.
- `docs/doc-governance.md`, chỗ định nghĩa thật về vị trí và loại tài liệu, **không được lớp nào luôn nạp nhắc tới**: grep AGENTS/CLAUDE/rules ra 0 kết quả.
- RUL11 không có "transport": không nói path nào, tên nào, tra bằng lệnh gì. L8 mục 2 nói rule như vậy "behaves exactly like no rule at all" (`docs/platform-foundations.md:203-207`).

## 7. Thừa, dead weight (có bằng chứng)

- `~/.claude/rules/documentation-management.md:7-12` liệt kê 5 file docs mà **cả 5 đều không tồn tại** trong repo (`code-standards`, `system-architecture`, `project-roadmap`, `development-roadmap`, `project-changelog`).
- `~/.claude/rules/CLAUDE.md` (2,8 KB) gồm "ClaudeKit Engineer Context" và danh sách "On-Demand References" trỏ tới chính các file đã được tự nạp (M9).
- Bản sao thứ hai của GitNexus và MDView: khoảng 3,9 KB mỗi phiên.
- "Previous Session State" của `session-init` global: tới 214 KB các dòng "Agent Result: unknown", không có thông tin nào.
- "Project: library | PM: npm" (`project-detector.cjs:358/381`): nhận diện sai loại project, in mỗi lần SessionStart từ hai nguồn.
- Lặp mỗi lượt các dòng không phụ thuộc lượt (DateTime, CPU, Memory…). Median 40 KB/phiên, khoảng 11k token mỗi phiên chỉ cho khối rules.
- Hook RTK viết lại output lệnh chuẩn: `ls` in kèm kích thước, `find -exec` bị từ chối. Lần đếm đầu tiên của chính em vì thế ra **sai** (0 khớp, phải chạy lại bằng `find -printf`). MEMORY có 3 mục feedback về rtk (dòng 15, 28, 51). Đây là nhiễu công cụ làm sai số đo của agent, có bằng chứng trực tiếp trong phiên này.

## 8. Hướng gom (gợi ý cho lead, chưa phải quyết định)

Mỗi hướng đều giảm số nguồn, không thêm nguồn:

1. **Một kit hook, không hai.** Bỏ đăng ký 11 hook trùng ở một phía (global `ck` hoặc project `ak`). Đo được: tỉ lệ prompt nhận cả hai khối từ 83% xuống 0%. Rủi ro: ClaudeKit có "self-heal" đọc `managed-hooks.json` để đăng ký lại (`~/.claude/hooks/managed-hooks.json:2`), nên tắt phải đi qua cấu hình của ck. Bỏ đi: một bộ hook và một bộ rules.
2. **Rules repo phải được track, hoặc không tồn tại.** Hiện tại rules và hooks ở main khác với worktree. Có hai lựa chọn: track `.claude/rules/` (hook project cũng vậy), hoặc gom nội dung riêng của repo vào `AGENTS.md` và bỏ `.claude/rules/`. Đo được: số worktree có 0 rules giảm từ 5/5 về 0.
3. **Khối sinh tự động ra khỏi file viết tay, và chỉ một bản.** GitNexus và MDView chỉ nên nằm trong một trong hai file (`CLAUDE.md` đã import `AGENTS.md`). Đo được: trùng chính xác từ 9% xuống khoảng 3%; commit churn số symbol về 0.
4. **Một nguồn tên cho plan và report**, do một lệnh sinh ra (ví dụ `ak plan create` và một lệnh tương ứng cho report), và hook chỉ trỏ tới lệnh đó. Bỏ `{type}-…-report.md`, `{type}-….md`, `-YYMMDD.md` cùng các dòng Naming trong hook. Đo được: quy ước tên chiếm tỉ lệ cao nhất từ 34% lên ≥90% với báo cáo mới.
5. **Cho RUL11 "transport"** theo L8 mục 2: ở chỗ RUL11, một dòng trỏ tới `docs/doc-governance.md` và lệnh tra skill hoặc khả năng sẵn có. Bỏ đi: `~/.claude/rules/documentation-management.md` và `~/.claude/rules/CLAUDE.md` (dead weight trong repo này).
6. Sửa M6 (`AGENTS.md:64-65`) và M11 (MEMORY): xóa câu sai, không thêm gì.

## 9. UNPROVEN, giới hạn

- Claude Code có khử trùng hai đăng ký hook có chuỗi lệnh y hệt (`simplify-gate` ×2 trong `.claude/settings.json`) hay không: chưa kiểm.
- Worktree lồng trong `.claude/worktrees/` có nạp thêm `CLAUDE.md` của main theo cơ chế đi lên thư mục cha hay không: chưa kiểm.
- Ước lượng token: dùng heuristic, không phải tokenizer. Danh sách skill tính theo description cắt ở 250 ký tự.
- Chuyện `ak plan create` dùng giờ UTC: suy từ thời điểm commit, chưa chạy thử.
- Quan hệ nhân quả giữa mâu thuẫn hook và việc đặt tên lung tung mới chỉ là tương quan. Vai 5 (pháp y) cần ca transcript cụ thể.
- Số "commit churn GitNexus" lấy bằng grep tiêu đề commit, nên có thể đếm thiếu hoặc thừa vài commit.

## Câu hỏi chưa giải quyết

1. Anh muốn giữ kit nào làm nguồn hook duy nhất cho repo này, ClaudeKit global hay AgentKit project? Còn các project khác của anh thì vẫn dùng ClaudeKit global chứ?
2. Việc `.claude/rules/` bị gitignore là có chủ ý (rules do kit cài, không thuộc repo) hay là sót?
3. Repo có nên chỉ còn một reading-map và một platform-foundations không? Phần này giao vai 3 xác nhận.

Status: DONE_WITH_CONCERNS
Summary: Em đã đo đủ các lớp nạp (khoảng 64 KB markdown, cộng khoảng 50 KB danh sách skill, cộng khoảng 6,4 KB hook mỗi lượt) và liệt kê 12 mâu thuẫn có file:dòng. Gốc lớn nhất là hai kit hook (ck global và ak project) cùng chạy, nói ngược nhau ở 83% prompt. Thêm vào đó, rules và hooks của repo bị gitignore nên worktree chạy một bộ luật khác.
Concerns: Quan hệ nhân quả với hành vi mới là tương quan, cần vai 5 xác nhận. Còn 3 điểm UNPROVEN về cơ chế nạp của Claude Code và giờ UTC của `ak`.
