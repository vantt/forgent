# proposals/system-shaper.md

## Frame

**Definition of "difficult" I'm using:** evolution is difficult when a change made in one place produces an effect in another place that is either (a) not caught by any test/validation, or (b) not visible in the system's own dependency graph, so the person doing the change has no signal that they've broken something until it surfaces later, elsewhere. This is a definition about *silent, undeclared coupling*, not about slow builds, hard-to-read code, or disagreement over where a boundary should sit.

**Which option this resolves to:** C — reframe — but not because A and B are unavailable; because the scout report falsifies the premise both A and B share. A ("separate pipelines, shared contracts") and B ("one pluggable abstraction") both assume the difficulty lives at the *execution-graph* level — that the two pipelines either need to be pulled apart with a contract in between, or fused into one engine. The report found that a shared engine (`AssetRunner`) already runs both `EOD_ASSET_SPECS` and `INTRADAY_ASSET_SPECS` through one topo-sort/materialize/check path, and that domain logic (`evaluate_buy_gate`, `score_money_flow`, `dispatch_alerts`) is already shared, not duplicated. B is a proposal to build something that exists. A is a proposal to formalize a split that isn't where the drift is. The real drift is in four specific, named seams beneath that shared engine, and none of them are fixed by re-architecting the pipeline boundary.

## Proposal — direct response

**Do not build a new abstraction and do not draw a new pipeline boundary.** Finish and enforce the shared surfaces that already exist, at the four points where the report found them silently diverging:

1. **Declare the cross-pipeline data dependency.** Intraday reads EOD's regime/sector-rotation output directly from lake paths (7-day lookback), but its own signal asset declares only `mart.money_flow_intraday` as a dependency. Add this as an explicit upstream reference in intraday's DAG (even a thin read-only asset wrapping the lake read) so `AssetRunner`'s own dependency blocking — the mechanism that already exists for the rest of the graph — covers staleness and decode failure here too, instead of this one dependency being invisible to the engine that would otherwise catch it.

2. **Make the breadth-gate bypass loud, not silent.** `evaluate_buy_gate` is shared; EOD supplies `pct_sectors_leading` (added in `235d05d`), intraday doesn't, and `_gate_breadth` quietly defaults it to `None`. Whether or not the bypass is the *correct* behavior for intraday (unknown — see falsification #1), the mechanism should not be "absence of an argument," it should be an explicit, named, tested state, so the next person changing the gate can see both consumers' behavior instead of discovering the second one by reading `_gate_breadth`'s internals.

3. **Port the schema-tolerance fix.** EOD's signal loaders (`signal_engine.py:274`+) already handle mixed historical schemas via `diagonal_relaxed` concatenation (`068d898`). Intraday's EOD-context loaders (`signal_engine_intraday_loaders.py:17`+) still do a single `pl.read_parquet(files)` across all partitions and will break the same way EOD did before the fix, the next time schemas drift. This is a straight parity port, not a redesign.

4. **Give the shared alert dataset a kind discriminator.** EOD alerts currently count toward intraday's own daily cap (`alert_dispatch_intraday.py`) because the dataset doesn't distinguish source. Tag alert rows by originating pipeline so each cap is computed against its own alerts.

Everything else the report found — the incomplete port boundary in `ports_analytics.py` (intraday reaching `.lake` on the concrete adapter directly), and `AssetSpec.freshness`/`force` existing but unwired — I am naming as related but **out of scope** for this direct response. They're symptoms of the same pattern (an abstraction exists but isn't fully load-bearing yet) but fixing them isn't required to close the four seams above, and bundling them in is scope creep beyond what the symptom, as stated, requires.

## Load-bearing constraint

This whole proposal depends on intraday's direct lake read of EOD's regime/sector-rotation output being expressible as a DAG dependency without breaking whatever property made it a raw read in the first place. If that read exists *outside* the DAG because intraday cannot afford to block on EOD's asset-materialization path (e.g., a timing/availability reason not visible in the report), then item 1 — the centerpiece of "make the invisible dependency visible" — doesn't work as a DAG edge, and the fix has to become a freshness check performed at read time instead, independent of `AssetRunner`. I don't know which of these is true; the report doesn't say why the read bypasses the DAG, only that it does.

