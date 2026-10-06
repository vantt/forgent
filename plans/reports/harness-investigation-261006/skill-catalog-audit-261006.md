# Kiểm toán catalog skill/công cụ (2026-10-06)

Chỉ đọc. Script: `skill-catalog-measure.py`, `skill-usage-measure.sh`, dữ liệu `skill-descs.json` (cùng thư mục). Ước lượng token = ký tự/4 (xấp xỉ, không đo bằng tokenizer).

## 1. Kết luận ngắn

1. Catalog phình chủ yếu do **một bộ skill ngoài (AgentKit) nạp hai lần** (`ak-*` ở project + `ck-*`/không tiền tố ở `~/.claude/skills`), và gần như không ai gọi. 
2. **Nguồn thật vs bản render không rõ**: chuỗi trỏ đi qua ba tầng, và tài liệu mô tả sai (reading-map nói "byte-identical", thực tế không).
3. Đổi tên/gỡ skill để lại **tham chiếu mồ côi sống** trong chính skill và spec: `fgos-coding-compounding` đã xoá từ 2026-08-25 nhưng vẫn được nêu ở 22 file spec/core. Agent tra tên cũ sẽ không thấy gì.
4. "Tự chế xong mới biết đã có": tìm được **2 ca có bằng chứng đầy đủ** trong memory (+1 ca liên quan). Cỡ mẫu nhỏ, không đủ để nói tỉ lệ (UNPROVEN).

## 2. Số đo kích thước catalog

| Cây | Số skill (có SKILL.md) | Ký tự name+description | ~token |
|---|---|---|---|
| `.claude/skills` (project) | 132 (106 `ak-*`, 18 `fgos-*`, 6 `gitnexus-*`, `ui-spec`, `distill`) | 37 416 | 9 354 |
| `plugins/fgOS/skills` | 54 (+`_shared`): 18 `fgos-*` + 36 verb wrapper | 26 612 | 6 653 |
| `.agents/skills` | 19 (+`_shared`) | 10 426 | 2 606 |
| `core/skills` | 11 (+`_shared`) | 6 694 | 1 673 |
| `domains/coding/skills` | 8 | 3 732 | 933 |
| `~/.claude/skills` (user) | 94 | 21 248 | 5 312 |

- Cây thực sự nạp vào catalog phiên: `.claude/skills` + `plugins/fgOS` + `~/.claude/skills` = 280 mục, **~81,7k ký tự ≈ 20,4k token chỉ riêng description** (chưa tính ~150 skill plugin bên thứ ba chỉ hiện tên, và catalog trong prompt này cũng cắt description ở ~500 ký tự nên con số thật hơi thấp hơn). Median description 224 ký tự, max 951. Đây là ước lượng từ file, không phải đo prompt thật (UNPROVEN ở mức byte).
- Không có `SKILL.md` nào thiếu description (0/…).
- Thân SKILL.md không nạp cho đến khi gọi. Tổng thân `fgos-*` ở `.claude/skills` chỉ 15,9 KB (là wrapper), bản thật (core+domains) 228 KB.

## 3. Trùng tên / chồng tên

**Evidence:** `skill-catalog-measure.py` output.

- 83/106 skill `ak-X` có **bản song sinh** ở `~/.claude/skills` (`X` hoặc `ck-X`), và catalog phiên liệt kê cả hai (`ck:plan` và `ak-plan` cùng có mặt). Trong 83 cặp: 63 description giống hệt, 20 khác. Chi phí trùng: 17 744 ký tự ≈ **4,4k token/phiên** chỉ để liệt kê lại cùng khả năng.
- 18 skill `fgos-*` được liệt kê **hai lần**: wrapper `.claude/skills/fgos-X` và plugin `fgOS:fgos-X` (cùng 9 583 ký tự, ~2,4k token trùng). Gọi `fgos-routing` hay `fgOS:fgos-routing` cho kết quả như nhau, nhưng agent phải biết.
- Cộng lại ~6,8k token/phiên là liệt kê trùng thuần (≈33% catalog).
- Tên chồng chức năng giữa hệ ngoài và hệ fgOS, **không có luật nào nói dùng cái nào** (grep `ak-|ak:|ck:` trong `AGENTS.md`, `domains/coding/AGENTS.md`, `core/skills`, `domains/coding/skills`: chỉ `fgos-coding-shaping/SKILL.md:51-60` nhắc `ck:brainstorm`; `.claude/rules/*.md` nhắc `/ak:preview`, `/ak:team`; rules global nhắc `/ck:preview`, `/ck:team`: hai tiền tố khác nhau cho cùng việc, xem `development-rules.md:30` vs `~/.claude/rules/development-rules.md:27`). Cặp chồng chức năng (đánh giá theo tên/description, không đo hành vi):
  - `ak-plan`/`ck:plan` vs `/fgOS:plan` vs `fgos-coding-planning`
  - `ak-cook` vs `/fgOS:cook`
  - `ak-brainstorm`, `ak-ask` vs `fgos-coding-shaping`/`fgos-coding-exploring`
  - `ak-research` vs `fgos-researching`
  - `ak-team`/`ak-orchestrate` vs `fgos-fanout`/`fgos-group-thinking`
  - `ak-watzup` vs `/fgOS:ready|stale|list`
  - `ak-worktree` vs worktree do `/fgOS:pick`
  - `ak-code-review` vs panel review của fgOS
