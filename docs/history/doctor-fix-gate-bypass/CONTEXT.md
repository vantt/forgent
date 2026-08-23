# CONTEXT: fgos doctor tự fix được .fgos/gate-bypass.json

**Item:** tsk-2qz
**Trạng thái:** decisions locked, gate pending
**Nguồn:** docs/distribution-vision.md §2 trụ cột 3, §5 câu hỏi mở 3, §7

## Feature boundary

`fgos doctor` hôm nay chỉ chẩn đoán (RUL9, `docs/specs/distribution.md:200`:
"doctor's checks never write anything, under any circumstance"); RUL11 nói
`doctor --fix` chưa tồn tại, là Deferred Idea có chủ đích (D8). Vision doc
§3 đảo quyết định này cho trụ cột 3. `.fgos/gate-bypass.json` (shape
`{level}`, đọc bởi `src/state/gate-bypass.mjs`'s `readGateBypassLevel`, fail
về `DEFAULT_LEVEL='off'` khi thiếu/hỏng) là slice fix đầu tiên. Item này
cũng là entry-tiêu-thụ đầu tiên của registry mở-rộng-được mà tsk-2cs xây
(`src/setup/registrations.mjs`) — theo D5 của tsk-2cs.

Ngoài phạm vi item này (deferred, không mở rộng scope):
- Di dời vật lý các file config khác — thuộc `tsk-2ta`.
- Cập nhật `docs/specs/distribution.md` Data Dictionary #7 / supersede RUL9,
  RUL11 chính thức — thuộc `tsk-1qm` (`deps: [tsk-2cs, tsk-2qz]`), item này
  chỉ nêu rõ đây là quyết định đảo (D2 dưới), không tự sửa spec.

## Locked decisions

| ID | Quyết định |
|----|------------|
| D1 | Thi công thật của tsk-2qz **chờ** `.fgos/config.json` (shared config file, tsk-2ta) tồn tại thật trước khi build fix logic nhắm vào `config.gateBypass`. Không bootstrap `.fgos/gate-bypass.json` như file riêng lẻ trong lúc chờ — người dùng chọn "Wait on tsk-2ta" thay vì phương án bootstrap riêng lẻ rồi refactor sau. Đây là soft dependency, KHÔNG tự thêm `tsk-2ta` vào `deps` array ở bước này (deps là field do người dùng sở hữu) — `fgos-coding-planning` đọc lại trạng thái merge thật của `fgw/tsk-2ta` tại thời điểm thi công và quyết việc wire deps chính thức, giống hệt tiền lệ chính `tsk-2cs`'s plan.md đã dùng cho rủi ro tương tự (piece 2 chờ tsk-2ta). |
| D2 | Cả hai đường ghi cùng tồn tại: `fgos setup` tiếp tục đảm bảo bootstrap đúng lúc khởi đầu (tái dùng pattern `ensureRunnerConfig`: tạo file/key nếu thiếu, merge key thiếu nếu file đã có — `src/runner/dispatch.mjs:278`), VÀ `fgos doctor` có thêm `--fix` thật để sửa/nâng cấp về sau. `doctor` KHÔNG `--fix` vẫn giữ hành vi read-only mặc định. Quyết định này ĐẢO RUL9 + RUL11 (`docs/specs/distribution.md:200,210`) — đảo có chủ đích theo vision doc §3, không phải drift ngoài ý — `tsk-1qm` chịu trách nhiệm supersede chính thức trong spec. |
| D3 | Khả năng fix là TỔNG QUÁT, không hardcode riêng cho gate-bypass. `src/setup/registrations.mjs` (registry của tsk-2cs) có thêm năng lực đăng ký thứ ba, `fix`, độc lập với `check`/`configDefault` hiện có (cùng phong cách "độc lập, không bắt buộc đi cặp" của D2 bên tsk-2cs). gate-bypass.json là entry đầu tiên đăng ký đủ cả ba (check + configDefault + fix), chứng minh trọn hình dạng registry — không phải một fix one-off. |
| D4 | D1's "chờ" đã RESOLVED bằng bằng chứng thật, KHÔNG còn là chờ vô thời hạn: `tsk-5vf` (di dời project config, đóng gap D1-amended của `tsk-2ta`) đã merge lên `main` (`af2fc64 Merge branch 'fgw/tsk-5vf'`). `.fgos/config.json` tồn tại thật trên đĩa (multi-section, key `runner` xác nhận bằng đọc trực tiếp). `tsk-5vf`'s D4 xây sẵn một assembler tổng quát, `ensureSharedConfigDefaults(dir)` (`src/setup/registrations.mjs:113`, gọi từ `fgos setup` tại `bin/fgos.mjs:2729`): gộp `shape` của MỌI entry đã `registerConfigDefault` (`CONFIG_DEFAULT_REGISTRATIONS`) vào file chung, ghi khi có key thiếu — một entry `gateBypass` mới đăng ký được assembler này tự động bootstrap, KHÔNG cần sửa `setup`/`dispatch.mjs` thêm. `tsk-5vf`'s D3 tự xác nhận lại ranh giới: gate-bypass fold-in vẫn là việc của `tsk-2qz`, không phải `tsk-5vf`. D2's "setup đảm bảo bootstrap" nay được thoả bằng cơ chế có sẵn này — không cần code setup mới, chỉ cần đăng ký entry. |

