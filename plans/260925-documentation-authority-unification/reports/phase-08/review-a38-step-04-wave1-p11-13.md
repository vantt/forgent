# A38 review: step-04 wave1 parts 11, 12, 13 (set step04-010)

## File verdict (one logical file across p11/p12/p13)

- Path: bin/fgos.mjs (5236 lines, digest 64ace4da...), set step04-010, stratum: mandatory (root source boundary; patched population 1/1)
- Verdict: **ok**
- Coverage: p11 (lines 1-3738) and p12 (3739-5236) carry 0 slots and are context only; p13 carries all 36 slots. I read the pinned blob (git show ef62747dd:bin/fgos.mjs) and every edge region, and grepped the whole file for other docs/.md/plans references.
- Slots reviewed: 36/36 (1 patch hunk covering 2 slots, 4 parked + class6-l-000094 parked = 5 parked, 29 preserve incl. duplicate-line slots). Rework slots: 0.

## Slot results

- Patch (class6-l-000085, source lines 1057-1058, two physical slots, one hunk @@ -1054,8 +1054,8 @@):
  - Source `docs/explanation/long-work-item-ids-max-length-guard.md` no longer exists at the pin (0 files under that path). Replacement target `docs/knowledge/why-fgos-add-now-caps-a-work-item-s-id-at-30-characters/long-work-item-ids-max-length-guard.md` exists.
  - Anchor `#why-add-had-this-gap-and-submit-didnt` resolves to H2 "Why `add` had this gap and `submit` didn't" (target line 21). That section does explain the add/submit id gap, so the description is true. The reason's note that the later generateId change is stated separately in the comment is also true.
  - The hunk context lines match source lines 1054-1061 exactly. Only `//` comment lines change, so no code behavior changes. The path is repo-root-relative, the same form as the source. Rewrap onto a longer line is fine.
- Parked (all reasonable, no wrong disposition):
  - cli-001 (L1737) and cli-003 (L1803): `docs/architect/knowledge-registry-redesign.md` §7.4 and §8 quotes. The file still exists at the pin, but it is in a retiring tree and no non-carriage successor passage is proven. Phase 9 carry.
  - cli-005 (L3555): `docs/specs/runner.md: "a session worktree is structurally the wrong place..."`. The path does not exist at the pin (runner now lives under docs/platform/runner/), and the quote appears only in docs/history/tsk-ikd-return-main-worktree-guard/RESEARCH.md. A dead pointer parks per the rule.
  - cli-006 (L4215): `docs/specs/distribution.md` RUL9 and the later reversal gloss. Phase 9 carry.
  - class6-l-000094 (L1957): `docs/specs/<area>.md` is a single-layout assumption and needs a description rewrite. Parked correctly.
- Preserve (L12-10/L12-26/38/40): 29 slots, all correct.
  - docs/history/** conventions and named historical evidence: L211, 213, 219, 281, 1089, 1127, 1161, 1707, 2204, 2233, 2264, 2280, 2595, 3720, 4116, 4129, 4219, 4397, 4793.
  - Surviving native paths: docs/decisions/index.md (L1958, L2039) and docs/distillery/deep-dives/tool-registry.md (L3958).
  - All named history paths exist at the pin (CONTEXT, RESEARCH, DISCUSSION companions, plus dirs agent-coordination-state-root and compound-learn-artifact-registry). No history topology is converted.

## OUTCOME defects

None.

## Record-text notes (not rework)

- Duplicate-slot labels: class6-l-000081, 088, 102, 103, 106, 107, 108 and 085 appear twice, once per physical line of a wrapped path. That is consistent with multi-line spans, and each is dispositioned the same way both times.
- The patch comment says "Phase 9 exact patch specification". The `timing: Phase 9` field is consistent.

## Lead-judgment questions

1. Census edge class6-l-000113 (step-02l, roleHint reader, pre-rebase line 5059, now line ~5108) cites `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md`. It sits inside a thrown StoreError message string, `...per ADR0020: docs/decisions/0020-chan-fgos-khoi-worktree-worker.md`. The file does not exist at the pin, since docs/decisions/ holds only index.md. This edge is in no step-04 record (inventoryEdgeIds has 36 ids and none is 113), and no parked or preserve slot accounts for it. The same applies to cli-002 and cli-012..028 (executable code, Step 5 per L12-14), which is explainable. 000113 is user-facing message text, though, not code logic, so it is arguably in scope for "CLI help". Please confirm it is routed to Step 5 (a runtime message edit would change output behavior) and that the omission is deliberate rather than a dropped edge. If it should have a record, it parks as a dead pointer, with a successor note for ADR0020 pointing to docs/specs/runner.md Lịch sử quyết định or docs/platform/runner. I am not counting this as rework because I could not tell whether the checker intentionally excludes executable string literals.
2. Uncovered but out of scope: line 270 cites `plans/260825-0842-fgos-logs-dir-bucketing`, which has no tree at the pin. It is a historical plan citation in a comment, with no census edge. Lead may decide whether to track it.

## Counts

- Set step04-010: 1 file reviewed, 0 rework.
- Stratum: mandatory 1/1 reviewed, 0 rework. Patched sample 1/1, 0 rework. Unpatched stratum 0/0.
