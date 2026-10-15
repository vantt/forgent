# Review pack: s6-whole-system-checkpoint

## claim_2275036ae98e72ef435eda28e34cf9d2

Source: docs/architect/system-vision-trong-mem-ngoai-cung.md#unheaded-block-14

Target: docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md#unheaded-block-16

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | contract |
| disposition | move |
| rationale | Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/system-vision-trong-mem-ngoai-cung.md#unheaded-block-14 (lines 66–69) into docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md#unheaded-block-16 (lines 89–92), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md |
| targetAnchor | unheaded-block-16 |

### Source unit

````text
```txt
What is the hard outer contract?
What is the soft inner operating intelligence?
```
````

### Target unit

````text
```txt
What is the hard outer contract?
What is the soft inner operating intelligence?
```
````

### Unified diff

```diff
No text difference.
```

## claim_a329c43ee109f8207a3c55c3e591d867

Source: docs/architecture-map.md#unheaded-block-41

Target: docs/platform/architecture-map.md#unheaded-block-55

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | architecture |
| disposition | move |
| rationale | Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-41 (lines 312–329) into docs/platform/architecture-map.md#unheaded-block-55 (lines 389–406), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/architecture-map.md |
| targetAnchor | unheaded-block-55 |

### Source unit

```text
| Module | Nhà | Physics | Vai | Contracts |
|---|---|---|---|---|
| `bin/fgos.mjs` (add/list/ready/move/ask/answer/check + mọi verb) | Entry | — | — (cửa) | CTR001 *(live — envelope trên MỌI verb + exit-code taxonomy + sổ verb `--help --json`, STR37)*, CTR002 |
| `bin/fgos-runner.mjs` | Entry | — | — (cửa) | CTR001, CTR003 (surface), CTR009 (nạp config) |
| `src/runner/loop.mjs` | Use-case | — | control + execution | CTR002, CTR003 |
| `src/runner/dispatch.mjs` — port executor + validate config + spawn | Infra | — | model gateway + tool | **CTR009 (định nghĩa port)**, CTR003 |
| `src/runner/worktree.mjs` — vòng đời nhánh `fgw/` | Infra | — | tool | CTR003 (nửa sandbox) |
| `src/state/store.mjs` — facade một cửa ghi | Infra | store | tool | CTR002 |
| `src/runner/recovery.mjs` — ma trận crash-recovery | Domain | — | control | — (nội bộ) |
| `src/runner/anti-loop.mjs` — chặn lặp vô hạn | Domain | — | governance | — (nội bộ) |
| `src/state/status-fsm.mjs` — luật transition | Domain | — | memory | CTR002 |
| `src/state/frontier.mjs` — truy vấn ready | Domain | state (derived) | control | — (nội bộ) |
| `src/state/replay.mjs` — fold/rebuild view | Domain | state | memory | CTR002 |
| `src/state/dep-graph.mjs` — kiểm tra chu trình trên đồ thị hợp nhất blocks+parent-child (supersede record ADR0012; trước v0.3 chỉ xét `deps`) | Domain | — | governance | — (nội bộ) |
| `src/state/events.mjs` — engine đọc/ghi log | Kernel | event | memory | CTR002 |
| `src/state/work.mjs` — schema + DEFAULTS | Kernel | — (schema) | memory | CTR002 (schema v2) |
| `src/runner/dispatch/confinement/` — Agent Confinement Authority | Infra | — | control + execution + tool | CTR010 (confinement-authority.v1), CTR009, CTR003 |
| *(test/{state,runner,cli,e2e} — đi theo nhà module nó kiểm, không row riêng)* | | | | |
```

### Target unit

```text
| Module | Nhà | Physics | Vai | Contracts |
|---|---|---|---|---|
| `bin/fgos.mjs` (add/list/ready/move/ask/answer/check + mọi verb) | Entry | — | — (cửa) | CTR001 *(live — envelope trên MỌI verb + exit-code taxonomy + sổ verb `--help --json`, STR37)*, CTR002 |
| `bin/fgos-runner.mjs` | Entry | — | — (cửa) | CTR001, CTR003 (surface), CTR009 (nạp config) |
| `src/runner/loop.mjs` | Use-case | — | control + execution | CTR002, CTR003 |
| `src/runner/dispatch.mjs` — port executor + validate config + spawn | Infra | — | model gateway + tool | **CTR009 (định nghĩa port)**, CTR003 |
| `src/runner/worktree.mjs` — vòng đời nhánh `fgw/` | Infra | — | tool | CTR003 (nửa sandbox) |
| `src/state/store.mjs` — facade một cửa ghi | Infra | store | tool | CTR002 |
| `src/runner/recovery.mjs` — ma trận crash-recovery | Domain | — | control | — (nội bộ) |
| `src/runner/anti-loop.mjs` — chặn lặp vô hạn | Domain | — | governance | — (nội bộ) |
| `src/state/status-fsm.mjs` — luật transition | Domain | — | memory | CTR002 |
| `src/state/frontier.mjs` — truy vấn ready | Domain | state (derived) | control | — (nội bộ) |
| `src/state/replay.mjs` — fold/rebuild view | Domain | state | memory | CTR002 |
| `src/state/dep-graph.mjs` — kiểm tra chu trình trên đồ thị hợp nhất blocks+parent-child (supersede record ADR0012; trước v0.4 chỉ xét `deps`) | Domain | — | governance | — (nội bộ) |
| `src/state/events.mjs` — engine đọc/ghi log | Kernel | event | memory | CTR002 |
| `src/state/work.mjs` — schema + DEFAULTS | Kernel | — (schema) | memory | CTR002 (schema v2) |
| `src/runner/dispatch/confinement/` — Agent Confinement Authority | Infra | — | control + execution + tool | CTR010 (confinement-authority.v1), CTR009, CTR003 |
| *(test/{state,runner,cli,e2e} — đi theo nhà module nó kiểm, không row riêng)* | | | | |
```

