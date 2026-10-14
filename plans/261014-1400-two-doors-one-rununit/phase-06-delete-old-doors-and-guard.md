# Phase 06 — Xoá D1/D2/D3/`dispatch log` + guard import và call-site

Mốc M2, bước F (song song 07b, 09a; **rebase lên 07b và ff một lần**) · Lane L6 (`feat/rununit-cut`) · Ước lượng 1d · Rủi ro: cao · Red-team bắt buộc

## Context

- Quyết định Lead #4, #5. Lead sửa plan #1: 06 chỉ xoá cửa và thêm guard; phần ruột fanout chuyển sang 09.
- Bản đồ cửa: [scout-261014-1045](../261014-1033-dispatch-operator-improvements/reports/scout-261014-1045-dispatch-door-map.md) §2.
- Prior art: P3 phase 5 đã định xoá D1, nhưng success criteria không kiểm việc này nên nó bị bỏ dở (`plans/261001-0327-request-to-run-p3-workflow-separate-from-work/phase-05-cut-dispatch-work-imports.md:20-21`, `ad9a23a9f`). Lần này guard khoá lại.
- Đã có test liệt kê call-site của `executeAssignment` ở `test/architecture.test.mjs:300-365`: `expectedFiles = {dispatch/cli.mjs, operation-choice.mjs, execution/run.mjs}` và `cliSites.length === 3`. 06 **mở rộng test này**, không viết test song song (V-M3).

## Hiện trạng cần cắt (số dòng trên `f69a446f0`; 00 có thể làm dời)

| Thứ | Vị trí |
|---|---|
| `case 'execute'` (D1, D2 `--contract`, D3 `--assignment`) | `src/runner/dispatch/cli.mjs:1173-~1558`; usage `:1676`; `readOnlyDoors()` `:314` |
| `dispatch log` | `src/runner/dispatch.mjs:111-135`; `src/runner/dispatch-log.mjs` |
| `dispatch fanout-batch` | `dispatch.mjs:137-155` gọi `src/runner/fanout-batch.mjs:37` |
| Import Work trong `dispatch.mjs` | `:37`, `:68`, `:70-71`, `:89-94`; `StoreError` lấy từ `state/store` |
| CLI và hook | `bin/fgos.mjs:2497-2530`, `:~4634`; `scripts/dispatch-decide-hook.mjs:28,70`; `src/cli/command-registry.mjs:891-897` |

Giữ nguyên: `dispatch inspect/reconcile --assignment` (cờ khác nghĩa), `probe-account`, `reconcile`, `decide`, `fgos run record`. `executeExecutorCli` giữ lại làm bước transport (`assignment-runner.mjs:2670`).

## Requirements

1. Xoá `case 'execute'` cùng các helper chỉ nó dùng; dùng `rg` kiểm từng helper. Xoá `log` và `fanout-batch` khỏi `dispatch.mjs`. Xoá `dispatch-log.mjs`. Xoá re-export Work. `StoreError` đổi thành lỗi của dispatch.
2. Gọi cửa đã xoá thì trả lỗi `validation` gồm một câu chỉ đường. Thông điệp nằm ở **một chỗ** trong `bin`, và cũng phải tới caller dạng `returnResult`:
   - `dispatch execute ...` → dùng `fgos run "<prompt>" --provider <executor> [--writes ...]` hoặc `fgos run --unit`;
   - `--assignment` → dùng `fgos run --unit` hoặc Workflow;
   - `dispatch log` → provenance nằm ở `.fgos/assignments/<unitRunId>/`.
