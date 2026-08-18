# Execution fan-out — CONTEXT

`tsk-umc` · tier `heavy` · risk `heavy` · kind `feature` · stage
`decompose` (qua cửa `clarify`→`decompose` 2026-08-07, `fgos discover
--verdict clear`) · `refs` = `docs/history/execution-fanout/DISCUSSION.md#tasks`
· `mergeAfter` = `tsk-4fg` · `verify` = `npm test && node
scripts/verify-fanout-overlap.mjs`

Quyết định D1-D6 được chốt trong `DISCUSSION.md` (mười vòng thảo luận,
2026-08-07) và ghi thật qua `fgos decision --id tsk-umc`. D7-D10 chốt ở
pha clarify. Bảng dưới là bản duy nhất mọi bước sau đọc.

## Ranh giới tính năng

**Trong phạm vi:** một bộ dispatcher chạy N con **độc lập** của một item
đã `decompose` **đồng thời**, thay cho hàng đợi tuần tự hôm nay — gồm bộ
chọn wave, vòng bắn/đợi/gom, và chỗ nối để năng lực này tự kích hoạt.

**Ngoài phạm vi, đã có item riêng:**

| Item | Việc |
|---|---|
| `tsk-4fg` | cần gạt view cho `fgos list` (loại con khỏi danh sách) — `tsk-umc` `mergeAfter` cái này |
| `tsk-59x` | TTL nhận biết lá (lá ngắn/0, root giữ 7 ngày) |
| `tsk-1ug` | `fgos rollup` hiểu `targets` |

**Ngoài phạm vi, không có item:** fan-out A (gather) — đó là `tsk-5kn`;
ô review-class của bee; `fgos-runner` chạy được thật.

## Locked decisions

| D-ID | Quyết định | seq |
|---|---|---|
| **D1** | **Con là work item thật.** Không mở ô exec-packet/B2 mà `D4` của `two-layer-dispatch` đang gác. Chi phí đắt của một con nằm ở *chính sách hậu kỳ* (TTL 7 ngày, approve từng lá), không ở *bản chất* claim/verify/merge | 8896 |
| **D2** | **Tự động approve LÁ; cổng ROOT giữ nguyên bắt buộc và có người; giữ nguyên ngoại lệ risk-keyword của `gateBypass` D4.** Cổng lá là cổng trùng hạ một tầng: lá merge vào `fgw/<root>` chứ không chạm main, và `return` đã chạy verify trước đó | 8897 |
| **D3** | Bài messy task-list giải bằng **cần gạt view**, là **item riêng** (`tsk-4fg`) | 8898 |
| **D4** | **Case 2 (cụm epic, con merge riêng) dùng `goalTier` + `targets` đã có sẵn.** `targets` không đi qua `resolveRoot` ⇒ mỗi target giữ root riêng ⇒ merge độc lập lên main | 8919 |
| **D5** | **Cha tiền-kiểm, con claim, cha merge.** Cha lọc bằng hàm thuần đã có (`frontier`, `isResolvedStatus`) để không bắn ra con không claim được; mỗi con chạy `/fgOS:pick <id>` **nguyên vẹn**. Tiền-kiểm *advisory*; `claimWork` là *thẩm quyền* | 8924 |
| **D6** | **Gom = cha đọc STATE rồi approve theo ranking của verb `merge`.** Không giao thức báo cáo — Agent trả về đã là tín hiệu, state đáng tin hơn lời tự thuật | 8925 |
| **D7** | **Trần đồng thời = 5 Agent.** Fan-out không bao giờ bắn quá 5 cùng lúc, kể cả khi nhiều con hơn đều sẵn sàng và không đụng footprint | 8952 |
| **D8** | **Fan-out là NĂNG LỰC tự kích hoạt, không phải cửa vào.** Không đẻ `/fgOS:fanout`. Chỗ nối là **chỗ xử lý báo cáo anchored-by-open-children của `fgos-coding-driving`**, không riêng `/fgOS:cook` — để mọi caller hiện có và tương lai đều được fan-out | 8953 |
| **D9** | **Lá `blocked`: anh em độc lập chạy hết; chỉ không bắn anh em phụ thuộc A.** Không hủy việc đang dở | 8954 |
| **D10** | **`verify` = `npm test && node scripts/verify-fanout-overlap.mjs`** — script khẳng định một cha decompose ra ≥2 con footprint rời nhau thì `.fgos/events.jsonl` có ≥2 `work.move` sang `doing` **từ cùng một lần chạy**, các khoảng `doing` **chồng lấn thời gian**, cả hai đạt `awaiting-approval`, và không có lượt hỏi người nào ngoài cổng root. Chứng minh **chồng lấn thật**, không chỉ chứng minh file skill tồn tại | 8967 |

