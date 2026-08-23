# plan.md — tsk-45u: chuẩn hóa cwd khi cockpit mở pane cho một task

Nguồn quyết định: `docs/history/herdr-cockpit-project-root/CONTEXT.md`
(D1, D2-a, D3, D4). D5/D6 đã tách sang `tsk-3b0` — không nằm trong plan này.

## Mode: standard

Đếm cờ (mechanical, không cảm tính):

| Cờ | Có? | Vì sao |
|----|-----|--------|
| auth | không | |
| authorization | không | |
| data model | không | không đụng `.fgos/` schema |
| audit/security | không | không bỏ validation nào; id vẫn qua `is_valid_id` (`pick.rs:31`) |
| external systems | **có** | plugin shell ra herdr CLI; kết quả phụ thuộc herdr có thật sự honor `--cwd` hay không |
| public contracts | không | chỉ hàm nội bộ trong crate `herdr_fgos` |
| cross-platform | không | manifest linux+macos, cách resolve path giống nhau |
| existing covered behavior | **có** | `pick.rs` 6 test + `layout.rs` fixture test + 2 test double `PaneOrchestrator` trong `main.rs:192,208` đều đụng chữ ký sắp đổi |
| weak proof quanh vùng này | không | vùng này đã có test |
| multi-domain | không | |

**Đếm được 2 → standard.**

Vì sao không nhỏ hơn (`small`): thay đổi chạm chữ ký `open_pick_pane` /
`place_new_agent_pane` và cả hai test double trong `main.rs`, đồng thời hành
vi đúng lại phụ thuộc một cờ herdr chưa từng được chứng minh live trong repo
này (`pane split --cwd`, `tab create --cwd`). Gọi là `small` sẽ giấu mất
điểm cần chứng minh đó.

Vì sao không lớn hơn (`high-risk`): không dính cờ hard-gate nào — không auth,
không mất dữ liệu, không audit/security, không nhà cung cấp ngoài, không gỡ
validation.

## Approach

Đường chọn: **ép cwd bằng cờ `--cwd` native của herdr**, không prefix
`cd '<root>' &&` vào lệnh gõ.

- `herdr pane run <pane_id> <command>` gõ text thẳng vào shell của pane, không
  có ranh giới argv (đã ghi rõ ở `pick.rs:24-30`). Nhét thêm `cd '<root>' &&`
  vào đó là thêm một chỗ nữa phải lo quoting cho path.
- `herdr pane split ... [--cwd PATH]` và `herdr tab create ... [--cwd PATH]`
  đi qua argv thật, không qua shell. Rẻ hơn và an toàn hơn.
- Hệ quả: `run_argv` (`pick.rs:72-82`) **không đổi** — 3 test đang assert
  chuỗi lệnh chính xác của nó vẫn xanh nguyên.

Đã cân nhắc và loại:

- **Prefix `cd '<root>' &&`** (cách `scripts/herdr-cockpit.sh:34` đang làm):
  hợp lý cho một script bash, nhưng ở đây sẽ phá 3 test `run_argv` và thêm
  quoting risk, đổi lại không được gì.
- **Cả hai (belt-and-braces)**: thừa. Nếu `--cwd` không hoạt động thì phải
  biết ngay ở `fgos-coding-validating`, không phải giấu sau một lớp `cd`.
- **Resolve root lại trong `pick.rs`**: `main.rs:21` đã gọi
  `fgos::repo_root()` một lần rồi và giao cho `FgosCliSource`. Gọi lần hai là
  DRY vi phạm, và mở ra khả năng hai nơi thấy hai root khác nhau.

Root đến từ đâu: `fgos::repo_root()` (`fgos.rs:129-145`) chạy
`git rev-parse --path-format=absolute --git-common-dir` rồi lấy thư mục cha —
đúng main checkout kể cả khi gọi từ trong worktree (ADR0020). Đây chính là
D1 + vế resolve-từ-cwd của D4, code đã có sẵn, chỉ thiếu đường dẫn nó tới
chỗ mở pane.

D3 (chặn launch khi không có root) đi qua đường lỗi **đã tồn tại**:
`main.rs:120-123` bọc `open_pick_pane` và hiện
`pick failed for <id>: <err>` lên `pick_status`. Adapter giữ
`Option<PathBuf>`; `None` thì trả `Err` ngay, chưa từng gọi herdr. Không cần
widget lỗi mới, không cần đổi `app.rs`.

### Files sẽ đụng, theo thứ tự

