# Kiểm toán cưỡng chế: bất biến RUL11 nào có cơ chế ép, bất biến nào chỉ là văn xuôi

Vai 6 trong cuộc điều tra harness drift (brief: [prompt-261006-0955-investigate-harness-drift-rul11.md](../prompt-261006-0955-investigate-harness-drift-rul11.md)). Em chỉ đọc. Lệnh duy nhất có chạy là các script check ở chế độ đọc (`node scripts/check-*.mjs`, không truyền cờ ghi baseline); `git status` sau khi chạy không có thay đổi nào. Ngày đo: 2026-10-06, nhánh `main`.

## 1. Kết luận ngắn

1. **Phần cưỡng chế cũng đang tùm lum.** Kiểm tra cơ học đi qua 5 cửa khác nhau: `npm test`, một bước riêng trong CI, `fgos preflight` (chỉ chạy tay), `fgos doctor`, và hai script không cửa nào gọi. Hai check được viết riêng để ép một bất biến RUL11 thì **chưa bao giờ chạy trên repo thật**:
   - `check-decision-codes` hiện **exit 1, có 375 vi phạm mới vượt baseline**.
   - `check-hook-registrations-guarded` mồ côi, chưa từng được nối vào cửa nào.
2. **Code thì được ép tốt, harness/tài liệu thì không.** Ranh giới import, một cửa adapter, ghi `.fgos` lúc commit và bản render skill đều có test hoặc hook chặn thật. Còn các bất biến người dùng đang than thì gần như chỉ là văn xuôi: path/tên của plan/report/doc, vị trí tài liệu, "tra có sẵn trước khi tạo", "prior art", "đọc spec trước". Lấy ví dụ prior art: luật vào AGENTS.md từ 2026-10-02, từ đó chỉ **1/8** plan.md có nhắc đến nó.
3. **Chính harness đang bơm mâu thuẫn bằng cơ chế.** Hook cùng tên được đăng ký ở cả `~/.claude/settings.json` lẫn `.claude/settings.json`, nên mỗi lần spawn subagent nạp hai khối Rules/Naming nói ngược nhau. Lần spawn em đây đã nhận đúng hai khối đó (chi tiết ở mục 3.3).
4. Đề xuất (mục 4) đều theo một hình dạng: **gom check về một cửa, gom hook về một nguồn, rồi xoá văn xuôi mà cơ chế đã thay**. Không có đề xuất nào chỉ thêm luật.

## 2. Bảng bất biến và cơ chế hiện có

Chú giải loại cơ chế:
- **CHẶN**: có cơ chế làm fail hoặc refuse.
- **NHẮC**: chỉ tiêm context hoặc in cảnh báo.
- **MỤC**: có check nhưng không cửa nào chạy nó trên repo thật.
- **VX**: chỉ có văn xuôi.

