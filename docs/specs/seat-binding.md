---
area: seat-binding
updated: 2026-10-21
status: implemented — owner duyệt toàn văn 2026-10-20 21:31 ("ok, duyệt spec Seat Binding"); quyết định D-ADR0072 (Seat Binding: one authority for agent seat choice) (mục 15); code land 2026-10-21, con trỏ thực thi ở mục 16. Các câu "trước Seat Binding" trong mục 1–12 mô tả code trước đợt; mục 13 là bằng chứng của bản duyệt; điều đợt triển khai chứng minh là sai nằm ở mục 17 (erratum).
sources: [seat-binding-spec-draft-rev2-consolidated, seat-binding-spec-draft-rev1, seat-binding-council-synthesis, seat-binding-needs-and-mechanisms-inventory, model-family-tier-ladders]
decisions: []
coverage: full-target
---

# Spec: Seat Binding (một authority cho câu hỏi "ghế này chạy bằng gì")

> **Trạng thái: implemented (2026-10-21).** Spec này là hợp đồng của Seat Binding và code đã theo nó; câu nào nói "trước Seat Binding" mô tả code trước đợt chuyển đổi, và chỗ đợt triển khai chứng minh spec sai được sửa tại chỗ và ghi ở mục 17. Spec thay phần chọn ghế của RUL80 (an account is chosen first, then a CLI), RUL91 (a person may pin the provider account of a unit run), RUL98 (workflow start passes --timeout and --account to each Unit), RUL102 (a tier cell names its pool; one family has one executor), RUL103 (runner.maxTier caps every seat) và RUL106 (a seat walks a tier declared order and its cell entries) trong [runner.md](runner.md) (mục 15).

## 1. Mục đích và phạm vi

Trước Seat Binding một quyết định, "ghế này chạy bằng executor, model, effort, tier, account nào, hỏng thì đi đâu", bị tính ở nhiều nơi: `bind()`, `provider-capacity`, `assignment-policy`, cổng ghi, doctor. Ba gốc rễ: `rigor` gánh ba việc (số checker, độc lập, tier); config không có tầng "ghế"; cùng một quyết định bị tính lại ở nhiều chỗ nên lệch nhau.

Mục tiêu của owner (2026-10-20 09:54): mọi nhu cầu đều cấu hình được, kể cả khẩu vị theo ghế và theo capability; máy in ra một câu cho mỗi ghế, nói rõ executor, model, effort, tier, account nào được chọn và quy tắc nào cấp từng phần; mỗi sự thật khai một lần.

Nguyên tắc chọn model (owner 09:50): việc đã có kế hoạch và hướng dẫn chạy model rẻ ở đúng mức; việc nghĩ phức tạp, góc nhìn riêng, thiết kế đặc biệt chạy họ premium.

**Phạm vi: chỉ ghế agent.** Một capability do tool executor (`kind: tool`, ví dụ `impact-analysis` → `gitnexus`, `pane-labeling` → `herdr`) phục vụ giữ đường đi hiện có; Seat Binding không giải và không viết lại nó.

## 2. Từ vựng

| Từ | Nghĩa |
|---|---|
| **seat** | một chỗ ngồi trong một Unit, id duy nhất trong Unit |
| **role** | một trong năm: `producer`, `synthesizer`, `reviewer`, `red-team`, `judge`. `panelist` bị bỏ; panel = N ghế `producer` cộng một `synthesizer` |
| **persona** | ai ngồi ghế (giọng, phong cách, ranh giới quyết định, skill, phạm vi tool). Seat, role và persona là ba thứ tách |
| **posture** | thuộc tính của pattern: `readOnly`, `forceOutOfProcess`, stance của thành viên panel. Hành vi ghi và launch đến từ posture, không bao giờ từ role `producer` |
| **tier** | mức mạnh của model, sáu bậc (mục 5.1) |
| **effective rigor** | độ cẩn thận; chỉ quyết số checker và độc lập (mục 5.2) |
| **cell** | một ô `modelPolicies.<family>.<tier>`: model cộng effort tuỳ chọn (mục 5.3) |
| **family / pool** | một agent executor phục vụ đúng một family (doctor `executor-family-unique`), nên id executor gọi tên family; pool là bên billing và có state riêng |
| **recommendation** | `tier` do workflow khai trên ghế: tier khuyến nghị, mặc định mang theo như R2 (mục 6), không phải sàn |

## 3. Authority và ranh giới

**Seat Binding là authority duy nhất trả lời "ghế agent này chạy bằng executor, invocation, model, effort, tier và account nào, và nếu hỏng thì đi đâu", kèm lý do cho từng phần.** Không component nào khác tính tier, model, thứ tự executor, thứ tự account hay bước fallback cho ghế agent. Hàng Execution Core của [component-boundary.md](../platform/component-boundary.md) (trước đợt: `bind.mjs` là authority đó) đã chuyển sang Seat Binding cùng đợt.

| Seat Binding sở hữu | Seat Binding không sở hữu |
|---|---|
| Tier, trần, thứ tự executor, cell và pool, thứ tự account, quyết định rotate-hay-next (walk), kiểm ghim và override, độc lập lúc chọn, lời giải thích | Danh sách ghế của Unit: pattern và `seats:` của workflow sinh ra; Seat Binding nhận qua một seat resolver (mục 7.1) |
| Trạng thái account như một port: lease, release, quarantine, lazy probe (adapter = `provider-capacity`) | Chạy agent, transport, confinement, copy login-store (Dispatch Transport and Confinement) |
| `explain` và `dry-bind` = cùng một hàm, chạy không giữ lease | Case admission, frame, trần seat-launch (Workflow; Seat Binding báo số launch đã dùng) |
| Từ vựng tier và định nghĩa ladder (một hằng, nguồn của `$comment`) | Nạp persona và các lớp của nó (`agent-definitions`; tên và đường dẫn do Convention) |
| | Capability do tool executor phục vụ |

Bên gọi chỉ hỏi: `runUnit` sau `fgos run` và `fgos workflow`, đường Work (`assignment-policy` thành consumer mỏng), cổng ghi, doctor, `fgos dispatch explain`, `workflow start --seats`. Walker thứ hai `attemptProviderCapacityFallback` bị xoá (L10).

## 4. Hình dạng: Shape S (mặc định) và Shape B (nhánh có tên)

### 4.1 Shape S

