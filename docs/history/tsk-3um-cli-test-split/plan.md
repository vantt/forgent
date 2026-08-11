# plan.md — tsk-3um: chẻ `test/cli/fgos.test.mjs`

Kế thừa quyết định đã khoá ở
[`../tsk-25b-test-wallclock-split/CONTEXT.md`](../tsk-25b-test-wallclock-split/CONTEXT.md)
(D1/D2/D3) và Phase 1 của
[`../tsk-25b-test-wallclock-split/plan.md`](../tsk-25b-test-wallclock-split/plan.md).
Không mở lại quyết định nào ở đây.

Mode: **standard**

**Flag count: 2** — `public contracts` (D1 xoá hẳn đường dẫn
`test/cli/fgos.test.mjs`, thứ 55 item tham chiếu trong `verify` và 158 doc
nhắc tới), `existing covered behavior` (di chuyển 547 test đang phủ thật).
Không cờ hard-gate: D2 cấm sửa/xoá test, chỉ cho di chuyển, nên đây **không**
phải `removing a validation`.

Vì sao không `small`: 547 test, một file 9761 dòng có helper dùng chung phải
trích ra, cộng việc sửa `verify` của item khác đang bay. Không phải "vài
file, không vùng xám".

## Approach

### Đường cắt

Cắt theo **verb của CLI** — đơn vị chủ đề tự nhiên của file này, và đúng quy
ước sẵn có của thư mục (`fgos-help.test.mjs`, `fgos-manifest.test.mjs`,
`fgos-tool.test.mjs`, `take-pick-claim-eligibility.test.mjs`). Phân bố thật,
đếm từ `^test('<verb>` trên chính file:

| Verb | Test |
|---|---|
| approve 47, merge 17 | 64 |
| edit 41, add 39 | 80 |
| return 43, review 15, reject 4 | 62 |
| take 17, pick 18, session 11, unlock 6, lock-status 6, main-checkout-reset 3 | 61 |
| submit 24, move 16, ask/answer 5, decision 4 | 49 |
| list 22, show 6, ready 11, triage 6, graph 4, rollup 11, stale 4, conflicts 4, goal 6 | 74 |
| discover 11, decompose 8, evolve 13, promote-to-component 8, sync-root 10, check 20 | 70 |
| cleanup 7, compound 9, catchup 9, init 9, docs-index 5, doc-sources 5, + phần lẻ | ~87 |

**8 nhóm**, trung bình ~68 test/nhóm. Với ~0.31s/test (171.0s / 547) thì mỗi
nhóm ≈ 21s — dưới ngưỡng 30s của D3, còn biên cho nhóm lệch.

Ranh giới cuối cùng **cân bằng theo chi phí đo được, không theo đếm đầu
test** (xem P1b). Bảng trên là điểm xuất phát, không phải con số bất di.

### Helper dùng chung

`run()`, `rawTmpCwd()`, `tmpCwd()` và các fixture git (`fgos.test.mjs:44-190`)
trích ra `test/cli/helpers/fgos-cli-harness.mjs`, import vào từng file mới.
Nằm trong định nghĩa "chẻ cơ học" đã pin ở `CONTEXT.md` ("kèm phần
import/helper cần thiết"). Đặt dưới `helpers/` với đuôi không phải
`.test.mjs` nên glob `test/**/*.test.mjs` không nhặt nó làm file test.

### Bản đồ rủi ro

| Thành phần | Mức | Proof point |
|---|---|---|
| **Ngưỡng 45s có thể bất khả thi** — wall-clock ≈ max(file); nếu file chậm thứ ba của suite đã > 45s thì chẻ hoàn hảo cũng không tới đích. | **cao** | **P1**: đo `time npm test` trên chính worktree này (baseline mới, thay số 163.1s đo ở worktree tsk-516), rồi đo tuần tự từng file trong 118 file, lấy top 10. Chạy TRƯỚC khi sửa dòng nào. Nếu 45s bất khả thi → dừng, trả D3 về cho người, không đi tiếp. |
| **Chia nhóm theo đếm đầu có thể lệch** — giả định ~0.31s/test đều nhau chưa được chứng minh cho file này. | trung bình | **P1b**: chạy `node --test --test-reporter=spec test/cli/fgos.test.mjs` một lần (~171s), lấy duration từng test, cộng theo nhóm ở bảng trên, chỉnh ranh giới cho nhóm nặng nhất < 30s. |
| **Test phụ thuộc side effect của test chạy trước nó trong cùng file** — tách file là tách process, side effect biến mất. | trung bình | Không cần proof riêng: nếu có, nó đỏ ngay lần chạy đầu sau khi chẻ. Bắt bởi chính verify (0 fail + tổng test không giảm). |
| **5 item còn bay có `verify` trỏ đường dẫn cũ**; 2 trong số đó (`tsk-4uj`, `tsk-1cp`) đang `doing` — phiên khác đang chạm. | trung bình | **P3**: đọc lại danh sách ngay trước khi sửa (danh sách chụp 2026-08-11 có thể đã đổi), chỉ ghi qua verb của engine, không sửa tay `.fgos/`. |
| Vỡ ràng buộc kiến trúc | không | `test/` ngoài `docs/architecture-manifest.json`; `test/architecture.test.mjs` chỉ quét `src/`+`bin/`. |

`impact-analysis: full` (gitnexus `present`). Ghi chú trung thực: không proof
point nào ở trên dựa vào nó — gitnexus chỉ index `src/`+`bin/`, không nói gì
được về `test/`.

## Shape

1. **Đo trước, chưa sửa gì** — P1 rồi P1b. Kết quả ghi vào
   `docs/history/tsk-3um-cli-test-split/` làm bằng chứng before.
2. **Trích helper** ra `test/cli/helpers/fgos-cli-harness.mjs`.
3. **Chuyển test theo 8 nhóm**, ranh giới chốt theo số đo ở P1b. Mỗi nhóm
   một file `test/cli/fgos-<chủ-đề>.test.mjs`.
4. **Xoá `test/cli/fgos.test.mjs`** (D1).
5. **Sửa `verify` của 5 item còn bay** qua verb của engine (P3).
6. **Đo lại** — `npm test` 0 fail, tổng test không giảm, không file nào
   trong `test/cli/` vượt 30s.

### Trường hợp đáng chứng minh

- **Không mất test**: tổng sau = tổng trước (547 trong file này, ~2827 cả
  suite). Bắt bởi verify.
- **Không double-count**: một test bị copy vào hai nhóm sẽ làm tổng > trước —
  cùng phép so bắt được cả hai chiều.
- **Ngưỡng biên**: nhóm nặng nhất phải < 30s chứ không phải ≈ 30s. 8 nhóm
  thay vì 6 chính là biên đó.
- **Helper không thành file test**: `test/cli/helpers/*.mjs` không khớp glob
  `test/**/*.test.mjs`; kiểm bằng chính tổng số test không đổi.

## Assumptions

- **A1** — chi phí mỗi test trong file này tương đối đều (~0.31s). Không dựa
  vào giả định này: P1b đo thật trước khi chốt ranh giới.
- **A2** — 50 item đã ở `cleanup`/`done` mang `verify` trỏ đường dẫn cũ sẽ
  không chạy lại verify, nên không cần sửa (verify chỉ chạy ở `return` và
  post-merge, cả hai đã qua).
- **A3** — tăng số file bận trong `test/cli/` từ 1 lên 8 vẫn nằm trong 16
  core; nếu sai thì wall-clock chạm trần CPU chứ không chạm trần file, và
  P1 sẽ lộ ra khi so số.

## Outstanding questions

None
