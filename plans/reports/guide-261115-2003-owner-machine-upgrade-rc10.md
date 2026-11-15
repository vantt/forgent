# Hướng dẫn: nâng ba máy từ v0.2.0-rc.9 lên v0.2.0-rc.10

Dành cho: anh (owner). Người viết: HARDEN. Trạng thái: **rc.10 đã phát hành; đã kích hoạt và chạy thử trên fg-server2 (2026-11-15); chưa áp dụng trên fg-server và máy của anh.**

Tag `v0.2.0-rc.10`, commit của tag: `e92f04cdf`. Trang phát hành: https://github.com/vantt/forgent/releases/tag/v0.2.0-rc.10 (7 asset; kiểm `SHA256SUMS`, `fgctl upgrade` tự kiểm).

Hướng dẫn này chỉ nói **phần khác so với rc.9**. Việc chuẩn bị trước khi kích hoạt (Rust 1.99.0, login claude, ô `thehive`, kỹ năng cook, `gateway.bind`) không đổi: xem `guide-261113-2007-owner-machine-upgrade-rc8.md` mục 2 và `guide-261115-0800-owner-machine-upgrade-rc9.md`. Không tự sửa tệp cấu hình nào của anh (`~/.fgos/`, `~/.fgos/private/`).

## 1. Cái gì đổi, nói với anh

Nguồn: `CHANGELOG.md`, mục `[v0.2.0-rc.10]`.

