# HARDEN: tiêu chuẩn đánh giá, tiêu chuẩn cải thiện, phương pháp làm việc

Đề xuất của `forgentx-95`, 2026-10-21 08:51, để owner duyệt. Luồng HARDEN trên [board](../261017-1313-fgos-platform-program-board/plan.md) (owner giao 10-18 21:27). Luật nền: RUL104 "tốt hơn, không to hơn" (D-ADR0062), nguyên tắc thiết kế 1–8 (`core/instructions/design-principles.md`), L5, L10.

## 1. Mục tiêu và phạm vi

**Mục tiêu:** tìm và sửa lỗi, phát hiện vấn đề nghiêm trọng chưa ai xử lý trong các lớp tầng thấp. Đích là những lớp này ổn định hơn, nhanh hơn, nhẹ hơn, code đơn giản hơn, contract rõ hơn, nhưng **không to ra**.

**Phạm vi** (theo board): holder-lock, process/containment, session-identity, terminal-control, run supervisor (6.2/6.3/6.4), Git, event store, `durable-file`, `canonical-json`. Đây là các crate `packages/{holder-lock,process,session-identity,terminal-control,run-supervisor,git,event-store,durable-file,canonical-json}` cùng mặt tiền Node và route host của chúng.

**Không thuộc phạm vi:** Seat Binding (đang xây), lớp Work (luồng WORK), tính năng mới.

**Đầu vào đã có:**
- Backlog đang `proposed` chạm phạm vi, đếm thô theo từ khoá: lock 7, git 9, identity 3, terminal 2, herdr 5.
- Hai lỗi gửi brief: `p-d2dc4f2e` và `p-f97bb935` (đang sửa, lead `brief-shell-guard`).
- Luồng TEST (test trùng giữa Rust và Node của chính các component này).
- Bài học đêm 10-20/21, xem mục 4.4.

## 2. Tiêu chuẩn đánh giá: soát cái gì, coi gì là phát hiện

### 2.1 Sáu trục soát

Mỗi component được soát theo sáu trục, mỗi trục có câu hỏi kiểm được:

| Trục | Câu hỏi | Bằng chứng chấp nhận |
|---|---|---|
| **A. Đúng và an toàn** | Có đường nào làm mất dữ liệu, ghi nhầm chỗ, chạy lệnh ngoài ý muốn, giữ lock mãi, hay báo thành công giả không? | Tái hiện được (test đỏ, script, bản ghi run thật), hoặc lý luận từ `file:line` mà người khác kiểm lại được |
| **B. Ổn định khi hỏng** | Tiến trình chết giữa chừng, máy tải nặng, đĩa đầy, hai máy cùng ghi: có tự khôi phục, hay ít nhất báo đúng tên lỗi không? | Kịch bản crash-matrix, đo dưới tải, bản ghi doctor |
| **C. Nhanh** | Đường nóng (mỗi run, mỗi commit, mỗi lệnh) tốn bao nhiêu exec, fsync, spawn, ms? | Đo p50/p95 trên máy thật, có số trước và sau |
| **D. Nhẹ** | Có gì thừa không: code chết, đường song song, file/route không ai dùng, test lặp? | `rg` hoặc GitNexus chỉ ra không có caller; danh sách cụ thể |
| **E. Đơn giản, một cửa** | Một việc có bị làm nhiều cách không (ví dụ "liveness judged nine-plus ways" ở audit 09-28)? Có lớp trung gian thừa không? Lớp dưới có biết lớp trên không? | Danh sách các nơi làm cùng một việc; vi phạm layering (`test/architecture.test.mjs`) |
| **F. Contract rõ** | API, signature, mã lỗi có tường minh, dễ dùng không? Mã lỗi có tên, có nói bước tiếp không? Spec và code có khớp không? | Đối chiếu spec với code; mã lỗi không tên hay bị nuốt |

### 2.2 Mức độ

| Mức | Nghĩa |
|---|---|
| **Critical** | Mất hoặc hỏng dữ liệu, chạy lệnh ngoài ý muốn, lộ bí mật, chặn mọi người dùng. Ví dụ loại `p-f97bb935`. |
| **High** | Sai kết quả hoặc treo trong điều kiện thường gặp, hoặc làm hỏng một luồng chính |
| **Medium** | Sai trong điều kiện hiếm, hoặc chậm / nặng đo được rõ rệt |
| **Low** | Rườm rà, contract mờ, nợ code không gây lỗi |

Mỗi phát hiện ghi rõ là **tái hiện được** hay **chỉ suy luận**. Phát hiện chỉ suy luận không được xếp trên High cho tới khi tái hiện được.

### 2.3 Quy tắc bằng chứng

Học từ audit 09-28 và hội đồng 10-15:
- Không có `file:line` thì không thành phát hiện.
- Giả thuyết bị bác vẫn được ghi lại, để lần soát sau khỏi soát lại.
- Một phát hiện trùng với backlog có sẵn thì gắn vào item đó, không tạo item mới.

## 3. Tiêu chuẩn cải thiện: một thay đổi phải qua những cổng nào

Mọi thay đổi do HARDEN đề ra phải qua cả bảy cổng sau thì mới được merge:

1. **Tốt hơn đo được:** có bảng trước/sau trên ít nhất một trục A–F. Ví dụ: test đỏ chuyển xanh, p95 giảm, số dòng hoặc số đường giảm, số nơi cùng làm một việc giảm.
2. **Không to hơn:** không thêm tính năng, lớp hay cơ chế mới. Số dòng thực của component nên ≤ 0; nếu tăng thì phải nêu lý do.
3. **Đổi contract thì đổi trọn (L10):** chuyển mọi caller và xoá đường cũ trong cùng đợt. Không để alias, không giữ đường song song.
4. **Một bằng chứng (nguyên tắc 8):** mỗi hành vi có đúng một test chủ ở tầng thấp nhất. Gỡ cơ chế nào thì gỡ test của nó và ghi rõ test nào giờ sở hữu hành vi đó. Không làm yếu test.
5. **Không lùi hiệu năng:** p95 của các route đã có ngân sách (identity mint, lock, seat-binding) không được tăng quá nhiễu đo.
6. **Spec đi cùng code:** sự thật thay đổi thì sửa spec của area trong cùng commit.
7. **Ý tưởng thêm để riêng:** mọi đề xuất thêm tính năng gom vào một mục riêng của báo cáo. Mỗi ý ghi vấn đề thật, bằng chứng, lợi ích, và chỉ làm khi owner chọn.

## 4. Phương pháp làm việc

### 4.1 Chia đợt

| Đợt | Component | Khi nào |
|---|---|---|
| **A** | holder-lock, process/containment, session-identity, terminal-control, run supervisor, `durable-file`, `canonical-json`, **Git (01–08, đã land cả hai máy từ 08:32 hôm nay)** | Mở được ngay: mọi phần đã land |
| **B** | event store | Sau khi ES xong phần store (ES 09 phần store + ES 10 phần store) |

Đề xuất mở đợt A ngay, vì Git đã land nên đợt A giờ chiếm phần lớn phạm vi. Chờ ES chỉ phí thời gian của phần đã ổn định.

### 4.2 Các bước của mỗi đợt

1. **Đo baseline** (big lead, trước hội đồng), trên máy owner, lưu thành bảng:
   - p50/p95 của từng route nội bộ trong phạm vi (`identity`, `lock-fd`, `supervise`/`gate`, các route git…);
   - thời gian suite theo area (đang 1046 s, baseline 202 s);
   - danh sách test chập chờn đã biết;
   - LOC và số crate/module;
   - backlog `proposed` theo component.

   Số này là "trước" cho cổng 1 và 5.
2. **Hội đồng soát** (`fgos-architecture-panel`), mỗi đợt một hội đồng, mỗi ghế giữ một lăng kính:
   - đúng/an toàn và khi hỏng (trục A–B);
   - tốc độ và độ nặng (C–D);
   - đơn giản và contract (E–F);
   - một ghế red-team đi tìm phát hiện bị bỏ sót.

   Model chọn theo bản chất việc: soát thiết kế và tìm lỗi dùng các family mạnh (flagship), ghế red-team khác family với các ghế kia. Đầu ra là danh sách phát hiện theo mẫu mục 2, kèm giả thuyết đã bác.
3. **Big lead phân xử:**
   - mỗi phát hiện nhận / bác / gộp vào backlog, có lý do;
   - phát hiện Critical/High chỉ suy luận thì cho tái hiện trước;
   - viết plan (`ak-plan`, red-team + validate) chỉ cho phần nhận;
   - tách mục "đề xuất thêm" để owner chọn.
4. **Thực hiện:** một lead Sonnet cho mỗi component (hoặc mỗi nhóm file tách rời), trong worktree riêng, chạy song song khi file không giao nhau, theo `ak-cook`.
5. **Verify độc lập** (mục 4.4): big lead chạy, không tin số lead tự báo.
6. **Land theo đợt:** main → release → ba workspace → doctor → smoke, rồi đo lại baseline và ghi bảng trước/sau vào báo cáo land.

### 4.3 Câu hỏi thì gom thành bộ

Theo D-ADR0030 điều 2: mỗi đợt chỉ hỏi owner tối đa hai lần.
- Lần 1, sau phân xử: nhận/bác các mục Critical, cùng mục "đề xuất thêm".
- Lần 2: chọn giờ land.

Còn lại big lead tự quyết trong khung đã duyệt rồi báo.

### 4.4 Verify: bài học đêm 10-20/21, giữ làm luật của luồng

- Lead phase 02 tự báo "mọi vùng chạm đều xanh", nhưng big lead đo ra khoảng 25 file hỏng thật. Lead phase 06 chạy test theo nhóm và bỏ sót `test/report`. Vì vậy:
  - big lead luôn tự chạy toàn suite trên chính host build từ cây;
  - file nào hỏng thì chạy riêng từng file;
  - file vẫn hỏng khi chạy riêng là regression thật, trả lại lead.
- Lead chỉ được báo kết quả đã thấy tận mắt, và phải ghi rõ đã chạy gì.
- Mỗi lần merge main vào nhánh dài phải soát xung đột ngữ nghĩa, không chỉ xung đột text. Ví dụ đêm qua: phase 02 đổi `roles` thành `seats`, luồng D vẫn gọi `roles`, merge không báo xung đột mà milestone chết lặng.

## 5. Owner quyết

1. Mở **đợt A ngay** (gồm cả Git, vì đã land), còn ES để đợt B? Em khuyên: có.
2. Sáu trục, thang mức độ, bảy cổng ở trên: duyệt, sửa hay thêm?
3. Hội đồng: bốn ghế như mục 4.2 bước 2 có ổn không, hay anh muốn thêm/bớt lăng kính? Có giới hạn ngân sách model cho đợt này không?
4. Thứ tự với SEAT: chạy HARDEN đợt A **song song** với SEAT 07–11 (file khác nhau, trừ chỗ chạm `run-supervisor`/`terminal-control`, lúc đó điều phối qua board), hay chờ SEAT land? Em khuyên: song song, phần chạm nhau sẽ xếp lượt.
