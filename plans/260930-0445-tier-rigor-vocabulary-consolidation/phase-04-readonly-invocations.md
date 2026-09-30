---
phase: 4
title: "Bước chỉ-đọc dùng invocation read-only của chính executor; xoá readOnlyRedirects và placement-policy.mjs"
status: pending
priority: P1
effort: "1.5d"
dependencies: [1, 2, 3]
---

# Phase 4: Bước chỉ-đọc dùng invocation read-only của chính executor

## Overview

Bỏ cơ chế "đổi executor sau khi đã chọn" (`readOnlyRedirects`). Cơ chế này hiện đè `prefer` và là lý do "opus review" bị đổi lặng lẽ sang openai (`assignment-runner.mjs:1428`, điều kiện gán cứng `defaultExecutorId === 'claude'`).

Bất biến an toàn được giữ bằng một **ràng buộc** trên chính executor đã chọn (D4): bước chỉ-đọc phải chạy bằng một invocation **read-only** của executor đó, không có thì báo lỗi.

"Read-only" được định nghĩa tường minh (owner chốt 2026-09-30): invocation có `confinement` (OS chặn ghi), **hoặc** khai `readOnly: true` với cờ CLI thật sự chặn ghi. Hai invocation `claude-cli-readonly` và `claude-herdr-readonly` hiện có tên "readonly" nhưng vẫn ghi được file (`--permission-mode acceptEdits` tự duyệt Edit/Write). Phase này sửa chúng thành read-only thật để giữ pane herdr hiển thị reviewer.

Sau phase này `placement-policy.mjs` không còn nội dung nào nên bị xoá hẳn.

## Requirements

- Functional:
  - **Field mới `executors.<id>.invocations[].readOnly: true`** (boolean, tuỳ chọn). Validator (`src/runner/dispatch/config.mjs`):
    - `readOnly: true` mà args chứa cờ tự duyệt ghi → `RunnerConfigError` code `invocation.readonly-contradiction`. Danh sách cờ cấm, theo từng CLI: claude `--permission-mode acceptEdits|bypassPermissions`, `--dangerously-skip-permissions`; codex `-s danger-full-access`, `--sandbox danger-full-access`; pi `--tools` có `write`/`edit`. Danh sách nằm ở **một** hằng trong `config.mjs`.
    - `readOnly: false` là thừa → từ chối (field chỉ có một giá trị có nghĩa).
  - **Predicate duy nhất** `isReadOnlyInvocation(executorEntry, invocation)` (`resolve.mjs`): `invocation.readOnly === true` **hoặc** có confinement hiệu lực (invocation hay executor).
  - Assignment chỉ-đọc (`isReadOnlyAssignment`) giữ nguyên executor đã bind:
    - có invocation ghim tường minh (roster, `prefer` hoặc CLI) → invocation đó phải read-only, nếu không thì lỗi `readonly.invocation-not-read-only`;
    - không ghim → chọn invocation read-only **đầu tiên theo thứ tự khai trong config** của chính executor đó (owner điều khiển bằng thứ tự);
    - không có invocation read-only nào → lỗi `readonly.no-read-only-invocation`, nêu executor và gợi ý.
  - Sửa config:
    - `claude-cli-readonly` và `claude-herdr-readonly`: thay `--permission-mode acceptEdits` bằng cờ chặn ghi đã kiểm bằng smoke (ứng viên: `--permission-mode plan`, hoặc `--disallowedTools Edit Write NotebookEdit` kèm allowlist Bash hiện có; chọn cờ qua bước smoke), rồi khai `readOnly: true`;
    - `codex-cli-readonly-fgovn` (`exec -s read-only`): khai `readOnly: true` sau khi smoke xác nhận.
    - Audit mọi invocation khác có tên chứa `readonly` và xử lý giống vậy.
  - Xoá: `selectReadOnlyRedirectExecutor`, `hasExplicitInvocationPin`, `redirectAttempted`, `redirectDecision` (trong compiled plan / `dispatch-plan.json`), `policyForActualExecutor` (nếu không còn dùng), `readOnlyRedirectPool`, `readOnlyRedirectEntryFor`, `readOnlyRedirectInvocationFor`, `selectPlacementPolicyRedirectExecutor`, `stablePoolIndex` (nếu không còn caller), khoá config `runner.placementPolicy` (validator từ chối kèm hướng dẫn), và file `src/runner/dispatch/placement-policy.mjs`.
  - Governance (`disallowedProviders/Executors`) vẫn có quyền phủ quyết cuối, giữ nguyên.
