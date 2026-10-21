# HARDEN T1 — Correctness and failure seat

Commit reviewed: `56d0f4d62` (2026-10-22, Asia/Saigon).  I read the T1 brief, plan/phase material, component specs and contracts, Rust implementations/tests, Node facades/fences/hot mutex, and the targeted Node tests. I ran read-only inventory commands only; I did not modify the checkout or run a test suite.

## Part A — target shapes

### Holder-lock and lock fence

1. **Authority.** `fgos-holder-lock` is the sole authority for acquiring, validating, borrowing, draining, releasing, probing and enumerating kernel-backed lock descriptions; the fence command is the sole authority for a *confirmed*, identity-pinned termination of a wedged holder.
2. **Contract/ports.** Keep Rust `acquire`, `validate`, `validate_quiescent`, `run_borrowed`, `release`, `probe`, `holders`, `guarantee` (`packages/holder-lock/rust/src/port.rs:700-1333`) and predecessor admission (`packages/holder-lock/rust/src/predecessor.rs:177-232`). Preserve named results/errors including `kernel-lock-held`, `predecessor-domain-not-empty`, `lock-release-stuck`, `borrow-leftover-not-killed`, and `lock-resource-replaced`. The fence port keeps `lock-fence-not-confirmed`, `lock-fence-self`, `lock-fence-unlistable`, `lock-fence-still-held`, and `lock-fence-signal-refused` (`src/runner/lock-fence.mjs:72-203`).
3. **Boundary/budget.** Lock waits, holder enumeration, borrow/drain and release must use the in-process Rust door; do not retain Node’s competing algorithms in `src/holder-lock/index.mjs` (`acquireSync` begins at :243; Node borrowing begins at :528). A compatibility host route may remain only for the external/legacy `internal` protocol and Windows helper lifecycle. Node after migration: a ≤150-line typed adapter exporting the existing public API and error translation; no `/proc`, lock ordering, inode, drain, process-group, or retry decision.
4. **Delete list.** Delete/move the Node acquisition/retry/inode/borrow/drain implementations, direct holder scan plumbing, and their mirror tests after Rust owns their behavioural proofs. Do **not** delete `fences.mjs` or legacy readers now: R4 is expressly unresolved, and existing fences must live for their release. The legacy compatibility routes may be deleted only with every old caller and the R4 retirement proof.
5. **Doctor.** Retain `holder-lock-kernel-semantics`, `holder-lock-borrow-containment`, and `holder-lock-health` (holder/predecessor/fence detail codes). These preserve the present failure states rather than silently dropping them.
6. **Size target.** Node −1,050; Rust +120 maximum; tests −180 net (move proofs down rather than duplicate them). This pays T0’s +150-line debt with at least −1,110 combined lines.

**Containment decision (received R3).** Do not silently fall back after a selected `BwrapPidns` launch fails. Return `containment-mount-refused` naming the mount and remediation; that is the smallest honest shape and does not claim a kernel guarantee that an implicit `linux-pgroup` fallback cannot provide. The reported all-host-mount failure is recorded at `plans/261021-1118-harden-low-layers-bottom-up/phase-02-t1-holder-lock-identity-convention.md:20` and belongs in the T0 process-door implementation/contract, not in a Node lock workaround.

### Session Identity

1. **Authority.** `fgos-session-identity` alone decides writer identity source and value: registry-confirmed env, env, terminal/session process identity, or unresolved PID.
2. **Contract/ports.** Keep `resolve`/`resolve_current` (`packages/session-identity/rust/src/resolve.rs:145-171`), provider `resolve_request` (`packages/session-identity/rust/src/provider.rs:55`), and `internal identity mint-attempt` with its version/invalid-id exits (`packages/session-identity/rust/src/route.rs:9-61`). Keep `host-missing`, `host-version-mismatch`, `identity-in-lock`, `bad-output`, and `invalid-attempt-id` at the adapter boundary.
3. **Boundary/budget.** Replace `execFileSync`-based resolving with the in-process door; a Node facade may cache opaque Rust answers and enforce “no invocation under hot lock,” but may not parse/choose IDs. Budget ≤80 lines and three exports: resolve, mint attempt, lock-held notification.
4. **Delete list.** Delete Node host-process invocation/JSON-envelope classification once the door has structured results (`src/util/session-identity.mjs:60-136`, :165-241); retain only compatibility invocation until all callers use the door. Retire Node vector mirrors that exactly duplicate Rust golden vectors.
5. **Doctor.** Keep `writer-identity-resolvable`, including running-host and plain-hook activation checks (`src/setup/registrations.mjs:6482-6486`).
6. **Size target.** Node −160; Rust +0 to +30; tests −30 net.

