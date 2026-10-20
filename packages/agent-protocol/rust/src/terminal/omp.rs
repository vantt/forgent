use super::{ExitCommand, Profile};

/// Ctrl-D on an empty input leaves. A long paste folds into a `📄 #N`
/// attachment chip that Enter submits. No folder-trust dialog was observed.
/// The brief goes through the prompt door: a typed one is slow and a stop can
/// land mid-typing, leaving the rest in the pane shell.
pub const PROFILE: Profile = Profile {
    cli: "omp",
    exit: ExitCommand::Keys(&["C-d"]),
    enter_gap_ms: 300,
    submit_by_prompt_door: true,
    trust_markers: &[],
};
