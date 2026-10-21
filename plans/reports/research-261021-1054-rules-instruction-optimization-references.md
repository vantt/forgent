# Quét lại report và plan về tối ưu luật và instruction: danh sách tham chiếu

Quét ngày 2026-10-21 10:54 (Asia/Saigon), chỉ đọc, trên checkout `/home/vantt/projects/forgent`, nhánh `main`. Theo yêu cầu của owner: quét một lần mọi report và plan đã tạo có đề cập việc tối ưu luật và instruction, liệt kê hết vào phần tham chiếu.

## Kết quả

Trong 1.312 file markdown dưới `plans/` (761 file ở `plans/reports/`), em chọn ra **70 tài liệu** có chủ đề hoặc một phần đáng kể là luật, instruction, doctrine hay đường đưa chỉ dẫn vào agent: **33 Chính**, **25 Liên quan**, **12 Bối cảnh**. Danh sách xếp theo chín nhóm chủ đề ở mục Tham chiếu. Thêm 17 nơi ngoài `plans/` (docs, `core`, `src`, skill) để đối chiếu, và 7 tài liệu đã xét rồi loại.

Ba điều rút ra, đều từ các báo cáo đã có, đáng đưa vào handoff:

1. **Cuộc điều tra harness 10-06 đã đo sẵn nhiều thứ handoff đang giao làm lại.** `instruction-audit-261006` đo lớp instruction thật sự nạp; `archaeologist-261006` đã kết luận `.claude/rules/*` không nằm trong git, trùng với điều em kiểm lại hôm nay; `fatal-flaws-261006` có bằng chứng rằng sửa bằng văn xuôi luôn nạp không ngăn được lỗi lặp lại, ủng hộ mục tiêu "đo bằng hành vi" của handoff.
2. **Số đo theo CLI cho điểm inject đã có một phần.** `research-261020-1612` đo hook theo từng CLI: Claude và Codex có `UserPromptSubmit`, agy không có; omp và pi chưa đo. `research-261020-1814-mailbox-instruction-and-injection-eval-v2` cho thấy cùng một chỉ dẫn được làm theo rất khác nhau giữa Claude, Codex và pi.
3. **Tiền lệ cho sổ cái và bản render đã có.** Phase 02 của kế hoạch một cửa (header trên bản render) và phase 04 của mẫu câu hỏi (hook thi hành) là hai cơ chế cùng loại đã land; nhóm E của handoff nên tái dùng, không dựng mới.

## Phương pháp và giới hạn

- Chấm điểm toàn bộ 1.312 file bằng từ khoá (`core/instructions`, `instruction-composition`, `AGENTS.md`, `.claude/rules`, RUL100–RUL111, guardrail, doctrine, luật, instruction), thêm lượt quét theo tên file và lượt quét theo nội dung (luật hoặc instruction đi cùng chuyện nạp, token, trùng lặp). Ra 238 ứng viên, đọc phần đầu của các file chưa rõ rồi phân loại bằng tay.
- Mức **Chính** nghĩa là chủ đề của tài liệu là luật hoặc instruction. **Liên quan** nghĩa là một phần đáng kể. **Bối cảnh** nghĩa là nguồn dữ liệu, brief hoặc điều phối.
- Em không đọc trọn từng tài liệu; phần "vấn đề chính" lấy từ tiêu đề và phần tóm tắt đầu file. Những tài liệu đánh Liên quan hoặc Bối cảnh mà người làm nhóm B cần dùng thì nên đọc kỹ hơn.
- Các file bằng chứng sinh ra bởi run (`brief-1.md` dưới `evidence/`, log, CSV, script) không liệt kê từng file.
- Phạm vi chỉ gồm `plans/` và các nơi docs được nêu. Em không quét `docs/history/` và `docs/journals/`.

## Tham chiếu

### A. Nền của luồng quản lý luật

Đọc trước. Đây là bằng chứng và quyết định đang chi phối luồng này.

