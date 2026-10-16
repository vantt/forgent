# Phase 07: `/fgOS:terminal` và `terminal-close` sang `attach` / `label` / `release`

Wave 3. Nhánh `terminal-control/p07-skill`, worktree `.claude/worktrees/tc-p07`. Phụ thuộc: P05.

## Đọc trước

r6 §7.3 (`attach`: pane của chính người gọi; `release` của pane `attach` chỉ gỡ gắn kết/nhãn, không bao giờ bị core đóng — **ngoại lệ có chủ đích:** `terminal-close` là người dùng tự đóng pane của mình, xem dưới), §7.10 ("`/fgOS:terminal` (`rename.sh`) chuyển sang `attach` + `label` cùng commit"). Source: [`plugins/fgOS/skills/terminal/{SKILL.md,rename.sh,pane-owned.sh}`](../../plugins/fgOS/skills/terminal/rename.sh), [`plugins/fgOS/skills/terminal-close/{SKILL.md,close.sh}`](../../plugins/fgOS/skills/terminal-close/close.sh). Các file này là nguồn của plugin (không nằm trong `core/skills` hay `.agents/skills`; `mirrorDevSkillsIntoPlugin` không ghi đè chúng — executor kiểm lại bằng `npm run build:skills` rồi `git status`).

## Yêu cầu

- `rename.sh`: giữ chuỗi điều kiện "thiếu gì thì no-op exit 0" (chrome-only, D2 cũ); thay `herdr pane rename` bằng `fgos internal terminal-control attach` (key = writer id của phiên, `pane = $HERDR_PANE_ID`) rồi `label` (`display.label` = `<task-id> …` như hôm nay). `fgos` trên PATH là release đang activate, cùng release với route.
- `close.sh`: người dùng đóng chính pane của mình. Thêm op `release` với `disposition: close` cho pane `attached` **chỉ khi** caller là chính pane đó (`HERDR_PANE_ID` trùng, và `fgos_pane_owned` như hôm nay). Ghi vào contract P00 (sửa qua Lead) là ngoại lệ duy nhất của luật "attach không bị đóng": core không tự đóng, người dùng yêu cầu đóng pane của chính họ.
- `pane-owned.sh` giữ (kiểm sở hữu phía shell).

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `plugins/fgOS/skills/terminal/{SKILL.md,rename.sh}`, `plugins/fgOS/skills/terminal-close/{SKILL.md,close.sh}` |
| sửa (qua Lead) | `packages/terminal-control/contracts/terminal-control.port.v1.json` (ngoại lệ close-own-attached) |
| tạo | `test/plugins/terminal-skill-attach.test.mjs` |

## Test

Với fake herdr + binary build: `rename.sh tsk-x <root>` trong pane giả (`HERDR_ENV=1`, `HERDR_PANE_ID`) → record `attached` + lệnh label đúng; thiếu herdr → exit 0, không gì đổi; `close.sh` đóng đúng pane của mình, pane khác không bao giờ.

## Tiêu chí nghiệm thu / rollback

`rg 'herdr pane (rename|close)' plugins/fgOS/skills` rỗng. Rollback: revert.
