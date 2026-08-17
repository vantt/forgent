# fgOS mission boundary — DISCUSSION

Item: tsk-4us

## 1. Trạng thái hiện tại

Vòng 3. **D1 đã chốt** (self-vs-host là trục riêng, đứng cạnh `0030`, không
phải bậc #5). **Q3 đã chốt** (không mechanize repo-divorce — fgOS đã thử và
chủ động bỏ mô hình workshop+repo-lồng của bee, `forgent-workshop` là thí
nghiệm của bee-upstream, không thuộc dòng lịch sử forgentX). Đang mở **Q6**
(mới): với repo-divorce bị loại, đề xuất ranh giới được nhận diện bằng
design-intent per quyết định (không phải path/file) — chờ người dùng xác
nhận trước khi viết §6. Q2 (cơ chế máy) còn treo một phần: đã biết bee làm
gì, nhưng CHƯA quyết fgOS áp bao nhiêu trong 3 tầng đó khi path-based
(product_root) đã loại. Q4 (tsk-1js làm case study) và Q5 (vị trí vật lý:
decisions/ + platform-foundations L-law) vẫn mở.

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
| Q1 | ~~Ranh giới self-vs-host này là bậc #5 hay trục riêng?~~ | **CHỐT — D1** | Chuyển sang §4 |
| Q2 | Cơ chế thực thi: chỉ là văn bản doctrine, hay có phần MÁY kiểm được? | **trả lời: có, chi tiết ở §5 vòng 2** | bee dùng 3 tầng: state-transition guard (`chain-integrity-guard-tail`), config key (`product_root`), digest-on-close + 2 human gate (`evolving-loop-two-gates`) — nhưng KHÔNG áp thẳng nguyên khối vì Q3 vừa loại bỏ hướng repo-divorce, xem Q6 |
| Q3 | forgent-workshop ↔ forgentX quan hệ gì? | **trả lời: KHÔNG liên quan, đường đã bỏ** | `~/projects/forgent` là sản phẩm được phát triển TRONG workshop của chính bee-upstream (thí nghiệm của bee, không phải của fgOS). fgOS/forgentX CHƯA TỪNG phát triển theo mô hình workshop+repo-lồng — người dùng đã thử và tách riêng vì "quá nhiều vấn đề"; không rõ bee đã cải thiện chế độ này tới đâu. **Kết luận:** vision này KHÔNG đề xuất mechanize `product_root`/repo-divorce cho forgentX — đó là hướng đã thử và cố ý từ bỏ, không phải chưa thử tới |
| Q4 | tsk-1js (Iron Law hard-code module path của chính fgOS, im lặng bỏ qua host project) — có nên là ví dụ neo/case-study trong tài liệu vision này không, dù không gắn dependency? | chưa rõ | Người dùng đã chọn KHÔNG gắn dependency; nhưng dùng làm ví dụ minh hoạ trong prose là việc khác |
| Q5 | Vị trí vật lý: decision mới trong `docs/decisions/` (số kế tiếp sau 0034) + trỏ từ AGENTS.md, hay một luật L-mới trong `docs/platform-foundations.md` (cạnh L8 doctrine placement / L9 run≠merge≠durable), hay cả hai? | chưa rõ | D1 đã chốt "đứng riêng cạnh" → gợi ý cả hai (decision ghi QUYẾT ĐỊNH + WHY, platform-foundations ghi LUẬT ngắn always-loaded) nhưng chưa hỏi người dùng trực tiếp |
| Q6 | (MỚI vòng 3) Q3 loại bỏ repo-divorce → forgentX vẫn single-repo, self-dev và host-dev sống chung file. Vậy ranh giới được nhận diện bằng gì? Đề xuất: KHÔNG phải path/file nào bị đụng, mà là **design-intent per quyết định**: một thay đổi phục vụ fgOS-khi-vận-hành-repo-khác (mission 1/2) hay chỉ tiện cho chính đội fgOS làm việc (mission 3)? tsk-1js minh hoạ đúng: Iron Law LẼ RA là năng lực mission-1/2 (bảo vệ BẤT KỲ repo nào fgOS vận hành) nhưng bị code với tầm nhìn hẹp mission-3 (chỉ nhận diện path của chính fgOS). Người dùng có đồng ý khung "design-intent, không phải path" này không? | chưa rõ | Đang chờ phản hồi — xem phân tích trình bày trong chat trước khi hỏi |

## 4. Quyết định đã chốt

