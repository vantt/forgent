# Báo cáo: Module/Verb của harness bin — boundary & khả năng thay bằng Rust

**Ngày:** 2026-08-14. **Phạm vi:** `bin/fgos.mjs`, `bin/fgos-runner.mjs`, toàn bộ `src/**/*.mjs` (82 file).
**Phương pháp:** đọc trực tiếp code + đối chiếu `docs/architecture-map.md` (v0.6) /
`docs/architecture-manifest.json` / `src/cli/command-registry.mjs` (nguồn máy-đọc, không suy
đoán) + cross-check độc lập bằng GitNexus cluster cohesion. Không web-research — đây là audit
codebase nội bộ, không phải research công nghệ ngoài.

---

## TL;DR

- 2 binary, 82 module, 55 verb, kiến trúc 5 tầng (`entry→use-case→infra→domain→kernel`) được
  **test thật enforce** (`test/architecture.test.mjs`, khớp 82/82, đã verify bằng diff), không
  phải chỉ là diagram.
- Nhưng: layering chỉ canh **chiều import giữa file**, không canh **độ dày trong 1 file**.
  `bin/fgos.mjs` tự nhận luật "Entry mỏng — 0 business logic" nhưng 10 verb dày nhất chiếm
  ~2600/5299 dòng (49%) — riêng verb `approve` một mình đã 742 dòng (14%).
- Ứng viên Rust tốt nhất: **kernel (12 file) + domain (31 file) = 43/82** — phần lớn thuần
  logic, đã tách khỏi I/O, có 142 file test pin hành vi sẵn.
- Mìn lớn nhất cho bất kỳ chiến lược Rust nào có ghi `.fgos/`: CTR002 "một cửa ghi" hôm nay
  chỉ đảm bảo **per-process** (không lease/lock cross-process) — chính doc kiến trúc tự khai
  đây là nợ có tên, chưa trả. Thêm 1 tiến trình Rust ghi song song là tái mở đúng lỗ hổng đó.
- Đường đi khuyến nghị: bắt đầu từ **17 verb thuần đọc** (không ghi state, không effect ngoài)
  — không đụng vấn đề multi-writer — song song port kernel/domain làm thư viện dùng chung.

---

## 1 · Hai binary, một core dùng chung

| Binary | LOC | Verb | Vai trò |
|---|---|---|---|
| `bin/fgos.mjs` | 5299 | 55 (switch/case) | Entry tương tác — mọi verb người/agent gọi trực tiếp |
| `bin/fgos-runner.mjs` | 164 | 0 (chỉ flags `--once/--watch/--poll-ms/--dry-run/--config`) | Entry headless — dispatch loop, giao ngay cho `src/runner/loop.mjs` |

`fgos-runner.mjs` đúng như tài liệu mô tả: **mỏng thật** — parse flag, gọi `runOnce`/`runWatch`,
không business logic riêng. `fgos.mjs` thì không (xem §4).

Cả hai chia sẻ **một cửa ghi duy nhất**: `src/state/store.mjs` (facade `initStore`, `addWork`,
`moveWork`, ... — CTR002 trong architecture-map.md).

---

## 2 · Module inventory — 82 file / 5 tầng

