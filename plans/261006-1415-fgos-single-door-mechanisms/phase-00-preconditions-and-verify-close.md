# Phase 00 — Preconditions và verify-and-close

Plan status: Proposed — not authorized for execution

## Context links

- [plan.md](plan.md); synthesis [§5 V2, V4](../reports/harness-investigation-261006-synthesis.md), [§7 H1](../reports/harness-investigation-261006-synthesis.md)
- Evidence: cases M06, M10, T03, T06 trong [behavior-forensics-cases-261006.csv](../reports/harness-investigation-261006/behavior-forensics-cases-261006.csv)
- `AGENTS.md` "Prior art before design", `CLAUDE.md` "Impact-analysis capability gate"

## Requirements

1. Ghi lại baseline đo được cho mọi acceptance criterion của plan, trước khi sửa gì.
2. Đóng H1d (M06) và xác nhận T03 bằng bằng chứng commit, không bằng trạng thái item.
3. Xác nhận PC1 có chủ: thay đổi chưa commit ở `AGENTS.md`/`CLAUDE.md` thuộc về ai và xử lý thế nào.
4. Xác định posture impact-analysis cho toàn plan.

## Files

- Modify/create/delete: **không**. Phase này chỉ đọc; kết quả ghi vào commit message/PR note của Phase 01 hoặc vào `plans/261006-1415-fgos-single-door-mechanisms/reports/phase-00-baseline.md` (thư mục `reports/` của plan, tạo lúc thực thi).

## Steps

1. **PC1.** `git diff --stat AGENTS.md CLAUDE.md`. Hôm nay (2026-10-06) diff là dòng số liệu GitNexus (`AGENTS.md:169`, khối `<!-- gitnexus:start -->`) do `gitnexus analyze` ghi lại. Hỏi anh: commit riêng (`chore: refresh code-intelligence index stats`) hay `git checkout -- AGENTS.md CLAUDE.md`. Không phase nào của plan được commit hai file này kèm thay đổi đó.
2. **Impact-analysis posture.** `node bin/fgos.mjs tool query --capability impact-analysis --status present` (2026-10-06: `gitnexus` present). Đọc `gitnexus://repo/forgent/context` để xem index có cũ hơn HEAD không. Ghi posture `full` hoặc `degraded` kèm lý do. Ghi chú: `src/setup/registrations.mjs` (255 KB) có thể bị index thiếu symbol giống `bin/fgos.mjs` (tsk-38h) → mọi kết quả "0 caller" phải cross-check bằng `rg`.
3. **H1a baseline.** Chạy (raw, không qua rtk compression: `rtk proxy grep ...`):
   - `rtk proxy grep -rnoE "\b(claude-bwrap|agy-bwrap|codex-bwrap)\b" core/skills domains/*/skills` → baseline 2026-10-06: chỉ `core/skills/fgos-architecture-panel/SKILL.md` (dòng 191, 194, 223-231, 606, 607, 613, 682).
   - Model id có chữ số trong `runner.modelPolicies` xuất hiện trong skill sources → baseline: `gemini-3.1-pro-low`, `gemini-3.1-pro-high`, `gpt-5.6-terra` ở cùng file; `gpt-5.6-sol` (không có trong config).
   - `git log --diff-filter=D --oneline -- '*fgos-plan-loop/SKILL.md' '*fgos-code-panel/SKILL.md'` → `6527596eb`. Ghi đính chính: synthesis ghi `8eff54d0f`, commit đó chỉ đổi thành stub.
   - `node -e` đọc `.fgos/config.json`: `runner.pools` không tồn tại; roster nằm ở `runner.executors` và `runner.capabilities[*].prefer`.
4. **H1d verify-and-close (M06).** Bằng chứng: `e92cfe66f` (tsk-c5u, tách playbook ra `_shared/catchup-self-recovery.md`), `d74dfea58` (tsk-6av, gom self-recovery về `approve`, merge-next/merge-loop thành caller mỏng). Đọc lại `plugins/fgOS/skills/approve/SKILL.md:163-164,207-221`, `merge-loop/SKILL.md:85-88`, `merge-next/SKILL.md:69-78`: cả ba trỏ một playbook, Red flag của approve chỉ còn "vượt trần hai lần retry hoặc không theo evidence bar". Kết luận đóng; không thêm check (nguồn duy nhất đã là fragment `_shared`, được byte-mirror test bảo vệ). M10: skill gây ra đã bị xoá (`6527596eb`).
5. **T03.** `rtk proxy grep -rn FGOS_TEST_SUITE src bin test scripts` → 0 hit (2026-10-06). Ghi lại; luật chặn tái phát là rule ở Phase 06.
6. **Render baseline.** Đếm file `.md` trong render targets không chứa header (hôm nay: `.agents/skills` 53/53; `plugins/fgOS/skills/{fgos-*,_shared}` 48; wrapper `.claude/skills/fgos-*` 18 có marker `GENERATED_WRAPPER_MARKER` nhưng câu "canonical skill source" sai).
7. **Root baseline.** `git ls-files | grep -v / | wc -l` = 45; 30 file tạo ở `ca854f443`; `output.txt` untracked và gitignored (`.gitignore:33`).
8. **H6 ownership.** Xác nhận `plans/260925-documentation-authority-unification/plan.md` vẫn "Proposed — not authorized for execution". Plan này **không** sửa `docs/specs/reading-map.md` (thuộc H6) — xem câu hỏi mở.

## Tests / validation

- Không có thay đổi code. Validation = baseline file có đủ 8 mục, mỗi mục có lệnh và con số.

## Risks

- Đếm qua rtk bị nén/cắt (synthesis §0b: 130 vs 3320). Mọi phép đếm dùng `rtk proxy` hoặc script Node.

## Rollback

- Không có gì để rollback.

## Hiệu chỉnh sau red-team (2026-10-06)

Mục này **thắng** nội dung cũ của phase khi mâu thuẫn. Bằng chứng đã được lead tự đo lại (script hoặc `rtk proxy`), chi tiết ở bảng Red Team Review trong `plan.md`.

- **Baseline bị thiếu (đã xác nhận):** id đã gỡ (`claude-bwrap`, `agy-bwrap`, `codex-bwrap`) xuất hiện ở `core/skills/fgos-architecture-panel/SKILL.md` các dòng 134, 137, 159, 163, 168, 171 (khối "Executor registration — verified live"), cộng 191, 194, 223-231, 606, 607, 613, 682. Baseline cũ chỉ nêu nhóm sau. Ghi đủ danh sách vào báo cáo baseline bằng script, không bằng grep qua hook.
- Ghi vào báo cáo baseline ba số đo mà các phase sau dựa vào: số mục `node_modules` trong manifest mỗi release (hôm nay: 233 ở hai release dựng sau commit `dbaf4ce0f`, 0 ở release đang kích hoạt), số file test chạm hook (16), số nơi dùng `build-rust-distribution` (7).
