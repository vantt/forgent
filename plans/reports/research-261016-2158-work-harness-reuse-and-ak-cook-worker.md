# Quét harness worktree/merge thời Work và khả năng worker dùng ak:cook

Thời điểm: 2026-10-16 21:58 (Asia/Saigon). Chỉ đọc, không sửa code. Bổ sung cho `research-261016-2141-plan-conductor-coding.md`.

Nguyên tắc ranh giới được giữ: WorkItem là tầng lưu requirement, tiến độ và giao tiếp với người. Work đẩy việc xuống flow, còn flow (Unit, Workflow, `fgos run`) chạy mà không biết Work.

## Kết luận

1. **Harness cũ dùng được, và nên dùng.** Phần cứng nhất của nó (tạo worktree có cài dependency và chạy lệnh setup; merge kiểu `--no-commit` rồi verify trên cây đã stage, đỏ thì abort; khoá main checkout; land vào main kiểu CAS) gần như không phụ thuộc Work. Phần dính Work chỉ là lớp vỏ: tham số `item`, tên nhánh `fgw/<id>`, và bước phát hiện "drift" sau khi land dựa trên đồ thị Work.
2. **Tầng flow đang tự viết lại bản thô của chính các cơ chế đó.** Có **ba** đường merge: harness Work, Workflow `integrate`, và `syncBase` của Unit. Bản của Workflow thiếu gần hết các lớp an toàn. Đây đúng là kiểu "trùng vì không tìm" mà report `research-261016-1118-agent-code-quality-guardrails.md` đã gọi tên.
3. **Worker bên ngoài hiện không dùng được ak:cook trên máy này.** Lý do: ak:cook chỉ được cài cho Claude, theo từng project, trong thư mục bị gitignore. Worktree tạo bằng git không mang theo nó, còn codex/pi không có bản cài nào. Muốn worker dùng ak:cook thì cần ba thứ: mang skill vào worktree, biết executor nào có skill, và một hợp đồng brief để ak:cook không đụng các luật của runner.

## 1. Harness thời Work: dùng được gì

| Module | Kích thước | Dính Work | Thứ đáng giữ | Đánh giá |
|---|---|---|---|---|
| `src/runner/worktree.mjs` | 1483 dòng | Rất nhẹ: chỉ import `StoreError` làm kiểu lỗi; tên nhánh `fgw/<id>`; hai hàm "claim" | `provisionDependencies` (`npm ci` trong worktree mới), `runWorktreeSetupCommands` (lệnh setup do project khai, vd `cargo build`), `detectTrunk`, `reclaimOrphanedCheckout`, `removeWorktree`, `listLeftovers`, tạo lại worktree cho cùng nhánh mà không va chạm | **Dùng được gần như nguyên.** Chỉ cần tách phần "claim" và tên nhánh ra |
| `src/runner/merge.mjs` | 1935 dòng | Vừa: hàm nhận `item`, gọi `listWork` và `graph-harness` để tính drift sau khi land | `mergeRunnerItem`: merge `--no-commit --no-ff`, chạy verify trên cây đã stage, đỏ thì `merge --abort` (main không bao giờ giữ một merge hỏng); khoá main checkout hoặc khoá theo đích (`withMergeTargetSlot`); `mergeRootIntoMainCas`; `performCatchUp`; kiểm cây sạch theo tập file của nhánh | **Cơ chế giá trị cao.** Tách lõi git ra khỏi `item`; phần drift theo đồ thị Work ở lại tầng Work |
| `src/runner/goal-check.mjs` | — | Chỉ ở tên: `runGoalCheck(item)` thực ra chỉ là `runCommand(item.verify)` | `runCommand` có timeout cấu hình được, `runInvariantChecks` (lệnh bất biến của repo từ config) | **Dùng nguyên**, đổi chữ ký sang nhận lệnh |
| `src/runner/main-checkout-lock.mjs` | 850 dòng | Không | Khoá người ghi main checkout | Flow đã dùng (`run.mjs`) |
| `src/verbs/merge/{approve,catchup,sync-root,review}.mjs` | — | Có: đây là các verb của Work | — | Ở lại tầng Work, trở thành adapter mỏng gọi lõi chung |

## 2. Tầng flow đang trùng gì

