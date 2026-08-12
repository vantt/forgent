# Plan: long-work-item-ids (tsk-3tk)

Decisions this plan honors: D1 (scope = report + fix), D2 (fix = hard
reject) — both locked in `CONTEXT.md`, not reopened here.

## Mode

**Standard.** Flags counted against the mode-gate checklist:

- **public contracts** — yes. `fgos add` is a CLI surface other sessions,
  skills, and agents call directly; narrowing what id values it accepts is
  a behavior change to that contract (previously-accepted long ids will
  now be rejected).
- **existing covered behavior** — yes. `validateWorkShape` and `fgos add`
  already have test coverage (`test/state/work.test.mjs`); this change
  extends an existing, tested invariant rather than adding a new
  standalone one.
- All other flags (auth, authorization, data model, audit/security,
  external systems, cross-platform, weak proof, multi-domain) — no.

2 flags → standard. Not `small`: the exact threshold number needs
justification against real data (below), not just "add a check" — that
justification is itself the standard-mode judgment call this item is for.
Not `high-risk`: no auth/data-loss/audit/external-provider/removed-
validation flag applies, and the fix only tightens validation on brand
new writes (proven safe against replay in `CONTEXT.md`).

## Approach

Add a `MAX_ID_LENGTH` constant and a length check to `validateWorkShape`
(`src/state/work.mjs`), right alongside the existing `ID_PATTERN` check it
already runs at line 127-129. No new write door, no new event type — same
single validation entry point `addWork` (`store.mjs:155`) and `patch`
(`store.mjs:227`) already both call.

**Threshold: 30 characters.** Justified by the actual length spread found
in `CONTEXT.md`'s evidence — the 8 existing long ids split cleanly into
two clusters with a wide gap between them:

| id | length | cluster |
|----|--------|---------|
| `doc-fgos-rollup-howto` | 21 | acceptable |
| `loai-tru-data-dir-39c` | 21 | acceptable |
| `str89-case-study-executing` | 26 | acceptable |
| `them-view-rollup-theo-bo-cho-item-goc-6ct` | 41 | offending |
| `choke-point-workingtree-clean-duplication` | 41 | offending |
| `choke-point-take-vs-pick-claim-eligibility` | 42 | offending |
| `choke-point-createworktree-callsite-wrapper` | 43 | offending |
| `bo-hardcode-ten-trunk-main-trong-merge-e-5i0` | 44 | offending |

Acceptable cluster tops out at 26; offending cluster starts at 41 — a
30-char cap sits in the 15-char gap between them, so it rejects every
observed bad case and none of the observed good ones. It is also
generous relative to `generateId`'s own output (`tsk-` + ≤8 chars = ≤12)
and the codebase's own example id in the existing `ID_PATTERN` error
message, `add-login-form` (15 chars) — 30 leaves clear room for a real
short descriptive id without permitting a slugified title.

**Error message**, mirroring `ID_PATTERN`'s existing style
(`work.mjs:129`):

```
work.id must be at most 30 characters (got <N>): "<id>" — pick a short
descriptive id, not a slugified title.
```

**Risk map:**

| component | risk | proof point (for fgos-coding-validating) |
|---|---|---|
| `validateWorkShape` new check | low | unit test: id of exactly 30 chars passes, 31 chars rejects, error message matches |
| `addWork` write path | low | existing `test/state/work.test.mjs` / any `fgos add` CLI test still green — confirms no regression to short-id adds |
| replay of existing long ids | low (already proven in CONTEXT.md) | run the full test suite / `fgos list` against the current `.fgos/` store and confirm the 8 existing long-id items still load, since replay never calls `validateWork` |

No medium/high risk entries — this is a pure additive validation
tightening on the write path only.

**Files touched:**

1. `src/state/work.mjs` — add `MAX_ID_LENGTH` constant + check inside
   `validateWorkShape` (near line 127-129).
2. `test/state/work.test.mjs` — add cases: id at the 30-char boundary
   (passes), id at 31 chars (rejects with the new message), confirms the
   existing `ID_PATTERN` cases are untouched.

Order: (1) then (2) — the test needs the implementation to exist first;
there is no cross-item dependency to resolve since this item is not on
the graph's current critical path (`fgos graph tsk-3tk --json`:
`criticalPath` and `topUnblock` both omit `tsk-3tk` — it is an isolated,
single-piece change, not a blocker for other queued work).

## Split decision

One honest piece. Not split: the fix is a single localized check in one
function, proven safe by the replay analysis already in `CONTEXT.md`, and
the test addition lives in the same file the implementation touches. No
`parent`-lineage children created.

## Verify

```
node --test test/state/work.test.mjs
```

This is the concrete, runnable command that proves the item done — it
exercises the new `MAX_ID_LENGTH` check directly and the full existing
`validateWorkShape`/`ID_PATTERN` suite alongside it, so a regression in
either would fail the same run.
