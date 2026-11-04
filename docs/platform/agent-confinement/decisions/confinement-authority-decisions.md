# confinement authority decisions

```txt
Document type: Decision record
Audience: Maintainer, implementer, agent
Purpose: Define the stated scope and preserve its source provenance and limits
Design status: Accepted at atomic cutover
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/specs/confinement-authority.md at 947dc310396071a4d530216d5c06d05993d63bf5
Writer type: Agent draft writer
Canonical: Yes
Canonical for: The document scope stated above; source implementation limits remain explicit
Use this when: Reading or changing the stated scope and its contracts
Do not use this for: Standalone implemented-behavior proof or claims outside the stated scope
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- docs/platform/agent-confinement/spec.md
Supersedes: The mapped source location at atomic cutover
Superseded by: None
```

> Source carriage: Mapped subdivision and constitution kind placement. Original heading levels and numbers are retained. 
## 12. Quyết định của proposal

| Quyết định | Lý do |
|---|---|
| Một runtime authority door, sau khi có `runDir`, trước adapter | Đủ runtime data và adapter không bypass |
| Nhiều phase nội bộ không phải nhiều cửa | Tách pure logic/side effect nhưng chỉ một quyền execute |
| Policy diễn tả từng threat axis, không có boolean tổng quát | Chống overclaim và mở rộng không phá nghĩa cũ |
| Write exception là resource `run-output`, resolve runtime | Portable và hẹp đúng dispatch |
| `required` refuse; `preferred` mới degrade; `unconfined` explicit | Một contract đủ cho secure và portable workflow |
| Capability đặt minimum; executor tham chiếu một backend instance | Trách nhiệm rõ, không có thuật toán chọn backend ẩn |
| Machine registry khai instance + driver-specific deployment config, không chọn default | Customizable nhưng không tạo nguồn routing thứ hai |
| Backend không cover thì refuse/degrade theo mode, không auto-fallback | Không âm thầm đổi filesystem, credential hay network semantics |
| Driver assess; Authority decide/compile; driver prepare; run supervisor execute (từ khi mọi attempt chạy dưới supervisor, Authority không còn execute) | Mỗi quyết định chỉ có một owner |
| Provider normalizer phát resource binding chuẩn; backend provider-agnostic | Không giấu recipe thành nhánh provider trong driver |
| Observe-first khi rollout, enforcement là đích | Có evidence trước breaking change, không hạ mục tiêu |
| Detector độc lập và không tự nâng assurance | Tránh tự xác nhận vòng tròn |
| 2026-10-23: danh sách `MACHINE_PRIVATE_ROOTS` (mục đầu `{home}/.fgos/private`) che với mọi dispatch có mount view, bất kể `hostRead`; một danh sách, cơ chế `hidden-root`/`--tmpfs` sẵn có, không file mask; Secrets thêm đường dẫn của mình bằng cách thêm một mục và một case probe (§9.3). Chủ sở hữu giao hướng "D trước C" ngày 2026-10-23 | Config spec §9 và cổng G6 cần `~/.fgos/private` bị che với mọi worker, và Secrets câu hỏi 4 cần cùng một thứ cho đường dẫn bí mật; hai nhu cầu một danh sách, không có cơ chế thứ hai |
| 2026-10-24: thêm `{claudeSocketBase}/cc-socks` (control socket của phiên Claude Code) vào `MACHINE_PRIVATE_ROOTS`, che với mọi dispatch; token `{claudeSocketBase}` theo thứ tự của Claude Code (`$XDG_RUNTIME_DIR`, `$CLAUDE_CODE_TMPDIR`, thư mục tạm), runtime dir đọc qua một cửa `userRuntimeDir`; resolver tạo `cc-socks` 0700 khi thiếu để mask có từ lúc launch; một case socket và một falsifier riêng cho socket trong probe `machine-private-hidden`, không cơ chế mới (§9.3). Chủ sở hữu chọn phương án A ngày 2026-10-24 | Một lời ghi thô vào socket đó bắt đầu một lượt trong phiên Claude đang mở mà không hỏi; trước đó worker bị confine `connect()` được tới nó dưới mọi policy và dưới `blind` |
| 2026-10-24: thêm `{runtimeDir}` (cả user runtime dir), `{home}/.config/herdr` và `{herdrSocketDir}` vào `MACHINE_PRIVATE_ROOTS`, che với mọi dispatch; socket herdr rời `BLIND_HIDDEN_ROOTS` và resolver không còn hỏi route terminal-control; launch terminal chỉ được `--ro-bind` lại GO socket mà gate của nó dial, không còn `--bind` cả thư mục socket của run supervisor; resolver chỉ giữ root ngoài cùng (không che `cc-socks` hai lần) và chỉ tạo trước `cc-socks` khi base nằm ngoài runtime dir; probe `machine-private-hidden` thêm socket giả của runtime dir, herdr và attempt khác, chạy cả launch terminal, một falsifier cho mỗi mask và một cho bind-back (§9.3); sau review độc lập: runtime dir dự phòng `/run/user/<uid>` (0700, của user) khi thiếu `$XDG_RUNTIME_DIR`, che thêm `$XDG_CONFIG_HOME/herdr`, root `/` được tính là chứa mọi thứ, từ chối có tên `herdr-socket-dir-too-broad` và `go-socket-outside-runtime-socket-dir`, gate binary tương đối không bind từ cwd. Chủ sở hữu duyệt ngày 2026-10-24 | Đo bằng bwrap thật: worker không blind tới được socket API của herdr (chạy lệnh trong mọi pane), systemd user manager và session bus (`systemd-run --user` thoát sandbox, secret service), ssh-agent, gpg-agent, keyring, pipewire và GO socket của mọi attempt; worker không cần thứ nào trong số đó ngoài GO socket của chính attempt terminal |
| 2026-11-04: cửa `executeThroughConfinement` và thân adapter `cli-spawn` (`cliSpawnAdapter`) bị xoá; cửa duy nhất là `prepareConfinementForLaunch`, agent chạy dưới run supervisor, adapter `cli-spawn` và `herdr-spawn` từ chối bằng tên khi bị gọi trực tiếp; guard R8 cấm mọi lookup `EXECUTOR_ADAPTERS[` trong `src/` | Cửa cũ không còn caller production; giữ nó là giữ một đường thực thi thứ hai ngoài supervisor, trái nguyên tắc một cửa. Hành vi mất theo: attestation `completed` kèm bằng chứng `falsification-probe` (đường sống chỉ ghi `prepared`/`refused`) |
| 2026-11-04: đích ghi ngược login nằm trong descriptor finalization của attempt (host state, ngoài mọi grant), không nằm trong home hay marker của home; ghi ngược duy nhất là finalize-home; home giữ hẳn không bao giờ tự được xử lý (refresh-ahead và `doctor --fix` không đụng), chủ máy khôi phục bằng tay. Loại bỏ: đọc đích từ marker sau kiểm hình dạng, và settle home giữ hẳn bằng cách quét temp root | Home được bind đọc-ghi vào sandbox nên agent sửa được marker và có thể bắt host ghi login giả vào bất kỳ store login nào trên máy; không có chỗ nào ngoài home mà quét temp root tới được ghi đích, nên không có cách settle tự động an toàn |
| 2026-11-04: file agent ghi được (marker của home, file login trong home, `.mcp.json`, `.codex/hooks.json`) được đọc qua cửa agent-file: có giới hạn kích thước, không theo link, không chờ pipe; `.codex/hooks.json` là symlink thì bị từ chối | Một link hay pipe do agent đặt không được làm host đọc ngoài grant hay treo |

