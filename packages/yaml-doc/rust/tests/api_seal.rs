//! Owning proof of the public seal (spec sections 8 and 10): a panic never leaves a public entry,
//! a caught panic prints nothing, no refusal carries a value of the input, and adversarial input
//! returns in bounded time. The stable-toolchain stand-in for the permanent fuzz targets under
//! `fuzz/`; it reuses the golden fixture inputs as seeds and adds no case of its own to them.
mod common;

use std::collections::HashSet;
use std::panic::catch_unwind;
use std::process::Command;
use std::time::{Duration, Instant};

use common::*;
use fgos_yaml_doc::comment::{sanitize, sanitize_inline};
use fgos_yaml_doc::guard::guard;
use fgos_yaml_doc::merge::{merge, NoRules};
use fgos_yaml_doc::path::{format_path, parse_path};
use fgos_yaml_doc::{
    parse, prescan, rule, CommentLoss, Document, Position, Profile, Refusal, Segment, Value,
};

const MARKER: &str = "SECRET-VALUE-7731";
/// Seeds larger than this are the bound probes of the parse fixtures, not mutation material.
const SEED_BYTES: usize = 64 * 1024;
const LIMIT: Duration = Duration::from_secs(2);

// ---- the guard ----

#[test]
fn a_panic_inside_the_closure_becomes_yaml_internal_error_without_its_message() {
    let refusal = guard::<()>(|| panic!("{MARKER}")).unwrap_err();
    assert_eq!(refusal.rule, rule::YAML_INTERNAL_ERROR);
    assert!(!format!("{refusal} {refusal:?}").contains(MARKER));
}

#[test]
fn a_result_and_a_nested_guard_pass_through_unchanged() {
    assert_eq!(guard(|| Ok(7)), Ok(7));
    let refusal = Refusal::new(rule::SYNTAX_ERROR).at(1, 2);
    assert_eq!(guard::<()>(|| Err(refusal.clone())), Err(refusal));
    let nested = guard(|| guard::<()>(|| panic!("inner")).map(|()| 1));
    assert_eq!(nested.unwrap_err().rule, rule::YAML_INTERNAL_ERROR);
    // The depth counter is restored: a later panic outside any guard is still an ordinary panic.
    assert!(catch_unwind(|| panic!("ordinary")).is_err());
}

/// The child half of the stderr test: it only does something when the parent started it.
#[test]
fn stderr_child() {
    if std::env::var_os("API_SEAL_CHILD").is_none() {
        return;
    }
    let _ = guard::<()>(|| panic!("inside-{MARKER}"));
    let _ = catch_unwind(|| panic!("outside-marker-4412"));
}

#[test]
fn a_caught_panic_prints_nothing_while_a_panic_outside_a_guard_still_does() {
    let output = Command::new(std::env::current_exe().expect("test binary"))
        .args(["--exact", "stderr_child", "--nocapture", "--test-threads=1"])
        .env("API_SEAL_CHILD", "1")
        .output()
        .expect("run the child test");
    assert!(output.status.success(), "child failed");
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        !stderr.contains(MARKER),
        "a guarded panic reached stderr: {stderr}"
    );
    assert!(
        stderr.contains("outside-marker-4412"),
        "the previous hook no longer reports other panics: {stderr}"
    );
}

// ---- the public surface ----

/// How a public function keeps a panic from escaping.
#[derive(Clone, Copy, PartialEq, Debug)]
enum Seal {
    /// The body runs inside `guard`.
    Guarded,
    /// Infallible and total: no input-dependent indexing, arithmetic or allocation bound; read
    /// and kept that way. It cannot return a refusal, so it has nothing to convert a panic into.
    Total,
}

use Seal::{Guarded, Total};

/// Every `pub fn` of the public modules, as `module::name`. A new public function without a row
/// here fails `the_table_lists_exactly_the_public_functions`.
const SURFACE: &[(&str, Seal)] = &[
    ("comment::sanitize", Guarded),
    ("comment::sanitize_inline", Guarded),
    ("document::parse", Guarded),
    ("document::source", Total),
    ("document::profile", Total),
    ("document::file", Total),
    ("document::value", Total),
    ("document::revision", Total),
    ("document::span_of", Total),
    ("document::to_json", Guarded),
    ("edit::to_bytes", Total),
    ("edit::set", Guarded),
    ("edit::insert", Guarded),
    ("edit::remove", Guarded),
    ("edit::set_comment_block", Guarded),
    ("edit::set_inline_comment", Guarded),
    ("edit::comments_at", Guarded),
    ("guard::guard", Guarded),
    ("merge::merge", Guarded),
    ("model::from_json", Total),
    ("model::to_json", Total),
    ("model::name", Total),
    ("model::from_name", Total),
    ("model::limits", Total),
    ("model::new", Total),
    ("model::with_file", Total),
    ("model::with_path", Total),
    ("model::at", Total),
    ("model::with_detail", Total),
    ("path::format_path", Total),
    ("path::parse_path", Guarded),
    ("prescan::check", Guarded),
];

