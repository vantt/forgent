# CONTEXT: registry mở-rộng-được cho fgos doctor's checks + fgos setup's config-defaults

**Item:** tsk-2cs
**Trạng thái:** decisions locked, gate pending
**Nguồn:** docs/distribution-vision.md §2 trụ cột 4 + §5 câu hỏi mở 1

## Feature boundary

Hôm nay `src/setup/checks.mjs`'s `DOCTOR_CHECKS` là một mảng cố định (thực tế
5 check: `node-version-and-git`, `shell-integration-sourced`, `config-not-stale`,
`main-checkout-hook-wired`, `tool-registry-configured` — item description và
`docs/specs/distribution.md` Data Dictionary #7 đều nói "3 check", cả hai đều
đã stale so với code thật; registry phải giữ nguyên hành vi của cả 5, không chỉ
3). Một module mới muốn thêm check hoặc config-default phải vá tay vào file
này. Item này xây một registry mở-rộng-được: module mới tự khai entry của nó ở
một điểm chính thức, `checks.mjs` không cần sửa khi có entry mới.

Ngoài phạm vi item này (deferred, không mở rộng scope):
- Di dời vật lý `.fgos-runner.json` → `.fgos/config.json` — đã chốt và đang lên
  kế hoạch ở `tsk-2ta` (D1 amended, xem plan.md của nhánh `fgw/tsk-2ta`), không
  làm lại ở đây.
- `doctor --fix` tự sửa được tới đâu (trụ cột 3, câu hỏi mở 3) — thuộc `tsk-2qz`.

## Locked decisions

