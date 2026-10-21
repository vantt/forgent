# Handoff: thực hiện luồng quản lý luật (nhóm 1A, thiết kế 2a) và chốt các quyết định còn treo

Viết ngày 2026-10-21 14:46 (Asia/Saigon) bởi phiên nghiên cứu luồng quản lý luật, theo yêu cầu của owner: "commit và viết một prompt handoff để làm trong chat mới".

Phần dưới đây là prompt, dán nguyên văn cho một phiên agent mới. Handoff gốc của luồng này là `handoff-261021-1021-rule-management-tight-no-conflict-right-place.md`; bản này tiếp nối nó, không thay nó.

---

## Prompt

Bạn nhận phần **thực hiện** của luồng **quản lý luật** repo fgOS (checkout chính của máy bạn đang đứng, ví dụ `/home/vantt/projects/forgent`). Linux, zsh, múi giờ Asia/Saigon. Owner xưng **anh**, bạn xưng **em**, trả lời bằng tiếng Việt, câu đầy đủ.

### 1. Trạng thái: nghiên cứu đã xong, chưa sửa file luật nào

Phiên trước đã quét hơn 130 report, plan, history và journal, kiểm trạng thái hiện tại trên `main`, và đánh giá ranh giới component bằng một agent bậc cao. Kết quả là 161 vấn đề (33 đã giải quyết, 57 một phần, 42 chưa giải quyết, 23 chờ owner, 6 không còn hiệu lực). Chưa có file luật hay skill nào bị sửa.

**Đọc theo thứ tự này:**
1. `plans/reports/research-261021-1054-rules-instruction-optimization-references.md`: phần đầu ("Hiểu vấn đề và các việc quan trọng", "Engine đã có sẵn gì", tiêu chí domain và việc), rồi bảng 161 vấn đề (mã dòng như `6.14`, `14.14`), rồi "Đối chiếu với thiết kế nhóm E".
2. `plans/reports/kongming-261021-1325-rule-engine-component-boundary.md`: đánh giá ranh giới của engine, chạy bằng `opus` (chưa phải `fable`). Đọc mục 1, 3, 4, 5 và 8.
3. `plans/reports/handoff-261021-1021-rule-management-tight-no-conflict-right-place.md`: bảy mục tiêu (§1), nhóm A đến G (§6), luật làm việc (§7). Phần này vẫn hiệu lực.
4. `core/skills/_shared/decision-question.md`: mẫu câu hỏi cho owner.

### 2. Điều đã chốt, đề xuất chưa duyệt, và điều còn treo

**Owner đã chốt (2026-10-21):**
- Việc chia hai nhóm: **nhóm 1** là luật đang tồn tại (1A sửa nhỏ ngay bằng tay; 1B dọn cấu trúc, làm qua engine) và **nhóm 2** là engine (2a máy kiểm nhỏ, 2b sổ luật và bản render, 2c điểm inject, nhật ký, đo hành vi, vòng đời). Thứ tự: 1A, rồi 2a, rồi (1B cùng 2b), rồi 2c.
- Engine có thêm tiêu chí phân loại **domain và việc trong domain**, dùng lại từ vựng capability `domain:capability` đã có (`code:implement`, `code:test`, `code:debug`...).
- **Engine phục vụ cả repo fgOS và project dùng fgOS ngoài repo này.**
- Việc nhắn hỏi `forgentx-5f` (phiên làm kế hoạch tài liệu 260925, chạy ở máy khác) được **hoãn tới khi cần**.

**Đề xuất của phiên trước, chưa được owner duyệt** (đừng coi là đã quyết):
- Engine là Agent Context Engine (RUL102): component riêng, Node trước, lõi thuần sau port, phụ thuộc một chiều vào document engine qua port đọc.
- Luật có hai lớp: luật có nhà tài liệu (L1–L10, RUL, D-ADR) thì sổ luật chỉ giữ đơn vị tham chiếu bằng id cộng digest; luật vận hành thì sổ luật là nhà duy nhất.
- Land lát đầu của engine xen kẽ với Phase 9 của kế hoạch 260925, ranh giới theo tập file.

**Owner chưa trả lời (bạn là người hỏi, hỏi một lần, theo mẫu quyết định):**
- **Câu 1:** hai lớp luật như trên (khuyến nghị: có).
- **Câu 3:** land lát đầu xen kẽ trước Phase 9 hay đợi (khuyến nghị: xen kẽ, nhưng phải xác nhận danh sách file với `forgentx-5f` trước).
- **Bộ quyết định còn lại:** Q7 (quyết định 10-06 "không sửa đồ ak, ck"; ai là nhà của `.claude/rules/*` đang trùng với `AGENTS.md`; hook đăng ký trùng), R4 (tương thích ngược), Q4, Q5, Q6 (nguyên tắc thành luật, trần 32 KiB của Codex, danh sách luật sinh từ đâu), cổng kích thước ròng và ngân sách Node, chỉ số khách ngoài thay F5, có chạy A/B đo hành vi không (tốn quota).

