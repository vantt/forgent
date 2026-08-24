# DRIVE PROMPT — hoàn tất chuỗi tsk-3tp (sweep checkpoint redesign)

> Cách dùng: mở một session Claude Code MỚI (model Sonnet) tại main
> checkout `/home/vantt/projects/forgentX`, dán nguyên văn prompt này.
> Prompt IDEMPOTENT — chạy lại bao nhiêu lần cũng được, mỗi lần tự xác
> định chỗ đang dở từ live state, không cần nhớ gì từ session trước.

Bạn là DRIVER cho chuỗi work item `tsk-3tp` (cha) + `tsk-3tp-1` (sweep
mechanism, heavy) + `tsk-3tp-2` (legacy removal, standard). Thiết kế đã
chốt D1-D4 — KHÔNG mở lại. Nguồn sự thật, đọc theo thứ tự:

1. `docs/history/tsk-3tp-worker-write-events-tang-b/CONTEXT.md` (D1-D4)
2. `docs/history/tsk-3tp-worker-write-events-tang-b/plan.md` (approach,
   phases, risk map, child specs, validation matrix)
3. `fgos show tsk-3tp --json`, `fgos rollup tsk-3tp --json` — live state

## Luật token (LÝ DO prompt này tồn tại — tuân thủ tuyệt đối)

Driver là tầng MỎNG. Context của bạn KHÔNG đủ để vừa điều phối vừa
implement/review. Vì vậy:

- **Không bao giờ implement hay review inline.** Mọi việc nặng (implement
  1 con, 1 vòng review, 1 lần fix) = MỘT agent tươi, spawn qua Agent tool
  với `isolation: "worktree"`, model sonnet. Trước MỖI lần spawn, chạy
  `node src/runner/dispatch.mjs decide --for <nhãn-việc> --needs-soul
  --has-live-task-access` và tuân kết quả (luật AGENTS.md).
- **Không đọc transcript/diff dài của agent con.** Chỉ đọc: (a) live
  state qua `fgos show/rollup --json`, (b) dòng Status cuối của agent,
  (c) file report ngắn agent để lại. Không tin narration — tin state.
- **Sau mỗi bước lớn, ghi 3-5 dòng tiến độ** (bước vừa xong, kết quả,
  bước kế) vào `docs/history/tsk-3tp-worker-write-events-tang-b/DRIVE-LOG.md`
  và commit nó vào nhánh đang đứng. Đây là checkpoint cho lần chạy sau.
- **Khi context của chính bạn chớm nặng** (nhiều lượt tool, transcript
  dài): DỪNG chủ động — ghi DRIVE-LOG.md, commit, rồi kết thúc với đúng
  một câu: "Context driver gần cạn. Mở session mới, dán lại
  DRIVE-PROMPT.md — nó sẽ tự resume." Đừng cố gồng qua giới hạn.

## Bước 0 — Resume từ state (luôn chạy, mọi lần khởi động)

```bash
fgos show tsk-3ve --json    # dep gốc: PHẢI done. Chưa done -> DỪNG, báo, không làm gì.
fgos rollup tsk-3tp --json  # con nào done/delivered/todo?
fgos show tsk-3tp-1 --json
fgos show tsk-3tp-2 --json
cat docs/history/tsk-3tp-worker-write-events-tang-b/DRIVE-LOG.md 2>/dev/null
```

Từ đó nhảy thẳng vào bước đầu tiên CHƯA xong theo thứ tự dưới. Item nào
đã `delivered`/`done` thì bỏ qua, không làm lại.

## Bước 1 — Hoàn thành 2 con, TUẦN TỰ (1 rồi mới 2; deps đã ép sẵn)

Với từng con `<child>` (tsk-3tp-1 trước, tsk-3tp-2 sau):

1. `node src/runner/dispatch.mjs decide --for implement-<child> --needs-soul --has-live-task-access`
2. Spawn 1 agent tươi (worktree isolation, sonnet), prompt cho nó:
   - Nhiệm vụ: chạy `/fgOS:pick <child>` và drive item này trọn vòng tới
     khi return xong (awaiting-approval) hoặc blocked.
   - Bắt buộc đọc trước: CONTEXT.md + plan.md của feature dir trên
     (child spec của nó nằm trong plan.md, action nằm trên item).
   - Với tsk-3tp-1: bước ĐẦU TIÊN là P0 — re-verify hình dạng Tầng A đã
     land (shard dir `.fgos/events/` active, replay đa-file, compaction);
     lệch thì cập nhật plan trước khi code, ghi rõ lệch gì.
   - Verify = `npm test` (full suite) phải XANH THẬT trước khi return —
     không skip, không weaken test. Chạy verify nền, capture exit code
     riêng (không pipe làm mất exit code).
   - Kết thúc bằng: `Status: DONE|BLOCKED` + 2 câu tóm tắt.
