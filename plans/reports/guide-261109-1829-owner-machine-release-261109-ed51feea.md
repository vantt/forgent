# Hướng dẫn cho máy owner và fg-server: nâng lên release `ed51feea`

Hướng dẫn này cho máy owner và fg-server (forgentX). fg-server2 đã nâng xong và chạy release này trên checkout chính.

- Release mới: `sha256:ed51feeafded2708622df5e05ed52ad471acce0f50d7ed6793d50ac2d410dc9d`, cắt từ main `400047130`.
- Release trước (để quay lại): `sha256:cbae6142b0d1ff0070fe5ba0e322748e266eaa72a0a116fdc288402fbeff952f`. Cả hai nằm trong kho release của fg-server2; máy khác tự build và stage release của mình từ main, nên chỉ coi là cùng release khi digest khớp hai id trên.
- Quy trình cài và nâng cấp chuẩn: [`docs/how-to/install-fgos-in-a-project-and-use-doctor.md`](../../docs/how-to/install-fgos-in-a-project-and-use-doctor.md) (mục 2.1 là bảng lệnh `fgctl`) và phần build, stage của [`docs/how-to/measure-a-real-case.md`](../../docs/how-to/measure-a-real-case.md#5-staging--verifying-the-host-runtime). Hướng dẫn này không chép lại các lệnh đó.

## Người dùng thấy gì thay đổi

1. **Sửa bảo mật cho shim.** Lệnh `fgos` trên `PATH` (`~/.local/bin/fgos`, do `fgos doctor --fix` ghi) không còn chạy `.fgos/installation/bin/fgos` nằm trong dự án, thứ mà một repo được clone có thể commit kèm quyền chạy. Nó đọc `status` và `artifactDigest` của activation rồi chạy đúng release đã stage trên máy.
2. **Sửa bảo mật cho bước đi tìm gốc dự án.** Với `friction`, `metrics`, `convention` và `config`, host dừng lại dưới thư mục home, nên `~/.fgos` (thư mục toàn cục) không bao giờ bị coi là một dự án. Ngoài dự án, hoặc khi `--dir` trỏ vào thư mục home, các lệnh này báo rõ thay vì ghi vào `~/.fgos`.
3. **`fgos wire-agents` là lệnh tuỳ chọn mới.** `fgctl init`, `fgos setup` và `fgos doctor --fix` không còn ghi cấu hình agent của bạn (`~/.gemini/...`, cài đặt người dùng của Claude, cài plugin Claude Code). Việc cài plugin nay do `fgos wire-agents` làm: chỉ đụng agent CLI tìm thấy trên máy, in từng file sẽ đổi, và với `--yes` sao lưu mỗi file thành `<file>.pre-wire-agents-<giờ>` trước. Nó không bao giờ tự đặt quyền làm agent mạnh hơn; nó chỉ ra file, giá trị, lý do để bạn quyết. Các dòng doctor `claude-plugin-marketplace` và `agy-permissions-configured` giờ chỉ cảnh báo, không có `--fix`. File đã ghi từ trước giữ nguyên.
4. **Tầng skill và domain (T8).** `fgos setup` và render chỉ ghi tên skill do fgOS sở hữu, nên `ak-*` không còn bị viết lại; từ chối thư mục trùng tên không có dấu generated và mọi symbolic link trong đường dẫn skill; wrapper `.claude/skills/<tên>` chỉ còn `SKILL.md`; worktree mới nhận mọi thư mục skill git-ignore của checkout chính; doctrine domain đọc từ payload đang chạy. Chi tiết từng phase: [`guide-261109-1324-owner-machine-harden-t8-skill-domain.md`](guide-261109-1324-owner-machine-harden-t8-skill-domain.md).
5. **Kết quả `fgos doctor --json` có hình dạng mới.** Mỗi dòng có `status` (`ok`, `warn`, `fail`, `skip`) và, khi hỏng, `fix` (lệnh sửa, hoặc `null` khi chỉ người sửa được). Mức trên cùng có `ok` (không dòng nào hỏng) và `next[]` (lệnh sửa của các dòng hỏng, mỗi lệnh một lần). Script đọc `passed` cũ vẫn chạy.
6. **Trình cài từ chối http thường.** `install.sh`, `install.ps1` và `fgctl init`/`fgctl upgrade` từ chối tải qua `http://`, trừ máy nội bộ (loopback), kể cả sau chuyển hướng; từ chối file vượt giới hạn kích thước.
7. **Host nhanh hơn.** Mỗi lệnh `fgos` chạy qua Node nhanh hơn khoảng 19 ms: host không băm lại chính binary của nó và đọc addon một lần thay vì hai. Một byte đổi ở bất kỳ file nào khác của release, addon cũng vậy, vẫn bị từ chối.
8. **`fgctl` mới.** `fgctl --version` và `--help` cho mọi lệnh (thoát mã 0). `fgctl upgrade` tự thay `fgctl` đang chạy bằng bản đi kèm release khi byte khác nhau, giữ bản cũ thành `<đường dẫn>.prev`.

## Làm một lần trên mỗi máy

1. **Kéo main.** Máy có sửa cục bộ `.fgos/config.yaml`, hoặc khối AgentKit trong `AGENTS.md` và `.claude/settings.json`: lưu bản vá của chúng, `git checkout` các file đó, `git pull --rebase --autostash`, áp lại. Không dùng `git reset`, không `git clean`. Sau đó kiểm tra các dòng cục bộ vẫn còn bằng `git diff --stat .fgos/config.yaml`. Trên fg-server2 các dòng cục bộ của config đã nằm trên main nên diff rỗng là bình thường.
2. **Cập nhật `fgctl`.** Cách chuẩn là `fgctl upgrade` ở bước 3, vì nó tự thay `fgctl` (bản cũ thành `.prev`). Nếu `fgctl` đang cài chưa có hành vi đó (không trả lời `fgctl --version`), build bản mới (`cargo build --release -p fgctl`), sao lưu `~/.local/bin/fgctl` thành `~/.local/bin/fgctl.bak-261109`, rồi cài bản mới với quyền 755. Kiểm tra bằng `fgctl --version` và `fgctl verify </dev/null`; chỉ xoá bản sao lưu cũ hơn sau khi cả hai đạt.
3. **Build, stage và kích hoạt `ed51feea`.** Theo mục 5 của `measure-a-real-case.md` (build, `fgctl stage --from <cây release>`, `fgctl upgrade --from <cây release>`). Sau đó `fgctl status` phải hiện `activeArtifactDigest: sha256:ed51feea...` và `previousArtifactDigest: sha256:cbae6142...`; nếu digest khác thì dừng và báo, đừng kích hoạt tiếp.
4. **Kiểm tra bằng doctor.** Chạy `fgos doctor </dev/null` (chẩn đoán, không ghi gì), rồi `fgos doctor --json </dev/null`: đọc `ok` và `next[]`.
5. **Doctor `--fix`, chỉ khi `next[]` có lệnh.** `fgos doctor --fix </dev/null` chạy mọi bản sửa đã đăng ký, không chỉ bản của dòng hỏng; chúng chỉ ghi trong dự án và `~/.fgos` (launcher, hook trong thư mục agent của dự án, thư mục khoá, bộ nhớ đệm tìm binary) và không còn ghi cấu hình agent toàn cục của bạn. Máy có `.claude/settings.json` chỉnh tay nên sao lưu file đó trước khi `--fix`.

## Doctor mong đợi

Trên fg-server2 sau khi nâng (checkout đã pull, chưa chạy `--fix`):

- `ok` là `false` vì hai dòng hỏng; cả hai không có `fix` (`next[]` rỗng), nên `--fix` không sửa được chúng:
  - `tool-registry-configured`: hai công cụ đã đăng ký nhưng chưa kiểm. Chạy `fgos tool check` rồi xem lại.
  - `work-step-vocabulary`: một việc mở (`tsk-5db`, domain `coding`) đang ở bước `clarify` mà domain không còn đăng ký. Không lệnh nào gắn lại nhãn bước; đẩy việc đó đi tiếp bằng một chuyển tiếp còn đăng ký, hoặc chuyển nó. Máy nào không có việc mở ở bước cũ sẽ không thấy dòng này.
- `active-release-matches-checkout` và `agent-claims-resolve` xanh khi đã pull đúng bản.
- Các dòng cảnh báo (`config-comment-migrated-why`, `executor-profile-warnings`, `credential-copies-retained`, `confinement-strict-readiness`, `llm-accounts-vs-legacy`) có từ trước và không chặn gì.
- `config-redundant-value` (`mailbox.enabled`) nêu `--fix` sửa được. Việc đó sửa `.fgos/config.yaml`, nên chỉ làm khi bạn chủ động chấp nhận.

## Quay lại

1. `fgctl repair` đưa dự án về release trước (activation ghi nó là `previousArtifactDigest`). Muốn chỉ định rõ `sha256:cbae6142b0d1ff0070fe5ba0e322748e266eaa72a0a116fdc288402fbeff952f` thì `fgctl upgrade --from <cây release cũ>` nếu máy đã stage nó. Chỉ `.fgos/installation/` và bản ghi activation đổi.
2. Chạy `fgctl verify` rồi `fgos doctor </dev/null`.
3. Quay lại `fgctl`: nếu `fgctl upgrade` đã giữ `.prev`, đổi tên `~/.local/bin/fgctl.prev` về `~/.local/bin/fgctl`; nếu cài tay thì dùng `~/.local/bin/fgctl.bak-261109`.
4. Mã trong checkout giữ nguyên khi quay lại release; chỉ muốn quay cả mã mới revert commit trên main.
