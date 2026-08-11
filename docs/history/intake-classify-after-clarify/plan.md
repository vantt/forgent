# Plan: tối ưu đường intake — dời phân loại về sau clarify, trả quyền phân loại cho domain

Item: tsk-5wz.
Mode: high-risk

## Lane — how it was counted

No prior lane hand-off existed for this session (this item jumped `clarify
-> decompose` directly on the legacy edge — `fgos-coding-exploring`/`discovery`
never ran, so nothing recorded a `Mode:` line and no Orient step handed one
off either). Applying `fgos-routing`'s own Mode-gate table directly
(`.claude/skills/fgos-routing/SKILL.md` §"Mode gate"):

| Flag | Applies? | Why |
|---|---|---|
| auth / authorization | No | — |
| data model | **Yes** | adds enum validation to `work.kind`/`work.risk` (today unconstrained strings, `src/state/work.mjs:261,334`) |
| audit/security | No | — |
| external systems | **Yes** | touches the `agy` (Gemini) cli-spawn capacity `submit-assist-classify` |
| public contracts | **Yes** | `fgos submit`'s session-vs-no-soul behavior forks for the first time; work-item `kind`/`risk` schema gains enforcement |
| cross-platform | No | — |
| existing covered behavior | **Yes** | `classify.mjs`, `fgos-submit-assist`, `fgos-clarifying`, `dogfood-fixture:submit` all have existing tests this item must not regress |
| weak proof around the area | **Yes** | item's own "CAU CHUA TRA LOI" — unresolved question about ranking/triage effects of a widened intake window |
| multi-domain | **Yes** | moves a capacity from "global" to "coding-domain-owned" through `DOMAINS` — the exact boundary `str89-fgos-domain-skills`/0027 D5 established for `skillMap.retrospective` |

