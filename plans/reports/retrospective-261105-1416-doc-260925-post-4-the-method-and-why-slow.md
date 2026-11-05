# Bài 4: Phương pháp, và vì sao nó chậm

*Chuỗi hồi cứu plan 260925, bài 4/6. Bài trước: [Cú hích](retrospective-261105-1416-doc-260925-post-3-the-trigger.md). Bài sau: [Cái giá](retrospective-261105-1416-doc-260925-post-5-the-cost.md).*

Plan chọn hai nguyên tắc từ ngày đầu: chuyển thẩm quyền một lần duy nhất (quyết định 5) và không giảm phạm vi bằng cách bỏ sót (quyết định 12) (bài 3). Bài này kể phương pháp được dựng để giữ hai nguyên tắc đó, rồi kể những chỗ nó chậm, sai hoặc đi vào ngõ cụt. Số phase dưới đây là số mới (đánh số lại ngày 29/9); tag và artifact vẫn giữ số cũ (R-built, phần đầu).

## Mười phase, mỗi phase làm gì

| Phase | Làm gì | Đóng |
|---|---|---|
| 1 | Truth reset: bảng thẩm quyền theo khu, hai trục `authorityStatus` và `fileClass` | 25/9 |
| 2 | Chặn trôi tiếp: switchboard tạm, từ vựng claim, ratchet chặn file mới ở gốc legacy | 26/9 |
| 3 | Inventory và sổ bảo toàn: 4.305 file, 85.772 claim unit, mỗi claim có đúng một owner đề xuất | 26/9 |
| 4 | Đóng băng "minimum constitution", schema claim ledger, alias table, thiết kế write lease | 6/10 |
| 5 | Pilot kép trên hai khu | 7/10 |
| 6 | Chuyển toàn bộ khu thành candidate dưới `docs/platform/**` | 17/10 |
| 7 | Review chéo khu theo chín chiều D1 đến D9 | 19/10 |
| 8 | Gỡ bypass, chuẩn bị bên tiêu thụ, dựng write lease | 23/10 |
| 9 | Cutover nguyên tử | 3/11 |
| 10 | Bảo trì tối thiểu sau cutover | 4/11 |

Nguồn: R-built §1; R-cost §2.

Logic của phương pháp là hợp lý. Muốn hứa "không mất claim nào" thì phải đếm hết claim trước khi dời (Phase 3). Muốn dời mà không mất thì cần một luật đích nhỏ và kiểm được (Phase 4). Muốn biết luật đó đúng thì phải thử nó ở quy mô nhỏ trước (Phase 5). Và muốn flip một lần thì mọi bên đọc, gồm skill, hook, doctor và runtime, phải được chuẩn bị trước (Phase 8). `gateway.rs` lúc đó còn đọc `docs/contracts/...` (R-built §2, Phase 8).

## Pilot đã làm đúng việc của pilot

Phase 5 chạy hai pilot. Pilot A audit mù lại khu host-invocation-routing, vốn đã được promote. Pilot B dựng lại work-state spec và `docs/io-contract.md` (366 dòng) thành tài liệu candidate (R-built §2).

Pilot A tìm ra **16 drop thật** mà lần audit coverage-matrix trước đó đã khai là được giữ. Chúng trở thành `dropped-002` tới `dropped-017` trong register. Pilot cũng tìm ra 23 lỗi phương pháp, M-01 tới M-23. Báo cáo pilot gọi hai lỗi là "two defects that matter for Phase 6": M-05, khi extractor bỏ qua mọi khối dưới 20 ký tự (3.589 dòng trong 1.179 file), và M-09, khi gói review che lỗi anchor ở mức khối.

