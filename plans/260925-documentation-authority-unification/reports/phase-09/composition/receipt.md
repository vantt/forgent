# Composition follow-up receipt — replayed records only

Current replay/judgment pin: **`d786e305eb20dfdda8d1634b227bd9f8a9328541`**, including import 3. **Composition replay, citation scan and G9 verification pass.** This supersedes the previous current replay/completion claims. The packet's original `sourceCommit` (`eb744281deba853f201cda15dcb4876300a1d638`) remains author provenance, not the current replay pin. Nothing is applied outside scratch; no independent acceptance, authority promotion, final-pin F approval or gate closure is claimed.

## Glosses and complete mechanical audit

Restored the local ordered labels in zero-based witnesses **#61, #62 and #64** (`docs/platform/holder-lock/spec.md:420,425,428`) as **Mục n:**, retaining the original numbers and gaps. Their prose starts with capitals; no ambiguous `D1:`…`D8:` citation tokens are reintroduced. Meaning and decision boundaries are unchanged.

The full audit strips Markdown emphasis, inline code and link destinations before checking sentence starts, checks adjacent Unicode words case-insensitively, and compares all original multi-label lists with their retained numbers. It caught three additional removal-induced capitalization faults: **#0** (agent-mailbox: “What”), **#37 and #38** (git: “The”). These bounded grammar corrections were also regenerated, not merely noted.

**All 104 witnesses have individual results**, exact before/after lines, match lists, local-label accounting and review status in [w10-gloss-audit.json](w10-gloss-audit.json), as explicitly required by the brief. **102 pass without matches; two pass after explained matches**:

- #66: the apparent `CODE CODE` repetition represents two different adjacent inline-code expressions, not a doubled prose word.
- #97: Vietnamese **song song** means concurrently and was already present before the gloss; it is not a removal-induced doubled word.

There are **no unresolved audit matches**. Forward/rollback diffs and expected-after hashes were regenerated for the holder-lock, agent-mailbox and git gloss specs, and every witness locator is authenticated against actual full-chain replayed bytes. The earlier #16 correction (“in the plan, porting uses”) remains intact.

## Import drift and replay proof

The confinement base spec and its credential-store successor were rebound together to the current imported source, retaining their authored edits. [w11-preparation.json](w11-preparation.json) records all **five changed composition specs** (those two plus the three gloss specs), old/new hashes, exact repairs and preparation commands.

Full chain: **79 effective + 14 conditional F specs + 13 external predecessor applications = 106 steps on 74 files**. **424 GNU patch invocations, all exit 0**. Every step has a hash-guarded forward application, byte-exact rollback/reapply, and complete reverse rollback restoring original bytes and original absence. Independent replay separately passes **221 patch invocations**, including generator evidence, with the same 74-file restoration. Evidence: [w11-chain-verification.json](w11-chain-verification.json), [w11-independent-verification.json](w11-independent-verification.json).

After the real skill generator, the citation scanner reports **130 findings before F (exit 1, intentional negative control) → zero findings with the full prepared chain (exit 0)**. This is zero findings, not merely zero new findings. Baseline bytes remain unchanged, SHA-256 `ac0a6e980278f4be3ea3b2f7dbcf0f9004cf5fe1a7a35dbe1451aa0328ab4fff`. Evidence: [w11-citation-before-f.json](w11-citation-before-f.json), [w11-citation-verification.json](w11-citation-verification.json). Conditional F specs remain prepared-only and require their actual final-pin lease/preimage checks.

G9 now recomposes **all four selected drifted source preimages** (three confinement files and `docs/reading-map.md`) and the three repaired gloss holders: **seven changed bodies / 538 unchanged body diffs/hashes**, 545 total. The existing reading-map resolution preserves imported probe-count/private-home facts while applying only original path substitutions. Changed seat-binding source has no selected body or evidence passage in the G9 cohort and is explicitly accounted for, not silently treated as equal.

G9's check now binds **body bytes to actual current-chain replay**, in addition to ordered predecessor metadata. A scratch old event-store body with refreshed current metadata still self-roundtrips but is rejected with exit 1; the real tree passes with exit 0. See [G9 receipt](../g9/receipt.md) and its `w11-stale-body-control.json`.

## Shared binding/action checks

The original shared resolver and both immutable extractors were rerun unchanged:

- **171 originating assertions → 162 binding-refresh + 9 unit-carry occurrences → 90 distinct terminal rows (81 + 9)**. All 171 exact text/anchor joins verify, with **zero moved-body and moved-heading unresolved bindings**.
- **134 operative overlay hashes/anchors/ancestries** verify; 44 heading lookup snapshots remain excluded by the existing resolver policy, without adding duplicate supersession edges. No ledger edits were needed.
- Current full scan: **13,776 assertions / 12,534 distinct effective bindings / 285 target files**, zero missing files. Residual drift remains **556 assertions / 407 distinct bindings**, explicitly not all green. Component-boundary residuals remain six assertions / four distinct endpoints (reviewed table-edit drift, not moved bodies).
- `actions.json#/actions/4` remains bound to `docs/platform/workflow/spec.md`; path/preimage/postimage and holder hashes match. Historical identity/provenance is retained.

Evidence: [w11-gap05-verification.json](w11-gap05-verification.json), [w11-unresolved-bindings.json](w11-unresolved-bindings.json), [w11-action-verification.json](w11-action-verification.json). These are byte/binding checks, not independent G0 acceptance or systemic post-apply rebind completion.

## Commands and exits

Reproduction from repository root: `python3 -B plans/260925-documentation-authority-unification/reports/phase-09/g9/w11-followup.py`. All G9 source reads explicitly pass the pin; see its receipt for the complete G9 command table. [w11-replay-recipes.json](w11-replay-recipes.json) persists the actual adapted W10 scripts. Only scratch/output locations and corrected witness metadata differ; resolver/extractor logic is unchanged.

| Command | Final exit / evidence |
|---|---|
| Complete `python3 -B …/g9/w11-followup.py` | **0**, including intended negative controls |
| Reused scratch `python3 -B /tmp/fgos-work/w11-g9/verify.py` | **0**; full-chain, all witness lines, citation, resolver and action checks |
| `patch --batch --fuzz=0 -p1` in full-chain proof | **424 calls, all 0**, forward/rollback byte-exact |
| Scratch `node scripts/build-skill-wrappers.mjs`, before-F/full-chain trees | **0 / 0** |
| Scratch `node scripts/check-decision-citation-drift.mjs`, same trees | **1 / 0**, 130 findings / no findings |
| Shared Node extractor adapter; current-pin Git inspection | **0** |
| Reused scratch `python3 -B /tmp/fgos-work/w11-g9/independent-replay.py` | **0**; 221 patch invocations, all 0 |
| G9 `recompose.py --pin HEAD`; `judge.py --pin HEAD`; `sweep.py --check --pin HEAD`; `verify.py --pin HEAD` | **0 / 0 / 0 / 0**, all via `python3 -B` |
| Scratch stale-body/current-metadata `sweep.py --check --pin d786e305eb20dfdda8d1634b227bd9f8a9328541` | **1**, expected rejection; real tree **0** |
| `git diff --check`; scope/index audit; scratch deletion | **0**, G9 `w11-final-audit.json` |

`w11-commands.json` contains **522 subprocess commands: 521 exit 0 and one expected before-F citation exit 1**, including 513 patch calls (89 before F + 424 full-chain). Independent replay retains all its command exits in its JSON. G9's `w11-commands.json` records outer argv/exits, stdout digests and full stderr. Preparation patch commands are in `w11-preparation.json`.

Two early complete-reproduction attempts failed closed: first on reading-map import drift, then on the regenerated late-area report's advanced head pin. Both failures and their explicit resolutions are retained in G9 `w11-first-attempt.json` / `w11-second-attempt.json`; neither is represented as green. The subsequent full reproduction passes, including the additional emphasis-aware audit repairs.

Only `composition/**` and `g9/**` changed. No live docs/scripts, tests/product code, baseline, pair accounting, Git write, fgOS CLI, state/secrets, suites or preview service. `impact-analysis: degraded` under the explicit no-CLI records-only grant; runtime is untouched. The former ratchet blocker belongs to the historical previous task, not this follow-up; it was not rerun or masked here. Scratch stays in `/tmp/fgos-work/w11-g9/` and is deleted at handoff. `needsWrites=[]`. Independent review, actual cutover/final-pin acceptance and residual binding drift remain Lead-owned.
