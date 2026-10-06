use fgos_observe::contract::ObserveRequest;
use fgos_observe::eval_journal::{self, EvalInput};
use fgos_observe::metrics_cli::eval::dispatch_eval;
use serde_json::{json, Value};
use std::collections::BTreeMap;
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::process::Command;
use std::sync::atomic::{AtomicUsize, Ordering};

static NEXT: AtomicUsize = AtomicUsize::new(0);
struct TempRoot(PathBuf);
impl TempRoot {
    fn new(name: &str) -> Self {
        let path = std::env::temp_dir().join(format!("fgos-eval-{}-{}-{}", name, std::process::id(), NEXT.fetch_add(1, Ordering::Relaxed)));
        fs::create_dir_all(&path).unwrap();
        Self(path)
    }
}
impl Drop for TempRoot {
    fn drop(&mut self) { let _ = fs::remove_dir_all(&self.0); }
}

fn input(id: &str, harness: &str, question: &str) -> EvalInput {
    EvalInput {
        eval_id: id.into(), harness: harness.into(), question: question.into(),
        setup: "setup-panel-current".into(),
        scores: BTreeMap::from([
            ("perspective-spread".into(), 0), ("decision-clarity".into(), 1),
            ("counterfactual-depth".into(), 1), ("evidence-discipline".into(), 2),
            ("execution-quality".into(), 1),
        ]),
        rubric: "discussion-quality.v1".into(), judge: "judge-opus-blind-1".into(),
        run_refs: vec!["unit-run-42".into(), "run_42".into()],
    }
}
fn req(root: &TempRoot, args: &[&str], stdin: Option<Value>) -> ObserveRequest {
    ObserveRequest { operation: "observe.metrics".into(), sub: "eval".into(),
        args: args.iter().map(|s| s.to_string()).collect(), root: root.0.clone(),
        stdin: stdin.map(|s| serde_json::to_vec(&s).unwrap()) }
}

#[test]
fn journal_round_trip_free_harness_and_exact_filters() {
    let root = TempRoot::new("roundtrip");
    let original = input("eval-a", "custom-council/quick", "question-1");
    let recorded = eval_journal::record(&root.0, original.clone()).unwrap();
    assert_eq!(recorded.v, 1);
    assert_eq!(recorded.kind, "eval");
    assert!(!recorded.ts.is_empty());
    assert_eq!(recorded.run_refs, original.run_refs);
    eval_journal::record(&root.0, input("eval-b", "panel", "question-1")).unwrap();
    eval_journal::record(&root.0, input("eval-c", "panel", "question-2")).unwrap();
    let all = eval_journal::list(&root.0, None, None).unwrap();
    assert_eq!(all.evals.len(), 3);
    assert!(all.invalid.is_empty());
    let one = eval_journal::list(&root.0, Some("custom-council/quick"), Some("question-1")).unwrap();
    assert_eq!(one.evals, vec![recorded]);
    assert_eq!(eval_journal::list(&root.0, Some("panel"), Some("question-2")).unwrap().evals[0].eval_id, "eval-c");
    assert!(eval_journal::list(&root.0, Some("pan"), None).unwrap().evals.is_empty());
}

#[test]
fn rejects_range_empty_ids_and_noninteger_scores_without_writes() {
    let root = TempRoot::new("range");
    for score in [-1, 3, i64::MAX] {
        let mut invalid = input("bad", "plain", "q");
        invalid.scores.insert("criterion".into(), score);
        assert!(eval_journal::record(&root.0, invalid).unwrap_err().contains("0..2"));
    }
    for field in ["evalId", "harness", "question", "setup", "rubric", "judge"] {
        let mut invalid = serde_json::to_value(input("bad", "plain", "q")).unwrap();
        invalid[field] = json!("  ");
        assert!(dispatch_eval(&req(&root, &["record"], Some(invalid))).unwrap_err().contains(field));
    }
    for value in [json!(1.5), json!("2"), json!(true), json!(null)] {
        let mut invalid = serde_json::to_value(input("bad", "plain", "q")).unwrap();
        invalid["scores"]["criterion"] = value;
        assert!(dispatch_eval(&req(&root, &["record"], Some(invalid))).is_err());
    }
    for field in ["scores", "runRefs"] {
        let mut invalid = serde_json::to_value(input("bad", "plain", "q")).unwrap();
        invalid[field] = if field == "scores" { json!({}) } else { json!([""]) };
        assert!(dispatch_eval(&req(&root, &["record"], Some(invalid))).is_err());
    }
    assert!(!root.0.join(".fgos/observe").exists());
}

