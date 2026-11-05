# Bài 2: Tài liệu đã trôi dạt thế nào (tháng 8 đến 25/9)

*Chuỗi hồi cứu plan 260925, bài 2/6. Bài trước: [Ngày đầu tiên và lời hứa "compound"](retrospective-261105-1416-doc-260925-post-1-genesis-and-compound.md). Bài sau: [Cú hích](retrospective-261105-1416-doc-260925-post-3-the-trigger.md).*

Trong tám tuần, `docs/` tăng từ 365 lên 4.301 file, còn số spec được bảo trì chỉ nhích từ 11 lên 13. Rồi ngày 18/9, một commit tên "fix(dispatch)" chép 943 file sang cây mới mà không xoá bản nào. Lúc chép, chỉ 6 trong 935 file chung đường dẫn là khác nhau; một ngày sau đã là 67.

Bài 1 kết thúc ở chỗ fgOS có cơ chế sinh tài liệu tự động nhưng không có luật thẩm quyền. Bài này đo hậu quả, từ 1/8 tới 25/9.

## Số file tăng 12 lần, specs gần như đứng yên

| Ngày | File trong `docs/` | `docs/specs` | `docs/platform` |
|---|---|---|---|
| 1/8 | 365 | 11 | 0 |
| 15/8 | 1.500 | 12 | 0 |
| 29/8 | 2.116 | 12 | 0 |
| 12/9 | 3.239 | 13 | 0 |
| 25/9 | 4.301 | 13 | 1.005 |

*Cách đo ở phần Nguồn.*

Phần tăng thêm gần như toàn là evidence và lịch sử, không phải spec được bảo trì. Riêng thư mục lịch sử tăng từ 535 lên 1.115 file trong một tuần (8/8 đến 15/8). Vấn đề không nằm ở số lượng, mà ở chỗ mọi thứ nằm chung một cây và không có dấu nào nói file nào là bản đúng.

Một báo cáo ngày 25/8 đã đo được nguyên nhân cơ học. Hệ có 268 tài liệu end-user và tăng khoảng 50 tài liệu mỗi 7 ngày. Lựa chọn "viết mới hay viết thêm vào tài liệu cũ" chỉ được quyết bằng việc kiểm một đường dẫn đặt tên tự do có tồn tại hay không, nên gần như lần nào cũng thành viết mới. Nghiên cứu hồi cứu quy phần tăng này cho evidence theo từng việc cộng với tài liệu do skill tự sinh. Theo cách đọc của người viết, đó là cơ chế ở bài 1 chạy đúng như thiết kế.

## Dời ADR và link chết: 17/8

Ngày 17/8, 34 ADR được dời vào mục "Lịch sử quyết định" của từng spec, chỉ để lại một file index sinh tự động. Guard bắt trích dẫn quyết định lệch đã có từ 27/7, nhưng lần dời vẫn để lại tham chiếu chết: 59 phút sau, một commit khác phải cập nhật mốc của guard và sửa một bước quét đã chết. Từ đây, thẩm quyền cho một quyết định bị chia ra ba nơi: lời kể trong spec, bản ghi event, và index sinh tự động.

## Hai danh sách tài liệu trong một tuần: 25 đến 27/8

Một danh sách tài liệu (registry) được tạo và bật bắt buộc. 332 tài liệu được dời vào `docs/knowledge/`, mỗi tài liệu một commit, nhưng các thư mục cũ không bị xoá. Tới 25/9, chúng vẫn nằm cạnh nhau, và một review độc lập phát hiện mọi tài liệu đều "tạm thời" và số chủ đề bằng đúng số tài liệu (332 = 332): registry chưa gộp được tài liệu nào.

## Một cây song song: `docs/architect/`

Thư mục thiết kế của khu Agent Coordination có 14 file vào 29/8, 473 file vào 5/9, và 905 file vào 12/9. Phần lớn là request thô, kết quả và proof, không phải thiết kế. Ngày 25/9, bản đồ thẩm quyền đếm được 566 file payload không phải Markdown trong cây này, và ghi rằng chưa ai lập bản đồ những thứ đọc các payload đó.

Hai tuần sau khi plan bắt đầu, ngày 10/10, Lead đưa owner bảng tiến độ: khu Agent Coordination có 17.034 dòng trong 867 file, trong khi hai khu kế tiếp chỉ có 431 và 402 dòng. Owner trả lời: "nhìn bảng tổng kết mới thấy cơ chế viết tài liệu của chúng ta có vấn đề. 1 component nhưng 867 files, vấn đề quá rõ."

## Sai lầm 18/9: chép 943 file thay vì dời

`docs/platform/` bắt đầu ngày 14/9. Ngày 15/9, một commit tên "chore: preserve main worktree before packaging merge" thêm cùng lúc quy định quản lý tài liệu, bản đồ đọc mới và cổng vào `docs/platform/`. Quy định ghi "Accepted" nhưng "Implementation: Partial".

