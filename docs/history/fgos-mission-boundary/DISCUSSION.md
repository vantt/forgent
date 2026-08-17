# fgOS mission boundary — DISCUSSION

Item: tsk-4us

## 1. Trạng thái hiện tại

Vòng 1 — vừa scout xong, chưa chốt gì. Đã trình bày cho người dùng: 3 pattern
liên quan từ upstream `beegog` (đã distill sẵn, chưa port), 3 mẩu bằng chứng
sống trong chính forgent (README's mission framing, `docs/distribution-vision.md`
D§1, backlog STR25), và 1 bug thật đang mở (tsk-4us's dependency-candidate bị
từ chối, `tsk-1js`) chứng minh sự lẫn lộn đang gây hại thật. Đang chờ người
dùng phản hồi trên khung đặt câu hỏi: đây là bậc thứ 5 của CÙNG danh sách ưu
tiên `0030`, hay một trục hoàn toàn khác (tách biệt priority-ordering khỏi
role/scope-ownership) đứng cạnh nó?

## 2. Mục tiêu & đề bài

fgOS được tạo ra để phục vụ hai vai trò bên ngoài chính nó — (1) làm nền tảng
để phát triển các project khác, và (2) làm nền tảng để vận hành các business
base workflow — chứ không phải để tự phát triển chính nó là sứ mệnh chính;
tự-phát-triển chỉ là một hoạt động dogfood cần thiết trong lúc xây, không
phải mục đích tồn tại. Trong thực tế vận hành, các agent làm việc trong chính
repo `forgentX` này (nơi fgOS vừa là công cụ vừa là sản phẩm đang được xây)
liên tục rơi vào việc coi "phát triển fgOS" là trung tâm, vì đó là công việc
trước mắt cụ thể nhất — trong khi hai vai trò 1/2 mới là lý do fgOS tồn tại.
Cần một điểm neo tường minh, nạp always-loaded (giống 4 bậc ưu tiên sản phẩm ở
`docs/decisions/0030`), phân định rõ ranh giới này, để mọi quyết định thiết
kế/kỹ thuật (gate an toàn, cấu hình, ưu tiên backlog) tự hỏi đúng câu "việc
này phục vụ ai" trước khi làm — học theo cách upstream `beegog` (bee) đã tự
đúc kết ranh giới này qua nhiều va vấp thật của chính họ.

## 3. Vấn đề rõ / chưa rõ

