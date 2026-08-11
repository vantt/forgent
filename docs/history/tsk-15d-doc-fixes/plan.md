# tsk-15d — Sửa ba dòng đọc ngược với D-ID đã khóa

Mode: tiny

Flags checked against `fgos-routing`'s Mode gate (auth, authorization, data
model, audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof around the area, multi-domain): **0
apply**. Pure prose edit in two markdown files, no code path touched, no
tests exercise these sentences. → tiny.

## Source of locked decisions

This item has no `CONTEXT.md`/`fgos-coding-exploring` pass of its own — it is a
doc-fix task anchored into `tsk-5td`'s coding-shape discussion
(`docs/history/dispatch-concept-boundary/DISCUSSION.md`, branch
`fgw/tsk-5td`, not yet merged to `main`). The three fixes below and their
D-ID citations (D1, D3) come straight from that file's §4 (locked
decisions) and §7.4 (`#task-doc-fixes`), read via `git show
fgw/tsk-5td:docs/history/dispatch-concept-boundary/DISCUSSION.md` since
that path doesn't exist on this item's own `main`-based branch yet.

## Approach

Three independent one-line-scale prose edits. No split — one honest piece
of work, each fix touches a different exact spot, no ordering dependency
between them.

### Fix 1 — `docs/explanation/why-fgos-dispatch-splits-into-gather-packets-and-a-gated-exec-packet.md`

Two lines, not one — the description named line 64 but the same wrong
framing also sits in the section heading right above it (both found by
`rg -n "orthogonal"` on this file):

- line 60 (heading): `## What did ship: dispatch reframed as two orthogonal axes, not three discrete kinds`
- line 64 (body): `*how*) along two orthogonal axes: does this unit of work carry a real`

D1 (locked): the criterion is *authority + state effects*, not two
independent/orthogonal dimensions — it is a **two-tier tree** (a
`rootTask` can never itself be `gather`, so the two questions are not
independent). Rewrite both to say two-tier/hierarchical instead of
orthogonal-axes, preserving the rest of each sentence's meaning (L1
decides what+who, L2 infers how — that part is untouched, only the
"orthogonal axes" framing goes).

### Fix 2 — `kind` labeled "transport"

**Scouted, found nothing to fix.** Exhaustive search (`rg -rn "transport"`
and `rg -rn "protocol"` across `docs/specs/`, `docs/explanation/`,
`docs/reference/`, plus `kind`-adjacent schema descriptions in
`src/cli/command-registry.mjs`) turns up zero locations on this branch
where `capacity.kind` (values `cli`/`binary`/`mcp`/`skill`/`http`/`task`)
is actually labeled "transport" or "protocol". Every real hit for the word
"transport" in this repo's docs is the *other*, unrelated, correct sense
(I/O transport: `--github` merge transport, a future web/chat listener
transport, the event-log write-queue) — none of it is `kind`'s own label.

Cross-checked against `fgw/tsk-5td`'s own `DISCUSSION.md`: the "transport"
label being killed there (§9, §D3) was the *user's own spoken suggestion
mid-conversation* ("kind thật ra nên gọi là transport hoặc protocol") that
the discussion argued down to "provider kind" — never a label this
repo's own docs/code actually carried. There is nothing to edit for fix 2
on `main`.

### Fix 3 — `docs/specs/system-overview.md:31`

Line reads: `| Work item (`work`) | Đơn vị việc **duy nhất** của
forgent... |`. Per the item's own instruction and D7/D8 (locked on
`fgw/tsk-5td`): this line is **already correct** — `work` is confirmed as
the one T2 value actually persisted, the debt this line once carried is
paid off. **No edit.** This plan section exists only so a later session
doesn't go "fix" it by mistake, per the item's own explicit ask.

## Assumption pinned (not a person-decision — verify-scope narrowing)

The item's own `verify` field reads `rg -n "orthogonal" docs/ => 0`
(zero hits across the *entire* `docs/` tree) — copied verbatim from the
shaping session's own draft verify in §7.4. Taken completely literally
this is unreachable without also rewriting ~15 other files that use
"orthogonal" in its ordinary, correct English sense (e.g. "`stage` is
orthogonal to `status`" — a real, unrelated, already-locked design fact
in half a dozen `CONTEXT.md` decision records), which the item's own
numbered list never asks for and D1 never argued against.

Pinned as an implementation-detail assumption, not escalated to a person:
the item's description names exactly one file/line pair for fix 1, so the
verify this plan actually proves is scoped to that one file:

```
rg -n "orthogonal" docs/explanation/why-fgos-dispatch-splits-into-gather-packets-and-a-gated-exec-packet.md => 0
```

This is a narrower proof of the same locked intent (D1), not a scope
change to what gets built — nothing else in the item's numbered list
depends on the broader reading, and rewriting unrelated, correct sentences
elsewhere in the docs tree would be actively wrong.

## Proof surface

- `rg -n "orthogonal" docs/explanation/why-fgos-dispatch-splits-into-gather-packets-and-a-gated-exec-packet.md` → 0 (fix 1)
- `rg -rn "\"transport\"\|'transport'\|kind.*transport" docs/specs docs/explanation docs/reference src/cli/command-registry.mjs` → 0 (fix 2, already true before this item — recorded not re-broken)
- `git diff docs/specs/system-overview.md` → empty (fix 3, explicitly no-op)
- `npm test` → green (per item's own verify, full suite since this is a
  doc-only change with no targeted subset)

## Impact-analysis capability gate

Not applicable — no code symbol is modified, only prose in two markdown
files (one of which ends up untouched). `impact-analysis: inactive` for
this item's own scope; not a gap.

## Risk map

| Component | How risky | What would prove it |
|---|---|---|
| Fix 1 wording | Low — pure prose, no consumer parses this sentence | `rg` for "orthogonal" in that file returns 0, `npm test` unaffected |
| Fix 2 (no-op) | Low — risk is a false negative (missing a real spot) | Search already exhaustive across docs/specs, docs/explanation, docs/reference, and the one code file (`command-registry.mjs`) that documents `kind`'s enum; nothing found |
| Fix 3 (no-op) | None — explicitly must NOT change | `git diff` on that file stays empty |

## Outstanding questions

None
