# Hướng dẫn land HARDEN T1 trên máy owner

Phiên `forgent-a8` viết lúc 2026-10-22 20:10 (Asia/Saigon). Máy owner có ba workspace: mdview, mcp-skill-hub và forgentX. Land theo kiểu dừng toàn bộ, vào giờ owner chọn. Máy thứ hai đã land xong lúc 19:58; kết quả ở [báo cáo đóng T1](closing-261022-2003-harden-t1-holder-lock-identity-door.md).

## Land cái gì

- **Code:** main `c56f1eae3` hoặc mới hơn.
  - Build từ main hiện tại thì mang theo luôn mọi thứ đã lên main trước đó: SEAT, row fence của Git, OPC Phase A, và các thay đổi của IDENT.
  - Nếu máy owner chưa land T0 hay Git durability theo [hướng dẫn của GIT](guide-261022-0011-owner-machine-git-durability-and-t0.md), lần land này gộp luôn cả hai. Khi đó làm thêm bước 6 (kiểm byte canonical JSON) của hướng dẫn T0 trước khi activate.
- **Thay đổi khi chạy:**
  - Mọi thao tác khoá từ Node trên Linux đều đi qua cửa in-process, không còn khởi tiến trình host.
  - Hook pre-commit gọi host đã kích hoạt qua các route native.
  - Bỏ khoá cấu hình `lock.predecessorKillWaitMs`; giờ chờ cố định 2000 ms. Config nào còn khoá này thì khoá bị bỏ qua, không bị ghi đè.
  - Doctor bỏ bốn row: `lock-fences`, `lock-predecessor-kill-wait`, `lock-record-unreadable` và `state-root`. Điều kiện của chúng nằm lại trong `lock-kernel-semantics` và `lock-holders`.
  - Bỏ hai route `fgos internal state-root` và `fgos internal identity mint-attempt`.
  - Chạy `node bin/fgos.mjs` thẳng từ checkout giờ từ chối các lệnh process, lock và identity.
- **Định dạng trên đĩa:**
  - Bản ghi hot, bản ghi predecessor và `activation.json` đều không đổi.
  - Registry lock bỏ các cột fence/v1. Registry này nằm trong release, không nằm trên đĩa của workspace.

## Điều kiện trước khi land (bắt buộc)

T1 xoá fence cutover phía Node. Trước khi activate, ở từng workspace (mdview, mcp-skill-hub, forgentX), dùng **release cũ**:

1. `fgos doctor --fix </dev/null`.
2. `fgos doctor --json </dev/null`. Row `lock-fences` phải đạt (mọi đường lock cũ đã có fence), và row `git-operation-journal` phải đạt.
3. Nếu `lock-fences` còn cảnh báo đường chưa fence:
   - Nếu chỉ là `dispatch-cwd`, `merge-slot` hay `advance` tạo sau ngày 2026-10-17 thì vẫn land được. Ở máy thứ hai có 55 đường như vậy, đều là đường không có file lock cũ.
   - Nếu có **file lock cũ** còn tồn tại thì dừng, không activate, và báo `forgent-a8` danh sách đó.

## Các bước (làm trong mdview, mcp-skill-hub và forgentX, trừ khi ghi khác)

1. **Pull và đọc board:** chạy `/usr/bin/git pull` ở forgentX, rồi đọc các dòng `forgent-a8` mới nhất trong `plans/261017-1313-fgos-platform-program-board/log.md`.
2. **Dừng toàn bộ:** không còn `fgos run`, `fgos session` hay lead nào đang chạy. Kiểm bằng `ps` các tiến trình `fgos`, `fgctl`, `fgos-gateway`, và kiểm các fd đang mở dưới `.fgos` của từng workspace và dưới `~/.local/state/fgos`. Có gateway thì chạy `fgos gateway stop </dev/null`.
3. **Điều kiện trước khi land:** làm như mục trên.
4. **Sao lưu** vào `.fgos/runtime/landing-t1/` của từng workspace:
   - `distribution.json`;
   - `.fgos/config.json`;
   - fetch refspecs (`git config --get-all remote.origin.fetch`);
   - hash của `AGENTS.md`, `CLAUDE.md` và `.claude/settings.json`;
   - `~/.fgos/config.json` (mode 600);
   - `fgctl.prev`.
5. **Build** trong một worktree tách riêng tại main.
   - Dùng `CARGO_TARGET_DIR` riêng trên ext4, **không đặt trên `/tmp`**, và **không dùng chung với checkout khác**.
   - Lệnh:
     - `cargo build --locked --release --workspace`;
     - `node scripts/build-rust-distribution.mjs --repo-root <wt> --out <staged>`;
     - `cargo install --locked --path <wt>/apps/fgctl --root ~/.local`.
6. **Kích hoạt** lần lượt mdview, mcp-skill-hub rồi forgentX, liền nhau. Ở mỗi workspace:
   1. `fgctl stage --from <staged>`;
   2. `fgctl upgrade --from <staged>`;
   3. chép lại `distribution.json` từ bản sao lưu;
   4. kiểm hash không đổi;
   5. `fgctl verify`.
7. **`fgos doctor --fix </dev/null`** với release mới.
8. **`fgos setup --json </dev/null`:** `configAddedKeys` và `globalConfigAddedKeys` phải rỗng, và refspecs không đổi.
9. **Doctor:**
   - Phải đạt: `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders`, `writer-identity-resolvable`, `identity-machine-id`, `process-containment`, `git-operation-journal`.
   - Không còn bốn row đã bỏ.
   - `git-mutation-one-door` sẽ **đỏ** với 5 chỗ `unresolved-binary`. Đây là lỗi của commit CFG `03c99bc61` trên main, không phải của T1, và đã báo cho CFG.
10. **Smoke ở forgentX:**
    1. `fgos gateway start`, `status`, rồi `stop`.
    2. `fgos lock fence gateway --yes` trên lock rảnh phải báo `free`.
    3. `fgos identity --json` trả về `source`.
    4. Một `fgos run` chỉ đọc, outcome `completed`.
    5. Một `fgos run` có ghi trong worktree tạm, commit qua ScopedCommit, rồi xoá worktree bằng `fgos worktree remove --delivered-to`.
    6. **Một `git commit` thật trong main checkout của forgentX:** hook pre-commit mới phải cho qua, tốn khoảng 3 ms cho bước kiểm khoá.
11. **Ghi lại:** viết một báo cáo landing (đặt tên bằng `fgos convention path --kind report --type landing …`) và thêm một dòng lên đầu `log.md` của board.

## Rollback

Dừng toàn bộ, rồi trong từng workspace:

1. `fgctl upgrade --from ~/.local/state/fgos/releases/<artifactDigest cũ>`. Digest cũ lấy ở `previousArtifactDigest` trong `.fgos/installation/activation.json`.
2. Chép lại `distribution.json`, `.fgos/config.json` và `~/.fgos/config.json` từ bản sao lưu.
3. `cp fgctl.prev ~/.local/bin/fgctl`.

Release cũ đọc được mọi định dạng mà T1 để lại trên đĩa.
