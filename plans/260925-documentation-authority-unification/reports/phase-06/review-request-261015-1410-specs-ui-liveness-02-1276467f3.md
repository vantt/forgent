# Independent section liveness classification

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792047735364-5c1a0eb5@2026-10-15
Entries: **60**. Separate non-source verdict channel; no source approval, truth approval, retirement, promotion or cutover follows. No reviewer seed or verdict supplied.

Review each of the 224 section classifications across these four requests. Validate full shown text, section range/SHA256, direct and concept consumers, implementation paths and subject hits against the pinned tree; lexical absence does not prove retirement. No source subject was adjudicated retired. Explicitly inspect confinement §13.1 mixed current recipe/history, §13.2 remaining spec, §13.3 decisions and Observe §6. History placement is distinct from retired-subject and current-truth judgments. Known stale current sentences remain queued for A28. Read step8-liveness.md/json and step8-evidence.md.

Return Reviewer, Author session(s), Review mode: ordinary, request/content pin and one row per entry. Use the entryId in Claim; Source digest binds JSON evidence for that entry (given below); Target digest is none for this separate accounting channel. Each note must describe the actual check and its limits. This table does not apply source verdicts through applyReviewVerdicts.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## liveness-02-010

Source digest (evidence JSON): bd85a75f86a7638fb1656190ba20777627219c2a3c7dd754c9892dc6fd673cd2
Target digest: none

