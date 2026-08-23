# plan.md — tsk-in1 (hợp nhất vocab capability + registry executor)

Mode: **high-risk**

Lane quyết theo `fgos-routing`'s Mode-gate (Direct-entry fallback —
session vào thẳng từ `fgos-coding-shaping`/`fgos-coding-exploring`, không
qua Orient step). Đếm cờ: **4/10** áp dụng —

- **existing covered behavior** — `src/runner/dispatch.mjs` ship kèm
  `test/runner/dispatch.test.mjs` (775+ dòng) khẳng định shape D1-D12 cũ
  của `tsk-5tm`; đổi `CAPACITY_KINDS`/`INVOCATION_VIA`/xoá
  `executors.<tier>` chạm phần lớn test đó.
- **public/internal contract** — `dispatch.mjs`'s hàm export
  (`resolveExecutorConfig`, `decideCapacityDispatchMechanism`,
  `EXECUTOR_ADAPTERS`, `capacityIdForWork`) được `fgos-fanout`,
  `fgos-researching`, `scripts/project-agents.mjs` dùng trực tiếp — đổi
  chữ ký (D13) hoặc semantics (`kind`, D5) có blast radius rộng ngoài
  file này.
- **external systems** — D13 thêm 1 lớp thực thi mới có khả năng gọi HTTP
  ra ngoài (adapter `http`) — dù chưa có producer thật, đây là hạ tầng
  genuinely mới, không phải chỉnh sửa nội bộ thuần.
- **weak proof around the area** — GitNexus index đang stale (`last
  indexed: 7bb3231`, cảnh báo lặp lại xuyên suốt phiên này) — bằng chứng
  impact-analysis dù `status: present` vẫn cần đọc kỹ, theo đúng
  `CLAUDE.md`'s gate (`present` không đồng nghĩa "index tươi").

4 cờ → **high-risk** (bảng `fgos-routing`: "4+ flags... → high-risk").
Không có cờ hard-gate nào (auth/data-loss/audit-security) — high-risk vì
số lượng cờ, không vì mức độ nguy hiểm tuyệt đối của từng cờ.

## 1. Boundary

Kế thừa nguyên `CONTEXT.md`'s §1 (Ranh giới feature) — không lặp lại ở
đây. Input của pass này: `CONTEXT.md`'s "Locked decisions" (D1-D15,
`docs/history/capability-executor-registry-unification/CONTEXT.md`).

## 2. Approach

**Đường đã chọn:** thực thi đúng 15 quyết định đã khoá — không có
alternative nào còn mở ở tầng SẢN PHẨM (mọi lựa chọn thiết kế đã quyết
qua 3 vòng shaping + 1 vòng exploring). Approach ở đây thuần là THỨ TỰ +
RỦI RO thực thi.

**File chạm** (tổng hợp từ `DISCUSSION.md` §7):

| File | D-ID chạm |
|---|---|
| `src/runner/dispatch.mjs` | D1 (referencing), D3, D5, D6, D7, D8, D9, D10, D12, D13, D14, D15 |
| `src/state/tool-registry.mjs` | D1, §3 #14 |
| `.fgos/config.json` | D1, D4, D5, D6 |
| `.fgos/tool-registry.json` | D1 (xoá file) |
| `src/cli/command-registry.mjs` | D1 (bỏ verb `tool register`/`remove`) |
| `test/runner/dispatch.test.mjs` | D6, D9, D13 |
| `docs/how-to/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md` | §3 #7 (dead reference) |
| `AGENTS.md`'s §Dispatch, `docs/specs/runner.md`, 3 file `docs/how-to/*-capacity-*.md`, `docs/reference/forgentx-tool-registry-configuration.md`, `docs/explanation/impact-analysis-capability-gate-replaces-hardcoded-gitnexus.md`, `docs/distillery/deep-dives/tool-registry.md` | cập nhật theo AGENTS.md's docs-gate (mọi thay đổi user-visible) |

**Thứ tự** — `fgos graph tsk-in1 --json` chạy fresh: item chưa có con,
`topUnblock` không tính được (không ai phụ thuộc con chưa tồn tại) —
không có tín hiệu bổ sung ngoài phụ thuộc đã tự suy luận trong
`DISCUSSION.md` §7's "Quan hệ" từng task. Thứ tự dùng phụ thuộc đó trực
tiếp (xem §4 dưới — child 4 phụ thuộc child 1; child 5 phụ thuộc child 4).

**Risk map:**