| # | Bất biến | Cơ chế hiện có (file:line) | Loại | Phần còn là văn xuôi |
|---|---|---|---|---|
| I1 | Gọi `dispatch decide` trước khi dùng Agent/Task | PreToolUse `scripts/dispatch-decide-hook.mjs:52-73` tự chạy `decide`, exit 2 nếu kết quả không phải in-process. Đăng ký ở `.claude/settings.json:60`, doctor `dispatch-decide-hook-wired` (`src/setup/registrations.mjs:1442`) | **CHẶN** | AGENTS.md:112 vẫn bắt agent tự chạy `decide` trước. Đây là nghi thức thừa, vì hook tự chạy `decide` thay agent (header :3-8). Dispatch ra ngoài lượt qua Bash/herdr thì không có cơ chế (VX). |
| I2 | Chỉ ghi `.fgos/` qua verb (one-door-write) | `.githooks/pre-commit`: :346 chặn commit xoá `.fgos`, :352 chặn commit `.fgos` từ nhánh worker, :391 chặn số dòng tụt trên main. `core.hooksPath` đã nối đúng, có doctor `main-checkout-hook-wired` :1436. Doctor `events-jsonl-not-truncated` :1858 | **CHẶN lúc commit** | Lúc ghi file thì không có gì chặn: không hook nào trong `.claude/hooks` hay `~/.claude/hooks` chặn Write/Edit vào `.fgos/**` (grep `.fgos` trong hai thư mục hook ra 0 file). |
| I3 | Path `.fgos` chỉ có một nguồn (resolver) | Resolver `src/runner/paths.mjs:92` `fgosDirFromRoot`. SessionStart tiêm path chuẩn qua `scripts/fgos-session-start-hook.mjs:22-30` | **NHẮC** | Có 78 lời gọi `path.join(…, '.fgos')` tự dựng path, rải ở 23 file `src/`/`bin/`. Không test nào ratchet. |
| I4 | Tên plan/report đi qua một cửa | Hook tiêm template tên, nhưng có **hai bản lệch nhau**: global `~/.claude/hooks/subagent-init.cjs:187` (`{type}-{pattern}-report.md`) và project `.claude/hooks/subagent-init.cjs:201` (`{type}-{pattern}.md`). Pattern lấy từ `~/.claude/.ck.json` `plan.namingFormat` | **NHẮC (mâu thuẫn)** | Không có check nào. `descriptive-name.cjs:16` còn ghi rõ "Skip this guidance if you are creating markdown". Đo được: 158/253 mục trong `plans/reports/` (62%) khớp mẫu `<type>-YYMMDD-HHMM-…`; 18/21 mục trong `plans/` khớp mẫu thư mục. Brief của chính cuộc điều tra này cũng đặt một quy ước thứ ba (`<vai>-261006.md`). |
| I5 | Tài liệu chỉ nằm ở `docs/` và `plans/`, đăng ký qua doc registry | `docRegistry.enforce=true` (`.fgos/config.json:1466`), nhưng chỉ gác verb `compound`/attest (`bin/fgos.mjs:1597,1694-1705`). Doctor có `doc-registry-enforce` :3581 (chỉ kiểm config có kiểu boolean) và check stale/alias | **CHẶN hẹp** | Ghi bằng tool Write thì đi vòng qua registry hoàn toàn. Registry chỉ phủ **478/3130** file `.md` đang được track trong `docs/` (15%). Số file đã đăng ký theo thư mục: `specs` 0/14, `platform` 0/439, `architect` 0/415, `history` 0/1678; chỉ `knowledge` 332/332 và `explanation` 136/137 là gần đủ. Có file lạc ở gốc repo: `tsk-1op-case-study-note.md`. |
| I6 | Mỗi chỉ dẫn trong lớp instruction phải trỏ đúng một nguồn | Doctor `instruction-projections-stale` :3548 chỉ phủ khối "fgOS Effective Instructions" của AGENTS.md | **VX** | Xem mục 3.4: có link chết, hai file luật nền trùng tên, và AGENTS.md tự mâu thuẫn. |
| I7 | Đọc `reading-map` và spec trước khi đụng code | không có | **VX** | AGENTS.md:36-40. Không skill coding nào trỏ tới `reading-map` (grep `domains/coding/skills`: 0; chỉ `core/skills/fgos-indexing` có nhắc, và là để bảo trì chính file đó). |
| I8 | Tra prior art trước khi thiết kế | không có | **VX** | AGENTS.md:42-49, chép lại ở `.claude/rules/primary-workflow.md:20`. Không có trong `domains/coding/skills/fgos-coding-planning/SKILL.md` (grep 0). Đo được: 1/8 plan.md tạo sau commit `b048e852d` (2026-10-02) có nhắc prior art. |
| I9 | Tra năng lực có sẵn trước khi tạo skill/agent | Test drift của bản render: `test/setup/skill-wrappers.test.mjs:269`, và `fgos preflight` chạy build:skills rồi diff (`bin/fgos.mjs` ~3992-4001). Doctor `agent-type-names-unique` :1430 (chỉ xét agent yaml). Doctor `plugin-dev-skills-packaged` :3111 | **CHẶN cho bản render**, **VX cho trùng chức năng** | Không check nào bắt tên skill chồng giữa các cây: **91** tên trùng (sau khi bỏ tiền tố `ak-`/`ck-`) giữa `~/.claude/skills` (104 mục) và `.claude/skills` (133 mục). |
| I10 | Không nhét mã quyết định vào tên test/comment/commit (Stable Code Artifacts) | `scripts/check-decision-codes.mjs`: ratchet baseline, chỉ xét tên test | **MỤC** | Chưa từng được nối vào CI, `npm test` (với repo thật), pre-commit hay `bin`. `git log -S` trên `.github`, `.githooks`, `bin/fgos.mjs`, `package.json`, `run-tests.mjs` ra 0 commit. Test của nó chỉ chạy trên fixture tmp (`test/scripts/check-decision-codes.test.mjs:211-343`), đúng như CONTEXT dự định (`docs/history/decision-code-check-enforcement/CONTEXT.md:63-75`). Chạy thật: **exit 1, 375 vi phạm mới**. Comment code: 1141 dòng mang ID trong 104 file `src/`/`bin/`, không check nào. Commit: 6/500 subject có ID, 0/100 commit gần nhất, nên không cần cơ chế. |
| I11 | Mọi hook đăng ký trỏ vào `.claude/hooks` phải có guard tồn tại | `scripts/check-hook-registrations-guarded.mjs` (commit `dc131ddb9`) | **MỤC** | Không test/CI/doctor/preflight nào gọi. Chạy tay hôm nay thì pass 21/21. |
| I12 | Config mới phải đăng ký vào setup/doctor | Có registry `registerConfigDefault`/`registerCheck` | **VX** cho phần "phải đăng ký" | AGENTS.md:76-90. AGENTS.md:80 trỏ registry ở `src/setup/checks.mjs`, nhưng file đó chỉ là shim re-export (`checks.mjs:1-8`); registry thật nằm ở `registrations.mjs` (261 KB, 114 id). Có test bắt key config chưa đăng ký không: **UNPROVEN**. |
| I13 | Thay đổi người dùng thấy được thì ghi CHANGELOG | Doctor `changelog-unreleased-stale` :3165 | **NHẮC** (theo thiết kế, không chặn merge) | — |
| I14 | Kiến trúc: import một chiều, domain silo, một cửa adapter | `test/architecture.test.mjs:119-744`, manifest 220 file | **CHẶN** (`npm test`) | Ổn, giữ nguyên. |
| I15 | Chỉ sửa ở `core/skills`, không sửa bản render | `skill-wrappers.test.mjs:269` và preflight | **CHẶN** lúc test | Ổn. Lúc ghi thì không có gì chặn (đã có ca trong memory: sửa tay bị revert âm thầm). |
| I16 | Không commit trên nhánh ở main checkout | `.githooks/pre-commit:380` | **CHẶN** | Ổn. |
| I17 | Gateway chỉ khởi động qua `fgos gateway start` | không có | **VX** | AGENTS.md:132-135. |
| I18 | Mỗi lớp instruction chỉ có một nguồn (không trùng, không mâu thuẫn) | không có | **VX**, và còn **bị phá bởi chính cơ chế** | Xem mục 3.3. |

