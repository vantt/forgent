# Hướng dẫn cho máy khác: mailbox, secrets và hội đồng (phiên `d50dc90b`, 2026-10-20)

Dành cho máy owner và máy thứ hai sau khi kéo main. Không có thay đổi hành vi nào cần kích hoạt lại release.

## Cái gì vào main

| Thay đổi | Ghi chú |
|---|---|
| Spec mailbox nháp `docs/platform/agent-mailbox/spec.md` (lát đầu: giao tin vào session đang sống, Claude Code, Codex, agy, một máy) | Chưa ký. Đang chờ cổng G0 (V-011, dạng địa chỉ). Hội đồng đã chạy; kết quả chưa chốt ở [báo cáo hội đồng](research-261020-1327-mailbox-spec-architecture-panel.md), cần sửa spec theo đó trước khi ký |
| Hai báo cáo hội đồng cùng phiên `plans/reports/research-261019-1828-...round1.md` và `...1834-...round2.md` | Do agent cùng phiên viết, không phải hội đồng fgOS. Bằng chứng để kiểm, không phải đồng thuận |
| Spec `docs/platform/secrets/spec.md` (nháp) | Quyết định đã ghi: tên khóa chung `OPENROUTER_API_KEY`, thứ tự giải môi trường, rồi file dự án, rồi file toàn cục, Rust |
| Crate thư viện `packages/secrets/rust` (`fgos-secrets`) và schema `packages/secrets/contracts/declaration.v1.schema.json` | Chỉ là thư viện, **không có crate nào phụ thuộc vào nó**, nên binary `fgos` không đổi và không cần build lại release hay kích hoạt |
| Phụ lục bằng chứng trong `plans/reports/spec-draft-261020-1017-seat-binding-component.md` | Cho lane Seat Binding, xem bên dưới |

## Việc cần làm trên máy khác

1. `git pull`, rồi `cargo test -p fgos-secrets` (12 test của crate) và `node --test test/architecture.test.mjs`. Không cần `fgos setup` hay kích hoạt.
2. Không có thay đổi cấu hình nào phải đồng bộ cho phần này.

## Thông tin để máy chạy hội đồng (deepseek, glm qua OpenRouter)

- Trên máy phiên này, ghế deepseek lỗi lần đầu vì thư mục tài khoản pi `~/.pi/accounts/openrouter` chỉ có `settings.json`, không có thông tin đăng nhập (`pi auth check --provider openrouter` trả `not_ready`). Cách làm tạm: tạo `auth.json` kiểu `api_key` trong thư mục đó (quyền 0600, lấy khóa từ file bí mật, không in ra màn hình) và thêm `auth.json` vào danh sách `files` của hai tài khoản `openrouter` trong `~/.fgos/config.json`. Chỉ làm khi máy đó chưa có `llmAccounts.openrouter` toàn cục. Khi lane MP-B1 chuyển sang pool, store pi nên là cùng thư mục.
- Kiểm tra sẵn sàng không in khóa: `PI_CODING_AGENT_DIR=~/.pi/accounts/openrouter pi auth check --provider openrouter --json` phải trả `ready`. Chú ý lệnh này tạo `auth.json` rỗng nếu chưa có.
- **Đừng chạy lại cả hội đồng chỉ vì ghế red-team sai định dạng.** Xem phụ lục trong spec Seat Binding: chỉ dẫn "xuất báo cáo kết luận dạng JSON" của ghế sản xuất có thể lẫn sang reviewer và red-team qua `{objective}` của bước tổng hợp.

## Phát hiện an ninh (thật, đã kiểm)

Thăm dò X1 ngày 2026-10-20 từ một worker `claude` bị bwrap bao bọc, chỉ đọc: worker đọc được `.fgos/secrets.local.env`, `~/.pi/accounts/openrouter/auth.json` và `~/.zshrc`, và môi trường của nó có `GLM_OPENROUTER_API_KEY` (đi từ shell cha, nhiều khả năng do hook zsh xuất biến). Chi tiết trong `docs/platform/secrets/spec.md` mục 17. Nó áp dụng cho mọi máy dùng hook zsh nạp `.fgos/secrets.local.env`.

Khuyến nghị cho mỗi máy (việc của người dùng, chưa tự động hoá): đừng xuất khóa vào shell tương tác, xoay mọi khóa từng nằm thô trong profile shell, và dùng khóa riêng có hạn mức chi cho từng nhà cung cấp.

## Còn mở

- Dạng địa chỉ session, V-011, bên dùng đầu tiên của mailbox, quyết định hai nhánh của hội đồng (ngữ nghĩa Stop với tin `wake:false`, lát đầu là gì): chờ owner.
- Cầu nối Node sang Rust cho `secrets`: khuyến nghị host verb, chưa kiểm lại.
- Sửa định nghĩa workflow `architecture-advisory` để chỉ dẫn theo vai: chưa có item, gắn vào lane Seat Binding.

