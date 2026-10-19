# Cover note: bản nháp spec BA cho mô hình agent ↔ workflow (lane AGENT-WF)

Viết 2026-10-19 (Asia/Saigon). Bản nháp nằm trên nhánh riêng, chưa merge vào main, chưa có hiệu lực.

## Những gì có trên nhánh

| Commit | Nội dung |
|---|---|
| `docs(spec): draft workflow area spec …` | [docs/specs/workflow.md](../../docs/specs/workflow.md) (589 dòng): spec khu vực mới, tiếng Việt, luật mang id tạm `RUL-WF-1…26` |
| `docs(boundary): record proposed workflow authority rows …` | [component-boundary.md](../../docs/platform/component-boundary.md): các hàng Workflow, Work Lifecycle, Execution Core, Holder-lock (`advance`) mang đoạn "Proposed … pending owner approval", cạnh chữ hiện hành (không xoá chữ cũ); một dòng pointer ở [reading-map.md](../../docs/specs/reading-map.md); một đoạn pointer ở [runner.md](../../docs/specs/runner.md) (không viết lại runner.md, không sửa 0048/0049 tại chỗ) |

Kiểm: `scripts/check-decision-citation-drift.mjs` không còn finding; `test/docs/*`, dead-vocabulary guard và test citation-drift: 72/72 pass. Không đụng code, config, skill hay YAML.

## Spec khoá gì

- Phép tách authority **chọn / cho phép / thi hành / chấp nhận**: agent chọn thứ tự; Workflow case admit và ghi; Execution Core thi hành và giữ điểm chặn; người đánh giá có tên chấp nhận.
- Từ vựng: Workflow guide, Workflow case, Admission, Playbook driver, Case verbs, Execution Core, Work driver loop; chữ "runner" không dành cho phần nào; "sequencer" thu hồi.
- Từ vựng quyết định MUST / SHOULD (kèm lý do) / MAY instead / unlisted (cần biện minh) / `listedRoutesOnly`; luật "danh sách đánh số"; "không guard thì không MUST" với mục unenforced; catalog MUST đóng (sáu primitive khởi đầu, không khoá con số).
- N1 (owner đã chấp nhận): dispatch ghi file trong constrained case bị từ chối nếu không mang authority của case; mỏ neo là ràng buộc worktree/nhánh trên ledger, không phải biến môi trường.
- Đơn vị đếm của khung (Unit admission, seat launch); `frame-exhausted` không dùng lại chữ `blocked`; milestone gắn subject; consent gắn digest; findings không làm hỏng case.
- Ranh giới component diễn đạt bằng lời theo thứ hạng manifest; `advance` chỉ là mutex admission.
- Đích supersede một phần: 0048 §2 và 0049 §4, **proposed — decision ID gán khi owner duyệt**.
- Ba ví dụ trước → sau (council-lite, feature.yaml, content-publish ngắn) với banner "tên trường chỉ minh hoạ"; acceptance battery 15 kịch bản.

## Spec để mở

Bố cục YAML, tên file, flag CLI, nơi đặt module, ngôn ngữ cài admission, định dạng Event Store, phase cài đặt; cách cutover coding (R2, chưa đo được); cơ chế lease của N17 (làn holder-lock); re-rank `advance` cho N15 (làn holder-lock + Event Store); primitive quan sát hiệu ứng ngoài (F8, hoãn).

## Những khẳng định được review ít nhất

Chưa qua panelist nào, chỉ qua một reviewer và một red-team của reopen:

- **Q2 / N13, đặt tên**: dựa trên bằng chứng repo (ba nghĩa của "runner"). Rủi ro thấp vì spec không khoá tên file.
- **Q4 / N14, Rust**: "admission giữ Node ở infra, nền Rust bên dưới" là cách đọc Design Principle 4, không phải quyết định build. Điều kiện đảo đã ghi.
- **Q3 / R1, cách mang ngữ cảnh authority**: mỏ neo ledger đứng vững về logic, nhưng ba chỗ chưa được chứng minh: ràng buộc worktree phải rộng bằng `writes` của khung; executor không truyền env cần cấu hình tiêm; tra attempt id tới bản ghi unit chưa có reader.
- **N17, tách vai `advance`**: bắt buộc nếu muốn reserve-then-release; chọn cơ chế thuộc làn holder-lock.
- N15 (stream Event Store) phụ thuộc xung đột rank 80/70; là dòng chéo làn, không phải việc của spec này.

## Tôi đã tự quyết (không hỏi lại)

- Đặt mô hình ở **file spec mới** `docs/specs/workflow.md` thay vì nhồi thêm vào runner.md (đã hơn 3400 dòng); runner.md chỉ nhận một pointer.
- Hàng component-boundary viết tiếng Anh như phần còn lại của file; chữ hiện hành **giữ nguyên**, đoạn đề xuất đặt cạnh, để nhánh không làm sai lệch luật đang chạy.
- Không sửa `docs/specs/system-overview.md` (area map) trong nhánh này; thêm dòng `workflow` khi spec land.
- Các bất đồng giữ nguyên nội dung, nhưng đổi nhãn (`P2-no-admission`, `P2-pilot-first`, `P2-coding-cutover`, `P3-catalog-count`) vì check citation-drift cấm dẫn id D-local ngoài CONTEXT.md; các mã RUL được kèm lời giải nghĩa theo cùng check.
- Không thêm dòng CHANGELOG: chưa có gì người dùng thấy được tới khi cài đặt.

## Câu hỏi chỉ owner trả lời được

1. **Duyệt spec, gồm supersede một phần 0048 §2 và 0049 §4?** Nếu duyệt, một decision ID mới được ghi và các id `RUL-WF-n` được gán chính thức lúc land.
2. **Danh sách ý tưởng RUL104 (mục 14), duyệt một lần.** Khuyến nghị: duyệt **F1–F7 và F9** làm lõi của mô hình (không có chúng thì spec không có gì để cài); để **F10, F11** cho làn holder-lock/Event Store tự quyết qua dòng của họ; **F12** làm trợ giúp phân giải cùng F3; **F8** hoãn; **F13** (đổi tên code) chỉ sau khi phần lõi đã land.

Việc pilot-trước-engine (bất đồng `P2-pilot-first`) là câu hỏi về trình tự; owner gặp nó lúc duyệt plan, không phải bây giờ.
