---
type: explanation
title: "0035 — Xác lập ranh giới sứ mệnh: fgOS phục vụ project khác/business workflow, không tự-phát-triển-chính-nó mặc định"
tags: []
timestamp: 2026-08-17T10:00:00.000Z
source_capture_ids: [tsk-4us]
date: 2026-08-17
status: accepted
supersedes: []
relates_specs: []
---

# 0035 — Xác lập ranh giới sứ mệnh: fgOS phục vụ project khác/business workflow, không tự-phát-triển-chính-nó mặc định

## Bối cảnh

fgOS được tạo ra để phục vụ hai vai trò ngoài chính nó: (1) làm nền tảng
phát triển các project khác, và (2) làm nền tảng vận hành các business
base workflow. Tự-phát-triển chính fgOS (mission #3) là một hoạt động
dogfood cần thiết trong lúc xây, không phải lý do fgOS tồn tại. Trong thực
tế vận hành, agent làm việc trong chính repo `forgentX` — nơi fgOS vừa là
công cụ vừa là sản phẩm đang được xây — liên tục rơi vào coi mission #3 là
trung tâm, vì đó là công việc trước mắt cụ thể nhất trong repo này. Bằng
chứng thật, không phải lý thuyết: fgOS đã cài global và đang vận hành thật
trên nhiều checkout khác ngoài `forgentX` (`mdview`, `herdr-gateway`,
`fgos-test-drive`, `forgent/repo`) — mission #1/#2 đã sống — trong khi
README's mission statement và `docs/distribution-vision.md`'s tự thừa
nhận đều chỉ là văn bản mô tả, chưa từng là luật always-loaded ép hành vi
agent.

Bằng chứng thiệt hại cụ thể của lẫn lộn này: `tsk-1js` — Iron Law's
`MODULE_RULES` (`src/evolve/iron-law.mjs`) tự mô tả là "self-modifying-
capable module list" nhưng hard-code chỉ nhận diện path của chính fgOS
(`src/runner/`, `bin/fgos.mjs`, ...) và bị áp UNIVERSAL cho mọi repo fgOS
vận hành — 4 ca thực nghiệm (Next.js/Python/Go/Rails) đều `required: false`
sai khi chạy trên host project, tức gate an toàn báo "đã kiểm" trong khi
không kiểm gì liên quan tới repo đó.

Upstream `beegog` (bee) từng đối mặt đúng ranh giới này và đã đúc kết
thành cơ chế: `evolving-loop-two-gates` (tự cải tiến chỉ chạy trong repo
bee, gate cơ học, không bao giờ auto/schedule), `grooming-project-first`
(tách "dọn nhà mình" khỏi "dọn nhà chủ", `.bee/`/`.claude/` không bao giờ
tính là nợ của project chủ), và `product_root`/repo-divorce (coordinator
đứng tách khỏi sản phẩm nested). fgOS/forgentX đã THỬ mô hình workshop+
repo-lồng tương tự trước đây (không phải chưa thử tới) và chủ động rút
lui vì gặp vấn đề thật trong thực tế — quyết định này không mở lại hướng
đó.

Quyết định chốt trong `docs/history/fgos-mission-boundary/DISCUSSION.md`
(5 vòng thảo luận, D1-D5, 2026-08-17) và `docs/history/
fgos-mission-boundary/CONTEXT.md`.

## Quyết định

**D1 — Trục riêng, đứng cạnh, không phải bậc #5.** Ranh giới mission
self-vs-host là một trục quyết định riêng, đứng CẠNH danh sách 4 bậc ưu
tiên sản phẩm `docs/decisions/0030` (Ship Faster > Release con người >
DoD > Polish Sau DoD) — không nối vào làm bậc thứ 5. `0030` trả lời "khi
hai giá trị xung đột, ưu tiên cái nào" (cùng một trục, khác mức độ). Câu
hỏi self-vs-host là phân loại đối tượng phục vụ TRƯỚC KHI bất kỳ ưu tiên
nào trong 4 bậc đó áp dụng được — khác trục, không khác mức. Ghép vào làm
bậc #5 sẽ khiến ranh giới này bị đọc nhầm là "yếu hơn cả Polish sau DoD",
theo đúng luật "bậc dưới không ghi đè bậc trên" của `0030` vốn không áp
cho một trục khác.

**D2 — Cơ chế: config khai báo một lần lúc setup, không hỏi per-decision.**
Ranh giới được nhận diện bằng một config key `mission` khai báo MỘT LẦN
lúc `fgos init`/`fgos setup` (đường chính deterministic), đăng ký qua
registry sẵn có của fgOS (`registerConfigDefault`/`registerCheck`,
`src/setup/registrations.mjs`) — đúng cửa `AGENTS.md`'s "Install/setup/
doctor gate" đã bắt buộc cho mọi config default mới. `fgos doctor` báo khi
chưa khai báo, không im lặng. Khi chưa khai báo, fgOS tự suy luận tối
thiểu (self-infer) — phương án TỆ NHẤT CHẤP NHẬN ĐƯỢC, không phải trung
tâm thiết kế; không đầu tư heuristic phức tạp cho tới khi có bằng chứng
dogfood thật cần tới (đúng tiền lệ STR82, declined cùng lý do). KHÔNG hỏi
ý định của từng quyết định (per-decision) — UX quá tệ. KHÔNG mechanize
`product_root`/repo-divorce kiểu bee cho forgentX — hướng đã thử và cố ý
từ bỏ.

**D5 — Tên key và value set.** Config key tên là `mission`, bộ values tối
giản 2 mức: `self-dev` | `host`. Mission #1 (phát triển project khác) và
#2 (vận hành business workflow) KHÔNG tách thành hai giá trị riêng — chưa
có consumer cơ học nào cần phân biệt, cả hai chỉ cần biết "host không
phải là chính fgOS".

**D3 — Ứng viên thi công đầu tiên.** `tsk-1js` là ứng viên thi công ĐẦU
TIÊN thật của cơ chế `mission`: Iron Law's `MODULE_RULES` đọc theo
`mission` — `self-dev` dùng 9 dòng hiện tại làm mặc định của fgOS, `host`
đọc danh sách module nhạy cảm riêng của chính project đó (rỗng mặc định,
không kế thừa list của fgOS). `tsk-1js` tự nó đã đề nghị hướng này trước
cả quyết định này (lúc shaping một item khác hẳn, `tsk-1y6`) — hội tụ độc
lập. Giữ KHÔNG gắn dependency giữa hai item — quan hệ là "informed by",
không phải "blocked by".

**D4 — Vị trí vật lý.** Quyết định này sống ở `docs/decisions/0035` (số
kế tiếp thật sau `0034`) + một đoạn trỏ mới trong `AGENTS.md` ngay sau
"Product priority order" — không thêm mục luật (L-law) mới vào
`docs/platform-foundations.md`. Nội dung đủ hẹp/cụ thể để nằm gọn trong
một decision + một đoạn AGENTS.md; thêm L-law riêng sẽ nhân đôi chỗ ghi,
vi phạm KISS.

## Hệ quả

- `AGENTS.md` nhận một đoạn mới ngay sau "## Product priority order
  (docs/decisions/0030)", trỏ vào record này — không sửa đoạn ưu tiên sản
  phẩm hiện có.
- `tsk-1js` (Iron Law `MODULE_RULES` per-project) trở thành ứng viên thi
  công tự nhiên của cơ chế `mission` khi được pick — record này chỉ nêu
  hướng, không thi công, không tạo dependency.
- Đăng ký config key `mission` (`registerConfigDefault`/`registerCheck`)
  và mọi consumer thật (bắt đầu từ Iron Law) không nằm trong phạm vi item
  đã sinh ra record này (`tsk-4us`, docs-only) — để lại cho item consumer
  thật (`tsk-1js` hoặc tương đương) khi được pick, tránh xây hạ tầng
  speculative không có ai đọc.
- Mọi agent làm việc trong `forgentX` từ nay đọc record này (qua pointer
  `AGENTS.md`) trước khi mặc định coi "sửa fgOS" là mục tiêu — mission
  #1/#2 mới là lý do fgOS tồn tại, #3 là dogfood có gate riêng.

## Tham chiếu

- `docs/decisions/0030-them-release-con-nguoi-vao-thu-tu-uu-tien-san-pham.md`
  — thang ưu tiên sản phẩm mà quyết định này đứng cạnh, không phải bên
  trong.
- `docs/history/fgos-mission-boundary/DISCUSSION.md` — toàn bộ thảo luận,
  §6 thiết kế tổng hợp, §7 task breakdown.
- `docs/history/fgos-mission-boundary/CONTEXT.md` — D1-D5 dạng locked
  decisions, bằng chứng scout đầy đủ.
- `tsk-1js` — Iron Law `MODULE_RULES` bug, ứng viên thi công đầu tiên
  (không phải dependency).
- `docs/distillery/sources/beegog.md` — nguồn upstream: `evolving-loop-
  two-gates`, `grooming-project-first`, `product-root-repo-divorce-topology`.
