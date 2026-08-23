# tsk-37i plan soundness review

Reviewer: code-reviewer (read-only). Date: 2026-08-17.
Artifacts reviewed: `docs/history/self-contained-id-references/{DISCUSSION.md,CONTEXT.md,plan.md}`.
Grounding read: `scripts/check-decision-citation-drift.mjs`, `scripts/check-decision-supersession.mjs`,
`scripts/check-decision-codes.mjs`, `test/scripts/check-decision-codes.test.mjs`,
`docs/history/decision-code-check-enforcement/CONTEXT.md`, `docs/decisions/0000-index.md`,
`docs/id-systems-audit.md`, `docs/how-to/write-verify-for-a-skill-prose-change.md`.

D2's scope narrowing (dropping the reversal sweep + routing close-gate to `tsk-1lv`) was
treated as settled and is not reviewed.

Verdict: **not ready to hand off**. Three defects make the verify command pass on an
implementation that has done roughly none of the item's stated work, and one locked
decision (D4) rests on a misread of its own cited precedent. Everything below was
checked by running commands or reading source, not inferred from the plan's prose.

---

## C1 — CRITICAL: the NEGATIVE leg is vacuously green on this machine

`plan.md` line 132 (already synced into the item's live `verify` field — confirmed via
`fgos show tsk-37i`) ends with:

```
! rg --hidden ... -P '\((?:D[0-9]+[a-z]?)(?:,\s*D[0-9]+[a-z]?)*\)' .agents/skills docs/specs
```

This build of `rg` has no PCRE2:

```
$ rg --pcre2-version
PCRE2 is not available in this build of ripgrep.
$ rg -P '...' .agents/skills docs/specs ; echo $?
2
```

`rg` exits **2** (engine error, not "no matches"), and the leading `!` inverts that into
success. I ran the exact leg: it reports green today, with 12 files still carrying the
banned pattern. This is the worst possible failure mode — a NEGATIVE that passes whether
or not the cleanup happened, and passes *more* reliably the more broken it is.

The regex uses no lookaround or backreference, so `-P` buys nothing.

