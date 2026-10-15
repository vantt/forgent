# Phase 01: fgos workflow start hỗ trợ --timeout và --account

## Bối cảnh và Context links

- `bin/fgos.mjs:2253-2289` — Xử lý CLI cho `fgos workflow start`: phân tích cờ, kiểm tra hợp lệ, chuyển tham số vào `startWorkflow`/`startWorkflowDetached`.
- `bin/fgos.mjs:2810-2836` — Chuẩn tham chiếu của `fgos run` xử lý cờ `--timeout <dur>` và `--account <id>`, gọi `parseRunTimeout` và tạo override với `origin: 'human-cli'`.
- `src/workflow/runner.mjs:195-206` — Hàm `unitOverridesOf(unit, seatPersonas, effort)` xây dựng danh sách override cho từng Unit.
- `src/workflow/runner.mjs:599-601` — Vị trí gọi `unitOverridesOf` trong vòng lặp điều phối của `advanceWorkflowRun`.
- `src/workflow/runner.mjs:928-951` — `resolveStart(params)`: giải mã và kiểm tra ràng buộc ban đầu của workflow run.
- `src/workflow/store.mjs:28-53` — `createWorkflowRun`: khởi tạo bản ghi workflow run và lưu metadata vào eventlog/store.
- `src/workflow/store.mjs:144-165` — `projectWorkflowState`: tái tạo trạng thái workflow từ chuỗi sự kiện.
- `src/runner/execution/bind.mjs:374-381` — `bind()` khớp ghim tài khoản `account` từ override.
- `src/runner/execution/bind.mjs:485-501` — `bind()` giải quyết thứ tự ưu tiên của `timeoutMs` giữa override và Unit.
- `src/cli/command-registry.mjs:2050-2077` — Khai báo schema các cờ của sub-verb `workflow start`.
- `test/cli/subcommand-flag-drift.test.mjs:195-200` — Test tĩnh đối chiếu cờ thực tế trong `bin/fgos.mjs` với `command-registry.mjs`.

## Yêu cầu (Requirements)

1. `fgos workflow start` tiếp nhận 2 cờ CLI mới:
   - `--timeout <dur>`: Thời lượng dạng chuỗi (ví dụ `90m`, `5400s`, `2h`, `120s`), sử dụng `parseRunTimeout` để chuyển thành `timeoutMs` (tối thiểu 1m, tối đa 4h per RUL96).
   - `--account <id>`: Chuỗi định danh tài khoản nhà cung cấp hợp lệ (phải là key trong `providers.<provider>.accounts` của `~/.fgos/config.json`).
2. Lưu trữ bền vững trong workflow run:
   - `createWorkflowRun` lưu `timeoutMs` và `account` vào sự kiện `workflow.start`.
   - `projectWorkflowState` đọc và đưa `timeoutMs` cùng `account` lên đối tượng `state`.
   - Lệnh `fgos workflow resume <id>` tái sử dụng chính xác `timeoutMs` và `account` đã lưu ban đầu. Cấm truyền đè `--timeout` hoặc `--account` mới khi resume (báo lỗi validation tương tự như `fgos run --resume`).
3. Truyền xuống từng Unit qua `unitOverridesOf`:
   - Phân bổ khoá override `timeoutMs` và `account` vào:
     (a) Từng override role có phạm vi (`scope: { unit: unit.id, role: seat }`);
     (b) Override fallback toàn cục (`origin: 'human-cli'`).
   - **Quy tắc Unit tự khai thắng:** Nếu bản thân Unit đã có khai báo `unit.timeoutMs !== undefined`, `unitOverridesOf` KHÔNG gán override `timeoutMs` cho Unit đó. Nhờ vậy, `bind.mjs` sẽ dùng giá trị `unit.timeoutMs` của chính nó.
