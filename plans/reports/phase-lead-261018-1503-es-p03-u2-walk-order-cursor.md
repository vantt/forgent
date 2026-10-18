# Event Store phase 03: remaining HEAD observation gap

The `7162365bb` Git additions resolve the earlier definite blocker: `list_refs` discovers unknown mirror origins, and `read_paths_at` reads the two known seal paths. M1 is also present: `walk_commits` accepts certified stop OIDs and returns ordered parents, tree identity and bounded continuation.

A separate required input is still unavailable through the public port. Stopped under the assignment’s explicit instruction to stop on a Git port gap. No Rust, Cargo.lock or Git changes; steps 1–4 remain unimplemented, and coordinator-owned steps 5–6 were not run.

| Spec rule | Code evidence | Required next step / proof |
|---|---|---|
| Phase 03 requirement 2, plan D10: before migration read tracked legacy files **at HEAD**, including in linked worktrees. | `packages/git/rust/src/lib.rs`: `RepoHandle` exposes repository location/format/layout, no HEAD fact; neither complete `Inspect` nor `Publication` trait exports a HEAD observation. `driver.rs:223` resolves repository topology but never returns HEAD. | Add a typed, lock-free observation of the calling worktree’s HEAD commit/tree through Git. Distinguish unborn HEAD from a missing/corrupt object; cover attached, detached and linked-worktree HEAD. |
| Phase 03 requirement 2, D18: authenticate legacy refs against the tracked `.fgos/events` fence. | `read_paths_at` (`lib.rs:303`, `driver.rs:1259`) requires a full `Oid`; it cannot accept HEAD. `RefName::parse` (`lib.rs:51`) requires `refs/`, so `read_ref` cannot observe HEAD. `list_refs` uses `for-each-ref`, which does not select the worktree’s HEAD. | Observe HEAD once, then read fence and tracked legacy paths at that exact immutable OID. Tests must show different linked-worktree HEADs use their respective fences, and detached HEAD works even when no ordinary ref points to it. |

Enumerating branch tips cannot determine which commit is checked out. Reading `.git/HEAD`, invoking raw Git from Event Store, or silently substituting the main branch would cross the Git ownership boundary or return another history. Requiring the consumer to supply an OID would move this missing Git observation to that consumer rather than implement the specified reader.

Secondary integration point, **not asserted as a definite missing capability**: dynamically named legacy shards require tree discovery. The port exposes raw tree objects via `read_object(..., ObjectType::Tree)`, so the Git lead should confirm whether Event Store may decode those bytes or whether Git will expose typed tree entries. `read_paths_at` alone reads only known names. This distinction corrects the earlier report’s unresolved tree-access concern; the definite blocker here is HEAD observation.

Validation: inspected both public traits, all public driver methods, repository resolution, ref enumeration/exact reads and path reads; searched Git history for HEAD-resolution/tree-listing APIs and found no reusable exported operation. No Cargo gates ran: no Rust changed, and baseline tests cannot establish a missing API. Reviewed the phase contract, D10/D17/D18, spec sections 10–12/15/18, model C3–C6 and the Git u5/u8 reports. The previous u1 report is preserved as historical context; its ref-enumeration blocker is resolved.

Status: BLOCKED
Summary: The new ref/path APIs resolve the previous blocker, but Git still cannot return the calling worktree’s HEAD OID needed for pre-migration reads and the tracked legacy fence. Resume after a typed HEAD observation is available; no implementation or acceptance claim is made.
Concerns/Blockers: Git-owned HEAD observation; legacy tree-decoding ownership needs confirmation. Program-board updates remain with the coordinator outside this write scope.
Context refs:
- (none)
