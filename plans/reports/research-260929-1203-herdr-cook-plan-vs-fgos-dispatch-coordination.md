# herdr-cook-plan vs fgOS dispatch + coordination engine

Ngày: 2026-09-29 · Nguồn: `thieung/herdr-cook-plan` @ `619b8cd` (clone đầy đủ, đọc hết SKILL.md + 7 reference + script + test), repo này @ `a15e1b454`, state thật trong `.fgos/`.

## 1. Kết luận ngắn

- **Hai hệ giống nhau về khái niệm đến mức gần như trùng.** Lease ≈ claim/main-checkout lock, `ledger.jsonl` ≈ event log (L3), mailbox q/a ≈ ask/answer/outbox, attempt `p02a01` ≈ Run, `phase-accepted` ≈ result-linked + approve, checkpoint hot section ≈ snapshot. Tác giả kia đi đường khác nhưng ra cùng mô hình → các khái niệm của mình không sai.
- **"1 skill, 1 script" là ảo giác một phần.** Độ phức tạp không biến mất, nó bị đẩy sang 3 chỗ: (a) **herdr ≥0.9.1** (Rust binary lo agent state, `agent wait`, `agent prompt` có phát hiện stall), (b) **ak:cook** trong mỗi worker, (c) **LLM coordinator tự thi hành ~1.400 dòng văn xuôi** mỗi lần chạy. Bất biến được giữ bằng "kỷ luật của model", không bằng code.
- **Trên đúng một việc — chạy một plan có sẵn theo phase, trong herdr, có người ngồi gần — nó nhiều khả năng ngang hoặc hơn mình về năng suất và trải nghiệm**, vì đường nóng (hot path) ngắn và không có ma sát hạ tầng.
- **Mình thật sự hơn ở những thứ nó không làm:** headless/out-of-process, nhiều executor + fallback, confinement (bwrap), independent reviewer/red-team tách vai, group-thinking protocol, Work lifecycle (backlog→approve→merge→cleanup), nhiều run song song cross-session, replay xác định.
- **Nhưng số liệu vận hành cho thấy mình đang trả giá nặng cho độ nặng đó** (mục 4). Vấn đề không phải "nặng", mà là phần nặng nằm sai chỗ: mình tự xây lại liveness mà herdr đã cho sẵn, và thiếu đúng thứ đơn giản mà họ có — một bước "đóng run" bắt buộc có kiểm chứng.

## 2. herdr-cook-plan thực chất là gì

| Thành phần | Kích thước | Vai trò |
|---|---|---|
| `SKILL.md` + 7 `references/*.md` | ~1.400 dòng prose | Toàn bộ "engine": gate, wave table, dispatch, supervise, accept, commit, recovery, completion |
| `scripts/check-run-closed.py` | 151 dòng | Kiểm chứng run đã đóng sạch (ledger hợp lệ, mail/ đã dọn, guard không còn active) |
| `extensions/context-guard.mjs` | 270 dòng | Chỉ OMP: re-inject con trỏ recovery sau compaction |
| tests | ~1.300 dòng | Chủ yếu *instruction-contract* (grep prose), unit test guard |

Luồng: coordinator (1 pane) → mỗi phase 1 pane + 1 agent mới chạy `ak:cook` → hỏi/đáp qua file mailbox → coordinator verify report `status: complete` + diff đúng scope + check pass → commit 1 phase/1 commit → đóng pane ngay → phase kế.

