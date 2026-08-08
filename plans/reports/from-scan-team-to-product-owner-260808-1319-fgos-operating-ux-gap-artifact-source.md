# fgOS: hệ đã tự động hoá việc khó, nhưng chưa biết cách gọi người quay lại

**Quét toàn hệ · Vision × Code × State thật**

Luồng xuyên suốt từ lúc một người có ý tưởng đến lúc việc xong — đối chiếu viễn cảnh trong tài
liệu với những gì event log thật sự ghi lại.

`2026-08-08` · 9.693 event · 445 work item · 2.638 test · 23 ngày vận hành

> Bản markdown của trang: https://claude.ai/code/artifact/c39519c3-bfcd-4e08-9b05-1ee275ffa5eb
> Nguồn HTML: `plans/reports/fgos-operating-ux-gap.html`

---

## Kết luận

**Hệ được xây để người khỏi ngồi canh — nhưng chưa có cách nào báo cho người biết khi nào được
rời đi, và khi nó có hỏi thì câu hỏi không trả lời được.**

Nên người ở lại canh. Và vì đã ngồi đó, họ lái tay thay vì để hệ tự chạy. Toàn bộ những gì trông
như "tắc nghẽn vận hành" chảy ra từ **hai mắt xích thiếu** — một về **bề rộng** (không gọi được
người), một về **chất lượng** (64% lượt hỏi không phải quyết định sản phẩm mà là hai judge cãi
nhau một pattern `grep`).

Hai cái đó **nhân nhau**: xây kênh gọi người trước khi sửa câu hỏi = đẩy 23 thông báo về `grep`
lên điện thoại.

---

## 🛑 Cần vá trước mọi việc tăng tốc

`reclaimOrphanedCheckout` force-xoá bất kỳ worktree nào **mà không kiểm đó có phải phiên đang sống
hay không**. Đã có sự cố dogfood xác nhận: một root worktree đang chạy bị xoá im lặng giữa phiên.
Backlog xếp hạng CRITICAL, vẫn `proposed`.

> "A crash-recovery helper that destroys user work silently is worse than no recovery at all — it
> creates a false sense of safety." — journal của chính tác giả

Nó nằm trên đường mà mọi item đều đi qua. Tăng tốc một hệ có thể xoá mất việc của người chỉ làm
tăng tần suất gặp nó.

---

## 0 · Đo trước, kết luận sau

| Khúc | Median |
|---|---|
| Build thật (`doing → awaiting-approval`) | **0,3h** |
| Merge (`awaiting-approval → delivered`) | **0,1h** |
| Chờ queue (`submit → doing`) | 1,1h |
| Đuôi hậu-merge (`delivered → done`) | **64,9h** |
| **Tổng `submit → done`** | **27,2h** |

Một item điển hình đi hết vòng đời, theo tỉ lệ thời gian thật (median, n=223):

```
chờ queue  ▏ 1,1h
build      ▏ 0,3h
merge      ▏ 0,1h
hậu-merge  ████████████████████████████████████████████████████████ 64,9h
```

Máy làm việc trong 18 phút. Rồi item nằm đó gần ba ngày. Toàn bộ báo cáo này là đi tìm xem ba ngày
đó đi đâu — và câu trả lời không phải cái ai cũng đoán.

---

## 1 · Viễn cảnh mong muốn

fgOS **không phải** runner headless không người. Tài liệu nền tảng định nghĩa nó là **pipeline
bán-tự-động**: tự động là mặc định, người xen vào ở những cổng có điều kiện, và mức người-tham-gia
thay đổi theo giai đoạn.

Khác biệt cốt tử được nêu tường minh — và đây là câu đáng nhớ nhất trong toàn bộ tài liệu:

> **bee chặn phiên chat ở mỗi gate; fgOS biến gate thành checkpoint bất đồng bộ mà hệ đậu lại và
> chờ người quay lại. Người không phải lúc nào cũng ngồi đợi.**

### Ba tiêu chí, thứ tự cố định

Bậc dưới không ghi đè bậc trên:

- **Ship Faster** — giao nhanh hơn, không đoán mò, giảm friction, ít chờ đợi.
- **DoD** — kết quả kiểm chứng lại được + tài liệu có dẫn bằng chứng.
- **Polish sau DoD** — hoàn thiện sau ngưỡng, không mở scope.

Điều làm rõ ngày 2026-08-05 hay bị hiểu sai: thước đo là **tốc độ của project đang DÙNG fgOS**,
không phải tốc độ team fgOS build tính năng của chính fgOS. Một lựa chọn rẻ cho fgOS nhưng làm dev
dùng fgOS chậm hơn là sai theo tiêu chí, dù nó rẻ.

### Trải nghiệm mong muốn, kể như một ngày

**8:00** — Người gõ một câu tiếng Việt vào terminal. Không cần biết schema, không chọn tier, không
biết item nào đang chạy. Hệ tự phân loại, tự đặt id, tự viết ra bằng chứng thế nào là xong.

**8:01** — Người đóng laptop, đi làm việc khác. *Đây là điểm cốt tử.*

**Trong ngày** — Hệ tự làm rõ đề bài; mơ hồ thì tự tra trước; vẫn mơ hồ thì đậu lại với đúng một
câu hỏi rồi chuyển sang item khác chứ không đứng im. Việc rõ thì tự lập kế hoạch, tự đối chiếu với
repo thật, tự tách thành n item con và chạy song song.

**17:00** — Người mở máy, thấy một danh sách ngắn: ba việc xong chờ duyệt, một việc cần trả lời câu
này. Không bãi log. Không phải đi tìm chuyện gì đã xảy ra.

**17:05** — Duyệt. Hệ merge, tự viết tài liệu người-dùng-cuối từ chính cái vừa làm, tự dọn branch.

Người chỉ làm hai việc: **nói mình muốn gì**, và **duyệt cái đã xong**.

---

## 2 · Quy trình mong muốn, từng khâu

Tám khâu, với chỗ người bắt buộc được đánh dấu. Chỉ hai khâu cần người — và một khâu chỉ bật khi
thật sự mơ hồ.

| # | Khâu | Ai | Làm gì |
|---|---|---|---|
| 1 | **Intake** | 👤 Người khởi tạo | `fgos submit "<văn xuôi tự do>"` — skill tự suy luận tier/kind/risk, tự derive title, tự sinh id không đụng độ. |
| 2 | **Clarify** | 🤖 Tự động | Chạy im lặng theo mặc định, chỉ nói khi thật sự không hiểu đề bài. Gặp khái niệm lạ thì tự tra trước, không hỏi người. |
| 3 | **Decompose** | 🤖 Tự động | Viết kế hoạch nhỏ nhất trung thực, rồi đối chiếu kế hoạch với repo thật. Tách thành n item con độc lập, dependency rõ. |
| 4 | **Execute** | 🤖 Tự động | Claim + dựng worktree cô lập `fgw/<id>`. Viết code, tự chạy verify của chính item. Nhiều con thì bắn tối đa 5 agent mỗi wave. |
| 5 | **Review** | 🚪 Cổng người | Xem diff + trace, hoặc mở PR thật. **Cổng người tuyệt đối** — hard rule cấm tự duyệt, không ngoại lệ. |
| 6 | **Merge** | 🤖 Tự động | Chọn item xếp hạng cao nhất trong số đã hết dep chờ và không đụng footprint. |
| 7 | **Compound-learn** | 🤖 Tự động | Đọc capture thật, phân loại Diataxis, viết tài liệu người-dùng-cuối có trích bằng chứng, sinh lại index. |
| 8 | **Cleanup** | 🤖 Tự động | Kiểm TTL đã trôi, retrospective có nội dung thật, merge còn resolve — rồi xoá branch, đóng `done`. |

Xuyên suốt bốn luật giữ hệ không rối: **mọi ghi qua đúng một cửa** kể cả đường thất bại; **event
log là sự thật, state chỉ là view** dựng lại được; **người là participant có hợp đồng riêng**; và
mọi output mang cùng một envelope có `data_hash`.

