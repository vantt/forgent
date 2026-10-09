# CLI I/O Contract

```txt
Document type: Contract
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens.
Design status: Candidate
Last reviewed: 2026-10-06
Added in candidate: the headings Single Write Door, Writer Source Trust Levels, Writer Resolution Rules, Caller Role, Error Path Is Not Enveloped, Runner Stdout Envelope, Recognizing A Real Envelope and Entry Fields And Effect Axes subdivide sections of the sources that have no heading of their own; the text under them is carried from the sources.
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/spec.md
- docs/platform/work-state/decisions/retired-decision-history.md
- docs/specs/work-state.md
- docs/io-contract.md
```

## 1. Purpose And Scope

Hợp đồng giao tiếp VÀO/RA hạng nhất cho bề mặt CLI của fgOS (`bin/fgos.mjs`)
và bề mặt stdout của vòng tự hành (`bin/fgos-runner.mjs`), theo record
`0014` (`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md`) (kiến trúc cửa, đã
khoá) và [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract) (mọi
contract mang version tường minh `<name>/v<N>`). Tài liệu này là bản chốt
bằng văn xuôi hợp nhất những gì `str46-io-contract` đã dựng qua ba lát —
không phải code runtime mới, không lặp lại chi tiết cài đặt đã có trong
`docs/specs/work-state.md`/`docs/specs/runner.md`.

**Mục tiêu:** một transport MỚI (terminal, pane, chat, web, thứ chưa nghĩ
ra) cắm vào chỉ bằng cách dịch transport→verb (chiều vào) và đọc envelope/sổ
verb (chiều ra) — không mở đường ghi riêng, không phải đoán hình dạng output
bằng cách đọc mã.

## 2. Input Direction Verb And Identity

### Single Write Door

Mọi thao tác ghi đi qua đúng **một cửa**: gọi verb của `bin/fgos.mjs`
(CTR001/CTR002). Không có đường ghi thứ hai vào `.fgos/`.

### Writer Identity

Mỗi sự kiện ghi qua ba cửa ghi chính (`work.move`, `work.edit`, `work.step`)
mang thêm một trường **writer** — object lồng đúng hai trường con, `id` và
`source`. Đây là một khái niệm MỚI, tách bạch có chủ ý khỏi `role`
(Data Dictionary #14, xem "Bản ghi settlement" trên): `role` trả lời "người
gọi thuộc LOẠI nào" (`human`/`runner`/`session`/`system`), còn `writer`
trả lời "người gọi là CÁ THỂ nào" — phân biệt được hai phiên agent cùng chạy
song song, cùng mang `role: session` nhưng là hai tiến trình khác nhau
(per str46-io-contract). The gates[id] projection derived from `work.move` events carries CTR004/v1 version token through the `SCHEMA_VERSION` field of the source event, per str46-io-contract.

`writer.id` là chuỗi hoặc số định danh tiến trình ghi. `writer.source` nói
độ tin của giá trị đó — KHÔNG phải một trường độc lập, mà đi kèm bắt buộc với
`id`:

Mỗi lần ghi mang thêm một trường danh tính người/tiến-trình gọi, `writer`:

**Đây là quy thuộc, không phải xác thực** (D1): CLI local không xác thực
được ai đang gọi nó — ai chạy được `fgos` thì đã ghi thẳng vào `.fgos/`
được. Cổng này mua về dấu vết audit + chống nhầm giữa các phiên, không mua
về an ninh. Do đó **caller chưa xác danh KHÔNG bị chặn** gọi verb ghi — D9
chọn ghi-không-chặn để không gãy luồng người gõ tay/CI đang chạy; chặn thật
thuộc tầng phân quyền (STR38) và cửa mạng của daemon tương lai (STR48), cả
hai nằm NGOÀI hợp đồng này.

### Writer Source Trust Levels

| source | Ý nghĩa | Độ tin |
|---|---|---|
| `registry` | `id` khớp một phiên đang sống trong sổ đăng ký phiên của fgOS (`.fgos/sessions.json`) | Cao nhất — do chính fgOS cấp và xác nhận |
| `env` | `id` lấy từ biến môi trường phiên agent (`FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID`), nhưng KHÔNG khớp phiên nào đang sống trong sổ đăng ký | Trung bình — ai cũng tự set được biến môi trường |
| `pid` | Không có biến môi trường phiên nào hợp lệ; suy đoán tốt-nhất từ pid một tổ tiên tiến trình gần (terminal tay gõ) | Thấp — best-effort, có thể trùng giữa hai pane cùng shell |
| `unresolved` | KHÔNG một nguồn nào xác nhận được; `id` vẫn là pid của chính tiến trình ghi (KHÔNG BAO GIỜ rỗng/vắng mặt) — `unresolved` là một NHÃN XUẤT XỨ, không phải danh tính vắng mặt (per str46-io-contract) | Không xác định |

- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song
  song), luôn có mặt.
- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu
  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·
  `env` (biến môi trường, ai cũng set được) · `pid` (dò ngược tiến trình cha,
  best-effort) · `unresolved` (không nguồn nào xác nhận được — `id` vẫn là
  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn
  `source` nói giá trị chưa kiểm chứng được).

### Writer Resolution Rules

**Registry chỉ ĐỐI CHIẾU, không bao giờ tự cấp danh tính** (per str46-io-contract): giá trị `id` lấy từ biến môi trường luôn giữ nguyên bất
kể sổ đăng ký có khớp hay không — sổ đăng ký chỉ nâng độ tin (`source`) khi
khớp, không bao giờ đổi hay tạo ra `id`. Một dòng sổ đăng ký KHÔNG BAO GIỜ
khớp theo thư mục làm việc hay theo pid của chính dòng đó — chỉ khớp đúng
`id` với `sessionId` của dòng — vì khớp theo thư mục sẽ gộp hai phiên khác
nhau trong cùng một worktree thành một danh tính, phá đúng mục đích khoá
hoạt động cây chính (xem spec Runner "Khoá hoạt động cây chính").

Một giá trị `id` sai định dạng (ký tự lạ, quá dài) bị LOẠI ở tầng phân giải
và rơi xuống nguồn kế tiếp — KHÔNG BAO GIỜ ném lỗi, KHÔNG BAO GIỜ chặn verb
(per str46-io-contract); không có validator nào đứng trên đường ghi
`writer`. `writer` fold lên item KHÔNG ĐIỀU KIỆN, GHI ĐÈ mỗi lần (latest-wins)
— khác khuôn "cộng thêm không đè" của outcome/friction/settlement, vì đây là
danh tính của LẦN GHI GẦN NHẤT, không phải một chuỗi lịch sử cần giữ mọi lần.
Item chưa từng qua tính năng này không mang `writer` — vắng mặt hoàn toàn,
tương thích ngược (RUL11 (tiến hóa schema)). Cơ chế phân giải đầy đủ (thứ tự nguồn, khoá hoạt động cây chính dùng cùng danh tính này): spec Runner RUL49 (compound-learning đổi trục: từ stage sang status retrospective).

### Caller Role

Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`
— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ
tư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,
không do ai quyết định). `role` và `writer` tách bạch: một cái nói "ai gây
ra", một cái nói "loại gì gây ra".

## 3. Output Direction Unified Envelope

### Envelope Shape

**Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất
thay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:
`contract` (tên+phiên bản chuẩn phong bì), `generated_at` (thời điểm in),
`data_hash` (dấu vân tay của dữ liệu — bên đọc biết dữ liệu đổi chưa mà không
cần so từng trường), và `data` (dữ liệu thật của verb đó). Dữ liệu trong `data`
là **có cấu trúc** (các trường tên rõ nghĩa), không phải câu xác nhận cho người:
verb đọc (`list`/`ready`/`check`/…) trả thẳng đối tượng kết quả; verb ghi trả
đúng những trường nó vừa đổi (ví dụ chuyển trạng thái trả `{id, from, to, seq}`)
— nhờ vậy một surface bất kỳ đọc kết quả bằng MỘT bộ đọc chung, không phải dò
regex trên chữ. Phong bì được đóng tại **một cửa in duy nhất**, nên không verb
nào lọt lưới và không có hai cách in khác nhau.

Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,
`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra
`stdout`:

```
{ contract: 'fgos.v1', generated_at, data_hash, data }
```

`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho
người — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những
trường vừa đổi. Đường lỗi KHÔNG bọc phong bì: chẩn đoán đi `stderr`, thành/
bại phân biệt bằng **exit code**, không bao giờ bằng nội dung chuỗi.

### Error Path Is Not Enveloped

**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;
khi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi
(stdout=dữ liệu, stderr=chẩn đoán) — bên gọi phân biệt thành/bại bằng mã thoát,
không phải bằng việc dò nội dung phong bì.

### Runner Stdout Envelope

**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của
mỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều
dòng như trên, vì một tiến trình `--watch` phát nhiều phong bì nối tiếp theo
thời gian; chi tiết đầy đủ + các luồng output khác nằm ngoài phong bì: xem spec
Runner RUL61 (writer — danh tính người ghi, tách bạch khỏi vai, không bao giờ chặn verb).

**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in
nhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`
hoặc mỗi chu kỳ `--watch`, liền một dòng** — vì `--watch` phát nhiều phong
bì nối tiếp theo thời gian, mỗi cái phải trọn trong đúng một dòng để bên
đọc tách được cái này với cái kia; con trỏ (dưới) áp dụng cùng lý do.

### Recognizing A Real Envelope

**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm
`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd "dòng
bắt đầu bằng `{`"), vì luồng progress-trace của `fgos-runner` (xem "Ngoại
lệ có lý do" dưới) có thể tự chứa output của trợ lý bắt đầu bằng `{`.

## 4. Exit Codes

`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·
4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail ·
9 merge-fail) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của
runner) là bảng DUY NHẤT. 0 = ok, 1 = bất ngờ (mọi thứ chưa phân loại).
Consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp.

## 5. Reasoned Envelope Exceptions

Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung
đúng một chữ, "ngoại lệ có lý do", không gọi tuỳ hứng theo từng chỗ:

1. **Sổ verb máy-đọc** (`--help`/`--help --json`, kể cả `<verb> --help`) —
   siêu dữ liệu về CLI, không phải payload của một verb.
2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh
   qua cờ `--pretty`, không phải payload mặc định.