| Mức | Tài liệu | Vấn đề chính |
|---|---|---|
| Chính | [research-261016-1118-agent-code-quality-guardrails.md](research-261016-1118-agent-code-quality-guardrails.md) | INS: vì sao luật "một cửa" có mà code vẫn trùng; đo thật bảng nạp luật của bốn CLI; đề xuất P1–P7 và câu Q4–Q7. |
| Chính | [review-261021-1008-rules-that-grow-the-system.md](review-261021-1008-rules-that-grow-the-system.md) | Kiểm kê 14 nơi ghi luật; mỗi lượt Claude nạp khoảng 56 KB; luật nào đẩy hệ thống phình; R4 "không cần tương thích ngược" mâu thuẫn với việc cài thật. |
| Chính | [handoff-261021-1021-rule-management-tight-no-conflict-right-place.md](handoff-261021-1021-rule-management-tight-no-conflict-right-place.md) | Prompt giao luồng quản lý luật: bảy mục tiêu, sổ cái và bản render, bảy nhóm việc. |
| Chính | [261017-1313-fgos-platform-program-board/plan.md](../261017-1313-fgos-platform-program-board/plan.md) | Board chương trình: hàng INS, D6, TEST, HARDEN, MAIL; nơi phải ghi trạng thái khi bắt đầu, xong, bị chặn hay land. |
| Liên quan | [proposal-261021-0851-harden-review-criteria-and-method.md](proposal-261021-0851-harden-review-criteria-and-method.md) | HARDEN: trục G (bề mặt cho agent) và cổng 6 (hướng dẫn cho agent rõ, nhẹ, không trùng) khi soát từng tầng foundation. |

### B. Điều tra harness 2026-10-06: vì sao agent vẫn làm tùm lum

Một cuộc điều tra nhiều vai, đo thật những gì phiên Claude nạp và 57 ca agent làm sai. Thư mục còn chứa script và số liệu thô (`count-hook-injections.cjs`, `measure-instruction-layers.cjs`, các file `.csv`, `.txt`).

| Mức | Tài liệu | Vấn đề chính |
|---|---|---|
| Bối cảnh | [prompt-261006-0955-investigate-harness-drift-rul11.md](prompt-261006-0955-investigate-harness-drift-rul11.md) | Brief mở cuộc điều tra, định nghĩa các vai. |
| Chính | [harness-investigation-261006-synthesis.md](harness-investigation-261006-synthesis.md) | Bản tổng hợp 3: mục tiêu "tối ưu hành vi"; coi `ak-*`, `ck-*`, hook và rules của AgentKit/ClaudeKit là ràng buộc ngoài; còn treo Q6–Q9. |
| Chính | [harness-investigation-261006/instruction-audit-261006.md](harness-investigation-261006/instruction-audit-261006.md) | Đo những gì một phiên Claude thật sự nạp, kể cả hook; hook global và project tiêm hai khối nói ngược nhau. |
| Chính | [harness-investigation-261006/enforcement-audit-261006.md](harness-investigation-261006/enforcement-audit-261006.md) | Phần cưỡng chế cũng tùm lum: kiểm cơ học đi qua 5 cửa; `check-decision-codes` exit 1 với 375 vi phạm vượt baseline; `check-hook-registrations-guarded` mồ côi. |
| Chính | [harness-investigation-261006/conditions-261006.md](harness-investigation-261006/conditions-261006.md) | Cấu trúc và điều kiện khiến agent làm tùm lum; bằng chứng sống về hai khối hook mâu thuẫn (`descriptive-name`). |
| Chính | [harness-investigation-261006/archaeologist-261006.md](harness-investigation-261006/archaeologist-261006.md) | Harness là ba lớp từ ba nguồn chồng nhau (ck, ak, doctrine fgOS); `.claude/rules/*` không nằm trong git; RUL11 gốc chỉ nhắm cấu trúc code. |
| Chính | [harness-investigation-261006/critic-261006.md](harness-investigation-261006/critic-261006.md) | Phản biện: phần đo đúng, chỗ yếu ở suy luận nhân quả; 0/57 ca do mâu thuẫn ck/ak gây ra. |
| Chính | [harness-investigation-261006/fatal-flaws-261006.md](harness-investigation-261006/fatal-flaws-261006.md) | Phản biện thù địch: sửa bằng văn xuôi luôn nạp bị chính dữ liệu bác (lỗi "hỏi thừa" lặp lại dù luật đang nạp); thiếu mẫu số, baseline và thí nghiệm A/B. |
| Liên quan | [harness-investigation-261006/behavior-forensics-261006.md](harness-investigation-261006/behavior-forensics-261006.md) | Pháp y hành vi: 57 ca agent làm sai, phân loại theo lớp harness. |
| Bối cảnh | [harness-investigation-261006/classification-codebook-261006.md](harness-investigation-261006/classification-codebook-261006.md) | Codebook phân loại dùng chung cho cuộc điều tra. |
| Bối cảnh | [harness-investigation-261006/rater-1-261006.md](harness-investigation-261006/rater-1-261006.md) | Người chấm độc lập thứ nhất cho 57 ca. |
| Bối cảnh | [harness-investigation-261006/rater-2-261006.md](harness-investigation-261006/rater-2-261006.md) | Người chấm độc lập thứ hai cho 57 ca. |
| Chính | [harness-investigation-261006/skill-catalog-audit-261006.md](harness-investigation-261006/skill-catalog-audit-261006.md) | Catalog skill phình do một bộ ngoài nạp hai lần; nguồn thật và bản render không rõ; tham chiếu mồ côi tới skill đã xoá. |
| Liên quan | [harness-investigation-261006/path-name-docs-audit-261006.md](harness-investigation-261006/path-name-docs-audit-261006.md) | Không có văn bản nào định nghĩa path và tên cho plan, report, prompt, journal; quy ước chỉ nằm trong hook; drift đo được. |