- **Hai stage thuần trong crate Rust.** Stage 1 *policy*: (seat ask, config) → tier, trần, tập cell, executor theo thứ tự, effective rigor, ràng buộc; cache theo seat + digest config. Stage 2 *ranking*: (policy, peers, walk state, accountView) → một danh sách candidate xếp hạng gọi tên executor, invocation, model, effort, pool, account; chạy lại ở mỗi bước walk và mỗi `lease-conflict`.
- **Facade Node mỏng** gọi crate qua route nội bộ của Rust host, cùng kiểu Convention và Session Identity. Thiếu route thì fail closed; không có JS policy fallback.
- **Không exec host dưới provider lock.** Facade thu `accountView` ngoài `withProviderStateLock`, gọi crate, rồi mới acquire dưới lock. Trước Seat Binding ranking và `ranked[0]` chạy trong lock (`provider-capacity.mjs:623-636`).
- **Quyết định, acquire và replay là một authority.**
  - Mỗi attempt lưu một `bindingInput` có version (seat, role, posture, effective rigor, peers `independentOf`/`preferIndependentOf` lúc quyết, walk state, digest config, nguồn tier và trần, digest accountView) và một `leaseReceipt`.
  - Adapter acquire đúng account crate đã gọi tên, dưới lock hiện có, hoặc trả `lease-conflict`; runner rồi bind lại với view mới, cùng policy.
  - Cổng ghi replay giai đoạn 1 từ config đã commit ở digest của run (từ chối khi lệch) và chạy giai đoạn 2 không có trạng thái lease; receipt của lease được đối chiếu với record provider lúc settle, trước khi một lượt pass được commit; không đọc lại đồng hồ quarantine hôm nay. Câu trả lời sức khoẻ hiện tại của `explain` và doctor chỉ là tạm.
  - Giữ nguyên: ghim cứng; không retry đè lên ghi dở của ghế ghi (RUL92 (a writing seat is not rerun over its own partial writes)); quarantine và lazy probe; trần launch; ghim chạy-cả-run bỏ qua ghế nó không áp được.
- **Ngân sách exec.** Plan phải nêu và đo số host exec cho mỗi seat × round × bước walk, trên facade có sẵn (Session Identity hoặc Convention), với panel ba ghế một bước walk. Chưa đo trong đợt này (mục 13).

### 4.2 Shape B (nhánh có tên, không mặc định)

Rust chỉ sở hữu policy tĩnh của ghế; Execution Core Node giữ placement, độc lập, spread, walk và lease. B khớp bản đồ ranh giới trước đợt này và loại bỏ vấn đề "quyết định và acquire tách đôi" từ cấu trúc, nhưng khi đó hai component cùng trả lời câu hỏi ghế và `explain` ráp từ hai nguồn. **Điều kiện đảo:** owner bác giao thức hai-stage, không-exec-dưới-lock của S, hoặc ngân sách exec đo được thất bại; khi đó hỏi lại S-hay-B kèm bảng chi phí. Shape A (resolver trong `bind.mjs`, không crate) chỉ là mốc giá Node; nó trái quyết định Rust-trước nên không phải lựa chọn.

## 5. Tier

### 5.1 Ladder (một nguồn, `$comment` sinh ra)

| Tier | Việc | Tự kiểm | Ví dụ |
|---|---|---|---|
| nano | cơ học, không suy luận | chỉ nhận ra hoặc biến đổi theo mẫu? | classify, extract, format, route, vote |
| mini | suy luận nhẹ trên đầu vào cho sẵn, phạm vi hẹp | đủ thông tin, chỉ hiểu và tóm tắt? | tóm tắt, trả lời từ tài liệu cho, sửa nhỏ chính xác, review diff nhỏ |
| standard | theo một kế hoạch có sẵn, nhiều bước | có kế hoạch và hướng dẫn chi tiết? | code theo plan, viết test, refactor theo mô tả |
| advanced | tự tìm đường, không có đáp án sẵn | phải điều tra và quyết cách làm? | debug khó, code phức tạp, nhiều file không có plan |
| flagship | phán đoán, thiết kế, phê bình | kết quả là một ý kiến hay một thiết kế? | review, red-team, thiết kế giải pháp, synthesis của panel |
| frontier | quyết định đắt nhất | khó đảo, đắt nếu sai? | khoá kiến trúc, synthesis cuối của hội đồng quan trọng |

Bảng là một hằng trong crate cạnh từ vựng tier (`TIER_STRENGTH`). `fgos setup` ghi nó thành khoá `"$comment"` cạnh `modelPolicies`, `tierFallback`, `maxTier`; loader bỏ qua `$comment` ở mọi cấp; doctor báo `$comment` khác nguồn; `explain` in định nghĩa tier của ghế. `$comment` bị gỡ trước khi validate và trước hash config ngữ nghĩa.

### 5.2 Rigor tách khỏi tier

| Khái niệm | Trả lời | Do ai quyết |
|---|---|---|
| tier | model mạnh cỡ nào | mục 5.4 |
| effective rigor | cẩn thận cỡ nào | mạnh hơn của rigor capability (entry cap, không có thì prefix) và rigor của unit |
| ↳ số checker | bao nhiêu ghế checker | `patterns.reviewed.checkersByRigor[effectiveRigor]` ∪ `params.minCheckers` |
| ↳ độc lập cứng | các ghế có buộc khác family | bảng pattern mục 7.3, độ chặt theo effective rigor |
| trần ngân sách | nhiều nhất một ghế được | `maxTier` (mục 5.4 bước 4) |

`rigorToTier` bị xoá; tier khai trực tiếp. Hệ quả: code đã có plan chạy rigor cao (nhiều checker, độc lập chặt) trên tier rẻ; hội đồng thiết kế chạy tier cao không cần thêm checker. Work item `risk: heavy` không tự nâng tier nữa; chỉ thêm checker.

### 5.3 Cell

| Dạng cell | Nghĩa |
|---|---|
| `"<model>[@<pool>]"` | model; pool mặc định là pool của family; không effort |
| `{ "model": "...", "pool": "...", "effort": "..." }` | `pool` và `effort` tuỳ chọn |
| mảng không rỗng các dạng trên | entry theo thứ tự, walk lần lượt trong family |
| bỏ khoá tier | **unmet**: family không phục vụ tier này (deepseek và glm không có flagship, frontier) |

- Một cell là model cộng effort tuỳ chọn. Collapse khai báo giữa hai tier liền kề được phép.
- `parseTierCell` (`tier-cell.mjs:25-40`, trước đợt từ chối mọi giá trị không phải chuỗi) nhận dạng object; cell chuỗi vẫn hợp lệ nên cell cũ migrate nguyên.
- Effort là một phần lời hứa của tier: vào `bindingIdentity`, snapshot binding và so sánh ở cổng ghi. Override không được hạ effort của cell (từ chối `effort-below-cell`); override bằng hoặc cao hơn thì nhận như hôm nay.
- Cell không effort chạy ở mức riêng của template invocation (template pi/omp ghi cứng `--thinking medium`); mức đó được ghi lại nhưng không phải lời hứa.
- Effort mà CLI thật của candidate không render được thì bỏ candidate; với ghim cứng thì từ chối `effort-unsupported`, kèm các mức CLI render được.
- Từ vựng effort đợt này là `REASONING_EFFORT_VALUES` = `low, medium, high, max` (`config.mjs:519`). Mở rộng (`xhigh`, `minimal`, `off`) và đổi tên model có effort trong tên (gemini `-low`/`-medium`/`-high`) đi cùng diff làm mới model riêng.
- Lối thoát inline-lead bị bỏ bất cứ khi nào candidate đã cấu hình bị chính sách hoặc nguồn cung loại: trước đợt `bind.mjs:500-514` giao ghế `producer` cho lead phiên với `model: 'default'`, `source: 'session-lead-inline'`, vượt mọi luật tier, cell và trần. Chỉ còn cho Unit không cấu hình candidate nào.

