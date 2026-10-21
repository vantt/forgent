---
title: Rule management group 1A — six small fixes to existing rules and rule checks
status: proposed (frame awaiting owner approval)
created: 2026-10-21 15:13 (Asia/Saigon)
lane: INS
source: plans/reports/handoff-261021-1446-rule-management-execution-and-decisions.md
---

# Rule management group 1A

Sáu việc sửa nhỏ, mỗi việc sửa hoặc gỡ một thứ đang gây hại. Không thêm tính năng, lớp hay cơ chế mới (RUL104). Nhóm 1B và nhóm 2 nằm ngoài plan này.

## Outcome and acceptance

- Mỗi việc đạt "Validation" của phase mình; `npm test` xanh, do big lead tự chạy với `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`, `FGOS_SESSION_ID` đã unset.
- Không phase nào sửa nội dung luật khoá L1–L10, không sửa đồ của AgentKit hoặc ClaudeKit, không commit thay đổi chưa commit của owner (`AGENTS.md`, `.claude/settings.json`, `.fgos/distribution.json`, `packages/git/contracts/mutation-census.v1.json`, `engineer/`).
- Net-size: tổng thay đổi ròng của plan ≤ 0 dòng test, và không thêm file nguồn mới ngoài một test dây nối ở phase 4.

## Approved frame (chờ owner duyệt)

- **Scope:** `scripts/check-decision-codes.mjs`, `scripts/check-decision-citation-drift.mjs` và baseline + test của hai file đó; `.githooks/pre-commit`; `src/runner/prompt-templates/worker-prompt-skill-pointer.txt`; `core/skills/_shared/private-cell-worktree.md`; `core/skills/**` và `core/agents/*.yaml` chỉ ở dòng trỏ vào thứ không còn; `AGENTS.md` chỉ dòng 128.
- **Budget:** src/script ≤ 120 dòng thêm và ≥ 60 dòng gỡ; test ròng ≤ 0; docs: một dòng `CHANGELOG.md`, một hàng board; 0 evidence ngoài kết quả `npm test`.
- Ra khỏi khung thì dừng và hỏi theo mẫu quyết định.

## Phase order and collision with plan 260925 (Phase 8 manifest, 331 files)

| Phase | Việc (dòng báo cáo) | Va 260925? | Làm khi nào |
|---|---|---|---|
| 1 | 1A.5 (11.3) chặn `--write-baseline` nuốt vi phạm mới | Không | Ngay |
| 2 | 1A.4 (6.2) nối `check-decision-codes` vào `npm test` | Không | Ngay, sau phase 1 (làm mới baseline phải đi qua cổng của phase 1) |
| 3 | 1A.6 (6.9) guard thư mục mới ở gốc repo | Không | Ngay |
| 4 | 1A.3a (6.14) con trỏ chết **ngoài** vùng có thể va: `.githooks/pre-commit` | Không | Ngay |
| 5 | 1A.2 (13.3) Iron Law trong template worker | **Chưa biết** (`src/runner/prompt-templates*`) | Chờ xác nhận manifest |
| 6 | 1A.3b (6.14) con trỏ chết trong `core/skills/**`, `core/agents/*.yaml`, `AGENTS.md:128` | **Có thể** | Chờ xác nhận manifest |
| — | 1A.1 (1.6, 1.2) không commit khối `AGENTKIT-OMP` khi chưa có ngân sách byte | Không sửa file | Là quy tắc quy trình, ghi ở "Process guard" bên dưới |

Phase 1–4 độc lập về file, có thể giao song song cho hai lead nếu cần; mỗi phase một commit pathspec.

## Phase 1 — `--write-baseline` không được nuốt vi phạm mới (1A.5)

**Work item có sẵn:** `tsk-5hs` (todo từ 2026-08-20) đã mô tả đúng lỗi này cho `check-decision-citation-drift.mjs`. Phase này thực hiện item đó và mở rộng sang `check-decision-codes.mjs`; không tạo item mới. **Ràng buộc:** `src/state/retrospective-doors.mjs` import `collectWideSourceFiles`, `findWideCitationFindings`, `isDLocalId` từ `check-decision-citation-drift.mjs` (bốn cửa kiểm retrospective, `bin/fgos.mjs:1404`), nên phase này giữ nguyên mọi export và chỉ đổi nhánh `--write-baseline` của `runCli`. Cutover Phase 9 của kế hoạch 260925 land ba guard tài liệu thay ratchet cũ; trước khi sửa phải hỏi `forgentx-5f` xem ratchet cũ đó có gồm `check-decision-citation-drift` không, vì nếu có thì không đầu tư thêm vào script đó.

