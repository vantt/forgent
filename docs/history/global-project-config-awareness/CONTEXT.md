# CONTEXT: fgOS awareness hai cấp cài đặt global vs project (+ context thứ 3: dev-checkout self-hosting)

**Item:** tsk-2ta (+ tsk-1ri, `fgos setup` global-init follow-up)
**Trạng thái (cập nhật 2026-08-08, tsk-1ri):** Toàn bộ D1/D1-amended/D2 đã
thi công và merge — **§"Chưa làm" bên dưới đã lỗi thời, để nguyên làm dấu
vết lịch sử, không xoá.** Thực tế xác nhận bằng đọc code trực tiếp: D1
amended (di dời `.fgos-runner.json` → `.fgos/config.json`) đã xong —
`src/config/shared-config-file.mjs`'s `sharedConfigFilePath` là nguồn DUY
NHẤT, không còn đọc file cũ nào. Wiring runtime thật cũng đã xong —
`src/runner/dispatch.mjs:288,342`'s `loadRunnerConfigFromDir`/
`ensureRunnerConfigForDir` gọi `mergeWithGlobalConfig` trước khi validate,
đây là đường THẬT mọi `fgos`/`fgos-runner` chạy qua, không chỉ chẩn đoán.
`tsk-1ri` đóng nốt gap thật duy nhất còn sót của Outstanding cũ bên dưới:
`fgos setup` giờ cũng init `~/.fgos/config.json` (không chỉ `doctor` đọc
read-only) — xem `docs/history/fgos-setup-global-config-init/CONTEXT.md`
D1/D2.
**Nguồn:** docs/distribution-vision.md §2 trụ cột 6, §3, §5 câu hỏi mở 2 + 2b

## Feature boundary

fgOS phải nhận biết (aware) đồng thời ba context cài đặt/vận hành có thể cùng tồn tại
trên một máy, không xung đột:

1. **Global install** — `npm install -g github:vantt/forgent`, `fgos` chạy từ bất kỳ
   project nào.
2. **Project install** — `fgos` cài local vào một project cụ thể; khi có, project
   được ưu tiên vận hành.
3. **Dev-checkout self-hosting** — contributor phát triển chính fgOS qua
   `scripts/fgos-shell-integration.sh` (source từ shell profile), không cài đặt gì;
   shell function `fgos`/`fgos-runner` resolve root theo cwd mỗi lần gọi qua
   `git rev-parse --git-common-dir`.

Nguyên tắc chốt: **project config luôn ghi đè (overwrite) global config** khi cả hai
đang tồn tại — không phải hợp nhất mù (deep-merge) hai bên. Item này chốt (a) global
config sống ở đâu, và (b) một lỗi thật đã xác nhận bằng đọc code giữa context 3 và
global install.

Ngoài phạm vi item này (deferred, không mở rộng scope): hình dạng "registry mở-rộng"
cho doctor checks/config defaults (trụ cột 4, §5-Q1) — thuộc `tsk-2cs`, không phải
`tsk-2ta`.

## Locked decisions

| ID | Quyết định |
|----|------------|
| D1 | Global config sống tại `~/.fgos/config.json` (file mới, cùng dạng config project-local hiện có nhưng đặt ở home dir). Khi cả global lẫn project config cùng tồn tại, project config luôn ghi đè global — không merge sâu. `fgos doctor` thêm một check mới báo trạng thái "đang chạy bản nào (global/project), bản kia có mặt hay không" — cho người/agent thấy awareness thật, không chỉ suy luận. |
| D1 (amended) | Project config di dời từ `.fgos-runner.json` (cwd gốc) vào `.fgos/config.json` (cùng thư mục `.fgos/` đang chứa state sẵn) — khớp path shape 1-1 với global (`~/.fgos/config.json`), chỉ khác root (project cwd vs home). Đổi tên/di dời file hiện có, không phải file mới — cần tính đường migrate cho ai đã có `.fgos-runner.json` cũ khi thi công. Lý do: user yêu cầu naming nhất quán giữa hai cấp để dễ tìm/grep. |
| D2 | `scripts/fgos-shell-integration.sh`'s `fgos()`/`fgos-runner()` fallback về `command fgos "$@"` / `command fgos-runner "$@"` (PATH binary thật, tức global install nếu có) khi `_fgos_repo_root` resolve được một git root nhưng root đó KHÔNG có `bin/fgos.mjs` — thay vì lỗi Node xấu (`Cannot find module`) + shadow chết global install ở mọi thư mục. |