### C. Gốc rễ phình và trôi hướng

Hai tài liệu nhìn từ genesis, trả lời vì sao luật và cơ chế liên tục thêm mà không bớt.

| Mức | Tài liệu | Vấn đề chính |
|---|---|---|
| Chính | [opus-genesis-drift-forensics-261008.md](opus-genesis-drift-forensics-261008.md) | fgOS sinh ra như harness tự cải thiện, không có tenant ngoài kéo kích thước xuống; các điều khoản "gom tới khi hết" không có ngân sách; vòng review chỉ thêm code. |
| Liên quan | [prompt-261008-bloat-root-cause-discussion.md](prompt-261008-bloat-root-cause-discussion.md) | Brief thảo luận với owner về nguyên nhân phình; một câu trả lời mù của owner bị ghi thành cho phép mở rộng phạm vi. |

### D. Mẫu câu hỏi quyết định và gỡ các quy tắc hỏi trùng

Một lần gom luật thật: gỡ nhiều chỗ nói trùng về cách hỏi owner, thay bằng một mẫu và hook thi hành.

| Mức | Tài liệu | Vấn đề chính |
|---|---|---|
| Chính | [261008-1353-decision-question-template-and-cleanup/plan.md](../261008-1353-decision-question-template-and-cleanup/plan.md) | Mẫu câu hỏi quyết định và gỡ các quy tắc hỏi trùng; có ngân sách dòng thêm và dòng xoá. |
| Chính | [261008-1353-decision-question-template-and-cleanup/phase-01-decision-question-template.md](../261008-1353-decision-question-template-and-cleanup/phase-01-decision-question-template.md) | Mẫu năm phần và validator `fgos ask`. |
| Chính | [261008-1353-decision-question-template-and-cleanup/phase-02-remove-duplicate-question-rules.md](../261008-1353-decision-question-template-and-cleanup/phase-02-remove-duplicate-question-rules.md) | Gỡ các chỗ nói trùng về cách hỏi owner. |
| Chính | [261008-1353-decision-question-template-and-cleanup/phase-03-approved-frame.md](../261008-1353-decision-question-template-and-cleanup/phase-03-approved-frame.md) | Khung đã duyệt: điểm dừng chung cho các luật đẩy hệ thống về phía "nhiều hơn". |
| Chính | [261008-1353-decision-question-template-and-cleanup/phase-04-askuserquestion-hook.md](../261008-1353-decision-question-template-and-cleanup/phase-04-askuserquestion-hook.md) | Hook `AskUserQuestion` thi hành mẫu: cửa hỏi chính thật là `AskUserQuestion` (403 lần gọi), không phải `fgos ask`. |
| Liên quan | [261008-1353-decision-question-template-and-cleanup/phase-05-explicit-approval-and-single-ask-channel.md](../261008-1353-decision-question-template-and-cleanup/phase-05-explicit-approval-and-single-ask-channel.md) | Đồng ý rõ ràng bằng `--approve` và một kênh hỏi duy nhất. |
| Liên quan | [prompt-261008-1644-approve-on-every-answer-door.md](prompt-261008-1644-approve-on-every-answer-door.md) | Mọi cửa trả lời phải phân biệt đồng ý với làm rõ (gateway REST, MCP, workflow gate). |
| Chính | [prompt-261008-1644-hook-install-outside-fgos-repo.md](prompt-261008-1644-hook-install-outside-fgos-repo.md) | Hook của fgOS không chạy ở dự án khác (script và `src/` không tồn tại ngoài repo fgOS): luật inject bằng hook không tới được mission #1. |

