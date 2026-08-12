# tsk-1zq — herdr-plugin dùng port slot, bỏ nhãn-guard

Item: `tsk-1zq` (tier/kind/risk = standard/feature/heavy), con T2 của
`tsk-2sj`. Phụ thuộc `tsk-3dt` (T1) — đã merge vào `fgw/tsk-2sj`, nên
`src/state/worker-slots.mjs` và verb `fgos slots` đã có thật trên nhánh
nền của item này.

Mode: **high-risk** — 4 flag áp dụng: *public contracts* (pinned term
`fg:agents-N` đổi tên; `PaneRegistry`/`PaneOrchestrator` đổi chữ ký;
`place_new_agent_pane` đổi tên và đổi ngữ nghĩa), *existing covered
behavior* (129 test của herdr-plugin đang phủ đúng vùng này; đợt này
supersede 2 quyết định đã khoá), *external systems* (adapter shell ra CLI
`herdr` và thêm một lời gọi `node bin/fgos.mjs` mới), *data model* (khái
niệm "pane tái dùng được" và binding pane↔item là hình dạng dữ liệu mới
trong `App`). Không flag hard-gate nào (auth, data loss, audit/security,
external provider, gỡ một validation). Một lane nhỏ hơn không trung thực
được: `place_new_agent_pane` là điểm hội tụ của cả ba đường mở pane, và
blast radius đo được là **HIGH**.

## Nguồn quyết định

Item này **không có `CONTEXT.md` riêng**, và đó là đúng cấu trúc: nó là
item con tách ra từ `tsk-2sj` ở stage `planning`, thừa kế nguyên quyết
định đã khoá của cha. Nguồn citable:

- `docs/history/orchestrator-worker-slots/plan.md` — Mode, bản đồ rủi ro,
  A5/A7/A8, Supersede; §Shape "T2" là contract của chính item này.
- `docs/history/orchestrator-worker-slots/DISCUSSION.md` §4 (D1-D10),
  §5 vòng 7/8/9, §7 `#task-herdr-adapter`.
- `docs/history/orchestrator-worker-slots/RESEARCH.md` — F-C/F-D/F-G.
- `docs/operator-runbook-herdr-cockpit.md` §Hard rule — ranh giới
  `agent_status`.

Plan này **không mở lại** quyết định nào ở trên. Nó dịch §Shape "T2"
thành thứ tự thi công, và nêu thẳng những giả định mới mà chính việc đọc
code Rust sinh ra.

## Approach

### Đường đã chọn

**Engine trả lời "còn chỗ không" và "cái gì đang chạy"; adapter chỉ còn
quyết định *chỗ đặt*. Pane được thu hồi bằng tái dùng, không bằng đóng.**

1. **Hỏi engine trước khi dựng (D6).** Thêm `fetch_worker_slots(root)`
   trong `main.rs`, shell `node bin/fgos.mjs slots --json --dir <root>` —
   đúng khuôn `pick_right_pane_loop` đang dùng hôm nay (`main.rs:455-471`),
   mirror tại chỗ chứ không tái dùng `fgos.rs` vì file đó ngoài footprint.
   Verb này là **cửa duy nhất** Rust với tới được theo `0014`, và T1 đã
   phơi sẵn: `data.execution.{occupied, ceiling, free, hasRoom, items[]}`,
   `data.admin.reserved`.

2. **Nhãn thôi gánh state (D2/D3/D5).** Bỏ hẳn guard
   `has_labeled_pane("fgos-auto-discover")` và cả lời gọi `pane rename`
   đặt nhãn đó trước khi spawn `claude`. Thay bằng câu hỏi engine trả lời
   được từ dữ liệu `app.work_items` đã fetch sẵn mỗi tick:
   **"còn worker auto-discover nào sống không"** = có item nào
   `status == "doing"` mà `stage ∈ {clarify, discovery, exploring}` —
   đúng `CANDIDATE_STAGES` mà `WorkItem::discover_eligible` đã mirror
   (`app.rs:70-80`). Không thêm lời gọi CLI nào.

   Đây là D3 nói theo nghĩa đen: cơ chế bị **thay**, không bị vá. Nhãn
   `fgos-auto-discover` biến mất khỏi phía ghi luôn, vì lý do tồn tại duy
   nhất của nó là làm mutex.

