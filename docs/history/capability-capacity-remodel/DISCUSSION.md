---
item: tsk-34n
---

# DISCUSSION.md — capability-capacity-remodel

## 1. Trạng thái hiện tại

**Hội tụ — round 5, mọi điểm đã chốt.** Toàn bộ 7 vấn đề ở §3 đã RÕ, 4
D-ID đã mint ở §4. Người xác nhận cuối: đồng ý cách config capability như
đề nghị, giữ `for` (symmetry cho `prefer`), chuyển `fgos-coding-implement`
thành capability. Chuẩn bị bàn giao sang `fgos-coding-exploring` →
`fgos-coding-planning` (native-first, cùng phiên này).

## 2. Mục tiêu & đề bài

Mô hình lại `.fgos/config.json`'s `runner.capabilities`/`capacities` cho
đúng bản chất thay vì duplicate config: `fgos-coding-implement` không
phải một backend/agent riêng — nó là một **capability/purpose** (đại
diện công việc code-implement của stage `executing`), và `agy` mới là
**capacity** thật sự phục vụ nó. fgOS đã có sẵn đúng mô hình này ở nơi
khác (`gitnexus.for:["impact-analysis"]`, `herdr.for:["pane-labeling"]`)
nhưng chokepoint `capacityIdForWork`/`spawnWorker`/`decide --work` chưa
bao giờ đi qua cửa `for` (`resolveCapacityIdForPurpose`) — nó tra thẳng
`cfg.capacities[capacityId]` theo key literal. Mục tiêu của cuộc thảo
luận này: chốt hình dạng đúng cho việc thêm fallback đó, xử lý xong việc
ambiguous/override, và hiểu rõ tác động thật lên `fgos-fanout` trước khi
khoá bất kỳ quyết định nào.

## 3. Vấn đề rõ / chưa rõ

