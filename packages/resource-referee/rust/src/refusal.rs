use std::fmt;

use crate::MAX_ENTRY_BYTES;

/// Input-derived text echoed in a refusal is cut at the entry-length limit, on a character boundary.
fn truncate(mut text: String) -> String {
    if text.len() > MAX_ENTRY_BYTES {
        let mut end = MAX_ENTRY_BYTES;
        while !text.is_char_boundary(end) {
            end -= 1;
        }
        text.truncate(end);
    }
    text
}

/// A set-level or shape refusal: it names the code, the field and the index of the first offending item.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Refusal {
    pub code: &'static str,
    pub field: String,
    pub index: Option<usize>,
}

impl Refusal {
    pub(crate) fn new(code: &'static str, field: impl Into<String>, index: Option<usize>) -> Self {
        Refusal {
            code,
            field: truncate(field.into()),
            index,
        }
    }
}

impl fmt::Display for Refusal {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self.index {
            Some(i) => write!(f, "{}: {}[{}]", self.code, self.field, i),
            None => write!(f, "{}: {}", self.code, self.field),
        }
    }
}

impl std::error::Error for Refusal {}
