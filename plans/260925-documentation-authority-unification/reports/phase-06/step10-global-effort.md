# Step 10 effort record — final close

Final-close read-only measurements at HEAD `2a028cdc930c47ce207b64ab7d9e1a8a8ec295b4` (no repeated identity carry or registry persistence):

| Final-close stage | Seconds | Evidence |
|---|---:|---|
| Global D, both priors | 215.110 | `step10-final-close-both-summary.json` |
| Global D, identity prior | 243.693 | `step10-final-close-identity-summary.json` |
| Global D, Phase 02 prior | 251.196 | `step10-final-close-phase02-summary.json` |
| Strict E alone | 210.928 | `step10-final-close-strict-summary.json` |

The memory-heavy stages ran one at a time. The initial strict-E attempt exhausted its 4 GiB heap and was rerun alone at 6 GiB; only the completed receipt is used as proof. Owner effort remains unreported and is not inferred.

## Earlier package measurements

Docs content/SYNC `38672e7f1`; producer `codex-session:unit-run-1792176628519-ac852ba4@2026-10-17`. No owner token total was supplied, so none is inferred.

| Measured stage | Seconds | Evidence |
|---|---:|---|
| Sole native sync/generation/persistence (preceding package) | 802.964 | `step10-package-native-proof.json` |
| D both priors | 94.040 | `step10-package-D-summary.json` |
| D identity prior | 94.759 | `step10-package-D-summary.json` |
| D Phase 02 prior | 94.018 | `step10-package-D-summary.json` |
| Strict E plus applied-overlay equality | 159.422 | `step10-package-E-summary.json` |
| Full checkpoint export | 52.597 | package execution log / refresh receipt |
| Independent bounded checkpoint validation | 18.900 | `step10-package-checkpoint-transport-validation.json` |
| Full + Step 2 genuine rehearsal | 968.706 | `step10-package-rehearsal.json` |
| Final relevant test rerun | 42.509 | `step10-package-tests.log` |

Native inventory, D/E, checkpoint refresh/validation and rehearsal ran one at a time. The package reused the persisted registry; read-only inventory generation and rehearsal regeneration are not a second identity carry or persistence. Mutation, audit, consistency, A/B/H, ownership, replay and helper validation were run but not all separately metered, so no invented aggregate is reported.

The ordinary request has 25 entries in one file (3 decisions, 1 re-carry accounting, 6 list/receipt refreshes, 15 native changes); per-row helper validation passed 25/25. The producer authored no checkpoint sensitivity pack, seed, key or verdict.

The first 507-test run had one transient seeded review-format fixture failure (506/507). The same test passed 25/25 in isolation, and the complete relevant suite then passed 507/507. Both facts are retained; no flaky result is erased and no full npm-suite claim is made.

Earlier UNPROVEN throughput estimates remain historical. Independent ordinary review, checkpoint, A28 truth sample, final red-team and the separate `awaiting owner review` close remain outstanding.
