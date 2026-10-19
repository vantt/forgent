use crate::source::SecretValue;
use std::fmt;

const MASK: &str = "[redacted]";

/// Masks resolved values and the declared names in text bound for logs,
/// events and error output. A safety net, not the control: a transformed
/// value (for example base64) escapes it.
#[derive(Default)]
pub struct RedactionSet {
    names: Vec<String>,
    markers: Vec<String>,
}

impl fmt::Debug for RedactionSet {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("RedactionSet")
            .field("names", &self.names)
            .finish_non_exhaustive()
    }
}

impl RedactionSet {
    pub fn new() -> Self {
        Self::default()
    }

    /// Register a resolved secret. An empty value adds no marker, since it
    /// would match everywhere.
    pub fn add(&mut self, name: &str, value: &SecretValue) {
        if !self.names.iter().any(|n| n == name) {
            self.names.push(name.to_owned());
        }
        let marker = value.expose();
        if !marker.is_empty() && !self.markers.iter().any(|m| m == marker) {
            self.markers.push(marker.to_owned());
        }
    }

    /// Replace every marker, then every name, with a fixed mask. Longer
    /// markers go first so one containing another is masked whole.
    pub fn mask(&self, text: &str) -> String {
        let mut needles: Vec<&str> = self
            .markers
            .iter()
            .chain(self.names.iter())
            .map(String::as_str)
            .collect();
        needles.sort_by_key(|n| std::cmp::Reverse(n.len()));
        let mut out = text.to_owned();
        for needle in needles {
            out = out.replace(needle, MASK);
        }
        out
    }
}
