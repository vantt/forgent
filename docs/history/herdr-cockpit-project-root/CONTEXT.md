# CONTEXT — herdr cockpit: project root và cwd khi open một task

Item: `tsk-45u` — "task con của herdr-plugn, chuẩn hóa cwd khi open một task".
Stage khi viết doc này: `clarify`.

## Feature boundary

Trong phạm vi:

- cwd của pane agent mà dashboard mở ra khi người bấm launch một task
  (`herdr-plugin/src/pick.rs` → `herdr-plugin/src/layout.rs`).
- cách một cockpit (một pane instance của plugin `fgos.dashboard`) xác định
  project nào nó đang quản, và cách nhiều cockpit cùng sống trên nhiều
  project trong cùng một herdr install.
- hành vi khi không xác định được project root.

Ngoài phạm vi (đã nêu ra và defer, không hấp thụ vào item này):

- thay đổi bản thân luồng `/fgOS:pick` hay `EnterWorktree`.
- chia sẻ trạng thái / notify chéo giữa nhiều cockpit đang chạy song song.
- `scripts/herdr-cockpit.sh` (cockpit bash của STR40) — nó đã tự `cd` đúng
  rồi, không phải chỗ hỏng.

## Locked decisions

| ID | Quyết định | Ghi chú |
|----|-----------|---------|
| D1 | cwd của pane task mới mở là **main checkout root** (thư mục chứa `.fgos/`), không phải worktree của item. | `/fgOS:pick` tự `EnterWorktree` vào `.claude/worktrees/<id>` sau đó; worktree cũng chưa tồn tại trước khi `pick` chạy. |
| D2 | Item `tsk-45u` bao gồm **cả** fix cwd **và** phần multi-project (một cockpit ↔ một project, nhiều cockpit song song). | Mô tả item gộp cả hai; người chốt giữ chung, không tách. |
| D3 | Không resolve được project root thì **không** degrade im lặng — phải đưa người vào đường chọn root (chi tiết D5/D6). | Khác hành vi hôm nay ở `herdr-plugin/src/main.rs:26-29` (chỉ set `last_error` rồi chạy tiếp với danh sách rỗng). |
| D4 | **Một herdr workspace = một project.** Dashboard resolve project root từ cwd của chính pane nó đang chạy. | herdr đã hỗ trợ: `herdr workspace create [--cwd PATH]`. Tab label `fg:cockpit` / `fg:agents-N` scope theo `HERDR_WORKSPACE_ID` nên không đụng nhau giữa các project. |
| D5 | Khi root không resolve được: **detect quanh vị trí đang đứng → gộp với danh sách đã nhớ → selectbox cho người chọn → nhớ lại lựa chọn.** | Người yêu cầu đúng ba phần này: search/detection + nhớ + selectbox. |
| D6 | Nguồn ứng viên cho selectbox: **thư mục tổ tiên của cwd + danh sách đã nhớ + cwd của mọi herdr workspace khác**. Không readdir anh em, không quét đĩa sâu. | `herdr workspace list` đã trả cwd; `herdr plugin config-dir fgos.dashboard` là chỗ ghi nhớ hợp lệ. Giữ rẻ và deterministic vì dashboard poll 5s/lần (`main.rs:15`). |

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

Đây là những thứ chỉ người implement mới quan tâm, cố ý không chốt ở đây:

- Ép cwd bằng `pane split --cwd <root>` (herdr-native) hay bằng cách prefix
  `cd '<root>' &&` vào lệnh gõ (giống `herdr-cockpit.sh`) — hay cả hai.
- Định dạng và tên file của danh sách "đã nhớ" trong plugin config-dir.
- Selectbox dựng bằng widget nào trong `ui.rs`, và nó chiếm chỗ nào trong layout.
- Thứ tự / khử trùng lặp ứng viên D6 khi cùng một root đến từ nhiều nguồn.
- Verify command cho item (`verify` hiện đang là "chưa xác định — P15 bổ sung").
