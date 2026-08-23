# Discussion — tsk-3tp: Tầng B (worker ghi `.fgos/events/` trong worktree)

## 1. Trạng thái hiện tại

Vòng 3 (23/8, cùng ngày vòng 1-2). Chưa có D-ID nào chốt — nhưng một điểm
neo đã xuất hiện và đang giữ ổn: **`.fgos` là PM-state của chính repo nó
quản, sự thật phải sống cùng một git history với code — không cách ly khỏi
repo** (anh nêu vòng 3, bác đề xuất nested-repo của vòng 2; khớp nguyên văn
D-ADR0001 "git-committed"). Nếu điểm này giữ qua vòng sau, nó là ứng viên
D-ID đầu tiên.

Diễn biến: vòng 1 xác nhận worker không đọc/ghi `.fgos/` (Tầng B nguyên bản
không có consumer). Vòng 2 (theo yêu cầu brainstorm rốt ráo của anh) đề xuất
nested state repo — anh bác vì vi phạm constraint in-repo. Vòng 3 đo phân bố
23.847 event thật: ~40% coordination (move/stage/add — cần visibility toàn
cục tức thì, không thể sinh trong nhánh), ~55-60% narrative — nghĩa là Tầng
B nguyên bản cũng chỉ chở được một nửa write volume. Đề xuất hiện hành
(vòng 3, chờ anh phản hồi): **giữ event in-repo trọn vẹn, xóa
checkpoint-commit chuyên dụng, thay bằng sweep-dirty-shards vào các
merge/approve commit main đằng nào cũng tạo + fallback thưa** — ADR0020
không đụng, Tầng B đóng vĩnh viễn, danh sách xóa legacy giữ gần nguyên.
Chi tiết §5 entry vòng 3; các điểm chờ chốt: §3 dòng 6/8/9.

## 2. Mục tiêu & đề bài

Tầng B, nếu làm, cho phép worker — tiến trình out-of-process chạy trong
worktree `fgw/<id>` qua `agy`/`dispatch.mjs execute`, không phải session gọi
`fgos` trực tiếp — ghi một file changeset events mới ngay trong worktree của
chính nó, thay vì mọi write dồn hết về main checkout như hiện tại; `merge.mjs`
guard `.fgos-write-rejected` sẽ cần một ngoại lệ hẹp — chấp nhận diff CHỈ
THÊM (không sửa/xoá) một file mới dưới `.fgos/events/` khi merge nhánh
`fgw/<id>`, mọi path khác trong `.fgos/` vẫn bị từ chối cứng như hiện tại.
Đây là item Tầng B trong chuỗi 2 tầng — Tầng A (`tsk-3ve`, đổi
`events.jsonl` sang content-hash identity + sharding theo session/burst) là
dep bắt buộc, đang `doing`/`executing`, CHƯA xong. Việc này đảo một phần hẹp
của D-ADR0020 (chặn `.fgos/` khỏi worktree worker) — một quyết định đã chốt
vì lý do bảo mật (worker's execution context có capability wall yếu, một
write lạc sẽ đập thẳng vào `events.jsonl` sống, không qua review), nên theo
rule "User Decisions", việc mở lại nó không phải phán đoán của phiên này.

**Mở rộng phạm vi (vòng 2, theo yêu cầu của anh):** đề bài không còn chỉ là
"làm hay không làm Tầng B" mà là: nhìn lại toàn bộ cụm vấn đề event-log
(mất data do va chạm, merge đè file live, tần suất commit lên main, và núi
cơ chế guard/vá chồng nhau), tìm kiến trúc đích giải rốt ráo — đúng nhất,
ổn định nhất, nhanh nhất, không ôm legacy — theo thứ tự ưu tiên Ship Faster
/ Release con người và tinh thần RUL11 (gom tùm lum tới khi hết).

## 3. Vấn đề rõ / chưa rõ