---

## 3 · Đã làm được

Phần này mạnh hơn nhiều so với cảm nhận thông thường về một dự án 23 ngày tuổi.

| Chỉ số | Giá trị |
|---|---|
| Item return mỗi ngày (duy trì một tuần) | **~40** |
| Item merge mỗi ngày | **~35** |
| Test pass | **2.633 / 2.638**, 0 fail |
| Doc người-dùng-cuối tự sinh | **151** |
| Discovery tự hiểu đề bài, không hỏi | **88%** |

### Nền tảng state — vững, không phải demo

445 work item thật, event log 4MB, state view 3,4MB. Status FSM đầy đủ với precondition và CAS.
Stage FSM riêng một tầng trên, domain-aware — domain lạ fold về mặc định kèm cảnh báo, không bao
giờ throw.

### Bề mặt CLI — hơn 40 verb, tự mô tả

Mỗi verb khai rõ `[read]` / `[write]` / `[external]`, nên người đọc biết trước cái gì đụng đĩa.

### Cô lập và an toàn đồng thời

Worktree riêng mỗi item. Lock chống hai writer, kèm trạng thái free/live/stale/ambiguous và **từ
chối force-delete** khi phiên khác đang giữ thật. Đường `git reset --hard` an toàn từ chối khi cây
bẩn cho tới khi người đọc hết status toàn repo. Executor spawn bằng argv array, không nối chuỗi
vào shell.

### Vòng compound-learning — chạy thật

362 nửa dự đoán / 335 nửa thực tế, 223 learning đã seal, 298 thư mục capture ngữ cảnh. Friction
phân loại 5 tầng, tự quy tội. Đây là bằng chứng bậc F4 *đang vận hành*, không chỉ được tuyên bố.

### Capacity dispatch — chọn model theo tier

light → haiku, standard → sonnet, heavy → opus. Có capacity riêng cho judge, và bước phân loại lúc
submit chạy **cross-provider** sang Gemini Flash — đúng tinh thần rẻ nhất đủ chất lượng.

---

## 4 · Chưa làm được

Xếp theo mức đánh vào tiêu chí 1. Điểm chung của ba cái đầu: tất cả đều là *vận hành*, không phải
*năng lực*.

### 🛑 Đuôi hậu-merge 65h — không phải thiết kế, là chưa ai quét

Giả thuyết ban đầu là "TTL soak 7 ngày cho root, đúng thiết kế". Đào vào từng item thì **sai**:

| Nhóm | Số lượng | TTL | Trạng thái |
|---|---|---|---|
| Leaf | **112** | 0 ngày | Sẵn sàng đóng ngay |
| Root | 16 | 7 ngày | Còn chờ TTL, đúng thiết kế |
| Root hết TTL chưa quét | 0 | — | — |

**112 trên 128 item chỉ chờ một lần chạy loop.** Không item nào bị chặn bởi thiết kế. Người nhìn
bảng thấy 128 việc chưa xong, trong khi 112 cái đó code đã merge từ lâu và chỉ chờ bút ký cơ học.

### 🛑 Clarify tắc 91% frontier — nguyên nhân đã xác định

51 trên 56 item `todo` đang kẹt ở stage clarify. Đào nguyên nhân:

```
46/51 item không bị dep nào chặn        — tự do chạy ngay
 0/51 item từng có discovery entry      — chưa cái nào được chạy lần nào
```

Nút cổ chai **không do thiết kế gate cần người**, mà do chưa ai chạy loop làm rõ. Củng cố thêm: đo
314 lần đậu vào `awaiting-human` theo stage — clarify 265 (84%), decompose 40, executing 9. Gánh
nặng người dồn gần hết vào khâu đầu.

### 🛑 Chế độ async — thiếu kênh gọi người quay lại

301 item chạy `sync`, chỉ **4 item** chạy `async`. Toàn bộ luận điểm phân biệt fgOS với bee nằm ở
chế độ này.

