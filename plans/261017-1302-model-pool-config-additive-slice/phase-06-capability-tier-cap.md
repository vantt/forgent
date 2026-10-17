---
phase: 6
title: "Rigor do capability khai thì nâng trần tier của capability đó"
status: done
effort: 5h
---

# Phase 06: rigor của capability nâng trần

Gom từ brief `brief-261017-1350-capability-tier-cap.md` (commit `f84fcc02e`),
đã xoá khi gom vào plan này. Brief đề xuất một khoá mới
`capabilities.<cap>.maxTier`; anh chọn luật đơn giản hơn ở dưới (2026-10-17),
không thêm khoá config nào.

## Vấn đề

`bind()` suy tier từ rigor (rigor của Unit hoặc capability, lấy cái mạnh hơn,
qua `rigorToTier`), override của người có thể nâng thêm, rồi `runner.maxTier`
**toàn cục** kẹp mọi tier xuống (`src/runner/execution/bind.mjs:411-418`), không
phân biệt nguồn. Vì vậy rigor mà chính capability khai trong config bị cắt mất:

| Capability | rigor | Tier theo rigor | Tier thật sau trần `advanced` (lúc viết) |
|---|---|---|---|
| `architecture:frame`, `architecture:critique` | high | flagship | advanced |
| `architecture:shape`, `architecture:synthesize`, `architecture:explain` | critical | frontier | advanced |

Hệ quả đo được ngày 2026-10-17: `architecture:synthesize` (rigor `critical`)
vẫn chạy `sonnet`; hội đồng `wf-run-1792209767959-7424ddf9` chạy toàn ghế tầm
trung; muốn ghế mạnh thì phải nâng trần toàn cục, kéo mọi worker khác lên model
đắt. Một lần nâng tạm `frontier` đã bị cuốn vào commit `95885e6d3` và phải sửa ở
`214e8530d`.

Từ `287c2cb91` (anh duyệt 13:53) trần toàn cục là `flagship`: hai capability rigor
`high` đã ra `flagship`, còn ba capability rigor `critical` vẫn bị kẹp ở
`flagship` thay vì `frontier`. Luật dưới vẫn cần cho ba capability đó.

Hiện chỉ 5 capability trên khai rigor `high` hoặc `critical`; mọi capability
khác để trống hoặc `standard`.

## Luật mới

> Trần hiệu lực của một vai = cao hơn giữa `runner.maxTier` và
> `rigorToTier[capability.rigor]`, trong đó `capability.rigor` là rigor khai
> trong `runner.capabilities.<cap>` của config.

- Rigor đến từ Unit hoặc work item, và override tier của người, vẫn bị trần
  hiệu lực kẹp. Override `frontier` trên một capability không khai rigor cao vẫn
  dừng ở `runner.maxTier` (giữ ý định của `404b5c43b`).
- Không có `runner.maxTier` thì không có trần, như hôm nay.
- Provenance ghi nguồn trần: `clamped:maxTier(<tier>, global)` khi trần toàn
  cục kẹp, và `ceiling:capability-rigor(<cap>, <rigor>)` khi rigor của
  capability nâng trần.
- Không thêm khoá config; không sửa giá trị nào trong `.fgos/config.json`.

Không làm được với luật này: kẹp một capability **thấp hơn** trần toàn cục.
Hiện không có trường hợp thật nào cần; khi có thì mới thêm.

## Việc làm

1. **Impact analysis** trên `bind` trước khi sửa; index cũ thì cross-check
   bằng `rg`. Báo blast radius.
2. **Viết test trước** (hiện không test nào kiểm `maxTier`), trong
   `test/runner/execution/bind.test.mjs`:
   1. capability không khai rigor: y hệt hôm nay (trần toàn cục kẹp);
   2. capability khai rigor `critical`, trần toàn cục `advanced`: capability đó
      ra `frontier`, capability khác vẫn bị kẹp ở `advanced`;
   3. Unit khai rigor `critical` trên capability không khai rigor: vẫn bị kẹp ở
      `advanced`;
   4. override `frontier` trên capability không khai rigor: vẫn bị kẹp;
   5. override `frontier` trên capability rigor `high`: dừng ở `flagship`;
   6. provenance ghi đúng nguồn trần trong từng trường hợp trên;
   7. `simulateUnitBindings` (dry-bind) cho cùng kết quả với `bind()`.
