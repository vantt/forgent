//! Behaviour tests for the graph crate. The first half ports the cases of test/state/graph-metrics.test.mjs
//! (connectedComponents, criticalPath, detectCycles, computeSchedule) through a small Work-shaped builder; each
//! intended difference from that module is named "intended difference N" after spec section 8. The second half
//! checks the crate against naive implementations on small seeded graphs.

use fgos_graph::{analyze_value, Analysis, Graph, Refusal};
use serde_json::{json, Value};

// ---- Work-shaped builder: what the door plan's adapter will do ----------------------------------------------

#[derive(Default)]
struct Work {
    ids: Vec<String>,
    edges: Vec<Value>,
    exclusions: Vec<Value>,
    footprints: Vec<(String, Vec<String>)>,
}

impl Work {
    fn new() -> Self {
        Self::default()
    }
    /// `deps` wait for; `parent` waits for this item (parent-child); `merge_after` is waits-for.
    fn item(
        mut self,
        id: &str,
        deps: &[&str],
        parent: Option<&str>,
        merge_after: &[&str],
        footprint: &[&str],
    ) -> Self {
        self.ids.push(id.into());
        for d in deps {
            self.edges
                .push(json!({"from": id, "to": d, "kind": "depends-on"}));
        }
        if let Some(p) = parent {
            self.edges
                .push(json!({"from": p, "to": id, "kind": "parent-child"}));
        }
        for m in merge_after {
            self.edges
                .push(json!({"from": id, "to": m, "kind": "waits-for"}));
        }
        self.footprints
            .push((id.into(), footprint.iter().map(|s| s.to_string()).collect()));
        self
    }
    fn plain(self, id: &str) -> Self {
        self.item(id, &[], None, &[], &[])
    }
    fn input(&self) -> Value {
        let mut exclusions = self.exclusions.clone();
        for (i, (a, pa)) in self.footprints.iter().enumerate() {
            for (b, pb) in &self.footprints[i + 1..] {
                if pa.iter().any(|p| pb.contains(p)) {
                    exclusions.push(json!({"a": a, "b": b}));
                }
            }
        }
        let nodes: Vec<Value> = self.ids.iter().map(|id| json!({"id": id})).collect();
        json!({"nodes": nodes, "edges": self.edges, "exclusions": exclusions})
    }
    fn run(&self) -> Analysis {
        analyze_value(&self.input()).expect("well-formed input")
    }
}

fn strs(items: &[&str]) -> Vec<String> {
    items.iter().map(|s| s.to_string()).collect()
}

fn group_members(a: &Analysis) -> Vec<Vec<String>> {
    a.groups.groups.iter().map(|g| g.nodes.clone()).collect()
}

fn layer_nodes(a: &Analysis) -> Vec<Vec<String>> {
    a.layers
        .as_ref()
        .expect("acyclic")
        .iter()
        .map(|l| l.nodes.clone())
        .collect()
}

// ---- connectedComponents -> groups ---------------------------------------------------------------------------

#[test]
fn groups_of_an_empty_graph_are_zero() {
    let a = Work::new().run();
    assert_eq!(a.groups.group_count, 0);
    assert!(a.groups.groups.is_empty());
}

#[test]
fn groups_without_edges_are_one_singleton_per_node() {
    let a = Work::new().plain("a").plain("b").plain("c").run();
    assert_eq!(a.groups.group_count, 3);
    assert_eq!(
        group_members(&a),
        vec![strs(&["a"]), strs(&["b"]), strs(&["c"])]
    );
    assert!(a.groups.groups.iter().all(|g| g.size == 1));
}

#[test]
fn groups_join_through_a_dependency_edge() {
    let a = Work::new()
        .plain("a")
        .item("b", &["a"], None, &[], &[])
        .run();
    assert_eq!(group_members(&a), vec![strs(&["a", "b"])]);
}

#[test]
fn groups_join_through_a_parent_child_edge() {
    let a = Work::new()
        .plain("a")
        .item("d", &[], Some("a"), &[], &[])
        .run();
    assert_eq!(group_members(&a), vec![strs(&["a", "d"])]);
}

#[test]
fn groups_keep_independent_tracks_apart_while_dependency_and_parent_child_both_join() {
    let a = Work::new()
        .plain("a")
        .item("b", &["a"], None, &[], &[])
        .plain("c")
        .item("d", &[], Some("a"), &[], &[])
        .plain("e")
        .item("f", &["e"], None, &[], &[])
        .run();
    assert_eq!(
        group_members(&a),
        vec![strs(&["a", "b", "d"]), strs(&["c"]), strs(&["e", "f"])]
    );
}