## What this makes harder

Every future addition that pulls a value from one pipeline's context into the other's (which is precisely what the 2026-07-05 audit is about to ask for — ATR entry planning and continuous RVOL scoring for intraday, both already produced by EOD) now costs more up front: it has to be declared as a dependency, or explicitly marked as an intentional bypass with a test, rather than just read or defaulted. I am proposing to slow down exactly the work that is already scheduled next. If the maintainer's actual complaint is "changes take too long" rather than "changes silently break the other side," this proposal makes their felt problem worse, not better.

It also does not reduce the asymmetry in validation investment (9 of 14 EOD assets have checks registered, 0 of 6 intraday assets do) — closing that gap is a separate, larger effort than the four seam-fixes above, and I'm deliberately not claiming this proposal covers it.

## First reversible step

Port the `diagonal_relaxed` schema-tolerance fix into `signal_engine_intraday_loaders.py`'s loader — a one-function change, no new abstraction, testable against the same kind of mixed-schema partitions that motivated the original EOD fix in `068d898`. This is the cheapest of the four items and the most mechanically obvious win.

If, over the next real run cycle, this fix catches zero mixed-schema partitions in intraday's actual data, that's a signal my broader diagnosis — that intraday systematically lags EOD's hardening and that lag is the source of "difficult evolution" — doesn't have day-to-day teeth yet, and items 1, 2, and 4 should wait for a second concrete case before being pursued.

## Resting on evidence vs. resting on assumption

**Evidence (from the scout report, with paths/commits):** `AssetRunner` runs both spec sets through one engine; `evaluate_buy_gate`, `score_money_flow`, `dispatch_alerts` are shared; the breadth-gate default-to-`None` bypass in `_gate_breadth`, traced to `235d05d`; the `diagonal_relaxed` fix in EOD's loader (`068d898`) versus the single `read_parquet` call in intraday's loader; intraday's signal asset declaring only `mart.money_flow_intraday` while reading EOD's lake output directly; the undiscriminated shared alert dataset; `AssetSpec.freshness`/`force` existing but unwired; the 9-commit / 6-EOD-only / 0-intraday-only / 3-both split and the 9-of-14 vs. 0-of-6 validation registration gap; the 2026-07-05 audit proposing intraday features EOD already has.

**Assumption (mine, not verified):** that these four seams are the actual source of the felt "difficulty," as opposed to something the ~1-month repo history can't yet show (the report explicitly could not determine whether drift is the dominant cost or is accelerating). Also assumed: that surfacing the breadth-gate bypass loudly is wanted — the report could not determine whether the bypass is intentional, and "make it loud" is my inference about intent, not a fact I checked.

## Falsification criteria (stated now, before critique)

1. If the breadth-gate bypass is confirmed to be a deliberate, permanent design choice (intraday is not meant to be evaluated on breadth), item 2 collapses to "document and test the constant," not "surface it as a loud explicit case" — a minor correction, not a reversal of the whole proposal.
2. If the intraday EOD-context lake read cannot be expressed as a DAG dependency for a real timing/availability reason, item 1's mechanism (DAG edge) is wrong and must become a freshness check at read time — this changes the proposal's core mechanism, not just a detail, and should be treated as a real falsification, not a footnote.
3. If the maintainer's actual pain is about readability/onboarding into a shared engine that already operates correctly, not about the four silent-coupling seams above, then this proposal solves a problem they aren't experiencing — the honest answer becomes "there is no coupling problem here to fix," and C should resolve to *doing nothing to these seams* rather than to this hardening plan.
4. If the 6/0/3 commit-scope asymmetry and the 9-of-14 vs. 0-of-6 validation gap turn out to reflect intraday simply being newer and still catching up (not a systematic pattern of less rigor), then "asymmetric hardening investment" is the wrong diagnosis, and the validation gap should be left to close on its own rather than treated as evidence for this proposal.