Tổng cộng, trong 18 bất biến:
- **CHẶN, chạy thật trên repo**: 5 bất biến (I1, I14, I15, I16 chặn đủ; I2 chặn lúc commit).
- **Chặn một phần**: I5 (chỉ gác verb `compound`) và I9 (chỉ gác bản render).
- **NHẮC**: I3, I4 (I4 còn nhắc ngược nhau giữa hai bản hook), I13.
- **MỤC**: I10, I11.
- **Chỉ VX**: I6, I7, I8, I12, I17, I18.

## 3. Các phát hiện, kèm bằng chứng

### 3.1 Cưỡng chế đi qua 5 cửa, không có cửa nào chạy tất cả

| Script check | `npm test` (repo thật) | CI | `fgos preflight` | doctor | Kết quả chạy thật hôm nay |
|---|---|---|---|---|---|
| check-decision-codes | ✗ (chỉ fixture) | ✗ | ✗ | ✗ | **exit 1 (375 vi phạm mới)** |
| check-decision-citation-drift | ✗ (fixture) | ✗ | ✓ | ✗ | 0 |
| check-backlog-reconciliation | ✗ | ✗ | ✓ | ✗ | **exit 1** (3 PBI thiếu section trong RECONCILIATION.md) |
| check-decision-supersession | fixture | ✗ | ✗ | ✗ | 0 |
| check-locked-decisions-heading-drift | fixture | ✗ | ✗ | ✗ | 0 |
| check-hook-registrations-guarded | ✗ | ✗ | ✗ | ✗ | 0 |
| test-ownership-lint | fixture | ✓ (`ci.yml:131`) | ✗ | ✗ | 0 |