- Non-functional:
  - Bước chỉ-đọc claude trong master loop (`review-candidate`, `red-team-candidate`) chạy trên claude, model theo tier, không bị đổi sang openai. `distinctProviderFrom` vẫn do `binding.mjs` đảm bảo **trước** dispatch.
  - Pane herdr cho reviewer claude vẫn dùng được khi roster hoặc `prefer` ghim `claude-herdr-readonly`.

## Architecture

```text
trước: bind executor (prefer) → [read-only && executor==='claude' && !pin] → đổi sang pool redirect (openai)
sau:   bind executor (prefer) → [read-only] → invocation ghim (phải read-only)
                                            | invocation read-only đầu tiên của CHÍNH executor
                                            | lỗi readonly.no-read-only-invocation
read-only(inv) := inv.readOnly === true (args được validator kiểm) || confinement hiệu lực
```

## Related Code Files

- Modify: `src/runner/dispatch/assignment-runner.mjs`, `src/runner/dispatch/config.mjs` (field `readOnly`, hằng cờ cấm, từ chối `placementPolicy`), `src/runner/dispatch/resolve.mjs` (`isReadOnlyInvocation`), `src/verbs/coordination/binding.mjs` (bỏ tham chiếu redirect), `src/setup/registrations.mjs` và `src/setup/checks.mjs` (các check liên quan redirect)
- Modify config: `.fgos/config.json` (xoá `placementPolicy`; sửa args và khai `readOnly` cho các invocation read-only), `~/.fgos/config.json` nếu có invocation tương tự
- Delete: `src/runner/dispatch/placement-policy.mjs`, `test/runner/placement-policy.test.mjs`, `test/runner/placement-policy-redirect-selection.test.mjs`, `test/runner/dispatch-cross-provider-redirect.test.mjs` (đổi thành test cho ràng buộc mới nếu phần nào còn đúng nghĩa)
- Tests cập nhật (tối thiểu): `test/runner/assignment-dispatch.test.mjs`, `test/runner/assignment-policy.test.mjs`, `test/runner/dispatch-executor-profile.test.mjs`, `test/runner/dispatch-governance-operability.test.mjs`, `test/runner/dispatch-governance-provider-denylist.test.mjs`, `test/runner/dispatch-coordination-role-tiers.test.mjs`, `test/runner/dispatch-policy-baseline-snapshot.test.mjs`, `test/runner/dispatch-i08b-remediation.test.mjs`, `test/runner/provider-adapter.test.mjs`, `test/verbs/coordination-binding.test.mjs`, `test/setup/checks.test.mjs`, `test/setup/checks-doctor-config.test.mjs`
- Tìm thêm chỗ ghim: `rg -n "cli-readonly|herdr-readonly|readonly-fgovn|readOnlyRedirect" src core domains docs/specs .fgos/config.json`

## Implementation Steps

1. Mở worktree phase từ đầu nhánh plan. Chạy `impact` upstream cho `selectReadOnlyRedirectExecutor`, `isReadOnlyAssignment`, `selectConfinedInvocationId`, `executeAssignment`. Đây là CRITICAL: báo owner trước khi sửa.
2. **Smoke chọn cờ read-only** (thật, không mock). Với mỗi invocation sẽ khai `readOnly: true`, chạy một prompt yêu cầu tạo file `./ro-probe.txt` trong một thư mục tạm, rồi kiểm file **không** được tạo. Ghi lệnh, cờ và kết quả vào báo cáo phase. Cờ nào vẫn để ghi được thì không dùng. Nếu không cờ nào của claude chặn được, dừng lại và báo owner (khi đó chỉ còn bwrap là read-only).
3. Viết test trước:
   - validator: `readOnly: true` + `acceptEdits` → lỗi; `readOnly: false` → lỗi;
   - dispatch: read-only + ghim invocation không read-only → lỗi; read-only + không ghim → chọn invocation read-only đầu tiên của cùng executor; read-only + executor không có invocation read-only → lỗi;
   - hồi quy: bước review claude **không** bị đổi sang openai; ghim `claude-herdr-readonly` thì chạy đúng invocation đó.