#[test]
fn reports_hand_edited_invalid_lines_before_applying_filters() {
    let root = TempRoot::new("readvalidation");
    let record = eval_journal::record(&root.0, input("good", "panel", "q")).unwrap();
    let file = root.0.join(".fgos/observe/evals/hand-edited.jsonl");
    let mut contents = String::new();
    for bad in [json!(3), json!(-1), json!(0.5), json!("2")] {
        let mut value = serde_json::to_value(&record).unwrap();
        value["harness"] = json!("other");
        value["scores"]["criterion"] = bad;
        contents.push_str(&serde_json::to_string(&value).unwrap()); contents.push('\n');
    }
    contents.push_str("{broken}\n");
    for (field, value) in [("v", json!(2)), ("type", json!("snapshot")), ("ts", json!(""))] {
        let mut bad = serde_json::to_value(&record).unwrap(); bad[field] = value;
        contents.push_str(&serde_json::to_string(&bad).unwrap()); contents.push('\n');
    }
    fs::write(&file, contents).unwrap();
    let result = dispatch_eval(&req(&root, &["list", "--harness=panel"], None)).unwrap();
    assert_eq!(result["evals"].as_array().unwrap().len(), 1);
    let invalid = result["invalid"].as_array().unwrap();
    assert_eq!(invalid.len(), 8);
    for (i, item) in invalid.iter().enumerate() {
        assert_eq!(item["line"], i + 1);
        assert!(item["file"].as_str().unwrap().ends_with("hand-edited.jsonl"));
    }
}

#[test]
fn cli_stdin_record_list_and_option_errors() {
    let root = TempRoot::new("cli");
    assert_eq!(dispatch_eval(&req(&root, &["list"], None)).unwrap(), json!({"ok":true,"evals":[],"invalid":[]}));
    let value = serde_json::to_value(input("cli-a", "panel", "q")).unwrap();
    let output = dispatch_eval(&req(&root, &["record", "--dir", root.0.to_str().unwrap(), "--json"], Some(value))).unwrap();
    assert_eq!(output["eval"]["evalId"], "cli-a");
    assert_eq!(output["eval"]["scores"]["decision-clarity"], 1);
    let listed = dispatch_eval(&req(&root, &["list", "--harness", "panel", "--question=q"], None)).unwrap();
    assert_eq!(listed["evals"][0], output["eval"]);
    for args in [vec![], vec!["unknown"], vec!["list", "--harness"], vec!["list", "--question="], vec!["list", "--bogus"], vec!["record", "--harness", "panel"]] {
        assert!(dispatch_eval(&req(&root, &args, None)).is_err(), "args: {:?}", args);
    }
    assert!(dispatch_eval(&req(&root, &["record"], None)).unwrap_err().contains("stdin"));
    let mut forged = serde_json::to_value(input("forged", "panel", "q")).unwrap();
    forged["ts"] = json!("2020-01-01T00:00:00Z");
    assert!(dispatch_eval(&req(&root, &["record"], Some(forged))).is_err());
}

// Real child processes exercise distinct writer shards without mutating the test
// process environment (which would race the parallel Rust suite).
#[test]
fn eval_writer_child() {
    let Ok(root) = std::env::var("FGOS_EVAL_TEST_ROOT") else { return; };
    let writer = std::env::var("FGOS_SESSION_ID").unwrap();
    let prefix = std::env::var("FGOS_EVAL_TEST_ID_PREFIX").unwrap_or(writer);
    for i in 0..5 {
        eval_journal::record(std::path::Path::new(&root), input(&format!("{}-{}", prefix, i), "concurrent", "q")).unwrap();
    }
}

