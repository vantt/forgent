---
area: seat-binding
updated: 2026-10-20
status: draft — chờ owner đọc và cho taste; chưa có code nào đổi theo bản này
sources: [research-261020-0955-seat-binding-needs-and-mechanisms-inventory, discussion-261020-0947-model-tier-by-capability-and-seat, problem-261017-0022-model-tier-selection-misfit, model-pool-b1-fallback-and-account-order]
---

# Spec nháp: Seat Binding — ai ngồi ghế nào, ở tier nào, vì luật nào

Nguồn sự thật đầu vào: [bản kiểm kê](research-261020-0955-seat-binding-needs-and-mechanisms-inventory.md) (N = nhu cầu, D = khó khăn, K = núm, O = chồng chéo; mọi số hiệu dưới đây trỏ về đó). Hướng của owner 2026-10-20 09:44–10:05: gom mọi chuyện chọn ghế vào một tài liệu và **một component có authority và ranh giới riêng**, đạt ba mục tiêu kép.

## 1. Ba mục tiêu (owner, 2026-10-20 09:54)

1. **Linh hoạt:** nhu cầu nào cũng cấu hình được, kể cả taste theo từng ghế (red-team chạy xai) và theo từng capability.
2. **Rõ ràng:** cấu hình xong phát biểu được, và máy in ra được, đúng một câu cho mỗi ghế: *ghế X của capability Y chạy họ F, model M, tier T, account A — họ lấy từ luật …, tier từ luật …, trần từ luật …*.
3. **Config đơn giản:** mỗi sự thật khai một lần, mặc định suy ra được, người khai chỉ viết chỗ khác mặc định.

Nguyên tắc chọn model của owner (2026-10-20 09:50, memory `feedback_model_tier_by_nature_of_work`): việc đơn giản đã có kế hoạch và hướng dẫn chi tiết → model rẻ đúng trình độ; việc cần suy nghĩ phức tạp, góc nhìn riêng, thiết kế đặc biệt → họ cao cấp.

## 2. Vì sao hôm nay rối (ba gốc rễ)

| Gốc | Biểu hiện | Số hiệu |
|---|---|---|
| **G1. Rigor gánh ba việc** | Một giá trị `rigor` quyết cùng lúc tier (`rigorToTier`), số ghế checker (`checkersByRigor`) và độ chặt khác họ (distinct families ở high/critical). Muốn hội đồng mạnh thì phải chịu thêm checker; muốn rẻ thì không được chặt. Checker đọc rigor của unit, tier đọc rigor mạnh hơn của unit/capability. Tier `advanced` không rigor nào trỏ tới. | O3, O4, O16, N34, N37, D30, D32 |
| **G2. Không có cấp "ghế" trong config** | Pool của capability là pool của **mọi** ghế trong unit, kể cả checker. Taste theo ghế chỉ làm được bằng đảo `prefer` cả capability (D24) hoặc `--override` từng lượt; preset cấm khai executor/tier (G2 của workflow). | N3, N5, O1, O11, O13, D24, D28 |
| **G3. Một quyết định nhiều nơi tính** | Tier tính ở 6 chỗ, chỉ `bind` áp trần; model ở 3 chỗ; 2 walker; cổng ghi và doctor tính lại thiếu đầu vào; `explain` chỉ thấy một ghế producer. | N17, O7, O9, O17, D3, D16, D17, D31 |

Thêm: từ vựng chéo nhau (`prefer` theo executor, `tierFallback` theo họ, `--provider` theo executor, "provider" bốn nghĩa — O2), ~25 capability lặp cùng một danh sách 5 họ (O14), `maxTier` không được validate và nằm ngoài hash config (O19).

## 3. Component Seat Binding

### 3.0 Ba khái niệm, model là kết quả (owner 2026-10-20 12:20)

| Khái niệm | Là gì | Trả lời câu | Ví dụ | Ai khai |
|---|---|---|---|---|
| **Seat (ghế)** | một chỗ ngồi trong một nhóm (unit) | ngồi ở đâu, trong nhóm nào | `panelist-3` của `shape-proposals`; `red-team` của `critique-proposals` | pattern sinh ra khi chạy unit |
| **Role (vai)** | nhiệm vụ của ghế, chung toàn hệ thống | làm gì | `producer`, `panelist-N`, `synthesizer`, `reviewer`, `red-team` (đổi tên theo preset: `advisor`, `researcher`) | pattern, kèm câu giao việc chuẩn |
| **Persona** (tuỳ chọn) | góc nhìn hoặc chuyên môn mang vào ghế | nhìn bằng con mắt nào | `advisor`; lens "CONSTRAINT LENS"; `@council-assumptions` | preset workflow, hoặc `--seats` lúc chạy |

