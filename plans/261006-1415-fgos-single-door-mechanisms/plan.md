---
title: "fgOS single-door mechanisms: roster, render header, canonical door, root hygiene, ask-vs-decide"
description: "Thực thi H1 (a-d), H3, H5 của harness investigation 261006: mỗi năng lực một nguồn + cơ chế kiểm, gom rác gốc repo, một lần ghi AGENTS.md."
status: pending
priority: P2
effort: 11h
branch: main
tags: [harness, skills, distribution, doctor, githooks, agents-md, rul11]
created: 2026-10-06
---

# fgOS single-door mechanisms

```txt
Plan status: Proposed — not authorized for execution
Source: plans/reports/harness-investigation-261006-synthesis.md (§5 V1-V4, V7, V8, V10, V15; §7 H1, H3, H5; §8)
Out of scope: H2 (component `convention`, Plan B), H4 (A/B experiment), H6 (plan 260925-documentation-authority-unification),
              mọi file của AgentKit/ClaudeKit/rtk (ak-*/ck-* skills, .claude/hooks/*, .claude/rules/*, ~/.claude/*, rtk)
```

## Phát hiện làm thay đổi phạm vi so với synthesis (đã kiểm lại 2026-10-06)

1. **H1a không chỉ "kiểm và đóng".** `fgos-code-panel`/`fgos-plan-loop` bị xoá ở `6527596eb` (2026-10-01), không phải `8eff54d0f` (commit đó chỉ đổi thành stub). Nhưng roster chép tay **vẫn còn** ở `core/skills/fgos-architecture-panel/SKILL.md:191-194,221-231,604-613,682`: dùng executor id đã đổi tên (`claude-bwrap`, `agy-bwrap`, `codex-bwrap` — không còn trong `.fgos/config.json`, đổi ở `e7bd9b418`/`a9fc61324`) và model `gpt-5.6-sol` không có trong `runner.modelPolicies`. `runner.pools` không tồn tại trong config. → Phase 01.
2. **H1b:** 0/53 file `.md` trong `.agents/skills` có header. Wrapper `.claude/skills/*/SKILL.md` gọi `.agents/skills` là "canonical skill source" (`src/setup/skill-wrappers.mjs:131`); `docs/specs/distribution.md:63` (row 4b) bảo maintainer sửa `.claude/skills/fgos-*` rồi chép tay. Drift guard đã có: `test/setup/skill-wrappers.test.mjs:269`.
3. **H1c:** đã có hai cơ chế, chưa được gọi tên làm cửa: `scripts/run-rust-dev-host.mjs` (Rust host debug + dev manifest `legacyNode.root: "."`, không có npm script, không có trong how-to) và quy trình stage lại (`docs/how-to/measure-a-real-case.md` §5). Kích hoạt kiểu dev qua `fgctl`: chưa tìm thấy (UNPROVEN). Manifest release không ghi commit nguồn, nên check doctor phải so nội dung payload.
4. **H1d:** M06 đã được gom ở `e92cfe66f` + `d74dfea58` vào `core/skills/_shared/catchup-self-recovery.md`; approve/merge-loop/merge-next nay cùng trỏ một playbook. Không cần sửa → đóng có bằng chứng ở Phase 00.
5. **H3:** registry doctor thật là `src/setup/registrations.mjs` (`checks.mjs` chỉ re-export). Check `main-checkout-hook-wired` (`registrations.mjs:1436`) đã kiểm `core.hooksPath` → H3(iii) tái dùng, không thêm check mới. Backdoor `FGOS_TEST_SUITE` của T03 đã không còn (0 hit).

## Phases