3. **Thu hồi pane bằng tái dùng (A5/D10).** `PaneRegistry` đổi từ
   `scan() -> HashMap<task_id, PaneIdentity>` sang
   `scan_panes() -> Vec<PaneSnapshot>` mang đủ `{pane_id, tab_id, label,
   focused}` — `pane list` đã trả sẵn cả `focused` lẫn `label` trong cùng
   một lời gọi (fixture `PANE_LIST_FIXTURE`, `pane_scan.rs:173-182`), nên
   không tốn thêm subprocess nào. Map task-id cũ trở thành một phép thuần
   trên snapshot đó, một nguồn thay vì hai lời gọi.

   Một pane ở lane workers **tái dùng được** khi cả bốn đúng:

   | Điều kiện | Nguồn | Vì sao |
   |---|---|---|
   | `tab_id` thuộc một tab `fg:workers-N` | `tab list` | A7: lane này chỉ chứa flow one-shot; loop sống ở `fg:operation` |
   | không `focused` | `pane list` | D10-2 — dữ liệu chrome hợp lệ, không phải `agent_status` |
   | không nằm trong `pending_worker_panes` | bookkeeping của chính adapter | pane vừa được herdr bắn vào, session chưa kịp tự đặt nhãn |
   | nhãn trống, **hoặc** item mà nhãn trỏ tới không ở `doing` | nhãn cho *danh tính*, engine cho *trạng thái* | D2: engine sở hữu "đang chạy gì" |

   Dòng cuối là chỗ D2 dễ bị đọc nhầm nhất, nên nói thẳng: nhãn chỉ trả
   lời "pane này **được mở cho** item nào" — thông tin danh tính do chính
   session ghi qua helper của T3 (D5). Câu "item đó còn chạy không" **chỉ**
   engine trả lời. Không có đường nào nhãn tự nó quyết định được gì.

4. **`place_new_agent_pane` → `acquire_worker_slot_pane`** (từ vựng pane
   sang từ vựng slot). Thứ tự bên trong: tái dùng trước, split sau. Đây là
   chỗ trần vật lý bám theo trần logic *theo cấu trúc* thay vì theo may
   rủi (A5).

5. **Trần thôi nằm trong hằng số Rust.** `MAX_AGENT_TABS` và biến thể lỗi
   `NoRoomForAgentTabs` bị xoá — trần là việc của engine.
   `MAX_PANES_PER_TAB` **đổi tên** thành `PANES_PER_WORKERS_TAB`: nó sống
   tiếp đúng vai trò hình học lưới 2×2 (khi nào tách tab mới), không còn
   là nguồn trần.

6. **`fg:operation` 2 → 4 pane.** `left_right_panes` (hình học trái/phải)
   bị thay bằng `operation_slot_panes` — sắp theo thứ tự đọc `(y, x)` rồi
   gán 4 slot cố định: merge / retro / cleanup / dự phòng, đúng "3 loại
   loop hôm nay + 1 thủ sẵn" (D9). Tab đang sống có 2 pane được **migrate**
   bằng cách split thêm cho đủ 4, không còn là trạng thái lỗi.

   Hệ quả trực tiếp: retro và cleanup mỗi cái có pane riêng, nên
   `RightPaneLoop`/`pick_right_pane_loop`/`choose_right_pane_loop` mất lý
   do tồn tại và bị xoá cùng lời gọi `fgos list --all --json` mỗi tick mà
   chúng kéo theo. Đây là xoá thật, không phải đổi tên.

### Phương án đã cân nhắc và loại

