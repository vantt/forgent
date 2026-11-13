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
| **rc.8: các sửa nền** (cắt từ main hiện tại: rc.7 cộng các sửa CI, không thêm tính năng) | Bộ test chạy ổn định hơn và hai lỗi nền được vá, anh không phải làm gì thêm. Mục 4. |

### Known gaps (nguyên văn từ CHANGELOG, HARDEN cung cấp)

> Known gaps: on macOS, Git write operations (WAL) are not supported yet and the holder-lock cross-platform tests are red; on Windows, Git write operations (worktree, WAL) are untested and the fgctl uninstall surface tests are red. Linux is the proven platform; the Windows installer and packaging are proven on CI only.

Nói gọn: **chỉ Linux được chứng minh đầy đủ.** macOS chưa hỗ trợ ghi Git (WAL); Windows mới chứng minh bộ cài và đóng gói trên CI. Ba máy của anh nên đều là Linux; nếu có máy macOS hoặc Windows thì chỉ dùng để thử.

## 1. Thứ tự

1. **Ba máy cùng nâng một đợt:** fg-server2, fg-server và máy của anh. Đừng để một máy chạy bản mới còn máy kia chạy bản cũ lâu.
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

## 4. Anh sẽ thấy gì

Bản rc.8 được cắt từ main hiện tại, nên hành vi người dùng nhìn thấy **giống rc.7**. Khác rc.7 chỉ là các sửa nền sau, không có lệnh hay dòng doctor mới:

- **Lỗi lặt của bộ test vị trí khóa (holder-lock):** fixture của bài kiểm tra mượn Git sửa cho ổn định; không đổi sản phẩm.
- **Đua pid của cổng khi agent thoát rất nhanh:** sửa cuộc đua pid ở cổng với một agent thoát gần như ngay lúc vừa chạy (tên sửa theo HARDEN; chi tiết ở báo cáo CI của HARDEN).
- **bwrap ghi báo cáo qua memfd:** khi tiến trình gọi bị giết trước khi bwrap kịp báo cáo, namespace con không còn bị bỏ rơi.
- **Mồ côi của Git trong vùng cách ly (chỉ khi bản sửa đã land trước tag):** tiến trình Git con trong sandbox không còn thành tiến trình mồ côi. **Nếu chưa land khi cắt tag, xóa dòng này.**

Từ rc.6 đã có (nhắc lại cho máy chưa lên rc.6): gateway mặc định chỉ nghe `127.0.0.1` (mục 2e); hook agy từ chối khi cấu hình dự án không dùng được, như Claude; một lệnh chạy từ thư mục con của dự án đọc kho của dự án đó và `fgos init` chỉ chạy ở đỉnh repo; khối `Ready`, `N checks need you`, mã thoát, `fgctl uninstall` và cảnh báo pin lệch (xem hướng dẫn rc.6).

## 5. Quay lại

Từ rc.8 về bản trước (rc.7 hoặc rc.6) dùng một đường vì cả hai đều có addon Git:

```sh
cd <dự án>
fgctl repair        # kích hoạt lại bản trước (previousArtifactDigest)
fgctl verify
fgos doctor
```

Config không phải đưa lại (đã là `config.yaml`). Đi tiếp lại: `FGCTL_VERSION=v0.2.0-rc.8 fgctl upgrade`.

Về `v0.2.0-rc.5`: `fgctl` mới từ chối kích hoạt (thiếu addon Git, backlog `p-yfpixqfmdq`); đường quay về rc.5 vẫn là đường B trong `guide-261112-1817-owner-machine-packaging-close.md` mục 5, chỉ dùng khi thật sự phải về rc.5.

## 6. Kết quả chạy thử

Chưa có cho rc.8. Điền sau khi chạy trên fg-server2 (HARDEN) và hai máy còn lại: ngày, bản dựng, từng bước ở mục 3, `fgos doctor` (số dòng, cảnh báo), và câu trả lời thật của `fgos run`. Kết quả rc.6 (fg-server2, HOME tạm, 2026-11-12) vẫn ở `guide-261112-1817-owner-machine-packaging-close.md` mục 6.

## Câu hỏi còn mở cho anh

1. Có máy Windows nào trong đợt này không? Known gaps nói Windows mới chứng minh bộ cài và đóng gói trên CI, chưa chứng minh ghi Git. (Đã chốt: không có máy macOS, và B không có trong rc.8.)