Hai ý từ bảng:
- `fgos preflight` (`bin/fgos.mjs:3981`) không được CI, pre-commit hay skill nào gọi; grep `.github`, `.githooks` và các SKILL.md đều ra 0.
- Mẫu "test chỉ chứng minh trên fixture" chỉ chứng minh check *có thể* bắt lỗi, không chứng minh repo *đang* sạch. Ratchet không ai chạy thì baseline mục dần, đúng như con số 375.

### 3.2 Văn xuôi lặp lại phần cơ chế đã ép (thừa)

- AGENTS.md:112 bảo agent tự chạy `decide` trước mỗi lần gọi Agent/Task. Hook đã tự làm việc đó (`dispatch-decide-hook.mjs:3-8,52`). Brief điều tra này (dòng 29) cũng lặp lại nghi thức đó.
- Khối GitNexus và MDView có hai lần:
  - Ở `CLAUDE.md:50-122`.
  - Ở `AGENTS.md:137-209`.

  Vì `CLAUDE.md:6` nạp `@AGENTS.md`, mỗi phiên nạp hai bản giống nhau.

### 3.3 Cơ chế tự sinh mâu thuẫn: hook bị đăng ký hai lần

Hook bị đăng ký trùng như sau:

| Sự kiện | Hook | Số lần đăng ký | Nguồn |
|---|---|---|---|
| UserPromptSubmit | `secret-output-guardrail` | 2 | `.claude/settings.json:163,176` |
| UserPromptSubmit | `simplify-gate` | 3 | `.claude/settings.json:167,184`, cộng 1 bản global |
| UserPromptSubmit | `dev-rules-reminder` | 2 | 1 project, 1 global |
| SubagentStart | `subagent-init` | 2 | 1 project, 1 global |
| SessionStart | `session-init` | 2 | 1 project, 1 global |
| PreToolUse | `descriptive-name`, `scout-block`, `privacy-block` | 2 mỗi hook | 1 project, 1 global |

Hai bản là hai codebase khác nhau, không cùng thư viện:
- Mỗi bản có cơ chế chống tiêm lặp riêng (`dev-rules-reminder.cjs:68` ở project, `:59-62` ở global), nên không bản nào chặn được bản kia.
- Doctor có kiểm hook *có được nối* hay không (`dispatch-decide-hook-wired`), nhưng không kiểm hook *bị nối trùng*.

Bằng chứng trực tiếp là context SubagentStart của chính lần spawn em đây có hai khối:

| Nội dung | Khối 1 (global, `~/.claude/hooks/subagent-init.cjs`) | Khối 2 (project, `.claude/hooks/subagent-init.cjs`) |
|---|---|---|
| Rules | `- YAGNI / KISS / DRY` (:176) | `- KISS / DRY. … YAGNI only if … --yagni` (:187) |
| Tên report | `…-{slug}-report.md` (:187) | `…-{slug}.md` (:201) |

Thêm một bằng chứng trực tiếp: lúc em Write chính file báo cáo này, PreToolUse `descriptive-name` tiêm hai khối nói ngược nhau.