3. Agent xong → ĐỌC LẠI state thật: `fgos show <child> --json`.
   - `awaiting-approval` → `fgos approve <child>` (merge con về nhánh cha
     `fgw/tsk-3tp` — standing authorization D4/24-8 cho phép, không hỏi
     lại). Đọc exit code; đỏ → xử theo mục Blocked dưới.
   - `blocked` → đọc `reason`. Nếu là verify flake: re-verify đúng 1 lần
     để CHỨNG MINH flake rồi mới tự unblock (luật đã có). Nếu lỗi thật:
     spawn 1 fix-agent tươi, prompt = reason + con đường file liên quan,
     scope hẹp. CÙNG một lý do blocked 2 lần liên tiếp mà không có
     playbook → DỪNG toàn bộ, park hỏi người. Không lặp vô hạn.
4. Ghi DRIVE-LOG.md + commit. Sang con kế.

## Bước 2 — 3 vòng review độc lập trên nhánh cha (sau khi CẢ 2 con merged)

`fgos pick tsk-3tp` để claim cha + đứng trong worktree `fgw/tsk-3tp`
(EnterWorktree vào path trả về). Rồi chạy đúng 3 vòng, MỖI VÒNG MỘT AGENT
TƯƠI (không chia sẻ context với nhau, không chia sẻ với driver), tuần tự,
lens khác nhau:

- **R1 — correctness/regression:** đọc diff `main...fgw/tsk-3tp` (giới
  hạn trong agent đó, không trả diff về driver), chạy `npm test`, săn
  logic bug/regression, đặc biệt: sweep có thể stage nhầm path ngoài
  `.fgos/events/`? fallback có đường nào không bao giờ fire? caller nào
  của API cũ bị bỏ sót (grep)?
- **R2 — behavioral/e2e:** dựng kịch bản thật trong worktree tạm: merge
  với shard dirty → commit chứa shard; khoảng lặng → fallback fire đúng
  interval; KHÔNG còn commit `chore(.fgos): periodic events.jsonl
  checkpoint` chuyên dụng nào sinh ra; env opt-out đã gỡ sạch; doctor
  check mới hiện diện (`fgos doctor`).
- **R3 — spec/safety:** đối chiếu code cuối với D1-D4 + ADR0020 (không
  ngoại lệ merge guard nào lọt vào), Install/setup/doctor gate của
  AGENTS.md, CHANGELOG Unreleased có dòng, docs không nói dối code.

Mỗi vòng: agent ghi findings vào
`plans/reports/review-r<N>-260824-tsk-3tp-<slug>-report.md`, kết thúc
`Verdict: CLEAN` hoặc `Verdict: FINDINGS` + danh sách đánh số. Driver chỉ
đọc verdict + danh sách.

**FINDINGS xử lý:** với mỗi finding CONFIRMED (không phải style/nitpick):
spawn 1 fix-agent tươi trên worktree cha, fix + `npm test` xanh + commit.
Fix xong mới chạy vòng review kế (vòng sau review trạng thái ĐÃ fix).
Finding kiểu "đây là quyết định sản phẩm" → KHÔNG tự quyết, ghi vào
DRIVE-LOG.md và park hỏi người. Đủ 3 vòng, vòng cuối phải CLEAN — nếu
vòng 3 vẫn FINDINGS: fix rồi chạy thêm 1 vòng xác nhận (tối đa 5 vòng
tổng; quá 5 → dừng, park hỏi người).

## Bước 3 — Merge cha lên main, approve Iron Law

1. Trong worktree cha: `fgos return tsk-3tp` (verify chạy thật, xanh).
2. `fgos approve tsk-3tp` — cổng Iron Law: làm evidence THẬT theo pattern
   sẵn có trong repo (xem `docs/history/tsk-2yog/iron-law-evidence.md`
   làm mẫu), không fabricate. **Standing authorization: anh (24/8, ghi
   trong D4) đã cho phép approve không hỏi lại** — scoped ĐÚNG chuỗi
   tsk-3tp này, không mở rộng cho item khác.
3. Approve đỏ vì verify → không hạ bar: đọc log, fix (agent tươi nếu
   nặng), thử lại. Đỏ 2 lần cùng lý do không playbook → dừng, park.
4. Sau khi cha landed: bước TÙY CHỌN — xóa 2 file
   `.fgos/events.jsonl.backup-*` trực tiếp trên main checkout (D4 ghi:
   không nằm trong con nào vì diff `.fgos/` từ nhánh bị guard chặn). Nếu
   pre-commit hook từ chối → bỏ qua, ghi note vào DRIVE-LOG.md, không
   force, không bypass hook.
5. Ghi DRIVE-LOG.md dòng cuối: chuỗi hoàn tất + hash merge commit. Báo
   cáo kết thúc: đã land gì, verify nào xanh, review nào tìm được gì,
   còn gì park lại.

## Cấm tuyệt đối

- Ghi `.fgos/` trực tiếp bằng tay (mọi thay đổi state qua verb `fgos`).
- `git stash` trần, `--force`, bypass hook/guard, sửa test cho dễ pass.
- Approve/merge bất kỳ item NGOÀI chuỗi tsk-3tp/tsk-3tp-1/tsk-3tp-2.
- Mở lại thiết kế D1-D4 hay scope mới — thấy thiếu sót thiết kế thật sự
  thì park hỏi người, không tự đổi.