const PUBLIC_MODULES: [&str; 8] = [
    "comment", "document", "edit", "guard", "merge", "model", "path", "prescan",
];

/// `(module::name, text of the function from its signature to the next function)`.
fn public_functions() -> Vec<(String, String)> {
    let mut found = Vec::new();
    for module in PUBLIC_MODULES {
        let path = format!("{}/src/{module}.rs", env!("CARGO_MANIFEST_DIR"));
        let source = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{path}: {e}"));
        let production = source.split("#[cfg(test)]").next().unwrap_or("");
        let lines: Vec<&str> = production.lines().collect();
        for (index, line) in lines.iter().enumerate() {
            let Some(rest) = line.trim_start().strip_prefix("pub fn ") else {
                continue;
            };
            let name: String = rest
                .chars()
                .take_while(|c| c.is_alphanumeric() || *c == '_')
                .collect();
            let body: Vec<&str> = lines[index + 1..]
                .iter()
                .take_while(|l| !l.trim_start().starts_with("pub fn ") && !l.starts_with("fn "))
                .copied()
                .collect();
            found.push((
                format!("{module}::{name}"),
                format!("{line}\n{}", body.join("\n")),
            ));
        }
    }
    found
}

#[test]
fn the_table_lists_exactly_the_public_functions() {
    let actual: Vec<String> = public_functions().into_iter().map(|(k, _)| k).collect();
    let listed: Vec<String> = SURFACE.iter().map(|(k, _)| k.to_string()).collect();
    assert_eq!(
        actual, listed,
        "a public function was added or removed without a row"
    );
}

#[test]
fn every_guarded_entry_goes_through_guard_and_no_total_one_does_not_need_to() {
    let functions = public_functions();
    for (key, seal) in SURFACE {
        let (_, text) = functions.iter().find(|(k, _)| k == key).expect(key);
        if *seal == Guarded && *key != "guard::guard" {
            assert!(
                text.contains("guard("),
                "{key} is marked guarded but never calls guard"
            );
        }
    }
}

#[test]
fn the_release_profiles_unwind_so_the_guard_can_catch() {
    let root = format!("{}/../../..", env!("CARGO_MANIFEST_DIR"));
    let manifests = [
        "Cargo.toml",
        "apps/fgos-gateway/Cargo.toml",
        "packages/yaml-doc/rust/Cargo.toml",
    ];
    for manifest in manifests {
        let text = std::fs::read_to_string(format!("{root}/{manifest}")).unwrap_or_default();
        assert!(
            !text
                .lines()
                .any(|l| l.trim_start().starts_with("panic") && l.contains("abort")),
            "{manifest} sets panic = abort: the guard would never run"
        );
    }
}

// ---- no value in an error ----

fn assert_clean(label: &str, refusal: &Refusal) {
    // A caught panic is still a defect: the guard is the last line, not the plan.
    assert_ne!(
        refusal.rule,
        rule::YAML_INTERNAL_ERROR,
        "{label}: a panic was caught"
    );
    let shown = format!("{refusal} | {refusal:?}");
    assert!(
        !shown.contains(MARKER),
        "{label}: a value reached the refusal text: {shown}"
    );
}

/// Variants of one input that carry the marker in a comment and in a scalar.
fn marked(input: &[u8]) -> Vec<Vec<u8>> {
    let mut leading = format!("# {MARKER}\n").into_bytes();
    leading.extend_from_slice(input);
    let mut comment = input.to_vec();
    comment.extend_from_slice(format!("\n# {MARKER}\n").as_bytes());
    let mut scalar = input.to_vec();
    scalar.extend_from_slice(format!("\nsecret: {MARKER}\n").as_bytes());
    vec![input.to_vec(), leading, comment, scalar]
}