### E. AGENTS.md một người ghi, bản render có header, máy kiểm chống sửa tay

Tiền lệ cho các cơ chế sổ cái và bản render mà handoff đề xuất.

| Mức | Tài liệu | Vấn đề chính |
|---|---|---|
| Liên quan | [261006-1415-fgos-single-door-mechanisms/plan.md](../261006-1415-fgos-single-door-mechanisms/plan.md) | Kế hoạch cơ chế một cửa; phase 02, 05, 06 bên dưới là phần chạm luật. |
| Chính | [261006-1415-fgos-single-door-mechanisms/phase-02-skill-render-generated-header.md](../261006-1415-fgos-single-door-mechanisms/phase-02-skill-render-generated-header.md) | Header sinh tự động trên mọi file skill render, để biết nguồn và không sửa tay. |
| Liên quan | [261006-1415-fgos-single-door-mechanisms/phase-05-root-file-guard-and-junk-cleanup.md](../261006-1415-fgos-single-door-mechanisms/phase-05-root-file-guard-and-junk-cleanup.md) | Cổng chặn file lạ ở thư mục gốc (allowlist) và dọn rác có cổng. |
| Chính | [261006-1415-fgos-single-door-mechanisms/phase-06-agents-md-single-writer.md](../261006-1415-fgos-single-door-mechanisms/phase-06-agents-md-single-writer.md) | Doctrine một người ghi `AGENTS.md` và kiểm chứng vị trí tạm. |
| Chính | [261006-1415-fgos-single-door-mechanisms/phase-06-doctrine-review.md](../261006-1415-fgos-single-door-mechanisms/reports/phase-06-doctrine-review.md) | Review bằng chứng và vị trí đặt doctrine của phase 06. |
| Bối cảnh | [planner-261006-1415-single-door-mechanisms-handoff.md](planner-261006-1415-single-door-mechanisms-handoff.md) | Handoff của kế hoạch A, một cửa. |
| Bối cảnh | [journals/2026-10-06-single-door-hygiene-without-losing-prior-work.md](../journals/2026-10-06-single-door-hygiene-without-losing-prior-work.md) | Ghi chép giữ bằng chứng cũ khi dọn. |
| Liên quan | [journals/2026-10-02-p5-terminology-sweep-and-vocabulary-guard.md](../journals/2026-10-02-p5-terminology-sweep-and-vocabulary-guard.md) | Quét thuật ngữ và guard từ vựng chết: một máy kiểm giữ từ đã gỡ không quay lại tài liệu. |

