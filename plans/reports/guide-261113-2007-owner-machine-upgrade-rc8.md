# Hướng dẫn: nâng ba máy lên v0.2.0-rc.8

Dành cho: anh (owner). Người viết: COOK (nháp theo yêu cầu của HARDEN). Trạng thái: **nháp, chưa áp dụng, chưa land**. Dựa trên `plans/reports/guide-261112-1817-owner-machine-packaging-close.md` (viết cho rc.6); mục nào khác bản đó thì có ghi "mới".

**Chỗ HARDEN điền sau khi đẩy tag:** commit của tag: `<TAG_COMMIT>`; trang phát hành: `<RELEASE_URL>`; tên asset và `SHA256SUMS` lấy từ trang đó. Mọi chỗ khác dùng tag `v0.2.0-rc.8`.

HARDEN và COOK không tự sửa tệp cấu hình nào của anh (các tệp trong `~/.fgos/` và `~/.fgos/private/`). Các bước dưới đây chưa chạy thử cho rc.8 (chưa có tag); phần đã chạy thử ở rc.6 giữ nguyên ghi chú ở mục 6.

## 0. Cái gì đổi từ rc.6 đến rc.8, nói với anh

| Thay đổi | Ảnh hưởng tới anh |
|---|---|
| **rc.7: Rust 1.99.0** (ghim từ rc.6, rc.7 xác nhận trên CI Ubuntu và Windows) | Chỉ máy tự build từ source cần `rustup`; người chỉ cài bản phát hành thì không cần Rust (mục 2a). |
| **rc.7: Windows cài và kích hoạt được** | `fgctl init` và `fgctl upgrade` chạy trên Windows tới bước kích hoạt. Config, Event Store/Work và confinement **chưa hỗ trợ** trên Windows, nên `fgos doctor` ở đó chưa `ok`. Linux là nền được hỗ trợ. |
| **rc.7: sửa lỗi nền** | Kiểm tra "máy đang yên" trước `fgctl init`, `upgrade`, `repair` không bỏ sót tiến trình fgOS đang khởi động (Linux); id máy, work, backlog, project sinh được trên macOS và Windows; `fgctl uninstall --purge` từ chối thư mục state trùng HOME bất kể kiểu chữ hoa thường (Windows); kiểm tra Git trên Windows không còn đánh trượt Git hợp lệ. |
| **rc.8: các sửa của HARDEN T9** (nếu nằm trong tag) | `fgos preflight` đã gỡ (dùng `npm run check:before-merge` trong repo này); `fgos doctor` nhanh hơn; timer mailbox chỉ dùng shim dự án hoặc host của bản đang kích hoạt; `fgos agents list` chỉ đọc persona domain của bản đã cài. Chi tiết ở mục 4. |
| **rc.8: B, ghi nhận quota và lỗi hạ tầng** (chỉ khi B đã land trước tag) | Mỗi lần chạy tự nói bên nào hỏng: 429 là dừng do quota (tài khoản bị cách ly đến hết giờ nhà cung cấp yêu cầu), seat thoát 0 không báo cáo là lỗi hạ tầng, `unit-summary` lên v3. Mục 4. |

### Known gaps (nguyên văn từ CHANGELOG, HARDEN cung cấp)

> Known gaps: on macOS, Git write operations (WAL) are not supported yet and the holder-lock cross-platform tests are red; on Windows, Git write operations (worktree, WAL) are untested and the fgctl uninstall surface tests are red. Linux is the proven platform; the Windows installer and packaging are proven on CI only.

Nói gọn: **chỉ Linux được chứng minh đầy đủ.** macOS chưa hỗ trợ ghi Git (WAL); Windows mới chứng minh bộ cài và đóng gói trên CI. Ba máy của anh nên đều là Linux; nếu có máy macOS hoặc Windows thì chỉ dùng để thử.

## 1. Thứ tự