4. Cập nhật `command-registry.mjs`:
   - Bổ sung định nghĩa `timeout` và `account` vào `workflow.subcommands.start.parameters.properties`.
   - Bảo đảm `test/cli/subcommand-flag-drift.test.mjs` chạy qua và không phát hiện độ lệch (drift).

## Files sở hữu

- `bin/fgos.mjs`
- `src/workflow/runner.mjs`
- `src/workflow/store.mjs`
- `src/cli/command-registry.mjs`
- `test/workflow/units-runner.test.mjs`

## Các bước thực hiện

### Bước 1: Mở rộng `bin/fgos.mjs`
1. Tại nhánh `if (sub === 'start')`:
   - Đọc cờ `flags.timeout`:
     ```javascript
     const timeout = flags.timeout === undefined ? undefined : requireField(flags.timeout, '--timeout requires a duration, e.g. 90m or 5400s');
     ```
   - Đọc cờ `flags.account`:
     ```javascript
     const account = flags.account === undefined ? undefined : requireField(flags.account, '--account requires an account id (an entry of providers.<provider>.accounts in ~/.fgos/config.json)');
     ```
   - Đưa `timeout` và `account` vào `startParams`.
2. Tại nhánh `if (sub === 'resume')`:
   - Kiểm tra nếu `flags.timeout !== undefined` hoặc `flags.account !== undefined`:
     ```javascript
     if (flags.timeout !== undefined) throw new StoreError('validation', '--timeout cannot change a resumed workflow run: it keeps the timeout it was started with');
     if (flags.account !== undefined) throw new StoreError('validation', '--account cannot change a resumed workflow run: it keeps the account its seats were bound to');
     ```

### Bước 2: Xử lý tại `src/workflow/runner.mjs`
1. Trong `resolveStart(params)`:
   - Phân tích `params.timeout`:
     ```javascript
     let timeoutMs = null;
     if (params.timeout !== undefined && params.timeout !== null) {
       timeoutMs = parseRunTimeout(params.timeout);
     }
     ```
   - Phân tích `params.account`:
     ```javascript
     const account = (typeof params.account === 'string' && params.account.trim() !== '') ? params.account.trim() : null;
     ```
   - Đưa `timeoutMs` và `account` vào kết quả trả về của `resolveStart`.
2. Trong `prepareWorkflowRun(params)`:
   - Nhận `timeoutMs`, `account` từ `resolveStart` và chuyển cho `createWorkflowRun`.
3. Sửa hàm `unitOverridesOf`:
   - Nâng cấp chữ ký hàm:
     ```javascript
     function unitOverridesOf(unit, seatPersonas = [], { effort = null, timeoutMs = null, account = null } = {})
     ```
   - Xử lý gán override:
     - Tạo bản sao overrides cho các seat (`seatScoped`).
     - Nếu `unit.timeoutMs === undefined && timeoutMs !== null`: bổ sung `timeoutMs` vào overrides.
     - Nếu `account !== null`: bổ sung `account` vào overrides.
     - Nếu `effort !== null`: bổ sung `reasoningEffort` vào overrides.
     - Nếu có ít nhất một override thuộc tính (`effort`, `timeoutMs`, `account`), tạo override dự phòng `{ origin: 'human-cli', ... }` cho các vai trò chưa có scoped override.
4. Trong `advanceWorkflowRun`:
   - Thay đổi lời gọi:
     ```javascript
     overrides: unitOverridesOf(u, state.seats?.personas, {
       effort: state.effort,
       timeoutMs: state.timeoutMs,
       account: state.account,
     })
     ```

### Bước 3: Lưu trữ và chiếu trạng thái tại `src/workflow/store.mjs`
1. Trong `createWorkflowRun`:
   - Thêm `timeoutMs` và `account` vào payload của sự kiện `workflow.start`:
     ```javascript
     ...(timeoutMs ? { timeoutMs } : {}),
     ...(account ? { account } : {}),
     ```
