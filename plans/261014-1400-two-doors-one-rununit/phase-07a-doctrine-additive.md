# Phase 07a — Doctrine chỉ cộng thêm + decision 0060/0061; cổng G-M1; mốc E

Mốc M1, bước C (song song với 05-CLI; sau khi 02-05 lõi đã merge) · Lane L7 (`feat/rununit-docs-a`) · Ước lượng 0.5d · Rủi ro: trung bình (lớp luôn nạp)

## Context

- Lead sửa plan #1: 07a **chỉ cộng thêm**. Dạy cửa mới (one-liner, `--units`) là đường ưu tiên, chưa gỡ chữ nào về cửa cũ. Gỡ là việc của 07b, merge cùng 06.
- Doctrine hiện dạy `--units` dù cờ đó chưa có (`core/skills/fgos-run/SKILL.md:31`). Invariant G2 của skill ghi "Units ... MUST NOT pin ... providers".
- Decision ID cấp theo đợt (V-M6):
  - **0060**: commit theo `writes`, preflight, resume chỉ commit, brief mutating, `needsWrites`, coverage theo `writes`, matcher dùng chung, `generatedPaths`.
  - **0061**: Unit `prefer`/`persona` mềm, chỉ cho Unit ad-hoc; one-liner; `workflow start --units`/`--effort`; nối nhánh cho unit ghi.

## Requirements

1. **AGENTS.md**, mục "Dispatch":
   - Thêm đoạn "Hai cửa, một runUnit": `fgos run "<prompt>" [--provider] [--writes --worktree]` cho một việc; `fgos workflow start <preset>|--units <file>` cho việc lập trước. Runner commit, worker không commit.
   - Ghi rõ đây là đường ưu tiên cho việc mới. **Không xoá** bullet `out-of-process` cũ; 07b mới xoá.
2. `core/skills/fgos-run/SKILL.md`:
   - Mode A: one-liner cho một việc, `--units` cho nhiều việc (giờ đã có thật).
   - Invariant G2: "preset và plan không ghim provider; Unit ad-hoc được `prefer` mềm".
   - Brief mutating: worker không commit.
3. `core/skills/_shared/capability-matching.md`, mục "Ad-hoc one-shot delegation": thêm one-liner làm lựa chọn đầu. Câu "Plans and Units still never pin one" sửa theo 0061. Phần dạy D1/`--contract` để nguyên cho 07b.
4. `npm run build:skills` (ra `.agents/skills`, `plugins/fgOS/skills`, `.claude/skills`).
5. `docs/specs/runner.md`:
   - Thêm decision 0060 và 0061 sau 0059, theo khuôn 0051/0052.
   - Gắn nhãn "[ĐÃ BỊ THAY MỘT PHẦN bởi 0060]" cho tiêu đề 0052, "[... bởi 0061]" cho 0047 §1. Không viết lại thân decision cũ.
   - Áp Spec delta của 01-05: RUL cho matcher và glob, brief, coverage, preflight, one-liner, `--units`.
   - Chạy `npm run fgos:dev -- decision-index`.
6. `CHANGELOG.md` `## [Unreleased]`: thêm các dòng của 01-05.
7. `docs/specs/reading-map.md`: thêm `src/runner/dispatch/write-scope.mjs` và `src/workflow/units-source.mjs` nếu map có liệt kê tới mức file. Map ghi theo thư mục thì kiểm và bỏ qua, ghi lý do vào báo cáo (V-L5).
8. Component boundary: đọc `docs/platform/component-boundary.md`. M1 không đổi ranh giới thì ghi "No component-boundary change" kèm lý do.

## Files

Sở hữu: `AGENTS.md`, `core/skills/fgos-run/SKILL.md`, `core/skills/_shared/capability-matching.md`, các bản render (chỉ sinh qua build), `docs/specs/runner.md`, `docs/decisions/index.md`, `CHANGELOG.md`, `docs/specs/reading-map.md`.

## Bước

1. Test đỏ: doctrine render có chữ `fgos run "` và `workflow start --units`; skill `fgos-run` không còn câu "MUST NOT pin ... providers" dành cho Unit ad-hoc.
2. Sửa doc, chạy build cho xanh.
3. Spec, decision, index, CHANGELOG.
4. `npm test`.

## Cổng G-M1 (Lead)

Merge thứ tự: 05-CLI, rồi 07a. Tạo `WTP` từ main. Mỗi ca chỉ tính là đạt khi đã đọc transcript hoặc pane. File tạm để ở `/home/vantt/projects/forgentX/.fgos/runtime/tmp/`.

1. **Probe Doer (dương), qua `--unit`.** Ghi file sau:
   ```bash
   cat > /home/vantt/projects/forgentX/.fgos/runtime/tmp/gm1-doer-probe.yaml <<'EOF'
   id: doer-probe-gm1
   objective: "Đọc plans/261014-1033-dispatch-operator-improvements/reports/council-261014-1231-dispatch-one-door-conclusion.md và viết file plans/261014-1400-two-doors-one-rununit/reports/gm1-probe-roadmap-summary.md: một H1, rồi một bảng tóm tắt các bước 0-6 của lộ trình (cột: bước, nội dung, ai quyết), tối đa 25 dòng, tiếng Việt. Không sửa file nào khác."
   capability: code:implement
   rigor: low
   writes: ["plans/261014-1400-two-doors-one-rununit/reports/gm1-probe-roadmap-summary.md"]
   pattern: solo
   EOF
   ```
   Chạy `cd "$WTP" && npm run fgos:dev -- run --unit /home/vantt/projects/forgentX/.fgos/runtime/tmp/gm1-doer-probe.yaml --override '{"executor":"openai"}' --worktree "$WTP"`. Kỳ vọng:
   - `outcome: pass`; commit chỉ có file đã khai;
   - subject đúng dạng conventional;
   - `result.json` có `confinement: "bwrap"`;
   - `coverageMatched: true`;
   - `outOfScope == []`; ghi lại `durationMs`.
