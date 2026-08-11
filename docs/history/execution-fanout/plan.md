# Execution fan-out — plan

`tsk-umc` · stage `decompose` · `verify` = `npm test && node
scripts/verify-fanout-overlap.mjs` · `mergeAfter` = `tsk-4fg`
Nguồn sự thật cho mọi quyết định: `docs/history/execution-fanout/CONTEXT.md`
(D1-D10). Plan này **không mở lại** cái nào trong đó, chỉ trích D-ID.

## Mode: high-risk

**4 cờ**, trong đó **một cờ hard-gate**:

| Cờ | Vì sao áp |
|---|---|
| **removing a validation** *(hard-gate)* | **D2** bỏ cổng approve của người ở từng lá. Verify vẫn chạy và cổng root vẫn còn (nên đây là bỏ một cổng **trùng**, không bỏ bảo vệ) — nhưng theo văn bản Mode-gate, gỡ một validation đang tồn tại là cờ hard-gate, và một cờ hard-gate là **high-risk bất kể đếm được bao nhiêu** |
| public contracts | **D8** đụng hợp đồng anchored-by-open-children của `fgos-coding-driving` — bảng caller của chính skill đó (`SKILL.md:277-283`) liệt kê **năm** caller đọc hợp đồng này. Và bộ chọn wave đổi chữ ký `computeSchedule`, thứ `src/state/store.mjs:1100` đang gọi |
| existing covered behavior | `computeSchedule` có test; `/fgOS:cook` có hành vi đang được phủ; hợp đồng driving có test |
| weak proof around the area | đường song song **chưa từng chạy thật**: 0 sự kiện `capacity.dispatch` trong toàn bộ lịch sử repo. Bằng chứng duy nhất về fan-out là demo làm **bằng tay** (`tsk-1sj`) |

Lane nhỏ hơn **không** trung thực ở đây: `standard` sẽ ngụ ý không có cờ
hard-gate nào, mà D2 có; và `small` sẽ ngụ ý không đụng public contract,
mà D8 đụng hợp đồng năm caller cùng đọc.

`impact-analysis: degraded` — gitnexus `status: present` nhưng index đi sau
HEAD (`251d0b5`). **Mọi proof point dựa vào blast radius bên dưới đều phải
grep/rg đối chiếu**, không được nhận câu trả lời của gitnexus làm bằng
chứng duy nhất.

## Approach

**Đường đã chọn: dùng lại tối đa, xây đúng phần thiếu.** `CONTEXT.md` §
"Bằng chứng scout" liệt kê mười mảnh hạ tầng đã tồn tại — thứ tự deps,
guard `deps-not-merged`, topology nhánh lá→root, `computeSchedule`, bộ xếp
hạng của verb `merge`, cạnh `targets`. Phần thiếu là **một bộ dispatcher**.

**Các đường đã loại, và vì sao:**

| Loại | Lý do |
|---|---|
| Dùng lại `selectWave` của runner | nó xếp theo root affinity với trần `maxRoots`; fan-out là *một root nhiều lá* ⇒ bóp wave sai hướng (`CONTEXT.md` § scout) |
| Cha tự claim rồi bàn giao worktree | **D5** — cần một cửa vào mới cho con và tạo đường claim thứ hai; sập cứng thì kẹt N item thay vì 1 |
| Giao thức báo cáo từ con về cha | **D6** — Agent trả về đã là tín hiệu, state đáng tin hơn lời tự thuật |
| Mảnh việc không vòng đời (exec packet) | **D1** — `D4`/`D9` của `two-layer-dispatch` vẫn gác; phép đo không cấp ca nào |
| Cửa vào riêng `/fgOS:fanout` | **D8** — fan-out là năng lực tự kích hoạt |

### Risk map

