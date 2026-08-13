# Discussion — install/setup reliability for external projects (tsk-2qc)

## 1. Trạng thái hiện tại

Round 3. D1 (2 trục độc lập bin/skill) và D2 (bin resolution = 3 tầng
deterministic, project-local giữ lại vì lý do version-pinning/team-
consistency, không dùng PATH cho tầng 1-2) đã khoá — xem §6 cho bản đồ +
diagram cập nhật. Câu hỏi hướng sửa root cause #1 giờ thu hẹp: chỉ còn
tầng 3 (global) cần quyết probe-nhiều-tầng vs cache-in-config. Root cause
#2 (marketplace fail-open) vẫn mở nguyên như cũ.

## 2. Mục tiêu & đề bài

`fgos setup`/`fgos doctor` hiện chỉ thật sự được luyện (dogfood) trong
context tự-host của chính forgentX — nơi `bin/fgos.mjs` luôn có sẵn tại
cwd nên phần lớn logic PATH-lookup không bao giờ thực sự bị exercise.
Với một project bên ngoài đi đúng con đường cài đặt được document
(`npm install -g github:vantt/forgent`, rồi cài fgOS Claude Code plugin),
hai mảnh hạ tầng lẽ ra phải tự-verify/tự-fix — tìm ra bin `fgos` toàn cục,
và đăng ký Claude Code plugin marketplace để có skill — đều có đường fail
âm thầm: không báo lỗi, không tự sửa, và không có gì nhắc người dùng biết
để chạy lại. Kết quả quan sát được: project khác "luôn không tìm ra skill
hoặc không tìm ra bin". Mục tiêu của item này là thiết kế lại 2 cơ chế đó
sao cho: (a) verify thật (không fail-open khi không chắc), (b) tự sửa được
khi có thể, (c) báo rõ ràng cho người khi không tự sửa được, đúng tinh
thần 3 trụ cột của `docs/distribution-vision.md` (setup/doctor tự sửa
được mọi thứ cần, aware nhiều context trên 1 máy, mọi module đăng ký được
config/check của riêng nó) — không phải một bản vá cục bộ cho 2 hàm.

## 3. Vấn đề rõ / chưa rõ

| # | Điểm | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 1 | Root cause #1 (bin discovery) đã xác nhận bằng code+thực nghiệm | Rõ | `checkPluginSkillCliReachable` (`src/setup/registrations.mjs:1205-1219`) và `plugins/fgOS/skills/pick/SKILL.md:41` đều resolve global `fgos` qua `sh -c "command -v fgos"` — non-login, non-interactive. nvm chỉ export global bin dir trong block interactive của `~/.bashrc`/`~/.zshrc`. Test thật trên máy này: `npm prefix -g` trỏ vào thư mục nvm, nhưng `command -v fgos` chỉ tìm thấy vì có một bản cài **thứ hai, dư thừa** qua pnpm (`~/.local/share/pnpm/bin`, path này được export theo cách non-interactive shell cũng đọc được) — một máy chỉ cài đúng 1 lần theo đường npm/nvm khuyến nghị sẽ luôn fail. |
| 2 | Root cause #2 (plugin/marketplace fail-open) đã xác nhận bằng đọc code | Rõ | `checkClaudePluginMarketplace` (`src/setup/registrations.mjs:1118-1124`) trả `passed: true` khi lệnh `claude` không có trên PATH tại thời điểm check chạy — coi là "not applicable" thay vì "chưa verify được". Fix tương ứng (`claude plugin marketplace add`/`install`, dòng ~1160-1172) vì vậy không bao giờ chạy trong tình huống này. Không có cơ chế nào tự động chạy lại doctor/setup sau đó. |
| 3 | `claude` binary có thực sự đáng tin là "thước đo Claude Code có mặt hay không" không? | Chưa rõ | Người dùng có thể dùng Claude Code qua desktop app/IDE extension mà không có binary `claude` riêng trên PATH — lúc đó check #2 "not applicable" lại ĐÚNG theo nghĩa khác (Claude Code không dùng CLI marketplace mechanism theo cách này). Cần phân biệt "claude thật sự không áp dụng" khỏi "claude có áp dụng nhưng tạm thời không thấy trên PATH lúc check chạy" — 2 case khác nhau, hiện bị gộp làm một. |
| 4 | Vì sao project-local cần tồn tại riêng, không gộp về global-only? | Rõ (D2) | Version-pinning/team-consistency: global-only nghĩa là mọi project trên máy dùng chung 1 version, nâng cấp cho project này làm vỡ project khác im lặng — cùng lớp vấn đề `tsk-jtb` đang giải ở tầng release tag. `node_modules/.bin` không nằm trên PATH thường (chỉ có qua `npm run`/`npx`) nên phải resolve bằng file-check, không phải PATH lookup. |
| 5 | Hướng sửa root cause #1 (giờ chỉ còn tầng global): probe nhiều tầng hay cache path đã resolve? | Chưa rõ | 2 hướng không loại trừ nhau — đề xuất trước: cache làm nguồn sự thật, probe làm cơ chế populate. Cần người quyết định. |
| 6 | Hướng sửa root cause #2: check nên fail loud hay tìm cách tự phân biệt "claude không áp dụng" khỏi "claude tạm thời không thấy"? | Chưa rõ | Cùng cần quyết định trước khi khoá D-ID. |