- Cực đoan trùng nhau trong plugin (Jaccard từ khoá description): `discover-loop`<>`plan-loop` 0,89; `move`<>`return` 0,67; `discover`<>`plan` 0,66. Giữa cây ngoài, trùng mô tả cao nhất chỉ 0,32 (`ask`<>`research`), tức mô tả ngoài **khác nhau về chữ nhưng chồng về việc**: Jaccard từ khoá không bắt được loại chồng chéo này. Chỉ số này yếu, chỉ dùng tham khảo.

## 4. Skill chết / không ai gọi

- Phép đo: tham chiếu trong repo (ngoài cây skill, `upstreams`, `archive`) + số lần gọi trong transcript (205 phiên, 2026-09-05 đến nay, gồm subagents; chỉ bắt `"skill":"…"` và `<command-name>`). Script `skill-usage-measure.sh`.
- 106 skill `ak-*`: **4 từng được gọi** (`ak-plan` 10, `ak-cook` 3, `ak-journal` 1, `ak-docs` 1); **70/106 không có tham chiếu repo lẫn lần gọi nào**.
- Skill ngoài `ck:*` (user): gọi `research` 1 lần, còn lại 0 (mẫu giới hạn: transcript chỉ phủ 1 tháng, không phủ phiên ở project khác; `~/.claude/skills` dùng chung nhiều project nên "chết ở đây" không có nghĩa "chết ở mọi nơi").
- Skill fgOS được gọi nhiều nhất: `fgos-coding-validating/planning/driving` (12 mỗi cái), `fgos-researching`, `fgos-coding-discovering` (11). Hệ fgOS tự dùng tốt; phần chết nằm ở cây ngoài.
- Lưu ý đo: skill gọi bằng ngôn ngữ tự nhiên không để lại dấu `Skill`; con số gọi là cận dưới.

## 5. Nguồn thật vs bản render: có rõ không?

**Sự thật (đo):**
- Nguồn: `core/skills/` (11) + `domains/coding/skills/` (8). `.agents/skills/` = md5 giống nguồn, không có dấu hiệu render nào. `plugins/fgOS/skills/` giống nguồn, cộng 36 verb wrapper (36 là nguồn thật, chỉ ở plugin). `.claude/skills/fgos-*` là **wrapper mỏng** (15,9 KB tổng) chép "generated thin wrapper … do not edit directly" rồi trỏ `../../../.agents/skills/<name>/SKILL.md` là "canonical skill source" (`.claude/skills/fgos-routing/SKILL.md:12-14`).
- Nhưng `.agents/skills` **cũng là bản render** (memory `project_agents_skills_is_render_target_edit_core_skills`; assembly `scripts/build-skill-wrappers.mjs`). Vậy dấu hiệu duy nhất agent thấy ("edit the source") **chỉ vào một bản render khác**; bản này không có chú thích gì để chỉ tiếp về `core/skills`. Agent sửa `.agents/skills` sẽ bị mất khi chạy lại (memory ghi sự cố đã xảy ra).
- `ui-spec` nằm tracked ở `.claude/skills` như nguồn (không có bản core), `distill` thì ở core + `.agents` nhưng **không** có ở plugin: ba cây không có cùng tập.
- `docs/specs/reading-map.md:26` nói `.claude/skills/` (`.agents/skills/` mirror byte-identical): **sai với hiện trạng** (`.claude` là wrapper, md5 khác nguồn: 19/19 DIFF). Cùng dòng nêu `fgos-coding-compounding` làm skill hiện hành (đã xoá). `reading-map.md:27` nói plugin có "12 verb wrapper"; thực tế 36.
- `.claude/skills/*` bị gitignore (`.gitignore:66`), chỉ 87 file tracked; 106 `ak-*` là cài đặt ngoài (cập nhật 2026-08-30) nên không nằm trong lịch sử repo.
- `.claude/worktrees/` có 26 worktree chứa 2 684 file SKILL.md (bản chép cũ, một số của skill đã xoá như `fgos-code-panel`). Grep rộng bằng `find`/`grep -r` ra các bản trùng này; chỉ ảnh hưởng nếu agent tìm không loại trừ worktree (UNPROVEN có ca thật).