Nguồn: `docs/architecture-manifest.json`, đối chiếu bằng diff với `find src bin -name '*.mjs'`
→ **82/82 khớp, không file thừa/thiếu** (manifest hiện tại là thật, không lỗi thời — dù §6 của
`architecture-map.md` chỉ liệt kê 14 dòng, xem câu hỏi mở #1).

| Tầng | # file | Đặc điểm | Ví dụ tiêu biểu |
|---|---|---|---|
| **entry** | 2 | Cửa vào — parse arg, gọi xuống, in kết quả | `bin/fgos.mjs`, `bin/fgos-runner.mjs` |
| **use-case** | 7 | Dàn trình tự nghiệp vụ | `loop.mjs` (77.6K, file lớn nhất repo), `intake/classify.mjs`, `intake/discovery.mjs`, `intake/plan.mjs`, `setup/checks.mjs`, `setup/registrations.mjs`, `state/cursor.mjs` |
| **infra** | 30 | Cổng side-effect — mỗi loại một cửa | `store.mjs` (fs), `worktree.mjs`/`merge.mjs` (git shell-out), `dispatch.mjs` (spawn), `github-adapter.mjs` (gh API) |
| **domain** | 31 | Luật thuần — FSM, graph, ranking, pool-picker | `status-fsm.mjs`, `stage-fsm.mjs`, `frontier.mjs`, `dep-graph.mjs`, `priority-formula.mjs`, `impact.mjs`, `cleanup/discover/plan/retro-pool.mjs` |
| **domain (tổng)** | 31 | | |
| **kernel** | 12 | Chất liệu bền — schema, log engine, format util | `events.mjs`, `work.mjs`, `envelope.mjs`, `command-registry.mjs`, `format-bytes.mjs`, `format-duration.mjs` |

Đối chiếu độc lập bằng GitNexus (semantic clustering trên toàn repo, không dựa vào manifest):

| Cluster (GitNexus) | # symbol | Cohesion |
|---|---|---|
| Runner | 273 | 76% |
| State | 241 | 73% |
| Scripts | 110 | 89% |
| Setup | 66 | 70% |
| Cli | 42 | 97% |
| Intake | 23 | **63%** (thấp nhất trong nhóm chính) |

Cohesion vừa-tốt, không có cluster nào báo động; `Cli` (97%) và `Scripts` (89%) rất gọn — hợp lý
vì `src/cli/` chỉ 4 file kernel/infra nhỏ. `Intake` 63% là điểm đáng để mắt nếu sau này refactor
khu đó (chỉ 23 symbol nên rủi ro thấp, không phải điểm nóng).

---

## 3 · Verb inventory — 55 verb trong `bin/fgos.mjs`

Nguồn kép, đã đối chiếu: `case '<verb>':` trong `bin/fgos.mjs` **==** `src/cli/command-registry.mjs`
(`COMMAND_REGISTRY`, manifest máy-đọc của `fgos --help --json`) — **khớp 55/55 tuyệt đối**, không
verb nào có case mà thiếu registry hay ngược lại. Registry là nguồn thật (kernel layer, 0 import
ngược lên logic) — dùng nó, không đoán, khi cần build front-end thay thế (kể cả bằng Rust).

### 3.1 Phân loại theo cờ registry (touchesState / requiresExistingStore / externalEffect / paginated)

| Nhóm | # verb | Verb |
|---|---|---|
| **Thuần đọc** (`touchesState=false` **và** `externalEffect=false`) | **17** | `version, list, ready, graph, gate-bypass, gate-check, stale, slots, conflicts, recheck-blocked, schedule, check, rollup, show, triage, doc-sources, lock-status` |
| Đọc nhưng chạm ngoài `.fgos/` (`touchesState=false`, `externalEffect=true`) | 4 | `review, docs-index, resync-worktree, main-checkout-reset` |
| Ghi `.fgos/` (`touchesState=true`) | 34 | phần còn lại |
| Có effect ngoài hệ (git/GitHub thật) | 8 | `cleanup, review, approve, sync-root, promote-to-component, docs-index, resync-worktree, main-checkout-reset` |
| Phân trang (`paginated=true`) | 4 | `list, ready, evolve, triage` |

### 3.2 LOC mỗi case block trong `bin/fgos.mjs` — 10 dày nhất / 10 mỏng nhất

| Hạng | Verb | LOC | Ghi chú |
|---|---|---|---|
| 1 | `approve` | **742** | merge policy, GitHub PR, conflict/catchup, iron-law gate — toàn bộ inline |
| 2 | `main-checkout-reset` | 336 | |
| 3 | `return` | 236 | |
| 4 | `edit` | 235 | |
| 5 | `sync-root` | 214 | |
| 6 | `list` | 179 | (dù `touchesState=false` — LOC dày do format/filter, không phải business risk) |
| 7 | `merge` | 156 | |
| 8 | `review` | 145 | |
| 9 | `add` | 144 | |
| 10 | `promote-to-component` | 143 | |
| — | **Tổng 10 verb trên** | **2630 / 5299 = 49.6%** | nửa file nằm trong 10/55 verb |
| ... | `catchup` 119, `take` 100, `move` 89 | | |
| 46 | `unlock` | 29 | |
| 47 | `reject` | 30 | |
| 48 | `stale`/`doc-sources` | 25 | |
| 49 | `gate-approve`/`goal` | 26 | |
| 50 | `gate-bypass` | 15 | |
| 51 | `doctor` | 17 | |
| 52 | `triage` | 18 | |
| 53 | `report`/`answer` | 13 | |
| 54 | `ready`/`rebuild` | 10 | |
| 55 | `version` | **4** | |

Full breakdown 55 verb (script tự viết, không dùng LLM đếm tay) sẵn có nếu cần — bảng trên đủ
đại diện cho phân bố (biên độ 4→742 dòng, hệ số ~185x).

---

## 4 · Boundary rõ hay chưa — trả lời trực tiếp

**Có, ở cấp module — nhưng không ở cấp trong-file.**

1. **Kiến trúc 5 tầng là thật, không phải slide.** `docs/explanation/layered-architecture-invariant.md`
   kể lại 5 lần liên tiếp một module mới ship thiếu row `architecture-manifest.json` và bị
   `test/architecture.test.mjs` bắt đỏ ngay lần chạy `npm test` kế tiếp — kể cả module "chỉ là
   data thuần, rõ ràng vô hại". Cơ chế enforce là thật, chạy trong CI, không phải convention
   miệng.
2. **Nhưng layering chỉ kiểm 2 việc**: (a) đủ sổ — mọi file có đúng 1 row; (b) chiều import
   một-chiều-xuống. Nó **không kiểm độ dày logic trong một file/case-block**. Đó là lý do
   `bin/fgos.mjs` (tầng `entry`, tự khai "0 business logic", xem `architecture-map.md` §3 bảng
   tầng) vẫn chứa 742 dòng nested if/switch cho riêng `approve` — conflict resolution, iron-law
   gate check, GitHub PR merge, ancestor catchup, drift acknowledgment đều nằm thẳng trong case
   block, không tách ra `src/runner/merge.mjs` (vốn đã tồn tại và **được** `approve` gọi tới,
   nhưng chỉ cho một phần — phần điều phối/nhánh quyết định vẫn ở lại entry).
3. **Command-registry.mjs là ranh giới verb rõ và đáng tin** — 55/55 khớp tuyệt đối với case
   thật, nằm ở tầng `kernel` (0 import ngược), là data thuần (tên, mô tả, JSON-Schema tham số,
   4 cờ hành vi). Đây là artifact tốt nhất trong repo để bám khi build alternate front-end.
4. **GitNexus cohesion xác nhận độc lập**: không cluster nào cho tín hiệu "trộn trách nhiệm"
   nghiêm trọng (thấp nhất 63%, vẫn > nửa). Vấn đề không phải "module sai chỗ" mà là "1 file
   (`fgos.mjs`) gánh quá nhiều logic lẽ ra thuộc tầng dưới nó".

**Kết luận boundary:** ranh giới **giữa module** rõ và có máy giữ. Ranh giới **trong
`bin/fgos.mjs`** (đặc biệt `approve`, `main-checkout-reset`, `return`, `sync-root`) thì không —
đây là nợ kỹ thuật thật, không phải ấn tượng chủ quan, đo được bằng LOC/case (§3.2) và bằng chính
luật kiến trúc mà repo tự đặt ra cho tầng Entry.

---

## 5 · Rust portability — chia tier theo bằng chứng

### Tier 1 — port trước, an toàn nhất: **kernel (12 file)**

Không phụ thuộc lên bất kỳ tầng nào khác (theo định nghĩa layer), được mọi tầng khác import.
Spot-check import `node:fs`/`node:child_process` trên các file domain/kernel trọng yếu:

| File | I/O import? | Ghi chú |
|---|---|---|
| `status-fsm.mjs` (280 loc) | **không** | thuần transition table |
| `frontier.mjs` (272 loc) | **không** | thuần derive |
| `priority-formula.mjs` (92 loc) | **không** | thuần tính toán |
| `dep-graph.mjs` (238 loc) | **không** | thuần cycle-check |
| `envelope.mjs` (21 loc) | **không** | thuần wrap |
| `work.mjs` (864 loc, kernel) | `fs` | schema + validation, fs chỉ cho default/side path hẹp |
| `events.mjs` (461 loc, kernel) | `fs` | log engine — I/O tập trung, ranh giới rõ 1 chỗ |
| `replay.mjs` (669 loc, domain) | `fs` | fold event log |

→ Phần lớn kernel/domain **thuần logic tất định** — khớp lý tưởng với type system Rust
(enum + exhaustive match cho các FSM), test được độc lập không cần mock I/O. Vài file có `fs`
(work/events/replay) vẫn là port tốt vì I/O bị khoanh vào đúng 1 module, không rải rác.

### Tier 2 — domain (31 file, trừ phần đã tính Tier 1 chồng)

FSM (`status-fsm`, `stage-fsm`), graph (`frontier`, `dep-graph`, `graph-harness`,
`graph-metrics`, `impact`), ranking (`priority-formula`), pool-picker
(`cleanup/discover/plan/retro-pool.mjs`) — luật nghiệp vụ thuần, tách khỏi I/O theo đúng thiết
kế "functional core" mà `architecture-map.md` tự khai (quyết định b0da87aa).

### Tier 3 — infra (30 file) — port được, nhưng cần viết lại I/O layer

Mỗi file "một loại side-effect, một cửa" theo đúng luật repo tự đặt:
- `worktree.mjs`, `merge.mjs`, `github-adapter.mjs` → shell ra `git`/`gh` — **port gần 1:1** sang
  Rust (`std::process::Command` hoặc crate `git2`), vì code hiện tại *đã* làm đúng việc đó qua
  `execFileSync`, không có magic Node-only.
- `dispatch.mjs` → spawn process worker — tương tự, portable.
- **`store.mjs` là điểm rủi ro cao nhất**: nó là cửa ghi duy nhất (CTR002). Port nó nghĩa là
  chọn một trong hai: (a) thay hẳn, retire writer Node — an toàn nếu làm trọn vẹn 1 lần; hoặc
  (b) chạy song song 2 tiến trình (Node + Rust) cùng ghi `.fgos/` — **đây chính là kịch bản mà
  `architecture-map.md` §4 tự khai "một-cửa hôm nay là per-process... nhiều tiến trình ghi đồng
  thời cần lease/lock chưa tồn tại"** (nợ có tên, ghi thẳng vào CTR002, dự kiến phải trả **trước
  STR6 fan-out** — không phải vấn đề Rust migration tạo ra, nhưng Rust migration kiểu (b) sẽ đụng
  đúng nợ này sớm hơn dự kiến).