| Phương án | Vì sao loại |
|---|---|
| Đọc `agent_status` của herdr để biết pane rỗi | `docs/operator-runbook-herdr-cockpit.md` §Hard rule cấm dứt khoát: nó từng là nguồn sự thật thứ hai và đã gây bug thật ("idle killed an agent") |
| Ngưỡng thời gian ("pane im lặng > N giây là rỗi") | DISCUSSION vòng 7 loại thẳng; và nó dựng lại đúng loại tín hiệu suy đoán mà D2 thay thế |
| Giữ nhãn `fgos-auto-discover` làm mutex, chỉ thêm hỏi engine | D3 cấm vá tại chỗ; và nhãn vẫn hỏng y như cũ khi session tự đổi tên pane giữa chừng |
| Fold `writer.id` từ Rust để có danh sách worker vừa xong | Đẻ bản sao thứ hai của logic engine trong Rust; T1 đã là cửa, xem A-4 |
| Fail-closed khi `fgos slots` không gọi được | Verb chưa có trên `main`; fail-closed sẽ khoá cứng cockpit cho tới lúc `tsk-2sj` merge. Xem A-2 |
| Trừ `admin.reserved` vào trần trước khi mở pane worker | Sai đơn vị — F-B/T1 đã chốt hai lane không chung pool đếm |

### Bản đồ rủi ro

`impact-analysis: **degraded**`. `fgos tool query --capability
impact-analysis --status present` trả 1 provider (`gitnexus`, `present`).
Khác với T1, GitNexus **có** phủ Rust ở đây và **khớp** `grep`:
`impact({target:'place_new_agent_pane', direction:'upstream'})` trả
`impactedCount: 7`, `direct: 3`, `risk: HIGH`, `epistemic: exact` — đúng 3
caller mà `grep -rn "place_new_agent_pane" herdr-plugin/src` cho
(`pick.rs:235`, `:254`, `:354`); `ensure_operation_tab` trả `direct: 1`,
khớp `main.rs:52`. Vẫn ghi **degraded** chứ không phải `full` vì hai lý do
thật, không phải thủ tục: index trỏ vào main checkout (`main`), không phải
nhánh nền `fgw/tsk-2sj` của item này; và RESEARCH F-G đã chứng minh cùng
công cụ đó trả false negative trên `claimWork`. ⇒ **Mọi phát biểu
blast-radius trong item này lấy từ `rg`/`grep` trước, GitNexus là chứng
phụ trùng khớp.**

⚠️ **HIGH risk đã được nêu ra, không bỏ qua:** `acquire_worker_slot_pane`
(tên mới của `place_new_agent_pane`) là điểm hội tụ của cả ba đường mở
pane. Sai ở đây là cả ba nút mở agent của cockpit cùng hỏng.

| Thành phần | Mức | Cái gì chứng minh được (proof point cho validating) |
|---|---|---|
| `acquire_worker_slot_pane` (tái dùng + split) | **CAO** — 3 caller, mọi đường mở pane đi qua | Test thuần: pane focused không bao giờ được chọn; pane ngoài lane workers không bao giờ được chọn; pane pending không bao giờ được chọn; hết pane rỗi thì fallback split |
| Guard auto-discover chuyển sang engine | **CAO** — sai là hoặc spam pane, hoặc không bao giờ tự discover nữa | Test thuần: có item `doing` ở stage discovery ⇒ không bắn; không có ⇒ bắn. Vế negative: không còn lời gọi `has_labeled_pane` nào cho nhãn discover |
| `fg:operation` 2 → 4 pane + migrate | TRUNG BÌNH — workspace đang sống có tab 2 pane cũ | Test: layout 2 pane ⇒ nhận ra thiếu và split cho đủ; layout 4 pane ⇒ gán đúng 4 slot theo `(y, x)`; không còn nhánh nào coi ≠2 pane là lỗi |
| Đổi `fg:agents-N` → `fg:workers-N` | TRUNG BÌNH — pinned term của `tsk-1q3`; pane đang sống mang nhãn cũ | Vế negative của chính verify item: `! grep -rq 'fg:agents-' herdr-plugin/src` |
| `PaneRegistry` đổi chữ ký (`scan` → `scan_panes`) | TRUNG BÌNH — port công khai, có adapter giả trong test | `cargo build --release` + 129 test cũ còn xanh |
| Gọi `fgos slots` khi verb chưa có trên `main` | TRUNG BÌNH — cockpit chạy từ main checkout | Test: lỗi/không parse được ⇒ coi như không có trần, không chặn (A-2) |
| Bỏ `--autoClose` khỏi lệnh herdr bắn | THẤP-TRUNG BÌNH — pane không còn tự đóng | Test argv: không lệnh nào herdr bắn còn mang `--autoClose` |

