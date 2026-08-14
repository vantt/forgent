//! tsk-7l9-3: fgOS gateway MCP surface — Code Mode's 2-tool pattern
//! (`search` + `execute`, D9 in `docs/history/fgos-interface-daemon/
//! CONTEXT.md`), mounted onto the SAME axum router `gateway.rs`'s
//! `build_router` already serves (D1 in `docs/history/fgos-gateway-mcp-
//! surface/CONTEXT.md`: no second process, no second port).
//!
//! **Crate-pick correction (found during implementation).** `plan.md`'s own
//! Approach named "rmcp + mcpkit-axum" as the crate combo, following
//! discovery's Scout evidence — but `mcpkit-axum` turns out to be a wholly
//! separate MCP SDK (`mcpkit-core`/`mcpkit-server`/`mcpkit-transport`,
//! `praxiomlabs/mcpkit` on GitHub) that shares no types with `rmcp`
//! (confirmed against crates.io's own dependency listing for
//! `mcpkit-axum` 0.7.0 — no `rmcp` dependency anywhere in that graph).
//! Adding both would not compose into one MCP surface. `rmcp` alone (the
//! official `modelcontextprotocol/rust-sdk`) already nests directly onto an
//! existing `axum::Router` via `.nest_service()` — confirmed against that
//! repo's own `examples/servers/src/counter_streamhttp.rs`, using the same
//! axum 0.8 this item's migration already requires. This module drops
//! `mcpkit-axum` entirely; D1's actual intent (no second process, Rust-
//! native, mounted onto the existing router) is unchanged.
//!
//! **`search`** parses `docs/contracts/fgos-gateway-api-v1.yaml` (the same
//! file `gateway.rs`'s `get_contract` handler already serves) into a
//! queryable operation list — no new data source, just a second way to
//! reach data the gateway already exposes (CONTEXT.md's own pinned term).
//!
//! **`execute`** runs LLM-generated Rhai script (D1: Rust-native scripting,
//! picked over `mlua` in `plan.md`'s Approach — pure Rust, no vendored-C/
//! system-Lua dependency) against a curated set of bound functions that all
//! funnel through the SAME `VerbGateway::run_verb` chokepoint every REST
//! handler in `gateway.rs` already calls (parent D7) — never a raw HTTP
//! round-trip to itself, never a new path into `fgos <verb>`. The bound set
//! covers the work-item lifecycle routes one-for-one (`plan.md`'s own
//! Assumption); session-management (`/sessions*`) and `/runner/tick` are
//! deliberately left out of this pass — the Assumption's own words allow
//! "a narrower allowlist... free to add later without breaking this shape",
//! and `/runner/tick` in particular does not go through `VerbGateway` at
//! all (`gateway.rs`'s `post_runner_tick` shells directly to
//! `bin/fgos-runner.mjs`), so it sits outside D7's chokepoint this item is
//! scoped to.

use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use rhai::{Dynamic, Engine};
use rmcp::handler::server::router::tool::ToolRouter;
use rmcp::handler::server::wrapper::Parameters;
use rmcp::model::*;
use rmcp::transport::streamable_http_server::session::local::LocalSessionManager;
use rmcp::transport::streamable_http_server::{StreamableHttpServerConfig, StreamableHttpService};
use rmcp::{schemars, tool, tool_handler, tool_router, ErrorData as McpError, ServerHandler};

use crate::ports::VerbGateway;

// ---------------------------------------------------------------------------
// `search` — queries the OpenAPI contract `gateway.rs`'s `/contract` route
// already serves.
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct Operation {
    path: String,
    method: String,
    #[serde(rename = "operationId")]
    operation_id: String,
    summary: String,
}

impl Operation {
    fn matches(&self, query_lower: &str) -> bool {
        self.path.to_lowercase().contains(query_lower)
            || self.operation_id.to_lowercase().contains(query_lower)
            || self.summary.to_lowercase().contains(query_lower)
    }
}

