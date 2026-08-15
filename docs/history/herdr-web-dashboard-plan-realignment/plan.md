# plan.md — nắn lại kế hoạch cụm herdr web dashboard (tsk-6d2)

Mode: high-risk

5 flag áp dụng, trong đó có hard-gate flag:

- **auth** (hard-gate) — D13 supersede lớp 1 của `herdr-web-dashboard/CONTEXT.md` D8.
- **audit/security** (hard-gate) — D13 chấp nhận đánh đổi XSS có điều kiện.
- **public contracts** — D1 buộc `docs/contracts/fgos-gateway-api-v1.yaml` phải mọc thêm route.
- **existing covered behavior** — `scripts/check-decision-citation-drift.mjs` quét `docs/backlog.md` + `docs/specs/*.md` tìm dòng còn trích quyết định đã bị supersede; D12/D13 đụng đúng vùng đó.
- **weak proof around the area** — `verify` của item còn là placeholder `chưa xác định — P15 bổ sung`; không có test nào bao vùng "nắn kế hoạch".

Lane nhỏ hơn không trung thực được: một nửa việc là đóng vĩnh viễn hai item bằng `wontfix`, thứ FSM không có cạnh đi ra (`src/state/status-fsm.mjs:156-169` — bốn cửa vào, không cửa ra).

`impact-analysis: full` — `fgos tool query --capability impact-analysis --status present` trả gitnexus `status: present` (2026-08-15).

Nguồn quyết định duy nhất: `CONTEXT.md` cùng thư mục, D1–D13.

## Approach

### Việc này thực sự là gì

Không viết dòng code sản phẩm nào. Bốn nhóm thao tác:

1. **State ops** — đóng 2 item, nắn mô tả/deps 3 item, tạo 2 item mới.
2. **Sửa `plan.md` của cụm** (`docs/history/herdr-web-dashboard/plan.md`).
3. **Thêm con trỏ supersede** vào `docs/history/herdr-web-dashboard/CONTEXT.md` D7/D8 — trỏ sang D5/D13 ở đây. Cập nhật để trỏ D-ID mới, **không sửa tại chỗ nội dung quyết định cũ**, đúng luật `docs/specs/platform-foundations.md`.
4. **Sửa 2 tài liệu đã lệch sự thật** — `docs/ui-spec/15-system-events.md` (D9), `docs/specs/herdr-web-dashboard.md` (D12).

### Thứ tự, và vì sao thứ tự này chứ không phải thứ tự khác

`fgos graph --what-if tsk-6d2` trả `unblocksTransitive: 0`, `newlyReady: []`, và `criticalPath` (depth 10) không chứa item nào của cụm này. Đọc thẳng: **engine không mô hình hoá quan hệ "tsk-6d2 nắn 5 item con của tsk-ldb"** — không có `deps` nào diễn tả nó, nên không có gì ngăn một session khác pick `tsk-k4v` ngay bây giờ và đi xây một HTTP server thứ hai hoàn toàn vô ích. Đó chính là rủi ro mô tả của item nêu ra, và graph xác nhận nó đang mở.

Vì vậy:

- **Bước 1 (làm trước tất cả): đóng tsk-k4v, và nắn tsk-48w** (D14 — tsk-48w không còn bị đóng). Đây là hành động cắt rủi ro, không phải dọn dẹp: chừng nào tsk-k4v còn `todo` thì còn cửa cho một session khác pick nó và xây một HTTP server thứ hai vô ích.
- Bước 2: nắn tsk-5jr, tsk-4id (D10) và tsk-18to (D8, gồm gỡ `deps` đang trỏ tsk-k4v vừa đóng).
- Bước 3: tạo **1** item mới (D6 khung client) và item gateway của D5 — nay chỉ còn CORS + bind cấu hình được, vì mục (c) static-serving đã về tsk-48w theo D14 — rồi sửa `deps` của tsk-5jr/tsk-4id trỏ vào item khung client.
- Bước 4: sửa tài liệu (cụm `plan.md`, con trỏ supersede, ui-spec, area spec).

Bước 2 phải sau bước 1 vì `deps` của tsk-18to trỏ vào item bước 1 đóng. Bước 3 phải sau bước 2 vì `deps` mới thay `deps` cũ. Bước 4 để cuối vì nó mô tả kết quả của ba bước trên.

### Mảnh việc suýt rơi mất khi đóng tsk-48w — item D5 phải nhận

