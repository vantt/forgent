pub mod operations;
pub mod provider;
pub mod rules;

pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["name", "path", "check", "classify"];

pub use operations::{
    check_all, check_paths, classify, classify_paths, convention_name, convention_path,
    is_valid_backlog_id, is_valid_discussion_id, CheckOutcome, ClassifyAllOutcome, ClassifyEntry,
    ClassifyOutcome, ConventionError, NameInput, NameOutcome, PathOutcome, Violation,
};
pub use provider::{
    ConventionOperation, ConventionProvider, ConventionRequest, CONVENTION_DESCRIPTOR,
};
pub use rules::{
    discussion_root, packaged_rules, Cardinality, Posture, Rule, RuleError, RuleSet, RuleShape,
};