| # | Phase | Covers | Depends on | Effort | Status |
|---|---|---|---|---|---|
| 00 | [Preconditions + verify-and-close](phase-00-preconditions-and-verify-close.md) | H1a facts, H1d, T03, PC1 | — | 0.5h | pending |
| 01 | [Architecture-panel roster binds through config](phase-01-architecture-panel-roster-single-source.md) | H1a (V2) | 00 | 1.5h | pending |
| 02 | [Generated header on every skill render file](phase-02-skill-render-generated-header.md) | H1b (V3) | 01 | 2h | pending |
| 03 | [Canonical door research + decision D1](phase-03-canonical-door-research-decision.md) | H1c(i) (V1) | 00 (parallel với 01/02, read-only) | 1.5h | pending |
| 04 | [Doctor check: active release vs checkout + lệnh dev `fgos:dev`](phase-04-doctor-active-release-drift-check.md) | H1c(iii) (V1), lệnh dev của D1=B | 02, 03 | 3h | pending |
| 05 | [Root-file guard + gated junk deletion](phase-05-root-file-guard-and-junk-cleanup.md) | H3 (V7) | 04; deletion gated by G1 | 2h | pending |
| 06 | [AGENTS.md single-writer edits + anchor test](phase-06-agents-md-single-writer.md) | H1b pointer, H1c(ii), H3(iv) (V8, V15 phần), H5 (V10) | 02, 04, 05, D1, PC1 | 1h | pending |

Dependency graph: `00 → 01 → 02 → 04 → 05 → 06`; `00 → 03 → (D1) → 04, 06`. Phase 01/02/04/05/06 tuần tự vì cùng ghi `CHANGELOG.md`, `docs/specs/distribution.md`, `src/setup/registrations.mjs` hoặc output của `npm run build:skills`. **Plan B (`convention`) sửa `AGENTS.md` sau Phase 06**, không song song.

## Gates và decision points

| Id | Loại | Ai | Nội dung | Phase |
|---|---|---|---|---|
| PC1 | Precondition | anh (owner) | Thay đổi chưa commit ở `AGENTS.md:169`, `CLAUDE.md` (dòng số liệu GitNexus do `gitnexus analyze` sinh) phải được anh commit riêng hoặc discard **trước** Phase 06. Plan không chạm, không revert chúng. | 00, 06 **Đã xong 2026-10-06:** commit riêng `5df843bdb` (chỉ hai dòng số liệu); Phase 06 vẫn phải kiểm lại `git status` lúc chạy vì phiên khác có thể làm bẩn lại. |
| D1 | Decision | anh | **Đã chốt: B** (anh quyết 2026-10-06) — gọi tên dev door có sẵn `scripts/run-rust-dev-host.mjs` qua npm script `fgos:dev` (Phase 04 thêm). A (stage lại) dùng khi cần `fgos` trơn mới. C (dev activation qua `fgctl`) là plan draft riêng `plans/261006-1445-fgctl-dev-activation/`, không chặn plan này. | 03 |
| D2 | Decision | anh | **Đã chốt (2026-10-06): `git mv` `tsk-1op-case-study-note.md` vào `docs/history/`.** | 05 |
| G1 | Gate | anh | **Duyệt có điều kiện (2026-10-06): được xoá 30 file tracked + `output.txt` (19 byte, `produced by worker`), với điều kiện gắn tag `pre-root-junk-cleanup` trước khi xoá.** Xác nhận cuối cùng vẫn lấy lúc thi hành (Phase 05 bước 5). | 05 |

## Acceptance criteria (đo được)