3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`
   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.
4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán
   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle
   "watch mode stopped" khi nhận tín hiệu dừng) — in console y nguyên như
   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.
5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —
   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,
   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,
   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host.

**Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)
NẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không
phải cửa ra tới người.

## 6. Cursor Pagination

**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-
scoping/CONTEXT.md`).** Sổ verb khai thêm cờ `paginated` (đúng/sai) cho
MỌI verb — chỉ bốn verb mang `paginated: true`: `ready`, `triage`,
`evolve` (lượt liệt-kê không cờ của nó), và khoá `work` của `list`. Bốn
verb này nhận thêm hai tham số tuỳ chọn `--cursor`/`--limit`: không
truyền cờ nào → kết quả y hệt hôm nay (mảng/map đầy đủ, không đổi hình
dạng) — NGOẠI LỆ DUY NHẤT: `list --all --json` không kèm `--cursor`/
`--limit` giữ nguyên hình dạng thô này VĨNH VIỄN, vì `packages/herdr-fgos-common/rust/src/
fgos.rs` (crate Rust ngoài repo Node này) đọc đúng lời gọi đó làm hợp
đồng công khai. Mọi tổ hợp KHÁC của `list` (mặc định trần không cờ nào,
`--id`, hoặc bất kỳ tổ hợp nào có `--cursor`/`--limit` — kể cả kèm
`--all`) đều thu hẹp `decisions`/`discovery`/`gates`/`settlements`/
`outcomes`/`frictions`/`learnings`/`decisionsById` xuống đúng tập id đang
thật sự được trả trong `work` — `tools` (khoá theo TÊN công cụ, không
theo id việc) không bao giờ bị đụng tới. Với ba verb còn lại (`ready`/
`triage`/`evolve`), truyền một trong hai `--cursor`/`--limit` → kết quả
đổi hình dạng thành `{items, nextCursor}`. Con trỏ (`cursor`) là **đục
hoàn toàn** —
người gọi chỉ nhận lại nguyên văn từ `nextCursor` của lượt trước rồi truyền
tiếp, không bao giờ tự phân tích hay tự chế. `nextCursor` là `null` khi đã
tới cuối tập. Một con trỏ trỏ tới một mục đã rời tập (vd việc đã `done` từ
lượt trước) là lỗi phạm trù `validation` — thông điệp lỗi tự nêu cách sửa
(bắt đầu lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang
(`paginated: false`, lý do ghi ngay trong mô tả verb) — mỗi dòng của nó là
một cặp `(a,b)`, không có khoá riêng cho một dòng để làm mốc con trỏ.

Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:
`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá
`work`. Không truyền `--cursor`/`--limit` → kết quả đầy đủ, y hệt không có
tính năng này. Truyền một trong hai → kết quả đổi hình dạng thành
`{items, nextCursor}`. Con trỏ là một chuỗi đục hoàn toàn — sinh bởi máy
chủ, người gọi chỉ trả lại nguyên văn, không bao giờ tự phân tích hay tự
chế. `nextCursor` là `null` khi đã tới cuối tập. Một con trỏ trỏ tới mục đã
rời tập là lỗi phạm trù `validation`, thông điệp tự nêu cách sửa (bắt đầu
lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang — mỗi dòng của
nó là một cặp `(a,b)`, không có khoá riêng cho một dòng.

Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt
trên MỌI verb).

## 7. Machine-Readable Verb Registry

### Manifest Shape

CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng
máy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành
`'2.0'`, per str46-io-contract — tăng từ `'1.0'` vì một trường bị xoá,
xem ngay dưới), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,
lược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một
listener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì
hard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc
trong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ
giúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với
một tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của
`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb
đánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in
dòng "positional: `<tên>`" cho tham số này, KHÔNG BAO GIỜ in nhầm thành
"required: `--<tên>`" như một cờ thật — một tham số vừa nhận positional vừa
nhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc)).

`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố
toàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest
thay vì hard-code từng verb. `schema_version` hiện `'2.0'` (tăng từ `'1.0'`
vì trường `access` bị xoá). Mỗi mục verb mang:

### Entry Fields And Effect Axes

**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`
đơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —
lộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một
PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
có bao giờ gọi một dịch vụ ngoài fgOS hay không — xem `fgos --help --json` cho danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`, `coordination` — dispatch executor thật tính là effect ngoài `.fgos/`);
`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
(backlog STR38).

- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`
  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata
  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).
- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và
  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục
  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,
  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
  bản thân `review` không hề ghi trạng thái). Xem `fgos --help --json` cho
  danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`,
  `coordination` — dispatch executor thật tính là effect ngoài `.fgos/`).
- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.

Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa
nối vào điều phối hay xác danh; cổng "ai được nói verb nào" thuộc STR38.

## 8. Multi-Value Flag Convention

**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm
trường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham
số nào mang nhiều giá trị — trước đây khác biệt này chỉ nằm trong văn xuôi
mô tả, không đọc được bằng máy. `deps`, `refs`, `footprint`, `targets` mang
`multiValueFormat: 'csv'` (phân tách bằng dấu phẩy). `acceptance` mang
`multiValueFormat: 'json-array'` (chuỗi JSON-hoá, CỐ Ý không phẩy vì văn
bản một clause có thể tự chứa dấu phẩy). Tham số không mang nhiều giá trị
không có trường này.

Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách
dấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi
JSON-hoá — `acceptance`, CỐ Ý không phẩy vì văn bản một clause có thể tự
chứa dấu phẩy). Trước STR46, khác biệt này chỉ nằm trong văn xuôi mô tả;
nay đọc được bằng máy.

