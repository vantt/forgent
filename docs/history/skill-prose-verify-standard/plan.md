# plan — chuẩn mực verify cho item sửa skill prose (`tsk-4l9`)

Nguồn quyết định: `CONTEXT.md` cùng thư mục (D1-D5). Plan này không mở lại
quyết định nào, chỉ trích D-ID.

## Mode: `tiny`

Đếm cờ (1/10 áp dụng):

| Cờ | Áp dụng? |
|---|---|
| auth | không |
| authorization | không |
| data model | không |
| audit/security | không |
| external systems | không |
| public contracts | không — thêm 1 file doc mới, không đổi contract nào |
| cross-platform | không |
| existing covered behavior | không — không đụng code; verify tự chặn `src/` |
| weak proof quanh vùng này | **có** — chính vùng proof yếu này là lý do item tồn tại |
| multi-domain | không |

1 cờ → `tiny`. Deliverable là đúng một file markdown, không có bước phụ
thuộc nhau. Không cần mode lớn hơn: không có code chạy, không có hành vi
được test bao phủ để hồi quy.

`impact-analysis: full` (gate `CLAUDE.md`, provider `gitnexus` `present`).
Không proof point nào của plan này dựa vào blast radius — item không sửa
symbol nào.

## Không split

Một mảnh việc trung thực. `fgos graph --json`: `tsk-4l9` không nằm trên
`criticalPath` (len 2), đứng thứ 5 trong `topUnblock` — không có việc nào
khác chờ nó sau khi D1 gỡ nó khỏi vai trò blocker của `tsk-1c6`
(CONTEXT.md, mục "Việc chuyển đi"). Không có mảnh nào để xếp trước/sau.

## Cách làm

Viết `docs/how-to/write-verify-for-a-skill-prose-change.md` (D5), Diataxis
how-to, frontmatter `type: how-to` như mọi file cùng thư mục.

Nội dung bắt buộc có:

1. **Khi nào dùng** — item thay đổi nội dung prose của một skill
   (`.claude/skills/**/SKILL.md`, `.agents/skills/**/SKILL.md`,
   `plugins/fgOS/skills/**/SKILL.md`).
2. **Verify trông thế nào** (D2) — `npm test`, cộng assert cấu trúc hai vế:
   - **positive**: *deliverable mới thật sự tồn tại* — `test -f`,
     `grep -q '<chuỗi mới đặc trưng>'`
   - **negative**: *pattern cũ đã biến mất* — `! grep -q`, `! rg -l --hidden`
   Nêu rõ vì sao thiếu vế positive là hỏng: xoá sạch deliverable cũng pass.
3. **Bẫy đã gặp thật**, trích từ `tsk-f38` — `--exclude-dir` khớp
   basename-only; thiếu loại trừ file backup; grep nội dung mù với thư mục
   *mang tên* chuỗi cũ; `rg` bỏ qua hidden dir nên không quét
   `.claude/skills/**`; grep cụm đặc trưng thay vì từ đơn.
4. **Chủ sở hữu chứng-minh-runtime** (D3) — không phải verify field, mà là
   smoke-test how-to theo mẫu
   `docs/how-to/smoke-test-fgos-coding-implement-with-a-trivial-item.md`, cộng
   quan sát `.fgos/events.jsonl`. Nêu giới hạn trung thực: event log chứng
   minh đường thuận, không bắt ca âm, không gate được lúc merge.
5. **Ranh giới** — điều verify không được đòi: "tài liệu/prose có đúng và
   dùng được không" là phán đoán của người ở review lúc merge, không lệnh
   shell nào assert được.

## Bản đồ rủi ro

| Thành phần | Rủi ro | Cái gì chứng minh |
|---|---|---|
| Nội dung doc đúng & dùng được | thấp-vừa | Không shell-provable theo đúng D3 — review lúc merge gánh. Đây chính là ca doc mô tả, nên nó tự dogfood. |
| Doc trôi khỏi thực hành | thấp | Verify ghim cụm đặc trưng, nên sửa nội dung mà bỏ mất luận điểm chính sẽ đỏ |
| Item vô tình đụng code | thấp | Verify có `! git diff --name-only main...HEAD \| grep -q '^src/'` |

