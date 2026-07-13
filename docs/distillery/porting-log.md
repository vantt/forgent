# Porting Log

Nguồn sự thật duy nhất về trạng thái porting. Tính năng bị từ chối vẫn ghi lại kèm lý do — tránh đánh giá lại.

- Status: `candidate` → `planned` → `in-progress` → `ported` / `adapted` / `rejected`
- **Score** `R# E# F#` chấm MỘT LẦN lúc tạo candidate (rubric: `.agents/skills/distill/references/extract-rules.md`); tổng R×E/F không lưu — xem bảng xếp hạng bằng `distill.mjs rank`. Re-score một dòng chỉ khi delta scan mang evidence mới.
- **Local** = tên khái niệm/artifact trong project ta sau khi port (bắt buộc khi `ported`/`adapted`, `—` khi còn candidate). Cầu nối hai chiều source↔local, tra bằng `distill.mjs map [term]`; khi delta scan thấy nguồn tiến hóa một feature đã port, map chỉ ra local nào cần xem lại.
- Score cao + các nguồn giải khác nhau (matrix ô `hòa`/`~`) = ứng viên **deep-dive** cho human.

| Feature | Nguồn | Status | Score | Local | Đích (path) | Commit | Ghi chú / Lý do |
|---|---|---|---|---|---|---|---|
| policy-vs-ops-split | beegog:policy-vs-ops-split + repository-harness:policy-vs-durable-separation | adapted | — | distillery-layout | docs/distillery/ + upstreams/ | 29c4af3 | Đã thành quy ước sống trong distill init; tổng quát hóa khi forgent có state dir riêng |
| trigger-only-descriptions | beegog:trigger-only-descriptions | adapted | — | trigger-only-descriptions | .agents/skills/distill/SKILL.md | 29c4af3 | Giữ nguyên tên; nâng thành chuẩn chung khi có skill thứ hai |
| skill-conventions | beegog:skill-budgets-conventions | adapted | — | skill-conventions | .agents/skills/distill/ | 29c4af3 | <200 dòng + references/ + headless + red flags + handoff + CREATION-LOG; chưa port pressure-test (xem tdd-for-skills) |
| error-why-fix-refusals | beegog:error-why-fix-refusals | adapted | — | error-why-fix | .agents/skills/distill/scripts/distill.mjs (fail()) | 29c4af3 | Mọi refusal theo ERROR/WHY/FIX; nâng chuẩn chung khi có CLI thứ hai |
| managed-block-markers | beegog:managed-block-markers | adapted | — | distill-gitignore-block | distill.mjs init (.gitignore DISTILL:START/END) | 29c4af3 | Byte ngoài marker giữ nguyên; mở rộng cho AGENTS.md khi có onboarding |
| maturity-ladder | repository-harness:maturity-ladder-h0-h5 | candidate | R3 E2 F1 | — | roadmap forgent (F0–F5?) | — | Thang tiến hóa đo được thay vì feature list phẳng; E2: harness + benchmark thực chứng |
| request-authority-model | repository-harness:request-authority-model | candidate | R3 E2 F1 | — | phân lớp quyền request trong harness forgent | — | Read-only vs change request; E2: harness E12 + bee docs-lane cùng hướng |
| fail-open-crash-wrappers | beegog:fail-open-crash-wrappers | candidate | R2 E2 F1 | — | hook runtime forgent | — | Adapter pattern (stdin normalize, root discovery, crash log); E2: bee kế thừa claudekit, đã dogfood |
| six-questions-acceptance | repository-harness:repo-as-os-six-questions | candidate | R3 E1 F1 | — | acceptance test cho harness forgent | — | Định nghĩa "done" cho platform layer |
| state-vs-log-two-physics | beegog:state-vs-log-two-physics | candidate | R3 E2 F2 | — | thiết kế memory/knowledge layer | — | Nguyên lý nền tảng; E2: bee tường minh + harness ngầm (changesets vs docs) |
| context-rules-matrix | repository-harness:context-rules-matrix | candidate | R3 E2 F2 | — | context budget layer | — | Phase × lane × must/should/skip + token budgets + score-context; E2: harness + NLAHs research |
| verify-enforced-close | beegog:cell-task-unit + repository-harness:story-complete-atomic | candidate | R3 E3 F3 | — | task unit của forgent | — | **E3 hội tụ độc lập**: bee cap-requires-proof ↔ harness story-complete atomic — deep-dive candidate số một |
| orchestration-protocol-v1 | repository-harness:orchestration-protocol-v1 | candidate | R3 E2 F2 | — | chuẩn giao tiếp CLI forgent ↔ agent apps | — | E2: harness protocol v1 + bee command-registry cùng họ; hợp định vị platform |
| tdd-for-skills-iron-law | beegog:tdd-for-skills-iron-law | candidate | R2 E2 F2 | — | quy trình viết skill + pressure-test harness | — | E2: bee kế thừa superpowers; đang là debt của chính distill (CREATION-LOG) |
| tool-registry-capability | repository-harness:tool-registry-capability | candidate | R2 E2 F2 | — | tool/capability layer | — | "Absent capability = clean skip"; E2: harness + AHE research |
| changeset-event-sourcing | repository-harness:changeset-event-sourcing | candidate | R2 E3 F3 | — | durable layer nếu forgent dùng db | — | **E3 hội tụ độc lập**: harness changesets ↔ beads JSONL-truth; chỉ liên quan khi chọn store db |
| silent-bookkeeping | beegog:silent-bookkeeping | candidate | R2 E1 F1 | — | communication doctrine forgent | — | Kèm gate-presentation-contract; UX khác biệt rõ nhất của bee |
| hook-catalog-projection | beegog:hook-catalog-projection | candidate | R2 E1 F2 | — | hook layer nếu forgent multi-runtime | — | Chỉ đáng khi chốt mục tiêu multi-runtime; đi cặp parity tests |
| proof-before-tag-promotion | repository-harness:proof-before-tag-promotion | candidate | R1 E2 F2 | — | release engineering forgent | — | E2: sinh từ sự cố thật (run 29222332569); frozen baseline vs current contract |
| repo-separation-playbook | repository-harness:repo-separation-playbook | candidate | R1 E1 F1 | — | quy trình tách module→repo sau này | — | YAGNI hiện tại nhưng đáng giữ; khi forgent tách sub-product sẽ cần |
