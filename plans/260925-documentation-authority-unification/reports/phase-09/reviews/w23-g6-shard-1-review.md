Verdicts: 229 APPROVE / 34 REWORK

# W23 review — G6 park judgments, shard 1

Reviewed: `preserve-premise/park-judgments/shard-1.{json,md}` and `check_shard_1.py` at commit `8313bfa5e` (shard pin `c94545de5`, reviewed at HEAD `587222468`). The brief is `w22-g6-park-judgments-brief.md` and the ruling is L13-20. Every one of the 263 rows got its own verdict; there was no sampling. Each row's verdict is in [w23-g6-shard-1-review.json](w23-g6-shard-1-review.json).

## Mechanical checks

- `python3 -B .../check_shard_1.py --shard 1` gave exit 0: 263 rows, counts 118/37/108, 19 patches, 38 forward/reverse applications.
- I re-derived all 108 successor-bound units independently from `git show <pin>:<file>`. All 108 match the pin bytes and digests. Every source file maps to its holder in `step-05-cutover-move-set.json`. The text survives verbatim; only rebased link targets differ (normalized similarity 1.00; f00554 is 0.98 because a heading level changed).
- `docs/history/`, `docs/distillery/`, `docs/ui-spec/tools` and `docs/ui-spec/generated/` have no entries in the move set. This confirms the native-path rows.
- Process note, not a row defect: the brief names `check_shard.py`, but the shard wrote `check_shard_1.py`. The md explains why (the shards ran concurrently).

## REWORK groups

### A. Prepared patches duplicate the verified F chain (16 rows, medium)

Rows: f00148, f00156, f00158, f00161, f00162, f00163, f00175, f00177, f00178, f00181, f00187, f00189, f00191, f00193, f00478, f00183.

The repoint judgments are correct. The patches are not needed: the chain already makes these retargets. `phase-08/step-07-composed-patches.json` is the F chain's predecessor, referenced from `composition/actions.json`. It has entries `file:<path>` whose `beforeSha256` equals the current file and which change the same lines to the identical replacement. `composition/patch-specs.json` does the same for `w2:predecessor:apps/fgos-gateway/{Cargo.toml,src/mcp.rs}`.

Probe: I applied the chain diff to a temp copy, then ran the shard patch with `--dry-run --fuzz=0`. For 15 rows `patch` answered "Reversed (or previously applied)". For network.ts (f00183) it answered "Hunk #1 FAILED". The chain rewraps lines 1-4 of network.ts and also retargets `docs/specs/herdr-web-dashboard.md`.

The checker only replays each patch against the bare pin, so it cannot catch this. The shard's prior-art search covered only `preserve-premise/`.

Fix: record these rows as "repoint, already composed by <chain entry id>" and drop the 11 file patches.

### B. Preserve contradicts the chain (f00477, medium)

`citation-format.md:34` reads `(docs/id-systems-audit.md) but not this`. The shard keeps it literal, but the chain already retargets this line, in hunk `@@ -31,7` of `file:core/skills/_shared/citation-format.md`.

The parenthetical tells the reader where the older convention is written down. That is the same locator shape the shard itself repoints in f00478, 17 lines below.

Fix: repoint (already composed), or record an explicit Lead decision to strip that chain hunk.

### C. The 2026-10-14 removed-door notes are live locators (16 rows, medium)

Rows: f03127, f03134, f03136, f03139, f03143, f03144, f03170, f03171, f03177, f03178, f03202, f03210, f03219, f03250, f03294, f03352.

The shard calls these history. They are not. Each banner, and the "Updated 2026-10-14" note in f03352, was added on top of the history as present-tense orientation. It points readers to the current doors and cites "decision 0062 in `docs/specs/runner.md`" as the record behind the removal.

`docs/specs/runner.md` is removed at cutover. Decision 0062 lives at `docs/platform/runner/decisions/h-36d872fbb0e5.md:1722` (`### 0062 — Xoá cửa thô…`). The chain already treats this shape as a locator to retarget: in AGENTS.md, `(D-ADR0030, docs/specs/runner.md)` becomes runner decisions `h-36d872fbb0e5.md#…`. No test or script reads the banner text, so a retarget is safe.

Shard 2 has the same banner on 2 rows. Fix both shards the same way.

### D. Wrong reason on a live pointer (f03404, low)

`use-fgos-group-thinking.md:214` sits under `## Related` in a present-tense guide. The shard labels it "completed change or capture". The operand (`docs/how-to/coordination-examples/group-thinking-*.json`, 5 files present) is not moved, so keeping it literal is the right outcome. The reason is not.

Fix: regroup it as a retained live operand. L13-10 warns against calling live pointers history.

## Approved, with notes for F

- **AGENTS.md (f00102/f00106/f00117/f00118):** the retargets are new and correct. But the shard hunk `@@ -5,12` fails after the chain's AGENTS.md patch, which changes lines 9-10 and 17 inside its context. It applies cleanly after the `carries/pointer-patches.json` AGENTS.md patch. Compose it at F; do not apply it as is.
- **f03580:** the successor renamed "Ngoại lệ có lý do" to "## 5. Reasoned Envelope Exceptions". The kept English gloss still lets a reader find it.
- **Patches that compose cleanly after their chain entries:** NeedsAnswer.tsx, architecture-manifest.json (no code reads `map`), backlog.md, herdr-orchestrator-terminology-boundary.md (same successor as the chain's body retarget), generated/README.md, participant-contract.md, dashboard-layout.md and pane-rename.md.
- **Successor-bound:** all 108 approved. Old operands left inside carried successors are covered by the candidate files' own census rows (273 `docs/platform/` files have rows).
- **Preserve:** the remaining 101 preserve rows (generic scaffold, provenance, native paths, dated investigations, upstream inventories, completed-change narratives, captured proofs) were read in place. Their quoted framing supports the verdict.

## Commands

- `check_shard_1.py --shard 1` gave exit 0. Read-only `git show`/`git log` gave exit 0.
- I ran Python scripts (`python3 -B`) for the table, successor re-derivation, chain-overlap search and patch probes. They used `patch --batch --fuzz=0 -p1` in tempfile dirs under `/tmp/fgos-work/`, which were removed afterwards.
- I made no git writes, ran no fgos CLI, ran no product tests and loaded no addons.
