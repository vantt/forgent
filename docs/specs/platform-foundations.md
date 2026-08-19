---
area: platform-foundations
updated: 2026-07-14
sources: [phase-0-compound-learning-stack]
decisions: [ca7de3cf, ae461c8b, ed953e09, 14ebeea9]
coverage: full
---

# Spec: Platform Foundations (luật nền)

Vùng doctrine của forgent: 8 luật thiết kế đã khóa, đứng trên mọi code của compound stack (state/FSM → routing → compound-learning). Người dùng: product owner (khóa và supersede luật) và mọi agent/reviewer thiết kế hay thẩm định artifact của forgent. Văn bản gốc đầy đủ (phát biểu, nguồn bằng chứng, hệ quả, ngưỡng xem lại): xem Pointers.

## Entry Points & Triggers

- Trước khi thiết kế bất kỳ artifact bền, store, hay interface mới → đọc luật nền; thiết kế phải khai các phân loại bắt buộc (RUL1 (Log hay State ngay lúc thiết kế), RUL8 (mọi artifact khai mức bền tường minh), RUL4 (mỗi interface chọn theo audience)).
- Mở đầu mọi review thiết kế tầng state → câu hỏi "log hay state?" (RUL1 (Log hay State ngay lúc thiết kế)).
- Ngưỡng xem lại có tên của một luật bị chạm → mở lại luật đó qua thao tác "sửa luật" bên dưới.
- Nghiệm thu mỗi phase của compound stack → hỏi lại sáu câu hỏi (RUL6 (agent lạ trả lời được sáu câu hỏi)).

## Data Dictionary

| # | Element | Meaning | Values |
|---|---------|---------|--------|
| 1 | Physics của artifact | Phân loại bắt buộc lúc thiết kế cho mọi dữ liệu bền | `log` — append-only, tổ chức theo feature/phiên, trả lời "làm sao tới đây", không bao giờ overwrite · `state` — overwrite theo reality, tổ chức theo area, trả lời "đang ở đâu" |
| 2 | Tầng memory | Tầng mà một cơ chế nhớ thuộc về | `lower` — cơ học/raw/chính xác, chỉ dùng hai-physics, không TTL, không tự quên · `higher` — nơi agent học pattern: 4 loại memory (working/episodic/semantic/procedural) + consolidation, human-gated |
| 3 | Mức bền (5 cấp, nhãn chính thức tại `docs/platform-foundations.md` §L7) | Mức durability mọi artifact phải khai | đề xuất chờ duyệt · truth vĩnh viễn được commit · bằng chứng phiên, nén được · dựng lại được từ truth vĩnh viễn · chỉ tồn tại máy này |
| 4 | Bậc trưởng thành (F0–F5) | Thang đo tiến hóa của platform, mỗi bậc có tiêu chí kiểm chứng | `F0` bare · `F1` lawful (luật thành văn, 6 câu trả lời bằng tay) · `F2` stateful (6 câu trả lời từ state) · `F3` routed (agent lạ tự tìm việc kế tiếp) · `F4` compounding (vòng predicted→actual chạy) · `F5` self-improving (học từ vận hành, human-gated) |
| 5 | Ngưỡng xem lại | Điều kiện có tên mà khi chạm, luật phải được mở lại — luật không có ngưỡng là luật phân loại/acceptance, chỉ có thể thêm | điều kiện mô tả tường minh trong văn bản luật |
| 6 | Changeset | Bản ghi thao tác ngữ nghĩa append-only, ghi cùng transaction với mutation, được commit — là truth mà mọi database view dựng lại từ đó | — |

## Behaviors & Operations

### Sửa/mở lại một luật

- **Blocked when:** không có bằng chứng mới và không ngưỡng xem lại nào bị chạm — audit chỉ nêu lo ngại trừu tượng thì không mở luật.
- **What changes:** quyết định gốc bị supersede bằng quyết định mới có D-ID; văn bản luật cập nhật trỏ D-ID mới. Không bao giờ sửa tại chỗ không dấu vết.
- **Side effects:** thiết kế và spec đang dựa trên luật đó được rà lại.
- **Afterwards:** người đọc chỉ thấy luật hiện hành; lịch sử nằm trong decision log.

### Khai phân loại khi thiết kế artifact mới

