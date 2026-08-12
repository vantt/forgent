# DISCUSSION — herdr-web-dashboard

Item: tsk-ldb — "nâng cấp herdr-plugin thành 1 orchestrator thật thụ có các
core component: 1) herdr orchestrator (đã làm), 2) tui dashboard chạy trên
herdr (đã làm), 3) web dashboard, webserver tự quản tự host frontend..."

## 1. Trạng thái hiện tại

Vòng đầu tiên. Đã scout xong bức tranh hiện trạng (xem §2/§3). Chưa có
D-ID nào chốt. Đang chờ người dùng trả lời loạt câu hỏi mở ở cuối §5 để
khoanh vùng thiết kế trước khi viết §6.

## 2. Mục tiêu & đề bài

herdr-plugin hiện có 2 trong 3 core component người dùng hình dung cho một
"orchestrator thật thụ": (1) herdr-orchestrator — cơ chế tự launch pane
theo settings bật/tắt cho discover/merge/retro/cleanup (tsk-2xt và các con
tsk-2m5/tsk-2ja/tsk-57q, đều đã `done`), và (2) TUI dashboard chạy ngay
trong herdr — cockpit hiển thị work-items, in-progress list, action queues
(NEED ANSWER/MERGE LIST/AFTER DELIVER), detail modal, mouse/keyboard focus,
đã qua rất nhiều vòng nâng cấp (từ tsk-19y tới tsk-bvh, phần lớn `done`).
Component còn thiếu là (3): một **web dashboard** — tự chạy webserver,
tự host frontend của chính nó (không phụ thuộc herdr's TUI runtime) — với
trọng tâm là một taskboard đẹp, và đặc biệt là **view chi tiết một task**:
lịch sử những gì agent đã thực sự làm trên task đó, lịch sử các câu hỏi đã
hỏi/đã trả lời, và — quan trọng nhất theo lời người dùng — phần "câu hỏi
cần trả lời" (câu hỏi đang treo, item đang ở `awaiting-human`) phải được
framing lại thành một narrative ngắn gọn, dễ hiểu, đủ chi tiết để một
người không có context trong đầu vẫn trả lời được nhanh, thay vì hiện
nguyên văn dữ liệu thô.

## 3. Vấn đề rõ / chưa rõ

| # | Nội dung | Trạng thái | Ghi chú |
|---|----------|-----------|---------|
| 1 | Component 1 (herdr-orchestrator) và 2 (TUI dashboard) đã tồn tại và `done` | Rõ | tsk-2xt/2m5/2ja/57q (orchestrator); tsk-19y…tsk-bvh (TUI) — xác nhận qua `fgos list --all --json` |
| 2 | Chưa có item nào từng đề cập "web dashboard"/"webserver" trong toàn bộ backlog hiện tại | Rõ | grep title+description của 57 item herdr-* — 0 match |
| 3 | Repo hiện KHÔNG có dependency web/http nào (`package.json` chỉ có `yaml`) | Rõ | không Express/Fastify/http.createServer nào tồn tại trong `src/` |
| 4 | Dữ liệu "lịch sử task agent đã làm" đã có sẵn qua `fgos show <id> --json`: `discovery`, `decisions`, `gates`, `outcome`, `friction`, `settlement`, `learning` | Rõ | xác nhận bằng lệnh `show --json` thật trên tsk-2xt |
| 5 | Dữ liệu câu hỏi/trả lời: `ask` (câu hỏi) nằm trên event `work.move` khi chuyển sang `awaiting-human`; `gates[id]` còn giữ `askRationale/askAlternatives/askSource` (checkpoint lúc hỏi) và `rationale/alternatives/source` (lời cuối lúc trả lời) — theo `src/state/awaiting-context.mjs` | Rõ | đọc trực tiếp file nguồn |
| 6 | Một item bị park nhiều lần (nhiều vòng hỏi/đáp) có giữ lại TOÀN BỘ lịch sử Q&A hay chỉ giữ bản mới nhất | **Chưa rõ** | đang scout (agent research đang chạy) |
| 7 | Stack kỹ thuật cho webserver + frontend (ngôn ngữ, framework, hay zero-dep thuần Node như phần còn lại của fgOS) | **Chưa rõ** | cần quyết định của người dùng — có kéo theo thay đổi triết lý zero-dep hiện tại |
| 8 | Vòng đời webserver: ai start/stop nó, port cố định hay cấu hình, có phải một phần của `fgos setup`/`doctor` registry không (theo AGENTS.md "Install/setup/doctor gate") | **Chưa rõ** | |
| 9 | Ranh giới với TUI dashboard: web dashboard có phải bản sao chức năng của TUI (đọc cùng data qua `fgos list/show --json`), hay có phạm vi/độc giả khác (vd xem trên điện thoại, xem từ xa không cần mở terminal) | **Chưa rõ** | ảnh hưởng lớn tới scope |
| 10 | "Framing câu hỏi dễ hiểu" cụ thể là gì: một layout/UI tốt trên dữ liệu thô sẵn có, hay cần một bước tổng hợp/viết lại nội dung (và nếu vậy, ai/cái gì làm bước đó — LLM call thời điểm render, hay agent tự viết narrative đó lúc `ask`) | **Chưa rõ** | câu hỏi cốt lõi nhất của toàn bộ yêu cầu |

## 4. Quyết định đã chốt

(chưa có mục nào — vòng đầu tiên, chưa gì đủ ổn định để mint D-ID)

## 5. Q&A log

**[2026-08-12, vòng 1 — scouting]** Scout trước khi hỏi (bắt buộc theo
fgos-coding-shaping D6):
- `fgos list --all --json` → 57 item có chữ "herdr" trong title/description;
  0 item nhắc "web dashboard"/"webserver"/"self-host" — xác nhận đây là
  scope mới, không trùng việc đã có.
- `docs/decisions/0028`, `0029` D17, `0031`: từ "orchestrator" từng bị cấm
  dùng (đổi thành "launcher") rồi được **gán nghĩa mới chính thức** —
  "tầng hợp thành T0: điều phối N đơn vị chạy đồng thời, ở lại" — khớp
  đúng với việc người dùng gọi herdr-orchestrator (tsk-2xt, tự launch
  nhiều pane theo settings) là "orchestrator". Không có xung đột thuật ngữ.
- `package.json`: chỉ 1 dependency (`yaml`) — toàn bộ fgOS hiện tại là
  Node thuần, không framework. Đây là tín hiệu triết lý mạnh, cần người
  dùng xác nhận có muốn giữ hay chấp nhận phá lệ cho web dashboard.
- `fgos show tsk-2xt --json` → xác nhận shape thật: `{work, discovery,
  decisions, gates, outcome, friction, settlement, learning}` — đây chính
  là nguồn "lịch sử task agent đã làm".
- `src/state/awaiting-context.mjs` → xác nhận shape Q&A: `ask` (câu hỏi
  tại lần park hiện tại), `askRationale/askAlternatives/askSource` (agent
  tự chú giải lúc hỏi), `rationale/alternatives/source` (người trả lời
  lúc đáp), cộng `changedSinceAsk` (parent đổi gì kể từ lúc hỏi).

**Câu hỏi mở gửi người dùng (chưa trả lời):**

1. Web dashboard này phục vụ mục đích khác TUI dashboard ở điểm nào — xem
   từ xa/điện thoại không cần mở terminal herdr? Hay đơn giản là "cùng dữ
   liệu, giao diện đẹp hơn cho phần task-detail/Q&A" và có thể chạy song
   song, không thay thế TUI?
2. Về "framing câu hỏi dễ hiểu, ngắn gọn": bạn hình dung đây là một UI/layout
   tốt render lại dữ liệu thô sẵn có (ask/askRationale/askAlternatives),
   hay cần một bước tổng hợp nội dung mới (ví dụ agent tự viết một đoạn
   narrative ngắn NGAY LÚC `ask`, lưu lại làm field riêng, để web dashboard
   chỉ việc hiển thị)?
3. Stack: fgOS hiện tại zero-dependency (chỉ `yaml`). Bạn có chấp nhận thêm
   dependency thật cho web dashboard (vd một framework nhẹ như Fastify/Hono
   phía server, hoặc thậm chí chỉ Node `http` thuần + static HTML/JS không
   build step), hay muốn giữ nguyên triết lý zero-dep càng nhiều càng tốt?
4. Vòng đời webserver: chạy thường trực (daemon riêng, tự khởi động), hay
   chỉ chạy khi người dùng gõ lệnh (vd `fgos web` mở server + browser), hay
   gắn vào herdr-orchestrator để tự bật/tắt như 4 domain kia (discover/
   merge/retro/cleanup)?
5. "Lịch sử câu hỏi" — bạn muốn thấy TOÀN BỘ các lần hỏi/đáp qua nhiều vòng
   park của một task (nếu có), hay chỉ cần câu hỏi/trả lời gần nhất là đủ?
   (đang xác minh kỹ thuật xem dữ liệu hiện có giữ được toàn bộ lịch sử này
   hay chỉ bản mới nhất — sẽ báo lại).

## 6. Thiết kế đã chốt

(chưa có gì để tổng hợp — chưa có quyết định nào chốt ở §4)

## 7. Danh mục hạng mục / task

(chưa tách — chờ §6 có hình dạng cụ thể trước)