### F. Sửa instruction và doctrine theo cơ chế thật

Những lần cụ thể doctrine, skill hay instruction bị viết lại hoặc gỡ để khớp với cơ chế mới.

| Mức | Tài liệu | Vấn đề chính |
|---|---|---|
| Liên quan | [261014-1400-two-doors-one-rununit/plan.md](../261014-1400-two-doors-one-rununit/plan.md) | Hai cửa một runUnit; phase 07a, 07b là phần doctrine. |
| Chính | [261014-1400-two-doors-one-rununit/phase-07a-doctrine-additive.md](../261014-1400-two-doors-one-rununit/phase-07a-doctrine-additive.md) | Doctrine chỉ cộng thêm trước, cổng G-M1. |
| Chính | [261014-1400-two-doors-one-rununit/phase-07b-doctrine-remove-old-doors.md](../261014-1400-two-doors-one-rununit/phase-07b-doctrine-remove-old-doors.md) | Gỡ doctrine cửa cũ trong một lần merge cùng cơ chế. |
| Chính | [261014-1400-two-doors-one-rununit/lane-docs-a-261014-1837.md](../261014-1400-two-doors-one-rununit/reports/lane-docs-a-261014-1837.md) | Lane docs-a: doctrine chỉ cộng thêm. |
| Chính | [261014-1400-two-doors-one-rununit/lane-docs-b-261014-1948.md](../261014-1400-two-doors-one-rununit/reports/lane-docs-b-261014-1948.md) | Lane docs-b: gỡ doctrine cửa cũ. |
| Chính | [261014-1400-two-doors-one-rununit/review-rununit-docs-b-261014-1945.md](../261014-1400-two-doors-one-rununit/reports/review-rununit-docs-b-261014-1945.md) | Review: máy kiểm gồm test doctrine, regex cửa đã gỡ (0 hit) và renders đồng bộ. |
| Chính | [261019-1238-workflow-case-ledger-and-admission/phase-09-doctrine-docs-closeout.md](../261019-1238-workflow-case-ledger-and-admission/phase-09-doctrine-docs-closeout.md) | Viết lại `coordination-driver.md`: phán route thuộc agent, cơ học và cưỡng chế thuộc harness. |
| Liên quan | [phase-lead-261020-0051-workflow-case-p09-closeout.md](phase-lead-261020-0051-workflow-case-p09-closeout.md) | Báo cáo phase lead đóng phase 09. |
| Liên quan | [261018-2240-cook-path-cleanup-and-run-fixes/plan.md](../261018-2240-cook-path-cleanup-and-run-fixes/plan.md) | COOK P1 và P3: dọn sự kiện cũ, đổi tên cook cũ thành deliver. |
| Liên quan | [261020-2014-cook-p5-fgos-cook-coordination-loop/plan.md](../261020-2014-cook-p5-fgos-cook-coordination-loop/plan.md) | Skill `fgos-cook`: đọc plan do `ak:plan` viết (bên thứ ba, chỉ đọc), liên quan đường luật tới lead. |
| Liên quan | [code-review-260927-1456-unit-i17-demand-doctrine-review-report.md](code-review-260927-1456-unit-i17-demand-doctrine-review-report.md) | Review doctrine nhu cầu: hai lỗi doctrine chỉ ở văn xuôi. |
| Bối cảnh | [code-review-260927-1513-unit-i17-remediation-re-review-report.md](code-review-260927-1513-unit-i17-remediation-re-review-report.md) | Review lại phần sửa. |
| Liên quan | [architecture-advisory-260926-1322-phase4-loop-driver-layering-report.md](architecture-advisory-260926-1322-phase4-loop-driver-layering-report.md) | Tầng loop là doctrine (kỷ luật driver), không phải engine; cần hai consumer khác nhau dùng chung một fragment. |
| Liên quan | [coordination-skill-harness-architecture-audit-260919-report.md](coordination-skill-harness-architecture-audit-260919-report.md) | Skill runtime trở thành bản triển khai điều phối thứ hai, trộn routing, protocol và văn xuôi. |
| Liên quan | [review-260905-agent-coordination-trong-mem-ngoai-cung.md](review-260905-agent-coordination-trong-mem-ngoai-cung.md) | Đường chuyển doctrine, persona và context từ protocol xuống worker bị thiếu. |

