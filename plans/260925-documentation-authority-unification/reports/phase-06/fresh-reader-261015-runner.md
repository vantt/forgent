# Runner (Step 9) fresh-reader review

Scorer: `reviewer:claude-session:a4954387@2026-10-15 (scorer, not key author, not a reader)`
Key: `plans/260925-documentation-authority-unification/reports/phase-06/fresh-reader-key-261015-runner.md`, committed before either reader started (key header HEAD 81d0ed074).
Content commit: 24be6cb1d (docs equal content 81d0ed074); readers and anchor checks ran in the read-only worktree `/home/vantt/projects/forgentX-s8-review`, detached at 24be6cb1d.
Scoring rule: key section 1 and `reports/phase-05/pilot-b-fresh-reader-key.md`, with the Lead adaptation used in every Phase 6 batch (`fresh-reader-261015-whole-system.md` line 5: partial counts as correct). The strict yes-only reading is reported next to it. Wrong counts in neither.

Two Sonnet readers, fresh context, one shared brief (`fresh-reader-brief-s9-runner.md`), answers `fresh-reader-s9-runner-1.md` and `fresh-reader-s9-runner-2.md`. Isolation is UNPROVEN (read-only was an instruction, not a sandbox); the only evidence about what was opened is each reader's own list. The scorer shares the key author's session, so the chain is not fully independent. No carried sentence is shown true by this review.

Legend: Y yes (correct), P partial, N no (wrong). The strict reading counts Y only.

## 1. Anchor checks

Every `docs/platform/...#anchor` in both answer files was extracted and run with `env -u CLAUDE_CODE_SESSION_ID node scripts/list-doc-anchors.mjs --check <path#anchor>` from the worktree root. A deliberately bogus anchor was confirmed to exit 1.

| Reader | Distinct anchors | Missing or fabricated |
|---|---|---|
| 1 | 14 | 0 |
| 2 | 10 | 0 |
| Union | 17 | 0 |

Reader 1's `unheaded-block-183` and `-187` (the 0058 and 0062 bodies) and `unheaded-block-35` and `-36` (RUL76 and RUL77 to RUL100) exist; the tool listing shows 187 is the 0062 body (lines 1718-1734). No legacy path is cited as an anchor by either reader.

## 2. Reader 1 (7 files opened; limit 8)

Opened, in order: `README.md`, `runner/README.md`, `governance.md` (ranges), `documentation/switchboard.md` (ranges), business rules `spec.md` (ranges), `decisions/h-36d872fbb0e5.md` (ranges), `migration-authoring-rules.md`. All in the brief. Did not open the data dictionary, entry points, architecture, operations or `component-boundary.md`.

| Scenario | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Y/P/N |
|---|---|---|---|---|---|---|---|
| A (`--idle-timeout`) | Y: README#4, SW#4, RUL96 block | Y: legacy-current, goes once to `docs/specs/runner.md`, no dual-author (MR#1) | Y: RUL96, RUL98, RUL99 as carried statements; also notices the carried RUL76 mentions `--idle-timeout-ms` and flags it as superseded in part | Y: moderate to high, lock and reaper chain, carried claims unverified | Y: names the ratchet exception and says behavior proof (refusal, provenance, resume, idle kill) cannot be verified from scope | Y: new rule after RUL100, decision only if a choice is settled, candidate impact in the ledger | 6/0/0 |
| B (`dispatch execute`) | Y: 0062, RUL90, RUL68, RUL77, then the switchboard for the owner | Y: reversal of an owner decision, new superseding record, a person must decide | P: RUL90 and 0062 right; does not name the carried conflicts (data dictionary compat mention, R3 gate) because the data dictionary was not opened | P: high, dissent and "not refuted" recorded; says the record is a boundary change but does not say the component-boundary check applies or name `component-boundary.md` | Y: new record, guards and doctrine test updated deliberately, carried "tests exist" not trusted | Y: new record naming 0062, `ĐÃ BỊ THAY` style on RUL90, id after 0063 not verifiable | 4/2/0 |
| C (partial-writes retry) | Y: RUL92, RUL91, 0058, then migration rules and the switchboard | Y: decision record plus rule change at the legacy owner once, ratchet exception, notices no carried record exists for RUL92 | Y: RUL92, RUL91, 0058 write gate, RUL99 exit 12 | P: "medium to high" is above the key's low-to-medium for text; no `ĐÃ BỊ THAY` or component-boundary line named (does say the chat decision is not binding until recorded) | Y: record has the sibling sections, rule and narrative agree, superseded wording marked, ratchet; behavior proof unverified | P: names the legacy history and candidate impact; does not flag that the history heading says "retired" while holding live `Settled` records (key conflict 1) or the front-matter versus body dates (conflict 4) | 4/2/0 |

Binding owner `docs/specs/runner.md` named in every scenario through the switchboard row and not opened. Carried status words and "tests exist" statements are explicitly not treated as proof. No out-of-scope opens reported.
Result: lenient PASS (6, 6, 6 of 6 with partial counted); strict FAIL (6, 4, 4).

## 3. Reader 2 (7 files opened; limit 8)

