# Ship/maintain seat report: OPC design council

HEAD: `7a6f366ed` (worktree `/home/vantt/projects/forgent-worktrees/opc-design`)

Every cost below is an estimate unless it says "observed". The estimates come from the E3 and ledger evidence the brief names. I took no timing measurements.

## 1. Position

- **Q1, Linux mechanism.**
  - Do (e) and (b) first, and do not build (a) yet. Record (c) as the later replacement driver.
  - Reject (d).
  - Rationale: the per-child bwrap cost mostly falls on `Inspect` reads. The preliminary design counts about 62 `Inspect` call sites against 1-2 `Remote` children per Sync (design §2 table and §4). Removing the namespace for reads deletes cost without adding an anchor protocol to own.
- **Q2, shared set.** With (b), the question changes. Read-only `Inspect` leaves containment, and only `LocalMutation` and `Remote` keep per-child bwrap, so there is nothing to share. I would drop the shared-domain concept unless a post-(b) census still shows contained children dominating. The design's own recommendation of `Inspect` plus `LocalMutation` becomes moot.
- **Q3, port shape.** No view until (a) is justified. If (a) is built, P1 is right: default methods, so every driver conforms on day one (design §6).
- **Q4, config key.** Auto only, with doctor reporting the mode. The `process-containment` check already exists at `src/setup/registrations.mjs:2182`. A new key means new registration surface, which RUL104 argues against.
- **Q5, host death.** If (a) is built, the anchor terminates on control EOF. Option (b) of Q5, waiting for the running child, leaves an orphan anchor with a long window. Today's Direct mode has no `--die-with-parent`. `spawn_in` runs bwrap as a plain `Command` with no parent-death flag (`containment/linux.rs:121-135`).
- **Q6, timing.** Re-measure first. E3 of 2026-10-21 already puts Land p95 at 0.54 s against a 1.6 s budget, which is met (design "Input from HARDEN T0", line ~125). The Land motive for L-A is largely gone. The users who still pay are R2, R5 and H6, and those are mostly read children.
- **Q7, R3.**
  - Return a named error, `containment-mount-refused`, in the Git refusal and in the doctor row, using the name T1 phase 4 adopts.
  - Do not fall back to `linux-pgroup` per operation. A silent downgrade changes what the Git spec's `containment-unproven` and handoff rules mean (`docs/platform/git/spec.md:291`, `:311`).
  - The existing probe-time fallback stays (`containment/linux.rs:27-34`). It covers the case where namespaces are unavailable at all, not the case where one mount is refused.
- **Q8, read-only children.**
  - Containment buys little for pure plumbing: `rev-parse`, `cat-file`, `config`, `rev-list` and `for-each-ref` run no filters or hooks (`driver.rs:860-925` per design §2).
  - It does buy something for `status` and any command that can run a configured clean filter. The Git spec records a filter child that called `setsid()` and survived `killpg` (`docs/platform/git/spec.md:291`).
  - So split `Inspect` into two classes in Git. "Pure plumbing" runs with no domain. "Filter-capable" keeps per-child bwrap.
- **Q9, callers beyond typed operations.**
  - R2 and H6 are fixed by (b) and by the lazy probe in Q10. Worktree add is mostly `Inspect` children (ledger R2, `plans/261021-1118-harden-low-layers-bottom-up/plan.md:232`).
  - R5 is mostly Node `attempt-step` processes and only about 15 git calls (`plan.md:234`). It is not fixed by any containment option.
  - A CLI call that is not a typed operation has no operation boundary. That is another reason (a) is a poor fit for it.
- **Q10, cheap wins.**
  1. Replace the 2 ms `try_wait` sleep poll with a blocking wait (`driver.rs:1207-1219`). By construction it adds up to 2 ms of idle per contained child.
  2. Make `containment::select` lazy. `GitDriver::new` calls it eagerly (`driver.rs:282`). A read-only CLI call that spawns no contained child would then never pay the H6 probe, and the probe is already cached per process (`linux.rs:43-48`).
  3. Measure bwrap flags (L-E) before anything else. That belongs to the speed seat.

## 2. Findings

