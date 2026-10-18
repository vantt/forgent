# Red team: Event Store implementation plan

Date 2026-10-18. Plan: [plans/261018-0945-event-store-fgos-event-store/plan.md](../261018-0945-event-store-fgos-event-store/plan.md). Four hostile reviewers ran in process (`fgos dispatch decide --for red-team --needs-soul --has-live-task-access` → `in-process`), each with a verification role at the Full tier: Security Adversary (Fact Checker), Failure Mode Analyst (Flow Tracer), Assumption Destroyer (Scope Auditor), Scope and Complexity Critic (Contract Verifier). They returned 39 findings. All of them carried `file:line` evidence, so none was rejected by the evidence filter. After deduplication there are 15. The planner re-checked the load-bearing evidence before adjudicating:

- the porting log is tracked at `docs/distillery/state/porting/events.jsonl`;
- `src/runner/attestation-guard.mjs:29-30` reads `events.jsonl` directly;
- `assembleRegistryDefaults` keeps one shape per key (`src/setup/registrations.mjs:250-256`);
- Git's TargetAttempt rule is at `docs/platform/git/spec.md:287`;
- `endSession` holds `sessions` (`src/runner/session.mjs:386-387`);
- the schema requires `v1Shape`/`v1Path` and enumerates owners (`lock-registry.schema.v1.json:40`, `:52`);
- the eight doc doctor checks read `events.jsonl` (`registrations.mjs:3940` … `:4133`).

## Findings and dispositions

### 1. Crashed PublicationCas stalls every later seal; WAL growth is unbounded (Critical)
- **Reported by:** Failure Mode Analyst #1, Assumption Destroyer #6.
- **Problem:** The plan stopped on `recovery-required`. Git answers that forever for a crash between TargetAttempt and `update-ref` (`docs/platform/git/spec.md:287`). Git's own recovery lives in the dormant Git 06, and every seal leaves a WAL operation and a pin with no TTL (`:328`).
- **Disposition: Accept.**
  - The seal continues with a fresh operation id after rereading the tip (D6).
  - M3 now asks Git to resolve a superseded own-ref PublicationCas.
  - M8 asks for compaction of terminal records and pins.
  - Phase 04 measures growth over 10,000 seals, and phase 10 and 11 gate on a bounded WAL.

### 2. Fetched refs are trusted as-is (Critical)
- **Reported by:** Security Adversary #1, #7.
- **Problem:** Nothing ties `seal.json` to the ref it came from or ties event lines to their header. A forged own-origin continuation could be fast-forwarded into the own ref, and a mirror rewind goes unseen.
- **Disposition: Accept.**
  - D17 adds these checks inside spec §11's "verified": header machine id against the ref, line against header, scope against ref family.
  - It adds `event-store-ref-tampered` and `event-store-mirror-rewound` (doctor fails, cache kept).
  - It states the threat model: a pusher with write rights can still add a new origin, as they can push to `main` today.

### 3. Porting truth is outside the inventory (Critical)
- **Reported by:** Assumption Destroyer #1, Failure Mode Analyst #7.
- **Problem:** The tracked log is `docs/distillery/state/porting/events.jsonl`, together with its `state.json`. The public export `forgent/state/porting-store` is at `package.json:50`.
- **Disposition: Accept.**
  - The inventory searches the whole HEAD tree for porting logs.
  - The import keeps the original paths, and the cutover commit deletes them as authorized non-`.fgos` paths.
  - More than one porting dir stops for the owner (D9).
  - The export API is kept and gets a CHANGELOG line.

### 4. Two-machine default and no fence against old releases (Critical)
- **Reported by:** Assumption Destroyer #2, Failure Mode Analyst #6.
- **Problem:** The default assumed two machines, and nothing stopped an old release from writing new tracked shards after the cutover.
- **Disposition: Accept.**
  - Q2 is now a hard precondition with no lossy default.
  - D18 adds a tracked fence file `.fgos/events`, so an old release fails with `ENOTDIR`.
  - The hook refuses added event paths (D16).
  - A fresh clone refuses writes until its refspec and legacy pin are present (D10).

### 5. Legacy ref is replaceable from the remote and pushed before main (High)
- **Reported by:** Security Adversary #2, Failure Mode Analyst #5.
- **Disposition: Accept.**
  - D18 pins the legacy OID in a tracked file.
  - Readers, doctor and sync accept only that OID.
  - Main is pushed before `refs/fgos/legacy`, and a rejected main push means nothing was published.

### 6. `--include-from` is a second landing door and the hook judges itself (High)
- **Reported by:** Scope Critic #4, Security Adversary #3, Assumption Destroyer #10, Failure Mode Analyst #10.
- **Disposition: Accept, turned into owner question Q5.**
  - The shipped verb loses `--include-from`.
  - Default (b), which follows the signed text: Git adds a ScopedCommit `sourceCommit` mode, and the hook runs from HEAD's tree (M9).
  - Recommendation (a): two commits in one push, with the code commit inert until migrated.
  - The runbook now uses `npm --prefix <worktree>`, rebases and re-gates within 24 h, and freezes main.

