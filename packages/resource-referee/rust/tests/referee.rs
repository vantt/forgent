use fgos_resource_referee::{evaluate, Class, Verdict, VerdictKind};
use serde_json::{json, Value};

fn path(r: &str) -> Value {
    json!({ "space": "path", "ref": r })
}

fn facts(nodes: Value) -> Value {
    json!({ "nodes": nodes, "graph": { "cycles": [], "dangling": [] } })
}

fn run(f: &Value, rules: Value) -> Verdict {
    evaluate(f, &json!({ "rules": rules }), None).expect("evaluates")
}

fn codes(v: &Verdict) -> Vec<&'static str> {
    v.findings.iter().map(|f| f.code).collect()
}

fn refusal(f: &Value, ruleset: Value) -> (&'static str, String) {
    let r = evaluate(f, &ruleset, None).expect_err("refused");
    (r.code, r.field)
}

#[test]
fn no_cycles_reports_the_canonical_cycle_of_each_component() {
    let mut f = facts(json!([{ "id": "a", "readOnly": true }, { "id": "b", "readOnly": true }]));
    f["graph"]["cycles"] = json!([{ "members": ["a", "b"], "cycle": ["a", "b", "a"], "cycleKinds": ["depends", "depends"] }]);
    let v = run(&f, json!([]));
    assert_eq!(codes(&v), ["cycle"]);
    assert_eq!(v.findings[0].nodes, ["a", "b"]);
    assert_eq!(v.findings[0].evidence["cycle"], json!(["a", "b", "a"]));
    assert_eq!(v.verdict, VerdictKind::Reject);
}

#[test]
fn no_dangling_edges_names_the_node_that_points_at_a_missing_id() {
    let mut f = facts(json!([{ "id": "a", "readOnly": true }]));
    f["graph"]["dangling"] =
        json!([{ "source": "edge", "index": 0, "from": "a", "to": "zz", "missing": ["zz"] }]);
    let v = run(&f, json!([]));
    assert_eq!(codes(&v), ["dangling-edge"]);
    assert_eq!(v.findings[0].nodes, ["a"]);
    assert_eq!(v.findings[0].evidence["missing"], json!(["zz"]));
}

#[test]
fn claims_declared_distinguishes_missing_empty_and_read_only_with_claims() {
    let f = facts(json!([
        { "id": "none" },
        { "id": "empty", "claims": [] },
        { "id": "ro-ok", "readOnly": true, "claims": [] },
        { "id": "ro-claims", "readOnly": true, "claims": [path("src/**")] },
        { "id": "fine", "claims": [path("src/a")] }
    ]));
    let v = run(&f, json!([]));
    assert_eq!(
        codes(&v),
        ["claims-missing", "footprint-empty", "read-only-with-claims"]
    );
    assert_eq!(v.read_only_nodes, ["ro-ok", "ro-claims"]);
    assert_eq!(v.counts.read_only_nodes, 2);
}

#[test]
fn claims_declared_flags_per_item_limits_and_still_evaluates_the_rest() {
    let many: Vec<Value> = (0..513)
        .map(|i| json!({ "space": "port", "ref": i.to_string() }))
        .collect();
    let f = facts(json!([
        { "id": "many", "claims": many },
        { "id": "long", "claims": [path(&"x".repeat(1025))] },
        { "id": "rest" }
    ]));
    let v = run(&f, json!([]));
    assert_eq!(
        codes(&v),
        ["claims-over-limit", "claims-over-limit", "claims-missing"]
    );
    assert_eq!(v.findings[0].evidence["limit"], "claims-per-node");
    assert_eq!(v.findings[1].evidence["limit"], "entry-bytes");
}

#[test]
fn claims_declared_turns_each_write_scope_problem_into_an_entry_finding() {
    let mut f = facts(json!([{ "id": "a", "claims": [path("../x")] }]));
    f["problems"] = json!([{ "item": "a", "code": "entry-invalid", "entry": "../x", "why": "escapes the repo" }]);
    let v = run(&f, json!([]));
    assert_eq!(codes(&v), ["footprint-entry-invalid"]);
    assert_eq!(v.findings[0].nodes, ["a"]);
    assert_eq!(v.findings[0].evidence["why"], "escapes the repo");
}