```json
{
  "entryId": "liveness-02-010",
  "source": "docs/specs/decision-citation-drift.md",
  "sourceBlob": "ee00ac178d1aa7aea151c08877222ee228923853",
  "section": {
    "heading": "Open Gaps",
    "anchor": "open-gaps",
    "startLine": 89,
    "endLine": 97,
    "sha256": "c3aefb95c8ed63597cfc37d29f19a5a2963c285a2225e72626438bcb7f9810c2",
    "classification": "current-by-default",
    "directReferenceCount": 5,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Open Gaps\n\n- Not wired into any automated gate: neither an npm script, `.bee/config.json`\n  `commands.verify`, nor a CI workflow runs this check today. It must be\n  invoked manually, so citation drift can persist undetected between manual\n  runs. Answerable by whoever next wires a backlog/spec consistency gate.\n- No auto-fix: a flagged line's acknowledgement of the superseding id must be\n  added by hand; the check only ever reports.\n",
  "directReferences": [
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5911,
      "text": "    \"docs/specs/decision-citation-drift.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 63,
      "text": "| Decision citation drift | legacy-current | maintained-authority | `docs/specs/decision-citation-drift.md` | `scripts/check-decision-citation-drift.mjs` | Spec owns citation drift detection invariants and baseline ratchet rules. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 21,
      "text": "- decision-citation-drift — quét backlog/spec tìm dòng còn trích một quyết định đã bị supersede mà không nhắc quyết định thay thế (chỉ phát hiện, không tự sửa); spec: decision-citation-drift.md"
    },
    {
      "path": "docs/specs/work-state.md",
      "line": 1361,
      "text": "- Test: `npm test` (`node --test 'test/**/*.test.mjs'`); e2e tại `test/e2e/rebuild-determinism.test.mjs` + `test/e2e/runner-loop.test.mjs` — bao gồm các kịch bản của hai stage đầu chuỗi, các kịch bản của stage lập-kế-hoạch (pass-through, chia-con-chặn-frontier, cần-người), VÀ 1 kịch bản S2-pull (submit → pass-through 2 stage → `take` người → một `fgos-runner --once` song song không giẫm claim người → người `return` xanh → `awaiting-approval`) chạy qua binary thật; round-trip cổng chờ-người tại `test/state/awaiting.test.mjs` + e2e CLI tại `test/cli/fgos.test.mjs`; unit tại `test/intake/{classify,discovery,plan}.test.mjs` + `test/state/{envelope,stage,store,frontier,work,replay}.test.mjs`; entropy-trend tại `test/report/entropy.test.mjs`. LƯU Ý phạm vi: suite KHÔNG đọc chính tài liệu này — không có test nào quét nội dung `docs/specs/*.md`, nên `npm test` xanh KHÔNG phải bằng chứng spec còn đúng với code. Bộ dò trích-dẫn-quyết-định-đã-lỗi-thời (`scripts/check-decision-citation-drift.mjs`) có quét `docs/specs/`, nhưng là script chạy tay, chỉ phát hiện, KHÔNG nối vào `npm test` (per `docs/specs/decision-citation-drift.md`)"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 25,
      "text": "- `scripts/check-decision-citation-drift.mjs` + `test/scripts/check-decision-citation-drift.test.mjs` — quét `docs/backlog.md` + `docs/specs/*.md` tìm dòng còn trích một quyết định đã bị supersede mà không nhắc quyết định thay thế trên cùng dòng (STR72 CoS clause 2, PBI p-2d71dfc3); chỉ phát hiện, không tự sửa; spec: docs/specs/decision-citation-drift.md"
    }
  ],
  "sourceSHA256": "4774f723f8d3ab5e4a753cd2b74919f27c62c2c7857644606337def5bd922cff"
}
```


## liveness-02-011

Source digest (evidence JSON): c3eb1eb77fe5db911e5b0b81a0c4f71d96b3913e2d2f7b3839f6c5d8790078d4
Target digest: none

```json
{
  "entryId": "liveness-02-011",
  "source": "docs/specs/decision-citation-drift.md",
  "sourceBlob": "ee00ac178d1aa7aea151c08877222ee228923853",
  "section": {
    "heading": "Pointers (implementation)",
    "anchor": "pointers-implementation",
    "startLine": 98,
    "endLine": 116,
    "sha256": "72d87618824bd71637a6ccb42748650c71da329ac9664a9d4d3e7b0028a0c45f",
    "classification": "current-by-default",
    "directReferenceCount": 5,
    "implementationPaths": [
      "scripts/check-decision-citation-drift.mjs",
      "test/scripts/check-decision-citation-drift.test.mjs",
      "src/report/frontmatter.mjs",
      "scripts/check-decision-supersession.mjs"
    ],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Pointers (implementation)\n\n- `scripts/check-decision-citation-drift.mjs` — pure functions\n  (`extractCitedIds`, `findCitationDriftFindings`) plus a thin CLI\n  (`loadSupersededById`, `loadSourceFiles`, `runCli`).\n- `test/scripts/check-decision-citation-drift.test.mjs` — 9 tests covering\n  the rules and edge cases above.\n- `src/report/frontmatter.mjs` — reused to read a decision record's\n  `superseded_by` front-matter field.\n- `scripts/check-decision-supersession.mjs` — the sibling check this one\n  mirrors in structure; it checks a decision record's own internal\n  backward-pointer instead of backlog/spec citations (a different area).\n  **Retired against the real repo (tsk-1lv-4/review-fix F9):** the\n  `docs/decisions/NNNN-*.md` + `0000-index.md` pointer-pair format it\n  validates was retired for good along with the hand-authored ADR corpus\n  -- no longer wired into `npm run check:*` (removed from `package.json`).\n  Its pure functions stay real and unit-tested against synthetic\n  fixtures; only the real-repo CLI mode has nothing left to run against.\n",
  "directReferences": [
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5911,
      "text": "    \"docs/specs/decision-citation-drift.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 63,
      "text": "| Decision citation drift | legacy-current | maintained-authority | `docs/specs/decision-citation-drift.md` | `scripts/check-decision-citation-drift.mjs` | Spec owns citation drift detection invariants and baseline ratchet rules. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 21,
      "text": "- decision-citation-drift — quét backlog/spec tìm dòng còn trích một quyết định đã bị supersede mà không nhắc quyết định thay thế (chỉ phát hiện, không tự sửa); spec: decision-citation-drift.md"
    },
    {
      "path": "docs/specs/work-state.md",
      "line": 1361,
      "text": "- Test: `npm test` (`node --test 'test/**/*.test.mjs'`); e2e tại `test/e2e/rebuild-determinism.test.mjs` + `test/e2e/runner-loop.test.mjs` — bao gồm các kịch bản của hai stage đầu chuỗi, các kịch bản của stage lập-kế-hoạch (pass-through, chia-con-chặn-frontier, cần-người), VÀ 1 kịch bản S2-pull (submit → pass-through 2 stage → `take` người → một `fgos-runner --once` song song không giẫm claim người → người `return` xanh → `awaiting-approval`) chạy qua binary thật; round-trip cổng chờ-người tại `test/state/awaiting.test.mjs` + e2e CLI tại `test/cli/fgos.test.mjs`; unit tại `test/intake/{classify,discovery,plan}.test.mjs` + `test/state/{envelope,stage,store,frontier,work,replay}.test.mjs`; entropy-trend tại `test/report/entropy.test.mjs`. LƯU Ý phạm vi: suite KHÔNG đọc chính tài liệu này — không có test nào quét nội dung `docs/specs/*.md`, nên `npm test` xanh KHÔNG phải bằng chứng spec còn đúng với code. Bộ dò trích-dẫn-quyết-định-đã-lỗi-thời (`scripts/check-decision-citation-drift.mjs`) có quét `docs/specs/`, nhưng là script chạy tay, chỉ phát hiện, KHÔNG nối vào `npm test` (per `docs/specs/decision-citation-drift.md`)"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 25,
      "text": "- `scripts/check-decision-citation-drift.mjs` + `test/scripts/check-decision-citation-drift.test.mjs` — quét `docs/backlog.md` + `docs/specs/*.md` tìm dòng còn trích một quyết định đã bị supersede mà không nhắc quyết định thay thế trên cùng dòng (STR72 CoS clause 2, PBI p-2d71dfc3); chỉ phát hiện, không tự sửa; spec: docs/specs/decision-citation-drift.md"
    }
  ],
  "sourceSHA256": "4774f723f8d3ab5e4a753cd2b74919f27c62c2c7857644606337def5bd922cff"
}
```


## liveness-03-001

Source digest (evidence JSON): 07e8144fcde3c9fffdf9ffac1d8cb2936f9c83d66257f232acf611aa8ef4bc22
Target digest: none

```json
{
  "entryId": "liveness-03-001",
  "source": "docs/specs/distillery.md",
  "sourceBlob": "358eff4235102db17f166551dc1d51199f3c4abc",
  "section": {
    "heading": "Preamble",
    "anchor": "preamble",
    "startLine": 1,
    "endLine": 8,
    "sha256": "ed23dc4ce3a80eeca0c13882b3966309eceaf8ef58d1cc0d4f8d5d99aac8ec7e",
    "classification": "current-by-default",
    "directReferenceCount": 4,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "---\narea: distillery\nupdated: 2026-07-17\nsources: [distillery-state-consumer]\ndecisions: []\ncoverage: partial\n---\n",
  "directReferences": [
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5917,
      "text": "    \"docs/specs/distillery.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 64,
      "text": "| Distillery / reference learning | legacy-current | maintained-authority | `docs/specs/distillery.md` | `.agents/skills/distill/SKILL.md` | Spec owns bounded reference-learning behavior; skill owns operational surface. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 22,
      "text": "- distillery — vùng học từ reference sources: index feature từng nguồn, so sánh chéo, porting log; spec: distillery.md (partial — chỉ phủ porting lifecycle, xem Open Gaps trong spec đó)"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 62,
      "text": "- distillery: spec chỉ phủ porting lifecycle (docs/specs/distillery.md) — các khả năng khác (tìm nguồn mới, so sánh chéo, xếp hạng candidate) chưa có spec."
    }
  ],
  "sourceSHA256": "518accb5c959ac5dc42b154cb735f3f3af962a51afca4a4976972d059d0c7196"
}
```


## liveness-03-002

Source digest (evidence JSON): 47ffedb443bda997e841fed2209eddbeaa485f743d707669625508c818d6c87e
Target digest: none

```json
{
  "entryId": "liveness-03-002",
  "source": "docs/specs/distillery.md",
  "sourceBlob": "358eff4235102db17f166551dc1d51199f3c4abc",
  "section": {
    "heading": "Distillery — Porting Lifecycle",
    "anchor": "distillery-porting-lifecycle",
    "startLine": 9,
    "endLine": 10,
    "sha256": "aeb9ce3bfba2775716097be0dccce3db8533fca350cb852d4970409d576de795",
    "classification": "current-by-default",
    "directReferenceCount": 4,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "# Distillery — Porting Lifecycle\n",
  "directReferences": [
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5917,
      "text": "    \"docs/specs/distillery.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 64,
      "text": "| Distillery / reference learning | legacy-current | maintained-authority | `docs/specs/distillery.md` | `.agents/skills/distill/SKILL.md` | Spec owns bounded reference-learning behavior; skill owns operational surface. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 22,
      "text": "- distillery — vùng học từ reference sources: index feature từng nguồn, so sánh chéo, porting log; spec: distillery.md (partial — chỉ phủ porting lifecycle, xem Open Gaps trong spec đó)"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 62,
      "text": "- distillery: spec chỉ phủ porting lifecycle (docs/specs/distillery.md) — các khả năng khác (tìm nguồn mới, so sánh chéo, xếp hạng candidate) chưa có spec."
    }
  ],
  "sourceSHA256": "518accb5c959ac5dc42b154cb735f3f3af962a51afca4a4976972d059d0c7196"
}
```


## liveness-03-003

Source digest (evidence JSON): 1fe36b2b1d19ae9382aa049e39935d31b86290b686ff2d2176525bb23d95db81
Target digest: none

```json
{
  "entryId": "liveness-03-003",
  "source": "docs/specs/distillery.md",
  "sourceBlob": "358eff4235102db17f166551dc1d51199f3c4abc",
  "section": {
    "heading": "Purpose",
    "anchor": "purpose",
    "startLine": 11,
    "endLine": 20,
    "sha256": "998542eefe4de4b41b26c1c22812ff3c2afd69c04b4cefb86cbf7a95c3512753",
    "classification": "current-by-default",
    "directReferenceCount": 4,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Purpose\n\nDistillery is forgent's reference-learning system: it studies external sibling\nprojects to find ideas and patterns worth reusing. This spec covers one part\nof it — the **porting lifecycle**: how the adoption status of each considered\nidea (\"candidate\") is tracked from first identification through to its final\noutcome, and durably remembered so a rejected idea is never re-litigated by\naccident. Other distillery capabilities (finding new source material, cross-\nsource comparison, candidate ranking) are out of scope here — see Open Gaps.\n",
  "directReferences": [
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5917,
      "text": "    \"docs/specs/distillery.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 64,
      "text": "| Distillery / reference learning | legacy-current | maintained-authority | `docs/specs/distillery.md` | `.agents/skills/distill/SKILL.md` | Spec owns bounded reference-learning behavior; skill owns operational surface. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 22,
      "text": "- distillery — vùng học từ reference sources: index feature từng nguồn, so sánh chéo, porting log; spec: distillery.md (partial — chỉ phủ porting lifecycle, xem Open Gaps trong spec đó)"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 62,
      "text": "- distillery: spec chỉ phủ porting lifecycle (docs/specs/distillery.md) — các khả năng khác (tìm nguồn mới, so sánh chéo, xếp hạng candidate) chưa có spec."
    }
  ],
  "sourceSHA256": "518accb5c959ac5dc42b154cb735f3f3af962a51afca4a4976972d059d0c7196"
}
```


## liveness-03-004

Source digest (evidence JSON): f6853b70726b1a06aca43298206f4a820c260f146d7265136a99868e5b522a1e
Target digest: none

```json
{
  "entryId": "liveness-03-004",
  "source": "docs/specs/distillery.md",
  "sourceBlob": "358eff4235102db17f166551dc1d51199f3c4abc",
  "section": {
    "heading": "Entry Points & Triggers",
    "anchor": "entry-points-triggers",
    "startLine": 21,
    "endLine": 28,
    "sha256": "efa1b700aca8fa0873ef6ee5e7577bd953ccfb0c6b7a25e25bf9b0456478d8e7",
    "classification": "current-by-default",
    "directReferenceCount": 4,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Entry Points & Triggers\n\n- A person or agent decides a porting candidate should move to its next\n  lifecycle stage and runs the status-change command for it.\n- Once, at cutover: a seeding operation establishes the correct current status\n  for every candidate already on record, before the live status-change command\n  is used for the first time.\n",
  "directReferences": [
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5917,
      "text": "    \"docs/specs/distillery.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 64,
      "text": "| Distillery / reference learning | legacy-current | maintained-authority | `docs/specs/distillery.md` | `.agents/skills/distill/SKILL.md` | Spec owns bounded reference-learning behavior; skill owns operational surface. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 22,
      "text": "- distillery — vùng học từ reference sources: index feature từng nguồn, so sánh chéo, porting log; spec: distillery.md (partial — chỉ phủ porting lifecycle, xem Open Gaps trong spec đó)"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 62,
      "text": "- distillery: spec chỉ phủ porting lifecycle (docs/specs/distillery.md) — các khả năng khác (tìm nguồn mới, so sánh chéo, xếp hạng candidate) chưa có spec."
    }
  ],
  "sourceSHA256": "518accb5c959ac5dc42b154cb735f3f3af962a51afca4a4976972d059d0c7196"
}
```


## liveness-03-005

Source digest (evidence JSON): f97e0878a913d81e32d8da1cf8e7c14ff1344efaa98897f05c59726c7db005ec
Target digest: none

```json
{
  "entryId": "liveness-03-005",
  "source": "docs/specs/distillery.md",
  "sourceBlob": "358eff4235102db17f166551dc1d51199f3c4abc",
  "section": {
    "heading": "Data Dictionary",
    "anchor": "data-dictionary",
    "startLine": 29,
    "endLine": 42,
    "sha256": "c00d88586460b225640d2b6e9b8d528758338c10f474b85ca002affb38f4bc23",
    "classification": "current-by-default",
    "directReferenceCount": 4,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Data Dictionary\n\n| Field | Meaning |\n|---|---|\n| Feature (id) | The name of the extracted idea/pattern under consideration. Unique. |\n| Status | The candidate's current lifecycle stage — see enum below. This is the ONLY field this spec's lifecycle governs (R1). |\n| `candidate` | Identified as reusable, not yet committed to. |\n| `planned` | Decided to pursue; work has not started. |\n| `in-progress` | Actively being built/integrated. |\n| `ported` | Adopted as-is and shipped. |\n| `adapted` | Adopted with modification and shipped. |\n| `rejected` | Considered and declined — recorded permanently so it is never re-litigated. |\n| Score, Local, Đích (destination), Commit, Notes | Free-form metadata about the candidate. NOT governed by this lifecycle (R1) — still edited directly, unaffected by a status change. |\n",
  "directReferences": [
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5917,
      "text": "    \"docs/specs/distillery.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 64,
      "text": "| Distillery / reference learning | legacy-current | maintained-authority | `docs/specs/distillery.md` | `.agents/skills/distill/SKILL.md` | Spec owns bounded reference-learning behavior; skill owns operational surface. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 22,
      "text": "- distillery — vùng học từ reference sources: index feature từng nguồn, so sánh chéo, porting log; spec: distillery.md (partial — chỉ phủ porting lifecycle, xem Open Gaps trong spec đó)"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 62,
      "text": "- distillery: spec chỉ phủ porting lifecycle (docs/specs/distillery.md) — các khả năng khác (tìm nguồn mới, so sánh chéo, xếp hạng candidate) chưa có spec."
    }
  ],
  "sourceSHA256": "518accb5c959ac5dc42b154cb735f3f3af962a51afca4a4976972d059d0c7196"
}
```


## liveness-03-006

Source digest (evidence JSON): 9ab9137660f7f3831717e8ff02bee6e3d23865ab4b3899b874f822a5bb4e8788
Target digest: none

```json
{
  "entryId": "liveness-03-006",
  "source": "docs/specs/distillery.md",
  "sourceBlob": "358eff4235102db17f166551dc1d51199f3c4abc",
  "section": {
    "heading": "Behaviors & Operations",
    "anchor": "behaviors-operations",
    "startLine": 43,
    "endLine": 81,
    "sha256": "2bd008ddc2793216d198d7d2d5d18eb6047906c1f9de8dec15724c2dad82decd",
    "classification": "current-by-default",
    "directReferenceCount": 4,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Behaviors & Operations\n\n**Advance a candidate's status.**\n- Triggers when: an operator or agent decides a candidate is ready for its\n  next lifecycle stage and issues the move.\n- Blocked when: the requested move is not one of the legal next stages for\n  the candidate's current status (see the enum's legal order above — each\n  status has a fixed, small set of stages it may move to next; most illegal\n  moves are attempts to skip stages or to move a candidate that has already\n  reached a final stage).\n- What changes: the candidate's status is durably recorded as changed. The\n  human-readable porting log is updated to show the new status for that one\n  candidate — nothing else on the log changes.\n- Side effects: the change is appended to a permanent record of every status\n  change ever made, so the complete history is always reconstructable from\n  scratch (R2).\n- What the operator observes: on success, confirmation that the move\n  happened. On an illegal move, a clear explanation of why (the candidate's\n  current status and what moves are actually legal from there) — and nothing\n  changes, neither the record nor the human-readable log.\n\n**Seed historical status (one-time, at cutover only).**\n- Triggers when: the porting lifecycle is switched on for the first time,\n  before any live status-change command has been used.\n- What changes: every candidate already on record gets its current status\n  established in the durable record, matching exactly what the human-readable\n  log already showed for it — no candidate starts over at the beginning.\n- What each status is \"reached\" through: the seeding operation only ever uses\n  the SAME legal stage-to-stage moves the live command would use — it never\n  takes a shortcut straight to a candidate's final status. This is itself a\n  proof that every candidate's recorded status is one the lifecycle can\n  actually produce.\n- Side effect / self-check: if a candidate's current status could NOT be\n  reached through any legal sequence of moves, seeding for that candidate\n  would fail loudly rather than silently accepting it — this has not\n  happened with real data yet (Edge Cases Settled).\n- Running the seeding operation again after it already ran changes nothing —\n  it recognizes work already done and skips it.\n",
  "directReferences": [
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5917,
      "text": "    \"docs/specs/distillery.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 64,
      "text": "| Distillery / reference learning | legacy-current | maintained-authority | `docs/specs/distillery.md` | `.agents/skills/distill/SKILL.md` | Spec owns bounded reference-learning behavior; skill owns operational surface. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 22,
      "text": "- distillery — vùng học từ reference sources: index feature từng nguồn, so sánh chéo, porting log; spec: distillery.md (partial — chỉ phủ porting lifecycle, xem Open Gaps trong spec đó)"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 62,
      "text": "- distillery: spec chỉ phủ porting lifecycle (docs/specs/distillery.md) — các khả năng khác (tìm nguồn mới, so sánh chéo, xếp hạng candidate) chưa có spec."
    }
  ],
  "sourceSHA256": "518accb5c959ac5dc42b154cb735f3f3af962a51afca4a4976972d059d0c7196"
}
```


## liveness-03-007

Source digest (evidence JSON): 07662a54fb865b38b792de22c71656472b1358f8894bb89c6663704668037a7f
Target digest: none

```json
{
  "entryId": "liveness-03-007",
  "source": "docs/specs/distillery.md",
  "sourceBlob": "358eff4235102db17f166551dc1d51199f3c4abc",
  "section": {
    "heading": "Actors & Access",
    "anchor": "actors-access",
    "startLine": 82,
    "endLine": 87,
    "sha256": "d6138eae071fff180510fe3815be6919609c34fcf2e6d19fa8ab26ddafaa7f72",
    "classification": "current-by-default",
    "directReferenceCount": 4,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Actors & Access\n\n- **Operator/agent** — anyone with access to the distillery tooling. No\n  additional access control beyond ordinary tool access; this is internal\n  workshop tooling, not a user-facing product surface.\n",
  "directReferences": [
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5917,
      "text": "    \"docs/specs/distillery.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 64,
      "text": "| Distillery / reference learning | legacy-current | maintained-authority | `docs/specs/distillery.md` | `.agents/skills/distill/SKILL.md` | Spec owns bounded reference-learning behavior; skill owns operational surface. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 22,
      "text": "- distillery — vùng học từ reference sources: index feature từng nguồn, so sánh chéo, porting log; spec: distillery.md (partial — chỉ phủ porting lifecycle, xem Open Gaps trong spec đó)"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 62,
      "text": "- distillery: spec chỉ phủ porting lifecycle (docs/specs/distillery.md) — các khả năng khác (tìm nguồn mới, so sánh chéo, xếp hạng candidate) chưa có spec."
    }
  ],
  "sourceSHA256": "518accb5c959ac5dc42b154cb735f3f3af962a51afca4a4976972d059d0c7196"
}
```


## liveness-03-008

Source digest (evidence JSON): 66fd467f881cf70093037b1e07ce903d5326b80680e24c597f6c1ec7d8bafb50
Target digest: none

```json
{
  "entryId": "liveness-03-008",
  "source": "docs/specs/distillery.md",
  "sourceBlob": "358eff4235102db17f166551dc1d51199f3c4abc",
  "section": {
    "heading": "Business Rules",
    "anchor": "business-rules",
    "startLine": 88,
    "endLine": 99,
    "sha256": "491b33974758ad0960a2c8632ad7fd449c3ed3a7c4d5b06c66a4804d413905a1",
    "classification": "current-by-default",
    "directReferenceCount": 4,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Business Rules\n\n- **R1.** The lifecycle governs the Status field only. Score, Local,\n  destination, commit, and notes stay freely editable and are never touched\n  by a status change.\n- **R2.** The durable record of status changes is the source of truth. The\n  human-readable porting log is always a reflection of it — after cutover,\n  it is never hand-edited for Status again.\n- **R3.** Status changes for distillery candidates go through the same kind\n  of durable, rule-checked mechanism forgent uses for tracking its own\n  work — not a separate, informal mechanism built just for this.\n",
  "directReferences": [
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5917,
      "text": "    \"docs/specs/distillery.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 64,
      "text": "| Distillery / reference learning | legacy-current | maintained-authority | `docs/specs/distillery.md` | `.agents/skills/distill/SKILL.md` | Spec owns bounded reference-learning behavior; skill owns operational surface. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 22,
      "text": "- distillery — vùng học từ reference sources: index feature từng nguồn, so sánh chéo, porting log; spec: distillery.md (partial — chỉ phủ porting lifecycle, xem Open Gaps trong spec đó)"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 62,
      "text": "- distillery: spec chỉ phủ porting lifecycle (docs/specs/distillery.md) — các khả năng khác (tìm nguồn mới, so sánh chéo, xếp hạng candidate) chưa có spec."
    }
  ],
  "sourceSHA256": "518accb5c959ac5dc42b154cb735f3f3af962a51afca4a4976972d059d0c7196"
}
```


## liveness-03-009

Source digest (evidence JSON): 2ee3211078e7df873997e8fa7ddd1c23d9d94de7c77605b038f01830c0e1adf3
Target digest: none

```json
{
  "entryId": "liveness-03-009",
  "source": "docs/specs/distillery.md",
  "sourceBlob": "358eff4235102db17f166551dc1d51199f3c4abc",
  "section": {
    "heading": "Edge Cases Settled",
    "anchor": "edge-cases-settled",
    "startLine": 100,
    "endLine": 111,
    "sha256": "50cd439175471e31c1a0fde03b0e6d06f9b68fdf5419df0f36c7c8d2bc40e4ea",
    "classification": "current-by-default",
    "directReferenceCount": 4,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Edge Cases Settled\n\n- A candidate may end its life either by being rejected outright (never\n  built) or by being rejected after active work started — both are legal,\n  final outcomes.\n- An illegal move (skipping a stage, or trying to move a candidate that has\n  already reached a final stage) is refused in full: neither the durable\n  record nor the human-readable log changes.\n- As of this writing, every candidate on record reached its current status\n  through a sequence the lifecycle actually allows — none needed an\n  exception.\n",
  "directReferences": [
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5917,
      "text": "    \"docs/specs/distillery.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 64,
      "text": "| Distillery / reference learning | legacy-current | maintained-authority | `docs/specs/distillery.md` | `.agents/skills/distill/SKILL.md` | Spec owns bounded reference-learning behavior; skill owns operational surface. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 22,
      "text": "- distillery — vùng học từ reference sources: index feature từng nguồn, so sánh chéo, porting log; spec: distillery.md (partial — chỉ phủ porting lifecycle, xem Open Gaps trong spec đó)"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 62,
      "text": "- distillery: spec chỉ phủ porting lifecycle (docs/specs/distillery.md) — các khả năng khác (tìm nguồn mới, so sánh chéo, xếp hạng candidate) chưa có spec."
    }
  ],
  "sourceSHA256": "518accb5c959ac5dc42b154cb735f3f3af962a51afca4a4976972d059d0c7196"
}
```


## liveness-03-010

Source digest (evidence JSON): 1e4ced7e6f71ea364ae526f1a032e5edf692ea22184da810f7fb9849806e1668
Target digest: none

```json
{
  "entryId": "liveness-03-010",
  "source": "docs/specs/distillery.md",
  "sourceBlob": "358eff4235102db17f166551dc1d51199f3c4abc",
  "section": {
    "heading": "Open Gaps",
    "anchor": "open-gaps",
    "startLine": 112,
    "endLine": 129,
    "sha256": "913ee1f2d7b5709e7e46e5a806835230f8f6f3a944e419d31f05529cf43b79af",
    "classification": "current-by-default",
    "directReferenceCount": 4,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Open Gaps\n\n- The status-change command currently must be run from the project's own\n  root location — running it from elsewhere is not yet supported.\n- The one-time seeding operation assumes every historical candidate reached\n  its current status the \"normal\" way (see Edge Cases Settled) — if a real\n  historical case ever turns out not to fit, that nuance would only be\n  recoverable from the free-form Notes column, not the durable record.\n- Distillery's other capabilities — finding new source material to review,\n  comparing ideas across sources, ranking candidates by score — are not yet\n  described in this spec; only the porting-status lifecycle is covered here.\n  `coverage: partial` reflects this.\n- `docs/specs/system-overview.md` already lists a `distillery` area entry\n  pointing here (and a separate `distill-skill` entry still marked\n  spec-pending) — this spec was written in the forgent-workshop project and\n  moved into this repo verbatim; it has not been re-harvested against this\n  repo's own doc conventions.\n",
  "directReferences": [
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5917,
      "text": "    \"docs/specs/distillery.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 64,
      "text": "| Distillery / reference learning | legacy-current | maintained-authority | `docs/specs/distillery.md` | `.agents/skills/distill/SKILL.md` | Spec owns bounded reference-learning behavior; skill owns operational surface. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 22,
      "text": "- distillery — vùng học từ reference sources: index feature từng nguồn, so sánh chéo, porting log; spec: distillery.md (partial — chỉ phủ porting lifecycle, xem Open Gaps trong spec đó)"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 62,
      "text": "- distillery: spec chỉ phủ porting lifecycle (docs/specs/distillery.md) — các khả năng khác (tìm nguồn mới, so sánh chéo, xếp hạng candidate) chưa có spec."
    }
  ],
  "sourceSHA256": "518accb5c959ac5dc42b154cb735f3f3af962a51afca4a4976972d059d0c7196"
}
```


## liveness-03-011

Source digest (evidence JSON): 1337a1534d1981462ca7d6b0d7979e35e9c867281bf5c077cf2927d87887a428
Target digest: none

```json
{
  "entryId": "liveness-03-011",
  "source": "docs/specs/distillery.md",
  "sourceBlob": "358eff4235102db17f166551dc1d51199f3c4abc",
  "section": {
    "heading": "Pointers (implementation)",
    "anchor": "pointers-implementation",
    "startLine": 130,
    "endLine": 139,
    "sha256": "8a65a1cf8ed1debee1edf7faba7e52fd0c08aa180028c4ee90a54537c263834e",
    "classification": "current-by-default",
    "directReferenceCount": 4,
    "implementationPaths": [
      "src/state/porting.mjs",
      "src/state/porting-store.mjs"
    ],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Pointers (implementation)\n\n- CLI command: `.agents/skills/distill/scripts/distill.mjs` (`move` verb)\n- State/lifecycle rules: `src/state/porting.mjs`\n- Durable record + human-readable-log sync: `src/state/porting-store.mjs`\n- Human-readable log: `docs/distillery/porting-log.md`\n- Durable record storage: `docs/distillery/state/porting/`\n- One-time seeding script: `.agents/skills/distill/scripts/migrate-porting-state-backfill.mjs`\n- Package boundary: this repo's `package.json` (`exports`) exposes `forgent/state/porting` and `forgent/state/porting-store` — the distill skill imports its own package by name (Node self-reference); external consumers (e.g. the forgent-workshop project) install this repo as the `forgent` dependency and import the same subpaths.\n",
  "directReferences": [
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5917,
      "text": "    \"docs/specs/distillery.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 64,
      "text": "| Distillery / reference learning | legacy-current | maintained-authority | `docs/specs/distillery.md` | `.agents/skills/distill/SKILL.md` | Spec owns bounded reference-learning behavior; skill owns operational surface. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 22,
      "text": "- distillery — vùng học từ reference sources: index feature từng nguồn, so sánh chéo, porting log; spec: distillery.md (partial — chỉ phủ porting lifecycle, xem Open Gaps trong spec đó)"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 62,
      "text": "- distillery: spec chỉ phủ porting lifecycle (docs/specs/distillery.md) — các khả năng khác (tìm nguồn mới, so sánh chéo, xếp hạng candidate) chưa có spec."
    }
  ],
  "sourceSHA256": "518accb5c959ac5dc42b154cb735f3f3af962a51afca4a4976972d059d0c7196"
}
```


## liveness-04-001

Source digest (evidence JSON): 3ef79db05a7226e34e5c45ee5660f12058df5be5814adabe63d6553e723c9c88
Target digest: none

```json
{
  "entryId": "liveness-04-001",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "Preamble",
    "anchor": "preamble",
    "startLine": 1,
    "endLine": 8,
    "sha256": "8f6ae53a280193363f1d816517c8298af0d2ca60e6d1e99fbc1c3376eb83f88e",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "---\narea: fgos-plugin\nupdated: 2026-07-23\nsources: [str83-fgos-slash-commands, str88-fgos-verb-wrappers]\ndecisions: [7574fe5a]\ncoverage: full\n---\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-002

Source digest (evidence JSON): bb926833ea868559636ebc31c80370e4bac3a555c5932dc86ddfaabc24499739
Target digest: none

```json
{
  "entryId": "liveness-04-002",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "Spec: fgOS Plugin (Claude Code slash-command surface)",
    "anchor": "spec-fgos-plugin-claude-code-slash-command-surface",
    "startLine": 9,
    "endLine": 21,
    "sha256": "b5b52c9c25894e657f28fdb69a62bc321d58e3126b9919dbb1dd437bfcac6c09",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "# Spec: fgOS Plugin (Claude Code slash-command surface)\n\nThe fgOS plugin lets a person working inside Claude Code operate the fgOS\nwork-item lifecycle — claim, submit, move, monitor, and inspect work — as\n`/fgOS:<verb>` slash commands, without hand-typing the underlying command-line\ntool or its arguments. Every command is a thin, safety-checked wrapper: it\nshells out to the one underlying tool, never touches the work-item store\ndirectly, and shows the real error and stops when anything goes wrong. The\nlifecycle rules each verb enforces (what \"move\" is allowed, what \"return\"\nchecks, what triggers \"awaiting-human\") are owned by the Work-State area\n(`docs/specs/work-state.md`) — this spec covers only the plugin's own\nconvenience layer on top of that.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-003

Source digest (evidence JSON): d988f6412a84f8b6bc0c28897bee326eb9a3d72e2dde74218386c8f3d43d129f
Target digest: none

```json
{
  "entryId": "liveness-04-003",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "Entry Points & Triggers",
    "anchor": "entry-points-triggers",
    "startLine": 22,
    "endLine": 36,
    "sha256": "5dc83b1bf2ed95a83de6161d623c34464a93108c1dbc90966335ca4ac0850b89",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Entry Points & Triggers\n\n- `/fgOS:submit <free-text>` → intake a new work item from a plain-language description.\n- `/fgOS:pick [id]` → claim the next (or a named) work item and switch straight into its own isolated workspace.\n- `/fgOS:move <id> <status>` → move a work item to a new status.\n- `/fgOS:return <id>` → complete a claimed item: run its own verification and advance it.\n- `/fgOS:ask <id> <question text>` → park a work item pending a question, with the question attached.\n- `/fgOS:answer <id> <answer text>` → resume a parked work item once its question is answered.\n- `/fgOS:ready` → list every work item ready to be picked up right now.\n- `/fgOS:stale` → list work items that look stuck (claimed but inactive too long).\n- `/fgOS:rollup <id>` → show one work item's children: how many are done out of the total, and each child's status.\n- `/fgOS:check [id]` → show the predicted-vs-actual outcome report for one item, or every item at once.\n- `/fgOS:graph [id]` → show work-graph metrics (independent parallel tracks), or — with an id — what completing that one item would unblock.\n- `/fgOS:conflicts` → list pairs of ready work items whose declared file footprints overlap (a parallel-work collision risk).\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-004

Source digest (evidence JSON): fde271e623566883760a59cd18aa8ce89cb58abfa7c2d6b2796d619640ed74e0
Target digest: none

```json
{
  "entryId": "liveness-04-004",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "Data Dictionary",
    "anchor": "data-dictionary",
    "startLine": 37,
    "endLine": 46,
    "sha256": "d370151e2b0832849236681b771568663af34fd531f0136d7b795113a848ef68",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Data Dictionary\n\n| # | Element | Meaning | Values | Required | Default |\n|---|---------|---------|--------|----------|---------|\n| 1 | Work item id | The identifier of the item a command acts on or reports on | free text, must match an existing item for verbs that require one | required for `move`/`return`/`ask`/`answer`/`rollup`; optional for `pick`/`check`/`graph` | — (no default; an optional id omitted means \"every item\" for `check`, \"the frontier head\" for `pick`, \"full metrics\" for `graph`) |\n| 2 | Target status | The status `move` transitions a work item to | any status in the item's lifecycle (owned by Work-State) | yes, for `move` | — |\n| 3 | Question text | The question attached when parking an item | free text | yes, for `ask` | — |\n| 4 | Answer text | The answer recorded to resume a parked item | free text | yes, for `answer` | — |\n| 5 | Free-text description | The plain-language input a new item is intaken from | free text | yes, for `submit` | — |\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-005

Source digest (evidence JSON): 43428da08c4ced1f2889460f58e238082c07cccb7cd78d2118e0e86f7ccbaa16
Target digest: none

```json
{
  "entryId": "liveness-04-005",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "Behaviors & Operations",
    "anchor": "behaviors-operations",
    "startLine": 47,
    "endLine": 48,
    "sha256": "2a077fae8e0ab1067a4f8bc37bfdaf6918ab79ee1f571144577d26ac7acb3139",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Behaviors & Operations\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-006

Source digest (evidence JSON): 1bc05cf169d9737d36ae98ae14f3acaae8dc155e82090f4182af4627bb531908
Target digest: none

```json
{
  "entryId": "liveness-04-006",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "submit",
    "anchor": "submit",
    "startLine": 49,
    "endLine": 55,
    "sha256": "d0037c1eb55bbe77e70987338950ce0c28191caaa1dbaf0763b7dfa74783daff",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### submit\n\n- **Blocked when:** the free-text description is empty — the person is asked for text before anything runs.\n- **What changes:** a new work item is created from the description; if a clear, textually-grounded dependency on an existing item is found, the person is asked to confirm, edit, or reject it before the item is created — never attached silently.\n- **Side effects:** none beyond the new item.\n- **Afterwards:** the person sees the new item's id and derived fields.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-007

Source digest (evidence JSON): e49c5eea0e03ce5e350ae85579d348c2293fb4221824d9f22886788451d88173
Target digest: none

```json
{
  "entryId": "liveness-04-007",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "pick",
    "anchor": "pick",
    "startLine": 56,
    "endLine": 62,
    "sha256": "82f0ffe86f84ced1f97a04fff0ba2dca9b25f83eac9cc502601ecd7f50557280",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### pick\n\n- **Blocked when:** no id is given and no item is ready to claim, or a named id does not exist or cannot be claimed.\n- **What changes:** the named (or next-ready) item is claimed, and an isolated workspace for it is created or reused.\n- **Side effects:** the current session switches into that isolated workspace when the surrounding tool supports it; otherwise the workspace's location is printed for the person to open separately.\n- **Afterwards:** the person sees which item was claimed and, when the switch could not happen automatically, where to go to continue.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-008

Source digest (evidence JSON): e5495f8009b261c53cff995bedb62544859347a8bee30a60215554d9b6807b90
Target digest: none

```json
{
  "entryId": "liveness-04-008",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "move",
    "anchor": "move",
    "startLine": 63,
    "endLine": 69,
    "sha256": "7d8ac4b20494a7fa39b260d821360b1681554551e3ae0f46cdebee2572f2da73",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### move\n\n- **Blocked when:** the target status is missing, or the transition is not legal for the item's current status (checked by Work-State).\n- **What changes:** the item's status changes to the target status.\n- **Side effects:** none beyond the status change itself.\n- **Afterwards:** the person sees the item's previous and new status.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-009

Source digest (evidence JSON): 0022d0d9b5b386e4f02a3adb18066eebdf83d905141854bd89211c054f06bc5e
Target digest: none

```json
{
  "entryId": "liveness-04-009",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "return",
    "anchor": "return",
    "startLine": 70,
    "endLine": 76,
    "sha256": "fa70213d96eb7969fbf32429f4989b7bfb6c0264581bcef21d606e7f1ab0a90a",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### return\n\n- **Blocked when:** the item id does not exist, or is not currently in a state `return` can act on.\n- **What changes:** the item's own verification runs; a passing result advances it, a failing result parks it as blocked, per Work-State's rules.\n- **Side effects:** none beyond the status change.\n- **Afterwards:** the person sees whether verification passed and the item's resulting status.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-010

Source digest (evidence JSON): 810447a7fd47327670e2faeaf0059f860d75c58bfebebbe6eca3c0542110d29a
Target digest: none

```json
{
  "entryId": "liveness-04-010",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "ask",
    "anchor": "ask",
    "startLine": 77,
    "endLine": 83,
    "sha256": "38d2467c1dc0be95a547bf6001a56c56401922049f2b042f5255ba6e3920fb27",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### ask\n\n- **Blocked when:** the question text is missing — the person is asked for it rather than the command guessing or skipping it.\n- **What changes:** the item is parked pending an answer, with the question attached.\n- **Side effects:** none beyond the park.\n- **Afterwards:** the person sees the item's previous and new status.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-011

Source digest (evidence JSON): 757ac1bcb6a2ce6e407b46080bf02af0befc881e93da4d3de9de56019e4acb17
Target digest: none

```json
{
  "entryId": "liveness-04-011",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "answer",
    "anchor": "answer",
    "startLine": 84,
    "endLine": 90,
    "sha256": "991c3e5914fd5e3317c22262ebe5e631fed5997bcc24b98b3e769def60760425",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### answer\n\n- **Blocked when:** the answer text is missing — same handling as `ask`.\n- **What changes:** the answer is recorded and the item resumes from its parked state.\n- **Side effects:** none beyond the resume.\n- **Afterwards:** the person sees the item's previous and new status.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-012

Source digest (evidence JSON): 2282a81ef34df4a8c17eb0c02c3f1d20db26ca358550f147cc956fd60d42b9fa
Target digest: none

```json
{
  "entryId": "liveness-04-012",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "ready",
    "anchor": "ready",
    "startLine": 91,
    "endLine": 97,
    "sha256": "1e570eecd6c4c0dec71149a55539c533a218350e242e2c1e7ac36363692213a9",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### ready\n\n- **Runs when:** invoked with no argument.\n- **What changes:** nothing — read-only.\n- **Side effects:** none.\n- **Afterwards:** the person sees the current list of work items ready to be picked up.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-013

Source digest (evidence JSON): e5bfd8a10d852891b9c4b485a931078fbab867d8dd6e112c96286370769cfdc1
Target digest: none

```json
{
  "entryId": "liveness-04-013",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "stale",
    "anchor": "stale",
    "startLine": 98,
    "endLine": 104,
    "sha256": "e5927f058a009de2c24971532cbf55f508ba13a9c42685ba93fb48c5c2aae6e8",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### stale\n\n- **Runs when:** invoked with no argument.\n- **What changes:** nothing — read-only, never reclaims a stuck item itself.\n- **Side effects:** none.\n- **Afterwards:** the person sees which items look stuck, classified by how long is \"too long\" for the kind of role holding each one.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-014

Source digest (evidence JSON): 30c7c742917b406f6a8fe46e1a8d03c040bd0be83809bacc7c316024f7fe813f
Target digest: none

```json
{
  "entryId": "liveness-04-014",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "rollup",
    "anchor": "rollup",
    "startLine": 105,
    "endLine": 111,
    "sha256": "1473d290eee628b06eba6459aad31142d959801c09ddf2019aa144a468f546e6",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### rollup\n\n- **Blocked when:** the id is missing, or does not exist.\n- **What changes:** nothing — read-only.\n- **Side effects:** none.\n- **Afterwards:** the person sees the parent item, a done/total count of its direct children, and each child's own status.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-015

Source digest (evidence JSON): e3213ddf4ec853d74dc74925b1a51eddadcc3c448a9b0347cf9f3b1ebd787651
Target digest: none

```json
{
  "entryId": "liveness-04-015",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "check",
    "anchor": "check",
    "startLine": 112,
    "endLine": 118,
    "sha256": "d47d8a8557ce1b1bcb5fd997566ef81cb8e96f2ee57f3b39c0dadc061da13bca",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### check\n\n- **Runs when:** invoked with or without an id.\n- **What changes:** nothing — read-only.\n- **Side effects:** none.\n- **Afterwards:** the person sees the predicted-vs-actual report for the named item, or for every item when none is named.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-016

Source digest (evidence JSON): 03dcf7ed520b3ac300323177b18e2931dfeda9f049350735bc7bff709fc304df
Target digest: none

```json
{
  "entryId": "liveness-04-016",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "graph",
    "anchor": "graph",
    "startLine": 119,
    "endLine": 125,
    "sha256": "29f4ee5aea57593d5edede08c46eb3dafea021d8d38d24a44b2384033ceba80b",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### graph\n\n- **Runs when:** invoked with or without an id.\n- **What changes:** nothing — read-only.\n- **Side effects:** none.\n- **Afterwards:** with no id, the person sees the full work-graph metrics (independent parallel tracks and related structure); with an id, they see only what completing that one item would unblock.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-017

Source digest (evidence JSON): a017ea25b71b98fd26c3a6941472f1a9de72247367990af7104bfa7361c6f9ed
Target digest: none

```json
{
  "entryId": "liveness-04-017",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "conflicts",
    "anchor": "conflicts",
    "startLine": 126,
    "endLine": 132,
    "sha256": "7febb2ac308322dc2063a782fd95afec1876548b701167873c4c6f88e3a1f8de",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### conflicts\n\n- **Runs when:** invoked with no argument.\n- **What changes:** nothing — read-only, suggests only, never re-slices work itself.\n- **Side effects:** none.\n- **Afterwards:** the person sees pairs of ready items whose file footprints overlap, with the shared paths.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-018

Source digest (evidence JSON): 02bf9e475e9cfba35be15fd06fe15ea5d809260c88c3d8df018cce95c5b1fd69
Target digest: none

```json
{
  "entryId": "liveness-04-018",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "Actors & Access",
    "anchor": "actors-access",
    "startLine": 133,
    "endLine": 143,
    "sha256": "7c46c73143c228d36b372aebdbf0f09c9c7cbac1c99ac40ed2e6e7e66481689f",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Actors & Access\n\n| Capability | Person in a Claude Code session |\n|---|---|\n| Submit / pick / move / return / ask / answer (mutating verbs) | ✓ |\n| Read frontier / staleness / rollup / check / graph / conflicts | ✓ |\n\nEvery command runs as whatever role the underlying tool itself assigns (a\nhuman role for the mutating verbs) — the plugin layer introduces no separate\nrole model of its own.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-019

Source digest (evidence JSON): 66198b296b5b729e07f52f65f3442dda2f887713bbf639b3417730471bc983c6
Target digest: none

```json
{
  "entryId": "liveness-04-019",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "Business Rules",
    "anchor": "business-rules",
    "startLine": 144,
    "endLine": 150,
    "sha256": "c9729ae39b00e11fea9c4e6bf50b6fe9855c76d243c5b722f5516cfb88ea8d5e",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Business Rules\n\n- **R1.** The plugin wraps exactly 12 verbs total: `submit`, `pick` (existing) plus `move`, `return`, `ask`, `answer` (manipulate), `ready`, `stale`, `rollup` (monitor), `check`, `graph`, `conflicts` (inspect) — added deliberately to cover convenience for manipulating, monitoring, and inspecting work, not to mirror every command the underlying tool exposes (per 7574fe5a).\n- **R2.** Every command is one-door-write: it only ever shells out to the underlying tool's own command for that verb — it never writes the work-item store directly.\n- **R3.** On a failing command, the person sees the real error and the command stops — it never retries with a guessed argument and never falls back silently.\n- **R4 (not yet implemented — see `docs/backlog.md`).** The remaining verbs the underlying tool exposes (`init`, `add`, `discover`, `compound`, `edit`, `decision`, `list`, `rebuild`, `repair`, `take`, `review`, `approve`, `reject`, `catchup`, `evolve`, `triage`, `docs-index`, `doc-sources`, `session`) have no plugin wrapper; a person needs them must use the underlying tool directly.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-020

Source digest (evidence JSON): f195d35ad2bf4003b4b07ce37b19d3414eabc864f6f4d590b0d44fcfb5f4ce95
Target digest: none

```json
{
  "entryId": "liveness-04-020",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "Edge Cases Settled",
    "anchor": "edge-cases-settled",
    "startLine": 151,
    "endLine": 155,
    "sha256": "bbd73b1c0f278ef0e1e0e648c101efee88d6130210f488762a433c6290a98aaf",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Edge Cases Settled\n\n- An empty required argument (`move` missing a target status, `ask`/`answer` missing text, `submit` missing a description) is never guessed or silently skipped — the person is asked, or the command stops and shows the underlying tool's own error.\n- An id argument that does not exist is not pre-validated by the plugin layer — the underlying tool's own error surfaces verbatim.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-021

Source digest (evidence JSON): 7f1a58086732538e8e6d7dbd4b96bb4baec82eec59ccff06f85d831a61cdba18
Target digest: none

```json
{
  "entryId": "liveness-04-021",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "Open Gaps",
    "anchor": "open-gaps",
    "startLine": 156,
    "endLine": 159,
    "sha256": "e9077aeb77c46050f162d058242b7e21276116aa47fc75de766baefe2991535d",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Open Gaps\n\n- none — every entry point, behavior, and rule above is evidenced against the shipped skill files and the underlying tool's source.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-022

Source digest (evidence JSON): 665eec7faa82fce976402a8e2bfc33a678276766e8625470437dad5898fa12e2
Target digest: none

```json
{
  "entryId": "liveness-04-022",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "Visuals",
    "anchor": "visuals",
    "startLine": 160,
    "endLine": 163,
    "sha256": "de7664c9640c6c0e014d51d81f0b9e3fffc676325b920db71296e72c05056a1d",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Visuals\n\nNot applicable — no screen; this is a command-line/chat interaction surface.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-04-023

Source digest (evidence JSON): fb9540a5faf9b5f3093bf6af3a8ec6ed29ae51725bcbfc3c0c30f8c761021457
Target digest: none

```json
{
  "entryId": "liveness-04-023",
  "source": "docs/specs/fgos-plugin.md",
  "sourceBlob": "fd3609b13dd023c66767db856f0b767315b952fa",
  "section": {
    "heading": "Pointers (implementation)",
    "anchor": "pointers-implementation",
    "startLine": 164,
    "endLine": 170,
    "sha256": "c7295825911c64692684339f252f1c6e50a3eb083f110c3fda5364d2321d43a8",
    "classification": "current-by-default",
    "directReferenceCount": 6,
    "implementationPaths": [
      "bin/fgos.mjs"
    ],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Pointers (implementation)\n\n- `repo/plugins/fgOS/.claude-plugin/plugin.json` — plugin manifest (name, description, version).\n- `repo/plugins/fgOS/skills/<verb>/SKILL.md` — one skill per verb (`submit`, `pick`, `move`, `return`, `ask`, `answer`, `ready`, `stale`, `rollup`, `check`, `graph`, `conflicts`); each wraps `fgos <verb> ...`, resolved via the project-local `bin/fgos.mjs` when present, else a global PATH install of `fgos`, else a clear stated error (tsk-1no) — never a raw Node \"Cannot find module\".\n- `repo/bin/fgos.mjs` — the underlying CLI every wrapper shells out to; owns argument validation and all lifecycle enforcement.\n- `docs/specs/work-state.md` — the lifecycle/FSM meaning behind `move`/`return`/`ask`/`answer` and every other verb's business rules.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 61,
      "text": "| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5941,
      "text": "    \"docs/specs/fgos-plugin.md\": {"
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 60,
      "text": "| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |"
    },
    {
      "path": "docs/specs/system-overview.md",
      "line": 19,
      "text": "- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 35,
      "text": "- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md"
    }
  ],
  "sourceSHA256": "2e7632ffbcbaae5c7ba4e3c7d6e0a3e7fe888ee278b5bc0bf9039f3ff276b687"
}
```


## liveness-05-001

Source digest (evidence JSON): c351d98c1b9b61fd4b772d8e4d7e90286fbbb864b72929b53bda17009068a482
Target digest: none

```json
{
  "entryId": "liveness-05-001",
  "source": "docs/specs/herdr-web-dashboard.md",
  "sourceBlob": "e7edb5668119e67384175cace620459e97175ddd",
  "section": {
    "heading": "Preamble",
    "anchor": "preamble",
    "startLine": 1,
    "endLine": 8,
    "sha256": "d3610caef114bfb55cb6c746b99e6971fd2ed6cbd437d4df02128d97c7ba2ce2",
    "classification": "current-by-default",
    "directReferenceCount": 22,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "---\narea: herdr-web-dashboard\nupdated: 2026-10-04\nsources: [herdr-web-dashboard, fgos-interface-daemon]\ndecisions: []\ncoverage: partial\n---\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "apps/fgos-gateway/web/src/api/errors.ts",
      "line": 3,
      "text": "// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 62,
      "text": "| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5947,
      "text": "    \"docs/specs/herdr-web-dashboard.md\": {"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 217,
      "text": "      \"path\": \"docs/specs/herdr-web-dashboard.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 61,
      "text": "| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |"
    },
    {
      "path": "docs/ui-spec/00-overview.md",
      "line": 13,
      "text": "**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area"
    },
    {
      "path": "docs/ui-spec/spec.config.yaml",
      "line": 3,
      "text": "# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)."
    },
    {
      "path": "docs/ui-spec/screens/S01-sign-in.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one"
    },
    {
      "path": "docs/ui-spec/screens/S02-taskboard.md",
      "line": 21,
      "text": "regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/screens/S03-task-detail.md",
      "line": 19,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View a task's detail)."
    },
    {
      "path": "docs/ui-spec/screens/S04-questions-needing-answer.md",
      "line": 19,
      "text": "`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point"
    },
    {
      "path": "docs/ui-spec/30-states-and-errors.md",
      "line": 30,
      "text": "(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled)."
    },
    {
      "path": "docs/ui-spec/modals/M03-add-edit-item.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item)."
    },
    {
      "path": "docs/ui-spec/modals/M02-approve-merge.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its"
    },
    {
      "path": "docs/ui-spec/modals/M01-answer-question.md",
      "line": 21,
      "text": "against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question)."
    },
    {
      "path": "docs/ui-spec/20-domain-rules.md",
      "line": 10,
      "text": "Every rule here is taken from `docs/specs/herdr-web-dashboard.md`"
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 21,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 46,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Retire a work item)."
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 36,
      "text": "- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)"
    },
    {
      "path": "docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md",
      "line": 10,
      "text": "**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec."
    },
    {
      "path": "docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md",
      "line": 13,
      "text": "spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own"
    }
  ],
  "sourceSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
}
```


## liveness-05-002

Source digest (evidence JSON): 4f0c5ec3680d9ad09205cf32907d6bd8683d67e5b4bcc67fb82ca11ff7ed203d
Target digest: none

```json
{
  "entryId": "liveness-05-002",
  "source": "docs/specs/herdr-web-dashboard.md",
  "sourceBlob": "e7edb5668119e67384175cace620459e97175ddd",
  "section": {
    "heading": "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "anchor": "spec-herdr-web-dashboard-browser-surface-for-fgos-work",
    "startLine": 9,
    "endLine": 10,
    "sha256": "7d13e6b7552fc7a821b4396d90b0db02c32ece2911ce86c01b8aebfc146109a2",
    "classification": "current-by-default",
    "directReferenceCount": 22,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "# Spec: herdr Web Dashboard (browser surface for fgOS work)\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "apps/fgos-gateway/web/src/api/errors.ts",
      "line": 3,
      "text": "// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 62,
      "text": "| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5947,
      "text": "    \"docs/specs/herdr-web-dashboard.md\": {"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 217,
      "text": "      \"path\": \"docs/specs/herdr-web-dashboard.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 61,
      "text": "| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |"
    },
    {
      "path": "docs/ui-spec/00-overview.md",
      "line": 13,
      "text": "**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area"
    },
    {
      "path": "docs/ui-spec/spec.config.yaml",
      "line": 3,
      "text": "# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)."
    },
    {
      "path": "docs/ui-spec/screens/S01-sign-in.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one"
    },
    {
      "path": "docs/ui-spec/screens/S02-taskboard.md",
      "line": 21,
      "text": "regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/screens/S03-task-detail.md",
      "line": 19,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View a task's detail)."
    },
    {
      "path": "docs/ui-spec/screens/S04-questions-needing-answer.md",
      "line": 19,
      "text": "`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point"
    },
    {
      "path": "docs/ui-spec/30-states-and-errors.md",
      "line": 30,
      "text": "(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled)."
    },
    {
      "path": "docs/ui-spec/modals/M03-add-edit-item.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item)."
    },
    {
      "path": "docs/ui-spec/modals/M02-approve-merge.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its"
    },
    {
      "path": "docs/ui-spec/modals/M01-answer-question.md",
      "line": 21,
      "text": "against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question)."
    },
    {
      "path": "docs/ui-spec/20-domain-rules.md",
      "line": 10,
      "text": "Every rule here is taken from `docs/specs/herdr-web-dashboard.md`"
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 21,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 46,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Retire a work item)."
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 36,
      "text": "- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)"
    },
    {
      "path": "docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md",
      "line": 10,
      "text": "**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec."
    },
    {
      "path": "docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md",
      "line": 13,
      "text": "spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own"
    }
  ],
  "sourceSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
}
```


## liveness-05-003

Source digest (evidence JSON): 1d22ca318651df8a637f37a4d0ef92e05d39be95b5e1cf836b9360664a7e125a
Target digest: none

```json
{
  "entryId": "liveness-05-003",
  "source": "docs/specs/herdr-web-dashboard.md",
  "sourceBlob": "e7edb5668119e67384175cace620459e97175ddd",
  "section": {
    "heading": "Purpose",
    "anchor": "purpose",
    "startLine": 11,
    "endLine": 41,
    "sha256": "54ce18dc48e4c95eac09cd8346f0684fc9914741dbec0ef11788c6fd1fcb3ff5",
    "classification": "current-by-default",
    "directReferenceCount": 22,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Purpose\n\nThe web dashboard is a browser surface for watching fgOS work and answering\nthe questions it raises, from a device that is not the developer's machine.\n\nThe need it exists for is concrete, and it is the reason the design looks the\nway it does: the product owner wants to **review and approve from a phone**,\nand at exactly that moment there is usually no cockpit terminal open\n(rationale: `docs/history/herdr-web-dashboard/CONTEXT.md`'s own rationale section for the child-process decision — the dashboard runs as a child process that outlives the cockpit pane, precisely so it does not vanish when the terminal closes). A surface that\nonly lives as long as a terminal pane is absent precisely when it is needed.\n\nThree things bound this surface:\n\n- It runs **alongside** the herdr TUI, never replacing it (boundary: the web dashboard belongs to the fgos gateway, `apps/fgos-gateway/`; it runs alongside, not instead of, the `herdr-dashboard` TUI plugin). A\n  person at a terminal keeps the TUI; the dashboard serves the person who is\n  not at one.\n- It is an **independent client project**, not server code inside the gateway\n  (per fgos-interface-daemon — gateway and TUI sit behind hexagonal ports; the web client is a separate adapter calling in from outside). Its source lives at `apps/fgos-gateway/web/`; the fgos gateway embeds the built bundle and serves it, which is hosting, not ownership of any API logic. It calls the gateway's REST/RPC API from the outside,\n  which is what decision `0014` requires of any non-terminal UI. An earlier\n  decision of this feature (tsk-ldb's own — web dashboard as a new subsystem inside the former single herdr crate) proposed embedding an HTTP server\n  directly in the former combined gateway-and-TUI binary (since split into `fgos-gateway` and `herdr-dashboard`); that branch is closed — cite fgos-interface-daemon's hexagonal-ports decision, not\n  tsk-ldb's original one, for where the web client lives.\n- It never becomes a second write path. Every change it makes goes through\n  an fgOS one-door-write verb executed by the gateway (R2 below).\n\n**Out of scope for this spec.** Question authoring quality at the source\n(`tsk-539`, deliberately decoupled — tsk-ldb and tsk-539 stay scope-separated). Multi-project port/identity\nmechanics (`tsk-3b0` — multi-project port/identity handling is deferred to tsk-3b0). The concrete visual layout, colour and\ntypography (`tsk-3x6`, `docs/reference/herdr-web-dashboard-layout.md`) — this\nspec states what an actor expects to be able to do, never how it is drawn.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "apps/fgos-gateway/web/src/api/errors.ts",
      "line": 3,
      "text": "// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 62,
      "text": "| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5947,
      "text": "    \"docs/specs/herdr-web-dashboard.md\": {"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 217,
      "text": "      \"path\": \"docs/specs/herdr-web-dashboard.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 61,
      "text": "| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |"
    },
    {
      "path": "docs/ui-spec/00-overview.md",
      "line": 13,
      "text": "**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area"
    },
    {
      "path": "docs/ui-spec/spec.config.yaml",
      "line": 3,
      "text": "# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)."
    },
    {
      "path": "docs/ui-spec/screens/S01-sign-in.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one"
    },
    {
      "path": "docs/ui-spec/screens/S02-taskboard.md",
      "line": 21,
      "text": "regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/screens/S03-task-detail.md",
      "line": 19,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View a task's detail)."
    },
    {
      "path": "docs/ui-spec/screens/S04-questions-needing-answer.md",
      "line": 19,
      "text": "`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point"
    },
    {
      "path": "docs/ui-spec/30-states-and-errors.md",
      "line": 30,
      "text": "(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled)."
    },
    {
      "path": "docs/ui-spec/modals/M03-add-edit-item.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item)."
    },
    {
      "path": "docs/ui-spec/modals/M02-approve-merge.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its"
    },
    {
      "path": "docs/ui-spec/modals/M01-answer-question.md",
      "line": 21,
      "text": "against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question)."
    },
    {
      "path": "docs/ui-spec/20-domain-rules.md",
      "line": 10,
      "text": "Every rule here is taken from `docs/specs/herdr-web-dashboard.md`"
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 21,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 46,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Retire a work item)."
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 36,
      "text": "- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)"
    },
    {
      "path": "docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md",
      "line": 10,
      "text": "**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec."
    },
    {
      "path": "docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md",
      "line": 13,
      "text": "spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own"
    }
  ],
  "sourceSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
}
```


## liveness-05-004

Source digest (evidence JSON): 08fd14cf628b733eff926d80bb317c4322867badd52c6a919edd58d7bee83c2b
Target digest: none

```json
{
  "entryId": "liveness-05-004",
  "source": "docs/specs/herdr-web-dashboard.md",
  "sourceBlob": "e7edb5668119e67384175cace620459e97175ddd",
  "section": {
    "heading": "Entry Points & Triggers",
    "anchor": "entry-points-triggers",
    "startLine": 42,
    "endLine": 63,
    "sha256": "66bb85fee5fc0b01cfd9760d07772a8d53df30744bb8b01f587ce406096a5ee8",
    "classification": "current-by-default",
    "directReferenceCount": 22,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Entry Points & Triggers\n\n- **Open the dashboard.** A person opens the dashboard's address in a browser\n  on any device that can reach the machine. The first interaction is always\n  sign-in; there is no anonymous view (mandatory token auth from v1, not deferred to a later version).\n- **Open the taskboard.** The default landing surface once signed in: every\n  work item on the connected project, grouped so the person can see state at a\n  glance.\n- **Open one task's detail.** From the taskboard, or directly by address.\n- **Open \"questions needing answer\".** The list of everything currently\n  waiting on a person — covering **both** channels, `ask` questions and\n  `gate-approve` questions (question-needing-answer covers both channels), not just the `ask` channel.\n- **Availability trigger (not a person's action).** The dashboard is reachable\n  whenever its own process is running. That process is started and stopped\n  from the cockpit but **outlives the cockpit pane** — closing the cockpit does\n  not stop the dashboard (it runs as a child process outliving the cockpit pane). It is enabled by default (its own config toggle defaults ON, unlike other auto-launch toggles), listens on the\n  configured bind address (default reaches beyond loopback — binds 0.0.0.0 by default, bind address configurable, warns when non-loopback) and on port\n  8788 (its config section carries a port field, defaulting to 8788).\n- **No outbound trigger exists.** Nothing notifies the person that a question\n  is waiting; they have to come and look. A push/attention channel is a\n  different, unbuilt capability (`docs/io-contract.md` §Ranh giới — STR48).\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "apps/fgos-gateway/web/src/api/errors.ts",
      "line": 3,
      "text": "// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 62,
      "text": "| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5947,
      "text": "    \"docs/specs/herdr-web-dashboard.md\": {"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 217,
      "text": "      \"path\": \"docs/specs/herdr-web-dashboard.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 61,
      "text": "| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |"
    },
    {
      "path": "docs/ui-spec/00-overview.md",
      "line": 13,
      "text": "**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area"
    },
    {
      "path": "docs/ui-spec/spec.config.yaml",
      "line": 3,
      "text": "# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)."
    },
    {
      "path": "docs/ui-spec/screens/S01-sign-in.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one"
    },
    {
      "path": "docs/ui-spec/screens/S02-taskboard.md",
      "line": 21,
      "text": "regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/screens/S03-task-detail.md",
      "line": 19,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View a task's detail)."
    },
    {
      "path": "docs/ui-spec/screens/S04-questions-needing-answer.md",
      "line": 19,
      "text": "`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point"
    },
    {
      "path": "docs/ui-spec/30-states-and-errors.md",
      "line": 30,
      "text": "(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled)."
    },
    {
      "path": "docs/ui-spec/modals/M03-add-edit-item.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item)."
    },
    {
      "path": "docs/ui-spec/modals/M02-approve-merge.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its"
    },
    {
      "path": "docs/ui-spec/modals/M01-answer-question.md",
      "line": 21,
      "text": "against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question)."
    },
    {
      "path": "docs/ui-spec/20-domain-rules.md",
      "line": 10,
      "text": "Every rule here is taken from `docs/specs/herdr-web-dashboard.md`"
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 21,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 46,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Retire a work item)."
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 36,
      "text": "- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)"
    },
    {
      "path": "docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md",
      "line": 10,
      "text": "**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec."
    },
    {
      "path": "docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md",
      "line": 13,
      "text": "spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own"
    }
  ],
  "sourceSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
}
```


## liveness-05-005

Source digest (evidence JSON): 20289b32bd6bf2f0ca786f23e83432bbe139d27c7332a19d4911431cc961e409
Target digest: none

```json
{
  "entryId": "liveness-05-005",
  "source": "docs/specs/herdr-web-dashboard.md",
  "sourceBlob": "e7edb5668119e67384175cace620459e97175ddd",
  "section": {
    "heading": "Data Dictionary",
    "anchor": "data-dictionary",
    "startLine": 64,
    "endLine": 78,
    "sha256": "361df26ec8fbd59090c25bf55eb0cda9537e5135398ae8bf0acb571b6819124e",
    "classification": "current-by-default",
    "directReferenceCount": 22,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Data Dictionary\n\n| # | Element | Meaning | Values | Required | Default |\n|---|---------|---------|--------|----------|---------|\n| 1 | Work item | One unit of tracked work, as fgOS defines it | see `docs/specs/work-state.md` — this surface introduces no new item shape | — | — |\n| 2 | Status | Where the item sits in its lifecycle | fgOS's own status set (`todo`, `doing`, `awaiting-human`, `awaiting-approval`, `blocked`, `delivered`, `retrospective`, `cleanup`, `done`, `wontfix`) | yes | — |\n| 3 | Stage | Where the item sits within the front of its lifecycle | the item's own domain's stage list | no (frozen from `awaiting-approval` on) | — |\n| 4 | Question needing an answer | One thing waiting on a person; the union of the two channels | an `ask` question, or a `gate-approve` question (`contextApprove`/`planApprove`/`validateApprove`) | — | — |\n| 5 | Answer | The person's reply that releases a waiting item | free text | yes, to answer | — |\n| 6 | Agent work history | What the agent actually did on this item | narrative from the item's own `CONTEXT.md`/`plan.md` is the primary source; the machine-side decision log is expandable detail, not shown by default | — | narrative shown, machine log collapsed |\n| 7 | Question/answer timeline | Questions paired with their answers across repeated park rounds | pairing is positional — the i-th recorded question pairs with the i-th recorded answer, ordered by sequence number | — | — |\n| 8 | Sign-in session | Proof that this browser may act | a session established by presenting the machine token once | yes | — |\n| 9 | Machine token | The single credential guarding the surface | resolved from the environment first, otherwise from a generated local secret file that is never committed | yes | generated on first run |\n| 10 | Gateway endpoint | The gateway instance this client is talking to | an address; the client is built to hold **more than one** (per fgos-interface-daemon — a future desktop client aggregates one gateway per machine) | yes | — |\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "apps/fgos-gateway/web/src/api/errors.ts",
      "line": 3,
      "text": "// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 62,
      "text": "| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5947,
      "text": "    \"docs/specs/herdr-web-dashboard.md\": {"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 217,
      "text": "      \"path\": \"docs/specs/herdr-web-dashboard.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 61,
      "text": "| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |"
    },
    {
      "path": "docs/ui-spec/00-overview.md",
      "line": 13,
      "text": "**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area"
    },
    {
      "path": "docs/ui-spec/spec.config.yaml",
      "line": 3,
      "text": "# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)."
    },
    {
      "path": "docs/ui-spec/screens/S01-sign-in.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one"
    },
    {
      "path": "docs/ui-spec/screens/S02-taskboard.md",
      "line": 21,
      "text": "regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/screens/S03-task-detail.md",
      "line": 19,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View a task's detail)."
    },
    {
      "path": "docs/ui-spec/screens/S04-questions-needing-answer.md",
      "line": 19,
      "text": "`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point"
    },
    {
      "path": "docs/ui-spec/30-states-and-errors.md",
      "line": 30,
      "text": "(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled)."
    },
    {
      "path": "docs/ui-spec/modals/M03-add-edit-item.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item)."
    },
    {
      "path": "docs/ui-spec/modals/M02-approve-merge.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its"
    },
    {
      "path": "docs/ui-spec/modals/M01-answer-question.md",
      "line": 21,
      "text": "against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question)."
    },
    {
      "path": "docs/ui-spec/20-domain-rules.md",
      "line": 10,
      "text": "Every rule here is taken from `docs/specs/herdr-web-dashboard.md`"
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 21,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 46,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Retire a work item)."
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 36,
      "text": "- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)"
    },
    {
      "path": "docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md",
      "line": 10,
      "text": "**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec."
    },
    {
      "path": "docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md",
      "line": 13,
      "text": "spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own"
    }
  ],
  "sourceSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
}
```


## liveness-05-006

Source digest (evidence JSON): ecaafede6f7075235ae0a8d105d0c4b6e99ef1b123affafdd07168d30c3c14b0
Target digest: none

```json
{
  "entryId": "liveness-05-006",
  "source": "docs/specs/herdr-web-dashboard.md",
  "sourceBlob": "e7edb5668119e67384175cace620459e97175ddd",
  "section": {
    "heading": "Behaviors & Operations",
    "anchor": "behaviors-operations",
    "startLine": 79,
    "endLine": 83,
    "sha256": "d746ad53fa37fea75ba7391878c8ecb2405c5b1534ab2a1ba6ca27d38860f6e3",
    "classification": "current-by-default",
    "directReferenceCount": 22,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Behaviors & Operations\n\nEach operation below states the verb it goes through. That is load-bearing,\nnot decoration: the dashboard never writes fgOS state itself (R2).\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "apps/fgos-gateway/web/src/api/errors.ts",
      "line": 3,
      "text": "// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 62,
      "text": "| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5947,
      "text": "    \"docs/specs/herdr-web-dashboard.md\": {"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 217,
      "text": "      \"path\": \"docs/specs/herdr-web-dashboard.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 61,
      "text": "| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |"
    },
    {
      "path": "docs/ui-spec/00-overview.md",
      "line": 13,
      "text": "**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area"
    },
    {
      "path": "docs/ui-spec/spec.config.yaml",
      "line": 3,
      "text": "# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)."
    },
    {
      "path": "docs/ui-spec/screens/S01-sign-in.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one"
    },
    {
      "path": "docs/ui-spec/screens/S02-taskboard.md",
      "line": 21,
      "text": "regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/screens/S03-task-detail.md",
      "line": 19,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View a task's detail)."
    },
    {
      "path": "docs/ui-spec/screens/S04-questions-needing-answer.md",
      "line": 19,
      "text": "`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point"
    },
    {
      "path": "docs/ui-spec/30-states-and-errors.md",
      "line": 30,
      "text": "(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled)."
    },
    {
      "path": "docs/ui-spec/modals/M03-add-edit-item.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item)."
    },
    {
      "path": "docs/ui-spec/modals/M02-approve-merge.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its"
    },
    {
      "path": "docs/ui-spec/modals/M01-answer-question.md",
      "line": 21,
      "text": "against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question)."
    },
    {
      "path": "docs/ui-spec/20-domain-rules.md",
      "line": 10,
      "text": "Every rule here is taken from `docs/specs/herdr-web-dashboard.md`"
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 21,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 46,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Retire a work item)."
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 36,
      "text": "- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)"
    },
    {
      "path": "docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md",
      "line": 10,
      "text": "**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec."
    },
    {
      "path": "docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md",
      "line": 13,
      "text": "spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own"
    }
  ],
  "sourceSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
}
```


## liveness-05-007

Source digest (evidence JSON): e6cb834a892b890393ab485aa853481c580ebec81978b0fe0850559c8d87817f
Target digest: none

```json
{
  "entryId": "liveness-05-007",
  "source": "docs/specs/herdr-web-dashboard.md",
  "sourceBlob": "e7edb5668119e67384175cace620459e97175ddd",
  "section": {
    "heading": "Sign in",
    "anchor": "sign-in",
    "startLine": 84,
    "endLine": 93,
    "sha256": "f9d4cbcc7b870c50331eb01e28f387d3bc3934ed1726e7d71ff5fa9c71931514",
    "classification": "current-by-default",
    "directReferenceCount": 22,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### Sign in\n\n- **Blocked when:** the presented credential does not match. Every failure —\n  wrong token, malformed request, unknown route — looks identical from\n  outside: the surface gives back nothing that distinguishes \"wrong token\"\n  from \"nothing here\" (every auth failure returns an opaque 404, never 401).\n- **What changes:** a session is established for this browser.\n- **Side effects:** none on work state.\n- **Afterwards:** the person lands on the taskboard.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "apps/fgos-gateway/web/src/api/errors.ts",
      "line": 3,
      "text": "// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 62,
      "text": "| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5947,
      "text": "    \"docs/specs/herdr-web-dashboard.md\": {"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 217,
      "text": "      \"path\": \"docs/specs/herdr-web-dashboard.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 61,
      "text": "| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |"
    },
    {
      "path": "docs/ui-spec/00-overview.md",
      "line": 13,
      "text": "**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area"
    },
    {
      "path": "docs/ui-spec/spec.config.yaml",
      "line": 3,
      "text": "# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)."
    },
    {
      "path": "docs/ui-spec/screens/S01-sign-in.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one"
    },
    {
      "path": "docs/ui-spec/screens/S02-taskboard.md",
      "line": 21,
      "text": "regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/screens/S03-task-detail.md",
      "line": 19,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View a task's detail)."
    },
    {
      "path": "docs/ui-spec/screens/S04-questions-needing-answer.md",
      "line": 19,
      "text": "`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point"
    },
    {
      "path": "docs/ui-spec/30-states-and-errors.md",
      "line": 30,
      "text": "(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled)."
    },
    {
      "path": "docs/ui-spec/modals/M03-add-edit-item.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item)."
    },
    {
      "path": "docs/ui-spec/modals/M02-approve-merge.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its"
    },
    {
      "path": "docs/ui-spec/modals/M01-answer-question.md",
      "line": 21,
      "text": "against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question)."
    },
    {
      "path": "docs/ui-spec/20-domain-rules.md",
      "line": 10,
      "text": "Every rule here is taken from `docs/specs/herdr-web-dashboard.md`"
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 21,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 46,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Retire a work item)."
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 36,
      "text": "- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)"
    },
    {
      "path": "docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md",
      "line": 10,
      "text": "**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec."
    },
    {
      "path": "docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md",
      "line": 13,
      "text": "spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own"
    }
  ],
  "sourceSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
}
```


## liveness-05-008

Source digest (evidence JSON): f048ad8d5cf25645dc3e95b95af71965a1f946afc2028ea770097568b76bd8fe
Target digest: none

```json
{
  "entryId": "liveness-05-008",
  "source": "docs/specs/herdr-web-dashboard.md",
  "sourceBlob": "e7edb5668119e67384175cace620459e97175ddd",
  "section": {
    "heading": "View the taskboard",
    "anchor": "view-the-taskboard",
    "startLine": 94,
    "endLine": 105,
    "sha256": "6c758b4444278319890f440b8e2a0d6029e2f5be3c7ac02fc3fab7437b58f276",
    "classification": "current-by-default",
    "directReferenceCount": 22,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### View the taskboard\n\n- **Blocked when:** not signed in.\n- **What changes:** nothing — this is a read.\n- **Side effects:** none.\n- **Afterwards:** the person sees every work item on the connected project.\n  **The actor-facing expectation is a board, not a flat table** — the\n  reference experience is Monday.com/ClickUp: items grouped by status, state\n  legible at a glance, quick actions reachable in place without opening the\n  item, and controls to filter and regroup. What that looks like concretely —\n  layout, colour, spacing, typography — belongs to `tsk-3x6`, not here.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "apps/fgos-gateway/web/src/api/errors.ts",
      "line": 3,
      "text": "// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 62,
      "text": "| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5947,
      "text": "    \"docs/specs/herdr-web-dashboard.md\": {"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 217,
      "text": "      \"path\": \"docs/specs/herdr-web-dashboard.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 61,
      "text": "| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |"
    },
    {
      "path": "docs/ui-spec/00-overview.md",
      "line": 13,
      "text": "**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area"
    },
    {
      "path": "docs/ui-spec/spec.config.yaml",
      "line": 3,
      "text": "# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)."
    },
    {
      "path": "docs/ui-spec/screens/S01-sign-in.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one"
    },
    {
      "path": "docs/ui-spec/screens/S02-taskboard.md",
      "line": 21,
      "text": "regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/screens/S03-task-detail.md",
      "line": 19,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View a task's detail)."
    },
    {
      "path": "docs/ui-spec/screens/S04-questions-needing-answer.md",
      "line": 19,
      "text": "`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point"
    },
    {
      "path": "docs/ui-spec/30-states-and-errors.md",
      "line": 30,
      "text": "(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled)."
    },
    {
      "path": "docs/ui-spec/modals/M03-add-edit-item.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item)."
    },
    {
      "path": "docs/ui-spec/modals/M02-approve-merge.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its"
    },
    {
      "path": "docs/ui-spec/modals/M01-answer-question.md",
      "line": 21,
      "text": "against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question)."
    },
    {
      "path": "docs/ui-spec/20-domain-rules.md",
      "line": 10,
      "text": "Every rule here is taken from `docs/specs/herdr-web-dashboard.md`"
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 21,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 46,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Retire a work item)."
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 36,
      "text": "- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)"
    },
    {
      "path": "docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md",
      "line": 10,
      "text": "**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec."
    },
    {
      "path": "docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md",
      "line": 13,
      "text": "spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own"
    }
  ],
  "sourceSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
}
```


## liveness-05-009

Source digest (evidence JSON): 857b40ae5f289da2150830ee9d9837ce85cc897d426420454c83b373a5237fa6
Target digest: none

```json
{
  "entryId": "liveness-05-009",
  "source": "docs/specs/herdr-web-dashboard.md",
  "sourceBlob": "e7edb5668119e67384175cace620459e97175ddd",
  "section": {
    "heading": "View a task's detail",
    "anchor": "view-a-tasks-detail",
    "startLine": 106,
    "endLine": 116,
    "sha256": "fdeb82ca7226a08b7568b37694b32d931a8b2b6fdafee169d6085dec19183085",
    "classification": "current-by-default",
    "directReferenceCount": 22,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### View a task's detail\n\n- **Blocked when:** not signed in, or the item does not exist.\n- **What changes:** nothing — this is a read.\n- **Side effects:** none.\n- **Afterwards:** the person sees, for that one item: what the agent did\n  (narrative first, machine decision log available but collapsed), and\n  the question/answer timeline across however many rounds the item has been\n  parked. This screen is the core deliverable of the whole surface; the\n  taskboard exists mainly to reach it.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "apps/fgos-gateway/web/src/api/errors.ts",
      "line": 3,
      "text": "// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 62,
      "text": "| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5947,
      "text": "    \"docs/specs/herdr-web-dashboard.md\": {"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 217,
      "text": "      \"path\": \"docs/specs/herdr-web-dashboard.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 61,
      "text": "| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |"
    },
    {
      "path": "docs/ui-spec/00-overview.md",
      "line": 13,
      "text": "**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area"
    },
    {
      "path": "docs/ui-spec/spec.config.yaml",
      "line": 3,
      "text": "# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)."
    },
    {
      "path": "docs/ui-spec/screens/S01-sign-in.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one"
    },
    {
      "path": "docs/ui-spec/screens/S02-taskboard.md",
      "line": 21,
      "text": "regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/screens/S03-task-detail.md",
      "line": 19,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View a task's detail)."
    },
    {
      "path": "docs/ui-spec/screens/S04-questions-needing-answer.md",
      "line": 19,
      "text": "`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point"
    },
    {
      "path": "docs/ui-spec/30-states-and-errors.md",
      "line": 30,
      "text": "(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled)."
    },
    {
      "path": "docs/ui-spec/modals/M03-add-edit-item.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item)."
    },
    {
      "path": "docs/ui-spec/modals/M02-approve-merge.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its"
    },
    {
      "path": "docs/ui-spec/modals/M01-answer-question.md",
      "line": 21,
      "text": "against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question)."
    },
    {
      "path": "docs/ui-spec/20-domain-rules.md",
      "line": 10,
      "text": "Every rule here is taken from `docs/specs/herdr-web-dashboard.md`"
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 21,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 46,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Retire a work item)."
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 36,
      "text": "- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)"
    },
    {
      "path": "docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md",
      "line": 10,
      "text": "**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec."
    },
    {
      "path": "docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md",
      "line": 13,
      "text": "spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own"
    }
  ],
  "sourceSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
}
```


## liveness-05-010

Source digest (evidence JSON): 70de552cc54dfe2cfd09f6a6283ece39f1b283652817f64f603eeca39db02a86
Target digest: none

```json
{
  "entryId": "liveness-05-010",
  "source": "docs/specs/herdr-web-dashboard.md",
  "sourceBlob": "e7edb5668119e67384175cace620459e97175ddd",
  "section": {
    "heading": "Answer a parked question",
    "anchor": "answer-a-parked-question",
    "startLine": 117,
    "endLine": 132,
    "sha256": "0b879fe9891cb6d579a808346710fae72978ef63d94e3cb54b0bf2a63accbbd9",
    "classification": "current-by-default",
    "directReferenceCount": 22,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### Answer a parked question\n\n- **Blocked when:** not signed in; or the item is not actually waiting on a\n  person (its own lifecycle rules refuse the change, and that refusal is what\n  the person sees).\n- **What changes:** the answer is recorded and the item resumes, through the\n  fgOS `answer` verb.\n- **Side effects:** the item leaves the \"questions needing answer\" list.\n- **Afterwards:** the person sees the item's new state. Answering happens\n  **in place, on this surface** — the person is not sent to a terminal. This\n  settles the question left open when the question-needing-answer decision established only that the screen\n  *surfaces* both channels: the gateway is already the component that runs\n  fgOS write verbs on a client's behalf, and `answer` is named among them\n  (fgos-interface-daemon's own chokepoint decision), so sending the person out to a CLI would contradict the\n  contract this client is written against.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "apps/fgos-gateway/web/src/api/errors.ts",
      "line": 3,
      "text": "// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 62,
      "text": "| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5947,
      "text": "    \"docs/specs/herdr-web-dashboard.md\": {"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 217,
      "text": "      \"path\": \"docs/specs/herdr-web-dashboard.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 61,
      "text": "| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |"
    },
    {
      "path": "docs/ui-spec/00-overview.md",
      "line": 13,
      "text": "**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area"
    },
    {
      "path": "docs/ui-spec/spec.config.yaml",
      "line": 3,
      "text": "# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)."
    },
    {
      "path": "docs/ui-spec/screens/S01-sign-in.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one"
    },
    {
      "path": "docs/ui-spec/screens/S02-taskboard.md",
      "line": 21,
      "text": "regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/screens/S03-task-detail.md",
      "line": 19,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View a task's detail)."
    },
    {
      "path": "docs/ui-spec/screens/S04-questions-needing-answer.md",
      "line": 19,
      "text": "`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point"
    },
    {
      "path": "docs/ui-spec/30-states-and-errors.md",
      "line": 30,
      "text": "(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled)."
    },
    {
      "path": "docs/ui-spec/modals/M03-add-edit-item.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item)."
    },
    {
      "path": "docs/ui-spec/modals/M02-approve-merge.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its"
    },
    {
      "path": "docs/ui-spec/modals/M01-answer-question.md",
      "line": 21,
      "text": "against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question)."
    },
    {
      "path": "docs/ui-spec/20-domain-rules.md",
      "line": 10,
      "text": "Every rule here is taken from `docs/specs/herdr-web-dashboard.md`"
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 21,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 46,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Retire a work item)."
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 36,
      "text": "- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)"
    },
    {
      "path": "docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md",
      "line": 10,
      "text": "**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec."
    },
    {
      "path": "docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md",
      "line": 13,
      "text": "spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own"
    }
  ],
  "sourceSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
}
```


## liveness-05-011

Source digest (evidence JSON): 2fd78e26ff26e203c72a145665fdd30c75e246551c44da8c8826918d9de2ecb7
Target digest: none

```json
{
  "entryId": "liveness-05-011",
  "source": "docs/specs/herdr-web-dashboard.md",
  "sourceBlob": "e7edb5668119e67384175cace620459e97175ddd",
  "section": {
    "heading": "Approve a merge",
    "anchor": "approve-a-merge",
    "startLine": 133,
    "endLine": 145,
    "sha256": "10561a8a2c84bf49e2631b6e73acbbbfad75058178af23b388c62fb9b80a0fca",
    "classification": "current-by-default",
    "directReferenceCount": 22,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### Approve a merge\n\n- **Blocked when:** not signed in; or the item is not at the point where a\n  merge decision applies; or the gateway is not positioned to run the verb\n  (see R7 — `approve` refuses to run anywhere but the repository's main\n  working tree).\n- **What changes:** the merge decision is recorded and the merge is performed,\n  through the fgOS `approve` verb.\n- **Side effects:** **this changes trunk.** It is the only operation on this\n  surface that does, and it is the reason the exposure note in R8 exists.\n- **Afterwards:** the person sees the outcome, including a failure that left\n  the item blocked rather than merged.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "apps/fgos-gateway/web/src/api/errors.ts",
      "line": 3,
      "text": "// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 62,
      "text": "| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5947,
      "text": "    \"docs/specs/herdr-web-dashboard.md\": {"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 217,
      "text": "      \"path\": \"docs/specs/herdr-web-dashboard.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 61,
      "text": "| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |"
    },
    {
      "path": "docs/ui-spec/00-overview.md",
      "line": 13,
      "text": "**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area"
    },
    {
      "path": "docs/ui-spec/spec.config.yaml",
      "line": 3,
      "text": "# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)."
    },
    {
      "path": "docs/ui-spec/screens/S01-sign-in.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one"
    },
    {
      "path": "docs/ui-spec/screens/S02-taskboard.md",
      "line": 21,
      "text": "regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/screens/S03-task-detail.md",
      "line": 19,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View a task's detail)."
    },
    {
      "path": "docs/ui-spec/screens/S04-questions-needing-answer.md",
      "line": 19,
      "text": "`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point"
    },
    {
      "path": "docs/ui-spec/30-states-and-errors.md",
      "line": 30,
      "text": "(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled)."
    },
    {
      "path": "docs/ui-spec/modals/M03-add-edit-item.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item)."
    },
    {
      "path": "docs/ui-spec/modals/M02-approve-merge.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its"
    },
    {
      "path": "docs/ui-spec/modals/M01-answer-question.md",
      "line": 21,
      "text": "against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question)."
    },
    {
      "path": "docs/ui-spec/20-domain-rules.md",
      "line": 10,
      "text": "Every rule here is taken from `docs/specs/herdr-web-dashboard.md`"
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 21,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 46,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Retire a work item)."
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 36,
      "text": "- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)"
    },
    {
      "path": "docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md",
      "line": 10,
      "text": "**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec."
    },
    {
      "path": "docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md",
      "line": 13,
      "text": "spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own"
    }
  ],
  "sourceSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
}
```


## liveness-05-012

Source digest (evidence JSON): 66ece9b5ac67715ef866e20dfe9d2c1ecc02cf1eecfb69d243236e02f2ca252d
Target digest: none

```json
{
  "entryId": "liveness-05-012",
  "source": "docs/specs/herdr-web-dashboard.md",
  "sourceBlob": "e7edb5668119e67384175cace620459e97175ddd",
  "section": {
    "heading": "Add a work item",
    "anchor": "add-a-work-item",
    "startLine": 146,
    "endLine": 152,
    "sha256": "9504cbdcfe7941ad0d9fc59ebd15a189ff3ccbe701695d33ac062f6fe24ddbd3",
    "classification": "current-by-default",
    "directReferenceCount": 22,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### Add a work item\n\n- **Blocked when:** not signed in, or the description is empty.\n- **What changes:** a new work item is created through the fgOS intake verb.\n- **Side effects:** none beyond the new item.\n- **Afterwards:** the person sees the new item's id and its derived fields.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "apps/fgos-gateway/web/src/api/errors.ts",
      "line": 3,
      "text": "// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 62,
      "text": "| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5947,
      "text": "    \"docs/specs/herdr-web-dashboard.md\": {"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 217,
      "text": "      \"path\": \"docs/specs/herdr-web-dashboard.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 61,
      "text": "| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |"
    },
    {
      "path": "docs/ui-spec/00-overview.md",
      "line": 13,
      "text": "**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area"
    },
    {
      "path": "docs/ui-spec/spec.config.yaml",
      "line": 3,
      "text": "# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)."
    },
    {
      "path": "docs/ui-spec/screens/S01-sign-in.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one"
    },
    {
      "path": "docs/ui-spec/screens/S02-taskboard.md",
      "line": 21,
      "text": "regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/screens/S03-task-detail.md",
      "line": 19,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View a task's detail)."
    },
    {
      "path": "docs/ui-spec/screens/S04-questions-needing-answer.md",
      "line": 19,
      "text": "`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point"
    },
    {
      "path": "docs/ui-spec/30-states-and-errors.md",
      "line": 30,
      "text": "(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled)."
    },
    {
      "path": "docs/ui-spec/modals/M03-add-edit-item.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item)."
    },
    {
      "path": "docs/ui-spec/modals/M02-approve-merge.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its"
    },
    {
      "path": "docs/ui-spec/modals/M01-answer-question.md",
      "line": 21,
      "text": "against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question)."
    },
    {
      "path": "docs/ui-spec/20-domain-rules.md",
      "line": 10,
      "text": "Every rule here is taken from `docs/specs/herdr-web-dashboard.md`"
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 21,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 46,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Retire a work item)."
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 36,
      "text": "- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)"
    },
    {
      "path": "docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md",
      "line": 10,
      "text": "**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec."
    },
    {
      "path": "docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md",
      "line": 13,
      "text": "spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own"
    }
  ],
  "sourceSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
}
```


## liveness-05-013

Source digest (evidence JSON): fee261219d97f0df57b0301ccfdf20734f1062e98ea9f6807418ca41d4e4079e
Target digest: none

```json
{
  "entryId": "liveness-05-013",
  "source": "docs/specs/herdr-web-dashboard.md",
  "sourceBlob": "e7edb5668119e67384175cace620459e97175ddd",
  "section": {
    "heading": "Edit a work item",
    "anchor": "edit-a-work-item",
    "startLine": 153,
    "endLine": 160,
    "sha256": "f66363249ac730fb0ec6bfd9069f108519aad503540fc7ee3d4004b58c2f8185",
    "classification": "current-by-default",
    "directReferenceCount": 22,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### Edit a work item\n\n- **Blocked when:** not signed in, or the target item does not exist.\n- **What changes:** the named fields are overwritten through the fgOS `edit`\n  verb, which applies the same validation a terminal edit gets.\n- **Side effects:** none beyond the item.\n- **Afterwards:** the person sees the item's updated fields.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "apps/fgos-gateway/web/src/api/errors.ts",
      "line": 3,
      "text": "// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 62,
      "text": "| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5947,
      "text": "    \"docs/specs/herdr-web-dashboard.md\": {"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 217,
      "text": "      \"path\": \"docs/specs/herdr-web-dashboard.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 61,
      "text": "| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |"
    },
    {
      "path": "docs/ui-spec/00-overview.md",
      "line": 13,
      "text": "**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area"
    },
    {
      "path": "docs/ui-spec/spec.config.yaml",
      "line": 3,
      "text": "# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)."
    },
    {
      "path": "docs/ui-spec/screens/S01-sign-in.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one"
    },
    {
      "path": "docs/ui-spec/screens/S02-taskboard.md",
      "line": 21,
      "text": "regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/screens/S03-task-detail.md",
      "line": 19,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View a task's detail)."
    },
    {
      "path": "docs/ui-spec/screens/S04-questions-needing-answer.md",
      "line": 19,
      "text": "`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point"
    },
    {
      "path": "docs/ui-spec/30-states-and-errors.md",
      "line": 30,
      "text": "(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled)."
    },
    {
      "path": "docs/ui-spec/modals/M03-add-edit-item.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item)."
    },
    {
      "path": "docs/ui-spec/modals/M02-approve-merge.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its"
    },
    {
      "path": "docs/ui-spec/modals/M01-answer-question.md",
      "line": 21,
      "text": "against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question)."
    },
    {
      "path": "docs/ui-spec/20-domain-rules.md",
      "line": 10,
      "text": "Every rule here is taken from `docs/specs/herdr-web-dashboard.md`"
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 21,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 46,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Retire a work item)."
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 36,
      "text": "- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)"
    },
    {
      "path": "docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md",
      "line": 10,
      "text": "**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec."
    },
    {
      "path": "docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md",
      "line": 13,
      "text": "spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own"
    }
  ],
  "sourceSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
}
```


## liveness-05-014

Source digest (evidence JSON): 723a06ee9a40f12ac631c854e9b22649a051e768ddda37c41b2fe3324a8944d3
Target digest: none

```json
{
  "entryId": "liveness-05-014",
  "source": "docs/specs/herdr-web-dashboard.md",
  "sourceBlob": "e7edb5668119e67384175cace620459e97175ddd",
  "section": {
    "heading": "Retire a work item",
    "anchor": "retire-a-work-item",
    "startLine": 161,
    "endLine": 174,
    "sha256": "ad3bcb6e6531d49516ce263269296729d5ac115e75accab6124cdf39949893a7",
    "classification": "current-by-default",
    "directReferenceCount": 22,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### Retire a work item\n\n- **Blocked when:** not signed in; or the item is in a state its own\n  lifecycle rules will not retire from.\n- **What changes:** the item is moved to the terminal \"valid, but never going\n  to be done\" state, through the fgOS `move` verb.\n- **Side effects:** the item leaves the open-work lists.\n- **Afterwards:** the person sees it as retired. **This is retirement, not\n  deletion, and the difference is not cosmetic** — fgOS exposes no delete\n  operation at all, and its history is an append-only record, so nothing this\n  surface offers can erase an item or its past. A person who asks to \"delete\"\n  an item gets retirement, and the surface should say so in those words rather\n  than implying the record is gone.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "apps/fgos-gateway/web/src/api/errors.ts",
      "line": 3,
      "text": "// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 62,
      "text": "| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5947,
      "text": "    \"docs/specs/herdr-web-dashboard.md\": {"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 217,
      "text": "      \"path\": \"docs/specs/herdr-web-dashboard.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 61,
      "text": "| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |"
    },
    {
      "path": "docs/ui-spec/00-overview.md",
      "line": 13,
      "text": "**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area"
    },
    {
      "path": "docs/ui-spec/spec.config.yaml",
      "line": 3,
      "text": "# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)."
    },
    {
      "path": "docs/ui-spec/screens/S01-sign-in.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one"
    },
    {
      "path": "docs/ui-spec/screens/S02-taskboard.md",
      "line": 21,
      "text": "regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/screens/S03-task-detail.md",
      "line": 19,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View a task's detail)."
    },
    {
      "path": "docs/ui-spec/screens/S04-questions-needing-answer.md",
      "line": 19,
      "text": "`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point"
    },
    {
      "path": "docs/ui-spec/30-states-and-errors.md",
      "line": 30,
      "text": "(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled)."
    },
    {
      "path": "docs/ui-spec/modals/M03-add-edit-item.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item)."
    },
    {
      "path": "docs/ui-spec/modals/M02-approve-merge.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its"
    },
    {
      "path": "docs/ui-spec/modals/M01-answer-question.md",
      "line": 21,
      "text": "against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question)."
    },
    {
      "path": "docs/ui-spec/20-domain-rules.md",
      "line": 10,
      "text": "Every rule here is taken from `docs/specs/herdr-web-dashboard.md`"
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 21,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 46,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Retire a work item)."
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 36,
      "text": "- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)"
    },
    {
      "path": "docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md",
      "line": 10,
      "text": "**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec."
    },
    {
      "path": "docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md",
      "line": 13,
      "text": "spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own"
    }
  ],
  "sourceSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
}
```


## liveness-05-015

Source digest (evidence JSON): f0ec772138ecc403a1e0fc5874d3ec32afc7cc00a4787b84d4387bca3d922d92
Target digest: none

```json
{
  "entryId": "liveness-05-015",
  "source": "docs/specs/herdr-web-dashboard.md",
  "sourceBlob": "e7edb5668119e67384175cace620459e97175ddd",
  "section": {
    "heading": "Actors & Access",
    "anchor": "actors-access",
    "startLine": 175,
    "endLine": 197,
    "sha256": "0cdab9c9bd295438be1f7a37a55580fba2425173c1831dc97c0aaf97d7f5bc8a",
    "classification": "current-by-default",
    "directReferenceCount": 22,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Actors & Access\n\n| Capability | Holder of the machine's token |\n|---|---|\n| Read: taskboard, task detail, questions needing answer | ✓ |\n| Write: answer a question, add, edit, retire an item | ✓ |\n| Write: approve a merge (changes trunk) | ✓ |\n\n**There is exactly one technical actor, and this table is the whole access\nmodel.** That is a statement about what the system enforces, not about who is\nexpected to use it. Two consequences are worth naming plainly rather than\nleaving a reader to discover them:\n\n- **Product roles are not enforced roles.** \"The product owner reviewing from\n  a phone\" is who this surface is *for*; it is not a role the system can tell\n  apart from any other holder of the same credential.\n- **There is no finer grain to reach for.** fgOS deliberately has no\n  authorization layer — \"who may call which verb\" is a separate, unbuilt\n  capability (`docs/io-contract.md` §Ranh giới, STR38) — and the gateway's own\n  credential is one token covering the whole machine, not per project and not\n  per person (one token per machine, per fgos-interface-daemon's auth decision). So read access and trunk-changing access are the\n  same access. See Open Gaps.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "apps/fgos-gateway/web/src/api/errors.ts",
      "line": 3,
      "text": "// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 62,
      "text": "| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5947,
      "text": "    \"docs/specs/herdr-web-dashboard.md\": {"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 217,
      "text": "      \"path\": \"docs/specs/herdr-web-dashboard.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 61,
      "text": "| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |"
    },
    {
      "path": "docs/ui-spec/00-overview.md",
      "line": 13,
      "text": "**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area"
    },
    {
      "path": "docs/ui-spec/spec.config.yaml",
      "line": 3,
      "text": "# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)."
    },
    {
      "path": "docs/ui-spec/screens/S01-sign-in.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one"
    },
    {
      "path": "docs/ui-spec/screens/S02-taskboard.md",
      "line": 21,
      "text": "regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/screens/S03-task-detail.md",
      "line": 19,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View a task's detail)."
    },
    {
      "path": "docs/ui-spec/screens/S04-questions-needing-answer.md",
      "line": 19,
      "text": "`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point"
    },
    {
      "path": "docs/ui-spec/30-states-and-errors.md",
      "line": 30,
      "text": "(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled)."
    },
    {
      "path": "docs/ui-spec/modals/M03-add-edit-item.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item)."
    },
    {
      "path": "docs/ui-spec/modals/M02-approve-merge.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its"
    },
    {
      "path": "docs/ui-spec/modals/M01-answer-question.md",
      "line": 21,
      "text": "against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question)."
    },
    {
      "path": "docs/ui-spec/20-domain-rules.md",
      "line": 10,
      "text": "Every rule here is taken from `docs/specs/herdr-web-dashboard.md`"
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 21,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 46,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Retire a work item)."
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 36,
      "text": "- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)"
    },
    {
      "path": "docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md",
      "line": 10,
      "text": "**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec."
    },
    {
      "path": "docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md",
      "line": 13,
      "text": "spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own"
    }
  ],
  "sourceSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
}
```


## liveness-05-016

Source digest (evidence JSON): b69c8e75b92d83c1c39d57aba3c40c206047c53b28af29f0f5ecb72c6557158f
Target digest: none

```json
{
  "entryId": "liveness-05-016",
  "source": "docs/specs/herdr-web-dashboard.md",
  "sourceBlob": "e7edb5668119e67384175cace620459e97175ddd",
  "section": {
    "heading": "Business Rules",
    "anchor": "business-rules",
    "startLine": 198,
    "endLine": 245,
    "sha256": "7d7d0d5d83d38a23a8ff00e781a613cc18fd635b0a94b8f8f9e150016e69fb3a",
    "classification": "current-by-default",
    "directReferenceCount": 22,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Business Rules\n\n- **R1.** The surface is a client of the gateway's API, never an embedded\n  server inside the former combined binary (per fgos-interface-daemon's hexagonal-ports decision, decision `0014`). It is built to\n  address more than one gateway, so no single fixed origin may be baked into\n  it (per fgos-interface-daemon's per-machine-scope decision).\n- **R2.** Every write goes through an fgOS one-door-write verb — `answer`\n  (forwarding `--approve` when `approve: true`), `approve`, the intake verb, `edit`,\n  `move` (forwarding `--approve` when `approve: true`) — executed by the gateway, which\n  is the sole component that runs those verbs on a client's behalf (per fgos-interface-daemon — gateway is the sole chokepoint that ever spawns fgos verbs). The web surface never writes fgOS state directly. No second write path\n  is introduced by anything in this spec.\n- **R3.** A person may not read anything before signing in (mandatory token auth from v1). Sign-in is\n  token-based, and every failure is indistinguishable from \"nothing here\"\n  (an opaque 404, never 401). A second, alternative credential path exists in the design and, if\n  used, must verify its assertion's signature properly rather than trusting a\n  header (the two-layer additive auth design — cookie session plus an optional cf-access JWT that must be cryptographically verified, never trusted on the header alone).\n- **R4.** The token is never stored anywhere that is committed. It comes from\n  the environment when set; otherwise it is generated into a local file that\n  is excluded from version control and readable only by its owner.\n- **R5.** The surface is enabled by default (its own config toggle defaults ON, unlike other auto-launch toggles) and its default bind reaches\n  beyond loopback (binds 0.0.0.0 by default, bind address configurable), with a warning raised when the bind is not loopback.\n  Its port is 8788, chosen to coexist with the neighbouring service on 8787\n  (its config section carries a port field, defaulting to 8788).\n- **R6.** The dashboard's lifetime is independent of the cockpit's. Closing a\n  cockpit pane does not stop it (it runs as a child process outliving the cockpit pane).\n- **R7.** A merge approval can only be performed where fgOS allows it: the\n  `approve` verb structurally refuses to run from a linked worktree and\n  requires the repository's main working tree. This is a real mechanical\n  constraint on the deployment, not a UI concern — a gateway positioned\n  anywhere else cannot offer this operation at all, and the surface must\n  report that honestly rather than appearing to offer it.\n- **R8.** The combination of R5 (on by default, bind beyond loopback) and the\n  write operations above means **the first run of the cockpit exposes a\n  trunk-changing surface on the network, without anyone having chosen to**.\n  The token (R3/R4) is therefore not a hardening layer that can be traded away\n  for convenience — it is the only thing holding the surface closed. The\n  product owner decided this default having been shown this exact consequence\n  (rationale: `docs/history/herdr-web-dashboard/CONTEXT.md`'s own consequences section for the on-by-default decision), and the\n  write operations added later raise its weight rather than changing the\n  decision.\n- **R9.** Questions and answers are paired positionally, by order of\n  recording, with no linking key added to the underlying records — the record\n  shape is deliberately unchanged.\n- **R10.** The narrative written for humans is the primary account of what an\n  agent did; the machine-side decision log is secondary detail.\n- **R11.** Nothing on this surface pushes to a person. Being informed is a\n  pull: the person opens the dashboard and looks.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "apps/fgos-gateway/web/src/api/errors.ts",
      "line": 3,
      "text": "// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 62,
      "text": "| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5947,
      "text": "    \"docs/specs/herdr-web-dashboard.md\": {"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 217,
      "text": "      \"path\": \"docs/specs/herdr-web-dashboard.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 61,
      "text": "| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |"
    },
    {
      "path": "docs/ui-spec/00-overview.md",
      "line": 13,
      "text": "**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area"
    },
    {
      "path": "docs/ui-spec/spec.config.yaml",
      "line": 3,
      "text": "# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)."
    },
    {
      "path": "docs/ui-spec/screens/S01-sign-in.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one"
    },
    {
      "path": "docs/ui-spec/screens/S02-taskboard.md",
      "line": 21,
      "text": "regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/screens/S03-task-detail.md",
      "line": 19,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View a task's detail)."
    },
    {
      "path": "docs/ui-spec/screens/S04-questions-needing-answer.md",
      "line": 19,
      "text": "`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point"
    },
    {
      "path": "docs/ui-spec/30-states-and-errors.md",
      "line": 30,
      "text": "(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled)."
    },
    {
      "path": "docs/ui-spec/modals/M03-add-edit-item.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item)."
    },
    {
      "path": "docs/ui-spec/modals/M02-approve-merge.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its"
    },
    {
      "path": "docs/ui-spec/modals/M01-answer-question.md",
      "line": 21,
      "text": "against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question)."
    },
    {
      "path": "docs/ui-spec/20-domain-rules.md",
      "line": 10,
      "text": "Every rule here is taken from `docs/specs/herdr-web-dashboard.md`"
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 21,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 46,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Retire a work item)."
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 36,
      "text": "- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)"
    },
    {
      "path": "docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md",
      "line": 10,
      "text": "**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec."
    },
    {
      "path": "docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md",
      "line": 13,
      "text": "spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own"
    }
  ],
  "sourceSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
}
```


## liveness-05-017

Source digest (evidence JSON): 00ba46f9b8c38a8dd3c7b7e08eafb832a4e86e818af26b2da3ce53ea5b829634
Target digest: none

```json
{
  "entryId": "liveness-05-017",
  "source": "docs/specs/herdr-web-dashboard.md",
  "sourceBlob": "e7edb5668119e67384175cace620459e97175ddd",
  "section": {
    "heading": "Edge Cases Settled",
    "anchor": "edge-cases-settled",
    "startLine": 246,
    "endLine": 265,
    "sha256": "65a75c2bc0739fc66434093ab4edfe6c5acd8fc7a07867b276389e91c187797c",
    "classification": "current-by-default",
    "directReferenceCount": 22,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Edge Cases Settled\n\n- **An item that has never been parked.** Its task detail shows a work history\n  and an empty question/answer timeline — the empty timeline is the normal\n  case, not an error.\n- **An item whose narrative source is missing.** Its documentation reference\n  can point at a directory that does not exist. The detail screen shows the\n  item without its narrative rather than failing; the missing narrative is\n  reported as missing.\n- **A narrative reference pointing outside the documentation tree.** Treated\n  as invalid and refused, not followed.\n- **The cockpit is closed.** The dashboard keeps serving (R6) — this is\n  the whole point of the design, not a leftover process.\n- **The gateway is unreachable.** The client says so plainly and offers to\n  retry; it never presents stale data as current.\n- **Approve is offered where it cannot run.** Covered by R7 — reported as\n  unavailable with the reason, never attempted and silently failed.\n- **Retire is asked for as \"delete\".** Covered under Retire a work item —\n  the surface performs retirement and names it as such.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "apps/fgos-gateway/web/src/api/errors.ts",
      "line": 3,
      "text": "// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 62,
      "text": "| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5947,
      "text": "    \"docs/specs/herdr-web-dashboard.md\": {"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 217,
      "text": "      \"path\": \"docs/specs/herdr-web-dashboard.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 61,
      "text": "| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |"
    },
    {
      "path": "docs/ui-spec/00-overview.md",
      "line": 13,
      "text": "**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area"
    },
    {
      "path": "docs/ui-spec/spec.config.yaml",
      "line": 3,
      "text": "# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)."
    },
    {
      "path": "docs/ui-spec/screens/S01-sign-in.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one"
    },
    {
      "path": "docs/ui-spec/screens/S02-taskboard.md",
      "line": 21,
      "text": "regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/screens/S03-task-detail.md",
      "line": 19,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View a task's detail)."
    },
    {
      "path": "docs/ui-spec/screens/S04-questions-needing-answer.md",
      "line": 19,
      "text": "`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point"
    },
    {
      "path": "docs/ui-spec/30-states-and-errors.md",
      "line": 30,
      "text": "(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled)."
    },
    {
      "path": "docs/ui-spec/modals/M03-add-edit-item.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item)."
    },
    {
      "path": "docs/ui-spec/modals/M02-approve-merge.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its"
    },
    {
      "path": "docs/ui-spec/modals/M01-answer-question.md",
      "line": 21,
      "text": "against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question)."
    },
    {
      "path": "docs/ui-spec/20-domain-rules.md",
      "line": 10,
      "text": "Every rule here is taken from `docs/specs/herdr-web-dashboard.md`"
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 21,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 46,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Retire a work item)."
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 36,
      "text": "- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)"
    },
    {
      "path": "docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md",
      "line": 10,
      "text": "**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec."
    },
    {
      "path": "docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md",
      "line": 13,
      "text": "spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own"
    }
  ],
  "sourceSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
}
```


## liveness-05-018

Source digest (evidence JSON): 8cbcb98f120a964b8eb54ee642a5824f376386ef1248736d2f4ce0faf08e7303
Target digest: none

```json
{
  "entryId": "liveness-05-018",
  "source": "docs/specs/herdr-web-dashboard.md",
  "sourceBlob": "e7edb5668119e67384175cace620459e97175ddd",
  "section": {
    "heading": "Open Gaps",
    "anchor": "open-gaps",
    "startLine": 266,
    "endLine": 299,
    "sha256": "ee621e750bed254c78949330e37f5097c4dfb01000b3018f3e5aef972e03ac43",
    "classification": "current-by-default",
    "directReferenceCount": 22,
    "implementationPaths": [
      "apps/fgos-gateway/src/gateway.rs"
    ],
    "subjectSymbols": [
      "WebSocket"
    ],
    "subjectHitPaths": [
      "scripts/test-proof-inventory.mjs",
      "apps/fgos-gateway/web/src/api/poll.ts"
    ],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Open Gaps\n\n- **Authorization granularity for write actions — unresolved, and it is the\n  significant one.** Everything under Behaviors & Operations that writes, and\n  `approve` above all, is available to whoever holds the machine's single\n  token. There is no per-person, per-project, or per-verb distinction to\n  spec against, because neither fgOS nor the gateway has one (STR38 unbuilt;\n  fgos-interface-daemon's own one-token-per-machine decision does not add one). The exposure is stated rather than mitigated. Closing this\n  needs its own item and its own decision — the authorization layer's own\n  scope, not this spec's, and not something to be improvised inside the web\n  client.\n- **The gateway's own API contract now exists** —\n  `docs/contracts/fgos-gateway-api-v1.yaml`, landed by tsk-7l9, carrying 18\n  paths that match `apps/fgos-gateway/src/gateway.rs`'s registered routes 1-to-1.\n  This spec still describes operations in product terms rather than\n  restating endpoint shapes, but that contract — not this prose — is the\n  boundary's source of truth, and any surface built against it cites it\n  directly. Two facts from it constrain this spec's own surfaces and are\n  recorded here rather than left to be rediscovered: there is **no edit\n  route** (`/work/{id}` is `get` only), so M03's edit mode depends on a\n  route that has to be added first; and there is **no SSE or WebSocket**,\n  only a `GET /state/digest` cheap poll, which is why `15-system-events.md`\n  describes client-derived events rather than server-pushed ones.\n- **Multi-project and multi-endpoint behaviour is only half-decided.** The\n  client must not assume one fixed gateway (fgos-interface-daemon's per-machine-scope decision, R1), but how a person\n  chooses between projects and instances, and how the surface shows which one\n  they are looking at, is deferred to `tsk-3b0` (multi-project port/identity handling is deferred there).\n- **No attention channel.** R11 records that nothing notifies a person. Whether\n  it should is a separate, unbuilt capability (STR48).\n- **Coverage is `partial` on purpose.** The three read screens are locked by\n  fourteen decisions; the six write operations were added later, outside that\n  discussion, and are settled here only as far as existing mechanisms and the\n  product owner's decisions at this item's own gate allow.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "apps/fgos-gateway/web/src/api/errors.ts",
      "line": 3,
      "text": "// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 62,
      "text": "| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5947,
      "text": "    \"docs/specs/herdr-web-dashboard.md\": {"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 217,
      "text": "      \"path\": \"docs/specs/herdr-web-dashboard.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 61,
      "text": "| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |"
    },
    {
      "path": "docs/ui-spec/00-overview.md",
      "line": 13,
      "text": "**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area"
    },
    {
      "path": "docs/ui-spec/spec.config.yaml",
      "line": 3,
      "text": "# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)."
    },
    {
      "path": "docs/ui-spec/screens/S01-sign-in.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one"
    },
    {
      "path": "docs/ui-spec/screens/S02-taskboard.md",
      "line": 21,
      "text": "regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/screens/S03-task-detail.md",
      "line": 19,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View a task's detail)."
    },
    {
      "path": "docs/ui-spec/screens/S04-questions-needing-answer.md",
      "line": 19,
      "text": "`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point"
    },
    {
      "path": "docs/ui-spec/30-states-and-errors.md",
      "line": 30,
      "text": "(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled)."
    },
    {
      "path": "docs/ui-spec/modals/M03-add-edit-item.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item)."
    },
    {
      "path": "docs/ui-spec/modals/M02-approve-merge.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its"
    },
    {
      "path": "docs/ui-spec/modals/M01-answer-question.md",
      "line": 21,
      "text": "against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question)."
    },
    {
      "path": "docs/ui-spec/20-domain-rules.md",
      "line": 10,
      "text": "Every rule here is taken from `docs/specs/herdr-web-dashboard.md`"
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 21,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 46,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Retire a work item)."
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 36,
      "text": "- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)"
    },
    {
      "path": "docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md",
      "line": 10,
      "text": "**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec."
    },
    {
      "path": "docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md",
      "line": 13,
      "text": "spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own"
    }
  ],
  "sourceSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
}
```


## liveness-05-019

Source digest (evidence JSON): 02f3b94550d72ae1eaeec21033c53eacd3e09c3809f726b9940aa1aced582451
Target digest: none

```json
{
  "entryId": "liveness-05-019",
  "source": "docs/specs/herdr-web-dashboard.md",
  "sourceBlob": "e7edb5668119e67384175cace620459e97175ddd",
  "section": {
    "heading": "Visuals",
    "anchor": "visuals",
    "startLine": 300,
    "endLine": 308,
    "sha256": "5d2c67a2229440ac513b36ecaf2bbb4396c81133ca4df5a1babf520b3c6a745e",
    "classification": "current-by-default",
    "directReferenceCount": 22,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Visuals\n\nNot specified here by design. The concrete layout, userflow, empty/error\npresentation, colour and typography are `tsk-3x6`'s deliverable:\n`docs/reference/herdr-web-dashboard-layout.md`, which takes this spec as its\nproduct input. The one direction this spec pins is the actor-facing\nexpectation recorded under \"View the taskboard\": a Monday.com/ClickUp-style\ngrouped board with in-place quick actions and filtering, not a flat table.\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "apps/fgos-gateway/web/src/api/errors.ts",
      "line": 3,
      "text": "// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 62,
      "text": "| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5947,
      "text": "    \"docs/specs/herdr-web-dashboard.md\": {"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 217,
      "text": "      \"path\": \"docs/specs/herdr-web-dashboard.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 61,
      "text": "| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |"
    },
    {
      "path": "docs/ui-spec/00-overview.md",
      "line": 13,
      "text": "**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area"
    },
    {
      "path": "docs/ui-spec/spec.config.yaml",
      "line": 3,
      "text": "# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)."
    },
    {
      "path": "docs/ui-spec/screens/S01-sign-in.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one"
    },
    {
      "path": "docs/ui-spec/screens/S02-taskboard.md",
      "line": 21,
      "text": "regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/screens/S03-task-detail.md",
      "line": 19,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View a task's detail)."
    },
    {
      "path": "docs/ui-spec/screens/S04-questions-needing-answer.md",
      "line": 19,
      "text": "`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point"
    },
    {
      "path": "docs/ui-spec/30-states-and-errors.md",
      "line": 30,
      "text": "(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled)."
    },
    {
      "path": "docs/ui-spec/modals/M03-add-edit-item.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item)."
    },
    {
      "path": "docs/ui-spec/modals/M02-approve-merge.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its"
    },
    {
      "path": "docs/ui-spec/modals/M01-answer-question.md",
      "line": 21,
      "text": "against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question)."
    },
    {
      "path": "docs/ui-spec/20-domain-rules.md",
      "line": 10,
      "text": "Every rule here is taken from `docs/specs/herdr-web-dashboard.md`"
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 21,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 46,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Retire a work item)."
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 36,
      "text": "- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)"
    },
    {
      "path": "docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md",
      "line": 10,
      "text": "**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec."
    },
    {
      "path": "docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md",
      "line": 13,
      "text": "spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own"
    }
  ],
  "sourceSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
}
```


## liveness-05-020

Source digest (evidence JSON): 976734580cf594e2f0b4f1623e92d7a44115dea425832d4a85927a2ee0c1e98d
Target digest: none

```json
{
  "entryId": "liveness-05-020",
  "source": "docs/specs/herdr-web-dashboard.md",
  "sourceBlob": "e7edb5668119e67384175cace620459e97175ddd",
  "section": {
    "heading": "Pointers (implementation)",
    "anchor": "pointers-implementation",
    "startLine": 309,
    "endLine": 332,
    "sha256": "9169040dcf73d7a6719148ae5dc1d2a62c821d6706f27a2319d04901ae88ca63",
    "classification": "current-by-default",
    "directReferenceCount": 22,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## Pointers (implementation)\n\n- `docs/history/herdr-web-dashboard/CONTEXT.md` — the fourteen locked\n  decisions this spec cites throughout, plus the scout evidence\n  behind them.\n- `docs/history/herdr-web-dashboard/DISCUSSION.md` — the five discussion\n  rounds those decisions came out of.\n- `docs/history/herdr-web-dashboard/plan.md` — the build shape: five pieces\n  (config/doctor, server core and sign-in, taskboard, task detail, alternative\n  credential path), plus this spec's own planning section.\n- `docs/history/fgos-interface-daemon/CONTEXT.md` — the gateway's own locked\n  decisions, in particular per-machine scope (multi-endpoint clients),\n  one token per machine, gateway is the sole runner of fgOS verbs,\n  where gateway lives (that web is an independent client), and the API\n  contract still to be written.\n- `docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` — why a non-terminal\n  UI is a client of a network gate rather than its own server.\n- `docs/io-contract.md` — the CLI's in/out contract, and the explicit boundary\n  saying the authorization layer (STR38) and the attention channel (STR48) are\n  outside it.\n- `docs/specs/work-state.md` — the lifecycle meaning behind every status,\n  stage, question and answer this surface displays.\n- `docs/reference/herdr-web-dashboard-layout.md` — the UI layer (`tsk-3x6`).\n",
  "directReferences": [
    {
      "path": "docs/architect/component-boundary/component-boundary-advisory.md",
      "line": 145,
      "text": "| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |"
    },
    {
      "path": "apps/fgos-gateway/web/src/api/errors.ts",
      "line": 3,
      "text": "// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):"
    },
    {
      "path": "docs/architect/packaging-distribution/history/distribution-baseline.md",
      "line": 62,
      "text": "| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.baseline.json",
      "line": 5947,
      "text": "    \"docs/specs/herdr-web-dashboard.md\": {"
    },
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 217,
      "text": "      \"path\": \"docs/specs/herdr-web-dashboard.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 61,
      "text": "| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |"
    },
    {
      "path": "docs/ui-spec/00-overview.md",
      "line": 13,
      "text": "**Product source of truth:** `docs/specs/herdr-web-dashboard.md` (the area"
    },
    {
      "path": "docs/ui-spec/spec.config.yaml",
      "line": 3,
      "text": "# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)."
    },
    {
      "path": "docs/ui-spec/screens/S01-sign-in.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one"
    },
    {
      "path": "docs/ui-spec/screens/S02-taskboard.md",
      "line": 21,
      "text": "regroup (`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/screens/S03-task-detail.md",
      "line": 19,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View a task's detail)."
    },
    {
      "path": "docs/ui-spec/screens/S04-questions-needing-answer.md",
      "line": 19,
      "text": "`docs/specs/herdr-web-dashboard.md` Data Dictionary #4). D4's whole point"
    },
    {
      "path": "docs/ui-spec/30-states-and-errors.md",
      "line": 30,
      "text": "(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled)."
    },
    {
      "path": "docs/ui-spec/modals/M03-add-edit-item.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Add a work item, §Edit a work item)."
    },
    {
      "path": "docs/ui-spec/modals/M02-approve-merge.md",
      "line": 18,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Approve a merge). It exists as its"
    },
    {
      "path": "docs/ui-spec/modals/M01-answer-question.md",
      "line": 21,
      "text": "against (`docs/specs/herdr-web-dashboard.md` §Answer a parked question)."
    },
    {
      "path": "docs/ui-spec/20-domain-rules.md",
      "line": 10,
      "text": "Every rule here is taken from `docs/specs/herdr-web-dashboard.md`"
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 21,
      "text": "(`docs/specs/herdr-web-dashboard.md` §View the taskboard)."
    },
    {
      "path": "docs/ui-spec/components/C01-item-card.md",
      "line": 46,
      "text": "(`docs/specs/herdr-web-dashboard.md` §Retire a work item)."
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 36,
      "text": "- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)"
    },
    {
      "path": "docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md",
      "line": 10,
      "text": "**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec."
    },
    {
      "path": "docs/knowledge/why-the-herdr-web-dashboard-s-architecture-moved-from-a-stan/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md",
      "line": 13,
      "text": "spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own"
    }
  ],
  "sourceSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
}
```


## liveness-06-001

Source digest (evidence JSON): 5a149faf35aa909695e200bcdd0202caffeeedfb1ece9dac5499256a4819f8b6
Target digest: none

```json
{
  "entryId": "liveness-06-001",
  "source": "docs/specs/observe.md",
  "sourceBlob": "2e2fe74304bb6732b0307bb822c338d93dbc7569",
  "section": {
    "heading": "Observe Component Specification",
    "anchor": "observe-component-specification",
    "startLine": 1,
    "endLine": 6,
    "sha256": "41c335c22fd0fb553d0c1fb97402d496f074306203809f566446c7a7e2841f26",
    "classification": "current-by-default",
    "directReferenceCount": 3,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "# Observe Component Specification\n\nDocument type: BA-grade area specification\nOwnership: `packages/observe/rust` (`fgos-observe`)\nSubstrate stores: `.fgos/observe/<store>/<writerId>.jsonl`\n",
  "directReferences": [
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 227,
      "text": "      \"path\": \"docs/specs/observe.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 65,
      "text": "| Observe (metrics and friction) | legacy-current | maintained-authority | `docs/specs/observe.md` | `packages/observe/rust/**` | Spec owns observation behavior (metrics and friction); the Rust package owns the implementation. |"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 59,
      "text": "- `docs/specs/observe.md` — spec thành phần Observe (đo lường `fgos metrics` và ghi nhận `fgos friction` trọn sang Rust); source: `packages/observe/rust`, contracts: `packages/observe/contracts/`, store `.fgos/observe/`. `metrics discussions` đọc summary do Node Execution ghi (`src/runner/execution/unit-summary.mjs`, `packages/run-result/contracts/unit-summary.read.v2.json`), `metrics eval` ghi journal `.fgos/observe/evals/`. Rubric: `docs/reference/discussion-quality-rubric.md`; cách so sánh mù: `docs/how-to/compare-discussion-setups-with-metrics-eval.md`."
    }
  ],
  "sourceSHA256": "f367b7dbe06df621ddc178e6fd7d1f610483e1504dec324fb1dfd49c97ee5272"
}
```


## liveness-06-002

Source digest (evidence JSON): b3a17973bb639d89eec14dc3bae7132bd1158850f5f6c79b56cd09358eb97ff8
Target digest: none

```json
{
  "entryId": "liveness-06-002",
  "source": "docs/specs/observe.md",
  "sourceBlob": "2e2fe74304bb6732b0307bb822c338d93dbc7569",
  "section": {
    "heading": "1. Overview & Boundaries",
    "anchor": "1-overview-boundaries",
    "startLine": 7,
    "endLine": 11,
    "sha256": "51602c1d9a71863636e066ad5c814ae9ac85bd66f0a630a8ea208af0bfd902f8",
    "classification": "current-by-default",
    "directReferenceCount": 3,
    "implementationPaths": [],
    "subjectSymbols": [],
    "subjectHitPaths": [],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "## 1. Overview & Boundaries\n\nObserve là platform layer chuyên trách việc đo lường (`fgos metrics`) và theo dõi trở ngại (`fgos friction`) xuyên suốt mọi tầng của hệ thống fgOS.\nObserve được chuyển trọn gói sang Rust trong kế hoạch `plans/260929-1501-metrics-friction-rust-native`.\n",
  "directReferences": [
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 227,
      "text": "      \"path\": \"docs/specs/observe.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 65,
      "text": "| Observe (metrics and friction) | legacy-current | maintained-authority | `docs/specs/observe.md` | `packages/observe/rust/**` | Spec owns observation behavior (metrics and friction); the Rust package owns the implementation. |"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 59,
      "text": "- `docs/specs/observe.md` — spec thành phần Observe (đo lường `fgos metrics` và ghi nhận `fgos friction` trọn sang Rust); source: `packages/observe/rust`, contracts: `packages/observe/contracts/`, store `.fgos/observe/`. `metrics discussions` đọc summary do Node Execution ghi (`src/runner/execution/unit-summary.mjs`, `packages/run-result/contracts/unit-summary.read.v2.json`), `metrics eval` ghi journal `.fgos/observe/evals/`. Rubric: `docs/reference/discussion-quality-rubric.md`; cách so sánh mù: `docs/how-to/compare-discussion-setups-with-metrics-eval.md`."
    }
  ],
  "sourceSHA256": "f367b7dbe06df621ddc178e6fd7d1f610483e1504dec324fb1dfd49c97ee5272"
}
```


## liveness-06-003

Source digest (evidence JSON): 1efec1099cfa3bab77516ec85146c30bd5ed7014cb3a34fed14153cf9866ed4f
Target digest: none

```json
{
  "entryId": "liveness-06-003",
  "source": "docs/specs/observe.md",
  "sourceBlob": "2e2fe74304bb6732b0307bb822c338d93dbc7569",
  "section": {
    "heading": "Owns",
    "anchor": "owns",
    "startLine": 12,
    "endLine": 18,
    "sha256": "4e957c2e2968f38f1b20dd7875b7d1d98e05f43f293754d9a1743e5f00e618f3",
    "classification": "current-by-default",
    "directReferenceCount": 3,
    "implementationPaths": [],
    "subjectSymbols": [
      "ObservationSource",
      "LegacyFrictionSource"
    ],
    "subjectHitPaths": [
      "apps/fgos/src/wiring/friction_sources.rs",
      "apps/fgos/src/wiring/metrics_sources.rs",
      "packages/run-result/rust/src/unit_summary.rs",
      "packages/run-result/rust/src/lib.rs",
      "packages/run-result/rust/tests/unit_summary.rs",
      "packages/run-result/rust/tests/layout_fixture.rs",
      "packages/work-state/contracts/work-events.read.v1.json",
      "packages/work-state/rust/src/legacy_friction.rs",
      "packages/work-state/rust/src/work_source.rs",
      "packages/observe/contracts/observe.observation.v1.json",
      "packages/observe/rust/src/provider.rs",
      "packages/observe/rust/src/friction_cli.rs",
      "packages/observe/rust/src/contract.rs",
      "packages/observe/rust/src/friction.rs",
      "packages/observe/rust/src/sources/invocation_faults.rs",
      "packages/observe/rust/src/sources/claude_transcripts.rs",
      "packages/observe/rust/src/metrics_cli/mod.rs",
      "packages/observe/rust/src/metrics_cli/runs.rs",
      "packages/observe/rust/src/metrics_cli/outcomes.rs",
      "packages/observe/rust/src/metrics_cli/entropy.rs",
      "packages/observe/rust/src/metrics_cli/faults.rs",
      "packages/observe/rust/src/metrics_cli/harness.rs",
      "packages/observe/rust/src/metrics_cli/coverage.rs",
      "packages/observe/rust/src/metrics_cli/snapshot.rs"
    ],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### Owns\n- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).\n- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`, `fgos metrics outcomes`, `fgos metrics entropy`, `fgos metrics snapshot`).\n- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`).\n- Quản lý store lock (`.fgos/observe/.lock`) và phân mảnh writer shard (`.fgos/observe/<store>/<writerId>.jsonl`).\n- Khai báo traits `ObservationSource` và `LegacyFrictionSource` cho các crate khác triển khai.\n",
  "directReferences": [
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 227,
      "text": "      \"path\": \"docs/specs/observe.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 65,
      "text": "| Observe (metrics and friction) | legacy-current | maintained-authority | `docs/specs/observe.md` | `packages/observe/rust/**` | Spec owns observation behavior (metrics and friction); the Rust package owns the implementation. |"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 59,
      "text": "- `docs/specs/observe.md` — spec thành phần Observe (đo lường `fgos metrics` và ghi nhận `fgos friction` trọn sang Rust); source: `packages/observe/rust`, contracts: `packages/observe/contracts/`, store `.fgos/observe/`. `metrics discussions` đọc summary do Node Execution ghi (`src/runner/execution/unit-summary.mjs`, `packages/run-result/contracts/unit-summary.read.v2.json`), `metrics eval` ghi journal `.fgos/observe/evals/`. Rubric: `docs/reference/discussion-quality-rubric.md`; cách so sánh mù: `docs/how-to/compare-discussion-setups-with-metrics-eval.md`."
    }
  ],
  "sourceSHA256": "f367b7dbe06df621ddc178e6fd7d1f610483e1504dec324fb1dfd49c97ee5272"
}
```


## liveness-06-004

Source digest (evidence JSON): d41008adde8daa2b666b7ef7f57dad5aa7de2ccf60d2829155505243aaa882bf
Target digest: none

```json
{
  "entryId": "liveness-06-004",
  "source": "docs/specs/observe.md",
  "sourceBlob": "2e2fe74304bb6732b0307bb822c338d93dbc7569",
  "section": {
    "heading": "Must Not Own",
    "anchor": "must-not-own",
    "startLine": 19,
    "endLine": 24,
    "sha256": "4feb0c7341745790e75d55dc1468d05e9b2d3abe7212946d61c8b650a532d39d",
    "classification": "current-by-default",
    "directReferenceCount": 3,
    "implementationPaths": [],
    "subjectSymbols": [
      "RunResult"
    ],
    "subjectHitPaths": [
      "scripts/regenerate-observe-fixtures.mjs",
      "src/setup/registrations.mjs",
      "packages/run-result/rust/src/lib.rs",
      "apps/fgos/src/wiring/metrics_sources.rs",
      "packages/run-result/rust/tests/unit_summary.rs",
      "packages/run-result/rust/tests/layout_fixture.rs",
      "packages/observe/rust/src/scorecard.rs",
      "src/workflow/runner.mjs",
      "src/verbs/dispatch/show-run.mjs",
      "src/runner/execution/run.mjs",
      "src/runner/operation-choice.mjs",
      "src/runner/execution/unit-run-history.mjs",
      "test/observe/observe-contracts-fixtures.test.mjs",
      "src/runner/dispatch/herdr-reconcile.mjs",
      "test/fixtures/usage/pi-multiturn-normal.jsonl",
      "src/runner/dispatch/settlement.mjs",
      "test/fixtures/usage/codex-cli-grep-tokens-used.stderr.log",
      "test/fixtures/usage/pi-multiturn-no-agent-end.jsonl",
      "test/runner/dispatch-reconciliation.test.mjs",
      "src/runner/dispatch/visibility-session.mjs",
      "test/runner/assignment-dispatch.test.mjs",
      "src/runner/dispatch/provider-account-probe.mjs",
      "src/runner/dispatch/reconcile-cli-spawn.mjs",
      "src/runner/dispatch/runtime-inspection.mjs",
      "src/runner/dispatch/herdr-round.mjs",
      "src/runner/dispatch/worker-artifacts.mjs",
      "test/runner/dispatch-i08b-remediation.test.mjs",
      "src/runner/dispatch/run-result.mjs",
      "src/runner/dispatch/reconciliation-planner.mjs",
      "src/runner/dispatch/agent-result-claim-contract.mjs",
      "src/runner/dispatch/assignment-normalizer.mjs",
      "src/runner/dispatch/assignment-runner.mjs",
      "test/runner/run-result-v3-reader.test.mjs",
      "test/runner/dispatch-operability-production-door.test.mjs",
      "test/runner/dispatch-stray-write-attribution.test.mjs",
      "src/runner/dispatch/usage-parsers.mjs",
      "test/runner/loop.test.mjs",
      "test/runner/provider-account-probe.test.mjs",
      "test/runner/driver-rununit.test.mjs",
      "test/runner/assignment-runresult.test.mjs",
      "test/runner/run-result-confinement-label.test.mjs",
      "test/runner/operation-choice.test.mjs",
      "test/runner/run-result-v2.test.mjs",
      "test/runner/execution/unit-run-outcome.test.mjs",
      "test/runner/run-result-source-scan.test.mjs",
      "test/runner/assignment-enumerator-guard.test.mjs",
      "test/runner/dispatch.test.mjs",
      "test/runner/herdr-round-reconcile.test.mjs",
      "test/runner/dispatch-runtime-inspect.test.mjs"
    ],
    "retired": false,
    "retirementEligible": false,
    "reason": "Live reference, named subject implementation or source-tool consumer protects this section; truth deferred under A19/A28."
  },
  "shownText": "### Must Not Own\n- Không sở hữu trạng thái hoặc vòng đời của Work Items (do `packages/work-state` sở hữu).\n- Không tự ý phân loại hoặc đánh giá lại kết quả RunResult (do `packages/run-result` sở hữu).\n- Không can thiệp vào logic điều phối hoặc trạng thái của Agent Coordination (do `packages/coordination-state` sở hữu).\n- Không ép buộc các component khác phụ thuộc ngược vào Observe: Observe độc lập, composition root (`apps/fgos`) nối các nguồn dữ liệu vào.\n",
  "directReferences": [
    {
      "path": "scripts/check-legacy-docs-ratchet.exceptions.json",
      "line": 227,
      "text": "      \"path\": \"docs/specs/observe.md\","
    },
    {
      "path": "docs/transitional-switchboard.md",
      "line": 65,
      "text": "| Observe (metrics and friction) | legacy-current | maintained-authority | `docs/specs/observe.md` | `packages/observe/rust/**` | Spec owns observation behavior (metrics and friction); the Rust package owns the implementation. |"
    },
    {
      "path": "docs/specs/reading-map.md",
      "line": 59,
      "text": "- `docs/specs/observe.md` — spec thành phần Observe (đo lường `fgos metrics` và ghi nhận `fgos friction` trọn sang Rust); source: `packages/observe/rust`, contracts: `packages/observe/contracts/`, store `.fgos/observe/`. `metrics discussions` đọc summary do Node Execution ghi (`src/runner/execution/unit-summary.mjs`, `packages/run-result/contracts/unit-summary.read.v2.json`), `metrics eval` ghi journal `.fgos/observe/evals/`. Rubric: `docs/reference/discussion-quality-rubric.md`; cách so sánh mù: `docs/how-to/compare-discussion-setups-with-metrics-eval.md`."
    }
  ],
  "sourceSHA256": "f367b7dbe06df621ddc178e6fd7d1f610483e1504dec324fb1dfd49c97ee5272"
}
```