Không có mục nào ở mức medium/high cần proof point riêng ở `fgos-coding-validating`
ngoài việc đọc lại chính doc.

## File đụng tới

- thêm: `docs/how-to/write-verify-for-a-skill-prose-change.md`
- đã có: `docs/history/skill-prose-verify-standard/CONTEXT.md` (commit `7c95abb`), plan.md này

Không đụng `src/`, không đụng test, không đụng SKILL.md nào.

## Giả định (nhãn rõ, cho `fgos-coding-validating` soát)

- **A1** — `docs/how-to/` là chỗ đúng, không cần thêm entry vào
  `docs/enduser-docs-index.json` trong item này; việc index thuộc khâu
  compound-learn (`fgos-indexing`), sau `delivered`.
- **A2** — không cần trỏ từ `AGENTS.md`/`CLAUDE.md` sang doc mới. Nếu
  `fgos-coding-validating` thấy doc sẽ không được ai tìm ra nếu không có trỏ, đó là
  phát hiện hợp lệ và thêm một dòng trỏ là thay đổi nhỏ, không đổi mode.
- **A3** — verify hiện tại ghim cụm tiếng Việt đặc trưng
  (`deliverable mới thật sự tồn tại`, `pattern cũ đã biến mất`,
  `chủ sở hữu chứng-minh-runtime`). Doc phải chứa đúng các cụm đó — verify
  là contract, cùng shape `tsk-f38` dùng (`grep -q "^name: fgos-coding-implement$"`).

## Verify (một lệnh, đã set trên item)

```
npm test && test -f docs/how-to/write-verify-for-a-skill-prose-change.md && grep -q '^type: how-to$' docs/how-to/write-verify-for-a-skill-prose-change.md && grep -q 'smoke-test-fgos-coding-implement-with-a-trivial-item' docs/how-to/write-verify-for-a-skill-prose-change.md && grep -q 'deliverable mới thật sự tồn tại' docs/how-to/write-verify-for-a-skill-prose-change.md && grep -q 'pattern cũ đã biến mất' docs/how-to/write-verify-for-a-skill-prose-change.md && grep -q 'chủ sở hữu chứng-minh-runtime' docs/how-to/write-verify-for-a-skill-prose-change.md && grep -q 'test -f' docs/how-to/write-verify-for-a-skill-prose-change.md && ! grep -q 'TODO' docs/how-to/write-verify-for-a-skill-prose-change.md && ! git diff --name-only main...HEAD | grep -q '^src/'
```

Chính lệnh này là ví dụ sống của D2: có `npm test`, có vế positive (`test -f`
+ `grep -q` cụm đặc trưng), có vế negative (`! grep -q 'TODO'`, `! git diff
... grep -q '^src/'`).

## Ghi chú quá trình (bằng chứng thứ 5 cho cùng pattern)

Trong lúc chốt `clarify` của chính item này, `fgos discover --verdict clear
--verify` bị `verify-disputed` 2 vòng:

- vòng 1 — judge **đúng**: grep từ đơn `positive`/`negative` match được ở bất
  kỳ ngữ cảnh nào, và thiếu assert rằng item không đụng `src/`. Đã sửa
  verify theo đúng phản hồi.
- vòng 2 — judge đòi *"validation that the guidance would actually work if
  followed"* và *"content coherence"*: không lệnh shell nào assert được. Đúng
  ca D3. Chuyển sang nhánh `lockedContext` (CONTEXT.md đã khoá/duyệt/commit),
  outcome `clear`.

Ghi lại vì nó vừa xác nhận cả hai vế của chuẩn mực này bằng một lần chạy
thật: judge có giá trị thật (vòng 1), và có ngưỡng nó không được vượt
(vòng 2).
