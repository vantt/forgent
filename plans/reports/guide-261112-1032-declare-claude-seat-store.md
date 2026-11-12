# Hướng dẫn: khai tài khoản claude để seat claude trong sandbox có login riêng và giữ được transcript

Dành cho: owner, trên máy owner (fg-server2 trước, rồi fg-server). Người viết: HARDEN (T9 P27). Trạng thái: **đề xuất, chờ owner áp dụng**. HARDEN không tự sửa tệp cấu hình nào của owner (`~/.fgos/config.*`, `.fgos/config.*`, `~/.fgos/private/*`).

## Chuyện gì thay đổi và vì sao

Quyết định 86 Q2 (a): seat claude chạy trong sandbox phải giữ transcript như pi và omp. Hiện seat claude đọc thẳng `~/.claude` (chỉ đọc dưới bwrap) nên không có chỗ nào để claude ghi session, và home riêng của attempt bị bỏ trống.

Bản chuẩn sau thay đổi này khai cho `claude-cli-bwrap` và `claude-herdr-bwrap` một kho login riêng, giống pi và omp:

- `CLAUDE_CONFIG_DIR` trỏ vào home riêng của attempt;
- file login `.credentials.json` được chép vào home đó (quyền 0600, thư mục 0700) từ tài khoản mà lease chọn, và xoá cùng home;
- claude ghi session vào `projects/` của home đó, và `finalize-home` giữ thư mục này trong run directory (không chép file login).

Một kho login cần một **tài khoản** trong kho tài khoản của máy: không có thì seat claude khởi động với home trống, chưa đăng nhập. Hàng doctor `confined-pane-accounts` (đã có) sẽ báo `fail` cho hai invocation claude cho tới khi có tài khoản dưới đây.

Login copy trong home attempt: nếu claude tự gia hạn token trong home, bản gia hạn được giữ ở `pending/` để owner xử lý tay (token claude không mang claim tài khoản ký nên fgOS không tự áp dụng, giống xai). Hàng doctor `credential-copies-retained` liệt kê chúng.

## Các dòng cần thêm (tệp tài khoản `~/.fgos/private/accounts.yaml`)

Một tài khoản trong pool `claude`, dùng kho đăng nhập thật của người dùng (`~/.claude`). Theo dạng `runner.providers` mà các pool khác của máy đang dùng:

```sh
fgos config set runner.providers.claude.accounts.main '{label: claude-main, credentialSources: {claude: {kind: home-files, home: "${HOME}/.claude", files: [".credentials.json"]}}}' --reason "owner: seat claude trong sandbox có login riêng để giữ transcript"
```

Hoặc sửa tay, thêm khối sau dưới `runner.providers` (cùng cấp với `openai`, `deepseek`...):

```yaml
    claude:
      accounts:
        main:
          label: claude-main
          credentialSources:
            claude:
              kind: home-files
              home: ${HOME}/.claude
              files:
                - .credentials.json
```

Chỉ `.credentials.json` được chép. `~/.claude.json`, `settings.json`, `projects/`, `history.jsonl` của người dùng không vào home của seat.

## Thứ tự áp dụng

Áp dụng **trước** khi kích hoạt bản phát hành chứa thay đổi này (khối trên vô hại với bản cũ: bản cũ không khai kho claude nên không dùng tài khoản này). Sau khi áp dụng và kích hoạt:

```sh
fgos config check
fgos doctor        # hàng confined-pane-accounts: cả hai invocation claude "has its 1 credential file(s)"
fgos dispatch probe-session claude   # category kept
```

## Máy khác

Máy nào chạy seat claude trong sandbox đều cần cùng khối (đường dẫn `${HOME}/.claude` đúng với người dùng của máy đó). Máy không có CLI `claude` thì bỏ qua: bind và doctor bỏ qua executor có CLI chưa cài.
