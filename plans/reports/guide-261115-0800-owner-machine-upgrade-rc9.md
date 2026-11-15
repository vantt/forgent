# Hướng dẫn: nâng ba máy từ v0.2.0-rc.8 lên v0.2.0-rc.9

Dành cho: anh (owner). Người viết: COOK. Trạng thái: **rc.9 đã phát hành; đã kích hoạt và chạy thử trên fg-server2; chưa áp dụng trên fg-server và máy của anh.**

Tag `v0.2.0-rc.9`, commit của tag: `e9e0d9433`. Trang phát hành: https://github.com/vantt/forgent/releases/tag/v0.2.0-rc.9 (kiểm `SHA256SUMS`; `fgctl upgrade` tự kiểm).

Hướng dẫn này chỉ nói **phần khác so với rc.8**. Những việc làm trước khi kích hoạt (Rust 1.99.0, login claude, ô `thehive`, kỹ năng cook, `gateway.bind`) không đổi: xem `guide-261113-2007-owner-machine-upgrade-rc8.md` mục 2. COOK không tự sửa tệp cấu hình nào của anh (`~/.fgos/`, `~/.fgos/private/`).

rc.9 **không** chứa việc chuyển lệnh sang Rust (F0) và các sửa "một cửa" sau đó: chúng nằm trên main sau commit của tag nên thuộc bản kế tiếp.

## 1. Cái gì đổi, nói với anh

| Thay đổi | Ảnh hưởng tới anh |
|---|---|
| **Sức khỏe tài khoản (account health A và B)** | `fgos dispatch probe-account` gọi thẳng từng login của tài khoản (không sandbox, không pane) và nói lỗi do tài khoản, do harness, cả hai hay không bên nào (`healthy`, `account-fault`, `harness-fault`, `mixed`); `--all` thử mọi tài khoản, `--record` ghi kết quả vào trạng thái dung lượng. Một tài khoản bị dừng vì hết hạn mức mà không nêu giờ reset thì được thử bằng một lần gọi thật (tối đa một lần mỗi lượt chạy) trước khi seat dùng lại: còn cạn thì vẫn bị loại, đã hồi thì được thả sớm. |
| **Hẹn giờ thử tài khoản (mặc định TẮT)** | `dispatch.probeAccount.intervalSec` đặt lịch chạy `probe-account --all --record --leg direct`. Chỉ khi anh đặt khóa này và chạy `fgos doctor --fix` thì bộ hẹn giờ mới được ghi. Không đặt thì không có gì thay đổi. |
| **Khóa hạn mức đúng giờ nhà cung cấp** | 429 hoặc `RESOURCE_EXHAUSTED` giờ kết thúc lượt chạy như "hết hạn mức" (tài khoản bị khóa), không còn là lỗi nhà cung cấp. Khóa hết theo yêu cầu của nhà cung cấp (ví dụ chờ 30 phút), nếu không thì theo giờ reset nó nêu, nếu không thì sau một giờ, và không quá một ngày. Mỗi lỗi nhà cung cấp để lại một dòng trong `provider-capacity/audit.jsonl` (cả lần xóa tay và mở khóa); `state.json` không còn danh sách `audit`. |
| **Số đo mới** | `fgos metrics runs` và kết quả chạy gọi lỗi hạn mức nhà cung cấp là loại riêng (`provider`); seat kết thúc mà không ghi kết quả hay báo cáo tính là lỗi hạ tầng (`infra-no-report`), không phải kết luận bỏ lửng. `unit-summary.json` lên phiên bản 3 (bản 2 vẫn đọc được); biên nhận chạy có thêm `providerSignal`. |
| **T9: lớp host và bề mặt** | `fgos preflight` bị bỏ (báo "unknown verb"); trong repo fgOS dùng `npm run check:before-merge`. Script nào của anh còn gọi `fgos preflight` phải đổi. Doctor nhanh hơn, mỗi hook shim chỉ thử một lần. Doctrine miền chỉ đọc từ fgOS đã cài, không đọc thư mục `domains/` của dự án; hàng doctor `agent-claims-resolve` bị bỏ. Chi tiết: `guide-261114-1149-owner-machine-harden-t9-host-surface.md`. Hẹn giờ đồng bộ thư giữa các máy chỉ gọi shim của dự án hoặc host của bản đã kích hoạt. |
| **Sửa Event Store** | Ghi thêm vào Event Store không còn lỗi I/O khi một lần niêm phong xóa đoạn đóng mới nhất đúng lúc đang phục hồi; đoạn đóng biến mất mà không có niêm phong nào che thì bị từ chối như hỏng dữ liệu (`closed segment vanished above receipt`) thay vì bị bỏ qua. |
| **Sửa đua trong test và tiến trình** | Vector mượn khóa Git, descriptor của tiến trình con, token chạy có theo dõi, gỡ state-home. Không đổi hành vi nhìn thấy. |
| **Windows: tên asset đã đúng** | rc.8 phát hành tarball Windows `fgos`/`fgctl` dưới tên `assets-check`, nên cài Windows bản đó không tìm thấy. rc.9 chỉ phát hành asset dựng cho đúng tag của nó: `fgos-v0.2.0-rc.9-x86_64-pc-windows-msvc.tar.gz` và `fgctl-v0.2.0-rc.9-x86_64-pc-windows-msvc.tar.gz` (kèm hai bản Linux, `install.sh`, `install.ps1`, `SHA256SUMS`). |

