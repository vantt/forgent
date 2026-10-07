# Independent tooling review request

Date: 2026-10-07
Author: codex-session:1@2026-10-07
State: ready-for-review
Implementation pin: `1ec3ceca620d0a3fb40f506ae9646f6882410877`
Baseline: `dbe5c432852837ea01e6025b35868bcb7271495d`
Sync: `57f3e7fe7af86adee1e805925cca82cf7a894164`

## Decision requested

A different owner-started session must read the complete tooling diff and commit `reports/phase-06/review-tooling.md`. Give an explicit accept, accept-with-required-fixes or rework verdict, identify the reviewed code commit and your distinct reviewer session identity, and link each finding to paths/symbols and reproducible evidence. This request and the author's passing tests are not independent acceptance. Do not approve real decision rows, author real batches, alter frozen rules, edit legacy content, push, merge or ship.

The executor stops here. Step 1 item 2 (review brief), item 3 (area maps/routes), and item 4 (baseline counts) follow the committed tooling verdict. Therefore a batch review brief does not yet exist and is not a prerequisite for this tooling-only review.

## Read first

1. `phase-06-transform-all-platform-areas-as-candidate-material.md`: terms, shared checks/review rules, authorized tooling table and stop conditions.
2. `reports/phase-06/owner-answers.md`, including amendments A1, A2 and A3. Do not substitute wider exemptions or loader changes.
3. `plan.md` sections 3, 5 and 7.3–7.7; the vocabulary, minimum constitution and existing shard schema.
4. `reports/phase-06/tooling.md`, `progress.md` and `tooling-verification.json`. The latter contains exact test argv, counts, code pin, prerequisite results and mutation findings.
5. The implementation and tests listed below. The earlier owner-supplied read-only review is prior evidence, not this committed full review.

Work only in `/home/vantt/projects/forgentX-phase00-documentation-authority-unification`, branch `plan/260925-documentation-authority-unification`. Do not write to the main checkout. Before every Git write check `pwd && git branch --show-current`; use explicit paths only. Run sequentially inline, no subagents or dispatch. Do not read secrets, change extractor closure, commit inventory parts, or run state-changing fgos/fgctl commands.

## Review scope

Production:

- `scripts/check-doc-inventory-gates.mjs`
- `scripts/propose-doc-decisions.mjs`
- `scripts/check-doc-retirement.mjs`
- `scripts/check-doc-constitution.mjs`
- `scripts/check-doc-candidate-status.mjs`
- `pilot/claim-decisions.schema.json`

Tests:

- `test/scripts/check-doc-conservation.test.mjs`
- `test/scripts/check-doc-retirement.test.mjs`
- `test/scripts/check-doc-constitution.test.mjs`
- `test/scripts/check-doc-candidate-status.test.mjs`
- `test/scripts/doc-decision-mirrors.test.mjs`
- `test/scripts/doc-decision-exact.test.mjs`
- `test/scripts/doc-decision-review.test.mjs`
- `test/scripts/doc-decision-conservation.test.mjs`
- `test/scripts/doc-corpus-decisions.test.mjs`
- `test/scripts/doc-candidate-conservation.test.mjs`
- `test/scripts/doc-review-authorship.test.mjs`
- `test/scripts/doc-restoration-proofs.test.mjs`
- `test/scripts/doc-review-format.test.mjs`

Reproducible CLI proof: `reports/phase-06/structural-mutation-probe.mjs`. Other review evidence: this request, `tooling.md`, `tooling-verification.json` and `progress.md`.

Use the baseline-to-implementation diff for these explicit paths; inspect first-parent non-merge history for red/green commits. The inherited five preparation files in commit `1cc92d7db` are preserved and outside the tooling changes. A3 exempts only those exact commit/path pairs, never subsequent edits.

## Required adversarial checks

| Area | What the reviewer must verify |
|---|---|
| Repeated inputs | Each missing/empty decision input fails explicitly; combined duplicates are rejected; default/single-input semantics stay intact. |
| Exact/mirror proof | Legacy source only, never self-source; unique target ownership; heading ancestry and thresholds; committed blobs/digests re-proven each run; no hand-written script identity shortcut. |
| Session independence | Normalize date and reviewer prefix; one declared session cannot review itself. Identity declarations alone are not proof of physical session isolation. |
| Committed reviews | Pre-reviewed rows without matching committed reports fail closed; row-specific report commit pins survive later report rounds; wrong/future report pins and mismatched author/reviewer/pack/score/note fail. |
| Sensitivity secrecy/binding | Seed/key/selection remain private, mutated text loses the original digest, score must pass before apply, and targetUnitDigest comes from the text seen by the reviewer. Normal packs expose complete heading payloads; seeded packs do not disclose original private bindings. |
| Sensitivity controls | Same-batch script carries are re-proven and already-reviewed controls have current committed proof. Forged controls cannot make a score authorize review. Thresholds remain 5/6 detected and at most 2/24 false flags. |
| Hold/rework A2 | Unknown-blocking rows remain blocking, others pending; retain note and searched evidence but remove reviewedBy/reviewedAt and approval proof. No gate invariant loosening. |
| Legacy compatibility | Explicit current `--pack --author` binds to committed `Author session:` report header, not invented old row metadata. Legacy shard fields/flag remain untouched; new-shard authoredBy/authorSession remain mandatory. Check this interpretation against the frozen legacy exception. |
| Rebind/coverage | Same digest at another heading loses reviewed status; legacy-only coverage respects explicit heading ranges. |
| Corpus/conflict/root data | Corpus rules are non-authority classified and committed human-reviewed; malformed, duplicate or stale conflict receipts cannot close unrelated current groups; fixed roots/projections/instruction files cannot be silently retired by data. |
| Reverse/status checks | Unnamed target-area siblings are included; pointer-back carriers cannot substitute for content; constitution consumes decisions; strict status checks include untracked candidates. |
| Restoration | Restored digest/anchor must exist in the committed tree; deferred stub must exist. Mechanical proof does not imply a genuine restoration verdict. |
| Vocabulary first use | T7 first-use promotion is deferred to real usage. Synthetic fixtures must not justify a vocabulary amendment or blanket in-use status now. |

