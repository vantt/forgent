pub mod operations;
pub mod provider;
pub mod rules;

pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["name", "path", "check", "classify"];

pub use operations::{
    check_all, check_paths, classify, convention_name, convention_path, CheckOutcome,
    ClassifyOutcome, ConventionError, NameInput, NameOutcome, PathOutcome, Violation,
};
pub use provider::{
    ConventionOperation, ConventionProvider, ConventionRequest, CONVENTION_DESCRIPTOR,
};
pub use rules::{packaged_rules, Cardinality, Posture, Rule, RuleError, RuleSet, RuleShape};
