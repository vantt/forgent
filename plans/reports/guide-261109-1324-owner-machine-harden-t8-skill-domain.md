# Hướng dẫn cho máy owner: làm cứng Skill và Domain (T8, phase 01 đến 12 và phần đóng)

Hướng dẫn này cho máy owner và máy thứ ba (forgentX, fg-server). fg-server2 tự land từng phase của T8 (quyết định 79). Tầng T8 đã đóng; một lượt làm theo hướng dẫn này đưa máy lên đúng trạng thái đã land, vì mọi phase đều chỉ đổi mã, văn bản skill và một dòng cấu hình của repo.

Plan: [`plans/261109-1304-harden-t8-skill-domain`](../261109-1304-harden-t8-skill-domain/plan.md). Báo cáo đóng, có số đo và các việc còn mở: [`closing-261109-1752-harden-t8-skill-domain.md`](closing-261109-1752-harden-t8-skill-domain.md).

## T8 làm gì, trong năm câu

1. `npm run build:skills` và `fgos setup` chỉ ghi tên skill do fgOS sở hữu; thư mục skill của bộ khác (ví dụ `ak-*`) không còn bị viết lại.
2. Hai thứ từ chối trước khi ghi: thư mục cùng tên skill của fgOS nhưng không có dấu "generated", và mọi symbolic link trong đường dẫn skill. Render chạy lần hai không ghi gì.
3. Thư mục `.claude/skills/<tên>` chỉ còn `SKILL.md`; worktree mới nhận mọi thư mục skill git-ignore của checkout chính, không ghi cứng tên bộ nào.
4. Ba dòng doctor (`agent-claims-resolve`, `executor-skills-installed`, `domain-registry-compiled`) phán đúng tập skill và domain; id và số dòng không đổi. Hai bộ canh của test (`fgos-mirror` và canh trích dẫn) chỉ xét tên skill do fgOS sở hữu, nên thư mục `ak-*` không còn làm chúng đỏ.
5. Mã chết bị xoá: bộ sinh Gemini, 88 test của nó, script đo coordination, hai fragment dùng chung không ai gọi, tên skill cũ `fgos-coding-compounding`.

## Lưu ý chung

- Không đổi schema `~/.fgos/config.json`; không cần kích hoạt đồng loạt mọi máy. Mỗi mục dưới có quay lại riêng; khi nhiều phase đã chồng lên nhau thì sửa tiến, đừng revert từng phase.
- Id release chạy trên fg-server2 trước T8 phase 06 (để quay lại): `sha256:fabc22ddd83d75710e0bcd574fd78987465845c1b18784c5e7ec3ed1b7496ada`. Bản phát hành có T8 chưa được kích hoạt tại lúc viết; người vận hành build, stage và kích hoạt từ main, rồi ghi id vào board.
- Ba commit của "landing unit" (văn bản skill, distill, render) phải đi cùng nhau vì phép thử drift của `skill-wrappers.test.mjs` so nguồn skill với bản render; không cherry-pick riêng.

## Làm một lần trên mỗi máy

1. **Kéo mã.** `git pull --autostash` (máy có sửa cục bộ `.fgos/config.yaml`: máy owner, fg-server; hoặc `git stash`, `git pull`, `git stash pop`). Không dùng `git reset`. Sau đó kiểm tra các dòng cục bộ của file vẫn còn.
2. **Build, stage, kích hoạt release** như thường lệ (forgentX; `~/projects/forgent` trên fg-server).
3. **Kiểm tra.**
   - `fgos doctor </dev/null`: không có dòng mới, id và số dòng không đổi; `agent-claims-resolve`, `executor-skills-installed`, `domain-registry-compiled` xanh.
   - Trên checkout nguồn của fgOS: `npm run build:skills` hai lần liên tiếp; lần hai không đổi file nào (`git status` sạch sau cả hai lần). `node scripts/build-domain-registry.mjs --check` thoát mã 0.
   - Tạo một worktree thử: `fgos worktree create <đường dẫn> --detach` rồi `ls <đường dẫn>/.claude/skills`: thấy mọi thư mục skill của bộ khác mà checkout chính đang git-ignore; chạy lại không sinh thư mục lồng nhau.
