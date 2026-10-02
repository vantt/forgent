---
title: "Track request-to-run: mô hình gọn từ yêu cầu tới lúc chạy (plan tổng)"
description: "Umbrella cho 5 plan con P1–P5 + plan nền T. Giữ mục tiêu, tiêu chí, lộ trình, phụ thuộc, trạng thái; không chứa bước triển khai."
status: pending
priority: P1
effort: "~5–7 tuần (ước, theo tổng các plan con)"
tags: [umbrella, dispatch, workflow, work, herdr, observe, simplification]
created: 2026-10-01
blockedBy: [project:plan/260930-tier-rigor-consolidation]
blocks: []
---

# Track request-to-run: mô hình gọn (plan tổng)

## Overview

Đưa vào **một yêu cầu** (câu tự do, plan bất kỳ, hay chạy một Workflow của domain) → đi tới kết quả đã kiểm chứng nhanh, ít phải canh, đúng người làm theo khẩu vị cấu hình một lần, **nhìn thấy được trong pane herdr**, mọi lần chạy kết thúc rõ ràng và đọc được. Làm bằng **mô hình gọn** (owner chốt Q0): Unit → Pattern cộng tác (3 cái, code nhỏ) → một `bind()` → một cửa chạy (mặc định pane herdr, fallback cli) → RunResult/Observe; Workflow run là tầng tuần tự bước duy nhất; engine coordination thu hồi khi mọi dạng thảo luận chạy tốt trên mô hình gọn.

Plan tổng này **không có bước triển khai**; nó giữ mục tiêu, tiêu chí, lộ trình, phụ thuộc và trạng thái của các plan con.

## Nguồn quyết định (đọc trước)

| Tài liệu | Nội dung |
|---|---|
| [synthesis-260930-1229-request-to-run-brainstorm.md](../reports/synthesis-260930-1229-request-to-run-brainstorm.md) | **Nguồn chính.** §0 kết quả mong muốn, **G1–G7**, 8 tiêu chí; §2 fact; §6 D0–D7, bảng 5 mức, Workflow tách Work, plan vs Workflow, override, Q0; §6b plan X; §6c plan T; §7 Q1–Q9; §7b lộ trình + việc lẻ; §7c bài học; §7d layer/authority; **§7e quyết định sau red-team (Q-A, Q-B, Q-C, G7, X-1/3/4)** |
| [reports/red-team-adjudication.md](./reports/red-team-adjudication.md) | 37 finding → 15 mục, phân xử, câu trả lời owner |
| [layer-authority-map-261001-1020-request-to-run-track.md](../reports/layer-authority-map-261001-1020-request-to-run-track.md) | bản đồ L0–L7 dựng từ code |
| [rescoring-260930-2320-kongming-request-to-run-options.md](../reports/rescoring-260930-2320-kongming-request-to-run-options.md) | chấm độc lập |
| nhánh `plan/260930-tier-rigor-consolidation`: `plans/260930-0445-tier-rigor-vocabulary-consolidation/plan.md` | plan nền T (D19 sàn `capabilities.<cap>.rigor`; tạo `test/runner/dead-vocabulary-guard.test.mjs`) |
| cùng nhánh: `plans/260930-1235-readonly-invocation-redesign/plan.md` | plan X — **gộp vào P1 phase 6** |

## Thuật ngữ (một khái niệm một tên)

Unit · **Unit run** (một lần chạy một Unit bằng Pattern cộng tác — thay "coordination session") · **Pattern cộng tác / `CollaborationPattern`** (đúng 3: `solo`, `reviewed`, `panel` + preset) · **Workflow** / **Workflow run** · Work (bản ghi/board/lifecycle) · red-team (không "objector"). Không dùng `FlowDefinition`, `CoordinationProtocol` để chỉ Pattern cộng tác.

## Lộ trình và phụ thuộc (Q-C, owner 2026-10-01)