#[test]
fn facts_not_truncated_blocks_whatever_the_policy_says() {
    let mut f = facts(json!([{ "id": "a", "claims": [path("src/a")] }]));
    f["truncated"] = json!({ "reason": "pairs-cap", "limit": 100000, "source": "write-scope" });
    for rules in [
        json!([]),
        json!([{ "check": "declared-layers-valid", "class": "advisory" }, { "check": "facts-not-truncated" }]),
    ] {
        let v = run(&f, rules);
        assert_eq!(codes(&v), ["facts-truncated"]);
        assert_eq!(v.verdict, VerdictKind::Reject);
    }
}

#[test]
fn no_exclusion_in_one_layer_blocks_a_pair_declared_in_the_same_layer_only() {
    let mut f = facts(json!([
        { "id": "a", "claims": [path("src/**")], "layer": 1 },
        { "id": "b", "claims": [path("src/x")], "layer": 1 },
        { "id": "c", "claims": [path("src/y")], "layer": 2 },
        { "id": "d", "claims": [path("docs/z")], "layer": 3 }
    ]));
    f["exclusions"] = json!([{ "a": "a", "b": "b", "shared": ["src/x"] }, { "a": "a", "b": "c", "shared": ["src/y"] }, { "a": "a", "b": "d", "shared": [] }]);
    let v = run(&f, json!([]));
    assert_eq!(codes(&v), ["exclusion-in-one-layer"]);
    assert_eq!(v.findings[0].nodes, ["a", "b"]);
    assert_eq!(v.findings[0].evidence["layer"], 1);
}

#[test]
fn declared_layers_valid_judges_order_and_completeness_and_is_vacuous_without_layers() {
    let undeclared = facts(
        json!([{ "id": "a", "readOnly": true }, { "id": "b", "readOnly": true, "dependsOn": ["a"] }]),
    );
    let rules = json!([{ "check": "declared-layers-valid" }]);
    assert_eq!(run(&undeclared, rules.clone()).verdict, VerdictKind::Accept);
    let f = facts(json!([
        { "id": "a", "readOnly": true, "layer": 2 },
        { "id": "b", "readOnly": true, "layer": 2, "dependsOn": ["a"] },
        { "id": "c", "readOnly": true }
    ]));
    let v = run(&f, rules);
    assert_eq!(codes(&v), ["layer-order-violation", "layer-missing"]);
    assert_eq!(v.findings[0].nodes, ["b", "a"]);
    assert_eq!(v.counts.declared_layers, 2);
    assert_eq!(v.verdict, VerdictKind::Reject);
    let advisory = run(
        &f,
        json!([{ "check": "declared-layers-valid", "class": "advisory" }]),
    );
    assert_eq!(advisory.verdict, VerdictKind::AcceptWithAdvice);
    assert!(advisory.findings.iter().all(|x| x.class == Class::Advisory));
}

#[test]
fn max_layer_width_counts_non_read_only_units_and_is_advisory_by_default() {
    let f = facts(json!([
        { "id": "a", "claims": [path("a")], "layer": 1 },
        { "id": "b", "claims": [path("b")], "layer": 1 },
        { "id": "r", "readOnly": true, "layer": 1 },
        { "id": "c", "claims": [path("c")], "layer": 2 }
    ]));
    let v = run(
        &f,
        json!([{ "check": "max-layer-width", "params": { "max": 1 } }]),
    );
    assert_eq!(codes(&v), ["layer-width-exceeded"]);
    assert_eq!(v.findings[0].nodes, ["a", "b"]);
    assert_eq!(
        v.findings[0].evidence,
        json!({ "layer": 1, "width": 2, "max": 1 })
    );
    assert_eq!(v.verdict, VerdictKind::AcceptWithAdvice);
    let wide = run(
        &f,
        json!([{ "check": "max-layer-width", "params": { "max": 2 } }]),
    );
    assert_eq!(wide.verdict, VerdictKind::Accept);
}