## 6. Tham chiếu mồ côi do đổi tên/gỡ skill

Skill đã xoá từ 2026-08-01 (git log `--diff-filter=D`): `fgos-capability-dispatching`, `fgos-code-change`, `fgos-code-panel`, `fgos-coding-compounding` (c1768fa51, 2026-08-25), `fgos-plan-loop`, `fgos-submit-assist`; thêm 26 skill được thêm trong cùng kỳ (đổi tên chạy nhanh).

Tham chiếu sống tới `fgos-coding-compounding` (không tồn tại): 22 file trong core/domains/AGENTS/specs/docs, gồm `core/skills/fgos-indexing/SKILL.md:7,16,18` (description chính nói "Use once `fgos-coding-compounding` has stored…"), `core/skills/fgos-routing/SKILL.md:149`, `core/agents/docs-manager.yaml:20`, `core/agents/fgos-placeholder.yaml:23`, và 4 chú thích trong `src/`, `bin/fgos.mjs`. Skill thay thế là `fgos-coding-knowledge` (cùng c1768fa51 lần thêm). Đây là sự lệch giữa hệ đặt tên và phần mô tả ("tên cũ vẫn là tên đang dùng" theo mọi tài liệu), không phải nhiễu từ catalog.
Các tên còn lại (code-panel, code-change, v.v.): chỉ 1-2 file nhắc, ít rủi ro.

## 7. Ca "tự chế/không tra sẵn có" (reinvention)

Nguồn: memory dir `~/.claude/projects/-home-vantt-projects-forgentX/memory/` (61 file), `plans/reports`, `git log`.

| # | Ca | Bằng chứng | Cách tìm được sẵn có |
|---|---|---|---|
| 1 | tsk-3m6 (2026-08-14): kết luận item "chưa tồn tại" và định park, trong khi `fgos-clarifying` (tsk-qod) đã làm đúng việc đó | `feedback_check_skill_roster_before_declaring_unbuilt.md` | Mô tả skill nằm **sẵn trong catalog ngữ cảnh suốt phiên** ("…then classify which domain it belongs to"). Tra không tốn gì, nhưng người dùng phát hiện trước agent. |
| 2 | P6 (2026-10-02): dựng lại confined-herdr cho codex/pi/agy, vốn đã giải một lần rồi bị refactor gỡ | `feedback_prior_art_before_design_git_log_old_ids.md` | Không nằm trong catalog: chỉ tìm được bằng `git log -S` theo ID executor cũ (5bbd066cd, e7bd9b418, a9fc61324, cfd670c43). Tốn "hàng giờ". Quy tắc đã thêm vào `AGENTS.md` ("Prior art before design") và `.claude/rules/primary-workflow.md`. |
| 3 | tsk-3m6 cùng ngày: kế hoạch dựa trên CONTEXT.md đã cũ (backlog STR52 hoãn, commit tsk-2yo phá tiền lệ) | `feedback_scan_codebase_relevance_before_planning.md` | `docs/backlog.md` + `git log` từ `headAtTake`; cùng gốc "tin tài liệu của item hơn hiện thực". Không phải tự chế, là phát hiện muộn. |