#[test]
fn concurrent_process_writers_leave_complete_shards() {
    let root = TempRoot::new("concurrent");
    let exe = std::env::current_exe().unwrap();
    let mut children = Vec::new();
    for writer in 0..6 {
        children.push(Command::new(&exe).args(["--exact", "eval_writer_child", "--nocapture"])
            .env("FGOS_EVAL_TEST_ROOT", &root.0).env("FGOS_SESSION_ID", format!("writer-{}", writer))
            .env("FGOS_NOW", "2026-10-05T10:00:00.000Z").spawn().unwrap());
    }
    for mut child in children { assert!(child.wait().unwrap().success()); }
    let result = eval_journal::list(&root.0, None, None).unwrap();
    assert_eq!(result.evals.len(), 30);
    assert!(result.invalid.is_empty());
    for writer in 0..6 {
        let shard = root.0.join(format!(".fgos/observe/evals/writer-{}.jsonl", writer));
        let text = fs::read_to_string(shard).unwrap();
        assert!(text.ends_with('\n'));
        assert_eq!(text.lines().count(), 5);
        for record in result.evals.iter().filter(|e| e.eval_id.starts_with(&format!("writer-{}-", writer))) {
            assert_eq!(record.ts, "2026-10-05T10:00:00.000Z");
        }
    }
    assert!(!root.0.join(".fgos/observe/.lock").exists());
}

#[test]
fn read_order_is_timestamp_then_id_and_partial_tail_is_reported() {
    let root = TempRoot::new("order");
    let record = eval_journal::record(&root.0, input("seed", "panel", "q")).unwrap();
    let dir = root.0.join(".fgos/observe/evals");
    for (file, id, ts) in [("a", "later", "2026-10-05T11:00:00Z"), ("z", "first", "2026-10-04T11:00:00Z")] {
        let mut edited = record.clone(); edited.eval_id = id.into(); edited.ts = ts.into();
        fs::write(dir.join(format!("{}.jsonl", file)), format!("{}\n", serde_json::to_string(&edited).unwrap())).unwrap();
    }
    let mut file = fs::OpenOptions::new().append(true).open(dir.join("a.jsonl")).unwrap();
    file.write_all(b"{\"v\":1").unwrap();
    let listed = eval_journal::list(&root.0, None, None).unwrap();
    assert_eq!(listed.evals.len(), 3);
    let ids: Vec<_> = listed.evals.iter().map(|e| e.eval_id.as_str()).collect();
    assert!(ids.iter().position(|id| *id == "first").unwrap() < ids.iter().position(|id| *id == "later").unwrap());
    assert_eq!(listed.invalid.len(), 1);
    assert_eq!(listed.invalid[0].line, 2);
}

#[cfg(unix)]
#[test]
fn symlink_writer_shard_never_changes_external_target() {
    use std::os::unix::fs::symlink;
    let root = TempRoot::new("shard-symlink");
    let external = TempRoot::new("external-target");
    let target = external.0.join("must-not-change");
    fs::write(&target, "original external bytes\n").unwrap();
    let dir = root.0.join(".fgos/observe/evals");
    fs::create_dir_all(&dir).unwrap();
    let writer = fgos_observe::shard::resolve_writer_id();
    symlink(&target, dir.join(format!("{}.jsonl", writer))).unwrap();
    assert!(eval_journal::record(&root.0, input("unsafe", "panel", "q")).is_err());
    assert_eq!(fs::read_to_string(&target).unwrap(), "original external bytes\n");
    assert!(eval_journal::list(&root.0, None, None).unwrap().evals.is_empty());
    assert!(!root.0.join(".fgos/observe/.lock").exists());
}

#[cfg(unix)]
#[test]
fn symlink_eval_directory_is_rejected_before_external_writes() {
    use std::os::unix::fs::symlink;
    let root = TempRoot::new("directory-symlink");
    let external = TempRoot::new("external-directory");
    let marker = external.0.join("marker");
    fs::write(&marker, "keep").unwrap();
    fs::create_dir_all(root.0.join(".fgos/observe")).unwrap();
    symlink(&external.0, root.0.join(".fgos/observe/evals")).unwrap();
    assert!(eval_journal::record(&root.0, input("unsafe", "panel", "q")).unwrap_err().contains("real directory"));
    assert_eq!(fs::read_to_string(marker).unwrap(), "keep");
    assert_eq!(fs::read_dir(&external.0).unwrap().count(), 1);
    assert!(!root.0.join(".fgos/observe/.lock").exists());
}