### Tier 4 — port sau cùng / cần refactor trước: use-case (7) + entry (2)

`loop.mjs` (77.6K, file lớn nhất repo) và `bin/fgos.mjs` là nơi business logic + orchestration
rò xuống tầng lẽ ra phải mỏng (§4). Khuyến nghị: **đừng port nguyên trạng** — trước tiên đẩy
logic trong 10 verb dày nhất (§3.2) xuống infra/domain (thuần refactor, có 142 file test hiện
hành pin hành vi để làm lưới an toàn), rồi mới port entry — lúc đó nó thật sự chỉ còn arg-parse +
dispatch, gần như cơ giới để viết lại (vd. Rust + `clap`, gọi vào core đã port hoặc còn Node qua
FFI/subprocess).

---

## 6 · Chiến lược thay thế cụ thể — 4 lựa chọn

| # | Chiến lược | Rủi ro | Ghi chú |
|---|---|---|---|
| A | Big-bang rewrite toàn bộ | **Cao** | Vứt 142 test hiện hành làm spec hành vi; đụng ngay nợ CTR002 multi-writer |
| B | Thư viện Rust core thay kernel+domain, đóng gói cho Node qua N-API (napi-rs) | Thấp-vừa | Số tiến trình ghi `.fgos/` vẫn = 1 (Node) → **né hoàn toàn** nợ CTR002 |
| C | Binary Rust riêng, chỉ làm 17 verb thuần đọc (`list/show/ready/graph/triage/...`) | **Thấp nhất** | 0 verb nào trong 17 verb này ghi state → không có vấn đề multi-writer, chỉ cần đọc `.fgos/events.jsonl` + fold, giống hệt `replay.mjs` |
| D | 1 infra port cụ thể (vd. git ops của `worktree.mjs`) làm helper binary Rust, Node shell ra gọi | Thấp | Đúng pattern hiện tại đã dùng (Node cũng đang shell ra `git`), chỉ đổi implementer |

