//! What crosses the Node boundary from a Rust entry: a value-free failure and a panic guard.
use fgos_yaml_doc::{guard::guard, model::Refusal, rule};
use serde::Serialize;

/// The refusal an entry reports: the message of the `napi::Error` is its JSON, which `door.mjs` parses.
#[derive(Debug, Default, PartialEq, Serialize)]
pub struct Failure {
    pub id: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    pub file: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub column: Option<u32>,
    /// Boxed so the common failure stays small (it is the `Err` of every entry).
    #[serde(flatten, skip_serializing_if = "Option::is_none")]
    pub more: Option<Box<More>>,
}

/// What only an entry that can refuse several things at once reports (`config`): where in the file, why, and
/// every refusal of the call when `id` names the first. Never a value of the input.
#[derive(Debug, Default, PartialEq, Serialize)]
pub struct More {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub keyword: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub refusals: Vec<Failure>,
}

/// The rule, file and position of a refusal, never a value of the input.
impl From<Refusal> for Failure {
    fn from(r: Refusal) -> Failure {
        Failure {
            id: r.rule.to_string(),
            file: r.file,
            line: r.line,
            column: r.column,
            ..Failure::default()
        }
    }
}

impl From<Failure> for napi::Error {
    fn from(f: Failure) -> napi::Error {
        napi::Error::from_reason(
            serde_json::to_string(&f).unwrap_or_else(|_| rule::YAML_INTERNAL_ERROR.into()),
        )
    }
}

/// Runs `f`; a panic in it comes back as `yaml-internal-error` and prints nothing (the parser crate's
/// guard owns the silent hook), so no entry can abort the Node process.
pub fn guarded<T>(f: impl FnOnce() -> Result<T, Failure>) -> Result<T, Failure> {
    guarded_as(rule::YAML_INTERNAL_ERROR, f)
}

/// [`guarded`] naming the panic `panic_id`, for a namespace with its own internal-error id.
pub fn guarded_as<T>(panic_id: &str, f: impl FnOnce() -> Result<T, Failure>) -> Result<T, Failure> {
    let caught = |r: Refusal| Failure {
        id: panic_id.into(),
        ..Failure::from(r)
    };
    guard(|| Ok(f())).map_err(caught)?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_panic_becomes_a_named_failure_without_its_message() {
        assert_eq!(guarded(|| Ok(7)), Ok(7));
        let failure = guarded::<()>(|| panic!("SECRET-VALUE")).unwrap_err();
        assert_eq!(failure.id, rule::YAML_INTERNAL_ERROR);
        assert!(!format!("{failure:?}").contains("SECRET"));
    }

    #[test]
    fn a_namespace_names_its_own_panic_and_lists_every_refusal() {
        let failure =
            guarded_as::<()>("config-internal-error", || panic!("SECRET-VALUE")).unwrap_err();
        assert_eq!(failure.id, "config-internal-error");
        assert!(!format!("{failure:?}").contains("SECRET"));
        let one = Failure {
            id: "a".into(),
            more: Some(Box::new(More {
                path: Some("x.y".into()),
                ..More::default()
            })),
            ..Failure::default()
        };
        let many = Failure {
            id: "a".into(),
            more: Some(Box::new(More {
                refusals: vec![one],
                ..More::default()
            })),
            ..Failure::default()
        };
        assert_eq!(
            serde_json::to_string(&many).unwrap(),
            r#"{"id":"a","refusals":[{"id":"a","path":"x.y"}]}"#
        );
    }

    #[test]
    fn a_failure_serialises_to_its_set_fields_only() {
        let text = serde_json::to_string(&Failure {
            id: "syntax-error".into(),
            file: "a.yaml".into(),
            line: Some(2),
            ..Failure::default()
        })
        .unwrap();
        assert_eq!(text, r#"{"id":"syntax-error","file":"a.yaml","line":2}"#);
    }
}
