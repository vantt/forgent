# Host Invocation fresh-reader review

Reviewer: reviewer:claude-session:a4954387@2026-10-13
Key: [fresh-reader-key-261013-1543-host-invocation-checkpoint.md](fresh-reader-key-261013-1543-host-invocation-checkpoint.md), committed at 48195b2c2 before either reader started
Docs commit read: df8321b33 (after the native selector follow-up review)
Authority: owner answer A32 (Lead-spawned readers instead of owner-started sessions)
Raw answers: [reader 1](fresh-reader-261013-1850-host-invocation-checkpoint/fresh-reader-1.md), [reader 2](fresh-reader-261013-1850-host-invocation-checkpoint/fresh-reader-2.md)

Two in-process Sonnet readers, no conversation history, each told to read only `docs/platform/host-invocation-routing/` starting at its portal, and not to open `plans/`, `docs/architect/`, `AGENTS.md` or source code. They received only the three scenario titles, the six definition-of-done questions and the citation rule; neither saw the key. Isolation is UNPROVEN: the readers had shell access, and read-only was an instruction, not a sandbox. Cross-check: both opened-file lists contain only files under the area, and `git status` was clean after both runs.

## 1. Scoring against the key

The scoring rule is from [pilot-b-fresh-reader-key.md](../phase-05/pilot-b-fresh-reader-key.md), applied as in [pilot-b-fresh-reader.md](../phase-05/pilot-b-fresh-reader.md). An answer is correct when it names an acceptable owner or an equivalent supported anchor, with a citation whose content supports it. "Partial" means the main element is right and a key distinction is missing or sits in another answer; a partial answer counts as correct.

| Reader | Scenario | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Correct |
|---|---|---|---|---|---|---|---|---:|
| 1 | A | yes | yes (contracts rule: contract boundary change) | partial (independent versioning named; exact pair and design-only range appear in Q4) | yes (exact pair implemented, range/transforms design) | partial (R2 conformance named; pair refusal not named) | partial (decision and spec placement; contract update not named) | 6 / 6 |
| 1 | B | yes (legacy-payload resolution rule, equivalent owner) | yes | yes | partial (no PATH/cwd ban or obsolete npm-bin clause; risk drawn from lane size) | yes | yes | 6 / 6 |
| 1 | C | yes | yes | partial (catalog/route flip; same semantic operation not named) | yes | yes (manual guidance stated) | yes | 6 / 6 |
| 2 | A | yes | yes | yes | yes (fail-closed incompatible-contract added) | yes | yes | 6 / 6 |
| 2 | B | yes | yes | yes (PATH/cwd ban stated) | partial (ban sits in Q3; obsolete npm-bin clause not named) | yes | yes | 6 / 6 |
| 2 | C | yes | yes | yes | yes (rollback bullets cited) | yes | yes | 6 / 6 |

Files opened before the first correct owner document: at most 4 for both readers, against a limit of 8. Legacy-authority answers: none. Candidate versus implemented: both readers kept exact-pair matching apart from design-only range/transforms, and R1/R2/R3 previews apart from planned writer migration.

## 2. Cited anchors checked by script

Each cited `path#anchor` was checked against the GitHub-style slugs of the cited file's headings, and the 25 distinct citations of both readers were each rechecked with `node scripts/list-doc-anchors.mjs --check <path#anchor>`: 25 pass.

| Reader | Citations | Anchors that do not exist |
|---|---:|---|
| 1 | 21 distinct | none |
| 2 | 20 distinct | none |

## 3. Substantive notes from the readers

- Neither reader found a risk rubric in the area. Every Q4 answer says "not found as an explicit rating" and then reasons from the status labels, migration rules and rollback rules. The key's risk distinctions are present in restored sections, but no single section gives the risk. This is a gap in the area, not a reader error.
- Neither reader reached the FLAGGED-obsolete npm-bin clause at `architecture/release-boundaries.md`. That clause is retained as dated design and deferred to Packaging-distribution (F6), so missing it does not mislead about the current contract.
- Both readers noted that the ten-step per-component procedure is in `contracts/component-protocol.md#restored-per-component-repeat-procedure`, while `architecture/node-to-rust-migration.md` only points to it. Several restored sections are verbatim carries placed inside topic-adjacent files, so navigation depends on the portal and the pointers.
- Reader 2 noted that the release manifest contract owning `components.legacyNode.root/entry` lives outside the area, in Packaging-distribution.
- Reader 1 noted that the area has no definition of done at area level; proof is assembled from the implementation-alignment table, the compatibility harness and the R1/R2/R3 records.

## 4. Criterion

| Criterion | Result |
|---|---|
| At least 5 of 6 correct per reader and scenario | met (6 / 6 in all six cells, seven of them partial) |
| 0 non-existent cited anchors | met (0 of 41) |
| 0 answers relying on a legacy path as authority | met |
| At most 8 files before the first correct owner | met (at most 4). The phase file says "at most 8 files read per run"; the key and the pilot count files before the first correct owner. Over the whole run, reader 1 opened about 14 files and reader 2 about 10 per scenario, so the per-run reading fails |

The partials are graded leniently, as in the pilot. Under a strict reading, reader 1 scenario A has three partials and would score 3 / 6 if partials counted as wrong. The risk-rubric gap above is the common cause of the Q4 partials.
