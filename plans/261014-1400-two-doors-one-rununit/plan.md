---
title: "Hai cửa, một runUnit: đường Doer xanh, xoá cửa thô, tách Work khỏi dispatch"
description: "R0-R3 theo hội đồng mở lại r4 + quyết định Lead 2026-10-14: fgos run và fgos workflow start là hai cửa trên một ranh giới runUnit; dispatch là tầng thấp; Work chỉ là bên dùng. Mốc M1 = N1+N2 dùng được thật; M2 = xoá cửa cũ + cắt Work."
status: pending
priority: P1
effort: "~17d tổng công; M1 ~4.5 ngày lịch, M2 ~6 ngày lịch sau M1 (~10.5 ngày lịch tổng)"
branch: main
tags: [runner, dispatch, rununit, work-separation, doer]
created: 2026-10-14
---

# Hai cửa, một runUnit

## Trạng thái

completed 2026-10-15 02:05. M1 đóng 2026-10-14 19:30; M2 đóng với cổng [gate-m2-261015-0205](reports/gate-m2-261015-0205.md) (bước 3 đường Work thật UNPROVEN, có bằng chứng fixture). Thêm ngoài plan, owner duyệt: lane account, help, timeout, sync. Lead: phiên điều phối; owner: anh vantt.

- M1 = đợt A-E, cộng hai lane ngoài phase (gitparse, các fix khoá resume / pin persona / invocation `prefer` của Lead).
- Cổng G-M1: [gate-m1-261014-1857](reports/gate-m1-261014-1857.md); ca 2 và ca 8 đổi kỳ vọng (mục để ngỏ). Ma trận provider 6/6 sau khi Lead thêm provider `deepseek` vào `~/.fgos/config.json` (owner cho phép; backup `config.json.bak-20261014-deepseek`).
- Owner chốt 2026-10-14 20:05: lane `help` (sau khi 06 merge, trước G-M2). Nội dung:
  - Rust host chuyển `--help`/`--help --json` xuống Node, để `fgos --help --json` chạy được ở mọi project;
  - thêm `fgos <verb> --help --json`;
  - registry có `subcommands` cho verb nhiều sub-verb (`dispatch`, `workflow`, ...), kèm test schema khớp cờ thật;
  - mục `run`/`workflow` ghi rõ khi nào dùng cửa nào.
- Owner chốt 2026-10-14 19:54: activate cho các project khác (mcp-skill-hub, mdview, ...) ngay sau cổng G-M2.
- Mốc E: activate `sha256:0f0d988e…` từ main `b78c0019c`, `previousArtifactDigest` `sha256:bbea6dba…`. Qua `fgos` trần: doctor có `active-release-matches-checkout` và `runner-generated-paths` đạt (10 check đỏ có từ trước, không do release); one-liner đọc `unit-run-1791980280110-d94db2c6` pass; preset `group-cognition --seats` `wf-run-1791980326757-126e4fc8` pass.

## Nguồn và quyết định đã chốt

