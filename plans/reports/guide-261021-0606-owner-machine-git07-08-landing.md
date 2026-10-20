# Máy owner: land Git 07–08 (một cửa Git, lock protocol 2)

Viết lúc 2026-10-21 06:06 (Asia/Saigon) cho máy owner, máy có ba workspace: mdview, mcp-skill-hub và forgentX. Chạy theo hướng dẫn này vào lúc owner chọn.

Máy thứ hai đã land release `sha256:491091a4b0e00debbe83af34ea20f192d0db72cd8ce1525ded6c754d870c05c7`, build từ main `cef8b532e` ([báo cáo land](landing-261021-0606-git07-08-this-machine.md)). Build từ origin/main hiện tại, tức `cef8b532e` hoặc mới hơn.

## Điều quan trọng nhất: lock protocol đổi từ 1 sang 2

Release mới nói holder-lock route protocol 2. Release cũ, và cả `fgos` cài global qua npm, nói protocol 1 và sẽ bị từ chối với `host-version-mismatch`. Ba workspace dùng chung state root của máy (`~/.local/state/fgos`), nên:

- **Phải nâng cả ba workspace trong cùng một lần dừng.** Không để một workspace chạy release cũ trong khi workspace khác đã lên release mới.
- Không khởi động run, lead hay gateway nào từ lúc bắt đầu bước 7 cho tới khi cả ba workspace đã qua bước 10.
- Nếu còn dùng `fgos` cài global qua npm ở đâu đó, nó sẽ không ghi được nữa. Dùng shim `fgos` của release đã activate.

## Có gì mới so với release đang chạy ở máy owner

- **Một cửa Git.** Mọi thao tác ghi Git trong sản phẩm đi qua driver fgos-git (Land, Sync, ScopedCommit, Worktree, SafeRestore…). `integrate.mjs` đã xoá. Doctor `git-mutation-one-door` kiểm census rỗng trên payload đang chạy.
- **Approve thử lại được** sau một lần bị từ chối trước Land. Một lần Land bị gián đoạn thì `fgos doctor --fix` khôi phục (`git-land-recovery`); thông báo từ chối của approve nói rõ bước đó.
- **Worktree của runner** để riêng phần dependency đã provision khi gỡ, không còn rò `node_modules`.
- **Hook của commit** được in tới 64 MiB như trước. Một tiến trình con của hook thoát khỏi nhóm tiến trình làm commit/Sync/Land báo rõ, không báo thành công trơn.
- **Kênh npm** (`npm install -g github:vantt/forgent`) không có addon Git: trong project chưa activate, `fgos init` từ chối và chỉ sang `fgctl init`.
- **Workflow chỉ đọc** (không unit nào khai `writes`) chạy được ngoài repo.

## Các bước (làm trong mdview, mcp-skill-hub và forgentX, trừ khi ghi khác)

0. **Dọn /tmp** khi không có suite nào chạy (giữ mọi thư mục là Git checkout):

   ```
   find /tmp -maxdepth 1 -name 'fgos-*' -mmin +120 -type d -exec sh -c 'git -C "$1" rev-parse --is-inside-work-tree >/dev/null 2>&1 || rm -rf "$1"' _ {} \;
   ```
1. **Git identity và version:** `git config --show-origin --get-all user.email` chỉ hiện `file:/home/<user>/.gitconfig`; `git --version` từ 2.53 trở lên.
2. **Dừng hết** (cả ba workspace):
   - `ps -eo pid,args | grep -E '(^| |/)(fgos|fgctl)( |$)|bin/fgos\.mjs|fgos-gateway|internal (supervise|gate)'` không ra gì;
   - không tiến trình nào giữ file dưới `.fgos/` hay `~/.local/state/fgos` (script `land-0530/stopcheck.sh` của máy thứ hai kiểm cả hai).