## Kết quả kiểm tra trước khi đẩy (2026-10-20)

- `cargo build --locked --release --workspace` sạch với crate `fgos-secrets` mới; test của crate 12/12; `test/architecture.test.mjs` 29/29.
- `npm test` trên main đã trộn: 8666 test, sau khi build release còn **6 test đỏ**. Cả 6 cũng đỏ y hệt trên origin chưa có thay đổi của phiên này (worktree tạm, cài gói ngoại tuyến): `test/setup/run-supervisor-checks.test.mjs` 4 test (đường dẫn thư mục tạm vượt giới hạn 100 byte của tên socket), `test/holder-lock/fences-v1-tombstone.test.mjs` 1 test (`Cannot find package 'yaml'`), `test/runner/spawn-worker.test.mjs` 1 test (`tier-cell-missing`, có thể thuộc nhóm test cấu hình MP-B1 đang sửa; chưa xác nhận). Không phải lỗi của thay đổi này.
- Worktree mới chưa build release sẽ đỏ thêm khoảng 70 test (`fgctl-*`, fences, `release-tree`) với thông báo "Compiled native addon not found": chạy `cargo build --locked --release --workspace` trước khi chạy `npm test`.
- Bộ chạy test báo "leaked unexpected files into .fgos store" khi có một worker khác đang chạy trong cùng kho `.fgos`; chạy lại khi máy yên.

## Làm theo trên máy khác: gỡ hook nạp bí mật vào shell (đã làm xong trên máy phiên này)

Hook trong `~/.zshrc` và `~/.bashrc` (khối giữa `# >>> fgos project secrets` và `# <<< fgos project secrets`) xuất mọi biến của `.fgos/secrets.local.env` vào môi trường shell, nên mọi tiến trình con, kể cả công cụ Bash của agent và worker, đều thừa kế khóa. Thăm dò X1 xác nhận worker thấy biến đó. Gỡ nó trên máy nào còn dùng, theo thứ tự này:

1. **Kiểm không ai còn cần biến trong môi trường.** `grep -rn "GLM_OPENROUTER_API_KEY\|OPENROUTER_API_KEY" .fgos/config.json ~/.fgos/config.json` phải rỗng (cấu hình đọc khóa từ login store, không từ biến). Liệt kê `.fgos/secrets.local.env` của mọi dự án trên máy, chỉ xem tên biến, không xem giá trị; nếu dự án nào có biến khác và cấu hình của nó tham chiếu `${TÊN}` thì giữ hook cho tới khi chuyển xong.
2. **Bảo đảm login store có khóa.** `PI_CODING_AGENT_DIR=~/.pi/accounts/openrouter pi auth check --provider openrouter --json` phải trả `ready`. Nếu `not_ready`: tạo `auth.json` kiểu `api_key` cho tài khoản đó (xem phần trên) và thêm `auth.json` vào `files` của tài khoản `openrouter` trong `~/.fgos/config.json`; chưa làm thì gỡ hook sẽ làm ghế deepseek và glm mất khóa.
3. **Lưu khối sắp gỡ để khôi phục được, rồi gỡ.** Khối không chứa khóa. Lưu bằng `sed -n '/# >>> fgos project secrets/,/# <<< fgos project secrets/p'` vào một file quyền 0600, rồi `sed -i '/# >>> fgos project secrets/,/# <<< fgos project secrets/d'` trên từng file. Chạy `zsh -n ~/.zshrc` và `bash -n ~/.bashrc`.
4. **Kiểm.** Từ shell tương tác mới, gỡ biến cũ khỏi môi trường thừa kế (`env -u ... zsh -ic ...`), vào thư mục dự án: không biến khóa nào được đặt; rồi `fgos dispatch probe-account --provider deepseek --account openrouter` và `--provider z-ai --account openrouter` phải `healthy`.
5. **Đổi tên biến trong file bí mật (tạm, giữ giá trị):** `GLM_OPENROUTER_API_KEY` thành `OPENROUTER_API_KEY`. Kiểm giá trị không đổi bằng cách so băm, không in ra. Không xoay khóa trong đợt này.

Chưa giải quyết bằng cách này: worker bị nhốt vẫn đọc được file bí mật và `auth.json` (chờ quy tắc ẩn đường dẫn trong confinement), khóa nằm ở hai nơi (file bí mật và `auth.json`) nên xoay khóa phải sửa cả hai, và khóa thô còn nằm trong hàm `glm2` của `~/.zshrc` (việc của chủ máy).
