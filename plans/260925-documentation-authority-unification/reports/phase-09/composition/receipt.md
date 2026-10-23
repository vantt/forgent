# Composition receipt — continuation, blocked on four exact holder actions

docs(composition): complete available park compositions and verify replay guards

## Latest result (W2 D2b)

Source pin: `cffe725b948f5a695728c8da08f114e7e97075d6`. **11 of the 15 unfinished entries now have complete conditional compositions; four remain partial/blocked. No gate is closed.** These are records, not applied product edits or authority acceptance.

- `patch-specs.json` preserves all 38 earlier entries and appends 31: 29 effective records plus two GAP-05 proposal records. Use `effectiveSpecIds` in order; historical duplicate predecessor IDs are not executable alternatives.
- `actions.json` preserves all 101 park identities and the previous attempt; its `continuationResolutions` addresses all 15 unfinished entries, including the three supplemental description groups outside that 101-action set.
- `w2-independent-verification.json`: **62 effective specs / 58 files**, 146 real `patch --batch --fuzz=0 -p1` invocations, forward and complete reverse byte equality against this checkout. Named same-file predecessor hashes are checked; all 38 earlier JSON entries are conserved. This verifies bytes, not semantic approval.
- `w2-predecessor-recomposition.json`: all **19** prior deferrals resolved mechanically: eight recomposed at current bytes; eleven already equal their approved original before bytes at this pin. Twelve current-byte predecessor replacements overall include four additional changed paths. Historical approval does not transfer; G9 delta review remains required.
- `w2-skill-regeneration.json`: canonical source composition plus scratch `npm run build:skills`, exit 0; all 33 generated-output changes captured. Never hand-apply render diffs.

## Remaining blockers — do not apply these partial actions

| Consumer | Exact unresolved duty |
|---|---|
| `docs/platform/system-overview/spec.md` | `f07928/f07929`: no complete accepted live holders for `enduser-docs-authoring.md` and `enduser-docs-index.md`. D1's maintained registry contract covers identity/lifecycle/role/attestation, not those entire write/read-side contracts. Four sibling descriptions are composed. |
| `docs/platform/system-architecture/architecture/architecture-intent.md` | Eight live Related/evidence rows still need accepted holders for system vision, Step 09/10, component authority map, intent ledger and coordination-session/flow-definition. A carriage/history mirror or conditional metadata packet is not acceptance. Self-related navigation is composed separately. |
| `docs/transitional-switchboard.md` | `f08382–f08384`: end-user complete-owner row depends on the same missing full carry. Other complete rows and resolution algorithm are composed, but the whole action must remain parked. |
| `docs/platform/documentation/switchboard.md` | `f06749–f06751`: same complete-owner row blocker; do not apply the partial switchboard. |

D1's **complete decision 0014 section** was verified verbatim in `docs/platform/platform-foundations.md`; the Participant locator now composes on the approved same-file output, not the retained root law or an obsolete line range. All other newly completed whole-status units are conditional on independent source/truth acceptance and separately approved atomic cutover. Locked root laws and D1's carried rules/narratives are not rewritten.

## Owning replay

| Proof | Latest result |
|---|---|
| `test/scripts/generate-shipped-path-inventory.test.mjs` | **11 pass / 0 fail**, complete unchanged owning file |
| `test/runner/dead-vocabulary-guard.test.mjs` | **9 pass / 1 fail**; only the nine GAP-05 retired-name occurrences in the two complete component-boundary carriage units |
| GAP-05 placement control, same complete owning file | **10 pass / 0 fail**; proposal applied only temporarily in scratch, then restored; Lead approval remains pending |
| Live successor negative probe | Nonzero as required: both Phase 1–3 and P5 reject injected retired symbols in a nested live scratch spec; probe removed |
| `test/scripts/check-decision-citation-drift.test.mjs` | **31 pass / 1 fail**; nested default-reader case passes; real-repo baseline case reports **124** new findings. Baseline bytes unchanged; this remains a separate open parity gap. |

The earlier P5 red was not GAP-05: successor enumeration incorrectly included history snapshots, and three live-spec negative qualifications named retired schemas outside decision history. The continuation keeps all original roots/assertions, makes the added read set live-spec-only, and conserves the three qualifications verbatim under decision history. No historical symbols are renamed. `w2-gap05-verification.json` binds every remaining occurrence to the complete carriage units and records control/negative replay.

The inventory failure had two fixture causes: the first scratch had no committed inventory input; this pin additionally uses the real native Git port and initially lacked its shipped addon. A disposable `/tmp` repository now supplies a committed pre-move snapshot; the worktree is then composed/moved without committing. The inventory proof reads that **immutable historical commit**, not moved live documentation. D1's existing shipped `native-addon.json` fixture was reused with real digest/ABI/path checks, isolated HOME/state root, and the host read from authorized activation metadata. This does not certify Rust working-tree freshness. The initial six addon/setup failures and commands are retained as `initial-w2-*`; final tests are `w2-*.test.log`.