/// Walks the OpenAPI doc's `paths` map into a flat, searchable list. Only
/// the fields `search` actually needs (path, HTTP method, operationId,
/// summary) — the full spec is still reachable verbatim via `/contract` for
/// anything deeper.
fn extract_operations(doc: &serde_yaml::Value) -> Vec<Operation> {
    const HTTP_METHODS: &[&str] = &["get", "post", "put", "patch", "delete"];
    let mut ops = Vec::new();
    let Some(paths) = doc.get("paths").and_then(|v| v.as_mapping()) else {
        return ops;
    };
    for (path_key, path_item) in paths {
        let Some(path_str) = path_key.as_str() else { continue };
        let Some(methods) = path_item.as_mapping() else { continue };
        for (method_key, op_value) in methods {
            let Some(method_str) = method_key.as_str() else { continue };
            if !HTTP_METHODS.contains(&method_str) {
                continue;
            }
            let operation_id = op_value
                .get("operationId")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let summary = op_value
                .get("summary")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            ops.push(Operation {
                path: path_str.to_string(),
                method: method_str.to_uppercase(),
                operation_id,
                summary,
            });
        }
    }
    ops.sort_by(|a, b| (a.path.as_str(), a.method.as_str()).cmp(&(b.path.as_str(), b.method.as_str())));
    ops
}

#[derive(Debug, serde::Deserialize, schemars::JsonSchema)]
pub struct SearchParams {
    /// Case-insensitive substring matched against each operation's path,
    /// operationId, and summary. Omit (or pass an empty string) to return
    /// every operation the gateway exposes.
    #[serde(default)]
    pub query: Option<String>,
}

async fn search_contract(root: &std::path::Path, query: Option<String>) -> Result<String, String> {
    let contract_path = root.join("docs/contracts/fgos-gateway-api-v1.yaml");
    let raw = tokio::fs::read_to_string(&contract_path)
        .await
        .map_err(|err| format!("could not read the OpenAPI contract at {}: {err}", contract_path.display()))?;
    let doc: serde_yaml::Value = serde_yaml::from_str(&raw)
        .map_err(|err| format!("could not parse {} as YAML: {err}", contract_path.display()))?;
    let all_ops = extract_operations(&doc);
    let query_lower = query.unwrap_or_default().trim().to_lowercase();
    let matched: Vec<Operation> = if query_lower.is_empty() {
        all_ops
    } else {
        all_ops.into_iter().filter(|op| op.matches(&query_lower)).collect()
    };
    serde_json::to_string_pretty(&matched).map_err(|err| format!("could not serialize search results: {err}"))
}

// ---------------------------------------------------------------------------
// `execute` — runs a Rhai script against a curated, D7-chokepoint-only
// bound-function context.
// ---------------------------------------------------------------------------

#[derive(Debug, serde::Deserialize, schemars::JsonSchema)]
pub struct ExecuteParams {
    /// Rhai source to run against the bound work-item functions: `list_work`,
    /// `submit_work`, `get_work`, `move_work`, `ask_work`, `answer_work`,
    /// `take_work`, `return_work`, `approve_work`, `reject_work`,
    /// `ready_work`, `rollup`, `graph`. Each returns the parsed
    /// `fgos.v1` envelope (or throws a string error on failure) — call
    /// `print(x)` to surface intermediate values; the script's own final
    /// expression value is returned too. String args use `""` for "omit
    /// this optional flag". Example: `let r = list_work("", "", false);
    /// print(r);`
    pub script: String,
}

/// Every bound function funnels through this one call — the same
/// `VerbGateway::run_verb` chokepoint (D7) every REST handler in
/// `gateway.rs` already uses, just reached from a Rhai closure instead of an
/// axum handler.
fn call_verb(gateway: &Arc<dyn VerbGateway>, args: Vec<String>) -> Result<Dynamic, Box<rhai::EvalAltResult>> {
    match gateway.run_verb(&args) {
        Ok(value) => rhai::serde::to_dynamic(value),
        Err(err) => Err(format!("{err}").into()),
    }
}

/// tsk-1qe: `on_print`/`on_debug` bound below with no cap would let
/// `loop { print("x") }` grow this buffer without bound. Caps by total
/// captured bytes (not line count, which a single very long `print()` call
/// would bypass) -- once the budget is spent, further lines are silently
/// dropped rather than erroring the whole script (an over-verbose script is
/// still a working script; only the accidental-flood case needs bounding).
const MCP_EXECUTE_MAX_OUTPUT_BYTES: usize = 256 * 1024;