- **Runs when:** bất kỳ artifact bền, store, hay interface mới nào được thiết kế.
- **Blocked when:** artifact không khai được physics (RUL1 (Log hay State ngay lúc thiết kế)), mức bền (RUL8 (mọi artifact khai mức bền tường minh)), hoặc — với interface — audience (RUL4 (mỗi interface chọn theo audience)): thiết kế đó là lỗi bị trả lại, không phải chi tiết để sau.
- **What changes:** bản thiết kế mang các khai báo; reviewer thẩm định theo đúng các khai báo đó.
- **Afterwards:** artifact vào đời với phân loại tra cứu được; file lai (vừa append vừa sửa) phải tách đôi.

### Tuyên bố bậc trưởng thành

- **Runs when:** một bậc F0–F5 được cho là đạt.
- **Blocked when:** không có bằng chứng chạy thật (output benchmark/check) — "không tự phán".
- **Afterwards:** bậc được ghi nhận kèm bằng chứng; roadmap đo bằng thang này, không bằng cảm giác.

## Actors & Access

| Capability | Product owner | Agent | Reviewer |
|---|---|---|---|
| Khóa / supersede luật | ✓ | — | — |
| Đọc và tuân thủ luật | ✓ | ✓ | ✓ |
| Trích luật theo ID (L1–L8) khi thẩm định | — | ✓ | ✓ |
| Tuyên bố bậc F-ladder (kèm bằng chứng) | ✓ (chốt) | đề xuất | đề xuất |

## Business Rules

- **RUL1 (Log hay State ngay lúc thiết kế).** Mọi mẩu dữ liệu bền khai là Log hoặc State ngay lúc thiết kế; không khai được là lỗi thiết kế (L1, per ca7de3cf).
- **RUL2 (memory hai tầng — lower hai-physics, higher 4-loại + consolidation).** Memory chạy đồng thời hai tầng: lower chỉ dùng hai-physics; higher dùng 4 loại memory + consolidation human-gated — hai mô hình không phủ định nhau (L2, per ca7de3cf).
- **RUL3 (truth = changeset append-only committed; database là view).** Truth của mọi database tương lai là changeset append-only được commit; database là view dựng lại được từ zero; graph store là view cấp 2 không bao giờ ghi ngược; mọi ghi qua MỘT cửa (L3, per ae461c8b).
- **RUL4 (không routing toàn cục — mỗi interface chọn theo audience).** Không có mô hình routing toàn cục — mỗi interface chọn theo audience: prose-handoff cho agent↔agent trong chain; kỷ luật data (branch theo exit-code, decision-table, rediscover trước retry) cho consumer không-chắc-là-agent (L4, per 14ebeea9).
- **RUL5 (việc kế tiếp luôn là truy vấn dẫn xuất từ state).** Việc kế tiếp luôn là truy vấn dẫn xuất từ state, không bao giờ là danh sách tay (L4, per 14ebeea9).
- **RUL6 (agent lạ trả lời được sáu câu hỏi).** Platform "có harness" chỉ khi agent lạ không chat history trả lời được sáu câu: đọc gì trước / việc loại gì / chạm contract nào / rủi ro bao nhiêu / proof gì thì xong / bài học nào để lại — mọi phase nghiệm thu bằng sáu câu này (L5).
- **RUL7 (tiến hóa đo bằng thang F0–F5, cần bằng chứng chạy thật).** Tiến hóa đo bằng thang F0–F5; mỗi bậc chỉ tuyên bố khi có bằng chứng chạy thật (L6).
- **RUL8 (chạy xong ≠ merge ≠ bền — mọi artifact khai mức bền tường minh).** "Chạy xong ≠ đã merge ≠ đã bền" — mọi artifact khai mức bền tường minh theo 5 cấp của `docs/platform-foundations.md` §L7 (L7).
- **RUL9 (doctrine nạp-mọi-turn: placement test, transport mệnh lệnh, anchor phrase).** Tầng doctrine nạp-mọi-turn tuân ba quy tắc: placement test một câu; transport đi kèm mệnh lệnh; mỗi rule có anchor phrase được check tự động assert (L8).
- **RUL10 (trend-history + reconsideration bookkeeping lưu policy-side, git-tracked).** Trend-history và reconsideration bookkeeping lưu policy-side, git-tracked (per ed953e09).
- **RUL11 (tùm lum không phải nặng).** Việc trở nặng không vì bản chất nó lớn mà vì thiếu và quên — tên đúng của tình trạng đó là tùm lum, không phải nặng; thấy tùm lum thì gom lại, gom tới khi hết, quy mô không bao giờ là lý do miễn trừ, đích là ranh giới rõ và contract tường minh (ADR0036 (khoá RUL11 theo đúng phát biểu gốc của người dùng, cấm diễn giải lại)).