## 9. Per-Verb Help

Gọi `--help` (không kèm `--json`) SAU tên một verb cụ thể (vd `fgos submit
--help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,
ví dụ) — không phải toàn bộ sổ verb. Áp dụng ĐỒNG NHẤT cho mọi verb, kể cả
`init`.

- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào
  trong sổ verb.
- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp
  riêng.
- **What changes:** không gì — đây là thao tác chỉ-đọc, không ghi sự kiện,
  không đổi bản chiếu, không có tác dụng phụ nào (kể cả với `init` — gọi `fgos
  init --help` KHÔNG chạy `init` thật, không tạo `.fgos/`).
- **Side effects:** không có, cho MỌI verb kể cả những verb thường có tác
  dụng phụ khi gọi thật (vd `init`).
- **Afterwards:** người gọi thấy đúng mục trợ giúp của verb đã nêu tên, thoát
  mã 0 — không bao giờ thoát ở phạm trù lỗi (mã 4) vì thiếu tham số bắt buộc,
  dù tham số đó có mặt hay không (per str77-79-doc-gap-fixes / ea8b9a8d — RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ)).

## 10. Version Tokens

Theo [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract): mỗi
contract mang version tường minh trong định danh của chính nó.

| Bề mặt | Token | Hiện thân |
|---|---|---|
| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |
| Stdout của `fgos-runner` (CTR003, riêng phần bề mặt ra) | dùng lại `fgos.v1` | KHÔNG đúc token CTR003 riêng — bề mặt này tái dùng đúng cơ chế `fgos.v1` của CTR001 |
| Sổ verb (manifest) | `2.0` | field `schema_version` trong `{schema_version, commands[]}` |
| Sự kiện (event log) | `3` | field `v` trên mỗi event, `SCHEMA_VERSION` (`work.mjs`) |
| `gates[id]` (ask/answer, CTR004) | `CTR004/v1` | hiện thân qua `SCHEMA_VERSION` của sự kiện `work.move` nó fold ra — KHÔNG một field version riêng (thêm field thứ hai cho cùng dữ liệu phá DRY) |

CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,
dán version lên thứ chưa chạy là đóng dấu cho giả định.

## 11. Scope Boundary

STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ
động (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có
nhà riêng:

- **Chiều-ra khởi-xướng ("cần bạn")** — một kênh attention/push có
  delivery-semantics riêng (at-least-once, dedup, routing, ack,
  escalation) — thuộc STR48, sống ở consumer/daemon, KHÔNG phải core fgOS.
- **Increment terminal/pane + chat item-scoped** — thuộc STR83/STR38.
- **Tầng phân quyền** ("ai được gọi verb nào", caller chưa xác danh có bị
  chặn hay không) — thuộc STR38.

Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ
ý: chỉ vế "có một spec hợp đồng in/out tự-mô-tả" là việc của STR46; hai vế
còn lại (chiều-ra khởi-xướng, increment terminal/pane) thuộc PBI khác.

Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập
CLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi
hành vi), và khối `fgos-discovered` (giao thức worker→runner, không phải
cửa ra tới người).

## 12. References

`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·
`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·
`docs/specs/work-state.md` §envelope, §Sổ verb máy-đọc, §Danh tính người
ghi (chi tiết trường/hành vi) · `docs/specs/runner.md` RUL61 (envelope
stdout runner) · `docs/architecture-map.md` CTR001/CTR003/CTR004 (sổ đăng
ký contract) · `docs/history/str46-io-contract/` (CONTEXT.md 37 quyết định
khoá, plan.md bốn lát).

## 13. Related Files

- [Work State portal](../README.md)
- [Work State spec](../spec.md)
- [Retired decision history](../decisions/retired-decision-history.md)
- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)
- [Legacy source: docs/io-contract.md](../../../io-contract.md)