## Pinned terms

- **"fix" (registry capability, D3)**: một hàm đăng ký per-entry mà
  `doctor --fix` (hoặc `setup`) gọi để sửa đúng vấn đề của entry đó,
  idempotent, chỉ chạm phạm vi của chính entry — không sửa entry khác.
- **"Soft dependency" (D1)**: một ràng buộc thứ tự thi công thật, ghi rõ ở
  CONTEXT.md/plan.md, nhưng KHÔNG tự động trở thành một `deps` graph edge —
  việc wire graph là quyết định của `fgos-coding-planning`/thi công dựa trên bằng
  chứng thật tại thời điểm đó, không đoán trước ở đây.

## Scout evidence

- `docs/specs/distribution.md:200` (RUL9) — "doctor's checks never write
  anything, under any circumstance"; `:210` (RUL11) — "doctor --fix ...
  does not exist yet ... Deferred Idea, not an Open Gap".
- `src/cli/command-registry.mjs:845-849` — doctor's manifest entry hôm nay:
  `touchesState: false, requiresExistingStore: false, externalEffect: false`
  — khớp RUL9, sẽ cần đổi khi D2 thi công.
- `src/runner/dispatch.mjs:278-310` — `ensureRunnerConfig`: bootstrap
  pattern thật (tạo file default nếu thiếu, `mergeConfigDefaults` để vá key
  thiếu nếu đã có) — pattern D2 tái dùng.
- `src/state/gate-bypass.mjs:26-54` — `readGateBypassLevel` đọc trực tiếp
  `<dir>/gate-bypass.json`, fail-closed về `DEFAULT_LEVEL='off'`; shape thật
  `{level}`.
- `src/setup/registrations.mjs` (toàn file, đọc trực tiếp) — registry hôm
  nay (tsk-2cs) chỉ có `registerCheck`/`registerConfigDefault`, KHÔNG có
  khái niệm `fix` — D3 là mở rộng thật, không phải điều đã tồn tại.
- `docs/history/setup-doctor-config-registry/CONTEXT.md` D5 — gate-bypass
  gộp vào file chung dưới key `gateBypass`, là "entry-tiêu-thụ đầu tiên"
  của registry — nguồn của D1's khung.
