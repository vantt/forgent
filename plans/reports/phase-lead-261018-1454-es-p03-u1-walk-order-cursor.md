# Event Store phase 03: blocked at Git reader boundary

Status: BLOCKED
Summary: The required reader cannot discover fetched mirror refs through the current Git port. Stopped under the assignment’s explicit port-gap rule; no implementation, Git changes, staging or commits.
Concerns/Blockers: Git needs a typed ref-enumeration operation before the complete phase-03 reader can be implemented.
Context refs:
- (none)

| Spec rule | Current code | Evidence / required next step |
|---|---|---|
| Phase 03 requirement 2; Event Store §11: read every relevant own/mirror tip, discover previously unknown origins, exclude Git operation pins. | `packages/git/rust/src/lib.rs:295`: `Publication` exposes only exact-name `read_ref`, not enumeration. `Inspect` at line 354 also has no enumeration. `publication.rs` internally uses `for-each-ref`, but returns only the exact requested name. | Static inspection of both complete public traits and the implementation. Add a Git-owned typed operation enumerating direct/symbolic ref facts under literal namespace prefixes, with explicit error/completeness behavior. A newly fetched `refs/fgos/remotes/<remote>/events/<previously-unknown-machine>` must be discoverable without prior knowledge of that machine id. |
| §11 coverage walk: stop at certified commits, retain ordered parents/tree identity and bounded continuation. | `Publication::walk_commits` already accepts `stop: &[Oid]` and returns ordered parents/tree with `complete` and `next_cursor`. | M1 is present; it is not the blocker. Do not replace the walk or parse commit objects in Event Store. |
| §10–11: read `seal.json` and `events.jsonl` from each commit tree through Git’s port. | `read_object` returns raw object bytes, including binary tree bytes; no typed tree-entry/path-at-tree operation is exported. | Integration issue to settle with the Git lead: expose typed tree entries or literal path lookup, or explicitly confirm that decoding raw tree bytes belongs to Event Store. This is separate from the definite ref-enumeration gap. |

A caller-provided list of already known OIDs would permit a walk-only helper, but would not satisfy the required ref discovery and full read pipeline. Reading `.git/refs` would also fail packed/reftable repositories and violate the Git ownership boundary. No such workaround was added.

Prior art checked: current Publication/Inspect traits, driver implementation, Git phase-01 review-fix report, the Event Store plan’s M1 and D17–D18, and Git history searches for `read_tree`, `list_refs` and `read_path` under `packages/git`. The history search found no existing typed operation to reuse. `impact-analysis: inactive` (capability query returned zero providers).

Validation: static API inspection only. Cargo test/clippy were not run: no Rust or lockfile changes were made, and baseline success would not prove the missing reader. Steps 1–4 remain unimplemented; steps 5–6 were not run. Resume after the Git port supplies ref enumeration and settles tree-content access, then implement and run the assignment’s two Cargo gates with the private output directory.

The program-board lane update is outside this assignment’s write scope and is left to the coordinator.