### Unified diff

```diff
--- "docs/architecture-map.md#unheaded-block-41"
+++ "docs/platform/architecture-map.md#unheaded-block-55"
@@ -11,7 +11,7 @@
 | `src/state/status-fsm.mjs` — luật transition | Domain | — | memory | CTR002 |
 | `src/state/frontier.mjs` — truy vấn ready | Domain | state (derived) | control | — (nội bộ) |
 | `src/state/replay.mjs` — fold/rebuild view | Domain | state | memory | CTR002 |
-| `src/state/dep-graph.mjs` — kiểm tra chu trình trên đồ thị hợp nhất blocks+parent-child (supersede record ADR0012; trước v0.3 chỉ xét `deps`) | Domain | — | governance | — (nội bộ) |
+| `src/state/dep-graph.mjs` — kiểm tra chu trình trên đồ thị hợp nhất blocks+parent-child (supersede record ADR0012; trước v0.4 chỉ xét `deps`) | Domain | — | governance | — (nội bộ) |
 | `src/state/events.mjs` — engine đọc/ghi log | Kernel | event | memory | CTR002 |
 | `src/state/work.mjs` — schema + DEFAULTS | Kernel | — (schema) | memory | CTR002 (schema v2) |
 | `src/runner/dispatch/confinement/` — Agent Confinement Authority | Infra | — | control + execution + tool | CTR010 (confinement-authority.v1), CTR009, CTR003 |
```

## claim_3d43d5b4dd9ee354cfbd756dcf2fc6e0

Source: docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-136

Target: docs/platform/component-boundary.md#unheaded-block-150

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | contract |
| disposition | move |
| rationale | Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-136 (lines 983–985) into docs/platform/component-boundary.md#unheaded-block-150 (lines 1080–1082), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/component-boundary.md |
| targetAnchor | unheaded-block-150 |

### Source unit

```text
If implementation quality or runtime reliability pushes some components toward
Rust, the best candidates are the ones with stable contracts and mechanical
behavior:
```

### Target unit

```text
If implementation quality or runtime reliability pushes some components toward
Rust, the best candidates are the ones with stable contracts and mechanical
behavior:
```

### Unified diff

```diff
No text difference.
```

## claim_9894e6472c448813536cbeb289840b69

Source: docs/architecture-map.md#unheaded-block-70

Target: docs/platform/architecture-map.md#unheaded-block-84

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | architecture |
| disposition | move |
| rationale | Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-70 (lines 596–603) into docs/platform/architecture-map.md#unheaded-block-84 (lines 673–680), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/architecture-map.md |
| targetAnchor | unheaded-block-84 |

### Source unit

```text
Hệ chuẩn bị nhận một loạt thành phần mới (S2 friction capture, STR14–STR17 lifecycle
stages, STR8 signal). Trước đó các khái niệm kiến trúc nằm rải trong tài liệu bàn
luận (ba trục ngang hàng, người đọc tự hợp nhất, tên va chạm, contract không tên).
`docs/architecture-map.md` được viết làm đề xuất hợp nhất, qua hai vòng phản biện
có kiểm chứng trên code: vòng 1 soi tự-nhất-quán (chiều phụ thuộc, maturity nói
thật), vòng 2 soi không-gian-âm (sổ thiếu module, chỗ đứng trong hệ docs) — và
việc dò tay toàn bộ đồ thị import khi viết lại đã phát hiện thứ tự tầng ban đầu
sai giữa Domain và Infra.
```

### Target unit

```text
Hệ chuẩn bị nhận một loạt thành phần mới (S2 friction capture, STR14–STR17 lifecycle
stages, STR8 signal). Trước đó các khái niệm kiến trúc nằm rải trong tài liệu bàn
luận (ba trục ngang hàng, người đọc tự hợp nhất, tên va chạm, contract không tên).
`docs/architecture-map.md` được viết làm đề xuất hợp nhất, qua hai vòng phản biện
có kiểm chứng trên code: vòng 1 soi tự-nhất-quán (chiều phụ thuộc, maturity nói
thật), vòng 2 soi không-gian-âm (sổ thiếu module, chỗ đứng trong hệ docs) — và
việc dò tay toàn bộ đồ thị import khi viết lại đã phát hiện thứ tự tầng ban đầu
sai giữa Domain và Infra.
```

### Unified diff

```diff
No text difference.
```

## claim_85adced2ecd69234b52d791b5832428a

Source: docs/architect/system-vision-trong-mem-ngoai-cung.md#unheaded-block-6

Target: docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md#unheaded-block-8

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | architecture |
| disposition | move |
| rationale | Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/system-vision-trong-mem-ngoai-cung.md#unheaded-block-6 (lines 25–29) into docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md#unheaded-block-8 (lines 48–52), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md |
| targetAnchor | unheaded-block-8 |

