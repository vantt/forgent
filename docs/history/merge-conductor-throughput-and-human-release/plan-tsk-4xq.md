# plan-tsk-4xq.md — Playbook cho ba block reason còn lại + thu stop rule

Mode: **standard** — 2 cờ: *existing covered behavior* (`docs/explanation/
merge-loop-self-diagnoses-verify-fail-post-merge.md` là bằng chứng đã ship
rằng "mọi reason khác đều cố ý để nguyên"; item này đảo đúng câu đó) và
*weak proof around the area* (prose skill không assert được bằng shell —
`docs/how-to/write-verify-for-a-skill-prose-change.md` nói thẳng chủ sở hữu
chứng-minh-runtime là smoke-test + event log, không phải verify field).
Không cờ hard-gate: không đụng auth, không đụng data loss, không gỡ một
validation nào — `catchup` vẫn verify-trước-commit y nguyên, cổng Iron Law
y nguyên; thứ thay đổi là **máy gọi người sau bao nhiêu lượt**, không phải
kiểm tra nào bị bỏ.

Lane nhỏ hơn (`small`) không thật thà: `small` là "vài file, không vùng
xám", mà đây có đúng một vùng xám thật — ranh giới giữa "máy tự xử được"
và "phải gọi người" — và nó là toàn bộ nội dung của item.