**Khuyến nghị:** bắt đầu **C** (17 verb đọc, không đụng CTR002) song song **B** (core logic dùng
chung) trên cùng thời gian biểu; hoãn mọi phương án đụng `store.mjs` ghi thật cho tới khi nợ
lease/lock CTR002 được trả — việc đó vốn đã nằm trong roadmap fgOS ("trước STR6 fan-out"), không
phải scope mới do việc chuyển sang Rust sinh ra.

---

## 7 · Tài sản test — lưới an toàn cho refactor/port

142 file test, đi theo đúng cây layer (không có test top-down tách rời code):

| `test/` | # file | Ứng với layer |
|---|---|---|
| `state/` | 36 | domain + kernel (state) |
| `runner/` | 26 | infra + use-case (runner) |
| `cli/` | 19 | entry (command-registry, envelope, exit-code) |
| `setup/` | 16 | infra/use-case (setup) |
| `scripts/` | 13 | — |
| `e2e/` | 12 | xuyên tầng |
| `intake/` | 4 | use-case |
| `report/` | 3 | domain |
| `skills/` | 3 | — |
| `evolve/config/install/util/` | 2+2+1+2 | domain/infra/kernel nhỏ |

`npm test` = `node --test 'test/**/*.test.mjs'` — chạy toàn bộ 142 file, không cần harness ngoài.
Đây là spec hành vi thực dùng được để verify bất kỳ module Rust nào port lại có khớp output với
bản Node cũ hay không (contract test / golden output, đặc biệt cho kernel/domain — output tất
định, dễ diff).

