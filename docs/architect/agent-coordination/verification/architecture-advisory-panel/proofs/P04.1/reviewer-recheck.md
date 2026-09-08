# P04.1 Reviewer Recheck — Fix Round 1

Rechecked against source at `ba1c68d5` (content) + `d398dacf` (report),
not against the Doer's report. Scope: my own 16 findings from
`reviewer-findings.json` / `reviewer-report.md`.

**Verdict: 11/16 fixed, 5/16 not fixed, 0/16 partial.** Every fix that
was made is real and verified from source — several are better than what
I asked for. The gap is coverage, not quality: my five LOW findings
(R12-R16) never entered the Doer's disposition list at all, while the
report closes with "No item was rejected or deferred — all 17 were
real," which reads as complete coverage of both reviews.

## The count discrepancy, first

The fix round's "17 findings" is **not** my 16 plus Red-Team's. The
disposition list contains 17 items covering my R1, R2, R3, R4/R5 (one
item), R6, R7, R8, R9, R10, R11 — 11 of my findings — plus Red-Team's
A1, A2b, A2c, A3b, A5, A6b, A8a, A8b, A8c. My R12, R13, R14, R15 and
R16 appear nowhere in the report: not accepted, not rejected, not
deferred, not mentioned.

All five are LOW and none blocks. But they should be dispositioned
explicitly rather than dropped silently, and the report's closing line
should not claim a completeness it does not have.

## Fixed — verified from source (11)

**R1 (HIGH) — fixed, and the WARNING is strong.** SKILL.md:166-194 now
opens the Executor Roster with a blockquoted WARNING carrying: all three
executor names with the live `configured:false` result; the exact
fallback expression and file; the exact live mutating invocation string;
the P00.1 `claude-reviewer` precedent; the explicit statement that
forwarding the roster through `fgos coordination run`/the group-thinking
gate "would run all 9 advisory roles on one unconfined, git-write-capable
provider, silently, with no error anywhere"; the direct-subprocess
workaround P01.2/P01.3 actually used; and an instruction to re-run the
`decide` check every session. `tsk-1o4` is Known Gaps entry #1
(SKILL.md:786-791).

Re-verified the WARNING's own factual claims live rather than trusting
them:

```
claude-bwrap     {"mechanism":"out-of-process","configured":false}
agy-bwrap        {"mechanism":"out-of-process","configured":false}
codex-readonly   {"mechanism":"out-of-process","configured":false}
```

`tsk-1o4` is a real filed work item (`fgos show tsk-1o4` → kind `bug`,
status `todo`, description matching P02.1 Table 4 BL2 verbatim), not an
invented id.

One residual, not a re-open: "Never Reimplements The Kernel"
(SKILL.md:85-93) still presents `runGroupThinkingRequest` plus the
`actors[]` per-role override shape as the dispatch path with no pointer
to the WARNING 80 lines below it. A fresh agent reading top-down meets
the dispatch instruction before the caveat. The WARNING itself names the
gate explicitly, so the information is present and unmissable once
reached — a one-line forward reference from line 93 would close it.

**R2 — fixed, and better than requested.** SKILL.md:529-571 now runs
three ordered tests, with #3 stated as "Material *now*, not material in
the abstract ... a gap can be genuinely user-exclusive AND still not
block Phase 5," and the Phase-9 reservation reasoning spelled out.
"Delete it" is gone, replaced by "**A gap that fails test 3 is never
deleted — it is carried forward as an explicit named default.**" The
P01.3 citation is now correct and checkable: three of seven gaps
user-exclusive, all three still "not asked now," closing with the
source's own verbatim line. Confirmed against
`proofs/P01.3/decision-request.md` — exactly 3 rows are marked
user-exclusive.

**R3 — fixed, precisely.** SKILL.md:233-251 now states that
`ACTOR_ALLOWED_KEYS` (`src/verbs/coordination/schema.mjs:133`) *does*
accept a `model` key, and that the real refusal is
`assertModelSupportedForKind` (`src/verbs/coordination/run.mjs:166-175`),
scoped to `kind:"declared-protocol"`, with the PolicyPatch reason. Both
citations verified: schema.mjs:133 is the whitelist line; run.mjs:166-175
is exactly the function's span. The added instruction — "Cite that
function, not the request whitelist, if asked to verify this rule" —
directly inoculates against the mistake I found.