#[test]
fn intended_difference_4_a_dangling_edge_never_becomes_a_node_and_is_reported() {
    let a = Work::new()
        .item("lonely", &["does-not-exist"], None, &[], &[])
        .item("orphan", &[], None, &[], &[])
        .run();
    assert_eq!(
        group_members(&a),
        vec![strs(&["lonely"]), strs(&["orphan"])]
    );
    assert_eq!(a.dangling.len(), 1);
    assert_eq!(a.dangling[0].missing, strs(&["does-not-exist"]));
    assert!(a.cycles.is_empty());
}

#[test]
fn groups_follow_declaration_order_not_id_order() {
    let a = Work::new()
        .plain("zeta")
        .item("alpha", &["zeta"], None, &[], &[])
        .plain("mid")
        .run();
    assert_eq!(
        group_members(&a),
        vec![strs(&["zeta", "alpha"]), strs(&["mid"])]
    );
    assert_eq!(
        a,
        Work::new()
            .plain("zeta")
            .item("alpha", &["zeta"], None, &[], &[])
            .plain("mid")
            .run()
    );
}

#[test]
fn intended_difference_5_groups_join_exclusion_pairs_and_related_edges() {
    let a = Work::new()
        .item("a", &[], None, &[], &["x"])
        .item("b", &[], None, &[], &["x"])
        .plain("c")
        .plain("d")
        .run();
    assert_eq!(
        group_members(&a),
        vec![strs(&["a", "b"]), strs(&["c"]), strs(&["d"])]
    );
    let input = json!({"nodes": [{"id": "c"}, {"id": "d"}], "edges": [{"from": "c", "to": "d", "kind": "related"}]});
    let a = analyze_value(&input).unwrap();
    assert_eq!(group_members(&a), vec![strs(&["c", "d"])]);
    assert!(
        a.layers.as_ref().unwrap().len() == 1,
        "related does not order"
    );
}

// ---- criticalPath --------------------------------------------------------------------------------------------

#[test]
fn critical_path_is_the_longest_chain_deepest_first() {
    let a = Work::new()
        .plain("a")
        .item("b", &["a"], None, &[], &[])
        .item("c", &["b"], None, &[], &[])
        .item("d", &["a"], None, &[], &[])
        .run();
    let cp = a.critical_path.unwrap();
    assert_eq!((cp.depth, cp.path), (3, strs(&["c", "b", "a"])));
}

#[test]
fn critical_path_of_empty_is_zero_and_of_a_single_node_is_one() {
    let cp = Work::new().run().critical_path.unwrap();
    assert_eq!((cp.depth, cp.path), (0, vec![]));
    let cp = Work::new().plain("solo").run().critical_path.unwrap();
    assert_eq!((cp.depth, cp.path), (1, strs(&["solo"])));
}

#[test]
fn critical_path_counts_a_child_like_a_dependency() {
    let a = Work::new()
        .plain("root")
        .item("child", &[], Some("root"), &[], &[])
        .run();
    let cp = a.critical_path.unwrap();
    assert_eq!((cp.depth, cp.path), (2, strs(&["root", "child"])));
}

#[test]
fn critical_path_ties_go_to_the_first_in_declaration_order() {
    let a = Work::new()
        .plain("y")
        .plain("x")
        .item("q", &["y", "x"], None, &[], &[])
        .item("p", &["x", "y"], None, &[], &[])
        .run();
    // q is declared before p and y before x, so declaration order and id order disagree.
    let cp = a.critical_path.unwrap();
    assert_eq!((cp.depth, cp.path), (2, strs(&["q", "y"])));
}

// ---- detectCycles -> cycles ----------------------------------------------------------------------------------

#[test]
fn an_acyclic_graph_has_no_cycles() {
    let a = Work::new()
        .plain("a")
        .item("b", &["a"], None, &[], &[])
        .item("c", &["b"], None, &[], &[])
        .run();
    assert!(a.cycles.is_empty());
    assert!(a.layers.is_some() && a.critical_path.is_some() && a.deferrals.is_some());
}

#[test]
fn a_self_dependency_is_a_cycle_of_one_node() {
    let a = Work::new().item("a", &["a"], None, &[], &[]).run();
    assert_eq!(a.cycles.len(), 1);
    assert_eq!(a.cycles[0].members, strs(&["a"]));
    assert_eq!(a.cycles[0].cycle, strs(&["a"]));
    assert_eq!(a.cycles[0].cycle_kinds, strs(&["depends-on"]));
}

