# CONTEXT: tsk-1ia — fix broken jq expression in `--verify-from-children`/`--verify-from-targets`

## Feature boundary

`bin/fgos.mjs`'s `edit --verify-from-children`/`--verify-from-targets`
(tsk-580, merged to `main`) generates a `verify` command whose jq filter
is logically broken — it always evaluates `true` regardless of the real
child/target statuses. Fix the jq expression only; no other behavior
(enumeration, guard, `--dir` resolution, D3's resolved-set default) changes.

## Locked decisions

| D-ID | Quyết định |
|------|-----------|
| D1 | Root cause: `all(["delivered","retrospective","cleanup","done"] \| index(.) != null)` — the `.` inside `index(.)` rebinds to the literal array itself (the `\|` immediately before it), not to the per-element status `all()` is iterating. Confirmed by direct `jq` execution: `echo '["todo","doing"]' \| jq 'all(["delivered","retrospective","cleanup","done"] \| index(.) != null)'` → `true` (wrong; neither status is in the resolved set). |
| D2 | Fix: bind the element to a named variable before piping into the literal array — `all(. as $s \| ["delivered","retrospective","cleanup","done"] \| index($s) != null)`. Confirmed correct by direct execution: `["todo","doing"]` → `false`, `["delivered","cleanup"]` → `true`, `["delivered","todo"]` → `false`. Same variable-binding pattern tsk-2jc's own real (human-authored) verify already used (`.data.work[id].status as $s \| [...] \| index($s) != null`) — should have been followed exactly instead of reinvented. |
| D3 | Regression coverage gap: tsk-580's own tests only asserted the generated command's STRING content (contains child ids, contains "delivered", etc.) — never actually EXECUTED the generated jq command against real status data. This item's new/updated tests must actually run the generated `verify` string (or an equivalent jq invocation built the same way) against both a genuinely-resolved and a genuinely-unresolved status set, and assert the real exit code — string-content checks alone are insufficient proof for a generated shell/jq command. |

## Scout evidence

- `bin/fgos.mjs` — the `--verify-from-children`/`--verify-from-targets`
  block added by tsk-580, the exact literal jq string containing the bug.
- `docs/history/tsk-2jc` — real precedent verify using `as $s` binding
  correctly (not scouted freshly here — already cited during tsk-580's own
  CONTEXT.md/plan.md).
- Direct `jq` execution (this session, both broken and fixed versions) —
  see D1/D2 above for the exact commands and outputs.

Không có câu hỏi mở nào — root cause đã xác nhận bằng thực nghiệm, fix đã
xác nhận bằng thực nghiệm, chỉ còn việc áp vào code + test thật.