3. `decide --work`: resolver Work được tiêm từ `bin` qua tham số `resolveWork` đã có (`cli.mjs:995`). `dispatch.mjs` không import `work-dispatch`. Chạy `node src/runner/dispatch.mjs decide --work` thì báo lỗi, chỉ sang `fgos dispatch decide --work`.
4. Thông điệp hook (`bin:~4634`, `dispatch-decide-hook.mjs:70`) trỏ tới `fgos run`.
5. **Lối vào fanout không thêm verb.** Thêm `isMainModule` CLI vào `src/runner/fanout-batch.mjs` (`node src/runner/fanout-batch.mjs "<ids>" [--has-live-task-access]`), giữ nguyên output và phần ruột. 09 sẽ đổi phần ruột sang runUnit. Không đụng `command-routes.json`. Chạy `node scripts/export-command-selectors.mjs --check` để chứng minh bảng route không đổi (H6).
6. **Guard:**
   - Mở rộng 3 test A4 (`test/architecture.test.mjs:674-750`) thêm `src/runner/dispatch.mjs` và `src/workflow/**`, không có allowlist.
   - Mở rộng test `:337` thành test call-site cho 4 symbol, tập file được phép ghi đích danh:
     - `executeAssignment` ⊆ {`execution/run.mjs`, `dispatch/cli.mjs` (chỉ probe-account)}, cộng allowlist {`operation-choice.mjs`};
     - `executeExecutorCli` ⊆ {`dispatch/assignment-runner.mjs`}, cộng allowlist {`fanout-batch.mjs`};
     - `commitUnitWork` ⊆ {`execution/run.mjs`}, cộng allowlist {`loop.mjs`, `fanout-batch.mjs`};
     - `executeThroughConfinement` ⊆ {`dispatch/cli.mjs`, cùng các file dispatch khác mà `rg` liệt kê lúc bắt đầu phase, ghi đích danh} (V-L9), cộng allowlist {`work-dispatch.mjs`}.
   - Allowlist đặt tên `R3_PENDING_WORK_CALLERS`.
   - Cập nhật nhánh posture `checkExecuteAssignmentCallSitePostures` (`:300-332`) cho `cli.mjs` vì 2 site đã bị xoá.
7. Xoá row `dispatch-log.mjs` trong manifest.
8. Test: xoá các test chỉ phục vụ cửa đã xoá (liệt kê trong báo cáo, kèm lý do); test còn giá trị thì chuyển sang `fgos run`.

## Files

Sở hữu:
- `src/runner/dispatch/cli.mjs`
- `src/runner/dispatch.mjs`
- DELETE `src/runner/dispatch-log.mjs`
- `src/runner/fanout-batch.mjs` (chỉ lối vào `node`)
- `bin/fgos.mjs`
- `scripts/dispatch-decide-hook.mjs`
- `command-registry.mjs`
- `test/architecture.test.mjs`
- manifest
- các test liên quan, lấy lại danh sách bằng `rg -l "logExecutorDispatch|fanoutBatchExecutorCli|'--contract'|'--assignment'|dispatch-log" test` và `rg -l "'execute'" test/runner test/cli`

Chỉ đọc: `work-dispatch.mjs`, `loop.mjs`, `operation-choice.mjs`.

## Bước

1. Impact cho `runDispatchCli`, `executeExecutorCli`, `decideExecutorCli`, `fanoutBatchExecutorCli`.
2. Test đỏ:
   - guard mở rộng (đỏ vì `dispatch.mjs` import Work);
   - call-site mở rộng;
   - lỗi chỉ đường;
   - `node src/runner/fanout-batch.mjs` chạy được với fixture.
3. Code cho xanh. Kiểm `rg -n "dispatch execute|dispatch\.mjs\"? *(execute|log|fanout-batch)|--contract" src bin scripts`: chỉ còn các thông điệp chỉ đường.
4. `npm test`. Viết báo cáo: danh sách test đã xoá hoặc sửa, và Spec delta cho 0062.

## Đòn red-team (sàn)

1. Còn caller sống của cửa đã xoá ở `src/`, `bin/`, `scripts/`, `core/`, `domains/`, `.claude/skills`, `apps/`, `herdr-dashboard/`, `packages/`, git hooks, `docs/` không.
2. Hook PreToolUse chạy với payload thật.
3. `decide --work` qua `fgos` và qua `node`.
4. Guard: thêm fixture vi phạm gồm `import()` động, re-export gián tiếp, `require`.
5. Lỗi chỉ đường tới được caller kiểu gateway/MCP (`returnResult`).

## Rủi ro + rollback

- Caller ngoài repo gọi D1 sẽ chỉ nhận lỗi chỉ đường. Owner đã chấp nhận.
- Rollback: revert **cùng** 07b.

## Xong khi

- Bước 2-3 xanh.
- `executeExecutorCli` chỉ còn production caller trong allowlist R3 và `assignment-runner`.
- `npm test` exit 0; red-team sạch.
- G2 đạt ([phase-07b](phase-07b-doctrine-remove-old-doors.md#cổng-g2-lead-sau-khi-ff-07b06)).