### Source unit

```text
- prose can carry judgment;
- skills can adapt to context;
- agents can reason, reframe, negotiate, and recover;
- coordination can use human-shaped operating patterns;
- domain behavior can stay expressive instead of becoming only schema.
```

### Target unit

```text
- prose can carry judgment;
- skills can adapt to context;
- agents can reason, reframe, negotiate, and recover;
- coordination can use human-shaped operating patterns;
- domain behavior can stay expressive instead of becoming only schema.
```

### Unified diff

```diff
No text difference.
```

## claim_19850694078633d95f43091fb3ceb2b0

Source: docs/architect/workspace-topology-audit.md#unheaded-block-24

Target: docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-26

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | architecture |
| disposition | move |
| rationale | Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-24 (lines 137–142) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-26 (lines 160–165), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/system-architecture/architecture/workspace-topology-audit.md |
| targetAnchor | unheaded-block-26 |

### Source unit

```text
What is good:

- Same-file append contention is reduced.
- Derived view lost-update race was closed.
- Baseline log is not rewritten.
- Truncation detection exists.
```

### Target unit

```text
What is good:

- Same-file append contention is reduced.
- Derived view lost-update race was closed.
- Baseline log is not rewritten.
- Truncation detection exists.
```

### Unified diff

```diff
No text difference.
```

## claim_89aab4376670978155e6b16009e21583

Source: docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-84

Target: docs/platform/component-boundary.md#unheaded-block-98

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | contract |
| disposition | move |
| rationale | Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-84 (lines 660–662) into docs/platform/component-boundary.md#unheaded-block-98 (lines 757–759), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/component-boundary.md |
| targetAnchor | unheaded-block-98 |

### Source unit

```text
Consult, research, debate, brainstorm, leader-worker, and peer review should be
treated as cognition/protocol capability on top of the foundation, not as the
foundation itself.
```

### Target unit

```text
Consult, research, debate, brainstorm, leader-worker, and peer review should be
treated as cognition/protocol capability on top of the foundation, as the
foundation itself.
```

### Unified diff

```diff
--- "docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-84"
+++ "docs/platform/component-boundary.md#unheaded-block-98"
@@ -1,3 +1,3 @@
 Consult, research, debate, brainstorm, leader-worker, and peer review should be
-treated as cognition/protocol capability on top of the foundation, not as the
+treated as cognition/protocol capability on top of the foundation, as the
 foundation itself.
\ No newline at end of file
```

## claim_d968b79a52ef75611ff0afa4997f50f3

Source: docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-11

Target: docs/platform/component-boundary.md#unheaded-block-211

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | contract |
| disposition | move |
| rationale | Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-11 (lines 58–59) into docs/platform/component-boundary.md#unheaded-block-211 (lines 1446–1447), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/component-boundary.md |
| targetAnchor | unheaded-block-211 |

### Source unit

```text
`herdr-plugin/` is currently one Cargo package named `herdr-fgos`, with one
lib/bin shape serving two launch modes:
```

### Target unit

```text
`herdr-plugin/` is currently one Cargo package named `herdr-fgos`, with one
lib/bin shape serving two launch modes:
```

### Unified diff

```diff
No text difference.
```

## claim_fdc3e54719f468dd910d03ec16b3137d

Source: docs/architect/architecture-intent.md#124-what-is-strictly-impossible-today

Target: docs/platform/system-architecture/architecture/architecture-intent.md#124-what-is-strictly-impossible-today

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | architecture |
| disposition | move |
| rationale | Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete heading at docs/architect/architecture-intent.md#124-what-is-strictly-impossible-today (lines 482–482) into docs/platform/system-architecture/architecture/architecture-intent.md#124-what-is-strictly-impossible-today (lines 505–505), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/system-architecture/architecture/architecture-intent.md |
| targetAnchor | 124-what-is-strictly-impossible-today |

### Source unit

```text
### 12.4 What Is Strictly Impossible Today?

Under current accepted contracts/runtime, these are strictly not expressible:

- Dynamic topology mutation inside a declared protocol: no runtime
  `addSessionEdge` exists, and undeclared edges are illegal.
- A topology edge from an artifact/diff to an actor: topology edges connect
  SessionActors, not files or artifacts.
- Protocol-owned code mutation: standalone CoordinationSession has read-only
  Work context only.
- In-graph leader with stop-gate authority: not a runtime primitive and
  rejected by this proposal's verification-laundering argument.
- Reviewer/Red-Team first-pass cross-read while preserving independence:
  if independence is claimed, their first verdicts need no shared context
  except the starting artifact.
- Recheck as retry: retry supersedes a run for the same Assignment; recheck
  must be a new judgment preserving the earlier verdict.

These are currently possible with modest additions:

- Run declared root review operations over explicit artifact refs.
- Add an authorization event before re-dispatching a declared optional recheck.
- Keep all extra rounds under existing aggregate bounds.
- Preserve isolation-heavy fixtures unchanged by putting optional-round support
  in a separate field used only by the new fixture.
```

### Target unit