## Edge Cases Settled

- Ngưỡng xem lại của RUL3 (truth = changeset append-only committed; database là view) đã có tên và bằng chứng thật: khi multi-agent write trở thành tải chính, luật được mở lại với beads (đã pivot sang db-as-truth ở đúng điều kiện đó) làm case study — không vá tại chỗ (ghi nhận 2026-07-14).
- Higher layer không bao giờ thành hình → tầng 4-memory-type của RUL2 (memory hai tầng — lower hai-physics, higher 4-loại + consolidation) tự rơi, không để lại nợ.
- Luật phân loại (RUL1 (Log hay State ngay lúc thiết kế)) và acceptance test (RUL6 (agent lạ trả lời được sáu câu hỏi)) không có ngưỡng xem lại — RUL6 (agent lạ trả lời được sáu câu hỏi) chỉ có thể THÊM câu hỏi.

## Open Gaps

(none)

## Visuals

Not applicable — không có màn hình.

## Pointers (implementation)

- `docs/platform-foundations.md` — văn bản gốc đầy đủ của 8 luật (phát biểu + nguồn `nguồn:slug` + hệ quả + ngưỡng xem lại)
- `.bee/decisions.jsonl` — decision log mang các D-ID trích ở trên (đọc qua `node .bee/bin/bee_decisions.mjs`)
- `plans/reports/distill-consult-260713-2323-compound-learning-stack-report.md` — chất liệu consult gốc
- `docs/distillery/deep-dives/` — deep-dives state / compound-engineering / routing

## Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)

Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4) -- corpus đó đã retired, `state.decisions` (qua `fgos decision --scope`) giữ record ngắn làm nguồn thật, phần narrative đầy đủ sống ở đây. Thứ tự theo số ADR gốc.


### 0001 — Nhật ký sự kiện là sự thật; store/DB là bản chiếu dựng lại được

#### Bối cảnh

forgent cần bộ nhớ bền cho nhiều loại dữ liệu (trước hết là work-state của chính
nó, sau này các vùng khác). Cám dỗ mặc định là đặt một cơ sở dữ liệu làm *nơi chứa
sự thật*. Nhưng nơi-chứa-sự-thật là DB thì: khó dựng lại từ số không, khó audit,
khó time-travel, và khoá dự án vào một engine cụ thể ngay từ đầu — trong khi tải
thật (multi-writer, quy mô) chưa được chứng minh.

#### Quyết định

Mọi mẩu dữ liệu bền của forgent được **khai ngay lúc thiết kế** là một trong hai
vật lý:

1. **Sự thật (log).** Nhật ký sự kiện *append-only*, dạng JSONL, **committed vào
   git**. Chỉ được thêm, không sửa/xoá điểm quá khứ.
2. **Bản chiếu (view).** Trạng thái hiện hành dựng lại được từ replay toàn bộ log.
   View **không bao giờ ghi ngược** vào sự thật.

Hệ quả trực tiếp của luật này:

- DB chỉ được phép xuất hiện khi đóng vai **materialized view**; graph store (nếu
  có) là view cấp hai. **Rebuild-from-zero luôn phải khả thi** từ log.
- Engine nặng (ví dụ SQLite) được **defer tới ngưỡng friction có bằng chứng** —
  không thêm sớm theo phỏng đoán.
- Ngưỡng xem lại **có tên**: khi multi-writer trở thành tải chính (mẫu "DB-as-truth"
  cho ghi đồng thời). Chạm ngưỡng mới mở lại luật; trước đó luật bất biến.

#### Hệ quả

- **Audit & time-travel miễn phí:** trạng thái bất kỳ dựng lại được bằng replay.
- **Đổi engine không mất sự thật:** view là thứ thay được, log thì không.
- **Đơn giản hoá ghi:** một cửa ghi, một hướng chảy (log → view).
- **Chi phí chấp nhận:** replay tốn dần khi log lớn — chịu được tới ngưỡng đã đặt
  tên ở trên; qua ngưỡng thì xét engine, không phá luật.