## Pinned terms

- **"Aware"** (trụ cột 6): fgOS biết context nào đang active + context kia có mặt
  hay không, thể hiện được ra ngoài (doctor check, không chỉ hành vi ngầm) — không
  chỉ đơn thuần "chạy đúng bản ưu tiên mà không báo gì".
- **"Ghi đè" (overwrite)**: project config thắng toàn bộ khi có xung đột field — không
  phải deep-merge theo key như `mergeConfigDefaults` (fill-missing-only, khác mục
  đích: đó là merge default-vào-existing trong cùng một file, không phải
  global-vs-project).

## Scout evidence

- `src/setup/checks.mjs:156` — config hiện tại chỉ có `.fgos-runner.json` tại `cwd`,
  project-local only. Grep `XDG_CONFIG|HOME.*\.fgos|os\.homedir|~/\.fgos` trong
  `src bin test` (`.mjs/.cjs/.md`) chỉ khớp `os.homedir()` dùng cho rc-file detection
  (`checks.mjs:109`, `bin/fgos.mjs:2703`) — **không có cơ chế global config nào tồn
  tại hôm nay**, D1 là greenfield thật, không phải khôi phục cái đã có.
- `scripts/fgos-shell-integration.sh:12-29` — `_fgos_repo_root()` resolve qua
  `git rev-parse --path-format=absolute --git-common-dir`; `fgos()`/`fgos-runner()`
  gọi thẳng `node "$root/bin/fgos.mjs"` không kiểm tra file có tồn tại, không
  fallback — xác nhận lỗ hổng D2 mô tả là có thật trong code hiện tại, không phải
  suy đoán.
- `test/scripts/fgos-shell-integration.test.mjs:38-94` — hiện chỉ phủ 2 case (trong
  checkout/worktree forgent chạy được; ngoài git repo hoàn toàn lỗi rõ). Case thứ 3
  (trong git repo khác không phải forgent, không có `bin/fgos.mjs`) chưa test —
  D2 cần thêm test case này khi thi công.
- `docs/specs/distribution.md` Edge Cases Settled — case linked-worktree tương tự
  ("luôn chạy MAIN checkout's entry point") đã "accepted as-is". D2 KHÔNG áp dụng
  precedent này — người quyết định đây là lỗi thật cần fix (fallback), không phải
  trade-off chấp nhận.
- `fgos tool query --capability impact-analysis --status present` → GitNexus
  `present` (1 provider). impact-analysis: **full** — khi thi công D1/D2, chạy
  `impact()` trước khi sửa `scripts/fgos-shell-integration.sh` và bất kỳ symbol nào
  trong `src/setup/` theo gate ở CLAUDE.md/AGENTS.md.

## Canonical references

- `docs/distribution-vision.md` §2 trụ cột 6, §3 (đối chiếu distribution.md), §5
  câu hỏi mở 2 + 2b, §6 (tsk-2ta = target của milestone `tsk-4c05`, Phase 1).
- `docs/coexistence.md` — phạm vi liên quan (harness khác), KHÔNG phải phạm vi item
  này (item này là hai/ba bản fgOS, không phải fgOS-vs-harness-khác).