`ask`/`answer` và trạng thái đậu đã có — đó là chỗ *đậu*. Cái thiếu là chỗ *gọi dậy*. Item đậu im
lặng vô thời hạn: **không timeout, không auto-resolve, không nhắc lại ở bất kỳ đâu**. Loop coi một
lần đậu là "chuyển sang item kế tiếp", không bao giờ quay lại.

Đây không phải khoảng cách năng lực ở lớp thực thi — là **một hệ con chưa xây**, nằm ngoài core
theo kiến trúc đã chốt.

### 🛑 Chất lượng câu hỏi — hỏi sai thứ, sai người, và hỏi lại mãi

Mặt thứ hai của cùng một vấn đề. Không có kênh gọi người là chuyện **bề rộng**. Đây là chuyện
**chất lượng**: khi hệ có hỏi, câu hỏi thường không trả lời được.

| Đo trên 314 lượt hỏi người thật | Giá trị |
|---|---|
| Lượt hỏi là **tranh chấp verify máy-vs-máy** | **202 / 314 · 64%** |
| Câu hỏi có phương án rõ ràng (a)/(b) | **32 / 152 · 21%** |
| Câu hỏi tự nhắc lại item đang bàn | 68 / 152 · 45% |
| Câu hỏi hỏi về một lệnh shell | 57 / 152 · 38% |
| Item bị hỏi ≥3 lần | 34 |
| Số lần hỏi nhiều nhất trên một item | **23** |

**Hỏi sai người.** 64% lượt hỏi mang cùng một khuôn — hai judge tự động bất đồng về việc một
pattern `grep` có chặt đủ không, rồi đẩy người lên làm trọng tài:

> *"Đề xuất verify bị nghi ngờ — vòng 1 đề xuất: `grep -q '\.parkReason' test/cli/fgos.test.mjs &&
> node --test ...` — vòng 2 (kiểm tra độc lập) không đồng ý: Pin quá lỏng và trùng tên với thứ đã
> hoạt động sẵn…"*

Đây không phải quyết định sản phẩm. Người không có lợi thế thông tin nào ở đây — đó là thứ máy
kiểm được bằng cách chạy thử lệnh, không phải thứ cần phán đoán con người.

**Người bị dùng làm vòng retry.** Một item bị hỏi **23 lần**, mỗi lần là một biến thể `grep` hơi
khác. Người không được hỏi *một quyết định* — người bị hỏi lại cho tới khi máy tự mò ra lệnh đúng.
Hai item khác mỗi cái 10 lần.

**Câu hỏi không tự mang bối cảnh.** Chỉ 45% nhắc lại được item đang nói về việc gì; hơn nửa buộc
người phải tra cứu mới hiểu đang bàn cái gì. 13% bắt tra chéo ≥2 task id khác. Có câu hỏi về nội
dung một file **không tồn tại trong checkout hiện tại** — người về mặt vật lý không mở được thứ
đang được hỏi.

**Làm tốt được, và đã có mẫu.** 21% còn lại chứng minh điều đó — 222 ký tự, hai phương án đặt tên
rõ, mỗi cái nói kèm nó giống cái gì đã có, trả lời được trong 10 giây không cần mở file nào:

> *"Should fgOS worktrees use the lock-in-tree strategy (symlink `.fgos/` to shared store, matching
> `session.mjs`) or the isolated-tree strategy (bootstrap-copy `.fgos/` per worktree with
> union-merge at merge-back, matching beegog)?"*

**Hệ quả về thứ tự ưu tiên.** Xây kênh chú-ý mà chưa sửa chất lượng câu hỏi thì thứ được đẩy lên
điện thoại người ta chính là **23 thông báo về pattern `grep` trên một item**. Kênh chú-ý khuếch
đại chất lượng câu hỏi — tốt lẫn xấu. **Sửa cái này trước.**

### 🛑 Mốc MVP2 chưa đạt — dù record mang status "accepted"

Mốc yêu cầu chứng minh vòng lõi đạt kết cục **tương đương** khi khởi động headless, không cú bấm
tay nào. Item xác minh vẫn `proposed`:

```
Ca tương tác — verify xanh + commit thật, nhưng kẹt ở đậu-chờ-người
               do `return` kiểm sai branch HEAD