Đổi luật này = supersede record bằng record mới, không sửa tại chỗ.

### 0009 — Chống giao thoa tiến trình lúc cài

#### Bối cảnh

Tách sạch *artifacts* (file, thư mục, release) giữa forgent và các bộ công cụ khác
là **chưa đủ**. Khi fgOS có install story và được cài vào một project hoặc global
**cạnh một harness khác**, hai bên có thể **giao thoa ở tầng tiến trình**: chặn nhầm
thao tác ghi của nhau, hoặc khiến một agent nhận **mệnh lệnh điều phối mâu thuẫn**
từ hai nguồn.

> Ghi chú viết lại: quyết định gốc phát biểu trong bối cảnh tách kho phát triển ↔
> sản phẩm của chính dự án. Ở đây là **yêu cầu thiết kế platform thuần của fgOS**,
> không phụ thuộc tên harness cụ thể nào.

#### Quyết định

fgOS, **khi có install story**, phải được thiết kế để **không giao thoa tiến trình**
với harness khác cùng máy. Bốn nguyên tắc:

1. **Doctrine scope theo lãnh địa:** luật/hành vi của fgOS chỉ áp trong phạm vi
   đường dẫn của chính nó.
2. **Hook gate theo path của mình:** cổng chặn chỉ kích hoạt trên path fgOS, không
   quơ lên path của harness khác.
3. **Một-nhạc-trưởng-mỗi-phiên:** trong một phiên, chỉ một bên điều phối — không hai
   nguồn cùng ra lệnh cho một agent.
4. **Phát hiện marker harness khác lúc cài:** khi cài, nhận diện dấu hiệu của harness
   khác đã có mặt và ứng xử nhường-nhịn thay vì đè lên.

#### Hệ quả

- **Đây là non-functional requirement mở, CHƯA thực thi** — ghi lại để install
  design tương lai không bỏ sót. Việc thực thi nằm ở backlog **STR10**.
- **Tiêu chí kiểm** khi làm: một canary chạy trong project cài **cả hai** harness —
  hai bên không chặn nhầm write của nhau, agent không nhận mệnh lệnh điều phối mâu
  thuẫn.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

### 0014 — Kiến trúc giao tiếp người ↔ fgOS

Quyết định ở **mức interface** (hình dạng cửa giao tiếp), không phải mức
implementation. Chốt qua thảo luận mở với người dùng 2026-07-18.

#### Bối cảnh

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

#### Quyết định

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

#### Hệ quả

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

### 0035 — Xác lập ranh giới sứ mệnh: fgOS phục vụ project khác/business workflow, không tự-phát-triển-chính-nó mặc định

#### Bối cảnh

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
(5 vòng thảo luận, 2026-08-17) và `docs/history/
fgos-mission-boundary/CONTEXT.md`.

#### Quyết định

**Trục riêng, đứng cạnh, không phải bậc #5.** Ranh giới mission
self-vs-host là một trục quyết định riêng, đứng CẠNH danh sách 4 bậc ưu
tiên sản phẩm D-ADR0030 (thang 4 bậc Ship Faster/Release con người/DoD/Polish Sau DoD, docs/specs/runner.md)
— không nối vào làm bậc thứ 5. Thang đó trả lời "khi
hai giá trị xung đột, ưu tiên cái nào" (cùng một trục, khác mức độ). Câu
hỏi self-vs-host là phân loại đối tượng phục vụ TRƯỚC KHI bất kỳ ưu tiên
nào trong 4 bậc đó áp dụng được — khác trục, không khác mức. Ghép vào làm
bậc #5 sẽ khiến ranh giới này bị đọc nhầm là "yếu hơn cả Polish sau DoD",
theo đúng luật "bậc dưới không ghi đè bậc trên" của thang ưu tiên đó vốn không áp
cho một trục khác.

**Cơ chế: config khai báo một lần lúc setup, không hỏi per-decision.**
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

