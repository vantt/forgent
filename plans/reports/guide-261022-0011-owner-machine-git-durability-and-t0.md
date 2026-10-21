# Máy owner: land bản bền dữ liệu của Git cùng HARDEN T0, một lần dừng

Viết lúc 2026-10-22 00:15 (Asia/Saigon) cho máy owner, gồm ba workspace: mdview, mcp-skill-hub và forgentX. Theo quyết định của owner lúc 2026-10-21 23:37, T0 land cùng lần land GIT này để chỉ phải dừng toàn bộ một lần (HARDEN ledger H15, chủ là GIT). Owner chọn giờ chạy.

Máy thứ hai đã land release `sha256:9e4c2630…`, build từ main `9670da5ff`. Chi tiết ở [báo cáo land](landing-261022-0011-git-durability-and-t0-this-machine.md). Máy owner build từ origin/main hiện tại, tức `9670da5ff` hoặc mới hơn.

## Có gì mới so với release máy owner đang chạy

Máy owner có thể vẫn chạy `653affd6…` (Git 07–08), vì bản [12:36](guide-261021-1236-owner-machine-durability-fixes.md) chưa có dòng nào ghi là đã land ở máy owner. Lần này gồm luôn bản đó.

**Git: bền dữ liệu, đều đã qua E1 cắt điện thật.** Lần chạy 2026-10-21 23:36 cho Publication 1040 điểm và ScopedCommit 554 điểm, 0 lỗi; xem [kiểm chứng](verification-261021-2336-git-e1-publication-and-scoped-commit.md).
- **Tree của Publication:** ghi qua `hash-object -w` có fsync. Trước đây `mktree` không fsync.
- **Nhả pin:** nếu bị cắt giữa chừng thì được làm lại.
- **ScopedCommit, khi commit:** blob/tree được fsync khi tạo, bằng `core.fsync=loose-object`. Object mới cũng bền trước khi nhánh dời và trước khi có receipt.
- **ScopedCommit, khi gặp object hỏng có sẵn:** object rỗng/hỏng được chữa, không chữa được thì từ chối với `object-file-corrupt`. Trước đây `git add` không ghi lại object rỗng có sẵn, nên commit sau trỏ vào object hỏng.
- **Recovery:** gặp đầu nhánh không đọc được thì báo `commit-objects-unreadable`, không reset nhánh.
- **Doctor `git-land-recovery`:** cảnh báo các Land đã xong mà còn giữ candidate (M3). Cảnh báo không làm doctor fail, và chưa có lệnh gỡ tay.
- **Event Store:** lỗi giờ mang mã thoát và stderr của Git.

**HARDEN T0.** Chi tiết ở [hướng dẫn T0](guide-261021-2213-harden-t0-owner-machine-landing.md), mục "Land cái gì".
- Mọi việc phán sống/chết, quan sát và gửi tín hiệu tới tiến trình đi qua cửa in-process trong addon gộp.
- Route `process-observe` và row `coordination-abandoned-claims` bị xoá.
- `gateway.json` có thêm tuple danh tính.

Lock protocol vẫn là 2. Activate thì vẫn dừng toàn bộ như mọi lần, theo yêu cầu của T0.

## Các bước

Làm ở cả ba workspace, trừ chỗ có ghi khác. Thứ tự là thứ tự của hướng dẫn T0, thêm phần kiểm của Git.

1. **Pull và đọc board.** Chạy `/usr/bin/git pull` ở forgentX. Đọc các dòng mới nhất trong `plans/261017-1313-fgos-platform-program-board/log.md`.
2. **Dừng toàn bộ.**
   - Không còn `fgos run`, `fgos session` hay lead nào chạy.
   - Kiểm bằng `ps` các tiến trình `fgos`, `fgctl` và `fgos-gateway`.
   - Kiểm các fd đang mở dưới `.fgos` của từng workspace và dưới `~/.local/state/fgos`.
   - Nếu có gateway thì chạy `fgos gateway stop </dev/null`.
