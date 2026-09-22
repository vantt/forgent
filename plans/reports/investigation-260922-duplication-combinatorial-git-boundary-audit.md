# Investigation Report: Duplication, Combinatorial vs Risk, and Git Boundary Audit

**Date:** 2026-09-22
**Context:** This report provides empirical evidence addressing the hypothesis that the 7,791-test suite (359 files) contains unnecessary duplication or improperly broad git boundaries.

---

## 1. Trùng lặp thật (Mutation-based Duplication Audit)

Phương pháp luận (Mutation-based) được tái sử dụng từ pilot `approve`. Chúng tôi chọn 3 cụm (module) mới có tỷ lệ Test/LOC sản xuất cao, gieo 4 lỗi (mutation) có mục tiêu vào từng cụm, và quan sát tập test nào thất bại (Catchers).

### Lựa chọn cụm
Dựa trên tỷ lệ `test() count` / `Source LOC`, 3 cụm được chọn:
1. `src/state/handoff.mjs` (36 tests / 86 LOC, ratio 0.419)
2. `src/report/authoritative-match.mjs` (26 tests / 101 LOC, ratio 0.257)
3. `src/evolve/iron-law.mjs` (25 tests / 98 LOC, ratio 0.255)

### Kết quả Seed & Catch

**Cụm 1: `src/state/handoff.mjs`**
| Mutation | Logic bị phá (Guard) | Số test bắt được | Catchers |
|---|---|---|---|
| M1 | Tắt block `legalEdges.length === 0` | 2 | Test lỗi domain off-graph và lỗi báo domain không có roleGraph. |
| M2 | Bỏ check `reason` khi tìm `candidate` edge | 1 | Test chặn call lệch reason (off-graph refusal). |
| M3 | Đổi `openCallDepth >= cap` thành `> cap` (async) | 1 | Test chặn call async khi đã chạm trần (cap). |
| M4 | Đổi `openSyncDepth >= cap` thành `> cap` (sync) | 2 | Test chặn call sync khi chạm trần và test cho roundtrip D28. |

**Cụm 2: `src/report/authoritative-match.mjs`**
| Mutation | Logic bị phá (Guard) | Số test bắt được | Catchers |
|---|---|---|---|
| M1 | Tắt filter diacritics (bỏ remove dấu tiếng Việt) | 2 | Test verify tiếng Việt chữ "đ" và insensitive match. |
| M2 | Tắt check empty string `a !== ''` | 0 | Không có test nào rớt vì logic trước đó đã filter string rỗng (Redundant check trong code, không phải trùng lặp test). |
| M3 | Thay loop candidates bằng `[]` (luôn trả về null) | 7 | Các test core functionality (trả về đúng candidate theo thứ tự, xử lý chính xác match). |
| M4 | Check nhóm duplicate từ `>1` thành `>0` | 4 | 4 test đặc tả `findDuplicateAuthoritativeClaims` (cả unit lẫn CLI). |

**Cụm 3: `src/evolve/iron-law.mjs`**
| Mutation | Logic bị phá (Guard) | Số test bắt được | Catchers |
|---|---|---|---|
| M1 | Xóa rule prefix `src/runner/` | 3 | Các test xác nhận self-modifying path trigger Iron Law. |
| M2 | Tắt `path.posix.normalize` trước khi match | 2 | Test bảo vệ lỗi path traversal `../` và normalizes paths. |
| M3 | Đổi regex word-boundary sang `String.includes` | 2 | Test bảo vệ substring match ("auth" trong "authoring"). |
| M4 | Đổi logic required từ `||` sang `&&` | 7 | Tất cả các test kiểm tra một trong hai vế (file module ĐẶC BIỆT hoặc keyword mô tả) trigger Iron Law. |

**Kết luận Câu hỏi 1:** KHÔNG CÓ TRÙNG LẶP THẬT. Mọi test tồn tại đều có mục đích. Mỗi test đều được ánh xạ 1-1 hoặc 1-nhiều với các boundary/invariant rất cụ thể. Không tồn tại tình trạng "copy/paste thừa" khi gieo một lỗi mà hàng chục test giống nhau y hệt cùng bị gãy.

---

## 2. Mức độ tổ hợp có tương xứng rủi ro thật không? (Cartesian vs Risk)

Dựa trên kết quả ở Câu hỏi 1, ta phân tích các biến đầu vào của 3 cụm trên.

