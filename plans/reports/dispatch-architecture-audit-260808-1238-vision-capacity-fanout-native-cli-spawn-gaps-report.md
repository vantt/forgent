# Báo cáo: kiến trúc dispatch/orchestrator của fgOS — quét toàn bộ

Ngày: 2026-08-08. Nguồn: `docs/decisions/0026`, `docs/history/two-layer-dispatch/{CONTEXT,DISCUSSION}.md`,
`docs/history/execution-fanout/CONTEXT.md`, `docs/history/parallel-decomposition-footprint-avoidance/CONTEXT.md`,
`docs/history/native-first-dispatch-doctrine-phase-4-.../CONTEXT.md`, `.claude/skills/_shared/capacity-dispatch-fallback.md`,
`.claude/skills/fgos-fanout/SKILL.md`, `.claude/skills/fgos-researching/SKILL.md`, `src/runner/dispatch.mjs`,
`src/state/graph-metrics.mjs`, `src/runner/root-affinity.mjs`, `src/runner/frozen-judge.mjs`, `src/runner/loop.mjs`,
`src/state/work.mjs`, `docs/how-to/wire-a-skill-through-the-native-vs-cli-spawn-dispatch-decision.md`, và bằng chứng thực
nghiệm từ `tsk-o4l` (dogfood test chạy sống ngày 2026-08-08). Mọi khẳng định "đã xong" đều đối chiếu code thật, không suy đoán từ tên item.

---

## 1. Tầm nhìn gốc — decision 0026 "Native-First Dispatch Doctrine"

### Từ vựng (không được gộp)

| Khái niệm | Định nghĩa | Đặc điểm |
|---|---|---|
| **orchestrator** | VAI TRÒ quyết định kích hoạt 1 rootTask — không phải phần mềm cụ thể. Người mở session tương tác, `/fgOS:pick`/`-loop`, `fgos-runner` headless, `herdr-plugin` đều có thể đóng vai này | **Không cần soul** — logic chọn "việc nào tiếp" giữ thuần cơ học; soul chỉ vào cuộc SAU khi orchestrator đã quyết định |
| **rootTask** | Việc gốc, có vòng đời đầy đủ (claim → worktree → thực thi → verify → merge) | Đệ quy/fractal — ai đang host 1 việc, lúc tự kích việc con, chính nó lại là rootTask của việc con |
| **subTask** | KHÔNG phải phạm trù riêng — bản chất chỉ là 1 rootTask khác, kích đệ quy | Tên gọi tương đối theo góc nhìn bên kích hoạt |
| **capacity** | Helper hẹp, không mang vòng đời rootTask đầy đủ (vd `judge-discovery`, `submit-assist-classify`) | Đăng ký `.fgos/config.json`'s `runner.capacities.<id>` |

subTask và capacity **khác bản chất thật** — không gộp khái niệm. Cái gộp là **cơ chế dispatch**: quyết định "kích bằng gì" (native hay cli/spawn) áp y hệt cho cả hai, vì bên kích hoạt không cần biết target là rootTask-con hay helper, chỉ cần biết 4 điều: có cần soul không, cùng provider không, có cơ chế native tương ứng không, config có ép cli/spawn không.

### 4 quy tắc chọn cơ chế dispatch

