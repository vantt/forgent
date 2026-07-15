# Chu trình Work-Item của fgOS — tầm nhìn nền tảng

**Trạng thái:** TẦM NHÌN / ĐỊNH HƯỚNG — chưa khoá thành luật (platform-foundations) hay spec;
còn câu hỏi mở. **Ngày:** 2026-07-15. Nguồn: định hướng của chủ sản phẩm.

Tài liệu này ghi lại chu trình sống của một work-item để không mất, và làm khung cho các PBI
kế tiếp. Nó chưa phải hợp đồng thi hành — mọi bước chưa dựng đều là backlog.

## 1. Ý tưởng cốt lõi

fgOS **không phải** "runner headless không người". Nó là **pipeline bán-tự-động
(mixed-autonomy)**: tự động là mặc định, người xen vào ở những **cổng (gate) có điều kiện**, và
mức độ người-tham-gia **thay đổi theo giai đoạn** của work-item — không cố định.

Khác biệt cốt tử với bee: **bee chặn phiên chat ở mỗi gate**; fgOS biến gate thành **checkpoint
bất đồng bộ** mà hệ *đậu lại (park) và chờ người quay lại* — tuỳ chế độ intake. Người không phải
lúc nào cũng ngồi đợi.

## 2. Chu trình chung nền tảng (base workflow)

Mọi loại công việc chia sẻ MỘT chu trình xương sống; mỗi domain (coding, marketing, HR,
finance…) **kế thừa base và thêm stage riêng**:

1. **Init / Intake** — tiếp nhận vấn đề vào hệ thống.
2. **Làm rõ (Clarify)** — phân loại, khám phá ngữ cảnh, và (nếu cần) exploring cùng người.
3. **Chia việc (Divide)** — làm giàu ngữ cảnh + planning thành các item nhỏ độc lập, dependency
   rõ, đẩy vào queue.
4. **Thực thi (Execute)** — runner tự làm từng item; tạo PR; người review; hệ tự merge.
5. **Compound-learning** — học từ chính vận hành.

Domain **coding** thêm: context-discovery, PR lifecycle. Marketing/HR/finance sẽ thêm stage của
họ trên cùng base này. **Một base — nhiều domain-extension.**

## 3. Hai chế độ Intake

- **(a) Submit rồi rời đi (un-attended):** người nộp vấn đề rồi bỏ đi. Hệ ghi nhận + tự phân
  loại; các bước sau **đậu lại ở cổng-người khi cần và chờ người quay lại** (bất đồng bộ), không
  chặn một phiên sống.
- **(b) Submit và xử lý ngay (collaborate-now):** người nộp và muốn làm cùng; hệ tiếp tục
  tương tác để triển khai các bước, dừng ở cổng-người theo thời gian thực.

## 4. Chu trình coding (cụ thể hoá base cho coding)

1. Người đưa vấn đề vào (**intake**) — 2 chế độ (a)/(b).
2. Hệ **ghi nhận một work-item** và phân loại như thường.
3. Runner sơ khởi chạy **phân loại + context-discovery** (bước khởi đầu).
4. Task đơn giản, thuần, không phức tạp → mark **`ready`**; một runner khác pick để xử lý.
5. Task **chưa rõ + phức tạp**, cần định hướng cùng người → chuyển trạng thái **`need-exploring`**.
6. Kích hoạt bước **exploring** (giống bee).
7. Chốt xong → hệ tự **làm giàu context + planning** thành **n item nhỏ độc lập**, dependency rõ,
   chia nhỏ và đẩy vào **queue**. *(Câu hỏi mở: bước này chạy runner không-người-đợi, hay cần
   người ngồi đợi — xem §7.)*
8. Hệ tự **giải quyết các item** bằng runner.
9. **Tạo PR**.
10. **Người review PR** (cổng-người).
11. Hệ **tự merge PR**.

## 5. Bản đồ người-tham-gia (human-involvement map)

| Giai đoạn | Người tham gia? |
|---|---|
| 1 Intake / submit | **NGƯỜI** khởi tạo (2 chế độ) |
| 2 Ghi nhận + phân loại | Tự động |
| 3 Phân loại + context-discovery | Tự động (runner sơ khởi) |
| 4 Simple → `ready` → pick | Tự động |
| 5 Unclear → `need-exploring` | Tự động chuyển trạng thái |
| 6 Exploring | **NGƯỜI** (hoặc hoãn tới khi người quay lại nếu chế độ (a)) |
| 7 Enrich + planning → queue | Tự động — *có thể* cần **NGƯỜI** (câu hỏi mở) |
| 8 Execute item nhỏ | Tự động (runner) |
| 9 Tạo PR | Tự động |
| 10 Review PR | **NGƯỜI** (cổng) |
| 11 Merge PR | Tự động |

## 6. Ánh xạ Phase 1/2/3 hiện có vào chu trình

- **Phase 1 (state-layer)** + **Phase 2 (routing/runner)** = nền của stage **Thực thi**
  (work-state FSM, frontier, runner loop, recovery matrix).
- **Phase 3 (compound-learning)** = stage **Compound-learning**.
- **Chưa có (là backlog):** Intake (1-2), context-discovery + `need-exploring` + exploring
  trong-sản-phẩm (3,5,6), auto planning→queue (7), PR lifecycle (9-11), và mô hình
  base-workflow / domain-extension.

## 7. Câu hỏi mở (chưa quyết — cần chốt khi tới stage tương ứng)

1. **Bước 7 (planning) có cần người đợi không?** Một mặt exploring nên giải quyết hết khúc mắc;
   mặt khác chính lúc planning mới lộ khúc mắc → có thể cần một cổng-người ở đây. Chưa ngã ngũ.
2. **Workspace thực thi (bước 8-9):** mỗi item nhỏ một git worktree riêng, hay nhiều item chung
   một worktree?
3. **Độ hạt PR (bước 9):** mỗi item nhỏ một PR, hay gom mọi item nhỏ của một
   human-submitted-item thành một PR?

## 8. Ảnh hưởng tới "capture 2 kênh" (Phase 3 slice 2)

Chu trình này giải toả điểm mờ của slice 2: **capture bám vào các chuyển-trạng-thái của FSM
lifecycle, không phải "lượt chat"** — đúng thứ Phase 1/2 đã dựng.

- **Settlement (kênh 1)** = ghi tại các transition **ngã-ngũ**: quyết định lock ở exploring (6),
  PR duyệt (10), và các auto-transition. **Actor thay đổi theo stage** (người ở cổng, runner ở
  bước tự động). Dạng đầy đủ **chờ các stage này được dựng**; hiện chỉ có transition của
  work-state FSM (todo/doing/proposed/blocked/done).
- **Friction (kênh 2)** = ghi tại transition **thất bại** của bất kỳ bước tự động nào (execute,
  discovery…), runner **tự quy tội**. **Làm được ngay** — nhánh fail đã tồn tại (park/halt).

→ Củng cố hướng: slice 2 làm **friction trước** (độc lập, cần thật, không phụ thuộc stage chưa
dựng); settlement dạng đầy đủ theo sau khi các stage lifecycle (exploring/PR) được dựng.
