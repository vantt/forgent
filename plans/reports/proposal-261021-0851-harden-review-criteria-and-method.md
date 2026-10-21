# HARDEN: tiêu chuẩn đánh giá, tiêu chuẩn cải thiện, phương pháp làm việc

Đề xuất của `forgentx-95`, 2026-10-21 08:51, để owner duyệt. Luồng HARDEN trên [board](../261017-1313-fgos-platform-program-board/plan.md) (owner giao 10-18 21:27). Luật nền: RUL104 "tốt hơn, không to hơn" (D-ADR0062), nguyên tắc thiết kế 1–8 (`core/instructions/design-principles.md`), L5, L10.

## 1. Mục tiêu và phạm vi

**Mục tiêu:**
1. Tìm và sửa lỗi, tìm ra vấn đề nghiêm trọng chưa ai xử lý trong các lớp tầng thấp. Đích: ổn định hơn, nhanh hơn, nhẹ hơn, code đơn giản hơn, contract rõ hơn, nhưng **không to ra**.
2. Đi từ tầng thấp nhất lên, mỗi tầng xong hẳn rồi mới lên tầng trên. Khi xong, mỗi component tầng thấp có đúng một authority, và authority đó nằm trong Rust.
3. Trên đường đi, đánh giá và thực hiện việc chuyển sang Rust những phần Node còn đang quyết thay cho crate.

**Phạm vi** (theo board): holder-lock, process/containment, session-identity, terminal-control, run supervisor (6.2/6.3/6.4), Git, event store, `durable-file`, `canonical-json`. Đây là các crate `packages/{holder-lock,process,session-identity,terminal-control,run-supervisor,git,event-store,durable-file,canonical-json}` cùng mặt tiền Node và route host của chúng.

**Không thuộc phạm vi:** Seat Binding (đang xây), lớp Work (luồng WORK), tính năng mới.

**Đầu vào đã có:**
- Backlog đang `proposed` chạm phạm vi, đếm thô theo từ khoá: lock 7, git 9, identity 3, terminal 2, herdr 5.
- Hai lỗi gửi brief: `p-d2dc4f2e` và `p-f97bb935` (đang sửa, lead `brief-shell-guard`).
- Luồng TEST (test trùng giữa Rust và Node của chính các component này).
- Bài học đêm 10-20/21, xem mục 4.6.

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

## 4. Phương pháp làm việc (rev 2, theo owner 09:12)

Owner 09:12: rà soát đi theo component authority/boundary, **từ tầng thấp lên tầng cao**; giải quyết triệt để và hoàn tất tầng dưới rồi mới lên tầng trên; plan nêu **component khởi đầu và component kết thúc**; trên đường đi đánh giá **cơ hội, trình tự và cách chuyển phần Node sang Rust**.

### 4.1 Thứ tự tầng

Thứ tự lấy từ phụ thuộc crate thật (`packages/*/rust/Cargo.toml`) và [component-boundary](../../docs/platform/component-boundary.md):

| Tầng | Component | Dựa trên | Node còn quanh nó (ứng viên chuyển Rust, đánh giá ở tầng đó) |
|---|---|---|---|
| **T0 (khởi đầu)** | **Process Facts & Control + Containment port** (L0, `fgos-process`), cùng ba crate lá `host-runtime`, `canonical-json`, `durable-file` | không gì | đánh giá liveness và danh tính tiến trình ở Node (`process-identity.mjs`; audit 09-28 C2: "liveness judged nine-plus ways"), ghi file atomic ở Node |
| **T1** | **Holder-lock** (L1), **Session Identity**, **Convention** | process, host-runtime | `src/state/hot-lock.mjs`, `src/util/session-identity.mjs`, `src/convention` |
| **T2** | **Git**, **Terminal-control** (L2) | holder-lock, process, durable-file | `src/git/*` (13 file), `src/terminal-control/client.mjs` |
| **T3** | **Agent protocol** (L3), **Event Store** (khi ES xong phần store) | git, holder-lock, canonical-json | `src/state/events*.mjs`, `legacy-event-git-adapter.mjs` |
| **T4 (kết thúc)** | **Run Supervisor + Launch gate** (L4) | mọi tầng dưới | `src/run-supervisor/*` (15 file), phần giám sát attempt trong `src/runner/dispatch` |

- **Component khởi đầu:** Process Facts & Control (cùng ba crate lá).
- **Component kết thúc:** Run Supervisor + Launch gate.
- **Ngoài plan này** (tầng trên, có plan riêng): Observe, run-result, work-state, Seat Binding, Mailbox, Workflow, Execution Core.

### 4.2 Mỗi tầng là một vòng khép kín

1. **Đo baseline của tầng:** p50/p95 các route, test, LOC Rust và Node, backlog còn mở của tầng.
2. **Hội đồng soát tầng.** Bốn lăng kính:
   - đúng/an toàn và khi hỏng;
   - tốc độ và độ nặng;
   - đơn giản và contract;
   - red-team, khác family với các ghế kia.

   Hội đồng soát theo sáu trục ở mục 2 và đánh giá chuyển Rust theo mục 4.3.
