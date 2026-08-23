# CONTEXT — Hợp nhất vocab capability + đối chiếu lại registry executor

Item: `tsk-in1`. Đầu vào của skill này là `DISCUSSION.md` (3 vòng thảo
luận, D1-D15 đã CHỐT, §6 là bản thiết kế thống nhất, §7 đã có 6 task
nháp) — Native-First handoff từ `fgos-coding-shaping` (`item.refs` đã
trỏ vào `DISCUSSION.md#design` trước khi phiên này bắt đầu, per D2 của
`fgos-coding-shaping`). Pass này KHÔNG mở lại bất kỳ quyết định nào
`DISCUSSION.md` đã trả lời — chỉ khoá thêm 2 điểm còn treo (D14/D15) và
cô đọng thành `CONTEXT.md` theo đúng hình dạng `fgos-coding-planning`
cần đọc.

## 1. Ranh giới feature

Hợp nhất vocab "capability" đang tách rời giữa `tool-registry.mjs`
(free-text, Tầng 1 — presence/fact) và `dispatch.mjs`
(`CAPACITY_PURPOSES` enum đóng, Tầng 2 — dispatch purpose-lookup) thành 1
danh mục curated dùng chung (`runner.capabilities`). Đồng thời tách
`runner.capacities` (hiện gánh 2 vai: executor registry theo tên +
purpose optional) khỏi tool-registry's event-sourced registration — gộp
`gitnexus`/`herdr` thẳng vào `capacities`, xoá `.fgos/tool-registry.json`
+ verb `fgos tool register`/`remove`. Xoá hẳn `executors.<tier>` (dead,
từng gây bug thật). Tách `kind` thành `agent`/`tool`, dời vocab cũ
(`cli`/`mcp`/`task`) vào `invocations[].via`. Xây 1 adapter `http` thật
làm tiền lệ chứng minh `EXECUTOR_ADAPTERS` là port pluggable, tổng quát
hoá chữ ký adapter từ `(command,args,cwd,opts)` sang nhận `invocation`
object.

