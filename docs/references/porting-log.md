# Porting Log

Nguồn sự thật duy nhất về trạng thái porting. Mỗi tính năng đáng cân nhắc đều phải có mặt ở đây — kể cả khi từ chối (bắt buộc ghi lý do, tránh đánh giá lại).

Status: `candidate` → `planned` → `in-progress` → `ported` / `adapted` / `rejected`

Đề cử dưới đây từ full scan 2026-07-13 (agent đề xuất, chưa ai chốt — `candidate` = shortlist chờ triage, chưa phải cam kết). Xếp theo mức nền tảng giảm dần: nhóm đầu là nền móng nên quyết sớm vì các tính năng sau xây lên trên.

| Feature | Nguồn | Status | Đích trong forgent | Commit | Ghi chú / Lý do |
|---|---|---|---|---|---|
| policy-vs-ops-split | beegog:policy-vs-ops-split + repository-harness:policy-vs-durable-separation | candidate | quy ước repo-layout của forgent | — | Quyết định nền móng: docs = policy, state dir = ops, gitignore ranh giới. Rẻ, nên chốt trước mọi thứ khác |
| trigger-only-descriptions | beegog:trigger-only-descriptions | candidate | chuẩn viết skill của forgent | — | Doctrine 1 trang, giá trị/chi phí cao nhất trong toàn bộ scan |
| state-vs-log-two-physics | beegog:state-vs-log-two-physics | candidate | thiết kế memory/knowledge layer | — | Nguyên lý tổ chức tri thức; forgent mới chỉ có dạng log |
| skill-conventions | beegog:skill-budgets-conventions | candidate | chuẩn skill forgent (<200 dòng, headless, red flags, handoff) | — | Đi cùng trigger-only-descriptions thành bộ chuẩn skill hoàn chỉnh |
| tdd-for-skills-iron-law | beegog:tdd-for-skills-iron-law | candidate | quy trình viết skill + pressure-test templates | — | Kèm 7 pressure types; là cách duy nhất đã thấy để eval chất lượng skill |
| error-why-fix-refusals | beegog:error-why-fix-refusals | candidate | chuẩn error message mọi tool/CLI forgent | — | Nhỏ, độc lập, nâng DX ngay |
| six-questions-acceptance | repository-harness:repo-as-os-six-questions | candidate | acceptance test cho harness forgent | — | Dùng làm định nghĩa "done" cho platform layer |
| context-rules-matrix | repository-harness:context-rules-matrix | candidate | context budget layer | — | Phase × lane × must/should/skip + token budgets; bee cũng chưa có bản tốt bằng |
| fail-open-crash-wrappers | beegog:fail-open-crash-wrappers | candidate | hook runtime của forgent | — | Cùng adapter.mjs pattern (stdin normalize, repo-root discovery, crash log) |
| hook-catalog-projection | beegog:hook-catalog-projection | candidate | hook layer nếu forgent hỗ trợ đa runtime | — | Chỉ đáng khi forgent chốt mục tiêu multi-runtime; đi cặp với parity tests |
| verify-enforced-close | beegog:cell-task-unit | candidate | task unit của forgent | — | Cap-requires-proof + before-state evidence; tính năng chống-ảo-giác mạnh nhất trong scan |
| tool-registry-capability | repository-harness:tool-registry-capability | candidate | tool/capability layer | — | "Absent capability = clean skip"; hợp định vị platform cung cấp tool cho agent apps |
| maturity-ladder | repository-harness:maturity-ladder-h0-h5 | candidate | roadmap forgent (F0–F5?) | — | Cho forgent thang tiến hóa đo được thay vì feature list phẳng |
| managed-block-markers | beegog:managed-block-markers | candidate | installer/onboarding forgent | — | Bắt buộc nếu forgent ghi vào file user-owned (AGENTS.md, .gitignore) |
| changeset-event-sourcing | repository-harness:changeset-event-sourcing | candidate | durable layer nếu forgent dùng db | — | Chỉ liên quan khi chọn store dạng db; nếu chọn JSONL như bee thì không cần |
| silent-bookkeeping | beegog:silent-bookkeeping | candidate | communication doctrine của forgent | — | Kèm gate-presentation-contract; UX khác biệt rõ nhất của bee |

Bổ sung từ delta scan `14e6f10..9cc306d` (2026-07-13):

| Feature | Nguồn | Status | Đích trong forgent | Commit | Ghi chú / Lý do |
|---|---|---|---|---|---|
| request-authority-model | repository-harness:request-authority-model | candidate | phân lớp quyền request trong harness forgent | — | Read-only vs change request — trị bệnh "hỏi cũng sinh nghi thức"; rất hợp triết lý YAGNI của anh |
| orchestration-protocol-v1 | repository-harness:orchestration-protocol-v1 | candidate | chuẩn giao tiếp CLI giữa forgent và agent apps | — | Forgent là platform cho agent apps → cần đúng loại contract này (discovery, exit codes, forward-compat) |
| proof-before-tag-promotion | repository-harness:proof-before-tag-promotion | candidate | release engineering của forgent | — | Frozen baseline vs current contract; failed tag bất biến — học từ sự cố thật của họ |
| repo-separation-playbook | repository-harness:repo-separation-playbook | candidate | quy trình tách module→repo sau này | — | Chưa cần ngay (YAGNI) nhưng đáng ghi: khi forgent tách sub-product sẽ cần đúng playbook này |
