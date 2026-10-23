//! The one refusal type of the crate. `Display` and `Debug` print the id, file, path and position,
//! never a value (spec section 9).
use std::fmt;

#[derive(Clone, PartialEq, Eq)]
pub struct ConfigRefusal {
    /// A closed id from `contracts/failure-codes.v1.json`.
    pub code: &'static str,
    /// The wrapped YAML Document refusal, when the id comes from the parser.
    pub yaml: Option<Box<fgos_yaml_doc::Refusal>>,
    pub file: Option<String>,
    pub path: Option<String>,
    pub line: Option<u32>,
    pub column: Option<u32>,
    /// JSON Schema location of the failing keyword, for `config-schema`.
    pub schema_path: Option<String>,
}

impl ConfigRefusal {
    pub fn new(code: &'static str) -> Self {
        Self {
            code,
            yaml: None,
            file: None,
            path: None,
            line: None,
            column: None,
            schema_path: None,
        }
    }

    /// A file that does not parse or breaks the profile: `config-parse` carrying the YAML refusal.
    pub fn parse(yaml: fgos_yaml_doc::Refusal) -> Self {
        Self {
            file: Some(yaml.file.clone()).filter(|file| !file.is_empty()),
            line: yaml.line,
            column: yaml.column,
            yaml: Some(Box::new(yaml)),
            ..Self::new("config-parse")
        }
    }
}

impl fmt::Display for ConfigRefusal {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.code)?;
        for (label, part) in [
            ("file", &self.file),
            ("path", &self.path),
            ("schema", &self.schema_path),
        ] {
            if let Some(part) = part {
                write!(f, " {label}={part}")?;
            }
        }
        if let (Some(line), Some(column)) = (self.line, self.column) {
            write!(f, " at {line}:{column}")?;
        }
        if let Some(yaml) = &self.yaml {
            write!(f, " ({})", yaml.rule)?;
        }
        Ok(())
    }
}

impl fmt::Debug for ConfigRefusal {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "ConfigRefusal({self})")
    }
}

impl std::error::Error for ConfigRefusal {}