## 4. Quyết định đã chốt

| D-ID | Quyết định | Lý do |
|------|-----------|-------|
| D1 | Cài đặt fgOS có **2 trục độc lập, không bắc cầu tự động**: (a) trục bin — npm/pnpm/yarn global, project-local, hoặc dev-checkout self-hosting; (b) trục skill — forgentX tự-host (`.claude/skills/fgos-*`) hoặc Claude Code plugin marketplace (`plugins/fgOS/skills/*`). Cầu nối DUY NHẤT giữa 2 trục là `fgos setup`/`doctor --fix`. | Xác nhận bằng đọc `package.json` `files` allowlist (không có `plugins/`), `plugins/fgOS/.claude-plugin/plugin.json` (không có `scripts`/postinstall, đúng RUL6), và `.claude-plugin/marketplace.json` (skill của project ngoài chỉ tới được qua plugin marketplace). Nền tảng bắt buộc trước khi thiết kế bin-discovery — vì 1 project hoàn toàn có thể chỉ thoả 1 trục. |
| D2 | Trục A (bin) resolve theo **3 tầng deterministic**, không phải nhóm "PATH-dependent vs không" mơ hồ như trước: (1) dev-checkout self-hosting — file-check `<git-root>/bin/fgos.mjs`; (2) project-local install — file-check `node_modules/.bin/fgos`, đi ngược cây thư mục từ cwd (giống Node module resolution); (3) global install — tầng DUY NHẤT thật sự cần PATH lookup hoặc config-cache. **Project-local giữ lại là chế độ riêng, không gộp về global-only.** | Global-only làm mọi project trên máy dùng chung 1 version — nâng cấp cho project A làm vỡ project B im lặng, cùng lớp vấn đề `tsk-jtb` đang giải ở tầng release tag; project-local (qua `package.json`+lockfile) pin version theo từng project/team, đúng pattern chuẩn CLI npm (eslint/prettier). `node_modules/.bin` xác nhận không nằm trên PATH ngoài context `npm run`/`npx` nên phải resolve bằng file-check, không phải PATH — thu hẹp câu hỏi probe-vs-cache trước đó xuống chỉ còn tầng global. |

## 5. Q&A log