1. **Ba máy cùng nâng một đợt:** fg-server2, fg-server và máy của anh. Đừng để một máy chạy bản mới còn máy kia chạy bản cũ lâu. **Mới:** nếu B có trong bản này, `unit-summary` mới (v3) mà bản cũ không đọc được là lý do thêm để không trộn bản.
2. **Trên mỗi máy, nâng mọi dự án cùng lúc.** Liệt kê dự án trước: `find ~ -maxdepth 6 -path '*/.fgos/installation/activation.json'`. Máy đang chạy `v0.2.0-rc.6` hoặc `rc.7` thì cấu hình đã là `config.yaml`, việc nâng không chuyển cấu hình nữa; chỉ máy còn `rc.5` trở xuống mới bị chuyển `config.json` sang `config.yaml`, và dự án chưa nâng sẽ từ chối chạy (xem rc.6, mục 1.2).
3. **Mỗi máy làm đủ mục 2 trước, rồi mới kích hoạt (mục 3).**

## 2. Việc làm trước khi kích hoạt (mỗi máy một lần; fg-server và máy anh làm giống nhau)

| # | Việc | fg-server2 | fg-server | máy anh |
|---|---|---|---|---|
| a | Rust 1.99.0 (chỉ máy build từ source) | chưa đo | chưa đo | chưa đo |
| b | Login claude riêng và khối tài khoản `claude` | đã có | cần làm nếu chưa | cần làm nếu chưa |
| c | Sáu ô `thehive` trong `~/.fgos/config.yaml` | chưa có | cần làm nếu chưa | cần làm nếu chưa |
| d | Các dòng kỹ năng cook | đã có | cần làm nếu chưa | cần làm nếu chưa |
| e | **Mới:** `gateway.bind` nếu máy khác (LAN, Tailscale) gọi vào gateway | chưa đo | chưa đo | chưa đo |

Các hàng b đến d giống hệt hướng dẫn rc.6 (mục 2b đến 2d của `guide-261112-1817-owner-machine-packaging-close.md`, kèm `guide-261112-1032-declare-claude-seat-store.md`, `guide-261112-0755-declare-agent-routing-in-machine-config.md` và `guide-261109-1837-declare-cook-skill-in-machine-config.md`). Máy nào đã làm ở đợt rc.6 thì không làm lại; "chưa đo" nghĩa là chưa ai kiểm trên máy đó.

### a. Rust 1.99.0 (nhắc lại)

`rust-toolchain.toml` ghim `1.99.0`; lần `cargo build` đầu trong kho tải compiler qua `rustup` (cần rustup 1.28 trở lên). Máy chỉ có cargo của distro cũ hơn thì không build được từ source: cài rustup trước. Người chỉ cài bản phát hành thì không cần Rust. Muốn kiểm tra chéo: `rustup target add x86_64-pc-windows-msvc aarch64-apple-darwin`.

### e. Gateway chỉ nghe 127.0.0.1

Từ bản có HARDEN T9 P14, gateway mặc định bind `127.0.0.1`, không còn `0.0.0.0`. Máy nào có máy khác gọi vào gateway (qua LAN hoặc Tailscale) thì **trước khi kích hoạt** thêm một dòng `gateway.bind` vào cấu hình toàn cục (`~/.fgos/config.yaml`; máy còn `config.json` thì ở đó) với địa chỉ cần nghe (ví dụ `0.0.0.0` hoặc địa chỉ Tailscale). Kiểm: `fgos gateway status` sau khi kích hoạt. Mỗi request đổi trạng thái giờ ghi người gọi trên stderr của gateway.

## 3. Kích hoạt (cùng một đợt, mục 1)

Trong từng dự án trên máy:

```sh
cd <dự án>
FGCTL_VERSION=v0.2.0-rc.8 fgctl upgrade     # bản pre-release phải nêu tag
fgctl verify
fgos --version                              # fgos 0.2.0-rc.8
fgos doctor                                 # ok: true
```

Nếu `fgctl` của máy cũ (không có `--version`), chạy lại `install.sh` của bản mới trước. Nguồn bản phát hành: `<RELEASE_URL>` (kiểm `SHA256SUMS`; `fgctl upgrade` tự kiểm). Dự án commit pin (như repo này) thì commit `.fgos/distribution.json` đã đổi.

Kiểm định tuyến không đổi (trước và sau, cùng dự án): `fgos dispatch explain --for execute` và `--for review`.

Chạy thật một lần ngay sau khi kích hoạt, trên máy đã có tài khoản: `fgos run "Reply with exactly the word OK" --json </dev/null`. Bước này chưa từng chạy được trong HOME tạm (không có tài khoản thật), nên **phải chạy trên máy thật**.

