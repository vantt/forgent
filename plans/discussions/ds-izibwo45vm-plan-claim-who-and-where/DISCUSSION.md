---
id: ds-izibwo45vm
title: "Claiming a plan: who runs it, on which machine, recorded on main at once"
status: open
source:
  - p-p5k2htczq3
created: 2026-11-27
---

discussion: open

## 1. Trạng thái hiện tại

Opened 2026-11-27 at the owner's request ("bật shaper thảo luận vụ claim plan"). Nothing is settled yet.

Round 1 (2026-11-27, shaper scout) split the topic in two:

- **Durability:** an admission commit always reaches origin, or it does not count. The mechanism to finish one's own
  unpushed commit already exists in the land door (37e4ee719, 2026-11-25), but it did not fire in the incident. Why
  it did not is still open (row D3 below) and needs fg-server's land logs. No owner choice is needed; the planner
  diagnoses that before designing.
- **Placement:** which machine may admit which plan. This is the owner's call, parked as **q-xub4gdaonb** (Q1). The
  shaper recommends A: the first machine whose admission push reaches origin claims the plan, and admission writes
  `host`.

Open: q-xub4gdaonb.

## 2. Mục tiêu & đề bài

When a plan moves to `running`, every machine must see at once who runs it and on which machine, so that no other
machine starts it and no admission can sit unpushed on one machine's local main. Today admission (`admit` in
`apps/fgos/src/wiring/supervision.rs`) writes `status: running`, `lead` and `base` through `admitted_text`
(`packages/supervision/rust/src/portfolio.rs`) and publishes the file through the paths land of a head's
`session write` (`apps/fgos/src/wiring/session_write_publish.rs`), which commits and pushes.

## 3. Vấn đề rõ / chưa rõ

| Item | State | Evidence |
|---|---|---|
| An admission commit can stay on local main without its push: the keeper's `docs(keeper): write plans/261127-1220-confined-rust-offline/plan.md` (ded8d6557) sat about 10 minutes unpushed and refused every land on fg-server (`land-target-ahead`) | observed | land logs 2026-11-27 14:33-14:44; a session pushed it by hand, then reverted it (03888152b) because the plan was not fg-server's |
| D1. How the commit got stranded: a paths land commits on local main **before** it pushes. A push the remote rejects is undone, but a push that fails with no answer (`land-remote-outcome-unknown`, or the process killed or cut off from the network) keeps the commit "for the next land's sync to find" | observed | `paths_attempt` / `push_local` in `packages/supervision/rust/src/land.rs` (comment "A push that failed without an answer may have reached the remote: that commit stays"); reflog shows ded8d6557 as a plain `commit:` entry at 14:32:22 that never moved origin |
| D2. A later land already pushes such an orphan, but only if (a) it holds the merge slot, and (b) the Git WAL still holds a `ScopedCommit` record showing that the commit came from this main checkout. Any other ahead commit is refused as `land-target-ahead` | observed | `sync_target` (`pushed_orphan`) in `packages/supervision/rust/src/land.rs`; `main_checkout_scoped_commits` in `packages/git/rust/src/inspect.rs`; commit 37e4ee719 "finish unpushed land-door commit with retained provenance and slot check" (2026-11-25) |
| D3. Why D2 did not fire for ded8d6557 on fg-server for about 10 minutes. Candidates: fg-server's activated release predates 37e4ee719; the WAL chain was not retained; or the lands that met it did not hold the merge slot at sync. Admission's own catch-up (`catch_up_once` → `BranchAhead` → `write-branch-ahead`) refuses before any slot is taken | open — diagnose, not an owner question | needs fg-server's `.fgos/runtime/land/*.log` around 14:32-14:44 and its activation digest; this session runs on another machine and has no access to them |
| D4. Admission never starts a lead on a failed publish (`admit` returns the refusal before the lead start), so a stranded admission is a held plan, not a double run on its own machine. The risk is cross-machine: other machines cannot see the claim, and this machine's other lands are blocked | observed | `admit` in `apps/fgos/src/wiring/supervision.rs:824-880` |
| The plan record names the lead (`lead: head:lead-forgent-…`) but not the machine | observed | `admitted_text` sets status, lead, base only |
| Which machine may admit which plans (fg-server: its assigned plans; fg-server2: the rest) is held only by people and session notes, not by the system | open — **q-xub4gdaonb** (Q1): A first machine to admit claims it (recommended), B assigned when the plan goes ready, C both | owner, 2026-11-27: "máy này chỉ làm các plan đã được giao"; no plan field or config key names a machine (`admitted_text`, plan-v1 frontmatter) |
| Seed proposal from the session: admission also writes the machine (`host`), the plan contract accepts it, and a write that finds its own earlier write unpushed pushes it first (never another writer's) | proposal, not decided. Its second half already exists in the land door (D2); the work is to make it reach admission's catch-up and to find why it missed (D3), not to add a second mechanism (L10) | — |

## 4. Quyết định đã chốt

| ID | Decision | Date | Source |
|---|---|---|---|

## 5. Q&A log

- 2026-11-27 15:20 (+07) — shaper round 1: scouted admission, the paths land, and the orphan-push mechanism (D1-D4).
  Asked the owner Q1, placement rule, as q-xub4gdaonb.

## 6. Thiết kế đã chốt {#design}

## 7. Danh mục hạng mục / task {#tasks}
