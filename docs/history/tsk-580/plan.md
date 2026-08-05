# plan.md — tsk-580: `--verify-from-children`/`--verify-from-targets` trên `fgos edit`

## Mode gate

Đếm flag áp dụng: auth (không) · authorization (không) · data model (không
— tái dùng field `verify` sẵn có, không schema mới) · audit/security
(không) · external systems (không) · **public contracts (có — thêm 2 flag
CLI mới, dù additive)** · cross-platform (không) · existing covered
behavior (không — nhánh mới độc lập, không đổi hành vi flag hiện có) ·
weak proof around area (không — `edit` case đã có test suite dày đặc làm
mẫu) · multi-domain (không).

**Đếm: 1 flag → mode = small.** Vài file (`bin/fgos.mjs`,
`test/cli/fgos.test.mjs`, 2 how-to doc cập nhật tham chiếu), không gray
area — thiết kế đã chốt đầy đủ qua `fgos-coding-shaping` + `fgos-exploring`
(D1-D3, CONTEXT.md). `fgos graph --json` xác nhận tsk-580 đứng độc lập
(`deps: []`, không component nào phụ thuộc) — không cần xét thứ tự với
việc khác.

## Approach

Path đã chọn: thêm 2 block flag riêng vào `case 'edit'`
(`bin/fgos.mjs:1191-1343`) theo đúng pattern hiện có của
`--docs-ref`/`--goal-tier`/`--merge-after` (mỗi flag kebab→camelCase một
block riêng, viết thẳng vào `patch` trước khi gọi `editWork`). Không có
alternative nào khác được cân nhắc nghiêm túc — đây đúng nghĩa "thêm 1
flag vào 1 verb đã có sẵn pattern", không phải quyết định kiến trúc.

### Risk map

| Thành phần | Rủi ro | Cách chứng minh (proof point cho `fgos-validating`) |
|---|---|---|
| Enumerate children (`w.parent === id`) | Thấp — tái dùng chính xác pattern `collectRollupData` (bin/fgos.mjs:671-686) | Test: parent có 2+ children ở trạng thái khác nhau → command sinh ra chứa đúng tập id con |
| Enumerate targets (`item.targets`) | Thấp — đọc thẳng field có sẵn | Test: item có `targets` → command chứa đúng tập id target |
| Root resolution cho `--dir` | **Trung bình** — CONTEXT.md đã sửa 1 lỗi thật (resolveRepoRoot dùng `--show-toplevel`, SAI khi chạy trong worktree vì trả về root worktree, không phải main checkout nơi `.fgos/` thật sự nằm) | Test PHẢI chạy trong ngữ cảnh mô phỏng worktree (hoặc ít nhất assert dùng đúng `git rev-parse --path-format=absolute --git-common-dir` + `dirname`, không phải `--show-toplevel`) — đây là proof point quan trọng nhất, `fgos-validating` cần xác nhận cách test dựng lên có thật sự phơi bày được lỗi này không |
| Guard danh sách rỗng | Thấp — logic đơn giản (`if length === 0 throw`) | Test: parent không có con / item không có target → `edit` exit non-zero, message rõ ràng, verify KHÔNG được ghi |
| Check mặc định resolved-set (D3) | Thấp — tái dùng `isResolvedStatus`/`TAIL_RESOLVED_STATUSES` đã import sẵn (frontier.mjs, đã import vào bin/fgos.mjs dòng import `isResolvedStatus`) | Test: con ở `delivered` (chưa `cleanup`/`done`) → command vẫn coi là thoả điều kiện |

Impact-analysis posture (CLAUDE.md gate, chạy lại đúng lúc lập kế hoạch):
`fgos tool query --capability impact-analysis --status present` → GitNexus
`present`, nhưng hook riêng session này báo index cũ ("last indexed:
251d0b5") → **degraded** theo đúng 3 nhánh của CLAUDE.md (present nhưng
stale). Không dựa vào GitNexus cho proof point nào ở trên — toàn bộ dựa
trực tiếp vào đọc code thật (`bin/fgos.mjs`, `src/runner/paths.mjs`,
`src/cli/invocation-fault-log.mjs`) + test tự viết, rủi ro lan toả vốn đã
thấp (1 file, 1 verb, nhánh mới độc lập không đụng flag cũ).

## Shape

Không cần split — 1 mảnh việc thật, đã có sẵn ở
`docs/history/rollup-parent-auto-close/DISCUSSION.md#task-verify-from-flags`.
Case cụ thể cần test (phù hợp mode `small`, không cần ma trận đầy đủ như
`high-risk`):

1. `--verify-from-children` trên item có ≥2 children (trạng thái khác nhau,
   ít nhất 1 con ở `delivered` — không `cleanup`/`done`) → verify sinh ra
   chứa đủ id con + resolved-set 4 giá trị + `--dir` = root MAIN CHECKOUT
   (không phải cwd hiện tại nếu test giả lập chạy trong 1 thư mục con/
   worktree).
2. `--verify-from-targets` trên item `goalTier` có `targets` — tương tự
   trên nhưng đọc thẳng field, không quét.
3. `--verify-from-children` trên item KHÔNG có con nào → `edit` throw lỗi
   rõ ràng, exit non-zero, `verify` field KHÔNG bị ghi đè (kiểm bằng đọc
   lại item sau lệnh thất bại).
4. `--verify-from-targets` trên item không có `targets` (rỗng/absent) →
   cùng hành vi throw như (3).
5. (Không bắt buộc nhưng nên có) command sinh ra thật sự PASS khi chạy tay
   qua `fgos return` trên 1 fixture item con đã `delivered` — chứng minh
   command không chỉ đúng cú pháp mà còn đúng ngữ nghĩa, giải quyết đúng
   loại lo ngại `judgeVerifySemanticCorrectness` đã nêu lúc `fgos-exploring`
   (xem CONTEXT.md, dispute round 2-3 + `--force` override).

## Verify cho tsk-580 (đã đặt ở `fgos-exploring`, không đổi ở đây)

```
out=$(node --test --test-name-pattern="verify-from" test/cli/fgos.test.mjs 2>&1); echo "$out" | grep -qE "^# pass [1-9]" && ! echo "$out" | grep -qE "^# fail [1-9]"
```

Mọi test case (1)-(4) ở trên phải đặt tên chứa substring `verify-from` để
lệnh trên bắt trúng — đây là ràng buộc thật, không phải gợi ý.

## Assumptions

- Không export helper `resolveMainCheckoutRoot` mới trong `paths.mjs` —
  inline `execFileSync` trực tiếp trong 2 block flag mới, giống 3 tiền lệ
  đã có (`invocation-fault-log.mjs`, `merge.mjs`, `registrations.mjs`) —
  giữ scope, tránh mở rộng ngoài yêu cầu (YAGNI). Đây là assumption thuần
  implementation, không material với CONTEXT.md's decisions, nên không cần
  hỏi lại `fgos-exploring`.
- Câu message lỗi guard (danh sách rỗng) không cần format cụ thể đã chốt —
  chỉ cần rõ ràng, non-zero exit, tương tự các lỗi validation khác trong
  file (`StoreError('validation', ...)`).
