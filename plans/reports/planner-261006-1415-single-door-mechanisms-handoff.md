# Handoff: Plan A — fgOS single-door mechanisms

Ngày 2026-10-06. Plan: [plans/261006-1415-fgos-single-door-mechanisms/plan.md](../261006-1415-fgos-single-door-mechanisms/plan.md). Trạng thái: Proposed — not authorized for execution.

## Plan gồm gì

| Phase | Nội dung | Đo "xong" bằng |
|---|---|---|
| [00](../261006-1415-fgos-single-door-mechanisms/phase-00-preconditions-and-verify-close.md) | Baseline, đóng H1d (M06) và T03 bằng commit, PC1 | 8 số baseline có lệnh |
| [01](../261006-1415-fgos-single-door-mechanisms/phase-01-architecture-panel-roster-single-source.md) | Roster `fgos-architecture-panel` bind qua config + test cấm roster chép tay | test đỏ → xanh; 0 id retire, 0 model id cụ thể trong skill sources |
| [02](../261006-1415-fgos-single-door-mechanisms/phase-02-skill-render-generated-header.md) | `assembleSkills` ghi header generated sau frontmatter; sửa câu "canonical" của wrapper; sửa `distribution.md` row 4b | 0 render `.md` thiếu header; drift guard + mirror test xanh |
| [03](../261006-1415-fgos-single-door-mechanisms/phase-03-canonical-door-research-decision.md) | Research cửa chuẩn (read-only) + D1 | Q1-Q3 có file:line; D1 do anh chốt |
| [04](../261006-1415-fgos-single-door-mechanisms/phase-04-doctor-active-release-drift-check.md) | Check doctor `active-release-matches-checkout` (so payload release với working tree) | test 5 case; registered; spec + how-to + id list |
| [05](../261006-1415-fgos-single-door-mechanisms/phase-05-root-file-guard-and-junk-cleanup.md) | Guard file mới ở gốc trong `.githooks/pre-commit`; xoá 30 file rác sau G1 | e2e test đỏ → xanh; root tracked 45 → 14 |
| [06](../261006-1415-fgos-single-door-mechanisms/phase-06-agents-md-single-writer.md) | Một commit duy nhất cho `AGENTS.md`: H5, pointer `_shared`, cửa chuẩn, scratch, no-backdoor + anchor test (L8) | anchor test xanh; `npm test` xanh |

Thứ tự: `00 → 01 → 02 → 04 → 05 → 06`, Phase 03 song song với 01/02. Plan B sửa `AGENTS.md` sau Phase 06.

## Điểm em đính chính so với synthesis

1. H1a **chưa xong**: roster chép tay còn ở `core/skills/fgos-architecture-panel/SKILL.md` với id đã đổi (`claude-bwrap`/`agy-bwrap`/`codex-bwrap`) và model không có trong config (`gpt-5.6-sol`). Skill xoá ở `6527596eb`, không phải `8eff54d0f` (commit đó chỉ đổi thành stub). `runner.pools` không tồn tại.
2. H1d **đã xong**: M06 được gom ở `e92cfe66f` + `d74dfea58`; không cần sửa.
3. H3(iii) **đã có**: check `main-checkout-hook-wired`; plan tái dùng, không thêm check. Registry doctor thật là `src/setup/registrations.mjs` (`AGENTS.md:80` vẫn ghi `checks.mjs`, vốn chỉ là shim).
4. H1c(i): đã có `scripts/run-rust-dev-host.mjs` (dev manifest `root: "."`) và quy trình stage lại; chưa thấy dev activation trong `fgctl`. Khuyến nghị của em cho D1: B (gọi tên dev door có sẵn) + A khi cần.

## Bằng chứng: kiểm lại hay thừa hưởng

