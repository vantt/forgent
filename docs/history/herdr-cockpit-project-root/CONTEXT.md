# CONTEXT — herdr cockpit: project root và cwd khi open một task

Item: `tsk-45u` — "task con của herdr-plugn, chuẩn hóa cwd khi open một task".
Stage khi viết doc này: `clarify`.

## Feature boundary

Trong phạm vi (`tsk-45u`):

- dashboard tự xác định project root từ cwd của chính pane nó đang chạy.
- cwd của pane agent mà dashboard mở ra khi người bấm launch một task
  (`herdr-plugin/src/pick.rs` → `herdr-plugin/src/layout.rs`) — phải là main
  checkout root.
- hành vi khi không xác định được project root: chặn launch, báo lỗi.

Ngoài phạm vi (đã nêu ra và defer, không hấp thụ vào item này):

- **multi-project → `tsk-3b0`** (nhiều cockpit trên nhiều project cùng lúc,
  detect ứng viên + nhớ lại + selectbox chọn root). Xem D2-a bên dưới.
- thay đổi bản thân luồng `/fgOS:pick` hay `EnterWorktree`.
- chia sẻ trạng thái / notify chéo giữa nhiều cockpit đang chạy song song.
- `scripts/herdr-cockpit.sh` (cockpit bash của STR40) — nó đã tự `cd` đúng
  rồi, không phải chỗ hỏng.

## Locked decisions

| ID | Quyết định | Ghi chú |
|----|-----------|---------|
| D1 | cwd của pane task mới mở là **main checkout root** (thư mục chứa `.fgos/`), không phải worktree của item. | `/fgOS:pick` tự `EnterWorktree` vào `.claude/worktrees/<id>` sau đó; worktree cũng chưa tồn tại trước khi `pick` chạy. |
| D2 | ~~Item `tsk-45u` bao gồm **cả** fix cwd **và** phần multi-project.~~ **Bị D2-a thay thế.** | Giữ lại để đọc được lịch sử; không còn hiệu lực. |
| D2-a | Tách đôi: `tsk-45u` **chỉ** là fix cwd (tự xác định project/workspace hiện tại để agent bật lên đúng main checkout). Phần multi-project thành item riêng **`tsk-3b0`**. | Người chốt sau khi thấy D1-D6, lật D2. |
| D3 | Không resolve được project root thì **không** degrade im lặng. Với `tsk-45u`: **chặn launch, báo lỗi** — không bao giờ đẻ ra một session `claude` chạy sai chỗ. | Khác hành vi hôm nay ở `herdr-plugin/src/main.rs:26-29` (chỉ set `last_error` rồi chạy tiếp với danh sách rỗng). |
| D4 | **Một herdr workspace = một project.** Dashboard resolve project root từ cwd của chính pane nó đang chạy. Phần "nhiều cockpit song song" thuộc `tsk-3b0`; `tsk-45u` chỉ dùng vế resolve-từ-cwd. | herdr đã hỗ trợ: `herdr workspace create [--cwd PATH]`. Tab label `fg:cockpit` / `fg:agents-N` scope theo `HERDR_WORKSPACE_ID` nên không đụng nhau giữa các project. |
| D5 | Khi root không resolve được: **detect quanh vị trí đang đứng → gộp với danh sách đã nhớ → selectbox cho người chọn → nhớ lại lựa chọn.** **Thuộc `tsk-3b0`**, không phải `tsk-45u` (D2-a). | Người yêu cầu đúng ba phần này: search/detection + nhớ + selectbox. |
| D6 | Nguồn ứng viên cho selectbox: **thư mục tổ tiên của cwd + danh sách đã nhớ + cwd của mọi herdr workspace khác**. Không readdir anh em, không quét đĩa sâu. **Thuộc `tsk-3b0`** (D2-a). | `herdr workspace list` đã trả cwd; `herdr plugin config-dir fgos.dashboard` là chỗ ghi nhớ hợp lệ. Giữ rẻ và deterministic vì dashboard poll 5s/lần (`main.rs:15`). |

## Pinned terms

- **project root** — thư mục là git root **và** có `.fgos/` trong đó; tức main
  checkout, không bao giờ là một linked worktree (ADR0020,
  `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md`).
- **cockpit** — một pane instance của plugin `fgos.dashboard`, gắn với đúng
  một project (D4). Không phải một bản cài plugin riêng: plugin là một app
  duy nhất, cài toàn cục.
- **pane task** — pane mà dashboard mở ra để chạy `claude '/fgOS:pick <id>'`
  cho một work item.
- **đã nhớ** (D5/D6) — danh sách project root người từng chọn qua selectbox,
  lưu dưới `herdr plugin config-dir fgos.dashboard`.

## Scout evidence

Đường dẫn và bằng chứng thật đã đọc trong vòng clarify này:

- `herdr-plugin/src/layout.rs:255-262` — `place_new_agent_pane` gọi
  `pane split --pane <p> --direction <d> --no-focus`, **không** truyền `--cwd`.
