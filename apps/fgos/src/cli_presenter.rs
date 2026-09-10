//! CLI presenter for `apps/fgos`.
//!
//! Formats native kernel outcomes and errors for presentation to stdout/stderr.
//! Emits exactly one `fgos.v1` envelope matching `src/state/envelope.mjs` semantics.

use fgos_host_runtime::{ProviderError, ProviderOutcome};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::io::Write;
use std::time::SystemTime;

/// The fgos.v1 envelope wrapping semantic data.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct FgosV1Envelope<T> {
    pub contract: String,
    pub generated_at: String,
    pub data_hash: String,
    pub data: T,
}

/// Formats a SystemTime into ISO 8601 UTC string (YYYY-MM-DDTHH:mm:ss.sssZ).
pub fn format_iso8601(time: SystemTime) -> String {
    let dur = time
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default();
    let total_secs = dur.as_secs();
    let millis = dur.subsec_millis();

    let sec = (total_secs % 60) as u32;
    let min = ((total_secs / 60) % 60) as u32;
    let hour = ((total_secs / 3600) % 24) as u32;

    // Howard Hinnant's civil date algorithm
    let z = (total_secs / 86400) as i64 + 719468;
    let era = (if z >= 0 { z } else { z - 146096 }) / 146097;
    let doe = (z - era * 146097) as u32;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };

    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}.{:03}Z",
        y, m, d, hour, min, sec, millis
    )
}