Known gap (nguyên văn CHANGELOG): trên Windows fgOS cài và kích hoạt được, nhưng Config, Event Store/Work và confinement chưa hỗ trợ, nên `fgos doctor` ở đó chưa `ok`; Linux là nền được hỗ trợ.

## 2. Việc anh làm

1. Ba máy cùng nâng một đợt (fg-server2, fg-server, máy của anh), mỗi máy nâng mọi dự án: liệt kê bằng `find ~ -maxdepth 6 -path '*/.fgos/installation/activation.json'`.
2. Không có việc cấu hình bắt buộc mới. Muốn bật hẹn giờ thử tài khoản thì đặt `dispatch.probeAccount.intervalSec` rồi `fgos doctor --fix`; mặc định tắt.
3. Kích hoạt, trong từng dự án:

```sh
cd <dự án>
FGCTL_VERSION=v0.2.0-rc.9 fgctl upgrade     # bản pre-release phải nêu tag
fgctl verify
fgos --version
fgos doctor
```

`fgctl upgrade` thay `fgctl` của cả máy bằng bản đi kèm rc.9 và giữ bản cũ ở `~/.local/bin/fgctl.prev`. Dự án commit pin (như repo này) thì commit `.fgos/distribution.json` đã đổi.

4. Chạy thật một lần trên máy có tài khoản: `fgos run "Reply with exactly the word OK" --json </dev/null`.

## 3. Quay lại rc.8

```sh
cd <dự án>
fgctl repair        # kích hoạt lại bản trước (previousArtifactDigest)
fgctl verify
fgos doctor
```

Cấu hình không phải đưa lại. Đi tiếp lại: `FGCTL_VERSION=v0.2.0-rc.9 fgctl upgrade`. Nếu `fgctl` mới không chạy được, bản cũ nằm ở `~/.local/bin/fgctl.prev`.

## 4. Kết quả chạy thử

**fg-server2, 2026-11-15** (dự án `forgent`, tài khoản thật): `FGCTL_VERSION=v0.2.0-rc.9 fgctl upgrade` rồi `fgctl verify` báo `verified 43a0eaf1c866`; `fgos run "Reply with exactly the word OK"` trả "OK"; hàng doctor `lock-borrow-vectors` là `ok` (cả 4 vector và kiểm tra anh em xanh, git 2.53.0). Doctor còn bốn hàng "cần anh xem" và chúng có từ trước, không do rc.9: registry công cụ thiếu một công cụ, việc `tsk-5db` kẹt ở bước "clarify", tài khoản `tetcu72` đang bị khóa hạn mức, và bản kích hoạt khác cây làm việc (main đã đi tiếp sau tag). fg-server và máy anh: chưa chạy.

## Câu hỏi còn mở cho anh

1. Có máy Windows nào trong đợt này không? (Windows chưa hỗ trợ Config và Event Store; chỉ cài và kích hoạt được.)
2. Có bật hẹn giờ thử tài khoản không? Mặc định tắt; bật thì cho biết chu kỳ (`intervalSec`).