### Convention

1. **Authority.** `fgos-convention` owns normalization, timestamp validation, naming, placement, classification and conformance results.
2. **Contract/ports.** Keep provider operation `name|path|check|classify` (`packages/convention/rust/src/provider.rs:30-59,91-149`) and `ConventionError` names (`packages/convention/rust/src/operations.rs:43-62`).
3. **Boundary/budget.** This cold operation may keep the native host/provider invocation. The current 21-line client (`src/convention/convention-client.mjs:1-20`) is already within a ≤25-line budget; it decides no convention rule.
4. **Delete list.** No new delete is justified in the client. Retire only Node rule/vector duplicates after the Rust golden test owns each exact case.
5. **Doctor.** Keep `convention-conformance` (`src/setup/registrations.mjs:6359-6362`).
6. **Size target.** Node 0; Rust 0; tests −15 net.

### One state-root / `.fgos` lookup door

1. **Authority.** Rust state-root resolution alone decides the process state root and lock root; repository-root discovery is a distinct Git/cwd concern and must not be relabelled as state-root resolution.
2. **Contract/ports.** Keep `state_root/state_root_from/lock_root` (`packages/holder-lock/rust/src/state_root.rs:43-74`) and host `internal state-root`; preserve `pinned`, `fgos-state-home`, `xdg-state-home`, `home`, `userprofile`, and `relative-fallback` sources. The Node client reads a pin or asks the compatibility route once (`src/holder-lock/state-root.mjs:17-39`).
3. **Boundary/budget.** Retain this ≤45-line Node compatibility client only. Any hot/lock-path consumer receives the resolved value from the in-process door or inherited pin; it must never calculate HOME/XDG itself.
4. **Delete list.** Classify the 36 direct `.fgos` joins from the inventory before deletion: project-local paths are not state-root resolvers; legacy fence paths such as `defaultProviderRuntimeDir` (`src/holder-lock/fences.mjs:75-77`) need an explicit compatibility classification. Delete only duplicate HOME/XDG/global-state formulas, not legitimate project paths.
5. **Doctor.** Keep `state-root`, which detects a Node/Rust root disagreement (`src/setup/registrations.mjs:2330-2333`).
6. **Size target.** Node −60 from duplicate resolvers; Rust/test delta 0.

### Hot mutex (review-only Node exception)

1. **Authority.** Until WORK moves the state store, `src/state/hot-lock.mjs` is the temporary authority for atomic record publication and synchronous state transactions; T0’s process door remains authority for liveness and holder identity.
2. **Contract/ports.** Preserve `withStateTx`, `readHotRecord`, `reclaimDeadHolder`, `clearHotRecord`, and `judgeHotRecord` (`src/state/hot-lock.mjs:88-157,286-318`) plus `hot-lock-timeout`, `lock-record-unreadable`, re-entry, async, and revoked-transaction errors in `packages/holder-lock/contracts/hot-lock.v1.json`.
3. **Boundary/budget.** This is the owner-approved Node exception only until WORK lands. No child process or host spawn may occur inside the critical section. No new abstraction; repair defects locally and hand its eventual Rust move to WORK.
4. **Delete list.** None in T1: WORK owns the state-write staging region. Once WORK owns a Rust state port, delete the entire Node hot mutex and its duplicate state-only tests in that one migration.
5. **Doctor.** Keep a `hot-mutex-health` diagnostic containing record unreadable/unjudgeable and fence recovery; preserve today’s `lock-record-unreadable` condition.
6. **Size target.** Node/Rust 0 excluding defect fixes; tests +2 owning races, offset by retirement of the prose-only contract assertion.

Layer target: Node −1,270, Rust +150 maximum, tests −225 net: T1 ≤−1,345 and T0+T1 ≤−1,195.

## Part B — findings against the target shape

### T1-CF-01 — Windows retryable read is treated as an absent hot record

- **Axis:** A (correctness/liveness)
- **Severity:** Medium
- **Status:** Inferred; not rated higher because I did not run Windows.
- **Evidence:** `src/state/hot-lock.mjs:36,88-95` maps `EPERM`/`EBUSY` to `absent`; `src/state/hot-lock.mjs:181-190` immediately continues for `absent` before checking the timeout. `tryLinkRecord` also regards the same errors as a failed acquire (`:160-174`).
- **Failure:** A Windows sharing violation while another holder’s record exists becomes “absent,” then the waiter loops without sleeping or reaching the deadline. It can spin indefinitely rather than return the documented five-second `hot-lock-timeout`.
- **Reproduction:** On Windows, hold/open `state.hot` so `linkSync` and `readFileSync` yield `EBUSY`/`EPERM`; call `withStateTx` in another process and assert a timeout after about five seconds rather than CPU spinning. A deterministic state-layer process test may inject the platform error only at the filesystem boundary.
- **Fix shape:** Replace the false `absent` mapping with a distinct retryable-read result; it sleeps/polls and observes the same deadline, and is never eligible for reclaim. This replaces the incorrect absence interpretation; it adds no lock mechanism.