- Gói hội đồng r4 (nguồn chính): [reports/council-reopen-r4-packet.json.md](reports/council-reopen-r4-packet.json.md), [explanation](reports/council-reopen-r4-explanation.md), [reviewer](reports/council-reopen-r4-reviewer.md), [red-team](reports/council-reopen-r4-red-team.md).
- Review bản plan 1: [validate-plan-against-code.md](reports/validate-plan-against-code.md), [red-team-plan.md](reports/red-team-plan.md). Cách xử lý từng phát hiện ở mục [Disposition review](#disposition-review).
- Hội đồng trước và bản đồ cửa: [council-261014-1231](../261014-1033-dispatch-operator-improvements/reports/council-261014-1231-dispatch-one-door-conclusion.md), [scout-261014-1045](../261014-1033-dispatch-operator-improvements/reports/scout-261014-1045-dispatch-door-map.md). Plan cũ [261014-1033](../261014-1033-dispatch-operator-improvements/plan.md) bị plan này thay.
- 11 quyết định trong brief 2026-10-14 của Lead và 11 quyết định trong brief sửa plan (lịch M1/M2, cơ chế chạy lane, glob, spike C1/H1/H2, preflight H3/H4, `--units` ghi, route Rust, test subject, test thứ 4 của P00, activate, câu hỏi owner) là đầu vào cố định.
- Giao thức chung (cơ chế lane, worktree, test, cổng, merge, file dùng chung): [protocol.md](protocol.md).

## Lịch: hai mốc

### M1 — N1+N2 dùng được thật

| Bước | Phase (lane) chạy song song | Phụ thuộc | Ước lượng |
|---|---|---|---|
| S0 | Lead commit thư mục plan lên main (`git commit -- plans/261014-1400-two-doors-one-rununit`) | — | 0.1d |
| A | [00](phase-00-land-finished-lanes.md) gom lane cũ (L0) ‖ [01](phase-01-write-scope-and-unit-contract.md) matcher `writes` + hợp đồng Unit `prefer`/`persona` (L1) ‖ [08](phase-08-work-cut-design-spike.md) spike cắt Work, chỉ đọc (L8) | 01 rebase sau khi 00 merge | 1d |
| B | [02](phase-02-scoped-runner-commit.md) commit theo `writes`, preflight lúc launch, resume chỉ commit (L2) ‖ [03](phase-03-brief-and-coverage.md) brief + coverage (L3) ‖ [04](phase-04-run-one-liner-and-soft-prefer.md) `bind()` mềm + one-liner + `--effort` (L4) ‖ [05](phase-05-workflow-units.md) phần lõi `--units` (L5) | 01 | 1.5d |
| C | 05 phần CLI (L5, sau khi 04 merge) ‖ [07a](phase-07a-doctrine-additive.md) doctrine chỉ cộng thêm + decision 0060/0061 (L7) | 04 (với 05-CLI); 02-05 (với 07a) | 0.5d |
| D | Cổng gộp **G-M1** = G0 + G1 (ở [phase-07a](phase-07a-doctrine-additive.md#cổng-g-m1-lead)) | B, C | 0.5d |
| E | Activate release cho repo forgentX (ở [phase-07a](phase-07a-doctrine-additive.md#mốc-e-activate-release-cho-forgentx-lead)) | D | 0.25d |

**M1 ≈ 4.5 ngày lịch** (đã gồm ~0.6d cho review, red-team và các lượt suite ~11 phút mỗi lần). M1 là ranh giới "chỉ cộng thêm": chưa xoá cửa nào.

### M2 — xoá cửa cũ + cắt Work

| Bước | Phase (lane) | Phụ thuộc | Ước lượng |
|---|---|---|---|
| F | [06](phase-06-delete-old-doors-and-guard.md) chỉ xoá cửa + guard (L6), [07b](phase-07b-doctrine-remove-old-doors.md) gỡ doctrine cửa cũ (L7); **06 rebase lên 07b, ff MỘT lần** ‖ [09](phase-09-work-loop-and-fanout-on-rununit.md) bước 09a (helper `workUnitFor`) | M1, spike 08 đã duyệt | 1.25d |
| G | 09 (D7 + fanout qua runUnit, L9) ‖ [10](phase-10-driver-operation-on-rununit.md) (D8, L10) | 09a merge; 10 cần spike trả lời C1/H1/H2 | 3.5d |
| H | [11](phase-11-dispatch-generic-inputs-and-guard.md) gỡ input Work + guard ngữ nghĩa + cổng **G-M2** (L11) | 06, 09, 10 | 1.25d |

**M2 ≈ 6 ngày lịch sau M1.** Đường găng của M2 là 09a → 10 → 11 → G-M2. Activate cho các project khác: mặc định sau M2, chờ owner (câu hỏi 2).

**Đường găng toàn plan:** S0 → 00 → 01 → 02 → 07a → G-M1 → E → 09a → 10 → 11 → G-M2, khoảng **10.5 ngày lịch**. Mọi ước lượng đều là ước đoán, chưa đo (UNPROVEN).

## Bảng lane × file

| Bước | Lane | Các file lane được sửa |
|---|---|---|
| A | L0 | mọi file trong diff của 3 nhánh lane cũ; `src/runner/operation-choice.mjs` (nhánh tiến Work); `test/runner/operation-choice.test.mjs`; `docs/specs/runner.md`; `CHANGELOG.md`; 3 plan cũ |
| A | L1 | NEW `src/runner/dispatch/write-scope.mjs`; `src/runner/execution/unit.mjs`; `src/workflow/definition.mjs` (chỉ khối `writes`); `src/runner/execution/run.mjs` (chỉ chỗ dựng `unitRecord` và `assignment.writes`); `src/runner/dispatch/config.mjs`; `src/setup/registrations.mjs` (một check); `docs/architecture-manifest.json` |
| A | L8 | chỉ `reports/` |
| B | L2 | `src/runner/execution/commit-unit-work.mjs`; `src/runner/execution/run.mjs` (preflight, khối commit, resume chỉ commit); `src/runner/loop.mjs` (chỉ `commitWorkerChanges`); `src/runner/fanout-batch.mjs` (chỉ lời gọi commit); 4 test khoá subject |
| B | L3 | `src/runner/dispatch/{assignment,effective-execution-contract,settlement,evidence-attribution,agent-result-claim-contract,assignment-runner}.mjs` |
| B | L4 | `src/runner/execution/bind.mjs`; `bin/fgos.mjs` (case `run`); `src/cli/command-registry.mjs` |
| B | L5 | `src/workflow/{definition,runner,index}.mjs`; NEW `src/workflow/units-source.mjs`; manifest (row mới); `integrate.mjs` chỉ đọc |
| C | L5 | `bin/fgos.mjs` (case `workflow`); `command-registry.mjs` |
| C | L7 | `AGENTS.md`; `core/skills/fgos-run/SKILL.md`; `core/skills/_shared/capability-matching.md` (chỉ cộng thêm); các bản render; `docs/specs/runner.md`; `docs/decisions/index.md`; `CHANGELOG.md`; `docs/specs/reading-map.md` |
| F | L6 | `src/runner/dispatch/cli.mjs`; `src/runner/dispatch.mjs`; DELETE `src/runner/dispatch-log.mjs`; `src/runner/fanout-batch.mjs` (chỉ thêm lối vào `node`); `bin/fgos.mjs`; `scripts/dispatch-decide-hook.mjs`; `command-registry.mjs`; `test/architecture.test.mjs`; manifest |
| F | L7 | `AGENTS.md`; `core/skills/**` (các file dạy cửa cũ); `domains/coding/.../return-mechanics.md`; các bản render; `docs/specs/runner.md`; index; `CHANGELOG.md` |
| F→G | L9 | `src/runner/work-dispatch.mjs`; `src/runner/loop.mjs`; `src/runner/fanout-batch.mjs` (sau khi 06 merge); allowlist trong `test/architecture.test.mjs` (sau khi 06 merge) |
| G | L10 | `src/runner/operation-choice.mjs`; `src/verbs/state/step.mjs`; `src/runner/execution/run.mjs`; `assignment-runner.mjs`; `settlement.mjs`; `run-result.mjs`; test `:337` trong `test/architecture.test.mjs` (sau khi 09 merge) |
| H | L11 | `dispatch/{plan,assignment,assignment-policy,assignment-runner,cli}.mjs`; `src/runner/work-dispatch.mjs`; `bin/fgos.mjs`; `test/architecture.test.mjs`; `docs/specs/runner.md`; index; `CHANGELOG.md` |

Người giữ các file dùng chung theo từng bước được ghi ở [protocol.md](protocol.md#file-dùng-chung).

## Acceptance (đo được)

1. **G-M1:** ca 1-8 đạt (ca 9 đạt hoặc ghi UNPROVEN) theo [phase-07a](phase-07a-doctrine-additive.md#cổng-g-m1-lead) đạt, có transcript đã đọc: probe Doer dương/âm; one-liner ghi/đọc/bị từ chối; one-liner `--effort`; `--units` read-only 2 provider; `--units` 2 unit ghi phụ thuộc nhau; preset `--seats`; preflight foreign-index từ chối trước khi spawn.
2. **E:** `fgos` trần (release đã activate) ở repo này chạy được one-liner read-only và preset; `fgos doctor` sạch.
3. **G-M2:** cửa đã xoá trả lỗi chỉ đường sang cửa mới; doctrine và các bản render (`.agents`, `plugins`, `.claude/skills`) không còn dạy cửa cũ; guard import, guard call-site và guard ngữ nghĩa xanh, không còn allowlist; chu trình Work→runUnit→Work đọc lại verdict, chặn plan cũ (stale-plan) và giữ rigor (không bị hạ) đều xanh.
4. Mỗi bước: `env -u CLAUDE_CODE_SESSION_ID npm test` xanh trên main sau merge; có review độc lập; có red-team cho 00, 01+02, 04, 06, 09, 10, 11.

## Rủi ro chính

| Rủi ro | Khả năng × Tác động | Giảm thiểu |
|---|---|---|
| D8 qua runUnit làm Work mất dấu verdict, hash `plan.md` lệch gốc, rigor bị hạ (C1/H1/H2) | H × H | Spike 08 phải trả lời trước; P10 không bắt đầu khi spike chưa trả lời; test chu trình đầy đủ |
| Commit theo `writes` gom cả file người đang sửa dở / lỗi index chỉ lộ sau lượt agent (H3/H4) | M × H | Preflight lúc launch; `preExistingInScope` không tự commit; resume chỉ commit lại |
| `--units` có ghi: unit sau không thấy thay đổi của unit trước (H5) | M × M | Unit phụ thuộc dùng nhánh của unit trước làm base. Nếu lớn quá 0.5d thì M1 chỉ hứa read-only + mutating độc lập |
| Bản render ở project khác vẫn dạy cửa đã xoá (H7) | M × M | Checklist activate cho từng project; rollback bằng `fgctl repair` |
| Gom 3 nhánh cũ (P00) gây lệch ngữ nghĩa | L × H | Mô phỏng của validator: không xung đột code; vẫn `npm test` sau mỗi nhánh; có red-team cho 00 |
| Lane song song ghi nhầm checkout | M × M | Mỗi lane là phiên interactive trong worktree riêng; `pwd`/`git -C` trước mỗi lần commit; Lead kiểm nhánh trước khi merge |
| `npm test` không hermetic trong phiên agent | H × L | Luôn `env -u CLAUDE_CODE_SESSION_ID` |

## Câu hỏi còn mở (cần owner)

1. **Khi nào activate cho project khác (mcp-skill-hub, mdview, ...)?** Mặc định của plan: sau G-M2, để mỗi project đổi doctrine một lần. Checklist và rollback ở [phase-07b](phase-07b-doctrine-remove-old-doors.md#activate-cho-project-khác-chờ-owner). Phạm vi câu trả lời: chỉ thời điểm, không đổi nội dung.

Đã chốt, không hỏi lại: one-liner có `--writes` mà không có worktree thì từ chối. Việc tự tạo worktree là item riêng sau M1 (Lead quyết #11).

## Mục để ngỏ, ghi lại sau đợt A

- RT-H3 (lane land): xoá cả warnings lẫn evidence trong `result.json` thì Work vẫn tiến. Muốn chặn phải băm evidence lúc settle (cùng lớp với `claimSha256`). Đây là cơ chế mới, làm thành item riêng sau M2.
- RT-H4 (lane land): Lead duyệt. Khi Work đọc một kết quả read-only, warning `stray-write-correlated` chỉ được ghi lại, không chặn Work. Lý do: tín hiệu này chỉ đoán theo tương quan trong checkout dùng chung, chặn ở đây sẽ lặp lại lỗi báo nhầm của đề xuất #8.
- UNPROVEN còn mang theo:
  - chưa có lượt bwrap thật ghi `confinement: "bwrap"`, đóng ở G-M1 ca 1;
  - chưa có lượt herdr thật mang `stray-write-correlated`;
  - herdr-spawn có tạo `stdout.log` không, L9 kiểm;
  - `reasoningEffort` của policy có tới adapter không.
- Ngoài plan, cần ghi thành item:
  - fgos đang activate rơi về Node nên `fgos convention` không chạy;
  - ghế xai trả exit 0 mà không làm gì;
  - nên đóng follow-up 44287a09c.

- Sau cổng G-M1 (báo cáo `reports/gate-m1-261014-1857.md` trên nhánh `probe/rununit-m1`), Lead quyết:
  - Ca 2: worker tuân brief tự ở trong scope và khai `needsWrites`, nên không objective nào ép được runner ghi `commit.outOfScope`. Kỳ vọng đổi thành "README không vào commit, worker khai `needsWrites`". Nhánh `outOfScope` do test đơn vị chứng minh; chứng minh live còn UNPROVEN.
  - Ca 8: `council-lite` từ chối `--seats` là đúng thiết kế (CHANGELOG ghi rõ). Cổng dùng `group-cognition --seats`, đã pass.
  - F1 (invocation trong Unit `prefer` bị đổi sang herdr): Lead sửa trên nhánh `fix/rununit-prefer-invocation`.
  - C2 (pool `code:implement` không có ứng viên ghi): Lead sửa config (`cce8d4d62`).
  - C1 deepseek thiếu credential: `~/.fgos/config.json` không có provider `deepseek` trong `runner.providers`, nên home riêng của lượt confined không có `auth.json`. Chờ owner, vì Lead không sửa config global.
  - Item riêng: `fgos doctor` nên báo executor có provider không khai account; `policy-refusal` trả exit 0; log `dispatch capability=(none declared)` in sai capability của Unit; subject commit có thể là summary bị cắt kèm "...".
- Ngoài phạm vi, từ lane gitparse: tên file không phải UTF-8 vẫn mất byte; cổng merge coi main đang merge dở là sạch khi có `ownFileSet`; env `GIT_*` rò vào `git()` của `merge.mjs`; `ls-files` của distill đọc theo dòng.

- Từ lane cut (06):
  - Có một event `executor.dispatch` giả (`id:"a"`) trong `.fgos/events/3546717-20261014T123543656Z.jsonl` của main checkout. Lead giữ nguyên: log chỉ ghi thêm (L3), và guard chống cắt log đã ghi nhận file này.
  - R4b (guard A4 chưa thấy `import()` động / `createRequire`, ví dụ `dispatch/assignment.mjs:99` nạp harness của domain) chuyển sang phase 11.
  - `node src/runner/dispatch.mjs decide --work` vẫn có thể ghi config mặc định trước khi từ chối. Mức Low, có từ trước.

- Activate sau G-M2 (2026-10-15 02:05), release `sha256:fee5e262…` build từ main `cb0acb254`:
  - forgentX: `previousArtifactDigest` `0f0d988e…`; qua `fgos` trần: `--help --json` 3.0, `dispatch execute` báo đã xoá, one-liner đọc `unit-run-1792004798347-1422b4d7` pass.
  - mdview: `fgos setup`, không còn chỗ dạy cửa cũ, doctor 101/108 (đỏ có từ trước), one-liner đọc pass (`unit-run-1792004621503-1eab1147`).
  - mcp-skill-hub: `fgos setup`, không còn chỗ dạy cửa cũ, doctor 104/108 (đỏ có từ trước). One-liner ban đầu bị `posture-unavailable`, vì config riêng (local, không track) chỉ có `openai` kiểu cũ: không `id`, không confine, và `modelPolicies` thiếu tier. Lead chép bộ executor agent và `modelPolicies` của mdview sang (backup `.fgos/config.json.bak-20261015-before-executors`); one-liner pass (`unit-run-1792004730344-5fb50674`). Rollback cả hai: `fgctl repair` về `bbea6dba…` rồi `fgos setup`.
- Item riêng, phát hiện khi activate:
  - `~/.fgos/config.json` chỉ có `openai`/`pi` kiểu cũ (không confine). Project nào không tự khai executor có confine thì `fgos run` không chạy được.
  - `fgos doctor` chưa có check "không executor nào mang được posture read-only/workspace-write". Lỗi này chỉ lộ khi chạy thật.
  - Từ lane timeout: `workflow start` chưa có `--timeout`. Từ lane sync: Q2 (`--sync` bắt buộc `--writes`) và Q3 (producer inline).

- 2026-10-15 sáng, owner duyệt:
  - Gỡ gói pnpm global `forgent`, cài `fgctl` vào `~/.local/bin`, ghi launcher `fgos` (doctor `project-fgos-launcher` xanh).
  - Đồng bộ `runner.executors` của mdview và mcp-skill-hub theo bản đã commit của forgentX (xai qua `omp-*`); trust mcp-skill-hub trong `~/.codex-fgovn/config.toml`.
  - Phương án (a): `~/.fgos/config.json` nhận bộ executor agent có confine và `modelPolicies` (backup `config.json.bak-20261015-confined-executors`). Một project mới (`fgctl init`, không khai executor) chạy được `fgos run --provider xai` ngay.
  - Gỡ 7 worktree của plan cũ và xoá nhánh của chúng, gồm `fix/dispatch-followups` (`af132275b`).
- Item riêng mới: project nằm dưới `/tmp` thì worker read-only không thấy file, vì bwrap mount `/tmp` riêng. fgOS không báo gì, chỉ ra `no-evidence`. Nên từ chối sớm hoặc bind đúng thư mục.

## Disposition review

V = [validate-plan-against-code.md](reports/validate-plan-against-code.md), R = [red-team-plan.md](reports/red-team-plan.md).

| ID | Mức | Phát hiện | Disposition |
|---|---|---|---|
| V-H1 / R-M5 | High | Thư mục plan chưa commit | Sửa: bước S0; protocol yêu cầu commit báo cáo lane/cổng trước khi tạo worktree cho bước sau |
| V-H2 / R-H6 | High | Verb `fanout-batch` mới thiếu route Rust; `fgos step` không tồn tại | Sửa: fanout không thêm verb. 06 thêm lối vào `node src/runner/fanout-batch.mjs`, 09 đổi phần ruột sang runUnit. Protocol thêm luật: phase nào thêm/xoá verb top-level phải sinh lại `command-routes.json` + annotations bằng `scripts/export-command-selectors.mjs` và chạy `test/rust-host/command-routes.test.mjs` (plan này không thêm verb). G-M2 dùng `fgos plan <id> --validate` |
| V-H3 | High | Subject conventional làm đỏ 4 test | Sửa: P02 liệt kê 4 test, đổi kỳ vọng có chủ đích, kèm lý do |
| R-C1 | Critical | Work không tìm lại verdict validate-plan | Sửa: spike 08 câu 8; P10 bị chặn tới khi spike trả lời; thêm test chu trình đầy đủ |
| R-H1 | High | `pinInputs` không rõ gốc | Sửa: spike 08 câu 2. Mặc định: đường dẫn tuyệt đối do Work phân giải theo `resolveContentRoot`; dispatch chỉ băm, gốc được phép là `mainRoot` + các worktree git liệt kê. P10 có ca "plan.md chỉ có trong worktree item" |
| R-H2 | High | Rigor bị hạ (risk heavy, opPolicy) | Sửa: spike 08 câu 3 liệt kê mọi nguồn rigor; `dispatchBound` ghi `assignment.rigor`; mỗi nguồn một test |
| R-H3 | High | Commit gom file dở dang trong phạm vi | Sửa (Lead #5): P02 chụp `preExistingInScope` lúc launch, không tự commit các file này, trả cho caller |
| R-H4 | High | Foreign index chỉ lộ sau lượt agent | Sửa: P02 preflight trước spawn; resume chỉ commit lại cho `foreign-staged-index`/`staged-set-mismatch`; `committed-set-mismatch` thì resume từ chối, kèm hướng dẫn |
| R-H5 | High | `--units` ghi không tích hợp | Sửa: P05 cho unit ghi phụ thuộc lấy nhánh của unit trước làm base, output liệt kê nhánh/worktree. Có lối lùi về read-only + độc lập; G-M1 ca 6 |
| R-H7 | High | Render ở project khác; rollback mức release | Sửa: checklist trong 07b; rollback `fgctl repair`; activate project khác chờ owner |
| R-H8 | High | Chặn `[ ] { } ! ?` | Sửa (Lead #3): chỉ `*`/`**` là glob, ký tự khác là nghĩa đen; ca `app/[slug]/page.tsx` |
| R-H9 | High | N1/N2 chưa dùng thật khi chưa activate | Sửa: mốc E activate cho forgentX sau G-M1 |
| R-H10 | High | Không nói lane chạy bằng gì | Sửa (Lead #2): phiên Claude interactive, mỗi lane một pane herdr. Bác đề xuất "lane chạy bằng `fgos run --unit`" vì Lead #2 đã chốt cơ chế |
| V-M1 | Medium | Coverage chỉ nối một lời gọi; `inScope` riêng | Sửa: P03 nối cả hai lời gọi `attributeWorkspaceChanges`, thay `inScope` trong `evaluateAttributionPolicy` bằng matcher chung |
| V-M2 | Medium | Đường provenance G1 sai | Sửa: kiểm `binding.provenance.executor.source`; P04 gắn `source` cho từng ứng viên |
| V-M3 | Medium | Đã có test call-site `:337` | Sửa: 06 mở rộng test `:337`; 10 sửa `expectedFiles` và nhánh posture |
| V-M4 | Medium | Ba lane tự dựng `unitData` | Sửa: helper `workUnitFor` ở 09a, 09 và 10 dùng chung |
| V-M5 | Medium | 05 phụ thuộc `unit.mjs` của 04 | Sửa: phần `prefer`/`persona` của `unit.mjs` chuyển sang 01 |
| V-M6 | Medium | Decision ID cấp muộn | Sửa: 0060 (commit/brief/coverage) và 0061 (Unit prefer, one-liner, `--units`) ở 07a; 0062 (xoá cửa) ở 07b; 0063 (input generic) ở 11 |
| V-M7 | Medium | Regex guard sót `work?.`, tham số `work`, `work` của `executeExecutorCli` | Sửa: P11 regex `\bwork\??\.` + bắt destructure; inventory 08 thêm `cli.mjs:382,506,784` |
| V-M8 | Medium | `rg` doctrine sót `dispatch.mjs" execute`, `.claude/skills` | Sửa: regex mới, thêm `.claude/skills` ở 07b và G-M2 |
| V-M9 | Medium | `fgos step` không tồn tại | Sửa: `fgos plan <id> --validate` (P10, G-M2) |
| R-M1 | Medium | Test thứ 4 của P00 bị đổi kỳ vọng ngược với tên test | Sửa (Lead #9): reason riêng `validation-correlated-mutation-do-not-advance-work`, đổi tên test kèm lý do |
| R-M2 | Medium | ff 07 rồi 06 thành hai lần | Sửa: 06 rebase lên 07b, ff một lần |
| R-M3 | Medium | Red-team/cổng có phần nghi thức | Sửa: thêm red-team cho 00 và 04; danh sách đòn chỉ là sàn; G-M1 thêm `--seats`, `--effort`, `--units` ghi; chỉ tính đạt khi đã đọc transcript |
| R-M4 | Medium | Key mặc định tự ghi vào config được track | Bác một phần: AGENTS.md "Install/setup/doctor gate" bắt mọi config default đi qua setup config-merge, và mọi key `runner.*` hiện có đều theo đường này (`registrations.mjs:2396`). Giữ đường đó; Lead commit dòng `generatedPaths: []` trên main ngay khi 01 merge để nó không thành diff lạ |
| R-M6 | Medium | Ước lượng lạc quan | Sửa: tính lại M1/M2, có thời gian suite và review |
| R-M7 | Medium | 09 thiếu đòn | Sửa: thêm transport herdr không có `stdout.log`, reap nhầm home, khoá cwd treo |
| R-M8 | Medium | Re-export `loop.mjs:1902` | Sửa: L9 sở hữu cả `loop.mjs` lẫn phần ruột fanout |
| V-L1..L11, R-L1..L4 | Low | Đường test, bảng file, dòng test stale-plan, shape `bindings`, reading-map/doc-registry, config tự ghi, lớp lỗi, commit followups/lane A, tập `executeThroughConfinement`, `origin` giả được, phép đếm `adhoc`, đường dẫn heredoc, TOCTOU, expand thô | Đã sửa trong phase tương ứng (01, 02, 05, 07a/b, 10, 11, 00). Riêng TOCTOU (R-L3) và expand thô (R-L4) ghi là residual, chấp nhận |