## Reproduce and boundaries

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/composition/complete-parks.py
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/composition/verify-effective.py
```

The composer reads this source pin, writes only composition records, and stages executable bytes in `/tmp/fgos-work/w2-d2b-brief/`. Single tests use the exact brief-prescribed `env -u CLAUDE_CODE_SESSION_ID FGOS_HOST_BIN=<releasePath>/bin/fgos node --test <file>` door. Temporary fixture Git writes are authorized by the continuation brief; **no Git write in this repository**, fgOS CLI, live state/secrets access, source application, baseline rewrite, full suite, pair accounting or Lead record mutation occurred. `impact-analysis: degraded` under the no-CLI boundary; no production symbol was edited. Rust owning replay for the MCP path recomposition and final-pin whole-suite parity remain unrun. No browser service was launched under this constrained records turn.

`receipt.json` carries this attempt and the complete earlier receipt under `previousAttempt`; command argv/exits/logs, touched IDs and digests are linked there. `needsWrites=[]`: no out-of-scope mutation is needed to deliver these records; missing accepted holder placements remain explicit Lead/holder-owner work, not invented paths. **Status: blocked, not complete.**

---

# Earlier W1 receipt (historical; superseded only by the continuation above)

docs: compose migration records and disclose unresolved replay gaps

## Read first

- `member-joins.json`: 48/16/8 exact current-passage joins (not independent acceptance).
- `actions.json`: all 101 parks accounted for; **15 unfinished**. Twelve whole-row units still need authored complete diffs, and three require exact live-holder/carriage decisions. Merely indexing a park is not composition.
- `patch-specs.json`: 38 specs; 37 changed-byte fuzz=0 forward/inverse roundtrips and one explicit no-byte-change result. Immediate hash chains are checked in `chain-verification.json`; recomposed historical predecessors still require G9 delta review.
- `area-holder-table.json`: aliases/free-text scope semantics retained. Missing live holders: enduser-docs-authoring, enduser-docs-index, seat-binding, workflow. Repo narrative placement is proposed, not established; root binding laws remain root authority.
- `gap05-placement-proposal.json`: move both complete source-carriage sections into literal history; Lead placement approval required. No guard exemption or historical renaming.

## Authored/replayed

Both review reworks, verbatim credential-store §13.1 carriage, recursive citation reader + owning nested fixture, canonical citation convention, scope table/consumer records, exact current hunk reconstruction and nine conditional whole-status-unit packets are composed. Credential carriage still needs Lead/G9 rebind of `claim_15308eb4`.

Scratch `npm run build:skills`: **exit 0**, 12 canonical inputs, 69 parked renders (24 changed, 45 unchanged). All 33 generated-output changes are captured, including nine outside the parked render set. Generated diffs are evidence only, never a hand-application path.

Scratch post-move replay: 1,039 physical moves, 19 unrelated approved predecessors deferred for source drift. This is **not final-pin parity**.

| Proof | Result |
|---|---|
| Citation owning file | exit 1; 31 pass / 1 fail; nested reader case passes, real-repo baseline case finds 126 new findings |
| Dead-vocabulary owning file | exit 1; 8 pass / 2 fail; 18 successor/history P5 occurrences plus nine live carriage names |
| Format-only additive read set | 17→68 files, 0→124 findings; no retained-source omission; unchanged baseline; not whole-guard closure |
| Bounded exported end-user index | 492→490; lifecycle and rollup content-carriage gaps remain; no live store read |
| Production near-duplicate check | current and scratch post-move pass; registry wiring test is not falsely called an owning behavior proof |
| Pure shipped classifier | seven before/after cases identical; full-file proof unavailable under no-Git-write rule |

## Constraint incident — do not omit

The first inventory whole-file test created temporary committed Git fixtures through its existing fixture helper. This **violated “never a git write”**. Source-worktree Git was not staged or committed. Details and original failing log are retained in `constraint-incident.json`, `commands-first-replay.json`, and `generate-shipped-path-inventory.test.log`. That complete test was removed from subsequent replay; this receipt does not conceal the violation or count its result as a pass.

## Scope and handoff

Only composition records were written in the repository. No product/source application, Lead record edit, pair accounting, fgos CLI, live state/secrets, full test suite, or baseline rewrite. Activation metadata was read only for the required host path. Final tracked worktree and staged diffs are empty; only this composition directory is untracked.

Commands/exits, touched member/row/spec ids, artifact digests, precise unfinished entries and limitations are in `receipt.json`, `commands.json`, and `commands-first-replay.json`. No additional repository write permission is requested: `needsWrites=[]`. Lead/D1 acceptance and remaining independent authoring/review are still necessary. **No G1/G7/G9 gate is claimed closed.**