| Thành phần | Mức | Cái gì chứng minh được |
|---|---|---|
| Đổi chữ ký `computeSchedule` | **trung bình** | `src/state/store.mjs:1100` là caller đã biết. **Proof point cho `fgos-coding-validating`**: grep/rg toàn repo tìm mọi caller (**không** tin riêng gitnexus — posture degraded), và `npm test` xanh chứng minh không caller nào gãy |
| Đụng hợp đồng anchor của `fgos-coding-driving` (D8) | **cao** | năm caller cùng đọc hợp đồng. **Proof point**: liệt kê thật cả năm từ `SKILL.md:277-283` và nói rõ từng cái đổi hay không đổi hành vi. Đây là rủi ro cao nhất của item |
| Trần 5 Agent (D7) | thấp | một hằng số; sai thì chậm hoặc quá tải, không sai thiết kế |
| Tự động approve lá (D2) | **trung bình** | **Proof point**: chứng minh cổng root **vẫn hỏi**, và lá chạm risk-keyword **vẫn hỏi** (ngoại lệ `gateBypass` D4 giữ nguyên) |
| Đường song song chưa từng chạy thật | **cao** | chính `verify` của item (D10) là proof: chồng lấn thời gian thật đọc từ `.fgos/events.jsonl`, không phải "file skill tồn tại" |

### Thứ tự

`fgos graph --json`: `topUnblock` cho thấy **`tsk-4fg` unblocks 1** — chính
là `tsk-umc`, đúng ràng buộc `mergeAfter` đã đặt. `tsk-umc` không nằm trên
`criticalPath` hiện tại (depth 10, nhánh `tsk-4vo`→`tsk-19y-*`), nên item
này không chặn đường dài nhất của backlog — nó tự do chạy song song với
nhánh đó.

Trong nội bộ item, thứ tự bị **ép bởi phụ thuộc thật**, không phải phán
đoán: bộ chọn wave là hàm thuần mà skill dispatcher cần; skill dispatcher
là thứ chỗ-nối gọi vào.

## Shape

Ba mảnh, mỗi mảnh footprint rời nhau (nên `footprintOverlapAmong` không
báo va chạm), xâu bằng `deps` thành một chuỗi tuần tự thật:

```
tsk-umc
 ├─ 1. bộ chọn wave        (thuần, không dep)
 ├─ 2. skill dispatcher    (dep: 1)
 └─ 3. nối vào chỗ xử lý anchor (dep: 2)
```

*Ghi chú trung thực: chính item này **không** tự dogfood được fan-out —
ba mảnh của nó là một chuỗi tuần tự, không có nhánh song song nào.*

### Các ca đáng chứng minh (theo mức high-risk)

- **rỗng/biên**: tập ứng viên rỗng ⇒ không wave, không spawn. Đúng 1 con ⇒
  vẫn chạy đúng, không cần đường riêng. Nhiều hơn 5 con sẵn sàng ⇒ **đúng
  5** bay, phần còn lại chờ wave sau (D7).
- **hành vi cũ không được gãy**: `computeSchedule` gọi không kèm tập ứng
  viên phải giữ nguyên hành vi hôm nay (toàn frontier) — đây là mặc định
  **đúng** cho case 2 và cho runner, không phải nhánh tương thích ngược tạm
  bợ (`CONTEXT.md` § thuật ngữ "tập ứng viên").
- **truy cập đồng thời**: N con cùng gọi `/fgOS:pick` ⇒ tranh
  `main-checkout.lock` nhưng có backoff (`lock-wait.mjs`) ⇒ xếp hàng, không
  deadlock.
- **hỏng một phần**: một lá verify đỏ ⇒ anh em **độc lập chạy hết**; anh em
  **phụ thuộc A không bao giờ bị claim** vì guard `deps-not-merged` (D9).
  Không có logic hủy mới.
- **đua tiền-kiểm**: tiền-kiểm nói claim được nhưng `claimWork` trượt ⇒ con
  báo lỗi, cha xếp lại wave sau. Tiền-kiểm là *advisory*, `claimWork` là
  *thẩm quyền* (D5).

## Giả định (chưa chứng minh — để `fgos-coding-validating` soi)

1. **Một Agent subagent chạy được `/fgOS:pick`** và vào được worktree của
   nó. Bằng chứng gián tiếp: demo `tsk-1sj` đã làm đúng vậy bằng tay. Chưa
   xác minh trực tiếp cho đường tự động.
2. **Đợi hết wave rồi mới bắn wave sau** (khuôn runner
   `Promise.allSettled` rồi re-poll) là đủ. Nếu `fgos-coding-validating` thấy cần
   bù chỗ trống ngay khi một Agent xong, thì trần 5 (D7) phải áp lên *số
   đang bay*, không phải *kích thước wave*.