| Bản hook | Hướng dẫn cho file Markdown |
|---|---|
| Global | "For Markdown/plain text reports and plans, use the ## Naming path" |
| Project | "Skip this guidance if you are creating markdown" |

Khối 1 ngược với một quyết định người dùng đã chốt: `.claude/rules/development-rules.md:8-12` ghi YAGNI là opt-in. File trùng tên `~/.claude/rules/development-rules.md:8` thì ghi "Prefer YAGNI, KISS, and DRY in that order".

### 3.4 Chỉ dẫn trỏ sai hoặc trùng nguồn (I6)

- `docs/platform-foundations.md` (16 KB) và `docs/specs/platform-foundations.md` (33 KB) cùng tồn tại:
  - AGENTS.md:8,60 trỏ bản ở `docs/`.
  - AGENTS.md:27,97 trỏ bản ở `docs/specs/`.
- AGENTS.md:65 bảo "settled decision goes into `docs/decisions/`". Cũng file đó, ở :13 và :25, lại nói corpus `docs/decisions/*.md` đã retire. Hiện `docs/decisions/` chỉ còn `index.md`.
- Link chết:
  - `domains/coding/AGENTS.md:44` trỏ `docs/how-to/fix-fgos-write-rejected-merge-block.md` và `docs/how-to/resolve-an-events-jsonl-merge-conflict.md`. Cả hai đã bị registry chuyển sang `docs/knowledge/...`; path cũ chỉ còn là alias (`docs/doc-registry.json:6366-6368`).
  - Path chết đó còn nằm trong **thông báo lỗi lúc chạy**: `.githooks/pre-commit:352,391` và `src/runner/merge.mjs`.
- AGENTS.md:80 trỏ registry doctor ở `src/setup/checks.mjs`, nhưng đó chỉ là shim.

Gốc chung: doc registry có lệnh chuyển file, nhưng không có check nào quét các chỗ đang tham chiếu tới path cũ.

## 4. Đề xuất theo hình dạng RUL11

Mỗi đề xuất ghi rõ thứ bị xoá. Xếp theo tác động.

### E1. Một cửa cho mọi check: `fgos preflight` chạy trong CI

- **Gom**:
  - Một danh sách check duy nhất, tạm gọi là registry cho preflight. Có thể dùng luôn `registerCheck` của doctor để khỏi tạo registry mới.
  - Đưa vào đó mọi `scripts/check-*.mjs` và `test-ownership-lint`, chạy chúng **trên repo thật**.
  - CI gọi đúng một lệnh `fgos preflight`. Nếu được thì gọi thêm ở pre-push.
- **Xoá**:
  - Bước CI riêng `npm run test:ownership:lint` (`ci.yml:131`).
  - Tình trạng mồ côi của `check-hook-registrations-guarded`: gộp nó vào E2.
  - Với `check-decision-codes`: hoặc rebaseline rồi nối vào preflight, hoặc **xoá hẳn script cùng câu luật "test name" trong rules**. Cách nào cũng được, miễn không còn treo một luật có check giả.
- **Tác động**: không còn check nào "viết xong, không ai chạy"; luật nào có check thì check đó chạy thật.
- **Đo**:
  - Số script check không đi qua cửa preflight: hiện 7/7 không chạy trong CI, mục tiêu 0.
  - Số check exit≠0 trên `main`: hiện 2, mục tiêu 0, hoặc được ghi baseline có chủ ý.
- **Rủi ro**: CI đỏ ngay vì 375 vi phạm và 3 PBI. Cần anh chọn rebaseline hay dọn trước (mục 6).

### E2. Một nguồn hook cho mỗi việc, doctor bắt hook trùng

