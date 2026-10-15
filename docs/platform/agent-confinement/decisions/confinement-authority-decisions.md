# Added in candidate: confinement authority decisions

```txt
Document type: Decision record
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/specs/confinement-authority.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/specs/confinement-authority.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding. New subdivision authorized by Step 8 and constitution kind placement. Original heading levels and numbers are retained. Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.

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
| Driver assess; Authority decide/compile; driver prepare; Authority execute | Mỗi quyết định chỉ có một owner |
| Provider normalizer phát resource binding chuẩn; backend provider-agnostic | Không giấu recipe thành nhánh provider trong driver |
| Observe-first khi rollout, enforcement là đích | Có evidence trước breaking change, không hạ mục tiêu |
| Detector độc lập và không tự nâng assurance | Tránh tự xác nhận vòng tròn |

### 13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên

**Quyết định (2026-10-13):** invocation `codex-herdr-fgovn` truyền thêm `--no-daemon` cạnh `-s danger-full-access -a never`. bwrap là confinement; sandbox riêng của Codex phải tắt trong suốt phiên, không chỉ ở lượt đầu.

**Vì sao:** mặc định TUI của Codex (từ 0.160) không tự chạy phiên mà giao cho một app-server daemon dùng chung (`codex app-server --listen unix:// --managed-daemon`), cài vào `<CODEX_HOME>/packages/app-server-daemon/releases/<version>/` lúc khởi động, kèm một daemon-updater tự thay bản mới hơn. Cờ `-s` của TUI chỉ áp cho thread nó mở; một thread mà daemon mở lại sau khi bị thay thì chạy theo mặc định của config, mà với workspace đã được gieo trust thì đó là sandbox `workspace-write` của chính Codex. Sandbox đó dựng bwrap riêng, coi cwd là writable root và mkdir các mount che (`.codex`, `.aws`, ...) bên trong cwd; dưới `--ro-bind / /` của fgOS lệnh mkdir thất bại nên mọi lệnh hỏng trước khi chạy: `bwrap: Can't mkdir <cwd>/.aws: Read-only file system`. Với `--no-daemon` phiên chạy trong chính tiến trình TUI, mang `-s danger-full-access` đến hết, không có daemon/updater nào chạy ra từ private home.

**Bằng chứng:** sự cố thật ở run `unit-run-1791874482416-acccbfe0/panelist-2/1` (pane chạy codex 0.160.1, lệnh đầu chạy được, sau một lần turn bị ngắt thì daemon 0.162.1 xuất hiện trong private home và mọi lệnh hỏng với lỗi trên). Tái hiện cơ chế: dưới đúng mount fgOS dựng (`--ro-bind / /`, `--tmpfs /tmp`, private home và outbox writable), `codex sandbox -c sandbox_mode="workspace-write" -- <ghi outbox>` với cwd là checkout chính báo đúng `bwrap: Can't mkdir /home/vantt/projects/forgentX/.aws: Read-only file system` (worktree không có `.codex` thì báo `.codex`), còn `danger-full-access` ghi được outbox; `read-only` hỏng vì cách khác (`execvp codex-linux-sandbox`). Dispatch pane thật có `--no-daemon`: private home không có `app-server-daemon/` hay `packages/`, run settle, outbox có `report-1.md` và `result-1.json`.

**Chưa chứng minh:** sự kiện nào khiến thread trong sự cố chạy lại dưới `workspace-write` (giả thuyết mạnh nhất: daemon-updater thay 0.160.1 bằng 0.162.1 giữa run, chính việc thay thế làm ngắt turn, và thread được mở lại không mang `-s`). Tắt daemon loại bỏ cả nhánh này; ghi `sandbox_mode = "danger-full-access"` vào `config.toml` của private home là lớp phòng thủ thứ hai chưa làm (file đó do bước gieo trust ghi, và driver bwrap không được rẽ nhánh theo provider). Đường `codex exec` (`codex-cli-bwrap`) không dùng daemon nên không đổi.