| # | Vấn đề | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | `fgos-fanout` hiện có bị vô hiệu hoá thật cho mọi coding item không, do config `fgos-coding-implement`→`agy` đã set + `tsk-pdg` đã merge? | **RÕ — xác nhận sống** | `decide --work tsk-49o --has-live-task-access` (tsk-49o là item coding thật, đang mở) → `{"mechanism":"out-of-process","configured":true}` trên chính repo này, ngay bây giờ. Theo `fgos-fanout/SKILL.md`'s own logic (dòng ~110-118): bất kỳ mechanism nào khác `in-process` → item bị báo "cần người", KHÔNG tự bắn Agent. Tức mọi lần `fgos-fanout` chạy từ giờ, KHÔNG có candidate coding nào được bắn native cả — 100% rơi về "cần người". |
| 2 | `resolveCapacityIdForPurpose` xử lý ambiguous (nhiều capacity cùng `for` trùng purpose) thế nào? | RÕ | `src/runner/dispatch.mjs:1023-1029` — vòng `for...of Object.entries`, trả `id` đầu tiên khớp, không lỗi, không cảnh báo. Thứ tự phụ thuộc thứ tự key trong object (JS: thứ tự insertion cho string key). |
| 3 | Có nên giữ khả năng override bằng key literal không (một item tự đặt `capacities.<đúng-tên-purpose>` riêng để ép dùng backend khác)? | **RÕ** | Giữ — literal key luôn thắng trước (không đổi hành vi cũ), `for`/`prefer` chỉ là fallback khi không có literal. Xác nhận gián tiếp ở round 4: người chọn Hướng B (`overrides` nhẹ) thay vì bỏ hẳn literal-key-escape-hatch — literal key vẫn là chỗ dùng khi cần tuỳ biến SÂU (đổi cả `command`/`args`), `overrides` chỉ dành cho tuỳ biến NÔNG (model/tier). Hai cơ chế bổ sung nhau, không thay thế. |
| 4 | Phạm vi: chỉ `fgos-coding-implement`/`agy`, hay MỌI stage-skill-tên-làm-capacityId trong tương lai (mọi domain khác `coding` sau này)? | **RÕ** | `capacityIdForWork` đã tổng quát hoá theo domain (`getDomain(work.domain)`), không hardcode `coding` — fix ở đúng layer resolve (`decideCapacityCli`'s `--work` branch) tự động phủ mọi domain tương lai, không cần domain nào đặc cách. |
| 5 | Có cần gỡ gấp config `fgos-coding-implement` khỏi `.fgos/config.json` sống trong lúc chờ remodel, để không chặn `fgos-fanout`? | **RÕ** | Người quyết (round 2): không cần — team chưa từng dùng `fgos-fanout` trong plan thật, việc nó tạm báo "cần người" không gây thiệt hại. Giữ nguyên config, đi tiếp remodel bình thường. |
| 6 | `capabilities.<purpose>` có `prefer`/`overrides` — field nào được phép override? | **RÕ (round 4)** | Người chọn Hướng B. Chỉ `rigorOverrides`/`providerModel`/`tier`/`model` — KHÔNG BAO GIỜ `command`/`args`/`adapter`/`invocations` (giữ nguyên chủ nghĩa "một backend, một chỗ định danh lệnh thật" của 0026, tránh lỗ hổng sổ sách command-vs-provider từng bàn ở nơi khác). Ví dụ thật: `agy.rigorOverrides` ép mọi tier về `lightweight` (vì `modelPolicies.gemini` sống hiện chỉ khai đúng 1 policy tier) — một purpose khác dùng chung `agy` nhưng muốn leo tier cao hơn (khi `modelPolicies.gemini` có thêm tier) sẽ khai `overrides.rigorOverrides` riêng, không đụng `agy`'s default. |
| 7 | `prefer` có bắt buộc capacity được trỏ tới vẫn phải tự khai `for` chứa đúng purpose đó không (symmetry)? | **RÕ (round 5)** | Người quyết: giữ `for` — symmetry bắt buộc. `prefer` chỉ là tie-breaker giữa các capacity đã tự khai `for`, không phải cách "gán" một capacity chưa từng tự nhận phục vụ purpose đó. |

## 4. Quyết định đã chốt

| D-ID | Tóm tắt | Ghi chú |
|---|---|---|
| D1 | Literal-key lookup luôn thắng trước, không đổi hành vi cũ; `for`/`prefer` chỉ là fallback additive | §3 câu 3 |
| D2 | `capabilities.<name>` thêm `prefer` (symmetry bắt buộc) + `overrides` (chỉ `rigorOverrides`/`providerModel`/`tier`/`model`, không bao giờ `command`/`args`/`adapter`) | §3 câu 6/7 |
| D3 | Migrate `fgos-coding-implement`: xoá entry duplicate, `agy.for:["fgos-coding-implement"]`, đăng ký capability với `prefer:"agy"` | §3 câu khởi sinh cuộc thảo luận |
| D4 | Một hàm dùng chung áp toàn bộ thứ tự resolve — cả `spawnWorker`'s own model lookup lẫn `resolveExecutorConfig`'s lookup đều gọi hàm này, không tự tra `cfg.capacities[capacityId]` riêng nữa | Phát hiện sống: `spawnWorker` có lookup riêng, sửa nửa vời sẽ lệch model/command âm thầm |

Mỗi D-ID trên đã ghi qua `fgos decision --id tsk-34n` (seq 18699-18702).

## 5. Q&A log

- **2026-08-16, round 1 (session tự scout, chưa hỏi người):** Đọc
  `src/runner/dispatch.mjs:1023-1029` (`resolveCapacityIdForPurpose`),
  `:1512-1515` (`capacityIdForWork`), `:1173-1180`
  (`decideCapacityDispatchMechanism`, vừa sửa bởi `tsk-pdg`), và
  `.agents/skills/fgos-fanout/SKILL.md` dòng ~105-120 (logic đọc kết quả
  `decide --work`). Chạy sống `decide --work tsk-49o --has-live-task-access`
  trên repo thật, xác nhận vấn đề #1 ở bảng trên là thật, không phải suy
  đoán.
- **2026-08-16, round 2:** Hỏi có cần gỡ gấp config `fgos-coding-implement`
  khỏi `.fgos/config.json` sống không (chặn `fgos-fanout` cho mọi coding
  item). Người trả lời: không cần, team chưa từng dùng `fgos-fanout`
  trong plan thật.
- **2026-08-16, round 3:** Trình bày phân tích câu #3 (literal key nên là
  fallback-order tự nhiên, không phải tính năng cần thêm/bớt).
