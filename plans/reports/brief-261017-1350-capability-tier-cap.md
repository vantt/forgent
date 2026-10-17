# Brief: trần tier theo capability (capability rigor đang bị trần toàn cục vô hiệu hoá)

Ngày 2026-10-17. Brief giao việc, tự đủ để một phiên khác làm mà không cần lịch sử chat. Người giao: owner. Người viết brief: phiên điều phối event store.

## 1. Vấn đề

`bind()` chọn tier cho mỗi vai theo hai bước, và bước hai xoá tác dụng của bước một:

1. Tier được suy từ rigor: rigor của Unit hoặc capability (lấy cái mạnh hơn), qua `rigorToTier` (`low→nano`, `standard→standard`, `high→flagship`, `critical→frontier`). Override của người có thể nâng thêm.
2. Sau đó `maxTier` **toàn cục** (`runner.maxTier` trong `.fgos/config.json`, hiện là `advanced` theo commit `ecba3b0b5`) kẹp **mọi** tier xuống, không phân biệt capability (`src/runner/execution/bind.mjs:411-418`).

Hệ quả đo được hôm nay:
- `architecture:synthesize` được cố ý nâng lên rigor `critical` (commit `95885e6d3`), nhưng vẫn chạy `sonnet` vì bị kẹp ở `advanced`.
- Hội đồng kiến trúc `wf-run-1792209767959-7424ddf9` chạy toàn ghế tầm trung (gpt-5.6-sol, sonnet, gemini flash-high, grok-4.5) dù `architecture:shape` có rigor `critical`.
- Muốn ghế mạnh (Astra, Fable, Argon), cách duy nhất là nâng `maxTier` toàn cục, làm mọi worker khác cũng được dùng model đắt. Điều này đã xảy ra: lần nâng tạm `frontier` cho hội đồng `wf-run-1792216377992-d45c6038` bị một commit khác cuốn vào repo (`95885e6d3`), phải sửa lại ở `214e8530d`.

## 2. Hành vi mong muốn

Trần toàn cục là **mặc định**; capability được **khai trần riêng** khi cần.

- Khoá mới trên khai báo capability: `runner.capabilities.<cap>.maxTier` (một giá trị của `MODEL_POLICY_TIERS`, `src/runner/dispatch/config.mjs:536`).
- Trần hiệu lực của một vai = `capabilities.<cap>.maxTier` nếu có, ngược lại `runner.maxTier`, ngược lại không trần.
- Capability được khai trần **cao hơn hoặc thấp hơn** trần toàn cục (đây là mục đích: `architecture:*` lên `frontier` trong khi mặc định là `advanced`).
- Nguồn của tier ghi rõ trong provenance: `clamped:maxTier(<tier>, capability:<cap>)` hoặc `clamped:maxTier(<tier>, global)`. Hiện chỉ có `clamped:maxTier(<tier>)`.
- Override của người (`--override` tier) vẫn bị trần hiệu lực kẹp, giữ đúng ý định của commit `404b5c43b` ("a frontier override cannot select the most expensive model"). Không mở đường vòng qua override.

Cấu hình dự kiến sau khi xong (owner duyệt riêng, không thuộc brief này): giữ `runner.maxTier: advanced`; các capability `architecture:frame|shape|critique|synthesize|explain` khai `maxTier: frontier`.

## 3. Phạm vi

**Trong:**
- `src/runner/execution/bind.mjs`: tính trần hiệu lực theo capability đã khớp (`capConfig`), áp kẹp, ghi provenance.
- Validate khoá mới ở chỗ config capability đang được validate (một giá trị lạ phải bị từ chối với thông báo nêu tên capability và các giá trị hợp lệ).
- `src/runner/execution/dry-bind.mjs` dùng chung đường của `bind()` nên tự đúng; kiểm lại bằng test.
- `fgos dispatch decide` / explain (nếu đã có, xem mục 5) hiển thị trần hiệu lực và nguồn.
- Đăng ký khoá vào `fgos setup` config-merge và một check doctor chỉ đọc: liệt kê capability có trần riêng, cảnh báo capability có rigor bị trần kẹp (rigor đòi tier cao hơn trần hiệu lực), như trường hợp `architecture:synthesize` hôm nay (cổng install/setup/doctor của `AGENTS.md`).
- `docs/specs/runner.md`: ghi luật trần hiệu lực; một dòng `## [Unreleased]` trong `CHANGELOG.md`.

