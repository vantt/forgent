# Discussion — tsk-3tp: Tầng B (worker ghi `.fgos/events/` trong worktree)

## 1. Trạng thái hiện tại

Vòng 2 (23/8, cùng ngày vòng 1). Chưa có D-ID nào chốt — chờ anh phản hồi đề
xuất vòng 2 rồi mới xét mint ở vòng sau.

Diễn biến: vòng 1 scout xác nhận 2 claim cốt lõi của các cảnh báo trong đề
bài (worker không đọc/ghi `.fgos/`; Tầng B không chạm root cause tần suất
commit). Anh sau đó yêu cầu đánh giá lại TOÀN BỘ cụm vấn đề event-log và
brainstorm hướng giải rốt ráo, không legacy ("khong phai no nang ma no tum
lum" — RUL11). Vòng 2 mở rộng phạm vi thảo luận từ "có nên làm Tầng B" thành
"kiến trúc đích cho write-path của `.fgos/` state là gì". Phân tích vòng 2
(xem §5, entry vòng 2) đưa ra đề xuất chính: **tách state plane — `.fgos/`
thành repo git riêng (nested repo, gitignored khỏi main), xóa ~8-9 cơ chế
legacy theo sau; đóng vĩnh viễn scope Tầng B**. Đang chờ anh chốt: (a) đồng
ý hướng tách plane / nested repo? (b) tsk-3tp repurpose tại chỗ hay đóng +
submit item mới?

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
| 6 | Kiến trúc đích: có tách state plane (`.fgos/` ra khỏi commit-path của main) không? Nếu tách, nested repo hay separate ref (`refs/fgos/state`)? | **Chưa rõ — chờ anh quyết** | Em khuyến nghị nested repo (KISS, zero plumbing, dùng git thường); separate ref được "1 repo 1 clone" nhưng phải tự viết plumbing commit-tree/update-ref. Trade-off nested repo: `git clone` main không tự mang state theo (single-machine hiện tại chưa cần; ghi nhận giới hạn). Đây là chỉnh cách thi hành D-ADR0001 ("git-committed") — cần quyết định mới ghi nhận rõ, không sửa lệch luật im lặng. |
| 7 | Sau khi Tầng A + tách plane: danh sách legacy nào được XÓA? | **Rõ (danh sách), chưa chốt (chờ hướng ở dòng 6)** | (1) `merge=union` + `events-jsonl-contiguity.mjs`; (2) periodic checkpoint commit lên main + tuning `checkpoint.eventThreshold`; (3) truncation-guard phần git (mark sidecar, warnings file, opt-out env `FGOS_DISABLE_OPPORTUNISTIC_CHECKS`); (4) `merge.mjs`'s `.fgos-write-rejected` machinery (giữ 1 assert); (5) pre-commit hook phần chống nuốt `.fgos/` (tsk-56u class); (6) `events.jsonl` 1-file + 2 backup → đông cứng baseline-0/archive; (7) `seq` làm identity → bỏ hẳn ở compaction đầu; (8) Tầng B — không bao giờ cần. |
| 8 | tsk-3tp: repurpose tại chỗ thành item "tách state plane", hay đóng hẳn + submit item mới? | **Chưa rõ — chờ anh quyết** | Cả hai đều giữ dep tsk-3ve (Tầng A T3-T6 phải xong trước — baseline + replay đa-file là nền migration). |

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

## 6. Thiết kế đã chốt {#design}

(Chưa có gì để tổng hợp — chưa có quyết định nào chốt ở §4. Mục này sẽ được
viết lại toàn bộ ngay khi vòng đầu tiên có D-ID.)

## 7. Danh mục hạng mục / task {#tasks}

(Chưa có — chờ §6 có hình dạng cụ thể trước khi tách task.)
