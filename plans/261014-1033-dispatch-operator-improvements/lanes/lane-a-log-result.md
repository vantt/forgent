# Lane A — log và kết quả của `dispatch execute`

Nhánh: feat/dispatch-log-result. Đọc lanes/common.md trước.
Không cần council: thiết kế nhỏ, tự quyết, ghi lý do trong báo cáo.

1. Tự ghi log: sau một lượt `dispatch execute` out-of-process, bản ghi `dispatch log` hiện phải gọi tay — Lead hay quên. Chọn giữa: execute tự ghi log, hoặc thêm `log --plan <plan-dir>` để gắn lượt chạy với plan (hoặc cả hai). Tìm lý do vì sao log tách khỏi execute ngay từ đầu (prior art) trước khi gộp; nếu tách có chủ đích thì giữ lý do đó.
2. Help: `dispatch --help`/`dispatch execute --help` phải nói log là bước bắt buộc sau lượt out-of-process (nếu sau việc 1 vẫn còn bắt buộc), kèm cách dùng. Nếu việc 1 làm log tự động thì help nói đúng hành vi mới.
3. KHÔNG thêm trường `finalMessage` mới (anh vantt chỉnh 2026-10-14). Đã có chuẩn output: agent-result claim v2 (src/runner/dispatch/agent-result-claim-contract.mjs: status, summary, blocker/error, evidenceRefs) đi vào RunResult.agentClaim — đường `--contract`/workflow unit/herdr round dùng nó. Khoảng trống là đường `execute <executor> --for <cap>` trả kết quả thô `{status,signal,stdout,stderr,tier,model}` (cli.mjs ~349, ~1523), không qua chuẩn claim, nên Lead phải lọc câu cuối từ stdout.
   Việc cần làm: (a) chứng minh Lead lấy câu báo cáo từ đường nào; (b) chứng minh vì sao stdout in câu cuối hai lần; (c) cho đường thô dùng lại chuẩn claim/RunResult có sẵn (hoặc chuyển nó qua đường đó), không mở format output thứ hai. Nếu thấy buộc phải có field mới thì dừng, hỏi anh theo mẫu.
Vùng file: src/runner/dispatch/cli.mjs (execute/log/help), run-result.mjs, adapter liên quan.
Lưu ý: nhánh fix/dispatch-followups đang sửa phần dựng brief `--contract` trong cli.mjs (quanh dòng 132, 779) — đừng sửa vùng đó.

## Cập nhật sau hội đồng một-cửa (2026-10-14 12:40) — thay thế các mục trên khi mâu thuẫn

Đọc reports/council-261014-1231-dispatch-one-door-conclusion.md. Gỡ lệnh chờ: được sửa code production trong phạm vi dưới.
- Không thêm verb/field mới: bỏ hướng execute tự gọi `dispatch log` và bỏ `finalMessage`. #1/#2 = gắn provenance plan/work (id plan hoặc work) vào Assignment run, đi qua contract sẵn có; #3 = caller đọc `agentClaim.summary`.
- Patch `.fgos/runtime/tmp/lane-a-dispatch-execute-log.patch` (execute tự ghi log) KHÔNG áp. Test đỏ viết lại theo hướng mới.
- Không sửa doctrine AGENTS.md:167 / executor-dispatch-fallback.md (bước 3, Lead làm sau).
- Help: chỉ sửa cho đúng hành vi hiện có nếu đang sai; không quảng bá cửa thô.