4. **Dòng `worktreeSetup` cũ.** Commit đã xoá dòng chép `ak-*` khỏi `.fgos/config.yaml` của repo. Máy có sửa cục bộ file này và sau `pull --autostash` vẫn thấy dòng đó thì xoá tay: nó chỉ chép lại đúng các thư mục đã chép (chậm thêm khoảng 3,7 đến 4,4 giây mỗi worktree, không gây hại).

## Thay đổi trên đĩa và hành vi

| Thay đổi | Phase | Bản cũ có đọc được không |
|---|---|---|
| `fgos setup` và render từ chối, nêu tên, một thư mục skill trùng tên skill fgOS nhưng không có dấu generated; từ chối mọi symbolic link trong đường dẫn skill | P02 | Không áp dụng (từ chối lúc ghi); bản cũ vẫn ghi đè |
| Render xoá file nguồn không còn trong thư mục skill của fgOS và thư mục `fgos-*` của plugin không còn nguồn | P02 | Có (cùng cây, ít file hơn) |
| Không còn bộ sinh Gemini, không còn tuỳ chọn `checkDuplicates` / `checkCollisions` | P01 | Không áp dụng (chưa từng có nơi gọi) |
| `.claude/skills/<tên>/references/*` và file anh em bị xoá | P03, P12 | Có: wrapper trỏ vào `.agents/skills`; bản cũ tự sinh lại bản sao |
| `.claude/skills/instruction-audit` được git theo dõi | P04, P12 | Có |
| Worktree mới chép mọi thư mục skill git-ignore của checkout chính, thay cho dòng `ak-*` | P10 | Có (dòng cấu hình cũ chạy được, chỉ chậm hơn) |
| Ba dòng doctor phán chặt hơn; id và số dòng không đổi | P06, P08 | Có |
| `domains/coding/AGENTS.md` mất khối GitNexus cũ | P05 | Có |

## Theo phase

### Render chỉ ghi tên skill do fgOS sở hữu (trước các phase, commit `6f98ce04a`)

- **Người dùng thấy gì:** `fgos setup` và `npm run build:skills` ghi đúng các tên skill do fgOS lắp từ nguồn của chính nó (`ownedSkillNames`), nên mọi `ak-*` dưới `.agents/skills`, `.claude/skills` hay `plugins/fgOS/skills` giữ nguyên từng byte. `build:skills` stage addon và kiểm bước instruction projection trước khi ghi byte đầu tiên, thay vì thoát mã 1 sau khi đã ghi đè.
- **Lệnh:** `git pull --autostash`; build, stage, kích hoạt release như thường lệ.
- **Quay lại:** revert commit; kích hoạt lại release trước.

### P01: xoá bộ sinh Gemini và test của mã đã chết

- **Commit trên main:** `381b18296` (test), `4f2535874` (mã).
- **Người dùng thấy gì:** không đổi hành vi. 88 test của mô hình tham chiếu skill đã xoá từ 2026-10-01 và của bộ sinh Gemini bị gỡ (132 xuống 44 test; file test 3 862 xuống 806 dòng), bộ sinh gói Gemini, bộ phân loại adapter và hai tuỳ chọn không làm gì bị xoá (`skill-wrappers.mjs` 1 410 xuống 759 dòng). Hợp đồng packaging và bảng alignment ghi "Gemini: không cung cấp".
- **Lệnh:** `git pull --autostash`; không cần kích hoạt release.
- **Quay lại:** revert hai commit.

### P02: render và setup không đi theo link, từ chối thư mục không phải của fgOS, render là điểm bất động

