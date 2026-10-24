# Reader and retirement custody

Specs are proposed, not applied to the source repository. Read the sibling `manifest.json` and `design.md` first. Full spec bodies are archive-only gzip JSON assets under `../audit/`; the manifest binds their compressed bytes and Git blob ids.

- `reader-patches--standalone-retirement-specs.json.gz`: complete preimage blob/SHA, expected absence, explicit **behaviour retired with the plan**, and schedule. No self-owning proofs. The reviewed ten and all other current gate programs (43 total at this pin) are `retire-at-final-pin`, not retired while their gates remain open.
- `gate-retention.json.gz`: reviewed ten, all current gate programs, conservative transitive temporary inputs. The pre-freeze candidate restores this entire set.
- `reader-patches--historical-replay-specs.json.gz`: 47 historical readers / 135 joins, bound to their original recovery inputs; execution context moves to the archive snapshot. Never run these saved commands casually at the reduced tip.
- `reader-patches--prior-script-refs.json.gz`: all 2,918 old occurrences; retained product/test readers keep exact inputs. The mismatching review-checkpoint fixture template and liveness test's generated scratch output are explicitly rejected as committed-tip reads, not silently repointed.
- `reader-patches--reader-index.json.gz` and `reader-patches--enumeration-review.json.gz`: conservative lexical joins and directory/glob review queue. Zero unresolved literal live sources is not arbitrary-program reachability.
- `partition.json.gz`: complete archive and retained audit, every retained reason. No 1 MB retention threshold.
- `external-references.json.gz`: every outside-plan full-path line, 184 normalized path/link joins and 619 plan-navigation link joins, each with source/line/text. No outside-plan basename joins. A directory prefix is not blanket input retention.
- `retained-set-corrections.json.gz`: all 22 reviewed false reasons removed; 20 files archived, two retained for real navigation links. The 45 formerly archived outside-plan joins are now retained.

Two historical replay programs linked by plan navigation remain as linked source text (`step-05-final-verify.py`, `step-03-resolve.py`); execution still belongs in the bound archive checkout with original inputs, not at the reduced tip.

A deletion may be rehearsed only after checking its full source digest; it becomes a real retirement only after final-pin proof/review freeze and cutover approval. Never stub a gate to return success. Production tests and generic product behaviour remain unchanged.

An intentional historical replay uses a fresh disposable checkout at the approved archive commit. Recover old absent inputs using exact blob/length/SHA records and keep that recipe's original pin, arguments and output restrictions. An old replay success is not current-code evidence. Newly archived assets are reachable in the augmented archive snapshot; already-pruned objects remain reachable through its ancestry.

Before landing, the Lead performs actual commit/path accounting for the removal commit in both frozen reproduction manifests, changing exception arrays only. The complete clone-only dry run and negative-before/green-after result are in `../rehearsal.json` and `../audit/pair-accounting.json.gz`. No real-repo accounting is authored here.
