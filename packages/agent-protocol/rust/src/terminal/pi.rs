use super::{common::has_paste_chip, ComposerState, ExitCommand, Profile};
use crate::Inspection;

/// Ctrl-D on an empty input leaves. No folder-trust dialog was observed. A
/// 4 KB typed brief takes 7 to 25 s and can lose its final Enter, so the brief
/// goes through the prompt door.
pub const PROFILE: Profile = Profile {
    cli: "pi",
    pinned_version: "1.3.0",
    version_marker: None,
    exit: ExitCommand::Keys(&["C-d"]),
    enter_gap_ms: 300,
    submit_by_prompt_door: true,
    trust_markers: &[],
    start_banners: &[],
    setup_markers: &[],
    composer_state,
};

/// A line of the rule that frames pi's composer (the top one can carry a
/// status label such as `── ⠹ Working ──`).
fn is_rule(line: &str) -> bool {
    line.trim_start().starts_with("────")
}

/// pi draws the composer between two rules, with its cwd and token footer
/// below the lower one. Text between the last two rules is the draft; fewer
/// than two rules means the composer is not on screen, which stays unknown.
fn composer_state(screen: &str, inspection: &Inspection) -> ComposerState {
    if !inspection.prompt_text.trim().is_empty() {
        // Any text the detector reads out of the composer is a draft or chip.
        return ComposerState::NotEmpty;
    }
    let lines: Vec<&str> = screen.lines().collect();
    let mut rules = lines
        .iter()
        .enumerate()
        .rev()
        .filter(|(_, line)| is_rule(line))
        .map(|(index, _)| index);
    let (Some(bottom), Some(top)) = (rules.next(), rules.next()) else {
        return ComposerState::Unknown;
    };
    let draft = lines[top + 1..bottom].join("\n");
    if has_paste_chip(&draft) || !draft.trim().is_empty() {
        ComposerState::NotEmpty
    } else {
        ComposerState::Empty
    }
}