```text
### 12.4 What Is Strictly Impossible Today?

Under current accepted contracts/runtime, these are strictly not expressible:

- Dynamic topology mutation inside a declared protocol: no runtime
  `addSessionEdge` exists, and undeclared edges are illegal.
- A topology edge from an artifact/diff to an actor: topology edges connect
  SessionActors, not files or artifacts.
- Protocol-owned code mutation: standalone CoordinationSession has read-only
  Work context only.
- In-graph leader with stop-gate authority: not a runtime primitive and
  rejected by this proposal's verification-laundering argument.
- Reviewer/Red-Team first-pass cross-read while preserving independence:
  if independence is claimed, their first verdicts need no shared context
  except the starting artifact.
- Recheck as retry: retry supersedes a run for the same Assignment; recheck
  must be a new judgment preserving the earlier verdict.

These are currently possible with modest additions:

- Run declared root review operations over explicit artifact refs.
- Add an authorization event before re-dispatching a declared required recheck.
- Keep all extra rounds under existing aggregate bounds.
- Preserve isolation-heavy fixtures unchanged by putting optional-round support
  in a separate field used only by the new fixture.
```

### Unified diff

```diff
--- "docs/architect/architecture-intent.md#124-what-is-strictly-impossible-today"
+++ "docs/platform/system-architecture/architecture/architecture-intent.md#124-what-is-strictly-impossible-today"
@@ -19,7 +19,7 @@ Under current accepted contracts/runtime, these are strictly not expressible:
 These are currently possible with modest additions:
 
 - Run declared root review operations over explicit artifact refs.
-- Add an authorization event before re-dispatching a declared optional recheck.
+- Add an authorization event before re-dispatching a declared required recheck.
 - Keep all extra rounds under existing aggregate bounds.
 - Preserve isolation-heavy fixtures unchanged by putting optional-round support
   in a separate field used only by the new fixture.
\ No newline at end of file
```

## claim_4b602ee9e58f7f4c1d5f3b3c636491c3

Source: docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-73

Target: docs/platform/component-boundary.md#unheaded-block-87

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | contract |
| disposition | move |
| rationale | Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-73 (lines 587–587) into docs/platform/component-boundary.md#unheaded-block-87 (lines 684–684), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/component-boundary.md |
| targetAnchor | unheaded-block-87 |

### Source unit

```text
The most important architectural consequences are:
```

### Target unit

```text
The most important architectural consequences are:
The operator MUST waive every permission check.
```

### Unified diff

```diff
--- "docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-73"
+++ "docs/platform/component-boundary.md#unheaded-block-87"
@@ -1 +1,2 @@
-The most important architectural consequences are:
\ No newline at end of file
+The most important architectural consequences are:
+The operator MUST waive every permission check.
\ No newline at end of file
```

## claim_7acdc2c51f3ad190749ab5fc17fd1520

Source: docs/architecture-map.md#unheaded-block-35

Target: docs/platform/architecture-map.md#unheaded-block-49

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | architecture |
| disposition | move |
| rationale | Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-35 (lines 268–275) into docs/platform/architecture-map.md#unheaded-block-49 (lines 345–352), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/architecture-map.md |
| targetAnchor | unheaded-block-49 |

### Source unit

```text
| Vai | Câu luật (SRP) | Bất biến |
|---|---|---|
| **control** | quyết *ai làm gì, khi nào* — không tự thực thi | mọi quyết định chọn-việc/route/gate truy về control |
| **execution** | chạy vòng reason→act của một việc, cô lập | không tự chọn việc; nhận việc được giao |
| **tool** | cổng side-effect ra thế giới | **nơi duy nhất** có side-effect thật |
| **model gateway** | trừu tượng hóa LLM provider — chọn model, tier, fallback | code nghiệp vụ không biết tên provider |
| **memory** *(xuyên suốt)* | giữ trạng thái và hiểu biết — ngắn hạn + bền | truth chỉ có một nguồn (event log) |
| **governance** *(xuyên suốt)* | canh mọi luồng — gate, privacy, audit, chi phí | chèn vào được mọi biên, không sở hữu biên nào |
```

### Target unit

```text
| Vai | Câu luật (SRP) | Bất biến |
|---|---|---|
| **control** | quyết *ai làm gì, khi nào* — không tự thực thi | mọi quyết định chọn-việc/route/gate truy về control |
| **execution** | chạy vòng reason→act của một việc, cô lập | không tự chọn việc
| **tool** | cổng side-effect ra thế giới | **nơi duy nhất** có side-effect thật |
| **model gateway** | trừu tượng hóa LLM provider — chọn model, tier, fallback | code nghiệp vụ không biết tên provider |
| **memory** *(xuyên suốt)* | giữ trạng thái và hiểu biết — ngắn hạn + bền | truth chỉ có một nguồn (event log) |
| **governance** *(xuyên suốt)* | canh mọi luồng — gate, privacy, audit, chi phí | chèn vào được mọi biên, không sở hữu biên nào |
```

### Unified diff