Một ghế có đúng một role; một role ngồi ở nhiều ghế, nhiều nhóm. Một ghế có tối đa một persona (gắn theo ghế, không theo role; có thể bị khoá). **Model** (họ, tier, account) không phải lớp thứ tư mà là lựa chọn cho tổ hợp (ghế, role, persona) trong khuôn capability của nhóm; Seat Binding là nơi tính lựa chọn đó. Role và persona vẫn do Workflow quyết.


#### 3.0.1 Role gốc và hai chỗ dọn (owner 12:33)

- Role do pattern sinh, mang hành vi mặc định (vị trí trong pattern, câu giao việc chuẩn, quyền ghi hay chỉ đọc, luật khác họ). Persona và ghế mở rộng không giới hạn theo domain, framework, use case.
- **Bỏ role `panelist`:** "panel" là hình dạng nhóm (nhiều người), không phải vai. Thành viên panel làm đúng việc của `producer`, chỉ là nhiều người song song. Panel = N ghế role `producer` + một ghế `synthesizer`. Role gốc còn **4**: `producer`, `synthesizer`, `reviewer`, `red-team`.
- **Tên role cố định:** preset không đổi tên role (`advisor` của `consult`, `researcher` của `research-fan-out` chuyển thành persona).
- **Ghế tách khỏi role:** ghế có tên riêng trong unit (`s1`, `system-lens`…), role và persona là thuộc tính của ghế. Khai tường minh trong workflow, ví dụ:

```yaml
- id: shape-proposals
  template:
    capability: architecture:shape
    pattern: panel
    seats:
      - { seat: system,      role: producer,    persona: system-lens }
      - { seat: alternative, role: producer,    persona: alternative-lens }
      - { seat: constraint,  role: producer,    persona: constraint-lens }
      - { seat: synthesis,   role: synthesizer }
```

  Runner config chọn model theo `roles.<role>`, `personas.<persona>` (nếu owner chọn câu 7) và `capabilities.<cap>.seats.<seat>`.
- **Role mới chỉ đến cùng pattern mới.** Ứng viên duy nhất thấy được: pattern `debate` (hai bên biện hộ + `judge` chọn một, khác `synthesizer` là gộp) cho Dialectical Inquiry đúng bài bản. Six Hats, Delphi, nominal group không cần role mới (mũ, chuyên gia, người bỏ phiếu là persona; vòng là bước workflow; điều phối là phiên lead).
- **Một ghế qua nhiều vòng giữ cùng model** (Delphi `sameSeat`): Seat Binding ghim model của ghế theo tên ghế trong case.

#### 3.0.2 Nạp persona tại chỗ (owner 12:33)

Đã có một cửa nạp persona (`src/runner/agent-definitions.mjs`), ba tầng, tầng trên thay cả file tầng dưới: workspace `fgos/agents/<name>.yaml` → domain `domains/<domain>/agents/` → core `core/agents/`. Thiếu tầng **workflow/use case**: một framework (Six Hats) khai persona ngay cạnh workflow của nó, không phải chép lên chỗ chung. Đề xuất: thêm tầng workflow (khối `personas:` trong file workflow, hoặc thư mục `agents/` cạnh nó), thứ tự workspace → workflow → domain → core (khách hàng vẫn đè được). Persona của domain chỉ thấy trong domain đó (hôm nay mọi domain chung một không gian tên).

Convention **không** nạp persona: nó chỉ sinh, phân giải, kiểm tên và đường dẫn. Convention có thể sở hữu luật đường dẫn và tên file persona (`<name>.yaml`, nơi đặt ở mỗi tầng); việc đọc, thứ tự ưu tiên và ghim nội dung vẫn ở `agent-definitions` (một cửa, mở rộng thêm tầng).

### 3.1 Authority (một câu)

**Seat Binding là authority duy nhất trả lời: "ghế này chạy ai (họ, invocation, model), ở tier nào, bằng account nào, và khi hỏng thì sang đâu" — kèm lý do cho từng phần.** Không component nào khác tự tính tier, model, thứ tự họ, thứ tự account hay bước dự phòng.