### G. Thống nhất thẩm quyền tài liệu (kế hoạch 260925, chồng lấn trực tiếp)

Phiên `forgentx-5f`. Phase 8 có bản ghi vá cho 331 file instruction, skill, comment, help; chỉ land ở phase 9.

| Mức | Tài liệu | Vấn đề chính |
|---|---|---|
| Chính | [260925-documentation-authority-unification/plan.md](../260925-documentation-authority-unification/plan.md) | Gộp các thẩm quyền tài liệu cạnh tranh về `docs/platform/**`. |
| Bối cảnh | [260925-documentation-authority-unification/independent-frontier-review-prompt.md](../260925-documentation-authority-unification/independent-frontier-review-prompt.md) | Prompt review độc lập. |
| Liên quan | [260925-documentation-authority-unification/independent-frontier-review-2026-09-25.md](../260925-documentation-authority-unification/independent-frontier-review-2026-09-25.md) | Review độc lập lần một. |
| Liên quan | [260925-documentation-authority-unification/independent-frontier-rereview-2026-09-25.md](../260925-documentation-authority-unification/independent-frontier-rereview-2026-09-25.md) | Review lại. |
| Bối cảnh | [advice-260929-2345-doc-authority-harness-executor-routing.md](advice-260929-2345-doc-authority-harness-executor-routing.md) | Cách chạy plan này bằng harness fgOS: harness biểu đạt ý định ở sai tầng. |
| Bối cảnh | [advice-260930-1002-harness-flexibility-plan-agnostic-routing.md](advice-260930-1002-harness-flexibility-plan-agnostic-routing.md) | Chạy plan bất kỳ với đúng executor, model, tier, persona; plan này là case ứng dụng. |
| Bối cảnh | [prompt-261006-1533-resume-documentation-authority-unification.md](prompt-261006-1533-resume-documentation-authority-unification.md) | Prompt nối lại plan. |
| Bối cảnh | [prompt-261006-1652-orient-documentation-authority-unification.md](prompt-261006-1652-orient-documentation-authority-unification.md) | Prompt định hướng lại để biết chỗ tiếp tục. |

### H. Luật test (luồng TEST, máy thứ hai)

Luật test chi tiết thuộc luồng TEST; luồng này chỉ đưa luật tới đúng nơi và gỡ bản trùng.

| Mức | Tài liệu | Vấn đề chính |
|---|---|---|
| Chính | [counsel-261020-1658-test-suite-growth-rule.md](counsel-261020-1658-test-suite-growth-rule.md) | Bộ test không thừa mà không được quản: mọi luật hiện hành đẩy một chiều (thêm, giữ, không làm yếu); đề xuất luật tăng trưởng test. |
| Chính | [phase-lead-261020-1748-test-governance-rule-and-first-cleanup.md](phase-lead-261020-1748-test-governance-rule-and-first-cleanup.md) | Mảnh luật test, cơ chế đo, phase 0–1. |
| Liên quan | [261020-1757-test-governance-port-inventory-and-slow-file-extraction/plan.md](../261020-1757-test-governance-port-inventory-and-slow-file-extraction/plan.md) | Gỡ bản Node của case Rust đã sở hữu; mỗi cổng một test route. |

### I. Đưa chỉ dẫn vào agent và đo trên nhiều CLI (điểm inject)

Số đo thật về từng CLI. Đây là chỗ nhóm C2 của handoff nên bắt đầu.