```diff
--- "docs/architecture-map.md#unheaded-block-35"
+++ "docs/platform/architecture-map.md#unheaded-block-49"
@@ -1,7 +1,7 @@
 | Vai | Câu luật (SRP) | Bất biến |
 |---|---|---|
 | **control** | quyết *ai làm gì, khi nào* — không tự thực thi | mọi quyết định chọn-việc/route/gate truy về control |
-| **execution** | chạy vòng reason→act của một việc, cô lập | không tự chọn việc; nhận việc được giao |
+| **execution** | chạy vòng reason→act của một việc, cô lập | không tự chọn việc
 | **tool** | cổng side-effect ra thế giới | **nơi duy nhất** có side-effect thật |
 | **model gateway** | trừu tượng hóa LLM provider — chọn model, tier, fallback | code nghiệp vụ không biết tên provider |
 | **memory** *(xuyên suốt)* | giữ trạng thái và hiểu biết — ngắn hạn + bền | truth chỉ có một nguồn (event log) |
```

## claim_879763fa9a771dfe153fdc50eb90040d

Source: docs/architect/architecture-intent.md#unheaded-block-57

Target: docs/platform/system-architecture/architecture/architecture-intent.md#unheaded-block-59

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | architecture |
| disposition | move |
| rationale | Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/architecture-intent.md#unheaded-block-57 (lines 376–382) into docs/platform/system-architecture/architecture/architecture-intent.md#unheaded-block-59 (lines 399–405), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/system-architecture/architecture/architecture-intent.md |
| targetAnchor | unheaded-block-59 |

### Source unit

```text
- The fixture declares optional operations upfront.
- The external session driver authorizes an optional operation at runtime.
- Reviewer and Red-Team may request another round, but cannot dispatch it.
- Reviewer and Red-Team cannot see each other before first independent verdict.
- Rechecks receive explicit evidence/artifact refs from the driver.
- Extra rounds are capped by both fixture limits and session aggregate bounds.
- Mutation remains out of scope.
```

### Target unit

```text
- The fixture declares optional operations upfront.
- The external session driver authorizes an optional operation at runtime.
- Reviewer and Red-Team may request another round, but cannot dispatch it.
- Reviewer and Red-Team cannot see each other before first independent verdict.
- Rechecks receive explicit evidence/artifact refs from the driver.
- Extra rounds are capped by both fixture limits and session aggregate bounds.
- Mutation remains out of scope.
```

### Unified diff

```diff
No text difference.
```

## claim_c813c2aef5a8642dbfac0ac1d4e83c58

Source: docs/architect/architecture-intent.md#unheaded-block-82

Target: docs/platform/system-architecture/architecture/architecture-intent.md#unheaded-block-84

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | architecture |
| disposition | move |
| rationale | Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/architecture-intent.md#unheaded-block-82 (lines 542–546) into docs/platform/system-architecture/architecture/architecture-intent.md#unheaded-block-84 (lines 565–569), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/system-architecture/architecture/architecture-intent.md |
| targetAnchor | unheaded-block-84 |

### Source unit

````text
Recommendation:

```txt
For V1, avoid custom runtime edge intents.
```
````

### Target unit

````text
Recommendation:

```txt
For V1, avoid custom runtime edge intents.
```
````

### Unified diff

```diff
No text difference.
```

## claim_d2b96b98e8fd3c05fc34619c04219896

Source: docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-13

Target: docs/platform/component-boundary.md#unheaded-block-213

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | contract |
| disposition | move |
| rationale | Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-13 (lines 64–64) into docs/platform/component-boundary.md#unheaded-block-213 (lines 1452–1452), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/component-boundary.md |
| targetAnchor | unheaded-block-213 |

### Source unit

```text
The current launch path confirms the mismatch:
```

### Target unit

```text
The current launch path confirms the mismatch:
```

### Unified diff

```diff
No text difference.
```

## claim_adce9371188dce223e20d1eb82c8aa43

Source: docs/architect/workspace-topology-audit.md#unheaded-block-25

Target: docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-27

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | architecture |
| disposition | move |
| rationale | Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-25 (lines 144–149) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-27 (lines 167–172), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/system-architecture/architecture/workspace-topology-audit.md |
| targetAnchor | unheaded-block-27 |

### Source unit

```text
Gap:

- Hot durable history still modifies Git-tracked files.
- `events.lock` does not protect against arbitrary Git checkout/merge/stash/reset
  or human edits.
- Main can still become dirty from fgOS work-state activity.
```

### Target unit

```text
Gap:

- Hot durable history still modifies Git-tracked files.
- `events.lock` does not protect against arbitrary Git checkout/merge/stash/reset
  or human edits.
- Main can still become dirty from fgOS work-state activity.
```

### Unified diff

```diff
No text difference.
```

## claim_23a0c7979ae73ea30c2532171f40fd25

Source: docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-26

Target: docs/platform/component-boundary.md#unheaded-block-40

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | contract |
| disposition | move |
| rationale | Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-26 (lines 149–149) into docs/platform/component-boundary.md#unheaded-block-40 (lines 246–246), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/component-boundary.md |
| targetAnchor | unheaded-block-40 |

### Source unit

```text
The collaboration shape should stay:
```

### Target unit

```text
The collaboration shape should stay:
```

### Unified diff

```diff
No text difference.
```

## claim_74dc57b33389e42e7b542f96fa4d108c

Source: docs/architect/architecture-intent.md#unheaded-block-39

Target: docs/platform/system-architecture/architecture/architecture-intent.md#unheaded-block-41

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | architecture |
| disposition | move |
| rationale | Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/architecture-intent.md#unheaded-block-39 (lines 269–275) into docs/platform/system-architecture/architecture/architecture-intent.md#unheaded-block-41 (lines 292–298), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/system-architecture/architecture/architecture-intent.md |
| targetAnchor | unheaded-block-41 |