| Việc | Harness Work (cứng) | Bản của flow (thô) | Hậu quả của bản thô |
|---|---|---|---|
| Tạo worktree | `worktree.createWorktree`: cài dependency, chạy lệnh setup, dọn checkout mồ côi | `integrate.createWorkflowWorktree` (`src/workflow/integrate.mjs:33`): chỉ `git worktree add` vào tmpdir | Worktree của Unit **không có `node_modules` hay binary build sẵn**, nên `npm test` hay verify có thể đỏ vì thiếu môi trường, không phải vì code |
| Land một nhánh vào đích | `mergeRunnerItem`: `--no-commit`, verify, abort, có khoá | `integrate.mergeWorkflowBranch` (`integrate.mjs:99`): `git merge --no-ff` commit ngay, không verify, không khoá | Đích có thể nhận một merge commit hỏng. Khi đích đang được checkout thì merge **chạy thẳng trong main checkout** (`integrate.mjs:113-114`), trái luật "runner không bao giờ merge vào main checkout" mà chính `unit-sync.mjs` đang giữ |
| Kéo base vào nhánh | `performCatchUp` | `unit-sync.mjs` + `commit-unit-work.mjs` (syncBase): cẩn thận, để conflict mở cho worker | Đây là bản thứ ba. Bản này tốt, nhưng là một cài đặt riêng |
| Chạy verify | `goal-check.runCommand`, timeout cấu hình | `run.mjs:909` `execSync` **timeout cứng 60 giây** | Full suite thật (vài phút) luôn bị tính là verify fail. Lỗi này cộng thêm vào lỗi `verify` bị mất khỏi Unit (report 2141, C1) |
| Dọn worktree | `removeWorktree`, `listLeftovers` | `cleanupWorkflowWorktree`, nuốt lỗi | Dễ để lại worktree mồ côi |

## 3. Đề xuất: một lõi tích hợp git, không biết Work

Gom về **một lõi** đặt ở tầng flow (vì Work được phép gọi xuống flow, còn flow không được gọi lên Work), với bốn thao tác:

- **prepare worktree**: tạo worktree, cài dependency, chạy lệnh setup, xử lý checkout mồ côi. Nguồn: `worktree.mjs`.
- **bring base**: kéo base vào nhánh làm việc, conflict để mở cho worker giải. Nguồn: `unit-sync` cùng phần trusted git của `commit-unit-work`, gộp với `performCatchUp`.
- **land**: merge `--no-commit` vào đích trong một worktree tạm có khoá, chạy verify và invariant checks, đỏ thì abort, xanh thì commit. Nguồn: lõi của `mergeRunnerItem` và `mergeRootIntoMainCas`.
- **cleanup**: dọn worktree. Nguồn: `removeWorktree`, `listLeftovers`.

Người dùng lõi:

- Workflow `integrate` và `fgos-cook` (bước tích hợp) dùng **land**.
- `syncBase` của Unit dùng **bring base**.
- Workflow runner và `fgos run --worktree` dùng **prepare**.
- Các verb của Work (`approve`, `sync-root`, `catchup`) thành adapter. Chúng dịch `item` thành `{ branch, target, verify, ownFiles }` rồi gọi lõi. Riêng drift theo đồ thị Work vẫn ở lại tầng Work.

Hệ quả cho câu hỏi gộp nhánh ở report 2141: lựa chọn không còn là "`--sync` từng nhánh hay step `integrate`". Cả hai cùng đứng trên một lõi. Khuyến nghị lâu dài: `fgos-cook` dùng **land** của lõi chung, đi qua một cửa có sẵn (step `integrate` của Workflow, hoặc một verb flow mỏng). Khi land gặp conflict, giao cho một Unit **bring base** để worker giải, rồi land lại.

Đây là việc gom lớn nhất trong cả hướng `fgos-cook`, và nên làm **trước** skill. Nếu không, `fgos-cook` sẽ đứng trên bản merge thô.

## 4. Worker dùng ak:cook: hiện trạng và điều kiện

**Hiện trạng trên máy này:**

- ak:cook chỉ có ở `/.claude/skills/ak-cook` (cho Claude, theo từng project). Thư mục này bị `.gitignore:66` loại, nên **worktree tạo bằng git không có nó**.
- `.agents/skills/ak-cook` (codex/pi đọc từ đây) không tồn tại; `~/.codex/skills`, `~/.agents/skills` cũng không có. Ngoài repo này, chỉ `mdview` có một bản cho Claude.
- Sandbox bwrap có thể đặt `HOME` riêng (`confinement/authority.mjs:288`), nên cài global vào `~` chưa chắc worker đã thấy.
- Brief của worker không nhắc skill nào. Persona có trường `skills` (`agent-definitions.mjs:119`), nhưng hiện trường này chỉ dùng để chiếu định nghĩa agent, chưa đi vào brief.

Kết luận: ak:cook chạy được trên codex/omp/pi về nguyên tắc, nhưng ở setup hiện tại **không worker nào với tới được nó**.