```text
[việc lẻ A ✓, B ✓] ───────────────────────────────┐ (điều kiện cần trước nghiệm thu P1)
T Tier/rigor (agent khác) ──► P1 Lõi thực thi ──► P3a Workflow runner + tích hợp ──┬──► P2 Plan chạy được ──────────┐
                                                                                   └──► P3b Bỏ stage khỏi Work ──────┴──► P4 Dạng thảo luận + thu hồi engine ──► P5 Thuật ngữ
```

| Plan | Thư mục | Layer / mối authority phải đóng | Phụ thuộc | Song song với |
|---|---|---|---|---|
| T | nhánh `plan/260930-tier-rigor-consolidation` | L5+config: "model mạnh tới đâu" | — | việc lẻ A, B |
| P1 Lõi thực thi | [p1-execution-core](../261001-0327-request-to-run-p1-execution-core/plan.md) | **xong** (2026-10-01) — L5: "ai làm" một `bind()`; một cửa chạy `fgos run` (herdr mặc định); read-only một posture; lõi mới không phụ thuộc L3 | T merge; việc lẻ A+B | — |
| P3a | [p3 phase 1–2](../261001-0327-request-to-run-p3-workflow-separate-from-work/plan.md) | **xong** (2026-10-01) — "tuần tự bước + cổng người" một Workflow runner; tích hợp/merge không phụ thuộc Work | P1 | — |
| P2 Plan chạy được | [p2-runnable-plans](../261001-0327-request-to-run-p2-runnable-plans/plan.md) | **xong** (2026-10-02) — L2→dữ liệu: Unit là hợp đồng duy nhất; driver mỏng fgos-run; bỏ DemandFacts | **P3a** | **P3b** |
| P3b | [p3 phase 3–6](../261001-0327-request-to-run-p3-workflow-separate-from-work/plan.md) | L3: Work không còn `stage`; L5 hết import L3 | P3a | **P2** |
| P4 | [p4-discussion-patterns-engine-retirement](../261001-0327-request-to-run-p4-discussion-patterns-engine-retirement/plan.md) | L4 không còn là runtime riêng | P1 + P3 (P2 khuyến nghị) | — |
| P5 | [p5-terminology-sweep](../261001-0327-request-to-run-p5-terminology-sweep/plan.md) | ngang: một tên mỗi khái niệm | P4 | — |

**P2 ∥ P3b — sở hữu file:** P2: `src/report/capability-plan-lint.mjs`, `src/runner/capability-match.mjs` (xoá), `core/skills/_shared/capability-*.md`, `core/skills/fgos-capability-dispatching/`, `core/skills/fgos-plan-loop/`, `domains/coding/skills/fgos-code-change/`, `fgos-code-panel/`, `core/skills/fgos-run/` (mới), mục `plan-lint`/`capability` trong `bin/fgos.mjs` + `src/cli/command-registry.mjs`, 2 dòng gọi `capability match` trong `core/skills/fgos-panel/SKILL.md` và `fgos-architecture-panel/SKILL.md`. P3b: `src/state/**`, `src/verbs/state/**`, `src/intake/**`, `src/runner/loop.mjs`, `src/runner/dispatch/{operation-choice,cli,assignment,assignment-runner,config}.mjs` (chỉ phần L3 + `dispatch-runs`), skill/verb theo stage, `packages/work-state/rust`, `herdr-plugin` phần stage. File chung bắt buộc (`bin/fgos.mjs`, `src/cli/command-registry.mjs`, `src/setup/registrations.mjs`): mỗi bên chỉ sửa **mục của mình**, merge vào `main` theo thứ tự xong trước, bên sau rebase. **Cây skill sinh ra** (`.agents/skills/**`, `plugins/fgOS/skills/**`): **không commit trong nhánh phase**; tái sinh một lần (`npm run build:skills`) khi merge plan con vào `main`.

## Việc lẻ (ngoài track, làm ngay, song song)

