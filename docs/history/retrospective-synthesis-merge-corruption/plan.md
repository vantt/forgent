# plan.md — retrospective-synthesis-merge-corruption (tsk-2oy)

Mode: high-risk

Lane decided directly (no prior handoff — this session entered via
`fgos-coding-driving`, not `fgos-routing`'s Orient step, and no earlier
`plan.md` round exists). Flags counted per `fgos-routing`'s own Mode-gate
table: **audit/security** (hard-gate — this item repairs a hole in the
main-checkout write path that silently corrupts the git-history audit
trail), **existing covered behavior** (`fgos-coding-compounding`'s step 3 runs on
every retrospective-synthesis, of every item, going forward), **weak proof
around the area** (main-checkout merge mechanics; see Risk map). One
hard-gate flag alone forces high-risk regardless of count; 3 flags total
here.

CONTEXT.md decisions this plan honors: D1 (scope narrowed off the other 4
found instances), D2 (audit already satisfied by RESEARCH.md round 1), D3
(scope narrowed AGAIN, mid-Execute — the merge-`fgw/tsk-4v6` piece is
dropped entirely: `fgos cleanup tsk-4v6` already confirmed tsk-4v6's real
fix safely landed on its parent's branch `fgw/tsk-4b2`; landing
`fgw/tsk-4b2` itself on `main` is a DIFFERENT bug, filed separately as
`tsk-13z`, not this item's scope).

## Approach

**Chosen path:** one change — add a `MERGE_HEAD` precondition guard to
`fgos-coding-compounding` step 3's commit, so it refuses instead of silently
absorbing a stray staged merge.

**Rejected alternative — wrap step 3 in the full `main-checkout.lock`**
(mirroring `mergeRunnerItem`'s own `acquireMainCheckoutLock` end-to-end):
would close the residual TOCTOU window completely (see Risk map) but needs
a new reusable lock-acquire-then-release CLI surface that nothing in this
repo exposes today — real new production code for a window that a plain
`MERGE_HEAD` check already closes for every one of the 5 confirmed
real-world instances (in each, the stray merge was already staged, not
racing into existence mid-commit). Rejected as scope beyond what the
evidence justifies (YAGNI) — noted here, not silently dropped, per D2's
audit-scope precedent for documenting boundaries honestly.

### Risk map

| # | Component | How risky | Proof point (for `fgos-coding-validating`) |
|---|---|---|---|
| 1 | Guarding `fgos-coding-compounding` step 3 | **HIGH** (existing covered behavior + audit/security). A `MERGE_HEAD`-present precondition check before the `git commit` line, refusing loudly (matching this codebase's existing "refuse loudly, never silently guess" idiom — e.g. `resolveDiscovery`'s missing-`--verdict` refusal) closes the exact hole all 5 confirmed instances share. Residual: a `MERGE_HEAD` created in the narrow window between the check and the commit itself (two shell statements) is not closed by a plain precondition — accepted as a documented residual, not fixed here (see Rejected alternative above). | Confirmed: no other code path in this repo already exports a reusable `mergeHeadExists`-equivalent to call instead of a fresh inline `git rev-parse --verify -q MERGE_HEAD` (checked: `mergeHeadExists` in `merge.mjs` is a private, unexported function — the guard is a fresh one-line shell check, not an import). |
| 2 | Skill-prose verify shape | LOW — mechanical once written. `docs/how-to/write-verify-for-a-skill-prose-change.md` read (required — this item touches `.claude/skills/fgos-coding-compounding/SKILL.md`). | See Proof surface below; no proof point needed beyond writing it correctly. |

Impact-analysis capability gate (`CLAUDE.md`): `fgos tool query
--capability impact-analysis --status present` → GitNexus registered,
`present` → **full**. `fgos-coding-implement` must run a real `impact()`
call on `fgos-coding-compounding`'s own step-3 commit block before editing, per
`CLAUDE.md`'s MUST rule.

### Files touched

- `.claude/skills/fgos-coding-compounding/SKILL.md` — add the `MERGE_HEAD` guard
  immediately before the existing `git -C "$root" commit -m "docs(<id>):
  retrospective synthesis"` line (step 3).
- `.agents/skills/fgos-coding-compounding/SKILL.md` — identical mirror edit
  (found mid-Execute: this repo keeps `.claude/skills/` and
  `.agents/skills/` in lockstep for every skill, per tsk-4b2's own D10
  precedent; not captured in this plan's earlier draft).

### Order

Single change, no ordering decision needed. (`fgos graph --json` shows
tsk-2oy with 0 deps and no children — a standalone leaf item.)

## Shape

**Guard the pipeline.**
- Add the `MERGE_HEAD` precondition check (exact refusal text pinned so
  the POSITIVE verify below has a real target):
  `"refusing to commit — MERGE_HEAD is set"`.
- Prove the guard text exists (POSITIVE) and the original commit line is
  still present, unremoved (a lighter substitute for a NEGATIVE clause —
  see Proof surface below for why a true NEGATIVE does not apply to a pure
  addition).
- Edge case to prove against conceptually (not re-testable by `verify`
  itself, per the skill-prose how-to's own boundary): a future
  retrospective-synthesis session hitting a real stray `MERGE_HEAD` now
  gets a loud refusal instead of a silent wrong-branch commit — this is
  the actual behavior change, and per the how-to doc, proving prose is
  *followed correctly at runtime* is out of verify's jurisdiction; that
  lives in merge-time review + `fgos-coding-validating`'s own reality check, not
  a shell assertion.

### Proof surface (verify)

Item's `verify`, refined from the clarify-stage placeholder and with the
`git merge-base --is-ancestor 687abfb8 main` clause DROPPED (D3 — that
proof now belongs to `tsk-13z`, not this item) to also cover the
skill-prose deliverable (`docs/how-to/write-verify-for-a-skill-prose-
change.md`'s required shape for any item touching a `SKILL.md` path), and
checked against BOTH the `.claude/skills/` and `.agents/skills/` mirrors
(discovered mid-Execute: this repo keeps the two in lockstep, per
tsk-4b2's own D10 precedent — not captured in this plan's earlier Files
touched list, corrected there too):

```
npm test && grep -qF "refusing to commit — MERGE_HEAD is set" .claude/skills/fgos-coding-compounding/SKILL.md && grep -qF 'git -C "$root" commit -m "docs(<id>): retrospective synthesis"' .claude/skills/fgos-coding-compounding/SKILL.md && grep -qF "refusing to commit — MERGE_HEAD is set" .agents/skills/fgos-coding-compounding/SKILL.md && grep -qF 'git -C "$root" commit -m "docs(<id>): retrospective synthesis"' .agents/skills/fgos-coding-compounding/SKILL.md
```

`-F` (fixed-string, not regex) is required, not cosmetic: a plain `grep -q`
against `docs(<id>)` interprets the parentheses as a regex group, so the
pattern never matches the file's own literal text — found live running
this verify for real during Execute, the exact "grep from đơn quá yếu"-
adjacent trap `docs/how-to/write-verify-for-a-skill-prose-change.md`
warns about, just a different mechanism (metacharacter misread, not a
too-weak token).

No true NEGATIVE clause: this change is a pure addition to
`fgos-coding-compounding`'s prose (a guard inserted before an existing line), not
a rename/removal — the how-to doc's NEGATIVE requirement exists to catch
"verify passes because the deliverable was deleted," which the "SURVIVE"
`grep -qF` calls above (asserting the original commit line survives
unremoved, in both mirrors) already cover for this shape of change.

## Outstanding questions

None