### Thứ tự

`fgos graph tsk-1zq --json`: `topUnblock` bị skip ở frame này,
`criticalPath` chạy nhánh herdr-plugin — nhánh dài nhất của đồ thị, nên
item này nằm trên đường tới hạn và không có anh em nào chờ nó ngoài chính
`tsk-2sj`.

Trong item: (1) port đọc slot + guard engine (không đụng layout, chạy
được ngay với hành vi split cũ); (2) `PaneSnapshot`/`scan_panes` +
quyết định thuần "pane nào tái dùng được"; (3) `acquire_worker_slot_pane`
nối hai thứ trên; (4) đổi tên `fg:workers-N` + gỡ hằng số trần;
(5) `fg:operation` 4 pane. Mỗi bước sau đều có bước trước đã xanh làm nền.

## Shape

### Bước 1 — port đọc slot + guard auto-discover (`main.rs`)

```
fetch_worker_slots(root) -> Option<WorkerSlots>      // None = không đọc được
WorkerSlots { occupied, ceiling: Option<i64>, has_room: bool,
              doing_ids: Vec<String> }
discovery_worker_alive(&[WorkItem]) -> bool          // thuần
worker_slot_room(Option<&WorkerSlots>) -> bool       // None ⇒ true (A-2)
```

Chỗ gọi: cả ba đường mở pane đều hỏi trước khi dựng (D6) — nút Pick, nút
Discover, và vòng auto-discover. Từ chối của người bấm nút hiện ra ở
`app.pick_status` (đường person-initiated đã có sẵn); từ chối của vòng
auto thì im lặng bỏ tick, đúng khuôn `main.rs:356-360` đang dùng.

### Bước 2 — snapshot pane + quyết định thuần (`ports.rs`, `pane_scan.rs`)

```
PaneSnapshot { pane_id, tab_id, label: Option<String>, focused: bool }
PaneRegistry::scan_panes() -> Result<Vec<PaneSnapshot>, PaneScanError>
task_id_map(&[PaneSnapshot]) -> HashMap<String, PaneIdentity>   // thuần
```

`has_labeled_pane` **giữ nguyên** — nó vẫn phục vụ lane admin
(`fgos-auto-merge`/`-retro`/`-cleanup`), là nhãn cố định theo slot do
adapter tự đặt một lần khi dựng tab, đúng phân công §6 của DISCUSSION.
Chỉ lời gọi cho `fgos-auto-discover` biến mất.

### Bước 3 — `acquire_worker_slot_pane` (`layout.rs`)

```
reusable_worker_pane(panes, workers_tab_ids, doing_ids, pending) -> Option<String>  // thuần
acquire_worker_slot_pane(herdr_bin, workspace_id, project_root,
                         doing_ids, pending) -> Result<String, LayoutError>
```

Tái dùng trước; không có pane rỗi thì `find_workers_tab_with_room` →
`next_split_target` → `pane split` như cũ. Pane vừa được bắn vào được
thêm vào `App::pending_worker_panes`, và rời tập đó ở tick đầu tiên
herdr thấy nó mang nhãn dạng task-id — tức khi session đã tự nhận mình
(D5). Đây là bookkeeping của chính adapter về hành động của chính nó
(§6 "Launcher/adapter sở hữu — *cách* dựng một worker và *chỗ* đặt nó"),
sống trong tiến trình, không phải state orchestrator.

### Bước 4 — đổi tên lane workers (`layout.rs`)

`fg:agents-N` → `fg:workers-N`; `agents_tab_index` → `workers_tab_index`;
`find_agents_tab_with_room` → `find_workers_tab_with_room`;
`MAX_PANES_PER_TAB` → `PANES_PER_WORKERS_TAB`; xoá `MAX_AGENT_TABS`,
`LayoutError::NoRoomForAgentTabs`, và nhánh `AgentTabPlacement::NoRoom`.