KHÔNG bao gồm: gộp `cfg.executor` (global default) vào `capacities` (D7
— giữ tách riêng, field bắt buộc + hạt giống bootstrap, khác hẳn tính
chất optional của `executors.<tier>`); khôi phục cầu nối dispatch-tự-
query-tool-registry mà `tsk-5tm` D1 đã cắt (D2 — giữ nguyên hiện trạng);
adapter `bash`/shell (rủi ro shell-injection cao hơn lợi ích chứng minh
khái niệm, D13's rationale).

## Locked decisions

Kế thừa nguyên vẹn từ `DISCUSSION.md` §4 (`fgos list --id tsk-in1 --json`'s
`data.decisions`, D1-D13 ghi trong phiên `fgos-coding-shaping`, D14-D15
ghi ngay trong pass này). Không ghi lại nội dung đầy đủ — chỉ trích dẫn.

| D-ID | Quyết định | Bằng chứng chính |
|---|---|---|
| D1 | Bỏ tool-registry event-sourced registration, gộp `gitnexus`/`herdr` vào `runner.capacities` | Cùng 1 khái niệm (executor), tách rời do vô tình; `capacities` đã là tiền lệ config-edited |
| D2 | KHÔNG khôi phục cầu nối dispatch↔tool-registry (`tsk-62v` D6) mà `tsk-5tm` D1 đã cắt | GitNexus chưa bao giờ là 1 `capacities.<id>` entry — gate presence không có chủ thể trong dispatch |
| D3 | Giữ tên field `capacities` (không đổi `executors`) | `cfg.executors` đã tồn tại, validate cứng chỉ nhận key tier (`dispatch.mjs:521-528`) |
| D4 | Thêm `runner.capabilities` — danh mục curated, predefined + đăng ký thêm được | 2 vocab hôm nay không giao nhau; mô hình đóng theo lựa chọn người dùng |
| D5 | `kind` tách `agent`/`tool`; vocab cũ dời vào `invocations[].via` | Khớp ADR0027/0042 marketing-cockpit + đúng thiết kế gốc `tsk-5tm` đã viết nhưng chưa lên code (`kind:"agent"` trong DISCUSSION cũ, code thật dùng `"cli"`) |
| D6 | Xoá hẳn `executors.<tier>` | 0 entry live, đã gây bug thật (`tsk-5tm` D10, `judge-decompose`) |
| D7 | Giữ `cfg.executor` tách riêng, KHÔNG gộp vào `capacities.default` | Field bắt buộc + hạt giống bootstrap, khác `executors.<tier>` |
| D8 | `INVOCATION_VIA` = `['cli','task','mcp']` (bỏ `'api'`); bỏ `binary`/`skill`/`http` khi gộp | Event log thật: chỉ `cli`/`mcp` từng đăng ký, 0 lần khác |
| D9 | D5 cần 3 gate: shape-theo-`via`, chọn invocation đúng `via`, throw khi không dispatch-được | Không sửa thì entry `gitnexus` không load nổi hoặc bị spawn nhầm (`dispatch.mjs:609/894-896/1039`) |
| D10 | Giải xung đột namespace #3 bằng `resolveCapacityIdForPurpose` có sẵn, không đổi cách key | Khớp cách marketing-cockpit tách binding job→executor khỏi chính registry |
| D11 | Từ chối port silent-downgrade + `model-policy.yaml` tách file | fgOS đã có giải pháp tường minh hơn (`rigorOverrides`, `mergeWithGlobalConfig`) |
| D12 | Xác nhận miss của `capacityIdForWork` là thiết kế cố ý, không phải bug | `dispatch.mjs:1599-1613` tự ghi rõ lý do (`tsk-5tm-6` D4) |
| D13 | Xây adapter `http` thật làm tiền lệ; tổng quát hoá chữ ký `EXECUTOR_ADAPTERS` | Chứng minh port pluggable thật; tránh ép shape http vào khuôn CLI (bẫy B1) |
| D14 | `runner.capabilities.<name>` = `{description, aliases: [...]}` | Kế thừa `description`/`responsibility` cũ; `aliases` khác `normalizeCapability`'s tự động kebab-case |
| D15 | `capacities.<id>.for` đổi thành `string[]` — 1 executor phục vụ nhiều capability | Quyết định người dùng; kéo theo sửa `resolveCapacityIdForPurpose`/`validateCapacityShape` |

Rationale đầy đủ từng D-ID: `DISCUSSION.md` §4, `fgos list --id tsk-in1 --json`.

## 3. Thuật ngữ đã ghim (pinned terms)

- **capability** — lời hứa năng lực fgOS tự định nghĩa (curated,
  `runner.capabilities.<name>`, D4/D14), KHÔNG phải executor.
- **executor** — cách hiện thực hoá 1 capability, đăng ký trong
  `runner.capacities.<id>` (key theo tên executor, D3), có thể phục vụ
  nhiều capability (`for: string[]`, D15).
- **kind** — trục BẢN CHẤT của executor (`agent`|`tool`, D5) — KHÔNG phải
  cơ chế gọi.
- **`invocations[].via`** — trục CƠ CHẾ GỌI (`cli`|`task`|`mcp`, D8) —
  KHÔNG phải bản chất.
- **adapter** (`EXECUTOR_ADAPTERS`) — hàm code thực thi 1 invocation,
  port pluggable (D13), KHÔNG phải "runtime thực thi" theo nghĩa
  marketing-cockpit (bash/python/native/mcp — những cái đó đã phủ bởi
  `cli-spawn` + `decideDispatchMechanism`, trừ `http` — D13's tiền lệ).

## 4. Scout evidence + impact-analysis posture

- `src/runner/dispatch.mjs` — điểm chạm chính, xem `DISCUSSION.md` §4/§6/§7
  cho từng dòng cụ thể theo D-ID.
- `src/state/tool-registry.mjs` — `probeTool`/`findExecutableOnPath`/
  `isIndexStale` giữ làm hàm thuần (D1); `KINDS`/`probeHttp` số phận còn
  mở (`DISCUSSION.md` §3 #14).
- `.fgos/config.json`, `.fgos/tool-registry.json`, `.fgos/events.jsonl` —
  đọc trực tiếp trong shaping, bằng chứng thật (5 `tool.register`+3
  `tool.remove`, `runner.executors` undefined, `agy`'s `kind:"cli"` lệch
  thiết kế gốc).
- `docs/history/agent-executor-capacity-dispatch/CONTEXT.md` (`tsk-62v`)
  — nguồn gốc `capacities.<id>`, D3/D6.
- `docs/history/task-dispatch-unification/` (`tsk-5tm`, D1-D12) —
  lineage trực tiếp, đặc biệt D1/D9/D10/D11.
- `docs/distillery/sources/marketing-cockpit.md` — bản chưng cất, không
  có checkout thật (`upstreams/marketing-cockpit` không tồn tại trên
  máy).
- Impact-analysis capability gate (`fgos tool query --capability
  impact-analysis --status present`, chạy fresh phiên này): GitNexus
  `status: "present"` — posture **full**. `fgos-coding-planning`'s
  `#task-*` cần chạy `impact({target, direction: "upstream"})` thật
  trước khi sửa từng symbol trong `dispatch.mjs`.

## 5. Outstanding questions cho `fgos-coding-planning`

Không phải product decision (đã chốt hết ở `DISCUSSION.md` §4 + D14/D15
ở trên), nhưng đây là phán đoán shape/size `fgos-coding-exploring` không
được quyết:

- **Bundle 1 item hay tách 6 con** — `DISCUSSION.md` §7 đã shape đủ 6
  `#task-*` (`retire-tool-registry`, `drop-tier-executor`,
  `capabilities-catalog`, `kind-agent-tool-split`,
  `http-adapter-precedent`, `http-status-decision`) với mục tiêu/D-ID/
  quan hệ/verify nháp riêng. `fgos-coding-planning` đọc trực tiếp từ đó,
  quyết giữ 1 item hay `--parent`/`--merge-after` tách nhỏ — đúng cách
  `tsk-5tm` từng làm (6 con tương tự quy mô).
- **§3 #14** (số phận `probeHttp`/`'http'` trong `tool-registry.mjs`) —
  nghiêng xoá, chưa mint D-ID, để `fgos-coding-planning` quyết gộp vào
  task nào.

## Outstanding questions

None