**Ngoài:** đổi giá trị trong `.fgos/config.json` (owner duyệt riêng); luật lên tier khác; lease và pool account; đổi `rigorToTier`.

## 4. Một lỗ hổng liên quan cần kiểm, chưa xác nhận

Có hai chỗ tính tier: `bind()` (có kẹp `maxTier`) và `resolveAssignmentDispatchPolicy` trong `src/runner/dispatch/assignment-policy.mjs` (khoảng dòng 314-330, tính `effectiveTier` từ rigor và override; `grep maxTier` trong file này không có kết quả). Nếu `policy.tier` trong `runResult` lấy từ đường thứ hai thì provenance ghi tier chưa kẹp trong khi model thật đã bị kẹp. Hãy xác nhận: đường nào quyết định model thật, đường nào chỉ ghi provenance, và hai đường có báo khác nhau không. Nếu khác, đó là hai bộ tính cùng một quyết định (vi phạm One Door); ghi thành item riêng nếu sửa nằm ngoài phạm vi, theo RUL11.

## 5. Phối hợp

- Plan `plans/261017-1302-model-pool-config-additive-slice/` đang sửa `.fgos/config.json`, `bin`/explain và doctor, và cố ý để "trần tier, luật lên tier, `maxTier`" ra ngoài (plan.md dòng ~54). Việc này đúng là phần đó; đọc plan trước, dùng lại `fgos dispatch explain` của phase 04 nếu đã land, tránh sửa cùng dòng trong cùng lúc. Báo phiên đang chạy plan đó trước khi bắt đầu.
- Main checkout hiện có thay đổi chưa commit của plan trên (config, `phase-00`, hai file test). Làm trong một linked worktree riêng; không đụng các file đó trong main checkout.

## 6. Yêu cầu kỹ thuật bắt buộc

- `bind()` là lõi chọn worker cho mọi dispatch: chạy impact analysis trên `bind` (và hàm tier nếu tách) trước khi sửa, báo blast radius; theo cổng impact-analysis của `CLAUDE.md` (nếu index cũ thì cross-check bằng `rg`).
- Không có test nào hiện kiểm `maxTier` (`grep -rln maxTier test` rỗng). Viết test trước:
  1. Không khai gì: hành vi y hệt hôm nay (trần toàn cục kẹp).
  2. Capability khai `maxTier` cao hơn toàn cục: vai của capability đó được tier cao, capability khác vẫn bị kẹp.
  3. Capability khai thấp hơn toàn cục: bị kẹp thấp hơn.
  4. Override tier `frontier` trên capability có trần `advanced`: vẫn bị kẹp.
  5. Giá trị trần sai: bị từ chối khi nạp config, thông báo nêu tên capability.
  6. Provenance ghi đúng nguồn trần.
  7. `simulateUnitBindings` (dry-bind) cho cùng kết quả với run thật.
- Chạy test hẹp trước, rồi `npm test` đầy đủ (`env -u CLAUDE_CODE_SESSION_ID`). Không thêm cờ hay nhánh test để làm xanh.
- Commit theo conventional commit, không nhắc AI hay mã plan trong code/test.

## 7. Tiêu chí xong

- Với cấu hình `runner.maxTier: advanced` và `architecture:synthesize.maxTier: frontier`, dry-bind workflow `architecture-advisory` cho ghế tổng hợp model `fable`, trong khi `code:implement` vẫn ở tier `advanced`.
- Doctor có check mới và báo đúng trường hợp rigor bị kẹp.
- `npm test` xanh; spec runner và CHANGELOG cập nhật; mục 4 có kết luận (xác nhận hoặc bác) ghi trong báo cáo hoàn thành.
