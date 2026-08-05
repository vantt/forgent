---
type: how-to
title: Viết verify cho một item thay đổi skill prose
tags: []
timestamp: 2026-08-05T00:00:00.000Z
source_capture_ids: []
---

# Viết verify cho một item thay đổi skill prose

## Khi nào dùng

Khi item bạn đang làm thay đổi **nội dung prose của một skill** — bất kỳ
file nào trong:

- `.claude/skills/**/SKILL.md`
- `.agents/skills/**/SKILL.md`
- `plugins/fgOS/skills/**/SKILL.md`

Những file này là prose do một LLM diễn giải lúc chạy, không phải code xác
định. Không lệnh shell tĩnh nào assert được hành vi runtime của chúng. Tài
liệu này nói `verify` nên trông thế nào, và ai gánh phần còn lại.

## Verify trông thế nào

Hai vế, bắt buộc cả hai, cộng `npm test`:

```
npm test && <POSITIVE> && <NEGATIVE>
```

**Vế POSITIVE — chứng minh deliverable mới thật sự tồn tại.**

```
test -f .claude/skills/<ten-skill>/SKILL.md
grep -q '^name: <ten-skill>$' .claude/skills/<ten-skill>/SKILL.md
grep -q '<cum-dac-trung-cua-hanh-vi-moi>' plugins/fgOS/skills/<ten>/SKILL.md
```

**Vế NEGATIVE — chứng minh pattern cũ đã biến mất.**

```
! grep -q '<cum-cua-hanh-vi-cu>' plugins/fgOS/skills/<ten>/SKILL.md
! rg -l --hidden '<ten-cu>' --glob '!node_modules' --glob '!.git' .
```

### Vì sao thiếu vế POSITIVE là hỏng

Một verify chỉ có vế negative sẽ **pass khi bạn xoá sạch deliverable**.
Không còn file thì đương nhiên không còn chuỗi cũ. Đây là lỗi thật, bắt
được ở vòng dispute thứ tư của `tsk-f38`
(`docs/history/rename-fgos-executing-to-fgos-code-implement/CONTEXT.md`).

## Năm cái bẫy đã gặp thật

Rút từ `tsk-f38` (rename một skill trên ~200 file). Cả năm đều là lỗi
verify thật, không phải giả định:

1. **`--exclude-dir` khớp basename-only.** Loại trừ theo tên thư mục không
   khớp được đường dẫn nhiều cấp như `.claude/worktrees/**`. Dùng
   `rg --glob '!.claude/worktrees/**'` thay vì `grep --exclude-dir`.

2. **Quên loại trừ file backup do chính hệ thống sinh.**
   `.fgos/events.jsonl.backup-*` giữ nguyên chuỗi cũ mãi mãi. Không loại
   trừ thì verify không bao giờ xanh được.

3. **Grep nội dung mù với thư mục *mang tên* chuỗi cũ.** Một `grep` chỉ
   soi nội dung file sẽ bỏ qua một thư mục hay file vẫn còn tên cũ. Ghép
   thêm một check trên đường dẫn: `! git ls-files | grep '<ten-cu>'`.

4. **`rg` mặc định bỏ qua hidden directory.** Nghĩa là nó **không hề quét**
   `.claude/skills/**` hay `.agents/skills/**` — đúng chỗ skill sống. Luôn
   thêm `--hidden` khi verify đụng skill file.

5. **Grep từ đơn quá yếu.** `grep -q 'positive'` khớp được ở bất kỳ ngữ
   cảnh nào. Ghim **cụm đặc trưng, đủ dài** để không thể khớp ngẫu nhiên —
   verify là contract về nội dung, cùng cách `tsk-f38` ghim
   `grep -q '^name: fgos-code-implement$'`.

## Chủ sở hữu chứng-minh-runtime

`verify` **không** phải nơi chứng minh prose chạy đúng.
Vai trò chủ sở hữu chứng-minh-runtime thuộc về hai thứ dưới đây:

**1. Smoke-test có tài liệu.** Theo mẫu
`docs/how-to/smoke-test-fgos-code-implement-with-a-trivial-item.md`: thêm
một item `chore` vứt đi với `verify: "true"`, claim nó, để skill chạy thật,
rồi đọc kết quả từ evidence đã ghi trong `.fgos/events.jsonl` —
`outcome`, `attempts`, `errorClass`, `aheadCount`. Viết một smoke-test
how-to riêng khi thay đổi đủ đáng để cần một quy trình lặp lại được.

**2. Chính event log.** Mọi lần dispatch thật đều ghi vào
`.fgos/events.jsonl`. Sau khi một thay đổi skill merge, các lần chạy thật
kế tiếp hoặc cho thấy đúng hình dạng event mong đợi, hoặc không.

Giới hạn trung thực của kênh này:

- chứng minh tốt **đường thuận** — skill chạy, item tiến stage đúng chuỗi;
- **không** bắt được ca âm ("skill lẽ ra phải DỪNG mà không dừng" không
  sinh event nào);
- **không** gate được lúc merge — đây là quan sát post-hoc.

Chấp nhận được vì nhịp dùng thật đủ dày để một regression lộ trong vài
giờ, và blast radius là một phiên khựng, không phải mất dữ liệu.

## Ranh giới: điều verify không được đòi

Một `verify` **không** được yêu cầu chứng minh:

- "hướng dẫn này có dùng được không nếu làm theo"
- "nội dung có mạch lạc không"
- "prose có được LLM diễn giải đúng ý lúc chạy không"

Không lệnh shell nào assert được những thứ đó. Chúng là phán đoán của
người, thuộc **review lúc merge** và bước reality check của
`fgos-validating` — không thuộc verify field.

Khi vòng kiểm tra thứ hai (`judgeVerifySemanticCorrectness`) đòi một trong
số đó, đây là câu trả lời để trích dẫn. Khi nó chỉ ra một trong năm cái bẫy
ở trên, nó đúng — sửa verify, đừng bỏ qua.
