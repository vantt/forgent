---
type: discussion
title: fgOS plugin skill CLI resolution across install shapes
timestamp: 2026-08-08T06:55:00.000Z
---

# fgOS plugin skill CLI resolution across install shapes

## 1. Trạng thái hiện tại

Vừa mở round 1. Một scout mới (§5 round 1) tìm ra một khả năng thiết kế
chưa từng cân nhắc trong tsk-1no (fix hẹp đã khoá D1-D3, xem
`docs/history/plugin-skill-cli-path-fallback/CONTEXT.md`): plugin fgOS khi
cài qua `claude plugin marketplace add vantt/forgent` thực ra kéo về **toàn
bộ repo forgent** (không chỉ subdirectory `plugins/fgOS/`), nằm tại
`~/.claude/plugins/marketplaces/fgos-plugins/` — bao gồm cả `bin/fgos.mjs`
thật, luôn khớp version với skill prose. Nếu skill prose truy cập được thư
mục cài của chính plugin (`${CLAUDE_PLUGIN_ROOT}`, biến chính thức Claude
Code), plugin có thể tự trỏ tới CLI thật của chính nó — không cần global
npm install, không cần PATH fallback, không cần dev-checkout nào cả. Chưa
xác nhận được cơ chế này có hoạt động cho bash nhúng trong SKILL.md hay
không — xem câu hỏi round 1 bên dưới.

Item nền `tsk-1no` (fix hẹp 23 file, PATH-fallback) đang đứng chờ approve
gate riêng, độc lập với discussion này — không bị ảnh hưởng bởi hướng
design mới này trừ khi người quyết định đổi hướng.

## 2. Mục tiêu & đề bài

Chủ sản phẩm muốn `/fgOS:*` (và về sau, lý tưởng là cả lớp dev-skill
`.agents/skills/fgos-*` nếu được tái dùng cho agent provider khác) chạy
được thật trên một **consumer project** — cụ thể là `herdr-gateway`, một
project đang phát triển sản phẩm khác, cài fgOS như một công cụ backlog,
không phải fork/dev fgOS. Bài toán rộng hơn `tsk-1no`: không chỉ vá 23 file
để không crash, mà thiết kế đúng cách fgOS tự nhận biết và ưu tiên đúng
giữa ba ngữ cảnh cài đặt luôn cùng tồn tại — global npm install, một
project đang phát triển sản phẩm khác (cài fgOS làm tool), và chính
forgent dev-checkout (tự dogfood) — không xung đột, theo đúng pillar 6 của
`docs/distribution-vision.md`.

## 3. Vấn đề rõ / chưa rõ

| # | Trạng thái | Vấn đề |
|---|---|---|
| 1 | **Rõ** | Plugin fgOS chỉ là UX kích hoạt `/fgOS:*`, không tự ý bundle CLI vào `plugin.json`'s declared content (D1, tsk-1no, chủ sản phẩm đã xác nhận) |
| 2 | **Rõ** | `claude plugin marketplace add <github-repo>` clone toàn bộ source repo (xác nhận thật bằng cách đọc `~/.claude/plugins/marketplaces/caveman/` trên máy dev — có `bin/`, `.git/`, toàn bộ cây, không chỉ phần plugin khai báo) |
| 3 | **Chưa rõ** | `${CLAUDE_PLUGIN_ROOT}` (biến chính thức, trỏ tới thư mục cài của chính plugin) có thực sự substitute được trong bash nhúng ở SKILL.md khi Claude chạy qua Bash tool hay không — tài liệu chính thức (Plugins reference § Environment variables) chỉ xác nhận biến này export cho **hook process và MCP/LSP subprocess**, không nói rõ cho skill-embedded bash. Test thật trong phiên này: `env \| grep CLAUDE_PLUGIN` không thấy gì khi đang chạy giữa một plugin skill — nhưng test đó không loại trừ khả năng Claude làm text-substitution trước khi gửi lệnh cho Bash tool (giống cách `${CLAUDE_PROJECT_DIR}` hiện đang hoạt động thật trong 23 file plugin — cơ chế chính xác của biến ĐÓ cũng chưa từng được verify tận gốc, chỉ biết nó chạy được). |
| 4 | **Chưa rõ** | Nếu #3 đúng (substitute được), path chính xác `${CLAUDE_PLUGIN_ROOT}` trỏ tới là gì — thư mục con `plugins/fgOS/` hay root của cả bản clone repo? Cần đi lên bao nhiêu cấp (`../../bin/fgos.mjs` hay khác) để chạm `bin/fgos.mjs` thật |
| 5 | **Chưa rõ** | Cơ chế "project ghi đè global" (pillar 6) — hiện KHÔNG có tầng global config nào tồn tại trong code (`src/setup/config-merge.mjs` chỉ merge fill-missing-only cho MỘT file `.fgos/config.json` per-project, không đọc `~/.fgos/config.json` hay biến môi trường global nào). `docs/coexistence.md` là doctrine khác (fgOS chạy cạnh MỘT HARNESS KHÁC trong cùng project, không phải fgOS-vs-fgOS giữa nhiều cấp cài đặt) |
| 6 | **Chưa rõ** | Nếu hướng `${CLAUDE_PLUGIN_ROOT}` (marketplace self-locate) đi được, nó có thay thế hoàn toàn PATH-fallback (D3, tsk-1no) hay chỉ là ưu tiên thử trước, PATH-fallback vẫn giữ làm lớp cuối (cho case người dùng KHÔNG qua Claude Code plugin — vd terminal thuần, agy, codex sau này)? |