Ca headless  — CHƯA TỪNG CHẠY THẬT LẦN NÀO: runner resolve repoRoot không có
               cờ override, testbed không phải git repo riêng, nên gọi thật sẽ
               dispatch thẳng vào state production 445 item
```

Ghi nguyên văn trong backlog: *"confirmed unsafe twice, never invoked for real."* "Accepted" mô tả
phát biểu mốc, không phải hệ đã chứng minh.

### ⚠️ Đường thành công cũng có nhánh thất bại câm

Ba lời gọi chuyển sang `delivered` trên đường thành công của `approve` không được bọc. Nếu write đó
throw — ví dụ lock-timeout lúc tranh chấp — tác dụng bên dưới (một merge thật, hoặc một verify đã
xác nhận xanh) **đã vĩnh viễn**, nhưng status không tiến và **không friction record nào được ghi**.

Nghịch với chính luật của hệ, vốn khẳng định đường thất bại cũng đi qua đúng một cửa. Có một nhánh
lọt lưới.

### ⚠️ Song song hẹp hơn nhiều so với tưởng

Bảng caller của chính skill điều phối ghi rõ: **4 trên 5 caller không được nối hợp đồng fan-out**.
Chỉ đường `cook` có. Một item claim thẳng bằng `pick` mà neo vào con đang mở thì chỉ báo neo rồi
dừng — người phải pick từng con bằng tay.

Năng lực "5 agent mỗi wave" chỉ đúng trên đúng một đường vào.

### ⚠️ Lớp quyết định native-vs-spawn còn thiếu — đang đốt việc

Doctrine đã khoá 4 luật chọn cách dispatch, nhưng **chưa lớp nào áp dụng chúng tự động**. Bằng
chứng sống: bước judge **luôn spawn một tiến trình agent mới toanh** kể cả khi caller đã là một
phiên sống cùng provider có ngữ cảnh tốt hơn — lẽ ra trúng luật "dùng cơ chế native" nhưng im lặng
rơi xuống spawn, vì không có cơ chế phát hiện "mình đang được gọi từ một phiên sống".

Hệ quả thẳng lên tiêu chí 1: một judge mù suy diễn lại từ đầu phán đoán mà phiên sống đã có sẵn.
Đúng hai thứ Ship Faster cấm — chờ đợi và trôi lệch.

### ⚠️ Đồ thị công việc rất phẳng — không đòn bẩy nào lớn

445 node nhưng **236 connected component**, 188 là item cô lập một mình, component lớn nhất 29.
Xếp hạng 72 item mở nhưng **chỉ số chặn cao nhất bằng 1**. Chỉ 6 item pick được ngay.

Không item nào là nút mở khoá lớn. Vừa tốt (song song được) vừa xấu: không thứ tự ưu tiên tự nhiên
nào nổi lên, và verb xếp hạng mất phần lớn giá trị khi mọi thứ đều chặn đúng 1.

### ⚠️ Hai lớp theo dõi, lớp chiến lược có 0 item done

Backlog chiến lược là hệ riêng — 31 dòng PBI, đếm được **30 proposed, 1 in-flight, 0 done**, và đã
xác minh bảng không lọc bỏ dòng done, nên số 0 là tín hiệu thật.

**223 item done ở lớp thi hành, 0 PBI done ở lớp chiến lược.** Chưa ai đối chiếu hai lớp. Kết hợp
với ghi nhận rằng `done` lật theo FSM chạm trạng thái cuối chứ không theo kiểm từng mệnh đề nghiệm
thu — con số 223 nên đọc là "FSM đã tới terminal", không phải "mọi điều kiện đã kiểm độc lập".

### ⚠️ verify-miss là friction đắt nhất

Trên 141 friction event:

| Loại lỗi | Số lần | Tỉ lệ |
|---|---|---|
| `verify-miss` | 87 | **62%** |
| `merge-conflict` | 42 | 30% |
| `merge-failed-unclassified` | 7 | 5% |
| `fgos-write-blocked` | 4 | 3% |
| `worker-timeout` | 1 | 1% |

`verify` là hợp đồng "thế nào là xong" của từng item — và nó hỏng nhiều nhất. Mỗi lần miss là một
vòng làm lại, đánh thẳng vào "không đoán mò".

### ⚠️ 40% item vẫn kéo người vào hỏi-đáp

142 trên 359 item có settlement `answer/human`. Con số 88% discovery báo `clear` chỉ nói "hiểu được
đề bài", **không** nói "không cần người ở khúc sau". Đo trên toàn vòng đời, cứ 5 item thì 2 lôi
người vào.

### ⚠️ Trường `risk` không có enum — dữ liệu lẫn hai bộ từ vựng

Chỉ validate "chuỗi không rỗng". Kết quả trên 445 item thật: `standard` 205, `light` 125,
`heavy` 63, `medium` 24, `low` 14, `high` 14.

Hai bộ từ vựng trộn trên cùng một field — `light/standard/heavy` mượn của tier, `low/medium/high`
mượn của urgency. Ai đọc bảng cũng phải tự đoán `light` với `low` có khác nhau không. Đúng thứ
"đoán mò" mà tiêu chí 1 cấm.

### ℹ️ PR lifecycle — có code, có test, chưa từng chạy thật

Quét toàn bộ 9.693 event: **không có event PR nào**. 22 lần xuất hiện chữ github đều nằm trong mô
tả item, không phải dấu vết chạy. Bước 9–11 của tầm nhìn chưa được chứng minh end-to-end. Merge
hiện tại là merge local.

### ℹ️ Đa domain — mới có khung, chỉ coding sống

Registry domain đã dựng và fold an toàn, nhưng chỉ `coding` có stage graph thật. Tầm nhìn nói "một
base, nhiều domain-extension" với marketing/HR/finance. Hiện là một base, một extension.

---

## 5 · Chẩn đoán — chuỗi nhân quả

Quan sát ban đầu là "ba nút tắc, chưa ai bấm nút". Sau khi quét lớp hợp đồng I/O, nguyên nhân gốc
nằm cao hơn một bậc — và nó là **một quyết định cố ý**.

```
┌─ CHƯA CÓ KÊNH CHÚ-Ý ────────────────────────────────────────────┐
│  Mô hình pull đồng bộ thuần tuý: gọi verb, nhận envelope.       │
│  Kênh push thật chưa khởi động, và đang chờ có chủ đích.        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
   Async không gọi được người quay lại
   Chỗ đậu đã có. Chỗ gọi dậy thì không. Item đậu im lặng vô thời
   hạn — không timeout, không nhắc lại.
                              ↓
   Mọi người chạy sync  ·  301 trên 305 item
                              ↓
   Người dù sao cũng ngồi đó  ·  nên lái tay thay vì để hệ tự chạy
                              ↓
   Loop không chạy  ·  clarify dồn 51, cleanup dồn 128
