# Review a38 step 05, seam 8 payload s4-src-p01

Payload: s4-src-p01.json (12 source files, pin 97c9694a4, none carries a diff or rollbackDiff). Reviewed at the seam 8 worktree (302575c04).
Method: every item read against the pinned bytes. Item set cross-checked against `grep docs/` on each pinned file. Candidate holders and anchors checked in the worktree.

Counts: 63 items reviewed (57 admitted literal references, 6 judgment rejects). Admitted dispositions: preserve 29, patch 8, park 7, render-join 13. Outcome defects: 0. Verdict: ok for all 12 files. Two Lead-judgment questions remain (A, B below).

## Per file

| File | Verdict | Items | Notes |
|---|---|---|---|
| .github/workflows/ci.yml | ok | 1 | 115 preserve. docs/distribution-vision.md is a retained root and the passage is a historical D1/D4 comment. |
| apps/fgos-gateway/Cargo.toml | ok | 5 | 154 to 158 preserve. Contract yaml and docs/history/** are retained roots. All four history targets exist at the pin. The wrapped refs 156 and 158 span their full two-line passage. |
| apps/fgos-gateway/web/src/App.tsx | ok | 1 | 202 preserve. docs/ui-spec/screens/S01 exists and the ui-spec root is retained (authoring request L12-21/26). |
| apps/fgos-gateway/web/src/api/client.ts | ok | 4 | 203 preserve. Rejects 802, 821 and 822 are true: they are HTTP route templates `/work/${id}...`, not document paths. |
| apps/fgos-gateway/web/src/api/errors.ts | ok | 1 | 204 patch to docs/platform/herdr-web-dashboard/spec.md#edge-cases-settled. Candidate heading "Edge Cases Settled" exists and the quoted "gateway is unreachable ... never presents stale data as current" text is there verbatim. The old lines 259-260 match. Inherited from Step 4 (step04-012 line 8). Patch carried by the owner, no new diff here. |
| apps/fgos-gateway/web/src/api/types.ts | ok | 2 | 206 preserve. Reject 823 is true: the line is a comment string and the actual path is already item 206. |
| apps/fgos-gateway/web/src/lib/network.ts | ok, see question A | 2 | 208 preserve (contracts yaml, retained). 209 park, inherited exact join to step04-012 line 11. |
| apps/fgos-gateway/web/src/screens/TaskDetail.tsx | ok | 6 | 218 to 221 preserve (history, ui-spec). Rejects 869 (`size-${item.size}` CSS/label class string) and 875 (`footprint.join(', ')` display of caller data) are true. |
| apps/fgos-gateway/web/src/screens/Taskboard.tsx | ok | 3 | 222 to 224 preserve. |
| apps/fgos/src/legacy_exec.rs | ok | 0 | No items. The file has no docs reference at the pin. |
| bin/fgos-runner.mjs | ok | 0 | No items. The file has no docs reference at the pin. |
| AGENTS.md | ok, see questions B and C | 37 | Details below. |

### AGENTS.md (37 items)

- **Coverage:** all 25 explicit docs/ literals in the pinned file are covered. The ones without items are bare directories, `docs/platform/...` (not a legacy root), or `plans/`. See question C for L74.
- **Patch (8):** 117/146/147 go to docs/reading-map.md, 122 to the packaging-distribution spec, 153 to the system-overview spec, and 128/129 to the runner 0030 decision. All targets exist. The 0030 heading "### 0030 — Thêm bậc ưu tiên #2 ..." exists in h-36d872fbb0e5.md at L921. 128 and 129 agree. L40 reading-map (146) is patch and the adjacent `docs/specs/` ref (145) is park. They have different targets, so R7 is satisfied.
- **Park (7):** 123, 145 and 151 are area-layout rewrites. 126, 127, 130 and 135 are the D-ADR0054, D-ADR0062 and D-ADR0035 narratives.
  - I checked the three decision narratives against docs/platform and docs/knowledge in the worktree. No live holder has D-ADR0054 narrative text. D-ADR0062 is only in docs/decisions/index.md and the intent ledger. D-ADR0035 appears only as an index row and a ledger row, not the mission-boundary narrative.
  - These parks therefore name a real, passage-specific missing holder. They are not boilerplate, and the "live holder means patch" rule does not apply.
  - 130 and 135 share one outcome, as they should.
  - All seven are exact joins to step04-009.
- **Preserve (11):** the retained roots are docs/backlog.md, docs/distribution-vision.md, docs/routing-handoff-contract.md, docs/platform-foundations.md and docs/decisions/index.md (the last is the generated projection that Step 4 kept as a literal). No preserve rests on a docs/specs or docs/architect "retained" witness.
- **Render-join (13):** the managed-block render at L345-358 and L384 joins source slots. The L1-L10 anchors and L345/L358 show source outcome patch; 144 shows source outcome preserve. Consistent with R2 and with the owner joins.

## OUTCOME defects

None.

## Record-text notes

1. client.ts rejects 802, 821 and 822 are labeled nonDocumentUse `text-label-join`. They are HTTP request-route templates. A more accurate label is a route string with no document use. The admission is right.
2. TaskDetail.tsx reject 875 (`footprint.join(', ')`) is labeled `scalar-pass-through` with the text "path arithmetic". It is a caller-data list display. The label is imprecise and the reject is right.
3. Anchor `0030-thêm-bậc-...` (single hyphen) on AGENTS.md 128/129 is inherited from step04-009. Other Step 4 anchors for the same file mix single-hyphen and double-hyphen (`0020--`) forms. The slug form should be confirmed once, at Step 7 composition. Not a Step 5 defect.

## Lead-judgment questions

A. network.ts reference-000209 (park, inherited from step04-012 line 11).
- The comment cites "R5 (docs/specs/herdr-web-dashboard.md)" for the on-network signal.
- The pinned old R5 already says the default bind is 0.0.0.0 and a warning is raised when the bind is not loopback. The candidate spec R5 (docs/platform/herdr-web-dashboard/spec.md L239-241) keeps the same sentence verbatim and adds the static-serving toggle and port 4170.
- A live holder with the same passage exists, so the rule "same passage means a patch, not a park" may apply here.
- The park text ("old-R5 claim ... resolve before redirecting") describes a rewording decision rather than a missing artifact.
- I did not call this an outcome defect, because Step 5 inherits Step 4's disposition for joined ids. If Lead wants it corrected, the fix belongs in Step 4: patch to `docs/platform/herdr-web-dashboard/spec.md` with the business-rules R5 locator, and reword the comment.

B. AGENTS.md reference-000123 (L14, park) and 000124 (L14, preserve).
- They sit in one sentence and have different dispositions. The park text calls the whole "narrative/index/writer contract" a rewrite.
- Because the two spans are distinct literals with distinct targets, I treated them as independent operations. Lead may want the park reason scoped to the `docs/specs/<area>.md` span only.

C. AGENTS.md L74 `docs/decisions/` (bare directory, "A settled decision goes into `docs/decisions/`").
- The corpus was retired (tsk-1lv-4) and the adjacent L75 `docs/specs/<area>.md` is parked (000151). L74 has no item in this payload.
- The payload filter may have omitted it, or the census treats directory-only mentions as non-references. Please confirm Step 2/4 consciously excluded it. If it is in scope, it should share 000151's park (R7, same passage).

Status: DONE
Summary: All 12 files and 63 items in s4-src-p01 reviewed with zero outcome defects. Three questions go to Lead (network.ts R5 park, the AGENTS.md L14 pair, the L74 bare-directory mention) and three record-text label notes.
