# Ledger recipe and documentation correction receipt

Status: completed in scope; **independent review pending**. No authority flip, gate acceptance, pair accounting, repository Git mutation or Work lifecycle call.

Input HEAD: `7bd1293af0704f66c0a5a158024577eac94bdd21`. Read first: [brief](../w3-ledger-fix-brief.md), [review notes](../w2-review-notes.md), then the packaging-distribution portal/spec and runner spec. This is documentation conservation and binding repair, not new product behavior.

## Documentation corrections

- `release-manifest.md`: retained Legacy CLI Transition link now resolves to `host-invocation-routing/architecture/legacy-cli-transition.md`.
- Packaging Data Dictionary row 7 enumerates **143 checks**: 135 literal IDs plus all eight loop-registered Git IDs. Row 7b remains **32 fixes**. The verifier accounts for every registration call form rather than silently ignoring dynamic IDs. The resync receipt, machine verification and adjudication 44 are corrected together.
- `activation-binding.md`: the shell helper reads `.git`/gitdir/commondir layout from disk without a Git child; only its test uses `rev-parse` as an oracle. The Rust typed-topology statement remains intact.
- Runner's fenced `Historical source section 552ef3d6` now equals the complete direct legacy Data Dictionary section byte-for-byte at HEAD, including obsolete clauses. Adjudication 17 explicitly separates that historical carrier from current truth in `runner/subcomponents/h-02842f76ffd2/spec.md`, which was not edited.
- Every affected unit and existing placement witness is rebound. Source identities, historical snapshots and reviewer verdict files are unchanged. Changed live rows are pending, never auto-approved.

## Final recipe and joins

The authoritative declaration is `phase-08/step-08-preflip-gates.json#bindingHashEncoding`:

1. Individual bindings hash UTF-8 compact JSON of exactly `targetOwner`, `targetAnchor`, `targetUnitDigest`, `targetAncestry`, with keys sorted, unescaped Unicode, null for absent base values and exactly one LF; no BOM.
2. Heading ancestry is **self-inclusive**, with the heading's own title last. Both parents-only exceptions are repaired; the verifier rejects parents-only even when its hash is recomputed.
3. Null-anchor groups additionally hash `successorGroupMemberDigests`, a lexicographically sorted list retaining duplicates. All 16 group rows bind their eight member digests; every member's current path/anchor/digest/ancestry/text is also checked. Removing one identical member changes the hash.
4. Overlay identity is **shard + pointer/index + anchor + digest**, never the old hash. Every gate predecessor is joined through those fields, including the D1b refresh preimages. The component-boundary and credential-store rows are rebound to their current effective holders; the obsolete credential conditional-composition metadata is removed.
5. All nine `s12-late-areas/nativeIdentityGaps` rows now store digest and ancestry inputs plus the exact carriage/overlay locator used to recover them. Five ordinal anchors had moved; they were resolved by source and target content identity, not copied from the old ordinal.
6. Residual row 14 is live (`outOfScopeProposalOnly=false`). All 15 current residual placements, complete changed-source-line accounting, artifact digests, ledger references and remainder citations are refreshed together. `A34Accepted` stays false.

Only `changedBindings` and `bindingHashEncoding` change in the phase-08 register. The verifier reconstructs all other original bytes exactly.

## Evidence and replay

[recipe-migration.json](recipe-migration.json) records old→new inputs/hashes for **all 13,560 ledger binding assertions**, including unchanged rows. Of these, **5,001** already store hashes; all are checked. The other 8,559 legacy assertions have their final-recipe digest computed and recorded without manufacturing new stored-hash assertions or invalidating unrelated reviews. Historical `supersedesBinding`, `priorReview`, `before` and `after` objects are immutable preimages, not live rows; the migration names its traversal exclusions explicitly.

**508 rows in 15 decision shards** change: 47 hash values change; the rest are recovered input metadata, current placement/context, residual references or adjudication updates. **552** stored assertions are explicitly historical predecessors resolved through overlays; **4,449** effective stored assertions are checked against current content, including **2,505** full placement witnesses. All **257** gate rows match the current ledger. No hash or effective-current-target mismatch remains.

Reused the two unchanged embedded conservation extractors, existing carriers, resync binding-refresh projection and Python/Node serialization doors. No new product mechanism, config, environment variable, dependency or setup/doctor registration is introduced. The old G0 author-pin/dual-ancestry verifier is replaced by a wiring entry point to one HEAD/current-tree proof. Its conditional credential-patch branch is retired because the holder has since been applied; current content/placement checks own that behavior. Complete residual, historical-source, unchanged-partial-carry and serialization rejection checks remain owned by the new verifier.

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/ledgerfix/verify.py
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/g0fix/verify.py
node plans/260925-documentation-authority-unification/reports/phase-09/resync-a/verify-resync.mjs --scan
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/resync-a/verify-binding-hashes.py
```

- [verification.json](verification.json): all-row Python/Node hash agreement, dual-extractor agreement, 257 gate joins, 16 content-bound groups, nine complete native-gap inputs, all 27 partial carries and 15 residuals, 18 authenticated historical source witnesses. Negative probes reject wrong serialization, parents-only ancestry, changed/removed group members, stale digests, wrong neighbours and incomplete/stale residuals.
- G0 entry point and owning verifier produce byte-identical output on repeated replay. Every touched verifier evaluates current HEAD and current target bytes; historical pins are used only to authenticate provenance/preimages.
- Resync replay: 2,328 hashes/units/placement witnesses pass; all 1,057 current source units remain accounted for; all four source drift scans report zero missing. Protected knowledge-registry bytes equal HEAD.
- [shell-integration-test.log](shell-integration-test.log): existing owning test file **24/24 pass**, using the activated release host with `CLAUDE_CODE_SESSION_ID` unset. Fixture Git writes are confined to `/tmp/fgos-work/w3-ledger-fix-brief/`, never this repository.
- `git diff --check`: pass. One combined scan/proof command hit its 120-second outer timeout after the successful scanner output; the Python proof and whitespace check were rerun separately and passed. No timeout is counted as green.

## Limits and handoff

- No `npm test`, `scripts/run-tests.mjs`, Cargo workspace suite, live lease, activation, setup/doctor or fgOS CLI against this repo was run. New scratch uses `/tmp/fgos-work/w3-ledger-fix-brief/`; initial reuse of the pre-existing proof doors also populated their former `/tmp/fgos-work/w2-*` scratch directories before those doors were redirected. No tracked file outside the exact writable list changed.
- `impact-analysis: degraded`: fgOS capability querying is prohibited by the brief and no GitNexus tool is exposed. No product symbol was edited; no blast-radius certification is claimed.
- No preview service was started under this exact write scope. Candidate-doc edits are not a user-visible product behavior change and need no changelog entry.
- Legacy `docs/specs/distribution.md` still has stale registry/shell-helper prose. The main/source owner must not re-import it as current truth; it is intentionally untouched here. The pre-existing duplicated work-state outcome and runner/platform RUL104 numbering clash remain separate owner work, not added scope.
- `needsWrites=[]`. The owner/reviewer still owns independent current-digest verdicts and any gate/cutover acceptance. Do not run the one-shot authoring script to verify; use the read-only commands above.