Đọc `verify` và mô tả thật của tsk-48w (probe 2026-08-15) cho thấy nó KHÔNG
trùng hoàn toàn tsk-4r1 như tên gọi gợi ý. Nó cài đặt hai quyết định của
cụm:

- **cụm D9** — token của web server riêng: env `FGOS_HERDR_WEB_SECRET`, vắng
  thì tự sinh file gitignored dưới `.fgos/`, chmod 0600, cố ý KHÔNG nằm
  trong `.fgos/config.json` vì file đó đang được git track.
- **cụm D10** — toggle riêng cho web dashboard trong `.fgos/config.json`,
  mặc định BẬT.

Đối chiếu với những gì đã khoá ở `CONTEXT.md` cùng thư mục:

- **cụm D9 chết thật.** D13 chốt web client xác thực bằng Bearer token của
  chính gateway; không còn web server riêng thì không còn secret riêng. Bỏ
  luôn, không chuyển đi đâu.
- **cụm D10 KHÔNG chết — nó chuyển hoá.** Nhu cầu "bật/tắt việc phục vụ web"
  vẫn còn nguyên, chỉ đổi chỗ: nó là cờ static-serving của D5(c).

Người chốt tại gate `validateApprove` (2026-08-15): **tsk-48w không đóng
nữa, nắn lại để chính nó gánh phần dư** — D14, supersede D4. Nó giữ
nguyên id/deps/lịch sử, đổi scope thành cờ static-serving cộng việc đăng ký
cờ đó vào `fgos setup`'s config-merge và `fgos doctor`'s check registry
(`src/setup/registrations.mjs` / `src/setup/checks.mjs`), đúng ràng buộc
AGENTS.md §"Install/setup/doctor gate" mà nó vốn đang gánh.

Hai lý do chọn hướng này thay vì đóng rồi giao phần dư bằng văn xuôi: nó
tránh một thao tác `wontfix` không đảo ngược được, và nó giữ sợi dây nối
nằm trong chính item chứ không nằm trong prose mà người sau phải tình cờ
đọc trúng.

### Một chỗ shape khác với cách đọc thẳng D1

D1 khoá "thêm route edit vào gateway `/v1` **và** vào contract yaml". Kế hoạch này **không sửa `fgos-gateway-api-v1.yaml` trong tsk-6d2**, mà giao việc đó cho item gateway ở D5.

Lý do, không phải reopen D1 mà là hệ quả của chính nó: contract yaml mô tả **hành vi thật của gateway**. Thêm route `edit` vào yaml trong khi `gateway.rs` chưa có route đó biến contract thành lời nói dối — và `/v1/contract` phục vụ file này ra ngoài cho client đọc (`gateway.rs:851-866`), nên lời nói dối đó đi thẳng tới mọi client. D1 vẫn được tôn trọng đầy đủ: nó nói route edit phải tồn tại, kế hoạch này ghi việc đó vào item sẽ thực sự làm ra nó.

### Rejected

- **Tách tsk-6d2 thành nhiều item con** — bác. Bốn nhóm việc trên phụ thuộc thứ tự chặt (deps của item này trỏ item kia), và mỗi mảnh tách ra là 1–2 lệnh `fgos edit`. Overhead điều phối lớn hơn giá trị park-độc-lập. Xem "Shape" bên dưới.
- **Sửa `CONTEXT.md` của cụm tại chỗ cho khớp thực tế** — bác. `platform-foundations` cấm sửa quyết định đã khoá không dấu vết; chỉ thêm con trỏ sang D-ID thay thế.
- **Kéo tsk-3b0 vào cụm để v1 quản nhiều máy** — bác bởi D11, đã khoá.

### Risk map