### 5.4 Hợp tier (project thắng, `maxTier` là cần gạt ngân sách)

Cho một ghế agent, theo thứ tự:

1. **Tier đã giải** = giá trị đầu tiên được khai theo danh sách (bảng đầy đủ ở mục 6.3):
   1. khoá seat của project: `cap.seats.<seat>`, rồi `prefix.seats.<seat>`;
   2. khoá persona của project: `cap.personas.<p>`, rồi `prefix.personas.<p>`;
   3. khoá role của project: `cap.roles.<role>`, rồi `prefix.roles.<role>`;
   4. `tier` của ghế trong workflow (khuyến nghị);
   5. mặc định capability của project: `cap.tier`, rồi `prefix.tier`;
   6. tier trong domain package (đợt sau; vắng đợt này);
   7. `defaults.tier`.
2. **Override.** Tier override cao hơn tier đã giải bị từ chối `tier-escalation-unauthorized` trong đợt đầu (mục 5.5). Override bằng hoặc thấp hơn thì nhận, ghi `tierSource: override`.
3. **Nguồn hiển thị.** Binding record, run evidence và `explain` mang `tierSource` (đường config chính xác, `workflow:<id>/<unit>/<seat>` hoặc `override`). Khi giá trị chọn khác khuyến nghị của workflow, chúng mang cả khuyến nghị, ví dụ `workflow recommends frontier, project config sets flagship (capabilities."architecture:shape".seats.system.tier)`.
4. **Trần ngân sách.** `maxTier` = `cap.maxTier` ?? `prefix.maxTier` ?? `maxTier` toàn cục; giá trị của capability được phép cố ý vượt giá trị toàn cục. Tier đã giải cao hơn `maxTier` thì **bị hạ xuống `maxTier`, hiển thị**: `tierSource`, `loweredFrom` và lý do `max-tier-cap` (gọi tên dòng `maxTier`) vào `explain`, binding record và run evidence.
5. **Cell.** Family không có cell ở tier cuối thì bị bỏ qua trong walk. Nếu không candidate được phép nào có cell ở tier đó, ghế bị từ chối `tier-cell-missing`, gọi tên dòng config cần đổi (khoá tier đã đặt nó, hoặc danh sách `prefer` đã hạn chế). Ghế ghim cứng vào family không có cell đó cũng bị từ chối như vậy. Thiếu cell không bao giờ hạ tier.
6. **Liên tục.** Ghế chạy nhiều round trong một unit (Delphi `sameSeat`, rebuttal của debate) giữ executor + model + effort. Xoay account trong cùng pool được phép nếu giữ được ghim đó; không thì ghế bị từ chối `seat-continuity-unavailable`.

Tên tier sai trong config là lỗi load. Việc hạ tier duy nhất từng xảy ra là `max-tier-cap` hiển thị; không gì hạ tier âm thầm.

### 5.5 Quyền nâng tier

- Cửa (ranh admission hoặc invocation) tính một `raiseAuthorized` đáng tin; crate không bao giờ đọc `override.origin`. Quyền mặc định là agent. Cùng cổng này điều khiển `acceptDependence` (trước đợt `bind.mjs:385` tin `origin === 'human-cli'`).
- Trước đợt `human-cli` là chuỗi tự khai: `bin/fgos.mjs:2851` gán cho mọi override không có origin; `:2862/:2878/:2889` tổng hợp cho `--effort`, `--timeout`, `--account`; `src/workflow/unit-handoff.mjs:198` tổng hợp trong handoff workflow.
- **Đợt đầu:** không cửa nào chứng thực được con người cho `fgos run` trực tiếp (mục 13), nên `raiseAuthorized` là false ở mọi cửa. Tier chỉ tăng qua config project đã commit (khoá tier, `maxTier`) hoặc khuyến nghị workflow. `fgos run --tier`/`--override` nâng tier bị từ chối `tier-escalation-unauthorized`; `--effort`, `--timeout`, `--account` vẫn chạy vì không phải nâng tier.
- **Mục sau:** nâng qua consent gate của workflow, trả lời bằng `fgos workflow answer --approve`, digest subject của nó phủ ghế và tier xin.

## 6. Cấu hình

### 6.1 Ai khai gì

| Bên khai | Khoá | Ghi chú |
|---|---|---|
| Workflow unit | `capability`, `pattern`, `persona?`, `rigor?`, `seats: [{seat, role, persona?, tier?}]` | `tier` là khuyến nghị; không bao giờ `prefer`, `executor`, `overrides` |
| Domain package (đợt sau) | `tier`, độc lập | chỉ phần mang theo được; không bao giờ `prefer` |
| Project `.fgos/config.json` `runner` | `defaults`, `maxTier`, `tierFallback`, `modelPolicies`, `capabilities` | tiếng nói cuối, trong khuôn mục 5.4 |
| Global `~/.fgos/config.json` | `llmAccounts`, executor máy | không nhận khoá mới đợt này (mục 9) |

Workflow khai ghế tường minh; workflow không bao giờ khai `prefer`. Khẩu vị role sống trong config capability (`capabilities."code:*".roles.red-team.prefer = ["xai"]`). Một prefix capability không phải domain; không có khoá `domains`. Ghế checker mang capability của unit.

### 6.2 Schema

| Khoá | Hình | Nghĩa |
|---|---|---|
| `defaults.tier` | tier | mặc định hệ thống (`standard`) |
| `maxTier` | tier | trần ngân sách toàn cục |
| `tierFallback.<tier>` | danh sách family, đủ sáu khoá gồm `mini` | thứ tự walk sau danh sách lần đầu |
| `modelPolicies.<family>.<tier>` | cell (mục 5.3) | thiếu khoá = unmet |
| `capabilities.<cap-or-prefix>` | `{ tier?, maxTier?, rigor?, prefer?, roles?, personas?, seats?, ...khoá hiện có }` | `<prefix>:*` khớp mọi capability bắt đầu `<prefix>:` |
| `….roles.<role>` | `{ tier?, prefer? }` | một trong năm role |
| `….personas.<persona-name>` | `{ tier?, prefer? }` | tên persona trần |
| `….seats.<seat>` | `{ tier?, prefer? }` | khoá theo tên ghế trong capability |

- `prefer` là khoá duy nhất, giữ hình sẵn có: id executor, hoặc `{executor, invocation}` cho ghim. Không có khoá `families`: capability còn do tool executor phục vụ (`impact-analysis: prefer "gitnexus"`), nên "family" không phải khái niệm config chung. Với agent executor, id gọi tên family của nó (một executor mỗi family, `executor-family-unique`, `src/setup/registrations.mjs:1473`), nhờ đó `prefer` gặp được `tierFallback` và `modelPolicies` khoá theo family (ví dụ executor `glm` ↔ family `z-ai`). Spec viết ghim invocation là `family#invocation`; trong config là entry `{executor, invocation}`.
- Khoá capability hiện có (`description`, `aliases`, `confinement`, `serves`, `persona`, `minCheckers`, `verify`) giữ nguyên.

### 6.3 Thứ tự ưu tiên theo từng thuộc tính