#[test]
fn every_blocking_code_is_produced_by_some_case() {
    let mut produced: Vec<&str> = Vec::new();
    let mut f = facts(json!([
        { "id": "a", "claims": [path("src/**")], "layer": 1 },
        { "id": "b", "claims": [path("src/x"), path("../x")], "layer": 1, "dependsOn": ["a"] },
        { "id": "none" },
        { "id": "empty", "claims": [] },
        { "id": "ro", "readOnly": true, "claims": [path("p")] },
        { "id": "long", "claims": [path(&"y".repeat(1025))] },
        { "id": "nolayer", "claims": [path("src/z")] }
    ]));
    f["graph"]["cycles"] =
        json!([{ "members": ["a"], "cycle": ["a", "a"], "cycleKinds": ["depends"] }]);
    f["graph"]["dangling"] =
        json!([{ "source": "edge", "index": 0, "from": "a", "to": "q", "missing": ["q"] }]);
    f["exclusions"] = json!([
        { "a": "a", "b": "b", "shared": ["src/x"] },
        { "a": "a", "b": "nolayer", "shared": ["src/z"] }
    ]);
    f["problems"] = json!([{ "item": "b", "code": "entry-invalid", "entry": "../x", "why": "w" }]);
    f["truncated"] = json!({ "reason": "r", "limit": 1, "source": "s" });
    let v = run(&f, json!([{ "check": "declared-layers-valid" }]));
    for finding in &v.findings {
        if finding.class == Class::Blocking {
            produced.push(finding.code);
        }
    }
    // The list of blocking codes is the contract's, so a new code cannot be added without a case here.
    let contract: serde_json::Value = serde_json::from_str(include_str!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../contracts/resource-referee.v1.json"
    )))
    .unwrap();
    let blocking: Vec<&str> = contract["findings"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|f| f["class"] == "blocking")
        .map(|f| f["code"].as_str().unwrap())
        .collect();
    assert!(blocking.contains(&"exclusion-layer-undeclared"));
    for code in blocking {
        assert!(produced.contains(&code), "no case produced {code}");
    }
}

#[test]
fn a_truncated_input_never_yields_accept_or_advice_whatever_the_policy() {
    let truncated =
        json!({ "reason": "comparison-cap", "limit": 50000000, "source": "write-scope" });
    let policies = [
        json!([]),
        json!([{ "check": "declared-layers-valid", "class": "advisory" }]),
        json!([{ "check": "max-layer-width", "class": "advisory", "params": { "max": 5 } }]),
        json!([{ "check": "no-cycles" }, { "check": "facts-not-truncated", "params": {} }]),
    ];
    for rules in policies {
        let mut f = facts(json!([]));
        f["truncated"] = truncated.clone();
        assert_eq!(run(&f, rules).verdict, VerdictKind::Reject);
    }
}

#[test]
fn a_ruleset_never_switches_a_floor_check_off_or_down() {
    let f = facts(json!([{ "id": "a", "claims": [] }]));
    assert_eq!(run(&f, json!([])).verdict, VerdictKind::Reject);
    assert_eq!(
        run(&f, json!([{ "check": "claims-declared", "params": {} }])).verdict,
        VerdictKind::Reject
    );
    for rule in [
        json!({ "check": "claims-declared", "class": "advisory" }),
        json!({ "check": "no-cycles", "params": { "x": 1 } }),
    ] {
        assert_eq!(
            refusal(&f, json!({ "rules": [rule] })).0,
            "floor-check-not-configurable"
        );
    }
}

#[test]
fn zero_nodes_accept_and_the_verdict_carries_policy_counts_and_both_caveats() {
    let policy = json!({ "source": "door:default", "sha256": "abc" });
    let v = evaluate(&facts(json!([])), &json!({ "rules": [] }), Some(&policy)).unwrap();
    assert_eq!(v.verdict, VerdictKind::Accept);
    assert_eq!(v.policy, Some(policy));
    assert_eq!(v.counts.nodes, 0);
    let text = serde_json::to_value(&v).unwrap();
    assert_eq!(text["verdict"], "accept");
    assert_eq!(text["counts"]["readOnlyNodes"], 0);
    let ids: Vec<&str> = text["caveats"]
        .as_array()
        .unwrap()
        .iter()
        .map(|c| c["id"].as_str().unwrap())
        .collect();
    assert_eq!(ids, ["lexical", "read-only-asserted"]);
    assert_eq!(
        evaluate(&facts(json!([])), &json!({ "rules": [] }), None)
            .unwrap()
            .policy,
        None
    );
}