| ID | Quyết định |
|----|------------|
| D1 | Cơ chế discovery: một file registrations tường minh riêng (vd `src/setup/registrations.mjs`) import từng module cung cấp check/config-default và gộp vào một mảng; `checks.mjs`/`config-merge.mjs` chỉ duyệt qua mảng đó. Module mới sửa `registrations.mjs`, không bao giờ sửa `checks.mjs`. Không chọn manifest JSON kiểu `docs/architecture-manifest.json` (JSON không giữ được function, và file đó đã mang nghĩa khác — layer classification) và không chọn directory auto-scan (magic ngầm, không khớp phong cách registry tường minh sẵn có của repo — `DOCTOR_CHECKS` array, `tool-registry.mjs`'s register verb, `command-registry.mjs`). |
| D2 | Một entry đăng ký check và entry đăng ký config-default là ĐỘC LẬP, KHÔNG bắt buộc đi theo cặp — module có thể đăng ký chỉ check, chỉ config-default, hoặc cả hai. Chốt từ bằng chứng thật: 4/5 check hiện có không có config-default đi kèm (`main-checkout-hook-wired` đọc git config, `tool-registry-configured` đọc event-sourced work store — không phải file JSON); chỉ `config-not-stale` có cặp. Bắt buộc cặp sẽ phá vỡ yêu cầu "giữ nguyên hành vi check hiện có" của chính item. |
| D3 | Mọi entry config-default dùng CHUNG một file cấu hình duy nhất (không tự khai đường dẫn file riêng) — file đó là bất kỳ file nào `tsk-2ta` chốt ra (`.fgos/config.json`, theo D1 amended của tsk-2ta). Mỗi entry được khoá (`key`) dưới một top-level section riêng trong file đó, đặt tên theo module — khớp yêu cầu "1 file config chung, mỗi module có main-entry của chính nó" của chủ sản phẩm. |
| D4 | tsk-2cs KHÔNG tự thực hiện việc di dời `.fgos-runner.json` → file chung — nhường việc đó cho `tsk-2ta` (đã có plan.md thật trên nhánh `fgw/tsk-2ta`, xác nhận bằng đọc trực tiếp: `fgos setup` là verb thực hiện move, file cũ được đọc làm fallback cho tới khi move xảy ra). Registry của tsk-2cs chỉ nhắm tới file chung bằng tên/đường dẫn, bất kể tsk-2ta đặt nó ở đâu. Quyết định đảo từ câu trả lời ban đầu của chủ sản phẩm (muốn tsk-2cs tự di dời) sau khi tìm thấy bằng chứng thật là tsk-2ta đã khoá đúng quyết định này trên nhánh riêng — tránh hai item cùng làm một việc, đụng merge. |
| D5 | `.fgos/gate-bypass.json` (shape hiện tại: `{level}`, đọc bởi `src/state/gate-bypass.mjs`'s `readGateBypassLevel`) gộp vào file chung, dưới key riêng của nó (vd `gateBypass`), là một entry config-default thật của registry — không giữ file riêng. Đây là bằng chứng nền cho `tsk-2qz` (deps cứng vào item này), là entry-tiêu-thụ đầu tiên. |
| D6 | Config runner hiện có (`executor`, `executors`, `models`, `timeoutMs`, `parallel` — hôm nay nằm phẳng ở root `.fgos-runner.json`) cũng được lồng dưới key riêng của nó (vd `runner`) trong file chung, để đối xứng đầy đủ với mọi module khác — không giữ phẳng ở root như một ngoại lệ lịch sử. Hệ quả thật: `src/runner/dispatch.mjs`'s `ensureRunnerConfig` và mọi điểm đọc config runner phải đổi từ đọc phẳng ở root sang đọc `config.runner.*` — MỞ RỘNG footprint thật của item này ra ngoài phạm vi đã khai (`checks.mjs`, `config-merge.mjs`, `architecture-manifest.json`) để bao gồm `src/runner/dispatch.mjs`. Đây là quyết định trực tiếp của chủ sản phẩm sau khi được trình bày rõ hệ quả (không phải suy đoán). |

## Pinned terms

- **"Registry mở-rộng-được"**: một điểm đăng ký tường minh (D1) mà module mới
  sửa để thêm entry — không bao giờ là sửa `checks.mjs`/`config-merge.mjs`
  trực tiếp.
- **"Entry"**: một đăng ký gồm `id` (tên module) và tối thiểu một trong hai —
  `check` (hàm) hoặc `configDefault` (object mặc định, khoá dưới `id` trong
  file chung) — theo D2, không bắt buộc cả hai.
- **"File chung" / "shared config file"**: một file JSON duy nhất, vị trí do
  `tsk-2ta` quyết (D4) — KHÔNG phải nhiều file JSON rải rác theo module.

## Scout evidence

- `src/setup/checks.mjs:203-229` — `DOCTOR_CHECKS` là mảng 5 entry cố định
  hôm nay (không phải 3 như mô tả item/`docs/specs/distribution.md` Data
  Dictionary #7 — cả hai đã stale so với code thật, registry phải bảo toàn
  hành vi cả 5).
- `src/setup/config-merge.mjs` — `mergeConfigDefaults` đã PURE, generic
  (existingConfig, defaultConfig) → {merged, addedKeys}, đã tự recurse vào
  plain object lồng nhau; registry chỉ cần gộp default của từng module
  thành một object lồng-theo-key rồi gọi hàm này MỘT lần — không cần sửa
  logic merge.
- `src/state/tool-registry.mjs` — một registry KHÁC đã tồn tại trong repo
  (event-sourced, `fgos tool register`, cho capability của công cụ ngoài
  như GitNexus) — xác nhận repo đã quen với khái niệm registry tường minh,
  nhưng cơ chế này không phù hợp cho check/config-default (event log không
  giữ được function reference) — không tái dùng trực tiếp, chỉ là bằng
  chứng phong cách cho D1.
- `src/state/gate-bypass.mjs` — `readGateBypassLevel` đọc trực tiếp
  `<dir>/gate-bypass.json`, fail-closed về `DEFAULT_LEVEL` khi file thiếu/
  hỏng — xác nhận shape thật của D5's entry (`{level}`).
- `tsk-2qz` (đọc bằng `fgos list --id tsk-2qz`) — mô tả xác nhận: item này
  PHẢI dùng gate-bypass.json như entry đầu tiên của registry, không hardcode
  riêng rồi refactor lại — khớp D5.
- `fgw/tsk-2ta` branch (đọc trực tiếp qua `git show`) — `docs/history/
  global-project-config-awareness/CONTEXT.md` (D1, D1 amended, D2) +
  `plan.md` (166 dòng, mode high-risk) đã khoá: global config tại
  `~/.fgos/config.json`, project config di dời `.fgos-runner.json` →
  `.fgos/config.json`, project luôn ghi đè global, `fgos setup` thực hiện
  move thật, đọc file cũ làm fallback. CONTEXT.md của tsk-2ta tự nói rõ
  "registry mở-rộng thuộc tsk-2cs, không phải tsk-2ta" — xác nhận ranh giới
  hai item không chồng nhau ở phần registry, nhưng CHỒNG THẬT ở
  `src/runner/dispatch.mjs` (tsk-2ta's plan.md tự liệt kê file này là
  "likely touched, unproven assumption"; D6 ở đây cũng chạm đúng file này
  vì lý do khác — restructure shape, không phải đổi path) và ở chính file
  cấu hình chung — đây là một phụ thuộc thứ tự MỀM thật (không chỉ
  "không hard-block" như milestone doc mô tả), nêu ở Outstanding bên dưới.
- `fgos tool query --capability impact-analysis --status present` → GitNexus
  `present` (1 provider). impact-analysis: **full** — khi thi công D1/D2/D6,
  chạy `impact()` trước khi sửa bất kỳ symbol nào trong `src/setup/` hoặc
  `src/runner/dispatch.mjs`, theo gate ở CLAUDE.md/AGENTS.md.

## Canonical references

- `docs/distribution-vision.md` §2 trụ cột 4, §5 câu hỏi mở 1, §6 (tsk-2cs =
  target của milestone `tsk-3uj`, Phase 2), §7.
- `docs/specs/distribution.md` Data Dictionary #7 — sẽ cần cập nhật (số check
  thật, không còn "3 cố định") khi item này thi công; supersede thuộc phạm vi
  `tsk-1qm` (deps: [tsk-2cs, tsk-2qz]), không phải item này.
- `docs/history/global-project-config-awareness/CONTEXT.md` +
  `plan.md` (nhánh `fgw/tsk-2ta`) — nguồn của D3/D4/D6's ràng buộc file chung.
- `tsk-2qz` — consumer đầu tiên thật của D5.

## Outstanding questions deferred to planning

- Thứ tự thi công thật giữa tsk-2cs và tsk-2ta: cả hai đụng
  `src/runner/dispatch.mjs` (D6 ở đây, path-move assumption ở tsk-2ta) và
  cùng file cấu hình chung. `fgos-coding-planning` cho tsk-2cs cần đọc lại trạng
  thái merge thật của `fgw/tsk-2ta` tại thời điểm thi công (đã merge vào
  main hay chưa) để quyết thứ tự — không giả định trước ở đây.
- Tên `id`/key chính xác cho từng section trong file chung (`runner`,
  `gateBypass`, tên field bên trong `registrations.mjs`) — chi tiết
  implementer, `fgos-coding-planning` quyết.
- `fgos setup` có phải nơi ghi giá trị mặc định của registry vào file chung
  lần đầu hay không (khác với `doctor`, vốn read-only theo RUL9) — implementer
  detail, `fgos-coding-planning` cân nhắc cùng lúc với D1's registrations.mjs shape.

## Outstanding questions

None
