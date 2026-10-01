---
phase: 3
title: "Work: tách work.tier thành work.size + work.rigor"
status: done
priority: P1
effort: "1.5d"
dependencies: [2]
---

# Phase 3: Work — tách `tier` thành `size` + `rigor`

## Overview

`work.tier` đang gánh hai nghĩa cùng lúc: **độ lớn việc** (ước lượng, chia việc) và **độ mạnh model**. Giá trị của nó được gán bằng từ khoá (chữ "docs" → `light`), và hai đường dispatch hiểu nó khác nhau:
- Work runner coi nó là tier model (`light→nano`, `heavy→frontier`);
- `assignment-policy.mjs:256` chỉ nhận khi giá trị thuộc `nano…frontier`, nên `light`/`heavy` bị bỏ qua lặng lẽ.

Phase này tách thành hai trường, mỗi trường một nghĩa (owner chốt 2026-09-30):

| Trường | Giá trị | Nghĩa | Dẫn tới model? |
|---|---|---|---|
| `work.size` | `light / standard / heavy` | Độ lớn, công sức. Dùng cho ước lượng, chia việc, item con kế thừa | **Không bao giờ** |
| `work.rigor` | `low / standard / high / critical` (tuỳ chọn) | Độ nghiêm, cùng thang với step và unit ([phase 2](./phase-02-rigor-replaces-mintier.md)) | Có, qua `rigorToTier` |

Verdict ở discovery (`fgos-coding-discovering`) phán **cả** `size` lẫn `rigor` từ bằng chứng thật.

## Requirements

