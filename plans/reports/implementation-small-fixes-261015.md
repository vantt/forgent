# Bốn sửa lỗi nhỏ, 2026-10-15

- Worktree: `/home/vantt/projects/forgentX/.claude/worktrees/agent-acb5eed91904cce85`, nhánh `worktree-agent-acb5eed91904cce85`, fast-forward lên `main` (`51cd6b680`) trước khi sửa để có `22ee942d0`.
- GitNexus index cũ (`b334695`), nên blast radius làm bằng grep call site. Không chạy full `npm test`, không merge, push, activate hay `fgos setup`.

## 1. `/fgOS:terminal` nhắm vào pane chết (`c53083b7e`)

- Gốc lỗi: [`rename.sh`](../../plugins/fgOS/skills/terminal/rename.sh) và [`close.sh`](../../plugins/fgOS/skills/terminal-close/close.sh) tin thẳng `HERDR_PANE_ID`. Lệnh của codex chạy dưới daemon `codex app-server` dùng chung, env mang id pane đã đóng (`wS:p4YF`), hoặc pane của phiên khác nếu pane đó còn sống.
- Nguồn skill: `plugins/fgOS/skills/terminal*` là nguồn viết tay (không có header generated, `core/skills` không có bản terminal), nên không cần `npm run build:skills`.
- Sửa: [`pane-owned.sh`](../../plugins/fgOS/skills/terminal/pane-owned.sh) gọi `herdr pane process-info --pane <id>`, lấy `shell_pid` và kiểm nó là tổ tiên của tiến trình gọi. Pane chết hoặc của người khác thì in một dòng stderr và không làm gì. Áp cho cả rename lẫn close (close nhắm nhầm pane còn nguy hơn).
- Đã kiểm thật (chỉ đọc): `wS:p552` (pane này) → OWNED; `wS:p4YF` → bị từ chối `not a live herdr pane`.

## 2. `--rigor low` ra `sonnet` (`b4d14c4cc`)

- Gốc lỗi: [`bind.mjs`](../../src/runner/execution/bind.mjs) gộp `resolveStrongerRigor(unitRigor ?? 'standard', capRigor ?? 'standard')`, nên `standard` mặc định thành sàn. Capability `execute` không khai `rigor`, nên `low` không bao giờ thắng.
- Có chủ ý không: không. [`assignment-policy.mjs`](../../src/runner/dispatch/assignment-policy.mjs) ghi rõ "The implicit standard is a fallback, not a floor" và `docs/specs/runner.md` (RUL95, mục rigor) nói nguồn tường minh đầu tiên được chọn, chỉ `capabilities.<cap>.rigor` là sàn. `dispatch/cli.mjs` cũng theo đúng luật đó. Không có luật "mutating-min-rigor" nào.
- Sửa: bind theo cùng luật, sàn capability vẫn nâng `low`.

## 3. Release claim admin không vào event log (`05403d1a1`)

- Gốc lỗi: `22ee942d0` chỉ trả `admin` trong kết quả; `fgos unclaim` xoá file claim mà không ghi gì bền; reclaim trong `pick` có ghi `decision` nhưng thiếu danh tính writer.
- Sửa: dùng lại event `decision` (`kind: engine`), không tạo log mới. Fold `decision` trong `replay.mjs` spread cả payload và `addDecision` cũng spread, nên field `admin` mới là thêm vào an toàn theo [event-log evolution discipline](../../docs/knowledge/how-fgos-s-event-log-is-allowed-to-evolve-without-breaking-r/event-log-evolution-discipline.md). `unclaim` ghi `source: unclaim`, `admin: {reason, ownerWriterId, releasedByWriterId, claimId}`; item không tồn tại thì không có `id`, thêm `admin.itemId`. Reclaim thêm cùng field `admin` vào decision sẵn có. Writer tự release claim của mình: không ghi gì.
- Ghi sau khi `releaseClaim` trả về, không lồng claims lock với events lock.

## 4. `--provider` bind cli thay vì herdr (`ff79893a0`)

- Gốc lỗi: `resolvePostureInvocation` tự điền invocation cho executor trần (cli confined đầu tiên), rồi bind coi đó là invocation unit đã đặt tên → `unit-prefer-pinned-invocation`. Test cũ của `b78c0019c` không bắt được vì fixture xếp herdr trước cli confined.
- Sửa: candidate được chọn giữ `namedInvocation` (cái nó tự đặt tên). Chỉ cái đó, hoặc invocation của override, mới bị ghim.
- Chưa chạy live `fgos run --provider openai --account tetcu72` trong herdr.

## Test

| Fix | Lệnh `node --test` | Kết quả |
|---|---|---|
| 1 | `test/skills/terminal-pane-ownership.test.mjs` (mới) | 4/4 |
| 2 | bind + 9 file run/unit/patterns + `test/cli/run-verb.test.mjs` | 258/258 |
| 2 | 7 file `test/workflow/*` + `test/setup/registrations.test.mjs` | 164/164 |
| 3 | `test/runner/claim-port.test.mjs`, `test/state/runtime-coordination.test.mjs` | 54/54 |
| 4 | 20 file bind/run/dispatch/workflow/setup + `test/scripts/dispatch-decide-hook.test.mjs` | 768/768 |

Mỗi test mới hoặc assert mới đều đã chạy đỏ trước khi sửa.

## Chỉ ghi nhận

- `/fgOS:terminal` trong codex giờ bị từ chối, không đổi tên được pane. Muốn gắn nhãn đúng pane cho codex thì phải có ánh xạ terminal-control (mục 6.5), không làm ở đây.
- Cách kiểm tổ tiên dùng `ps -o ppid=`. Không có `ps` thì từ chối luôn.