```

Quyết định hoãn được ghi thẳng trong tài liệu, nguyên văn:

> **Poll bắt đầu khó chịu là tín hiệu kênh chú-ý đến lượt.**

Nhưng chính tiêu chí 1 đứng về phía làm nó sớm hơn: hoãn kênh chú-ý *rẻ cho fgOS* nhưng làm *người
vận hành fgOS chậm hơn* — và khi hai vế xung đột, quyết định đã chốt là chọn vế người vận hành.

### Mắt xích thứ hai, chạy song song

Kênh chú-ý là vấn đề **bề rộng** — không có cách gọi người. Nhưng có một chuỗi thứ hai về **chất
lượng**: khi hệ có hỏi, câu hỏi không trả lời được.

```
┌─ VERIFY SINH RA KÉM LÚC SUBMIT/CLARIFY ─────────────────────────┐
│  Cùng gốc với 87 verify-miss ở mục trên.                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
   Hai judge bất đồng về lệnh verify  ·  một pattern grep có chặt đủ không
                              ↓
   Escalate cho người làm trọng tài  ·  202 trên 314 lượt hỏi = 64%
                              ↓
   Người không có lợi thế thông tin nào
   Phán một pattern grep không phải việc của người. Máy chạy thử là biết.
                              ↓
   Trả lời qua loa, hoặc bỏ đó → hỏi lại
   34 item bị hỏi ≥3 lần. Cao nhất: 23 lần trên một item.
