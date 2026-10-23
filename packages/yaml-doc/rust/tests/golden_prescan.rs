//! Owning proof of the size and depth pre-scan, over `fixtures/prescan.v1.json`.
mod common;

use common::*;
use fgos_yaml_doc::prescan::check;

#[test]
fn prescan_matches_the_golden_cases() {
    for case in fixture_cases("prescan") {
        let name = id(&case);
        let bytes = resolve_input(&case["input"]);
        for profile in profiles_of(&case) {
            let label = format!("{name} [{}]", profile.name());
            let result = check(&bytes, profile, "fixture.yaml");
            if case["expect"]["ok"] == true {
                result.unwrap_or_else(|e| panic!("{label}: {e}"));
                continue;
            }
            let refusal = result.expect_err(&label);
            assert_eq!(
                refusal.file, "fixture.yaml",
                "{label}: the refusal names the file"
            );
            assert_refusal(&label, &refusal, &case["expect"]);
        }
    }
}