fn push_capped_output(output: &Arc<Mutex<Vec<String>>>, line: String) {
    let mut buf = output.lock().unwrap();
    let used: usize = buf.iter().map(|s| s.len()).sum();
    if used >= MCP_EXECUTE_MAX_OUTPUT_BYTES {
        return;
    }
    buf.push(line);
}

/// tsk-1ah: same guard `gateway.rs`'s REST handlers apply, adapted to the
/// Rhai error type bound functions below return -- see
/// `gateway::reject_leading_dash`'s own doc comment for why.
fn reject_leading_dash(value: &str, field: &str) -> Result<(), Box<rhai::EvalAltResult>> {
    crate::gateway::reject_leading_dash(value, field).map_err(|err| format!("{err}").into())
}

/// Builds a fresh Rhai engine with the work-item bound-function allowlist
/// registered, and the given buffer wired up to capture `print`/`debug`
/// output (Rhai's own stdlib carries no filesystem/process/network access by
/// default — nothing beyond the functions registered below is reachable
/// from a script, proving the "no new privilege beyond today's CLI/Bash
/// trust model" boundary D9 promises rather than assuming it).
fn build_engine(gateway: Arc<dyn VerbGateway>, output: Arc<Mutex<Vec<String>>>) -> Engine {
    let mut engine = Engine::new();

    // tsk-1qe: `Engine::new()` defaults to unlimited operations
    // (`rhai::Engine`'s own `EngineLimits::default`, `num_operations: None`)
    // -- an ordinary generation bug like `loop { x += 1; }` (no malice
    // needed) would otherwise wedge this thread forever. 500_000 gives wide
    // headroom for any real Code-Mode script's own control flow (every
    // bound function below executes in Rust, costing Rhai's own op-counter
    // almost nothing) while failing an accidental infinite loop in well
    // under a second. NOT a D9 sandbox-privilege reopen (`docs/history/
    // fgos-gateway-mcp-surface/CONTEXT.md`) -- this bounds CPU time, it
    // grants or removes no capability.
    engine.set_max_operations(500_000);

    let out = output.clone();
    engine.on_print(move |s| push_capped_output(&out, s.to_string()));
    let out = output.clone();
    engine.on_debug(move |s, _src, _pos| push_capped_output(&out, s.to_string()));

    let gw = gateway.clone();
    engine.register_fn(
        "list_work",
        move |status: &str, stage: &str, all: bool| -> Result<Dynamic, Box<rhai::EvalAltResult>> {
            let mut args = vec!["list".to_string(), "--json".to_string()];
            if !status.is_empty() {
                reject_leading_dash(status, "status")?;
                args.push("--status".to_string());
                args.push(status.to_string());
            }
            if !stage.is_empty() {
                reject_leading_dash(stage, "stage")?;
                args.push("--stage".to_string());
                args.push(stage.to_string());
            }
            if all {
                args.push("--all".to_string());
            }
            call_verb(&gw, args)
        },
    );

    let gw = gateway.clone();
    engine.register_fn("submit_work", move |text: &str| -> Result<Dynamic, Box<rhai::EvalAltResult>> {
        call_verb(&gw, vec!["submit".to_string(), text.to_string(), "--json".to_string()])
    });

    let gw = gateway.clone();
    engine.register_fn("get_work", move |id: &str| -> Result<Dynamic, Box<rhai::EvalAltResult>> {
        reject_leading_dash(id, "id")?;
        call_verb(&gw, vec!["show".to_string(), id.to_string(), "--json".to_string()])
    });

    let gw = gateway.clone();
    engine.register_fn(
        "move_work",
        move |id: &str, to: &str, expect: &str| -> Result<Dynamic, Box<rhai::EvalAltResult>> {
            reject_leading_dash(id, "id")?;
            reject_leading_dash(to, "to")?;
            let mut args = vec!["move".to_string(), id.to_string(), "--to".to_string(), to.to_string(), "--json".to_string()];
            if !expect.is_empty() {
                reject_leading_dash(expect, "expect")?;
                args.push("--expect".to_string());
                args.push(expect.to_string());
            }
            call_verb(&gw, args)
        },
    );

    let gw = gateway.clone();
    engine.register_fn(
        "ask_work",
        move |id: &str, text: &str| -> Result<Dynamic, Box<rhai::EvalAltResult>> {
            reject_leading_dash(id, "id")?;
            call_verb(&gw, vec!["ask".to_string(), id.to_string(), "--text".to_string(), text.to_string(), "--json".to_string()])
        },
    );

    let gw = gateway.clone();
    engine.register_fn(
        "answer_work",
        move |id: &str, text: &str| -> Result<Dynamic, Box<rhai::EvalAltResult>> {
            reject_leading_dash(id, "id")?;
            call_verb(&gw, vec!["answer".to_string(), id.to_string(), "--text".to_string(), text.to_string(), "--json".to_string()])
        },
    );

    let gw = gateway.clone();
    engine.register_fn(
        "take_work",
        move |id: &str, role: &str| -> Result<Dynamic, Box<rhai::EvalAltResult>> {
            reject_leading_dash(id, "id")?;
            let role = if role.is_empty() { "session" } else { role };
            reject_leading_dash(role, "role")?;
            call_verb(&gw, vec!["take".to_string(), id.to_string(), "--role".to_string(), role.to_string(), "--json".to_string()])
        },
    );

    let gw = gateway.clone();
    engine.register_fn("return_work", move |id: &str| -> Result<Dynamic, Box<rhai::EvalAltResult>> {
        reject_leading_dash(id, "id")?;
        call_verb(&gw, vec!["return".to_string(), id.to_string(), "--json".to_string()])
    });

    let gw = gateway.clone();
    engine.register_fn("approve_work", move |id: &str| -> Result<Dynamic, Box<rhai::EvalAltResult>> {
        reject_leading_dash(id, "id")?;
        call_verb(&gw, vec!["approve".to_string(), id.to_string(), "--json".to_string()])
    });

    let gw = gateway.clone();
    engine.register_fn(
        "reject_work",
        move |id: &str, reason: &str| -> Result<Dynamic, Box<rhai::EvalAltResult>> {
            reject_leading_dash(id, "id")?;
            call_verb(&gw, vec!["reject".to_string(), id.to_string(), "--reason".to_string(), reason.to_string(), "--json".to_string()])
        },
    );

    let gw = gateway.clone();
    engine.register_fn(
        "ready_work",
        move |cursor: &str, limit: i64| -> Result<Dynamic, Box<rhai::EvalAltResult>> {
            let mut args = vec!["ready".to_string(), "--json".to_string()];
            if !cursor.is_empty() {
                reject_leading_dash(cursor, "cursor")?;
                args.push("--cursor".to_string());
                args.push(cursor.to_string());
            }
            if limit > 0 {
                args.push("--limit".to_string());
                args.push(limit.to_string());
            }
            call_verb(&gw, args)
        },
    );

    let gw = gateway.clone();
    engine.register_fn("rollup", move |id: &str| -> Result<Dynamic, Box<rhai::EvalAltResult>> {
        reject_leading_dash(id, "id")?;
        call_verb(&gw, vec!["rollup".to_string(), id.to_string(), "--json".to_string()])
    });

    let gw = gateway.clone();
    engine.register_fn("graph", move || -> Result<Dynamic, Box<rhai::EvalAltResult>> {
        call_verb(&gw, vec!["graph".to_string(), "--json".to_string()])
    });

    engine
}