| Thứ | `tier` | `prefer` (thứ tự lần đầu) | `maxTier` | `rigor` |
|---|---|---|---|---|
| 1 | override bằng hoặc thấp hơn tier đã giải (mục 5.4 bước 2) | override executor | `cap.maxTier` | `cap.rigor` |
| 2 | `cap.seats.<seat>` | `cap.seats.<seat>` | `prefix.maxTier` | `prefix.rigor` |
| 3 | `prefix.seats.<seat>` | `prefix.seats.<seat>` | `maxTier` toàn cục | — |
| 4 | `cap.personas.<p>` | `cap.personas.<p>` | | |
| 5 | `prefix.personas.<p>` | `prefix.personas.<p>` | | |
| 6 | `cap.roles.<role>` | `cap.roles.<role>` | | |
| 7 | `prefix.roles.<role>` | `prefix.roles.<role>` | | |
| 8 | **`tier` ghế của workflow** | `cap.prefer` | | |
| 9 | `cap.tier` | `prefix.prefer` | | |
| 10 | `prefix.tier` | `tierFallback.<tier>` | | |
| 11 | tier domain (đợt sau) | | | |
| 12 | `defaults.tier` | | | |

Luật:
- Mỗi thuộc tính giải độc lập xuống cột của nó; một ghế có thể lấy `tier` từ dòng này và `prefer` từ dòng khác. `maxTier` rồi chặn `tier` (mục 5.4 bước 4).
- Danh sách thay thế, không gộp; map (`roles`, `personas`, `seats`) kế thừa theo khoá từ entry prefix.
- Vắng = kế thừa dòng sau. `prefer: []` là lỗi load.
- `prefer` chỉ xếp thứ tự lần thử đầu; khi hỏng, walk theo `tierFallback.<tier>` giới hạn trong các family của danh sách ghế (capability chỉ thu hẹp).
- Prefix = chữ trước dấu `:` đầu tiên; capability không có `:` không có dòng prefix. Chỉ một cấp prefix nên không có hoà giữa các prefix.
- Fallback bare-verb (`code:review` → `review`, `bind.mjs:70-84`) bị gỡ cùng đợt; plan liệt kê mọi consumer của lookup đó (dòng doctor, `explain`) trước khi xoá. Lookup thành: khoá chính xác → `<prefix>:*` → defaults, gộp theo từng thuộc tính thay vì chọn một entry theo `prefer` dùng được.
- Độc lập và spread áp sau precedence, như một bộ lọc (mục 7.3); `explain` gọi tên bộ lọc đã di chuyển một ghế.

### 6.4 Persona

- Workflow loader khám phá workflow đóng gói (`<wf>/wf.<wf>.yaml`) bên cạnh file phẳng và gắn `{sourcePath, workflowDir, owningDomain|null}`; `owningDomain` đến từ vị trí file, không bao giờ từ prefix capability. Hôm nay `src/workflow/loader.mjs:72-98` chỉ quét file phẳng.
- Thứ tự tìm persona: workspace `fgos/agents` → thư mục workflow (`wf.<name>.yaml`, `agent.<name>.yaml`) → domain sở hữu → core. `agent-definitions` giải thứ tự này, nhận `agent.<name>.yaml` cạnh workflow; persona của một domain chỉ thấy trong domain đó. Hôm nay `agentTierDirs` (`agent-definitions.mjs:36-54`) gộp mọi domain vào một tầng và chờ `<name>.yaml`.
- Convention sở hữu luật tên và đường dẫn; đọc, thứ tự lớp và ghim ở lại `agent-definitions`.
- Persona được giải trước `bindSeat`; binding lưu identity đủ (`<layer>:<source>/<name>`) và digest. Khẩu vị tra theo tên persona trần dưới `capabilities.<cap-or-prefix>.personas`.
- **File persona không bao giờ mang `prefer` hay `tier`**: persona dùng chung giữa các project, còn chọn model là việc của project (project thắng). File persona mô tả ai ngồi ghế (giọng, phong cách, ranh giới quyết định, skill, phạm vi tool). Trường `rigor` sẵn có của nó hôm nay không code chọn ghế nào đọc, và không ảnh hưởng tier hay số checker. Khẩu vị cho persona chỉ khai trong config project, `capabilities.<cap-or-prefix>.personas.<name>.{tier, prefer}`, xếp hạng seat > persona > role (owner 21:23).

## 7. Danh tính ghế và pattern

### 7.1 Hợp đồng ghế

- Mỗi ask và result mang `seat` (id duy nhất trong unit), `role` (một trong năm) và **posture** của pattern (`readOnly`, `forceOutOfProcess`, stance của thành viên panel).
- Binding, thư mục assignment, seat ledger, resume của panel và debate, ref handoff đều khoá theo `unitRun + seat + round + attempt`. Trước đợt khoá theo role (`role-ledger.mjs:20-34`), nên ba ghế `producer` sập thành một ô.
- Một seat resolver sinh danh sách ghế cho thực thi, mô phỏng, doctor và đếm launch của admission. Nó kiểm id ghế duy nhất và bội số role của pattern.
- Thành phần:
  - `solo`: một ghế `producer` trừ khi khai khác.
  - `reviewed`: ghế `producer` cộng một **ghế checker** mỗi tên từ `checkersByRigor[effectiveRigor]` ∪ `minCheckers` (và `red-team` cho capability `code:*`), id ghế = tên ghế checker trừ khi khai. Ghế checker là `reviewer`, `red-team` hoặc `tester`; `tester` mang role `reviewer` (chỉ để tra khẩu vị) nhưng posture không phải verdict: kết quả của nó không đòi assessment và không đỡ verdict receipt. Một unit khai ghế phải khớp đúng tập ghế checker cần, thiếu hay thừa bị từ chối `seat-multiplicity`. Rigor chỉ quyết tập này, không quyết tier. (Erratum E1.)
  - `panel` và `debate`: bắt buộc `seats:`. `params.members`, `params.role`, `params.synthesizeRole` và khoá `panelist-N` của `roleTasks` bị xoá; `roleTasks` và `workflow start --seats` khoá theo ghế.
  - `debate`: `thesis` và `antithesis` thành ghế role `producer`; `judge` là ghế role `judge` (trước đợt `patterns/debate.mjs:35-43` khoá chúng theo role).
- `CHECKER_ROLES` (`bind.mjs:19-24`, ép out-of-process theo tên role và tiền tố `panelist-`) được thay bằng posture.
- Stance ghi theo posture thành viên panel, không theo loại role (`role-tasks.mjs:100` trước đợt khoá theo `kind === 'panelist'`, đã bỏ).

### 7.2 Thứ tự launch

Ghế được bind và giữ chỗ theo thứ tự resolver liệt kê; mỗi binding được công bố lên seat ledger trước khi ghế kế bind; launch chỉ song song sau khi cả batch đã bind. Facade subprocess không được để ba producer đọc tập peer rỗng (trước đợt chỉ đúng vì bind-and-note chạy trong một đoạn đồng bộ, `role-ledger.mjs:13-17`; nay hàng đợi tuần tự của seat ledger bảo đảm).

### 7.3 Độc lập theo pattern