- **2026-08-16, round 4:** Người đề xuất `prefer` trên capability để phá
  ambiguous, và hỏi thêm case "1 capacity dùng cho nhiều capability khai
  báo sao" (đã có sẵn — `for` là array, dẫn `dispatch.mjs:695-699`).
  Người tiếp tục đề xuất `prefer` nên cho phép override/customize config
  riêng cho capability (ví dụ `fgos-coding-implement` dùng `agy` với
  `modelTier` riêng). Trình bày 2 hướng (A: dùng literal-key escape-hatch
  có sẵn, không cần cơ chế mới; B: thêm `overrides` nhẹ trên capability,
  merge nông lên capacity, chỉ cho field model/tier). Người chọn **B**,
  hỏi thêm `rigorOverrides` là gì — giải thích dựa trên
  `dispatch.mjs:482-495` (`DEFAULT_TIER_TO_POLICY`,
  `MODEL_POLICY_TIERS`) và `agy`'s rigorOverrides thật trong config sống.
- **2026-08-16, round 4b (tangent):** Người hỏi vì sao `work.tier` không
  dùng thẳng 5 giá trị `MODEL_POLICY_TIERS` cho gọn — giải thích `TIERS`
  (3 giá trị) dùng chung cho `gate-bypass`/`priority-formula`/`HEAVY_RISK`,
  không riêng model dispatch. Người hỏi tiếp risk có khớp map vào tier
  không — soát `classify.mjs`/`risk-keywords.mjs` thật, phát hiện `tier`
  cơ học lúc submit đo RỦI RO-THEO-DOMAIN (`HEAVY_KEYWORDS`), không đo
  quy mô — tách riêng thành `tsk-41b2` (không thuộc feature này).
- **2026-08-16, round 5:** Người xác nhận cuối: đồng ý cách config
  capability như đề nghị, giữ `for` (symmetry), chuyển
  `fgos-coding-implement` thành capability. Mint D1-D4.

## 6. Thiết kế đã chốt {#design}

