# Báo Cáo Nghiệm Thu: Request-to-Run P2 Plan Chạy Được

Date: 2026-10-01
Plan: `plans/261001-0327-request-to-run-p2-runnable-plans/plan.md` (Phase 5)
Status: Accepted

---

## 1. Mục tiêu và Tiêu chí nghiệm thu

Nghiệm thu **P2 Plan chạy được**:
1. **Hợp đồng Unit duy nhất**: Mọi đường vào (prompt tự do, plan AgentKit, phase file) đều quy về Unit schema (`src/runner/execution/unit.mjs`). `fgos plan-lint` kiểm chứng `- unit:` trong phase file.
2. **Driver mỏng `fgos-run`**: Thay thế các facade cũ (`fgos-code-change`, `fgos-code-panel`, `fgos-plan-loop`). Driver không tự lập lịch, không tự merge mà giao trọn cho **Workflow runner** (P3a).
3. **Bỏ DemandFacts & matcher**: Xoá bỏ hoàn toàn `DemandFacts`, `matchCapability`, `deriveForm`, `src/runner/capability-match.mjs`. L2 chuyển từ quy tắc prose sang dữ liệu.
4. **Cổng người thống nhất**: Authorize là cổng người của Workflow run (`gate: { kind: "human" }`), owner duyệt qua `fgos workflow answer`.

---

## 2. Kết quả kiểm chứng các ca nghiệm thu

### Ca (a): K1 Prompt tự do (Code)
- **Đầu vào:** Yêu cầu người dùng dạng câu tự do "Implement feature X in file Y".
- **Hành vi driver:** `fgos-run` hiểu yêu cầu, viết Unit với `capability: code:implement`, `writes: ['src/feature.txt']`, `objective: '...'`.
- **Thực thi:** Giao cho Workflow runner (`fgos workflow start --units <file>`). Runner lập lịch, gọi `fgos run` trong worktree cách ly.
- **Kết quả:** Đạt (unit hoàn thành, outbox/receipt đầy đủ).

### Ca (b): K2 Read-only Producer Inline
- **Đầu vào:** Yêu cầu tư vấn/nghiên cứu inline từ Lead.
- **Hành vi driver:** Unit khai `writes: []`, `pattern: solo`.
- **Thực thi:** `bind()` chọn `inline` cho Lead producer, phát hành nonce 1 lần. Lead ghi kết quả qua `fgos run record --unit-run <id> --nonce <nonce> --evidence <refs>`.
- **Kết quả:** Đạt (nonce kiểm chứng, evidence bắt buộc tồn tại).

### Ca (c): Phase plan có `- unit:` (≥ 3 Unit: song song + ledger)
- **Đầu vào:** Phase file có 3 Unit: 2 Unit độc lập (`writes` khác nhau, không có `dependsOn`), 1 Unit ledger (`dependsOn: [u1, u2]`).
- **Plan-lint:** `fgos plan-lint <dir> --phase N --json` kiểm tra:
  - Cú pháp Unit chuẩn (hợp lệ qua `validateUnit`).
  - G2 non-infrastructure: không chứa pins.
  - Phụ thuộc hợp lệ, không có vòng lặp.
  - `writes` không giao nhau khi không có `dependsOn`.
- **Thực thi:** Workflow runner chạy 2 Unit song song, sau đó chạy Unit ledger tuần tự.
- **Kết quả:** Đạt (thứ tự chính xác, tích hợp merge không lỗi).

### Ca (c2): Phase A..B có phase chưa duyệt
- **Đầu vào:** Plan có Phase 1 (đã duyệt) và Phase 2 (chưa duyệt, có `requiresReview: true` hoặc `gate: human`).
- **Thực thi:** Workflow runner hoàn thành Phase 1, đến Phase 2 dừng lại ở trạng thái `parked` với câu hỏi chờ duyệt.
- **Tương tác:** Runner không tiếp tục chạy Phase 2 cho tới khi owner trả lời qua `fgos workflow answer`.
- **Kết quả:** Đạt (dừng đúng cổng người, không tự ý parse authorize từ prose `plan.md`).

### Ca (d): Plan tài liệu
- **Ghi chú:** Chờ Q5 từ owner khi authorize plan tài liệu `plans/260925-documentation-authority-unification/`. Không chặn merge P2.

---

## 3. Kiểm tra dọn dẹp (Dead Vocabulary & Cleanup)

- `DemandFacts`, `matchCapability`, `deriveForm`: **0 occurrences** trong toàn bộ `src/`, `bin/`, `core/`, `domains/`, `AGENTS.md`.
- `capability-match.mjs`: **Đã xoá vĩnh viễn**.
- `fgos capability match`: **Đã xoá khỏi CLI và command-registry**.
- Các skill cũ `fgos-code-change`, `fgos-code-panel`, `fgos-plan-loop`, `fgos-capability-dispatching`: **Đã xoá vĩnh viễn**.
- Skill mới `fgos-run`: **Đã lắp ráp và nhân bản đầy đủ** sang `.agents/skills/`, `.claude/skills/`, `plugins/fgOS/skills/`.
- `dead-vocabulary-guard.test.mjs`: **Pass 10/10**.
- `test/architecture.test.mjs`: **Pass 13/13**.
- `npm test`: **Xanh 100%**.

---

## 4. Kết luận

P2 đã hoàn thành toàn bộ mục tiêu và tiêu chí xong:
- Đóng mối authority "phân rã thành gì": Unit là hợp đồng duy nhất.
- Đóng mối authority "chạy một yêu cầu": driver mỏng `fgos-run` giao việc cho Workflow runner.
- Bỏ triệt để DemandFacts và matcher khỏi hệ thống.
Sẵn sàng merge vào `main`.
