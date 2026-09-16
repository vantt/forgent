# Phase 02 — Coding test-policy overlay

Lease: `coding-test-policy` | Vào được sau: P01

## Mục tiêu

Inject một test decision cụ thể vào từng coding cell, giảm full-suite repetition mà không hạ chuẩn proof.

## Requirements

R1. Overlay sinh bốn trường logic cho mỗi cell: focused commands, affected commands, full command, full triggers. Chúng có thể được suy ra từ phase text và repo evidence; không trở thành schema bắt buộc của generic plan.

R2. Doer/Fixer chạy focused trước. Affected scope dựa trên GitNexus impact, touched contracts và test ownership hiện có.

R3. Reviewer/Red-Team mặc định inspect proof. Chỉ rerun khi proof stale, command không đủ, môi trường khác, hoặc có counterexample cụ thể.

R4. Proof reuse key gồm command + Git tree + environment fingerprint. Reuse/escalation đều được ghi vào trace.

R5. Full suite chỉ chạy theo trigger hoặc integrated final gate. Nếu tree không đổi, cùng full proof không được chạy lại theo role.

R6. Không cho model tự “tiết kiệm” bằng cách bỏ test: mọi cell phải có explicit decision, kể cả quyết định `full: deferred-to-final-gate`.

## Files

- Edit: `domains/coding/skills/fgos-code-panel/SKILL.md`
- Edit: `test/setup/skill-wrappers.test.mjs`
- Regenerate: `.agents/skills/fgos-code-panel/**`
- Regenerate: `.claude/skills/fgos-code-panel/SKILL.md`
- Regenerate: `plugins/fgOS/skills/fgos-code-panel/**`
- Edit: `CHANGELOG.md` only if P01 entry does not already cover the behavior
- Must not edit: generic plan schema, `core/skills/fgos-plan-loop/SKILL.md`, coordination engine/event schema

## Steps

1. Viết fixtures cho focused-only, affected, full-triggered, stale-proof và unchanged-proof reuse.
2. Đặt policy composition ở một shared fragment/helper nhỏ; code-panel inject, plan-loop chỉ nhận objective/evidence đã compose.
3. Thêm trace fields/reason text bằng contract sẵn có; nếu cần event schema mới thì dừng và re-plan.
4. Làm xanh fixtures và đo số command executions theo role.
5. Red-team hai failure mode: proof bị reuse sau patch liên quan và full trigger bị bỏ sót.

## Validation

- Focused-only fixture không gọi full.
- Full-trigger fixture gọi full đúng một điểm.
- Reviewer/red-team reuse proof hợp lệ và rerun proof stale.
- Mỗi skip/defer/escalation có lý do đọc được trong trace.

## Verification

```sh
node --test test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs test/architecture.test.mjs
npm run build:skills && git diff --exit-code -- .agents .claude/skills plugins/fgOS/skills
```

## Rollback

Tắt overlay làm hệ thống quay về policy bảo thủ của plan-loop; không ảnh hưởng durable coordination state.