3. **Dọn bằng release cũ.** Chạy `fgos doctor --fix </dev/null`. Kết quả phải có `lock-holders` 0 held và `git-operation-journal` pendingCount 0.
4. **Sao lưu** vào `.fgos/runtime/landing-261022/` của từng workspace:
   - `distribution.json`;
   - refspec fetch;
   - hash của `.fgos/config.json`, `AGENTS.md`, `CLAUDE.md` và `.claude/settings.json`;
   - `~/.fgos/config.json` (mode 600);
   - `fgctl.prev`.

   Ghi lại `artifactDigest` đang active trong `.fgos/installation/activation.json` để rollback.
5. **Build một lần** trong worktree detached sạch tại origin/main. Dùng `CARGO_TARGET_DIR` riêng trên ext4, **không đặt trong `/tmp`** (tmpfs có quota, các phiên khác hỏng theo).
   - `cargo build --locked --release --workspace`
   - `node scripts/build-rust-distribution.mjs --repo-root <wt> --out <staged>`. `manifest.json` phải có `git-wal-v1`.
   - `cargo install --locked --path <wt>/apps/fgctl --root ~/.local`
6. **Bắt buộc: kiểm byte canonical JSON của T0, trước khi activate.** Làm đúng bước 6 và chạy script ở cuối [hướng dẫn T0](guide-261021-2213-harden-t0-owner-machine-landing.md), trên `.fgos` của cả ba workspace. Kết quả phải là `canonical-corpus: all equal`. **Có `MISMATCHES` thì dừng, không activate**, rồi gửi danh sách `bad` cho `forgent-a8`.
7. **Activate** lần lượt mdview, mcp-skill-hub rồi forgentX, liền nhau. Ở mỗi workspace:
   - `fgctl stage --from <staged>`;
   - `fgctl upgrade --from <staged>`;
   - chép lại `distribution.json`;
   - kiểm hash không đổi;
   - `fgctl verify`.
8. **Doctor.** Chạy `fgos doctor --fix </dev/null`, rồi `fgos doctor` qua shim, ở cả ba workspace. Phải thấy:
   - mọi row `git-*`, `lock-*`, `terminal-*`, `process-containment`, `run-supervisor-route` và `state-root` đều đạt;
   - `git-land-recovery` đạt, hoặc chỉ cảnh báo nếu có Land giữ candidate;
   - `git-mutation-one-door` đạt;
   - `git-operation-journal` pendingCount 0;
   - không còn row `coordination-abandoned-claims`.
9. **Setup.** Chạy `fgos setup </dev/null`. Không được thêm key nào, refspec phải giống bản sao lưu, và `git fetch origin` phải chạy được.
10. **Smoke ở forgentX**, theo bước 11 của hướng dẫn T0:
    - gateway `start`, `status`, `stop`;
    - `fgos lock fence gateway --yes` trên lock rảnh;
    - một `fgos run` chỉ đọc;
    - một `fgos run` có ghi trong worktree tạm, phải `committed` qua ScopedCommit. Dọn bằng `fgos worktree remove <wt> --delivered-to <branch>`, rồi `git branch -D <branch>`.
11. **Ghi lại.** Viết một báo cáo landing; tên lấy bằng `fgos convention path --kind report --type landing --slug …`. Thêm một dòng trên đầu `log.md` của board, rồi báo `forgent-a8` (H15) và phiên GIT.

## Rollback

Dừng toàn bộ, rồi ở từng workspace:
1. `fgctl upgrade --from ~/.local/state/fgos/releases/<artifactDigest đã ghi ở bước 4>`;
2. chép lại `distribution.json` và `~/.fgos/config.json`;
3. `cp fgctl.prev ~/.local/bin/fgctl`.

Gateway do release mới khởi động phải được `fgos gateway stop` trước. Lock protocol 2 không đổi, và release cũ đọc được `gateway.json` mới.