### 13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên

**Quyết định (2026-10-13):** invocation `codex-herdr-fgovn` (từ 2026-10-19 là `codex-herdr`) truyền thêm `--no-daemon` cạnh `-s danger-full-access -a never`. bwrap là confinement; sandbox riêng của Codex phải tắt trong suốt phiên, không chỉ ở lượt đầu.

**Vì sao:** mặc định TUI của Codex (từ 0.160) không tự chạy phiên mà giao cho một app-server daemon dùng chung (`codex app-server --listen unix:// --managed-daemon`), cài vào `<CODEX_HOME>/packages/app-server-daemon/releases/<version>/` lúc khởi động, kèm một daemon-updater tự thay bản mới hơn. Cờ `-s` của TUI chỉ áp cho thread nó mở; một thread mà daemon mở lại sau khi bị thay thì chạy theo mặc định của config, mà với workspace đã được gieo trust thì đó là sandbox `workspace-write` của chính Codex. Sandbox đó dựng bwrap riêng, coi cwd là writable root và mkdir các mount che (`.codex`, `.aws`, ...) bên trong cwd; dưới `--ro-bind / /` của fgOS lệnh mkdir thất bại nên mọi lệnh hỏng trước khi chạy: `bwrap: Can't mkdir <cwd>/.aws: Read-only file system`. Với `--no-daemon` phiên chạy trong chính tiến trình TUI, mang `-s danger-full-access` đến hết, không có daemon/updater nào chạy ra từ private home.

**Bằng chứng:** sự cố thật ở run `unit-run-1791874482416-acccbfe0/panelist-2/1` (pane chạy codex 0.160.1, lệnh đầu chạy được, sau một lần turn bị ngắt thì daemon 0.162.1 xuất hiện trong private home và mọi lệnh hỏng với lỗi trên). Tái hiện cơ chế: dưới đúng mount fgOS dựng (`--ro-bind / /`, `--tmpfs /tmp`, private home và outbox writable), `codex sandbox -c sandbox_mode="workspace-write" -- <ghi outbox>` với cwd là checkout chính báo đúng `bwrap: Can't mkdir /home/vantt/projects/forgentX/.aws: Read-only file system` (worktree không có `.codex` thì báo `.codex`), còn `danger-full-access` ghi được outbox; `read-only` hỏng vì cách khác (`execvp codex-linux-sandbox`). Dispatch pane thật có `--no-daemon`: private home không có `app-server-daemon/` hay `packages/`, run settle, outbox có `report-1.md` và `result-1.json`.

**Chưa chứng minh:** sự kiện nào khiến thread trong sự cố chạy lại dưới `workspace-write` (giả thuyết mạnh nhất: daemon-updater thay 0.160.1 bằng 0.162.1 giữa run, chính việc thay thế làm ngắt turn, và thread được mở lại không mang `-s`). Tắt daemon loại bỏ cả nhánh này; ghi `sandbox_mode = "danger-full-access"` vào `config.toml` của private home là lớp phòng thủ thứ hai chưa làm (file đó do bước gieo trust ghi, và driver bwrap không được rẽ nhánh theo provider). Đường `codex exec` (`codex-cli-bwrap`) không dùng daemon nên không đổi.
