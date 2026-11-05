# Bài 2: Tài liệu đã trôi dạt thế nào (tháng 8 đến 25/9)

*Chuỗi hồi cứu plan 260925, bài 2/6. Bài trước: [Ngày đầu tiên và lời hứa "compound"](retrospective-261105-1416-doc-260925-post-1-genesis-and-compound.md). Bài sau: [Cú hích](retrospective-261105-1416-doc-260925-post-3-the-trigger.md).*

Bài 1 kết thúc ở chỗ fgOS có cơ chế sinh tài liệu tự động nhưng không có luật thẩm quyền. Bài này đo hậu quả trong tám tuần, từ 1/8 tới 25/9. Mọi con số dưới đây được lấy từ `git ls-tree` trên commit cuối cùng của main tại hoặc trước 23:59 ngày đó (R-middle §2). Riêng dòng 08-29 là `9235bbe19`, commit lúc 21:33 ngày 28/8, vì main không có commit nào trong ngày 29/8 (fact-check `review-261105-1423-doc-260925-retrospective-claims.md` #13).

## Số file tăng 12 lần, specs gần như đứng yên

| Ngày | Commit | File trong `docs/` | `docs/specs` | `docs/platform` |
|---|---|---|---|---|
| 08-01 | `6e0e3c017` | 365 | 11 | 0 |
| 08-15 | `36e0602fd` | 1.500 | 12 | 0 |
| 08-29 | `9235bbe19` | 2.116 | 12 | 0 |
| 09-12 | `814711731` | 3.239 | 13 | 0 |
| 09-25 | `cfdaf4bc9` | 4.301 | 13 | 1.005 |

Phần tăng thêm gần như toàn là evidence và history, không phải spec được bảo trì. Riêng `docs/history` tăng từ 535 lên 1.115 file trong tuần 8/8 đến 15/8. Vấn đề không nằm ở số lượng. Vấn đề là mọi thứ nằm chung một cây và không có dấu nào nói file nào là nguồn có thẩm quyền.

Một báo cáo ngày 25/8 đã đo được nguyên nhân cơ học. Hệ có 268 tài liệu end-user và tăng thêm khoảng 50 tài liệu mỗi 7 ngày. Lựa chọn "viết mới hay viết thêm vào tài liệu cũ" chỉ được quyết bằng `fs.existsSync` trên một đường dẫn đặt tên tự do, nên gần như lần nào cũng thành viết mới (`plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md`, theo R-middle §3.2). R-middle §3.2 quy phần tăng này cho evidence theo từng work item cộng với tài liệu do skill retrospective tự sinh. Theo cách đọc của người viết, đó là cơ chế tự sinh tài liệu ở bài 1 chạy đúng như nó được thiết kế.

## Dời ADR và link chết: 17/8

`4722361ae` (tsk-1lv-4) đưa 34 ADR từ `docs/decisions/` vào mục "Lịch sử quyết định" của từng `docs/specs/<area>.md`, chỉ để lại một `docs/decisions/index.md` sinh tự động. Chưa đầy một giờ sau (59 phút), `4270c0c0d` phải sửa một "dead write-time sweep" và cập nhật baseline citation drift. Chính message của `4722361ae` liệt kê các con trỏ trong `AGENTS.md` từng trích dẫn tới file vừa bị xoá (R-middle §3.3). Guard citation drift không phải mới: script và spec của nó đã có từ 27/7 (`41af242e7`, `510abb006`). Dù vậy, lần dời vẫn để lại tham chiếu chết, và `4270c0c0d` phải cập nhật baseline của guard và sửa sweep (fact-check #18).

Từ đây, thẩm quyền cho một quyết định bị chia ra ba nơi: lời kể trong spec, bản ghi event `.fgos`, và index sinh tự động.

## Hai registry trong một tuần: 25 đến 27/8

`ccf8ed091` tạo `docs/doc-registry.md`. `6cce97ab3` bật `docRegistry.enforce`. tsk-5mh dời 332 tài liệu vào `docs/knowledge/`, mỗi tài liệu một commit (`7dc95a26c`..`c30261fac`). Các thư mục quadrant cũ không bị xoá. Tới 25/9, bản review độc lập vẫn đếm được 137 file `explanation`, 20 `how-to`, 6 `reference` nằm cạnh `docs/knowledge/`. Review đó cũng phát hiện mọi tài liệu đều `provisional` và số topic bằng đúng số tài liệu (332 = 332), nghĩa là registry chưa gộp được tài liệu nào (R-middle §3.4).

## Một cây song song: `docs/architect/`

`ba7b62ace` (31/8) tổ chức lại `docs/architect/agent-coordination/`. Thư mục này có 14 file vào 29/8, 473 file vào 5/9, và 905 file vào 12/9. Phần lớn là request thô, kết quả và proof, không phải thiết kế. Authority map ngày 25/9 đếm được 566 file payload không phải Markdown dưới `docs/architect/**` và ghi rằng chưa ai lập bản đồ những thứ đọc các payload đó (R-middle §3.5).

## Sai lầm 18/9: chép 943 file thay vì dời

`docs/platform/` bắt đầu ngày 14/9 (`679585957`). Ngày 15/9, một commit tên "chore: preserve main worktree before packaging merge" (`23fb220e3`) thêm cùng lúc `docs/doc-governance.md`, `docs/reading-map.md` mới, `docs/platform/README.md` và toàn bộ thiết kế documentation-system. Governance ghi trạng thái "Accepted" nhưng "Implementation: Partial" (R-middle §1).

Ngày 18/9, commit `e1307d33f` có tiêu đề `fix(dispatch): widen TRUST_STORE_KINDS ...; docs(agent-coordination): migrate to docs/platform/ target structure`. Nó **thêm** 943 file vào `docs/platform/agent-coordination/`: 943 A, 4 M, 0 rename, 0 xoá bản gốc (`git show --name-status -M e1307d33f`, R-middle §1). Một việc di trú tài liệu lớn như vậy nằm lẫn trong commit sửa dispatch, và chữ "migrate" thực chất là chép.

Một ngày sau, ở `81437ffff`, 935 đường dẫn tương đối tồn tại ở cả hai cây. 868 file giống hệt nhau, 67 file đã khác nhau, trong đó có `architecture/README.md`, `protocol-model.md`, `runtime-model.md`, `dispatch-control-plane.md` (R-middle §2). 67 bản này tách nhánh trước hay sau lần chép thì chưa kiểm được. Ai quyết định chép thay vì dời, và với ý định gì, cũng chưa rõ (R-middle §4).

## Ba bản luật, hai bản đồ đọc

Tại `cfdaf4bc9` (25/9), luật nền có ba bản (R-middle §2):

- `docs/platform-foundations.md`: 16.398 byte.
- `docs/specs/platform-foundations.md`: 33.845 byte.
- `docs/platform/platform-foundations.md`: 3.341 byte, một bản tóm tắt dẫn về hai bản kia.

Có hai reading map: `docs/reading-map.md` (2.993 byte, mới, "Accepted") và `docs/specs/reading-map.md` (29.870 byte, chi tiết, và là bản `AGENTS.md` đang dùng).

## Những bên đọc luôn được nạp không bao giờ chuyển theo

Đây là mắt xích làm mọi nỗ lực di trú trở nên vô nghĩa. Tại 25/9, `AGENTS.md` ở các dòng 8-10, 38 và 46 vẫn trỏ tới `docs/specs/system-overview.md`, `docs/specs/reading-map.md` và `docs/platform-foundations.md` gốc. `core/instructions/platform-laws.md` gắn mọi anchor luật vào bản ở gốc `docs/`. Có 25 tham chiếu `docs/specs/` nằm trong 22 file dưới `core/`, `domains/`, `plugins/`, `.agents/skills` (R-middle §3.8). Skill thì được render ra ba nơi (`.agents/skills`, `.claude/skills`, `plugins/fgOS`), và `07c4a5205` (20/8) từng sửa tay bản render trong cùng commit với nguồn (R-middle §3.9).

Vì vậy, một agent mới vào repo đọc `AGENTS.md` sẽ được dẫn thẳng tới cây cũ. Switchboard mới tồn tại nhưng không ai đi qua nó.

## Chuỗi nhân quả, tóm gọn

1. Specs, file gốc và history nằm chung một cây và không có dấu thẩm quyền, nên thẩm quyền bị chia.
2. Tài liệu tự sinh theo từng work item làm tăng khối lượng, tạo bản gần trùng và hai hệ tri thức.
3. Dời mà guard có sẵn không chặn được, nên vẫn sinh ra link chết và guard phải được chỉnh sau đó.
4. Cây đích được tạo bằng cách chép dưới một governance "Partial", sinh ra bản sao tách nhánh và cây song song.
5. Bên tiêu thụ trỏ vào đường dẫn chứ không trỏ vào switchboard, nên có bypass và projection lỗi thời.

Authority map ngày 25/9 tổng kết: 3 khu promoted, 3 candidate, 12 legacy-current. Map ghi rằng không còn dòng `conflicted` nào "after the routing correction in this Phase 00 change". Nói cách khác, xung đột có tồn tại và chỉ được gỡ bằng một quy tắc routing viết tay ngay ngày hôm đó (R-middle §3.10). Bài 3 kể chuyện ngày hôm đó.

## Nguồn

- Số đếm file: R-middle §2 (`6e0e3c017`, `36e0602fd`, `9235bbe19`, `814711731`, `81437ffff`, `cfdaf4bc9`).
- Báo cáo 2026-08-25: `plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md`.
- Dời ADR: `4722361ae`, `4270c0c0d`; guard citation drift `41af242e7`, `510abb006`.
- Registry: `ccf8ed091`, `6cce97ab3`, tsk-5mh `7dc95a26c`..`c30261fac`.
- Cây architect: `ba7b62ace`. Cây platform: `679585957`, `23fb220e3`, `e1307d33f`.
- Render copy: `07c4a5205`, `e859e71d6`.
- [research-261105-1411-retrospective-middle-growth-era.md](research-261105-1411-retrospective-middle-growth-era.md) (R-middle) §1, §2, §3, §4.
- [Fact-check](review-261105-1423-doc-260925-retrospective-claims.md) #13, #17, #18.
- [Evidence pack](retrospective-261105-1416-doc-260925-evidence-pack.md) §2.
