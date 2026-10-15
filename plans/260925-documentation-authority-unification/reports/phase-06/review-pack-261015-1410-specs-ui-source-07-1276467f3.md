# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json
Shard SHA256: 3d2bbc942e416345213d8b225e43ee69a2f63149f6b8768e23017f5dc829ed68
Source: docs/specs/confinement-authority.md
Part 7/7; entries: **5**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 4/4 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_c491a724bb730522215633d79a66e5b3"
    ],
    "Weak-exact": [
      "claim_3be68f87d3d60c946927441f13933a84",
      "claim_06e68651628b7a731b974ec5c34c9743",
      "claim_dbbee9d940a2d595936e12ba6781f684",
      "claim_1d1eb2ce98dcf1855678b2cf86c2ee67"
    ],
    "Judgment": []
  },
  "unequalDigestPairs": [],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": []
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_3be68f87d3d60c946927441f13933a84

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-148; lines 1380–1380; ancestry ["Spec: Agent Confinement Authority","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)","13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên"].
Target: docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#unheaded-block-7; ancestry ["Added in candidate: confinement authority decisions","12. Quyết định của proposal","13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên"].
Source digest: 05a668d4bfd01094c18b54e82e2ea42408957cb1725c27a31b8173c35b8a0b33
Target digest: 05a668d4bfd01094c18b54e82e2ea42408957cb1725c27a31b8173c35b8a0b33
Shown source SHA256: 05a668d4bfd01094c18b54e82e2ea42408957cb1725c27a31b8173c35b8a0b33
Shown target SHA256: 05a668d4bfd01094c18b54e82e2ea42408957cb1725c27a31b8173c35b8a0b33

### Complete proposed decision

```json
{
  "claimId": "claim_3be68f87d3d60c946927441f13933a84",
  "sourceUnitDigest": "05a668d4bfd01094c18b54e82e2ea42408957cb1725c27a31b8173c35b8a0b33",
  "targetOwner": "docs/platform/agent-confinement/decisions/confinement-authority-decisions.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-148 (source lines 1380-1380) is carried at docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#unheaded-block-7 (candidate lines 49-49). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "05a668d4bfd01094c18b54e82e2ea42408957cb1725c27a31b8173c35b8a0b33",
  "targetAncestry": [
    "Added in candidate: confinement authority decisions",
    "12. Quyết định của proposal",
    "13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên"
  ]
}
```

### Full source shown text

```text
**Chưa chứng minh:** sự kiện nào khiến thread trong sự cố chạy lại dưới `workspace-write` (giả thuyết mạnh nhất: daemon-updater thay 0.160.1 bằng 0.162.1 giữa run, chính việc thay thế làm ngắt turn, và thread được mở lại không mang `-s`). Tắt daemon loại bỏ cả nhánh này; ghi `sandbox_mode = "danger-full-access"` vào `config.toml` của private home là lớp phòng thủ thứ hai chưa làm (file đó do bước gieo trust ghi, và driver bwrap không được rẽ nhánh theo provider). Đường `codex exec` (`codex-cli-bwrap`) không dùng daemon nên không đổi.
```

### Full target shown text

```text
**Chưa chứng minh:** sự kiện nào khiến thread trong sự cố chạy lại dưới `workspace-write` (giả thuyết mạnh nhất: daemon-updater thay 0.160.1 bằng 0.162.1 giữa run, chính việc thay thế làm ngắt turn, và thread được mở lại không mang `-s`). Tắt daemon loại bỏ cả nhánh này; ghi `sandbox_mode = "danger-full-access"` vào `config.toml` của private home là lớp phòng thủ thứ hai chưa làm (file đó do bước gieo trust ghi, và driver bwrap không được rẽ nhánh theo provider). Đường `codex exec` (`codex-cli-bwrap`) không dùng daemon nên không đổi.
```

## claim_06e68651628b7a731b974ec5c34c9743

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#tồn-đọng-mở-open-deferred-items; lines 1382–1382; ancestry ["Spec: Agent Confinement Authority","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"].
Target: docs/platform/agent-confinement/spec.md#tồn-đọng-mở-open-deferred-items; ancestry ["Spec: Agent Confinement Authority","Added in candidate: Current settled facts and deferred items"].
Source digest: 9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f
Target digest: 9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f
Shown source SHA256: 69fdd701be9c0080d20007f65a99e045677d41ca341ff178b37dfe603fd82691
Shown target SHA256: 69fdd701be9c0080d20007f65a99e045677d41ca341ff178b37dfe603fd82691