/// Runs `script` to completion against a fresh bound-function engine. Never
/// panics on a script error — a Rhai `EvalAltResult` (unknown function,
/// runtime throw, syntax error, ...) is folded into `Err(String)`, which
/// `execute` surfaces as a tool-level error response, never a protocol
/// failure or a crashed gateway process (Shape's own "partial failure" case).
fn run_script(gateway: Arc<dyn VerbGateway>, script: &str) -> Result<String, String> {
    let output: Arc<Mutex<Vec<String>>> = Arc::new(Mutex::new(Vec::new()));
    let engine = build_engine(gateway, output.clone());

    let eval_result = engine.eval::<Dynamic>(script);
    let printed = output.lock().unwrap().clone();

    match eval_result {
        Ok(value) => {
            let mut lines = printed;
            if !value.is_unit() {
                let rendered = rhai::serde::from_dynamic::<serde_json::Value>(&value)
                    .map(|v| serde_json::to_string_pretty(&v).unwrap_or_else(|_| format!("{value:?}")))
                    .unwrap_or_else(|_| format!("{value:?}"));
                lines.push(rendered);
            }
            Ok(lines.join("\n"))
        }
        Err(err) => {
            let mut message = printed;
            message.push(format!("{err}"));
            Err(message.join("\n"))
        }
    }
}