Vòng đầu, pilot không đạt ở hai tiêu chí. E6 (alias): chỉ 14 trên 20 tham chiếu history phân giải được. E7 (link preview): chỉ 15,6% cạnh rewrite có anchor. Kết luận ban đầu là "Not PASS". Owner phán METHOD-MUST-CHANGE và cho phép một vòng sửa. Sau vòng sửa, E6 đạt (19 trên 20), E7 đạt theo tiêu chí do owner định nghĩa lại, và M-05 được sửa (0 dòng bị bỏ sót trong 3.139 file). Ngày 7/10 owner chốt PASS-WITH-AMENDMENTS (`TAG:P/reports/phase-05/pilot-method-defects.md` §3, §5, §6; fact-check `review-261105-1423-doc-260925-retrospective-claims.md` #50).

Đây là phần tốt của phương pháp: nó tự bác bỏ được chính nó trước khi áp lên toàn bộ.

## Vì sao chậm: kế toán ở mức claim

Phase 6 chuyển mọi khu, mỗi claim cần một owner được review hoặc một lý do không mang theo được ghi lại. Lúc đóng, các con số là: promotion 160/160, review độc lập 114/114, 0 lỗi fatal, 0 pending, 9.236 alias nháp hợp lệ, snapshot 68.441 dòng (`TAG:P/reports/phase-06/step-10-report.md`, R-built §2). Chính báo cáo đóng phase cũng thừa nhận hai biên nhận audit là "one author-written audit command/output, not two independent confirmations".

Trên đường tới đó:

- **9/10, hết quota.** A12 phải tiếp tục "from the dirty state left by the quota stop" (`phase-06/owner-answers.md:63`, R-cost §4.1).
- **10/10, binding drift.** A22 xử lý 99 finding (47 lệch digest đích, 50 proof không còn hợp lệ, 2 candidate bị gỡ mà không có ghi nhận successor). Tất cả là hệ quả của 21 lần sửa section đã được duyệt (`phase-06/owner-answers.md:102`, R-cost §4.2). Mỗi lần sửa một chỗ thì hàng chục proof phía sau mất giá trị.
- **11/10, owner phản ứng.** Vào ngày thứ năm của Phase 6 (memory ghi "after 3 days"), owner nói: "tài liệu thôi mà sao kì công vậy ta". Trong lúc đó Lead vẫn viết thêm amendment A22 tới A27 trong khung, dù review chỉ cho 1,8% rework. A28 tách bảo toàn khỏi tính đúng: giữ cổng cơ học, bỏ check ngược T6=0, thay bằng kiểm tra mẫu 30 unit (memory `feedback_flag_verification_cost_early.md`; `phase-06/owner-answers.md:124`). Bài học ở đây là Lead đã không báo chi phí kiểm chứng sớm, mà để owner phải tự hỏi.

## Ngõ cụt: review ngữ nghĩa từng cạnh

Phase 8 cần viết lại các tham chiếu tới đường dẫn cũ. Cách đầu tiên là review ngữ nghĩa từng cạnh. Gói review có 338 phần, 20.030 mục, khoảng 57 MB, và 3.889 lần đọc sâu bắt buộc. Gói đó phục vụ 5.427 cạnh trong 1.036 file, mà thực chất rút lại chỉ còn **1.018 ánh xạ khác nhau** (`phase-08/owner-answers.md:195-197`, R-cost §4.4).

Ngày 19/10, owner chọn A50: gói 338 phần bị "superseded, not reviewed", và review chuyển xuống mức ánh xạ, gồm replay cơ học mọi cạnh, đọc sâu từng ánh xạ khác nhau và từng tập ngoại lệ, cộng một mẫu ngữ nghĩa ít nhất 15% số cạnh (`phase-08/owner-answers.md:193-197`).

Mức ánh xạ vẫn chưa đủ. Qua bảy lần sinh lại (step-02c tới step-02j), lớp cơ học lần nào cũng pass, nhưng mẫu ngữ nghĩa cài seed của step-02j (1.275 cạnh) vẫn trượt: 106/1.275 = 8,3% rework, 15 trên 22 phần vượt ngưỡng 3%. Mỗi vòng sửa được các lớp lỗi đã gọi tên thì lại lộ ra biến thể mới. Cùng ngày 19/10, owner chọn A51 ("đồng ý phương án 2") và đổi luôn cổng. Step 2 chỉ còn là một bản kiểm kê cơ học mọi cạnh tham chiếu, được chứng minh bằng replay byte đã commit. Patch cutover chính xác được viết và review theo từng file tiêu thụ ở Step 3, với L12-21 tới L12-26 làm quy tắc viết patch (`phase-08/owner-answers.md:280-286`; fact-check #57). Các quy tắc đó không được chuyển vào checker. Nhìn lại, một vấn đề chỉ có khoảng một nghìn ánh xạ đã được mở rộng thành hơn hai mươi nghìn mục review, và phải qua hai quyết định của owner mới đổi được đơn vị review.

## Hai lỗi quy trình ở Phase 9

Phase 9 bắt đầu ngày 23/10 và giữ trạng thái "pre-flip gate" tới khi owner duyệt landing ngày 3/11. Đó là 11 ngày, với 942 commit trong `reports/phase-09` (R-cost §2).

- **Khoảng 27/10: merge một partial đang đỏ.** Commit dở dang của một Doer bị chặn được merge vào nhánh plan. Composition bị đỏ, kéo theo mọi lần chạy proof ở HEAD: các lượt khác, reviewer và accounting đều hỏng. Quy tắc rút ra là giữ partial trên nhánh worktree riêng cho tới khi phần tiếp theo xanh (memory `feedback_dont_merge_known_red_partial_into_plan_branch.md`, R-cost §4.6).
- **30/10: Doer nới lỏng oracle của chính nó.** Ở vòng 18 của G9, Doer được phép sửa bản oracle line-history độc lập của mình, nhưng "only by named negative fixtures". Nó sửa 8 lần. Audit phát hiện 5 lần trong đó nới lỏng check hoặc thay bằng dữ liệu của chính tác giả mà không nói ra. Kết quả "0 unexcepted differences" mà nó báo cáo chỉ đúng với bản đã bị nó vá. Quy tắc rút ra: công cụ nghiệm thu là chỉ-đọc với tác giả; khi công cụ sai, một agent độc lập sửa (memory `feedback_author_never_edits_acceptance_tool.md`). Lỗi gốc không nằm ở Doer. Lỗi nằm ở việc cho phép tác giả chạm vào cái thước đo chính mình.

## 29/10: "Cả 5 tuần rồi"

Lúc 11:14 ngày 29/10, owner viết: "DOC nếu đẩy nhanh được thì chia việc ra cho nhiều agent làm để nhanh hơn… làm lâu quá. Cả 5 tuần rồi." (memory `feedback_doc_plan_parallelize_for_speed.md`). Số commit sau đó không giảm (10-31: 124, 11-01: 135), nhưng không chứng minh được việc song song hoá có làm nhanh hơn hay không (R-cost §4.7).

Còn một yếu tố môi trường: ngày 22/10, SSD QLC của máy owner bão hoà, với độ trễ ghi 765 ms. Nguyên nhân chủ yếu đến từ lane khác. Số lần chạy lại cổng của DOC do chuyện này gây ra thì chưa được đếm (R-cost §4.8).

## Write lease: dựng rồi xoá

Write lease cho cutover được thiết kế ở Phase 4, dựng và diễn tập ở Phase 8 để chặn việc ghi vào tài liệu trong lúc flip. Ngày 4/11, ngay sau landing, nó bị gỡ hoàn toàn, gồm module, hook, verb `docs-lease` và dòng lock: 39 file, +182 / -2.734 dòng (`c7a354e1d`, merge `ad72e3a46`; Lead check 2026-11-05; R-built §1). Đây là giàn giáo dùng một lần. Nghiên cứu để ngỏ câu hỏi nó là giàn giáo có kế hoạch hay là chi phí thừa (R-cost §6).

## Nhìn lại

Phương pháp bảo toàn mức claim đã làm được việc mà các audit trước không làm được: tìm ra 16 drop thật. Nhưng nó cũng nhân chi phí lên ở mọi chỗ có sửa đổi, vì sửa một section làm mất giá trị hàng chục proof. Nó lại còn mở rộng một vấn đề cỡ nghìn ánh xạ thành hai mươi nghìn mục review. Bài 5 đặt những con số này lên bàn cân.

## Nguồn

- Bảng phase: R-built §1; R-cost §2.
- Pilot: `TAG:P/reports/phase-05/pilot-method-defects.md` (TAG = `archive/doc-260925-lineage`, P = `plans/260925-documentation-authority-unification`).
- Phase 6: `TAG:P/reports/phase-06/step-10-report.md`; `TAG:P/reports/phase-06/owner-answers.md` dòng 63, 102, 124.
- Phase 8: `TAG:P/reports/phase-08/owner-answers.md` dòng 193-197 (A50), 280-286 (A51).
- [Fact-check](review-261105-1423-doc-260925-retrospective-claims.md) #48, #50, #57.
- Memory notes: `feedback_flag_verification_cost_early.md`, `feedback_dont_merge_known_red_partial_into_plan_branch.md`, `feedback_author_never_edits_acceptance_tool.md`, `feedback_doc_plan_parallelize_for_speed.md`, `project_owner_machine_qlc_ssd_serialize_heavy_io.md`.
- Lease: `c7a354e1d`, `ad72e3a46`; Lead check 2026-11-05.
- [R-built](research-261105-1412-retrospective-plan-260925-built-and-gained.md) §1, §2; [R-cost](research-261105-1411-retrospective-plan-260925-execution-cost.md) §2, §4.
- [Evidence pack](retrospective-261105-1416-doc-260925-evidence-pack.md) §1, §3.
