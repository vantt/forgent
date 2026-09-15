# How To: Author A Plan-Loop Track

Audience: a Lead writing `plan.md` + phase files for a Work-independent,
plan-driven implementation track that `fgos-plan-loop` will drive (audit →
cell → review → red-team → fix → close). This how-to is the authoring-side
half of that contract; the coding-worker discipline half lives in the
instruction fragment linked in [Coding verification discipline](#coding-verification-discipline)
below — this document does not restate that fragment's rule, only points to it.

## Precedence & compatibility rule

Plan-level Product Gates and a phase's own `## Verification` take precedence
over generic skill defaults. An isolation-breaking diff — the same
mechanical-gate trigger defined in the [Product Gates table](#product-gates-table)'s
**Mechanical-gate rule** — and a Lead-accepted escalation both override the
targeted default for that cell. Work
items running under fgOS Work use the item's `verify` contract instead of
this document's plan/phase inputs. Existing running tracks that lack a
baseline or checkpoint block remain fully compatible without any forced
schema migration or validator script — the sections below are for tracks
being authored or revised, not a retrofit requirement.

```text
Precedence order for "what do I run":
1. An explicit Lead objective for this round — may only ADD proof beyond
   #2-#4 below; it may never remove a plan-declared Product Gate or a
   mechanical-gate trigger. Anything that would remove a gate is a plan
   revision, not a round objective.
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
  cell; date; commit; and **the exact names of every already-failing
  test** as "known baseline failures" — a count or a category summary
  alone (e.g. "103 failures in test/rust-host") does not satisfy this
  requirement; the literal list is what later runs diff against. Every
  later full-proof run is judged against this list, triaged by bucket:
  - **patch-related** — blocks close.
  - **environmental-transient** — a flaky/order-dependent/session-leak
    failure that can pass on a clean rerun: rerun; blocks until
    reproducibly green.
  - **environmental-precondition** — fails for a structural reason no
    rerun fixes without an explicit setup step this worktree shape never
    ran (an uncompiled release binary, a missing service, an unset
    credential) — name the exact missing precondition per test; does not
    block close, but is never silently absorbed into "pre-existing"
    either. If the precondition is cheap to satisfy (a build/doctor step
    that finishes in the track's own time budget), satisfy it and get a
    real green result instead of recording this category — it exists for
    when that is not practical here, not as a default escape hatch.
    **Before labeling a failure this way, confirm it also fails the same
    way on the track/main baseline commit (or that no baseline commit
    exists yet for it)** — a test that only starts failing after this
    patch, for this same missing-precondition reason, is patch-related,
    not environmental-precondition; the label is for a precondition the
    patch did not create, never a way to wave off a real regression.
    Recorded on the baseline list, in its own bucket, same as any other
    named failure — never omitted from the exact-names list because it
    "doesn't block."
  - **pre-existing** — blocks unless already on the recorded baseline
    list.

  **The baseline list may only shrink** — a shrink is recorded as
  evidence; it never grows.
- **Merge cadence to main** — per cell, per gate, or final-only. This is a
  per-plan choice; there is no default.
- **Main→track sync point** (optional) — if the track pulls `main` back in
  at checkpoints, say where and how sync-induced failures are triaged. A
  sync point may only **replace** the recorded baseline with a new
  dated/commit-stamped record — never append to the old one.

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

**The one documented exception: tree identity.** A `--no-ff` merge with no
conflicts always produces an `integratedSha` distinct from `testedSha`, even
though its tree is byte-identical to the cell tip's — comparing raw SHAs is
the wrong test for "did anything actually change." Run
`git diff <testedSha> <integratedSha> -- .`; an empty result means the two
commits share a tree under the same toolchain/environment, so the
`testedSha` proof already covers `integratedSha`'s real content. Record
BOTH shas and `treeIdentical: true` in the checkpoint identity instead of
re-running. A non-empty diff always forces the real re-run — there is no
shortcut for actual content or environment drift (a toolchain upgrade, a
changed lockfile, a rebuilt prerequisite binary all count as drift even
when the tracked tree itself is unchanged; treat the tree-diff check as
necessary, not sufficient, when any of those moved since `testedSha`).

```text
## Evidence states for cell <id>

- coordination-accepted: testedSha=<sha>, command=<targeted command>, outcome=pass
- merged-to-track: integratedSha=<sha>
- checkpoint-verified: only if this gate ran the full proof command against
  integratedSha itself, or git diff testedSha integratedSha -- . is empty
  (treeIdentical: true) -- never inferred on a non-empty diff
```

## Checkpoint identity

Every checkpoint is a durable record tuple. Record it in the cell trace —
`docs/architect/agent-coordination/verification/<track>/<cell>.md`
(fgos-plan-loop `SKILL.md` §5 step 5):

```text
phase/cell id: <phase>/<cell>
command: <exact command executed>
baseline: <recorded baseline reference>
testedSha: <sha proof ran against pre-merge>
integratedSha: <sha proof ran against post-merge, or same as testedSha if no merge occurred yet>
treeIdentical: true only if `git diff testedSha integratedSha -- .` was empty
  AND the environment fingerprint (toolchain/lockfile/built prerequisites)
  was unchanged, and this checkpoint was certified from the pre-merge run
  instead of a real re-run at integratedSha (the non-inference rule's one
  documented exception -- an empty diff alone is necessary, not sufficient)
outcome: pass | fail (with triage: patch-related | environmental-transient | environmental-precondition | pre-existing)
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
cell worktree, compare against the recorded baseline, triage every new
failure as patch-related / environmental-transient / environmental-precondition / pre-existing, and record the
outcome before close. If `integratedSha` differs from `testedSha`, re-run
against `integratedSha` too — unless the tree-identity exception above
applies, in which case record `treeIdentical: true` instead.

**Mechanical-gate rule:** regardless of what the Product Gates marker says,
a cell is a full-suite gate if its diff touches any of: dispatch/self-host
hooks, session/replay/schema core, shared invariants, migrations,
test-harness foundations, or `package.json` scripts — for example, in this
repo, `src/runner/dispatch/**`, `src/verbs/coordination/**`, or
`package.json` itself. The Lead determines whether a mechanical trigger
fired for a given diff and records that determination in the cell trace
(`docs/architect/agent-coordination/verification/<track>/<cell>.md`) with
the matching path(s) that fired it — never left implicit.

## Per-phase `## Verification`

Each phase file's own `## Verification` section names **targeted commands
only** — the smallest set that actually exercises the contract this phase
changes. The full proof command appears in a phase file's `## Verification`
only when that phase is itself a gate (Product Gates marker or the
mechanical-gate rule above fired).

````text
## Verification

```sh
<targeted command(s) for this phase's contract only>
```
````

## Escalation authority & scope

The coding-worker behavioural rule for proof-gap findings — advisory-only
reporting, no unilateral run expansion, sole Lead escalation authority — is
the single source of truth in
[Coding verification discipline](#coding-verification-discipline); it is
not restated here. This section records only the authoring-side artefacts:
the disposition template, the trace values, and the Lead-authority
statement below.

The Lead holds sole authority to decide `accepted` or to provide an
evidence-backed `rejected`. A proof-gap finding admits exactly two
dispositions — `accepted`, or evidence-backed `rejected`; **`deferred` is
not a legal disposition for a proof-gap finding.** If a cell hits the
fix-round cap (3 rounds) with an open proof-gap finding, the disposition is
forced to `accepted -> Proof: escalated-to-full` for that cell — never a
silent close.

An accepted escalation upgrades the proof requirement for **the current
cell only** (`Proof: escalated-to-full`). It does not create a permanent
Product Gate across future cells unless the plan is explicitly updated to
add one.

```text
Finding: proof insufficient — targeted set does not cover <contract> (severity: <level>)
Lead disposition: accepted -> Proof: escalated-to-full for cell <id> only
             | rejected -> <evidence-backed rationale>
             (deferred is not legal for a proof-gap finding; hitting the
             fix-round cap (3 rounds) with this finding still open forces
             accepted -> Proof: escalated-to-full)
```

## Cell trace format

Every cell trace
(`docs/architect/agent-coordination/verification/<track>/<cell>.md`)
records:

```text
Proof: targeted | full-suite-gate | escalated-to-full
phase/cell id: <phase>/<cell>
command: <exact command>
baseline: <recorded baseline reference>
testedSha: <sha>
integratedSha: <sha>
treeIdentical: true only if git diff testedSha integratedSha -- . was empty
  AND the environment fingerprint (toolchain/lockfile/built prerequisites)
  was unchanged, and this checkpoint was certified from the pre-merge run
outcome: <pass|fail + triage if applicable>
```

## Lead checklist

- Open cell: assign roster, state this cell's targeted `## Verification`.
- Close cell: re-run the phase's stated `## Verification`; disposition any
  Reviewer/Red-Team proof-gap finding (`accepted` or evidence-backed
  `rejected`) before close.
- Gate full proof + triage: at a `**Full-suite gate.**` phase or a
  mechanical-gate trigger, run the full proof command, compare to baseline,
  triage every new failure (patch-related / environmental-transient / environmental-precondition / pre-existing).
- Track integration merge: merge the cell branch per the plan's recorded
  merge cadence, producing `integratedSha`.
- Post-merge gate execution when `testedSha != integratedSha`: re-run the
  gate's full proof command against `integratedSha` before certifying
  `checkpoint-verified` — never infer it from the pre-merge run, unless
  `git diff testedSha integratedSha -- .` is empty AND the environment
  fingerprint is unchanged (the non-inference rule's one documented
  exception, above), in which case record `treeIdentical: true` instead.
- Final close: run the full proof command on the integrated track branch
  before the last merge to main; missing proof blocks close.

## Coding verification discipline

The coding-worker side of this contract — what a doer/fixer/reviewer/
red-team actually does with the verification a unit declares — is the
single source of truth in
[`domains/coding/instructions/verification-discipline.md`](../../domains/coding/instructions/verification-discipline.md).
Read it there; it is not repeated in this document.