#[test]
fn rulesets_are_refused_by_name_before_anything_is_evaluated() {
    let f = facts(json!([]));
    let cases = [
        (json!({ "rules": [{ "check": "nope" }] }), "check-unknown"),
        (
            json!({ "rules": [{ "check": "declared-layers-valid", "params": { "k": 1 } }] }),
            "param-unknown",
        ),
        (
            json!({ "rules": [{ "check": "max-layer-width", "params": { "max": 0 } }] }),
            "param-invalid",
        ),
        (
            json!({ "rules": [{ "check": "max-layer-width" }] }),
            "param-invalid",
        ),
        (
            json!({ "rules": [{ "check": "max-layer-width", "params": { "max": 1, "z": 2 } }] }),
            "param-unknown",
        ),
        (
            json!({ "rules": [{ "check": "declared-layers-valid", "class": "loud" }] }),
            "param-invalid",
        ),
        (
            json!({ "rules": [{ "check": "declared-layers-valid" }, { "check": "declared-layers-valid" }] }),
            "rule-duplicate",
        ),
        (
            json!({ "rules": [{ "check": "declared-layers-valid", "extra": 1 }] }),
            "unknown-field",
        ),
        (
            json!({ "rules": vec![json!({ "check": "no-cycles" }); 201] }),
            "limit-exceeded",
        ),
        (json!([]), "input-not-object"),
    ];
    for (ruleset, code) in cases {
        assert_eq!(refusal(&f, ruleset).0, code);
    }
}

#[test]
fn facts_are_refused_by_name_and_an_unknown_claim_space_never_passes_as_no_collision() {
    let rs = json!({ "rules": [] });
    let cases = [
        (
            facts(json!([{ "id": "a", "claims": [{ "space": "prot", "ref": "80" }] }])),
            "claim-space-unknown",
        ),
        (
            facts(json!([{ "id": "a", "claims": [{ "space": "port" }] }])),
            "claim-malformed",
        ),
        (
            facts(json!([{ "id": "a", "readOnly": true }, { "id": "a", "readOnly": true }])),
            "duplicate-node-id",
        ),
        (facts(json!([{ "id": "x".repeat(257) }])), "id-too-long"),
        (facts(json!([{ "id": "" }])), "node-malformed"),
        (facts(json!([{ "id": "a", "layer": 0 }])), "node-malformed"),
        (facts(json!([{ "id": "a", "color": 1 }])), "unknown-field"),
        (
            json!({ "nodes": [], "graph": {}, "extra": 1 }),
            "unknown-field",
        ),
        (json!({ "graph": {} }), "input-not-object"),
        (
            facts(json!(vec![json!({ "id": "n" }); 20001])),
            "limit-exceeded",
        ),
    ];
    for (f, code) in cases {
        assert_eq!(refusal(&f, rs.clone()).0, code);
    }
    let mut over = facts(json!([]));
    over["exclusions"] = json!(vec![json!({ "a": "a", "b": "b" }); 100_001]);
    assert_eq!(
        refusal(&over, rs.clone()),
        ("limit-exceeded", "facts.exclusions".to_string())
    );
}

#[test]
fn the_real_graph_and_write_scope_outputs_feed_the_evaluator_unchanged() {
    use fgos_write_scope::{colliding_pairs, Item};
    let items = vec![
        Item {
            id: "a".into(),
            scopes: vec!["src/**".into()],
        },
        Item {
            id: "b".into(),
            scopes: vec!["src/x".into()],
        },
    ];
    let col = colliding_pairs(&items);
    let exclusions: Vec<Value> = col
        .pairs
        .iter()
        .map(|p| json!({ "a": p.a, "b": p.b, "shared": p.shared }))
        .collect();
    let graph_in = json!({ "nodes": [{ "id": "a" }, { "id": "b" }], "edges": [], "exclusions": [{ "a": "a", "b": "b" }] });
    let analysis = fgos_graph::analyze_value(&graph_in).expect("graph analyzes");
    let f = json!({
        "nodes": [
            { "id": "a", "claims": [path("src/**")], "layer": 1 },
            { "id": "b", "claims": [path("src/x")], "layer": 1 }
        ],
        "graph": serde_json::to_value(&analysis).unwrap(),
        "exclusions": exclusions,
        "problems": []
    });
    let v = run(&f, json!([]));
    assert_eq!(codes(&v), ["exclusion-in-one-layer"]);
}

