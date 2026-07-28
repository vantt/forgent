---
type: explanation
title: 0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)
tags: []
timestamp: 2026-07-28T00:00:00.000Z
source_capture_ids: []
date: 2026-07-28
status: accepted
extends: [0005]
relates_specs: [runner, work-state]
---

# 0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)

## Bối cảnh

`tsk-1an` tái hiện: `worktree.mjs`'s `createWorktree` (dùng bởi pick/take/runner/approve
cho nhánh `fgw/<id>`) là `git worktree add` trần — vì `.fgos/` được git-tracked trong
repo này, fork checkout ra một BẢN CHỤP `.fgos/` đứng yên tại thời điểm fork, bỏ sót mọi
event chưa commit trên main. `session.mjs`'s `createSession` (dùng cho phiên driver
`fgos session start`) đã giải đúng lớp vấn đề này từ trước — xóa bản checkout rồi
symlink `.fgos/` về thẳng kho chung (D10, trích tại `session.mjs:1-6` và
`specs/runner.md:26`). Hai code path lệch nhau về cách xử lý `.fgos/`; `docs/distillery/
porting-log.md:101` (`worktree-isolation-axis`, nguồn beegog `independent-feature-
worktrees`) treo câu hỏi mở "human chọn khóa-cây hay cô-lập-cây cho fan-out fgOS".

Trước khi chọn trục, đã xác minh bằng đọc code (không đoán):

- Không có gì trong đường dispatch worker đọc/ghi `.fgos/` hôm nay: `dispatch.mjs`'s
  executor spawn ở `cwd = wt.path` (`loop.mjs:699`) không hề gọi `fgos`; prompt worker
  cấm thẳng ("Never call `fgos` yourself and never write to `.fgos/` directly" —
  `worker-prompt-default.txt:18-21`); `dataDir()` của CLI resolve theo `process.cwd()`
  (`bin/fgos.mjs:59-61`), không có `repoRoot` cố định.
- Mọi transition trạng thái/stage — `doing→proposed/blocked` lẫn `proposed→done` — đều
  ghi **từ ngoài worktree**: `loop.mjs`'s `dispatchClaimedItem` gọi `moveWork` cùng
  process với `dir = repoRoot/.fgos` (`loop.mjs:727-815`, `store.mjs:327`); `approve`
  (merge thật) là lệnh CLI riêng chạy ở main checkout (`bin/fgos.mjs:1507`). Cửa ghi
  CTR001/one-door-write **chưa từng nằm trong worktree worker**, bất kể verify chạy ở
  đâu.
- Cơ chế duy nhất từng cho phép worker ẢNH HƯỞNG state — "discovered work" — đã đi theo
  mẫu output-có-cấu-trúc-rồi-runner-tự-áp (`0013`), không phải access sống vào
  `.fgos/`.
- `worker`'s cwd có quyền `Bash(git add:*),Bash(git commit:*)` KHÔNG giới hạn path
  (`dispatch.mjs:210-218`) — không có capability-wall thật, chỉ có lời dặn trong prompt.
  Đúng lớp lỗi repo đã tự ghi nhận ở `capability-enforced-readonly-fanout`
  (porting-log): "capability LÀ tường, không phải câu dặn — sự cố thật: analyst được
  dặn 'no writes' vẫn commit source."

## Quyết định

Chọn phương án thứ ba, hẹp hơn cả hai vế của câu hỏi treo — **chặn-cây**, không phải
khóa-trong-cây (symlink) và không phải cô-lập-cây đầy đủ (bootstrap-copy + union-merge):

- `worktree.mjs`'s `createWorktree`, sau `git worktree add`, xóa hẳn bản `.fgos/` vừa
  checkout ra (không symlink, không giữ lại) — mirror bước xóa của `session.mjs:346-359`
  nhưng KHÔNG làm bước symlink theo sau.
- `merge.mjs` thêm một guard cơ học: một diff của nhánh `fgw/<id>` chạm bất kỳ path nào
  dưới `.fgos/` bị `approve` từ chối cứng trước khi tin merge — wall nằm ở phía trusted
  (mã chạy trên main), không dựa lời dặn worker.
- `session.mjs` giữ nguyên 100% (symlink, D10) — actor khác hẳn: phiên driver được PHÉP
  gọi `fgos`, worker thì không.

### Vì sao không khóa-trong-cây (symlink như session.mjs)