#[test]
fn intended_difference_1_a_two_node_cycle_names_one_canonical_path_with_members_and_edges() {
    let a = Work::new()
        .item("a", &["b"], None, &[], &[])
        .item("b", &["a"], None, &[], &[])
        .run();
    assert_eq!(a.cycles.len(), 1);
    let c = &a.cycles[0];
    assert_eq!(c.members, strs(&["a", "b"]));
    assert_eq!(c.cycle, strs(&["a", "b"]));
    assert_eq!(c.cycle_kinds, strs(&["depends-on", "depends-on"]));
    assert_eq!(c.edges.len(), 2);
}

#[test]
fn a_dependency_on_an_unknown_id_is_skipped_not_a_cycle() {
    let a = Work::new().item("a", &["missing"], None, &[], &[]).run();
    assert!(a.cycles.is_empty());
    assert_eq!(a.dangling.len(), 1);
}

#[test]
fn a_parent_anchored_by_a_child_that_depends_back_on_it_is_a_mixed_kind_cycle() {
    let a = Work::new()
        .plain("p")
        .item("c", &["p"], Some("p"), &[], &[])
        .run();
    assert_eq!(a.cycles.len(), 1);
    assert_eq!(a.cycles[0].members, strs(&["c", "p"]));
    assert_eq!(a.cycles[0].cycle, strs(&["c", "p"]));
    assert_eq!(
        a.cycles[0].cycle_kinds,
        strs(&["depends-on", "parent-child"])
    );
}

#[test]
fn a_merge_after_cycle_names_the_relation_that_closes_the_loop() {
    let a = Work::new()
        .item("a", &["b"], None, &[], &[])
        .item("b", &[], None, &["a"], &[])
        .run();
    assert_eq!(a.cycles[0].cycle, strs(&["a", "b"]));
    assert_eq!(a.cycles[0].cycle_kinds, strs(&["depends-on", "waits-for"]));
}

#[test]
fn a_pure_parent_child_cycle_is_caught() {
    let a = Work::new()
        .item("a", &[], Some("b"), &[], &[])
        .item("b", &[], Some("a"), &[], &[])
        .run();
    assert_eq!(a.cycles.len(), 1);
    assert_eq!(a.cycles[0].members, strs(&["a", "b"]));
}

#[test]
fn a_dangling_parent_is_dropped_like_a_dangling_dependency() {
    let a = Work::new()
        .item("c", &[], Some("missing-parent"), &[], &[])
        .run();
    assert!(a.cycles.is_empty());
    assert_eq!(a.dangling[0].missing, strs(&["missing-parent"]));
}

#[test]
fn a_cycle_nulls_layers_deferrals_and_critical_path() {
    let a = Work::new()
        .item("a", &["b"], None, &[], &[])
        .item("b", &["a"], None, &[], &[])
        .run();
    assert!(a.layers.is_none() && a.deferrals.is_none() && a.critical_path.is_none());
}

#[test]
fn cycle_choice_is_the_lexicographically_smallest_shortest_cycle_through_the_smallest_id() {
    // a -> c -> a and a -> b -> d -> a: the shortest has length 2 through c; b-d is longer.
    let input = json!({"nodes": [{"id":"a"},{"id":"b"},{"id":"c"},{"id":"d"}], "edges": [
        {"from":"a","to":"b","kind":"depends-on"},{"from":"b","to":"d","kind":"depends-on"},{"from":"d","to":"a","kind":"depends-on"},
        {"from":"a","to":"c","kind":"depends-on"},{"from":"c","to":"a","kind":"depends-on"}]});
    let a = analyze_value(&input).unwrap();
    assert_eq!(a.cycles[0].cycle, strs(&["a", "c"]));
    assert_eq!(a.cycles[0].members, strs(&["a", "b", "c", "d"]));
    // two equally short cycles: a-b-a and a-c-a, the smaller next id wins
    let input = json!({"nodes": [{"id":"a"},{"id":"c"},{"id":"b"}], "edges": [
        {"from":"a","to":"c","kind":"depends-on"},{"from":"c","to":"a","kind":"depends-on"},
        {"from":"a","to":"b","kind":"depends-on"},{"from":"b","to":"a","kind":"depends-on"}]});
    assert_eq!(
        analyze_value(&input).unwrap().cycles[0].cycle,
        strs(&["a", "b"])
    );
}

