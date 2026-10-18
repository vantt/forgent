//! Read-only compatibility proof. Pass every local releases/*/manifest.json.
use fgos_canonical_json::canonical_json;
use fgos_distribution::verify::{recompute_artifact_digest, to_canonical_json};
use fgos_event_store::envelope::sha256;
use serde_json::Value;
fn main() {
    let mut count = 0;
    for path in std::env::args_os().skip(1) {
        let path = std::path::Path::new(&path);
        let old = recompute_artifact_digest(path).expect("existing manifest must verify");
        let mut value: Value = serde_json::from_slice(&std::fs::read(path).unwrap()).unwrap();
        value.as_object_mut().unwrap().remove("artifactDigest");
        let legacy_bytes = to_canonical_json(&value);
        let jcs_bytes = canonical_json(&value).unwrap();
        let new = format!("sha256:{}", sha256(jcs_bytes.as_bytes()));
        println!(
            "{} legacy={old} jcs={new} bytesEqual={}",
            path.display(),
            legacy_bytes == jcs_bytes
        );
        assert_eq!(legacy_bytes, jcs_bytes, "manifest bytes differ");
        count += 1;
    }
    assert!(count > 0, "pass the local release manifest corpus");
    println!("verified {count} staged manifests byte-for-byte (without newline, existing distribution framing)");
}
