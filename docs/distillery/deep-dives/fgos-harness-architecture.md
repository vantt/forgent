---
topic: fgos-harness-architecture
date: 2026-07-15
based_on: []
external_source: fgos-harness-audit@2026-07-14 (+progress 2026-07-15) — ~/projects/fgos/fgos-dev/plans/reports/harness-architecture-audit-260714-1848-layers-components-contracts-report.md
entries: [fgos-audit:add-through-not-alongside, fgos-audit:schema-per-artifact-boundary, fgos-audit:doctor-enforced-invariants, fgos-audit:fsm-single-status-writer, fgos-audit:provider-agnostic-core, verify-enforced-close, state-vs-log-two-physics]
source_note: >
  Nguồn KHÔNG phải một reference ngoài trong pipeline distill mà là bản
  audit kiến trúc NỘI BỘ của harness fgOS tiền nhiệm (~40k LOC Python + 57k
  Go), do owner cung cấp. Giá trị của nó với forgent là "nguồn hội tụ độc
  lập, falsified-by-data": một hệ thật, không có các kỷ luật forgent sinh ra
  đã có, ghi lại chính xác cái giá phải trả — và xác nhận thuốc chữa.
---

# Deep-dive: Kiến trúc harness fgOS — bài học cho forgent

**Bottom Line:** Audit harness fgOS tiền nhiệm chẩn đúng MỘT căn bệnh gốc — *"thêm cạnh
thay vì đi qua"* (mỗi hành vi mới được thêm SONG SONG code cũ thay vì đi XUYÊN QUA nó),
đẻ ra cặp song sinh ở mọi tầng: 2 dispatch stack, 2 bộ resolve model, 2 cây session, 2
luật claim, 3 catalog signal. Thuốc chữa đã được chứng minh hiệu quả trên chính hệ đó:
`services → store → schema` một-cửa-ghi + **bất biến do "doctor" ép máy móc** (signal bus
thành subsystem sạch nhất *vì* doctor SC5 khiến duplicate-writer "structurally
impossible"). **forgent sinh ra đã ở đích mà fgOS đang bò tới** — event-log-là-truth, một
cửa ghi (`store.mjs`), transition thuộc về FSM (`fsm.mjs`), view dẫn xuất. Vậy giá trị
của audit này KHÔNG phải để port feature, mà là **danh sách lan can cần dựng NGAY để
forgent không thoái hóa về đúng các failure-mode của fgOS khi nó lớn lên** — đặc biệt khi
multi-agent/parallel và runtime thứ hai (Rust/Go) tới, vì đó chính là nơi drift đa-ghi/
đa-ngôn-ngữ của fgOS sẽ tái sinh. Khuyến nghị #1: biến mỗi bất biến kiến trúc của forgent
thành một check máy-đọc trong verify gate (mở rộng `distill check` thành "doctor" của
forgent) — bất biến không được máy kiểm sẽ trôi.

## Câu hỏi

Một harness state-trên-filesystem, nhiều loại tiến trình ghi đồng thời, tiến hóa bằng
vibe-code — hỏng ở đâu, vì sao, và forgent (đang xây sạch trên state layer) phải dựng lan
can nào NGAY để không đi lại vết đó khi lớn lên (thêm worker song song, thêm runtime)?

## Cách nguồn giải quyết — audit fgOS ghi lại gì

### Bệnh gốc: "thêm cạnh thay vì đi qua" (evidence: audit §1, §5)

> "mỗi lần cần một hành vi, code mới được *thêm cạnh* code cũ thay vì *đi qua* code cũ —
> sinh ra cặp đôi song song ở mọi tầng: 2 dispatch stack, 2 bộ resolve model, 2 cây
> session, 2 luật claim, 2 bộ lock, 3 catalog signal, 3 danh sách router-owned."

- **Trade-off họ (vô tình) chấp nhận:** mỗi cạnh mới ship nhanh hơn (không phải hiểu đường
  cũ), đổi lấy N contract định nghĩa ≥2 lần mà không nguồn nào ép khớp. Bug trú chính ở
  các bản sao lệch: cùng task model khác nhau tùy cửa vào (§5); cùng signal 2 luật admission
  (P0-5); `events.jsonl` 2 schema → cost đọc ra 0 (P0-2).
- **Đo được, không phải lý thuyết:** 5 P0 là bug SỐNG có `file:line`; đều đã đóng Phase 0,
  mỗi cái kèm một doctor check ép (bảng §1). Đây là bằng chứng falsified-by-data.

### Thuốc chữa đã chứng minh: schema + single-write-path + doctor ép (evidence: §7.1, §3.2, §1)

- **Đường đúng:** `Entry (mỏng) → Use-case/services (không I/O) → Domain (FSM/schema thuần)
  → Infra/store (nơi DUY NHẤT đụng file) → State kernel (mỗi artifact 1 schema máy-đọc)`.
- **Cơ chế ép:** doctor check biến "quy ước con người" thành FAIL thấy được. Signal bus sạch
  *vì* SC5 khiến hai-writer là bất khả cấu trúc. Nguyên tắc họ rút ra: **"ADR chưa accepted
  khi doctor chưa check nó"** (§7.4) — mỗi bất biến mới phải có một check bảo kê hoặc nó trôi.
- **Mảnh còn thiếu (đòn bẩy lớn nhất):** contract máy-đọc cho tầng filesystem. "Không một
  artifact chia sẻ nào có schema máy-đọc làm nguồn duy nhất; tương thích Python↔Go duy trì
  bằng kỷ luật con người + doctor một phía" (§4.1) → đây là nơi drift đa-ngôn-ngữ sinh P0.

### Perspective hội tụ trong distillery (không chỉ một nguồn)

- `verify-enforced-close` (E3 — beehive cap-requires-proof ↔ harness story-complete-atomic):
  audit fgOS thêm nhánh thứ ba của cùng chân lý — "terminal ⇒ cc-slot đã release" phải là
  FAIL-on-leak, không WARN-reconcile (§7.4). Đóng-việc-có-bằng-chứng là bất biến, không lời hứa.
- `state-vs-log-two-physics`: audit xác nhận "state kernel trên filesystem" + rename(2)
  nguyên tử là quyết định đúng và nhất quán — cùng vật lý event-log-là-truth của forgent.

## So sánh & trade-offs — fgOS (khi lớn) vs forgent (hiện tại)

| Chiều | fgOS de-facto (audit) | forgent hiện tại | Bài học cho forgent |
|---|---|---|---|
| Cửa ghi state | ≥2 writer/artifact; `status` bị 5 writer đụng, engine bypass FSM (P0-1/P1-1) | Một `store.mjs`; `status` chỉ qua `transitionWork` (FSM) | Giữ bất biến này bằng CHECK, đừng bằng kỷ luật — fgOS cũng "định" một cửa nhưng engine vẫn lách |
| Contract artifact | Văn xuôi + docstring; schema tụt hậu ~10 field (§4.2) | Event có seq/ts/`v`; tiến hóa additive+lazy-key | Nâng lên **schema máy-đọc versioned tại cửa store** trước khi có reader thứ hai |
| Đa ngôn ngữ/runtime | Go mirror TAY → drift shape (P0-4/P1-4) | Chỉ Node/mjs (port Rust/Go đã hoãn) | NẾU port: struct SINH TỪ schema, mjs làm oracle, conformance fixtures (đúng decision đã ghi) |
| Bất biến kiến trúc | doctor 17 sections, hardcode 3-chỗ-sửa, một phía | `distill check` + verify gate | Biến verify gate thành "doctor" của forgent; mỗi luật = một check |
| Provider-ism | `CLAUDE_*`/`.claude/` rò vào core agent-agnostic (P1-8) | tier→model ở `.bee/config.json` (biên) | Giữ lõi state/runner sạch provider; mọi model-ism sống ở adapter/config |
| Tăng trưởng | god-scripts trộn CLI+use-case+domain+infra (P1-7) | module nhỏ, functional-core (decision) | Mỗi capability mới đi XUYÊN store/FSM, không đẻ path song song |

## Giải pháp tổng hợp cho forgent (output chính)

forgent không "port" gì từ fgOS — nó **thừa hưởng đích và dựng sẵn lan can** để không rơi
xuống các hố audit đã đo. Sáu lan can, theo đòn bẩy:

1. **verify gate = "doctor" của forgent (đòn bẩy lớn nhất, rẻ nhất).** Mỗi bất biến kiến
   trúc thành một check máy-đọc bổ vào chuỗi verify: (a) chỉ `transitionWork` được ghi
   `status`/edge — grep chặn mọi ghi `status` khác trong `store`/consumer; (b) một-cửa-ghi:
   không module nào ngoài `store.mjs` gọi `appendEvent`/ghi `.fgos/`; (c) một-writer-mỗi-field
   khi schema view lớn lên. Nguyên tắc fgOS: *bất biến chưa có check là bất biến sẽ trôi.*
   → chính là mảnh forgent đã có seam (`distill check`) nhưng chưa cắm luật kiến trúc vào.
2. **Schema máy-đọc versioned cho MỖI artifact chia sẻ, validate tại cửa store.** Event / view
   / cell / (sắp tới) gate ask-answer — mỗi loại một JSON Schema + envelope `v`, validate ở
   đúng cửa dispatcher/store. Làm TRƯỚC khi có reader thứ hai (runtime khác, viewer, agent
   ngoài). Đây trùng decision đã ghi của forgent — audit là bằng chứng ngoài mạnh nhất ỦNG HỘ
   nó (fgOS trả giá bằng P0-2/P0-4/P1-12 vì thiếu đúng thứ này).
3. **Doctrine "đi-xuyên, không thêm-cạnh" thành red-flag tường minh.** Mọi capability mới
   route qua `store`+`fsm` sẵn có; cấm đường ghi song song. Bằng chứng forgent đã sống đúng
   nó HÔM NAY: primitive `awaiting-human` tái dùng `moveWork` + cơ chế edge-validation của
   FSM (`reason`→`ask`/`answer`), fold vào lazy `gates` key — 0 event-path mới. Đặt tên
   doctrine + đưa vào red-flag list của AGENTS để nó không bị quên khi vội.
4. **Field-ownership: đúng một writer mỗi field.** Thảm họa `status`-bị-5-writer của fgOS là
   thứ single-store của forgent đã chặn; giữ nó khi thêm field (`outcomes`, `gates`,
   revision…) bằng một bảng owner + check. Fold ở replay là single choke-point — giữ vậy.
5. **Lõi provider-agnostic.** state/runner không được biết Claude/model cụ thể; tier→model +
   advisor ở `.bee/config.json`. (Bài học swarm hôm nay củng cố: nhầm slot model = tier sai —
   một dạng provider-ism rò vào orchestration; giữ mapping ở config, dispatch đọc từ đó.)
6. **Mô hình tầng đặt-tên-chung (khi viết ADR/spec nền).** Adapter → Entry (mỏng) → Use-case
   (không I/O) → Domain (thuần) → Infra/store (nơi duy nhất đụng file) → State kernel (1
   schema/artifact). Dùng đúng bộ tên này trong `platform-foundations.md` để mọi area sau
   neo vào cùng bản đồ — fgOS chết vì "tầng đông code nhất không có bản đồ" (§2.1).

**Không lấy gì từ fgOS:** toàn bộ nợ tích lũy (god-scripts, 2 dispatch stack, 2 cây session)
— đó chính là thứ forgent tránh được bằng cách xây sạch. forgent bắt đầu ở nơi fgOS đang cố bò tới.

## Portable ideas (→ candidate rows trong porting-log, human triage)

- **schema-per-artifact-boundary** `R3 E3 F2` — schema máy-đọc versioned mỗi artifact, validate
  tại cửa store, trước reader thứ hai. E3: audit falsified-by-data + trùng decision forgent (hội tụ).
- **doctor-invariant-in-verify** `R3 E3 F1` — mỗi bất biến kiến trúc = một check trong verify gate;
  "ADR chưa accepted khi doctor chưa check". E3: doctor fgOS + `distill check`/cap-proof của beehive.
- **add-through-not-alongside** `R3 E2 F1` — doctrine + red-flag: capability mới đi xuyên store/FSM,
  cấm path song song. E2: một nguồn mạnh + forgent đã dogfood (awaiting-human).
- **fsm-single-status-writer** `R2 E3 F1` — một-writer-mỗi-field, `status`/edge chỉ qua FSM, ép bằng grep-check.
  E3: thảm họa 5-writer của fgOS falsified-by-data.

## Open questions

- forgent nên có một verb "doctor" riêng (kiểu `fgos doctor`) gom các invariant-check, hay
  cắm thẳng vào chuỗi verify hiện có? (fgOS tách `doctor.py` 17 sections; forgent nhỏ hơn —
  có thể chỉ cần các check rải trong verify tới khi đủ nhiều mới gom.)
- Khi nào là "reader thứ hai" đầu tiên buộc phải có schema versioned — viewer, agent ngoài
  qua routing-handoff-contract, hay port runtime? Ngưỡng này quyết định độ ưu tiên của #2.
- Có nên đưa fgOS audit thành một `paper` source được track (cursor cố định) để so sánh
  trong matrix, hay giữ một-lần ở deep-dive này là đủ? (owner quyết ở triage.)