#[test]
fn the_step_kind_of_parallel_edges_is_the_first_declared_one() {
    let input = json!({"nodes": [{"id":"a"},{"id":"b"}], "edges": [
        {"from":"a","to":"b","kind":"waits-for"},{"from":"a","to":"b","kind":"depends-on"},
        {"from":"b","to":"a","kind":"depends-on"}]});
    let a = analyze_value(&input).unwrap();
    assert_eq!(a.cycles[0].cycle_kinds, strs(&["waits-for", "depends-on"]));
    let g = Graph::from_value(&input).unwrap();
    let kinds: Vec<String> = g
        .cycle_through("a")
        .unwrap()
        .unwrap()
        .into_iter()
        .map(|s| s.kind)
        .collect();
    assert_eq!(kinds, strs(&["waits-for", "depends-on"]));
}

#[test]
fn cycle_through_reports_the_shortest_loop_through_a_member_or_null() {
    let input = json!({"nodes": [{"id":"a"},{"id":"b"},{"id":"c"},{"id":"x"}], "edges": [
        {"from":"a","to":"b","kind":"depends-on"},{"from":"b","to":"c","kind":"depends-on"},{"from":"c","to":"a","kind":"depends-on"},
        {"from":"x","to":"a","kind":"depends-on"}]});
    let g = Graph::from_value(&input).unwrap();
    let ids: Vec<String> = g
        .cycle_through("c")
        .unwrap()
        .unwrap()
        .into_iter()
        .map(|s| s.id)
        .collect();
    assert_eq!(ids, strs(&["c", "a", "b"]));
    assert!(g.cycle_through("x").unwrap().is_none());
    assert_eq!(
        g.cycle_through("nope").unwrap_err().code,
        "cycle-through-unknown-id"
    );
}

#[test]
fn intended_difference_6_a_deep_chain_does_not_overflow_the_stack() {
    let n = 15_000;
    let nodes: Vec<Value> = (0..n).map(|i| json!({"id": format!("n{i:05}")})).collect();
    let edges: Vec<Value> = (1..n).map(|i| json!({"from": format!("n{i:05}"), "to": format!("n{:05}", i - 1), "kind": "depends-on"})).collect();
    let a = analyze_value(&json!({"nodes": nodes, "edges": edges})).unwrap();
    assert_eq!(a.critical_path.unwrap().depth, n);
    let mut closed = edges.clone();
    closed.push(json!({"from": "n00000", "to": format!("n{:05}", n - 1), "kind": "depends-on"}));
    let a = analyze_value(&json!({"nodes": nodes, "edges": closed})).unwrap();
    assert_eq!(a.cycles[0].cycle.len(), n);
}

// ---- computeSchedule -> layers -------------------------------------------------------------------------------

#[test]
fn disjoint_footprints_share_a_layer() {
    let a = Work::new()
        .item("a", &[], None, &[], &["x"])
        .item("b", &[], None, &[], &["y"])
        .run();
    assert_eq!(layer_nodes(&a), vec![strs(&["a", "b"])]);
    assert!(a.deferrals.unwrap().is_empty());
}

#[test]
fn intended_difference_3_a_shared_footprint_defers_with_the_exclusion_as_evidence() {
    let a = Work::new()
        .item("a", &[], None, &[], &["x"])
        .item("b", &[], None, &[], &["x"])
        .run();
    assert_eq!(layer_nodes(&a), vec![strs(&["a"]), strs(&["b"])]);
    let d = &a.deferrals.unwrap()[0];
    assert_eq!((d.node.as_str(), d.earliest, d.placed_at), ("b", 0, 1));
    assert_eq!(
        (d.reasons[0].layer, d.reasons[0].partner.as_str()),
        (0, "a")
    );
}

#[test]
fn a_node_without_a_footprint_never_conflicts() {
    let a = Work::new()
        .item("a", &[], None, &[], &["x"])
        .item("b", &[], None, &[], &["x"])
        .plain("c")
        .run();
    assert_eq!(layer_nodes(&a), vec![strs(&["a", "c"]), strs(&["b"])]);
}

#[test]
fn intended_difference_2_layers_cover_the_whole_graph_by_dependencies() {
    // computeSchedule dropped the not-ready item; the layers place it after what it waits for.
    let a = Work::new()
        .plain("a")
        .item("b", &["a"], None, &[], &[])
        .run();
    assert_eq!(layer_nodes(&a), vec![strs(&["a"]), strs(&["b"])]);
}