3. **Bậc mặc định cho phần tự động approve lá** trong khuôn `gateBypass`
   (`LEVELS = ['off', ...TIERS]`) chưa chọn. Không material ở tầng này —
   nó là một giá trị config, không đổi hành vi thiết kế.

## Open Questions

- Chỗ nối của D8 nằm ở **prose hợp đồng** của `fgos-coding-driving` hay ở
  **từng caller**? `CONTEXT.md` D8 nói *"chỗ xử lý báo cáo
  anchored-by-open-children"* — mà driving **phát** báo cáo còn caller
  **xử lý**. Mảnh 3 dưới đây chọn: viết hợp đồng ở driving (một nơi duy
  nhất định nghĩa caller phải làm gì) **và** nối `/fgOS:cook` làm caller
  cụ thể đầu tiên. Bốn caller còn lại kế thừa hợp đồng nhưng **không** được
  sửa trong item này — nếu `fgos-coding-validating` thấy đó là bỏ sót chứ không
  phải phạm vi, mảnh 3 phải rộng ra.
- `scripts/verify-fanout-overlap.mjs` (D10) chưa tồn tại. Nó thuộc mảnh
  nào? Plan này đặt nó ở **mảnh 3** — mảnh cuối, vì chỉ khi đó mới có
  chồng lấn thật để đo.

## Split

Đã tạo thật, `parent` = `tsk-umc`, `stage` = `decompose` (kế thừa
`CONTEXT.md` đã khoá nên không lặp lại pha clarify), xâu bằng `deps`:

| # | Item | risk | deps | Footprint |
|---|---|---|---|---|
| 1 | **`tsk-ik3`** — bộ chọn wave scope-theo-tập-ứng-viên | light | — | `src/state/graph-metrics.mjs`, `test/state/graph-metrics.test.mjs` |
| 2 | **`tsk-1q2`** — skill fan-out dispatcher | standard | `tsk-ik3` | `.claude/skills/fgos-fanout/SKILL.md` |
| 3 | **`tsk-66d`** — nối vào chỗ xử lý báo cáo anchor | heavy | `tsk-1q2` | `.claude/skills/fgos-coding-driving/SKILL.md`, `plugins/fgOS/skills/cook/SKILL.md`, `scripts/verify-fanout-overlap.mjs` |

Verify từng mảnh:

```
tsk-ik3  node --test test/state/graph-metrics.test.mjs && npm test

tsk-1q2  npm test
         && test -f .claude/skills/fgos-fanout/SKILL.md
         && grep -q '^name: fgos-fanout$' .claude/skills/fgos-fanout/SKILL.md
         && ! grep -q 'selectWave' .claude/skills/fgos-fanout/SKILL.md

tsk-66d  npm test
         && grep -q 'fgos-fanout' .claude/skills/fgos-coding-driving/SKILL.md
         && test -f scripts/verify-fanout-overlap.mjs
         && ! grep -q 'onto the FRONT of the queue' plugins/fgOS/skills/cook/SKILL.md
```

Vế NEGATIVE của `tsk-1q2` (`! grep -q 'selectWave'`) không phải hình thức:
nó cưỡng chế đúng quyết định "không dùng lại `selectWave`" ở § Approach.
Vế NEGATIVE của `tsk-66d` bám vào chuỗi thật đang có trong
`plugins/fgOS/skills/cook/SKILL.md:92` (*"onto the FRONT of the queue"*) —
tức nó chứng minh hàng đợi tuần tự **đã biến mất**, không chỉ chứng minh
có thêm chữ mới.

Mảnh 2 và 3 chạm skill-prose ⇒ verify theo đúng khuôn
`docs/how-to/write-verify-for-a-skill-prose-change.md`: `npm test &&
POSITIVE && NEGATIVE`, cả hai vế bắt buộc.

## Validating — reality gate & feasibility matrix (2026-08-07)

Verdict: **READY WITH CONSTRAINTS**.