### 3.2 Ranh giới

| Thuộc Seat Binding | Không thuộc Seat Binding |
|---|---|
| Tier của ghế, trần, thứ tự họ, ô model và pool, thứ tự account, quyết định xoay account hay đi tiếp (walk), kiểm pin/override, độ chặt khác họ khi chọn, câu giải thích | Số ghế và tên ghế của một pattern (Collaboration Patterns quyết; Seat Binding chỉ nhận danh sách ghế) |
| Trạng thái account: lease, quarantine, lazy probe (`provider-capacity` thành kho trạng thái của component, adapter infra) | Chạy agent, transport, confinement, copy kho đăng nhập (Dispatch Transport and Confinement) |
| Một hàm thuần cho quyết định + một port cho trạng thái account sống | Admission của case, frame, trần seat-launch (Workflow; Seat Binding chỉ báo số launch đã dùng) |
| `explain` và `dry-bind` là chính hàm đó chạy không lease | Model của agent in-process trong harness (ngoài fgOS; ghi là ngoài phạm vi — N17 phần này để mở) |

Bên dùng (chỉ hỏi, không tự tính): `runUnit` của hai cửa `fgos run` và `fgos workflow`, đường Work (`assignment-policy` thành bên dùng mỏng, bỏ phần tự tính tier/model), cổng ghi, doctor, `fgos dispatch explain`, `workflow start --seats`. Walker thứ hai `attemptProviderCapacityFallback` bị xoá, đường cũ chuyển sang walk của component (L10).

### 3.3 Hình dạng

- **Lõi quyết định thuần:** `bindSeat(ask, config, accountView) → { binding, why }`, trong đó `ask` = {capability, role, unit (writes, blind, skills), ghế đã ngồi trước (cho luật khác họ và spread), bước walk đã đi (`tried`, `excludePools`), override của người gọi}; `accountView` = ảnh chụp chỉ-đọc trạng thái account. Cùng một đầu vào cho cùng một đầu ra — cổng ghi và doctor gọi lại đúng hàm này với đầu vào đã ghi trong `unit.json` (đóng D16).
- **Port trạng thái account:** `lease(pool, ranked)`, `release`, `quarantine`, `probe` — adapter là `provider-capacity` hôm nay (khoá kernel giữ nguyên).
- **Từ vựng tier** (`TIER_STRENGTH`, `resolveStrongerTier`) và rigor chuyển xuống một leaf kernel dùng chung (hôm nay `bind` import từ `assignment-policy` — 6.3 kiểm kê).
- **Ngôn ngữ:** câu hỏi cho owner (mục 9). Đề xuất Node trước: mọi bên gọi là Node, quyết định là logic thuần trên config, giống quyết định admission ở Node (N14 của workflow); chuyển Rust khi có bên gọi Rust.

## 4. Tách ba việc của rigor (đóng G1)

| Khái niệm | Trả lời | Quyết bởi | Không còn quyết |
|---|---|---|---|
| **tier** | model mạnh tới đâu | khai trực tiếp: `tier` của capability, của ghế, của role (mục 5) | — |
| **rigor** | cẩn thận tới đâu | rigor của capability (sàn) và của unit, mạnh hơn thắng — **một** quy tắc cho cả hai việc dưới | không còn chọn tier |
| ↳ số ghế checker | bao nhiêu người soát | `checkersByRigor[rigor]` (đọc rigor đã gộp, sửa O4) | |
| ↳ độ chặt khác họ | các ghế có phải khác họ | high/critical → mỗi ghế một họ | |
| **trần** | tối đa được bao nhiêu | `maxTier` global + `maxTier` của capability | |

Hệ quả theo nguyên tắc owner: việc đã có plan (code) chạy rigor cao (nhiều checker, chặt) mà vẫn tier rẻ; hội đồng thiết kế chạy tier cao mà không buộc thêm checker. `rigorToTier` bị xoá (L10); `advanced` thành tier khai được như mọi tier khác (đóng N34).

## 5. Config: một chỗ cho mỗi sự thật

### 5.1 Các lớp và thứ tự ưu tiên

Mỗi thuộc tính của ghế (`tier`, `families`) lấy từ lớp **cụ thể nhất** có khai; lớp trên đè lớp dưới, không trộn danh sách:

1. **Override của người** trong lượt chạy (`--override`, `--tier` mới, `--account`) — chỉ origin người (`human-cli`) được nâng tier; override do agent tạo không được vượt tier đã cấu hình (chặn lại sự cố D1). Vượt trần → **từ chối có tên**, không clamp im lặng (N36).
2. **Ghế trong capability:** `capabilities.<cap>.seats.<role>`.
3. **Role toàn hệ thống:** `roles.<role>` (ví dụ `red-team` → xai).
4. **Capability:** `capabilities.<cap>`.
5. **Nhóm capability:** `capabilities."<domain>:*"` (gom ~25 danh sách lặp — O14).
6. **Mặc định runner:** `defaults` (tier `standard`, families theo `tierFallback` của tier đó).

Luật khác họ (independence) và spread **luôn** áp sau cùng, như bộ lọc: một role ưu tiên xai nhưng producer đã là xai thì ghế tự sang họ kế, và câu giải thích nói rõ vì sao.

### 5.2 Hình dạng đề xuất (project `.fgos/config.json`, `runner`)

```json
"defaults": { "tier": "standard" },
"maxTier": "flagship",
"tierFallback": {
  "nano":     ["gemini", "deepseek", "z-ai", "claude", "openai"],
  "standard": ["gemini", "deepseek", "z-ai", "claude", "openai"],
  "advanced": ["gemini", "deepseek", "z-ai", "claude", "openai"],
  "flagship": ["claude", "openai", "gemini", "xai"],
  "frontier": ["claude", "openai", "gemini", "xai"]
},
"roles": {
  "red-team": { "families": ["xai"] }
},
"capabilities": {
  "code:*":            { "families": ["gemini#omp-herdr", "deepseek", "z-ai", "claude"] },
  "code:review":       { "families": ["openai#codex-cli-bwrap", "claude#claude-cli-bwrap"] },
  "business:*":        { "families": ["claude", "openai", "gemini", "xai", "z-ai#pi-cli-bwrap"] },
  "architecture:*":    { "tier": "flagship", "rigor": "high" },
  "architecture:shape":     { "seats": { "panelist-1": { "tier": "frontier" } } },
  "architecture:synthesize": { "tier": "frontier", "maxTier": "frontier", "rigor": "critical" },
  "architecture:explain":   { "tier": "standard" }
}
```

- `families` thay `prefer`, nói bằng **họ** (khớp `tierFallback`, `modelPolicies`; đóng O2); ghim invocation viết `họ#invocation`. Một họ có đúng một executor (RUL102), nên không mất thông tin.
- `families` chỉ là thứ tự **ưu tiên lượt đầu**; khi hỏng đi tiếp theo `tierFallback` của tier, giới hạn trong các họ có trong `families` (giữ quyết định owner Q4: capability chỉ thu hẹp).
- `seats.<role>` và `roles.<role>` chỉ có hai khoá: `tier`, `families`. Không có khoá nào khác ở cấp ghế (giữ config nhỏ).
- `maxTier` của capability cho phép config khai tier vượt trần global cho đúng capability đó (thay luật "rigor của capability nâng trần", RUL103) — nhìn vào config là thấy chỗ nào được phép lên frontier.
- Preset vẫn chỉ khai ý định (capability, pattern, persona); không mang tier/họ (giữ G2 của workflow, quyết định 0057). Taste theo ghế nằm ở config, một chỗ.
- `modelPolicies`, `llmAccounts`, `executors` giữ nguyên hình dạng D-ADR0071 / MP-B2.

### 5.3 Câu giải thích (máy in ra)

`fgos dispatch explain` mở rộng: `--for <cap> [--role <r>]` cho một ghế, `--preset <id>` cho mọi ghế của một preset theo thứ tự chạy. Mỗi ghế in một dòng và nguồn từng phần, ví dụ:

```
architecture-advisory / critique-proposals / red-team
  → xai grok-4.6 @ flagship, account xai/vantt
    families: roles.red-team [xai]; independence: producer=xai? no → kept
    tier: capabilities."architecture:*".tier = flagship; ceiling: maxTier flagship
    on failure: rotate xai accounts → tierFallback.flagship ∩ families → (none left: refuse)
```

Doctor có một dòng kiểm "mọi ghế của mọi preset đã đăng ký đều có ứng viên" bằng chính hàm này (thay `workflow-pools-satisfy-independence`).

## 6. Dây chuyền một ghế (thứ tự cố định)

