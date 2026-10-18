use super::{ExitCommand, Profile};

pub const PROFILE: Profile = Profile {
    cli: "agy",
    exit: ExitCommand::Text("/exit"),
    enter_gap_ms: 300,
    trust_markers: &["do you trust the contents of this project"],
};
