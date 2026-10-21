# Máy owner: land hai bản sửa bền dữ liệu của Git

Viết lúc 2026-10-21 12:36 (Asia/Saigon) cho máy owner (mdview, mcp-skill-hub, forgentX). Máy owner đang chạy release `653affd6…` (Git 07–08, land 08:32). Chạy vào lúc owner chọn; không gấp nhưng nên làm trước khi máy owner ghi nhiều event hoặc publication.

Máy thứ hai đã land release `sha256:ffe66288…` từ main `6d4c48a47` ([báo cáo land](landing-261021-1236-durability-fixes-this-machine.md)). Build từ origin/main hiện tại (`534f0fd7a` hoặc mới hơn).

## Có gì mới so với `653affd6…`

- **Tree được ghi bền.** Publication (seal của Event Store, mọi CAS qua cổng Publication) ghi tree qua `hash-object -w` có fsync. Trước đây `git mktree` không fsync, cắt điện có thể để lại tree rỗng và store từ chối đọc (`seal.json missing`).
- **Nhả pin bị cắt giữa chừng được làm lại.** Trước đây chuỗi WAL kẹt `recovery-required` mãi. Không bao giờ tự xoá file `.lock`; doctor `git-native-locks` giờ liệt kê cả lock của pin.
- Lock protocol vẫn là 2 (không đổi so với `653affd6…`), nên không cần dừng cả ba workspace cùng lúc vì protocol; vẫn dừng từng workspace khi activate.
- Bằng chứng: [kiểm chứng E1 và mất điện](verification-261021-1202-git-e1-and-event-store-power-loss.md) (E1 1029 điểm 0 vi phạm; Event Store 20/20).

## Các bước (mỗi workspace)

1. Dừng mọi tiến trình fgOS của workspace đó; không tiến trình nào giữ file dưới `.fgos/` hay `~/.local/state/fgos`.
2. Sao lưu `.fgos/distribution.json`, refspec fetch, hash `.fgos/config.json`, `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`; `~/.fgos/config.json` (mode 600).
3. Build một lần từ origin/main trong worktree detached sạch với `CARGO_TARGET_DIR` mới: `cargo build --locked --release --workspace`; `node scripts/build-rust-distribution.mjs --repo-root <wt> --out <thư mục rỗng>`; `cargo install --locked --path <wt>/apps/fgctl --root ~/.local`. `manifest.json` phải có `git-wal-v1`.
4. `fgctl stage --from <cây>` rồi `fgctl upgrade --from <cây>`; khôi phục `.fgos/distribution.json`; kiểm hash; `fgctl verify`.
5. `fgos doctor --fix </dev/null`, rồi `fgos doctor`: mọi dòng `git-*`, `lock-*` pass; `git-operation-journal` pendingCount 0.
6. `fgos setup </dev/null` không thêm key; refspec giống bản sao lưu; `git fetch origin` ok.
7. Smoke ở forgentX: một `fgos run` ghi một file trong worktree tạm (`fgos worktree create … --branch smoke/x --base origin/main`) phải `committed`; dọn bằng `fgos worktree remove <wt> --delivered-to smoke/x` rồi `git branch -D smoke/x`.
8. Ghi một dòng board (đầu `log.md`).

## Rollback

`fgctl upgrade --from ~/.local/state/fgos/releases/sha256:653affd6…` ở từng workspace, khôi phục `distribution.json` và config, kiểm hash. Cùng protocol 2 nên rollback không cần dừng cả ba cùng lúc.