3. **Big lead phân xử và viết plan của tầng** (`ak-plan`, có red-team và validate). Các đề xuất thêm tính năng để riêng cho owner chọn.
4. **Thực hiện:** mỗi lead Sonnet một worktree; chạy song song khi các lead sửa file khác nhau.
5. **Verify độc lập** theo 4.5, rồi merge vào main.
6. **Đóng tầng.** Một tầng đóng khi đủ cả bốn điều kiện:
   - mọi phát hiện đã nhận đều đã sửa, hoặc có ghi lý do bác;
   - backlog trong phạm vi của tầng không còn mục mở;
   - đã đo lại và có bảng trước/sau;
   - spec đã cập nhật.

   **Tầng dưới chưa đóng thì không mở hội đồng của tầng trên.**

**Land.** Mỗi tầng lên main ngay khi đóng. Việc activate ba workspace thì đề xuất gộp theo mốc (sau T1, sau T3, sau T4), để không phải dừng toàn bộ năm lần.

### 4.3 Đánh giá chuyển Node sang Rust ở mỗi tầng

- **Tiêu chí chuyển** (nguyên tắc thiết kế 4 và 7). Chuyển phần Node khi nó rơi vào một trong ba trường hợp:
  - Node đang **quyết** một việc mà crate của tầng là authority. Hai nơi cùng quyết thì chuyển sang Rust và xoá bản Node.
  - Nó nằm trên đường nóng hoặc đường an toàn.
  - Nó là primitive dùng chung cho cả hệ thống.

  **Không chuyển** phần Node chỉ là adapter mỏng (gọi route, định dạng output), hay là logic của tầng trên.
- **Trình tự:** chỉ chuyển trong tầng đang soát, và chỉ sau khi đã sửa xong lỗi của tầng đó. Tầng trên chỉ dựa vào tầng dưới sau khi tầng dưới đã chuyển xong.
- **Cách làm**, theo mẫu đã chạy được ở identity, convention và seat-binding:
  - Rust giữ quyết định.
  - Node thành client mỏng gọi route `fgos internal …`, fail closed, không có fallback JS.
  - Rust và Node dùng chung một bộ golden vector.
  - Đo exec budget trước khi chuyển caller (p95 ≤ 2× identity).
  - Chuyển **mọi** caller và xoá đường Node trong cùng đợt (L10).
- **Đầu ra mỗi tầng:** một bảng gồm các cột phần Node | quyết việc gì | chuyển hay không | lý do | thứ tự.

### 4.4 Song song với các luồng khác

- **SEAT** (đang ở phase 06–11) chạm `run-supervisor` và `terminal-control` ở phía caller. HARDEN T0–T2 không đụng file của SEAT. Tới T4 thì xếp lượt qua board.
- **ES** đang làm phần store. T3 chỉ mở khi ES xong. Nếu tới lúc đó ES chưa xong thì T3 tách đôi: Agent protocol làm trước, Event Store làm sau, nhưng vẫn trước T4.

### 4.5 Câu hỏi thì gom thành bộ

Theo D-ADR0030 điều 2: mỗi đợt chỉ hỏi owner tối đa hai lần.
- Lần 1, sau phân xử của mỗi tầng: nhận/bác các mục Critical, cùng mục "đề xuất thêm".
- Lần 2: chọn giờ land.

Còn lại big lead tự quyết trong khung đã duyệt rồi báo.

### 4.6 Verify: bài học đêm 10-20/21, giữ làm luật của luồng

- Lead phase 02 tự báo "mọi vùng chạm đều xanh", nhưng big lead đo ra khoảng 25 file hỏng thật. Lead phase 06 chạy test theo nhóm và bỏ sót `test/report`. Vì vậy:
  - big lead luôn tự chạy toàn suite trên chính host build từ cây;
  - file nào hỏng thì chạy riêng từng file;
  - file vẫn hỏng khi chạy riêng là regression thật, trả lại lead.
- Lead chỉ được báo kết quả đã thấy tận mắt, và phải ghi rõ đã chạy gì.
- Mỗi lần merge main vào nhánh dài phải soát xung đột ngữ nghĩa, không chỉ xung đột text. Ví dụ đêm qua: phase 02 đổi `roles` thành `seats`, luồng D vẫn gọi `roles`, merge không báo xung đột mà milestone chết lặng.

## 5. Owner quyết

1. Thứ tự tầng T0 → T4: khởi đầu ở **Process Facts & Control**, kết thúc ở **Run Supervisor + Launch gate**. Đặt Git cùng Terminal-control ở T2, Event Store ở T3: anh duyệt hay sửa?
2. Sáu trục, thang mức độ, bảy cổng (mục 2–3) và tiêu chí chuyển Rust (mục 4.3): duyệt, sửa hay thêm?
3. Land gộp theo mốc (sau T1, sau T3, sau T4), hay land sau từng tầng?
4. Hội đồng bốn ghế: có giới hạn ngân sách model không?
