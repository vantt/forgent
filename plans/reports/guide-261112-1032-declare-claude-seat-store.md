# Hướng dẫn: khai tài khoản claude để seat claude trong sandbox có login riêng và giữ được transcript

Dành cho: owner. **Tiến độ: fg-server2 đã xong (owner đăng nhập vào `~/.fgos/private/claude-login`, big lead thêm `runner.providers.claude.accounts.main` vào `~/.fgos/private/accounts.yaml`, 2026-11-12). Máy owner và fg-server còn phải làm.** Người viết: HARDEN (T9 P27). Trạng thái: **đã áp dụng trên fg-server2; chưa áp dụng trên máy owner và fg-server**. HARDEN không tự sửa tệp cấu hình nào của owner (`~/.fgos/config.*`, `.fgos/config.*`, `~/.fgos/private/*`).

## Chuyện gì thay đổi và vì sao

Quyết định 86 Q2 (a): seat claude chạy trong sandbox phải giữ transcript như pi và omp. Hiện seat claude đọc thẳng `~/.claude` (chỉ đọc dưới bwrap) nên không có chỗ nào để claude ghi session, và home riêng của attempt bị bỏ trống.

Bản chuẩn sau thay đổi này khai cho `claude-cli-bwrap` và `claude-herdr-bwrap` một kho login riêng, giống pi và omp:

- `CLAUDE_CONFIG_DIR` trỏ vào home riêng của attempt;
- file login `.credentials.json` được chép vào home đó (quyền 0600, thư mục 0700) từ tài khoản mà lease chọn, và xoá cùng home;
- claude ghi session vào `projects/` của home đó, và `finalize-home` giữ thư mục này trong run directory (không chép file login).

Một kho login cần một **tài khoản** (login riêng ở trên) trong kho tài khoản của máy: không có thì seat claude khởi động với home trống, chưa đăng nhập. Hàng doctor `confined-pane-accounts` (đã có) sẽ báo `fail` cho hai invocation claude cho tới khi có tài khoản dưới đây.

Login copy trong home attempt: nếu claude tự gia hạn token trong home, bản gia hạn được giữ ở `pending/` để owner xử lý tay (token claude không mang claim tài khoản ký nên fgOS không tự áp dụng, giống xai). Hàng doctor `credential-copies-retained` liệt kê chúng.

## Các dòng cần thêm: một login claude riêng của fgOS (không dùng `~/.claude`)

`~/.claude` là login của người dùng và mang mọi phiên lead trên máy này. Không trỏ tài khoản của seat vào đó: fgOS gia hạn login của tài khoản (có thể tiêu refresh token), và một lần gia hạn hỏng sẽ đăng xuất cả các phiên lead. Tạo một login riêng, một lần, trong thư mục do fgOS sở hữu:

```sh
mkdir -m 700 ~/.fgos/private/claude-login
CLAUDE_CONFIG_DIR=~/.fgos/private/claude-login claude /login
```

Đăng nhập bằng tài khoản claude dành cho seat (có thể là cùng tài khoản Anthropic nhưng là một lần đăng nhập khác, nên refresh token riêng). Sau đó khai tài khoản trong `~/.fgos/private/accounts.yaml`, `home` luôn trỏ vào thư mục đó:

```sh
fgos config set runner.providers.claude.accounts.main '{label: claude-seat, credentialSources: {claude: {kind: home-files, home: "${HOME}/.fgos/private/claude-login", files: [".credentials.json"]}}}' --reason "owner: seat claude trong sandbox dùng login riêng của fgOS"
```

Hoặc sửa tay, thêm dưới `runner.providers`:

```yaml
    claude:
      accounts:
        main:
          label: claude-seat
          credentialSources:
            claude:
              kind: home-files
              home: ${HOME}/.fgos/private/claude-login
              files:
                - .credentials.json
```

Chỉ `.credentials.json` được chép vào home của seat. Seat từ chối chạy nếu bản chép còn ít thời gian access token hơn timeout của seat (để seat không bao giờ tự gia hạn trong home); fgOS gia hạn login riêng này ở nguồn trước khi chạy.

## Thứ tự áp dụng

Áp dụng **trước** khi kích hoạt bản phát hành chứa thay đổi này (khối trên vô hại với bản cũ: bản cũ không khai kho claude nên không dùng tài khoản này). Sau khi áp dụng và kích hoạt:

```sh
fgos config check
fgos doctor        # hàng confined-pane-accounts: cả hai invocation claude "has its 1 credential file(s)"
fgos dispatch probe-session claude   # category kept
```

## Máy khác

Máy nào chạy seat claude trong sandbox đều cần login riêng và khối tài khoản của chính máy đó. Máy không có CLI `claude` thì bỏ qua: bind và doctor bỏ qua executor có CLI chưa cài.