| # | Prompt | Trạng thái | Vì sao cần cho track |
|---|---|---|---|
| A | [prompt-261001-0955-fix-observe-harness-protocol-count.md](../reports/prompt-261001-0955-fix-observe-harness-protocol-count.md) | **xong** (owner báo 2026-10-01 11:38; `main` @ `143b36540`, `58bb92f49`; harness đọc 3 tầng `coordination-protocols`) | số liệu Observe đúng cho nghiệm thu |
| B | [prompt-261001-0955-fix-test-fixture-store-leak.md](../reports/prompt-261001-0955-fix-test-fixture-store-leak.md) | chờ | store sạch → số liệu nền tiêu chí 4 không nhiễu |

## Quy trình thực thi (bắt buộc cho mọi plan con)

- Mỗi plan con: nhánh `plan/261001-request-to-run-pN`, worktree riêng ngoài checkout chính; **mỗi phase một worktree** từ đầu nhánh plan; xong phase → test xanh → commit → `merge --no-ff` vào nhánh plan (trong worktree của nhánh plan, **không** checkout nhánh trong checkout chính) → chạy lại test trên nhánh plan. Merge `main` **một lần** khi plan con xong. Dọn worktree gom cuối plan.
- Ngay sau `git worktree add`: symlink `node_modules` và `target` từ checkout chính.
- **Phase 1 của mọi plan con là "làm tươi"** (merge `main`, GitNexus analyze, scout lại `file:line` **và đếm đủ consumer** của mọi interface bị đổi/xoá — red-team cho thấy đếm thiếu ở 8/10 interface; cập nhật phase lệch theo kết quả nghiệm thu plan trước). Không mở lại quyết định đã chốt trừ khi có bằng chứng mới, và ghi rõ.
- Trước khi sửa symbol: capability gate impact-analysis + GitNexus `impact` upstream; báo blast radius; HIGH/CRITICAL → dừng, báo owner.
- Test: `env -u CLAUDE_CODE_SESSION_ID npm test` (hoặc focused), đọc exit code thật, không qua pipe.
- Skill: sửa ở `core/skills/**` / `domains/**/skills/**`; cây sinh ra theo luật ở trên.
- Mọi khoá config / env / file hạ tầng mới → `fgos setup` + `fgos doctor` (install gate); store mới dưới `.fgos/` phải vào `.gitignore`; thay đổi người dùng thấy → `CHANGELOG.md` `[Unreleased]`.
- Single path, không backward compat: cái mới thay cái cũ thì xoá cái cũ trong cùng phase — **trừ ngoại lệ có tên và chủ xoá ghi trong plan** (vd stamp của engine giữ tới P4 phase 6).
- Guard từ vựng: một file `test/runner/dead-vocabulary-guard.test.mjs` (do T tạo); mỗi plan **thêm** từ của mình; loại trừ module đọc dữ liệu cũ.
- Commit conventional, không ghi mã plan/phase/finding vào commit message hay code comment.

## Tiêu chí "xong" của mọi plan con (synthesis §7d điều chỉnh 2)

1. Mối authority của plan có **đúng một chủ** trong layer chính của nó.
2. `docs/platform/component-boundary.md` (hoặc nguồn chi tiết) cập nhật; hoặc `No component-boundary change` có lý do.
3. Guard test chặn rò ngược (L5 → L3; từ vựng cũ).
4. Quyết định đã chốt ghi vào `docs/specs/<area>.md` "Lịch sử quyết định".
5. Full `npm test` (Node + Rust khi đụng Rust) xanh trên nhánh plan trước khi merge `main`.

## Success Criteria (của cả track — synthesis §0)

- [ ] G1–G7 đạt (G1 Observe thấy mọi lần chạy; G2 không ghim hạ tầng; G3 một đường mỗi năng lực; G4a headless; G4b Workflow non-code có cổng người; G5 không yếu độc lập/governance; G6 không đổi người lặng lẽ; **G7 out-of-process mặc định qua pane herdr, cli fallback cùng năng lực**).
- [ ] Nghiệm thu ca 1 (P1: 2 area docs), ca 2 (P4: architecture advisor), ca 3 (P4: business discussion) **chạy qua pane herdr**, không thua engine ở tiêu chí 1, 2, 4; đúng người lệch không lý do = 0.
- [ ] Engine coordination (~21k dòng) xoá; mọi dạng thảo luận vẫn chạy.
- [ ] Một tên mỗi khái niệm trên code + docs (guard).