#[test]
fn an_exclusion_pair_with_an_undeclared_layer_blocks_once_any_unit_declares_one() {
    let mut f = facts(json!([
        { "id": "a", "claims": [path("src/**")], "layer": 1 },
        { "id": "b", "claims": [path("src/x")] }
    ]));
    f["exclusions"] = json!([{ "a": "a", "b": "b", "shared": ["src/x"] }]);
    let v = run(&f, json!([]));
    assert_eq!(codes(&v), ["exclusion-layer-undeclared"]);
    assert_eq!(v.findings[0].nodes, ["a", "b"]);
    assert_eq!(v.verdict, VerdictKind::Reject);

    // No unit declares a layer: the check has nothing to judge.
    let mut none = facts(json!([
        { "id": "a", "claims": [path("src/**")] },
        { "id": "b", "claims": [path("src/x")] }
    ]));
    none["exclusions"] = f["exclusions"].clone();
    assert_eq!(run(&none, json!([])).verdict, VerdictKind::Accept);
}

#[test]
fn findings_follow_catalog_order_then_the_input_position_of_their_first_node() {
    let mut f = facts(json!([
        { "id": "n0", "claims": [path("ok")] },
        { "id": "n1" },
        { "id": "n2", "claims": [path("p")] },
        { "id": "n3", "claims": [] }
    ]));
    f["problems"] = json!([
        { "item": "n2", "code": "entry-invalid", "entry": "../x", "why": "w" },
        { "item": "n0", "code": "entry-invalid", "entry": "../y", "why": "w" }
    ]);
    f["graph"]["cycles"] = json!([
        { "members": ["n3", "n2"], "cycle": ["n3", "n2", "n3"], "cycleKinds": [] },
        { "members": ["n1"], "cycle": ["n1", "n1"], "cycleKinds": [] }
    ]);
    let v = run(&f, json!([]));
    let order: Vec<(&str, &str)> = v
        .findings
        .iter()
        .map(|x| (x.code, x.nodes[0].as_str()))
        .collect();
    assert_eq!(
        order,
        [
            ("cycle", "n1"),
            ("cycle", "n3"),
            ("footprint-entry-invalid", "n0"),
            ("claims-missing", "n1"),
            ("footprint-entry-invalid", "n2"),
            ("footprint-empty", "n3"),
        ]
    );
}

#[test]
fn a_repeated_dependency_yields_one_finding() {
    let f = facts(json!([
        { "id": "a", "claims": [path("a")], "layer": 2 },
        { "id": "b", "claims": [path("b")], "layer": 1, "dependsOn": ["a", "a", "a"] }
    ]));
    let v = run(&f, json!([{ "check": "declared-layers-valid" }]));
    assert_eq!(codes(&v), ["layer-order-violation"]);
}

#[test]
fn an_exclusion_or_problem_naming_an_unknown_node_is_refused_by_name() {
    let rs = json!({ "rules": [] });
    let mut e = facts(json!([{ "id": "a", "readOnly": true }]));
    e["exclusions"] = json!([{ "a": "a", "b": "ghost", "shared": [] }]);
    let r = evaluate(&e, &rs, None).expect_err("refused");
    assert_eq!(
        (r.code, r.field.as_str(), r.index),
        ("unknown-node-id", "facts.exclusions.b", Some(0))
    );
    let mut p = facts(json!([{ "id": "a", "readOnly": true }]));
    p["problems"] = json!([{ "item": "ghost", "code": "entry-invalid", "entry": "x", "why": "w" }]);
    let r = evaluate(&p, &rs, None).expect_err("refused");
    assert_eq!(
        (r.code, r.field.as_str()),
        ("unknown-node-id", "facts.problems.item")
    );
}

#[test]
fn a_refusal_quotes_at_most_1024_bytes_of_an_input_derived_name() {
    let f = facts(json!([]));
    let long = "é".repeat(2000);
    let mut top = serde_json::Map::new();
    top.insert(long.clone(), json!(1));
    let (code, field) = refusal(&f, Value::Object(top));
    assert_eq!(code, "unknown-field");
    assert!(field.len() <= 1024 && field.starts_with("ruleset.é"));
    let (_, field) = refusal(
        &facts(json!([{ "id": "a", long: 1 }])),
        json!({ "rules": [] }),
    );
    assert!(field.len() <= 1024);
}
