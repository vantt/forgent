# Authorization and baseline

Date: 2026-10-07
Executor: codex-session:1@2026-10-07 (running session number; no session id exposed)
Worktree: `/home/vantt/projects/forgentX-phase00-documentation-authority-unification`
Branch: `plan/260925-documentation-authority-unification`
Authorization commit: `57f3e7fe7af86adee1e805925cca82cf7a894164`
Measurement HEAD and initial SYNC: `57f3e7fe7af86adee1e805925cca82cf7a894164`
Main HEAD: `7e36897c0ac131a65f7b1dcb538ba80f6dde9ff9`
B0: recorded in `progress.md` after this document is committed.

## Preconditions and scope

The tree was clean at session start (`git status --porcelain`: empty), HEAD was `bc63a17af518ce216b54d16a161ec1270e1346c9`, and the branch matched. Owner authorization was changed and committed alone before starting the baseline. `git merge main`: Already up to date; exit 0. No main-side edits arrived, so no ratchet exception changed.

Outcome: complete candidate material and conservation decisions, one owner per claim, no authority flips. Constraints: sequential inline work, independent committed review reports, frozen extractor and rule meanings, explicit-path commits, no main checkout writes or state-mutating fgOS commands. Non-goals: promotion, push, PR, shipping. Acceptance: phase contract Success Criteria; this baseline does not claim later criteria are met.

## Executed commands

Scratch: `/tmp/phase06`. `df -Pk /tmp/phase06` reported 249,546,932 available KiB before generation (more than the required 1 GiB).

1. `cp plans/260925-documentation-authority-unification/reports/identity-registry.json /tmp/phase06/identity-registry.json`
2. `node scripts/generate-doc-inventory.mjs --refresh --commit HEAD --identity-registry /tmp/phase06/identity-registry.json --json-out /tmp/phase06/doc-inventory.json --md-out /tmp/phase06/doc-inventory.md`: exit 0, 18.97 seconds including scratch setup; generator reported no carry-forward needed. No shards committed.
3. `node scripts/check-doc-inventory-gates.mjs --inventory /tmp/phase06/doc-inventory.json --identity-registry /tmp/phase06/identity-registry.json --decisions plans/260925-documentation-authority-unification/pilot/decisions --json`: exit 0; clean true, 0 fatal findings. JSON saved in `/tmp/phase06/gate-baseline.json`.
4. `node scripts/check-legacy-docs-ratchet.mjs`: exit 0; `clean (995 legacy files checked; 24 accounted edit(s), 1 accounted new file(s)).`
5. `node scripts/check-doc-constitution.mjs --no-ledger --check-placement`: exit 0; vocabulary/constitution consistent (17 dispositions, 12 claim kinds, 24 document kinds, 16 deferred items); `placement: 446 files, 445 matched, 0 leftover, 0 ambiguous, 0 evidence without index (1 recorded exception(s))`.
6. `node scripts/check-doc-retirement.mjs --inventory /tmp/phase06/doc-inventory.json --identity-registry /tmp/phase06/identity-registry.json --cutover --json`: expected exit 1; 15 blocked, 4 pass, 1 review. JSON saved in `/tmp/phase06/retirement-baseline.json`.
7. `node scripts/check-doc-candidate-status.mjs --json`: exit 0; 5 findings (3 missing-promotion-fields, 2 unresolved-link), recorded verbatim in `candidate-status-baseline.json`.

The gate warns that the scratch registry is not committed at HEAD and skips its committed row-set comparison. Its exit 0 alone is NOT proof of that comparison. A separate Node set comparison over `units`, `identityGaps`, and `retiredUnits` of the committed and scratch registries found 91,964 distinct claim ids in each and 0 lost ids. The gate's own committed-row-set comparison remains UNPROVEN for this prescribed scratch invocation; it was not silently treated as exercised.

Counts below were read by Node from the saved gate JSON, not counted with shell text filters.

| Open data | Count |
|---|---:|
| files-unknown-blocking | 1387 |
| claims-unknown-blocking | 39658 |
| claims-not-reviewed | 86789 |
| claims-without-own-rationale | 84450 |
| identical-units-multiple-owners | 1 |
| registry-gaps-without-disposition | 28 |
| dropped-claims-unreviewed | 17 |
| Explicit duplicate-content groups | 818 |
| Explicit semantic-conflict groups | 151 |

## Immutable pins

`source-blobs.txt` records 4,320 tracked blobs from `git ls-tree -r HEAD -- docs AGENTS.md CLAUDE.md README.md CHANGELOG.md`, formatted `path blobid`. It includes all docs, not only retiring sources. `extractor-blobs.txt` records all five frozen closure files from `git rev-parse HEAD:<path>`.

Evidence trees (`git rev-parse HEAD:<path>`):

- `docs/architect/agent-coordination/verification`: `d22843da3ec8d1005681272cde22008da2c7ac04`
- `docs/platform/agent-coordination/verification`: `0478fff2055c05aa46aafa3b7bb353ea012defa0`

These directory tree ids differ; this is not a claim that every child differs. Mirror equality is to be proven per payload blob in the authorized tool/batch.

`reader-links-baseline.txt` is the sorted unique match set of `docs/platform/[^ )\x60|>\"]*` in the six named instruction/navigation paths of check I. `allowed-paths.json` limits the table's scripts to named tools, not arbitrary scripts.

## Plans A, B, C

Measured by the required `git log main --format='%h %s' -- plans/261006-1415-fgos-single-door-mechanisms plans/261006-1415-fgos-convention-component plans/261006-1445-fgctl-dev-activation` and their plan frontmatter/status statements:

- A: completed, integrated into main at `a004bb598`; subsequent evidence commits include `b5137cdad` and `7e36897c0`.
- B: pending, proposed and not authorized; not landed. Re-check immediately before the three named hot files; no convention route assumed present.
- C: pending frontmatter, Draft / not authorized / not scheduled in its status block; not landed, not a cutover dependency.

## Install/setup/doctor boundary

The authorized tools are repository-only documentation gates. No runtime config default, environment variable, shipped infrastructure dependency, install level assumption, setup capability or doctor check is added by this baseline. No setup/doctor registration is needed for repository-only gates. `fgos` was not used. Later tool changes must preserve this boundary.

## Review and owner routes

No rows authored or reviewed in this baseline. No archive/delete list, real conflict adjudication, claim hold or promoted-document edit was created. Existing dropped claims and SC-1 remain open; later batches own them. Tooling acceptance, all tests, sensitivity probes, area maps and review are UNPROVEN until executed.