## Rủi ro track-level

| Rủi ro | Tín hiệu | Phản ứng định trước |
|---|---|---|
| Mô hình gọn thiếu bảo đảm engine đang có (resume, visibility) | ca nghiệm thu thua tiêu chí 4 | xây đúng phần thiếu trong mô hình gọn; không mang lại engine; không xây được với chi phí hợp lý → owner quyết (Q8) |
| Confinement không áp được trong pane herdr | spike P1 phase 6 thất bại | **dừng, báo owner**; không lặng lẽ bỏ herdr (G7) |
| T trễ | T chưa merge khi P1 sẵn sàng | P1 không bắt đầu (cùng file); làm việc lẻ B, refresh |
| P2 ∥ P3b lệch nhau | xung đột ở file chung | bảng sở hữu; merge theo thứ tự xong; cây skill tái sinh khi merge plan |
| `file:line` trong plan mục | phase refresh phát hiện | phase 1 mỗi plan cập nhật |
| Plan đo RunResult `260930-0335-measure-runresult-classification-impact` phase 4 (producer coordination `maxRounds`) thành việc phí | P4 tiến tới phase 6 | đề xuất owner bỏ/hoãn (Câu hỏi mở) |

## Phases

| # | Phase | Status |
|---|---|---|
| 1 | [Cổng điều kiện tiên quyết](./phase-01-prerequisites-gate.md) | Pending |

## Red Team Review

### Session — 2026-10-01
**Findings:** 37 → 15 mục sau gộp (13 Accept, 1 Accept một phần, 1 phần bác: "`facts` không chết"); 3 mục cần owner quyết → đã chốt (Q-A giữ D-ADR0033, Q-B Unit run không store mới, Q-C P3a trước P2) + G7 herdr + X-1/3/4.
**Severity:** 5 Critical, 8 High, 2 Medium (sau gộp).

| # | Mục | Sev | Phán | Áp vào |
|---|---|---|---|---|
| 1 | Cổng ghi file Q9 kiểm chứng được (re-derive `bind()` từ snapshot) | Critical | Accept | P1 ph5 |
| 2 | Worktree gắn Unit; ghi file chạy `workspace-write`; log do runner ghi; gitignore | Critical | Accept | P1 ph5 |
| 3 | D-ADR0033 | Critical | Owner: giữ | P1 ph3, ph5, ph7 |
| 4 | `fgos run record` chỉ producer inline | High | Accept | P1 ph5 |
| 5 | Không store `unit-runs`; Unit run | Critical | Owner: đồng ý | P1, P5, track |
| 6 | `bind()` tái dùng `mechanism.mjs`; decide/hook chuyển ở P1 | High | Accept | P1 ph3, ph7; P2 ph4 |
| 7 | Một sequencer; tích hợp không phụ thuộc Work; P3a trước P2 | High | Owner: đồng ý | track, P2, P3 |
| 8 | Không xoá `dispatch-runs` ở P1; xoá ở P3b cùng reader | High | Accept | P1 ph5; P3 ph5 |
| 9 | Giữ `policy.capability` master loop; chỉ xoá `facts` | High | Accept một phần | P1 ph7 |
| 10 | Tách P3 phase 3; versioning tạo mới; Rust/herdr/gateway | High | Accept | P3 ph3, ph4 |
| 11 | Verb `fgos workflow` đã có → mở rộng | High | Accept | P3 ph2 |
| 12 | Config/Workflow repo không tin cậy; snapshot; verify confined; bỏ tầng project | High | Accept | P1 ph5; P3 ph2 |
| 13 | Override có `origin`; authorize = cổng người | High | Accept | P1 ph3; P2 ph3; P3 ph2 |
| 14 | Visibility mức prompt = ngang engine | High | Accept | P4 |
| 15 | Việc vụn (Cargo, Observe, ledger, containment, resume, guard, consumer, đo sớm, preset ở module) | Med–High | Accept | nhiều phase |

