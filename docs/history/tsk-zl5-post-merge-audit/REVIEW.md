# REVIEW — post-merge audit of tsk-1y6 (210a4a61) and tsk-3xog (f8cf7e36)

Scope: verify the CODE matches the 9 locked decisions in
`docs/history/iron-law-gate-human-ux/CONTEXT.md` and the tsk-3xog scope
already locked in its own item description — never re-litigating either.
All evidence below is direct file/diff reads and `npm test`; GitNexus stays
`impact-analysis: degraded` for this entire pass (`.gitnexus/meta.json`
`lastCommit: 7bb3231`, current HEAD `36e0602f`).

## Summary

Every checked claim holds. Two genuine, real findings surfaced along the
way, neither a defect in what tsk-1y6/tsk-3xog actually built:

1. **Post-merge drift (informational, not a defect).** A later item
   (`tsk-49i`, cited by name in `src/runner/iron-law-gate.mjs`'s own header
   comment) refactored the Iron Law gate's three call sites out of
   `bin/fgos.mjs` into `src/runner/iron-law-gate.mjs` +
   `src/verbs/merge/{approve,sync-root,merge,iron-law-level}.mjs`. The
   task's own `bin/fgos.mjs` line-number anchors (~2487/3494/4100) are
   stale; `docs/specs/runner.md:1071`'s architecture-manifest line still
   claims the call sites live "in `bin/fgos.mjs`", which is also now
   stale. Every locked decision (D1-D9) still holds in the new location —
   confirmed directly below — so this is a housekeeping gap in the spec's
   manifest line, not a regression in tsk-1y6's own work.
2. **Real false-negative gap in the heading-drift guard**, demonstrated by
   an actual heading already in this corpus (see tsk-3xog section below).
   Currently harmless in that one file, but the underlying gap is real.

## tsk-1y6-1 — Iron Law gate: trunk-only boundary + ironLaw.level ask/warn

**A1b (discriminator separateness).** ## Verdict: CONFIRMED, holds today,
in a relocated form.

At the original merge (`git diff f8cf7e36...210a4a61 -- bin/fgos.mjs`):
- merge-next pre-check: `if (resolveRoot(mergeView, candidateId) !== candidateId) return false;`
- `approve`: gated on `rootIdForIronLaw === id` (computed via `resolveRoot`)
- `sync-root`: gated on `if (!item.parent) { ... }`, with an explicit code
  comment citing `plan.md A1b` by name and explaining the divergence: this
  verb lands on the DIRECT parent, while `resolveRoot` climbs to the top
  of the lineage — on an item whose parent id is absent from the `view`,
  `resolveRoot` would return the item itself and wrongly trip the gate on
  a merge that never nears trunk. This exact reasoning is also written
  into `docs/specs/runner.md`'s RUL37 and independently confirmed by a
  real test: `test/cli/fgos-iron-law-gate.test.mjs` includes "`sync-root`
  discriminates on `!item.parent`, NOT `resolveRoot`: a root whose parent
  id is absent from the view still targets `fgw/<parent>`" — a dedicated
  regression test for exactly this edge case.

Post-`tsk-49i` (current `main`): `approve.mjs:282` passes `{ view }`
(→ `resolveRoot(view, item.id) === item.id` inside the shared
`ironLawDiffOpts`, `src/runner/iron-law-gate.mjs:35-42`); `sync-root.mjs:65`
passes `{ trunk: item.parent ? targetBranch : null }` — the literal
`!item.parent` ternary, still expressed at the call site itself, not
absorbed into the shared helper. **The two discriminator EXPRESSIONS are
still separate and call-site-local.** What `tsk-49i` shared was only the
git-mechanics preamble (diff resolution, branch-exists check) that
`iron-law-gate.mjs`'s own header comment says was "copy-pasted verbatim at
three call sites" — never the trunk-boundary boolean itself. A1b's actual
substance holds.

**D7 (fail-closed).** ## Verdict: CONFIRMED.
`src/verbs/merge/iron-law-level.mjs:19-22`:
`IRON_LAW_LEVELS.includes(level) ? level : DEFAULT_IRON_LAW_LEVEL`;
`src/setup/registrations.mjs:1096-1097`: `IRON_LAW_LEVELS = ['ask','warn']`,
`DEFAULT_IRON_LAW_LEVEL = 'ask'`. A missing key, malformed file, or
unrecognized value all fall through to `'ask'`. Confirmed identical at the
original merge (`readIronLawLevel` in the `bin/fgos.mjs` diff).

