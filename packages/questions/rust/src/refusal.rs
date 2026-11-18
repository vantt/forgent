//! A refusal: a stable code of `packages/questions/contracts/refusals.v1.json`, what happened, and the
//! extra fields that code carries (`field` and `rule`, or `missing`).

use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Refusal {
    pub code: String,
    pub detail: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub field: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rule: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub missing: Vec<String>,
}

impl Refusal {
    pub fn new(code: impl Into<String>, detail: impl Into<String>) -> Self {
        Self {
            code: code.into(),
            detail: detail.into(),
            field: None,
            rule: None,
            missing: Vec::new(),
        }
    }

    /// `question-unclear`: a measurable shape rule is broken, named by field and rule.
    pub fn unclear(field: impl Into<String>, rule: impl Into<String>) -> Self {
        let (field, rule) = (field.into(), rule.into());
        Self {
            code: "question-unclear".into(),
            detail: format!("{field}: {rule}"),
            field: Some(field),
            rule: Some(rule),
            missing: Vec::new(),
        }
    }

    /// `parts-incomplete`: required fields are absent, or the input is not of the contract's shape.
    pub fn incomplete(detail: impl Into<String>, missing: Vec<String>) -> Self {
        Self {
            missing,
            ..Self::new("parts-incomplete", detail)
        }
    }
}

impl std::fmt::Display for Refusal {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}: {}", self.code, self.detail)
    }
}

impl std::error::Error for Refusal {}
