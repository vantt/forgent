---
type: explanation
title: 0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model D1-D3)
tags: []
timestamp: 2026-08-04T00:00:00.000Z
source_capture_ids: []
date: 2026-08-04
status: accepted
supersedes: [2ae492d8]
relates_specs: [work-state]
---

# 0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model D1-D3)

## Bối cảnh

`base-workflow-model` (git content-hash `2ae492d8`) không tồn tại như một file
`docs/decisions/` đánh số riêng — nó chỉ sống dưới dạng trích dẫn nội tuyến
`per base-workflow-model D1-D3 / 2ae492d8` ở đúng 3 chỗ trong code/spec hôm
nay: `docs/specs/work-state.md` dòng 61 (Data Dictionary #21, field `domain`)
và dòng 1070 (RUL35), và file header của `src/state/workflow-stage-graphs.mjs`
dòng 1-2. Record này supersede đúng nguyên văn đó — không có id đánh số nào
khác để trỏ tới, nên `supersedes` khai thẳng content-hash `2ae492d8`, đúng
khuôn trích dẫn mà `work-state.md`/`workflow-stage-graphs.mjs` đã tự dùng, thay
vì bịa một id `00NN` không có thật.

**Luật gốc (D1-D3, nguyên văn từ `work-state.md` dòng 1070, RUL35):** "Một
domain khai đúng ba thứ: danh sách stage có thứ tự, step-mapping (bước nào
trong 5 bước base-workflow mỗi stage thỏa), và cạnh chuyển-stage hợp lệ riêng
của nó — domain KHÔNG BAO GIỜ chi phối bảng chuyển-status (`fsm.mjs`), tách
bạch tuyệt đối khỏi `status`." Nói cách khác: `stage` (vĩ mô — domain tự khai
qua `DOMAINS` registry, `workflow-stage-graphs.mjs`) và `status` (vi mô — một
bảng `TRANSITIONS` PHẲNG duy nhất trong `status-fsm.mjs`, dùng chung cho MỌI
domain, không domain nào override) là hai trục tách biệt tuyệt đối. Domain
`coding` và `synthetic` hôm nay (`workflow-stage-graphs.mjs` dòng 51-91) đúng
là ví dụ sống của vế đầu (`DOMAINS[domain].stages/stepMap/transitions`); vế
sau (status) chưa từng có tương đương — `status-fsm.mjs`'s `TRANSITIONS`
(24 cạnh) và `work.mjs`'s `STATUSES` (10 giá trị: `todo`/`doing`/`blocked`/
`awaiting-approval`/`awaiting-human`/`delivered`/`retrospective`/`cleanup`/
`done`/`wontfix`) là hằng số toàn cục duy nhất, không tham số hoá theo
`work.domain` ở đâu cả.

**Vì sao bị revise:** `tsk-38t` (multi-domain schema, Phase 2) cần một domain
sản xuất thật thứ hai (vd `marketing`) tự khai nhãn/luồng trạng thái riêng mà
không phải học/đụng 10 chữ coding-flavored, đồng thời giữ cho các cơ chế
domain-agnostic của fgOS (frontier dep-resolve, rollup, outcome/friction,
discovery-judge, compound-learn trigger) có một cách đọc "item đang ở đâu"
không phụ thuộc từ vựng domain. Bản thân report nguồn
(`plans/reports/research-260730-0931-work-item-schema-multi-domain-upgrade-report.md`,
round 4) ban đầu kết luận **"domain sở hữu TOÀN BỘ bảng transition"** — một
khung rộng hơn record này thật sự chốt. Khung đó đã bị xét lại và THU HẸP
trong phiên `fgos-exploring` cho `tsk-38t`
(`docs/history/phase-2-status-category-schema/DISCUSSION.md`, đọc toàn văn):
§1 tự ghi nhận "Đây là thu hẹp thật so với kết luận round-4 của report gốc
('domain sở hữu TOÀN BỘ bảng transition') — thu hẹp lại đúng phạm vi domain
thật sự cần tự khai (đoạn đầu vòng đời)". D1 (chốt vòng 3, seq 5571, xác nhận
người dùng nguyên văn: "đúng, mỗi phần domain sẽ có status/stage trước deliver
là chắc chắn khác nhau. nhưng retro không có status khác nhưng sẽ có cách học
khác (skill), cleanup cũng sẽ có cách dọn khác (skill)") là quyết định thật sự
được chốt — record này formalize đúng D1, không phải khung rộng ban đầu của
report.