## Thuật ngữ đã ghim

| Từ | Nghĩa trong item này |
|---|---|
| **fan-out B / execution fan-out** | dispatch N con có **vòng đời đầy đủ** chạy đồng thời. Phân biệt với **fan-out A / gather** (`tsk-5kn`): chẻ câu hỏi bắn I/O worker gom digest, không vòng đời |
| **tập ứng viên** | tập item mà bộ chọn wave giao với `computeSchedule`. Case 1 ⇒ `children(parent)`; case 2 ⇒ `targets` của milestone; runner ⇒ cả frontier |
| **case 1** | con chia để chạy song song, **đơn vị merge cuối cùng là cha** — đã là hành vi hôm nay |
| **case 2** | con dần thành item độc lập liên kết như epic, **merge riêng lên main** — dùng `goalTier`+`targets` |
| **lá / leaf** | item có `parent`, nên `resolveRoot` trả về một id KHÁC chính nó ⇒ fork từ và merge vào `fgw/<root>` |
| **cổng trùng** | cổng approve của lá — bảo vệ cùng thứ cổng root bảo vệ, chỉ hạ một tầng và sớm hơn |

## Bằng chứng scout

`impact-analysis: degraded` — `fgos tool query --capability
impact-analysis --status present` trả về gitnexus `status: present`, nhưng
hook của phiên báo *"GitNexus index is stale (last indexed: 251d0b5)"* ⇒
theo gate ba nhánh của `CLAUDE.md`, đây là **degraded**: công cụ có mặt
nhưng index đi sau HEAD, nên mọi câu trả lời blast-radius của nó phải được
grep/rg đối chiếu trước khi tin.

Hạ tầng **đã tồn tại** (phần lớn công sức của item này là *đừng xây lại*):

| Đã có | Đường dẫn |
|---|---|
| decompose sinh `deps` giữa các con | `src/intake/plan.mjs:992` |
| con sinh thẳng ở `stage: executing`, mang `action` prose | `decompose.mjs:1001,1008` |
| item còn dep chưa xong bị loại khỏi frontier | `src/state/frontier.mjs` |
| **lá còn dep chưa merge bị TỪ CHỐI claim** (`deps-not-merged`) | `src/runner/claim-port.mjs:158-166` |
| lá fork từ `fgw/<root>`; approve của lá merge ngược vào đó | `claim-port.mjs:130-160`; `bin/fgos.mjs` case `approve` |
| **`approve` cưỡng chế chạy trên main checkout** (hai guard) | `bin/fgos.mjs` case `approve`, *"which a session worktree structurally is not"* |
| `return` chạy verify và block khi đỏ | `bin/fgos.mjs:2229-2231` |
| xếp wave không đụng footprint | `src/state/graph-metrics.mjs:703` `computeSchedule` |
| xếp hạng sẵn-sàng-merge | verb `merge` (`/fgOS:merge-list`) |
| cụm epic không dính topology merge | `goalTier`+`targets`, `src/state/work.mjs:567-577` |
| chỗ nối duy nhất: driving dừng và trả danh sách con | `.claude/skills/fgos-coding-driving/SKILL.md:86-102` |

