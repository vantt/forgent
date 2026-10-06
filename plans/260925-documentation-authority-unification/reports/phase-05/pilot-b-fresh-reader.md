# Pilot B fresh-reader review

Two in-process Sonnet readers, no conversation history, no access to the plan reports (told not to open `plans/`, `archive/`, `.fgos/`), told to treat `docs/platform/work-state/` as canonical, to start at its portal and not to open `docs/specs/work-state.md` or `docs/io-contract.md`. Three change scenarios (A: add a work-item status, B: change one exit code of the CLI envelope, C: remove a retired state field), six definition-of-done questions each, answers with `path#anchor` citations and the list of files opened. Answer key: [pilot-b-fresh-reader-key.md](pilot-b-fresh-reader-key.md), committed as `2a4f8c877` before the readers ran.

Isolation is UNPROVEN: the readers had shell access and "read-only" was an instruction, not a sandbox. Cross-checks: the opened-file lists of both readers contain neither legacy document nor anything under `plans/`; `git status` was clean after both runs.

## 1. Scoring against the key

Correct = names an owner among the key's acceptable owners with a citation whose content supports it, and does not rely on a legacy path as authority. "Partial" = the main element is right and a key element is missing (counted correct).

| Reader | Scenario | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Correct |
|---|---|---|---|---|---|---|---|---:|
| 1 | A | yes | yes | yes | yes | yes | yes | 6 / 6 |
| 1 | B | yes | yes | yes | yes | partial (no version bump named) | yes | 6 / 6 |
| 1 | C | yes | yes | yes | yes (names the pre-release exemption through the rule text, ADR 0007 not 0019) | yes | yes | 6 / 6 |
| 2 | A | yes | yes | partial (status enumeration and rules named, cites RUL anchors not the data dictionary) | partial (locked-law bar named; log immutability and replay appear in Q5) | yes | yes | 6 / 6 |
| 2 | B | yes | yes | yes | yes | partial (no version bump named) | yes | 6 / 6 |
| 2 | C | yes | yes | yes | yes (ADR 0019 cited) | yes | yes | 6 / 6 |

Files opened before the first correct owner document: 3 for both readers (portal, spec, contract) against a limit of 8. Authority confusion: none (both readers noted that the portal says the legacy documents stay canonical until the cutover and followed the instruction they were given; neither used a legacy path as authority).

## 2. Cited anchors checked by script

Every cited `path#anchor` was checked against the heading and block anchors of the cited file (extractor anchors):

| Reader | Citations | Anchors that do not exist |
|---|---:|---|
| 1 | 16 distinct | `docs/platform/work-state/spec.md#workflow-step-and-stage-model` (the heading is `## 5. Workflow Step And Stage Model`, so the anchor is `#5-workflow-step-and-stage-model`); `AGENTS.md#install-setup-doctor-gate` (the heading `## Install/setup/doctor gate` slugs to `#installsetupdoctor-gate`) |
| 2 | 17 distinct | none |

Cause assessment: both wrong anchors were derived by the reader from the heading text, not copied; the first drops the number prefix that the heading carries, the second keeps a slash as a hyphen. The prompt gave the slug rule (lower case, spaces to hyphens, punctuation removed) and the example `## 4. Exit Codes` is `#4-exit-codes`, so the reader had the rule; reader 1 itself noted the real heading text next to the first anchor. The candidate documents do not carry explicit anchors, so anchors are always derived; this is a property of the heading-anchor convention rather than of the candidate structure, and it is a Phase 7 consideration for the fresh-reader procedure (give readers a script that lists anchors). Whether it counts as "a fabricated anchor whose cause is the method" is a ruling for the owner: the strict reading of the criterion (0 non-existent anchors) fails for reader 1 and passes for reader 2.

## 3. Substantive notes from the readers

- Both readers could not find where a new decision record is to be written now (the retired history says the old decision corpus is retired); the candidate area documents do not answer it. This is a real documentation gap of the area at cutover, not a reader error.
- Neither reader found a rule on whether an exit-code change bumps a version token; the key expected "version bump" from the explicit-version decision. The candidate carries exactly what the legacy documents say; the gap is in the source.
- Reader 2 flagged that the portal states the candidate documents are candidate material while the instruction said to treat them as canonical; that is the labelling working as designed.

## 4. Criterion

Per reader and scenario at least 5 of 6 correct: met (6 of 6 in all six cells, with three partial answers). 0 answers relying on a legacy path as authority: met. At most 8 files before the first correct owner: met (3). 0 non-existent cited anchors: met for reader 2, not met for reader 1 (2 of 16).