**Context.** Cả `scripts/check-decision-citation-drift.mjs:469-480` và `scripts/check-decision-codes.mjs:138-150` ghi đè baseline vô điều kiện. Cùng một lỗi ở hai script, nên sửa cả hai (RUL11: gom tới khi hết trong phạm vi); handoff chỉ nêu script đầu.
**Steps.**
1. Trước khi ghi, đọc baseline cũ; nếu findings mới có mục không nằm trong baseline cũ thì từ chối (exit 1), in số mục và vài mục đầu.
2. Một cờ tường minh `--allow-growth` cho phép tăng và in số mục thêm. Không thêm cờ thứ hai.
3. Dùng chung một hàm so sánh nếu hai script đã chia sẻ helper `baselineFromFindings`/`loadBaseline`; nếu không thì giữ hàm nhỏ trong từng script và ghi lý do (không tạo module mới chỉ để chia sẻ ~10 dòng).
**Delete.** Đường ghi vô điều kiện của cả hai script.
**Tests to retire.** Không có test nào khẳng định "ghi vô điều kiện"; kiểm bằng cách đọc `test/scripts/check-decision-codes.test.mjs` và `check-decision-citation-drift.test.mjs` trước khi sửa, test `--write-baseline` nào dựa vào hành vi cũ thì sửa tại chỗ (chủ sở hữu hành vi), không thêm file test mới.
**Validation.** Test chủ của từng script: baseline không đổi khi từ chối; ghi được khi chỉ giảm hoặc bằng; ghi được khi có `--allow-growth`.
**Rollback.** Revert một commit.

## Phase 2 — `check-decision-codes` chạy trong `npm test` (1A.4)

**Decision inside frame (báo, không hỏi).** Nối, không gỡ: script là ratchet chống đưa mã quyết định vào tên test (luật "Stable Code Artifacts"), và 374 vi phạm là hiện trạng cần baseline, không phải lý do gỡ. Điều kiện đảo lại: nếu làm mới baseline cần `--allow-growth` quá 374 mục thì dừng và hỏi.
**Steps.**
1. Làm mới baseline bằng `--write-baseline --allow-growth` một lần, ghi rõ trong commit số mục.
2. Thêm một test dây nối trong `test/scripts/check-decision-codes.test.mjs` chạy script trên repo thật và khẳng định exit 0 (đây là bằng chứng duy nhất của việc "nối"; logic phát hiện đã có test chủ).
**Delete.** Không có; nếu `test/` đã có bước gọi script ở nơi khác thì gỡ bản trùng (kiểm bằng grep trước khi thêm).
**Tests to retire.** Không.
**Validation.** `node scripts/run-tests.mjs test/scripts/check-decision-codes.test.mjs` xanh; thêm một tên test chứa mã quyết định thì test đỏ (thử trên bản nháp, không commit).
**Out of scope.** `check-decision-citation-drift` cũng chưa nối vào đâu; nối nó là một quyết định riêng (baseline của nó chưa kiểm), ghi thành mục riêng cho owner.

## Phase 3 — guard thư mục mới ở gốc repo (1A.6)

**Context.** `rootFileRefusal` (`.githooks/pre-commit:40-95`) lọc tên không có `/`, nên `engineer/x` không bị chặn. Allowlist file nằm ở `ROOT_FILE_ALLOWLIST`.
**Steps.**
1. Lấy phần đầu của mọi đường dẫn staged (`--diff-filter=A` cho thư mục mới: so với `git ls-tree --name-only HEAD`), từ chối thư mục mới ở gốc không nằm trong một `ROOT_DIR_ALLOWLIST` đặt ngay cạnh `ROOT_FILE_ALLOWLIST`, kèm thông báo cùng dạng.
2. Seed `ROOT_DIR_ALLOWLIST` bằng đúng các thư mục gốc đang được theo dõi (đọc từ `git ls-tree`), không thêm `engineer/`.
3. Mở rộng kiểm "allowlist đổi không được đi cùng root addition" để phủ cả hằng mới.
**Delete.** Không.
**Tests to retire.** Không; mở rộng test e2e root-file-guard hiện có (chủ của hành vi), không tạo file mới.
**Validation.** Test e2e: commit file vào thư mục gốc mới bị từ chối, vào thư mục đã có thì qua, đổi allowlist cùng lúc thêm thư mục bị từ chối. Chạy thật trên main checkout: `engineer/` (chưa theo dõi) khi `git add` thì bị chặn.
**Rollback.** Revert; hook chỉ chạy khi `npm run setup:hooks`.
**Note.** Allowlist này là thay đổi cơ chế nhỏ trong cùng một cửa (cùng hook, cùng mẫu), không phải cơ chế mới.