Ngày 18/9, một commit có tiêu đề bắt đầu bằng `fix(dispatch): widen TRUST_STORE_KINDS ...` và kết thúc bằng `docs(agent-coordination): migrate to docs/platform/ target structure` **thêm** 943 file vào cây mới: 943 file thêm, 4 file sửa, không đổi tên, không xoá bản gốc. Một việc di trú lớn nằm lẫn trong commit sửa dispatch, và chữ "migrate" thực chất là chép.

Lúc chép, 935 đường dẫn tương đối có ở cả hai cây và chỉ 6 file khác nhau. Một ngày sau, con số là 67. Hai cây bắt đầu tách nhau ngay khi vừa được chép. Ai quyết định chép thay vì dời, và với ý định gì, chưa rõ.

## Những bên đọc luôn được nạp không bao giờ chuyển theo

Ngày 25/9, luật nền có ba bản (16.398, 33.845 và 3.341 byte), và có hai bản đồ đọc: bản mới ("Accepted") và bản chi tiết cũ trong `docs/specs/`, là bản mà `AGENTS.md` đang dùng.

Đây là mắt xích làm mọi nỗ lực di trú trở nên vô nghĩa. `AGENTS.md`, file chỉ dẫn mà mọi agent đọc đầu tiên, vẫn trỏ tới tổng quan hệ thống, bản đồ đọc và luật nền ở cây cũ. File luật nạp sẵn cho agent gắn mọi anchor vào bản luật ở gốc `docs/`. Có 25 tham chiếu tới `docs/specs/` nằm trong 22 file chỉ dẫn và skill.

Vì vậy, một agent mới vào repo đọc `AGENTS.md` sẽ được dẫn thẳng tới cây cũ. Cổng vào mới tồn tại nhưng không ai đi qua nó.

## Nhìn lại

Bản đồ thẩm quyền ngày 25/9 tổng kết: 3 khu đã chuyển sang cây mới, 3 khu đang chờ, 12 khu vẫn dùng bản cũ. Map ghi rằng không còn dòng xung đột nào "after the routing correction in this Phase 00 change". Nói cách khác, xung đột có tồn tại và chỉ được gỡ bằng một quy tắc định tuyến viết tay ngay ngày hôm đó. Bài 3 kể chuyện ngày hôm đó.

## Nguồn

- Bảng số file: R-middle §2. Commit đo: `6e0e3c017` (1/8), `36e0602fd` (15/8), `9235bbe19` (dòng 29/8, commit lúc 28/8 21:33 vì main không có commit ngày 29/8), `814711731` (12/9), `cfdaf4bc9` (25/9). Cách đo: `git ls-tree` trên commit cuối của main tại hoặc trước 23:59 ngày đó (fact-check #13). `docs/history` 535 lên 1.115: `681ae1933`, `36e0602fd`.
- Báo cáo 2026-08-25: `plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md` (`fs.existsSync`); R-middle §3.2.
- Dời ADR: `4722361ae` (tsk-1lv-4), `4270c0c0d` (59 phút sau); guard citation drift `41af242e7`, `510abb006` (27/7); R-middle §3.3; fact-check #17, #18.
- Registry: `docs/doc-registry.md` (`ccf8ed091`), `docRegistry.enforce` (`6cce97ab3`), tsk-5mh `7dc95a26c`..`c30261fac`; `provisional`, 332 = 332; R-middle §3.4.
- Cây architect: `docs/architect/agent-coordination/`, `ba7b62ace`; 566 payload; R-middle §3.5.
- Bảng 10/10: transcript Lead `~/.claude/projects/-home-vantt-projects-forgentX/4df9e88c-dcc7-4ca8-b24a-b69b112e7ced.jsonl` dòng 4124 (Lead, 2026-10-10T10:29:43Z) và 4129 (owner, 10:44:33Z).
- Cây platform: `679585957`, `23fb220e3` (`docs/doc-governance.md`, `docs/reading-map.md`, `docs/platform/README.md`); R-middle §1.
- Lần chép: `e1307d33f` (`git show --name-status -M`: 943 A, 4 M, 0 R, 0 D); R-middle §1, §3.6. 6 / 935 khác tại `e1307d33f`, 67 / 935 khác tại `81437ffff` (writer check 2026-11-05: so blob id theo đường dẫn tương đối giữa hai cây `agent-coordination`); R-middle §2, §4.
- Bên đọc: `cfdaf4bc9:AGENTS.md` dòng 8-10, 38, 46; `core/instructions/platform-laws.md`; 25 tham chiếu trong 22 file dưới `core/`, `domains/`, `plugins/`, `.agents/skills`; R-middle §2, §3.8, §3.9.
- Bản đồ 25/9: 3 promoted / 3 candidate / 12 legacy-current; R-middle §3.10.
- [R-middle](research-261105-1411-retrospective-middle-growth-era.md); [fact-check](review-261105-1423-doc-260925-retrospective-claims.md) #13, #17, #18; [round 3](review-261105-1800-doc-260925-retrospective-claims-round3.md) m3; [evidence pack](retrospective-261105-1416-doc-260925-evidence-pack.md) §1, §2, §6.
