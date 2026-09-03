---
framework: diataxis
mode: explanation
---
# Why doctor checks are documented as an open registry, not a fixed list

`docs/specs/distribution.md` used to describe `fgos doctor` in terms that
went stale the moment two other items shipped: `tsk-2qz` (doctor `--fix`)
and `tsk-2cs` (an extensible check/config-default/fix registry). tsk-1qm
closed that drift — not by writing a corrected snapshot, but by rewriting
the spec to describe the *mechanism* instead of a fixed enumeration.

## What was actually wrong

Two rules in `distribution.md` no longer matched real behavior:

- **RUL9** (`distribution.md:200`) said "doctor's checks never write
  anything, under any circumstance." False since `tsk-2qz`: `--fix`
  writes for real.
- **RUL11** (`distribution.md:210`) said "`doctor --fix` does not exist
  yet ... stays a Deferred Idea." False — it exists and runs.
- **Data Dictionary #7** listed exactly 6 named doctor checks. The real
  registry has 8 (`node-version-and-git`, `shell-integration-sourced`,
  `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`,
  `config-awareness`, `dependencies-installed`, `gate-bypass-configured`)
  — and the count is no longer fixed at all: any module can add one via
  `registerCheck`.

## Why the fix points at the mechanism, not a new snapshot

The tempting fix — replace "6 checks" with "8 checks" — would recreate
the exact same problem on the next `registerCheck` call. The locked
reasoning (`docs/history/close-distribution-spec-doctor-fix/CONTEXT.md`
D2) was explicit about this:

> Data Dictionary #7's row is rewritten to describe the registry
> mechanism (points at `src/setup/registrations.mjs`'s `registerCheck`),
> not a hardcoded enumeration of today's 8 checks. Hardcoding a list
> would immediately misrepresent the exact fact `tsk-2cs` shipped — the
> whole point of that item's own D1 was making this **not** a fixed
> list. A frozen 8-item enumeration is exactly the drift this closure
> item exists to fix; writing a new one would recreate the same problem
> on the next `registerCheck` call.

RUL9's rewrite (D3) is a narrowing, not a full reversal: the no-`--fix`
default path genuinely still writes nothing — confirmed live,
`bin/fgos.mjs`'s `doctor` case only calls `runFixes` when `flags.fix` is
truthy. The rule keeps its original guarantee for the default path and
adds the `--fix` exception explicitly, rather than being dropped.

RUL11's rewrite (D4) states plainly that `--fix` exists, runs a
registered-fix list, and that the list itself grows through the same
registry (`registerFix`) — the same "point at the mechanism, not a
frozen snapshot" shape as D2.

## Why both rules, not just the one named in the title

The item's own title only named RUL11, but both RUL9 and RUL11 were
superseded. This wasn't a scope guess — `tsk-2qz` had already delegated
it explicitly by id in its own locked decision
(`docs/history/doctor-fix-gate-bypass/CONTEXT.md` D2):

> Quyết định này ĐẢO RUL9 + RUL11 (docs/specs/distribution.md:200,210)
> ... tsk-1qm chịu trách nhiệm supersede chính thức trong spec.

## Real friction hit during closure

Even though this was a tiny single-file docs fix, the first verify
attempt failed: `goal-check failed on branch "fgw/tsk-1qm" (exit 2)`
before the second attempt passed. A one-file spec-drift closure still
needs the same real verify pass as any other change — no shortcut for
"it's just docs."
