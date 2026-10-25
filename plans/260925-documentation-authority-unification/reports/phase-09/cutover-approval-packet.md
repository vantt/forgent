# Gói xin duyệt cutover tài liệu (Phase 9)

Trạng thái: gói của Lead theo L13-6, gửi owner ngày 2026-10-26 lúc mọi gate cục bộ đạt met-local. Gói này không tự cho phép làm gì. Mỗi việc trong phần "Phạm vi của câu trả lời" chỉ được làm khi owner đồng ý đúng việc đó.

Nguồn: [preflip-gate-status.json](preflip-gate-status.json) (register), [owner-answers.md](owner-answers.md) (L13-16 đến L13-29), các review trong [reviews/](reviews/).

## Chuyện gì đang xảy ra

Toàn bộ việc chuẩn bị cục bộ trước cutover đã xong trên nhánh plan.
- G0, G1, G2, G3, G5, G6, G7, G8 và G9 đạt met-local.
- G4, G10 và G11 là external: chúng chờ lần import main cuối, release và bản tập dượt trên clone đã thu gọn.

Từ đây, muốn đi tiếp phải có quyết định của owner. Các việc còn lại đều đụng tới main hoặc tới tài sản dùng chung: lấy lease tài liệu, import main lần cuối (pin F), áp chuỗi composition, publish archive ref, rồi Land.

## Nguyên nhân

Bằng chứng ở mức met-local, tất cả chạy tại nhánh plan:

| Gate / mục | Bằng chứng |
|---|---|
| G0 | `g0join/join.py --pin HEAD` exit 0. Có 1.929/1.929 dòng hiệu lực đã được review độc lập APPROVE (w24 đến w30). |
| F composition | `fchain/check.py --pin HEAD` exit 0: một cửa duy nhất, 595 file composed, 229 proposal. Theo L13-28, `linkGuard` soát mọi link và anchor của 628 file `docs/platform/**` sau F (2.705 đích, kể cả Related header): 0 lỗi. 377 dòng sửa link trong 88 patch. 25 control fail đúng khi bị cố tình làm hỏng. Review w33, w35, w37 (REWORK cuối là id trùng, Lead sửa ở edf816838). |
| G6 | 787 premise judgment đã chốt và review xong (w23, w28). 137 dòng chưa bind vào passage hiện tại sẽ được làm ở F. |
| G9 | 158 quyết định Phase 9 đã chốt (w25). |
| G5 | `g5/check.py` đạt. Chỉ còn chờ owner chấp nhận 8 câu viết lại (xem bên dưới). |
| Ownership audit | `phase-08/audit-report.py` tại 23e3c34b7: 0 cặp chưa ghi sổ, B ok, 0 dòng drift chưa giải thích (L13-27). Test reproduction pass 8/8. Review w33 (5 APPROVE). Bỏ 58 ngoại lệ thừa cho path vốn đã được phép. Các commit record sau đó được ghi sổ ở lần kế tiếp (L13-29.3). |
| Register | Sinh lại ở e7e6c129c bằng `reconcile.py`; review w38: 11 APPROVE, 0 REWORK, 5 ghi chú nhỏ về trích dẫn. Các ghi chú đó được sửa trong một lần làm mới register trước khi lấy lease (L13-29.2). Mỗi sửa đổi cục bộ đều có review độc lập, ghi trong `localCorrectionReview`. |

### Owner cần trả lời trong gói này

1. **G5: chấp nhận 8 câu viết lại của `docs/specs/reading-map.md`.**
   - Dòng 3 đến 9 là banner chuyển tiếp. Banner này được thay bằng đoạn chuyển tiếp ở `docs/reading-map.md`, dòng 89 đến 108.
   - Dòng 34 là đính chính nguồn sự thật của workflow. Nó chuyển sang `docs/reading-map.md`, dòng 156.
   - Văn bản cũ và mới, đúng từng byte, nằm ở `g5/check-b57e79625.json`, mục `/ownerAcceptance`.
2. **G8: cho phép publish archive ref.** Archive ref được tạo lúc F, từ bản rebuild tại F (L13-18).
3. **G9: hai claim trong backlog, STR70a và STR62.** Hai claim này vẫn trích bố cục cũ của `work-state.md` (`:647-675` và `:864`). Chủ backlog chọn nội dung thay thế.
   - Em đề xuất trỏ hai claim sang mục hiện hành trong `docs/platform/work-state/spec.md`: Add Verb và Domain Model.
   - Owner chỉ cần xác nhận hoặc sửa đề xuất này.

## Các lựa chọn

**A. Duyệt cutover trong khung đã nêu, rồi duyệt Land riêng.**
- **Lấy lease tài liệu, bắt đầu đóng băng.** Import main đúng một lần, có ghi sổ, và ghi lại pin F.
- **Chạy 31 F duty theo register.** Các việc chính:
  - replay chuỗi `fchain`;
  - bind 137 dòng G6;
  - rebind 407 binding sau khi áp chuỗi;
  - review delta cho từng gate;
  - publish archive ref;
  - chạy full suite trên clone cô lập;
  - guard 3 (link trong `docs/platform`) đi cùng cutover phải cho cùng kết quả với `linkGuard` (L13-28.4).
- **Viết ledger trạng thái cuối và review độc lập nó.**
- **Dừng và hỏi lại** khi bất kỳ F duty nào fail, hoặc khi số đếm sau import vượt khung.
- **Lợi:** đi thẳng tới đích của plan.
- **Hại:** trong lúc lease còn hiệu lực, docs bị đóng băng với mọi lane khác.
- **Chi phí:** chạy trên nhánh plan và clone. Phần lớn công sức là review delta.

**B. Tập dượt F trên clone trước, chưa lấy lease.**
- Chạy cùng chuỗi việc trên một clone, tại main hiện tại. Đo kích thước delta thật, rồi mới xin lease.
- **Lợi:** biết chính xác khung F trước khi đóng băng docs.
- **Hại:** kết quả tập dượt hết hạn ngay khi main đổi. Phải làm lại toàn bộ lúc F thật, tức tốn thêm một vòng.

**C. Tạm giữ.** Không làm gì thêm. Các bằng chứng met-local sẽ dần cũ đi theo main, và phải làm lại một phần.

## Khuyến nghị

Chọn **A**. Toàn bộ phần có thể kiểm chứng cục bộ đã có bằng chứng và review độc lập.

Khung F đã được đo bằng số đếm có nguồn, ở mục `cutoverReadiness.fWindowSize`. Các điều kiện dừng đã ghi rõ, nên rủi ro của F nằm ở phần delta sau lần import cuối. Phần delta đó, tập dượt (B) cũng không loại bỏ được.

## Phạm vi của câu trả lời

**"Đồng ý A" cho phép:**
- lấy lease tài liệu;
- import main một lần làm F;
- chạy các F duty trên nhánh plan và clone;
- publish archive ref;
- viết và review ledger cuối.

Ba câu trả lời ở mục "Owner cần trả lời" (G5, G8, G9) được trả lời riêng, từng mục một.

**"Đồng ý A" không cho phép:**
- **Land lên main**: cần một lần duyệt riêng, sau khi ledger cuối đã được review;
- **xoá bất kỳ file nào trên main**;
- **push `.fgos/events*`**;
- **nới khung khi F vượt số đếm**: lúc đó Lead dừng lại và hỏi lại theo mẫu này.

Việc ngoài phạm vi plan nằm ở `followUps` trong register. Chúng thành item riêng và không chặn cutover:
- hai chỗ mâu thuẫn trong `work-state/spec.md`;
- tên heading cũ;
- 36 rationale bắt đầu bằng khoảng trắng.
