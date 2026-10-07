# Independent content review brief

## Authority and current execution boundary

Owner amendment A5, committed as `a7ec5054a`, supersedes the review-method portions of A4 and the older per-batch seeded procedure. Tooling is frozen at `1ec3ceca6` plus the mandatory-authorship correction `658b4e602`. No further tooling re-review is requested.

Ordinary reviews read every judgment row, spot-check 100 random script-proven exact rows, run the gates and commit `review-<step>-<shard>.md`. Seeded packs and reviewer red-team occur only after Step 3, after Step 6 and in Step 10.

**Application is blocked, not authorized by this brief.** The unchanged apply command still requires a passing sensitivity proof, and the unchanged gate requires a sensitivity binding. An honest unseeded ordinary review cannot currently be applied. See `unseeded-review-blocker.md` and the owner queue. Do not invent hashes, score headers, approvals or seed results. No real batch has been authored or approved.

## Read first

1. The committed `review-request-<step>.md`, its pinned commit, source blobs, shard paths and owner-routed lists.
2. `phase-06-transform-all-platform-areas-as-candidate-material.md`, especially shared rules, stop conditions and the relevant batch; `owner-answers.md`, especially A1–A3 and A5.
3. `claim-and-disposition-vocabulary.json`, `minimum-constitution.json`, `pilot/claim-decisions.schema.json`, the frozen area map and relevant area spec.
4. The full-text Markdown diff packs, source and candidate documents, reverse candidate-unit list, holds and identical-unit exceptions. The machine sidecar is binding data, not a substitute for reading.

All relative plan paths resolve from `plans/260925-documentation-authority-unification/`. Work only in the authorized worktree and branch. Before every git write, print cwd and branch; commit explicit paths only. Never push, merge into main, edit secrets, run state-changing fgos commands or change legacy roots without the owner gate.

## Independence and complete judgment review

Use a session different from the author, with a typed reviewer identity. Do not review your own rows. Read every judgment row, including corpus-rule judgments. Verify:

- The disposition is allowed by the vocabulary and its exact rule applies.
- Whole versus partial carry is explicit; every remainder is named and accounted for.
- One legitimate owner exists; a pointer back to a retiring source is not a carrier.
- The rationale is specific, evidenced and not a copied approval formula.
- Claim kind, source identity, heading range and committed digest are correct.
- Target text preserves the claim, conditions, scope, obligations and exceptions.
- No unlabelled invented claim appears; additions are labelled `Added in candidate`.
- Both directions close: each source row reaches its carrier or valid non-carry disposition, and each candidate heading/block reaches a row or a labelled addition.
- Authorship and committed-report evidence are present; deleting a flag does not create a legacy exemption.

## Random exact-row spot check

Randomly draw 100 distinct script-proven exact rows from the request's complete exact-row population. Record the population identity, draw method, random seed and sampled claim IDs in the committed report so the draw can be reproduced. If fewer than 100 rows exist, inspect all and report the actual population and shortfall; do not duplicate rows or claim 100 checks.

Independently check committed source and target text, full-unit equality, heading ancestry, source eligibility, unique target ownership and the exact-proof eligibility thresholds. Check anchors with `node scripts/list-doc-anchors.mjs --check <path#anchor>`. Record defects with claim IDs and evidence; do not silently turn them into approvals.

## Packs and frozen CLI contract

Run `node scripts/propose-doc-decisions.mjs --help` for the complete frozen argument contract. Build an ordinary visible pack:

```sh
node scripts/propose-doc-decisions.mjs --pack <shard.json> --inventory /tmp/phase06/doc-inventory.json --repo-root . --out /tmp/phase06/review-pack.md
```

This writes Markdown and `review-pack.md.json`. Legacy packs additionally require `--author <current-author-session>`; their report repeats `Author session:` without fabricating historical row authorship. Other modes are `--summary`, `--propose`, `--coverage`, `--rebind`, `--snapshot` and `--verify`; retain their existing required inputs and eligibility rules.