1. Skill sources (`core/skills/**`, `domains/*/skills/**`) chứa **0** executor id đã retire và **0** model id có chữ số lấy từ `runner.modelPolicies`; test mới đỏ trên tree hiện tại, xanh sau Phase 01.
2. Số file `.md` trong render targets (`.agents/skills/**`, `plugins/fgOS/skills/{fgos-*,_shared}/**`, `.claude/skills/fgos-*/**`) thiếu header generated (hoặc marker wrapper) = **0** (baseline: 53/53 file `.agents` thiếu). `test/setup/skill-wrappers.test.mjs` drift guard và `test/skills/fgos-mirror.test.mjs` xanh.
3. Doctor check `active-release-matches-checkout` được `registerCheck`, có trong `test/setup/checks.test.mjs` id list, trong `docs/specs/distribution.md` row #7 và bảng check ở how-to; test: fail khi payload release khác working tree, pass khi khớp, pass-skip ngoài source checkout.
4. `.githooks/pre-commit` từ chối commit thêm file mới ở gốc repo ngoài allowlist (exit 1), cho qua file trong allowlist; test e2e mới đỏ trước khi thêm guard, xanh sau. Các test hook hiện có (`test/e2e/main-checkout-lock-hook*.test.mjs`, `test/runner/merge.test.mjs`, ...) vẫn xanh.
5. Sau G1: `git ls-files | grep -v / | wc -l` = 14 (hoặc 15 nếu D2 = giữ); không còn file nào tạo bởi `ca854f443` ở gốc.
6. `AGENTS.md`: pointer `_shared` trỏ `core/skills/_shared/executor-dispatch-fallback.md` (file tồn tại); có câu H5 nguyên văn dưới mục 2; có rule cửa chuẩn, rule scratch, rule no-backdoor; anchor test mới xanh; toàn bộ thay đổi AGENTS.md nằm trong **một** commit của Phase 06.
7. `env -u CLAUDE_CODE_SESSION_ID npm test` xanh ở cuối Phase 06.

## Prior art (đã dùng lại / còn thiếu)

- Dùng lại: drift guard `assembleSkills` (`test/setup/skill-wrappers.test.mjs:269`), byte-mirror test (`test/skills/fgos-mirror.test.mjs`), dead-vocabulary pattern (`test/runner/dead-vocabulary-guard.test.mjs`), anchor test RUL11 (`test/docs/rul11-anchor-phrase.test.mjs`, luật L8 anchor-suite), `resolveActiveReleaseForDoctor` (`src/setup/registrations.mjs:4509`), `hashFile` (`scripts/build-rust-distribution.mjs:41`), `scripts/run-rust-dev-host.mjs`, check `main-checkout-hook-wired`, playbook `_shared/catchup-self-recovery.md`.
- Còn thiếu: header generated; test cấm roster chép tay trong skill; check so payload release với checkout; guard file gốc; rule trong AGENTS.md.

## Rủi ro chính

| Rủi ro | L×I | Giảm thiểu |
|---|---|---|
| Guard gốc repo làm vỡ test dùng hook thật trong repo tạm (commit `seed.txt` ở gốc) | High×High | Guard chỉ bật khi toplevel đang commit có marker `apps/fgos/Cargo.toml` (cùng marker doctor dùng); chạy toàn bộ test hook liệt kê ở Phase 05 |
| Header làm đổi byte mọi render file → nhiều test đọc `.agents/skills` lệch | Med×Med | Phase 02 liệt kê 20 file test đọc `.agents/skills`, chạy hết trước `npm test` |
| D1 chưa chốt → Phase 04/06 chặn | Med×Low | Phase 03 read-only, chạy song song 01/02 |
| Phiên song song ghi chung checkout | Med×High | Mỗi phase commit ngay khi xanh (memory: commit immediately after green verify) |

## Rollback

Mỗi phase là một commit (Phase 05 có thể hai: guard, rồi xoá). Revert commit; phase đụng render thì chạy lại `npm run build:skills` sau revert. File xoá ở Phase 05 lấy lại bằng `git checkout ca854f443 -- <file>`; `output.txt` untracked không lấy lại được (G1 phải nêu rõ).

## Component boundary

Không đổi ownership/parent-child/state-write authority: check mới thuộc area distribution/doctor có sẵn, guard thuộc hook có sẵn. Phase 04 và 06 ghi note "No component-boundary change" sau khi đối chiếu `docs/platform/component-boundary.md`.

## Ghi chú: tài liệu cũ đang di trú

Plan `260925-documentation-authority-unification` đã chạy dở trên một branch riêng (đã đóng pha kiểm kê, tạm dừng chờ Observe, chưa merge; branch có 59 commit chưa merge vào main, còn main đã đi trước branch 399 commit (tính từ 2026-09-29)). Các sửa của plan này lên tài liệu cũ (`docs/specs/distribution.md` ở phase 02 và 04, `docs/specs/reading-map.md` nếu có) là **ngoại lệ cần ghi nhận** khi plan đó được nối lại; không thêm tài liệu cũ mới. Plan này không sửa gì trong worktree của plan 260925.

