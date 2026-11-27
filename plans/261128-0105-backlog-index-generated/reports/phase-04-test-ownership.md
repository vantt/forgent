# Phase 4 — test ownership of the retired JavaScript portfolio cases

Step 1: the import search returned only files of the retired set (`test/portfolio/portfolio-check.test.mjs` and the
five `.mjs` files importing each other). No outside importer. Non-code mentions left alone: `test/suite-baseline.json`
(timing row for the deleted test) and `packages/portfolio/contracts/` (kept).

Every case of `test/portfolio/portfolio-check.test.mjs` and the Rust case in `apps/fgos/tests/portfolio_check.rs`
that owns the same behaviour:

| JS case | Rust owner | Note |
|---|---|---|
| parseBacklogItem parses valid item with all required keys and body sections | `test_parse_backlog_item_valid` | |
| parseBacklogItem rejects missing required keys | `test_parse_backlog_item_missing_key` | |
| parseBacklogItem rejects unknown status and priority | `test_parse_backlog_item_invalid_status_and_priority` | |
| parseBacklogItem rejects missing body section | `test_parse_backlog_item_missing_body_section` | |
| parseDiscussion parses valid discussion and rejects invalid fields | `test_parse_discussion_valid` | The scalar-`source` rejection had no Rust assertion; ported into this case (`FrontmatterInvalid`). |
| createBacklogItem and editBacklogItem manage item files on disk | `test_create_and_edit_item` | |
| generateBacklogIndex compiles markdown table with citing discussions and plans | `test_generate_backlog_index` | |
| checkPortfolio validates clean portfolio fixture | `test_check_portfolio_clean` | |
| checkPortfolio detects citation of non-existent item | `test_check_portfolio_unknown_source` | |
| checkPortfolio enforces in-flight item must have citing discussion or plan | `test_check_portfolio_in_flight_uncited` | |
| checkPortfolio enforces new discussion or plan must cite a backlog item | `test_check_portfolio_strict_missing_backlog_source` | |
| checkPortfolio detects drift between item status and plan status | `test_check_portfolio_drift_detection` | |
| checkPortfolio flags index drift or missing index | `test_check_portfolio_index_drift` | |
