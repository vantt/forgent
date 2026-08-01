# Cài đặt / Setup / Doctor của fgOS — tầm nhìn nền tảng

**Trạng thái:** TẦM NHÌN / ĐỊNH HƯỚNG — chưa khoá thành luật (platform-foundations)
hay spec đầy đủ; nhiều điểm còn là câu hỏi mở kiến trúc. **Ngày:** 2026-08-01.
**Nguồn:** định hướng của chủ sản phẩm.

Tài liệu này ghi lại tầm nhìn cho mảng cài đặt/setup/doctor để không mất, và
làm khung cho backlog kế tiếp của mảng này. Nó mở rộng — không thay — spec
hiện có: `docs/specs/distribution.md` (area: distribution) và
`docs/coexistence.md` (doctrine chạy cạnh harness khác). Một số điểm dưới đây
**đảo ngược** một quyết định đã chốt trong distribution.md (nêu rõ ở §3).

## 1. Vì sao

fgOS đang được dogfood ngay trên chính repo tạo ra nó. Muốn tái sử dụng fgOS ở
project/máy khác (và cho người khác cài), đường cài đặt/setup/doctor phải
**ổn định** trước — không phải một tiện ích phụ, mà là hạ tầng nền cho việc
mảng còn lại của sản phẩm có tái dùng được hay không.

## 2. Bảy trụ cột của tầm nhìn

1. **Cài đặt không cần clone.** Người dùng lấy được `fgos`/`fgos-runner` mà
   không cần tự tay `git clone` repo nguồn trước.
2. **Hai cấp cài đặt: global hoặc project.** Cả hai cấp đều là cách cài hợp
   lệ, không cấp nào là "chính", cấp nào là "phụ".
3. **`setup`/`doctor` luôn tự sửa được mọi thứ cần để fgOS chạy tốt** —
   upgrade/update bản đã cài, init mới, VÀ fix mọi hạ tầng cần thiết + merge
   cấu hình mới vào cấu hình đã có + điền cấu hình còn thiếu. Không dừng ở
   "báo cáo rồi im" — phải tự sửa được, không chỉ chẩn đoán.
4. **Setup/config phải mở được cho module mới.** Bất kỳ chức năng/module mới
   nào cũng có đường chính thức để đăng ký thêm năng lực cấu hình của nó vào
   `setup`/`doctor` tổng — không phải mỗi module tự vá tay một chỗ riêng.
5. **Mọi thay đổi mới đều phải tự hỏi: có đụng cấu hình/config không? có cần
   hạ tầng đặc biệt nào cần setup hỗ trợ không?** Đây là một câu hỏi bắt buộc
   cho MỌI công việc trong project này, không riêng việc thuộc mảng
   cài đặt — xem §5 (gate áp dụng toàn project).
6. **Global và project không xung đột.** fgOS luôn nhận biết (aware) được cả
   hai cấp đang tồn tại; nếu project có cài fgOS riêng thì bộ ở project được
   ưu tiên vận hành, không có thì rơi về global; **cấu hình của project luôn
   ghi đè (overwrite) cấu hình global** — không phải hợp nhất mù hai bên.
7. **CI/GitHub CI workflow là một phần của bộ setup.** CI giúp fgOS ổn định +
   sẵn sàng ngay khi cài, giảm bớt việc phải tự dò các ràng buộc môi trường
   ngay tại máy người dùng — kiểm trước ở CI thay vì để người dùng tự đụng.

## 3. Đối chiếu với quyết định đã chốt (distribution.md)

- **RUL11 (distribution.md) nói `fgos doctor --fix` chưa tồn tại, là
  "Deferred Idea có chủ đích", không phải gap.** Trụ cột 3 ở trên **đảo
  quyết định này** — chủ sản phẩm giờ muốn `doctor`/`setup` tự fix, không
  còn hoãn. Khi mảng này được thi công thật, RUL11 phải được sửa/supersede
  trong distribution.md (không sửa tại chỗ mà không ghi rõ lý do đảo).
