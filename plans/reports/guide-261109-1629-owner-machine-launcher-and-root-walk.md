# Hướng dẫn cho máy owner: launcher `fgos` chỉ chạy release trong store, host không lấy `~/.fgos` làm project

Sửa bảo mật khẩn (quyết định 80). Áp cho máy owner (design-lap) và fg-server; fg-server2 tự land.

## Hai thay đổi

1. **Launcher `~/.local/bin/fgos`.** Trước đây nó đi ngược lên tìm `.fgos/installation/bin/fgos` gần nhất và chạy file đó. Một repo clone về có thể commit sẵn file này kèm quyền chạy (Git giữ exec bit), nên gõ `fgos` bất kỳ trong repo đó là chạy code của repo, bằng quyền của mình (hook của agent gọi `fgos hook ...` mỗi lần dùng tool, nên chạy lặng lẽ). Bây giờ launcher chỉ đọc `status` và `artifactDigest` trong `activation.json` gần nhất rồi chạy `<stateRoot>/releases/<artifactDigest>/bin/fgos` trong store release của máy, đúng thư mục `fgctl verify` kiểm. Không chạy file nào dưới `.fgos/installation/` của project, không dùng `releasePath`. Digest sai dạng (`sha256:` + 64 hex thường), `status` khác `ready`, hay release không có trong store: từ chối, mã thoát 126, in tên file, lý do và cách sửa (`fgctl init` trong project, rồi `fgctl verify`).
2. **Host Rust.** Các lệnh `friction`, `metrics`, `convention`, `config` đi ngược lên tìm `.fgos` gần nhất; từ một thư mục không có store (ví dụ worktree trần) nó leo tới `$HOME` và lấy `~/.fgos` (thư mục global) làm store của project. Bây giờ việc tìm dừng dưới `$HOME`, `--dir` trỏ vào `$HOME` bị từ chối, và không thấy project thì báo `not inside an fgOS project` kèm cách sửa (chạy trong project, thêm `--dir <gốc project>`, hoặc `fgctl init`). Các lệnh không cần project (`identity`, `mailbox`, `version`, `gate-bypass`) chạy như cũ ở mọi nơi.

## Máy nhận launcher mới thế nào

- `fgctl init` và `fgctl upgrade` đều chạy `doctor --fix` ở cuối bằng release vừa kích hoạt; fix `project-fgos-launcher` thấy launcher cũ (cùng dòng marker, nội dung khác) và ghi đè. Nên **chỉ cần kích hoạt release mới như thường lệ** là launcher được thay.
- Máy nào chưa kích hoạt lại mà muốn thay ngay, sau khi release mới đã active, chạy trong một project đã kích hoạt:

  ```sh
  fgos doctor --fix </dev/null
  ```

  Rồi kiểm: `grep -c artifactDigest ~/.local/bin/fgos` phải ra số khác 0, và `fgos doctor </dev/null` dòng `project-fgos-launcher` qua.
- Launcher chỉ được ghi khi `fgos` đầu tiên trên `PATH` là launcher của fgOS (hoặc chưa có `fgos` và có `fgctl`). Một `fgos` lạ đứng trước trên `PATH` thì không bị ghi đè; doctor báo tên nó.

## Lưu ý

- Không đổi schema config, không đổi `activation.json`, không đổi store. Workspace shim `.fgos/installation/bin/fgos` vẫn do `fgctl` ghi và hook vẫn gọi nó trực tiếp như cũ.
- Từ một linked worktree (không có `.fgos`) gọi thẳng host (`FGOS_HOST_BIN`, `npm run fgos:dev`) với `convention`/`config`/`friction`/`metrics` mà không có `--dir` sẽ bị từ chối thay vì ghi nhầm vào `~/.fgos`. Thêm `--dir <checkout chính>` hoặc chạy từ checkout chính.
- **Quay lại:** revert hai commit trên main (xem dòng HARDEN trên bảng) và kích hoạt lại release trước; `fgos doctor --fix` sẽ ghi lại launcher cũ. Không có dữ liệu trên đĩa bị đổi.
