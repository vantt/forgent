# Plan — tsk-65q: gate-bypass Gate-section check crashes on global install

Mode: **high-risk**

Flag count (per `fgos-routing`'s Mode-gate, applied directly — this item
went `discovery: clear` straight to `planning`, skipping `exploring`, so no
`CONTEXT.md`/D-ID exists; every claim below cites `RESEARCH.md` instead):

- **audit/security** (hard-gate flag) — the code path touched
  (`gate-bypass.mjs`'s `canAutoApprove`/`canAutoApproveMergedGate`) decides
  whether a work item's gate is auto-approved without a human. The bug
  today fails **closed** by accident on a global install (crash → treated
  as `false` → always asks a human, per the Gate section's own "treat
  anything other than exactly `true` as `false`" rule). The fix makes the
  check actually **run** for that population — a real behavior change:
  global-install users who previously always got asked will, once this
  fix lands, get real auto-approve/deny answers per their configured
  bypass level. That is worth the hard-gate flag on its own.
- **existing covered behavior** — `test/state/gate-bypass.test.mjs` already
  covers `canAutoApprove`'s own logic; this fix must not regress it.

Per the routing table, a hard-gate flag alone is enough for `high-risk`
regardless of total count — recorded honestly rather than rounded down to
`standard` to move faster.

## Approach

**Root cause and precedent** (RESEARCH.md Round 1, 2026-08-13): the
Gate-section check in `fgos-coding-exploring/SKILL.md:327-341` and
`fgos-coding-validating/SKILL.md:262-298` reimplements its own two-tier
module resolver (cwd-relative, then the calling repo's own git root) —
neither tier ever looks at where the `fgos` package itself is installed,
so both fail for a pure global-install consumer. `bin/fgos.mjs:15-32`
already has a working, in-repo precedent: static relative imports resolve
against the *importing file's own location* (`import.meta.url`), not cwd,
so the installed CLI already resolves these same modules correctly from
any install shape today, with zero special-casing.

**Chosen path:** add a new read-only CLI verb that wraps
`canAutoApprove`/`canAutoApproveMergedGate` inside `bin/fgos.mjs` itself,
and replace both skill files' inline `node -e` resolver with a call to
that verb. This inherits `bin/fgos.mjs`'s already-correct resolution for
free — no new resolution logic to write or prove, only a new thin verb
around functions already imported and already tested.

**Rejected alternative:** teach the skill-embedded resolver a third tier
(walk up from `process.execPath`, or `import.meta.resolve('forgent/...')`
relative to the `node -e` script). Rejected because it would duplicate
resolution logic `bin/fgos.mjs` already has correct, in two more places
that would need the same proof burden all over again — the whole point of
routing through the CLI is that Node's own module resolution does the
work once, in the file that ships with the package.

**Files touched:**

- `bin/fgos.mjs` — import `canAutoApprove`, `canAutoApproveMergedGate`
  from `../src/state/gate-bypass.mjs` (already imports
  `readGateBypassLevel` from the same file, line 25); add a new `case`
  in the verb dispatch, request-class read-only (same class as the
  existing `case 'gate-bypass':`, line 2221).
- `.claude/skills/fgos-coding-exploring/SKILL.md` — replace the inline
  `node -e` block (lines 323-341) with a call to the new verb.
- `.claude/skills/fgos-coding-validating/SKILL.md` — same replacement
  (lines ~258-298, the mirrored block for `canAutoApproveMergedGate`).
- `.agents/skills/fgos-coding-exploring/SKILL.md`,
  `.agents/skills/fgos-coding-validating/SKILL.md`,
  `plugins/fgOS/skills/fgos-coding-exploring/SKILL.md`,
  `plugins/fgOS/skills/fgos-coding-validating/SKILL.md` — the same edit,
  copied forward (never edited independently — `test/skills/
  fgos-mirror.test.mjs` already asserts all three legs stay byte-identical
  to `.claude/skills/fgos-*`, per the existing convention `docs/specs/
  distribution.md` Data Dictionary #4b already documents for this
  3-way mirror).
- `test/cli/fgos-gate-approve.test.mjs` — new test(s), see Proof points.

**Order:** single piece, no sequencing needed across files — `bin/fgos.mjs`
gets the new verb first (it is what the skill edits call), then both
`.claude/skills/*` files, then the two mirror legs are copied forward
last (so a diff of the mirror-sync commit is exactly "copy of what already
landed", nothing new to review). `fgos graph --what-if` was not run — this
is a single non-split piece, not a multi-piece ordering decision.

**Impact-analysis posture:** `fgos tool query --capability impact-analysis
--status present` → `full` (gitnexus present, 2026-08-13). Per AGENTS.md's
Always-Do, `impact({target: "canAutoApprove", direction: "upstream"})` and
the same for `canAutoApproveMergedGate` must be run at `fgos-coding-implement`
before editing `bin/fgos.mjs` — not run here, since planning does not edit
code; recorded here so implement doesn't skip it.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| New verb's answer for `canAutoApprove`/`canAutoApproveMergedGate` | Medium — wrong wiring could silently flip an auto-approve answer, the exact stake the audit/security flag names | New test in `test/cli/fgos-gate-approve.test.mjs`: invoke the new verb from a **cwd that has no local `src/state/*.mjs`** (a scratch tmp dir, simulating the global-install consumer's repo) and assert it returns the same answer `canAutoApprove` would give directly — this is the regression the whole item exists to fix, so the test must actually simulate the failure condition (RESEARCH.md's confirmed root cause), not just call the verb from inside forgentX where the old cwd-relative tier already worked by accident. |
| Skill-file edits (prose, not code) | Low — behavior for existing dev-checkout users must not change (they already worked); only the previously-broken global-install path is new behavior | `npm test` (full suite, catches any skill-prose test harness regression) + the POSITIVE/NEGATIVE grep pair below (`docs/how-to/write-verify-for-a-skill-prose-change.md`) |
| 3-way skill mirror sync | Low, but easy to forget one leg | `test/skills/fgos-mirror.test.mjs` already asserts byte-identity across all three legs — must stay green, no new test needed |

## Verify

```
npm test \
  && node --test test/state/gate-bypass.test.mjs test/cli/fgos-gate-approve.test.mjs \
  && grep -q 'gate-check' .claude/skills/fgos-coding-exploring/SKILL.md \
  && grep -q 'gate-check' .claude/skills/fgos-coding-validating/SKILL.md \
  && grep -q 'gate-check' plugins/fgOS/skills/fgos-coding-exploring/SKILL.md \
  && grep -q 'gate-check' plugins/fgOS/skills/fgos-coding-validating/SKILL.md \
  && ! rg --hidden -l 'function resolveModule' --glob '!.claude/worktrees/**' --glob '!node_modules' --glob '!.git' .
```

(`gate-check` is this plan's proposed verb name — `fgos-coding-implement` may
land on a different final name; the verify's POSITIVE grep must be updated
to match whatever name is actually implemented, same as any other plan
detail that gets refined once real code exists.)

## Split decision

No split. This is one honest piece of work: one new CLI verb plus a
mechanical replacement of the same ad hoc resolver block in two (times
three mirror legs) already-identical locations. `fgos-coding-validating`
should read this as `pass-through`.

## Outstanding questions

None