- `docs/specs/distribution.md` — Data Dictionary #5 (dev checkout shell helper),
  #7 (doctor check registry — cập nhật lúc `tsk-2ta-2` merge để liệt kê đúng 6
  check thật hiện có, gồm `config-awareness` D1 thêm; không còn "3 check cố
  định" như bản trước — đã stale từ trước cả item này, xem
  `docs/explanation/spec-docs-drift-silently-when-only-code-has-an-exact-match-test.md`).

## Kết quả thi công thật (tsk-2ta-1/2/3, đã merge lên main qua fgw/tsk-2ta)

- **`src/config/global-config.mjs`** (tsk-2ta-1, mới) — `loadGlobalConfig`,
  `mergeWithGlobalConfig` (tái dùng `mergeConfigDefaults` có sẵn thay vì viết
  merge logic mới — xem
  `docs/explanation/global-config-merge-reuses-fill-missing-only-primitive.md`),
  `describeConfigAwareness`. Test thật: `test/config/global-config.test.mjs`
  (9 case, precedence project-thắng-global đã chứng minh bằng test).
- **`src/setup/checks.mjs`** (tsk-2ta-2) — thêm check `config-awareness` vào
  `DOCTOR_CHECKS` (giờ 6 entry), dùng `describeConfigAwareness`. Luôn
  `passed: true` (read-only, informational, cùng pattern
  `tool-registry-configured`).
- **`scripts/fgos-shell-integration.sh`** (tsk-2ta-3) — `fgos()`/`fgos-runner()`
  fallback `command fgos "$@"` khi root resolve được nhưng thiếu
  `bin/fgos.mjs`; dùng `type -P` để detect PATH binary thật (không phải
  `command -v`, vốn trả về chính tên shell function — xem
  `docs/explanation/shell-fallback-detection-needs-type-p-not-command-v.md`).
  3 test case mới thêm vào case thứ 3 D2 nhắc ở Scout evidence.

## Chưa làm (LỊCH SỬ — đã xong, xem đầu file) — khác Outstanding cũ

**Cập nhật 2026-08-08 (tsk-1ri):** cả hai gap dưới đây đã được thi công từ
trước khi `tsk-1ri` bắt đầu — mục này giữ nguyên làm dấu vết lịch sử
(snapshot lúc viết), không mô tả trạng thái hiện tại. Xem đầu file (§
Trạng thái) cho tình trạng thật.

- ~~**D1 amended (di dời `.fgos-runner.json` → `.fgos/config.json`) chưa thi
  công.**~~ Đã xong — `src/config/shared-config-file.mjs`'s
  `sharedConfigFilePath` là nguồn duy nhất hôm nay, `.fgos-runner.json` chỉ
  còn sót trong một fixture test không liên quan
  (`test/intake/plan.test.mjs`), không còn cơ chế đọc file cũ nào.
- ~~**Global config chưa được wire vào runtime thật.**~~ Đã xong —
  `src/runner/dispatch.mjs:288,342`'s `loadRunnerConfigFromDir`/
  `ensureRunnerConfigForDir` gọi `mergeWithGlobalConfig` trước khi validate
  `runner` — đường thật mọi `fgos`/`fgos-runner` chạy qua, có hiệu lực vận
  hành, không chỉ chẩn đoán.

## Outstanding cũ — đã trả lời (tsk-1ri)

- ~~Có cần `fgos setup` cũng ghi/khởi tạo `~/.fgos/config.json` hay chỉ
  `doctor` đọc read-only?~~ **Trả lời: có** — xem
  `docs/history/fgos-setup-global-config-init/CONTEXT.md` D1 (ghi full
  default shape, giống hệt project) và D2 (mọi lần `fgos setup` chạy,
  không cần cờ riêng). Đã thi công (`bin/fgos.mjs`'s `setup` case).
- Đường migrate cụ thể cho ai đã có `.fgos-runner.json` cũ — **đã moot**,
  không còn cơ chế đọc file cũ nào để migrate từ (xem mục trên). Không có
  ai thật sự cần migrate vì fallback đã bị xoá hẳn từ `tsk-5hv` D1 thay vì
  giữ lại đường đọc cũ.