- `docs/history/setup-doctor-config-registry/plan.md` — piece 2 (fold vào
  shared file) của chính tsk-2cs cũng chờ tsk-2ta, ghi rõ trong Risk map
  ("piece 2 assumes a shared config file exists at a stable, known path" —
  proof point: đọc trạng thái merge thật của `fgw/tsk-2ta`) — tiền lệ trực
  tiếp cho D1.
- `fgos list --id tsk-2ta` (đọc trực tiếp) — status `todo`, stage
  `executing`, chưa split thành children — xác nhận CHƯA landed.
- `ls .fgos/config.json` — không tồn tại (2026-08-01) — xác nhận thật, không
  suy đoán, rằng shared config file chưa có trên đĩa.
- `ls .fgos-runner.json`, `.fgos/gate-bypass.json` — cả hai vẫn là file
  riêng lẻ hôm nay (`.fgos-runner.json` phẳng ở root, `gate-bypass.json`
  `{"level":"standard"}`) — xác nhận chưa có di dời nào xảy ra.
- `fgos tool query --capability impact-analysis --status present` → GitNexus
  `present` (1 provider). impact-analysis: **full** — thông tin, không gate
  gì ở bước này (skill này không sửa code).
- **(D4, re-scout 2026-08-01 sau khi tsk-2ta rồi tsk-5vf merge)** `git log
  --oneline main` → `af2fc64 Merge branch 'fgw/tsk-5vf'`. `cat
  .fgos/config.json` → thật, `{"runner": {...}}`. `git show
  main:src/setup/registrations.mjs` → `ensureSharedConfigDefaults(dir)`
  (dòng 113) + `assembleRegistryDefaults()` thật, đọc
  `CONFIG_DEFAULT_REGISTRATIONS`. `git show main:bin/fgos.mjs` dòng 2729 →
  `fgos setup` đã gọi `ensureSharedConfigDefaults(repoRoot)` thật.

## Canonical references

- `docs/distribution-vision.md` §2 trụ cột 3, §3, §5 câu hỏi mở 3, §7.
- `docs/specs/distribution.md` RUL9, RUL10, RUL11, Data Dictionary #7.
- `docs/history/setup-doctor-config-registry/CONTEXT.md` (tsk-2cs, D1-D6) +
  `plan.md` — nguồn D1/D3.
- `docs/history/global-project-config-awareness/CONTEXT.md` (nhánh
  `fgw/tsk-2ta`) — nguồn D1-amended gốc, đã merge nhưng để lại gap.
- `docs/history/shared-project-config-file/CONTEXT.md` (`tsk-5vf`, đã merge,
  status done) — nguồn D4: đóng gap D1-amended thật, xây assembler tổng quát,
  tự xác nhận D3 của chính nó ("gate-bypass fold-in thuộc tsk-2qz").
- `tsk-1qm` (`deps: [tsk-2cs, tsk-2qz]`) — nơi supersede RUL9/RUL11 chính
  thức trong spec, không phải item này.

## Outstanding questions deferred to planning

- D1's câu hỏi gốc (wire `deps: [tsk-2ta]` hay không) **đã giải quyết bởi
  D4** — `tsk-5vf` (không phải `tsk-2ta` trực tiếp) là item thật đã đóng gap;
  cả hai đã `done`. `fgos-coding-planning` không còn cần cân nhắc deps nữa cho việc
  chờ này — piece 2 không còn bị block bên ngoài.
- Tên field/shape chính xác cho registration `fix` thứ ba trong
  `registrations.mjs` (vd `{ id, fix: async (cwd) => {...} }`, có cần
  dry-run/preview trước khi ghi không) — chi tiết implementer, `fgos-coding-planning`
  quyết.
- `doctor --fix` chạy MỘT entry cụ thể hay TẤT CẢ entry có đăng ký `fix`
  cùng lúc (vd `fgos doctor --fix` chạy hết, `fgos doctor --fix gate-bypass`
  chạy riêng)? — chi tiết implementer/UX, `fgos-coding-planning` quyết.

## Outstanding questions

None