### Source unit

```text
What it can do:

- run independent Reviewer and Red-Team passes;
- keep Reviewer and Red-Team isolated before first verdict;
- allow driver-authorized clarification, consult, or recheck rounds;
- preserve failed actors, dissent, unsupported claims, and evidence refs;
- prove all extra rounds are visible in the session ledger.
```

### Target unit

```text
What it can do:

- run independent Reviewer and Red-Team passes;
- keep Reviewer and Red-Team isolated before first verdict;
- allow driver-authorized clarification, consult, or recheck rounds;
- preserve failed actors, dissent, unsupported claims, and evidence refs;
- prove all extra rounds are visible in the session ledger.
```

### Unified diff

```diff
No text difference.
```

## claim_9c67e3c640ab8e82f2df2e3bf56d29af

Source: docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-87

Target: docs/platform/component-boundary.md#unheaded-block-101

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | contract |
| disposition | move |
| rationale | Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-87 (lines 679–682) into docs/platform/component-boundary.md#unheaded-block-101 (lines 776–779), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/component-boundary.md |
| targetAnchor | unheaded-block-101 |

### Source unit

```text
The Team Cognition Engine is the reusable runtime module. Protocol packages are
replaceable recipes/configuration that the engine may use. Agent-led planning
can use the same engine without selecting a predeclared package, as long as the
resulting execution contracts are validated by the foundation.
```

### Target unit

```text
The Team Cognition Engine is the reusable runtime module. Protocol packages are
replaceable recipes/configuration that the engine may use. Agent-led planning
can use the same engine without selecting a predeclared package, as long as the
resulting execution contracts are validated by the foundation.
```

### Unified diff

```diff
No text difference.
```

## claim_c8652d5b2fbfea7c00638af00cfb4629

Source: docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-127

Target: docs/platform/component-boundary.md#unheaded-block-141

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | contract |
| disposition | move |
| rationale | Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-127 (lines 930–937) into docs/platform/component-boundary.md#unheaded-block-141 (lines 1027–1034), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/component-boundary.md |
| targetAnchor | unheaded-block-141 |

### Source unit

```text
Existing code under `src/runner/worktree.mjs`, `src/runner/merge.mjs`,
   `src/verbs/merge/approve.mjs`, `src/state/graph-harness.mjs`,
   `src/state/drift-status.mjs`, `src/state/cleanup-harness.mjs`,
   `src/runner/iron-law-gate.mjs`, and repository adapters owns worktree,
   branch, merge readiness, drift, cleanup, verification, and approval gates.
   Architecturally this should be discussed as a subcomponent of Coding Domain
   Core, not as a generic foundation component. Its location under `runner`,
   `state`, and `verbs` should not decide ownership by itself.
```

### Target unit

```text
Existing code under `src/runner/worktree.mjs`, `src/runner/merge.mjs`,
   `src/verbs/merge/approve.mjs`, `src/state/graph-harness.mjs`,
   `src/state/drift-status.mjs`, `src/state/cleanup-harness.mjs`,
   `src/runner/iron-law-gate.mjs`, and repository adapters owns worktree,
   branch, merge readiness, drift, cleanup, verification, and approval gates.
   Architecturally this should be discussed as a subcomponent of Coding Domain
   Core, not as a generic foundation component. Its location under `runner`,
   `state`, and `verbs` should not decide ownership by itself.
```

### Unified diff

```diff
No text difference.
```

## claim_994d4c5378ce61e03cd8ccd47bf199e2

Source: docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-44

Target: docs/platform/component-boundary.md#unheaded-block-58

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | contract |
| disposition | move |
| rationale | Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-44 (lines 307–313) into docs/platform/component-boundary.md#unheaded-block-58 (lines 404–410), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/component-boundary.md |
| targetAnchor | unheaded-block-58 |

### Source unit

```text
1. `assignment-run-runresult.md` is a chain contract, not a single-component
   ownership contract. Assignment, Run, and RunResult should remain separate
   authority boundaries even if they are documented together.
2. `flow-definition.md` carries policy and evidence requirement fields, but
   those are declared requirements. Effective provider/model resolution belongs
   to Dispatch And Execution, and confidence computation belongs to the Run
   Result Evaluator.
```

### Target unit

```text
1. `assignment-run-runresult.md` is a chain contract, not a single-component
   ownership contract. Assignment, Run, and RunResult should remain separate
   authority boundaries even if they are documented together.
2. `flow-definition.md` carries policy and evidence requirement fields, but
   those are declared requirements. Effective provider/model resolution belongs
   to Dispatch And Execution, and confidence computation belongs to the Run
   Result Evaluator.
```

### Unified diff

```diff
No text difference.
```

## claim_9d8a8f3ba46e861451c6a746db376790

Source: docs/architect/system-vision-trong-mem-ngoai-cung.md#unheaded-block-18

Target: docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md#unheaded-block-20

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | architecture |
| disposition | move |
| rationale | Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/system-vision-trong-mem-ngoai-cung.md#unheaded-block-18 (lines 82–89) into docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md#unheaded-block-20 (lines 105–112), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md |
| targetAnchor | unheaded-block-20 |

### Source unit