## Phase 4 — con trỏ chết trong `.githooks/pre-commit` (1A.3a)

**Context.** `HOW_TO_DOC` (dòng 36) trỏ `docs/how-to-parallel-lanes.md`, không tồn tại; dòng 492 và 524 trỏ `docs/how-to/fix-fgos-write-rejected-merge-block.md`, không tồn tại. Thông báo từ chối dạy agent đi tới file không có.
**Steps.** Với mỗi con trỏ, tìm tài liệu thay thế đang sống (`git log --diff-filter=D -- <path>` để biết file đã chuyển đi đâu); nếu không có nơi thay thì bỏ câu "See …" và để thông báo tự đủ nghĩa. Không viết tài liệu mới.
**Delete.** Ba con trỏ chết.
**Tests to retire.** Test nào ghim đúng chuỗi cũ thì đổi tại chỗ.
**Validation.** `rg` chuỗi cũ ra 0; test hook xanh.

## Phase 5 — Iron Law trong template worker (1A.2) — CHỜ xác nhận manifest

**Context.** `worker-prompt-skill-pointer.txt:25-55` trỏ `docs/how-to/produce-failing-test-first-proof-...` (đã xoá ở `989d0c7fa`) và bắt `import ./src/evolve/iron-law.mjs`, đường dẫn chỉ có ở repo fgOS; template được chọn cho mọi project có domain `coding`. Worker ở project khác nhận chỉ dẫn hỏng. Ngoài ra mẫu brief phải xin luật qua port, không giữ văn bản luật riêng (kongming §4); đó là việc của nhóm 2, plan này chỉ gỡ phần hỏng.
**Gate trước khi sửa.** Biết `src/runner/prompt-templates/*` có trong manifest 331 file của Phase 8 hay không. Chưa biết → hỏi owner có cho nhắn `forgentx-5f` không (câu 4 ở bộ câu hỏi).
**Steps (sau gate).**
1. Đọc `src/evolve/iron-law.mjs` để biết điều luật thật sự đòi; chỉ giữ phần còn đúng và chạy được ở project ngoài (không import đường dẫn repo fgOS), con trỏ tới tài liệu đã chuyển thì đổi sang nơi đang sống.
2. Nếu không còn cách chạy được ngoài repo fgOS thì thu mục thành một câu luật + đường dẫn tài liệu đang sống, bỏ khối mã.
**Delete.** Khối mã `import` và con trỏ chết.
**Tests to retire.** Test nào ghim chuỗi cũ của template (`test/runner/prompt-templates*`): đổi tại chỗ.
**Validation.** Test chủ của prompt-templates xanh; `rg 'src/evolve/iron-law'` trong template ra 0.

## Phase 6 — con trỏ chết trong skill, agent và `AGENTS.md:128` (1A.3b) — CHỜ xác nhận manifest

**Inventory đã kiểm (2026-10-21, `main` `5de0aad1e`).**

| Chỗ | Vấn đề | Hành động |
|---|---|---|
| `core/skills/_shared/private-cell-worktree.md:38,58` | dạy `fgos coordination chain/run`, cửa đã gỡ | Viết lại theo cửa hiện có (`fgos workflow`/`fgos run`) hoặc gỡ đoạn nếu cả cơ chế đã bỏ |
| `AGENTS.md:128` | `src/setup/checks.mjs` nay chỉ là shim, registry thật ở `src/setup/registrations.mjs` | **Dời sau cutover Phase 9** (owner 10-21: mọi thay đổi `AGENTS.md`, `CLAUDE.md`, `docs/platform-foundations.md`, `docs/specs/platform-foundations.md` land sau cutover, trên cây mới). Không sửa ở đợt này |
| `core/skills/fgos-indexing/SKILL.md`, `fgos-routing/SKILL.md:149`, `core/task-specs/fgos-indexing.md`, `core/agents/fgos-placeholder.yaml`, `core/agents/docs-manager.yaml` | nhắc `fgos-coding-compounding` (skill đã xoá; chức năng chuyển vào settlement/decision/enduser-docs của `bin/fgos.mjs`) | Đổi thành nơi đang làm việc đó; `core/agents/*.yaml` liệt kê skill đã xoá thì gỡ dòng |
| `core/skills/_shared/executor-dispatch-fallback.md:239,311`, `core/skills/fgos-clarifying/SKILL.md:100` | viện `docs/decisions/0026-…` (corpus đã retired) | Đổi sang mục "Lịch sử quyết định" của spec runner đang giữ narrative, hoặc gỡ câu viện |
| `src/`, `bin/fgos.mjs`, `src/report/authoritative-match.mjs`, `src/state/retro-pool.mjs`, `src/cli/command-registry.mjs` | chú thích và mô tả nhắc tên skill đã xoá | Ngoài phạm vi luật; ghi thành mục riêng (comment sửa theo RUL11 nếu owner cho) |

