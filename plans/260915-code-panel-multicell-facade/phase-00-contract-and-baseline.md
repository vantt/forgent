# Phase 00 — Contract và baseline

Lease: `facade-contract` | Vào được sau: fix `tsk-1bh` đã landed

## Mục tiêu

Khóa bằng evidence ranh giới giữa code-panel, plan-loop và engine trước khi sửa implementation; ghi baseline đủ để resume các plan đang dừng.

## Requirements

R1. Test terminal-close của P04 phải xanh qua đường coordination thật; không chấp nhận sửa projection/state bằng tay.

R2. Contract nhận diện mode là explicit:

- có plan/phase path là execution target, hoặc yêu cầu rõ “run/resume this implementation plan” / “execute this track” -> `planned-multi-cell`;
- citation hoặc nhắc tới plan/phase passing reference (vd. "fix the bug described in plans/X/plan.md") mà không có run/resume intent -> giữ nguyên `direct-single-cell`;
- input mơ hồ hoặc không rõ intent không được âm thầm đoán mode hoặc đoán một file plan -> từ chối / hỏi làm rõ.

R3. Planned mode giao toàn bộ lifecycle cell cho plan-loop. Code-panel chỉ truyền input và coding overlay.

R4. Baseline inventory ghi cho mỗi plan đang dừng: path, status marker, current/next cell, chain/session id nếu có, merged commit, dirty worktree owner, valid proofs.

R5. Chỉ sửa durable track evidence ở phase này. Nếu cần engine primitive mới, ghi gap và dừng để re-plan.

## Files

- Add: `docs/architect/agent-coordination/verification/code-panel-multicell-facade/index.md`
- Add: `docs/architect/agent-coordination/verification/code-panel-multicell-facade/current-cell.md`
- Add: `docs/architect/agent-coordination/verification/code-panel-multicell-facade/p00.md`
- Add: `docs/architect/agent-coordination/verification/code-panel-multicell-facade/proofs/baseline/**`
- Edit: `plans/260915-code-panel-multicell-facade/plan.md` (baseline and status only)
- Must not edit: `src/**`, `core/**`, `domains/**`, `test/**`, the active `tsk-1bh` worktree

## Steps

1. Xác minh commit fix `tsk-1bh`, chạy focused close/quorum tests và terminal-close reproduction.
2. Đọc lại live source skills và generated projections; lập ownership table.
3. Lập inventory các plan bị dừng, gồm track `260915-code-implementation-track-policy` và mọi plan người dùng muốn tiếp tục sau đó.
4. Ghi exact contract assertions mà P01 phải biến thành test: mode selection, delegation boundary và no-duplication rule.
5. Chụp baseline số lần chạy focused/affected/full trong trace hiện có để P04 so sánh.

## Validation

- Focused test cho `tsk-1bh` terminal close xanh.
- P01 nhận được contract assertions có source reference và expected outcome cụ thể.
- Baseline có thể được một fresh session đọc để nói chính xác next cell của từng plan.

## Verification

```sh
node --test test/runner/coordination-driver-authorization.test.mjs test/runner/coordination-recovery-and-quorum.test.mjs test/verbs/coordination-recovery.test.mjs
git diff --exit-code -- src core domains test
```

## Exit

Review + red-team đồng ý rằng không còn ambiguity về ownership. Phase close mà chưa sửa source skill.

## Rollback

Phase này chỉ thêm evidence. Nếu precondition không đạt, giữ P00 ở `blocked`,
không xóa bằng chứng và không mở P01.