| Pattern | Mềm (spread, ưu tiên khác family) | Cứng (từ chối nếu không đạt) |
|---|---|---|
| solo | — | — |
| panel | các producer với nhau; synthesizer so với producer | — |
| reviewed | — | mỗi checker so với producer; ở high/critical, các checker đôi một |
| debate | hai bên | judge so với cả hai bên |

Luật cứng không đạt thì từ chối ghế `independence-unsatisfiable`, gọi tên các peer; `explain` in luật nào đã di chuyển một ghế.

## 8. Ghim và cờ `--provider`

- Ghim invocation (`family#invocation`, trong config `{executor, invocation}`) là cứng: invocation đã ghim không có thì từ chối ghế `pin-unsatisfiable` (hoặc bỏ candidate khi ghim thuộc override chạy-cả-run); không bao giờ âm thầm đổi invocation khác; `explain` in lý do. Chỉ entry không có invocation mới để transport chọn. (Một lần chạy từng thấy ghim `codex-cli-bwrap` của `code:review` bị thay bằng `codex-herdr`; điều đó thành từ chối.)
- Ghi chú cho diff cấu hình model sau: ghim `code:review` và `code:debug` (`codex-cli-bwrap`, `claude-cli-bwrap`, cạnh `confinement: {mode: required, policy: host-write-denied}`) là ứng viên gỡ, chỉ giữ yêu cầu confinement. Invocation herdr thoả yêu cầu đó lúc bind (mục 13), kèm caveat `herdr-partial-maturity` đã ghi.
- `fgos run --provider` giữ khoá theo executor đợt này; entry `{executor, invocation}` lo dạng ghim.

## 9. Chuyển đổi: một đợt, có điểm dừng

1. **Drain.** Đợt chỉ bắt đầu khi không còn `unit.json` trước hàng rào (không có `seatSchema`) mà controller còn sống. Doctor `seat-binding-drain` fail đúng trong trường hợp đó, liệt kê path, unit run, tuổi và controller của từng bản ghi: nó chạy xong trên release cũ, hoặc phiên giữ nó dừng. Bản ghi trước hàng rào không còn controller (`awaiting-resume`, `legacy-run`, không có trường `execution`) là thông tin, không chặn: sau đợt, resume bị từ chối `record-predates-seat-binding` và lịch sử của nó vẫn đọc qua đường đọc legacy; workflow run còn mở (parked ở gate hoặc running) cũng chỉ là thông tin. Không resume trước đợt và không thêm verb abandon. Check doctor là predicate dừng của đợt. (Erratum E3.)
2. **Hàng rào.** Config và `unit.json` mang version schema do release mới ghi. Activation cũ từ chối schema project mới thay vì bind sai (release cũ ném lỗi ở khoá `patterns.seatBinding` vì map `patterns` của nó chặt, và đòi `rigorToTier`; chứng minh bằng test hàng rào `test/setup/seat-binding-fence.test.mjs`, trên cả ba hình workspace và với file global còn `rigorToTier`).
3. **Release trước.** Build, stage, activate release mang crate, route và facade; doctor xác nhận route đã đăng ký trên host đã cài. Rồi mới migrate config project.
4. **`fgos setup` chuyển config project** tất định và idempotent, backup trước, in diff: xoá `rigorToTier`; thêm `mini` vào `tierFallback`; giữ cell chuỗi; ghi `$comment`; thêm `tier`/`maxTier`/`roles`/`personas`/`seats` của capability chỉ ở nơi câu trả lời khẩu vị cần. `prefer` giữ khoá và hình. Workflow core chuyển sang `seats:` tường minh cùng đợt.
5. **File global.** Khoá mới chỉ vào config project; file global không nhận khoá mới đợt này, nên các release đọc nó vẫn load được (`config.mjs:1364` từ chối khoá capability lạ).
6. **Rollback** = release trước và backup config trước migrate, cùng nhau.
7. **Hash.** `snapshotRunnerConfig` (`run.mjs:161-172`, trước đợt phủ capabilities, patterns, rigorToTier, modelPolicies, executors, governance) phủ thêm `defaults`, `maxTier`, `tierFallback` và bỏ `rigorToTier`.
8. **Doctor.** `model-policy-tier-coverage` và `workflow-pools-satisfy-independence` được thay bằng `seat-binding-dry-bind`: bind mọi ghế của mọi workflow đã đăng ký (cả workflow đóng gói) bằng cùng hàm, trong phiên headless cố định, không lease, không khởi động gì. Từ chối chính sách là fail; không có pool, trạng thái account, `max-tier-cap` và family dùng chung là thông tin. Cùng đợt có `seat-binding-route` (host trả lời route), `seat-binding-config` (config project ở schema mới; `$comment` lệch nguồn được báo, không fail) và `seat-binding-drain`; `mutating-assignment-binding-snapshot`, `runner-rigor-config` và `capability-rigor-ceiling` bị xoá.
9. **Bản ghi.** Spec này; hàng component-boundary; quyết định D-ADR0072 (Seat Binding: one authority for agent seat choice) supersede phần chọn ghế của sáu rule ở mục 15 (không sửa tại chỗ); spec runner và workflow trỏ về đây.

## 10. Ví dụ minh hoạ

### 10.1 Config dùng cho các ví dụ

```json
"defaults": { "tier": "standard" },
"maxTier": "flagship",
"capabilities": {
  "architecture:*": {
    "tier": "flagship", "rigor": "high",
    "prefer": ["claude", "openai", "gemini", "xai", "deepseek"],
    "roles": { "red-team": { "prefer": ["xai"] } }
  },
  "architecture:shape": {
    "rigor": "critical", "maxTier": "frontier",
    "seats": { "system": { "prefer": ["claude", "openai"] } }
  },
  "architecture:critique": { "maxTier": "frontier", "seats": { "producer": { "tier": "frontier" } } },
  "architecture:synthesize": { "rigor": "critical", "maxTier": "frontier", "seats": { "producer": { "tier": "frontier" } } },
  "group-cognition:*": { "prefer": ["claude", "openai", "gemini", "xai", { "executor": "glm", "invocation": "pi-cli-bwrap" }] }
}
```

`architecture:explain` không cần entry: nó kế thừa flagship từ prefix. Ghế critique nào mang frontier là khẩu vị; ví dụ đặt nó ở producer của critique. Tên model dưới đây là cell của config forgentX lúc duyệt.

### 10.2 `architecture-advisory` từ đầu đến cuối

Workflow (`shape-proposals` đã chuyển):

```yaml
- id: shape-proposals
  template:
    capability: architecture:shape
    pattern: panel
    blind: true
    seats:
      - { seat: system,      role: producer,    persona: system-lens, tier: frontier }
      - { seat: alternative, role: producer,    persona: alternative-lens }
      - { seat: constraint,  role: producer,    persona: constraint-lens }
      - { seat: synthesis,   role: synthesizer }
```