| Sev | Claim | Evidence | Consequence |
|---|---|---|---|
| High | Most contained children are `Inspect` reads. Sharing a domain needs a quiescence gate (I2), a control protocol and an anchor role, all to save cost on children whose hooks are off. | Design §2 and §4; `driver.rs:860-925` | Option (b) deletes the cost instead of amortising it. It is the smaller thing to own for a year. |
| High | Option (a) adds a new owned artifact: an anchor helper role, a unix-socket protocol and an SCM_RIGHTS stdio path. | Design §6-7 (L-A); precedent `HelperExe` in holder-lock spec §8.1 | The protocol needs a version, a contract file and fd-leak vectors (design conformance item 8). It also has a hang mode (design risk table). It is Process L0 code with no named owner in the evidence I have. |
| High | The measured motive has shrunk. | Land p95 0.54 s vs 1.6 s budget, design "Input from HARDEN T0". Land, ScopedCommit and Sync are the typed operations; the users hurting now are R2 (≈0.5 s per worktree add), R5 and H6. | An operation-scoped anchor cannot help worktree add or per-CLI calls, because neither is a typed operation with a boundary. |
| Medium | CI would not run a new conformance suite on a normal branch. | `.github/workflows/process-containment.yml:5-14` triggers only on `run-supervisor/**`, `terminal-mode/**` and `controller-death/**` pushes or on dispatch. | Any driver work needs a trigger change. The Windows, macOS and Linux matrix at `process-containment.yml:22-24` is the right place to add conformance, but it is not on the default path. |
| Medium | Option (d) needs more than a Rust change. | The design says Ubuntu 26.04 restricts unprivileged userns (§7 L-D). `ci.yml:37-44` already lifts it for bwrap on CI. | Setup would need a root-installed AppArmor profile registered in `fgos setup` and doctor (AGENTS.md install/setup/doctor gate). That is per-host cost for every user. |
| Medium | Option (c) depends on cgroup delegation that is not guaranteed. | Design §7 L-C: this host runs in a non-delegated `session-215.scope`. | It is a good later driver behind the same port, but it cannot be the only Linux driver. |
| Medium | Dropping the namespace for reads removes the Git spec's descendant-drain claim for those children. | `docs/platform/git/spec.md:291` ("Descendant drain is claimed only where a Process containment domain ... exists") | The spec needs one explicit "no domain, plumbing only" class. Without it, a new filter-capable command added to the pure class silently loses the guarantee. |
| Low | R3 couples every Git read to bwrap health. | Ledger R3, `plan.md:233`; `linux.rs:121-135` | Removing bwrap from pure reads shrinks the R3 blast radius. It also makes T1 phase 4's named error rarer. |
| Low | The 2 ms poll loop is a per-child latency floor of up to 2 ms. | `driver.rs:1219` | Cheap to remove. It is not the main cost. |

## 3. Recommended shape

**Priority check (AGENTS.md).**
- Ship Faster for projects using fgOS ranks first. R2, H6 and R5 are what those projects feel.
- Option (b) plus the Q10 cheap wins serve those users without a new protocol.
- Option (a) mainly helps typed operations, and it adds ownership cost that RUL104 asks us to justify.

**Port.** Leave `ContainmentDriver` unchanged for now (`containment/mod.rs:187`). Git gains a policy split in `Policy` (`driver.rs:146`), as follows.

| Class | Containment |
|---|---|
| `InspectPure` | none; spawned like the borrowed path's plain spawn, with a deadline and process-group kill |
| `InspectFilterCapable` | per-child bwrap, as today |
| `LocalMutation`, `Remote` without loan | per-child bwrap, as today |
| Borrowed paths | unchanged (holder-lock) |

**Drivers.**
- Keep `bwrap-pidns`, `linux-pgroup`, `windows-job` and `macos-tree` as they are.
- Record `linux-cgroup` (c) as a later driver.
- Do not build (a) or (d).

**Deletion list (L10).**
- The eager `select` in `GitDriver::new` becomes lazy.
- The 2 ms sleep poll goes.
- Move every `Inspect` caller to one of the two classes in the same change.
- If (b) lands, the shared-domain sections of the preliminary design (§4, §6 P1 operation methods, §10 anchor risks) are retired as a design option.

**Doctor and setup.** No new key. The existing `process-containment` check reports driver and level (`src/setup/registrations.mjs:2182`). If the Git refusal name changes, add a doctor line. Add a CHANGELOG `[Unreleased]` line only if doctor output changes.

**Conformance.** Each behaviour has one owning proof (design principle 8).
- Add a Git-side test that fixes the closed list of `InspectPure` commands. Adding a command then forces a decision.
- Add a test that a hung pure-plumbing child is killed by the deadline.
- Process conformance is unchanged.

**System-level consequence of this option.** The blast radius of bwrap or mount failure (R3) shrinks. A host with an unremountable mount, or no user namespaces, can still run every pure Git read. Only filter-capable and mutating children depend on bwrap. The cost is that the Git spec's "descendant drain only inside a domain" statement must be rewritten to name the no-domain read class.

## 4. Proposed additions (RUL104)

- **Closed `InspectPure` allowlist test.**
  - Problem: a misclassified filter-capable command loses containment silently.
  - Evidence: filter escape at `docs/platform/git/spec.md:291`.
  - Benefit: the guarantee is kept by a test, not by memory.
- **Post-(b) census before any (a) spike.**
  - Problem: no census of contained children per operation after (b).
  - Evidence: design "Unresolved", the Sync census missing from E3.
  - Benefit: (a) is built only if contained children still dominate.

## 5. What would change my position

- A post-(b) census still showing contained children of a typed operation above a stated share of wall time. Then (a) with P1 is the right next step.
- A clean-filter or `textconv` path found in a command I classed as pure. That command moves to the filter-capable class. If most reads turn out filter-capable, (b) shrinks to the lazy probe and the poll fix.
- A named owner and a CI budget for an anchor protocol. That would lower the maintenance cost of (a).
- Evidence that cgroup delegation is available on the supported fleet. Then (c) could replace per-child bwrap outright.
- An owner decision that kernel-level proof is required even for read children. That is a product-intent question I cannot settle.

## Evidence gaps

- No cost evidence for the anchor protocol: per-child cost inside an anchor and the bwrap setup breakdown are unmeasured (design "Unresolved").
- No named maintainer for `packages/process`. I could not find an owner in the files I read.
- No Sync census in E3.

```text
Status: DONE_WITH_CONCERNS
Summary: Prefer cheap wins plus dropping the pid namespace for pure-plumbing reads. Defer the anchor, and record cgroup v2 as a later driver. The anchor protocol's cost and ownership are unmeasured, so (a) has no supported maintenance estimate.
```
