# Máy owner: land bản sửa đóng pane (pane-close)

Viết lúc 2026-10-20 16:51 (Asia/Saigon) cho máy owner, máy có ba workspace: mdview, mcp-skill-hub và forgentX. Release đang active ở máy owner là `sha256:4efa6e15…` (main `d02b82899`), theo [báo cáo land lúc 15:27](landing-261020-1527-cook-p4-debate-mpb1-fix-owner-machine.md). Chạy theo hướng dẫn này vào lúc owner chọn.

Máy thứ hai đã land và giữ release `sha256:fde9e4e12b09f62b713a1fd67c542c0e86eda6f6b5b4223b764b1c3068270ea3`, build từ main `0cef3e4c7` ([báo cáo land](landing-261020-1651-latest-main-pane-close-this-machine.md)). Build từ origin/main hiện tại, tức `0cef3e4c7` hoặc mới hơn. Các commit sau `0cef3e4c7` chỉ là docs, cộng thêm `dee31595c`, một thay đổi config (khai `ak:cook` cho mọi executor).

## Có gì mới so với `d02b82899`

- **Đóng pane của worker đã chết** (`58c530e13`, `e1d5a4005`). Khi run settle xong, receipt có gate exit nhận ra được và đủ hai digest capture thì release-slot **đóng** pane. Điều này áp dụng cho cả run lỗi, run bị huỷ (SIGTERM/SIGINT) và run hết giờ. Trước đây pane bị giữ lại, người phải tự đóng. Khi còn một bước settle chưa xong, release-slot không ghi `retain` vĩnh viễn nữa; lượt adopt hoặc resume sau sẽ quyết. Pane có tiến trình lạ ở foreground thì vẫn được giữ.
- **Dev door** (`scripts/run-rust-dev-host.mjs`): `npm run fgos:dev` giữ thư mục host đã stage khi còn một supervisor tách rời chạy từ đó, và dọn nó sau ít nhất 10 phút. Trước đây thư mục bị xoá sớm, làm settle lỗi `payload-missing` (exit 66).
- **Config thehive** cho ô flash của deepseek/glm (`69867e09b`): đã có trên máy owner từ lúc 15:30.
- Sửa một test (`708e086dd`) và thêm docs mailbox/research. Các phần này không đổi hành vi.

Vẫn làm theo kiểu stop-everything: không để controller của release cũ chạy song song với release mới.

## Các bước (làm trong mdview, mcp-skill-hub và forgentX, trừ khi ghi khác)

0. **Dọn /tmp** khi không có suite nào đang chạy. Lệnh này giữ lại mọi thư mục là Git checkout:

   ```
   find /tmp -maxdepth 1 -name 'fgos-*' -mmin +120 -type d -exec sh -c 'git -C "$1" rev-parse --is-inside-work-tree >/dev/null 2>&1 || rm -rf "$1"' _ {} \;
   ```

   Sau đó `git worktree list` trong từng project không được có thêm mục `prunable` mới.
1. **Git identity:** `git config --show-origin --get-all user.email` chỉ được hiện `file:/home/<user>/.gitconfig`. `git --version` phải từ 2.53 trở lên.
2. **Dừng hết.**
   - `ps -eo pid,args | grep -E '(^| |/)(fgos|fgctl)( |$)|bin/fgos\.mjs|fgos-gateway|internal (supervise|gate)'` phải không ra gì.
   - Không tiến trình nào được giữ file dưới `.fgos/` hay `~/.local/state/fgos`. Script `land-1530/stopcheck.sh` của máy thứ hai kiểm cả hai.
   - Nếu có lead đang chạy theo chuỗi (lead sau khởi động ngay khi lead trước xong), hãy **tạm dừng việc khởi động lead mới**. Máy thứ hai chỉ kịp land nhờ poll 2 giây và stage sẵn.
3. **Quét bằng release cũ:** `fgos doctor --fix </dev/null`. `run-attempts-stuck` phải adopt 0, `lock-holders` phải có 0 lock đang giữ.
4. **Sao lưu** từng workspace:
   - `.fgos/distribution.json`;
   - `git config --get-all remote.origin.fetch`;
   - hash của `.fgos/config.json`, `AGENTS.md`, `CLAUDE.md` và `.claude/settings.json`.

   Sao lưu thêm `~/.fgos/config.json` (mode 600) và `fgctl` thành `fgctl.prev`.
5. **Build một lần từ origin/main** trong một worktree detached sạch, với một `CARGO_TARGET_DIR` **riêng, mới**:
   - `cargo build --locked --release --workspace`;
   - `node scripts/build-rust-distribution.mjs --repo-root <wt> --out <thư mục rỗng>`;
   - `cargo install --locked --path <wt>/apps/fgctl --root ~/.local`.

   Trước khi kích hoạt, `manifest.json` của cây phải có `git-wal-v1` trong `capabilities`.
6. **Kiểm trước khi kích hoạt** (cùng worktree và cùng thư mục Cargo; xem `land-1530/precheck.sh`):
   - `cargo test -p fgos-git --test borrow_deadline -- --ignored` phải pass.
   - `cargo test -p fgos-run-supervisor -p fgos-terminal-control` phải 0 fail. Máy thứ hai được 219 pass.
   - `XDG_STATE_HOME=<thư mục tạm> FGOS_HOST_BIN=<cây>/bin/fgos node --test test/run-supervisor/terminal-fallback.test.mjs test/run-supervisor/terminal-cutover.test.mjs test/scripts/run-rust-dev-host-staging.test.mjs` phải 0 fail, 0 skipped. Các test này cần bwrap và herdr thật.