Vế negative của verify quét cả `src/`, mà module test nằm **trong**
`src/*.rs`, nên 27 chỗ đang có (`layout.rs` 25, `pick.rs` 1, `main.rs` 1)
phải đi hết — kể cả chuỗi `fg:agents-1`/`fg:agents-2` nằm trong fixture
đã bắt sống. Đổi fixture ở đây là đổi *dữ liệu mẫu*, không phải nới test:
fixture mô tả một workspace mang nhãn mới.

### Bước 5 — `fg:operation` 4 pane (`layout.rs`, `main.rs`, `app.rs`)

```
OperationPanes { merge, retro, cleanup, spare }
operation_slot_panes(&TabLayout) -> Option<OperationPanes>   // thuần, sắp theo (y, x)
ensure_operation_tab(...) -> Result<OperationPanes, LayoutError>
```

`App.operation_left_pane_id`/`operation_right_pane_id` gộp thành
`App.operation_panes: Option<OperationPanes>`. Tab thiếu pane thì split
cho đủ 4 (migrate); `left_right_panes` và toàn bộ nhánh so sánh ưu tiên
retro-vs-cleanup bị xoá.

`struct Rect` hôm nay chỉ parse `{height, x, width}` (`layout.rs:156-166`)
— thiếu `y`, trong khi phép sắp theo thứ tự đọc cần nó. Response thật của
`pane layout` **đã** mang `y` (thấy trong cả hai fixture,
`layout.rs:554-565`), nên đây là thêm một field vào bản parse, không phải
thiếu dữ liệu.

### Ca đáng chứng minh

- **Biên rỗng/biên trên:** không pane nào ở lane workers; mọi pane đều
  focused; mọi pane đều đang giữ item `doing`; engine trả `hasRoom: false`.
- **Hành vi cũ không vỡ:** toàn bộ 129 test herdr-plugin còn xanh;
  `cargo build --release` sạch.
- **Migrate:** tab `fg:operation` đúng 2 pane; tab mang nhãn `fg:agents-1`
  cũ (không còn được nhận là lane workers — pane trong đó không bị tái
  dùng, đúng chủ ý: nhãn cũ nghĩa là tab cũ, để nguyên cho người).
- **Hỏng một phần:** `fgos slots` lỗi/không parse được; `tab list` lỗi;
  một pane bị người đóng tay giữa hai tick.
- **Đua:** hai tick liên tiếp cùng thấy một pane rỗi (tick sau phải thấy
  nó đã pending, không bắn đè).

## Assumptions

- **A-1 — Nhãn pane dùng làm *danh tính* không vi phạm D2.** *Giả định có
  chủ ý, nêu thẳng vì đây là chỗ dễ đọc nhầm nhất của item này.* D2 cấm
  nhãn **gánh state** của orchestrator. Thiết kế này để nhãn trả lời đúng
  một câu — "pane này được mở cho item nào" — còn "item đó còn chạy
  không" thì chỉ engine trả lời. Cùng cách dùng mà `parse_pane_list` +
  panel "In process" đã dùng từ `tsk-4zo`/`tsk-1eu` và không ai coi là vi
  phạm. **Cần validating xác nhận cách đọc này**, vì nó là chỗ duy nhất
  plan con diễn giải một điều D2 không nói bằng chữ.

- **A-2 — `fgos slots` không gọi được ⇒ không có trần, không chặn.**
  *Giả định có chủ ý, có tiền lệ.* Verb này chưa tồn tại trên `main`, mà
  cockpit chạy từ main checkout — nên trong khoảng thời gian từ khi item
  này merge vào `fgw/tsk-2sj` đến khi `tsk-2sj` merge vào `main`, lời gọi
  sẽ **thất bại thật**. Fail-closed sẽ khoá cứng mọi nút mở agent. Chọn
  fail-open, đúng kỷ luật T1 đã chốt cho chính mặt này: `ceiling` vắng ⇒
  `allowed: true`, `reason: 'no-ceiling-configured'`
  (`worker-slots.mjs:114-116`), và đúng vết `invariantChecks`
  (`shared-config-file.mjs`). Không cấu hình được thì không chặn.

