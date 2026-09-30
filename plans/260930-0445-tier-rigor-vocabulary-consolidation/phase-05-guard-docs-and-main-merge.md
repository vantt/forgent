---
phase: 5
title: "Guard từ đã chết, doctor, tài liệu, full suite, merge main"
status: pending
priority: P1
effort: "0.5d"
dependencies: [1, 2, 3, 4]
---

# Phase 5: Guard, doctor, tài liệu, merge main

## Overview

Khoá kết quả để các lớp đã xoá không mọc lại. Việc gồm:
- hoàn thiện guard test;
- doctor check cho config project và global;
- ghi quyết định vào spec, CHANGELOG, và các chỗ khác còn mô tả thang cũ;
- chạy full suite trên nhánh plan rồi merge về `main` đúng một lần.

## Requirements

- Functional:
  - `test/runner/dead-vocabulary-guard.test.mjs` chứa đủ danh sách từ đã chết của phase 1–4, quét `src/`, `bin/`, `core/`, `domains/`, `.fgos/config.json`. Test cho phép các từ này xuất hiện trong `docs/specs/**` **chỉ** ở mục lịch sử quyết định (nhận diện bằng heading), và không cho phép ở bất kỳ chỗ nào khác.
  - Doctor check `tier-vocabulary-dead-keys` (đăng ký trong `src/setup/checks.mjs`/`registrations.mjs`): đọc **cả** config project lẫn global, liệt kê từng khoá đã chết kèm cách thay. Đây là cách owner phát hiện project khác cần sửa (quyết định D11 trong [plan.md](./plan.md)).
  - Doctor check: mọi capability có `serves.mutates: false` phải `prefer` executor có invocation read-only (rủi ro của [phase 4](./phase-04-readonly-invocations.md)).
  - Doctor check `model-policy-tier-coverage` (Validation Session 2): với mỗi executor có `providerModel`, `modelPolicies[provider]` phải có đủ mọi tier mà `rigorToTier` có thể sinh ra. Kiểm ở cả config project lẫn global. Ví dụ hiện có: global `openai` chỉ khai `nano`. <!-- Updated: Validation Session 2 - doctor phủ tier -->
  - Doctor check chạy tay (không mặc định, vì tốn token): smoke "không ghi được file" cho mọi invocation `readOnly: true`, dùng đúng lệnh smoke của phase 4.
  - `docs/specs/<work spec>` (spec area sở hữu Work, tìm qua `docs/specs/reading-map.md`): trường `size` và `rigor` của Work, cùng đường đọc `tier → size` cho event cũ.
- Tài liệu:
  - `docs/specs/runner.md`:
    - thêm quyết định mới ở "Business Rules" và "Lịch sử quyết định" (2 thang + 1 bảng; danh sách từ bị cấm; lý do: các track trước additive/shadow);
    - sửa "Data Dictionary", "Từ vựng dispatch hiện hành", "ExecutorProfile / Invocation";
    - đánh dấu RUL69 đã bị thay một phần (không sửa tại chỗ phần lịch sử).
  - `docs/specs/distribution.md`: bỏ mọi mô tả `rigorOverrides`.
  - `core/skills/_shared/capability-matching.md` và `executor-dispatch-fallback.md`: `rigor` điều khiển tier qua `rigorToTier`; không còn "pass-through".
  - `CHANGELOG.md` `[Unreleased]`: một dòng mô tả thay đổi config người dùng thấy được (khoá bị bỏ, khoá mới `rigorToTier`, YAML `minTier` → `rigor`, Work `tier` → `size` + `rigor` và cờ `--tier` → `--size`/`--rigor`, item `heavy` không khai `rigor` sẽ chạy ở `standard`, field invocation `readOnly: true`, bước chỉ-đọc không còn bị redirect sang executor khác mà chỉ fallback khi hết quota qua `fallbackExecutors`, `rigorOverrides` của gemini/`fgos-coding-implement` bị bỏ).
  - `plans/reports/brainstorm-prompt-260930-1102-request-to-run-decomposition.md` §6.4: thêm ghi chú rằng phần tier/rigor đã được thay bởi plan này (trỏ link), để các agent brainstorm không thiết kế lại phần này.