| D-ID | Nội dung | Lý do |
|---|---|---|
| D1 | Ranh giới mission self-vs-host là một trục quyết định riêng, đứng CẠNH (không nối vào làm bậc #5) danh sách 4 bậc ưu tiên sản phẩm `docs/decisions/0030` | `0030` trả lời "khi hai giá trị xung đột, ưu tiên cái nào" (cùng trục, khác mức). Câu hỏi self-vs-host là phân loại đối tượng phục vụ TRƯỚC KHI bất kỳ ưu tiên nào ở trên áp dụng được — khác trục. Người dùng xác nhận vòng 2, giữ nguyên không đổi sang vòng 3 (D4: đủ điều kiện mint). Ghi máy: `fgos decision` seq 18960 |

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

### Vòng 2 — 2026-08-17

**Người dùng trả lời:**
- Q1: "riêng đứng cạnh" — xác nhận hướng tách trục, không nối vào `0030`.
- Q2: "nói rõ hơn bee kiểm máy như thế nào" — yêu cầu đào sâu hơn, không
  chấp nhận mô tả rút gọn ở vòng 1.
- Q3: "chưa hiểu là làm việc gì, vì fgos đang vận hành nhiều project khác"
  — phản bác giả định nền của Q3 gốc.

**Scout thêm cho Q2** (đọc lại `docs/distillery/sources/beegog.md` đầy đủ
entry, không chỉ tóm tắt compressed):

- `chain-integrity-guard-tail` (dòng 408-413) — đây là mảnh MÁY THẬT gần
  nhất với "self-mod discipline" của bee, không phải `evolving-loop-two-gates`
  đơn thuần: đuôi chain (execution → scribing → compounding → terminal)
  được canh **tại cửa transition bằng code**, không bằng tên phase-string.
  3 luật cụ thể: (a) phase `compounding` KHÔNG settable trực tiếp — chỉ một
  lệnh `state scribing-run` thật sự chạy mới sinh ra được nó (producer thật,
  không phải giá trị enum ai cũng gõ được); (b) `scribing-run` tự nó bị từ
  chối trừ khi phase hiện tại chứng minh execution đã THẬT SỰ xảy ra; (c)
  `compounding-complete` (trạng thái đóng) bị chặn cứng khi spec-debt > 0,
  waiver phải ghi thành một decision bền, nêu rõ từng unit được miễn — không
  im lặng bỏ qua. Nguồn gốc: post-mortem một phiên thật đã "giả 7 lần close"
  bằng cách hand-edit phase string mà không hề chạy compounding — chứng
  minh "kiểm bằng enum suông" không đủ, phải kiểm PRODUCER.
- `evolving-loop-two-gates` (dòng 620-624, đã trích vòng 1) — vòng tự cải
  tiến cụ thể: digest tự sinh KHÔNG TỐN CÔNG khi một feature đóng → xếp
  hạng theo pain×frequency×corroboration → **Gate A** (người chọn cluster
  nào để sửa, không phải máy tự chọn) → fix áp qua kỷ luật viết-skill chuẩn
  (không sửa inline tuỳ tiện) → suite test phải xanh → **Gate B** (người
  duyệt diff thật trước khi merge) → push lên remote là MỘT bước tay có
  tên riêng, không tự động. Ràng buộc định vị: "chỉ chạy trong repo bee" —
  nghĩa đen là cơ chế này (đường dẫn config/detect repo) không kích hoạt
  khi bee đang vận hành trên MỘT project khác, chỉ khi đang vận hành trên
  chính source của bee.
- `product-root-repo-divorce-topology` (dòng 580-584, đã trích vòng 1) —
  config key `product_root` trong `.bee/config.json` (hoặc tương đương):
  khi SET, mọi lệnh cần đọc tài liệu SẢN PHẨM (`docs/backlog.md`,
  `docs/specs/`) resolve theo path đó thay vì theo root của chính `.bee/`
  — tách vật lý "tài liệu bee tự ghi về mình" khỏi "tài liệu về sản phẩm
  bee đang điều phối". Khi UNSET, mặc định coi bee-root cũng là product-root
  (trường hợp self-host, đúng tình huống forgentX hiện tại). Set mà path
  không tồn tại → cảnh báo to (fail-loud), không âm thầm rơi về mặc định.
- Tổng hợp cho Q2: bee không có MỘT cơ chế duy nhất, mà 3 tầng độc lập
  chồng lên nhau — (1) transition-guard tại state machine (chặn giả-đóng),
  (2) config-key tách đường dẫn đọc-tài-liệu (chặn nhầm tài liệu bee với
  tài liệu sản phẩm), (3) gate-người 2 lớp + giới hạn phạm-vi-repo cho riêng
  luồng tự-sửa-mình. Cả 3 đều KIỂM ĐƯỢC bằng code/test, không dựa vào agent
  tự giác đọc doctrine.

**Scout thêm cho Q3** (kiểm tra giả định "chưa có host project"):

- `fgos list --json` không đủ — kiểm trực tiếp máy: `find ~/projects
  -maxdepth 3 -iname ".fgos"` (không tính forgentX) → 4 kết quả thật:
  `mdview/.fgos`, `herdr-gateway/.fgos`, `fgos-test-drive/.fgos`,
  `forgent/repo/.fgos`. Cộng thêm `~/.fgos` (store toàn-máy) và global
  config `~/.fgos/config.json` có `bin.globalFgosPath` trỏ pnpm global bin
  — xác nhận fgOS ĐÃ cài global, ĐÃ chạy thật trên nhiều checkout khác
  nhau, không phải giả thuyết tương lai.
- `~/projects/forgent/package.json`: `{"name": "forgent-workshop", ...,
  "dependencies": {"forgent": "file:./repo"}}` — đây LÀ một bản triển khai
  thật của đúng topology `product-root-repo-divorce` (dù chưa chắc dùng
  chung field `product_root`): một package "xưởng" ngoài, phụ thuộc vào
  `./repo` (tên gói `forgent`) làm sản phẩm nested. `forgent/` còn giữ cả
  `.bee/` lẫn `.agents/`/`.claude/`/`.codex/` — cho thấy đây có thể là một
  bản thử nghiệm còn sống song song, không phải di tích đã bỏ.
- `forgentX/package.json`: tên gói cũng là `"forgent"`, version `0.1.0` —
  tức forgentX rất có thể LÀ (hoặc cùng dòng với) chính cái `forgent/repo`
  mà `forgent-workshop` đang coi là sản phẩm nested — nhưng ở đây, trong
  `forgentX`, không có xưởng ngoài nào bọc nó: fgOS tự vận hành trực tiếp
  trên chính source của mình, một checkout, không phân lớp.
- Kết luận sơ bộ cho Q3: giả định gốc ("forgentX chưa có host project để
  test") sai — sai vì hai lý do khác nhau cùng lúc. (a) fgOS đã có nhiều
  host project THẬT đang chạy ổn (mission 1/2 đã sống, không phải lý
  thuyết); (b) topology repo-divorce của bee cũng đã có một bản triển khai
  THẬT song song (`forgent-workshop`), chỉ là KHÔNG RÕ nó có phải đường
  chính thức hiện hành hay là một nhánh thử nghiệm cũ. Câu hỏi thật sự cần
  hỏi lại không phải "có cần mechanize không" mà là: phạm vi của vision này
  có nên NÓI GÌ về quan hệ `forgent-workshop` ↔ `forgentX`, hay giới hạn
  chặt vào đúng một câu hỏi hẹp hơn — khi một session đứng TRONG `forgentX`
  (single-repo, tự-host), làm sao phân biệt được lúc nào đang làm mission
  #3 (sửa fgOS) so với lúc nào đang thật ra phục vụ #1/#2 (fgOS-cho-host
  khác) — vì trong `forgentX` hai việc này KHÔNG tách được bằng cấu trúc
  thư mục như bee làm được nhờ `product_root`.

### Vòng 3 — 2026-08-17

**Người dùng trả lời Q3:** "`~/projects/forgent` là sản phẩm được phát
triển trong workshop của bee-upstream. fgOS chưa từng phát triển theo cách
này vì lúc trước sử dụng bee theo cách này có quá nhiều vấn đề nên tôi tách
riêng, không rõ giờ họ đã hỗ trợ chế độ này tốt chừng nào rồi."

**Xử lý:** D1 mint (Q1 giữ ổn định qua vòng 2→3, không bị sửa) — `fgos
decision` seq 18960, đã ghi ở §4. Q3 chốt: `forgent-workshop` là thí
nghiệm của CHÍNH bee-upstream, không nằm trong dòng lịch sử fgOS/forgentX
— fgOS đã thử mô hình workshop+repo-lồng và chủ động rút lui vì gặp vấn đề
thật, không phải vì chưa kịp thử. Hệ quả trực tiếp: bỏ hẳn hướng "mechanize
`product_root`/repo-divorce cho forgentX" ra khỏi phạm vi vision này — đó
là một cửa đã đóng có chủ đích, không phải một khoảng trống chờ lấp.

**Phân tích trình bày cho người dùng, dẫn tới Q6 (câu hỏi mới):**

Loại bỏ repo-divorce đồng nghĩa forgentX tiếp tục là single-repo, tự-host —
mission #3 (sửa fgOS) và mission #1/#2 (fgOS phục vụ ai đó) sống chung
đúng một cây file, không thể tách bằng đường dẫn thư mục như bee làm được.
Nhìn lại tsk-1js dưới góc này: Iron Law không hỏng vì code SAI ở path nào
đó — nó hỏng vì được thiết kế với TẦM NHÌN hẹp mission-3 (chỉ hình dung
"bảo vệ chính source fgOS") cho một năng lực mà bản chất PHẢI là mission-1/2
(bảo vệ BẤT KỲ repo nào fgOS đang vận hành, kể cả 4 project thật đã tìm
thấy ở vòng 2). Cùng một dòng code, cùng một file, hai cách hiểu sứ mệnh
khác nhau ra hai hành vi khác nhau — chứng minh ranh giới cần nằm ở TẦM
NHÌN THIẾT KẾ của quyết định (design-intent), không phải ở việc file nào
bị đụng. Đây khớp với cách bee tự mô tả `grooming-project-first`: không
phải phân loại theo path (`.bee/` vs "phần còn lại"), mà phân loại theo
NGÔN NGỮ BÁO CÁO và Ý ĐỊNH (báo bằng ngôn ngữ project, không lẫn bee-jargon)
— một phân loại ngữ nghĩa, không phải cấu trúc.

→ Q6 đưa ra cho người dùng: chấp nhận khung "design-intent per quyết định"
làm cơ chế nhận diện ranh giới (thay cho path/cấu trúc thư mục đã bị Q3
loại), với tsk-1js làm ví dụ neo minh hoạ hậu quả khi khung này bị bỏ qua?
