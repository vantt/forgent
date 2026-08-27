---
type: explanation
title: Why intake classification moved to after clarify, and back to the owning domain
tags: []
source_capture_ids: [tsk-5wz]
framework: diataxis
mode: explanation
---
# Why intake classification moved to after clarify, and back to the owning domain

`tsk-5wz` redesigned where and when `fgos submit`'s free-text classification
(`tier`/`kind`/`risk`) actually happens, closing two separate gaps found
in the same investigation.

## The problem: the same text got read twice, and the earlier read had worse input

Intake used to spend a "soul pass" — a live session actually reading the
raw text — on the same free-text ask twice, on opposite sides of `fgos
submit`, with the earlier read working from worse input:

- **Before submit**: `fgos-submit-assist` classified `tier`/`kind`/`risk`
  against the raw, messy ask, optionally dispatching to a
  `submit-assist-classify` executor.
- **After submit, at `discovery`**: `fgos-clarifying` read the *same* text
  again, understood intent, and was already permitted to rewrite
  `title`/`description` in place (D14).

The clean version of the text only existed *after* classification had
already run against the messy one.

## Why the fix isn't "just remove the duplicate work"

Three separate pieces of evidence, gathered before deciding a shape:

1. **`src/intake/classify.mjs` already declares itself LLM-free** — `fgos
   submit` already has a fast, mechanical path (`deriveTitle` + a keyword
   table), so the fast lane already existed; it didn't need building.
2. **`fgos-clarifying`'s own `SKILL.md` explicitly bans re-dispatching
   work a live session already holds context for** (Native-First rule 2:
   "a live, same-provider soul already holds full context ... spawning a
   subagent to re-derive it from less context is pure overhead") — and
   the classify step this item touches was doing exactly that,
   contradicting its neighbor skill's own stated rule.
3. **`kind`/`risk` had no enum in code at all** (`src/state/work.mjs:261`
   and `:334` only ran `requireNonEmptyString`) — the entire
   bug/feature/chore/task vocabulary lived only inside one skill's prompt
   text, while the sibling field `TIERS` (`work.mjs:145`) was a real
   global enum shared by every domain. Two adjacent fields, one over-tight
   (global, shouldn't be), one over-loose (no enum, should have one).

## Live evidence, caught at the exact moment this item was filed

The mechanical classifier's own live output on `tsk-5wz` itself proved
the looseness was real, not theoretical:

> "Bộ phân loại cơ học của `fgos submit` gán cho item này: `kind: "bug"`
> (sai hẳn, đây không phải bug), `risk: "heavy"` ("heavy" là giá trị của
> TIER, lọt thẳng vào field RISK), `tier: "heavy"` (đúng). Kiểm chéo
> `tsk-5ui`: cùng kiểu, `risk: "standard"`. KHÔNG phải một lần lỡ — không
> có gì chặn cả, vì `risk` chỉ là chuỗi tự do."
> — real work item description, id `tsk-5wz`

A `tier` value (`heavy`/`standard`) leaking straight into the unrelated
`risk` field, on two separate real items, with nothing in the schema to
catch it — this became a required regression test for the fix itself,
not just illustrative color.

## The shape that resolved both gaps

- `fgos submit` stays exactly as it was: mechanical, no LLM call,
  deterministic — the dogfood replay fixture and cron path both depend on
  this staying true.
- A live-session wrapper around `/fgOS:submit` (only when actually run
  inside a live session — Native-First Dispatch, `tsk-27y` D1/D2) now
  continues straight into `discovery` in the *same* session: `fgos-clarifying`
  cleans up intent and rewrites `title`/`description` first (staying
  domain-agnostic, per 0027 D5's "never hardcode a domain into a shared
  rung"), *then* the item's own domain-resolved classifier re-judges
  `tier`/`kind`/`risk` against the now-clean text — the same
  domain-resolution pattern `/fgOS:retro-next` already uses for its own
  synthesis-skill lookup, never hardcoded.
- The no-soul path (bare shell, cron, `dogfood-fixture:submit`, another
  agent) is untouched: keyword-derived values stand until `discovery`
  runs later, byte-identical to before this item.
- `submit-assist-classify` — previously a bare *global* executor —
  becomes the coding domain's own classifier, declared through `DOMAINS`
  instead of floating as an unowned global id (this half is the piece
  `tsk-3fj` carried out as its own child item, later found to have no
  real remaining dispatch consumer and retired entirely by `tsk-4ns`/
  `tsk-49u` — see
  `docs/explanation/coding-classify-intake-executor-lifecycle-created-then-retired-as-dead-config.md`
  for that full follow-on story).
- `DOMAINS[domain]` gains a real classification vocabulary declaration
  (valid `kind`/`risk` values, a `tier` rubric) so a second domain can't
  scribble arbitrary strings into either field the way coding's own
  classifier prompt used to be the *only* place that vocabulary lived.

## What stayed explicitly out of scope

Three adjacent problems found during the same investigation were filed as
separate items rather than folded in: making `fgos-researching`'s gather
fan-out a real executor, a dead `executors.judge` config entry with
`judge-decompose`'s cli-spawn path missing `Read`, and `sensitiveData`
(locked at D7 of `agent-executor-submit-assist-classify` but never
shipped). Bundling unrelated fixes into an already-heavy redesign was
judged worse than filing them where they could be evaluated on their own
evidence.

## Why the `.fgos/config.json` edit had to be split out at plan time, not merge time

This item touched `.fgos/config.json`, which a `fgw/<id>` branch can
never carry through `fgos approve` (ADR0020's `fgos-write-rejected`
guard — `docs/how-to/fix-fgos-write-rejected-merge-block.md`). Rather
than discovering that at merge time the way earlier items had
(`tsk-4eu`), this item's own plan pre-emptively split the config edit
into its own child from the start, and further separated that child's
`mergeAfter: tsk-2ie5` dependency from the rest of the item — only the
piece retiring `submit-assist-classify`'s dispatch branch (removing a
gather-fallback's cross-provider proof surface before a replacement
existed) genuinely needed to wait; the rest of the redesign (mechanical
submit staying unchanged, the discovery continuation, domain vocabulary
declaration, `fgos-submit-assist`'s own step reduction) had no real
dependency on `tsk-2ie5` and merged as soon as it was ready.
