# Cửa vào của cook: nhận một plan hoặc một yêu cầu, đề xuất khung và cách chia

Ngày 2026-11-01, lane COOK. Thiết kế, chưa có code. Nguồn: mục `plans/261024-2008-pattern-catalog-part-a/cook-front-door-gaps.md` (G5). G1 đến G4 đã land và là nền của thiết kế này.

## Kết quả cần có

Anh đưa cho cook một plan (`ak:plan`) hoặc một câu yêu cầu bất kỳ. Cook trả về một bản đề xuất duy nhất để anh duyệt một lần: khung chạy (số lượt, lượt dự phòng, mức rigor tối thiểu), danh sách mảnh, và với mỗi mảnh: capability, pattern, rigor, phạm vi ghi, lệnh verify. Sau khi anh duyệt, cook chạy trong khung đó. Không còn cảnh mỗi vòng em tự đọc plan, tự đếm lượt, tự chọn pattern bằng trí nhớ.

## Ràng buộc

- Plan không có quyền quyết (RUL-WF-22): thứ tự phase, danh sách file, `dependencies: []` chỉ là gợi ý. Chia mảnh là phán đoán với code trước mắt, không phải bộ phân tích cú pháp.
- Chỉ qua hai cửa (`fgos run`, `fgos workflow`). Không tự chọn provider, model, tier; `bind()` quyết. Rigor chỉ quyết số checker và độ độc lập (Seat Binding, mục 5.2).
- Các mảnh ghi chạy lần lượt trong một worktree của case.
- Khung chỉ được thu hẹp sau khi duyệt, nên cửa vào phải tính khung đủ rộng ngay từ đầu.
- Hỏi người đúng một lần, theo mẫu câu hỏi quyết định.

## Ngoài phạm vi

- Không tự chạy sau khi đề xuất (xem "Quyết định đã chốt").
- Không chạy các mảnh ghi song song.
- Không sửa guide `coding/feature`, không thêm mốc mới.
- Không để agent hay mã quyết provider, model, tier.

## Tiêu chí chấp nhận

1. **Chạy lại quá khứ.** Với các vòng thật của đợt Part A, hàm đề xuất nhận đúng các mảnh của vòng đó và phải đưa ra khung không nhỏ hơn mức đã dùng thật (case 1: 22 lượt, 22 lượt ghi; case nối tiếp 24/14; vòng sửa 1 đến 5: 8/4, 6/2, 6/2, 9/4, 7/3), và không rộng quá 1,5 lần. Đây là phép thử đo được, lấy từ bằng chứng của chính repo.
2. Mỗi quy tắc của bảng loại mảnh có một test riêng ở tầng thấp nhất, có đối chứng (mảnh chạm hợp đồng bị khóa không bao giờ ra rigor thấp).
3. Đề xuất bị từ chối, không phải sửa ngầm, khi: đường ghi không tồn tại, hai mảnh ghi chồng nhau, capability không có trong catalog, rigor dưới mức tối thiểu của khung.
4. Từ đề xuất đã duyệt, các lệnh `workflow start` và `fgos run` sinh ra chạy được nguyên văn (một test đầu cuối trên guide thật).

## Bằng chứng hiện có (đã đọc)

- `core/skills/fgos-cook/SKILL.md` và `references/reading-ak-plans.md`: bảng cỡ khung và quy tắc đọc plan đã có, viết bằng lời cho agent; không có mã nào kiểm hay tính.
- `references/route-table-pending.md`: bảng "loại mảnh sang capability, rigor, pattern" chưa viết vì chờ Seat Binding. Seat Binding đã land: rigor tách khỏi tier, số checker lấy từ `patterns.reviewed.checkersByRigor`. Điều kiện chờ đã hết.
- `fgos plan-lint` chỉ kiểm chú thích capability của plan, không cho ra mảnh.
- `src/workflow/case-projection.mjs`: `RIGOR_ORDER`, sổ khung và `frameRemaining` đã có; G1 hoàn lại lượt cho run chưa nhận brief; G2 cho `--inherit`; G3 cho review sớm; G4 cho `workflow gate`.
- Kiểm tiền lệ: `git log -S` trên `proposeFrame` và `sizeFrame` không tìm thấy gì, tức chưa từng có cơ chế này và chưa có gì bị gỡ.

## Ba cách làm