- **Data Dictionary #7 (distribution.md)** liệt kê đúng 3 check cố định
  (`node-and-git`, `shell-integration-sourced`, `config-not-stale`) trong
  `src/setup/checks.mjs`. Trụ cột 4 đòi hỏi danh sách này trở thành
  **mở-rộng-được** (registry mà module khác tự thêm entry), không còn là
  literal 3 dòng cố định.
- **Trụ cột 6 (global vs project, không xung đột, project ghi đè global)**
  là khái niệm CHƯA có trong distribution.md lẫn coexistence.md hôm nay —
  cả hai tài liệu đó nói về "cài global hay project-local" (per install
  flags của người dùng, RUL không phân biệt hai cấp cùng tồn tại) và về
  "không giao thoa với harness KHÁC" (một công cụ điều phối khác, không phải
  hai bản fgOS). Đây là một khái niệm kiến trúc mới, chưa thiết kế.
- **Trụ cột 7 (CI như một phần của setup)** — repo hiện **chưa có
  `.github/workflows/`** nào; `test/install-packaging.test.mjs` là proof
  cục bộ duy nhất. CI thật (matrix OS/package-manager) là backlog mới.
- **Trụ cột 1 (không cần clone) và 2 (global/project)** phần lớn đã có sẵn
  qua `npm install -g github:vantt/forgent` (không đòi clone tay, install
  flags của người dùng tự chọn global/project) — coi như baseline đã đạt,
  chưa cần việc mới trừ khi có yêu cầu thêm đường cài khác (vd script cài
  một dòng, `npx`).

## 4. Gate áp dụng toàn project (trụ cột 5)

Từ tầm nhìn này, `AGENTS.md` được bổ sung một gate ngắn: mọi việc (không chỉ
việc thuộc mảng distribution) đều tự hỏi có đụng config/cấu hình hay cần hạ
tầng setup riêng hay không trước khi coi là xong — xem `AGENTS.md`
`## Install/setup/doctor gate`.

## 5. Câu hỏi mở (chưa quyết — cần chốt khi tới lượt thi công)

1. **Hình dạng "registry mở-rộng-được" cho doctor checks/config defaults**
   (trụ cột 4): mỗi module tự khai một entry (check function + config default
   shape) rồi `checks.mjs`/`config-merge.mjs` chỉ duyệt qua registry đó? Hay
   một cơ chế khác (vd manifest file như `docs/architecture-manifest.json`)?
2. **Cơ chế "project ghi đè global"** (trụ cột 6): fgOS đọc config global ở
   đâu (`~/.fgos/config.json`? biến môi trường?) trước khi merge với config
   project? Việc "aware" hai cấp cùng tồn tại có cần một check `doctor` mới
   không?
3. **`doctor --fix` làm được tới đâu** (trụ cột 3): fix mọi thứ `doctor`
   phát hiện, hay giới hạn một danh sách named-fixable ban đầu rồi mở rộng
   dần? (liên quan trực tiếp `tsk-2qz` — xem §6)
4. **CI workflow (trụ cột 7) kiểm gì**: chỉ chạy lại
   `test/install-packaging.test.mjs` trên matrix OS/package-manager, hay còn
   thêm kiểm khác (vd doctor chạy sạch trên máy CI mới tinh)?

## 6. Backlog liên quan

- `tsk-2qz` (fgOS work item, stage `clarify`, todo) — thêm khả năng `fgos
  doctor` tự fix `.fgos/gate-bypass.json`; đây là **slice đầu tiên** của trụ
  cột 3, không phải toàn bộ trụ cột.
- `tsk-2cs` (stage `clarify`, todo) — registry mở-rộng-được cho
  doctor-checks + config-defaults (trụ cột 4).
- `tsk-2ta` (stage `clarify`, todo) — global/project config precedence +
  awareness (trụ cột 6).
- `tsk-49r` (stage `clarify`, todo) — CI/GitHub Actions workflow như một
  phần của setup (trụ cột 7).