/// Documents that refuse while the marker sits in the offending scalar or comment itself.
fn hand_made() -> Vec<String> {
    vec![
        format!("a: [{MARKER}"),
        format!("a: {MARKER}\na: {MARKER}\n"),
        format!("a: !!python/object {MARKER}\n"),
        format!("a: &x {MARKER}\nb: *x\n"),
        format!("a: {MARKER}\u{202e}\n"),
        format!("a: {MARKER}\u{200b}\n"),
        format!("a: {MARKER}  # {MARKER}\u{202e}\n"),
        format!("? [{MARKER}]\n: 1\n"),
        format!("{MARKER}: 1\n---\n{MARKER}: 2\n"),
        format!("1: {MARKER}\n"),
        format!("__proto__: {MARKER}\n"),
        format!("a: {MARKER}\n  b: {MARKER}\n"),
        format!("a: 99999999999999999999 # {MARKER}\n"),
        format!("a: .nan # {MARKER}\n"),
        format!("a: \"{MARKER}\n"),
        format!("a: |\n  {MARKER}\n b: {MARKER}\n"),
        format!("{}: {MARKER}\n", "k".repeat(2000)),
        format!("a: {}\n", MARKER.repeat(40_000)),
    ]
}

#[test]
fn no_refusal_carries_a_value_or_a_snippet_of_the_input() {
    let mut inputs: Vec<Vec<u8>> = Vec::new();
    for fixture in ["parse", "edit"] {
        for case in fixture_cases(fixture) {
            let input = resolve_input(&case["input"]);
            if input.len() <= SEED_BYTES {
                inputs.extend(marked(&input));
            }
        }
    }
    inputs.extend(hand_made().into_iter().map(String::into_bytes));
    inputs.push(vec![b'a', b':', b' ', 0xff, 0xfe]);
    let mut refusals = 0;
    for input in &inputs {
        for profile in Profile::ALL {
            match parse(input, profile, "seal.yaml") {
                Err(refusal) => {
                    refusals += 1;
                    assert_clean("parse", &refusal);
                }
                Ok(mut doc) => edit_all(&mut doc, &mut refusals),
            }
        }
    }
    // The edit fixtures exercise refusals of the edit operations on the marked inputs.
    for case in fixture_cases("edit") {
        let seed = resolve_input(&case["input"]);
        if seed.len() > SEED_BYTES {
            continue;
        }
        for input in marked(&seed) {
            for profile in profiles_of(&case) {
                let Ok(mut doc) = parse(&input, profile, "seal.yaml") else {
                    continue;
                };
                for op in case["ops"].as_array().expect("ops") {
                    if let Err(refusal) = apply_op(&mut doc, op) {
                        refusals += 1;
                        assert_clean("edit fixture", &refusal);
                    }
                }
            }
        }
    }
    // Text handed to the comment operations is never echoed either.
    let hostile = format!("{MARKER}\u{202e}");
    for result in [
        sanitize(&hostile).map(|_| ()),
        sanitize_inline(&hostile).map(|_| ()),
    ] {
        assert_clean("comment", &result.unwrap_err());
        refusals += 1;
    }
    let bad_path = parse_path(&format!("a.{MARKER}.[")).unwrap_err();
    assert_clean("path", &bad_path);
    assert!(refusals > 200, "only {refusals} refusals were looked at");
}

// ---- adversarial input ----