Đúng pattern cho actor trusted (session), SAI cho worker: symlink trỏ RA NGOÀI worktree
là lối thoát sandbox kinh điển — một write-guard mai sau muốn khoanh worker vào đúng cây
của nó sẽ phải tự biết resolve symlink target mới chặn được, nếu không thì path
`.fgos/events.jsonl` nhìn như "trong worktree" nhưng thật ra ghi thẳng ra kho sống. Hơn
nữa symlink cấp quyền ghi SỐNG vào kho DUY NHẤT từ một execution context không có
capability-wall thật (wildcard git add/commit, xem Bối cảnh) — một lần ghi lạc (bug,
prompt injection, hay agent tự ý) đâm thẳng vào `.fgos/events.jsonl` thật, không qua
review, không như code (code lỡ sai còn nằm trên nhánh vứt được). Nặng hơn cả hiện trạng
(bản chụp cũ đứng yên, ghi lạc vào đó chỉ tự làm bẩn nhánh của chính nó, bị chặn lúc
merge nếu commit).

### Vì sao không cô-lập-cây đầy đủ (bootstrap-copy + union-merge, kiểu beegog/symphony)

Đúng pattern cho worker THẬT SỰ cần state riêng rồi hòa giải sau (repository-harness's
`symphony-isolated-runner`: "root db never source of truth of the run", đổi trạng thái
bền chỉ qua semantic changeset) — nhưng đó là bài **chưa ai hỏi** ở fgOS hôm nay: đã xác
minh không nơi nào trong dispatch cần đọc/ghi `.fgos/` từ worktree (xem Bối cảnh). Build
cả subsystem F3 (store riêng + grant read-only + resolve + union-merge lúc merge-back)
cho nhu cầu chưa tồn tại là xây trước — ngược YAGNI (`development-rules.md`). Nó còn kéo
thêm một mặt trận chưa có lời giải rẻ trong Node: cấp "read-only main-store" cho worktree
mà worktree "không tự-cấp" (đúng chữ porting-log dùng) đòi cơ chế permission/bind-mount
không cơ học đơn giản cross-platform — thêm bề mặt phải giữ đúng cho một khả năng chưa
dùng.

### Vì sao chặn-cây

Đóng cả hai rủi ro cùng lúc, chi phí nhỏ nhất:

- Đóng bug tái hiện của `tsk-1an` triệt để hơn cả khóa lẫn cô-lập: không còn bản `.fgos/`
  nào trong worktree để "thiếu" hay "cũ" — không có gì để đọc sai, vì đọc sai cần có dữ
  liệu (dù cũ) để đọc.
- Đóng lối thoát sandbox mà khóa-trong-cây mở ra, mà không cần xây subsystem của cô-lập.
- Không thêm state phải đồng bộ, không thêm cửa ghi thứ hai — CTR001 one-door-write giữ
  nguyên nghĩa đen: chỉ một nơi vật lý là `.fgos/`, đứng ở `repoRoot`.
- Đường mở rộng vẫn còn nguyên nếu sau này worker THẬT cần ảnh hưởng state (planning
  worker, luồng dài tự đề xuất việc): nối theo đúng mẫu `0013` (output có cấu trúc,
  runner/main checkout tự áp qua verb) — không cần đảo quyết định này, chỉ cần thêm một
  kênh output nữa, giống discovered-work.

Không chốt cho trục điều phối rộng hơn (`worktree-isolation-axis`, đa-agent tách nhánh
tính năng song song) — câu hỏi đó vẫn `candidate` ở `porting-log.md:101`, phạm vi rộng
hơn hẳn bug `.fgos`-trong-`fgw/<id>` này.

## Hệ quả

- `worktree.mjs`, `merge.mjs` cần sửa theo đúng hai gạch đầu dòng ở Quyết định — chưa
  làm tại thời điểm ghi record này, đây là quyết định trục, phần thực thi đi theo sau.
  Kiểm test: (1) tái hiện bug gốc (submit uncommitted rồi pick → xác nhận trước-sửa
  worktree mang bản `.fgos/` cũ/thiếu), (2) sau sửa, worktree hoàn toàn không có
  `.fgos/`, (3) `merge.mjs` từ chối một diff giả lập có chạm path `.fgos/`.
- `tsk-3w8` (đợi trục này chốt, theo `deps`) không đổi hướng gì thêm — vấn đề của nó
  (race main-checkout lúc `approve`/commit) là lớp coordination khác, không phải
  DB-copy/staleness của trục này.
- `session.mjs` không đổi — vẫn symlink, vẫn D10.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
