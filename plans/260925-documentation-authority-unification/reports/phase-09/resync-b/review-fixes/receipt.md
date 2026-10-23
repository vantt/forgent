# Navigation and metadata review corrections

Status: authored and locally verified; **independent review pending**. No gate accepted, authority flipped, literal history rewritten or pair accounting performed.

Input HEAD: `623ee7f221d777e60204fb5f0b320da035069990`.
Read first: `docs/specs/reading-map.md`, component-boundary and its advisory carriage, then `w3-d7b-brief.md`, execution-plan §§1–2, owner/review notes, D7 review and carries/late-areas/resync-a/resync-b/ledgerfix receipts.

## Delivered

- `s14-resync-b.json#/unitCarries/125`, `/132`, `/247`: now `candidate-metadata-adaptation`, citing `9818f25a8` (2026-09-19), before retirement `2180b4e72` (2026-10-02). Each banner remains **not carried**; the unchanged retirement statement is a disposition witness, not a literal/live contract. Binding/source identity fields are unchanged. The metadata-adaptation total is now 10, not 7; historical scanner/proof output is not silently rewritten.
- `component-boundary.md`: all eight remaining `../specs/` links point to the existing runner (3), dashboard (2), confinement (1), Observe (1) and reading-map (1) successors. The reading-map link targets section 5, where the setup entries actually live. Link labels and all other prose remain unchanged.
- `s14#/bindingRefresh/475`: reason now explicitly says **changed workflow links**, not byte-identical content preservation. Its historical before/after binding bytes remain intact.
- `docs/reading-map.md`: removed the live sentence's plan-report citation; retained the legacy source pointer and every transition qualification. No unrelated plan citation or existing entry was rewritten.
- `docs/platform/platform-foundations.md:416`: **stays verbatim**, with no file edit. The containing projection explicitly conserves source prose and historical self-path spellings. The complete row still equals `docs/specs/platform-foundations.md`; the retained original `docs/platform-foundations.md` still contains L7. This is preserved provenance, not a newly authored navigation route. Repointing it would break the declared literal carry without changing any law or current authority.

## Rebinding and evidence

[New additive shard](../../../../ledger/decisions/s15-navigation-review-fixes.json) binds all **6 changed native units** (three headings, three direct blocks):

- Six overlays supersede s14 `/bindingRefresh/475`, `/unitCarries/480`, `/unitCarries/481`, `/bindingRefresh/574`, `/bindingRefresh/577`, and s3 `/registryGaps/2`.
- Three explicit candidate-before/candidate-after bindings cover units without prior effective placements: component table heading, reading-map section-5 heading and its introduction. No native identity is minted or inferred.
- Every new row is pending, with the declared sorted four-key compact UTF-8 JSON + LF hash, self-inclusive ancestry and current digest. Overlays also retain full before-content, selected content and neighboring placement witnesses. Predecessor identity is shard/pointer/anchor/digest, not the old hash.

[Current proof](verification.json), reproducible without repository writes:

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/resync-b/review-fixes/verify-d7b.py
```

The proof reuses `ledgerfix/bindings.py`, `ledgerfix/verify.py::check_current`, the existing dual extractors, and pure anchor/metadata APIs. It checks exact allowed document byte edits and the four s14 rationale changes; all 13,569 ledger assertions serialize equally in Python/Node; all **5,010 stored hashes** and **4,452 effective current stored bindings** pass. All 6 changed units are bound, all 123 relative component links/fragments resolve, and all 99 coordination-history files plus platform-foundations are byte-identical to the input pin. No production mechanism or extra product feature was introduced.

The existing reading-map duplicate switchboard route remains one pre-existing metadata finding; **zero new findings**. It is not repaired or hidden.

## Focused tests

Reused the unchanged disposable harness `late-areas/replay-checks.py`, reading only the explicitly permitted activation `releasePath`. Scratch: `/tmp/fgos-work/w3-d7b-brief/focused/`. [Commands and results](test-results.json), [candidate-status log](candidate-status-test.log), [anchor log](anchors-test.log).

| Unchanged owning test | Result |
|---|---|
| `test/scripts/check-doc-candidate-status.test.mjs` | 11/11 pass |
| `test/scripts/list-doc-anchors.test.mjs` | 3/3 pass |
| `git diff --check` | pass |

Each test ran individually as `env -u CLAUDE_CODE_SESSION_ID FGOS_HOST_BIN=<releasePath>/bin/fgos node --test <file>`. Source/tests were copied unchanged; the activated addon digest and shipped descriptor were checked, with isolated HOME/TMP/state roots. Fixture-only Git writes stayed in scratch, never this checkout. This is Node/installed-addon proof, not Rust working-tree freshness.

## Limits and handoff

- Original resync scan/verification files, old target witnesses and ledgerfix migration inventory are **historical receipts**, not current-delta proofs. Their pin-specific commands do not join this new overlay set. They were not rebaselined or represented as green. Lead owns reopening the named binding reviews and projecting the new overlay into final-pin gate/migration/scanner records; this turn accepts none of those gates.
- No broad Node or Cargo suite was run under the brief. No fgOS CLI, repository Git mutation, Work lifecycle verb, config/secret read, activation change, lease, owner-answer/progress/gate-status edit or out-of-scope write occurred. The activation-pointer read and atomic outbox writes are the explicit exceptions.
- `impact-analysis: degraded/unqueried`: the brief prohibits fgOS CLI and no GitNexus tool is exposed; no production symbol changed. No preview service was started under the exact scope. Filenames are brief-mandated or ledger record identifiers, not newly invented conventional report paths. No runtime behavior/config/dependency changed, so no changelog or setup/doctor change is needed.
- `needsWrites: []` for this scoped delivery. Independent review, frozen-record integration and cutover remain with Lead.
