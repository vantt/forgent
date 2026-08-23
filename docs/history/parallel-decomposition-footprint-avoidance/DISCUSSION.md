# Parallel decomposition + footprint avoidance — DISCUSSION

## 1. Trạng thái hiện tại

**Discussion đã HỘI TỤ — không còn D nào mở.** Distill xong (deep-dive +
porting-log). Decision 0026 (native-first dispatch) xác nhận cơ chế
agy/opencode: luôn `cli/spawn` qua `resolveExecutorConfig`. Đã chọn
`tsk-66o` làm gốc (thay vì submit 2 item mới trùng câu hỏi), claim, chạy
`fgos-coding-exploring` Socratic — cả 4 quyết định đã khoá thật (D1, D2, D3, D4,
mỗi cái đã có `fgos decision --id tsk-66o` riêng, xem §4). Gap "bỏ sót"
(D4 = quyết định TÁCH gap đó ra) đã filed thành `tsk-1gr`, sibling độc
lập. `refs` của cả `tsk-66o` (→ `#design`) và `tsk-1gr` (→
`#task-tsk-1gr-completeness-gap`) đã set và push lên `origin/main`. Đã
ghi chú cross-reference vào `tsk-49o` (mức 3 hoãn của D3, không tự đủ
nếu sau này chọn — vẫn cần phần base/identity-check của D3 đi kèm).