| Thay đổi | Ảnh hưởng tới anh |
|---|---|
| **Thêm nhiều lệnh chạy native trong host Rust, không còn tiến trình Node** | `fgos git status`, `fgos git recover`, `fgos lock fence`, `fgos lock-status`, `fgos events sync\|status\|seal\|export`, `fgos session start\|end\|list\|gc`, `fgos gateway start\|stop\|status`. Nhanh hơn rõ rệt: `lock-status` khoảng 160 ms (trước đó khoảng 2,7 s). Host Rust giờ giữ cửa vào cho mọi lệnh (kiểm root và store, tìm root, ghi nhật ký lỗi, đọc config, đọc tham số); verb lạ in ra danh sách verb theo thứ tự registry. Help của mọi verb do host trả lời. |
| **`--flag=value` bị từ chối ở mọi verb** | Phải viết `--flag giá-trị` (kể cả `--dir <đường-dẫn>`). Thông báo nêu tên cờ và bảo viết `--k <value>`. Script nào của anh còn dùng `--flag=value` phải đổi. Tám verb native cũ (config, convention, friction, gate-bypass, identity, mailbox, metrics, version) giờ in đúng văn bản "cờ lạ" của Node CLI, mất gợi ý "Did you mean --x?". Sai/thiếu sub-command hoặc `--flag=value` ở các verb mới thoát với mã 4 (và được ghi vào nhật ký lỗi gọi). |
| **`fgos lock fence` không có `--yes` thì từ chối** | Liệt kê các bên đang giữ khóa rồi thoát với `lock-fence-not-confirmed`, mã 2, kể cả trên terminal; câu hỏi `Stop these processes? [y/N]` đã bỏ. Muốn chặn thật phải chạy lại kèm `--yes`. |
| **`fgos lock-status`** | Không còn liệt kê vào mục "vấn đề" các tệp khóa có phần tên rỗng trong registry (ví dụ `merge-slot--.lock`). |
| **`fgos session` ngoài dự án bị từ chối** | Trước đây nó tạo một `.fgos` trong thư mục hiện tại; giờ từ chối và không tạo gì. Từ thư mục con hoặc worktree liên kết chưa có store thì dùng registry session của dự án. `sessions.json` ghi nguyên tử. `session end` và `session gc` chỉ xóa checkout nằm dưới thư mục sessions và thuộc dự án; `gc` giữ lại hàng mà Git không liệt kê là worktree và báo là bỏ qua. `merge`, `approve`, `return` cần host tìm được để liệt kê session. |
| **`fgos gateway`** | `gateway start` ngoài Unix bị từ chối kèm lời giải thích (vốn chưa từng chạy được). `stop` và `status` ngoài dự án không tạo gì; `stop` từ worktree liên kết trả `alreadyStopped` và không chạy niêm phong tắt. Sửa: `gateway start` không còn truyền cờ chống đệ quy của host cho gateway (trước đó các lệnh session của nó trả HTTP 500) và dựng gateway với `--locked`, nên không còn ghi lại `apps/fgos-gateway/Cargo.lock`. |
| **`fgos events`** | `status\|sync --remote`, `sync --no-push`, `export --stream` không kèm giá trị, `export --since` không phải JSON: từ chối mã 4 với thông báo rõ thay vì lỗi chuyển kiểu (mã 1). Publish một luồng mở bị hỏng giờ báo hỏng thay vì đi tiếp. |
| **`fgos git recover`** | Ngoài repo không còn in `--sha [object Object]` trong gợi ý bước sau. |
| **`fgos tool` bị bỏ** | `fgos tool query\|check` không còn; hỏi `fgos dispatch decide --for <capability> --json` (dò công cụ trực tiếp: present, stale hoặc missing). `.fgos/runtime/tool-status.local.json` không còn được ghi hay đọc, xóa được. Trên máy không có công cụ, `impact-analysis` là `unavailable`; `pane-labeling` là `in-process` nơi herdr có trên PATH. |
| **`dispatch decide` và Seat Binding** | `decide --for <purpose>` và Work nêu đúng executor mà Seat Binding sẽ chạy (hoặc `unavailable` kèm lý do), không còn lấy mục đầu của `prefer`. `prefer` đặt trên capability do công cụ phục vụ bị bỏ qua và doctor cảnh báo; `prefer` rỗng nghĩa là không có pool. Hook Agent/Task nói rõ decide trả `unavailable` và vì sao. Hàng doctor `tool-registry-configured` tính từ dò trực tiếp. |
| **Doctor và persona** | Doctor đếm định nghĩa agent theo đúng thứ tự tầng của persona (tầng đầu thắng): `domains/` riêng của dự án, thư mục `agents/` cũ và tệp `.yml` không còn được đếm. Dự án không có `core/agents` riêng nhận persona core đã cài trong prompt giao việc, không còn phần persona rỗng. |
| **Mailbox** | `fgos mailbox status` hiện số lần hook mailbox bỏ qua việc rút thư vì khóa mailbox bận (chỉ khi lớn hơn 0; thư để lại cho lần gọi sau). Có thể đếm thiếu khi hai lần bỏ qua đua nhau. |
| **YAML frontmatter** | Tài liệu có frontmatter không phải YAML hợp lệ được `fgos docs-index`, `authoritative-match`, `knowledge status` báo theo tên tệp, không còn coi là không có frontmatter. `metadata.version` không đặt trong ngoặc (ví dụ `1.10`) không còn che chắn skill khỏi bị `fgos setup` ghi đè; có cảnh báo nhắc đặt trong ngoặc. |
| **Executor `env:`** | Không còn truyền `PI_SESSION_FILE`, `PI_SESSION_ID`, `CODEX_THREAD_ID`, `CLAUDE_CODE_SESSION_ID` cho agent; mỗi lần thử có session riêng. |
| **Khác** | Thiếu `HOME` giờ là một lỗi duy nhất `config-io` / `HomeUnset` ("set HOME"), không còn lấy home từ passwd. Bỏ `scripts/knowledge-migration.mjs` và `scripts/knowledge-classifier.mjs` khỏi payload (đợt migrate một lần đã xong). Help qua `node bin/fgos.mjs` trực tiếp và shell-integration tầng 1 đến 3 cần host (bản kích hoạt hoặc `FGOS_HOST_BIN`); không có thì hàng doctor báo "fgos --help fails". |

## 2. Việc anh làm

1. Ba máy cùng nâng một đợt (fg-server2, fg-server, máy của anh), mỗi máy nâng mọi dự án: liệt kê bằng `find ~ -maxdepth 6 -path '*/.fgos/installation/activation.json'`.
2. Không có việc cấu hình bắt buộc mới. Rà script của anh: `--flag=value` đổi thành `--flag value`; `fgos lock fence` thêm `--yes` nếu muốn chạy không hỏi; `fgos tool ...` đổi thành `fgos dispatch decide --for <capability> --json`.
3. Kích hoạt, trong từng dự án:

```sh
cd <dự án>
FGCTL_VERSION=v0.2.0-rc.10 fgctl upgrade     # bản pre-release phải nêu tag
fgctl status                                  # activeArtifactDigest phải là bản rc.10
fgctl verify
fgos --version
fgos doctor --json
```

`fgctl upgrade` thay `fgctl` của cả máy bằng bản đi kèm rc.10 và giữ bản cũ ở `~/.local/bin/fgctl.prev`. Dự án commit pin (như repo này) thì commit `.fgos/distribution.json` đã đổi. Lệnh kết thúc bằng `Error: not ready: the checks listed above need you` (mã 2) khi doctor còn hàng cần anh xem; kích hoạt vẫn xảy ra, hãy đọc danh sách.

4. Chạy thử: `fgos lock-status`, `fgos session list` (cả hai native từ rc.10), rồi trên máy có tài khoản `fgos run "Reply with exactly the word OK" --json </dev/null`.

## 3. Quay lại rc.9

```sh
cd <dự án>
fgctl repair        # kích hoạt lại bản trước (previousArtifactDigest = rc.9)
fgctl verify
fgos doctor
```

Cấu hình không phải đưa lại. Lưu ý: `fgctl repair` không thay `fgctl` của máy (một binary cho cả máy); `fgctl` rc.10 vẫn chạy được rc.9. Nếu cần bản `fgctl` cũ, nó nằm ở `~/.local/bin/fgctl.prev`. Đi tiếp lại: `FGCTL_VERSION=v0.2.0-rc.10 fgctl upgrade`. Dự án commit pin thì nhớ trả `.fgos/distribution.json` về rc.9 khi lùi.

## 4. Kết quả chạy thử

**fg-server2, 2026-11-15** (dự án `forgent`, tài khoản thật), rc.9 lên rc.10:

- `FGCTL_VERSION=v0.2.0-rc.10 fgctl upgrade` tải và kiểm `fgos-v0.2.0-rc.10-x86_64-unknown-linux-gnu.tar.gz`, kích hoạt, thay `~/.local/bin/fgctl` (bản cũ ở `fgctl.prev`), rồi dừng ở mã 2 vì còn 4 hàng doctor cần xem (bên dưới).
- `fgctl status`: `activeArtifactDigest sha256:0a29e628daf8...`, `previousArtifactDigest sha256:43a0eaf1c866...` (rc.9). `fgctl verify`: `verified 0a29e628daf8`. `fgos --version`: `fgos 0.2.0`. Pin `.fgos/distribution.json` ghi `releaseVersion v0.2.0-rc.10`.
- `fgos doctor --json`: 98 ok, 8 warn, 4 fail. Bốn fail là: `tool-registry-configured` (1/2 công cụ có mặt, một công cụ thiếu; có từ trước), `work-step-vocabulary` (việc `tsk-5db` kẹt ở bước "clarify", có từ trước), `provider-capacity-state` (tài khoản `tetcu72` đang bị khóa hạn mức đến 01:24Z, có từ trước), `active-release-matches-checkout` (cây làm việc khác bản kích hoạt một tệp, `packages/git/contracts/mutation-census.v1.json`, vì main đã đi tiếp sau tag; không phải lỗi của release). Không hàng nào do rc.10.
- `fgos lock-status`: khóa main checkout `free`, không có bên giữ; `fgos session list`: danh sách rỗng, thoát 0.
- `fgos run "Reply with exactly the word OK" --json`: `outcome pass`, executor `deepseek` qua herdr, câu trả lời "OK".

fg-server và máy anh: chưa chạy.

## Câu hỏi còn mở cho anh

1. Có script nào của anh dùng `--flag=value`, `fgos tool`, hoặc `fgos lock fence` không `--yes` không? Chúng sẽ lỗi sau rc.10.
2. Có máy Windows nào trong đợt này không? (Windows chưa hỗ trợ Config và Event Store; chỉ cài và kích hoạt được; `gateway start` bị từ chối ngoài Unix.)
