# CONTEXT: di dời project config sang `.fgos/config.json` (shared file), wire global config vào runtime thật

**Item:** tsk-5vf
**Trạng thái:** decisions locked, gate pending
**Nguồn:** tsk-2ta's D1-amended gap (`docs/history/global-project-config-awareness/CONTEXT.md`
§"Chưa làm — khác Outstanding cũ") — dropped from every child's footprint during
`tsk-2ta`'s auto-decompose (`docs/explanation/auto-decompose-can-drop-a-locked-decision-from-every-childs-footprint.md`).

## Feature boundary

Hai gap thật, đã xác nhận bằng đọc code trực tiếp (không phải suy đoán):

1. Project config vẫn nằm ở `.fgos-runner.json` (cwd gốc) — chưa dời vào
   `.fgos/config.json` như `tsk-2ta`'s D1-amended đã chốt.
2. `src/runner/dispatch.mjs`'s `ensureRunnerConfig`/`loadRunnerConfig` — đường
   `fgos`/`fgos-runner` chạy thật qua — không gọi `mergeWithGlobalConfig`
   (`src/config/global-config.mjs`, đã tồn tại, có test, nhưng chưa có consumer
   thật). `~/.fgos/config.json` hiện chỉ "nhìn thấy được" qua `fgos doctor`'s
   `config-awareness` check, chưa "có hiệu lực" lên hành vi runtime.

Item này đóng cả hai gap, cộng hai quyết định mới phát sinh khi thi công (D4,
D5 dưới đây) không có item nào khác chốt sẵn.