- Functional:
  - Schema (`src/state/work.mjs`): đổi `TIERS` → `SIZES`, trường `tier` → `size`; thêm `RIGOR_VALUES` (dùng chung hằng của phase 2, không khai bản sao) cho trường tuỳ chọn `rigor`.
  - **Đường đọc duy nhất cho dữ liệu cũ:** event lịch sử có `tier` được map thành `size` lúc đọc (store/replay), đúng một chỗ. **Lưu ý snapshot:** `rebuildView`/`rebuildViewFromDir` đi đường tắt, trả nguyên `state.json` đã lưu hoặc chỉ fold phần bytes mới (`replay.mjs:705-738,750-754,930-934`). Snapshot không có version, nên 1042 item đã fold sẽ không bao giờ được map lại. Vì vậy phải thêm `viewSchemaVersion` vào `state.json`: lệch version thì fold lại từ đầu. Rust `work_source.rs:6,86-90` đọc cùng `state.json` và phải kiểm cùng version. Test phải bắt đầu từ một `state.json` hình dạng cũ, không chỉ từ event log. <!-- Updated: Red Team 2026-09-30 --> Không ghi lại lịch sử, không có alias ở bất kỳ nơi nào khác. Event mới chỉ ghi `size`/`rigor`.
  - **`work.risk: heavy` (D18):** hiện nâng sàn lên `flagship` (`assignment-policy.mjs:259-262`; 199 item). Sau phase này dispatch chỉ đọc `rigor`. Item chưa có `rigor` mà có `risk: heavy` được đọc thành `rigor: high` ở cùng chỗ với đường đọc dữ liệu cũ. `risk` vẫn giữ các công dụng khác, nhưng không còn là kênh vào tier. <!-- Updated: Red Team 2026-09-30 -->
  - Intake: `classify.mjs` trả `size` (giữ luật từ khoá, vì đây vẫn là placeholder tạm tới discovery); `classify` **không** đoán `rigor`.
  - CLI: `fgos add/submit/discover/edit` bỏ `--tier`, thêm `--size` và `--rigor`. Truyền `--tier` → lỗi kèm hướng dẫn. Định nghĩa flag nằm ở `src/cli/command-registry.mjs:124,162,191,314` và `bin/fgos.mjs:539,817-821,972-980,1110`. **Không** đụng `--tier` của coordination/`dispatch execute` (`cli.mjs:1288,1299,1410`, `dispatch.mjs:119`, `bin/fgos.mjs:2634-2716`): đó là kênh override tier hợp lệ. <!-- Updated: Red Team 2026-09-30 -->
  - Prompt discovery (`src/runner/prompt-templates/worker-prompt-discovery.txt:26-34`): verdict JSON đổi `"tier"` → `"size"` và thêm `"rigor"`; parser verdict nhận hai field mới. Nếu không, discovery sẽ không bao giờ ghi được `rigor`.
  - `src/runner/capability-match.mjs:23,81` import `TIERS` để kiểm `DemandFacts.size` → đổi sang `SIZES`.
  - `src/state/gate-bypass.mjs:32` (`LEVELS = ['off', ...TIERS]`, cùng `.fgos/gate-bypass.json` đã lưu): đổi sang `SIZES`, giữ giá trị đã lưu (`standard` vẫn hợp lệ).
  - `executors.*.tier` (`cli.mjs:816`): chỉ nhận `nano…frontier`; giá trị `light|heavy` → lỗi validate kèm hướng dẫn. (`capabilities.*.overrides.tier` đã bị xoá ở [phase 2](./phase-02-rigor-replaces-mintier.md), D19; sàn theo loại việc là `capabilities.<cap>.rigor`, gộp chỉ-nâng với `work.rigor` ở đường Work dispatch bên dưới.) <!-- Updated: Session 3 2026-10-01 -->
  - Work dispatch gộp `rigor = max(work.rigor ?? standard, capabilities[capability].rigor)` trước `rigorToTier` (D19); có test.
  - herdr web: `herdr-plugin/web/src/api/types.ts:48`, `herdr-plugin/web/src/screens/TaskDetail.tsx:215` chuyển sang `size` (+ `rigor`). Contract JSON của gateway nhận `size`/`rigor`; key `tier` → lỗi 4xx kèm hướng dẫn.
  - Item con của decompose (`src/intake/plan.mjs:952`) kế thừa `size`; `rigor` kế thừa nếu cha có.
  - Work dispatch (`src/runner/loop.mjs:1644`, `src/runner/dispatch/cli.mjs:296`, `src/runner/dispatch/plan.mjs:400`, `assignment-policy.mjs:256`, `claim-port.mjs:326`, `work-compat.mjs:259`): lấy `rigor` của item, thiếu thì `standard`, đưa vào `rigorToTier`. `size` không được đọc ở bất kỳ đường dispatch nào.
  - Xoá `DEFAULT_TIER_TO_POLICY` và bridge tạm thời trong `resolveTierModel` (còn lại từ [phase 1](./phase-01-single-tier-model-resolver.md)). `fgos dispatch execute --tier` chỉ nhận `nano…frontier`; thêm `--rigor`.
  - Skill `fgos-coding-discovering`: khi verdict `clear`, phán `size` + `rigor` + `kind` + `risk` và gọi `fgos edit <id> --size … --rigor … --kind … --risk …`. Tiêu chí phán `rigor` viết ngắn trong skill: độ nghiêm là hậu quả khi làm sai (blast radius, contract công khai, bảo mật, dữ liệu), **không phải** độ lớn việc.
  - Rust: `packages/work-state/rust/src/work_source.rs:540` đọc `size` (và map `tier` cũ → `size` đúng như đường đọc Node); `herdr-plugin/src/gateway.rs:713` đổi cờ chuyển tiếp `--tier` → `--size` và thêm `--rigor`.
  - Các module đọc `tier` trong `src/state/**` (`impact.mjs`, `retro-pool.mjs`, `discover-pool.mjs`, `replay.mjs`, `handoff.mjs`, `retrospective-doors.mjs`, `graph-harness.mjs`, `gate-bypass.mjs`, `store.mjs`) và `src/verbs/state/edit.mjs` chuyển sang `size`, hoặc `rigor` nếu chỗ đó thật sự cần độ nghiêm (xét từng chỗ, ghi vào báo cáo phase).