1. **Tier:** override người (nếu có, kiểm quyền và trần) → `seats.<role>.tier` → `roles.<role>.tier` → `capability.tier` → nhóm → `defaults.tier`. Trần = `capability.maxTier` nếu khai, nếu không là `maxTier` global; vượt trần do người hỏi → từ chối có tên.
2. **Thứ tự họ lượt đầu:** override executor → `seats.<role>.families` → `roles.<role>.families` → `capability.families` → nhóm → `tierFallback.<tier>`.
3. **Lọc:** governance, skills, blind, posture, pool dùng được, **khác họ** (hard, theo rigor đã gộp), spread (soft).
4. **Ô model và pool:** `modelPolicies.<họ>.<tier>` theo thứ tự các mục; thiếu ô → `tier-cell-missing`.
5. **Account:** pin `pool/account` nếu có; nếu không, thứ tự khai trong pool, sticky trước, bỏ quarantine/disabled/không có kho đăng nhập (D-ADR0071).
6. **Khi hỏng:** xoay account cùng pool (trừ ghế ghi đã sửa worktree, ghế bị pin, hết trần launch của frame) → mục kế trong ô cùng họ → họ kế theo `tierFallback.<tier>` ∩ danh sách họ của bước 2 → hết thì báo `fallbackExhausted` có lý do.
7. **Ghi lại:** binding + câu giải thích vào `unit.json`; cổng ghi và doctor tính lại bằng chính bước 1–6 với đầu vào đã ghi.

## 7. Nhu cầu → spec

| Nhu cầu | Ở đâu trong spec |
|---|---|
| N1, N21, N34 code rẻ đúng trình độ, `advanced` khai được | 4, 5.2 (`code:*` families, tier mặc định standard hoặc khai `advanced`) |
| N2, N33 thiết kế đặc biệt lên cao cấp, frontier có chủ đích | 5.2 `architecture:*`, `maxTier` theo capability |
| N3, N5 taste theo ghế, red-team → xai | 5.1 lớp 2–3, 5.2 `roles`, `seats` |
| N6 khác họ | 6 bước 3, rigor đã gộp (sửa O4) |
| N7–N10, N28 xoay, dự phòng, pin, quarantine | 6 bước 5–6 (giữ nguyên D-ADR0071) |
| N15 giải thích được | 5.3 |
| N16, O14 config ngắn | 5.1 lớp 5 (`"<domain>:*"`), 5.2 |
| N17, D3, D31 một authority | 3 |
| N18, N35, N36 trần theo capability, quyền override | 5.1 lớp 1, 5.2 `maxTier` capability |
| N19 đo chi phí | ngoài phạm vi (MP-COST Q2) |
| N30 global config không làm vỡ release khác | 8 |

## 8. Chuyển đổi (L10, một đợt cho mỗi contract)

1. Lõi `bindSeat` + port account trong component; mọi bên gọi chuyển sang; xoá tier/model riêng của `assignment-policy`, `dispatch/cli.mjs`, `assignment.mjs`; xoá walker thứ hai.
2. Config: `prefer` → `families` (MP-C gộp vào đây), `rigorToTier` xoá, thêm `tier`/`maxTier` capability, `roles`, `seats`, nhóm `"<domain>:*"`, `defaults`. Một lệnh `fgos setup` chuyển config cũ sang mới một lần, in diff; các key mới chỉ ở **project config** cho tới khi mọi release trên máy đọc được (N30, D22).
3. `explain` theo ghế và theo preset; doctor dùng cùng hàm.
4. Spec: file `docs/specs/seat-binding.md`, dòng mới trong `docs/platform/component-boundary.md`, supersede RUL80/91/98/102/103/106 phần chọn ghế bằng record mới (không sửa tại chỗ).

#### R.3 Gói domain mang tier, project mang families (owner 13:28)

Gói domain không biết project dùng nó có họ nào (account, OpenRouter, họ khai trong config), nên **gói chỉ mang yêu cầu khả chuyển: `tier` và độ độc lập; `families` chỉ do project khai (R1)**. Gói đòi một tier mà project không có ô cho tier đó, hoặc vượt `maxTier` của project → **từ chối có tên**, không tự hạ (tránh chạy model yếu hơn mà không ai biết).

### T. Thang tier: 6 bậc, định nghĩa theo bản chất việc (owner 13:36)

Chia theo việc phân biệt rõ được hay không, không theo việc hôm nay đã có ai dùng. Một họ dùng cùng model cho hai bậc liền nhau là bình thường (điền lặp ô).