### T1-CF-02 — successful hot-transaction return can leave its record held on Windows

- **Axis:** A (correctness/failure visibility)
- **Severity:** Medium
- **Status:** Inferred; Windows-only error path not reproduced.
- **Evidence:** `releaseRecord` retries `EPERM`/`EBUSY` five times then falls through without an error (`src/state/hot-lock.mjs:204-218`); `withStateTx` therefore returns normally after `releaseRecord` (`:300-311`).
- **Failure:** If unlink stays sharing-blocked for roughly 25 ms, the caller is told its transaction completed while its record remains. Other live processes see an alive holder and block until their timeout; the released process has no named diagnostic.
- **Reproduction:** Force five `EBUSY` responses from the record unlink in a Windows process test, then assert that the transaction reports a named release failure and the next process cannot mistake it for success.
- **Fix shape:** Exhaustion must throw a named `hot-lock-release-stuck`/`hot-lock-release-failed` outcome and preserve the record for the fence path. Add the contract error and one owning test; replace the silent fall-through.

### T1-CF-03 — HL-N8/N9 have no proof that isolates either byte comparison

- **Axis:** E (testability)
- **Severity:** Medium
- **Status:** Reproduced as a coverage gap by source inspection: the only explicit check is contract prose, not behaviour (`test/holder-lock/hot-lock-contract.test.mjs:30-41`); the multiprocess schedule reaches only its helper-level unlink path (`test/state/hot-lock-multiprocess.test.mjs:77-117`). This agrees with the received TEST result.
- **Evidence:** First comparison: `reclaimDeadHolder` (`src/state/hot-lock.mjs:130-134`). Second comparison: `unlinkRecordIfUnchanged` (`:109-119`).
- **Failure:** Deleting either passes the existing suite, so a future refactor can erase race protection unnoticed.
- **Fix shape and decision:** Keep **both** checks for now. Add two state-layer process races: (1) replace the initial observed bytes before a cleaner obtains reclaim ownership, asserting the cleaner returns `changed` without unlinking (pins the under-reclaim reread); (2) replace bytes after that reread/judge but before unlink, asserting the fresh record remains (pins the final TOCTOU check). The checks protect different windows. After those proofs exist, a simplification may instead judge the under-lock reread and use the final compare as its only unlink authority, but that must update the contract and tests together; do not remove either now.

### T1-CF-04 — fast path is already at/over its accepted 10% budget

- **Axis:** B (performance)
- **Severity:** Medium
- **Status:** Inferred from the received TEST measurement; I did not remeasure a shared machine.
- **Evidence:** The owning benchmark enforces `ratio <= 1.1` at `test/state/hot-lock-multiprocess.test.mjs:249-292`; phase evidence records 1.101 under suite load and 1.055–1.065 alone (`plans/261021-1118-harden-low-layers-bottom-up/phase-02-t1-holder-lock-identity-convention.md:25`). Baseline p50 for an empty transaction is 19.6 µs (`plans/reports/research-261022-0138-harden-t1-baseline.md`).
- **Failure:** The intended non-regression guard is flaky at the declared product ceiling; loosening its bound would hide a real cost.
- **Fix shape:** TEST first apportions time among identity cache, record creation/link/unlink, and fsync (if any); compare any durability claim with the recorded plain-fsync probe, not a synthetic target. Remove the dominant redundant cost or ask the owner to accept a changed budget. Do not merely change `1.10`.

### T1-CF-05 — holder-lock’s Node facade still decides port behaviour

- **Axis:** G (architecture/one authority)
- **Severity:** Medium
- **Status:** Reproduced by inspection.
- **Evidence:** Node owns acquisition preparation and retry (`src/holder-lock/index.mjs:142-291`), probe/holder dispatch (`:363-400`), and borrow/drain/process-group policy (`:437-610`), while Rust owns the same port operations (`packages/holder-lock/rust/src/port.rs:700-880,1305-1333`).
- **Failure:** Semantics can diverge by transport/platform and the locked-law Rust-first decision is not met; Node release is merely `closeSync` (`src/holder-lock/index.mjs:109-126`) rather than the Rust port’s `release` settlement (`packages/holder-lock/rust/src/port.rs:826-848`).
- **Fix shape:** Move all deciding operations to the in-process Rust port, update every facade caller, then delete the Node implementations and duplicate proofs in one migration. Preserve only API/error adaptation and explicit legacy route support.

