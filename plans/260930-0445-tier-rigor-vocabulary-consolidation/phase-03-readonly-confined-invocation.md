---
phase: 3
title: "Bước chỉ-đọc dùng invocation confined; xoá readOnlyRedirects và placement-policy.mjs"
status: pending
priority: P1
effort: "1d"
dependencies: [1, 2]
---

# Phase 3: Bước chỉ-đọc dùng invocation confined

## Overview

Bỏ cơ chế "đổi executor sau khi đã chọn" (`readOnlyRedirects`). Cơ chế này hiện đè `prefer` và là lý do "opus review" bị đổi lặng lẽ sang openai (`assignment-runner.mjs:1428`, điều kiện gán cứng `defaultExecutorId === 'claude'`). Bất biến an toàn được giữ bằng một **ràng buộc** trên chính executor đã chọn (D4): bước chỉ-đọc phải chạy bằng invocation confined của executor đó, không có thì báo lỗi. Sau phase này `placement-policy.mjs` không còn nội dung nào nên bị xoá hẳn.

## Requirements

- Functional:
  - Assignment chỉ-đọc (`isReadOnlyAssignment`) giữ nguyên executor đã bind:
    - có invocation ghim tường minh → invocation đó phải confined, nếu không thì `RunnerConfigError` code `readonly.invocation-not-confined`;
    - không ghim → chọn invocation confined của chính executor (`selectConfinedInvocationId`, `resolve.mjs:507`);
    - executor không có invocation confined → `RunnerConfigError` code `readonly.no-confined-invocation`, nêu executor và gợi ý thêm invocation confined hoặc đổi `prefer`.
  - "Read-only" được xác định **chỉ** bằng `confinement` của invocation (hoặc confinement mặc định của executor). Allowlist tool kèm `--permission-mode acceptEdits` không tính là read-only. Xử lý `claude-cli-readonly` và `claude-herdr-readonly` theo câu hỏi mở 3 trong [plan.md](./plan.md).
  - Xoá: `selectReadOnlyRedirectExecutor`, `hasExplicitInvocationPin`, `redirectAttempted`, `redirectDecision` (trong compiled plan / `dispatch-plan.json`), `readOnlyRedirectPool`, `readOnlyRedirectEntryFor`, `readOnlyRedirectInvocationFor`, `selectPlacementPolicyRedirectExecutor`, `stablePoolIndex` (nếu không còn caller), và khoá config `runner.placementPolicy` (validator từ chối kèm hướng dẫn).
  - Xoá file `src/runner/dispatch/placement-policy.mjs` cùng các test của nó.
  - Governance (`disallowedProviders/Executors`) vẫn có quyền phủ quyết cuối, giữ nguyên.
- Non-functional:
  - Bước chỉ-đọc claude trong master loop (`review-candidate`, `red-team-candidate`) chạy `claude-cli-bwrap` với model theo tier. `distinctProviderFrom` vẫn do `binding.mjs` đảm bảo, **trước** dispatch, không phải bằng redirect.

## Architecture

```text
trước: bind executor (prefer) → [read-only && executor==='claude' && !pin] → đổi sang pool redirect (openai)
sau:   bind executor (prefer) → [read-only] → invocation confined của CHÍNH executor đó | lỗi
```

## Related Code Files

- Modify: `src/runner/dispatch/assignment-runner.mjs`, `src/runner/dispatch/config.mjs` (từ chối `placementPolicy`), `src/runner/dispatch/resolve.mjs` (nếu cần công khai predicate confined), `src/verbs/coordination/binding.mjs` (bỏ tham chiếu redirect), `src/setup/registrations.mjs` và `src/setup/checks.mjs` (các check liên quan redirect)
- Modify config: `.fgos/config.json` (xoá `placementPolicy`; xử lý invocation `*-readonly` của claude theo câu hỏi mở 3)
- Delete: `src/runner/dispatch/placement-policy.mjs`, `test/runner/placement-policy.test.mjs`, `test/runner/placement-policy-redirect-selection.test.mjs`, `test/runner/dispatch-cross-provider-redirect.test.mjs` (đổi thành test cho ràng buộc mới nếu phần nào còn đúng nghĩa)
- Tests cập nhật (tối thiểu): `test/runner/assignment-dispatch.test.mjs`, `test/runner/assignment-policy.test.mjs`, `test/runner/dispatch-executor-profile.test.mjs`, `test/runner/dispatch-governance-operability.test.mjs`, `test/runner/dispatch-governance-provider-denylist.test.mjs`, `test/runner/dispatch-coordination-role-tiers.test.mjs`, `test/runner/dispatch-policy-baseline-snapshot.test.mjs`, `test/runner/dispatch-i08b-remediation.test.mjs`, `test/runner/provider-adapter.test.mjs`, `test/verbs/coordination-binding.test.mjs`, `test/setup/checks.test.mjs`, `test/setup/checks-doctor-config.test.mjs`
- Tìm thêm chỗ ghim: `rg -n "cli-readonly|herdr-readonly|readOnlyRedirect" src core domains docs/specs .fgos/config.json`

