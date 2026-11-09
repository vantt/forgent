# Hướng dẫn cho máy owner: làm cứng Skill và Domain, T8

Hướng dẫn này cho máy owner và máy thứ ba (forgentX, fg-server). fg-server2 tự land từng phase của T8 (quyết định 79). Mỗi phase đã land có một mục bên dưới, xếp theo số phase. Plan: [`plans/261109-1304-harden-t8-skill-domain`](../261109-1304-harden-t8-skill-domain/plan.md).

## Lưu ý chung

- Không đổi schema `~/.fgos/config.json`; không cần kích hoạt đồng loạt mọi máy.
- Id release đang chạy trên fg-server2 trước T8 phase 06: `sha256:fabc22ddd83d75710e0bcd574fd78987465845c1b18784c5e7ec3ed1b7496ada`. Rollback = kích hoạt lại id này.
- Các mục dưới ghi commit sau khi land; mục nào chưa có commit thì phase chưa land.

## P06: dòng doctor `agent-claims-resolve` và `executor-skills-installed`

- **Commit trên main:** `9309685c0..688850394`.
- **Người dùng thấy gì:**
  - `fgos doctor` dòng `agent-claims-resolve` nghiêm hơn: một khai báo `requires-skill` của task-spec chỉ qua khi **cả hai** điều kiện đúng: có agent cung cấp skill đó **và** tên là skill fgOS sở hữu (nguồn trong `core/skills` hoặc `domains/<domain>/skills`). Thông báo nêu rõ phía nào hỏng.
  - Dòng `executor-skills-installed` nhận thư mục skill ở cấp người dùng (`~/.claude/skills`, `~/.agents/skills` cho Claude và Codex) ngoài cấp dự án. File `SKILL.md` rỗng bị từ chối. Thông báo nói rõ worktree chỉ có skill nhờ `worktreeSetup`, nên qua ở checkout chính chưa chắc qua trong worktree.
  - Ba tên cũ của skill đã đổi tên (`fgos-coding-compounding` thành `fgos-coding-knowledge`) trong task-spec `compound-learn` và hai agent (`docs-manager`, `fgos-placeholder`) được sửa; dòng doctor mới chính là thứ phát hiện ra chúng.
  - Số dòng doctor và id các dòng không đổi.
- **Lệnh trên từng workspace:** `git pull --rebase`; build, stage, kích hoạt release như thường lệ; `fgos doctor </dev/null`.
- **Doctor mong đợi:** không có dòng mới. Dự án nào có task-spec riêng khai `requires-skill` cho tên không phải skill fgOS sở hữu sẽ thấy `agent-claims-resolve` đỏ: sửa tên trong task-spec hoặc thêm skill.
- **Quay lại:** revert commit merge của phase; hai dòng doctor trở lại phán yếu hơn. Không có dữ liệu trên đĩa bị đổi.

## P10: worktree mới nhận mọi thư mục skill bị git bỏ qua của checkout chính

- **Commit trên main:** `4c40941a1..95ed05914` (mã `4c40941a1`, config `95ed05914`).
- **Người dùng thấy gì:**
  - Worktree mới tự nhận, dưới `.claude/skills`, `.agents/skills`, `.omp/skills`, `.pi/skills`, `.grok/skills`, mọi thư mục mà checkout chính đang git-ignore (bất kể bộ skill nào, không tên nào được ghi cứng). Skill của fgOS do git theo dõi nên không bị chép đè. Link không bị đi theo. Chạy lại không chép thêm. Chép thật, không hardlink (ghi vào file qua hardlink sẽ đổi file ở checkout chính).
  - Dòng `worktreeSetup` chép `ak-*` trong `.fgos/config.yaml` của repo này bị xoá. Mỗi worktree vẫn chép khoảng 90 MB, 8 800 file, đo được 1,6 giây (dòng cũ 3,7 đến 4,4 giây).
  - Chép lỗi thì việc tạo worktree dừng và báo tên thư mục skill (worktree thiếu skill là worktree hỏng); phần đã chép được thu hồi khi gỡ worktree.
- **Lệnh trên từng workspace:** máy có sửa cục bộ `.fgos/config.yaml` (máy owner, fg-server) kéo bằng `git pull --autostash` (hoặc `git stash`, `git pull`, `git stash pop`); không dùng `git reset`. Sau đó kiểm tra các dòng cục bộ của file vẫn còn.
- **Doctor mong đợi:** không có dòng mới.
- **Quay lại:** revert commit; worktree đã tạo giữ nguyên bản chép của nó.

