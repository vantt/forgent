# Codebook phân loại (một nguồn định nghĩa cho cả cuộc điều tra)

Mỗi vấn đề/ca được gắn đúng một giá trị trên mỗi trục 1-3, cộng các cờ. Chọn giá trị chính; ghi giá trị phụ nếu thật sự có.

## Trục 1. Nguyên nhân (vì sao agent làm sai)

| Mã | Tên | Định nghĩa | Dấu hiệu |
|---|---|---|---|
| A | Thiếu rule | Không có chỉ dẫn nào, ở lớp nào agent có thể thấy, tại thời điểm xảy ra | Tìm không ra rule liên quan trong các lớp nạp lúc đó |
| B | Rule bị chôn | Có chỉ dẫn đúng nhưng nằm chỗ agent không nạp/không thấy (lớp không nạp, doc sâu, runtime khác) | Rule có ở một nơi, agent không đọc nơi đó |
| C | Mâu thuẫn | Hai chỉ dẫn hoặc hai nguồn nói ngược nhau về cùng tình huống | Có hai nguồn, câu trả lời khác nhau |
| D | Chỉ văn xuôi | Rule rõ, được nạp, nhưng không có cơ chế nào ép hay phát hiện vi phạm; lỗi tái phát | Rule có sẵn, không hook/test nào bắt |
| E | Bị bỏ qua | Rule rõ, được nạp, agent thấy được mà vẫn làm trái (kể cả cơ chế yếu) | Có bằng chứng agent đã đọc/nhận rule |
| F | Nhiễu ngữ cảnh | Thông tin đúng có mặt nhưng chìm trong lượng lớn context hoặc session quá dài | Agent tự nhận quên, thông tin có trong context |
| G1 | Model | Lỗi năng lực/suy luận của model, không phải thiếu thông tin | Với thông tin đầy đủ vẫn sai |
| G2 | Công cụ | Công cụ ngoài làm sai hoặc im lặng (git, executor, rtk, Claude Code) | Công cụ có hành vi bất ngờ, exit 0 |
| G3 | Hạ tầng/vận hành | Môi trường, phiên song song, checkout chung, tài nguyên (đĩa, port, pane) | Không agent nào tránh được nếu không đổi môi trường |
| H | Lỗi sản phẩm fgOS | Code/engine/skill của fgOS sai hoặc không khớp tài liệu | Sửa code hoặc skill thì hết |

Ghi chú: H là mới (bản trước gộp vào A hoặc G). Chọn H khi gốc là code fgOS.

## Trục 2. Triệu chứng

| Mã | Tên |
|---|---|
| P | Sai path/tên/cửa vào |
| U | Làm thiếu |
| O | Làm thừa |
| R | Tự chế lại thứ đã có |
| I | Tự phát sinh việc không được giao |
| X | Khác |

## Trục 3. Lớp can thiệp (sửa ở đâu thì hết, hoặc giảm nhiều nhất)

| Mã | Tên | Ví dụ |
|---|---|---|
| IN | Instruction | viết/bỏ/sửa một luật hoặc doc |
| CC | Cơ chế | hook, test, doctor, lint, pre-commit chặn |
| SP | Sản phẩm | sửa code/skill/engine fgOS, hoặc sinh bản render từ một nguồn |
| CU | Công cụ | sửa/thay công cụ ngoài, hoặc cấu hình nó |
| VH | Vận hành | quy ước ai ghi ở đâu, khi nào, cách chạy phiên song song |
| SH | Sở hữu | chỉ định một chủ duy nhất cho một quy ước/artifact, có quyền đổi và trách nhiệm kiểm |
| BR | Brief | cách giao việc cho agent (path, tiêu chí xong, file được sửa) |
| DL | Đo lường | bộ đánh giá hành vi để biết thay đổi có tác dụng hay không |
| MD | Model | không sửa được ở harness |

## Cờ phụ (mỗi ca)

- `owner_missing`: yes/no/unknown. Quy ước hoặc artifact liên quan có đúng một chủ rõ ràng (người/thành phần có quyền đổi và kiểm) hay không?
- `brief_role`: none/contributed/decisive/unknown. Nếu ca là một việc được giao, brief có góp phần gây ra lỗi (thiếu path, thiếu tiêu chí, ra lệnh một quy ước riêng) hay không?
- `confidence`: high/med/low.

## Quy tắc chấm

- Bằng chứng cụ thể (file:dòng, commit, trích dẫn); không đoán. Không rõ thì `unknown` và confidence low.
- Chọn nguyên nhân gần nhất theo thời điểm xảy ra, không theo trạng thái hôm nay (rule thêm sau sự cố không làm ca đó thành E).
- Không dùng nhãn cũ của ca nếu từng thấy.