- **A-3 — Pane không mang nhãn dạng task-id không bao giờ được tái dùng.**
  *Giả định có chủ ý.* Không có cách nào phân biệt "session đang khởi
  động" với "pane bỏ không" nếu không đọc `agent_status` (runbook cấm)
  hoặc dựng ngưỡng thời gian (vòng 7 loại). Nên tập pending ở Bước 3 lo
  cửa sổ khởi động, còn pane chưa từng mang nhãn thì để yên.

  Rò rỉ đã biết: một session được bắn ra rồi chết trước khi kịp tự đặt
  nhãn sẽ để lại một pane không ai tái dùng, cho tới khi herdr-plugin
  khởi động lại. Đây đúng là loại **sự cố** mà A6 mô tả và `/fgOS:stale`
  đã sở hữu, không phải trạng thái thiết kế — và nó tốn đúng một pane,
  không phải một slot, vì slot đếm theo work-item (D7) mà session đó chưa
  claim được cái nào.

- **A-4 — Không fold `writer.id` phía Rust, nên không có thứ tự
  "cũ→mới".** *Giả định có chủ ý, đi khác chữ nghĩa của A5 (cha) một
  điểm, nên nêu thẳng.* A5 nói danh sách worker vừa xong xếp cũ→mới là
  suy được từ log. Đúng — nhưng đó là phép fold **phía engine**, và T1
  không phơi nó ra (`fgos slots` chỉ trả item đang `doing`). Dựng lại
  phép fold đó trong Rust là đẻ bản sao thứ hai của logic engine, đúng
  thứ `0014` và D2 đều chống.

  ⇒ Item này chọn pane rỗi **tất định theo `pane_id`**, không theo
  "xong lâu nhất trước". Cái mất: một pane vừa xong xong có thể bị tái
  dùng trước một pane rỗi lâu hơn. Cái bù: đó **chính xác** là ca mà
  D10-2 đã dựng hàng rào — pane đang `focused` không bao giờ bị đụng, và
  người đang đọc thì pane đang focused. Nếu về sau cần thứ tự thật, chỗ
  đúng để thêm là `fgos slots`, không phải Rust.

- **A-5 — Bỏ `--autoClose` khỏi lệnh herdr bắn là đúng vế "bỏ hẳn nhánh
  delay-rồi-đóng".** *Chưa chứng minh — proof point ở validating.* Trong
  `herdr-plugin/src` **không có** logic delay-rồi-đóng nào (`grep` xác
  nhận: chỉ có `tab close` của `tsk-3i3`, chuyện bàn giao tab cockpit,
  không liên quan). Phần herdr tham gia vào nhánh đó là đúng cờ
  `--autoClose` nó splice vào lệnh gõ (`pick.rs:171`, `:200`). Bản thân
  `plugins/fgOS/skills/terminal-close/` và các SKILL.md đọc cờ đó nằm
  **ngoài footprint** item này — ghi nhận là việc còn lại, không nuốt.

- **A-6 — Tab mang nhãn `fg:agents-N` cũ không được migrate.** *Giả định
  có chủ ý.* Sau đổi tên, `workers_tab_index` chỉ nhận `fg:workers-`, nên
  một tab `fg:agents-1` đang sống trở thành tab thường: không nhận pane
  mới, không bị tái dùng, không bị đóng. Người tự dọn khi rảnh. Đổi nhãn
  hộ là adapter tự ý sửa workspace của người, đắt hơn cái nó giải quyết.

## Ngoài phạm vi

`plugins/fgOS/skills/terminal-close/` và các SKILL.md còn đọc
`--autoClose` (A-5); cơ chế liveness động cho lane admin (T1 A-1 để lại);
ranker toàn cục xuyên pool (D6); `tsk-60h`; dọn tab `fg:agents-N` cũ
đang sống (A-6); phơi thứ tự "worker vừa xong" ra `fgos slots` (A-4).

## Outstanding questions

None
