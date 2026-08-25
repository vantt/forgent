# Nhờ đánh giá: thiết kế trục danh tính + topic registry cho tài liệu tự sinh

**Bối cảnh nhờ:** thiết kế này ra từ 9 vòng thảo luận (2026-08-07 → 2026-08-25),
chưa viết một dòng code nào. Muốn một advisor ngoài, không có ngữ cảnh hội thoại,
đọc và phản biện trước khi vào planning.

Nguồn đầy đủ: `docs/history/compound-learn-artifact-registry/DISCUSSION.md`
(~1100 dòng, tiếng Việt). Bản này tự chứa, không cần đọc file kia mới hiểu.

---

## 1. Hệ thống đang nói tới

fgOS là một lớp nền chạy work-item qua vòng đời (submit → discovery → planning →
executing → delivered → **retrospective** → cleanup → done). Ở bước
`retrospective`, một skill tên `fgos-coding-compounding` đọc "capture" thật của
item (quyết định, ma sát, hỏi-đáp thật đã ghi trong event log) rồi **viết ra một
tài liệu người-dùng-cuối**.

Tài liệu đó hôm nay được phân loại bằng **đúng một trục: 4 quadrant Diataxis**
(`tutorial` / `how-to` / `reference` / `explanation`), và quadrant **cũng chính là
thư mục** (`docs/<quadrant>/<file>.md`). Skill có hard rule cấm viết ra ngoài
thư mục khớp quadrant, và cấm bịa quadrant thứ 5.

## 2. Vấn đề, đo được

**Số tài liệu bùng nổ theo số work-item.** Đo trên `main` ngày 2026-08-25:

| Chỉ số | Giá trị |
|---|---|
| Tổng tài liệu end-user | **268** (`explanation` 161, `how-to` 85, `reference` 21, `tutorial` 1) |
| Tốc độ sinh | **+50 tài liệu / 7 ngày** (tree-diff chính xác `7df2b894..HEAD`) ≈ 7,1/ngày |
| Nhân đôi corpus | ~5 tuần nếu không đổi gì |
| Tài liệu chạm ≥2 thực thể **ngay trong tên file** | **93/330 = 28%** (sàn, thân bài nhiều hơn) |

**Nguyên nhân cơ học, đọc từ chính skill:** bước quyết "viết mới hay bồi vào tài
liệu cũ" chỉ dựa vào `fs.existsSync` trên một đường dẫn **do phiên tự đặt tên tự
do mỗi lần**. Không có cách nào để phiên biết đã tồn tại tài liệu gần chủ đề.
Nên gần như luôn ra "tạo mới".

**Triệu chứng thật:** riêng cụm worktree có ~20 file rời rạc. Ba file dưới đây
cùng một chủ đề (thu hồi worktree mồ côi an toàn) nhưng tên khác hẳn nhau:

```
orphaned-worktree-reclaim-must-check-for-live-uncommitted-work.md
why-reclaimorphanedcheckout-refuses-a-live-session-worktree.md
why-session-claim-liveness-reuses-worktree-activity-not-pid-or-event-age.md
```

## 3. Thiết kế đề xuất — bốn nhãn, hai trục

Chẩn đoán gốc: **một trục đang gánh ba việc** — quyết cách viết, quyết nơi lưu,
và là danh sách duy nhất một tài liệu có thể thuộc về. Thiết kế gỡ việc 2 và 3 ra.

| # | Nhãn | Trục | Đơn/đa trị | Đóng/mở | Hiện ra ở |
|---|---|---|---|---|---|
| 1 | **Mục đích** (giải quyết vấn đề gì, cho ai) | danh tính | đơn | mở, tăng chậm | **thư mục** |
| 2 | **Vai trò** (`decision`/`runbook`/`pitfall`/…) | danh tính | đơn | **ĐÓNG có cửa** | **tên file** |
| 3 | **Entity** (thực thể liên quan) | danh tính | **ĐA** | mở, tăng nhanh | tag frontmatter |
| 4 | **Framework + mode** (Diataxis là framework đầu tiên) | cách viết | đơn/framework | registry MỞ của framework, mỗi framework ĐÓNG | frontmatter |

Ví dụ chuyển đổi:

```
TRƯỚC  docs/explanation/why-a-stale-worktree-index-produced-a-wrong-iron-law-test-count.md

SAU    docs/stale-index-vs-uncommitted-work/pitfall.md
       entities: [worktree-index, iron-law, test-count]
       framework: diataxis   mode: explanation
```

