# Lane prompts

Each lane is a read-only subagent. Give every lane the same header, then its
own body. Fill `<...>` from the repository and the user's request; never send
the full conversation.

## Shared header

```text
Working directory: <repo root>. Timezone <tz>. Answer in <user language>,
keeping English technical terms.
READ-ONLY: do not modify any file.

Context: we are auditing this repository's agent instruction surface and its
enforcement. Symptom to steer by: <user focus, or "general health">.
Design principles the owner holds (judge the rules against these):
<the owner's principles, or "none stated: use the repository's own laws/rules">.

Mechanical scan output (from instruction-audit.mjs):
<plain scan output>

Cite file:line or commit hashes for every claim. Max ~900 words.
End with: Status: DONE | DONE_WITH_CONCERNS | BLOCKED, and a one-line Summary.
```

## Lane 1: Instruction surface

```text
Audit what an agent actually loads when it writes code here. Read the
always-loaded files from the scan, plus the plan/implement/worker
instructions an agent receives on the code-writing path (skills, task specs,
worker contracts, nested AGENTS.md). Note any uncommitted changes to these
files and what they add.

Answer:
- Which owner principles / repository laws are stated, where, and how
  strongly (MUST with a check, MUST without a check, prose)? Which are
  missing entirely from what the writer reads?
- Projection gaps: a rule exists in a source doc but the always-loaded
  summary of it is missing, partial, or stale. Find the source of each
  summary (hand-written file, generator) and when it diverged (git log -S).
- Why stated rules may fail: total size and position, rules present only at
  plan time and absent at implement time or in the worker contract, the
  surface itself duplicated, contradictions between rules, philosophy with no
  executable action or observable output.
- Does the implement step force a "search for an existing mechanism before
  creating a new module/function" step with written output? Quote it.
```

## Lane 2: Enforcement surface

```text
Inventory every mechanical check and what it really checks: agent hooks
(.claude/settings.json and settings.local.json, plugin hooks.json, other
runtimes' hook files), git hooks and how they are wired, package scripts,
lint configs, architecture or import-boundary tests, CI workflows, doctor or
health checks, Rust/Go/etc. lints and crate/module boundary checks.

Answer:
- Table: mechanism | trigger | what it actually checks | does it cover
  duplication / layering / single-owner / the user's focus?
- Gaps: which principles and rules have zero mechanical check. Is any
  architecture manifest enforced or advisory?
- Hook hygiene beyond the scan: who writes each hook entry (installer vs hand
  edit), formats that an installer will not recognize on its next merge, hooks
  that block versus only remind, gates that exist but are disabled.
- Feasibility: which existing infrastructure a new check could hang on
  (quote file:line), and what would need a new dependency.
```

## Lane 3: Forensics

```text
Find concrete cases of duplicated code, parallel implementations of the same
mechanism ("second doors"), and migrations that left the old path alive.
Start from any cases the user or earlier reports name, then find 3-5 more:
the same function name defined in several modules, the same low-level
primitive (process/filesystem/env/path resolution/atomic write/polling)
used directly in many places, near-identical helpers.

For each case: files and lines, the commit that introduced the second copy
(git log -S / --follow), its message and linked plan or ticket, and whether
that plan had a reuse / prior-art section. Classify the root cause:
(a) did not search, (b) searched but the existing code had the wrong shape or
layer, (c) parallel work built the same thing, (d) migration without retiring
the old path, (e) the rule was absent where the writer works, (f) a check or
guard pushed the copy (say which), (g) other.

Return: a table of up to 8 cases, the root-cause frequency, and the three
interventions that would have prevented the most cases. Also correct any
claim in earlier reports that the evidence does not support.
```

## Lane 4: External practice (optional)

```text
Research current guidance (cite URLs, fetch to verify, mark unverified) for
making coding agents follow repository rules, focused on: <symptom>.
Cover instruction design (length, placement, path-scoped and nested rules,
imperative checklists), hook-based gates in the runtimes this repository uses,
fitness-function tools for its languages (duplicate detection, import
boundaries, dead code), and workflow patterns (mandatory reuse search with
written output, capability-owner registries, retirement rules for
replacements). Also list existing audit/lint tools for agent instruction
files and what each covers, so the report can reuse instead of rebuild.
Return ranked recommendations marked high or low leverage.
```