- **Gom**: trong repo này, mỗi sự kiện hook chỉ có một bản. Bản project mang luật fgOS và quyết định `--yagni` của anh. Bản global là của kit `ck`.
- **Xoá**:
  - Nhóm UserPromptSubmit thứ hai đăng ký trùng `secret-output-guardrail`/`simplify-gate` (`.claude/settings.json:159-190`, giữ một nhóm).
  - Các bản global trùng tên khi chạy trong repo này (`dev-rules-reminder`, `subagent-init`, `session-init`, `descriptive-name`, `scout-block`, `privacy-block`). Cách tắt (cờ `isHookEnabled` của ck-config, hoặc sửa settings global) là việc của anh, vì đó là file global.
  - Script mồ côi `check-hook-registrations-guarded.mjs`: logic của nó chuyển thành một doctor check `hook-registrations` gồm hai việc, có guard và không trùng project/global.
- **Tác động**:
  - Mỗi lượt chỉ còn một khối Rules/Naming, hết mâu thuẫn YAGNI.
  - Chỉ còn một template tên report: chọn bản project, xoá đuôi `-report` của global.
- **Đo**:
  - Đếm khối `## Rules` trong context SubagentStart: hiện 2, mục tiêu 1.
  - Tỷ lệ report mới trong `plans/reports/` khớp một mẫu, đo trên file tạo sau ngày áp dụng: hiện 62% trên toàn bộ file.
- **Rủi ro**: tắt hook global có thể làm mất tính năng ở project khác. Phạm vi chỉ nên là repo này. Cần anh quyết (mục 6).

### E3. Mỗi path trong chỉ dẫn phải trỏ đúng một nguồn: một check thay cho dọn tay

- **Gom**: một check (đặt trong preflight của E1) quét các path `docs/…`, `src/…`, `scripts/…` trong:
  - `AGENTS.md`, `CLAUDE.md`, `domains/*/AGENTS.md`, `.claude/rules/*.md`;
  - chuỗi thông báo trong `.githooks/` và `src/`.

  Path phải tồn tại và phải là `currentPath` của registry, không phải alias.
- **Xoá**:
  - Một trong hai file `platform-foundations.md`; bản còn lại đăng ký bản kia làm alias.
  - Câu AGENTS.md:65 về `docs/decisions/`.
  - Pointer sai AGENTS.md:80.
  - Khối GitNexus và MDView trùng trong `CLAUDE.md:50-122`, khoảng 4,5 KB mỗi phiên. `@AGENTS.md` đã nạp chúng rồi. Lưu ý: khối GitNexus do `gitnexus analyze` tự sinh lại, nên phải chỉnh nơi sinh (AGENTS.md hay CLAUDE.md), không xoá tay.
- **Tác động**: sau mỗi `fgos doc move-path`, chỉ dẫn không còn trỏ chết; đọc chỉ dẫn chỉ ra một nguồn luật nền.
- **Đo**: số tham chiếu chết hoặc chỉ là alias. Hiện em đếm được ≥ 5 (2 link trong `domains/coding/AGENTS.md`, 2 thông báo lỗi, 1 pointer `checks.mjs`). Cộng thêm 1 cặp file trùng. Mục tiêu 0.
- **Rủi ro**: thấp. Check chỉ đọc. Cần chốt bản `platform-foundations` nào là gốc (mục 6).

### E4. Vị trí tài liệu: biến hook `descriptive-name` đang chỉ nhắc thành hook chặn

- **Gom**: hook `descriptive-name` vốn đã chạy trên mọi Write, nhưng đang bỏ qua markdown (`descriptive-name.cjs:16`). Thay khối văn xuôi đó bằng một luật cơ học: Write file `.md` mới ngoài `docs/**` và `plans/**` thì bị refuse. Allowlist gồm `README.md`, `CHANGELOG.md`, `AGENTS.md`, `CLAUDE.md`, `**/SKILL.md`, `apps/**/README.md`, `.claude/**` và `domains/*/AGENTS.md`; lấy từ config, có doctor check.
- **Xoá**:
  - Đoạn văn xuôi gợi ý đặt tên trong `descriptive-name.cjs:15-20`.
  - Dòng "Save plans under …" trong `~/.claude/rules/documentation-management.md`, vì hook đã ép.