**`fgos-coding-exploring` đã xong.** `CONTEXT.md` viết (D1-D6), gate approved
(human), title/description sửa khớp scope thật. Gặp friction thật ở bước
cuối (`fgos discover`'s semantic-verify judge, `judgeVerifySemanticCorrectness`)
— 8 vòng bị dispute vì item còn ở stage `decompose` sắp tới, chưa có code,
mà judge cứ đòi verify vừa cụ thể-tới-mức-đặt-tên-hàm vừa PASS ngay hôm
nay (catch-22 thật cho mọi root behavior_change chưa xây — friction đã
ghi qua `fgos decision --id tsk-66o`, seq 6564; `tsk-3w3` dính đúng gap
này, kẹt sẵn ở `clarify`, không phải riêng tsk-66o). Qua bằng `--force`
(cơ chế chính thức, luôn log công khai, không âm thầm) với verify cụ thể
nhất đã đề xuất — 3 file + 3 tên hàm mới (`computeSchedule`/`detectCycles`,
`baseCommit` capture, `footprintDiffHits`) khớp D2/D3 đã khoá hướng, cộng
chạy 3 test file thật liên quan. `tsk-66o` giờ ở `doing`/stage `decompose`
— sẵn sàng cho `fgos-coding-planning`.

**Round 2 (lịch sử, không còn ảnh hưởng D nào):** main checkout dùng
chung có phiên khác (cùng user) mid-merge (`2bc193d`) rồi commit tiếp
(`8c1dab1`) trong lúc tôi cố commit refs; không mất dữ liệu, chỉ delay
vài lần retry (`f2604ef`).

## 2. Mục tiêu & đề bài

forgentX muốn học từ upstream bee cách chia việc thành đơn vị chạy song
song được và tránh xung đột footprint giữa chúng, nhưng khác bee ở một
điểm kiến trúc cốt lõi: việc con ở khâu code-implement không chạy như
subagent Claude cùng phiên (bee's cell-swarm) mà bị đẩy ra cho agent
provider khác — agy/opencode — qua `resolveExecutorConfig`
(`src/runner/dispatch.mjs`), luôn `cli/spawn` theo decision 0026 vì luôn
khác provider với rootTask Claude. Câu hỏi gốc của `tsk-66o` — "Planning/
Validating có khai báo rõ footprint chưa? có dùng graph để phân chia task
để không đụng footprint?" — mở ra một phát hiện lớn hơn dự kiến: forgentX
đã hội tụ độc lập với phần lớn ý tưởng "cell" của bee rồi (footprint khai
báo, `acceptance`+evidence, merge dàn trận verify-trước-commit, worktree
cô lập per-item qua `fgos pick`), và một module đọc-only ít được biết tới
(`graph-harness.mjs`'s `mergeReadiness`) đã giải một nửa bài toán gom-
nhóm+xếp-thứ-tự bằng graph — chỉ chưa chạy ở đúng thời điểm (dispatch
thay vì merge). Đề bài thật của cụm việc này: đóng 2 khoảng trống còn lại
(wave-schedule ở tầng dispatch, và tin cậy dispatch cho executor NGOÀI
kém tin hơn subagent cùng nhà) mà không phá vỡ những gì đã hội tụ đúng.

## 3. Vấn đề rõ / chưa rõ

| # | Vấn đề | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Footprint có khai báo được ở Planning/Validating không | **Rõ** | Có, `footprint` optional trên `add`/`edit`/judge-proposed lúc decompose (`work-state.md` ~1022), PHI-CHẶN — chỉ nuôi cố vấn `fgos conflicts`, không chặn gì |
| 2 | Có dùng graph để tránh xung đột footprint không | **Rõ, có 2 tầng khác nhau** | Dispatch-time: `footprintOverlap`/`footprintConflicts` (`graph-metrics.mjs`/`store.mjs`) — CẶP-only, chạy trên `frontier()`. Merge-time: `graph-harness.mjs`'s `mergeReadiness` — gom-nhóm connected-component + xếp-thứ-tự serialize (`footprintOverlapAmong`), chạy trên `proposed` items. Không cái nào SPLIT/re-slice tự động — cả hai đều advisory |
| 3 | Worktree có cô lập việc con không | **Rõ** | Có — `fgos pick` tạo worktree riêng cho mọi coding item claim ở stage `executing` (đã chạy thật, không phải tính năng tương lai) |
| 4 | agy/opencode dispatch qua cơ chế gì | **Rõ** | Luôn `cli/spawn` qua `resolveExecutorConfig` + `capacities.<id>` (decision 0026 quy tắc 3), gác nội dung riêng bằng `allowCrossProvider`. Cơ chế spawn cụ thể bên trong không ảnh hưởng thiết kế ở đây |
| 5 | Có gap "bỏ sót quyết định khỏi mọi footprint con" không | **Rõ, tách riêng** | Có, khác bản chất với chồng-lấn — filed `tsk-1gr`, không phải scope tsk-66o |
| 6 | **Mức độ rộng/hẹp của `worktree-dispatch-attestation`** | **CHƯA RÕ** | 3 mức: (a) advisory-only — chụp identity + mở rộng frozen-judge diff-toàn-phần, chỉ gắn cờ; (b) hard-refusal-tại-merge — lệch identity/base/diff NGOÀI footprint khai thì CHẶN merge thật (typed halt); (c) cô lập cấp OS — đây chính là scope `tsk-49o` đã file riêng (`EXECUTOR_ADAPTERS` sandboxed-cli-spawn), nếu chọn mức này thì item này nên `deps: [tsk-49o]` thay vì tự làm. User hỏi ngược "rộng hơn là cỡ nào" khi được hỏi hẹp/rộng, đã trình bày 3 mức nhưng chưa được chọn |
| 7 | Thuật toán wave-schedule có nên tái dùng `graph-harness.mjs` không | **Rõ** | Không — D2 chốt thuật toán RIÊNG (Kahn+cycle-detection), vì bài toán khác nhau: dispatch cần đếm song-song-được-mấy-cái NGAY BÂY GIỜ, merge chỉ cần thứ tự tuần tự |
| 6 (chốt) | Mức độ rộng/hẹp của `worktree-dispatch-attestation` | **Rõ** | D3: MỨC 1 — advisory-only. Mức 2/3 hoãn, không phải scope item này (mức 3 = `tsk-49o` riêng, đã ghi chú cross-reference vào chính `tsk-49o`) |

## 4. Quyết định đã chốt

| D-ID | Tóm tắt | Nguồn / rationale |
|---|---|---|
| D1 | Children của tsk-66o phủ **≥ 2 CHỦ ĐỀ** — worktree-dispatch-attestation-shaped work + computed-parallel-wave-schedule-shaped work (2 candidate từ `docs/distillery/porting-log.md`, deep-dive `docs/distillery/deep-dives/parallel-decomposition-and-merge.md`). Đây là số CHỦ ĐỀ, không phải số ITEM khoá cứng — mỗi chủ đề thành 1 item hay tách nhỏ hơn (vd worktree-dispatch-attestation có sẵn 2 mảnh file tách biệt, `dispatch.mjs` vs `frozen-judge.mjs`, xem §7) là việc của `fgos-coding-planning`, không khoá ở đây | User chốt sống trong phiên trước khi claim tsk-66o — dùng item có sẵn làm gốc thay vì submit trùng. Số item KHÔNG bị ghim ở bước này, đúng hard rule của `fgos-coding-exploring` ("không quyết kích cỡ hay chia nhỏ"). Đã log `fgos decision --id tsk-66o` (seq 6165) |
| D2 | Thuật toán wave-schedule RIÊNG (Kahn+cycle-detection kiểu beegog), không tái dùng `graph-harness.mjs`'s connected-component+order logic — bài toán khác nhau thật (đếm song-song-ngay-bây-giờ vs thứ-tự-tuần-tự) | User trả lời "Riêng" khi được hỏi trực tiếp. Đã log `fgos decision --id tsk-66o` |
| D4 | Gap "bỏ sót" (decompose không phủ hết quyết định đã khoá vào footprint con) để NGOÀI scope tsk-66o, khác bản chất với chồng-lấn — filed thành `tsk-1gr` độc lập (không dep logic, chỉ liên hệ text) | User chốt: "file luôn thành task riêng đi, gap bỏ sót phải cover luôn". Đã log `fgos decision --id tsk-66o` (seq 6181), và `tsk-1gr` đã submit thật |
| D3 | `worktree-dispatch-attestation` chọn **MỨC 1 — advisory-only**: chụp `baseCommit`/`headRef` quanh `resolveExecutorConfig` trước dispatch + mở rộng `frozen-judge.mjs` gác diff-toàn-phần ngoài footprint (không chỉ test/CI/lockfile), CHỈ gắn cờ, không chặn merge. Mức 2 (hard-refusal) và mức 3 (cô lập OS, `tsk-49o`) hoãn lại | Code lỗi thật đã bị `merge.mjs`'s staged verify-gate chặn sẵn (không đổi) — rủi ro D3 xử lý là diff lệch phạm vi nhưng verify xanh (lớp STR63/frozen-judge), advisory nhất quán tiền lệ đã có, rẻ (F2), không risk chặn nhầm. Nâng mức sau nếu có incident thật. Đã log `fgos decision --id tsk-66o` (seq 6501), và ghi chú cross-reference vào `tsk-49o` (seq 6500) |

| D5 | Check diff-toàn-phần MỚI (D3 mức 1) MIỄN kiểm khi item không khai footprint — không gắn cờ gì. Guard này CHỈ áp cho check mới, giữ nguyên 100% hành vi cũ của check judge-pattern hẹp (STR63, đã ship) | Ship Faster (0025, đã làm rõ scope 2026-08-05: tốc độ ship của PROJECT DÙNG fgOS, không phải tốc độ tự thân fgOS build). Gắn cờ 100% file khi vắng baseline không phải tín hiệu, chỉ là noise. `merge.mjs`'s verify-gate đã lo phần code-vỡ-thật, không phụ thuộc D5. Item không khai footprint chưa từng có kỳ vọng review hẹp nên không mất an toàn gì đã có. Đã log `fgos decision --id tsk-66o` (seq 6505) |

D1-D5 đều đã có `fgos decision --id tsk-66o` thật, xem `view.decisions` —
KHÔNG re-log lại ở đây để tránh trùng lặp (cùng D-ID, cùng nội dung, hai
timestamp không thêm tín hiệu gì). **Không còn điểm mở nào ở §3 — discussion
đã hội tụ.**

**Lưu ý phạm vi (nguồn: `docs/decisions/0025` §Làm rõ, 2026-08-05):**
D5 suýt bị quyết định sai vì đọc nhầm "Ship Faster" thành tốc độ tự thân
fgOS build. Đã sửa tại nguồn (`docs/decisions/0025.md` + pointer
`AGENTS.md`) — Ship Faster đo tốc độ ship của PROJECT ĐANG DÙNG fgOS,
không phải tốc độ fgOS tự triển khai tính năng.

## 5. Q&A log

- **2026-08-05** — Extraction từ `docs/history/parallel-decomposition-
  footprint-avoidance/session-source.md` (nguồn: tự viết lại nguyên trình
  tự phiên làm việc, từ yêu cầu distill bee gốc tới thời điểm chuyển sang
  `code-shape`). Trích §2 (mục tiêu), §3 (rõ/chưa rõ — 6/7 mục rõ, D3
  chưa), §4 (D1/D2/D4 đã log thật, không re-log), §6 (tổng hợp mới), §7
  (3 task: 2 candidate + tsk-1gr liên hệ). Không có trao đổi sống mới nào
  trong lượt distill này — D3 còn mở, chờ round tiếp theo.
- **2026-08-05 (round 2)** — Extraction từ `docs/history/parallel-
  decomposition-footprint-avoidance/session-source-round2.md`. Không có
  quyết định mới (D3 vẫn mở, không có D-ID nào thêm ở §4). Nội dung round
  này thuần cơ học: user hỏi tsk-66o có `refs` trỏ vào discussion chưa
  (chưa, vì chưa hội tụ) → user chốt set sớm dù chưa hội tụ (lệch tường
  minh với thứ tự mặc định của terminal-handoff) → set `refs` cho cả
  `tsk-66o` và `tsk-1gr` → gặp git contention thật trên main checkout
  dùng chung (phiên khác cùng user mid-merge + commit chồng lên, 3 lần
  bị chặn/refused trước khi lọt qua) → commit `f2604ef` + push thành
  công lên `origin/main`. Chỉ cập nhật §1/§5 — không đụng §3/§4/§6/§7 vì
  không có thay đổi hình dạng thiết kế nào (đúng hard rule "§6 chỉ
  regenerate khi shape đổi").

## 6. Thiết kế đã chốt {#design}

**Bức tranh hiện tại (đã hội tụ, không đổi):** một item con khai
`footprint` optional lúc decompose → trước dispatch, `fgos conflicts`
báo CẶP xung đột giữa các item `todo` (advisory, không chặn) → `fgos
pick` cô lập item vào worktree riêng khi vào stage `executing` → việc
thật dispatch qua `resolveExecutorConfig`/`capacities.<id>` tới agy/
opencode (luôn `cli/spawn`, decision 0026) → sau khi trả về, `frozen-
judge.mjs` (STR63, port hẹp từ bee) gác riêng nhóm file test/CI/lockfile/
manifest NGOÀI footprint khai, advisory → merge về main qua
`merge.mjs`'s giao dịch dàn trận (`git merge --no-commit --no-ff` → verify
trên cây chưa commit → commit khi xanh, đỏ thì abort sạch) → ở tầng
`proposed` (trước merge thật), `graph-harness.mjs`'s `mergeReadiness` gom
các item chồng footprint thành connected-component, đề xuất thứ tự
serialize dựa trên `rankImpact`.

**Hai khoảng trống cần đóng (D1, cả hai chi tiết đã chốt — D2, D3):**

1. `computed-parallel-wave-schedule` — thêm một lớp TÍNH TOÁN ở tầng
   DISPATCH (trên `frontier()`, trước khi bất kỳ item nào bắt đầu chạy),
   trả lời "sóng nào chạy song song được NGAY BÂY GIỜ, sóng nào phải đợi
   vì chồng footprint" — thuật toán riêng (D2: Kahn layering + Tarjan
   cycle-detection, không tái dùng `mergeReadiness`'s connected-component
   logic vì khác bài toán: đếm-song-song vs thứ-tự-tuần-tự).
2. `worktree-dispatch-attestation` — thu hẹp so với đề xuất gốc trong
   deep-dive, vì `fgos pick` đã cô lập worktree sẵn: (a) chụp
   `baseCommit`/`headRef` quanh `resolveExecutorConfig` TRƯỚC dispatch,
   (b) mở rộng `frozen-judge.mjs` gác diff-toàn-phần (không chỉ file
   dạng test/CI/lockfile). **D3 chốt MỨC 1 — advisory-only**: cả (a) và
   (b) CHỈ gắn cờ, không chặn merge. Mức 2 (hard-refusal tại merge) và
   mức 3 (cô lập cấp OS — chính là scope `tsk-49o`, đã ghi chú cross-
   reference vào item đó) hoãn lại, không phải scope tsk-66o. Lý do chọn
   mức 1: code lỗi thật đã bị `merge.mjs`'s staged verify-gate chặn sẵn
   (không đổi bởi D3) — rủi ro D3 xử lý riêng là diff lệch phạm vi
   nhưng verify vẫn xanh (đúng lớp STR63/frozen-judge gốc), advisory
   nhất quán tiền lệ, rẻ, không risk chặn nhầm item hợp lệ chưa khai đủ
   footprint (footprint vẫn optional — mức 1 không cần trả lời câu
   "không khai footprint thì sao", mức 2 mới cần).

Cả hai đã đủ chi tiết để `fgos-coding-planning` bắt tay vào — không còn D nào
mở.

```mermaid
flowchart TD
    A["decompose: con khai footprint (optional)"] --> B["fgos conflicts\n(CẶP-only, dispatch-time)"]
    B --> C["fgos pick\n(worktree cô lập, đã có)"]
    C --> D["resolveExecutorConfig\n(cli/spawn -> agy/opencode)"]
    D --> E["frozen-judge.mjs\n(hẹp: test/CI/lockfile, advisory)"]
    E --> F["merge.mjs\n(staged verify-gate, đã có)"]
    B -.->|"NEW"| G["computed-parallel-wave-schedule\n(Kahn+cycle, D2, tầng dispatch)"]
    D -.->|"NEW"| H["chụp baseCommit/headRef\ntrước dispatch (D3 mức 1)"]
    E -.->|"NEW"| I["diff-toàn-phần ngoài footprint\n(mở rộng frozen-judge, D3 mức 1: chỉ gắn cờ)"]
    F --> J["graph-harness.mjs mergeReadiness\n(connected-component+order, đã có, merge-time)"]
    I -.->|"hoãn (mức 2/3)"| K["hard-refusal tại merge /\ncô lập OS (tsk-49o)"]

    classDef existing fill:#dfe7fd,stroke:#4a63c9;
    classDef gap fill:#ffe3b3,stroke:#b96c00;
    classDef deferred fill:#eee,stroke:#999,stroke-dasharray: 4 3;
    class A,B,C,D,E,F,J existing;
    class G,H,I gap;
    class K deferred;
```

## 7. Danh mục hạng mục / task {#tasks}

### `{#task-computed-parallel-wave-schedule}`

- **Goal:** hàm thuần mới trong `src/state/graph-metrics.mjs`
  (Kahn layering + Tarjan cycle-detection, tách biệt khỏi
  `graph-harness.mjs`) trả về sóng song-song-được TẠI DISPATCH-TIME, trên
  `frontier()` — cạnh `footprintOverlap`/`footprintConflicts` hiện có,
  không thay chúng. Verb đọc-only mới (vd `fgos schedule`).
- **Trích §6:** mục "1" ở §6.
- **D-ID áp dụng:** D1 (là 1 trong 2 children), D2 (thuật toán riêng).
- **Quan hệ sibling:** độc lập file hoàn toàn với
  `worktree-dispatch-attestation` (không chạm `runner/`) — footprint hai
  task này không chồng nhau, an toàn chạy song song thật khi đưa vào
  thực thi.
- **Draft verify:** unit test cho `computeSchedule`/`detectCycles` (input
  cố định gồm 1 cặp chồng footprint + 1 cặp không chồng + 1 chu trình
  dep giả) khẳng định đúng số sóng, đúng thành viên mỗi sóng, cycle bị từ
  chối tại cửa ghi deps.

### `{#task-worktree-dispatch-attestation}`

- **Goal:** (a) chụp `baseCommit`/`headRef` quanh `resolveExecutorConfig`
  (`src/runner/dispatch.mjs`) trước khi dispatch tới agy/opencode; (b) mở
  rộng `src/runner/frozen-judge.mjs` gác diff-toàn-phần so với footprint
  khai (không chỉ nhóm file test/CI/lockfile/manifest hiện có).
- **Trích §6:** mục "2" ở §6.
- **D-ID áp dụng:** D1 (là 1 trong 2 children), D3 (mức 1 — advisory-only,
  chốt), D5 (miễn kiểm khi vắng footprint, chỉ áp cho check mới). Task
  này sẵn sàng cho `fgos-coding-planning`.
- **Quan hệ sibling:** độc lập file với
  `computed-parallel-wave-schedule` (§ trên). Liên hệ (không phải dep
  logic) với `tsk-49o` — mức 2/3 hoãn, `tsk-49o` đã nhận ghi chú
  cross-reference (seq 6500) cho lúc nó triển khai riêng.
- **Draft verify:** advisory-only — test khẳng định (a)
  `resolveExecutorConfig` ghi lại đúng `baseCommit`/`headRef` trước khi
  spawn agy/opencode; (b) khi CÓ khai footprint, `frozen-judge.mjs` trả về
  hit cho MỌI file ngoài footprint (không chỉ pattern test/CI/lockfile
  cũ) mà KHÔNG chặn gì; (c) khi KHÔNG khai footprint, check mới trả về
  RỖNG (D5 — miễn hoàn toàn), trong khi check judge-pattern cũ
  (`FROZEN_JUDGE_PATTERNS`) vẫn hoạt động y hệt trước giờ (regression
  test riêng, không đổi hành vi STR63 đã ship).

### `{#task-tsk-1gr-completeness-gap}` (sibling, không phải con)

- **Goal:** sau decompose, đối chiếu quyết định đã khoá trong CONTEXT.md
  của item cha với TẤT CẢ footprint con — gắn cờ nếu một quyết định đổi
  vị trí/tên file mà không con nào chạm tới. Đã submit thật thành
  `tsk-1gr` (todo, stage `clarify`), KHÔNG phải con của tsk-66o.
- **Trích §6:** không thuộc thiết kế ở §6 (khác bản chất lỗi — bỏ sót
  chứ không phải chồng-lấn) — liệt ở đây chỉ để traceability, vì cùng
  buổi khảo sát footprint/decompose sinh ra nó.
- **D-ID áp dụng:** D4 (quyết định TÁCH nó ra, không phải nội dung của
  nó).
- **Quan hệ sibling:** liên hệ text với tsk-66o, không dep logic.
- **Draft verify:** để `fgos-coding-exploring`/`fgos-coding-planning` riêng của
  `tsk-1gr` tự quyết — ngoài scope discussion này.