## Executor brief (`ak:cook`)

Phiên thi hành dùng `/ak:cook <đường dẫn file phase>` (một phase mỗi phiên). Đọc theo thứ tự: file này (§ mục tiêu, phụ thuộc, tiêu chí chấp nhận, Red Team Review), file phase, **mục "Hiệu chỉnh sau red-team" ở cuối file phase (nó thắng nội dung cũ)**, rồi báo cáo tổng hợp `plans/reports/harness-investigation-261006-synthesis.md` khi cần ngữ cảnh.

Quy tắc chung của mọi phiên:
- Không bao giờ truyền `--yagni`: anh yêu cầu làm đủ phạm vi đã nêu. Mỗi phase cần anh cho phép tường minh trước khi bắt đầu (phase nào đã ghi cổng riêng thì giữ cổng đó).
- Làm trong một worktree riêng của phase (có `node_modules` và `target/` trước khi chạy test); `pwd` và `git branch --show-current` trước lệnh git; không ghi vào main checkout, nơi phiên khác đang làm việc. Commit bằng đường dẫn tường minh (`git commit -- <paths>`), conventional, không nhắc AI, không nhãn phase hay mã phát hiện trong comment hoặc tên test, và commit ngay khi xanh.
- Chạy test với `env -u CLAUDE_CODE_SESSION_ID`; chạy ở foreground có timeout, không tự chạy lệnh nền rồi chờ. Đếm bằng script hoặc `rtk proxy`, không dùng `grep | wc` qua hook `rtk` (từng cho 130 thay vì 3320).
- Chạy impact analysis (GitNexus) cho từng symbol sẽ sửa trước khi sửa; chỉ số đang chậm commit nên đối chiếu thêm bằng grep thô.
- `ak:cook` bắt buộc code-reviewer và finalize; kết quả review không thay cho kiểm độc lập của người điều phối. Điểm dừng báo anh: một giả định trong phase hoá ra sai, một hiệu chỉnh mâu thuẫn với mã thật, cần sửa ngoài danh sách file, hoặc một bước không đảo ngược được (xoá file, đổi hook).
- `ak-*`, `ck-*`, hook và rules của AgentKit/ClaudeKit và `rtk` là của người khác: dùng như công cụ, không đề xuất sửa.
- Model của phiên: gợi ý, chưa đo. Phase cơ khí chạy được với bậc `sonnet` hoặc tương đương; phase đánh dấu `--advice` nên chạy với model mạnh nhất có sẵn. `--advice` bật giám sát `kongming` (theo skill: Fable 5 trên Claude subscription). Chỉ Claude, Codex và Cursor có trong bảng định tuyến của `--advice`; chạy `ak:cook` trên host khác là chưa kiểm chứng.

Chế độ theo phase (mặc định `--interactive`, có cổng duyệt của người; `--auto` chỉ cho phase cơ khí):

| Phase | Cờ gợi ý | Lý do |
|---|---|---|
| 00 | `--auto --no-test` | Xác minh và đóng, không đổi mã |
| 01 | `--tdd` | Test đỏ trước; có điểm dừng về tư thế confinement |
| 02 | `--tdd` | Đổi bộ build, cần test drift |
| 03 | `--auto --no-test` | Chỉ đọc |
| 04 | `--tdd --advice` | Phức tạp nhất: check doctor, refactor build, `fgos:dev` |
| 05 | `--advice`, **không `--auto`** | Hook chạm mọi commit; xoá file chỉ sau xác nhận cuối G1 và tag |
| 06 | `--advice`, **không `--auto`** | Luật trong `AGENTS.md`, một người ghi |

## Red Team Review