| Mức | Tài liệu | Vấn đề chính |
|---|---|---|
| Chính | [research-261020-1612-mailbox-s0-human-input-and-peer-prompt-hooks.md](research-261020-1612-mailbox-s0-human-input-and-peer-prompt-hooks.md) | Đo hook "người gõ prompt": Claude và Codex có `UserPromptSubmit`; agy không có (sáu sự kiện tài liệu hoá); payload của peer không có trường nguồn. Chưa đo omp, pi. |
| Chính | [research-261020-1814-mailbox-instruction-and-injection-eval-v2.md](research-261020-1814-mailbox-instruction-and-injection-eval-v2.md) | Đo mức làm theo chỉ dẫn peer trên Claude, Codex, pi (N=20, 20, 10): hành vi khác nhau rõ giữa các CLI với cùng một chỉ dẫn. |
| Liên quan | [research-261020-1814-mailbox-component-authority-boundary-review.md](research-261020-1814-mailbox-component-authority-boundary-review.md) | Tri thức theo CLI bị chia đôi (adapters trong mailbox và profile terminal theo CLI trong agent-protocol); hook mức project làm cả worker pane cũng đăng ký. |
| Liên quan | [research-261014-2255-herdr-spawn-verbose-prompt-injection.md](research-261014-2255-herdr-spawn-verbose-prompt-injection.md) | Hai chế độ giao prompt, `simple` và `verbose`, trong `herdr-spawn`. |
| Liên quan | [261014-1710-herdr-inline-prompt-delivery/plan.md](../261014-1710-herdr-inline-prompt-delivery/plan.md) | Giao prompt inline hoặc con trỏ file cho claude, codex, agy, pi, omp dưới bwrap. |
| Liên quan | [debug-261018-2321-codex-inline-prompt-not-submitted.md](debug-261018-2321-codex-inline-prompt-not-submitted.md) | Codex 0.163 nuốt Enter khi gõ brief dài, còn `herdr agent prompt` (bracketed paste) 5/5: đường giao brief khác nhau theo CLI. |
| Liên quan | [distill-inventory-claudekit-engineer-orchestration-260825-1721-report.md](distill-inventory-claudekit-engineer-orchestration-260825-1721-report.md) | Kiểm kê hook, agent, rules của AgentKit upstream (11 managed hooks): nền cho phần "chỉ quan sát". |

### Ngoài `plans/`: nơi cần đối chiếu

| Nơi | Liên quan |
|---|---|
| [`docs/platform-foundations.md`](../../docs/platform-foundations.md) | Luật khoá L1–L10. |
| [`docs/specs/platform-foundations.md`](../../docs/specs/platform-foundations.md) | RUL11 (D-ADR0054), RUL104 (D-ADR0062), D-ADR0030, D-ADR0035 và phần Lịch sử quyết định. |
| [`docs/specs/distribution.md`](../../docs/specs/distribution.md) | RUL102: một owner duy nhất cho việc ghép instruction của agent (dòng 362). |
| [`docs/platform/proposals/documentation-system-unification.md`](../../docs/platform/proposals/documentation-system-unification.md) | §4.6 tầng giao luật và §4.7.2 Agent Context Engine. |
| [`docs/platform/intent-preservation-ledger.md`](../../docs/platform/intent-preservation-ledger.md) | PF-I007 "preserved future" cho Agent Context Engine. |
| [`docs/distribution-vision.md`](../../docs/distribution-vision.md) | Hướng cài đặt, setup, doctor; ghi đè project trên global. |
| [`docs/backlog.md`](../../docs/backlog.md) | Backlog `p-7eb9e65b`: fgOS và AgentKit ghi đè registration của nhau. |
| [`docs/decisions/index.md`](../../docs/decisions/index.md) | Bản chiếu sinh ra của quyết định (`fgos decision-index`). |
| [`docs/platform/agent-mailbox/spec.md`](../../docs/platform/agent-mailbox/spec.md) | Spec nháp mailbox: chèn instruction vào phiên agent (luồng MAIL). |
| [`core/instructions/decision-question.md`](../../core/instructions/decision-question.md) | Nguồn instruction hiện có. |
| [`core/instructions/design-principles.md`](../../core/instructions/design-principles.md) | Nguồn instruction hiện có; nguyên tắc 3 nói CLI là driver mỏng. |
| [`core/instructions/platform-laws.md`](../../core/instructions/platform-laws.md) | Nguồn instruction hiện có. |
| [`core/skills/_shared/decision-question.md`](../../core/skills/_shared/decision-question.md) | Mẫu câu hỏi quyết định đầy đủ. |
| [`src/setup/instruction-registry.mjs`](../../src/setup/instruction-registry.mjs) | Schema đơn vị instruction. |
| [`src/setup/instruction-composition.mjs`](../../src/setup/instruction-composition.mjs) | Bộ ghép tập instruction hiệu lực. |
| [`src/setup/instruction-projections.mjs`](../../src/setup/instruction-projections.mjs) | Phần render ra host. |
| [`.claude/skills/instruction-audit/SKILL.md`](../../.claude/skills/instruction-audit/SKILL.md) | Skill soát bề mặt instruction. |