1. Target thuần cơ học (không cần soul) → luôn cli/spawn.
2. Target cần soul, CÙNG provider với rootTask đang chạy → ưu tiên native.
3. Target cần soul, KHÁC provider → bắt buộc cli/spawn — chưa provider nào có native cross-provider (Claude's Task tool chỉ chọn được model Claude).
4. Config có thể ép cli/spawn dù cùng provider (cách ly tài nguyên, worktree/cwd riêng) — hợp lệ, không phải bug (`forceCliSpawn`).

### Hàm quyết định thật (code, không phải mô tả)

```js
// src/runner/dispatch.mjs
export function decideDispatchMechanism({ hasNativeMechanism, hasLiveTaskAccess, forceCliSpawn }) {
  if (!hasNativeMechanism) return 'cli-spawn';
  if (forceCliSpawn) return 'cli-spawn';
  return hasLiveTaskAccess ? 'native' : 'cli-spawn';
}
```

`hasLiveTaskAccess` LUÔN là tự khai báo của bên gọi (never inferred từ môi trường/config) — "session tự biết tool manifest của chính nó" là nguyên tắc xuyên suốt toàn bộ cơ chế, không bao giờ dò/đoán. Rule 3 (cross-provider) không nằm trong hàm này — nó được xử lý sớm hơn, ở `resolveExecutorConfig`'s `allowCrossProvider` gate.

`decideCapacityDispatchMechanism(cfg, capacityId, {hasLiveTaskAccess})` là wrapper tiện dụng cho riêng `capacities.<id>`: tự suy `hasNativeMechanism = capacity.kind === 'task'` và `forceCliSpawn = capacity.forceCliSpawn`. Đây là sibling THUẦN ĐỌC — không đụng `resolveExecutorConfig` (impact-analysis xác nhận CRITICAL blast radius, 8 symbol/7 flow ngược dòng nếu sửa trực tiếp).

### Lộ trình triển khai — 5 pha (doctrine's own phase plan)

| Pha | Item | Nội dung | Trạng thái |
|---|---|---|---|
| 1 | `tsk-1ni` | Sửa `judgeDiscovery`'s blind cli-spawn (repoRoot bug) — điểm khởi phát cả doctrine | Delivered |
| 2 | `tsk-27y` | Caller-supplied-verdict: session sống tự cấp verdict cho `fgos discover`/`fgos plan`, bỏ qua judge subprocess mù | Delivered |
| 3 | `tsk-53h` | Rút `capacity-dispatch-fallback.md` thành fragment dùng chung — nhưng **chỉ rút wiring cli/spawn có sẵn của `fgos-submit-assist`, chưa từng xây nhánh native thật** (phát hiện lúc scout Pha 4) | Delivered (nhưng không đúng như phase-table kỳ vọng ban đầu) |
| 4 | `tsk-3ik` | Hợp nhất `capacities.<id>` config-path với direct Task-tool call dưới MỘT quyết định — xây `decideDispatchMechanism`/`decideCapacityDispatchMechanism`/CLI `decide`, và tự xây **nhánh native-Task-dispatch THẬT ĐẦU TIÊN** (vì Pha 3 chưa làm) | Delivered — 126/126 test xanh, không đụng `resolveExecutorConfig` |
| 5 | ? | Không tìm thấy nội dung Pha 5 cụ thể trong tài liệu quét được | **Chưa xác định** — có thể là khoảng trống tài liệu, không phải khoảng trống thiết kế; đáng hỏi người |

---

## 2. Cơ chế capacity — 4 bước A→D + presence check

```
Step A (config check) → not-configured: fallback inline im lặng
                       → configured: sang B
Step B (presence check, `fgos tool query --capability <id> --status present`)
                       → 0 provider: cảnh báo 1 dòng rồi fallback inline
                       → 1 provider present: sang B.5
Step B.5 (native-vs-cli decide) → cli-spawn: sang C
                                 → native: gọi thẳng Agent/Task tool, in announce line, bỏ qua C
Step C (cli-spawn dispatch) → resolveExecutorConfig build command/args → in announce line → exec thật
Step D (malformed response) → fallback inline y hệt như capacity vắng mặt
```

**4 lý do hợp lệ để dispatch thay vì làm tại chỗ** (`docs/history/two-layer-dispatch/DISCUSSION.md` D2, nguồn duy nhất — skill nào cũng trỏ về đây, không tự chép lại): model rẻ hơn, provider khác, cô lập tài nguyên, **chạy song song cho nhanh** (lý do thứ 4 mới thêm — danh sách gốc 3 lý do ra đời trước khi Ship Faster thành ưu tiên #1, vô tình bỏ sót đúng lý do phục vụ nó). Ngoài 4 lý do này → làm inline.

### 3 consumer thật của cơ chế capacity — không phải tất cả đi qua `decide`

| Capacity | `kind` | Đi qua `decide`? | Vì sao |
|---|---|---|---|
| `judge-discovery` | `task` | **KHÔNG** | `runJudgeExecutor → spawnAttempt → spawnSync` (`judge-executor.mjs`) — bare subprocess-spawn, KHÔNG BAO GIỜ có live Task access dù gọi từ session sống hay runner headless. Gọi `decide` ở đây chỉ luôn trả `cli-spawn` — nhánh chết, không phải wiring thật. "native" thật cho 2 capacity này là cơ chế KHÁC hẳn: caller-supplied-verdict (Pha 2), không phải `decide`-shaped |
| `judge-decompose` | `task` | Như trên | Như trên |
| `submit-assist-classify` | `cli` | Có (nhưng luôn `cli-spawn`) | Cross-provider (agy/Gemini) — rule 3 luôn thắng, không có nhánh native để chọn |

Scout xác nhận (lúc Pha 4 xây): **0 call site trực tiếp Task/Agent tool** trong `.claude/skills/`/`plugins/fgOS/skills/` trước Pha 4 — nghĩa là nhánh "subTask-shaped, gọi Task tool trực tiếp qua `decide`" **chưa từng có consumer thật trong repo** tại thời điểm đó. Pha 4 tự xây bằng chứng đầu tiên; kể từ đó, `fgos-fanout` (Agent tool gọi `/fgOS:pick` con) và `fgos-researching` (fan-out câu hỏi độc lập) đã trở thành 2 consumer subTask-shaped thật, tuy KHÔNG đi qua `decide` bằng lệnh CLI — chúng tự biết mình luôn native (in-session, cùng provider) mà không cần hỏi.

---

## 3. Hai lớp dispatch (tsk-2t6) — gather packet (B1) vs exec packet (B2)

Bài toán gốc: fgOS chỉ có MỘT cách chia việc — mọi thứ tách ra thành work item đầy đủ vòng đời (stage FSM, pull door, status pool, retro, cleanup). Cần cách nhẹ hơn cho việc nhỏ không đáng thành hành chính.

| | **B1 — gather packet** | **B2 — exec packet** |
|---|---|---|
| Ghi file? | KHÔNG — chỉ đọc/tổng hợp | CÓ — con ghi code thật |
| Cần id? | KHÔNG | Có, nhưng **ephemeral, phạm vi cha** (không stage FSM, không pull door, không status pool, không retro/cleanup) |
| Đã xây? | **CÓ — đây chính là `capacity`, khái niệm đã khoá ở 0026, máy đã chạy Pha 4** | **VẪN GATED (D4)** — không mở ô thứ 3 giữa rootTask và capacity |

Trích thẳng DISCUSSION.md: *"Điểm khởi đầu đúng không phải 'fgOS cần lớp dispatch thứ hai' — fgOS đã có nó, và nó tên là `capacity`."*

**D4/D9 — điều kiện duy nhất để mở lại B2:** cả 2 phải đúng cùng lúc — (a) `tsk-3xd` đã merge (**đã thỏa 2026-08-06**) VÀ (b) ≥2 ca thật ghi nhận bằng capture/friction, nơi cha cần con GHI file mà việc đó không đáng thành work item riêng. Thiếu (b) → gác vô thời hạn. **Tại thời điểm báo cáo này, (b) chưa có ca nào ghi nhận** — B2 vẫn đóng.

### D6/D6b — 6 field bắt buộc cho ad-hoc packet

| Field | Hình dạng | Vì sao bắt buộc |
|---|---|---|
| `id` | `<scope>#p<n>` | `#` phá `ID_PATTERN` của `work.mjs` một cách CẤU TRÚC (không phải quy ước) — không bao giờ nhầm packet id với work-item id thật; đây chỉ là reference id để cha khớp digest trả về, KHÔNG PHẢI lifecycle id (D4 vẫn gate nguyên) |
| `goal` | 1 câu | Điều worker không tự suy ra được từ file được giao |
| `inputs` | đường dẫn cụ thể | "đọc đúng những cái này, không gì khác" |
| `boundary` | không được đụng gì | Tương đương `forbidden_paths` của symphony |
| `expected shape` | hình dạng digest trả về | Thiếu → worker tự chọn format, cha phải đoán |
| `return contract` | 1 format trả lời cố định | Tương đương status-token discipline của bee: "thoát tiến trình không phải là báo hiệu" |

Thiếu field nào → fallback inline (Step D), **không bao giờ dispatch nửa vời**.

`<scope>` = id item đang claim, hoặc `s<8-ký-tự-đầu-của-resolveWriterIdentity>` khi không có claim nào (4-tầng fallback registry/env/pid/unresolved đã có sẵn, không phát minh nguồn identity mới). `<n>` = counter trong bộ nhớ phiên soạn packet, **không bao giờ backing bằng file** (file counter = state = mở lại đúng cửa hậu D4 vừa đóng).

---

## 4. Provider/tier judgment cho ad-hoc dispatch (D5/D7/D10/D12)

- **Chưa tách field `work.tier`** — quyết định D lock: giữ 1 field mang 2 nghĩa (nghi thức quy trình `isTierCovered` + model qua `modelForTier`), KHÔNG split. `work.mjs`'s comment tự cảnh báo: *"Do not let the two drift apart"* — biết là rủi ro, chấp nhận có chủ đích (Path B thắng Path A ở tsk-503, chốt trực tiếp với người, không nằm trong DISCUSSION.md's vòng đầu).
- **Judgment KHÔNG qua subprocess judge thứ hai** — phán tier/provider ngay TẠI CHỖ (inline, cùng session), tránh đúng cái bẫy "soul re-deriving what a live soul already knows" mà `tsk-1ni` từng bắt được ở `judgeDiscovery`.
- **Fail-safe NGƯỢC với D6's packet**: field packet thiếu → KHÔNG dispatch, fallback inline. Judgment tier/provider không phán được → **VẪN dispatch**, dùng default (`capacity.tier`/`capacity.model` hoặc `modelForTier` tính toán) — một phán đoán không tới không phải lý do chặn 1 dispatch lẽ ra vẫn chạy được.
- **Ghi log mọi lựa chọn** (đã phán HOẶC mặc định) qua `appendWorkerLog` — 1 cửa ghi duy nhất, `.fgos/logs/<scope>.log`, không file mới. Log CẢ trường hợp default (không chỉ lúc "downgrade") — cần đủ mẫu số để sau này đo "tier đắt có thật sự khan hiếm không".
- **Cổng `allowCrossProvider`** hiện gác theo **capacity id** cố định (`dispatch.mjs:691-693`). Gói ad-hoc mang nội dung khác nhau mỗi lần → cổng phải chuyển thành **gác per-dispatch** — đây là rủi ro đã ghi nhận trước, phải xử khi port, **chưa xác nhận đã sửa trong scan này** (đáng kiểm lại riêng nếu ad-hoc packet cross-provider thật sự đi vào dùng).

---

## 5. Execution fan-out (`tsk-umc`) — song song thật, có vòng đời đầy đủ

Khác B1/B2 ở trên (giúp việc NHỎ tránh hành chính) — fan-out chạy N **work item thật** (đã `decompose`) đồng thời, thay hàng đợi tuần tự.

### D1-D10 (đã khoá, `docs/history/execution-fanout/CONTEXT.md`)

| D | Nội dung |
|---|---|
| D1 | Con LÀ work item thật — không mở B2. Chi phí đắt nằm ở *chính sách hậu kỳ* (TTL, approve từng lá), không ở *bản chất* claim/verify/merge |
| D2 | Auto-approve LÁ; cổng ROOT giữ nguyên bắt buộc người; risk-keyword exception của `gateBypass` D4 vẫn áp |
| D3 | Bài "messy task-list" giải bằng cần gạt view — item riêng `tsk-4fg` |
| D4 | Case 2 (cụm epic, con merge riêng lên main) dùng `goalTier`+`targets` có sẵn |
| D5 | **Cha tiền-kiểm (advisory), con claim (authority thật), cha merge.** Mỗi con chạy `/fgOS:pick <id>` NGUYÊN VẸN, không tắt |
| D6 | Gom = cha đọc STATE thật rồi approve theo ranking của verb `merge` — không có giao thức báo cáo, Agent tự thuật không phải bằng chứng |
| D7 | **Trần cứng 5 Agent cùng lúc** — không bao giờ vượt dù nhiều con sẵn sàng hơn |
| D8 | **Fan-out là NĂNG LỰC tự kích hoạt, KHÔNG PHẢI cửa vào.** Không có `/fgOS:fanout`. Chỗ nối = xử lý báo cáo "anchored-by-open-children" của `fgos-coding-driving` — mọi caller hiện có/tương lai đều fan-out được qua CÙNG một chỗ |
| D9 | Lá `blocked` chỉ dừng chính nó — anh em độc lập chạy hết; `deps-not-merged` guard (`claim-port.mjs:158-166`) đã tự chặn dependent, không cần logic hủy mới |
| D10 | `verify` = `npm test && node scripts/verify-fanout-overlap.mjs` — chứng minh **chồng lấn thời gian THẬT** (≥2 `work.move`→doing từ CÙNG 1 lần chạy, khoảng doing overlap, cả 2 đạt awaiting-approval, không hỏi người ngoài cổng root) — không chỉ chứng minh file skill tồn tại |

### Cơ chế wave-schedule

`computeSchedule` (`src/state/graph-metrics.mjs`, Kahn layering + Tarjan cycle-detect) — **cố ý KHÔNG dùng lại** `mergeReadiness` của `graph-harness.mjs` (D2 của `tsk-66o`): 2 bài toán khác nhau — dispatch cần "bao nhiêu chạy song song NGAY", merge chỉ cần "thứ tự tương đối". Cũng **không dùng** `selectWave` của runner (`loop.mjs:156`, `DEFAULT_MAX_LEAVES_PER_ROOT=4`) — xếp theo root-affinity với trần `maxRoots`, sai trục cho "1 root nhiều lá".

`candidateIds` (tùy chọn) SCOPE tập ứng viên TRƯỚC KHI xếp wave — không lọc SAU khi xếp (lọc sau giữ nguyên vị trí wave sai, chỉ giấu đi). Item không khai `footprint` → không bao giờ xung đột với gì (semantics giữ nguyên như `footprintOverlap`).

### Vòng lặp thật (`fgos-fanout` SKILL.md)

```
loop:
  view = fgos list --json (fresh)
  openCandidates = candidateIds còn mở
  if rỗng: dừng, báo trạng thái cuối từng id
  scheduled = computeSchedule(view, openCandidates).waves[0]
  ready = scheduled ∩ (frontier ∪ isResolvedStatus deps)   # D5 tiền-kiểm, advisory
  for mỗi batch ≤5 id (D7):
    in announce line mỗi id  # <thêm 2026-08-08>
    dispatch song song thật (1 message, N Agent call)
    đợi CẢ BATCH settle (Promise.allSettled-rồi-poll) trước khi đọc state lại
  view = fgos list --json (fresh)
  approve lá awaiting-approval theo thứ tự `merge` verb's ranking, TRỪ hard-gate risk-keyword hit
  báo lá blocked, không hành động thêm (D9's guard đã tự chặn dependent)
  lặp lại
```

---

## 6. Bảo vệ chống xung đột — 3 mức leo thang (`tsk-66o`, `docs/history/parallel-decomposition-footprint-avoidance/CONTEXT.md`)

| Mức | Nội dung | Trạng thái |
|---|---|---|
| **1 — advisory-only** | (a) `footprintDiffHits` — broaden `frozen-judge.mjs` flag MỌI diff ngoài footprint khai (không chỉ pattern test/CI/lockfile cũ), chỉ FLAG không chặn; (b) `worktree-dispatch-attestation` — chụp `baseCommit`/`headRef` NGAY TRƯỚC dispatch (`captureDispatchAttestation`, `dispatch.mjs`), không tin executor tự báo | **✅ ĐÃ XONG** (`tsk-2ig`, `tsk-4hl`) — **cập nhật quan trọng: deep-dive 2026-08-05/06 từng liệt đây là khoảng trống, nay (2026-08-08) đã đóng** |
| **2 — hard-refusal-at-merge** | Chặn cứng lúc merge nếu diff lệch footprint | **Deferred**, chưa có item |
| **3 — OS-level sandbox** | `EXECUTOR_ADAPTERS` entry cách ly hệ điều hành cho capacity spawn | **Deferred** — `tsk-49o`, đang `todo/clarify`, thật sự mở |

D5 (`tsk-66o`): check broadened (footprintDiffHits) **exempt hoàn toàn** item không khai footprint — tránh biến "không có baseline" thành nhiễu 100% (Ship Faster: đo tốc độ project DÙNG fgOS, không phải tự vệ quá tay).

Merge dàn trận (backstop có sẵn từ trước, không phải sản phẩm của `tsk-66o`): `git merge --no-commit --no-ff` → verify trên cây chưa commit → xanh mới commit, đỏ/xung đột thì abort sạch, main byte-untouched (`src/runner/merge.mjs`).

---

## 7. Song song ở tầng runner headless — khác trục hoàn toàn với fan-out

`fgos-runner --watch` (`src/runner/loop.mjs`) — orchestrator HEADLESS, không người ngồi terminal. `selectWave`/`DEFAULT_MAX_LEAVES_PER_ROOT = 4` giới hạn **số root** đồng thời × **số lá/root** — trục "nhiều root, mỗi root giới hạn lá". Root-affinity (`root-affinity.mjs`) giữ mọi lá của 1 cây lineage cùng 1 chủ trong 1 lượt drain — PURE, in-memory only, không ghi `.fgos/`.

fan-out (`fgos-fanout`) = trục ngược lại: **1 root, nhiều lá**, cap 5 — đây là lý do 2 selector KHÔNG dùng chung nhau, dùng nhầm sẽ bóp wave sai hướng.

---

## 8. Quan sát được (observability) — commit trong 2 ngày qua, xác nhận sống bằng `tsk-o4l`

Trước 2026-08-07, KHÔNG điểm dispatch nào tự báo mechanism/provider/model ra ngoài — hoàn toàn ngầm. Đã vá 3 điểm:

| Điểm | Trước | Sau | Commit |
|---|---|---|---|
| `capacity-dispatch-fallback.md` nhánh native (Step B.5) | Câm | `<CAPACITY_ID> - native - <agentType> - <model>` | `1c741c7` |
| `capacity-dispatch-fallback.md` nhánh cli-spawn (Step C.3) | Có announce nhưng thiếu token mechanism | `<CAPACITY_ID> - cli-spawn - <provider> - <model>` | `1c741c7` |
| `fgos-fanout` (mỗi Agent dispatch trong wave) | Câm | `<id> - native - <subagent_type> - <model>` trước mỗi lần bắn | `1c741c7` |
| `fgos-researching` (D2 fan-out câu hỏi độc lập) | Câm — SKILL.md chỉ trích 6-field shape, không hề nhắc announce | `<packet id> - native - <agentType> - <model>` mỗi nhánh | `441e1af` |

**Xác nhận sống qua `tsk-o4l`** (dogfood test, chạy thật `/fgOS:pick` end-to-end 2026-08-08): D2 fan-out của `fgos-researching` thật sự dispatch 2 nhánh độc lập song song (1 message, 2 Agent call), cả 2 announce line in đúng format, `RESEARCH.md` ghi 2 finding có trích dẫn thật (repo file:line + external nodejs.org URL). **Không phải suy đoán trên giấy** — evidence thật từ 1 lượt chạy sống.

**Giới hạn còn lại của observability:** đây vẫn là **prose agent tự đọc, không phải code chặn được** — đúng câu AGENTS.md tự nói cho gate GitNexus: *"prose the agent reads, never compiled logic"*. Agent tool KHÔNG đi qua `dispatch.mjs` (chỉ cli-spawn mới qua `resolveExecutorConfig`) → không có chokepoint code nào ép được. Một phiên gọi Agent tool NGOÀI 3 skill trên (kể cả chính tôi dispatch subagent tùy hứng trong hội thoại) **không có announce line** — không có cách nào phủ 100% bằng prose-only convention.

---

## 9. Bảng lệnh kích hoạt thật

| Muốn gì | Lệnh/skill |
|---|---|
| Pick 1 việc, chạy hết vòng đời | `/fgOS:pick [id]` |
| Chạy nhiều con song song (đã decompose) | invoke skill `fgos-fanout` với `parentId`+`candidateIds` |
| Vòng lặp merge tuần tự mọi item ready | `/fgOS:merge-loop` / `/fgOS:merge-next` |
| Vòng lặp clarify/decompose tuần tự | `/fgOS:discover-loop` / `/fgOS:discover-next` |
| Runner nền tự động, song song có giới hạn root-affinity | `bin/fgos-runner.mjs --watch` |
| Free-text task hết vòng đời trong 1 phiên | `/fgOS:cook <mô tả>` |
| Kiểm capability có mặt không | `fgos tool query --capability <id> --status present` |
| Kiểm cơ chế dispatch native/cli-spawn | `node src/runner/dispatch.mjs decide <id> [--has-live-task-access]` |
| Resolve command/args thật cho 1 capacity | `node src/runner/dispatch.mjs resolve <id> --prompt "..."` |

---

## 10. Ma trận ĐÃ XONG / ĐANG DỞ / GIỚI HẠN

### Đã xong (xác nhận bằng code/commit thật, không phải tên item)

- Vocabulary orchestrator/rootTask/subTask/capacity khoá (0026).
- `decideDispatchMechanism`/`decideCapacityDispatchMechanism`/CLI `decide` — Pha 4, 126/126 test.
- `capacity-dispatch-fallback.md` A→D đầy đủ, 6 consumer thật trỏ vào (fgos-coding-implement/exploring/planning/validating/researching/submit-assist).
- Ad-hoc packet 6-field + `--model`/`--tier` override trên `dispatch.mjs resolve`.
- Provider/tier judgment fragment (D12) — inline, ghi qua `appendWorkerLog`.
- Fan-out execution thật (`tsk-umc`) — D1-D10, verify chồng-lấn-thời-gian thật, xác nhận sống qua `tsk-o4l`.
- `computeSchedule` (Kahn+Tarjan), scoped bằng `candidateIds`.
- Attestation mức 1 (`baseCommit`/`headRef` trước dispatch) + `footprintDiffHits` broadened — **mới đóng, từng là gap trong deep-dive trước**.
- Announce line mechanism/provider/model — 3/3 điểm dispatch xác định được đã vá, xác nhận sống.

### Đang dở / chưa làm (thật sự mở, có item hoặc chưa)

| Việc | Trạng thái | Item |
|---|---|---|
| B2 (exec packet, ephemeral id cho con GHI file nhỏ) | Gated, chờ D9's 2 điều kiện (1/2 đã thỏa) | Chưa có item — chờ ≥2 ca thật |
| Attestation mức 2 (hard-refusal-at-merge) | Chưa bắt đầu | Chưa có item |
| Attestation mức 3 (OS-level sandbox executor) | `todo/clarify`, thật sự mở | `tsk-49o` |
| Cổng `allowCrossProvider` chuyển từ per-capacity sang per-dispatch (cho ad-hoc packet cross-provider) | Ghi nhận rủi ro, chưa xác nhận đã sửa | Chưa xác nhận |
| Pha 5 của Native-First doctrine | Không tìm thấy nội dung trong tài liệu quét được | Không rõ item |
| Announce-line convention phủ ngoài 3 skill đã vá | Không thể phủ 100% (prose, không code-enforced) | Không phải "item" — là giới hạn cấu trúc |
| Completeness gap (decompose làm rớt 1 decision khỏi footprint của MỌI con) | Filed riêng, khác failure mode với collision | `tsk-1gr` |

### Giới hạn cấu trúc (không phải thiếu làm — là bản chất thiết kế)

- `work.tier` mang 2 nghĩa (nghi thức + model) — quyết định giữ nguyên, chấp nhận rủi ro trôi, tự cảnh báo trong code comment.
- Native dispatch không có chokepoint code — mọi rule về nó chỉ là prose 1 skill tự đọc, không thể ép bằng compiled logic.
- `judgeDiscovery`/`judgeDecompose` (`kind:"task"`) không bao giờ tự đạt native qua `decide` — `spawnSync` mù cấu trúc không cho phép; "native" thật của 2 cái này đi đường khác hẳn (caller-supplied-verdict).
- GRANDCHILD-SIGTERM: `spawnSync`'s timeout chỉ kill tiến trình con trực tiếp, không kill process tree grandchild (agent CLI tự shell ra tiếp) — chấp nhận là hạn chế biết trước, chưa nâng lên process-group kill.

---

## 11. Câu hỏi còn mở (để người chốt)

- Pha 5 của Native-First Dispatch Doctrine là gì — tài liệu quét được không nêu rõ.
- D9's điều kiện (b) cho B2 (≥2 ca thật cha cần con ghi file nhỏ) — có case nào đang treo đủ tiêu chuẩn chưa, hay tiếp tục gác?
- Cổng `allowCrossProvider` per-capacity→per-dispatch cho gói ad-hoc — đã có ai đụng tới chưa, hay vẫn là rủi ro treo?
- Announce-line convention nên dừng ở prose (3 skill đã vá) hay cần 1 lớp enforce mạnh hơn (vd hook/wrapper) — đánh đổi chi phí xây dựng vs độ phủ.