- Non-functional:
  - Item hiện có (1042; `standard` 542, `light` 326, `heavy` 174) không có `rigor` → dispatch ở `standard`, trừ item `risk: heavy` → `high` (D18). Item size `heavy` đang chạy `frontier` sẽ về `standard` (hoặc `flagship` nếu `risk: heavy`) cho tới khi discovery phán `rigor`. Ghi rõ trong CHANGELOG ([phase 4](./phase-04-guard-docs-and-main-merge.md)).
  - L3 (`docs/platform-foundations.md`): JSONL là nguồn sự thật, db là view. Không sửa `events.jsonl`; `state.json`/view được build lại qua đường đọc.

## Architecture

```text
submit ──classify──► size (placeholder)            rigor: (trống)
discovery verdict ─► size + rigor (bằng chứng thật)
decompose ─────────► con kế thừa size (+ rigor nếu cha có)
Work dispatch ─────► rigor ?? standard → rigorToTier → tier → modelPolicies[provider][tier]
ước lượng/lịch ────► size (không bao giờ tới model)
đọc event cũ ──────► tier → size (một chỗ, lúc đọc)
```

## Related Code Files

- Modify (Node): `src/state/work.mjs`, `src/state/store.mjs`, `src/state/replay.mjs`, `src/state/impact.mjs`, `src/state/retro-pool.mjs`, `src/state/discover-pool.mjs`, `src/state/handoff.mjs`, `src/state/retrospective-doors.mjs`, `src/state/graph-harness.mjs`, `src/state/gate-bypass.mjs`, `src/verbs/state/edit.mjs`, `src/intake/classify.mjs`, `src/intake/discovery.mjs`, `src/intake/plan.mjs`, `src/runner/loop.mjs`, `src/runner/claim-port.mjs`, `src/runner/work-compat.mjs`, `src/runner/prompt-templates.mjs` (bỏ `tier` khỏi đầu vào `selectTemplate`, vì không rule nào dùng), `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/assignment-policy.mjs`, `bin/fgos.mjs` (cờ `--tier` ở `add`/`discover`/`edit`, khoảng dòng 539, 817-821, 972-980)
- Modify (Rust/web): `packages/work-state/rust/src/work_source.rs`, `herdr-plugin/src/gateway.rs`, `herdr-plugin/web/src/api/types.ts`, `herdr-plugin/web/src/screens/TaskDetail.tsx`
- Modify (thêm, red team): `src/cli/command-registry.mjs`, `src/runner/prompt-templates/worker-prompt-discovery.txt`, `src/runner/capability-match.mjs`, `src/state/gate-bypass.mjs`, `src/runner/dispatch/config.mjs`, `core/agents/*.yaml` (`model_tier` → `rigor`), `scripts/project-agents.mjs`
- Modify (skill; sửa ở nguồn rồi `npm run build:skills`): `domains/coding/skills/fgos-coding-discovering/SKILL.md`, cùng mọi skill hay doctrine khác mà `rg -n "\-\-tier|work\.tier|\btier\b" core domains` tìm thấy và thật sự nói về tier của Work
- Tests: mọi test mà `rg -l "tier" test/state test/intake test/cli test/e2e test/runner/loop.test.mjs` tìm thấy (sửa theo nghĩa, không đổi tên hàng loạt); Rust: `cargo test -p <work-state crate>` và test của herdr-plugin

## Implementation Steps

