use super::{ExitCommand, Profile};

/// `/exit` leaves in under a second. The folder-trust dialog asks whether the
/// project is one the person created or trusts.
pub const PROFILE: Profile = Profile {
    cli: "claude",
    exit: ExitCommand::Text("/exit"),
    enter_gap_ms: 300,
    trust_markers: &["is this a project you created or one you trust"],
};
