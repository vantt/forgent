# Event store của Work nằm trong cây git: mô tả vấn đề

Thời điểm: 2026-10-17 10:27 (Asia/Saigon). Chỉ probe, chưa đề xuất thiết kế. Mục đích: để owner xác nhận đây đúng là vấn đề cần giải.

## Tóm tắt

Event log của Work (`.fgos/events/*.jsonl`, cùng baseline `.fgos/events.jsonl`) đang **đóng hai vai cùng lúc**. Vai thứ nhất là **database runtime**: ghi liên tục, append, cục bộ, cần tươi ngay. Vai thứ hai là **tài liệu được git version**: được track, được commit, đi qua merge giữa các branch và giữa các máy. Hai vai này đòi hai luật ngược nhau. Hệ quả là log nằm lửng lơ giữa "git track" và "gitignore", và một họ lớn cơ chế git phải mọc ra để che chỗ lửng lơ đó. Theo danh mục bài học git, **43 trên 182 bài học (khoảng 24%) chỉ tồn tại vì event log nằm trong cây làm việc của git**.

## Hiện trạng đo được

**Phần nào được track, phần nào bị ignore** (`.gitignore`, `git ls-files .fgos`):

| Đường dẫn | Git | Vai thật | Ghi chú |
|---|---|---|---|
| `.fgos/events/*.jsonl` (90 shard theo writer) | **track** (89/90) | sự thật, ghi nóng | shard của phiên đang chạy là **untracked** cho tới khi có người commit |
| `.fgos/events.jsonl` (11 MB) | **track** | baseline đóng băng | không đổi từ 2026-09-18 |
| `.fgos/events.jsonl.backup-*` (8,1 MB + 0,5 MB) | **track** | rác lịch sử | backup thủ công tháng 7–8 vẫn nằm trong repo |
| `.fgos/state.json` (9,3 MB) | **track** | **view cũ, không ai đọc** | sửa lần cuối 2026-09-18; code đọc `.fgos/cache/state.json` (`src/state/fgos-file-registry.mjs:36`) |
| `.fgos/cache/state.json` (10,8 MB) | ignore | view thật | dựng lại từ replay |
| `config.json`, `gate-bypass.json`, `distribution.json`, `coexistence.json`, `instructions/`, `docs/`, một phần `observe/` | track | cấu hình và dữ liệu khác | trộn chung thư mục với dữ liệu runtime |
| `runtime/`, `assignments/`, `workflow-runs/`, `logs/`, `*.lock`, `sessions.json`, `installation/`, `secrets.local.env` | ignore | runtime | |

**Spec và thực tế lệch nhau.** `docs/specs/work-state.md` (dòng ~1360 và ADR "Data dir = `.fgos/`") nói "`events.jsonl` committed = sự thật, `state.json` gitignored = view, đọc `.gitignore` là thấy đâu là sự thật". Thực tế: sự thật đã chuyển sang shard `.fgos/events/`; `.fgos/state.json` vẫn bị track dù là view cũ không ai đọc; view thật nằm ở `.fgos/cache/`. Đọc `.gitignore` không còn cho biết đâu là sự thật.

**Độ bền phụ thuộc vào việc ai đó tình cờ commit.**
- Có checkpoint dự phòng mỗi giờ (`fallbackIntervalSec: 3600`, `events-jsonl-truncation-guard.mjs:507-525`), nhưng chỉ chạy khi có main-checkout writer.
- Trong 7 ngày qua chỉ có 3 commit chạm `.fgos/events`, và đều là commit "đi nhờ" hoặc commit tay. Ví dụ `a67cf7b1d docs: register the vendored YAML parser decision…` cuốn theo cả event.
- Ngay lúc này, 32 item em vừa đóng sáng nay chỉ nằm trong một shard **untracked** trên main checkout. Một lệnh `git clean -fd`, một lần clone mới, hay một máy khác đều không thấy chúng, và các nơi đó sẽ thấy backlog cũ.

## Vì sao nó ảnh hưởng tới worktree, log và độ tươi của database

