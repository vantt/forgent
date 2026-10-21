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

### 2.1 Bảy trục soát

Mỗi component được soát theo bảy trục, mỗi trục có câu hỏi kiểm được:

| Trục | Câu hỏi | Bằng chứng chấp nhận |
|---|---|---|
| **A. Đúng và an toàn** | Có đường nào làm mất dữ liệu, ghi nhầm chỗ, chạy lệnh ngoài ý muốn, giữ lock mãi, hay báo thành công giả không? | Tái hiện được (test đỏ, script, bản ghi run thật), hoặc lý luận từ `file:line` mà người khác kiểm lại được |
| **B. Ổn định khi hỏng** | Tiến trình chết giữa chừng, máy tải nặng, đĩa đầy, hai máy cùng ghi: có tự khôi phục, hay ít nhất báo đúng tên lỗi không? | Kịch bản crash-matrix, đo dưới tải, bản ghi doctor |
| **C. Nhanh** | Đường nóng (mỗi run, mỗi commit, mỗi lệnh) tốn bao nhiêu exec, fsync, spawn, ms? | Đo p50/p95 trên máy thật, có số trước và sau |
| **D. Nhẹ** | Có gì thừa không: code chết, đường song song, file/route không ai dùng, test lặp? | `rg` hoặc GitNexus chỉ ra không có caller; danh sách cụ thể |
| **E. Đơn giản, một cửa** | Một việc có bị làm nhiều cách không (ví dụ "liveness judged nine-plus ways" ở audit 09-28)? Có lớp trung gian thừa không? Lớp dưới có biết lớp trên không? | Danh sách các nơi làm cùng một việc; vi phạm layering (`test/architecture.test.mjs`) |
| **F. Contract rõ** | API, signature, mã lỗi có tường minh, dễ dùng không? Mã lỗi có tên, có nói bước tiếp không? Spec và code có khớp không? | Đối chiếu spec với code; mã lỗi không tên hay bị nuốt |

Thêm trục thứ bảy (owner 10:01):

| Trục | Câu hỏi | Bằng chứng chấp nhận |
|---|---|---|
| **G. Bề mặt cho agent (agent-native, agent-friendly)** | Agent dùng component này có dễ không? Có output máy đọc được (`--json`) không? Mã lỗi có tên và nói bước tiếp không? Có không cần tương tác (không prompt) không? Có idempotent, có `explain`/dry-run không? Help và instruction có tìm được, rõ, nhẹ token, không trùng và không mâu thuẫn không? | Chạy thử như một agent không có lịch sử chat (L5); đo token của instruction và help mà agent phải đọc; liệt kê chỗ trùng hoặc mâu thuẫn giữa AGENTS.md, skill, help và spec |

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

Mọi thay đổi do HARDEN đề ra phải qua cả chín cổng sau thì mới được merge:

1. **Tốt hơn đo được:** có bảng trước/sau trên ít nhất một trục A–F. Ví dụ: test đỏ chuyển xanh, p95 giảm, số dòng hoặc số đường giảm, số nơi cùng làm một việc giảm.
2. **Không to hơn:** không thêm tính năng, lớp hay cơ chế mới. Số dòng thực của component nên ≤ 0; nếu tăng thì phải nêu lý do.
3. **Đổi contract thì đổi trọn (L10):** chuyển mọi caller và xoá đường cũ trong cùng đợt. Không để alias, không giữ đường song song.
4. **Một bằng chứng (nguyên tắc 8):** mỗi hành vi có đúng một test chủ ở tầng thấp nhất. Gỡ cơ chế nào thì gỡ test của nó và ghi rõ test nào giờ sở hữu hành vi đó. Không làm yếu test.
5. **Không lùi hiệu năng:** p95 của các route đã có ngân sách (identity mint, lock, seat-binding) không được tăng quá nhiễu đo.
6. **Hướng dẫn cho agent rõ, nhẹ, không trùng** (owner 10:01): instruction, skill, help và thông báo lỗi mà agent đọc phải tường minh, dùng ít token nhất có thể, không lặp lại cùng một luật ở nhiều chỗ và không mâu thuẫn nhau. Đổi hành vi thì sửa luôn hướng dẫn trong cùng đợt; hướng dẫn thừa hoặc trùng thì gỡ.
7. **Spec đi cùng code:** sự thật thay đổi thì sửa spec của area trong cùng commit.
8. **Doctor check và setup của component** (owner 11:17): mỗi component chỉ có một hoặc vài doctor row sức khoẻ, đứng tên component đó (không một row cho mỗi khoá config). Row phải chạy nhanh, báo lỗi có tên, nói bước sửa, và có `--fix` khi sửa an toàn. Cơ chế bị xoá thì row và bước `fgos setup` của nó bị xoá trong cùng đợt. Thêm row mới phải nêu row nào nó thay hoặc gộp. Thước đo của tầng: số row của tầng không tăng, row trùng hay row mồ côi về 0.
9. **Ý tưởng thêm để riêng:** mọi đề xuất thêm tính năng gom vào một mục riêng của báo cáo. Mỗi ý ghi vấn đề thật, bằng chứng, lợi ích, và chỉ làm khi owner chọn.

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
| **T4** | **Run Supervisor + Launch gate** (L4) | mọi tầng dưới | `src/run-supervisor/*` (15 file), phần giám sát attempt trong `src/runner/dispatch` |
| **T5 (kết thúc)** | **Execution Core** (Unit, `runUnit`, `bind()`, Pattern), **Dispatch Transport & Confinement**, **Seat Binding** (khi tới nơi thì SEAT đã land), **Run Result Evaluator** (`fgos-run-result`) | run supervisor, terminal-control, agent-protocol, observe | `src/runner/dispatch` (28 579 dòng, 64 file — khối Node lớn nhất; audit 09-28 thấy 5 binder "shadow" và hơn 9 nơi phán liveness), `src/runner/execution` (5 162 dòng) |

- **Component khởi đầu:** Process Facts & Control (cùng ba crate lá).
- **Component kết thúc:** Execution Core (kèm Dispatch Transport & Confinement, Seat Binding, Run Result Evaluator). Observe (`fgos-observe`, dựa trên git, holder-lock, identity) soát ở T3.
- **Ngoài plan này** (tầng trên T5, plan riêng khi tới): Workflow (guide + case), Work Lifecycle (luồng WORK đang giữ), Agent Mailbox (chưa xây), Host & Surface (CLI `bin/fgos.mjs`, gateway, herdr-dashboard), Packaging-Distribution (`fgctl`, setup, doctor; `src/setup` 13 846 dòng). Lý do dừng ở T5: tầng trên đang thiết kế lại (Workflow, Work) hoặc chưa xây (Mailbox); soát chúng lúc này dễ phải làm lại.

### 4.2 Mỗi tầng là một vòng khép kín

1. **Đo baseline của tầng:** p50/p95 các route, test, LOC Rust và Node, backlog còn mở của tầng.
2. **Hội đồng soát tầng.** Bốn lăng kính:
   - đúng/an toàn và khi hỏng;
   - tốc độ và độ nặng;
   - đơn giản và contract;
   - red-team, khác family với các ghế kia.

   Hội đồng soát theo bảy trục ở mục 2 và đánh giá chuyển Rust theo mục 4.3.
3. **Big lead phân xử và viết plan của tầng** (`ak-plan`, có red-team và validate). Các đề xuất thêm tính năng để riêng cho owner chọn.
4. **Thực hiện:** mỗi lead Sonnet một worktree; chạy song song khi các lead sửa file khác nhau.
5. **Verify độc lập** theo 4.5, rồi merge vào main.
6. **Đóng tầng.** Một tầng đóng khi đủ cả bốn điều kiện:
   - mọi phát hiện đã nhận đều đã sửa, hoặc có ghi lý do bác;
   - backlog trong phạm vi của tầng không còn mục mở;
   - đã đo lại và có bảng trước/sau;
   - spec đã cập nhật.

   **Tầng dưới chưa đóng thì không mở hội đồng của tầng trên.**