2. **Probe Doer (âm).** Thêm "và thêm một dòng vào README.md" vào objective. Kỳ vọng: `README.md` có trong `commit.outOfScope` và không có trong commit; outcome `pass`.
3. **Preflight.** `git -C "$WTP" add README.md`, rồi chạy lại ca 1. Kỳ vọng: `policy-refusal` `foreign-staged-index`, **không có pane hoặc tiến trình worker nào được tạo**. Sau đó `git -C "$WTP" reset -q README.md`.
4. **One-liner ghi / đọc / bị từ chối.**
   - Ghi: `npm run fgos:dev -- run "<objective như ca 1, file gm1-oneliner.md>" --provider openai --writes <file> --capability code:implement --worktree "$WTP"`. Kỳ vọng như ca 1, thêm `binding.provenance.executor.source == 'unit-prefer'`.
   - Đọc: từ main checkout, `... run "Liệt kê 5 rủi ro lớn nhất trong plans/261014-1400-two-doors-one-rununit/plan.md" --provider xai`. Kỳ vọng: pass, không commit, posture read-only, `confinement` khác null.
   - Từ chối: từ main checkout, `... run "x" --writes README.md`. Kỳ vọng: lỗi hướng dẫn tạo worktree, và không có `unit.json` mới nào có `unit.id` bắt đầu bằng `adhoc-` tạo sau mốc giờ bắt đầu ca (V-L11).
5. **`--effort`.** One-liner đọc với `--provider openai --effort low`. Kỳ vọng: argv đã render có `-c model_reasoning_effort=low` (xem `protected/prepared-invocation`); `policy.provenance.reasoningEffort` có giá trị.
6. **`--units` read-only, 2 provider.** File `gm1-units-ro.yaml` gồm `risk-a` (`prefer: [openai]`) và `risk-b` (`prefer: [xai]`, `dependsOn: [risk-a]`), cả hai `architecture:critique`, `writes: []`. Chạy `npm run fgos:dev -- workflow start --units <file> --foreground`. Kỳ vọng: `completed`; mỗi unit có `provenance.executor` đúng executor ưu tiên, source `unit-prefer`; risk-b đọc được report của risk-a qua contextRefs (0053).
7. **`--units` 2 unit ghi phụ thuộc nhau.**
   - `w-a` ghi `plans/261014-1400-two-doors-one-rununit/reports/gm1-chain-a.md`.
   - `w-b` có `dependsOn: [w-a]`, ghi `gm1-chain-b.md`, và trích một dòng từ file của `w-a`.

   Kỳ vọng: worktree của `w-b` chứa commit của `w-a`; output liệt kê 2 nhánh. Nếu 05 đã dùng lối lùi thì kỳ vọng thành: start từ chối, kèm thông điệp đã ghi trong CHANGELOG.
8. **Preset `--seats`.** `npm run fgos:dev -- workflow start council-lite --request "Có nên giữ mặc định từ chối --writes từ main checkout cho fgos run một dòng không?" --seats "<lens1>|<lens2>|<lens3>" --foreground`. Kỳ vọng: `completed`; mỗi seat có persona đã ghim, `confinement` khác null.
9. **Failover với prefer:** đường thật chỉ chạy khi gây được provider-limit thật. Nếu không gây được thì ghi UNPROVEN cho herdr-spawn (residual của r4) và dựa vào test của 04.

Ghi `reports/gate-m1-<YYMMDD-HHMM>.md`. Có ca fail thì không sang mốc E; tìm nguyên nhân theo reversal trigger của r4.

## Mốc E: activate release cho forgentX (Lead)

1. Build, stage và activate tree của main tại G-M1 theo quy trình hiện hành: `fgctl stage --from <dist>` / `fgctl upgrade --from <dist>` (`docs/specs/distribution.md:308`; tiền lệ ở `plans/261006-1445-fgctl-dev-activation/`). Lệnh chính xác Lead lấy từ đó (UNPROVEN cho tới khi chạy). Ghi lại `previousArtifactDigest`.
2. Ở repo này, dùng `fgos` trần (không qua `fgos:dev`): `fgos doctor` sạch, gồm `active-release-matches-checkout` và `runner-generated-paths`. Chạy one-liner chỉ đọc của ca 4 và preset của ca 8; cả hai phải pass.
3. Sau khi activate, Lead commit entry `generatedPaths` thật cho repo này vào `.fgos/config.json` trên main (xem 01).
4. Rollback: `fgctl repair` về `previousArtifactDigest`.
5. Project khác: chưa activate ở M1. Mặc định là sau M2 (câu hỏi owner).

## Rủi ro + rollback

- Lớp luôn nạp dạy hai đường trong khoảng M1→M2 (cửa mới là ưu tiên, cửa cũ còn sống): chấp nhận, vì cả hai đều chạy được.
- Rollback: revert commit docs.

## Xong khi

- Bước 1-4 xanh.
- 0060 và 0061 có trong runner.md và trong index.
- G-M1 đạt các ca 1-8.
- Mốc E đạt.
