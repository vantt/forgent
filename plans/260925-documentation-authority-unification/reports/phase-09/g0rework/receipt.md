# G0 content rework receipt

**Status: blocked — records complete, execution-scope safety exception.**

Pin: `568a11f21f442190ef86e25cf5d2303df7fc0f3d`. The [JSON receipt](receipt.json) contains every changed row's old/new binding and row hashes, 21 legacy rewrite hashes, exact commands/exits, supersession chains, and the safety exception.

## Records delivered

- `ledger/decisions/g0-content-redecisions.json`: three explicit **supersede** re-decisions with literal old/new changed lines and main/spec sources; all reviews **pending**. No legacy edits.
- All 124 reviewed rows receive truthful current rationales through the existing `supersedesBinding` mechanism. This also handles the read-only pilot shards; predecessor prose remains historical.
- `carries/source-parity.json`: 21 entries added (19 confinement, 2 work-state), original 324 entries unchanged. Integration commit `49ad04648`, immediate-parent old/new legacy hashes, historical source digests retained; four later ordinal shifts named separately.
- Three stale overlay pointers resolve through their existing s14/s15 chains to new current-binding retirement rows; no conflicting supersession edges.
- `claim_d5ba1eda` current remainder and primary target now cite `797c7185`; the residual file/hash and its historical `fb0b0100` witness remain untouched. Cutover stays blocked.

Historical wording is not current legacy wording: rigor and the implementation-pointer successors already exist in legacy at the review pin/HEAD. The re-decisions identify exact historical source-digest witnesses instead. The lock successor is **hot state / withStateTx**, not a completed Work-to-Event-Store cutover.

## Final replay

Command: `python3 -B plans/260925-documentation-authority-unification/reports/phase-09/g0rework/verify.py` → **0 for the required record proofs, not execution-contract compliance**.

| Owning proof | Exit / result |
|---|---|
| `rebind/rebind.py --check` | 0; drift 0 |
| `misc-fix/verify.py` | 0; four artifacts byte-identical; original checks.json never rewritten |
| Both `ownership.mjs` and `audit-ownership.mjs` | 0 each; failing rows `[]`; no new native double ownership |
| `node scripts/check-legacy-docs-ratchet.mjs` | 0 |
| Touched bindings / current targets / actual ancestry | 127/127 recompute and resolve |
| Legacy rewrite hashes / complete changed-line diffs | 21/21 and 3/3 |
| `git diff --check` | 0 |
| Full `audit-report.py` / native-dependent `checks.mjs` | 1 / **not run (126)** in final replay; not claimed green |

Proof plumbing only: fixed scratch locations are relocated under a `TemporaryDirectory`; the misc report sink is redirected to scratch before writing. The owning assertions and dual extractors are unchanged. Final audit replay refuses `checks.mjs` before execution because it requires native Git. Scratch is removed.

## Safety exception — owner action needed

Earlier full-audit attempts let `checks.mjs` reach automatic addon staging before the `process.dlopen` guard blocked the native load. That staging writes ignored cache files under `.fgos/runtime/git-addon/df2c8ce8230fecdf` and may update `target/`, **outside the exact write scope**. No addon was loaded; no fgOS CLI, git write, lifecycle verb or test suite was run. The cache was not inspected or blindly deleted afterwards: there is no captured preimage and no permission to restore it safely.

Final replay prevents that path before it runs, but cannot undo the earlier scope breach. Owner/supervisor must accept the cache side effects or authorize baseline-aware restoration. Therefore the assignment result is **blocked**, despite passing record proofs. No independent content approval or authority/cutover acceptance is claimed. Markdown preview and pair accounting were not run.
