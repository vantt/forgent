# Hướng dẫn: kích hoạt bản phát hành packaging trên máy owner, fg-server và fg-server2

Dành cho: anh (owner). Người viết: HARDEN (packaging P13). Trạng thái: **đề xuất, chờ anh áp dụng**. HARDEN không tự sửa tệp cấu hình nào của anh (`~/.fgos/config.*`, `~/.fgos/private/*`). Mọi lệnh dưới đây đã chạy thử trong HOME tạm trên fg-server2; chỗ nào chưa chạy thử thì có ghi rõ.

## 1. Thứ tự

1. **Ba máy cùng nâng một đợt:** fg-server2, fg-server và máy của anh. Đừng để một máy chạy bản mới còn máy kia chạy bản cũ lâu.
2. **Trên mỗi máy, nâng mọi dự án cùng lúc.** Khi nâng, `fgos init` chuyển `~/.fgos/config.json` sang `config.yaml` (token gateway được giữ). Từ lúc đó, dự án nào còn chạy `v0.2.0-rc.5` (hoặc cũ hơn) sẽ từ chối chạy cho tới khi được nâng. Liệt kê dự án trước khi bắt đầu: `find ~ -maxdepth 6 -path '*/.fgos/installation/activation.json'`.
3. **Mỗi máy làm đủ mục 2 trước, rồi mới kích hoạt (mục 3).** Khai báo trước thì không có khoảng trống.

## 2. Việc làm trước khi kích hoạt (mỗi máy một lần)

| # | Việc | fg-server2 | fg-server | máy anh |
|---|---|---|---|---|
| a | Rust 1.99.0 (chỉ máy build từ source) | chưa đo | chưa đo | chưa đo |
| b | Login claude riêng và khối tài khoản `claude` | đã có | cần làm | cần làm |
| c | Sáu ô `thehive` trong `~/.fgos/config.yaml` | chưa có (đã kiểm: tệp chưa có khối `modelPolicies`) | cần làm | cần làm |
| d | Các dòng kỹ năng cook | đã có (sáu executor) | cần làm | cần làm |

"Chưa đo" nghĩa là HARDEN chưa kiểm trên máy đó; fg-server2 ghi theo tệp thật đã đọc.

### a. Rust 1.99.0

Kho đã ghim compiler: `rust-toolchain.toml` ghi `1.99.0` (kèm clippy và rustfmt) và workspace khai `rust-version = "1.99"`. Lần `cargo build` hoặc `cargo test` đầu tiên trong kho sẽ tải 1.99.0 qua `rustup` (cần rustup 1.28 trở lên). Máy không có rustup, hoặc chỉ có cargo của distro cũ hơn 1.99, thì không build được từ source nữa; cài rustup trước. Muốn kiểm tra chéo cho Windows và macOS thì thêm target một lần: `rustup target add x86_64-pc-windows-msvc aarch64-apple-darwin`. Nâng ghim sau này: sửa `channel` và `rust-version` cùng lúc. Người dùng chỉ cài bản phát hành thì không cần Rust.

### b. Login claude riêng (chỉ nêu dạng, không dán bí mật)

Seat claude chạy trong sandbox cần một login riêng của fgOS, không dùng `~/.claude`.

- Thư mục login: `~/.fgos/private/claude-login` (tạo `mkdir -m 700`, đăng nhập bằng `CLAUDE_CONFIG_DIR=~/.fgos/private/claude-login claude /login`).
- Khối tài khoản trong `~/.fgos/private/accounts.yaml`: `runner.providers.claude.accounts.main` gồm `label`, và `credentialSources.claude` kiểu `home-files` trỏ `home` vào thư mục trên với `files: [".credentials.json"]`.
- Máy nào có CLI `claude` mà thiếu hai thứ này thì `fgctl init` kết thúc với danh sách "1 check needs you" nêu `confined-pane-accounts`.
- Máy không cài `claude` thì bỏ qua mục này.