2. Trong `projectWorkflowState`:
   - Trích xuất:
     ```javascript
     let timeoutMs = null;
     let account = null;
     // Trong event workflow.start:
     timeoutMs = p.timeoutMs ?? null;
     account = p.account ?? null;
     ```
   - Trả về trong state:
     ```javascript
     ...(timeoutMs ? { timeoutMs } : {}),
     ...(account ? { account } : {}),
     ```

### Bước 4: Khai báo sổ lệnh `src/cli/command-registry.mjs`
Thêm vào `COMMAND_REGISTRY.find(c => c.name === 'workflow').subcommands.start.parameters.properties`:
```javascript
timeout: {
  type: 'string',
  description: 'Duration every unit of the run may take instead of runner.timeoutMs (e.g. 90m, 5400s, 2h); kept for resume. A unit that declares its own timeoutMs keeps its own.',
},
account: {
  type: 'string',
  description: 'Pin the provider account every unit runs on; kept for resume. Refused if any seat binds an executor whose provider has no matching account.',
},
```

## Test đỏ trước (Tên test cụ thể)

Thêm các ca test vào `test/workflow/units-runner.test.mjs`:
1. `test('--timeout gives every unit of the workflow run its own timeoutMs, kept for resume')`
   - Gọi `startWorkflow` với `timeout: '90m'`.
   - Khẳng định `state.timeoutMs === 5400000`.
   - Khẳng định Unit run có override `{ origin: 'human-cli', timeoutMs: 5400000 }` và binding mang `timeoutMs: 5400000`.
2. `test('a unit with its own timeoutMs wins over workflow start --timeout')`
   - Khai báo workflow chứa 2 unit: Unit A không khai `timeoutMs`, Unit B khai `timeoutMs: 120000` (2m).
   - Chạy workflow với `timeout: '90m'`.
   - Khẳng định Unit A nhận `timeoutMs: 5400000`.
   - Khẳng định Unit B nhận đúng `timeoutMs: 120000` (unit tự khai thắng).
3. `test('--account pins provider account on every unit of the workflow run, kept for resume')`
   - Khởi tạo repo fixture có cấu hình `providers.<provider>.accounts` hợp lệ.
   - Chạy workflow với `--account acct-test`.
   - Khẳng định Unit run nhận binding ghim account `{ provider, id: 'acct-test' }`.
4. `test('workflow start with invalid --timeout or --account is refused before run exists')`
   - Truyền `timeout: '10h'` (quá 4h) hoặc `account: ''`.
   - Khẳng định ném lỗi validation và không có thư mục run nào được tạo.
5. Chạy test drift:
   - `test/cli/subcommand-flag-drift.test.mjs` phải pass 100%.

## Rủi ro và Rollback

- **Rủi ro:** Khi Unit nằm trong panel preset (vốn đã có seatScoped personas), việc ghép overrides có thể làm mất `personaPin`.
  - *Kiểm soát:* `unitOverridesOf` clone nguyên mảng `seatScoped` và chỉ gắn thêm `timeoutMs` / `account` vào từng phần tử thay vì ghi đè.
- **Rollback:** Revert các thay đổi trên 4 file sở hữu; các workflow run cũ không mang 2 trường này vẫn hoạt động bình thường nhờ phép trích xuất `p.timeoutMs ?? null`.

## Spec & CHANGELOG delta

- **docs/specs/runner.md:** Bổ sung **RUL98**:
  > `fgos workflow start` kế thừa và phân bổ `--timeout <dur>` và `--account <id>` cho từng Unit: workflow run lưu `timeoutMs` và `account` vào `meta.json` / events và giữ nguyên khi resume. `unitOverridesOf` truyền các khoá này xuống Unit, nhưng Unit tự khai `unit.timeoutMs` luôn được ưu tiên.
- **CHANGELOG.md:**
  > - Added: `fgos workflow start` supports `--timeout <dur>` and `--account <id>` flags, propagating overrides down to each Unit run while honoring Unit self-declared timeouts.