### Complete proposed decision

```json
{
  "claimId": "claim_06e68651628b7a731b974ec5c34c9743",
  "sourceUnitDigest": "9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "tồn-đọng-mở-open-deferred-items",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#tồn-đọng-mở-open-deferred-items (source lines 1382-1382) is carried at docs/platform/agent-confinement/spec.md#tồn-đọng-mở-open-deferred-items (candidate lines 582-582). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "Added in candidate: Current settled facts and deferred items"
  ]
}
```

### Full source shown text

```text
### Tồn đọng mở (Open Deferred Items):

- **P04 M-3 (Inherited unconfined anchor overclaim):** Khi kế thừa anchor từ capability cha, một capability không khai báo confinement nhận attestation `unconfined` (explicit opt-out) thay vì `unknown`/`omitted`. Cần phân biệt rõ cờ thừa kế trong phase tiếp theo.
- **P03 NEW-1b/NEW-1c & P06 M2 (Thin attestation body):** Thân attestation của `enforced` chưa so sánh toàn diện invocation chạy thực tế với plan đã prepare; mảng `channels[]` vẫn mang chi tiết observe-mode.
- **P03 R4 (Reaper caller):** Hàm dọn dẹp thư mục tạm thành công chưa có caller định kỳ trong production.
- **Strict Mode Default:** `runner.confinement.strict` tiếp tục mặc định là `false`, giữ an toàn tương thích cho môi trường phát triển và chờ hoàn thiện các tồn đọng trên trước khi kích hoạt mặc định. Operator có thể bật `strict: true` khi đã thoả mãn `fgos doctor`.
```

### Full target shown text

```text
### Tồn đọng mở (Open Deferred Items):

- **P04 M-3 (Inherited unconfined anchor overclaim):** Khi kế thừa anchor từ capability cha, một capability không khai báo confinement nhận attestation `unconfined` (explicit opt-out) thay vì `unknown`/`omitted`. Cần phân biệt rõ cờ thừa kế trong phase tiếp theo.
- **P03 NEW-1b/NEW-1c & P06 M2 (Thin attestation body):** Thân attestation của `enforced` chưa so sánh toàn diện invocation chạy thực tế với plan đã prepare; mảng `channels[]` vẫn mang chi tiết observe-mode.
- **P03 R4 (Reaper caller):** Hàm dọn dẹp thư mục tạm thành công chưa có caller định kỳ trong production.
- **Strict Mode Default:** `runner.confinement.strict` tiếp tục mặc định là `false`, giữ an toàn tương thích cho môi trường phát triển và chờ hoàn thiện các tồn đọng trên trước khi kích hoạt mặc định. Operator có thể bật `strict: true` khi đã thoả mãn `fgos doctor`.
```