```

**Hai mắt xích này nhân nhau, không cộng.** Xây kênh chú-ý mà chưa sửa chất lượng câu hỏi thì thứ
được đẩy lên điện thoại là 23 thông báo về `grep` trên một item — kênh chú-ý khuếch đại đúng thứ
cần giảm.

> **Thứ tự đúng: sửa chất lượng câu hỏi trước hoặc đồng thời. Không bao giờ sau.**

| Nút tắc | Số lượng | Nguyên nhân đã xác minh | Cách gỡ |
|---|---|---|---|
| Clarify | 51 | 46 tự do chạy, 0 từng qua discovery | một lệnh loop |
| Cleanup | 128 | 112 là leaf TTL 0 ngày, sẵn sàng đóng | một lệnh loop |
| Async | 4 / 305 | không có kênh gọi người quay lại | xây hệ con còn thiếu |
| Chất lượng câu hỏi | 64% | lượt hỏi là tranh chấp máy-vs-máy, không phải quyết định | chặn escalate + bắt câu hỏi mang bối cảnh |

Hai cái đầu gỡ được bằng một lệnh. Hai cái sau **không** — và cái thứ tư phải làm trước cái thứ ba.

### Tin tốt, và một cảnh báo về nó

**Tiêu chí 2 (DoD) đang được giữ tốt**: test xanh 2.633 trên 2.638, 371 trên 445 item có verify
thật, 151 tài liệu có trích dẫn bằng chứng. Bậc dưới không hỏng, chỉ bậc trên chưa chạm tới.

Nhưng đọc con số **223 done** cho đúng: một item backlog đang in-flight ghi nhận rằng `done` lật
theo *FSM chạm trạng thái cuối*, không theo *kiểm từng mệnh đề nghiệm thu đã giao đủ chưa*. 223
nghĩa là "FSM đã tới terminal", không phải "mọi điều kiện đã được kiểm độc lập".

---

## 6 · Việc tạo đòn bẩy

Xếp theo tỉ lệ giảm-chờ-đợi trên công-bỏ-ra.

### Nhóm 0 · vá trước khi tăng tốc

1. **Vá đường force-xoá worktree** — kiểm phiên sống và công việc chưa commit trước khi xoá. Rủi
   ro mất dữ liệu đã có sự cố xác nhận, nằm trên đường mọi item đều đi qua.

### Nhóm A · cơ học, làm được ngay, không viết code

2. **Chạy loop dọn cleanup** — đóng ngay 112 item. Bảng công việc giảm 25%, đuôi 65h biến mất cho
   phần lớn item. Công bỏ ra: một lệnh.
3. **Chạy loop làm rõ clarify** — khơi 46 item đang tự do. Frontier mở lại. Công bỏ ra: một lệnh.

Hai việc này gỡ hai trên ba nút tắc mà không viết một dòng code — nhưng chúng là triệu chứng,
không phải bệnh.

### Nhóm B · xây cái còn thiếu — thứ thay đổi bản chất trải nghiệm

4. **Chặn escalate tranh chấp verify lên người, bắt câu hỏi mang bối cảnh** — làm **trước** việc 5,
   không sau. Ba luật, tất cả đều cơ học:
   - Hai judge bất đồng về một lệnh verify là **việc của máy** — chạy thử rồi phán. Chỉ escalate
     khi bất đồng về *mục tiêu*, không bao giờ về *pattern*.
   - **Trần số lần hỏi lại** — cùng một item hỏi lần thứ ba là bug của bên hỏi, chuyển sang
     `blocked` kèm chẩn đoán thay vì hỏi lần 23.
   - **Mỗi câu hỏi phải tự đứng được** — nhắc lại item đang bàn (hiện 45%), nêu phương án rõ ràng
     (hiện 21%), không trỏ vào file không tồn tại trong checkout.
5. **Xây kênh chú-ý** — mắt xích gốc của chuỗi thứ nhất. Không có nó thì async không dùng được.
   Không cần đủ daemon ngay — nâng pane notification của cockpit thành hợp đồng thật thay vì chrome
   tuỳ chọn đã đủ cắt mắt xích. **Nhưng phải sau việc 4**: đẩy câu hỏi hiện tại lên điện thoại
   người ta là khuếch đại đúng thứ cần giảm.
6. **Tự động hoá chính hai loop ở nhóm A** — nếu nhóm A phải làm tay mỗi lần thì tắc nghẽn quay
   lại ngay tuần sau. Runner đã có chế độ watch; cần nối nó tới pool clarify và cleanup.
7. **Nối fan-out vào bốn đường vào còn lại** — hiện chỉ một đường có. Rẻ, và mở song song thật cho
   phần còn lại.
8. **Dựng lớp quyết định native-vs-spawn** — chặn việc judge mù suy diễn lại phán đoán mà phiên
   sống đã có. Kế hoạch 5 phase đã nộp thành item thật có dependency rõ.

### Nhóm C · chất lượng — đánh vào "không đoán mò"

9. **Đóng verify-miss** — 62% toàn bộ friction, và *cùng gốc* với 64% tranh chấp câu hỏi ở việc 4:
   verify sinh kém vừa hỏng lúc chạy vừa gây cãi lúc thẩm định. Sửa gốc đánh trúng cả hai. **Đòn
   bẩy đơn lẻ lớn nhất trong báo cáo này.**
10. **Khoá enum risk, làm rõ cặp status × stage** — rẻ, cơ học, gỡ trực tiếp gánh nặng đọc. Item
    nêu vấn đề này đã mở sẵn.

### Nhóm D · chứng minh còn thiếu

11. **Đóng mốc MVP2** — trước hết cho runner một cờ override repoRoot để chạy được trên testbed mà
    không đụng state production, rồi vá đường return kiểm sai branch HEAD. Không có hai cái đó thì
    ca headless không thể chạy an toàn lần nào.
12. **Chạy end-to-end một item qua đường PR thật** — có code, có test đơn vị, nhưng 0 dấu vết
    chạy. Chưa chứng minh thì chưa tính là có.

---

## 7 · Câu hỏi chưa giải đáp

Sáu trên bảy câu hỏi mở ban đầu đã trả lời được. Câu *"tại sao 40% item cần người trả lời trong
khi 88% discovery báo rõ"* nay đã có đáp án: **64% lượt hỏi không phải quyết định sản phẩm** — là
tranh chấp verify máy-vs-máy. Còn lại hai:

1. **Lớp PBI chỉ trễ nhịp, hay đã tách rời cấu trúc khỏi lớp thi hành?** 0 done so với 223 done.
   Item backlog chạm đúng vấn đề này đang in-flight. Câu trả lời quyết định con số 223 đọc được
   bao nhiêu phần trăm theo nghĩa đen.
2. **Ngưỡng nào thì tuyên bố bậc cuối của thang trưởng thành?** Định nghĩa là "cải tiến có outcome
   đo được". Hệ đã xếp hạng candidate từ friction, nhưng chưa thấy vòng nào đóng trọn từ friction
   đến cải tiến đến outcome tốt hơn đo được. Đây là thứ duy nhất còn nằm giữa bậc đã claim và đích.

---

**Nguồn bằng chứng:** `.fgos/events.jsonl` (9.693 event) · `.fgos/state.json` (445 work item) ·
`npm test` (2.638 test, 0 fail) · `docs/decisions` · `docs/specs` · skill definitions.

Mọi con số trong tài liệu này đo trực tiếp từ state thật, không lấy từ tài liệu mô tả.