4. Thêm field, hằng và predicate; sửa config theo kết quả smoke.
5. Thay khối redirect ở `assignment-runner.mjs` (~dòng 1405-1470) bằng ràng buộc mới; xoá các hàm liệt kê ở Requirements.
6. Xoá `placement-policy.mjs`; xác nhận không còn import nào (`rg "placement-policy" src bin test`).
7. Bổ sung vào guard test: `readOnlyRedirect`, `placementPolicy`, `redirectDecision`, `placement-policy.mjs`.
8. Smoke end-to-end một assignment chỉ-đọc executor `claude` qua `fgos coordination` hoặc `fgos dispatch`, trong worktree phase; xác nhận run ghi `executor: claude` và invocation read-only. Nếu môi trường agent không chạy được (memory `feedback_claude_executor_bash_sandboxed_headless.md`), ghi rõ giới hạn đó và đưa lệnh để owner chạy.
9. Chạy focused tests + `npm run test:related` với `env -u CLAUDE_CODE_SESSION_ID`. Xanh thì commit, merge `--no-ff` vào nhánh plan, chạy lại focused tests trên nhánh plan.

## Success Criteria

- [ ] `rg -n "readOnlyRedirect|placementPolicy|redirectDecision|placement-policy" src bin core domains .fgos/config.json` → rỗng.
- [ ] Mỗi invocation `readOnly: true` có kết quả smoke "không ghi được file" trong báo cáo phase.
- [ ] Validator từ chối `readOnly: true` đi kèm cờ tự duyệt ghi (có test).
- [ ] Các ca ràng buộc read-only và hồi quy "claude review không bị đổi" có test xanh.
- [ ] Smoke end-to-end: bước chỉ-đọc claude chạy trên claude (hoặc giới hạn môi trường được ghi rõ, kèm lệnh cho owner chạy).
- [ ] Guard test xanh; focused tests xanh; đã merge vào nhánh plan.

## Risk Assessment

- **Cờ CLI không chặn ghi như tài liệu nói** (bảo đảm ở mức cờ, không phải OS). Tín hiệu: smoke ở bước 2 tạo được file. Xử lý: không khai `readOnly` cho invocation đó; nếu claude không còn cách read-only nào ngoài bwrap, báo owner. Ngoài ra danh sách cờ cấm trong validator chặn trường hợp ai đó sau này thêm lại `acceptEdits`.
- **CLI đổi hành vi cờ ở bản mới.** Xử lý: smoke read-only đưa vào `fgos doctor` như một check có thể chạy tay (phase 5 đăng ký), không chạy mặc định vì tốn token.
- **Quota claude:** redirect ban đầu được thêm khi claude hết quota (hotfix 2026-09-16), để dồn review sang openai. Sau phase này, hết quota claude thì bước chỉ-đọc đi theo `fallbackExecutors` / Provider Capacity Rotator (cơ chế đã có), không qua redirect. Tín hiệu: review fail vì quota mà không có fallback. Xử lý: khai `fallbackExecutors` cho vai review; không khôi phục redirect.
- **Executor không có invocation read-only** (`glm`, `gitnexus`, `herdr` không khai `invocations`) mà được bind vào bước chỉ-đọc. Tín hiệu: `readonly.no-read-only-invocation`. Xử lý: đó là lỗi cấu hình đúng nghĩa. Doctor ([phase 5](./phase-05-guard-docs-and-main-merge.md)) kiểm trước: capability có `serves.mutates: false` phải `prefer` executor có invocation read-only.
- **Rollback:** revert merge commit của phase trên nhánh plan.