- **Commit trên main:** `f00e9de5e` (xem dòng board "T8 P02 lands").
- **Người dùng thấy gì:**
  - `fgos setup` và `npm run build:skills` từ chối, nêu tên thư mục và trước khi ghi bất cứ thứ gì, khi một thư mục skill trùng tên skill của fgOS nhưng không mang dấu "generated" của fgOS (thư mục rỗng thì vẫn ghi). Cách xử lý: xoá thư mục đó hoặc đổi tên skill kia. Thư mục `.agents/skills/<tên>` do bản phát hành cũ chép nguyên văn vẫn được nhận nếu wrapper `.claude/skills/<tên>` cạnh nó mang dấu của fgOS.
  - Một symbolic link trong đường dẫn nguồn hoặc đích của skill bị từ chối, nêu tên đường dẫn; không có byte nào ghi ra ngoài thư mục gốc.
  - Render xoá file mà nguồn không còn trong thư mục skill của fgOS, và xoá bản `fgos-*` trong `plugins/fgOS/skills` khi skill nguồn đã mất; lần render thứ hai trên cây không đổi không ghi gì. Skill viết tay của plugin không bị đụng.
  - Dấu "generated" phải là dòng đầu sau frontmatter; một skill ngoài chỉ trích dẫn dấu ở giữa nội dung không còn bị dọn.
  - `fgos setup` chỉ chép skill thuộc chính gói; skill của gói trùng tên skill lõi của dự án đích không đè lên nó.
- **Lệnh:** `git pull --autostash`; build, stage, kích hoạt release như thường lệ. Dự án đã có thư mục `.agents/skills/<tên fgOS>` hoặc `.claude/skills/<tên fgOS>` do người viết tay sẽ bị từ chối ở lần `fgos setup` kế tiếp: đổi tên hoặc xoá.
- **Doctor mong đợi:** không đổi.
- **Quay lại:** revert commit; không có file nào trên đĩa đổi định dạng.

### P03: thư mục wrapper `.claude/skills/<tên>` chỉ còn `SKILL.md`

- **Commit trên main:** `593be681c` (xem dòng board "T8 P03 lands").
- **Phép thử trước khi làm** (`plans/reports/research-261109-1317-harden-t8-reference-copy-probe.md`), nói bằng lời thường: một seat Claude chạy chỉ-đọc trong một worktree đã xoá thư mục `references/` bên cạnh wrapper `fgos-fanout`; nó mở wrapper, đi theo dòng chuyển hướng sang `.agents/skills/fgos-fanout/SKILL.md`, rồi mở tệp tham chiếu ở đó và đọc được tiêu đề; worktree đối chứng còn bản sao cũng mở đúng ba tệp ấy. Kết quả đạt, nên bản sao thừa. Giới hạn: một skill, một kiểu seat, danh sách tệp đã mở là báo cáo của chính seat.
- **Người dùng thấy gì:** render không còn chép `references/`, `scripts/` và file anh em khác vào `.claude/skills/<tên>/`; 29 file bản sao (3 393 dòng, gồm cả bản sao `scripts/` và `CREATION-LOG.md` của `distill`) bị xoá khỏi git. Lệnh `distill` chạy từ `.agents/skills/distill/scripts/distill.mjs` (đã kiểm). Lần render hoặc `fgos setup` kế tiếp xoá bản sao cũ còn sót trên máy.
- **Lệnh:** `git pull --autostash`; build, stage, kích hoạt release như thường lệ.
- **Doctor mong đợi:** không đổi.
- **Quay lại:** revert commit; một lần render sinh lại các bản sao.

### P04: bộ canh bản render skill và canh trích dẫn

- **Commit trên main:** `7bd1b5998..818ffd7aa` (mã `f6688d5be`).
- **Người dùng thấy gì:** không đổi hành vi của `fgos`. Test `fgos-mirror` so mọi skill fgOS sở hữu (`distill`, `instruction-audit`, `fgos-*`), không chỉ `fgos-*`; có thêm một test kiểm `.gitignore` allowlist khớp đúng tập skill nguồn. `.gitignore` thêm dòng `!/.claude/skills/instruction-audit/`, nên bản render `.claude` của `instruction-audit` được git theo dõi. Quét trích dẫn rộng (`fgos decision --relation`) không còn đọc `.agents/skills` (104 thư mục, 19 MB); 59 mục baseline của cây này đã bỏ vì có bản sao byte-giống dưới `plugins/fgOS/skills`.
- **Lệnh:** chỉ các lệnh chung ở trên.
- **Doctor mong đợi:** `decision-citation-drift` vẫn đạt (`no new findings`).
- **Quay lại:** revert merge commit.

### P05, P09 (distill) và P12: văn bản skill, tên skill cũ và một lần render ("landing unit")