Ngoài phạm vi item này (deferred, không mở rộng scope):
- Di dời `.fgos/gate-bypass.json` vào file chung dưới key `gateBypass` —
  thuộc `tsk-2qz` (registry's "entry-tiêu-thụ đầu tiên", `tsk-2cs` D5).
- Registry mở-rộng-được (`registerCheck`/`registerConfigDefault`,
  `src/setup/registrations.mjs`) tự nó — đã thi công và merge (`tsk-2cs`,
  status done). Item này chỉ TIÊU THỤ registry đó (D4), không xây lại.

## Locked decisions

| ID | Quyết định | Nguồn |
|----|------------|-------|
| D1 | Shared file (`.fgos/config.json`) là multi-section, lồng theo module — project config runner nằm dưới key `runner` (`config.runner.*`), KHÔNG phải copy phẳng nội dung `.fgos-runner.json` vào root. Mọi điểm đọc config runner đổi từ đọc phẳng sang đọc `config.runner.*`. | Kế thừa `tsk-2cs` D6 (quyết định trực tiếp chủ sản phẩm, đã merge/done) — không re-litigate, chỉ pin |
| D2 | `fgos setup` là verb thực hiện move thật (`.fgos-runner.json` → `.fgos/config.json`'s `runner` section). Khi `.fgos/config.json` chưa tồn tại nhưng `.fgos-runner.json` cũ còn, đọc file cũ làm fallback thay vì coi project là chưa cấu hình — file cũ không bị xoá tự động. | Kế thừa `tsk-2ta` plan.md §Assumptions + `tsk-2cs` D4 (đã đọc trực tiếp trên nhánh `fgw/tsk-2ta`, đã merge) |
| D3 | Di dời `.fgos/gate-bypass.json` vào file chung nằm ngoài phạm vi item này — `tsk-2qz` là consumer đầu tiên thật của registry, làm việc đó khi nó thi công. | Kế thừa `tsk-2cs` D5 + `tsk-2qz`'s description ("tsk-2qz (D1) đang chờ đúng file này") |
| D4 | `src/runner/dispatch.mjs`/`bin/fgos.mjs`'s 5 call site đọc/ghi `.fgos/config.json` qua một assembler tổng quát dẫn động bởi `CONFIG_DEFAULT_REGISTRATIONS` (`registerConfigDefault`, đã có sẵn từ `tsk-2cs` nhưng chưa có consumer thật nào — grep xác nhận 0 điểm đọc ngoài test) — KHÔNG hardcode đọc thẳng key `runner`. Làm cho registry của `tsk-2cs` thật sự có hiệu lực (load-bearing) lần đầu, cho `tsk-2qz`'s gate-bypass entry một pattern thật để theo sau. | Quyết định của người, chốt trong phiên `fgos-coding-exploring` này (AskUserQuestion, chọn "Generic: registry-driven assembler" thay vì hardcode) |
| D5 | `checkConfigNotStale` (`src/setup/checks.mjs`) và `describeConfigAwareness`'s default `projectConfigPath` (`src/config/global-config.mjs`) được cập nhật trỏ vào `.fgos/config.json` TRONG item này, không để lại làm follow-up riêng. | Quyết định của người, chốt trong phiên `fgos-coding-exploring` này (AskUserQuestion, chọn "Update both now") — khớp AGENTS.md's install/setup/doctor gate ("phải register vào doctor's check registry — không đứng riêng, không bị doctor phát hiện") |

## Pinned terms

- **"Shared file" / "file chung"**: `.fgos/config.json`, multi-section, mỗi
  module một key riêng (D1) — không phải file phẳng đơn-mục-đích như
  `.fgos-runner.json` hôm nay.
- **"Assembler" (D4)**: hàm/module đọc `CONFIG_DEFAULT_REGISTRATIONS`, gộp mỗi
  entry's `shape` vào key riêng của nó trong shared file's default, rồi
  `mergeConfigDefaults` một lần lên nội dung file thật trên đĩa — mọi module
  đăng ký qua `registerConfigDefault` tự động được assembler xử lý, không cần
  sửa dispatch.mjs mỗi lần có entry mới.

## Scout evidence

- `src/config/global-config.mjs` — `loadGlobalConfig`, `mergeWithGlobalConfig`,
  `describeConfigAwareness` đã tồn tại, test thật (`test/config/global-config.test.mjs`,
  9 case), nhưng **0 caller thật** ngoài test — xác nhận gap 2 có thật, không
  phải suy đoán.
- `src/runner/dispatch.mjs:145-162,278-310` — `loadRunnerConfig`/`ensureRunnerConfig`
  nhận `configPath` như tham số (path-agnostic tự thân); path phẳng
  `.fgos-runner.json` được hardcode ở CALLER, không phải trong dispatch.mjs.
  5 call site thật: `bin/fgos-runner.mjs:105`, `bin/fgos.mjs:244,892,912,2727`
  — mỗi chỗ tự `path.join(..., '.fgos-runner.json')`.
- `src/setup/registrations.mjs:44,72-86,335-339` — `CONFIG_DEFAULT_REGISTRATIONS`
  đã có sẵn (mảng live, mutated-in-place), `registerConfigDefault({id:'runner',
  key:'runner', shape: DEFAULT_RUNNER_CONFIG})` đã đăng ký. Grep xác nhận
  KHÔNG có code nào đọc mảng này ngoài `test/setup/registrations.test.mjs` —
  registry tồn tại nhưng inert, xác nhận D4's premise.
- `src/setup/registrations.mjs:211-223` (comment tại `checkConfigNotStale`) —
  tự nói rõ "wiring is tsk-2cs's own explicitly deferred follow-up once the
  shared file is real" — xác nhận D5's gap có thật, đã được biết trước, chưa
  ai đóng.
- `docs/history/setup-doctor-config-registry/CONTEXT.md` D3-D6 (item `tsk-2cs`,
  status `done`) — khoá shape file chung (multi-section, mỗi module một key),
  khoá "tsk-2ta sở hữu việc move vật lý", khoá "gate-bypass là entry đầu tiên
  của registry, thuộc tsk-2qz".
- `docs/history/global-project-config-awareness/plan.md` §Assumptions — "fgos
  setup thực hiện move thật, đọc file cũ làm fallback" đã pin từ trước, chưa
  thi công vì D1-amended bị auto-decompose bỏ sót.
- `fgos list --id tsk-2qz` — description tự xác nhận: `deps: [tsk-2cs]`,
  đang chờ shared file thật để bootstrap `gate-bypass.json` vào đó — khớp D3.
- `fgos tool query --capability impact-analysis --status present` → GitNexus
  `present` (1 provider). impact-analysis: **full** — khi thi công D4/D5,
  chạy `impact()` trước khi sửa bất kỳ symbol nào trong `src/runner/dispatch.mjs`,
  `src/setup/checks.mjs`, `src/setup/registrations.mjs`, `src/config/global-config.mjs`,
  `bin/fgos.mjs`, `bin/fgos-runner.mjs`, theo gate ở CLAUDE.md/AGENTS.md.

## Canonical references

- `docs/history/global-project-config-awareness/CONTEXT.md` + `plan.md` —
  nguồn D1-amended gốc, D1/D2 (tsk-2ta), đã merge lên main.
- `docs/history/setup-doctor-config-registry/CONTEXT.md` — nguồn D1-D6
  (tsk-2cs), đã merge lên main, status done.
- `docs/distribution-vision.md` §2 trụ cột 6, §3, §5 câu hỏi mở 2/2b — nguồn
  gốc của toàn bộ nhánh việc global/project config awareness.
- AGENTS.md §"Install/setup/doctor gate" — ràng buộc D5 (config location mới
  phải doctor-discoverable, không đứng riêng).

## Outstanding questions deferred to planning

- Tên hàm/module chính xác cho assembler (D4) — file mới trong `src/setup/`
  hay `src/config/`, chữ ký hàm, nơi gọi `mergeWithGlobalConfig` trong luồng
  đó (trước hay sau assembler gộp default) — chi tiết implementer,
  `fgos-coding-planning` quyết.
- Thứ tự sửa 5 call site (`bin/fgos.mjs` x4, `bin/fgos-runner.mjs` x1) và có
  cần một helper dùng chung để tránh lặp `path.join(..., '.fgos','config.json')`
  5 lần hay không — implementer detail.
- `fgos setup`'s write-first-time behavior khi CẢ `.fgos-runner.json` cũ lẫn
  `.fgos/config.json` mới đều chưa tồn tại (first run thật) — có viết default
  runner section ngay, hay chỉ khi `ensureRunnerConfig` được gọi lần đầu —
  `fgos-coding-planning` cân nhắc cùng risk map.
