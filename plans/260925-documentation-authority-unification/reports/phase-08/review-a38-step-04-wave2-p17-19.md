# A38 review, Step 4 wave 2, parts 17-19 (set step04-010)

Pin dc24ce645. One logical file, bin/fgos.mjs (5236 lines, streamed p17 lines 1-3738, p18 3739-5236, p19 carries the 36 slots).
Method: pinned blob extracted to scratch and read at every docs/ / .md / plans/ / skill-path hit (grep over the whole 5236 lines, then each edge region read in context); payload record read per slot with python3.

## bin/fgos.mjs (set step04-010, stratum: mandatory re-review, whole-file)

Verdict: ok

Slots reviewed: 36 of 36 (preserve 27, parked 5, patch 2 that are the two joined slots of one hunk, remaining are the history-literal preserves; stepFiveExcluded list of 29 entries also checked).

| Disposition | Slots | Edge ids |
| --- | --- | --- |
| parked | 5 | cli-001, cli-003, cli-005, cli-006, class6-l-000094/cli-004 |
| patch | 2 (one hunk) | class6-l-000085 at original lines 1056 and 1057 |
| preserve | 29 | history/RESEARCH/CONTEXT conventions and named history evidence, docs/decisions/index.md, docs/distillery/deep-dives/tool-registry.md |

### Patch check (the only diff hunk, @@ -1054,8 +1054,8 @@)
- Comment-only change inside the `add` case, lines 1057-1058; no code token touched, no behavior change.
- Old target docs/explanation/long-work-item-ids-max-length-guard.md does not exist at the pin (dead link), so a patch is right.
- New target docs/knowledge/why-fgos-add-now-caps-a-work-item-s-id-at-30-characters/long-work-item-ids-max-length-guard.md exists at the pin; its heading "## Why `add` had this gap and `submit` didn't" (line 21) resolves to the anchor `why-add-had-this-gap-and-submit-didnt`. The comment's claim (the gap that let `add` accept a long slugified id) matches that section; the later generateId change is stated by the comment itself, not attributed to the target. Both inventory occurrences (1056 and 1057) point to the same hunk and same target.
- Path stays wrapped across two comment lines exactly as the original did; backtick/label form not applicable (plain comment path). Relative form is repo-root `docs/...`, same as before.

### Parked slots (reason checks)
- cli-001 (line 1737, docs/architect/knowledge-registry-redesign.md section 7.4) and cli-003 (line 1803, same doc section 8): the comments quote the attestation and producer-gate rules. The only other holder at the pin is docs/platform/proposals/knowledge-registry-redesign.md, a proposal copy of the same text, not a live spec. Parking for a non-carriage successor is justified.
- cli-005 (line 3555, docs/specs/runner.md quote "a session worktree is structurally the wrong place..."): grep at the pin finds that sentence only in docs/history/tsk-ikd-return-main-worktree-guard/RESEARCH.md, no live runner spec holds it. Park justified.
- class6-l-000094/cli-004 (line 1957, `docs/specs/<area>.md`): the sentence describes a one-file-per-area layout that the candidate tree splits; park pending Step 5 reader trace is consistent with the rulings.
- cli-006 (line 4215): see the Lead question below.

### Preserve checks
All cited history paths exist at the pin (CONTEXT/RESEARCH/DISCUSSION files, the compound-learn-artifact-registry, merge-standardization, tsk-3bn and agent-coordination-state-root directories), so no dead link was missed; these are external-project history conventions or named history evidence (L12-10, L12-60). docs/decisions/index.md and docs/distillery/deep-dives/tool-registry.md exist and are retained native paths.

### stepFiveExcluded check
All 29 entries are runtime strings or readers, correctly excluded under L12-60 ruling 1: line 224 (evidencePath template), 1758/1759 (doc-registry paths), 2026 and 2091 (docsRef fallback template), 3064 (thrown message `<docs/quadrant-dir>`), 5108 (thrown message citing ADR0020 path), plus the cli-013..cli-028 string literals. Spot-checked lines 224, 1758-1759, 2026, 2091, 3064, 5108 against source: all executable string/template, not prose comments. No maintained-comment edge is hiding in the excluded list.

### Coverage check
Every docs/ reference in a comment is a slot or an exclusion: 211, 213, 219, 281, 1057, 1089, 1127, 1161, 1707, 1737, 1803, 1957-1958, 2039, 2204, 2233, 2264, 2280, 2595, 3555, 3720, 3958, 4116, 4129, 4215, 4219, 4397, 4793. Every census edge for this file is joined to a slot or exclusion (cli-004 and the class6 pairs are joined through inventoryRefs).

### OUTCOME defects
None.

### Record-text notes (not rework)
- Parked reasons for cli-001, cli-003, cli-006 and class6-l-000094 repeat the prefix "A51, L12-30/31/32/58/60: A51, L12-30/31/32/58/60:" and the matching blockedReason omits "60"; cosmetic.
- cli-006 reason hedges ("differs from the stated reversal/gloss or lacks the exact token row") rather than naming the exact difference.
- Comment mentions not in the census and carrying no slot, all native/non-legacy so no outcome effect: line 2043 `docs/enduser-docs-index.json`, line 2974 `docs/<quadrant>/`, line 3004 bare `docs/`.

### Lead-judgment question
- cli-006 (source line 4215, `docs/specs/distribution.md RUL9`): the park says the live doctor contract "differs or lacks the exact token row". At the pin, docs/platform/packaging-distribution/spec.md line 644 holds "RUL9 (doctor's default path never writes anything)" under the live Business Rules heading (not under Lịch sử quyết định, which starts at line 714), and its text ("--fix is the deliberate exception ... reversed from the original no-exceptions wording per tsk-2qz") matches the comment's claim and its "deliberate reversal" gloss. A patch to that spec with the RUL9 title-matched label looks possible. I left it as ok because parking is the conservative direction, the park was re-derived in the L12-60 sweep, and the comment also cites RUL11 and distribution-vision.md section 3; Lead should decide whether to keep the park or convert it to a patch (would count as rework for this file).

## Counts
- step04-010, mandatory re-review stratum: 1 logical file reviewed, 0 rework (if the Lead converts cli-006, 1 of 1).
- Other strata in this set: none.

Status: DONE_WITH_CONCERNS
