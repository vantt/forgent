# Phase 07: verb — `lock fence`, `lock-status`, bỏ `unlock`, reset trong mutex, take/pick

Wave 2. Nhánh `main-door/p07-verbs`, worktree `.claude/worktrees/md-p07`. Phụ thuộc: P03. Chủ duy nhất của `bin/fgos.mjs` và `src/cli/command-registry.mjs` trong plan này.

## Đọc trước

- r6 §6.7 (`fgos lock fence <name>`: liệt kê holder, hỏi xác nhận, SIGTERM rồi SIGKILL theo identity; nền không liệt kê được: `--attest-stopped` chỉ kiểm lại bằng try-lock; không bao giờ giành khi holder sống), §11/4.3 (verb `unlock` và skill `fgos-unlock` đổi theo).
- Source: [`bin/fgos.mjs:100-120`](../../bin/fgos.mjs) (import), `:3127`, `:3200` (take/pick + `withLockRetry`), `:3362` (`git worktree add`), `:4250-4295` (`unlock`), `:4295-…` (`lock-status`), `:4369` (`main-checkout-reset`); [`command-registry.mjs:1997`, `:2015`](../../src/cli/command-registry.mjs); [`core/skills/fgos-unlock/SKILL.md`](../../core/skills/fgos-unlock/SKILL.md). `bin/fgos.mjs` không có symbol GitNexus index (tsk-38h): dùng grep.

## Yêu cầu

1. **`fgos lock fence <name> [--param k=v] [--yes] [--attest-stopped]`** (Lead D7): giải lock theo registry; `holders()`; không ai giữ → báo `free`, exit 0; có → in pid/cmdline/tuple, hỏi xác nhận (bỏ qua với `--yes`), `signal_by_identity` SIGTERM, chờ 5 s, SIGKILL; xong kiểm lại `probe`. Với hot-mutex (`state`, `porting-events`): holder là record nóng — fence = kiểm `judge`; sống → dừng như trên; record không đọc được → người xác nhận rồi xoá record dưới kernel lock `reclaim` (đây là đường dọn `lock-record-unreadable` của r6 §6.6). Holder `unlistable` (macOS) + `--attest-stopped` → chỉ try-lock.
2. **Xoá verb `unlock`** (`:4250-4294`) và mục registry `:1997`; lệnh cũ gọi `unlock` gặp "unknown verb" (CHANGELOG ghi).
3. **`lock-status`**: đọc v3 cho mọi dòng registry có `scope` repo/machine (trạng thái `free|held`, holders, mức bảo đảm), cộng beacon W1' như hôm nay. Bỏ TTL/age/AMBIGUOUS. `--json` giữ khoá trên cùng `mainCheckout` và `beacon` (trường bên trong đổi; ghi CHANGELOG).
4. **`main-checkout-reset`** (`:4369`): toàn bộ thao tác git của verb chạy trong `withMainCheckout(scope, 'reset', …)` (r6 §11/4.3 "reset trong mutex").
5. **take/pick** (`:3127`, `:3200`): `withLockRetry` giữ (D5 của plan); import sang module mới.
6. **`:3362`** `git worktree add` → `addWorktree`.
7. Skill: `core/skills/fgos-unlock/` → `core/skills/fgos-lock-fence/` (nội dung theo verb mới), chạy `npm run build:skills` để sinh `.agents/skills`, `.claude/skills`, `plugins/fgOS/skills` (không sửa tay bản render). Danh sách skill trong `registrations.mjs:832` do P09 sửa.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `bin/fgos.mjs`, `src/cli/command-registry.mjs` |
| xoá/tạo | `core/skills/fgos-unlock/` → `core/skills/fgos-lock-fence/`; sản phẩm render của `npm run build:skills` |
| sửa | test của `unlock`/`lock-status`/`main-checkout-reset` (grep `'unlock'\|lock-status\|main-checkout-reset` trong `test/cli`, `test/rust-host/help-routes.test.mjs`, `test/rust-host/command-routes.test.mjs`) |
| tạo | `test/cli/fgos-lock-fence.test.mjs` |

## Test

1. `lock fence main-checkout` khi một process `node` giữ main → liệt kê đúng pid; `--yes` → process chết, lock trống; không có đường nào giành lock khi holder còn sống.
2. `lock fence state` với record nóng không đọc được (file rác) → `--yes` xoá dưới `reclaim`, `withStateTx` sau đó vào được.
3. `lock-status --json` liệt kê mọi lock registry với `free|held`.
4. `main-checkout-reset` trong khi process khác giữ main → chờ/từ chối có tên, không đụng index.
5. `fgos unlock` → unknown verb; help và command-routes test khớp.

Lệnh: `env -u ... FGOS_HOST_BIN=<build> node --test test/cli/fgos-lock-fence.test.mjs <test sửa>`.

## Tiêu chí nghiệm thu / rollback

Năm test xanh; `rg "case 'unlock'|forceReclaimAmbiguousLock|inspectMainCheckoutLock" bin src` rỗng. Rollback: revert.