## Observed proof

- Scripts suite: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/*.test.mjs` with all 51 literal paths expanded by Node; 855 pass, 0 fail, 0 skipped/todo.
- Complete suite on implementation pin: `env -u CLAUDE_CODE_SESSION_ID node --test <389 literal paths>`; 7,318 tests, 7,245 pass, 0 fail, 8 skipped, 65 todo, exit 0. Exact argv and existing runner environment are recorded in `tooling-verification.json`; no added skip branch or test filter. Scratch output is `/tmp/phase06/full-suite-committed.log` with its SHA-256 in the evidence record.
- Modern actual CLI fixture: 61 units; uncommitted report rejected, committed report accepted, verified rows repack, zero unchanged-overlay invariant findings. One-row rework uses 60 unchanged controls and preserves the other report pins.
- Legacy actual CLI fixture: independent committed report required, old shape preserved, forged self-author rejected. Actual old I/O scratch clone renders 41 rows without changing historical author fields. No real repository approval or author-run genuine seed selection occurred.
- Structural probe: `node plans/260925-documentation-authority-unification/reports/phase-06/structural-mutation-probe.mjs`; clean fixture zero findings; all 11 defects rejected with their expected finding. This probe uses its isolated fixture registry, not the real prior-registry pair and not real-batch E.
- A/B/C/I: zero violations after the exact five A3 exemptions; extractor closure, authority statuses and reader/instruction texts unchanged.
- Ratchet: exit 0, 995 files, 24 accounted edits, 1 accounted new file. Placement: exit 0, 446 files, 445 matched, zero leftover/ambiguous/evidence-without-index, 1 recorded exception.
- Candidate status: exit 0, the same 5 baseline findings, zero new findings. Retirement cutover remains expected red: exit 1, 15 blocked, 4 pass, 1 review, zero invariant failures.

### Repeat both real conservation invocations

Refresh scratch first, then run each prior separately. Do not change `loadPreviousRegistries` or supply a repeated flag expecting the loader to merge it.

```sh
node scripts/generate-doc-inventory.mjs --refresh --commit HEAD --identity-registry /tmp/phase06/identity-registry.json --json-out /tmp/phase06/doc-inventory.json --md-out /tmp/phase06/doc-inventory.md
node scripts/check-doc-inventory-gates.mjs --inventory /tmp/phase06/doc-inventory.json --identity-registry /tmp/phase06/identity-registry.json --previous-registry plans/260925-documentation-authority-unification/reports/identity-registry.json --decisions plans/260925-documentation-authority-unification/pilot/decisions --json
node scripts/check-doc-inventory-gates.mjs --inventory /tmp/phase06/doc-inventory.json --identity-registry /tmp/phase06/identity-registry.json --previous-registry plans/260925-documentation-authority-unification/reports/phase-02-identity-registry.json --decisions plans/260925-documentation-authority-unification/pilot/decisions --json
```

Both observed exits are 0 and full parsed JSON is baseline-identical; G has zero claim-id-loss/self-review findings. Ledger decision input is not supplied until it contains a real shard. Actual batch E is not due yet and remains UNPROVEN; when it becomes due, repeat the scoped strict invocation separately against each owner-specified prior.

## Owner-routed lists and limits

- Archive/delete: none authored.
- Real conflicts: SC-1 already owner-resolved; candidate correction belongs to the later root-authorities batch. No new conflict decision requested.
- Holds, including held unknown-blocking claims: none authored.
- Promoted-document edits: none.
- Open owner questions: none.

Independent full tooling review, the skipped/todo tests, physical session independence beyond declared identity, real-batch E, review brief, maps/routes, baseline counts and all real batches remain UNPROVEN or not started. GitNexus's stale index reports no changes despite observed tracked modifications; it is not a scope certificate. No JavaScript LSP server was available. No authority cutover, legacy-root edit, instruction edit, extractor edit or main-checkout write is part of this delivery.

## Exact next step

The owner starts a different reviewer session with: **Review the complete tooling at implementation pin `1ec3ceca620d0a3fb40f506ae9646f6882410877` following this request, then commit `reports/phase-06/review-tooling.md` with your verdict and evidence. Do not approve decision rows.**

After that report is committed, the executor resumes only to address its required fixes or, if accepted, to Step 1 item 2. This author session does not create the independent review report.