| Thành phần | Mức | Cái gì chứng minh được nó đúng |
|---|---|---|
| Đóng tsk-k4v bằng `wontfix` | **cao** — không đảo ngược được (`status-fsm.mjs:156-169` không có cạnh ra) | Trước khi `move`, đọc lại mô tả item và đối chiếu với tsk-7l9; `validateSupersededBy` (`work.mjs:751-760`) từ chối id không tồn tại. Verify kiểm cả `status` lẫn `supersededBy`. Chỉ còn MỘT item bị đóng (D14 gỡ tsk-48w khỏi diện này) — đúng bài học của chính vòng gate này: đọc mô tả thật trước khi đóng, đừng tin cái tên. |
| `supersededBy` trỏ nhầm item | trung bình — knowledge-only, sửa lại rẻ | Verify kiểm giá trị chính xác, không chỉ kiểm có mặt. |
| Nắn tsk-48w mà quên phần đăng ký setup/doctor | trung bình — cờ tồn tại nhưng `doctor` không thấy, đúng thứ AGENTS.md cấm | Verify kiểm mô tả tsk-48w đã mang chuỗi `static-serving`; bản thân việc đăng ký được chứng minh bởi verify của chính tsk-48w khi nó chạy, không phải ở đây. |
| Gỡ `deps` của tsk-18to trỏ tsk-k4v | trung bình — bỏ sót thì item treo mãi trên một dep đã `wontfix` | Sau bước 2, `fgos ready` phải không còn báo tsk-18to chờ một dep đã đóng. |
| Sửa `docs/specs/herdr-web-dashboard.md` (D12) | trung bình — vùng `check-decision-citation-drift` quét | `npm test` (drift-checker chạy trong suite). |
| Sửa `docs/ui-spec/15-system-events.md` (D9) | thấp | Verify grep `state/digest` có mặt. |
| Sửa `plan.md` cụm | thấp — văn xuôi, không ai parse trừ `Mode:` của chính nó | Đọc lại. |
| Tạo 2 item mới | thấp — tạo thừa thì `wontfix` được | — |

Mọi mức trung bình/cao ở trên đều có proof point chuyển cho `fgos-coding-validating`, không có mục nào để "đoán là ổn".

### Files likely touched

- `docs/history/herdr-web-dashboard/plan.md`
- `docs/history/herdr-web-dashboard/CONTEXT.md` (chỉ thêm con trỏ supersede ở D7/D8)
- `docs/ui-spec/15-system-events.md`
- `docs/specs/herdr-web-dashboard.md`
- state: tsk-48w, tsk-k4v, tsk-5jr, tsk-4id, tsk-18to + 2 item mới

Không đụng `herdr-plugin/`, không đụng `docs/contracts/`, không đụng `src/`.

## Shape

Một mảnh, không split — `pass-through`.

Lý do, chứ không phải mặc định: bốn nhóm việc buộc phải xảy ra theo đúng thứ tự đã lập luận ở trên (deps của item này trỏ item kia), nên chúng không park/tiến độc lập được — chính là điều kiện mà ưu tiên #2 dùng để biện minh cho việc chia nhỏ. Chia ra chỉ tạo item cỡ một lệnh `fgos edit`, cộng thêm chi phí điều phối và merge, mà không mua được gì.

### Ca cần chứng minh (theo mức high-risk)

- **Biên:** `supersededBy` trỏ vào id không tồn tại → `validateSupersededBy` (`work.mjs:751-760`) phải ném lỗi, không âm thầm nhận.
- **Không hồi quy:** `npm test` xanh sau khi sửa `docs/specs/` — cụ thể `check-decision-citation-drift` không bắt được dòng nào trích quyết định đã supersede mà thiếu con trỏ thay thế.
- **Thứ tự:** gỡ `deps` tsk-18to→tsk-k4v phải xảy ra; nếu bỏ sót, tsk-18to treo vĩnh viễn trên một dep `wontfix`.
- **Trạng thái đầu vào:** cả 5 item phải còn `todo` lúc bắt đầu. Nếu một item đã bị session khác pick (`doing`), cửa `todo→wontfix` vẫn dùng được (`doing→wontfix` cũng có), nhưng phải dừng lại xem session kia đang làm gì trước — đó là người, không phải máy quyết.
- **Không đảo ngược:** sau khi `wontfix`, không có đường FSM quay lại. Đây là lý do bước 1 đọc-đối-chiếu trước khi `move`.

### Verify: một cái bẫy đã đạp phải, ghi lại để người sau không đạp

Bản verify đầu tiên viết `--dir .` và **sai về cơ chế**, không phải sai về nội dung: `runGoalCheck(item, wt.path, …)` (`src/runner/loop.mjs:410,873`) chạy verify với **cwd = worktree**, mà một worktree liên kết không bao giờ mang `.fgos/` (ADR0020). Mọi lệnh `fgos` trong verify sẽ bị từ chối (exit 4) — verify đỏ vĩnh viễn vì lý do không liên quan gì tới việc đã làm xong hay chưa.