**Gate.** `AGENTS.md:128` bị chặn bởi quyết định của owner ở trên. Các file khác: như phase 5: `core/skills/**`, `core/agents/**`, `AGENTS.md` có thể nằm trong manifest; không sửa trước khi có câu trả lời. Sau khi sửa, `npm run build:skills` để tái sinh `.agents/skills/` và `plugins/fgOS/skills/` (không sửa tay bản render), rồi `fgos setup` render lại phần `AGENTS.md` do bộ chiếu sinh nếu bị ảnh hưởng.
**Delete.** Mọi con trỏ chết trong bảng.
**Tests to retire.** Test ghim đúng các câu cũ (nếu có) đổi tại chỗ; test doctor `instruction-projections-stale` phải xanh sau khi render lại.
**Validation.** `rg -n 'fgos-coding-compounding|fgos coordination|docs/decisions/00' core AGENTS.md` ra 0 ở phần luật; `npm test` xanh.

## Process guard cho 1A.1 (không sửa file)

Khối `AGENTKIT-OMP` ở cây làm việc của owner đưa `AGENTS.md` lên 46.754 byte, vượt trần 32 KiB của Codex (luật sau byte 32.768 mất không báo). Bản commit hiện 29.800 byte. Quy tắc cho mọi lead trong lane INS: **không `git add AGENTS.md` nguyên file**; nếu cần commit `AGENTS.md`, stage riêng hunk của mình (`git add -p`) và kiểm `git show :AGENTS.md | wc -c` < 32768 trước commit. Quy tắc này được ghi ở hàng board; việc gắn thành máy kiểm ngân sách byte theo CLI thuộc nhóm 2a (không làm ở đây).

## Red-team (tự soát, chưa phải red-team độc lập)

- **Phase 1:** `--allow-growth` thành lối tắt mới. Giảm nhẹ: cờ in số mục thêm, và phase 2 là lần dùng duy nhất đã biết; nếu thấy dùng thêm thì đó là bằng chứng để đổi thành danh sách ngoại lệ.
- **Phase 2:** làm mới baseline với 374 mục là "nuốt" hợp lệ một lần; ghi số trong commit để có dấu vết. Không có cách nào tránh vì baseline hiện không dùng được.
- **Phase 3:** allowlist thư mục seed từ `git ls-tree` có thể bao luôn thư mục lẽ ra không nên ở gốc; đó là hiện trạng, không phải hồi quy.
- **Phase 5, 6:** nguy cơ chính là va Phase 9; đã chặn bằng gate.
- **Chưa soát bằng agent độc lập.** Red-team và validate bằng `ak-plan` nên chạy sau khi owner duyệt khung (tốn một lượt agent; handoff yêu cầu, em chưa chạy vì khung chưa duyệt).

## Prior art (work item và component có sẵn)

Dòng việc `tsk-1lv` (canonical-decision-projection, đã done) và các đuôi `tsk-5hs`, `tsk-2yu`, `tsk-3uw`, `tsk-3xog`, `tsk-o4f`, `tsk-21fy`, `tsk-4ah`: xem [báo cáo nghiên cứu component](../reports/research-261021-1643-canonical-decision-projection-component.md) (đã viết 10-21 16:43). Hơn 124 con trỏ tới `docs/decisions/00xx` là hậu quả của việc retire corpus ở `tsk-1lv-4`, nên phase 6 chỉ chữa một phần nhỏ.

## Unresolved

- Manifest 331 file của Phase 8 có chứa `src/runner/prompt-templates*`, `core/skills/**`, `core/agents/*`, `AGENTS.md` không (cần `forgentx-5f`).
- Nối `check-decision-citation-drift` vào `npm test` hay không (mục riêng).