Chi tiết từng lệnh: `plans/reports/guide-261112-1032-declare-claude-seat-store.md`.

### c. Sáu ô `thehive` trong tệp toàn cục

Bản chuẩn không còn pool `thehive`. Mỗi máy của anh khai lại một lần trong `~/.fgos/config.yaml` (sửa tay; gộp vào khối `runner.modelPolicies` nếu đã có):

```yaml
runner:
  modelPolicies:
    z-ai:
      nano: ["thehive/zai-org/glm-5.3-flash@thehive", "z-ai/glm-5.3-flash@openrouter"]
      standard: ["thehive/zai-org/glm-5.3-flash@thehive", "z-ai/glm-5.3-flash@openrouter"]
      mini: ["thehive/zai-org/glm-5.3-flash@thehive", "z-ai/glm-5.3-flash@openrouter"]
    deepseek:
      nano: ["thehive/deepseek-ai/deepseek-v4.1-flash-1017@thehive", "deepseek/deepseek-v4.1-flash@openrouter"]
      standard: ["thehive/deepseek-ai/deepseek-v4.1-flash-1017@thehive", "deepseek/deepseek-v4.1-flash@openrouter"]
      mini: ["thehive/deepseek-ai/deepseek-v4.1-flash-1017@thehive", "deepseek/deepseek-v4.1-flash@openrouter"]
```

Kiểm: `fgos config check` không có `fail`; `fgos dispatch explain --for execute` giống trước khi kích hoạt. Chi tiết và cách gỡ ô tạm trong tệp dự án: `plans/reports/guide-261112-0755-declare-agent-routing-in-machine-config.md`.

### d. Các dòng kỹ năng cook

Bản chuẩn không còn khai `ak:cook`. Trong `~/.fgos/config.yaml`, mỗi executor anh dùng cần:

```yaml
runner:
  executors:
    claude:
      supports:
        skills: ["ak:cook"]
```

(lặp lại cho `glm`, `openai`, `gemini`, `xai`, `deepseek`; gộp vào khối `runner:` đã có). Thiếu thì Unit nêu `ak:cook` bị từ chối `skills-unavailable`. Chi tiết: `plans/reports/guide-261109-1837-declare-cook-skill-in-machine-config.md`.

## 3. Kích hoạt

Trong từng dự án trên máy (cùng một đợt, mục 1):

```sh
cd <dự án>
FGCTL_VERSION=<tag> fgctl upgrade     # bản pre-release phải nêu tag; bản chính thức bỏ FGCTL_VERSION
fgctl verify
fgos --version
fgos doctor                           # ok: true
```

`fgctl upgrade` tải bản phát hành, kiểm với `SHA256SUMS`, chuyển activation, ghi pin mới vào `.fgos/distribution.json`, rồi tự thay `fgctl` của máy bằng bản đi kèm (bản cũ giữ ở `<đường dẫn>.prev`). Dự án nào commit pin (như repo này) thì commit `.fgos/distribution.json` đã đổi. Nếu `fgctl` của máy quá cũ (không có `--version`), chạy lại `install.sh` của bản mới trước.

Kiểm định tuyến không đổi (trước và sau, cùng dự án): `fgos dispatch explain --for execute` và `--for review`, so `executor`, `model`, `tier`.

Chạy thật một lần: `fgos run "Reply with exactly the word OK" --json </dev/null`.

## 4. Người dùng sẽ thấy gì

- **Cài:** `install.sh` có `--help`, nhận `--version <tag>` (có hoặc không có `v`), in hai bước tiếp: `fgctl init` rồi `fgos run "<prompt>"`.
- **Khối `Ready`:** `fgctl init`, `upgrade`, `repair` kết thúc bằng
  ```
  Ready: fgOS <tag> active (<12 ký tự của digest>)
  Next: fgos run "<prompt>"
  ```
  Chạy lại khi không có gì đổi: `nothing to do: fgOS <tag> already active, doctor ok` (khoảng 4 giây thay vì 9).
