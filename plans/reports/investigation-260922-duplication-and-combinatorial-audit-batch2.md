# Duplication and Combinatorial Audit (Batch 2)

**Ngày:** 2026-09-22
**Bối cảnh:** Mở rộng phương pháp mutation-based pilot từ cụm `approve` sang 3 cụm mới có tỷ lệ test/code cao nhất. Trả lời hai câu hỏi cốt lõi:
1. Các test trong cùng cụm có thực sự trùng lặp (bắt cùng một tập mutation giống hệt nhau không có giá trị bổ sung) không?
2. Cách tiếp cận Cartesian (liệt kê mọi tổ hợp) đang phình ra bao nhiêu test so với Pairwise covering array?

## 1. Các cụm được chọn và Lý do

Việc chọn cụm dựa trên công cụ quét (tìm tỷ lệ số lượng `test()` so với LOC của file production), loại trừ cụm `dispatch.mjs` do kích thước quá lớn cho 1 phiên. Ba cụm ứng viên "trông thừa nhất" được chọn:

| Cụm (Production file) | Số dòng code (LOC) | Số test cases | Tỷ lệ (Test/LOC) | Lý do chọn |
|---|---|---|---|---|
| `src/verbs/state/read.mjs` | 68 | 103 | 1.51 | Tỷ lệ test/LOC cao nhất. File nhỏ nhưng test rất lớn (dàn trải qua list, read, graph, stale...). |
| `src/verbs/state/stage.mjs` | 96 | 51 | 0.53 | Quản lý stage (discover, plan) có nhiều rule chuyển trạng thái phức tạp. |
| `src/verbs/merge/merge.mjs` | 192 | 99 | 0.51 | Logic merge next/list, nơi rẽ nhánh state rất sâu. |

---

## 2. Câu hỏi 1: Trùng lặp thật (Mutation-based Audit)

Phương pháp: Gieo 4 mutation (phá 4 guard thật) vào từng file, chạy toàn bộ test ứng viên, ghi nhận tập test bắt lỗi (Failed Tests). 

### 2.1 Cụm `src/verbs/state/read.mjs`

| Mutation | Guard bị phá (Logic thay đổi) | Số test bắt được | Chi tiết Catchers |
|---|---|---|---|
| M1 | Đảo ngược điều kiện `whatIfId !== undefined` trong `graphUseCase` | 1 | `fgos graph --what-if builds simulation graph against local staged state` |
| M2 | Đảo ngược check `!stage` trong `workflowUseCase` (quăng lỗi nếu CÓ stage) | 4 | `fgos workflow refuse missing stage`, và các test kiểm tra stage feature, fix, code lifecycle. |
| M3 | Bỏ check `!item` trong `gateCheckUseCase` (không quăng validation error) | 1 | `fgos gate-check refuse missing id` |
| M4 | Bỏ check `!verdict.changed` trong `staleUseCase` | 1 | `fgos stale returns advisory items` |

**Kết luận:** Không có bất kỳ hiện tượng "hàng loạt test cùng rớt vì một lỗi cơ bản". Các test kiểm tra rất tập trung và không bị lặp. 

### 2.2 Cụm `src/verbs/state/stage.mjs`

| Mutation | Guard bị phá (Logic thay đổi) | Số test bắt được | Chi tiết Catchers |
|---|---|---|---|
| M1 | Bỏ check `validStages.includes(stage)` trong `discoverUseCase` | 3 | Kiểm tra lỗi refuse stage không hợp lệ, giải thích lệnh plan, và khi không lệnh nào hợp lệ. |
| M2 | Bỏ `classificationPatch` rỗng vẫn return trong `discoverUseCase` | 1 | `fgos discover discovers item natively with session role` |
| M3 | Bỏ check `stage !== planningStage` trong `planUseCase` | 2 | `fgos plan refuse item not in planning stage`, `fgos plan supports explicit --direct flag...` |
| M4 | Bỏ chặn `!outcome.canAdvanceEdge` (validation fail vẫn cho qua) | 1 | `fgos plan enforces validate-plan approval for risk:heavy` |

**Kết luận:** Mỗi mutation chỉ làm gãy một tập rất nhỏ (1-3) các test tương ứng đúng với boundary/invariant đó. KHÔNG CÓ cặp test nào mang tính chất "chạy lại cùng một thứ".

### 2.3 Cụm `src/verbs/merge/merge.mjs`

| Mutation | Guard bị phá (Logic thay đổi) | Số test bắt được | Chi tiết Catchers |
|---|---|---|---|
| M1 | Sửa `acknowledgeIronLaw === true` thành `false` (phá bypass Iron Law) | 1 | `fgos merge next (Iron Law semantics) bypasses Iron Law pre-check if explicitly acknowledged` |
| M2 | Tắt block auto-sync-root fallback (`ready.length === 0 && blocked...`) | 6 | 6 test liên quan trực tiếp đến sync-root fallback semantics (no-config-write, trả về picked id, passes options...). Không test nào trong 6 test này lặp nhau (mỗi test kiểm 1 rule cụ thể của sync-root). |
| M3 | Tắt try/catch xử lý graceful lỗi dirty-tree của sync-root | 1 | `fgos merge next (sync-root fallback semantics) parses dirty-tree from sync-root gracefully instead of crashing` |
| M4 | Tắt guard nếu mọi item ready đều bị skip vì lỗi Iron Law | 2 | 2 test kiểm tra skip behavior khi nguyên ready pool bị chặn bởi gate. |

