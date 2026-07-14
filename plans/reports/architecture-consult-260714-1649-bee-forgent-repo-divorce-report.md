# Đề xuất ly khai bee ↔ forgent — báo cáo để session song song đánh giá

- Ngày: 2026-07-14 16:49 (Asia/Saigon)
- Trạng thái: **đề xuất, chưa thực thi** (thống nhất làm sau khi session đang chạy xong việc)
- Mục đích báo cáo: để session song song đọc và **đánh giá xem có va chạm kế hoạch của họ không** trước khi mình lên plan chi tiết.
- Không có thay đổi code/gate nào trong turn này. Thuần tư vấn.

---

## 1. Vấn đề

forgent (sản phẩm đang build) và bee (tool/workflow dùng để build) trộn chung một thư mục → khó phân biệt và kiểm chứng file nào của ai. AGENTS.md/CLAUDE.md cũng gánh chung nội dung hai bên.

Đề xuất của user: **bee + artifact vận hành ở lại thư mục gốc; forgent + git repo của nó tách ra `./repo`.** Test thật dùng công cụ forgent chạy bên trong `./repo`.

## 2. Chẩn đoán (đã kiểm chứng, không phải phỏng đoán)

Entanglement có **ba lớp**, gốc rễ nằm ở git-tracking chứ không chỉ tên file:

| Lớp | Bằng chứng |
|---|---|
| Filesystem | `.bee/ .claude/ .agents/ .codex/` (bee) ngang hàng `src/ test/ bin/ .fgos/` (forgent) |
| Git history | 47 file `.bee/` được commit vào repo forgent (bin, lib, hooks, cells, decisions); `.claude/.agents/.codex/`, `plans/`, `docs/history/` cũng committed → lịch sử "forgent" thực chất là "forgent + bee" |
| Docs | `AGENTS.md`/`CLAUDE.md` mỗi file trộn khối vận hành bee + doc sản phẩm forgent |

Cách bee định vị gốc (kiểm chứng trong code):
- Hook walk-up từ `process.cwd()` tới thư mục chứa `.bee/` (`.bee/bin/hooks/adapter.mjs`, `.bee/bin/lib/state.mjs`).
- Hook đăng ký qua `.claude/settings.json`, Claude Code nạp theo cwd.
- `.bee/config.json commands` hiện: `test=npm test`, `verify=npm test && node .claude/skills/distill/scripts/distill.mjs check` — đường dẫn tương đối theo gốc.

## 3. Đường ranh giới đề xuất: "sản phẩm" vs "xưởng"

Khung: **forgent = sản phẩm; bee = xưởng dựng ra nó.**

| → `./repo` (SẢN PHẨM forgent — git repo riêng, sạch) | → gốc hiện tại (XƯỞNG bee) |
|---|---|
| `src/ test/ bin/` | `.bee/` (bin, hooks, cells, decisions, backlog) |
| `.fgos/` `.fgos-runner.json` `package.json` `README` `LICENSE` | `.claude/ .agents/ .codex/` (harness + skill bee-*) |
| `docs/specs/` (BA spec mô tả sản phẩm) | `plans/`, `docs/history/<feature>/` (hồ sơ build) |
| AGENTS.md/CLAUDE.md rút gọn chỉ nói về forgent | AGENTS.md khối vận hành bee + luật xưởng |

Điểm tinh: `docs/history/` + `plans/` là **hồ sơ quá trình build**, không phải sản phẩm → không nên nằm trong lịch sử sạch của forgent. Đây chính là thứ làm repo forgent hết nhiễu.

## 4. Khả thi: nhẹ, không phải re-architecture bee

Mô hình "bee ở gốc, forgent lồng `./repo`", chạy Claude Code **từ gốc (xưởng)**:
- Hook bee load bình thường, root = gốc; ghi vào `./repo/...` chỉ là ghi subdir → **write-guard vẫn chấp nhận, không cần đục lại guard**.
- Chỉ cần chỉnh `.bee/config.json commands` để test/verify chạy **bên trong** `./repo` (`cd repo && npm test`, sửa path distill).
- `./repo` không có `.claude/` riêng (hoặc tối thiểu) → forgent sạch, bee điều phối từ ngoài.

→ Chủ yếu là **di chuyển file + chỉnh config**, không phải viết lại bee.

## 5. Quyết định còn mở (cần user chốt)