- Đếm: **2 ca tự chế/dựng lại có bằng chứng**, 1 ca stale-context liên quan. Quét `plans/reports` và `docs/journals` bằng regex (`reinvent|re-derived|already existed…`) chỉ ra các ca không phải tự chế (re-derive trong ngữ cảnh kỹ thuật khác); không tìm thêm ca nào chắc chắn. Cỡ mẫu 2-3: **không đủ ước lượng tỉ lệ**; chưa quét transcript (1,1 GB) để tìm thêm.
- Cả hai ca đều đã được viết thành rule văn xuôi sau khi xảy ra (memory feedback và AGENTS.md). Chưa có cơ chế ép (không có bước tra `fgos` hay hook): UNPROVEN rule văn xuôi đó có đủ; ca 2 xảy ra **sau** khi các quy tắc kiểu này đã tồn tại (ca 1 memory 2026-08-14 vs ca 2 2026-10-02) nhưng `AGENTS.md` rule được thêm sau ca 2 nên không kết luận được.

## 8. Điều đáng giữ

- Hệ fgOS tự dùng ổn: tập `core/skills`+`domains/coding/skills` nhỏ (19 skill, 228 KB), `.agents`/plugin giống nguồn byte-by-byte (không trôi), có script build và kiểm.
- Wrapper `.claude/skills/fgos-*` giữ catalog nhỏ (thân 15,9 KB), ý tưởng tốt; chỉ cần chuỗi trỏ rõ hơn.

## 9. Đề xuất nhỏ nhất theo RUL11 (để anh cân nhắc, em không sửa gì)

Mỗi đề xuất giảm nguồn/chỗ, có cách đo:

1. **Một bộ tiền tố ngoài, không hai.** Giữ `ak-*` (project) hoặc `ck-*` (user), gỡ phần còn lại khỏi catalog phiên của repo này. Xoá: ≥83 mục liệt kê trùng, ~4,4k token. Đo: số mục catalog và token description trước/sau; chạy lại `skill-catalog-measure.py`. Rủi ro: các project khác dùng `ck:` ở user level. Quyết định của anh (đụng cài đặt cá nhân).
2. **Một chỗ liệt kê cho fgos-*.** Gỡ `.claude/skills/fgos-*` wrapper hoặc plugin copy, không giữ cả hai (18 mục trùng, ~2,4k token). Đo: số mục `fgos-*` trong catalog = 18.
3. **Chuỗi nguồn một bước.** Wrapper và `.agents/skills` đều trỏ thẳng `core/skills|domains/coding/skills`; sửa `reading-map.md:26-27` (mô tả sai). Đo: grep `canonical` chỉ ra một đường duy nhất; kiểm tra tự động khẳng định mô tả khớp cây (thay cho văn xuôi).
4. **Đổi tên `fgos-coding-compounding` → `fgos-coding-knowledge` ở 22 chỗ** (hoặc thêm kiểm tra: mọi tên skill trong spec/description phải tồn tại). Đo: `git grep fgos-coding-compounding` về 0 ngoài lịch sử/decision.
5. Chọn một luật ngắn "dùng skill fgOS cho việc trong repo này, skill ngoài cho việc ngoài phạm vi fgOS" nếu anh chốt hướng (bỏ rule trùng đi cùng, không thêm lớp luật).

## 10. UNPROVEN / giới hạn

- Số token catalog là ước lượng từ file, không đo prompt thực; catalog thật cũng chứa ~150 skill plugin bên thứ ba chưa đo.
- Tỉ lệ "tự chế" không tính được (n=2-3). Chưa quét 205 transcript.
- "Skill chết" chỉ phản ánh repo này, 1 tháng, và cận dưới (gọi tự nhiên không để dấu).
- Không chứng minh được agent bị lệch vì có quá nhiều skill (chưa chạy thí nghiệm nhiễu).
- Tác động của việc ak/ck trùng lên hành vi agent (chọn nhầm) chưa có ca thật; chỉ chứng minh được trùng và chi phí.

## Câu hỏi còn mở

- Anh có cần `ck:*` ở user level cho project khác không (quyết định đề xuất 1)?
- `ak` và `ck` là hai bản cùng một kit hay hai kit? Rules global dùng `/ck:`, rules repo dùng `/ak:`: nguồn nào thắng?
- `fgos-coding-knowledge` là tên chốt, hay sẽ đổi lại?

Status: DONE_WITH_CONCERNS
Summary: Đã đo catalog (~20,4k token description, ~6,8k trùng liệt kê), 4/106 ak-skill từng được gọi, chuỗi nguồn-render sai trong reading-map, 22 tham chiếu mồ côi tới skill đã xoá, 2 ca reinvention có bằng chứng.
Concerns: Tỉ lệ reinvention không đủ mẫu; token là ước lượng; chưa quét transcript lớn; cây bên thứ ba chưa đo.
