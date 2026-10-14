# Independent truth re-review: corrected sampled units

Author session: codex-session:21@2026-10-14
Content commit: 55ec1e0c40410b70b1e4024232a233d4e3d96b3d

Truth scope: the 20 Findings-listed corrected fragments only, shown in complete unit context. This does not certify untouched assertions in the 53-rule block or the rest of work-state. A35 reserves that full pass for promotion.

## Current corrected unit claim_64e14b949f0747d6a608e38b2d0ed08e

Complete before unit: `docs/platform/work-state/spec.md#unheaded-block-22`
Native unit SHA256: `896856e1509a84929acc35bbf336ab20a94a6f95415423205fa32a2bfe54d45c`
Shown text SHA256: `896856e1509a84929acc35bbf336ab20a94a6f95415423205fa32a2bfe54d45c`

```text
| # | Nửa | Element | Meaning | Values | Ghi khi nào |
|---|-----|---------|---------|--------|-------------|
| G1 | hỏi | câu hỏi (ask) | Điều người phải quyết trước khi việc đi tiếp (vd "OAuth hay mật khẩu?") — nhãn trạng thái đơn thuần không nói được "chờ gì" | free text (không rỗng) | lúc item vào `awaiting-human` |
| G2 | trả lời | câu trả lời (answer) | Quyết định của người; ghi xong thì item rời `awaiting-human` | free text (không rỗng) | lúc người trả lời |
| G3 | ảnh chụp gốc | `parentSnapshotAtAsk` | Ảnh `{id, title, status}` của gốc (`parent`) tại đúng lúc item vào chờ — mốc so sánh cho RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)'s "đổi-từ-lúc-hỏi"; KHÔNG BAO GIỜ tự sửa lại sau khi ghi (per str61-chat-context-continuity) | `{id, title, status}` | lúc item vào `awaiting-human`, CHỈ KHI item có `parent` giải được lúc đó |
| G4 | status trước hỏi | `statusAtAsk` | Status CHÍNH item ngay trước khi vào chờ (`todo` hay `doing`) — mốc `answer` đọc lại để biết resume về đâu (claim-lock §5.1: một claim `doing` đang giữ lúc hỏi phải resume về `doing`, không rớt xuống `todo` trần); KHÔNG BAO GIỜ tự sửa lại sau khi ghi, cùng khuôn G3 | `'todo'` \| `'doing'` | lúc item vào `awaiting-human`, LUÔN CÓ (không điều kiện như G3) |
```

Complete after unit: `docs/platform/work-state/spec.md#unheaded-block-22`
Native unit SHA256: `412aa1ea6671a21153e7a478836be52612dd86b48e8f06ac59cc3add3f4f720a`
Shown text SHA256: `412aa1ea6671a21153e7a478836be52612dd86b48e8f06ac59cc3add3f4f720a`

```text
| # | Nửa | Element | Meaning | Values | Ghi khi nào |
|---|-----|---------|---------|--------|-------------|
| G1 | hỏi | câu hỏi (ask) | Điều người phải quyết trước khi việc đi tiếp (vd "OAuth hay mật khẩu?") — nhãn trạng thái đơn thuần không nói được "chờ gì" | free text (không rỗng) | lúc item vào `awaiting-human` |
| G2 | trả lời | câu trả lời (answer) | Quyết định của người; ghi xong thì item rời `awaiting-human` | free text (không rỗng) | lúc người trả lời |
| G3 | ảnh chụp gốc | `parentSnapshotAtAsk` | Ảnh `{id, title, status}` của gốc (`parent`) tại đúng lúc item vào chờ — mốc so sánh cho RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)'s "đổi-từ-lúc-hỏi"; KHÔNG BAO GIỜ tự sửa lại sau khi ghi (per str61-chat-context-continuity) | `{id, title, status}` | lúc item vào `awaiting-human`, CHỈ KHI item có `parent` giải được lúc đó |
| G4 | status trước hỏi | `statusAtAsk` | Status do bên gọi cung cấp ngay trước hỏi, dùng cho audit; cửa ghi chụp riêng `durableStatusAtAsk` từ status bền để `answer` chọn resume. Log cũ thiếu trường bền mới fallback sang `statusAtAsk`; giá trị `doing` luôn clamp về `todo`; KHÔNG BAO GIỜ tự sửa lại sau khi ghi, cùng khuôn G3 | `'todo'` \| `'doing'` | lúc item vào `awaiting-human`, LUÔN CÓ (không điều kiện như G3) |
```

```diff
--- docs/platform/work-state/spec.md
+++ docs/platform/work-state/spec.md
@@ -6 +6 @@
-| G4 | status trước hỏi | `statusAtAsk` | Status CHÍNH item ngay trước khi vào chờ (`todo` hay `doing`) — mốc `answer` đọc lại để biết resume về đâu (claim-lock §5.1: một claim `doing` đang giữ lúc hỏi phải resume về `doing`, không rớt xuống `todo` trần); KHÔNG BAO GIỜ tự sửa lại sau khi ghi, cùng khuôn G3 | `'todo'` \| `'doing'` | lúc item vào `awaiting-human`, LUÔN CÓ (không điều kiện như G3) |+| G4 | status trước hỏi | `statusAtAsk` | Status do bên gọi cung cấp ngay trước hỏi, dùng cho audit; cửa ghi chụp riêng `durableStatusAtAsk` từ status bền để `answer` chọn resume. Log cũ thiếu trường bền mới fallback sang `statusAtAsk`; giá trị `doing` luôn clamp về `todo`; KHÔNG BAO GIỜ tự sửa lại sau khi ghi, cùng khuôn G3 | `'todo'` \| `'doing'` | lúc item vào `awaiting-human`, LUÔN CÓ (không điều kiện như G3) |
```
## Current corrected unit claim_89727d0eb13008ab3f1ed76092044a4f

Complete before unit: `docs/platform/work-state/spec.md#unheaded-block-65`
Native unit SHA256: `96b669468dbe4f3a8fd6eaa112986cead07ae88fa9de2b233f8fbf27314f9d16`
Shown text SHA256: `96b669468dbe4f3a8fd6eaa112986cead07ae88fa9de2b233f8fbf27314f9d16`

```text
`add` không còn là cửa vào của câu chuyện public (đó là `submit`, per stage-intake) — vẫn hoạt động nguyên vẹn cho test/tooling nội bộ, đòi người
gọi tự điền mọi trường (kể cả tự đặt id kebab-case), khác hẳn UX "nộp rồi đi"
của `submit`. **Đã quyết (STR22, per work-item-verb-surface): giữ `add`
làm bề mặt nội bộ, không xóa** — bộ test hiện dùng `add` để tự điền id/field
trực tiếp (9 file) tiếp tục dùng nguyên trạng; tài liệu/spec không giới thiệu
`add` như một cửa vào public ở bất kỳ đâu khác.
```

Complete after unit: `docs/platform/work-state/spec.md#unheaded-block-65`
Native unit SHA256: `72721c54253ba541180f7b7114d858ce2af06671f1fa05f45162063962b681b2`
Shown text SHA256: `72721c54253ba541180f7b7114d858ce2af06671f1fa05f45162063962b681b2`

```text
`add` không còn là cửa vào của câu chuyện public (đó là `submit`, per stage-intake) — vẫn hoạt động nguyên vẹn cho test/tooling nội bộ, đòi người
gọi điền `--title` và `--description`; `--id` tùy chọn, khi vắng thì `generateId`
sinh id `tsk-<hash>` chống trùng từ title, khác UX "nộp rồi đi" của `submit`. **Đã quyết (STR22, per work-item-verb-surface): giữ `add`
làm bề mặt nội bộ, không xóa** — bộ test hiện dùng `add` để tự điền id/field
trực tiếp trong nhiều file tiếp tục dùng nguyên trạng (ví dụ `test/cli/fgos-intake-7.test.mjs` và `test/e2e/pr-gate.test.mjs`); tài liệu/spec không giới thiệu
`add` như một cửa vào public ở bất kỳ đâu khác.
```

```diff
--- docs/platform/work-state/spec.md
+++ docs/platform/work-state/spec.md
@@ -2,2 +2,2 @@
-gọi tự điền mọi trường (kể cả tự đặt id kebab-case), khác hẳn UX "nộp rồi đi"
-của `submit`. **Đã quyết (STR22, per work-item-verb-surface): giữ `add`
+gọi điền `--title` và `--description`; `--id` tùy chọn, khi vắng thì `generateId`
+sinh id `tsk-<hash>` chống trùng từ title, khác UX "nộp rồi đi" của `submit`. **Đã quyết (STR22, per work-item-verb-surface): giữ `add`
@@ -5 +5 @@
-trực tiếp (9 file) tiếp tục dùng nguyên trạng; tài liệu/spec không giới thiệu
+trực tiếp trong nhiều file tiếp tục dùng nguyên trạng (ví dụ `test/cli/fgos-intake-7.test.mjs` và `test/e2e/pr-gate.test.mjs`); tài liệu/spec không giới thiệu

```
## Current corrected unit claim_543803710edb80a3ec320cdcdb8f880e

Complete before unit: `docs/platform/work-state/spec.md#unheaded-block-75`
Native unit SHA256: `504b6a5b42d39ff1886b7e1865b5cd54713406e8caff7f6c22e0b3085efb755d`
Shown text SHA256: `504b6a5b42d39ff1886b7e1865b5cd54713406e8caff7f6c22e0b3085efb755d`

```text
- **Runs when:** người gọi `fgos answer <id> --text "..."` để trả lời câu hỏi của một việc đang chờ.
- **Blocked when:** item không ở `awaiting-human` (không có cạnh rời chờ từ trạng thái khác) — `precondition`; câu trả lời thiếu/rỗng — `validation`; trạng thái thực khác `--expect` — `conflict`. Không ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái mang câu trả lời vào nhật ký; item về status trước lúc `ask` đậu nó (`statusAtAsk`, ghi lúc `ask`, mặc định `todo` khi vắng — log cũ/gate không mang field này) — **`todo`** nếu item chưa bị cầm claim lúc hỏi, hoặc **`doing`** nếu một claim `pick`/`take` đang sống lúc hỏi (claim-lock §5.1: trước đây LUÔN về `todo` trần, làm rớt claim đang giữ nếu `ask` xảy ra giữa lúc item `doing` — đã sửa). Bản chiếu gộp câu trả lời vào bản ghi cổng (cạnh câu hỏi đã có vẫn còn — cộng thêm, không đè).
- **Side effects:** không.
- **Afterwards:** item lại actionable — về `todo` thì xuất hiện trong `ready` khi deps đủ điều kiện; về `doing` thì KHÔNG xuất hiện trong `ready` (claim vẫn đang giữ, chờ `fgos return` như bình thường). Bản ghi cổng giữ cả câu hỏi lẫn câu trả lời để tra sau.
```

Complete after unit: `docs/platform/work-state/spec.md#unheaded-block-75`
Native unit SHA256: `31381297e4545267ec79a77e7535df60d454ddacffe884ced82a687bfcce2d2c`
Shown text SHA256: `31381297e4545267ec79a77e7535df60d454ddacffe884ced82a687bfcce2d2c`

```text
- **Runs when:** người gọi `fgos answer <id> --text "..."` để trả lời câu hỏi của một việc đang chờ.
- **Blocked when:** item không ở `awaiting-human` (không có cạnh rời chờ từ trạng thái khác) — `precondition`; câu trả lời thiếu/rỗng — `validation`; trạng thái thực khác `--expect` — `conflict`. Không ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái mang câu trả lời vào nhật ký; item về durable status trước lúc `ask` đậu nó (`durableStatusAtAsk`, do cửa ghi tính từ status bền); log cũ thiếu trường này dùng `statusAtAsk`, thiếu cả hai mặc định `todo`, và mọi giá trị `doing` đều được clamp về `todo`. `putInAwaiting` đã settle và nhả claim lúc đậu, nên trả lời không phục hồi claim cũ. Bản chiếu gộp câu trả lời vào bản ghi cổng (cạnh câu hỏi đã có vẫn còn — cộng thêm, không đè).
- **Side effects:** không.
- **Afterwards:** item không resume về `doing`; trường hợp resume về `todo` xuất hiện trong `ready` khi deps, workflow step và lineage đủ điều kiện; một lần `take` sau đó lấy claim mới. Bản ghi cổng giữ cả câu hỏi lẫn câu trả lời để tra sau.
```

```diff
--- docs/platform/work-state/spec.md
+++ docs/platform/work-state/spec.md
@@ -3 +3 @@
-- **What changes:** một sự kiện chuyển-trạng-thái mang câu trả lời vào nhật ký; item về status trước lúc `ask` đậu nó (`statusAtAsk`, ghi lúc `ask`, mặc định `todo` khi vắng — log cũ/gate không mang field này) — **`todo`** nếu item chưa bị cầm claim lúc hỏi, hoặc **`doing`** nếu một claim `pick`/`take` đang sống lúc hỏi (claim-lock §5.1: trước đây LUÔN về `todo` trần, làm rớt claim đang giữ nếu `ask` xảy ra giữa lúc item `doing` — đã sửa). Bản chiếu gộp câu trả lời vào bản ghi cổng (cạnh câu hỏi đã có vẫn còn — cộng thêm, không đè).
+- **What changes:** một sự kiện chuyển-trạng-thái mang câu trả lời vào nhật ký; item về durable status trước lúc `ask` đậu nó (`durableStatusAtAsk`, do cửa ghi tính từ status bền); log cũ thiếu trường này dùng `statusAtAsk`, thiếu cả hai mặc định `todo`, và mọi giá trị `doing` đều được clamp về `todo`. `putInAwaiting` đã settle và nhả claim lúc đậu, nên trả lời không phục hồi claim cũ. Bản chiếu gộp câu trả lời vào bản ghi cổng (cạnh câu hỏi đã có vẫn còn — cộng thêm, không đè).
@@ -5 +5 @@
-- **Afterwards:** item lại actionable — về `todo` thì xuất hiện trong `ready` khi deps đủ điều kiện; về `doing` thì KHÔNG xuất hiện trong `ready` (claim vẫn đang giữ, chờ `fgos return` như bình thường). Bản ghi cổng giữ cả câu hỏi lẫn câu trả lời để tra sau.+- **Afterwards:** item không resume về `doing`; trường hợp resume về `todo` xuất hiện trong `ready` khi deps, workflow step và lineage đủ điều kiện; một lần `take` sau đó lấy claim mới. Bản ghi cổng giữ cả câu hỏi lẫn câu trả lời để tra sau.
```
## Current corrected unit claim_c03019a0c5cb7d26def3c7f0d6f12931

Complete before unit: `docs/platform/work-state/spec.md#unheaded-block-91`
Native unit SHA256: `27a3ba1515c8ffa4c6db8e9123168b72f583293dd0d4904824848c7187fe2bf1`
Shown text SHA256: `27a3ba1515c8ffa4c6db8e9123168b72f583293dd0d4904824848c7187fe2bf1`

```text
- Mỗi item có thể khai một **`footprint`** — danh sách đường-dẫn file nó dự kiến chạm (`add --footprint a,b`). Trường phụ TÙY CHỌN, cưỡi SCHEMA_VERSION lúc bằng 2 tại thời điểm nó được thêm vào (SCHEMA_VERSION hiện hành nay là 3, per str46-io-contract), vắng-khi-không-khai; là nội dung cụ thể cho hai trường CTR003 có-tên-mà-rỗng (`forbidden_paths`/`required_outputs`). PHI-CHẶN: chỉ nuôi cố-vấn này, không vào cycle-check/frontier.
- Mỗi cặp ready chia sẻ ≥1 đường-dẫn footprint được nêu kèm đường-dẫn chung + **lựa chọn giải quyết** `sequence`/`hoist`/`re-slice`. Bên cố-vấn CHỈ gợi ý — không bao giờ tự re-slice hay sửa deps. Item không khai footprint không bao giờ xung đột.
```

Complete after unit: `docs/platform/work-state/spec.md#unheaded-block-91`
Native unit SHA256: `c6a18ec4c4d25ad879f1d641ceca294e769d4e0da33767626d17a8403c449400`
Shown text SHA256: `c6a18ec4c4d25ad879f1d641ceca294e769d4e0da33767626d17a8403c449400`

```text
- Mỗi item có thể khai một **`footprint`** — danh sách đường-dẫn file nó dự kiến chạm (`add --footprint a,b`). Trường phụ TÙY CHỌN, cưỡi SCHEMA_VERSION lúc bằng 2 tại thời điểm nó được thêm vào (SCHEMA_VERSION hiện hành nay là 3, per str46-io-contract), vắng-khi-không-khai; là nội dung cụ thể cho hai trường CTR003 có-tên-mà-rỗng (`forbidden_paths`/`required_outputs`). Không vào cycle-check/frontier; footprint còn chặn đề xuất chia có overlap bằng cổng `awaiting-human`, xếp các item xung đột vào wave khác nhau trong `computeSchedule`, và cung cấp tín hiệu cho `mergeReadiness`.
- Mỗi cặp ready chia sẻ ≥1 đường-dẫn footprint được nêu kèm đường-dẫn chung + **lựa chọn giải quyết** `sequence`/`hoist`/`re-slice`. Bên cố-vấn CHỈ gợi ý — không bao giờ tự re-slice hay sửa deps. Item không khai footprint không bao giờ xung đột.
```

```diff
--- docs/platform/work-state/spec.md
+++ docs/platform/work-state/spec.md
@@ -1 +1 @@
-- Mỗi item có thể khai một **`footprint`** — danh sách đường-dẫn file nó dự kiến chạm (`add --footprint a,b`). Trường phụ TÙY CHỌN, cưỡi SCHEMA_VERSION lúc bằng 2 tại thời điểm nó được thêm vào (SCHEMA_VERSION hiện hành nay là 3, per str46-io-contract), vắng-khi-không-khai; là nội dung cụ thể cho hai trường CTR003 có-tên-mà-rỗng (`forbidden_paths`/`required_outputs`). PHI-CHẶN: chỉ nuôi cố-vấn này, không vào cycle-check/frontier.
+- Mỗi item có thể khai một **`footprint`** — danh sách đường-dẫn file nó dự kiến chạm (`add --footprint a,b`). Trường phụ TÙY CHỌN, cưỡi SCHEMA_VERSION lúc bằng 2 tại thời điểm nó được thêm vào (SCHEMA_VERSION hiện hành nay là 3, per str46-io-contract), vắng-khi-không-khai; là nội dung cụ thể cho hai trường CTR003 có-tên-mà-rỗng (`forbidden_paths`/`required_outputs`). Không vào cycle-check/frontier; footprint còn chặn đề xuất chia có overlap bằng cổng `awaiting-human`, xếp các item xung đột vào wave khác nhau trong `computeSchedule`, và cung cấp tín hiệu cho `mergeReadiness`.

```
## Current corrected unit claim_8ffb36c0af7a1f88517179b8b1adb0a4

Complete before unit: `docs/platform/work-state/spec.md#unheaded-block-93`
Native unit SHA256: `19f7dcac1af1f366369c2b1b75261b376f12ecaabf4b65f5f0d6f92c191a712d`
Shown text SHA256: `19f7dcac1af1f366369c2b1b75261b376f12ecaabf4b65f5f0d6f92c191a712d`

