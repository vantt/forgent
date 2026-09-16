# Phase 04 — Fix orphaned authorization never retired

Lease: `orphaned-authorization-fix` | Vào được sau: baseline (P00 step 0); chạy
SONG SONG với P00-P03 — không đụng file nào của facade (chỉ sửa
`src/runner/coordination/session-engine.mjs` + test riêng), zero content
dependency với contract/mode-selection/policy-overlay/resume work. P05
(renumbered "Live proof và rollout") phải chờ CẢ HAI nhánh (facade
P00->P03 và cell này) đã merge vào TRACK_BRANCH trước khi mở.

**Status: merged.** Cell đóng qua hai coordination session
(`code-panel-multicell-facade--p04` cho doer+reviewer, red-team tiếp tục
ở `code-panel-multicell-facade--p04-redteam1` sau khi session gốc hết
wall-time budget) — cả hai review đều sạch (không HIGH/CRITICAL). Fix
merge vào track branch tại `d13570c4` (`--no-ff`), post-merge verification
tại `ebeef714` (tree-identical, không cần re-run full suite).
`testedSha`: `b16dd524621cbf97690663e9764f9ede286583be`. Deferred: F1/F3/F4/F5
(valid-pending-authorization edge case, xác nhận không live trong codebase
hiện tại; message/doc polish) — filed làm follow-up engine finding riêng,
không phải blocker của cell này.

## Mục tiêu

Sửa một bug engine thật, đã xác nhận, bị deferred từ track
`code-implementation-track-policy--p05` (xem "Review round 1 recheck" trong
`docs/architect/agent-coordination/verification/code-implementation-track-policy/p05.md`):
một authorization mồ côi (orphan), chưa từng bị consume, không bao giờ bị
retire. Một khi mọi authorization mới hơn cùng binding đã bị consume hết,
orphan lại trở thành authorization chưa-consume DUY NHẤT — nên một dispatch
keyless (không có authorization mới) sẽ tiêu thụ nhầm orphan cũ và mint một
Assignment trùng lặp, thay vì idempotently resume Assignment đã consume gần
nhất.

## Bug

`src/runner/coordination/session-engine.mjs`, `resolveBindingAuthorization`
và `resolveTaskKeyAuthorization` (gần dòng 1150-1230).

Repro (tại một binding): orphan A (không bao giờ consume) -> B consumed ->
C consumed. Một dispatch keyless không có authorization mới: kỳ vọng
idempotently resume Assignment của chính C (theo đúng doc comment hiện có
của `resolveTaskKeyAuthorization`: "with none left, the sole
ALREADY-CONSUMED one keeps a repeat call landing on the key its own
invocation first claimed"); thực tế: `findLast` trả về orphan A (cái duy
nhất chưa consume), mint một Assignment thứ 4 tiêu thụ `grantedContextRefs`
(có thể sai) của A.

Hướng sửa được khuyến nghị (từ chính báo cáo reviewer, đã accept nhưng
deferred): coi một authorization mới hơn ĐÃ consume là supersede mọi
sibling cũ hơn CHƯA consume, ở cả hai resolver — mở rộng đúng rule
newest-wins đã áp dụng cho unconsumed-vs-unconsumed sang cả
unconsumed-vs-consumed.

## Requirements

R1. Fix chỉ ở tầng engine (`resolveBindingAuthorization`,
`resolveTaskKeyAuthorization`); không đổi schema, CLI, hay validator.

R2. Thêm regression test tái hiện đúng repro ở trên (orphan A, B consumed,
C consumed, dispatch keyless thứ 4 phải resume Assignment của C, không mint
Assignment mới).

R3. Mutation-verify: revert fix, xác nhận test fail đúng theo cách đã mô tả
(mint Assignment thứ 4 tiêu thụ orphan A), sau đó restore fix và xác nhận
test pass. Ghi lại bằng chứng thật (không phải lời khẳng định).

R4. Không phá vỡ bất kỳ test hiện có nào đang exercise hai resolver này,
đặc biệt các regression test mà `tsk-1bh` (commit `9af6362c`/`aa328e70`/
`7b0af304`) đã thêm.

## Files

- Edit: `src/runner/coordination/session-engine.mjs`
- Add/Edit: test file(s) phù hợp trong `test/runner/coordination-*.test.mjs`
  (theo đúng vị trí các regression test `tsk-1bh` trước đó đã thêm)
- Add: `docs/architect/agent-coordination/verification/code-panel-multicell-facade/p04.md`
  (cell trace, cùng format với `p00.md`/`p05.md` tham chiếu ở trên)

## Steps

1. Đọc lại `resolveBindingAuthorization`/`resolveTaskKeyAuthorization` hiện
   tại, xác nhận repro còn tái hiện được trên `HEAD` của track branch.
2. Sửa cả hai resolver: một authorization mới hơn đã consume supersede mọi
   authorization cũ hơn chưa consume.
3. Thêm regression test theo đúng repro (R2), đặt cạnh các test `tsk-1bh`
   hiện có.
4. Mutation-verify (R3): revert riêng phần fix, chạy lại test mới, xác nhận
   fail đúng kiểu lỗi mô tả; restore, xác nhận pass.
5. Chạy FOCUSED_TESTS + kiểm tra không hồi quy các test `tsk-1bh` cũ.

## Validation

- Test mới fail trên code cũ (trước fix), pass trên code mới (sau fix) —
  chứng minh bằng mutation test thật, không chỉ lời khẳng định.
- Không có regression trên bộ test coordination hiện có.

## Verification

```sh
node --test test/runner/coordination-session-engine.test.mjs \
  test/runner/coordination-driver-authorization.test.mjs \
  test/runner/coordination-recovery-and-quorum.test.mjs
git diff --exit-code -- $(git diff --name-only -- src/runner/coordination/session-engine.mjs)
```

**Full-suite gate.** `src/runner/coordination/session-engine.mjs` là một
trong các `FULL_TRIGGERS` đã khai báo ở `plan.md` ("session/replay/schema
core") — cell này luôn là full-suite gate bất kể bảng Product Gates có đánh
dấu hay không, đúng theo rule đã khóa trong `plan.md`.

## Exit

Review + red-team đồng ý fix đúng root cause, regression test đã
mutation-verify thật, `FULL_TEST` xanh so với baseline đã ghi ở P00 (danh
sách failure chỉ được co lại, không được tăng).

## Rollback

Cell chỉ sửa engine + test, không đổi schema/CLI. Nếu fix gây regression
không giải quyết được trong `MAX_FIX_ROUNDS`, giữ cell ở `blocked`, không
merge, không mở P05 (renumbered "Live proof và rollout") cho tới khi cell
này đóng sạch — vì P05 là final full-suite + merge-to-main gate và phải
bao gồm fix này.