- **Commit trên main:** `adb9cc204`, `c8325c203`, `1e14daec0` (ba commit liền nhau, đẩy một lần; dòng board "T8 landing unit lands"). Ba commit phải đi cùng nhau vì phép thử drift của `skill-wrappers.test.mjs` so nguồn skill với bản render.
- **Người dùng thấy gì:**
  - `fgos-routing` bảo agent đọc doctrine `domains/<domain>/AGENTS.md` từ payload fgOS đang chạy, không đọc từ project; tên skill đã gỡ `fgos-coding-compounding` được thay bằng `fgos-coding-knowledge` trong text skill và task-spec; khối GitNexus cũ và đoạn an toàn lặp bị bỏ khỏi `domains/coding/AGENTS.md`; hai fragment dùng chung không ai gọi bị xoá.
  - `distill` từ chối tên nguồn hoặc url thoát ra ngoài vùng learning (kiểm lại bằng một lần chạy thử: bản cũ ghi file `escaped-*.md` ra ngoài vùng; bản mới từ chối và nêu tên).
  - Render một lần: `.agents/skills`, `.claude/skills` và `plugins/fgOS/skills` được sinh lại; `.claude/skills/instruction-audit/SKILL.md` lần đầu được git theo dõi; census đã sinh lại (0 undeclared). `fgos-mirror` thêm một phép thử: mỗi skill fgOS sở hữu có bản render được theo dõi ở `.agents` và `.claude`.
- **Lệnh:** `git pull --autostash`; build, stage, kích hoạt release như thường lệ; `fgos doctor`. Lần `npm run build:skills` thứ hai không ghi gì.
- **Doctor mong đợi:** không đổi.
- **Quay lại:** revert ba commit trong một lần revert, rồi kích hoạt lại release trước đó.

### P09 (phần còn lại): script chết và ghi AGENTS.md bền

- **Commit trên main:** `63a861af4` (xoá `scripts/measure-coordination-baseline.mjs` cùng hai dòng của bộ liệt kê và dòng census), `19d3a9fc3` (ghi `AGENTS.md` của repo qua cửa ghi bền, giữ nguyên chế độ file).
- **Người dùng thấy gì:** script đo coordination không chạy được từ khi engine replay biến mất, nay đã xoá. Bước instruction projection ghi `AGENTS.md` qua cửa ghi bền nên mất điện giữa chừng không để lại file cụt.
- **Lệnh:** `git pull --autostash`; không cần kích hoạt release.
- **Quay lại:** revert commit.
- **Chưa làm:** từ chối ghi tập instruction hiệu lực lên một đường dẫn skip-worktree. Cửa đọc Git (Inspect) không báo cờ này; không thêm lệnh cho cổng (RUL104); đã mở mục backlog cho OPC (`p-ojh4dcf6f2`). Phía gỡ worktree đã chấp nhận file giống byte, nên không còn worktree bị kẹt.

### P06: dòng doctor `agent-claims-resolve` và `executor-skills-installed`

- **Commit trên main:** `9309685c0..688850394`.
- **Người dùng thấy gì:**
  - `fgos doctor` dòng `agent-claims-resolve` nghiêm hơn: một khai báo `requires-skill` của task-spec chỉ qua khi **cả hai** điều kiện đúng: có agent cung cấp skill đó **và** tên là skill fgOS sở hữu (nguồn trong `core/skills` hoặc `domains/<domain>/skills`). Thông báo nêu rõ phía nào hỏng.
  - Dòng `executor-skills-installed` nhận thư mục skill ở cấp người dùng (`~/.claude/skills`, `~/.agents/skills` cho Claude và Codex) ngoài cấp dự án. File `SKILL.md` rỗng bị từ chối. Thông báo nói rõ worktree chỉ có skill nhờ bước cấp skill của worktree, nên qua ở checkout chính chưa chắc qua trong worktree (câu chữ còn nhắc `worktreeSetup`, đã mở mục backlog `p-bv4xcs2xdl` để sửa cho khớp P10).
  - Ba tên cũ của skill đã đổi tên (`fgos-coding-compounding` thành `fgos-coding-knowledge`) trong task-spec `compound-learn` và hai agent (`docs-manager`, `fgos-placeholder`) được sửa; dòng doctor mới chính là thứ phát hiện ra chúng.
  - Số dòng doctor và id các dòng không đổi.