/// One pass over every operation a caller has, on one document; returns after the last.
fn edit_all(doc: &mut Document, refusals: &mut usize) {
    let mut path: Vec<Segment> = match doc.value() {
        Value::Map(entries) => entries
            .first()
            .map(|(k, _)| vec![Segment::Key(k.clone())])
            .unwrap_or_default(),
        Value::Seq(items) if !items.is_empty() => vec![Segment::Index(0)],
        _ => Vec::new(),
    };
    let mut note = |result: Result<(), Refusal>| {
        if let Err(refusal) = result {
            *refusals += 1;
            assert_clean("edit", &refusal);
        }
    };
    note(doc.set(&path, Value::Str("x".into()), CommentLoss::Refuse));
    note(doc.set(
        &path,
        Value::Seq(vec![Value::Int(1)]),
        CommentLoss::Acknowledge,
    ));
    note(doc.insert(
        &[],
        "added",
        Value::Int(1),
        Position::End,
        CommentLoss::Refuse,
    ));
    note(doc.insert(
        &[],
        "after",
        Value::Null,
        Position::After("added"),
        CommentLoss::Acknowledge,
    ));
    note(doc.set_comment_block(&path, &["one".into(), "two\nthree".into()]));
    note(doc.set_inline_comment(&path, Some("note")));
    note(doc.set_inline_comment(&path, None));
    note(doc.comments_at(&path).map(|_| ()));
    note(doc.remove(&path, CommentLoss::Refuse));
    path.push(Segment::Key("deeper".into()));
    note(doc.set(&path, Value::Bool(true), CommentLoss::Refuse));
    note(doc.remove(&path, CommentLoss::Acknowledge));
    let _ = doc.span_of(&path);
    let _ = doc.span_of(&[]);
    note(doc.to_json().map(|_| ()));
    let value = doc.value().clone();
    note(merge(&[&value, &value], &NoRules).map(|_| ()));
    // What an edit left behind must still parse: the invariant the edit code checks itself.
    parse(&doc.to_bytes(), doc.profile(), "seal.yaml")
        .unwrap_or_else(|e| panic!("an edit left a document that does not parse: {e}"));
}

fn mutations(input: &[u8]) -> Vec<Vec<u8>> {
    let n = input.len();
    // Every 7th and 13th byte for ordinary inputs; 40 evenly spaced points for the large ones.
    let step = |every: usize| -> Vec<usize> {
        if n <= 4096 {
            (0..n).step_by(every).collect()
        } else {
            (0..40).map(|i| i * n / 40).collect()
        }
    };
    let mut out: Vec<Vec<u8>> = step(7).into_iter().map(|at| input[..at].to_vec()).collect();
    for at in step(13) {
        let mut flipped = input.to_vec();
        flipped[at] = !flipped[at];
        out.push(flipped);
    }
    let first_line = input.split(|b| *b == b'\n').next().unwrap_or(&[]);
    let mut repeated = input.to_vec();
    for _ in 0..1000 {
        repeated.push(b'\n');
        repeated.extend_from_slice(first_line);
    }
    out.push(repeated);
    let mut wrapped = vec![b'['; 40];
    wrapped.extend_from_slice(input);
    wrapped.extend(std::iter::repeat_n(b']', 40));
    out.push(wrapped);
    out
}

fn exercise(input: &[u8]) {
    let started = Instant::now();
    let lossy = String::from_utf8_lossy(input);
    if let Err(r) = parse_path(&lossy) {
        assert_clean("path", &r);
    }
    if let Err(r) = sanitize(&lossy) {
        assert_clean("comment", &r);
    }
    if let Err(r) = sanitize_inline(&lossy) {
        assert_clean("comment", &r);
    }
    for profile in Profile::ALL {
        if let Err(r) = prescan::check(input, profile, "seal.yaml") {
            assert_clean("prescan", &r);
        }
        match parse(input, profile, "seal.yaml") {
            Ok(mut doc) => edit_all(&mut doc, &mut 0),
            Err(refusal) => assert_clean("parse", &refusal),
        }
        let _ = format_path(&[Segment::Key(lossy.chars().take(20).collect())]);
    }
    let took = started.elapsed();
    assert!(
        took < LIMIT * 4,
        "an input of {} bytes took {took:?} through the whole API",
        input.len()
    );
}

#[test]
fn mutated_fixture_inputs_return_without_panic_in_bounded_time() {
    let mut seen = HashSet::new();
    let mut inputs = Vec::new();
    for fixture in ["parse", "edit"] {
        for case in fixture_cases(fixture) {
            let input = resolve_input(&case["input"]);
            // Inputs past the byte bound belong to the parse fixtures; mutating them is no probe.
            if input.len() <= SEED_BYTES && seen.insert(input.clone()) {
                inputs.push(input);
            }
        }
    }
    let mut runs = 0;
    for input in &inputs {
        for mutated in std::iter::once(input.clone()).chain(mutations(input)) {
            let started = Instant::now();
            // A panic would have been caught by the guard and shown up as a refusal; the only
            // way to fail here is an escaped panic, an invariant break or a slow input.
            exercise(&mutated);
            assert!(
                started.elapsed() < LIMIT * 4,
                "slow input of {} bytes",
                mutated.len()
            );
            runs += 1;
        }
    }
    assert!(runs > 3_000, "only {runs} mutated inputs ran");
}
