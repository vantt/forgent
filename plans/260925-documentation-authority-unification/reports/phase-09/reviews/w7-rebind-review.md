# Independent review: ownership rebind proposals and apply

Scope: commits `7bbad6f12` (proposals) and `8e7c6ee93` (apply), checked at plan HEAD `0d468a225`.
Records: [rebind/receipt.md](../rebind/receipt.md), [rebindings.json](../rebind/rebindings.json), [rereview-claim-ids.json](../rebind/rereview-claim-ids.json). Per-row verdicts are in [w7-rebind-review.json](w7-rebind-review.json).

## Verdict counts

| Verdict | Count |
|---|---:|
| APPROVE | 217 (214 rows, the ownership resolution, the misc-fix change, the commit scope) |
| REWORK | 3 rows: `claim_26b3a49a…`, `claim_2e2bc926…`, `claim_5ba6768e…` |

The rebind itself is correct. Every row binds the same passage at its current location. Two of the three REWORKs are re-decisions for the pending re-review, not wrong locations.

## 1. Passage identity (full pass, all 217 rows)

I did not sample. I checked every row with the unchanged embedded extractors, using `rebind.py`'s own `extract`, with only the scratch path moved:

- **Before side:** I re-extracted all 17 (document, `beforeCommit`) pairs from git. All 217 before anchor/digest pairs exist there, and their texts equal the recorded witnesses. For all 217 rows, `causeCommit` is the first first-parent change after `beforeCommit`, and it removes the bound unit.
- **After side, at HEAD:** each row in its decision file equals the `after` record. The unit is at the bound anchor with that digest. Ancestry is self-inclusive for headings. `bindingSha256` recomputes as sorted-key compact JSON + LF of the four keys. Neighbours equal the after witnesses, so there is zero drift since the apply.
- **Anchor-only (93):** before and after texts are byte-equal and the digest is unchanged. All prior review fields are kept: 70 pending and 23 reviewed. None of these rows is in the re-review list.
- **Same passage:** 75 rows keep both neighbours. The other 18 rows changed ancestry or neighbours because ADR headings were restored from English to the legacy Vietnamese. I checked them by ancestry title:
  - `claim_a9be2da8` moved from "0032 Foundation Architecture" to "I. Kiến trúc nền".
  - The three repeated "Đổi quyết định này = supersede…" lines each stay under their own ADR's Hệ quả (0011, 0012, 0024).
  - The two rows whose owner changed (`rollout-and-settled-facts.md` to `spec.md` §13.1) are valid. The rollout file now holds only a pointer to spec §13.1.
- **Content (124):** every digest changed. All 124 rows are pending, have their stale review fields removed, and are listed in `rereview-claim-ids.json` (124, unique). Example excerpts:
  - `claim_0201a1d6`: link `#8-adr-0012-unified-typed-edge-graph-model` changed to `#0012--mô-hình-đồ-thị-…`.
  - `claim_b64e4bcb`: `.fgos/events.lock` changed to "mutex nóng `state` (`withStateTx`, `.fgos/locks/state.hot`)".
  - `claim_6785a5f3`: "bind resource `private-home` vào env `CODEX_HOME`" changed to "`credentialStore: { use: 'codex', homeEnv: 'CODEX_HOME' }`".
  - `claim_0f4d968b`: "`terminal-dir` … by `fgos setup`" changed to "… by the allocation store on first use".
  - The 59 heading rows now have a target digest equal to their `sourceUnitDigest`, because the verbatim ADR headings were restored.

## 2. Ownership: `claim_f8e2b48d…` vs `claim_5412ac73…`

This resolution is correct. `retired-decision-history.md` has two distinct units:

- **H3 (line 28):** `claim_5412ac73` owns it, with disposition promote. It differs from the legacy unit at `docs/specs/work-state.md:1369` only by the 0012 link retarget.
- **H1 (line 35):** `claim_f8e2b48d` owns it, with disposition move and status pending. Its digest `a05e96aa` equals the legacy H1 at line 1376, which is f8e2's `sourceUnitDigest`.

No other row binds either anchor. One small problem: f8e2's original rationale sentence still says "merged into the single ADR 0002 H2 … no second H1". That sentence now contradicts the row's disposition, and only the appended correction line is current.

## 3. Proof reruns

I ran these through a wrapper that changes only the scratch paths and moves `verify.py`'s `checks.json` write out of the repository. All assertions and pins are unchanged.

