---
title: Kiến trúc giao tiếp người ↔ fgOS — contract là schema log, adapter mỏng, daemon ngoài core
date: 2026-07-18
status: accepted
source_decisions: [b2d18cc7, ef6ed305]
supersedes: []
relates_specs: [platform-foundations, work-state]
---

# 0014 — Kiến trúc giao tiếp người ↔ fgOS

Quyết định ở **mức interface** (hình dạng cửa giao tiếp), không phải mức
implementation. Chốt qua thảo luận mở với người dùng 2026-07-18.

## Bối cảnh

fgOS cần một lớp để người **quan sát + tương tác** với hệ (xem hệ đang làm gì,
tạo/khám phá work-item, trả lời câu hỏi gate) — tiện, ít-phải-làm, và **remote
được**. Câu hỏi nền bị lật ra: *cửa chuẩn để giao tiếp với người là gì?* Mặc định
hiện tại coi CLI (`fgos <verb>`, spawn-rồi-chết, đọc envelope) là cửa. Nhưng một
tiến trình spawn-rồi-chết **về bản chất không giữ kết nối để đẩy** — nên chiều-ra
"chủ động báo người" (`cần bạn`) hiện **bị động**: chỉ poll + `data_hash`, còn
attention-envelope (C8) thì hoãn "chờ lực kéo".

Ba mô hình cửa được cân:

1. **CLI-spawn = cửa** (hiện trạng, Host-Adapter `b2d18cc7`). Đơn giản, crash-safe,
   log git-diffable, zero luôn-bật — nhưng không server-push được, remote gượng.
2. **Daemon nuôi một cửa protocol chuẩn máy-đọc** (socket/JSON-RPC). Push/stream/
   remote thành bản chất — nhưng luôn-bật, và (nếu link core) phải sở hữu đường ghi.
   Đây đúng là kiến trúc **interface** của herdr (không phải runtime của nó).
3. **Core-library + adapter mỏng.** Có một contract lõi; CLI và daemon là adapter;
   daemon chỉ bật khi cần remote/push.

Một nhánh phân tích quan trọng: fgOS **đã là event-sourced** (`0001` — log là sự
thật). Trong hệ như vậy, hợp đồng thật không nằm ở một thư viện link được, mà ở
**format của log + giao thức đọc/ghi**.

## Quyết định

Chọn **mô hình (3)**, với các chốt sau — tất cả ở mức interface:

1. **Contract chuẩn = SCHEMA event-log + giao thức append / read / subscribe**, KHÔNG
   phải một lib link được. Đây là mở rộng trực tiếp của `0001`: log đã là sự thật,
   nên *đường nói chuyện với sự thật* mới là cửa. Hệ quả: bất kỳ tiến trình nào
   (khác ngôn ngữ cũng được) nói đúng log-format là một participant đầy đủ — chống
   Node-monoculture, đúng định vị substrate đa-app.

2. **Lib chỉ là CLIENT tham chiếu (Node) của contract**, không phải bản thân
   contract. Tiện ích sinh/fold event cho code Node, không phải cửa.

3. **CLI = adapter local, standalone.** Là cửa dùng hằng ngày; chỉ code
   **cùng-tiến-trình** (CLI, TUI local) mới gọi lib trực tiếp. CLI cần được
   **chuẩn hoá lại**: verb surface nhất quán + envelope + exit-code + schema
   tự-mô-tả sinh-từ-code (nối tiếp `0011` — version tường minh cho mọi contract).

4. **Daemon = NGOÀI core, là CONSUMER giao tiếp QUA CLI.** Khi có daemon, nó **không
   link lib**: nó `spawn fgos <verb>` cho ghi + poll (`fgos list`/`rollup` +
   `data_hash`) cho chiều-ra, và giữ kênh outbound để đẩy. Hệ quả cốt lõi: daemon
   **thừa hưởng identity-gate + validation + single-door-lock của CLI miễn phí**, không
   chế được đường ghi mới. Vì thế **`b2d18cc7` (Host-Adapter) được GIỮ và FULFILL,
   KHÔNG bị supersede** — daemon chính là "lực kéo" mà C8 chờ. Core fgOS vẫn
   **passive** (chỉ CLI + lib + log); mọi hành vi "chủ động/đẩy" sống ở consumer.

5. **UI (web/mobile/remote) là client của DAEMON, không của lib.** Chỉ TUI-local mới
   chạm lib trực tiếp; mọi UI ngoài terminal đi qua cửa mạng của daemon → daemon là
   điều kiện cần cho bất kỳ UI ngoài terminal.

6. **Kênh attention/push tách thành subsystem riêng** (backlog STR48) với
   delivery-semantics tường minh (at-least-once, dedup, routing, ack, escalation),
   sống ở consumer — không để nó là phần phụ của review in/out.

## Hệ quả

- **Không phá luật.** Đường đã chọn (daemon-ngoài-core-qua-CLI) tuân thủ `b2d18cc7`
  và `0001` nguyên vẹn; record này **không supersede gì**. Chỉ NẾU sau này muốn một
  daemon **link-lib in-process** (biến thể của mô hình 2) thì mới đụng `b2d18cc7` —
  khi đó cần một record supersession riêng.
- **Prerequisite móng:** tách core (verb-logic) thành lib gọi được độc lập CLI — hôm
  nay logic nằm trong CLI thì kéo ra, CLI thành client mỏng. Refactor nội bộ; đường
  ghi single-door (C2) và lock giữ nguyên.
- **Chưa quyết (ngoài phạm vi record này):** tầng OWNER — daemon là co-writer (đứng
  trên cùng lock, giữ CLI thật sự standalone; đổi lại nợ đồng-thời read-modify-write,
  backlog STR45) hay sole-writer-khi-bật — chưa chốt. Sub-choice chiều-ra: poll-qua-CLI
  (đơn giản, nghiêng cái này trước) vs tail-event-log (push tức thì nhưng khoá
  log-format).
- **Gate trước khi thực thi:** review in/out (backlog STR46) và kênh push (STR48) phải
  được cân độ ưu tiên so với nợ content đang chặn dogfood (discovery-context,
  worker-execution, feedback-loop) — quyết định *kiến trúc* này không tự nó nâng
  *độ ưu tiên thực thi*.
- Chất liệu tham chiếu (xưởng): `docs/distillery/deep-dives/herdr-vs-tmux-observation.md`
  (vì sao surface là client của cổng, không phải một runtime để adopt), và các entry
  interface của herdr (`socket-api-control-surface`, `self-describing-protocol-schema`,
  `session-snapshot-bootstrap-rpc`) làm mẫu thiết kế cửa.