- **Lệnh:** `git pull --autostash`; build, stage, kích hoạt release như thường lệ; `fgos doctor </dev/null`.
- **Doctor mong đợi:** không có dòng mới. Dự án nào có task-spec riêng khai `requires-skill` cho tên không phải skill fgOS sở hữu sẽ thấy `agent-claims-resolve` đỏ: sửa tên trong task-spec hoặc thêm skill.
- **Quay lại:** revert commit merge của phase; hai dòng doctor trở lại phán yếu hơn. Không có dữ liệu trên đĩa bị đổi.

### P07: `scripts/project-agents.mjs` không ghi đè agent không phải do nó sinh

- **Commit trên main:** `d06e7b393`.
- **Người dùng thấy gì:**
  - Script chạy tay này (nguồn duy nhất của bốn agent sinh `council-*` và `fgos-placeholder` trong `.claude/agents/`) lấy tên file đầu ra từ tên file nguồn; khai `name:` khác tên file bị từ chối; giá trị có xuống dòng trong frontmatter bị từ chối, nêu rõ trường và file.
  - File đích đã có mà không mang dòng "Generated by `scripts/project-agents.mjs`" (sáu agent AgentKit trùng tên: `code-reviewer`, `debugger`, `docs-manager`, `fullstack-developer`, `planner`, `researcher`) bị bỏ qua, in tên ra stderr, script thoát mã 1; mọi file còn lại vẫn được ghi.
  - Không có lệnh package mới; không có thay đổi trên đĩa nếu không chạy script. Lần chạy thật kế tiếp sẽ bỏ dòng `model: sonnet` còn sót trong các `council-*.md` đã theo dõi (bộ sinh đã lâu không phát ra dòng này).
- **Lệnh:** `git pull --autostash`; không cần kích hoạt release.
- **Quay lại:** revert commit.

### P08: một phép kiểm cho domain đã biên dịch

- **Commit trên main:** `3aa200966` (trước đó `d1d5156a0`).
- **Người dùng thấy gì:**
  - `fgos doctor` dòng `domain-registry-compiled` và `npm run build:domains -- --check` dùng chung một hàm `checkCompiledDomains`, nên hai nơi luôn báo cùng một tập lỗi.
  - Một `domains/<tên>/compiled.json` mà thư mục không còn `registry.yaml` (domain mồ côi) giờ bị báo đỏ, nêu tên domain. Trước đây không ai xét.
  - Hai file workflow cùng khoá (`x.yaml` và `x.yml`) làm bước build lỗi, nêu cả hai file, thay vì âm thầm lấy file sau.
  - `compiled.json` phải khớp từng byte với bản biên dịch từ YAML (trước đây dòng doctor chỉ so nội dung JSON); build luôn ghi đúng định dạng nên không ảnh hưởng ai dùng `npm run build:domains`.
- **Lệnh:** `git pull --autostash`; build, stage, kích hoạt release như thường lệ; `fgos doctor </dev/null`; `node scripts/build-domain-registry.mjs --check`.
- **Doctor mong đợi:** `domain-registry-compiled` xanh. Dự án nào có `compiled.json` mồ côi hoặc sửa tay thì thấy đỏ: xoá file mồ côi hoặc chạy `npm run build:domains`.
- **Quay lại:** revert commit merge của phase. Không có dữ liệu trên đĩa bị đổi.

### P10: worktree mới nhận mọi thư mục skill bị git bỏ qua của checkout chính

- **Commit trên main:** `4c40941a1..95ed05914` (mã `4c40941a1`, cấu hình `95ed05914`).
- **Người dùng thấy gì:**
  - Worktree mới tự nhận, dưới `.claude/skills`, `.agents/skills`, `.omp/skills`, `.pi/skills`, `.grok/skills`, mọi thư mục mà checkout chính đang git-ignore (bất kể bộ skill nào, không tên nào được ghi cứng). Skill của fgOS do git theo dõi nên không bị chép đè. Link không bị đi theo. Chạy lại không chép thêm.
  - Chép thật, không hardlink, nói bằng lời thường: phép thử ghi thêm vào file qua hardlink thì file ở checkout chính cũng đổi theo (ghi kiểu thay thế thì không, nhưng worker không kiểm soát được kiểu ghi); chép chéo ổ đĩa bằng hardlink thì lỗi `EXDEV`. Vì vậy mỗi worktree vẫn chiếm chỗ cho các thư mục skill lạ của máy đó (máy này: 525 thư mục, 8 763 file, 89 MB).
  - Bước chép đo trực tiếp: 0,4 đến 1,5 giây (dòng shell cũ: 3,7 đến 4,4 giây).
  - Chép lỗi thì việc tạo worktree dừng và báo tên thư mục skill (worktree thiếu skill là worktree hỏng); phần đã chép được thu hồi khi gỡ worktree.