#[test]
fn eval_rejected_writer_child() {
    let Ok(root) = std::env::var("FGOS_EVAL_REJECT_TEST_ROOT") else { return; };
    let error = eval_journal::record(std::path::Path::new(&root), input("unsafe", "panel", "q")).unwrap_err();
    assert!(error.contains("single filename component"), "{}", error);
}

#[test]
fn writer_identifier_cannot_escape_store() {
    let root = TempRoot::new("writer-traversal");
    let exe = std::env::current_exe().unwrap();
    for writer in ["../escape", "../../escape", "/tmp/escape", "parent\\escape", ".", ".."] {
        let status = Command::new(&exe).args(["--exact", "eval_rejected_writer_child"])
            .env("FGOS_EVAL_REJECT_TEST_ROOT", &root.0).env("FGOS_SESSION_ID", writer)
            .status().unwrap();
        assert!(status.success(), "writer: {}", writer);
    }
    assert!(!root.0.join(".fgos").exists());
}

#[test]
fn overflowing_lines_are_drained_and_next_valid_line_is_read() {
    let root = TempRoot::new("oversized");
    let mut valid = eval_journal::record(&root.0, input("seed", "panel", "q")).unwrap();
    valid.eval_id = "after-overflow".into();
    let path = root.0.join(".fgos/observe/evals/oversized.jsonl");
    let mut file = fs::File::create(&path).unwrap();
    let chunk = [b'x'; 8192];
    // Far beyond the cap, generated in small chunks rather than one huge buffer.
    for _ in 0..4096 { file.write_all(&chunk).unwrap(); }
    file.write_all(b"\n").unwrap();
    writeln!(file, "{}", serde_json::to_string(&valid).unwrap()).unwrap();
    for _ in 0..256 { file.write_all(&chunk).unwrap(); } // Overflowing partial tail.
    drop(file);
    let result = eval_journal::list(&root.0, None, None).unwrap();
    assert!(result.evals.iter().any(|record| record.eval_id == "after-overflow"));
    assert_eq!(result.evals.len(), 2);
    assert_eq!(result.invalid.len(), 2);
    assert_eq!(result.invalid[0].line, 1);
    assert_eq!(result.invalid[1].line, 3);
    assert!(result.invalid.iter().all(|line| line.error.contains("1 MiB")));
}

#[cfg(unix)]
#[test]
fn list_rejects_symlink_store_components_with_external_valid_records() {
    use std::os::unix::fs::symlink;
    let external = TempRoot::new("read-external");
    eval_journal::record(&external.0, input("external-valid", "panel", "q")).unwrap();
    assert_eq!(eval_journal::list(&external.0, None, None).unwrap().evals.len(), 1);
    for component in [".fgos", ".fgos/observe", ".fgos/observe/evals"] {
        let root = TempRoot::new("read-linked-store");
        let link = root.0.join(component);
        fs::create_dir_all(link.parent().unwrap()).unwrap();
        symlink(external.0.join(component), &link).unwrap();
        let error = dispatch_eval(&req(&root, &["list"], None)).unwrap_err();
        assert!(error.contains("real directory"));
        assert!(error.contains(link.to_str().unwrap()));
    }
    assert_eq!(eval_journal::list(&external.0, None, None).unwrap().evals[0].eval_id, "external-valid");
}

#[test]
fn missing_store_list_does_not_create_directories() {
    for (existing, missing) in [
        (None, ".fgos"),
        (Some(".fgos"), ".fgos/observe"),
        (Some(".fgos/observe"), ".fgos/observe/evals"),
    ] {
        let root = TempRoot::new("read-missing-store");
        if let Some(existing) = existing {
            fs::create_dir_all(root.0.join(existing)).unwrap();
        }
        assert_eq!(dispatch_eval(&req(&root, &["list"], None)).unwrap(), json!({"ok":true,"evals":[],"invalid":[]}));
        assert!(!root.0.join(missing).exists());
        assert!(!root.0.join(".fgos/observe/.lock").exists());
    }
}