| Chiều | Kết quả | Bằng chứng |
|---|---|---|
| Mode fit | PASS | 4 cờ đếm lại đúng. Bỏ cờ hard-gate ra vẫn còn 3 ⇒ `standard`; lane treo vào cách đọc D2 là "removing a validation", đã nói thẳng ở § Mode |
| Repo fit | PASS | `test/state/graph-metrics.test.mjs` tồn tại (32KB, đã sẵn 4 test `computeSchedule`) · `scripts/` tồn tại · bảng caller `fgos-coding-driving/SKILL.md:277-283` đúng 5 dòng · `onto the FRONT of the queue` xuất hiện đúng 1 lần trong `cook/SKILL.md` |
| Assumptions | PASS | A1 nâng lên bằng chứng (dưới); A2/A3 vẫn chưa chứng minh, đã gắn cờ kèm hệ quả |
| Smaller path | PASS | xem § dưới |
| Proof surface | PASS | ba verify chạy được thật; `npm test` baseline **2732 test, 2727 pass, 0 fail, 5 skip** ⇒ tiền tố `npm test &&` có nghĩa, không che đỏ sẵn có |
| Impact-analysis posture | PASS | live: 1 provider `gitnexus` `present`, index sau HEAD (`251d0b5`) ⇒ **degraded**, khớp § Mode |

### Đường nhỏ hơn đã xét — và vì sao nó SAI, không chỉ xấu

Có một đường nhỏ hơn § Approach bỏ sót: để dispatcher tự **giao kết quả**
`computeSchedule(view)` với tập ứng viên, **không** đổi chữ ký — tránh hẳn
mảnh 1 và tránh đụng public contract.

Nó **sai về hành vi**, không chỉ kém đẹp. `computeSchedule` gói **toàn
frontier** theo footprint: một item **ngoài** tập ứng viên có thể chiếm chỗ
wave 0 và đẩy một con **trong** tập xuống wave 1 (`graph-metrics.mjs:
703-733` — deferred, không refused). Lọc **sau khi gói** giữ nguyên vị trí
wave sai đó ⇒ sinh wave thừa và chạy chậm hơn thực tế cần. Scope **trước
khi gói** mới cho wave đúng.

Đây là lý lẽ mạnh nhất cho mảnh 1 (`tsk-ik3`) mà § Approach chưa viết ra.

### Feasibility matrix

| Giả định | Rủi ro | Bằng chứng tìm được | Kết quả |
|---|---|---|---|
| Đổi chữ ký `computeSchedule` không gãy caller | medium | `grep -rn computeSchedule src bin test`: đúng **một** caller production (`store.mjs:32` import, `:1100` gọi) + file test. Baseline xanh | **PASS** — gap nêu thẳng: posture degraded nên đây là bằng chứng **grep**, không phải blast-radius |
| Hợp đồng anchor 5 caller | high | đọc thật `SKILL.md:277-283`: `/fgOS:cook` · `/fgOS:pick` · clarify sweep · planning sweep · execution sweep | **PASS CÓ RÀNG BUỘC** — Open Question #1 chưa đóng |
| Tự động approve lá không rò lên main | medium | `gate-bypass.mjs:1-14` phạm vi chỉ cổng exploring/planning, *"Never touches the awaiting-human park"*, không đụng `approve`; lá merge vào `fgw/<root>` | **PASS** |
| Đường song song chưa từng chạy thật | high | đếm theo **type**: `capacity.dispatch` = **0**. (Grep thô cho 73 — nhưng đó là chuỗi xuất hiện trong prose của chính các doc này, không phải sự kiện. Ghi lại vì đúng loại số đáng ngờ mà `CLAUDE.md` bảo phải đối chiếu trước khi tin) | **PASS** — rủi ro xác nhận có thật |
| A1: subagent chạy được `/fgOS:pick` | giả định của plan | `.fgos/events.jsonl`: `tsk-50ic` → `doing` 04:27:32.774Z; `tsk-30z` → `doing` 04:27:34.837Z (**cách 2.06s**); chồng lấn **184.2s**; cả hai `role: session`; cả hai đạt `awaiting-approval` | **PASS — nâng từ giả định lên bằng chứng** |

### Ràng buộc mang theo sang executing

1. **Open Question #1 chưa đóng** — bốn caller ngoài `/fgOS:cook` kế thừa
   hợp đồng anchor mà không được sửa trong item này. Nếu lúc thi công mảnh
   3 thấy đó là **bỏ sót** chứ không phải phạm vi, mảnh 3 phải rộng ra.
2. **A2 chưa chứng minh** — "đợi hết wave rồi bắn wave sau". Nếu đổi sang
   bù-chỗ-trống thì trần 5 (D7) phải áp lên *số đang bay*, không phải
   *kích thước wave*.
