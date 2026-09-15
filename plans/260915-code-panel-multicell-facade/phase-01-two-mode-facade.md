# Phase 01 — Facade hai mode

Lease: `code-panel-facade` | Vào được sau: P00

## Mục tiêu

Cho `fgos-code-panel` nhận cả direct change và plan-driven request, đồng thời giữ plan-loop là implementation duy nhất của multi-cell orchestration.

## Requirements

R1. Direct mode giữ nguyên CLI doors, personas, mutation gate và quorum hiện tại.

R2. Planned mode nạp contract của `fgos-plan-loop` và thực thi đúng audit -> cell -> review -> red-team -> fix -> close loop; không sao chép flow vào code-panel.

R3. Một fresh invocation chỉ cần code-panel skill và explicit plan path. Không yêu cầu người dùng biết hoặc gọi plan-loop.

R4. Plan-loop vẫn có thể được gọi trực tiếp cho non-coding/generic track.

R5. Source-of-truth chỉ ở `domains/coding/skills`; mọi projection được sinh bằng generator hiện có, không sửa tay.

## Files

- Edit: `domains/coding/skills/fgos-code-panel/SKILL.md`
- Edit: `test/setup/skill-wrappers.test.mjs`
- Regenerate: `.agents/skills/fgos-code-panel/**`
- Regenerate: `.claude/skills/fgos-code-panel/SKILL.md`
- Regenerate: `plugins/fgOS/skills/fgos-code-panel/**`
- Edit: `CHANGELOG.md`
- Must not edit: `core/skills/fgos-plan-loop/SKILL.md`, `src/runner/coordination/**`, `src/verbs/coordination/**`

## Steps

1. Chạy GitNexus impact trước mọi symbol edit và ghi blast radius.
2. Làm xanh contract tests P00 bằng thay đổi nhỏ nhất ở source skill/facade.
3. Thêm guard chống recursive dispatch giữa code-panel và plan-loop.
4. Regenerate projections và chạy mirror/source tests.
5. Review diff để chứng minh không có orchestration algorithm thứ hai.

## Validation

- Direct fixture vẫn chọn single-cell path.
- Plan fixture chọn planned path và gọi đúng plan-loop contract.
- Static test thất bại nếu audit/open/close algorithm bị copy vào code-panel.
- Focused skill/projection tests xanh; chưa chạy full suite trừ khi impact trigger yêu cầu.

## Verification

```sh
node --test test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs test/architecture.test.mjs
npm run build:skills && git diff --exit-code -- .agents .claude/skills plugins/fgOS/skills
```

## Rollback

Bỏ planned-mode branch; direct code-panel và standalone plan-loop vẫn dùng được độc lập.
