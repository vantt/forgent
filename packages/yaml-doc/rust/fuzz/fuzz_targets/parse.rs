//! Any bytes under either profile: no panic (a panic the guard caught still counts), a named
//! refusal or a document whose bytes are exactly the input.
#![no_main]

use fgos_yaml_doc::{parse, rule};
use fgos_yaml_doc_fuzz::split_profile;
use libfuzzer_sys::fuzz_target;

fuzz_target!(|data: &[u8]| {
    let Some((profile, input)) = split_profile(data) else {
        return;
    };
    match parse(input, profile, "fuzz.yaml") {
        Ok(doc) => {
            assert_eq!(
                doc.to_bytes(),
                input,
                "an unedited document must print its input"
            );
            assert_eq!(doc.source(), input);
            let _ = doc.to_json();
            let _ = doc.span_of(&[]);
        }
        Err(refusal) => {
            assert_ne!(
                refusal.rule,
                rule::YAML_INTERNAL_ERROR,
                "a panic was caught: {refusal}"
            );
            assert!(
                rule::ALL.contains(&refusal.rule),
                "unnamed rule {}",
                refusal.rule
            );
        }
    }
});