3. `bind.mjs`: tính trần hiệu lực từ `capConfig.rigor`, kẹp, ghi provenance.
   Sửa sau phase 02, vì phase 02 sửa đoạn chọn model ngay dưới đoạn này.
4. Hiển thị trần hiệu lực và nguồn trong `fgos dispatch explain` (phase 04) và
   `fgos dispatch decide`.
5. Check doctor chỉ đọc `capability-rigor-ceiling`: liệt kê capability có
   rigor nâng trần lên trên `runner.maxTier`, kèm tier chúng sẽ chạy, để ai đặt
   `rigor: critical` cho một capability thì thấy ngay hệ quả chi phí.
6. **Kiểm hai bộ tính tier.** `resolveAssignmentDispatchPolicy`
   (`src/runner/dispatch/assignment-policy.mjs`, khoảng dòng 314-330) tính
   `effectiveTier` từ rigor và override mà không kẹp `maxTier`. Xác nhận đường
   nào quyết định model thật, đường nào chỉ ghi provenance, và hai đường có báo
   khác nhau không. Nếu khác: cho `assignment-policy` dùng chung hàm trần với
   `bind()` khi việc sửa nằm gọn trong hàm tính tier; nếu lớn hơn thì ghi thành
   item riêng (RUL11) và nêu trong báo cáo phase.
7. Spec `docs/specs/runner.md` (luật trần hiệu lực) và một dòng `CHANGELOG.md`
   `[Unreleased]`, mỗi file một commit riêng như phase 04.

## Kiểm chứng

- 7 test trên xanh; test 2, 5, 6 đỏ trước khi sửa.
- Trên config đã commit (`runner.maxTier: flagship`, không sửa gì): dry-bind
  workflow `architecture-advisory` cho ghế tổng hợp model `fable`, ghế
  `architecture:frame` model tier `flagship`, còn `code:implement` không vượt
  `flagship`.
- Doctor liệt kê đúng 3 capability rigor `critical` (2 capability rigor `high`
  không vượt trần `flagship`).
- `bind-committed-config.test.mjs` xanh; so với baseline phase 00, chỉ 3
  capability rigor `critical` đổi tier.
- `npm test` không thêm test hỏng nào so với phase 05.

## Kết quả (2026-10-17)

- `resolveTierCeiling` export từ `bind.mjs`; `bind()` và check doctor
  `capability-rigor-ceiling` (`src/setup/model-pool-checks.mjs`) dùng chung.
  Provenance: `tier.ceiling = { value, source }`, kẹp ghi
  `clamped:maxTier(<tier>, global | capability-rigor(<cap>, <rigor>))`.
- Test trong `bind.test.mjs`: 7 test, 6 đỏ trước khi sửa (test "không có
  maxTier" xanh sẵn). Test 7 của plan (dry-bind) thay bằng test "rigor thấp
  hơn trần không hạ trần", vì `simulateUnitBindings` gọi thẳng `bind()` và
  không ghi tier.
- Trên config đã commit (`maxTier: flagship`): 48/608 dòng baseline đổi, chỉ
  `architecture:shape`, `architecture:synthesize`, `architecture:explain`
  (`flagship` thành `frontier`: claude `fable`, openai `gpt-6-astra`).
- **Hai bộ tính tier:** `assignment-policy` không áp trần và thường không biết
  capability (`run.mjs` không truyền); model thật luôn là của `bind()`
  (`cliOverride.model`), chỉ bản ghi tier lệch khi `bind()` kẹp. Sửa cần
  `run.mjs`, nên tách thành việc riêng (`plan.md`).
- `fgos dispatch decide` không trả tier, nên trần chỉ hiện ở `explain`.
- Spec RUL103 (lần đầu spec mô tả `runner.maxTier`); CHANGELOG mục Changed.

## Rủi ro

Trung bình đến cao: `bind()` là lõi chọn worker cho mọi dispatch. Test 1, 3, 4
và baseline phase 00 chứng minh mọi capability khác giữ nguyên.