**Fix:** drop `-P` (rg's default engine handles this pattern), or use `grep -rE`. Then run
the leg once *before* locking the verify and confirm it currently FAILS — a negative leg
that has never been observed to fail is not evidence.

---

## C2 — CRITICAL: POSITIVE leg #2 demands a state that violates decision `0017`

```
grep -qE 'D2 \([^)]{10,}\)' .agents/skills/fgos-coding-shaping/SKILL.md
```

This asserts that after the fix, `fgos-coding-shaping/SKILL.md` still cites `D2` — now
with a gloss attached. But `docs/id-systems-audit.md:152` (quoting decision `0017`) locks
the rule as: a D-local id is **never** cited outside its own `CONTEXT.md`. `DISCUSSION.md`
§6 restates this explicitly ("D-local vẫn KHÔNG được nới lỏng — dọn ở skills-doctrine là
sửa VI PHẠM luật cũ, không đổi luật"), and `CONTEXT.md`'s pinned terms make
"D-local citation-outside-home" one of the two *new finding types* the check will detect.

So the verify requires the implementer to produce exactly the artifact the item's own new
check must flag. The id+gloss form cures a bare **ADR/RUL** citation; it does not cure a
D-local one — the only correct fix there is inlining the rule's content and deleting the
id. As written, C2 and the live-check leg on the same line are mutually unsatisfiable
(unless the finding is baselined, which then defeats the cleanup proof — see C3).

**Fix:** replace with (a) a POSITIVE pinning the *inlined content* that replaced the id —
a long, distinctive phrase per trap #5, e.g. `grep -q 'never write CONTEXT.md/plan.md
directly'` — plus (b) a NEGATIVE asserting `D2` no longer appears in that file at all.

---

## C3 — CRITICAL: the completeness proof is defeated by the baseline it passes

```
node scripts/check-decision-citation-drift.mjs --live --baseline scripts/check-decision-citation-drift.baseline.json
```

`plan.md` calls this "the authoritative completeness proof for the ~36-69 file cleanup."
It is not. Per D4 the baseline is generated at phase 1 containing *every currently-known
finding*. A ratcheting check run against that baseline exits 0 **the instant phase 1
lands**, with zero files cleaned. Phase 3 could be skipped entirely and this leg still
goes green.

Combine with C1 (NEGATIVE always green) and C2 (satisfiable by a one-line edit) and the
whole verify passes on: "wrote the convention doc, extended the script, touched one line
of one SKILL.md." The ~36-69 file cleanup — the half of D2 a user would recognize as the
deliverable — is entirely unproven.

**Fix:** the completeness leg must ignore the baseline, e.g. a final run with
`--baseline /dev/null` (or an assertion that the checked-in baseline is empty / contains
only an explicitly enumerated waived residual). Note this also collides with `plan.md`'s
Shape section, which permits ending at "an explicitly-waived residual" while the NEGATIVE
leg admits no residual at all — pick one and make both sections say it.

---

## H1 — HIGH: D4 promises `npm test` blocks new violations; nothing in the plan makes that true

`npm test` is `node --test 'test/**/*.test.mjs'` (package.json). `tsk-3ch`'s own scout
evidence, in the very file `CONTEXT.md` D4 cites, states it plainly:

> "Neither existing script uses a pre-commit hook or a dedicated `package.json` script for
> a real-repo run; both are proven purely through their own `test/scripts/*.test.mjs`
> file."

I confirmed this: `test/scripts/check-decision-codes.test.mjs` spawns the CLI only inside
`fs.mkdtempSync` fixture trees (`cwd: dir`), never against the repo root. So the existing
ratchet does **not** gate `npm test` on live repo state, and `check-decision-codes` would
not catch a new violation in a real test file today.

`plan.md`'s "Files likely touched" list is: the script, the baseline JSON, the existing
unit-test file, the convention doc, and the prose files. No `package.json` change, no new
real-repo test case. `DISCUSSION.md` §6 states the harness task as "wire vào `npm test`" —
that wiring has no deliverable. The item can land fully "done" with the enforcement
mechanism inert.

**Fix:** name the wiring explicitly as a phase-1 deliverable — the cheapest shape that
fits existing convention is one test case in `test/scripts/check-decision-citation-drift.test.mjs`
that spawns the CLI with `cwd` = repo root and the checked-in baseline, asserting exit 0.
Say so in the file list and add it to the risk map.

---

## H2 — HIGH: wiring the live run into `npm test` goes red on day one, on findings this item never scoped

The CLI already defaults to live repo paths. I ran it as-is:

```
$ node scripts/check-decision-citation-drift.mjs
check-decision-citation-drift: 3 finding(s):
  - docs/backlog.md:96: cites 0002 (superseded by 0012) without acknowledging the supersession
  - docs/specs/decision-citation-drift.md:33: cites 0002 (superseded by 0012) ...
  - docs/specs/decision-citation-drift.md:85: cites 0002 (superseded by 0012) ...
exit=1
```

Three pre-existing `dead-framing` findings, of the ALREADY-shipped kind. D4 scopes the
ratchet to "**the new** finding types" — so unless the baseline covers all kinds, the
moment H1's wiring lands `npm test` goes red on debt this item never scoped to clean.
That is precisely the failure mode D4 was written to avoid. Neither `CONTEXT.md` nor
`plan.md` mentions these three; nobody ran the check live before planning around it.

**Fix:** either (a) baseline **all** finding kinds, not just the new two — and say so in
D4 — or (b) fold fixing those three lines into phase 1 as an explicit, named step.

---

## H3 — HIGH: `--live` is a phantom flag; the real gap is wiring, not a mode

`plan.md` describes `--live` as "this plan's proposed flag name for the new
real-repo-scan mode (phase 1's own deliverable)". But `runCli`/`parseArgs`
(`scripts/check-decision-citation-drift.mjs:114-148`) already default to
`docs/backlog.md` + `docs/specs` — real repo paths. It is live by default; the H2 run
above proves it. `CONTEXT.md`'s scout note is narrower and correct ("never invoked against
the live repo tree **as part of `npm test`**"), but the plan promoted that into a
non-existent missing capability. An implementer will build a flag that does nothing new
and think they delivered the mechanism.

**Fix:** delete `--live` from the verify and from phase 1's scope. The genuinely missing
CLI surface is `--baseline` plus a baseline generator (H4).

---

## H4 — HIGH: no mechanism for generating the baseline (direct answer to the lead's question)

This is hand-waved. `plan.md` lists `scripts/check-decision-citation-drift.baseline.json`
as a new file with no stated producer; the Shape section says the baseline is "generated
from the repo's CURRENT state" but names no command. The prior art it invokes solves this
explicitly — `scripts/check-decision-codes.mjs` has `--write-baseline` (lines 101,
115-127) with `baselineFromFindings()` — and `tsk-3ch`'s own plan additionally carries the
self-consistency leg:

> "After `--write-baseline` generates the real baseline, `node scripts/check-decision-codes.mjs`
> (no args) against the live repo must exit 0 — this is one of the item's own verify legs,
> run for real, not simulated."

tsk-37i copies the *shape* of the prior art but drops both the generator and that
self-consistency check. A hand-written baseline whose entries don't byte-match what the
detector emits fails open or fails closed silently.

**Fix:** add `--write-baseline` (+ its unit test) to phase 1's deliverables and adopt the
tsk-3ch self-consistency verify leg verbatim.

---

## M1 — MEDIUM: D4's cited evidence does not say what D4 says it says

D4 states:

> "Direct local precedent: `tsk-3ch` hard-blocked immediately once and broke `npm test`
> red across 42.7% of test files (254/117), forcing 5 blocked merges before a human
> intervened (`docs/history/decision-code-check-enforcement/CONTEXT.md` D1)."

Reading the cited file, three things are wrong:

1. **`tsk-3ch` never hard-blocked.** Its D1 chose the ratchet from the outset and rejected
   hard-blocking as a *hypothetical* ("rejected because it **would** turn `npm test` red
   repo-wide"). Nothing broke; that is the point of the precedent.
2. **254/117 / 42.7% is a measured violation rate, not tests broken red** — "254 matches
   across **50 of** 117 test files (42.7%)". "254/117" is a mangled ratio (42.7% = 50/117).
3. **The 5 blocked merges belong to `tsk-3wr`**, the cleanup item, and its friction log
   attributes them to "cross-root integration drift / merge-conflict" — not to any check
   going red. The human force-close was of `tsk-3wr`.

The *decision* (use a ratchet) is right and the precedent genuinely supports it. But this
sentence is now a locked decision that future sessions will cite as repo history, and it
is false. Two smaller notes on the same line: the numbers live in that file's Scout
evidence, not in its D1; and the citation `…CONTEXT.md D1` is itself a D-local id cited
outside its own home — the exact violation this item exists to eliminate.

**Fix:** restate as "`tsk-3ch` measured 254 violations across 50/117 test files (42.7%)
and chose a ratchet specifically so it would not have to hard-block debt it had not
scoped; its dependency `tsk-3wr` had already shown that cleanup-first does not converge."
Cite the section, not the D-id, and gloss it.

---

## M2 — MEDIUM: scope hole — `plugins/fgOS/skills/**/SKILL.md` is a third, hand-maintained copy

`DISCUSSION.md` §5 measured across four roots (`.agents/skills`, `.claude/skills`,
`docs/specs`, `plugins`) and dismissed the mirrors with "`.claude/skills` là bản sinh tự
động — sửa nguồn là đủ." That argument holds for `.claude/skills` (verified: **0** files
there match the bare-`(D<n>)` pattern — they are genuinely thin wrappers). It does **not**
hold for `plugins/`:

- `plugins/fgOS/skills/fgos-coding-shaping/SKILL.md` is a full 258-line copy, not a wrapper.
- `scripts/build-skill-wrappers.mjs` generates **only** `.claude/skills` (its own header
  comment); no script under `scripts/` writes `plugins/fgOS/skills` — it is referenced
  only by `src/setup/registrations.mjs` and `src/runner/paths.mjs`.
- **16** files under `plugins/` carry the bare `(D<n>)` pattern today.
- `docs/how-to/write-verify-for-a-skill-prose-change.md` lists
  `plugins/fgOS/skills/**/SKILL.md` as a first-class skill-prose path.

D2, the plan's scan surface, its cleanup roots, and the verify NEGATIVE all silently omit
`plugins/`. After this item lands, 16 shipped plugin skill files still carry bare D-local
citations and nothing looks at them.

**Fix:** either add `plugins/fgOS/skills/**/SKILL.md` to the scan surface, cleanup set and
NEGATIVE roots, or state in `CONTEXT.md` what regenerates `plugins/` and cite the
generator. Do not leave it unmentioned.

---

## M3 — MEDIUM: "~36-69 files" is not the size of the work the plan actually scopes

Measured within the plan's own roots (`.agents/skills` + `docs/specs`), the `(D<n>)` class
is **12 files** — 9 skills, 3 specs. The 36 came from a four-root grep that counted the
`.claude/skills` and `plugins/` mirrors as separate work. Carrying "~36-69" forward makes
phase 3 unestimatable, and it conceals M2 (the inflation is partly *real* work in
`plugins/` that then got dropped from scope).

**Fix:** re-measure per class inside the actual roots and state three numbers (D-local /
RUL / ADR) instead of one range spanning two orders of specificity.

---

## M4 — MEDIUM: NEGATIVE covers one of three violation classes, and misses real hits in the item's own example file

Even with C1 fixed, the pattern only matches parenthesized comma-lists. In
`.agents/skills/fgos-coding-shaping/SKILL.md` — the canonical violation this item was
opened on — it misses:

- line 38: `(locked decision D2, \`docs/history/...\`)` — paren does not start with `D`
- line 215: `## Terminal handoff (D2 — Native-First Dispatch)`
- line 232: `D1/D2: the live session with full context...` — slash form, no parens

And nothing anywhere in the verify covers bare **RUL** citations (~62 files per §5) or
bare 4-digit **ADR** citations (~69 files) — two thirds of D2's stated cleanup. `DISCUSSION.md`
§3 #3 itself names the slash form (`RUL33/RUL34`, `D2/D4/D6`) as a real observed pattern.
This is trap #5 from the verify how-to recurring: the plan claims it avoided trap #5 by
delegating to the live check, but C3 shows that leg proves nothing.

**Fix:** three NEGATIVE legs, one per class, each run and observed to fail before locking.

---

## M5 — MEDIUM: `-g '!**/CONTEXT.md'` encodes the wrong rule

The locked rule exempts only the id's **own** home `CONTEXT.md`; the glob exempts every
`CONTEXT.md` in the tree. `plan.md`'s edge case #2 gets this right ("the finding logic
keys off FILE PATH — is this file the id's own `CONTEXT.md`"), so the verify contradicts
the plan one section above it. Today it is a no-op (no `CONTEXT.md` exists under
`.agents/skills` or `docs/specs` — checked), so it is dead code carrying a wrong rule that
will mask real findings the moment roots widen. A live example of what it would wrongly
exempt: tsk-37i's own `CONTEXT.md` D4 citing `tsk-3ch`'s D1 (M1).

**Fix:** drop the glob from the verify; keep the own-home logic where it belongs, in the
check.

---

## L1 — LOW: stale file citation in `plan.md`

`plan.md` line 65 cites `.agents/skills/_shared/executor-dispatch-fallback.md` as the
"same family" prior art. That file does not exist. The real file is
`.agents/skills/_shared/capacity-dispatch-fallback.md` (the only file in that directory).
The `executor-*` name came from commit `c681f353` (tsk-225, capacity→executor rename) and
was reverted by tsk-34n (`3d5b8d44`). Fix the path.

---

## On the lead's "standard mode vs no split" question

No inconsistency in the mode call: `.agents/skills/fgos-routing/SKILL.md:59` reads
"2–3 flags, **or story-sized behavior** → standard", so 1 flag + story-sized reaches
standard by the rule as written, and `risk`/`tier` are separate axes from mode. Two minor
notes rather than findings: the plan's own risk map rates two components **medium** while
the item is tagged `risk: light` — worth reconciling one way or the other; and the
"not independently workable" argument for one item is weak, since phase 3's only real
dependency is "the convention doc exists," which is the textbook shape of a splittable
child. Keeping it as one item is defensible **provided** C3 and H1 are fixed so phase 3
cannot be silently skipped. As it stands, the single-item shape plus a verify that cannot
detect a missing phase 3 is the risky combination, not the split decision itself.

## Claims that check out

Verified, so the next reviewer need not redo them:

- **D3's "supersession script is untouched" is true.** `scripts/check-decision-supersession.mjs`
  reads only `docs/decisions/*.md` frontmatter (`supersedes`/`superseded_by`) plus
  `0000-index.md` rows, via `classifySupersedes`/`findIndexRow`/`pointsBackAt`. Zero
  overlap with prose-citation scanning. Both named functions exist as cited.
- **Scout citations resolve.** `docs/decisions/0000-index.md:22-25` is the ADR citation
  convention; `:30-36` is the supersede-back-pointer prose discipline (as cited by mảnh 2);
  `docs/id-systems-audit.md:49` is the RUL "not globally unique, needs area suffix" row;
  `:152` is the `0017` D-local lock.
- **The live violation in `.agents/skills/fgos-coding-shaping/SKILL.md` is real** —
  bare `(D3)`, `(D4)`, `(D4, D6)`, `(D5)` plus the three unmatched forms in M4.
- **`DISCUSSION.md`'s anchor referenced by the item's `refs` field
  (`#task-citation-format-and-pointer-check`) exists.**

## Recommended order of work

1. C2 + C1 + C3 — rewrite the verify (it is already synced into live item state, so it is
   wrong *now*, not just on paper). Run every leg and observe each one fail before locking.
2. H2 + H4 + H1 — decide baseline scope (all kinds), add `--write-baseline`, name the
   `npm test` wiring as a deliverable.
3. H3 — delete `--live` from scope.
4. M2 + M3 — settle `plugins/`, then re-measure.
5. M1 + M5 + L1 — correct D4's precedent narrative and the two stale/wrong citations.

## Unresolved questions

- Is `plugins/fgOS/skills/**` regenerated by anything at all, or is it hand-synced? I found
  no generator. If hand-synced, it needs to be in scope; if there is a generator I missed,
  `CONTEXT.md` should cite it.
- Does the team want the three pre-existing `dead-framing` findings (H2) fixed in phase 1
  or baselined? Both are defensible; the plan needs to pick one before an implementer hits
  a red `npm test` and improvises.