/// Computes the sha256 hex digest of a compact JSON string.
pub fn compute_data_hash(compact_json: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(compact_json.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Wraps data into an `fgos.v1` envelope, pretty-printed with 2 spaces and trailing newline.
pub fn wrap_envelope<T: Serialize>(
    data: &T,
    generated_at: Option<String>,
) -> Result<String, String> {
    let compact_json = serde_json::to_string(data)
        .map_err(|e| format!("failed to serialize data to compact JSON: {}", e))?;
    let data_hash = compute_data_hash(&compact_json);
    let gen_at = generated_at.unwrap_or_else(|| format_iso8601(SystemTime::now()));

    let envelope = FgosV1Envelope {
        contract: "fgos.v1".to_string(),
        generated_at: gen_at,
        data_hash,
        data,
    };

    let mut pretty_json = serde_json::to_string_pretty(&envelope)
        .map_err(|e| format!("failed to serialize envelope to pretty JSON: {}", e))?;
    pretty_json.push('\n');
    Ok(pretty_json)
}

/// Presents a provider invocation failure on stderr and returns the process exit code.
pub fn present_error(err: &ProviderError) -> i32 {
    match err {
        ProviderError::NoBinding(refuse) => {
            eprintln!("fgos: error: selection refused (no binding): {}", refuse);
            1
        }
        ProviderError::CallerAdmissionDenied(refuse) => {
            eprintln!("fgos: error: admission refused: {}", refuse);
            1
        }
        ProviderError::SelectedProviderCapabilityDenied(refuse) => {
            eprintln!("fgos: error: grant refused: {}", refuse);
            1
        }
        _ => {
            eprintln!("fgos: error: invocation failed: {}", err);
            1
        }
    }
}

/// Presents a successful provider outcome and returns the process exit code.
pub fn present_outcome(outcome: &ProviderOutcome) -> i32 {
    match outcome {
        ProviderOutcome::Completed { output, .. } => {
            let formatted =
                if let Some(show) = output.downcast_ref::<fgos_distribution::BuildShowOutcome>() {
                    wrap_envelope(show, None)
                } else if let Some(val) = output.downcast_ref::<serde_json::Value>() {
                    wrap_envelope(val, None)
                } else if let Some(s) = output.downcast_ref::<String>() {
                    wrap_envelope(s, None)
                } else {
                    eprintln!("fgos: error: unsupported outcome payload type");
                    return 1;
                };

            match formatted {
                Ok(bytes_str) => {
                    let _ = std::io::stdout().write_all(bytes_str.as_bytes());
                    0
                }
                Err(err) => {
                    eprintln!("fgos: error: {}", err);
                    1
                }
            }
        }
        ProviderOutcome::Parked { reason, .. } => {
            eprintln!("fgos: parked: {}", reason);
            0
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_iso8601() {
        let ts = format_iso8601(SystemTime::now());
        assert!(
            ts.ends_with('Z'),
            "timestamp must end with Z timezone: {}",
            ts
        );
        let regex_pattern = regex_lite_like_check(&ts);
        assert!(
            regex_pattern,
            "timestamp must match ISO 8601 pattern: {}",
            ts
        );
    }

    /// Regression for a HIGH finding (P08 review round 1): wrong civil-date
    /// constants made this function emit wrong, sometimes impossible dates
    /// (e.g. a real 2026-02-28 rendered as 2027-02-31, which does not
    /// exist) on 3-5 days per year, concentrated in late February. Covers
    /// the epoch, a non-leap late-February date, a leap-day date, and the
    /// 2100 century-non-leap-year boundary (divisible by 4 but not by 400,
    /// so NOT a leap year in the Gregorian calendar Hinnant's algorithm
    /// implements).
    #[test]
    fn test_format_iso8601_civil_date_table() {
        let cases: &[(u64, &str)] = &[
            (0, "1970-01-01T00:00:00.000Z"),
            (1772236800, "2026-02-28T00:00:00.000Z"),
            (1835395200, "2028-02-29T00:00:00.000Z"),
            (4107542400, "2100-03-01T00:00:00.000Z"),
            (951782400, "2000-02-29T00:00:00.000Z"),
            (1709210096, "2024-02-29T12:34:56.000Z"),
        ];
        for (epoch_secs, expected) in cases {
            let time = SystemTime::UNIX_EPOCH + std::time::Duration::from_secs(*epoch_secs);
            let actual = format_iso8601(time);
            assert_eq!(
                &actual, expected,
                "epoch {} seconds: expected {}, got {}",
                epoch_secs, expected, actual
            );
        }
    }

    fn regex_lite_like_check(s: &str) -> bool {
        // Expected: YYYY-MM-DDTHH:mm:ss.sssZ (24 chars)
        if s.len() != 24 {
            return false;
        }
        let b = s.as_bytes();
        b[4] == b'-'
            && b[7] == b'-'
            && b[10] == b'T'
            && b[13] == b':'
            && b[16] == b':'
            && b[19] == b'.'
            && b[23] == b'Z'
    }

    #[test]
    fn test_envelope_version_vector() {
        let vector_str = include_str!("../../../test/rust-host/vectors/envelope/version.json");
        let vector: serde_json::Value =
            serde_json::from_str(vector_str).expect("version vector must parse");

        let data = &vector["data"];
        let expected_compact = vector["compact_hash_input"].as_str().unwrap();
        let expected_hash = vector["data_hash"].as_str().unwrap();
        let expected_gen_at = vector["envelope"]["generated_at"].as_str().unwrap();
        let expected_envelope_bytes = vector["envelope_bytes"].as_str().unwrap();

        let compact = serde_json::to_string(data).unwrap();
        assert_eq!(compact, expected_compact);

        let hash = compute_data_hash(&compact);
        assert_eq!(hash, expected_hash);

        let wrapped = wrap_envelope(data, Some(expected_gen_at.to_string())).unwrap();
        assert_eq!(wrapped, expected_envelope_bytes);
    }

    #[test]
    fn test_envelope_list_vector() {
        let vector_str = include_str!("../../../test/rust-host/vectors/envelope/list.json");
        let vector: serde_json::Value =
            serde_json::from_str(vector_str).expect("list vector must parse");

        let data = &vector["data"];
        let expected_compact = vector["compact_hash_input"].as_str().unwrap();
        let expected_hash = vector["data_hash"].as_str().unwrap();
        let expected_gen_at = vector["envelope"]["generated_at"].as_str().unwrap();
        let expected_envelope_bytes = vector["envelope_bytes"].as_str().unwrap();

        let compact = serde_json::to_string(data).unwrap();
        assert_eq!(compact, expected_compact);

        let hash = compute_data_hash(&compact);
        assert_eq!(hash, expected_hash);

        let wrapped = wrap_envelope(data, Some(expected_gen_at.to_string())).unwrap();
        assert_eq!(wrapped, expected_envelope_bytes);
    }

    #[test]
    fn test_serialization_corpus_object_insertion_order() {
        let fixture_str = include_str!(
            "../../../test/rust-host/vectors/serialization/object-insertion-order.json"
        );
        let fixture: serde_json::Value =
            serde_json::from_str(fixture_str).expect("fixture must parse");
        let input_val = &fixture["input_value"];
        let compact = serde_json::to_string(input_val).unwrap();
        assert_eq!(compact, fixture["compact_bytes"].as_str().unwrap());
        let pretty = serde_json::to_string_pretty(input_val).unwrap();
        assert_eq!(pretty, fixture["pretty_bytes"].as_str().unwrap());
    }

    #[test]
    fn test_serialization_corpus_integer_limits() {
        let fixture_str =
            include_str!("../../../test/rust-host/vectors/serialization/integer-limits.json");
        let fixture: serde_json::Value =
            serde_json::from_str(fixture_str).expect("fixture must parse");
        let input_val = &fixture["input_value"];
        let compact = serde_json::to_string(input_val).unwrap();
        assert_eq!(compact, fixture["compact_bytes"].as_str().unwrap());
        let pretty = serde_json::to_string_pretty(input_val).unwrap();
        assert_eq!(pretty, fixture["pretty_bytes"].as_str().unwrap());
    }

    #[test]
    fn test_serialization_corpus_negative_zero() {
        let fixture_str =
            include_str!("../../../test/rust-host/vectors/serialization/negative-zero.json");
        let fixture: serde_json::Value =
            serde_json::from_str(fixture_str).expect("fixture must parse");
        let input_val = &fixture["input_value"];
        let compact = serde_json::to_string(input_val).unwrap();
        assert_eq!(compact, fixture["compact_bytes"].as_str().unwrap());
        let pretty = serde_json::to_string_pretty(input_val).unwrap();
        assert_eq!(pretty, fixture["pretty_bytes"].as_str().unwrap());
    }

    #[test]
    fn test_serialization_corpus_floating_exponent_formatting() {
        let fixture_str = include_str!(
            "../../../test/rust-host/vectors/serialization/floating-exponent-formatting.json"
        );
        let fixture: serde_json::Value =
            serde_json::from_str(fixture_str).expect("fixture must parse");
        let input_val = &fixture["input_value"];
        let compact = serde_json::to_string(input_val).unwrap();
        assert_eq!(compact, fixture["compact_bytes"].as_str().unwrap());
        let pretty = serde_json::to_string_pretty(input_val).unwrap();
        assert_eq!(pretty, fixture["pretty_bytes"].as_str().unwrap());
    }

    #[test]
    fn test_serialization_corpus_unicode_control_characters() {
        let fixture_str = include_str!(
            "../../../test/rust-host/vectors/serialization/unicode-control-characters.json"
        );
        let fixture: serde_json::Value =
            serde_json::from_str(fixture_str).expect("fixture must parse");
        let input_val = &fixture["input_value"];
        let compact = serde_json::to_string(input_val).unwrap();
        assert_eq!(compact, fixture["compact_bytes"].as_str().unwrap());
        let pretty = serde_json::to_string_pretty(input_val).unwrap();
        assert_eq!(pretty, fixture["pretty_bytes"].as_str().unwrap());
    }

    #[test]
    fn test_serialization_corpus_nested_arrays_maps() {
        let fixture_str =
            include_str!("../../../test/rust-host/vectors/serialization/nested-arrays-maps.json");
        let fixture: serde_json::Value =
            serde_json::from_str(fixture_str).expect("fixture must parse");
        let input_val = &fixture["input_value"];
        let compact = serde_json::to_string(input_val).unwrap();
        assert_eq!(compact, fixture["compact_bytes"].as_str().unwrap());
        let pretty = serde_json::to_string_pretty(input_val).unwrap();
        assert_eq!(pretty, fixture["pretty_bytes"].as_str().unwrap());
    }

    #[test]
    fn test_serialization_corpus_null_booleans() {
        let fixture_str =
            include_str!("../../../test/rust-host/vectors/serialization/null-booleans.json");
        let fixture: serde_json::Value =
            serde_json::from_str(fixture_str).expect("fixture must parse");
        let input_val = &fixture["input_value"];
        let compact = serde_json::to_string(input_val).unwrap();
        assert_eq!(compact, fixture["compact_bytes"].as_str().unwrap());
        let pretty = serde_json::to_string_pretty(input_val).unwrap();
        assert_eq!(pretty, fixture["pretty_bytes"].as_str().unwrap());
    }
}