---

## Nguồn đã đọc trực tiếp

- `bin/fgos.mjs` (5299 loc, toàn bộ 55 case block)
- `bin/fgos-runner.mjs` (164 loc, toàn bộ)
- `src/cli/command-registry.mjs` (COMMAND_REGISTRY, 55 entry, đối chiếu case-by-case)
- `docs/architecture-manifest.json` (82 file, diff xác nhận khớp 1:1 với repo)
- `docs/architecture-map.md` (v0.6, §3 kết cấu, §4 physics, §6 registry, §7 contract CTR002)
- `docs/explanation/layered-architecture-invariant.md`
- Spot-check import `node:fs`/`node:child_process` trên 8 file domain/kernel trọng yếu
- GitNexus `gitnexus://repo/forgent/clusters` (cohesion độc lập)
- `package.json` scripts, `test/` tree (142 file, 15 thư mục con)

## Câu hỏi chưa chốt

1. `architecture-map.md` §6 (Sổ đăng ký component) chỉ liệt 14 dòng trong khi
   `architecture-manifest.json` (bản máy-đọc) đã có 82 file — có vẻ §6 (bản văn xuôi/mermaid) là
   snapshot cũ chưa refresh dù JSON đã đúng. Không rõ đây là chủ đích (JSON là nguồn thật, §6 chỉ
   minh hoạ) hay là doc-drift cần fix. Không tự sửa — cần hỏi team fgOS.
2. Rust thay thế nhắm mục tiêu gì: thay hẳn Node dài hạn, hay chỉ path nóng (perf-critical)?
   Câu trả lời quyết định trọng số B vs C ở §6 — nếu chỉ cần path nóng, C (verb đọc) gần như đủ
   và không cần đầu tư N-API packaging của B.
3. Báo cáo này thuần structural/boundary — **không có profiling hiệu năng thật**. Không biết verb
   nào đang chậm/tốn CPU thật sự để ưu tiên port theo giá trị đo được, chỉ theo độ an toàn
   (write-coordination risk) và độ thuần logic. Nếu động lực Rust là performance chứ không phải
   type-safety/maintainability, nên profile trước khi chọn tier port đầu tiên.