At the three seeded checkpoints only, a different reviewer creates and answers the seeded Markdown pack before the normal review. Keep the key private until the verdict is committed; do not let the author select or answer real mutations:

```sh
node scripts/propose-doc-decisions.mjs --seed-pack <pack.md.json> --seed <recorded-seed> --reviewer <identity> --key <private-key.json> --out <seed-pack.md>
node scripts/propose-doc-decisions.mjs --score-pack <private-key.json> --verdicts <seed-verdicts.md>
```

Frozen score thresholds: at least 5 of 6 mutations caught and at most 2 false flags among 24 controls. Report a failed score; repeat with another independent session. Two consecutive failing reviewer sessions trigger the phase stop condition. No checkpoint proof substitutes for an ordinary batch's missing proof under the current guards.

The frozen application command is shown for contract clarity, **not as an authorized workaround for ordinary unseeded reviews**:

```sh
node scripts/propose-doc-decisions.mjs --apply-review <shard.json> --inventory /tmp/phase06/doc-inventory.json --repo-root . --verdicts <committed-review.md> --reviewer <identity> --review-pack <pack.md.json> --seed-key <private-key.json> --seed-verdicts <seed-verdicts.md>
```

It requires a genuine passing score, binds the shown pack and target digest, verifies the committed report, and writes the shard in place. Apply must wait for the owner to resolve the unseeded-review blocker. Do not flip rows manually to evade it.

## Reports, verdicts and owner lists

Commit `reports/phase-06/review-<step>-<shard>.md` from the independent session. Include author and reviewer identities, request/shard/source commit pins, judgment counts, the reproducible exact sample and findings, gate commands/results, source-to-target and reverse checks, per-claim verdicts and specific notes:

| Claim | Verdict | Note |
|---|---|---|

Use `ok`, `rework` or `hold`. This format heading is not a verdict on any real row. A seeded checkpoint report also records the actual `Pack commit`, `Pack id` and `Seed score` produced by its proof. An ordinary unseeded report must not claim those values exist.

Hold/rework retains `blocking` for unknown-blocking rows and `pending` otherwise; records the note without `reviewedBy` or `reviewedAt`. List held unknown-blocking rows in `holds.md` and the owner queue. Allow one rework; a second round with more than 3% rework triggers a stop. Release archive/delete candidates, real conflicts, holds and promoted-document edits to the owner; a reviewer verdict does not authorize destructive or promoted-content changes.

## Gate commands and closure

Refresh scratch inventory at the committed review tree using the phase's unchanged extractor invocation. Run checks A–I as prescribed, accounting only the five exact A3 exemptions. Run D and scoped strict E twice with the existing `--previous-registry` flag: once against `reports/identity-registry.json`, once against `reports/phase-02-identity-registry.json`. Both must pass. Add the ledger decision directory only once it contains a shard. Compare scoped open findings exactly against the holds and identical-unit exceptions; no new fatal finding is acceptable.

Run the ratchet, constitution placement and candidate checks. Record expected global cutover failures as measured baseline deltas, not successes. Tests use `env -u CLAUDE_CODE_SESSION_ID node --test <files>`; count with Node. Keep `progress.md` current, commit explicit paths and stop at the owner's review boundary. No decision becomes reviewed merely because this author prepared a brief.

## Checkpoint red-team

Only after Steps 3 and 6 and in Step 10, inspect the step-group diff adversarially: find lost or weakened claims, wrong owners, invented claims, stale anchors/digests, unaccounted remainders, pointer-back carriers, unjustified archive/delete decisions, authority leaks and unsupported conflict closure. Cite source and candidate paths/units and state severity. Commit `red-team-<step>.md`; close with zero open Critical/High unless the owner explicitly accepts them.

Retain the phase's stratified candidate-block draw at these checkpoints: 50 blocks, comprising 20 unnamed by decisions, 20 carried with rewritten rationale and 10 random, with seed and population recorded. Two unlabelled invented-claim defects trigger the stop condition. Record short strata honestly; never fill them with duplicate samples. Fresh-reader checks and other batch-specific acceptance requirements remain as specified in the phase contract.