- **Dòng `Note:`** khi lần nâng vừa chuyển config cũ: `Note: ~/.fgos/config.json moved; projects on an older release refuse until `fgctl upgrade``. Đó là lý do mục 1.2.
- **Chưa đạt thì có danh sách:** `N checks need you:` rồi từng dòng `<id>: <lệnh sửa>`; thoát mã 2. Bản vẫn được kích hoạt.
- **Mã thoát:** `fgctl`: 0 xong, 1 lỗi, 2 sai cú pháp **hoặc** chưa sẵn sàng sau init, 4 pin hỏng. `fgos`: sai cú pháp là 4 (giữ nguyên, đã ghi là ngoại lệ); `fgos doctor` luôn 0, `--strict` thì 1 khi còn check hỏng.
- **Không có CLI agent nào:** `fgos run` thoát mã 4 `agent-cli-missing`, nêu claude, codex, omp, pi và cách sửa.
- **Gỡ cài:** `fgctl uninstall` in kế hoạch trước (`--dry-run` chỉ in); `--yes` áp dụng: gỡ hook, skill sinh ra, git hook, timer mailbox của dự án, rồi `.fgos/installation` (có sao lưu `.pre-uninstall-<giờ>` và `.fgos/uninstall-backup-<giờ>/`). Giữ lại config, dữ liệu `.fgos` và `distribution.json`. `--purge` gỡ thêm các bản trong kho release của máy (không đụng `identity`, `locks`). Binary `fgctl`, launcher `fgos` và cấu hình agent toàn cục do `fgos wire-agents` ghi chỉ được nêu tên, anh tự gỡ.
- **Pin lệch:** khi bản đang chạy khác bản pin ghi, `fgctl status`, `fgctl verify` và dòng doctor `activation-matches-pin` in `active <d12> != pin <d12> (override: <lý do hoặc none>)`. Chỉ cảnh báo. Pin chỉ dạng digest mà máy chưa có bản đó thì lỗi nêu ba lối ra (`--from`, `FGCTL_VERSION=<tag>`, `--override-pin`).

## 5. Quay lại

**Sự thật cần biết trước:** `fgctl` mới **từ chối kích hoạt `v0.2.0-rc.5`** (và mọi bản trước khi có addon Git): `fgctl repair` và `fgctl init --override-pin` đều báo `git-addon-missing: linux-x64 requires components.nativeAddon with git-wal-v1`. Đã có dòng backlog `p-yfpixqfmdq` để anh quyết định có nên đổi không. Vì vậy có hai đường:

### A. Về bản máy chạy ngay trước đợt này (bản main-build có addon)

```sh
cd <dự án>
fgctl repair        # kích hoạt lại bản trước (previousArtifactDigest)
fgctl verify
fgos version        # bản cũ có thể chưa có --version
fgos doctor
```

Config không phải đưa lại: máy đã dùng `config.yaml`. Đi tiếp lại: `FGCTL_VERSION=<tag> fgctl upgrade`. Đã chạy thử đủ chuỗi này (mục 6).

### B. Về `v0.2.0-rc.5` (dự án phải quay lại bản JSON)

Chỉ dùng khi thật sự phải về rc.5. Dùng `fgctl` của rc.5, và đưa config đã chuyển về chỗ cũ (lần nâng đã sao lưu sẵn):