#[test]
fn list_rejects_non_directory_store_component() {
    let root = TempRoot::new("read-non-directory");
    fs::create_dir(root.0.join(".fgos")).unwrap();
    fs::write(root.0.join(".fgos/observe"), "not a directory").unwrap();
    assert!(dispatch_eval(&req(&root, &["list"], None)).unwrap_err().contains("real directory"));
    assert_eq!(fs::read_to_string(root.0.join(".fgos/observe")).unwrap(), "not a directory");
}

#[test]
fn known_rubric_requires_exactly_five_criteria_before_writing() {
    let root = TempRoot::new("complete-rubric");
    for key in ["perspective-spread", "decision-clarity", "counterfactual-depth", "evidence-discipline", "execution-quality"] {
        let mut partial = input("partial", "panel", "q");
        partial.scores.remove(key);
        assert!(eval_journal::record(&root.0, partial).is_err());
    }
    let mut extra = input("extra", "panel", "q");
    extra.scores.insert("unrelated".into(), 1);
    assert!(eval_journal::record(&root.0, extra).is_err());
    assert!(!root.0.join(".fgos/observe").exists());
    let mut custom = input("custom", "panel", "q");
    custom.rubric = "custom-quality.v1".into();
    custom.scores = BTreeMap::from([("custom-axis".into(), 2)]);
    eval_journal::record(&root.0, custom).unwrap();
    assert_eq!(eval_journal::list(&root.0, None, None).unwrap().evals[0].scores["custom-axis"], 2);
}

#[test]
fn incomplete_known_rubric_is_invalid_even_outside_the_filter() {
    let root = TempRoot::new("partial-read");
    let good = eval_journal::record(&root.0, input("good", "panel", "q")).unwrap();
    let mut partial = good;
    partial.eval_id = "partial".into();
    partial.harness = "other".into();
    partial.scores.remove("execution-quality");
    fs::write(root.0.join(".fgos/observe/evals/partial.jsonl"), format!("{}\n", serde_json::to_string(&partial).unwrap())).unwrap();
    let listed = eval_journal::list(&root.0, Some("panel"), None).unwrap();
    assert_eq!(listed.evals.len(), 1);
    assert_eq!(listed.invalid.len(), 1);
    assert_eq!(listed.invalid[0].line, 1);
    assert!(listed.invalid[0].file.ends_with("/partial.jsonl"));
}

#[test]
fn duplicate_identity_is_refused_without_append_and_reported_across_shards() {
    let root = TempRoot::new("duplicate");
    let first = eval_journal::record(&root.0, input("same", "panel", "q")).unwrap();
    let dir = root.0.join(".fgos/observe/evals");
    let shard = fs::read_dir(&dir).unwrap().next().unwrap().unwrap().path();
    let before = fs::read(&shard).unwrap();
    assert!(eval_journal::record(&root.0, input("same", "other", "q2")).unwrap_err().contains("duplicate evalId"));
    assert_eq!(fs::read(&shard).unwrap(), before);
    let copy = shard.with_file_name(format!("{}-copy.jsonl", shard.file_stem().unwrap().to_str().unwrap()));
    fs::write(&copy, format!("{}\n", serde_json::to_string(&first).unwrap())).unwrap();
    let listed = eval_journal::list(&root.0, Some("absent"), None).unwrap();
    assert!(listed.evals.is_empty());
    assert_eq!(listed.invalid.len(), 1);
    assert!(listed.invalid[0].error.contains("duplicate evalId"));
    assert!(eval_journal::record(&root.0, input("same", "other", "q2")).is_err());
    assert!(eval_journal::record(&root.0, input("new", "other", "q2")).is_err());
    assert_eq!(fs::read(&shard).unwrap(), before);
}

#[test]
fn invalid_existing_data_blocks_identity_check_without_mutating_the_store() {
    let root = TempRoot::new("invalid-identity");
    eval_journal::record(&root.0, input("seed", "panel", "q")).unwrap();
    let broken = root.0.join(".fgos/observe/evals/broken.jsonl");
    fs::write(&broken, b"{\"evalId\":\"unknown").unwrap();
    let before = fs::read(&broken).unwrap();
    assert!(eval_journal::record(&root.0, input("new", "panel", "q")).is_err());
    assert_eq!(fs::read(&broken).unwrap(), before);
    let listed = eval_journal::list(&root.0, None, None).unwrap();
    assert_eq!(listed.evals.len(), 1);
    assert_eq!(listed.invalid.len(), 1);
    assert!(!root.0.join(".fgos/observe/.lock").exists());
}