| Unit / ghế | Tier (nguồn) | maxTier | Executor → model | Độc lập |
|---|---|---|---|---|
| frame-context / producer | flagship (`architecture:*`.tier) | flagship (toàn cục) | claude → `opus` | — |
| shape / system | frontier (khuyến nghị workflow thắng `architecture:*`.tier) | frontier (cap) | claude → `fable` | panel mềm |
| shape / alternative | flagship (`architecture:*`.tier) | frontier | spread: openai → `gpt-6.1-sol` | mềm |
| shape / constraint | flagship | frontier | spread: gemini → `gemini-4-argon-high` | mềm |
| shape / synthesis | flagship | frontier | xai → `grok-4.6` (spread mềm: family ít peer nhất thắng; erratum E2) | mềm |
| critique / producer | frontier (khoá seat của cap) | frontier (cap) | claude → `fable` | — |
| critique / reviewer | flagship (prefix) | frontier | cứng ≠ claude: openai → `gpt-6.1-sol` | cứng so với producer |
| critique / red-team | flagship | frontier | `prefix.roles.red-team.prefer` → xai `grok-4.6` | cứng; đôi một ở high |
| synthesize / producer | frontier (khoá seat của cap) | frontier | claude → `fable` | — |
| synthesize / reviewer, red-team, tester | flagship (prefix); rigor critical → ba checker | frontier | openai; xai; tester → gemini | cứng, đôi một |
| explain / producer | flagship (prefix) | flagship | claude → `opus` | — |

**Biến thể A (ngân sách bằng mặc định capability).** Project đặt `"architecture:*": { "tier": "standard" }`. Ghế không có khuyến nghị workflow chạy standard; `system` giữ frontier, vì khuyến nghị workflow thắng `tier` của capability và prefix, miễn `architecture:shape.maxTier` cho phép.

**Biến thể B (ngân sách bằng trần).** Project không khai entry `architecture:shape` và giữ `maxTier: flagship` toàn cục. `system` giải ra frontier từ workflow rồi bị hạ: `tier flagship (max-tier-cap: maxTier = flagship, global), lowered from frontier (workflow:architecture-advisory/shape-proposals/system)`. Muốn giữ frontier cho ghế đó, đặt `capabilities."architecture:shape".maxTier = "frontier"`. Muốn ghim thấp hơn ở mọi nơi, đặt `capabilities."architecture:shape".seats.system.tier`.

**Biến thể C (từ chối).** Project đặt `"architecture:shape": { "seats": { "system": { "prefer": ["deepseek"] } } }` dưới biến thể B. Tier bị cap xuống flagship; deepseek không có cell flagship; `prefer` thay danh sách nên không còn candidate khác. Kết quả: `tier-cell-missing: shape-proposals/system flagship — no allowed executor has a cell; change capabilities."architecture:shape".seats.system.prefer or set capabilities."architecture:shape".seats.system.tier`.

Một dòng `explain` cho một ghế:

```
architecture-advisory / critique-proposals / red-team  (role red-team, capability architecture:critique)
  → xai grok-4.6 @ flagship, effort: invocation default (medium), account xai/<id>
    tier: capabilities."architecture:*".tier = flagship; maxTier: capabilities."architecture:critique".maxTier = frontier (not applied)
    prefer: capabilities."architecture:*".roles.red-team = [xai]; independence: ≠ producer(claude) ok, ≠ reviewer(openai) ok
    on failure: rotate xai accounts → tierFallback.flagship ∩ [xai] → none left: refuse
```

### 10.3 Debate: `group-cognition / dialectical-critique`

```yaml
- id: dialectical-critique
  template:
    capability: group-cognition:critique
    pattern: debate
    persona: critic
    seats:
      - { seat: thesis,     role: producer }
      - { seat: antithesis, role: producer }
      - { seat: judge,      role: judge, tier: flagship }
```

| Ghế | Tier (nguồn) | Chọn | Luật |
|---|---|---|---|
| thesis | standard (`defaults.tier`) | claude `sonnet` | hai bên mềm |
| antithesis | standard | spread: openai `gpt-5.6-terra` | hai bên mềm |
| judge | flagship (khuyến nghị workflow; ≤ `maxTier` toàn cục) | cứng ≠ claude, openai: gemini `gemini-4-argon-high` | judge cứng so với cả hai |

Round rebuttal: thesis và antithesis giữ executor + model + effort (mục 5.4 bước 6). Nếu gemini, xai và glm đều thiếu cell flagship dùng được, judge bị từ chối `independence-unsatisfiable`, gọi tên family của cả hai bên; glm (z-ai) không có cell flagship sau khi đổi ladder nên bị bỏ qua, không bao giờ bị hạ. Project có `maxTier: standard` toàn cục sẽ cap judge xuống standard, hiển thị (`max-tier-cap`).

### 10.4 Các câu trả lời khẩu vị còn lại thành dòng config

Owner đã chốt khẩu vị 2026-10-20 13:26: `shape-proposals` một ghế frontier (lăng kính system) và hai flagship; `architecture:explain` flagship; synthesis business và delphi standard; panel ý kiến dẫn bằng family rẻ (gemini, deepseek, glm); `code:review` và `code:debug` giữ codex rồi claude.

| Câu trả lời | Dòng |
|---|---|
| synthesis business/delphi standard | `"business:synthesize": {"tier": "standard"}`, `"delphi:synthesize": {"tier": "standard"}` |
| panel ý kiến dẫn rẻ | `"business:perspectives": {"prefer": ["gemini", "deepseek", "glm", "claude", "openai"]}` (tương tự cho capability panel ý kiến) |
| code review/debug codex rồi claude | `"code:review"`/`"code:debug"`: `{"prefer": [{"executor": "openai", "invocation": "codex-cli-bwrap"}, {"executor": "claude", "invocation": "claude-cli-bwrap"}]}` (dòng cấu hình sẵn có; xem ghi chú mục 8) |
| khẩu vị red-team theo mảng | `"code:*": {"roles": {"red-team": {"prefer": ["xai"]}}}`, `"marketing:*": {"roles": {"red-team": {"prefer": ["claude"]}}}` |

## 11. Bằng chứng phải có (proof list cho plan)

Plan của code change phải chứng minh mọi mục sau; không mục nào được bỏ:

- hai ghế producer resume riêng biệt;
- producer của panel không bao giờ chạy inline và không bao giờ ghi;
- judge của debate độc lập cứng với cả hai bên;
- bind panel đồng thời theo thứ tự với spread mềm;
- khuyến nghị workflow thắng `tier` của capability/prefix nhưng thua khoá seat, persona và role;
- tier đã giải cao hơn `maxTier` bị hạ kèm `max-tier-cap` và giá trị `loweredFrom` trong `explain`, record và evidence; `maxTier` capability cố ý cao hơn toàn cục thì qua;
- thiếu cell thì bỏ family, ghế không còn cell nào được phép thì từ chối gọi tên dòng config, ghim cứng thì từ chối;
- effort không hỗ trợ hoặc thấp hơn không thể nhận tier;
- `human-cli` không đáng tin không thể nâng tier hay `acceptDependence`;
- capability do tool executor phục vụ bind đúng như trước;
- một cuộc đua lease bind lại dưới cùng policy;
- replay ở cổng ghi sống sót sau một quarantine đến muộn hơn;
- persona liền kề chỉ che workflow hoặc domain của nó;
- stance vẫn ghi với ghế tường minh;
- số host exec khớp spec và bằng không dưới provider lock;
- chuyển đổi idempotent, và activation cũ từ chối schema project mới thay vì bind sai.