## Related Code Files

- Modify: `test/runner/dead-vocabulary-guard.test.mjs`, `src/setup/checks.mjs`, `src/setup/registrations.mjs`, `docs/specs/runner.md`, `docs/specs/distribution.md`, `core/skills/_shared/capability-matching.md`, `core/skills/_shared/executor-dispatch-fallback.md`, `CHANGELOG.md`, `plans/reports/brainstorm-prompt-260930-1102-request-to-run-decomposition.md`
- Tests: `test/setup/checks.test.mjs`, `test/setup/checks-doctor-config.test.mjs`, `test/setup/capability-catalog-doctrine.test.mjs`

## Implementation Steps

1. Mở worktree phase từ đầu nhánh plan (đã có phase 1–4). Đồng bộ `main` vào nhánh plan nếu `main` có thay đổi (§ Quy trình thực thi trong [plan.md](./plan.md)).
2. Hoàn thiện guard test và hai doctor check, viết test trước.
3. Cập nhật tài liệu. Sau đó `rg` toàn repo (trừ `archive/`, `plans/reports/` cũ, `.fgos/`) tìm các từ đã chết, và xử lý từng chỗ còn sót.
4. `npm run build:skills` nếu có sửa skill hoặc doctrine; kiểm tra bản render không lệch.
5. Commit, merge `--no-ff` vào nhánh plan.
6. **Cổng merge main**, làm trên worktree của nhánh plan:
   - `env -u CLAUDE_CODE_SESSION_ID npm test` → exit 0. Đọc exit code thật, không qua pipe. Nếu có test fail, phải chứng minh nó fail sẵn trên `main` với cùng lệnh, nếu không thì không được merge.
   - GitNexus `detect_changes({scope: "compare", base_ref: "main"})` với `repo: "/home/vantt/projects/forgentX"`: chỉ các symbol và luồng dispatch/coordination/config dự kiến bị ảnh hưởng.
   - `fgos doctor` trên máy owner: không còn cảnh báo dead-key cho project này.
7. Merge nhánh plan vào `main` bằng `--no-ff` từ một worktree đang ở `main`, không phải từ checkout chính đang có người dùng. Sau đó chạy lại `npm test` trên `main`.
8. Cập nhật trạng thái plan qua `ak plan` CLI; dọn toàn bộ worktree `forgentX-tier-rigor-*` và nhánh phase một lần (memory `feedback_worktree_cleanup_batched_at_track_end.md`).

## Success Criteria

- [ ] Guard test chặn đủ từ đã chết; thử thêm lại một từ thì test fail (kiểm bằng tay một lần).
- [ ] Hai doctor check có test xanh; `fgos doctor` sạch trên project này.
- [ ] Spec, doctrine, CHANGELOG khớp với code (claim nào cũng trỏ được về file:line thật).
- [ ] Full suite xanh trên nhánh plan và trên `main` sau merge; `detect_changes` khớp phạm vi.
- [ ] Worktree và nhánh phase đã dọn.

## Risk Assessment

- **`main` trôi trong lúc plan chạy** (các session khác sửa dispatch). Tín hiệu: conflict khi đồng bộ, hoặc test fail mới sau khi merge `main`. Xử lý: đồng bộ trước mỗi phase; conflict ở file dispatch thì giải quyết trên worktree nhánh plan, rồi chạy lại focused tests của cả ba phase.
- **Test không hermetic trong agent session** (`CLAUDE_CODE_SESSION_ID`). Xử lý: luôn chạy với `env -u`; fail chỉ xuất hiện trong session thì không coi là regression.
- **`/tmp` cạn inode vì fixture test** (memory `project_tmp_inode_exhaustion_from_test_fixtures.md`). Tín hiệu: `ENOSPC` dù còn dung lượng đĩa. Xử lý: `/bin/df -i`, dọn `fgos-*` cũ hơn 2 giờ.
- **Rollback sau merge main:** `git revert -m 1 <merge-commit>` trên `main`. Config đã sửa (project và global) phải khôi phục bằng tay theo diff đã ghi ở báo cáo phase 1–4.