### 3. Việc của bạn, theo thứ tự

**3.1. Lập plan cho nhóm 1A** (sáu việc, mã dòng trong bảng của report ở ngoặc). Dùng `ak-plan`, có red-team và validate, chia phase nhỏ, mỗi phase có mục **Delete** và **Tests to retire**. Chạy bằng lead trong worktree riêng (`ak-cook`); big lead tự verify độc lập (mục 4). Đường dẫn plan lấy từ `fgos convention path`.

| Việc | Nội dung | Chạm file nào | Rủi ro va kế hoạch 260925 |
|---|---|---|---|
| 1A.1 (1.6, 1.2) | Không commit khối `AGENTKIT-OMP` vào `AGENTS.md` khi chưa có ngân sách byte (cây làm việc của owner 46.754 byte so với trần Codex 32 KiB; bản commit 29.800 byte, an toàn). Đây là quy tắc quy trình và cổng cảnh báo, không phải sửa nội dung. | `AGENTS.md` (chỉ cảnh báo, đừng sửa) | Không sửa nên không va |
| 1A.2 (13.3) | Sửa mục Iron Law trong template prompt worker: nó trỏ file đã chuyển sang `docs/knowledge/` và bắt import đường dẫn chỉ có ở repo fgOS | `src/runner/prompt-templates/worker-prompt-*.txt` | **Chưa biết** có trong manifest 331 file không |
| 1A.3 (6.14, 11.15) | Dọn con trỏ chết: thông báo pre-commit, `AGENTS.md:128` (`src/setup/checks.mjs` nay chỉ là shim), `core/skills/_shared/private-cell-worktree.md` còn dạy `fgos coordination`, skill viện `docs/decisions/00xx`, tên skill `fgos-coding-compounding` | `.githooks/pre-commit`, `AGENTS.md`, `core/skills/**` | `AGENTS.md` và `core/skills/**` **có thể va** |
| 1A.4 (6.2) | Nối `check-decision-codes` vào `npm test` (làm mới baseline) hoặc gỡ hẳn. Hiện báo 374 vi phạm và không chạy ở đâu. Chọn nối hay gỡ: quyết trong khung đã duyệt rồi báo. | `scripts/check-decision-codes.mjs`, `scripts/run-tests.mjs` | Không va |
| 1A.5 (11.3) | Chặn `--write-baseline` nuốt vi phạm mới | `scripts/check-decision-citation-drift.mjs` (dòng 469–480) | Không va |
| 1A.6 (6.9) | Guard thư mục mới ở gốc repo (hiện chỉ chặn file; `engineer/` nằm ở gốc mà không bị chặn) | `.githooks/pre-commit` (dòng 40–95) | Không va |

**Thứ tự đề nghị:** làm trước các việc không va (1A.4, 1A.5, 1A.6), vì không cần chờ ai. Với 1A.2 và 1A.3, **trước khi sửa** phải biết file nào nằm trong danh sách 331 bản vá Phase 8 của kế hoạch 260925. Đến đây là lúc "cần" mà owner đã hoãn: hỏi owner có cho nhắn `forgentx-5f` (máy khác, không lấy được bằng `git fetch`; nhánh remote `plan/260925-documentation-authority-unification` chỉ tới `168a27c6c`, đầu nhánh theo board là `763568157`) không. Đừng sửa `AGENTS.md`, `core/instructions/**`, `core/skills/**` khi chưa có câu trả lời.

**3.2. Hỏi owner một lần** (không hỏi nhỏ giọt): gom Câu 1, Câu 3, bộ quyết định còn lại, cộng việc có nhắn `forgentx-5f` không. Mỗi câu theo mẫu năm phần của `decision-question.md`: chuyện gì đang xảy ra, nguyên nhân, các lựa chọn kèm chi phí, khuyến nghị, phạm vi của câu trả lời. Điều phân tích đã chọn rõ thì quyết và báo cáo, không hỏi lại.

