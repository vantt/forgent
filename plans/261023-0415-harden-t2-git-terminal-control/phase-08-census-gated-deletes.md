---
phase: 08
title: "Census-gated drain deletes (legacy worktree:{root} acceptances, compat fields, v1 compact receipts), the Q3 spec sentence, the Q4 Node arms"
status: pending
depends_on: [05]
parallel: "with phase 07 (disjoint files)"
effort: ~0.5d plus the owner-machine census answer
net_size: "Node −12 / Rust −110 / tests −40 (estimate; Rust part only if every machine's census reads zero)"
---

# Phase 08 — Census-gated deletes

## Context

Arbitration D8 (Q1–Q4 decided by the big lead), red-team "unsafe deletions" (the live `wal.rs:346-355` form is not touched; a census on every machine running fgOS first), owner decision 1 (drains live one release; these were written 10-19, three releases ago). [plan.md](plan.md) D-T2-8 (census timing: the owner-machine census is asked in the owner batch **before** this phase merges; the guide re-runs it as a hard stop).

Writers: the legacy path-only resource set `worktree:<root>` for ScopedCommit/Sync was last written by builds before `869e789d7` (2026-10-19 18:15 +07), which introduced `worktree:<root>:custody:<lock>` (`scoped_commit.rs:325-337`). Compact ledger v1 is written by no current code (`wal.rs:2217` writes v2/v3). A census stays clean only while no release older than `869e789d7` runs against a repository: the census therefore also lists, per machine, the activated release of every workspace, and any release built before that commit (or any repository a pre-`869e789d7` checkout still runs fgOS from) blocks slices A and C. <!-- Updated: Red Team 2026-10-23 -->

## The census (read-only; this machine by the lead, the owner machine through the owner batch and again in the guide)

```sh
node -e '
const fs=require("fs"),path=require("path"),cp=require("child_process");
const roots=cp.execFileSync("find",[process.env.HOME,"-xdev","-type","d","-path","*/fgos/git/operations","-prune"],{encoding:"utf8",maxBuffer:1<<26}).split("\n").filter(Boolean);
const kindOf=k=>typeof k==="string"?k:Object.keys(k??{})[0];
const keys=["legacyScopedOrSync","ledgerV1","unreadable"];const tot={wals:0};for(const k of keys)tot[k]=0;
for(const ops of roots){const git=path.dirname(ops);const o={wal:git};for(const k of keys)o[k]=0;tot.wals++;
 for(const id of fs.readdirSync(ops)){let r;try{r=JSON.parse(fs.readFileSync(path.join(ops,id,"00000000.json"),"utf8"))}catch{o.unreadable++;continue}
  const i=r.phase&&r.phase.data||{};const k=kindOf(i.kind);const rs=i.resourceSet||[];
  if((k==="ScopedCommit"||k==="Sync")&&rs.length===1&&/^worktree:/.test(rs[0])&&!rs[0].includes(":custody:"))o.legacyScopedOrSync++;
}
 const c=path.join(git,"compacted");for(const f of fs.existsSync(c)?fs.readdirSync(c):[]){if(f.startsWith("."))continue;const p=path.join(c,f);let x;try{x=JSON.parse(fs.readFileSync(p,"utf8"))}catch{o.unreadable++;continue}
  if(x.v===1)o.ledgerV1++;}
 for(const k of keys)tot[k]+=o[k]; if(keys.some(k=>o[k])) console.log(JSON.stringify(o));}
console.log("TOTAL",JSON.stringify(tot));' </dev/null
```