**D8 (kind:'engine' write path).** ## Verdict: CONFIRMED.
`src/verbs/merge/iron-law-level.mjs:34-41` (`recordIronLawSkip`) calls
`addDecision(dir, { ..., kind: 'engine' })` in-process — never shells out
to `fgos decision`. The function's own comment states the exact reason the
task asked to check: `fgos decision` has no `--kind` flag and would fall
back to `addDecision`'s own `kind: 'design'` default. Identical at the
original merge.

**D6 (classifyIronLaw untouched).** ## Verdict: CONFIRMED.
`git diff f8cf7e36...210a4a61 -- src/evolve/iron-law.mjs` is empty — zero
lines changed. Current file (`src/evolve/iron-law.mjs:61`) still exports
`classifyIronLaw({ filesChanged, description } = {})` returning
`{required, matchedFlags, matchedModules}`, byte-for-byte the signature
`docs/decisions/0032-....md` itself claims ("Không đụng
`src/evolve/iron-law.mjs`").

**Failing-test-first claim (5-fail/5-pass split).** ## Verdict: CONFIRMED.
All 10 test names in `docs/history/tsk-1y6-1/iron-law-evidence.md`'s
transcript match verbatim against the real
`test/cli/fgos-iron-law-gate.test.mjs` (`grep -n "^test("`, 10/10 exact
matches, including the long D1/A1b/D7/D8-citing names). The item's own
recorded `verify` (`npm test && grep -q 'ironLaw' ... && node --test
test/cli/fgos-iron-law-gate.test.mjs`) reports `3348 tests / 3343 pass / 0
fail` in the evidence file — consistent with a real run.

## tsk-1y6-2 — `/fgOS:approve` skill

## Verdict: CONFIRMED. `plugins/fgOS/skills/approve/SKILL.md` step 4
("Present the blast radius before asking anything (D9)") explicitly comes
before step 5 ("Ask once ... Do not ask before step 4 has printed"). Step
4's table covers both cases: `approve` on a leaf (target `fgw/<root-id>`,
"nothing reaches the trunk yet") and `approve` on a root (target is trunk,
"this root *and* every descendant already absorbed"), plus `sync-root`'s
own row. The Iron Law section's rule 4 states verbatim: "**Never add
`--acknowledge-iron-law` on this skill's own authority**, and never add it
because a previous item in the same session got it" — also repeated in
the Red flags list.

## tsk-1y6-3 — merge-loop/merge-next don't stall on one Iron Law hold

## Verdict: CONFIRMED. `grep -c "stop the loop and report"` returns 0 hits
in both `plugins/fgOS/skills/merge-loop/SKILL.md` and
`plugins/fgOS/skills/merge-next/SKILL.md` — the phrase is fully gone, not
supplemented. `merge-loop/SKILL.md:131-133`: "The held item stays exactly
`awaiting-approval`. Never `fgos ask` it, never move it to
`awaiting-human`, never move it at all." Both files point a human at
`/fgOS:approve <id>` (`merge-loop/SKILL.md:418`, `merge-next/SKILL.md:100`)
rather than a hand-typed command.

## tsk-1y6-4 — spec/decision record update