### Whole-Plan Consistency Sweep
- Files reread: track `plan.md` + phase-01; P1 plan + 8 phase; P2 plan + 5 phase; P3 plan + 6 phase (phase 4 đổi tên `phase-04-surfaces-skills-herdr.md`); P4 plan + 6 phase; P5 plan + 3 phase.
- Decision deltas checked: Q-A (D-ADR0033, checker không inline), Q-B (không `unit-runs`, Unit run, RunResult v4), Q-C (P3a trước P2; mốc merge P3a; bỏ `plan-reader`), G7 (herdr mặc định; ca nghiệm thu qua herdr), X-1/3/4 (posture OS cho herdr + cli; quota phản ứng; xoá `*-readonly`, không `readOnlyDefault`), mục 1, 2, 4, 6, 8, 9, 10, 11, 12, 13, 14, 15.
- Reconciled stale references: `unit-runs` (P1 hợp đồng, ph4, ph5), `plan-reader` (P2 ph3), `decide` ở P2 (chuyển P1 ph7), tầng project loader (P3 ph2, P4 ph3), `isReadOnlyCapable` → `canApplyPosture`, persona/posture doctor (P1 ph2), số câu hỏi mở P4, preset ở một nơi (P1 ph4, P4 ph2), `dead-vocabulary-guard` = append (T tạo).
- `ak plan validate`: 6/6 valid.
- Unresolved contradictions: 0. Báo cáo red-team giữ nguyên văn (bản ghi lịch sử).

## Câu hỏi mở

Không còn (đã chốt ở Validation Log). Q5 hoãn có chủ đích tới P2 phase 5.

## Validation Log

### Session 1 — 2026-10-01 (`/ak:plan validate`)

**Verification:** bỏ qua bước verify đầy đủ (đã có Red Team Review kèm bằng chứng); kiểm lại các con trỏ red-team từng FAILED: `test/runner/dead-vocabulary-guard.test.mjs` có trên nhánh T (`plan/260930-tier-rigor-consolidation`, cả `--phase-01`, `--phase-02`) → append được sau khi T merge; `test/verbs/dispatch-decide*` không còn được nhắc; hook đúng `scripts/dispatch-decide-hook.mjs`. Claims checked: 3 · Verified: 3 · Failed: 0.

| # | Câu hỏi | Quyết định (owner) | Áp vào |
|---|---|---|---|
| 1 | Khi nào authorize phase 4 plan tài liệu (Q5) | **Quyết khi P2 tới phase nghiệm thu**; P2 merge được, phần "chạy thật" ghi chờ Q5 | P2 plan, ph5 |
| 2 | Plan đo RunResult phase 4 (producer coordination `maxRounds`) | **Bỏ** | `plans/260930-0335-measure-runresult-classification-impact/` (bảng producer, phase-04 `status: cancelled`) |
| 3 | Tên skill driver chung | **`fgos-run`** | P2 |
| 4 | Work `awaiting-approval` vs cổng người cuối Workflow | **Work phản chiếu cổng cuối** (một chỗ giữ "chờ duyệt") | P3 plan, ph3 |
| 5 | Hai bản architecture panel | **Gộp một Workflow có tham số** (red-team packet) | P4 plan, ph3 |
| 6 | Dữ liệu session cũ sau xoá engine | **tar backup + báo cáo số liệu nền, rồi xoá; không giữ code đọc** | P4 plan, ph6 |
| 7 | Mức visibility dạng thảo luận | **Ngang engine** (inputs + context sạch); mạnh hơn khi có ca thật | P4 plan, ph1, risk |

Ghi chú trạng thái (2026-10-01 20:50): **T đã merge `main`** (`dc677ac16`); việc lẻ A, B xong; full `npm test` trên `main` 7858 pass / 0 fail. Cổng điều kiện (phase 1 của track) đóng → **P1 bắt đầu được**.

<!-- slug: request-to-run-track -->