1. **Worktree.**
   - Worktree của worker được tạo từ git nên mang theo bản chụp `.fgos/` cũ. fgOS phải xoá bản chụp đó (strip) ngay sau checkout, nhưng index vẫn giữ các file đó.
   - Hệ quả: `git add -A` trong worktree sẽ stage việc xoá toàn bộ event log (G-029, G-166, `tsk-56u`).
   - Mọi lệnh fgOS chạy trong worktree đều phải tìm ngược về `.fgos` của main checkout (`getMainFgosDir`, `resolveContentRoot`). Cách suy ra main checkout này lại sai với `--separate-git-dir`, submodule và bare repo (C2-042).
2. **Merge.**
   - Branch worker không được mang thay đổi `.fgos/` (ADR0020, G-069, G-088).
   - Shard phải dùng `merge=union`, mà union lại stage `.fgos/` ở gần như mọi lần approve, kéo theo `fgos-write-rejected` (G-089).
   - Xoá shard trên branch cũ tạo conflict modify/delete mà không driver nào xử lý (G-090). Merge ba chiều trên log làm mất event (G-121).
   - Từ đó mọc thêm cả một chuỗi `restore`/`self-heal` (`tsk-4gi`, `tsk-4s6`, `tsk-52p`, `tsk-tr9`, `tsk-2ep`).
3. **Race giữa ghi event và git.**
   - Event được append trong lúc checkpoint hay merge đang `git add` hoặc restore `.fgos/events*`: git stage một tiền tố, phần ghi sau bị lạc hoặc mất (G-120, L-036, nằm trong 4 kịch bản P0).
   - Commit checkpoint giành khoá với chính người gọi, hoặc xen vào giữa một land (G-118).
   - Truncation guard tồn tại chỉ vì lệnh git có thể cắt cụt log (G-093, `tsk-oet`, `tsk-5k1`).
4. **Độ tươi database.**
   - View (`cache/state.json`) dựng từ những shard đang có trên đĩa của main checkout.
   - Máy khác hay clone khác chỉ nhận event khi có người commit rồi push shard.
   - Worker trong worktree không có `.fgos` riêng; nó đọc của main checkout.
   - Vì vậy "database tươi tới đâu" phụ thuộc vào ba thứ: đang đứng ở checkout nào, lần commit tình cờ gần nhất là khi nào, và lần pull gần nhất là khi nào.
5. **Khoá.** Main checkout mutex phải bảo vệ cả code lẫn checkpoint state (`checkpointMainFgos`). Đó là lý do plan 4.3 phải trộn "mutex nóng state" với "main checkout một cửa", hai thứ mà về bản chất là khác nhau.

## Gốc của vấn đề

Luật L3 ("truth ở JSONL, db là view") **không đòi** JSONL phải nằm trong cây git. Việc commit log vào git (ADR 0001) là một lựa chọn cho hai nhu cầu: bền và chia sẻ (sync giữa máy và phiên, audit). Nhưng dùng **cây làm việc của git** làm kho runtime đã ghép ba tần số khác nhau vào một chỗ:
- ghi event: từng mili-giây;
- commit/checkpoint: thỉnh thoảng, khi ai đó tiện;
- merge/push giữa branch và giữa máy: theo nhịp code.

Mọi cơ chế kể trên đều là chỗ vá cho việc ba tần số đó va nhau.

## Quan hệ với component Git

Rất mật thiết, đúng như owner cảm nhận. Nếu không tách được câu hỏi "event store sống ở đâu", component Git sẽ phải mang theo nguyên họ 43 bài học về `.fgos`: strip, union, write-rejected, checkpoint, truncation guard, race append-vs-stage, cùng việc mutex main ôm luôn state. Ngược lại, nếu event store ra khỏi cây git và chỉ "xuất bản" sang git theo một hợp đồng rõ ràng, khi cần chia sẻ, thì phần lớn họ bài học đó biến mất thay vì phải port sang Rust. Đây là quyết định nên chốt **trước hoặc cùng** spec G0 của component Git.

## Câu hỏi để owner xác nhận

1. Mô tả trên có đúng nỗi ám ảnh của anh không: log nằm lửng giữa track và ignore, ảnh hưởng worktree, log và độ tươi của database?
2. Nhu cầu chia sẻ event giữa máy và giữa clone có thật không, hay fgOS chỉ cần một store cho mỗi máy hoặc mỗi project? Câu trả lời quyết định có cần git để chia sẻ hay không.
3. Muốn giải riêng thành một việc (event store placement) nhưng chốt cùng lúc với spec Git, hay gộp làm một?