**A. Chỉ viết lời (doctrine).** Điền bảng loại mảnh vào `fgos-cook` và để agent đọc.
Giả định nặng nhất: agent đọc và áp dụng bảng nhất quán mỗi lần. Hỏng trước tiên khi: hai phiên cho hai khung khác nhau cho cùng plan, hoặc quên cộng lượt dự phòng như ở vòng 3. Rẻ nhất, nhưng không có gì để kiểm.

**B. Phán đoán tách khỏi phép tính (khuyến nghị).** Agent chia mảnh và ghi thành một bản kê mảnh có cấu trúc; mã làm phần còn lại một cách xác định: phân loại từng mảnh theo đường ghi, tra bảng dữ liệu, tính khung, kiểm tra với thực tế, rồi dựng câu hỏi quyết định và các lệnh. Lệnh mới `fgos workflow propose`, bảng dữ liệu nằm cạnh guide trong `domains/coding/`.
Giả định nặng nhất: phân loại theo đường ghi đủ để suy ra rigor. Hỏng trước tiên khi: một mảnh nhỏ nhưng nguy hiểm mà đường ghi không lộ ra (ví dụ đổi hành vi qua một file thường). Lối thoát có sẵn: agent được nâng rigor cho từng mảnh kèm lý do, không bao giờ hạ dưới bảng.

**C. Một ghế lập kế hoạch tự đọc plan và ra khung.** Giả định nặng nhất: một seat đọc plan đáng tin để quyết số lượt. Hỏng trước tiên khi: seat đoán sai cỡ và khung bị vượt giữa chừng; còn đúng điều RUL-WF-22 cấm khi plan được coi như thẩm quyền. Đắt nhất, khó đảo nhất.

Cách rẻ nhất để bỏ đi nếu sai: B, vì bản kê mảnh là dữ liệu mở, bỏ lệnh thì A vẫn còn.

## Thiết kế của cách B

**Đầu vào.** Hoặc một bản kê mảnh, hoặc (với yêu cầu tự do) một lượt phân loại trước. Một mảnh gồm: tên, mô tả ngắn, đường ghi dự kiến, lệnh verify hẹp, phụ thuộc thật giữa các mảnh. Chia mảnh vẫn là phán đoán của agent đọc plan và code; mã không tự chia.

**Phân loại yêu cầu tự do (không có plan).** Bảng nhỏ theo bằng chứng của yêu cầu: một việc ghi nhỏ, rõ phạm vi thì `fgos run` một lượt (`solo`, không cần case); vài mảnh thì mở case với khung nhỏ; việc lớn hoặc mơ hồ thì dừng và đề xuất chạy `shape-plan` trước. Ngưỡng nằm trong bảng dữ liệu, không trong lời.

**Bảng loại mảnh** (dữ liệu, mỗi dòng: mẫu đường ghi, loại, capability, pattern, rigor). Quy tắc: nhiều mẫu khớp thì loại có rigor cao nhất thắng. Dòng đầu tiên viết ngay từ thực tế của repo:

| Mảnh chạm | Loại | Capability | Pattern | Rigor |
|---|---|---|---|---|
| chỉ `docs/`, `plans/` | tài liệu | `docs:write` | `solo` + review sau | `low` |
| chỉ `test/` | test | `code:test` | `reviewed` | `standard` |
| mã thường trong `src/`, `bin/` | mã thường | `code:implement` | `reviewed` | `standard` |
| hợp đồng, schema, `packages/*/contracts`, luật khóa | hợp đồng | `code:implement` | `reviewed` | `high` |
| Rust crate, khóa, danh tính, cửa ghi | nền tảng | `code:implement` | `reviewed` | `high` |
| dữ liệu, di trú, không đảo được | không đảo được | hỏi owner trước | không dispatch | `critical` |

Bảng này cần anh xem lại: đây là điểm chính sách duy nhất của thiết kế (ngưỡng nào thành `high`). Em chọn mặc định thận trọng và ghi điều kiện đảo.