### T1-CF-06 — T0-R1 has a measured N-API canonical-JSON regression but no component budget or attribution

- **Axis:** B (performance)
- **Severity:** Medium
- **Status:** Inferred from the recorded benchmark (384 µs vs 171 µs for 200 keys), not rerun.
- **Evidence:** Carry item and figures: `plans/261021-1118-harden-low-layers-bottom-up/phase-02-t1-holder-lock-identity-convention.md:14-16`; addon accepts a fully marshalled `serde_json::Value` (`packages/git/node-addon/src/canonical_json.rs:1-10`).
- **Failure:** The Rust authority move has a 2.2× measured cost without knowing whether N-API conversion or canonicalization causes it; an arbitrary rewrite risks adding a second API.
- **Fix shape:** Benchmark the Rust canonicalizer alone versus JS→`Value` conversion, then remove the dominant marshalling copy in the existing `canonicalJson` entry point or obtain an owner acceptance tied to a workload budget. No parallel JSON API.

### T1-CF-07 — T0-R2 exposes raw N-API validation rather than a durable-file contract error

- **Axis:** F (failure contract)
- **Severity:** Low
- **Status:** Inferred from the received T0 reproduction; not rerun.
- **Evidence:** `mode` is an unvalidated N-API `u32` parameter in both exports (`packages/git/node-addon/src/durable_file.rs:27-47`); T0 records omitted mode as raw `NumberExpected` (`plans/261021-1118-harden-low-layers-bottom-up/phase-02-t1-holder-lock-identity-convention.md:16`).
- **Failure:** Callers cannot branch on a stable component error for a malformed public argument.
- **Fix shape:** Parse/validate the existing argument at the door and return one named `durable-file-mode-invalid` error; retain the same required-argument contract and replace raw binding-generated output.

## Migration table

| Node part | What it decides now | Move or not | Reason/order | Node budget after move |
|---|---|---|---|---:|
| `src/holder-lock/index.mjs` | acquire/retry, inode, probe, borrow, drain | Move | Rust port already owns the contract; expose it in-process, migrate callers, delete Node logic | ≤150 |
| `src/runner/lock-fence.mjs` | confirmation orchestration plus holder/fence policy | Move policy; retain CLI adapter | Rust process/holder port decides facts; retain confirmation UX only, after holder port | ≤80 |
| `src/holder-lock/fences.mjs` | compatibility fence enumeration/placement | Do not delete yet | R4 unresolved; preserve old-reader safety, then retire with one-release proof | ≤80 until retirement |
| `src/util/session-identity.mjs` | host spawning, cache/error adaptation | Move invocation to door | Rust already decides identity; migrate before hot calls | ≤80 |
| `src/convention/convention-client.mjs` | argument forwarding only | Keep | Cold thin provider client; no duplicate rules | ≤25 |
| `src/holder-lock/state-root.mjs` | pin/compat-route caching only | Keep, remove other resolvers | Rust formula already sole authority | ≤45 |
| `src/state/hot-lock.mjs` | temporary state mutex | Do not move in T1 | Owner exception; WORK owns final migration | current, then delete whole file with WORK |

## Delete list

| Candidate | Evidence nothing needs the *Node implementation* | Action |
|---|---|---|
| Node holder-lock decision code | Rust exposes matching acquire/release/borrow/probe/holders operations (`packages/holder-lock/rust/src/port.rs:700-1333`); Node duplicate locations above | Delete only after in-process callers land and Rust tests own behaviours |
| Node identity host-spawn/parser | Rust resolve/route exists (`packages/session-identity/rust/src/resolve.rs:145-171`, `route.rs:9-61`) | Delete after native door returns structured identity results |
| Convention rule logic in Node | `rg` found only forwarding client; Rust provider owns operations (`src/convention/convention-client.mjs:1-20`) | Nothing to delete; do not grow it |
| Legacy fences | Existing registry/fence callers remain and R4 is unresolved (`src/holder-lock/fences.mjs:381-414`) | Retain; delete only at documented compatibility expiry |
| Direct `.fgos` joins | Inventory is broad (repository paths, tests, legacy fence paths); not evidence of duplicate state-root resolution | Classify first; delete only HOME/XDG/state-root copies |

## Doctor table