## 4. Quyết định đã chốt

*(chưa có D-ID nào — round 1, chưa điểm nào giữ ổn định qua 2 vòng)*

## 5. Q&A log

**[2026-08-08 06:55] Scout (session, round 1):**
Đọc `src/setup/registrations.mjs:583-703` — phát hiện `fgos doctor --fix`
ĐÃ tự động hoá việc cài plugin marketplace cho consumer:
`claude plugin marketplace add vantt/forgent` rồi
`claude plugin install fgOS@fgos-plugins`. Đây là bằng chứng thật rằng lớp
phân phối PLUGIN (khác lớp phân phối CLI qua npm) đã có sẵn cơ chế tự
động, không phải một gap chưa thiết kế như tsk-1no ban đầu tưởng — gap thật
duy nhất là "skill tự locate CLI thật ở đâu", không phải "làm sao đưa
skill tới consumer project".

Kiểm tra thật trên máy dev: `claude plugin marketplace list --json` cho
thấy marketplace `fgos-plugins` ở máy NÀY được add kiểu
`"source": "directory", "path": "/home/vantt/projects/forgentX"` (add thủ
công lúc dev, trỏ thẳng checkout) — KHÁC với case thật một consumer chạy
`fgos doctor --fix`, case đó sẽ add kiểu `"source": "github", "repo":
"vantt/forgent"` (như `caveman`/`claude-plugins-official` đang thấy trong
list, cả hai đều có `"installLocation":
"/home/vantt/.claude/plugins/marketplaces/<name>"`). Đã xác nhận bằng
`find` trên `~/.claude/plugins/marketplaces/caveman/` — chứa nguyên `bin/`,
`.git/`, toàn bộ cây nguồn, không chỉ phần `skills/` plugin khai báo.

Dispatch `claude-code-guide` agent xác minh biến `${CLAUDE_PLUGIN_ROOT}`:
tài liệu chính thức (Plugins reference § Environment variables, v2.1+) xác
nhận biến này THẬT SỰ TỒN TẠI, trỏ tới thư mục cài của chính plugin — nhưng
chỉ export chắc chắn cho hook process + MCP/LSP subprocess. Claim của agent
rằng nó cũng substitute trong skill-embedded bash là suy luận, không trích
dẫn được nguồn chính thức cho đúng trường hợp này — cần một spike thật
(sửa một file plugin skill để echo `${CLAUDE_PLUGIN_ROOT}`, chạy slash
command thật, đọc output) trước khi khoá design theo hướng này.

**Câu hỏi cho người, round 1:** Trước khi đi tiếp — anh muốn ưu tiên hướng
nào để thiết kế tiếp?

(a) **Spike thật `${CLAUDE_PLUGIN_ROOT}` trước** — sửa tạm một file plugin
skill, chạy thật một slash command trên máy này, xem biến có substitute
không. Nếu đúng, đây là fix đẹp hơn nhiều: plugin tự chứa CLI thật qua
marketplace clone, không phụ thuộc PATH/npm nào nữa, giải quyết cả pillar 6
cho riêng lớp plugin (không cần global-config-priority phức tạp). Tốn thời
gian một spike nhỏ trước khi khoá.

(b) **Đi thẳng theo D3 đã khoá ở tsk-1no** (PATH-fallback, mirror
`scripts/fgos-shell-integration.sh`) — không phụ thuộc giả định chưa verify
được, chạy chắc chắn với mọi cách cài (kể cả không qua Claude Code plugin).
Không tận dụng được marketplace-clone dù nó có sẵn.

(c) **Cả hai** — thử `${CLAUDE_PLUGIN_ROOT}` trước, PATH-fallback (D3) làm
lớp dự phòng cuối nếu (a) không substitute hoặc người dùng không qua
Claude Code plugin.

## 6. Thiết kế đã chốt

*(chưa có — chờ round 1 trả lời trước khi tổng hợp)*

## 7. Danh mục hạng mục / task

*(chưa có — chờ §6 ổn định)*