**Cập nhật 22:05, sau khi owner cài ak cho omp, pi, codex, grok.** Cả năm runtime đều có `ak-cook` 2.5.1, nhưng đều cài **ở mức project**: `.claude/`, `.agents/` (codex), `.omp/`, `.pi/`, `.grok/`, dạng thư mục chép (không phải symlink).

- Bốn thư mục đầu bị `.gitignore` loại (dòng 66, 72, 77, 78). `.grok/` chưa bị loại, nhưng cũng chưa được track.
- Vì vậy worktree tạo bằng git **vẫn không có** ak:cook. Worker codex/pi/omp/grok chạy với cwd là worktree nên không tự tìm thấy skill.
- Sandbox bwrap ro-bind cả `/` (`drivers/bwrap.mjs:462`), nên file ở main checkout **đọc được** từ bên trong sandbox. Nhưng CLI chỉ tìm skill theo thư mục project của cwd, không theo main checkout.
- Prior art: assignment đã có `skills` và `requiresSkills` (`assignment-policy.mjs:481-483`). Nhưng trường này chỉ đến từ operation của Work và **chỉ được ghi lại, không được dùng để chọn executor**.

**Điều kiện để dùng được:**

1. **Mang skill vào worktree.** Dùng `worktreeSetup.commands`, cơ chế đã có trong `runWorktreeSetupCommands` với biến `FGOS_REPO_ROOT`, để chép hoặc symlink skill chưa track vào worktree. Điều kiện là flow phải dùng bước **prepare** của lõi chung (mục 3); hiện nó không chạy lệnh setup.
2. **Biết executor nào có ak:cook.** Cần khai báo hoặc probe kỹ năng của executor. Câu hỏi "Claude, codex hay pi có ak:cook không" phải trả lời bằng dữ liệu, không đoán. Vì không ghim provider, chỗ hợp lý là thông tin của executor và invocation, không phải trên Unit.
3. **Hợp đồng brief khi worker dùng ak:cook.** ak:cook có các bước va chạm với luật của runner:
   - nó commit (gitdir của worker chỉ đọc);
   - nó viết journal và cập nhật trạng thái plan (`ak plan check`), tức ghi ngoài `writes`;
   - nó tự gọi code-reviewer bên trong, trùng với checker của pattern `reviewed`.

   Hợp đồng đề xuất: `ak:cook "<objective>" --auto --skip-journal`; không git, không sửa plan, không ghi ngoài `writes` (cần thì báo qua `needsWrites`). Review độc lập để fgOS lo bằng checker ở provider khác. Nếu dùng được ak:cook ở nhánh `--fast` thì tránh được review đôi.
4. **Không có ak:cook thì vẫn chạy.** Worker không có ak:cook làm theo worker contract như hiện nay. ak:cook là nâng cấp tay nghề, không phải điều kiện.

## 5. Thứ tự đề xuất (cập nhật report 2141)

1. **Lõi tích hợp git chung** (mục 3): prepare, bring base, land, cleanup. Work trở thành adapter; Workflow `integrate` và `syncBase` chuyển sang dùng lõi. Kèm test cho đường land đỏ (abort sạch) và cho worktree có dependency.
2. **Sửa verify:** giữ `verify` trên Unit, thay `execSync` 60 giây bằng `runCommand` có timeout cấu hình, bỏ `npm test` ghim cứng trong preset `code-change`, thêm `--input` và `--verify` cho one-liner.
3. **Viết lại doctrine driver và bản đồ khái niệm** (report 2141, C4 và C5).
4. **Skill `fgos-cook` cùng bảng đường.** Bảng đường thêm cột "worker có ak:cook thì brief theo hợp đồng mục 4.3".
5. **Đường ak:cook ở worker:** chép skill qua lệnh setup, khai kỹ năng của executor, hợp đồng brief.
6. **Chạy thử trên một plan ak:plan thật**, đo kết quả, rồi rút đường `--plan` cơ học.

## Câu hỏi còn mở

1. Lõi tích hợp nên viết bằng JS (chuyển từ `merge.mjs` và `worktree.mjs`) hay đi thẳng sang Rust? Hướng ưu tiên Rust cho component nền đã được nhắc ở report guardrails. Em nghiêng về JS trước để gom nhanh trên code đã có test, rồi port sau.
2. Phát hiện drift sau khi land hiện dựa vào đồ thị Work. Khi Workflow land, có cần một bản drift không biết Work (dựa trên các nhánh đang mở) không, hay để Work tự tính khi nó được báo kết quả?
3. Kỹ năng của executor (vd "có ak:cook") khai trong config thủ công, hay cho `fgos doctor` probe tự động? Theo cổng install/setup/doctor của AGENTS.md, nếu thêm thì phải có check trong `doctor`.