6 flags, plus a public-contract change → **high-risk**, unambiguously (the
table's own threshold is 4+, or any hard-gate flag). Matches the item's own
self-declared `tier: heavy`, confirmed correct by the item's own "BANG
CHUNG SONG" section — not overridden here.

## Decisions this plan is built on

No `CONTEXT.md` exists for this item — `fgos-clarifying` (the `discover`
call) verdicted the item's own description **understood** without a gray
area, so the `clarify -> exploring` deep-Socratic path never ran; the
description's own "HINH DE NGHI" / "PHAM VI - GOM" / "PHAI GIU DUNG" /
"CANH BAO ADR0020" sections are the locked decisions for this plan (cited
by section name below, since there is no D-ID list to cite instead).

Verified independently, not taken on the item's word alone:
- `src/intake/classify.mjs` — confirmed no LLM/model call, pure keyword
  match (read in full).
- `src/state/work.mjs:261` (`kind`) and `:334` (`risk`) — confirmed
  `requireNonEmptyString` only, no enum; `:145` `TIERS` confirmed a real
  frozen enum, `:340-344` confirmed it's enforced.
- `src/state/workflow-stage-graphs.mjs` `DOMAINS.coding` — confirmed it
  declares `stages`/`stepMap`/`transitions`/`skillMap`/`worktreeBacked`/
  `statusLabels`/`parkReason`, nothing for a kind/risk vocabulary — the gap
  is real.
- `.fgos/config.json` — confirmed `runner.capacities.submit-assist-classify`
  has no enum/domain binding today (global key, `kind:"cli"`, `agy`
  provider).
- `docs/history/agent-executor-submit-assist-classify/CONTEXT.md` D5 —
  confirmed: the not-configured/backend-missing fallback IS pinned
  byte-identical by a regression test (item's claim checked, true).
- Same CONTEXT.md D7 — confirmed: `sensitiveData` was decided but the
  live config has no such field on `submit-assist-classify` today (item's
  "never shipped" claim checked, true) — correctly left out of this
  item's scope.
- `tsk-2ie5` (the `mergeAfter` target) — confirmed live: status `doing`,
  stage `decompose`, title is the fgos-researching gather-fan-out
  cross-provider capacity item the description names.
- `tsk-53n` — confirmed live: status `doing`, stage `executing`, footprint
  `[".fgos/config.json"]` — the parallel-footprint warning in the item's
  own description is a real, current conflict, not stale.
- Two of the item's own citations do NOT exist on disk:
  `docs/history/dispatch-concept-boundary/DISCUSSION.md` (repo-wide search,
  zero hits) and the bare label "agent-executor-submit-assist-classify
  D5/D7" resolves to `docs/history/agent-executor-submit-assist-classify/
  CONTEXT.md`, a different path than the item wrote for the first ref.
  Pinned as an assumption below (Assumption 3), not treated as a blocker —
  every substantive claim from those citations was independently
  cross-checked against real code/config/other items above and held up.
- `AGENTS.md`'s install/setup/doctor gate now also carries (as of this
  session's snapshot) "Does this change something a user of fgOS would
  see? If yes, add a line to `## [Unreleased]` in `CHANGELOG.md`." This
  item changes `fgos submit`'s own session-vs-no-soul behavior and the
  `kind`/`risk` schema — user-visible. Folded into the shape below as its
  own step, not skipped.

## Approach

**Chosen path** — do the whole redesign in-session, no new capacity, no
new stage/field:
1. Keep `fgos submit` exactly as it is today: mechanical, no LLM,
   deterministic (`classify.mjs` untouched in its core promise).
2. The `/fgOS:submit` skill wrapper, once it has a live soul (this session
   itself), continues straight into `discovery`'s clarify step
   (`fgos-clarifying`) in the SAME session right after calling the
   `submit` verb — Native-First Dispatch (0026 rule 2), not a second
   subprocess re-deriving intent from less context.
3. After `fgos-clarifying` settles the clean title/description, resolve
   the classifying capacity through the item's own `domain` (mirroring
   `getDomain(domain).skillMap.retrospective`'s exact precedent,
   0027 D5 — never hardcoded) and re-classify tier/kind/risk on the CLEAN
   text, replacing the dirty pre-submit guess.
4. `submit-assist-classify` gets renamed and moved to be resolved through
   `DOMAINS.coding`, not addressed as a bare global capacity id anymore.
5. `DOMAINS[domain]` gains a declared `kind`/`risk` vocabulary (and a
   `tier` rubric/threshold), enforced by `work.mjs` per-domain instead of
   `requireNonEmptyString`.
6. `fgos-submit-assist` retires if, after 2-3 land, it has no step of its
   own left (its step 1 already lived in the verb; step 2 moves to
   discovery; step 3 already was the verb).
7. The no-soul path (bare shell, cron, `dogfood-fixture:submit`, a
   different agent) stays on today's keyword-only values, unchanged byte
   for byte — clarify simply runs later, at whatever `discovery` sweep
   next picks the item up. This is not a special case to build; it is
   what NOT changing the no-soul call site already gives for free.
8. `CHANGELOG.md`'s `## [Unreleased]` gets one line for the user-visible
   half of this (submit-from-a-live-session now clarifies+classifies
   inline instead of leaving a dirty guess).

**Rejected alternatives**
- Keep classification where it is (before `submit`) and just fix the
  `risk`/`tier` vocabulary collision in place — rejected: does not fix the
  deeper problem the item's own evidence names (reading the SAME text
  twice, dirty before clean), only patches the symptom that happened to be
  visible on this item's own record.
- Move classification into `fgos submit` itself (make the verb call a
  model) — rejected: breaks `classify.mjs`'s own "no model/LLM call"
  promise, which `dogfood-fixture:submit` and cron both depend on for
  determinism; explicitly ruled out by the item's own "PHAI GIU DUNG".
- Give every domain its own hardcoded classify rubric inline in
  `fgos-clarifying` — rejected: `fgos-clarifying` is explicitly
  domain-agnostic per 0027 D5 ("cấm hardcode domain vào xương sống"); the
  item's own "PHAI GIU DUNG" repeats this. The rubric has to live in each
  domain's own resolved capacity/skill, not in the shared skill.

**Risk map**