```text
- skill flow;
- prose handoff;
- domain doctrine;
- role posture;
- judgment heuristics;
- collaboration style;
- recovery playbook;
- human-facing explanation.
```

### Target unit

```text

- prose handoff;
- domain doctrine;
- role posture;
- judgment heuristics;
- collaboration style;
- recovery playbook;
- human-facing explanation.
```

### Unified diff

```diff
--- "docs/architect/system-vision-trong-mem-ngoai-cung.md#unheaded-block-18"
+++ "docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md#unheaded-block-20"
@@ -1,4 +1,4 @@
-- skill flow;
+
 - prose handoff;
 - domain doctrine;
 - role posture;
```

## claim_3f4fb302f4a50b7b72531c2706bef9d6

Source: docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-28

Target: docs/platform/component-boundary.md#unheaded-block-228

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | contract |
| disposition | move |
| rationale | Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-28 (lines 154–154) into docs/platform/component-boundary.md#unheaded-block-228 (lines 1542–1542), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/component-boundary.md |
| targetAnchor | unheaded-block-228 |

### Source unit

```text
`packages/herdr-core`
```

### Target unit

```text
`packages/herdr-core`
```

### Unified diff

```diff
No text difference.
```

## claim_e4091fccbb828619b627aa2ab32246d7

Source: docs/architect/workspace-topology.md#unheaded-block-12

Target: docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-14

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | architecture |
| disposition | move |
| rationale | Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-12 (lines 59–59) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-14 (lines 82–82), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/system-architecture/architecture/workspace-topology.md |
| targetAnchor | unheaded-block-14 |

### Source unit

```text
Topology has three scope identities and one runtime content identity.
```

### Target unit

```text
Topology has three scope identities and one runtime content identity.
```

### Unified diff

```diff
No text difference.
```

## claim_4db0f0232e4a42a7fdcb2f51d2b55633

Source: docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-115

Target: docs/platform/component-boundary.md#unheaded-block-129

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | contract |
| disposition | move |
| rationale | Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-115 (lines 877–879) into docs/platform/component-boundary.md#unheaded-block-129 (lines 974–976), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/component-boundary.md |
| targetAnchor | unheaded-block-129 |

### Source unit

```text
The practical requirement is simple: coordination runtime, FlowDefinition,
dispatch, RunResult, Work lifecycle, and coding-domain authority stay separate
even when a single feature path exercises all of them.
```

### Target unit

```text
The practical requirement is simple: coordination runtime, FlowDefinition,
dispatch, RunResult, Work lifecycle, and coding-domain authority stay separate
even when a single feature path exercises all of them.
```

### Unified diff

```diff
No text difference.
```

## claim_389cbb0ed16d03193f95b1050307bcf6

Source: docs/architect/system-vision-trong-mem-ngoai-cung.md#unheaded-block-16

Target: docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md#unheaded-block-18

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | architecture |
| disposition | move |
| rationale | Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/system-vision-trong-mem-ngoai-cung.md#unheaded-block-16 (lines 73–78) into docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md#unheaded-block-18 (lines 96–101), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md |
| targetAnchor | unheaded-block-18 |

### Source unit

```text
- identity and root ownership;
- state classes and event truth;
- command boundaries;
- capability grants and refusals;
- evidence and proof rules;
- compatibility, rollback, and repair behavior.
```

### Target unit

```text
- identity and root ownership;
- state classes and event truth;
- command boundaries;
- capability grants and refusals;
- evidence and proof rules;
- compatibility, rollback, and repair behavior.
```

### Unified diff

```diff
No text difference.
```

## claim_2d4c69a3c963e28c172200df0c641de4

Source: docs/architecture-map.md#unheaded-block-76

Target: docs/platform/architecture-map.md#unheaded-block-90

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | contract |
| disposition | move |
| rationale | Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-76 (lines 674–680) into docs/platform/architecture-map.md#unheaded-block-90 (lines 751–757), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/architecture-map.md |
| targetAnchor | unheaded-block-90 |

### Source unit

```text
- **0010 không bị supersede** — 0015 chỉ đổi cách viết định danh của registry
  đã khoá ở 0010, không đổi cấu trúc hay nội dung registry.
- **Không đổi schema, không đổi code** — đây là rename thuần văn bản trong
  tài liệu; không có contract nào đổi hành vi.
- **Nhất quán với các hệ đã đổi trước đó** (`TSK<hash>` cho work id, `ADR<n>`
  cho decision record, `RUL<n>` cho business rule) — hoàn tất mảnh #6 trong
  bảng audit `id-systems-audit.md`.
```

### Target unit

```text
- **0010 không bị supersede** — 0015 chỉ đổi cách viết định danh của registry
  đã khoá ở 0010, không đổi cấu trúc hay nội dung registry.
- **Không đổi schema, không đổi code** — đây là rename thuần văn bản trong
  tài liệu; không có contract nào đổi hành vi.
- **Nhất quán với các hệ đã đổi trước đó** (`TSK<hash>` cho work id, `ADR<n>`
  cho decision record, `RUL<n>` cho business rule) — hoàn tất mảnh #6 trong
  bảng audit `id-systems-audit.md`.
```

### Unified diff

```diff
No text difference.
```

## claim_6c76d0fab04720e389309a5015571138

Source: docs/architect/workspace-topology-audit.md#unheaded-block-16

