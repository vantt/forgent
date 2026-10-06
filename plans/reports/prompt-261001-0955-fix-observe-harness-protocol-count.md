# Prompt: sửa `fgos metrics harness` đếm protocol sai

Dán phần dưới dòng `---` cho agent thực thi. Working directory: `/home/vantt/projects/forgentX`.

---

## Nhiệm vụ

`fgos metrics harness` (component Observe, Rust) báo hai số `protocols_defined` và `protocols_used` **luôn bằng 0** vì đọc sai chỗ. Sửa để hai số phản ánh đúng thực tế, có test, rồi merge về `main`.

Việc này là điều kiện cần cho ca nghiệm thu của track request-to-run (bối cảnh: `plans/reports/synthesis-260930-1229-request-to-run-brainstorm.md` §2 F12), nhưng **không phụ thuộc** thiết kế của track. Làm độc lập.

## Bằng chứng đã có (2026-09-30, cần tự kiểm lại)

- `packages/observe/rust/src/metrics_cli/harness.rs:226-250`:
  - `count_protocols_defined` đọc `core/protocols/*.json`. Thư mục này **không tồn tại**. Protocol thật là YAML, nạp ba tầng theo `src/runner/definitions/protocol-loader.mjs`: `core/coordination-protocols/*.yaml`, `domains/<domain>/coordination-protocols/*.yaml`, project `.fgos/coordination-protocols/*.yaml`. Hiện core có 13 file.
  - `count_protocols_used` đọc `session.json` → `protocol.id`. Field này **không tồn tại**; field thật là `definitionRef.id` (session agent-led có `definitionRef: null`).
- Struct ở `packages/observe/rust/src/scorecard.rs:111-112`; test Rust ở `packages/observe/rust/tests/`.
- Spec: `docs/specs/observe.md`; audit đo lường: `plans/reports/measurement-audit-260929-1454-harness-scorecard.md`.

## Yêu cầu

1. Đọc `AGENTS.md`, `docs/specs/observe.md`. Chạy capability gate impact-analysis (`fgos tool query --capability impact-analysis --status present`) và GitNexus `impact` cho hai hàm trước khi sửa; báo blast radius.
2. `protocols_defined`: đếm theo **đúng** quy ước ba tầng của `protocol-loader.mjs`; một id xuất hiện ở nhiều tầng thì project thắng domain thắng core, đếm một lần. Không tự phát minh quy ước khác.
3. `protocols_used`: đếm số `definitionRef.id` **khác nhau** trong `.fgos/coordination/sessions/*/session.json`; bỏ qua `definitionRef: null` (agent-led). Không lọc riêng id dạng test (`test.*`, `some-def`) — dọn rác là việc của prompt khác; số liệu phải trung thực với store.
4. Test: fixture trong thư mục tạm (không dùng `.fgos` thật), phủ: YAML ở cả ba tầng + trùng id; session có `definitionRef`, có `null`, có file hỏng. Test thất bại trước khi sửa, xanh sau khi sửa.
5. Báo số liệu thật trước/sau trên repo này **chỉ để tham khảo** (store đang được dọn song song nên con số có thể đổi).
6. Nếu thấy chỗ khác trong Observe cũng đọc `protocol.id` hoặc `core/protocols`, sửa cùng lúc (`rg -n "core/protocols|\"protocol\"" packages/observe`), ghi vào báo cáo.

## Cách làm

- Làm trong **worktree riêng** từ `main` (không checkout nhánh trong checkout chính). Ngay sau `git worktree add`: symlink `node_modules` và `target` từ checkout chính.
- Chạy test với `env -u CLAUDE_CODE_SESSION_ID`; đọc exit code thật, không qua pipe.
- Commit ngay khi xanh (conventional commits, không ghi mã plan/finding), merge `--no-ff` về `main` từ worktree, chạy lại test liên quan trên `main`. Không `git add -A`.
- Nếu Observe được dùng qua bản release staged (`.fgos/installation`), ghi rõ cần restage/upgrade hay không; không tự upgrade nếu không chắc — báo lại.

## Không làm

- Không sửa store `.fgos/` (dọn rác thuộc prompt `plans/reports/prompt-261001-0955-fix-test-fixture-store-leak.md`).
- Không đổi định nghĩa các chỉ số khác của scorecard.
- Không tạo work item (`fgos submit/add`).

## Bàn giao

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: 1–2 câu
Files + commit hash (trên main)
Số liệu trước/sau (tham khảo)
Concerns: nếu có
```