1. **Lịch sử git đi đâu:**
   - *Thực dụng (khuyến nghị):* `.git` theo forgent xuống `./repo`; `git rm --cached` tooling bee + `plans/` + `docs/history/`; `.gitignore` chúng. Working tree + commit tương lai sạch; history quá khứ vẫn còn dấu bee (chấp nhận: bản ghi trung thực). Không rewrite.
   - *Thuần khiết:* `git filter-repo` tách đôi hai lịch sử sạch. Nặng, rủi ro, thường không đáng.
2. **"Tại sao ./repo":** `./repo` = chính forgent-thành-repo-sạch, hay cần thêm một **sandbox repo riêng** để forgent-runner dogfood chạy lên? Đổi cách cắt `.fgos/` và cấu hình runner.
3. **`docs/specs/`** thuộc sản phẩm (đi xuống `./repo`) hay xưởng? Nghiêng về **sản phẩm**.

## 6. Cách tiếp cận khi bắt tay (phác thảo, plan chi tiết làm sau)

1. Chốt ranh giới mục 3 (nhất là `docs/specs`, `docs/history`, `plans`).
2. Dời cây file forgent → `./repo`; `.git` theo xuống.
3. `git rm --cached` tooling bee + hồ sơ build khỏi forgent; `.gitignore` ở `./repo`.
4. Tách đôi AGENTS.md/CLAUDE.md.
5. Sửa `.bee/config.json commands` chạy trong `./repo`; smoke-test một cell nhỏ chứng minh vòng bee→ghi `./repo`→verify vẫn xanh.
6. Cập nhật `.fgos-runner.json`/đường dẫn nếu forgent dogfood chính nó trong `./repo`.

## 7. TÁC ĐỘNG LÊN SESSION SONG SONG (phần cần các bạn đánh giá)

Việc này **chưa chạy** và sẽ chờ session của các bạn xong. Nhưng nếu kế hoạch của các bạn có bất kỳ giả định nào dưới đây thì cần biết trước, vì sau ly khai chúng **sẽ đổi**:

- **Đường dẫn tuyệt đối/tương đối tới forgent product:** mọi thứ dưới `src/ test/ bin/ .fgos/` sẽ chuyển sang `./repo/...`. Nếu plan/cell/spec của bạn hardcode `src/runner/...`, `.fgos/...` ở gốc → sẽ lệch.
- **Vị trí `.fgos/`** (events.jsonl là truth, committed): di chuyển vào `./repo/.fgos/`. Code runner đọc/ghi `.fgos/` cần tương thích cwd mới.
- **Cwd của verify:** `npm test` sẽ chạy trong `./repo`, không phải gốc. Nếu bạn dựa vào verify chạy ở gốc → đổi.
- **Ranh giới git:** commit tương lai của forgent nằm trong `./repo/.git`, không phải `.git` gốc hiện tại. Cell "one commit per cell, cell id in message" vẫn giữ, nhưng ở repo mới.
- **`docs/history/<feature>/` + `plans/`** (nơi các bạn đang ghi report phase-2-routing) được xếp về **xưởng (gốc)**, KHÔNG đi xuống `./repo`. Nếu bạn coi chúng là sản phẩm → nêu ý kiến.
- **`docs/specs/`**: đề xuất đi xuống `./repo`. Nếu bạn đang sync spec (bee-scribing) và giả định path gốc → cần biết.

**Câu hỏi cho session song song:** kế hoạch hiện tại của các bạn có (a) hardcode path forgent ở gốc, (b) giả định `.fgos/` hay verify chạy ở gốc, (c) coi `docs/history`/`plans` là sản phẩm không? Nếu có, nêu ra để mình gộp vào plan di trú — hoặc nếu ly khai làm hỏng gì đang dang dở, nói để mình lùi thời điểm.

## 8. Câu hỏi chưa giải quyết

- Lịch sử git: thực dụng hay thuần khiết? (mục 5.1)
- `./repo` = forgent-sạch hay + sandbox dogfood riêng? (mục 5.2)
- `docs/specs/` thuộc sản phẩm hay xưởng? (mục 5.3)
- Gốc (xưởng) sau ly khai có cần là git repo riêng của bee không, hay để plain folder? (bee tooling gần như là dependency cài vào, history riêng ở upstream bee → nghiêng plain folder)
