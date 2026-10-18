use fgos_canonical_json::canonical_json;
use fgos_distribution::verify::to_canonical_json;
use fgos_event_store::envelope::sha256;
use serde_json::json;
#[test]
fn distribution_move_is_blocked_by_existing_number_and_key_order() {
    // The existing digest format is preserved. JCS would change both bytes and hash.
    for (value, legacy, jcs) in [
        (
            json!({"float": 1e-7}),
            "{\"float\":1e-7}",
            "{\"float\":1e-7}",
        ),
        (json!({"float": 1.0}), "{\"float\":1.0}", "{\"float\":1}"),
        (
            json!({"\u{e000}":1,"😀":2}),
            "{\"\u{e000}\":1,\"😀\":2}",
            "{\"😀\":2,\"\u{e000}\":1}",
        ),
    ] {
        assert_eq!(to_canonical_json(&value), legacy);
        assert_eq!(canonical_json(&value).unwrap(), jcs);
        assert_eq!(
            sha256(legacy.as_bytes()) == sha256(jcs.as_bytes()),
            legacy == jcs
        );
    }
}
