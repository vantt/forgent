use super::{ExitCommand, Profile};

pub const PROFILE: Profile = Profile {
    cli: "agy",
    exit: ExitCommand::Text("/exit"),
    enter_gap_ms: 300,
    submit_by_prompt_door: false,
    trust_markers: &["do you trust the contents of this project"],
};