#[test]
fn a_candidate_set_is_the_adapters_job_a_graph_of_only_the_candidates_packs_on_its_own() {
    let both = Work::new()
        .item("x", &[], None, &[], &["s"])
        .item("y", &[], None, &[], &["s"])
        .run();
    assert_eq!(layer_nodes(&both), vec![strs(&["x"]), strs(&["y"])]);
    let only_y = Work::new().item("y", &[], None, &[], &["s"]).run();
    assert_eq!(layer_nodes(&only_y), vec![strs(&["y"])]);
    assert!(Work::new().run().layers.unwrap().is_empty());
}

#[test]
fn priority_decides_who_waits_and_unlisted_ids_follow_in_input_order() {
    let mut input = Work::new()
        .item("a", &[], None, &[], &["x"])
        .item("b", &[], None, &[], &["x"])
        .item("c", &[], None, &[], &["x"])
        .input();
    input["priority"] = json!(["c"]);
    let a = analyze_value(&input).unwrap();
    assert_eq!(
        layer_nodes(&a),
        vec![strs(&["c"]), strs(&["a"]), strs(&["b"])]
    );
    let b = &a.deferrals.unwrap();
    assert_eq!(
        b[0].reasons
            .iter()
            .map(|r| (r.layer, r.partner.as_str()))
            .collect::<Vec<_>>(),
        vec![(0, "c")]
    );
    assert_eq!(
        b[1].reasons
            .iter()
            .map(|r| (r.layer, r.partner.as_str()))
            .collect::<Vec<_>>(),
        vec![(0, "c"), (1, "a")]
    );
}

#[test]
fn a_node_delayed_only_by_a_deferred_dependency_has_an_entry_without_reasons() {
    let a = Work::new()
        .item("a", &[], None, &[], &["x"])
        .item("b", &[], None, &[], &["x"])
        .item("c", &["b"], None, &[], &[])
        .run();
    let d = a.deferrals.unwrap();
    let c = d.iter().find(|e| e.node == "c").unwrap();
    assert_eq!((c.earliest, c.placed_at), (1, 2));
    assert!(c.reasons.is_empty());
}

#[test]
fn a_dependency_of_a_deferred_node_is_explained_by_that_dependencys_entry_alone() {
    let input = json!({"nodes": [{"id":"A"},{"id":"B"},{"id":"C"}],
        "edges": [{"from":"C","to":"B","kind":"depends-on"}],
        "exclusions": [{"a":"A","b":"B"}]});
    let d = analyze_value(&input).unwrap().deferrals.unwrap();
    assert_eq!(
        d.iter().map(|e| e.node.as_str()).collect::<Vec<_>>(),
        vec!["B", "C"]
    );
    assert_eq!((d[0].earliest, d[0].placed_at), (0, 1));
    assert_eq!(d[0].reasons.len(), 1);
    assert_eq!(
        (d[0].reasons[0].layer, d[0].reasons[0].partner.as_str()),
        (0, "A")
    );
    assert_eq!((d[1].earliest, d[1].placed_at), (1, 2));
    assert!(d[1].reasons.is_empty());
}

// ---- refusals ------------------------------------------------------------------------------------------------

fn refused(input: Value) -> Refusal {
    analyze_value(&input).expect_err("refused")
}

#[test]
fn malformed_input_is_refused_by_name_with_the_first_offending_index() {
    let r = refused(json!([]));
    assert_eq!(r.code, "input-not-object");
    assert_eq!(refused(json!({})).code, "nodes-missing");
    let r = refused(json!({"nodes": [], "extra": 1}));
    assert_eq!((r.code, r.field.as_str()), ("unknown-field", "extra"));
    let r = refused(json!({"nodes": [{"id": "a", "x": 1}]}));
    assert_eq!((r.code, r.index), ("unknown-field", Some(0)));
    assert_eq!(refused(json!({"nodes": [1]})).code, "node-malformed");
    assert_eq!(refused(json!({"nodes": [{"id": ""}]})).code, "id-empty");
    assert_eq!(refused(json!({"nodes": [{"id": 1}]})).code, "id-not-string");
    assert_eq!(
        refused(json!({"nodes": [{"id": "x".repeat(257)}]})).code,
        "id-too-long"
    );
    let r = refused(json!({"nodes": [{"id": "a"}, {"id": "b"}, {"id": "a"}]}));
    assert_eq!((r.code, r.index), ("duplicate-node-id", Some(2)));
    let edge = |kind: Value| json!({"nodes": [{"id": "a"}], "edges": [{"from": "a", "to": "a", "kind": kind}]});
    assert_eq!(refused(edge(json!("nonsense"))).code, "unknown-edge-kind");
    assert_eq!(refused(edge(json!(3))).code, "edge-malformed");
    assert_eq!(
        refused(json!({"nodes": [{"id": "a"}], "edges": [{"from": "a"}]})).code,
        "edge-malformed"
    );
    assert_eq!(
        refused(json!({"nodes": [{"id": "a"}], "exclusions": [{"a": "a"}]})).code,
        "exclusion-malformed"
    );
    assert_eq!(
        refused(json!({"nodes": [{"id": "a"}], "exclusions": [{"a": "a", "b": "a"}]})).code,
        "exclusion-self-pair"
    );
    assert_eq!(
        refused(json!({"nodes": [{"id": "a"}], "priority": ["a", "a"]})).code,
        "priority-duplicate"
    );
    assert_eq!(
        refused(json!({"nodes": [{"id": "a"}], "priority": ["z"]})).code,
        "priority-unknown-id"
    );
    assert_eq!(
        refused(json!({"nodes": [{"id": "a"}], "priority": [""]})).code,
        "id-empty"
    );
    let r = refused(json!({"nodes": [{"id": "a"}], "priority": ["a", "x".repeat(257)]}));
    assert_eq!((r.code, r.index), ("id-too-long", Some(1)));
}