| Command | Exit | Result |
|---|---:|---|
| `rebind/rebind.py --check` | 0 | drift 0 |
| `misc-fix/rebind.py --check` | 0 | 283 effective bindings, 27 changed rows, 21 content, pin `23f6eacc` |
| `misc-fix/verify.py` | 0 | 4 byte-identical G6 artifacts; registrations 141/32 |

`misc-fix/verify.py` was exit 1 at `8e7c6ee93`, and the receipt records that honestly. It is green at HEAD only because of the later commit `6c628b07e`, which replays G6 at its recorded pin.

The `misc-fix/rebind.py` change is not a weakening:

- Every assertion moved verbatim into `check()`: shard equality, `binding-refresh.json` equality, effective pointer, payload and hash, and pending status.
- Only the preimage source changed, from the working tree to `git show <pin>`. These are the inputs the overlay was authored from.
- Current-tree supersession resolution still reads `documents()`.

## 4. Commit scope

Every path in both commits is inside its brief's writable list. In `7bbad6f12` the only change to the phase-06 manifests is one appended `L12-137` pair (`dbf8ad715`, `w5-rebind-brief.md`), which is the pair accounting the first brief asked for.

## 5. Faithful carry (full pass, 124 content rows)

I diffed each content target against the recorded source unit and against the current legacy source unit:

- **59 rows: verbatim.** The target digest equals `sourceUnitDigest`.
- **49 rows: the claim is kept.** The changes are link or anchor rewrites, added text, a heading's composite body, or a supersede successor updated in place.
- **12 move/promote rows: target equals the current legacy unit.** The s8/s10 confinement paragraphs (resourceBindings→credentialStore, binding→attempt) and the `events.lock` rows are byte-equal to the current legacy unit. The recorded `sourceUnitDigest` is the historical identity, so these rows carry the current source.
- **`claim_b5695d38` (move):** a deliberate correction from the earlier misc fix. The s17 overlay already records it as pending.
- **`claim_d5ba1eda` (partial-carry):** the carried RUL90 lines are byte-identical.

These rows no longer carry their claim:

- `claim_2e2bc926` (promote, `implementation-pointers.md#unheaded-block-3`). Lost clauses: `withEventsLock`/`appendEventLocked`, the `acquireSessionsLock` mirror, 2s/10ms, `EventLogError('lock-timeout')`, and hash-suffix `generateId`. It also differs from the current legacy unit (`appendEventLocked` vs `tx.append`).
- `claim_5ba6768e` (promote, `work-state/spec.md#unheaded-block-4`). The legacy unit still says "fixed `tsk-` prefix + short anti-collision suffix", but the target now says ids come from the Identity mint door, and the `rigorToTier` clause was also replaced.

## Other findings (not REWORK)

- **Double move ownership:** `claim_d572bb9d…` (s10) and `claim_26b3a49a…` (s8) are both `move` rows bound to `agent-confinement/spec.md#unheaded-block-45`. The same pair already existed in the s14-resync-b overlays (`/bindingRefresh/0` and `/1011`). Neither claim is in the active registry, so the receipt's "zero new active native pairs" is true but does not cover this. The direct rows only became a pair in this apply. The REWORK on `claim_26b3a49a` covers it.
- **Stale rationale text:** all 124 content rows keep their old rationale ("byte for byte", "text unchanged", "merged") with one L12-137 correction line appended. Re-reviewers must treat that last line as the only current statement.
- **Scratch not removed:** the Doer's scratch `/tmp/fgos-work/w5-rebind-apply/` still exists. The first brief required deleting it; the apply brief did not repeat that rule.

## REWORK fixes

1. **`claim_26b3a49adef572e1be2ed219e292c8b0`:** keep `claim_d572bb9d…` as owner of block-45, because the paragraph declares itself the replacement of the 2026-10-15 binding rule, which is d572's source. Set 26b3's disposition to `merge`, say in its rationale that its reaper/herdr-session paragraph was absorbed into block-45, and list this in `rebind/receipt.md`.
2. **`claim_2e2bc926…`:** at re-review, do not approve it as an identical carry. Re-decide it as `partial-carry` or a labelled correction that names the replaced lock and id clauses, or resync the legacy clause first.
3. **`claim_5ba6768e…`:** the same as fix 2, naming the id-mint clause and the `rigorToTier` clause.

## Unresolved questions

- Should rows whose legacy source was resynced (12 move/promote rows) refresh `sourceUnitDigest` at cutover? Or does the convention ("`sourceUnitDigest` is the historical identity; freshness lives in source-parity.json") stand?
- A/B checks and `audit-ownership` were not run. That is Lead custody after merge.