7. **Kích hoạt** lần lượt mdview, mcp-skill-hub rồi forgentX:
   - `fgctl stage --from <cây>`, rồi `fgctl upgrade --from <cây>`;
   - khôi phục `.fgos/distribution.json`;
   - kiểm hash theo bước 4;
   - `fgctl verify`.

   Lệnh `upgrade` chạy khoảng 2 phút; trong lúc đó không khởi động run nào.
8. **Fence:** `fgos doctor --fix </dev/null`, hoặc `land-1530/fence.mjs` (chạy từ `/tmp`). `lock-fences` phải pass.
9. **Setup và git:** `fgos setup </dev/null` phải exit 0, với `configAddedKeys` và `globalConfigAddedKeys` đều rỗng. Refspec fetch phải giống bản sao lưu, `git fetch origin` phải exit 0, và `git pull --ff-only` phải chạy được trong forgentX.
10. **Doctor qua shim** ở từng workspace.
    - Các dòng phải pass: `git-*`, `terminal-control`, `terminal-allocations`, `run-supervisor-route`, `lock-*`, `state-root`, `decision-index-stale`, `tier-fallback` và `workflow-case-*`.
    - Ở forgentX, `active-release-matches-checkout` pass sau khi đã pull.
    - `executor-skills-installed` sẽ fail cho tới khi cài lại ak cho codex/omp/pi/grok (việc của owner). Sau `dee31595c`, dòng này liệt kê mọi executor còn thiếu skill.
    - Các dòng fail khác phải giống bộ của lần land 15:27.
11. **Smoke** trong forgentX (script nằm trong `land-1530/` của máy thứ hai):
    - a. Một run chỉ-đọc của claude qua herdr, ví dụ đếm `wc -l README.md`. Kết quả phải `pass`.
    - e. Một run chỉ-đọc của codex qua herdr.
    - **Đóng pane, run sạch:** `fgos run "Reply with the word ok and stop." --provider claude --capability review`. Pane mở ra rồi phải biến mất khỏi `herdr pane list`, và `.fgos/assignments/<unit>/producer/1/runs/01/steps/release-slot.json` phải có `"disposition":"close"`. Script `pane-smoke.py clean <bk>` làm việc này và in ra pane nào còn mở.
    - **Đóng pane, run bị huỷ:** cùng lệnh, gửi SIGTERM cho tiến trình `fgos run` khoảng 3 giây sau khi pane xuất hiện (`pane-smoke.py cancel <bk>`). Controller phải exit 143 và in `chờ resume`. Receipt phải là `cancelled`/`stoppedBy: cancel`, release-slot phải `close`, và pane phải biến mất. Sau đó chạy `fgos run --resume <unit>` để không còn unit nào treo.
    - b/c. Hai run ghi trong một worktree tạm, tạo bằng `fgos worktree create .claude/worktrees/smoke-paneclose --branch smoke/paneclose-lease --base origin/main`. Mỗi run phải `committed`, không để lại `index.lock`, và `lease-mon.sh` phải thấy record `linux-gate` xuất hiện rồi mất. Nếu agent ghi `result-1.json` sai JSON (`invalid-agent-result-claim`), hãy xoá file do run lỗi để lại rồi chạy lại. Đó là lỗi của worker, không phải lỗi land.
    - d. Ctrl-C rồi resume (`smoke-int.py`). Phải exit 130, pane tự đóng (đây là điểm mới), và `--resume` cho `runs/02` pass với `supersedesRunId` trỏ về attempt 01.
    - **GitHub:** chạy `gh-smoke.mjs` từ `/tmp`. Nó chỉ đọc. **Không merge PR thật nào.**
    - **Dọn dẹp:** `fgos worktree remove <wt> --delivered-to refs/heads/smoke/paneclose-lease` sẽ từ chối với `worktree-ignored-bytes-preserved`, vì worktree đã được chép skill `ak-*` (đây là việc COOK × GIT còn mở). Chỉ trong worktree tạm đó, chạy `git clean -fdX` (chỉ xoá file bị ignore là skill đã chép), rồi gọi lại lệnh remove. Xong thì xoá nhánh smoke và gỡ worktree build bằng `git worktree remove` không force.
    - Chỉ đóng các pane do smoke của mình mở; không đụng pane của lead.
12. Viết báo cáo land và một dòng trên board.

## Kiểm gì sau khi land

- Một run lỗi hoặc bị huỷ không còn để lại pane: `herdr pane list` chỉ còn pane của các phiên và các lead đang chạy.
- Doctor `terminal-allocations` báo không có slot nào kẹt và không có pane giữ quá hạn.
- Nếu một pane vẫn bị giữ, xem `steps/release-slot.json` và `supervisor.log` của attempt đó. `retain` chỉ còn xảy ra khi thiếu dữ kiện (không có gate exit hoặc digest), mất carrier, attempt bị bỏ, hoặc có tiến trình lạ ở foreground. Một bước settle lỗi thì để slot chưa quyết, và lượt adopt sau sẽ thử lại.

## Rollback

1. Dừng hết (bước 2).
2. Trong từng workspace, chạy `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:4efa6e15…`.
3. Khôi phục `.fgos/distribution.json`, chạy `git checkout -- .fgos/config.json` nếu cần, và khôi phục `~/.fgos/config.json`.
4. Kiểm hash, rồi chạy `fgctl verify` và `git fetch origin`.

Chỉ khôi phục `fgctl` từ `fgctl.prev` khi chính `fgctl` có vấn đề. Bản sửa này không đổi định dạng receipt hay config, nên release cũ đọc được mọi thứ release mới đã ghi.