### Session 2026-10-06 (`ak plan validate` qua; bốn reviewer: Failure Mode, Assumption, Scope & Complexity, Security)
**Số finding thô:** 30 (từ 4 reviewer), gộp trùng còn 22. **Chấp nhận:** 20, **từ chối:** 2. Các điểm lead tự đo lại: `node_modules` (233 mục trong hai release, 0 ở release đang kích hoạt), `fgos:dev` dùng `process.cwd()`, `target/` symlink chung, 16 file test chạm hook, capability `architecture:*` không có confinement, id đã gỡ ở dòng 134-171, doctor không đọc `.degraded`.

| # | Finding | Mức | Quyết định | Áp dụng vào |
|---|---|---|---|---|
| 1 | Check drift đỏ vĩnh viễn vì `node_modules` được stage (ba reviewer độc lập) | Critical | Accept | Phase 04 |
| 2 | `fgos setup` qua release cũ xoá header render Phase 02 | High | Accept | Phase 02, 06 |
| 3 | Test chặn roster mù với id cũ, gắn với config sống | High | Accept (cấm theo hình dạng) | Phase 01 |
| 4 | Xoá đoạn bất biến sandbox; capability `architecture:*` thiếu confinement | High | Accept | Phase 01 |
| 5 | Baseline thiếu 6 dòng id đã gỡ (134-171) | High | Accept | Phase 00, 01 |
| 6 | Khuyên `--no-verify` bỏ qua mọi chốt chặn hook | High | Accept | Phase 05 |
| 7 | Quy tắc "sửa allowlist cùng commit" tự hại và sai trong worktree | High | Accept (commit riêng, hạ cánh ở main) | Phase 05, 06 |
| 8 | Chốt chặn gốc repo làm vỡ merge commit của `fgos approve` sau verify | High | Accept (bỏ qua khi `MERGE_HEAD`) | Phase 05 |
| 9 | `npm run fgos:dev` chạy verb trên thư mục fgOS (cwd của npm) | High | Accept (`INIT_CWD`) | Phase 04 |
| 10 | `fgos:dev` đồng thời ở các worktree phá nhau (`target/` chung) | High | Accept (ghi ràng buộc, tôn trọng `CARGO_TARGET_DIR`) | Phase 04, 06 |
| 11 | Cây so sánh không rõ; phụ thuộc cwd; worktree | High | Accept | Phase 04 |
| 12 | Thứ tự A trước B không được ép cơ học | Medium | Accept | Phase 06 |
| 13 | Tên báo cáo của Plan A trái quy ước đã khoá | Medium | Reject: báo cáo trong thư mục plan nằm ngoài phạm vi `check` của Plan B; đổi tên chỉ gây xáo trộn | Ghi ở Plan B |
| 14 | Phase 03 lặp nghiên cứu Plan C; D1-pre đổi trạng thái kích hoạt | Medium | Accept (thu nhỏ, bỏ D1-pre) | Phase 03 |
| 15 | Tín hiệu băm `target/release/fgos` không được yêu cầu | Medium | Accept (bỏ) | Phase 04 |
| 16 | Plan B kỳ vọng tín hiệu Rust-stale mà Plan A không cho | Medium | Accept (nêu giới hạn, sửa Plan B) | Phase 04, Plan B |
| 17 | Danh sách nơi dùng và test lân cận của Phase 04 thiếu (7 nơi) | Medium | Accept | Phase 04 |
| 18 | Danh sách test hook của Phase 05 thiếu (16 file) | Medium | Accept | Phase 05 |
| 19 | Lệnh kiểm tag G1 không hiện 30 file | Medium | Accept (`git ls-tree`) | Phase 05 |
| 20 | Symlink làm sập cả `fgos doctor` qua bộ liệt kê file | Medium | Accept (bọc thân check) | Phase 04 |
| 21 | Không có bước stage lại và chạy doctor qua shim | Medium | Accept | Phase 02, 04 |
| 22 | Đọc allowlist từ index của cây đang commit | Medium | Reject: phức tạp, trái thiết kế hook tuyệt đối; quy tắc "hạ cánh ở main trước" đủ | Phase 05 |