- **2026-08-13, vòng 1** — Người dùng (anh) yêu cầu tạo work item mới và
  mở code-shaping để cùng thiết kế cơ chế cài đặt/setup đúng chuẩn, nói rõ
  đã tin tưởng agent có đủ kiến thức để chủ động đề xuất. Agent (em) đã
  scout xong 2 root cause cụ thể (bằng chứng ở §3 #1-2) từ phiên thảo luận
  trước khi mở discussion này; đang trình bày 2 hướng thiết kế cho từng
  root cause trực tiếp trong hội thoại, chưa nhận câu trả lời.
- **2026-08-13, vòng 2** — Anh yêu cầu thống nhất cơ chế cài đặt (bao
  nhiêu chế độ, bin/skill nằm đâu mỗi chế độ, cách đóng gói) TRƯỚC khi bàn
  bin-discovery. Em scout `package.json` `files`, `plugins/fgOS/.claude-
  plugin/plugin.json`, `.claude-plugin/marketplace.json`, trình bày ma
  trận 2 trục độc lập. Anh xác nhận, không thêm chế độ nào khác, yêu cầu
  "cập nhật" — đã ghi D1, cập nhật §3/§6.
- **2026-08-13, vòng 3** — Anh hỏi tại sao trục A, project-local không
  đơn giản dùng bin global. Em trình bày 2 lý do: (a) version-pinning/
  team-consistency (global-only làm mọi project chung 1 version, nâng cấp
  cho 1 project vỡ project khác im lặng — cùng lớp vấn đề `tsk-jtb`), (b)
  `node_modules/.bin` không nằm trên PATH thường nên phải resolve bằng
  file-check, thu hẹp câu hỏi bin-discovery ban đầu xuống chỉ còn tầng
  global. Anh đồng ý, yêu cầu "cập nhật tài liệu kèm lý do tương thích
  version" — đã ghi D2, cập nhật §3/§4/§6.

## 6. Thiết kế đã chốt {#design}

fgOS có 2 hệ phân phối độc lập (D1) — **bin** (`fgos`/`fgos-runner`, npm
package) và **skill** (`/fgOS:*`, Claude Code plugin) — đóng gói tách
biệt, cài tách biệt, và không có gì tự động nối chúng lại ngoài
`fgos setup`/`doctor --fix` (bản thân đang có 2 lỗ hổng fail-silent, xem
§3 #1-2).

Trục A (bin) tự nó không phải một khối "global hay local" đơn giản mà là
**3 tầng deterministic, mỗi tầng một lý do tồn tại riêng và một cách
resolve riêng** (D2):

1. **dev-checkout self-hosting** — file-check `<git-root>/bin/fgos.mjs`.
   Tồn tại cho contributor tự dogfood chính forgentX, không cần cài gì.
2. **project-local install** — file-check `node_modules/.bin/fgos`, đi
   ngược cây thư mục từ cwd. Tồn tại để **pin version theo từng
   project/team**, tránh global-only làm mọi project trên máy dùng chung
   1 version rồi vỡ đồng loạt khi 1 project cần nâng cấp — cùng lớp vấn đề
   `tsk-jtb` đang giải ở tầng release tag, chỉ khác là D2 giải ở tầng cài
   đặt cục bộ thay vì tầng phân phối từ nguồn.
3. **global install** — PATH lookup (hoặc config-cache, câu hỏi vẫn mở ở
   §3 #5). Tồn tại cho dùng nhanh/cá nhân, không cần version pin riêng.

Chỉ tầng 3 thật sự có root cause #1 (PATH không thấy trong non-interactive
shell) — tầng 1-2 vốn đã deterministic bằng file-check, không phụ thuộc
PATH nên không có gì để tranh luận thêm.

```mermaid
flowchart TB
    subgraph BinAxis["Trục A — bin fgos/fgos-runner, 3 tầng (D2)"]
        direction TB
        A1["Tầng 1: dev-checkout self-hosting<br/>file-check &lt;git-root&gt;/bin/fgos.mjs<br/>-- deterministic, không PATH"]
        A2["Tầng 2: project-local install<br/>file-check node_modules/.bin/fgos<br/>đi ngược cây thư mục từ cwd<br/>-- deterministic, không PATH<br/>-- lý do: version-pin theo project/team"]
        A3["Tầng 3: global install<br/>PATH lookup / config-cache<br/>-- tầng DUY NHẤT cần bàn root cause #1"]
    end

    subgraph SkillAxis["Trục B — skill /fgOS:* (Claude Code plugin)"]
        direction TB
        B1["forgentX tự-host<br/>.claude/skills/fgos-* có sẵn trong checkout"]
        B2["Claude Code plugin marketplace<br/>plugins/fgOS/skills/*<br/>qua .claude-plugin/marketplace.json"]
    end

    Bridge["fgos setup / fgos doctor --fix<br/>(cầu nối DUY NHẤT giữa 2 trục)"]
    RC1["Root cause #1 (thu hẹp còn tầng 3):<br/>sh -c non-login shell không thấy PATH<br/>của global install (nvm interactive-only)"]
    RC2["Root cause #2:<br/>checkClaudePluginMarketplace fail-open<br/>khi claude CLI không trên PATH<br/>-- B2 không bao giờ được kích hoạt"]

    A3 -.->|"tsk-2qc root cause #1"| RC1
    RC1 -.-> Bridge
    Bridge -->|"claude plugin marketplace add/install"| B2
    Bridge -.->|"fail-open, silent pass"| RC2
    RC2 -.-> B2

    ProjectNgoai["Project bên ngoài, chỉ làm 1 nửa hướng dẫn"] -->|"chỉ npm install -g"| A3
    ProjectNgoai -->|"thiếu bước fgos setup thành công"| SkillMissing["Không có skill nào<br/>(Unknown skill)"]
    A3 -.->|"PATH lookup fail (root cause #1)"| BinMissing["Không tìm ra bin<br/>dù đã cài"]
```

Kết luận thiết kế tới thời điểm này: bất kỳ hướng sửa bin-discovery nào
cũng phải đứng trên nền D1+D2 — tầng 1-2 giữ nguyên file-check hiện có
(đã đúng, không cần sửa), toàn bộ nỗ lực root cause #1 chỉ tập trung vào
tầng 3 (global), và cầu nối (`fgos setup`/`doctor --fix`) phải fail loud
thay vì fail-silent ở cả 2 đầu. Chưa chốt cơ chế cụ thể cho tầng 3 (probe
nhiều tầng vs cache-in-config) hay cho root cause #2 (WARN vs phân biệt
case) — hai câu hỏi này vẫn mở, chờ vòng tiếp theo.

## 7. Danh mục hạng mục / task {#tasks}

(chưa có — chờ §6 có nội dung cụ thể)