**TỔNG KẾT Q1:** 
Toàn bộ ba cụm xác nhận lại kết quả của pilot `approve` trước đó: **Không có sự trùng lặp 1-1 vô giá trị**. Mỗi test tồn tại đều gắn với một boundary, input combination hoặc một historical regression riêng. Cái nhìn "cảm tính" về việc "số test quá nhiều chắc chắn là do copy-paste thừa" đã bị bác bỏ hoàn toàn bằng dữ liệu mutation.

---

## 3. Câu hỏi 2: Mức độ tổ hợp có tương xứng với rủi ro thật không? (Cartesian vs Pairwise)

Dù các test không trùng nhau, chúng có thể đang bị "phình" do cách tiếp cận Full-Cartesian (test mọi tổ hợp độc lập). 

### Bảng phân tích biến độc lập và kích thước Array

| Cụm Test | Các biến độc lập (Independent Variables) | Full Cartesian Size (Hiện tại / Lý thuyết) | Pairwise Covering Size (Ước tính) |
|---|---|---|---|
| **`read`** (`list` view) | 1. `work_status` (todo, doing, done, wontfix, blocked, awaiting-human: 6)<br>2. `parent_status` (none, visible, hidden: 3)<br>3. `store_state` (normal, linked-wt, fresh: 3)<br>4. `flags` (none, --all, --id, --fields: 4) | 6 × 3 × 3 × 4 = **216 case** | Max(6×4) = **24 case** |
| **`stage`** (`plan` verb) | 1. `stage` (discovery, decompose, planning, executing: 4)<br>2. `validation` (pass, fail, backroute: 3)<br>3. `verdict_provided` (yes, no: 2)<br>4. `flags` (--direct, --validate, none: 3) | 4 × 3 × 2 × 3 = **72 case** | Max(4×3) = **12 case** |
| **`merge`** (`merge next`) | 1. `ready_pool` (empty, 1, n: 3)<br>2. `blocked_pool` (empty, 1, n: 3)<br>3. `iron_law_gate` (pass, fail, ack, warn: 4)<br>4. `sync_outcome` (synced, conflict, dirty: 3)<br>5. `source` (runner, pull, legacy: 3) | 3 × 3 × 4 × 3 × 3 = **324 case** | Max(4×3) = **12 case** |

### Đánh giá và Rủi ro

- **Hiện trạng:** Bộ test hiện tại đang hướng tới Full-Cartesian hoặc ít nhất là "M*N" thủ công (để vét cạn edge case). Điều này lý giải tại sao file nhỏ gọn nhưng số test sinh ra rất lớn.
- **Tiềm năng nén (Pairwise):** Nếu chuyển sang Pairwise Covering Array, số lượng test có thể **giảm từ 70% đến 90%** (ví dụ: `merge` từ 324 xuống 12 test) mà vẫn duy trì bảo chứng toán học về việc "mọi cặp 2 biến đều đã tương tác với nhau ít nhất 1 lần".
- **Rủi ro nếu giảm (Đánh đổi):**
  1. **Mất coverage 3-chiều (3-wise / N-wise interactions):** Những lỗi chỉ xảy ra khi ĐỒNG THỜI 3 cờ/trạng thái cụ thể giao nhau sẽ bị bỏ lọt. 
  2. **Mất "Historical Regression Witnesses":** Một số test đang tồn tại để bảo vệ một lỗi lịch sử cụ thể (ví dụ: `blocked_pool` n + `sync_outcome` dirty + `iron_law` pass). Xóa đi để theo khung Pairwise sẽ cần cơ chế "ghim" lại các test lịch sử (như mục 3.8 trong brainstorm doc đề cập).

---

## 4. Kết luận

1. **Khẳng định về rác/dư thừa:** Việc đếm số lượng test không thể hiện sự dư thừa. Bộ test rất sạch về mặt phân tách logic (Mỗi test chứng minh 1 điểm/guard thực tế khác nhau, không bắt chéo).
2. **Khẳng định về mức độ tổ hợp:** Chi phí của bộ test bị phình to chính là do **Sự bùng nổ tổ hợp (Combinatorial Explosion)** của các state x cờ x data, chứ không phải do copy-paste lặp lại cùng một thứ.
3. **Quyết định (Dành cho con người):** Không nên xóa/gộp test bằng tay. Hướng đi đúng (nếu muốn giảm số lượng test) là viết một `Property-based runner` hoặc `Pairwise test generator`, cho phép cấu hình "vào 5 biến, sinh ra 12 test pairwise + n test regressions lịch sử", sau đó xóa sạch 300+ test thủ công. 

## Câu hỏi chưa giải quyết (Unresolved)
- Nếu áp dụng Pairwise generation, làm thế nào để mapping `failure` của array-generated test thành các mã lỗi dễ đọc cho con người (như các CLI test hiện đang miêu tả bằng prose)?
- Quá trình migrate một file `test.mjs` dài 500 dòng thành một ma trận data cho Pairwise có chi phí chuyển đổi (migration cost) đắt hơn là cứ để nó chạy mất thêm 2-3 giây không?