**R4 — fixed.** SKILL.md:73 now reads "P01.2 Turn 2's 'làm luôn cũng
được'".

**R5 — fixed.** SKILL.md:70-78 now frames it as classification mattering
more than brevity, and quotes `dialogue/2-impact.md` verbatim
("permission, not instruction" ... "I don't want the panel recording
this as 'the person decided to build.'"), closing with "A skill that
treated that phrase as a decision would have misclassified it." The
inversion is gone.

**R6 — fixed.** SKILL.md:581-591 now credits the **coordinator** with the
independent re-verification and states plainly that "the critic's actual
artifact only states what would settle each attack" — which matches
`proofs/P01.3/critiques/architecture-critic.md`.

**R7 — fixed, both halves, and the doctrine edit is genuinely surgical.**
SKILL.md:204-214 states the fix as proven with the ordering rule
(`--tmpfs /tmp` before re-pinning `--ro-bind PROJECT_ROOT` / `--bind
EVIDENCE_DIR`, mounts apply in argument order), 13 live uses, P02.1 B7
cited. The stale bwrap entry is gone from Known Gaps.
`git show ba1c68d5 -- docs/.../architecture-advisory-role-doctrine.md`
is 9 insertions / 7 deletions in one hunk at line ~1585, replacing only
the "Carry-forward runnability limitation" paragraph. The adjacent
"Diversity is a hedge" paragraph and the rest of the 1601-line file are
untouched.

**R8 — fixed, and I re-tested my exact original failure mode.** The link
is now `../../../core/coordination-protocols/architecture-advisory-panel-v1.yaml`
(SKILL.md:25), matching the `fgos-code-panel` depth convention. Resolved
every relative link from each projection root:

```
core/skills:         13 links, 0 missing
.agents/skills:      13 links, 0 missing
plugins/fgOS/skills: 13 links, 12 missing
```

The `.agents/skills/` breakage — the one the `.claude/` wrapper sends
readers into — is gone. The `plugins/fgOS` breakage is unchanged and
remains pre-existing, shared identically with the `fgos-code-panel`
precedent; still not charged to this cell.

**R9 — fixed.** A `Persona` column is in the roster table
(SKILL.md:216-226), one per role, plus a note (SKILL.md:228-231) that
persona is free-form prose, not a closed vocabulary.

**R10 — fixed.** SKILL.md:253-259 restores the end-of-session diversity
audit, including the "nothing distinguishable this time" honest answer
and the "appearance of independence" framing.

**R11 — fixed, well.** Known Gaps (SKILL.md:827-839) names B12 and B13
concretely, ties them to the two `agy-bwrap` bindings by role, and calls
out the red-team-specific hazard — that trusting the wrapper "can
manufacture exactly the ceremonial-`APPROVE`-with-nothing-checked
appearance its own Avoid list warns against."

## Not fixed (5) — all LOW, none dispositioned

- **R12** — third-party/out-of-panel consultation convention (P02.1 B11,
  the shape of P01.3's only real dialogue turn). Zero hits for
  `kongming`/`out-of-panel`/`third-party`/`non-panel` in the skill; the
  Decision Dialogue table still has six verbs with no slot for it.
- **R13** — SKILL.md:29 still says "12 conformance cases".
  `grep -c "^test(" test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs`
  → **13**.
- **R14** — roster and phase tables still identify actors by role name
  (`lead-advisor`), never noting these map to the protocol's
  `<role>-actor` ids that an `actors[]` entry must carry. Zero hits for
  `-actor` in the skill. `run.mjs:395-400` hard-refuses a wrong id.
- **R15** — the specialist roster row (SKILL.md:226) still implies a
  binding set like the other eight. `authorizeSpecialistSlot` is
  mentioned at SKILL.md:99 and :800 but not in the row, so the row and
  the mechanism are still two facts a reader must join themselves.
- **R16** — the alternative shaper's Notice bullet still omits the
  doctrine's "solution classes, not variants" (buying vs. building,
  deleting vs. abstracting, changing who owns the code, changing the
  process). The only "solution class" string in the file is incidental
  prose in the roster's rationale column. Note: the Doer did add "a
  reframe still owes a candidate" to this packet's Reason bullet, but
  that closes Red-Team's A2b, a different doctrine item.

## New, small defects introduced by the fix round

- **N1 (low, hard correctness).** The WARNING cites
  `src/runner/dispatch/resolve.mjs:398` for the fallback. The real line
  is **399** (`const executor = byExecutor ?? (cfg && cfg.executor);`);
  line 398 is `: undefined;`. My own original finding carried the same
  off-by-one and the Doer copied it without re-deriving it. Worth
  correcting specifically because this WARNING's entire value is that a
  skeptical reader can check it in one command.
- **N2 (low, citation).** Doer report item 11 claims "16/16 links now
  resolve from `core/skills/`, 16/16 from `.agents/skills/`." The file
  has **13** relative links, not 16. Both projections do resolve 100%,
  so the fix is correct and the conclusion holds — only the number is
  invented. Same citation-drift class this track has caught repeatedly
  (P00.1 F4, P02.1's own drift); flagging it so it does not become a
  number a later cell cites.
- **N3 (nit).** SKILL.md:556-558 says three P01.3 gaps are marked
  user-exclusive "in the source's own words ('Yes — only the person can
  say')". The count of three is right; two use that exact phrase and the
  third says "only the person has this". Defensible as illustrative.

## New sections spot-checked (not previously reviewed)

These arrived from Red-Team's findings, but they make claims about the
graph, so I verified rather than assumed:

- The reconciliation paragraph's claim that "the lead advisor's only
  four operations are `interpret-request`, `explain-recommendation`,
  `revise-explanation`, `close-dialogue`" — correct against
  `architecture-advisory-panel-v1.yaml`; those are exactly the four
  operations declaring `role: lead-advisor`. The Phase-4 topological
  argument (`phase-shaping` follows `phase-framing` with nothing in
  between) is also correct.
- The new "Driver Disposition" section's six values (`accepted`,
  `answered`, `mitigated`, `deferred`, `unresolved`,
  `invalidated-by-evidence`) match `architecture-advisory-artifact-templates.md:704-711`
  exactly, including which fields are required for which. Checked
  whether the kernel would refuse them: it will not — the request
  schema's `disposition` is deliberately open (`src/verbs/coordination/schema.mjs:364-368`,
  "Shape only, deliberately not a closed vocabulary", non-empty string
  ≤200 chars). So the section is doctrinally sourced and mechanically
  legal.