## 12. Không thêm

- cost accounting
- pattern cộng tác mới
- model evaluator
- API điều khiển thinking tổng quát
- phủ chế độ effort riêng của từng vendor
- walker thứ hai
- JS policy fallback khi thiếu route host
- `tierCeiling` trên frame
- đóng gói domain (tier domain mang theo, đợt sau)
- khoá `families`

`maxTier` (toàn cục và capability) là trần chi phí duy nhất của đợt này, nên trần đó và hiển thị `max-tier-cap` là thứ kiểm soát chi tiêu.

Lỗi sống ngoài spec này: `{objective}` rò vào `roleTasks` của checker trong `core/workflows/architecture-advisory.yaml`.

## 13. Bằng chứng xác minh (đọc-only, 2026-10-20)

Đây là bằng chứng hiện hành tại HEAD lúc duyệt (trước đợt triển khai), không phải hợp đồng; trạng thái sau triển khai ở mục 16 và 17. Bản đầy đủ: [bản nháp hợp nhất](../../plans/reports/spec-draft-261020-2028-seat-binding-component-consolidated.md) mục 11.

- **Effort theo CLI** (`REASONING_EFFORT_CONTROLS`, `provider-adapter.mjs:255-261`): claude `--effort` (low…max, xhigh); codex không có flag, qua `-c model_reasoning_effort=<v>` và adapter ánh xạ `max` → `xhigh`; pi `--thinking` và omp `--thinking=` (off…max); mọi CLI đã cấu hình render đủ `low, medium, high, max`. agy cài sẵn nhưng chưa cấu hình; grok chưa có ánh xạ; gemini chưa cài.
- **Không có đầu vào chứng thực con người** cho `fgos run` trực tiếp: `bin/fgos.mjs:2851`, `:2862`, `:2878`, `:2889`, `unit-handoff.mjs:198` tự gán `human-cli`, `bind.mjs:385` tin nó; Session Identity chỉ cho biết phiên nào ghi (`docs/platform/session-identity/spec.md:52`). Cửa mạnh nhất hiện có là consent gate của workflow (`case-verbs.mjs:167-184, 222-233`, `case-runtime.mjs:176-209`, `case-admission.mjs:153-160`); bản ghi của nó không mang identity người trả lời (`case-runtime.mjs:193`) nên tin theo quy ước.
- **Herdr và `confinement: required`:** thoả lúc bind (`confinement/policies.mjs:682-701, 717-744`; `codex-herdr` và `claude-herdr-bwrap` khai `backend: bwrap`); confinement authority vẫn ghi `herdr-partial-maturity` và IPC host nằm ngoài phạm vi (`confinement/authority.mjs:424-468`).
- **Một executor mỗi family:** doctor `executor-family-unique` có thật (`src/setup/registrations.mjs:1473`).
- **Đã đo khi triển khai (2026-10-21):** exec cost của facade Shape S trên host release, config 22 KB, một ghế: p50 3.71 ms, p95 4.23 ms; ngân sách (hai lần p95 của `identity`, 5.02 ms) đạt. Host debug của dev door không đạt (p95 6.76 ms): ngân sách tính trên host đã kích hoạt. Ba ghế panel một vòng: 3 exec, p50 11.5 ms, p95 15.5 ms. Seat Binding không exec dưới provider lock (test exec-budget). Số đo ở báo cáo phase 04 và 08.
- **Vẫn chưa xác minh:** tuyên bố vendor về tier, model, giá trong các cell, chỉ quan trọng cho diff làm mới model sau; effort pass-through của OpenRouter cho deepseek/z-ai.
- **Sau triển khai:** các mục "hôm nay" và "trước đợt" ở trên mô tả code trước 2026-10-21; code nay theo spec, con trỏ ở mục 16.

## 14. Điều kiện đảo quyết định

- Shape S đổi sang B: mục 4.2.
- Nâng tier qua override: mở lại khi có cửa chứng thực người, đầu tiên là consent gate của workflow (mục 5.5).
- Đổi luật "project thắng": chỉ owner; lý do gốc ở mục 15.

## 15. Lịch sử quyết định

### D-ADR0072 (Seat Binding: one authority for agent seat choice) — một authority cho ghế agent; project thắng; tier khai trực tiếp; supersede phần chọn ghế của RUL80 (an account is chosen first, then a CLI), RUL91 (a person may pin the provider account of a unit run), RUL98 (workflow start passes --timeout and --account to each Unit), RUL102 (a tier cell names its pool; one family has one executor), RUL103 (runner.maxTier caps every seat), RUL106 (a seat walks a tier declared order and its cell entries)

- **Trạng thái:** **Implemented (owner duyệt 2026-10-20 21:31, nguyên văn "ok, duyệt spec Seat Binding"; code land 2026-10-21).** Record chính thức ở "Lịch sử quyết định" của [runner.md](runner.md); mục này là bản tóm tắt trong spec khu vực. Code đi cùng plan của nó.
- **Bối cảnh:** mục 1. Quyết định chọn ghế bị tính ở nhiều nơi nên lệch nhau (`bind()`, `provider-capacity`, `assignment-policy`, cổng ghi, doctor, hai walker); `rigor` gánh ba việc; không có tầng ghế trong config.
- **Quyết định:**
  1. Một authority, Seat Binding, trả lời toàn bộ câu hỏi ghế agent (mục 3); crate Rust, route nội bộ, facade Node mỏng; chuyển đổi một đợt (mục 4, 9).
  2. Rigor chỉ quyết số checker và độc lập; `rigorToTier` bị xoá; tier khai trực tiếp trên sáu bậc định nghĩa theo bản chất việc; cell = model cộng effort tuỳ chọn (mục 5).
  3. Năm role; panel = N `producer` cộng `synthesizer`; workflow khai ghế tường minh và không khai `prefer` (mục 6.1, 7).
  4. Khẩu vị role sống trong config capability; `prefer` là khoá duy nhất; không có `families`, không có `domains`; chỉ ghế agent (mục 6.2).
  5. Chỉ con người nâng tier; đợt đầu không nâng bằng override (mục 5.5).
  6. Ghim `family#invocation` là cứng (mục 8); `--provider` giữ khoá theo executor.
  7. Project thắng, `maxTier` hạ hiển thị, từ chối chỉ khi thiếu cell (mục 5.4).
- **Câu trả lời owner đã định hình quyết định:**
  - **2026-10-20 20:39:** project thắng khuyến nghị tier của workflow (thay mặc định "floor thắng" của hội đồng). Nguyên văn: "cho project thắng đi. nếu không thắng thì hạn chế người dùng, tool của chúng ta sẽ không có người dùng luôn, nếu họ không có kinh phí là ko thể dùng." Ghim `family#invocation` là cứng.
  - **2026-10-20 21:06:** (A) `prefer` ở lại là khoá duy nhất, không `families`, Seat Binding chỉ cho ghế agent vì capability còn do tool executor phục vụ; (B) không nâng tier bằng override trong đợt đầu, chỉ qua config đã commit, nâng qua gate-subject là mục sau; (C) `tier` capability và prefix nằm dưới khuyến nghị workflow, `maxTier` hạ hiển thị, từ chối chỉ khi thiếu cell; drain cộng doctor stop; `--provider` giữ khoá theo executor.
  - **2026-10-20 21:23:** file persona không mang `prefer` hay `tier` (mục 6.4).
  - Khẩu vị theo mảng: 2026-10-20 13:26 (mục 10.4).
