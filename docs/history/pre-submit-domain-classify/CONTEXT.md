# Pre-submit domain classify (tsk-3m6)

## Feature boundary

A new judgment step ("Bước A") that classifies which `domain` a freshly
submitted work item belongs to, from its raw text, and passes the result
via `--domain` at `fgos submit` creation time. `domain` is write-once and
immutable after creation (`src/state/store.mjs` `EDITABLE_FIELDS` excludes
it — confirmed still true, `EDITABLE_FIELDS` has no `domain` entry) —
unlike `tier`/`kind`/`risk`, which are always cheaply correctable later via
`fgos edit` (`plugins/fgOS/skills/submit/SKILL.md` step 6b/6c, "Bước B",
already ships this for those three fields). A wrong domain guess can never
be fixed; a wrong-or-absent domain guess just falls back to
`DEFAULT_DOMAIN` (`coding`).

Everything else this item's description originally scoped is already
resolved elsewhere and is explicitly OUT of this feature's remaining
boundary (see "Already resolved, out of scope" below).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Domain-classify (Bước A) applies to BOTH the live interactive `/fgOS:submit` session AND headless creation paths (cron, `dogfood-fixture:submit`, another agent delegating to `submit`) — not scoped to live-session-only the way Bước B's tier/kind/risk reclassify step is gated today. |
| D2 | When Bước A is not confident which domain applies, leave `--domain` unset so the item falls back to `DEFAULT_DOMAIN` (`coding`) silently — no blocking confirm question is added to the submit flow for the low-confidence case. |