## claim_dbbee9d940a2d595936e12ba6781f684

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-149; lines 1384–1387; ancestry ["Spec: Agent Confinement Authority","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)","Tồn đọng mở (Open Deferred Items):"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-69; ancestry ["Spec: Agent Confinement Authority","Added in candidate: Current settled facts and deferred items","Tồn đọng mở (Open Deferred Items):"].
Source digest: 63bf6e3f79aef39f4af16bbcdeb237dff250a8f2aefbe0e5b18249eab50649e1
Target digest: 63bf6e3f79aef39f4af16bbcdeb237dff250a8f2aefbe0e5b18249eab50649e1
Shown source SHA256: 63bf6e3f79aef39f4af16bbcdeb237dff250a8f2aefbe0e5b18249eab50649e1
Shown target SHA256: 63bf6e3f79aef39f4af16bbcdeb237dff250a8f2aefbe0e5b18249eab50649e1

### Complete proposed decision

```json
{
  "claimId": "claim_dbbee9d940a2d595936e12ba6781f684",
  "sourceUnitDigest": "63bf6e3f79aef39f4af16bbcdeb237dff250a8f2aefbe0e5b18249eab50649e1",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-69",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-149 (source lines 1384-1387) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-69 (candidate lines 584-587). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "63bf6e3f79aef39f4af16bbcdeb237dff250a8f2aefbe0e5b18249eab50649e1",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "Added in candidate: Current settled facts and deferred items",
    "Tồn đọng mở (Open Deferred Items):"
  ]
}
```

### Full source shown text

```text
- **P04 M-3 (Inherited unconfined anchor overclaim):** Khi kế thừa anchor từ capability cha, một capability không khai báo confinement nhận attestation `unconfined` (explicit opt-out) thay vì `unknown`/`omitted`. Cần phân biệt rõ cờ thừa kế trong phase tiếp theo.
- **P03 NEW-1b/NEW-1c & P06 M2 (Thin attestation body):** Thân attestation của `enforced` chưa so sánh toàn diện invocation chạy thực tế với plan đã prepare; mảng `channels[]` vẫn mang chi tiết observe-mode.
- **P03 R4 (Reaper caller):** Hàm dọn dẹp thư mục tạm thành công chưa có caller định kỳ trong production.
- **Strict Mode Default:** `runner.confinement.strict` tiếp tục mặc định là `false`, giữ an toàn tương thích cho môi trường phát triển và chờ hoàn thiện các tồn đọng trên trước khi kích hoạt mặc định. Operator có thể bật `strict: true` khi đã thoả mãn `fgos doctor`.
```

### Full target shown text

```text
- **P04 M-3 (Inherited unconfined anchor overclaim):** Khi kế thừa anchor từ capability cha, một capability không khai báo confinement nhận attestation `unconfined` (explicit opt-out) thay vì `unknown`/`omitted`. Cần phân biệt rõ cờ thừa kế trong phase tiếp theo.
- **P03 NEW-1b/NEW-1c & P06 M2 (Thin attestation body):** Thân attestation của `enforced` chưa so sánh toàn diện invocation chạy thực tế với plan đã prepare; mảng `channels[]` vẫn mang chi tiết observe-mode.
- **P03 R4 (Reaper caller):** Hàm dọn dẹp thư mục tạm thành công chưa có caller định kỳ trong production.
- **Strict Mode Default:** `runner.confinement.strict` tiếp tục mặc định là `false`, giữ an toàn tương thích cho môi trường phát triển và chờ hoàn thiện các tồn đọng trên trước khi kích hoạt mặc định. Operator có thể bật `strict: true` khi đã thoả mãn `fgos doctor`.
```

## claim_1d1eb2ce98dcf1855678b2cf86c2ee67

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#14-pointers-hiện-tại; lines 1389–1389; ancestry ["Spec: Agent Confinement Authority"].
Target: docs/platform/agent-confinement/spec.md#14-pointers-hiện-tại; ancestry ["Spec: Agent Confinement Authority"].
Source digest: 68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2
Target digest: 68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2
Shown source SHA256: cf9b793e4495fecf53a177aa00d635fc42cd485cc2a7c6c8ec2f93be81b4c066
Shown target SHA256: cf9b793e4495fecf53a177aa00d635fc42cd485cc2a7c6c8ec2f93be81b4c066

### Complete proposed decision

```json
{
  "claimId": "claim_1d1eb2ce98dcf1855678b2cf86c2ee67",
  "sourceUnitDigest": "68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "14-pointers-hiện-tại",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#14-pointers-hiện-tại (source lines 1389-1389) is carried at docs/platform/agent-confinement/spec.md#14-pointers-hiện-tại (candidate lines 589-589). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2",
  "targetAncestry": [
    "Spec: Agent Confinement Authority"
  ]
}
```

### Full source shown text

```text
## 14. Pointers hiện tại

- `src/runner/dispatch/cli.mjs`: hai seam trước adapter; `runDir` có tại đây.
- `src/runner/dispatch/transport.mjs`: `resolveExecutorCommand`, adapter registry
  và `cliSpawnAdapter` hiện bỏ `confinement`.
- `src/runner/dispatch/resolve.mjs`: resolve executor và fallback path.
- `src/runner/dispatch/config.mjs`: validation của shape confinement cũ.
- `src/runner/dispatch/herdr-round.mjs`: enforcement session/home hiện tại.
- `src/setup/registrations.mjs`: doctor checks liên quan.
- `.fgos/config.json`: các invocation bwrap (cli-spawn và herdr-spawn) khai `confinement.backend`; invocation herdr của codex/agy/pi khai thêm `resourceBindings` private-home (§13.1).
- `docs/routing-handoff-contract.md`: worktree containment không phải sandbox.
```

### Full target shown text

```text
## 14. Pointers hiện tại

- `src/runner/dispatch/cli.mjs`: hai seam trước adapter; `runDir` có tại đây.
- `src/runner/dispatch/transport.mjs`: `resolveExecutorCommand`, adapter registry
  và `cliSpawnAdapter` hiện bỏ `confinement`.
- `src/runner/dispatch/resolve.mjs`: resolve executor và fallback path.
- `src/runner/dispatch/config.mjs`: validation của shape confinement cũ.
- `src/runner/dispatch/herdr-round.mjs`: enforcement session/home hiện tại.
- `src/setup/registrations.mjs`: doctor checks liên quan.
- `.fgos/config.json`: các invocation bwrap (cli-spawn và herdr-spawn) khai `confinement.backend`; invocation herdr của codex/agy/pi khai thêm `resourceBindings` private-home (§13.1).
- `docs/routing-handoff-contract.md`: worktree containment không phải sandbox.
```

## claim_c491a724bb730522215633d79a66e5b3

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-150; lines 1391–1399; ancestry ["Spec: Agent Confinement Authority","14. Pointers hiện tại"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-70; ancestry ["Spec: Agent Confinement Authority","14. Pointers hiện tại"].
Source digest: b412674cbe8f64e89a752ba65cf9752f00b362a19455bcded73bd2a283d4ab16
Target digest: b412674cbe8f64e89a752ba65cf9752f00b362a19455bcded73bd2a283d4ab16
Shown source SHA256: b412674cbe8f64e89a752ba65cf9752f00b362a19455bcded73bd2a283d4ab16
Shown target SHA256: b412674cbe8f64e89a752ba65cf9752f00b362a19455bcded73bd2a283d4ab16

### Complete proposed decision

```json
{
  "claimId": "claim_c491a724bb730522215633d79a66e5b3",
  "sourceUnitDigest": "b412674cbe8f64e89a752ba65cf9752f00b362a19455bcded73bd2a283d4ab16",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-70",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-150 (source lines 1391-1399) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-70 (candidate lines 591-599). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b412674cbe8f64e89a752ba65cf9752f00b362a19455bcded73bd2a283d4ab16",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "14. Pointers hiện tại"
  ]
}
```

### Full source shown text

```text
- `src/runner/dispatch/cli.mjs`: hai seam trước adapter; `runDir` có tại đây.
- `src/runner/dispatch/transport.mjs`: `resolveExecutorCommand`, adapter registry
  và `cliSpawnAdapter` hiện bỏ `confinement`.
- `src/runner/dispatch/resolve.mjs`: resolve executor và fallback path.
- `src/runner/dispatch/config.mjs`: validation của shape confinement cũ.
- `src/runner/dispatch/herdr-round.mjs`: enforcement session/home hiện tại.
- `src/setup/registrations.mjs`: doctor checks liên quan.
- `.fgos/config.json`: các invocation bwrap (cli-spawn và herdr-spawn) khai `confinement.backend`; invocation herdr của codex/agy/pi khai thêm `resourceBindings` private-home (§13.1).
- `docs/routing-handoff-contract.md`: worktree containment không phải sandbox.
```

### Full target shown text

```text
- `src/runner/dispatch/cli.mjs`: hai seam trước adapter; `runDir` có tại đây.
- `src/runner/dispatch/transport.mjs`: `resolveExecutorCommand`, adapter registry
  và `cliSpawnAdapter` hiện bỏ `confinement`.
- `src/runner/dispatch/resolve.mjs`: resolve executor và fallback path.
- `src/runner/dispatch/config.mjs`: validation của shape confinement cũ.
- `src/runner/dispatch/herdr-round.mjs`: enforcement session/home hiện tại.
- `src/setup/registrations.mjs`: doctor checks liên quan.
- `.fgos/config.json`: các invocation bwrap (cli-spawn và herdr-spawn) khai `confinement.backend`; invocation herdr của codex/agy/pi khai thêm `resourceBindings` private-home (§13.1).
- `docs/routing-handoff-contract.md`: worktree containment không phải sandbox.
```