- **Tác động**: không còn file lạc kiểu `tsk-1op-case-study-note.md` ở gốc repo.
- **Đo**: số file `.md` mới ngoài allowlist mỗi tuần (`git log --diff-filter=A`), mục tiêu 0.
- **Rủi ro**:
  - Chặn nhầm một chỗ hợp lệ chưa có trong allowlist. Giảm rủi ro bằng cách để allowlist trong config và cho hook fail-open khi lỗi, giống `dispatch-decide-hook.mjs:20-25`.
  - Hook chỉ có trong Claude Code. Agent khác (codex/pi/agy) không bị ép; cần E1 bắt lại lúc preflight.

### E5. Prior art và spec-before-code: chuyển từ văn xuôi sang trường bắt buộc trong `plan.md`

- **Gom**:
  - Template `plan.md` của `fgos-coding-planning` có một section bắt buộc "Prior art & spec đã đọc", gồm lệnh `git log -S` đã chạy, spec đã đọc, và thứ được tái dùng hoặc còn thiếu.
  - `fgos-coding-validating`, hoặc verb `plan`, refuse `plan.md` có section rỗng. Đây là kiểm cơ học sự hiện diện, không chấm chất lượng.
- **Xoá**:
  - Bản chép ở `.claude/rules/primary-workflow.md:20`.
  - Đoạn AGENTS.md:42-49, rút còn một dòng trỏ tới template.
- **Tác động**: tăng tỷ lệ plan có nhắc prior art, hiện 1/8 kể từ khi luật ra đời.
- **Đo**: tỷ lệ `plan.md` mới có section không rỗng, mục tiêu ≥ 90%. Kèm số ca memory feedback kiểu "tự chế xong mới biết đã có" mỗi tháng; cái này nên lấy từ vai Pháp y.
- **Rủi ro**:
  - Thành hình thức điền cho có. Cái này chỉ đo được bằng mẫu, ghi UNPROVEN.
  - Chỉ phủ luồng coding domain. Plan sinh bằng `ak:plan` không đi qua đây.

### E6. Ratchet path `.fgos` (tác động thấp hơn, chỉ ở mức code)

- **Gom**: thêm một test trong `test/architecture.test.mjs`, file đã là cửa ép kiến trúc. Test đếm số lời gọi `path.join(…'.fgos')` ngoài `paths.mjs`; baseline 78 chỉ được giảm.
- **Xoá**: 78 bản sao dần dần, thay bằng `fgosDirFromRoot`/`resolveFgosDir`.
- **Đo**: số đếm giảm đơn điệu.
- **Rủi ro**: một số chỗ cố ý dùng path của worktree thay vì main checkout. Cần đọc từng chỗ, không thay hàng loạt.

Có hai việc em cố ý **không đề xuất**:
- Hook chặn Write/Edit vào `.fgos/**` lúc ghi (I2). Chưa chứng minh được không có luồng hợp lệ nào ghi tay vào `.fgos` (memory có nhắc `current-cell.md` của coordination). Pre-commit đã chặn được phần nguy hiểm.
- Doctor check tên skill trùng giữa các cây (I9). Việc này phụ thuộc quyết định giữ kit `ck` hay `ak` ở repo này, thuộc phạm vi vai Kiểm toán catalog.

## 5. Cái đang chạy tốt, nên giữ

| Cơ chế | Nơi đặt | Bảo vệ bất biến |
|---|---|---|
| Kiến trúc | `test/architecture.test.mjs` + `docs/architecture-manifest.json` | I14 |
| Pre-commit `.fgos` và main-checkout | `.githooks/pre-commit` | I2, I16 |
| Hook dispatch | `scripts/dispatch-decide-hook.mjs` | I1 |
| Test drift bản render skill | `test/setup/skill-wrappers.test.mjs:269` | I15 |
| Doctor registry | `registerCheck`/`registerFix` | Nơi hợp lý để E1 và E2 gom vào |

Mẫu chung của nhóm này: bất biến được ép **ngay tại cửa mà agent buộc phải đi qua** (commit, gọi Agent, `npm test`), không phải ở một lệnh tuỳ chọn.

