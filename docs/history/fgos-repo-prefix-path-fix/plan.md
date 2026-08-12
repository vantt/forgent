# fgOS `repo/` path prefix fix — plan

## Mode

**Small.** Flag count: 0 of 10 (no auth, no authorization, no data model, no
audit/security, no external systems, no public-contract change, no
cross-platform concern, no existing covered behavior at risk — these paths
are uncovered prose strings, not code — no weak proof area, single domain).
16 files is more than "a couple," so this isn't `tiny`, but every occurrence
gets the exact same mechanical substitution with no per-file judgment calls,
so a phased `standard` plan would be theater, not honesty.

`fgos graph --json`: `tsk-3fb` appears in neither `criticalPath` nor the top
of `topUnblock` — no dependency ordering to resolve, no split candidate to
compare. One honest piece of work.

## Approach

**Chosen:** a single `sed`-driven find/replace across all 16 affected
`plugins/fgOS/skills/*/SKILL.md` files plus the 2 spec docs, swapping the
literal `${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs` for a shell parameter
expansion that reads an env var (per D1) with a standalone default:

```bash
${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs
```

`${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}` expands to `/<value>` when the
workshop sets `FGOS_NESTED_PREFIX` (e.g. to `repo`), and to nothing when
unset — giving `${CLAUDE_PROJECT_DIR}/bin/fgos.mjs` in the standalone
default, exactly D1's locked shape. `FGOS_NESTED_PREFIX` is the concrete name
CONTEXT.md's "Outstanding questions" left open — chosen here because it
names what the variable holds (the nested path segment), not the layout
that consumes it.

**Rejected:**
- **Probe both paths at runtime and pick whichever file exists** — was D1's
  first option, not the one locked. Would require replacing a one-line
  `node <path>` instruction with a small multi-line existence-check script
  in all 16 files — more surface for a copy-paste mistake than the env-var
  form, for the same outcome.
- **A shared helper script the 16 files call instead of inlining the
  expansion** — rejected as premature: the expansion is one line, already
  DRY at the string level (identical everywhere), and 16 near-identical
  Markdown instruction files already tolerate this level of repetition
  (verified by reading 3 of them side by side — `list`, `submit`, `pick` —
  the differing part is only the verb's own argv tail, never the path
  prefix logic).

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| 16 `SKILL.md` path lines | Low — prose instructions, not executed code; a typo is caught by the verify grep below, not a runtime crash | `fgos-coding-validating`: grep confirms zero remaining `repo/bin/fgos.mjs` occurrences in the 16 files |
| 2 spec doc lines (`fgos-plugin.md:167-168`, `distribution.md`) | Low — documentation only | Same grep, scoped to the 2 files |
| Standalone default behavior | Medium — this is the behavior every unset-env-var session hits today, so a wrong default breaks every plugin verb call again | Manual check: run one wrapped verb (`node ${CLAUDE_PROJECT_DIR}/bin/fgos.mjs list --json`, no `FGOS_NESTED_PREFIX` set) from this repo's own root and confirm it succeeds |

**Files touched** (16 skill files + 1 spec line, 23 lines total —
`docs/backlog.md` explicitly excluded per D2):

```
plugins/fgOS/skills/{answer,ask,check,conflicts,cook,discover,goal,graph,
list,move,pick,ready,return,rollup,stale,submit}/SKILL.md  (22 lines)
docs/specs/fgos-plugin.md:167  (1 line — the runnable invocation snippet)
```

**D3 (validating correction, narrows D2):** `fgos-plugin.md:168` and
`distribution.md:287` do NOT contain the `${CLAUDE_PROJECT_DIR}/repo/...`
runnable pattern — both are bare file-listing bullets (`repo/bin/fgos.mjs —
<description>`) sharing each doc's page-wide "prefix every path with
`repo/`" listing convention (verified: `distribution.md` alone has dozens of
sibling bullets — `repo/scripts/...`, `repo/src/...` — using the identical
notation for unrelated files). Editing only these two would single them out
inconsistently from every sibling bullet in the same doc, and edits nothing
a shell would ever actually run. Excluded from execution scope; D2's
underlying concern (the runnable template shouldn't perpetuate the wrong
path) is fully addressed by fixing line 167 alone.

Verified current scope: `grep -rn "repo/bin/fgos.mjs" plugins/fgOS/skills/*/SKILL.md | wc -l` → 22; `docs/specs/fgos-plugin.md:167` → 1 (the only in-scope spec line).

## Shape

Single-pass edit, scaled to `small`:

1. Run the substitution across all 16 `SKILL.md` files with one `sed -i`
   invocation (same old/new string, every file) rather than 16 manual
   `Edit` calls — mechanical, no per-file judgment, lower error surface than
   hand-editing each.
2. Manually adjust the 2 spec doc lines (`fgos-plugin.md:167-168`,
   `distribution.md`) the same substitution, by hand — 2 lines, `sed` across
   mixed doc/skill files isn't worth the added complexity for 2 lines.
3. Leave `docs/backlog.md` untouched (D2).
4. Cases worth proving (matching `small`'s depth — no boundary/concurrency
   sketch needed for a doc-string substitution):
   - Zero remaining literal `repo/bin/fgos.mjs` in the 16 skill files + 2
     specs.
   - The standalone default (`FGOS_NESTED_PREFIX` unset) resolves to
     `${CLAUDE_PROJECT_DIR}/bin/fgos.mjs` and that path is genuinely
     runnable from this repo's own root — this is the regression this whole
     item exists to fix, so it is the one case that must be checked by
     actually running a wrapped verb, not just grepped.

## Execution

Execute's own mechanical build/verify/return path already covers this
(per the locked "leave execution alone" convention) — this plan names one
verify command, already attached to the item. It checks the exact
`${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs` runnable pattern only (fixed-string
match), not a bare `repo/` substring — a plain-substring check would
false-FAIL on `fgos-plugin.md:168`'s legitimate, untouched listing bullet
(D3):

```
grep -rlF "${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs" plugins/fgOS/skills/*/SKILL.md docs/specs/fgos-plugin.md | wc -l | grep -q "^0$" && echo "PASS: exact runnable repo/ pattern removed from 16 skill files + fgos-plugin.md:167 (line 168 bare listing bullet + distribution.md intentionally untouched per D3)"
```

## Split decision

No split. One honest piece of work — every touched file gets the identical
substitution, there is no independently-workable sub-piece to carve out, and
`fgos graph --what-if` has nothing to compare (no candidate ordering exists
for a single mechanical pass).