D1 and D2 are also recorded in the item's structured decision log (`fgos
decision`, seq 12461/12462) for machine readers via `view.decisions`.

### D1 rationale

Domain is write-once — a headless-created item (cron ingest, fixture
replay, delegating agent) gets exactly one shot at a correct domain, same
as a live-session-created one. Scoping classify to live-session-only would
permanently strand every headless-created item at `coding` regardless of
its actual content, which the person confirmed is not the wanted
trade-off.

**Structural corollary for planning (not decided here):** Bước A cannot be
built the same way Bước B is today — Bước B runs entirely native, in-session,
post-creation (`plugins/fgOS/skills/submit/SKILL.md` step 6, gated "only if
a live soul is running this", Native-First Dispatch Doctrine rule 2). D1
means Bước A must also work with no live session present, which rules out
"native in-session judgment only" as a sufficient mechanism on its own.
Whether the headless case is served by a capacity-dispatch call, a
deterministic keyword classifier mirroring `src/intake/classify.mjs`'s
existing mechanical-fallback shape, or something else, is an implementation
choice — left to `fgos-coding-planning` (see Outstanding questions).

### D2 rationale

Every registered domain except `coding` is a disposable fixture today:
`synthetic`, `triage`, `fixture-marketing` are all explicitly comment-marked
"illustrative, disposable" in `src/state/workflow-stage-graphs.mjs` (lines
32, 281, 287, 318-322), and all three declare `skillMap` entries that are
`null` throughout — no skill ever loads for them. A correct classifier
therefore outputs `coding` for essentially all real traffic today, so a
silent low-confidence fallback to `coding` costs nothing in practice, and
avoids adding a blocking question to every submit. The corollary: a
non-default domain guess must only ever be emitted when confidence is
genuinely high, since there is no later chance to correct it.

## Pinned terms

- **Bước A** — the new, universal (must run before domain is known, so it
  cannot itself be domain-specific) classify step this item scopes: raw
  text → `domain` value, passed via `--domain` at `fgos submit`/`fgos add`
  creation time.
- **Bước B** — the already-shipped, domain-specific classify step (tier/
  kind/risk, `plugins/fgOS/skills/submit/SKILL.md` step 6b) that reads the
  item's own `domain` after creation and resolves that domain's declared
  classification vocabulary (`getDomain(item.domain).classification`).
  Fully out of scope for this item — mentioned only for contrast with
  Bước A.
- **DEFAULT_DOMAIN** — `coding` (`src/state/workflow-stage-graphs.mjs:49`),
  what an absent/unrecognized `domain` field always resolves to
  (`resolveDomainName`, same file, folds unknown names to this with a
  `console.warn`).

## Already resolved, out of scope (verified this session, not re-litigated)

- Domain/risk/kind classification vocabulary being coding-flavored →
  resolved by tsk-5wz: vocabulary now lives per-domain in
  `DOMAINS.<domain>.classification`, enforced at the write door
  (`work.mjs` `validateWorkShape`).
- `fgos-submit-assist` renamed/split by domain → resolved by tsk-6ar:
  fully retired instead. Verified this session: neither
  `.claude/skills/fgos-submit-assist/` nor
  `.agents/skills/fgos-submit-assist/` exist in this checkout.
- Bước B (tier/kind/risk-by-domain judgment) dispatch mechanism → resolved
  differently than originally planned: native in-session judgment inside
  `plugins/fgOS/skills/submit/SKILL.md` step 6, not a separate skill or a
  new `skillMap` key. Verified this session: no `submitAssist`-style key
  exists in any `DOMAINS.*.skillMap` in `src/state/workflow-stage-graphs.mjs`.

## Scout evidence

- `src/state/store.mjs` — `EDITABLE_FIELDS` (comment: "identity is
  immutable") excludes `domain`; confirms the write-once premise is still
  accurate.
- `bin/fgos.mjs` — `--domain` plumbing already exists end-to-end for
  `submit` (`opts.domain`, ~line 893), `add` (`flags.domain`, ~line 1029),
  and is rejected on `edit` (`docsRef`/other fields are patchable, `domain`
  is not — no `--domain` case in the `edit` flag block). Confirms the CLI
  wiring to CARRY a domain value already exists; only the judgment that
  produces the value is missing.
- `src/state/workflow-stage-graphs.mjs` — `DOMAINS` registry has exactly 4
  keys: `coding` (real), `synthetic`/`triage`/`fixture-marketing` (all
  comment-marked disposable fixtures, all-null `skillMap`). Confirms the
  item's own YAGNI caveat is still accurate: no second real domain exists
  to classify into today.
- `plugins/fgOS/skills/submit/SKILL.md` steps 1-6 — full walk of the
  existing submit flow. Step 6's "only if a live soul is running this"
  gate is the direct precedent D1 explicitly diverges from (for Bước A
  only — Bước B keeps that gate unchanged).
- `fgos tool query --capability impact-analysis --status present` →
  `gitnexus`, `status: present`. Informational only per this skill's own
  scope (no code touched in the exploring stage) — recorded here per
  `CLAUDE.md`'s gate for the benefit of whichever stage-skill runs next.

## Canonical references

- `plans/reports/research-260730-0931-work-item-schema-multi-domain-upgrade-report.md`
- `docs/decisions/0027-domain-so-huu-status-doan-truoc-delivered-supersede-base-workflow-model-d1-d3.md`
- `src/state/store.mjs`
- `src/state/workflow-stage-graphs.mjs`
- `src/state/work.mjs`
- `bin/fgos.mjs`
- `plugins/fgOS/skills/submit/SKILL.md`
- `tsk-5wr`

## Outstanding questions

- Mechanism for Bước A (implementation choice, for `fgos-coding-planning`): given
  D1 (must work headlessly too), what actually produces the classified
  `domain` value — a capacity-dispatch call (the item's own original open
  question (iii)), a deterministic keyword classifier mirroring
  `src/intake/classify.mjs`'s existing mechanical-fallback shape with an
  optional native in-session upgrade when a live soul is present (mirroring
  how Bước B itself is layered), or something else? Capacity-dispatch and
  domain-routing are two different axes (capacity picks a backend/model;
  domain-routing picks which rubric/skillMap entry applies) — whichever
  mechanism is chosen must not conflate the two.
- Where Bước A's new step actually lives (a new step in
  `plugins/fgOS/skills/submit/SKILL.md` before today's step 4 `fgos submit`
  call, a new capacity registered in `.fgos/config.json`, or something
  else) — implementation detail, for `fgos-coding-planning`.
- What a runnable `verify` command for this item looks like given D2 +
  the YAGNI caveat (only `coding` is a real production domain today, so
  most classify outcomes are trivially `coding` either way) — the item's
  own `verify` field currently reads "chưa xác định — P15 bổ sung"; for
  `fgos-coding-planning` to resolve.