## Implementation Steps

1. Mở worktree phase từ đầu nhánh plan. Chạy `impact` upstream cho `selectReadOnlyRedirectExecutor`, `isReadOnlyAssignment`, `selectConfinedInvocationId`, `executeAssignment`. Đây là CRITICAL: báo owner trước khi sửa.
2. Viết test trước cho ba ca:
   - read-only + ghim invocation không confined → lỗi;
   - read-only + không ghim → chọn đúng invocation confined của cùng executor;
   - read-only + executor không có invocation confined → lỗi `readonly.no-confined-invocation`.
   Thêm một ca hồi quy: bước review claude **không** bị đổi sang openai.
3. Thay khối redirect ở `assignment-runner.mjs` (~dòng 1405-1470) bằng ràng buộc mới; xoá `selectReadOnlyRedirectExecutor` và `policyForActualExecutor` nếu không còn dùng.
4. Xoá `placement-policy.mjs`; xác nhận không còn import nào (`rg "placement-policy" src bin test`).
5. Sửa validator để từ chối `runner.placementPolicy`; sửa config; xử lý invocation `*-readonly` theo câu hỏi mở 3.
6. Bổ sung vào guard test: `readOnlyRedirect`, `placementPolicy`, `redirectDecision`, `placement-policy.mjs`.
7. Chạy smoke thật (không mock) một assignment chỉ-đọc với executor `claude` qua `fgos coordination` hoặc `fgos dispatch`, trong worktree phase, rồi xác nhận run ghi `executor: claude`, invocation `claude-cli-bwrap`. Nếu bwrap không chạy được trong môi trường agent (memory `feedback_claude_executor_bash_sandboxed_headless.md`), ghi rõ giới hạn đó và để owner chạy lệnh smoke.
8. Chạy focused tests + `npm run test:related` với `env -u CLAUDE_CODE_SESSION_ID`. Xanh thì commit, merge `--no-ff` vào nhánh plan, chạy lại focused tests trên nhánh plan.

## Success Criteria

- [ ] `rg -n "readOnlyRedirect|placementPolicy|redirectDecision|placement-policy" src bin core domains .fgos/config.json` → rỗng.
- [ ] Ba ca ràng buộc read-only và ca hồi quy "claude review không bị đổi" có test xanh.
- [ ] Smoke thật: bước chỉ-đọc claude chạy `claude-cli-bwrap` (hoặc giới hạn môi trường được ghi rõ, kèm lệnh cho owner chạy).
- [ ] Guard test xanh; focused tests xanh; đã merge vào nhánh plan.

## Risk Assessment

- **Quota claude:** redirect ban đầu được thêm khi claude hết quota (hotfix 2026-09-16 trong track seams), để dồn review sang openai. Sau phase này, hết quota claude thì bước chỉ-đọc sẽ đi theo `fallbackExecutors` / Provider Capacity Rotator (cơ chế đã có), không qua redirect. Tín hiệu: run review fail vì quota mà không có fallback. Xử lý: khai `fallbackExecutors` cho vai review trong roster/config; không khôi phục redirect.
- **Executor không có invocation confined** (`glm`, `gitnexus`, `herdr` không khai `invocations`) mà được bind vào bước chỉ-đọc → lỗi lúc chạy. Tín hiệu: `readonly.no-confined-invocation`. Xử lý: đó là lỗi cấu hình đúng nghĩa. Doctor (phase 4) kiểm trước: mọi capability có `serves.mutates: false` phải `prefer` executor có invocation confined.
- **Mất pane herdr hiển thị cho reviewer claude**, nếu owner chọn xoá `claude-herdr-readonly` ở câu hỏi mở 3. Xử lý: chấp nhận, hoặc thêm một invocation herdr **có** confinement ở plan khác.
- **Rollback:** revert merge commit của phase trên nhánh plan.