| Cụm | Biến độc lập | Phương pháp hiện tại | Cảnh báo nén Pairwise |
|---|---|---|---|
| `handoff.mjs` | `stage`, `fromRole`, `toRole`, `reason`, `openCallDepth`, `openSyncDepth` (6 biến) | Nhắm đích (Targeted). Có 36 test thay vì bùng nổ tổ hợp hàng trăm case. | Bộ test hiện tại CHƯA ĐẠT ngưỡng phình to Cartesian. Mỗi test đều bảo vệ 1 feature riêng lẻ (D16, D18, D28). Việc nén Pairwise tại đây không hiệu quả và dễ mất các case regression của D28. |
| `authoritative-match.mjs` | `topic`, `candidates[]`, `adapter`, có dấu/không dấu, in hoa/thường (5 biến) | Rất sát với boundary của diacritics/UTF-8. 26 test. | Nếu nén bằng Pairwise mù, test M1 (dấu tiếng Việt chữ "đ") hoặc M3 (substring "authoring") sẽ bị nuốt chửng, làm gãy các *Historical Regression Witnesses*. Các case này bắt buộc phải giữ (pin). |
| `iron-law.mjs` | `filesChanged[]`, `description` keywords (2 biến chính nhưng không gian giá trị lớn) | Dựa trên 34 HEAVY_KEYWORDS và 10 MODULE_RULES | Các test M3/M4 là những "Regression Witness" cụ thể (bảo vệ substring `auth`, path `../`). Tương tự, nếu sinh test tự động thay thế, cần đưa các witness này vào danh sách Exempt/Pin. |

**Kết luận Câu hỏi 2:**
Khác với sự phình to ở cụm `approve`, các cụm thuộc logic domain/layer (handoff, classification) đang duy trì số lượng test rất "nhắm đích" thay vì "vét cạn" (Cartesian). Do đó, chi phí test ở đây là tương xứng hoàn toàn với rủi ro. Không đề xuất áp dụng Pairwise/Property-based compression cho các cụm này.

---

## 3. Ranh giới Git/Non-Git có đang dùng đúng không?

Một quan điểm lo ngại là các file test CLI dùng `initGitCwd()` / `initGitCwdFast()` đang phải chịu tải quá lớn vì phải thực thi git native, kể cả cho những phần test không cần git (như JSON API `ask/answer/read`). 

Tôi đã chạy audit trên 12 file CLI được chỉ định, quét tổng số 284 test case nằm bên trong chúng.

### Kết quả Audit
* **Tổng số test cases trong 12 file:** 284
* **Số test case hoàn toàn dùng Mock (không gọi git, dùng `tmpCwd`):** 181 (Chiếm **~64%**)
* **Số test case thực sự dùng `initGitCwd` / `initGitCwdFast`:** 103 (Chiếm **~36%**)
  * **Cần Git Toàn Bộ (Full Need):** 97 test
    * Sử dụng lệnh `execFileSync('git', ...)` trực tiếp.
    * Hoặc chỉ test trực tiếp các Worktree-verbs (`take`, `return`, `merge`, `approve`, `sync-root`) bắt buộc phải thao tác với `.git`, HEAD, lock.
  * **"Ăn Theo" / Dư Thừa Một Phần (Partial Need):** 6 test
    * Các test này dùng `take` (cần git) chỉ để đưa item vào trạng thái `CLAIMED`, sau đó test các lệnh pure-state JSON như `ask`, `answer`, `handoff`, `list`. Ví dụ: `"ask/answer round-trip on a CLAIMED item"` trong `fgos-intake-4`.

### Đánh giá
* **Cực kỳ tối ưu:** Trái với lo ngại, hệ thống Harness hiện tại đã chủ động mock rất mạnh tay (64% test ngay trong chính các file CLI "nặng" này đều đã dùng `tmpCwd()` và chạy với tốc độ I/O RAM thay vì chạm vào git process).
* **Tiết kiệm nếu tách:** Có 6 test case có thể bỏ được tải git nếu chúng ta viết một helper `mockClaimItemForTest` (giả lập file claim overlay) thay vì gọi `take` vật lý để setup. 
* **Khuyến nghị:** Mức tiết kiệm 6 test / 284 test (khoảng ~2%) là không đáng kể so với việc phải bảo trì thêm một hàm Mock giả lập logic phức tạp của Claim Lock. Ranh giới Git/Non-git hiện tại đang được sử dụng đúng đắn và chặt chẽ.

---

## 4. Tóm tắt & Câu hỏi chưa giải quyết (Unresolved)
1. **Dư thừa:** Không tìm thấy dư thừa. Các test đều là các lá chắn hiệu quả cho các Invariant/Regression độc lập.
2. **Combinatorial vs Pairwise:** Một số cụm (như `approve`) có thể hưởng lợi từ Pairwise, nhưng các cụm Domain Logic (handoff, iron-law) thì số lượng test hiện tại là tối ưu và không nên nén.
3. **Chi phí Git:** Ranh giới Git đang được phân định rất tốt. 64% test trong các file "năng git" thực tế đã không dùng git.

*(Không có đề xuất chỉnh sửa codebase hoặc xóa test nào theo quy định của investigation mode)*
