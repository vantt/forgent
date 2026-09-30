---
status: completed
---

# Unit I18 (Phase 5) — Plan lint: sửa lỗ hổng, parse Product Gates, verb `fgos plan-lint`

Capability: `code:implement`. Depends on: none (song song với I17).

## Context

- Module hiện có: `src/report/capability-plan-lint.mjs` (`status: 'shadow'`,
  `test/test-ownership.mjs:45`), test `test/report/capability-plan-lint.test.mjs`
- Lỗ hổng đã xác nhận bằng chạy thật (design record §5): hedge trong
  ngoặc, hai dòng `capability:`, `unresolved` không hết hạn, pin key thiếu
  `prefer`/`invocation`, bảng Product Gates không parse.
- Verb hiện có làm mẫu: `conflicts`, `faults`, `recheck-blocked`
  (`src/cli/command-registry.mjs`), read-only, `touchesState: false`.
- Convention Product Gates: `docs/how-to/author-a-plan-loop-track.md`.

## Requirements

1. `lintPlanCapabilityAnnotations(text, registered, { cellId? })`:
   - parenthetical chỉ hợp lệ sau `unresolved`; mọi `(...)` khác → finding
     `capability.hedged`;
   - hai `capability:` trong một unit → `capability.duplicate`;
   - pin keys: `executor|provider|model|tier|prefer|invocation|actors`;
   - parse hàng bảng `| Phase | Cell | Capability | Exit |` thành unit với
     `source: product-gates`;
   - `--cell <id>`: chỉ unit/hàng khớp; không có → `capability.undeclared`
     (severity warn);
   - mỗi finding có `severity: hard | warn`; `unresolved` là warn.
   - Không suy từ prose; không đọc config; giữ pure.
2. Verb `fgos plan-lint <path> [--cell <id>] [--json]`: exit 0 sạch, 1 có
   hard finding, 2 usage; `registered` = keys của `runner.capabilities`
   sau `ensureRunnerConfigForDir`. Output người đọc in nghĩa catalog
   (`description`) kế bên mỗi unit.
3. `test/test-ownership.mjs`: chuyển entry lint khỏi `shadow` sang trạng
   thái có caller thật.
4. Không gọi `decide`; không ghi state.

## Files

Modify: `src/report/capability-plan-lint.mjs`, `bin/fgos.mjs`,
`src/cli/command-registry.mjs`, `test/report/capability-plan-lint.test.mjs`,
`test/test-ownership.mjs`, `CHANGELOG.md`.
Create: `test/cli/plan-lint.test.mjs`.

## Steps

1. Viết test đỏ cho năm lỗ hổng + Product Gates + `--cell`.
2. Sửa module; giữ export cũ tương thích (tham số thứ ba tùy chọn).
3. Thêm verb; registry entry với `examples`, `touchesState: false`.
4. Chạy verb lên `plans/260919-coordination-skill-harness-simplification/plan.md`
   và ghi kết quả vào report của phase (I15 `code:implement` phải được in ra
   nghĩa "coding implementation" để người đọc thấy lệch, không bị flag hard).

## Verification

```sh
node --test test/report/capability-plan-lint.test.mjs test/cli/plan-lint.test.mjs
node --test test/cli/   # registry drift
node bin/fgos.mjs plan-lint plans/260919-coordination-skill-harness-simplification/plan.md --json
git diff --check
```

Review độc lập: `code:review`.

## Risks / rollback

- Verb mới đụng `bin/fgos.mjs` (5000+ dòng, GitNexus không index symbol):
  grep cross-check tay `case 'plan-lint'` không trùng verb khác.
- Rollback: revert; module cũ vẫn tương thích.