**Không dùng lại `selectWave`** (`src/runner/loop.mjs:156`): nó xếp theo
root affinity với trần `maxRoots`, mà fan-out là *một root nhiều lá* ⇒ nó
bóp wave sai hướng. Chỉ `computeSchedule` mới đúng trục.

Bằng chứng cho D7: `DEFAULT_MAX_LEAVES_PER_ROOT = 4` (`loop.mjs:125`) là
trần của runner; 5 là số riêng của đường tương tác.

Bằng chứng cho D8: `plugins/fgOS/skills` có 31 wrapper và khuôn
`-loop`/`-next` lặp bốn lần — nhưng bảng caller của `fgos-coding-driving`
(`SKILL.md:277-283`) cho thấy `/fgOS:cook`, `/fgOS:pick` và ba sweep đều
nhận cùng báo cáo anchor, nên nối tại chỗ xử lý báo cáo phủ hết cả năm.

Bằng chứng cho D9: guard `deps-not-merged` đã cưỡng chế sẵn — A `blocked`
thì A không bao giờ `done`, nên con cháu của A **không thể** bị claim dù
ai thử. Không cần logic hủy mới.

## Tham chiếu chuẩn

- `docs/history/execution-fanout/DISCUSSION.md` — mười vòng thảo luận, §6
  thiết kế + sơ đồ, §7 ba hạng mục
- `docs/history/fanout-and-delegation-rubric/DISCUSSION.md` §3 hàng 36-39,
  §5 vòng 7 — ranh giới fan-out A / fan-out B
- `docs/history/two-layer-dispatch/DISCUSSION.md` §4 — D4 (gác exec
  packet), D8 (không tin cờ tự khai), D9 (điều kiện mở lại D4)
- `docs/decisions/0026` — launcher/rootTask, native-vs-cli-spawn
- `docs/decisions/0012` — mô hình cạnh định kiểu (`deps` vs `parent`)
- `docs/history/gate-bypass/CONTEXT.md` D1-D5 — hình dạng của một cổng tự
  động (bậc · cơ học · fail closed · risk ghi đè)

## Ghi chú về cửa clarify→decompose

Lần gọi `fgos discover` đầu tiên **bị engine bác**: first pass clear nhưng
`judgeVerifySemanticCorrectness` không đồng ý, nguyên văn *"Lệnh verify là
chuỗi rỗng/placeholder ('chưa xác định — P15 bổ sung'), không phải lệnh
shell nào cả"*. Item bị park sang `awaiting-human`, `stage` giữ nguyên
`clarify`.

Judge đúng: item được submit với verify placeholder, và `fgos-coding-exploring`
theo luật của chính nó chỉ **chụp lại** verify item đang mang chứ không tự
thiết kế verify mới. Điểm dừng này cần người, và người đã duyệt hình dạng
verify ở D10 (`fgos answer` seq 8960, `fgos edit --verify` seq 8961). Lần
`discover` thứ hai: `outcome: clear`, `stage` → `decompose`.

Bài học để lại: một item submit qua `fgos submit` mang verify placeholder
**sẽ luôn bị chặn ở cửa này** cho tới khi có người đặt verify thật — đó là
hành vi đúng, không phải lỗi.

## Câu để lại cho planning

Đây là câu chỉ người thi công quan tâm, cố ý **không** hỏi ở pha này:

- Wave chạy theo kiểu **đợi hết wave rồi mới bắn wave sau** (khuôn runner:
  `Promise.allSettled(wave.map(...))` rồi re-poll) hay **bù chỗ trống ngay
  khi một Agent xong**? §6 vẽ theo kiểu thứ nhất và runner có tiền lệ; nếu
  planning chọn kiểu thứ hai thì phải nói rõ trần 5 (D7) áp lên *số đang
  bay*, không phải *kích thước wave*.
- Bậc mặc định cho phần tự động approve lá (D2) trong khuôn `gateBypass`
  (`LEVELS = ['off', ...TIERS]`).
- Hình dạng cụ thể của tham số "tập ứng viên" cho bộ chọn wave.