- `herdr-plugin/src/pick.rs:76-81` — lệnh gõ vào pane là
  `claude --dangerously-skip-permissions '/fgOS:pick <id>'`, không `cd` trước.
  Pane mới vì vậy kế thừa cwd của pane cha, bất kể pane cha đứng đâu.
- `scripts/herdr-cockpit.sh:34,54` — cockpit bash **có** `cd '${REPO_ROOT}' &&`
  cho mọi pane nó chạy. Đây là đối chứng cho thấy plugin đang thiếu đúng bước đó.
- `herdr-plugin/src/fgos.rs:129-145` + `herdr-plugin/src/main.rs:21` —
  `repo_root()` chạy `git rev-parse --path-format=absolute --git-common-dir`
  từ cwd kế thừa của process plugin; ngoài git repo là lỗi, sai repo là sai project.
- `herdr-plugin/src/main.rs:26-29` — hành vi lỗi hôm nay: set `last_error`,
  vẫn chạy tiếp (degrade-don't-crash).
- `herdr-plugin/herdr-plugin.toml:1` — plugin id `fgos.dashboard`, một app cài
  toàn cục; không có chỗ nào trong manifest lưu per-project.
- `herdr-plugin/src/pane_scan.rs:139-144` — fixture thật của
  `herdr pane list` có field `cwd` cho từng pane.
- herdr CLI (probe live trong session này, `herdr <group>` không tham số):
  - `herdr pane split [<pane_id>] --direction right|down [--ratio FLOAT] [--cwd PATH] [--env KEY=VALUE] ...`
  - `herdr tab create [--workspace ID] [--cwd PATH] [--label TEXT] [--env KEY=VALUE] ...`
  - `herdr plugin pane open --plugin ID --entrypoint ID ... [--cwd PATH] [--env KEY=VALUE] ...`
  - `herdr workspace create [--cwd PATH] [--label TEXT] [--env KEY=VALUE] ...`
  - `herdr pane run <pane_id> <command>` — **không** có `--cwd`.
  - `herdr plugin config-dir <plugin_id>`
  - `herdr workspace list`

## Đính chính bằng chứng (probe live 2026-07-30, trong `fgos-coding-validating` của tsk-45u)

- D6 viết "cwd của mọi herdr workspace khác qua `herdr workspace list`" — **sai**.
  `herdr workspace list` và `herdr workspace get <id>` **không** trả field `cwd`
  (probe thật: chỉ có `workspace_id`, `label`, `number`, `pane_count`,
  `tab_count`, `active_tab_id`, `agent_status`, `focused`).
  Chỗ thật sự mang cwd là `herdr pane list --workspace <id>`: mỗi pane có
  `cwd` và `foreground_cwd`. Ý định của D6 (gom ứng viên từ các workspace
  khác) không đổi; chỉ nguồn dữ liệu đổi sang `pane list`. Thuộc `tsk-3b0`.
- Xác nhận live cho `tsk-45u`: `herdr tab create --cwd /tmp` cho root pane
  `cwd":"/tmp"`, và `herdr pane split --cwd /home/vantt` cho pane mới
  `cwd":"/home/vantt"` — cả hai cờ đều được honor thật.

## Canonical references

- `docs/history/herdr-fgos-tui-plugin/CONTEXT.md` — quyết định gốc dựng plugin.
- `docs/history/herdr-shared-launch-agent/CONTEXT.md` — hàm launch-agent dùng chung
  (`open_pick_pane`).
- `docs/how-to/launch-claude-in-a-new-herdr-pane-from-a-plugin.md`
- `docs/how-to/scaffold-and-link-a-herdr-plugin.md`
- `docs/operator-runbook-herdr-cockpit.md` — cockpit bash STR40.
- `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` — worktree không mang `.fgos/`.
- `plugins/fgOS/skills/pick/SKILL.md` — luồng `/fgOS:pick` mà pane task chạy vào.

## Câu còn để lại cho planning

Đây là những thứ chỉ người implement mới quan tâm, cố ý không chốt ở đây.

Cho `tsk-45u`:

- Ép cwd bằng `pane split --cwd <root>` (herdr-native) hay bằng cách prefix
  `cd '<root>' &&` vào lệnh gõ (giống `herdr-cockpit.sh`) — hay cả hai.
- Lỗi "không resolve được root" hiện ở đâu trong UI, và nút launch bị chặn
  bằng cách nào.
- Verify command cho item (`verify` hiện đang là "chưa xác định — P15 bổ sung").

Cho `tsk-3b0` (D5/D6):

- Định dạng và tên file của danh sách "đã nhớ" trong plugin config-dir.
- Selectbox dựng bằng widget nào trong `ui.rs`, và nó chiếm chỗ nào trong layout.
- Thứ tự / khử trùng lặp ứng viên D6 khi cùng một root đến từ nhiều nguồn.