| Component | Risk | What proves it |
|---|---|---|
| `work.mjs` kind/risk enum enforcement | high (public contract: could reject a value an existing tool/skill already emits) | grep every `--kind`/`--risk` call site across `.claude/skills/**`, `plugins/fgOS/skills/**`, `bin/fgos.mjs`, `test/**` before landing the enum; new test proving both the new enum AND at least one pre-existing real value from each surface still validates |
| `.fgos/config.json` capacity rename | high (ADR0020: cannot ride a `fgw/<id>` branch) | split into its own item (below), landed as a direct main-checkout commit, `fgos doctor` green after |
| dispatch fallback strip (`submit-assist-classify`'s cli-spawn branch) | medium (removes the only live cross-provider sample) | gated by `mergeAfter: tsk-2ie5` so the replacement sample lands first — split into its own item (below) |
| submit→discovery same-session chaining | medium (changes `/fgOS:submit`'s own observed behavior for the first time ever) | new test: session-path ends with the item past `clarify`, title/description rewritten if the original was vague, tier/kind/risk from the CLEAN text |
| no-soul path regression | medium (must stay byte-identical) | `dogfood-fixture:submit` replay test, unchanged assertions |

Impact-analysis posture (`fgos tool query --capability impact-analysis
--status present`): **full** — GitNexus registered and present. The
high-risk `work.mjs` enum-enforcement proof point above will run
`impact({target:"validateWork", direction:"upstream"})` (and the same for
whichever `kind`/`risk` call sites the grep above turns up) before that
specific edit lands, at `fgos-coding-implement` time — not here; this plan
only records that the posture is full so that step is not skipped later.

**Files likely touched** (excluding the two split-off children below):
- `plugins/fgOS/skills/submit/SKILL.md` — chain into discovery when a soul
  is live
- `.claude/skills/fgos-clarifying/SKILL.md` — verified to stay
  domain-agnostic (verify-only, no expected content change)
- `.claude/skills/fgos-submit-assist/SKILL.md` — retire in place if it
  ends up with no step of its own (see Approach #6)
- `src/state/workflow-stage-graphs.mjs` — `DOMAINS.coding` gains a
  classification vocabulary declaration
- `src/state/work.mjs` — enforce `kind`/`risk` per-domain instead of
  `requireNonEmptyString`
- `CHANGELOG.md` — one `## [Unreleased]` line
- `test/**` — regression coverage per the risk map above

**Order**: this item does not appear in the repo's global critical path or
`topUnblock` list (`fgos graph --json`, checked) — it is isolated feature
work, not a blocker for other tracked items, so ordering is decided by the
item's own internal dependency shape, not cross-item leverage:
1. `DOMAINS` vocabulary + `work.mjs` enforcement first (everything else
   reads through it).
2. Submit→discovery chaining next (needs the vocabulary in place to
   classify against on the clean text).
3. `fgos-submit-assist` retirement last (only correct once 1-2 actually
   remove its reason to exist).
4. The two split-off children (config rename; dispatch strip) proceed on
   their own independent tracks — see below.

## Assumptions

1. Existing `kind`/`risk` values already stored on live items (e.g. this
   item's own `risk: "heavy"` collision) do NOT need a data migration —
   the new enum enforcement only needs to apply at write time going
   forward; a legacy value already on disk is out of scope. Not material
   to acceptance criteria (a schema-migration decision), so pinned here
   rather than asked.
2. The "CAU CHUA TRA LOI" open question in the item's own description
   (does anything downstream need tier/kind/risk correct in the
   submit→discovery window) is NOT material to this item's own acceptance
   — it is explicitly a follow-on concern the item itself defers, not a
   gap this plan needs to close.
3. The two dangling doc citations (see "Decisions this plan is built on")
   are stale pointers, not evidence this plan actually needs — every
   substantive claim attributed to them was independently re-verified
   against live code/config/items above.

## Split — two child items (ADR0020, mandatory, decided at plan time)

The item's own description names this split explicitly and gives the
reasoning: only ONE of the six scope items (the cli-spawn dispatch strip)
actually needs `mergeAfter: tsk-2ie5`; carrying that constraint on the
whole item would block the other five for no reason. Both children below
inherit this item's already-locked decisions (no `clarify`/`exploring`
repeat needed).

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
fgos add --title "Hand-edit .fgos/config.json: rename+move submit-assist-classify capacity into coding-domain ownership" --kind chore --risk medium --verify "node bin/fgos.mjs doctor && git show --stat HEAD | grep -qv '.fgos/config.json' && echo ok" --description "Direct main-checkout edit (ADR0020 — a fgw/<id> branch can never carry a .fgos/ change through fgos approve; precedent tsk-5ge/tsk-5vf/tsk-4eu, docs/how-to/fix-fgos-write-rejected-merge-block.md). Rename+move runner.capacities.submit-assist-classify so it resolves through DOMAINS.coding instead of as a bare global capacity id, mirroring getDomain(domain).skillMap.retrospective's precedent (0027 D5). Applied as a single-parent commit directly on main, never through this item's own fgw/tsk-5wz branch. CONFLICT NOTE: tsk-53n is live (status doing, stage executing) with the SAME footprint (.fgos/config.json) — do not start until tsk-53n's own .fgos/config.json edit has landed or this item's own diff is confirmed non-overlapping." --parent tsk-5wz --footprint ".fgos/config.json" --stage decompose --dir "$root"

fgos add --title "Rut nhanh dispatch cli-spawn cua submit-assist-classify sau khi doi ten" --kind chore --risk medium --verify "npm test && grep -L 'submit-assist-classify' .claude/skills/fgos-submit-assist/SKILL.md .claude/skills/_shared/capacity-dispatch-fallback.md" --description "Gated on tsk-2ie5 (mergeAfter) landing first: tsk-2ie5 builds fgos-researching's gather fan-out as the FIRST replacement cross-provider dispatch sample; stripping submit-assist-classify's own cli-spawn branch before that lands would leave the three-gate dispatch mechanism (registered -> present -> allowCrossProvider) with zero real exercising callers. After the config-rename sibling item lands, evaluate whether any of the four valid dispatch reasons (docs/history/two-layer-dispatch/DISCUSSION.md D2: cheaper model / different provider / resource isolation / parallelism) still applies to the renamed capacity; if none do, remove the cli-spawn branch from fgos-submit-assist/SKILL.md and, if that was capacity-dispatch-fallback.md's only remaining consumer, retire that shared fragment too." --parent tsk-5wz --footprint ".claude/skills/fgos-submit-assist/SKILL.md,.claude/skills/_shared/capacity-dispatch-fallback.md" --stage decompose --dir "$root"

fgos edit tsk-5wz --mergeAfter "" --dir "$root"
```

(the last call clears `mergeAfter` off the PARENT per the item's own
instruction — "item cha BỎ mergeAfter đi" — since only the second child
above actually needs it now.)

## Concrete cases to prove against (high-risk depth)

- Empty/boundary: a submit call from a live session where the ORIGINAL
  text was already clear (no rewrite) — clarify must still run and
  classify must still re-fire on the (unchanged) clean text, not skip
  silently.
- Existing behavior that must not regress: `dogfood-fixture:submit`'s
  fixed canonical text, replayed through a bare shell — byte-identical
  item record to today, zero LLM/model calls made.
- Concurrent/parallel: `tsk-53n`'s own live `.fgos/config.json` edit vs.
  this item's split-off config-rename child — the verify above requires
  confirming non-overlap before either proceeds.
- Partial failure: enum enforcement rejects a `kind`/`risk` value some
  existing skill/tool still emits unchanged — must fail LOUD at that call
  site's own test, never silently coerce, so the grep-all-callers step in
  the risk map is not skippable.

## Validating findings (fgos-coding-validating pass, real evidence)

Two commands originally written into this plan were wrong and have been
corrected on the live items (`fgos edit`) before this gate:
- `tsk-3fj`'s verify referenced `.fgos/config.json` and ran `fgos doctor` —
  both fail structurally in `fgos return`'s detached re-verify worktree,
  which never carries `.fgos/` (ADR0020, confirmed by reading
  `docs/how-to/fix-fgos-write-rejected-merge-block.md`'s own tsk-n4i-1/
  tsk-5vf fix examples). Narrowed to `npm test`, matching both precedents'
  own post-fix verify exactly.
- `tsk-5wz`'s own pre-existing verify point 7 asserted `fgos doctor` green
  after the rename — same structural problem, and now stale besides (the
  rename moved to `tsk-3fj`). Reworded to point at the sibling item instead
  of re-asserting an unprovable claim on this item's own branch.

Real evidence gathered for the highest-risk row (`work.mjs` kind/risk enum
enforcement), by grepping every `--kind`/`--risk` call site across
`.claude/skills/`, `plugins/fgOS/skills/`, `test/`, `bin/fgos.mjs`:
- Real `kind` values in use today: `bug`, `chore`, `design`, `feature`,
  `task` — `design` is NOT one of `classify.mjs`'s own `KIND_KEYWORDS`
  candidates (`bug`/`feature`/`chore`/`docs`); any new enum must include it
  or the call site that uses it breaks.
- Real `risk` values in use today: `low`/`medium`/`high` (the sane
  vocabulary) AND `heavy`/`light` (the TIER vocabulary bleeding through) —
  confirmed at two live sites, not hypothetical:
  - `test/cli/fgos.test.mjs:3407` — an EXISTING, PASSING test titled
    `submit --tier heavy --kind bug --risk heavy overrides all three
    fields regardless of classify(text)`, asserting `risk: "heavy"` is
    accepted today. This item's OWN verify point 2 already anticipates
    exactly this ("risk khong nhan duoc gia tri thuoc tu vung tier ...
    phai bi tu choi hoac normalize") — this test's assertion is the bug
    being fixed, so it is expected to change, not a plan gap. Named here
    so `fgos-coding-implement` updates this exact test rather than
    discovering the conflict mid-implementation.
  - `.claude/skills/fgos-coding-planning/SKILL.md`'s own `fgos add` worked
    example (line 211) uses `--risk light` — the SAME skill this plan was
    just written with conflates tier/risk vocabulary in its own canonical
    example. Not in the item's original file list; added here as a real
    finding — fix this example alongside the enum change so it does not
    keep teaching the exact anti-pattern this item removes.

## Implementation finding — the item's central premise was half wrong

Found at `fgos-coding-implement` time, while running the risk map's own
"grep every `--kind`/`--risk` call site before landing the enum" step.
Recorded here because it REVERSED this plan's verify point 2, and that
reversal was taken to the user rather than decided unilaterally (they chose
"theo code").

The item's BẰNG CHỨNG SỐNG reads `risk: "heavy"` as the tier vocabulary
leaking into the risk field. Source says the opposite — `light`/`standard`/
`heavy` IS the risk vocabulary, deliberately, with three independent
declarations:

| Where | Evidence |
|---|---|
| `src/intake/classify.mjs:92-94` | `// D5: risk is derived from the same keyword signal as tier (mirrors the tier name)` → `const risk = tier;` |
| `src/intake/plan.mjs:106-111` | `// D3(b): ... risk domain mirrors tier (classify.mjs), and 'heavy' is the one value that gates` → `const HEAVY_RISK = 'heavy'` |
| `src/state/priority-formula.mjs:15` | `RISK_DISCOUNTS = { light: 1, standard: 0.85, heavy: 0.6 }` |

Two of those are LIVE consumers, both outside this item's originally
declared footprint:
- `decompose.mjs:639` — `work.risk === 'heavy'` forces a root through human
  confirmation before it may split.
- `priority-formula.mjs:36` — `RISK_DISCOUNTS[risk] ?? RISK_DISCOUNTS.standard`.

Census of all 505 stored items:

```
risk:  standard 223 | light 140 | heavy 74     <- 437 items, the live vocabulary
       medium 32   | low 19    | high 17      <-  68 items, matching nothing
```

So the broken values are the OTHER 68 — `low`/`medium`/`high` silently skip
the decompose gate and collapse to the `standard` priority discount. The
`risk: "heavy"` this item cited as its evidence of a bug was correct; the
`risk: "medium"` the item itself carries was the actual defect.

Had verify point 2 been implemented literally, it would have silently
disabled a safety gate for 74 items — the exact "silently coerce" outcome
this plan's own "Concrete cases to prove against" forbids.

**Consequences for two earlier findings in this file:** both dissolve.
`.claude/skills/fgos-coding-planning/SKILL.md:211`'s `--risk light` is CORRECT
under the real vocabulary, not the anti-pattern this plan called it — left
unchanged. `test/cli/fgos.test.mjs`'s existing `--risk heavy` test was
likewise asserting correct behavior and still passes untouched.

**Not done here, deliberately:** the 68 legacy items are not migrated.
`validateWorkShape`'s `touchedFields` grandfathering (tsk-1ne D1/D2) keeps
them replaying and editable, matching Assumption 1 above. Whether to
backfill them is a separate call with its own blast radius — a real
follow-up, not a silent omission.

**Also not done here (user's call, asked and answered):** Approach step 6
(retire `fgos-submit-assist`) was deliberately skipped. `tsk-4ns` is already
built and awaiting merge against that exact file, and its verify greps that
file's content — deleting it would strand a sibling item's finished work.

## Outstanding questions

- Backfill the 68 items carrying a `low`/`medium`/`high` risk? Until then
  each one silently misses the decompose human gate and scores at the
  default priority discount. Needs its own item.
- Approach step 6 (`fgos-submit-assist` retirement) still unresolved — it
  becomes safe to revisit once `tsk-4ns` merges.