Opened, in order: `README.md`, `runner/README.md`, `runner/spec.md` (preamble), `governance.md` (authority matrix), `documentation/switchboard.md` (ranges), business rules `spec.md` (ranges), decisions file (ranges). All in the brief. Did not open `migration-authoring-rules.md`, data dictionary, entry points, architecture, operations or `component-boundary.md`; says so and says the data dictionary and entry points content is unverified.

| Scenario | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Y/P/N |
|---|---|---|---|---|---|---|---|
| A (`--idle-timeout`) | Y: README#2, SW#4, RUL96 and RUL98 | Y: spec-fact edit, binding owner legacy, no dual-author, ratchet exception | Y: RUL96 and RUL98 precedence, `unit.json`, lock ttl and reaper interaction; names data dictionary and entry points as unopened | Y: moderate, adds a refusal path and a stored field, candidate not reviewed | Y: behavior plus test of the refusal, cannot see code, ratchet route | Y: new numbered RUL (gap at 81 noted), decision only if wording changes, candidate updated only through migration | 6/0/0 |
| B (`dispatch execute`) | Y: 0062, RUL90, then RUL77 and RUL76 | Y: reversal of an owner decision, owner must reopen, not a maintainer edit | P: RUL90, 0062 guards, doctrine and boundary right; no carried-conflict naming (data dictionary compat mention, R3 gate) | P: high, dissent, options; mentions the boundary change but not the check or `component-boundary.md`; the review-rule options come from standing instructions and the reader says so | Y: undefined until the owner re-decides, guards replaced, tests unverifiable | Y: new record partly superseding 0062, rule updates, once in `docs/specs/runner.md` | 4/2/0 |
| C (partial-writes retry) | Y: RUL92, RUL91, 0058 | Y: decision record plus rule text, chat is not a record, says whether it reverses or refines RUL92 | Y: RUL92, 0058 write gate, RUL91; confirmation mechanism flagged as open | P: "moderate to high"; carried blind spots (gitignored, nested repos) named; no `ĐÃ BỊ THAY` or component-boundary check | Y: record and rule agree, one owner, candidate untouched by hand | P: new record with the sibling sections and a boundary line, once at the legacy owner; cites the history heading but does not flag "retired" versus live records or the front-matter dates | 4/2/0 |

Binding owner named in every scenario; carried claims not treated as verified; no out-of-scope opens reported.
Result: lenient PASS (6, 6, 6 of 6); strict FAIL (6, 4, 4).

## 4. Pass or fail

| Reader | Anchors | Files (limit 8) | Out of brief | Legacy-authority answers | Lenient (partial counts) | Strict (Y only) |
|---|---|---|---|---|---|---|
| 1 | 14 checked, 0 bad | 7 | 0 | 0 | PASS | FAIL (B and C at 4 of 6) |
| 2 | 10 checked, 0 bad | 7 | 0 | 0 | PASS | FAIL (B and C at 4 of 6) |

Disagreement between readers: none that changes a verdict. Reader 1 reached a Y on A that both reached; Reader 1 surfaced the carried `--idle-timeout-ms` mention; Reader 2 flagged the confirmation mechanism as an open design question and kept the data dictionary and entry points as explicitly unverified. Both fail strict for the same reasons, which sit in the key's area-specific requirements (the carried data dictionary and R3 gate conflicts on B, the retired-heading and front-matter conflicts and the component-boundary line on C) that neither reader reached with a 7-file spend.

## 5. Area gaps surfaced (owed items)

1. The carried Business Rules RUL76 mentions a per-call `--idle-timeout-ms` and `runner.idleTimeoutMs` override, so scenario A's premise (add an idle timeout) may already exist in carried text; truth check owed against the owner spec and code (reader 1).
2. The known carried conflicts (data dictionary "compat door `dispatch execute --effort`" versus RUL90 and 0062; R3 gate "pending" versus "reached"; history heading "retired" versus live records; front-matter `coverage: full` versus dated body) sit only in a report and inside large files, so a bounded reader misses them; owed a short conflicts pointer in the candidate README next to the reading routes.
3. RUL90, RUL92, RUL96 and the 0058 and 0062 records have no individual anchors (they sit in `unheaded-block-36`, `-183`, `-187`); both readers could only cite blocks; owed per-rule anchors or a rule index.
4. The component-boundary check that decision records name (`component-boundary.md`) is not reachable from the runner README reading routes; neither reader opened it; owed a pointer.
5. The carried history has no decision record for RUL92 or RUL96, and id 0054 is absent without explanation (reader 1 noticed the first; both said the next id could not be verified).
6. The candidate switchboard copy says it carries `docs/transitional-switchboard.md` while the portal and governance name the root file as operative; reader 1 could not resolve which governs (recurring, not runner-specific).
7. The worktree root held untracked `dig-out.json` and `verify-out.json` at scoring time; neither reader reported creating them, attribution is UNPROVEN, and they were not touched.

Status: DONE
Summary: Reader 1 and reader 2 both PASS under the lenient reading (6/6/6 each, 17 distinct anchors, 0 missing, 7 files each, 0 out-of-brief) and both FAIL under the strict yes-only reading (B and C at 4 of 6, missing the key's area conflicts and the component-boundary check).
Concerns: Isolation unproven; scorer shares the key author's session; strict failures come from key area requirements beyond the readers' file spend.
