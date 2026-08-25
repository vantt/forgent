---
type: explanation
title: state.decisions splits engine bookkeeping from cited design decisions
tags: []
source_capture_ids: [tsk-1ud, tsk-1lv]
authoritative_for: why state.decisions splits engine bookkeeping from design decisions, and how the canonical decision projection (docs/decisions/index.md, docs/specs/<area>.md narrative) is wired onto that same clean zone with no second store
---
# state.decisions splits engine bookkeeping from cited design decisions

`tsk-1ud` implemented steps 1 and 3 of decision D7: a two-zone contract
for where fgOS's design decisions live, and a real cleanup of the
machine-readable zone so a future agent-facing consumer can actually use
it.

## Two zones, two readers

D7's own contract: `state.decisions` is the authoritative zone for an
**agent** to read — short, evidence-bearing entries. `CONTEXT.md` is free
to optimize for a **person** — full narrative prose, unconstrained
markdown. `tsk-1ud` was a deliberate gate: no skill gets wired to read
`state.decisions` until this item's own cleanliness check passes.

## The measured gap that motivated it

Real counts against `.fgos/state.json`, 2026-08-09:

> "CONTEXT.md: 199 file, ~1.973 token/file (cao nhất 4.978), MỌI skill
> đọc (fgos-coding-planning/SKILL.md:14,48,66 đọc CONTEXT.md để lấy quyết định
> đã lock). state.decisions: 1.711 bản ghi, ~100 token/bản, 0 skill đọc
> — chỉ `fgos show <id>` và một bộ đếm."
> — real work item description, id `tsk-1ud`

Roughly a 20x cost difference per read, paid on every `clarify`/`planning`
pass, for a zone (`CONTEXT.md`) that could in principle be backed by the
cheaper zone (`state.decisions`) — except the cheaper zone wasn't clean
enough yet for anything to actually read it.

## What was actually wrong with the cheap zone

Of 1,711 real records, 592 (35%) were pure engine bookkeeping, not design
decisions at all — identifiable only by matching literal text prefixes
("discovery caller-supplied", "decompose verdict", "auto-approved",
"fgos-coding-validating verdict"), written by `addDecision` calls inside
`src/intake/discovery.mjs` and `src/intake/plan.mjs`. The remaining
1,119 (65%) were real design decisions, but 130 (12%) had no rationale
and 180 (16%) had a rationale under 80 characters.

## A correction that changed the item's own scope, made mid-investigation

D7's original rationale had claimed `store.mjs:835` didn't enforce a
rationale at write time. That claim was wrong, and the correction (event
log seq 10223) removed an entire planned step before implementation
started:

> "addDecision (`src/state/store.mjs:826-838`) CÓ validate: throw
> StoreError('validation') khi text hoặc rationale rỗng ... 130 bản thiếu
> rationale đều có ts từ 2026-07-16 đến 2026-07-29, ZERO sau 2026-08-01
> ⇒ DI SẢN CŨ, không phải lỗ hổng đang mở. HỆ QUẢ: bước 2 của D7 ('cưỡng
> chế rationale ở tầng store') KHÔNG CÒN VIỆC GÌ PHẢI LÀM."
> — real work item description (correction section), id `tsk-1ud`

The store already validated non-empty rationale on write; the 130
missing-rationale records were legacy data written before that
enforcement existed, not a live gap. The item's own scope shrank from
three planned steps to two (steps 1 and 3) as a direct result of
verifying this claim instead of trusting it.

## The two real fixes

1. **Separate engine bookkeeping from design decisions structurally, not
   by string-matching.** A new `kind: 'engine' | 'design'` field on the
   decision payload lets a consumer filter without prefix-matching. The
   item's own description names why this mattered: prefix-matching
   itself is the exact anti-pattern this whole investigation was
   critiquing elsewhere in the same code
   (`gate.ask.includes(<literal>)` in `decompose.mjs:638,646`) —
   reproducing it here to fix a different instance of the same problem
   would have been self-defeating.

2. **Require design decisions to cite checkable evidence.** A rationale
   must reference a `file:line`, an event `seq`, or a real measurement —
   an opinion with no citation isn't evidence. Enforced only forward from
   2026-08-01 (the point at which the legacy gap had already gone quiet)
   — the legacy 130/180 records were explicitly left alone; the log is
   append-only, and rewriting history wasn't attempted.

## The recurring failure pattern this item exists to stop

The item's own description names three separate instances of the same
shape, observed across one investigation, before deciding this couldn't
be left as a fourth:

> "Ba lần trong cùng phiên thảo luận đã thấy mô-típ 'ghi trước, nối dây
> sau' mà dây không bao giờ được nối: quy ước `## Outstanding questions`
> (skill không biết nó tồn tại đến `tsk-5hg`), `askHistory` (314 entry,
> 184KB, 0 nơi đọc), `state.decisions` (1.711 bản, 0 skill đọc). Item
> này tồn tại ĐÚNG để chặn việc lặp lại — nó là cổng, không phải một
> bước song song."
> — real work item description, id `tsk-1ud`

A data-writing convention with no consumer wired to read it is easy to
create by accident (each of the three examples above shipped correctly
on its own terms) and easy to miss until someone goes looking for who
actually reads it. This item's own gate — clean the zone *before* letting
anything depend on it, verified by a real mechanical check counting
`kind` coverage and citation coverage — is the shape chosen specifically
to make a fourth recurrence structurally harder, not just noted as a risk.

## What deliberately stays out of scope here

Wiring `fgos-coding-planning`/`fgos-coding-validating` to actually read
`state.decisions` instead of `CONTEXT.md` (the payoff this cleanup makes
possible) is a separate, hard-dependent follow-up item — this item only
makes that future read safe, it doesn't perform it. Rewriting
`CONTEXT.md`'s own authoring convention is D7's own step 6, also
separate.

## The follow-up that used this clean zone (`tsk-1lv`)

`tsk-1ud` predicted its own scope shrinkage would leave a wiring follow-up
for later — `tsk-1lv` (canonical decision projection) is that follow-up,
answering a broader complaint: too many rules/decisions/docs go stale and
contradict each other, with agents scanning up outdated decisions even
after a newer one supersedes them.

**No second source of truth.** `tsk-1lv` explicitly rejected building a
stored graph or a daemon to track document/decision staleness:

> D2: Không xây stored graph/daemon riêng cho bài toán doc/decision
> staleness -- consistency derive tại thời điểm ghi (write-time sweep)
> và tại thời điểm đóng việc (close-time door), không phải một graph lưu
> trữ song song

A second source of truth is exactly the failure mode this whole area
exists to eliminate — consistency is derived live, at write time and at
close time, never cached into a competing store.

**Wire the existing zone, don't add a third one.**

> D3: KHÔNG xây decision-store mới -- fgOS đã có sẵn store hợp nhất
> state.decisions... Việc cần làm là WIRE các bề mặt doc (CONTEXT.md
> Locked-Decisions table, docs/specs) vào đây

This is the direct continuation of the gate above: `state.decisions` was
cleaned specifically so something could finally depend on it; `tsk-1lv`
is that something, classifying three kinds of decision that map onto it
(machine bookkeeping — already `kind: engine`, unchanged; item-level
design decisions — already written via `fgos decision --id`, only the
*rendering* of `CONTEXT.md` from that store was missing; and a genuinely
new case, platform/repo-wide decisions, needing a new `scope`/`area`
field written via `fgos decision` with no `--id`).

**Retiring the one-file-per-decision ADR corpus.**

> D5: Retire docs/decisions/*.md corpus (1 file/quyết định kiểu Nygard,
> 35 file) -- narrative dài dồn vào docs/specs/<area>.md... state.decisions
> giữ record ngắn... file ADR riêng không còn là nguồn quyền uy

The long-form ADR-style files stop being the authoritative narrative;
`docs/specs/<area>.md` (which already existed, serving the same role as
an upstream reference project's `docs/knowledge/areas/`) absorbs the long
narrative, while `state.decisions` keeps the short evidence-bearing
record as the real source. `docs/decisions/index.md`, mentioned at the top
of this repo's own `AGENTS.md`, is the generated projection this decision
made possible.

**Find-before-create extended to the whole Diataxis doc layer, then
narrowed again.** `tsk-1lv` initially widened its own design (D6/D8) to
also govern how `fgos-coding-compounding` decides whether to grow an
existing end-user doc or create a new one — but a later self-correction
(D14) pulled that claim back to its actually-proven scope:

> D14: D8's authoritative_for CHỈ giải đúng 'trùng chủ đề TRONG một
> subject-space đã định nghĩa rõ' -- KHÔNG mở rộng claim sang audience/area
> như một trục độc lập, vì trục đó CHƯA TỒN TẠI trong schema hiện tại

Diataxis (tutorial/how-to/reference/explanation) only resolves the
*perception* axis of a document, never its *audience/scope* axis — a
different, still-unsolved problem tracked separately (`tsk-28x`). Claiming
D8 had solved audience-scoping too, before that axis even existed in the
schema, would have overclaimed; the correction keeps D8 honestly limited
to what it actually proves: deduplicating within an already-defined
subject-space.

**A real coordination finding caught before merge, not after.** While
reviewing a sibling item before its own merge, the driving session found
`tsk-1lv`'s branch had independently rewritten
`scripts/check-decision-citation-drift.mjs` in a way that silently dropped
the entire bare-citation-gloss/baseline-ratchet mechanism `tsk-37i`
(this doc's own sibling, see `docs/explanation/
why-fgos-citations-carry-a-gloss-and-check-mechanically.md`) had just
built and gotten merged to main — with zero mention of that mechanism
anywhere in `tsk-1lv`'s own planning docs, meaning it looked like an
unconsidered side effect of a full-file rewrite rather than a deliberate
retirement. This was flagged explicitly before merging, exactly the kind
of live cross-branch collision the coordination decision (D9, splitting
scope between `tsk-1lv` and `tsk-37i`) existed to prevent, caught here
because the two branches' actual diffs were compared directly rather than
assuming the earlier scope split still held once both had drifted.

**Live confirmation of the fold-into-spec convention (`tsk-1fp-6`).** A
later, unrelated item (superseding `docs/specs/distribution.md`'s install
entry-point law) had been planned three hours and twenty minutes *before*
D5's retirement actually merged, still assuming the old convention (write
a new numbered `docs/decisions/00NN-*.md` file). Caught on a re-scan for
drift before executing, its footprint and description were corrected to
the real, current mechanism instead: fold the superseding decision into
the target spec's own body — a `decisions:` frontmatter array entry at the
top of the file, plus inline narrative near the specific rule being
superseded — never a new standalone decision file. The item's intent
stayed valid throughout; only the mechanism needed correcting once the
timing gap was noticed.

**D2/D3 shipped as real code (`tsk-1lv-1`).** `fgos decision` now requires
a `--relation` argument, and the write-time consistency sweep (D2: derive
consistency at write time, never a stored parallel graph) widened its own
scan scope from just `docs/backlog.md` + `docs/specs/*.md` to the full
`docs/**` + `src/**` + `plugins/**` tree, on the existing store (D3: no new
decision-store, upgrade the one that already exists).

**D4's platform-level case shipped too (`tsk-1lv-2`).** `state.decisions`
gained a `scope`/`area` field for the platform/repo-wide case D4 named,
and `docs/decisions/index.md` — the generated projection AGENTS.md points
readers at today (`fgos decision-index`) — is real: the `docs/decisions/`
directory itself persists (mirroring the upstream project's own standing
exemption for a directory that would otherwise be retired), but the only
file inside it is that one generated index.

**The actual read side closed the loop this doc opened (`tsk-1lv-3`).**
This document's own earlier section ("What deliberately stays out of
scope here") named wiring a skill to actually read `state.decisions`
instead of hand-typed `CONTEXT.md` prose as `tsk-1ud`'s deferred payoff.
This item is that wiring: `CONTEXT.md`'s Locked-Decisions table now
renders from `state.decisions` itself, applied to all three skills that
write a `CONTEXT.md` (`fgos-coding-exploring`, `fgos-coding-planning`,
`fgos-coding-shaping`), not just the one `tsk-1ud` had originally scoped
for.

**D5's retirement itself shipped as `tsk-1lv-4`.** All 35 files of the
`docs/decisions/*.md` corpus were retired: their narrative folded into
the relevant `docs/specs/<area>.md`, `state.decisions` kept as the short
real record, and `docs/decisions/` itself persists as a directory holding
only the generated `index.md` (this is a separate retirement from
`docs/history/<feature>/` shaping records, which are cleaned up on their
own, unrelated schedule by `/fgOS:cleanup-next`).

**The 4-door check landed too (`tsk-1lv-5`)** — the source of every
`retrospective-door-freshness`/`retrospective-door-routing`/
`retrospective-door-docDeferral` advisory friction entry a retrospective
sweep produces. It runs harness-only, inside the existing `bin/fgos.mjs`
`case 'retrospective'` call (the same sweep every `/fgOS:retro-next`
iteration already runs), never gating `fgos approve` and never touching
any skill's own prose — applied to every item in the batch uniformly,
with no risk-tier exemption (D11: doc-rot doesn't distinguish tier, so
neither does the check).

**Find-before-create shipped as `authoritative-match` (`tsk-1lv-6`)** —
the `fgos authoritative-match --quadrant <quadrant> --topic <topic>`
command a retrospective synthesis runs before deciding whether to grow an
existing Diataxis document or create a new one, used throughout every
doc-synthesis capture cited in this document (and its siblings). D8's own
two-layer design is why this exists as a callable command rather than a
gate: the doctrine half (`fgos-coding-compounding`'s own step 3 telling a
session to check `authoritative_for` by topic before choosing a path) and
the harness backstop half (the mechanical check this command performs)
are separate, deliberately never fused into one live gate function called
at write time — the repo's own precedent for that trap is named directly:
an upstream project built exactly that (`scribingTarget()`) and later
abandoned it as dead surface. D12 shapes the matching itself as
skeleton-match (normalize/lowercase/accent-strip/confusable-fold/
punctuation-collapse string comparison, not real semantic search — the
upstream precedent's own admission that even their more advanced layer
still groups by skeleton, never embeddings), implemented as a swappable
port/adapter (mirroring the existing `CTR009 executor.v1` contract shape
already in the repo) specifically so a future, smarter matching strategy
could replace it without any caller needing to change. D6 is the other
half of this same piece: `fgos-coding-compounding`'s previously-absolute
"never delete, shorten, restructure" rule was loosened to allow reconciling
prose a newly gathered capture genuinely contradicts — a targeted
correction, never a license to prune content the new capture doesn't
actually contradict.