1. Mở worktree phase từ đầu nhánh plan (đã có phase 1–2). Chạy `impact` upstream cho `addWork`/`validateWork` (`work.mjs`), `classify`, `dispatchClaimedItem`, `selectTemplate`, và phía Rust `work_source`.
2. **Kiểm kê từng chỗ đọc `tier` của Work** (Node + Rust + skill), phân loại "nghĩa độ lớn" → `size` hay "nghĩa độ mạnh" → `rigor`. Ghi bảng vào báo cáo phase trước khi sửa. Chỗ nào không rõ nghĩa: dừng lại và hỏi owner (gom thành một lượt).
3. Viết test trước:
   - event cũ có `tier` đọc ra `size`;
   - `--tier` bị từ chối kèm hướng dẫn;
   - Work dispatch với `rigor: high` ra tier `flagship`;
   - không có `rigor` → `standard`;
   - `size: heavy` không ảnh hưởng model;
   - `risk: heavy`, không có `rigor` → `rigor: high`;
   - bắt đầu từ `state.json` cũ (không có version) → view có `size`.
4. Sửa schema, store, đường đọc, CLI, intake, dispatch.
5. Sửa Rust (`work_source.rs`, `gateway.rs`) cùng test tương ứng.
6. Sửa skill `fgos-coding-discovering` ở nguồn; `npm run build:skills`.
7. Bổ sung vào `dead-vocabulary-guard.test.mjs`: `DEFAULT_TIER_TO_POLICY`, mẫu `\b(item|work|workItem)\??\.tier\b`, `TIERS` (của work.mjs), cờ `tier` trong định nghĩa flag của các verb Work (`add/submit/discover/edit` trong `command-registry.mjs` và `bin/fgos.mjs`). Không chặn `'--tier'` toàn cục, vì override coordination/`dispatch execute` là hợp lệ. Ngoại lệ duy nhất: chỗ map `tier → size` ở đường đọc, có đánh dấu tường minh. <!-- Updated: Red Team 2026-09-30 -->
8. Chạy focused tests Node + `cargo test` cho hai crate + `npm run test:related`, với `env -u CLAUDE_CODE_SESSION_ID`. Xanh thì commit, merge `--no-ff` vào nhánh plan, chạy lại focused tests trên nhánh plan.

## Success Criteria

- [x] `rg -n "\b(item|work|workItem)\??\.tier\b" src bin packages herdr-plugin` → chỉ còn đúng một chỗ map `tier → size` ở đường đọc; các verb Work không còn khai cờ `tier`; `--tier` của coordination/`dispatch execute` vẫn còn. <!-- Updated: Red Team 2026-09-30 -->
- [x] `rg -n "DEFAULT_TIER_TO_POLICY" src bin` → rỗng; `resolveTierModel` chỉ nhận `nano…frontier`.
- [x] `size` không xuất hiện ở bất kỳ file nào trong `src/runner/dispatch/**` (có test/guard).
- [x] `fgos list`, view Rust và herdr web hiển thị `size` cho item cũ, **trên `.fgos` thật** (snapshot `state.json` cũ), không chỉ trên fixture.
- [x] Skill discovery phán và ghi được `size` + `rigor` (có test skill hoặc e2e tương ứng).
- [x] Guard test xanh; focused tests Node + Rust xanh; đã merge vào nhánh plan.

## Risk Assessment

- **Phạm vi lan sang lớp Work** (Node, Rust, skill). Tín hiệu: bảng kiểm kê ở bước 2 có nhiều chỗ nghĩa không rõ. Xử lý: hỏi owner một lượt; không đoán.
- **Item `heavy` tụt model** cho tới khi discovery phán `rigor`. Tín hiệu: `fgos metrics runs` cho thấy chất lượng Work dispatch giảm. Xử lý: owner có thể `fgos edit <id> --rigor high` cho item đang dở; không thêm luật tự suy `size → rigor` (đó chính là liên kết vừa cắt).
- **Rust và Node đọc event khác nhau** sau khi đổi. Xử lý: cùng một bộ fixture event cũ và mới cho cả hai phía.
- **Rollback:** revert merge commit của phase trên nhánh plan; event mới ghi `size` trong lúc chạy thử chỉ nằm trong worktree hoặc fixture, không đụng `.fgos` của `main`.