| Thành phần | Rủi ro | Bằng chứng cần |
|---|---|---|
| Gộp tool-registry vào `capacities` (D1) | trung bình — đổi nguồn đọc `fgos tool query`, có thể lệch behavior CLI nếu sót field | test xác nhận `fgos tool query --capability impact-analysis --status present` trả kết quả BYTE-IDENTICAL trước/sau |
| `kind:agent/tool` split + 3 gate (D5/D8/D9) | **cao** — trung tâm `dispatch.mjs`, mọi consumer (`fgos-fanout`/`fgos-researching`/`project-agents.mjs`) đọc `capacity.kind` | `impact({target:"resolveExecutorConfig", direction:"upstream"})` BẮT BUỘC trước khi sửa (theo `CLAUDE.md`'s gate — posture full, GitNexus present dù index stale, cross-check bằng `grep -rn "capacity.kind\|CAPACITY_KINDS"` nếu impact() trả 0/not-found) |
| Adapter `http` mới + tổng quát hoá chữ ký `EXECUTOR_ADAPTERS` (D13) | trung bình — đổi chữ ký hàm dùng bởi `cliSpawnAdapter`'s call site | test xác nhận MỌI test cũ của `cliSpawnAdapter` vẫn xanh sau đổi chữ ký |
| Xoá `executors.<tier>` (D6) | thấp — 0 live, 2 điểm chạm | `npm test` xanh, grep xác nhận 0 tham chiếu còn lại |

Impact-analysis capability gate (chạy fresh pass này):
`fgos tool query --capability impact-analysis --status present` →
GitNexus `present`. Theo `CLAUDE.md`'s 3-mức: **full**, nhưng post-tool
hook liên tục cảnh báo "GitNexus index is stale (last indexed:
7bb3231)" suốt phiên — đúng case `CLAUDE.md` tự nêu ("present nhưng index
đứng sau HEAD hiện tại") → **degraded thực chất**, dù verb trả `present`.
`fgos-coding-implement` khi tới lượt sửa `resolveExecutorConfig`/
`EXECUTOR_ADAPTERS`/`capacity.kind` call site PHẢI chạy `impact()` thật,
và **cross-check bằng grep/rg** nếu kết quả nghi ngờ (0 kết quả/not-found)
— không tin `present` = index tươi.

## 3. Shape

High-risk — bản đồ đầy đủ, đã có sẵn ở `DISCUSSION.md` §6 (thiết kế +
diagram) + §7 (6 task nháp). Không lặp lại nội dung — trích dẫn.

Case cần chứng minh khi thực thi (theo mode high-risk):
- **Empty/boundary:** 1 executor entry không khai `for` (như `agy` hôm
  nay) — `capabilities` lookup phải trả rỗng/hợp lệ, không throw.
- **Behavior không được hồi quy:** `fgos tool query --capability
  impact-analysis --status present` phải trả byte-identical trước/sau
  D1's gộp.
- **Concurrent/partial failure:** không áp dụng trực tiếp (đây là thay
  đổi config-schema + code, không phải runtime concurrency mới).
- **Shape-theo-`via` (D9a):** 1 invocation `{via:"mcp"}` không có
  `command` phải load/validate được — case cụ thể đã nêu ở D9.

## 4. Quyết định chia — CÓ, 5 mảnh