- **Supersede (một phần, không sửa tại chỗ):** phần chọn ghế của sáu rule sau trong [runner.md](runner.md) bị D-ADR0072 (Seat Binding: one authority for agent seat choice) thay: RUL80 (an account is chosen first, then a CLI), RUL91 (a person may pin the provider account of a unit run), RUL98 (workflow start passes --timeout and --account to each Unit), RUL102 (a tier cell names its pool; one family has one executor), RUL103 (runner.maxTier caps every seat), RUL106 (mỗi rule mang một dòng trỏ tới đây). Phần không phải chọn ghế của chúng (khuôn inventory và credential store, lease, lưu giá trị cờ) giữ nguyên. RUL102 (a tier cell names its pool; one family has one executor) trong `docs/specs/distribution.md` (soạn instruction) là một rule khác cùng số, không bị ảnh hưởng.
- **Đã thay thế trong quá trình duyệt:** "floor thắng" (20:39); "từ chối trên trần, không bao giờ cap" (giả định floor thắng); chuyển `prefer` thành `families` và cửa sổ deprecated của `prefer` toàn cục (21:06 A).
- **Điều kiện đảo:** mục 14.
- **Ranh giới:** đã đổi cùng đợt: hàng Execution Core của [component-boundary](../platform/component-boundary.md) không còn quyền chọn ghế; Seat Binding có hàng riêng.
- **Bằng chứng:** mục 13; bản nháp, báo cáo hội đồng, inventory và nghiên cứu ladder ở mục 16.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

## 16. Pointers

- Nguồn đã duyệt: [bản nháp hợp nhất rev 2](../../plans/reports/spec-draft-261020-2028-seat-binding-component-consolidated.md); lịch sử so sánh: [bản nháp đầu](../../plans/reports/spec-draft-261020-1017-seat-binding-component.md), [tổng hợp hội đồng](../../plans/reports/council-261020-1547-seat-binding-spec-review.md), [inventory nhu cầu và cơ chế](../../plans/reports/research-261020-0955-seat-binding-needs-and-mechanisms-inventory.md), [ladder tier theo family](../../plans/reports/research-261020-1339-model-family-tier-ladders.md). Chúng là record trạng thái, không phải hợp đồng; hợp đồng là spec này.
- Spec chủ liên quan: [runner.md](runner.md) (Execution Core, `bind()`, các RUL bị supersede một phần), [workflow.md](workflow.md) (khai ghế tường minh, admission, trần launch).
- Ranh giới component: [../platform/component-boundary.md](../platform/component-boundary.md).
- Session Identity (mẫu route nội bộ cho facade): [../platform/session-identity/spec.md](../platform/session-identity/spec.md).
- Triển khai (con trỏ, logic nằm ở mã và ở spec này):
  - Crate `fgos-seat-binding`: `packages/seat-binding/rust` (hai stage thuần, `tier.rs` là hằng ladder), vector vàng `packages/seat-binding/contracts/seat-binding.golden.v1.json`.
  - Route host `fgos internal seat-binding bind|ladder --protocol 1` (`apps/fgos/src/main.rs`); client Node `src/seat-binding/client.mjs` (fail closed, host kích hoạt trong release đã kích hoạt, từ chối khi đang giữ state lock).
  - Facade `src/runner/execution/bind.mjs` (`bind`, `explainSeat`; chỉ thu `launchView`, `accountView`), resolver ghế `seat-resolver.mjs`, ledger `seat-ledger.mjs`, đường đọc legacy `legacy-seat-read.mjs`, `dry-bind.mjs`.
  - Lease `acquireNamedAccountLease` và `auditLeaseReceipt` trong `src/runner/dispatch/provider-capacity.mjs`; mã lỗi `provider-capacity-lease-conflict` (`run-result.mjs`).
  - Config và chuyển đổi: `src/runner/dispatch/config.mjs` (schema, sanitizer của lớp global), `src/setup/seat-binding-conversion.mjs` (bước file của `fgos setup`), doctor `seat-binding-route|config|drain|dry-bind` (`src/setup/seat-binding-checks.mjs`, `registrations.mjs`).
  - Ngân sách exec: mục 13 (số đo phase 04 và 08).

## 17. Erratum (điều đợt triển khai chứng minh là sai, kèm bằng chứng)

- **E1. Thành phần `reviewed` theo ghế checker, không theo role** (mục 7.1, đã sửa tại chỗ). `tester` là ghế riêng, role `reviewer` chỉ để tra khẩu vị, posture không phải verdict. Bằng chứng: `CHECKER_SEATS` trong `src/runner/execution/seat-resolver.mjs`; `test/runner/execution/seat-resolver.test.mjs`.
- **E2. Ví dụ 10.2, ghế `shape / synthesis`** (đã sửa tại chỗ). Luật spread "family ít peer nhất" chọn xai (còn cell flagship chưa dùng), không phải claude. Bằng chứng: báo cáo crate `plans/reports/phase-lead-261020-2215-seat-binding-phase-01-crate.md` mục 5; `packages/seat-binding/rust/src/rank.rs`.
- **E3. Predicate drain** (mục 9 bước 1, đã sửa tại chỗ). Chỉ controller còn sống mới chặn; bản ghi trước hàng rào không controller là thông tin. Bằng chứng: phase 00 (28 `awaiting-resume`, 2 `legacy-run`, 81 không có `execution` trên forgentX) trong `plans/reports/phase-lead-261020-2215-seat-binding-phase-00-facts.md` mục 8; `test/setup/seat-binding-checks.test.mjs`.
- **E4. Receipt và doctor replay** (mục 6.x, đã sửa tại chỗ). Cổng ghi replay; receipt được đối chiếu với record provider lúc settle, không phải doctor, vì doctor bind không có lease và cổng chạy trước lease của chính lượt đó. Row doctor replay bị xoá. Bằng chứng: `auditLeaseReceipt` ở `src/runner/dispatch/provider-capacity.mjs`, `test/runner/provider-pool-lease.test.mjs`.
- **E5. `$comment`** (mục 5.1). Doctor báo `$comment` khác nguồn nhưng không fail; `$comment` vắng không phải lệch; `fgos setup` làm mới `$comment` lệch (có backup). Bằng chứng: `test/setup/seat-binding-checks.test.mjs`, `test/setup/seat-binding-conversion.test.mjs`.
- **E6. Lease conflict có mã lỗi riêng.** Lease từ chối tài khoản mà bind đã chọn settle thành `provider-capacity-lease-conflict`; bản ghi cũ giữ `provider-capacity-refused`. Bằng chứng: `test/runner/assignment-dispatch.test.mjs`, `test/runner/execution/unit-run-outcome.test.mjs`.