### Tám quy định đi kèm

- **Q1** Đường dẫn CHÍNH LÀ cặp danh tính đơn trị ⇒ ràng buộc "một chủ đề một chủ
  sở hữu" được hệ tệp cưỡng chế **miễn phí**, không cần anti-fork gate.
- **Q2** Entity **không bao giờ** làm thư mục (thư mục phải đơn trị; 28% tài liệu
  đa entity). Hệ quả tốt: entity sinh sôi mà đẻ **0 file mới**.
- **Q3** Diataxis và mọi framework viết **không** làm thư mục — vì trục cách viết
  là registry mở nhiều framework, framework thứ hai sẽ không có thư mục tương ứng.
- **Q4** Vocabulary `vai trò` **cấm trùng tên** bất kỳ quadrant/mode nào
  (`reference` phải đổi tên).
- **Q5** `vai trò` GỢI Ý framework mặc định nhưng không đồng nhất — `decision` và
  `pattern` cùng là "explanation" với Diataxis nhưng **vòng đời khác hẳn**
  (decision bị supersede; pattern được tinh chỉnh dần).
- **Q6** Nửa ĐÓNG phải bám chỗ không phình: `vai trò` nói về hình dạng **tri thức**
  nên không lớn theo sản phẩm; `mục đích`/`entity` thì có.
- **Q7** Hai tầng (tài liệu cho người / spec cho máy): **một bộ máy, hai registry
  tách rời** — tầng người tối ưu độ rõ và chấp nhận trùng lặp có chủ đích; tầng máy
  tối ưu độ gọn.
- **Q8** `docPath` cũ là **sự thật lịch sử**, không sửa; registry giữ bản chiếu
  hiện tại qua lineage `split`/`merge`.

### Cơ chế vận hành

- Registry lưu bằng **event + verb** (`fgos topic register/split/merge/rename/retire`),
  không phải file JSON soạn tay — để có lịch sử biến hình.
- **Bắt buộc hai "ảnh cuối cùng"**: JSON cho máy, Markdown cho người. Ảnh Markdown
  phải cho thấy thứ `ls` không thấy: lineage tách/gộp, topic đã đăng ký mà chưa có
  tài liệu, topic quá ngưỡng chờ tách, topic nghỉ hưu và ai thay.
- **Tách topic kích hoạt bằng doctor check đo kích thước tài liệu**, không dựa vào
  ai nhớ. (Ràng buộc R6 của thảo luận: mọi bước cần-người-nhớ đều sẽ tụt — đã đo
  một ca thật tụt 32%.)
- Guard chống trôi: **vai trò chỉ có đúng một tài liệu là vai trò đáng ngờ**.
- Thêm vai trò mới: **phiên ĐỀ XUẤT không chặn** (vẫn viết ngay, gán vai trò gần
  nhất, ghi đề xuất), **người chốt theo lô**.

### Di trú 268 tài liệu hiện có

Hai pha khác hẳn bản chất:

1. **Phân loại** từng file → `(mục đích, vai trò, entity[])`. Độc lập, song song
   được, đầu ra là **dữ liệu**. Pha này **chính là** pass bottom-up sinh vocabulary
   — một việc, không phải hai.
2. **Gộp + viết** ~33 tài liệu đích. Song song theo đích. Đồng thời là phép thử
   thật đầu tiên của skill viết.

Guard bắt buộc cho pha 2: **conservation** — mỗi file trong 268 phải được kể tên
**đúng một lần** (trong danh sách nguồn của một đích, hoặc trong phần loại trừ có
lý do); thiếu một cái là ném lỗi.

## 4. Cái giá đã tự nhận, không giấu

1. **Gãy linkage.** `findAllSourceCaptureIds` khớp `docPath` chính xác từng ký tự;
   dời file làm toàn bộ 268 capture trỏ sai. Bảng ánh xạ cũ→mới là việc **ngày đầu**.
2. **Bề mặt sửa lớn**: hard rule của skill, `QUADRANT_DIR_ALIASES`, `buildEnduserIndex`,
   verb `fgos docs-index`, verb `fgos doc-sources`, và một doctor check đang xanh 269/269.