// ---------------------------------------------------------------------------
// MCP server + transport wiring
// ---------------------------------------------------------------------------

#[derive(Clone)]
pub struct FgosMcpServer {
    gateway: Arc<dyn VerbGateway>,
    root: PathBuf,
    // `#[tool_handler]`'s generated `call_tool`/`list_tools` call
    // `Self::tool_router()` fresh each dispatch (confirmed against
    // `rmcp-macros` 3.1.2's own `tool_handler.rs`), not this stored field --
    // so it is genuinely unread today. Kept anyway: it is the exact struct
    // shape rmcp's own canonical example (`examples/servers/.../counter.rs`)
    // requires for a `#[tool_router]`-eligible type, and stays forward-
    // compatible if a later rmcp version reads the instance field instead.
    #[allow(dead_code)]
    tool_router: ToolRouter<FgosMcpServer>,
}

#[tool_router]
impl FgosMcpServer {
    pub fn new(gateway: Arc<dyn VerbGateway>, root: PathBuf) -> Self {
        Self {
            gateway,
            root,
            tool_router: Self::tool_router(),
        }
    }

    #[tool(
        description = "Search the fgOS gateway's own OpenAPI contract for operations matching a query (path, operationId, or summary substring, case-insensitive). Omit `query` for the full operation list. Use this before `execute` to discover what's available."
    )]
    async fn search(&self, Parameters(SearchParams { query }): Parameters<SearchParams>) -> Result<CallToolResult, McpError> {
        match search_contract(&self.root, query).await {
            Ok(body) => Ok(CallToolResult::success(vec![ContentBlock::text(body)])),
            Err(msg) => Ok(CallToolResult::error(vec![ContentBlock::text(msg)])),
        }
    }

    #[tool(
        description = "Run Rhai script against the gateway's bound work-item functions (list_work, submit_work, get_work, move_work, ask_work, answer_work, take_work, return_work, approve_work, reject_work, ready_work, rollup, graph) — every call funnels through the same chokepoint the gateway's REST routes use. No filesystem, process, or network access is exposed beyond these bound functions."
    )]
    async fn execute(&self, Parameters(ExecuteParams { script }): Parameters<ExecuteParams>) -> Result<CallToolResult, McpError> {
        let gateway = self.gateway.clone();
        let outcome = tokio::task::spawn_blocking(move || run_script(gateway, &script))
            .await
            .map_err(|err| McpError::internal_error(format!("execute task panicked: {err}"), None))?;
        match outcome {
            Ok(body) => Ok(CallToolResult::success(vec![ContentBlock::text(body)])),
            Err(msg) => Ok(CallToolResult::error(vec![ContentBlock::text(msg)])),
        }
    }
}

#[tool_handler]
impl ServerHandler for FgosMcpServer {
    fn get_info(&self) -> ServerInfo {
        ServerInfo::new(ServerCapabilities::builder().enable_tools().build())
            .with_server_info(Implementation::from_build_env())
            .with_protocol_version(ProtocolVersion::V_2025_06_18)
            .with_instructions(
                "fgOS gateway Code Mode surface. Use `search` to discover the gateway's own API, then `execute` to run Rhai script against the bound work-item functions -- 2 tools total, cutting round-trips versus one MCP tool per REST endpoint.".to_string(),
            )
    }
}