**Sửa lại tại `fgos-coding-validating` (T3):** bản nháp ban đầu có 6
mảnh — mảnh thứ 6 (`probeHttp` fate) action chỉ trích `§3 #14`
(DISCUSSION.md's issue number), KHÔNG trích D-ID thật nào từ "##
Locked decisions" → `normalizeChild` từ chối cả verdict. Đúng
`DISCUSSION.md` §7's gợi ý sẵn ("có thể gộp làm cùng lúc nếu nhỏ") —
gộp vào mảnh 1 (cùng action, cùng D1), không bịa D-ID để hợp lệ hoá.

Theo đúng `DISCUSSION.md` §7 — write specs, KHÔNG tạo item ở đây (D7 của
`fgos-coding-planning`'s own hard rule — `fgos-coding-validating` mới
materialize).

```json
[
  {
    "title": "Bỏ tool-registry event-sourced registration, gộp gitnexus/herdr vào runner.capacities",
    "verify": "npm test && node bin/fgos.mjs tool query --capability impact-analysis --status present --dir . | grep -q gitnexus",
    "action": "D1: gộp khai báo provider (gitnexus, herdr) thẳng vào runner.capacities trong .fgos/config.json, bỏ .fgos/tool-registry.json + verb fgos tool register/remove, giữ probeTool/findExecutableOnPath/isIndexStale làm hàm thuần. Cùng lúc xoá probeHttp/'http' khỏi KINDS nếu xác nhận lại 0 dùng thật (DISCUSSION.md §3 #14, gộp vào đây vì nhỏ, không có D-ID riêng).",
    "footprint": ["src/state/tool-registry.mjs", ".fgos/config.json", ".fgos/tool-registry.json", "src/cli/command-registry.mjs", "docs/how-to/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md"],
    "kind": "feature",
    "risk": "standard"
  },
  {
    "title": "Xoá executors.<tier>, xác nhận executor global đứng riêng",
    "verify": "npm test && ! grep -n 'cfg.executors\\b' src/runner/dispatch.mjs",
    "action": "D6: xoá 2 điểm chạm (validate dòng 682-686, resolve dòng 902) + test liên quan. D7: xác nhận executor (global) không đổi.",
    "footprint": ["src/runner/dispatch.mjs", "test/runner/dispatch.test.mjs"],
    "kind": "chore",
    "risk": "light"
  },
  {
    "title": "Thêm runner.capabilities — danh mục curated",
    "verify": "npm test -- --grep capabilities",
    "action": "D4/D14: thêm runner.capabilities với shape {description, aliases: [...]}, validate mới trong dispatch.mjs",
    "footprint": ["src/runner/dispatch.mjs", ".fgos/config.json"],
    "kind": "feature",
    "risk": "light"
  },
  {
    "title": "kind tách agent/tool, INVOCATION_VIA sửa, 3 gate D9, for thành array",
    "verify": "npm test -- --grep 'kind|invocation|capacity'",
    "action": "D5/D8/D9/D10/D12/D15: CAPACITY_KINDS -> ['agent','tool']; INVOCATION_VIA -> ['cli','task','mcp']; 3 gate (shape-theo-via, chọn invocation theo via, throw khi không dispatch-được); for thành string[]; sửa decideCapacityDispatchMechanism đọc kind==='agent'; ghi lại (comment) kết luận D10/D12 tại capacityIdForWork/decideCapacityCli",
    "footprint": ["src/runner/dispatch.mjs", ".fgos/config.json", "test/runner/dispatch.test.mjs"],
    "kind": "feature",
    "risk": "heavy"
  },
  {
    "title": "Adapter http thật + tổng quát hoá chữ ký EXECUTOR_ADAPTERS",
    "verify": "npm test -- --grep 'http|adapter'",
    "action": "D13: tổng quát hoá EXECUTOR_ADAPTERS từ (command,args,cwd,opts) sang nhận invocation object; viết httpAdapter thật, đăng ký EXECUTOR_ADAPTERS['http']; đưa 'api' trở lại INVOCATION_VIA",
    "footprint": ["src/runner/dispatch.mjs", "test/runner/dispatch.test.mjs"],
    "kind": "feature",
    "risk": "standard"
  },
  {
    "title": "Quyết số phận probeHttp/'http' trong tool-registry.mjs",
    "verify": "npm test",
]
```

**Quan hệ giữa 5 mảnh — SỬA lại tại `fgos-coding-validating`** (bản nháp
đầu ở `DISCUSSION.md` §7 đánh giá mảnh 1/2 "có thể song song" và mảnh 3
"độc lập về code" — engine's `footprintOverlapAmong` gate chạy thật lúc
`--verdict decompose` bắt đúng chỗ đánh giá đó SAI: mảnh 3 chạm cả
`dispatch.mjs` lẫn `.fgos/config.json`, đụng độ thật với 1/2/4/5; mảnh 4
chạm `dispatch.mjs` đụng độ với 2/3 (không chỉ mảnh 1 như nháp đầu nói).
8 xung đột footprint thật được engine liệt kê tường minh — không có cặp
mảnh nào thực sự song song an toàn, vì `dispatch.mjs` là file dùng
chung xuyên suốt 4/5 mảnh). **Tuần tự hoá đầy đủ** — mỗi mảnh phụ thuộc
MỌI mảnh trước nó theo đúng thứ tự trong JSON §4 (mảnh 3 dep [0,1]; mảnh
4 dep [0,1,2]; mảnh 5 dep [0,1,2,3]) — không mảnh nào chạy song song
thật với mảnh khác. Ràng buộc riêng của mảnh 5: KHÔNG dựa vào `impact()`
cho `EXECUTOR_ADAPTERS` — false negative đã xác nhận qua
`fgos-coding-validating`'s reality gate, dùng 4 điểm chạm grep được
(`dispatch.mjs:429/1040/1299/1530`) làm checklist thật.

## 5. Verify

Mỗi mảnh có verify riêng (xem JSON trên). Sàn chung: `npm test` xanh sau
MỖI mảnh landed — không phá vỡ 3338 test hiện có của `tsk-5tm`'s shipped
work.

## Outstanding questions

None