## P04: bộ canh bản render skill và canh trích dẫn

- Commit trên `main`: `7bd1b5998..818ffd7aa`.
- Người dùng thấy gì: không đổi hành vi của `fgos`. Test `fgos-mirror` giờ so mọi skill fgOS sở hữu (`distill`, `instruction-audit`, `fgos-*`), không chỉ `fgos-*`; có thêm một test kiểm `.gitignore` allowlist khớp đúng tập skill nguồn. `.gitignore` thêm dòng `!/.claude/skills/instruction-audit/`, nên bản render `.claude` của `instruction-audit` (do phase render sau này tạo) sẽ được git theo dõi. Quét trích dẫn rộng (`fgos decision --relation`) không còn đọc `.agents/skills` (104 thư mục, 19 MB); 59 mục baseline của cây này đã bỏ vì có bản sao byte-giống dưới `plugins/fgOS/skills`.
- Lệnh: chỉ các lệnh chung ở trên. Không có cấu hình mới, không đổi `~/.fgos/config.json`.
- Dòng doctor mong đợi: `decision-citation-drift` vẫn đạt (`no new findings`). Không có dòng doctor mới.
- Quay lại: revert merge commit trên `main`, kích hoạt lại release trước đó ở trên, ghi SHA revert lên bảng.

## P08: một phép kiểm cho domain đã biên dịch

- **Commit trên main:** `3aa200966` (trước đó `d1d5156a0`).
- **Người dùng thấy gì:**
  - `fgos doctor` dòng `domain-registry-compiled` và `npm run build:domains -- --check` dùng chung một hàm `checkCompiledDomains`, nên hai nơi luôn báo cùng một tập lỗi.
  - Một `domains/<tên>/compiled.json` mà thư mục không còn `registry.yaml` (domain mồ côi) giờ bị báo đỏ, nêu tên domain. Trước đây không ai xét.
  - Hai file workflow cùng khoá (`x.yaml` và `x.yml`) làm bước build lỗi, nêu cả hai file, thay vì âm thầm lấy file sau.
  - `compiled.json` phải khớp từng byte với bản biên dịch từ YAML (trước đây dòng doctor chỉ so nội dung JSON); build luôn ghi đúng định dạng nên không ảnh hưởng ai dùng `npm run build:domains`.
  - Số dòng doctor và id dòng không đổi.
- **Lệnh trên từng workspace:** `git pull --rebase`; build, stage, kích hoạt release như thường lệ; `fgos doctor </dev/null`; `node scripts/build-domain-registry.mjs --check`.
- **Doctor mong đợi:** `domain-registry-compiled` xanh. Dự án nào có `compiled.json` mồ côi hoặc sửa tay thì thấy đỏ: xoá file mồ côi hoặc chạy `npm run build:domains`.
- **Quay lại:** revert commit merge của phase; dòng doctor và `--check` trở lại phán như cũ. Không có dữ liệu trên đĩa bị đổi.

## P07: `scripts/project-agents.mjs` không ghi đè agent không phải do nó sinh

- **Commit trên main:** xem dải trên board dòng `HARDEN: T8 P07 lands`.
- **Người dùng thấy gì:**
  - Script chạy tay này (nguồn duy nhất của bốn agent sinh `council-*` và `fgos-placeholder` trong `.claude/agents/`) lấy tên file đầu ra từ tên file nguồn; khai `name:` khác tên file bị từ chối; giá trị có xuống dòng trong frontmatter bị từ chối, nêu rõ trường và file.
  - File đích đã có mà không mang dòng "Generated by `scripts/project-agents.mjs`" (sáu agent AgentKit trùng tên: `code-reviewer`, `debugger`, `docs-manager`, `fullstack-developer`, `planner`, `researcher`) bị bỏ qua, in tên ra stderr, script thoát mã 1; mọi file còn lại vẫn được ghi.
  - Không có lệnh package mới; không có thay đổi trên đĩa nếu không chạy script.
- **Lệnh trên từng workspace:** `git pull --rebase`; không cần kích hoạt release.
- **Doctor mong đợi:** không đổi.
- **Quay lại:** revert commit merge của phase.