**3.3. Thiết kế nhóm 2a** (máy kiểm nhỏ: con trỏ chết, chống trùng định nghĩa, ngân sách byte theo CLI, chống sửa tay bản render), **chỉ ở mức thiết kế, chưa code**, cho tới khi owner trả lời Câu 1 và Câu 3. Điều kiện kỹ thuật của lát đầu: `src/setup/instruction-registry.mjs` import kho Work (`listWork`), mà test kiến trúc A4 (`test/architecture.test.mjs:770-791`) cấm `src/runner/dispatch/**` chạm tầng Work; phải tách một port nguồn trước. Nơi đặt luật của project ngoài là cấu hình mới, phải đăng ký vào `fgos setup` (config-merge) và `fgos doctor` (registry), theo gate "Install/setup/doctor" ở `AGENTS.md`.

**Không làm trong phiên này:** nhóm 1B, 2b, 2c (chờ quyết định); sửa luật khoá L1–L10; sửa đồ của AgentKit hoặc ClaudeKit.

### 4. Luật làm việc (nhắc lại từ handoff gốc §7 và những gì phiên trước gặp)

- **Board** (`plans/261017-1313-fgos-platform-program-board/plan.md`): cập nhật hàng INS (hoặc mở hàng mới nếu đổi tên luồng) khi bắt đầu, xong, bị chặn hay land; ghi log mới nhất lên đầu phần 2026-10-21; mỗi quyết định kèm điều kiện đảo lại. Phiên trước chưa ghi board.
- **Đường dẫn report và plan:** `fgos convention path --kind report|plan --type X --slug Y --json`, không tự đặt tên. Mọi lệnh `fgos` chạy với `</dev/null`.
- **Git:** dùng `/usr/bin/git`; commit bằng pathspec (`git commit -- <path>`); không bao giờ checkout branch trong main checkout; commit không có dòng ghi công AI (quy tắc phát triển của repo). Hook chặn các chữ node_modules, target, build, dấu chấm git trong lệnh, nên dùng biến.
- **Cây làm việc của owner có thay đổi chưa commit, không phải của bạn:** `AGENTS.md` (khối `AGENTKIT-OMP`), `.claude/settings.json`, `.fgos/distribution.json`, `packages/git/contracts/mutation-census.v1.json`, thư mục `engineer/`. Đừng commit chúng. Vì `origin/main` cũng đã sửa `AGENTS.md`, `git pull` ở main checkout sẽ bị chặn; phiên trước đẩy bằng cách commit pathspec ở local rồi `cherry-pick` commit đó vào một worktree tạm lấy từ `origin/main` và đẩy `HEAD:main`. `main` local đang lệch remote một commit trùng nội dung (`37992ef82`); khi owner xử lý xong `AGENTS.md`, `git pull --rebase` sẽ bỏ commit trùng đó.
- **Chạy agent bậc cao bằng `fgos run`:** capability `advise` bị `runner.maxTier = flagship` chặn (`--rigor critical` chỉ ra `opus`); `--effort max` bị executor `claude` từ chối (chỉ nhận `low`, `medium`, `high`). Muốn `fable` thì phải nâng `maxTier` trong `.fgos/config.json` (config của owner, cần duyệt), hoặc dùng capability tự khai `rigor` cao như `architecture:shape` (nhớ thêm `--provider claude` vì `prefer` của nó đặt `openai` trước). Trước khi giao việc ra ngoài lượt, chạy `fgos dispatch decide`.
- **Verify:** big lead tự chạy toàn suite với `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`, `FGOS_SESSION_ID` đã unset; file hỏng thì chạy riêng qua `node scripts/run-tests.mjs <file>`. Lead tự báo xanh thì chưa tính. Luật test thuộc luồng TEST (máy thứ hai): bạn chỉ gỡ bản trùng, không viết luật test mới.
- **An toàn:** không tạo work item trên workspace thật; không in bí mật; không sửa config thật của owner khi chưa được duyệt; không activate, stage hay upgrade release (`sha256:653affd6…`) khi chưa có giờ land do owner chọn; luật khoá chỉ đổi bằng record mới (supersede).
- **Theo RUL104 và RUL11:** mỗi thay đổi làm thứ đang có tốt hơn, không to hơn; việc nào thêm tính năng, lớp hay cơ chế mới phải nằm trong hướng owner đã chốt, nếu không thì ghi thành mục riêng để owner chọn.

### 5. Đầu ra đầu tiên

1. Plan cho nhóm 1A (đường dẫn từ convention), kèm bảng việc nào làm ngay, việc nào chờ xác nhận với `forgentx-5f`.
2. Một bộ câu hỏi cho owner, hỏi một lần (mục 3.2).
3. Một hàng cập nhật trên board.

Kết thúc mỗi lượt bằng:
```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: một hai câu
Concerns/Blockers: nếu có
```