- **Em kiểm lại (2026-10-06):** lịch sử xoá skill; hit roster/model trong mọi cây skill (raw, `rtk proxy`); key config; số file render và việc thiếu header; câu wrapper; `distribution.md:63`; sự tồn tại của `core/skills/_shared/executor-dispatch-fallback.md`; `activation.json`, manifest release (không có commit nguồn, `legacyNode.root libexec/legacy-node`, 614 file), 8 release; độ ưu tiên tier của shell function; `legacy_exec.rs` dò dev manifest; doctor registry và các check rust-host; 45 file gốc, 30 từ `ca854f443`, không có import thật; M06 đã sửa; `FGOS_TEST_SUITE` 0 hit; GitNexus `present`; test hook commit file ở gốc (lý do phải giới hạn guard).
- **Thừa hưởng, chưa kiểm:** nhãn và phân loại của 57 ca, số liệu rater, kết luận §3-4 của synthesis, chi tiết M10/M30/M23, độ cũ của index GitNexus.

## Rủi ro

- Guard gốc repo có thể làm vỡ khoảng 8 file test dùng hook thật (chúng commit `seed.txt` ở gốc repo tạm) → guard chỉ bật khi có marker `apps/fgos/Cargo.toml`.
- Header đổi byte của mọi file render → 11 test khác đọc `.agents/skills`, đã liệt kê để chạy.
- Check doctor sẽ đỏ thường trực trong repo nếu D1 không cho một cách rẻ để đồng bộ.
- `npm test` không hermetic trong phiên agent → mọi lệnh test đều dùng `env -u CLAUDE_CODE_SESSION_ID`.

## Tác dụng phụ của phiên lập plan

Em chạy `node bin/fgos.mjs coordination --help` để kiểm verb đã retire. Lệnh đó ghi thêm một dòng vào `.fgos/logs/invocation-faults.jsonl` (gitignored, log cục bộ). Ngoài file này, em không ghi gì ngoài thư mục plan và report này.

## Câu hỏi còn mở

1. **PC1:** anh commit hay discard thay đổi số liệu GitNexus chưa commit ở `AGENTS.md`/`CLAUDE.md`?
2. **D1:** A, B hay C (Phase 03)? Em khuyến nghị B, kèm A khi cần.
3. **D2:** `tsk-1op-case-study-note.md` ở gốc: giữ, chuyển vào docs history, hay xoá?
4. **G1:** anh có xác nhận xoá 30 file tracked và `output.txt` untracked không? `output.txt` xoá xong là không lấy lại được.
5. `fgos-architecture-panel` còn mô tả `fgos coordination run` (verb đã retire ở `2180b4e72`; `:136,147,643`) và trỏ `src/verbs/coordination/run.mjs`, file đã bị xoá. Phần này ngoài roster. Anh muốn tách thành work item riêng không?
6. `docs/specs/reading-map.md:26` vẫn mô tả `.claude/skills` cùng một bản mirror là lớp hướng dẫn. Em để lại cho plan H6 (260925); anh xác nhận cách chia này chứ?
7. Hai pointer chết nằm ngay cạnh phạm vi plan, nhưng em chưa đưa vào để không tự thêm việc: `AGENTS.md:80` ghi `src/setup/checks.mjs` (registry thật là `registrations.mjs`), và `.githooks/pre-commit:34` có `HOW_TO_DOC` trỏ tới file không tồn tại. Hai cái đều sửa được với chi phí gần bằng 0 ngay trong Phase 06/05. Anh có muốn gộp vào không?
8. Ngoài phạm vi hiện tại: guard chưa chặn thư mục mới ở gốc; file render không phải markdown (`.agents/skills/distill/scripts/*.mjs`) chưa có header. Có cần làm không?
9. V15 mới được phủ một phần: plan đưa hai doctrine scratch và no-backdoor vào `AGENTS.md`. Các doctrine fgOS khác hiện chỉ có trong `.claude/rules` không được track (one-H1, component-boundary check) thì chưa chuyển. Có đưa vào plan này không?
10. Memory của anh (`project_fgos_shell_function_stale_staged_release_shim.md`) đang khuyên dùng `node bin/fgos.mjs`. Sau D1, memory này cần được cập nhật để khớp với rule cửa chuẩn.
