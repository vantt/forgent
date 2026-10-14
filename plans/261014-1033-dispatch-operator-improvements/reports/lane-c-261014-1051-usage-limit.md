# Lane C — nhận diện hết hạn mức: báo cáo

Worktree `/home/vantt/projects/forgentX-worktrees/dispatch-usage-limit`, nhánh `feat/dispatch-usage-limit` (từ main `88315d5de`). Worktree sạch cho panel: `/home/vantt/projects/forgentX-worktrees/dispatch-usage-limit-panel` (detached, không sửa gì).

Trạng thái: **council xong, plan viết xong, code production chưa đụng** vì Lead đã ra lệnh dừng (10:45) chờ council một-cửa.

## Đề xuất 7 — usage limit

**Nguyên nhân (proven):**

1. Lượt thật `.fgos/runtime/tmp/doer-turn-07.out.json` (2026-10-13, codex qua cli-spawn, unconfined):
   - stderr kết thúc bằng "ERROR: You’ve hit your usage limit … try again at 11:39 PM." (hai lần), rồi `tokens used` / `379,854`;
   - process exit 1;
   - JSON của execute: `status: 1`, `outcome: "unsignaled"`, `headBefore d173e54 != headAfter baef3a0`.
2. Lệnh `fgos dispatch execute` thoát 0 mỗi khi adapter trả về, kể cả `status: 1` (`cli.mjs` case `execute`). `buildDispatchResult` ghi `unsignaled` và bảo caller suy ra xong từ HEAD tiến. Lượt này đã commit dở trước khi bị cắt, nên Lead đọc thành xong.
3. Cửa Assignment/Unit có cùng lỗ hổng: `settlement.mjs` chỉ nâng câu credential chết thành `provider-limit`. Câu hạn mức ra `nonzero-process-exit`, nên không xoay account / không fallback. Bằng chứng: `asgn_lead_cold_resumable_dag_op_062` và khoảng 25 assignment codex cũ cùng dạng.
4. Câu chữ "quota" hiện nằm ở 5 chỗ, mỗi chỗ một hình dạng: `AUTH_FAILURE_PATTERNS`, `DEFAULT_USAGE_LIMIT_PATTERNS` (liveness), regex riêng trong `classifyProviderCapacityFault`, và `QUOTA_PATTERN` trong cả `provider-account-probe.mjs` lẫn `provider-credential-probe.mjs`.

**Council:** [council-261014-1051-usage-limit.md](council-261014-1051-usage-limit.md).

- Hướng thắng rõ (mọi seat đồng ý), dùng được với mọi hình dạng cửa:
  - dùng lại `provider-limit` với `cause: 'quota'` + `retryAt` (chỉ khi provider ghi giờ);
  - một classifier stderr chung, đọc 5 dòng cuối, neo `^ERROR:`;
  - exit khác 0 không bao giờ mang nghĩa "suy ra xong";
  - không xây scheduler: xoay account, rồi candidate kế, rồi mới chờ, và báo mốc kèm basis.
- Tự hẹn chạy lại: các seat **không ngang nhau**. Tất cả bác việc xây scheduler trong item này và đề nghị tách item riêng (park bền có `notBefore`, cần spec). Vì vậy em không có câu hỏi quyết định cho anh vantt ở điểm này.
- Phần chờ một-cửa: shape/tên trường, giá trị mã thoát, cách nhận biết claim theo từng cửa, chỗ quarantine, ai giữ `retryAt`.

**Plan:** [plans/261014-1051-dispatch-usage-limit/plan.md](../../261014-1051-dispatch-usage-limit/plan.md), status `blocked — chờ council một-cửa`.

**Thay đổi code:** không có.

**Test đỏ** (chưa commit, theo lệnh Lead), đều nằm trong worktree lane:

- `test/runner/execution/run-provider-failover.test.mjs`: worker giả in đúng câu codex rồi exit 1. Đỏ hiện tại: `execution-failure`, không xoay account.
- `test/runner/dispatch.test.mjs` (cuối file): hai test `buildDispatchResult`. Đỏ: `unsignaled`.

Hai test này ghim shape `providerLimit{}` / `failure.retryAt`, mà shape thuộc phần chờ một-cửa.

**Commit:** chỉ plan + hai báo cáo (hash ghi ở tin nhắn cuối pane).

**`npm test`:** chưa chạy toàn bộ. Nhánh không có thay đổi code so với main (chỉ thêm docs plan/report), còn hai file test đỏ thì cố ý đỏ và không commit. UNPROVEN cho nhánh, không áp dụng.

## Nhận xét về chuyện nhiều cửa (cho council một-cửa)

1. **Cùng một sự kiện "provider hết hạn mức", ba cửa trả ba câu trả lời:**
   - raw `execute --for` (`executeExecutorCli` → `buildDispatchResult`) không có RunResult, settlement, classifier hay quarantine. Ra `unsignaled`, process thoát 0.
   - `execute --assignment/--contract` và Workflow unit (`executeAssignment` → `settlement.mjs` → `normalizeRunResultV3`) ra `failure.code: nonzero-process-exit`. Account vẫn bị quarantine nếu có selection, nhưng outcome không đổi. Kết quả: quarantine và outcome mâu thuẫn nhau.
   - herdr round (`liveness.mjs`) đọc màn hình và ra `provider-limit` / `paused-limit`.

   Cùng một lỗi mà raw execute, unit và herdr cho ba nghĩa khác nhau. Cái fix cần (một classifier, một shape kết quả) chỉ "một lần" được nếu các cửa cùng đi qua một bước settle.
2. **Chỉ một cửa có bước settle thật.** Assignment/unit có `evidence.json` + RunResult v3 + quarantine. Raw execute chỉ có `{status, stdout, stderr, outcome}` trải phẳng, và cũng chỉ cửa này để caller tự suy ra xong từ HEAD. Đề xuất 1–3 của lane A (log, `finalMessage`) cũng mọc từ đúng khoảng trống này.
3. **Cửa raw execute không có account identity** (không selection), nên không quarantine được. Account rotation (0058) chỉ sống trong `run.mjs`. Một cửa duy nhất có selection thì quarantine và rotation mới áp dụng đều cho mọi cửa.
4. **Mã thoát:** raw execute luôn thoát 0 khi không throw. Cửa unit/workflow thì trạng thái nằm trong state. `docs/io-contract.md` nói `EXIT_CODES` là nguồn duy nhất, nhưng execute không dùng nó cho kết quả lượt.
5. **Gán nhầm ghi file, gặp hai lần ngay trong council này** (bằng chứng cho lane D đề xuất #8):
   - (a) vòng read-only bị `read-only-mutation` vì chính em sửa file trong cùng worktree đích. Attribution `correlated`, `coverageMatched: false`.
   - (b) vòng read-only ở worktree khác bị "wrote outside its workspace" vì một phiên khác ghi `plans/261014-1033-dispatch-operator-improvements/reports/` vào main checkout (`unit-run-1791949883982-8247182c/reviewer/2`, `red-team/2`).

   Cả hai đều do phép đo dựa trên diff workspace trước/sau mà không gắn với process. Hệ quả là panel chạy được trên checkout dùng chung cũng không tin được.

## Còn để ngỏ

- Packet r2 của council chưa được reviewer/red-team kiểm lại, vì lỗi (5b).
- Chưa có mẫu đo câu reset theo ngày/tuần của codex (chuyên môn còn thiếu).
- Chưa kiểm resume sau commit dở khi xoay account.
- Dọn dẹp: worktree `dispatch-usage-limit-panel` để lại cho Lead tra cứu, xoá cùng lúc khi kết thúc. Pane herdr của panel do Workflow tự quản.