**Ứng viên thi công đầu tiên.** `tsk-1js` là ứng viên thi công ĐẦU
TIÊN thật của cơ chế `mission`: Iron Law's `MODULE_RULES` đọc theo
`mission` — `self-dev` dùng 9 dòng hiện tại làm mặc định của fgOS, `host`
đọc danh sách module nhạy cảm riêng của chính project đó (rỗng mặc định,
không kế thừa list của fgOS). `tsk-1js` tự nó đã đề nghị hướng này trước
cả quyết định này (lúc shaping một item khác hẳn, `tsk-1y6`) — hội tụ độc
lập. Giữ KHÔNG gắn dependency giữa hai item — quan hệ là "informed by",
không phải "blocked by".

**Tên key và value set.** Config key tên là `mission`, bộ values tối
giản 2 mức: `self-dev` | `host`. Mission #1 (phát triển project khác) và
#2 (vận hành business workflow) KHÔNG tách thành hai giá trị riêng — chưa
có consumer cơ học nào cần phân biệt, cả hai chỉ cần biết "host không
phải là chính fgOS".

**Vị trí vật lý (sửa lại theo quy ước retire corpus của tsk-1lv-4).** Quyết định này ban đầu định vị sống
ở `docs/decisions/0035` — nhưng corpus `docs/decisions/000N-*.md` đã
retired trọn bộ (`tsk-1lv-4`) trước khi record này được thi công thật; áp
dụng đúng quy ước tsk-1lv-4 đã đặt cho 34 record trước: narrative đầy đủ
sống ở đây (`docs/specs/platform-foundations.md`), `state.decisions` (qua
`fgos decision --scope`) giữ record ngắn làm nguồn thật, `docs/decisions/
index.md` (generated) trỏ vào. Không thêm mục luật (L-law) mới vào phần
"L1-L8" của tài liệu này — nội dung đủ hẹp/cụ thể để nằm gọn trong một
mục "Lịch sử quyết định" như mọi record khác ở đây; thêm L-law riêng sẽ
nhân đôi chỗ ghi, vi phạm KISS.

#### Hệ quả

- `AGENTS.md` nhận một đoạn mới ngay sau "## Product priority order",
  trỏ vào record này — không sửa đoạn ưu tiên sản phẩm hiện có.
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

#### Tham chiếu

- D-ADR0030 (`docs/specs/runner.md`) — thang ưu tiên sản phẩm mà quyết
  định này đứng cạnh, không phải bên trong.
- `docs/history/fgos-mission-boundary/DISCUSSION.md` — toàn bộ thảo luận,
  §6 thiết kế tổng hợp, §7 task breakdown.
- `docs/history/fgos-mission-boundary/CONTEXT.md` — locked decisions,
  bằng chứng scout đầy đủ.
- `tsk-1js` — Iron Law `MODULE_RULES` bug, ứng viên thi công đầu tiên
  (không phải dependency).
- `docs/distillery/sources/beegog.md` — nguồn upstream: `evolving-loop-
  two-gates`, `grooming-project-first`, `product-root-repo-divorce-topology`.

### 0036 — Khoá RUL11 (tùm lum không phải nặng): "tùm lum", không phải "nặng"

#### Bối cảnh

Phát biểu gốc của người dùng (2026-08-18, giữ nguyên văn làm nguồn — luật
ở Business Rules là bản chưng, đoạn này là nguồn thật):

> "anh vịn vay em nói nè, em đừng ngại heavy, ở đây không có gì nặng nếu
> có em, chỉ là mọi việc tự nhiên trở nặng nếu em quên này quên kia,
> thiếu này thiếu nọ, nên không phải nó nặng mà nó tùm lum, cái gì mà em
> thấy nó tùm lum là phải làm cho đơn giản lại lại, gom lại, gom lại, có
> em thì gom hết 1000 files em cũng làm được. mục đích của chúng ta luôn
> hướng tói hình dạng cuối cùng là clear boundary, contract rõ ràng, thay
> đổi được và biến hình dễ, không chấp vá."

Bằng chứng đắt bằng tiền thật ngay trong phiên sinh ra quyết định này:
`tsk-2uf-1` bản đầu được thiết kế là "thêm cờ `--work` vào
`executeExecutorCli`" — tức thêm cửa thứ mười một vào một đống mười cửa
rời rạc, tự trấn an bằng chữ "additive". Đo lại thì `src/runner/
dispatch.mjs` là 2204 dòng chứa sáu concern tách bạch được mà không có
ranh giới nào giữa chúng, riêng phần config + 7 hàm `validate*Shape` đã
chiếm 794 dòng (36%). Không có luật thì phiên sau lại "additive" tiếp, và
mỗi lần additive là một lần tùm lum thêm.