3. **Quét bằng release cũ:** `fgos doctor --fix </dev/null`. `run-attempts-stuck` phải adopt 0, `lock-holders` phải có 0 lock đang giữ.
4. **Sao lưu** từng workspace: `.fgos/distribution.json`, `git config --get-all remote.origin.fetch`, hash của `.fgos/config.json`, `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`. Thêm `~/.fgos/config.json` (mode 600) và `fgctl` thành `fgctl.prev`.
5. **Build một lần từ origin/main** trong một worktree detached sạch, với `CARGO_TARGET_DIR` riêng, mới:
   - `cargo build --locked --release --workspace`;
   - `node scripts/build-rust-distribution.mjs --repo-root <wt> --out <thư mục rỗng>` (từ `cef8b532e` lệnh này chạy được ở checkout sạch ngoài workspace đã activate; bản trước đó lỗi `lock-driver-unavailable`);
   - `cargo install --locked --path <wt>/apps/fgctl --root ~/.local`.

   `manifest.json` của cây phải có `git-wal-v1` trong `capabilities`.
6. **Kiểm trước khi kích hoạt** (tuỳ chọn, máy thứ hai đã chạy đủ): trong worktree build, `npm test` phải chỉ còn test chập chờn đã biết (`hot-lock fast path`, `loop.test` "real concurrency" khi máy tải nặng). Máy thứ hai: 8683 pass, 1 fail.
7. **Kích hoạt** lần lượt mdview, mcp-skill-hub rồi forgentX, liền nhau:
   - `fgctl stage --from <cây>`, rồi `fgctl upgrade --from <cây>` (khoảng 2–3 phút mỗi workspace);
   - khôi phục `.fgos/distribution.json`;
   - kiểm hash theo bước 4;
   - `fgctl verify`.
8. **Fence và recovery:** `fgos doctor --fix </dev/null` bằng release mới. `lock-fences` phải pass (có thể có cảnh báo vài đường workflow-run cũ chưa fence).
9. **Setup và git:** `fgos setup </dev/null` exit 0, `configAddedKeys` và `globalConfigAddedKeys` rỗng; refspec fetch giống bản sao lưu; `git fetch origin` exit 0; ở forgentX `git pull --ff-only` chạy được.
10. **Doctor qua shim** ở từng workspace. Phải pass: mọi dòng `git-*` (đặc biệt `git-mutation-one-door`, `git-component-compatible`, `git-operation-journal`, `git-native-locks`), mọi dòng `lock-*`, `run-supervisor-route`, `terminal-*`, `state-root`. Ở forgentX `active-release-matches-checkout` pass sau khi pull. Các dòng fail còn lại phải là dòng cấu hình đã có từ lần land trước.
11. **Smoke** trong forgentX:
    - a. `fgos worktree create .claude/worktrees/smoke-git07 --branch smoke/git07 --base origin/main`.
    - b. Một run ghi trong worktree đó: `fgos run "Create smoke/landing-check.txt containing one line: ok. Do nothing else." --provider claude --capability execute --rigor low --writes smoke/landing-check.txt --worktree <wt>`. Kết quả `pass`, commit `committed`, không còn `index.lock`, pane tự đóng.
    - c. Một run chỉ-đọc của claude và (nếu còn quota) của codex.
    - d. Dọn: `fgos worktree remove <wt> --delivered-to smoke/git07` (lưu ý: `--delivered-to` cần tên nhánh, full ref như `refs/remotes/origin/main`, hoặc object id; `origin/main` dạng ngắn bị từ chối), rồi `git branch -D smoke/git07`.
    - e. Một `fgos merge approve` thật chỉ khi có việc thật cần merge; không tạo merge giả.
12. Viết báo cáo land và một dòng trên board.

## Rollback

1. Dừng hết (bước 2), ở cả ba workspace.
2. Trong từng workspace: `fgctl upgrade --from ~/.local/state/fgos/releases/<digest release cũ của máy owner>`.
3. Khôi phục `.fgos/distribution.json`, `git checkout -- .fgos/config.json` nếu cần, khôi phục `~/.fgos/config.json`; kiểm hash; `fgctl verify`; `git fetch origin`.

Release cũ nói protocol 1: sau rollback không được chạy gì của release mới. Khi nhật ký Git (WAL) còn mục chưa xong, `fgctl` từ chối activate một release không có `git-wal-v1`; chạy `fgos doctor --fix` bằng release mới để `git-operation-journal` báo `pendingCount: 0` trước khi rollback.
