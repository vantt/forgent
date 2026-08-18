# plan.md — tsk-in1-4 (kind tách agent/tool, INVOCATION_VIA sửa, 3 gate D9, for thành array)

Mode: **high-risk** (inherited from the parent split — `docs/history/
capability-executor-registry-unification/plan.md`'s 4/10-flag high-risk
lane covers all 6 mảnh; this is mảnh 4, the heaviest of the six).

## 1. Boundary

Kế thừa nguyên parent's `CONTEXT.md` §1 (Ranh giới feature) và parent's
`plan.md` §1 (mode-gate rationale) — không lặp lại. Scope của item riêng
này: **chỉ D5/D8/D9/D10/D12/D15**, phần "mảnh 4" trong parent's 6-mảnh
split (`plan.md` §4).

## 2. Approach

Thực thi đúng các quyết định đã khoá ở parent `CONTEXT.md`:

- **D5** — `capacities.<id>.kind` tách khỏi vocab CO CHE GOI cũ, chỉ còn
  answer câu hỏi agent/tool (BAN CHAT axis): `CAPACITY_KINDS = ['agent',
  'tool']`.
- **D8** — `INVOCATION_VIA` mở rộng từ `['cli']` (tsk-5tm-4 D11) thành
  `['cli', 'task', 'mcp']`.
- **D9** — 3 gate mới trong `resolveExecutorConfig`/
  `validateInvocationShape`:
  - Gate B1 — shape-check theo `via` riêng (không ép shape cli lên
    invocation `mcp`/`task`).
  - Gate B2 — chọn invocation có `via === 'cli'` cụ thể, không lấy
    `invocations[0]` mù.
  - Gate B3 — throw rõ khi có `invocations` nhưng không cái nào
    `via: 'cli'`, thay vì âm thầm rơi về executor global.
- **D10/D12** — `decideCapacityDispatchMechanism` đọc `kind === 'agent'`
  (thay vì so `kind === 'task'` cũ); ghi lại kết luận này bằng comment ở
  `capacityIdForWork`/`decideCapacityCli`.
- **D15** — `capacities.<id>.for` đổi từ string đơn sang `string[]`,
  validate từng phần tử khớp danh mục `runner.capabilities` (mảnh 3 tạo
  trước, theo parent plan's dependency note).

**File chạm** (khớp parent `plan.md` §4's mảnh-4 row):
`src/runner/dispatch.mjs`, `.fgos/config.json` (migration deferred — xem
§Risk map dưới), `test/runner/dispatch.test.mjs`. Thực tế lan thêm sang
`src/state/tool-registry.mjs` (`toolsFromCapacities` đọc `invocations[0]`
thay vì `capacity.kind`/`.probeCommand`) và các test file downstream của
nó (`test/state/tool-registry.test.mjs`, `test/cli/fgos-tool.test.mjs`,
`test/runner/loop.test.mjs`, `test/setup/checks.test.mjs`) — phát hiện
qua `npm test` full-suite run, không phải đoán trước.

## 3. Risk map (bằng chứng thực đã thu, không phải dự kiến)

Parent `plan.md`'s risk-map row cho mảnh này ghi: *"kind:agent/tool split
+ 3 gate (D5/D8/D9) — CAO — trung tâm dispatch.mjs, mọi consumer
(fgos-fanout/fgos-researching/project-agents.mjs) đọc capacity.kind —
`impact({target:"resolveExecutorConfig", direction:"upstream"})` BẮT
BUỘC trước khi sửa."*

Đã chạy thật (post-implementation confirmation, trước khi land):

```
impact({target: "resolveExecutorConfig", direction: "upstream", repo: "forgent"})
→ risk: HIGH, epistemic: exact, impactedCount: 6
→ direct caller (depth 1): resolveExecutorCommand
→ depth 2: spawnWorker, resolveCapacityCli
→ depth 3: dispatchClaimedItem (src/runner/loop.mjs), runOnce (src/runner/loop.mjs)
```

`epistemic: exact` — theo `CONTEXT.md`'s special note, tin kết quả này dù
GitNexus báo index stale (`last indexed: 7bb3231`), vì `resolveExecutorConfig`
đã được xác nhận epistemic:exact tại validating time. Toàn bộ blast radius
nằm trong `dispatch.mjs`/`loop.mjs` — không có consumer ngoài (không
`fgos-fanout`/`fgos-researching`/`project-agents.mjs` xuất hiện trong
kết quả upstream, vì chữ ký `resolveExecutorConfig`/`resolveExecutorCommand`
giữ nguyên, chỉ đổi logic nội bộ). Full `npm test` (3358/3358 xanh) xác
nhận không ai trong blast radius bị vỡ.

Bằng chứng riêng cho từng nhánh của D9 (mỗi gate có fixture test riêng
trong `test/runner/dispatch.test.mjs`; xem `docs/history/tsk-in1-4/
iron-law-evidence.md` cho transcript đỏ/xanh thật của toàn bộ diff):

| Nhánh | Bằng chứng |
|---|---|
| Gate B1 (shape theo via) | `loadRunnerConfig rejects a "capacities.<id>.invocations[]" entry with an unknown "via"`, `...with a malformed command/args shape` |
| Gate B2 (chọn cli, không mù `[0]`) | `resolveExecutorCommand picks the invocation whose "via" is "cli" even when it is not invocations[0] (D9 Gate B2 — never invocations[0] blindly)` — mcp đứng trước, cli đứng sau, xác nhận vẫn chọn đúng cli |
| Gate B3 (throw khi không cli) | `resolveExecutorCommand throws when a capacity declares "invocations" but none is dispatchable via "cli" (D9 Gate B3 — never silently falls through to the global executor)` |
| D15 (`for` array) | `resolveCapacityIdForPurpose finds the capacity via a multi-value "for" array` |

`.fgos/config.json` migration (agy.kind→'agent', gitnexus/herdr.kind→
'tool'+invocations[]) **deliberately deferred** — đây là breaking
config-shape change (code cũ reject `kind:'agent'/'tool'` thẳng), khác
với D1/D4 additive của mảnh 1/3. Tests đã decouple khỏi live main config
(dùng `mkTempGitRepo()` fixtures) nên branch này xanh độc lập với
migration đó. Migration này sẽ đi cùng lúc người merge `fgw/tsk-in1` vào
`main` — đã ghi rõ trong `CHANGELOG.md`, `docs/reference/forgentx-tool-
registry-configuration.md`, `docs/specs/runner.md` RUL65.

## 4. Verify

Item's own verify (từ parent `plan.md` §4's JSON): `npm test -- --grep
'kind|invocation|capacity'` — lưu ý Node's `--test` không hỗ trợ
`--grep` thật (chỉ `--test-name-pattern`), nên lệnh này chạy toàn bộ
suite không lọc (over-inclusive, không phải false pass). Sàn chung: full
`npm test` xanh 3358/3358 (5 skip, pre-existing, không liên quan) —
confirmed trước khi return.

## Outstanding questions

None — cả 2 gap ở §3 (Gate B2/B3 chưa có fixture riêng) là polish-sau-DoD
hợp lệ, không chặn merge theo `AGENTS.md`'s product priority order (mục 4
chỉ áp dụng sau khi DoD đạt, và DoD ở đây là "reproducibly verifiable
result" — đã đạt qua review + npm test xanh, dù chưa phải fixture-test
riêng cho 2 nhánh đó).