It prints one line per WAL that has anything non-zero, then a `TOTAL` line. A person (the lead here, the owner-machine agent there) marks each printed WAL as **scratch** (a benchmark or test fixture under `.fgos/runtime/tmp/`, `~/.cache/`, an agent job's `tmp/`, or a `forgent-worktrees/<lane>/` bench root; no release runs there) or **real** (a project fgOS operates on).

**Dry run here, 2026-10-23 (main `576fdb076`, this exact script):** `TOTAL {"wals":565,"legacyScopedOrSync":0,"ledgerV1":0,"unreadable":0}`. This machine is clean for slices A and C; the lead re-runs the final script at phase time. Compacted pre-custody ScopedCommit/Sync receipts are not counted: a ledger receipt carries no resource set (`wal.rs:1788-1808`), and the only effect of deleting the legacy acceptance on such a receipt is that a same-id replay of a pre-10-19 run id answers `OperationIdConflict` (refuses, changes nothing); no flow replays a run id that old.

**Rule (per slice, so one count never reverts another slice).** Over every **real** WAL on **every machine running fgOS** (2026-10-23, OPC: three machines, `fg-server`, `fg-server2` and the owner's `design-lap`) (scratch lines are listed in the report but do not block), and with the scope of `find $HOME -xdev` extended by any repository on another mount that the owner lists in the answer:
- slice A goes only if `legacyScopedOrSync == 0` and `unreadable == 0` everywhere and no workspace runs a release built before `869e789d7`;
- slice C goes only if `ledgerV1 == 0` and `unreadable == 0` everywhere;
- slice B is **not** census-gated: it goes only on a code proof that each field is never read (`rg` plus the writer commit that made it always present), because Land and Restore chains are retained by design and a census of them would be noise;
- a slice whose condition fails stays undone, its finding closes "kept by evidence" with the census line, and the other slices are unaffected.

**When.** The owner-machine census answer is in hand **before phase 8's census-gated slices merge**. Without it, slices A and C wait, and T2 may close without them. The census-gated slices (A, C) merge into main as **their own merge commit**, after T2's main merge. That keeps them independently revertable: reverting them never touches the rest of T2. The guide re-runs the census only as a confirmation.

## Requirements

- **Slice A — legacy acceptances (D8 Q1, E-19).** Delete the six path-only acceptances (current `scoped_commit.rs:347,362,562,713,1248`, `sync.rs:677`; re-grep `format!("worktree:{}"`), so each port accepts only `checkout_resources` (`scoped_commit.rs:327-337`). `compact_matches` (`:338-349`) becomes `compact.matches(intent)`. **Not touched:** `wal.rs:346-355` (`worktree_resources`, the live Worktree form).
- **Slice B — compat fields (code proof, no census).** `CheckoutProof.old_index` (`land.rs:1065-1066`, written `None`, never read; re-prove with `rg -n "old_index\b" packages/git`) and the digest-compat `#[serde(default)]` fields of `restore.rs:75-83` that only legacy records lack (the lead lists each with the writer commit that made it always present, `git log -S`). A field still written and read stays.
- **Slice C — v1 compact receipts (D8 Q2, E-23).** Delete the `v == 1` branches in `wal.rs::compacted` (`:2108-2109,2132-2133`; the version range `1..=3` → `2..=3`, `:2139`) and `publication.rs:856-861`; retire `wal.rs:2969` (v1 case) and `tests/publication.rs:2206-2215` ("old experimental entries"), behaviour removed. The WAL record field `"version":1` on operation records (`wal.rs:277`) is a different thing and stays.
- **Q3 sentence (D8 Q3, spec only).** `docs/platform/git/spec.md:105` (§2 "Results distinguish …"): split into result codes (`result-codes.v1.json`, after phase 5's E-7), Sync states (`conflicted-open`, `conflict-aborted`) and outcome kinds with stable machine names: abandonment is the cause `abandoned-before-attempt` under `refused` (`publication.rs:644-651`), config approval is a successful config receipt (`repository_config.rs:270`). No `ResultCode` added; the `Outcome` variants stay (§10 rules 4b, 4c).
- **Q4 Node arms (D8 Q4), each proved by `rg` in the commit body.**
  - `fetchRefs`: `src/git/remote.mjs:12` and `src/git/index.mjs:12` lists, addon arm `packages/git/node-addon/src/git.rs:168` (Publication's) and the Remote addon arm; `rg -n "\.fetchRefs\(" src bin scripts` → none (2026-10-23). The Rust `fetch_refs` stays if Recovery or Event Store calls it (`rg -n "fetch_refs" packages`), else it is named in the report, not deleted here.
  - `inspectRemote`: `src/git/remote.mjs:12`, addon `git/remote.rs:53`; `rg -n "\.inspectRemote\(" src bin scripts` → none.
  - `recover` on the RepositoryConfig facade (`src/git/config.mjs:9`): delete only if `rg -n "createGitRepositoryConfig" src bin` shows no caller of `.recover(`; the Rust `recover_config_change` stays (Recovery calls it).
  - `sessionId` on the Node Worktree create request: delete the addon field read only if `rg -n "sessionId" src/runner src/git` shows no caller sets it; the Rust `session_id` in the WAL kind stays (on-disk field).
  - Their Node tests: the `fetchRefs` case `test/git/remote.test.mjs:24` retires (behaviour removed from the facade).

## Files

**Modify**: `packages/git/rust/src/{scoped_commit.rs,sync.rs,land.rs,restore.rs,wal.rs,publication.rs}` (slices A–C), `packages/git/node-addon/src/{git.rs,git/remote.rs,git/worktree.rs}` (Q4 arms), `src/git/{remote.mjs,index.mjs,config.mjs}`, `docs/platform/git/spec.md` (§2 sentence only), tests `packages/git/rust/tests/{publication.rs,scoped_commit_sync.rs}`, `wal.rs` inline, `test/git/remote.test.mjs`. **Delete**: as listed. **Tests to retire**: `wal.rs:2969`, `tests/publication.rs:2206-2215` (behaviour removed); any `scoped_commit_sync.rs` case that seeds a path-only legacy chain (behaviour removed; re-grep `worktree:{}` in tests); `test/git/remote.test.mjs:24` (behaviour removed).

WORK overlap: `scoped_commit.rs`, `scoped_commit_sync.rs` — rebase rule.

## Steps

1. Run the census here; paste the output. The big lead sends the same command in the owner batch (read-only, ≈ 1 min); the answer is pasted in this phase's report before merge.
2. Branch `harden/t2-p08-census-deletes` after phase 5 merged. Commit order: Q4 arms → Q3 sentence → slice B (if proved) on the phase branch; slices C and A (if allowed) on a second branch `harden/t2-p08-census-slices`, merged separately. Messages name behaviours, e.g. `refactor(git): drop the compact-receipt reader for a ledger version no repository holds` with the census line in the body.
3. OPC review. Report: census lines (every machine), slices done/dropped, Δ.

## Verification (exact)

```sh
export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t2-p08-target
cargo test -p fgos-git
cargo test -p fgos-event-store -p fgos-node-addon
```

Node (one-file command): `test/git/remote.test.mjs test/git/scoped-commit.test.mjs test/git/sync.test.mjs test/git/land.test.mjs test/git/safe-restore.test.mjs test/git/repository-config.test.mjs test/git/worktree.test.mjs`.

`rg -n 'format!\("worktree:\{\}"' packages/git/rust/src` → only `wal.rs` `worktree_resources` (slice A done). `rg -n "c\.v == 1" packages/git/rust/src` → nothing (slice C done).

## Net size

Node −12 (Q4 arms). Rust −110 (A −60, B −20, C −30; only slices allowed by the census). Tests −40.

## Test-cost line

Added 0; retired 3–4 cases; no spawn change.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| An old compacted ScopedCommit/Sync receipt replayed by id no longer matches | L × L | Answers `OperationIdConflict` (refuses, no effect); run ids are never replayed after days |
| Removing a compat field changes the digest of a retained Land/Restore record | L × H | Slice B only for fields proved never read **and** not part of any digested struct; if a field is digested, it stays (kept by evidence) |
| The owner machine's census arrives late | M × L | Q4 and Q3 slices proceed; census slices wait or drop; T2 closes without them if needed (drain stays, "kept by evidence") |
| A non-scratch repository was missed by `find` (other filesystem) | L × M | `-xdev` is stated; the owner lists any project on another mount in the answer |

## Rollback

Revert the slice commits. The previous release reads everything these slices stop reading.

## Done when

Census lines from every machine in the report; each slice merged or dropped with its census evidence; spec §2 sentence in place; Q4 arms gone with their `rg` proof; OPC verdict recorded.
