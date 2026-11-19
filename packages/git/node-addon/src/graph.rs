//! Mechanical JSON binding of the graph crate: one entry, `graph.analyze`; no second analysis.
//!
//! The argument is the input document of `packages/graph/contracts/graph.v1.json` as JSON text; the answer is
//! the analysis as JSON text. A malformed input is refused by code (the message of the `napi::Error` is the
//! refusal JSON, `path` naming the field and the first offending index); a panic is `graph-internal-error`.
use crate::check;
use crate::marshal::{guarded_as, Failure, More};
use napi::Result;
use napi_derive::napi;

/// The contract version `versions()` reports for this namespace.
pub const CONTRACT_VERSION: u32 = 1;

fn refused(r: fgos_graph::Refusal) -> Failure {
    let path = match r.index {
        Some(i) => format!("{}[{i}]", r.field),
        None => r.field,
    };
    Failure {
        id: r.code.into(),
        more: Some(Box::new(More {
            path: Some(path),
            ..More::default()
        })),
        ..Failure::default()
    }
}

fn analyze_text(text: &str) -> std::result::Result<String, Failure> {
    guarded_as("graph-internal-error", || {
        let analysis = fgos_graph::analyze_str(text).map_err(refused)?;
        Ok(serde_json::to_string(&analysis).unwrap_or_default())
    })
}

#[allow(dead_code)] // exported through N-API
#[napi(namespace = "graph", js_name = "analyze")]
pub fn analyze(input: String) -> Result<String> {
    check()?;
    Ok(analyze_text(&input)?)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_refusal_names_its_code_and_field_and_never_the_input() {
        let failure = analyze_text("SECRET-VALUE").unwrap_err();
        assert_eq!(failure.id, "input-not-object");
        assert!(!format!("{failure:?}").contains("SECRET"));
    }

    #[test]
    fn a_well_formed_input_answers_the_analysis_as_json_text() {
        let text = analyze_text(r#"{"nodes":[{"id":"a"},{"id":"b"}],"edges":[]}"#);
        let value: serde_json::Value = serde_json::from_str(&text.unwrap()).unwrap();
        assert!(value.is_object());
    }
}
