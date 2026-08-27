---
type: how-to
title: Viết verify cho một item thay đổi skill prose
tags: []
timestamp: 2026-08-05T00:00:00.000Z
source_capture_ids: []
framework: diataxis
mode: how-to
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
(`docs/history/rename-fgos-executing-to-fgos-coding-implement/CONTEXT.md`).

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
   `grep -q '^name: fgos-coding-implement$'`.

## Chủ sở hữu chứng-minh-runtime

`verify` **không** phải nơi chứng minh prose chạy đúng.
Vai trò chủ sở hữu chứng-minh-runtime thuộc về hai thứ dưới đây:

**1. Smoke-test có tài liệu.** Theo mẫu
`docs/how-to/smoke-test-fgos-coding-implement-with-a-trivial-item.md`: thêm
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
`fgos-coding-validating` — không thuộc verify field.

Khi vòng kiểm tra thứ hai (`judgeVerifySemanticCorrectness`) đòi một trong
số đó, đây là câu trả lời để trích dẫn. Khi nó chỉ ra một trong năm cái bẫy
ở trên, nó đúng — sửa verify, đừng bỏ qua.

## Bằng chứng thật: verify sau cùng đã pass

Capture thật của `tsk-f38` (nguồn của năm cái bẫy ở trên):

- Friction ghi nhận một lần `blocked`, layer `verification`, errorClass
  `verify-miss`: `"goal-check failed on branch \"fgw/tsk-f38\" (exit 1)"`
  — đây là một trong các vòng dispute trước khi năm cái bẫy được vá hết.
- Sau khi verify được sửa đủ cả năm cái bẫy, outcome thật:
  `"outcome": "awaiting-approval", "passed": true, "attempts": 1`.
  Verify cuối cùng pass ngay lần chạy đầu — bằng chứng cụ thể rằng vá đủ
  năm cái bẫy (không phải bốn, không phải ba) mới đủ để verify một rename
  ~200 file xanh thật, không phải xanh giả do thiếu quét.

## Tài liệu này tự minh hoạ đúng luật nó viết ra

Chính item viết tài liệu này (`tsk-4l9`) cũng phải sửa verify của mình hai
vòng trước khi chốt — hai lỗi thật, không phải giả định:

1. **Grep từ đơn quá yếu** (đúng cái bẫy #5 ở trên): bản đầu chỉ
   `grep -q 'positive'`/`grep -q 'negative'`, khớp được ở bất kỳ ngữ cảnh
   nào. Sửa bằng cách ghim cụm đặc trưng dài (vd `'deliverable mới thật sự
   tồn tại'`, `'pattern cũ đã biến mất'`).
2. **Thiếu vế chặn phạm vi**: verify ban đầu không assert rằng item này
   (một item viết prose) không đụng tới `src/`. Sửa bằng thêm
   `! git diff --name-only main...HEAD | grep -q '^src/'`.

Vòng dispute thứ ba của chính item này còn đòi verify chứng minh "guidance
would actually work if followed" — đúng ca `content coherence` ở mục
"Ranh giới" phía trên. Trả lời (trích dẫn thật, không phải suy diễn):

> "Second-pass vòng 2 đòi thứ shell không chứng minh được ('guidance would
> actually work if followed', 'content coherence'). Đúng ca D3 của
> CONTEXT.md: chất lượng nội dung thuộc review lúc merge + fgos-coding-validating,
> không thuộc verify field. Verify giữ nguyên..., chuyển sang đường
> lockedContext vì CONTEXT.md đã khoá/duyệt/commit."

## Cập nhật (`tsk-rlv`): tài liệu này giờ tự trồi lên đúng thời điểm cần

`tsk-1x7` (một item chỉ sửa `fgos-coding-validating/SKILL.md`) tự viết verify
riêng — 2 lệnh grep, không `npm test`, không cấu trúc POSITIVE/NEGATIVE —
mà không hề biết tài liệu chuẩn này đã tồn tại. Kết quả: đúng 3 vòng
dispute-park-force, một phần lẽ ra tránh được nếu trích dẫn thẳng tài
liệu này từ đầu.

Nguồn gốc bug được thu hẹp phạm vi trong `docs/history/judge-verify-check
-missing-stage-context/CONTEXT.md` (D1/D2): đề xuất ban đầu là sửa
`judgeVerifySemanticCorrectness` để bỏ qua khiếu nại "comprehension" cho
diff chỉ-đụng-docs — nhưng sau khi `tsk-3jy` (anti-repeat prompt fix
chung, đã giao) hạ cánh và tài liệu chuẩn này được tìm thấy đã tồn tại
sẵn, sửa đúng chỗ hoá ra không phải sửa code judge mà là **làm cho
session thấy tài liệu này TRƯỚC khi tự viết verify**, không phải sau khi
đã tự viết sai.

Sửa: `fgos-coding-exploring/SKILL.md` và `fgos-coding-planning/SKILL.md` giờ trỏ thẳng
về tài liệu này ngay tại điểm viết `verify`, có điều kiện: khi item đang
làm đụng một đường dẫn `SKILL.md` (`.claude/skills/**/SKILL.md`,
`.agents/skills/**/SKILL.md`, `plugins/fgOS/skills/**/SKILL.md`) — đúng
phạm vi tài liệu này tự khai ở đầu. Một session viết verify cho item
skill-prose giờ được trỏ tới chuẩn có sẵn ngay trong luồng
`fgos-coding-exploring`/`fgos-coding-planning` của chính nó, không cần đã biết trước
tài liệu này tồn tại.
