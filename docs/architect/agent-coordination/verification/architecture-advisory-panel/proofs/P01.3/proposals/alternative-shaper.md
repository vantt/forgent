**Proposal — vnflow (alternative shaper)**

**Priors I am applying, stated up front:** I weight explicit data dependencies and operational safety over code-level structural DRYness (Don't Repeat Yourself), primarily because the repository is only a month old (83 commits). The domain boundaries between what EOD needs and what Intraday needs are still settling (e.g., EOD adding a breadth gate that Intraday bypasses). When a system is this young, structural abstraction often ossifies the wrong boundaries; I am prioritizing interventions that make runtime failures obvious over interventions that make the code cleaner. I define "difficult to evolve" not as "typing takes too long," but as "changing one thing unpredictably breaks another."

**Candidate: Formalize the implicit data and state boundaries, rather than changing the pipeline abstractions.**
The scout report reveals that the pipeline execution is already unified (`AssetRunner`), but the pipelines are secretly coupled through unexpressed data and shared state. Specifically: Intraday reads EOD's persisted lake paths directly without declaring it in its DAG, and they share an alert dataset with no discriminator, meaning EOD alerts exhaust Intraday's cap.

The proposal is to reframe the problem away from the pipeline code structure (which is fine) and toward the runtime contracts:
1. Add a discriminator column (e.g., `pipeline_type`) to the shared alert dataset so EOD and Intraday state do not silently bleed into each other.
2. Introduce an explicit "external data readiness" sensor or asset to Intraday's DAG that explicitly checks the EOD lake paths for freshness before running, pulling the implicit persisted-data contract into the open.
3. Leave the pipeline execution abstractions exactly as they are.

Why it is credible here: If you build a new pluggable pipeline abstraction, Intraday will still silently read EOD's lake paths and EOD will still eat Intraday's alert cap. The friction in evolution is coming from runtime side-effects, not from the structure of the `AssetRunner` or the domain functions (which are successfully tolerating drift via defaults like `pct_sectors_leading=None`).

**No-build path, concrete.** Keep everything as it is. Accept that EOD and Intraday will continue to silently couple at the data layer. Based on the scout report, Intraday's brittle `pl.read_parquet(files)` loader will break when it hits the mixed schemas EOD is already producing. Accept roughly 1-2 incidents a quarter where Intraday either fails due to schema mismatch or silently trades on stale EOD data. Set an explicit trigger: revisit this architectural decision the first time a critical Intraday alert is swallowed in production because the EOD run exhausted the shared daily alert cap.

**One alternative I tried and abandoned:** Decoupling by duplicating the shared domain functions (like `evaluate_buy_gate`) so each pipeline has its own completely isolated copy, preventing one pipeline's new requirement from forcing a bypass in the other. I dropped it because the codebase is currently handling this drift gracefully (`_gate_breadth` explicitly records the bypass). The shared domain functions aren't the acute danger right now; the invisible data dependencies are.

**Falsification criteria (before critique):**
1. If the person's definition of "evolution is difficult" is actually about the sheer boilerplate of adding identical new features to both pipelines simultaneously (e.g., the proposed ATR entry planning), then fixing data dependencies won't relieve the pain, and structural unification wins.
2. If the alert cap bleeding is actually an intentional business rule (e.g., "never send more than N alerts a day across the entire firm, regardless of source"), then my premise about state coupling is a misunderstanding of the domain.
3. If Intraday and EOD are destined to merge into a single continuous-streaming pipeline in the near future, formalizing them as distinct tenants with batch data handoffs is the wrong direction.