Bằng chứng thứ hai, độc lập: `bin/fgos.mjs` 4201 dòng — CLAUDE.md của
chính repo đã ghi nhận GitNexus không index nổi file này (tsk-38h: zero
indexed `Function` symbols ngay sau một lần reindex sạch). Sự tùm lum đã
đủ nặng để làm hỏng chính công cụ đọc-hiểu code của dự án.

#### Quyết định

Khoá thành RUL11 (`docs/specs/platform-foundations.md`'s Business Rules):
việc trở nặng không vì bản chất nó lớn mà vì thiếu và quên — tên đúng của
tình trạng đó là tùm lum, không phải nặng; thấy tùm lum thì gom lại, gom
tới khi hết, quy mô không bao giờ là lý do miễn trừ; đích của mọi lần gom
là một hình dạng duy nhất: ranh giới rõ, contract tường minh, đổi và biến
hình dễ, không chắp vá.

Đây là luật chứ không phải ghi chú, theo đúng RUL9 (doctrine nạp-mọi-turn: placement test, transport mệnh lệnh, anchor phrase)'s ba quy tắc tầng
doctrine nạp-mọi-turn: placement test một câu ("có cần đúng cả khi không
có workflow nào đang chạy?" — có, đây là triết lý làm việc, không phải
thủ tục theo workflow); transport đi kèm mệnh lệnh (anchor phrase mang cả
câu lệnh, không chỉ trỏ nguồn); anchor phrase được check tự động assert
(`test/docs/rul11-anchor-phrase.test.mjs`, item mở đường vì RUL1 (Log hay State ngay lúc thiết kế)-RUL10 (trend-history + reconsideration bookkeeping lưu policy-side, git-tracked)
hiện chưa có test loại này — không để mâu thuẫn im lặng với RUL9 (doctrine nạp-mọi-turn: placement test, transport mệnh lệnh, anchor phrase)).

Anchor phrase (giữ nguyên trên một dòng không xuống hàng, để search theo
dòng khớp được), đặt tại `AGENTS.md`:

```
khong phai no nang ma no tum lum
```

Đây là THÊM một luật, không sửa luật đã khoá — RUL1 (Log hay State ngay lúc thiết kế) tới RUL10 (trend-history + reconsideration bookkeeping lưu policy-side, git-tracked) không đổi.

#### Hệ quả

- `docs/specs/platform-foundations.md`'s Business Rules nhận RUL11 (tùm lum không phải nặng)
  làm một dòng luật mới (khoá dạng `**RULn.**`), ngay sau RUL10 (trend-history + reconsideration bookkeeping lưu policy-side, git-tracked).
- `AGENTS.md` nhận một đoạn mới gần "## Changing a locked law", mang
  anchor phrase verbatim trên một dòng.
- `test/docs/rul11-anchor-phrase.test.mjs` (mới) assert cả hai vị trí trên
  chứa anchor phrase, và RUL11 (tùm lum không phải nặng) tồn tại đúng khuôn `**RULn.**` — item đầu
  tiên mở pattern anchor-phrase-assertion cho RULn, RUL1 (Log hay State ngay lúc thiết kế) tới RUL10 (trend-history + reconsideration bookkeeping lưu policy-side, git-tracked) chưa được
  bọc lại (không phải phạm vi item này).
- Chứng cứ dẫn tới luật này (`tsk-2uf-1`/dispatch.mjs, `tsk-38h`/
  bin/fgos.mjs) là bằng chứng đã có sẵn, không phải việc gom thật mới —
  việc gom thật là phạm vi `tsk-2uf-1` và các item khảo sát mảng còn lại,
  không phải item này.

#### Tham chiếu

- `tsk-7u7` — item sinh ra quyết định này.
- `tsk-2uf-1` — bằng chứng thứ nhất (dispatch.mjs, 2204 dòng/6 concern).
- `tsk-38h` — bằng chứng thứ hai (bin/fgos.mjs, GitNexus zero-index).
- RUL9 (doctrine nạp-mọi-turn: placement test, transport mệnh lệnh, anchor phrase; `docs/specs/platform-foundations.md`) — ba quy tắc tầng doctrine
  mà RUL11 (tùm lum không phải nặng) phải tuân để "dính" thay vì chỉ là khẩu hiệu.