#[test]
fn concurrent_processes_share_one_shard_without_torn_or_lost_records() {
    let root = TempRoot::new("same-shard");
    let exe = std::env::current_exe().unwrap();
    let mut children = Vec::new();
    for writer in 0..6 {
        children.push(Command::new(&exe).args(["--exact", "eval_writer_child", "--nocapture"])
            .env("FGOS_EVAL_TEST_ROOT", &root.0).env("FGOS_SESSION_ID", "shared")
            .env("FGOS_EVAL_TEST_ID_PREFIX", format!("writer-{}", writer)).spawn().unwrap());
    }
    for mut child in children { assert!(child.wait().unwrap().success()); }
    let listed = eval_journal::list(&root.0, None, None).unwrap();
    assert_eq!(listed.evals.len(), 30);
    assert!(listed.invalid.is_empty());
    let ids: std::collections::BTreeSet<_> = listed.evals.iter().map(|record| &record.eval_id).collect();
    assert_eq!(ids.len(), 30);
    let text = fs::read_to_string(root.0.join(".fgos/observe/evals/shared.jsonl")).unwrap();
    assert_eq!(text.lines().count(), 30);
    assert!(text.ends_with('\n'));
    assert_eq!(fs::read_dir(root.0.join(".fgos/observe/evals")).unwrap().count(), 1);
}

#[test]
fn eval_collision_child() {
    let Ok(root) = std::env::var("FGOS_EVAL_COLLISION_ROOT") else { return; };
    match eval_journal::record(std::path::Path::new(&root), input("same-id", "concurrent", "q")) {
        Ok(_) => std::process::exit(0),
        Err(error) if error.contains("duplicate evalId") => std::process::exit(41),
        Err(error) => panic!("{}", error),
    }
}

#[test]
fn competing_processes_can_publish_an_identity_only_once() {
    let root = TempRoot::new("identity-race");
    let exe = std::env::current_exe().unwrap();
    let mut children = Vec::new();
    for writer in ["first", "second"] {
        children.push(Command::new(&exe).args(["--exact", "eval_collision_child", "--nocapture"])
            .env("FGOS_EVAL_COLLISION_ROOT", &root.0).env("FGOS_SESSION_ID", writer).spawn().unwrap());
    }
    let mut outcomes: Vec<_> = children.into_iter().map(|mut child| child.wait().unwrap().code().unwrap()).collect();
    outcomes.sort();
    assert_eq!(outcomes, [0, 41]);
    let listed = eval_journal::list(&root.0, None, None).unwrap();
    assert_eq!(listed.evals.len(), 1);
    assert_eq!(listed.evals[0].eval_id, "same-id");
    assert!(listed.invalid.is_empty());
}

#[cfg(unix)]
#[test]
fn unsafe_shards_are_visible_and_never_supply_scores_or_allow_appends() {
    use std::os::unix::fs::symlink;
    let root = TempRoot::new("unsafe-visible");
    let external = TempRoot::new("unsafe-external");
    let record = eval_journal::record(&external.0, input("external", "panel", "q")).unwrap();
    let dir = root.0.join(".fgos/observe/evals");
    fs::create_dir_all(&dir).unwrap();
    let target = external.0.join("scores.jsonl");
    fs::write(&target, format!("{}\n", serde_json::to_string(&record).unwrap())).unwrap();
    let before = fs::read(&target).unwrap();
    symlink(&target, dir.join("linked.jsonl")).unwrap();
    fs::create_dir(dir.join("directory.jsonl")).unwrap();
    let listed = eval_journal::list(&root.0, None, None).unwrap();
    assert!(listed.evals.is_empty());
    assert_eq!(listed.invalid.len(), 2);
    assert!(listed.invalid.iter().all(|invalid| invalid.line == 0));
    assert!(eval_journal::record(&root.0, input("new", "panel", "q")).is_err());
    assert_eq!(fs::read(&target).unwrap(), before);
}