### Đã xét và loại

Các tài liệu này trùng từ khoá nhưng không phải về luật hay instruction cho agent.

| Tài liệu | Lý do loại |
|---|---|
| [research-261020-0955-seat-binding-needs-and-mechanisms-inventory.md](research-261020-0955-seat-binding-needs-and-mechanisms-inventory.md) | "luật" ở đây là luật chọn ghế và tier khi định tuyến, không phải luật cho agent. |
| [260930-0445-tier-rigor-vocabulary-consolidation/plan.md](../260930-0445-tier-rigor-vocabulary-consolidation/plan.md) | gom thang cấu hình tier và rigor, không phải instruction. |
| [261001-0327-request-to-run-track/red-team-scope-complexity-critic.md](../261001-0327-request-to-run-track/reports/red-team-scope-complexity-critic.md) | dùng RUL11 làm thước chấm plan, không bàn về việc tối ưu luật. |
| [git-lessons-sweep-261017/sweep3-tests-redo.md](git-lessons-sweep-261017/sweep3-tests-redo.md) | kiểm kê test Git, trùng từ khoá "rule" và "instruction" ngẫu nhiên. |
| [design-261016-1220-lock-and-run-supervisor-foundation-v3-r5.md](design-261016-1220-lock-and-run-supervisor-foundation-v3-r5.md) | "luật" là luật thiết kế của holder-lock, cùng loạt r1–r6. |
| [audit-260905-1636-fgos-code-panel-quality-audit.md](audit-260905-1636-fgos-code-panel-quality-audit.md) | chất lượng code của một crate. |
| [tsk-34y-260729-1735-test-assertion-shape-consolidation-report.md](tsk-34y-260729-1735-test-assertion-shape-consolidation-report.md) | gom trùng assertion trong test, không phải luật. |

## Bước tiếp theo

1. Thêm bốn nguồn quan trọng nhất vào mục 2 của handoff (đã làm trong cùng lượt này): cuộc điều tra harness 10-06, hai báo cáo đo hook và chỉ dẫn theo CLI, và các cơ chế tiền lệ.
2. Nhóm A của handoff dùng `archaeologist-261006` làm điểm xuất phát cho việc phân loại sở hữu thay vì kiểm lại từ đầu.
3. Nhóm C2 bắt đầu từ `research-261020-1612`: đo bổ sung omp và pi, và cập nhật với bản Claude, Codex, agy mới nhất.

## Câu hỏi chưa giải quyết

- Có cần quét thêm `docs/history/` và `docs/journals/` không? Em chưa quét hai nơi này.
- Plan `260919-coordination-skill-harness-simplification` được `architecture-advisory-260926-1322` nhắc tới nhưng không còn dưới `plans/`; có thể đã lưu trữ hoặc đổi tên. Em chưa tìm ra.
- Các tài liệu mức Liên quan trong nhóm F và G chỉ được phân loại qua phần tóm tắt đầu file. Anh muốn em đọc trọn nhóm nào trước khi giao cho người làm nhóm B?
