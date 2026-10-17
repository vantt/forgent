# Phase 00: contract cổng, record, route, fixture policy; crate rỗng

Wave 0, Lead. Nhánh `terminal-control/p00-contracts`, worktree `.claude/worktrees/tc-p00`, từ main sau khi 4.2 land.

## Đọc trước

r6 §7.2, §7.3, §7.5, §7.9; plan.md (D1–D7).

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `packages/terminal-control/contracts/terminal-control.port.v1.json` — thao tác và kết quả (bảng dưới); mọi kết quả có `unsupported` và `unknown` tường minh |
| tạo | `packages/terminal-control/contracts/allocation-record.v1.json` — `{v:1, key, groupKey, driver, serverIncarnation:{host, bootId, pidNs, pid, startTime, endpoint}, tabId, paneId, allocatedAt, display:{label, role?, agent?, model?}, origin: "allocated"\|"attached"}`; marker `launch-requested`, `launched{identity}`, `released{disposition, until?}`; nơi lưu `stateRoot/terminal/<driver>/<incarnationId>/allocations/<key>.json` (publish bằng `link`), hint `.../groups/<groupKey>.json` |
| tạo | `packages/terminal-control/contracts/internal-route.terminal-control.v1.json` — `fgos internal terminal-control <op> --protocol 1 --json`, request JSON ở stdin, một dòng JSON ở stdout, mã thoát; `--protocol` lệch → exit 4 `host-version-mismatch` (như route 4.2) |
| tạo | `packages/terminal-control/contracts/driver-capabilities.v1.json` — tên khả năng theo r6 §7.5 (`tab.create`, `pane.split`, `pane.close`, `pane.run`, `send.text`, `send.keys`, `read.screen`, `process.info`, `activity.state`, `label`, `layout.geometry`, `pane.resize`, `pane.swap`, `pane.move`, `server.incarnation`) |
| tạo | `packages/terminal-control/contracts/placement-policy.v1.json` — input `place({groupKey, tabs, groupPanes:[{key, rect, roleHint}], request:{display, roleHint}, limits})`, output `{split:{anchorKey, direction, ratio}} \| {newTab} \| {unsupported}`; thư mục `packages/terminal-control/contracts/policy-fixtures/` (rỗng, P04 điền) |
| tạo | `packages/terminal-control/rust/{Cargo.toml,src/lib.rs}` (crate `fgos-terminal-control`, chỉ `pub mod` rỗng) |
| sửa | `Cargo.toml` gốc (member), `Cargo.lock` |
| tạo | `test/terminal-control/contracts.test.mjs` (schema hợp lệ, tên khả năng duy nhất) |

## Cổng trên (theo key)

| Op | Request | Kết quả |
|---|---|---|
| `allocate` | `key, groupKey, display, roleHint?` | `{slot:{tabId, paneId}}` \| `unsupported` \| `unknown` |
| `attach` | `key, pane, display?` | `{slot}` (origin `attached`, không bao giờ bị core đóng) |
| `launch` | `key, launchSpec:{command, args, cwd, env, activity?:{kind, args}}` | `{identity:{pid, startTime, bootId, pgid}}` \| `not-started` \| `unknown` |
| `send` | `key, text?\|keys?, submit?` | `ok` \| `unknown` |
| `read` | `key, lines?, source?` | `{screen}` \| `unknown` |
| `inspect` | `key` | `{pane: live\|gone\|unknown, foreground?: identity, activity?}` |
| `release` | `key, disposition: close\|retain, until?` | `released` \| `kept-unknown` |
| `label` | `key, display` | `ok` \| `unsupported` |
| `reconcile-scan` | `olderThanMs` | danh sách báo cáo (không đóng gì) |

## Tiêu chí nghiệm thu / rollback

Contract đủ để P01–P04 code độc lập; `cargo check -p fgos-terminal-control`; test contract xanh. Rollback: revert.
