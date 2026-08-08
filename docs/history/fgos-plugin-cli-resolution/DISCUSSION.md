---
type: discussion
title: fgOS plugin skill CLI resolution across install shapes
timestamp: 2026-08-08T06:55:00.000Z
---

# fgOS plugin skill CLI resolution across install shapes

## 1. Trạng thái hiện tại

Round 2 xong: spike thật đã **loại bỏ** hướng `${CLAUDE_PLUGIN_ROOT}`
(xem §5 round 2) — không an toàn để dùng trong skill prose, im lặng xoá
mất cả block chứa nó thay vì báo lỗi hay để nguyên token. Kết luận đề xuất:
quay lại D3 đã khoá ở `tsk-1no` (PATH-fallback, mirror
`scripts/fgos-shell-integration.sh`) làm hướng duy nhất — chờ người xác
nhận trước khi khoá D-ID.

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
| 3 | **Rõ (round 2)** | `${CLAUDE_PLUGIN_ROOT}` KHÔNG an toàn dùng trong skill prose — spike thật (§5 round 2) cho thấy nó âm thầm xoá cả block chứa nó thay vì substitute hay báo lỗi. Loại bỏ hướng marketplace-self-locate qua token này. |
| 4 | Đã loại bỏ cùng #3 | *(không còn áp dụng — không đi hướng này nữa)* |
| 5 | **Chưa rõ** | Cơ chế "project ghi đè global" (pillar 6) — hiện KHÔNG có tầng global config nào tồn tại trong code (`src/setup/config-merge.mjs` chỉ merge fill-missing-only cho MỘT file `.fgos/config.json` per-project, không đọc `~/.fgos/config.json` hay biến môi trường global nào). `docs/coexistence.md` là doctrine khác (fgOS chạy cạnh MỘT HARNESS KHÁC trong cùng project, không phải fgOS-vs-fgOS giữa nhiều cấp cài đặt) |
| 6 | **Rõ (round 2)** | Không còn câu hỏi "thay thế hay ưu tiên trước" — PATH-fallback (D3, tsk-1no) là hướng duy nhất còn lại cho phần "skill tự locate CLI" |

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

**Người chọn (a).**

**[2026-08-08 07:14] Spike (session, round 2):**
Test thật trên 2 file plugin skill riêng biệt, mỗi lần dùng skill CHƯA
từng gọi trong phiên này (Skill tool dedup theo tên skill trong phiên —
gọi lại cùng tên không re-render file, phải dùng tên mới mỗi lần thử):

- Lần 1 (`plugins/fgOS/skills/ready/SKILL.md`): thêm step số "0." (lệch
  dãy số 1,2,3 gốc) chứa `echo "SPIKE_PLUGIN_ROOT=[${CLAUDE_PLUGIN_ROOT}]"`.
  Gọi `/fgOS:ready` → step "0." biến mất hoàn toàn khỏi bản render, nhảy
  thẳng từ header "## Steps" sang "1. **Ignore...**". Confound: có thể do
  số thứ tự lệch dãy, không chắc do `CLAUDE_PLUGIN_ROOT`.
- Lần 2 (`plugins/fgOS/skills/stale/SKILL.md`, chưa gọi lần nào trong
  phiên): thêm đúng step số "4." (nối tiếp dãy 1,2,3 gốc, không lệch số)
  cùng nội dung echo `${CLAUDE_PLUGIN_ROOT}`. Gọi `/fgOS:stale` → step "4."
  **vẫn biến mất hoàn toàn**, dù đúng dãy số liên tục. Cùng bản render đó,
  `${CLAUDE_PROJECT_DIR}` ở step 2 substitute đúng thành
  `/home/vantt/projects/forgentX`, `$ARGUMENTS` ở step 1 substitute thành
  rỗng — hai token khác hoạt động bình thường ngay trong cùng file.

Loại trừ được confound số thứ tự. Kết luận: `${CLAUDE_PLUGIN_ROOT}` là
token có thật (harness nhận diện, đúng như docs chính thức) nhưng ở kiểu
cài `"source": "directory"` (dev/local, đúng case máy này — plugin trỏ
thẳng checkout, không qua clone marketplace thật) không có giá trị thật để
gán, và thay vì để nguyên token hay báo lỗi, harness **âm thầm xoá cả
block chứa nó**. Failure mode này tệ hơn bug gốc của tsk-1no (crash rõ
ràng) — mất instruction hoàn toàn không dấu vết, agent chạy tiếp mà không
biết thiếu bước.

Cả 2 file spike đã `git checkout --` revert sạch ngay sau test, xác nhận
`git status --short` trống trên cả hai.

**Giới hạn của kết luận này:** chỉ test được trên kiểu cài
`"source": "directory"` (máy dev). Chưa test được trên kiểu cài thật
`"source": "github"` (case herdr-gateway thật sẽ dùng, qua `fgos doctor
--fix`) — có khả năng (dù không chắc) hành vi khác khi plugin thật sự nằm
trong `~/.claude/plugins/marketplaces/<name>/` thay vì trỏ thẳng dev
checkout. Test đó cần một máy/project cài thật qua github source, ngoài
tầm một spike rẻ trong phiên này.

**Đề xuất round 2:** loại bỏ hướng (a)/(c) cho tới khi có bằng chứng khác
từ một cài đặt github-source thật. Đi theo (b) — giữ nguyên D3 đã khoá ở
`tsk-1no` (PATH-fallback) làm hướng duy nhất cho câu hỏi "skill tự locate
CLI thật ở đâu". `tsk-1ri` thu hẹp phạm vi lại đúng như tên: chỉ còn giải
quyết pillar 6 phần "global/project/dev-checkout priority" (vấn đề #5 ở
§3), tách biệt khỏi câu hỏi CLI-resolution mà `tsk-1no` đã khoá xong.

## 6. Thiết kế đã chốt

*(chưa có — chờ round 1 trả lời trước khi tổng hợp)*

## 7. Danh mục hạng mục / task

*(chưa có — chờ §6 ổn định)*