**Packaging-distribution cắt ngang mọi tầng** (owner 11:17 đồng ý): mỗi tầng soát luôn doctor row, bước `fgos setup` và phần đóng gói/activate của chính component tầng đó, theo cổng 8; không làm thành một đợt riêng.

**Land:** theo từng tầng (owner 10:01): mỗi tầng đóng thì lên main, build release, activate ba workspace, doctor, smoke, đo lại.

### 4.3 Đánh giá chuyển Node sang Rust ở mỗi tầng

- **Tiêu chí chuyển** (nguyên tắc thiết kế 4 và 7). Chuyển phần Node khi nó rơi vào một trong ba trường hợp:
  - Node đang **quyết** một việc mà crate của tầng là authority. Hai nơi cùng quyết thì chuyển sang Rust và xoá bản Node.
  - Nó nằm trên đường nóng hoặc đường an toàn.
  - Nó là primitive dùng chung cho cả hệ thống.

  **Không chuyển** phần Node chỉ là adapter mỏng (gọi route, định dạng output), hay là logic của tầng trên.
- **Ưu tiên tầng thấp, đưa trọn về Rust** (owner 10:01): foundation nửa Node nửa Rust thì mất ổn định. Mục tiêu của T0–T4 là **không còn logic quyết định nào ở Node**; Node chỉ còn client mỏng gọi route. Chấp nhận chi phí chuyển (kể cả phần chuyển không làm gọn ngay) cho các tầng này. Từ T5 trở lên mới áp tiêu chí "lợi ích gọn / công chuyển".
- **Trình tự:** chỉ chuyển trong tầng đang soát, sau khi đã sửa xong lỗi của tầng đó; tầng dưới chuyển trọn rồi tầng trên mới dựa vào.
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

## 4.7 Ba trọng tâm owner nhấn (09:42)

### a. Code thừa, nhiều đường cho một việc: thấy là tìm cách bỏ

- Ở mỗi tầng, hội đồng lập danh sách các nơi **cùng làm một việc**: phán sống/chết tiến trình, ghi file atomic, tìm `.fgos`, giữ lock, gọi git, đọc config.
- Mỗi việc chỉ giữ **một cửa**, là cửa của crate sở hữu việc đó. Các đường còn lại chuyển caller sang cửa đó rồi xoá trong cùng đợt.
- Code không còn caller (kiểm bằng `rg`/GitNexus cộng bằng chứng chạy) thì xoá.
- Thước đo của mỗi tầng: **số dòng Node + Rust của tầng giảm**, và số đường song song giảm về 1.

### b. Test thừa và vì sao cả bộ test ngày càng chậm

**Số liệu hiện có** (máy owner, 10-20/21):
- Toàn suite chạy **1046–1316 s**, trong khi baseline ghi 202 s ở `f38dfd1d0`; cần kiểm lại baseline đó đo trên máy nào, lúc tải ra sao.
- 581 file, khoảng 8 094 `test()`.
- Từ 10-01 tới nay **thêm 266 file test, xoá 102**.
- Lần chạy gần nhất có 3 file chạm trần **600 s mỗi file** (`help-routes`, `worktree`, `run-provider-failover`), và tổng thời gian các test cộng lại khoảng 22 700 s.
- Đếm theo file test:
  - 162 file gọi CLI hoặc host `fgos` thật;
  - 169 file chạy `fgos init`;
  - 49 file tạo repo git;
  - 117 file dùng herdr hoặc bwrap thật;
  - 156 chỗ chờ bằng `setTimeout`/`sleep`.
- Mỗi lần verify đêm qua, khoảng 13–22 file hỏng khi chạy cả suite nhưng xanh khi chạy riêng. Test nhạy với tải là một phần của vấn đề.