- **Dòng cấu hình:** dòng `worktreeSetup` chép `ak-*` trong `.fgos/config.yaml` của repo đã bị xoá (6 dòng). Máy nào có sửa cục bộ file này: xem bước "Dòng `worktreeSetup` cũ" ở phần làm một lần. **Máy áp dụng:** mọi máy kéo bản này; không ai phải thêm dòng mới.
- **Lệnh:** `git pull --autostash`; build, stage, kích hoạt release (mã `provisionSkillRoots` nằm trong release).
- **Doctor mong đợi:** không có dòng mới.
- **Quay lại:** revert commit; worktree đã tạo giữ nguyên bản chép của nó.

### P11: một cửa `listDomainDirs` cho danh sách thư mục domain

- **Commit trên main:** `d6cc9ab76`.
- **Người dùng thấy gì:** không đổi hành vi. `src/util/domain-dirs.mjs` trả tên các thư mục domain dưới `domains/` đã sắp xếp (bỏ file và link; thư mục vắng thì danh sách rỗng); các lần đọc `domains/` rải rác trong setup, runner, workflow và scripts nay gọi cửa này. Nơi trước đây đọc theo thứ tự thư mục (đăng ký instruction, dựng skill, kiểm tra task-spec) nay có thứ tự ổn định.
- **Còn lại:** `src/state/domain-registry.mjs` của WORK vẫn tự lặp, đã mở mục backlog `p-bxahsop7em`.
- **Lệnh:** `git pull --autostash`; build, stage, kích hoạt release như thường lệ.
- **Doctor mong đợi:** không đổi.
- **Quay lại:** revert commit.

## Phần đóng (phase 13): spec, số đo, việc còn mở

- Luật và bằng chứng của T8 đã vào hai tài liệu sở hữu tầng này: mục 3.1 của `docs/platform/packaging-distribution/contracts/skill-package-distribution.md` (render, tên sở hữu, từ chối, điểm bất động, wrapper chỉ còn `SKILL.md` kèm phép thử, worktree không biết tên bộ nào) và mục 14 của `docs/platform/domainization/architecture/domainization.md` (doctrine đọc từ payload, một danh sách domain, `compiled.json` bằng bản biên dịch). Câu chuyện quyết định nằm ở mục "Lịch sử quyết định" của `docs/platform/packaging-distribution/spec.md`.
- Giới hạn còn nói thẳng: một thư mục lạ mang đúng dấu "generated" của fgOS vẫn bị coi là của fgOS; việc nghỉ hưu `fgos setup` (T9) gỡ bề mặt này.
- Số đo và các mục chưa đạt (tốc độ test của 18 file thuộc T8 so với ngân sách, `project-agents.mjs` vượt ngân sách dòng) nằm trong báo cáo đóng.
- Việc dành cho từng chủ: backlog `p-vcoaluq6ix` (OPC, census), `p-tgqxcemygh` (Packaging, nghỉ hưu `fgos setup` và danh sách `files`), `p-ojh4dcf6f2` (OPC, cờ skip-worktree), `p-bv4xcs2xdl` (câu chữ doctor), `p-g7yn3j7q4x` (WORK và COOK), `p-bxahsop7em` (WORK, `loadDomainsFromDisk`).
- **Quay lại cả tầng:** revert theo thứ tự ngược (P12, P05, P11, P10, P03, P02, P01) nhiều commit rất dễ xung đột census; nếu cần, sửa tiến bằng commit mới và regenerate census bằng `node scripts/git-one-door-scan.mjs --root . --write-census`. Sau revert, kích hoạt lại release trước đó (id ở đầu hướng dẫn) và ghi SHA revert lên board.