**Bối cảnh.** `fgos-coding-implement` hôm nay là một `capacities.<id>`
entry riêng, duplicate y nguyên shape của `agy` — sai bản chất: nó là
công việc (capability/purpose) của stage `executing`, không phải một
backend khác. Chokepoint thật (`capacityIdForWork` →
`resolveExecutorConfig`/`decideCapacityDispatchMechanism`/
`decideCapacityCli`'s `--work` branch) tra `cfg.capacities[capacityId]`
theo key literal, chưa từng đi qua cửa `for`/`resolveCapacityIdForPurpose`
mà `gitnexus`/`herdr` đã dùng đúng.

**Thứ tự resolve mới** (thêm đúng 1 fallback vào chỗ hôm nay chỉ có 2
nhánh: key literal → native-default):

```
1. capacities.<capacityId> tồn tại?  → dùng thẳng (KHÔNG ĐỔI hành vi cũ —
   đây là escape-hatch cho tuỳ biến SÂU: command/args khác hẳn)
2. không có → capabilities.<capacityId>.prefer trỏ vào một capacity
   ĐÃ TỰ khai for:[...capacityId...]?  → dùng capacity đó, merge nông
   capabilities.<capacityId>.overrides (chỉ rigorOverrides/providerModel/
   tier/model — KHÔNG BAO GIỜ command/args/adapter/invocations) lên trên
3. không có prefer, quét for:[...] tìm capacity đầu tiên khớp (hành vi
   resolveCapacityIdForPurpose hôm nay, không đổi khi không dùng prefer)
4. vẫn không có → native-default cũ (0026 rule 2, đã thu hẹp bởi 0033)
```

**`capabilities.<name>` shape mới** (mở rộng `{description?, aliases?}`
hôm nay):

```json
{
  "description": "...",
  "aliases": ["..."],
  "prefer": "agy",
  "overrides": { "rigorOverrides": { "standard": "creative" } }
}
```

`prefer` là tie-breaker khi nhiều capacity cùng `for` — capacity được trỏ
tới VẪN PHẢI tự khai `for` chứa đúng purpose này (symmetry, D2 — đã
chốt). `overrides` merge nông lên object capacity đã resolve, chỉ áp
dụng khi resolve qua bước 2/3 (KHÔNG áp dụng khi resolve qua bước 1 —
literal key tự nó đã là tuỳ biến đầy đủ, không cần override chồng thêm).

**Migration cho `fgos-coding-implement`/`agy` cụ thể** (đúng case khởi
sinh cuộc thảo luận): xoá `capacities.fgos-coding-implement` (duplicate),
thêm `"for": ["fgos-coding-implement"]` vào `agy`, đăng ký
`capabilities["fgos-coding-implement"] = {description: "...", prefer:
"agy"}`. Không cần `overrides` ngay bây giờ — `agy` hôm nay đã đúng tier
mong muốn cho purpose này (không có lệch nào để override).

**Chỗ code cần sửa** (đã xác định chính xác qua scout):
- `validateCapabilitiesShape` (`dispatch.mjs:787`) — thêm validate
  `prefer` (string, phải trỏ tới một `cfg.capacities` id có thật VÀ id đó
  tự khai `for` chứa đúng tên capability này) và `overrides` (object,
  key giới hạn đúng 4 field cho phép, mỗi field validate lại đúng luật
  field gốc đã có — tái dùng, không viết luật mới).
- `resolveCapacityIdForPurpose` hoặc một hàm mới cạnh nó — áp bước 2/3 ở
  trên, trả về `{capacityId, overrides?}` thay vì chỉ `capacityId` (chữ
  ký đổi, mọi call site hiện tại của `resolveCapacityIdForPurpose` cần
  soát lại).
- `decideCapacityCli`'s `--work` branch (`dispatch.mjs:1886-1890`) —
  thêm bước 2/3 vào đúng giữa bước 1 (đã có) và bước 4 (đã có).
- `resolveExecutorConfig`/`decideCapacityDispatchMechanism` — cần nhận
  `overrides` (khi có) và merge nông lên object capacity trước khi dùng,
  ở đúng điểm trước khi gọi `modelForTier`.

**Phát hiện quan trọng — `spawnWorker` có 2 lookup riêng biệt, không chỉ
1.** Soát lại kỹ (`dispatch.mjs:1577-1579`): `spawnWorker` tự tra
`cfg.capacities[capacityId]` MỘT LẦN NỮA, riêng, để tính `model`
(`capacityForTier?.providerModel`/`rigorOverrides` truyền vào
`modelForTier`) — TÁCH BIỆT với lookup bên trong `resolveExecutorConfig`
(dùng cho `command`/`args`). Đây là đường headless thật (`fgos loop`,
đã live-proved ở `tsk-1m8`) — nếu chỉ sửa `resolveExecutorConfig` mà
không sửa lookup riêng này, sau khi xoá `capacities.fgos-coding-implement`
(duplicate), `capacityForTier` sẽ là `undefined` → `model` tính sai
(rơi về policy `claude` mặc định thay vì `gemini`), trong khi `command`
vẫn đúng `agy` — lệch âm thầm giữa model và command thực sự spawn.

**Sửa đúng**: cần MỘT hàm dùng chung (`resolveCapacityForId(cfg,
capacityId)` hay tên tương đương) áp toàn bộ bước 1-4 ở trên, trả về
`{capacity, capacityId}` đã resolve xong (kể cả `overrides` đã merge) —
cả `spawnWorker`'s lookup riêng LẪN `resolveExecutorConfig`'s lookup nội
bộ đều gọi hàm này, không tự tra `cfg.capacities[capacityId]` trực tiếp
nữa ở cả hai chỗ. Không làm vậy thì fix chỉ đúng một nửa, và nửa còn lại
(`spawnWorker`'s own model calc) sẽ lệch âm thầm — đúng loại lỗi
`docs/decisions/0026`'s governance doc từng cảnh báo (sổ sách nói một
đằng, thực thi một nẻo).

## 7. Danh mục hạng mục / task {#tasks}

Một mảnh, không chia — toàn bộ nằm gọn trong `src/runner/dispatch.mjs` +
`.fgos/config.json`'s hai section liên quan, không đụng file nào khác.

### {#task-capability-prefer-overrides}

- **Mục tiêu**: thêm fallback `for`/`prefer`/`overrides` vào đúng
  chokepoint resolve capacity (§6), rồi migrate `fgos-coding-implement`
  sang mô hình mới, xoá duplicate.
- **§6 excerpt**: toàn bộ "Thứ tự resolve mới" + "Chỗ code cần sửa" ở
  trên.
- **D-ID áp dụng**: D1, D2, D3, D4 (toàn bộ §4)
- **Quan hệ sibling**: không có task khác trong cùng feature này.
- **Verify nháp**: `npm test` (regression, phải xanh) + một assertion
  sống: `resolveCapacityIdForPurpose`-mới (hoặc hàm thay thế) trả đúng
  `agy` cho purpose `fgos-coding-implement` sau khi xoá duplicate entry,
  và `decide --work <coding-item>` vẫn trả `out-of-process`/`configured:
  true` y hệt trước migration (không regress hành vi `tsk-pdg` vừa sửa).