| Bậc | Công việc | Câu tự kiểm | Ví dụ |
|---|---|---|---|
| nano | máy móc, không cần suy luận | chỉ cần nhận dạng hoặc biến đổi theo mẫu? | phân loại, trích dữ liệu, định dạng, định tuyến, bỏ phiếu |
| mini | suy luận nhẹ trên đầu vào có sẵn, phạm vi hẹp | đủ thông tin trong tay, chỉ cần hiểu và tóm? | tóm tắt, trả lời từ tài liệu đưa vào, sửa nhỏ theo chỉ dẫn chính xác, soát diff nhỏ |
| standard | làm theo plan có sẵn, nhiều bước | đã có plan và hướng dẫn chi tiết? | code theo plan, viết test, refactor theo mô tả |
| advanced | tự tìm cách làm, chưa có lời giải sẵn | phải tự điều tra và quyết cách làm? | debug khó, code phức tạp, việc nhiều file thiếu plan |
| flagship | phán đoán, thiết kế, phản biện | kết quả là một ý kiến hay thiết kế? | review, phản biện, thiết kế giải pháp, tổng hợp hội đồng |
| frontier | quyết định đắt giá nhất | quyết định khó đảo ngược, sai thì tốn kém lớn? | chốt kiến trúc, ghế tổng hợp cuối của hội đồng quan trọng |

**Kiểm với các họ (research [261020-1339](research-261020-1339-model-family-tier-ladders.md), owner 13:45 đồng ý):** không họ nào có 6 model riêng; claude, openai, gemini đạt 6 mức khi tính mức suy luận; xai ~4–5, deepseek 4, glm 3–4. Quyết định:
- Giữ 6 bậc làm chuẩn theo bản chất việc.
- **Ô = model + mức suy luận tùy chọn** (vd opus ở flagship, opus + effort max ở frontier); thay việc nhúng mức suy luận vào tên model như gemini `flash-medium` hôm nay.
- **Khai trùng có chủ đích** giữa hai bậc liền nhau được phép.
- **Bậc mà họ không đạt chất lượng thì để trống, không khai đại.** Walk bỏ họ thiếu ô (B1 đã có); ghế ghim họ đó ở bậc trống → `tier-cell-missing` có tên; không bao giờ tự hạ. Doctor `model-policy-tier-coverage` (bắt đủ ô theo `rigorToTier`) được thay trong đợt chuyển đổi bằng luật này.
- Đề xuất ô: deepseek nano/mini/standard `v4.1-flash`, advanced `v4-pro`, flagship/frontier **trống**; glm nano/mini/standard `glm-5.3-flash`, advanced `glm-5.3`, flagship/frontier **trống**.
- Cập nhật model mới (openai `gpt-6-luna`, thay `gpt-5.6-sol`, xai `grok-4.7`, điền ô `mini` mọi họ) là một diff config riêng cho owner duyệt, sau khi land Seat Binding.

**Định nghĩa phải nằm ngay cạnh config** (owner). Config là JSON, không có comment. Quyết định: **một nguồn** là hằng số định nghĩa thang trong component Seat Binding (cùng chỗ với từ vựng tier); `fgos setup` sinh khoá `"$comment"` (quy ước của JSON Schema, loader bỏ qua mọi khoá `$comment` ở mọi cấp) ngay cạnh `modelPolicies`, `tierFallback`, `maxTier` từ nguồn đó; doctor báo khi `$comment` lệch nguồn; `fgos dispatch explain` in định nghĩa bậc của ghế. Không chép tay (luật thiết kế 7). Phương án loại: đổi config sang JSONC/YAML (đổi định dạng mọi workspace, quá lớn); khoá dữ liệu `tiers` mang mô tả (hai nguồn sự thật cho một từ vựng cố định).

## 9. Câu hỏi cho owner

