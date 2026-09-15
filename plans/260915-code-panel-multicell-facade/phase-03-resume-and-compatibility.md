# Phase 03 — Resume và compatibility

Lease: `planned-resume` | Vào được sau: P02

## Mục tiêu

Chứng minh một phiên không có chat history có thể gọi code-panel, đọc plan/state thật và tiếp tục đúng cell; plan cũ và direct mode không hồi quy.

## Requirements

R1. Resume authority là plan markers + coordination chain/session state + Git evidence, không là lời kể của agent trước.

R2. Legacy plan không có test-policy metadata mới vẫn chạy: facade compose overlay từ phase verification và repo evidence.

R3. Session active, terminal, abandoned và fix-authorized được phân biệt rõ. Không mở cell mới khi cell cũ chưa close hợp lệ.

R4. Merged commit nhưng stale session phải được reconcile qua đường engine sau fix `tsk-1bh`, không sửa JSONL/state bằng tay.

R5. Direct single-cell command giữ nguyên behavior và evidence contract.

## Files

- Edit: `domains/coding/skills/fgos-code-panel/SKILL.md`
- Edit: `test/setup/skill-wrappers.test.mjs`
- Edit only if a failing fixture proves necessary: focused existing coordination resume test files under `test/runner/` or `test/verbs/`
- Regenerate: `.agents/skills/fgos-code-panel/**`, `.claude/skills/fgos-code-panel/SKILL.md`, `plugins/fgOS/skills/fgos-code-panel/**`
- Add: `docs/architect/agent-coordination/verification/code-panel-multicell-facade/proofs/p03/**`
- Must not edit without re-plan: coordination event schema or FlowDefinition

## Steps

1. Tạo legacy two-cell fixture không có metadata mới.
2. Chạy cell đầu đến một checkpoint durable rồi kết thúc process.
3. Khởi tạo fresh process chỉ với code-panel + plan path; xác nhận nó tìm đúng next action.
4. Chạy các state fixtures: active, closed, fix round, merged/stale và completed track.
5. Chạy regression suite của direct code-panel và standalone plan-loop.

## Validation

- Fresh process resume đúng cell và cùng coordination chain.
- Không duplicate assignment/session/cell.
- Legacy fixture không cần edit plan để chạy.
- Direct code-panel và direct plan-loop fixtures đều xanh.
- Chỉ chạy affected suites; full suite dành cho P04 nếu không có trigger mới.

## Verification

```sh
node --test test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs test/runner/coordination-driver-authorization.test.mjs test/runner/coordination-recovery-and-quorum.test.mjs test/verbs/coordination-recovery.test.mjs
```

## Rollback

Các fixtures/state test ở lại; planned facade có thể bị disable mà không đổi state format.