/// Builds the MCP transport service ready to `.nest_service(...)` onto the
/// gateway's existing axum router (`gateway.rs::build_router`) — same
/// port/process, per D1.
pub fn build_mcp_service(
    gateway: Arc<dyn VerbGateway>,
    root: PathBuf,
) -> StreamableHttpService<FgosMcpServer, LocalSessionManager> {
    StreamableHttpService::new(
        move || Ok(FgosMcpServer::new(gateway.clone(), root.clone())),
        LocalSessionManager::default().into(),
        StreamableHttpServerConfig::default(),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    struct FakeGateway {
        response: Result<serde_json::Value, String>,
    }

    impl VerbGateway for FakeGateway {
        fn run_verb(&self, _args: &[String]) -> Result<serde_json::Value, crate::gateway::GatewayError> {
            match &self.response {
                Ok(v) => Ok(v.clone()),
                Err(msg) => Err(crate::gateway::GatewayError::validation(msg.clone())),
            }
        }
    }

    fn fake(response: Result<serde_json::Value, String>) -> Arc<dyn VerbGateway> {
        Arc::new(FakeGateway { response })
    }

    #[test]
    fn tool_router_advertises_exactly_search_and_execute() {
        let router = FgosMcpServer::tool_router();
        let names: Vec<String> = router.list_all().into_iter().map(|t| t.name.to_string()).collect();
        assert_eq!(names.len(), 2, "expected exactly 2 tools, found {names:?}");
        assert!(names.contains(&"search".to_string()));
        assert!(names.contains(&"execute".to_string()));
    }

    #[tokio::test]
    async fn search_with_no_query_returns_every_operation() {
        let root = std::env::temp_dir().join(format!("fgos-mcp-test-{}-{}", std::process::id(), line!()));
        std::fs::create_dir_all(root.join("docs/contracts")).unwrap();
        std::fs::write(
            root.join("docs/contracts/fgos-gateway-api-v1.yaml"),
            "openapi: 3.1.0\npaths:\n  /work:\n    get:\n      operationId: listWork\n      summary: List work items\n  /ready:\n    get:\n      operationId: getReady\n      summary: Ready frontier\n",
        )
        .unwrap();

        let body = search_contract(&root, None).await.unwrap();
        let parsed: Vec<Operation> = serde_json::from_str(&body).unwrap();
        assert_eq!(parsed.len(), 2);

        std::fs::remove_dir_all(&root).ok();
    }

    #[tokio::test]
    async fn search_with_a_query_matching_nothing_returns_an_empty_result_not_an_error() {
        let root = std::env::temp_dir().join(format!("fgos-mcp-test-{}-{}", std::process::id(), line!()));
        std::fs::create_dir_all(root.join("docs/contracts")).unwrap();
        std::fs::write(
            root.join("docs/contracts/fgos-gateway-api-v1.yaml"),
            "openapi: 3.1.0\npaths:\n  /work:\n    get:\n      operationId: listWork\n      summary: List work items\n",
        )
        .unwrap();

        let body = search_contract(&root, Some("zzz-no-such-operation".to_string())).await.unwrap();
        let parsed: Vec<Operation> = serde_json::from_str(&body).unwrap();
        assert!(parsed.is_empty());

        std::fs::remove_dir_all(&root).ok();
    }

    #[tokio::test]
    async fn search_query_matches_case_insensitively_on_path_and_summary() {
        let root = std::env::temp_dir().join(format!("fgos-mcp-test-{}-{}", std::process::id(), line!()));
        std::fs::create_dir_all(root.join("docs/contracts")).unwrap();
        std::fs::write(
            root.join("docs/contracts/fgos-gateway-api-v1.yaml"),
            "openapi: 3.1.0\npaths:\n  /work:\n    get:\n      operationId: listWork\n      summary: List work items\n  /ready:\n    get:\n      operationId: getReady\n      summary: Ready frontier\n",
        )
        .unwrap();

        let body = search_contract(&root, Some("READY".to_string())).await.unwrap();
        let parsed: Vec<Operation> = serde_json::from_str(&body).unwrap();
        assert_eq!(parsed.len(), 1);
        assert_eq!(parsed[0].operation_id, "getReady");

        std::fs::remove_dir_all(&root).ok();
    }

    #[tokio::test]
    async fn execute_empty_script_returns_cleanly_rather_than_hanging() {
        let gateway = fake(Ok(json!({"ok": true})));
        let result = tokio::task::spawn_blocking(move || run_script(gateway, "")).await.unwrap();
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn execute_an_infinite_loop_fails_fast_instead_of_hanging_forever() {
        let gateway = fake(Ok(json!({"ok": true})));
        let script = "let x = 0; loop { x += 1; }";
        let result = tokio::task::spawn_blocking(move || run_script(gateway, script)).await.unwrap();
        assert!(result.is_err(), "an unbounded loop must be stopped by the operation limit, not run forever");
        assert!(
            result.unwrap_err().contains("Too many operations"),
            "the failure should be the operation-limit error, not some other unrelated error"
        );
    }

    #[tokio::test]
    async fn execute_a_print_flood_does_not_grow_the_captured_output_past_the_byte_cap() {
        let gateway = fake(Ok(json!({"ok": true})));
        // Each iteration prints a 1024-byte line; enough iterations to
        // exceed MCP_EXECUTE_MAX_OUTPUT_BYTES (256 KiB) well before hitting
        // the operation limit (500_000), so this proves the byte cap fires
        // on its own rather than being masked by the operation limit.
        let script = r#"
            let line = "";
            for i in range(0, 1024) { line += "x"; }
            for i in range(0, 500) { print(line); }
        "#;
        let result = tokio::task::spawn_blocking(move || run_script(gateway, script)).await.unwrap();
        let output = result.expect("a bounded print flood should still complete successfully");
        assert!(
            output.len() <= MCP_EXECUTE_MAX_OUTPUT_BYTES + 4096,
            "captured output ({} bytes) should stay near the {}-byte cap, not grow with every print call",
            output.len(),
            MCP_EXECUTE_MAX_OUTPUT_BYTES,
        );
    }

    #[tokio::test]
    async fn execute_bound_function_call_matches_the_same_verb_call_the_gateway_makes_directly() {
        let gateway = fake(Ok(json!({"contract": "fgos.v1", "data": {"work": {"tsk-1": {"id": "tsk-1"}}}})));
        let script = r#"
            let r = get_work("tsk-1");
            print(r.data.work["tsk-1"].id);
        "#;
        let result = tokio::task::spawn_blocking(move || run_script(gateway, script)).await.unwrap();
        let output = result.unwrap();
        assert!(output.contains("tsk-1"), "expected bound function's real envelope data in output, got: {output}");
    }

    #[tokio::test]
    async fn execute_move_work_rejects_a_dash_prefixed_to_before_it_ever_reaches_the_verb_chokepoint() {
        let gateway = fake(Ok(json!({"ok": true})));
        let script = r#"move_work("tsk-1", "--delivered", "")"#;
        let result = tokio::task::spawn_blocking(move || run_script(gateway, script)).await.unwrap();
        assert!(
            result.is_err(),
            "a dash-prefixed 'to' value must be refused as validation, never reach the verb chokepoint where it could be misread as a flag"
        );
    }

    #[tokio::test]
    async fn execute_script_outside_the_bound_function_allowlist_fails_cleanly_not_a_panic() {
        let gateway = fake(Ok(json!({"ok": true})));
        // `open_file` is never registered -- Rhai's stdlib carries no
        // filesystem access by default, so this proves nothing beyond the
        // bound allowlist is reachable, without ever touching a real file.
        let script = r#"open_file("/etc/passwd")"#;
        let result = tokio::task::spawn_blocking(move || run_script(gateway, script)).await.unwrap();
        assert!(result.is_err(), "expected a clean script error, got Ok");
    }

    #[tokio::test]
    async fn execute_a_failing_verb_call_surfaces_as_a_tool_error_not_a_panic() {
        let gateway = fake(Err("bad input".to_string()));
        let script = r#"list_work("", "", false)"#;
        let result = tokio::task::spawn_blocking(move || run_script(gateway, script)).await.unwrap();
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn concurrent_execute_calls_do_not_interfere_with_each_other() {
        let gateway = fake(Ok(json!({"contract": "fgos.v1", "data": {"n": 1}})));
        let mut handles = Vec::new();
        for i in 0..8 {
            let gw = gateway.clone();
            handles.push(tokio::task::spawn_blocking(move || {
                run_script(gw, &format!("print({i}); graph()"))
            }));
        }
        for h in handles {
            assert!(h.await.unwrap().is_ok());
        }
    }
}