Quyết định khoá: `CONTEXT.md` D1 (root chưa gom đủ con **không** được
land từng phần vào `main`). Thiết kế: `DISCUSSION.md` §6 ("Người bị gọi
lúc nào" — sau thiết kế chỉ còn ba chỗ) và §7
`#task-escalation-playbooks` (acceptance 1–4).

`impact-analysis: full` — `fgos tool query --capability impact-analysis
--status present` trả `gitnexus`/`present` (2026-08-12). Không dùng làm
proof point: footprint của item không chứa symbol nào (hai file prose
`SKILL.md`), nên blast radius trên call graph rỗng theo định nghĩa, không
phải theo thiếu bằng chứng.

## Tín hiệu đồ thị

`fgos graph --json` (2026-08-12): `componentCount` 343, `topUnblock`
**skipped**, `criticalPath` không đi qua `tsk-4xq`. Đồ thị **không cho tín
hiệu thứ tự** cho item này — cùng kết luận parent `plan.md` đã ghi. Thứ tự
dưới đây rút từ ràng buộc nội tại (carve-out phải viết trước playbook, vì
playbook nào cũng phải chạy sau nó), không phải từ metric.

## Approach

**Đường chọn**: nhân bản đúng khuôn `verify-fail-post-merge` đã có trong
`merge-loop/SKILL.md` step 4, thêm hai thứ bao quanh nó:

1. **Một khối carve-out chạy TRƯỚC mọi playbook** — hai ca không bao giờ
   được playbook hoá:
   - `iron-law` (acceptance 3) — giữ nguyên từng chữ, RUL34/RUL37;
   - **D1** (acceptance 4) — `<id>` là root, target là `main`, và còn ít
     nhất một con chưa ở trạng thái terminal ⇒ escalate ngay, không chạy
     playbook nào, không retry, bất kể `reason` là gì.
2. **Một khối "Running a playbook" dùng chung** — dấu vết quyết định qua
   `fgos decision --id <id>`, trần "một lần mỗi id mỗi loop run", và bảng
   đọc outcome của `fgos catchup` (`merged`/`already-caught-up`/
   `conflict`/`verify-fail`+`timedOut`). Ba playbook mới đều gọi
   `catchup`, nên bảng này viết một lần thay vì ba lần (DRY) — và nó là
   chỗ duy nhất ghi "playbook thất bại thì báo cái gì lên".

Rồi ba playbook mới, mỗi cái bốn mục acceptance-1 đòi: **dấu hiệu / bước
máy tự thử / điều kiện dừng / báo gì khi thất bại**.

Cuối cùng thu stop rule: "cùng id kẹt hai lượt liên tiếp" chỉ còn áp cho
reason **chưa** có playbook.

**Vì sao `catchup` là bước tự xử đúng cho cả ba**: không phải suy đoán —
`bin/fgos.mjs:3814` `CATCHUP_REASONS` đã nhận đủ sáu reason, và ba comment
ngay trên nó ghi thẳng lý do cho đúng ba reason này:

- `merge-failed-unclassified` — tsk-18a D1: "a `merge-failed-unclassified`
  park is actually the BEST fit for catchup among these four — the failure
  wasn't a real conflict, so simply re-attempting the merge... may just
  succeed once whatever transient condition caused it has passed";
- `verify-timeout-post-merge` — tsk-53o: "a timed-out post-merge check is
  exactly the transient condition this comment already describes, and
  catchup (a retry) is the correct next step for it, not a manual rework";
  cộng detail string do chính code sinh ra (`bin/fgos.mjs:3366`): "not a
  verify failure; merge aborted, main unchanged, **rerun catchup**".
- `integration-drift` — `bin/fgos.mjs:3287`/`3363`: reason này chỉ sinh ra
  cho root **có con**, merge vào `main`, khi conflict hoặc verify đỏ
  (không timeout). Nội dung của nó đúng nghĩa "nhánh root đã lệch so với
  `main` hiện tại", mà `catchup` = merge `main` vào nhánh root rồi verify
  lại — đúng thao tác reason đang mô tả.

Cơ chế tự xử vì thế **đã tồn tại và đã được duyệt**; thứ thiếu là prose
bảo skill dùng nó. Đây đúng lời §7: "các reason còn lại dừng chờ người VÌ
CHƯA AI VIẾT PLAYBOOK".

**Phương án đã loại**:

- *Viết code cho `merge-loop` tự retry* — loại. Footprint của item là prose;
  cơ chế retry (`catchup`) đã có, thêm code là dựng lại thứ đang chạy.
- *Cho playbook retry nhiều lần khi "có vẻ đang khá hơn"* — loại bởi chính
  tiền lệ tsk-3mv D3, đã chốt và đã ship: điều kiện dừng là **tín hiệu tiến
  triển**, không phải trần số lần; một chẩn đoán, một retry, rồi thôi. Nhân
  bản khuôn nghĩa là nhân bản luôn kỷ luật này.
- *Nâng `timeoutMs` mặc định trong `.fgos/config.json` khi gặp timeout* —
  loại, và là **fix đã bị bác tên rõ** trong
  `docs/how-to/avoid-a-hung-verify-on-return-approve-catchup.md`: "raising
  the default `timeoutMs` (papers over the symptom rather than fixing the
  ambiguity — an even slower machine would just hit the same wall at a
  higher number)". Playbook chỉ được dùng `--timeout` một-lần-một-lệnh,
  không đụng config.
- *Gộp `integration-drift` chung playbook với `merge-conflict`* — loại.
  `merge-conflict` là phạm vi tsk-60h; và D1 đúng nằm trong ca
  `integration-drift` nên nó cần carve-out riêng, không được gộp.
- *Sửa `merge-next/SKILL.md`* — loại, xem "File đụng" bên dưới.

## Risk map

| Thành phần | Mức | Cái gì chứng minh được |
|---|---|---|
| Thu stop rule (playbook giấu lỗi thật thành "đã tự xử") | **cao** | Ba chốt đọc được thẳng trong prose: (a) mỗi playbook chạy **tối đa một lần mỗi id mỗi run**, kẹt lại lần hai là dừng ngay — nhân bản tsk-3mv D3; (b) mỗi playbook ghi `fgos decision --id <id>` TRƯỚC khi thử, nên không có đường im lặng; (c) `catchup` tự nó verify-trước-commit và `git merge --abort` khi đỏ, nên một playbook "hăng" cũng không thể land cây chưa xanh |
| Carve-out D1 không bắt đủ ca | **cao** | Điều kiện viết bằng dữ liệu đọc được, không bằng phán đoán: `resolveRoot(view,id) === id` (target là `main`) **và** tồn tại `w.parent === id` với `status` ∉ {delivered, retrospective, cleanup, done, wontfix} — đúng vị từ `frontier.mjs`'s `hasOpenDescendant` đã dùng, và đúng tập terminal `fgos-coding-driving` đã dùng cho anchor |
| Iron Law bị đụng gián tiếp | trung bình | Vế NEGATIVE + đọc diff: câu Iron Law hiện có (step 4 bullet cuối + step 5 nguyên khối) không đổi một chữ; carve-out mới **thêm** chứ không thay |
| Prose không assert được bằng shell | trung bình | Chấp nhận có ý thức, theo `docs/how-to/write-verify-for-a-skill-prose-change.md`: verify chỉ gánh POSITIVE/NEGATIVE về nội dung; chứng-minh-runtime thuộc event log + review lúc merge. Đây là câu trả lời trích dẫn sẵn nếu `judgeVerifySemanticCorrectness` đòi "prose có chạy đúng không" |

## Ca cụ thể cần chứng minh

- **Biên**: `<id>` là leaf (target là `fgw/<rootId>`, không phải `main`) mà
  reason lại là `integration-drift` — không thể xảy ra theo code
  (`:3287` chỉ chạy ở nhánh root→main), nhưng playbook vẫn phải đọc
  `resolveRoot` chứ không giả định; `<id>` là root **không con** —
  `hadChildren` false ⇒ reason là `merge-conflict`/`verify-fail-post-merge`,
  carve-out D1 không kích hoạt, đúng.
- **Không được hồi quy**: playbook `verify-fail-post-merge` hiện có giữ
  nguyên từng bước; cổng Iron Law (step 4 bullet cuối + step 5) giữ nguyên;
  bullet "frontier rỗng" và bullet "merge thành công" giữ nguyên.
- **Hỏng một phần**: `catchup` trả `verify-fail` với `timedOut: false` sau
  một playbook timeout ⇒ đây là verify đỏ THẬT, không được đếm là timeout
  lần hai, và không được chạy tiếp playbook thứ hai trong cùng run.

## Giả định

- `merge-loop/SKILL.md` là nơi DUY NHẤT stop rule "kẹt hai lượt" sống —
  **đã kiểm**, không phải giả định: `grep -rn "consecutive"
  plugins/fgOS/skills/` trả đúng một dòng, `merge-loop/SKILL.md:129`.
- `merge-blocked-other-item` "đã có playbook" theo nghĩa cơ chế
  (tsk-4hj D2 đưa nó vào `CATCHUP_REASONS`), chưa có prose riêng trong
  `merge-loop/SKILL.md` — **chưa chứng minh** rằng nó không cần prose;
  ngoài phạm vi item này (§7 khai đúng ba reason), ghi lại đây để
  `fgos-coding-validating` nhìn.

## Verify — và vì sao verify khai sẵn phải sửa

Verify đang lưu trên item có vế NEGATIVE **rỗng nghĩa**:

```
! grep -q 'any block reason (merge-conflict/verify-fail/iron-law) persists across two consecutive picks' plugins/fgOS/skills/merge-loop/SKILL.md
```

Chuỗi đó **không hề tồn tại** trong file hôm nay (`grep -c` = 0), nên vế
này xanh sẵn trước khi ai sửa gì — đúng lỗi "negative không phân biệt
được" mà `docs/how-to/write-verify-for-a-skill-prose-change.md` cảnh báo
(bẫy #5: ghim cụm đặc trưng, đủ dài, và phải là cụm THẬT). Câu nuốt-chung
thật sự đang nằm ở `merge-loop/SKILL.md:129-131` và đọc là:

> "(whether both are Iron Law, both are merge-conflict/verify-fail, or
> one of each)"

`grep -c` cụm đó = **1** hôm nay ⇒ dùng nó làm NEGATIVE thì vế này đỏ
trước khi sửa và xanh sau khi sửa, đúng nghĩa một contract.

Và ba vế POSITIVE khai sẵn cũng **quá yếu** — chạy thử trên file CHƯA sửa
cho thấy `grep -q 'integration-drift'` đã **PASS sẵn**: chuỗi đó đang nằm ở
`merge-loop/SKILL.md:116`, trong danh sách "reason skill này không bao giờ
điều tra". Nó khớp một lần nhắc tình cờ, không chứng minh có playbook nào.
Đúng bẫy #5 ("grep từ đơn quá yếu").

Verify sau khi sửa (qua `fgos edit --verify`, kèm `fgos decision` ghi lý
do — không sửa lén):

```
npm test && grep -q 'Playbook: integration-drift' plugins/fgOS/skills/merge-loop/SKILL.md && grep -q 'Playbook: verify-timeout-post-merge' plugins/fgOS/skills/merge-loop/SKILL.md && grep -q 'Playbook: merge-failed-unclassified' plugins/fgOS/skills/merge-loop/SKILL.md && grep -q 'only for a block reason that has NO playbook' plugins/fgOS/skills/merge-loop/SKILL.md && ! grep -q 'whether both are Iron Law, both are merge-conflict/verify-fail, or' plugins/fgOS/skills/merge-loop/SKILL.md && ! git diff --name-only main...HEAD -- src bin | grep -q .
```

Ba vế POSITIVE đầu ghim `Playbook: <reason>` — vẫn chứa nguyên chuỗi reason
mà verify khai sẵn đòi, nên acceptance gốc được **siết chặt hơn**, không hề
nới. Vế POSITIVE thứ tư chứng minh acceptance 2 (stop rule đã thu), vì ba vế
đầu không nói gì về stop rule. Vế cuối chặn phạm vi: item này tuyên bố "chỉ
đụng prose, chạy song song an toàn với làn 1" (parent `plan.md`), nên verify
phải assert đúng điều đó thay vì để nó là lời hứa — cùng cách `tsk-4l9` tự
thêm `! git diff ... | grep -q '^src/'` cho chính nó. `main...HEAD` hôm nay
trên nhánh này trả đúng ba file `docs/history/merge-conductor-.../*`, không
có `src/`/`bin/`.

**Bằng chứng verify thật sự phân biệt được** — chạy đúng sáu vế trên file
CHƯA sửa (`npm test` bỏ qua, chỉ chạy phần grep):

```
FAIL  POS integration-drift
FAIL  POS verify-timeout-post-merge
FAIL  POS merge-failed-unclassified
FAIL  POS narrowed-stop-rule
FAIL  NEG swallow-everything-clause
PASS  NEG no src/bin in diff
```

Năm vế nội dung đều đỏ trước khi sửa — đúng nghĩa contract, không phải
xanh-giả. Vế cuối xanh sẵn và phải giữ xanh (item không được đụng `src/`
hay `bin/`).

## Đính chính (validating)

Hai chỗ Approach ở trên nói chưa đủ chính xác, sửa lại đây thay vì để
implement tự đoán:

- **D1 phải soi cả cây hậu duệ, không chỉ con trực tiếp.**
  `frontier.mjs:254-259` `hasOpenDescendant` đi hết chuỗi `parent` xuống dưới
  ("a direct child, or a descendant reachable through further `parent`
  chains"), và tập terminal thật là `TAIL_RESOLVED_STATUSES`
  (`frontier.mjs:244`) = `delivered`/`retrospective`/`cleanup`/`done`, cộng
  `wontfix`/`statusCategory === 'canceled'` (`:245`, `:250-251`). Carve-out
  viết theo đúng vị từ này.
- **`verify-timeout-post-merge` KHÔNG chỉ xảy ra ở đường root→main.**
  `bin/fgos.mjs:3220` sinh cùng reason đó trên đường leaf→root
  (`target` là `fgw/<rootId>`, không phải `main`), detail ở `:3229` cũng kết
  bằng "rerun catchup". Playbook vì thế không được giả định target là
  `main`; nó đọc target từ envelope/`resolveRoot`, đúng như `catchup` tự làm
  (`bin/fgos.mjs:3860-3862`).

## Thứ tự

Một file, một lượt sửa, nhưng thứ tự trong file có ràng buộc thật:

1. **Carve-out trước** (Iron Law + D1) — mọi playbook phải chạy sau nó,
   nên nó phải đứng trên chúng trong prose, không phải một chú thích cuối
   step 4.
2. **Khối "Running a playbook" dùng chung** — ba playbook đều trỏ vào.
3. **Ba playbook mới**.
4. **Thu stop rule** — câu cuối, vì nó định nghĩa bằng "reason nào KHÔNG
   có playbook ở trên".

## File đụng

- `plugins/fgOS/skills/merge-loop/SKILL.md` — toàn bộ thay đổi.
- `plugins/fgOS/skills/merge-next/SKILL.md` — **không sửa**, dù có trong
  footprint khai báo. `merge-next` chạy một phát rồi báo cáo; nó không giữ
  stop rule nào (`grep` "consecutive" không trả dòng nào ở đó), nên thêm
  playbook vào đó sẽ là bản sao thứ hai của cùng một luật — đúng thứ
  `merge-loop` đang tránh. Footprint khai rộng hơn thực tế là vô hại
  (`mergeReadiness` chỉ dùng nó để serialize), khai hụt mới nguy.

## Outstanding questions

None
