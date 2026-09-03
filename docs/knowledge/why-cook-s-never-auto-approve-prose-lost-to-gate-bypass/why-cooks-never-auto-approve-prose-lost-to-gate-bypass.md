---
type: explanation
title: Why cook's "never auto-approve" prose lost to gate-bypass
tags: [cook, gate-bypass, fgos-coding-exploring, fgos-coding-planning, fgos-coding-validating]
source_capture_ids: [tsk-104]
framework: diataxis
mode: explanation
---
# Why cook's "never auto-approve" prose lost to gate-bypass

**Superseded (tsk-2tk):** at the time this capture was written,
`fgos-coding-planning` still owned its own `planApprove` gate and
`canAutoApproveValidate` was the function driving `fgos-coding-validating`'s
gate. `coding-planning-validating-gate-redesign/CONTEXT.md` D9-D11 later
removed `fgos-coding-planning`'s gate entirely and deleted
`canAutoApproveValidate`, replacing it with `canAutoApproveMergedGate` at
the one merged gate `fgos-coding-validating` now owns. The events below are
told as they happened, at that time.

`plugins/fgOS/skills/cook/SKILL.md` used to overclaim in two places — its
frontmatter `description` ("Pauses for real human approval at every
dev-skill gate ... never auto-approved") and its Hard rules bullet
("Never auto-approve a gate"). Both directly contradicted the Gate
sections inside `fgos-coding-exploring`, `fgos-coding-planning`, and `fgos-coding-validating`
themselves, which each checked `canAutoApprove`/`canAutoApproveValidate`
first and skipped their own question when the repo's configured
gate-bypass level covered it (`docs/history/gate-bypass/CONTEXT.md`
D1-D6).

Confirmed live, repeatedly, at the time: `readGateBypassLevel` returned a
real configured level in this repo, and `canAutoApprove`/
`canAutoApproveValidate` legitimately returned `true` for real items —
several items in the same instability scan (e.g. `tsk-2ew`, `tsk-3k2`,
`tsk-2wpi`) cleared their plan/validate gates without ever asking a
person. `cook`'s own hard-rule prose said that should never happen.

## Which side was authoritative, and why

Resolved by git history, not by guessing: `cook`'s "never auto-approve"
hard rule shipped in `94f314e` (2026-07-28, the commit that created
`cook`). `gate-bypass` shipped the very next day, `8aaacee`
(2026-07-29), with its own decision record, a fail-closed
implementation, and a structured audit trail
(`fgos gate-approve --actor bypass`). `cook`'s line was stale prose
written before `gate-bypass` existed and never updated afterward — not a
deliberate policy choice to always ask regardless of the repo's own
configuration.

## What the fix actually changed

`cook`'s own downstream flow description needed no change: it already
said correctly that "every real gate a stage-skill hits along the way
... still surfaces exactly as before — the driver invokes those skills
unchanged, it does not swallow or pre-answer their own gates." `cook`'s
driver never bypassed anything itself — the auto-approve logic has
always lived entirely inside each dev-skill's own Gate section, which
`cook` faithfully invokes either way. The fix brought the top of the
file (frontmatter description, hard rules) in line with what the bottom
already said, rather than inventing new behavior: the frontmatter then
read "auto-approves when the repo's configured gate-bypass level covers
it, otherwise pauses for real human approval," and the hard rules bullet
then read "Never bypass a gate beyond what its own dev-skill already
permits," naming the same `canAutoApprove`/`canAutoApproveValidate`
mechanism instead of contradicting it (both since re-worded again by
`tsk-2tk` to match the merged-gate architecture — see the superseded note
at the top of this doc).

## Cost of leaving it unfixed

Two-sided: read literally, `cook`'s old prose meant up to 3 redundant
human interruptions per item and made the entire gate-bypass feature
effectively dead code whenever a session followed `cook`'s own stated
contract instead of the dev-skills' real behavior. Read the other way,
`cook`'s self-published contract (including its own description) was
simply wrong to any user reading it. Hit directly in `tsk-36i`: the gate
legitimately evaluated to auto-approve, but the session followed `cook`'s
prose and asked a person twice anyway, against the repo's own configured
policy.

## Related

- `docs/history/tsk-104-cook-gate-bypass-prose-reconciliation/CONTEXT.md` —
  the full decision record (D0: root cause; D1: authority by git history;
  D2: only the top of the file needed to change; D3: no `.agents/skills`
  mirror needed).
- `docs/history/gate-bypass/CONTEXT.md` — gate-bypass's own design (D1-D6).