**Giả thuyết cần kiểm** (chưa phải kết luận):
1. Test ở **tầng quá cao**: nhiều hành vi được chứng minh bằng cách spawn CLI/host và chạy `fgos init` thật, trong khi tầng thấp hơn (crate Rust, hàm thuần) đã có thể chứng minh. Nguyên tắc 8 chỉ mới thành luật gần đây, nên test cũ chưa được dời xuống.
2. **Lặp giữa Rust và Node**: cùng một ca được viết ở cả `cargo test` lẫn Node.
3. **Quy trình tạo test làm test phình**: mỗi phase/lead thêm test riêng cho cái mình làm mà không gỡ test của cơ chế bị thay, hoặc không tìm test chủ để mở rộng. Ví dụ là 266 file thêm so với 102 file xoá.
4. **Cơ chế chạy**: concurrency, queue toàn máy, fixture dựng lại cho từng test (`fgos init`, git repo), chờ bằng thời gian thay vì chờ theo sự kiện, timeout 600 s mỗi file.
5. **Test mang máy thật vào** (herdr, bwrap, process thật) ở những chỗ chỉ cần chứng minh logic.

**Cách làm:**
- **Ở T0, đo một lần cho toàn hệ:**
  - thời gian theo file và theo test;
  - phân bố chi phí: spawn, init, git, sleep;
  - tách nguyên nhân do cơ chế chạy với nguyên nhân do bản thân test;
  - truy lịch sử: test tăng ở đâu, vì quy trình nào, so với số đã xoá.

  Kết quả là danh sách nguyên nhân có số liệu, và một đề xuất sửa **quy trình tạo test** để nó không phình lại (ví dụ: cổng trong cook/lead brief bắt phải tìm test chủ và gỡ test của cơ chế bị thay).
- **Rà tổng quát chỉ làm một lần ở T0** (owner 10:01: đã rà tổng nhiều lần mà vẫn chưa ổn). **Rà từng tầng phải sâu và nghiêm túc hơn:** đọc từng dòng của crate và mặt tiền Node của tầng, mỗi phát hiện quan trọng có test tái hiện đỏ-trước, red-team đi tìm phần bị bỏ sót, không đóng tầng khi còn phát hiện chưa tái hiện ở mức High trở lên.
- **Ở mỗi tầng:** soát test của chính component đó:
  - dời test xuống tầng thấp nhất chứng minh được;
  - gỡ test lặp giữa Rust và Node, và test của cơ chế đã xoá;
  - ghi tên test chủ của từng hành vi;
  - thay chờ theo thời gian bằng chờ theo sự kiện.

  Thước đo của tầng: số test và thời gian test của tầng giảm, độ phủ hành vi giữ nguyên.
- **Phối hợp với luồng TEST** (máy thứ hai) để không làm trùng. Luồng TEST đang chạy phase 2: mỗi port Rust giữ một test route Node, gỡ bản Node lặp ca Rust. Đề xuất: HARDEN làm phần test của từng component khi tới tầng đó, còn luồng TEST giữ luật chung và công cụ đo (`suite:`, baseline, kiểm test trùng). Nhắn phiên TEST trước khi mở T0.

### c. Chuyển sang Rust: ưu tiên chỗ dễ mà làm hệ thống gọn hơn

Ở mỗi tầng, xếp ứng viên theo **lợi ích gọn hơn / công chuyển**:
- **Làm trước:** chỗ Node đang tự quyết lại việc mà crate đã quyết (xoá bản Node, Node chỉ còn gọi route). Đây là chỗ vừa dễ vừa giảm code nhiều nhất.
- **Làm sau:** chỗ phải viết logic mới trong Rust.
- **Không làm:** chỗ chuyển xong không làm gọn hơn.

Mỗi lần chuyển đều phải qua chín cổng của mục 3.

## 5. Owner quyết

Đã duyệt:
- 10:01: chuyển Rust ưu tiên tầng thấp, đưa trọn về Rust, chấp nhận chi phí; land theo từng tầng; không giới hạn ngân sách model; điều tra test tổng một lần ở T0, rà từng tầng sâu hơn; thêm trục G và cổng 6.
- 11:17: **kết thúc ở T5**; Packaging-distribution soát theo từng tầng; thêm **cổng 8 (doctor check và setup của component)**.

Đề xuất đã đủ để lập plan.