### 7. Missed readers fail open (High)
- **Reported by:** Assumption Destroyer #3, Failure Mode Analyst #9.
- **Problem:** The census missed the attestation guard and eight doc checks. The loop appender sits outside the gate. Legacy provenance was not carried.
- **Disposition: Accept.**
  - The census uses patterns instead of a fixed list.
  - The attestation guard gets a fail-closed test.
  - The doc-check sentinel becomes a facade fact.
  - The loop appender goes through the gate.
  - Legacy events carry `{file, line}`.
  - V-DOOR-01 becomes an architecture test.

### 8. In-gate full readers are sent to a facade call that refuses in the gate (High)
- **Reported by:** Failure Mode Analyst #2.
- **Problem:** `claim-port.mjs:239-241`, the drift check (`store.mjs:1115-1143`) and the `currentView` calls inside callbacks would hit the refusing call.
- **Disposition: Accept.** D12 adds `tx.view`, phase 09 adds an in-gate read census, and a test fails on full reads under `hotLockDepth() > 0`.

### 9. Staging the append after claim side effects strands claims (High)
- **Reported by:** Failure Mode Analyst #3.
- **Disposition: Accept.**
  - Every `tx` effect is staged and applied after the append is acked; a refused append applies nothing.
  - Kill and refusal vectors run on the settle path.

### 10. Rollback export depends on deleted Node order code (High)
- **Reported by:** Scope Critic #2.
- **Disposition: Accept.**
  - The Rust legacy-order port is the only legacy-order door.
  - The export calls it and Node only folds.
  - The parity test is retargeted to frozen vectors, and `readAllEventsFromDir` is deleted explicitly.

### 11. Config defaults overwrite each other (High)
- **Reported by:** Scope Critic #1.
- **Disposition: Accept.** There is one `registerConfigDefault` with a nested `eventStore` shape, validation at the read site, and a test of the merged shape.

### 12. Lock order (High)
- **Reported by:** Failure Mode Analyst #8, Assumption Destroyer #10 (part).
- **Problem:** `endSession` would seal under `sessions` 80, the Rust scope cannot see Node's held ranks, and migrate held `event-seal` into main 50.
- **Disposition: Accept.**
  - Held ranks are a required argument (D3).
  - Callers seal after releasing their rank-80 locks.
  - Migrate releases `event-seal` before the ScopedCommit.

### 13. Cross-plan prerequisites have no owner (High)
- **Reported by:** Assumption Destroyer #4, #5, Scope Critic #3.
- **Problem:** Nobody owned the Git 05 release activation, the required addon at activation, the E3 owner input, or the part (b) budget, and M6 inverted the layering.
- **Disposition: Accept.**
  - ES-11 step 0 builds and activates the Git 05 release.
  - M10 makes the addon required.
  - ES-06 waits for the E3 verdict.
  - M6 is dropped: Work's Land caller seals and promotes (D7).
  - Phase 10 measures part (b) end to end.
  - The frontmatter edge cycle is removed.

### 14. Runbook order (High)
- **Reported by:** Failure Mode Analyst #4, #10.
- **Problem:** Migrate ran before setup existed, the rebase happened inside the stop window, and plain `npm run` resolves main's payload.
- **Disposition: Accept.**
  - Migrate runs the setup-fix bodies itself (D8).
  - Phase 10 rehearses from a repository where setup never ran.
  - The rebase and re-gate move to within 24 h before the stop, and the invocation uses an exact `--prefix`.

### 15. Spec departures and smaller defects (Medium)
- **Reported by:** Scope Critic #5-#10; Security Adversary #4, #5, #6, #8, #9; Assumption Destroyer #7, #8, #9.
- **Disposition: Accept. The remote item is accepted in part:** D20 keeps the spec's merge rule and pins the URL instead of moving the key out of project config.
- **Changes:**
  - Start-of-command `sealIfDue` restored (D13).
  - `work.outcome` gets `sealOnWrite` per type.
  - The tsk-1i3 guard is removed per Git spec §7, and the four observe files go to the inventory item (D16).
  - A copied clone is detected (D19).
  - Export path and mode allowlist added.
  - Opportunistic sync runs only for non-worker sessions, through Git's non-interactive Remote context.
  - Stream facts are kept in one source (the static consumer manifest).
  - Lock rows have null `v1` fields and an owner enum test, and the Node resolver edit is dropped.
  - The canonical-JSON differences are stated in Q1, with a digest-preservation test.
  - File ownership between phases 06, 07 and 08 is clarified.
  - Citations fixed: observe count, missing how-to, phase number in a risk row, full `store_lock.rs` path, and spec §15/§19 line references queued for phase 10.
  - Mission #1 projects: reads keep working before migration and writes refuse (Q6).

## Whole-plan consistency sweep

Recorded in plan.md under "Red Team Review". No contradiction remains.

## Unresolved

- Q5 and Q6 are now owner questions; Q1 to Q4 remain.
- M3, M8, M9 and M10 depend on the Git leads accepting them. If Git's spec forbids M3's "superseded" resolution, that is a Git spec question for the owner, raised by the Git lead.
