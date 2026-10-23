//! The one refusal type of the crate. `Display` and `Debug` print the id, file, path and position,
//! never a value (spec section 9).
use std::fmt;

/// The rarely set parts of a refusal. Never a value of the input.
#[derive(Clone, Default, PartialEq, Eq)]
pub struct Detail {
    /// The failing JSON Schema keyword and its schema location, for `config-schema`.
    pub keyword: Option<String>,
    pub schema_path: Option<String>,
    /// For a key in the wrong place: the role of the file it belongs in (`global`, `project`,
    /// `accounts`, `token`, `config`). The crate holds roles; mapping a role to a path is the caller's.
    pub belongs_in: Option<String>,
}

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
    /// What only some refusals carry, boxed once so the common refusal stays small.
    pub detail: Option<Box<Detail>>,
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
            detail: None,
        }
    }

    pub fn detail_mut(&mut self) -> &mut Detail {
        self.detail.get_or_insert_with(Box::default)
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
        let detail = self.detail.as_deref().cloned().unwrap_or_default();
        for (label, part) in [
            ("file", &self.file),
            ("path", &self.path),
            ("keyword", &detail.keyword),
            ("schema", &detail.schema_path),
            ("belongs-in", &detail.belongs_in),
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