1. **Tách rigor khỏi tier (mục 4):** đồng ý xoá `rigorToTier`, tier khai trực tiếp? Hệ quả cần biết: item Work `risk: heavy` hôm nay tự lên flagship; sau tách nó chỉ thêm checker, tier giữ theo capability.
2. **Lớp `roles` toàn hệ thống (mục 5.1 lớp 3):** đồng ý có taste theo role chung (red-team → xai), hay chỉ cho taste theo ghế trong từng capability?
3. **Override của agent:** chỉ người (`human-cli`) được nâng tier; agent tự nâng → từ chối có tên. Đồng ý?
4. **Ngôn ngữ component:** Node trước (đề xuất), hay Rust ngay theo luật thiết kế 4?
5. **Có cần hội đồng kiến trúc soát bản này trước khi duyệt?** Đề xuất có: nó đổi authority và contract config của mọi lượt chạy.
6. **Năm câu taste** của [báo cáo thảo luận](discussion-261020-0947-model-tier-by-capability-and-seat.md) (số ghế frontier ở `shape-proposals`, `explain` hạ tier, synthesis business/delphi, panel ý kiến dẫn bằng họ rẻ, `code:review`) — có thể trả lời sau, vì chỉ là giá trị trong config mới.

7. **Persona có được ảnh hưởng model không?** Ví dụ persona "kiến trúc sư hệ thống" luôn kéo tier lên flagship. Bản này chưa cho: model chỉ theo capability, role và ghế. Cho thì thêm một lớp vào 5.1 (giữa role và ghế), persona khai `tier`/`families`.
8. **Các mục chuyển từ MP-B1 06 (owner 11:56):** tier hội đồng kiến trúc (tổng hợp frontier, còn lại flagship, một ghế phản biện frontier), red-team → xai, trần `advanced`/`maxTier` theo capability — config mẫu 5.2 đã thể hiện; làm cùng đợt chuyển đổi mục 8.

9. **Bỏ role `panelist`, panel = N `producer` + `synthesizer`; ghế khai tường minh (3.0.1):** đồng ý?
10. **Tầng persona theo workflow/use case (3.0.2):** khối `personas:` trong file workflow hay thư mục `agents/` cạnh workflow? Persona domain chỉ thấy trong domain?
11. **Pattern `debate` + role `judge`:** làm cùng Seat Binding hay để backlog?

### Owner trả lời (2026-10-20)

- Câu 1 (bỏ `rigorToTier`): 12:05 "không phản đối", 12:10 xác nhận rigor chỉ còn quyết số checker và khác họ; tier khai trực tiếp.
- Câu 9 (bỏ role `panelist`, panel = N `producer` + `synthesizer`, ghế khai tường minh): 12:38 đồng ý.
- Câu 11 (pattern `debate` + role `judge`): 12:37 **làm ngay** (trước Seat Binding).
- 12:48: role **`judge`** thêm (pattern `debate`) → role gốc là 5: `producer`, `synthesizer`, `reviewer`, `red-team`, `judge`.
- Câu 2: **không** có `roles` global; taste theo role đúng theo domain → brainstorm phạm vi (mục R bên dưới).
- Câu 4: **Rust** ngay (luật thiết kế 4; component chưa có, viết Node rồi port là làm hai lần). Theo khuôn Convention/Session Identity: crate + route nội bộ + facade Node mỏng cho `bind()`.
- Câu 5: có hội đồng kiến trúc soát trước khi duyệt.
- Câu 7: có — persona, nếu ghế có, **phải** được truyền vào Seat Binding và được khai taste model.
- Câu 10: nghĩ thêm. Hướng owner: domain (vd marketing) cung cấp một **bộ persona chung**; persona để **file riêng** (dễ thay, dễ cập nhật) thay vì khối trong file workflow.
- 13:17 câu 3: **đồng ý** — chỉ origin người (`human-cli`) được nâng tier; override do agent tạo vượt tier cấu hình → từ chối có tên.
- 13:17 câu 10: **hỗ trợ cả hai**, persona của domain chỉ thấy trong domain đó: (a) bộ persona chung của domain; (b) workflow đóng gói trong một thư mục riêng thì persona đặt **ngay cạnh** file workflow, không chép vào thư mục `agents/` riêng. Tên theo tiền tố loại: `wf.<name>.<ext>`, `agent.<name>.<ext>` (vd `six-hats/wf.six-hats.yaml`, `six-hats/agent.black-hat.yaml`). Luật tên và nơi đặt này là việc của Convention (sinh/phân giải/kiểm tên + đường dẫn); đọc, thứ tự tầng, ghim nội dung vẫn ở `agent-definitions`. Thứ tự tầng: workspace → thư mục workflow → domain (của chính workflow) → core.
- 13:26 câu 6: **đồng ý đề xuất**: (a) `shape-proposals` 1 ghế frontier (lens hệ thống), 2 ghế flagship; (b) `explain` hạ xuống flagship; (c) synthesis business/delphi giữ standard; (d) panel ý kiến dẫn bằng họ rẻ (gemini, deepseek, glm); (e) `code:review`/`code:debug` giữ codex rồi claude.
- 13:28 R: gói domain mang tier, không mang families (R.3). 13:36: giữ **6 bậc** tier, định nghĩa ở mục T, đặt ngay cạnh config.
- 13:50 R: **R1 và R2 là hai lớp chồng nhau, không loại trừ**: R2 (gói domain, chỉ `tier` + độ độc lập) là mặc định đi theo domain; R1 (config project, `families` + đè `tier`) là quyết định cuối. Thứ tự áp: R1 > R2 > mặc định hệ thống. R1 làm trong đợt Seat Binding; R2 làm khi đóng gói domain cho project khác.
- Còn mở: không. Bước tiếp: hội đồng kiến trúc soát (câu 5), rồi owner duyệt bản cuối.