```sh
# 1. fgctl của rc.5 (trình cài của rc.5)
curl -fsSL https://github.com/vantt/forgent/releases/download/v0.2.0-rc.5/install.sh | FGCTL_VERSION=v0.2.0-rc.5 sh
# 2. đưa config JSON về, cất config.yaml do lần nâng viết ra
B=$(grep -l '"token"' ~/.fgos/private/config-migrate/*-config.json | head -1)   # bản sao có gateway.token
mv ~/.fgos/config.yaml ~/.fgos/config.yaml.pre-rollback
cp -p "$B" ~/.fgos/config.json && chmod 600 ~/.fgos/config.json
cd <dự án>
P=$(ls .fgos/runtime/config-migrate/*-config.json | head -1)
mv .fgos/config.yaml .fgos/config.yaml.pre-rollback
cp -p "$P" .fgos/config.json
# 3. kích hoạt lại rc.5 và kiểm
fgctl repair
fgctl verify
fgos version        # rc.5 không có --version
fgos doctor
```

Đi tiếp lại: cài `fgctl` của bản mới (`install.sh` của bản mới) rồi `FGCTL_VERSION=<tag> fgctl upgrade` trong từng dự án; lần nâng chuyển config lần nữa. Nếu quên cất hai tệp `config.yaml` ở bước 2, bước đi tiếp báo `config-legacy-shadowed` (cả hai tệp cùng tồn tại); cất chúng đi rồi chạy lại.

Sau khi về rc.5, `fgos doctor` của rc.5 vẫn đỏ vài dòng (12 dòng trên máy thử): đó là mức nền của chính rc.5, giống hệt rc.5 vừa cài xong, không phải do việc quay lại.

Về cấu hình định tuyến khi quay lại bản trước ngày 2026-11-12: gỡ sáu ô `thehive` khỏi `~/.fgos/config.yaml` trước, theo hướng dẫn `guide-261112-0755` mục "Hoàn tác".

## 6. Kết quả chạy thử

Chạy ngày 2026-11-12 trên fg-server2, trong HOME tạm (HOME, mọi `XDG_*`, `TMPDIR` chuyển hướng, `PATH` không có `~/.local/bin` thật, thư mục nằm trên ext4), bản phát hành dựng từ main `e182dec72`, dự án git rỗng. Nhật ký: `/dev/shm/p13-final-*.log`. Tệp thật của anh (`~/.local/bin`, `~/.claude`, `~/.fgos`, kho release) chỉ được đọc.

| Bước | Kết quả |
|---|---|
| `install.sh`, `fgctl init` (máy không có CLI agent) | `Ready: fgOS <tag> active (ba3342e2ecbb)`, thoát 0. `fgctl init` không có `--yes`. |
| `fgos doctor` | `ok: true`, 110 dòng, 0 hỏng, 7 cảnh báo; `--strict` thoát 0. |
| `fgos run ... --json` khi không có CLI agent | thoát 4, `agent-cli-missing` kèm cách sửa. |
| Quay về `v0.2.0-rc.5` bằng `fgctl repair` của bản mới | **bị từ chối**: `git-addon-missing` (cả `init --override-pin` cũng vậy). |
| Quay về rc.5 bằng đường B (rc.5 `install.sh`, trả config, `fgctl repair`) | thoát 0; rc.5 chạy; `fgos version` và `fgos doctor` chạy, doctor đỏ đúng 12 dòng như rc.5 mới cài. |
| Đi tiếp lại bản mới sau đường B | thoát 0, `fgctl verify` ok, `fgos --version` ok, doctor `ok: true`. |
| Về bản main-build trước (đường A) rồi đi tiếp | `fgctl repair` thoát 0 (kèm danh sách check của bản cũ), `fgctl verify` ok, đi tiếp ok. |

**Chưa chạy được:** một câu trả lời thật từ agent (`fgos run "Reply with exactly the word OK" --json` ở tầng rẻ nhất) trong HOME tạm. Chạy pi/deepseek thật tới được nhà cung cấp nhưng tài khoản OpenRouter báo hết credit (402); seat omp/gemini cần đúng cách bố trí HOME thật của máy và login có thể tự gia hạn, nên HARDEN không chép login của anh vào HOME tạm. Bước này anh (hoặc COOK) chạy một lần ngay sau khi kích hoạt, theo mục 3, trên máy đã có tài khoản.