## Verdict: CONFIRMED. `docs/decisions/0032-....md` explicitly states it
supersedes "đúng mệnh đề 'chặn cứng, luôn luôn, ở mọi ranh giới merge'" of
`D16/D17 self-improve-loop`, and has its own section explaining why
`supersedes:` frontmatter is empty (D16/D17 are inline prose decisions in
`docs/specs/runner.md`, not a numbered record with an id to point at —
`scripts/check-decision-supersession.mjs`'s reverse-pointer convention
structurally doesn't apply). Indexed at `docs/decisions/0000-index.md:71`.
`node scripts/check-decision-citation-drift.mjs` reports 3 findings, all
pre-existing and unrelated to 0032 (citing superseded decision `0002`
elsewhere). `docs/specs/runner.md`'s RUL34/RUL37/RUL64 match the real
implementation precisely — RUL37 even repeats A1b's own
dangling-parent-in-view rationale verbatim. One informational staleness
noted above (RUL37's manifest-adjacent line 1071 still names
`bin/fgos.mjs`, now outdated due to `tsk-49i`, not this item's own fault).

## tsk-3xog — Locked-decisions heading contract

**Guard heuristic false-negative gap.** ## Verdict: CONFIRMED — a real gap
exists, demonstrated live in this corpus. `DECISION_LIKE_HEADING =
/decision|quy.t.*.nh/i` (`scripts/check-locked-decisions-heading-drift.mjs:22`)
only matches a heading containing "decision" or the substring "quyết
định" (loosely, via the regex). A heading using Vietnamese "chốt"
("locked/settled") WITHOUT the words "quyết định" would never even enter
the `candidates` list and so could never be flagged, no matter what its
body contains. This is not hypothetical:
`docs/history/gate-approve-vs-movenext-semantics/CONTEXT.md:164` carries
`## 7. Thuật ngữ chốt`, a real heading in this exact repo that fails
`DECISION_LIKE_HEADING`, and its own body cites D1/D9/D12/D13 inline. It
causes no actual miss today only because that same file's real decisions
table already sits under the canonical `## Locked decisions` heading at
line 43, so the file is skipped by the primary `CANONICAL_SECTION` check
before the candidate search ever runs. A hypothetical file whose ONLY
D-ID table sat under a "chốt"-alone (or any decision-adjacent word never
containing "decision"/"quyết định") heading would slip through
undetected. Worth a follow-up backlog item; out of scope to fix here per
the task's own instruction not to re-litigate tsk-3xog's locked scope.

**30-file heading-only retrofix.** ## Verdict: CONFIRMED, exactly. `git
diff --numstat 6bfb149c...f8cf7e36 -- 'docs/history/*/CONTEXT.md'` lists
exactly 30 files, each showing `1 1` (one insertion, one deletion) — no
more, no less. Spot-checked 4 directly (`gate-approve-vs-movenext-
semantics`, `status-proposed-rename`, `tsk-1ia`, `tsk-580`): every diff
touches only the heading line itself (`## Quyết định đã khoá`/`## Quyết
định đã chốt`/`## 2. Quyết định đã khoá (...)` → `## Locked decisions`),
nothing else. The one heading-LEVEL exception plan.md names
(`pick-cook-worktree-bypass-reminder/CONTEXT.md`, `#` → `##`) is confirmed
in its own diff. Running `node scripts/check-locked-decisions-heading-
drift.mjs` against the live repo right now reports "no findings" — the
retrofix genuinely closed the gap and nothing has regressed since.

**`docs/history/tsk-3xog/plan.md` honesty.** ## Verdict: CONFIRMED. Every
concrete claim in the retroactive plan.md (the "30 files" count, "one
exact, pre-verified single-line string replacement", the heading-level
exception, the `fgos-mirror.test.mjs` byte-identical claim) is verified
directly above against the real diff, not taken on the plan's own word.

## Judgment calls re-checked

**Two placeholder verify fields replaced with real commands.** ## Verdict:
CONFIRMED real, not rubber stamps. `tsk-3xog`'s current verify (`npm test
&& grep -q '## Locked decisions' .agents/skills/fgos-coding-exploring/
SKILL.md && test -f scripts/check-locked-decisions-heading-drift.mjs &&
node scripts/check-locked-decisions-heading-drift.mjs`) and `tsk-1y6`'s
(`npm test && grep -q 'ironLaw' src/setup/registrations.mjs && test -f
plugins/fgOS/skills/approve/SKILL.md && grep -q 'ironLaw.level'
docs/specs/runner.md && grep -q 'every ready item is blocked'
plugins/fgOS/skills/merge-loop/SKILL.md`) were both run live against the
current repo (excluding the `npm test` clause, checked separately below)
and every clause passes for real, asserting the actual deliverables named
in the checklist above — not tautologies.

**Rescoped verify clause 4 (`main...HEAD` → `fgw/tsk-1y6...HEAD`).**
## Verdict: CONFIRMED sound, not a loophole. `fgos show tsk-1y6-4`'s own
event log (a `driver-report` decision + the item's own `gates.ask` entry)
records the original session hitting exactly this wall: the item's
implementation was complete and committed with zero `src/` changes of its
own, but verify clause 4 as `main...HEAD` measures the WHOLE `fgw/tsk-1y6`
branch, which already carries sibling `tsk-1y6-1`'s `src/setup/
registrations.mjs` and `bin/fgos.mjs` changes — structurally
unsatisfiable for ANY child committing after a sibling with `src/` changes
already landed on the shared branch, not specific to this item. Three
options were offered (rescope, drop the clause, leave blocked); the
rescoped form actually adopted (`fgw/tsk-1y6...HEAD`) is the one that
preserves the real intent — "this item adds no `src/` change" — while
making it measurable given the shared-branch structure.

**tsk-3xog's "schema" false positive.** ## Verdict: CONFIRMED false
positive, correctly judged. `tsk-3xog`'s real item description contains
the substring "schema" exactly once, inside the cited example folder name
`phase-2-status-category-schema` (one of five example
`docs/history/*/CONTEXT.md` folders listed as having invisible D-IDs) —
never as a claim about touching or modifying an actual data schema.

## npm test

Run fresh, live, right now (not re-quoted from any prior session):

```
ℹ tests 3369
ℹ pass 3364
ℹ fail 0
ℹ skipped 5
```

Exceeds the "3352+ pass / 0 fail" baseline the task named — consistent
with other work having landed on `main` since, as the task's own tooling
notes anticipated.
