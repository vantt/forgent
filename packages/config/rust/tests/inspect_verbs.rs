//! Owning proof of what the read verbs print (`show`, `explain`, `standard`) over the bundled
//! schemas and standard and a small project. Redaction itself is `golden_no_echo.rs`; the routing
//! of the verbs is one case per verb in `apps/fgos/tests/cli_tests.rs`.
#![cfg(unix)]
mod common;

use fgos_config::detect::NoDetectors;
use fgos_config::inspect::{explain, show, standard_files, standard_fragment};
use fgos_config::schema::Schemas;
use fgos_config::snapshot::{snapshot, Context};
use fgos_config::standard::Standard;
use fgos_yaml_doc::path::parse_path;
use serde_json::json;

fn with_bundle(test: impl FnOnce(&Context)) {
    let (schemas, digest) = Schemas::bundled().unwrap();
    let standard = Standard::bundled(&schemas).unwrap();
    let ctx = Context {
        schemas: &schemas,
        standard: &standard,
        digest: &digest,
        detectors: &NoDetectors,
    };
    test(&ctx);
}

#[test]
fn show_prints_a_subtree_with_the_file_line_and_layer_each_leaf_came_from() {
    let dir = common::temp("inspect", "show");
    let roots = common::lay_out(
        &dir,
        &json!({ "files": { "project/.fgos/config.yaml": ["gateBypass:", "  level: light"] } }),
    );
    with_bundle(|ctx| {
        let snap = snapshot(ctx, &roots).unwrap();
        let shown = show(ctx, &snap, &parse_path("gateBypass").unwrap());
        assert_eq!(shown["value"], json!({ "level": "light" }));
        assert_eq!(shown["provenance"][0]["layer"], "project");
        assert_eq!(shown["provenance"][0]["line"], 2);
        assert_eq!(shown["revisions"]["global"], "absent");
        let missing = show(ctx, &snap, &parse_path("nothing.here").unwrap());
        assert_eq!(missing["present"], false);
    });
}

#[test]
fn explain_names_the_schema_node_and_says_undescribed_for_a_key_without_one() {
    with_bundle(|ctx| {
        let token = explain(ctx, None, &parse_path("gateway.token").unwrap());
        assert_eq!(token["described"], true);
        assert_eq!(token["scope"], "global-only");
        assert_eq!(token["configFile"], "token");
        assert_eq!(token["sensitivity"], "secret-value");
        assert_eq!(token["standard"], json!(null));
        assert_eq!(token["owner"], "fgos-gateway");
        let level = explain(ctx, None, &parse_path("gateBypass.level").unwrap());
        assert_eq!(level["standard"], "off");
        assert_eq!(level["enum"], json!(["off", "light", "standard", "heavy"]));
        let none = explain(ctx, None, &parse_path("nothing.here").unwrap());
        assert_eq!(none["described"], false);
    });
}

#[test]
fn explain_names_the_layer_of_a_list_or_mapping_that_only_the_global_file_sets() {
    let dir = common::temp("inspect", "explain-global-list");
    let roots = common::lay_out(
        &dir,
        &json!({ "files": { "home/.fgos/config.yaml": [
            "runner:",
            "  executors:",
            "    claude:",
            "      supports:",
            "        skills: [\"ak:cook\"]",
        ] } }),
    );
    with_bundle(|ctx| {
        let snap = snapshot(ctx, &roots).unwrap();
        for text in [
            "runner.executors.claude.supports.skills",
            "runner.executors.claude.supports.skills[0]",
        ] {
            let list = explain(ctx, Some(&snap), &parse_path(text).unwrap());
            assert_eq!(list["current"]["layer"], "global", "{text}");
            assert_eq!(list["current"]["line"], 5, "{text}");
            assert_eq!(list["file"], "global:config.yaml", "{text}");
        }
        let shown = show(
            ctx,
            &snap,
            &parse_path("runner.executors.claude.supports.skills").unwrap(),
        );
        let list = explain(
            ctx,
            Some(&snap),
            &parse_path("runner.executors.claude.supports.skills").unwrap(),
        );
        assert_eq!(
            list["current"], shown["provenance"][0],
            "explain and show read the same origin"
        );
    });
}

#[test]
fn explain_answers_a_dispatch_key_from_its_schema_and_names_the_nearest_keys_of_a_typo() {
    with_bundle(|ctx| {
        let wait = explain(ctx, None, &parse_path("dispatch.cancelWaitMs").unwrap());
        assert_eq!(wait["described"], true);
        assert_eq!(wait["standard"], 15000);
        assert_eq!(wait["configFile"], "config");
        assert_eq!(wait["owner"], "run-supervisor");
        assert_eq!(wait["minimum"], 1000);
        let typo = explain(ctx, None, &parse_path("dispatch.cancelWaitM").unwrap());
        assert_eq!(typo["described"], false);
        assert_eq!(typo["didYouMean"], json!(["dispatch.cancelWaitMs"]));
        let level = explain(ctx, None, &parse_path("gateBypass.levl").unwrap());
        assert_eq!(level["didYouMean"], json!(["gateBypass.level"]));
    });
}

#[test]
fn standard_fragment_keeps_ancestors_and_doc_lines_and_validates_where_its_scope_allows() {
    with_bundle(|ctx| {
        assert_eq!(
            standard_files(ctx)["files"].as_array().unwrap().len(),
            ctx.standard.files.len()
        );
        let path = parse_path("gateway.port").unwrap();
        let fragment = standard_fragment(ctx, &path).unwrap().unwrap();
        let text = fragment["fragment"].as_str().unwrap();
        assert!(text.contains("# @fgos:doc The fgOS gateway"));
        assert!(text.contains("# @fgos:doc TCP port the gateway listens on"));
        assert!(text.contains("port: 4170"));
        assert!(!text.contains("bind:"), "siblings are removed: {text}");
        // Pasted into the file its scope allows (the gateway section is global-only), it validates.
        let lines: Vec<&str> = text.lines().collect();
        let dir = common::temp("inspect", "fragment");
        let roots = common::lay_out(
            &dir,
            &json!({ "files": { "home/.fgos/config.yaml": lines } }),
        );
        let outcome = snapshot(ctx, &roots);
        assert!(outcome.is_ok(), "{outcome:?}");
        assert!(standard_fragment(ctx, &parse_path("nothing.here").unwrap())
            .unwrap()
            .is_none());
    });
}