| # | Câu hỏi | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Có nên tiếp tục shape Tầng B ngay bây giờ, hay dừng và ghi nhận "chưa cần"? | **Chưa rõ — chờ anh quyết** | Item tự nó đã nghiêng về "chưa cần" (cảnh báo #4); round này xác nhận thêm bằng chứng, xem dòng 3 dưới. |
| 2 | `tsk-3ve` (Tầng A, dep bắt buộc) đã xong chưa? | **Rõ — CHƯA xong** | `fgos show tsk-3ve --json`: `status:todo`, `stage:executing`. Đề bài chính item này nói rõ: đọc mà dep chưa xong thì dừng, không shape code dựa trên cấu trúc file `.fgos/events/<session-id>-<ts>.jsonl` chưa tồn tại thật. Vòng này vì vậy chỉ thảo luận Ở MỨC CHÍNH SÁCH (có nên mở lại ADR0020 hay không), chưa động tới hình dạng file cụ thể. |
| 3 | Worker hôm nay có thật sự không đọc/ghi `.fgos/` từ trong worktree không (YAGNI-check cảnh báo #2)? | **Rõ — xác nhận lại bằng code thật, vẫn đúng** | `grep .fgos src/runner/dispatch/*.mjs`: chỉ có `dispatch/cli.mjs`'s `spawnWorker` nhận `opts.fgosDir` — dùng để launcher (không phải worker) gọi `fgos tool query` presence-check qua `resolveExecutorCommand`; comment tại dòng ~222-224 nói thẳng "fgosDir's root (always the main checkout)" và tách bạch với `attestRoot: cwd` (worktree của worker). Không có call site nào trong `dispatch/*.mjs` cho phép TIẾN TRÌNH WORKER tự đọc/ghi `.fgos/` từ bên trong worktree của nó — đúng như cảnh báo #2 nói, dispatch path 23/8 (đã có agy, fanout) vẫn giữ nguyên tính chất này so với lúc ADR0020 chốt (28/7). |
| 4 | Tầng B có giải được root cause #1 gốc (tần suất commit lên main quá nhanh, buộc `fgw/<id>` catchup thường xuyên) không? | **Rõ — không, hoặc chỉ một phần rất hẹp** | Theo report 21/8 đã dẫn trong đề bài: nguồn write gây áp lực chính là periodic checkpoint + session commit trực tiếp lên main — cả hai đường này KHÔNG đi qua vòng đời "worktree rồi merge" mà Tầng B nhắm tới. Tầng B chỉ có tác dụng cho write sinh ra từ WORKER — nhưng câu 3 vừa xác nhận worker hôm nay không sinh write `.fgos/` nào cả, nên chưa có khối lượng thật ở đúng chỗ Tầng B nhắm giảm. |
| 5 | Nếu quyết "chưa cần Tầng B", hướng nào giải đúng root cause #1 (giảm tần suất commit của SESSION lên main)? | **Đã scout + đề xuất (vòng 2) — chờ anh chốt** | Đề xuất chính: tách state plane — `.fgos/` thành nested git repo riêng, gitignored khỏi main; commit state không còn di chuyển HEAD main → root cause #1 biến mất về cấu trúc. Chi tiết + trade-off: §5 entry vòng 2. |
| 6 | Constraint kiến trúc: `.fgos` state phải sống cùng git history với code (in-repo), không cách ly? | **Ổn định 1 vòng — ứng viên D-ID nếu giữ qua vòng sau** | Anh nêu trực tiếp vòng 3, bác nested-repo vòng 2. Khớp D-ADR0001 nguyên văn. Mọi phương án từ đây phải thỏa constraint này. |
| 7 | Sau khi Tầng A + checkpoint redesign: danh sách legacy nào được XÓA? | **Rõ (danh sách), chưa chốt (chờ dòng 9)** | XÓA: (1) `merge=union` + `events-jsonl-contiguity.mjs` (sau freeze events.jsonl); (2) checkpoint-commit chuyên dụng + tuning `checkpoint.eventThreshold`; (3) phần lớn truncation-guard surface (mark sidecar, warnings file, opt-out env `FGOS_DISABLE_OPPORTUNISTIC_CHECKS`); (4) `events.jsonl` 1-file + 2 backup → đông cứng baseline-0/archive; (5) `seq` làm identity → bỏ hẳn ở compaction đầu; (6) Tầng B — đóng vĩnh viễn. GIỮ: merge guard `.fgos-write-rejected` (nguyên trạng, không ngoại lệ), pre-commit hook (tsk-56u class). |
| 8 | tsk-3tp: repurpose tại chỗ thành item "checkpoint redesign: sweep-on-merge", hay đóng hẳn + submit item mới? | **Chưa rõ — chờ anh quyết** | Cả hai đều giữ dep tsk-3ve (Tầng A T3-T6 phải xong trước — shard + đóng vector git-clobber là điều kiện an toàn cho coarse cadence). |
| 9 | Cơ chế thay checkpoint chuyên dụng: sweep-dirty-shards vào merge/approve commit sẵn có + fallback thưa — hay Tầng B-cho-SESSION (narrative event sinh trong worktree của session đã claim, piggyback merge)? | **Chưa rõ — em khuyến nghị sweep, chờ anh** | Đo vòng 3: coordination ~40% (move 29% + stage 6.6% + add 4.3%) buộc ghi main tức thì dù chọn gì; narrative ~55-60% (decision 19.4%, edit 15.4%, outcome 12.8%, discovery 4.2%, gate 4.2%, friction/handoff/call-summary ~4%). Tầng-B-cho-session chỉ chở được phần narrative, đổi lấy: ngoại lệ merge guard, tách 2 class event khác luật, narrative vô hình từ main tới khi merge (mất nếu nhánh bỏ). Sweep: churn giảm về ~0 giữa các merge, visibility tức thì giữ nguyên, ADR0020 nguyên vẹn, không class split. Nhượng bộ duy nhất: merge commit của một nhánh chở kèm dirty event của mọi writer (provenance vẫn trong nội dung event: `src`/`ts`/`h`). |

## 4. Quyết định đã chốt

(Chưa có D-ID nào — vòng 1, chưa có điểm nào giữ ổn định qua nhiều vòng.)

## 5. Q&A log

- **[2026-08-23, vòng 1, scout]** Đọc `fgos show tsk-3tp --json` + `fgos show
  tsk-3ve --json`: xác nhận dep `tsk-3ve` status `todo`/stage `executing`,
  chưa xong. Đọc `docs/decisions/index.md` dòng D-ADR0020 (retired, narrative
  dời sang `docs/specs/runner.md` theo tsk-1lv-4) và
  `plans/reports/investigation-260821-1202-eventlog-branch-union-decision-history-report.md`
  mục "Step-by-step để đạt hướng harness" (dòng 152-180) — nguồn gốc trực
  tiếp của đề xuất Tầng A/Tầng B và câu hỏi mở "cần xác nhận của anh trước
  khi lên plan". Grep `src/runner/dispatch/*.mjs` cho mọi tham chiếu `.fgos`
  — xác nhận claim ở §3 dòng 3 (worker không tự đọc/ghi `.fgos/` từ
  worktree hôm nay, `fgosDir` chỉ phục vụ launcher's tool-presence check
  trên main checkout). Chưa hỏi gì mới cho người — câu hỏi mở là câu đã có
  sẵn trong chính đề bài item, chuyển tiếp nguyên văn xuống dưới.

- **[2026-08-23, vòng 2, anh hỏi]** Yêu cầu: đánh giá lại toàn bộ vấn đề cụm
  task này đang giải, cái làm được / chưa làm được, các hoài nghi; brainstorm
  hướng giải rốt ráo — không legacy, đúng nhất, ổn định nhất, nhanh nhất
  (ship faster, release human, RUL11).

- **[2026-08-23, vòng 2, scout + phân tích]** Nguồn đọc trực tiếp:
  `plans/reports/investigation-260821-1050-eventlog-loss-merge-speed-root-cause-report.md`
  (toàn bộ), `investigation-260821-1202-eventlog-branch-union-decision-history-report.md`
  (toàn bộ), `fgos rollup tsk-3ve` (T1/T2 delivered, T3-T6 todo),
  `fgos show` tsk-1i3/tsk-1vc/tsk-2lq/tsk-56u (đều delivered),
  `src/state/events-jsonl-truncation-guard.mjs` (checkpoint 900s/50-event
  threshold, opt-out env), git log hiện tại (5 commit "periodic events.jsonl
  checkpoint" liên tiếp trên đỉnh main — churn còn sống ngay lúc scout).

  **Tổng kết 4 vấn đề:** P1 va-chạm-mất-data → Tầng A T1/T2 đã giải đúng
  gốc (mỗi writer 1 file, content-hash identity), T3-T6 còn lại. P2 merge-đè
  → tsk-1i3/tsk-56u/tsk-2lq đã vá, delivered. P3 tần-suất-commit-lên-main
  (root cause #1, report 21/8) → CHƯA AI GIẢI — Tầng A không đổi tần suất,
  Tầng B không chạm được vì nguồn write chính là session (không đi qua vòng
  đời worktree→merge). P4 tùm-lum: ~9 cơ chế guard/vá chồng nhau, mỗi cái
  hợp lý lúc ra đời, cộng lại là legacy.

  **Insight lõi:** mọi legacy P4 + toàn bộ P2/P3 chung MỘT nguồn gốc — state
  (event log) và code chung một git HEAD trên main. Giải rốt ráo = tách 2
  plane: code plane (main + fgw, merge, verify) không bao giờ mang state;
  state plane (shard append-only + baseline, Tầng A) không bao giờ merge.

  **Đề xuất chính:** `.fgos/` thành nested git repo riêng (path giữ nguyên,
  mọi code đọc/ghi giữ nguyên; main gitignore toàn bộ `.fgos/`). Commit
  state thoải mái (per-append cũng được) vì HEAD repo state không ai theo
  dõi — P3 chết về cấu trúc. ADR0020 + D-ADR0005 giữ nguyên tuyệt đối.
  D-ADR0001 vẫn "git-committed" nguyên văn — git của chính nó. Migration:
  `git rm --cached` `.fgos/` khỏi main + gitignore + init repo state; lịch
  sử cũ nằm lại trong lịch sử main. `fgos setup`/`doctor` đăng ký repo
  state (đúng Install/setup/doctor gate, hưởng cho mọi project — mission #1).
  Chi phí thật: sửa test giả định `.fgos/` tracked; clone main không tự
  mang state (single-machine chưa cần); cần decision mới ghi nhận cách thi
  hành D-ADR0001.

  **Biến thể đã cân, xếp sau:** separate ref `refs/fgos/state` (1-repo-1-clone
  nhưng thêm plumbing tự viết); biến thể tối thiểu không tách plane (giãn
  checkpoint + verify skip diff chỉ-`.fgos/`) — rẻ nhưng giữ nguyên cả 9
  legacy, rớt tiêu chí "không cần legacy", không khuyến nghị làm thay.

  **Kết luận Tầng B:** đóng vĩnh viễn — worker không có write nào để dời
  (verify lại bằng code vòng 1), và nếu mai sau cần, đi qua cửa ghi của
  state repo, không đục tường ADR0020. Đã trình anh, chờ chốt §3 dòng 1/6/8.

- **[2026-08-23, vòng 3, anh trả lời]** Nguyên văn: "`.fgos` chính là
  project management state của chính project nó đang xây, không thể cách ly
  khỏi repo, đó là lý do của B." → Bác nested-repo (vòng 2). Constraint
  in-repo được nêu tường minh — ghi vào §3 dòng 6 làm điểm neo.

- **[2026-08-23, vòng 3, scout + đề xuất sửa]** Đo phân bố toàn bộ 23.847
  event trong `/home/vantt/projects/forgentX/.fgos/events.jsonl` (python,
  đếm theo `type`): work.move 29.0%, decision 19.4%, work.edit 15.4%,
  work.outcome 12.8%, work.stage 6.6%, work.add 4.3%, work.discovery 4.2%,
  work.gate-approve 4.2%, friction/handoff/call-summary ~4%, còn lại <1%.
  Phân loại: coordination (move/stage/add — claim, frontier, chống
  double-claim, cần visibility toàn cục TỨC THÌ) ~40%; narrative (chuyện
  của item đang làm) ~55-60%. Hệ quả: Tầng B nguyên bản (event sinh trong
  nhánh, piggyback merge) chỉ chở được phần narrative — coordination vẫn
  phải ghi main ngay, vẫn cần checkpoint, churn chỉ giảm khoảng một nửa.

  **Insight sửa lại:** trên single machine, visibility đến từ WORKING DIR
  của main checkout (mọi session đọc `--dir` main, thấy event ngay khi
  append, trước mọi commit) — commit chỉ phục vụ durability/history. Churn
  P3 không đến từ nơi ghi mà từ COMMIT CHUYÊN DỤNG (checkpoint 15ph/50
  event). Main đã có sẵn commit hợp pháp thường xuyên: mỗi lần approve
  merge một nhánh.

  **Đề xuất vòng 3 (thay cả nested-repo lẫn Tầng B):** (1) Tầng A T3-T6 làm
  nốt — shard per-writer + tsk-1i3/tsk-56u đã đóng các vector git-clobber
  vốn là lý do khai sinh checkpoint 15ph; (2) xóa checkpoint-commit chuyên
  dụng, thay bằng sweep dirty `.fgos/events/` shards vào chính các
  merge/approve commit main đằng nào cũng tạo + fallback thưa (~60ph hoặc
  end-of-session) cho khoảng lặng; (3) giữa 2 lần merge không còn commit
  metadata → HEAD main chỉ nhảy khi có code thật → catchup/re-verify churn
  từ metadata = 0; (4) ADR0020 không đụng, không ngoại lệ merge guard,
  không class split, Tầng B đóng vĩnh viễn kể cả cho mục tiêu churn; (5)
  danh sách xóa legacy: §3 dòng 7. Vì sao coarse giờ an toàn còn 20/8 thì
  không: checkpoint dày ra đời để thu hẹp cửa sổ mất-data do git-op clobber
  file tracked dirty — Tầng A đổi bài toán (file mới per-writer) + các vector
  đè/nuốt đã bị chặn, cửa sổ dài chỉ còn là độ trễ history, không phải rủi
  ro mất data. Nhượng bộ: merge commit chở kèm dirty event mọi writer —
  provenance vẫn nguyên trong nội dung event (`src`/`ts`/`h`). Chờ anh chốt
  §3 dòng 9 (sweep vs Tầng-B-cho-session) và dòng 8 (repurpose vs item mới).

## 6. Thiết kế đã chốt {#design}

(Chưa có gì để tổng hợp — chưa có quyết định nào chốt ở §4. Mục này sẽ được
viết lại toàn bộ ngay khi vòng đầu tiên có D-ID.)

## 7. Danh mục hạng mục / task {#tasks}

(Chưa có — chờ §6 có hình dạng cụ thể trước khi tách task.)