## Test runs

Focused coordination suite:

```
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination-*.test.mjs' \
  'test/verbs/coordination-*.test.mjs' \
  'test/cli/coordination.test.mjs' \
  'test/architecture.test.mjs'

ℹ tests 757
ℹ pass 757
ℹ fail 0
```

Projection/mirror suite:

```
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs

ℹ tests 39
ℹ pass 39
ℹ fail 0
```

Projections still byte-identical after the rebuild:

```
25dd6ed13df8da39052dd669ff07e32c  core/skills/fgos-architecture-panel/SKILL.md
25dd6ed13df8da39052dd669ff07e32c  .agents/skills/fgos-architecture-panel/SKILL.md
25dd6ed13df8da39052dd669ff07e32c  plugins/fgOS/skills/fgos-architecture-panel/SKILL.md
```

`.claude/skills/fgos-architecture-panel/SKILL.md` still 24 lines, thin
wrapper, frontmatter matching source. `ba1c68d5` touched 4 files only
(3 skill projections + the one doctrine paragraph); zero `src/` changes,
consistent with a prose-only fix round.

## Recommendation

Nothing here blocks. Suggested closing actions, all small:

1. Disposition R12-R16 explicitly — accept or reject with a reason. If
   rejected as not worth the prose, say so; the silent omission is the
   problem, not the decision.
2. Correct `resolve.mjs:398` → `:399` in the WARNING (N1).
3. Correct the doer report's "16/16 links" to 13 (N2).
4. Optional: one forward reference from SKILL.md:93 to the Executor
   Roster WARNING, so a top-down reader meets the caveat with the
   dispatch instruction rather than 80 lines later.

## Unresolved questions

None. The one judgment call I flagged last round (how R1 should close)
was answered correctly: documented as a live gap with a real filed work
item and a proven workaround, rather than papered over.

Status: DONE_WITH_CONCERNS