| # | Câu hỏi | Trạng thái | Ghi chú |
|---|---|---|---|
| Q1 | Ranh giới self-vs-host này là bậc #5 của CÙNG danh sách ưu tiên 0030, hay một trục khác đứng riêng (role/scope) không cùng chiều với priority-ordering? | chưa rõ | Đang chờ người dùng — xem phân tích trong Q&A log vòng 1 |
| Q2 | Cơ chế thực thi: chỉ là văn bản doctrine (đọc rồi tự giác), hay có phần MÁY kiểm được (như bee's `product_root` config, `evolving-loop-two-gates` — self-mod chỉ chạy khi mechanically gated)? | chưa rõ | beegog cho thấy văn bản không đủ — họ có cả config-key + gate cơ học |
| Q3 | forgentX hiện là single-repo (fgOS vừa là harness vừa là sản phẩm) — có cần thật sự tách `product_root`/repo-divorce (bee's pattern) hay chỉ cần văn bản phân vai rõ hơn cho tới khi có host-project thật để dogfood? | chưa rõ | Liên quan STR25 (dogfood tự-phát-triển) đã ghi nhận topology "xưởng điều phối" nhưng chưa mechanize |
| Q4 | tsk-1js (Iron Law hard-code module path của chính fgOS, im lặng bỏ qua host project) — có nên là ví dụ neo/case-study trong tài liệu vision này không, dù không gắn dependency? | chưa rõ | Người dùng đã chọn KHÔNG gắn dependency; nhưng dùng làm ví dụ minh hoạ trong prose là việc khác |
| Q5 | Vị trí vật lý: decision mới trong `docs/decisions/` (số kế tiếp sau 0034) + trỏ từ AGENTS.md, hay một luật L-mới trong `docs/platform-foundations.md` (cạnh L8 doctrine placement / L9 run≠merge≠durable), hay cả hai? | chưa rõ | Phụ thuộc câu trả lời Q1 |

## 4. Quyết định đã chốt

*(chưa có D-ID nào ổn định qua hơn một vòng — bảng này sẽ điền khi có)*

## 5. Q&A log

### Vòng 1 — 2026-08-17

**Scout đã làm** (trước khi hỏi, theo đúng kỷ luật scout-first):

- Đọc `docs/distillery/sources/beegog.md` (đã distill sẵn, không re-scan từ
  nguồn) — 4 pattern liên quan trực tiếp:
  - `evolving-loop-two-gates` (dòng 620-624): vòng tự cải tiến của bee CHỈ
    chạy trong repo bee, guard cơ học, không bao giờ auto/schedule — tự sửa
    mình là lane kỷ luật cao nhất, không phải mặc định.
  - `grooming-project-first` (dòng 626-630, decision 0014 của bee): tách
    tường minh "dọn nhà mình" (harness) khỏi "dọn nhà chủ" (host project);
    `.bee/`, `.claude/` không bao giờ tính là nợ của project chủ; tránh
    "harness tự soi rốn".
  - `zero-dep-vendored-helpers` (dòng 492-496): toàn bộ máy móc bee vendor
    thẳng vào host repo (`.bee/bin/` + `lib/`) — kiến trúc mặc định là
    SỐNG TRONG và PHỤC VỤ project khác, không phải app tự-phát-triển đứng
    riêng.
  - `product-root-repo-divorce-topology` (dòng 580-584, "repo-divorce"):
    config `product_root` cho `.bee/` ngồi TRÊN một product repo lồng bên
    trong, resolve tài liệu SẢN PHẨM tách khỏi history/state của chính bee
    — ranh giới cấu trúc, không phải quy ước bằng lời.
- Đọc `docs/distillery/porting-log.md` — `product-root-repo-divorce-topology`
  (dòng 105) đã ghi là `candidate`, CHƯA port: "forgent ĐANG chạy đúng
  topology này (workshop root + `./repo` độc lập) nhưng bằng quy ước — bee
  có config-key + resolution cơ học." Tức: forgent đã từng công nhận đúng
  hướng này nhưng chưa mechanize.
- Đọc `README.md` — mission statement hiện tại của forgent đã đúng hướng
  1/2 ("the infrastructure, skills, and automation that sit beneath every
  agent app, so developers can forge new agents instead of building
  everything from scratch") — nhưng đây chỉ là văn bản mô tả, không phải
  luật always-loaded ép hành vi agent khi làm việc.
- Đọc `docs/distribution-vision.md` §1 — tự thừa nhận: "fgOS đang được
  dogfood ngay trên chính repo tạo ra nó. Muốn tái sử dụng fgOS ở
  project/máy khác... phải ổn định trước." Xác nhận tình trạng hiện tại
  (self-referential) và đích thật (tái dùng ở nơi khác) đã được biết tới,
  nhưng chưa có luật standing-sheet nào ép ưu tiên đích đó khi ra quyết
  định hàng ngày.
- Đọc `docs/backlog.md` — STR25 ("Mốc dogfood tự-phát-triển: dùng fgos tại
  xưởng điều phối phát triển chính fgos sản phẩm — thay vai bee hiện tại,
  xưởng điều phối, `./repo` là đối tượng") xác nhận forgent đã từng mô
  phỏng khái niệm "xưởng điều phối vs đối tượng bị điều phối" của bee,
  nhưng trong triển khai thật hiện tại forgentX là single-repo — fgOS vừa
  là xưởng vừa là đối tượng, đúng cái gây lẫn lộn người dùng đang chỉ ra.
- Kiểm `fgos list --json` tìm dependency candidate textually-grounded cho
  item mới — tìm thấy `tsk-1js` (Iron Law's `MODULE_RULES` hard-code path
  của chính fgOS, không nhận diện module của project khác dùng fgOS — 4 ca
  thực nghiệm Next.js/Python/Go/Rails đều `required: false` sai). Trình
  bày cho người dùng, hỏi confirm/edit/reject theo đúng protocol submit —
  **người dùng chọn reject, để độc lập** (giữ vision là quyết định định
  hướng tách khỏi bug kỹ thuật cụ thể).
- Đọc `docs/platform-foundations.md` L8 (doctrine placement rule) và L9
  (run≠merge≠durable, "cùng một sự việc, hai câu hỏi khác nhau") — mẫu
  hình để tách hai câu hỏi khác trục dù cùng liên quan một sự việc; và
  "Trình tự thi công" cuối file không đề cập gì tới self-vs-host, xác nhận
  đây thật sự là một khoảng trống chưa từng được đặt tên.

**Phân tích trình bày cho người dùng** (trước khi hỏi Q1 ở bảng §3):

fgOS hiện có ĐÚNG một câu văn bản diễn đạt mission 1/2 (README), một tự thừa
nhận tình trạng self-referential tạm thời (`distribution-vision.md`), một
dấu vết ý tưởng đã vay mượn từ bee nhưng chưa mechanize (STR25), và một bug
thật đang mở chứng minh hậu quả cụ thể của lẫn lộn này (tsk-1js: gate an
toàn chỉ nhận diện chính module fgOS). Không có ai trong số này là một LUẬT
always-loaded ép agent tự hỏi "việc này phục vụ ai" — khác hẳn 4 bậc ưu tiên
`0030` vốn đã là standing sheet.

Quan sát quan trọng từ beegog: KHÔNG pattern nào trong 4 pattern liên quan
của họ là một "bậc ưu tiên" kiểu danh sách xếp hạng (Ship Faster > ... như
`0030`). Cả 4 đều là CƠ CHẾ — config-key cấu trúc (`product_root`), mặc định
kiến trúc (vendor-vào-host), và cổng kỷ luật (self-mod chỉ chạy trong repo
bee, 2 gate người). `0030`'s 4 bậc trả lời câu "khi hai giá trị xung đột, ưu
tiên cái nào" (tốc độ vs chờ người vs done vs polish — CÙNG một trục, khác
mức độ). Câu người dùng đang hỏi là khác hẳn: "việc NÀY đang phục vụ đối
tượng nào" — không phải mức độ ưu tiên giữa hai giá trị cùng loại, mà là
PHÂN LOẠI đối tượng trước khi bất kỳ ưu tiên nào ở trên còn áp dụng được.
Giống hệt cách `docs/platform-foundations.md` L9 tách riêng "run-complete
vs merge-complete vs durable" khỏi L7's "durability ladder" dù cùng nói về
một sự việc — hai câu hỏi khác trục không nên gộp vào một danh sách xếp
bậc duy nhất, kẻo làm danh sách đó vừa lẫn hai loại reasoning khác nhau
(ordering vs classification), vừa khiến "bậc 5" bị đọc nhầm là có thể bị
"bậc 4 polish" ghi đè theo đúng luật "bậc dưới không ghi đè bậc trên" của
`0030` — trong khi thực ra ranh giới self-vs-host phải áp dụng TRƯỚC cả 4
bậc kia, không phải đứng dưới chúng.

→ Câu hỏi Q1 đưa ra cho người dùng: coi đây là bậc ưu tiên thứ 5 nối vào
`0030` (đơn giản, nhất quán vị trí văn bản, nhưng trộn hai loại reasoning),
hay một luật riêng — ví dụ một `docs/decisions/003x` mới + một mục
`platform-foundations.md` L-mới — đứng CẠNH (không phải TRONG) danh sách 4
bậc, được AGENTS.md trỏ tới ngay sau đoạn "Product priority order" hiện có
(khớp đúng nghĩa "đứng sau" người dùng dùng, mà không cần là phần tử thứ 5
của cùng một list)?
