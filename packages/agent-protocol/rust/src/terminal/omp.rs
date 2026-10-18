use super::{ExitCommand, Profile};

/// Ctrl-D on an empty input leaves. A long paste folds into a `📄 #N`
/// attachment chip that Enter submits. No folder-trust dialog was observed.
pub const PROFILE: Profile = Profile {
    cli: "omp",
    exit: ExitCommand::Keys(&["C-d"]),
    enter_gap_ms: 300,
    trust_markers: &[],
};