## Quyết định

**Phạm vi supersede CHÍNH XÁC — chỉ ĐOẠN ĐẦU, không phải toàn bộ FSM.** 10
status hôm nay chia làm hai nhóm bản chất khác nhau, theo tiêu chí "domain có
được tự đặt nhãn/cạnh chuyển khác cho status này không" (D1, DISCUSSION.md §6):

- **NHÓM ĐẦU — 6 status TRƯỚC `delivered`:** `todo` / `doing` / `blocked` /
  `awaiting-human` / `awaiting-approval` / `wontfix`. Kể từ record này, domain
  SỞ HỮU nhãn + bảng transition riêng cho nhóm này — đây là phần thật sự
  supersede D1-D3 của `base-workflow-model`. Domain KHÔNG BẮT BUỘC đổi tên
  (coding giữ nguyên cả 6 chữ, 0 migration, D2) — D1/D2 chỉ trao QUYỀN, không
  ép dùng.
- **NHÓM ĐUÔI — 4 status TỪ `delivered` trở đi:** `delivered` → `retrospective`
  → `cleanup` → `done`, chuỗi TUYẾN TÍNH cố định. KHÔNG domain nào được
  relabel — đây là nghĩa vụ phổ quát của bất kỳ loại hình việc nào (delivery
  thật, nhìn lại, dọn dẹp), không phải từ vựng riêng của `coding` (D1, xác
  nhận trực tiếp: "loại hình việc nào cũng cần delivery, retro, và cleanup...
  chỉ có tổ chức nào quá hời hợt sẽ bỏ qua retro và cleanup"). Khác biệt
  per-domain ở nhóm này nằm ở **skill nào chạy** bước `retrospective` (D5: mở
  rộng đúng field `skillMap` đã có trong `DOMAINS[domain]`,
  `workflow-stage-graphs.mjs`, thêm key `retrospective`; `cleanup` giữ nguyên
  pure-harness, không cần skill — khác biệt per-domain của nó đã đủ qua field
  `worktreeBacked` có sẵn), KHÔNG phải ở tên/cạnh chuyển status.

Bảng map 6 status đoạn đầu → `statusCategory` (D2+D3, field foundation mới,
đóng băng lúc ghi event `work.move`/`work.add`, **KHÔNG derive-on-read** —
luật L3, `docs/platform-foundations.md`):

| status (đoạn đầu) | statusCategory |
|---|---|
| `todo` | `todo` |
| `doing` | `in-progress` |
| `blocked` | `in-progress` |
| `awaiting-human` | `in-progress` |
| `awaiting-approval` | `review` |
| `wontfix` | `canceled` |

`statusCategory` là **bản nén có mất mát, đã chứng minh lủng** — KHÔNG được
dùng để validate move: cạnh `blocked → awaiting-human` không tồn tại trong 24
cạnh thật của `status-fsm.mjs` hôm nay, dù cả hai status cùng rơi vào category
`in-progress`; validate ở tầng category sẽ tự động legalize sai cạnh này.
Validate move vẫn luôn đi qua bảng transition ĐẦY ĐỦ, MỊN của chính domain đó
(`status-fsm.mjs` hôm nay cho `coding`) — `statusCategory` chỉ phục vụ các cơ
chế domain-agnostic (frontier `ready`-filter, rollup, outcome/friction,
discovery-judge) đọc "item đang ở nhóm nào" mà không cần học từ vựng của từng
domain.

4 status đoạn đuôi **KHÔNG cần** `statusCategory` — literal status đã đủ dùng
mãi mãi cho mọi domain, không có khái niệm "domain tự đặt nhãn cho `delivered`"
để cần nén.

Ngoài phạm vi supersede D1-D3 (tách bạch nêu trên, không phải quyết định mới):
D6 thêm field optional `domainFields: { [domainName]: {...} } }` trên work item
cho dữ liệu nested per-domain, optional-additive, ghi đè toàn object mỗi lần
`edit` (latest-wins, cùng khuôn `refs`/`deps`/`acceptance`), validate qua
`fieldSchema` optional khai trong `DOMAINS[domain]` nếu domain có khai — pattern
độc lập với phần status/category ở trên, KHÔNG được implement trong record này
(ngoài phạm vi `tsk-38t-1`, thuộc `tsk-38t-2` trở đi).

## Audit: mọi consumer thật của `status-fsm.mjs`/`STATUSES`/`TRANSITIONS`/literal status hôm nay

Quét bằng `rg -n "STATUSES|TRANSITIONS" src/ bin/ --glob '*.mjs'` và
`rg -n "'todo'|'doing'|'blocked'|'awaiting-approval'|'awaiting-human'|
'delivered'|'retrospective'|'cleanup'|'wontfix'"` trên `frontier.mjs`,
`retro-pool.mjs`, `status-fsm.mjs`, `runner/*.mjs`, `bin/fgos.mjs` — cộng thêm
quét mở rộng ra mọi consumer thật của tập `RESOLVED_STATUSES` (đã là 1 tập
"giống category" viết tay, DISCUSSION.md §3 #3) và ra khỏi thư mục `src/`/`bin/`
(CLI-display doc, external Rust consumer) để không bỏ sót theo đúng yêu cầu
acceptance của `tsk-38t`. Cột "Đổi?" nói rõ consumer này có cần đổi sang đọc
`statusCategory` (hoặc bảng transition riêng của domain) hay giữ nguyên literal
mãi mãi theo đúng ranh giới đầu/đuôi vừa chốt ở trên.

### 1. Nguồn sự thật (định nghĩa STATUSES/TRANSITIONS)

| File:line | Vai trò | Đổi? |
|---|---|---|
| `src/state/work.mjs:83-94` | `STATUSES` — 10 giá trị hợp lệ, nguồn duy nhất (`status-fsm.mjs` re-export, không định nghĩa lại) | Có — trở thành union của "10 giá trị coding" thay vì hằng số toàn cục duy nhất; domain khác khai `statusLabels` riêng trong `DOMAINS[domain]` (mở rộng `workflow-stage-graphs.mjs`, chưa tồn tại — `tsk-38t-2`) |
| `src/state/work.mjs:205-207` | `validateWork` — chặn `work.status` ngoài `STATUSES` (phạm trù `validation`) | Có — phải đọc bảng transition/label của `work.domain`, không phải hằng số toàn cục |
| `src/state/status-fsm.mjs:99-152` (`TRANSITIONS`, 24 cạnh) | Bảng chuyển-status PHẲNG duy nhất, validate mọi `transitionWork()` | Có, nhưng CHỈ phần đoạn đầu (19/24 cạnh chạm 6 status đoạn đầu) — 5 cạnh đoạn đuôi (`delivered→retrospective`, `retrospective→cleanup`, `cleanup→done`, `cleanup→blocked`, `blocked→delivered`) giữ nguyên, dùng chung mọi domain |
| `src/state/status-fsm.mjs:193-256` (`transitionWork`) | Hàm validate + sinh event, đọc `TRANSITIONS` trực tiếp | Có — cần tham số hoá theo `work.domain` cho phần đoạn đầu |

### 2. `RESOLVED_STATUSES` (tập "giống category" viết tay, trộn cả 2 nhóm)

`src/state/frontier.mjs:186` khai `RESOLVED_STATUSES = new Set(['delivered',
'retrospective', 'cleanup', 'done', 'wontfix'])` — trộn 4 status ĐUÔI (cố
định) với `wontfix` (ĐẦU, domain-owned label nhưng luôn map `canceled`, D2).
Đây chính là hệ quả DISCUSSION.md §6 "Hệ quả 1" đã lường trước: khi hiện thực
hoá, chỗ này phải đọc HỖN HỢP — literal cho 4 tên đuôi + `statusCategory ===
'canceled'` cho phần thay `wontfix` (để bắt được cả label khác domain map vào
cùng category) — không còn là 1 Set string thuần.

| File:line | Vai trò | Đổi? |
|---|---|---|
| `src/state/frontier.mjs:107,128,186,202` | Định nghĩa + dùng cho `ready`-filter dep-resolve và `hasOpenDescendant` | Có — hỗn hợp literal-đuôi + category-canceled, như trên |
| `src/state/frontier.mjs:92` | `item.status !== 'todo'` — cạnh CÒN LẠI của `ready`-filter, literal `todo` (đoạn đầu) | Có — phải đọc `statusCategory === 'todo'` để domain khác dùng nhãn khác cho "chưa bắt đầu" vẫn được nhặt |
| `src/state/graph-metrics.mjs:15,298,358,378,401,406` | Import `RESOLVED_STATUSES`, đếm dep-blocked/not-done cho `graph`/`triage`/`stale` verb | Kế thừa tự động từ thay đổi ở frontier.mjs (chỉ gọi `.has()`, không tự literal-compare) — cần đổi CHỮ KÝ gọi nếu `RESOLVED_STATUSES` đổi từ Set sang hàm `isResolved(item)` |
| `src/state/graph-harness.mjs:22,103,106,108,143,154` | Import `RESOLVED_STATUSES`, gate `deps`/`mergeAfter` sẵn sàng cho `evolve`/dispatch | Như trên — kế thừa, đổi chữ ký gọi |
| `src/state/drift-status.mjs:16,93` | `needsSync` — root chưa resolved mà ahead-of-target | Như trên |
| `src/state/impact.mjs:24,90,146` | `openIds`/dep resolved-filter cho impact-analysis nội bộ fgOS | Như trên |
| `src/runner/claim-port.mjs:11,159` | `unmergedDeps` — chặn claim khi dep chưa resolved | Như trên |
| `src/report/entropy.mjs:15,17,41,96` | Import `RESOLVED_STATUSES` + `FINAL_STATUSES` cục bộ riêng (`awaiting-approval`,`blocked`,`done`) cho báo cáo entropy/stale-clarify | Có — `FINAL_STATUSES` cục bộ này TỰ Ý trộn 1 status đầu (`awaiting-approval`,`blocked`) với 1 status đuôi (`done`), là một bản sao lệch nghĩa của `RESOLVED_STATUSES` cần rà lại cùng lúc |
| `bin/fgos.mjs:33,544,1373` | Import `RESOLVED_STATUSES` + `FINAL_STATUSES` cục bộ (`awaiting-approval`,`blocked`,`delivered`,`retrospective`,`cleanup`,`done`) cho outcome-backfill check và ready-view filter | Có — cùng lý do, cần đối chiếu lại theo ranh giới đầu/đuôi mới |

### 3. Literal status trong verb logic của `bin/fgos.mjs` (tầng CLI/store — chính là "bảng transition của domain coding" hôm nay)

| File:line (khu vực) | Vai trò | Đổi? |
|---|---|---|
| `bin/fgos.mjs:700,816,2958` | `status: 'todo'` mặc định lúc `add`/`submit`/`sync-root` khai item mới | Không đổi hành vi coding (label giữ nguyên); về nguyên tắc trở thành default của domain đó, không hằng số toàn cục |
| `bin/fgos.mjs:1358,1382` | Check `item.status === 'awaiting-human'` cho verb `ask`/`answer` | Đoạn đầu — domain-owned, nhưng cơ chế ask/answer bản thân domain-agnostic (async-human-gate D1/D3/D5, `status-fsm.mjs` header) nên về sau nên đọc category `in-progress` + field `ask`/`answer` thay vì literal `'awaiting-human'` nếu domain khác đặt tên khác cho park-state |
| `bin/fgos.mjs:1800,1834,1866,1894,1957` | Check `'todo'`/`'blocked'`/`'doing'` cho `take`/`return`'s claim/verify flow | Đoạn đầu — domain-owned; verb `take`/`return` hôm nay hardcode transition coding, cần đọc bảng transition của `work.domain` khi domain thứ hai sản xuất thật xuất hiện |
| `bin/fgos.mjs:2036-2114` | `doing → awaiting-approval`/`doing → blocked` (return verb, goal-check pass/fail) | Đoạn đầu — domain-owned |
| `bin/fgos.mjs:2129,2278,3015-3019` | `awaiting-approval` check cho `approve`/`reject`, `awaiting-approval → todo` (reject, mang `reason` bắt buộc) | Đoạn đầu — domain-owned |
| `bin/fgos.mjs:2234,2455-2456,2525-2748` | `awaiting-approval → delivered` (approve merge/GitHub/verify-only) và các cạnh `awaiting-approval → blocked` (merge-conflict/verify-fail-post-merge, mang `reason`) | **Ranh giới đầu/đuôi** — cạnh này BẮC CẦU 2 nhóm (nguồn đoạn đầu, đích đoạn đuôi); giữ nguyên vì `delivered` là điểm vào cố định của đuôi, nhưng điều kiện gate ở phía `awaiting-approval` vẫn đoạn đầu, domain-owned |
| `bin/fgos.mjs:3047,3125-3193` | `blocked → awaiting-approval` (sync-root/catchup mechanical reconcile, fan-out-parallel D18) | Đoạn đầu — domain-owned |
| `bin/fgos.mjs:1020-1025` | `case 'retrospective'`: yêu cầu `item.status === 'delivered'`, chuyển `delivered → retrospective` | **Đuôi — KHÔNG đổi** (D1: chuỗi đuôi cố định, dùng chung mọi domain) |
| `bin/fgos.mjs:1042-1082,1114` | `case 'cleanup'`: yêu cầu `status === 'cleanup'`, chuyển `cleanup → done`/`cleanup → blocked`; `case 'compound'` yêu cầu `status === 'retrospective'` | **Đuôi — KHÔNG đổi** cạnh transition; nhưng verb `cleanup`/skill chạy `retrospective` là nơi D5's `skillMap.retrospective` gap thật sẽ cắm vào (chưa code — `tsk-38t` decompose kế tiếp) |
| `bin/fgos.mjs:658-672` (`collectRollupData`) | `w.status === 'done'` — đếm con `done`/tổng con cho verb `rollup` | **Đuôi — KHÔNG đổi** (`done` là literal cố định, D1) |

### 4. `runner/` — vòng tự hành, tiêu thụ nặng nhóm đầu

| File:line | Vai trò | Đổi? |
|---|---|---|
| `src/runner/loop.mjs:336,352,381,383` | Check `status !== 'doing'`, resolve crash-reclaim (`doing → blocked`) | Đoạn đầu — domain-owned |
| `src/runner/loop.mjs:546,598` | `status: 'todo'` mặc định item mới do runner tự sinh (discovered-from) | Đoạn đầu — domain-owned |
| `src/runner/loop.mjs:720,729,738` | `doing → awaiting-approval`, outcome `'awaiting-approval'` (goal-check pass) | Đoạn đầu — domain-owned |
| `src/runner/loop.mjs:797-798,1060` | `doing → blocked` (verify-fail/anti-loop trip) | Đoạn đầu — domain-owned |
| `src/runner/loop.mjs:976,996` | Check `item.stage === clarifyStage/decomposeStage && item.status === 'todo'` — cổng phối `stage` × `status` để chọn dispatch | **Điểm giao thoa 2 trục** — `stage` đã domain-owned (D1-D3 cũ vẫn đúng phần này), `status` literal `'todo'` ở đây cần đổi sang category `todo` để domain khác không bị lệch |
| `src/runner/anti-loop.mjs:59` | Đếm `event.payload.to === 'doing'` cho visit-count chống lặp | Đoạn đầu — domain-owned |
| `src/runner/claim-port.mjs:44,204-261` | `take` verb: `'todo'`/`'blocked'` (branch-take) → `'doing'` | Đoạn đầu — domain-owned |
| `src/runner/github-adapter.mjs:56,90,106,123,150,179` | `outcome: 'blocked'` (disposition, TỪ VỰNG DÙNG CHUNG với `status` per `0024`) khi `gh` thất bại | Đoạn đầu (disposition-side) — cần đồng bộ cùng lúc với `status`, đúng bài học `0024` (đổi 1 nơi bỏ nơi kia tái tạo ambiguity) |
| `src/runner/promote-engine.mjs:79` | `outcome: 'blocked'` | Như trên |
| `src/runner/recovery.mjs:131,133` | Crash-recovery resolve `to: 'awaiting-approval'` / `to: 'blocked'` | Đoạn đầu — domain-owned |

### 5. Cơ chế domain-agnostic khác (được DISCUSSION.md liệt tường minh)

| File:line | Vai trò | Đổi? |
|---|---|---|
| `src/state/retro-pool.mjs:12,21` | `isRetrospectiveReady`: `item.status === 'retrospective'` literal | **KHÔNG đổi — D1 xác nhận trực tiếp** ("`retro-pool.mjs`'s literal `status === 'retrospective'` đúng mãi mãi, không cần đổi") |
| `src/intake/discovery.mjs:128,649,651,674-690` | `statusAtAsk`/ask-answer gate đọc `work.status` (`todo`/`doing`/`awaiting-human`) để resume đúng chỗ | Đoạn đầu — domain-owned; cơ chế bản thân domain-agnostic (mirror `status-fsm.mjs`'s async-human-gate), nên về sau nên đọc category thay vì literal 3 tên này |
| `docs/reference/triage-table-columns.md:18` | Bảng cột hiển thị CLI liệt kê CHỈ 7 status cũ (`todo`/`doing`/`blocked`/`awaiting-human`/`awaiting-approval`/`done`), "rendered as-is" — literal, đã lệch 10 status thật hôm nay (thiếu `delivered`/`retrospective`/`cleanup`/`wontfix`) | **Gap có thật, ĐỘC LẬP với quyết định category** (DISCUSSION.md §3 #6) — cần sửa dù thiết kế category chốt kiểu gì; hiển thị "as-is" hôm nay đã ngầm giả định 1 domain, sẽ hiện sai khi domain khác dùng nhãn khác cho cùng category |
| `herdr-plugin/src/fgos.rs:46,101,110,203-272` | Tiến trình Rust NGOÀI runtime Node — parse `fgos list --all --json` stdout, lọc `item.status == "doing" \|\| item.status == "awaiting-approval"` (tsk-4vo D1/D2) để hiển thị pane "in-process" | **Consumer NGOÀI biên `src/`/`bin/`, qua ranh giới CLI/JSON** — domain-owned, đọc literal string coding hôm nay; nếu domain khác đổi nhãn 2 status này, `herdr-plugin` vỡ ngầm trừ khi tự đọc `statusCategory` thay literal — phải liệt vào backlog migrate-consumer của `tsk-38t-3` (consumer-migration), không chỉ audit mã nguồn `.mjs` |

### 6. Gap liên quan nhưng KHÔNG phải phạm vi audit status literal (ghi nhận để không lặp lại công sức)

`fgos-compounding` bị gọi CỨNG cho mọi item tới `retrospective`
(`src/state/retro-pool.mjs`, `bin/fgos.mjs:1012,1088`) — không tham số hoá
theo domain. Đây là gap D5 đã chốt hướng xử lý (mở rộng `skillMap` sang key
`retrospective`) nhưng CHƯA code — thuộc `tsk-38t` decompose kế tiếp, không
phải một "consumer literal status" cần audit ở record này.

## Hệ quả

- **Record này là tiền điều kiện bắt buộc cho `tsk-38t-2` đến `tsk-38t-7`**
  (schema `statusCategory`/`STATUS_CATEGORIES`, migration backfill D4,
  consumer-migration theo audit ở trên, `skillMap.retrospective` D5,
  `domainFields`/`fieldSchema` D6, domain giả lập thứ hai THẬT có bảng
  transition khác coding để chứng minh thiết kế) — **không phần nào trong số
  đó được bắt đầu code trước khi file này tồn tại**, đúng yêu cầu acceptance
  gốc của `tsk-38t` ("cần decision record mới đúng khuôn 0024 supersede 0006,
  viết TRƯỚC khi code").
- `base-workflow-model`'s D1-D3 (`2ae492d8`) KHÔNG bị sửa tại chỗ — nguyên văn
  của nó vẫn đúng lịch sử; record này chỉ supersede đúng phạm vi status/domain
  đã nêu, không phải toàn bộ ngữ cảnh `base-workflow-model` (S1/S2 domain
  registry cho `stage` vẫn đứng nguyên, không bị chạm).
- `RESOLVED_STATUSES` (`frontier.mjs:186`) và mọi consumer của nó (§2 ở trên)
  là điểm rủi ro tập trung nhất khi hiện thực hoá — nó là tập string viết tay
  DUY NHẤT hôm nay trộn cả 2 nhóm đầu/đuôi; sửa sai chỗ này lan ra ít nhất 7
  file khác (`graph-metrics.mjs`, `graph-harness.mjs`, `drift-status.mjs`,
  `impact.mjs`, `claim-port.mjs`, `entropy.mjs`, `bin/fgos.mjs`) chỉ vì chúng
  gọi `.has()` trên đúng 1 Set dùng chung.
  `entropy.mjs`/`bin/fgos.mjs`'s `FINAL_STATUSES` cục bộ là 2 bản sao ĐÃ LỆCH
  nghĩa nhau (khác tập con) — cần rà đồng thời, không chỉ theo dấu
  `RESOLVED_STATUSES`.
- `herdr-plugin/src/fgos.rs` xác nhận việc audit "consumer của status" không
  dừng ở biên `src/`/`bin/` của repo Node — bất kỳ tiến trình ngoài nào đọc
  `fgos list --all --json` cũng là 1 consumer thật của vocabulary status, cần
  đưa vào phạm vi khi `tsk-38t-3` (consumer-migration) thực thi.
- `docs/reference/triage-table-columns.md` lệch code (7 vs 10 status thật) là
  gap có thật nhưng ĐỘC LẬP khỏi quyết định category — không chặn record này,
  nhưng nên sửa cùng đợt `tsk-38t-3` để tránh phải quét lại 2 lần.