Điểm thiết kế đáng học:
1. **Coordinator không bao giờ tự implement** → context nhẹ, sống sót qua compaction.
2. **Hot section ~40 dòng / ~500 token** đọc ở mọi boundary; full read chỉ khi có dấu hiệu bất thường. Có đo thật (4.224 ký tự, 7 boundary).
3. **Attempt-keyed identity** (`q-p02-a01-03`) → worker thay thế không bao giờ đọc nhầm answer của attempt cũ.
4. **Stall ladder rẻ trước:** nudge (queued prompt) → interrupt (esc) → 1 replacement → blocker. Dựa trên `revision`/`state_change_seq` của herdr, không heuristic riêng.
5. **Close-per-phase + `check-run-closed.py` trước `run-completed`**; lease release là write cuối. "Premature run-completed không phân biệt được với crash" — lập luận rất chặt.
6. **Honest status:** tách `adapter installed` / `preflight ready` / `smoke passed`; mọi thứ chưa chạy ghi *NOT RUN*.
7. Chỉ asking-phase + dependents chờ câu hỏi; phase độc lập vẫn chạy (đúng tinh thần ưu tiên #2 "Release con người").

Giới hạn tự khai của họ: live smoke chỉ 2 phase; parallel wave, compaction thật, multi-worktree, runtime ngoài OMP **chưa chạy**. Lease là cooperative, không fencing. Một run/plans-root tại một thời điểm; không headless (bắt buộc `HERDR_ENV=1`). "Verified by another agent" = coordinator đọc report + check, reviewer thật là review nội bộ của cook (cùng worker).

## 3. Phía mình

| Hạng mục | Số đo |
|---|---|
| `src/runner/dispatch` | 55 file, ~31.100 dòng |
| `src/runner/coordination` (+deliberation, team-cognition, definitions) | ~17.400 dòng |
| Test liên quan dispatch/coordination | ~73.400 dòng |
| `docs/specs/runner.md` | 396 KB |
| Commit chạm 2 engine từ 2026-08-01 | 369 (62 `fix(dispatch)`, 32 `fix(coordination)`) |
| Commit tháng 9 có chữ liveness/stale/orphan/race/lock/cwd/stuck/mutex | 169 |

Herdr primitive mình dùng (đính chính 2026-09-29 12:20 — bản đầu grep sót): `pane split/run/close/list/process-info/report-agent*`, `agent start`, và `agent wait/get/prompt/read/tool` qua adapter `src/runner/dispatch/herdr-agent.mjs` (424 dòng). Tức là mình **có** dùng các primitive giống herdr-cook-plan; phần nặng nằm thêm ở herdr-round (1.811 dòng: kiểm tra argv/exe/env/cwd chống tamper, deadline), herdr-reconcile, cli-spawn-supervisor. Binary đang cài `~/.local/bin/herdr` là **0.8.2**; bản build 0.9.1 đã có ở `upstreams/herdr/target/release/herdr` và fork `~/projects/herdr`.

## 4. Số liệu vận hành thật (`.fgos/coordination/sessions`, fold từ `events.jsonl`)

| Nhóm | Số session | Ghi chú |
|---|---|---|
| Tổng | 602 | |
| Không có result nào, đa số tên `coord_*`, `policy-test` | 297 | **Fixture test rò vào storage thật** (bug hermeticity) |
| Có result, đạt terminal (completed/partial/failed/cancelled) | 89 | 27 completed, 57 partial, 3 failed, 3 cancelled |
| Có result, **không bao giờ đóng** | 216 | ~71% session thật bị bỏ ngỏ |

`dispatch-runs/`: thêm `depth-test-exec` (120), `no-such-exec`, `some-exec` — cũng là fixture rò. Run records trong `dispatch-runs/` chỉ có `settled/running` (**đính chính 15:05:** outcome thật nằm ở `.fgos/assignments/*/runs/*/result.json` — 1.028 run: 621 done, 330 failed, 74 no-evidence, 3 blocked; `classification`/`durationMs` chỉ có ở ~100 run gần nhất) → hiện không đo được "chất lượng" từ dữ liệu của chính mình.

Đọc số liệu: engine xác định (deterministic) nhưng vòng đời session không được khép, và mình không có metric chất lượng. herdr-cook-plan giải quyết đúng lỗ hổng "không đóng" bằng 1 script 151 dòng.

## 5. So sánh trực diện

| Tiêu chí | herdr-cook-plan | fgOS dispatch+coordination |
|---|---|---|
| Thời gian từ cài đến chạy | Phút (copy thư mục) | Cao: setup, config executor, doctor, worktree conventions |
| Hot path "chạy plan N phase" | Ngắn, 1 skill | Nhiều cửa: decide → execute → coordination run → approve/merge |
| Bất biến giữ bằng | Prose + kỷ luật LLM | Code + event log + test |
| Tái lập/replay | Checkpoint + ledger (đủ cho resume) | Replay xác định, cold-resumable DAG |
| Liveness/stall | Dùng state của herdr | Tự xây, còn đang vá |
| Đóng run có kiểm chứng | Có (`check-run-closed.py`) | Không; 216 session mở |
| Headless / CI / không người | Không | Có |
| Nhiều executor, fallback, capacity | Chọn 1 kind/run | Có routing + health |
| Sandbox/confinement | Không | Có (bwrap, authority policy) |
| Reviewer/red-team độc lập | Không (coordinator verify) | Có, tách vai |
| Group thinking / panel | Không | Có |
| Song song nhiều run | Cấm | Có (kèm race đã biết) |
| Độ nhạy với model/compaction | Cao — engine là model | Thấp hơn — engine là code |
| Bằng chứng live | 2 phase smoke | Nhiều track thật (rust-host-r1, confinement, cold-resumable…) nhưng nhiều ma sát ghi trong memory |

## 6. Trả lời câu hỏi của anh

**Chất lượng:** Với plan chạy trong herdr có người, chất lượng đầu ra chủ yếu do worker (`ak:cook`) quyết định, cả hai hệ đều cho worker context sạch mỗi phase. Mình có lợi thế thật ở **reviewer/red-team độc lập** — cái này nâng chất lượng mà họ không có. Nhưng hiện mình **không có số đo chất lượng** để chứng minh lợi thế đó.

**Năng suất:** Trên hot path, họ gần như chắc chắn nhanh hơn: ít cửa, ít lock, ít chỗ vỡ hạ tầng. Memory của chính mình ghi hàng loạt hazard (allocator race, cwd drift, main-checkout reset xoá state, executor sandbox, maxRounds cap) — thời gian đó là tốc độ ship bị mất (vi phạm ưu tiên #1).

**Tính năng:** Mình hơn rõ ở headless, đa executor, confinement, protocol đa vai, Work lifecycle. Đây là các năng lực phục vụ mission #1/#2 (chạy không người canh, nhiều project). Họ không thể đạt được những thứ này bằng prose, vì bất biến nào cần giữ khi không có người/không có herdr thì phải là code.

**Có quá nặng không:** Nặng một phần là chính đáng (headless, confinement, event log). Phần không chính đáng — đúng tinh thần RUL11 "tùm lum":
1. Lớp liveness/tamper-check riêng chồng lên `agent wait/get` của herdr — cần đo lại phần nào thật sự thừa sau khi lên 0.9.1 (không phải "không dùng herdr", như bản đầu viết nhầm).
2. Thiếu bước đóng run có kiểm chứng → session rác tích tụ.
3. Test không hermetic, ghi vào `.fgos` thật.
4. Không lưu outcome chất lượng ở Run → không tự đánh giá được.
5. Hot path cho use case phổ biến nhất ("chạy plan này") đi qua quá nhiều cửa.

## 7. Đề xuất (xếp theo đòn bẩy)

1. **Bake-off thật trước khi đầu tư thêm** — máy đã có herdr + ak cook. Nâng herdr lên ≥0.9.1, lấy 1 plan 3–4 phase thật (project ngoài repo này, đúng mission #1), chạy qua cả hai hệ trên nhánh riêng. Đo: wall time, số lần người phải can thiệp, token, số lỗi review sau đó bắt được, số lần kẹt hạ tầng. Không có số này thì mọi tranh luận nặng/nhẹ vẫn là cảm tính.
2. **Thêm "run-closed check" cho coordination session** (tương đương `check-run-closed.py`): session không được coi là xong nếu chưa terminal + artifact đã dọn; `fgos doctor` báo session mở quá hạn. Đồng thời dọn 216 session mở.
3. **Sửa test rò storage** (297 session + ~124 run giả trong `.fgos` thật) — thêm guard: test không được ghi `.fgos` của repo.
4. **Sau khi nâng 0.9.1, đo lại lớp liveness riêng** trên đường herdr: dùng `revision`/`state_change_seq` cho stall và stall ladder nudge→interrupt→replace; cắt phần trùng với `agent wait/get`, giữ tamper-check và supervisor cli-spawn headless.
5. **Mượn nguyên các pattern rẻ:** attempt-keyed identity cho ask/answer; hot-section snapshot ≤40 dòng cho driver; đóng pane per-phase; tách `installed / preflight / smoke passed` trong báo cáo.
6. **Một lối vào mỏng cho "chạy plan này"** (facade kiểu herdr-cook-plan) đặt trên engine hiện tại: người dùng thấy 1 skill, engine giữ bất biến phía sau. Đây là cách giữ cả hai: trải nghiệm nhẹ + bất biến bằng code.
7. **Ghi outcome chất lượng vào RunResult** (review verdict, số finding, pass/fail check) để lần sau so sánh bằng số.

Không đề xuất bỏ engine: những gì mình hơn (headless, confinement, reviewer độc lập) không thể làm bằng prose, và là thứ mission #1/#2 cần. Đề xuất là **cắt phần tự xây trùng với herdr, và bù phần đơn giản mà họ làm tốt hơn**.

## Câu hỏi chưa giải quyết

- 216 session mở: bao nhiêu là cell đã merge nhưng quên đóng (theo convention close-before-merge), bao nhiêu là thật sự bỏ dở? Cần đối chiếu với trạng thái Work item.
- Herdr 0.9.1 có sẵn trên kênh cài của mình không, và có phá gateway/herdr-plugin hiện tại không?
- Bake-off chạy trên project nào ngoài repo này để đúng mission #1?
