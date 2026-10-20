# Review a38 step 04 wave 3, part 20 (set step04-024)

Reviewer scope: final-state review at author pin dc24ce645, six whole source files, 13 slots (12 payload records; source read through EOF by reference grep plus full slot/diff/witness read). Category: run-lock.mjs and transport.mjs are A (outcome changed); the other four are in the expanded set (B for trust-store, worker-home, frozen-judge, goal-check, transport).

## Per-file verdicts

| File | Set | Stratum | Verdict | Slots |
| --- | --- | --- | --- | ---: |
| src/runner/dispatch/run-lock.mjs | 024 | code comment | ok | 1 (patch) |
| src/runner/dispatch/transport.mjs | 024 | code comment | ok | 4 (3 preserve, 1 patch) |
| src/runner/dispatch/trust-store.mjs | 024 | code comment | ok | 1 (preserve) |
| src/runner/dispatch/worker-home.mjs | 024 | code comment | ok | 2 (preserve) |
| src/runner/frozen-judge.mjs | 024 | code comment | ok | 3 (preserve; 2 are the same wrapped edge) |
| src/runner/goal-check.mjs | 024 | code comment | ok | 2 (preserve) |

No parked slots in this part, so no park witness to verify.

## Outcome defects

None.

## Evidence per slot

- run-lock.mjs class6-l-000279 (line 5, patch). Target `docs/platform/agent-coordination/architecture/runtime-recovery-design.md` exists and is live (header is not carriage; "Canonical for the current subject"). Heading `## 6. Local Concurrency And Durability` is at line 125, and its row in the section table cites `run-lock.mjs:47-79,306-412`. Anchor `6-local-concurrency-and-durability` matches the heading slug. Passage witness terms (Local Concurrency And Durability, buildRunControlHolder, resolveHolderLiveness) hit that file as live; `isProcessAlive` has 0 hits, which does not matter because three terms hit. The next-line wording `section 6 ("Local Concurrency And Durability")` stays true. Line 3 `plans/260911-2305-...` is a dated plan, now at `archive/plans/`, so ruling 9 applies and it is correctly not an edge.
- transport.mjs class6-l-000280 (lines 18-19) and 000281 (104-105), wrapped. Both are complete wrapped-path slots. `docs/history/dispatch-activation-and-handoff-redesign/CONTEXT.md` and `docs/history/parallel-decomposition-footprint-avoidance/CONTEXT.md` exist at the pin, with history commits. They are source-bound design-origin citations (D7, D1/D3), so preserve is right under L12-10/L12-60. Line 195 `plans/260917-...` is an archived dated plan (ruling 9).
- transport.mjs class6-l-000282 (line 636, patch). `docs/specs/runner.md` changes to `docs/platform/run-supervisor/spec.md`. That spec is canonical and live. Its §4 "Handover: controller to supervisor" names `executeAssignment`. §5.3 covers terminal mode and the folder-trust entry. §7 has the `cleanup-trust` step. §9.1 is controller death. This matches the comment's claim (brief, pane and folder-trust entry handed to a terminal attempt). The patch carries no anchor, same as the original citation.
- trust-store.mjs class6-l-000283, worker-home.mjs 000284: dated proof directories (2026-09-06-p6, 2026-09-06-isolation) exist at the pin and carry history. They are measured evidence citations, so preserve under L12-38/40/46.
- worker-home.mjs class6-l-000285 (line 37): preserve. The comment says the relay gap "is named as open in docs/architect/proposals/coordination-worker-provider-boundary.md". The only live-tree counterpart is `docs/platform/proposals/coordination-worker-provider-boundary.md`, whose header says "Source snapshot retained", "Canonical: No", and "Canonical for: Nothing". That makes it carriage, which is never a patch target, so preserve is defensible. See the Lead question below.
- frozen-judge.mjs class6-l-000286 (lines 7-8): `docs/history/str63-frozen-judge-fgos/CONTEXT.md` never existed (tree and history 0). It is cited as explicit design-origin provenance (D1, D2), which ruling 2 preserves. Not a navigation pointer, so a dead-link park is not required. class6-l-000287 (lines 67-68) is the complete wrapped path of an existing history file.
- goal-check.mjs class6-l-000288 (37) and 000289 (166): `docs/history/tsk-516-approve-reverify-scope/CONTEXT.md` exists with 2 history commits. Preserve is correct.

## Comment-only check

I applied both diffs to scratch copies of the pinned bytes with `patch -p1`, and both apply cleanly.

- Line counts are unchanged.
- Exactly one line differs per file. The changed line starts with `//` in run-lock.mjs and with `*` (inside the `/** ... */` block) in transport.mjs.
- No `*/` is introduced.
- `node --check` passes on both patched files.

Neither patch changes behavior.

## Record-text notes (not rework)

- The 000282 reason text "no runner-area carry is needed" is fine. The passage witness for it is weak (`argsTemplate` hits only proof files), but `executeAssignment`, `folder-trust` and `hands the attempt over` do hit live specs, so the witness is adequate.

## Lead-judgment question

- worker-home.mjs 000285: the preserved wording "is named as open in docs/architect/proposals/..." is a present-tense location claim about the retiring `docs/architect/**` tree. Under the retiring-tree timing rule one could argue for a Phase 9 patch. The successor `docs/platform/proposals/...` is carriage, which is why I accept preserve. If the Lead wants such claims patched anyway, the target would be that carriage file, contrary to the carriage rule.

## Counts

Set 024 stratum code comments, this part: 6 files reviewed, 0 rework, 13 slots reviewed (2 patch, 11 preserve, 0 parked).