**Phép tính khung** (hàm thuần, kiểm bằng test):
- `mutatingDispatches` = số mảnh ghi + 1 lượt sửa cho mỗi mảnh ghi + 1 lượt dự phòng (bài học vòng 3, chỉ có hiệu lực thật nhờ G1 hoàn lượt cho run chưa nhận brief).
- `dispatches` = ghi + sửa + dự phòng + lượt đọc: một `validate-plan` và một khóa quyết định (bỏ khi kế thừa được theo G2), một lượt chẩn đoán, các review sớm (G3), bước cổng cuối (G4), và một lượt dự phòng chỉ-đọc.
- `seatLaunchesPerDispatch` = max theo mảnh của (ghế mỗi vòng × số vòng × `fallbackPerSeat`), đọc từ catalog pattern, không đoán.
- `rigorFloor` = rigor thấp nhất trong các mảnh, tối thiểu `standard` cho plan mã, đúng gợi ý hiện tại của skill.
- Khi tìm thấy một case đã đóng cùng plan và cùng commit gốc: đề xuất `--inherit` và bỏ các lượt tương ứng.

**Kiểm tra với thực tế** (từ chối có mã lỗi, không sửa ngầm): đường ghi tồn tại hoặc là file mới hợp lệ; hai mảnh không ghi chồng nhau; mở rộng đường ghi sang các test chạm tới ký hiệu đổi (đúng việc `reading-ak-plans.md` mục 4 bắt làm tay, làm bằng `rg` có thể kiểm); capability có trong catalog; rigor không dưới sàn của khung.

**Đầu ra.** (1) Một bản đề xuất có cấu trúc (JSON, để máy dùng tiếp). (2) Câu hỏi quyết định đúng mẫu năm phần, bằng tiếng Việt, để anh duyệt một lần: việc đang xảy ra, nguyên nhân, lựa chọn kèm chi phí, khuyến nghị, phạm vi của câu trả lời. (3) Sau khi duyệt: chuỗi lệnh `workflow start --frame ... --worktree ...`, từng `fgos run --case ... --activity ... --pattern ... --writes ... --verify ...`, và `workflow gate` cuối.

**Vị trí trong lớp.** Logic ở `src/workflow/` (cạnh `case-start`, `case-gate`), bảng dữ liệu ở `domains/coding/` cạnh guide, lệnh đăng ký trong `command-registry`. Skill `fgos-cook` đổi từ "tự tính khung theo lời" sang "gọi `propose`, đọc kết quả, hỏi anh". Cấm lặp lại tính toán ở hai nơi (nguyên tắc một cửa): bảng cỡ khung bằng lời trong `reading-ak-plans.md` bị thay bằng liên kết tới hàm.

## Quyết định đã chốt (trong khung đã duyệt)

1. **Chọn cách B**, không A, không C. Điều kiện đảo: nếu chạy lại quá khứ cho kết quả khung lệch hơn 1,5 lần ở nhiều vòng, bảng loại mảnh sai và phải sửa dữ liệu; nếu bản kê mảnh luôn phải viết tay quá nặng, cân nhắc một ghế phân mảnh sau lớp kiểm tra (C có kiểm tra), nhưng không trước khi B chứng minh được độ chính xác.
2. **Đề xuất rồi dừng, chưa tự chạy.** Điều kiện đảo: khi các đề xuất đã duyệt liên tiếp ít nhất năm lần không phải sửa số nào, thêm chế độ chạy tự động trong khung đã duyệt (bước sau, thiết kế riêng).
3. **Bảng loại mảnh là dữ liệu có phiên bản**, không là mã. Điều kiện đảo: nếu ngưỡng `high` bị anh chỉnh nhiều lần, chuyển phần đó sang cấu hình `fgos config`.

## Điều còn mở

- Ngưỡng rigor trong bảng loại mảnh (dòng hợp đồng, nền tảng) là chính sách, cần anh xem. Em đặt `high` cho cả hai vì Part A đã cho thấy hai loại này là nơi lỗi lọt qua checker.
- Chưa đo: có thể phân loại "mảnh nhỏ nhưng nguy hiểm" chỉ từ đường ghi tới mức nào. Phép chạy lại quá khứ sẽ cho số đầu tiên.
- Đường dẫn tài liệu: `docs/` chưa có mô tả cho `workflow gate`, `--inherit` và lệnh mới này; chờ DOC.

## Bước tiếp theo nếu anh đồng ý

Viết kế hoạch thi công theo thứ tự: (1) hàm tính khung và test chạy lại quá khứ, (2) bảng loại mảnh và bộ phân loại, (3) kiểm tra với thực tế, (4) lệnh `propose` và đầu ra, (5) sửa skill `fgos-cook`. Mỗi bước một lượt qua cook, có checker độc lập.