## 4. Anh sẽ thấy gì (chỉ phần mới từ rc.6)

- **`fgos preflight` đã gỡ:** lệnh trả "unknown verb" (mã 4). Trong repo này dùng `npm run check:before-merge`.
- **`fgos doctor` nhanh hơn:** đo trong tiến trình, trung vị 2052 ms trước và 1450 ms sau. Số dòng doctor đổi từ 110 xuống 109: dòng `agent-claims-resolve` đã bỏ vì dự án không còn cung cấp task-spec hay agent domain.
- **Persona domain:** `fgos agents list` và seat chỉ đọc persona domain của bản đã cài, bỏ qua thư mục `domains/` của dự án. Mục `masked` chỉ còn persona core bị `core/agents` của dự án che.
- **Timer mailbox:** `fgos doctor --fix` ghi timer chỉ dùng shim của dự án hoặc host của bản đang kích hoạt; đường dẫn dự án chứa `%` hoặc ký tự điều khiển thì dòng doctor cảnh báo và không ghi timer.
- **`compiled.json` của domain** có phiên bản hợp đồng; bản đọc từ chối phiên bản lạ và nêu tên.
- **Hook agy:** từ chối khi cấu hình dự án không dùng được (như Claude), không còn cho qua.
- **Chạy từ thư mục con:** lệnh đọc kho của dự án đang đứng, không tạo kho ma; `fgos init` chỉ chạy ở đỉnh repo.
- **B, nếu có trong tag:** 429 hoặc `RESOURCE_EXHAUSTED` kết thúc vòng là dừng do quota (`blocked(usage-limit)`); tài khoản bị cách ly đến hết thời gian nhà cung cấp yêu cầu (ví dụ 30 phút), mặc định 1 giờ; mỗi lỗi nhà cung cấp thêm một dòng vào `provider-capacity/audit.jsonl` trong thư mục runtime của capacity; seat thoát 0 mà không có báo cáo là lỗi hạ tầng (`no-report`); `provider-limit` có nhóm riêng `provider`; `unit-summary.json` lên v3 (bản đọc nhận cả v2 và v3). **Nếu B chưa land khi cắt tag, xóa dòng này khỏi hướng dẫn.**

Phần còn lại giống rc.6 (khối `Ready`, `N checks need you`, mã thoát, `fgctl uninstall`, cảnh báo pin lệch).

## 5. Quay lại

Từ rc.8 về bản trước (rc.7 hoặc rc.6) dùng một đường vì cả hai đều có addon Git:

```sh
cd <dự án>
fgctl repair        # kích hoạt lại bản trước (previousArtifactDigest)
fgctl verify
fgos doctor
```

Config không phải đưa lại (đã là `config.yaml`). Đi tiếp lại: `FGCTL_VERSION=v0.2.0-rc.8 fgctl upgrade`. **Lưu ý B:** `unit-summary.json` v3 do rc.8 ghi mà bản trước không đọc được thì `fgos metrics` của bản trước bỏ qua các tệp đó (mất số liệu, không mất dữ liệu); đừng xóa chúng.

Về `v0.2.0-rc.5`: `fgctl` mới từ chối kích hoạt (thiếu addon Git, backlog `p-yfpixqfmdq`); đường quay về rc.5 vẫn là đường B trong `guide-261112-1817-owner-machine-packaging-close.md` mục 5, chỉ dùng khi thật sự phải về rc.5.

## 6. Kết quả chạy thử

Chưa có cho rc.8. Điền sau khi chạy trên fg-server2 (HARDEN) và hai máy còn lại: ngày, bản dựng, từng bước ở mục 3, `fgos doctor` (số dòng, cảnh báo), và câu trả lời thật của `fgos run`. Kết quả rc.6 (fg-server2, HOME tạm, 2026-11-12) vẫn ở `guide-261112-1817-owner-machine-packaging-close.md` mục 6.

## Câu hỏi còn mở cho anh

1. Có giữ máy macOS hoặc Windows trong đợt này không? Known gaps nói chưa hỗ trợ ghi Git ở đó.
2. B có vào rc.8 không? Hướng dẫn đang viết có điều kiện.