3. **Ngưỡng tuyệt đối không tự hiệu chỉnh** — đặt thấp thì ngập, cao thì im lìm.
4. **Song song hoá pha 2 có rủi ro đã gặp thật**: cơ chế fan-out từng đua worktree
   và phải lùi về tuần tự.

## 5. Độ tin cậy của chính quá trình này — nói thẳng

Thảo luận đã **vấp 7 lần, 5 cơ chế khác nhau**, và **không lần nào do agent tự phát
hiện** — hoặc chủ sản phẩm bắt, hoặc lòi ra khi đo lại:

| Kiểu sai | Số lần | Ví dụ |
|---|---|---|
| Kết luận rút từ một ảnh chụp, bị dữ liệu theo thời gian bác | 3 | Kết luận "chất liệu kể chuyện nằm ở friction" — đo lại 92% là telemetry máy |
| Đọc dữ kiện trong worktree cũ thay vì `main` | 1 | Lệch 17% corpus, suýt mất con số +50/7 ngày |
| Chứng cứ ĐÚNG nằm im nhiều vòng vì không ai hỏi đúng câu | 2 | Câu "vocabulary cấu trúc đóng + dữ liệu chủ đề mở" ghi từ vòng 2, 7 vòng sau mới dùng |
| Kết luận mới mâu thuẫn chẩn đoán cũ trong cùng file đang mở | 1 | Vẫn đề xuất `docs/<quadrant>/…` dù §6.1 đã gọi đó là bệnh gốc |
| Ước lượng chi phí sai làm lệch khuyến nghị | 1 | Tính "fold rồi lại dời" là hai việc, thực ra là một |

**Xin advisor coi đây là tín hiệu**: những kết luận chưa qua đo thật hoặc chưa bị
ai phản biện thì độ tin thấp hơn vẻ ngoài của nó.

## 6. Câu muốn được phản biện

1. **Ba toạ độ danh tính có thừa không?** Cụ thể: `vai trò` có thật sự tách khỏi
   Diataxis mode, hay đó là cùng một chiều gọi hai tên? Lập luận bảo vệ hiện tại
   dựa vào **khác biệt vòng đời** (decision bị supersede vs pattern tinh chỉnh dần)
   — lập luận đó có đủ mạnh để nuôi một vocabulary riêng không?
2. **`mục đích` làm thư mục có tái tạo lại chính bài toán không?** Nếu mỗi
   work-item đẻ một "mục đích" mới thì ta chỉ đổi tên vấn đề. Điều gì thật sự giữ
   cho số mục đích tăng chậm hơn số work-item?
3. **`vai trò` đóng-có-cửa có phải cửa quá dễ?** Nếu phiên luôn được "gán gần nhất
   + đề xuất", liệu áp lực thêm vai trò có bao giờ đủ để ai đó thật sự chốt, hay
   mọi thứ dồn vào một vai trò rác?
4. **Bỏ anti-fork gate và thay bằng duy-nhất-trên-đường-dẫn có đủ không?** Đã tự
   kiểm: cách này bắt được 2/3 trong ví dụ ba-file thật; file thứ ba thoát vì khai
   `mục đích` khác. Có cơ chế nào rẻ mà bắt được ca thứ ba?
5. **Có nên làm nhẹ hơn nhiều không?** Phương án rẻ đã bị loại là "giữ nguyên thư
   mục, chỉ để registry trả lời chủ đề X sống ở đâu" (chi phí ~0, không dời file).
   Chủ sản phẩm chọn phương án dời vì muốn `ls docs/` phản ánh đúng cấu trúc. Đánh
   đổi này có đáng không?
6. **Có tiền lệ ngành nào cho mô hình bốn nhãn này không** — hoặc ngược lại, có ai
   đã thử và thất bại theo cách ta chưa lường?

## 7. Những gì KHÔNG cần phản biện lại

Đây là quyết định của chủ sản phẩm, đã cân nhắc, xin đừng mở lại trừ khi có bằng
chứng mới:

- Hai trục **triển khai cùng lúc** (không tuần tự).
- Fold **toàn bộ** 268 tài liệu cũ (không phải chỉ áp cho tài liệu mới).
- Vocabulary suy **bottom-up** từ tài liệu thật (không liệt kê tay).
- Registry lưu bằng **event + verb** (không phải JSON soạn tay).
- **Tách** phần thu-chất-liệu-kể-chuyện sang item riêng.
