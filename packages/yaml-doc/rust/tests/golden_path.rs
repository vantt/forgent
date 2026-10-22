//! Owning proof of the path text form, over `fixtures/path.v1.json`.
mod common;

use common::*;
use fgos_yaml_doc::path::{format_path, parse_path};

#[test]
fn path_text_form_matches_the_golden_cases() {
    for case in fixture_cases("path") {
        let name = id(&case);
        let text = case["input"]["text"].as_str().expect("input.text");
        let parsed = parse_path(text);
        if case["expect"]["refusal"].is_object() {
            assert_refusal(name, &parsed.expect_err(name), &case["expect"]);
            continue;
        }
        let segments = parsed.unwrap_or_else(|e| panic!("{name}: {e}"));
        assert_eq!(
            segments,
            segments_from_json(&case["expect"]["segments"]),
            "{name}: segments"
        );
        let canonical = case["expect"]["canonical"].as_str().unwrap_or(text);
        let formatted = format_path(&segments);
        assert_eq!(formatted, canonical, "{name}: canonical text");
        assert_eq!(
            parse_path(&formatted).unwrap_or_else(|e| panic!("{name}: {e}")),
            segments,
            "{name}: round trip"
        );
    }
}