`fgos graph --json`: `tsk-45u` là component kích thước 1 — không dep, không ai
chờ nó. `criticalPath`/`topUnblock` không ràng buộc thứ tự gì từ bên ngoài,
nên thứ tự dưới đây thuần nội bộ (mỗi bước để lại bước sau compile được).

1. `herdr-plugin/src/layout.rs` — tách builder argv thuần cho `pane split` và
   `tab create` (hiện đang inline trong `run_herdr(...)` ở `layout.rs:196-208`
   và `layout.rs:255-262`) để test được không cần herdr thật; thêm `--cwd
   <root>` vào cả hai. `find_agents_tab_with_room` và `place_new_agent_pane`
   nhận thêm tham số `project_root: &Path`.
2. `herdr-plugin/src/pick.rs` — `open_pick_pane` nhận `project_root: &Path`;
   `HerdrPaneAdapter` thêm field `project_root: Option<PathBuf>`; `impl
   PaneOrchestrator::open_pick_pane` trả `Err` với thông báo rõ khi `None`.
3. `herdr-plugin/src/main.rs` — composition root truyền `root` đã resolve ở
   dòng 21 vào `HerdrPaneAdapter` (`Ok(root)` → `Some`, `Err` → `None`); sửa
   2 test double ở `main.rs:192,208` cho khớp chữ ký nếu cần.

`app.rs`, `ports.rs`, `ui.rs`, `pane_scan.rs`, `fgos.rs`: **không đụng**.
Trait `PaneOrchestrator::open_pick_pane(&self, id)` giữ nguyên — root là chi
tiết của adapter, không phải của domain.

## Risk map

| Thành phần | Rủi ro | Cái gì chứng minh được |
|---|---|---|
| herdr có honor `pane split --cwd` cho pane mới không | **trung bình** — cờ có trong usage nhưng chưa từng dùng trong repo này | Live: `pane split --cwd /tmp` rồi `pane get <pane_id_mới>` xem field `cwd`. Điểm chứng minh cho `fgos-coding-validating`. |
| herdr có honor `tab create --cwd` cho root pane của tab mới không | **trung bình** — cùng lý do; nhánh này chạy khi mọi tab `fg:agents-N` đã đầy 4 pane | Live: `tab create --cwd /tmp` rồi `pane get <root_pane>`. Điểm chứng minh cho `fgos-coding-validating`. |
| `repo_root()` trả đúng main checkout khi plugin chạy trong pane cockpit thật | **trung bình** — hôm nay nó ăn cwd kế thừa, chưa ai kiểm trong pane thật | Live: mở plugin pane trong workspace có `--cwd <project>`, xem dashboard có list được item không. |
| Test double + 6 test hiện có trong `pick.rs`/`layout.rs` | thấp — đổi chữ ký, không đổi hành vi | `cargo test --manifest-path herdr-plugin/Cargo.toml` |
| `run_argv` giữ nguyên byte-for-byte | thấp — chủ ý của approach | 3 test `run_argv` hiện có phải xanh, không sửa dòng nào |

## Shape

Một item, **không tách con**. Ba file, một mạch thay đổi, không có mảnh nào
tự chạy độc lập có nghĩa: tách `layout.rs` khỏi `pick.rs` chỉ đẻ ra một item
không compile được cho tới khi item kia xong.

Ca cần chứng minh (đủ cho mode standard):

- Không resolve được root → `open_pick_pane` trả `Err`, **không** gọi herdr
  lần nào, `pick_status` hiện lỗi.
- Resolve được root → argv `pane split` chứa `--cwd <root>` đúng path.
- Nhánh tab đầy (pane_count == 4 ở mọi `fg:agents-N`) → argv `tab create`
  cũng chứa `--cwd <root>`, không phải chỉ nhánh split.
- Gọi từ trong một linked worktree → root vẫn là main checkout, không phải
  `.claude/worktrees/<id>` (D1, ADR0020).
- 6 test hiện có trong crate không đổi kết quả.

## Verify

```
cargo test --manifest-path herdr-plugin/Cargo.toml && cargo build --release --manifest-path herdr-plugin/Cargo.toml
```

Cùng convention với mọi item herdr-plugin trước (`docs/history/herdr-fgos-hexagonal-architecture/CONTEXT.md` D3).

**Cảnh báo cho `fgos-coding-validating`/Execute:** field `verify` mà engine tự điền
cho `tsk-45u` là `"npm test — full suite green, plus new/updated test..."`.
`npm test` trong repo này là `node --test 'test/**/*.test.mjs'`
(`package.json`) — **không** chạy crate Rust, nên nó không thể chứng minh item
này. Lệnh trên mới là lệnh thật.