#[test]
fn an_object_with_a_repeated_key_is_refused_by_name_when_read_from_text() {
    let r = Graph::from_str(r#"{"nodes": [{"id": "a", "id": "b"}]}"#).unwrap_err();
    assert_eq!((r.code, r.field.as_str()), ("duplicate-key", "id"));
    let r = Graph::from_str(r#"{"nodes": [], "nodes": []}"#).unwrap_err();
    assert_eq!((r.code, r.field.as_str()), ("duplicate-key", "nodes"));
    assert!(Graph::from_str(r#"{"nodes": [{"id": "a"}, {"id": "b"}]}"#).is_ok());
    assert_eq!(Graph::from_str("{").unwrap_err().code, "input-not-object");
}

#[test]
fn input_beyond_a_limit_is_refused_by_name_and_a_refusal_quotes_no_input() {
    let nodes: Vec<Value> = (0..20_001).map(|i| json!({"id": i.to_string()})).collect();
    let r = refused(json!({"nodes": nodes}));
    assert_eq!((r.code, r.field.as_str()), ("limit-exceeded", "maxNodes"));
    let r = Graph::from_str(&" ".repeat(4 * 1024 * 1024 + 1)).unwrap_err();
    assert_eq!(
        (r.code, r.field.as_str()),
        ("limit-exceeded", "maxInputBytes")
    );
    let r = refused(json!({"nodes": [], "x".repeat(5000): 1}));
    assert!(r.field.len() <= 256 && !r.to_string().contains(&"x".repeat(300)));
}

#[test]
fn duplicate_edges_and_pairs_appear_once() {
    let input = json!({"nodes": [{"id":"a"},{"id":"b"}], "edges": [
        {"from":"a","to":"b","kind":"depends-on"},{"from":"a","to":"b","kind":"depends-on"},{"from":"b","to":"a","kind":"waits-for"},{"from":"b","to":"a","kind":"waits-for"}],
        "exclusions": [{"a":"a","b":"b"},{"a":"b","b":"a"}]});
    let a = analyze_value(&input).unwrap();
    assert_eq!(a.cycles[0].edges.len(), 2);
}

// ---- against naive implementations on small seeded graphs --------------------------------------------------------

struct Rng(u64);
impl Rng {
    fn next(&mut self) -> u64 {
        self.0 ^= self.0 << 13;
        self.0 ^= self.0 >> 7;
        self.0 ^= self.0 << 17;
        self.0
    }
    fn below(&mut self, n: usize) -> usize {
        (self.next() % n as u64) as usize
    }
}

struct Case {
    n: usize,
    edges: Vec<(usize, usize)>,
    exclusions: Vec<(usize, usize)>,
    priority: Vec<usize>,
    value: Value,
}

fn random_case(rng: &mut Rng, acyclic: bool) -> Case {
    let n = 2 + rng.below(7);
    let id = |i: usize| format!("n{}", (i * 7) % 10); // ids out of declaration order
    let mut edges = Vec::new();
    for _ in 0..rng.below(2 * n + 1) {
        let (a, b) = (rng.below(n), rng.below(n));
        if acyclic && a <= b {
            continue;
        }
        if !edges.contains(&(a, b)) {
            edges.push((a, b));
        }
    }
    let mut exclusions = Vec::new();
    for _ in 0..rng.below(n + 1) {
        let (a, b) = (rng.below(n), rng.below(n));
        if a != b && !exclusions.contains(&(a.min(b), a.max(b))) {
            exclusions.push((a.min(b), a.max(b)));
        }
    }
    let mut priority = Vec::new();
    for _ in 0..rng.below(n + 1) {
        let v = rng.below(n);
        if !priority.contains(&v) {
            priority.push(v);
        }
    }
    let value = json!({
        "priority": priority.iter().map(|&i| id(i)).collect::<Vec<_>>(),
        "nodes": (0..n).map(|i| json!({"id": id(i)})).collect::<Vec<_>>(),
        "edges": edges.iter().map(|&(a, b)| json!({"from": id(a), "to": id(b), "kind": "depends-on"})).collect::<Vec<_>>(),
        "exclusions": exclusions.iter().map(|&(a, b)| json!({"a": id(a), "b": id(b)})).collect::<Vec<_>>(),
    });
    Case {
        n,
        edges,
        exclusions,
        priority,
        value,
    }
}

/// Layering by direct simulation: the nodes whose dependencies sit in earlier layers are offered by priority
/// (listed first, then declaration order); each is placed unless a node already placed in the layer is excluded
/// with it. Returns the layers and, per node, the `(layer, partner)` reasons.
type Reasons = Vec<Vec<(usize, String)>>;

fn naive_layers(case: &Case) -> (Vec<Vec<usize>>, Reasons) {
    let mut rank: Vec<usize> = (0..case.n).map(|i| case.priority.len() + i).collect();
    for (r, &v) in case.priority.iter().enumerate() {
        rank[v] = r;
    }
    let excluded = |a: usize, b: usize| case.exclusions.contains(&(a.min(b), a.max(b)));
    let mut layer_of: Vec<Option<usize>> = vec![None; case.n];
    let mut layers: Vec<Vec<usize>> = Vec::new();
    let mut reasons: Reasons = vec![Vec::new(); case.n];
    while layer_of.iter().any(Option::is_none) {
        let layer = layers.len();
        let mut ready: Vec<usize> = (0..case.n)
            .filter(|&v| layer_of[v].is_none())
            .filter(|&v| {
                case.edges
                    .iter()
                    .filter(|&&(a, _)| a == v)
                    .all(|&(_, b)| layer_of[b].is_some_and(|l| l < layer))
            })
            .collect();
        ready.sort_by_key(|&v| rank[v]);
        let mut here: Vec<usize> = Vec::new();
        for v in ready {
            match here.iter().find(|&&p| excluded(p, v)) {
                Some(&p) => reasons[v].push((layer, name(p))),
                None => here.push(v),
            }
        }
        assert!(!here.is_empty(), "an acyclic graph always makes progress");
        for &v in &here {
            layer_of[v] = Some(layer);
        }
        layers.push(here);
    }
    (layers, reasons)
}

fn name(i: usize) -> String {
    format!("n{}", (i * 7) % 10)
}

/// Every simple cycle through `root` by exhaustive search; the shortest, then lexicographically smallest by id.
fn naive_cycle(case: &Case, root: usize) -> Option<Vec<String>> {
    fn walk(case: &Case, root: usize, path: &mut Vec<usize>, best: &mut Option<Vec<String>>) {
        let cur = *path.last().unwrap();
        for &(a, b) in &case.edges {
            if a != cur {
                continue;
            }
            if b == root {
                let ids: Vec<String> = path.iter().map(|&i| name(i)).collect();
                if best
                    .as_ref()
                    .is_none_or(|x| (ids.len(), &ids) < (x.len(), x))
                {
                    *best = Some(ids);
                }
            } else if !path.contains(&b) {
                path.push(b);
                walk(case, root, path, best);
                path.pop();
            }
        }
    }
    let mut best = None;
    walk(case, root, &mut vec![root], &mut best);
    best
}

fn reachability(case: &Case) -> Vec<Vec<bool>> {
    let mut r = vec![vec![false; case.n]; case.n];
    for &(a, b) in &case.edges {
        r[a][b] = true;
    }
    for k in 0..case.n {
        for i in 0..case.n {
            for j in 0..case.n {
                if r[i][k] && r[k][j] {
                    r[i][j] = true;
                }
            }
        }
    }
    r
}

#[test]
fn cycles_match_an_exhaustive_search_on_small_graphs() {
    let mut rng = Rng(0x9e37_79b9_7f4a_7c15);
    for _ in 0..600 {
        let case = random_case(&mut rng, false);
        let reach = reachability(&case);
        let analysis = analyze_value(&case.value).unwrap();
        let graph = Graph::from_value(&case.value).unwrap();
        // components: nodes on a cycle, grouped by mutual reachability
        let mut seen = vec![false; case.n];
        let mut expected: Vec<(String, Vec<String>)> = Vec::new();
        for v in 0..case.n {
            if seen[v] || !reach[v][v] {
                continue;
            }
            let comp: Vec<usize> = (0..case.n)
                .filter(|&u| reach[v][u] && reach[u][v])
                .collect();
            for &u in &comp {
                seen[u] = true;
            }
            let root = *comp.iter().min_by_key(|&&u| name(u)).unwrap();
            expected.push((name(root), naive_cycle(&case, root).unwrap()));
        }
        expected.sort();
        let got: Vec<(String, Vec<String>)> = analysis
            .cycles
            .iter()
            .map(|c| (c.members[0].clone(), c.cycle.clone()))
            .collect();
        assert_eq!(got, expected, "{}", case.value);
        assert_eq!(analysis.layers.is_none(), !expected.is_empty());
        for v in 0..case.n {
            let want = naive_cycle(&case, v);
            let got = graph
                .cycle_through(&name(v))
                .unwrap()
                .map(|s| s.into_iter().map(|x| x.id).collect::<Vec<_>>());
            assert_eq!(got, want, "cycle_through {} in {}", name(v), case.value);
        }
    }
}

#[test]
fn layers_match_a_naive_topological_order_and_honour_every_exclusion() {
    let mut rng = Rng(0x1234_5678_9abc_def1);
    for _ in 0..600 {
        let case = random_case(&mut rng, true);
        let analysis = analyze_value(&case.value).unwrap();
        assert!(analysis.cycles.is_empty());
        // naive earliest layer by repeated relaxation
        let mut earliest = vec![0usize; case.n];
        for _ in 0..case.n {
            for &(a, b) in &case.edges {
                earliest[a] = earliest[a].max(earliest[b] + 1);
            }
        }
        let layers = analysis.layers.clone().unwrap();
        let mut layer_of = vec![usize::MAX; case.n];
        for l in &layers {
            for node in &l.nodes {
                let v = (0..case.n).find(|&i| name(i) == *node).unwrap();
                assert_eq!(layer_of[v], usize::MAX, "placed twice");
                layer_of[v] = l.index;
            }
        }
        assert!(
            layer_of.iter().all(|&l| l != usize::MAX),
            "every node is placed"
        );
        for &(a, b) in &case.edges {
            assert!(layer_of[b] < layer_of[a], "a waits for b");
        }
        for &(a, b) in &case.exclusions {
            assert_ne!(layer_of[a], layer_of[b], "exclusion pair shares a layer");
        }
        for v in 0..case.n {
            assert!(layer_of[v] >= earliest[v]);
        }
        let deferred: Vec<&str> = analysis
            .deferrals
            .as_ref()
            .unwrap()
            .iter()
            .map(|d| d.node.as_str())
            .collect();
        for v in 0..case.n {
            assert_eq!(
                deferred.contains(&name(v).as_str()),
                layer_of[v] > earliest[v]
            );
        }
        // placement by priority and the evidence of each delay match a direct simulation
        let (naive, naive_reasons) = naive_layers(&case);
        let got_layers: Vec<Vec<String>> = layers.iter().map(|l| l.nodes.clone()).collect();
        let want_layers: Vec<Vec<String>> = naive
            .iter()
            .map(|l| l.iter().map(|&v| name(v)).collect())
            .collect();
        assert_eq!(got_layers, want_layers, "{}", case.value);
        for entry in analysis.deferrals.as_ref().unwrap() {
            let v = (0..case.n).find(|&i| name(i) == entry.node).unwrap();
            let got: Vec<(usize, String)> = entry
                .reasons
                .iter()
                .map(|r| (r.layer, r.partner.clone()))
                .collect();
            assert_eq!(
                got, naive_reasons[v],
                "reasons of {} in {}",
                entry.node, case.value
            );
        }
        // with no exclusions the layers are exactly the earliest layers
        let mut plain = case.value.clone();
        plain["exclusions"] = json!([]);
        let plain = analyze_value(&plain).unwrap();
        for l in plain.layers.unwrap() {
            for node in l.nodes {
                let v = (0..case.n).find(|&i| name(i) == node).unwrap();
                assert_eq!(earliest[v], l.index);
            }
        }
        // critical path depth is the longest chain
        assert_eq!(
            analysis.critical_path.unwrap().depth,
            earliest.iter().max().map_or(0, |m| m + 1)
        );
    }
}