### R. Brainstorm: phạm vi của taste theo role (owner 12:48: global không hợp)

Vấn đề: "red-team → xai" hợp với review code và phản biện kiến trúc, nhưng ở marketing red-team có thể cần họ khác; một khoá `roles` global ép mọi domain một ý.

| Phương án | Khai ở đâu | Lợi | Giá |
|---|---|---|---|
| R1 role trong nhóm capability | `capabilities."code:*".roles.red-team`, `capabilities."marketing:*".roles.red-team` | dùng lại lớp nhóm `"<domain>:*"` đã có trong 5.1; không thêm khoá cấp cao; đọc config thấy ngay domain nào chọn gì | lặp nếu nhiều domain cùng ý |
| R2 role trong config của domain | `domains/<d>/` (file domain) | domain tự mang taste, đi cùng persona và workflow của nó | thêm một nguồn config ngoài `.fgos/config.json`; project muốn đè phải có lớp đè |
| R3 role trong từng capability | `capabilities.<cap>.roles.<role>` | chính xác nhất | lặp nhiều |
| R4 global + đè theo domain | `roles` global làm mặc định, R1 đè | ít dòng | chính là thứ owner thấy không hợp: mặc định global vẫn rò sang domain không khai |

Đề xuất: **R1** (và R3 khi cần chính xác, cùng một hình dạng khoá `roles` bên trong capability hoặc nhóm). Không có `roles` cấp runner. Thứ tự lớp 5.1 thành: người > ghế > persona > role trong capability > role trong nhóm domain > capability > nhóm domain > mặc định. Câu cho owner: R1 có đủ không, hay domain cần mang taste theo gói (R2) khi đóng gói domain cho project khác?

#### R.2 Trình bày lại (13:26)

Ví dụ thật: red-team ở code muốn xai (phá mạnh), ở marketing muốn claude (phê bình giọng thương hiệu kỹ), ở kiến trúc muốn xai.

- **R1 — khai trong config của project, theo nhóm capability của domain:** `capabilities."code:*".roles.red-team.families = ["xai"]`, `capabilities."marketing:*".roles.red-team.families = ["claude"]`. Một file, người chủ project thấy hết. Khi đem domain marketing sang project khác, taste không đi theo; project đó chạy mặc định cho tới khi tự khai.
- **R2 — domain tự mang taste trong gói của nó** (`domains/marketing/…`), project đè bằng R1. Taste đi theo domain. Nhưng họ model phụ thuộc máy (máy kia không có account xai thì vô nghĩa), nên taste theo **họ** mang theo gói thì yếu; taste theo **tier** và **độ độc lập** (judge cần flagship, phải khác họ) thì mang đi đâu cũng đúng.

Đề xuất: **R1 ngay** (một nguồn, đúng thẩm quyền config project). **R2 sau, khi đóng gói domain cho project khác (mission #1), và chỉ cho khoá khả chuyển (`tier`), không cho `families`.**

## Phụ lục: phát hiện thêm khi chứng minh MP-B1 (2026-10-20 11:15)

- `code:review` khai `prefer` ghim `openai#codex-cli-bwrap`, nhưng trong phiên herdr ghế bind `codex-herdr` ([phase 07](phase-lead-261020-1110-model-pool-b1-p07-proof.md)): ghim invocation trong capability bị lựa chọn transport đè. Spec phải nói rõ ghim invocation (`họ#invocation`) là cứng hay chỉ là gợi ý, và `explain` phải in lý do khi nó bị đổi.