Target: docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-18

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | architecture |
| disposition | move |
| rationale | Weak-exact: target digest repeats; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-16 (lines 95–95) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-18 (lines 118–118), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/system-architecture/architecture/workspace-topology-audit.md |
| targetAnchor | unheaded-block-18 |

### Source unit

```text
Architecture implication:
```

### Target unit

```text
Architecture implication:
```

### Unified diff

```diff
No text difference.
```

## claim_d9e42b44fb1228690b7ae142d10d9f6c

Source: docs/architect/architecture-intent.md#20-evidence-pointers

Target: docs/platform/system-architecture/architecture/architecture-intent.md#20-evidence-pointers

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | architecture |
| disposition | move |
| rationale | Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/architecture-intent.md#20-evidence-pointers (lines 759–759) into docs/platform/system-architecture/architecture/architecture-intent.md#20-evidence-pointers (lines 782–782), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/system-architecture/architecture/architecture-intent.md |
| targetAnchor | 20-evidence-pointers |

### Source unit

```text
## 20. Evidence Pointers

- Step 08 plan:
  `plans/260901-1542-step08-standalone-coordination/plan.md`
- Isolation-heavy fixture:
  `core/coordination-protocols/group-cognition-framework.yaml`
- P05.2 live null result and infrastructure failures:
  `docs/architect/agent-coordination/verification/step-08-standalone-coordination/P05.2.md`
- CoordinationSession contract:
  `docs/architect/agent-coordination/contracts/coordination-session.md`
- FlowDefinition contract:
  `docs/architect/agent-coordination/contracts/flow-definition.md`
- Master-coordinator playbook:
  `docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md`
- Hardened runtime primitives:
  `src/runner/coordination/session-engine.mjs`,
  `src/runner/coordination/store.mjs`
```

### Target unit

```text
## 20. Evidence Pointers

- Step 08 plan:
  `plans/260901-1542-step08-standalone-coordination/plan.md`
- Isolation-heavy fixture:
  `core/coordination-protocols/group-cognition-framework.yaml`
- P05.2 live null result and infrastructure failures:
  `docs/architect/agent-coordination/verification/step-08-standalone-coordination/P05.2.md`
- CoordinationSession contract:
  `docs/architect/agent-coordination/contracts/coordination-session.md`
- FlowDefinition contract:
  `docs/architect/agent-coordination/contracts/flow-definition.md`
- Master-coordinator playbook:
  `docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md`
- Hardened runtime primitives:
  `src/runner/coordination/session-engine.mjs`,
  `src/runner/coordination/store.mjs`
```

### Unified diff

```diff
No text difference.
```

## claim_a9aa6844124a3f743295244f65369427

Source: docs/architect/architecture-intent.md#unheaded-block-52

Target: docs/platform/system-architecture/architecture/architecture-intent.md#unheaded-block-54

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | architecture |
| disposition | move |
| rationale | Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/architecture-intent.md#unheaded-block-52 (lines 334–340) into docs/platform/system-architecture/architecture/architecture-intent.md#unheaded-block-54 (lines 357–363), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/system-architecture/architecture/architecture-intent.md |
| targetAnchor | unheaded-block-54 |

### Source unit

```text
Possible split:

| Primitive | Use |
|---|---|
| `requestRound` | Actor records that another round is needed. No dispatch authority. |
| `authorizeDeclaredOperation` | Driver authorizes one already-declared optional operation. |
| `addSessionEdge` | Later-only primitive for a genuinely unknown specialist consult edge. |
```

### Target unit

```text
Possible split:

| Primitive | Use |
|---|---|
| `requestRound` | Actor records that another round is needed. No dispatch authority. |
| `authorizeDeclaredOperation` | Driver authorizes one already-declared optional operation. |
| `addSessionEdge` | Later-only primitive for a genuinely unknown specialist consult edge. |
```

### Unified diff

```diff
No text difference.
```

## claim_11d2f816f621c7c9cffad344a3356475

Source: docs/architect/system-vision-trong-mem-ngoai-cung.md#unheaded-block-10

Target: docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md#unheaded-block-12

### Proposed decision

| Field | Value |
|---|---|
| authoredBy | codex-session:37@2026-10-15 |
| claimKind | architecture |
| disposition | move |
| rationale | Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/system-vision-trong-mem-ngoai-cung.md#unheaded-block-10 (lines 47–52) into docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md#unheaded-block-12 (lines 70–75), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending. |
| targetOwner | docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md |
| targetAnchor | unheaded-block-12 |

### Source unit

```text
During the group-thinking work, implementation pressure pulled attention toward
harnesses, schemas, tests, and fixtures. Those were necessary: without them the
system cannot be trusted. But too much attention on harness alone made the
Master Coordination shape hard to deploy as a living operating pattern. The
system could become correct but stiff: safe mechanics with too little soul,
prose, and skill surface for agents to actually coordinate well.
```

### Target unit

```text
During the group-thinking work, implementation pressure pulled attention toward
harnesses, schemas, tests, and fixtures. Those were necessary: without them the
system cannot be trusted. But too much attention on harness alone made the
Master Coordination shape hard to deploy as a living operating pattern. The
system could become correct but stiff: safe mechanics with too little soul,
prose, and skill surface for agents to actually coordinate well.
```

### Unified diff

```diff
No text difference.
```
