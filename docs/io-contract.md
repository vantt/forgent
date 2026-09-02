# Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`

Hợp đồng giao tiếp VÀO/RA hạng nhất cho bề mặt CLI của fgOS (`bin/fgos.mjs`)
và bề mặt stdout của vòng tự hành (`bin/fgos-runner.mjs`), theo record
[0014](decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md) (kiến trúc cửa, đã
khoá) và [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md) (mọi
contract mang version tường minh `<name>/v<N>`). Tài liệu này là bản chốt
bằng văn xuôi hợp nhất những gì `str46-io-contract` đã dựng qua ba lát —
không phải code runtime mới, không lặp lại chi tiết cài đặt đã có trong
`docs/specs/work-state.md`/`docs/specs/runner.md`.

**Mục tiêu:** một transport MỚI (terminal, pane, chat, web, thứ chưa nghĩ
ra) cắm vào chỉ bằng cách dịch transport→verb (chiều vào) và đọc envelope/sổ
verb (chiều ra) — không mở đường ghi riêng, không phải đoán hình dạng output
bằng cách đọc mã.

## Chiều vào — verb + danh tính

Mọi thao tác ghi đi qua đúng **một cửa**: gọi verb của `bin/fgos.mjs`
(CTR001/CTR002). Không có đường ghi thứ hai vào `.fgos/`.

Mỗi lần ghi mang thêm một trường danh tính người/tiến-trình gọi, `writer`:

- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song
  song), luôn có mặt.
- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu
  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·
  `env` (biến môi trường, ai cũng set được) · `pid` (dò ngược tiến trình cha,
  best-effort) · `unresolved` (không nguồn nào xác nhận được — `id` vẫn là
  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn
  `source` nói giá trị chưa kiểm chứng được).

**Đây là quy thuộc, không phải xác thực** (D1): CLI local không xác thực
được ai đang gọi nó — ai chạy được `fgos` thì đã ghi thẳng vào `.fgos/`
được. Cổng này mua về dấu vết audit + chống nhầm giữa các phiên, không mua
về an ninh. Do đó **caller chưa xác danh KHÔNG bị chặn** gọi verb ghi — D9
chọn ghi-không-chặn để không gãy luồng người gõ tay/CI đang chạy; chặn thật
thuộc tầng phân quyền (STR38) và cửa mạng của daemon tương lai (STR48), cả
hai nằm NGOÀI hợp đồng này.

Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`
— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ
tư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,
không do ai quyết định). `role` và `writer` tách bạch: một cái nói "ai gây
ra", một cái nói "loại gì gây ra".

## Chiều ra — envelope thống nhất

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

**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in
nhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`
hoặc mỗi chu kỳ `--watch`, liền một dòng** — vì `--watch` phát nhiều phong
bì nối tiếp theo thời gian, mỗi cái phải trọn trong đúng một dòng để bên
đọc tách được cái này với cái kia; con trỏ (dưới) áp dụng cùng lý do.

**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm
`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd "dòng
bắt đầu bằng `{`"), vì luồng progress-trace của `fgos-runner` (xem "Ngoại
lệ có lý do" dưới) có thể tự chứa output của trợ lý bắt đầu bằng `{`.

### Mã thoát (exit code) — một nguồn duy nhất

`src/state/store.mjs`'s `EXIT_CODES` (2 precondition · 3 conflict ·
4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail ·
9 merge-fail) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của
runner) là bảng DUY NHẤT. 0 = ok, 1 = bất ngờ (mọi thứ chưa phân loại).
Consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp.

### Ngoại lệ có lý do

Bốn luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung
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

**Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)
NẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không
phải cửa ra tới người.

### Phân trang — con trỏ đục

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

## Sổ verb máy-đọc — CLI tự mô tả

`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố
toàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest
thay vì hard-code từng verb. `schema_version` hiện `'2.0'` (tăng từ `'1.0'`
vì trường `access` bị xoá). Mỗi mục verb mang:

- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`.
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

### Quy ước cờ nhiều-giá-trị

Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách
dấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi
JSON-hoá — `acceptance`, CỐ Ý không phẩy vì văn bản một clause có thể tự
chứa dấu phẩy). Trước STR46, khác biệt này chỉ nằm trong văn xuôi mô tả;
nay đọc được bằng máy.

## Version token

Theo [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md): mỗi
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

## Ranh giới — điều gì KHÔNG thuộc hợp đồng này

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

## Tham chiếu

`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·
`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·
`docs/specs/work-state.md` §envelope, §Sổ verb máy-đọc, §Danh tính người
ghi (chi tiết trường/hành vi) · `docs/specs/runner.md` RUL61 (envelope
stdout runner) · `docs/architecture-map.md` CTR001/CTR003/CTR004 (sổ đăng
ký contract) · `docs/history/str46-io-contract/` (CONTEXT.md 37 quyết định
khoá, plan.md bốn lát).