## 6. Quyết định cần anh

| # | Câu hỏi | Lựa chọn | Đánh đổi | Khuyến nghị |
|---|---|---|---|---|
| D1 | `check-decision-codes` xử lý thế nào? | (a) Rebaseline 375 rồi nối vào preflight. (b) Dọn 375 rồi nối. (c) Xoá script và câu luật về tên test. | (a) nhanh nhưng hợp thức hoá nợ. (b) tốn công. (c) bỏ hẳn một luật. | (a), vì nó chặn nợ mới ngay. Commit message vốn đã sạch, không cần check. |
| D2 | Bỏ bản hook nào trong repo này? | Bản global (ck) hay bản project (ak/fgOS) | Bản project mang quyết định `--yagni` của anh. Bản global mang `-report.md` và YAGNI mặc định. | Giữ bản project, tắt bản global theo phạm vi project. |
| D3 | Bản `platform-foundations.md` nào là gốc? | `docs/` (16 KB) hay `docs/specs/` (33 KB) | — | `docs/specs/`, vì AGENTS.md:27 và :97 (RUL11, D-ADR0035/0036) đã trỏ về đó. Bản `docs/` thành alias. Em chưa so nội dung hai bản nên đây vẫn là UNPROVEN. |
| D4 | Doc registry phủ 15% có còn là "một cửa" cho tài liệu không? | Mở rộng sang `specs`/`platform`/`architect`, hay thu hẹp lời tuyên bố về đúng phạm vi `knowledge`/`explanation` | — | Đây là quyết định sản phẩm. Em chưa có khuyến nghị. |
| D5 | Có đưa `fgos preflight` vào CI không? | Có / không | Sẽ đỏ cho tới khi xong D1 và có 3 section RECONCILIATION. | Có. |

## 7. UNPROVEN và câu hỏi còn mở

- UNPROVEN: có test nào bắt key config mới chưa qua `registerConfigDefault` không (I12). Em chưa tìm thấy, nhưng cũng chưa quét đủ 114 id doctor.
- UNPROVEN: hai khối Rules mâu thuẫn có thật sự dẫn tới hành vi chệch không. Em chỉ chứng minh được mâu thuẫn có tồn tại và được tiêm vào context; quan hệ nhân quả là phần của vai Pháp y.
- UNPROVEN: brief nói `ak plan create` đặt tên theo giờ UTC. Em không chạy lại; thuộc vai Kiểm toán path/tên.
- UNPROVEN: E5 có làm tăng prior-art thật hay chỉ sinh ra section điền cho có.
- UNPROVEN: nội dung hai file `platform-foundations.md` khác nhau tới đâu.
- Em không chạy `fgos doctor`: một số check gọi `rebuild(fgosDir)`, và em chưa chắc nó không ghi view. Vì vậy trạng thái pass/fail hiện tại của 114 check doctor chưa được đo.
- Câu hỏi: có luồng hợp lệ nào để agent ghi tay vào `.fgos/**` không? Nếu không có, nên thêm chặn lúc ghi cho I2.
- Câu hỏi: cờ `isHookEnabled` (`ck-config-utils`) có tắt được hook global theo phạm vi project không, hay phải sửa `~/.claude/settings.json`?

Status: DONE_WITH_CONCERNS
Summary: Em đã lập bảng 18 bất biến với cơ chế (file:line). Chỉ 5 cái được chặn thật trên repo; I5 và I9 chặn một phần; các bất biến về path, tên, vị trí tài liệu và prior art gần như chỉ là văn xuôi. Cưỡng chế bị phân tán qua 5 cửa, hai check viết riêng cho RUL11 thì mồ côi; trong đó `check-decision-codes` đang exit 1 với 375 vi phạm. Đề xuất 6 việc, mỗi việc đều có thứ bị xoá.
Concerns: Chưa chạy `fgos doctor` để tránh ghi state. Quan hệ nhân quả giữa mâu thuẫn hook và hành vi chệch chưa chứng minh. D1, D2 và D4 cần anh quyết.
