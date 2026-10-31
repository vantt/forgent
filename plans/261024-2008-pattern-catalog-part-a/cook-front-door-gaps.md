# Lớp cook chưa linh hoạt: năm điểm vấp khi chạy Part A

Ngày 2026-10-31, lane COOK. Đây là mục riêng theo RUL11 (thấy tùm lum ngoài phạm vi Part A thì ghi thành item). Chưa sửa gì ở đây; anh chọn cái nào đáng làm.

## Bối cảnh

Các tầng dưới (catalog pattern, cấu hình, runner, cửa ghi) đã vững sau Part A và sáu vòng sửa. Việc còn thiếu nằm ở tầng trên: nhận một plan hoặc một yêu cầu bất kỳ, rồi tự biết chia xuống các tầng dưới cho khớp (mở case nào, frame bao nhiêu lượt, pattern nào cho từng mảnh, checker nào). Trong đợt này mỗi bước đó em phải làm tay. Năm điểm dưới đây là những chỗ cụ thể.

## Năm điểm

**G1. Producer chết vẫn trừ một lượt ghi file.**
Bằng chứng: vòng 3, producer gemini của slice 2 không bao giờ được gõ vào pane (`nonzero-process-exit`, "nothing typed into the pane") nhưng vẫn tiêu lượt ghi file cuối. Retry bị từ chối `frame-exhausted` và em phải viết slice đó bằng tay. Vòng 4 và 5 chỉ qua được vì em chủ động chừa một lượt ghi dự phòng.
Hướng sửa: (a) runner hoàn lại lượt khi đơn vị chưa từng chạy một lượt producer nào (pane chưa được lái); (b) khi mở case từ plan, frame tự tính số mảnh cộng một lượt ghi dự phòng.

**G2. Case nối tiếp phải đạt lại từ đầu các mốc đã đạt.**
Bằng chứng: case mới của cùng plan phải làm lại `lock-decisions` (solo, `code:review`) rồi `plan-validated` (`validate-plan`, `--pattern reviewed`) trước `implement-item`. Gộp khóa và validate trong một lượt solo cũng không tính là `plan-validated` (vòng 5), nên mất thêm một lượt.
Hướng sửa: cho `workflow start` kế thừa các mốc đã đạt từ một case đã đóng của cùng plan và cùng commit gốc, ghi bằng chứng kế thừa vào case mới.

**G3. `review-item` bị từ chối nên review độc lập chỉ có sau khi land.**
Bằng chứng: `entry-milestone-unmet: child-verified`. HARDEN phải review sau khi code đã vào main (các vòng 3 đến 6).
Hướng sửa: để `review-item` đọc trạng thái đã verify của `implement-item`, hoặc đổi thứ tự mốc cho phép review trước khi land. Cần chọn một, vì hai cách đổi ý nghĩa của `child-verified` khác nhau.

**G4. Checker không chạy được cả bộ test, nên hồi quy chỉ lộ ở cổng cuối.**
Bằng chứng: sandbox của checker chỉ đọc. Vòng 3 có hai lỗi lọt qua checker và chỉ đỏ ở `npm test` đầy đủ: `config.mjs` đọc contract ở thời điểm import làm hỏng bản release không có git, và một test đọc sai trường của bản ghi pin.
Hướng sửa: preset có một bước cổng cuối do runner chạy trong worktree sau các mảnh và trước khi kết luận (chạy `npm test` đầy đủ, kết quả đưa vào bằng chứng của case).

**G5. Chưa có cửa vào biến plan hoặc yêu cầu thành khung chạy.**
Bằng chứng: mỗi vòng em tự đọc plan, tự chia mảnh, tự chọn frame (`dispatches`, `mutatingDispatches`, `seatLaunchesPerDispatch`, `rigorFloor`), tự chọn pattern và độ khắt khe cho từng mảnh, rồi tự viết brief. Đó là phán đoán lặp đi lặp lại và có thể làm bằng bảng quy tắc dựa trên catalog.
Hướng sửa: một cửa vào nhận file plan hoặc câu yêu cầu và đề xuất khung (số mảnh, frame gồm lượt dự phòng, pattern và rigor theo rủi ro của từng mảnh, đường chạy), để người duyệt rồi mới chạy. G1 và G2 là tiền đề của cửa này.

## Đề nghị thứ tự

1. G1 và G2 trước: nhỏ, nằm ở runner và workflow, và G5 dựa vào chúng.
2. G3 và G4 sau: cần anh chọn nghĩa của `child-verified` (G3) và chấp nhận một bước cổng cuối chạy lâu (G4).
3. G5 cuối, qua brainstorm riêng: đây là thiết kế mới, không phải sửa lỗi.

Điều kiện đảo thứ tự: nếu anh muốn thấy G5 sớm để thử trên việc thật, làm G5 trước với frame cố định cộng một lượt dự phòng, và để G1 và G2 sau.

## Điều chưa biết

- Em chỉ có bằng chứng từ các lần chạy của chính em trong đợt này. Chưa biết các lane khác gặp G1 đến G4 ở mức nào.
- G4: chưa đo thời gian của một bước cổng cuối đầy đủ trong runner.