```text
- **RUL1 (sự thật duy nhất là nhật ký sự kiện append-only, bản chiếu chỉ là dẫn xuất).** Sự thật duy nhất là nhật ký sự kiện append-only, được commit; bản chiếu là dẫn xuất dựng lại được từ zero — không bao giờ là truth (per 451ca088; luật nền L3).
- **RUL2 (mọi mutation đi qua đúng một cửa ghi).** Mọi mutation đi qua đúng MỘT cửa; mỗi mutation để lại đúng một sự kiện.
- **RUL3 (thứ tự ghi bất biến: sự kiện vào nhật ký trước, bản chiếu cập nhật sau).** Thứ tự ghi bất biến: sự kiện vào nhật ký TRƯỚC, bản chiếu cập nhật SAU; bản chiếu lệch thì rebuild là đường phục hồi.
- **RUL4 (chuyển trạng thái chỉ theo bảng cạnh tường minh, done terminal).** Chuyển trạng thái chỉ theo bảng cạnh tường minh; `done` terminal, không lối ra (per fd17309a; mở rộng per phase-2-routing / feed7428). `done` nay có ĐÚNG MỘT lối vào — `cleanup→done` — tới được sau một chuỗi tuần tự `delivered → retrospective → cleanup`. Hai lối vào cũ (`doing→done` thao tác tay, `awaiting-approval→done` duyệt đề xuất) KHÔNG còn tồn tại: chúng nay dừng ở `delivered`, và điều kiện "phải đi qua bước tổng hợp trước khi đóng" không còn được cưỡng chế bằng một gate gắn ở cửa `done` nữa mà bằng chính hình dạng tuần tự của chuỗi đuôi — không có đường vòng nào để lách qua `retrospective`.
- **RUL5 (ghi có kỳ vọng: trạng thái thực khác kỳ vọng thì từ chối, không ghi đè mù).** Ghi có kỳ vọng: trạng thái thực khác kỳ vọng → từ chối, không ghi đè mù.
- **RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp).** Consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp (per luật L4 / 14ebeea9).
- **RUL7 (schema item mang đủ chất liệu trả lời sáu câu hỏi harness).** Schema item mang đủ chất liệu trả lời sáu câu hỏi harness: refs (đọc gì/contract), kind (loại), risk (rủi ro), verify (proof), learn (bài học) (per luật L5).
- **RUL8 (deps phải trỏ id tồn tại, cấm tự trỏ).** Deps phải trỏ id tồn tại, cấm tự trỏ; một loại item duy nhất, không cấp bậc entity.
- **RUL9 (tầng này quản việc của chính forgent, chưa generic hóa cho consumer khác).** Tầng này quản việc của chính forgent; không generic hóa cho consumer khác khi chưa tới lượt (per 9ac6ca50).
- **RUL10 (tiền đề có ngưỡng).** Một người ghi tại một thời điểm; khi nhiều agent ghi đồng thời thành tải chính, mở lại thiết kế store theo ngưỡng đã ghi trong luật L3 (per ae461c8b). **Bổ chú (fgos-multi-session-checkout Epic 3 / STR35):** cửa ghi sự kiện `appendEvent` nay tự khóa liên-tiến-trình bằng một `.fgos/events.lock` riêng (chính sách CHẶN-có-timeout — thử lại với backoff cho tới khi thắng hoặc hết giờ, mirror `acquireSessionsLock` chứ KHÔNG phải lối lùi-không-chặn của `acquireRunnerLock`; một thể hiện thứ ba độc lập của cùng primitive wx-atomic-create + gặt-pid-chết, không đụng `runner.lock`/`sessions.lock`). Nhờ đó hai tiến trình `fgos` chạy song song không còn cùng đọc một `seq` cuối rồi cùng ghi `seq+1` — đua trùng-seq trên nhật ký append-only (đã xác nhận bằng spike) bị đóng NGAY TẠI append. Hết timeout khi giành khóa → phạm trù lỗi MỚI `lock-timeout` (tách bạch `corrupt-log`/`validation`: nghĩa là "đang có người ghi, thử lại cả thao tác", không phải hỏng dữ liệu). **Bổ chú 2 (store-atomic-rmw):** dư lượng trên — khóa chỉ đóng đua tại chính append, không đóng đua đọc-sửa-ghi cấp cao ở `store.mjs` — nay ĐÃ ĐÓNG. `events.mjs` xuất thêm `withEventsLock(logPath, fn)` (giữ nguyên `.fgos/events.lock` hiện có, không khóa mới) và `appendEventLocked` (lõi không-tự-khóa của `appendEvent`, dùng khi khóa đã đang giữ). `addWork`/`editWork`/`moveWork`/`moveStage` ở `store.mjs` nay bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStage`) trong MỘT phiên giữ khóa đó — tiến trình thứ hai giành khóa sẽ đọc lại SAU KHI sự kiện của tiến trình thứ nhất đã nằm trong nhật ký, nên tiền-kiểm của nó phát hiện đúng xung đột (`validation` "already exists" hoặc `conflict` CAS) thay vì cùng qua rồi cùng ghi. `refreshView` (dựng lại bản chiếu + ghi `state.json`) vẫn chạy SAU khi khóa nhả, không đổi. `runner.lock`/hàng-ghi ở tầng vòng lặp không đụng tới.
- **RUL12 (frontier dẫn xuất).** Việc-kế-tiếp là truy vấn dẫn xuất từ trạng thái, không bao giờ là danh sách tay; dep chỉ mở việc phụ thuộc khi việc đó thật sự đã ngã-ngũ — đề xuất chưa duyệt KHÔNG mở (per phase-2-routing / luật RUL5 (ghi có kỳ vọng: trạng thái thực khác kỳ vọng thì từ chối, không ghi đè mù) nền tảng). "Ngã-ngũ" tính từ `delivered` trở đi (`delivered`/`retrospective`/`cleanup`/`done`), cộng item bị hủy: ngưỡng thật là "code đã vào cây chính", đúng nghĩa hẹp mà `done` vốn mang không chính thức cho phép kiểm này trước khi chuỗi đuôi tách các chặng đó ra thành tên riêng. Một item đang nằm ở `retrospective`/`cleanup` vì thế không giữ chân việc phụ thuộc nào — phần đuôi là tổng-hợp và thu-hồi, không phải phần việc mà ai đó còn phải chờ.
- **RUL11 (tiến hóa schema).** Nhật ký đã commit bất khả xâm phạm — không bao giờ migration ghi đè; replay tương thích ngược có test khóa (bản ghi di sản thiếu trường nhận default khai báo, fixture nhật ký Phase 1 thật là chuẩn nghiệm thu); mỗi sự kiện mới mang phiên bản schema (per phase-2-routing / feed7428). **Miễn trừ pre-release** (viết lại tại chỗ cho phép trong lúc sản phẩm chưa phát hành, hết hiệu lực ở v1.0.0): xem `0017-mien-tru-viet-lai-nhat-ky`.
- **RUL13 (bản ghi outcome, cộng thêm không đè).** Dự đoán và thực tế của cùng một item là hai sự kiện outcome riêng, gộp theo id ở bản chiếu; nửa đến sau CỘNG THÊM vào nửa đã có, không bao giờ đè mất nửa trước (per phase-3-compound-learning / 1a80b4d3). Đây là một ca cụ thể của luật tiến hóa schema RUL11 (tiến hóa schema): cộng thêm, không migration, log cũ replay nguyên vẹn không sinh outcome nào.
- **RUL14 (cổng chờ-người, awaiting-human).** "Chờ người quyết" là một trạng thái RIÊNG, tách bạch khỏi `blocked` (kẹt vì lỗi/runner-park) — "việc đang chờ tôi" tra được sạch theo một status. Là MỘT trạng thái chung, không đẻ nhiều loại cổng (need-review/need-approval/…) khi chưa có consumer thật cần — nội dung câu hỏi/câu trả lời đã gánh phần "chờ gì". Mỗi cổng mang một cặp câu hỏi/câu trả lời cụ thể, không chỉ nhãn: câu hỏi ghi lúc vào chờ, câu trả lời ghi lúc người trả lời. Đậu VÔ THỜI HẠN — không timeout, không hết-hạn, không đánh-thức tự động; người quay lại lúc nào trả lời lúc đó. Người trả lời qua một lệnh CLI; câu trả lời thành một sự kiện trong nhật ký, rồi item RỜI `awaiting-human` về `todo` và chạy tiếp. Câu hỏi của một cổng đang chờ đọc được qua `list` sẵn có — không cần surface đọc riêng. Tất cả per 65c642a8 (khóa exploring async-human-gate).
- **RUL15 (runner/frontier loại cổng chờ-người — ràng buộc cứng).** Bộ chọn việc-sẵn-sàng và runner KHÔNG BAO GIỜ pick một item `awaiting-human`; một item có dep đang `awaiting-human` cũng không được mở (dep chỉ mở khi thật `done`). Đây là tiêu chí nghiệm thu, không phải khuyến nghị: một việc chờ người mà runner vẫn pick thì phá cả ý nghĩa cổng (per 65c642a8). Là hệ quả trực tiếp của RUL12 (chỉ `todo` mới sẵn-sàng) áp cho trạng thái mới — không cần điều kiện lọc thêm, có test khóa cả hai chiều.
- **RUL16 (submit là cơ học, không bao giờ chặn).** Phân loại tier/kind/risk của `submit` chỉ đếm từ khóa, không gọi model/AI; mô tả không khớp từ khóa nào KHÔNG BAO GIỜ chặn tạo item — luôn rơi về mặc định an toàn, luôn ghi đè được sau (per stage-intake / 9f6b52c8). **Bổ chú (self-improve loop STR13 Slice 2):** bộ từ khóa rủi-ro-nặng quyết định tier `heavy` không còn riêng của `submit` — nó là MỘT nguồn dùng chung với phép thử-từ-khóa của Iron Law (xem spec Runner "Iron Law — phân loại rủi ro của một candidate fix"), và đã được mở rộng thêm 13 từ khóa (nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán) — `submit` từ nay phân loại `heavy` cho các mô tả trùng từ khóa mới này, một thay đổi hành vi CHỦ Ý, không phải hồi quy.
- **RUL17 (mode là quy ước gọi, không phải điều kiện code).** Trường `mode` do `submit` ghi lại chế độ đã dùng khi tạo item; KHÔNG có đoạn code nào (submit, discover, hay vòng tự hành) đọc/rẽ nhánh theo giá trị của nó. Ý nghĩa của `mode` là quy ước NGƯỜI-GỌI-NÀO-NÊN-CHẠY-discover-TRƯỚC (per stage-intake / 9f6b52c8, làm rõ tại stage-clarify / 9a19eea5): `sync` gợi ý phiên đang sống nên tự gọi `discover` ngay; `async` gợi ý không ai làm vậy, để vòng tự hành lo. Dù người gọi bỏ qua gợi ý này (gọi sai chiều, hoặc không gọi gì cả), RUL18 (stage — chiều vĩ mô song song với status) đảm bảo item vẫn được xử lý.
- **RUL18 (stage — chiều vĩ mô song song với status).** Mỗi item mang thêm một trường `stage`, tách bạch khỏi `status` (vi mô): `stage` trả lời "loại tác vụ nào đang cần", `status` trả lời "việc đang ở đâu trong vòng đời của tác vụ đó". Với `coding` hôm nay bộ giá trị sống là `discovery`/`exploring`/`planning`/`executing`, cộng bí danh di sản `decompose`. Item vào hệ qua `submit` bắt đầu ở stage đầu chuỗi của domain nó (`discovery` với `coding`); qua `add` (hoặc bất kỳ item nào tạo trước tính năng này) mặc định `executing` (per stage-clarify / 9a19eea5). `stage` chỉ có nghĩa ở PHẦN ĐẦU vòng đời: từ `awaiting-approval` trở đi không còn cạnh chuyển-stage nào, nên chiều trả lời "đang ở đâu" từ đó là `status`, không phải `stage`.
- **RUL19 (vòng tự hành là lưới đỡ context-discovery, bất kể mode).** Mỗi lượt chạy, vòng tự hành quét TOÀN BỘ item đang ở stage soi-rõ của domain nó (`discovery` với `coding`) VÀ `status: todo` — không phân biệt giá trị `mode` — TRƯỚC khi giao bất kỳ việc thi công executing nào trong cùng lượt. Lượt quét cơ học này KHÔNG tự phán hộ verdict: không có verdict do người gọi cung cấp thì nó để item nguyên tại chỗ, chờ một phiên sống. Không bao giờ chạm item đang `awaiting-human` (hệ quả trực tiếp của RUL15 (runner/frontier loại cổng chờ-người — ràng buộc cứng), áp dụng cho cả sweep này). Đảm bảo không item nào kẹt vô hình dù phiên sống đã chết giữa chừng hoặc người submit bỏ đi không gọi `discover` (per stage-clarify / 9a19eea5).
- **RUL20 (settlement — kênh 1 của capture 2 kênh).** `role` là trường cộng-thêm tùy chọn trên chính ngã-ngũ (`work.move`/`work.step`) — không sinh event mới. Bản ghi settlement là bề mặt đọc dẫn xuất từ ba loại ngã-ngũ đã có (clarify-pass/answer/close), cộng thêm không đè theo id, và giữ nguyên nhật ký di sản thật (không tự "mọc" bản ghi cho một ngã-ngũ tiền-phiên-bản) (per phase-3-compound-learning S3-closeout / 96a65365; hoàn thành quyết định trì hoãn 719cbe3a).
- **RUL21 (câu-6 tự động — bài học lúc đóng).** Bất kỳ item nào tới `done` — nay qua đúng một lối vào `cleanup→done` — đều tự động sinh một bản ghi học cơ học — không phán xét, không gọi model. Soạn bài học là best-effort: lỗi soạn không bao giờ chặn việc đóng item; item không dữ liệu nào trước đó vẫn nhận một bản ghi tối thiểu, không rỗng-im-lặng (per phase-3-compound-learning S3-closeout / 96a65365).
- **RUL22 (mọi item qua chia-việc trước executing).** Item rời chuỗi soi-rõ luôn vào stage `planning` trước — dù đi thẳng (`discovery → planning`, verdict đủ rõ) hay vòng qua `exploring` (`discovery → exploring → planning`). Không có cạnh nào đi từ `discovery`/`exploring` thẳng tới `executing`: `planning → executing` là lối vào duy nhất của bước thi công. Item đơn giản được phán pass-through rẻ; chỉ item cần chia mới tốn công thật (per stage-decompose / 43f257ae).
- **RUL23 (hợp đồng con — verify thật, không placeholder).** Mỗi con sinh ra từ phán chia-việc phải mang `verify` THẬT (lệnh chạy được) ngay từ lúc sinh — con thừa hưởng ngữ cảnh đã chốt của gốc và vào thẳng `planning`, không chạy lại vòng soi-rõ của riêng nó, nên chính phán chia-việc là nơi sản xuất verify đó. Verdict có bất kỳ con nào thiếu verify là verdict KHÔNG HỢP LỆ toàn bộ: không con nào được ghi, item ở nguyên trạng cho lượt quét sau (per stage-decompose / 43f257ae).
- **RUL24 (lineage `parent` tách bạch với `deps` về lưu trữ và điều-phối).** `parent` là quan hệ lineage (hậu duệ→gốc); `deps` là quan hệ chặn. Về LƯU TRỮ và ĐIỀU-PHỐI hai quan hệ không bao giờ trộn: con của một lần chia-việc TUYỆT ĐỐI KHÔNG được ghi vào `deps` của gốc (per stage-decompose / 43f257ae). **Bổ chú (work-graph-intelligence S2a / record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)):** "tách bạch" nay giới hạn ở lưu trữ + điều-phối; cho phép kiểm PHI-CHU-TRÌNH, `deps` và `parent` được chiếu thành MỘT đồ thị cạnh-định-kiểu hợp nhất (RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)) — không mâu thuẫn: con vẫn không nằm trong `deps` của gốc, chỉ là cả hai cạnh cùng được một phép kiểm chu trình soi.
- **RUL25 (frontier chặn gốc theo lineage, gốc tự chứng minh khi bộ đóng).** Bộ lọc frontier chặn một gốc khi bất kỳ hậu duệ nào (qua chuỗi `parent`, đệ quy) chưa `done` — dẫn xuất thuần từ `parent`, không cơ chế mới. Khi hậu duệ cuối đóng, gốc tự lọt frontier như một item thường; `verify` của chính gốc (mang từ lúc rời chuỗi soi-rõ) là phép kiểm tích hợp của cả bộ — không có bước "đóng bộ" ghi riêng, không auto-`done` không chứng minh (per stage-decompose / 43f257ae).
- **RUL26 (cổng-người có điều kiện trên kết quả chia).** Con mặc định vào queue thẳng; item đậu `awaiting-human` mang đề xuất chia CHỈ KHI phán tự báo mơ hồ HOẶC risk của gốc là `heavy`. Chế độ sync hỏi ngay trong phiên, dấu vết y hệt async (per stage-decompose / 43f257ae).
- **RUL27 (settlement `clarify-pass` theo cạnh RỜI stage đầu chuỗi, có điều kiện verdict).** Bản ghi settlement kind `clarify-pass` khóa theo cạnh RỜI stage ĐẦU CHUỖI của domain nó — với `coding` hôm nay là `discovery` — không theo cạnh ĐẾN, để việc chèn stage mới ở giữa không làm câm bản ghi settlement đã có (per stage-decompose / 43f257ae); cái đổi khi `clarify` rút là stage nào giữ vai "đầu chuỗi", không phải hình dạng của luật. Tên `clarify-pass` GIỮ NGUYÊN như một nhãn di sản: nó là giá trị đã ghi vào nhật ký append-only, không phải một tên stage, nên đổi tên sẽ vô hiệu các bản ghi cũ mà chẳng được gì. RỜI stage đầu chuỗi là điều kiện CẦN nhưng không ĐỦ: từ khi một verdict `unclear` cũng đổi stage (`discovery → exploring`, item vẫn đậu `awaiting-human` với câu hỏi mở), settlement chỉ ghi khi verdict dẫn tới chính cạnh đó không phải `clear: false` — đọc từ bản ghi `work.discovery` mà `resolveDiscovery` ghi ngay trước `work.stage` của nó, chứ KHÔNG đọc cạnh ĐẾN (giữ nguyên lý do khóa-theo-cạnh-RỜI ở trên) và KHÔNG thêm trường mới vào payload (replay là fold thuần trên log đã ghi, một cờ ghi ở nguồn chỉ sửa được các cạnh ghi SAU khi sửa). Log không mang verdict đọc được (log di sản, hoặc một lệnh đổi stage chạy tay) vẫn ngã-ngũ y như trước. Hệ quả cần biết: các hop SAU đó (`exploring → planning`, `planning → executing`) KHÔNG sinh settlement — chúng không bao giờ mang cạnh RỜI `discovery`.
- **RUL28 (cửa pull take/return — mirror trung thực, không tin lời).** `take` mở đúng tập frontier runner dispatch-được (`readyWork`), không bao giờ mở một tập riêng (per stage-decompose / 43f257ae). `return` không bao giờ chuyển `doing → awaiting-approval` chỉ vì người gọi tự báo xong: nó tự đo working tree sạch + HEAD tiến so `headAtTake` (tiến bộ THẬT) + tự chạy `verify` thật của item, cùng khuôn "không tin lời" của RUL13 (bản ghi outcome, cộng thêm không đè); verify đỏ đi đúng đường `blocked` + friction như runner tự đỗ. Không sinh settlement ở `return` — settlement chỉ sinh ở cạnh `→done` (per stage-decompose), giữ đúng một nguồn sự thật cho "đóng bộ" (per 6f2cbc47, a30a3d3c).
- **RUL29 (cạnh `awaiting-approval→blocked` — gate duyệt gãy, bổ sung schema duy nhất của pr-lifecycle).** Cổng duyệt (spec Runner "Cổng duyệt PR nội bộ") khi gặp merge conflict hoặc verify đỏ sau merge chuyển item `awaiting-approval → blocked` mang `reason` bắt buộc, cùng khuôn enforce-reason với `awaiting-approval→todo` — cạnh MỚI DUY NHẤT mà feature này thêm vào bảng FSM (per pr-lifecycle / 1359ab5e). `todo` bị loại vì runner tự re-dispatch (sai nghĩa giữ-chờ-người); `blocked` đúng nghĩa kẹt-vì-lỗi. KHÔNG tự rebase, KHÔNG halt cả vòng runner — item đậu lại như mọi `blocked` khác, đi lại đường `blocked → todo/doing` sẵn có khi người xử lý xong.
- **RUL30 (`headAtReturn` — đối xứng `headAtTake`, nguồn diff của một đề xuất pull-door).** `return` verify xanh ghi thêm `headAtReturn` (HEAD host repo tại đúng thời điểm đó) lên CÙNG sự kiện `doing→awaiting-approval` (per pr-lifecycle / 1359ab5e) — cổng duyệt dùng dải `headAtTake→headAtReturn` làm nguồn diff trung thực của một đề xuất pull-door. Vắng mặt cho đề xuất runner (không qua `return`) và cho mọi đề xuất tạo trước feature này (tương thích ngược, RUL11 (tiến hóa schema)).
- **RUL31 (lãnh địa fgos tường minh, `init` chỉ đọc-và-ghi-nhận).** Lãnh địa ghi/khóa của fgos là CHÍNH XÁC `.fgos/` (data dir theo cwd) + worktree tmpdir + nhánh `fgw/*`, cộng đúng hai cửa có chủ (merge-sau-duyệt cổng review, và source repo khi một runner worker được giao việc) — mọi thứ fgos làm với file của một harness khác là READ-ONLY, không bao giờ ghi/sửa/xóa. `init` quét marker harness khác (thư mục dấu ấn + khối managed AGENTS.md) chỉ để GHI NHẬN vào manifest `.fgos/coexistence.json`, không bao giờ tạo/sửa `AGENTS.md` của host; lỗi phát hiện không chặn `init` (fail-safe), re-init idempotent (per install-coexistence / f1715488; doctrine đầy đủ: `docs/coexistence.md`).
- **RUL32 (`reason` mới nhất fold lên item, latest-wins — khác khuôn cộng-thêm-không-đè).** Trường `reason` trên một sự kiện `work.move` (reject `awaiting-approval→todo`, hoặc gate-gãy `awaiting-approval→blocked`) được fold thêm lên `item.reason` (Data Dictionary #18) — GHI ĐÈ giá trị cũ mỗi lần (latest-wins), khác hẳn khuôn "cộng thêm, không đè" của outcome/friction/settlement/discovery: đây là ngữ cảnh SỐNG cho lần dispatch kế tiếp (worker cần lý do MỚI NHẤT, không phải toàn bộ lịch sử), không phải một chuỗi ghi nhận lịch sử. Item chưa từng bị đỗ/từ chối không mang trường này — vắng mặt hoàn toàn (tương thích ngược, RUL11 (tiến hóa schema)) (per worker-execution STR33 / 396d9d9e).
- **RUL33 (cạnh `blocked→awaiting-approval` — đồng bộ-lại cơ học, cạnh MỚI DUY NHẤT mà fan-out-parallel thêm vào bảng FSM).** Khi một việc đỗ vì gãy nhập (xung đột/verify-đỏ-sau-nhập/trôi-tích-hợp) được đồng bộ-lại (catch-up) sạch, nó chuyển thẳng `blocked → awaiting-approval` — cạnh này KHÔNG mang `reason` bắt buộc (khác khuôn của `awaiting-approval→todo`/`awaiting-approval→blocked`, cùng khuôn cơ học của `blocked→todo`/`blocked→doing`) và KHÔNG BAO GIỜ đi qua `doing`, nên không tính vào ngân sách chống-lặp (`visitCount`) của việc — phân biệt rõ với người chọn cầm việc qua cửa pull để tự làm-lại tay (`blocked→doing`, có tính) (per fan-out-parallel / 2e92b7a5, xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)").
- **RUL34 (`branchHeadAtTake`/`branchHeadAtReturn` — cặp marker nguồn-nhánh, luôn tách bạch với `headAtTake`/`headAtReturn`).** Cửa pull `take`/`return` trên một item `blocked` mang nhánh sống ghi CẶP marker riêng — `branchHeadAtTake` (HEAD của NHÁNH lúc `take`, Data Dictionary #19) trên cạnh `blocked→doing`, `branchHeadAtReturn` (HEAD của NHÁNH lúc `return` đo xanh, Data Dictionary #20) trên cạnh `doing→awaiting-approval` — mirror đúng cặp `headAtTake`/`headAtReturn` main-based nhưng KHÔNG BAO GIỜ cùng xuất hiện với cặp đó trên MỘT item: một claim nguồn-nhánh ghi `branchHeadAtTake` thay vì `headAtTake`, một return nguồn-nhánh ghi `branchHeadAtReturn` thay vì `headAtReturn` — trộn hai cặp cho cùng một đề xuất khiến `reviewDiff` của cổng duyệt dựng một dải vô nghĩa (cấm tuyệt đối, kiểm bằng test). `branchHeadAtTake` là discriminator DUY NHẤT `return` dùng để rẽ nhánh nguồn-nhánh — không dùng `classifySource` (nó ưu-tiên-nhánh và nhập nhằng với một pull-take main-based mà nhánh vẫn còn sót lại) (per human-rounds / 5a6900b2, xem spec Runner RUL30 (headAtReturn — đối xứng headAtTake, nguồn diff của một đề xuất pull-door)).
- **RUL35 (domain — chiều thứ ba chi phối bộ stage, song song status/stage).** Một domain khai: danh sách stage có thứ tự, step-mapping (bước nào trong 5 bước base-workflow mỗi stage thỏa), cạnh chuyển-stage hợp lệ riêng của nó, skill ứng với mỗi stage, cộng ba khai báo ngoài chiều `stage` — có đi qua worktree/merge git thật hay không, nhãn phạm-trù cho từng status đầu chuỗi, và bộ `kind`/`risk` hợp lệ. Domain KHÔNG BAO GIỜ chi phối bảng chuyển-status (`fsm.mjs`): nó được quyền ĐẶT NHÃN cho status, không được quyền đổi cạnh; và bốn chặng đuôi (`delivered`/`retrospective`/`cleanup`/`done`) thì mọi domain đi y hệt nhau, không đặt nhãn lại được. Hôm nay tồn tại bốn domain: `coding` (sản xuất thật) cộng ba fixture minh họa `synthetic`/`triage`/`fixture-marketing` (xem "Mô hình domain" trên); cả `add`/`submit` đều có flag `--domain` (mặc định `coding` khi vắng) nối thẳng vào cửa CLI thật (per base-workflow-model / 2ae492d8, hoàn tất S1+S2). Item vắng `domain` (mọi item tạo trước base-workflow-model) đọc ra `coding` — mặc định lazy, cùng khuôn mặc định lazy của `stage`. Một giá trị `domain` lạ tại các điểm đọc nóng (frontier/vòng tự hành/bảng chuyển-stage) fail-safe về `coding` kèm cảnh báo, không throw.
- **RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị).** Quan hệ giữa các work item được mô hình hóa thành MỘT đồ thị cạnh-định-kiểu DẪN XUẤT (không phải một trường lưu trữ mới): mỗi phần tử `deps` là một cạnh **chặn** (`blocks`), mỗi `parent` là một cạnh **cha-con** (`parent-child`) — hướng cạnh là "nguồn chờ đích" (một gốc chờ hậu duệ của nó, đúng theo lineage của frontier: cạnh cha→con). Bất biến phi-chu-trình của cửa ghi phủ TOÀN đồ thị hợp nhất này (chặn + cha-con), không chỉ `deps`: `add`/`edit` từ chối mọi ghi khép một chu trình — kể cả chu trình TRỘN (một cạnh chặn cộng một chuỗi cha-con) hay chu trình cha-con thuần — với lỗi phạm trù `validation` (mã thoát 4). Đây là supersession CÓ CHỦ Ý của thiết kế "deps và parent tách bạch tuyệt đối" (record ADR0002 (mô hình việc phẳng — một loại work item, một FSM, epic là item thường) → record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)): hai quan hệ giữ lưu trữ + điều-phối riêng (RUL24 (lineage parent tách bạch với deps về lưu trữ và điều-phối)) nhưng là một đồ thị cho phép kiểm chu trình. Bốn LOẠI CẠNH của mô hình là `blocks` / `parent-child` / `waits-for` / `discovered-from`. `blocks`/`parent-child` có nguồn dữ liệu từ `deps`/`parent` và tham gia bất biến acyclic. `discovered-from` NAY CÓ trường lưu trữ thật (`discoveredFrom`, xem Data Dictionary #22) và hai nguồn sinh (tường minh lúc khai việc, hoặc tự động khi trợ lý báo phát-hiện lúc thi công — xem spec Runner "Báo việc-phát-hiện từ trợ lý", per work-graph-intelligence S2b / 8cf7effe) nhưng là cạnh KHÔNG chặn theo đúng thiết kế ban đầu — loại trừ khỏi phép kiểm chu trình. `waits-for` (chờ mềm) VẪN là TỪ VỰNG MÔ HÌNH đã khai, chưa có trường lưu trữ hay nguồn sinh — chưa có driver fgOS cụ thể nào cần tới nó, deferred có chủ ý (per work-graph-intelligence S2b / 81322763) tới khi một use-case thật xuất hiện. Chỉ hai loại cạnh chặn (`blocks`, `parent-child`) tham gia bất biến acyclic (per work-graph-intelligence S2a / b5c0ba0c, record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)).
- **RUL45 (`awaitingContext` — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm, không lưu trữ).** Với mọi item `awaiting-human` có `parent`, `list` tính thêm một khóa cộng thêm `awaitingContext[id]` — KHÔNG BAO GIỜ lưu vào bản chiếu hay nhật ký, tính lại mỗi lần đọc từ đúng dữ liệu đang có — không "session" nào sống ngoài nhật ký/bản chiếu; không có transcript nào được lưu lại hay phát lại. Nội dung luôn mang `parent: {id, title, status}` lấy từ trạng thái SỐNG hiện tại của gốc — neo luôn cập nhật, không đông cứng tại lúc hỏi; gốc trỏ một id không còn giải được trong bản chiếu degrade về không có neo (cùng khuôn dung sai id-treo đã có cho `parent`/`discoveredFrom` ở nơi khác trong schema này). Cộng thêm khóa `changedSinceAsk` — mảng `{field, from, to}` — CHỈ khi so ảnh chụp G3 (`parentSnapshotAtAsk`) với gốc hiện tại thấy khác trên `title` HOẶC `status` (so sánh chuỗi chính xác, không trim/normalize — cố ý, không phải thiếu sót); khóa này VẮNG MẶT hoàn toàn khi so ra không có gì đổi HOẶC khi item không mang G3 (item tạo trước tính năng này, hoặc gốc không giải được lúc `ask`) — hai trạng thái "đã so, không đổi" và "không có gì để so" không bao giờ lẫn vào nhau qua cùng một mảng rỗng đại diện cho cả hai. Bộ trường so sánh CHỈ gồm `title`/`status` — schema nay đã có `priority`/`intent` (Data Dictionary #25/#26, str7-str8-priority-intent) nhưng chưa được thêm vào bộ so sánh này hay assignee/owner nào khác; mở rộng bộ trường này khi có nhu cầu thật là follow-up tự nhiên, không phải khoảng hở của luật này. `list` không có item nào thuộc diện `awaiting-human`-có-`parent` thì không sinh khóa `awaitingContext` ở envelope — hành vi `list` với các repo/item không thuộc diện này y hệt trước khi tính năng này tồn tại (per str61-chat-context-continuity / 14091e58, 19330e09, bce79d8a).
- **RUL48 (thử-lại-một-lần: ĐÃ RÚT cùng với phán-quan lồng bên trong).** Luật này từng mô tả cách context-discovery và phán chia-việc xử lý một lời gọi model hỏng: lỗi thật (không phản hồi, hết giờ) rơi thẳng fail-safe, còn phản hồi thành công mà nội dung không đọc được thì gọi lại đúng MỘT lần với chỉ dẫn định dạng nghiêm ngặt hơn (per str68 / 87536f3f). Cơ chế đó không còn tồn tại: cả hai phép phán đều đã bỏ phán-quan lồng bên trong, verdict nay do người gọi cung cấp, nên không còn lời gọi model nào bên trong verb để mà thử lại. Cái CÒN NGUYÊN là kỷ luật fail-safe mà luật này bảo vệ: một verdict không đọc được hoặc không đạt hợp đồng nội dung (vd verdict chia có con thiếu verify thật) KHÔNG BAO GIỜ được âm thầm cho qua — item ở nguyên trạng cho lượt sau, không có nhãn hay trạng thái thứ ba nào phát sinh, và không bao giờ throw ra ngoài.
- **RUL49 (Compound-learning đổi trục: từ stage sang status `retrospective`).** Bước tổng hợp/học sau-thi-công từng là stage thứ tư của `coding` (`compound-learn`, chèn sau `executing`). Stage đó ĐÃ RÚT; bước này nay là một chặng trên chiều `status` — `retrospective`, nằm giữa `delivered` và `cleanup` trong chuỗi đuôi dùng chung mọi domain (Data Dictionary #4). Lý do đổi trục: phần vòng đời sau merge không còn "loại tác vụ" nào để `stage` phân biệt, chỉ còn "đang ở đâu" — đúng câu hỏi `status` trả lời. Điều luật này bảo vệ giữ nguyên: tổng hợp là một chặng quan sát-được, FSM-hóa, không phải một phản xạ có thể bị bỏ sót lặng lẽ (per compound-learn-enduser-docs / 9c67c3d1, đổi trục sau đó).
- **RUL50 (không đóng được nếu chưa qua tổng hợp — nay do hình dạng chuỗi, không do một gate riêng).** Một item không thể tới `done` mà chưa đi qua bước tổng hợp. Trước đây điều này được cưỡng chế bằng một gate gắn ở cả hai cửa vào `done`, kiểm "item đã qua stage `compound-learn` chưa". Gate đó không còn cần thiết: `done` nay chỉ có đúng một lối vào `cleanup→done`, và `cleanup` chỉ tới được từ `retrospective`, nên chuỗi tuần tự TỰ NÓ đảm bảo điều luật này — không còn đường vòng nào để lách. Điều khác biệt đáng ghi: luật này giờ áp dụng cho MỌI domain như nhau (chuỗi đuôi dùng chung), thay vì chỉ domain nào khai stage tổng hợp. Bản ghi học câu-6 tự động lúc đóng (RUL21 (câu-6 tự động — bài học lúc đóng)) không đổi.
- **RUL51 (verb `compound` — nay là cửa GẮN NHÃN, không còn là cửa chuyển stage).** `fgos compound <id>` từng là hành động chủ ý duy nhất mở lối vào stage `compound-learn`. Stage đó rút, nên verb KHÔNG còn chuyển stage nào — nó chỉ ghi nhãn tài liệu lên bản ghi outcome. Điều kiện tiên quyết đổi theo: verb đòi item đang `status: retrospective` (không còn là `awaiting-approval`) — item ở status khác bị từ chối `validation` (mã 4), không sự kiện nào ghi thêm. Cờ TÙY CHỌN `--doc-type <quadrant>`: khi có mặt, giá trị được KIỂM TRƯỚC MỌI GHI (đúng một trong bốn quadrant) — sai thì từ chối `validation` (mã 4), không sự kiện nào ghi. Cờ `--doc-path <path>` đi kèm ghi con trỏ linkage lên cùng bản ghi outcome đó — xem RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome). Vì không còn nhánh chuyển-stage nào, ca "gọi lại lần hai trên item đã ở stage tổng hợp" mà luật cũ phải xử lý riêng cũng biến mất: mọi lời gọi hợp lệ nay đi đúng một đường ghi outcome (per + producer & linkage bước-3 compound-learn-enduser-docs).
- **RUL52 (nhãn Diataxis `docType` — trường capture cộng-thêm, trực giao và tùy chọn).** Bản ghi capture của chặng tổng hợp (outcome VÀ friction) mang thêm một trường TÙY CHỌN `docType` — nhãn phân loại tài liệu Diataxis theo chiều audience, đúng một trong bốn quadrant `tutorial`/`how-to`/`reference`/`explanation`. Chiều này TRỰC GIAO với type-axis kỹ sư (pattern/decision/failure): một chiều CỘNG THÊM, không thay thế. Kiểm hình dạng chỉ KHI có mặt — giá trị ngoài bốn quadrant bị từ chối `validation`; vắng mặt/`null` luôn hợp lệ (chưa gắn nhãn), không bao giờ bắt buộc — cùng khuôn optional-additive với `docsRef` (RUL nền của Data Dictionary #23). KHÔNG event type mới, KHÔNG đổi fold: trường đi ké payload thô của `work.outcome`/`work.friction` nên sống sót replay/rebuild qua chính spread-fold sẵn có, cơ chế không đổi một byte. `fgos check` hiển thị `docType` khi có mặt (trên khối outcome và trong record friction gần nhất); log chưa có nhãn nào giữ hình dạng đầu ra byte-for-byte như trước khi trường tồn tại. BÊN SẢN XUẤT nhãn nay đã tồn tại: cờ TÙY CHỌN `--doc-type <quadrant>` trên verb `compound` (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)) ghi một `docType` thật lên bản ghi outcome — nên `fgos check` hiển thị nhãn thật, không còn chỉ là khả năng. Cờ tái dùng đúng kiểm slice-2 (giá trị ngoài bốn quadrant bị từ chối `validation`); vắng cờ thì `compound` giữ hành vi cũ byte-for-byte. Lớp phán đoán tổng hợp cấp nhãn — kỹ năng `fgos-coding-compounding`, nay kích hoạt theo STATUS `retrospective` chứ không theo một stage — nay cũng đã dựng: nó gom capture thật, phân loại quadrant, gọi `compound --doc-type`, rồi soạn tài liệu người-dùng-cuối đặt dưới `docs/<quadrant>/` có trích dẫn bằng chứng thật; skill nào ứng với status đó tra từ chính bảng skill của domain, nên một domain khác khai skill tổng-hợp riêng thì dùng skill của nó (per + producer/skill slice 3 compound-learn-enduser-docs / 6aa67ae4).
- **RUL53 (con trỏ tài liệu `docPath` — trường linkage cộng-thêm trên outcome).** Verb `compound` nhận thêm cờ TÙY CHỌN `--doc-path <path>`: khi có mặt, ghi trường `docPath` lên CÙNG bản ghi outcome mang `docType`, tại site ghi outcome của verb — trước đây verb có HAI site (một đường chuyển-stage, một đường gắn-nhãn-lại) và bỏ sót một site thì linkage bị nuốt lặng lẽ; nay verb không chuyển stage nữa nên chỉ còn đúng một đường ghi, và cái bẫy đó không còn. Trường này trực giao và tùy chọn hệt `docType` (RUL52 (nhãn Diataxis docType — trường capture cộng-thêm, trực giao và tùy chọn)): KHÔNG kiểm hình dạng (đường dẫn tự do), KHÔNG event type mới, KHÔNG đổi fold — đi ké payload thô của `work.outcome` nên sống sót replay/rebuild qua chính spread-fold sẵn có, tầng lưu không đổi một byte. Vắng cờ thì `compound` giữ hành vi cũ byte-for-byte (kể cả bare `compound` không cờ nào; chỉ có `--doc-type` mà không `--doc-path` vẫn ghi `docType` bình thường, `docPath` là `null`). `fgos check` hiển thị `docPath` khi có mặt. Con trỏ này là NỀN cho chỉ mục đọc-theo-tag (area `enduser-docs-index`): mỗi tài liệu người-dùng-cuối truy ngược được về capture đã sinh ra nó, nên khi dựng lại tài liệu (slice gộp-sống về sau) không mất chi tiết/cấu trúc (per bước-3 compound-learn-enduser-docs).
- **RUL54 (sổ verb máy-đọc không bao giờ in nhầm tham số positional thành cờ bắt buộc).** Một tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của `submit`) được đánh dấu riêng trong sổ verb máy-đọc; dạng trợ giúp chữ cho người đọc in "positional: `<tên>`" cho tham số đó, KHÔNG BAO GIỜ "required: `--<tên>`" — trước fix này, sổ verb in nhầm mọi tham số bắt buộc thành dạng cờ dù tham số chỉ nhận positional, khiến người dùng thử một cờ chưa từng hoạt động. Tham số vừa nhận positional vừa nhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt. Sổ verb máy-đọc (`--help --json`) không đổi hình dạng — chỉ dạng chữ cho người đọc đổi (per str77-79-doc-gap-fixes / ea8b9a8d).
- **RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ).** `fgos <verb> --help` (không kèm `--json`) luôn in mục trợ giúp CỦA RIÊNG verb đó, thoát mã 0, không ghi sự kiện/đổi bản chiếu/tác dụng phụ nào — áp dụng ĐỒNG NHẤT cho mọi verb kể cả `init` (gọi `init --help` không chạy `init` thật, không tạo `.fgos/`). Trước fix này, verb không có xử lý `--help` riêng: hầu hết verb rơi vào nhánh lỗi thiếu-tham-số (thoát mã 4, một dòng chẩn đoán thay vì trợ giúp thật), còn `init --help` lặng lẽ bỏ qua cờ và chạy `init` thật (tác dụng phụ ngoài ý muốn). `fgos --help` (không kèm tên verb) và `fgos <verb> --help --json` không đổi (per str77-79-doc-gap-fixes / ea8b9a8d).
- **RUL56 (`pick` — `take` + dựng workspace trong MỘT lệnh, role cố định, không rollback claim khi worktree gãy).** `fgos pick` tái dùng NGUYÊN VẸN logic claim của `take` (cùng CAS, cùng luật frontier, cùng đường tái claim nguồn-nhánh) — khác đúng một điểm: role LUÔN `session`, không có cờ `--role` (per str83-fgos-slash-commands — role cửa pull tự-hoàn-tất bằng chính phiên được dispatch, không phải một proxy). Ngay sau claim, `pick` dựng/tái dùng workspace qua CHÍNH `createWorktree` (spec Runner) — không một cơ chế dựng-worktree thứ hai. Claim và dựng-workspace không phải một giao dịch nguyên tử: nếu `createWorktree` ném lỗi SAU KHI claim đã ghi, `pick` không tự động hoàn tác claim đó — lỗi lộ ra nguyên vẹn, item ở lại `doing` không worktree, người gọi tự xử lý tiếp (per str83-fgos-slash-commands / 757e5dd7).
- **RUL57 (`init`'s cảnh báo git-headless là dữ liệu cộng-thêm, không bao giờ chặn `init`).** `init` tự kiểm project directory có HEAD git resolve được hay không, cùng kỷ luật fail-safe với bước quét coexistence-manifest liền kề: lỗi đọc (git vắng mặt, không phải repo git, hay repo có 0 commit) không bao giờ ném ra ngoài, không bao giờ đổi mã thoát của `init`. Khi không resolve được, kết quả mang thêm `gitHeadless: true` trên CÙNG phong bì `fgos.v1` đã có — một trường dữ liệu thuần, không banner riêng; đây là NHẮC SỚM cho người/agent trước khi chạm `fgos-runner`/`pick`/`take`'s worktree, vốn cần git thao tác thật — không thay thế cho kiểm tra fail-fast của chính vòng tự hành lúc khởi động (xem spec Runner "Kiểm tra tiền-điều-kiện lúc khởi động", RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)) (per D ecfd0d1a).
- **RUL59 (`priority`/`intent` — hai khóa sắp-xếp frontier, hai NGUỒN GHI tách bạch, picker vẫn cơ học vĩnh viễn per RUL42 (runner)).** `priority` (Data Dictionary #25) CHỈ ghi qua `edit --priority <n>` — một người hoặc một tác nhân tự khai tường minh, không bao giờ do picker tự suy ra. `intent` (Data Dictionary #26) do giai đoạn soi-rõ (stage `discovery`) TỰ TÍNH mỗi lần soi một item (đọc metrics đồ thị STR43 + xếp hạng tác động STR21 làm tín hiệu cơ học), ghi qua MỘT lệnh `edit` thứ hai ngay sau khi bản ghi discovery được ghi — tách bạch hoàn toàn khỏi lệnh chuyển-stage đi kèm (không bao giờ gộp vào payload của nó), và chạy CẢ khi verdict không đủ rõ để rời `discovery` (một item đậu `awaiting-human` vẫn được chấm điểm). Một lỗi ghi `intent` (vd item không qua được `validateWork` toàn phần) không bao giờ chặn kết quả phán rõ/chưa-rõ của lần đó — nuốt lặng lẽ, cùng kỷ luật fail-safe RUL48 (thử-lại-một-lần: đã rút cùng với phán-quan lồng bên trong). `intent` KHÔNG có ràng buộc dấu/khoảng ở tầng schema — khoảng 0-100 chỉ là quy ước trong prompt phán, không phải ràng buộc ghi; sửa tay được qua `edit --intent <n>` như mọi trường editable khác. Cả hai trường chỉ đổi KHÓA SẮP-XẾP mà bộ lọc frontier cơ học đọc (xem "Đọc (list / ready)" — thứ tự sẵn-sàng v2) — không bao giờ đổi TẬP HỢP item nào lọt frontier, giữ đúng RUL42 (runner spec — picker cơ học vĩnh viễn, trí tuệ vào hệ qua field trên item): picker cơ học vĩnh viễn, trí tuệ vào hệ qua đúng field-trên-item, không bao giờ qua vòng chọn-giao (per str7-str8-priority-intent).
- **RUL60 (`submit` — ba cờ ghi-đè `--tier`/`--kind`/`--risk`, độc lập từng trường; `risk` KHÔNG mirror `tier` khi có cờ).** Xem "Nộp vấn đề tự do (submit)" trên: mặc định cả ba trường vẫn suy cơ học từ mô tả (đếm từ khóa) như trước; ba cờ tùy chọn ghi đè TỪNG TRƯỜNG một cách độc lập — có `--tier` không bắt buộc phải có `--kind`/`--risk`, và ngược lại. Khi CHỈ `--tier` có mặt (không `--risk`), `risk` VẪN suy cơ học như trước — tức `risk` khi đó mirror `tier` CƠ HỌC (giá trị suy ra, không phải giá trị vừa ghi đè qua cờ) — một điểm dễ hiểu lầm: `submit "..." --tier heavy` (không `--risk`) có thể cho ra item `risk` KHÁC `heavy` nếu suy luận cơ học trên mô tả đó tự ra một bậc khác. Cờ vắng mặt không đổi hành vi cũ một byte (cùng khuôn optional-additive như `--domain`/`--deps`/`--acceptance` — RUL nền). Trường `domain` KHÔNG nằm trong phạm vi ba cờ này và không bị đụng tới (giữ nguyên hành vi cũ hoàn toàn). BÊN SẢN XUẤT giá trị cho ba cờ này từng là kỹ năng ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify), gọi trực tiếp khi có một mô tả tự do cần nộp trước cả khi `submit` chạy; skill đó đã RÚT (tsk-6ar) vì việc nó làm bị `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`, tsk-5wz) làm lại — trên bản mô tả SẠCH hơn (sau clarify, không phải trước) — cho bất kỳ phiên sống nào gọi cửa thường, không cần gọi riêng một skill nữa. Đường sản xuất còn sống hiện nay KHÔNG còn đi qua ba cờ `--tier`/`--kind`/`--risk` của chính verb `submit` mô tả ở trên — ba cờ ấy vẫn hoạt động y nguyên cho bất kỳ bên gọi nào (người, script, agent khác) muốn ghi đè trực tiếp lúc nộp, chỉ là không còn một skill đứng sẵn để tự suy luận và điền hộ chúng. **Cập nhật (cờ phân loại của `discover`):** chỗ phán lại chính thức nay là verb `discover` ở stage `discovery` — nó nhận cùng ba cờ và áp qua chốt chặn dùng chung với đường headless (xem "Chạy context-discovery (discover)" trên). `fgos edit` vẫn là cửa ghi hợp lệ cho một chỉnh tay lẻ, nhưng nó không còn là đường sản xuất được mô tả ở đây: phân loại thuộc về `discovery`, sau research, chứ không thuộc về một bước 6b nối sau `submit`.
- **RUL61 (writer — danh tính người ghi, cá thể tách bạch khỏi vai, không bao giờ chặn verb).** Ba cửa ghi `work.move`/`work.edit`/`work.stage` đều đóng dấu `writer{id,source}` (Data Dictionary #27) lên payload, không điều kiện — nguồn ưu tiên registry đối chiếu → biến môi trường → pid tổ tiên → nhãn `unresolved` (`id` vẫn là pid, không bao giờ rỗng). Registry CHỈ đối chiếu, không bao giờ tự cấp danh tính, và không bao giờ khớp theo thư mục làm việc hay pid của dòng đăng ký — giữ đúng bất biến "hai phiên khác nhau trong cùng worktree không bao giờ gộp làm một danh tính" mà khoá hoạt động cây chính (spec Runner) dựa vào. Một giá trị sai định dạng bị lọc và rơi xuống nguồn kế tiếp tại tầng phân giải, không đi qua validator nào — verb không bao giờ bị chặn vì danh tính không xác định được (per str46-io-contract).
- **RUL58 (Acceptance-clause gate — chặn ở cửa `delivered`, không phải cửa `done`).** Một item mang `acceptance` (Data Dictionary #24) với ít nhất một clause có `text` không rỗng KHÔNG thể tới `delivered` — qua CẢ HAI lối vào (`doing→delivered` thao tác tay, `awaiting-approval→delivered` duyệt đề xuất, RUL4 (chuyển trạng thái chỉ theo bảng cạnh tường minh, done terminal)) — nếu bất kỳ clause nào trong số đó thiếu `evidence` không rỗng; nỗ lực bị từ chối `precondition` (mã 2), nêu đích danh clause đầu tiên thiếu bằng chứng, item ở nguyên trạng, không sự kiện nào ghi thêm. Gate ĐỨNG Ở `delivered` chứ không phải `done` là có chủ đích: `delivered` là chỗ code thật sự vào cây chính, nên bằng chứng phải đủ TRƯỚC lúc đó — chờ tới `done` thì đã muộn ba chặng. Phép kiểm chạy TRƯỚC khi sự kiện được ghi, bên trong CÙNG phiên giữ khóa `events.lock`; cửa duyệt còn chạy sẵn cùng phép kiểm này như một bước tiền-kiểm trước mọi thao tác merge, thay vì chỉ bắt được sau khi merge đã xảy ra. Gate này CHỈ ĐỌC `item.acceptance`, không bao giờ tự ghi bằng chứng — bằng chứng được bổ sung qua `edit --acceptance` sẵn có (không có cửa ghi mới), rồi thử đóng lại: phép kiểm luôn đọc trạng thái TƯƠI, không có verdict lưu-đệm từ lần từ chối trước. Item vắng `acceptance`, hoặc mang mảng rỗng, hoàn toàn không bị gate này chạm tới — đóng y hệt hành vi trước tính năng này. Gate này mechanically chỉ kiểm SỰ HIỆN DIỆN của `evidence`, không bao giờ phán xét TÍNH ĐÚNG của nó — cùng ranh giới tin cậy mà chính CoS check của bee tự áp cho backlog PBI của nó, port sang work-item fgOS (per str73-done-flip-cos-check / 0f3b6eb0, 0e575f83).
- **RUL64 (`holder` — trục thứ ba TRỰC GIAO status × stage, opt-in per-domain, chỉ đổi qua verb `handoff`).** `work.holder` (per tsk-2t9c) là trường tùy chọn giống `stage`/`domain` — vắng mặt trên MỌI item hiện có, và vẫn hợp lệ vắng mặt trên domain nào không khai `roleGraph` trong `DOMAINS` registry. Domain CÓ khai `roleGraph` ràng buộc `holder` phải là một trong `roleGraph.roles`; domain KHÔNG khai thì `holder` phải vắng mặt tuyệt đối — ghi `holder` lên item của domain không có roleGraph bị từ chối `validation`. `holder` KHÔNG nằm trong `EDITABLE_FIELDS` (`store.mjs`) — cùng loại trừ `stage`/`status`/`domain` đã có, đổi `holder` CHỈ qua verb `fgos handoff`/`fgos handoff-return`, không bao giờ qua `edit`. `fgos handoff <id> --to <role> --reason <advise|assist|review|consult>` tra hợp lệ qua `roleGraph.edges[stage]` of domain (một cặp `{from, to, reason, mode}`); route ngoài graph bị từ chối kèm DANH SÁCH edge hợp lệ trong message — "chặn và dạy tại chỗ", không chỉ một `false`. Loại `async` ghi event `work.handoff` (đổi `holder`, checkpoint đầy đủ); loại `sync` ghi event `work.call-summary` (KHÔNG đổi `holder`, bản ghi gọn) — bất biến: `holder` chỉ đổi qua handoff async, không bao giờ qua call-summary. `fgos handoff-return <id>` đóng call async đang mở gần nhất, trả bóng về đúng người mở nó ("call = round-trip") — KHÔNG tra lại `roleGraph` (hoàn tất một call đã được duyệt hợp lệ lúc mở không cần xét hợp lệ lần hai); độ sâu call lồng (`callstackCap`, mặc định 3 trong `roleGraph`) suy ra thuần từ việc phát lại log (`callThreads[id]`, ngăn xếp LIFO trên các entry `handoff` chưa `returning`), không bao giờ một biến đếm lưu trữ — biến đếm có thể trôi khỏi log, một phép phát lại thì không. Cả hai event type gấp vào khoá LAZY `view.callThreads[id]` (mirror khuôn `view.discovery`/`view.outcomes` sẵn có) — một log không có event nào trong hai loại này phát lại y hệt trước tính năng, không `callThreads` key, không `holder` field (per tsk-2t9c).
- **RUL66 (`fgos resolve-park-reason` — xóa `reason`/`parkReason` tồn dư trên item kết thúc).** Trên item đã ở trạng thái kết thúc (`done` hoặc `wontfix`), trường `reason` hoặc `parkReason` từ một đợt đỗ cũ không còn là ngữ cảnh sống nhưng có thể gây hiểu lầm cho người đọc `fgos show`/`fgos list`. Verb `fgos resolve-park-reason <id> --note "<giải trình>"` xóa các trường này khỏi `item` (bỏ khóa `reason`/`parkReason` trên view phát lại) và lưu bản ghi giải trình vào `view.parkResolutions[id]` qua sự kiện `work.resolve-park-reason`. Chỉ áp dụng cho trạng thái kết thúc `done` hoặc `wontfix` (từ chối `validation` với mọi trạng thái khác) và bắt buộc `--note` không rỗng để đảm bảo tính giải trình audit-trail của nhật ký.
- **RUL65 (`workflows`/`resolveWorkflow` — hierarchy domain × N workflow, mechanism-first, `feature` là tham chiếu chứ không phải bản sao).** Theo tsk-2t9c: `DOMAINS.coding` có thêm `workflows` (map tên workflow → `{stages, stepMap, transitions}`), `defaultWorkflow` (`'feature'`), và `workflowFor` (map `kind` → tên workflow, RỖNG hôm nay — mọi kind fold về `defaultWorkflow`). `workflows.feature.{stages,stepMap,transitions}` KHÔNG phải bản sao của `domain.stages`/`stepMap`/`transitions` — cùng MỘT tham chiếu object (kiểm chứng bằng `===`, không chỉ deep-equal), nên không có nơi thứ hai để hai bản trôi lệch nhau. `resolveWorkflow(domain, kind)` (`workflow-stage-graphs.mjs`) là hàm phân giải: trả về `undefined` khi domain không khai `workflows` (mọi domain trừ `coding` hôm nay — cùng khuôn absent-key `roleGraphFor`/`classificationVocabulary` đã dùng), không bao giờ ném lỗi. **Cố ý CHƯA nối vào đường nóng** (`stage-fsm.mjs`, `frontier.mjs`, `intake/discovery.mjs`, `intake/plan.mjs`) — vì `workflows.feature` là CHÍNH các field domain-level đang dùng (tham chiếu giống hệt), nối dây hôm nay không đổi hành vi một byte, chỉ thêm rủi ro chỉnh sửa vào các module đã kiểm chứng kỹ mà không có lợi ích nào; nối dây thật sự chỉ cần thiết — và chỉ khi đó mới an toàn để làm — lúc workflow thứ hai (`bugfix`/`lightweight`, hoãn theo D7a) thật sự tồn tại. Bằng chứng gồng của graph đơn hiện có: 47% backlog thật (363/768 item) là `kind: bug`, và luật "chứng minh nguyên nhân trước khi sửa hành vi" khác bản chất `feature` nhưng đang chịu chung một graph.
```

Complete after unit: `docs/platform/work-state/spec.md#unheaded-block-93`
Native unit SHA256: `5c61302d66e78a5c872334e3a00927d6a8230642fd670dc0af923cad3e83f3b8`
Shown text SHA256: `5c61302d66e78a5c872334e3a00927d6a8230642fd670dc0af923cad3e83f3b8`

```text
- **RUL1 (sự thật duy nhất là nhật ký sự kiện append-only, bản chiếu chỉ là dẫn xuất).** Sự thật duy nhất là nhật ký sự kiện append-only, được commit; bản chiếu là dẫn xuất dựng lại được từ zero — không bao giờ là truth (per 451ca088; luật nền L3).
- **RUL2 (mọi mutation đi qua đúng một cửa ghi).** Mọi mutation đi qua đúng MỘT cửa; mỗi mutation để lại đúng một sự kiện.
- **RUL3 (thứ tự ghi bất biến: sự kiện vào nhật ký trước, bản chiếu cập nhật sau).** Thứ tự ghi bất biến: sự kiện vào nhật ký TRƯỚC, bản chiếu cập nhật SAU; bản chiếu lệch thì rebuild là đường phục hồi.
- **RUL4 (chuyển trạng thái chỉ theo bảng cạnh tường minh, done terminal).** Chuyển trạng thái chỉ theo bảng cạnh tường minh; `done` terminal, không lối ra (per fd17309a; mở rộng per phase-2-routing / feed7428). `done` nay có ĐÚNG MỘT lối vào — `cleanup→done` — tới được sau một chuỗi tuần tự `delivered → retrospective → cleanup`. Hai lối vào cũ (`doing→done` thao tác tay, `awaiting-approval→done` duyệt đề xuất) KHÔNG còn tồn tại: chúng nay dừng ở `delivered`, và điều kiện "phải đi qua bước tổng hợp trước khi đóng" không còn được cưỡng chế bằng một gate gắn ở cửa `done` nữa mà bằng chính hình dạng tuần tự của chuỗi đuôi — không có đường vòng nào để lách qua `retrospective`.
- **RUL5 (ghi có kỳ vọng: trạng thái thực khác kỳ vọng thì từ chối, không ghi đè mù).** Ghi có kỳ vọng: trạng thái thực khác kỳ vọng → từ chối, không ghi đè mù.
- **RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp).** Consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp (per luật L4 / 14ebeea9).
- **RUL7 (schema item mang đủ chất liệu trả lời sáu câu hỏi harness).** Schema item mang đủ chất liệu trả lời sáu câu hỏi harness: refs (đọc gì/contract), kind (loại), risk (rủi ro), verify (proof), learn (bài học) (per luật L5).
- **RUL8 (deps phải trỏ id tồn tại, cấm tự trỏ).** Deps phải trỏ id tồn tại, cấm tự trỏ; một loại item duy nhất, không cấp bậc entity.
- **RUL9 (tầng này quản việc của chính forgent, chưa generic hóa cho consumer khác).** Tầng này quản việc của chính forgent; không generic hóa cho consumer khác khi chưa tới lượt (per 9ac6ca50).
- **RUL10 (tiền đề có ngưỡng).** Một người ghi tại một thời điểm; khi nhiều agent ghi đồng thời thành tải chính, mở lại thiết kế store theo ngưỡng đã ghi trong luật L3 (per ae461c8b). **Bổ chú (fgos-multi-session-checkout Epic 3 / STR35):** cửa ghi sự kiện `appendEvent` nay tự khóa liên-tiến-trình bằng một `.fgos/events.lock` riêng (chính sách CHẶN-có-timeout — thử lại với backoff cho tới khi thắng hoặc hết giờ, mirror `acquireSessionsLock` chứ KHÔNG phải lối lùi-không-chặn của `acquireRunnerLock`; một thể hiện thứ ba độc lập của cùng primitive wx-atomic-create + gặt-pid-chết, không đụng `runner.lock`/`sessions.lock`). Nhờ đó hai tiến trình `fgos` chạy song song không còn cùng đọc một `seq` cuối rồi cùng ghi `seq+1` — đua trùng-seq trên nhật ký append-only (đã xác nhận bằng spike) bị đóng NGAY TẠI append. Hết timeout khi giành khóa → phạm trù lỗi MỚI `lock-timeout` (tách bạch `corrupt-log`/`validation`: nghĩa là "đang có người ghi, thử lại cả thao tác", không phải hỏng dữ liệu). **Bổ chú 2 (store-atomic-rmw):** dư lượng trên — khóa chỉ đóng đua tại chính append, không đóng đua đọc-sửa-ghi cấp cao ở `store.mjs` — nay ĐÃ ĐÓNG. `events.mjs` xuất thêm `withEventsLock(logPath, fn)` (giữ nguyên `.fgos/events.lock` hiện có, không khóa mới) và `appendEventLocked` (lõi không-tự-khóa của `appendEvent`, dùng khi khóa đã đang giữ). `addWork`/`editWork`/`moveWork`/`moveStep` ở `store.mjs` nay bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStep`) trong MỘT phiên giữ khóa đó — tiến trình thứ hai giành khóa sẽ đọc lại SAU KHI sự kiện của tiến trình thứ nhất đã nằm trong nhật ký, nên tiền-kiểm của nó phát hiện đúng xung đột (`validation` "already exists" hoặc `conflict` CAS) thay vì cùng qua rồi cùng ghi. `refreshView` (dựng lại bản chiếu + ghi `state.json`) vẫn chạy SAU khi khóa nhả, không đổi. `runner.lock`/hàng-ghi ở tầng vòng lặp không đụng tới.
- **RUL12 (frontier dẫn xuất).** Việc-kế-tiếp là truy vấn dẫn xuất từ trạng thái, không bao giờ là danh sách tay; dep chỉ mở việc phụ thuộc khi việc đó thật sự đã ngã-ngũ — đề xuất chưa duyệt KHÔNG mở (per phase-2-routing / luật RUL5 (ghi có kỳ vọng: trạng thái thực khác kỳ vọng thì từ chối, không ghi đè mù) nền tảng). "Ngã-ngũ" tính từ `delivered` trở đi (`delivered`/`retrospective`/`cleanup`/`done`), cộng item bị hủy: ngưỡng thật là "code đã vào cây chính", đúng nghĩa hẹp mà `done` vốn mang không chính thức cho phép kiểm này trước khi chuỗi đuôi tách các chặng đó ra thành tên riêng. Một item đang nằm ở `retrospective`/`cleanup` vì thế không giữ chân việc phụ thuộc nào — phần đuôi là tổng-hợp và thu-hồi, không phải phần việc mà ai đó còn phải chờ.
- **RUL11 (tiến hóa schema).** Nhật ký đã commit bất khả xâm phạm — không bao giờ migration ghi đè; replay tương thích ngược có test khóa (bản ghi di sản thiếu trường nhận default khai báo, fixture nhật ký Phase 1 thật là chuẩn nghiệm thu); mỗi sự kiện mới mang phiên bản schema (per phase-2-routing / feed7428). **Miễn trừ pre-release** (viết lại tại chỗ cho phép trong lúc sản phẩm chưa phát hành, hết hiệu lực ở v1.0.0): xem `0017-mien-tru-viet-lai-nhat-ky`.
- **RUL13 (bản ghi outcome, cộng thêm không đè).** Dự đoán và thực tế của cùng một item là hai sự kiện outcome riêng, gộp theo id ở bản chiếu; nửa đến sau CỘNG THÊM vào nửa đã có, không bao giờ đè mất nửa trước (per phase-3-compound-learning / 1a80b4d3). Đây là một ca cụ thể của luật tiến hóa schema RUL11 (tiến hóa schema): cộng thêm, không migration, log cũ replay nguyên vẹn không sinh outcome nào.
- **RUL14 (cổng chờ-người, awaiting-human).** "Chờ người quyết" là một trạng thái RIÊNG, tách bạch khỏi `blocked` (kẹt vì lỗi/runner-park) — "việc đang chờ tôi" tra được sạch theo một status. Là MỘT trạng thái chung, không đẻ nhiều loại cổng (need-review/need-approval/…) khi chưa có consumer thật cần — nội dung câu hỏi/câu trả lời đã gánh phần "chờ gì". Mỗi cổng mang một cặp câu hỏi/câu trả lời cụ thể, không chỉ nhãn: câu hỏi ghi lúc vào chờ, câu trả lời ghi lúc người trả lời. Đậu VÔ THỜI HẠN — không timeout, không hết-hạn, không đánh-thức tự động; người quay lại lúc nào trả lời lúc đó. Người trả lời qua một lệnh CLI; câu trả lời thành một sự kiện trong nhật ký, rồi item RỜI `awaiting-human` về `todo` và chạy tiếp. Câu hỏi của một cổng đang chờ đọc được qua `list` sẵn có — không cần surface đọc riêng. Tất cả per 65c642a8 (khóa exploring async-human-gate).
- **RUL15 (runner/frontier loại cổng chờ-người — ràng buộc cứng).** Bộ chọn việc-sẵn-sàng và runner KHÔNG BAO GIỜ pick một item `awaiting-human`; một item có dep đang `awaiting-human` cũng không được mở (dep mở ở `delivered`/`retrospective`/`cleanup`/`done` hoặc khi bị hủy). Đây là tiêu chí nghiệm thu, không phải khuyến nghị: một việc chờ người mà runner vẫn pick thì phá cả ý nghĩa cổng (per 65c642a8). Là hệ quả trực tiếp của RUL12 (chỉ `todo` mới sẵn-sàng) áp cho trạng thái mới — không cần điều kiện lọc thêm, có test khóa cả hai chiều.
- **RUL16 (submit là cơ học, không bao giờ chặn).** Phân loại size/kind/risk cơ học của `submit` (rigor là cờ tùy chọn) chỉ đếm từ khóa, không gọi model/AI; mô tả không khớp từ khóa nào KHÔNG BAO GIỜ chặn tạo item — luôn rơi về mặc định an toàn, luôn ghi đè được sau (per stage-intake / 9f6b52c8). **Bổ chú (self-improve loop STR13 Slice 2):** bộ từ khóa rủi-ro-nặng quyết định size `heavy` và risk `heavy` không còn riêng của `submit` — nó là MỘT nguồn dùng chung với phép thử-từ-khóa của Iron Law (xem spec Runner "Iron Law — phân loại rủi ro của một candidate fix"), và đã được mở rộng thêm 13 từ khóa (nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán) — `submit` từ nay phân loại `heavy` cho các mô tả trùng từ khóa mới này, một thay đổi hành vi CHỦ Ý, không phải hồi quy.
- **RUL17 (mode là quy ước gọi, không phải điều kiện code).** Trường `mode` do `submit` ghi lại chế độ đã dùng khi tạo item; KHÔNG có đoạn code nào (submit, discover, hay vòng tự hành) đọc/rẽ nhánh theo giá trị của nó. Ý nghĩa của `mode` là quy ước NGƯỜI-GỌI-NÀO-NÊN-CHẠY-discover-TRƯỚC (per stage-intake / 9f6b52c8, làm rõ tại stage-clarify / 9a19eea5): `sync` gợi ý phiên đang sống nên tự gọi `discover` ngay; `async` gợi ý không ai làm vậy, để vòng tự hành lo. Dù người gọi bỏ qua gợi ý này (gọi sai chiều, hoặc không gọi gì cả), RUL18 (stage — chiều vĩ mô song song với status) đảm bảo item vẫn được xử lý.
- **RUL18 (stage — chiều vĩ mô song song với status).** Mỗi item mang thêm một trường `stage`, tách bạch khỏi `status` (vi mô): `stage` trả lời "loại tác vụ nào đang cần", `status` trả lời "việc đang ở đâu trong vòng đời của tác vụ đó". Với `coding` hôm nay bộ giá trị sống là `discovery`/`exploring`/`planning`/`executing`, cộng bí danh di sản `decompose`. Item vào hệ qua `submit` bắt đầu ở stage đầu chuỗi của domain nó (`discovery` với `coding`); qua `add` cũng mặc định step đầu chuỗi qua `entryStepFor` (`discovery` với `coding`); chỉ bản ghi cũ không mang step mới được đọc lazy là `executing` (per stage-clarify / 9a19eea5). `stage` chỉ có nghĩa ở PHẦN ĐẦU vòng đời: từ `awaiting-approval` trở đi không còn cạnh chuyển-stage nào, nên chiều trả lời "đang ở đâu" từ đó là `status`, không phải `stage`.
- **RUL19 (vòng tự hành là lưới đỡ context-discovery, bất kể mode).** Mỗi lượt chạy, vòng tự hành quét TOÀN BỘ item đang ở stage soi-rõ của domain nó (`discovery` với `coding`) VÀ `status: todo` — không phân biệt giá trị `mode` — TRƯỚC khi giao bất kỳ việc thi công executing nào trong cùng lượt. Lượt quét dispatch worker `fgos-researching`; verdict thật của worker đi qua `resolveDiscovery`, có thể chuyển item sang `planning` hoặc `exploring` mà không cần một phiên sống ngồi chờ. Không bao giờ chạm item đang `awaiting-human` (hệ quả trực tiếp của RUL15 (runner/frontier loại cổng chờ-người — ràng buộc cứng), áp dụng cho cả sweep này). Đảm bảo không item nào kẹt vô hình dù phiên sống đã chết giữa chừng hoặc người submit bỏ đi không gọi `discover` (per stage-clarify / 9a19eea5).
- **RUL20 (settlement — kênh 1 của capture 2 kênh).** `role` là trường cộng-thêm tùy chọn trên chính ngã-ngũ (`work.move`/`work.step`) — không sinh event mới. Bản ghi settlement là bề mặt đọc dẫn xuất từ ba loại ngã-ngũ đã có (clarify-pass/answer/close), cộng thêm không đè theo id, và giữ nguyên nhật ký di sản thật (không tự "mọc" bản ghi cho một ngã-ngũ tiền-phiên-bản) (per phase-3-compound-learning S3-closeout / 96a65365; hoàn thành quyết định trì hoãn 719cbe3a).
- **RUL21 (câu-6 tự động — bài học lúc đóng).** Bất kỳ item nào tới `done` — nay qua đúng một lối vào `cleanup→done` — đều tự động sinh một bản ghi học cơ học — không phán xét, không gọi model. Soạn bài học là best-effort: lỗi soạn không bao giờ chặn việc đóng item; item không dữ liệu nào trước đó vẫn nhận một bản ghi tối thiểu, không rỗng-im-lặng (per phase-3-compound-learning S3-closeout / 96a65365).
- **RUL22 (mọi item qua chia-việc trước executing).** Item rời chuỗi soi-rõ luôn vào stage `planning` trước — dù đi thẳng (`discovery → planning`, verdict đủ rõ) hay vòng qua `exploring` (`discovery → exploring → planning`). Không có cạnh nào đi từ `discovery`/`exploring` thẳng tới `executing`: `planning → executing` là lối vào duy nhất của bước thi công. Item đơn giản được phán pass-through rẻ; chỉ item cần chia mới tốn công thật (per stage-decompose / 43f257ae).
- **RUL23 (hợp đồng con — verify thật, không placeholder).** Mỗi con sinh ra từ phán chia-việc phải mang `verify` THẬT (lệnh chạy được) ngay từ lúc sinh — con thừa hưởng ngữ cảnh đã chốt của gốc và vào thẳng `planning`, không chạy lại vòng soi-rõ của riêng nó, nên chính phán chia-việc là nơi sản xuất verify đó. Verdict có bất kỳ con nào thiếu verify là verdict KHÔNG HỢP LỆ toàn bộ: không con nào được ghi, item ở nguyên trạng cho lượt quét sau (per stage-decompose / 43f257ae).
- **RUL24 (lineage `parent` tách bạch với `deps` về lưu trữ và điều-phối).** `parent` là quan hệ lineage (hậu duệ→gốc); `deps` là quan hệ chặn. Về LƯU TRỮ và ĐIỀU-PHỐI hai quan hệ không bao giờ trộn: con của một lần chia-việc TUYỆT ĐỐI KHÔNG được ghi vào `deps` của gốc (per stage-decompose / 43f257ae). **Bổ chú (work-graph-intelligence S2a / record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)):** "tách bạch" nay giới hạn ở lưu trữ + điều-phối; cho phép kiểm PHI-CHU-TRÌNH, `deps` và `parent` được chiếu thành MỘT đồ thị cạnh-định-kiểu hợp nhất (RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)) — không mâu thuẫn: con vẫn không nằm trong `deps` của gốc, chỉ là cả hai cạnh cùng được một phép kiểm chu trình soi.
- **RUL25 (frontier chặn gốc theo lineage, gốc tự chứng minh khi bộ đóng).** Bộ lọc frontier chặn một gốc khi bất kỳ hậu duệ nào (qua chuỗi `parent`, đệ quy) chưa `done` — dẫn xuất thuần từ `parent`, không cơ chế mới. Khi hậu duệ cuối đóng, gốc tự lọt frontier như một item thường; `verify` của chính gốc (mang từ lúc rời chuỗi soi-rõ) là phép kiểm tích hợp của cả bộ — không có bước "đóng bộ" ghi riêng, không auto-`done` không chứng minh (per stage-decompose / 43f257ae).
- **RUL26 (cổng-người có điều kiện trên kết quả chia).** Con mặc định vào queue thẳng; item đậu `awaiting-human` mang đề xuất chia khi phán báo cần người, khi cổng từ khóa rủi ro đòi duyệt, khi blast-radius gate đòi duyệt, khi lần kiểm thứ hai tranh chấp verify của con, hoặc khi footprint con overlap mà chưa được phân thứ tự bằng deps. Chế độ sync hỏi ngay trong phiên, dấu vết y hệt async (per stage-decompose / 43f257ae).
- **RUL27 (settlement `clarify-pass` theo cạnh RỜI stage đầu chuỗi, có điều kiện verdict).** Bản ghi settlement kind `clarify-pass` khóa theo cạnh RỜI stage ĐẦU CHUỖI của domain nó — với `coding` hôm nay là `discovery` — không theo cạnh ĐẾN, để việc chèn stage mới ở giữa không làm câm bản ghi settlement đã có (per stage-decompose / 43f257ae); cái đổi khi `clarify` rút là stage nào giữ vai "đầu chuỗi", không phải hình dạng của luật. Tên `clarify-pass` GIỮ NGUYÊN như một nhãn di sản: nó là giá trị đã ghi vào nhật ký append-only, không phải một tên stage, nên đổi tên sẽ vô hiệu các bản ghi cũ mà chẳng được gì. RỜI stage đầu chuỗi là điều kiện CẦN nhưng không ĐỦ: từ khi một verdict `unclear` cũng đổi stage (`discovery → exploring`, item vẫn đậu `awaiting-human` với câu hỏi mở), settlement chỉ ghi khi verdict dẫn tới chính cạnh đó không phải `clear: false` — đọc từ bản ghi `work.discovery` mà `resolveDiscovery` ghi ngay trước `work.stage` của nó, chứ KHÔNG đọc cạnh ĐẾN (giữ nguyên lý do khóa-theo-cạnh-RỜI ở trên) và KHÔNG thêm trường mới vào payload (replay là fold thuần trên log đã ghi, một cờ ghi ở nguồn chỉ sửa được các cạnh ghi SAU khi sửa). Log không mang verdict đọc được (log di sản, hoặc một lệnh đổi stage chạy tay) vẫn ngã-ngũ y như trước. Hệ quả cần biết: các hop SAU đó (`exploring → planning`, `planning → executing`) KHÔNG sinh settlement — chúng không bao giờ mang cạnh RỜI `discovery`.
- **RUL28 (cửa pull take/return — mirror trung thực, không tin lời).** `take` mở đúng tập frontier runner dispatch-được (`readyWork`), không bao giờ mở một tập riêng (per stage-decompose / 43f257ae). `return` không bao giờ chuyển `doing → awaiting-approval` chỉ vì người gọi tự báo xong: nó tự đo working tree sạch + HEAD tiến so `headAtTake` (tiến bộ THẬT) + tự chạy `verify` thật của item, cùng khuôn "không tin lời" của RUL13 (bản ghi outcome, cộng thêm không đè); verify đỏ đi đúng đường `blocked` + friction như runner tự đỗ. Không sinh settlement ở `return` — settlement chỉ sinh ở cạnh `→done` (per stage-decompose), giữ đúng một nguồn sự thật cho "đóng bộ" (per 6f2cbc47, a30a3d3c).
- **RUL29 (cạnh `awaiting-approval→blocked` — gate duyệt gãy, bổ sung schema duy nhất của pr-lifecycle).** Cổng duyệt (spec Runner "Cổng duyệt PR nội bộ") khi gặp merge conflict hoặc verify đỏ sau merge chuyển item `awaiting-approval → blocked` mang `reason` bắt buộc, cùng khuôn enforce-reason với `awaiting-approval→todo` — cạnh MỚI DUY NHẤT mà feature này thêm vào bảng FSM (per pr-lifecycle / 1359ab5e). `todo` bị loại vì runner tự re-dispatch (sai nghĩa giữ-chờ-người); `blocked` đúng nghĩa kẹt-vì-lỗi. KHÔNG tự rebase, KHÔNG halt cả vòng runner — item đậu lại như mọi `blocked` khác, đi lại đường `blocked → todo/doing` sẵn có khi người xử lý xong.
- **RUL30 (`headAtReturn` — đối xứng `headAtTake`, nguồn diff của một đề xuất pull-door).** `return` verify xanh ghi thêm `headAtReturn` (HEAD host repo tại đúng thời điểm đó) lên CÙNG sự kiện settle về `awaiting-approval` (claim mới: `todo→awaiting-approval` hoặc `blocked→awaiting-approval`; không ghi bền vào `doing`) (per pr-lifecycle / 1359ab5e) — cổng duyệt dùng dải `headAtTake→headAtReturn` làm nguồn diff trung thực của một đề xuất pull-door. Vắng mặt cho đề xuất runner (không qua `return`) và cho mọi đề xuất tạo trước feature này (tương thích ngược, RUL11 (tiến hóa schema)).
- **RUL31 (lãnh địa fgos tường minh, `init` chỉ đọc-và-ghi-nhận).** Lãnh địa ghi/khóa của fgos là CHÍNH XÁC `.fgos/` (data dir theo cwd) + worktree tmpdir + nhánh `fgw/*`, cộng đúng hai cửa có chủ (merge-sau-duyệt cổng review, và source repo khi một runner worker được giao việc) — mọi thứ fgos làm với file của một harness khác là READ-ONLY, không bao giờ ghi/sửa/xóa. `init` quét marker harness khác (thư mục dấu ấn + khối managed AGENTS.md) chỉ để GHI NHẬN vào manifest `.fgos/coexistence.json`, không bao giờ tạo/sửa `AGENTS.md` của host; lỗi phát hiện không chặn `init` (fail-safe), re-init idempotent (per install-coexistence / f1715488; doctrine đầy đủ: `docs/coexistence.md`).
- **RUL32 (`reason` mới nhất fold lên item, latest-wins — khác khuôn cộng-thêm-không-đè).** Trường `reason` trên một sự kiện `work.move` (reject `awaiting-approval→todo`, hoặc gate-gãy `awaiting-approval→blocked`) được fold thêm lên `item.reason` (Data Dictionary #18) — GHI ĐÈ giá trị cũ mỗi lần (latest-wins), khác hẳn khuôn "cộng thêm, không đè" của outcome/friction/settlement/discovery: đây là ngữ cảnh SỐNG cho lần dispatch kế tiếp (worker cần lý do MỚI NHẤT, không phải toàn bộ lịch sử), không phải một chuỗi ghi nhận lịch sử. Item chưa từng bị đỗ/từ chối không mang trường này — vắng mặt hoàn toàn (tương thích ngược, RUL11 (tiến hóa schema)) (per worker-execution STR33 / 396d9d9e).
- **RUL33 (cạnh `blocked→awaiting-approval` — đồng bộ-lại cơ học, cạnh MỚI DUY NHẤT mà fan-out-parallel thêm vào bảng FSM).** Khi một việc đỗ vì gãy nhập (xung đột/verify-đỏ-sau-nhập/trôi-tích-hợp) được đồng bộ-lại (catch-up) sạch, nó chuyển thẳng `blocked → awaiting-approval` — cạnh này KHÔNG mang `reason` bắt buộc (khác khuôn của `awaiting-approval→todo`/`awaiting-approval→blocked`, cùng khuôn cơ học của `blocked→todo`/`blocked→doing`) và KHÔNG BAO GIỜ đi qua `doing`, nên không tính vào ngân sách chống-lặp (`visitCount`) của việc — phân biệt rõ với người chọn cầm việc qua cửa pull để tự làm-lại tay (claim overlay đọc effective status `doing`, không ghi cạnh bền `blocked→doing`) (per fan-out-parallel / 2e92b7a5, xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)").
- **RUL34 (`branchHeadAtTake`/`branchHeadAtReturn` — cặp marker nguồn-nhánh, luôn tách bạch với `headAtTake`/`headAtReturn`).** Cửa pull `take`/`return` trên một item `blocked` mang nhánh sống ghi CẶP marker riêng — `branchHeadAtTake` (HEAD của NHÁNH lúc `take`, Data Dictionary #19) trên claim record, `branchHeadAtReturn` (HEAD của NHÁNH lúc `return` đo xanh, Data Dictionary #20) trên settlement/lastAttempt khi về `awaiting-approval` — mirror đúng cặp `headAtTake`/`headAtReturn` main-based nhưng KHÔNG BAO GIỜ cùng xuất hiện với cặp đó trên MỘT item: một claim nguồn-nhánh ghi `branchHeadAtTake` thay vì `headAtTake`, một return nguồn-nhánh ghi `branchHeadAtReturn` thay vì `headAtReturn` — trộn hai cặp cho cùng một đề xuất khiến `reviewDiff` của cổng duyệt dựng một dải vô nghĩa (cấm tuyệt đối, kiểm bằng test). `branchHeadAtTake` là discriminator DUY NHẤT `return` dùng để rẽ nhánh nguồn-nhánh — không dùng `classifySource` (nó ưu-tiên-nhánh và nhập nhằng với một pull-take main-based mà nhánh vẫn còn sót lại) (per human-rounds / 5a6900b2, xem spec Runner RUL30 (headAtReturn — đối xứng headAtTake, nguồn diff của một đề xuất pull-door)).
- **RUL35 (domain — chiều thứ ba chi phối bộ stage, song song status/stage).** Một domain khai: danh sách stage có thứ tự, step-mapping (bước nào trong 5 bước base-workflow mỗi stage thỏa), cạnh chuyển-stage hợp lệ riêng của nó, skill ứng với mỗi stage, cộng ba khai báo ngoài chiều `stage` — có đi qua worktree/merge git thật hay không, nhãn phạm-trù cho từng status đầu chuỗi, và bộ `kind`/`risk` hợp lệ. Domain KHÔNG BAO GIỜ chi phối bảng chuyển-status (`fsm.mjs`): nó được quyền ĐẶT NHÃN cho status, không được quyền đổi cạnh; và bốn chặng đuôi (`delivered`/`retrospective`/`cleanup`/`done`) thì mọi domain đi y hệt nhau, không đặt nhãn lại được. Hôm nay tồn tại bốn domain: `coding` (sản xuất thật) cộng ba fixture minh họa `synthetic`/`triage`/`fixture-marketing` (xem "Mô hình domain" trên); cả `add`/`submit` đều có flag `--domain` (mặc định `coding` khi vắng) nối thẳng vào cửa CLI thật (per base-workflow-model / 2ae492d8, hoàn tất S1+S2). Item vắng `domain` (mọi item tạo trước base-workflow-model) đọc ra `coding` — mặc định lazy, cùng khuôn mặc định lazy của `stage`. Một giá trị `domain` lạ tại các điểm đọc nóng (frontier/vòng tự hành/bảng chuyển-stage) fail-safe về `coding` kèm cảnh báo, không throw.
- **RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị).** Quan hệ giữa các work item được mô hình hóa thành MỘT đồ thị cạnh-định-kiểu DẪN XUẤT (không phải một trường lưu trữ mới): mỗi phần tử `deps` là một cạnh **chặn** (`blocks`), mỗi `parent` là một cạnh **cha-con** (`parent-child`) — hướng cạnh là "nguồn chờ đích" (một gốc chờ hậu duệ của nó, đúng theo lineage của frontier: cạnh cha→con). Bất biến phi-chu-trình của cửa ghi phủ TOÀN đồ thị hợp nhất này (chặn + cha-con), không chỉ `deps`: `add`/`edit` từ chối mọi ghi khép một chu trình — kể cả chu trình TRỘN (một cạnh chặn cộng một chuỗi cha-con) hay chu trình cha-con thuần — với lỗi phạm trù `validation` (mã thoát 4). Đây là supersession CÓ CHỦ Ý của thiết kế "deps và parent tách bạch tuyệt đối" (record ADR0002 (mô hình việc phẳng — một loại work item, một FSM, epic là item thường) → record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)): hai quan hệ giữ lưu trữ + điều-phối riêng (RUL24 (lineage parent tách bạch với deps về lưu trữ và điều-phối)) nhưng là một đồ thị cho phép kiểm chu trình. Bốn LOẠI CẠNH của mô hình là `blocks` / `parent-child` / `waits-for` / `discovered-from`. `blocks`/`parent-child` có nguồn dữ liệu từ `deps`/`parent` và tham gia bất biến acyclic. `discovered-from` NAY CÓ trường lưu trữ thật (`discoveredFrom`, xem Data Dictionary #22) và hai nguồn sinh (tường minh lúc khai việc, hoặc tự động khi trợ lý báo phát-hiện lúc thi công — xem spec Runner "Báo việc-phát-hiện từ trợ lý", per work-graph-intelligence S2b / 8cf7effe) nhưng là cạnh KHÔNG chặn theo đúng thiết kế ban đầu — loại trừ khỏi phép kiểm chu trình. `waits-for` (chờ mềm) VẪN là TỪ VỰNG MÔ HÌNH đã khai, chưa có trường lưu trữ hay nguồn sinh — chưa có driver fgOS cụ thể nào cần tới nó, deferred có chủ ý (per work-graph-intelligence S2b / 81322763) tới khi một use-case thật xuất hiện. Chỉ hai loại cạnh chặn (`blocks`, `parent-child`) tham gia bất biến acyclic (per work-graph-intelligence S2a / b5c0ba0c, record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)).
- **RUL45 (`awaitingContext` — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm, không lưu trữ).** Với mọi item `awaiting-human` có `parent`, `list` tính thêm một khóa cộng thêm `awaitingContext[id]` — KHÔNG BAO GIỜ lưu vào bản chiếu hay nhật ký, tính lại mỗi lần đọc từ đúng dữ liệu đang có — không "session" nào sống ngoài nhật ký/bản chiếu; không có transcript nào được lưu lại hay phát lại. Nội dung luôn mang `parent: {id, title, status}` lấy từ trạng thái SỐNG hiện tại của gốc — neo luôn cập nhật, không đông cứng tại lúc hỏi; gốc trỏ một id không còn giải được trong bản chiếu degrade về không có neo (cùng khuôn dung sai id-treo đã có cho `parent`/`discoveredFrom` ở nơi khác trong schema này). Cộng thêm khóa `changedSinceAsk` — mảng `{field, from, to}` — CHỈ khi so ảnh chụp G3 (`parentSnapshotAtAsk`) với gốc hiện tại thấy khác trên `title` HOẶC `status` (so sánh chuỗi chính xác, không trim/normalize — cố ý, không phải thiếu sót); khóa này VẮNG MẶT hoàn toàn khi so ra không có gì đổi HOẶC khi item không mang G3 (item tạo trước tính năng này, hoặc gốc không giải được lúc `ask`) — hai trạng thái "đã so, không đổi" và "không có gì để so" không bao giờ lẫn vào nhau qua cùng một mảng rỗng đại diện cho cả hai. Bộ trường so sánh CHỈ gồm `title`/`status` — schema nay đã có `priority`/`intent` (Data Dictionary #25/#26, str7-str8-priority-intent) nhưng chưa được thêm vào bộ so sánh này hay assignee/owner nào khác; mở rộng bộ trường này khi có nhu cầu thật là follow-up tự nhiên, không phải khoảng hở của luật này. `list` không có item nào thuộc diện `awaiting-human`-có-`parent` thì không sinh khóa `awaitingContext` ở envelope — hành vi `list` với các repo/item không thuộc diện này y hệt trước khi tính năng này tồn tại (per str61-chat-context-continuity / 14091e58, 19330e09, bce79d8a).
- **RUL48 (thử-lại-một-lần: ĐÃ RÚT cùng với phán-quan lồng bên trong).** Luật này từng mô tả cách context-discovery và phán chia-việc xử lý một lời gọi model hỏng: lỗi thật (không phản hồi, hết giờ) rơi thẳng fail-safe, còn phản hồi thành công mà nội dung không đọc được thì gọi lại đúng MỘT lần với chỉ dẫn định dạng nghiêm ngặt hơn (per str68 / 87536f3f). Cơ chế đó không còn tồn tại: cả hai phép phán đều đã bỏ phán-quan lồng bên trong, verdict nay do người gọi cung cấp, nên không còn lời gọi model nào bên trong verb để mà thử lại. Cái CÒN NGUYÊN là kỷ luật fail-safe mà luật này bảo vệ: một verdict không đọc được hoặc không đạt hợp đồng nội dung (vd verdict chia có con thiếu verify thật) KHÔNG BAO GIỜ được âm thầm cho qua — item ở nguyên trạng cho lượt sau, không có nhãn hay trạng thái thứ ba nào phát sinh, và không bao giờ throw ra ngoài.
- **RUL49 (Compound-learning đổi trục: từ stage sang status `retrospective`).** Bước tổng hợp/học sau-thi-công từng là stage thứ tư của `coding` (`compound-learn`, chèn sau `executing`). Stage đó ĐÃ RÚT; bước này nay là một chặng trên chiều `status` — `retrospective`, nằm giữa `delivered` và `cleanup` trong chuỗi đuôi dùng chung mọi domain (Data Dictionary #4). Lý do đổi trục: phần vòng đời sau merge không còn "loại tác vụ" nào để `stage` phân biệt, chỉ còn "đang ở đâu" — đúng câu hỏi `status` trả lời. Điều luật này bảo vệ giữ nguyên: tổng hợp là một chặng quan sát-được, FSM-hóa, không phải một phản xạ có thể bị bỏ sót lặng lẽ (per compound-learn-enduser-docs / 9c67c3d1, đổi trục sau đó).
- **RUL50 (không đóng được nếu chưa qua tổng hợp — nay do hình dạng chuỗi, không do một gate riêng).** Một item không thể tới `done` mà chưa đi qua bước tổng hợp. Trước đây điều này được cưỡng chế bằng một gate gắn ở cả hai cửa vào `done`, kiểm "item đã qua stage `compound-learn` chưa". Gate đó không còn cần thiết: `done` nay chỉ có đúng một lối vào `cleanup→done`, và `cleanup` chỉ tới được từ `retrospective`, nên chuỗi tuần tự TỰ NÓ đảm bảo điều luật này — không còn đường vòng nào để lách. Điều khác biệt đáng ghi: luật này giờ áp dụng cho MỌI domain như nhau (chuỗi đuôi dùng chung), thay vì chỉ domain nào khai stage tổng hợp. Bản ghi học câu-6 tự động lúc đóng (RUL21 (câu-6 tự động — bài học lúc đóng)) không đổi.
- **RUL51 (verb `compound` — nay là cửa GẮN NHÃN, không còn là cửa chuyển stage).** `fgos compound <id>` từng là hành động chủ ý duy nhất mở lối vào stage `compound-learn`. Stage đó rút, nên verb KHÔNG còn chuyển stage nào — nó chỉ ghi nhãn tài liệu lên bản ghi outcome. Điều kiện tiên quyết đổi theo: verb đòi item đang `status: retrospective` (không còn là `awaiting-approval`) — item ở status khác bị từ chối `validation` (mã 4), không sự kiện nào ghi thêm. Cờ TÙY CHỌN `--doc-type <quadrant>`: khi có mặt, giá trị được KIỂM TRƯỚC MỌI GHI (đúng một trong bốn quadrant) — sai thì từ chối `validation` (mã 4), không sự kiện nào ghi. Cờ `--doc-path <path>` đi kèm ghi con trỏ linkage lên cùng bản ghi outcome đó — xem RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome). Vì không còn nhánh chuyển-stage nào, ca "gọi lại lần hai trên item đã ở stage tổng hợp" mà luật cũ phải xử lý riêng cũng biến mất: mọi lời gọi hợp lệ nay đi đúng một đường ghi outcome (per + producer & linkage bước-3 compound-learn-enduser-docs).
- **RUL52 (nhãn Diataxis `docType` — trường capture cộng-thêm, trực giao và tùy chọn).** Bản ghi capture của chặng tổng hợp (outcome VÀ friction) mang thêm một trường TÙY CHỌN `docType` — nhãn phân loại tài liệu Diataxis theo chiều audience, đúng một trong bốn quadrant `tutorial`/`how-to`/`reference`/`explanation`. Chiều này TRỰC GIAO với type-axis kỹ sư (pattern/decision/failure): một chiều CỘNG THÊM, không thay thế. Kiểm hình dạng chỉ KHI có mặt — giá trị ngoài bốn quadrant bị từ chối `validation`; vắng mặt/`null` luôn hợp lệ (chưa gắn nhãn), không bao giờ bắt buộc — cùng khuôn optional-additive với `docsRef` (RUL nền của Data Dictionary #23). KHÔNG event type mới, KHÔNG đổi fold: trường đi ké payload thô của `work.outcome`/`work.friction` nên sống sót replay/rebuild qua chính spread-fold sẵn có, cơ chế không đổi một byte. `fgos check` hiển thị `docType` khi có mặt (trên khối outcome và trong record friction gần nhất); log chưa có nhãn nào giữ hình dạng đầu ra byte-for-byte như trước khi trường tồn tại. BÊN SẢN XUẤT nhãn nay đã tồn tại: cờ TÙY CHỌN `--doc-type <quadrant>` trên verb `compound` (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)) ghi một `docType` thật lên bản ghi outcome — nên `fgos check` hiển thị nhãn thật, không còn chỉ là khả năng. Cờ tái dùng đúng kiểm slice-2 (giá trị ngoài bốn quadrant bị từ chối `validation`); vắng cờ thì `compound` giữ hành vi cũ byte-for-byte. Lớp phán đoán tổng hợp cấp nhãn — kỹ năng `fgos-coding-compounding`, nay kích hoạt theo STATUS `retrospective` chứ không theo một stage — nay cũng đã dựng: nó gom capture thật, phân loại quadrant, gọi `compound --doc-type`, rồi soạn tài liệu người-dùng-cuối đặt dưới `docs/<quadrant>/` có trích dẫn bằng chứng thật; skill nào ứng với status đó tra từ chính bảng skill của domain, nên một domain khác khai skill tổng-hợp riêng thì dùng skill của nó (per + producer/skill slice 3 compound-learn-enduser-docs / 6aa67ae4).
- **RUL53 (con trỏ tài liệu `docPath` — trường linkage cộng-thêm trên outcome).** Verb `compound` nhận thêm cờ TÙY CHỌN `--doc-path <path>`: khi có mặt, ghi trường `docPath` lên CÙNG bản ghi outcome mang `docType`, tại site ghi outcome của verb — trước đây verb có HAI site (một đường chuyển-stage, một đường gắn-nhãn-lại) và bỏ sót một site thì linkage bị nuốt lặng lẽ; nay verb không chuyển stage nữa nên chỉ còn đúng một đường ghi, và cái bẫy đó không còn. Trường này trực giao và tùy chọn hệt `docType` (RUL52 (nhãn Diataxis docType — trường capture cộng-thêm, trực giao và tùy chọn)): `compound` (đã deprecated, khuyến nghị `fgos doc`) đòi đường dẫn đã commit ở HEAD của main checkout; khi bật `docRegistry.enforce`, đường dẫn phải là currentPath đã đăng ký, không ambiguous hay alias, KHÔNG event type mới, KHÔNG đổi fold — đi ké payload thô của `work.outcome` nên sống sót replay/rebuild qua chính spread-fold sẵn có, tầng lưu không đổi một byte. Vắng cờ thì `compound` giữ hành vi cũ byte-for-byte (kể cả bare `compound` không cờ nào; chỉ có `--doc-type` mà không `--doc-path` vẫn ghi `docType` bình thường, `docPath` là `null`). `fgos check` hiển thị `docPath` khi có mặt. Con trỏ này là NỀN cho chỉ mục đọc-theo-tag (area `enduser-docs-index`): mỗi tài liệu người-dùng-cuối truy ngược được về capture đã sinh ra nó, nên khi dựng lại tài liệu (slice gộp-sống về sau) không mất chi tiết/cấu trúc (per bước-3 compound-learn-enduser-docs).
- **RUL54 (sổ verb máy-đọc không bao giờ in nhầm tham số positional thành cờ bắt buộc).** Một tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của `submit`) được đánh dấu riêng trong sổ verb máy-đọc; dạng trợ giúp chữ cho người đọc in "positional: `<tên>`" cho tham số đó, KHÔNG BAO GIỜ "required: `--<tên>`" — trước fix này, sổ verb in nhầm mọi tham số bắt buộc thành dạng cờ dù tham số chỉ nhận positional, khiến người dùng thử một cờ chưa từng hoạt động. Tham số vừa nhận positional vừa nhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt. Sổ verb máy-đọc (`--help --json`) không đổi hình dạng — chỉ dạng chữ cho người đọc đổi (per str77-79-doc-gap-fixes / ea8b9a8d).
- **RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ).** `fgos <verb> --help` (không kèm `--json`) luôn in mục trợ giúp CỦA RIÊNG verb đó, thoát mã 0, không ghi sự kiện/đổi bản chiếu/tác dụng phụ nào — áp dụng ĐỒNG NHẤT cho mọi verb kể cả `init` (gọi `init --help` không chạy `init` thật, không tạo `.fgos/`). Trước fix này, verb không có xử lý `--help` riêng: hầu hết verb rơi vào nhánh lỗi thiếu-tham-số (thoát mã 4, một dòng chẩn đoán thay vì trợ giúp thật), còn `init --help` lặng lẽ bỏ qua cờ và chạy `init` thật (tác dụng phụ ngoài ý muốn). `fgos --help` (không kèm tên verb) và `fgos <verb> --help --json` không đổi (per str77-79-doc-gap-fixes / ea8b9a8d).
- **RUL56 (`pick` — `take` + dựng workspace trong MỘT lệnh, role cố định, không rollback claim khi worktree gãy).** `fgos pick` tái dùng NGUYÊN VẸN logic claim của `take` (cùng CAS, cùng luật frontier, cùng đường tái claim nguồn-nhánh) — khác đúng một điểm: role LUÔN `session`, không có cờ `--role` (per str83-fgos-slash-commands — role cửa pull tự-hoàn-tất bằng chính phiên được dispatch, không phải một proxy). Ngay sau claim, `pick` dựng/tái dùng workspace qua CHÍNH `createWorktree` (spec Runner) — không một cơ chế dựng-worktree thứ hai. Claim và dựng-workspace không phải một giao dịch nguyên tử: nếu `createWorktree` ném lỗi SAU KHI claim đã ghi, `pick` không tự động hoàn tác claim đó — lỗi lộ ra nguyên vẹn, item ở lại `doing` không worktree, người gọi tự xử lý tiếp (per str83-fgos-slash-commands / 757e5dd7).
- **RUL57 (`init`'s cảnh báo git-headless là dữ liệu cộng-thêm, không bao giờ chặn `init`).** `init` tự kiểm project directory có HEAD git resolve được hay không, cùng kỷ luật fail-safe với bước quét coexistence-manifest liền kề: lỗi đọc (git vắng mặt, không phải repo git, hay repo có 0 commit) không bao giờ ném ra ngoài, không bao giờ đổi mã thoát của `init`. Khi không resolve được, kết quả mang thêm `gitHeadless: true` trên CÙNG phong bì `fgos.v1` đã có — một trường dữ liệu thuần, không banner riêng; đây là NHẮC SỚM cho người/agent trước khi chạm `fgos-runner`/`pick`/`take`'s worktree, vốn cần git thao tác thật — không thay thế cho kiểm tra fail-fast của chính vòng tự hành lúc khởi động (xem spec Runner "Kiểm tra tiền-điều-kiện lúc khởi động", RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)) (per D ecfd0d1a).
- **RUL59 (`priority` — khóa sắp-xếp frontier; `intent` đã retired in place, picker vẫn cơ học vĩnh viễn per RUL42 (runner)).** `priority` (Data Dictionary #25) ghi được qua `edit --priority <n>`; discovery còn tính `priority` bằng `computeImpact` và `computePriority` mỗi lần có verdict, rồi ghi `{priority}` qua `editWork` trong một cửa ghi riêng ngay sau bản ghi discovery. Phép ghi nằm trong `try/catch` riêng để lỗi store/lock không chặn kết quả clear/unclear. `intent` (Data Dictionary #26) đã retired in place, không còn là trường discovery tự tính. Priority đổi khóa sắp-xếp của frontier cơ học, không tự đổi tập item lọt frontier (per str7-str8-priority-intent).
- **RUL60 (`submit` — cờ phân loại hiện hành).** `--tier` đã retired và bị từ chối với hướng dẫn dùng `--size` hoặc `--rigor`; `--size`/`--rigor`/`--kind`/`--risk` là các cờ ghi đè độc lập hiện hành. Khi không ghi đè, `submit` dùng phân loại cơ học; risk không được lấy từ size do bên gọi ghi đè. `domain` là trường riêng. Kỹ năng ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify) đã RÚT (tsk-6ar); `/fgOS:submit` bước 6 làm clarify/classify trong phiên sống trên mô tả sau clarify. Chỗ phán lại chính thức là `discover` ở discovery, sau research; phần mô tả cờ tier cũ không phải hợp đồng CLI còn sống.
- **RUL61 (writer — danh tính người ghi, cá thể tách bạch khỏi vai, không bao giờ chặn verb).** Ba cửa ghi `work.move`/`work.edit`/`work.step` đều đóng dấu `writer{id,source}` (Data Dictionary #27) lên payload, không điều kiện — nguồn ưu tiên registry đối chiếu → biến môi trường → pid tổ tiên → nhãn `unresolved` (`id` vẫn là pid, không bao giờ rỗng). Registry CHỈ đối chiếu, không bao giờ tự cấp danh tính, và không bao giờ khớp theo thư mục làm việc hay pid của dòng đăng ký — giữ đúng bất biến "hai phiên khác nhau trong cùng worktree không bao giờ gộp làm một danh tính" mà khoá hoạt động cây chính (spec Runner) dựa vào. Một giá trị sai định dạng bị lọc và rơi xuống nguồn kế tiếp tại tầng phân giải, không đi qua validator nào — verb không bao giờ bị chặn vì danh tính không xác định được (per str46-io-contract).
- **RUL58 (Acceptance-clause gate — chặn ở cửa `delivered`, không phải cửa `done`).** Một item mang `acceptance` (Data Dictionary #24) với ít nhất một clause có `text` không rỗng KHÔNG thể tới `delivered` — qua CẢ HAI lối vào (`doing→delivered` thao tác tay, `awaiting-approval→delivered` duyệt đề xuất, RUL4 (chuyển trạng thái chỉ theo bảng cạnh tường minh, done terminal)) — nếu bất kỳ clause nào trong số đó thiếu `evidence` không rỗng; nỗ lực bị từ chối `precondition` (mã 2), nêu đích danh clause đầu tiên thiếu bằng chứng, item ở nguyên trạng, không sự kiện nào ghi thêm. Gate ĐỨNG Ở `delivered` chứ không phải `done` là có chủ đích: `delivered` là chỗ code thật sự vào cây chính, nên bằng chứng phải đủ TRƯỚC lúc đó — chờ tới `done` thì đã muộn ba chặng. Phép kiểm chạy TRƯỚC khi sự kiện được ghi, bên trong CÙNG phiên giữ khóa `events.lock`; cửa duyệt còn chạy sẵn cùng phép kiểm này như một bước tiền-kiểm trước mọi thao tác merge, thay vì chỉ bắt được sau khi merge đã xảy ra. Gate này CHỈ ĐỌC `item.acceptance`, không bao giờ tự ghi bằng chứng — bằng chứng được bổ sung qua `edit --acceptance` sẵn có (không có cửa ghi mới), rồi thử đóng lại: phép kiểm luôn đọc trạng thái TƯƠI, không có verdict lưu-đệm từ lần từ chối trước. Item vắng `acceptance`, hoặc mang mảng rỗng, hoàn toàn không bị gate này chạm tới — đóng y hệt hành vi trước tính năng này. Gate này mechanically chỉ kiểm SỰ HIỆN DIỆN của `evidence`, không bao giờ phán xét TÍNH ĐÚNG của nó — cùng ranh giới tin cậy mà chính CoS check của bee tự áp cho backlog PBI của nó, port sang work-item fgOS (per str73-done-flip-cos-check / 0f3b6eb0, 0e575f83).
- **RUL64 (`holder` — trục thứ ba TRỰC GIAO status × stage, opt-in per-domain, chỉ đổi qua verb `handoff`).** `work.holder` (per tsk-2t9c) là trường tùy chọn giống `stage`/`domain` — vắng mặt trên MỌI item hiện có, và vẫn hợp lệ vắng mặt trên domain nào không khai `roleGraph` trong `DOMAINS` registry. Domain CÓ khai `roleGraph` ràng buộc `holder` phải là một trong `roleGraph.roles`; domain KHÔNG khai thì `holder` phải vắng mặt tuyệt đối — ghi `holder` lên item của domain không có roleGraph bị từ chối `validation`. `holder` KHÔNG nằm trong `EDITABLE_FIELDS` (`store.mjs`) — cùng loại trừ `stage`/`status`/`domain` đã có, đổi `holder` CHỈ qua verb `fgos handoff`/`fgos handoff-return`, không bao giờ qua `edit`. `fgos handoff <id> --to <role> --reason <advise|assist|review|consult>` tra hợp lệ qua `roleGraph.edges[stage]` of domain (một cặp `{from, to, reason, mode}`); route ngoài graph bị từ chối kèm DANH SÁCH edge hợp lệ trong message — "chặn và dạy tại chỗ", không chỉ một `false`. Loại `async` ghi event `work.handoff` (đổi `holder`, checkpoint đầy đủ); loại `sync` ghi event `work.call-summary` (KHÔNG đổi `holder`, bản ghi gọn) — bất biến: `holder` chỉ đổi qua handoff async, không bao giờ qua call-summary. `fgos handoff-return <id>` đóng call async đang mở gần nhất, trả bóng về đúng người mở nó ("call = round-trip") — KHÔNG tra lại `roleGraph` (hoàn tất một call đã được duyệt hợp lệ lúc mở không cần xét hợp lệ lần hai); độ sâu call lồng (`callstackCap`, mặc định 3 trong `roleGraph`) suy ra thuần từ việc phát lại log (`callThreads[id]`, ngăn xếp LIFO trên các entry `handoff` chưa `returning`), không bao giờ một biến đếm lưu trữ — biến đếm có thể trôi khỏi log, một phép phát lại thì không. Cả hai event type gấp vào khoá LAZY `view.callThreads[id]` (mirror khuôn `view.discovery`/`view.outcomes` sẵn có) — một log không có event nào trong hai loại này phát lại y hệt trước tính năng, không `callThreads` key, không `holder` field (per tsk-2t9c).
- **RUL66 (`fgos resolve-park-reason` — xóa `reason`/`parkReason` tồn dư trên item kết thúc).** Trên item đã ở trạng thái kết thúc (`done` hoặc `wontfix`), trường `reason` hoặc `parkReason` từ một đợt đỗ cũ không còn là ngữ cảnh sống nhưng có thể gây hiểu lầm cho người đọc `fgos show`/`fgos list`. Verb `fgos resolve-park-reason <id> --note "<giải trình>"` xóa các trường này khỏi `item` (bỏ khóa `reason`/`parkReason` trên view phát lại) và lưu bản ghi giải trình vào `view.parkResolutions[id]` qua sự kiện `work.resolve-park-reason`. Chỉ áp dụng cho trạng thái kết thúc `done` hoặc `wontfix` (từ chối `validation` với mọi trạng thái khác) và bắt buộc `--note` không rỗng để đảm bảo tính giải trình audit-trail của nhật ký.
- **RUL65 (`workflows`/`resolveWorkflow` — hierarchy domain × N workflow, mechanism-first, `feature` là tham chiếu chứ không phải bản sao).** Theo tsk-2t9c: `DOMAINS.coding` có thêm `workflows` (map tên workflow → `{stages, stepMap, transitions}`), `defaultWorkflow` (`'feature'`), và `workflowFor` (map `kind` → tên workflow, RỖNG hôm nay — mọi kind fold về `defaultWorkflow`). `workflows.feature.{stages,stepMap,transitions}` KHÔNG phải bản sao của `domain.stages`/`stepMap`/`transitions` — cùng MỘT tham chiếu object (kiểm chứng bằng `===`, không chỉ deep-equal), nên không có nơi thứ hai để hai bản trôi lệch nhau. `resolveWorkflow(domain, kind)` (`workflow-stage-graphs.mjs`) là hàm phân giải: trả về `undefined` khi domain không khai `workflows` (mọi domain trừ `coding` hôm nay — cùng khuôn absent-key `roleGraphFor`/`classificationVocabulary` đã dùng), không bao giờ ném lỗi. **Cố ý CHƯA nối vào đường nóng** (`stage-fsm.mjs`, `frontier.mjs`, `intake/discovery.mjs`, `intake/plan.mjs`) — vì `workflows.feature` là CHÍNH các field domain-level đang dùng (tham chiếu giống hệt), nối dây hôm nay không đổi hành vi một byte, chỉ thêm rủi ro chỉnh sửa vào các module đã kiểm chứng kỹ mà không có lợi ích nào; nối dây thật sự chỉ cần thiết — và chỉ khi đó mới an toàn để làm — lúc workflow thứ hai (`bugfix`/`lightweight`, hoãn theo D7a) thật sự tồn tại. Bằng chứng gồng của graph đơn hiện có: 47% backlog thật (363/768 item) là `kind: bug`, và luật "chứng minh nguyên nhân trước khi sửa hành vi" khác bản chất `feature` nhưng đang chịu chung một graph.
```

```diff
--- docs/platform/work-state/spec.md
+++ docs/platform/work-state/spec.md
@@ -10 +10 @@
-- **RUL10 (tiền đề có ngưỡng).** Một người ghi tại một thời điểm; khi nhiều agent ghi đồng thời thành tải chính, mở lại thiết kế store theo ngưỡng đã ghi trong luật L3 (per ae461c8b). **Bổ chú (fgos-multi-session-checkout Epic 3 / STR35):** cửa ghi sự kiện `appendEvent` nay tự khóa liên-tiến-trình bằng một `.fgos/events.lock` riêng (chính sách CHẶN-có-timeout — thử lại với backoff cho tới khi thắng hoặc hết giờ, mirror `acquireSessionsLock` chứ KHÔNG phải lối lùi-không-chặn của `acquireRunnerLock`; một thể hiện thứ ba độc lập của cùng primitive wx-atomic-create + gặt-pid-chết, không đụng `runner.lock`/`sessions.lock`). Nhờ đó hai tiến trình `fgos` chạy song song không còn cùng đọc một `seq` cuối rồi cùng ghi `seq+1` — đua trùng-seq trên nhật ký append-only (đã xác nhận bằng spike) bị đóng NGAY TẠI append. Hết timeout khi giành khóa → phạm trù lỗi MỚI `lock-timeout` (tách bạch `corrupt-log`/`validation`: nghĩa là "đang có người ghi, thử lại cả thao tác", không phải hỏng dữ liệu). **Bổ chú 2 (store-atomic-rmw):** dư lượng trên — khóa chỉ đóng đua tại chính append, không đóng đua đọc-sửa-ghi cấp cao ở `store.mjs` — nay ĐÃ ĐÓNG. `events.mjs` xuất thêm `withEventsLock(logPath, fn)` (giữ nguyên `.fgos/events.lock` hiện có, không khóa mới) và `appendEventLocked` (lõi không-tự-khóa của `appendEvent`, dùng khi khóa đã đang giữ). `addWork`/`editWork`/`moveWork`/`moveStage` ở `store.mjs` nay bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStage`) trong MỘT phiên giữ khóa đó — tiến trình thứ hai giành khóa sẽ đọc lại SAU KHI sự kiện của tiến trình thứ nhất đã nằm trong nhật ký, nên tiền-kiểm của nó phát hiện đúng xung đột (`validation` "already exists" hoặc `conflict` CAS) thay vì cùng qua rồi cùng ghi. `refreshView` (dựng lại bản chiếu + ghi `state.json`) vẫn chạy SAU khi khóa nhả, không đổi. `runner.lock`/hàng-ghi ở tầng vòng lặp không đụng tới.
+- **RUL10 (tiền đề có ngưỡng).** Một người ghi tại một thời điểm; khi nhiều agent ghi đồng thời thành tải chính, mở lại thiết kế store theo ngưỡng đã ghi trong luật L3 (per ae461c8b). **Bổ chú (fgos-multi-session-checkout Epic 3 / STR35):** cửa ghi sự kiện `appendEvent` nay tự khóa liên-tiến-trình bằng một `.fgos/events.lock` riêng (chính sách CHẶN-có-timeout — thử lại với backoff cho tới khi thắng hoặc hết giờ, mirror `acquireSessionsLock` chứ KHÔNG phải lối lùi-không-chặn của `acquireRunnerLock`; một thể hiện thứ ba độc lập của cùng primitive wx-atomic-create + gặt-pid-chết, không đụng `runner.lock`/`sessions.lock`). Nhờ đó hai tiến trình `fgos` chạy song song không còn cùng đọc một `seq` cuối rồi cùng ghi `seq+1` — đua trùng-seq trên nhật ký append-only (đã xác nhận bằng spike) bị đóng NGAY TẠI append. Hết timeout khi giành khóa → phạm trù lỗi MỚI `lock-timeout` (tách bạch `corrupt-log`/`validation`: nghĩa là "đang có người ghi, thử lại cả thao tác", không phải hỏng dữ liệu). **Bổ chú 2 (store-atomic-rmw):** dư lượng trên — khóa chỉ đóng đua tại chính append, không đóng đua đọc-sửa-ghi cấp cao ở `store.mjs` — nay ĐÃ ĐÓNG. `events.mjs` xuất thêm `withEventsLock(logPath, fn)` (giữ nguyên `.fgos/events.lock` hiện có, không khóa mới) và `appendEventLocked` (lõi không-tự-khóa của `appendEvent`, dùng khi khóa đã đang giữ). `addWork`/`editWork`/`moveWork`/`moveStep` ở `store.mjs` nay bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStep`) trong MỘT phiên giữ khóa đó — tiến trình thứ hai giành khóa sẽ đọc lại SAU KHI sự kiện của tiến trình thứ nhất đã nằm trong nhật ký, nên tiền-kiểm của nó phát hiện đúng xung đột (`validation` "already exists" hoặc `conflict` CAS) thay vì cùng qua rồi cùng ghi. `refreshView` (dựng lại bản chiếu + ghi `state.json`) vẫn chạy SAU khi khóa nhả, không đổi. `runner.lock`/hàng-ghi ở tầng vòng lặp không đụng tới.
@@ -15,2 +15,2 @@
-- **RUL15 (runner/frontier loại cổng chờ-người — ràng buộc cứng).** Bộ chọn việc-sẵn-sàng và runner KHÔNG BAO GIỜ pick một item `awaiting-human`; một item có dep đang `awaiting-human` cũng không được mở (dep chỉ mở khi thật `done`). Đây là tiêu chí nghiệm thu, không phải khuyến nghị: một việc chờ người mà runner vẫn pick thì phá cả ý nghĩa cổng (per 65c642a8). Là hệ quả trực tiếp của RUL12 (chỉ `todo` mới sẵn-sàng) áp cho trạng thái mới — không cần điều kiện lọc thêm, có test khóa cả hai chiều.
-- **RUL16 (submit là cơ học, không bao giờ chặn).** Phân loại tier/kind/risk của `submit` chỉ đếm từ khóa, không gọi model/AI; mô tả không khớp từ khóa nào KHÔNG BAO GIỜ chặn tạo item — luôn rơi về mặc định an toàn, luôn ghi đè được sau (per stage-intake / 9f6b52c8). **Bổ chú (self-improve loop STR13 Slice 2):** bộ từ khóa rủi-ro-nặng quyết định tier `heavy` không còn riêng của `submit` — nó là MỘT nguồn dùng chung với phép thử-từ-khóa của Iron Law (xem spec Runner "Iron Law — phân loại rủi ro của một candidate fix"), và đã được mở rộng thêm 13 từ khóa (nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán) — `submit` từ nay phân loại `heavy` cho các mô tả trùng từ khóa mới này, một thay đổi hành vi CHỦ Ý, không phải hồi quy.
+- **RUL15 (runner/frontier loại cổng chờ-người — ràng buộc cứng).** Bộ chọn việc-sẵn-sàng và runner KHÔNG BAO GIỜ pick một item `awaiting-human`; một item có dep đang `awaiting-human` cũng không được mở (dep mở ở `delivered`/`retrospective`/`cleanup`/`done` hoặc khi bị hủy). Đây là tiêu chí nghiệm thu, không phải khuyến nghị: một việc chờ người mà runner vẫn pick thì phá cả ý nghĩa cổng (per 65c642a8). Là hệ quả trực tiếp của RUL12 (chỉ `todo` mới sẵn-sàng) áp cho trạng thái mới — không cần điều kiện lọc thêm, có test khóa cả hai chiều.
+- **RUL16 (submit là cơ học, không bao giờ chặn).** Phân loại size/kind/risk cơ học của `submit` (rigor là cờ tùy chọn) chỉ đếm từ khóa, không gọi model/AI; mô tả không khớp từ khóa nào KHÔNG BAO GIỜ chặn tạo item — luôn rơi về mặc định an toàn, luôn ghi đè được sau (per stage-intake / 9f6b52c8). **Bổ chú (self-improve loop STR13 Slice 2):** bộ từ khóa rủi-ro-nặng quyết định size `heavy` và risk `heavy` không còn riêng của `submit` — nó là MỘT nguồn dùng chung với phép thử-từ-khóa của Iron Law (xem spec Runner "Iron Law — phân loại rủi ro của một candidate fix"), và đã được mở rộng thêm 13 từ khóa (nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán) — `submit` từ nay phân loại `heavy` cho các mô tả trùng từ khóa mới này, một thay đổi hành vi CHỦ Ý, không phải hồi quy.
@@ -18,2 +18,2 @@
-- **RUL18 (stage — chiều vĩ mô song song với status).** Mỗi item mang thêm một trường `stage`, tách bạch khỏi `status` (vi mô): `stage` trả lời "loại tác vụ nào đang cần", `status` trả lời "việc đang ở đâu trong vòng đời của tác vụ đó". Với `coding` hôm nay bộ giá trị sống là `discovery`/`exploring`/`planning`/`executing`, cộng bí danh di sản `decompose`. Item vào hệ qua `submit` bắt đầu ở stage đầu chuỗi của domain nó (`discovery` với `coding`); qua `add` (hoặc bất kỳ item nào tạo trước tính năng này) mặc định `executing` (per stage-clarify / 9a19eea5). `stage` chỉ có nghĩa ở PHẦN ĐẦU vòng đời: từ `awaiting-approval` trở đi không còn cạnh chuyển-stage nào, nên chiều trả lời "đang ở đâu" từ đó là `status`, không phải `stage`.
-- **RUL19 (vòng tự hành là lưới đỡ context-discovery, bất kể mode).** Mỗi lượt chạy, vòng tự hành quét TOÀN BỘ item đang ở stage soi-rõ của domain nó (`discovery` với `coding`) VÀ `status: todo` — không phân biệt giá trị `mode` — TRƯỚC khi giao bất kỳ việc thi công executing nào trong cùng lượt. Lượt quét cơ học này KHÔNG tự phán hộ verdict: không có verdict do người gọi cung cấp thì nó để item nguyên tại chỗ, chờ một phiên sống. Không bao giờ chạm item đang `awaiting-human` (hệ quả trực tiếp của RUL15 (runner/frontier loại cổng chờ-người — ràng buộc cứng), áp dụng cho cả sweep này). Đảm bảo không item nào kẹt vô hình dù phiên sống đã chết giữa chừng hoặc người submit bỏ đi không gọi `discover` (per stage-clarify / 9a19eea5).
+- **RUL18 (stage — chiều vĩ mô song song với status).** Mỗi item mang thêm một trường `stage`, tách bạch khỏi `status` (vi mô): `stage` trả lời "loại tác vụ nào đang cần", `status` trả lời "việc đang ở đâu trong vòng đời của tác vụ đó". Với `coding` hôm nay bộ giá trị sống là `discovery`/`exploring`/`planning`/`executing`, cộng bí danh di sản `decompose`. Item vào hệ qua `submit` bắt đầu ở stage đầu chuỗi của domain nó (`discovery` với `coding`); qua `add` cũng mặc định step đầu chuỗi qua `entryStepFor` (`discovery` với `coding`); chỉ bản ghi cũ không mang step mới được đọc lazy là `executing` (per stage-clarify / 9a19eea5). `stage` chỉ có nghĩa ở PHẦN ĐẦU vòng đời: từ `awaiting-approval` trở đi không còn cạnh chuyển-stage nào, nên chiều trả lời "đang ở đâu" từ đó là `status`, không phải `stage`.
+- **RUL19 (vòng tự hành là lưới đỡ context-discovery, bất kể mode).** Mỗi lượt chạy, vòng tự hành quét TOÀN BỘ item đang ở stage soi-rõ của domain nó (`discovery` với `coding`) VÀ `status: todo` — không phân biệt giá trị `mode` — TRƯỚC khi giao bất kỳ việc thi công executing nào trong cùng lượt. Lượt quét dispatch worker `fgos-researching`; verdict thật của worker đi qua `resolveDiscovery`, có thể chuyển item sang `planning` hoặc `exploring` mà không cần một phiên sống ngồi chờ. Không bao giờ chạm item đang `awaiting-human` (hệ quả trực tiếp của RUL15 (runner/frontier loại cổng chờ-người — ràng buộc cứng), áp dụng cho cả sweep này). Đảm bảo không item nào kẹt vô hình dù phiên sống đã chết giữa chừng hoặc người submit bỏ đi không gọi `discover` (per stage-clarify / 9a19eea5).
@@ -26 +26 @@
-- **RUL26 (cổng-người có điều kiện trên kết quả chia).** Con mặc định vào queue thẳng; item đậu `awaiting-human` mang đề xuất chia CHỈ KHI phán tự báo mơ hồ HOẶC risk của gốc là `heavy`. Chế độ sync hỏi ngay trong phiên, dấu vết y hệt async (per stage-decompose / 43f257ae).
+- **RUL26 (cổng-người có điều kiện trên kết quả chia).** Con mặc định vào queue thẳng; item đậu `awaiting-human` mang đề xuất chia khi phán báo cần người, khi cổng từ khóa rủi ro đòi duyệt, khi blast-radius gate đòi duyệt, khi lần kiểm thứ hai tranh chấp verify của con, hoặc khi footprint con overlap mà chưa được phân thứ tự bằng deps. Chế độ sync hỏi ngay trong phiên, dấu vết y hệt async (per stage-decompose / 43f257ae).
@@ -30 +30 @@
-- **RUL30 (`headAtReturn` — đối xứng `headAtTake`, nguồn diff của một đề xuất pull-door).** `return` verify xanh ghi thêm `headAtReturn` (HEAD host repo tại đúng thời điểm đó) lên CÙNG sự kiện `doing→awaiting-approval` (per pr-lifecycle / 1359ab5e) — cổng duyệt dùng dải `headAtTake→headAtReturn` làm nguồn diff trung thực của một đề xuất pull-door. Vắng mặt cho đề xuất runner (không qua `return`) và cho mọi đề xuất tạo trước feature này (tương thích ngược, RUL11 (tiến hóa schema)).
+- **RUL30 (`headAtReturn` — đối xứng `headAtTake`, nguồn diff của một đề xuất pull-door).** `return` verify xanh ghi thêm `headAtReturn` (HEAD host repo tại đúng thời điểm đó) lên CÙNG sự kiện settle về `awaiting-approval` (claim mới: `todo→awaiting-approval` hoặc `blocked→awaiting-approval`; không ghi bền vào `doing`) (per pr-lifecycle / 1359ab5e) — cổng duyệt dùng dải `headAtTake→headAtReturn` làm nguồn diff trung thực của một đề xuất pull-door. Vắng mặt cho đề xuất runner (không qua `return`) và cho mọi đề xuất tạo trước feature này (tương thích ngược, RUL11 (tiến hóa schema)).
@@ -33,2 +33,2 @@
-- **RUL33 (cạnh `blocked→awaiting-approval` — đồng bộ-lại cơ học, cạnh MỚI DUY NHẤT mà fan-out-parallel thêm vào bảng FSM).** Khi một việc đỗ vì gãy nhập (xung đột/verify-đỏ-sau-nhập/trôi-tích-hợp) được đồng bộ-lại (catch-up) sạch, nó chuyển thẳng `blocked → awaiting-approval` — cạnh này KHÔNG mang `reason` bắt buộc (khác khuôn của `awaiting-approval→todo`/`awaiting-approval→blocked`, cùng khuôn cơ học của `blocked→todo`/`blocked→doing`) và KHÔNG BAO GIỜ đi qua `doing`, nên không tính vào ngân sách chống-lặp (`visitCount`) của việc — phân biệt rõ với người chọn cầm việc qua cửa pull để tự làm-lại tay (`blocked→doing`, có tính) (per fan-out-parallel / 2e92b7a5, xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)").
-- **RUL34 (`branchHeadAtTake`/`branchHeadAtReturn` — cặp marker nguồn-nhánh, luôn tách bạch với `headAtTake`/`headAtReturn`).** Cửa pull `take`/`return` trên một item `blocked` mang nhánh sống ghi CẶP marker riêng — `branchHeadAtTake` (HEAD của NHÁNH lúc `take`, Data Dictionary #19) trên cạnh `blocked→doing`, `branchHeadAtReturn` (HEAD của NHÁNH lúc `return` đo xanh, Data Dictionary #20) trên cạnh `doing→awaiting-approval` — mirror đúng cặp `headAtTake`/`headAtReturn` main-based nhưng KHÔNG BAO GIỜ cùng xuất hiện với cặp đó trên MỘT item: một claim nguồn-nhánh ghi `branchHeadAtTake` thay vì `headAtTake`, một return nguồn-nhánh ghi `branchHeadAtReturn` thay vì `headAtReturn` — trộn hai cặp cho cùng một đề xuất khiến `reviewDiff` của cổng duyệt dựng một dải vô nghĩa (cấm tuyệt đối, kiểm bằng test). `branchHeadAtTake` là discriminator DUY NHẤT `return` dùng để rẽ nhánh nguồn-nhánh — không dùng `classifySource` (nó ưu-tiên-nhánh và nhập nhằng với một pull-take main-based mà nhánh vẫn còn sót lại) (per human-rounds / 5a6900b2, xem spec Runner RUL30 (headAtReturn — đối xứng headAtTake, nguồn diff của một đề xuất pull-door)).
+- **RUL33 (cạnh `blocked→awaiting-approval` — đồng bộ-lại cơ học, cạnh MỚI DUY NHẤT mà fan-out-parallel thêm vào bảng FSM).** Khi một việc đỗ vì gãy nhập (xung đột/verify-đỏ-sau-nhập/trôi-tích-hợp) được đồng bộ-lại (catch-up) sạch, nó chuyển thẳng `blocked → awaiting-approval` — cạnh này KHÔNG mang `reason` bắt buộc (khác khuôn của `awaiting-approval→todo`/`awaiting-approval→blocked`, cùng khuôn cơ học của `blocked→todo`/`blocked→doing`) và KHÔNG BAO GIỜ đi qua `doing`, nên không tính vào ngân sách chống-lặp (`visitCount`) của việc — phân biệt rõ với người chọn cầm việc qua cửa pull để tự làm-lại tay (claim overlay đọc effective status `doing`, không ghi cạnh bền `blocked→doing`) (per fan-out-parallel / 2e92b7a5, xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)").
+- **RUL34 (`branchHeadAtTake`/`branchHeadAtReturn` — cặp marker nguồn-nhánh, luôn tách bạch với `headAtTake`/`headAtReturn`).** Cửa pull `take`/`return` trên một item `blocked` mang nhánh sống ghi CẶP marker riêng — `branchHeadAtTake` (HEAD của NHÁNH lúc `take`, Data Dictionary #19) trên claim record, `branchHeadAtReturn` (HEAD của NHÁNH lúc `return` đo xanh, Data Dictionary #20) trên settlement/lastAttempt khi về `awaiting-approval` — mirror đúng cặp `headAtTake`/`headAtReturn` main-based nhưng KHÔNG BAO GIỜ cùng xuất hiện với cặp đó trên MỘT item: một claim nguồn-nhánh ghi `branchHeadAtTake` thay vì `headAtTake`, một return nguồn-nhánh ghi `branchHeadAtReturn` thay vì `headAtReturn` — trộn hai cặp cho cùng một đề xuất khiến `reviewDiff` của cổng duyệt dựng một dải vô nghĩa (cấm tuyệt đối, kiểm bằng test). `branchHeadAtTake` là discriminator DUY NHẤT `return` dùng để rẽ nhánh nguồn-nhánh — không dùng `classifySource` (nó ưu-tiên-nhánh và nhập nhằng với một pull-take main-based mà nhánh vẫn còn sót lại) (per human-rounds / 5a6900b2, xem spec Runner RUL30 (headAtReturn — đối xứng headAtTake, nguồn diff của một đề xuất pull-door)).
@@ -43 +43 @@
-- **RUL53 (con trỏ tài liệu `docPath` — trường linkage cộng-thêm trên outcome).** Verb `compound` nhận thêm cờ TÙY CHỌN `--doc-path <path>`: khi có mặt, ghi trường `docPath` lên CÙNG bản ghi outcome mang `docType`, tại site ghi outcome của verb — trước đây verb có HAI site (một đường chuyển-stage, một đường gắn-nhãn-lại) và bỏ sót một site thì linkage bị nuốt lặng lẽ; nay verb không chuyển stage nữa nên chỉ còn đúng một đường ghi, và cái bẫy đó không còn. Trường này trực giao và tùy chọn hệt `docType` (RUL52 (nhãn Diataxis docType — trường capture cộng-thêm, trực giao và tùy chọn)): KHÔNG kiểm hình dạng (đường dẫn tự do), KHÔNG event type mới, KHÔNG đổi fold — đi ké payload thô của `work.outcome` nên sống sót replay/rebuild qua chính spread-fold sẵn có, tầng lưu không đổi một byte. Vắng cờ thì `compound` giữ hành vi cũ byte-for-byte (kể cả bare `compound` không cờ nào; chỉ có `--doc-type` mà không `--doc-path` vẫn ghi `docType` bình thường, `docPath` là `null`). `fgos check` hiển thị `docPath` khi có mặt. Con trỏ này là NỀN cho chỉ mục đọc-theo-tag (area `enduser-docs-index`): mỗi tài liệu người-dùng-cuối truy ngược được về capture đã sinh ra nó, nên khi dựng lại tài liệu (slice gộp-sống về sau) không mất chi tiết/cấu trúc (per bước-3 compound-learn-enduser-docs).
+- **RUL53 (con trỏ tài liệu `docPath` — trường linkage cộng-thêm trên outcome).** Verb `compound` nhận thêm cờ TÙY CHỌN `--doc-path <path>`: khi có mặt, ghi trường `docPath` lên CÙNG bản ghi outcome mang `docType`, tại site ghi outcome của verb — trước đây verb có HAI site (một đường chuyển-stage, một đường gắn-nhãn-lại) và bỏ sót một site thì linkage bị nuốt lặng lẽ; nay verb không chuyển stage nữa nên chỉ còn đúng một đường ghi, và cái bẫy đó không còn. Trường này trực giao và tùy chọn hệt `docType` (RUL52 (nhãn Diataxis docType — trường capture cộng-thêm, trực giao và tùy chọn)): `compound` (đã deprecated, khuyến nghị `fgos doc`) đòi đường dẫn đã commit ở HEAD của main checkout; khi bật `docRegistry.enforce`, đường dẫn phải là currentPath đã đăng ký, không ambiguous hay alias, KHÔNG event type mới, KHÔNG đổi fold — đi ké payload thô của `work.outcome` nên sống sót replay/rebuild qua chính spread-fold sẵn có, tầng lưu không đổi một byte. Vắng cờ thì `compound` giữ hành vi cũ byte-for-byte (kể cả bare `compound` không cờ nào; chỉ có `--doc-type` mà không `--doc-path` vẫn ghi `docType` bình thường, `docPath` là `null`). `fgos check` hiển thị `docPath` khi có mặt. Con trỏ này là NỀN cho chỉ mục đọc-theo-tag (area `enduser-docs-index`): mỗi tài liệu người-dùng-cuối truy ngược được về capture đã sinh ra nó, nên khi dựng lại tài liệu (slice gộp-sống về sau) không mất chi tiết/cấu trúc (per bước-3 compound-learn-enduser-docs).
@@ -48,3 +48,3 @@
-- **RUL59 (`priority`/`intent` — hai khóa sắp-xếp frontier, hai NGUỒN GHI tách bạch, picker vẫn cơ học vĩnh viễn per RUL42 (runner)).** `priority` (Data Dictionary #25) CHỈ ghi qua `edit --priority <n>` — một người hoặc một tác nhân tự khai tường minh, không bao giờ do picker tự suy ra. `intent` (Data Dictionary #26) do giai đoạn soi-rõ (stage `discovery`) TỰ TÍNH mỗi lần soi một item (đọc metrics đồ thị STR43 + xếp hạng tác động STR21 làm tín hiệu cơ học), ghi qua MỘT lệnh `edit` thứ hai ngay sau khi bản ghi discovery được ghi — tách bạch hoàn toàn khỏi lệnh chuyển-stage đi kèm (không bao giờ gộp vào payload của nó), và chạy CẢ khi verdict không đủ rõ để rời `discovery` (một item đậu `awaiting-human` vẫn được chấm điểm). Một lỗi ghi `intent` (vd item không qua được `validateWork` toàn phần) không bao giờ chặn kết quả phán rõ/chưa-rõ của lần đó — nuốt lặng lẽ, cùng kỷ luật fail-safe RUL48 (thử-lại-một-lần: đã rút cùng với phán-quan lồng bên trong). `intent` KHÔNG có ràng buộc dấu/khoảng ở tầng schema — khoảng 0-100 chỉ là quy ước trong prompt phán, không phải ràng buộc ghi; sửa tay được qua `edit --intent <n>` như mọi trường editable khác. Cả hai trường chỉ đổi KHÓA SẮP-XẾP mà bộ lọc frontier cơ học đọc (xem "Đọc (list / ready)" — thứ tự sẵn-sàng v2) — không bao giờ đổi TẬP HỢP item nào lọt frontier, giữ đúng RUL42 (runner spec — picker cơ học vĩnh viễn, trí tuệ vào hệ qua field trên item): picker cơ học vĩnh viễn, trí tuệ vào hệ qua đúng field-trên-item, không bao giờ qua vòng chọn-giao (per str7-str8-priority-intent).
-- **RUL60 (`submit` — ba cờ ghi-đè `--tier`/`--kind`/`--risk`, độc lập từng trường; `risk` KHÔNG mirror `tier` khi có cờ).** Xem "Nộp vấn đề tự do (submit)" trên: mặc định cả ba trường vẫn suy cơ học từ mô tả (đếm từ khóa) như trước; ba cờ tùy chọn ghi đè TỪNG TRƯỜNG một cách độc lập — có `--tier` không bắt buộc phải có `--kind`/`--risk`, và ngược lại. Khi CHỈ `--tier` có mặt (không `--risk`), `risk` VẪN suy cơ học như trước — tức `risk` khi đó mirror `tier` CƠ HỌC (giá trị suy ra, không phải giá trị vừa ghi đè qua cờ) — một điểm dễ hiểu lầm: `submit "..." --tier heavy` (không `--risk`) có thể cho ra item `risk` KHÁC `heavy` nếu suy luận cơ học trên mô tả đó tự ra một bậc khác. Cờ vắng mặt không đổi hành vi cũ một byte (cùng khuôn optional-additive như `--domain`/`--deps`/`--acceptance` — RUL nền). Trường `domain` KHÔNG nằm trong phạm vi ba cờ này và không bị đụng tới (giữ nguyên hành vi cũ hoàn toàn). BÊN SẢN XUẤT giá trị cho ba cờ này từng là kỹ năng ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify), gọi trực tiếp khi có một mô tả tự do cần nộp trước cả khi `submit` chạy; skill đó đã RÚT (tsk-6ar) vì việc nó làm bị `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`, tsk-5wz) làm lại — trên bản mô tả SẠCH hơn (sau clarify, không phải trước) — cho bất kỳ phiên sống nào gọi cửa thường, không cần gọi riêng một skill nữa. Đường sản xuất còn sống hiện nay KHÔNG còn đi qua ba cờ `--tier`/`--kind`/`--risk` của chính verb `submit` mô tả ở trên — ba cờ ấy vẫn hoạt động y nguyên cho bất kỳ bên gọi nào (người, script, agent khác) muốn ghi đè trực tiếp lúc nộp, chỉ là không còn một skill đứng sẵn để tự suy luận và điền hộ chúng. **Cập nhật (cờ phân loại của `discover`):** chỗ phán lại chính thức nay là verb `discover` ở stage `discovery` — nó nhận cùng ba cờ và áp qua chốt chặn dùng chung với đường headless (xem "Chạy context-discovery (discover)" trên). `fgos edit` vẫn là cửa ghi hợp lệ cho một chỉnh tay lẻ, nhưng nó không còn là đường sản xuất được mô tả ở đây: phân loại thuộc về `discovery`, sau research, chứ không thuộc về một bước 6b nối sau `submit`.
-- **RUL61 (writer — danh tính người ghi, cá thể tách bạch khỏi vai, không bao giờ chặn verb).** Ba cửa ghi `work.move`/`work.edit`/`work.stage` đều đóng dấu `writer{id,source}` (Data Dictionary #27) lên payload, không điều kiện — nguồn ưu tiên registry đối chiếu → biến môi trường → pid tổ tiên → nhãn `unresolved` (`id` vẫn là pid, không bao giờ rỗng). Registry CHỈ đối chiếu, không bao giờ tự cấp danh tính, và không bao giờ khớp theo thư mục làm việc hay pid của dòng đăng ký — giữ đúng bất biến "hai phiên khác nhau trong cùng worktree không bao giờ gộp làm một danh tính" mà khoá hoạt động cây chính (spec Runner) dựa vào. Một giá trị sai định dạng bị lọc và rơi xuống nguồn kế tiếp tại tầng phân giải, không đi qua validator nào — verb không bao giờ bị chặn vì danh tính không xác định được (per str46-io-contract).
+- **RUL59 (`priority` — khóa sắp-xếp frontier; `intent` đã retired in place, picker vẫn cơ học vĩnh viễn per RUL42 (runner)).** `priority` (Data Dictionary #25) ghi được qua `edit --priority <n>`; discovery còn tính `priority` bằng `computeImpact` và `computePriority` mỗi lần có verdict, rồi ghi `{priority}` qua `editWork` trong một cửa ghi riêng ngay sau bản ghi discovery. Phép ghi nằm trong `try/catch` riêng để lỗi store/lock không chặn kết quả clear/unclear. `intent` (Data Dictionary #26) đã retired in place, không còn là trường discovery tự tính. Priority đổi khóa sắp-xếp của frontier cơ học, không tự đổi tập item lọt frontier (per str7-str8-priority-intent).
+- **RUL60 (`submit` — cờ phân loại hiện hành).** `--tier` đã retired và bị từ chối với hướng dẫn dùng `--size` hoặc `--rigor`; `--size`/`--rigor`/`--kind`/`--risk` là các cờ ghi đè độc lập hiện hành. Khi không ghi đè, `submit` dùng phân loại cơ học; risk không được lấy từ size do bên gọi ghi đè. `domain` là trường riêng. Kỹ năng ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify) đã RÚT (tsk-6ar); `/fgOS:submit` bước 6 làm clarify/classify trong phiên sống trên mô tả sau clarify. Chỗ phán lại chính thức là `discover` ở discovery, sau research; phần mô tả cờ tier cũ không phải hợp đồng CLI còn sống.
+- **RUL61 (writer — danh tính người ghi, cá thể tách bạch khỏi vai, không bao giờ chặn verb).** Ba cửa ghi `work.move`/`work.edit`/`work.step` đều đóng dấu `writer{id,source}` (Data Dictionary #27) lên payload, không điều kiện — nguồn ưu tiên registry đối chiếu → biến môi trường → pid tổ tiên → nhãn `unresolved` (`id` vẫn là pid, không bao giờ rỗng). Registry CHỈ đối chiếu, không bao giờ tự cấp danh tính, và không bao giờ khớp theo thư mục làm việc hay pid của dòng đăng ký — giữ đúng bất biến "hai phiên khác nhau trong cùng worktree không bao giờ gộp làm một danh tính" mà khoá hoạt động cây chính (spec Runner) dựa vào. Một giá trị sai định dạng bị lọc và rơi xuống nguồn kế tiếp tại tầng phân giải, không đi qua validator nào — verb không bao giờ bị chặn vì danh tính không xác định được (per str46-io-contract).

```
## Every corrected sentence fragment and its code evidence

### 1. U3 resume

Before SHA256: `099fe543db541c226552cbc58f3c8c4c70d0ea2da6a7277c30a596381a210f09`
After SHA256: `d08e1b811affeeb195818ac95944843ecc074c0d43582d234dabbe9358c67d41`

Before:

```text
item về status trước lúc `ask` đậu nó (`statusAtAsk`, ghi lúc `ask`, mặc định `todo` khi vắng — log cũ/gate không mang field này) — **`todo`** nếu item chưa bị cầm claim lúc hỏi, hoặc **`doing`** nếu một claim `pick`/`take` đang sống lúc hỏi (claim-lock §5.1: trước đây LUÔN về `todo` trần, làm rớt claim đang giữ nếu `ask` xảy ra giữa lúc item `doing` — đã sửa).
```

After:

```text
item về durable status trước lúc `ask` đậu nó (`durableStatusAtAsk`, do cửa ghi tính từ status bền); log cũ thiếu trường này dùng `statusAtAsk`, thiếu cả hai mặc định `todo`, và mọi giá trị `doing` đều được clamp về `todo`. `putInAwaiting` đã settle và nhả claim lúc đậu, nên trả lời không phục hồi claim cũ.
```

Evidence: `src/state/store.mjs:1388-1420`, blob `418f3d688929b78bae26607a8eb624737e0ead25`, excerpt SHA256 `d85f9e281303dbdd993e80d6aa454cdeb305ee2a78c258a968d07cd662757188`:

```text
 * append-then-refresh tail, same CAS/validation errors — status-fsm.mjs requires a
 * non-empty `answer` on this edge.
 *
 * Resume target (claim-lock §5.1, tsk-40m P1 fix + hard-cut): reads the
 * gate's own `durableStatusAtAsk` (the item's trusted DURABLE status at
 * ask-time, stamped by moveWork/settleClaim themselves — never a caller-
 * supplied value) and resumes there. For an item claimed at ask-time, the
 * durable status was still `todo`, so this resumes to `todo`. `putInAwaiting`
 * already settled and released any active claim at park time (see below) —
 * there is no claim left here to "un-stale". Resuming just restores durable
 * status to what it was before the claim existed, so a later `fgos take`
 * can acquire a brand-new claim on it, with no durable write of `doing`
 * anywhere in this path.
 *
 * `awaiting-human -> doing` is retired from status-fsm.mjs's TRANSITIONS
 * table entirely (hard-cut, per the redesign) — a `durableStatusAtAsk` of
 * `doing` can therefore only ever be a truthful historical record of a
 * genuinely legacy pre-migration item's durable status, never a valid
 * resume target anymore, so it clamps to `todo` here instead of attempting
 * an edge that no longer exists. Data predating the `durableStatusAtAsk`
 * split falls back to the OLD `statusAtAsk` field (which used to double as
 * the resume target directly) under the SAME clamp — a legacy `'doing'`
 * there is exactly the value this hard-cut retires. `todo` is also the
 * final default for pre-existing logs/gates with neither field,
 * preserving the historical hardcoded-`todo` behavior byte for byte.
 */
export function answerAwaiting(dir, { id, answer, expectedStatus, role, rationale, alternatives, source, approved } = {}) {
  const view = listWork(dir);
  const gate = view.gates?.[id];
  const recorded = gate?.durableStatusAtAsk ?? gate?.statusAtAsk;
  const to = recorded === 'doing' ? 'todo' : (recorded ?? 'todo');
  return moveWork(dir, { id, to, expectedStatus, answer, role, rationale, alternatives, source, approved });
}

```
Evidence: `src/state/store.mjs:745-777`, blob `418f3d688929b78bae26607a8eb624737e0ead25`, excerpt SHA256 `b772df7ee55f1615183d02c88e0f03255c14f4c9b43ad1765c85c46ca43d2122`:

```text
  if (parentSnapshotAtAsk !== undefined) {
    rawEvent.payload.parentSnapshotAtAsk = parentSnapshotAtAsk;
  }
  // Status-at-ask split (claim-lock §5.1, tsk-40m P1 fix — docs/architect/
  // doing-coordination-redesign.md): two SEPARATE fields, never conflated.
  //
  // `statusAtAsk` — informational/audit only, whatever the CALLER supplies
  // (typically the EFFECTIVE view, so a claimed item legitimately reads
  // 'doing' here — that's a true fact worth recording: "this question was
  // asked while someone was actively working it"). NEVER read back for a
  // resume decision.
  //
  // `durableStatusAtAsk` — the item's OWN DURABLE status right before this
  // move parks it, computed HERE from `work.status` (the fresh durable read
  // above), never from caller input. This is the ONLY field answerAwaiting
  // trusts to pick a resume target. Trusting a caller-supplied value here
  // was the exact bug this fix closes: a caller's view is typically
  // EFFECTIVE (claim overlay), and forwarding its 'doing' into a value that
  // gets resumed durably let `take` (todo) -> `ask` -> `answer` durably
  // write awaiting-human -> doing with no backing claim at all. Resuming to
  // `durableStatusAtAsk` instead restores the item's pre-park durable
  // status with zero durable writes of 'doing' — for the normal claimed
  // case, `putInAwaiting` (below) already settled and released the claim
  // before this event was ever written, so there is nothing left to
  // "un-stale"; a later `fgos take` acquires a fresh claim. For a
  // genuinely legacy durable-doing item (no active claim), it durably
  // resumes to `doing` — a value only ever a fresh, trusted read can
  // produce here, never client input.
  if (to === 'awaiting-human') {
    if (statusAtAsk !== undefined) {
      rawEvent.payload.statusAtAsk = statusAtAsk;
    }
    rawEvent.payload.durableStatusAtAsk = work.status;

```
Evidence: `src/state/status-fsm.mjs:175-190`, blob `6eede4ce0c28fe8bc5488ffa209a35e94180c26c`, excerpt SHA256 `b9252df4cfaf82f901f192ae0da3108486825128af06fe9e41668c7bfb1f7f11`:

```text
  Object.freeze({ from: 'todo', to: 'awaiting-human' }),
  Object.freeze({ from: 'doing', to: 'awaiting-human' }),
  Object.freeze({ from: 'awaiting-human', to: 'todo' }),
  // Claim-lock resume (str-clarify-decompose-claim-lock §5.1), tsk-40m P1
  // fix + hard-cut RETIRED this edge entirely (docs/architect/doing-
  // coordination-redesign.md): a claim active at ask-time now resumes via
  // the `todo` edge above instead (its own preClaimStatus matches durable
  // status again, so buildEffectiveView's overlay shows 'doing' again on
  // its own — no durable write of 'doing' anywhere), and `putInAwaiting`
  // durably settles a claimed item DIRECTLY from its preClaimStatus into
  // `awaiting-human` (via settleClaim), releasing the claim in that same
  // write — never leaving one to silently resume through this edge later.
  // A genuinely legacy pre-migration item whose durable status really was
  // 'doing' at ask-time can still ENTER awaiting-human (the `doing ->
  // awaiting-human` edge below stays) but never resumes back to 'doing' —
  // answerAwaiting clamps that case to `todo` (store.mjs's own comment),

```
### 2. U3 ready consequence

Before SHA256: `e493431447cef199706b93ae7595343441373e62795320802d5d36e4ca468a68`
After SHA256: `bcff4cb1258510b60aeeffd61e88c5f6281bfaaeb13e93b7d19b14fefed38472`

Before:

```text
item lại actionable — về `todo` thì xuất hiện trong `ready` khi deps đủ điều kiện; về `doing` thì KHÔNG xuất hiện trong `ready` (claim vẫn đang giữ, chờ `fgos return` như bình thường).
```

After:

```text
item không resume về `doing`; trường hợp resume về `todo` xuất hiện trong `ready` khi deps, workflow step và lineage đủ điều kiện; một lần `take` sau đó lấy claim mới.
```

Evidence: `src/state/store.mjs:1388-1420`, blob `418f3d688929b78bae26607a8eb624737e0ead25`, excerpt SHA256 `d85f9e281303dbdd993e80d6aa454cdeb305ee2a78c258a968d07cd662757188`:

```text
 * append-then-refresh tail, same CAS/validation errors — status-fsm.mjs requires a
 * non-empty `answer` on this edge.
 *
 * Resume target (claim-lock §5.1, tsk-40m P1 fix + hard-cut): reads the
 * gate's own `durableStatusAtAsk` (the item's trusted DURABLE status at
 * ask-time, stamped by moveWork/settleClaim themselves — never a caller-
 * supplied value) and resumes there. For an item claimed at ask-time, the
 * durable status was still `todo`, so this resumes to `todo`. `putInAwaiting`
 * already settled and released any active claim at park time (see below) —
 * there is no claim left here to "un-stale". Resuming just restores durable
 * status to what it was before the claim existed, so a later `fgos take`
 * can acquire a brand-new claim on it, with no durable write of `doing`
 * anywhere in this path.
 *
 * `awaiting-human -> doing` is retired from status-fsm.mjs's TRANSITIONS
 * table entirely (hard-cut, per the redesign) — a `durableStatusAtAsk` of
 * `doing` can therefore only ever be a truthful historical record of a
 * genuinely legacy pre-migration item's durable status, never a valid
 * resume target anymore, so it clamps to `todo` here instead of attempting
 * an edge that no longer exists. Data predating the `durableStatusAtAsk`
 * split falls back to the OLD `statusAtAsk` field (which used to double as
 * the resume target directly) under the SAME clamp — a legacy `'doing'`
 * there is exactly the value this hard-cut retires. `todo` is also the
 * final default for pre-existing logs/gates with neither field,
 * preserving the historical hardcoded-`todo` behavior byte for byte.
 */
export function answerAwaiting(dir, { id, answer, expectedStatus, role, rationale, alternatives, source, approved } = {}) {
  const view = listWork(dir);
  const gate = view.gates?.[id];
  const recorded = gate?.durableStatusAtAsk ?? gate?.statusAtAsk;
  const to = recorded === 'doing' ? 'todo' : (recorded ?? 'todo');
  return moveWork(dir, { id, to, expectedStatus, answer, role, rationale, alternatives, source, approved });
}

```
Evidence: `src/state/frontier.mjs:40-105`, blob `07bb8d9e5ec8439cc0af6541c878f9f0ae3fa764`, excerpt SHA256 `69493c5fc878742439a0ac5c66334ae92b463f466424c411ab563d4db06a2c0f`:

```text
//     change never moves an id's position in iteration order.
//   - Every work id is validated kebab-case, starting with a letter
//     (work.mjs ID_PATTERN) — never an all-digit / numeric-looking string —
//     so none of these keys fall into the "integer index" bucket the JS
//     spec special-cases (those would iterate in ascending numeric order
//     ahead of insertion-order string keys, which would silently break
//     FIFO). `Object.keys(view.work)` therefore always iterates in
//     declaration (insertion) order, which is what `frontier` relies on for
//     FIFO — it never sorts by id.
// TIE-BREAK CONTRACT (work-graph-intelligence S4, bumped to v2 by
// str7-str8-priority-intent D2). `frontier(view)` is the single, versioned
// surface that decides claim order: the order it returns IS the order the
// runner claims and dispatches in (consumers `readyWork` in store.mjs and
// `steerFrontier` in the runner take this order as given, never re-sorting).
// `FRONTIER_ORDER_VERSION` names that order so a change to it is deliberate
// and visible, never an accidental reorder of a cold-pickup-critical
// invariant.
//
//   - v1 (superseded): the SOLE ordering key was FIFO by `work.add`
//     declaration order — exactly the insertion-order iteration argued for
//     in the header comment above. No priority, no intent, no re-sort.
//   - v2 (current, per D1/D2/D6): three ordering keys, applied in order —
//     (1) `priority` ASCENDING, absent-last (an item with no `priority`
//     sorts strictly after every item that has one, regardless of the
//     latter's magnitude); (2) among ties on (1), `intent` DESCENDING, same
//     absent-last bucketing; (3) among ties on (1) and (2), declaration
//     order — the v1 tie-break, preserved for free by
//     `Array.prototype.sort`'s spec-guaranteed stability on Node >=18 (this
//     repo's engines requirement): a comparator that returns 0 once both
//     keys tie never reorders those items relative to each other, so no
//     third key is hand-written here.
//
// A view where no item has `priority` or `intent` set produces the exact v1
// order (every comparison short-circuits both absent-last branches to a tie,
// i.e. "keep declaration order") — v2 is a strict backward-compatible
// superset of v1, not a behavior change for existing data.
export const FRONTIER_ORDER_VERSION = 2;

// `phase` (generalized for fgos-coding-driving's own loop): which Workflow phase
// counts as "ready to start" — defaults to `'execute'` (every unparameterized
// caller gets that behavior). A driver loop wanting the frontier for an earlier
// phase (e.g. `'clarify'`/`'plan'`, mirroring discover-loop/planning-loop's own
// pools) passes it explicitly; `isDepsAndLineageReady` below already covers the
// step-independent half of readiness this parameterizes the step half of.
export function frontier(view, { phase = 'execute' } = {}) {
  const work = view?.work ?? {};
  const childrenByParent = indexChildrenByParent(work);
  const ready = [];
  for (const id of Object.keys(work)) {
    const item = work[id];
    if (!isTodoStatus(item)) continue;
    // Domain-aware: an unrecognized item.domain never throws here
    // (domain-registry.mjs's fail-safe) — it folds to 'coding' with a
    // diagnostic warning, so a corrupt/rolled-back domain value can never
    // wedge the frontier derive itself.
    const domain = getDomain(item.domain);
    const phaseStep = stepForPhase(domain, phase, item.kind);
    // A domain that never declares a step for `phase` at all (e.g. `synthetic`
    // has no clarify/plan, only execute -> `assembling`) has NO item ready for
    // it, full stop -- guarded separately from the `??` fallback below, which
    // would otherwise wrongly admit an item with no `workflowStep` at all
    // (undefined ?? undefined === undefined, a false tie).
    if (phaseStep === undefined) continue;
    if ((item.workflowStep ?? stepForPhase(domain, 'execute', item.kind)) !== phaseStep) continue;
    if (hasOpenDescendant(id, work, childrenByParent)) continue;
    const depsReady = item.deps.every((dep) => isResolvedStatus(work[dep]));

```
### 3. U8 add id

Before SHA256: `d58b241d64a62df38f06cc16679bce3e66e2d6d32674d5190327e22d3d920af0`
After SHA256: `102cfaac52f10810adaf64112c39d580b364c6a1d32c738eb60184167f09cbd3`

Before:

```text
đòi người
gọi tự điền mọi trường (kể cả tự đặt id kebab-case), khác hẳn UX "nộp rồi đi"
của `submit`.
```

After:

```text
đòi người
gọi điền `--title` và `--description`; `--id` tùy chọn, khi vắng thì `generateId`
sinh id `tsk-<hash>` chống trùng từ title, khác UX "nộp rồi đi" của `submit`.
```

Evidence: `bin/fgos.mjs:933-959`, blob `99d801a92839b2a7b7202bb9c07bb8fd2277f705`, excerpt SHA256 `d64017aa51f4b68feb436fed296781ea8f5d14dafb340f3750044ac327665197`:

```text
      // --id is optional (was required): an explicit id is still honored
      // as-is (e.g. a deliberately chosen or parent-lineage child id like
      // "tsk-4vo-1"), but omitting it now reuses `submit`'s own generateId
      // (src/intake/classify.mjs) to derive a collision-free "tsk-<hash>"
      // id from --title, instead of forcing the caller to invent one by
      // hand. This closes the gap that let `add` accept an arbitrarily
      // long slugified-title id in the first place (docs/explanation/
      // long-work-item-ids-max-length-guard.md) — generateId is now the
      // path of least resistance, not a manually-typed guess.
      const idFlag = optionalField(positional[0] ?? flags.id, 'add --id requires a non-empty value; omit --id entirely to auto-generate one from --title.');
      if (flags.tier !== undefined) {
        throw new StoreError('validation', '--tier is retired; use --size (light|standard|heavy) or --rigor (low|standard|high|critical) instead.');
      }
      const id = idFlag ?? generateId(
        requireField(flags.title, 'add requires --title (used to derive the id when --id is omitted, and always required as the item\'s own title regardless)'),
        Object.keys(listWork(dir).work),
      );
      const work = {
        id,
        title: flags.title,
        kind: flags.kind,
        status: 'todo',
        deps: parseListFlag(flags.deps),
        risk: flags.risk,
        refs: parseListFlag(flags.refs),
        verify: flags.verify,
        description: requireField(flags.description, 'add requires --description (the item\'s own full-text intake description)'),

```
### 4. U8 test count

Before SHA256: `074cc5ba31d1de2c48b57791f71d4dc89b907be483e8e7f47e137df8c5bfbb50`
After SHA256: `757b45821dfbb3119ddd5337c8f29c4b6e4c35100e6c607dec8593545b4c8a0f`

Before:

```text
trực tiếp (9 file) tiếp tục dùng nguyên trạng;
```

After:

```text
trực tiếp trong nhiều file tiếp tục dùng nguyên trạng (ví dụ `test/cli/fgos-intake-7.test.mjs` và `test/e2e/pr-gate.test.mjs`);
```

Evidence: `test/cli/fgos-intake-7.test.mjs:128-148`, blob `52d47cb364bfec23ebc829f8a28c9233b70cda5e`, excerpt SHA256 `78dd5db4a86ebc8ac31bca51c5122e93eaa6f0d89a7db5cd76f7408246c32723`:

```text
test('add --footprint persists the list; omitting the flag leaves footprint absent', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(run(cwd, ['add', 'withfp', '--title', 'X', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--footprint', 'src/a.mjs,src/b.mjs', '--description', 'tsk-535 fixture description.']).status, 0);
  assert.equal(addOk(cwd, 'nofp').status, 0);
  const view = stateView(cwd);
  assert.deepEqual(view.work.withfp.footprint, ['src/a.mjs', 'src/b.mjs']);
  assert.equal('footprint' in view.work.nofp, false, 'an omitted --footprint leaves the field absent, not []');
});


// --- str73-done-flip-cos-check cell 1: --acceptance on add/submit/edit ----

test('add --acceptance persists work.acceptance as the given array, validated through validateWork', () => {
  const cwd = tmpCwd();
  // tsk-5q5-2: evidence must resolve to a real path under cwd (the new
  // write-time traceability gate) -- tmpCwd() only guarantees `.fgos/`
  // files exist, so this points there rather than a fictional source path.
  const clauses = [{ text: 'CLI exits 0 on success' }, { text: 'field round-trips', evidence: '.fgos/events.jsonl' }];
  const result = run(cwd, ['add', 'with-acceptance', '--title', 'T', '--kind', 'task', '--risk', 'light', '--verify', 'x', '--acceptance', JSON.stringify(clauses), '--description', 'tsk-535 fixture description.']);
  assert.equal(result.status, 0);

```
Evidence: `test/e2e/pr-gate.test.mjs:68-80`, blob `69959ce8f0de476d42ee219e8846b51ea35a5544`, excerpt SHA256 `4180e4e6ba0c5c77459e266e496f0dfca65acb816b53c6775e8650a74ecbb5c8`:

```text
    '--verify', extra.verify ?? 'test -f output.txt',
    // tsk-535: --description is required at add's CLI layer.
    '--description', extra.description ?? `Title ${id}`,
    // add-stage-default-gap D1/D2: add now defaults to stage 'clarify'
    // instead of the old implicit 'executing' -- this file's whole point
    // is exercising the runner's dispatch loop, which only ever picks up
    // executing-stage items, so default this helper's --stage to
    // 'executing' the same way test/cli/fgos.test.mjs's own addOk does.
    '--step', extra.workflowStep ?? 'executing',
  ];
  const result = fgos(cwd, ['add', id, ...flags]);
  assert.equal(result.status, 0, `fgos add ${id} failed: ${result.stderr}`);
  return result;

```
### 5. U19 G4

Before SHA256: `47bda7a349a72256fd0824f3212e3098f7695ef11ef83b9fcae5b401e9349d88`
After SHA256: `a112ce94bc83d34131f6ddc15b0fae16137819de35b5306561fb3ec091af070b`

Before:

```text
Status CHÍNH item ngay trước khi vào chờ (`todo` hay `doing`) — mốc `answer` đọc lại để biết resume về đâu (claim-lock §5.1: một claim `doing` đang giữ lúc hỏi phải resume về `doing`, không rớt xuống `todo` trần); KHÔNG BAO GIỜ tự sửa lại sau khi ghi, cùng khuôn G3
```

After:

```text
Status do bên gọi cung cấp ngay trước hỏi, dùng cho audit; cửa ghi chụp riêng `durableStatusAtAsk` từ status bền để `answer` chọn resume. Log cũ thiếu trường bền mới fallback sang `statusAtAsk`; giá trị `doing` luôn clamp về `todo`; KHÔNG BAO GIỜ tự sửa lại sau khi ghi, cùng khuôn G3
```

Evidence: `src/state/store.mjs:745-777`, blob `418f3d688929b78bae26607a8eb624737e0ead25`, excerpt SHA256 `b772df7ee55f1615183d02c88e0f03255c14f4c9b43ad1765c85c46ca43d2122`:

```text
  if (parentSnapshotAtAsk !== undefined) {
    rawEvent.payload.parentSnapshotAtAsk = parentSnapshotAtAsk;
  }
  // Status-at-ask split (claim-lock §5.1, tsk-40m P1 fix — docs/architect/
  // doing-coordination-redesign.md): two SEPARATE fields, never conflated.
  //
  // `statusAtAsk` — informational/audit only, whatever the CALLER supplies
  // (typically the EFFECTIVE view, so a claimed item legitimately reads
  // 'doing' here — that's a true fact worth recording: "this question was
  // asked while someone was actively working it"). NEVER read back for a
  // resume decision.
  //
  // `durableStatusAtAsk` — the item's OWN DURABLE status right before this
  // move parks it, computed HERE from `work.status` (the fresh durable read
  // above), never from caller input. This is the ONLY field answerAwaiting
  // trusts to pick a resume target. Trusting a caller-supplied value here
  // was the exact bug this fix closes: a caller's view is typically
  // EFFECTIVE (claim overlay), and forwarding its 'doing' into a value that
  // gets resumed durably let `take` (todo) -> `ask` -> `answer` durably
  // write awaiting-human -> doing with no backing claim at all. Resuming to
  // `durableStatusAtAsk` instead restores the item's pre-park durable
  // status with zero durable writes of 'doing' — for the normal claimed
  // case, `putInAwaiting` (below) already settled and released the claim
  // before this event was ever written, so there is nothing left to
  // "un-stale"; a later `fgos take` acquires a fresh claim. For a
  // genuinely legacy durable-doing item (no active claim), it durably
  // resumes to `doing` — a value only ever a fresh, trusted read can
  // produce here, never client input.
  if (to === 'awaiting-human') {
    if (statusAtAsk !== undefined) {
      rawEvent.payload.statusAtAsk = statusAtAsk;
    }
    rawEvent.payload.durableStatusAtAsk = work.status;

```
Evidence: `src/state/store.mjs:1414-1420`, blob `418f3d688929b78bae26607a8eb624737e0ead25`, excerpt SHA256 `da1e0abc6fcdb27dba5cc175ac9daa43d46544734fcee6dde01b966cde63d60f`:

```text
export function answerAwaiting(dir, { id, answer, expectedStatus, role, rationale, alternatives, source, approved } = {}) {
  const view = listWork(dir);
  const gate = view.gates?.[id];
  const recorded = gate?.durableStatusAtAsk ?? gate?.statusAtAsk;
  const to = recorded === 'doing' ? 'todo' : (recorded ?? 'todo');
  return moveWork(dir, { id, to, expectedStatus, answer, role, rationale, alternatives, source, approved });
}

```
### 6. U20 footprint

Before SHA256: `563c50b4b05266051cc5cb2ef51c55df450cf5a9dd2844b46d4ed3f0120bcb38`
After SHA256: `b5f1f6313a4a2e58755c886d1173604e6cf3ffdb0ad4ab68530fe66d11ab7567`

Before:

```text
PHI-CHẶN: chỉ nuôi cố-vấn này, không vào cycle-check/frontier.
```

After:

```text
Không vào cycle-check/frontier; footprint còn chặn đề xuất chia có overlap bằng cổng `awaiting-human`, xếp các item xung đột vào wave khác nhau trong `computeSchedule`, và cung cấp tín hiệu cho `mergeReadiness`.
```

Evidence: `src/intake/plan.mjs:884-898`, blob `ea2bad13189ba75f59b9d4c45a3ba0a6f28013ad`, excerpt SHA256 `57acb36d5a320db2c17d52c6d4d734ec96ab09297066378a43d4cd4b299a472f`:

```text
    childReconciliation.map((entry) => [
      entry.id,
      entry.alreadyMaterialized
        ? (Array.isArray(view.work[entry.id]?.deps) ? view.work[entry.id].deps : [])
        : entry.child.deps.map((depIndex) => childIds[depIndex]),
    ]),
  );
  const footprintConflicts = footprintOverlapAmong(footprintCandidates).filter(
    ({ a, b }) => !(resolvedDepsById.get(a) ?? []).includes(b) && !(resolvedDepsById.get(b) ?? []).includes(a),
  );
  if (footprintConflicts.length > 0) {
    const reason = formatFootprintOverlapReason(footprintConflicts);
    logDecomposeVerdict(dir, id, 'need-human', reason, `${footprintConflicts.length} footprint conflicts`);
    putInAwaiting(dir, { id, ask: formatProposalAsk(verdict, reason, id), statusAtAsk: work.status }); // tsk-40m P1 fix: statusAtAsk is informational only now; moveWork computes the resume-safe durableStatusAtAsk itself
    return { outcome: 'need-human', id, verdict };

```
Evidence: `src/state/graph-metrics.mjs:737-775`, blob `3f7832198a1b09e0b0e1a6121f80ca14ff498bfc`, excerpt SHA256 `a8768a60161a7f2ad761c7316177484a506564c008a06cbe2226751a11e7f5f2`:

```text
 * already placed in it (`footprintOverlapAmong`, reused unchanged). A
 * conflicting item is DEFERRED to a later wave, never refused — mirrors
 * `footprintOverlapAmong`'s own "advisory, never blocking" stance. An
 * item with no declared footprint never conflicts with anything (same
 * semantics `footprintOverlapAmong` already gives it), so it packs into
 * the earliest wave with room. Returns `{ waves }` — `waves` is an array
 * of arrays of item ids, in frontier order within each wave; `waves[0]`
 * is everything dispatchable in parallel right now. PURE: reads only
 * `view.work` via `frontier`/`footprintOverlapAmong`.
 */
export function computeSchedule(view, candidateIds) {
  const scope = candidateIds ? new Set(candidateIds) : null;
  const candidates = scope ? frontier(view).filter((item) => scope.has(item.id)) : frontier(view);
  const conflicts = footprintOverlapAmong(candidates);
  const conflictsOf = new Map();
  for (const { a, b } of conflicts) {
    if (!conflictsOf.has(a)) conflictsOf.set(a, new Set());
    if (!conflictsOf.has(b)) conflictsOf.set(b, new Set());
    conflictsOf.get(a).add(b);
    conflictsOf.get(b).add(a);
  }

  const waves = [];
  let remaining = candidates;
  while (remaining.length > 0) {
    const wave = [];
    const waveIds = new Set();
    const deferred = [];
    for (const item of remaining) {
      const itemConflicts = conflictsOf.get(item.id);
      const conflictsWithWave = itemConflicts ? [...itemConflicts].some((id) => waveIds.has(id)) : false;
      if (conflictsWithWave) {
        deferred.push(item);
      } else {
        wave.push(item.id);
        waveIds.add(item.id);
      }
    }
    waves.push(wave);

```
Evidence: `src/state/graph-harness.mjs:100-210`, blob `5e1fe753e747c2ce99fa7a804482c1425b04f653`, excerpt SHA256 `409e5bc5b79792eb04e69c2d151d62199835a4c24465bd29a87d727936419286`:

```text
 *     own above, distinct decision doc). Excluded from `ready`, never
 *     placed in `waiting` (permanently superseded, not "eventually
 *     mergeable once a dep resolves" — a different semantic). Always empty
 *     for every item that never sets `supersededBy` — pure additive
 *     exclusion, same backward-compatible shape `blockedOnSync`/`mergeSets`
 *     already established.
 */
export function mergeReadiness(view, opts = {}) {
  const work = view?.work ?? {};
  const drift = opts.drift ?? {};
  const proposed = Object.values(work).filter((item) => item.status === 'awaiting-approval');

  const waiting = [];
  const candidates = [];
  for (const item of proposed) {
    const deps = Array.isArray(item.deps) ? item.deps : [];
    // work-item-status-delivered-retrospective-cleanup D13: shares
    // frontier.mjs's isResolvedStatus (per decision record 0027) instead of
    // a literal 'done' check — a dep merged (delivered) but not yet fully
    // closed out (retrospective/cleanup) no longer holds up merge-ordering.
    const depsClear = deps.every((dep) => isResolvedStatus(work[dep]));
    const mergeAfter = Array.isArray(item.mergeAfter) ? item.mergeAfter : [];
    const mergeAfterClear = mergeAfter.every((target) => isResolvedStatus(work[target]));
    if (depsClear && mergeAfterClear) {
      candidates.push(item);
    } else {
      waiting.push(item.id);
    }
  }

  const blockedOnSync = [];
  const strandedByResolvedRoot = [];
  const syncClear = [];
  for (const item of candidates) {
    const root = resolveRoot(view, item.id);
    if (drift[root]?.needsSync) {
      blockedOnSync.push(item.id);
    } else if (root !== item.id && isResolvedStatus(work[root])) {
      strandedByResolvedRoot.push(item.id);
    } else {
      syncClear.push(item);
    }
  }

  const conflicts = footprintOverlapAmong(syncClear);
  const conflictedIds = new Set();
  for (const { a, b } of conflicts) {
    conflictedIds.add(a);
    conflictedIds.add(b);
  }

  const rankedIds = rankImpact(view).map((row) => row.id);
  const orderByRank = (ids) => rankedIds.filter((id) => ids.includes(id));

  const readyIdSet = new Set(
    syncClear.map((item) => item.id).filter((id) => !conflictedIds.has(id)),
  );

  // supersededOut (tsk-2ie D2, docs/history/tsk-2ie-duplicate-superseded-
  // guard/): exclude any readyIdSet member whose supersededBy target is
  // RESOLVED (isResolvedStatus, same gate deps/mergeAfter already reuse)
  // OR itself present in this SAME readyIdSet snapshot (about to merge this
  // same round) -- a single pass against the ORIGINAL readyIdSet, checked
  // before any deletion, so a mutual pair (A supersededBy B, B supersededBy
  // A) is excluded on both sides deterministically rather than depending on
  // iteration order. `duplicates` is read by nothing here (D4 --
  // informational only).
  const supersededOutIds = [];
  for (const id of readyIdSet) {
    const target = work[id]?.supersededBy;
    if (typeof target !== 'string') continue;
    if (isResolvedStatus(work[target]) || readyIdSet.has(target)) {
      supersededOutIds.push(id);
    }
  }
  for (const id of supersededOutIds) {
    readyIdSet.delete(id);
  }
  const supersededOut = orderByRank(supersededOutIds);

  const ready = orderByRank([...readyIdSet]);

  const mergeSets = [];

  if (conflictedIds.size > 0) {
    // Connected components over `conflicts`' pairs (a chain of overlapping
    // pairs becomes ONE mergeSet, not several) — a minimal union-find,
    // scoped to this call, never persisted.
    const find = (parents, x) => {
      while (parents.get(x) !== x) x = parents.get(x);
      return x;
    };
    const parents = new Map();
    for (const id of conflictedIds) parents.set(id, id);
    for (const { a, b } of conflicts) {
      const ra = find(parents, a);
      const rb = find(parents, b);
      if (ra !== rb) parents.set(ra, rb);
    }
    const components = new Map();
    for (const id of conflictedIds) {
      const root = find(parents, id);
      if (!components.has(root)) components.set(root, []);
      components.get(root).push(id);
    }
    for (const ids of components.values()) {
      const order = orderByRank(ids);
      mergeSets.push({ items: order, order, reason: 'footprint-overlap' });
    }
  }


```
### 7. U26 RUL10

Before SHA256: `a286e1473cf4d801eeaf89b092a8eba2b2ca521eac2c1cb80180012449684abc`
After SHA256: `78a619ed8a022d5c5e45412279587f2dfe88c38c09b976de6c5578783b395ba8`

Before:

```text
`addWork`/`editWork`/`moveWork`/`moveStage` ở `store.mjs` nay bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStage`)
```

After:

```text
`addWork`/`editWork`/`moveWork`/`moveStep` ở `store.mjs` nay bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStep`)
```

Evidence: `src/state/store.mjs:1430-1465`, blob `418f3d688929b78bae26607a8eb624737e0ead25`, excerpt SHA256 `f23ac5823a56630ad75509c3cf32ffe23859080a5f37e9114eabd2a56926d5a1`:

```text
 * `withEventsLock`/`appendEventLocked` scope.
 */
export function moveStep(dir, { id, to, expectedStep, verify, role } = {}) {
  const { logPath } = paths(dir);
  let shouldResolveClarify = false;
  const result = withEventsLockAndRefresh(dir, logPath, () => {
    const before = currentView(dir);
    const work = before.work[id];
    if (!work) {
      throw new StoreError('validation', `work "${id}" not found.`);
    }

    const drivingVerdict = before.discovery?.[id]?.at(-1);
    const discoverEntry = stepForPhase(getDomain(work.domain, { onUnrecognized: () => {} }), 'discover', work.kind);
    if (discoverEntry !== undefined && effectiveStep(work, getDomain(work.domain, { onUnrecognized: () => {} })) === discoverEntry && drivingVerdict?.clear !== false) {
      shouldResolveClarify = true;
    }

    const rawEvent = transitionStep({ work, to, expectedStep, verify }); // FsmError: precondition | conflict
    // Same post-transition role stamp as moveWork above — step-fsm.mjs is pure
    // and only ever returns the fields it knows about.
    if (role !== undefined) {
      rawEvent.payload.role = role;
    }
    // Writer provenance (D8/D15/D17/D18, str46-io-contract) -- same
    // post-transition stamp as role above, but unconditional: every
    // moveStep call records who wrote it, never blocking on a malformed
    // identity (D18).
    rawEvent.payload.writer = resolveWriterIdentity(dir);
    return appendEventLocked(resolveWriterLogPath(dir), rawEvent, dir);
  });

  if (shouldResolveClarify) {
    try {
      resolveFriction(dir, { id, reason: 'clarify-pass', by: 'work' });
    } catch {}

```
### 8. U26 RUL15

Before SHA256: `2a767e238deeb7091ac2d40e180031fc6925c06c3e38f3d45efd6a16fc1f7e20`
After SHA256: `3d8a1c69d5e302892350c7bdceebc52710dab8b32e69c54784f4f0f52e67fa40`

Before:

```text
(dep chỉ mở khi thật `done`)
```

After:

```text
(dep mở ở `delivered`/`retrospective`/`cleanup`/`done` hoặc khi bị hủy)
```

Evidence: `src/state/frontier.mjs:240-273`, blob `07bb8d9e5ec8439cc0af6541c878f9f0ae3fa764`, excerpt SHA256 `0438f67e334ccb228e6f88424ac9d48e3581e06f0d2fb40c153d3fe232a41751`:

```text
// and 0027's own audit §2) shares this one function instead of separate
// ad-hoc re-declarations.
const TAIL_RESOLVED_STATUSES = new Set(['delivered', 'retrospective', 'cleanup', 'done']);
const LEGACY_CANCELED_STATUS = 'wontfix';

/** The canceled-only half of `isResolvedStatus` below, extracted (tsk-4bh)
 * for a caller that needs to tell "abandoned, never had content" apart from
 * "successfully resolved" — `isResolvedStatus` itself treats both as
 * equally fine to stop waiting on (deps-readiness, frontier lineage), but
 * `cleanup-harness.mjs`'s own merge-still-resolves ancestry check needs the
 * opposite split: skip a canceled/wontfix child entirely (it never had
 * content to merge, so there is nothing to check), while STILL verifying a
 * `done`/`delivered` child's recorded sha really is an ancestor (that
 * verification is the whole point of the check — `isResolvedStatus` alone
 * would wrongly skip it too). Never returns true for a tail-resolved status
 * (`done`/`delivered`/`retrospective`/`cleanup`) — those are the opposite
 * case this function exists to distinguish. */
export function isCanceledStatus(item) {
  if (!item) return false;
  if (TAIL_RESOLVED_STATUSES.has(item.status)) return false;
  if (item.statusCategory !== undefined) return item.statusCategory === 'canceled';
  return item.status === LEGACY_CANCELED_STATUS;
}

export function isResolvedStatus(item) {
  if (!item) return false;
  if (TAIL_RESOLVED_STATUSES.has(item.status)) return true;
  return isCanceledStatus(item);
}

/**
 * Resolve the root of the lineage tree `id` belongs to: walk `view.work[id].parent`
 * upward until reaching an item with no `parent` (or whose `parent` does not
 * resolve to a known item), and return THAT item's id. An item with no

```
### 9. U26 RUL16 classification

Before SHA256: `35c216e3a9021be1b9a2f38881fe9566e7e39a0e47a337841124990bf61c7915`
After SHA256: `cb5aac93bf073ca87773c6e1e6a896c8c48d4cd1831df587e518306e699ff174`

Before:

```text
Phân loại tier/kind/risk của `submit`
```

After:

```text
Phân loại size/kind/risk cơ học của `submit` (rigor là cờ tùy chọn)
```

Evidence: `bin/fgos.mjs:1066-1088`, blob `99d801a92839b2a7b7202bb9c07bb8fd2277f705`, excerpt SHA256 `4bf064c958bd666d6401b2a3c1b3a7be077ef9e989d7e427235a64269773ed18`:

```text
    case 'submit': {
      const text = requireField(positional[0], 'submit requires a free-text description: fgos submit "<description>" [--async|--unattended]');
      if (flags.tier !== undefined) {
        throw new StoreError('validation', '--tier is retired; use --size (light|standard|heavy) or --rigor (low|standard|high|critical) instead.');
      }
      const opts = {
        async: Boolean(flags.async || flags.unattended),
        backlog: Boolean(flags.backlog),
        domain: optionalField(flags.domain, 'submit --domain requires a domain name (e.g. coding/synthetic); omit --domain entirely to use the default.'),
        discoveredFrom: optionalField(flags['discovered-from'], 'submit --discovered-from requires a non-empty id; omit it to leave unset.'),
        deps: parseListFlag(flags.deps),
        acceptance: parseAcceptanceFlag(flags.acceptance, 'submit --acceptance requires a JSON-encoded array of {text, evidence} clauses.'),
        size: optionalField(flags.size, 'submit --size requires a size value (e.g. light/standard/heavy); omit --size entirely to use classify()\'s derived value.'),
        rigor: optionalField(flags.rigor, 'submit --rigor requires a rigor value (e.g. low/standard/high/critical); omit --rigor entirely to leave unset.'),
        kind: optionalField(flags.kind, 'submit --kind requires a kind value; omit --kind entirely to use classify()\'s derived value.'),
        risk: optionalField(flags.risk, 'submit --risk requires a risk value; omit --risk entirely to use classify()\'s derived value.'),
        // tsk-5gu: same optionalField shape as --tier/--kind/--risk above --
        // a submitter who already knows the real verify command (stated in
        // free text) previously had no way to attach it at submit time,
        // unlike `add` (which requires --verify outright). Omitted leaves
        // this undefined so submitWork falls through to its existing
        // SUBMIT_VERIFY_SENTINEL default, byte-identical to before.
        verify: optionalField(flags.verify, 'submit --verify requires a non-empty command; omit --verify entirely to use the sentinel until context-discovery designs one.'),

```
### 10. U26 RUL16 heavy

Before SHA256: `93683c7fd26093d0030194ae4d99fbfd37ced95ebeaa14043635f1859773cc67`
After SHA256: `078aa5eec49b6f663c347776761057e7292e836ab05ce24aa1bb248380a7358f`

Before:

```text
bộ từ khóa rủi-ro-nặng quyết định tier `heavy`
```

After:

```text
bộ từ khóa rủi-ro-nặng quyết định size `heavy` và risk `heavy`
```

Evidence: `src/intake/classify.mjs:1-137`, blob `35a3d03da7317a42574aa7bda3818adfb5a19c63`, excerpt SHA256 `e12aeddcc50ede2c469f21a8c71ad32401f23cdad3eead7f164bc11c7dcde7f1`:

```text
// classify.mjs — pure intake logic for `fgos submit` (P14, D1/D3/D4/D5).
// No store.mjs import, no filesystem, no model/LLM call: every function here
// is a deterministic, synchronous transform over the free-text blob a caller
// submits. Side-effecting work (persisting the resulting work item) is the
// CLI verb's job, not this module's.

import { createHash } from 'node:crypto';
import { HEAVY_KEYWORDS, matchesKeyword } from './risk-keywords.mjs';
// work.mjs is a pure, dependency-free module (it imports only the equally pure
// domain-registry.mjs), so taking the shared title bound from it keeps
// this file's own "deterministic, synchronous transform" promise intact. The
// same import direction decompose.mjs and discovery.mjs already use.
import { truncateTitle } from '../state/work.mjs';

/**
 * Derive a title from a free-text submission blob (D4): cut at the first
 * sentence/line boundary, and bound whatever comes out. Never throws: any
 * non-string or blank input falls back to a fixed placeholder title so the
 * caller always gets a non-empty string (work.mjs requires non-empty title).
 *
 * Both exits are bounded, per work-item-title-contract D2. Only the no-boundary
 * exit used to be — a first sentence that ran on for a whole paragraph came
 * back whole, which is how 32 of 54 stored titles ended up past the bound. The
 * store doors bound titles too, but this call still has to: its result feeds
 * generateId before addWork ever sees it.
 */
export function deriveTitle(text) {
  const safeText = typeof text === 'string' ? text.trim() : '';
  if (!safeText) return 'Untitled submission';

  const boundary = safeText.match(/[.!?](?:\s|$)|\n/);
  if (boundary && boundary.index > 0) {
    const candidate = safeText.slice(0, boundary.index).trim();
    if (candidate) return truncateTitle(candidate);
  }

  return truncateTitle(safeText);
}

// D1/D5 keyword tables — mechanical, deterministic, always overridable by the
// caller. No match in any table is not an error: tier falls back to
// 'standard' (work.mjs TIERS default) and kind falls back to 'task'.
// HEAVY_KEYWORDS lives in the kernel-layer risk-keywords.mjs (D13) so the
// domain-layer iron-law.mjs can share the same list without an upward import.
const LIGHT_KEYWORDS = [
  'typo', 'docs', 'documentation', 'tài liệu', 'readme', 'comment',
  'chú thích', 'rename', 'đổi tên', 'formatting', 'định dạng', 'log message',
];

const KIND_KEYWORDS = {
  bug: ['bug', 'lỗi', 'fix', 'sửa', 'error', 'crash', 'broken', 'regression', 'hỏng'],
  feature: ['feature', 'tính năng', 'implement', 'add', 'thêm', 'new', 'mới'],
  chore: ['chore', 'cleanup', 'dọn dẹp', 'refactor', 'upgrade', 'nâng cấp', 'dependency'],
  docs: ['docs', 'documentation', 'tài liệu', 'readme'],
};

// Word-boundary-aware (tsk-2as D1) -- text is passed through unmodified;
// matchesKeyword does its own case-insensitive, Unicode-aware boundary
// check, so this no longer needs a pre-lowercased string.
function countMatches(text, keywords) {
  let count = 0;
  for (const keyword of keywords) {
    if (matchesKeyword(text, keyword)) count += 1;
  }
  return count;
}

/**
 * Classify a free-text submission into {size, kind, risk} (Phase 3). Purely
 * mechanical keyword counting, no LLM call, and never throws — an
 * unrecognized or empty/non-string input falls back to size: 'standard',
 * kind: 'task', with risk mirroring the size signal. Does NOT guess rigor.
 *
 * D12 (tsk-2yo): this result is only ever a TEMP placeholder at item
 * creation time now -- the real judgment happens once, later, at stage
 * `discovery`, on real research evidence (`fgos-coding-discovering`).
 */
export function classify(text) {
  const safeText = typeof text === 'string' ? text : '';

  let size = 'standard';
  if (countMatches(safeText, HEAVY_KEYWORDS) > 0) {
    size = 'heavy';
  } else if (countMatches(safeText, LIGHT_KEYWORDS) > 0) {
    size = 'light';
  }

  let kind = 'task';
  for (const [candidateKind, keywords] of Object.entries(KIND_KEYWORDS)) {
    if (countMatches(safeText, keywords) > 0) {
      kind = candidateKind;
      break;
    }
  }

  // D5: risk is derived from the same keyword signal as size (mirrors the
  // size name) — always overridable by the caller, never blocks submit.
  const risk = size;

  return { size, kind, risk };
}

// D3: SHA256 -> base36, per porting-log `hash-id-adaptive-length` (3-8 chars
// adaptive to a 25% collision threshold). The suffix grows by taking a
// longer prefix of the same digest on each retry, so a longer suffix is
// always a superset of the shorter one that just collided.
function hashSuffixSource(seed) {
  const hex = createHash('sha256').update(seed).digest('hex');
  return BigInt(`0x${hex}`).toString(36);
}

const MIN_SUFFIX_LENGTH = 3;
const MAX_SUFFIX_LENGTH = 8;

/**
 * Generate a stable, kebab-case id (id-systems-audit.md #1: `TSK<hash>`,
 * stored lowercase as `tsk-<hash>` to satisfy work.mjs's ID_PATTERN — the
 * title is never part of the id; it's already stored as its own field).
 * The fixed `tsk-` prefix guarantees letter-start regardless of hash
 * content (a bare hash digest starts with a digit ~89% of the time).
 * Retries with a longer suffix when it collides with `existingIds`,
 * bounded to MAX_SUFFIX_LENGTH attempts.
 */
export function generateId(title, existingIds = []) {
  const known = existingIds instanceof Set ? existingIds : new Set(existingIds ?? []);
  const suffixSource = hashSuffixSource(typeof title === 'string' ? title : '');

  for (let length = MIN_SUFFIX_LENGTH; length <= MAX_SUFFIX_LENGTH; length += 1) {
    const candidate = `tsk-${suffixSource.slice(0, length)}`;
    if (!known.has(candidate)) return candidate;
  }

  throw new Error(
    `generateId: exhausted hash suffix range (${MIN_SUFFIX_LENGTH}-${MAX_SUFFIX_LENGTH} chars) ` +
      `for title ${JSON.stringify(title)} without a unique id`,
  );
}

```
### 11. U26 RUL18 add entry

Before SHA256: `95f3263376b00ff77525d19769e883344fc74b7799dd506b17c9b79663dd9573`
After SHA256: `a60e71fb0d0ff1f70804a030e110937000002467dac146a73f6f5887d6932587`

Before:

```text
qua `add` (hoặc bất kỳ item nào tạo trước tính năng này) mặc định `executing`
```

After:

```text
qua `add` cũng mặc định step đầu chuỗi qua `entryStepFor` (`discovery` với `coding`); chỉ bản ghi cũ không mang step mới được đọc lazy là `executing`
```

Evidence: `bin/fgos.mjs:970-985`, blob `99d801a92839b2a7b7202bb9c07bb8fd2277f705`, excerpt SHA256 `8f2f73bf1b9cdabac6ed7c722121974ab45deb3463d26f655907306fba049c32`:

```text
        domain: optionalField(flags.domain, 'add --domain requires a domain name (e.g. coding/synthetic); omit --domain entirely to use the default.'),
        // Per D1/D2 (docs/history/add-stage-default-gap/CONTEXT.md): add now
        // stamps an entry stage the same way submit always has (line ~822
        // above) instead of leaving stage undefined -- explicit --stage
        // overrides; omitting it defaults to the domain's Clarify-mapped
        // stage, which for coding (tsk-qod D1/D2: Clarify retired entirely)
        // falls straight through to `.stages[0]` — 'discovery'. Same
        // silenced onUnrecognized as submit's own call: an
        // out-of-registry --domain is about to be rejected by addWork's
        // validateWork below anyway, so this must not fire a spurious
        // "folding to coding" warning first. An out-of-enum --stage value
        // is rejected downstream by store.mjs's validateWorkShape (the
        // single source for the STAGES domain), same "don't duplicate the
        // validation source" discipline --domain/--tier already follow.
        workflowStep: optionalField(flags.step, 'add --step requires a step value (e.g. discovery/planning/executing); omit --step entirely to use the default.')
          ?? entryStepFor(flags.domain, flags.kind),

```
Evidence: `src/state/replay.mjs:45-58`, blob `905e0d26ba2789e1b7ad4b9ad89a46632bd5d48a`, excerpt SHA256 `621c3bee58847ef5ff2ba7c79905237c4cae694da940ee36c4462fb8357a1ca0`:

```text
// name `decompose`, now `planning`); a binary from before the rename can still
// append them. Every read of those shapes goes through here, so the view only
// ever holds `workflowStep` with the workflow's current step ids.
function canonicalStep(item, step) {
  if (typeof step !== 'string') return step;
  const domain = getDomain(item?.domain, { onUnrecognized: () => {} });
  return resolveStepAlias(resolveWorkflow(domain, item?.kind), step);
}

function foldLegacyStage(target, item) {
  if (target.stage === undefined) return;
  if (target.workflowStep === undefined) {
    target.workflowStep = canonicalStep(item ?? target, target.stage);
  }

```
### 12. U26 RUL19 discovery worker

Before SHA256: `d6bb3e9ce7dbec36873340592f0f6278fe9a1fd7c57c72fea244d9ec133fe927`
After SHA256: `fde7e7bf99156bfd506d7d7830e33784b4057aaf2f2299b2d668881dc473ab0a`

Before:

```text
Lượt quét cơ học này KHÔNG tự phán hộ verdict: không có verdict do người gọi cung cấp thì nó để item nguyên tại chỗ, chờ một phiên sống.
```

After:

```text
Lượt quét dispatch worker `fgos-researching`; verdict thật của worker đi qua `resolveDiscovery`, có thể chuyển item sang `planning` hoặc `exploring` mà không cần một phiên sống ngồi chờ.
```

Evidence: `src/runner/loop.mjs:1446-1500`, blob `13364c84cdad619b5aa671d700847f2d5e3a02ae`, excerpt SHA256 `b72f7bccf02b71d77106140b59825d36162f1e59174dc3ec5835168ccf356033`:

```text

    // DISCOVERY DISPATCH (tsk-5mj D1/D6/D7, docs/history/fanout-and-
    // delegation-rubric/CONTEXT.md): replaces the old CLARIFY SWEEP's blind
    // discovery-engine call — tsk-1x3 D1/D9/D16 already retired that engine's
    // own judge subprocess, leaving a `role: 'runner'` call a pure no-op, so
    // sweeping every clarify item through it every tick did nothing. `stage:
    // discovery` items are dispatched to a real worker instead — the SAME
    // `spawnWorker`/`createDispatchWorktree` pair `executing` items already
    // use (CONTEXT.md's own instruction), just pointed at `fgos-researching`
    // via `opts.stage: 'discovery'` (dispatch.mjs). Discovery is a pure
    // machine-alone pass (D3 — "pha máy-một-mình tách khỏi pha máy+người"):
    // the worker's own {clear, question?, verify?} verdict (parsed below,
    // tsk-4v6) gates the transition through the same `resolveDiscovery`
    // the interactive `discover` verb calls — the item never advances
    // unconditionally. A `clear` verdict skips `exploring` and lands on
    // `planning` directly; `unclear` advances to `exploring` (tsk-30v
    // D2/D6), where the human-facing decision-lock happens. Sequential (mirrors
    // this sweep's own pre-tsk-5mj simplicity), not the parallel drain-run
    // below — that stays scoped to `stage: executing` only, unchanged. No
    // dispatch under dry-run, same rule the old sweep already followed.
    // Only `todo` is touched (R15) — an item already claimed (`doing`, e.g.
    // a human `fgos pick`) is left alone.
    if (!dryRun) {
      // No `getDomain`/`stageForStep` fold needed here (unlike the
      // Clarify/Divide/Execute sweeps below): 'discovery' is a
      // coding-domain-specific literal with no cross-domain symbolic
      // equivalent (tsk-1w7 D10) — no other registered domain ever declares
      // a stage named 'discovery' at all, so this direct literal comparison
      // can never wrongly match a non-coding item.
      // This sweep stands a REAL worker process up, so it has to obey the
      // shared ceiling like every other launcher (D6/D7) — the whole point of
      // one engine-owned total is that no launcher keeps a private one. It is
      // the one dispatch path that never claims: the item stays `todo` and
      // moves to `doing` only inside the worker itself, so `countWorkerSlots`
      // (which counts `doing`) cannot see this process at all. Left ungated,
      // a full lane refused the execution wave below and then spawned research
      // workers anyway, and `fgos slots` under-reported the machine while
      // every other launcher decided on that undercount.
      //
      // Asked per item, not once for the sweep: these run sequentially and
      // each one occupies the lane only while it runs, so a fresh read is both
      // cheaper and more accurate than a batch grant. `break`, not `continue`
      // — the answer will not change within this pass.
      for (const item of Object.values(listWork(dir).work)) {
        const discoverEntry = stepForPhase(getDomain(item.domain, { onUnrecognized: () => {} }), 'discover', item.kind);
        if (discoverEntry === undefined || item.workflowStep !== discoverEntry || item.status !== 'todo') continue;
        const researchRoom = hasWorkerSlotRoom(listWork(dir), {
          ceiling: readSharedConfigOrEmpty(path.dirname(dir))?.workerSlots?.ceiling,
          excludeId: item.id,
        });
        if (!researchRoom.allowed) {
          log(`fgos-runner: no worker-slot room for research on "${item.id}" — ${researchRoom.occupied} of ${researchRoom.ceiling} slot(s) in use; left for a later poll`);
          break;
        }
        let wt = null;

```
Evidence: `src/runner/loop.mjs:1530-1587`, blob `13364c84cdad619b5aa671d700847f2d5e3a02ae`, excerpt SHA256 `0dc743f9e70fd3194ea390517a8de6f53b2b348eca8afe06c918b4c4119d1c0c`:

```text
          // minimum bar: a worker that exited non-zero, or exited 0 but
          // never actually wrote/committed anything (a hang, a crash before
          // its first commit), must never be treated as "research done" —
          // mirrors dispatchClaimedItem's own `facts.aheadCount > 0` check
          // for stage:executing, just without a verify command to also run.
          const facts = branchFacts(repoRoot, wt.branch);
          if (facts.aheadCount === 0) {
            log(`fgos-runner: research worker for "${item.id}" produced no commit — left at stage discovery, status todo, for the next sweep to retry`);
          } else {
            // tsk-4v6 (CONTEXT.md D5, driver/launcher parity per 0026/0028/
            // 0029): the worker's own {clear, question?, verify?} verdict
            // gates the transition now, never a bare "did a commit land"
            // check. `resolveDiscovery` is the same engine function
            // `bin/fgos.mjs`'s `discover` verb and the interactive driver's
            // own discovery handling both call — reusing it here (role:
            // 'runner') is what keeps this sweep and the interactive path
            // provably identical instead of a second hand-rolled
            // moveStage/ask pair drifting from it. No `callerVerdict` (fence
            // absent or malformed) hits `resolveDiscovery`'s own 'runner'
            // no-op fail-safe — the item is left exactly where it is, same
            // as the no-commit branch above, never silently advanced.
            const callerVerdict = parseVerdictBlock(worker.stdout ?? '');
            const result = resolveDiscovery(dir, item.id, config, 'runner', callerVerdict);
            log(`fgos-runner: discovery dispatch for "${item.id}" resolved outcome "${result.outcome}"`);
            // D12/D17 (tsk-2yo): headless classification application --
            // resolveDiscovery itself is never touched (it stays the exact
            // engine function the interactive `fgos discover` verb also
            // calls, tsk-4v6's own driver/launcher parity); applying
            // tier/kind/risk is a separate, additive edit here, same
            // "block overrides win, only apply what the worker actually
            // reported" idiom captureDiscoveredWork already uses above.
            // A worker report carrying no classification fields is
            // byte-identical to today (patch stays empty, editWork never
            // called). Never lets an out-of-vocabulary value block the
            // already-resolved discover outcome above -- editWork's own
            // enum validation (work.mjs, `classificationVocabulary`/`TIERS`)
            // is the enforcement; a rejected value is logged and dropped,
            // not retried with a guess.
            const classificationPatch = classificationPatchFromVerdict(result.outcome, callerVerdict);
            if (Object.keys(classificationPatch).length > 0) {
              try {
                editWork(dir, { id: item.id, patch: classificationPatch, role: 'runner' });
                log(`fgos-runner: applied headless classification for "${item.id}": ${JSON.stringify(classificationPatch)}`);
              } catch (err) {
                log(`fgos-runner: headless classification for "${item.id}" rejected (${JSON.stringify(classificationPatch)}), dropped: ${err.message}`);
              }
            }
          }
        } catch (err) {
          // Fail-safe (matches the old sweep's own never-halt-the-whole-tick
          // stance): a spawn/timeout/store failure for one item's research
          // dispatch is logged and the sweep moves on to the next item,
          // never bubbling out to abort the rest of this runOnce pass.
          log(`fgos-runner: discovery dispatch failed for "${item.id}" (left at stage discovery, status todo, for the next sweep to retry): ${err.message}`);
        } finally {
          if (wt) removeDispatchWorktree(repoRoot, wt.path, log);
        }
      }

```
### 13. U26 RUL26 plan gate

Before SHA256: `fd8f3270f4745c6fe5d743827988a56ceb35146ce511134fd7d80c634ecda3ec`
After SHA256: `52d1820914e61bb79400c4b4b58658caf2008df7d0015732e6c3dd6008a200e3`

Before:

```text
item đậu `awaiting-human` mang đề xuất chia CHỈ KHI phán tự báo mơ hồ HOẶC risk của gốc là `heavy`.
```

After:

```text
item đậu `awaiting-human` mang đề xuất chia khi phán báo cần người, khi cổng từ khóa rủi ro đòi duyệt, khi blast-radius gate đòi duyệt, khi lần kiểm thứ hai tranh chấp verify của con, hoặc khi footprint con overlap mà chưa được phân thứ tự bằng deps.
```

Evidence: `src/intake/plan.mjs:745-819`, blob `ea2bad13189ba75f59b9d4c45a3ba0a6f28013ad`, excerpt SHA256 `d74221ca50ceb130418c04145be9de57183fb607123d3dddf05de56b05def0ad`:

```text
  const blastRadiusGate =
    Number.isFinite(verdict.blastRadius) && verdict.blastRadius >= BLAST_RADIUS_GATE_THRESHOLD && !blastRadiusAlreadyConfirmed;
  const risksGate = keywordRiskGate || blastRadiusGate;

  if (verdict.kind === 'need-human' || risksGate) {
    // keywordRiskGate's reason always wins when both apply -- it is the
    // existing floor (Phase C's own rule: capability signal only ever adds
    // caution, never replaces the keyword check it sits alongside).
    const reason = verdict.kind === 'need-human' ? verdict.reason : keywordRiskGate ? DEFAULT_RISK_GATE_REASON : DEFAULT_BLAST_RADIUS_GATE_REASON;
    // Logged outcome is 'need-human' (what actually happened), not
    // verdict.kind -- a risk-heavy root can force this parking out of a
    // pass-through/decompose verdict underneath it.
    logDecomposeVerdict(dir, id, 'need-human', reason);
    putInAwaiting(dir, { id, ask: formatProposalAsk(verdict, reason, id), statusAtAsk: work.status }); // tsk-40m P1 fix: statusAtAsk is informational only now; moveWork computes the resume-safe durableStatusAtAsk itself
    return { outcome: 'need-human', id, verdict };
  }

  if (verdict.kind === 'pass-through') {
    logDecomposeVerdict(dir, id, 'pass-through', verdict.reason ?? DEFAULT_PASS_THROUGH_RATIONALE);
    moveStep(dir, { id, to: executeStep, expectedStep: currentStep, verify: planApproveVerify, role });
    releaseClaimOnExecuting();
    return { outcome: 'pass-through', id };
  }

  // tsk-5q5-1 (D2/D4): each child's verify only ever got checked as
  // non-empty (normalizeChild above) before this fix — never whether it
  // actually proves that child's own claim. One independent second-pass
  // check per child (tsk-1x3 D17: mechanical-only, see
  // verify-pattern-check.mjs's own header for what this no longer
  // catches), BEFORE any child is written: a disagreement on any one of
  // them parks the WHOLE decompose verdict as need-human (never a partial
  // write) — same fail-safe stance the heavy-risk gate above already
  // applies to this same edge.
  const disputedChild = verdict.children
    .map((child, index) => ({
      index,
      child,
      secondPass: judgeVerifySemanticCorrectness(child.verify),
    }))
    .find((entry) => !entry.secondPass.agrees);

  if (disputedChild) {
    const reason =
      `Việc con #${disputedChild.index + 1} ("${disputedChild.child.title}") có verify bị nghi ngờ ở vòng ` +
      `kiểm tra thứ hai: ${disputedChild.secondPass.reason}`;

    // tsk-25g D2: --force mirrors discover's own override (tsk-5cf D1b,
    // discovery.mjs) -- proceeds past a disputed child's second-pass
    // verdict instead of parking, EXCEPT when the disagreement is
    // mechanical (tsk-12t D6, a syntactic fact not a judgement call) or
    // the item is already parked `awaiting-human` from a PRIOR
    // discover/decompose call (continuing would advance stage while
    // status stays parked -- same refusal shape discovery.mjs already
    // applies).
    if (callerVerdict?.force === true && disputedChild.secondPass.mechanical !== true) {
      if (work.status === 'awaiting-human') {
        throw new StoreError(
          'validation',
          `plan --force: work "${id}" is already "awaiting-human" -- run "fgos answer ${id} --text ..." to resume it before retrying --force.`,
        );
      }
      addDecision(dir, {
        id,
        text: `plan --force overrode a disputed child verify: "${disputedChild.child.verify}"`,
        source: 'resolvePlan',
        kind: 'engine',
        rationale: `second pass disagreed on child #${disputedChild.index + 1}: ${disputedChild.secondPass.reason}`,
      });
      // fall through -- proceed to write children below, same as no dispute
    } else {
      logDecomposeVerdict(dir, id, 'need-human', reason);
      putInAwaiting(dir, { id, ask: formatProposalAsk(verdict, reason, id), statusAtAsk: work.status }); // tsk-40m P1 fix: statusAtAsk is informational only now; moveWork computes the resume-safe durableStatusAtAsk itself
      return { outcome: 'need-human', id, verdict };
    }
  }

```
Evidence: `src/intake/plan.mjs:884-898`, blob `ea2bad13189ba75f59b9d4c45a3ba0a6f28013ad`, excerpt SHA256 `57acb36d5a320db2c17d52c6d4d734ec96ab09297066378a43d4cd4b299a472f`:

```text
    childReconciliation.map((entry) => [
      entry.id,
      entry.alreadyMaterialized
        ? (Array.isArray(view.work[entry.id]?.deps) ? view.work[entry.id].deps : [])
        : entry.child.deps.map((depIndex) => childIds[depIndex]),
    ]),
  );
  const footprintConflicts = footprintOverlapAmong(footprintCandidates).filter(
    ({ a, b }) => !(resolvedDepsById.get(a) ?? []).includes(b) && !(resolvedDepsById.get(b) ?? []).includes(a),
  );
  if (footprintConflicts.length > 0) {
    const reason = formatFootprintOverlapReason(footprintConflicts);
    logDecomposeVerdict(dir, id, 'need-human', reason, `${footprintConflicts.length} footprint conflicts`);
    putInAwaiting(dir, { id, ask: formatProposalAsk(verdict, reason, id), statusAtAsk: work.status }); // tsk-40m P1 fix: statusAtAsk is informational only now; moveWork computes the resume-safe durableStatusAtAsk itself
    return { outcome: 'need-human', id, verdict };

```
### 14. U26 RUL30 settlement

Before SHA256: `77261ec167398b66705962a41decaf27fda0a865a3648623c92dae5799c90a85`
After SHA256: `d8561e74a6cfc3e5ab449e7ebfa2cd68391c901e66fb4a00706ad452c6b36d17`

Before:

```text
lên CÙNG sự kiện `doing→awaiting-approval`
```

After:

```text
lên CÙNG sự kiện settle về `awaiting-approval` (claim mới: `todo→awaiting-approval` hoặc `blocked→awaiting-approval`; không ghi bền vào `doing`)
```

Evidence: `src/state/status-fsm.mjs:120-139`, blob `6eede4ce0c28fe8bc5488ffa209a35e94180c26c`, excerpt SHA256 `d713d4cad7c747c2fd7a1fe615b97b0f5a851809eaaa486ec3b7ed55b954c543`:

```text
  // `awaiting-approval` with NO durable intermediate `work.move(->doing)`
  // — the whole point of this redesign. `todo -> doing` and
  // `blocked -> doing` (both present in an earlier round of this same
  // item) are RETIRED, not kept: nothing durably writes INTO `doing`
  // anymore, not even settleClaim's own settle segment — `doing` is
  // derived purely from the active-claim overlay (D1) or read from a
  // durable value written before this migration (D6's own accepted
  // backward-compat fallback), never newly written. `doing -> todo` (and
  // every other `doing -> *` edge below) stays: it is still the real door
  // settleClaim's legacy fallback (a pre-migration item durably 'doing',
  // no active runtime claim) settles a GENUINELY OLD durable-doing item
  // through — this new edge is for a FRESH claim that was never durably
  // `doing` at all.
  Object.freeze({ from: 'todo', to: 'awaiting-approval' }),
  Object.freeze({ from: 'todo', to: 'blocked' }),
  Object.freeze({ from: 'doing', to: 'blocked' }),
  Object.freeze({ from: 'blocked', to: 'todo' }),
  Object.freeze({ from: 'blocked', to: 'awaiting-approval' }),
  Object.freeze({ from: 'blocked', to: 'delivered' }),
  Object.freeze({ from: 'doing', to: 'awaiting-approval' }),

```
Evidence: `src/state/store.mjs:1180-1207`, blob `418f3d688929b78bae26607a8eb624737e0ead25`, excerpt SHA256 `e2bfaca4e25ea88accbbe04db42275df8b793b8b5107c60fb052180f94a04073`:

```text
        move3Raw = transitionWork({
          work,
          to: finalStatus,
          expectedStatus: preClaimStatus,
          reason,
          ask,
          answer,
        });
        move3Raw.payload.writer = writer;
        if (role !== undefined) move3Raw.payload.role = role;
        const cat3 = statusCategoryFor(getDomain(work.domain), finalStatus);
        if (cat3 !== undefined) move3Raw.payload.statusCategory = cat3;
        const pr3 = parkReasonForStatus(getDomain(work.domain), finalStatus);
        if (pr3 !== undefined) move3Raw.payload.parkReason = pr3;
        if (headAtReturn !== undefined) move3Raw.payload.headAtReturn = headAtReturn;
        if (releaseTrigger !== undefined) move3Raw.payload.releaseTrigger = releaseTrigger;
        if (branchHeadAtReturn !== undefined) move3Raw.payload.branchHeadAtReturn = branchHeadAtReturn;
        if (mergedSha !== undefined) move3Raw.payload.mergedSha = mergedSha;
        if (mergedInto !== undefined) move3Raw.payload.mergedInto = mergedInto;
        if (reason !== undefined) move3Raw.payload.reason = reason;
        if (parentSnapshotAtAsk !== undefined) move3Raw.payload.parentSnapshotAtAsk = parentSnapshotAtAsk;
        if (askSource !== undefined) move3Raw.payload.askSource = askSource;
        // Status-at-ask split (tsk-40m P1 fix, same two-field discipline as
        // moveWork's own — see its comment): `statusAtAsk` is caller-
        // supplied/informational only; `durableStatusAtAsk` is ALWAYS the
        // trusted value here — `preClaimStatus` IS the item's real durable
        // status at this exact moment (already validated above: `work.status
        // !== freshClaim.preClaimStatus` would have thrown conflict first),

```
### 15. U26 RUL33 take

Before SHA256: `d6dcc276398cb422edc08e12692c429518f8589c776b89a11b9540c19219d586`
After SHA256: `310bc8371610bdc25e0369ae7324b76bca03d2ab4dc899c07df10e47f1376cd3`

Before:

```text
với người chọn cầm việc qua cửa pull để tự làm-lại tay (`blocked→doing`, có tính)
```

After:

```text
với người chọn cầm việc qua cửa pull để tự làm-lại tay (claim overlay đọc effective status `doing`, không ghi cạnh bền `blocked→doing`)
```

Evidence: `src/state/status-fsm.mjs:120-139`, blob `6eede4ce0c28fe8bc5488ffa209a35e94180c26c`, excerpt SHA256 `d713d4cad7c747c2fd7a1fe615b97b0f5a851809eaaa486ec3b7ed55b954c543`:

```text
  // `awaiting-approval` with NO durable intermediate `work.move(->doing)`
  // — the whole point of this redesign. `todo -> doing` and
  // `blocked -> doing` (both present in an earlier round of this same
  // item) are RETIRED, not kept: nothing durably writes INTO `doing`
  // anymore, not even settleClaim's own settle segment — `doing` is
  // derived purely from the active-claim overlay (D1) or read from a
  // durable value written before this migration (D6's own accepted
  // backward-compat fallback), never newly written. `doing -> todo` (and
  // every other `doing -> *` edge below) stays: it is still the real door
  // settleClaim's legacy fallback (a pre-migration item durably 'doing',
  // no active runtime claim) settles a GENUINELY OLD durable-doing item
  // through — this new edge is for a FRESH claim that was never durably
  // `doing` at all.
  Object.freeze({ from: 'todo', to: 'awaiting-approval' }),
  Object.freeze({ from: 'todo', to: 'blocked' }),
  Object.freeze({ from: 'doing', to: 'blocked' }),
  Object.freeze({ from: 'blocked', to: 'todo' }),
  Object.freeze({ from: 'blocked', to: 'awaiting-approval' }),
  Object.freeze({ from: 'blocked', to: 'delivered' }),
  Object.freeze({ from: 'doing', to: 'awaiting-approval' }),

```
Evidence: `src/runner/claim-port.mjs:210-234`, blob `ed742a7d151ff914e80f0ce5b640391e3d391388`, excerpt SHA256 `36d87ce4532919d2754d90d94018ce838b0dc448f3f311e5e99362ffd06e79ad`:

```text
    });
    if (!room.allowed && !isPotentialStaleClaimReclaim) {
      throw new ClaimError(
        'worker-slot-ceiling',
        `claimWork: worker-slot ceiling reached — ${room.occupied} of ${room.ceiling} slots in use; finish or park a running item before claiming "${id}".`,
        { occupied: room.occupied, ceiling: room.ceiling },
      );
    }

    // tsk-40m (docs/architect/doing-coordination-redesign.md): claim time no
    // longer writes a durable work.move(->doing), so the ORIGINAL claim's
    // branchHeadAtTake no longer lands on the item's own sticky top-level
    // field (that field is only ever set by a work.move payload) — it now
    // lives on the settle's own work.attempt, folded into item.lastAttempt.
    const priorBranchHeadAtTake = item.lastAttempt?.branchHeadAtTake;
    const isClaimLockReclaim = branchAlreadyExists
      && typeof priorBranchHeadAtTake === 'string'
      && priorBranchHeadAtTake
      && latestTodoReleaseTrigger(rawEvents, id) === 'claim-lock-3b';

    let branchHeadAtTake;
    if (isClaimLockReclaim) {
      branchHeadAtTake = priorBranchHeadAtTake;
    } else if (branchAlreadyExists) {
      branchHeadAtTake = gitAt(repoRoot, ['rev-parse', branch]).trim();

```
### 16. U26 RUL34 markers

Before SHA256: `beecc927a9fc3d6f673a28c5a337922852462c72aa25aff9409ec5a6ad78a0c6`
After SHA256: `0fe78096af930424c3ad8cab831a25f40886e2692186c4aadc09470ddac1334b`

Before:

```text
`branchHeadAtTake` (HEAD của NHÁNH lúc `take`, Data Dictionary #19) trên cạnh `blocked→doing`, `branchHeadAtReturn` (HEAD của NHÁNH lúc `return` đo xanh, Data Dictionary #20) trên cạnh `doing→awaiting-approval`
```

After:

```text
`branchHeadAtTake` (HEAD của NHÁNH lúc `take`, Data Dictionary #19) trên claim record, `branchHeadAtReturn` (HEAD của NHÁNH lúc `return` đo xanh, Data Dictionary #20) trên settlement/lastAttempt khi về `awaiting-approval`
```

Evidence: `src/state/store.mjs:1213-1245`, blob `418f3d688929b78bae26607a8eb624737e0ead25`, excerpt SHA256 `927764e8c5b53bd4dd5ae7533f578965940195f392eed5c8a5fc4d8f4d1f325e`:

```text
          move3Raw.payload.durableStatusAtAsk = preClaimStatus;
        }
      }

      const writerLogPath = resolveWriterLogPath(dir);

      if (patch && typeof patch === 'object' && !Array.isArray(patch) && Object.keys(patch).length > 0) {
        const editPayload = validateWorkPatch(before, dir, id, patch, role, writer);
        appendEventLocked(writerLogPath, { type: 'work.edit', payload: editPayload }, dir);
      }

      // work.attempt: the complete durable record of this attempt —
      // enriched with from/to/branch/head/timing metadata (design doc
      // §7.2) so "what happened during this attempt" never needs to be
      // inferred from an adjacent work.move.
      const attemptResult = result || (finalStatus === 'awaiting-approval' || finalStatus === 'delivered' || finalStatus === 'done' ? 'success' : 'failed');
      const attemptPayload = {
        id,
        phase,
        result: attemptResult,
        from: preClaimStatus,
        to: finalStatus,
        claimId: targetClaimId,
        actor: freshClaim.actor || role || 'unknown',
        endedAt: new Date().toISOString(),
      };
      if (freshClaim.acquiredAt != null) attemptPayload.startedAt = freshClaim.acquiredAt;
      if (freshClaim.branch != null) attemptPayload.branch = freshClaim.branch;
      if (freshClaim.headAtTake != null) attemptPayload.headAtTake = freshClaim.headAtTake;
      if (freshClaim.branchHeadAtTake != null) attemptPayload.branchHeadAtTake = freshClaim.branchHeadAtTake;
      if (branchHeadAtReturn !== undefined) attemptPayload.branchHeadAtReturn = branchHeadAtReturn;
      if (headAtReturn !== undefined) attemptPayload.headAtReturn = headAtReturn;
      if (reason !== undefined) attemptPayload.reason = reason;

```
Evidence: `src/runner/claim-port.mjs:210-234`, blob `ed742a7d151ff914e80f0ce5b640391e3d391388`, excerpt SHA256 `36d87ce4532919d2754d90d94018ce838b0dc448f3f311e5e99362ffd06e79ad`:

```text
    });
    if (!room.allowed && !isPotentialStaleClaimReclaim) {
      throw new ClaimError(
        'worker-slot-ceiling',
        `claimWork: worker-slot ceiling reached — ${room.occupied} of ${room.ceiling} slots in use; finish or park a running item before claiming "${id}".`,
        { occupied: room.occupied, ceiling: room.ceiling },
      );
    }

    // tsk-40m (docs/architect/doing-coordination-redesign.md): claim time no
    // longer writes a durable work.move(->doing), so the ORIGINAL claim's
    // branchHeadAtTake no longer lands on the item's own sticky top-level
    // field (that field is only ever set by a work.move payload) — it now
    // lives on the settle's own work.attempt, folded into item.lastAttempt.
    const priorBranchHeadAtTake = item.lastAttempt?.branchHeadAtTake;
    const isClaimLockReclaim = branchAlreadyExists
      && typeof priorBranchHeadAtTake === 'string'
      && priorBranchHeadAtTake
      && latestTodoReleaseTrigger(rawEvents, id) === 'claim-lock-3b';

    let branchHeadAtTake;
    if (isClaimLockReclaim) {
      branchHeadAtTake = priorBranchHeadAtTake;
    } else if (branchAlreadyExists) {
      branchHeadAtTake = gitAt(repoRoot, ['rev-parse', branch]).trim();

```
### 17. U26 RUL53 doc path

Before SHA256: `86557c0aa92a054b25249028e8cb009bedfd9da5763a3188e1390f833529be29`
After SHA256: `250c98fc12e794d7633b5b44d660d96657738aef520d91d43b2517bd04c9f2a3`

Before:

```text
KHÔNG kiểm hình dạng (đường dẫn tự do)
```

After:

```text
`compound` (đã deprecated, khuyến nghị `fgos doc`) đòi đường dẫn đã commit ở HEAD của main checkout; khi bật `docRegistry.enforce`, đường dẫn phải là currentPath đã đăng ký, không ambiguous hay alias
```

Evidence: `bin/fgos.mjs:1640-1655`, blob `99d801a92839b2a7b7202bb9c07bb8fd2277f705`, excerpt SHA256 `fb0b3c37eccb04295ecf0dd378c6524431fce4d34dd31cb6dae9b2bd1dd31bae`:

```text
      const mdPath = path.join(root, 'docs/doc-registry.md');
      const jsonPath = path.join(root, 'docs/doc-registry.json');
      fs.mkdirSync(path.dirname(mdPath), { recursive: true });
      fs.writeFileSync(mdPath, mdContent, 'utf8');
      fs.writeFileSync(jsonPath, jsonContent, 'utf8');
      return { mdPath, jsonPath, topics: Object.keys(view.topics || {}).length, docs: Object.keys(view.docs || {}).length };
    }

    case 'compound': {
      console.error('[DEPRECATION WARNING] fgos compound is deprecated. Use fgos doc reserve/register/promote instead.');
      const id = requireField(positional[0] ?? flags.id, 'compound requires an id: fgos compound <id>');
      const item = listWork(dir).work[id];
      if (!item) {
        throw new StoreError('validation', `compound: work "${id}" not found.`);
      }
      if (item.status !== 'retrospective') {

```
Evidence: `bin/fgos.mjs:1677-1710`, blob `99d801a92839b2a7b7202bb9c07bb8fd2277f705`, excerpt SHA256 `1682e7a95bc4fe7a55bc1a815bf83386b8ebb1488c19e5f86d5aeced2e6a9dd8`:

```text
      // while their tags still claimed they existed.
      if (docPath !== undefined) {
        const repoRoot = path.dirname(dir);
        try {
          execFileSync('git', ['cat-file', '-e', `HEAD:${docPath}`], { cwd: repoRoot, encoding: 'utf8', shell: false, stdio: ['ignore', 'ignore', 'pipe'] });
        } catch {
          throw new StoreError('validation', `compound: --doc-path "${docPath}" is not committed at the main checkout's HEAD ("${repoRoot}") — write and commit the document there before tagging it.`);
        }
        // docs/architect/knowledge-registry-redesign.md §8: "The new
        // producer gate extends [the HEAD-commit rule]: require registry
        // enforcement active, require path equals a registered document
        // currentPath, reject alias paths". This legacy verb is deprecated
        // (see the warning above) but stays reachable until `fgos knowledge
        // attest`/`fgos doc *` fully replace it — enforcing the SAME
        // registry-membership rule here (when the operator has turned
        // enforcement on) closes the gap that let it keep tagging a path
        // the registry never heard of.
        const sharedConfig = readSharedConfigOrEmpty(repoRoot);
        if (sharedConfig?.docRegistry?.enforce === true) {
          const registryView = rebuild(dir);
          const resolved = resolveDocPath(registryView, docPath);
          if (Array.isArray(resolved)) {
            throw new StoreError('validation', `compound: --doc-path "${docPath}" resolves ambiguously to ${resolved.length} docs (${resolved.map((d) => d.docId).join(', ')}) (docRegistry.enforce is on) — fail-closed rather than guess which one to tag.`);
          }
          const match = resolved;
          if (!match) {
            throw new StoreError('validation', `compound: --doc-path "${docPath}" is not registered in the knowledge registry (docRegistry.enforce is on) — run "fgos doc reserve"/"fgos doc register" first, or use "fgos knowledge attest" instead of this deprecated verb.`);
          }
          if (match.currentPath !== docPath) {
            throw new StoreError('validation', `compound: --doc-path "${docPath}" is an ALIAS, not the registered currentPath "${match.currentPath}" (docRegistry.enforce is on) — use the currentPath.`);
          }
        }
      }
      const { event } = addOutcome(dir, { id, docType, ...(docPath !== undefined ? { docPath } : {}) });

```
### 18. U26 RUL59 priority and intent

Before SHA256: `4ab37467b24440b485ab248aebd094db531f0fac66bdafd15ac638a20109fae2`
After SHA256: `49677e898d74e49852dafee8b16ad84b4dee56146be2ff23e03ed381e263ae47`

Before:

```text
- **RUL59 (`priority`/`intent` — hai khóa sắp-xếp frontier, hai NGUỒN GHI tách bạch, picker vẫn cơ học vĩnh viễn per RUL42 (runner)).** `priority` (Data Dictionary #25) CHỈ ghi qua `edit --priority <n>` — một người hoặc một tác nhân tự khai tường minh, không bao giờ do picker tự suy ra. `intent` (Data Dictionary #26) do giai đoạn soi-rõ (stage `discovery`) TỰ TÍNH mỗi lần soi một item (đọc metrics đồ thị STR43 + xếp hạng tác động STR21 làm tín hiệu cơ học), ghi qua MỘT lệnh `edit` thứ hai ngay sau khi bản ghi discovery được ghi — tách bạch hoàn toàn khỏi lệnh chuyển-stage đi kèm (không bao giờ gộp vào payload của nó), và chạy CẢ khi verdict không đủ rõ để rời `discovery` (một item đậu `awaiting-human` vẫn được chấm điểm). Một lỗi ghi `intent` (vd item không qua được `validateWork` toàn phần) không bao giờ chặn kết quả phán rõ/chưa-rõ của lần đó — nuốt lặng lẽ, cùng kỷ luật fail-safe RUL48 (thử-lại-một-lần: đã rút cùng với phán-quan lồng bên trong). `intent` KHÔNG có ràng buộc dấu/khoảng ở tầng schema — khoảng 0-100 chỉ là quy ước trong prompt phán, không phải ràng buộc ghi; sửa tay được qua `edit --intent <n>` như mọi trường editable khác. Cả hai trường chỉ đổi KHÓA SẮP-XẾP mà bộ lọc frontier cơ học đọc (xem "Đọc (list / ready)" — thứ tự sẵn-sàng v2) — không bao giờ đổi TẬP HỢP item nào lọt frontier, giữ đúng RUL42 (runner spec — picker cơ học vĩnh viễn, trí tuệ vào hệ qua field trên item): picker cơ học vĩnh viễn, trí tuệ vào hệ qua đúng field-trên-item, không bao giờ qua vòng chọn-giao (per str7-str8-priority-intent).
```

After:

```text
- **RUL59 (`priority` — khóa sắp-xếp frontier; `intent` đã retired in place, picker vẫn cơ học vĩnh viễn per RUL42 (runner)).** `priority` (Data Dictionary #25) ghi được qua `edit --priority <n>`; discovery còn tính `priority` bằng `computeImpact` và `computePriority` mỗi lần có verdict, rồi ghi `{priority}` qua `editWork` trong một cửa ghi riêng ngay sau bản ghi discovery. Phép ghi nằm trong `try/catch` riêng để lỗi store/lock không chặn kết quả clear/unclear. `intent` (Data Dictionary #26) đã retired in place, không còn là trường discovery tự tính. Priority đổi khóa sắp-xếp của frontier cơ học, không tự đổi tập item lọt frontier (per str7-str8-priority-intent).
```

Evidence: `src/intake/discovery.mjs:375-407`, blob `a83fad5a3b64d03dea6f13e3eca629949cbc315f`, excerpt SHA256 `991be8f225c91a51d8c1cd7423c95a1938fe56a3d485802db921a90223899c4b`:

```text
  // work-item-priority-matrix D6/D7 (was STR8 D4's intentScore -> work.intent):
  // a SECOND standard-door write, never merged into moveStep's or
  // putInAwaiting's payload below — scored on EITHER outcome (an unclear
  // verdict still gets scored; the item just doesn't advance stage). D7:
  // `intent` is retired IN PLACE — this is the rough clarify-stage pass
  // computing `priority` instead (effort is not yet known here, so it
  // defaults to EFFORT_FLOOR inside computePriority; `planning`'s refined
  // pass recomputes once effort/blast-radius are known, per plan.md Phase
  // B). Wrapped in its own try/catch so a write-door rejection never aborts
  // the clarify/unclear resolution that follows. tsk-1ne (`store.mjs`'s
  // `editWork`) scoped validation to only the fields a patch actually
  // touches, so a legacy-invalid field elsewhere on the item (e.g. an
  // out-of-enum `risk`) no longer rejects this `{priority}`-only patch —
  // this try/catch now guards a narrower, still-real surface (a transient
  // store/lock error) rather than that specific legacy-shape rejection.
  try {
    const impact = computeImpact({
      blocks: blocksForItem(work, view),
      semanticRelatedness: Number.isInteger(verdict.impactScore) ? verdict.impactScore : 0,
    });
    const priority = computePriority({ impact, urgent: work.urgent, risk: work.risk });
    editWork(dir, { id, patch: { priority }, role });
    // tsk-4hb: risk is free text (Data Dictionary #6) -- a present-but-
    // unrecognized value silently folds to the same discount as "absent"
    // inside discountForRisk, with no signal anywhere. Log it here so the
    // fold is visible in the audit trail instead of invisible.
    if (work.risk && !isRecognizedRisk(work.risk)) {
      addDecision(dir, {
        id,
        text: `priority: work.risk "${work.risk}" is not a recognized RISK_DISCOUNTS key -- discountForRisk folded it to the "standard" default`,
        source: 'resolveDiscovery',
        kind: 'engine',
        rationale: 'tsk-4hb: making the silent unrecognized-value fallback observable',

```
Evidence: `src/state/frontier.mjs:117-175`, blob `07bb8d9e5ec8439cc0af6541c878f9f0ae3fa764`, excerpt SHA256 `7e55c9025f3b6b0bfedf62c1db2475e493b25031a89a89d146fa3ecb22774ad5`:

```text
// three declaring the same file, `fgos conflicts` reporting zero pairs).
// Dedupes by id: an item with no `workflowStep` field matches EVERY phase's
// execute-step fallback (`item.workflowStep ?? <execute step>` above), so without
// dedup it would appear once per step in `steps` instead of once overall.
// Re-sorts the deduped set once with `compareReadyOrder` — concatenating
// three already-sorted arrays would NOT preserve `FRONTIER_ORDER_VERSION`'s
// priority/intent ordering across the combined set. PURE: same read-only
// contract as `frontier`.
export function frontierAcrossSteps(view, phases = ['clarify', 'plan', 'execute']) {
  const seen = new Map();
  for (const phase of phases) {
    for (const item of frontier(view, { phase })) {
      if (!seen.has(item.id)) seen.set(item.id, item);
    }
  }
  return [...seen.values()].sort(compareReadyOrder);
}

// True when `item` is at the front-segment "not yet started" bucket (per
// decision record 0027, D2/D3: statusCategory 'todo') — used by the `ready`
// filter above so a domain that relabels its "not started" status away from
// the literal string 'todo' is still picked up correctly (frontier.mjs:92
// row of 0027's own audit table). Reads `item.statusCategory` when present;
// falls back to the literal `item.status === 'todo'` comparison when it is
// NOT present (an item written before tsk-38t-2 stamped this field at all,
// or an item whose domain declares no `statusLabels` at all, e.g.
// `synthetic`/`triage` today) — this is a fallback to the pre-existing
// field, never a derive-on-read of the category table itself (which
// platform-foundations.md's L3 forbids, see STATUS_CATEGORIES's own doc
// comment in work.mjs), so it stays safe under replay-from-zero.
function isTodoStatus(item) {
  if (item.statusCategory !== undefined) return item.statusCategory === 'todo';
  return item.status === 'todo';
}

// Stage-independent readiness (choke-point-take-vs-pick-claim-eligibility):
// the same deps-done + no-open-descendant clauses `frontier` enforces,
// minus its stage clause — for a caller that intentionally wants to claim
// an item still at `clarify`/`decompose` (status and stage are independent
// axes, status-fsm.mjs; the same stance `pick`'s explicit-`--id` branch already
// takes) while still refusing a genuinely-blocked item (unmet dep, or
// anchored by an open decomposed child) — those two reasons stay real
// "not dispatchable" regardless of stage.
export function isDepsAndLineageReady(view, id) {
  const work = view?.work ?? {};
  const item = work[id];
  if (!item) return false;
  const childrenByParent = indexChildrenByParent(work);
  if (hasOpenDescendant(id, work, childrenByParent)) return false;
  return item.deps.every((dep) => isResolvedStatus(work[dep]));
}

// v2 comparator (D2/D6): priority ASC absent-last, then intent DESC
// absent-last, then declaration order — the last key falls out of
// Array.prototype.sort's guaranteed stability (see header comment above),
// so returning 0 on a full tie is the entire tie-break, not an omission.
function compareReadyOrder(a, b) {
  if (a.priority !== b.priority) {
    if (a.priority === undefined) return 1;

```
### 19. U26 RUL60 retired tier

Before SHA256: `cb9041d75ab82af90584b68f48238d1bc4790254542e21cbce9a01951d9ada21`
After SHA256: `b18f139d8bcf3a17ca2d9b5c1bfc3a15de35e2b0e5a7f80b65685b2822718485`

Before:

```text
- **RUL60 (`submit` — ba cờ ghi-đè `--tier`/`--kind`/`--risk`, độc lập từng trường; `risk` KHÔNG mirror `tier` khi có cờ).** Xem "Nộp vấn đề tự do (submit)" trên: mặc định cả ba trường vẫn suy cơ học từ mô tả (đếm từ khóa) như trước; ba cờ tùy chọn ghi đè TỪNG TRƯỜNG một cách độc lập — có `--tier` không bắt buộc phải có `--kind`/`--risk`, và ngược lại. Khi CHỈ `--tier` có mặt (không `--risk`), `risk` VẪN suy cơ học như trước — tức `risk` khi đó mirror `tier` CƠ HỌC (giá trị suy ra, không phải giá trị vừa ghi đè qua cờ) — một điểm dễ hiểu lầm: `submit "..." --tier heavy` (không `--risk`) có thể cho ra item `risk` KHÁC `heavy` nếu suy luận cơ học trên mô tả đó tự ra một bậc khác. Cờ vắng mặt không đổi hành vi cũ một byte (cùng khuôn optional-additive như `--domain`/`--deps`/`--acceptance` — RUL nền). Trường `domain` KHÔNG nằm trong phạm vi ba cờ này và không bị đụng tới (giữ nguyên hành vi cũ hoàn toàn). BÊN SẢN XUẤT giá trị cho ba cờ này từng là kỹ năng ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify), gọi trực tiếp khi có một mô tả tự do cần nộp trước cả khi `submit` chạy; skill đó đã RÚT (tsk-6ar) vì việc nó làm bị `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`, tsk-5wz) làm lại — trên bản mô tả SẠCH hơn (sau clarify, không phải trước) — cho bất kỳ phiên sống nào gọi cửa thường, không cần gọi riêng một skill nữa. Đường sản xuất còn sống hiện nay KHÔNG còn đi qua ba cờ `--tier`/`--kind`/`--risk` của chính verb `submit` mô tả ở trên — ba cờ ấy vẫn hoạt động y nguyên cho bất kỳ bên gọi nào (người, script, agent khác) muốn ghi đè trực tiếp lúc nộp, chỉ là không còn một skill đứng sẵn để tự suy luận và điền hộ chúng. **Cập nhật (cờ phân loại của `discover`):** chỗ phán lại chính thức nay là verb `discover` ở stage `discovery` — nó nhận cùng ba cờ và áp qua chốt chặn dùng chung với đường headless (xem "Chạy context-discovery (discover)" trên). `fgos edit` vẫn là cửa ghi hợp lệ cho một chỉnh tay lẻ, nhưng nó không còn là đường sản xuất được mô tả ở đây: phân loại thuộc về `discovery`, sau research, chứ không thuộc về một bước 6b nối sau `submit`.
```

After:

```text
- **RUL60 (`submit` — cờ phân loại hiện hành).** `--tier` đã retired và bị từ chối với hướng dẫn dùng `--size` hoặc `--rigor`; `--size`/`--rigor`/`--kind`/`--risk` là các cờ ghi đè độc lập hiện hành. Khi không ghi đè, `submit` dùng phân loại cơ học; risk không được lấy từ size do bên gọi ghi đè. `domain` là trường riêng. Kỹ năng ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify) đã RÚT (tsk-6ar); `/fgOS:submit` bước 6 làm clarify/classify trong phiên sống trên mô tả sau clarify. Chỗ phán lại chính thức là `discover` ở discovery, sau research; phần mô tả cờ tier cũ không phải hợp đồng CLI còn sống.
```

Evidence: `bin/fgos.mjs:1066-1088`, blob `99d801a92839b2a7b7202bb9c07bb8fd2277f705`, excerpt SHA256 `4bf064c958bd666d6401b2a3c1b3a7be077ef9e989d7e427235a64269773ed18`:

```text
    case 'submit': {
      const text = requireField(positional[0], 'submit requires a free-text description: fgos submit "<description>" [--async|--unattended]');
      if (flags.tier !== undefined) {
        throw new StoreError('validation', '--tier is retired; use --size (light|standard|heavy) or --rigor (low|standard|high|critical) instead.');
      }
      const opts = {
        async: Boolean(flags.async || flags.unattended),
        backlog: Boolean(flags.backlog),
        domain: optionalField(flags.domain, 'submit --domain requires a domain name (e.g. coding/synthetic); omit --domain entirely to use the default.'),
        discoveredFrom: optionalField(flags['discovered-from'], 'submit --discovered-from requires a non-empty id; omit it to leave unset.'),
        deps: parseListFlag(flags.deps),
        acceptance: parseAcceptanceFlag(flags.acceptance, 'submit --acceptance requires a JSON-encoded array of {text, evidence} clauses.'),
        size: optionalField(flags.size, 'submit --size requires a size value (e.g. light/standard/heavy); omit --size entirely to use classify()\'s derived value.'),
        rigor: optionalField(flags.rigor, 'submit --rigor requires a rigor value (e.g. low/standard/high/critical); omit --rigor entirely to leave unset.'),
        kind: optionalField(flags.kind, 'submit --kind requires a kind value; omit --kind entirely to use classify()\'s derived value.'),
        risk: optionalField(flags.risk, 'submit --risk requires a risk value; omit --risk entirely to use classify()\'s derived value.'),
        // tsk-5gu: same optionalField shape as --tier/--kind/--risk above --
        // a submitter who already knows the real verify command (stated in
        // free text) previously had no way to attach it at submit time,
        // unlike `add` (which requires --verify outright). Omitted leaves
        // this undefined so submitWork falls through to its existing
        // SUBMIT_VERIFY_SENTINEL default, byte-identical to before.
        verify: optionalField(flags.verify, 'submit --verify requires a non-empty command; omit --verify entirely to use the sentinel until context-discovery designs one.'),

```
Evidence: `bin/fgos.mjs:806-840`, blob `99d801a92839b2a7b7202bb9c07bb8fd2277f705`, excerpt SHA256 `c19a1bb9aa43f87da89d763a756272c6dd6ac8935dfe8c20dbdf56ccf44c62f9`:

```text
function submitWork(dir, text, opts = {}) {
  const title = deriveTitle(text);
  const classified = classify(text);
  // Per str51-llm-assist-classify D2/D5: --tier/--kind/--risk are
  // independently overridable per-field; an omitted flag falls through to
  // classify(text)'s own mechanical default for exactly that field, so a
  // flagless call stays byte-identical to the pre-feature behavior.
  const size = opts.size ?? classified.size;
  const kind = opts.kind ?? classified.kind;
  const risk = opts.risk ?? classified.risk;
  const id = generateId(title, Object.keys(listWork(dir).work));
  const work = {
    id,
    title,
    // Per P30 (discovery-context): the full submitted text, kept
    // alongside the derived/truncated `title` so context-discovery can
    // read the real ask instead of just the classified summary.
    description: text,
    kind,
    // Per work-item-backlog-status D2: the default stays 'todo' for both
    // `submit` and `add` -- `opts.backlog` is the opt-in escape hatch that
    // marks an item as a not-yet-committed idea from the moment of
    // creation, instead of requiring submit-then-move. Same independent
    // optional-flag shape as `opts.async` below; an omitted --backlog flag
    // leaves this byte-identical to the prior hardcoded 'todo'. `add`
    // deliberately gains no such flag (D2, explicit human answer) -- it is
    // for already-planned work.
    status: opts.backlog ? 'backlog' : 'todo',
    // Per D4 (str83-fgos-slash-commands): --deps threaded from opts the
    // same way --domain/--discovered-from already are, immediately below.
    // opts.deps defaults to [] (parseListFlag's own undefined-input
    // shape), so an omitted --deps flag stays byte-identical to the prior
    // hardcoded deps: [].
    deps: opts.deps ?? [],
    risk,

```
Evidence: `core/skills/fgos-clarifying/SKILL.md:1-65`, blob `38d80a088108662906cc81f1c9488a5ab2bd6183`, excerpt SHA256 `ba99c0dc784f7913cbb9869aad5795e6b2dceb3828e5789d7fd85a5c17ff9f58`:

```text
---
name: fgos-clarifying
user-invocable: false
description: >-
  Read a raw submission's text and decide, without asking anyone, whether
  its intent is already understood — asking a person only when a genuine
  gap remains — then classify which domain it belongs to. Runs at Init,
  before any work item exists: called directly by `/fgOS:submit`'s own
  launcher, BEFORE `fgos submit` ever creates the item. Never Socratic by
  default: this skill starts silent and only speaks when it genuinely
  cannot tell what the text is asking for. Verdict-only — it never writes
  state, it returns `{title?, description?, domain, question?}` straight
  back to whichever launcher called it. Examples: "a person just typed a
  submit request, is its intent clear", "decide whether this needs a
  person before any item gets created", "classify which domain this
  submission belongs to", "the description is one line, is that actually
  enough".
---

# fgos-clarifying

The first thing that touches a raw submission, before any work item exists.
Its two questions are *intent* (does this session already understand what
the text is asking for, well enough to let an item be created from it?) and
*domain* (which registered domain — `coding`/`synthetic`/`triage`/
`fixture-marketing`/… — does it belong to?). It never asks a question by
default — silence is the normal outcome. It only speaks when the goal
itself is genuinely unclear, not when a detail is merely unspecified.

## Hard rules

- **Init, not a stage skill — verdict-only, never a state write.** This
  skill runs BEFORE `fgos submit` is ever called, so there is no item and
  no id yet — it cannot use the old per-item park-and-resume mechanism
  (the old contract, retired: tsk-qod D1/D2). Its only output is the
  return value `{title?, description?, domain, question?}`, handed
  straight back to whichever launcher invoked it (today: `/fgOS:submit`'s
  own SKILL.md) — the same verdict-only shape `fgos-researching` already
  uses for stage `discovery` (`fgos-coding-driving`'s own "Discovery and
  exploring stages" exception), never a new shape invented for this skill
  alone. This skill never calls any engine verb itself (submit included)
  — the caller decides what to do with the verdict.
- **Closed world at Init.** Read ONLY the text just submitted — no repo
  search, no web lookup, no prior Q&A (none exists yet, there is no item).
  This is deliberately narrower than `fgos-researching`'s own world (which
  scouts the repo/external sources) and than `fgos-coding-exploring`'s (which
  reads an existing item's history) — Init has nothing else to read.
- **Silent by default, never "arrive and ask" (D13 — chỉ hỏi khi không
  hiểu).** This item's own verify checks for the literal ASCII phrase
  `chi hoi khi khong hieu` (kept on one line, unwrapped, so a line-based
  search matches it). Read the submitted text and decide directly whether
  the intent is understood. A clear intent means: proceed with no
  question asked, no park, no ceremony. This is the opposite default from
  `fgos-coding-exploring`'s own first step, which always produces candidate
  questions — that skill exists for scope/product gray areas *after*
  intent is already settled and an item exists, never for "what is this
  text even asking for."
- **Ask only on a genuine gap.** A question is earned only when the intent
  itself — not an implementation detail, not a downstream design choice —
  cannot be determined from the text as written. "What does the person want
  built" unclear → ask. "Which library to use for it" unclear → not this
  skill's concern; that is `fgos-coding-planning`'s or `fgos-researching`'s job
  once intent is settled and an item exists. An unclear verdict means the
  caller must ask the person directly IN THE SAME CONVERSATION (there is
  no item yet to park anything against) — never create an item first and

```
### 20. U26 RUL61 writer event

Before SHA256: `c74071b1324561771c49349d6f190f2da1440d1d810dd7377718d6027933f193`
After SHA256: `07b0a458fd5243625af7a53ecb845ecc89c5d18db59c42d4bf484a9f32b252dc`

Before:

```text
Ba cửa ghi `work.move`/`work.edit`/`work.stage`
```

After:

```text
Ba cửa ghi `work.move`/`work.edit`/`work.step`
```

Evidence: `src/state/store.mjs:1432-1455`, blob `418f3d688929b78bae26607a8eb624737e0ead25`, excerpt SHA256 `7ab3b158009f74cd7287037ee1e3de6f3858d7b0c6669a1493ea8edbda975a3c`:

```text
export function moveStep(dir, { id, to, expectedStep, verify, role } = {}) {
  const { logPath } = paths(dir);
  let shouldResolveClarify = false;
  const result = withEventsLockAndRefresh(dir, logPath, () => {
    const before = currentView(dir);
    const work = before.work[id];
    if (!work) {
      throw new StoreError('validation', `work "${id}" not found.`);
    }

    const drivingVerdict = before.discovery?.[id]?.at(-1);
    const discoverEntry = stepForPhase(getDomain(work.domain, { onUnrecognized: () => {} }), 'discover', work.kind);
    if (discoverEntry !== undefined && effectiveStep(work, getDomain(work.domain, { onUnrecognized: () => {} })) === discoverEntry && drivingVerdict?.clear !== false) {
      shouldResolveClarify = true;
    }

    const rawEvent = transitionStep({ work, to, expectedStep, verify }); // FsmError: precondition | conflict
    // Same post-transition role stamp as moveWork above — step-fsm.mjs is pure
    // and only ever returns the fields it knows about.
    if (role !== undefined) {
      rawEvent.payload.role = role;
    }
    // Writer provenance (D8/D15/D17/D18, str46-io-contract) -- same
    // post-transition stamp as role above, but unconditional: every

```
Evidence: `src/state/replay.mjs:447-456`, blob `905e0d26ba2789e1b7ad4b9ad89a46632bd5d48a`, excerpt SHA256 `71754431af5b5f477158edcb5a6284af042b3bb413d6cc96eb15395eac06a637`:

```text
        }
        view.outcomes[id] = { ...view.outcomes[id], ...event.payload };
      }
      break;
    }
    case 'work.stage': // written by a binary from before the rename; same fold as work.step
    case 'work.step': {
      // Additive event type: a step move sets `item.workflowStep` and, when the
      // discovery engine supplied one, fills in the item's real `verify` at the SAME
      // time — one event, never two, so there is no window where the item reads

```