Bản đang dùng resolve main checkout ngay trong verify:

```
--dir "$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)"
```

Hai chi tiết bắt buộc, cả hai đã kiểm bằng đọc-lại field sau khi ghi (`tsk-463`):

- chuỗi verify phải được bao **single quote** khi truyền cho `fgos edit`, nếu không `$( )` bị shell expand ngay lúc ghi và biến thành một đường dẫn tuyệt đối cứng — verify sẽ chỉ chạy đúng trên đúng một máy;
- `\"` trong `grep -q "\"status\": \"wontfix\""` phải sống sót nguyên vẹn vào field. Đã đọc lại và xác nhận cả hai.

Cái bẫy thứ hai, bắt được bằng probe chứ không bằng suy luận: nhánh chứng
minh "tsk-18to đã gỡ `deps` trỏ tsk-k4v" thoạt đầu viết là
`... | grep -qv "tsk-k4v"`. **Sai và luôn xanh** — `grep -v` trả 0 khi có
ít nhất MỘT dòng không khớp, mà output JSON thì luôn có, nên nhánh đó
chứng minh rỗng. Probe thật xác nhận: `grep -qv` cho exit `0` ngay hôm nay
trong khi dep vẫn còn nguyên. Bản đúng là phủ định cả pipeline:
`! node bin/fgos.mjs list --id tsk-18to ... | grep -q "tsk-k4v"`, cho exit
`1` hôm nay và chỉ xanh khi dep thật sự biến mất.

Bài học chung cho verify: một nhánh "không được chứa X" phải được chạy thử
ở trạng thái mà nó PHẢI đỏ. Nhánh chứng minh rỗng nguy hiểm hơn nhánh
thiếu, vì nó trông như đã được chứng minh.

Cái bẫy thứ ba, lộ ra khi CHẠY THẬT lúc thi công: ngay cả bản phủ định
đúng cú pháp vẫn sai về ngữ nghĩa. `! ... | grep -q "tsk-k4v"` grep TOÀN BỘ
JSON của item, nên nó đỏ vì `description` của tsk-18to — thứ hợp lệ phải
nhắc tsk-k4v để giải thích vì sao dep bị gỡ — chứ không phải vì `deps` còn
dep. Bản đúng nhắm thẳng field: `grep -q "\"deps\": \[\],"`. Đây không phải
làm yếu check mà là sửa một check không đo được thứ nó định đo; bản mới
CHẶT hơn, vì nó khẳng định `deps` rỗng thay vì khẳng định một chuỗi vắng
mặt ở đâu đó.

Bài học chung thứ hai: grep trên JSON của cả item không phân biệt được
field với văn bản mô tả. Muốn khẳng định về một field thì phải neo vào
đúng khoá của field đó.

Cái bẫy thứ tư, thuộc về cách CHẠY verify chứ không phải nội dung nó:
`sh verify.sh | tail -12; echo $?` in ra exit của `tail`, không phải của
verify — lần chạy đầu báo `0` trong khi verify thật sự đỏ. Muốn đọc kết
quả thật thì phải redirect ra file rồi lấy `$?`, đừng bao giờ nối pipe
trước khi đọc mã thoát.

Verify cố ý kiểm **state** (`status` + `supersededBy` của cả hai item bị đóng) chứ không chỉ kiểm file, vì phần rủi ro cao nhất của item này nằm ở state ops chứ không nằm ở tài liệu. `list --id <id>` scope cả `decisions`/`outcomes` theo item (đã kiểm: `decisions: []` khi list một item chưa có decision riêng), nên `grep "\"status\": \"wontfix\""` không thể ăn nhầm chữ "wontfix" trong văn bản decision.

## Assumptions

- **A1** — Cả 5 item P1..P5 vẫn `todo` khi thi công. Đã đo 2026-08-15 lúc 13:0x; nếu đổi giữa chừng thì bước 1 dừng lại (xem ca "Trạng thái đầu vào").
- **A2** — `fgos edit --superseded-by` chấp nhận id của item ở trạng thái `retrospective` (tsk-4r1, tsk-7l9 đều đang `retrospective`). `validateSupersededBy` chỉ kiểm id có tồn tại trong tập đã biết (`work.mjs:757-760`), không kiểm status — nhưng đây là đọc code, chưa chạy thật. `fgos-coding-validating` chứng minh hoặc đánh dấu chưa chứng minh.

## Outstanding questions

None
