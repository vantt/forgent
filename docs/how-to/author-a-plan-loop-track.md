# How To: Author A Plan-Loop Track

Audience: a Lead writing `plan.md` + phase files for a Work-independent,
plan-driven implementation track that `fgos-plan-loop` will drive (audit →
cell → review → red-team → fix → close). This how-to is the authoring-side
half of that contract; the coding-worker discipline half lives in the
instruction fragment linked in [Coding verification discipline](#coding-verification-discipline)
below — this document does not restate that fragment's rule, only points to it.

## Precedence & compatibility rule

Plan-level Product Gates and a phase's own `## Verification` take precedence
over generic skill defaults. Isolation-breaking diffs (see
[Escalation authority & scope](#escalation-authority--scope)) and
Lead-accepted escalations override the targeted default for that cell. Work
items running under fgOS Work use the item's `verify` contract instead of
this document's plan/phase inputs. Existing running tracks that lack a
baseline or checkpoint block remain fully compatible without any forced
schema migration or validator script — the sections below are for tracks
being authored or revised, not a retrofit requirement.

```text
Precedence order for "what do I run":
1. An explicit Lead objective for this round, if it says otherwise.
2. This cell's phase file `## Verification`.
3. plan.md Product Gates marker for this phase (`**Full-suite gate.**`).
4. Generic skill default (targeted proof).

A mechanical isolation-breaking trigger or a Lead-accepted escalation
finding overrides #4 for the current cell regardless of the marker.
```

## Execution Inputs

Record these once in `plan.md`, verbatim across every request in the track:

- **Track branch** — the branch every cell integrates into.
- **Cell branch / coordination-id convention** — how a cell's worktree
  branch and coordination id are named.
- **Roster** — the exact doer/reviewer/red-team roster string, unchanged
  across cells unless the plan is revised.
- **Full proof command** — the repository's real full-suite command (e.g.
  `npm test`).
- **Recorded baseline** — full proof command, run once before the first
  cell; date; commit; and the exact names of already-failing tests as
  "known baseline failures". Every later full-proof run is judged against
  this list: a baseline failure is unrelated unless the current cell
  touches its subject; any new failure blocks close. **The baseline list
  may only shrink** — a shrink is recorded as evidence; it never grows
  silently.
- **Merge cadence to main** — per cell, per gate, or final-only. This is a
  per-plan choice; there is no default.
- **Main→track sync point** (optional) — if the track pulls `main` back in
  at checkpoints, say where and how sync-induced failures are triaged.

```text
## Execution Inputs

- Track branch: <branch>
- Cell branch/coordination-id convention: <pattern>
- Roster: <verbatim roster string>
- Full proof command: <command>
- Recorded baseline: <command>, <date>, <commit>, known failures: [<test names>] (may only shrink)
- Merge cadence to main: per-cell | per-gate | final-only
- Main→track sync point (optional): <when/how>
```

## Durable evidence schema

A cell's proof passes through three distinct, non-collapsible states:

1. **`coordination-accepted`** — the cell's coordination loop reached quorum
   and the cell-declared targeted verification passed on the cell worktree
   at `testedSha`.
2. **`merged-to-track`** — the cell branch was integrated into the track
   branch, producing `integratedSha`.
3. **`checkpoint-verified`** — the gate's full proof command executed
   against `integratedSha`, was compared against the recorded baseline,
   every new failure was triaged, and it passed.

**Non-inference rule:** if `testedSha != integratedSha`, `checkpoint-verified`
cannot be inferred from the pre-merge proof recorded at `coordination-accepted`.
Full gate verification must execute against `integratedSha` before the
checkpoint can be certified.

```text
## Evidence states for cell <id>

- coordination-accepted: testedSha=<sha>, command=<targeted command>, outcome=pass
- merged-to-track: integratedSha=<sha>
- checkpoint-verified: only if this gate ran the full proof command against
  integratedSha itself (never inferred from testedSha's result when the
  two shas differ)
```

## Checkpoint identity

Every checkpoint is a durable record tuple. Record it in the cell trace:

```text
phase/cell id: <phase>/<cell>
command: <exact command executed>
baseline: <recorded baseline reference>
testedSha: <sha proof ran against pre-merge>
integratedSha: <sha proof ran against post-merge, or same as testedSha if no merge occurred yet>
outcome: pass | fail (with triage: patch-related | pre-existing | environmental)
```

## Product Gates table

Mark each phase's proof obligation explicitly; do not leave it implicit.

```text
## Product Gates

| Phase | Cell | Capability | Exit |
|---|---|---|---|
| 00 | <cell name> | code:implement | <exit condition> |
| 01 | <cell name> | code:implement | <exit condition>. **Full-suite gate.** |
```

`**Full-suite gate.**` means: run the track's full proof command in the
cell worktree (and again on `integratedSha` if it differs from `testedSha`,
per the non-inference rule above), compare against the recorded baseline,
triage every new failure as patch-related / pre-existing / environmental,
and record the outcome before close.

**Mechanical-gate rule:** regardless of what the Product Gates marker says,
a cell is a full-suite gate if its diff touches any of: dispatch/self-host
hooks, session/replay/schema core, shared invariants, migrations,
test-harness foundations, or `package.json` scripts.

## Per-phase `## Verification`

Each phase file's own `## Verification` section names **targeted commands
only** — the smallest set that actually exercises the contract this phase
changes. The full proof command appears in a phase file's `## Verification`
only when that phase is itself a gate (Product Gates marker or the
mechanical-gate rule above fired).

```text
## Verification

​```sh
<targeted command(s) for this phase's contract only>
​```
```

## Escalation authority & scope

Reviewer and Red-Team report proof gaps as advisory findings only — naming
the missing test or contract, severity-tagged — and never expand their own
run to cover it. The Lead holds sole authority to decide `accepted` or to
provide an evidence-backed `rejected`.

An accepted escalation upgrades the proof requirement for **the current
cell only** (`Proof: escalated-to-full`). It does not create a permanent
Product Gate across future cells unless the plan is explicitly updated to
add one.

```text
Finding: proof insufficient — targeted set does not cover <contract> (severity: <level>)
Lead disposition: accepted -> Proof: escalated-to-full for cell <id> only
             | rejected -> <evidence-backed rationale>
```

## Cell trace format

Every cell trace records:

```text
Proof: targeted | full-suite-gate | escalated-to-full
phase/cell id: <phase>/<cell>
command: <exact command>
baseline: <recorded baseline reference>
testedSha: <sha>
integratedSha: <sha>
outcome: <pass|fail + triage if applicable>
```

## Lead checklist

- Open cell: assign roster, state this cell's targeted `## Verification`.
- Close cell: re-run the phase's stated `## Verification`; disposition any
  Reviewer/Red-Team proof-gap finding (`accepted` or evidence-backed
  `rejected`) before close.
- Gate full proof + triage: at a `**Full-suite gate.**` phase or a
  mechanical-gate trigger, run the full proof command, compare to baseline,
  triage every new failure (patch-related / pre-existing / environmental).
- Track integration merge: merge the cell branch per the plan's recorded
  merge cadence, producing `integratedSha`.
- Post-merge gate execution when `testedSha != integratedSha`: re-run the
  gate's full proof command against `integratedSha` before certifying
  `checkpoint-verified` — never infer it from the pre-merge run.
- Final close: run the full proof command on the integrated track branch
  before the last merge to main; missing proof blocks close.

## Coding verification discipline

The coding-worker side of this contract — what a doer/fixer/reviewer/
red-team actually does with the verification a unit declares — is the
single source of truth in
[`domains/coding/instructions/verification-discipline.md`](../../domains/coding/instructions/verification-discipline.md).
Read it there; it is not repeated in this document.
