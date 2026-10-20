# Review p05 (seam 5 judgment files)

Pin 5eb9dc609, one file, 6 items (1 literal, 5 dynamic tuples), no diff (parked/preserve only).

## test/docs/rul11-anchor-phrase.test.mjs — verdict: ok (6 items reviewed)

| id | line | admission / disposition | check |
|---|---|---|---|
| reference-004050 | 30 | REJECT / preserve, test-name-label | True: the string is only the test() title. The read at L31 uses the PLATFORM_FOUNDATIONS_SPEC constant, not this literal. Preserve is also right because test titles are baseline keys that must stay byte-for-byte. |
| dynamic-018752, 018753 | 16 | REJECT / preserve, root-only | True: `path.resolve(dirname(import.meta.url), '../..')` is root plumbing with no document operand (R5). |
| dynamic-018754 | 17 | ADMIT / preserve, pathOperand `path.join(REPO_ROOT,'AGENTS.md')` | It yields a real document path (read at L24 and L48). AGENTS.md is a retained root, not under docs/specs or docs/architect, so preserve is justified. There is no writer or alias. |
| dynamic-018755 | 18 | ADMIT / parked, pathOperand `path.join(REPO_ROOT,'docs','specs','platform-foundations.md')` | The operand yields a document path; the reads are at L31, L36 and L43. The blocker is verified, see below. |
| dynamic-018756 | 23-28 | REJECT / preserve, text-label-join | It covers the assert.ok failure-message label only. The AGENTS.md read has its own admitted tuple (018754), and both items preserve, so there is no outcome conflict. |

### Park verification (018755)
Checked at the pin:
- `docs/platform/platform-foundations.md` has only a RUL11 summary row at L58. It has no `- **RUL11…** ` locked-law line and no `### 0036 — Khoá RUL11` heading.
- `git grep` of the pin over docs/platform and docs/knowledge for those two strings finds no holder. The hits are unrelated RUL11 meanings, proof logs quoting the test title, and distribution docs.
- The `- **RUL11` line and the `### 0036` heading exist only in the retiring `docs/specs/platform-foundations.md` (L74 and L388).

The park therefore names the exact missing claims (law wording and heading) with real search evidence, and is specific to this passage. There is no live holder, so patch is not available. The park rests on no "retained" witness.

## OUTCOME defects
None.

## Record-text notes (non-blocking)
1. 004050: the reason says "neither a filesystem operand nor an assertion against emitted product output". It could add that the title is a baseline key. A Phase 9 patch of the L31 read must not rename the title, or the baseline key changes; the existing parityObligation covers this only implicitly.
2. The L42 title cites D-ADR0036 (superseded by D-ADR0054) and the L44 message quotes the heading. Neither is a path, so no item is required. If the Lead treats title citations of retired decisions as items, a successorNote naming 0054 would apply.
3. 018756 is labelled non-document-operation / text-label-join, but the message embeds the literal "AGENTS.md". Both outcomes are preserve, so this is a label matter only.

## Lead-judgment questions
None. The park is a real blocker: promote the RUL11 law line and the 0036 narrative heading into the candidate platform-foundations holder before Phase 9 moves the reads.

## Counts
Files 1 (ok 1, rework 0); items 6 (admit 3: 1 preserve, 1 parked, plus 018754/018755 counted once each; reject 3 tuples/literals); outcome defects 0; record-text notes 3.
Precisely: ADMIT 2 (018754 preserve, 018755 parked); REJECT 4 (004050, 018752, 018753, 018756).

Status: DONE
Summary: Single file, 6 items, all admissions and dispositions correct. The park on the three RUL11/0036 reads is verified (no live holder with the law line or heading at the pin); no outcome defects, 3 minor record-text notes.