| Current condition | Fail/warn meaning | Surviving row |
|---|---|---|
| `lock-kernel-semantics` | either lock mount lacks measured two-process exclusion | `holder-lock-kernel-semantics` |
| `lock-borrow-vectors` | git child can leak a borrowed description | `holder-lock-borrow-containment` |
| `lock-holders` | unknown holder or predecessor domain remains | `holder-lock-health` with detail code |
| `lock-fences` | legacy path unfenced or old lock still present | `holder-lock-health` until R4 retirement |
| `lock-record-unreadable` | hot record is unparsable/unjudgeable | `hot-mutex-health` |
| `lock-predecessor-kill-wait` | configured kill wait invalid | `holder-lock-health` config detail |
| `state-root` | Node and host disagree on roots | `state-root` |
| `convention-conformance` | report/journal path violates packaged rules | `convention-conformance` |
| `writer-identity-resolvable` | running host or hook activation cannot resolve a writer | `writer-identity-resolvable` |

The present rows and meanings are registered at `src/setup/registrations.mjs:2300-2335,6359-6362,6482-6486`; consolidation must retain each detail code.

## Tests table

| Behaviour | Owning proof | Duplicate/move/retire decision |
|---|---|---|
| Kernel exclusion, killed holder, timeout, probes | Rust `packages/holder-lock/rust/tests/multiprocess.rs:29-239` | Rust owns; retire Node mirrors after adapter has one wiring test |
| Predecessor record shapes/unknown records | Rust `predecessor_record_shape.rs:28-80` and multiprocess unknown-record test | Rust owns; Node only verifies route/error wiring |
| Lock order/resource replacement/borrow authority | Rust `scope_rank.rs:21-204` | Rust owns; no Node case-by-case mirror |
| State-root resolution vectors | Rust `state_root_vectors.rs:15-42` | Rust owns; Node pin-versus-route wiring only |
| Hot cleanup exclusion/stress/zombie/fail-closed | `test/state/hot-lock-multiprocess.test.mjs:77-247,299-318` | Retain while hot mutex is Node; add the two HL-N8/N9 process races and two Windows retry/release cases |
| Fast-path budget | `test/state/hot-lock-multiprocess.test.mjs:249-292` | Retain; TEST attributes cost before any bound change; alternating calls reduce time-order bias |
| Session identity vectors/cache/no-exec-under-lock | `test/util/session-identity.test.mjs:83-313` plus Rust golden tests | Move vector ownership to Rust; leave one Node door/cache wiring proof |
| Convention naming/placement | `packages/convention/rust/tests/golden.rs` and client tests `test/convention/convention-client.test.mjs:25-54` | Rust owns rules; retain only client invocation/version-mismatch wiring |

## Rejected hypotheses

- **Malformed or unknown predecessor records are silently cleared:** rejected. `parse_record` refuses unknown shape and `admit_traced` returns `NotEmpty` without removing it (`packages/holder-lock/rust/src/predecessor.rs:151-213`); Rust test coverage includes unknown-record refusal (`multiprocess.rs:215`).
- **A hot record with an unknown/unreadable holder is reclaimed automatically:** rejected. The hot contract forbids it and the state multiprocess test asserts bytes stay after timeout (`packages/holder-lock/contracts/hot-lock.v1.json`, `test/state/hot-lock-multiprocess.test.mjs:194-224`).
- **State-root HOME/XDG policy is duplicated in the Node client:** rejected. Node only reads a nonblank pin or calls the route (`src/holder-lock/state-root.mjs:17-39`); formula/order lives in Rust (`packages/holder-lock/rust/src/state_root.rs:56-74`).
- **Convention client carries duplicated convention rules:** rejected. It only forwards `check` arguments to the native host (`src/convention/convention-client.mjs:1-20`); validation lives in Rust (`packages/convention/rust/src/operations.rs:84-177`).
- **Both hot bytes comparisons are provably redundant:** rejected for the current contract/implementation. Existing tests prove neither independently; until the two races above land, deleting either loses an unpinned temporal boundary.
- **Fences can be deleted now:** rejected. The phase explicitly says R4 compatibility is unanswered and fences must remain (`plans/261021-1118-harden-low-layers-bottom-up/phase-02-t1-holder-lock-identity-convention.md:47`).

Status: DONE_WITH_CONCERNS
Summary: The Rust authorities are soundly shaped, but Node still decides substantial holder-lock behaviour and the temporary hot mutex has two Windows liveness/failure-visibility paths plus missing HL-N8/N9 race proofs.
Concerns/Blockers: Windows findings and the canonical-JSON benchmark were not reproduced on this Linux shared machine; R4 compatibility prevents fence deletion, and WORK owns the final hot-mutex move.
